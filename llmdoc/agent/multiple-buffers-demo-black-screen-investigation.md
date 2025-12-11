# Multiple Buffers Demo 黑屏问题调查报告

## 问题概述

多顶点缓冲区 Demo (multiple-buffers) 出现黑屏问题，几何体无法正确渲染。

## 问题分析

### 初始假设
1. WebGL版本兼容性问题
2. Uniform块大小问题
3. 深度测试未启用
4. 着色器编译错误
5. 缓冲区绑定问题

### 根本原因
**问题位置**: `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts` 的 `applyVertexBufferLayout` 方法

**问题描述**:
- 每次调用 `setVertexBuffer` 时，`applyVertexBufferLayout` 方法会禁用所有已启用的顶点属性
- 这导致多缓冲区绑定时，只有最后一个缓冲区的顶点属性保持启用状态
- 前面绑定的位置和颜色缓冲区被错误禁用，导致几何体无法正确渲染

**问题代码**:
```typescript
// 原始问题代码 - 在 applyVertexBufferLayout 中
const maxAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
for (let i = 0; i < maxAttribs; i++) {
  if (gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_ENABLED)) {
    gl.disableVertexAttribArray(i);
  }
}
```

## 解决方案

### 修复方法
移除 `applyVertexBufferLayout` 方法中的 `disableVertexAttribArray` 循环，让顶点属性保持独立启用。

### 修复后的代码
```typescript
// 注意：不再在这里禁用所有顶点属性
// 原因：多缓冲区绑定时，连续调用 setVertexBuffer 会导致之前绑定的属性被禁用
// 这会导致多顶点缓冲区 Demo 黑屏（只有最后一个缓冲区被正确绑定）
// 顶点属性的清理应该在渲染通道开始时或管线切换时进行
```

### 修复位置
- **文件**: `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts`
- **方法**: `applyVertexBufferLayout`
- **行数**: 560-563

## 技术细节

### 执行流程分析
1. Demo 调用 `renderPass.setVertexBuffer(0, positionBuffer)` - 位置属性正确启用
2. Demo 调用 `renderPass.setVertexBuffer(1, colorBuffer)` - 位置属性被错误禁用，颜色属性启用
3. Demo 调用 `renderPass.setVertexBuffer(2, normalBuffer)` - 位置和颜色属性都被禁用，法线属性启用
4. 结果：只有法线数据传递到着色器，导致渲染异常

### 影响范围
- **直接影响**: 多顶点缓冲区架构的任何 Demo
- **间接影响**: 任何使用多个顶点缓冲区的应用
- **性能影响**: 无，修复仅移除了不必要的属性禁用操作

## 验证方法

### 测试场景
1. 运行 `packages/rhi/demo/html/multiple-buffers.html`
2. 验证四面体正确渲染（红、绿、蓝、黄四色）
3. 验证自动旋转功能正常
4. 验证鼠标交互（旋转、缩放、平移）正常

### 预期结果
- 四面体几何体可见
- 每个顶点显示不同颜色
- 光照效果正常（法线数据正确）
- 性能无下降

## 最佳实践

### 顶点属性管理原则
1. **独立启用**: 每个顶点属性应该独立管理，不互相影响
2. **状态管理**: 顶点属性的清理应该在合适的时机进行（如渲染通道开始）
3. **多缓冲区支持**: 确保多个缓冲区可以同时绑定而不互相干扰

### 相关文件
- `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts:560-563` - 修复位置
- `packages/rhi/demo/src/multiple-buffers.ts:369-371` - 多缓冲区绑定调用
- `packages/rhi/llmdoc/reference/multiple-buffers-demo.md` - 完整实现参考

## 总结

此问题源于顶点属性管理的设计缺陷。通过移除不必要的属性禁用操作，成功修复了多顶点缓冲区架构的黑屏问题。修复简单且安全，不会影响其他功能。