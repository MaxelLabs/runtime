# RHI (Render Hardware Interface) API 文档

## 概述

RHI 是一个高级的 WebGL 渲染硬件接口抽象层，为 Web 平台提供了现代图形 API 的编程模型。它封装了底层 WebGL 2.0 的复杂性，提供了类型安全、高性能的渲染 API。

本文档基于 RHI 库的实际源代码（`packages/rhi/src/`），提供完整、准确的 API 参考和实用的代码示例。

## 核心特性

- **类型安全的 TypeScript API** - 完整的类型定义和智能提示
- **现代图形编程模型** - 命令缓冲、资源绑定、管线配置
- **高性能渲染** - 批量命令、状态缓存、资源池
- **跨平台兼容** - 统一的 WebGL 2.0 接口
- **调试支持** - 丰富的错误检测和性能分析工具

## API 架构概览

```
RHI Architecture
├── Device Management (设备管理)
│   ├── WebGLDevice - 主设备类
│   ├── 上下文管理
│   ├── 扩展管理
│   └── 设备能力查询
├── Resource Management (资源管理)
│   ├── GLBuffer - 缓冲区资源
│   ├── GLTexture - 纹理资源
│   ├── GLSampler - 采样器
│   └── ResourceTracker - 资源追踪
├── Command System (命令系统)
│   ├── GLCommandEncoder - 命令编码器
│   ├── GLCommandBuffer - 命令缓冲
│   └── GLRenderPass - 渲染通道
└── Pipeline System (管线系统)
    ├── GLRenderPipeline - 渲染管线
    ├── GLShader - 着色器模块
    ├── GLPipelineLayout - 管线布局
    └── GLBindGroup - 绑定组
```

## 快速开始

### 基础渲染流程

```typescript
// 1. 创建设备
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const device = new WebGLDevice(canvas, {
    antialias: true,
    depth: true
});

await device.initialize();

// 2. 创建资源
const vertexBuffer = device.createBuffer({
    size: vertices.length * 4 * 3,
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
    data: new Float32Array(vertices)
});

const colorTexture = device.createTexture({
    size: [1920, 1080],
    format: 'rgba16float',
    usage: TextureUsage.RENDER_ATTACHMENT | TextureUsage.TEXTURE_BINDING
});

// 3. 创建管线
const pipeline = new GLRenderPipeline(device, {
    vertex: { module: vertexShader, entryPoint: 'main', buffers: [...] },
    fragment: { module: fragmentShader, entryPoint: 'main', targets: [...] },
    primitive: { topology: 'triangle-list', cullMode: 'back' }
});

// 4. 渲染循环
function render() {
    const encoder = device.createCommandEncoder();

    const renderPass = encoder.beginRenderPass({
        colorAttachments: [{
            view: colorTexture.createView(),
            loadOp: 'clear',
            storeOp: 'store'
        }]
    });

    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.draw(vertexCount);
    renderPass.end();

    encoder.finish();
    requestAnimationFrame(render);
}

render();
```

### 资源管理最佳实践

```typescript
class Renderer {
    private resourceTracker = new ResourceTracker();
    private pipelineCache = new PipelineCache();

    constructor(private device: WebGLDevice) {}

    async loadMesh(meshData: any): Promise<Mesh> {
        const vertexBuffer = new GLBuffer(this.device, {
            size: meshData.vertices.byteLength,
            usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
            data: meshData.vertices,
            label: `Mesh_${meshData.id}_VB`
        });

        const indexBuffer = new GLBuffer(this.device, {
            size: meshData.indices.byteLength,
            usage: BufferUsage.INDEX | BufferUsage.COPY_DST,
            data: meshData.indices,
            label: `Mesh_${meshData.id}_IB`
        });

        // 自动资源追踪
        const mesh = new Mesh(
            this.resourceTracker.track(vertexBuffer),
            this.resourceTracker.track(indexBuffer)
        );

        return mesh;
    }

    dispose() {
        this.resourceTracker.dispose();
        this.pipelineCache.clear();
    }
}
```

## API 文档导航

### [设备管理 API](./device/index.md)
详细的设备创建、状态管理、上下文处理和扩展支持文档。

- **WebGLDevice 类** - 核心设备管理
- **设备状态** - ACTIVE/LOST/DESTROYED 状态处理
- **上下文管理** - 丢失恢复、错误处理
- **扩展支持** - 扩展检测和使用
- **设备能力** - GPU能力查询和限制处理

### [资源管理 API](./resources/index.md)
缓冲区、纹理、采样器等资源的创建、使用和管理文档。

- **GLBuffer** - 顶点、索引、统一缓冲区
- **GLTexture** - 2D、3D、立方体、数组纹理
- **GLSampler** - 纹理采样配置
- **ResourceTracker** - 自动资源追踪和释放
- **资源池** - 内存优化和重用策略

### [命令系统 API](./commands/index.md)
命令录制、回放和批量操作的完整文档。

- **GLCommandEncoder** - 命令录制接口
- **GLCommandBuffer** - 命令存储和执行
- **GLRenderPass** - 渲染通道管理
- **批量优化** - 命令合并和状态缓存
- **高级用法** - 多通道渲染、延迟渲染

### [渲染管线 API](./pipeline/index.md)
管线配置、着色器管理和绑定系统的详细文档。

- **GLRenderPipeline** - 渲染管线创建和配置
- **GLShader** - 着色器模块管理
- **GLPipelineLayout** - 绑定组布局
- **渲染状态** - 深度测试、混合、裁剪等
- **管线变体** - 动态管线配置系统

## 性能优化指南

### 1. 批量操作

```typescript
// ✅ 推荐：批量相同资源的对象
function batchRender(objects: RenderObject[]) {
    const groups = groupByMaterial(objects);

    groups.forEach(group => {
        renderPass.setPipeline(group.pipeline);
        renderPass.setBindGroup(0, group.sharedBindGroup);

        group.objects.forEach(obj => {
            renderPass.setBindGroup(1, obj.transformBindGroup);
            renderPass.drawIndexed(obj.indexCount);
        });
    });
}

// ❌ 避免：频繁的状态切换
function individualRender(objects: RenderObject[]) {
    objects.forEach(obj => {
        renderPass.setPipeline(obj.pipeline);  // 每个对象都设置
        renderPass.drawIndexed(obj.indexCount);
    });
}
```

### 2. 资源重用

```typescript
// ✅ 推荐：使用资源池
class TexturePool {
    private pool: Map<string, GLTexture[]> = new Map();

    getTexture(descriptor: TextureDescriptor): GLTexture {
        const key = this.getKey(descriptor);
        const pool = this.pool.get(key) || [];
        return pool.pop() || new GLTexture(device, descriptor);
    }

    releaseTexture(texture: GLTexture) {
        const key = this.getKey(texture.descriptor);
        const pool = this.pool.get(key) || [];
        pool.push(texture);
        this.pool.set(key, pool);
    }
}
```

### 3. 命令缓冲优化

```typescript
// ✅ 推荐：合并小的渲染操作
function optimizeCommands(renderPass: GLRenderPass) {
    // 合并小的draw call
    const vertices = [];
    const indices = [];
    const baseVertex = 0;

    objects.forEach(obj => {
        vertices.push(...obj.vertices);
        indices.push(...obj.indices.map(i => i + baseVertex));
        baseVertex += obj.vertexCount;
    });

    // 一次性绘制所有合并的几何体
    renderPass.setVertexBuffer(0, mergedVertexBuffer);
    renderPass.setIndexBuffer(mergedIndexBuffer);
    renderPass.drawIndexed(mergedIndexCount);
}
```

### 4. 内存管理

```typescript
// ✅ 推荐：定期清理不活跃资源
class ResourceManager {
    private resourceTracker = new ResourceTracker();
    private lastCleanup = Date.now();
    private cleanupInterval = 60000; // 60秒

    update() {
        // 定期清理
        if (Date.now() - this.lastCleanup > this.cleanupInterval) {
            this.cleanupInactiveResources();
            this.lastCleanup = Date.now();
        }
    }

    private cleanupInactiveResources() {
        // 释放未使用的资源
        const stats = this.resourceTracker.getStats();
        if (stats.totalMemory > 256 * 1024 * 1024) { // 256MB
            this.resourceTracker.dispose();
            this.resourceTracker = new ResourceTracker();
        }
    }
}
```

## 错误处理和调试

### 错误处理策略

```typescript
class RobustRenderer {
    constructor(private device: WebGLDevice) {
        // 设置错误处理
        this.device.onError(this.handleDeviceError.bind(this));
        this.device.onContextLost(this.handleContextLost.bind(this));
        this.device.onContextRestored(this.handleContextRestored.bind(this));
    }

    private handleDeviceError(error: Error) {
        console.error('设备错误:', error);
        this.notifyUser('渲染错误，尝试恢复...');
        this.attemptRecovery();
    }

    private handleContextLost() {
        console.warn('WebGL上下文丢失');
        this.pauseRendering();
        this.showLoadingScreen();
    }

    private async handleContextRestored() {
        console.log('WebGL上下文已恢复');
        try {
            await this.recreateResources();
            this.resumeRendering();
        } catch (error) {
            console.error('恢复失败:', error);
            this.showFatalError();
        }
    }
}
```

### 性能监控

```typescript
class PerformanceMonitor {
    private frameTimings: number[] = [];
    private drawCallCount = 0;

    startFrame() {
        this.frameStartTime = performance.now();
        this.drawCallCount = 0;
    }

    endFrame() {
        const frameTime = performance.now() - this.frameStartTime;
        this.frameTimings.push(frameTime);

        // 保留最近60帧
        if (this.frameTimings.length > 60) {
            this.frameTimings.shift();
        }

        this.reportPerformance();
    }

    incrementDrawCalls() {
        this.drawCallCount++;
    }

    private reportPerformance() {
        if (this.frameTimings.length % 60 === 0) {
            const avgFrameTime = this.frameTimings.reduce((a, b) => a + b, 0) / this.frameTimings.length;
            const fps = 1000 / avgFrameTime;

            console.log(`性能统计: FPS=${fps.toFixed(1)}, DrawCalls=${this.drawCallCount}`);

            if (fps < 30) {
                console.warn('性能警告: FPS低于30');
                this.suggestOptimizations();
            }
        }
    }
}
```

## 扩展和自定义

### 自定义渲染效果

```typescript
class CustomEffectRenderer {
    private effectPipelines = new Map<string, GLRenderPipeline>();

    registerEffect(name: string, shaderCode: string) {
        const shader = new GLShader(this.device, {
            type: ShaderType.FRAGMENT,
            source: shaderCode
        });

        const pipeline = new GLRenderPipeline(this.device, {
            label: `${name}Pipeline`,
            vertex: this.getFullscreenVertexShader(),
            fragment: { module: shader, entryPoint: 'main', targets: [...] },
            // ... 其他配置
        });

        this.effectPipelines.set(name, pipeline);
    }

    applyEffect(renderPass: GLRenderPass, effectName: string, input: GLTexture) {
        const pipeline = this.effectPipelines.get(effectName);
        if (!pipeline) {
            console.error(`效果未找到: ${effectName}`);
            return;
        }

        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, {
            texture: { view: input.createView() },
            sampler: this.defaultSampler
        });
        renderPass.draw(3); // 全屏三角形
    }
}
```

## 常见问题解答

### Q: 如何处理不同设备的兼容性？
A: 使用设备能力查询和功能降级：
```typescript
const caps = device.capabilities;
const maxTextureSize = Math.min(4096, caps.maxTextureSize);

if (!caps.supportsInstancedArrays) {
    // 降级到普通渲染
    useInstancedRendering = false;
}
```

### Q: 如何优化内存使用？
A: 使用资源池、及时释放资源、压缩纹理：
```typescript
// 使用压缩纹理
if (device.hasExtension('WEBGL_compressed_texture_s3tc')) {
    textureFormat = 'bc1-rgba-unorm';
}

// 及时释放
resourceTracker.dispose();
```

### Q: 如何调试渲染问题？
A: 启用调试标签、错误处理、性能监控：
```typescript
// 启用调试标签
const buffer = new GLBuffer(device, {
    data,
    label: 'Debug_Mesh_VertexBuffer'
});

// 错误处理
device.onError(console.error);
```

## 参考资源

- **源码位置**: `packages/rhi/src/`
- **演示代码**: `packages/rhi/demo/`
- **类型定义**: `packages/rhi/src/types/`
- **工具模块**: `packages/rhi/demo/src/utils/`

## 版本信息

- **当前版本**: 基于 `packages/rhi` 的最新源码
- **兼容性**: WebGL 2.0 (OpenGL ES 3.0)
- **TypeScript**: 4.5+
- **浏览器**: 支持WebGL 2.0的现代浏览器

## 贡献指南

API文档基于实际源码自动维护。如需更新或修正文档：

1. 检查 `packages/rhi/src/` 中的实际实现
2. 确保文档与代码一致
3. 添加实用的代码示例
4. 验证示例代码的可运行性

---

*最后更新: 基于当前源码生成*