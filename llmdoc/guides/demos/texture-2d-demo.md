---
title: Texture 2D Demo
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: demo
tags: ['guide', 'llm-native', 'demo', 'demo-developers', 'code-examples', 'step-by-step']
target_audience: demo-developers
complexity: intermediate
estimated_time: f"32 分钟"
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

# Texture 2D Demo 实现参考

## 概述

texture-2d 是 RHI Demo 系统第二层（纹理系统）的第一个演示，展示基础 2D 纹理的加载、创建和采样功能。

## 功能演示

- **TextureLoader** 加载外部图片资源（Caravaggio 静物画）
- **ProceduralTexture** 生成程序化纹理（UV 调试、棋盘格）
- 多纹理对比显示在三个平面上
- 基础纹理采样和 UV 映射

## 核心技术点

### 1. 纹理加载

使用 `TextureLoader` 工具类加载外部图片：

```typescript
const textureData = await TextureLoader.load(config.source, {
  flipY: true,           // Y 轴翻转（符合 WebGL 坐标系）
  generateMipmaps: false, // 不生成 Mipmap
  format: 'rgba8-unorm',  // 纹理格式
});
```

### 2. 程序化纹理生成

使用 `ProceduralTexture` 生成测试纹理：

```typescript
// UV 调试纹理 (R=U, G=V)
const uvDebug = ProceduralTexture.uvDebug({ width: 512, height: 512 });

// 棋盘格纹理
const checkerboard = ProceduralTexture.checkerboard({
  width: 512,
  height: 512,
  cellSize: 32,
  colorA: [255, 255, 255, 255],
  colorB: [64, 64, 64, 255],
});
```

### 3. RHI 纹理创建

```typescript
const texture = runner.device.createTexture({
  width: textureData.width,
  height: textureData.height,
  format: MSpec.RHITextureFormat.RGBA8_UNORM,
  usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
  label: 'Texture Name',
});

// 上传像素数据
texture.update(textureData.data);
```

### 4. 采样器创建

```typescript
const sampler = runner.device.createSampler({
  magFilter: MSpec.RHIFilterMode.LINEAR,
  minFilter: MSpec.RHIFilterMode.LINEAR,
  mipmapFilter: MSpec.RHIFilterMode.NEAREST,
  addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  label: 'Texture Sampler',
});
```

### 5. 绑定组配置

```typescript
// 纹理绑定组布局
const textureBindGroupLayout = runner.device.createBindGroupLayout([
  {
    binding: 0,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture',
  },
  {
    binding: 1,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler',
  },
]);

// 绑定组
const textureBindGroup = runner.device.createBindGroup(textureBindGroupLayout, [
  { binding: 0, resource: texture.createView() },
  { binding: 1, resource: sampler },
]);
```

### 6. 着色器实现

**顶点着色器：**

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

**片段着色器：**

```glsl
#version 300 es
precision mediump float;

uniform sampler2D uTexture;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  fragColor = texColor;
}
```

## 资源依赖

- `demo/assets/texture/758px-Canestra_di_frutta_(Caravaggio).jpg` - Caravaggio 水果静物画

## 相关文件

- `demo/src/texture-2d.ts` - 主程序
- `demo/html/texture-2d.html` - HTML 页面
- `demo/src/utils/texture/TextureLoader.ts` - 纹理加载工具
- `demo/src/utils/texture/ProceduralTexture.ts` - 程序化纹理生成器

## 交互控制

- **ESC**: 退出 Demo
- **F11**: 切换全屏
- **鼠标左键拖动**: 旋转视角
- **鼠标滚轮**: 缩放
- **鼠标右键拖动**: 平移

## 技术注意事项

1. **Y 轴翻转**: WebGL 纹理坐标原点在左下角，而图片数据通常从左上角开始，需要 `flipY: true`
2. **绑定组分离**: 变换矩阵和纹理使用不同的绑定组，便于纹理切换
3. **纹理视图**: 使用 `texture.createView()` 创建纹理视图用于绑定
4. **程序化纹理**: UV Debug 纹理可用于调试纹理坐标映射问题

## 🔌 Interface First

### 核心接口定义
#### textureData
```typescript
// 接口定义和用法
```

#### texture
```typescript
// 接口定义和用法
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

# Texture 2D Demo 实现参考

## 概述

texture-2d 是 RHI Demo 系统第二层（纹理系统）的第一个演示，展示基础 2D 纹理的加载、创建和采样功能。

## 功能演示

- **TextureLoader** 加载外部图片资源（Caravaggio 静物画）
- **ProceduralTexture** 生成程序化纹理（UV 调试、棋盘格）
- 多纹理对比显示在三个平面上
- 基础纹理采样和 UV 映射

## 核心技术点

### 1. 纹理加载

使用 `TextureLoader` 工具类加载外部图片：

```typescript
const textureData = await TextureLoader.load(config.source, {
  flipY: true,           // Y 轴翻转（符合 WebGL 坐标系）
  generateMipmaps: false, // 不生成 Mipmap
  format: 'rgba8-unorm',  // 纹理格式
});
```

### 2. 程序化纹理生成

使用 `ProceduralTexture` 生成测试纹理：

```typescript
// UV 调试纹理 (R=U, G=V)
const uvDebug = ProceduralTexture.uvDebug({ width: 512, height: 512 });

// 棋盘格纹理
const checkerboard = ProceduralTexture.checkerboard({
  width: 512,
  height: 512,
  cellSize: 32,
  colorA: [255, 255, 255, 255],
  colorB: [64, 64, 64, 255],
});
```

### 3. RHI 纹理创建

```typescript
const texture = runner.device.createTexture({
  width: textureData.width,
  height: textureData.height,
  format: MSpec.RHITextureFormat.RGBA8_UNORM,
  usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
  label: 'Texture Name',
});

// 上传像素数据
texture.update(textureData.data);
```

### 4. 采样器创建

```typescript
const sampler = runner.device.createSampler({
  magFilter: MSpec.RHIFilterMode.LINEAR,
  minFilter: MSpec.RHIFilterMode.LINEAR,
  mipmapFilter: MSpec.RHIFilterMode.NEAREST,
  addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  label: 'Texture Sampler',
});
```

### 5. 绑定组配置

```typescript
// 纹理绑定组布局
const textureBindGroupLayout = runner.device.createBindGroupLayout([
  {
    binding: 0,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture',
  },
  {
    binding: 1,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler',
  },
]);

// 绑定组
const textureBindGroup = runner.device.createBindGroup(textureBindGroupLayout, [
  { binding: 0, resource: texture.createView() },
  { binding: 1, resource: sampler },
]);
```

### 6. 着色器实现

**顶点着色器：**

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

**片段着色器：**

```glsl
#version 300 es
precision mediump float;

uniform sampler2D uTexture;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  fragColor = texColor;
}
```

## 资源依赖

- `demo/assets/texture/758px-Canestra_di_frutta_(Caravaggio).jpg` - Caravaggio 水果静物画

## 相关文件

- `demo/src/texture-2d.ts` - 主程序
- `demo/html/texture-2d.html` - HTML 页面
- `demo/src/utils/texture/TextureLoader.ts` - 纹理加载工具
- `demo/src/utils/texture/ProceduralTexture.ts` - 程序化纹理生成器

## 交互控制

- **ESC**: 退出 Demo
- **F11**: 切换全屏
- **鼠标左键拖动**: 旋转视角
- **鼠标滚轮**: 缩放
- **鼠标右键拖动**: 平移

## 技术注意事项

1. **Y 轴翻转**: WebGL 纹理坐标原点在左下角，而图片数据通常从左上角开始，需要 `flipY: true`
2. **绑定组分离**: 变换矩阵和纹理使用不同的绑定组，便于纹理切换
3. **纹理视图**: 使用 `texture.createView()` 创建纹理视图用于绑定
4. **程序化纹理**: UV Debug 纹理可用于调试纹理坐标映射问题

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

# Texture 2D Demo 实现参考

## 概述

texture-2d 是 RHI Demo 系统第二层（纹理系统）的第一个演示，展示基础 2D 纹理的加载、创建和采样功能。

## 功能演示

- **TextureLoader** 加载外部图片资源（Caravaggio 静物画）
- **ProceduralTexture** 生成程序化纹理（UV 调试、棋盘格）
- 多纹理对比显示在三个平面上
- 基础纹理采样和 UV 映射

## 核心技术点

### 1. 纹理加载

使用 `TextureLoader` 工具类加载外部图片：

```typescript
const textureData = await TextureLoader.load(config.source, {
  flipY: true,           // Y 轴翻转（符合 WebGL 坐标系）
  generateMipmaps: false, // 不生成 Mipmap
  format: 'rgba8-unorm',  // 纹理格式
});
```

### 2. 程序化纹理生成

使用 `ProceduralTexture` 生成测试纹理：

```typescript
// UV 调试纹理 (R=U, G=V)
const uvDebug = ProceduralTexture.uvDebug({ width: 512, height: 512 });

// 棋盘格纹理
const checkerboard = ProceduralTexture.checkerboard({
  width: 512,
  height: 512,
  cellSize: 32,
  colorA: [255, 255, 255, 255],
  colorB: [64, 64, 64, 255],
});
```

### 3. RHI 纹理创建

```typescript
const texture = runner.device.createTexture({
  width: textureData.width,
  height: textureData.height,
  format: MSpec.RHITextureFormat.RGBA8_UNORM,
  usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
  label: 'Texture Name',
});

// 上传像素数据
texture.update(textureData.data);
```

### 4. 采样器创建

```typescript
const sampler = runner.device.createSampler({
  magFilter: MSpec.RHIFilterMode.LINEAR,
  minFilter: MSpec.RHIFilterMode.LINEAR,
  mipmapFilter: MSpec.RHIFilterMode.NEAREST,
  addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  label: 'Texture Sampler',
});
```

### 5. 绑定组配置

```typescript
// 纹理绑定组布局
const textureBindGroupLayout = runner.device.createBindGroupLayout([
  {
    binding: 0,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture',
  },
  {
    binding: 1,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler',
  },
]);

// 绑定组
const textureBindGroup = runner.device.createBindGroup(textureBindGroupLayout, [
  { binding: 0, resource: texture.createView() },
  { binding: 1, resource: sampler },
]);
```

### 6. 着色器实现

**顶点着色器：**

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

**片段着色器：**

```glsl
#version 300 es
precision mediump float;

uniform sampler2D uTexture;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  fragColor = texColor;
}
```

## 资源依赖

- `demo/assets/texture/758px-Canestra_di_frutta_(Caravaggio).jpg` - Caravaggio 水果静物画

## 相关文件

- `demo/src/texture-2d.ts` - 主程序
- `demo/html/texture-2d.html` - HTML 页面
- `demo/src/utils/texture/TextureLoader.ts` - 纹理加载工具
- `demo/src/utils/texture/ProceduralTexture.ts` - 程序化纹理生成器

## 交互控制

- **ESC**: 退出 Demo
- **F11**: 切换全屏
- **鼠标左键拖动**: 旋转视角
- **鼠标滚轮**: 缩放
- **鼠标右键拖动**: 平移

## 技术注意事项

1. **Y 轴翻转**: WebGL 纹理坐标原点在左下角，而图片数据通常从左上角开始，需要 `flipY: true`
2. **绑定组分离**: 变换矩阵和纹理使用不同的绑定组，便于纹理切换
3. **纹理视图**: 使用 `texture.createView()` 创建纹理视图用于绑定
4. **程序化纹理**: UV Debug 纹理可用于调试纹理坐标映射问题

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

# Texture 2D Demo 实现参考

## 概述

texture-2d 是 RHI Demo 系统第二层（纹理系统）的第一个演示，展示基础 2D 纹理的加载、创建和采样功能。

## 功能演示

- **TextureLoader** 加载外部图片资源（Caravaggio 静物画）
- **ProceduralTexture** 生成程序化纹理（UV 调试、棋盘格）
- 多纹理对比显示在三个平面上
- 基础纹理采样和 UV 映射

## 核心技术点

### 1. 纹理加载

使用 `TextureLoader` 工具类加载外部图片：

```typescript
const textureData = await TextureLoader.load(config.source, {
  flipY: true,           // Y 轴翻转（符合 WebGL 坐标系）
  generateMipmaps: false, // 不生成 Mipmap
  format: 'rgba8-unorm',  // 纹理格式
});
```

### 2. 程序化纹理生成

使用 `ProceduralTexture` 生成测试纹理：

```typescript
// UV 调试纹理 (R=U, G=V)
const uvDebug = ProceduralTexture.uvDebug({ width: 512, height: 512 });

// 棋盘格纹理
const checkerboard = ProceduralTexture.checkerboard({
  width: 512,
  height: 512,
  cellSize: 32,
  colorA: [255, 255, 255, 255],
  colorB: [64, 64, 64, 255],
});
```

### 3. RHI 纹理创建

```typescript
const texture = runner.device.createTexture({
  width: textureData.width,
  height: textureData.height,
  format: MSpec.RHITextureFormat.RGBA8_UNORM,
  usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
  label: 'Texture Name',
});

// 上传像素数据
texture.update(textureData.data);
```

### 4. 采样器创建

```typescript
const sampler = runner.device.createSampler({
  magFilter: MSpec.RHIFilterMode.LINEAR,
  minFilter: MSpec.RHIFilterMode.LINEAR,
  mipmapFilter: MSpec.RHIFilterMode.NEAREST,
  addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  label: 'Texture Sampler',
});
```

### 5. 绑定组配置

```typescript
// 纹理绑定组布局
const textureBindGroupLayout = runner.device.createBindGroupLayout([
  {
    binding: 0,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture',
  },
  {
    binding: 1,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler',
  },
]);

// 绑定组
const textureBindGroup = runner.device.createBindGroup(textureBindGroupLayout, [
  { binding: 0, resource: texture.createView() },
  { binding: 1, resource: sampler },
]);
```

### 6. 着色器实现

**顶点着色器：**

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

**片段着色器：**

```glsl
#version 300 es
precision mediump float;

uniform sampler2D uTexture;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  fragColor = texColor;
}
```

## 资源依赖

- `demo/assets/texture/758px-Canestra_di_frutta_(Caravaggio).jpg` - Caravaggio 水果静物画

## 相关文件

- `demo/src/texture-2d.ts` - 主程序
- `demo/html/texture-2d.html` - HTML 页面
- `demo/src/utils/texture/TextureLoader.ts` - 纹理加载工具
- `demo/src/utils/texture/ProceduralTexture.ts` - 程序化纹理生成器

## 交互控制

- **ESC**: 退出 Demo
- **F11**: 切换全屏
- **鼠标左键拖动**: 旋转视角
- **鼠标滚轮**: 缩放
- **鼠标右键拖动**: 平移

## 技术注意事项

1. **Y 轴翻转**: WebGL 纹理坐标原点在左下角，而图片数据通常从左上角开始，需要 `flipY: true`
2. **绑定组分离**: 变换矩阵和纹理使用不同的绑定组，便于纹理切换
3. **纹理视图**: 使用 `texture.createView()` 创建纹理视图用于绑定
4. **程序化纹理**: UV Debug 纹理可用于调试纹理坐标映射问题
