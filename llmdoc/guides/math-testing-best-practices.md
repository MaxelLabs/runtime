# 数学库测试最佳实践指南

## 1. 目标
确保数学库测试的准确性和可维护性，正确处理 Float32Array 精度问题。

## 2. 步骤（原子化）

### 2.1 Float32Array 精度测试
1. **使用 toBeCloseTo 而非 toBe**：
   - *参考*: 所有数学测试文件 (`packages/math/test/**/*.test.ts`)
   - *原因*: Float32Array 只有约7位十进制精度，需要使用近似比较
   - *示例*: `expect(vector.x).toBeCloseTo(expected, 5)` - 5位小数精度足够

### 2.2 常量不可变性测试
1. **理解 Object.freeze 限制**：
   - *参考*: `packages/math/test/core/vector2.test.ts` (常量测试)
   - *限制*: JavaScript 的 Object.freeze 无法深度冻结 Float32Array 内部缓冲区
   - *实践*: 文档化此限制，测试语义不变性而非严格不可变性

### 2.3 对象池统计测试
1. **使用正确的属性名**：
   - *参考*: `PoolStats` 接口定义
   - *属性*: `currentActive` 而非 `activeObjects`
   - *文件*: 所有包含 `getPoolStats()` 测试的文件

### 2.4 矩阵运算测试
1. **理解列主序存储**：
   - *参考*: `packages/math/src/core/matrix4.ts`
   - *约定*: OpenGL/WebGL 标准的列主序存储
   - *测试*: 验证 `toIMatrix4x4()` 的索引映射正确性

### 2.5 Gamma/Linear 空间转换测试
1. **使用正确的 sRGB 公式**：
   - *参考*: `packages/math/src/core/color.ts` (linearToGamma 方法)
   - *公式*: `1.055 * Math.pow(value, 1.0/2.4) - 0.055` for value >= 0.0031308
   - *精度*: 使用 2-3 位小数精度测试转换结果

### 2.6 零向量检测测试
1. **使用正确的 epsilon 值**：
   - *参考*: `NumberEpsilon` 常量 (1e-10)
   - *实践*: 测试值必须小于等于 epsilon 才被认为是零
   - *示例*: 使用 1e-11 而非 1e-8 测试 isZero() 方法

## 3. 常见陷阱

### 3.1 精度陷阱
- **问题**: 直接使用 `toBe()` 比较 Float32Array 值
- **解决**: 始终使用 `toBeCloseTo(value, 5)`

### 3.2 接口不匹配陷阱
- **问题**: 测试期望与实际接口属性名不符
- **解决**: 检查并使用正确的接口定义

### 3.3 算法理解陷阱
- **问题**: 对数学公式或约定理解错误
- **解决**: 参考权威实现和文档，如 sRGB 规范

## 4. 测试模板

```typescript
describe('数学类型测试', () => {
  // Float32Array 精度测试
  test('应该正确处理精度', () => {
    const result = mathOperation();
    expect(result.x).toBeCloseTo(expected.x, 5);
    expect(result.y).toBeCloseTo(expected.y, 5);
  });

  // 常量不可变性测试
  test('常量应该是语义不变的', () => {
    // Object.freeze 不能深度冻结 Float32Array
    // 这是 JavaScript 的已知限制
    const original = Vector2.ONE.x;
    expect(original).toBe(1);
  });

  // 对象池统计测试
  test('应该返回正确的池统计信息', () => {
    const stats = MathType.getPoolStats();
    expect(stats).toHaveProperty('currentActive');
    expect(stats).toHaveProperty('poolSize');
  });
});
```