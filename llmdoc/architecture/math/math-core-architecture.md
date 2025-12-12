# 数学库核心架构

## 1. Identity

- **What it is:** Maxell 3D Runtime 数学库的核心架构设计，包含向量、矩阵、四元数等基础数学类型的实现模式。
- **Purpose:** 为 3D 渲染系统提供高性能、类型安全的数学计算基础设施。

## 2. Component Map

### Core Components
- `packages/math/src/core/vector2.ts` (Vector2): 二维向量实现，支持点积、叉积、插值等 2D 图形计算。
- `packages/math/src/core/vector3.ts` (Vector3): 三维向量实现，是 3D 渲染和物理计算的核心组件，提供标准化、距离计算、向量运算等功能。
- `packages/math/src/core/vector4.ts` (Vector4): 四维向量实现，用于颜色、齐次坐标等计算。
- `packages/math/src/core/matrix4.ts` (Matrix4): 4x4 矩阵实现，处理 MVP 矩阵变换、投影、视图矩阵等核心图形计算。
- `packages/math/src/core/quaternion.ts` (Quaternion): 四元数实现，提供高效的 3D 旋转计算，避免万向节锁问题。
- `packages/math/src/core/utils.ts`: 提供数学工具函数，包括角度转换、插值、误差处理等辅助功能。
- `packages/math/src/core/matrix3.ts` (Matrix3): 3x3 矩阵实现，用于法线变换和 2D 变换。
- `packages/math/src/core/euler.ts` (Euler): 欧拉角实现，提供直观的 3D 旋转表示方式，支持多种旋转顺序。
- `packages/math/src/core/box3.ts` (Box3): 三维轴对齐包围盒实现，用于碰撞检测和视锥剔除。
- `packages/math/src/core/ray.ts` (Ray): 三维射线实现，用于射线投射和拾取操作。
- `packages/math/src/core/sphere.ts` (Sphere): 三维球体实现，用于碰撞检测和边界计算。
- `packages/math/src/core/color.ts` (Color): 颜色实现，支持 RGB、HSL 等多种颜色空间转换。
- `packages/math/src/config/mathConfig.ts` (MathConfig): 数学库配置系统，支持对象池动态配置。

### Extension Components
- `packages/math/src/extension/box2.ts` (Box2): 二维轴对齐包围盒，用于 2D 碰撞检测和 UI 布局。
- `packages/math/src/extension/circle.ts` (Circle): 二维圆形实现，用于 2D 物理和 UI 元素。
- `packages/math/src/extension/line2.ts` (Line2): 二维线段实现，支持线线相交检测。
- `packages/math/src/extension/line3.ts` (Line3): 三维线段实现，用于 3D 空间中的线段计算。
- `packages/math/src/extension/plane.ts` (Plane): 三维平面实现，用于空间分割和反射计算。
- `packages/math/src/extension/spherical.ts` (Spherical): 球坐标系实现，用于极坐标转换和相机控制。

## 3. Execution Flow (LLM Retrieval Map)

- **1. 类型定义:** 所有数学类型都基于 `@maxellabs/specification` 包中的矩阵和向量接口，确保与 USD 规范的类型一致性。

- **2. 基础运算:** 向量运算在 `packages/math/src/core/vector3.ts:56-2000` 中实现，包括加法、减法、乘法、点积等基础操作。

- **3. MVP 矩阵变换:** 矩阵变换在 `packages/math/src/core/matrix4.ts:62-1000` 中实现，支持完整的 Model-View-Projection 矩阵计算。

- **4. 旋转计算:** 四元数旋转在 `packages/math/src/core/quaternion.ts:53-500` 中实现，提供平滑的 3D 旋转插值。

- **5. 对象池管理:** 所有数学类都实现 `Poolable` 接口，在 `packages/math/src/pool/objectPool.ts` 中提供对象池支持。

- **6. 几何体生成:** 新几何体在 `packages/rhi/demo/src/utils/geometry/GeometryGenerator.ts` 中实现，支持 Torus、Cone、Cylinder、Capsule 等类型。

- **7. 测试覆盖:** 所有核心和扩展模块都有完整的测试覆盖，测试文件位于 `packages/math/test/` 目录下。注意 Float32Array 精度问题，测试必须使用 `toBeCloseTo(value, 5)` 而非 `toBe()`。

## 4. Design Rationale

该架构采用了模块化设计模式，通过实现 `Poolable` 接口提供对象池支持。所有数学类型都支持链式调用，便于组合复杂的数学运算。使用 TypeScript 接口确保类型安全，支持 USD 规范集成。通过 Object.freeze 冻结常量对象，减少内存占用并提高性能。MathConfig 系统支持动态配置对象池参数。

## 5. 重要注意事项

### Float32Array 精度限制
- 所有数学类型使用 `Float32Array` 存储，具有约7位十进制精度限制
- 测试时必须使用 `toBeCloseTo(value, 5)` 进行近似比较
- `Object.freeze()` 无法深度冻结 Float32Array 内部缓冲区

### 对象池接口
- `PoolStats` 接口使用 `currentActive` 而非 `activeObjects`
- 所有数学类实现 `Poolable` 接口以支持对象池

### 矩阵约定
- 采用列主序存储约定，与 OpenGL/WebGL 标准一致
- `toIMatrix4x4()` 方法正确处理列主序到行主序的转换
</ContentFormat_Architecture>

## 质量检查清单
- [x] **简洁性**：文档少于 150 行
- [x] **清晰性**：目的从标题和开头几行即可清楚理解
- [x] **准确性**：所有信息基于源代码验证
- [x] **分类**：文档位于正确的 architecture 目录中
- [x] **格式**：严格遵循 ContentFormat_Architecture 格式要求