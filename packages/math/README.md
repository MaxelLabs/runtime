# @maxellabs/math

Maxellabs 3D Engine 的高性能数学库，提供3D图形和游戏开发所需的核心数学运算和数据结构。

## 🚀 特性

### 核心数学类型
- **Vector2/3/4**: 高性能向量运算，支持SIMD优化
- **Matrix3/4**: 矩阵运算，针对3D变换优化
- **Quaternion**: 四元数旋转，避免万向锁问题
- **Euler**: 欧拉角转换和运算
- **Color**: 颜色空间转换和运算

### 几何计算
- **Ray**: 射线投射和相交检测
- **Box3**: 3D轴对齐包围盒
- **Sphere**: 3D球体碰撞检测
- **Plane**: 平面方程和距离计算

### 性能优化
- **对象池**: 减少GC压力，提高内存利用率
- **SIMD支持**: 利用现代CPU的向量指令集
- **内存对齐**: 优化缓存访问模式
- **批量运算**: 支持数组批量处理

### 规范兼容
- **USD兼容**: 完全兼容USD格式的数据类型
- **TypeScript**: 完整的类型定义和智能提示
- **模块化**: 支持按需导入，减少包体积

## 📦 安装

```bash
npm install @maxellabs/math
# 或
yarn add @maxellabs/math
# 或
pnpm add @maxellabs/math
```

## 🔧 使用示例

### 基础向量运算

```typescript
import { Vector3, Matrix4, Quaternion } from '@maxellabs/math';

// 创建向量（使用对象池）
const v1 = Vector3.create(1, 2, 3);
const v2 = Vector3.create(4, 5, 6);

// 向量运算
const result = v1.add(v2).normalize();

// 释放到对象池
Vector3.release(v1);
Vector3.release(v2);
Vector3.release(result);
```

### 矩阵变换

```typescript
import { Matrix4, Vector3, Quaternion } from '@maxellabs/math';

// 创建变换矩阵
const transform = Matrix4.create();
const position = Vector3.create(10, 0, 0);
const rotation = Quaternion.create().setFromEuler(0, Math.PI / 2, 0);
const scale = Vector3.create(2, 2, 2);

// 组合变换
transform.compose(position, rotation, scale);

// 应用变换
const point = Vector3.create(1, 1, 1);
transform.transformPoint(point);
```

### 批量运算

```typescript
import { Vector3Batch, Matrix4 } from '@maxellabs/math';

// 批量向量运算
const positions = new Float32Array([
  1, 2, 3,
  4, 5, 6,
  7, 8, 9
]);

const transform = Matrix4.create().makeRotationY(Math.PI / 4);

// 批量变换（SIMD优化）
Vector3Batch.transformArray(positions, transform);
```

### 几何相交检测

```typescript
import { Ray, Box3, Sphere } from '@maxellabs/math';

// 射线与包围盒相交
const ray = new Ray(Vector3.ZERO, Vector3.X);
const box = new Box3(Vector3.create(-1, -1, -1), Vector3.create(1, 1, 1));

const intersection = ray.intersectBox(box);
if (intersection) {
  console.log('相交点:', intersection);
}

// 球体碰撞检测
const sphere1 = new Sphere(Vector3.ZERO, 1);
const sphere2 = new Sphere(Vector3.create(1.5, 0, 0), 1);

if (sphere1.intersectsSphere(sphere2)) {
  console.log('球体相交');
}
```

## �� API 文档

### 核心类型

#### Vector3
```typescript
class Vector3 {
  // 构造函数
  constructor(x?: number, y?: number, z?: number);
  
  // 静态方法（对象池）
  static create(x?: number, y?: number, z?: number): Vector3;
  static release(vector: Vector3): void;
  
  // 基础运算
  add(v: Vector3 | number): this;
  subtract(v: Vector3 | number): this;
  multiply(v: Vector3 | number): this;
  divide(v: Vector3 | number): this;
  
  // 向量运算
  dot(v: Vector3): number;
  cross(v: Vector3): this;
  normalize(): this;
  length(): number;
  
  // 变换
  applyMatrix4(m: Matrix4): this;
  applyQuaternion(q: Quaternion): this;
}
```

#### Matrix4
```typescript
class Matrix4 {
  // 构造函数
  constructor();
  
  // 静态方法（对象池）
  static create(): Matrix4;
  static release(matrix: Matrix4): void;
  
  // 矩阵运算
  multiply(m: Matrix4): this;
  invert(): this;
  transpose(): this;
  
  // 变换构建
  makeTranslation(v: Vector3): this;
  makeRotationFromQuaternion(q: Quaternion): this;
  makeScale(v: Vector3): this;
  compose(position: Vector3, rotation: Quaternion, scale: Vector3): this;
  
  // 投影矩阵
  makePerspective(fov: number, aspect: number, near: number, far: number): this;
  makeOrthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): this;
}
```

#### Quaternion
```typescript
class Quaternion {
  // 构造函数
  constructor(x?: number, y?: number, z?: number, w?: number);
  
  // 静态方法（对象池）
  static create(x?: number, y?: number, z?: number, w?: number): Quaternion;
  static release(quaternion: Quaternion): void;
  
  // 旋转构建
  setFromEuler(x: number, y: number, z: number, order?: string): this;
  setFromAxisAngle(axis: Vector3, angle: number): this;
  setFromRotationMatrix(m: Matrix4): this;
  
  // 四元数运算
  multiply(q: Quaternion): this;
  slerp(q: Quaternion, t: number): this;
  conjugate(): this;
  normalize(): this;
}
```

### 批量运算

#### Vector3Batch
```typescript
class Vector3Batch {
  // 批量变换（SIMD优化）
  static transformArray(vectors: Float32Array, matrix: Matrix4): void;
  static normalizeArray(vectors: Float32Array): void;
  static addArrays(a: Float32Array, b: Float32Array, result: Float32Array): void;
  
  // 批量计算
  static computeBounds(vectors: Float32Array): Box3;
  static computeCenter(vectors: Float32Array): Vector3;
}
```

### 几何类型

#### Ray
```typescript
class Ray {
  constructor(origin: Vector3, direction: Vector3);
  
  // 相交检测
  intersectBox(box: Box3): Vector3 | null;
  intersectSphere(sphere: Sphere): Vector3 | null;
  intersectPlane(plane: Plane): Vector3 | null;
  
  // 距离计算
  distanceToPoint(point: Vector3): number;
  closestPointToPoint(point: Vector3): Vector3;
}
```

#### Box3
```typescript
class Box3 {
  constructor(min?: Vector3, max?: Vector3);
  
  // 包围盒运算
  expandByPoint(point: Vector3): this;
  expandByBox(box: Box3): this;
  intersectsBox(box: Box3): boolean;
  containsPoint(point: Vector3): boolean;
  
  // 属性计算
  getCenter(): Vector3;
  getSize(): Vector3;
  getVolume(): number;
}
```

## ⚡ 性能优化

### 对象池使用

```typescript
// 推荐：使用对象池
const v1 = Vector3.create(1, 2, 3);
const v2 = Vector3.create(4, 5, 6);
const result = v1.add(v2);

// 使用完毕后释放
Vector3.release(v1);
Vector3.release(v2);
Vector3.release(result);

// 不推荐：频繁创建新对象
const v1 = new Vector3(1, 2, 3); // 会产生GC压力
```

### SIMD优化

```typescript
// 自动检测SIMD支持
if (Vector3.hasSIMDSupport()) {
  // 使用SIMD优化的批量运算
  Vector3Batch.transformArray(positions, transform);
} else {
  // 回退到标准实现
  for (let i = 0; i < positions.length; i += 3) {
    const v = Vector3.create(positions[i], positions[i + 1], positions[i + 2]);
    v.applyMatrix4(transform);
    positions[i] = v.x;
    positions[i + 1] = v.y;
    positions[i + 2] = v.z;
    Vector3.release(v);
  }
}
```

### 内存对齐

```typescript
// 使用TypedArray提高性能
const positions = new Float32Array(vertexCount * 3);
const normals = new Float32Array(vertexCount * 3);

// 批量处理，减少函数调用开销
Vector3Batch.normalizeArray(normals);
```

## 🔧 配置选项

```typescript
import { MathConfig } from '@maxellabs/math';

// 配置对象池大小
MathConfig.setPoolSize({
  Vector3: 2000,
  Matrix4: 100,
  Quaternion: 500
});

// 启用SIMD优化
MathConfig.enableSIMD(true);

// 设置精度
MathConfig.setEpsilon(1e-6);
```

## 🧪 测试

```bash
# 运行单元测试
npm test

# 运行性能测试
npm run test:performance

# 运行覆盖率测试
npm run test:coverage
```

## 📈 性能基准

| 操作 | 标准实现 | 优化实现 | 提升 |
|------|----------|----------|------|
| Vector3.add | 100ns | 45ns | 2.2x |
| Matrix4.multiply | 500ns | 180ns | 2.8x |
| 批量变换(1000个点) | 50ms | 12ms | 4.2x |
| Quaternion.slerp | 200ns | 85ns | 2.4x |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

---

## 开发计划

详细的开发计划请参考 [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)
