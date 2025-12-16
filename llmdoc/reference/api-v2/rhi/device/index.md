# RHI 设备管理 API

## 概述

WebGLDevice 是 RHI (Render Hardware Interface) 库的核心设备管理类，负责 WebGL 上下文的创建、状态管理和资源协调。本文档详细介绍了设备管理相关的所有 API 和使用方法。

## WebGLDevice 类

### 设备状态枚举

```typescript
enum DeviceState {
    ACTIVE = 'active',       // 设备可用，可以执行渲染命令
    LOST = 'lost',          // 上下文丢失，需要恢复
    DESTROYED = 'destroyed' // 设备已销毁，无法使用
}
```

### 构造函数

```typescript
constructor(canvas: HTMLCanvasElement, options?: WebGLContextOptions)
```

**参数：**
- `canvas: HTMLCanvasElement` - WebGL 渲染画布
- `options?: WebGLContextOptions` - 可选的 WebGL 上下文创建选项

**示例：**
```typescript
// 基本设备创建
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const device = new WebGLDevice(canvas);

// 带选项的设备创建
const device = new WebGLDevice(canvas, {
    alpha: false,
    depth: true,
    stencil: false,
    antialias: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
    desynchronized: false,
    xrCompatible: true
});
```

### 核心属性

```typescript
// 只读属性
readonly gl: WebGL2RenderingContext;     // WebGL2 上下文
readonly canvas: HTMLCanvasElement;      // 关联的画布
readonly state: DeviceState;             // 当前设备状态
 readonly extensions: WebGLExtensions;   // 扩展管理器
readonly capabilities: DeviceCapabilities; // 设备能力信息
readonly resourceTracker: ResourceTracker; // 资源追踪器
```

### 设备初始化

```typescript
async initialize(): Promise<void>
```

初始化设备，设置 WebGL 上下文和扩展。

**示例：**
```typescript
try {
    await device.initialize();
    console.log('设备初始化成功');
    console.log('WebGL版本:', device.gl.VERSION);
    console.log('设备能力:', device.capabilities);
} catch (error) {
    console.error('设备初始化失败:', error);
}
```

### 上下文管理

#### 获取上下文信息

```typescript
getContextInfo(): WebGLContextInfo
```

返回包含上下文详细信息的对象。

```typescript
interface WebGLContextInfo {
    version: string;           // WebGL 版本
    vendor: string;           // GPU 厂商
    renderer: string;         // 渲染器信息
    shadingLanguageVersion: string; // GLSL 版本
    extensions: string[];     // 可用扩展列表
    maxTextureSize: number;   // 最大纹理尺寸
    maxViewportDims: number[]; // 最大视口尺寸
}
```

#### 上下文丢失处理

```typescript
// 注册上下文丢失处理器
onContextLost(callback: (event: Event) => void): void;

// 注册上下文恢复处理器
onContextRestored(callback: () => void): void;

// 手动触发上下文丢失
loseContext(): void;

// 尝试恢复上下文
restoreContext(): Promise<boolean>;
```

**示例：**
```typescript
// 设置上下文事件监听
device.onContextLost((event) => {
    console.warn('WebGL上下文丢失');
    // 暂停渲染循环
    stopRenderLoop();
});

device.onContextRestored(() => {
    console.log('WebGL上下文已恢复');
    // 重新创建资源
    recreateResources();
    // 恢复渲染循环
    startRenderLoop();
});

// 检查和处理上下文丢失
if (device.state === DeviceState.LOST) {
    await device.restoreContext();
}
```

### 扩展管理

#### 检查扩展可用性

```typescript
hasExtension(name: string): boolean;
getExtension<T = any>(name: string): T | null;
getExtensionSupported(name: string): boolean;
```

#### 常用扩展

```typescript
interface WebGLExtensions {
    // 纹理扩展
    EXT_texture_filter_anisotropic: EXT_texture_filter_anisotropic | null;
    OES_texture_float: OES_texture_float | null;
    OES_texture_half_float: OES_texture_half_float | null;
    WEBGL_compressed_texture_s3tc: WEBGL_compressed_texture_s3tc | null;

    // 渲染扩展
    OES_element_index_uint: OES_element_index_uint | null;
    WEBGL_depth_texture: WEBGL_depth_texture | null;
    OES_standard_derivatives: OES_standard_derivatives | null;

    // 调试扩展
    WEBGL_debug_renderer_info: WEBGL_debug_renderer_info | null;
    WEBGL_debug_shaders: WEBGL_debug_shaders | null;
}
```

**示例：**
```typescript
// 检查扩展
if (device.hasExtension('EXT_texture_filter_anisotropic')) {
    const ext = device.getExtension('EXT_texture_filter_anisotropic');
    console.log('各向异性过滤最大值:', ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
}

// 使用深度纹理
if (device.hasExtension('WEBGL_depth_texture')) {
    // 可以创建深度纹理
    const depthTexture = device.createTexture({
        format: 'depth24plus',
        width: 1024,
        height: 1024,
        usage: TextureUsage.TEXTURE_BINDING | TextureUsage.RENDER_ATTACHMENT
    });
}
```

### 设备能力查询

```typescript
interface DeviceCapabilities {
    // 渲染能力
    maxTextureSize: number;
    max3DTextureSize: number;
    maxCubeMapTextureSize: number;
    maxArrayTextureLayers: number;
    maxRenderBufferSize: number;

    // 顶点能力
    maxVertexAttributes: number;
    maxVertexUniformVectors: number;
    maxVertexOutputComponents: number;

    // 片元能力
    maxFragmentUniformVectors: number;
    maxFragmentInputComponents: number;
    maxTextureUnits: number;

    // 帧缓冲能力
    maxColorAttachments: number;
    maxDrawBuffers: number;

    // 变换反馈能力
    maxTransformFeedbackSeparateAttributes: number;
    maxTransformFeedbackInterleavedComponents: number;

    // 计算着色器能力
    maxComputeWorkGroupInvocations: number;
    maxComputeSharedMemorySize: number;

    // 其他特性
    supportsInstancedArrays: boolean;
    supportsDrawInstanced: boolean;
    supportsVertexID: boolean;
    supportsInstancedID: boolean;
}
```

**示例：**
```typescript
const caps = device.capabilities;

// 根据能力调整渲染设置
const maxTextureSize = caps.maxTextureSize;
const textureSize = Math.min(4096, maxTextureSize);

if (caps.supportsInstancedArrays) {
    // 使用实例化渲染
    useInstancedRendering = true;
}

// 检查计算着色器支持
if (caps.maxComputeWorkGroupInvocations > 0) {
    // 可以使用计算着色器
    enableComputeShaders = true;
}
```

### 资源创建方法

#### 缓冲区创建

```typescript
createBuffer<T = ArrayBufferView>(
    descriptor: BufferDescriptor<T>
): GLBuffer<T>

interface BufferDescriptor<T = ArrayBufferView> {
    size?: number;                    // 缓冲区大小（字节）
    usage: BufferUsageFlags;          // 使用标志
    mappedAtCreation?: boolean;       // 创建时是否映射
    data?: T;                        // 初始数据
}
```

**示例：**
```typescript
// 创建顶点缓冲区
const vertexBuffer = device.createBuffer({
    size: vertices.length * 4 * 3,
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
    data: new Float32Array(vertices)
});

// 创建索引缓冲区
const indexBuffer = device.createBuffer({
    size: indices.length * 2,
    usage: BufferUsage.INDEX | BufferUsage.COPY_DST,
    data: new Uint16Array(indices)
});

// 创建统一缓冲区
const uniformBuffer = device.createBuffer({
    size: 256, // 256字节的uniform块
    usage: BufferUsage.UNIFORM | BufferUsage.COPY_DST,
    mappedAtCreation: true
});
```

#### 纹理创建

```typescript
createTexture(
    descriptor: TextureDescriptor
): GLTexture

interface TextureDescriptor {
    size: [number, number, number?];  // 纹理尺寸 [width, height, depth?]
    format: GPUTextureFormat;         // 纹理格式
    mipLevelCount?: number;           // Mip层级数
    sampleCount?: number;             // 采样数
    usage: TextureUsageFlags;         // 使用标志
    label?: string;                   // 调试标签
}
```

**示例：**
```typescript
// 创建2D颜色纹理
const colorTexture = device.createTexture({
    size: [1024, 1024],
    format: 'rgba8unorm',
    mipLevelCount: 1,
    usage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST,
    label: 'ColorTexture'
});

// 创建深度纹理
const depthTexture = device.createTexture({
    size: [1920, 1080],
    format: 'depth24plus',
    usage: TextureUsage.RENDER_ATTACHMENT,
    label: 'DepthTexture'
});

// 创建立方体贴图
const cubeTexture = device.createTexture({
    size: [512, 512],
    format: 'rgba8unorm',
    mipLevelCount: 8,
    usage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST,
    label: 'CubeMap'
});
```

#### 采样器创建

```typescript
createSampler(
    descriptor?: SamplerDescriptor
): GLSampler

interface SamplerDescriptor {
    addressModeU?: GPUAddressMode;    // U方向寻址模式
    addressModeV?: GPUAddressMode;    // V方向寻址模式
    addressModeW?: GPUAddressMode;    // W方向寻址模式
    magFilter?: GPUFilterMode;        // 放大过滤器
    minFilter?: GPUFilterMode;        // 缩小过滤器
    mipmapFilter?: GPUMipmapFilterMode; // Mipmap过滤器
    lodMinClamp?: number;             // 最小LOD裁剪
    lodMaxClamp?: number;             // 最大LOD裁剪
    maxAnisotropy?: number;           // 最大各向异性
    compare?: GPUCompareFunction;     // 比较函数（用于阴影贴图）
}
```

**示例：**
```typescript
// 创建基础采样器
const basicSampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear'
});

// 创建各向异性采样器
if (device.hasExtension('EXT_texture_filter_anisotropic')) {
    const anisotropicSampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        maxAnisotropy: 16
    });
}

// 创建阴影采样器
const shadowSampler = device.createSampler({
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    compare: 'less',
    minFilter: 'linear',
    magFilter: 'linear'
});
```

### 渲染命令创建

```typescript
// 创建命令编码器
createCommandEncoder(
    descriptor?: CommandEncoderDescriptor
): GLCommandEncoder

// 创建渲染通道
beginRenderPass(
    descriptor: RenderPassDescriptor
): GLRenderPass
```

**示例：**
```typescript
// 创建命令编码器
const encoder = device.createCommandEncoder({
    label: 'MainRenderEncoder'
});

// 开始渲染通道
const renderPass = encoder.beginRenderPass({
    colorAttachments: [{
        view: colorTexture.createView(),
        clearValue: { r: 0.1, g: 0.2, b: 0.3, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
    }],
    depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
    }
});

// 执行渲染命令
renderPass.setPipeline(pipeline);
renderPass.setVertexBuffer(0, vertexBuffer);
renderPass.setIndexBuffer(indexBuffer);
renderPass.drawIndexed(36);

// 结束渲染通道并提交
renderPass.end();
encoder.finish();
```

### 设备生命周期管理

#### 设备销毁

```typescript
destroy(): void
```

销毁设备和所有相关资源。

**示例：**
```typescript
// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (device && device.state !== DeviceState.DESTROYED) {
        device.destroy();
    }
});

// 手动销毁设备
function cleanup() {
    // 停止所有渲染
    stopRenderLoop();

    // 清理所有资源
    resourceManager.dispose();

    // 销毁设备
    device.destroy();

    console.log('设备已销毁');
}
```

#### 资源统计和监控

```typescript
// 获取资源统计信息
getResourceStats(): {
    buffers: number;
    textures: number;
    samplers: number;
    shaders: number;
    pipelines: number;
    totalMemory: number;
}

// 强制垃圾回收
gc(): void

// 获取性能统计
getPerformanceStats(): {
    drawCalls: number;
    triangles: number;
    frameTime: number;
    memoryUsage: number;
}
```

**示例：**
```typescript
// 定期监控资源使用
setInterval(() => {
    const stats = device.getResourceStats();
    const perfStats = device.getPerformanceStats();

    console.log('资源统计:', stats);
    console.log('性能统计:', perfStats);

    // 内存使用过高时清理
    if (stats.totalMemory > 512 * 1024 * 1024) { // 512MB
        device.gc();
    }
}, 5000);
```

### 错误处理

#### 错误监听

```typescript
onError(callback: (error: Error) => void): void
```

#### 常见错误类型

```typescript
// 设备错误
class DeviceError extends Error {
    constructor(message: string, public code: DeviceErrorCode) {
        super(message);
    }
}

enum DeviceErrorCode {
    CONTEXT_CREATION_FAILED = 'CONTEXT_CREATION_FAILED',
    CONTEXT_LOST = 'CONTEXT_LOST',
    INSUFFICIENT_CAPABILITIES = 'INSUFFICIENT_CAPABILITIES',
    RESOURCE_CREATION_FAILED = 'RESOURCE_CREATION_FAILED',
    INVALID_OPERATION = 'INVALID_OPERATION'
}
```

**示例：**
```typescript
// 设置错误处理
device.onError((error) => {
    console.error('设备错误:', error.message, error.code);

    switch (error.code) {
        case DeviceErrorCode.CONTEXT_LOST:
            // 尝试恢复上下文
            handleContextLoss();
            break;
        case DeviceErrorCode.INSUFFICIENT_CAPABILITIES:
            // 降级渲染质量
            reduceRenderQuality();
            break;
        default:
            // 其他错误处理
            showErrorMessage(error.message);
    }
});
```

### 完整使用示例

```typescript
class Renderer {
    private device: WebGLDevice;
    private animationId: number | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.device = new WebGLDevice(canvas, {
            antialias: true,
            alpha: false,
            depth: true,
            powerPreference: 'high-performance'
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        // 上下文事件
        this.device.onContextLost(this.handleContextLost.bind(this));
        this.device.onContextRestored(this.handleContextRestored.bind(this));

        // 错误处理
        this.device.onError(this.handleError.bind(this));
    }

    async initialize(): Promise<void> {
        try {
            await this.device.initialize();
            console.log('设备初始化成功');

            // 创建资源
            await this.createResources();

            // 开始渲染循环
            this.startRenderLoop();
        } catch (error) {
            console.error('初始化失败:', error);
            throw error;
        }
    }

    private async createResources() {
        const caps = this.device.capabilities;

        // 根据设备能力调整设置
        const maxTextureSize = Math.min(4096, caps.maxTextureSize);

        // 创建缓冲区
        this.createBuffers();

        // 创建纹理
        this.createTextures(maxTextureSize);

        // 创建渲染管线
        this.createPipelines();
    }

    private startRenderLoop() {
        const render = () => {
            this.render();
            this.animationId = requestAnimationFrame(render);
        };
        render();
    }

    private render() {
        if (this.device.state !== DeviceState.ACTIVE) {
            return;
        }

        const encoder = this.device.createCommandEncoder({
            label: 'RenderFrame'
        });

        // 执行渲染命令
        this.executeRenderPasses(encoder);

        encoder.finish();
    }

    private handleContextLost() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        console.log('渲染已暂停 - 上下文丢失');
    }

    private async handleContextRestored() {
        console.log('上下文已恢复，重新初始化...');
        try {
            await this.createResources();
            this.startRenderLoop();
        } catch (error) {
            console.error('恢复失败:', error);
        }
    }

    private handleError(error: Error) {
        console.error('渲染错误:', error);
        // 实现错误恢复逻辑
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.device && this.device.state !== DeviceState.DESTROYED) {
            this.device.destroy();
        }
    }
}

// 使用示例
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new Renderer(canvas);

renderer.initialize().catch(console.error);

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    renderer.dispose();
});
```

### 最佳实践

1. **错误处理**
   - 始终处理上下文丢失事件
   - 监听设备错误并实现恢复机制
   - 检查设备能力后再使用相应功能

2. **性能优化**
   - 定期监控资源使用情况
   - 及时释放不再使用的资源
   - 根据设备能力调整渲染质量

3. **内存管理**
   - 避免创建过多纹理
   - 复用缓冲区和纹理
   - 使用对象池管理临时资源

4. **调试技巧**
   - 使用标签标识资源
   - 启用WebGL调试扩展
   - 定期检查资源统计信息

5. **兼容性**
   - 检查扩展可用性
   - 提供功能降级方案
   - 处理不同设备的限制