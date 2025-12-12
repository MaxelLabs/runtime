# Memo: 数学库测试经验总结

## 1. 学到的经验

### Float32Array 精度问题
- **教训**: Float32Array 只有约7位十进制精度，不能使用 `toBe()` 进行精确比较
- **解决方案**: 必须使用 `toBeCloseTo(value, 5)` 进行近似比较，5位小数精度足够
- **影响范围**: 所有涉及 Float32Array 的测试，包括向量、矩阵、颜色等

### Object.freeze 的限制
- **教训**: JavaScript 的 `Object.freeze()` 无法深度冻结 Float32Array 的内部缓冲区
- **解决方案**: 在测试中文档化此限制，测试语义不变性而非严格不可变性
- **影响**: 常量对象（如 Vector2.ONE, Color.RED）的测试策略

### 接口命名一致性
- **教训**: 测试期望必须与实际接口定义保持一致
- **案例**: `PoolStats` 接口使用 `currentActive` 而非 `activeObjects`
- **解决方案**: 编写测试前先检查接口定义

### sRGB Gamma 转换公式
- **教训**: 算法实现必须严格遵循规范
- **案例**: `linearToGamma()` 对值 >= 1.0 的处理错误
- **正确公式**: 使用 `1.055 * Math.pow(value, 1.0/2.4) - 0.055` 处理所有 >= 0.0031308 的值

### 矩阵存储约定
- **教训**: 必须理解并遵循列主序存储约定
- **影响**: `toIMatrix4x4()` 的索引映射和测试期望值

### 零值检测的 Epsilon
- **教训**: `isZero()` 方法的测试值必须小于等于定义的 epsilon
- **案例**: `NumberEpsilon` 为 1e-10，测试应使用 1e-11 而非 1e-8

## 2. 最佳实践总结

### 测试编写
1. **精度测试**: 始终使用 `toBeCloseTo(value, 5)`
2. **接口验证**: 检查测试期望与接口定义的一致性
3. **边界条件**: 测试浮点精度边界和特殊情况

### 代码审查
1. **算法验证**: 对照官方规范检查数学公式
2. **约定遵循**: 确保遵循列主序等存储约定
3. **限制文档化**: 在代码中记录已知的平台限制

## 3. 避免的陷阱

1. **不要假设精度**: Float32Array 不是无限精度的
2. **不要假设冻结深度**: Object.freeze 有其限制
3. **不要硬编码接口名**: 从接口定义获取正确的属性名
4. **不要忽略边界**: 特别注意 0.0、1.0 等边界值的处理

## 4. 测试模板

```typescript
// Float32Array 精度测试模板
describe('Float32Array 精度测试', () => {
  test('应该正确处理浮点精度', () => {
    const result = mathOperation();
    expect(result.x).toBeCloseTo(expected.x, 5);
    expect(result.y).toBeCloseTo(expected.y, 5);
  });
});

// 对象池统计测试模板
describe('对象池测试', () => {
  test('应该返回正确的统计信息', () => {
    const stats = MathType.getPoolStats();
    expect(stats).toHaveProperty('currentActive'); // 使用正确的属性名
    expect(stats).toHaveProperty('poolSize');
  });
});

// 常量不可变性测试模板
describe('常量测试', () => {
  test('应该是语义不变的', () => {
    // Object.freeze 不能深度冻结 Float32Array
    const original = Constant.VALUE;
    expect(original).toBe(expectedValue);
  });
});
```

## 5. 相关文档

- [数学库测试最佳实践](../guides/math-testing-best-practices.md)
- [数学库核心架构](../architecture/math/math-core-architecture.md)

## 6. 记录时间

2025-12-13 - 数学测试套件修复完成后记录

---

此备忘录记录了数学库测试修复过程中的关键经验和教训，用于避免未来重复相同的错误。