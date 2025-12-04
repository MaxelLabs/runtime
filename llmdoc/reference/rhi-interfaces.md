# RHI 接口参考

## 核心摘要

本参考文档提供了 RHI 抽象层的关键接口定义，包括硬件渲染器、平台资源和核心组件的接口规范。这些接口定义了上层应用与底层图形实现之间的契约，确保了系统的可扩展性和可维护性。

## 源代码定义

### 硬件渲染器接口

**主要代码**: `temp/engine/packages/design/src/renderingHardwareInterface/IHardwareRenderer.ts`

```typescript
/**
 * 硬件图形 API 渲染器接口
 */
export interface IHardwareRenderer {
  // todo: implements
  [key: string]: any;
}
```

### 平台图元接口

**主要代码**: `temp/engine/packages/design/src/renderingHardwareInterface/IPlatformPrimitive.ts`

定义图元的渲染接口，包括顶点数组和绘制方法。

### 平台纹理接口

**主要代码**: `temp/engine/packages/core/src/renderingHardwareInterface/IPlatformTexture.ts`

```typescript
export interface IPlatformTexture {
  /** 纹理 S 坐标包装模式 */
  wrapModeU: TextureWrapMode;

  /** 纹理 T 坐标包装模式 */
  wrapModeV: TextureWrapMode;

  /** 纹理过滤模式 */
  filterMode: TextureFilterMode;

  /** 各向异性等级 */
  anisoLevel: number;

  /** 深度比较函数（当纹理作为深度纹理时） */
  depthCompareFunction: TextureDepthCompareFunction;

  /** 销毁纹理 */
  destroy(): void;

  /** 基于 0 级数据生成多级纹理 */
  generateMipmaps(): void;

  /** 设置深度比较模式 */
  setUseDepthCompareMode(value: boolean);
}
```

### 平台缓冲区接口

**主要代码**: `temp/engine/packages/core/src/renderingHardwareInterface/IPlatformBuffer.ts`

```typescript
export interface IPlatformBuffer {
  /** 绑定缓冲区 */
  bind(): void;

  /** 设置缓冲区数据 */
  setData(
    byteLength: number,
    data: ArrayBuffer | ArrayBufferView,
    bufferByteOffset?: number,
    dataOffset?: number,
    dataLength?: number,
    options?: SetDataOptions
  ): void;

  /** 获取缓冲区数据 */
  getData(data: ArrayBufferView, bufferByteOffset?: number, dataOffset?: number, dataLength?: number): void;

  /** 销毁缓冲区 */
  destroy(): void;
}
```

### 平台渲染目标接口

**主要代码**: `temp/engine/packages/core/src/renderingHardwareInterface/IPlatformRenderTarget.ts`

定义渲染目标的接口，包括帧缓冲区和附件管理。

### 平台纹理 2D 接口

**主要代码**: `temp/engine/packages/core/src/renderingHardwareInterface/IPlatformTexture2D.ts`

定义 2D 纹理的接口，支持基本纹理操作。

### 平台纹理数组接口

**主要代码**: `temp/engine/packages/core/src/renderingHardwareInterface/IPlatformTexture2DArray.ts`

定义 2D 纹理数组的接口，支持实例化渲染。

### 平台立方体贴图接口

**主要代码**: `temp/engine/packages/core/src/renderingHardwareInterface/IPlatformTextureCube.ts`

定义立方体贴图的接口，支持环境贴图和天空盒。

## WebGL 实现特有接口

### WebGL 图形设备选项

**配置文件**: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts`

```typescript
export interface WebGLGraphicDeviceOptions extends WebGLContextAttributes {
  /** WebGL 模式 */
  webGLMode?: WebGLMode;

  /** iOS 15 WebGL 实现修复，强制调用 flush 命令缓冲区 */
  _forceFlush?: boolean;

  /** 最大允许蒙皮 uniform 向量数，默认 256 */
  _maxAllowSkinUniformVectorCount?: number;
}
```

### WebGL 模式枚举

**枚举定义**: `temp/engine/packages/rhi-webgl/src/WebGLGraphicDevice.ts:43-50`

```typescript
export enum WebGLMode {
  /** 自动模式，优先使用 WebGL 2.0，否则降级到 WebGL 1.0 */
  Auto = 0,
  /** 强制使用 WebGL 2.0 */
  WebGL2 = 1,
  /** 强制使用 WebGL 1.0 */
  WebGL1 = 2
}
```

## 相关架构文档

- **RHI 架构概述**: `/llmdoc/architecture/rhi-architecture.md`
- **WebGL 实现细节**: `/llmdoc/architecture/webgl-implementation.md`
- **使用指南**: `/llmdoc/guides/using-rhi.md`
- **WebGL 命令指南**: `/llmdoc/guides/webgl-commands.md`