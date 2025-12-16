# RHI 命令系统 API

## 概述

RHI 命令系统提供了一套高性能的渲染命令录制和回放机制。通过命令编码器（CommandEncoder）和命令缓冲（CommandBuffer），可以将渲染操作批量录制并一次性提交到 GPU，最大限度地减少 CPU-GPU 同步开销。

## 命令系统架构

### 核心组件

```typescript
// 命令编码器 - 负责录制命令
class GLCommandEncoder {
    readonly device: WebGLDevice;
    readonly label?: string;

    beginRenderPass(descriptor: RenderPassDescriptor): GLRenderPass;
    finish(): GLCommandBuffer;
    copyBufferToBuffer(source: GLBuffer, destination: GLBuffer, size: number): void;
    copyBufferToTexture(source: BufferCopyView, destination: TextureCopyView, copySize: [number, number, number]): void;
    copyTextureToBuffer(source: TextureCopyView, destination: BufferCopyView, copySize: [number, number, number]): void;
    copyTextureToTexture(source: TextureCopyView, destination: TextureCopyView, copySize: [number, number, number]): void;
}

// 命令缓冲 - 存储录制的命令
class GLCommandBuffer {
    readonly commands: CommandRecord[];
    execute(): void;
}

// 渲染通道 - 管理渲染目标
class GLRenderPass {
    setPipeline(pipeline: GLRenderPipeline): void;
    setVertexBuffer(index: number, buffer: GLBuffer, offset?: number): void;
    setIndexBuffer(buffer: GLBuffer, indexFormat: GPUIndexFormat, offset?: number, size?: number): void;
    setBindGroup(index: number, bindGroup: GLBindGroup): void;
    draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;
    drawIndexed(indexCount: number, instanceCount?: number, firstIndex?: number, baseVertex?: number, firstInstance?: number): void;
    end(): void;
}
```

## GLCommandEncoder - 命令编码器

### 创建命令编码器

```typescript
const encoder = device.createCommandEncoder({
    label: 'MainRenderPass'
});
```

### 渲染通道

```typescript
interface RenderPassDescriptor {
    colorAttachments: ColorAttachment[];
    depthStencilAttachment?: DepthStencilAttachment;
    readonly label?: string;
}

interface ColorAttachment {
    view: GLTextureView;                    // 渲染目标视图
    resolveTarget?: GLTextureView;          // 多重采样解析目标
    clearValue?: GPUColor;                  // 清除值
    loadOp: GPULoadOp;                      // 加载操作
    storeOp: GPUStoreOp;                    // 存储操作
}

interface DepthStencilAttachment {
    view: GLTextureView;
    depthClearValue?: number;
    depthLoadOp: GPULoadOp;
    depthStoreOp: GPUStoreOp;
    depthReadOnly?: boolean;
    stencilClearValue?: number;
    stencilLoadOp: GPULoadOp;
    stencilStoreOp: GPUStoreOp;
    stencilReadOnly?: boolean;
}
```

#### 渲染通道示例

```typescript
// 基础渲染通道
const renderPass = encoder.beginRenderPass({
    label: 'MainSceneRender',
    colorAttachments: [{
        view: renderTarget.createView(),
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

// 多重采样渲染通道
const msaaRenderPass = encoder.beginRenderPass({
    colorAttachments: [{
        view: msaaColorTexture.createView(),
        resolveTarget: resolveTexture.createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
    }],
    depthStencilAttachment: {
        view: msaaDepthTexture.createView(),
        resolveTarget: resolveDepthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
    }
});
```

#### 分层渲染（Layered Rendering）

```typescript
// 立方体贴图渲染
for (let face = 0; face < 6; face++) {
    const cubeFacePass = encoder.beginRenderPass({
        colorAttachments: [{
            view: cubeTexture.createView({
                dimension: '2d',
                baseArrayLayer: face,
                arrayLayerCount: 1
            }),
            clearValue: { r: 0, g: 0, b: 0, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store'
        }],
        depthStencilAttachment: {
            view: cubeDepthTexture.createView({
                dimension: '2d',
                baseArrayLayer: face,
                arrayLayerCount: 1
            }),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store'
        }
    });

    // 渲染到立方体的这个面
    renderCubeFace(cubeFacePass, face);
    cubeFacePass.end();
}
```

### 资源复制操作

#### 缓冲区复制

```typescript
// 缓冲区到缓冲区复制
encoder.copyBufferToBuffer(
    srcBuffer,      // 源缓冲区
    srcOffset,      // 源偏移
    dstBuffer,      // 目标缓冲区
    dstOffset,      // 目标偏移
    size           // 复制大小
);

// 复制整个缓冲区
encoder.copyBufferToBuffer(
    vertexBuffer, 0,
    instanceBuffer, vertexBuffer.size, vertexBuffer.size
);
```

#### 缓冲区到纹理复制

```typescript
// 将像素数据从缓冲区复制到纹理
encoder.copyBufferToTexture(
    {
        buffer: pixelBuffer,
        offset: 0,
        bytesPerRow: width * 4,
        rowsPerImage: height
    },
    {
        texture: targetTexture,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: 0 }
    },
    [width, height, 1]
);
```

#### 纹理到缓冲区复制

```typescript
// 从纹理读取像素数据到缓冲区
encoder.copyTextureToBuffer(
    {
        texture: sourceTexture,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: 0 }
    },
    {
        buffer: readbackBuffer,
        offset: 0,
        bytesPerRow: width * 4,
        rowsPerImage: height
    },
    [width, height, 1]
);
```

#### 纹理到纹理复制

```typescript
// 在纹理之间复制数据（常用于生成mipmap）
encoder.copyTextureToTexture(
    {
        texture: sourceTexture,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: 0 }
    },
    {
        texture: destinationTexture,
        mipLevel: 1,
        origin: { x: 0, y: 0, z: 0 }
    },
    [Math.floor(width / 2), Math.floor(height / 2), 1]
);
```

## GLRenderPass - 渲染通道

### 管线绑定

```typescript
// 设置渲染管线
renderPass.setPipeline(forwardPipeline);

// 动态切换管线
if (material.isOpaque) {
    renderPass.setPipeline(opaquePipeline);
} else {
    renderPass.setPipeline(transparentPipeline);
}
```

### 资源绑定

#### 缓冲区绑定

```typescript
// 绑定顶点缓冲区
renderPass.setVertexBuffer(0, vertexBuffer);  // 位置数据
renderPass.setVertexBuffer(1, normalBuffer);  // 法线数据
renderPass.setVertexBuffer(2, uvBuffer);      // UV数据

// 带偏移的缓冲区绑定
renderPass.setVertexBuffer(3, interleavedBuffer, 0);     // 位置
renderPass.setVertexBuffer(4, interleavedBuffer, 12);    // 法线（12字节偏移）
renderPass.setVertexBuffer(5, interleavedBuffer, 24);    // UV（24字节偏移）

// 绑定索引缓冲区
renderPass.setIndexBuffer(indexBuffer, 'uint16', 0, indexCount * 2);
```

#### 绑定组设置

```typescript
// 绑定统一数据
renderPass.setBindGroup(0, cameraBindGroup);     // 相机UBO
renderPass.setBindGroup(1, materialBindGroup);   // 材质数据
renderPass.setBindGroup(2, lightBindGroup);      // 光照数据

// 实例化绘制时的绑定组更新
for (let i = 0; i < instanceCount; i++) {
    renderPass.setBindGroup(3, instanceBindGroups[i]);
    renderPass.draw(36, 1, 0, 0);
}
```

### 绘制命令

#### 基础绘制

```typescript
// 非索引绘制
renderPass.draw(vertexCount, instanceCount, firstVertex, firstInstance);

// 绘制单个网格
renderPass.draw(mesh.vertexCount);

// 实例化绘制
renderPass.draw(mesh.vertexCount, 100); // 100个实例
```

#### 索引绘制

```typescript
// 索引绘制
renderPass.drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance);

// 绘制单个网格
renderPass.drawIndexed(mesh.indexCount);

// 实例化索引绘制
renderPass.drawIndexed(mesh.indexCount, 50, 0, 0, 0); // 50个实例

// 部分网格绘制
renderPass.drawIndexed(mesh.indexCount, 1, mesh.startIndex, 0, 0);
```

#### 间接绘制（如果支持）

```typescript
// 间接绘制（需要扩展支持）
if (device.hasExtension('WEBGL_draw_instanced_base_vertex_base_instance')) {
    renderPass.drawIndirect(indirectBuffer, offset);
    renderPass.drawIndexedIndirect(indirectBuffer, offset);
}
```

### 渲染状态控制

```typescript
// 视口设置
renderPass.setViewport(x, y, width, height, minDepth, maxDepth);

// 裁剪矩形设置
renderPass.setScissorRect(x, y, width, height);

// 混合常量设置（如果管线使用混合常量）
renderPass.setBlendConstant({ r, g, b, a });

// 模板参考值设置
renderPass.setStencilReference(reference);
```

## 高级命令使用

### 多通道渲染

```typescript
function renderScene(encoder: GLCommandEncoder) {
    // G-Buffer生成
    const gBufferPass = encoder.beginRenderPass({
        colorAttachments: [
            { view: albedoTexture.createView(), loadOp: 'clear', storeOp: 'store' },
            { view: normalTexture.createView(), loadOp: 'clear', storeOp: 'store' },
            { view: roughnessMetallicTexture.createView(), loadOp: 'clear', storeOp: 'store' }
        ],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthLoadOp: 'clear',
            depthStoreOp: 'store'
        }
    });

    // 渲染所有几何体到G-Buffer
    gBufferPass.setPipeline(gBufferPipeline);
    renderGeometry(gBufferPass);
    gBufferPass.end();

    // 延迟光照
    const lightingPass = encoder.beginRenderPass({
        colorAttachments: [{
            view: finalTexture.createView(),
            loadOp: 'load',
            storeOp: 'store'
        }]
    });

    lightingPass.setPipeline(lightingPipeline);
    lightingPass.setBindGroup(0, lightingBindGroup);
    lightingPass.draw(3); // 全屏三角形
    lightingPass.end();

    // 透明物体前向渲染
    const forwardPass = encoder.beginRenderPass({
        colorAttachments: [{
            view: finalTexture.createView(),
            loadOp: 'load',
            storeOp: 'store'
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthLoadOp: 'load',
            depthStoreOp: 'store'
        }
    });

    forwardPass.setPipeline(forwardPipeline);
    renderTransparentGeometry(forwardPass);
    forwardPass.end();
}
```

### 阴影贴图渲染

```typescript
function renderShadowMaps(encoder: GLCommandEncoder, lights: Light[]) {
    lights.forEach((light, lightIndex) => {
        if (!light.castShadow) return;

        const shadowPass = encoder.beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: {
                view: shadowMaps[lightIndex].createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        });

        shadowPass.setPipeline(shadowPipeline);
        shadowPass.setViewport(0, 0, shadowMapSize, shadowMapSize, 0, 1);
        shadowPass.setBindGroup(0, light.shadowBindGroup);

        // 从光源视角渲染场景
        renderSceneFromLightView(shadowPass, light);
        shadowPass.end();
    });
}
```

### 后处理效果链

```typescript
function applyPostProcess(encoder: GLCommandEncoder, sourceTexture: GLTexture) {
    let currentSource = sourceTexture;

    // 亮度调整
    const brightnessPass = encoder.beginRenderPass({
        colorAttachments: [{
            view: tempTexture1.createView(),
            loadOp: 'clear',
            storeOp: 'store'
        }]
    });
    brightnessPass.setPipeline(brightnessPipeline);
    brightnessPass.setBindGroup(0, {
        uniform: brightnessUniformBuffer,
        texture: { view: currentSource.createView() }
    });
    brightnessPass.draw(3);
    brightnessPass.end();

    currentSource = tempTexture1;

    // 高斯模糊（水平）
    const blurHPass = encoder.beginRenderPass({
        colorAttachments: [{
            view: tempTexture2.createView(),
            loadOp: 'clear',
            storeOp: 'store'
        }]
    });
    blurHPass.setPipeline(blurPipeline);
    blurHPass.setBindGroup(0, {
        uniform: blurHUniformBuffer,
        texture: { view: currentSource.createView() }
    });
    blurHPass.draw(3);
    blurHPass.end();

    currentSource = tempTexture2;

    // 高斯模糊（垂直）
    const blurVPass = encoder.beginRenderPass({
        colorAttachments: [{
            view: tempTexture1.createView(),
            loadOp: 'clear',
            storeOp: 'store'
        }]
    });
    blurVPass.setPipeline(blurPipeline);
    blurVPass.setBindGroup(0, {
        uniform: blurVUniformBuffer,
        texture: { view: currentSource.createView() }
    });
    blurVPass.draw(3);
    blurVPass.end();

    // 最终合成
    const composePass = encoder.beginRenderPass({
        colorAttachments: [{
            view: finalTexture.createView(),
            loadOp: 'clear',
            storeOp: 'store'
        }]
    });
    composePass.setPipeline(composePipeline);
    composePass.setBindGroup(0, {
        uniform: composeUniformBuffer,
        texture: {
            original: { view: sourceTexture.createView() },
            blurred: { view: tempTexture1.createView() }
        }
    });
    composePass.draw(3);
    composePass.end();
}
```

## 命令批量优化

### 命令缓冲池

```typescript
class CommandBufferPool {
    private buffers: GLCommandBuffer[] = [];
    private maxSize = 10;

    getCommandBuffer(): GLCommandBuffer {
        if (this.buffers.length > 0) {
            return this.buffers.pop()!;
        }
        return new GLCommandBuffer();
    }

    releaseCommandBuffer(buffer: GLCommandBuffer) {
        if (this.buffers.length < this.maxSize) {
            buffer.reset();
            this.buffers.push(buffer);
        }
    }
}

// 使用命令池
const commandPool = new CommandBufferPool();

function renderFrame() {
    const encoder = device.createCommandEncoder();
    const commandBuffer = commandPool.getCommandBuffer();

    // 录制命令
    renderScene(encoder);
    const recordedBuffer = encoder.finish();

    // 合并命令并执行
    commandBuffer.merge(recordedBuffer);
    commandBuffer.execute();

    // 释放回池
    commandPool.releaseCommandBuffer(commandBuffer);
}
```

### 命令合并策略

```typescript
class CommandBatcher {
    private batches: Map<string, GLCommandEncoder> = new Map();

    startBatch(batchId: string): GLCommandEncoder {
        if (!this.batches.has(batchId)) {
            this.batches.set(batchId, device.createCommandEncoder());
        }
        return this.batches.get(batchId)!;
    }

    executeAll(): GLCommandBuffer[] {
        const buffers: GLCommandBuffer[] = [];

        for (const [batchId, encoder] of this.batches) {
            buffers.push(encoder.finish());
        }

        this.batches.clear();
        return buffers;
    }
}

// 批量渲染优化
function batchRender(objects: RenderObject[]) {
    const batcher = new CommandBatcher();

    // 按管线和材质分组
    const groups = groupObjectsByPipeline(objects);

    groups.forEach(group => {
        const encoder = batcher.startBatch(group.pipelineId);
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: renderTarget.createView(),
                loadOp: 'load',
                storeOp: 'store'
            }]
        });

        pass.setPipeline(group.pipeline);
        pass.setBindGroup(0, group.sharedBindGroup);

        // 批量绘制相同材质的对象
        group.objects.forEach(obj => {
            pass.setVertexBuffer(0, obj.vertexBuffer);
            pass.setIndexBuffer(obj.indexBuffer, 'uint16');
            pass.setBindGroup(1, obj.transformBindGroup);
            pass.drawIndexed(obj.indexCount);
        });

        pass.end();
    });

    // 执行所有批次
    const commandBuffers = batcher.executeAll();
    commandBuffers.forEach(buffer => buffer.execute());
}
```

### 状态缓存优化

```typescript
class StateCache {
    private currentPipeline: GLRenderPipeline | null = null;
    private currentBindGroups: (GLBindGroup | null)[] = [];
    private currentVertexBuffers: (GLBuffer | null)[] = [];
    private currentIndexBuffer: GLBuffer | null = null;

    setPipeline(renderPass: GLRenderPass, pipeline: GLRenderPipeline) {
        if (this.currentPipeline !== pipeline) {
            renderPass.setPipeline(pipeline);
            this.currentPipeline = pipeline;
        }
    }

    setBindGroup(renderPass: GLRenderPass, index: number, bindGroup: GLBindGroup) {
        if (this.currentBindGroups[index] !== bindGroup) {
            renderPass.setBindGroup(index, bindGroup);
            this.currentBindGroups[index] = bindGroup;
        }
    }

    setVertexBuffer(renderPass: GLRenderPass, index: number, buffer: GLBuffer, offset?: number) {
        const cacheKey = `${index}_${offset || 0}`;
        if (this.currentVertexBuffers[index] !== buffer) {
            renderPass.setVertexBuffer(index, buffer, offset);
            this.currentVertexBuffers[index] = buffer;
        }
    }

    // 每个渲染通道开始时重置缓存
    reset() {
        this.currentPipeline = null;
        this.currentBindGroups = [];
        this.currentVertexBuffers = [];
        this.currentIndexBuffer = null;
    }
}
```

## 错误处理和调试

### 命令验证

```typescript
class CommandValidator {
    validateRenderPass(renderPass: GLRenderPass): boolean {
        try {
            // 检查必要的管线是否设置
            if (!renderPass.pipeline) {
                console.error('渲染通道未设置管线');
                return false;
            }

            // 检查顶点缓冲区
            if (renderPass.needsVertexBuffer && !renderPass.vertexBuffer) {
                console.error('渲染通道缺少顶点缓冲区');
                return false;
            }

            return true;
        } catch (error) {
            console.error('渲染通道验证失败:', error);
            return false;
        }
    }

    validateDrawCall(renderPass: GLRenderPass, drawInfo: DrawInfo): boolean {
        // 检查绘制参数的有效性
        if (drawInfo.vertexCount <= 0) {
            console.warn('无效的顶点数量:', drawInfo.vertexCount);
            return false;
        }

        if (drawInfo.instanceCount <= 0) {
            console.warn('无效的实例数量:', drawInfo.instanceCount);
            return false;
        }

        return true;
    }
}
```

### 性能分析

```typescript
class CommandProfiler {
    private timings: Map<string, number[]> = new Map();

    startTiming(name: string): number {
        return performance.now();
    }

    endTiming(name: string, startTime: number) {
        const duration = performance.now() - startTime;
        const timings = this.timings.get(name) || [];
        timings.push(duration);

        // 保留最近100次采样
        if (timings.length > 100) {
            timings.shift();
        }

        this.timings.set(name, timings);
    }

    getStats(name: string): { avg: number; min: number; max: number } {
        const timings = this.timings.get(name) || [];
        if (timings.length === 0) {
            return { avg: 0, min: 0, max: 0 };
        }

        const sum = timings.reduce((a, b) => a + b, 0);
        const avg = sum / timings.length;
        const min = Math.min(...timings);
        const max = Math.max(...timings);

        return { avg, min, max };
    }

    printReport() {
        console.log('命令性能报告:');
        for (const [name, stats] of this.timings.entries()) {
            const { avg, min, max } = this.getStats(name);
            console.log(`${name}: 平均=${avg.toFixed(2)}ms, 最小=${min.toFixed(2)}ms, 最大=${max.toFixed(2)}ms`);
        }
    }
}
```

## 完整渲染循环示例

```typescript
class Renderer {
    private device: WebGLDevice;
    private profiler = new CommandProfiler();
    private commandPool = new CommandBufferPool();
    private stateCache = new StateCache();

    render(deltaTime: number) {
        const frameStartTime = performance.now();

        // 创建主命令编码器
        const encoder = this.device.createCommandEncoder({
            label: 'MainFrame'
        });

        // 渲染阴影贴图
        const shadowStartTime = this.profiler.startTiming('ShadowPass');
        this.renderShadows(encoder);
        this.profiler.endTiming('ShadowPass', shadowStartTime);

        // 主场景渲染
        const mainStartTime = this.profiler.startTiming('MainPass');
        this.renderMainScene(encoder);
        this.profiler.endTiming('MainPass', mainStartTime);

        // 后处理
        const postProcessStartTime = this.profiler.startTiming('PostProcess');
        this.applyPostProcess(encoder);
        this.profiler.endTiming('PostProcess', postProcessStartTime);

        // UI渲染
        const uiStartTime = this.profiler.startTiming('UIPass');
        this.renderUI(encoder);
        this.profiler.endTiming('UIPass', uiStartTime);

        // 提交命令
        const commandBuffer = encoder.finish();
        commandBuffer.execute();

        // 性能统计
        const frameTime = performance.now() - frameStartTime;
        if (frameTime > 16.67) { // 超过60fps阈值
            console.warn(`帧时间过长: ${frameTime.toFixed(2)}ms`);
            this.profiler.printReport();
        }
    }

    private renderMainScene(encoder: GLCommandEncoder) {
        const renderPass = encoder.beginRenderPass({
            label: 'MainScene',
            colorAttachments: [{
                view: this.renderTarget.createView(),
                clearValue: { r: 0.1, g: 0.2, b: 0.3, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        });

        // 重置状态缓存
        this.stateCache.reset();

        // 按渲染顺序排序
        const sortedObjects = this.sceneObjects.sort((a, b) => {
            if (a.material.transparent && !b.material.transparent) return 1;
            if (!a.material.transparent && b.material.transparent) return -1;
            return b.material.id - a.material.id;
        });

        // 批量渲染
        let currentPipeline = null;
        let currentBindGroup = null;

        for (const obj of sortedObjects) {
            // 切换管线（如果需要）
            if (obj.pipeline !== currentPipeline) {
                this.stateCache.setPipeline(renderPass, obj.pipeline);
                currentPipeline = obj.pipeline;
            }

            // 切换绑定组（如果需要）
            if (obj.material.bindGroup !== currentBindGroup) {
                this.stateCache.setBindGroup(renderPass, 1, obj.material.bindGroup);
                currentBindGroup = obj.material.bindGroup;
            }

            // 设置变换
            this.stateCache.setBindGroup(renderPass, 0, obj.transformBindGroup);

            // 绑定顶点数据
            this.stateCache.setVertexBuffer(renderPass, 0, obj.vertexBuffer);
            this.stateCache.setIndexBuffer(renderPass, obj.indexBuffer);

            // 绘制
            if (obj.useIndexBuffer) {
                renderPass.drawIndexed(obj.indexCount, 1, 0, 0, 0);
            } else {
                renderPass.draw(obj.vertexCount, 1, 0, 0);
            }
        }

        renderPass.end();
    }

    // ... 其他渲染方法
}
```

## 总结

RHI 命令系统 API 提供了：

1. **高效命令录制** - 最小化 CPU-GPU 通信开销
2. **灵活的渲染通道** - 支持多种渲染目标配置
3. **批量操作优化** - 减少状态切换和draw call数量
4. **完整的资源操作** - 缓冲区和纹理的复制操作
5. **性能分析工具** - 帮助识别和解决性能瓶颈

正确使用命令系统可以显著提升 WebGL 应用的渲染性能，特别是在复杂场景中。