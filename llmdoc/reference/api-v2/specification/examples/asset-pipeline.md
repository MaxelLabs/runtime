# 资产管道示例

演示如何使用Specification库构建一个完整的资产导入、处理和使用管道。

## 完整代码

```typescript
import {
  Asset,
  Material,
  Mesh,
  Texture,
  AnimationClip,
  Skeleton,
  Scene,
  Transform3D,
  PBRMaterial,
  USDStage,
  USDPrim,
  ColorRGBA,
  Vec3,
  Quat,
  UUID
} from '@maxellabs/specification';
import { Buffer, Texture as RHITexture, Device } from '@maxellabs/rhi';
import { Mat4 } from '@maxellabs/math';

// 资产加载器接口
interface AssetLoader {
  canLoad(url: string): boolean;
  load(url: string, device: Device): Promise<Asset>;
}

// GLTF加载器
class GLTFLoader implements AssetLoader {
  canLoad(url: string): boolean {
    return url.endsWith('.gltf') || url.endsWith('.glb');
  }

  async load(url: string, device: Device): Promise<GLTFAsset> {
    const response = await fetch(url);
    const gltf = await response.json();

    // 加载缓冲区数据
    const buffers: ArrayBuffer[] = [];
    for (const bufferDef of gltf.buffers) {
      if (bufferDef.uri) {
        const bufferResponse = await fetch(bufferDef.uri);
        buffers.push(await bufferResponse.arrayBuffer());
      }
    }

    // 加载图像
    const images: ImageBitmap[] = [];
    for (const imageDef of gltf.images) {
      const imageResponse = await fetch(imageDef.uri);
      const blob = await imageResponse.blob();
      images.push(await createImageBitmap(blob));
    }

    // 处理网格
    const meshes: Mesh[] = [];
    for (const meshDef of gltf.meshes) {
      const mesh = new GLTFMesh(meshDef.name || `Mesh_${meshDef.name}`);

      for (const primitive of meshDef.primitives) {
        const position = this.getAccessorData(primitive.attributes.POSITION, gltf, buffers);
        const normal = this.getAccessorData(primitive.attributes.NORMAL, gltf, buffers);
        const texcoord = this.getAccessorData(primitive.attributes.TEXCOORD_0, gltf, buffers);
        const indices = this.getAccessorData(primitive.indices, gltf, buffers);

        mesh.addPrimitive({
          positions: position,
          normals: normal,
          texcoords: texcoord,
          indices: indices,
          material: primitive.material
        });
      }

      meshes.push(mesh);
    }

    // 处理材质
    const materials: PBRMaterial[] = [];
    for (const matDef of gltf.materials) {
      const material = new PBRMaterial(matDef.name || `Material_${matDef.name}`);

      // PBR属性
      if (matDef.pbrMetallicRoughness) {
        const pbr = matDef.pbrMetallicRoughness;
        material.baseColor = new ColorRGBA(
          pbr.baseColorFactor[0],
          pbr.baseColorFactor[1],
          pbr.baseColorFactor[2],
          pbr.baseColorFactor[3]
        );
        material.metallic = pbr.metallicFactor;
        material.roughness = pbr.roughnessFactor;

        // 纹理
        if (pbr.baseColorTexture !== undefined) {
          const image = images[pbr.baseColorTexture.index];
          material.baseColorTexture = await this.createTexture(image, device);
        }
      }

      materials.push(material);
    }

    // 处理动画
    const animations: AnimationClip[] = [];
    for (const animDef of gltf.animations) {
      const clip = new AnimationClip(animDef.name || `Animation_${animDef.name}`);

      for (const channel of animDef.channels) {
        const sampler = animDef.samplers[channel.sampler];
        const input = this.getAccessorData(sampler.input, gltf, buffers);
        const output = this.getAccessorData(sampler.output, gltf, buffers);

        clip.addChannel({
          target: channel.target,
          input,
          output,
          interpolation: sampler.interpolation || 'LINEAR'
        });
      }

      animations.push(clip);
    }

    // 处理场景图
    const scene = new Scene();
    const nodes = this.buildNodes(gltf.nodes, meshes, materials);

    if (gltf.scenes && gltf.scenes.length > 0) {
      const sceneDef = gltf.scenes[gltf.scene || 0];
      for (const nodeIndex of sceneDef.nodes) {
        scene.addNode(nodes[nodeIndex]);
      }
    }

    return new GLTFAsset({
      url,
      scene,
      meshes,
      materials,
      animations,
      buffers
    });
  }

  private getAccessorData(accessorIndex: number, gltf: any, buffers: ArrayBuffer[]): Float32Array {
    const accessor = gltf.accessors[accessorIndex];
    const bufferView = gltf.bufferViews[accessor.bufferView];
    const buffer = buffers[bufferView.buffer];

    const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const data = new Float32Array(buffer, byteOffset, accessor.count * this.getTypeSize(accessor.type));

    // 处理稀疏访问器
    if (accessor.sparse) {
      const sparse = accessor.sparse;
      const indicesBuffer = buffers[gltf.bufferViews[sparse.indices.bufferView].buffer];
      const valuesBuffer = buffers[gltf.bufferViews[sparse.values.bufferView].buffer];

      const indices = new Uint32Array(indicesBuffer, sparse.indices.byteOffset, sparse.count);
      const values = new Float32Array(valuesBuffer, sparse.values.byteOffset, sparse.count * this.getTypeSize(accessor.type));

      for (let i = 0; i < sparse.count; i++) {
        const index = indices[i];
        const valueStart = i * this.getTypeSize(accessor.type);
        const dataStart = index * this.getTypeSize(accessor.type);

        for (let j = 0; j < this.getTypeSize(accessor.type); j++) {
          data[dataStart + j] = values[valueStart + j];
        }
      }
    }

    return data;
  }

  private getTypeSize(type: string): number {
    switch (type) {
      case 'SCALAR': return 1;
      case 'VEC2': return 2;
      case 'VEC3': return 3;
      case 'VEC4': return 4;
      case 'MAT2': return 4;
      case 'MAT3': return 9;
      case 'MAT4': return 16;
      default: return 1;
    }
  }

  private async createTexture(image: ImageBitmap, device: Device): Promise<Texture> {
    const texture = device.createTexture({
      size: { width: image.width, height: image.height },
      format: TextureFormat.RGBA8Unorm,
      usage: TextureUsage.TextureBinding | TextureUsage.CopyDst
    });

    device.queue.copyExternalImageToTexture(
      { source: image },
      { texture },
      { width: image.width, height: image.height }
    );

    return new Texture({
      id: UUID.generate(),
      width: image.width,
      height: image.height,
      format: 'rgba8unorm',
      texture
    });
  }

  private buildNodes(nodeDefs: any[], meshes: Mesh[], materials: PBRMaterial[]): Node[] {
    const nodes: Node[] = [];

    for (let i = 0; i < nodeDefs.length; i++) {
      const nodeDef = nodeDefs[i];
      const node = new Node(nodeDef.name || `Node_${i}`);

      // 变换
      if (nodeDef.matrix) {
        node.transform.matrix = new Mat4(...nodeDef.matrix);
      } else {
        node.transform.position = new Vec3(
          nodeDef.translation?.[0] || 0,
          nodeDef.translation?.[1] || 0,
          nodeDef.translation?.[2] || 0
        );
        node.transform.rotation = new Quat(
          nodeDef.rotation?.[0] || 0,
          nodeDef.rotation?.[1] || 0,
          nodeDef.rotation?.[2] || 0,
          nodeDef.rotation?.[3] || 1
        );
        node.transform.scale = new Vec3(
          nodeDef.scale?.[0] || 1,
          nodeDef.scale?.[1] || 1,
          nodeDef.scale?.[2] || 1
        );
      }

      // 网格
      if (nodeDef.mesh !== undefined) {
        node.mesh = meshes[nodeDef.mesh];
      }

      // 子节点
      if (nodeDef.children) {
        for (const childIndex of nodeDef.children) {
          const child = this.buildNodes(nodeDefs, meshes, materials)[childIndex];
          child.parent = node;
          node.children.push(child);
        }
      }

      nodes.push(node);
    }

    return nodes;
  }
}

// USD加载器
class USDLoader implements AssetLoader {
  canLoad(url: string): boolean {
    return url.endsWith('.usd') || url.endsWith('.usda') || url.endsWith('.usdc');
  }

  async load(url: string, device: Device): Promise<USDAsset> {
    // 解析USD文件（简化版）
    const response = await fetch(url);
    const usdText = await response.text();

    const stage = this.parseUSD(usdText);
    return new USDAsset({ url, stage });
  }

  private parseUSD(text: string): USDStage {
    const stage: USDStage = {
      defaultPrim: '',
      upAxis: 'Y',
      metersPerUnit: 1.0,
      startTimeCode: 0,
      endTimeCode: 100,
      framesPerSecond: 24,
      rootLayer: {
        identifier: '',
        subLayers: []
      },
      prims: new Map()
    };

    // 简化的USD解析逻辑
    const lines = text.split('\n');
    let currentPrim: USDPrim | null = null;
    let currentPath = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('def ')) {
        // 开始定义原始对象
        const match = trimmed.match(/def\s+(\w+)\s+"([^"]+)"/);
        if (match) {
          currentPath = match[2];
          currentPrim = {
            path: currentPath,
            typeName: match[1],
            attributes: new Map(),
            children: []
          };
          stage.prims.set(currentPath, currentPrim);
        }
      } else if (trimmed === '}') {
        // 结束定义
        currentPrim = null;
        currentPath = '';
      } else if (currentPrim && trimmed.includes('=')) {
        // 属性赋值
        const [keyPart, valuePart] = trimmed.split('=').map(s => s.trim());
        const key = keyPart.split(' ').pop();
        const value = this.parseUSDValue(valuePart);
        currentPrim.attributes.set(key, value);
      }
    }

    return stage;
  }

  private parseUSDValue(value: string): any {
    value = value.replace(/[()]/g, '');

    // 简单的值解析
    if (value.includes(',')) {
      // 向量或颜色
      const parts = value.split(',').map(s => parseFloat(s.trim()));
      if (parts.length === 3) return new Vec3(parts[0], parts[1], parts[2]);
      if (parts.length === 4) return new ColorRGBA(parts[0], parts[1], parts[2], parts[3]);
    }

    // 标量值
    const num = parseFloat(value);
    return isNaN(num) ? value.replace(/"/g, '') : num;
  }
}

// 资产管理器
class AssetManager {
  private loaders: AssetLoader[] = [];
  private cache: Map<string, Asset> = new Map();
  private device: Device;

  constructor(device: Device) {
    this.device = device;

    // 注册加载器
    this.registerLoader(new GLTFLoader());
    this.registerLoader(new USDLoader());
  }

  registerLoader(loader: AssetLoader): void {
    this.loaders.push(loader);
  }

  async loadAsset(url: string): Promise<Asset> {
    // 检查缓存
    const cached = this.cache.get(url);
    if (cached) return cached;

    // 查找合适的加载器
    const loader = this.loaders.find(l => l.canLoad(url));
    if (!loader) {
      throw new Error(`No loader found for ${url}`);
    }

    // 加载资产
    const asset = await loader.load(url, this.device);

    // 缓存结果
    this.cache.set(url, asset);

    return asset;
  }

  preload(urls: string[]): Promise<Asset[]> {
    return Promise.all(urls.map(url => this.loadAsset(url)));
  }

  clearCache(): void {
    this.cache.forEach(asset => asset.dispose());
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// 资产实例化器
class AssetInstancer {
  private instances: Map<string, AssetInstance[]> = new Map();

  createInstance(asset: Asset): AssetInstance {
    const instance = new AssetInstance(asset);

    if (!this.instances.has(asset.url)) {
      this.instances.set(asset.url, []);
    }

    this.instances.get(asset.url)!.push(instance);
    return instance;
  }

  getInstances(assetUrl: string): AssetInstance[] {
    return this.instances.get(assetUrl) || [];
  }

  disposeAll(assetUrl: string): void {
    const instances = this.instances.get(assetUrl);
    if (instances) {
      instances.forEach(instance => instance.dispose());
      this.instances.delete(assetUrl);
    }
  }
}

// 资产实例
class AssetInstance {
  public transform: Transform3D;
  public materials: PBRMaterial[] = [];
  public visible: boolean = true;
  public castShadow: boolean = true;
  public receiveShadow: boolean = true;

  constructor(private asset: Asset) {
    this.transform = new Transform3D();

    // 克隆材质（每个实例可以有独立的材质）
    if (asset.materials) {
      this.materials = asset.materials.map(mat => mat.clone());
    }
  }

  update(deltaTime: number): void {
    // 更新动画
    if (this.asset.animations) {
      for (const animation of this.asset.animations) {
        animation.update(deltaTime, this);
      }
    }
  }

  render(renderContext: RenderContext): void {
    if (!this.visible) return;

    // 设置变换矩阵
    renderContext.setModelMatrix(this.transform.getMatrix());

    // 渲染网格
    if (this.asset.meshes) {
      for (const mesh of this.asset.meshes) {
        for (const primitive of mesh.primitives) {
          const material = this.materials[primitive.materialIndex];
          renderContext.drawPrimitive(primitive, material);
        }
      }
    }
  }

  dispose(): void {
    // 释放实例资源
    this.materials.forEach(mat => mat.dispose());
  }
}

// 渲染上下文
interface RenderContext {
  setModelMatrix(matrix: Mat4): void;
  drawPrimitive(primitive: Primitive, material: PBRMaterial): void;
}

// 使用示例
async function initializeScene() {
  // 创建设备
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const device = new WebGLDevice(canvas);

  // 创建管理器
  const assetManager = new AssetManager(device);
  const instancer = new AssetInstancer();

  // 预加载资产
  await assetManager.preload([
    'assets/models/character.gltf',
    'assets/models/environment.usd',
    'assets/animations/idle.gltf'
  ]);

  // 加载角色资产
  const characterAsset = await assetManager.loadAsset('assets/models/character.gltf');

  // 创建多个实例
  const character1 = instancer.createInstance(characterAsset);
  character1.transform.position = new Vec3(0, 0, 0);

  const character2 = instancer.createInstance(characterAsset);
  character2.transform.position = new Vec3(2, 0, 0);
  character2.materials.forEach(mat => {
    mat.baseColor = new ColorRGBA(1, 0, 0, 1); // 红色版本
  });

  // 加载环境
  const environmentAsset = await assetManager.loadAsset('assets/models/environment.usd');
  const environment = instancer.createInstance(environmentAsset);
  environment.transform.scale = new Vec3(10, 10, 10);

  // 渲染循环
  let lastTime = 0;
  function render(currentTime: number) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // 更新实例
    character1.update(deltaTime);
    character2.update(deltaTime);
    environment.update(deltaTime);

    // 渲染
    const renderContext: RenderContext = {
      setModelMatrix: (matrix) => {
        // 设置到着色器uniform
      },
      drawPrimitive: (primitive, material) => {
        // 执行绘制
      }
    };

    character1.render(renderContext);
    character2.render(renderContext);
    environment.render(renderContext);

    requestAnimationFrame(render);
  }

  render(0);

  // 清理函数
  return () => {
    instancer.disposeAll('assets/models/character.gltf');
    instancer.disposeAll('assets/models/environment.usd');
    assetManager.clearCache();
  };
}

// 高级特性：资产热重载
class AssetHotReloader {
  private watchers: Map<string, number> = new Map();
  private assetManager: AssetManager;

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

  watch(url: string): void {
    this.watchers.set(url, 0);
  }

  async checkForUpdates(): Promise<string[]> {
    const updated: string[] = [];

    for (const [url, lastModified] of this.watchers) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const modified = parseInt(response.headers.get('last-modified') || '0');

        if (modified > lastModified) {
          this.watchers.set(url, modified);

          // 重新加载资产
          this.assetManager.clearCache();
          await this.assetManager.loadAsset(url);

          updated.push(url);
        }
      } catch (error) {
        console.error(`Failed to check ${url}:`, error);
      }
    }

    return updated;
  }
}

// 资产流式加载
class StreamingAssetLoader {
  private chunkSize: number = 1024 * 1024; // 1MB chunks
  private loadedChunks: Map<string, ArrayBuffer[]> = new Map();

  async loadStreaming(url: string, onProgress?: (progress: number) => void): Promise<ArrayBuffer> {
    const response = await fetch(url);
    const contentLength = parseInt(response.headers.get('content-length') || '0');

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const chunks: ArrayBuffer[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value.buffer);
      loaded += value.byteLength;

      if (onProgress) {
        onProgress(loaded / contentLength);
      }
    }

    // 合并所有块
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const result = new ArrayBuffer(totalLength);
    const view = new Uint8Array(result);

    let offset = 0;
    for (const chunk of chunks) {
      view.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    return result;
  }
}

// 启动场景
initializeScene().then(cleanup => {
  window.addEventListener('unload', cleanup);
});
```

## 关键概念

### 1. 资产管道流程
```
原始文件 → 解析器 → 资产对象 → 实例化 → 渲染
```

### 2. 加载器模式
- 每种格式有专门的加载器
- 统一的接口便于扩展
- 自动检测文件类型

### 3. 资产缓存
- 避免重复加载
- 内存管理
- 版本控制

### 4. 实例化系统
- 资产与实例分离
- 独立的变换和材质
- 批量优化

## 性能优化

### 1. 延迟加载
```typescript
// 按需加载
async function loadWhenNeeded(assetUrl: string) {
  if (!assetManager.hasCached(assetUrl)) {
    await assetManager.loadAsset(assetUrl);
  }
}
```

### 2. 压缩和优化
```typescript
// 使用 Draco 压缩几何体
// 使用 Basis Universal 压缩纹理
// 使用 glTF Transform 优化
```

### 3. 流式加载
```typescript
// 大文件分块加载
const loader = new StreamingAssetLoader();
loader.loadStreaming('large-scene.gltf', (progress) => {
  console.log(`Loading: ${progress * 100}%`);
});
```

### 4. 预测性加载
```typescript
// 根据用户行为预测加载
function preloadNearbyAssets(position: Vec3, radius: number) {
  const nearbyAssets = getAssetsWithinRadius(position, radius);
  assetManager.preload(nearbyAssets);
}
```

## 最佳实践

### 1. 资产组织
- 按类型分组（模型、纹理、动画）
- 使用命名约定
- 版本控制

### 2. 内存管理
- 及时释放不用的资产
- 使用对象池
- 监控内存使用

### 3. 错误处理
- 优雅降级
- 重试机制
- 用户反馈

### 4. 用户体验
- 显示加载进度
- 预加载关键资产
- 渐进式加载

## 下一步

- [材质系统](../rendering/material-system.md)
- [动画混合](../animation/animation-blending.md)
- [LOD系统](../rendering/lod-system.md)
- [虚拟纹理](../rendering/virtual-texturing.md)