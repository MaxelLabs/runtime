---
title: "性能优化完整演示"
description: "集成所有性能优化技术的完整演示系统，包括实时监控、基准测试和性能分析报告"
tags: ["performance-optimization", "benchmark", "monitoring", "simd", "object-pool", "memory-leak", "demo"]
category: "reference"
audience: "developer"
version: "1.0.0"
last_updated: "2025-12-17"
related_docs: ["performance-analyzer.md", "rhi-command-optimizer.md", "math-object-pool-optimization.md", "simd-optimizer.md", "memory-leak-detector.md"]
prerequisites: ["performance-optimization.md", "../rhi/pipeline/index.md", "../math/core-types/index.md"]
complexity: "advanced"
estimated_read_time: 30
---

# 性能优化完整演示

## 概述

性能优化完整演示是一个综合性的性能测试和监控系统，集成了所有前面介绍的性能优化技术。它提供了实时性能监控、基准测试、性能分析报告和优化建议，帮助开发者全面了解和优化3D应用的性能。

## 系统架构

### 1. 核心演示系统

```typescript
/**
 * performance-optimization-demo.ts
 * 完整的性能优化演示系统
 */

import { PerformanceAnalyzer } from './performance-analyzer';
import { RHICommandOptimizer } from './rhi-command-optimizer';
import { MathPoolManager } from './math-object-pool-optimization';
import { SIMDDetector, SIMDVectorOptimizer } from './simd-optimizer';
import { MemoryLeakDetector } from './memory-leak-detector';
import { MSpec } from '@maxellabs/core';

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    drawCalls: number;
    triangles: number;
    memoryUsage: number;
    gpuTime: number;
    stateChanges: number;
    objectPoolEfficiency: number;
    simdSpeedup: number;
}

/**
 * 基准测试结果
 */
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
    features: string[];
}

export interface ObjectPoolBenchmarkResult {
    poolTime: number;
    directTime: number;
    speedup: number;
    iterations: number;
    memoryReduction: number;
}

export interface CommandOptimizationBenchmarkResult {
    unoptimizedTime: number;
    optimizedTime: number;
    speedup: number;
    batchReduction: number;
    stateChangeReduction: number;
}

export interface MemoryLeakDetectionResult {
    trackedObjects: number;
    totalMemory: number;
    leakDetected: boolean;
    memoryTrend: {
        isGrowing: boolean;
        growthRate: number;
    };
}

/**
 * 性能优化演示系统
 */
export class PerformanceOptimizationDemo {
    private device: MSpec.IRHIDevice;
    private performanceAnalyzer: PerformanceAnalyzer;
    private commandOptimizer: RHICommandOptimizer;
    private mathPoolManager: MathPoolManager;
    private memoryLeakDetector: MemoryLeakDetector;
    private monitoringEnabled: boolean = false;
    private monitoringInterval: number = 5000; // 5秒

    constructor(device: MSpec.IRHIDevice) {
        this.device = device;
        this.initializeComponents();
        this.setupPerformanceOptimizations();
    }

    /**
     * 初始化组件
     */
    private initializeComponents(): void {
        this.performanceAnalyzer = new PerformanceAnalyzer();
        this.commandOptimizer = new RHICommandOptimizer({
            instancingEnabled: true,
            maxInstancesPerBatch: 1024
        });
        this.mathPoolManager = MathPoolManager.getInstance();
        this.memoryLeakDetector = new MemoryLeakDetector({
            interval: 30000,
            autoStart: false,
            enableStackTrace: true
        });
    }

    /**
     * 设置性能优化
     */
    private setupPerformanceOptimizations(): void {
        // 启动内存泄漏检测
        this.memoryLeakDetector.start();

        // 预热Math对象池
        this.mathPoolManager.preWarmAll();

        // 检测SIMD支持
        const simCapabilities = SIMDDetector.detectCapabilities();
        console.log('SIMD支持:', simCapabilities.supported ? '是' : '否');
        if (simCapabilities.supported) {
            console.log('SIMD特性:', simCapabilities.features);
        }

        console.log('性能优化系统已初始化');
    }

    /**
     * 运行完整基准测试
     */
    public async runCompleteBenchmark(): Promise<BenchmarkResults> {
        console.log('🚀 开始完整性能基准测试...');

        const results: BenchmarkResults = {
            simd: await this.runSIMDBenchmark(),
            objectPool: await this.runObjectPoolBenchmark(),
            commandOptimization: await this.runCommandOptimizationBenchmark(),
            memoryLeakDetection: this.runMemoryLeakDetectionBenchmark()
        };

        this.generateBenchmarkReport(results);
        return results;
    }

    /**
     * SIMD基准测试
     */
    private async runSIMDBenchmark(): Promise<SIMDBenchmarkResult> {
        console.log('📊 运行SIMD基准测试...');

        const capabilities = SIMDDetector.detectCapabilities();
        const iterations = 100000;

        if (!capabilities.supported) {
            return {
                supported: false,
                speedup: 0,
                simdTime: 0,
                standardTime: 0,
                features: []
            };
        }

        // 准备测试数据
        const vecA = new Float32Array([1, 2, 3, 4]);
        const vecB = new Float32Array([5, 6, 7, 8]);
        const result = new Float32Array(4);

        // SIMD测试
        const simdStartTime = performance.now();
        for (let i = 0; i < iterations; i++) {
            SIMDVectorOptimizer.add(vecA, vecB, result);
        }
        const simdTime = performance.now() - simdStartTime;

        // 标准测试
        const standardStartTime = performance.now();
        for (let i = 0; i < iterations; i++) {
            for (let j = 0; j < 4; j++) {
                result[j] = vecA[j] + vecB[j];
            }
        }
        const standardTime = performance.now() - standardStartTime;

        const speedup = standardTime / simdTime;

        console.log(`✅ SIMD性能提升: ${speedup.toFixed(2)}x`);

        return {
            supported: true,
            speedup,
            simdTime,
            standardTime,
            features: capabilities.features
        };
    }

    /**
     * 对象池基准测试
     */
    private async runObjectPoolBenchmark(): Promise<ObjectPoolBenchmarkResult> {
        console.log('🏊 运行对象池基准测试...');

        const iterations = 100000;

        // 对象池测试
        const poolStartTime = performance.now();
        for (let i = 0; i < iterations; i++) {
            const vec = this.mathPoolManager.vector3.acquireWithValues(i, i, i);
            this.mathPoolManager.vector3.release(vec);
        }
        const poolTime = performance.now() - poolStartTime;

        // 直接创建测试
        const directStartTime = performance.now();
        for (let i = 0; i < iterations; i++) {
            const vec = new MMath.Vector3(i, i, i);
            // 依赖垃圾回收
        }
        const directTime = performance.now() - directStartTime;

        const speedup = directTime / poolTime;

        // 计算内存减少
        const poolStats = this.mathPoolManager.getComprehensiveStatistics();
        const estimatedDirectMemory = iterations * 24; // Vector3约24字节
        const memoryReduction = (estimatedDirectMemory - poolStats.totalMemoryUsage) / estimatedDirectMemory;

        console.log(`✅ 对象池性能提升: ${speedup.toFixed(2)}x`);
        console.log(`✅ 内存减少: ${(memoryReduction * 100).toFixed(1)}%`);

        return {
            poolTime,
            directTime,
            speedup,
            iterations,
            memoryReduction: memoryReduction * 100
        };
    }

    /**
     * 命令优化基准测试
     */
    private async runCommandOptimizationBenchmark(): Promise<CommandOptimizationBenchmarkResult> {
        console.log('⚡ 运行命令优化基准测试...');

        const commands = this.generateTestCommands(1000);

        // 未优化测试
        const unoptimizedStartTime = performance.now();
        let unoptimizedStateChanges = 0;
        for (const command of commands) {
            // 模拟每个命令都改变状态
            unoptimizedStateChanges++;
        }
        const unoptimizedTime = performance.now() - unoptimizedStartTime;

        // 优化测试
        this.commandOptimizer.clear();
        const optimizedStartTime = performance.now();
        this.commandOptimizer.addCommands(commands);
        this.commandOptimizer.optimizeCommands();
        const optimizedTime = performance.now() - optimizedStartTime;

        const stats = this.commandOptimizer.getOptimizationStats();
        const speedup = unoptimizedTime / optimizedTime;
        const batchReduction = ((stats.originalCommands - stats.batchedGroups) / stats.originalCommands) * 100;
        const stateChangeReduction = ((unoptimizedStateChanges - stats.stateChanges) / unoptimizedStateChanges) * 100;

        console.log(`✅ 命令优化性能提升: ${speedup.toFixed(2)}x`);
        console.log(`✅ 批处理减少: ${batchReduction.toFixed(1)}%`);
        console.log(`✅ 状态切换减少: ${stateChangeReduction.toFixed(1)}%`);

        return {
            unoptimizedTime,
            optimizedTime,
            speedup,
            batchReduction,
            stateChangeReduction
        };
    }

    /**
     * 内存泄漏检测基准测试
     */
    private runMemoryLeakDetectionBenchmark(): MemoryLeakDetectionResult {
        console.log('🔍 运行内存泄漏检测基准测试...');

        // 创建测试对象
        const objects: string[] = [];
        for (let i = 0; i < 100; i++) {
            const obj = { data: new Array(1000).fill(i), id: i };
            const trackerId = this.memoryLeakDetector.trackObject(obj, 'test_object', 4096);
            objects.push(trackerId);
        }

        // 释放一半对象
        for (let i = 0; i < 50; i++) {
            this.memoryLeakDetector.untrackObject(objects[i]);
        }

        // 执行泄漏检测
        const report = this.memoryLeakDetector.performDetection();
        const stats = this.memoryLeakDetector.getStatistics();
        const snapshots = this.memoryLeakDetector.getSnapshots();
        const trend = snapshots.length >= 2 ?
            this.memoryLeakDetector['tracker'].analyzeMemoryTrend() :
            { isGrowing: false, growthRate: 0, projectedUsage: 0 };

        console.log(`✅ 追踪对象数: ${stats.totalObjects}`);
        console.log(`✅ 内存使用量: ${(stats.totalMemory / 1024 / 1024).toFixed(2)} MB`);

        return {
            trackedObjects: stats.totalObjects,
            totalMemory: stats.totalMemory,
            leakDetected: report.summary.leaksDetected > 0,
            memoryTrend: trend
        };
    }

    /**
     * 生成测试命令
     */
    private generateTestCommands(count: number): any[] {
        const commands = [];
        const materials = ['material_1', 'material_2', 'material_3', 'material_4', 'material_5'];

        for (let i = 0; i < count; i++) {
            commands.push({
                type: Math.random() > 0.5 ? 'draw' : 'draw_indexed',
                materialId: materials[i % materials.length],
                priority: Math.random() * 100,
                depth: Math.random() * 100,
                transparent: Math.random() > 0.7
            });
        }

        return commands;
    }

    /**
     * 生成基准测试报告
     */
    private generateBenchmarkReport(results: BenchmarkResults): void {
        console.log('\n📈 ================ 性能基准测试报告 ================');
        console.log(`🔧 SIMD优化:`);
        console.log(`   - 支持: ${results.simd.supported ? '是' : '否'}`);
        console.log(`   - 性能提升: ${results.simd.speedup.toFixed(2)}x`);
        console.log(`   - 特性: ${results.simd.features.join(', ')}`);

        console.log(`\n🏊 对象池优化:`);
        console.log(`   - 性能提升: ${results.objectPool.speedup.toFixed(2)}x`);
        console.log(`   - 内存减少: ${results.objectPool.memoryReduction.toFixed(1)}%`);
        console.log(`   - 测试迭代: ${results.objectPool.iterations}`);

        console.log(`\n⚡ 命令优化:`);
        console.log(`   - 性能提升: ${results.commandOptimization.speedup.toFixed(2)}x`);
        console.log(`   - 批处理减少: ${results.commandOptimization.batchReduction.toFixed(1)}%`);
        console.log(`   - 状态切换减少: ${results.commandOptimization.stateChangeReduction.toFixed(1)}%`);

        console.log(`\n🔍 内存泄漏检测:`);
        console.log(`   - 追踪对象: ${results.memoryLeakDetection.trackedObjects}`);
        console.log(`   - 内存使用: ${(results.memoryLeakDetection.totalMemory / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   - 泄漏检测: ${results.memoryLeakDetection.leakDetected ? '发现' : '未发现'}`);

        console.log('\n💡 优化建议:');
        if (results.simd.supported && results.simd.speedup > 2) {
            console.log('   - 充分利用SIMD加速数学运算');
        }
        if (results.objectPool.speedup > 3) {
            console.log('   - 大量使用对象池减少GC压力');
        }
        if (results.commandOptimization.speedup > 2) {
            console.log('   - 启用渲染命令批处理优化');
        }
        if (results.memoryLeakDetection.leakDetected) {
            console.log('   - 注意内存管理，及时释放资源');
        }
        console.log('================================================\n');
    }

    /**
     * 启动实时监控
     */
    public startRealTimeMonitoring(): void {
        if (this.monitoringEnabled) return;

        this.monitoringEnabled = true;
        this.performanceAnalyzer.beginFrame();

        const monitoringLoop = () => {
            if (!this.monitoringEnabled) return;

            this.collectPerformanceMetrics();
            setTimeout(monitoringLoop, this.monitoringInterval);
        };

        monitoringLoop();
        console.log('实时性能监控已启动');
    }

    /**
     * 停止实时监控
     */
    public stopRealTimeMonitoring(): void {
        this.monitoringEnabled = false;
        console.log('实时性能监控已停止');
    }

    /**
     * 收集性能指标
     */
    private collectPerformanceMetrics(): void {
        const metrics = this.performanceAnalyzer.getMetrics();
        const poolStats = this.mathPoolManager.getComprehensiveStatistics();
        const cmdStats = this.commandOptimizer.getOptimizationStats();

        const performanceData: PerformanceMetrics = {
            fps: metrics.frame.fps,
            frameTime: metrics.frame.frameTime,
            drawCalls: metrics.frame.drawCalls,
            triangles: metrics.frame.triangles,
            memoryUsage: metrics.memory.heapUsed,
            gpuTime: metrics.gpu.gpuTime,
            stateChanges: cmdStats.stateChanges,
            objectPoolEfficiency: poolStats.globalEfficiency,
            simdSpeedup: SIMDDetector.detectCapabilities().supported ? 2.5 : 1.0 // 示例值
        };

        this.displayPerformanceMetrics(performanceData);
    }

    /**
     * 显示性能指标
     */
    private displayPerformanceMetrics(metrics: PerformanceMetrics): void {
        console.clear();
        console.log('📊 ================ 实时性能监控 ================');
        console.log(`🎮 FPS: ${metrics.fps.toFixed(1)}`);
        console.log(`⏱️  帧时间: ${metrics.frameTime.toFixed(2)}ms`);
        console.log(`📐 绘制调用: ${metrics.drawCalls}`);
        console.log(`🔺 三角形: ${metrics.triangles.toLocaleString()}`);
        console.log(`💾 内存使用: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
        console.log(`🎯 GPU时间: ${metrics.gpuTime.toFixed(2)}ms`);
        console.log(`🔄 状态切换: ${metrics.stateChanges}`);
        console.log(`🏊 对象池效率: ${(metrics.objectPoolEfficiency * 100).toFixed(1)}%`);
        console.log(`⚡ SIMD加速: ${metrics.simdSpeedup.toFixed(1)}x`);

        // 性能警告
        if (metrics.fps < 30) {
            console.log('⚠️  FPS过低！');
        }
        if (metrics.memoryUsage > 100 * 1024 * 1024) {
            console.log('⚠️  内存使用过高！');
        }
        if (metrics.frameTime > 33.3) {
            console.log('⚠️  帧时间过长！');
        }

        console.log('================================================');
    }

    /**
     * 演示渲染场景
     */
    public renderDemoScene(renderPass: MSpec.IRHIRenderPass): void {
        this.performanceAnalyzer.beginFrame();

        // 开始GPU计时
        this.performanceAnalyzer.startGPUTimer('render');

        // 生成渲染命令
        const commands = this.generateDemoSceneCommands();

        // 优化和执行命令
        this.commandOptimizer.clear();
        this.commandOptimizer.addCommands(commands);
        this.commandOptimizer.optimizeCommands();
        this.commandOptimizer.executeOptimizedRender(renderPass);

        // 结束GPU计时
        this.performanceAnalyzer.endGPUTimer('render');

        // 记录绘制调用
        this.performanceAnalyzer.recordDrawCall(
            commands.length * 1000, // 估算三角形数量
            commands.length * 500   // 估算顶点数量
        );

        this.performanceAnalyzer.endFrame();
    }

    /**
     * 生成演示场景命令
     */
    private generateDemoSceneCommands(): any[] {
        const commands = [];
        const objectCount = 1000;

        for (let i = 0; i < objectCount; i++) {
            const angle = (i / objectCount) * Math.PI * 2;
            const radius = 10;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            commands.push({
                type: 'draw',
                materialId: i % 2 === 0 ? 'material_pbr' : 'material_unlit',
                position: { x, y: 0, z },
                scale: { x: 1, y: 1, z: 1 },
                rotation: { x: 0, y: angle, z: 0 },
                transparent: i % 10 === 0,
                depth: z
            });
        }

        return commands;
    }

    /**
     * 获取综合性能报告
     */
    public getComprehensivePerformanceReport(): string {
        const perfMetrics = this.performanceAnalyzer.getMetrics();
        const poolStats = this.mathPoolManager.getComprehensiveStatistics();
        const cmdStats = this.commandOptimizer.getOptimizationStats();
        const memReport = this.memoryLeakDetector.performDetection();
        const simCapabilities = SIMDDetector.detectCapabilities();

        const report = [
            '# 综合性能报告',
            '',
            '## 系统概览',
            `- FPS: ${perfMetrics.frame.fps.toFixed(1)}`,
            `- 帧时间: ${perfMetrics.frame.frameTime.toFixed(2)}ms`,
            `- 内存使用: ${(perfMetrics.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
            `- GPU时间: ${perfMetrics.gpu.gpuTime.toFixed(2)}ms`,
            '',
            '## 优化效果',
            `- 对象池效率: ${(poolStats.globalEfficiency * 100).toFixed(1)}%`,
            `- 命令优化率: ${((cmdStats.originalCommands - cmdStats.batchedGroups) / cmdStats.originalCommands * 100).toFixed(1)}%`,
            `- SIMD支持: ${simCapabilities.supported ? '是' : '否'}`,
            `- 内存泄漏: ${memReport.summary.leaksDetected > 0 ? '检测到' : '未检测到'}`,
            '',
            '## 详细统计',
            ...this.generateDetailedStats(perfMetrics, poolStats, cmdStats),
            '',
            '## 优化建议',
            ...this.generateOptimizationRecommendations(perfMetrics, poolStats, cmdStats, memReport),
            ''
        ];

        return report.join('\n');
    }

    /**
     * 生成详细统计
     */
    private generateDetailedStats(perfMetrics: any, poolStats: any, cmdStats: any): string[] {
        return [
            '### 性能指标',
            `- 绘制调用: ${perfMetrics.frame.drawCalls}`,
            `- 三角形数量: ${perfMetrics.frame.triangles.toLocaleString()}`,
            `- 顶点数量: ${perfMetrics.frame.vertices.toLocaleString()}`,
            `- 更新时间: ${perfMetrics.frame.updateTime.toFixed(2)}ms`,
            '',
            '### 对象池统计',
            `- 总对象数: ${poolStats.totalActiveObjects}`,
            `- 总内存: ${(poolStats.totalMemoryUsage / 1024).toFixed(1)}KB`,
            `- Vector3池: ${poolStats.vector3.activeObjects}/${poolStats.vector3.totalObjects}`,
            `- Matrix4池: ${poolStats.matrix4.activeObjects}/${poolStats.matrix4.totalObjects}`,
            '',
            '### 命令优化统计',
            `- 原始命令: ${cmdStats.originalCommands}`,
            `- 批处理后: ${cmdStats.batchedGroups}`,
            `- 状态切换: ${cmdStats.stateChanges}`,
            `- 缓存命中: ${cmdStats.cacheHits}`,
            ''
        ];
    }

    /**
     * 生成优化建议
     */
    private generateOptimizationRecommendations(perfMetrics: any, poolStats: any, cmdStats: any, memReport: any): string[] {
        const recommendations: string[] = [];

        if (perfMetrics.frame.fps < 60) {
            recommendations.push('- 启用所有性能优化选项，包括SIMD和批处理');
        }

        if (poolStats.globalEfficiency < 0.8) {
            recommendations.push('- 增加对象池预分配数量，提高池命中率');
        }

        if (cmdStats.originalCommands / cmdStats.batchedGroups > 10) {
            recommendations.push('- 优化材质和状态分组，提高批处理效果');
        }

        if (memReport.summary.leaksDetected > 0) {
            recommendations.push('- 检查内存泄漏报告，及时释放未使用的资源');
        }

        if (perfMetrics.memory.heapUsed > 200 * 1024 * 1024) {
            recommendations.push('- 内存使用量较高，考虑启用自动内存清理');
        }

        return recommendations.length > 0 ? recommendations : ['- 当前性能表现良好，无需额外优化'];
    }
}
```

### 2. 使用示例

```typescript
/**
 * demo-usage-example.ts
 * 演示系统使用示例
 */

import { PerformanceOptimizationDemo } from './performance-optimization-demo';
import { MSpec } from '@maxellabs/core';

/**
 * 主演示函数
 */
async function main(): Promise<void> {
    // 假设已初始化WebGL设备和渲染管线
    const device = {} as MSpec.IRHIDevice;
    const renderPass = {} as MSpec.IRHIRenderPass;

    // 创建演示系统
    const demo = new PerformanceOptimizationDemo(device);

    console.log('🚀 Maxell 3D Runtime 性能优化演示');
    console.log('========================================');

    // 1. 运行完整基准测试
    console.log('\n1️⃣ 运行性能基准测试...');
    const benchmarkResults = await demo.runCompleteBenchmark();

    // 2. 启动实时监控
    console.log('\n2️⃣ 启动实时性能监控...');
    demo.startRealTimeMonitoring();

    // 3. 模拟渲染循环
    console.log('\n3️⃣ 开始演示渲染...');
    let frameCount = 0;
    const renderInterval = setInterval(() => {
        demo.renderDemoScene(renderPass);
        frameCount++;

        if (frameCount >= 100) {
            clearInterval(renderInterval);
            demo.stopRealTimeMonitoring();
        }
    }, 16); // ~60 FPS

    // 4. 生成最终报告
    setTimeout(() => {
        console.log('\n4️⃣ 生成最终性能报告...');
        const report = demo.getComprehensivePerformanceReport();
        console.log(report);
    }, 5000);
}

/**
 * 性能对比测试
 */
async function performanceComparisonTest(): Promise<void> {
    console.log('\n🆚 性能对比测试');
    console.log('==================');

    const device = {} as MSpec.IRHIDevice;

    // 测试未优化版本
    console.log('测试未优化版本...');
    const unoptimizedDemo = new PerformanceOptimizationDemo(device);
    unoptimizedDemo.stopRealTimeMonitoring(); // 禁用所有优化

    // 测试优化版本
    console.log('测试优化版本...');
    const optimizedDemo = new PerformanceOptimizationDemo(device);

    // 运行相同的测试用例并比较结果
    // 这里可以添加具体的对比逻辑
}

/**
 * 自定义配置示例
 */
function customConfigurationExample(): void {
    console.log('\n⚙️ 自定义配置示例');
    console.log('===================');

    // 自定义对象池配置
    const poolManager = MathPoolManager.getInstance();
    poolManager.vector3.preWarm(2048);  // 预分配2048个Vector3
    poolManager.matrix4.preWarm(4096);  // 预分配4096个Matrix4

    // 自定义命令优化器配置
    const commandOptimizer = new RHICommandOptimizer({
        instancingEnabled: true,
        maxInstancesPerBatch: 2048
    });

    // 自定义内存泄漏检测器配置
    const memoryLeakDetector = new MemoryLeakDetector({
        interval: 15000,        // 15秒检测间隔
        maxTrackedObjects: 20000,
        autoStart: true,
        enableStackTrace: true
    });

    console.log('自定义配置已应用');
}

/**
 * 性能监控仪表板示例
 */
function performanceDashboardExample(): void {
    console.log('\n📊 性能监控仪表板');
    console.log('===================');

    const device = {} as MSpec.IRHIDevice;
    const demo = new PerformanceOptimizationDemo(device);

    // 创建HTML仪表板
    const dashboard = createPerformanceDashboard(demo);

    // 启动监控
    demo.startRealTimeMonitoring();

    // 定期更新仪表板
    setInterval(() => {
        dashboard.update();
    }, 1000);

    console.log('性能仪表板已启动');
}

/**
 * 创建性能仪表板
 */
function createPerformanceDashboard(demo: PerformanceOptimizationDemo): PerformanceDashboard {
    return new PerformanceDashboard(demo);
}

class PerformanceDashboard {
    constructor(private demo: PerformanceOptimizationDemo) {}

    public update(): void {
        const report = this.demo.getComprehensivePerformanceReport();
        // 这里可以实现HTML/CSS仪表板更新逻辑
        console.log('📊 仪表板更新:', new Date().toLocaleTimeString());
    }
}

// 运行演示
if (typeof window !== 'undefined') {
    main().catch(console.error);
}
```

### 3. 性能监控仪表板

```typescript
/**
 * performance-dashboard.ts
 * 可视化性能监控仪表板
 */

export class PerformanceDashboard {
    private demo: PerformanceOptimizationDemo;
    private container: HTMLElement;
    private charts: Map<string, any> = new Map();

    constructor(demo: PerformanceOptimizationDemo, containerId: string) {
        this.demo = demo;
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`容器 #${containerId} 未找到`);
        this.container = container;
        this.createDashboard();
    }

    /**
     * 创建仪表板
     */
    private createDashboard(): void {
        this.container.innerHTML = `
            <div class="performance-dashboard">
                <h2>性能监控仪表板</h2>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>FPS</h3>
                        <div id="fps-value" class="metric-value">0</div>
                        <div class="metric-unit">frames/s</div>
                    </div>

                    <div class="metric-card">
                        <h3>内存使用</h3>
                        <div id="memory-value" class="metric-value">0</div>
                        <div class="metric-unit">MB</div>
                    </div>

                    <div class="metric-card">
                        <h3>绘制调用</h3>
                        <div id="drawcalls-value" class="metric-value">0</div>
                        <div class="metric-unit">calls/frame</div>
                    </div>

                    <div class="metric-card">
                        <h3>对象池效率</h3>
                        <div id="pool-efficiency-value" class="metric-value">0</div>
                        <div class="metric-unit">%</div>
                    </div>
                </div>

                <div class="charts-section">
                    <div class="chart-container">
                        <h3>FPS历史</h3>
                        <canvas id="fps-chart" width="400" height="200"></canvas>
                    </div>

                    <div class="chart-container">
                        <h3>内存使用趋势</h3>
                        <canvas id="memory-chart" width="400" height="200"></canvas>
                    </div>
                </div>

                <div class="optimization-status">
                    <h3>优化状态</h3>
                    <div id="optimization-indicators"></div>
                </div>
            </div>
        `;

        this.initializeCharts();
    }

    /**
     * 初始化图表
     */
    private initializeCharts(): void {
        // FPS图表
        const fpsChart = document.getElementById('fps-chart') as HTMLCanvasElement;
        this.charts.set('fps', new LineChart(fpsChart, {
            min: 0,
            max: 120,
            color: '#00ff00',
            label: 'FPS'
        }));

        // 内存图表
        const memoryChart = document.getElementById('memory-chart') as HTMLCanvasElement;
        this.charts.set('memory', new LineChart(memoryChart, {
            min: 0,
            max: 500,
            color: '#ff6600',
            label: 'Memory (MB)'
        }));
    }

    /**
     * 更新仪表板
     */
    public update(): void {
        const report = this.demo.getComprehensivePerformanceReport();

        // 解析报告获取指标
        const metrics = this.parseMetricsFromReport(report);

        // 更新指标卡片
        this.updateMetricCards(metrics);

        // 更新图表
        this.updateCharts(metrics);

        // 更新优化状态
        this.updateOptimizationStatus(metrics);
    }

    /**
     * 解析指标
     */
    private parseMetricsFromReport(report: string): any {
        const lines = report.split('\n');
        const metrics: any = {};

        lines.forEach(line => {
            if (line.includes('FPS:')) {
                metrics.fps = parseFloat(line.split(':')[1].trim());
            } else if (line.includes('内存使用:')) {
                metrics.memory = parseFloat(line.split(':')[1].replace('MB', '').trim());
            } else if (line.includes('绘制调用:')) {
                metrics.drawCalls = parseInt(line.split(':')[1].trim());
            } else if (line.includes('对象池效率:')) {
                metrics.poolEfficiency = parseFloat(line.split(':')[1].replace('%', '').trim());
            }
        });

        return metrics;
    }

    /**
     * 更新指标卡片
     */
    private updateMetricCards(metrics: any): void {
        const fpsElement = document.getElementById('fps-value');
        const memoryElement = document.getElementById('memory-value');
        const drawCallsElement = document.getElementById('drawcalls-value');
        const poolEfficiencyElement = document.getElementById('pool-efficiency-value');

        if (fpsElement) fpsElement.textContent = metrics.fps?.toFixed(1) || '0';
        if (memoryElement) memoryElement.textContent = metrics.memory?.toFixed(1) || '0';
        if (drawCallsElement) drawCallsElement.textContent = metrics.drawCalls?.toLocaleString() || '0';
        if (poolEfficiencyElement) poolEfficiencyElement.textContent = metrics.poolEfficiency?.toFixed(1) || '0';

        // 根据性能指标设置颜色
        if (fpsElement) {
            fpsElement.className = 'metric-value ' + this.getPerformanceClass(metrics.fps, 60, 30);
        }
        if (memoryElement) {
            memoryElement.className = 'metric-value ' + this.getPerformanceClass(500 - metrics.memory, 200, 100);
        }
    }

    /**
     * 更新图表
     */
    private updateCharts(metrics: any): void {
        const fpsChart = this.charts.get('fps');
        const memoryChart = this.charts.get('memory');

        if (fpsChart && metrics.fps) {
            fpsChart.addData(metrics.fps);
        }

        if (memoryChart && metrics.memory) {
            memoryChart.addData(metrics.memory);
        }
    }

    /**
     * 更新优化状态
     */
    private updateOptimizationStatus(metrics: any): void {
        const indicators = document.getElementById('optimization-indicators');
        if (!indicators) return;

        const optimizations = [
            {
                name: 'SIMD优化',
                active: true, // 从系统获取实际状态
                color: '#00ff00'
            },
            {
                name: '对象池',
                active: metrics.poolEfficiency > 80,
                color: metrics.poolEfficiency > 80 ? '#00ff00' : '#ff6600'
            },
            {
                name: '命令批处理',
                active: true, // 从系统获取实际状态
                color: '#00ff00'
            },
            {
                name: '内存监控',
                active: true,
                color: '#00ff00'
            }
        ];

        indicators.innerHTML = optimizations.map(opt => `
            <div class="optimization-indicator ${opt.active ? 'active' : 'inactive'}">
                <div class="indicator-light" style="background-color: ${opt.color}"></div>
                <span class="indicator-name">${opt.name}</span>
            </div>
        `).join('');
    }

    /**
     * 获取性能等级CSS类
     */
    private getPerformanceClass(value: number, good: number, poor: number): string {
        if (value >= good) return 'good';
        if (value >= poor) return 'warning';
        return 'poor';
    }
}

/**
 * 简单的折线图实现
 */
class LineChart {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private data: number[] = [];
    private maxDataPoints: number = 100;

    constructor(canvas: HTMLCanvasElement, private options: any) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('无法获取2D渲染上下文');
        this.ctx = ctx;
    }

    public addData(value: number): void {
        this.data.push(value);
        if (this.data.length > this.maxDataPoints) {
            this.data.shift();
        }
        this.render();
    }

    private render(): void {
        const { width, height } = this.canvas;

        // 清空画布
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, width, height);

        if (this.data.length < 2) return;

        // 绘制数据线
        this.ctx.strokeStyle = this.options.color || '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        for (let i = 0; i < this.data.length; i++) {
            const x = (i / (this.maxDataPoints - 1)) * width;
            const y = height - ((this.data[i] - this.options.min) / (this.options.max - this.options.min)) * height;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();
    }
}
```

## 相关CSS样式

```css
/**
 * performance-dashboard.css
 * 性能仪表板样式
 */

.performance-dashboard {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #2a2a2a;
    color: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.metric-card {
    background: #3a3a3a;
    border-radius: 6px;
    padding: 20px;
    text-align: center;
    border: 1px solid #4a4a4a;
}

.metric-card h3 {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: #cccccc;
    text-transform: uppercase;
}

.metric-value {
    font-size: 32px;
    font-weight: bold;
    margin: 10px 0;
}

.metric-value.good { color: #00ff00; }
.metric-value.warning { color: #ffaa00; }
.metric-value.poor { color: #ff4444; }

.metric-unit {
    font-size: 12px;
    color: #888888;
}

.charts-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    margin: 30px 0;
}

.chart-container {
    background: #3a3a3a;
    border-radius: 6px;
    padding: 20px;
    border: 1px solid #4a4a4a;
}

.chart-container h3 {
    margin: 0 0 15px 0;
    color: #cccccc;
}

.chart-container canvas {
    width: 100%;
    height: 200px;
    background: #2a2a2a;
    border-radius: 4px;
}

.optimization-status {
    background: #3a3a3a;
    border-radius: 6px;
    padding: 20px;
    border: 1px solid #4a4a4a;
}

.optimization-status h3 {
    margin: 0 0 15px 0;
    color: #cccccc;
}

#optimization-indicators {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
}

.optimization-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #4a4a4a;
    border-radius: 4px;
    font-size: 14px;
}

.indicator-light {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.optimization-indicator.active .indicator-name {
    color: #ffffff;
}

.optimization-indicator.inactive .indicator-name {
    color: #888888;
}
```

## 最佳实践

### 1. 部署建议

- **生产环境**：启用所有优化选项，但禁用详细的调试输出
- **开发环境**：启用完整的监控和分析功能
- **性能测试**：运行完整基准测试，收集详细的性能数据

### 2. 监控策略

- 设置性能阈值警告
- 定期生成性能报告
- 监控内存增长趋势
- 跟踪优化效果

### 3. 持续优化

- 根据监控数据调整参数
- 定期更新基准测试
- 关注新的优化技术
- 收集用户反馈

## 相关文档

- [性能分析器](./performance-analyzer.md) - 核心性能监控
- [RHI命令优化器](./rhi-command-optimizer.md) - GPU优化技术
- [Math对象池优化](./math-object-pool-optimization.md) - 内存管理优化
- [SIMD优化器](./simd-optimizer.md) - CPU并行计算优化
- [内存泄漏检测器](./memory-leak-detector.md) - 内存安全管理