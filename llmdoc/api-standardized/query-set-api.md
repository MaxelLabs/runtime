---
title: 'Query Set Api'
category: 'api'
description: 'API文档: Query Set Api'
version: '1.0.0'
last_updated: '2025-12-17'
type: 'api-reference'
priority: 'high'
interfaces:
  - name: 'QuerySetApi'
    type: 'typescript'
    description: 'Query Set Api接口定义'
tags: ['api,reference,typescript']
related_docs: []
---

# Query Set Api

## 📖 概述 (Overview)

API文档: Query Set Api

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
// QuerySetApi 接口定义
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

# Query Set API 参考

## 1. Core Summary

Query Set 是 RHI 中用于 GPU 查询的资源抽象。它管理一组 WebGL Query 对象，支持遮挡查询（occlusion query）和时间戳查询（timestamp query）等 GPU 优化技术。遮挡查询可以计算通过深度测试的像素/样本数量，用于场景遮挡剔除等优化；时间戳查询用于性能分析。

## 2. Source of Truth

**接口定义**：
- `packages/specification/src/common/rhi/resources/querySet.ts` - `IRHIQuerySet` 接口规范
- `packages/specification/src/common/rhi/types.ts` - `RHIQueryType` 枚举和 `RHIQuerySetDescriptor` 描述符

**WebGL 实现**：
- `packages/rhi/src/webgl/resources/GLQuerySet.ts` - 完整的 WebGL 2.0 Query Set 实现，包括：
  - 查询对象创建和管理
  - 结果读取（同步和异步）
  - 资源生命周期管理

**RHI 设备接口**：
- `packages/specification/src/common/rhi/device.ts` - `IRHIDevice.createQuerySet()` 方法

**RHI 渲染通道接口**：
- `packages/specification/src/common/rhi/passes/renderPass.ts` - `IRHIRenderPass.beginOcclusionQuery()` 和 `endOcclusionQuery()` 方法

**WebGL 渲染通道实现**：
- `packages/rhi/src/webgl/commands/GLRenderPass.ts:96-102` - 遮挡查询的启用逻辑

## 3. API 快速参考

### 创建查询集

```typescript
const querySet = device.createQuerySet({
  type: RHIQueryType.OCCLUSION,
  count: 100,  // 创建 100 个查询对象
  label: "occlusionQueries"
});
```

### 在渲染通道中使用

```typescript
renderPass.beginOcclusionQuery(querySet, 0);  // 开始查询（索引 0）
// ... 执行绘制命令 ...
renderPass.endOcclusionQuery();               // 结束查询
```

### 读取结果

**同步读取**（可能阻塞）：
```typescript
if (querySet.isResultAvailable(0)) {
  const pixelCount = querySet.getResult(0);
  console.log(`通过测试的样本数: ${pixelCount}`);
}
```

**异步读取**（推荐，避免阻塞）：
```typescript
const pixelCount = await querySet.getResultAsync(0);
```

### 销毁资源

```typescript
querySet.destroy();
```

## 4. 支持的查询类型

| 类型 | WebGL 支持 | 说明 |
|------|-----------|------|
| `OCCLUSION` | ✅ WebGL 2.0 | 遮挡查询，返回通过的样本数 |
| `TIMESTAMP` | ⚠️ 需要扩展 | 时间戳查询，需要 EXT_disjoint_timer_query_webgl2 |
| `PIPELINE_STATISTICS` | ❌ 不支持 | WebGL 不支持此查询类型 |

## 5. 已知限制

- **WebGL 1.0**：不支持 Query Set（需要 WebGL 2.0）
- **查询延迟**：GPU 查询结果通常延迟若干帧可用，避免立即同步读取导致 GPU 阻塞
- **并发查询**：一个渲染通道中同一时刻只能进行一个遮挡查询

## 6. 性能建议

1. **异步读取结果**：优先使用 `getResultAsync()` 而不是 `getResult()`，避免阻塞 GPU
2. **批量管理查询**：复用 Query Set，通过 `reset()` 重置后重新使用，避免频繁创建销毁
3. **查询间隔**：读取查询结果时，至少间隔 2-3 帧，确保 GPU 已完成计算
4. **使用保守模式**：遮挡查询默认使用 `ANY_SAMPLES_PASSED_CONSERVATIVE`，性能更好
