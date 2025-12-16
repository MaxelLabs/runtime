# 实例化渲染工具参考文档

## 1. Identity

- **What it is**: GPU 实例化渲染工具模块，提供高性能的大量对象渲染能力
- **Purpose**: 通过单次 Draw Call 渲染数千至数万个相同几何体，显著提升渲染性能

## 2. Core Summary

实例化渲染工具模块包含 InstanceBuffer（实例缓冲区管理器）和 InstancedRenderer（实例化渲染器）两个核心组件，支持：
- 单次 Draw Call 渲染 10,000+ 实例
- 每实例独立变换矩阵和颜色属性
- 批量数据更新优化
- WebGL2 原生支持和 WebGL1 ANGLE_instanced_arrays 扩展支持

## 3. Source of Truth

### Primary Code
- **InstanceBuffer**: `packages/rhi/demo/src/utils/instancing/InstanceBuffer.ts` - 实例数据缓冲区管理器
- **InstancedRenderer**: `packages/rhi/demo/src/utils/instancing/InstancedRenderer.ts` - 实例化渲染器封装
- **Type Definitions**: `packages/rhi/demo/src/utils/instancing/types.ts` - 类型和接口定义
- **Demo Implementation**: `packages/rhi/demo/src/instancing.ts` - 完整的使用示例

### Configuration
- **Standard Instance Layout**: `getStandardInstanceLayout()` in `types.ts` - 标准实例属性布局（mat4 + vec4）

### Related Architecture
- **WebGL Implementation**: `llmdoc/architecture/rhi/webgl-implementation.md` - WebGL 实现细节，包括实例化支持
- **Demo Development Guide**: `llmdoc/guides/demo-development.md` - Demo 开发指南中的实例化工具部分

### External Docs
- **WebGL2 drawElementsInstanced**: https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced
- **ANGLE_instanced_arrays Extension**: https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays/
- **WebGPU drawIndexedIndirect**: https://www.w3.org/TR/webgpu/#dom-gpurenderpassencoder-drawindexedindirect

## 4. Key Features

### 4.1 InstanceBuffer
- 预分配 CPU/GPU 缓冲区，避免运行时内存分配
- 支持单个实例更新和批量更新
- 动态扩容能力
- 详细的内存使用统计

### 4.2 InstancedRenderer
- 自动组合基础几何和实例属性的顶点布局
- 支持 `draw()` 和 `drawIndexed()` 两种模式
- 兼容不同的几何体类型（三角形、立方体、球体等）

### 4.3 Performance Optimizations
- std140 内存布局确保跨平台兼容
- 批量数据传输减少 GPU 同步开销
- 预分配策略避免频繁的内存分配

## 5. Usage Example

```typescript
// 创建实例缓冲区
const instanceBuffer = new InstanceBuffer(device, {
  maxInstances: 10000,
  instanceLayout: getStandardInstanceLayout(2),
  dynamic: true,
});

// 创建实例化渲染器
const renderer = new InstancedRenderer(device, instanceBuffer, {
  vertexBuffer: cubeVertices,
  indexBuffer: cubeIndices,
  vertexCount: 24,
  indexCount: 36,
});

// 更新实例数据
const instanceData = new Float32Array(10000 * 20);
for (let i = 0; i < 10000; i++) {
  // 设置矩阵和颜色
  const offset = i * 20;
  matrix.toArray(instanceData, offset);
  instanceData.set([r, g, b, 1.0], offset + 16);
}
instanceBuffer.updateAll(instanceData, 10000);

// 执行渲染
renderer.draw(renderPass, 10000);
```

## 6. Technical Specifications

### Memory Layout (per instance)
- **mat4 modelMatrix**: 64 bytes (locations 2-5)
- **vec4 color**: 16 bytes (location 6)
- **Total**: 80 bytes per instance

### Performance Metrics
- **Target**: 10,000+ instances @ 60 FPS
- **GPU Memory**: ~800KB for 10,000 instances
- **CPU Update Time**: < 1ms for batch updates

### WebGL Compatibility
- **WebGL2**: Native `drawElementsInstanced` support
- **WebGL1**: Requires `ANGLE_instanced_arrays` extension
- **WebGPU**: Planned `drawIndexedIndirect` support