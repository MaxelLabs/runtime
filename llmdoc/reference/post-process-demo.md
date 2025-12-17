---
title: "后处理系统参考"
id: "post-process-demo"
type: "reference"
tags: ["post-processing", "bloom", "fxaa", "render-to-texture", "fullscreen-effects"]
category: "rendering"
demo_type: "interactive"
related_ids: ["pbr-material-system", "render-to-texture-demo", "shadow-mapping-demo"]
difficulty: "intermediate"
prerequisites: ["离屏渲染", "纹理采样", "着色器编程"]
version: "1.0.0"
status: "complete"
last_updated: "2025-12-17"
---

# 后处理系统参考文档

## 🎯 学习目标

完成本文档后，您将能够：
- 实现完整的后处理渲染管线
- 创建 Bloom 泛光效果
- 应用 FXAA 抗锯齿
- 管理 Ping-Pong 缓冲区
- 扩展自定义后处理效果

## ⚠️ 禁止事项

- **禁止** 在后处理 Pass 中使用深度测试 - 全屏效果不需要深度
- **禁止** 每帧重新创建 BindGroup - 使用缓存或仅在纹理变化时更新
- **禁止** 使用过低的 Bloom 阈值 - 会导致整个画面发光
- **禁止** 忽略色调压缩 - HDR 值需要映射回 [0,1] 范围

## 🔧 核心接口定义

### IPostProcessEffect

```typescript
interface IPostProcessEffect {
  readonly name: string;
  enabled: boolean;

  // 应用后处理效果
  apply(
    encoder: IRHICommandEncoder,
    inputTexture: IRHITextureView,
    outputTexture: IRHITextureView
  ): void;

  // 设置效果参数
  setParameters(params: Record<string, any>): void;

  // 销毁资源
  destroy(): void;
}
```

### BloomOptions

```typescript
interface BloomOptions {
  threshold?: number;   // 亮度阈值 (default: 0.3)
  intensity?: number;   // 发光强度 (default: 2.5)
  radius?: number;      // 模糊半径 (default: 8)
}
```

### FXAAOptions

```typescript
interface FXAAOptions {
  subpixelQuality?: number;    // 子像素质量 (default: 0.75)
  edgeThreshold?: number;      // 边缘阈值 (default: 0.166)
  edgeThresholdMin?: number;   // 最小边缘阈值 (default: 0.0833)
}
```

## 渲染管线架构

```
┌─────────────────────────────────────────────────────────────┐
│                    后处理渲染管线                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Pass 1: Scene Render                                       │
│  ┌─────────────┐                                            │
│  │ PBR 材质    │ ──→ sceneRenderTarget (离屏纹理)           │
│  │ 3D 几何体   │     + depthTexture                         │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  Pass 2: Bloom                                              │
│  ┌─────────────┐                                            │
│  │ 高亮提取    │                                            │
│  │ 高斯模糊    │ ──→ bloomRenderTarget                      │
│  │ 颜色叠加    │                                            │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  Pass 3: FXAA                                               │
│  ┌─────────────┐                                            │
│  │ 边缘检测    │                                            │
│  │ 抗锯齿混合  │ ──→ 屏幕 (Canvas)                          │
│  └─────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Bloom 效果实现

### 算法概述

```
1. 高亮提取 (Threshold Extraction)
   - 使用 knee curve 软阈值
   - 提取亮度 > threshold 的像素

2. 高斯模糊 (Gaussian Blur)
   - 7-tap 采样核
   - 8 方向采样 (水平、垂直、4 对角线)

3. 颜色合成 (Compositing)
   - 原图 + bloom * intensity
   - 色调压缩避免过曝
```

### 高亮提取算法 (Knee Curve)

```glsl
vec3 extractBright(vec3 color, float threshold) {
  float brightness = luminance(color);

  // Knee curve 软过渡
  float knee = threshold * 0.5;
  float soft = brightness - threshold + knee;
  soft = clamp(soft, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 0.00001);

  // 选择较大贡献
  float contribution = max(soft, brightness - threshold);
  contribution = max(contribution, 0.0);

  // 归一化应用
  return brightness > 0.0001
    ? color * (contribution / brightness)
    : vec3(0.0);
}
```

### 推荐参数配置

| 场景 | threshold | intensity | radius |
|------|-----------|-----------|--------|
| 柔和发光 | 0.5 | 1.0 | 4 |
| 明显泛光 | 0.3 | 2.5 | 8 |
| 强烈光晕 | 0.2 | 4.0 | 12 |
| HDR 场景 | 0.8 | 1.5 | 6 |

## FXAA 效果实现

### 算法概述

```
1. 亮度采样 (5点 + 4对角)
2. 对比度检测 (lumaRange)
3. 边缘方向判断 (水平 vs 垂直)
4. 子像素混合
```

### 关键着色器代码

```glsl
// 计算亮度
float rgb2luma(vec3 rgb) {
  return dot(rgb, vec3(0.299, 0.587, 0.114));
}

// 对比度检测
float lumaRange = lumaMax - lumaMin;
if (lumaRange < max(edgeThresholdMin, lumaMax * edgeThreshold)) {
  // 低对比度区域，跳过 FXAA
  return originalColor;
}
```

## 程序化全屏三角形

### 顶点着色器 (无顶点缓冲)

```glsl
#version 300 es
out vec2 vUV;

void main() {
  // 根据 gl_VertexID 生成位置
  float x = float((gl_VertexID & 1) << 2) - 1.0;
  float y = float((gl_VertexID & 2) << 1) - 1.0;

  vUV = vec2((x + 1.0) * 0.5, (y + 1.0) * 0.5);
  gl_Position = vec4(x, y, 0.0, 1.0);
}
```

### GLCommandBuffer 支持

```typescript
// GLCommandBuffer.ts - executeDraw()
if (enabledAttribs.length === 0) {
  // 允许程序化全屏三角形绘制 (gl_VertexID)
  if (vertexCount === 3) {
    // 合法的程序化绘制，继续执行
  } else {
    console.error('绘制失败: 没有启用顶点属性');
    return;
  }
}
```

## 📝 Few-Shot 示例

### 问题1：Bloom 效果不明显

**解决方案**：
```typescript
// 1. 降低阈值
bloomEffect.setParameters({ threshold: 0.3 });

// 2. 增强光源亮度
const lightParams = {
  color: [5.0, 5.0, 5.0], // HDR 值 > 1.0
};

// 3. 增加强度和半径
bloomEffect.setParameters({
  intensity: 2.5,
  radius: 8,
});
```

### 问题2：绘制失败 - 没有启用顶点属性

**原因**：后处理使用程序化全屏三角形，不需要顶点缓冲

**解决方案**：
```typescript
// GLCommandBuffer 已修复支持 vertexCount === 3 的程序化绘制
// 确保管线配置正确
const pipeline = device.createRenderPipeline({
  vertexLayout: { buffers: [] }, // 空顶点布局
  // ...
});

// 绘制时使用 3 个顶点
renderPass.draw(3, 1, 0, 0);
```

### 问题3：BindGroupLayout 缺少 viewDimension

**解决方案**：
```typescript
// 纹理绑定必须同时指定 sampleType 和 viewDimension
{
  binding: 0,
  visibility: RHIShaderStage.FRAGMENT,
  texture: {
    sampleType: 'float',
    viewDimension: '2d',  // 必须指定！
  },
}
```

## 使用示例

### 创建后处理链

```typescript
// 1. 创建渲染目标
const sceneRT = new RenderTarget(device, {
  width, height,
  colorFormat: RHITextureFormat.RGBA8_UNORM,
  depthFormat: RHITextureFormat.DEPTH24_UNORM_STENCIL8,
});

const bloomRT = new RenderTarget(device, {
  width, height,
  colorFormat: RHITextureFormat.RGBA8_UNORM,
});

// 2. 创建效果
const bloom = new Bloom(device, {
  threshold: 0.3,
  intensity: 2.5,
  radius: 8,
});

const fxaa = new FXAA(device, {
  subpixelQuality: 0.75,
});

// 3. 渲染循环
// Pass 1: 场景 → sceneRT
// Pass 2: bloom.apply(encoder, sceneRT.view, bloomRT.view)
// Pass 3: fxaa.apply(encoder, bloomRT.view, screenView)
```

## 性能考虑

| 效果 | 纹理采样次数 | GPU 开销 | 推荐场景 |
|------|-------------|---------|---------|
| Bloom (7-tap) | ~50/像素 | 中 | 桌面端 |
| Bloom (5-tap) | ~25/像素 | 低 | 移动端 |
| FXAA | ~9/像素 | 低 | 所有平台 |

## 相关文档

- [PBR 材质系统](/llmdoc/reference/pbr-material-system.md)
- [离屏渲染 Demo](/llmdoc/reference/render-to-texture-demo.md)
- [阴影贴图 Demo](/llmdoc/reference/shadow-mapping-demo.md)
