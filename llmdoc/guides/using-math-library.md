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

### 2. 矩阵变换
```typescript
import { Mat4 } from './temp/cocos/core/math/mat4';

// 创建变换矩阵
const matrix = new Mat4();
Mat4.identity(matrix); // 单位矩阵

// 应用变换
Mat4.translate(matrix, matrix, new Vec3(1, 0, 0)); // 平移
Mat4.rotate(matrix, matrix, Math.PI / 4, Vec3.UP); // 旋转
Mat4.scale(matrix, matrix, new Vec3(2, 2, 2)); // 缩放
```

### 3. 四元数旋转
```typescript
import { Quat } from './temp/cocos/core/math/quat';

// 创建旋转四元数
const rotation = new Quat();
Quat.fromEuler(rotation, 0, 90, 0); // 绕Y轴旋转90度

// 插值旋转
const target = new Quat();
Quat.slerp(target, rotation, target, 0.5); // 50%插值
```

## 对象池使用

### 1. 使用传统对象池
```typescript
import { Pool } from './temp/cocos/core/memop/pool';

// 创建向量池
const vectorPool = new Pool(
    () => new Vec3(),
    100 // 初始大小
);

// 获取对象
const tempVector = vectorPool.alloc();

// 使用对象
Vec3.set(tempVector, 1, 2, 3);

// 回收对象
vectorPool.free(tempVector);
```

### 2. 使用循环对象池
```typescript
import { RecyclePool } from './temp/cocos/core/memop/recycle-pool';

// 创建循环池
const recyclePool = new RecyclePool(
    () => new Vec3(),
    50 // 初始大小
);

// 获取池数据
const vectors = recyclePool.data;
vectors.length = recyclePool.length; // 只使用有效部分

// 重置池供下次使用
recyclePool.reset();
```

## 验证任务完成

运行测试代码并检查：
1. 向量运算结果是否符合预期
2. 矩阵变换是否正确应用
3. 对象池是否成功减少内存分配
4. 性能是否得到提升

参考 `temp/cocos/core/math/` 目录下的测试文件验证实现正确性。
</ContentFormat_Guide>

## 质量检查清单
- [x] **简洁性**：文档少于 150 行
- [x] **清晰性**：目的从标题和开头几行即可清楚理解
- [x] **准确性**：所有信息基于源代码验证
- [x] **分类**：文档位于正确的 guides 目录中
- [x] **格式**：严格遵循 ContentFormat_Guide 格式要求