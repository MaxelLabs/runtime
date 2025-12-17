---
title: "图形系统圣经"
id: "graphics-system-bible"
type: "constitution"
tags: ["graphics", "coordinate-system", "matrix-order", "color-space", "rendering-pipeline"]
related_ids: ["coding-conventions", "rhi-demo-constitution", "pbr-material-system"]
token_cost: "high"
context_dependency: []
---

# 图形系统圣经 (Graphics Bible)

## Context
本文档是项目图形系统的核心宪法，定义所有渲染、几何变换和数学运算的基本规则。所有相关的代码实现都必须严格遵守本文档定义的规则。

## Goal
提供统一、准确、完整的图形学基础原理和实现标准，确保整个渲染系统的一致性和正确性。

## 接口定义

### 核心矩阵类型
```typescript
// 列主序 4x4 矩阵布局
interface ColumnMajorMatrix4 {
  elements: Float32Array; // 16个元素，按列存储
  // 内存布局：
  // [0, 1, 2, 3]   = 第一列 (m00, m10, m20, m30)
  // [4, 5, 6, 7]   = 第二列 (m01, m11, m21, m31)
  // [8, 9, 10, 11] = 第三列 (m02, m12, m22, m32)
  // [12, 13, 14, 15]= 第四列 (m03, m13, m23, m33)
}

// 坐标系验证接口
interface CoordinateSystem {
  readonly X_AXIS: Vector3; // [1, 0, 0]
  readonly Y_AXIS: Vector3; // [0, 1, 0]
  readonly Z_AXIS: Vector3; // [0, 0, 1]
  validate(): boolean;     // 验证右手定则
}

// MVP变换矩阵集合
interface MVPMatrices {
  model: ColumnMajorMatrix4;     // 局部->世界
  view: ColumnMajorMatrix4;      // 世界->观察
  projection: ColumnMajorMatrix4;// 观察->裁剪
  mvp?: ColumnMajorMatrix4;      // 组合矩阵
}
```

### 纹理和颜色接口
```typescript
// UV坐标定义
interface UVCoordinate {
  u: number; // [0, 1], 从左到右
  v: number; // [0, 1], 从下到上
}

// 颜色空间转换
interface ColorSpaceConverter {
  srgbToLinear(srgbColor: Vector3): Vector3;
  linearToSRGB(linearColor: Vector3): Vector3;
}
```

## 第一章：基本教义 (The Creed)

### 1.1 坐标系：右手坐标系

本项目统一采用 **右手坐标系 (Right-Handed Coordinate System)**。

```typescript
// 坐标系定义
const RIGHT_HANDED_SYSTEM: CoordinateSystem = {
  X_AXIS: new Vector3(1, 0, 0),  // 指向右方
  Y_AXIS: new Vector3(0, 1, 0),  // 指向上方
  Z_AXIS: new Vector3(0, 0, 1),  // 指向前方(从屏幕指向观察者)

  validate(): boolean {
    const xy = new Vector3().crossVectors(this.X_AXIS, this.Y_AXIS);
    const yz = new Vector3().crossVectors(this.Y_AXIS, this.Z_AXIS);
    return xy.equals(this.Z_AXIS) && yz.equals(this.X_AXIS);
  }
};
```

**负面约束：**
- ❌ 禁止使用左手坐标系
- ❌ 禁止修改坐标轴方向
- ❌ 禁止混合使用不同的坐标系统

### 1.2 验证法则

所有与坐标系相关的基础运算，必须符合右手定则：

```typescript
// 强制验证 - 所有初始化代码必须包含
console.assert(
  RIGHT_HANDED_SYSTEM.validate(),
  "坐标系验证失败: 必须使用右手坐标系"
);
```

## 第二章：核心变换与矩阵系统

### 2.1 MVP 变换流程 (MVP Transform)

```typescript
// MVP变换管线
interface TransformPipeline {
  modelMatrix: ColumnMajorMatrix4;
  viewMatrix: ColumnMajorMatrix4;
  projectionMatrix: ColumnMajorMatrix4;

  // 应用完整变换链
  transform(point: Vector3): Vector3 {
    const world = point.applyMatrix4(this.modelMatrix);
    const view = world.applyMatrix4(this.viewMatrix);
    const clip = view.applyMatrix4(this.projectionMatrix);

    // 透视除法
    const ndc = new Vector3(
      clip.x / clip.w,
      clip.y / clip.w,
      clip.z / clip.w
    );

    return ndc;
  }
}
```

**关键公式：**
```
P_world = M_model × P_local
P_view = M_view × P_world
P_clip = M_proj × P_view
P_ndc = P_clip / P_clip.w
```

### 2.2 内存布局：列主序 (Column-Major)

**要求：** 所有矩阵实例在内存中必须采用列主序布局

```typescript
// 正确的列主序矩阵实现
class Matrix4 implements ColumnMajorMatrix4 {
  elements = new Float32Array(16);

  // 获取元素 - 注意索引规则
  getElement(row: number, col: number): number {
    return this.elements[col * 4 + row]; // 列优先访问
  }

  // 设置元素
  setElement(row: number, col: number, value: number): void {
    this.elements[col * 4 + row] = value; // 列优先设置
  }
}
```

**内存布局表：**
| 索引 | 值 | 位置 |
|------|----|------ |
| m[0] | elements[0] | 第0列, 第0行 |
| m[1] | elements[1] | 第0列, 第1行 |
| m[2] | elements[2] | 第0列, 第2行 |
| m[3] | elements[3] | 第0列, 第3行 |
| m[4] | elements[4] | 第1列, 第0行 |
| ... | ... | ... |

**负面约束：**
- ❌ 禁止将 [m[0], m[1], m[2], m[3]] 视为第一行
- ❌ 禁止使用行主序布局
- ❌ 禁止跨平台使用不同的矩阵布局

### 2.3 矩阵乘法：后乘 (Post-multiplication)

```typescript
// 后乘实现规则
interface MatrixOperations {
  multiply(b: Matrix4): Matrix4; // this = this × b
  clone(): Matrix4;              // 深拷贝
}

// 正确的MVP组合方式
function calculateMVP(model: Matrix4, view: Matrix4, proj: Matrix4): Matrix4 {
  return proj.clone().multiply(view).multiply(model);
}
```

**负面约束：**
- ❌ 禁止在前乘操作中修改原始矩阵
- ❌ 禁止不使用clone()就修改矩阵
- ❌ 禁止错误的乘法顺序

## 第三章：纹理与颜色空间

### 3.1 纹理坐标系 (UV)

```typescript
// UV坐标系统定义
const UV_SYSTEM = {
  ORIGIN: { u: 0, v: 0 },     // 左下角
  U_DIRECTION: { u: 1, v: 0 }, // 从左到右
  V_DIRECTION: { u: 0, v: 1 }, // 从下到上
  RANGE: { min: 0, max: 1 }
};
```

### 3.2 双线性插值算法

```typescript
// 标准双线性插值实现
function bilinearInterpolation(
  texture: TextureData,
  uv: UVCoordinate
): Vector4 {
  // 1. 计算像素坐标
  const texDims = { x: texture.width, y: texture.height };
  const xy = {
    x: uv.u * texDims.x - 0.5,
    y: uv.v * texDims.y - 0.5
  };

  // 2. 获取四个相邻像素
  const x0 = Math.floor(xy.x), y0 = Math.floor(xy.y);
  const x1 = x0 + 1, y1 = y0 + 1;

  // 3. 采样四个像素
  const C00 = texture.sample(x0, y0); // 左下
  const C10 = texture.sample(x1, y0); // 右下
  const C01 = texture.sample(x0, y1); // 左上
  const C11 = texture.sample(x1, y1); // 右上

  // 4. 计算权重
  const tx = xy.x - x0;
  const ty = xy.y - y0;

  // 5. 执行插值
  const bottom = lerp(C00, C10, tx);
  const top = lerp(C01, C11, tx);
  return lerp(bottom, top, ty);
}
```

### 3.3 颜色空间转换

```typescript
// Gamma校正实现
class ColorSpaceManager implements ColorSpaceConverter {
  private readonly GAMMA = 2.2;
  private readonly INV_GAMMA = 1.0 / 2.2;

  srgbToLinear(srgbColor: Vector3): Vector3 {
    return new Vector3(
      Math.pow(srgbColor.x, this.GAMMA),
      Math.pow(srgbColor.y, this.GAMMA),
      Math.pow(srgbColor.z, this.GAMMA)
    );
  }

  linearToSRGB(linearColor: Vector3): Vector3 {
    return new Vector3(
      Math.pow(linearColor.x, this.INV_GAMMA),
      Math.pow(linearColor.y, this.INV_GAMMA),
      Math.pow(linearColor.z, this.INV_GAMMA)
    );
  }
}
```

**负面约束：**
- ❌ 禁止在sRGB空间进行光照计算
- ❌ 禁止忽略Gamma校正
- ❌ 禁止使用错误的Gamma值

## 第四章：数值精度与性能约束

### 4.1 浮点数比较标准

```typescript
// 强制使用EPSILON比较
const EPSILON = 1e-6;

function fuzzyEquals(a: number, b: number, epsilon: number = EPSILON): boolean {
  return Math.abs(a - b) < epsilon;
}

// 错误示例 - 禁止直接比较浮点数
// function compare(a: number, b: number): boolean {
//   return a === b; // ❌ 绝对禁止
// }
```

### 4.2 对象创建约束

```typescript
// 正确的对象复用模式
class PerformanceManager {
  private static _tempVector = new Vector3();
  private static _tempMatrix = new Matrix4();

  static getTempVector(): Vector3 {
    return this._tempVector.set(0, 0, 0); // 重置后复用
  }

  static getTempMatrix(): Matrix4 {
    return this._tempMatrix.identity(); // 重置后复用
  }
}

// 错误示例 - 禁止在循环中创建对象
// function badLoop(): void {
//   for (let i = 0; i < 1000; i++) {
//     const vec = new Vector3(i, i, i); // ❌ 性能杀手
//   }
// }
```

**负面约束：**
- ❌ 禁止在循环或update函数中创建新对象
- ❌ 禁止直接比较浮点数
- ❌ 禁止使用小于1e-6的EPSILON值

## Few-Shot示例

### 示例1：正确的MVP计算
```typescript
// 问题：需要将模型空间的顶点变换到屏幕空间
// 解决方案：
const mvp = calculateMVP(modelMatrix, viewMatrix, projectionMatrix);
const screenPos = vertexPosition.applyMatrix4(mvp);
```

### 示例2：正确的纹理采样
```typescript
// 问题：需要高质量的纹理过滤
// 解决方案：使用双线性插值
const filteredColor = bilinearInterpolation(texture, { u: 0.5, v: 0.5 });
```

### 示例3：错误的矩阵乘法
```typescript
// 问题：矩阵乘法顺序错误
// 错误方式：
// const mvp = model.multiply(view).multiply(proj); // ❌ 顺序错误

// 正确方式：
const mvp = proj.clone().multiply(view).multiply(model); // ✅ 正确顺序
```

## RHI数据接口契约

### 顶点缓冲区布局
```typescript
// 强制interleaved布局
interface VertexBufferLayout {
  // 顺序：Position -> Normal -> UV -> Tangent
  position: [number, number, number];  // 12 bytes
  normal: [number, number, number];    // 12 bytes
  uv: [number, number];                // 8 bytes
  // 总计：32 bytes per vertex
}
```

### UBO对齐规则
```typescript
// std140对齐要求
const STD140_ALIGNMENT = {
  FLOAT: 4,
  VEC2: 8,
  VEC3: 16,  // 注意：vec3需要16字节对齐
  VEC4: 16,
  MAT4: 64
};
```

## 相关文档

### 🏛️ 核心规范
- [编码规范](./coding-conventions.md) - 代码风格约定
- [RHI Demo宪法](./rhi-demo-constitution.md) - Demo实现规范

### 🔧 技术实现
- [矩阵数学API](../api/math-type-reference.md) - 数学库实现
- [渲染管线](../advanced/integration/rendering-pipeline.md) - 管线集成

### 📦 应用模块
- [PBR材质系统](../reference/pbr-material-system.md) - 遵循本圣经的PBR实现
- [阴影工具](../reference/shadow-tools.md) - 基于本圣经的阴影系统
- [粒子系统](../reference/particle-system.md) - 遵循性能要求的粒子效果