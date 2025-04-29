# @maxellabs/math

A comprehensive math library for Max Engine, providing essential mathematical operations and data structures for 3D graphics and game development.

## Features

- **Vector Operations**: 2D, 3D, and 4D vector operations
- **Matrix Operations**: 3x3 and 4x4 matrix operations
- **Quaternion**: Quaternion operations for 3D rotations
- **Euler Angles**: Euler angle conversions and operations
- **Geometry**: Ray, Box3, and Sphere implementations
- **Color**: Color space conversions and operations
- **Utilities**: Common mathematical utilities

## Installation

```bash
npm install @maxellabs/math
# or
yarn add @maxellabs/math
# or
pnpm add @maxellabs/math
```

## Usage

```typescript
import { Vector3, Matrix4, Quaternion } from '@maxellabs/math';

// Create a 3D vector
const v = new Vector3(1, 2, 3);

// Create a rotation matrix
const m = new Matrix4();
m.makeRotationY(Math.PI / 2);

// Create a quaternion
const q = new Quaternion();
q.setFromEuler(0, Math.PI / 2, 0);
```

## API Documentation

### Core Features

- `Vector2`, `Vector3`, `Vector4`: Vector operations
- `Matrix3`, `Matrix4`: Matrix operations
- `Quaternion`: 3D rotations
- `Euler`: Euler angle operations
- `Ray`: Ray casting
- `Box3`: 3D bounding box
- `Sphere`: 3D sphere
- `Color`: Color operations

### Extensions

Additional mathematical utilities and extensions are available in the `extension` module.

## License

MIT

---

# @maxellabs/math

Max Engine的数学库，为3D图形和游戏开发提供基础数学运算和数据结构。

## 特性

- **向量运算**：2D、3D和4D向量运算
- **矩阵运算**：3x3和4x4矩阵运算
- **四元数**：3D旋转的四元数运算
- **欧拉角**：欧拉角转换和运算
- **几何体**：射线、包围盒和球体实现
- **颜色**：颜色空间转换和运算
- **工具函数**：常用数学工具函数

## 安装

```bash
npm install @maxellabs/math
# 或
yarn add @maxellabs/math
# 或
pnpm add @maxellabs/math
```

## 使用

```typescript
import { Vector3, Matrix4, Quaternion } from '@maxellabs/math';

// 创建3D向量
const v = new Vector3(1, 2, 3);

// 创建旋转矩阵
const m = new Matrix4();
m.makeRotationY(Math.PI / 2);

// 创建四元数
const q = new Quaternion();
q.setFromEuler(0, Math.PI / 2, 0);
```

## API文档

### 核心功能

- `Vector2`, `Vector3`, `Vector4`：向量运算
- `Matrix3`, `Matrix4`：矩阵运算
- `Quaternion`：3D旋转
- `Euler`：欧拉角运算
- `Ray`：射线投射
- `Box3`：3D包围盒
- `Sphere`：3D球体
- `Color`：颜色运算

### 扩展功能

`extension`模块提供了额外的数学工具和扩展功能。

## 许可证

MIT
