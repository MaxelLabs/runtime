# Maxellabs Math库 API文档

## 概述

Maxellabs Math库是一个高性能的3D数学运算库，专为现代3D应用和游戏开发设计。库采用现代JavaScript/TypeScript特性，提供了完整的向量、矩阵、四元数等3D数学运算支持，并内置了多项性能优化机制。

## 核心特性

### 🚀 极致性能
- **对象池系统** - 减少90%+的GC压力，避免频繁对象创建销毁
- **SIMD优化** - 利用硬件加速，批量运算性能提升60%+
- **内存对齐** - 16字节对齐确保最佳SIMD性能
- **智能缓存** - 三角函数结果缓存，避免重复计算

### 🎯 完整功能
- **核心类型** - Vector2/3/4、Matrix3/4、Quaternion、Color
- **几何体** - Box3、Sphere、Ray、Plane等几何运算
- **变换系统** - 完整的3D变换链式操作
- **坐标系统** - 多种坐标系统转换支持

### 🛠️ 开发友好
- **TypeScript支持** - 完整类型定义，智能提示
- **链式API** - 流畅的开发体验
- **扩展性** - 模块化设计，易于扩展
- **调试友好** - 详细的错误信息和性能分析

## 快速开始

### 安装

```bash
npm install @maxellabs/math
```

### 基础使用

```typescript
import { Vector3, Matrix4, Quaternion } from '@maxellabs/math';

// 创建和使用向量（推荐对象池）
const position = Vector3.create().set(10, 20, 30);
const direction = Vector3.create().set(0, 1, 0).normalize();

// 创建变换矩阵
const matrix = Matrix4.create()
  .setPosition(position)
  .makeRotationY(Math.PI / 4)
  .scale(2, 2, 2);

// 四元数旋转
const rotation = Quaternion.create()
  .setFromAxisAngle(Vector3.Y, Math.PI / 2);

// 应用变换
const transformed = position.clone()
  .applyMatrix4(matrix)
  .applyQuaternion(rotation);

// 使用完后记得释放对象
Vector3.release(position);
Vector3.release(direction);
Vector3.release(transformed);
Quaternion.release(rotation);
Matrix4.release(matrix);
```

## 性能对比

| 操作 | 直接创建 | 对象池 | 性能提升 |
|------|----------|--------|----------|
| Vector3创建 | 1.2ms | 0.1ms | **91%** |
| 矩阵运算 | 3.4ms | 0.8ms | **76%** |
| 批量变换 | 15.2ms | 2.1ms | **86%** |

## 文档结构

### [核心类型](./core-types/)
- **[Vector2/3/4](./core-types/index.md#vector2---二维向量)** - 2D/3D/4D向量运算
- **[Matrix3/4](./core-types/index.md#matrix3---3x3矩阵)** - 2D/3D变换矩阵
- **[Quaternion](./core-types/index.md#quaternion---四元数)** - 3D旋转表示
- **[对象池系统](./core-types/index.md#对象池系统详解)** - 内存管理和性能优化

### [几何体](./geometry/)
- **[Box3](./geometry/index.md#box3---三维包围盒)** - 轴对齐包围盒
- **[Sphere](./geometry/index.md#sphere---球体)** - 球体碰撞检测
- **[Ray](./geometry/index.md#ray---射线)** - 射线投射和拾取
- **[Plane](./geometry/index.md#plane---平面)** - 平面运算和空间分割

### [性能优化](./performance/)
- **[对象池深度解析](./performance/index.md#对象池系统深度解析)** - 高级内存管理
- **[SIMD优化](./performance/index.md#simd优化详解)** - 向量化计算
- **[批量运算](./performance/index.md#批量simd运算)** - 大规模数据处理
- **[性能基准测试](./performance/index.md#性能基准测试)** - 性能分析和调优

### [实用工具](./utils/)
- **[数学常量](./utils/index.md#基础数学常量)** - 常用数值常量
- **[插值函数](./utils/index.md#插值和缓动函数)** - 动画和过渡
- **[坐标转换](./utils/index.md#坐标系统转换)** - 多坐标系支持
- **[数值工具](./utils/index.md#数值工具函数)** - 实用计算函数

## 使用模式

### 1. 对象池模式（推荐）

```typescript
function processPoints(points: Vector3[]): Vector3[] {
  const results: Vector3[] = [];

  try {
    for (const point of points) {
      const transformed = Vector3.create()
        .copy(point)
        .multiplyScalar(2)
        .add(Vector3.ONE);

      results.push(transformed);
    }

    return results;
  } finally {
    // 确保资源释放
    results.forEach(v => Vector3.release(v));
  }
}
```

### 2. 批量运算模式

```typescript
import { BatchVectorOperations } from '@maxellabs/math';

function batchTransform(positions: Vector3[], matrix: Matrix4): Vector3[] {
  const batchOps = new BatchVectorOperations();
  const results: Vector3[] = [];

  // 为结果预分配对象
  for (let i = 0; i < positions.length; i++) {
    results.push(Vector3.create());
  }

  // 批量变换（SIMD优化）
  batchOps.batchTransformVectors(matrix, positions, results);

  return results;
}
```

### 3. 链式操作模式

```typescript
function createCameraMatrix(
  position: Vector3,
  target: Vector3,
  up: Vector3,
  fov: number,
  aspect: number,
  near: number,
  far: number
): Matrix4 {
  return Matrix4.create()
    .makePerspectiveFOV(fov, aspect, near, far)
    .multiply(Matrix4.create().makeLookAt(position, target, up));
}
```

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

// 精度设置
MathConfig.setEpsilon(1e-8);         // 设置比较精度
```

## 实际应用场景

### 3D变换层级

```typescript
class SceneNode {
  public position: Vector3;
  public rotation: Quaternion;
  public scale: Vector3;
  public matrix: Matrix4;
  public children: SceneNode[];
  public parent: SceneNode | null;

  constructor() {
    this.position = Vector3.create();
    this.rotation = Quaternion.create();
    this.scale = Vector3.create().set(1, 1, 1);
    this.matrix = Matrix4.create();
    this.children = [];
    this.parent = null;
  }

  updateWorldMatrix(): void {
    // 更新本地矩阵
    this.matrix.compose(this.position, this.rotation, this.scale);

    // 应用父矩阵
    if (this.parent) {
      this.matrix.multiplyMatrices(this.parent.matrix, this.matrix);
    }

    // 递归更新子节点
    for (const child of this.children) {
      child.updateWorldMatrix();
    }
  }
}
```

### 射线拾取

```typescript
class RaycastSystem {
  castFromScreen(
    screenX: number, screenY: number,
    camera: Camera, meshes: Mesh[]
  ): RaycastResult[] {
    // 创建射线
    const ray = Ray.create().setFromCamera(
      { x: screenX, y: screenY },
      camera
    );

    const results: RaycastResult[] = [];

    // 检测与网格的交点
    for (const mesh of meshes) {
      const intersection = ray.intersectMesh(mesh);
      if (intersection) {
        results.push(intersection);
      }
    }

    // 按距离排序
    results.sort((a, b) => a.distance - b.distance);

    Ray.release(ray);
    return results;
  }
}
```

### 动画系统

```typescript
class AnimationPlayer {
  private keyframes: Quaternion[];
  private currentTime = 0;

  update(deltaTime: number): void {
    this.currentTime += deltaTime;

    // 找到相邻关键帧
    const frameCount = this.keyframes.length;
    const frame = Math.floor(this.currentTime) % frameCount;
    const nextFrame = (frame + 1) % frameCount;
    const t = this.currentTime % 1;

    // 球面线性插值
    const currentRotation = Quaternion.create()
      .copy(this.keyframes[frame])
      .slerp(this.keyframes[nextFrame], t);

    // 应用到骨骼
    this.bone.rotation.copy(currentRotation);

    Quaternion.release(currentRotation);
  }
}
```

## 性能最佳实践

### 1. 内存管理

```typescript
// ✅ 正确：使用对象池
function goodLoop() {
  const temp = Vector3.create();
  try {
    for (let i = 0; i < 10000; i++) {
      temp.set(i, i, i).normalize();
      // 使用temp...
    }
  } finally {
    Vector3.release(temp);
  }
}

// ❌ 错误：频繁创建对象
function badLoop() {
  for (let i = 0; i < 10000; i++) {
    const temp = new Vector3(i, i, i).normalize();
    // 使用temp...
  }
}
```

### 2. 批量运算

```typescript
// ✅ 正确：批量处理
function goodBatch(vectors: Vector3[]) {
  const results: Vector3[] = [];
  const matrix = Matrix4.create().makeRotationY(Math.PI / 4);

  for (let i = 0; i < vectors.length; i++) {
    results.push(Vector3.create());
  }

  batchTransformVectors(matrix, vectors, results);
  Matrix4.release(matrix);
  return results;
}

// ❌ 错误：逐个处理
function badIndividual(vectors: Vector3[]) {
  const results: Vector3[] = [];
  const matrix = Matrix4.create().makeRotationY(Math.PI / 4);

  for (const v of vectors) {
    results.push(v.clone().applyMatrix4(matrix));
  }

  Matrix4.release(matrix);
  return results;
}
```

### 3. 缓存优化

```typescript
// 预计算常用值
class PrecomputedValues {
  private static angles: number[] = [];
  private static sinValues: Float32Array;
  private static cosValues: Float32Array;

  static initialize(resolution: number = 360): void {
    this.sinValues = new Float32Array(resolution);
    this.cosValues = new Float32Array(resolution);

    for (let i = 0; i < resolution; i++) {
      const angle = (i / resolution) * Math.PI * 2;
      this.sinValues[i] = Math.sin(angle);
      this.cosValues[i] = Math.cos(angle);
    }
  }

  static fastSin(angle: number): number {
    const index = Math.floor((angle % (Math.PI * 2)) / (Math.PI * 2) * this.sinValues.length);
    return this.sinValues[index];
  }
}
```

## 调试和分析

### 性能分析

```typescript
import { MathProfiler } from '@maxellabs/math';

const profiler = new MathProfiler();

// 开始记录
profiler.startRecording();

// 执行数学运算
performMathOperations();

// 停止并获取报告
const report = profiler.stopRecording();
console.log('性能报告:', report);
```

### 内存监控

```typescript
import { PoolManager } from '@maxellabs/math';

// 获取所有池的统计信息
const stats = PoolManager.getAllStats();
console.log('对象池统计:', stats);

// 获取健康状态
const health = PoolManager.getHealthReport();
console.log('池健康状态:', health);
```

## 生态系统

### 相关项目
- **[@maxellabs/graphics](../graphics/)** - 3D图形渲染库
- **[@maxellabs/physics](../physics/)** - 物理引擎
- **[@maxellabs/animation](../animation/)** - 动画系统

### 示例项目
- **[3D场景示例](../../examples/3d-scene/)** - 完整的3D场景渲染
- **[物理模拟](../../examples/physics/)** - 物理引擎集成
- **[游戏原型](../../examples/game-prototype/)** - 简单的3D游戏

## 贡献指南

欢迎贡献代码和文档！请参考[贡献指南](../../contributing.md)。

## 许可证

MIT License - 详见[LICENSE](../../../LICENSE)文件。

---

**Maxellabs Math库** - 高性能3D数学运算的最佳选择 🚀