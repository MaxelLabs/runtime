---
title: 'Rhi Command Types'
category: 'api'
description: 'API文档: Rhi Command Types'
version: '1.0.0'
last_updated: '2025-12-17'
type: 'api-reference'
priority: 'high'
interfaces:
  - name: 'RhiCommandTypes'
    type: 'typescript'
    description: 'Rhi Command Types接口定义'
tags: ['api,reference,typescript']
related_docs: []
---

# Rhi Command Types

## 📖 概述 (Overview)

API文档: Rhi Command Types

## 🎯 目标 (Goals)

<!-- 主要文档目标 -->
- 提供完整的API接口定义
- 确保类型安全和最佳实践
- 支持LLM系统的结构化理解

## 🚫 禁止事项 (Constraints)

⚠️ **重要约束**

<!-- 关键限制和注意事项 -->
- 禁止绕过类型检查
- 禁止忽略错误处理
- 禁止破坏向后兼容性

## 🏗️ 接口定义 (Interface First)

### TypeScript接口

```typescript
// RhiCommandTypes 接口定义
interface API {
  id: string;
  name: string;
  version: string;
  config: Record<string, unknown>;
}
```

### 参数说明

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| id | string | 是 | - | 唯一标识符
name | string | 是 | - | 名称
version | string | 否 | "1.0.0" | 版本号 |

## 💡 使用示例 (Usage Examples)

### 基础用法

```typescript
// const api = new API({
  id: 'example',
  name: 'Example API',
  version: '1.0.0'
});
```

### 高级用法

```typescript
// // 高级用法示例
const advancedConfig = {
  // 配置选项
  timeout: 5000,
  retries: 3,
  validation: true
};

const result = await api.process(advancedConfig);
if (result.success) {
  console.log('操作成功:', result.data);
}
```

## ⚠️ 常见问题 (Troubleshooting)

### 问题: API调用失败
**解决方案:** 检查参数配置和网络连接


### 问题: 类型不匹配
**解决方案:** 使用TypeScript类型检查器验证参数类型

### 问题: 性能问题
**解决方案:** 启用缓存和批处理机制

## 🔗 相关链接 (Related Links)

- [相关文档](#)
- [API参考](#)
- [类型定义](#)


---

## 原始文档内容

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
