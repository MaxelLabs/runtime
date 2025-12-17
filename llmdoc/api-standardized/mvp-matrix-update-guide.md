---
title: 'Mvp Matrix Update Guide'
category: 'api'
description: 'API文档: Mvp Matrix Update Guide'
version: '1.0.0'
last_updated: '2025-12-17'
type: 'api-reference'
priority: 'high'
interfaces:
  - name: 'MvpMatrixUpdateGuide'
    type: 'typescript'
    description: 'Mvp Matrix Update Guide接口定义'
tags: ['api,reference,typescript']
related_docs: []
---

# Mvp Matrix Update Guide

## 📖 概述 (Overview)

API文档: Mvp Matrix Update Guide

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
// MvpMatrixUpdateGuide 接口定义
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

# MVP 矩阵更新指南

## 1. 核心摘要

本次更新为 RHI Demo 系统引入了完整的 Model-View-Projection (MVP) 矩阵变换管线，取代了之前的固定管线渲染。所有 Demo 现在都支持动态相机控制，通过 OrbitController 实现旋转、缩放和平移交互。更新主要涉及着色器修改、Uniform 缓冲区创建和渲染循环中的矩阵计算。

## 2. 更新详情

### 技术变更

#### 2.1 着色器更新

**顶点着色器增强**：
```glsl
// 添加 Transforms uniform 块
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

// 使用 MVP 矩阵变换
void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
```

#### 2.2 Uniform 缓冲区管理

**创建动态缓冲区**：
```typescript
// 256 字节缓冲区（3个 mat4，std140 对齐）
const transformBuffer = runner.track(
  runner.device.createBuffer({
    size: 256,
    usage: MSpec.RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Transform Uniform Buffer',
  })
);
```

**绑定组配置**：
```typescript
const bindGroupLayout = runner.track(
  runner.device.createBindGroupLayout([
    {
      binding: 0,
      visibility: MSpec.RHIShaderStage.VERTEX,
      buffer: { type: 'uniform' },
      name: 'Transforms',
    },
  ], 'Transform BindGroup Layout')
);
```

#### 2.3 矩阵更新流程

**渲染循环中的矩阵更新**：
```typescript
runner.start((dt) => {
  // 1. 更新相机控制
  orbit.update(dt);

  // 2. 获取变换矩阵
  const viewMatrix = orbit.getViewMatrix();
  const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

  // 3. 更新 Uniform 数据
  const transformData = new Float32Array(64);
  transformData.set(modelMatrix.toArray(), 0);    // Model
  transformData.set(viewMatrix, 16);                // View
  transformData.set(projMatrix, 32);              // Projection
  transformBuffer.update(transformData, 0);

  // 4. 执行渲染
  // ...
});
```

### 必需导入更新

所有 Demo 必须导入 MMath 和相关组件：
```typescript
import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

// 创建模型矩阵
const modelMatrix = new MMath.Matrix4();
```

### 影响的文件

#### Demo 源文件
- `packages/rhi/demo/src/triangle.ts`
- `packages/rhi/demo/src/quad-indexed.ts`
- `packages/rhi/demo/src/primitive-types.ts`
- `packages/rhi/demo/src/viewport-scissor.ts`
- `packages/rhi/demo/src/blend-modes.ts`

#### HTML 文件
- `packages/rhi/demo/html/*.html`

#### 配置文件
- `packages/rhi/demo/index.html`（可能需要更新）

## 3. 实现细节

### 3.1 矩阵布局规范

使用 std140 布局：
- 每个矩阵占用 64 字节（4×4 float32）
- 矩阵按列主序存储
- 总大小：3 × 64 = 192 字节（对齐到 256 字节）

### 3.2 相机集成要求

每个 Demo 必须遵循相机集成模式：
1. 初始化 OrbitController
2. 渲染循环中更新相机状态
3. 获取视图和投影矩阵
4. 正确销毁控制器实例

### 3.3 性能考虑

- Uniform 缓冲区标记为 'dynamic'，适合频繁更新
- 每帧更新整个缓冲区，便于扩展
- 矩阵计算在 JavaScript 端进行，利用 JIT 优化

## 4. 迁移指南

### 从固定管线迁移

**原流程**：
```typescript
// 直接设置顶点位置
gl_Position = vec4(aPosition, 1.0);
```

**新流程**：
```typescript
// 1. 添加 MVP 矩阵计算
const modelMatrix = new MMath.Matrix4();
const viewMatrix = orbit.getViewMatrix();
const projMatrix = orbit.getProjectionMatrix(aspect);

// 2. 更新 Uniform 缓冲区
transformBuffer.update(transformData, 0);

// 3. 着色器自动使用 MVP 变换
```

### 新增 Demo 规范

所有新 Demo 必须：
1. 包含 MVP 矩阵初始化代码
2. 集成 OrbitController
3. 遵循统一的渲染循环结构
4. 正确处理资源清理

## 5. 相关文档

- [OrbitController API 参考](/packages/rhi/llmdoc/reference/orbit-controller.md)
- [RHI Demo 开发指南](/packages/rhi/llmdoc/guides/demo-development.md)
- [MVP 矩阵实现架构](/llmdoc/architecture/mvp-matrix-implementation.md)
- [MMath 类型参考](/reference/math-type-reference.md)

## 6. 后续计划

1. **模型动画支持**：扩展 modelMatrix 支持模型级变换
2. **多相机系统**：支持分屏和画中画效果
3. **优化策略**：实现矩阵变换的增量更新
4. **调试工具**：添加矩阵可视化调试面板