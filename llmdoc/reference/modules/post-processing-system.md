# 后处理系统文档

## 概述

后处理系统（Post-Processing System）是一个强大的图像处理框架，支持在场景渲染完成后对图像应用各种视觉效果。系统采用管道式设计，支持多效果链式组合和Ping-Pong缓冲区技术。

## 系统架构

### 核心组件

```
PostProcessManager
├── Ping-Pong 缓冲区 (2个RenderTarget)
├── 效果链 (PostProcessEffect[])
├── 资源管理器
└── 性能统计
```

### 工作流程

1. **场景渲染** → 离屏纹理
2. **后处理链** → 逐个效果处理
3. **最终输出** → 屏幕显示

```
Scene → [RenderTarget] → Effect1 → [RenderTarget] → Effect2 → [RenderTarget] → Screen
```

## 核心类：PostProcessManager

### 构造函数

```typescript
const postProcess = new PostProcessManager(device, {
  width: 1920,
  height: 1080,
  colorFormat: RHITextureFormat.RGBA8_UNORM,
  useHDR: false,
  label: 'PostProcessManager'
});
```

### 主要方法

#### 效果管理
```typescript
// 添加效果
postProcess.addEffect(new Bloom({ intensity: 1.5 }));
postProcess.addEffect(new FXAA());
postProcess.addEffect(new ToneMapping({ mode: 'aces' }));

// 移除效果
postProcess.removeEffect(bloomEffect);

// 清空所有效果
postProcess.clearEffects();

// 获取效果列表
const effects = postProcess.getEffects();
```

#### 渲染处理
```typescript
// 应用后处理链
const encoder = device.createCommandEncoder();
const sceneTexture = sceneRenderTarget.getColorView(0);
const finalTexture = postProcess.process(encoder, sceneTexture);
```

#### 资源管理
```typescript
// 调整缓冲区大小
postProcess.resize(width, height);

// 销毁资源
postProcess.destroy();

// 获取性能统计
const stats = postProcess.getStats();
console.log(`Effects: ${stats.enabledEffectCount}/${stats.effectCount}`);
console.log(`Memory: ${stats.totalMemoryUsage / 1024 / 1024} MB`);
```

## 内置效果列表

### 1. 亮度/对比度 (BrightnessContrast)

调整图像的亮度和对比度。

```typescript
const brightnessContrast = new BrightnessContrast(device, {
  brightness: 0.0,    // -0.5 到 0.5
  contrast: 1.0       // 0.5 到 2.0
});

// 动态调整
brightnessContrast.setParameters({
  brightness: 0.2,
  contrast: 1.3
});
```

### 2. 高斯模糊 (GaussianBlur)

可调节半径的高斯模糊效果。

```typescript
const gaussianBlur = new GaussianBlur(device, {
  radius: 2.0,    // 0.5 到 10.0
  iterations: 1   // 迭代次数
});

// 动态调整
gaussianBlur.setParameters({ radius: 3.0 });
```

### 3. 色调映射 (ToneMapping)

HDR到LDR的色调映射，支持多种算法。

```typescript
const toneMapping = new ToneMapping(device, {
  mode: 'aces',        // 'none', 'reinhard', 'aces'
  exposure: 1.0,       // 曝光强度
  gamma: 2.2          // 伽马校正
});

// 动态调整
toneMapping.setParameters({
  exposure: 1.5,
  mode: 'reinhard'
});
```

### 4. FXAA抗锯齿 (Fast Approximate Anti-Aliasing)

快速近似抗锯齿，性能开销低。

```typescript
const fxaa = new FXAA(device, {
  subpixelQuality: 0.75,    // 0.0 到 1.0
  edgeThreshold: 0.166,     // 0.063 到 0.333
  edgeThresholdMin: 0.0833  // 0.0 到 0.1
});
```

## 自定义效果开发

### 基础结构

```typescript
import { PostProcessEffect } from '../PostProcessEffect';

class CustomEffect extends PostProcessEffect {
  private uniformBuffer: RHIBuffer | null = null;

  constructor(device: RHIHIDevice, options = {}) {
    super(device, { ...options, name: 'CustomEffect' });
    this.createResources();
  }

  protected createPipeline(): void {
    // 创建着色器和渲染管线
    const vertexShader = this.device.createShaderModule({
      code: this.getFullscreenVertexShader(),
      language: 'glsl',
      stage: RHIShaderStage.VERTEX,
    });

    const fragmentShader = this.device.createShaderModule({
      code: this.getFragmentShader(),
      language: 'glsl',
      stage: RHIShaderStage.FRAGMENT,
    });

    // ... 管线创建逻辑
  }

  protected getFragmentShader(): string {
    return `#version 300 es
precision mediump float;

in vec2 vUV;
uniform sampler2D uTexture;
out vec4 fragColor;

void main() {
  vec4 color = texture(uTexture, vUV);
  // 自定义处理逻辑
  fragColor = color;
}`;
  }

  public apply(encoder: RHICommandEncoder,
               inputTexture: RHITextureView,
               outputTexture: RHITextureView): void {
    // 实现效果应用逻辑
  }
}
```

### 着色器模板

#### 顶点着色器（全屏三角形）

```glsl
#version 300 es
precision highp float;

out vec2 vUV;

void main() {
  float x = float((gl_VertexID & 1) << 2) - 1.0;
  float y = float((gl_VertexID & 2) << 1) - 1.0;
  vUV = vec2((x + 1.0) * 0.5, (y + 1.0) * 0.5);
  gl_Position = vec4(x, y, 0.0, 1.0);
}
```

## 性能优化指南

### 1. 缓冲区优化

- **HDR vs LDR**：根据需求选择合适的格式
- **分辨率缩放**：对性能敏感场景可降低分辨率

```typescript
// LDR模式（默认）
const postProcess = new PostProcessManager(device, {
  width, height,
  useHDR: false
});

// HDR模式
const postProcess = new PostProcessManager(device, {
  width, height,
  useHDR: true
});
```

### 2. 效果组合优化

```typescript
// 好的做法：按计算强度排序
postProcess.addEffect(bloom);        // 轻量级
postProcess.addEffect(gaussianBlur); // 中等
postProcess.addEffect(fxaa);         // 轻量级
postProcess.addEffect(toneMapping);  // 轻量级

// 避免：重复的高强度效果
postProcess.addEffect(motionBlur);   // 高强度
postProcess.addEffect(dof);          // 高强度
```

### 3. 动态效果管理

```typescript
// 基于性能动态启用/禁用效果
const updateEffects = (fps: number) => {
  if (fps < 30) {
    gaussianBlur.enabled = false;
    bloom.enabled = false;
  } else if (fps < 60) {
    gaussianBlur.enabled = false;
    bloom.enabled = true;
  } else {
    gaussianBlur.enabled = true;
    bloom.enabled = true;
  }
};
```

### 4. 内存管理

```typescript
// 窗口大小改变时重建缓冲区
window.addEventListener('resize', () => {
  postProcess.resize(window.innerWidth, window.innerHeight);
});

// 及时销毁不用的效果
oldEffect.destroy();
postProcess.removeEffect(oldEffect);
```

## 完整使用示例

```typescript
import {
  PostProcessManager,
  BrightnessContrast,
  GaussianBlur,
  ToneMapping,
  FXAA
} from './utils/postprocess';

class RenderingDemo {
  private postProcess: PostProcessManager;
  private effects: PostProcessEffect[] = [];

  constructor(device: RHIHIDevice, width: number, height: number) {
    // 创建后处理管理器
    this.postProcess = new PostProcessManager(device, {
      width, height,
      useHDR: false,
      label: 'Demo PostProcess'
    });

    // 创建效果
    this.createEffects();
  }

  private createEffects(): void {
    // 亮度/对比度
    const brightnessContrast = new BrightnessContrast(device, {
      brightness: 0.0,
      contrast: 1.2
    });

    // 高斯模糊
    const gaussianBlur = new GaussianBlur(device, {
      radius: 1.5
    });

    // FXAA抗锯齿
    const fxaa = new FXAA(device, {
      subpixelQuality: 0.75,
      edgeThreshold: 0.166
    });

    // 添加到管理器
    this.effects = [brightnessContrast, gaussianBlur, fxaa];
    this.effects.forEach(effect => {
      this.postProcess.addEffect(effect);
    });
  }

  public render(encoder: RHICommandEncoder, sceneTexture: RHITextureView): RHITextureView {
    // 应用后处理链
    return this.postProcess.process(encoder, sceneTexture);
  }

  public updateQuality(quality: 'low' | 'medium' | 'high'): void {
    switch (quality) {
      case 'low':
        this.effects[1].enabled = false; // 关闭模糊
        this.effects[2].enabled = false; // 关闭FXAA
        break;
      case 'medium':
        this.effects[1].enabled = false; // 关闭模糊
        this.effects[2].enabled = true;  // 开启FXAA
        break;
      case 'high':
        this.effects[1].enabled = true;  // 开启模糊
        this.effects[2].enabled = true;  // 开启FXAA
        break;
    }
  }

  public destroy(): void {
    this.postProcess.destroy();
    this.effects.forEach(effect => effect.destroy());
  }
}
```

## 故障排除

### 常见问题

1. **效果不生效**
   - 检查effect.enabled状态
   - 确认正确调用process方法
   - 验证输入输出纹理格式

2. **性能问题**
   - 监控stats.getStats()的性能数据
   - 减少高强度效果数量
   - 考虑降低分辨率

3. **内存泄漏**
   - 确保调用destroy()方法
   - 检查资源追踪器的使用
   - 验证缓冲区大小调整逻辑

### 调试工具

```typescript
// 启用性能监控
const stats = postProcess.getStats();
setInterval(() => {
  console.log(`PostProcess Stats:`, {
    effects: `${stats.enabledEffectCount}/${stats.effectCount}`,
    memory: `${(stats.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`,
    bufferCount: stats.bufferCount
  });
}, 1000);
```

## 参考链接

- [FXAA抗锯齿文档](./fxaa-anti-aliasing.md)
- [渲染管线整合文档](../advanced/integration/rendering-pipeline.md)
- [性能优化指南](../advanced/optimization/performance.md)