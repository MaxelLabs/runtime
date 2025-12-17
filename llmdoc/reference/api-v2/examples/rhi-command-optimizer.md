---
title: "RHI命令优化器"
description: "RHI渲染命令的批量处理、状态优化和性能提升工具，减少GPU状态切换开销"
tags: ["rhi", "command-optimization", "batch-processing", "state-cache", "gpu-performance", "rendering"]
category: "reference"
audience: "developer"
version: "1.0.0"
last_updated: "2025-12-17"
related_docs: ["performance-analyzer.md", "math-object-pool-optimization.md", "performance-optimization-demo.md"]
prerequisites: ["performance-optimization.md", "../rhi/pipeline/index.md"]
complexity: "advanced"
estimated_read_time: 20
---

# RHI命令优化器

## 概述

RHI命令优化器通过批量处理、状态缓存、智能排序等技术，显著减少GPU状态切换次数，提升渲染性能。主要特性包括渲染命令批处理、状态缓存优化、实例化渲染和透明度排序。

## 核心实现

### 1. 渲染命令定义

```typescript
/**
 * rhi-command-types.ts
 * RHI渲染命令类型定义
 */

import { MSpec } from '@maxellabs/core';

export enum RenderCommandType {
    DRAW = 'draw',
    DRAW_INDEXED = 'draw_indexed',
    DRAW_INSTANCED = 'draw_instanced',
    SET_PIPELINE = 'set_pipeline',
    SET_BIND_GROUP = 'set_bind_group',
    SET_VERTEX_BUFFER = 'set_vertex_buffer',
    SET_INDEX_BUFFER = 'set_index_buffer'
}

/**
 * 优化的渲染命令
 */
export interface OptimizedRenderCommand {
    type: RenderCommandType;
    pipeline: MSpec.IRHIRenderPipeline;
    bindGroups: MSpec.IRHIBindGroup[];
    vertexBuffers: MSpec.IRHIBuffer[];
    indexBuffer?: MSpec.IRHIBuffer;
    vertexCount?: number;
    indexCount?: number;
    instanceCount?: number;
    priority: number;      // 渲染优先级
    materialId: string;    // 材质ID (用于批处理)
    depth: number;        // 深度值 (用于排序)
    transparent: boolean; // 是否透明
}

/**
 * 批处理组
 */
export interface BatchGroup {
    pipeline: MSpec.IRHIRenderPipeline;
    bindGroups: MSpec.IRHIBindGroup[];
    instances: RenderInstance[];
    materialId: string;
    transparent: boolean;
}

/**
 * 渲染实例
 */
export interface RenderInstance {
    vertexBuffer: MSpec.IRHIBuffer;
    indexBuffer?: MSpec.IRHIBuffer;
    vertexCount: number;
    indexCount?: number;
    transform: Float32Array;
    materialData?: Float32Array;
}
```

### 2. 状态缓存系统

```typescript
/**
 * state-cache.ts
 * GPU状态缓存管理
 */

import { MSpec } from '@maxellabs/core';

export interface GPUState {
    pipeline?: MSpec.IRHIRenderPipeline;
    bindGroups: Map<number, MSpec.IRHIBindGroup>;
    vertexBuffers: Map<number, MSpec.IRHIBuffer>;
    indexBuffer?: MSpec.IRHIBuffer;
    viewport?: MSpec.IViewport;
    scissor?: MSpec.IRect;
}

export class StateCache {
    private currentState: GPUState;
    private stateChanges: number = 0;
    private cacheHits: number = 0;

    constructor() {
        this.currentState = {
            bindGroups: new Map(),
            vertexBuffers: new Map()
        };
    }

    /**
     * 设置渲染管线
     */
    public setPipeline(pipeline: MSpec.IRHIRenderPipeline, encoder: MSpec.IRHICommandEncoder): boolean {
        if (this.currentState.pipeline === pipeline) {
            this.cacheHits++;
            return false; // 无需更改
        }

        this.currentState.pipeline = pipeline;
        encoder.setRenderPipeline(pipeline);
        this.stateChanges++;
        return true;
    }

    /**
     * 设置绑定组
     */
    public setBindGroup(index: number, bindGroup: MSpec.IRHIBindGroup, encoder: MSpec.IRHICommandEncoder): boolean {
        const currentGroup = this.currentState.bindGroups.get(index);

        if (currentGroup === bindGroup) {
            this.cacheHits++;
            return false; // 无需更改
        }

        this.currentState.bindGroups.set(index, bindGroup);
        encoder.setBindGroup(index, bindGroup);
        this.stateChanges++;
        return true;
    }

    /**
     * 设置顶点缓冲区
     */
    public setVertexBuffer(index: number, buffer: MSpec.IRHIBuffer, encoder: MSpec.IRHICommandEncoder): boolean {
        const currentBuffer = this.currentState.vertexBuffers.get(index);

        if (currentBuffer === buffer) {
            this.cacheHits++;
            return false; // 无需更改
        }

        this.currentState.vertexBuffers.set(index, buffer);
        encoder.setVertexBuffer(index, buffer);
        this.stateChanges++;
        return true;
    }

    /**
     * 设置索引缓冲区
     */
    public setIndexBuffer(buffer: MSpec.IRHIBuffer, encoder: MSpec.IRHICommandEncoder): boolean {
        if (this.currentState.indexBuffer === buffer) {
            this.cacheHits++;
            return false; // 无需更改
        }

        this.currentState.indexBuffer = buffer;
        encoder.setIndexBuffer(buffer);
        this.stateChanges++;
        return true;
    }

    /**
     * 强制清空缓存
     */
    public clear(): void {
        this.currentState = {
            bindGroups: new Map(),
            vertexBuffers: new Map()
        };
    }

    /**
     * 获取性能统计
     */
    public getStats(): { stateChanges: number; cacheHits: number } {
        return {
            stateChanges: this.stateChanges,
            cacheHits: this.cacheHits
        };
    }

    /**
     * 重置统计
     */
    public resetStats(): void {
        this.stateChanges = 0;
        this.cacheHits = 0;
    }
}
```

### 3. 核心命令优化器

```typescript
/**
 * rhi-command-optimizer.ts
 * RHI命令优化器核心实现
 */

import { MSpec } from '@maxellabs/core';
import { OptimizedRenderCommand, BatchGroup, RenderInstance, RenderCommandType } from './rhi-command-types';
import { StateCache } from './state-cache';

export class RHICommandOptimizer {
    private commandQueue: OptimizedRenderCommand[] = [];
    private batchGroups: Map<string, BatchGroup> = new Map();
    private stateCache: StateCache;
    private pipelineCache: Map<string, MSpec.IRHIRenderPipeline> = new Map();
    private instancingEnabled: boolean = true;
    private maxInstancesPerBatch: number = 1024;

    constructor(options: {
        instancingEnabled?: boolean;
        maxInstancesPerBatch?: number;
    } = {}) {
        this.stateCache = new StateCache();
        this.instancingEnabled = options.instancingEnabled ?? true;
        this.maxInstancesPerBatch = options.maxInstancesPerBatch ?? 1024;
    }

    /**
     * 添加渲染命令
     */
    public addCommand(command: OptimizedRenderCommand): void {
        this.preprocessCommand(command);
        this.commandQueue.push(command);
    }

    /**
     * 批量添加命令
     */
    public addCommands(commands: OptimizedRenderCommand[]): void {
        commands.forEach(cmd => this.addCommand(cmd));
    }

    /**
     * 预处理命令
     */
    private preprocessCommand(command: OptimizedRenderCommand): void {
        command.priority = this.calculatePriority(command);
        command.depth = this.calculateDepth(command);
        command.transparent = this.isTransparent(command);
    }

    /**
     * 计算渲染优先级
     */
    private calculatePriority(command: OptimizedRenderCommand): number {
        let priority = 0;

        // 不透明对象优先级更高
        if (!command.transparent) {
            priority += 1000;
        }

        // 前向对象优先级更高
        if (command.depth > 0) {
            priority += Math.floor(command.depth * 100);
        }

        // 特殊材质优先级
        if (command.materialId.includes('sky')) {
            priority = -1000; // 天空盒最后渲染
        } else if (command.materialId.includes('ui')) {
            priority += 2000; // UI最优先
        }

        return priority;
    }

    /**
     * 计算深度
     */
    private calculateDepth(command: OptimizedRenderCommand): number {
        // 从变换矩阵提取深度
        if (command.vertexBuffers.length > 0) {
            // 简化的深度计算 - 实际应用中需要从变换矩阵计算
            return 0;
        }
        return 0;
    }

    /**
     * 判断是否透明
     */
    private isTransparent(command: OptimizedRenderCommand): boolean {
        return command.materialId.includes('transparent') ||
               command.materialId.includes('glass') ||
               command.materialId.includes('alpha');
    }

    /**
     * 优化命令队列
     */
    public optimizeCommands(): void {
        // 1. 状态排序 - 减少状态切换
        this.sortByState();

        // 2. 深度排序 - 正确的透明渲染
        this.sortByDepth();

        // 3. 批处理 - 合并相似渲染
        this.batchSimilarCommands();
    }

    /**
     * 按状态排序
     */
    private sortByState(): void {
        this.commandQueue.sort((a, b) => {
            // 首先按管线排序
            if (a.pipeline !== b.pipeline) {
                return a.pipeline < b.pipeline ? -1 : 1;
            }

            // 然后按材质排序
            if (a.materialId !== b.materialId) {
                return a.materialId < b.materialId ? -1 : 1;
            }

            // 最后按透明度排序
            if (a.transparent !== b.transparent) {
                return a.transparent ? 1 : -1;
            }

            return 0;
        });
    }

    /**
     * 按深度排序
     */
    private sortByDepth(): void {
        // 分离透明和不透明对象
        const opaque = this.commandQueue.filter(cmd => !cmd.transparent);
        const transparent = this.commandQueue.filter(cmd => cmd.transparent);

        // 不透明对象从前向后排序（Early-Z优化）
        opaque.sort((a, b) => b.depth - a.depth);

        // 透明对象从后向前排序（正确的透明度混合）
        transparent.sort((a, b) => a.depth - b.depth);

        // 重新组合
        this.commandQueue = [...opaque, ...transparent];
    }

    /**
     * 批处理相似命令
     */
    private batchSimilarCommands(): void {
        this.batchGroups.clear();

        for (const command of this.commandQueue) {
            const batchKey = this.generateBatchKey(command);

            if (!this.batchGroups.has(batchKey)) {
                this.batchGroups.set(batchKey, {
                    pipeline: command.pipeline,
                    bindGroups: command.bindGroups,
                    instances: [],
                    materialId: command.materialId,
                    transparent: command.transparent
                });
            }

            const batch = this.batchGroups.get(batchKey)!;

            // 检查是否可以添加到批次
            if (batch.instances.length < this.maxInstancesPerBatch) {
                const instance: RenderInstance = {
                    vertexBuffer: command.vertexBuffers[0],
                    indexBuffer: command.indexBuffer,
                    vertexCount: command.vertexCount || 0,
                    indexCount: command.indexCount || 0,
                    transform: new Float32Array(16), // 需要从外部设置
                    materialData: new Float32Array(0) // 可选的材质数据
                };

                batch.instances.push(instance);
            } else {
                // 创建新的批次
                const newBatchKey = `${batchKey}_${Date.now()}`;
                this.batchGroups.set(newBatchKey, {
                    pipeline: command.pipeline,
                    bindGroups: command.bindGroups,
                    instances: [{
                        vertexBuffer: command.vertexBuffers[0],
                        indexBuffer: command.indexBuffer,
                        vertexCount: command.vertexCount || 0,
                        indexCount: command.indexCount || 0,
                        transform: new Float32Array(16),
                        materialData: new Float32Array(0)
                    }],
                    materialId: command.materialId,
                    transparent: command.transparent
                });
            }
        }
    }

    /**
     * 生成批处理键
     */
    private generateBatchKey(command: OptimizedRenderCommand): string {
        return `${command.pipeline}_${command.materialId}_${command.transparent}`;
    }

    /**
     * 执行优化的渲染
     */
    public executeOptimizedRender(encoder: MSpec.IRHICommandEncoder): void {
        this.stateCache.clear();

        for (const [batchKey, batch] of this.batchGroups) {
            // 设置渲染管线
            this.stateCache.setPipeline(batch.pipeline, encoder);

            // 设置绑定组
            batch.bindGroups.forEach((bindGroup, index) => {
                this.stateCache.setBindGroup(index, bindGroup, encoder);
            });

            if (this.instancingEnabled && batch.instances.length > 1) {
                // 实例化渲染
                this.executeInstancedRender(batch, encoder);
            } else {
                // 普通渲染
                this.executeNormalRender(batch, encoder);
            }
        }
    }

    /**
     * 执行实例化渲染
     */
    private executeInstancedRender(batch: BatchGroup, encoder: MSpec.IRHICommandEncoder): void {
        if (batch.instances.length === 0) return;

        const firstInstance = batch.instances[0];

        // 设置顶点和索引缓冲区
        if (firstInstance.vertexBuffer) {
            this.stateCache.setVertexBuffer(0, firstInstance.vertexBuffer, encoder);
        }
        if (firstInstance.indexBuffer) {
            this.stateCache.setIndexBuffer(firstInstance.indexBuffer, encoder);
        }

        // 执行实例化绘制
        if (firstInstance.indexBuffer && firstInstance.indexCount) {
            encoder.drawIndexedInstanced(
                firstInstance.indexCount,
                batch.instances.length
            );
        } else if (firstInstance.vertexCount) {
            encoder.drawInstanced(
                firstInstance.vertexCount,
                batch.instances.length
            );
        }
    }

    /**
     * 执行普通渲染
     */
    private executeNormalRender(batch: BatchGroup, encoder: MSpec.IRHICommandEncoder): void {
        for (const instance of batch.instances) {
            // 设置顶点和索引缓冲区
            if (instance.vertexBuffer) {
                this.stateCache.setVertexBuffer(0, instance.vertexBuffer, encoder);
            }
            if (instance.indexBuffer) {
                this.stateCache.setIndexBuffer(instance.indexBuffer, encoder);
            }

            // 执行绘制
            if (instance.indexBuffer && instance.indexCount) {
                encoder.drawIndexed(instance.indexCount);
            } else if (instance.vertexCount) {
                encoder.draw(instance.vertexCount);
            }
        }
    }

    /**
     * 获取优化统计信息
     */
    public getOptimizationStats(): {
        originalCommands: number;
        batchedGroups: number;
        stateChanges: number;
        cacheHits: number;
        optimizationRatio: number;
    } {
        const stateStats = this.stateCache.getStats();
        const originalCommands = this.commandQueue.length;
        const batchedGroups = this.batchGroups.size;
        const optimizationRatio = originalCommands > 0 ?
            ((originalCommands - batchedGroups) / originalCommands) : 0;

        return {
            originalCommands,
            batchedGroups,
            stateChanges: stateStats.stateChanges,
            cacheHits: stateStats.cacheHits,
            optimizationRatio
        };
    }

    /**
     * 清空命令队列
     */
    public clear(): void {
        this.commandQueue = [];
        this.batchGroups.clear();
        this.stateCache.clear();
    }

    /**
     * 启用/禁用实例化
     */
    public setInstancingEnabled(enabled: boolean): void {
        this.instancingEnabled = enabled;
    }

    /**
     * 设置每批次最大实例数
     */
    public setMaxInstancesPerBatch(max: number): void {
        this.maxInstancesPerBatch = Math.max(1, max);
    }
}
```

## 使用示例

### 基本使用流程

```typescript
/**
 * rendering-manager.ts
 * 渲染管理器 - 集成命令优化器
 */

import { MSpec } from '@maxellabs/core';
import { RHICommandOptimizer, OptimizedRenderCommand } from './rhi-command-optimizer';

export class RenderingManager {
    private optimizer: RHICommandOptimizer;
    private device: MSpec.IRHIDevice;

    constructor(device: MSpec.IRHIDevice) {
        this.device = device;
        this.optimizer = new RHICommandOptimizer({
            instancingEnabled: true,
            maxInstancesPerBatch: 1024
        });
    }

    /**
     * 渲染场景
     */
    public renderScene(renderables: Renderable[], encoder: MSpec.IRHICommandEncoder): void {
        // 清空优化器
        this.optimizer.clear();

        // 添加所有渲染命令
        for (const renderable of renderables) {
            const command = this.createRenderCommand(renderable);
            this.optimizer.addCommand(command);
        }

        // 优化命令
        this.optimizer.optimizeCommands();

        // 执行优化后的渲染
        this.optimizer.executeOptimizedRender(encoder);

        // 输出优化统计
        const stats = this.optimizer.getOptimizationStats();
        console.log(`优化效果: ${stats.originalCommands} -> ${stats.batchedGroups} 命令`);
        console.log(`优化比例: ${(stats.optimizationRatio * 100).toFixed(1)}%`);
        console.log(`状态缓存命中率: ${stats.cacheHits}/${stats.stateChanges + stats.cacheHits}`);
    }

    /**
     * 创建渲染命令
     */
    private createRenderCommand(renderable: Renderable): OptimizedRenderCommand {
        return {
            type: renderable.indexBuffer ? 'draw_indexed' : 'draw',
            pipeline: renderable.pipeline,
            bindGroups: renderable.bindGroups,
            vertexBuffers: [renderable.vertexBuffer],
            indexBuffer: renderable.indexBuffer,
            vertexCount: renderable.vertexCount,
            indexCount: renderable.indexCount,
            priority: 0,
            materialId: renderable.materialId,
            depth: renderable.depth,
            transparent: renderable.transparent
        };
    }
}
```

### 高级优化场景

```typescript
/**
 * advanced-rendering-pipeline.ts
 * 高级渲染管线 - 多遍渲染优化
 */

export class AdvancedRenderingPipeline {
    private optimizer: RHICommandOptimizer;
    private shadowMapOptimizer: RHICommandOptimizer;
    private opaqueOptimizer: RHICommandOptimizer;
    private transparentOptimizer: RHICommandOptimizer;

    constructor() {
        // 为不同渲染阶段创建独立的优化器
        this.shadowMapOptimizer = new RHICommandOptimizer({
            instancingEnabled: true,
            maxInstancesPerBatch: 2048 // 阴影渲染可以支持更多实例
        });

        this.opaqueOptimizer = new RHICommandOptimizer({
            instancingEnabled: true,
            maxInstancesPerBatch: 1024
        });

        this.transparentOptimizer = new RHICommandOptimizer({
            instancingEnabled: false, // 透明对象通常不使用实例化
            maxInstancesPerBatch: 1
        });
    }

    /**
     * 执行多遍渲染
     */
    public executeMultiPassRender(
        shadowCommands: OptimizedRenderCommand[],
        opaqueCommands: OptimizedRenderCommand[],
        transparentCommands: OptimizedRenderCommand[],
        encoder: MSpec.IRHICommandEncoder
    ): void {
        // 阴影映射阶段
        this.shadowMapOptimizer.addCommands(shadowCommands);
        this.shadowMapOptimizer.optimizeCommands();
        this.shadowMapOptimizer.executeOptimizedRender(encoder);

        // 不透明物体阶段
        this.opaqueOptimizer.addCommands(opaqueCommands);
        this.opaqueOptimizer.optimizeCommands();
        this.opaqueOptimizer.executeOptimizedRender(encoder);

        // 透明物体阶段
        this.transparentOptimizer.addCommands(transparentCommands);
        this.transparentOptimizer.optimizeCommands();
        this.transparentOptimizer.executeOptimizedRender(encoder);

        // 综合统计
        this.reportOptimizationStats();
    }

    /**
     * 报告优化统计
     */
    private reportOptimizationStats(): void {
        const shadowStats = this.shadowMapOptimizer.getOptimizationStats();
        const opaqueStats = this.opaqueOptimizer.getOptimizationStats();
        const transparentStats = this.transparentOptimizer.getOptimizationStats();

        console.group('渲染优化统计');
        console.log('阴影映射:', shadowStats);
        console.log('不透明物体:', opaqueStats);
        console.log('透明物体:', transparentStats);
        console.groupEnd();
    }
}
```

## 性能优化技巧

### 1. 智能批处理策略

```typescript
/**
 * smart-batching-strategy.ts
 * 智能批处理策略
 */

export class SmartBatchingStrategy {
    /**
     * 根据材质复杂度决定批处理策略
     */
    public static shouldBatch(materialA: string, materialB: string): boolean {
        // 相同材质总是可以批处理
        if (materialA === materialB) return true;

        // 简单材质可以批处理
        const simpleMaterials = ['basic', 'unlit', 'skybox'];
        if (simpleMaterials.some(m => materialA.includes(m)) &&
            simpleMaterials.some(m => materialB.includes(m))) {
            return true;
        }

        // 复杂材质（如PBR）不批处理
        const complexMaterials = ['pbr', 'metallic', 'roughness'];
        if (complexMaterials.some(m => materialA.includes(m)) ||
            complexMaterials.some(m => materialB.includes(m))) {
            return false;
        }

        return false;
    }

    /**
     * 计算最佳批次大小
     */
    public static calculateOptimalBatchSize(
        commandCount: number,
        gpuMemory: number
    ): number {
        // 基于GPU内存动态调整批次大小
        const memoryBasedSize = Math.floor(gpuMemory / (1024 * 1024)); // 1MB per batch
        const countBasedSize = Math.min(1024, Math.max(32, commandCount / 10));

        return Math.min(memoryBasedSize, countBasedSize);
    }
}
```

### 2. 自适应状态缓存

```typescript
/**
 * adaptive-state-cache.ts
 * 自适应状态缓存
 */

export class AdaptiveStateCache extends StateCache {
    private frameCounter: number = 0;
    private adaptiveThreshold: number = 10;

    /**
     * 自适应缓存策略
     */
    public shouldUseCache(changeFrequency: number): boolean {
        // 高频变化的状态使用缓存
        if (changeFrequency > this.adaptiveThreshold) {
            return true;
        }

        // 低频变化的状态直接更新
        return false;
    }

    /**
     * 更新自适应参数
     */
    public updateAdaptiveParameters(): void {
        this.frameCounter++;

        // 每100帧调整一次
        if (this.frameCounter % 100 === 0) {
            const stats = this.getStats();
            const hitRate = stats.cacheHits / (stats.cacheHits + stats.stateChanges);

            // 根据命中率调整阈值
            if (hitRate > 0.8) {
                this.adaptiveThreshold = Math.min(20, this.adaptiveThreshold + 2);
            } else if (hitRate < 0.5) {
                this.adaptiveThreshold = Math.max(5, this.adaptiveThreshold - 1);
            }
        }
    }
}
```

## 最佳实践

### 1. 批处理优化原则

- **材质优先**：相同材质的对象优先批处理
- **透明度分离**：透明和不透明对象分开处理
- **深度排序**：不透明对象从前向后，透明对象从后向前
- **实例化限制**：避免单个批次过大，影响GPU并行度

### 2. 状态缓存策略

- **缓存命中率监控**：定期检查缓存命中率，低于50%需要优化
- **状态变化分析**：识别高频变化的状态，优化批处理策略
- **内存平衡**：在缓存大小和性能之间找到平衡点

### 3. 性能监控

```typescript
// 在渲染循环中监控优化效果
setInterval(() => {
    const stats = optimizer.getOptimizationStats();

    // 优化效果不佳时发出警告
    if (stats.optimizationRatio < 0.3) {
        console.warn('命令优化效果不佳，建议检查批处理策略');
    }

    // 缓存命中率过低时发出警告
    const totalOps = stats.stateChanges + stats.cacheHits;
    const hitRate = stats.cacheHits / totalOps;
    if (hitRate < 0.5) {
        console.warn('状态缓存命中率过低，建议优化排序策略');
    }
}, 5000);
```

## 相关文档

- [性能分析器](./performance-analyzer.md) - 监控优化效果
- [Math对象池优化](./math-object-pool-optimization.md) - CPU端优化
- [性能优化完整演示](./performance-optimization-demo.md) - 综合示例
- [WebGL性能最佳实践](../rhi/performance/index.md) - RHI层优化指南