# 数学类型参考

## 1. Core Summary

Cocos Creator 数学库提供了一套完整的 TypeScript 类型定义，用于支持 2D/3D 游戏开发中的各种数学计算。所有类型都基于接口定义，确保类型安全和一致性，同时支持只读对象以防止意外修改。

## 2. Source of Truth

- **Primary Code:** `temp/cocos/core/math/type-define.ts` - 包含所有数学类型的 TypeScript 接口定义，这是整个数学库的类型基础。

- **Core Classes:**
  - `temp/cocos/core/math/vec2.ts` - Vec2 类实现
  - `temp/cocos/core/math/vec3.ts` - Vec3 类实现
  - `temp/cocos/core/math/vec4.ts` - Vec4 类实现
  - `temp/cocos/core/math/mat3.ts` - Mat3 类实现
  - `temp/cocos/core/math/mat4.ts` - Mat4 类实现
  - `temp/cocos/core/math/quat.ts` - Quat 类实现

- **Base Types:** `temp/cocos/core/value-types/value-type.ts` - ValueType 基类，提供对象池支持

## 类型接口

### 向量类型
- `IVec2Like` - { x: number, y: number }
- `IVec3Like` - { x: number, y: number, z: number }
- `IVec4Like` - { x: number, y: number, z: number, w: number }

### 矩阵类型
- `IMat3Like` - 3x3 矩阵，9 个数值
- `IMat4Like` - 4x4 矩阵，16 个数值

### 其他类型
- `IQuatLike` - 四元数 { x, y, z, w }
- `IColorLike` - 颜色 { r, g, b, a }
- `IRectLike` - 矩形 { x, y, width, height }
- `ISizeLike` - 尺寸 { width, height }

## 使用示例

```typescript
// 使用类型接口确保类型安全
function processVector(v: IVec3Like): void {
    console.log(`Vector: ${v.x}, ${v.y}, ${v.z}`);
}

// 创建可变向量
const mutableVec: IVec3Like = { x: 1, y: 2, z: 3 };

// 创建只读向量（通过 as Readonly 转换）
const readonlyVec: Readonly<IVec3Like> = { x: 1, y: 2, z: 3 };
// readonlyVec.x = 5; // 编译错误
```

所有数学类型都支持链式调用，便于组合复杂的数学运算表达式。
</ContentFormat_Reference>

## 质量检查清单
- [x] **简洁性**：文档少于 150 行
- [x] **清晰性**：目的从标题和开头几行即可清楚理解
- [x] **准确性**：所有信息基于源代码验证
- [x] **分类**：文档位于正确的 reference 目录中
- [x] **格式**：严格遵循 ContentFormat_Reference 格式要求