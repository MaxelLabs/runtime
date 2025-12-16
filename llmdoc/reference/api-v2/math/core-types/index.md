# Math库核心类型API文档

## 概述

Maxellabs Math库提供高性能的3D数学运算支持，包含向量、矩阵、四元数等核心类型。库设计专注于：

- **高性能对象池机制** - 减少GC压力，提升内存使用效率
- **SIMD优化支持** - 利用硬件加速进行批量计算
- **内存对齐优化** - 16字节对齐确保最佳SIMD性能
- **链式调用API** - 提供流畅的开发体验
- **类型安全** - 完整的TypeScript类型支持

## 快速开始

```typescript
import { Vector3, Matrix4, Quaternion } from '@maxellabs/math';

// 使用对象池创建向量（推荐）
const v1 = Vector3.create().set(1, 2, 3);
const v2 = Vector3.create().copy(v1).multiplyScalar(2);

// 创建变换矩阵
const matrix = Matrix4.create()
  .setPosition(10, 0, 5)
  .rotateY(Math.PI / 4);

// 使用完后回收对象
Vector3.release(v1);
Vector3.release(v2);
Matrix4.release(matrix);
```

# Vector2 - 二维向量

## 概述

`Vector2`表示二维空间中的点或方向，使用16字节内存对齐优化性能。

## 构造方法

### `new Vector2(x?, y?, z?)`
创建新的二维向量实例。

**参数：**
- `x: number` - X分量，默认0
- `y: number` - Y分量，默认0

**注意：**推荐使用`Vector2.create()`从对象池获取实例以提高性能。

## 静态方法

### 对象池管理
```typescript
// 从对象池获取实例
Vector3.create(): Vector3

// 释放实例到对象池
Vector3.release(vector: Vector3): void

// 预分配对象池
Vector3.preallocate(count: number): void

// 获取对象池统计
Vector3.getPoolStats(): PoolStats
```

### 工厂方法
```typescript
// 创建零向量
Vector2.ZERO: Vector2

// 创建单位向量
Vector2.ONE: Vector2

// 创建轴向单位向量
Vector2.X: Vector2  // (1, 0)
Vector2.Y: Vector2  // (0, 1)
```

### 数学运算
```typescript
// 两点距离
Vector2.distance(a: Vector2, b: Vector2): number

// 向量点积
Vector2.dot(a: Vector2, b: Vector2): number

// 向量叉积（返回标量）
Vector2.cross(a: Vector2, b: Vector2): number

// 角度计算
Vector2.angle(a: Vector2, b: Vector2): number

// 线性插值
Vector2.lerp(a: Vector2, b: Vector2, t: number): Vector2
```

## 实例方法

### 基础操作
```typescript
// 设置分量值
set(x: number, y: number): Vector2

// 复制向量
copy(vector: Vector2): Vector2

// 克隆向量
clone(): Vector2

// 重置为零向量
reset(): Vector2
```

### 数学运算
```typescript
// 加法
add(vector: Vector2): Vector2
addVectors(a: Vector2, b: Vector2): Vector2

// 减法
sub(vector: Vector2): Vector2
subtractVectors(a: Vector2, b: Vector2): Vector2

// 乘法
multiply(vector: Vector2): Vector2
multiplyScalar(scalar: number): Vector2

// 除法
divide(vector: Vector2): Vector2
divideScalar(scalar: number): Vector2

// 取反
negate(): Vector2
```

### 向量属性
```typescript
// 长度
length(): number

// 长度平方
lengthSquared(): number

// 归一化
normalize(): Vector2

// 点积
dot(vector: Vector2): number

// 叉积
cross(vector: Vector2): number
```

### 变换操作
```typescript
// 旋转
rotate(angle: number): Vector2

// 旋转90度（顺时针）
rotate90CW(): Vector2

// 旋转90度（逆时针）
rotate90CCW(): Vector2

// 反射
reflect(normal: Vector2): Vector2
```

### 插值和混合
```typescript
// 线性插值
lerp(vector: Vector2, alpha: number): Vector2

// 球面线性插值（2D版本）
slerp(vector: Vector2, alpha: number): Vector2

// 平滑插值
smoothLerp(vector: Vector2, alpha: number): Vector2
```

### 比较和测试
```typescript
// 相等比较（考虑精度）
equals(vector: Vector2, epsilon?: number): boolean

// 是否为零向量
isZero(epsilon?: number): boolean

// 是否为单位向量
isUnit(epsilon?: number): boolean
```

## 性能优化示例

```typescript
// ❌ 避免频繁创建对象
function bad(points: Vector2[]) {
  for (let i = 0; i < points.length; i++) {
    const temp = new Vector2(); // 每次循环都创建新对象
    temp.copy(points[i]).multiplyScalar(2);
    // 使用temp...
  }
}

// ✅ 使用对象池优化
function good(points: Vector2[]) {
  const temp = Vector2.create(); // 从池中获取
  try {
    for (let i = 0; i < points.length; i++) {
      temp.copy(points[i]).multiplyScalar(2);
      // 使用temp...
    }
  } finally {
    Vector2.release(temp); // 回收到池中
  }
}
```

# Vector3 - 三维向量

## 概述

`Vector3`是Math库的核心类型，表示三维空间中的点或方向。采用Float32Array存储和16字节内存对齐，确保SIMD最佳性能。

## 内存布局

```typescript
class Vector3 {
  private elements: Float32Array; // [x, y, z, 0]
  // 第4个元素用于内存对齐，不参与计算
}
```

## 静态常量

```typescript
// 基础常量
Vector3.ZERO: Vector3      // (0, 0, 0)
Vector3.ONE: Vector3       // (1, 1, 1)

// 轴向常量
Vector3.X: Vector3         // (1, 0, 0)
Vector3.Y: Vector3         // (0, 1, 0)
Vector3.Z: Vector3         // (0, 0, 1)

// 方向常量（可变）
Vector3.POSITIVE_X: Vector3  // (1, 0, 0)
Vector3.NEGATIVE_X: Vector3  // (-1, 0, 0)
Vector3.POSITIVE_Y: Vector3  // (0, 1, 0)
Vector3.NEGATIVE_Y: Vector3  // (0, -1, 0)
Vector3.POSITIVE_Z: Vector3  // (0, 0, 1)
Vector3.NEGATIVE_Z: Vector3  // (0, 0, -1)
```

## 核心静态方法

### 对象池管理
```typescript
// 高性能对象池接口
Vector3.create(): Vector3
Vector3.release(vector: Vector3): void
Vector3.preallocate(count: number): void
Vector3.getPoolStats(): PoolStats
```

### 几何计算
```typescript
// 距离计算
Vector3.distance(a: Vector3, b: Vector3): number
Vector3.squaredDistance(a: Vector3, b: Vector3): number

// 向量运算
Vector3.dot(a: Vector3, b: Vector3): number
Vector3.cross(a: Vector3, b: Vector3): Vector3

// 角度计算
Vector3.angle(a: Vector3, b: Vector3): number

// 投影
Vector3.project(vector: Vector3, normal: Vector3): Vector3
Vector3.projectOnPlane(vector: Vector3, planeNormal: Vector3): Vector3
```

### 插值方法
```typescript
// 线性插值
Vector3.lerp(a: Vector3, b: Vector3, t: number): Vector3

// 球面线性插值
Vector3.slerp(a: Vector3, b: Vector3, t: number): Vector3

// 平滑插值（更自然的过渡）
Vector3.smoothLerp(a: Vector3, b: Vector3, t: number): Vector3
```

## 实例方法详解

### 基础操作
```typescript
// 设置和复制
set(x: number, y: number, z: number): Vector3
copy(vector: Vector3): Vector3
clone(): Vector3

// 分量访问（通过getter/setter）
vector.x = 1;  // 设置x分量
const y = vector.y;  // 获取y分量
```

### 变换操作
```typescript
// 矩阵变换
applyMatrix4(matrix: Matrix4): Vector3
applyMatrix3(matrix: Matrix3): Vector3
applyProjection(matrix: Matrix4): Vector3

// 四元数变换
applyQuaternion(quaternion: Quaternion): Vector3

// 相机变换
project(camera: Camera): Vector3
unproject(camera: Camera): Vector3
```

### 方向计算
```typescript
// 反射计算
reflect(normal: Vector3): Vector3

// 计算到平面的距离
distanceToPlane(plane: Plane): number

// 计算到线的距离
distanceToLine(line: Line3): number
```

### 坐标转换
```typescript
// 柱坐标转换
setFromCylindrical(cylindrical: Cylindrical): Vector3
toCylindrical(target?: Cylindrical): Cylindrical

// 球坐标转换
setFromSpherical(spherical: Spherical): Vector3
toSpherical(target?: Spherical): Spherical

// 极坐标转换（2D投影）
setFromSphericalCoords(radius: number, phi: number, theta: number): Vector3
```

## 高级应用示例

### 射线检测
```typescript
function raySphereIntersection(
  rayOrigin: Vector3,
  rayDirection: Vector3,
  sphereCenter: Vector3,
  sphereRadius: number
): number | null {
  const oc = Vector3.create().copy(rayOrigin).sub(sphereCenter);
  const a = rayDirection.lengthSquared();
  const b = 2 * oc.dot(rayDirection);
  const c = oc.lengthSquared() - sphereRadius * sphereRadius;

  const discriminant = b * b - 4 * a * c;
  Vector3.release(oc);

  if (discriminant < 0) return null;

  return (-b - Math.sqrt(discriminant)) / (2 * a);
}
```

### 3D变换层级
```typescript
class Transform3D {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;

  constructor() {
    this.position = Vector3.create();
    this.rotation = Quaternion.create();
    this.scale = Vector3.create().set(1, 1, 1);
  }

  getMatrix(): Matrix4 {
    return Matrix4.create()
      .compose(this.position, this.rotation, this.scale);
  }

  transformPoint(point: Vector3): Vector3 {
    return point.clone().applyMatrix4(this.getMatrix());
  }

  destroy(): void {
    Vector3.release(this.position);
    Quaternion.release(this.rotation);
    Vector3.release(this.scale);
  }
}
```

# Vector4 - 四维向量

## 概述

`Vector4`用于表示齐次坐标、颜色值(RGBA)或其他四维数据。特别适用于3D图形变换中的透视投影。

## 静态常量

```typescript
Vector4.ZERO: Vector4    // (0, 0, 0, 0)
Vector4.ONE: Vector4     // (1, 1, 1, 1)
```

## 特殊方法

### 齐次坐标操作
```typescript
// 从Vector3创建齐次坐标（w=1）
fromVector3(v: Vector3, w?: number): Vector4

// 转换为Vector3（透视除法）
toVector3(): Vector3
```

### 颜色操作
```typescript
// 设置RGBA颜色值
setRGBA(r: number, g: number, b: number, a: number): Vector4

// 转换为十六进制颜色
toHex(): string

// 从十六进制创建
fromHex(hex: string): Vector4
```

# Matrix3 - 3x3矩阵

## 概述

`Matrix3`表示3x3变换矩阵，主要用于2D变换、法向量变换等场景。

## 静态方法

```typescript
// 创建单位矩阵
Matrix3.create(): Matrix3

// 从Matrix4创建法向量变换矩阵
Matrix3.fromMatrix4(matrix4: Matrix4): Matrix3

// 创建2D变换矩阵
Matrix3.makeTranslation(x: number, y: number): Matrix3
Matrix3.makeRotation(angle: number): Matrix3
Matrix3.makeScale(sx: number, sy: number): Matrix3
```

## 实例方法

### 基础操作
```typescript
// 设置矩阵元素
set(n11: number, n12: number, n13: number,
    n21: number, n22: number, n23: number,
    n31: number, n32: number, n33: number): Matrix3

// 获取元素
elements(): Float32Array  // 列主序存储
```

### 2D变换
```typescript
// 平移
translate(x: number, y: number): Matrix3

// 旋转
rotate(angle: number): Matrix3

// 缩放
scale(sx: number, sy: number): Matrix3

// 应用到2D点
transformPoint2D(point: Vector2): Vector2
```

### 矩阵运算
```typescript
// 矩阵乘法
multiply(matrix: Matrix3): Matrix3
multiplyMatrices(a: Matrix3, b: Matrix3): Matrix3

// 求逆
getInverse(matrix: Matrix3): Matrix3

// 转置
transpose(): Matrix3

// 求行列式
determinant(): number
```

# Matrix4 - 4x4矩阵

## 概述

`Matrix4`是3D图形编程的核心，表示4x4齐次变换矩阵。采用列主序存储，与OpenGL/WebGL标准一致。

## 内存布局

```typescript
// 列主序存储（Column-Major）
// [m00, m10, m20, m30,  // 第0列
//  m01, m11, m21, m31,  // 第1列
//  m02, m12, m22, m32,  // 第2列
//  m03, m13, m23, m33]  // 第3列
```

## 静态构造方法

### 基础矩阵
```typescript
// 单位矩阵
Matrix4.create(): Matrix4

// 从数组创建
Matrix4.fromArray(array: number[]): Matrix4

// 从位置、旋转、缩放创建
Matrix4.compose(
  position: Vector3,
  quaternion: Quaternion,
  scale: Vector3
): Matrix4
```

### 投影矩阵
```typescript
// 透视投影
Matrix4.makePerspective(
  left: number, right: number,
  top: number, bottom: number,
  near: number, far: number
): Matrix4

// 透视投影（FOV版本）
Matrix4.makePerspectiveFOV(
  fov: number, aspect: number,
  near: number, far: number
): Matrix4

// 正交投影
Matrix4.makeOrthographic(
  left: number, right: number,
  top: number, bottom: number,
  near: number, far: number
): Matrix4
```

### 视图矩阵
```typescript
// LookAt视图矩阵
Matrix4.makeLookAt(
  eye: Vector3,
  target: Vector3,
  up: Vector3
): Matrix4
```

## 实例方法

### 位置变换
```typescript
// 设置位置
setPosition(x: number, y: number, z: number): Matrix4
setPositionFromVector(position: Vector3): Matrix4

// 获取位置
getPosition(target?: Vector3): Vector3

// 平移变换
translate(x: number, y: number, z: number): Matrix4
translateOnAxis(axis: Vector3, distance: number): Matrix4
```

### 旋转变换
```typescript
// 绕轴旋转
rotateOnAxis(axis: Vector3, angle: number): Matrix4

// 绕世界轴旋转
rotateX(angle: number): Matrix4
rotateY(angle: number): Matrix4
rotateZ(angle: number): Matrix4

// 从四元数设置旋转
makeRotationFromQuaternion(quaternion: Quaternion): Matrix4

// 从轴和角度设置旋转
makeRotationAxis(axis: Vector3, angle: number): Matrix4

// 从欧拉角设置旋转
makeRotationFromEuler(euler: Euler): Matrix4
```

### 缩放变换
```typescript
// 设置缩放
setScale(x: number, y: number, z: number): Matrix4

// 获取缩放
getScale(target?: Vector3): Vector3

// 应用缩放
scale(sx: number, sy: number, sz: number): Matrix4
```

### 矩阵分解
```typescript
// 分解为位置、旋转、缩放
decompose(
  position: Vector3,
  quaternion: Quaternion,
  scale: Vector3
): boolean
```

## 高级应用示例

### 相机变换矩阵
```typescript
class Camera3D {
  private viewMatrix: Matrix4;
  private projectionMatrix: Matrix4;
  private viewProjectionMatrix: Matrix4;

  constructor(
    fov: number,
    aspect: number,
    near: number,
    far: number
  ) {
    this.viewMatrix = Matrix4.create();
    this.projectionMatrix = Matrix4.makePerspectiveFOV(fov, aspect, near, far);
    this.viewProjectionMatrix = Matrix4.create();
  }

  // 更新视图矩阵
  updateView(eye: Vector3, target: Vector3, up: Vector3): void {
    this.viewMatrix.makeLookAt(eye, target, up);
    this.updateViewProjection();
  }

  // 获取VP矩阵
  getViewProjection(): Matrix4 {
    return this.viewProjectionMatrix.clone();
  }

  private updateViewProjection(): void {
    this.viewProjectionMatrix.multiplyMatrices(
      this.projectionMatrix,
      this.viewMatrix
    );
  }

  // 投影世界坐标到屏幕
  worldToScreen(worldPos: Vector3): Vector3 {
    const clipPos = Vector3.create().copy(worldPos)
      .applyMatrix4(this.viewProjectionMatrix);

    // 透视除法
    const ndc = 1 / clipPos.w;
    clipPos.multiplyScalar(ndc);

    // NDC到屏幕坐标
    clipPos.x = (clipPos.x + 1) * 0.5;
    clipPos.y = (-clipPos.y + 1) * 0.5;

    return clipPos;
  }
}
```

### 变换层级应用
```typescript
// 场景图节点
class SceneNode {
  private localMatrix: Matrix4;
  private worldMatrix: Matrix4;
  private parent: SceneNode | null;
  private children: SceneNode[];

  constructor() {
    this.localMatrix = Matrix4.create();
    this.worldMatrix = Matrix4.create();
    this.parent = null;
    this.children = [];
  }

  // 设置局部变换
  setTransform(
    position?: Vector3,
    rotation?: Quaternion,
    scale?: Vector3
  ): void {
    this.localMatrix.compose(
      position || Vector3.ZERO,
      rotation || Quaternion.IDENTITY,
      scale || Vector3.ONE
    );
    this.updateWorldTransform();
  }

  // 更新世界变换
  private updateWorldTransform(): void {
    if (this.parent) {
      this.worldMatrix.multiplyMatrices(
        this.parent.worldMatrix,
        this.localMatrix
      );
    } else {
      this.worldMatrix.copy(this.localMatrix);
    }

    // 递归更新子节点
    for (const child of this.children) {
      child.updateWorldTransform();
    }
  }

  // 获取世界位置
  getWorldPosition(target?: Vector3): Vector3 {
    return this.worldMatrix.getPosition(target);
  }
}
```

# Quaternion - 四元数

## 概述

`Quaternion`用于表示3D旋转，避免万向节死锁，提供平滑的旋转插值。

## 静态常量

```typescript
Quaternion.IDENTITY: Quaternion  // (0, 0, 0, 1) 无旋转
```

## 静态构造方法

```typescript
// 从轴和角度创建
Quaternion.makeRotationAxis(axis: Vector3, angle: number): Quaternion

// 从欧拉角创建
Quaternion.fromEuler(euler: Euler): Quaternion

// 从旋转矩阵创建
Quaternion.fromRotationMatrix(matrix: Matrix4): Quaternion

// 创建看向目标的旋转
Quaternion.makeLookAt(eye: Vector3, target: Vector3): Quaternion

// 球面线性插值
Quaternion.slerp(qa: Quaternion, qb: Quaternion, t: number): Quaternion
```

## 实例方法

### 基础操作
```typescript
// 设置四元数
set(x: number, y: number, z: number, w: number): Quaternion

// 克隆
clone(): Quaternion

// 复制
copy(quaternion: Quaternion): Quaternion

// 归一化
normalize(): Quaternion

// 共轭
conjugate(): Quaternion

// 反向
inverse(): Quaternion
```

### 旋转操作
```typescript
// 四元数乘法（组合旋转）
multiply(quaternion: Quaternion): Quaternion
multiplyQuaternions(a: Quaternion, b: Quaternion): Quaternion

// 应用到向量
applyToVector3(vector: Vector3): Vector3

// 绕轴旋转
rotateOnAxis(axis: Vector3, angle: number): Quaternion

// 设置从轴和角度
setFromAxisAngle(axis: Vector3, angle: number): Quaternion
```

### 欧拉角转换
```typescript
// 转换为欧拉角
toEuler(order?: string): Euler

// 从欧拉角设置
setFromEuler(euler: Euler): Quaternion
```

### 插值
```typescript
// 球面线性插值
slerp(quaternion: Quaternion, t: number): Quaternion

// 线性插值（归一化）
lerp(quaternion: Quaternion, t: number): Quaternion

// 球面线性插值（改进版）
slerpFlat(dst: number[], dstOffset: number,
          src0: number[], srcOffset0: number,
          src1: number[], srcOffset1: number, t: number): void
```

## 实际应用示例

### 摄像机控制器
```typescript
class OrbitCamera {
  private rotation: Quaternion;
  private distance: number;
  private target: Vector3;

  constructor() {
    this.rotation = Quaternion.create();
    this.distance = 10;
    this.target = Vector3.create();
  }

  // 旋转摄像机
  rotate(deltaX: number, deltaY: number): void {
    // 水平旋转（绕Y轴）
    const yaw = Quaternion.makeRotationAxis(Vector3.Y, deltaX);
    this.rotation.multiplyQuaternions(yaw, this.rotation);
    Quaternion.release(yaw);

    // 垂直旋转（绕本地X轴）
    const pitch = Quaternion.makeRotationAxis(Vector3.X, deltaY);
    this.rotation.multiply(pitch);
    Quaternion.release(pitch);

    this.rotation.normalize();
  }

  // 获取摄像机位置
  getPosition(): Vector3 {
    const offset = Vector3.create().set(0, 0, -this.distance);
    const rotated = this.rotation.applyToVector3(offset);
    const position = rotated.add(this.target);

    Vector3.release(offset);
    Vector3.release(rotated);

    return position;
  }

  // 获取视图矩阵
  getViewMatrix(): Matrix4 {
    const position = this.getPosition();
    const matrix = Matrix4.makeLookAt(position, this.target, Vector3.Y);
    Vector3.release(position);
    return matrix;
  }
}
```

### 骨骼动画插值
```typescript
class AnimationPlayer {
  private keyframes: Quaternion[];
  private currentRotation: Quaternion;

  constructor(keyframes: Quaternion[]) {
    this.keyframes = keyframes;
    this.currentRotation = Quaternion.create();
  }

  // 更新动画
  update(time: number): void {
    const duration = 1.0; // 1秒动画
    const t = (time % duration) / duration;

    // 找到相邻关键帧
    const frameCount = this.keyframes.length;
    const frame = Math.floor(t * (frameCount - 1));
    const nextFrame = (frame + 1) % frameCount;

    // 计算插值参数
    const localT = (t * (frameCount - 1)) - frame;

    // 球面线性插值
    this.currentRotation.slerp(
      this.keyframes[frame],
      this.keyframes[nextFrame],
      localT
    );
  }

  // 应用到骨骼
  applyToBone(bone: Bone): void {
    bone.rotation.copy(this.currentRotation);
  }
}
```

# 对象池系统详解

## 核心接口

### Poolable接口
```typescript
interface Poolable {
  // 重置对象状态
  reset?(): void;

  // 检查对象是否可池化
  isPoolable?(): boolean;
}
```

### PoolStats统计信息
```typescript
interface PoolStats {
  totalCreated: number;    // 总创建数
  totalReleased: number;   // 总释放数
  currentActive: number;   // 当前活跃数
  poolSize: number;        // 池中可用数
  hitRate: number;         // 命中率
  maxPoolSize: number;     // 最大容量
}
```

## 使用模式

### 基础用法
```typescript
// 获取对象
const vector = Vector3.create();

// 使用对象
vector.set(1, 2, 3).normalize();

// 释放对象
Vector3.release(vector);
```

### 批量操作
```typescript
function processVectors(count: number): void {
  const vectors: Vector3[] = [];

  // 批量创建
  for (let i = 0; i < count; i++) {
    vectors.push(Vector3.create());
  }

  try {
    // 使用向量
    for (let i = 0; i < count; i++) {
      vectors[i].set(
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      );
      // 处理向量...
    }
  } finally {
    // 批量释放
    for (const vector of vectors) {
      Vector3.release(vector);
    }
  }
}
```

### 预分配优化
```typescript
// 应用启动时预分配
function initializeMathPools(): void {
  Vector3.preallocate(1000);
  Matrix4.preallocate(100);
  Quaternion.preallocate(500);

  console.log('Vector3池状态:', Vector3.getPoolStats());
  console.log('Matrix4池状态:', Matrix4.getPoolStats());
}
```

## 性能对比

```typescript
// 性能测试
function performanceTest(): void {
  const iterations = 100000;

  // 测试1: 直接创建
  console.time('Direct Creation');
  for (let i = 0; i < iterations; i++) {
    const v = new Vector3(Math.random(), Math.random(), Math.random());
    v.multiplyScalar(2);
  }
  console.timeEnd('Direct Creation');

  // 测试2: 对象池
  console.time('Object Pool');
  for (let i = 0; i < iterations; i++) {
    const v = Vector3.create();
    v.set(Math.random(), Math.random(), Math.random());
    v.multiplyScalar(2);
    Vector3.release(v);
  }
  console.timeEnd('Object Pool');

  // 输出统计
  console.log('池统计:', Vector3.getPoolStats());
}
```

## 最佳实践

1. **始终释放对象**：使用`try-finally`确保对象被释放
2. **避免池化长期对象**：对象池适合短期使用场景
3. **合理设置池大小**：根据应用场景调整预分配数量
4. **监控池状态**：定期检查`getPoolStats()`调整配置

## 配置系统

```typescript
import { MathConfig } from '@maxellabs/math';

// 全局配置
MathConfig.setPoolSize({
  Vector3: 2000,    // 增大Vector3池
  Matrix4: 500,     // 增大Matrix4池
  Quaternion: 1000  // 增大Quaternion池
});

// 性能开关
MathConfig.enableObjectPool(true);   // 启用对象池
MathConfig.enableSIMD(true);         // 启用SIMD
MathConfig.enableBatchOperations(true); // 启用批量操作
```