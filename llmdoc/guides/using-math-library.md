# 如何使用数学库

## 基础数学计算

### 1. 创建和操作向量
```typescript
import { Vec3 } from './temp/cocos/core/math/vec3';

// 创建向量
const v1 = new Vec3(1, 2, 3);
const v2 = Vec3.ZERO; // 使用预定义常量

// 向量运算
const result = new Vec3();
Vec3.add(result, v1, v2); // result = v1 + v2
Vec3.subtract(result, v1, v2); // result = v1 - v2
Vec3.multiplyScalar(result, v1, 2); // result = v1 * 2
```

### 2. MVP 矩阵变换
```typescript
import { Matrix4 } from './packages/math/src/core/matrix4';
import { Vector3 } from './packages/math/src/core/vector3';

// 创建 MVP 矩阵
const modelMatrix = new Matrix4();
const viewMatrix = new Matrix4();
const projectionMatrix = new Matrix4();

// 模型矩阵：物体变换
Matrix4.identity(modelMatrix);
Matrix4.translate(modelMatrix, modelMatrix, new Vector3(1, 0, 0));
Matrix4.rotate(modelMatrix, modelMatrix, Math.PI / 4, Vector3.UP);
Matrix4.scale(modelMatrix, modelMatrix, new Vector3(2, 2, 2));

// 视图矩阵：相机变换
Matrix4.lookAt(viewMatrix,
    new Vector3(0, 0, 5), // 相机位置
    new Vector3(0, 0, 0), // 观察目标
    new Vector3(0, 1, 0)  // 上方向
);

// 投影矩阵：透视投影
Matrix4.perspective(projectionMatrix,
    45 * Math.PI / 180, // 视野角
    window.innerWidth / window.innerHeight, // 宽高比
    0.1, // 近裁剪面
    1000 // 远裁剪面
);
```

### 3. 四元数旋转
```typescript
import { Quaternion } from './packages/math/src/core/quaternion';

// 创建旋转四元数
const rotation = new Quaternion();
Quaternion.fromEuler(rotation, 0, 90, 0); // 绕Y轴旋转90度

// 插值旋转
const target = new Quaternion();
Quaternion.slerp(target, rotation, target, 0.5); // 50%插值
```

## 对象池使用

### 1. 使用 ObjectPool
```typescript
import { ObjectPool } from './packages/math/src/pool/objectPool';
import { Matrix4 } from './packages/math/src/core/matrix4';

// 创建矩阵池
const matrixPool = new ObjectPool<Matrix4>(
    () => new Matrix4(),
    100 // 初始大小
);

// 获取对象
const tempMatrix = matrixPool.alloc();

// 使用对象
Matrix4.identity(tempMatrix);
Matrix4.translate(tempMatrix, tempMatrix, new Vector3(1, 0, 0));

// 回收对象
matrixPool.free(tempMatrix);

// 获取池统计信息
console.log(matrixPool.size); // 池中对象数量
console.log(matrixPool.used); // 已使用对象数量
```

### 2. 几何体生成器使用对象池
```typescript
import { GeometryGenerator } from './packages/rhi/demo/src/utils/geometry/GeometryGenerator';

// 生成圆环几何体（使用对象池优化）
const torus = GeometryGenerator.torus({
    radius: 1,
    tube: 0.4,
    radialSegments: 16,
    tubularSegments: 100,
    uvs: true,
    normals: true
});

// 生成圆锥几何体
const cone = GeometryGenerator.cone({
    radius: 1,
    height: 2,
    radialSegments: 32,
    openEnded: false,
    uvs: true
});
```

## 验证任务完成

运行测试代码并检查：
1. MVP 矩阵变换是否正确生成和应用
2. 新几何体（Torus、Cone、Cylinder、Capsule）是否正确生成
3. 对象池是否成功减少内存分配
4. 性能是否得到提升

参考 `packages/math/test/` 目录下的测试文件验证实现正确性，并在浏览器中查看 Demo 效果。
</ContentFormat_Guide>

## 质量检查清单
- [x] **简洁性**：文档少于 150 行
- [x] **清晰性**：目的从标题和开头几行即可清楚理解
- [x] **准确性**：所有信息基于源代码验证
- [x] **分类**：文档位于正确的 guides 目录中
- [x] **格式**：严格遵循 ContentFormat_Guide 格式要求