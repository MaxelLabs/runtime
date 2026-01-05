/**
 * SimpleWebGLRenderer - 基于 RHI 封装的简化渲染器
 *
 * @packageDocumentation
 *
 * @remarks
 * 这是一个使用 RHI 抽象接口的渲染器实现。
 * 所有 WebGL 操作都通过 RHI 的 CommandEncoder、RenderPass、Pipeline 接口进行。
 *
 * ## 设计目标
 * - 使用 RHI 封装，不直接调用 WebGL API
 * - 支持 MeshInstance + MaterialInstance 组件
 * - 提供基础的 PBR 光照
 */

import type { World } from '@maxellabs/core';
import { MSpec, Camera, CameraTarget, WorldTransform } from '@maxellabs/core';
import { Renderer, type RendererConfig, type RenderContext } from '@maxellabs/core';
import { MeshInstance, MaterialInstance } from '../components';
import { PBRMaterial } from '../materials/PBR-material';
import { UnlitMaterial } from '../materials/unlit-material';
import type { Vector3Like, QuaternionLike } from '@maxellabs/specification';
import {
  BASIC_VERTEX_SHADER_300,
  BASIC_FRAGMENT_SHADER_300,
  BASIC_VERTEX_SHADER_100,
  BASIC_FRAGMENT_SHADER_100,
} from './shaders';

/**
 * SimpleWebGLRenderer 配置
 */
export interface SimpleWebGLRendererConfig extends RendererConfig {
  /** 背景颜色 */
  backgroundColor?: [number, number, number, number];
}

/**
 * std140 布局的矩阵 UBO 大小
 * 4 个 mat4 = 4 * 64 = 256 bytes
 */
const MATRICES_UBO_SIZE = 256;

/**
 * std140 布局的材质 UBO 大小
 * baseColor(16) + metallic(4) + roughness(4) + pad(8) +
 * lightDir(12) + pad(4) + lightColor(12) + pad(4) +
 * cameraPos(12) + pad(4) = 80 bytes
 */
const MATERIAL_UBO_SIZE = 80;

/**
 * SimpleWebGLRenderer - 基于 RHI 封装的简化渲染器
 */
export class SimpleWebGLRenderer extends Renderer {
  /** RHI 设备 */
  private rhiDevice: MSpec.IRHIDevice;

  /** 是否为 WebGL2 */
  private isWebGL2: boolean;

  /** 渲染管线 */
  private renderPipeline: MSpec.IRHIRenderPipeline | null = null;

  /** 着色器模块 */
  private vertexShader: MSpec.IRHIShaderModule | null = null;
  private fragmentShader: MSpec.IRHIShaderModule | null = null;

  /** 管线布局 */
  private pipelineLayout: MSpec.IRHIPipelineLayout | null = null;

  /** 绑定组布局 */
  private matricesBindGroupLayout: MSpec.IRHIBindGroupLayout | null = null;
  private materialBindGroupLayout: MSpec.IRHIBindGroupLayout | null = null;

  /** Uniform 缓冲区 */
  private matricesBuffer: MSpec.IRHIBuffer | null = null;
  private materialBuffer: MSpec.IRHIBuffer | null = null;

  /** 绑定组 */
  private matricesBindGroup: MSpec.IRHIBindGroup | null = null;
  private materialBindGroup: MSpec.IRHIBindGroup | null = null;

  /** 背景颜色 */
  private backgroundColor: [number, number, number, number];

  /** 渲染目标纹理 */
  private colorTexture: MSpec.IRHITexture | null = null;
  private depthTexture: MSpec.IRHITexture | null = null;

  /** Canvas 尺寸 */
  private canvasWidth = 0;
  private canvasHeight = 0;

  /**
   * 创建 SimpleWebGLRenderer
   */
  constructor(config: SimpleWebGLRendererConfig) {
    super(config);

    this.rhiDevice = config.device as MSpec.IRHIDevice;
    this.isWebGL2 = this.rhiDevice.info.backend === MSpec.RHIBackend.WebGL2;
    this.backgroundColor = config.backgroundColor ?? [0.1, 0.1, 0.15, 1.0];

    // 初始化 RHI 资源
    this.initRHIResources();
  }

  /**
   * 初始化 RHI 资源
   */
  private initRHIResources(): void {
    // 1. 创建着色器模块
    this.createShaderModules();

    // 2. 创建 Uniform 缓冲区
    this.createUniformBuffers();

    // 3. 创建绑定组布局和管线布局
    this.createBindGroupLayouts();

    // 4. 创建绑定组
    this.createBindGroups();

    // 5. 创建渲染管线
    this.createRenderPipeline();

    console.info('[SimpleWebGLRenderer] RHI resources initialized');
  }

  /**
   * 创建着色器模块
   */
  private createShaderModules(): void {
    const vertexSource = this.isWebGL2 ? BASIC_VERTEX_SHADER_300 : BASIC_VERTEX_SHADER_100;
    const fragmentSource = this.isWebGL2 ? BASIC_FRAGMENT_SHADER_300 : BASIC_FRAGMENT_SHADER_100;

    this.vertexShader = this.rhiDevice.createShaderModule({
      code: vertexSource,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.VERTEX,
      label: 'BasicVertexShader',
    });

    this.fragmentShader = this.rhiDevice.createShaderModule({
      code: fragmentSource,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.FRAGMENT,
      label: 'BasicFragmentShader',
    });

    console.info('[SimpleWebGLRenderer] Shader modules created');
  }

  /**
   * 创建 Uniform 缓冲区
   */
  private createUniformBuffers(): void {
    // 矩阵 UBO (binding 0): modelMatrix, viewMatrix, projectionMatrix, normalMatrix
    this.matricesBuffer = this.rhiDevice.createBuffer({
      size: MATRICES_UBO_SIZE,
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: 'MatricesUBO',
    });

    // 材质 UBO (binding 1): baseColor, metallic, roughness, lightDir, lightColor, cameraPos
    this.materialBuffer = this.rhiDevice.createBuffer({
      size: MATERIAL_UBO_SIZE,
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: 'MaterialUBO',
    });

    console.info('[SimpleWebGLRenderer] Uniform buffers created');
  }

  /**
   * 创建绑定组布局
   */
  private createBindGroupLayouts(): void {
    // 矩阵绑定组布局 (group 0)
    // 注意：name 字段必须与着色器中的 uniform block 名称完全匹配
    // 注意：binding 值决定了 UBO 的 binding point，必须唯一
    this.matricesBindGroupLayout = this.rhiDevice.createBindGroupLayout(
      [
        {
          binding: 0, // UBO binding point 0
          visibility: MSpec.RHIShaderStage.VERTEX,
          buffer: { type: 'uniform' },
          name: 'Matrices', // 必须匹配着色器中的 uniform block 名称
        } as MSpec.IRHIBindGroupLayoutEntry & { name: string },
      ],
      'MatricesBindGroupLayout'
    );

    // 材质绑定组布局 (group 1)
    // 重要：使用 binding: 1 来避免与矩阵 UBO 冲突
    this.materialBindGroupLayout = this.rhiDevice.createBindGroupLayout(
      [
        {
          binding: 1, // UBO binding point 1 (不同于矩阵的 0)
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
          name: 'Material', // 必须匹配着色器中的 uniform block 名称
        } as MSpec.IRHIBindGroupLayoutEntry & { name: string },
      ],
      'MaterialBindGroupLayout'
    );

    // 管线布局
    this.pipelineLayout = this.rhiDevice.createPipelineLayout(
      [this.matricesBindGroupLayout, this.materialBindGroupLayout],
      'BasicPipelineLayout'
    );

    console.info('[SimpleWebGLRenderer] Bind group layouts created');
  }

  /**
   * 创建绑定组
   */
  private createBindGroups(): void {
    if (!this.matricesBindGroupLayout || !this.materialBindGroupLayout) {
      throw new Error('[SimpleWebGLRenderer] Bind group layouts not initialized');
    }

    // 矩阵绑定组 (binding point 0)
    this.matricesBindGroup = this.rhiDevice.createBindGroup(
      this.matricesBindGroupLayout,
      [
        {
          binding: 0, // 与 layout 中的 binding 保持一致
          resource: { buffer: this.matricesBuffer!, offset: 0, size: MATRICES_UBO_SIZE },
        },
      ],
      'MatricesBindGroup'
    );

    // 材质绑定组 (binding point 1)
    this.materialBindGroup = this.rhiDevice.createBindGroup(
      this.materialBindGroupLayout,
      [
        {
          binding: 1, // 与 layout 中的 binding 保持一致
          resource: { buffer: this.materialBuffer!, offset: 0, size: MATERIAL_UBO_SIZE },
        },
      ],
      'MaterialBindGroup'
    );

    console.info('[SimpleWebGLRenderer] Bind groups created');
  }

  /**
   * 创建渲染管线
   */
  private createRenderPipeline(): void {
    if (!this.vertexShader || !this.fragmentShader || !this.pipelineLayout) {
      throw new Error('[SimpleWebGLRenderer] Shader modules or pipeline layout not initialized');
    }

    this.renderPipeline = this.rhiDevice.createRenderPipeline({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      vertexLayout: {
        buffers: [
          {
            index: 0,
            stride: 32, // 8 floats * 4 bytes (pos + normal + uv)
            stepMode: MSpec.RHIVertexStepMode.VERTEX,
            attributes: [
              {
                name: 'a_position',
                format: MSpec.RHIVertexFormat.FLOAT32x3,
                offset: 0,
                shaderLocation: 0,
              },
              {
                name: 'a_normal',
                format: MSpec.RHIVertexFormat.FLOAT32x3,
                offset: 12,
                shaderLocation: 1,
              },
              {
                name: 'a_uv',
                format: MSpec.RHIVertexFormat.FLOAT32x2,
                offset: 24,
                shaderLocation: 2,
              },
            ],
          },
        ],
      },
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      rasterizationState: {
        frontFace: MSpec.RHIFrontFace.CCW,
        cullMode: MSpec.RHICullMode.BACK,
        depthBias: 0,
        depthBiasSlopeScale: 0,
      },
      depthStencilState: {
        format: MSpec.RHITextureFormat.DEPTH24_UNORM,
        depthWriteEnabled: true,
        depthCompare: MSpec.RHICompareFunction.LESS,
      },
      layout: this.pipelineLayout,
      label: 'BasicRenderPipeline',
    });

    console.info('[SimpleWebGLRenderer] Render pipeline created');
  }

  /**
   * 确保渲染目标尺寸正确
   */
  private ensureRenderTargets(width: number, height: number): void {
    if (this.canvasWidth === width && this.canvasHeight === height) {
      return;
    }

    // 销毁旧的渲染目标
    this.colorTexture?.destroy();
    this.depthTexture?.destroy();

    // 创建颜色附件
    this.colorTexture = this.rhiDevice.createTexture({
      width,
      height,
      format: MSpec.RHITextureFormat.RGBA8_UNORM,
      usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
      dimension: MSpec.RHITextureType.TEXTURE_2D,
      label: 'ColorTarget',
    });

    // 创建深度附件
    this.depthTexture = this.rhiDevice.createTexture({
      width,
      height,
      format: MSpec.RHITextureFormat.DEPTH24_UNORM,
      usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
      dimension: MSpec.RHITextureType.TEXTURE_2D,
      label: 'DepthTarget',
    });

    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /**
   * 开始帧渲染
   */
  override beginFrame(): void {
    super.beginFrame();
  }

  /**
   * 结束帧渲染
   */
  override endFrame(): void {
    super.endFrame();
  }

  /**
   * 主渲染方法
   */
  protected override render(ctx: RenderContext): void {
    if (!this.renderPipeline) {
      console.warn('[SimpleWebGLRenderer] Render pipeline not initialized');
      return;
    }

    // 获取画布尺寸
    const gl = (this.rhiDevice as any).getGL() as WebGLRenderingContext;
    const canvas = gl.canvas as HTMLCanvasElement;
    const width = canvas.width;
    const height = canvas.height;

    // 确保渲染目标
    this.ensureRenderTargets(width, height);

    if (!this.colorTexture || !this.depthTexture) {
      return;
    }

    // 创建命令编码器
    const commandEncoder = this.rhiDevice.createCommandEncoder('RenderFrame');

    // 创建纹理视图
    const colorView = this.colorTexture.createView();
    const depthView = this.depthTexture.createView();

    // 开始渲染通道
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: colorView,
          loadOp: 'clear',
          storeOp: 'store',
          clearColor: this.backgroundColor,
        },
      ],
      depthStencilAttachment: {
        view: depthView,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        clearDepth: 1.0,
        depthWriteEnabled: true,
      },
      label: 'MainRenderPass',
    });

    // 设置视口
    renderPass.setViewport(0, 0, width, height, 0, 1);
    renderPass.setScissorRect(0, 0, width, height);

    // 设置渲染管线
    renderPass.setPipeline(this.renderPipeline);

    // 渲染所有 MeshInstance 实体
    this.renderMeshInstances(ctx, renderPass, width / height);

    // 结束渲染通道
    renderPass.end();

    // 将离屏渲染结果复制到画布
    commandEncoder.copyTextureToCanvas({
      source: colorView,
      destination: gl.canvas as HTMLCanvasElement,
    });

    // 完成命令编码并提交
    const commandBuffer = commandEncoder.finish();
    this.rhiDevice.submit([commandBuffer]);

    // 清理视图
    colorView.destroy();
    depthView.destroy();
  }

  /**
   * 渲染所有 MeshInstance 实体
   */
  private renderMeshInstances(ctx: RenderContext, renderPass: MSpec.IRHIRenderPass, aspect: number): void {
    const world = ctx.scene.world;

    // 查找主相机
    const cameraData = this.findMainCamera(world);

    // 获取视图和投影矩阵
    let viewMatrix: Float32Array;
    let projectionMatrix: Float32Array;
    let cameraPosition: Vector3Like;

    if (cameraData) {
      viewMatrix = this.buildViewMatrix(cameraData.transform, cameraData.target);
      projectionMatrix = this.buildProjectionMatrix(cameraData.camera, aspect);
      cameraPosition = cameraData.transform.position;
    } else {
      // 回退到默认值
      console.warn('[SimpleWebGLRenderer] No camera found, using defaults');
      viewMatrix = this.createDefaultViewMatrix();
      projectionMatrix = this.createDefaultProjectionMatrix(aspect);
      cameraPosition = { x: 0, y: 2, z: 5 };
    }

    // 查询所有带有 MeshInstance、MaterialInstance 和 WorldTransform 的实体
    const query = world.query({
      all: [MeshInstance, MaterialInstance, WorldTransform],
    });

    query.forEach((_entity, components) => {
      const meshInstance = components[0] as MeshInstance;
      const materialInstance = components[1] as MaterialInstance;
      const worldTransform = components[2] as WorldTransform;

      if (!meshInstance.vertexBuffer || !materialInstance.material) {
        return;
      }

      // 从 WorldTransform 构建模型矩阵
      const modelMatrix = this.buildModelMatrix(worldTransform);

      // 更新矩阵 UBO
      this.updateMatricesUBO(modelMatrix, viewMatrix, projectionMatrix);

      // 更新材质 UBO（包含相机位置）
      this.updateMaterialUBO(materialInstance.material, cameraPosition);

      // 绑定 BindGroups
      if (this.matricesBindGroup) {
        renderPass.setBindGroup(0, this.matricesBindGroup);
      }
      if (this.materialBindGroup) {
        renderPass.setBindGroup(1, this.materialBindGroup);
      }

      // 设置顶点缓冲区
      renderPass.setVertexBuffer(0, meshInstance.vertexBuffer as MSpec.IRHIBuffer, 0);

      // 设置索引缓冲区（如果有）
      if (meshInstance.indexBuffer && meshInstance.indexCount > 0) {
        renderPass.setIndexBuffer(meshInstance.indexBuffer as MSpec.IRHIBuffer, MSpec.RHIIndexFormat.UINT16, 0);
      }

      // 发出绘制命令
      if (meshInstance.indexBuffer && meshInstance.indexCount > 0) {
        renderPass.drawIndexed(meshInstance.indexCount, 1, 0, 0, 0);
      } else {
        renderPass.draw(meshInstance.vertexCount, 1, 0, 0);
      }
    });

    // 清理查询
    world.removeQuery(query);
  }

  // ==================== Camera 相关方法 ====================

  /**
   * 查找场景中的主相机
   * @param world ECS World
   * @returns 相机数据或 null
   */
  private findMainCamera(world: World): {
    camera: Camera;
    transform: WorldTransform;
    target?: CameraTarget;
  } | null {
    const query = world.query({
      all: [Camera, WorldTransform],
    });

    let mainCameraData: {
      camera: Camera;
      transform: WorldTransform;
      target?: CameraTarget;
    } | null = null;

    query.forEach((entity, components) => {
      const camera = components[0] as Camera;
      const transform = components[1] as WorldTransform;

      // 尝试获取 CameraTarget 组件
      const target = world.getComponent(entity, CameraTarget) as CameraTarget | undefined;

      // 优先选择 isMain = true 的相机
      if (camera.isMain || !mainCameraData) {
        mainCameraData = { camera, transform, target };
      }
    });

    world.removeQuery(query);
    return mainCameraData;
  }

  /**
   * 从相机组件构建视图矩阵
   * @param transform 相机的 WorldTransform
   * @param target 可选的 CameraTarget
   * @returns 视图矩阵
   */
  private buildViewMatrix(transform: WorldTransform, target?: CameraTarget): Float32Array {
    const eye = [transform.position.x, transform.position.y, transform.position.z];

    if (target) {
      // 使用 LookAt 目标
      const targetPos = [target.target.x, target.target.y, target.target.z];
      const up = [target.up.x, target.up.y, target.up.z];
      return this.createLookAtMatrix(eye, targetPos, up);
    } else {
      // 从相机的旋转四元数计算前向方向
      const forward = this.quaternionToForward(transform.rotation);
      const targetPos = [eye[0] - forward[0], eye[1] - forward[1], eye[2] - forward[2]];
      return this.createLookAtMatrix(eye, targetPos, [0, 1, 0]);
    }
  }

  /**
   * 从四元数提取前向方向
   */
  private quaternionToForward(q: QuaternionLike): number[] {
    const { x, y, z, w } = q;
    return [2 * (x * z + w * y), 2 * (y * z - w * x), 1 - 2 * (x * x + y * y)];
  }

  /**
   * 从 Camera 组件构建投影矩阵
   * @param camera Camera 组件
   * @param aspect 宽高比 (如果 camera.aspect 未设置则使用此值)
   * @returns 投影矩阵
   */
  private buildProjectionMatrix(camera: Camera, aspect: number): Float32Array {
    const actualAspect = camera.aspect || aspect;

    if (camera.projectionType === 'orthographic') {
      return this.createOrthographicMatrix(camera.orthographicSize, actualAspect, camera.near, camera.far);
    } else {
      // 透视投影 - Camera.fov 已经是度数
      return this.createPerspectiveMatrix(camera.fov, actualAspect, camera.near, camera.far);
    }
  }

  /**
   * 创建正交投影矩阵
   */
  private createOrthographicMatrix(size: number, aspect: number, near: number, far: number): Float32Array {
    const halfHeight = size;
    const halfWidth = size * aspect;

    return new Float32Array([
      1 / halfWidth,
      0,
      0,
      0,
      0,
      1 / halfHeight,
      0,
      0,
      0,
      0,
      -2 / (far - near),
      0,
      0,
      0,
      -(far + near) / (far - near),
      1,
    ]);
  }

  // ==================== Transform 相关方法 ====================

  /**
   * 从 WorldTransform 组件构建模型矩阵
   * @param transform WorldTransform 组件
   * @returns 4x4 模型矩阵 (列主序)
   */
  private buildModelMatrix(transform: WorldTransform): Float32Array {
    const { position, rotation, scale } = transform;

    // 从四元数构建旋转矩阵
    const x = rotation.x,
      y = rotation.y,
      z = rotation.z,
      w = rotation.w;
    const x2 = x + x,
      y2 = y + y,
      z2 = z + z;
    const xx = x * x2,
      xy = x * y2,
      xz = x * z2;
    const yy = y * y2,
      yz = y * z2,
      zz = z * z2;
    const wx = w * x2,
      wy = w * y2,
      wz = w * z2;

    const sx = scale.x,
      sy = scale.y,
      sz = scale.z;

    // 列主序矩阵: TRS (Translation * Rotation * Scale)
    return new Float32Array([
      (1 - (yy + zz)) * sx,
      (xy + wz) * sx,
      (xz - wy) * sx,
      0,
      (xy - wz) * sy,
      (1 - (xx + zz)) * sy,
      (yz + wx) * sy,
      0,
      (xz + wy) * sz,
      (yz - wx) * sz,
      (1 - (xx + yy)) * sz,
      0,
      position.x,
      position.y,
      position.z,
      1,
    ]);
  }

  /**
   * 更新矩阵 UBO
   * std140 布局: mat4 modelMatrix, mat4 viewMatrix, mat4 projectionMatrix, mat4 normalMatrix
   */
  private updateMatricesUBO(modelMatrix: Float32Array, viewMatrix: Float32Array, projectionMatrix: Float32Array): void {
    if (!this.matricesBuffer) {
      return;
    }

    const data = new Float32Array(64); // 4 * 16 floats

    // Model matrix (offset 0)
    data.set(modelMatrix, 0);

    // View matrix (offset 16)
    data.set(viewMatrix, 16);

    // Projection matrix (offset 32)
    data.set(projectionMatrix, 32);

    // Normal matrix (offset 48) - same as model for identity
    data.set(modelMatrix, 48);

    this.matricesBuffer.update(data);
  }

  /**
   * 更新材质 UBO
   * std140 布局:
   *   vec4 baseColor (16 bytes)
   *   float metallic (4 bytes)
   *   float roughness (4 bytes)
   *   vec2 _pad0 (8 bytes)
   *   vec3 lightDirection (12 bytes)
   *   float _pad1 (4 bytes)
   *   vec3 lightColor (12 bytes)
   *   float _pad2 (4 bytes)
   *   vec3 cameraPosition (12 bytes)
   *   float _pad3 (4 bytes)
   * Total: 80 bytes = 20 floats
   */
  private updateMaterialUBO(material: PBRMaterial | UnlitMaterial, cameraPosition?: Vector3Like): void {
    if (!this.materialBuffer) {
      return;
    }

    const data = new Float32Array(20);

    if (material instanceof PBRMaterial) {
      // baseColor (vec4)
      data[0] = material.baseColor[0];
      data[1] = material.baseColor[1];
      data[2] = material.baseColor[2];
      data[3] = material.baseColor[3];

      // metallic, roughness, pad
      data[4] = material.metallic;
      data[5] = material.roughness;
      data[6] = 0; // _pad0.x
      data[7] = 0; // _pad0.y
    } else if (material instanceof UnlitMaterial) {
      // baseColor (vec4)
      data[0] = material.color[0];
      data[1] = material.color[1];
      data[2] = material.color[2];
      data[3] = material.color[3];

      // metallic, roughness, pad
      data[4] = 0;
      data[5] = 1;
      data[6] = 0;
      data[7] = 0;
    }

    // lightDirection (vec3) + pad
    data[8] = -0.5;
    data[9] = -1.0;
    data[10] = -0.5;
    data[11] = 0; // _pad1

    // lightColor (vec3) + pad
    data[12] = 1.0;
    data[13] = 1.0;
    data[14] = 1.0;
    data[15] = 0; // _pad2

    // cameraPosition (vec3) + pad - 使用传入的相机位置或默认值
    const camPos = cameraPosition ?? { x: 0, y: 2, z: 5 };
    data[16] = camPos.x;
    data[17] = camPos.y;
    data[18] = camPos.z;
    data[19] = 0; // _pad3

    this.materialBuffer.update(data);
  }

  // ==================== 矩阵工具方法 ====================

  /**
   * 创建单位矩阵
   */
  private createIdentityMatrix(): Float32Array {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  /**
   * 创建默认视图矩阵 (相机在 (0, 2, 5) 看向原点)
   */
  private createDefaultViewMatrix(): Float32Array {
    return this.createLookAtMatrix([0, 2, 5], [0, 0, 0], [0, 1, 0]);
  }

  /**
   * 创建默认投影矩阵 (45度 FOV)
   */
  private createDefaultProjectionMatrix(aspect: number): Float32Array {
    return this.createPerspectiveMatrix(45, aspect, 0.1, 1000);
  }

  /**
   * 创建 LookAt 视图矩阵
   */
  private createLookAtMatrix(eye: number[], target: number[], up: number[]): Float32Array {
    const zAxis = this.normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
    const xAxis = this.normalize(this.cross(up, zAxis));
    const yAxis = this.cross(zAxis, xAxis);

    return new Float32Array([
      xAxis[0],
      yAxis[0],
      zAxis[0],
      0,
      xAxis[1],
      yAxis[1],
      zAxis[1],
      0,
      xAxis[2],
      yAxis[2],
      zAxis[2],
      0,
      -this.dot(xAxis, eye),
      -this.dot(yAxis, eye),
      -this.dot(zAxis, eye),
      1,
    ]);
  }

  /**
   * 创建透视投影矩阵
   */
  private createPerspectiveMatrix(fovDegrees: number, aspect: number, near: number, far: number): Float32Array {
    const fovRad = (fovDegrees * Math.PI) / 180;
    const f = 1.0 / Math.tan(fovRad / 2);
    const rangeInv = 1.0 / (near - far);

    return new Float32Array([
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (near + far) * rangeInv,
      -1,
      0,
      0,
      near * far * rangeInv * 2,
      0,
    ]);
  }

  // 向量工具
  private normalize(v: number[]): number[] {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
  }

  private cross(a: number[], b: number[]): number[] {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  private dot(a: number[], b: number[]): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * 释放资源
   */
  override dispose(): void {
    this.renderPipeline?.destroy();
    this.vertexShader?.destroy();
    this.fragmentShader?.destroy();
    this.pipelineLayout?.destroy();
    this.matricesBindGroupLayout?.destroy();
    this.materialBindGroupLayout?.destroy();
    this.matricesBindGroup?.destroy();
    this.materialBindGroup?.destroy();
    this.matricesBuffer?.destroy();
    this.materialBuffer?.destroy();
    this.colorTexture?.destroy();
    this.depthTexture?.destroy();

    this.renderPipeline = null;
    this.vertexShader = null;
    this.fragmentShader = null;
    this.pipelineLayout = null;
    this.matricesBindGroupLayout = null;
    this.materialBindGroupLayout = null;
    this.matricesBindGroup = null;
    this.materialBindGroup = null;
    this.matricesBuffer = null;
    this.materialBuffer = null;
    this.colorTexture = null;
    this.depthTexture = null;

    super.dispose();
  }
}
