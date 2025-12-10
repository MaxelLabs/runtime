# 数学库性能优化架构

## 1. Identity

- **What it is:** Maxell 3D Runtime 数学库的内存管理和性能优化策略，通过对象池和智能内存分配实现高性能数学计算。
- **Purpose:** 减少内存分配开销，提高数学计算性能，确保 3D 渲染的流畅性。

## 2. Core Components

- `packages/math/src/pool/objectPool.ts` (ObjectPool, Poolable): 统一的对象池实现，支持类型安全的对象获取和回收，采用动态配置策略。

- `packages/math/src/config/mathConfig.ts` (MathConfig): 配置管理系统，支持对象池大小、扩容策略等参数的动态配置。

- `packages/math/src/core/matrix4.ts` (matrix4Pool): Matrix4 专用的对象池实例，预分配对象用于矩阵运算。

- `packages/rhi/demo/src/utils/geometry/GeometryGenerator.ts`: 几何体生成器使用对象池管理顶点数据，减少临时对象分配。

- `packages/rhi/demo/src/blend-modes.ts` 等演示文件：在 MVP 矩阵变换中使用对象池优化性能。

## 3. Execution Flow (LLM Retrieval Map)

- **1. 对象池初始化:** `ObjectPool` 在 `packages/math/src/pool/objectPool.ts:59-70` 中初始化，根据 MathConfig 动态配置预分配对象。

- **2. 对象获取:** `alloc()` 方法在 `packages/math/src/pool/objectPool.ts:78-88` 中实现，当池为空时根据配置策略自动扩容。

- **3. 对象回收:** `free()` 方法在 `packages/math/src/pool/objectPool.ts:96-98` 中实现，将对象放回池中供下次使用。

- **4. 矩阵池重置:** `Matrix4.reset()` 在 `packages/math/src/core/matrix4.ts:44-46` 中实现，重置为单位矩阵。

- **5. MVP 变换优化:** 在演示系统中使用对象池管理变换矩阵，减少频繁的矩阵分配和回收。

## 4. Design Rationale

该架构采用动态对象池策略：`ObjectPool` 支持根据 `MathConfig` 配置动态调整池大小，适合各种使用场景。通过 `Poolable` 接口统一管理对象生命周期，在 MVP 矩阵变换等高频操作中显著减少内存分配开销。MathConfig 系统允许运行时调整性能参数，平衡内存使用和性能需求。这种设计显著减少了垃圾回收的压力，提高了 3D 渲染运行时的性能稳定性。
</ContentFormat_Architecture>

## 质量检查清单
- [x] **简洁性**：文档少于 150 行
- [x] **清晰性**：目的从标题和开头几行即可清楚理解
- [x] **准确性**：所有信息基于源代码验证
- [x] **分类**：文档位于正确的 architecture 目录中
- [x] **格式**：严格遵循 ContentFormat_Architecture 格式要求