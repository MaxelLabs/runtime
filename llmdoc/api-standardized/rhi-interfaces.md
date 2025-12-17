---
title: 'Rhi Interfaces'
category: 'api'
description: 'API文档: Rhi Interfaces'
version: '1.0.0'
last_updated: '2025-12-17'
type: 'api-reference'
priority: 'high'
interfaces:
  - name: 'RhiInterfaces'
    type: 'typescript'
    description: 'Rhi Interfaces接口定义'
tags: ['api,reference,typescript']
related_docs: []
---

# Rhi Interfaces

## 📖 概述 (Overview)

API文档: Rhi Interfaces

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
// RhiInterfaces 接口定义
interface RHIDevice {
  createBuffer(config: BufferConfig): Promise<Buffer>;
  createShader(config: ShaderConfig): Promise<Shader>;
  createPipeline(config: PipelineConfig): Promise<Pipeline>;
}
```

### 参数说明

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| config | BufferConfig | 是 | - | 缓冲区配置
width | number | 是 | - | 宽度
height | number | 是 | - | 高度 |

## 💡 使用示例 (Usage Examples)

### 基础用法

```typescript
// const device = new RHIDevice();
const buffer = await device.createBuffer({
  size: 1024,
  usage: BufferUsage.VERTEX
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

### 问题: 设备初始化失败
**解决方案:** 检查设备兼容性并正确配置上下文


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

## 查询集接口

### IRHIQuerySet 接口

**主要代码**: `specification/src/common/rhi/resources/querySet.ts`

```typescript
/**
 * RHI 查询集接口
 * 用于 GPU 查询操作，如遮挡查询
 */
export interface IRHIQuerySet {
  /** 查询类型 */
  readonly type: RHIQueryType;

  /** 查询数量 */
  readonly count: number;

  /**
   * 检查指定查询的结果是否可用
   * @param queryIndex - 查询索引
   * @returns 结果是否可用
   */
  isResultAvailable(queryIndex: number): boolean;

  /**
   * 同步获取查询结果
   * 阻塞直到结果可用
   * @param queryIndex - 查询索引
   * @returns 查询结果
   */
  getResult(queryIndex: number): number;

  /**
   * 异步获取查询结果
   * @param queryIndex - 查询索引
   * @returns Promise 返回查询结果
   */
  getResultAsync(queryIndex: number): Promise<number>;

  /**
   * 重置指定的查询
   * @param queryIndex - 查询索引
   */
  reset(queryIndex: number): void;

  /**
   * 销毁查询集资源
   */
  destroy(): void;
}
```

### RHIQueryType 枚举

```typescript
/**
 * 查询类型
 */
export enum RHIQueryType {
  /** 遮挡查询 - 查询有多少个像素通过深度测试 */
  OCCLUSION = 'OCCLUSION',

  /** 时间戳查询 - 记录 GPU 时间戳 */
  TIMESTAMP = 'TIMESTAMP',

  /** 流统计查询 - 查询顶点/图元流的统计信息 */
  PIPELINE_STATISTICS = 'PIPELINE_STATISTICS'
}
```

### RHIQuerySetDescriptor 类型

```typescript
/**
 * 查询集描述符
 */
export interface RHIQuerySetDescriptor {
  /** 查询类型 */
  type: RHIQueryType;

  /** 查询数量 */
  count: number;

  /** 查询集标签（用于调试） */
  label?: string;
}
```

### 设备上的查询集方法

在 `IRHIDevice` 中添加以下方法：

```typescript
/**
 * 创建查询集
 * @param descriptor - 查询集描述符
 * @returns 查询集接口
 */
createQuerySet(descriptor: RHIQuerySetDescriptor): IRHIQuerySet;
```

### 渲染通道上的查询方法

在 `IRHIRenderPass` 中添加以下方法：

```typescript
/**
 * 开始遮挡查询
 * @param querySet - 查询集
 * @param queryIndex - 查询索引
 */
beginOcclusionQuery(querySet: IRHIQuerySet, queryIndex: number): void;

/**
 * 结束当前遮挡查询
 */
endOcclusionQuery(): void;
```

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