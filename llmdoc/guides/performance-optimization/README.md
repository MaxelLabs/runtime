# 性能优化指南

> **📁 从主文档拆分而来**: 原 `performance-optimization.md` (85KB, 2864行) 已拆分为6个专题文档

## 📚 文档结构

### 概览层
- **[概览](./overview.md)** - 系统架构和核心概念
- **[完整示例](./complete-examples.md)** - 集成指南和最佳实践

### 详细层
- **[性能分析器](./performance-analyzer.md)** - 实时监控和分析
- **[RHI命令优化器](./rhi-command-optimizer.md)** - 渲染优化技术
- **[数学对象池优化](./math-pool-optimization.md)** - 内存管理和对象复用
- **[SIMD优化技术](./simd-optimization.md)** - 向量计算加速
- **[内存泄漏检测](./memory-leak-detection.md)** - 内存监控和泄漏识别

## 🚀 快速开始

```typescript
import {
  PerformanceAnalyzer,
  RHICommandOptimizer,
  MathPool,
  SIMDWrapper,
  GlobalMemoryLeakDetector
} from './performance-optimization';

// 1. 初始化性能分析
const analyzer = new PerformanceAnalyzer();

// 2. 启动命令优化
const optimizer = new RHICommandOptimizer({
  instancingEnabled: true,
  maxInstancesPerBatch: 1024
});

// 3. 预热对象池
MathPool.preWarm();

// 4. 启动内存检测
GlobalMemoryLeakDetector.start();
```

## 📊 性能提升预期

| 优化模块 | 预期提升 | 主要收益 |
|---------|---------|----------|
| 对象池 | 2-5x | 减少GC压力 |
| SIMD优化 | 1.5-3x | 加速数学运算 |
| 命令优化 | 1.5-2x | 减少GPU切换 |
| 内存管理 | 20-50% | 降低内存使用 |

## 🔗 原文档重定向

**原文件**: `/reference/api-v2/examples/performance-optimization.md`

**拆分完成时间**: 2025-12-17

**拆分理由**: 文档过大（85KB），内容涵盖多个技术领域，需要模块化管理以提升可读性和维护性。

## 📖 相关资源

- [RHI Demo 开发指南](../demo-development.md)
- [WebGL 实现架构](../architecture/webgl-implementation.md)
- [资源追踪 API](../reference/resource-tracker-api.md)