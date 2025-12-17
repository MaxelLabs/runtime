---
title: 'Resource Tracker Api'
category: 'api'
description: 'API文档: Resource Tracker Api'
version: '1.0.0'
last_updated: '2025-12-17'
type: 'api-reference'
priority: 'high'
interfaces:
  - name: 'ResourceTrackerApi'
    type: 'typescript'
    description: 'Resource Tracker Api接口定义'
tags: ['api,reference,typescript']
related_docs: []
---

# Resource Tracker Api

## 📖 概述 (Overview)

API文档: Resource Tracker Api

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
// ResourceTrackerApi 接口定义
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

# ResourceTracker API 参考

ResourceTracker 提供全局资源生命周期管理和泄漏检测。

## 1. Core Summary

ResourceTracker 是 WebGL 设备的资源追踪器，自动跟踪所有通过 `Device.create*()` 创建的资源。它支持按依赖顺序销毁资源、检测资源泄漏，并提供详细的统计信息。

## 2. Source of Truth

### 主要代码
- **Primary Code:** `src/webgl/utils/ResourceTracker.ts` - ResourceTracker 类定义、ResourceType 枚举、ResourceStats 接口
- **Device Integration:** `src/webgl/GLDevice.ts:60-61, 104, 167, 202-204` - 设备中的追踪器初始化、资源注册点、销毁流程
- **Exports:** `src/webgl/index.ts:7, 15` - 公开导出 ResourceTracker、ResourceType

### 关键方法

#### 资源管理

| 方法 | 签名 | 说明 |
|------|------|------|
| `register()` | `register(resource, type)` | 注册资源，自动由 `Device.create*()` 调用 |
| `unregister()` | `unregister(resource)` | 取消注册资源，资源销毁时自动调用 |
| `isRegistered()` | `isRegistered(resource)` | 检查资源是否已注册 |

#### 销毁和清理

| 方法 | 签名 | 说明 |
|------|------|------|
| `destroyAll()` | `destroyAll(silent?)` | 按依赖顺序销毁所有资源，返回销毁数量 |
| `clear()` | `clear()` | 清空所有记录（不销毁资源），用于上下文恢复 |

#### 查询和诊断

| 方法 | 签名 | 说明 |
|------|------|------|
| `getStats()` | `getStats()` | 返回 `ResourceStats` 统计信息 |
| `getResources()` | `getResources(type?)` | 获取所有资源或指定类型的资源列表 |
| `reportLeaks()` | `reportLeaks()` | 输出详细的泄漏报告到控制台 |

#### 启用/禁用

| 方法 | 签名 | 说明 |
|------|------|------|
| `enable()` | `enable()` | 启用追踪 |
| `disable()` | `disable()` | 禁用追踪（生产环境优化） |
| `isEnabled()` | `isEnabled()` | 检查追踪是否启用 |

### ResourceType 枚举

```
BUFFER              - 缓冲区
TEXTURE             - 纹理
SAMPLER             - 采样器
SHADER              - 着色器模块
PIPELINE            - 渲染/计算管线
BIND_GROUP          - 绑定组
BIND_GROUP_LAYOUT   - 绑定组布局
PIPELINE_LAYOUT     - 管线布局
QUERY_SET           - 查询集
COMMAND_ENCODER     - 命令编码器
OTHER               - 其他类型（默认）
```

### ResourceStats 接口

```typescript
interface ResourceStats {
  byType: Record<ResourceType, number>  // 各类型资源数量
  total: number                         // 总资源数量
  potentialLeaks: number                // 潜在泄漏数量（当前等于 total）
}
```

### DeviceState 枚举

```
ACTIVE      - 设备正常运行
LOST        - 上下文已丢失，等待恢复
DESTROYED   - 设备已销毁
```

### DeviceEventCallbacks 接口

```typescript
interface DeviceEventCallbacks {
  onContextLost?: () => void      // 上下文丢失时调用
  onContextRestored?: () => void  // 上下文恢复时调用
  onDestroyed?: () => void        // 设备销毁时调用
}
```

## 3. 使用示例

### 基本使用（自动）

```typescript
const device = new WebGLDevice(canvas);

// 资源自动注册
const buffer = device.createBuffer(descriptor);
const texture = device.createTexture(descriptor);

// 检查统计
const stats = device.getResourceTracker().getStats();
console.log(`已创建资源: ${stats.total}`);
```

### 手动查询

```typescript
const tracker = device.getResourceTracker();

// 获取统计信息
const stats = tracker.getStats();
console.log(`缓冲区: ${stats.byType.buffer}`);
console.log(`纹理: ${stats.byType.texture}`);

// 检测泄漏
if (stats.total > 0) {
  tracker.reportLeaks();
}

// 获取特定类型资源
const allBuffers = tracker.getResources(ResourceType.BUFFER);
```

### 上下文恢复处理

```typescript
device.setEventCallbacks({
  onContextLost: () => {
    console.warn('上下文丢失，停止渲染');
    isPaused = true;
  },
  onContextRestored: () => {
    console.info('上下文恢复，重建资源');
    // 重新创建所有资源
    rebuildResources();
    isPaused = false;
  },
  onDestroyed: () => {
    console.info('设备已销毁');
  }
});
```

### 设备销毁

```typescript
// 销毁设备（自动销毁所有资源）
device.destroy();

// 或手动销毁特定资源
buffer.destroy();  // 自动从追踪器中移除
```

## 4. 设计决策

### 资源销毁顺序

按以下顺序销毁以避免依赖关系错误：
1. 命令编码器 - 可能引用其他资源
2. 绑定组 - 依赖绑定组布局
3. 管线 - 依赖管线布局和着色器
4. 布局 - 基础结构
5. 查询集、着色器 - 独立资源
6. 采样器、纹理 - 基础资源
7. 缓冲区 - 最基础资源
8. 其他

### 上下文恢复时的清理策略

- 调用 `tracker.clear()` 清空映射（旧资源对象失效但仍存在）
- 应用在 `onContextRestored` 回调中重建所有资源
- 新创建的资源自动注册到新的追踪上下文中

### 性能考虑

- 追踪器使用 `Map<Resource, ResourceType>` 实现，注册/注销为 O(1) 操作
- 可通过 `disable()` 在生产环境禁用追踪以避免开销
- 泄漏检测仅在 `destroy()` 或手动调用 `reportLeaks()` 时执行
