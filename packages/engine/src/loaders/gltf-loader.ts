/**
 * GLTFLoader - glTF 2.0 模型加载器
 *
 * @packageDocumentation
 *
 * @remarks
 * 支持加载 .gltf 和 .glb 格式的 3D 模型。
 * 功能包括：
 * - 网格数据解析
 * - PBR 材质创建
 * - 纹理加载
 * - 场景层级构建
 * - 动画数据解析
 */

import type { IRHIDevice, IRHITexture, RHIBufferUsage } from '@maxellabs/specification';
import { RHITextureFormat, RHITextureUsage, RHITextureType } from '@maxellabs/specification';
import type { Scene } from '@maxellabs/core';
import { LocalTransform, WorldTransform, Camera, Visible, type EntityId } from '@maxellabs/core';
import { GLBParser } from './glb-parser';
import { GLTFAccessorReader } from './gltf-accessor';
import {
  type GLTFDocument,
  type GLTFLoaderConfig,
  type GLTFLoadProgress,
  type GLTFResult,
  type MeshData,
  type AnimationClip,
  type AnimationChannelData,
  type SkinData,
  GLTFComponentType,
} from './gltf-types';
import { PBRMaterial, type PBRMaterialConfig } from '../materials/PBR-material';
import { UnlitMaterial } from '../materials/unlit-material';
import { MeshInstance, MaterialInstance, Light, LightType, STANDARD_VERTEX_LAYOUT } from '../components';

/**
 * glTF 加载器
 */
export class GLTFLoader {
  private device: IRHIDevice;
  private scene: Scene;
  private config: Required<GLTFLoaderConfig>;

  constructor(device: IRHIDevice, scene: Scene, config?: GLTFLoaderConfig) {
    this.device = device;
    this.scene = scene;
    this.config = {
      loadTextures: config?.loadTextures ?? true,
      generateTangents: config?.generateTangents ?? true,
      computeBounds: config?.computeBounds ?? true,
      dracoDecoderPath: config?.dracoDecoderPath ?? '',
      ktx2TranscoderPath: config?.ktx2TranscoderPath ?? '',
    };
  }

  /**
   * 加载 glTF 文件
   * @param url 文件 URL
   * @param onProgress 进度回调
   */
  async load(url: string, onProgress?: (progress: GLTFLoadProgress) => void): Promise<GLTFResult> {
    // 1. 加载文件
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`[GLTFLoader] Failed to load ${url}: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

    // 2. 判断文件类型并解析
    let json: GLTFDocument;
    let buffers: ArrayBuffer[];

    if (GLBParser.isGLB(arrayBuffer)) {
      // GLB 格式
      const glbResult = GLBParser.parse(arrayBuffer);
      json = glbResult.json;
      buffers = glbResult.binaryBuffer ? [glbResult.binaryBuffer] : [];
    } else {
      // glTF JSON 格式
      const jsonString = new TextDecoder().decode(arrayBuffer);
      json = JSON.parse(jsonString) as GLTFDocument;
      buffers = [];
    }

    onProgress?.({ stage: 'json', loaded: 1, total: 1 });

    // 3. 加载外部缓冲区
    if (json.buffers) {
      const externalBuffers = await this.loadBuffers(json, baseUrl, buffers, onProgress);
      buffers = externalBuffers;
    }

    // 4. 解析并构建场景
    return this.parse(json, buffers, baseUrl, onProgress);
  }

  /**
   * 解析 glTF JSON
   */
  async parse(
    json: GLTFDocument,
    buffers: ArrayBuffer[],
    baseUrl: string,
    onProgress?: (progress: GLTFLoadProgress) => void
  ): Promise<GLTFResult> {
    const accessorReader = new GLTFAccessorReader(json, buffers);

    // 1. 加载纹理
    let textures = new Map<number, IRHITexture>();
    if (this.config.loadTextures && json.textures) {
      onProgress?.({ stage: 'textures', loaded: 0, total: json.textures.length });
      textures = await this.loadTextures(json, buffers, baseUrl, onProgress);
    }

    // 2. 创建材质
    onProgress?.({ stage: 'materials', loaded: 0, total: json.materials?.length ?? 0 });
    const materials = this.createMaterials(json, textures);

    // 3. 创建网格数据
    onProgress?.({ stage: 'meshes', loaded: 0, total: json.meshes?.length ?? 0 });
    const meshes = this.createMeshes(json, accessorReader, onProgress);

    // 4. 解析动画
    const animations = this.parseAnimations(json, accessorReader);

    // 5. 解析骨骼
    const skins = this.parseSkins(json, accessorReader);

    // 6. 构建场景
    onProgress?.({ stage: 'scene', loaded: 0, total: 1 });
    const sceneResult = this.buildScene(json, meshes, materials);

    return {
      scene: sceneResult.defaultScene,
      scenes: sceneResult.scenes,
      meshes,
      materials,
      textures,
      animations,
      cameras: sceneResult.cameras,
      lights: sceneResult.lights,
      skins,
      json,
      nodeEntityMap: sceneResult.nodeEntityMap,
    };
  }

  /**
   * 加载外部缓冲区
   */
  private async loadBuffers(
    json: GLTFDocument,
    baseUrl: string,
    existingBuffers: ArrayBuffer[],
    onProgress?: (progress: GLTFLoadProgress) => void
  ): Promise<ArrayBuffer[]> {
    const buffers: ArrayBuffer[] = [...existingBuffers];
    const gltfBuffers = json.buffers ?? [];

    for (let i = 0; i < gltfBuffers.length; i++) {
      const buffer = gltfBuffers[i];

      // 如果已经有这个缓冲区（来自 GLB），跳过
      if (buffers[i]) {
        continue;
      }

      if (buffer.uri) {
        if (buffer.uri.startsWith('data:')) {
          // Data URI
          const base64 = buffer.uri.split(',')[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let j = 0; j < binary.length; j++) {
            bytes[j] = binary.charCodeAt(j);
          }
          buffers[i] = bytes.buffer;
        } else {
          // 外部文件
          const bufferUrl = this.resolveUrl(baseUrl, buffer.uri);
          const response = await fetch(bufferUrl);
          buffers[i] = await response.arrayBuffer();
        }
      }

      onProgress?.({ stage: 'buffers', loaded: i + 1, total: gltfBuffers.length });
    }

    return buffers;
  }

  /**
   * 加载纹理
   */
  private async loadTextures(
    json: GLTFDocument,
    buffers: ArrayBuffer[],
    baseUrl: string,
    onProgress?: (progress: GLTFLoadProgress) => void
  ): Promise<Map<number, IRHITexture>> {
    const textureMap = new Map<number, IRHITexture>();
    const gltfTextures = json.textures ?? [];
    const gltfImages = json.images ?? [];

    for (let i = 0; i < gltfTextures.length; i++) {
      const gltfTexture = gltfTextures[i];
      if (gltfTexture.source === undefined) {
        continue;
      }

      const image = gltfImages[gltfTexture.source];
      if (!image) {
        continue;
      }

      try {
        let imageData: ImageData | HTMLImageElement;

        if (image.uri) {
          if (image.uri.startsWith('data:')) {
            // Data URI
            imageData = await this.loadImageFromDataUri(image.uri);
          } else {
            // 外部文件
            const imageUrl = this.resolveUrl(baseUrl, image.uri);
            imageData = await this.loadImageFromUrl(imageUrl);
          }
        } else if (image.bufferView !== undefined) {
          // 嵌入式图像
          const bufferView = json.bufferViews?.[image.bufferView];
          if (bufferView) {
            const buffer = buffers[bufferView.buffer];
            const data = new Uint8Array(buffer, bufferView.byteOffset ?? 0, bufferView.byteLength);
            imageData = await this.loadImageFromBuffer(data, image.mimeType ?? 'image/png');
          } else {
            continue;
          }
        } else {
          continue;
        }

        // 创建 RHI 纹理
        const texture = this.createTextureFromImage(imageData, gltfTexture, json);
        textureMap.set(i, texture);
      } catch (error) {
        console.warn(`[GLTFLoader] Failed to load texture ${i}:`, error);
      }

      onProgress?.({ stage: 'textures', loaded: i + 1, total: gltfTextures.length });
    }

    return textureMap;
  }

  /**
   * 从 URL 加载图像
   */
  private loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  /**
   * 从 Data URI 加载图像
   */
  private loadImageFromDataUri(dataUri: string): Promise<HTMLImageElement> {
    return this.loadImageFromUrl(dataUri);
  }

  /**
   * 从缓冲区加载图像
   */
  private loadImageFromBuffer(data: Uint8Array, mimeType: string): Promise<HTMLImageElement> {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    return this.loadImageFromUrl(url).finally(() => URL.revokeObjectURL(url));
  }

  /**
   * 从图像创建纹理
   *
   * @remarks
   * 当前实现创建空纹理，纹理数据上传需要通过 RHI 的 writeTexture 或 queue.writeTexture 方法。
   * 由于 IRHITexture 接口目前不包含 writeTexture 方法，纹理数据上传将在后续版本中实现。
   *
   * TODO: 实现纹理数据上传
   * - 方案1: 扩展 IRHIDevice 添加 writeTexture 方法
   * - 方案2: 使用 WebGL 直接上传（需要访问底层 GL context）
   */
  private createTextureFromImage(
    image: ImageData | HTMLImageElement,
    _gltfTexture: { sampler?: number },
    _json: GLTFDocument
  ): IRHITexture {
    // 获取图像尺寸
    const width = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
    const height = image instanceof HTMLImageElement ? image.naturalHeight : image.height;

    // 创建纹理（不带初始数据）
    // 注意：当前 RHI 接口不支持纹理数据上传，纹理将为空
    const texture = this.device.createTexture({
      width,
      height,
      format: RHITextureFormat.RGBA8_UNORM,
      usage: RHITextureUsage.TEXTURE_BINDING,
      dimension: RHITextureType.TEXTURE_2D,
      label: 'GLTFTexture',
    });

    // TODO: 实现纹理数据上传
    // 当前 IRHITexture 接口不包含 writeTexture 方法
    // 需要扩展 RHI 接口或使用平台特定的上传方法

    return texture;
  }

  /**
   * 创建材质
   */
  private createMaterials(json: GLTFDocument, textures: Map<number, IRHITexture>): Map<number, PBRMaterial> {
    const materialMap = new Map<number, PBRMaterial>();
    const gltfMaterials = json.materials ?? [];

    for (let i = 0; i < gltfMaterials.length; i++) {
      const gltfMaterial = gltfMaterials[i];

      // 检查是否为 Unlit 材质
      const isUnlit = gltfMaterial.extensions?.KHR_materials_unlit !== undefined;

      if (isUnlit) {
        // 创建 Unlit 材质
        const baseColor = gltfMaterial.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1, 1];
        const unlitMaterial = new UnlitMaterial(this.device, {
          color: baseColor as [number, number, number, number],
        });
        // 存储为 PBRMaterial 类型（兼容性）
        materialMap.set(i, unlitMaterial as unknown as PBRMaterial);
      } else {
        // 创建 PBR 材质
        const config: PBRMaterialConfig = {
          baseColor: [1, 1, 1, 1],
          metallic: 1,
          roughness: 1,
        };

        const pbr = gltfMaterial.pbrMetallicRoughness;
        if (pbr) {
          if (pbr.baseColorFactor) {
            config.baseColor = pbr.baseColorFactor as [number, number, number, number];
          }
          if (pbr.metallicFactor !== undefined) {
            config.metallic = pbr.metallicFactor;
          }
          if (pbr.roughnessFactor !== undefined) {
            config.roughness = pbr.roughnessFactor;
          }
          // TODO: 纹理支持
        }

        const material = new PBRMaterial(this.device, config);
        materialMap.set(i, material);
      }
    }

    return materialMap;
  }

  /**
   * 创建网格数据
   */
  private createMeshes(
    json: GLTFDocument,
    accessorReader: GLTFAccessorReader,
    onProgress?: (progress: GLTFLoadProgress) => void
  ): Map<number, MeshData[]> {
    const meshMap = new Map<number, MeshData[]>();
    const gltfMeshes = json.meshes ?? [];

    for (let meshIndex = 0; meshIndex < gltfMeshes.length; meshIndex++) {
      const mesh = gltfMeshes[meshIndex];
      const primitives: MeshData[] = [];

      for (const primitive of mesh.primitives) {
        const meshData: MeshData = {
          positions: new Float32Array(0),
        };

        // 读取顶点属性
        if (primitive.attributes.POSITION !== undefined) {
          meshData.positions = accessorReader.readAccessorAsFloat32(primitive.attributes.POSITION);
        }

        if (primitive.attributes.NORMAL !== undefined) {
          meshData.normals = accessorReader.readAccessorAsFloat32(primitive.attributes.NORMAL);
        }

        if (primitive.attributes.TEXCOORD_0 !== undefined) {
          meshData.uvs = accessorReader.readAccessorAsFloat32(primitive.attributes.TEXCOORD_0);
        }

        if (primitive.attributes.TEXCOORD_1 !== undefined) {
          meshData.uvs2 = accessorReader.readAccessorAsFloat32(primitive.attributes.TEXCOORD_1);
        }

        if (primitive.attributes.COLOR_0 !== undefined) {
          meshData.colors = accessorReader.readAccessorAsFloat32(primitive.attributes.COLOR_0);
        }

        if (primitive.attributes.TANGENT !== undefined) {
          meshData.tangents = accessorReader.readAccessorAsFloat32(primitive.attributes.TANGENT);
        }

        if (primitive.attributes.JOINTS_0 !== undefined) {
          meshData.joints = accessorReader.readAccessorAsUint16(primitive.attributes.JOINTS_0);
        }

        if (primitive.attributes.WEIGHTS_0 !== undefined) {
          meshData.weights = accessorReader.readAccessorAsFloat32(primitive.attributes.WEIGHTS_0);
        }

        // 读取索引
        if (primitive.indices !== undefined) {
          const accessor = json.accessors?.[primitive.indices];
          if (accessor) {
            if (accessor.componentType === GLTFComponentType.UNSIGNED_INT) {
              meshData.indices = accessorReader.readAccessorAsUint32(primitive.indices);
            } else {
              meshData.indices = accessorReader.readAccessorAsUint16(primitive.indices);
            }
          }
        }

        // 材质索引
        meshData.materialIndex = primitive.material;

        primitives.push(meshData);
      }

      meshMap.set(meshIndex, primitives);
      onProgress?.({ stage: 'meshes', loaded: meshIndex + 1, total: gltfMeshes.length });
    }

    return meshMap;
  }

  /**
   * 解析动画
   */
  private parseAnimations(json: GLTFDocument, accessorReader: GLTFAccessorReader): AnimationClip[] {
    const animations: AnimationClip[] = [];
    const gltfAnimations = json.animations ?? [];

    for (const gltfAnimation of gltfAnimations) {
      const channels: AnimationChannelData[] = [];
      let duration = 0;

      for (const channel of gltfAnimation.channels) {
        const sampler = gltfAnimation.samplers[channel.sampler];
        const input = accessorReader.readAccessorAsFloat32(sampler.input);
        const output = accessorReader.readAccessorAsFloat32(sampler.output);

        // 更新持续时间
        const maxTime = input[input.length - 1];
        if (maxTime > duration) {
          duration = maxTime;
        }

        channels.push({
          targetNode: channel.target.node ?? 0,
          targetPath: channel.target.path,
          sampler: {
            input,
            output,
            interpolation: sampler.interpolation ?? 'LINEAR',
          },
        });
      }

      animations.push({
        name: gltfAnimation.name ?? `Animation_${animations.length}`,
        duration,
        channels,
      });
    }

    return animations;
  }

  /**
   * 解析骨骼
   */
  private parseSkins(json: GLTFDocument, accessorReader: GLTFAccessorReader): SkinData[] {
    const skins: SkinData[] = [];
    const gltfSkins = json.skins ?? [];

    for (const gltfSkin of gltfSkins) {
      const skinData: SkinData = {
        name: gltfSkin.name,
        joints: gltfSkin.joints,
        skeleton: gltfSkin.skeleton,
      };

      if (gltfSkin.inverseBindMatrices !== undefined) {
        skinData.inverseBindMatrices = accessorReader.readAccessorAsFloat32(gltfSkin.inverseBindMatrices);
      }

      skins.push(skinData);
    }

    return skins;
  }

  /**
   * 构建场景
   */
  private buildScene(
    json: GLTFDocument,
    meshes: Map<number, MeshData[]>,
    materials: Map<number, PBRMaterial>
  ): {
    defaultScene: EntityId;
    scenes: EntityId[];
    cameras: EntityId[];
    lights: EntityId[];
    nodeEntityMap: Map<number, EntityId>;
  } {
    const nodeEntityMap = new Map<number, EntityId>();
    const cameras: EntityId[] = [];
    const lights: EntityId[] = [];
    const scenes: EntityId[] = [];

    // 1. 创建所有节点实体
    const gltfNodes = json.nodes ?? [];
    for (let nodeIndex = 0; nodeIndex < gltfNodes.length; nodeIndex++) {
      const node = gltfNodes[nodeIndex];
      const entity = this.scene.createEntity(node.name ?? `Node_${nodeIndex}`);
      nodeEntityMap.set(nodeIndex, entity);

      // 添加 Transform 组件
      const transform = this.createTransformFromNode(node);
      this.scene.world.addComponent(entity, LocalTransform, transform);
      this.scene.world.addComponent(
        entity,
        WorldTransform,
        WorldTransform.fromData({
          position: transform.position,
          rotation: transform.rotation,
          scale: transform.scale,
        })
      );

      // 添加 Mesh 组件
      if (node.mesh !== undefined) {
        const meshDataList = meshes.get(node.mesh);
        if (meshDataList && meshDataList.length > 0) {
          // 使用第一个 primitive
          const meshData = meshDataList[0];
          const materialIndex = meshData.materialIndex ?? 0;
          const material = materials.get(materialIndex);

          // 创建 MeshInstance
          const meshInstance = this.createMeshInstance(meshData);
          this.scene.world.addComponent(entity, MeshInstance, meshInstance);

          // 创建 MaterialInstance
          const materialInstance = new MaterialInstance();
          materialInstance.material = material ?? null;
          this.scene.world.addComponent(entity, MaterialInstance, materialInstance);

          // 添加 Visible 组件
          const visible = new Visible();
          visible.value = true;
          this.scene.world.addComponent(entity, Visible, visible);
        }
      }

      // 添加 Camera 组件
      if (node.camera !== undefined) {
        const gltfCamera = json.cameras?.[node.camera];
        if (gltfCamera) {
          const camera = this.createCameraFromGLTF(gltfCamera);
          this.scene.world.addComponent(entity, Camera, camera);
          cameras.push(entity);
        }
      }

      // 添加 Light 组件 (KHR_lights_punctual)
      if (node.extensions?.KHR_lights_punctual) {
        const lightIndex = node.extensions.KHR_lights_punctual.light;
        const lightsExtension = json.extensions?.KHR_lights_punctual as
          | {
              lights?: Array<{
                type: string;
                color?: [number, number, number];
                intensity?: number;
                range?: number;
                spot?: { innerConeAngle?: number; outerConeAngle?: number };
              }>;
            }
          | undefined;
        const gltfLight = lightsExtension?.lights?.[lightIndex];
        if (gltfLight) {
          const light = this.createLightFromGLTF(gltfLight);
          this.scene.world.addComponent(entity, Light, light);
          lights.push(entity);
        }
      }
    }

    // 2. 建立父子关系
    for (let nodeIndex = 0; nodeIndex < gltfNodes.length; nodeIndex++) {
      const node = gltfNodes[nodeIndex];
      if (node.children) {
        const parentEntity = nodeEntityMap.get(nodeIndex)!;
        for (const childIndex of node.children) {
          const childEntity = nodeEntityMap.get(childIndex)!;
          this.scene.setParent(childEntity, parentEntity);
        }
      }
    }

    // 3. 创建场景根节点
    const gltfScenes = json.scenes ?? [];
    for (let sceneIndex = 0; sceneIndex < gltfScenes.length; sceneIndex++) {
      const gltfScene = gltfScenes[sceneIndex];
      const sceneRoot = this.scene.createEntity(gltfScene.name ?? `Scene_${sceneIndex}`);

      // 添加 Transform
      this.scene.world.addComponent(
        sceneRoot,
        LocalTransform,
        LocalTransform.fromData({
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        })
      );
      this.scene.world.addComponent(
        sceneRoot,
        WorldTransform,
        WorldTransform.fromData({
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        })
      );

      // 设置根节点的子节点
      if (gltfScene.nodes) {
        for (const nodeIndex of gltfScene.nodes) {
          const nodeEntity = nodeEntityMap.get(nodeIndex)!;
          this.scene.setParent(nodeEntity, sceneRoot);
        }
      }

      scenes.push(sceneRoot);
    }

    // 4. 确定默认场景
    const defaultSceneIndex = json.scene ?? 0;
    const defaultScene = scenes[defaultSceneIndex] ?? scenes[0] ?? this.scene.createEntity('EmptyScene');

    return { defaultScene, scenes, cameras, lights, nodeEntityMap };
  }

  /**
   * 从 glTF 节点创建 Transform
   */
  private createTransformFromNode(node: {
    matrix?: number[];
    translation?: [number, number, number];
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
  }): LocalTransform {
    if (node.matrix) {
      // 从矩阵分解 TRS
      const { translation, rotation, scale } = this.decomposeMatrix(node.matrix);
      return LocalTransform.fromData({
        position: { x: translation[0], y: translation[1], z: translation[2] },
        rotation: { x: rotation[0], y: rotation[1], z: rotation[2], w: rotation[3] },
        scale: { x: scale[0], y: scale[1], z: scale[2] },
      });
    } else {
      return LocalTransform.fromData({
        position: node.translation
          ? { x: node.translation[0], y: node.translation[1], z: node.translation[2] }
          : { x: 0, y: 0, z: 0 },
        rotation: node.rotation
          ? { x: node.rotation[0], y: node.rotation[1], z: node.rotation[2], w: node.rotation[3] }
          : { x: 0, y: 0, z: 0, w: 1 },
        scale: node.scale ? { x: node.scale[0], y: node.scale[1], z: node.scale[2] } : { x: 1, y: 1, z: 1 },
      });
    }
  }

  /**
   * 分解矩阵为 TRS
   */
  private decomposeMatrix(matrix: number[]): {
    translation: [number, number, number];
    rotation: [number, number, number, number];
    scale: [number, number, number];
  } {
    // glTF 使用列主序矩阵
    // 提取平移
    const translation: [number, number, number] = [matrix[12], matrix[13], matrix[14]];

    // 提取缩放
    const sx = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1] + matrix[2] * matrix[2]);
    const sy = Math.sqrt(matrix[4] * matrix[4] + matrix[5] * matrix[5] + matrix[6] * matrix[6]);
    const sz = Math.sqrt(matrix[8] * matrix[8] + matrix[9] * matrix[9] + matrix[10] * matrix[10]);
    const scale: [number, number, number] = [sx, sy, sz];

    // 提取旋转矩阵（去除缩放）
    const m00 = matrix[0] / sx,
      m01 = matrix[4] / sy,
      m02 = matrix[8] / sz;
    const m10 = matrix[1] / sx,
      m11 = matrix[5] / sy,
      m12 = matrix[9] / sz;
    const m20 = matrix[2] / sx,
      m21 = matrix[6] / sy,
      m22 = matrix[10] / sz;

    // 从旋转矩阵提取四元数
    const trace = m00 + m11 + m22;
    let qw: number, qx: number, qy: number, qz: number;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);
      qw = 0.25 / s;
      qx = (m21 - m12) * s;
      qy = (m02 - m20) * s;
      qz = (m10 - m01) * s;
    } else if (m00 > m11 && m00 > m22) {
      const s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22);
      qw = (m21 - m12) / s;
      qx = 0.25 * s;
      qy = (m01 + m10) / s;
      qz = (m02 + m20) / s;
    } else if (m11 > m22) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22);
      qw = (m02 - m20) / s;
      qx = (m01 + m10) / s;
      qy = 0.25 * s;
      qz = (m12 + m21) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11);
      qw = (m10 - m01) / s;
      qx = (m02 + m20) / s;
      qy = (m12 + m21) / s;
      qz = 0.25 * s;
    }

    const rotation: [number, number, number, number] = [qx, qy, qz, qw];

    return { translation, rotation, scale };
  }

  /**
   * 创建 MeshInstance
   */
  private createMeshInstance(meshData: MeshData): MeshInstance {
    const meshInstance = new MeshInstance();

    // 构建交错顶点数据
    const vertexData = this.buildInterleavedVertexData(meshData);
    const vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: 'vertex' as RHIBufferUsage,
      initialData: vertexData as BufferSource,
      label: 'GLTFVertexBuffer',
    });

    meshInstance.vertexBuffer = vertexBuffer;
    meshInstance.vertexCount = meshData.positions.length / 3;
    meshInstance.vertexLayout = STANDARD_VERTEX_LAYOUT;

    // 创建索引缓冲区
    if (meshData.indices && meshData.indices.length > 0) {
      const indexBuffer = this.device.createBuffer({
        size: meshData.indices.byteLength,
        usage: 'index' as RHIBufferUsage,
        initialData: meshData.indices,
        label: 'GLTFIndexBuffer',
      });
      meshInstance.indexBuffer = indexBuffer;
      meshInstance.indexCount = meshData.indices.length;
    }

    // 计算包围盒
    if (this.config.computeBounds) {
      meshInstance.setLocalBoundsFromPositions(meshData.positions);
    }

    return meshInstance;
  }

  /**
   * 构建交错顶点数据
   */
  private buildInterleavedVertexData(meshData: MeshData): Float32Array {
    const vertexCount = meshData.positions.length / 3;
    const floatsPerVertex = 8; // 3 (pos) + 3 (normal) + 2 (uv)
    const data = new Float32Array(vertexCount * floatsPerVertex);

    for (let i = 0; i < vertexCount; i++) {
      const offset = i * floatsPerVertex;

      // Position (3 floats)
      data[offset + 0] = meshData.positions[i * 3 + 0];
      data[offset + 1] = meshData.positions[i * 3 + 1];
      data[offset + 2] = meshData.positions[i * 3 + 2];

      // Normal (3 floats)
      if (meshData.normals) {
        data[offset + 3] = meshData.normals[i * 3 + 0];
        data[offset + 4] = meshData.normals[i * 3 + 1];
        data[offset + 5] = meshData.normals[i * 3 + 2];
      } else {
        data[offset + 3] = 0;
        data[offset + 4] = 1;
        data[offset + 5] = 0;
      }

      // UV (2 floats)
      if (meshData.uvs) {
        data[offset + 6] = meshData.uvs[i * 2 + 0];
        data[offset + 7] = meshData.uvs[i * 2 + 1];
      } else {
        data[offset + 6] = 0;
        data[offset + 7] = 0;
      }
    }

    return data;
  }

  /**
   * 从 glTF 相机创建 Camera 组件
   */
  private createCameraFromGLTF(gltfCamera: {
    type: 'perspective' | 'orthographic';
    perspective?: { aspectRatio?: number; yfov: number; zfar?: number; znear: number };
    orthographic?: { xmag: number; ymag: number; zfar: number; znear: number };
  }): Camera {
    const camera = new Camera();

    if (gltfCamera.type === 'perspective' && gltfCamera.perspective) {
      const p = gltfCamera.perspective;
      const fovDegrees = (p.yfov * 180) / Math.PI;
      camera.setPerspective(fovDegrees, p.aspectRatio ?? 1, p.znear, p.zfar ?? 1000);
    } else if (gltfCamera.type === 'orthographic' && gltfCamera.orthographic) {
      const o = gltfCamera.orthographic;
      // setOrthographic(size, aspect, near, far)
      // glTF orthographic uses xmag/ymag as half-width/half-height
      const aspect = o.xmag / o.ymag;
      camera.setOrthographic(o.ymag, aspect, o.znear, o.zfar);
    }

    return camera;
  }

  /**
   * 从 glTF 光源创建 Light 组件
   */
  private createLightFromGLTF(gltfLight: {
    type: string;
    color?: [number, number, number];
    intensity?: number;
    range?: number;
    spot?: { innerConeAngle?: number; outerConeAngle?: number };
  }): Light {
    let lightType: LightType;
    switch (gltfLight.type) {
      case 'directional':
        lightType = LightType.DIRECTIONAL;
        break;
      case 'point':
        lightType = LightType.POINT;
        break;
      case 'spot':
        lightType = LightType.SPOT;
        break;
      default:
        lightType = LightType.POINT;
    }

    return Light.fromData({
      lightType,
      color: gltfLight.color ?? [1, 1, 1],
      intensity: gltfLight.intensity ?? 1,
      range: gltfLight.range ?? 10,
      innerAngle: gltfLight.spot?.innerConeAngle ?? Math.PI / 6,
      outerAngle: gltfLight.spot?.outerConeAngle ?? Math.PI / 4,
    });
  }

  /**
   * 解析 URL
   */
  private resolveUrl(baseUrl: string, uri: string): string {
    if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:')) {
      return uri;
    }
    return baseUrl + uri;
  }

  /**
   * 释放资源
   */
  dispose(): void {
    // 清理资源
  }
}
