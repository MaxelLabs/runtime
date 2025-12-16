# RHI 资源管理 API

## 概述

RHI 资源管理系统提供了一套完整的 WebGL 资源抽象，包括缓冲区（Buffer）、纹理（Texture）、采样器（Sampler）等核心资源的管理。所有资源都遵循统一的生命周期管理机制，确保资源的高效创建、使用和销毁。

## GLBuffer - 缓冲区资源

### 缓冲区类型

```typescript
// 缓冲区使用标志
enum BufferUsage {
    MAP_READ = 0x0001,        // CPU读取
    MAP_WRITE = 0x0002,       // CPU写入
    COPY_SRC = 0x0004,        // 复制源
    COPY_DST = 0x0008,        // 复制目标
    INDEX = 0x0010,           // 索引缓冲
    VERTEX = 0x0020,          // 顶点缓冲
    UNIFORM = 0x0040,         // 统一缓冲
    STORAGE = 0x0080,         // 存储缓冲
    INDIRECT = 0x0100         // 间接绘制
}

type BufferUsageFlags = number;
```

### 缓冲区创建

```typescript
class GLBuffer<T = ArrayBufferView> {
    readonly device: WebGLDevice;
    readonly glBuffer: WebGLBuffer;
    readonly size: number;
    readonly usage: BufferUsageFlags;
    readonly label?: string;

    constructor(device: WebGLDevice, descriptor: BufferDescriptor<T>);
}
```

#### 基础缓冲区创建

```typescript
// 顶点缓冲区
const vertexBuffer = new GLBuffer<Float32Array>(device, {
    size: vertices.length * 4 * 3,  // 3个float分量
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
    data: new Float32Array(vertices)
});

// 索引缓冲区
const indexBuffer = new GLBuffer<Uint16Array>(device, {
    size: indices.length * 2,  // 16位索引
    usage: BufferUsage.INDEX | BufferUsage.COPY_DST,
    data: new Uint16Array(indices)
});

// 统一缓冲区（用于着色器uniform数据）
const uniformBuffer = new GLBuffer<Float32Array>(device, {
    size: 256,  // 256字节，满足UBO对齐要求
    usage: BufferUsage.UNIFORM | BufferUsage.COPY_DST
});
```

#### 动态缓冲区

```typescript
// 动态顶点缓冲区（每帧更新）
const dynamicVertexBuffer = new GLBuffer(device, {
    size: maxVertexCount * 32,  // 假设每个顶点32字节
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
    mappedAtCreation: true  // 创建时映射，方便初始写入
});

// 更新动态缓冲区
function updateDynamicBuffer(newVertices: Float32Array) {
    device.queue.writeBuffer(dynamicVertexBuffer, 0, newVertices);
}
```

#### 实例化缓冲区

```typescript
// 实例数据缓冲区
const instanceBuffer = new GLBuffer<Float32Array>(device, {
    size: instanceCount * 4 * 4,  // 每个实例4x4矩阵
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
    data: new Float32Array(instanceMatrices)
});
```

### 缓冲区操作

```typescript
// 缓冲区写入
device.queue.writeBuffer(buffer, offset, data);

// 映射缓冲区（用于直接CPU访问）
await buffer.mapAsync(mode, offset, size);
const mappedArray = buffer.getMappedRange();
// ... 操作映射内存
buffer.unmap();
```

**示例：**
```typescript
// 创建并填充顶点缓冲区
class Mesh {
    private vertexBuffer: GLBuffer;
    private indexBuffer: GLBuffer;

    constructor(device: WebGLDevice, vertices: number[], indices: number[]) {
        // 创建交错顶点数据 [position, normal, uv]
        const vertexData = new Float32Array([
            ...vertices[0], ...vertices[1], ...vertices[2],  // position
            ...vertices[3], ...vertices[4], ...vertices[5],  // normal
            ...vertices[6], ...vertices[7]                   // uv
        ]);

        this.vertexBuffer = new GLBuffer(device, {
            size: vertexData.byteLength,
            usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
            data: vertexData
        });

        this.indexBuffer = new GLBuffer(device, {
            size: indices.length * 2,
            usage: BufferUsage.INDEX | BufferUsage.COPY_DST,
            data: new Uint16Array(indices)
        });
    }
}
```

## GLTexture - 纹理资源

### 纹理类型

```typescript
enum TextureDimension {
    e1D = '1d',
    e2D = '2d',
    e3D = '3d',
    cube = 'cube'
}

enum TextureUsage {
    COPY_SRC = 0x01,
    COPY_DST = 0x02,
    TEXTURE_BINDING = 0x04,
    STORAGE_BINDING = 0x08,
    RENDER_ATTACHMENT = 0x10
}

type TextureUsageFlags = number;
```

### 纹理创建

```typescript
class GLTexture {
    readonly device: WebGLDevice;
    readonly glTexture: WebGLTexture;
    readonly dimension: TextureDimension;
    readonly format: GPUTextureFormat;
    readonly size: [number, number, number];
    readonly mipLevelCount: number;
    readonly sampleCount: number;
    readonly usage: TextureUsageFlags;
    readonly label?: string;

    constructor(device: WebGLDevice, descriptor: TextureDescriptor);
}
```

#### 2D纹理创建

```typescript
// 基础2D纹理
const colorTexture = new GLTexture(device, {
    size: [1024, 1024],
    format: 'rgba8unorm',
    mipLevelCount: 1,
    usage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST
});

// 可渲染纹理（用于离屏渲染）
const renderTexture = new GLTexture(device, {
    size: [1920, 1080],
    format: 'rgba16float',
    mipLevelCount: 1,
    usage: TextureUsage.TEXTURE_BINDING | TextureUsage.RENDER_ATTACHMENT
});

// 深度纹理
const depthTexture = new GLTexture(device, {
    size: [1920, 1080],
    format: 'depth24plus',
    mipLevelCount: 1,
    usage: TextureUsage.RENDER_ATTACHMENT
});
```

#### 多级渐远纹理（Mipmap）

```typescript
// 自动生成mipmap的纹理
const mipmapTexture = new GLTexture(device, {
    size: [512, 512],
    format: 'rgba8unorm',
    mipLevelCount: Math.log2(512) + 1,  // 完整mipmap链
    usage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST
});

// 手动设置mipmap数据
for (let level = 0; level < mipmapTexture.mipLevelCount; level++) {
    const size = Math.max(1, 512 >> level);
    const mipmapData = generateMipmapData(size, level);
    device.queue.writeTexture(
        {
            texture: mipmapTexture,
            mipLevel: level
        },
        mipmapData,
        { bytesPerRow: size * 4 },
        [size, size]
    );
}
```

#### 立方体贴图

```typescript
const cubeTexture = new GLTexture(device, {
    size: [256, 256],
    dimension: TextureDimension.cube,
    format: 'rgba8unorm',
    mipLevelCount: 1,
    usage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST
});

// 为每个面设置数据
const faces = ['right', 'left', 'top', 'bottom', 'front', 'back'];
for (let i = 0; i < 6; i++) {
    const faceData = loadCubeFaceImage(faces[i]);
    device.queue.writeTexture(
        {
            texture: cubeTexture,
            origin: { x: 0, y: 0, z: i },  // z表示立方体面
            mipLevel: 0
        },
        faceData,
        { bytesPerRow: 256 * 4 },
        [256, 256]
    );
}
```

#### 数组纹理

```typescript
const arrayTexture = new GLTexture(device, {
    size: [512, 512, 6],  // width, height, layers
    format: 'rgba8unorm',
    mipLevelCount: 1,
    usage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST
});

// 加载图集到数组纹理
for (let layer = 0; layer < 6; layer++) {
    const layerData = loadImageForLayer(layer);
    device.queue.writeTexture(
        {
            texture: arrayTexture,
            origin: { x: 0, y: 0, z: layer },
            mipLevel: 0
        },
        layerData,
        { bytesPerRow: 512 * 4 },
        [512, 512]
    );
}
```

### 纹理视图

```typescript
// 创建纹理视图
const textureView = texture.createView({
    format: 'rgba8unorm',
    dimension: '2d',
    baseMipLevel: 0,
    mipLevelCount: 1,
    baseArrayLayer: 0,
    arrayLayerCount: 1
});

// 创建mipmap视图
const mipmapView = texture.createView({
    baseMipLevel: 2,
    mipLevelCount: 1
});

// 创建立方体面的视图
const cubeFaceView = cubeTexture.createView({
    dimension: '2d',
    baseArrayLayer: 0,
    arrayLayerCount: 1
});
```

## GLSampler - 采样器

### 采样器创建

```typescript
class GLSampler {
    readonly device: WebGLDevice;
    readonly glSampler: WebGLSampler;
    readonly descriptor: SamplerDescriptor;

    constructor(device: WebGLDevice, descriptor?: SamplerDescriptor);
}

interface SamplerDescriptor {
    addressModeU?: GPUAddressMode;
    addressModeV?: GPUAddressMode;
    addressModeW?: GPUAddressMode;
    magFilter?: GPUFilterMode;
    minFilter?: GPUFilterMode;
    mipmapFilter?: GPUMipmapFilterMode;
    lodMinClamp?: number;
    lodMaxClamp?: number;
    maxAnisotropy?: number;
    compare?: GPUCompareFunction;
}
```

#### 常用采样器配置

```typescript
// 线性过滤采样器
const linearSampler = new GLSampler(device, {
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear'
});

// 最近邻采样器（像素艺术）
const pixelSampler = new GLSampler(device, {
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    magFilter: 'nearest',
    minFilter: 'nearest',
    mipmapFilter: 'nearest'
});

// 各向异性采样器
const anisotropicSampler = new GLSampler(device, {
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    maxAnisotropy: 16  // 需要EXT_texture_filter_anisotropic扩展
});

// 阴影贴图采样器
const shadowSampler = new GLSampler(device, {
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    magFilter: 'linear',
    minFilter: 'linear',
    compare: 'less'  // 比较模式，用于PCF阴影
});
```

## ResourceTracker - 资源追踪器

### 资源生命周期管理

```typescript
class ResourceTracker {
    // 跟踪资源
    track<T extends GLResource>(resource: T): T;

    // 释放所有资源
    dispose(): void;

    // 获取资源统计
    getStats(): ResourceStats;

    // 获取特定类型资源
    getResources<T extends GLResource>(type: ResourceType): T[];

    // 移除特定资源
    untrack<T extends GLResource>(resource: T): void;
}

interface ResourceStats {
    buffers: number;
    textures: number;
    samplers: number;
    shaders: number;
    pipelines: number;
    totalMemory: number;
}
```

### 使用ResourceTracker

```typescript
class SceneManager {
    private resourceTracker = new ResourceTracker();

    loadScene(sceneData: any) {
        // 加载并跟踪资源
        const meshes = sceneData.meshes.map(meshData => {
            const mesh = new Mesh(this.device, meshData);
            return this.resourceTracker.track(mesh);
        });

        const textures = sceneData.textures.map(texData => {
            const texture = new GLTexture(this.device, texData);
            return this.resourceTracker.track(texture);
        });

        return { meshes, textures };
    }

    unloadScene() {
        // 释放所有场景资源
        this.resourceTracker.dispose();
        console.log('场景资源已释放');
    }

    getResourceInfo() {
        const stats = this.resourceTracker.getStats();
        console.log('资源使用情况:', stats);

        // 内存使用过高时警告
        if (stats.totalMemory > 256 * 1024 * 1024) {
            console.warn('内存使用过高:', stats.totalMemory / 1024 / 1024, 'MB');
        }
    }
}
```

## 资源池管理

### 纹理池

```typescript
class TexturePool {
    private pool: Map<string, GLTexture[]> = new Map();
    private maxSize = 10;

    getTexture(descriptor: TextureDescriptor): GLTexture {
        const key = this.getPoolKey(descriptor);
        const pool = this.pool.get(key) || [];

        if (pool.length > 0) {
            return pool.pop()!;
        }

        return new GLTexture(this.device, descriptor);
    }

    releaseTexture(texture: GLTexture) {
        const key = this.getPoolKey(texture.descriptor);
        const pool = this.pool.get(key) || [];

        if (pool.length < this.maxSize) {
            pool.push(texture);
            this.pool.set(key, pool);
        } else {
            texture.dispose();
        }
    }

    private getPoolKey(descriptor: TextureDescriptor): string {
        return `${descriptor.size[0]}x${descriptor.size[1]}_${descriptor.format}`;
    }
}
```

### 缓冲区池

```typescript
class BufferPool {
    private pools: Map<number, GLBuffer[]> = new Map();

    getBuffer(size: number, usage: BufferUsageFlags): GLBuffer {
        const pool = this.pools.get(size) || [];

        for (let i = 0; i < pool.length; i++) {
            const buffer = pool[i];
            if (buffer.usage === usage) {
                pool.splice(i, 1);
                return buffer;
            }
        }

        return new GLBuffer(this.device, {
            size,
            usage
        });
    }

    releaseBuffer(buffer: GLBuffer) {
        const pool = this.pools.get(buffer.size) || [];
        pool.push(buffer);
        this.pools.set(buffer.size, pool);
    }
}
```

## 资源使用最佳实践

### 1. 内存优化

```typescript
// 使用纹理压缩
const compressedTexture = new GLTexture(device, {
    size: [1024, 1024],
    format: 'bc1-rgba-unorm',  // 或 'etc2-rgba8unorm'
    usage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST
});

// 复用临时缓冲区
class TempBufferManager {
    private tempBuffers: GLBuffer[] = [];

    getTempBuffer(size: number): GLBuffer {
        let buffer = this.tempBuffers.find(b => b.size >= size);
        if (!buffer) {
            buffer = new GLBuffer(device, {
                size,
                usage: BufferUsage.COPY_DST | BufferUsage.COPY_SRC
            });
            this.tempBuffers.push(buffer);
        }
        return buffer;
    }

    release() {
        this.tempBuffers.forEach(b => b.dispose());
        this.tempBuffers = [];
    }
}
```

### 2. 资源延迟加载

```typescript
class LazyTextureLoader {
    private cache = new Map<string, Promise<GLTexture>>();

    loadTexture(url: string): Promise<GLTexture> {
        if (this.cache.has(url)) {
            return this.cache.get(url)!;
        }

        const promise = this.loadImage(url)
            .then(imageData => {
                const texture = new GLTexture(device, {
                    size: [imageData.width, imageData.height],
                    format: 'rgba8unorm',
                    usage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST
                });

                device.queue.writeTexture(
                    { texture },
                    imageData,
                    { bytesPerRow: imageData.width * 4 },
                    [imageData.width, imageData.height]
                );

                return texture;
            });

        this.cache.set(url, promise);
        return promise;
    }
}
```

### 3. 资源更新策略

```typescript
// 双缓冲策略用于动态纹理
class DoubleBufferedTexture {
    private textures: GLTexture[];
    private currentIndex = 0;

    constructor(device: WebGLDevice, size: [number, number]) {
        this.textures = [
            new GLTexture(device, {
                size,
                format: 'rgba16float',
                usage: TextureUsage.TEXTURE_BINDING | TextureUsage.STORAGE_BINDING | TextureUsage.COPY_DST
            }),
            new GLTexture(device, {
                size,
                format: 'rgba16float',
                usage: TextureUsage.TEXTURE_BINDING | TextureUsage.STORAGE_BINDING | TextureUsage.COPY_DST
            })
        ];
    }

    getWriteTarget(): GLTexture {
        return this.textures[this.currentIndex];
    }

    getReadSource(): GLTexture {
        return this.textures[1 - this.currentIndex];
    }

    swap() {
        this.currentIndex = 1 - this.currentIndex;
    }
}
```

## 调试和监控

### 资源标记

```typescript
// 为资源添加标签用于调试
const vertexBuffer = new GLBuffer(device, {
    size: bufferSize,
    usage: BufferUsage.VERTEX,
    data: vertexData,
    label: 'Mesh_VertexBuffer_001'
});

const albedoTexture = new GLTexture(device, {
    size: [512, 512],
    format: 'rgba8unorm',
    usage: TextureUsage.TEXTURE_BINDING,
    label: 'Material_AlbedoMap'
});
```

### 资源泄漏检测

```typescript
class ResourceLeakDetector {
    private trackedResources = new Set<GLResource>();

    track<T extends GLResource>(resource: T): T {
        this.trackedResources.add(resource);
        return resource;
    }

    checkLeaks() {
        const activeResources = Array.from(this.trackedResources);
        console.log(`活跃资源数量: ${activeResources.length}`);

        // 按类型统计
        const stats = activeResources.reduce((acc, resource) => {
            const type = resource.constructor.name;
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log('资源统计:', stats);

        // 检查可能的泄漏
        if (activeResources.length > 1000) {
            console.warn('检测到可能的大量资源泄漏');
        }
    }
}
```

## 完整示例：场景资源管理器

```typescript
class SceneResourceManager {
    private device: WebGLDevice;
    private resourceTracker = new ResourceTracker();
    private textureLoader = new LazyTextureLoader();
    private texturePool = new TexturePool();
    private bufferPool = new BufferPool();

    constructor(device: WebGLDevice) {
        this.device = device;
    }

    // 加载网格
    async loadMesh(meshData: {
        vertices: Float32Array;
        indices: Uint16Array;
        normals?: Float32Array;
        uvs?: Float32Array;
    }): Promise<Mesh> {
        // 合并顶点数据
        const interleavedVertices = this.interleaveVertexData(meshData);

        const vertexBuffer = this.resourceTracker.track(
            new GLBuffer(this.device, {
                size: interleavedVertices.byteLength,
                usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
                data: interleavedVertices,
                label: `Mesh_VertexBuffer_${Date.now()}`
            })
        );

        const indexBuffer = this.resourceTracker.track(
            new GLBuffer(this.device, {
                size: meshData.indices.byteLength,
                usage: BufferUsage.INDEX | BufferUsage.COPY_DST,
                data: meshData.indices,
                label: `Mesh_IndexBuffer_${Date.now()}`
            })
        );

        return new Mesh(vertexBuffer, indexBuffer);
    }

    // 加载材质
    async loadMaterial(materialData: {
        albedoMap?: string;
        normalMap?: string;
        metallicRoughnessMap?: string;
        aoMap?: string;
    }): Promise<Material> {
        const texturePromises: Promise<GLTexture | null>[] = [];

        if (materialData.albedoMap) {
            texturePromises.push(
                this.textureLoader.loadTexture(materialData.albedoMap)
            );
        }

        const textures = await Promise.all(texturePromises);

        const albedoTexture = textures[0];
        const albedoSampler = this.resourceTracker.track(
            new GLSampler(this.device, {
                magFilter: 'linear',
                minFilter: 'linear',
                mipmapFilter: 'linear'
            })
        );

        return new Material({
            albedoTexture,
            albedoSampler
        });
    }

    // 创建临时渲染目标
    createRenderTarget(width: number, height: number): RenderTarget {
        const colorTexture = this.texturePool.getTexture({
            size: [width, height],
            format: 'rgba16float',
            usage: TextureUsage.RENDER_ATTACHMENT | TextureUsage.TEXTURE_BINDING
        });

        const depthTexture = this.texturePool.getTexture({
            size: [width, height],
            format: 'depth24plus',
            usage: TextureUsage.RENDER_ATTACHMENT
        });

        return this.resourceTracker.track(
            new RenderTarget(colorTexture, depthTexture)
        );
    }

    // 获取资源使用统计
    getResourceStats(): ResourceStats {
        return this.resourceTracker.getStats();
    }

    // 清理所有资源
    dispose() {
        this.resourceTracker.dispose();
        this.texturePool.dispose();
        this.bufferPool.dispose();
    }

    private interleaveVertexData(meshData: any): Float32Array {
        // 实现顶点数据交错
        const stride = 3 + (meshData.normals ? 3 : 0) + (meshData.uvs ? 2 : 0);
        const interleaved = new Float32Array(meshData.vertices.length / 3 * stride);

        // ... 交错逻辑
        return interleaved;
    }
}
```

## 总结

RHI 资源管理 API 提供了：

1. **统一的资源接口** - Buffer、Texture、Sampler 等资源的统一管理
2. **生命周期管理** - 自动资源追踪和释放
3. **性能优化** - 资源池、延迟加载、双缓冲等优化策略
4. **内存安全** - 防止资源泄漏的检测机制
5. **调试支持** - 资源标记和统计监控

正确使用这些 API 可以确保 WebGL 应用的高效运行和稳定性能。