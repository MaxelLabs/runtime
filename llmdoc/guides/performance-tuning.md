---
title: Performance Tuning
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: performance
tags: ['guide', 'llm-native', 'performance', 'performance-engineers', 'interface-first', 'code-examples', 'step-by-step']
target_audience: performance-engineers
complexity: intermediate
estimated_time: f"35 分钟"
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

# 性能调优指南

## 内存优化

### 1. 使用对象池减少 GC 压力
```typescript
// 错误做法：频繁创建新对象
function badPractice() {
    for (let i = 0; i < 1000; i++) {
        const temp = new Vec3(); // 频繁创建导致 GC
        // 使用 temp...
    }
}

// 正确做法：使用对象池
import { RecyclePool } from '@maxellabs/math';

const tempVectorPool = new RecyclePool(() => new Vec3(), 100);

function goodPractice() {
    const vectors = tempVectorPool.data;
    for (let i = 0; i < 1000; i++) {
        if (i >= vectors.length) {
            tempVectorPool.resize(i + 1);
        }
        const temp = vectors[i]; // 复用对象
        // 使用 temp...
    }
    tempVectorPool.reset(); // 重置供下次使用
}
```

### 2. 避免不必要的对象复制
```typescript
// 错误做法：频繁克隆
const v1 = new Vec3(1, 2, 3);
const v2 = v1.clone(); // 不必要的内存分配

// 正确做法：直接修改或使用临时对象
const result = new Vec3();
Vec3.copy(result, v1); // 复制到可重用对象
```

## 计算优化

### 1. 向量化计算
```typescript
// 错误做法：逐个元素计算
for (let i = 0; i < vertices.length; i += 3) {
    vertices[i] += translation.x;
    vertices[i + 1] += translation.y;
    vertices[i + 2] += translation.z;
}

// 正确做法：使用向量运算
for (let i = 0; i < vertices.length; i += 3) {
    const vertex = new Vec3(vertices[i], vertices[i + 1], vertices[i + 2]);
    Vec3.add(vertex, vertex, translation);
    vertices[i] = vertex.x;
    vertices[i + 1] = vertex.y;
    vertices[i + 2] = vertex.z;
}
```

### 2. 批量矩阵变换
```typescript
// 错误做法：逐个变换
for (const vertex of vertices) {
    Mat4.transformMat4(outMatrix, vertex, matrix);
}

// 正确做法：批量处理
for (let i = 0; i < vertices.length; i += 3) {
    const vertex = new Vec3(
        vertices[i],
        vertices[i + 1],
        vertices[i + 2]
    );
    Mat4.transformMat4(outMatrix, vertex, matrix);
    vertices[i] = vertex.x;
    vertices[i + 1] = vertex.y;
    vertices[i + 2] = vertex.z;
}
```

## 缓存优化

### 1. 缓存常用计算结果
```typescript
// 错误做法：重复计算
function updateTransform() {
    const rotation = Quat.fromEuler(new Quat(), 0, time, 0);
    const translation = Vec3.set(new Vec3(), 0, Math.sin(time), 0);
    // 每次都创建新对象
}

// 正确做法：缓存临时对象
const tempRotation = new Quat();
const tempTranslation = new Vec3();

function updateTransform() {
    Quat.fromEuler(tempRotation, 0, time, 0);
    Vec3.set(tempTranslation, 0, Math.sin(time), 0);
    // 复用临时对象
}
```

### 2. 使用冻结常量
```typescript
// 使用预定义的常量对象
const direction = Vec3.FORWARD; // 冻结对象，性能更优
// 而不是每次 new Vec3(0, 0, -1)
```

## 引擎特定的性能优化

### 1. 渲染管线优化
```typescript
// 启用视锥裁剪
scene.enableFrustumCulling = true;

// 使用静态批处理
renderer.staticBatching = true;

// 优化光照
scene.lightManager.lightProbeMode = LightProbeMode.Baked;

// 使用实例化渲染
renderer.instancing = true;
```

### 2. 资源管理优化
```typescript
// 预加载资源
engine.resourceManager.preload([
    'textures/texture1.png',
    'textures/texture2.png',
    'shaders/shader1.shader'
]);

// 使用纹理集
const textureAtlas = new TextureAtlas('atlas.png');
renderer.material.setTexture('map', textureAtlas.getTexture('player'));
```

### 3. 场景优化
```typescript
// 使用场景分区
const sceneOctree = new SceneOctree(scene);
sceneOctree.cellSize = 50;

// 静态物体标记
staticEntity.addComponent(StaticTag);
scene.addStaticEntity(staticEntity);

// 使用LOD系统
const lodSystem = new LODSystem();
lodSystem.addLODLevel(0, highPolyMesh);
lodSystem.addLODLevel(50, mediumPolyMesh);
lodSystem.addLODLevel(100, lowPolyMesh);
```

## 验证性能提升

1. **内存使用监控**：使用 Chrome DevTools 的 Memory 面板监控 GC 频率
2. **性能分析**：使用 Performance 面板对比优化前后的执行时间
3. **帧率测试**：在目标设备上测试 FPS 改善情况
4. **渲染统计**：监控 Draw calls、Triangles 等渲染指标

参考实现：
- 数学库对象池：`packages/math/src/pool/`
- 引擎核心模块：`packages/core/src/code.zip`
- RHI 渲染优化：`packages/rhi/src/webgl/`
## 🔌 Interface First

### 核心接口定义
#### PerformanceMonitor
```typescript
interface PerformanceMonitor {
  startTiming(label: string): void;
  endTiming(label: string): number;
  getMetrics(): PerformanceMetrics;
}
```

#### OptimizationStrategy
```typescript
interface OptimizationStrategy {
  analyze(): OptimizationReport;
  apply(): void;
  validate(): boolean;
}
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

# 性能调优指南

## 内存优化

### 1. 使用对象池减少 GC 压力
```typescript
// 错误做法：频繁创建新对象
function badPractice() {
    for (let i = 0; i < 1000; i++) {
        const temp = new Vec3(); // 频繁创建导致 GC
        // 使用 temp...
    }
}

// 正确做法：使用对象池
import { RecyclePool } from '@maxellabs/math';

const tempVectorPool = new RecyclePool(() => new Vec3(), 100);

function goodPractice() {
    const vectors = tempVectorPool.data;
    for (let i = 0; i < 1000; i++) {
        if (i >= vectors.length) {
            tempVectorPool.resize(i + 1);
        }
        const temp = vectors[i]; // 复用对象
        // 使用 temp...
    }
    tempVectorPool.reset(); // 重置供下次使用
}
```

### 2. 避免不必要的对象复制
```typescript
// 错误做法：频繁克隆
const v1 = new Vec3(1, 2, 3);
const v2 = v1.clone(); // 不必要的内存分配

// 正确做法：直接修改或使用临时对象
const result = new Vec3();
Vec3.copy(result, v1); // 复制到可重用对象
```

## 计算优化

### 1. 向量化计算
```typescript
// 错误做法：逐个元素计算
for (let i = 0; i < vertices.length; i += 3) {
    vertices[i] += translation.x;
    vertices[i + 1] += translation.y;
    vertices[i + 2] += translation.z;
}

// 正确做法：使用向量运算
for (let i = 0; i < vertices.length; i += 3) {
    const vertex = new Vec3(vertices[i], vertices[i + 1], vertices[i + 2]);
    Vec3.add(vertex, vertex, translation);
    vertices[i] = vertex.x;
    vertices[i + 1] = vertex.y;
    vertices[i + 2] = vertex.z;
}
```

### 2. 批量矩阵变换
```typescript
// 错误做法：逐个变换
for (const vertex of vertices) {
    Mat4.transformMat4(outMatrix, vertex, matrix);
}

// 正确做法：批量处理
for (let i = 0; i < vertices.length; i += 3) {
    const vertex = new Vec3(
        vertices[i],
        vertices[i + 1],
        vertices[i + 2]
    );
    Mat4.transformMat4(outMatrix, vertex, matrix);
    vertices[i] = vertex.x;
    vertices[i + 1] = vertex.y;
    vertices[i + 2] = vertex.z;
}
```

## 缓存优化

### 1. 缓存常用计算结果
```typescript
// 错误做法：重复计算
function updateTransform() {
    const rotation = Quat.fromEuler(new Quat(), 0, time, 0);
    const translation = Vec3.set(new Vec3(), 0, Math.sin(time), 0);
    // 每次都创建新对象
}

// 正确做法：缓存临时对象
const tempRotation = new Quat();
const tempTranslation = new Vec3();

function updateTransform() {
    Quat.fromEuler(tempRotation, 0, time, 0);
    Vec3.set(tempTranslation, 0, Math.sin(time), 0);
    // 复用临时对象
}
```

### 2. 使用冻结常量
```typescript
// 使用预定义的常量对象
const direction = Vec3.FORWARD; // 冻结对象，性能更优
// 而不是每次 new Vec3(0, 0, -1)
```

## 引擎特定的性能优化

### 1. 渲染管线优化
```typescript
// 启用视锥裁剪
scene.enableFrustumCulling = true;

// 使用静态批处理
renderer.staticBatching = true;

// 优化光照
scene.lightManager.lightProbeMode = LightProbeMode.Baked;

// 使用实例化渲染
renderer.instancing = true;
```

### 2. 资源管理优化
```typescript
// 预加载资源
engine.resourceManager.preload([
    'textures/texture1.png',
    'textures/texture2.png',
    'shaders/shader1.shader'
]);

// 使用纹理集
const textureAtlas = new TextureAtlas('atlas.png');
renderer.material.setTexture('map', textureAtlas.getTexture('player'));
```

### 3. 场景优化
```typescript
// 使用场景分区
const sceneOctree = new SceneOctree(scene);
sceneOctree.cellSize = 50;

// 静态物体标记
staticEntity.addComponent(StaticTag);
scene.addStaticEntity(staticEntity);

// 使用LOD系统
const lodSystem = new LODSystem();
lodSystem.addLODLevel(0, highPolyMesh);
lodSystem.addLODLevel(50, mediumPolyMesh);
lodSystem.addLODLevel(100, lowPolyMesh);
```

## 验证性能提升

1. **内存使用监控**：使用 Chrome DevTools 的 Memory 面板监控 GC 频率
2. **性能分析**：使用 Performance 面板对比优化前后的执行时间
3. **帧率测试**：在目标设备上测试 FPS 改善情况
4. **渲染统计**：监控 Draw calls、Triangles 等渲染指标

参考实现：
- 数学库对象池：`packages/math/src/pool/`
- 引擎核心模块：`packages/core/src/code.zip`
- RHI 渲染优化：`packages/rhi/src/webgl/`
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

# 性能调优指南

## 内存优化

### 1. 使用对象池减少 GC 压力
```typescript
// 错误做法：频繁创建新对象
function badPractice() {
    for (let i = 0; i < 1000; i++) {
        const temp = new Vec3(); // 频繁创建导致 GC
        // 使用 temp...
    }
}

// 正确做法：使用对象池
import { RecyclePool } from '@maxellabs/math';

const tempVectorPool = new RecyclePool(() => new Vec3(), 100);

function goodPractice() {
    const vectors = tempVectorPool.data;
    for (let i = 0; i < 1000; i++) {
        if (i >= vectors.length) {
            tempVectorPool.resize(i + 1);
        }
        const temp = vectors[i]; // 复用对象
        // 使用 temp...
    }
    tempVectorPool.reset(); // 重置供下次使用
}
```

### 2. 避免不必要的对象复制
```typescript
// 错误做法：频繁克隆
const v1 = new Vec3(1, 2, 3);
const v2 = v1.clone(); // 不必要的内存分配

// 正确做法：直接修改或使用临时对象
const result = new Vec3();
Vec3.copy(result, v1); // 复制到可重用对象
```

## 计算优化

### 1. 向量化计算
```typescript
// 错误做法：逐个元素计算
for (let i = 0; i < vertices.length; i += 3) {
    vertices[i] += translation.x;
    vertices[i + 1] += translation.y;
    vertices[i + 2] += translation.z;
}

// 正确做法：使用向量运算
for (let i = 0; i < vertices.length; i += 3) {
    const vertex = new Vec3(vertices[i], vertices[i + 1], vertices[i + 2]);
    Vec3.add(vertex, vertex, translation);
    vertices[i] = vertex.x;
    vertices[i + 1] = vertex.y;
    vertices[i + 2] = vertex.z;
}
```

### 2. 批量矩阵变换
```typescript
// 错误做法：逐个变换
for (const vertex of vertices) {
    Mat4.transformMat4(outMatrix, vertex, matrix);
}

// 正确做法：批量处理
for (let i = 0; i < vertices.length; i += 3) {
    const vertex = new Vec3(
        vertices[i],
        vertices[i + 1],
        vertices[i + 2]
    );
    Mat4.transformMat4(outMatrix, vertex, matrix);
    vertices[i] = vertex.x;
    vertices[i + 1] = vertex.y;
    vertices[i + 2] = vertex.z;
}
```

## 缓存优化

### 1. 缓存常用计算结果
```typescript
// 错误做法：重复计算
function updateTransform() {
    const rotation = Quat.fromEuler(new Quat(), 0, time, 0);
    const translation = Vec3.set(new Vec3(), 0, Math.sin(time), 0);
    // 每次都创建新对象
}

// 正确做法：缓存临时对象
const tempRotation = new Quat();
const tempTranslation = new Vec3();

function updateTransform() {
    Quat.fromEuler(tempRotation, 0, time, 0);
    Vec3.set(tempTranslation, 0, Math.sin(time), 0);
    // 复用临时对象
}
```

### 2. 使用冻结常量
```typescript
// 使用预定义的常量对象
const direction = Vec3.FORWARD; // 冻结对象，性能更优
// 而不是每次 new Vec3(0, 0, -1)
```

## 引擎特定的性能优化

### 1. 渲染管线优化
```typescript
// 启用视锥裁剪
scene.enableFrustumCulling = true;

// 使用静态批处理
renderer.staticBatching = true;

// 优化光照
scene.lightManager.lightProbeMode = LightProbeMode.Baked;

// 使用实例化渲染
renderer.instancing = true;
```

### 2. 资源管理优化
```typescript
// 预加载资源
engine.resourceManager.preload([
    'textures/texture1.png',
    'textures/texture2.png',
    'shaders/shader1.shader'
]);

// 使用纹理集
const textureAtlas = new TextureAtlas('atlas.png');
renderer.material.setTexture('map', textureAtlas.getTexture('player'));
```

### 3. 场景优化
```typescript
// 使用场景分区
const sceneOctree = new SceneOctree(scene);
sceneOctree.cellSize = 50;

// 静态物体标记
staticEntity.addComponent(StaticTag);
scene.addStaticEntity(staticEntity);

// 使用LOD系统
const lodSystem = new LODSystem();
lodSystem.addLODLevel(0, highPolyMesh);
lodSystem.addLODLevel(50, mediumPolyMesh);
lodSystem.addLODLevel(100, lowPolyMesh);
```

## 验证性能提升

1. **内存使用监控**：使用 Chrome DevTools 的 Memory 面板监控 GC 频率
2. **性能分析**：使用 Performance 面板对比优化前后的执行时间
3. **帧率测试**：在目标设备上测试 FPS 改善情况
4. **渲染统计**：监控 Draw calls、Triangles 等渲染指标

参考实现：
- 数学库对象池：`packages/math/src/pool/`
- 引擎核心模块：`packages/core/src/code.zip`
- RHI 渲染优化：`packages/rhi/src/webgl/`
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

# 性能调优指南

## 内存优化

### 1. 使用对象池减少 GC 压力
```typescript
// 错误做法：频繁创建新对象
function badPractice() {
    for (let i = 0; i < 1000; i++) {
        const temp = new Vec3(); // 频繁创建导致 GC
        // 使用 temp...
    }
}

// 正确做法：使用对象池
import { RecyclePool } from '@maxellabs/math';

const tempVectorPool = new RecyclePool(() => new Vec3(), 100);

function goodPractice() {
    const vectors = tempVectorPool.data;
    for (let i = 0; i < 1000; i++) {
        if (i >= vectors.length) {
            tempVectorPool.resize(i + 1);
        }
        const temp = vectors[i]; // 复用对象
        // 使用 temp...
    }
    tempVectorPool.reset(); // 重置供下次使用
}
```

### 2. 避免不必要的对象复制
```typescript
// 错误做法：频繁克隆
const v1 = new Vec3(1, 2, 3);
const v2 = v1.clone(); // 不必要的内存分配

// 正确做法：直接修改或使用临时对象
const result = new Vec3();
Vec3.copy(result, v1); // 复制到可重用对象
```

## 计算优化

### 1. 向量化计算
```typescript
// 错误做法：逐个元素计算
for (let i = 0; i < vertices.length; i += 3) {
    vertices[i] += translation.x;
    vertices[i + 1] += translation.y;
    vertices[i + 2] += translation.z;
}

// 正确做法：使用向量运算
for (let i = 0; i < vertices.length; i += 3) {
    const vertex = new Vec3(vertices[i], vertices[i + 1], vertices[i + 2]);
    Vec3.add(vertex, vertex, translation);
    vertices[i] = vertex.x;
    vertices[i + 1] = vertex.y;
    vertices[i + 2] = vertex.z;
}
```

### 2. 批量矩阵变换
```typescript
// 错误做法：逐个变换
for (const vertex of vertices) {
    Mat4.transformMat4(outMatrix, vertex, matrix);
}

// 正确做法：批量处理
for (let i = 0; i < vertices.length; i += 3) {
    const vertex = new Vec3(
        vertices[i],
        vertices[i + 1],
        vertices[i + 2]
    );
    Mat4.transformMat4(outMatrix, vertex, matrix);
    vertices[i] = vertex.x;
    vertices[i + 1] = vertex.y;
    vertices[i + 2] = vertex.z;
}
```

## 缓存优化

### 1. 缓存常用计算结果
```typescript
// 错误做法：重复计算
function updateTransform() {
    const rotation = Quat.fromEuler(new Quat(), 0, time, 0);
    const translation = Vec3.set(new Vec3(), 0, Math.sin(time), 0);
    // 每次都创建新对象
}

// 正确做法：缓存临时对象
const tempRotation = new Quat();
const tempTranslation = new Vec3();

function updateTransform() {
    Quat.fromEuler(tempRotation, 0, time, 0);
    Vec3.set(tempTranslation, 0, Math.sin(time), 0);
    // 复用临时对象
}
```

### 2. 使用冻结常量
```typescript
// 使用预定义的常量对象
const direction = Vec3.FORWARD; // 冻结对象，性能更优
// 而不是每次 new Vec3(0, 0, -1)
```

## 引擎特定的性能优化

### 1. 渲染管线优化
```typescript
// 启用视锥裁剪
scene.enableFrustumCulling = true;

// 使用静态批处理
renderer.staticBatching = true;

// 优化光照
scene.lightManager.lightProbeMode = LightProbeMode.Baked;

// 使用实例化渲染
renderer.instancing = true;
```

### 2. 资源管理优化
```typescript
// 预加载资源
engine.resourceManager.preload([
    'textures/texture1.png',
    'textures/texture2.png',
    'shaders/shader1.shader'
]);

// 使用纹理集
const textureAtlas = new TextureAtlas('atlas.png');
renderer.material.setTexture('map', textureAtlas.getTexture('player'));
```

### 3. 场景优化
```typescript
// 使用场景分区
const sceneOctree = new SceneOctree(scene);
sceneOctree.cellSize = 50;

// 静态物体标记
staticEntity.addComponent(StaticTag);
scene.addStaticEntity(staticEntity);

// 使用LOD系统
const lodSystem = new LODSystem();
lodSystem.addLODLevel(0, highPolyMesh);
lodSystem.addLODLevel(50, mediumPolyMesh);
lodSystem.addLODLevel(100, lowPolyMesh);
```

## 验证性能提升

1. **内存使用监控**：使用 Chrome DevTools 的 Memory 面板监控 GC 频率
2. **性能分析**：使用 Performance 面板对比优化前后的执行时间
3. **帧率测试**：在目标设备上测试 FPS 改善情况
4. **渲染统计**：监控 Draw calls、Triangles 等渲染指标

参考实现：
- 数学库对象池：`packages/math/src/pool/`
- 引擎核心模块：`packages/core/src/code.zip`
- RHI 渲染优化：`packages/rhi/src/webgl/`