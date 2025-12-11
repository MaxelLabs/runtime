# 多顶点缓冲区黑屏问题修复指南

## 问题描述

在使用多个顶点缓冲区时，出现渲染黑屏问题。几何体数据已正确创建并绑定，但无法在屏幕上显示。

## 问题诊断

### 症状
- 多顶点缓冲区 Demo (multiple-buffers) 显示黑屏
- 几何体不可见，但控制台无错误
- 单个顶点缓冲区的 Demo 正常工作

### 调试步骤
1. 检查着色器编译 - 成功
2. 检查缓冲区数据 - 正确
3. 检查顶点布局 - 匹配
4. 追踪顶点属性状态 - 发现问题

### 根本原因
`GLRenderPipeline.applyVertexBufferLayout` 方法在每次调用时禁用所有已启用的顶点属性，导致多缓冲区绑定冲突。

```typescript
// 问题代码
const maxAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
for (let i = 0; i < maxAttribs; i++) {
  if (gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_ENABLED)) {
    gl.disableVertexAttribArray(i); // 这里导致问题
  }
}
```

## 解决方案

### 修复方法
移除顶点属性的批量禁用操作，让每个属性独立管理。

### 修复代码
```typescript
// packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts
applyVertexBufferLayout(slot: number, buffer: MSpec.IRHIBuffer, bufferOffsetInBytes: number = 0): void {
  const gl = this.gl;
  const layoutsForSlot = this.attributeBufferLayouts.get(slot);

  // 注意：不再在这里禁用所有顶点属性
  // 原因：多缓冲区绑定时，连续调用 setVertexBuffer 会导致之前绑定的属性被禁用
  // 这会导致多顶点缓冲区 Demo 黑屏（只有最后一个缓冲区被正确绑定）
  // 顶点属性的清理应该在渲染通道开始时或管线切换时进行

  // 继续正常的顶点属性设置流程...
}
```

## 影响分析

### 影响范围
- **正面**: 修复了所有多顶点缓冲区的渲染问题
- **兼容性**: 不影响单缓冲区应用
- **性能**: 移除了不必要的循环，性能略有提升

### 相关 Demo
- `multiple-buffers` - 主要修复的 Demo
- `vertex-formats` - 使用多格式缓冲区，同样受益
- 任何使用 `setVertexBuffer` 多次的应用

## 最佳实践

### 顶点属性管理原则

1. **独立生命周期**
   - 每个顶点属性应独立管理
   - 避免批量禁用操作

2. **正确的清理时机**
   - 渲染通道开始时清理
   - 管线切换时清理
   - 避免在设置时清理

3. **状态追踪**
   - 记录哪些属性已启用
   - 避免重复操作

### 调试技巧

```typescript
// 1. 检查顶点属性状态
const enabledAttribs = [];
for (let i = 0; i < maxAttribs; i++) {
  if (gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_ENABLED)) {
    enabledAttribs.push(i);
  }
}
console.log('Enabled vertex attributes:', enabledAttribs);

// 2. 验证缓冲区绑定
console.log('Buffer slot 0 bound:', positionBuffer);
console.log('Buffer slot 1 bound:', colorBuffer);
console.log('Buffer slot 2 bound:', normalBuffer);

// 3. 检查属性位置
console.log('aPosition location:', gl.getAttribLocation(program, 'aPosition'));
console.log('aColor location:', gl.getAttribLocation(program, 'aColor'));
console.log('aNormal location:', gl.getAttribLocation(program, 'aNormal'));
```

## 相关资源

### 代码位置
- **修复文件**: `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts`
- **修复行数**: 560-563
- **Demo**: `packages/rhi/demo/src/multiple-buffers.ts`

### 相关文档
- [多顶点缓冲区 Demo 参考](../packages/rhi/llmdoc/reference/multiple-buffers-demo.md)
- [问题调查报告](../agent/multiple-buffers-demo-black-screen-investigation.md)
- [WebGL 实现细节](../architecture/webgl-implementation.md)

## 总结

此问题是 WebGL 顶点属性管理的一个典型案例。通过理解顶点属性的生命周期和管理时机，我们成功修复了多缓冲区架构的渲染问题。这个修复不仅解决了当前问题，还为未来的多缓冲区应用提供了稳定的基础。