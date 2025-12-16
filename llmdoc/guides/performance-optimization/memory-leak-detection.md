---
title: "内存泄漏检测指南"
description: "实时内存监控、泄漏模式识别和智能内存管理"
category: "guides"
tags: ["memory", "leak-detection", "monitoring", "optimization"]
created: "2025-12-17"
updated: "2025-12-17"
version: "1.0.0"
---

# 内存泄漏检测指南

## 概述

内存泄漏检测系统提供实时的内存监控、智能泄漏模式识别和自动内存管理功能。通过对象生命周期追踪、模式分析和预防建议，帮助开发者及时发现和解决内存问题。

## 核心功能

### 🔍 对象生命周期追踪

```typescript
interface MemoryTracker {
  objectId: string;        // 对象唯一标识
  type: string;           // 对象类型
  size: number;           // 对象大小（字节）
  createdAt: number;      // 创建时间戳
  lastAccessed: number;   // 最后访问时间
  stackTrace: string;     // 创建时的堆栈跟踪
  refCount: number;       // 引用计数
}
```

### 🧠 智能模式识别

#### 常见泄漏模式
- **循环引用**: 对象间形成无法释放的引用链
- **事件监听器**: 未正确移除的事件监听器
- **定时器**: 未清理的setInterval/setTimeout
- **闭包**: 闭包意外保持对外部对象的引用
- **DOM引用**: JavaScript对象保持对DOM元素的引用

```typescript
interface MemoryLeakPattern {
  type: 'circular_reference' | 'event_listener' | 'timer' | 'closure' | 'dom_reference';
  severity: 'low' | 'medium' | 'high';
  description: string;
  objects: MemoryTracker[];
}
```

### 📊 实时监控仪表板

```typescript
interface MemorySnapshot {
  timestamp: number;
  objectCount: number;     // 追踪对象数
  memoryUsage: number;     // 内存使用量
  heapUsed: number;        // 堆内存使用
  heapTotal: number;       // 堆内存总量
}
```

## 使用指南

### 基本设置

```typescript
import { GlobalMemoryLeakDetector, trackObject, releaseObject } from './memory-leak-detector';

// 启动内存泄漏检测
GlobalMemoryLeakDetector.start();

// 手动追踪对象
const objectId = trackObject(myObject, 'CustomObject', estimateSize);

// 对象使用完毕后释放
releaseObject(objectId);
```

### 装饰器自动追踪

```typescript
import { TrackMemory } from './memory-leak-detector';

class ResourceManager {
  @TrackMemory('texture', 1024 * 1024) // 自动追踪纹理对象
  private textureData: ImageData;

  @TrackMemory('buffer', 4096) // 自动追踪缓冲区
  private vertexBuffer: Float32Array;

  createResource(): void {
    // 方法会自动追踪创建的对象
    this.textureData = new ImageData(width, height);
    this.vertexBuffer = new Float32Array(1024);
  }
}
```

### 高级配置

```typescript
interface MemoryLeakDetectorOptions {
  interval?: number;           // 检测间隔（毫秒）
  maxTrackedObjects?: number;  // 最大追踪对象数
  autoStart?: boolean;         // 自动启动
  enableStackTrace?: boolean;  // 启用堆栈跟踪
  snapshotHistory?: number;    // 快照历史数量
}

// 自定义配置
const detector = new MemoryLeakDetector({
  interval: 30000,           // 30秒检测一次
  maxTrackedObjects: 5000,   // 最多追踪5000个对象
  autoStart: true,           // 自动启动
  enableStackTrace: true,    // 启用堆栈跟踪
  snapshotHistory: 10        // 保留10个历史快照
});
```

## 高级功能

### 1. 智能内存分析

```typescript
class MemoryLeakDetector {
  private detectLeaks(): MemoryLeakReport {
    const now = Date.now();
    const suspiciousObjects: MemoryTracker[] = [];
    const patterns: MemoryLeakPattern[] = [];

    // 分析长期存活的对象
    for (const tracker of this.trackers.values()) {
      const age = now - tracker.createdAt;
      const timeSinceAccess = now - tracker.lastAccessed;

      // 检查可疑对象（存在1分钟，30秒未访问）
      if (age > 60000 && timeSinceAccess > 30000) {
        suspiciousObjects.push(tracker);
      }
    }

    // 检测泄漏模式
    patterns.push(...this.detectCircularReferences());
    patterns.push(...this.detectEventListeners());
    patterns.push(...this.detectTimers());
    patterns.push(...this.detectClosures());

    return {
      timestamp: now,
      totalObjects: this.trackers.size,
      totalMemory: this.calculateTotalMemory(),
      leakedObjects: suspiciousObjects,
      suspiciousPatterns: patterns,
      recommendations: this.generateRecommendations(suspiciousObjects, patterns)
    };
  }
}
```

### 2. 循环引用检测

```typescript
private detectCircularReferences(): MemoryLeakPattern[] {
  const patterns: MemoryLeakPattern[] = [];
  const visited = new Set<any>();
  const recursionStack = new Set<any>();

  // 深度优先搜索检测循环引用
  const dfs = (obj: any, path: any[]): boolean => {
    if (visited.has(obj)) {
      if (recursionStack.has(obj)) {
        // 发现循环引用
        const cycleStart = path.indexOf(obj);
        const cycle = path.slice(cycleStart);

        patterns.push({
          type: 'circular_reference',
          severity: 'medium',
          description: `Circular reference detected between ${cycle.length} objects`,
          objects: cycle.map(o => this.findTracker(o))
        });
        return true;
      }
      return false;
    }

    visited.add(obj);
    recursionStack.add(obj);

    // 检查对象属性
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (dfs(obj[key], [...path, obj])) {
          return true;
        }
      }
    }

    recursionStack.delete(obj);
    return false;
  };

  // 从所有被追踪的对象开始检测
  for (const tracker of this.trackers.values()) {
    // 这里需要获取实际的对象引用
    // 实现中需要维护对象ID到对象引用的映射
  }

  return patterns;
}
```

### 3. 事件监听器泄漏检测

```typescript
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

  // 检查DOM事件监听器
  if (typeof window !== 'undefined') {
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const listeners = this.getEventListeners(element);
      if (listeners && listeners.length > 10) {
        patterns.push({
          type: 'event_listener',
          severity: 'low',
          description: `Element has ${listeners.length} event listeners`,
          objects: []
        });
      }
    });
  }

  return patterns;
}
```

### 4. 内存趋势分析

```typescript
class MemoryTrendAnalyzer {
  private snapshots: MemorySnapshot[] = [];

  analyzeTrend(): MemoryTrend {
    if (this.snapshots.length < 2) {
      return { trend: 'stable', growthRate: 0, prediction: 0 };
    }

    const recent = this.snapshots.slice(-10); // 最近10个快照
    const growthRates: number[] = [];

    for (let i = 1; i < recent.length; i++) {
      const current = recent[i].memoryUsage;
      const previous = recent[i - 1].memoryUsage;
      const growthRate = (current - previous) / previous;
      growthRates.push(growthRate);
    }

    const avgGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    const trend = avgGrowthRate > 0.05 ? 'increasing' :
                  avgGrowthRate < -0.05 ? 'decreasing' : 'stable';

    // 简单的线性预测
    const currentUsage = recent[recent.length - 1].memoryUsage;
    const prediction = currentUsage * (1 + avgGrowthRate);

    return {
      trend,
      growthRate: avgGrowthRate,
      prediction
    };
  }
}
```

## 实时监控集成

### 与React组件集成

```typescript
import React, { useEffect, useState } from 'react';
import { GlobalMemoryLeakDetector } from './memory-leak-detector';

const MemoryMonitor: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    // 启动内存监控
    GlobalMemoryLeakDetector.start();

    // 定期更新统计信息
    const interval = setInterval(() => {
      const currentStats = GlobalMemoryLeakDetector.getStatistics();
      setStats(currentStats);

      // 每30秒生成一次报告
      if (Date.now() % 30000 < 1000) {
        const currentReport = GlobalMemoryLeakDetector.generateReport();
        setReport(currentReport);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      GlobalMemoryLeakDetector.stop();
    };
  }, []);

  return (
    <div className="memory-monitor">
      <h3>内存监控</h3>
      {stats && (
        <div>
          <div>追踪对象: {stats.trackedObjects}</div>
          <div>内存使用: {(stats.totalMemory / 1024 / 1024).toFixed(1)} MB</div>
          <div>内存趋势: {stats.memoryTrend}</div>
          <div>最老对象: {(stats.oldestObject / 1000).toFixed(0)} 秒</div>
        </div>
      )}

      {report && report.leakedObjects.length > 0 && (
        <div className="memory-warnings">
          <h4>⚠️ 发现潜在内存泄漏</h4>
          {report.recommendations.map((rec: string, i: number) => (
            <div key={i} className="recommendation">{rec}</div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 与WebGL渲染集成

```typescript
class WebGLMemoryManager {
  private leakDetector = GlobalMemoryLeakDetector;

  createTexture(gl: WebGLRenderingContext, image: HTMLImageElement): WebGLTexture {
    const texture = gl.createTexture()!;

    // 追踪纹理对象
    const objectId = this.leakDetector.trackObject(texture, 'WebGLTexture', {
      width: image.width,
      height: image.height,
      format: gl.RGBA,
      estimatedSize: image.width * image.height * 4
    });

    // 存储对象ID用于后续释放
    (texture as any).__memoryTrackerId = objectId;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    return texture;
  }

  deleteTexture(gl: WebGLRenderingContext, texture: WebGLTexture): void {
    const objectId = (texture as any).__memoryTrackerId;
    if (objectId) {
      this.leakDetector.untrackObject(objectId);
    }
    gl.deleteTexture(texture);
  }

  createBuffer(gl: WebGLRenderingContext, data: ArrayBuffer): WebGLBuffer {
    const buffer = gl.createBuffer()!;

    const objectId = this.leakDetector.trackObject(buffer, 'WebGLBuffer', {
      size: data.byteLength,
      type: 'ARRAY_BUFFER'
    });

    (buffer as any).__memoryTrackerId = objectId;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    return buffer;
  }
}
```

## 性能优化建议

### 1. 对象池集成

```typescript
class OptimizedMemoryManager {
  private leakDetector = GlobalMemoryLeakDetector;
  private objectPools = new Map<string, any[]>();

  acquireObject<T>(type: string, factory: () => T): T {
    let pool = this.objectPools.get(type);
    if (!pool) {
      pool = [];
      this.objectPools.set(type, pool);
    }

    let obj: T;
    if (pool.length > 0) {
      obj = pool.pop()!;
      // 从泄漏检测中移除（对象被复用）
      if ((obj as any).__memoryTrackerId) {
        this.leakDetector.untrackObject((obj as any).__memoryTrackerId);
        delete (obj as any).__memoryTrackerId;
      }
    } else {
      obj = factory();
    }

    // 重新追踪对象
    const objectId = this.leakDetector.trackObject(obj, type);
    (obj as any).__memoryTrackerId = objectId;
    (obj as any).__isPooled = true;

    return obj;
  }

  releaseObject<T>(obj: T): void {
    if (!(obj as any).__isPooled) return;

    const type = obj.constructor.name;
    let pool = this.objectPools.get(type);
    if (!pool) {
      pool = [];
      this.objectPools.set(type, pool);
    }

    // 重置对象状态
    this.resetObject(obj);

    // 暂时从泄漏检测中移除（对象回到池中）
    const objectId = (obj as any).__memoryTrackerId;
    if (objectId) {
      this.leakDetector.untrackObject(objectId);
      delete (obj as any).__memoryTrackerId;
    }

    pool.push(obj);
  }

  private resetObject(obj: any): void {
    // 根据对象类型重置状态
    if (obj.elements) {
      // 矩阵对象
      obj.identity();
    } else if (obj.set) {
      // 向量对象
      obj.set(0, 0, 0);
    }
    // 其他对象类型的重置逻辑...
  }
}
```

### 2. WeakRef集成

```typescript
class WeakRefMemoryTracker {
  private weakRefs = new Map<string, WeakRef<any>>();
  private registry = new FinalizationRegistry((heldValue: string) => {
    this.cleanupObject(heldValue);
  });

  trackObject(obj: any, type: string): string {
    const objectId = this.generateObjectId();

    // 使用WeakRef跟踪对象
    this.weakRefs.set(objectId, new WeakRef(obj));

    // 使用FinalizationRegistry清理
    this.registry.register(obj, objectId);

    return objectId;
  }

  private cleanupObject(objectId: string): void {
    // 对象被垃圾回收时自动清理
    this.weakRefs.delete(objectId);
    console.log(`Object ${objectId} was garbage collected`);
  }

  getObject(objectId: string): any | undefined {
    const weakRef = this.weakRefs.get(objectId);
    return weakRef?.deref();
  }
}
```

## 最佳实践

### 1. 开发环境配置

```typescript
// 开发环境启用详细检测
if (process.env.NODE_ENV === 'development') {
  const detector = new MemoryLeakDetector({
    interval: 10000,           // 10秒检测一次
    maxTrackedObjects: 10000,  // 更大的追踪数量
    enableStackTrace: true,    // 启用堆栈跟踪
    snapshotHistory: 20        // 更多历史快照
  });

  // 全局对象泄露检测
  window.addEventListener('beforeunload', () => {
    const report = detector.generateReport();
    if (report.leakedObjects.length > 0) {
      console.warn('Memory leaks detected before unload:', report);
    }
  });
}
```

### 2. 生产环境优化

```typescript
// 生产环境轻量级配置
if (process.env.NODE_ENV === 'production') {
  const detector = new MemoryLeakDetector({
    interval: 60000,           // 1分钟检测一次
    maxTrackedObjects: 1000,   // 限制追踪数量
    enableStackTrace: false,   // 关闭堆栈跟踪
    snapshotHistory: 5         // 最少历史快照
  });

  // 只记录严重泄漏
  detector.onSevereLeak((report) => {
    // 发送到监控服务
    analytics.track('memory_leak', {
      objectCount: report.leakedObjects.length,
      memoryUsage: report.totalMemory
    });
  });
}
```

### 3. 测试集成

```typescript
// 内存泄漏测试工具
class MemoryLeakTester {
  async testComponent(component: any, iterations: number = 100): Promise<TestResult> {
    const detector = new MemoryLeakDetector({ autoStart: true });
    const initialStats = detector.getStatistics();

    // 多次创建和销毁组件
    for (let i = 0; i < iterations; i++) {
      const instance = new component();
      await instance.mount();
      await instance.unmount();
    }

    // 强制垃圾回收（如果可用）
    if (window.gc) {
      window.gc();
    }

    // 等待清理完成
    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalStats = detector.getStatistics();
    const report = detector.generateReport();

    return {
      passed: report.leakedObjects.length === 0,
      leakedObjects: report.leakedObjects.length,
      memoryGrowth: finalStats.totalMemory - initialStats.totalMemory,
      recommendations: report.recommendations
    };
  }
}
```

## 故障排除

### 常见问题

#### 1. 误报泄漏
- **原因**: 对象生命周期较长但正常
- **解决**: 调整检测阈值，增加白名单

#### 2. 性能影响
- **原因**: 追踪开销过大
- **解决**: 采样追踪，减少检测频率

#### 3. 堆栈跟踪开销
- **原因**: 堆栈捕获成本高
- **解决**: 仅在开发环境启用

### 调试工具

```typescript
// 内存泄漏调试工具
class MemoryLeakDebugger {
  static dumpTrackedObjects(): void {
    const stats = GlobalMemoryLeakDetector.getStatistics();
    console.table(stats);
  }

  static analyzeObjectGraph(root: any): void {
    const visited = new WeakSet();
    const path: any[] = [];

    const analyze = (obj: any, depth: number = 0): void => {
      if (depth > 5 || visited.has(obj)) return;

      visited.add(obj);
      console.log(`${'  '.repeat(depth)}${obj.constructor.name}: ${Object.keys(obj).length} properties`);

      for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          analyze(value, depth + 1);
        }
      }
    };

    analyze(root);
  }
}
```

## 相关文档

- [数学对象池优化](./math-pool-optimization.md)
- [性能分析器详细指南](./performance-analyzer.md)
- [完整示例和最佳实践](./complete-examples.md)
- [性能优化概览](./overview.md)