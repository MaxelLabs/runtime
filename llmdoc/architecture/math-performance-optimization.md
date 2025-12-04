# 数学库性能优化架构

## 1. Identity

- **What it is:** Cocos Creator 数学库的内存管理和性能优化策略，通过对象池和智能内存分配实现高性能数学计算。
- **Purpose:** 减少内存分配开销，提高数学计算性能，确保游戏运行的流畅性。

## 2. Core Components

- `temp/cocos/core/memop/pool.ts` (Pool, alloc, free): 传统对象池实现，支持类型安全的对象获取和回收，采用批量预分配策略。

- `temp/cocos/core/memop/recycle-pool.ts` (RecyclePool, data, reset): 循环对象池实现，支持完整复用，无需显式回收，特别适合临时数据计算。

- `temp/cocos/core/memop/scalable-container.ts`: 可扩展容器基类，提供自动扩容和缩容机制，优化内存使用效率。

- `temp/cocos/core/utils/pool.ts`: 工具函数级别的对象池，为轻量级对象提供池化支持。

- `temp/cocos/render-scene/core/memory-pools.ts`: 渲染场景专用的内存池，管理图形相关的临时对象。

## 3. Execution Flow (LLM Retrieval Map)

- **1. 对象池初始化:** `Pool` 类在 `temp/cocos/core/memop/pool.ts:59-70` 中初始化，预分配初始批次的对象。

- **2. 对象获取:** `alloc()` 方法在 `temp/cocos/core/memop/pool.ts:78-88` 中实现，当池为空时自动扩容。

- **3. 对象回收:** `free()` 方法在 `temp/cocos/core/memop/pool.ts:96-98` 中实现，将对象放回池中供下次使用。

- **4. 循环池重置:** `RecyclePool.reset()` 在 `temp/cocos/core/memop/recycle-pool.ts:84-86` 中实现，通过重置计数器实现完整复用。

- **5. 自动扩容:** `ScalableContainer` 在 `temp/cocos/core/memop/scalable-container.ts` 中实现动态容量调整。

## 4. Design Rationale

该架构采用双重对象池策略：`Pool` 适合长期存在的对象，提供精确的生命周期管理；`RecyclePool` 适合临时计算对象，通过重置实现零开销复用。所有池化组件都继承自 `ScalableContainer`，支持智能的内存管理，在需要时自动扩容，在内存紧张时自动缩容。这种设计显著减少了垃圾回收的压力，提高了游戏运行时的性能稳定性。
</ContentFormat_Architecture>

## 质量检查清单
- [x] **简洁性**：文档少于 150 行
- [x] **清晰性**：目的从标题和开头几行即可清楚理解
- [x] **准确性**：所有信息基于源代码验证
- [x] **分类**：文档位于正确的 architecture 目录中
- [x] **格式**：严格遵循 ContentFormat_Architecture 格式要求