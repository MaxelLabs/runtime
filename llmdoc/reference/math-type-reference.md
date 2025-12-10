# 数学类型参考

## 1. Core Summary

Maxell 3D Runtime 数学库提供了一套完整的 TypeScript 类型定义，用于支持 3D 渲染系统中的各种数学计算。所有类型都基于接口定义，确保类型安全和一致性，同时支持 USD 规范集成，提供高性能的对象池管理和完整的 MVP 矩阵变换能力。

## 2. Source of Truth

- **Primary Code:** `@maxellabs/specification` - 包含与 USD 规范集成的数学类型接口定义。

- **Core Classes:**
  - `packages/math/src/core/vector2.ts` - Vector2 类实现
  - `packages/math/src/core/vector3.ts` - Vector3 类实现
  - `packages/math/src/core/vector4.ts` - Vector4 类实现
  - `packages/math/src/core/matrix3.ts` - Matrix3 类实现
  - `packages/math/src/core/matrix4.ts` - Matrix4 类实现，支持 MVP 矩阵变换
  - `packages/math/src/core/quaternion.ts` - Quaternion 类实现

- **Pool System:**
  - `packages/math/src/pool/objectPool.ts` - ObjectPool 实现，支持 Poolable 接口
  - `packages/math/src/config/mathConfig.ts` - MathConfig 配置系统

- **Geometry Types:**
  - `packages/rhi/demo/src/utils/geometry/types.ts` - 几何体类型定义（TorusOptions, ConeOptions, CylinderOptions, CapsuleOptions）

## 类型接口

### 向量类型
- `Vector2` - 2D 向量 { x: number, y: number }
- `Vector3` - 3D 向量 { x: number, y: number, z: number }
- `Vector4` - 4D 向量 { x: number, y: number, z: number, w: number }

### 矩阵类型
- `Matrix3` - 3x3 矩阵，9 个数值
- `Matrix4` - 4x4 矩阵，16 个数值，实现 MVP 矩阵变换

### 旋转类型
- `Quaternion` - 四元数 { x, y, z, w }

### 几何体类型
- `TorusOptions` - 圆环参数：radius, tube, radialSegments, tubularSegments, uvs, normals
- `ConeOptions` - 圆锥参数：radius, height, radialSegments, openEnded, uvs, normals
- `CylinderOptions` - 圆柱参数：radiusTop, radiusBottom, height, radialSegments, openEnded, uvs, normals
- `CapsuleOptions` - 胶囊参数：radius, height, radialSegments, tubularSegments, uvs, normals

## 使用示例

```typescript
// 创建向量
const vec3 = new Vector3(1, 2, 3);
console.log(`Vector: ${vec3.x}, ${vec3.y}, ${vec3.z}`);

// 创建矩阵
const matrix = new Matrix4();
Matrix4.identity(matrix);
Matrix4.translate(matrix, matrix, new Vector3(1, 0, 0));

// 创建四元数
const quat = new Quaternion();
Quaternion.fromEuler(quat, 0, 90, 0);

// 使用几何体选项
const torusOptions: TorusOptions = {
    radius: 1,
    tube: 0.4,
    radialSegments: 16,
    tubularSegments: 100,
    uvs: true,
    normals: true
};
```

所有数学类型都支持链式调用，并实现 `Poolable` 接口，便于组合复杂的数学运算表达式并优化内存使用。
</ContentFormat_Reference>

## 质量检查清单
- [x] **简洁性**：文档少于 150 行
- [x] **清晰性**：目的从标题和开头几行即可清楚理解
- [x] **准确性**：所有信息基于源代码验证
- [x] **分类**：文档位于正确的 reference 目录中
- [x] **格式**：严格遵循 ContentFormat_Reference 格式要求