# RHI 命令类型参考

## 1. 核心摘要

RHI 命令类型系统提供了完整的类型安全的命令参数定义，用于替代 `any` 类型在 WebGL 命令缓冲区中的使用。该系统定义了 16 个命令参数接口和相应的辅助类型，支持从渲染管线设置到资源复制的全流程命令编码。

## 2. 源代码定义

**主要代码**: `packages/specification/src/common/rhi/types/commands.ts` - 完整的命令类型定义（约 350 行）

**导出位置**: `packages/specification/src/common/rhi/types/index.ts`

**使用位置**:
- `packages/rhi/src/webgl/commands/GLCommandBuffer.ts:1-32` - WebGL 命令缓冲区实现
- `packages/rhi/src/webgl/commands/GLCommandEncoder.ts:1-14` - WebGL 命令编码器实现

## 3. 命令类型分类

### 3.1 核心命令类型 (16 种)

| 命令类型 | 参数接口 | 用途 |
|---------|---------|------|
| `beginRenderPass` | `RHIBeginRenderPassParams` | 开始渲染通道，定义附件配置 |
| `endRenderPass` | 无参数 | 结束渲染通道 |
| `draw` | `RHIDrawParams` | 绘制顶点数据（非索引） |
| `drawIndexed` | `RHIDrawIndexedParams` | 使用索引缓冲区绘制 |
| `copyBufferToBuffer` | `RHICopyBufferToBufferParams` | 缓冲区到缓冲区复制 |
| `copyBufferToTexture` | `RHICopyBufferToTextureParams` | 缓冲区到纹理复制（数据上传） |
| `copyTextureToBuffer` | `RHICopyTextureToBufferParams` | 纹理到缓冲区复制（数据读回） |
| `copyTextureToTexture` | `RHICopyTextureToTextureParams` | 纹理到纹理复制（MIP/格式处理） |
| `copyTextureToCanvas` | `RHICopyTextureToCanvasParams` | 纹理到 Canvas 复制（屏幕截图） |
| `setViewport` | `RHISetViewportParams` | 设置视口裁剪和深度范围 |
| `setScissor` | `RHISetScissorParams` | 设置像素级裁剪矩形 |
| `setPipeline` | `RHISetPipelineParams` | 切换渲染管线和着色器 |
| `setBindGroup` | `RHISetBindGroupParams` | 绑定 Uniform 缓冲区和纹理采样器 |
| `setVertexBuffers` | `RHISetVertexBuffersParams` | 设置顶点缓冲区列表 |
| `setIndexBuffer` | `RHISetIndexBufferParams` | 绑定索引缓冲区 |
| `custom` | `RHICustomCommandParams` | 执行自定义 WebGL 操作 |

### 3.2 附加支持类型

**附件描述**:
- `RHIColorAttachmentParams` - 颜色附件（view, resolveTarget, loadOp, storeOp, clearColor）
- `RHIDepthStencilAttachmentParams` - 深度模板附件（深度/模板加载存储操作）

**缓冲区相关**:
- `RHIBufferCopySource` - 源缓冲区描述（buffer, offset, bytesPerRow）
- `RHIBufferCopyDestination` - 目标缓冲区描述（buffer, offset, bytesPerRow）
- `RHICommandVertexBufferBinding` - 顶点缓冲区绑定（buffer, offset）

**纹理相关**:
- `RHITextureCopySource` - 源纹理描述（texture, mipLevel, origin）
- `RHITextureCopyDestination` - 目标纹理描述（texture, mipLevel, origin）

## 4. 命令对象类型系统

**RHICommandType** - 16 种命令的字符串字面量联合类型

**RHICommand** - 完整的命令对象接口：
```typescript
interface RHICommand {
  type: RHICommandType;
  params: RHICommandParams;
}
```

**RHICommandParams** - 所有命令参数的联合类型（用于类型检查）

**RHICommandParamsMap** - 命令类型到参数类型的映射表（支持高级类型推断和泛型编程）

## 5. 关键集成点

1. **类型安全**: 完全移除 `any` 类型，提供编译时类型检查
2. **IDE 支持**: 自动完成和类型提示加强开发效率
3. **文档化**: 每个参数都有详细的 JSDoc 注释
4. **可维护性**: 集中定义确保所有实现的一致性
5. **扩展性**: `RHICommandParamsMap` 支持高级类型推断和泛型编程

## 7. 相关文档

- **[RHI 接口参考](./rhi-interfaces.md)** - RHI 核心接口定义
- **[WebGL 实现细节](../architecture/webgl-implementation.md)** - 命令执行的具体实现
- **[RHI 架构](../architecture/rhi-architecture.md)** - RHI 设计原理
- **[编码约定](./coding-conventions.md)** - 类型系统最佳实践
