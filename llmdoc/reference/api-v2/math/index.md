# Math API 文档

## 概述

Math 库是 Maxellabs Runtime 的数学运算核心，提供了高性能的3D图形学数学计算功能。它采用对象池设计模式，优化内存使用，减少垃圾回收压力，特别适合实时渲染场景。

## 设计理念

### 1. 对象池模式
为了避免频繁创建/销毁对象造成的性能开销，Math库实现了对象池机制：

```typescript
// 不推荐：每次都创建新对象
function badPractice() {
  const pos = new Vec3(); // 创建新对象
  const mat = new Mat4(); // 创建新对象
  // 使用后对象被GC回收
}

// 推荐：使用对象池
function goodPractice() {
  const pos = Vec3.fromPool(); // 从池中获取
  const mat = Mat4.fromPool(); // 从池中获取

  // 使用完毕
  Vec3.toPool(pos); // 归还到池
  Mat4.toPool(mat); // 归还到池
}
```

### 2. 不可变性 vs 可变性
Math库提供了两种操作模式：

```typescript
// 不可变操作 - 返回新对象
const a = new Vec3(1, 0, 0);
const b = new Vec3(0, 1, 0);
const c = a.add(b); // c = (1, 1, 0), a和b不变

// 可变操作 - 修改原对象
const a = Vec3.fromPool();
const b = new Vec3(0, 1, 0);
a.addMut(b); // a被修改为(0, 1, 0)
```

### 3. 链式调用
支持方法链式调用，提高代码可读性：

```typescript
const result = new Mat4()
  .translate(new Vec3(10, 20, 30))
  .rotateX(Math.PI / 4)
  .scale(new Vec3(2, 2, 2));
```

## 核心类型

### Vec2 - 二维向量

```typescript
// 创建向量
const v1 = new Vec2(1, 2);
const v2 = Vec2.fromArray([1, 2]);
const v3 = Vec2.zero();
const v4 = Vec2.one();

// 基本运算
const sum = v1.add(v2);        // (2, 4)
const diff = v1.sub(v2);       // (0, 0)
const scaled = v1.mulScalar(2); // (2, 4)
const normalized = v1.normalize();

// 常用属性
console.log(v1.length);       // 长度
console.log(v1.squaredLength); // 长度平方（避免开方）
console.log(v1.dot(v2));      // 点积
console.log(v1.cross(v2));    // 叉积（返回标量）

// 角度和旋转
const angle = v1.angleTo(v2);
const rotated = v1.rotate(Math.PI / 2);

// 插值
const interpolated = Vec2.lerp(v1, v2, 0.5); // 线性插值
const slerped = Vec2.slerp(v1, v2, 0.5);    // 球面插值

// 从池中获取（性能优化）
const temp = Vec2.fromPool();
// 使用temp...
Vec2.toPool(temp);
```

### Vec3 - 三维向量

```typescript
// 创建向量
const position = new Vec3(1, 2, 3);
const direction = Vec3.forward(); // (0, 0, 1)
const up = Vec3.up();             // (0, 1, 0)
const right = Vec3.right();       // (1, 0, 0)

// 基本运算
const sum = position.add(direction);
const diff = position.sub(direction);
const scaled = position.mulScalar(2);
const divided = position.divScalar(2);

// 向量运算
const dot = position.dot(direction);       // 点积
const cross = position.cross(direction);   // 叉积
const length = position.length();           // 长度
const normalized = position.normalize();    // 归一化

// 距离计算
const distance = position.distanceTo(target);
const squaredDist = position.distanceToSquared(target);

// 投影
const projected = position.projectOn(direction);
const reflected = position.reflect(normal);

// 旋转变换
const rotatedX = position.rotateX(angle);
const rotatedY = position.rotateY(angle);
const rotatedZ = position.rotateZ(angle);
const rotatedAxis = position.rotateAxis(axis, angle);

// 矩阵变换
const transformed = position.applyMatrix4(matrix);
const transformed3x3 = position.applyMatrix3(matrix3x3);

// 插值
const lerp = Vec3.lerp(a, b, t);
const slerp = Vec3.slerp(a, b, t);

// 随机向量
const randomUnit = Vec3.randomUnit();
const randomDirection = Vec3.randomDirection();
```

### Vec4 - 四维向量

```typescript
// 创建向量
const v1 = new Vec4(1, 2, 3, 4);
const v2 = Vec4.fromVec3(vec3, 1); // 从Vec3扩展
const v3 = Vec4.zero();

// 齐次坐标操作
const v4 = Vec4.fromVec3Direction(direction); // 方向向量，w=0
const v4 = Vec4.fromVec3Position(position);   // 位置向量，w=1

// 透视除法
const ndc = clipSpace.divideMut(clipSpace.w);

// 颜色操作
const color = new Vec4(r, g, b, a);
const blended = color.lerp(otherColor, alpha);
```

### Mat3 - 3x3矩阵

```typescript
// 创建矩阵
const m1 = Mat3.identity();
const m2 = Mat3.zero();
const m3 = Mat3.fromArray([
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
]);

// 基本运算
const product = m1.mul(m2);
const transposed = m1.transpose();
const inversed = m1.inverse();
const det = m1.determinant();

// 变换矩阵
const rotation = Mat3.fromRotation(angle);
const scale = Mat3.fromScale(scaleX, scaleY);
const combined = rotation.mul(scale);

// 应用到向量
const transformed = vector.applyMatrix3(matrix);
```

### Mat4 - 4x4矩阵

```typescript
// 创建矩阵
const identity = Mat4.identity();
const m2 = Mat4.fromArray([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
]);

// 从变换创建
const translation = Mat4.fromTranslation(new Vec3(10, 20, 30));
const rotationX = Mat4.fromRotationX(angle);
const rotationY = Mat4.fromRotationY(angle);
const rotationZ = Mat4.fromRotationZ(angle);
const rotationAxis = Mat4.fromRotationAxis(axis, angle);
const scaling = Mat4.fromScale(scale);

// 基本运算
const product = m1.mul(m2);
const transposed = m1.transpose();
const inversed = m1.inverse();
const det = m1.determinant();

// 链式变换
const transform = new Mat4()
  .translate(position)
  .rotateQuaternion(rotation)
  .scale(scale);

// 分解变换
const { position, rotation, scale } = matrix.decompose();

// 视图矩阵
const view = Mat4.lookAt(eye, target, up);

// 投影矩阵
const perspective = Mat4.perspective(fov, aspect, near, far);
const orthographic = Mat4.orthographic(left, right, bottom, top, near, far);

// 法线矩阵（用于法线变换）
const normalMatrix = modelView.inverse().transpose().toMatrix3();
```

### Quat - 四元数

```typescript
// 创建四元数
const q1 = Quat.identity();
const q2 = Quat.fromEuler(pitch, yaw, roll);
const q3 = Quat.fromAxisAngle(axis, angle);
const q4 = Quat.fromRotationMatrix(matrix);
const q5 = Quat.slerp(q1, q2, t);

// 基本运算
const product = q1.mul(q2);
const inverted = q1.inverse();
const conjugate = q1.conjugate();
const length = q1.length();
const normalized = q1.normalize();

// 旋转变换
const rotated = q1.rotateVector(vector);

// 角度提取
const axis = q1.getAxis();
const angle = q1.getAngle();
const euler = q1.toEuler();

// 面向目标
const lookRotation = Quat.lookRotation(forward, up);
```

### 几何体扩展

### Box3 - 3D包围盒

```typescript
// 创建包围盒
const box = new Box3(min, max);
const emptyBox = Box3.empty();

// 从点集创建
const box = Box3.fromPoints(points);

// 基本操作
const center = box.center();
const size = box.size();
const volume = box.volume();

// 变换
const transformed = box.applyMatrix4(matrix);

// 相交检测
const contains = box.containsPoint(point);
const intersects = box.intersectsBox(otherBox);
const intersectSphere = box.intersectsSphere(sphere);

// 扩展
box.expandByPoint(point);
box.expandByBox(otherBox);
box.expandBySphere(sphere);

// 联合与相交
const union = Box3.union(box1, box2);
const intersection = Box3.intersection(box1, box2);
```

### Sphere - 球体

```typescript
// 创建球体
const sphere = new Sphere(center, radius);

// 相交检测
const intersectsBox = sphere.intersectsBox(box);
const intersectsPlane = sphere.intersectsPlane(plane);
const intersectsSphere = sphere.intersectsSphere(otherSphere);
```

### Plane - 平面

```typescript
// 创建平面
const plane = Plane.fromNormalAndConstant(normal, constant);
const plane = Plane.fromPointAndNormal(point, normal);

// 距离计算
const distance = plane.distanceToPoint(point);

// 投影
const projected = plane.projectPoint(point);
```

### Ray - 射线

```typescript
// 创建射线
const ray = new Ray(origin, direction);

// 相交检测
const boxIntersection = ray.intersectBox(box);
const sphereIntersection = ray.intersectSphere(sphere);
const planeIntersection = ray.intersectPlane(plane);
const triangleIntersection = ray.intersectTriangle(a, b, c);
```

## 性能优化特性

### 1. 对象池配置

```typescript
// 配置对象池大小
const POOL_CONFIG = {
  Vec2: 1000,
  Vec3: 2000,
  Vec4: 1000,
  Mat3: 500,
  Mat4: 500,
  Quat: 1000
};
```

### 2. SIMD优化（在支持的浏览器中）

```typescript
// SIMD向量运算（自动启用）
const a = new Vec3(1, 2, 3);
const b = new Vec3(4, 5, 6);
const c = a.add(b); // 使用SIMD加速
```

### 3. 批量运算

```typescript
// 批量向量运算
const positions = new Float32Array(3000); // 1000个Vec3
const transforms = new Float32Array(4000); // 1000个Vec4

// 批量应用矩阵
Mat4.transformPoints(matrix, positions, positions);
```

### 4. 缓存友好的内存布局

```typescript
// SOA (Structure of Arrays) 布局
class ParticleSystem {
  positions: Float32Array; // 连续存储所有位置
  velocities: Float32Array; // 连续存储所有速度

  update() {
    // 更适合CPU缓存
    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3] += this.velocities[i * 3] * dt;
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;
    }
  }
}
```

## 常用数学运算模式

### 1. 相机变换

```typescript
class Camera {
  position = new Vec3();
  rotation = new Quat();
  fov = Math.PI / 4;
  aspect = 16 / 9;
  near = 0.1;
  far = 1000;

  getViewMatrix(): Mat4 {
    const rotation = Mat4.fromQuaternion(this.rotation);
    const translation = Mat4.fromTranslation(this.position.negate());
    return rotation.mul(translation);
  }

  getProjectionMatrix(): Mat4 {
    return Mat4.perspective(this.fov, this.aspect, this.near, this.far);
  }

  getViewProjectionMatrix(): Mat4 {
    return this.getProjectionMatrix().mul(this.getViewMatrix());
  }

  lookAt(target: Vec3, up: Vec3 = Vec3.up()) {
    const direction = target.sub(this.position).normalize();
    this.rotation = Quat.lookRotation(direction, up);
  }
}
```

### 2. 层次变换

```typescript
class Transform {
  parent?: Transform;
  position = new Vec3();
  rotation = new Quat();
  scale = Vec3.one();

  getLocalMatrix(): Mat4 {
    return new Mat4()
      .translate(this.position)
      .rotateQuaternion(this.rotation)
      .scale(this.scale);
  }

  getWorldMatrix(): Mat4 {
    const local = this.getLocalMatrix();
    if (this.parent) {
      return this.parent.getWorldMatrix().mul(local);
    }
    return local;
  }

  worldToLocal(worldPos: Vec3): Vec3 {
    const invMatrix = this.getWorldMatrix().inverse();
    return worldPos.applyMatrix4(invMatrix);
  }
}
```

### 3. 物理运动

```typescript
class RigidBody {
  position = new Vec3();
  velocity = new Vec3();
  acceleration = new Vec3();
  mass = 1;

  update(dt: number) {
    // 使用欧拉积分
    this.velocity.addMut(this.acceleration.mulScalar(dt));
    this.position.addMut(this.velocity.mulScalar(dt));

    // 清空加速度（每帧重置）
    this.acceleration.setZero();
  }

  applyForce(force: Vec3) {
    // F = ma, a = F/m
    this.acceleration.addMut(force.divScalar(this.mass));
  }

  applyImpulse(impulse: Vec3) {
    // J = mΔv
    this.velocity.addMut(impulse.divScalar(this.mass));
  }
}
```

### 4. 碰撞检测

```typescript
// AABB碰撞检测
function checkAABBCollision(box1: Box3, box2: Box3): boolean {
  return box1.intersectsBox(box2);
}

// 球体碰撞检测
function checkSphereCollision(sphere1: Sphere, sphere2: Sphere): boolean {
  const distance = sphere1.center.distanceTo(sphere2.center);
  return distance < sphere1.radius + sphere2.radius;
}

// 射线与三角形的碰撞
function rayTriangleIntersection(ray: Ray, v0: Vec3, v1: Vec3, v2: Vec3) {
  return ray.intersectTriangle(v0, v1, v2);
}
```

## 坐标系统约定

### 右手坐标系
- X轴：向右
- Y轴：向上
- Z轴：向外（指向观察者）

### 旋转方向
- 正角度：逆时针方向（从轴正方向看）
- 四元数：遵循右手定则

### 矩阵存储
- 列主序（Column-Major）
- 符合WebGL和OpenGL约定

```typescript
// 列主序矩阵示例
const matrix = new Mat4([
  1, 0, 0, 0,  // 第1列
  0, 1, 0, 0,  // 第2列
  0, 0, 1, 0,  // 第3列
  tx, ty, tz, 1 // 第4列（平移）
]);

// 访问矩阵元素
const m00 = matrix.elements[0];  // 第1行第1列
const m01 = matrix.elements[4];  // 第1行第2列
const m03 = matrix.elements[12]; // 第1行第4列（X平移）
```

## API 参考

- [核心类型](./core-types/)
- [几何体操作](./geometry/)
- [性能优化指南](./performance/)
- [实用示例](./examples/)

## 更多资源

- [快速开始](../overview.md)
- [RHI API文档](../rhi/)
- [示例演示](../../demos/)