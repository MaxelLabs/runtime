# WebGL 实现细节

## 1. Identity

**WebGL 实现** 是 RHI 抽象层的 WebGL 具体实现，负责将抽象的图形调用转换为实际的 WebGL API 调用。

**Purpose**: 提供高性能的 WebGL 渲染能力，支持现代 3D 图形特性，并处理平台差异和兼容性问题。

## 2. 核心组件

- `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts` (`WebGLGraphicDevice`): 核心 WebGL 图形设备实现
- `temp/engine/packages/rhi-webgl/src/WebGLGraphicDeviceOptions` (`WebGLGraphicDeviceOptions`): WebGL 设备配置接口
- `temp/engine/packages/rhi-webgl/src/WebGLMode` (`WebGLMode`): WebGL 版本控制枚举
- `temp/engine/packages/rhi-webgl/src/WebCanvas.ts` (`WebCanvas`): Web Canvas 封装
- `temp/engine/packages/rhi-webgl/src/GLExtensions.ts` (`GLExtensions`): WebGL 扩展管理器
- `temp/engine/packages/rhi-webgl/src/GLCapability.ts` (`GLCapability`): 硬件特性检测
- `temp/engine/packages/rhi-webgl/src/GLRenderStates.ts` (`GLRenderStates`): 渲染状态管理
- `temp/engine/packages/rhi-webgl/src/GLPrimitive.ts` (`GLPrimitive`): 图元渲染实现
- `temp/engine/packages/rhi-webgl/src/GLBuffer.ts` (`GLBuffer`): 缓冲区实现
- `temp/engine/packages/rhi-webgl/src/GLTexture.ts` (`GLTexture`): 纹理基类实现
- `temp/engine/packages/rhi-webgl/src/GLTexture2D.ts` (`GLTexture2D`): 2D 纹理实现
- `temp/engine/packages/rhi-webgl/src/GLTextureCube.ts` (`GLTextureCube`): 立方体贴图实现
- `temp/engine/packages/rhi-webgl/src/GLTexture2DArray.ts` (`GLTexture2DArray`): 纹理数组实现
- `temp/engine/packages/rhi-webgl/src/GLRenderTarget.ts` (`GLRenderTarget`): 渲染目标实现

## 3. 关键实现细节

### 3.1 上下文管理 (`WebGLGraphicDevice.ts:168-211`)
```typescript
init(canvas: Canvas, onDeviceLost: () => void, onDeviceRestored: () => void): void {
  // 自动检测 WebGL 2.0/1.0 支持
  if (webGLMode == WebGLMode.Auto || webGLMode == WebGLMode.WebGL2) {
    gl = webCanvas.getContext("webgl2", options);
    this._isWebGL2 = true;
  }

  // 降级到 WebGL 1.0
  if (!gl) {
    gl = webCanvas.getContext("webgl", options);
    this._isWebGL2 = false;
  }
}
```

### 3.2 纹理管理
- **GLTexture**: 纹理基类，处理通用的纹理操作
- **GLTexture2D**: 2D 纹理实现，支持多种压缩格式
- **GLTextureCube**: 立方体贴图实现，用于环境贴图
- **GLTexture2DArray**: 纹理数组实现，支持实例化渲染

### 3.3 缓冲区管理 (`GLBuffer.ts`)
- 支持顶点缓冲区和索引缓冲区
- 提供动态和静态缓冲区创建选项
- 实现高效的内存管理和数据传输

### 3.4 图元渲染 (`GLPrimitive.ts`)
- **VAO 支持**: 自动检测和使用顶点数组对象
- **实例化渲染**: 支持实例化绘制扩展
- **图元类型**: 支持点、线、三角形等基本图元

### 3.5 渲染状态管理 (`GLRenderStates.ts`)
- 混合状态管理
- 深度测试配置
- 模板测试设置
- 视口和裁剪区域管理

### 3.6 扩展管理 (`GLExtensions.ts`)
```typescript
requireExtension(ext) {
  return this._extensions.requireExtension(ext);
}
```
- 自动检测和加载 WebGL 扩展
- 提供扩展可用性检查
- 统一的扩展接口管理

### 3.7 设备状态恢复
```typescript
private _onWebGLContextLost(event: WebGLContextEvent) {
  event.preventDefault();
  this._onDeviceLost();
}

private _onWebGLContextRestored(event: WebGLContextEvent) {
  this._onDeviceRestored();
}
```
- 监听上下文丢失事件
- 自动触发设备丢失和恢复回调
- 重置所有渲染状态

## 4. 性能优化策略

### 4.1 状态缓存
- 视口状态缓存，避免重复设置
- 活动纹理跟踪，减少纹理绑定操作
- 清除颜色缓存，优化渲染性能

### 4.2 批量处理
- 纹理单元的批量管理
- 状态变更的批量化处理
- 减少状态切换的开销

### 4.3 内存管理
- 智能的资源释放机制
- 避免内存泄漏的防护措施
- iOS 特殊优化，强制刷新命令缓冲区