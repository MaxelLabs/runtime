---
title: Using Math Library
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: math
tags: ['guide', 'llm-native', 'math', 'math-developers', 'code-examples', 'step-by-step']
target_audience: math-developers
complexity: intermediate
estimated_time: f"28 分钟"
last_updated: 2025-12-17
llm_native_compliance: true
version: 1.0.0
---


## 🎯 Context & Goal

### Context
本文档属于**math**类型的开发指南，面向**math-developers**。

### Goal
帮助开发者快速理解和掌握相关概念、工具和最佳实践，提高开发效率和代码质量。

### Prerequisites
- 基础的编程知识
- 了解项目架构和基本概念
- 相关领域的开发经验

---

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
## 🔌 Interface First

### 核心接口定义
#### 配置接口
```typescript
interface Config {
  version: string;
  options: Record<string, any>;
}
```

#### 执行接口
```typescript
function execute(config: Config): Promise<Result> {
  // 实现逻辑
}
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

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
## ⚠️ 禁止事项

### 关键约束
- 🚫 **忽略错误处理**: 确保所有异常情况都有对应的处理逻辑
- 🚫 **缺少验证**: 验证输入参数和返回值的有效性
- 🚫 **不遵循约定**: 保持与项目整体架构和约定的一致性

### 常见错误
- ❌ 忽略错误处理和异常情况
- ❌ 缺少必要的性能优化
- ❌ 不遵循项目的编码规范
- ❌ 忽略文档更新和维护

### 最佳实践提醒
- ✅ 始终考虑性能影响
- ✅ 提供清晰的错误信息
- ✅ 保持代码的可维护性
- ✅ 定期更新文档

---

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
## 📚 Few-Shot示例

### 问题-解决方案对
**问题**: API调用返回错误
**解决方案**: 实现错误处理和重试机制
```typescript
try {
  const result = await apiCall(params);
  return result;
} catch (error) {
  if (retryCount < 3) {
    await delay(1000);
    return apiCall(params, retryCount + 1);
  }
  throw error;
}
```

**问题**: 配置文件格式错误
**解决方案**: 添加配置验证和默认值
```typescript
const config = validateAndNormalize(userConfig, defaultConfig);
if (!config.isValid()) {
  throw new ConfigError('配置验证失败');
}
```

### 学习要点
- 理解常见问题和解决方案
- 掌握最佳实践和避免陷阱
- 培养问题解决思维

---

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