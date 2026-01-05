---
id: "strategy-post-processing"
type: "strategy"
title: "后处理框架技术规格"
description: "Engine 包后处理系统的详细技术规格，包括 Bloom、Tone Mapping、FXAA 等效果"
tags: ["engine", "post-processing", "bloom", "tone-mapping", "fxaa", "render-target"]
context_dependency: ["arch-engine-architecture-spec"]
related_ids: ["arch-engine-architecture-spec"]
last_updated: "2026-01-05"
---

# 后处理框架技术规格

> **Context**: Engine 包需要后处理系统以实现高质量视觉效果。
> **Goal**: 设计可扩展的后处理框架，支持常见效果如 Bloom、Tone Mapping、FXAA。

---

## 1. 设计目标

### 1.1 功能需求

| 需求 | 描述 | 优先级 |
|------|------|:------:|
| 后处理管线 | 可配置的效果链 | P1 |
| Bloom | 泛光效果 | P1 |
| Tone Mapping | HDR 到 LDR 映射 | P1 |
| FXAA | 快速抗锯齿 | P1 |
| Vignette | 暗角效果 | P2 |
| Color Grading | 颜色分级 | P2 |
| SSAO | 屏幕空间环境光遮蔽 | P3 |
| DOF | 景深效果 | P3 |

### 1.2 性能目标

- 后处理总开销 < 4ms (1080p)
- 支持效果开关和质量级别
- 最小化 Render Target 切换

---

## 2. 架构设计

### 2.1 后处理管线流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     Post-Processing Pipeline                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Scene RT (HDR)                                                  │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐       │
│  │  Bloom  │───▶│  Tone   │───▶│  FXAA   │───▶│ Output  │       │
│  │         │    │ Mapping │    │         │    │         │       │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘       │
│       │                                                          │
│       ▼                                                          │
│  Bloom Chain:                                                    │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐                         │
│  │1/2 │─▶│1/4 │─▶│1/8 │─▶│1/16│─▶│1/32│  Downsample             │
│  └────┘  └────┘  └────┘  └────┘  └────┘                         │
│                                    │                             │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐                         │
│  │1/2 │◀─│1/4 │◀─│1/8 │◀─│1/16│◀─│1/32│  Upsample + Blur        │
│  └────┘  └────┘  └────┘  └────┘  └────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Render Target 管理

```typescript
/**
 * Render Target 描述
 */
interface RenderTargetDesc {
  width: number;
  height: number;
  format: TextureFormat;
  /** 是否需要深度 */
  depth?: boolean;
  /** 采样数 MSAA */
  samples?: number;
  /** 是否可作为采样纹理 */
  sampled?: boolean;
}

/**
 * Render Target 池
 * 复用临时 RT 减少内存分配
 */
interface IRenderTargetPool {
  /**
   * 获取临时 RT
   */
  acquire(desc: RenderTargetDesc): IRHITexture;
  
  /**
   * 释放临时 RT
   */
  release(rt: IRHITexture): void;
  
  /**
   * 清理未使用的 RT
   */
  cleanup(): void;
}
```

---

## 3. 接口定义

### 3.1 后处理效果接口

```typescript
/**
 * 后处理效果基类接口
 */
interface IPostProcessEffect {
  /** 效果名称 */
  readonly name: string;
  /** 是否启用 */
  enabled: boolean;
  /** 渲染顺序 */
  order: number;
  
  /**
   * 初始化资源
   */
  initialize(device: IRHIDevice): void;
  
  /**
   * 渲染效果
   * @param input 输入纹理
   * @param output 输出 RT
   * @param context 渲染上下文
   */
  render(
    input: IRHITexture,
    output: IRHITexture,
    context: PostProcessContext
  ): void;
  
  /**
   * 窗口大小改变时调用
   */
  resize(width: number, height: number): void;
  
  /**
   * 释放资源
   */
  dispose(): void;
}

/**
 * 后处理上下文
 */
interface PostProcessContext {
  device: IRHIDevice;
  commandEncoder: IRHICommandEncoder;
  rtPool: IRenderTargetPool;
  /** 全屏四边形 */
  fullscreenQuad: IRHIBuffer;
  /** 当前帧时间 */
  time: number;
  /** 视口大小 */
  viewport: { width: number; height: number };
}
```

### 3.2 后处理管线接口

```typescript
/**
 * 后处理管线配置
 */
interface PostProcessPipelineConfig {
  /** HDR 格式 */
  hdrFormat?: TextureFormat;
  /** 是否启用 MSAA */
  msaa?: number;
}

/**
 * 后处理管线
 */
interface IPostProcessPipeline {
  /** 效果列表 */
  readonly effects: IPostProcessEffect[];
  
  /**
   * 添加效果
   */
  addEffect(effect: IPostProcessEffect): void;
  
  /**
   * 移除效果
   */
  removeEffect(effect: IPostProcessEffect): void;
  
  /**
   * 获取效果
   */
  getEffect<T extends IPostProcessEffect>(name: string): T | null;
  
  /**
   * 执行后处理
   * @param sceneRT 场景渲染结果
   * @param outputRT 最终输出
   */
  execute(sceneRT: IRHITexture, outputRT: IRHITexture): void;
}
```

---

## 4. Bloom 效果实现

### 4.1 Bloom 配置

```typescript
interface BloomConfig {
  /** 亮度阈值 默认 1.0 */
  threshold?: number;
  /** 软阈值 默认 0.5 */
  softThreshold?: number;
  /** 强度 默认 1.0 */
  intensity?: number;
  /** 散射 默认 0.7 */
  scatter?: number;
  /** 迭代次数 默认 5 */
  iterations?: number;
}
```

### 4.2 Bloom 实现伪代码

```pseudocode
CLASS BloomEffect IMPLEMENTS IPostProcessEffect:
  name = "Bloom"
  
  // 资源
  PRIVATE downsamplePipeline: IRHIPipeline
  PRIVATE upsamplePipeline: IRHIPipeline
  PRIVATE thresholdPipeline: IRHIPipeline
  PRIVATE mipChain: IRHITexture[]
  
  FUNCTION initialize(device: IRHIDevice):
    // 创建着色器
    thresholdShader = createShader(THRESHOLD_SHADER)
    downsampleShader = createShader(DOWNSAMPLE_SHADER)
    upsampleShader = createShader(UPSAMPLE_SHADER)
    
    // 创建管线
    thresholdPipeline = createPipeline(thresholdShader)
    downsamplePipeline = createPipeline(downsampleShader)
    upsamplePipeline = createPipeline(upsampleShader)
  
  FUNCTION render(input: IRHITexture, output: IRHITexture, ctx: PostProcessContext):
    // Step 1: 亮度提取
    brightRT = ctx.rtPool.acquire({
      width: ctx.viewport.width / 2,
      height: ctx.viewport.height / 2,
      format: RGBA16F
    })
    
    renderPass(thresholdPipeline, {
      input: input,
      output: brightRT,
      uniforms: { threshold, softThreshold }
    })
    
    // Step 2: 降采样链
    currentRT = brightRT
    FOR i = 0 TO iterations - 1:
      nextWidth = max(1, currentRT.width / 2)
      nextHeight = max(1, currentRT.height / 2)
      
      nextRT = ctx.rtPool.acquire({
        width: nextWidth,
        height: nextHeight,
        format: RGBA16F
      })
      
      renderPass(downsamplePipeline, {
        input: currentRT,
        output: nextRT,
        uniforms: { texelSize: [1/currentRT.width, 1/currentRT.height] }
      })
      
      mipChain[i] = currentRT
      currentRT = nextRT
    
    // Step 3: 升采样链 + 模糊
    FOR i = iterations - 2 DOWNTO 0:
      prevRT = mipChain[i]
      
      blendRT = ctx.rtPool.acquire({
        width: prevRT.width,
        height: prevRT.height,
        format: RGBA16F
      })
      
      renderPass(upsamplePipeline, {
        input: currentRT,
        blend: prevRT,
        output: blendRT,
        uniforms: { 
          texelSize: [1/currentRT.width, 1/currentRT.height],
          scatter: scatter
        }
      })
      
      ctx.rtPool.release(currentRT)
      currentRT = blendRT
    
    // Step 4: 合成到输出
    renderPass(compositePipeline, {
      scene: input,
      bloom: currentRT,
      output: output,
      uniforms: { intensity }
    })
    
    // 释放资源
    ctx.rtPool.release(currentRT)
    FOR rt IN mipChain:
      ctx.rtPool.release(rt)
```

### 4.3 Bloom 着色器

```glsl
// ==================== Threshold Shader ====================
// threshold.frag
precision highp float;

uniform sampler2D u_input;
uniform float u_threshold;
uniform float u_softThreshold;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec4 color = texture(u_input, v_uv);
    
    // 计算亮度
    float brightness = max(color.r, max(color.g, color.b));
    
    // 软阈值
    float knee = u_threshold * u_softThreshold;
    float soft = brightness - u_threshold + knee;
    soft = clamp(soft, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee + 0.00001);
    
    float contribution = max(soft, brightness - u_threshold);
    contribution /= max(brightness, 0.00001);
    
    fragColor = color * contribution;
}

// ==================== Downsample Shader ====================
// downsample.frag
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_texelSize;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    // 13-tap downsample filter
    vec4 A = texture(u_input, v_uv + u_texelSize * vec2(-1.0, -1.0));
    vec4 B = texture(u_input, v_uv + u_texelSize * vec2( 0.0, -1.0));
    vec4 C = texture(u_input, v_uv + u_texelSize * vec2( 1.0, -1.0));
    vec4 D = texture(u_input, v_uv + u_texelSize * vec2(-0.5, -0.5));
    vec4 E = texture(u_input, v_uv + u_texelSize * vec2( 0.5, -0.5));
    vec4 F = texture(u_input, v_uv + u_texelSize * vec2(-1.0,  0.0));
    vec4 G = texture(u_input, v_uv);
    vec4 H = texture(u_input, v_uv + u_texelSize * vec2( 1.0,  0.0));
    vec4 I = texture(u_input, v_uv + u_texelSize * vec2(-0.5,  0.5));
    vec4 J = texture(u_input, v_uv + u_texelSize * vec2( 0.5,  0.5));
    vec4 K = texture(u_input, v_uv + u_texelSize * vec2(-1.0,  1.0));
    vec4 L = texture(u_input, v_uv + u_texelSize * vec2( 0.0,  1.0));
    vec4 M = texture(u_input, v_uv + u_texelSize * vec2( 1.0,  1.0));
    
    vec4 result = (D + E + I + J) * 0.5;
    result += (A + B + G + F) * 0.125;
    result += (B + C + H + G) * 0.125;
    result += (F + G + L + K) * 0.125;
    result += (G + H + M + L) * 0.125;
    
    fragColor = result * 0.25;
}

// ==================== Upsample Shader ====================
// upsample.frag
precision highp float;

uniform sampler2D u_input;
uniform sampler2D u_blend;
uniform vec2 u_texelSize;
uniform float u_scatter;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    // 9-tap tent filter
    vec4 A = texture(u_input, v_uv + u_texelSize * vec2(-1.0, -1.0));
    vec4 B = texture(u_input, v_uv + u_texelSize * vec2( 0.0, -1.0));
    vec4 C = texture(u_input, v_uv + u_texelSize * vec2( 1.0, -1.0));
    vec4 D = texture(u_input, v_uv + u_texelSize * vec2(-1.0,  0.0));
    vec4 E = texture(u_input, v_uv);
    vec4 F = texture(u_input, v_uv + u_texelSize * vec2( 1.0,  0.0));
    vec4 G = texture(u_input, v_uv + u_texelSize * vec2(-1.0,  1.0));
    vec4 H = texture(u_input, v_uv + u_texelSize * vec2( 0.0,  1.0));
    vec4 I = texture(u_input, v_uv + u_texelSize * vec2( 1.0,  1.0));
    
    vec4 upsample = E * 4.0;
    upsample += (B + D + F + H) * 2.0;
    upsample += (A + C + G + I);
    upsample /= 16.0;
    
    vec4 blend = texture(u_blend, v_uv);
    
    fragColor = mix(blend, upsample, u_scatter);
}
```

---

## 5. Tone Mapping 效果实现

### 5.1 Tone Mapping 配置

```typescript
enum ToneMappingMode {
  LINEAR = 0,
  REINHARD = 1,
  ACES = 2,
  FILMIC = 3
}

interface ToneMappingConfig {
  /** 映射模式 默认 ACES */
  mode?: ToneMappingMode;
  /** 曝光 默认 1.0 */
  exposure?: number;
  /** Gamma 默认 2.2 */
  gamma?: number;
}
```

### 5.2 Tone Mapping 着色器

```glsl
// tonemapping.frag
precision highp float;

uniform sampler2D u_input;
uniform int u_mode;
uniform float u_exposure;
uniform float u_gamma;

in vec2 v_uv;
out vec4 fragColor;

// Reinhard
vec3 reinhardToneMapping(vec3 color) {
    return color / (color + vec3(1.0));
}

// ACES Filmic
vec3 acesToneMapping(vec3 color) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

// Uncharted 2 Filmic
vec3 filmicToneMapping(vec3 color) {
    const float A = 0.15;
    const float B = 0.50;
    const float C = 0.10;
    const float D = 0.20;
    const float E = 0.02;
    const float F = 0.30;
    const float W = 11.2;
    
    vec3 curr = ((color * (A * color + C * B) + D * E) / (color * (A * color + B) + D * F)) - E / F;
    vec3 white = ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;
    
    return curr / white;
}

void main() {
    vec4 color = texture(u_input, v_uv);
    
    // 应用曝光
    vec3 hdr = color.rgb * u_exposure;
    
    // Tone Mapping
    vec3 ldr;
    if (u_mode == 0) {
        ldr = clamp(hdr, 0.0, 1.0);
    } else if (u_mode == 1) {
        ldr = reinhardToneMapping(hdr);
    } else if (u_mode == 2) {
        ldr = acesToneMapping(hdr);
    } else {
        ldr = filmicToneMapping(hdr);
    }
    
    // Gamma 校正
    ldr = pow(ldr, vec3(1.0 / u_gamma));
    
    fragColor = vec4(ldr, color.a);
}
```

---

## 6. FXAA 效果实现

### 6.1 FXAA 配置

```typescript
interface FXAAConfig {
  /** 边缘阈值 默认 0.166 */
  edgeThreshold?: number;
  /** 最小边缘阈值 默认 0.0833 */
  edgeThresholdMin?: number;
  /** 子像素质量 默认 0.75 */
  subpixelQuality?: number;
}
```

### 6.2 FXAA 着色器

```glsl
// fxaa.frag
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_texelSize;
uniform float u_edgeThreshold;
uniform float u_edgeThresholdMin;
uniform float u_subpixelQuality;

in vec2 v_uv;
out vec4 fragColor;

float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
    // 采样周围像素
    vec3 rgbNW = texture(u_input, v_uv + vec2(-1.0, -1.0) * u_texelSize).rgb;
    vec3 rgbNE = texture(u_input, v_uv + vec2( 1.0, -1.0) * u_texelSize).rgb;
    vec3 rgbSW = texture(u_input, v_uv + vec2(-1.0,  1.0) * u_texelSize).rgb;
    vec3 rgbSE = texture(u_input, v_uv + vec2( 1.0,  1.0) * u_texelSize).rgb;
    vec3 rgbM  = texture(u_input, v_uv).rgb;
    
    // 计算亮度
    float lumaNW = luminance(rgbNW);
    float lumaNE = luminance(rgbNE);
    float lumaSW = luminance(rgbSW);
    float lumaSE = luminance(rgbSE);
    float lumaM  = luminance(rgbM);
    
    // 计算对比度
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
    float lumaRange = lumaMax - lumaMin;
    
    // 跳过低对比度区域
    if (lumaRange < max(u_edgeThresholdMin, lumaMax * u_edgeThreshold)) {
        fragColor = vec4(rgbM, 1.0);
        return;
    }
    
    // 计算边缘方向
    float lumaL = (lumaNW + lumaSW) * 0.5;
    float lumaR = (lumaNE + lumaSE) * 0.5;
    float lumaT = (lumaNW + lumaNE) * 0.5;
    float lumaB = (lumaSW + lumaSE) * 0.5;
    
    float gradientH = abs(lumaL - lumaR);
    float gradientV = abs(lumaT - lumaB);
    
    bool isHorizontal = gradientH >= gradientV;
    
    // 计算混合方向
    float gradient = isHorizontal ? gradientH : gradientV;
    float stepLength = isHorizontal ? u_texelSize.y : u_texelSize.x;
    
    float lumaLocalAvg = 0.0;
    if (isHorizontal) {
        lumaLocalAvg = (lumaT + lumaB) * 0.5;
    } else {
        lumaLocalAvg = (lumaL + lumaR) * 0.5;
    }
    
    float lumaCenter = lumaM - lumaLocalAvg;
    float sign = sign(lumaCenter);
    
    // 子像素抗锯齿
    float subpixelOffset = clamp(abs(lumaCenter) / lumaRange, 0.0, 1.0);
    subpixelOffset = (-2.0 * subpixelOffset + 3.0) * subpixelOffset * subpixelOffset;
    subpixelOffset = subpixelOffset * subpixelOffset * u_subpixelQuality;
    
    // 最终采样
    vec2 offset = isHorizontal ? vec2(0.0, sign * stepLength * subpixelOffset) 
                               : vec2(sign * stepLength * subpixelOffset, 0.0);
    
    fragColor = vec4(texture(u_input, v_uv + offset).rgb, 1.0);
}
```

---

## 7. 实现步骤

### 7.1 Step 1: 创建 Render Target 池

**文件**: `packages/engine/src/post-processing/render-target-pool.ts`

### 7.2 Step 2: 创建后处理基类

**文件**: `packages/engine/src/post-processing/post-process-effect.ts`

### 7.3 Step 3: 创建后处理管线

**文件**: `packages/engine/src/post-processing/post-process-pipeline.ts`

### 7.4 Step 4: 实现 Bloom 效果

**文件**: `packages/engine/src/post-processing/effects/bloom.ts`

### 7.5 Step 5: 实现 Tone Mapping 效果

**文件**: `packages/engine/src/post-processing/effects/tone-mapping.ts`

### 7.6 Step 6: 实现 FXAA 效果

**文件**: `packages/engine/src/post-processing/effects/fxaa.ts`

### 7.7 Step 7: 集成到渲染器

**文件**: `packages/engine/src/renderers/simple-webgl-renderer.ts`

---

## 8. 验证标准

- [ ] Bloom 效果正确显示
- [ ] Tone Mapping 各模式正常工作
- [ ] FXAA 边缘平滑有效
- [ ] RT 池正确复用资源
- [ ] 效果可动态开关
- [ ] 性能满足目标

---

## 9. 禁止事项

- 🚫 **每帧创建 RT** - 必须使用 RT 池
- 🚫 **忽略 HDR 格式** - Bloom 必须在 HDR 空间计算
- 🚫 **硬编码分辨率** - 必须支持动态 resize
- 🚫 **忽略 Gamma** - Tone Mapping 后必须 Gamma 校正

---

## 10. 相关文档

- [Engine 架构规格](../architecture/engine-architecture-spec.md)