# Matrix4 API 调查报告

## 概述
本报告调查了 `depth-test.ts` demo 中 `Matrix4.makeTranslation()` 方法导致错误的原因，并提供了正确的修复方案。

## 问题发现

### 1. 错误位置
- **文件**: `/Users/mac/Desktop/project/max/runtime/packages/rhi/demo/src/depth-test.ts`
- **行数**: 第 107 行及多处其他位置
- **错误代码**:
  ```typescript
  modelMatrix: new MMath.Matrix4().makeTranslation(0, 0, -1.5)
  ```

### 2. 问题根源
通过查阅 `@maxellabs/math` 包中的 `Matrix4` 类源码，发现：

- **Matrix4 类没有 `makeTranslation()` 方法**
- 正确的方法是 `translate(v: Vector3)`，需要一个 Vector3 参数
- Matrix4 的变换方法包括：
  - `translate(v: Vector3)` - 平移
  - `scale(v: Vector3)` - 缩放
  - `rotateX(angle)`, `rotateY(angle)`, `rotateZ(angle)` - 旋转（接受数值）
  - `rotateOnAxis(axis: Vector3, angle: number)` - 绕任意轴旋转

### 3. API 设计模式
Matrix4 的 API 设计遵循以下模式：
- **链式调用**: 所有变换方法都返回 `this`
- **参数类型**: 平移和缩放需要 Vector3 对象，旋转可以直接使用数值
- **方法前缀**:
  - 没有 `make` 前缀的方法是实例方法，直接修改当前矩阵
  - 例如：`matrix.translate(v)` 而不是 `matrix.makeTranslation(v)`

## 修复方案

### 1. 修改前（错误）
```typescript
// 错误：使用了不存在的方法
modelMatrix: new MMath.Matrix4().makeTranslation(0, 0, -1.5)

// 错误：rotate 方法也不接受 [x, y, z] 数组
.rotate(time.value, [0, 1, 0])
```

### 2. 修改后（正确）
```typescript
// 正确：使用 Vector3 参数
modelMatrix: new MMath.Matrix4().translate(new MMath.Vector3(0, 0, -1.5))

// 正确：使用具体的旋转轴方法
.rotateY(time.value)
```

### 3. 具体修改内容

1. **修复所有 makeTranslation 调用**：
   ```typescript
   // 第 107 行
   .makeTranslation(0, 0, -1.5)
   → .translate(new MMath.Vector3(0, 0, -1.5))

   // 第 119 行
   .makeTranslation(-0.5, 0, 0)
   → .translate(new MMath.Vector3(-0.5, 0, 0))

   // 第 133 行
   .makeTranslation(0.5, 0, 0.5)
   → .translate(new MMath.Vector3(0.5, 0, 0.5))
   ```

2. **修复旋转动画**：
   ```typescript
   // 错误的旋转方法
   .rotate(time.value, [0, 1, 0])
   → .rotateY(time.value)  // 使用具体的轴方法

   // 修复旋转轴语法
   .rotate(Math.PI / 4, [0, 0, 1])
   → .rotateZ(Math.PI / 4)  // 明确使用 Z 轴旋转
   ```

3. **修复缩放操作**：
   ```typescript
   // 错误：直接使用数值
   .scale(0.8, 0.8, 0.8)
   → .scale(new MMath.Vector3(0.8, 0.8, 0.8))  // 需要 Vector3
   ```

### 4. 动画更新逻辑
在渲染循环中，为了正确更新动画，需要先重置矩阵：
```typescript
// 修复前
obj.modelMatrix.makeTranslation(x, y, z)

// 修复后
obj.modelMatrix.identity()
  .translate(new MMath.Vector3(x, y, z))
  // 其他变换...
```

## 正确的 Matrix4 使用示例

### 1. 基础变换
```typescript
// 创建矩阵
const matrix = new MMath.Matrix4();

// 应用变换（链式调用）
matrix
  .translate(new MMath.Vector3(1, 2, 3))  // 平移
  .scale(new MMath.Vector3(2, 2, 2))      // 缩放
  .rotateY(Math.PI / 2)                   // Y轴旋转
  .rotateX(Math.PI / 4);                   // X轴旋转
```

### 2. 动画更新
```typescript
// 每帧更新动画
runner.start((dt) => {
  matrix.identity();  // 重置为单位矩阵

  // 应用新的变换
  matrix
    .translate(new MMath.Vector3(
      Math.sin(time * speed) * radius,
      0,
      Math.cos(time * speed) * radius
    ))
    .rotateY(time * rotationSpeed);
});
```

### 3. 与其他 demo 保持一致
参考 `rotating-cube.ts` 中的正确用法：
```typescript
// rotating-cube.ts 中的正确示例
const modelMatrix = new MMath.Matrix4();
modelMatrix.identity();
modelMatrix.rotateY(rotationY);
modelMatrix.rotateX(rotationX);
```

## 验证结果

- ✅ **构建成功**: 修复后项目能够正常构建
- ✅ **类型检查通过**: TypeScript 没有报错
- ✅ **API 兼容性**: 与项目中其他 demo 的用法保持一致

## 最佳实践建议

1. **始终查阅文档**: 在使用 API 前，查阅相关包的文档和源码
2. **参考已有代码**: 参考项目中其他正常工作的 demo
3. **链式调用**: Matrix4 支持链式调用，可以清晰地组合多个变换
4. **Vector3 复用**: 对于频繁使用的向量，可以复用 Vector3 实例以优化性能

## 相关文件

- **Matrix4 源码**: `/Users/mac/Desktop/project/max/runtime/packages/math/src/core/matrix4.ts`
- **Vector3 源码**: `/Users/mac/Desktop/project/max/runtime/packages/math/src/core/vector3.ts`
- **测试文件**: `/Users/mac/Desktop/project/max/runtime/packages/math/test/core/matrix4.test.ts`
- **修复后的文件**: `/Users/mac/Desktop/project/max/runtime/packages/rhi/demo/src/depth-test.ts`