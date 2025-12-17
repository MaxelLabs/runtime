---
title: Multi Textures Demo
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: demo
tags: ['guide', 'llm-native', 'demo', 'demo-developers', 'code-examples', 'step-by-step']
target_audience: demo-developers
complexity: advanced
estimated_time: f"59 分钟"
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

# Multi-Textures Demo 实现参考

## 概述

multi-textures 是 RHI Demo 系统纹理系统的高级演示，展示在单个着色器中同时绑定和采样多个纹理的技术，以及如何实现各种视觉混合效果。

## 功能演示

- **多纹理绑定**：同时绑定3个纹理（2个主纹理 + 1个遮罩纹理）
- **5种混合模式**：Linear、Multiply、Screen、Overlay、Mask
- **程序化纹理生成**：棋盘格、渐变、噪声纹理
- **实时参数调节**：通过SimpleGUI控制混合因子和遮罩阈值
- **快捷键切换**：数字键1-5快速切换混合模式

## 核心技术点

### 1. 多纹理绑定组布局

```typescript
const bindGroupLayout = runner.device.createBindGroupLayout([
  {
    binding: 0,
    visibility: MSpec.RHIShaderStage.VERTEX,
    buffer: { type: 'uniform' },
    name: 'Transforms',
  },
  {
    binding: 1,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    buffer: { type: 'uniform' },
    name: 'BlendParams',
  },
  // 纹理1
  {
    binding: 2,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture1',
  },
  {
    binding: 3,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler1',
  },
  // 纹理2
  {
    binding: 4,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture2',
  },
  {
    binding: 5,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler2',
  },
  // 遮罩纹理
  {
    binding: 6,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uMaskTexture',
  },
  {
    binding: 7,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uMaskSampler',
  },
]);
```

### 2. 程序化纹理生成

```typescript
// 棋盘格纹理
const checkerData = ProceduralTexture.checkerboard({
  width: 512,
  height: 512,
  cellSize: 32,
  colorA: [255, 100, 100, 255], // 红色
  colorB: [100, 100, 255, 255], // 蓝色
});

// 渐变纹理
const gradientData = ProceduralTexture.gradient({
  width: 512,
  height: 512,
  direction: 'diagonal',
  colors: [
    { position: 0.0, color: [255, 200, 0, 255] }, // 黄色
    { position: 0.5, color: [255, 0, 200, 255] }, // 紫色
    { position: 1.0, color: [0, 200, 255, 255] }, // 青色
  ],
});

// 噪声遮罩纹理
const noiseData = ProceduralTexture.noise({
  width: 512,
  height: 512,
  type: 'white',
  scale: 0.02,
});
```

### 3. 混合算法实现

**GLSL混合函数：**

```glsl
// 乘法混合（变暗）
vec3 blendMultiply(vec3 base, vec3 blend) {
  return base * blend;
}

// 屏幕混合（变亮）
vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

// 叠加混合（对比度增强）
vec3 blendOverlay(vec3 base, vec3 blend) {
  return mix(
    2.0 * base * blend,
    1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
    step(0.5, base)
  );
}
```

### 4. Uniform块控制

```typescript
// 创建混合参数缓冲区
const blendParamsBuffer = runner.device.createBuffer({
  size: 16, // float + int + float + padding
  usage: MSpec.RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
  label: 'Blend Params Uniform Buffer',
});

// 更新参数
const blendParamsData = new Float32Array(4);
blendParamsData[0] = mixFactor;      // 混合因子
blendParamsData[1] = blendMode;      // 混合模式
blendParamsData[2] = maskThreshold;  // 遮罩阈值
blendParamsBuffer.update(blendParamsData, 0);
```

## 着色器实现

### 顶点着色器

```glsl
#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec2 vTexCoord;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vTexCoord = aTexCoord;
}
```

### 片段着色器

```glsl
#version 300 es
precision mediump float;

uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D uMaskTexture;

uniform BlendParams {
  float uMixFactor;
  int uBlendMode;
  float uMaskThreshold;
};

in vec2 vTexCoord;
out vec4 fragColor;

// 混合模式枚举
const int BLEND_LINEAR = 0;
const int BLEND_MULTIPLY = 1;
const int BLEND_SCREEN = 2;
const int BLEND_OVERLAY = 3;
const int BLEND_MASK = 4;

void main() {
  vec4 color1 = texture(uTexture1, vTexCoord);
  vec4 color2 = texture(uTexture2, vTexCoord);
  vec4 maskColor = texture(uMaskTexture, vTexCoord);

  vec3 result = color1.rgb;

  // 根据混合模式计算结果
  switch (uBlendMode) {
    case BLEND_LINEAR:
      result = mix(color1.rgb, color2.rgb, uMixFactor);
      break;

    case BLEND_MULTIPLY:
      result = mix(color1.rgb, blendMultiply(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_SCREEN:
      result = mix(color1.rgb, blendScreen(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_OVERLAY:
      result = mix(color1.rgb, blendOverlay(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_MASK:
      // 使用遮罩纹理控制混合
      float mask = (maskColor.r + maskColor.g + maskColor.b) / 3.0;
      float blend = step(uMaskThreshold, mask) * uMixFactor;
      result = mix(color1.rgb, color2.rgb, blend);
      break;
  }

  fragColor = vec4(result, 1.0);
}
```

## 相关文件

- `demo/src/multi-textures.ts` - 主程序
- `demo/html/multi-textures.html` - HTML 页面
- `demo/src/utils/ProceduralTexture.ts` - 程序化纹理生成器
- `demo/src/utils/SimpleGUI.ts` - GUI控制面板

## 交互控制

### 快捷键
- **1-5**: 切换混合模式
  - 1: Linear（线性插值）
  - 2: Multiply（乘法混合）
  - 3: Screen（屏幕混合）
  - 4: Overlay（叠加混合）
  - 5: Mask（遮罩混合）
- **0**: 重置视角
- **ESC**: 退出 Demo
- **F11**: 切换全屏

### GUI控制
- **Blend Mode**: 下拉选择混合模式
- **Mix Factor**: 滑块调节混合强度（0.0 - 1.0）
- **Mask Threshold**: 滑块调节遮罩阈值（仅在Mask模式下有效）

### 鼠标控制
- **左键拖动**: 旋转视角
- **滚轮**: 缩放
- **右键拖动**: 平移

## 技术注意事项

1. **绑定组设计**: 将变换矩阵、混合参数和纹理分离到不同的绑定槽位，便于灵活管理
2. **Uniform对齐**: 混合参数缓冲区大小为16字节，符合Uniform缓冲区的对齐要求
3. **遮罩计算**: 将RGB通道平均转换为灰度值作为遮罩强度
4. **混合算法**: 使用mix函数控制混合程度，实现平滑过渡
5. **程序化纹理**: 避免外部资源依赖，确保Demo可独立运行
6. **性能优化**: 所有资源在DemoRunner中跟踪，自动管理生命周期

## 混合模式详解

### Linear（线性插值）
最简单的混合方式，按照混合因子在两个纹理之间进行线性过渡。

### Multiply（乘法混合）
通过颜色相乘实现变暗效果，适合创建阴影或加深效果。

### Screen（屏幕混合）
通过反色相乘再反色实现变亮效果，适合创建光晕或提亮效果。

### Overlay（叠加混合）
结合Multiply和Screen，根据基础颜色亮度选择混合方式，增强对比度。

### Mask（遮罩混合）
使用第三个纹理（遮罩）控制混合区域，基于阈值实现硬边界混合。
## 🔌 Interface First

### 核心接口定义
#### bindGroupLayout
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

# Multi-Textures Demo 实现参考

## 概述

multi-textures 是 RHI Demo 系统纹理系统的高级演示，展示在单个着色器中同时绑定和采样多个纹理的技术，以及如何实现各种视觉混合效果。

## 功能演示

- **多纹理绑定**：同时绑定3个纹理（2个主纹理 + 1个遮罩纹理）
- **5种混合模式**：Linear、Multiply、Screen、Overlay、Mask
- **程序化纹理生成**：棋盘格、渐变、噪声纹理
- **实时参数调节**：通过SimpleGUI控制混合因子和遮罩阈值
- **快捷键切换**：数字键1-5快速切换混合模式

## 核心技术点

### 1. 多纹理绑定组布局

```typescript
const bindGroupLayout = runner.device.createBindGroupLayout([
  {
    binding: 0,
    visibility: MSpec.RHIShaderStage.VERTEX,
    buffer: { type: 'uniform' },
    name: 'Transforms',
  },
  {
    binding: 1,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    buffer: { type: 'uniform' },
    name: 'BlendParams',
  },
  // 纹理1
  {
    binding: 2,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture1',
  },
  {
    binding: 3,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler1',
  },
  // 纹理2
  {
    binding: 4,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture2',
  },
  {
    binding: 5,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler2',
  },
  // 遮罩纹理
  {
    binding: 6,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uMaskTexture',
  },
  {
    binding: 7,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uMaskSampler',
  },
]);
```

### 2. 程序化纹理生成

```typescript
// 棋盘格纹理
const checkerData = ProceduralTexture.checkerboard({
  width: 512,
  height: 512,
  cellSize: 32,
  colorA: [255, 100, 100, 255], // 红色
  colorB: [100, 100, 255, 255], // 蓝色
});

// 渐变纹理
const gradientData = ProceduralTexture.gradient({
  width: 512,
  height: 512,
  direction: 'diagonal',
  colors: [
    { position: 0.0, color: [255, 200, 0, 255] }, // 黄色
    { position: 0.5, color: [255, 0, 200, 255] }, // 紫色
    { position: 1.0, color: [0, 200, 255, 255] }, // 青色
  ],
});

// 噪声遮罩纹理
const noiseData = ProceduralTexture.noise({
  width: 512,
  height: 512,
  type: 'white',
  scale: 0.02,
});
```

### 3. 混合算法实现

**GLSL混合函数：**

```glsl
// 乘法混合（变暗）
vec3 blendMultiply(vec3 base, vec3 blend) {
  return base * blend;
}

// 屏幕混合（变亮）
vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

// 叠加混合（对比度增强）
vec3 blendOverlay(vec3 base, vec3 blend) {
  return mix(
    2.0 * base * blend,
    1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
    step(0.5, base)
  );
}
```

### 4. Uniform块控制

```typescript
// 创建混合参数缓冲区
const blendParamsBuffer = runner.device.createBuffer({
  size: 16, // float + int + float + padding
  usage: MSpec.RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
  label: 'Blend Params Uniform Buffer',
});

// 更新参数
const blendParamsData = new Float32Array(4);
blendParamsData[0] = mixFactor;      // 混合因子
blendParamsData[1] = blendMode;      // 混合模式
blendParamsData[2] = maskThreshold;  // 遮罩阈值
blendParamsBuffer.update(blendParamsData, 0);
```

## 着色器实现

### 顶点着色器

```glsl
#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec2 vTexCoord;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vTexCoord = aTexCoord;
}
```

### 片段着色器

```glsl
#version 300 es
precision mediump float;

uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D uMaskTexture;

uniform BlendParams {
  float uMixFactor;
  int uBlendMode;
  float uMaskThreshold;
};

in vec2 vTexCoord;
out vec4 fragColor;

// 混合模式枚举
const int BLEND_LINEAR = 0;
const int BLEND_MULTIPLY = 1;
const int BLEND_SCREEN = 2;
const int BLEND_OVERLAY = 3;
const int BLEND_MASK = 4;

void main() {
  vec4 color1 = texture(uTexture1, vTexCoord);
  vec4 color2 = texture(uTexture2, vTexCoord);
  vec4 maskColor = texture(uMaskTexture, vTexCoord);

  vec3 result = color1.rgb;

  // 根据混合模式计算结果
  switch (uBlendMode) {
    case BLEND_LINEAR:
      result = mix(color1.rgb, color2.rgb, uMixFactor);
      break;

    case BLEND_MULTIPLY:
      result = mix(color1.rgb, blendMultiply(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_SCREEN:
      result = mix(color1.rgb, blendScreen(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_OVERLAY:
      result = mix(color1.rgb, blendOverlay(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_MASK:
      // 使用遮罩纹理控制混合
      float mask = (maskColor.r + maskColor.g + maskColor.b) / 3.0;
      float blend = step(uMaskThreshold, mask) * uMixFactor;
      result = mix(color1.rgb, color2.rgb, blend);
      break;
  }

  fragColor = vec4(result, 1.0);
}
```

## 相关文件

- `demo/src/multi-textures.ts` - 主程序
- `demo/html/multi-textures.html` - HTML 页面
- `demo/src/utils/ProceduralTexture.ts` - 程序化纹理生成器
- `demo/src/utils/SimpleGUI.ts` - GUI控制面板

## 交互控制

### 快捷键
- **1-5**: 切换混合模式
  - 1: Linear（线性插值）
  - 2: Multiply（乘法混合）
  - 3: Screen（屏幕混合）
  - 4: Overlay（叠加混合）
  - 5: Mask（遮罩混合）
- **0**: 重置视角
- **ESC**: 退出 Demo
- **F11**: 切换全屏

### GUI控制
- **Blend Mode**: 下拉选择混合模式
- **Mix Factor**: 滑块调节混合强度（0.0 - 1.0）
- **Mask Threshold**: 滑块调节遮罩阈值（仅在Mask模式下有效）

### 鼠标控制
- **左键拖动**: 旋转视角
- **滚轮**: 缩放
- **右键拖动**: 平移

## 技术注意事项

1. **绑定组设计**: 将变换矩阵、混合参数和纹理分离到不同的绑定槽位，便于灵活管理
2. **Uniform对齐**: 混合参数缓冲区大小为16字节，符合Uniform缓冲区的对齐要求
3. **遮罩计算**: 将RGB通道平均转换为灰度值作为遮罩强度
4. **混合算法**: 使用mix函数控制混合程度，实现平滑过渡
5. **程序化纹理**: 避免外部资源依赖，确保Demo可独立运行
6. **性能优化**: 所有资源在DemoRunner中跟踪，自动管理生命周期

## 混合模式详解

### Linear（线性插值）
最简单的混合方式，按照混合因子在两个纹理之间进行线性过渡。

### Multiply（乘法混合）
通过颜色相乘实现变暗效果，适合创建阴影或加深效果。

### Screen（屏幕混合）
通过反色相乘再反色实现变亮效果，适合创建光晕或提亮效果。

### Overlay（叠加混合）
结合Multiply和Screen，根据基础颜色亮度选择混合方式，增强对比度。

### Mask（遮罩混合）
使用第三个纹理（遮罩）控制混合区域，基于阈值实现硬边界混合。
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

# Multi-Textures Demo 实现参考

## 概述

multi-textures 是 RHI Demo 系统纹理系统的高级演示，展示在单个着色器中同时绑定和采样多个纹理的技术，以及如何实现各种视觉混合效果。

## 功能演示

- **多纹理绑定**：同时绑定3个纹理（2个主纹理 + 1个遮罩纹理）
- **5种混合模式**：Linear、Multiply、Screen、Overlay、Mask
- **程序化纹理生成**：棋盘格、渐变、噪声纹理
- **实时参数调节**：通过SimpleGUI控制混合因子和遮罩阈值
- **快捷键切换**：数字键1-5快速切换混合模式

## 核心技术点

### 1. 多纹理绑定组布局

```typescript
const bindGroupLayout = runner.device.createBindGroupLayout([
  {
    binding: 0,
    visibility: MSpec.RHIShaderStage.VERTEX,
    buffer: { type: 'uniform' },
    name: 'Transforms',
  },
  {
    binding: 1,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    buffer: { type: 'uniform' },
    name: 'BlendParams',
  },
  // 纹理1
  {
    binding: 2,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture1',
  },
  {
    binding: 3,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler1',
  },
  // 纹理2
  {
    binding: 4,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture2',
  },
  {
    binding: 5,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler2',
  },
  // 遮罩纹理
  {
    binding: 6,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uMaskTexture',
  },
  {
    binding: 7,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uMaskSampler',
  },
]);
```

### 2. 程序化纹理生成

```typescript
// 棋盘格纹理
const checkerData = ProceduralTexture.checkerboard({
  width: 512,
  height: 512,
  cellSize: 32,
  colorA: [255, 100, 100, 255], // 红色
  colorB: [100, 100, 255, 255], // 蓝色
});

// 渐变纹理
const gradientData = ProceduralTexture.gradient({
  width: 512,
  height: 512,
  direction: 'diagonal',
  colors: [
    { position: 0.0, color: [255, 200, 0, 255] }, // 黄色
    { position: 0.5, color: [255, 0, 200, 255] }, // 紫色
    { position: 1.0, color: [0, 200, 255, 255] }, // 青色
  ],
});

// 噪声遮罩纹理
const noiseData = ProceduralTexture.noise({
  width: 512,
  height: 512,
  type: 'white',
  scale: 0.02,
});
```

### 3. 混合算法实现

**GLSL混合函数：**

```glsl
// 乘法混合（变暗）
vec3 blendMultiply(vec3 base, vec3 blend) {
  return base * blend;
}

// 屏幕混合（变亮）
vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

// 叠加混合（对比度增强）
vec3 blendOverlay(vec3 base, vec3 blend) {
  return mix(
    2.0 * base * blend,
    1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
    step(0.5, base)
  );
}
```

### 4. Uniform块控制

```typescript
// 创建混合参数缓冲区
const blendParamsBuffer = runner.device.createBuffer({
  size: 16, // float + int + float + padding
  usage: MSpec.RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
  label: 'Blend Params Uniform Buffer',
});

// 更新参数
const blendParamsData = new Float32Array(4);
blendParamsData[0] = mixFactor;      // 混合因子
blendParamsData[1] = blendMode;      // 混合模式
blendParamsData[2] = maskThreshold;  // 遮罩阈值
blendParamsBuffer.update(blendParamsData, 0);
```

## 着色器实现

### 顶点着色器

```glsl
#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec2 vTexCoord;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vTexCoord = aTexCoord;
}
```

### 片段着色器

```glsl
#version 300 es
precision mediump float;

uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D uMaskTexture;

uniform BlendParams {
  float uMixFactor;
  int uBlendMode;
  float uMaskThreshold;
};

in vec2 vTexCoord;
out vec4 fragColor;

// 混合模式枚举
const int BLEND_LINEAR = 0;
const int BLEND_MULTIPLY = 1;
const int BLEND_SCREEN = 2;
const int BLEND_OVERLAY = 3;
const int BLEND_MASK = 4;

void main() {
  vec4 color1 = texture(uTexture1, vTexCoord);
  vec4 color2 = texture(uTexture2, vTexCoord);
  vec4 maskColor = texture(uMaskTexture, vTexCoord);

  vec3 result = color1.rgb;

  // 根据混合模式计算结果
  switch (uBlendMode) {
    case BLEND_LINEAR:
      result = mix(color1.rgb, color2.rgb, uMixFactor);
      break;

    case BLEND_MULTIPLY:
      result = mix(color1.rgb, blendMultiply(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_SCREEN:
      result = mix(color1.rgb, blendScreen(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_OVERLAY:
      result = mix(color1.rgb, blendOverlay(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_MASK:
      // 使用遮罩纹理控制混合
      float mask = (maskColor.r + maskColor.g + maskColor.b) / 3.0;
      float blend = step(uMaskThreshold, mask) * uMixFactor;
      result = mix(color1.rgb, color2.rgb, blend);
      break;
  }

  fragColor = vec4(result, 1.0);
}
```

## 相关文件

- `demo/src/multi-textures.ts` - 主程序
- `demo/html/multi-textures.html` - HTML 页面
- `demo/src/utils/ProceduralTexture.ts` - 程序化纹理生成器
- `demo/src/utils/SimpleGUI.ts` - GUI控制面板

## 交互控制

### 快捷键
- **1-5**: 切换混合模式
  - 1: Linear（线性插值）
  - 2: Multiply（乘法混合）
  - 3: Screen（屏幕混合）
  - 4: Overlay（叠加混合）
  - 5: Mask（遮罩混合）
- **0**: 重置视角
- **ESC**: 退出 Demo
- **F11**: 切换全屏

### GUI控制
- **Blend Mode**: 下拉选择混合模式
- **Mix Factor**: 滑块调节混合强度（0.0 - 1.0）
- **Mask Threshold**: 滑块调节遮罩阈值（仅在Mask模式下有效）

### 鼠标控制
- **左键拖动**: 旋转视角
- **滚轮**: 缩放
- **右键拖动**: 平移

## 技术注意事项

1. **绑定组设计**: 将变换矩阵、混合参数和纹理分离到不同的绑定槽位，便于灵活管理
2. **Uniform对齐**: 混合参数缓冲区大小为16字节，符合Uniform缓冲区的对齐要求
3. **遮罩计算**: 将RGB通道平均转换为灰度值作为遮罩强度
4. **混合算法**: 使用mix函数控制混合程度，实现平滑过渡
5. **程序化纹理**: 避免外部资源依赖，确保Demo可独立运行
6. **性能优化**: 所有资源在DemoRunner中跟踪，自动管理生命周期

## 混合模式详解

### Linear（线性插值）
最简单的混合方式，按照混合因子在两个纹理之间进行线性过渡。

### Multiply（乘法混合）
通过颜色相乘实现变暗效果，适合创建阴影或加深效果。

### Screen（屏幕混合）
通过反色相乘再反色实现变亮效果，适合创建光晕或提亮效果。

### Overlay（叠加混合）
结合Multiply和Screen，根据基础颜色亮度选择混合方式，增强对比度。

### Mask（遮罩混合）
使用第三个纹理（遮罩）控制混合区域，基于阈值实现硬边界混合。
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

# Multi-Textures Demo 实现参考

## 概述

multi-textures 是 RHI Demo 系统纹理系统的高级演示，展示在单个着色器中同时绑定和采样多个纹理的技术，以及如何实现各种视觉混合效果。

## 功能演示

- **多纹理绑定**：同时绑定3个纹理（2个主纹理 + 1个遮罩纹理）
- **5种混合模式**：Linear、Multiply、Screen、Overlay、Mask
- **程序化纹理生成**：棋盘格、渐变、噪声纹理
- **实时参数调节**：通过SimpleGUI控制混合因子和遮罩阈值
- **快捷键切换**：数字键1-5快速切换混合模式

## 核心技术点

### 1. 多纹理绑定组布局

```typescript
const bindGroupLayout = runner.device.createBindGroupLayout([
  {
    binding: 0,
    visibility: MSpec.RHIShaderStage.VERTEX,
    buffer: { type: 'uniform' },
    name: 'Transforms',
  },
  {
    binding: 1,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    buffer: { type: 'uniform' },
    name: 'BlendParams',
  },
  // 纹理1
  {
    binding: 2,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture1',
  },
  {
    binding: 3,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler1',
  },
  // 纹理2
  {
    binding: 4,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture2',
  },
  {
    binding: 5,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler2',
  },
  // 遮罩纹理
  {
    binding: 6,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uMaskTexture',
  },
  {
    binding: 7,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uMaskSampler',
  },
]);
```

### 2. 程序化纹理生成

```typescript
// 棋盘格纹理
const checkerData = ProceduralTexture.checkerboard({
  width: 512,
  height: 512,
  cellSize: 32,
  colorA: [255, 100, 100, 255], // 红色
  colorB: [100, 100, 255, 255], // 蓝色
});

// 渐变纹理
const gradientData = ProceduralTexture.gradient({
  width: 512,
  height: 512,
  direction: 'diagonal',
  colors: [
    { position: 0.0, color: [255, 200, 0, 255] }, // 黄色
    { position: 0.5, color: [255, 0, 200, 255] }, // 紫色
    { position: 1.0, color: [0, 200, 255, 255] }, // 青色
  ],
});

// 噪声遮罩纹理
const noiseData = ProceduralTexture.noise({
  width: 512,
  height: 512,
  type: 'white',
  scale: 0.02,
});
```

### 3. 混合算法实现

**GLSL混合函数：**

```glsl
// 乘法混合（变暗）
vec3 blendMultiply(vec3 base, vec3 blend) {
  return base * blend;
}

// 屏幕混合（变亮）
vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

// 叠加混合（对比度增强）
vec3 blendOverlay(vec3 base, vec3 blend) {
  return mix(
    2.0 * base * blend,
    1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
    step(0.5, base)
  );
}
```

### 4. Uniform块控制

```typescript
// 创建混合参数缓冲区
const blendParamsBuffer = runner.device.createBuffer({
  size: 16, // float + int + float + padding
  usage: MSpec.RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
  label: 'Blend Params Uniform Buffer',
});

// 更新参数
const blendParamsData = new Float32Array(4);
blendParamsData[0] = mixFactor;      // 混合因子
blendParamsData[1] = blendMode;      // 混合模式
blendParamsData[2] = maskThreshold;  // 遮罩阈值
blendParamsBuffer.update(blendParamsData, 0);
```

## 着色器实现

### 顶点着色器

```glsl
#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec2 vTexCoord;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vTexCoord = aTexCoord;
}
```

### 片段着色器

```glsl
#version 300 es
precision mediump float;

uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D uMaskTexture;

uniform BlendParams {
  float uMixFactor;
  int uBlendMode;
  float uMaskThreshold;
};

in vec2 vTexCoord;
out vec4 fragColor;

// 混合模式枚举
const int BLEND_LINEAR = 0;
const int BLEND_MULTIPLY = 1;
const int BLEND_SCREEN = 2;
const int BLEND_OVERLAY = 3;
const int BLEND_MASK = 4;

void main() {
  vec4 color1 = texture(uTexture1, vTexCoord);
  vec4 color2 = texture(uTexture2, vTexCoord);
  vec4 maskColor = texture(uMaskTexture, vTexCoord);

  vec3 result = color1.rgb;

  // 根据混合模式计算结果
  switch (uBlendMode) {
    case BLEND_LINEAR:
      result = mix(color1.rgb, color2.rgb, uMixFactor);
      break;

    case BLEND_MULTIPLY:
      result = mix(color1.rgb, blendMultiply(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_SCREEN:
      result = mix(color1.rgb, blendScreen(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_OVERLAY:
      result = mix(color1.rgb, blendOverlay(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_MASK:
      // 使用遮罩纹理控制混合
      float mask = (maskColor.r + maskColor.g + maskColor.b) / 3.0;
      float blend = step(uMaskThreshold, mask) * uMixFactor;
      result = mix(color1.rgb, color2.rgb, blend);
      break;
  }

  fragColor = vec4(result, 1.0);
}
```

## 相关文件

- `demo/src/multi-textures.ts` - 主程序
- `demo/html/multi-textures.html` - HTML 页面
- `demo/src/utils/ProceduralTexture.ts` - 程序化纹理生成器
- `demo/src/utils/SimpleGUI.ts` - GUI控制面板

## 交互控制

### 快捷键
- **1-5**: 切换混合模式
  - 1: Linear（线性插值）
  - 2: Multiply（乘法混合）
  - 3: Screen（屏幕混合）
  - 4: Overlay（叠加混合）
  - 5: Mask（遮罩混合）
- **0**: 重置视角
- **ESC**: 退出 Demo
- **F11**: 切换全屏

### GUI控制
- **Blend Mode**: 下拉选择混合模式
- **Mix Factor**: 滑块调节混合强度（0.0 - 1.0）
- **Mask Threshold**: 滑块调节遮罩阈值（仅在Mask模式下有效）

### 鼠标控制
- **左键拖动**: 旋转视角
- **滚轮**: 缩放
- **右键拖动**: 平移

## 技术注意事项

1. **绑定组设计**: 将变换矩阵、混合参数和纹理分离到不同的绑定槽位，便于灵活管理
2. **Uniform对齐**: 混合参数缓冲区大小为16字节，符合Uniform缓冲区的对齐要求
3. **遮罩计算**: 将RGB通道平均转换为灰度值作为遮罩强度
4. **混合算法**: 使用mix函数控制混合程度，实现平滑过渡
5. **程序化纹理**: 避免外部资源依赖，确保Demo可独立运行
6. **性能优化**: 所有资源在DemoRunner中跟踪，自动管理生命周期

## 混合模式详解

### Linear（线性插值）
最简单的混合方式，按照混合因子在两个纹理之间进行线性过渡。

### Multiply（乘法混合）
通过颜色相乘实现变暗效果，适合创建阴影或加深效果。

### Screen（屏幕混合）
通过反色相乘再反色实现变亮效果，适合创建光晕或提亮效果。

### Overlay（叠加混合）
结合Multiply和Screen，根据基础颜色亮度选择混合方式，增强对比度。

### Mask（遮罩混合）
使用第三个纹理（遮罩）控制混合区域，基于阈值实现硬边界混合。