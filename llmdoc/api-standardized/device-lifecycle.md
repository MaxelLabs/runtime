---
title: 'Device Lifecycle'
category: 'api'
description: 'API文档: Device Lifecycle'
version: '1.0.0'
last_updated: '2025-12-17'
type: 'api-reference'
priority: 'high'
interfaces:
  - name: 'DeviceLifecycle'
    type: 'typescript'
    description: 'Device Lifecycle接口定义'
tags: ['api,reference,typescript']
related_docs: []
---

# Device Lifecycle

## 📖 概述 (Overview)

API文档: Device Lifecycle

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
// DeviceLifecycle 接口定义
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

# WebGL 上下文生命周期管理

WebGL 设备管理上下文丢失/恢复事件并提供回调机制。

## 1. Core Summary

WebGL 上下文可能在运行时丢失（GPU 驱动崩溃、标签页后台、显存不足等），WebGLDevice 自动监听浏览器事件并提供 `DeviceState` 枚举与事件回调机制，让应用能够响应设备状态变化并在恢复时重建资源。

## 2. Source of Truth

### 主要代码
- **Device Implementation:** `src/webgl/GLDevice.ts` - WebGLDevice 类实现
  - 初始化: 行 81-108
  - 事件监听设置: 行 113-127
  - 上下文丢失处理: 行 132-138
  - 上下文恢复处理: 行 143-175
  - 销毁流程: 行 683-724
  - 公开方法: 行 181-197 (`setEventCallbacks`, `getDeviceState`, `isActive`)

- **Type Definitions:** `src/webgl/GLDevice.ts:17-39`
  - `DeviceState` 枚举
  - `DeviceEventCallbacks` 接口

- **Exports:** `src/webgl/index.ts:8` - 导出 WebGLDevice、DeviceState、DeviceEventCallbacks

### 设备状态流转

```
ACTIVE
  ├─ (上下文丢失事件) → LOST
  │                      └─ (上下文恢复事件) → ACTIVE
  │                         (若恢复失败) → DESTROYED
  │
  └─ (调用 destroy()) → DESTROYED
```

## 3. 关键方法

### 状态查询

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getDeviceState()` | `DeviceState` | 获取当前设备状态（ACTIVE/LOST/DESTROYED） |
| `isActive()` | `boolean` | 检查设备是否活跃（ACTIVE 且未销毁） |
| `checkDeviceLost()` | `Promise<void>` | 异步检查设备丢失状态，抛出异常如果丢失或销毁 |

### 事件注册

| 方法 | 签名 | 说明 |
|------|------|------|
| `setEventCallbacks()` | `setEventCallbacks(callbacks)` | 设置事件回调，支持合并模式 |

### 生命周期

| 阶段 | 触发条件 | 自动行为 | 应用需要做什么 |
|------|---------|---------|---------------|
| **初始化** | 构造函数 | 创建 GL 上下文、初始化扩展、创建追踪器、设置监听 | - |
| **正常运行** | ACTIVE 状态 | 接受命令执行 | 正常创建资源和绘制 |
| **上下文丢失** | `webglcontextlost` 事件 | 状态→LOST，调用 `onContextLost()` | 暂停渲染，释放对旧资源的引用 |
| **上下文恢复** | `webglcontextrestored` 事件 | 重新初始化 GL、清空追踪器、状态→ACTIVE | 重建所有资源，继续渲染 |
| **销毁** | 调用 `destroy()` | 销毁所有资源、移除监听、状态→DESTROYED | 清理应用级资源 |

## 4. 使用示例

### 基本初始化

```typescript
import { WebGLDevice, DeviceState, type DeviceEventCallbacks } from '@rhi/webgl';

const device = new WebGLDevice(canvas, {
  antialias: true,
  powerPreference: 'high-performance'
});

// 注册事件回调
const callbacks: DeviceEventCallbacks = {
  onContextLost() {
    console.warn('[App] WebGL 上下文丢失');
    isRunning = false;
  },
  onContextRestored() {
    console.info('[App] WebGL 上下文已恢复，正在重建资源...');
    rebuildAllResources();
    isRunning = true;
  },
  onDestroyed() {
    console.info('[App] WebGL 设备已销毁');
  }
};

device.setEventCallbacks(callbacks);
```

### 状态检查

```typescript
// 检查当前状态
const state = device.getDeviceState();
if (state === DeviceState.ACTIVE) {
  // 可以安全地创建资源和绘制
  const buffer = device.createBuffer(descriptor);
} else if (state === DeviceState.LOST) {
  // 等待恢复
  console.warn('设备离线，等待恢复...');
} else if (state === DeviceState.DESTROYED) {
  // 无法继续操作
  throw new Error('设备已销毁');
}

// 快速检查活跃状态
if (device.isActive()) {
  // 可以进行渲染操作
}
```

### 异步设备丢失检查

```typescript
async function renderFrame() {
  try {
    // 检查设备是否丢失
    await device.checkDeviceLost();

    // 执行渲染
    const encoder = device.createCommandEncoder();
    // ... 编码命令
    device.submit([encoder.finish()]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('设备')) {
      console.warn('设备状态异常，暂停渲染');
      isRunning = false;
    }
  }
}
```

### 资源重建流程

```typescript
function rebuildAllResources() {
  // 清空旧资源的强引用
  resources.clear();

  // 重新创建所有资源
  const buffer = device.createBuffer({
    size: 1024,
    usage: RHIBufferUsage.VERTEX,
    initialData: new Float32Array([...])
  });

  const texture = device.createTexture({
    width: 512,
    height: 512,
    format: RHITextureFormat.RGBA8,
    usage: RHITextureUsage.COPY_DST | RHITextureUsage.TEXTURE_BINDING
  });

  // 存储新资源引用
  resources.set('vertexBuffer', buffer);
  resources.set('colorTexture', texture);
}
```

### 优雅关闭

```typescript
function shutdown() {
  // 检查是否有资源泄漏
  const stats = device.getResourceTracker().getStats();
  if (stats.total > 0) {
    console.warn(`警告: 有 ${stats.total} 个未释放资源`);
    device.getResourceTracker().reportLeaks();
  }

  // 销毁设备（自动销毁所有资源）
  device.destroy();

  // 移除 canvas
  canvas.remove();
}
```

## 5. 常见问题

### Q: 上下文丢失时如何保存应用状态？

A: 在 `onContextLost` 回调中保存游戏/应用状态（如相机位置、模型数据等），但释放对 GPU 资源的引用。不要在此时销毁资源，因为 WebGL 不允许在上下文丢失时调用 destroy。

### Q: 上下文恢复时如何确保资源重建顺序正确？

A: 使用资源依赖图或按类型顺序重建：布局 → 着色器 → 管线 → 缓冲区/纹理 → 绑定组。避免在恢复时创建依赖关系复杂的资源。

### Q: ResourceTracker.clear() 的作用是什么？

A: 清空资源映射（使追踪器遗忘旧资源），因为上下文恢复后旧资源对象已失效，但 GPU 仍持有对应的 WebGL 句柄。新创建的资源会自动注册到追踪器。

### Q: 为什么销毁设备时需要特定的顺序？

A: WebGL 资源之间有依赖关系（如管线依赖着色器和布局）。按逆向依赖顺序销毁可避免尝试使用已销毁资源的错误。

## 6. 浏览器兼容性

| 特性 | WebGL 1.0 | WebGL 2.0 | 备注 |
|------|-----------|-----------|------|
| `webglcontextlost` 事件 | ✓ | ✓ | 所有浏览器 |
| `webglcontextrestored` 事件 | ✓ | ✓ | 所有浏览器 |
| `WEBGL_lose_context` 扩展 | ✓ | ✓ | 用于手动释放 |
| `isContextLost()` | ✓ | ✓ | 核心方法 |

## 7. 性能建议

1. **避免上下文丢失时的重同步**：缓存设备能力（特性标志、最大纹理大小等），恢复时只重建资源。
2. **使用 ResourceTracker 检测泄漏**：定期检查 `getStats()` 和 `reportLeaks()`。
3. **生产环境禁用追踪**：调用 `tracker.disable()` 避免追踪开销（如果在测试中已验证无泄漏）。
4. **分批重建资源**：避免在单帧内创建大量资源导致帧率波动。
