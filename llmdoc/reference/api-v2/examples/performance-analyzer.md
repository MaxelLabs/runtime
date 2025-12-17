---
title: "性能分析器"
description: "实时监控和分析系统性能的工具，包括FPS、GPU时间、CPU时间和内存使用情况"
tags: ["performance", "analysis", "monitoring", "metrics", "fps", "gpu", "cpu", "memory"]
category: "reference"
audience: "developer"
version: "1.0.0"
last_updated: "2025-12-17"
related_docs: ["rhi-command-optimizer.md", "math-object-pool-optimization.md", "performance-optimization-demo.md"]
prerequisites: ["performance-optimization.md"]
complexity: "intermediate"
estimated_read_time: 15
---

# 性能分析器

## 概述

性能分析器是实时监控和分析系统性能的核心工具，提供详细的帧率、GPU、CPU和内存指标，帮助开发者识别性能瓶颈。

## 完整实现

### 1. 性能指标接口

```typescript
/**
 * performance-metrics.ts
 * 性能指标定义
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
```

### 2. 核心性能分析器类

```typescript
/**
 * performance-analyzer.ts
 * 性能分析器核心实现
 */

import { PerformanceMetrics, PerformanceWarning } from './performance-metrics';

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
        // 设置性能监控
        if (typeof window !== 'undefined' && 'performance' in window) {
            // 监控内存使用情况
            this.startMemoryMonitoring();

            // 监控帧率
            this.startFrameRateMonitoring();
        }
    }

    /**
     * 开始新帧分析
     */
    public beginFrame(): void {
        this.frameStartTime = performance.now();

        // 清除当前帧的计时器
        this.gpuTimers.clear();
        this.cpuTimers.clear();

        // 重置帧指标
        this.metrics.frame.drawCalls = 0;
        this.metrics.frame.triangles = 0;
        this.metrics.frame.vertices = 0;
    }

    /**
     * 结束帧分析
     */
    public endFrame(): void {
        const frameTime = performance.now() - this.frameStartTime;

        // 更新帧时间
        this.metrics.frame.frameTime = frameTime;
        this.metrics.frame.renderTime = frameTime - this.metrics.frame.updateTime;

        // 计算FPS
        this.updateFrameRate(frameTime);

        // 更新内存使用情况
        this.updateMemoryMetrics();

        // 检查性能警告
        this.checkPerformanceWarnings();
    }

    /**
     * 更新帧率
     */
    private updateFrameRate(frameTime: number): void {
        this.frameHistory.push(frameTime);

        // 保持历史记录大小
        if (this.frameHistory.length > this.maxHistorySize) {
            this.frameHistory.shift();
        }

        // 计算平均FPS
        const avgFrameTime = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
        this.metrics.frame.fps = 1000 / avgFrameTime;
    }

    /**
     * 开始GPU计时
     */
    public startGPUTimer(name: string): void {
        this.gpuTimers.set(name, performance.now());
    }

    /**
     * 结束GPU计时
     */
    public endGPUTimer(name: string): number {
        const startTime = this.gpuTimers.get(name);
        if (startTime === undefined) {
            console.warn(`GPU timer '${name}' was not started`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.gpuTimers.delete(name);

        // 更新相应的GPU指标
        switch (name) {
            case 'render':
                this.metrics.gpu.gpuTime = duration;
                break;
        }

        return duration;
    }

    /**
     * 开始CPU计时
     */
    public startCPUTimer(name: string): void {
        this.cpuTimers.set(name, performance.now());
    }

    /**
     * 结束CPU计时
     */
    public endCPUTimer(name: string): number {
        const startTime = this.cpuTimers.get(name);
        if (startTime === undefined) {
            console.warn(`CPU timer '${name}' was not started`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.cpuTimers.delete(name);

        // 更新相应的CPU指标
        switch (name) {
            case 'update':
                this.metrics.frame.updateTime = duration;
                break;
            case 'physics':
                this.metrics.cpu.physicsTime = duration;
                break;
            case 'animation':
                this.metrics.cpu.animationTime = duration;
                break;
            case 'culling':
                this.metrics.cpu.cullingTime = duration;
                break;
            case 'sorting':
                this.metrics.cpu.sortingTime = duration;
                break;
        }

        return duration;
    }

    /**
     * 记录渲染调用
     */
    public recordDrawCall(triangles: number, vertices: number): void {
        this.metrics.frame.drawCalls++;
        this.metrics.frame.triangles += triangles;
        this.metrics.frame.vertices += vertices;
    }

    /**
     * 更新内存指标
     */
    private updateMemoryMetrics(): void {
        if (typeof window !== 'undefined' && 'memory' in (window.performance as any)) {
            const memory = (window.performance as any).memory;
            this.metrics.memory.heapUsed = memory.usedJSHeapSize;
            this.metrics.memory.heapTotal = memory.totalJSHeapSize;
            this.metrics.memory.external = 0; // 需要从WebGL上下文获取
            this.metrics.memory.arrayBuffers = 0; // 需要从WebGL上下文获取
        }
    }

    /**
     * 开始内存监控
     */
    private startMemoryMonitoring(): void {
        setInterval(() => {
            this.updateMemoryMetrics();
            this.checkMemoryWarnings();
        }, 1000); // 每秒检查一次
    }

    /**
     * 开始帧率监控
     */
    private startFrameRateMonitoring(): void {
        setInterval(() => {
            this.checkFrameRateWarnings();
        }, 500); // 每0.5秒检查一次
    }

    /**
     * 检查性能警告
     */
    private checkPerformanceWarnings(): void {
        this.checkFrameRateWarnings();
        this.checkMemoryWarnings();
        this.checkGPUWarnings();
        this.checkCPUWarnings();
    }

    /**
     * 检查帧率警告
     */
    private checkFrameRateWarnings(): void {
        const fps = this.metrics.frame.fps;

        if (fps < 30) {
            this.addWarning('fps', 'critical', `FPS过低: ${fps.toFixed(1)}`, fps, 30);
        } else if (fps < 45) {
            this.addWarning('fps', 'high', `FPS偏低: ${fps.toFixed(1)}`, fps, 45);
        } else if (fps < 55) {
            this.addWarning('fps', 'medium', `FPS略低: ${fps.toFixed(1)}`, fps, 55);
        }
    }

    /**
     * 检查内存警告
     */
    private checkMemoryWarnings(): void {
        const memoryUsage = this.metrics.memory.heapUsed / this.metrics.memory.heapTotal;

        if (memoryUsage > 0.9) {
            this.addWarning('memory', 'critical', `内存使用率过高: ${(memoryUsage * 100).toFixed(1)}%`, memoryUsage * 100, 90);
        } else if (memoryUsage > 0.8) {
            this.addWarning('memory', 'high', `内存使用率较高: ${(memoryUsage * 100).toFixed(1)}%`, memoryUsage * 100, 80);
        } else if (memoryUsage > 0.7) {
            this.addWarning('memory', 'medium', `内存使用率偏高: ${(memoryUsage * 100).toFixed(1)}%`, memoryUsage * 100, 70);
        }
    }

    /**
     * 检查GPU警告
     */
    private checkGPUWarnings(): void {
        const gpuTime = this.metrics.gpu.gpuTime;

        if (gpuTime > 33.3) { // 超过30FPS阈值
            this.addWarning('gpu', 'high', `GPU时间过长: ${gpuTime.toFixed(1)}ms`, gpuTime, 33.3);
        } else if (gpuTime > 16.6) { // 超过60FPS阈值
            this.addWarning('gpu', 'medium', `GPU时间较长: ${gpuTime.toFixed(1)}ms`, gpuTime, 16.6);
        }
    }

    /**
     * 检查CPU警告
     */
    private checkCPUWarnings(): void {
        const cpuTime = this.metrics.frame.updateTime;

        if (cpuTime > 10) {
            this.addWarning('cpu', 'high', `CPU更新时间过长: ${cpuTime.toFixed(1)}ms`, cpuTime, 10);
        } else if (cpuTime > 5) {
            this.addWarning('cpu', 'medium', `CPU更新时间较长: ${cpuTime.toFixed(1)}ms`, cpuTime, 5);
        }
    }

    /**
     * 添加警告
     */
    private addWarning(type: PerformanceWarning['type'], severity: PerformanceWarning['severity'], message: string, value: number, threshold: number): void {
        const warning: PerformanceWarning = {
            type,
            severity,
            message,
            value,
            threshold,
            timestamp: performance.now()
        };

        this.warnings.push(warning);

        // 限制警告历史记录
        if (this.warnings.length > 100) {
            this.warnings.shift();
        }

        // 根据严重程度决定是否立即输出
        if (severity === 'critical' || severity === 'high') {
            console.warn(`[性能警告] ${message}`);
        }
    }

    /**
     * 获取当前性能指标
     */
    public getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    /**
     * 获取性能警告
     */
    public getWarnings(): PerformanceWarning[] {
        return [...this.warnings];
    }

    /**
     * 清除警告历史
     */
    public clearWarnings(): void {
        this.warnings = [];
    }

    /**
     * 生成性能报告
     */
    public generateReport(): string {
        const report = [
            '# 性能分析报告',
            '',
            '## 帧率指标',
            `- FPS: ${this.metrics.frame.fps.toFixed(1)}`,
            `- 帧时间: ${this.metrics.frame.frameTime.toFixed(1)}ms`,
            `- 渲染时间: ${this.metrics.frame.renderTime.toFixed(1)}ms`,
            `- 更新时间: ${this.metrics.frame.updateTime.toFixed(1)}ms`,
            `- 绘制调用: ${this.metrics.frame.drawCalls}`,
            `- 三角形数量: ${this.metrics.frame.triangles}`,
            `- 顶点数量: ${this.metrics.frame.vertices}`,
            '',
            '## GPU指标',
            `- GPU时间: ${this.metrics.gpu.gpuTime.toFixed(1)}ms`,
            `- GPU内存使用: ${(this.metrics.gpu.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
            `- 纹理内存: ${(this.metrics.gpu.textureMemory / 1024 / 1024).toFixed(1)}MB`,
            `- 缓冲区内存: ${(this.metrics.gpu.bufferMemory / 1024 / 1024).toFixed(1)}MB`,
            `- 管线创建次数: ${this.metrics.gpu.pipelineCreations}`,
            '',
            '## CPU指标',
            `- 物理更新: ${this.metrics.cpu.physicsTime.toFixed(1)}ms`,
            `- 动画更新: ${this.metrics.cpu.animationTime.toFixed(1)}ms`,
            `- 剔除耗时: ${this.metrics.cpu.cullingTime.toFixed(1)}ms`,
            `- 排序耗时: ${this.metrics.cpu.sortingTime.toFixed(1)}ms`,
            '',
            '## 内存指标',
            `- 堆内存使用: ${(this.metrics.memory.heapUsed / 1024 / 1024).toFixed(1)}MB`,
            `- 堆内存总量: ${(this.metrics.memory.heapTotal / 1024 / 1024).toFixed(1)}MB`,
            `- 使用率: ${((this.metrics.memory.heapUsed / this.metrics.memory.heapTotal) * 100).toFixed(1)}%`,
            '',
            '## 性能警告',
            ...this.warnings.slice(-10).map(w => `- ${w.message}`),
            ''
        ];

        return report.join('\n');
    }
}
```

## 使用示例

### 基本使用

```typescript
import { PerformanceAnalyzer } from './performance-analyzer';

// 创建性能分析器
const analyzer = new PerformanceAnalyzer();

// 在渲染循环中使用
function renderLoop() {
    // 开始帧分析
    analyzer.beginFrame();

    // 开始更新计时
    analyzer.startCPUTimer('update');

    // 执行更新逻辑
    updateScene();

    // 结束更新计时
    analyzer.endCPUTimer('update');

    // 开始渲染计时
    analyzer.startGPUTimer('render');

    // 执行渲染
    renderScene();

    // 结束渲染计时
    analyzer.endGPUTimer('render');

    // 结束帧分析
    analyzer.endFrame();

    // 获取性能指标
    const metrics = analyzer.getMetrics();
    console.log(`FPS: ${metrics.frame.fps.toFixed(1)}`);
}

// 每秒生成一次性能报告
setInterval(() => {
    console.log(analyzer.generateReport());
}, 1000);
```

### 性能监控仪表板

```typescript
/**
 * performance-dashboard.ts
 * 性能监控仪表板
 */

export class PerformanceDashboard {
    private analyzer: PerformanceAnalyzer;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private fpsHistory: number[] = [];
    private memoryHistory: number[] = [];
    private maxHistoryLength = 200;

    constructor(analyzer: PerformanceAnalyzer, canvas: HTMLCanvasElement) {
        this.analyzer = analyzer;
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('无法获取2D渲染上下文');
        this.ctx = ctx;
    }

    /**
     * 更新仪表板
     */
    public update(): void {
        const metrics = this.analyzer.getMetrics();

        // 更新历史数据
        this.fpsHistory.push(metrics.frame.fps);
        this.memoryHistory.push(metrics.memory.heapUsed / 1024 / 1024); // MB

        // 限制历史长度
        if (this.fpsHistory.length > this.maxHistoryLength) {
            this.fpsHistory.shift();
        }
        if (this.memoryHistory.length > this.maxHistoryLength) {
            this.memoryHistory.shift();
        }

        // 绘制仪表板
        this.render();
    }

    /**
     * 渲染仪表板
     */
    private render(): void {
        const { width, height } = this.canvas;

        // 清空画布
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, width, height);

        // 绘制FPS图表
        this.renderFPSChart(10, 10, width - 20, height / 2 - 15);

        // 绘制内存图表
        this.renderMemoryChart(10, height / 2 + 5, width - 20, height / 2 - 15);

        // 绘制当前指标
        this.renderCurrentMetrics();
    }

    /**
     * 绘制FPS图表
     */
    private renderFPSChart(x: number, y: number, width: number, height: number): void {
        const ctx = this.ctx;

        // 绘制背景
        ctx.strokeStyle = '#333';
        ctx.strokeRect(x, y, width, height);

        // 绘制FPS曲线
        if (this.fpsHistory.length > 1) {
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.beginPath();

            for (let i = 0; i < this.fpsHistory.length; i++) {
                const fps = this.fpsHistory[i];
                const px = x + (i / this.maxHistoryLength) * width;
                const py = y + height - (fps / 120) * height; // 假设最大120FPS

                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }

            ctx.stroke();
        }

        // 绘制标题
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText('FPS', x + 5, y + 15);
    }

    /**
     * 绘制内存图表
     */
    private renderMemoryChart(x: number, y: number, width: number, height: number): void {
        const ctx = this.ctx;

        // 绘制背景
        ctx.strokeStyle = '#333';
        ctx.strokeRect(x, y, width, height);

        // 绘制内存曲线
        if (this.memoryHistory.length > 1) {
            ctx.strokeStyle = '#00f';
            ctx.lineWidth = 2;
            ctx.beginPath();

            const maxMemory = Math.max(...this.memoryHistory, 500); // 最小500MB

            for (let i = 0; i < this.memoryHistory.length; i++) {
                const memory = this.memoryHistory[i];
                const px = x + (i / this.maxHistoryLength) * width;
                const py = y + height - (memory / maxMemory) * height;

                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }

            ctx.stroke();
        }

        // 绘制标题
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText('Memory (MB)', x + 5, y + 15);
    }

    /**
     * 绘制当前指标
     */
    private renderCurrentMetrics(): void {
        const metrics = this.analyzer.getMetrics();
        const ctx = this.ctx;

        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';

        const metricsText = [
            `FPS: ${metrics.frame.fps.toFixed(1)}`,
            `Draw Calls: ${metrics.frame.drawCalls}`,
            `Triangles: ${metrics.frame.triangles}`,
            `Memory: ${(metrics.memory.heapUsed / 1024 / 1024).toFixed(1)}MB`
        ];

        let y = 30;
        for (const text of metricsText) {
            ctx.fillText(text, this.canvas.width - 200, y);
            y += 20;
        }
    }
}
```

## 最佳实践

### 1. 合理使用计时器

```typescript
// 好的实践：使用语义化的计时器名称
analyzer.startCPUTimer('physics-update');
// ... 物理更新代码
analyzer.endCPUTimer('physics-update');

// 避免使用无意义的名称
analyzer.startCPUTimer('timer1'); // ❌
```

### 2. 定期清理警告

```typescript
// 每分钟清理一次警告历史
setInterval(() => {
    analyzer.clearWarnings();
}, 60000);
```

### 3. 性能监控分级

```typescript
class PerformanceManager {
    private analyzer: PerformanceAnalyzer;
    private isProduction: boolean;

    constructor() {
        this.analyzer = new PerformanceAnalyzer();
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    public shouldAnalyze(): boolean {
        return !this.isProduction || this.isDebugMode();
    }

    private isDebugMode(): boolean {
        return new URLSearchParams(window.location.search).has('debug');
    }
}
```

## 相关文档

- [RHI命令优化器](./rhi-command-optimizer.md) - 优化渲染命令
- [Math对象池优化](./math-object-pool-optimization.md) - 减少内存分配
- [性能优化完整演示](./performance-optimization-demo.md) - 完整示例