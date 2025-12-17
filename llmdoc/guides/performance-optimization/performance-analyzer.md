---
title: Performance Analyzer
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: performance
tags: ['guide', 'llm-native', 'performance', 'performance-engineers', 'interface-first', 'code-examples', 'step-by-step']
target_audience: performance-engineers
complexity: advanced
estimated_time: f"68 分钟"
last_updated: 2025-12-17
llm_native_compliance: true
version: 1.0.0
---


## 🎯 Context & Goal

### Context
本文档属于**performance**类型的开发指南，面向**performance-engineers**。

### Goal
帮助开发者快速理解和掌握相关概念、工具和最佳实践，提高开发效率和代码质量。

### Prerequisites
- 基础的编程知识
- 了解项目架构和基本概念
- 相关领域的开发经验

---

# 性能分析器详细指南

## 概述

性能分析器是RHI性能优化系统的核心监控模块，提供全面的实时性能监控、智能分析和自动报告功能。通过多维度数据采集和智能警告系统，帮助开发者及时发现和解决性能瓶颈。

## 核心功能

### 📊 多维度指标监控

#### 帧性能指标
```typescript
interface FrameMetrics {
  fps: number;           // 帧率
  frameTime: number;     // 帧时间 (ms)
  renderTime: number;    // 渲染时间 (ms)
  updateTime: number;    // 更新时间 (ms)
  drawCalls: number;     // 绘制调用数
  triangles: number;     // 三角形数量
  vertices: number;      // 顶点数量
}
```

#### GPU性能指标
```typescript
interface GPUMetrics {
  gpuTime: number;           // GPU执行时间
  memoryUsage: number;       // GPU内存使用量
  textureMemory: number;     // 纹理内存占用
  bufferMemory: number;      // 缓冲区内存占用
  pipelineCreations: number; // 管线创建次数
}
```

#### CPU性能指标
```typescript
interface CPUMetrics {
  updateTime: number;     // 更新计算时间
  physicsTime: number;    // 物理计算时间
  animationTime: number;  // 动画计算时间
  cullingTime: number;    // 视锥剔除时间
  sortingTime: number;    // 排序时间
}
```

### ⚠️ 智能警告系统

#### 性能警告级别
- **Low**: 轻微性能问题，建议关注
- **Medium**: 明显性能影响，需要优化
- **High**: 严重性能问题，立即处理
- **Critical**: 系统性能危机，紧急处理

#### 自动警告检测
```typescript
// FPS警告
if (metrics.frame.fps < 30) {
  addWarning('fps', 'high', `Low FPS: ${metrics.frame.fps.toFixed(1)}`, metrics.frame.fps, 30);
}

// 内存警告
const memoryUsageRatio = metrics.memory.heapUsed / metrics.memory.heapTotal;
if (memoryUsageRatio > 0.9) {
  addWarning('memory', 'critical', `High memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`, memoryUsageRatio, 0.9);
}

// 渲染警告
if (metrics.frame.drawCalls > 1000) {
  addWarning('gpu', 'medium', `High draw calls: ${metrics.frame.drawCalls}`, metrics.frame.drawCalls, 1000);
}
```

## 使用指南

### 基本设置

```typescript
import { PerformanceAnalyzer } from './performance-analyzer';

// 创建性能分析器
const analyzer = new PerformanceAnalyzer();

// 在渲染循环中使用
function renderLoop() {
  // 开始帧分析
  analyzer.beginFrame();

  // 执行渲染工作
  performRendering();

  // 结束帧分析
  analyzer.endFrame();

  // 记录渲染指标
  analyzer.recordRenderMetrics(
    drawCallsCount,
    triangleCount,
    vertexCount,
    renderTimeMs
  );
}
```

### 高级计时器使用

```typescript
// GPU计时器
analyzer.startGPUTimer('shadow_pass');
renderShadows();
const shadowTime = analyzer.endGPUTimer('shadow_pass');

// CPU计时器
analyzer.startCPUTimer('physics_update');
updatePhysics();
const physicsTime = analyzer.endCPUTimer('physics_update');

// 批量CPU计时
analyzer.recordCPUMetrics(
  updateTime,
  physicsTime,
  animationTime,
  cullingTime,
  sortingTime
);
```

### 性能报告生成

```typescript
// 获取实时指标
const metrics = analyzer.getMetrics();
console.log(`Current FPS: ${metrics.frame.fps.toFixed(1)}`);
console.log(`Frame Time: ${metrics.frame.frameTime.toFixed(1)}ms`);

// 获取警告信息
const warnings = analyzer.getWarnings();
warnings.forEach(warning => {
  console.warn(`${warning.severity}: ${warning.message}`);
});

// 生成完整报告
const report = analyzer.getReport();
console.log('Performance Report:', report);
```

## 配置选项

### 自定义警告阈值

```typescript
interface PerformanceThresholds {
  fpsLow: number;          // 低FPS阈值 (默认: 45)
  fpsCritical: number;     // 严重FPS阈值 (默认: 30)
  frameTimeMax: number;    // 最大帧时间 (默认: 33.3ms)
  memoryUsageRatio: number;// 内存使用率阈值 (默认: 0.8)
  drawCallsMax: number;    // 最大绘制调用数 (默认: 1000)
}

// 自定义阈值
const analyzer = new PerformanceAnalyzer({
  thresholds: {
    fpsLow: 50,
    fpsCritical: 40,
    frameTimeMax: 25,
    memoryUsageRatio: 0.75,
    drawCallsMax: 800
  }
});
```

### 监控配置

```typescript
interface MonitoringConfig {
  historySize: number;     // 历史数据大小 (默认: 120)
  updateInterval: number;  // 更新间隔 (ms) (默认: 1000)
  enableGPUTracking: boolean; // 启用GPU追踪 (默认: true)
  enableMemoryTracking: boolean; // 启用内存追踪 (默认: true)
}
```

## 性能优化建议

### 基于分析结果的自动建议

```typescript
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

  return recommendations;
}
```

### 常见性能问题诊断

#### 1. FPS低下
- **检查点**: 渲染时间、绘制调用、三角形数量
- **优化建议**: 启用LOD、减少材质切换、优化着色器

#### 2. 内存使用过高
- **检查点**: 堆内存使用、纹理内存、缓冲区内存
- **优化建议**: 压缩纹理、对象池、及时释放资源

#### 3. GPU时间过长
- **检查点**: 着色器复杂度、纹理采样、渲染管线
- **优化建议**: 简化着色器、纹理预处理、减少过绘制

## 集成示例

### 与React组件集成

```typescript
import React, { useEffect, useRef } from 'react';
import { PerformanceAnalyzer } from './performance-analyzer';

const PerformanceMonitor: React.FC = () => {
  const analyzerRef = useRef<PerformanceAnalyzer>();
  const metricsRef = useRef<any>();

  useEffect(() => {
    analyzerRef.current = new PerformanceAnalyzer();

    const interval = setInterval(() => {
      const metrics = analyzerRef.current?.getMetrics();
      metricsRef.current = metrics;
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="performance-monitor">
      <div>FPS: {metricsRef.current?.frame.fps.toFixed(1)}</div>
      <div>Frame Time: {metricsRef.current?.frame.frameTime.toFixed(1)}ms</div>
      <div>Draw Calls: {metricsRef.current?.frame.drawCalls}</div>
      <div>Memory: {(metricsRef.current?.memory.heapUsed / 1024 / 1024).toFixed(1)}MB</div>
    </div>
  );
};
```

### 与WebGL渲染循环集成

```typescript
class WebGLRenderer {
  private analyzer: PerformanceAnalyzer;

  constructor(canvas: HTMLCanvasElement) {
    this.analyzer = new PerformanceAnalyzer();
    this.setupWebGL(canvas);
  }

  render(scene: Scene, camera: Camera) {
    this.analyzer.beginFrame();

    // 开始GPU计时
    this.analyzer.startGPUTimer('render');

    // 渲染场景
    const stats = this.renderScene(scene, camera);

    // 结束GPU计时
    const renderTime = this.analyzer.endGPUTimer('render');

    // 记录指标
    this.analyzer.recordRenderMetrics(
      stats.drawCalls,
      stats.triangles,
      stats.vertices,
      renderTime
    );

    this.analyzer.endFrame();
  }
}
```

## 最佳实践

### 1. 监控策略
- 在开发环境启用详细监控
- 生产环境使用轻量级监控
- 定期导出性能报告进行分析

### 2. 数据分析
- 关注性能趋势而非瞬时值
- 建立性能基线作为对比标准
- 结合用户行为数据进行分析

### 3. 优化流程
1. 识别性能瓶颈
2. 设置优化目标
3. 实施优化方案
4. 验证优化效果
5. 持续监控调整

## 相关文档

- [RHI命令优化器](./rhi-command-optimizer.md)
- [数学对象池优化](./math-pool-optimization.md)
- [完整示例和最佳实践](./complete-examples.md)
- [性能优化概览](./overview.md)
## 🔌 Interface First

### 核心接口定义
#### WebGLRenderer
```typescript
// 接口定义和用法
```

#### PerformanceMonitor
```typescript
interface PerformanceMonitor {
  startTiming(label: string): void;
  endTiming(label: string): number;
  getMetrics(): PerformanceMetrics;
}
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

# 性能分析器详细指南

## 概述

性能分析器是RHI性能优化系统的核心监控模块，提供全面的实时性能监控、智能分析和自动报告功能。通过多维度数据采集和智能警告系统，帮助开发者及时发现和解决性能瓶颈。

## 核心功能

### 📊 多维度指标监控

#### 帧性能指标
```typescript
interface FrameMetrics {
  fps: number;           // 帧率
  frameTime: number;     // 帧时间 (ms)
  renderTime: number;    // 渲染时间 (ms)
  updateTime: number;    // 更新时间 (ms)
  drawCalls: number;     // 绘制调用数
  triangles: number;     // 三角形数量
  vertices: number;      // 顶点数量
}
```

#### GPU性能指标
```typescript
interface GPUMetrics {
  gpuTime: number;           // GPU执行时间
  memoryUsage: number;       // GPU内存使用量
  textureMemory: number;     // 纹理内存占用
  bufferMemory: number;      // 缓冲区内存占用
  pipelineCreations: number; // 管线创建次数
}
```

#### CPU性能指标
```typescript
interface CPUMetrics {
  updateTime: number;     // 更新计算时间
  physicsTime: number;    // 物理计算时间
  animationTime: number;  // 动画计算时间
  cullingTime: number;    // 视锥剔除时间
  sortingTime: number;    // 排序时间
}
```

### ⚠️ 智能警告系统

#### 性能警告级别
- **Low**: 轻微性能问题，建议关注
- **Medium**: 明显性能影响，需要优化
- **High**: 严重性能问题，立即处理
- **Critical**: 系统性能危机，紧急处理

#### 自动警告检测
```typescript
// FPS警告
if (metrics.frame.fps < 30) {
  addWarning('fps', 'high', `Low FPS: ${metrics.frame.fps.toFixed(1)}`, metrics.frame.fps, 30);
}

// 内存警告
const memoryUsageRatio = metrics.memory.heapUsed / metrics.memory.heapTotal;
if (memoryUsageRatio > 0.9) {
  addWarning('memory', 'critical', `High memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`, memoryUsageRatio, 0.9);
}

// 渲染警告
if (metrics.frame.drawCalls > 1000) {
  addWarning('gpu', 'medium', `High draw calls: ${metrics.frame.drawCalls}`, metrics.frame.drawCalls, 1000);
}
```

## 使用指南

### 基本设置

```typescript
import { PerformanceAnalyzer } from './performance-analyzer';

// 创建性能分析器
const analyzer = new PerformanceAnalyzer();

// 在渲染循环中使用
function renderLoop() {
  // 开始帧分析
  analyzer.beginFrame();

  // 执行渲染工作
  performRendering();

  // 结束帧分析
  analyzer.endFrame();

  // 记录渲染指标
  analyzer.recordRenderMetrics(
    drawCallsCount,
    triangleCount,
    vertexCount,
    renderTimeMs
  );
}
```

### 高级计时器使用

```typescript
// GPU计时器
analyzer.startGPUTimer('shadow_pass');
renderShadows();
const shadowTime = analyzer.endGPUTimer('shadow_pass');

// CPU计时器
analyzer.startCPUTimer('physics_update');
updatePhysics();
const physicsTime = analyzer.endCPUTimer('physics_update');

// 批量CPU计时
analyzer.recordCPUMetrics(
  updateTime,
  physicsTime,
  animationTime,
  cullingTime,
  sortingTime
);
```

### 性能报告生成

```typescript
// 获取实时指标
const metrics = analyzer.getMetrics();
console.log(`Current FPS: ${metrics.frame.fps.toFixed(1)}`);
console.log(`Frame Time: ${metrics.frame.frameTime.toFixed(1)}ms`);

// 获取警告信息
const warnings = analyzer.getWarnings();
warnings.forEach(warning => {
  console.warn(`${warning.severity}: ${warning.message}`);
});

// 生成完整报告
const report = analyzer.getReport();
console.log('Performance Report:', report);
```

## 配置选项

### 自定义警告阈值

```typescript
interface PerformanceThresholds {
  fpsLow: number;          // 低FPS阈值 (默认: 45)
  fpsCritical: number;     // 严重FPS阈值 (默认: 30)
  frameTimeMax: number;    // 最大帧时间 (默认: 33.3ms)
  memoryUsageRatio: number;// 内存使用率阈值 (默认: 0.8)
  drawCallsMax: number;    // 最大绘制调用数 (默认: 1000)
}

// 自定义阈值
const analyzer = new PerformanceAnalyzer({
  thresholds: {
    fpsLow: 50,
    fpsCritical: 40,
    frameTimeMax: 25,
    memoryUsageRatio: 0.75,
    drawCallsMax: 800
  }
});
```

### 监控配置

```typescript
interface MonitoringConfig {
  historySize: number;     // 历史数据大小 (默认: 120)
  updateInterval: number;  // 更新间隔 (ms) (默认: 1000)
  enableGPUTracking: boolean; // 启用GPU追踪 (默认: true)
  enableMemoryTracking: boolean; // 启用内存追踪 (默认: true)
}
```

## 性能优化建议

### 基于分析结果的自动建议

```typescript
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

  return recommendations;
}
```

### 常见性能问题诊断

#### 1. FPS低下
- **检查点**: 渲染时间、绘制调用、三角形数量
- **优化建议**: 启用LOD、减少材质切换、优化着色器

#### 2. 内存使用过高
- **检查点**: 堆内存使用、纹理内存、缓冲区内存
- **优化建议**: 压缩纹理、对象池、及时释放资源

#### 3. GPU时间过长
- **检查点**: 着色器复杂度、纹理采样、渲染管线
- **优化建议**: 简化着色器、纹理预处理、减少过绘制

## 集成示例

### 与React组件集成

```typescript
import React, { useEffect, useRef } from 'react';
import { PerformanceAnalyzer } from './performance-analyzer';

const PerformanceMonitor: React.FC = () => {
  const analyzerRef = useRef<PerformanceAnalyzer>();
  const metricsRef = useRef<any>();

  useEffect(() => {
    analyzerRef.current = new PerformanceAnalyzer();

    const interval = setInterval(() => {
      const metrics = analyzerRef.current?.getMetrics();
      metricsRef.current = metrics;
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="performance-monitor">
      <div>FPS: {metricsRef.current?.frame.fps.toFixed(1)}</div>
      <div>Frame Time: {metricsRef.current?.frame.frameTime.toFixed(1)}ms</div>
      <div>Draw Calls: {metricsRef.current?.frame.drawCalls}</div>
      <div>Memory: {(metricsRef.current?.memory.heapUsed / 1024 / 1024).toFixed(1)}MB</div>
    </div>
  );
};
```

### 与WebGL渲染循环集成

```typescript
class WebGLRenderer {
  private analyzer: PerformanceAnalyzer;

  constructor(canvas: HTMLCanvasElement) {
    this.analyzer = new PerformanceAnalyzer();
    this.setupWebGL(canvas);
  }

  render(scene: Scene, camera: Camera) {
    this.analyzer.beginFrame();

    // 开始GPU计时
    this.analyzer.startGPUTimer('render');

    // 渲染场景
    const stats = this.renderScene(scene, camera);

    // 结束GPU计时
    const renderTime = this.analyzer.endGPUTimer('render');

    // 记录指标
    this.analyzer.recordRenderMetrics(
      stats.drawCalls,
      stats.triangles,
      stats.vertices,
      renderTime
    );

    this.analyzer.endFrame();
  }
}
```

## 最佳实践

### 1. 监控策略
- 在开发环境启用详细监控
- 生产环境使用轻量级监控
- 定期导出性能报告进行分析

### 2. 数据分析
- 关注性能趋势而非瞬时值
- 建立性能基线作为对比标准
- 结合用户行为数据进行分析

### 3. 优化流程
1. 识别性能瓶颈
2. 设置优化目标
3. 实施优化方案
4. 验证优化效果
5. 持续监控调整

## 相关文档

- [RHI命令优化器](./rhi-command-optimizer.md)
- [数学对象池优化](./math-pool-optimization.md)
- [完整示例和最佳实践](./complete-examples.md)
- [性能优化概览](./overview.md)
## ⚠️ 禁止事项

### 关键约束
- 🚫 **避免不必要的内存分配**: 在性能关键路径中避免创建临时对象
- 🚫 **避免同步阻塞**: 使用异步模式避免阻塞主线程
- 🚫 **避免过度优化**: 在没有性能数据支持的情况下进行优化

### 常见错误
- ❌ 忽略错误处理和异常情况
- ❌ 缺少必要的性能优化
- ❌ 不遵循项目的编码规范
- ❌ 忽略文档更新和维护

### 最佳实践提醒
- ✅ 始终考虑性能影响
- ✅ 提供清晰的错误信息
- ✅ 保持代码的可维护性
- ✅ 定期更新文档

---

# 性能分析器详细指南

## 概述

性能分析器是RHI性能优化系统的核心监控模块，提供全面的实时性能监控、智能分析和自动报告功能。通过多维度数据采集和智能警告系统，帮助开发者及时发现和解决性能瓶颈。

## 核心功能

### 📊 多维度指标监控

#### 帧性能指标
```typescript
interface FrameMetrics {
  fps: number;           // 帧率
  frameTime: number;     // 帧时间 (ms)
  renderTime: number;    // 渲染时间 (ms)
  updateTime: number;    // 更新时间 (ms)
  drawCalls: number;     // 绘制调用数
  triangles: number;     // 三角形数量
  vertices: number;      // 顶点数量
}
```

#### GPU性能指标
```typescript
interface GPUMetrics {
  gpuTime: number;           // GPU执行时间
  memoryUsage: number;       // GPU内存使用量
  textureMemory: number;     // 纹理内存占用
  bufferMemory: number;      // 缓冲区内存占用
  pipelineCreations: number; // 管线创建次数
}
```

#### CPU性能指标
```typescript
interface CPUMetrics {
  updateTime: number;     // 更新计算时间
  physicsTime: number;    // 物理计算时间
  animationTime: number;  // 动画计算时间
  cullingTime: number;    // 视锥剔除时间
  sortingTime: number;    // 排序时间
}
```

### ⚠️ 智能警告系统

#### 性能警告级别
- **Low**: 轻微性能问题，建议关注
- **Medium**: 明显性能影响，需要优化
- **High**: 严重性能问题，立即处理
- **Critical**: 系统性能危机，紧急处理

#### 自动警告检测
```typescript
// FPS警告
if (metrics.frame.fps < 30) {
  addWarning('fps', 'high', `Low FPS: ${metrics.frame.fps.toFixed(1)}`, metrics.frame.fps, 30);
}

// 内存警告
const memoryUsageRatio = metrics.memory.heapUsed / metrics.memory.heapTotal;
if (memoryUsageRatio > 0.9) {
  addWarning('memory', 'critical', `High memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`, memoryUsageRatio, 0.9);
}

// 渲染警告
if (metrics.frame.drawCalls > 1000) {
  addWarning('gpu', 'medium', `High draw calls: ${metrics.frame.drawCalls}`, metrics.frame.drawCalls, 1000);
}
```

## 使用指南

### 基本设置

```typescript
import { PerformanceAnalyzer } from './performance-analyzer';

// 创建性能分析器
const analyzer = new PerformanceAnalyzer();

// 在渲染循环中使用
function renderLoop() {
  // 开始帧分析
  analyzer.beginFrame();

  // 执行渲染工作
  performRendering();

  // 结束帧分析
  analyzer.endFrame();

  // 记录渲染指标
  analyzer.recordRenderMetrics(
    drawCallsCount,
    triangleCount,
    vertexCount,
    renderTimeMs
  );
}
```

### 高级计时器使用

```typescript
// GPU计时器
analyzer.startGPUTimer('shadow_pass');
renderShadows();
const shadowTime = analyzer.endGPUTimer('shadow_pass');

// CPU计时器
analyzer.startCPUTimer('physics_update');
updatePhysics();
const physicsTime = analyzer.endCPUTimer('physics_update');

// 批量CPU计时
analyzer.recordCPUMetrics(
  updateTime,
  physicsTime,
  animationTime,
  cullingTime,
  sortingTime
);
```

### 性能报告生成

```typescript
// 获取实时指标
const metrics = analyzer.getMetrics();
console.log(`Current FPS: ${metrics.frame.fps.toFixed(1)}`);
console.log(`Frame Time: ${metrics.frame.frameTime.toFixed(1)}ms`);

// 获取警告信息
const warnings = analyzer.getWarnings();
warnings.forEach(warning => {
  console.warn(`${warning.severity}: ${warning.message}`);
});

// 生成完整报告
const report = analyzer.getReport();
console.log('Performance Report:', report);
```

## 配置选项

### 自定义警告阈值

```typescript
interface PerformanceThresholds {
  fpsLow: number;          // 低FPS阈值 (默认: 45)
  fpsCritical: number;     // 严重FPS阈值 (默认: 30)
  frameTimeMax: number;    // 最大帧时间 (默认: 33.3ms)
  memoryUsageRatio: number;// 内存使用率阈值 (默认: 0.8)
  drawCallsMax: number;    // 最大绘制调用数 (默认: 1000)
}

// 自定义阈值
const analyzer = new PerformanceAnalyzer({
  thresholds: {
    fpsLow: 50,
    fpsCritical: 40,
    frameTimeMax: 25,
    memoryUsageRatio: 0.75,
    drawCallsMax: 800
  }
});
```

### 监控配置

```typescript
interface MonitoringConfig {
  historySize: number;     // 历史数据大小 (默认: 120)
  updateInterval: number;  // 更新间隔 (ms) (默认: 1000)
  enableGPUTracking: boolean; // 启用GPU追踪 (默认: true)
  enableMemoryTracking: boolean; // 启用内存追踪 (默认: true)
}
```

## 性能优化建议

### 基于分析结果的自动建议

```typescript
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

  return recommendations;
}
```

### 常见性能问题诊断

#### 1. FPS低下
- **检查点**: 渲染时间、绘制调用、三角形数量
- **优化建议**: 启用LOD、减少材质切换、优化着色器

#### 2. 内存使用过高
- **检查点**: 堆内存使用、纹理内存、缓冲区内存
- **优化建议**: 压缩纹理、对象池、及时释放资源

#### 3. GPU时间过长
- **检查点**: 着色器复杂度、纹理采样、渲染管线
- **优化建议**: 简化着色器、纹理预处理、减少过绘制

## 集成示例

### 与React组件集成

```typescript
import React, { useEffect, useRef } from 'react';
import { PerformanceAnalyzer } from './performance-analyzer';

const PerformanceMonitor: React.FC = () => {
  const analyzerRef = useRef<PerformanceAnalyzer>();
  const metricsRef = useRef<any>();

  useEffect(() => {
    analyzerRef.current = new PerformanceAnalyzer();

    const interval = setInterval(() => {
      const metrics = analyzerRef.current?.getMetrics();
      metricsRef.current = metrics;
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="performance-monitor">
      <div>FPS: {metricsRef.current?.frame.fps.toFixed(1)}</div>
      <div>Frame Time: {metricsRef.current?.frame.frameTime.toFixed(1)}ms</div>
      <div>Draw Calls: {metricsRef.current?.frame.drawCalls}</div>
      <div>Memory: {(metricsRef.current?.memory.heapUsed / 1024 / 1024).toFixed(1)}MB</div>
    </div>
  );
};
```

### 与WebGL渲染循环集成

```typescript
class WebGLRenderer {
  private analyzer: PerformanceAnalyzer;

  constructor(canvas: HTMLCanvasElement) {
    this.analyzer = new PerformanceAnalyzer();
    this.setupWebGL(canvas);
  }

  render(scene: Scene, camera: Camera) {
    this.analyzer.beginFrame();

    // 开始GPU计时
    this.analyzer.startGPUTimer('render');

    // 渲染场景
    const stats = this.renderScene(scene, camera);

    // 结束GPU计时
    const renderTime = this.analyzer.endGPUTimer('render');

    // 记录指标
    this.analyzer.recordRenderMetrics(
      stats.drawCalls,
      stats.triangles,
      stats.vertices,
      renderTime
    );

    this.analyzer.endFrame();
  }
}
```

## 最佳实践

### 1. 监控策略
- 在开发环境启用详细监控
- 生产环境使用轻量级监控
- 定期导出性能报告进行分析

### 2. 数据分析
- 关注性能趋势而非瞬时值
- 建立性能基线作为对比标准
- 结合用户行为数据进行分析

### 3. 优化流程
1. 识别性能瓶颈
2. 设置优化目标
3. 实施优化方案
4. 验证优化效果
5. 持续监控调整

## 相关文档

- [RHI命令优化器](./rhi-command-optimizer.md)
- [数学对象池优化](./math-pool-optimization.md)
- [完整示例和最佳实践](./complete-examples.md)
- [性能优化概览](./overview.md)
## 📚 Few-Shot示例

### 问题-解决方案对
**问题**: 渲染帧率低于预期
**解决方案**: 使用性能分析器定位瓶颈，优化渲染管线
```typescript
const profiler = new PerformanceProfiler();
profiler.start();
// 渲染代码
const report = profiler.getReport();
```

**问题**: 内存使用持续增长
**解决方案**: 实现内存池和对象回收机制
```typescript
const pool = new MemoryPool();
const obj = pool.acquire();
// 使用对象
pool.release(obj);
```

### 学习要点
- 理解常见问题和解决方案
- 掌握最佳实践和避免陷阱
- 培养问题解决思维

---

# 性能分析器详细指南

## 概述

性能分析器是RHI性能优化系统的核心监控模块，提供全面的实时性能监控、智能分析和自动报告功能。通过多维度数据采集和智能警告系统，帮助开发者及时发现和解决性能瓶颈。

## 核心功能

### 📊 多维度指标监控

#### 帧性能指标
```typescript
interface FrameMetrics {
  fps: number;           // 帧率
  frameTime: number;     // 帧时间 (ms)
  renderTime: number;    // 渲染时间 (ms)
  updateTime: number;    // 更新时间 (ms)
  drawCalls: number;     // 绘制调用数
  triangles: number;     // 三角形数量
  vertices: number;      // 顶点数量
}
```

#### GPU性能指标
```typescript
interface GPUMetrics {
  gpuTime: number;           // GPU执行时间
  memoryUsage: number;       // GPU内存使用量
  textureMemory: number;     // 纹理内存占用
  bufferMemory: number;      // 缓冲区内存占用
  pipelineCreations: number; // 管线创建次数
}
```

#### CPU性能指标
```typescript
interface CPUMetrics {
  updateTime: number;     // 更新计算时间
  physicsTime: number;    // 物理计算时间
  animationTime: number;  // 动画计算时间
  cullingTime: number;    // 视锥剔除时间
  sortingTime: number;    // 排序时间
}
```

### ⚠️ 智能警告系统

#### 性能警告级别
- **Low**: 轻微性能问题，建议关注
- **Medium**: 明显性能影响，需要优化
- **High**: 严重性能问题，立即处理
- **Critical**: 系统性能危机，紧急处理

#### 自动警告检测
```typescript
// FPS警告
if (metrics.frame.fps < 30) {
  addWarning('fps', 'high', `Low FPS: ${metrics.frame.fps.toFixed(1)}`, metrics.frame.fps, 30);
}

// 内存警告
const memoryUsageRatio = metrics.memory.heapUsed / metrics.memory.heapTotal;
if (memoryUsageRatio > 0.9) {
  addWarning('memory', 'critical', `High memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`, memoryUsageRatio, 0.9);
}

// 渲染警告
if (metrics.frame.drawCalls > 1000) {
  addWarning('gpu', 'medium', `High draw calls: ${metrics.frame.drawCalls}`, metrics.frame.drawCalls, 1000);
}
```

## 使用指南

### 基本设置

```typescript
import { PerformanceAnalyzer } from './performance-analyzer';

// 创建性能分析器
const analyzer = new PerformanceAnalyzer();

// 在渲染循环中使用
function renderLoop() {
  // 开始帧分析
  analyzer.beginFrame();

  // 执行渲染工作
  performRendering();

  // 结束帧分析
  analyzer.endFrame();

  // 记录渲染指标
  analyzer.recordRenderMetrics(
    drawCallsCount,
    triangleCount,
    vertexCount,
    renderTimeMs
  );
}
```

### 高级计时器使用

```typescript
// GPU计时器
analyzer.startGPUTimer('shadow_pass');
renderShadows();
const shadowTime = analyzer.endGPUTimer('shadow_pass');

// CPU计时器
analyzer.startCPUTimer('physics_update');
updatePhysics();
const physicsTime = analyzer.endCPUTimer('physics_update');

// 批量CPU计时
analyzer.recordCPUMetrics(
  updateTime,
  physicsTime,
  animationTime,
  cullingTime,
  sortingTime
);
```

### 性能报告生成

```typescript
// 获取实时指标
const metrics = analyzer.getMetrics();
console.log(`Current FPS: ${metrics.frame.fps.toFixed(1)}`);
console.log(`Frame Time: ${metrics.frame.frameTime.toFixed(1)}ms`);

// 获取警告信息
const warnings = analyzer.getWarnings();
warnings.forEach(warning => {
  console.warn(`${warning.severity}: ${warning.message}`);
});

// 生成完整报告
const report = analyzer.getReport();
console.log('Performance Report:', report);
```

## 配置选项

### 自定义警告阈值

```typescript
interface PerformanceThresholds {
  fpsLow: number;          // 低FPS阈值 (默认: 45)
  fpsCritical: number;     // 严重FPS阈值 (默认: 30)
  frameTimeMax: number;    // 最大帧时间 (默认: 33.3ms)
  memoryUsageRatio: number;// 内存使用率阈值 (默认: 0.8)
  drawCallsMax: number;    // 最大绘制调用数 (默认: 1000)
}

// 自定义阈值
const analyzer = new PerformanceAnalyzer({
  thresholds: {
    fpsLow: 50,
    fpsCritical: 40,
    frameTimeMax: 25,
    memoryUsageRatio: 0.75,
    drawCallsMax: 800
  }
});
```

### 监控配置

```typescript
interface MonitoringConfig {
  historySize: number;     // 历史数据大小 (默认: 120)
  updateInterval: number;  // 更新间隔 (ms) (默认: 1000)
  enableGPUTracking: boolean; // 启用GPU追踪 (默认: true)
  enableMemoryTracking: boolean; // 启用内存追踪 (默认: true)
}
```

## 性能优化建议

### 基于分析结果的自动建议

```typescript
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

  return recommendations;
}
```

### 常见性能问题诊断

#### 1. FPS低下
- **检查点**: 渲染时间、绘制调用、三角形数量
- **优化建议**: 启用LOD、减少材质切换、优化着色器

#### 2. 内存使用过高
- **检查点**: 堆内存使用、纹理内存、缓冲区内存
- **优化建议**: 压缩纹理、对象池、及时释放资源

#### 3. GPU时间过长
- **检查点**: 着色器复杂度、纹理采样、渲染管线
- **优化建议**: 简化着色器、纹理预处理、减少过绘制

## 集成示例

### 与React组件集成

```typescript
import React, { useEffect, useRef } from 'react';
import { PerformanceAnalyzer } from './performance-analyzer';

const PerformanceMonitor: React.FC = () => {
  const analyzerRef = useRef<PerformanceAnalyzer>();
  const metricsRef = useRef<any>();

  useEffect(() => {
    analyzerRef.current = new PerformanceAnalyzer();

    const interval = setInterval(() => {
      const metrics = analyzerRef.current?.getMetrics();
      metricsRef.current = metrics;
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="performance-monitor">
      <div>FPS: {metricsRef.current?.frame.fps.toFixed(1)}</div>
      <div>Frame Time: {metricsRef.current?.frame.frameTime.toFixed(1)}ms</div>
      <div>Draw Calls: {metricsRef.current?.frame.drawCalls}</div>
      <div>Memory: {(metricsRef.current?.memory.heapUsed / 1024 / 1024).toFixed(1)}MB</div>
    </div>
  );
};
```

### 与WebGL渲染循环集成

```typescript
class WebGLRenderer {
  private analyzer: PerformanceAnalyzer;

  constructor(canvas: HTMLCanvasElement) {
    this.analyzer = new PerformanceAnalyzer();
    this.setupWebGL(canvas);
  }

  render(scene: Scene, camera: Camera) {
    this.analyzer.beginFrame();

    // 开始GPU计时
    this.analyzer.startGPUTimer('render');

    // 渲染场景
    const stats = this.renderScene(scene, camera);

    // 结束GPU计时
    const renderTime = this.analyzer.endGPUTimer('render');

    // 记录指标
    this.analyzer.recordRenderMetrics(
      stats.drawCalls,
      stats.triangles,
      stats.vertices,
      renderTime
    );

    this.analyzer.endFrame();
  }
}
```

## 最佳实践

### 1. 监控策略
- 在开发环境启用详细监控
- 生产环境使用轻量级监控
- 定期导出性能报告进行分析

### 2. 数据分析
- 关注性能趋势而非瞬时值
- 建立性能基线作为对比标准
- 结合用户行为数据进行分析

### 3. 优化流程
1. 识别性能瓶颈
2. 设置优化目标
3. 实施优化方案
4. 验证优化效果
5. 持续监控调整

## 相关文档

- [RHI命令优化器](./rhi-command-optimizer.md)
- [数学对象池优化](./math-pool-optimization.md)
- [完整示例和最佳实践](./complete-examples.md)
- [性能优化概览](./overview.md)