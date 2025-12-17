---
title: Blend Modes Demo
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: demo
tags: ['guide', 'llm-native', 'demo', 'demo-developers', 'code-examples', 'step-by-step']
target_audience: demo-developers
complexity: intermediate
estimated_time: f"46 分钟"
last_updated: 2025-12-17
llm_native_compliance: true
version: 1.0.0
---


## 🎯 Context & Goal

### Context
本文档属于**demo**类型的开发指南，面向**demo-developers**。

### Goal
帮助开发者快速理解和掌握相关概念、工具和最佳实践，提高开发效率和代码质量。

### Prerequisites
- 基础的编程知识
- 了解项目架构和基本概念
- 相关领域的开发经验

---

# 混合模式 Demo 参考

本文档提供了混合模式 Demo 的完整实现参考，展示了如何使用 RHI 实现各种图形混合效果。

## 1. Demo 概述

**文件位置**: `packages/rhi/demo/src/blend-modes.ts`

### 功能特性

- 支持 7 种混合模式：None、Alpha、Additive、Multiply、Screen、Subtract、Premultiplied Alpha
- 纹理渲染（Caravaggio 水果图片）
- 完整的 MVP 矩阵变换支持
- 交互式 GUI 控制面板
- 键盘快捷键切换（1-7 数字键）
- 动画颜色效果
- Stats 性能监控

### 混合模式详情

| 模式 | 描述 | 混合配置 |
|------|------|----------|
| None | 禁用混合，完全覆盖 | `blendEnabled: false` |
| Alpha | 标准透明度混合 | `SrcAlpha, OneMinusSrcAlpha` |
| Additive | 加法混合，颜色叠加 | `SrcAlpha, One` |
| Multiply | 乘法混合，颜色相乘 | `DstColor, Zero` |
| Screen | 屏幕混合，反向相乘 | `One, OneMinusSrcColor` |
| Subtract | 减法混合，颜色相减 | `SrcAlpha, One, REVERSE_SUBTRACT` |
| Premultiplied | 预乘Alpha混合 | `One, OneMinusSrcAlpha` |

## 2. 核心实现

### 2.1 着色器实现

#### 顶点着色器

```glsl
#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform VertexUniforms {
  vec2 uOffset;
  vec2 uScalePadding;
};

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec2 vTexCoord;

void main() {
  float uScale = uScalePadding.x;
  vec2 scaledPos = aPosition * uScale;
  vec4 worldPosition = uModelMatrix * vec4(scaledPos + uOffset, 0.0, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vTexCoord = aTexCoord;
}
```

#### 片段着色器

```glsl
#version 300 es
precision mediump float;

uniform FragmentUniforms {
  vec4 uColor;
};

uniform sampler2D uTexture;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  fragColor = texColor * uColor;
}
```

### 2.2 MVP 矩阵变换

```typescript
// 创建模型矩阵
const modelMatrix = new MMath.Matrix4();

// 渲染循环中更新
runner.start((dt) => {
  orbit.update(dt);

  // 获取视图和投影矩阵
  const viewMatrix = orbit.getViewMatrix();
  const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

  // 更新 Uniform 缓冲区
  const transformData = new Float32Array(64);
  transformData.set(modelMatrix.toArray(), 0);
  transformData.set(viewMatrix, 16);
  transformData.set(projMatrix, 32);
  transformBuffer.update(transformData, 0);
});
```

### 2.3 管线缓存实现

```typescript
// 创建管线缓存，支持不同混合模式
const pipelines: Map<string, MSpec.IRHIRenderPipeline> = new Map();

const getOrCreatePipeline = (mode: string): MSpec.IRHIRenderPipeline => {
  if (!pipelines.has(mode)) {
    const config = BLEND_MODES[mode];
    const pipeline = runner.device.createRenderPipeline({
      vertexShader,
      fragmentShader,
      vertexLayout,
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
      colorBlendState: config.colorBlendState,
      label: `Blend Pipeline (${mode})`,
    });
    pipelines.set(mode, pipeline);
  }
  return pipelines.get(mode)!;
};
```

### 2.4 纹理加载

```typescript
// 创建纹理
const texture = runner.device.createTexture({
  width: 758,
  height: 600,
  format: MSpec.RHITextureFormat.RGBA8_UNORM,
  usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
});

// 加载图片
const image = new Image();
image.onload = () => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  texture.update(imageData.data as BufferSource);
};
image.src = '../assets/texture/758px-Canestra_di_frutta_(Caravaggio).jpg';
```

### 2.5 GUI 交互控制

```typescript
const gui = new SimpleGUI();

gui
  .add('blendMode', {
    value: params.blendMode,
    options: Object.keys(BLEND_MODES),
    onChange: (v) => {
      params.blendMode = v as string;
    },
  })
  .add('alpha', {
    value: params.alpha,
    min: 0,
    max: 1,
    step: 0.05,
  })
  .add('showBackground', {
    value: params.showBackground,
  })
  .add('animateColors', {
    value: params.animateColors,
  });
```

## 3. 键盘控制

- **ESC**: 退出 Demo
- **F11**: 切换全屏
- **1-7**: 切换混合模式
  - 1: None
  - 2: Alpha
  - 3: Additive
  - 4: Multiply
  - 5: Screen
  - 6: Subtract
  - 7: Premultiplied

## 4. 性能优化

### 4.1 管线缓存

- 预创建所有混合模式的渲染管线
- 避免每帧重复创建管线

### 4.2 Uniform 缓冲区

- 使用动态更新缓冲区
- std140 布局对齐

### 4.3 资源管理

- 使用 `runner.track()` 自动追踪资源
- 正确销毁所有资源

## 5. 扩展建议

1. **添加更多混合模式**
   - Luminosity
   - Overlay
   - Soft Light
   - Hard Light

2. **支持多个纹理**
   - 实现纹理混合
   - 添加纹理组合功能

3. **高级效果**
   - 动态混合因子
   - 基于距离的混合
   - 遮罩混合

## 6. 相关文档

- [RHI Demo 开发指南](/packages/rhi/llmdoc/guides/demo-development.md) - Demo 开发规范
- [MVP 矩阵实现架构](/llmdoc/architecture/mvp-matrix-implementation.md) - 矩阵变换实现
- [Blend Modes UBO 修复报告](/packages/rhi/llmdoc/reference/blend-modes-ubo-fix-report.md) - UBO 绑定问题修复
## 🔌 Interface First

### 核心接口定义
#### gui
```typescript
// 接口定义和用法
```

#### DemoConfig
```typescript
interface DemoConfig {
  name: string;
  renderer: RendererType;
  resources: ResourceConfig;
}
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

# 混合模式 Demo 参考

本文档提供了混合模式 Demo 的完整实现参考，展示了如何使用 RHI 实现各种图形混合效果。

## 1. Demo 概述

**文件位置**: `packages/rhi/demo/src/blend-modes.ts`

### 功能特性

- 支持 7 种混合模式：None、Alpha、Additive、Multiply、Screen、Subtract、Premultiplied Alpha
- 纹理渲染（Caravaggio 水果图片）
- 完整的 MVP 矩阵变换支持
- 交互式 GUI 控制面板
- 键盘快捷键切换（1-7 数字键）
- 动画颜色效果
- Stats 性能监控

### 混合模式详情

| 模式 | 描述 | 混合配置 |
|------|------|----------|
| None | 禁用混合，完全覆盖 | `blendEnabled: false` |
| Alpha | 标准透明度混合 | `SrcAlpha, OneMinusSrcAlpha` |
| Additive | 加法混合，颜色叠加 | `SrcAlpha, One` |
| Multiply | 乘法混合，颜色相乘 | `DstColor, Zero` |
| Screen | 屏幕混合，反向相乘 | `One, OneMinusSrcColor` |
| Subtract | 减法混合，颜色相减 | `SrcAlpha, One, REVERSE_SUBTRACT` |
| Premultiplied | 预乘Alpha混合 | `One, OneMinusSrcAlpha` |

## 2. 核心实现

### 2.1 着色器实现

#### 顶点着色器

```glsl
#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform VertexUniforms {
  vec2 uOffset;
  vec2 uScalePadding;
};

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec2 vTexCoord;

void main() {
  float uScale = uScalePadding.x;
  vec2 scaledPos = aPosition * uScale;
  vec4 worldPosition = uModelMatrix * vec4(scaledPos + uOffset, 0.0, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vTexCoord = aTexCoord;
}
```

#### 片段着色器

```glsl
#version 300 es
precision mediump float;

uniform FragmentUniforms {
  vec4 uColor;
};

uniform sampler2D uTexture;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  fragColor = texColor * uColor;
}
```

### 2.2 MVP 矩阵变换

```typescript
// 创建模型矩阵
const modelMatrix = new MMath.Matrix4();

// 渲染循环中更新
runner.start((dt) => {
  orbit.update(dt);

  // 获取视图和投影矩阵
  const viewMatrix = orbit.getViewMatrix();
  const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

  // 更新 Uniform 缓冲区
  const transformData = new Float32Array(64);
  transformData.set(modelMatrix.toArray(), 0);
  transformData.set(viewMatrix, 16);
  transformData.set(projMatrix, 32);
  transformBuffer.update(transformData, 0);
});
```

### 2.3 管线缓存实现

```typescript
// 创建管线缓存，支持不同混合模式
const pipelines: Map<string, MSpec.IRHIRenderPipeline> = new Map();

const getOrCreatePipeline = (mode: string): MSpec.IRHIRenderPipeline => {
  if (!pipelines.has(mode)) {
    const config = BLEND_MODES[mode];
    const pipeline = runner.device.createRenderPipeline({
      vertexShader,
      fragmentShader,
      vertexLayout,
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
      colorBlendState: config.colorBlendState,
      label: `Blend Pipeline (${mode})`,
    });
    pipelines.set(mode, pipeline);
  }
  return pipelines.get(mode)!;
};
```

### 2.4 纹理加载

```typescript
// 创建纹理
const texture = runner.device.createTexture({
  width: 758,
  height: 600,
  format: MSpec.RHITextureFormat.RGBA8_UNORM,
  usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
});

// 加载图片
const image = new Image();
image.onload = () => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  texture.update(imageData.data as BufferSource);
};
image.src = '../assets/texture/758px-Canestra_di_frutta_(Caravaggio).jpg';
```

### 2.5 GUI 交互控制

```typescript
const gui = new SimpleGUI();

gui
  .add('blendMode', {
    value: params.blendMode,
    options: Object.keys(BLEND_MODES),
    onChange: (v) => {
      params.blendMode = v as string;
    },
  })
  .add('alpha', {
    value: params.alpha,
    min: 0,
    max: 1,
    step: 0.05,
  })
  .add('showBackground', {
    value: params.showBackground,
  })
  .add('animateColors', {
    value: params.animateColors,
  });
```

## 3. 键盘控制

- **ESC**: 退出 Demo
- **F11**: 切换全屏
- **1-7**: 切换混合模式
  - 1: None
  - 2: Alpha
  - 3: Additive
  - 4: Multiply
  - 5: Screen
  - 6: Subtract
  - 7: Premultiplied

## 4. 性能优化

### 4.1 管线缓存

- 预创建所有混合模式的渲染管线
- 避免每帧重复创建管线

### 4.2 Uniform 缓冲区

- 使用动态更新缓冲区
- std140 布局对齐

### 4.3 资源管理

- 使用 `runner.track()` 自动追踪资源
- 正确销毁所有资源

## 5. 扩展建议

1. **添加更多混合模式**
   - Luminosity
   - Overlay
   - Soft Light
   - Hard Light

2. **支持多个纹理**
   - 实现纹理混合
   - 添加纹理组合功能

3. **高级效果**
   - 动态混合因子
   - 基于距离的混合
   - 遮罩混合

## 6. 相关文档

- [RHI Demo 开发指南](/packages/rhi/llmdoc/guides/demo-development.md) - Demo 开发规范
- [MVP 矩阵实现架构](/llmdoc/architecture/mvp-matrix-implementation.md) - 矩阵变换实现
- [Blend Modes UBO 修复报告](/packages/rhi/llmdoc/reference/blend-modes-ubo-fix-report.md) - UBO 绑定问题修复
## ⚠️ 禁止事项

### 关键约束
- 🚫 **避免硬编码路径**: 使用相对路径或配置文件
- 🚫 **忽略资源清理**: 确保所有资源得到正确释放
- 🚫 **缺少错误处理**: 提供清晰的错误信息和恢复机制

### 常见错误
- ❌ 忽略错误处理和异常情况
- ❌ 缺少必要的性能优化
- ❌ 不遵循项目的编码规范
- ❌ 忽略文档更新和维护

### 最佳实践提醒
- ✅ 始终考虑性能影响
- ✅ 提供清晰的错误信息
- ✅ 保持代码的可维护性
- ✅ 定期更新文档

---

# 混合模式 Demo 参考

本文档提供了混合模式 Demo 的完整实现参考，展示了如何使用 RHI 实现各种图形混合效果。

## 1. Demo 概述

**文件位置**: `packages/rhi/demo/src/blend-modes.ts`

### 功能特性

- 支持 7 种混合模式：None、Alpha、Additive、Multiply、Screen、Subtract、Premultiplied Alpha
- 纹理渲染（Caravaggio 水果图片）
- 完整的 MVP 矩阵变换支持
- 交互式 GUI 控制面板
- 键盘快捷键切换（1-7 数字键）
- 动画颜色效果
- Stats 性能监控

### 混合模式详情

| 模式 | 描述 | 混合配置 |
|------|------|----------|
| None | 禁用混合，完全覆盖 | `blendEnabled: false` |
| Alpha | 标准透明度混合 | `SrcAlpha, OneMinusSrcAlpha` |
| Additive | 加法混合，颜色叠加 | `SrcAlpha, One` |
| Multiply | 乘法混合，颜色相乘 | `DstColor, Zero` |
| Screen | 屏幕混合，反向相乘 | `One, OneMinusSrcColor` |
| Subtract | 减法混合，颜色相减 | `SrcAlpha, One, REVERSE_SUBTRACT` |
| Premultiplied | 预乘Alpha混合 | `One, OneMinusSrcAlpha` |

## 2. 核心实现

### 2.1 着色器实现

#### 顶点着色器

```glsl
#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform VertexUniforms {
  vec2 uOffset;
  vec2 uScalePadding;
};

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec2 vTexCoord;

void main() {
  float uScale = uScalePadding.x;
  vec2 scaledPos = aPosition * uScale;
  vec4 worldPosition = uModelMatrix * vec4(scaledPos + uOffset, 0.0, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vTexCoord = aTexCoord;
}
```

#### 片段着色器

```glsl
#version 300 es
precision mediump float;

uniform FragmentUniforms {
  vec4 uColor;
};

uniform sampler2D uTexture;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  fragColor = texColor * uColor;
}
```

### 2.2 MVP 矩阵变换

```typescript
// 创建模型矩阵
const modelMatrix = new MMath.Matrix4();

// 渲染循环中更新
runner.start((dt) => {
  orbit.update(dt);

  // 获取视图和投影矩阵
  const viewMatrix = orbit.getViewMatrix();
  const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

  // 更新 Uniform 缓冲区
  const transformData = new Float32Array(64);
  transformData.set(modelMatrix.toArray(), 0);
  transformData.set(viewMatrix, 16);
  transformData.set(projMatrix, 32);
  transformBuffer.update(transformData, 0);
});
```

### 2.3 管线缓存实现

```typescript
// 创建管线缓存，支持不同混合模式
const pipelines: Map<string, MSpec.IRHIRenderPipeline> = new Map();

const getOrCreatePipeline = (mode: string): MSpec.IRHIRenderPipeline => {
  if (!pipelines.has(mode)) {
    const config = BLEND_MODES[mode];
    const pipeline = runner.device.createRenderPipeline({
      vertexShader,
      fragmentShader,
      vertexLayout,
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
      colorBlendState: config.colorBlendState,
      label: `Blend Pipeline (${mode})`,
    });
    pipelines.set(mode, pipeline);
  }
  return pipelines.get(mode)!;
};
```

### 2.4 纹理加载

```typescript
// 创建纹理
const texture = runner.device.createTexture({
  width: 758,
  height: 600,
  format: MSpec.RHITextureFormat.RGBA8_UNORM,
  usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
});

// 加载图片
const image = new Image();
image.onload = () => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  texture.update(imageData.data as BufferSource);
};
image.src = '../assets/texture/758px-Canestra_di_frutta_(Caravaggio).jpg';
```

### 2.5 GUI 交互控制

```typescript
const gui = new SimpleGUI();

gui
  .add('blendMode', {
    value: params.blendMode,
    options: Object.keys(BLEND_MODES),
    onChange: (v) => {
      params.blendMode = v as string;
    },
  })
  .add('alpha', {
    value: params.alpha,
    min: 0,
    max: 1,
    step: 0.05,
  })
  .add('showBackground', {
    value: params.showBackground,
  })
  .add('animateColors', {
    value: params.animateColors,
  });
```

## 3. 键盘控制

- **ESC**: 退出 Demo
- **F11**: 切换全屏
- **1-7**: 切换混合模式
  - 1: None
  - 2: Alpha
  - 3: Additive
  - 4: Multiply
  - 5: Screen
  - 6: Subtract
  - 7: Premultiplied

## 4. 性能优化

### 4.1 管线缓存

- 预创建所有混合模式的渲染管线
- 避免每帧重复创建管线

### 4.2 Uniform 缓冲区

- 使用动态更新缓冲区
- std140 布局对齐

### 4.3 资源管理

- 使用 `runner.track()` 自动追踪资源
- 正确销毁所有资源

## 5. 扩展建议

1. **添加更多混合模式**
   - Luminosity
   - Overlay
   - Soft Light
   - Hard Light

2. **支持多个纹理**
   - 实现纹理混合
   - 添加纹理组合功能

3. **高级效果**
   - 动态混合因子
   - 基于距离的混合
   - 遮罩混合

## 6. 相关文档

- [RHI Demo 开发指南](/packages/rhi/llmdoc/guides/demo-development.md) - Demo 开发规范
- [MVP 矩阵实现架构](/llmdoc/architecture/mvp-matrix-implementation.md) - 矩阵变换实现
- [Blend Modes UBO 修复报告](/packages/rhi/llmdoc/reference/blend-modes-ubo-fix-report.md) - UBO 绑定问题修复
## 📚 Few-Shot示例

### 问题-解决方案对
**问题**: Demo无法在特定设备上运行
**解决方案**: 添加设备兼容性检查和降级方案
```typescript
if (!device.supportsFeature('requiredFeature')) {
  // 使用降级渲染
  renderer.useFallbackMode();
}
```

**问题**: 资源加载失败导致Demo崩溃
**解决方案**: 实现资源加载重试机制
```typescript
try {
  await resourceLoader.loadWithRetry(texturePath, 3);
} catch (error) {
  console.warn('使用默认纹理:', error);
  texture = defaultTexture;
}
```

### 学习要点
- 理解常见问题和解决方案
- 掌握最佳实践和避免陷阱
- 培养问题解决思维

---

# 混合模式 Demo 参考

本文档提供了混合模式 Demo 的完整实现参考，展示了如何使用 RHI 实现各种图形混合效果。

## 1. Demo 概述

**文件位置**: `packages/rhi/demo/src/blend-modes.ts`

### 功能特性

- 支持 7 种混合模式：None、Alpha、Additive、Multiply、Screen、Subtract、Premultiplied Alpha
- 纹理渲染（Caravaggio 水果图片）
- 完整的 MVP 矩阵变换支持
- 交互式 GUI 控制面板
- 键盘快捷键切换（1-7 数字键）
- 动画颜色效果
- Stats 性能监控

### 混合模式详情

| 模式 | 描述 | 混合配置 |
|------|------|----------|
| None | 禁用混合，完全覆盖 | `blendEnabled: false` |
| Alpha | 标准透明度混合 | `SrcAlpha, OneMinusSrcAlpha` |
| Additive | 加法混合，颜色叠加 | `SrcAlpha, One` |
| Multiply | 乘法混合，颜色相乘 | `DstColor, Zero` |
| Screen | 屏幕混合，反向相乘 | `One, OneMinusSrcColor` |
| Subtract | 减法混合，颜色相减 | `SrcAlpha, One, REVERSE_SUBTRACT` |
| Premultiplied | 预乘Alpha混合 | `One, OneMinusSrcAlpha` |

## 2. 核心实现

### 2.1 着色器实现

#### 顶点着色器

```glsl
#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform VertexUniforms {
  vec2 uOffset;
  vec2 uScalePadding;
};

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec2 vTexCoord;

void main() {
  float uScale = uScalePadding.x;
  vec2 scaledPos = aPosition * uScale;
  vec4 worldPosition = uModelMatrix * vec4(scaledPos + uOffset, 0.0, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vTexCoord = aTexCoord;
}
```

#### 片段着色器

```glsl
#version 300 es
precision mediump float;

uniform FragmentUniforms {
  vec4 uColor;
};

uniform sampler2D uTexture;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  fragColor = texColor * uColor;
}
```

### 2.2 MVP 矩阵变换

```typescript
// 创建模型矩阵
const modelMatrix = new MMath.Matrix4();

// 渲染循环中更新
runner.start((dt) => {
  orbit.update(dt);

  // 获取视图和投影矩阵
  const viewMatrix = orbit.getViewMatrix();
  const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

  // 更新 Uniform 缓冲区
  const transformData = new Float32Array(64);
  transformData.set(modelMatrix.toArray(), 0);
  transformData.set(viewMatrix, 16);
  transformData.set(projMatrix, 32);
  transformBuffer.update(transformData, 0);
});
```

### 2.3 管线缓存实现

```typescript
// 创建管线缓存，支持不同混合模式
const pipelines: Map<string, MSpec.IRHIRenderPipeline> = new Map();

const getOrCreatePipeline = (mode: string): MSpec.IRHIRenderPipeline => {
  if (!pipelines.has(mode)) {
    const config = BLEND_MODES[mode];
    const pipeline = runner.device.createRenderPipeline({
      vertexShader,
      fragmentShader,
      vertexLayout,
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
      colorBlendState: config.colorBlendState,
      label: `Blend Pipeline (${mode})`,
    });
    pipelines.set(mode, pipeline);
  }
  return pipelines.get(mode)!;
};
```

### 2.4 纹理加载

```typescript
// 创建纹理
const texture = runner.device.createTexture({
  width: 758,
  height: 600,
  format: MSpec.RHITextureFormat.RGBA8_UNORM,
  usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
});

// 加载图片
const image = new Image();
image.onload = () => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  texture.update(imageData.data as BufferSource);
};
image.src = '../assets/texture/758px-Canestra_di_frutta_(Caravaggio).jpg';
```

### 2.5 GUI 交互控制

```typescript
const gui = new SimpleGUI();

gui
  .add('blendMode', {
    value: params.blendMode,
    options: Object.keys(BLEND_MODES),
    onChange: (v) => {
      params.blendMode = v as string;
    },
  })
  .add('alpha', {
    value: params.alpha,
    min: 0,
    max: 1,
    step: 0.05,
  })
  .add('showBackground', {
    value: params.showBackground,
  })
  .add('animateColors', {
    value: params.animateColors,
  });
```

## 3. 键盘控制

- **ESC**: 退出 Demo
- **F11**: 切换全屏
- **1-7**: 切换混合模式
  - 1: None
  - 2: Alpha
  - 3: Additive
  - 4: Multiply
  - 5: Screen
  - 6: Subtract
  - 7: Premultiplied

## 4. 性能优化

### 4.1 管线缓存

- 预创建所有混合模式的渲染管线
- 避免每帧重复创建管线

### 4.2 Uniform 缓冲区

- 使用动态更新缓冲区
- std140 布局对齐

### 4.3 资源管理

- 使用 `runner.track()` 自动追踪资源
- 正确销毁所有资源

## 5. 扩展建议

1. **添加更多混合模式**
   - Luminosity
   - Overlay
   - Soft Light
   - Hard Light

2. **支持多个纹理**
   - 实现纹理混合
   - 添加纹理组合功能

3. **高级效果**
   - 动态混合因子
   - 基于距离的混合
   - 遮罩混合

## 6. 相关文档

- [RHI Demo 开发指南](/packages/rhi/llmdoc/guides/demo-development.md) - Demo 开发规范
- [MVP 矩阵实现架构](/llmdoc/architecture/mvp-matrix-implementation.md) - 矩阵变换实现
- [Blend Modes UBO 修复报告](/packages/rhi/llmdoc/reference/blend-modes-ubo-fix-report.md) - UBO 绑定问题修复