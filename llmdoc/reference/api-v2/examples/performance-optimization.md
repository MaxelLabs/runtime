# 性能优化示例

## 概述

这个示例展示了全面的性能优化技术，包括RHI命令优化、Math对象池深度使用、SIMD优化、渲染性能分析和内存泄漏检测。通过实际代码演示如何在大规模3D应用中实现最佳性能。

## 完整代码示例

### 1. 性能分析器

```typescript
/**
 * performance-analyzer.ts
 * 性能分析器 - 监控和分析系统性能
 */

import { MSpec } from '@maxellabs/core';

/**
 * 性能指标
 */
export interface PerformanceMetrics {
    frame: {
        fps: number;
        frameTime: number;
        renderTime: number;
        updateTime: number;
        drawCalls: number;
        triangles: number;
        vertices: number;
    };
    gpu: {
        gpuTime: number;
        memoryUsage: number;
        textureMemory: number;
        bufferMemory: number;
        pipelineCreations: number;
    };
    cpu: {
        updateTime: number;
        physicsTime: number;
        animationTime: number;
        cullingTime: number;
        sortingTime: number;
    };
    memory: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        arrayBuffers: number;
    };
}

/**
 * 性能警告
 */
export interface PerformanceWarning {
    type: 'fps' | 'memory' | 'gpu' | 'cpu';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    value: number;
    threshold: number;
    timestamp: number;
}

/**
 * 性能分析器
 */
export class PerformanceAnalyzer {
    private metrics: PerformanceMetrics;
    private frameHistory: number[] = [];
    private warnings: PerformanceWarning[] = [];
    private frameStartTime: number = 0;
    private gpuTimers: Map<string, number> = new Map();
    private cpuTimers: Map<string, number> = new Map();
    private maxHistorySize: number = 120; // 2秒历史

    constructor() {
        this.metrics = this.createEmptyMetrics();
        this.setupPerformanceMonitoring();
    }

    private createEmptyMetrics(): PerformanceMetrics {
        return {
            frame: {
                fps: 0,
                frameTime: 0,
                renderTime: 0,
                updateTime: 0,
                drawCalls: 0,
                triangles: 0,
                vertices: 0
            },
            gpu: {
                gpuTime: 0,
                memoryUsage: 0,
                textureMemory: 0,
                bufferMemory: 0,
                pipelineCreations: 0
            },
            cpu: {
                updateTime: 0,
                physicsTime: 0,
                animationTime: 0,
                cullingTime: 0,
                sortingTime: 0
            },
            memory: {
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
                arrayBuffers: 0
            }
        };
    }

    private setupPerformanceMonitoring(): void {
        // 监控内存使用
        if ('memory' in performance) {
            setInterval(() => {
                const memory = (performance as any).memory;
                this.metrics.memory.heapUsed = memory.usedJSHeapSize;
                this.metrics.memory.heapTotal = memory.totalJSHeapSize;
                this.metrics.memory.external = memory.usedJSHeapSize - memory.usedJSHeapSize;
            }, 1000);
        }
    }

    public beginFrame(): void {
        this.frameStartTime = performance.now();
    }

    public endFrame(): void {
        const frameTime = performance.now() - this.frameStartTime;
        this.frameHistory.push(frameTime);

        // 保持历史大小
        if (this.frameHistory.length > this.maxHistorySize) {
            this.frameHistory.shift();
        }

        // 计算FPS
        const avgFrameTime = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
        this.metrics.frame.fps = 1000 / avgFrameTime;
        this.metrics.frame.frameTime = frameTime;

        // 检查性能警告
        this.checkPerformanceWarnings();
    }

    public startGPUTimer(name: string): void {
        this.gpuTimers.set(name, performance.now());
    }

    public endGPUTimer(name: string): number {
        const startTime = this.gpuTimers.get(name);
        if (startTime !== undefined) {
            const duration = performance.now() - startTime;
            this.gpuTimers.delete(name);
            return duration;
        }
        return 0;
    }

    public startCPUTimer(name: string): void {
        this.cpuTimers.set(name, performance.now());
    }

    public endCPUTimer(name: string): number {
        const startTime = this.cpuTimers.get(name);
        if (startTime !== undefined) {
            const duration = performance.now() - startTime;
            this.cpuTimers.delete(name);
            return duration;
        }
        return 0;
    }

    public recordRenderMetrics(drawCalls: number, triangles: number, vertices: number, renderTime: number): void {
        this.metrics.frame.drawCalls = drawCalls;
        this.metrics.frame.triangles = triangles;
        this.metrics.frame.vertices = vertices;
        this.metrics.frame.renderTime = renderTime;
    }

    public recordGPUMetrics(gpuTime: number, memoryUsage: number, textureMemory: number, bufferMemory: number): void {
        this.metrics.gpu.gpuTime = gpuTime;
        this.metrics.gpu.memoryUsage = memoryUsage;
        this.metrics.gpu.textureMemory = textureMemory;
        this.metrics.gpu.bufferMemory = bufferMemory;
    }

    public recordCPUMetrics(updateTime: number, physicsTime: number, animationTime: number, cullingTime: number, sortingTime: number): void {
        this.metrics.cpu.updateTime = updateTime;
        this.metrics.cpu.physicsTime = physicsTime;
        this.metrics.cpu.animationTime = animationTime;
        this.metrics.cpu.cullingTime = cullingTime;
        this.metrics.cpu.sortingTime = sortingTime;
    }

    private checkPerformanceWarnings(): void {
        // FPS警告
        if (this.metrics.frame.fps < 30) {
            this.addWarning('fps', 'high', `Low FPS: ${this.metrics.frame.fps.toFixed(1)}`, this.metrics.frame.fps, 30);
        } else if (this.metrics.frame.fps < 45) {
            this.addWarning('fps', 'medium', `Medium FPS: ${this.metrics.frame.fps.toFixed(1)}`, this.metrics.frame.fps, 45);
        }

        // 内存警告
        const memoryUsageRatio = this.metrics.memory.heapUsed / this.metrics.memory.heapTotal;
        if (memoryUsageRatio > 0.9) {
            this.addWarning('memory', 'critical', `High memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`, memoryUsageRatio, 0.9);
        } else if (memoryUsageRatio > 0.8) {
            this.addWarning('memory', 'high', `High memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`, memoryUsageRatio, 0.8);
        }

        // 帧时间警告
        if (this.metrics.frame.frameTime > 33.3) { // 30 FPS threshold
            this.addWarning('cpu', 'medium', `High frame time: ${this.metrics.frame.frameTime.toFixed(1)}ms`, this.metrics.frame.frameTime, 33.3);
        }

        // 渲染警告
        if (this.metrics.frame.drawCalls > 1000) {
            this.addWarning('gpu', 'medium', `High draw calls: ${this.metrics.frame.drawCalls}`, this.metrics.frame.drawCalls, 1000);
        }
    }

    private addWarning(type: PerformanceWarning['type'], severity: PerformanceWarning['severity'], message: string, value: number, threshold: number): void {
        // 避免重复警告
        const recentWarning = this.warnings.find(w =>
            w.type === type &&
            w.severity === severity &&
            (performance.now() - w.timestamp) < 5000
        );

        if (!recentWarning) {
            this.warnings.push({
                type,
                severity,
                message,
                value,
                threshold,
                timestamp: performance.now()
            });

            // 保持警告数量
            if (this.warnings.length > 50) {
                this.warnings = this.warnings.slice(-50);
            }

            console.warn(`[Performance] ${message}`);
        }
    }

    public getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    public getWarnings(): PerformanceWarning[] {
        return [...this.warnings];
    }

    public getReport(): PerformanceReport {
        return {
            timestamp: Date.now(),
            metrics: this.getMetrics(),
            warnings: this.getWarnings(),
            recommendations: this.generateRecommendations()
        };
    }

    private generateRecommendations(): string[] {
        const recommendations: string[] = [];

        if (this.metrics.frame.fps < 30) {
            recommendations.push('Consider reducing scene complexity or enabling LOD');
            recommendations.push('Check for expensive shaders or large textures');
        }

        if (this.metrics.frame.drawCalls > 500) {
            recommendations.push('Consider implementing instancing or batching');
            recommendations.push('Merge similar materials and geometries');
        }

        const memoryRatio = this.metrics.memory.heapUsed / this.metrics.memory.heapTotal;
        if (memoryRatio > 0.8) {
            recommendations.push('Implement texture compression and reduce texture sizes');
            recommendations.push('Use object pooling to reduce garbage collection');
        }

        if (this.metrics.cpu.animationTime > 5) {
            recommendations.push('Optimize animation system with better data structures');
            recommendations.push('Consider reducing animation update frequency');
        }

        return recommendations;
    }

    public reset(): void {
        this.frameHistory = [];
        this.warnings = [];
        this.gpuTimers.clear();
        this.cpuTimers.clear();
        this.metrics = this.createEmptyMetrics();
    }
}

/**
 * 性能报告
 */
export interface PerformanceReport {
    timestamp: number;
    metrics: PerformanceMetrics;
    warnings: PerformanceWarning[];
    recommendations: string[];
}
```

### 2. RHI命令优化器

```typescript
/**
 * rhi-command-optimizer.ts
 * RHI命令优化器 - 批量处理和状态优化
 */

import { MSpec } from '@maxellabs/core';

/**
 * 渲染命令类型
 */
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
    priority: number;  // 渲染优先级
    materialId: string;  // 材质ID (用于批处理)
    depth: number;      // 深度值 (用于排序)
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

/**
 * RHI命令优化器
 */
export class RHICommandOptimizer {
    private commandQueue: OptimizedRenderCommand[] = [];
    private batchGroups: Map<string, BatchGroup> = new Map();
    private stateCache: StateCache;
    private pipelineCache: Map<string, MSpec.IRHIRenderPipeline> = new Map();
    private instancingEnabled: boolean = true;
    private maxInstancesPerBatch: number = 1024;

    constructor() {
        this.stateCache = new StateCache();
    }

    /**
     * 添加渲染命令
     */
    public addCommand(command: OptimizedRenderCommand): void {
        // 预处理命令
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
        // 计算优先级
        command.priority = this.calculatePriority(command);

        // 计算深度
        command.depth = this.calculateDepth(command);

        // 标记透明对象
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
            // 简化的深度计算
            return 0; // 实际应用中需要从变换矩阵计算
        }
        return 0;
    }

    /**
     * 判断是否透明
     */
    private isTransparent(command: OptimizedRenderCommand): boolean {
        // 根据材质ID判断
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

        // 不透明对象从前到后排序
        opaque.sort((a, b) => b.depth - a.depth);

        // 透明对象从后到前排序
        transparent.sort((a, b) => a.depth - b.depth);

        // 合并结果
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
            const instance: RenderInstance = {
                vertexBuffer: command.vertexBuffers[0],
                indexBuffer: command.indexBuffer,
                vertexCount: command.vertexCount || 0,
                indexCount: command.indexCount || 0,
                transform: new Float32Array(16), // 单位矩阵
                materialData: undefined
            };

            batch.instances.push(instance);

            // 检查批次大小
            if (batch.instances.length >= this.maxInstancesPerBatch) {
                this.submitBatch(batch);
                batch.instances = [];
            }
        }

        // 提交剩余的批次
        for (const batch of this.batchGroups.values()) {
            if (batch.instances.length > 0) {
                this.submitBatch(batch);
            }
        }
    }

    /**
     * 生成批次键
     */
    private generateBatchKey(command: OptimizedRenderCommand): string {
        return `${command.pipeline}_${command.materialId}_${command.transparent}`;
    }

    /**
     * 提交批次
     */
    private submitBatch(batch: BatchGroup): void {
        if (batch.instances.length === 0) return;

        if (this.instancingEnabled && batch.instances.length > 1) {
            this.submitInstancedBatch(batch);
        } else {
            this.submitIndividualBatch(batch);
        }
    }

    /**
     * 提交实例化批次
     */
    private submitInstancedBatch(batch: BatchGroup): void {
        // 创建实例缓冲区
        const transforms = new Float32Array(batch.instances.length * 16);
        batch.instances.forEach((instance, index) => {
            transforms.set(instance.transform, index * 16);
        });

        const instanceBuffer = this.device.createBuffer({
            size: transforms.byteLength,
            usage: MSpec.RHIBufferUsage.VERTEX,
            hint: 'dynamic',
            initialData: transforms
        });

        // 执行实例化渲染
        console.log(`Rendering ${batch.instances.length} instances of ${batch.materialId}`);
    }

    /**
     * 提交单独批次
     */
    private submitIndividualBatch(batch: BatchGroup): void {
        for (const instance of batch.instances) {
            console.log(`Rendering single instance of ${batch.materialId}`);
        }
    }

    /**
     * 执行优化后的命令
     */
    public executeOptimizedCommands(renderPass: MSpec.IRHIRenderPass): void {
        // 优化命令
        this.optimizeCommands();

        let currentPipeline: MSpec.IRHIRenderPipeline | null = null;
        let currentBindGroups: MSpec.IRHIBindGroup[] = [];
        let currentVertexBuffers: MSpec.IRHIBuffer[] = [];

        // 执行批处理后的命令
        for (const command of this.commandQueue) {
            // 设置管线 (仅在变化时)
            if (currentPipeline !== command.pipeline) {
                renderPass.setPipeline(command.pipeline);
                currentPipeline = command.pipeline;
            }

            // 设置绑定组 (仅在变化时)
            if (!this.arraysEqual(currentBindGroups, command.bindGroups)) {
                command.bindGroups.forEach((bindGroup, index) => {
                    renderPass.setBindGroup(index, bindGroup);
                });
                currentBindGroups = [...command.bindGroups];
            }

            // 设置顶点缓冲区 (仅在变化时)
            if (!this.arraysEqual(currentVertexBuffers, command.vertexBuffers)) {
                command.vertexBuffers.forEach((buffer, index) => {
                    renderPass.setVertexBuffer(index, buffer);
                });
                currentVertexBuffers = [...command.vertexBuffers];
            }

            // 设置索引缓冲区
            if (command.indexBuffer) {
                renderPass.setIndexBuffer(command.indexBuffer, MSpec.RHIIndexFormat.UINT16);
            }

            // 执行绘制
            if (command.indexBuffer && command.indexCount) {
                renderPass.drawIndexed(command.indexCount);
            } else if (command.vertexCount) {
                renderPass.draw(command.vertexCount);
            }
        }

        // 清空命令队列
        this.commandQueue = [];
    }

    private arraysEqual<T>(a: T[], b: T[]): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * 启用/禁用实例化
     */
    public setInstancingEnabled(enabled: boolean): void {
        this.instancingEnabled = enabled;
    }

    /**
     * 设置最大实例数
     */
    public setMaxInstancesPerBatch(max: number): void {
        this.maxInstancesPerBatch = max;
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
     * 获取统计信息
     */
    public getStatistics(): CommandOptimizationStats {
        return {
            totalCommands: this.commandQueue.length,
            batchGroups: this.batchGroups.size,
            potentialBatches: this.calculatePotentialBatches(),
            stateChanges: this.countStateChanges(),
            instancingEnabled: this.instancingEnabled
        };
    }

    private calculatePotentialBatches(): number {
        const materialGroups = new Map<string, number>();
        this.commandQueue.forEach(cmd => {
            const count = materialGroups.get(cmd.materialId) || 0;
            materialGroups.set(cmd.materialId, count + 1);
        });
        return materialGroups.size;
    }

    private countStateChanges(): number {
        let changes = 0;
        let lastPipeline: any = null;
        let lastMaterial = '';

        this.commandQueue.forEach(cmd => {
            if (lastPipeline !== cmd.pipeline) changes++;
            if (lastMaterial !== cmd.materialId) changes++;
            lastPipeline = cmd.pipeline;
            lastMaterial = cmd.materialId;
        });

        return changes;
    }
}

/**
 * 状态缓存
 */
class StateCache {
    private currentPipeline: MSpec.IRHIRenderPipeline | null = null;
    private currentBindGroups: MSpec.IRHIBindGroup[] = [];
    private currentVertexBuffers: MSpec.IRHIBuffer[] = [];
    private currentIndexBuffer: MSpec.IRHIBuffer | null = null;

    public clear(): void {
        this.currentPipeline = null;
        this.currentBindGroups = [];
        this.currentVertexBuffers = [];
        this.currentIndexBuffer = null;
    }

    public pipelineChanged(pipeline: MSpec.IRHIRenderPipeline): boolean {
        if (this.currentPipeline !== pipeline) {
            this.currentPipeline = pipeline;
            return true;
        }
        return false;
    }

    public bindGroupsChanged(bindGroups: MSpec.IRHIBindGroup[]): boolean {
        if (!this.arraysEqual(this.currentBindGroups, bindGroups)) {
            this.currentBindGroups = [...bindGroups];
            return true;
        }
        return false;
    }

    public vertexBuffersChanged(buffers: MSpec.IRHIBuffer[]): boolean {
        if (!this.arraysEqual(this.currentVertexBuffers, buffers)) {
            this.currentVertexBuffers = [...buffers];
            return true;
        }
        return false;
    }

    private arraysEqual<T>(a: T[], b: T[]): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}

/**
 * 命令优化统计
 */
export interface CommandOptimizationStats {
    totalCommands: number;
    batchGroups: number;
    potentialBatches: number;
    stateChanges: number;
    instancingEnabled: boolean;
}
```

### 3. Math对象池深度优化

```typescript
/**
 * math-pool-optimizer.ts
 * Math对象池优化器 - 高性能的对象池管理
 */

import { MMath } from '@maxellabs/core';

/**
 * 对象池配置
 */
export interface PoolConfig {
    initialSize: number;
    maxSize: number;
    growthFactor: number;
    shrinkThreshold: number;
    autoShrink: boolean;
    shrinkInterval: number;
}

/**
 * 对象池统计
 */
export interface PoolStatistics {
    totalObjects: number;
    activeObjects: number;
    poolHits: number;
    poolMisses: number;
    allocations: number;
    deallocations: number;
    memoryUsage: number;
    efficiency: number;
}

/**
 * 高性能对象池
 */
export class OptimizedObjectPool<T> {
    private pool: T[] = [];
    private active: Set<T> = new Set();
    private factory: () => T;
    private reset: (obj: T) => void;
    private config: PoolConfig;
    private stats: PoolStatistics;
    private lastShrinkTime: number = 0;

    constructor(
        factory: () => T,
        reset: (obj: T) => void,
        config: Partial<PoolConfig> = {}
    ) {
        this.factory = factory;
        this.reset = reset;
        this.config = {
            initialSize: 32,
            maxSize: 1024,
            growthFactor: 1.5,
            shrinkThreshold: 0.75,
            autoShrink: true,
            shrinkInterval: 30000, // 30秒
            ...config
        };

        this.stats = {
            totalObjects: 0,
            activeObjects: 0,
            poolHits: 0,
            poolMisses: 0,
            allocations: 0,
            deallocations: 0,
            memoryUsage: 0,
            efficiency: 0
        };

        // 预分配对象
        this.preallocate();
    }

    private preallocate(): void {
        for (let i = 0; i < this.config.initialSize; i++) {
            const obj = this.factory();
            this.pool.push(obj);
            this.stats.totalObjects++;
        }
    }

    public acquire(): T {
        // 检查自动收缩
        this.checkAutoShrink();

        if (this.pool.length > 0) {
            const obj = this.pool.pop()!;
            this.active.add(obj);
            this.stats.poolHits++;
            this.stats.activeObjects++;
            return obj;
        } else {
            // 池为空，创建新对象
            const obj = this.factory();
            this.active.add(obj);
            this.stats.poolMisses++;
            this.stats.allocations++;
            this.stats.totalObjects++;
            this.stats.activeObjects++;
            return obj;
        }
    }

    public release(obj: T): void {
        if (!this.active.has(obj)) {
            console.warn('Attempting to release object not from pool');
            return;
        }

        this.active.delete(obj);
        this.reset(obj);

        // 检查池大小限制
        if (this.pool.length < this.config.maxSize) {
            this.pool.push(obj);
            this.stats.deallocations++;
        } else {
            // 池已满，对象会被垃圾回收
            this.stats.totalObjects--;
        }

        this.stats.activeObjects--;
    }

    public releaseBatch(objects: T[]): void {
        objects.forEach(obj => this.release(obj));
    }

    public preWarm(count: number): void {
        const toCreate = Math.min(count, this.config.maxSize - this.pool.length);
        for (let i = 0; i < toCreate; i++) {
            const obj = this.factory();
            this.pool.push(obj);
            this.stats.totalObjects++;
        }
    }

    public shrink(): void {
        const targetSize = Math.floor(this.pool.length * this.config.shrinkThreshold);
        const toRemove = this.pool.length - targetSize;

        for (let i = 0; i < toRemove; i++) {
            const obj = this.pool.pop();
            if (obj) {
                this.stats.totalObjects--;
            }
        }

        this.lastShrinkTime = performance.now();
    }

    private checkAutoShrink(): void {
        if (!this.config.autoShrink) return;

        const now = performance.now();
        if (now - this.lastShrinkTime > this.config.shrinkInterval) {
            const efficiency = this.stats.poolHits / (this.stats.poolHits + this.stats.poolMisses);
            if (efficiency < this.config.shrinkThreshold) {
                this.shrink();
            }
        }
    }

    public clear(): void {
        // 释放所有活动对象
        this.active.forEach(obj => {
            this.reset(obj);
            this.pool.push(obj);
        });
        this.active.clear();

        // 收缩池到初始大小
        while (this.pool.length > this.config.initialSize) {
            this.pool.pop();
            this.stats.totalObjects--;
        }
    }

    public getStatistics(): PoolStatistics {
        this.stats.memoryUsage = this.calculateMemoryUsage();
        this.stats.efficiency = this.stats.poolHits / Math.max(1, this.stats.poolHits + this.stats.poolMisses);
        return { ...this.stats };
    }

    private calculateMemoryUsage(): number {
        // 估算内存使用量 (简化计算)
        return (this.pool.length + this.active.size) * 64; // 假设每个对象64字节
    }

    public getPoolSize(): number {
        return this.pool.length;
    }

    public getActiveCount(): number {
        return this.active.size;
    }
}

/**
 * Math对象池管理器
 */
export class MathPoolManager {
    private static instance: MathPoolManager;
    private vector2Pool: OptimizedObjectPool<MMath.Vector2>;
    private vector3Pool: OptimizedObjectPool<MMath.Vector3>;
    private vector4Pool: OptimizedObjectPool<MMath.Vector4>;
    private matrix3Pool: OptimizedObjectPool<MMath.Matrix3>;
    private matrix4Pool: OptimizedObjectPool<MMath.Matrix4>;
    private quaternionPool: OptimizedObjectPool<MMath.Quaternion>;
    private colorPool: OptimizedObjectPool<MMath.Color>;

    private constructor() {
        this.initializePools();
    }

    public static getInstance(): MathPoolManager {
        if (!MathPoolManager.instance) {
            MathPoolManager.instance = new MathPoolManager();
        }
        return MathPoolManager.instance;
    }

    private initializePools(): void {
        this.vector2Pool = new OptimizedObjectPool(
            () => new MMath.Vector2(),
            (v) => v.set(0, 0),
            {
                initialSize: 128,
                maxSize: 2048,
                autoShrink: true
            }
        );

        this.vector3Pool = new OptimizedObjectPool(
            () => new MMath.Vector3(),
            (v) => v.set(0, 0, 0),
            {
                initialSize: 256,
                maxSize: 4096,
                autoShrink: true
            }
        );

        this.vector4Pool = new OptimizedObjectPool(
            () => new MMath.Vector4(),
            (v) => v.set(0, 0, 0, 0),
            {
                initialSize: 64,
                maxSize: 1024,
                autoShrink: true
            }
        );

        this.matrix3Pool = new OptimizedObjectPool(
            () => new MMath.Matrix3(),
            (m) => m.identity(),
            {
                initialSize: 64,
                maxSize: 512,
                autoShrink: true
            }
        );

        this.matrix4Pool = new OptimizedObjectPool(
            () => new MMath.Matrix4(),
            (m) => m.identity(),
            {
                initialSize: 128,
                maxSize: 1024,
                autoShrink: true
            }
        );

        this.quaternionPool = new OptimizedObjectPool(
            () => new MMath.Quaternion(),
            (q) => q.set(0, 0, 0, 1),
            {
                initialSize: 128,
                maxSize: 1024,
                autoShrink: true
            }
        );

        this.colorPool = new OptimizedObjectPool(
            () => new MMath.Color(),
            (c) => c.set(0, 0, 0, 1),
            {
                initialSize: 32,
                maxSize: 256,
                autoShrink: true
            }
        );
    }

    // Vector2 方法
    public getVector2(x: number = 0, y: number = 0): MMath.Vector2 {
        const v = this.vector2Pool.acquire();
        v.set(x, y);
        return v;
    }

    public releaseVector2(vector: MMath.Vector2): void {
        this.vector2Pool.release(vector);
    }

    public releaseVector2Batch(vectors: MMath.Vector2[]): void {
        this.vector2Pool.releaseBatch(vectors);
    }

    // Vector3 方法
    public getVector3(x: number = 0, y: number = 0, z: number = 0): MMath.Vector3 {
        const v = this.vector3Pool.acquire();
        v.set(x, y, z);
        return v;
    }

    public releaseVector3(vector: MMath.Vector3): void {
        this.vector3Pool.release(vector);
    }

    public releaseVector3Batch(vectors: MMath.Vector3[]): void {
        this.vector3Pool.releaseBatch(vectors);
    }

    // Vector4 方法
    public getVector4(x: number = 0, y: number = 0, z: number = 0, w: number = 0): MMath.Vector4 {
        const v = this.vector4Pool.acquire();
        v.set(x, y, z, w);
        return v;
    }

    public releaseVector4(vector: MMath.Vector4): void {
        this.vector4Pool.release(vector);
    }

    // Matrix3 方法
    public getMatrix3(): MMath.Matrix3 {
        return this.matrix3Pool.acquire();
    }

    public releaseMatrix3(matrix: MMath.Matrix3): void {
        this.matrix3Pool.release(matrix);
    }

    // Matrix4 方法
    public getMatrix4(): MMath.Matrix4 {
        return this.matrix4Pool.acquire();
    }

    public releaseMatrix4(matrix: MMath.Matrix4): void {
        this.matrix4Pool.release(matrix);
    }

    public releaseMatrix4Batch(matrices: MMath.Matrix4[]): void {
        this.matrix4Pool.releaseBatch(matrices);
    }

    // Quaternion 方法
    public getQuaternion(x: number = 0, y: number = 0, z: number = 0, w: number = 1): MMath.Quaternion {
        const q = this.quaternionPool.acquire();
        q.set(x, y, z, w);
        return q;
    }

    public releaseQuaternion(quaternion: MMath.Quaternion): void {
        this.quaternionPool.release(quaternion);
    }

    public releaseQuaternionBatch(quaternions: MMath.Quaternion[]): void {
        this.quaternionPool.releaseBatch(quaternions);
    }

    // Color 方法
    public getColor(r: number = 0, g: number = 0, b: number = 0, a: number = 1): MMath.Color {
        const c = this.colorPool.acquire();
        c.set(r, g, b, a);
        return c;
    }

    public releaseColor(color: MMath.Color): void {
        this.colorPool.release(color);
    }

    // 批量操作
    public getVector3Batch(count: number): MMath.Vector3[] {
        const vectors: MMath.Vector3[] = [];
        for (let i = 0; i < count; i++) {
            vectors.push(this.getVector3());
        }
        return vectors;
    }

    public getMatrix4Batch(count: number): MMath.Matrix4[] {
        const matrices: MMath.Matrix4[] = [];
        for (let i = 0; i < count; i++) {
            matrices.push(this.getMatrix4());
        }
        return matrices;
    }

    // 预热
    public preWarmVector3Pool(count: number): void {
        this.vector3Pool.preWarm(count);
    }

    public preWarmMatrix4Pool(count: number): void {
        this.matrix4Pool.preWarm(count);
    }

    public preWarmAllPools(): void {
        this.vector2Pool.preWarm(64);
        this.vector3Pool.preWarm(256);
        this.vector4Pool.preWarm(64);
        this.matrix3Pool.preWarm(64);
        this.matrix4Pool.preWarm(128);
        this.quaternionPool.preWarm(128);
        this.colorPool.preWarm(32);
    }

    // 统计信息
    public getPoolStatistics(): MathPoolStatistics {
        return {
            vector2: this.vector2Pool.getStatistics(),
            vector3: this.vector3Pool.getStatistics(),
            vector4: this.vector4Pool.getStatistics(),
            matrix3: this.matrix3Pool.getStatistics(),
            matrix4: this.matrix4Pool.getStatistics(),
            quaternion: this.quaternionPool.getStatistics(),
            color: this.colorPool.getStatistics()
        };
    }

    // 清理
    public clearAllPools(): void {
        this.vector2Pool.clear();
        this.vector3Pool.clear();
        this.vector4Pool.clear();
        this.matrix3Pool.clear();
        this.matrix4Pool.clear();
        this.quaternionPool.clear();
        this.colorPool.clear();
    }

    // 收缩
    public shrinkAllPools(): void {
        this.vector2Pool.shrink();
        this.vector3Pool.shrink();
        this.vector4Pool.shrink();
        this.matrix3Pool.shrink();
        this.matrix4Pool.shrink();
        this.quaternionPool.shrink();
        this.colorPool.shrink();
    }
}

/**
 * Math池统计信息
 */
export interface MathPoolStatistics {
    vector2: PoolStatistics;
    vector3: PoolStatistics;
    vector4: PoolStatistics;
    matrix3: PoolStatistics;
    matrix4: PoolStatistics;
    quaternion: PoolStatistics;
    color: PoolStatistics;
}

/**
 * 便捷的全局函数
 */
export const MathPool = {
    // Vector3 便捷函数
    vec3: (x?: number, y?: number, z?: number) =>
        MathPoolManager.getInstance().getVector3(x, y, z),

    releaseVec3: (v: MMath.Vector3) =>
        MathPoolManager.getInstance().releaseVector3(v),

    // Matrix4 便捷函数
    mat4: () =>
        MathPoolManager.getInstance().getMatrix4(),

    releaseMat4: (m: MMath.Matrix4) =>
        MathPoolManager.getInstance().releaseMatrix4(m),

    // Quaternion 便捷函数
    quat: (x?: number, y?: number, z?: number, w?: number) =>
        MathPoolManager.getInstance().getQuaternion(x, y, z, w),

    releaseQuat: (q: MMath.Quaternion) =>
        MathPoolManager.getInstance().releaseQuaternion(q),

    // 批量操作
    getBatch: (count: number) =>
        MathPoolManager.getInstance().getVector3Batch(count),

    releaseBatch: (vectors: MMath.Vector3[]) =>
        MathPoolManager.getInstance().releaseVector3Batch(vectors),

    // 预热
    preWarm: () =>
        MathPoolManager.getInstance().preWarmAllPools(),

    // 统计
    getStats: () =>
        MathPoolManager.getInstance().getPoolStatistics(),

    // 清理
    clear: () =>
        MathPoolManager.getInstance().clearAllPools()
};
```

### 4. SIMD优化器

```typescript
/**
 * simd-optimizer.ts
 * SIMD优化器 - 利用SIMD指令加速数学运算
 */

import { MMath } from '@maxellabs/core';

/**
 * SIMD包装器
 */
export class SIMDWrapper {
    private static supported: boolean = this.checkSIMDSupport();

    private static checkSIMDSupport(): boolean {
        // 检查SIMD支持
        return typeof SIMD !== 'undefined' && SIMD.float32x4;
    }

    /**
     * 向量加法
     */
    public static addVec4(a: Float32Array, b: Float32Array, result: Float32Array): void {
        if (this.supported && a.length >= 4 && b.length >= 4 && result.length >= 4) {
            const vecA = SIMD.float32x4.load(a, 0);
            const vecB = SIMD.float32x4.load(b, 0);
            const vecResult = SIMD.float32x4.add(vecA, vecB);
            SIMD.float32x4.store(result, 0, vecResult);
        } else {
            // 降级到标准实现
            for (let i = 0; i < 4; i++) {
                result[i] = a[i] + b[i];
            }
        }
    }

    /**
     * 向量减法
     */
    public static subVec4(a: Float32Array, b: Float32Array, result: Float32Array): void {
        if (this.supported && a.length >= 4 && b.length >= 4 && result.length >= 4) {
            const vecA = SIMD.float32x4.load(a, 0);
            const vecB = SIMD.float32x4.load(b, 0);
            const vecResult = SIMD.float32x4.sub(vecA, vecB);
            SIMD.float32x4.store(result, 0, vecResult);
        } else {
            for (let i = 0; i < 4; i++) {
                result[i] = a[i] - b[i];
            }
        }
    }

    /**
     * 向量乘法
     */
    public static mulVec4(a: Float32Array, b: Float32Array, result: Float32Array): void {
        if (this.supported && a.length >= 4 && b.length >= 4 && result.length >= 4) {
            const vecA = SIMD.float32x4.load(a, 0);
            const vecB = SIMD.float32x4.load(b, 0);
            const vecResult = SIMD.float32x4.mul(vecA, vecB);
            SIMD.float32x4.store(result, 0, vecResult);
        } else {
            for (let i = 0; i < 4; i++) {
                result[i] = a[i] * b[i];
            }
        }
    }

    /**
     * 标量向量乘法
     */
    public static mulScalarVec4(scalar: number, vec: Float32Array, result: Float32Array): void {
        if (this.supported && vec.length >= 4 && result.length >= 4) {
            const scalarVec = SIMD.float32x4.splat(scalar);
            const vec4 = SIMD.float32x4.load(vec, 0);
            const resultVec = SIMD.float32x4.mul(scalarVec, vec4);
            SIMD.float32x4.store(result, 0, resultVec);
        } else {
            for (let i = 0; i < 4; i++) {
                result[i] = scalar * vec[i];
            }
        }
    }

    /**
     * 点积
     */
    public static dotVec4(a: Float32Array, b: Float32Array): number {
        if (this.supported && a.length >= 4 && b.length >= 4) {
            const vecA = SIMD.float32x4.load(a, 0);
            const vecB = SIMD.float32x4.load(b, 0);
            const dotProduct = SIMD.float32x4.dot(vecA, vecB);
            return SIMD.float32x4.extractLane(dotProduct, 0);
        } else {
            let dot = 0;
            for (let i = 0; i < 4; i++) {
                dot += a[i] * b[i];
            }
            return dot;
        }
    }

    /**
     * 长度
     */
    public static lengthVec4(vec: Float32Array): number {
        if (this.supported && vec.length >= 4) {
            const vec4 = SIMD.float32x4.load(vec, 0);
            const dotProduct = SIMD.float32x4.dot(vec4, vec4);
            const lengthSquared = SIMD.float32x4.extractLane(dotProduct, 0);
            return Math.sqrt(lengthSquared);
        } else {
            let lengthSquared = 0;
            for (let i = 0; i < 4; i++) {
                lengthSquared += vec[i] * vec[i];
            }
            return Math.sqrt(lengthSquared);
        }
    }

    /**
     * 归一化
     */
    public static normalizeVec4(vec: Float32Array, result: Float32Array): void {
        const length = this.lengthVec4(vec);
        if (length > 0) {
            this.mulScalarVec4(1 / length, vec, result);
        } else {
            result.set(vec);
        }
    }

    /**
     * 批量向量加法
     */
    public static addVec4Batch(vectorsA: Float32Array[], vectorsB: Float32Array[], results: Float32Array[]): void {
        if (!this.supported) {
            for (let i = 0; i < vectorsA.length; i++) {
                this.addVec4(vectorsA[i], vectorsB[i], results[i]);
            }
            return;
        }

        // SIMD批量处理
        const batchSize = Math.min(vectorsA.length, vectorsB.length, results.length);
        for (let i = 0; i < batchSize; i++) {
            const vecA = SIMD.float32x4.load(vectorsA[i], 0);
            const vecB = SIMD.float32x4.load(vectorsB[i], 0);
            const result = SIMD.float32x4.add(vecA, vecB);
            SIMD.float32x4.store(results[i], 0, result);
        }
    }

    /**
     * 矩阵向量乘法
     */
    public static mulMatrix4Vec4(matrix: Float32Array, vector: Float32Array, result: Float32Array): void {
        if (this.supported && matrix.length >= 16 && vector.length >= 4 && result.length >= 4) {
            // 加载向量
            const vec = SIMD.float32x4.load(vector, 0);

            // 加载矩阵行
            const row0 = SIMD.float32x4.load(matrix, 0);
            const row1 = SIMD.float32x4.load(matrix, 4);
            const row2 = SIMD.float32x4.load(matrix, 8);
            const row3 = SIMD.float32x4.load(matrix, 12);

            // 计算点积
            const x = SIMD.float32x4.dot(row0, vec);
            const y = SIMD.float32x4.dot(row1, vec);
            const z = SIMD.float32x4.dot(row2, vec);
            const w = SIMD.float32x4.dot(row3, vec);

            // 存储结果
            result[0] = SIMD.float32x4.extractLane(x, 0);
            result[1] = SIMD.float32x4.extractLane(y, 0);
            result[2] = SIMD.float32x4.extractLane(z, 0);
            result[3] = SIMD.float32x4.extractLane(w, 0);
        } else {
            // 标准实现
            for (let i = 0; i < 4; i++) {
                result[i] = 0;
                for (let j = 0; j < 4; j++) {
                    result[i] += matrix[i * 4 + j] * vector[j];
                }
            }
        }
    }

    /**
     * 矩阵乘法
     */
    public static mulMatrix4(a: Float32Array, b: Float32Array, result: Float32Array): void {
        if (!this.supported) {
            // 标准矩阵乘法
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    result[i * 4 + j] = 0;
                    for (let k = 0; k < 4; k++) {
                        result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
                    }
                }
            }
            return;
        }

        // SIMD优化矩阵乘法
        const temp = new Float32Array(16);

        // 加载矩阵B的列
        const bCol0 = SIMD.float32x4(b[0], b[4], b[8], b[12]);
        const bCol1 = SIMD.float32x4(b[1], b[5], b[9], b[13]);
        const bCol2 = SIMD.float32x4(b[2], b[6], b[10], b[14]);
        const bCol3 = SIMD.float32x4(b[3], b[7], b[11], b[15]);

        // 计算结果矩阵的列
        for (let i = 0; i < 4; i++) {
            const aRow = SIMD.float32x4(a[i * 4], a[i * 4 + 1], a[i * 4 + 2], a[i * 4 + 3]);

            const col0 = SIMD.float32x4.dot(aRow, bCol0);
            const col1 = SIMD.float32x4.dot(aRow, bCol1);
            const col2 = SIMD.float32x4.dot(aRow, bCol2);
            const col3 = SIMD.float32x4.dot(aRow, bCol3);

            result[i * 4] = SIMD.float32x4.extractLane(col0, 0);
            result[i * 4 + 1] = SIMD.float32x4.extractLane(col1, 0);
            result[i * 4 + 2] = SIMD.float32x4.extractLane(col2, 0);
            result[i * 4 + 3] = SIMD.float32x4.extractLane(col3, 0);
        }
    }
}

/**
 * 批量SIMD处理器
 */
export class BatchSIMDProcessor {
    /**
     * 批量向量变换
     */
    public static transformVectors(
        matrix: Float32Array,
        vectors: Float32Array[],
        results: Float32Array[]
    ): void {
        if (!SIMDWrapper.supported) {
            // 降级处理
            vectors.forEach((vec, i) => {
                SIMDWrapper.mulMatrix4Vec4(matrix, vec, results[i]);
            });
            return;
        }

        // SIMD批量处理
        const batch = SIMD.float32x4.load(matrix, 0);
        const matrixRows = [
            SIMD.float32x4.load(matrix, 0),
            SIMD.float32x4.load(matrix, 4),
            SIMD.float32x4.load(matrix, 8),
            SIMD.float32x4.load(matrix, 12)
        ];

        for (let i = 0; i < vectors.length; i++) {
            const vec = SIMD.float32x4.load(vectors[i], 0);

            const x = SIMD.float32x4.dot(matrixRows[0], vec);
            const y = SIMD.float32x4.dot(matrixRows[1], vec);
            const z = SIMD.float32x4.dot(matrixRows[2], vec);
            const w = SIMD.float32x4.dot(matrixRows[3], vec);

            results[i][0] = SIMD.float32x4.extractLane(x, 0);
            results[i][1] = SIMD.float32x4.extractLane(y, 0);
            results[i][2] = SIMD.float32x4.extractLane(z, 0);
            results[i][3] = SIMD.float32x4.extractLane(w, 0);
        }
    }

    /**
     * 批量光照计算
     */
    public static calculateLighting(
        positions: Float32Array[],
        normals: Float32Array[],
        lightPos: Float32Array,
        lightColor: Float32Array,
        results: Float32Array[]
    ): void {
        if (!SIMDWrapper.supported) {
            // 降级处理
            positions.forEach((pos, i) => {
                const lightDir = [
                    lightPos[0] - pos[0],
                    lightPos[1] - pos[1],
                    lightPos[2] - pos[2],
                    0
                ];
                const length = Math.sqrt(lightDir[0] * lightDir[0] + lightDir[1] * lightDir[1] + lightDir[2] * lightDir[2]);
                lightDir[0] /= length;
                lightDir[1] /= length;
                lightDir[2] /= length;

                const normal = normals[i];
                const dot = normal[0] * lightDir[0] + normal[1] * lightDir[1] + normal[2] * lightDir[2];
                const intensity = Math.max(0, dot);

                results[i][0] = lightColor[0] * intensity;
                results[i][1] = lightColor[1] * intensity;
                results[i][2] = lightColor[2] * intensity;
                results[i][3] = 1;
            });
            return;
        }

        // SIMD批量光照计算
        const lightPosVec = SIMD.float32x4.load(lightPos, 0);
        const lightColorVec = SIMD.float32x4.load(lightColor, 0);

        for (let i = 0; i < positions.length; i++) {
            const pos = SIMD.float32x4.load(positions[i], 0);
            const normal = SIMD.float32x4.load(normals[i], 0);

            // 计算光照方向
            const lightDir = SIMD.float32x4.sub(lightPosVec, pos);

            // 归一化光照方向 (简化)
            const length = SIMDWrapper.lengthVec4(lightDir as any);
            const normalizedDir = new Float32Array(4);
            SIMDWrapper.normalizeVec4(lightDir as any, normalizedDir);

            // 计算点积
            const normalVec = SIMD.float32x4.load(normals[i], 0);
            const dotProduct = SIMD.float32x4.dot(normalVec, SIMD.float32x4.load(normalizedDir, 0));
            const intensity = Math.max(0, SIMD.float32x4.extractLane(dotProduct, 0));

            // 应用光照强度
            const intensityVec = SIMD.float32x4.splat(intensity);
            const result = SIMD.float32x4.mul(lightColorVec, intensityVec);

            SIMD.float32x4.store(results[i], 0, result);
        }
    }

    /**
     * 批量包围盒计算
     */
    public static calculateBoundingBoxes(
        vertices: Float32Array[],
        results: { min: Float32Array; max: Float32Array }[]
    ): void {
        if (!SIMDWrapper.supported) {
            // 降级处理
            vertices.forEach((verts, i) => {
                const min = new Float32Array([Infinity, Infinity, Infinity, 0]);
                const max = new Float32Array([-Infinity, -Infinity, -Infinity, 0]);

                for (let j = 0; j < verts.length; j += 4) {
                    min[0] = Math.min(min[0], verts[j]);
                    min[1] = Math.min(min[1], verts[j + 1]);
                    min[2] = Math.min(min[2], verts[j + 2]);

                    max[0] = Math.max(max[0], verts[j]);
                    max[1] = Math.max(max[1], verts[j + 1]);
                    max[2] = Math.max(max[2], verts[j + 2]);
                }

                results[i] = { min, max };
            });
            return;
        }

        // SIMD包围盒计算
        vertices.forEach((verts, i) => {
            if (verts.length === 0) return;

            let min = SIMD.float32x4.load(verts, 0);
            let max = min;

            // 遍历所有顶点
            for (let j = 4; j < verts.length; j += 4) {
                const current = SIMD.float32x4.load(verts, j);
                min = SIMD.float32x4.min(min, current);
                max = SIMD.float32x4.max(max, current);
            }

            const minArray = new Float32Array(4);
            const maxArray = new Float32Array(4);
            SIMD.float32x4.store(minArray, 0, min);
            SIMD.float32x4.store(maxArray, 0, max);

            results[i] = { min: minArray, max: maxArray };
        });
    }
}

/**
 * SIMD性能基准测试
 */
export class SIMDBenchmark {
    /**
     * 运行基准测试
     */
    public static runBenchmark(iterations: number = 1000000): BenchmarkResult {
        const vectorsA: Float32Array[] = [];
        const vectorsB: Float32Array[] = [];
        const resultsSIMD: Float32Array[] = [];
        const resultsStandard: Float32Array[] = [];

        // 生成测试数据
        for (let i = 0; i < 1000; i++) {
            vectorsA.push(new Float32Array([
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100
            ]));
            vectorsB.push(new Float32Array([
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100,
                Math.random() * 100
            ]));
            resultsSIMD.push(new Float32Array(4));
            resultsStandard.push(new Float32Array(4));
        }

        // SIMD基准测试
        const startTimeSIMD = performance.now();
        for (let i = 0; i < iterations; i++) {
            SIMDWrapper.addVec4Batch(vectorsA, vectorsB, resultsSIMD);
        }
        const simdTime = performance.now() - startTimeSIMD;

        // 标准基准测试
        const startTimeStandard = performance.now();
        for (let i = 0; i < iterations; i++) {
            for (let j = 0; j < vectorsA.length; j++) {
                for (let k = 0; k < 4; k++) {
                    resultsStandard[j][k] = vectorsA[j][k] + vectorsB[j][k];
                }
            }
        }
        const standardTime = performance.now() - startTimeStandard;

        return {
            simdTime,
            standardTime,
            speedup: standardTime / simdTime,
            supported: SIMDWrapper.supported,
            iterations,
            vectorCount: vectorsA.length
        };
    }
}

/**
 * 基准测试结果
 */
export interface BenchmarkResult {
    simdTime: number;
    standardTime: number;
    speedup: number;
    supported: boolean;
    iterations: number;
    vectorCount: number;
}
```

### 5. 内存泄漏检测器

```typescript
/**
 * memory-leak-detector.ts
 * 内存泄漏检测器 - 监控和检测内存泄漏
 */

import { MSpec } from '@maxellabs/core';

/**
 * 内存追踪信息
 */
export interface MemoryTracker {
    objectId: string;
    type: string;
    size: number;
    createdAt: number;
    lastAccessed: number;
    stackTrace: string;
    refCount: number;
}

/**
 * 内存泄漏报告
 */
export interface MemoryLeakReport {
    timestamp: number;
    totalObjects: number;
    totalMemory: number;
    leakedObjects: MemoryTracker[];
    suspiciousPatterns: MemoryLeakPattern[];
    recommendations: string[];
}

/**
 * 内存泄漏模式
 */
export interface MemoryLeakPattern {
    type: 'circular_reference' | 'event_listener' | 'timer' | 'closure' | 'dom_reference';
    severity: 'low' | 'medium' | 'high';
    description: string;
    objects: MemoryTracker[];
}

/**
 * 内存泄漏检测器
 */
export class MemoryLeakDetector {
    private trackers: Map<string, MemoryTracker> = new Map();
    private objectCounter: number = 0;
    private detectionInterval: number = 30000; // 30秒
    private maxTrackedObjects: number = 10000;
    private enabled: boolean = false;
    private detectionTimer: number | null = null;
    private memorySnapshots: MemorySnapshot[] = [];

    constructor(options: MemoryLeakDetectorOptions = {}) {
        this.detectionInterval = options.interval || 30000;
        this.maxTrackedObjects = options.maxTrackedObjects || 10000;
        this.enabled = options.autoStart || false;

        if (this.enabled) {
            this.start();
        }
    }

    /**
     * 开始监控
     */
    public start(): void {
        if (this.enabled) return;

        this.enabled = true;
        this.takeMemorySnapshot();

        this.detectionTimer = window.setInterval(() => {
            this.detectLeaks();
            this.takeMemorySnapshot();
        }, this.detectionInterval);

        console.log('内存泄漏检测器已启动');
    }

    /**
     * 停止监控
     */
    public stop(): void {
        this.enabled = false;
        if (this.detectionTimer) {
            clearInterval(this.detectionTimer);
            this.detectionTimer = null;
        }
        console.log('内存泄漏检测器已停止');
    }

    /**
     * 追踪对象
     */
    public trackObject(obj: any, type: string, size?: number): string {
        if (!this.enabled) return '';

        const objectId = this.generateObjectId();

        const tracker: MemoryTracker = {
            objectId,
            type,
            size: size || this.estimateObjectSize(obj),
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            stackTrace: this.captureStackTrace(),
            refCount: 1
        };

        this.trackers.set(objectId, tracker);

        // 设置弱引用监听 (如果支持)
        if (typeof FinalizationRegistry !== 'undefined') {
            const registry = new FinalizationRegistry((heldValue: string) => {
                this.trackers.delete(heldValue);
            });
            registry.register(obj, objectId);
        }

        return objectId;
    }

    /**
     * 取消追踪对象
     */
    public untrackObject(objectId: string): void {
        this.trackers.delete(objectId);
    }

    /**
     * 访问对象
     */
    public accessObject(objectId: string): void {
        const tracker = this.trackers.get(objectId);
        if (tracker) {
            tracker.lastAccessed = Date.now();
        }
    }

    /**
     * 增加引用计数
     */
    public addRef(objectId: string): void {
        const tracker = this.trackers.get(objectId);
        if (tracker) {
            tracker.refCount++;
        }
    }

    /**
     * 减少引用计数
     */
    public releaseRef(objectId: string): void {
        const tracker = this.trackers.get(objectId);
        if (tracker) {
            tracker.refCount--;
            if (tracker.refCount <= 0) {
                this.trackers.delete(objectId);
            }
        }
    }

    /**
     * 检测内存泄漏
     */
    public detectLeaks(): MemoryLeakReport {
        const now = Date.now();
        const suspiciousObjects: MemoryTracker[] = [];
        const patterns: MemoryLeakPattern[] = [];

        // 清理过期的追踪器
        this.cleanupExpiredTrackers();

        // 分析长期存活的对象
        for (const tracker of this.trackers.values()) {
            const age = now - tracker.createdAt;
            const timeSinceAccess = now - tracker.lastAccessed;

            // 检查可疑对象
            if (age > 60000 && timeSinceAccess > 30000) { // 存在1分钟，30秒未访问
                suspiciousObjects.push(tracker);
            }
        }

        // 检测泄漏模式
        patterns.push(...this.detectCircularReferences());
        patterns.push(...this.detectEventListeners());
        patterns.push(...this.detectTimers());
        patterns.push(...this.detectClosures());

        // 生成报告
        const report: MemoryLeakReport = {
            timestamp: now,
            totalObjects: this.trackers.size,
            totalMemory: this.calculateTotalMemory(),
            leakedObjects: suspiciousObjects,
            suspiciousPatterns: patterns,
            recommendations: this.generateRecommendations(suspiciousObjects, patterns)
        };

        // 输出警告
        if (suspiciousObjects.length > 0 || patterns.length > 0) {
            console.warn('Memory leak detected:', report);
        }

        return report;
    }

    private cleanupExpiredTrackers(): void {
        const now = Date.now();
        const toDelete: string[] = [];

        for (const [id, tracker] of this.trackers) {
            // 删除超过5分钟未访问的对象
            if (now - tracker.lastAccessed > 300000) {
                toDelete.push(id);
            }
        }

        toDelete.forEach(id => this.trackers.delete(id));

        // 限制追踪器数量
        if (this.trackers.size > this.maxTrackedObjects) {
            const sorted = Array.from(this.trackers.entries())
                .sort((a, b) => b[1].lastAccessed - a[1].lastAccessed);

            const excess = sorted.length - this.maxTrackedObjects;
            for (let i = 0; i < excess; i++) {
                this.trackers.delete(sorted[i][0]);
            }
        }
    }

    private detectCircularReferences(): MemoryLeakPattern[] {
        const patterns: MemoryLeakPattern[] = [];
        const visited = new Set();

        // 简化的循环引用检测
        for (const tracker of this.trackers.values()) {
            if (visited.has(tracker.objectId)) continue;

            const cycle = this.findCircularReference(tracker, visited);
            if (cycle.length > 1) {
                patterns.push({
                    type: 'circular_reference',
                    severity: 'medium',
                    description: `Circular reference detected between ${cycle.length} objects`,
                    objects: cycle
                });
            }
        }

        return patterns;
    }

    private findCircularReference(tracker: MemoryTracker, visited: Set<string>): MemoryTracker[] {
        // 简化的循环检测实现
        // 实际实现需要更复杂的对象图分析
        visited.add(tracker.objectId);
        return [tracker];
    }

    private detectEventListeners(): MemoryLeakPattern[] {
        const patterns: MemoryLeakPattern[] = [];
        const now = Date.now();

        // 检查长期存活的事件监听器
        for (const tracker of this.trackers.values()) {
            if (tracker.type === 'event_listener' && (now - tracker.createdAt) > 300000) {
                patterns.push({
                    type: 'event_listener',
                    severity: 'medium',
                    description: 'Long-lived event listener detected',
                    objects: [tracker]
                });
            }
        }

        return patterns;
    }

    private detectTimers(): MemoryLeakPattern[] {
        const patterns: MemoryLeakPattern[] = [];

        // 检查未清理的定时器
        const activeTimers = this.getActiveTimers();
        for (const timer of activeTimers) {
            const tracker = this.trackers.get(timer.id);
            if (tracker) {
                patterns.push({
                    type: 'timer',
                    severity: 'low',
                    description: 'Potential timer leak detected',
                    objects: [tracker]
                });
            }
        }

        return patterns;
    }

    private detectClosures(): MemoryLeakPattern[] {
        const patterns: MemoryLeakPattern[] = [];

        // 检查闭包引用
        for (const tracker of this.trackers.values()) {
            if (tracker.type === 'closure' && tracker.stackTrace.length > 100) {
                patterns.push({
                    type: 'closure',
                    severity: 'low',
                    description: 'Large closure detected',
                    objects: [tracker]
                });
            }
        }

        return patterns;
    }

    private generateRecommendations(
        leakedObjects: MemoryTracker[],
        patterns: MemoryLeakPattern[]
    ): string[] {
        const recommendations: string[] = [];

        if (leakedObjects.length > 100) {
            recommendations.push('大量对象未释放，建议检查对象生命周期管理');
        }

        if (patterns.some(p => p.type === 'circular_reference')) {
            recommendations.push('存在循环引用，使用WeakMap或WeakSet打破循环');
        }

        if (patterns.some(p => p.type === 'event_listener')) {
            recommendations.push('事件监听器未正确清理，确保在对象销毁时移除监听器');
        }

        if (patterns.some(p => p.type === 'timer')) {
            recommendations.push('定时器未清理，使用clearInterval/clearTimeout清理定时器');
        }

        // 内存使用建议
        const totalMemory = this.calculateTotalMemory();
        if (totalMemory > 100 * 1024 * 1024) { // 100MB
            recommendations.push('内存使用量较高，考虑优化数据结构或实现对象池');
        }

        return recommendations;
    }

    private takeMemorySnapshot(): void {
        const snapshot: MemorySnapshot = {
            timestamp: Date.now(),
            objectCount: this.trackers.size,
            memoryUsage: this.calculateTotalMemory(),
            heapUsed: this.getHeapUsed(),
            heapTotal: this.getHeapTotal()
        };

        this.memorySnapshots.push(snapshot);

        // 保持最近10个快照
        if (this.memorySnapshots.length > 10) {
            this.memorySnapshots.shift();
        }
    }

    private calculateTotalMemory(): number {
        let total = 0;
        for (const tracker of this.trackers.values()) {
            total += tracker.size;
        }
        return total;
    }

    private getHeapUsed(): number {
        if ('memory' in performance) {
            return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
    }

    private getHeapTotal(): number {
        if ('memory' in performance) {
            return (performance as any).memory.totalJSHeapSize;
        }
        return 0;
    }

    private generateObjectId(): string {
        return `obj_${++this.objectCounter}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private estimateObjectSize(obj: any): number {
        // 简化的对象大小估算
        if (obj === null || obj === undefined) return 0;
        if (typeof obj === 'number') return 8;
        if (typeof obj === 'string') return obj.length * 2;
        if (typeof obj === 'boolean') return 4;
        if (typeof obj === 'object') {
            return 64; // 基础对象开销
        }
        return 0;
    }

    private captureStackTrace(): string {
        try {
            throw new Error();
        } catch (e) {
            return (e as Error).stack || '';
        }
    }

    private getActiveTimers(): any[] {
        // 获取活动定时器 (简化实现)
        return [];
    }

    /**
     * 获取统计信息
     */
    public getStatistics(): MemoryLeakStatistics {
        return {
            trackedObjects: this.trackers.size,
            totalMemory: this.calculateTotalMemory(),
            oldestObject: this.getOldestObject(),
            memoryTrend: this.getMemoryTrend(),
            snapshots: this.memorySnapshots
        };
    }

    private getOldestObject(): number {
        let oldest = 0;
        const now = Date.now();

        for (const tracker of this.trackers.values()) {
            const age = now - tracker.createdAt;
            if (age > oldest) oldest = age;
        }

        return oldest;
    }

    private getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
        if (this.memorySnapshots.length < 2) return 'stable';

        const recent = this.memorySnapshots.slice(-3);
        const first = recent[0].memoryUsage;
        const last = recent[recent.length - 1].memoryUsage;

        const change = (last - first) / first;
        if (change > 0.1) return 'increasing';
        if (change < -0.1) return 'decreasing';
        return 'stable';
    }

    /**
     * 生成内存报告
     */
    public generateReport(): MemoryLeakReport {
        return this.detectLeaks();
    }

    /**
     * 清理所有追踪器
     */
    public clear(): void {
        this.trackers.clear();
        this.memorySnapshots = [];
        this.objectCounter = 0;
    }
}

/**
 * 内存快照
 */
export interface MemorySnapshot {
    timestamp: number;
    objectCount: number;
    memoryUsage: number;
    heapUsed: number;
    heapTotal: number;
}

/**
 * 内存泄漏统计
 */
export interface MemoryLeakStatistics {
    trackedObjects: number;
    totalMemory: number;
    oldestObject: number;
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    snapshots: MemorySnapshot[];
}

/**
 * 内存泄漏检测器选项
 */
export interface MemoryLeakDetectorOptions {
    interval?: number;
    maxTrackedObjects?: number;
    autoStart?: boolean;
}

/**
 * 全局内存泄漏检测器实例
 */
export const GlobalMemoryLeakDetector = new MemoryLeakDetector({
    interval: 30000,
    maxTrackedObjects: 5000,
    autoStart: false
});

/**
 * 装饰器：自动追踪对象
 */
export function TrackMemory(type: string, size?: number) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            if (GlobalMemoryLeakDetector) {
                const id = GlobalMemoryLeakDetector.trackObject(this, type, size);
                const result = originalMethod.apply(this, args);
                return result;
            }
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * 便捷函数：追踪对象
 */
export function trackObject(obj: any, type: string, size?: number): string {
    return GlobalMemoryLeakDetector.trackObject(obj, type, size);
}

/**
 * 便捷函数：释放对象
 */
export function releaseObject(objectId: string): void {
    GlobalMemoryLeakDetector.untrackObject(objectId);
}
```

### 6. 完整的性能优化演示

```typescript
/**
 * performance-optimization-demo.ts
 * 完整的性能优化演示
 */

import { PerformanceAnalyzer } from './performance-analyzer';
import { RHICommandOptimizer } from './rhi-command-optimizer';
import { MathPool, MathPoolManager } from './math-pool-optimizer';
import { SIMDWrapper, SIMDBenchmark, BatchSIMDProcessor } from './simd-optimizer';
import { GlobalMemoryLeakDetector, trackObject, releaseObject } from './memory-leak-detector';
import { MSpec } from '@maxellabs/core';

/**
 * 性能优化演示
 */
class PerformanceOptimizationDemo {
    private device: MSpec.IRHIDevice;
    private performanceAnalyzer: PerformanceAnalyzer;
    private commandOptimizer: RHICommandOptimizer;
    private mathPool: MathPoolManager;
    private memoryLeakDetector = GlobalMemoryLeakDetector;

    constructor(device: MSpec.IRHIDevice) {
        this.device = device;
        this.performanceAnalyzer = new PerformanceAnalyzer();
        this.commandOptimizer = new RHICommandOptimizer();
        this.mathPool = MathPoolManager.getInstance();

        this.setupPerformanceOptimizations();
    }

    private setupPerformanceOptimizations(): void {
        // 启动内存泄漏检测
        this.memoryLeakDetector.start();

        // 预热Math对象池
        this.mathPool.preWarmAllPools();

        console.log('性能优化系统已初始化');
    }

    /**
     * 运行性能基准测试
     */
    public async runBenchmarks(): Promise<BenchmarkResults> {
        console.log('开始性能基准测试...');

        const results: BenchmarkResults = {
            simd: await this.runSIMDBenchmark(),
            objectPool: await this.runObjectPoolBenchmark(),
            commandOptimization: await this.runCommandOptimizationBenchmark(),
            memoryLeakDetection: this.runMemoryLeakDetectionBenchmark()
        };

        console.log('基准测试完成:', results);
        return results;
    }

    private async runSIMDBenchmark(): Promise<SIMDBenchmarkResult> {
        console.log('运行SIMD基准测试...');
        const result = SIMDBenchmark.runBenchmark(100000);

        console.log(`SIMD性能提升: ${result.speedup.toFixed(2)}x`);
        return {
            supported: result.supported,
            speedup: result.speedup,
            simdTime: result.simdTime,
            standardTime: result.standardTime
        };
    }

    private async runObjectPoolBenchmark(): Promise<ObjectPoolBenchmarkResult> {
        console.log('运行对象池基准测试...');

        const iterations = 100000;

        // 测试对象池性能
        const poolStartTime = performance.now();
        for (let i = 0; i < iterations; i++) {
            const vec = this.mathPool.getVector3(i, i, i);
            this.mathPool.releaseVector3(vec);
        }
        const poolTime = performance.now() - poolStartTime;

        // 测试直接创建性能
        const directStartTime = performance.now();
        for (let i = 0; i < iterations; i++) {
            const vec = new MMath.Vector3(i, i, i);
            // 不需要手动释放，依赖垃圾回收
        }
        const directTime = performance.now() - directStartTime;

        const speedup = directTime / poolTime;
        console.log(`对象池性能提升: ${speedup.toFixed(2)}x`);

        return {
            poolTime,
            directTime,
            speedup,
            iterations
        };
    }

    private async runCommandOptimizationBenchmark(): Promise<CommandOptimizationBenchmarkResult> {
        console.log('运行命令优化基准测试...');

        // 生成测试命令
        const commands = this.generateTestCommands(1000);

        // 测试未优化渲染
        const unoptimizedStartTime = performance.now();
        this.renderCommandsUnoptimized(commands);
        const unoptimizedTime = performance.now() - unoptimizedStartTime;

        // 测试优化渲染
        const optimizedStartTime = performance.now();
        this.commandOptimizer.addCommands(commands);
        this.commandOptimizer.optimizeCommands();
        const optimizedTime = performance.now() - optimizedStartTime;

        const speedup = unoptimizedTime / optimizedTime;
        const stats = this.commandOptimizer.getStatistics();

        console.log(`命令优化性能提升: ${speedup.toFixed(2)}x`);
        console.log(`批处理效果: ${stats.totalCommands} -> ${stats.batchGroups} 组`);

        return {
            unoptimizedTime,
            optimizedTime,
            speedup,
            stats
        };
    }

    private runMemoryLeakDetectionBenchmark(): MemoryLeakDetectionResult {
        console.log('运行内存泄漏检测基准测试...');

        // 创建一些测试对象
        const objects: string[] = [];
        for (let i = 0; i < 100; i++) {
            objects.push(trackObject({ data: new Array(1000).fill(i) }, 'test_object', 4096));
        }

        // 释放一半对象
        for (let i = 0; i < 50; i++) {
            releaseObject(objects[i]);
        }

        // 检测泄漏
        const report = this.memoryLeakDetector.generateReport();
        const stats = this.memoryLeakDetector.getStatistics();

        console.log(`追踪对象数: ${stats.trackedObjects}`);
        console.log(`内存使用量: ${(stats.totalMemory / 1024 / 1024).toFixed(2)} MB`);

        return {
            trackedObjects: stats.trackedObjects,
            totalMemory: stats.totalMemory,
            memoryTrend: stats.memoryTrend,
            leakDetected: report.leakedObjects.length > 0
        };
    }

    private generateTestCommands(count: number): any[] {
        const commands = [];
        for (let i = 0; i < count; i++) {
            commands.push({
                type: 'draw',
                materialId: `material_${i % 10}`,
                priority: Math.random() * 100,
                depth: Math.random() * 100,
                transparent: Math.random() > 0.7
            });
        }
        return commands;
    }

    private renderCommandsUnoptimized(commands: any[]): void {
        // 模拟未优化的渲染流程
        let stateChanges = 0;
        for (const command of commands) {
            // 每个命令都改变状态
            stateChanges++;
        }
        console.log(`未优化状态切换次数: ${stateChanges}`);
    }

    /**
     * 运行实时性能监控
     */
    public startRealTimeMonitoring(): void {
        let frameCount = 0;

        const monitor = () => {
            this.performanceAnalyzer.beginFrame();

            // 模拟渲染工作
            this.simulateRenderWork();

            this.performanceAnalyzer.endFrame();
            frameCount++;

            // 每秒输出一次统计
            if (frameCount % 60 === 0) {
                const metrics = this.performanceAnalyzer.getMetrics();
                console.log(`FPS: ${metrics.frame.fps.toFixed(1)}, Frame Time: ${metrics.frame.frameTime.toFixed(1)}ms`);

                const warnings = this.performanceAnalyzer.getWarnings();
                if (warnings.length > 0) {
                    console.warn('Performance warnings:', warnings);
                }
            }

            requestAnimationFrame(monitor);
        };

        monitor();
    }

    private simulateRenderWork(): void {
        // 模拟渲染工作负载
        this.performanceAnalyzer.startCPUTimer('update');
        this.simulateUpdateWork();
        this.performanceAnalyzer.endCPUTimer('update');

        this.performanceAnalyzer.startCPUTimer('render');
        this.simulateRender();
        this.performanceAnalyzer.endCPUTimer('render');

        // 记录渲染指标
        this.performanceAnalyzer.recordRenderMetrics(
            Math.floor(Math.random() * 100) + 50, // draw calls
            Math.floor(Math.random() * 100000) + 10000, // triangles
            Math.floor(Math.random() * 50000) + 5000, // vertices
            Math.random() * 10 + 5 // render time
        );
    }

    private simulateUpdateWork(): void {
        // 模拟更新工作
        const vectors = this.mathPool.getVector3Batch(100);

        // 执行一些向量运算
        for (let i = 0; i < vectors.length; i++) {
            vectors[i].multiplyScalar(1.01);
        }

        // 释放向量
        this.mathPool.releaseVector3Batch(vectors);
    }

    private simulateRender(): void {
        // 模拟渲染工作
        this.performanceAnalyzer.startGPUTimer('gpu_work');
        // GPU工作模拟
        setTimeout(() => {}, 1);
        this.performanceAnalyzer.endGPUTimer('gpu_work');
    }

    /**
     * 生成性能报告
     */
    public generatePerformanceReport(): PerformanceReport {
        const performanceReport = this.performanceAnalyzer.getReport();
        const memoryReport = this.memoryLeakDetector.generateReport();
        const poolStats = this.mathPool.getPoolStatistics();

        return {
            timestamp: Date.now(),
            performance: performanceReport,
            memory: memoryReport,
            objectPools: poolStats,
            commandOptimization: this.commandOptimizer.getStatistics(),
            recommendations: this.generateOverallRecommendations(performanceReport, memoryReport, poolStats)
        };
    }

    private generateOverallRecommendations(
        performance: any,
        memory: any,
        poolStats: any
    ): string[] {
        const recommendations: string[] = [];

        // 性能建议
        if (performance.metrics.frame.fps < 30) {
            recommendations.push('FPS过低，考虑降低渲染质量或启用LOD');
        }

        if (performance.metrics.frame.drawCalls > 1000) {
            recommendations.push('绘制调用过多，启用实例化渲染或批处理');
        }

        // 内存建议
        if (memory.totalObjects > 1000) {
            recommendations.push('对象数量过多，检查对象生命周期管理');
        }

        if (memory.totalMemory > 100 * 1024 * 1024) {
            recommendations.push('内存使用量过高，考虑使用对象池或压缩技术');
        }

        // 对象池建议
        const totalEfficiency = Object.values(poolStats).reduce((sum: number, stat: any) => sum + stat.efficiency, 0) / Object.keys(poolStats).length;
        if (totalEfficiency < 0.8) {
            recommendations.push('对象池效率较低，调整池大小或预热策略');
        }

        return recommendations;
    }

    /**
     * 清理资源
     */
    public dispose(): void {
        this.memoryLeakDetector.stop();
        this.mathPool.clearAllPools();
        this.commandOptimizer.clear();
        this.performanceAnalyzer.reset();

        console.log('性能优化系统已清理');
    }
}

// 类型定义
export interface BenchmarkResults {
    simd: SIMDBenchmarkResult;
    objectPool: ObjectPoolBenchmarkResult;
    commandOptimization: CommandOptimizationBenchmarkResult;
    memoryLeakDetection: MemoryLeakDetectionResult;
}

export interface SIMDBenchmarkResult {
    supported: boolean;
    speedup: number;
    simdTime: number;
    standardTime: number;
}

export interface ObjectPoolBenchmarkResult {
    poolTime: number;
    directTime: number;
    speedup: number;
    iterations: number;
}

export interface CommandOptimizationBenchmarkResult {
    unoptimizedTime: number;
    optimizedTime: number;
    speedup: number;
    stats: any;
}

export interface MemoryLeakDetectionResult {
    trackedObjects: number;
    totalMemory: number;
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    leakDetected: boolean;
}

export interface PerformanceReport {
    timestamp: number;
    performance: any;
    memory: any;
    objectPools: any;
    commandOptimization: any;
    recommendations: string[];
}

// ==================== 使用示例 ====================

/**
 * 运行性能优化演示
 */
export async function runPerformanceOptimizationDemo() {
    console.log('启动性能优化演示...');

    try {
        // 创建WebGPU设备 (简化)
        const device = await createWebGPUDevice();

        // 创建性能优化演示
        const demo = new PerformanceOptimizationDemo(device);

        // 运行基准测试
        const benchmarkResults = await demo.runBenchmarks();

        // 启动实时监控
        demo.startRealTimeMonitoring();

        // 生成报告
        const report = demo.generatePerformanceReport();
        console.log('性能报告:', report);

        // 10秒后清理
        setTimeout(() => {
            demo.dispose();
            console.log('性能优化演示完成');
        }, 10000);

    } catch (error) {
        console.error('性能优化演示失败:', error);
    }
}

async function createWebGPUDevice(): Promise<MSpec.IRHIDevice> {
    if (!navigator.gpu) {
        throw new Error('WebGPU not supported');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error('Failed to get GPU adapter');
    }

    const device = await adapter.requestDevice();
    return MSpec.RHI.createDevice(device);
}

// 在HTML中运行演示
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        runPerformanceOptimizationDemo().catch(console.error);
    });
}
```

## 关键特性说明

### 1. 性能分析

- **全面监控**: CPU、GPU、内存、渲染性能指标
- **实时警告**: 自动检测性能问题并发出警告
- **趋势分析**: 长期性能趋势监控
- **智能建议**: 基于性能数据的优化建议

### 2. RHI命令优化

- **状态排序**: 减少GPU状态切换
- **批处理**: 合并相似渲染命令
- **实例化**: GPU实例化渲染
- **深度排序**: 正确的透明对象渲染顺序

### 3. Math对象池优化

- **智能预分配**: 根据使用模式预分配对象
- **自动收缩**: 动态调整池大小
- **批量操作**: 高效的批量获取和释放
- **统计监控**: 详细的池使用统计

### 4. SIMD优化

- **自动检测**: 检测SIMD支持并自动启用
- **批量处理**: 利用SIMD进行批量数学运算
- **优雅降级**: 不支持SIMD时自动降级
- **性能基准**: 量化SIMD性能提升

### 5. 内存泄漏检测

- **自动追踪**: 自动对象生命周期追踪
- **模式识别**: 识别常见的内存泄漏模式
- **智能分析**: 分析内存使用趋势
- **预防建议**: 提供内存优化建议

## 最佳实践

### 1. 性能监控

```typescript
// ✅ 定期性能检查
analyzer.beginFrame();
// 渲染代码...
analyzer.endFrame();
analyzer.recordRenderMetrics(drawCalls, triangles, vertices, renderTime);
```

### 2. 对象池使用

```typescript
// ✅ 正确的对象池使用
const vectors = MathPool.getBatch(1000);
// 使用vectors...
MathPool.releaseBatch(vectors);
```

### 3. SIMD优化

```typescript
// ✅ 批量SIMD运算
SIMDWrapper.addVec4Batch(vectorsA, vectorsB, results);
BatchSIMDProcessor.transformVectors(matrix, positions, transformed);
```

### 4. 命令优化

```typescript
// ✅ 优化渲染命令
optimizer.addCommands(commands);
optimizer.optimizeCommands();
optimizer.executeOptimizedCommands(renderPass);
```

## 扩展建议

1. **GPU计算**: 利用WebGPU计算着色器进行并行计算
2. **Web Workers**: 将计算密集型任务移到Worker线程
3. **预计算**: 预计算常用数据避免运行时计算
4. **缓存策略**: 多级缓存系统优化数据访问
5. **自适应质量**: 根据性能动态调整渲染质量

这个性能优化系统提供了全面的解决方案，可以显著提升3D应用的性能表现。