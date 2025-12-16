# FXAA抗锯齿文档

## 概述

FXAA（Fast Approximate Anti-Aliasing）是一种基于后处理的快速抗锯齿技术。相比传统MSAA，FXAA具有更低的性能开销和实现复杂度，同时能提供接近MSAA的视觉效果质量。

## 算法原理

### 核心思想

FXAA通过分析像素之间的亮度差异来检测边缘，然后对检测到的边缘进行混合处理，从而平滑锯齿。算法主要包含三个步骤：

1. **边缘检测** - 基于亮度梯度的边缘识别
2. **方向性分析** - 确定边缘的主要方向
3. **亚像素混合** - 沿边缘方向进行颜色混合

### 技术特点

- ✅ **后处理技术** - 不需要修改几何渲染管线
- ✅ **性能友好** - 单个全屏Pass，GPU开销低
- ✅ **兼容性强** - 适用于所有渲染内容
- ✅ **内存效率** - 无需额外多重采样缓冲区
- ⚠️ **模糊效应** - 可能轻微损失细节锐度

## API文档

### 构造函数

```typescript
const fxaa = new FXAA(device, {
  subpixelQuality: 0.75,    // 亚像素质量
  edgeThreshold: 0.166,     // 边缘检测阈值
  edgeThresholdMin: 0.0833, // 最小边缘阈值
  name: 'FXAA'              // 调试标签
});
```

### 参数详解

#### subpixelQuality: number
- **范围**: 0.0 - 1.0
- **默认值**: 0.75
- **作用**: 控制亚像素反锯齿的强度
- **影响**: 值越大，细节保留越好，但锯齿减少效果减弱

```typescript
// 高质量（细节优先）
fxaa.setParameters({ subpixelQuality: 1.0 });

// 平衡设置
fxaa.setParameters({ subpixelQuality: 0.75 });

// 强度抗锯齿
fxaa.setParameters({ subpixelQuality: 0.5 });
```

#### edgeThreshold: number
- **范围**: 0.063 - 0.333
- **默认值**: 0.166
- **作用**: 边缘检测的敏感度阈值
- **影响**: 值越小，检测到的边缘越多，抗锯齿越强

```typescript
// 敏感边缘检测（更多抗锯齿）
fxaa.setParameters({ edgeThreshold: 0.083 });

// 标准设置
fxaa.setParameters({ edgeThreshold: 0.166 });

// 粗略边缘检测（保留更多细节）
fxaa.setParameters({ edgeThreshold: 0.250 });
```

#### edgeThresholdMin: number
- **范围**: 0.0 - 0.1
- **默认值**: 0.0833
- **作用**: 最小边缘阈值，防止噪声被误认为边缘
- **影响**: 值越小，细微边缘越容易被处理

```typescript
// 处理细微边缘
fxaa.setParameters({ edgeThresholdMin: 0.0312 });

// 标准设置
fxaa.setParameters({ edgeThresholdMin: 0.0833 });

// 忽略细微边缘
fxaa.setParameters({ edgeThresholdMin: 0.0625 });
```

## 使用示例

### 基础使用

```typescript
import { FXAA, RenderTarget } from './utils';

class FXAADemo {
  private fxaaEffect: FXAA;
  private sceneRenderTarget: RenderTarget;
  private fxaaRenderTarget: RenderTarget;

  constructor(device: RHIDevice, width: number, height: number) {
    // 创建FXAA效果
    this.fxaaEffect = new FXAA(device, {
      subpixelQuality: 0.75,
      edgeThreshold: 0.166,
      edgeThresholdMin: 0.0833
    });

    // 创建场景渲染目标
    this.sceneRenderTarget = new RenderTarget(device, {
      width, height,
      colorFormat: RHITextureFormat.RGBA8_UNORM,
      depthFormat: RHITextureFormat.DEPTH24_UNORM_STENCIL8
    });

    // 创建FXAA输出目标
    this.fxaaRenderTarget = new RenderTarget(device, {
      width, height,
      colorFormat: RHITextureFormat.RGBA8_UNORM,
      depthFormat: null // FXAA不需要深度
    });
  }

  public render(encoder: RHICommandEncoder): void {
    // 1. 渲染场景到离屏纹理
    const scenePass = encoder.beginRenderPass(
      this.sceneRenderTarget.getRenderPassDescriptor()
    );
    // ... 场景渲染代码
    scenePass.end();

    // 2. 应用FXAA
    this.fxaaEffect.apply(
      encoder,
      this.sceneRenderTarget.getColorView(0),
      this.fxaaRenderTarget.getColorView(0)
    );

    // 3. 输出到屏幕
    const finalTexture = this.fxaaRenderTarget.getColorView(0);
    this.renderToScreen(encoder, finalTexture);
  }
}
```

### 动态质量调节

```typescript
class AdaptiveFXAA {
  private fxaa: FXAA;
  private currentQuality: 'low' | 'medium' | 'high' = 'medium';

  constructor(device: RHIDevice) {
    this.fxaa = new FXAA(device);
    this.setQuality('medium');
  }

  public setQuality(quality: 'low' | 'medium' | 'high'): void {
    this.currentQuality = quality;

    switch (quality) {
      case 'low':
        this.fxaa.setParameters({
          subpixelQuality: 0.5,
          edgeThreshold: 0.125,
          edgeThresholdMin: 0.0625
        });
        break;

      case 'medium':
        this.fxaa.setParameters({
          subpixelQuality: 0.75,
          edgeThreshold: 0.166,
          edgeThresholdMin: 0.0833
        });
        break;

      case 'high':
        this.fxaa.setParameters({
          subpixelQuality: 1.0,
          edgeThreshold: 0.083,
          edgeThresholdMin: 0.0312
        });
        break;
    }

    console.log(`FXAA Quality set to: ${quality}`);
  }

  public adjustForPerformance(fps: number): void {
    if (fps < 30 && this.currentQuality !== 'low') {
      this.setQuality('low');
    } else if (fps >= 60 && this.currentQuality !== 'high') {
      this.setQuality('high');
    } else if (fps >= 30 && fps < 60 && this.currentQuality !== 'medium') {
      this.setQuality('medium');
    }
  }
}
```

### 与后处理系统集成

```typescript
import { PostProcessManager } from './utils/postprocess';

class IntegratedFXAA {
  private postProcess: PostProcessManager;
  private fxaa: FXAA;

  constructor(device: RHIDevice, width: number, height: number) {
    this.postProcess = new PostProcessManager(device, { width, height });

    // 创建FXAA并添加到处理链末尾
    this.fxaa = new FXAA(device, {
      subpixelQuality: 0.75,
      edgeThreshold: 0.166
    });

    this.postProcess.addEffect(this.fxaa);
  }

  public toggleFXAA(enabled: boolean): void {
    this.fxaa.enabled = enabled;
    console.log(`FXAA ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  public process(encoder: RHICommandEncoder, sceneTexture: RHITextureView): RHITextureView {
    return this.postProcess.process(encoder, sceneTexture);
  }
}
```

## 性能分析

### 性能特性

| 分辨率 | 1920x1080 | 2560x1440 | 3840x2160 |
|--------|-----------|-----------|-----------|
| GPU时间 | ~0.3ms | ~0.6ms | ~1.4ms |
| 内存占用 | 8MB | 16MB | 32MB |
| 带宽需求 | ~1.7GB/s | ~3.2GB/s | ~7.2GB/s |

### 性能对比

| 抗锯齿方法 | 性能开销 | 内存开销 | 视觉质量 | 适用场景 |
|-----------|----------|----------|----------|----------|
| 无抗锯齿 | 0% | 0MB | 低 | 性能优先 |
| FXAA | 低 | 低 | 中等 | 实时应用 |
| MSAA 4x | 高 | 高 | 高 | 离线渲染 |
| MSAA 8x | 很高 | 很高 | 很高 | 高端游戏 |

### 性能优化技巧

#### 1. 分辨率自适应

```typescript
class ResolutionAdaptiveFXAA {
  private fxaa: FXAA;
  private baseQuality: number;

  constructor(device: RHIDevice, width: number, height: number) {
    this.fxaa = new FXAA(device);

    // 根据分辨率调整基准质量
    const pixelCount = width * height;
    if (pixelCount > 1920 * 1080) {
      this.baseQuality = 0.5; // 高分辨率降低质量
    } else if (pixelCount > 1280 * 720) {
      this.baseQuality = 0.75; // 标准分辨率
    } else {
      this.baseQuality = 1.0; // 低分辨率提升质量
    }

    this.updateQuality();
  }

  private updateQuality(): void {
    this.fxaa.setParameters({
      subpixelQuality: this.baseQuality,
      edgeThreshold: 0.166,
      edgeThresholdMin: 0.0833
    });
  }
}
```

#### 2. 动态启用/禁用

```typescript
class PerformanceAwareFXAA {
  private fxaa: FXAA;
  private frameTimeHistory: number[] = [];
  private enabled: boolean = true;

  constructor(device: RHIDevice) {
    this.fxaa = new FXAA(device);
  }

  public update(frameTime: number): void {
    // 记录最近30帧的时间
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > 30) {
      this.frameTimeHistory.shift();
    }

    // 计算平均帧时间
    const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    const targetFrameTime = 16.67; // 60 FPS

    // 动态调整FXAA
    const shouldEnable = avgFrameTime < targetFrameTime * 1.2;
    if (shouldEnable !== this.enabled) {
      this.enabled = shouldEnable;
      this.fxaa.enabled = shouldEnable;
      console.log(`FXAA ${shouldEnable ? 'Enabled' : 'Disabled'} (Avg: ${avgFrameTime.toFixed(2)}ms)`);
    }
  }
}
```

## 参数调优指南

### 针对不同内容类型的推荐设置

#### 1. 动画风格内容
```typescript
// 卡通/动漫风格
fxaa.setParameters({
  subpixelQuality: 1.0,      // 保留线条清晰度
  edgeThreshold: 0.083,      // 敏感边缘检测
  edgeThresholdMin: 0.0312   // 处理细线条
});
```

#### 2. 真实感内容
```typescript
// 写实风格
fxaa.setParameters({
  subpixelQuality: 0.75,     // 平衡设置
  edgeThreshold: 0.166,      // 标准边缘检测
  edgeThresholdMin: 0.0833   // 避免过度处理
});
```

#### 3. UI界面内容
```typescript
// UI/文字渲染
fxaa.setParameters({
  subpixelQuality: 0.5,      // 保持文字清晰
  edgeThreshold: 0.250,      // 粗略边缘检测
  edgeThresholdMin: 0.0625   // 忽略细微差异
});
```

### 性能与质量平衡点

```typescript
// 超高性能模式
const ultraPerformance = {
  subpixelQuality: 0.25,
  edgeThreshold: 0.333,
  edgeThresholdMin: 0.1
};

// 平衡模式（推荐）
const balanced = {
  subpixelQuality: 0.75,
  edgeThreshold: 0.166,
  edgeThresholdMin: 0.0833
};

// 超高质量模式
const ultraQuality = {
  subpixelQuality: 1.0,
  edgeThreshold: 0.063,
  edgeThresholdMin: 0.0
};
```

## 故障排除

### 常见问题及解决方案

#### 1. 过度模糊
**症状**: 图像细节丢失，整体模糊
**原因**: edgeThreshold设置过低
**解决**:
```typescript
fxaa.setParameters({
  edgeThreshold: 0.200,  // 增加阈值
  subpixelQuality: 0.5   // 降低亚像素处理
});
```

#### 2. 锯齿残留
**症状**: 仍然可见锯齿边缘
**原因**: edgeThreshold设置过高
**解决**:
```typescript
fxaa.setParameters({
  edgeThreshold: 0.125,    // 降低阈值
  edgeThresholdMin: 0.0312 // 降低最小阈值
});
```

#### 3. 细线丢失
**症状**: 细线条消失或不连续
**原因**: subpixelQuality设置过低
**解决**:
```typescript
fxaa.setParameters({
  subpixelQuality: 1.0,    // 提升亚像素质量
  edgeThresholdMin: 0.0312 // 降低最小阈值
});
```

#### 4. 闪烁问题
**症状**: 动画中边缘闪烁
**原因**: 临时不一致的边缘检测
**解决**:
```typescript
fxaa.setParameters({
  edgeThresholdMin: 0.0625, // 提高最小阈值
  edgeThreshold: 0.200      // 提高基础阈值
});
```

## 完整示例：FXAA控制面板

```typescript
import { SimpleGUI } from './utils/gui';

class FXAAControlPanel {
  private fxaa: FXAA;
  private gui: SimpleGUI;

  constructor(device: RHIDevice, fxaa: FXAA) {
    this.fxaa = fxaa;
    this.gui = new SimpleGUI();
    this.createControls();
  }

  private createControls(): void {
    const params = {
      enabled: true,
      quality: 'Medium',
      subpixelQuality: 0.75,
      edgeThreshold: 0.166,
      edgeThresholdMin: 0.0833
    };

    this.gui.addSeparator('FXAA 控制');

    this.gui.add('enabled', {
      value: params.enabled,
      onChange: (v) => {
        this.fxaa.enabled = v as boolean;
      }
    });

    this.gui.add('quality', {
      value: params.quality,
      options: ['Low', 'Medium', 'High'],
      onChange: (v) => {
        this.setQuality(v as string);
        params.quality = v as string;
      }
    });

    this.gui.addSeparator('高级参数');

    this.gui.add('subpixelQuality', {
      value: params.subpixelQuality,
      min: 0.0,
      max: 1.0,
      step: 0.05,
      onChange: (v) => {
        this.fxaa.setParameters({ subpixelQuality: v });
      }
    });

    this.gui.add('edgeThreshold', {
      value: params.edgeThreshold,
      min: 0.063,
      max: 0.333,
      step: 0.01,
      onChange: (v) => {
        this.fxaa.setParameters({ edgeThreshold: v });
      }
    });

    this.gui.add('edgeThresholdMin', {
      value: params.edgeThresholdMin,
      min: 0.0,
      max: 0.1,
      step: 0.005,
      onChange: (v) => {
        this.fxaa.setParameters({ edgeThresholdMin: v });
      }
    });
  }

  private setQuality(quality: string): void {
    switch (quality) {
      case 'Low':
        this.fxaa.setParameters({
          subpixelQuality: 0.5,
          edgeThreshold: 0.125,
          edgeThresholdMin: 0.0625
        });
        break;
      case 'Medium':
        this.fxaa.setParameters({
          subpixelQuality: 0.75,
          edgeThreshold: 0.166,
          edgeThresholdMin: 0.0833
        });
        break;
      case 'High':
        this.fxaa.setParameters({
          subpixelQuality: 1.0,
          edgeThreshold: 0.083,
          edgeThresholdMin: 0.0312
        });
        break;
    }
  }
}
```

## 相关文档

### 🏛️ 理论基础
- [图形系统圣经](../../foundations/graphics-bible.md) - FXAA应用的颜色空间和采样理论基础
- [RHI Demo宪法](../../foundations/rhi-demo-constitution.md) - FXAA实现的性能和内存规范

### 🎬 后处理框架
- [后处理系统](./post-processing-system.md) - **核心**：FXAA所属的完整后处理框架
- [模块索引](./) - 所有后处理模块的完整列表

### 🎮 实际演示
- [FXAA Demo](../../../packages/rhi/demo/html/fxaa.html) - **体验**：交互式FXAA效果演示
- [后处理Demo](../../../packages/rhi/demo/html/post-process.html) - FXAA在完整后处理链中的应用
- [参考层Demo集合](../) - 27个技术演示的完整索引

### 🔧 渲染集成
- [渲染管线整合](../../advanced/integration/rendering-pipeline.md) - FXAA在完整渲染管线中的位置
- [PBR材质系统](../pbr-material-system.md) - FXAA与PBR渲染的典型结合场景
- [阴影工具](../shadow-tools.md) - FXAA处理阴影边缘抗锯齿

### 📚 学习路径
- [Learning 学习层](../../learning/) - 系统化的渲染技术学习路径
- [PBR迁移指南](../../learning/tutorials/pbr-migration-guide.md) - 包含FXAA集成的PBR实现

### 🔗 相关技术
- [数学API参考](../../api/math-type-reference.md) - FXAA算法所需的数学库
- [Shader工具参考](../../api/shader-utils-reference.md) - FXAA着色器开发工具
- [性能优化指南](../technical-debt.md) - FXAA性能优化相关指导