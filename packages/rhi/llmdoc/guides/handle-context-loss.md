# 如何处理 WebGL 上下文丢失和资源恢复

本指南展示如何正确使用 WebGLDevice 的上下文恢复和资源追踪功能。

## 前置条件

- 已创建 `WebGLDevice` 实例
- 理解 RHI 接口基础（缓冲区、纹理、管线等）

## 步骤 1：设置事件回调处理上下文丢失

在初始化 WebGL 设备后，立即注册事件回调：

```typescript
import { WebGLDevice, type DeviceEventCallbacks } from '@rhi/webgl';

const device = new WebGLDevice(canvas);

const callbacks: DeviceEventCallbacks = {
  onContextLost() {
    console.warn('[App] 检测到 WebGL 上下文丢失');
    // 暂停应用逻辑
    appState.isRunning = false;
  },
  onContextRestored() {
    console.info('[App] WebGL 上下文已恢复，开始重建资源');
    // 重建所有 GPU 资源
    rebuildGPUResources();
    // 恢复应用逻辑
    appState.isRunning = true;
  }
};

device.setEventCallbacks(callbacks);
```

参考：`src/webgl/GLDevice.ts:181-183`（`setEventCallbacks` 方法）

## 步骤 2：组织资源管理代码，便于恢复时重建

将资源创建逻辑提取为可复用的函数：

```typescript
class ResourceManager {
  private device: WebGLDevice;
  private resources: Map<string, any> = new Map();

  constructor(device: WebGLDevice) {
    this.device = device;
    // 监听上下文恢复事件
    device.setEventCallbacks({
      onContextRestored: () => this.rebuild()
    });
  }

  createBuffer(name: string, descriptor: RHIBufferDescriptor) {
    const buffer = this.device.createBuffer(descriptor);
    this.resources.set(name, buffer);
    return buffer;
  }

  createTexture(name: string, descriptor: RHITextureDescriptor) {
    const texture = this.device.createTexture(descriptor);
    this.resources.set(name, texture);
    return texture;
  }

  // 重建所有资源
  private rebuild() {
    const resourceList = Array.from(this.resources.entries());
    this.resources.clear();

    for (const [name, oldResource] of resourceList) {
      // 根据资源类型重建
      if (isBuffer(oldResource)) {
        this.createBuffer(name, getBufferDescriptor(name));
      } else if (isTexture(oldResource)) {
        this.createTexture(name, getTextureDescriptor(name));
      }
    }
  }
}
```

参考：`src/webgl/GLDevice.ts:469-575`（各 `create*` 方法）

## 步骤 3：定期检查设备状态

在渲染循环中检查设备状态，避免操作已销毁的设备：

```typescript
async function renderFrame() {
  try {
    // 检查设备是否丢失或销毁
    await device.checkDeviceLost();

    // 检查快速状态
    if (!device.isActive()) {
      console.warn('设备离线，跳过此帧');
      return;
    }

    // 执行正常的渲染
    const encoder = device.createCommandEncoder();
    // ... 编码渲染命令
    device.submit([encoder.finish()]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('已丢失')) {
      // 上下文已丢失，会自动通过 onContextLost 回调通知
      console.log('等待上下文恢复...');
    }
  }
}
```

参考：`src/webgl/GLDevice.ts:658-672`（`checkDeviceLost` 方法）

## 步骤 4：使用 ResourceTracker 检测泄漏

定期检查资源泄漏，确保没有遗漏销毁的资源：

```typescript
function checkForResourceLeaks() {
  const tracker = device.getResourceTracker();
  const stats = tracker.getStats();

  console.log(`已创建资源数: ${stats.total}`);
  console.log(`各类型资源:`);
  for (const [type, count] of Object.entries(stats.byType)) {
    if (count > 0) {
      console.log(`  - ${type}: ${count}`);
    }
  }

  // 如果有资源泄漏，输出详细报告
  if (stats.total > 0) {
    console.warn('检测到资源泄漏!');
    tracker.reportLeaks();  // 输出详细信息
  }
}

// 在应用退出前检查
window.addEventListener('beforeunload', () => {
  checkForResourceLeaks();
});
```

参考：`src/webgl/utils/ResourceTracker.ts:141-165, 253-281`（`getStats` 和 `reportLeaks` 方法）

## 步骤 5：正确销毁设备和资源

应用关闭时，按正确的顺序销毁所有资源：

```typescript
function shutdown() {
  console.info('[App] 应用关闭，清理资源');

  // 1. 检查是否有未释放的资源
  const stats = device.getResourceTracker().getStats();
  if (stats.total > 0) {
    console.warn(`警告: ${stats.total} 个资源未手动释放，将由设备自动销毁`);
  }

  // 2. 销毁设备（自动销毁所有追踪的资源）
  device.destroy();

  // 3. 清理 DOM
  canvas.remove();

  console.info('[App] 资源清理完成');
}

// 注册全局关闭处理
window.addEventListener('unload', shutdown);
```

参考：`src/webgl/GLDevice.ts:683-724`（`destroy` 方法）

## 步骤 6（可选）：手动取消注册资源

如果需要在设备继续运行时手动销毁某个资源，调用：

```typescript
// 手动销毁一个缓冲区
buffer.destroy();

// 或者用设备的方法手动取消注册
device.unregisterResource(buffer);
```

参考：`src/webgl/GLDevice.ts:731-733`（`unregisterResource` 方法）

## 验证完成

你已成功实现了：
- 自动上下文丢失/恢复处理 ✓
- 资源泄漏检测 ✓
- 优雅的应用退出流程 ✓

测试方法：
1. 在浏览器开发者工具中模拟 WebGL 上下文丢失（使用 `WEBGL_lose_context` 扩展）
2. 验证应用在 `onContextLost` 回调中正确暂停
3. 验证资源在 `onContextRestored` 中正确重建
4. 调用 `reportLeaks()` 确认无资源泄漏
