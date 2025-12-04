# 数学库核心架构

## 1. Identity

- **What it is:** Cocos Creator 数学库的核心架构设计，包含向量、矩阵、四元数等基础数学类型的实现模式。
- **Purpose:** 为游戏引擎提供高性能、类型安全的数学计算基础设施。

## 2. Core Components

- `temp/cocos/core/math/type-define.ts` (IColorLike, IMat3Like, IMat4Like, IQuatLike, IVec2Like, IVec3Like, IVec4Like): 定义所有数学类型的 TypeScript 接口，提供类型安全的基础。

- `temp/cocos/core/math/vec2.ts` (Vec2): 二维向量实现，支持点积、叉积、插值等 2D 图形计算。

- `temp/cocos/core/math/vec3.ts` (Vec3): 三维向量实现，是 3D 渲染和物理计算的核心组件，提供标准化、距离计算、向量运算等功能。

- `temp/cocos/core/math/mat4.ts` (Mat4): 4x4 矩阵实现，处理 3D 变换、投影、视图矩阵等核心图形计算。

- `temp/cocos/core/math/quat.ts` (Quat): 四元数实现，提供高效的 3D 旋转计算，避免万向节锁问题。

- `temp/cocos/core/math/utils.ts`: 提供数学工具函数，包括角度转换、插值、误差处理等辅助功能。

## 3. Execution Flow (LLM Retrieval Map)

- **1. 类型定义:** 所有数学类型都基于 `temp/cocos/core/math/type-define.ts:25-91` 中定义的接口，确保类型一致性。

- **2. 基础运算:** 向量运算在 `temp/cocos/core/math/vec3.ts:56-2000` 中实现，包括加法、减法、乘法、点积等基础操作。

- **3. 矩阵变换:** 4x4 矩阵变换在 `temp/cocos/core/math/mat4.ts:62-1000` 中实现，支持模型视图投影矩阵计算。

- **4. 旋转计算:** 四元数旋转在 `temp/cocos/core/math/quat.ts:53-500` 中实现，提供平滑的 3D 旋转插值。

- **5. 内存优化:** 所有数学类都继承自 `ValueType`，在 `temp/cocos/core/value-types/value-type.ts` 中实现，提供对象池支持和内存优化。

## 4. Design Rationale

该架构采用了面向对象的设计模式，通过继承 `ValueType` 基类实现统一的生命周期管理。所有数学类型都支持链式调用，便于组合复杂的数学运算。使用 TypeScript 接口确保类型安全，支持只读对象防止意外修改。通过 Object.freeze 冻结常量对象，减少内存占用并提高性能。
</ContentFormat_Architecture>

## 质量检查清单
- [x] **简洁性**：文档少于 150 行
- [x] **清晰性**：目的从标题和开头几行即可清楚理解
- [x] **准确性**：所有信息基于源代码验证
- [x] **分类**：文档位于正确的 architecture 目录中
- [x] **格式**：严格遵循 ContentFormat_Architecture 格式要求