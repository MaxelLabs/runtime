---
title: 'Webgl Query Set'
category: 'api'
description: 'API文档: Webgl Query Set'
version: '1.0.0'
last_updated: '2025-12-17'
type: 'api-reference'
priority: 'high'
interfaces:
  - name: 'WebglQuerySet'
    type: 'typescript'
    description: 'Webgl Query Set接口定义'
tags: ['api,reference,typescript']
related_docs: []
---

# Webgl Query Set

## 📖 概述 (Overview)

API文档: Webgl Query Set

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
// WebglQuerySet 接口定义
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

# WebGL 查询集参考

## 1. Core Summary

WebGL 查询集是 RHI 框架在 WebGL 2.0 上的具体实现，提供了 GPU 查询功能。基于原生 WebGL Query API，支持遮挡查询和时间戳查询，并集成了资源追踪系统进行生命周期管理。

## 2. Source of Truth

**主要实现文件**：
- `packages/rhi/src/webgl/resources/GLQuerySet.ts` - WebGL 查询集的完整实现
- `packages/specification/src/common/rhi/resources/querySet.ts` - 查询集接口定义
- `packages/specification/src/common/rhi/types/enums.ts` - 查询类型枚举定义

**相关接口**：
- `packages/rhi/src/webgl/GLDevice.ts:559-566` - `createQuerySet()` 方法实现
- `packages/rhi/src/webgl/commands/GLRenderPass.ts:96-102` - 渲染通道中的查询启用逻辑

## 3. 关键特性

### WebGL 原生支持
- **遮挡查询**：WebGL 2.0 原生支持 `ANY_SAMPLES_PASSED_CONSERVATIVE`
- **时间戳查询**：需要 `EXT_disjoint_timer_query_webgl2` 扩展支持
- **管线统计**：WebGL 不支持

### 异步结果读取
- 使用轮询机制实现 `getResultAsync()`，最多等待 1 秒
- 自动处理查询结果可用性检查
- 返回 Promise，便于 async/await 使用

### 资源管理
- 自动集成 ResourceTracker 系统
- 预创建所有 Query 对象避免运行时开销
- 按依赖顺序自动销毁

## 4. 使用限制

- **WebGL 版本**：仅支持 WebGL 2.0
- **查询类型**：
  - OCCLUSION：完全支持
  - TIMESTAMP：需要扩展
  - PIPELINE_STATISTICS：不支持
- **并发限制**：同一渲染通道中只能进行一个遮挡查询
- **查询延迟**：结果通常延迟若干帧可用

## 5. 性能考虑

- 使用保守模式（CONSERVATIVE）提高性能
- 建议异步读取避免 GPU 阻塞
- 复用 Query Set 实例而非频繁创建销毁
- 读取结果时至少间隔 2-3 帧