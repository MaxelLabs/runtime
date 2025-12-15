# 技术债务清单

本文档记录了项目中发现的技术债务问题，按严重程度分类。

## CRITICAL 级别

### 1. 矩阵乘法严重错误
**位置**: `packages/math/src/core/matrix4.ts:477`
**问题描述**:
- `multiply` 方法中创建了新的 Float32Array 对象并直接赋值给 `this.elements`
- 这破坏了对象池的机制，可能导致内存泄漏
- 矩阵乘法实现可能不正确（需要进一步验证数学公式）

**影响程度**: 严重
- 影响3D变换的核心计算
- 可能导致渲染结果错误
- 性能问题和内存泄漏

**修复建议**:
```typescript
// 当前错误的实现 (第477行)
this.elements = r;

// 应该修改为
this.elements.set(r);
```

## HIGH 级别

### 2. 渲染循环中的对象创建问题 [RESOLVED - 2025-12-16]
**位置**: `packages/rhi/demo/src/` 多个文件
**问题描述**: 在每一帧都创建新的Float32Array和Vector3对象

**修复状态**: ✅ 已修复
**修复日期**: 2025-12-16
**修复内容**:
- `procedural-texture.ts` - Float32Array和Vector3预分配
- `rotating-cube.ts` - Float32Array和Vector3预分配
- `compressed-texture.ts` - Float32Array和Vector3预分配
- `gouraud-shading.ts` - Float32Array和Vector3预分配
- `quad-indexed.ts` - Float32Array预分配
- `stencil-test.ts` - Float32Array预分配
- `viewport-scissor.ts` - Float32Array预分配

**修复模式**:
```typescript
// 修复前 - 在render中创建
render() {
  const transformData = new Float32Array(64);
  const tempVec = new Vector3();
}

// 修复后 - 预分配并复用
const transformData = new Float32Array(64);
const tempVec = new Vector3();
render() {
  // 直接使用预分配的对象
  transformData.set([...]);
  tempVec.set(x, y, z);
}
```

### 3. Float32Array频繁创建 [RESOLVED - 2025-12-16]
**位置**: `packages/rhi/demo/src/` 多个文件
**问题描述**: 在渲染循环中频繁创建Float32Array对象用于更新缓冲区

**修复状态**: ✅ 已修复（与问题2一同修复）
**修复日期**: 2025-12-16

## MEDIUM 级别

### 4. 调试代码留在生产代码中 [PARTIALLY RESOLVED - 2025-12-16]
**位置**:
- `packages/math/src/core/matrix4.ts:521` - 待处理
- `packages/math/src/core/matrix4.ts:1305` - 待处理
- `packages/rhi/demo/src/` 多个文件 - ✅ 已清理

**问题描述**: console.log、console.warn等调试语句未移除

**修复状态**: 🔶 部分修复
**修复日期**: 2025-12-16
**修复内容**:
- `texture-filtering.ts` - 移除console.log调试输出
- `viewport-scissor.ts` - 移除console.info
- `pbr-material.ts` - 移除console.info
- `quad-indexed.ts` - 移除console.info
- 保留了console.error用于错误处理

**剩余工作**: math包中的console语句需要单独处理

**修复建议**:
```typescript
// 创建统一的日志系统
class Logger {
  static isDev = process.env.NODE_ENV === 'development';

  static warn(message: string) {
    if (this.isDev) {
      console.warn(message);
    }
  }
}

// 替换所有console语句
Logger.warn('Matrix4: Matrix is not invertible.');
```

### 5. 魔法数字问题
**位置**:
- `packages/math/src/core/matrix4.ts:888` - `Math.PI / 360`
- `packages/core/demo/src/basic.ts:98` - `stride: 36`
- `packages/core/demo/src/lighting.ts:172` - `3.14159265359`

**问题描述**: 硬编码的数字缺乏说明

**影响程度**: 中
- 代码可维护性差
- 难以理解和修改

**修复建议**: 定义常量
```typescript
const DEGREES_TO_RADIANS = Math.PI / 360;
const VERTEX_STRIDE = 36; // 9个float每顶点 (3+2+4)*4
const PI = 3.14159265359;
```

### 6. 类型安全问题
**位置**: 多处文件
**问题描述**:
- 使用了any类型
- 缺乏类型检查
- 数组索引访问未进行边界检查

**影响程度**: 中
- 运行时错误风险
- 代码质量下降

**修复建议**:
- 启用严格的TypeScript配置
- 添加类型注解
- 实现边界检查

## LOW 级别

### 7. 已弃用API使用
**位置**: `packages/core/demo/src/*/ts`
**问题描述**: 可能使用了WebGL的已弃用API

**影响程度**: 低
- 未来兼容性问题

**修复建议**:
- 更新到最新的WebGL 2.0 API
- 添加兼容性检查

### 8. 注释和文档不一致
**位置**: 多处文件
**问题描述**: 注释与代码实现不匹配

**影响程度**: 低
- 误导开发者

**修复建议**: 更新注释和文档

## 修复优先级

1. **立即修复**: CRITICAL级别问题
2. **下个版本**: HIGH级别问题
3. **计划中**: MEDIUM级别问题
4. **有时间时**: LOW级别问题

## 预防措施

1. **代码审查流程**: 建立强制性的代码审查
2. **自动化检测**: 使用ESLint和TypeScript严格模式
3. **性能监控**: 添加性能监控工具
4. **文档同步**: 确保文档与代码同步更新

## 2025-12-16 审查修复记录

### 工具库优化

**DemoRunner.ts** (`packages/rhi/demo/src/utils/core/DemoRunner.ts`)
- ✅ 添加TextureView缓存（renderTargetView, depthTextureView）
- ✅ 修复beforeunload事件监听器清理
- ✅ 修复canvas click监听器清理
- ✅ 添加depthTexture清理逻辑

**OrbitController.ts** (`packages/rhi/demo/src/utils/camera/OrbitController.ts`)
- ✅ 添加up向量缓存（upVector）
- ✅ 添加矩阵数组缓存（viewMatrixArray, projectionMatrixArray）
- ✅ 添加viewProjectionMatrix缓存

**GeometryGenerator.ts** (`packages/rhi/demo/src/utils/geometry/GeometryGenerator.ts`)
- ✅ 添加createIndexArray方法，自动选择Uint16Array或Uint32Array

### HTML文件规范化

**修复内容**: 为19个HTML文件添加统一的CSS引用
- texture-wrapping.html, primitive-types.html, texture-2d.html
- cubemap-skybox.html, quad-indexed.html, texture-filtering.html
- multi-textures.html, texture-array.html, rotating-cube.html
- triangle.html, render-to-texture.html, colored-triangle.html
- mipmaps.html, multiple-buffers.html, environment-mapping.html
- depth-test.html, vertex-formats.html, compressed-texture.html
- normal-mapping.html

### 资源Label规范化

**修复内容**: 为Demo资源添加有意义的label属性
- procedural-texture.ts - 添加Demo名称前缀
- compressed-texture.ts - 添加Demo名称前缀

## 相关文档

- [编码规范](./coding-conventions.md)
- [性能优化指南](../guides/performance-tuning.md)
- [API参考](../api/)
- [RHI Demo Constitution](./rhi-demo-constitution.md)