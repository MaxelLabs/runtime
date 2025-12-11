# 混合模式 Demo 参考

**演示文件**: `packages/rhi/demo/src/blend-modes.ts`
**HTML 页面**: `packages/rhi/demo/html/blend-modes.html`

## 1. Identity

- **What it is**: 展示如何在 RHI 中实现不同的混合模式，包括透明度混合、加法混合、乘法混合等高级效果。
- **Purpose**: 演示混合模式的配置方法、UBO 布局着色器集成，以及交互式效果预览。

## 2. 混合模式配置

### 7 种核心混合模式

| 混合模式 | 源因子 | 目标因子 | 效果描述 |
|---------|--------|----------|----------|
| Normal | `ONE` | `ONE_MINUS_SRC_ALPHA` | 标准透明度混合 |
| Additive | `ONE` | `ONE` | 加法混合，用于光效 |
| Multiply | `ZERO` | `SRC_COLOR` | 乘法混合，用于阴影 |
| Screen | `ONE_MINUS_DST_COLOR` | `ONE` | 滤色混合，用于光晕 |
| Overlay | `SRC_COLOR` | `ONE_MINUS_SRC_COLOR` | 叠加混合，用于高光 |
| Darken | `ONE` | `ONE_MINUS_SRC_ALPHA` | 变暗，用于阴影层 |
| Lighten | `ONE_MINUS_DST_COLOR` | `ONE_MINUS_SRC_COLOR` | 变亮，用于高亮层 |

### UBO 配置实现

```typescript
// PushConstants 中定义混合模式参数
export interface BlendModesUBO {
  srcFactor: number;        // 源混合因子
  dstFactor: number;        // 目标混合因子
  colorOperation: number;   // 颜色操作
  alphaOperation: number;   // Alpha 操作
  isEnabled: number;       // 混合开关
  __pad0: number;           // 内存对齐
  __pad1: number;           // 内存对齐
}

// 常量定义
enum BlendMode {
  NORMAL = 0,
  ADDITIVE = 1,
  MULTIPLY = 2,
  SCREEN = 3,
  OVERLAY = 4,
  DARKEN = 5,
  LIGHTEN = 6
}
```

## 3. 技术实现要点

### 动态 UBO 更新

```typescript
// 在渲染循环中动态更新混合参数
const blendUBO = new Float32Array(8);
function updateBlendMode(mode: BlendMode) {
  const params = getBlendParams(mode);

  blendUBO[0] = params.srcFactor;
  blendUBO[1] = params.dstFactor;
  blendUBO[2] = params.colorOp;
  blendUBO[3] = params.alphaOp;
  blendUBO[4] = params.isEnabled ? 1 : 0;
  blendUBO[5] = 0; // padding
  blendUBO[6] = 0; // padding
  blendUBO[7] = 0; // padding

  // 更新 Uniform 缓冲区
  blendBuffer.update(blendUBO, 0);
}
```

### 着色器混合计算

```glsl
#version 300 es

in vec3 aPosition;
in vec2 aTexCoord;
in vec4 aColor;

out vec4 vColor;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

// 从 UBO 读取混合参数
uniform BlendModes {
  float srcFactor;
  float dstFactor;
  float colorOperation;
  float alphaOperation;
  float isEnabled;
  float padding[3];
};

vec4 blend(vec4 src, vec4 dst) {
  if (isEnabled < 0.5) {
    return src; // 混合关闭
  }

  // 实现各种混合操作
  if (colorOperation == 1.0) { // ADDITIVE
    return vec4(src.rgb + dst.rgb, src.a);
  } else if (colorOperation == 2.0) { // MULTIPLY
    return vec4(src.rgb * dst.rgb, src.a);
  } else if (colorOperation == 3.0) { // SCREEN
    return vec4(1.0 - (1.0 - src.rgb) * (1.0 - dst.rgb), src.a);
  }

  // 默认使用 Normal 混合
  return vec4(src.rgb * src.a + dst.rgb * (1.0 - src.a), src.a);
}

void main() {
  vec4 color = aColor;
  color = blend(color, vec4(0.0)); // 与背景混合

  vColor = color;
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
```

### 纹理混合示例

```typescript
// 创建纹理混合着色器
const shaderTemplate = {
  vertex: `
    #version 300 es
    in vec3 aPosition;
    in vec2 aTexCoord;
    out vec2 vTexCoord;

    uniform mat4 uMVPMatrix;

    void main() {
      vTexCoord = aTexCoord;
      gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
    }
  `,
  fragment: `
    #version 300 es
    precision mediump float;

    in vec2 vTexCoord;
    out vec4 fragColor;

    uniform sampler2D uTexture;
    uniform float uBlendAmount;
    uniform int uBlendMode;

    void main() {
      vec4 color = texture(uTexture, vTexCoord);

      // 应用混合模式
      if (uBlendMode == 1) { // Additive
        color.rgb *= uBlendAmount;
      } else if (uBlendMode == 2) { // Multiply
        color.rgb *= (1.0 - uBlendAmount);
      }

      fragColor = color;
    }
  `
};
```

## 4. 交互式控制

### GUI 控制面板

```typescript
// 使用 dat.GUI 创建混合模式控制
const gui = new GUI();
const blendFolder = gui.addFolder('混合模式');

// 混合模式选择
blendFolder.add(blendParams, 'mode', {
  'Normal': BlendMode.NORMAL,
  'Additive': BlendMode.ADDITIVE,
  'Multiply': BlendMode.MULTIPLY,
  'Screen': BlendMode.SCREEN,
  'Overlay': BlendMode.OVERLAY,
  'Darken': BlendMode.DARKEN,
  'Lighten': BlendMode.LIGHTEN
}).name('混合模式');

// 混合强度调节
blendFolder.add(blendParams, 'strength', 0, 1, 0.01).name('混合强度');

// 预设组合
blendFolder.add({
  '火焰效果': () => applyPreset('fire'),
  '发光效果': () => applyPreset('glow'),
  '阴影效果': () => applyPreset('shadow'),
  '烟雾效果': () => applyPreset('smoke')
}, '火焰效果').name('预设效果');
```

### 实时模式切换

```typescript
function applyBlendMode(mode: BlendMode) {
  // 1. 更新 UBO 参数
  updateBlendMode(mode);

  // 2. 更新渲染状态
  device.setBlendState({
    enabled: mode !== BlendMode.NORMAL,
    colorSrcFactor: blendFactors[mode].src,
    colorDstFactor: blendFactors[mode].dst,
    alphaSrcFactor: blendFactors[mode].src,
    alphaDstFactor: blendFactors[mode].dst,
  });

  // 3. 更新 GUI 显示
  blendParams.mode = mode;
  gui.updateDisplay();

  console.log(`已切换到混合模式: ${getBlendModeName(mode)}`);
}
```

## 5. 应用场景示例

### 火焰效果

```typescript
// 使用 Additive 混合创建火焰
function createFireEffect() {
  const fireShader = {
    fragment: `
      uniform sampler2D uFireTexture;
      uniform float uTime;
      uniform float uIntensity;

      void main() {
        vec2 uv = vTexCoord;
        uv.x += sin(uTime * 2.0 + uv.y * 10.0) * 0.02;

        vec4 color = texture(uFireTexture, uv);
        color.rgb *= uIntensity;

        // 使用加法混合
        fragColor = vec4(color.rgb, color.a * 0.8);
      }
    `
  };

  // 设置混合模式
  device.setBlendState({
    enabled: true,
    colorSrcFactor: 'one',
    colorDstFactor: 'one',
    alphaSrcFactor: 'one',
    alphaDstFactor: 'one-minus-src-alpha'
  });
}
```

### 发光效果

```typescript
// 使用 Screen 混合创建光晕
function createGlowEffect() {
  // 1. 渲染发光物体
  device.setBlendState({
    enabled: true,
    colorSrcFactor: 'one',
    colorDstFactor: 'one-minus-src-color'
  });

  // 2. 渲染光晕
  device.setBlendState({
    enabled: true,
    colorSrcFactor: 'one',
    colorDstFactor: 'one'
  });
}
```

### 阴影效果

```typescript
// 使用 Multiply 混合创建阴影
function createShadowEffect() {
  device.setBlendState({
    enabled: true,
    colorSrcFactor: 'zero',
    colorDstFactor: 'src-color',
    alphaSrcFactor: 'one',
    alphaDstFactor: 'one-minus-src-alpha'
  });
}
```

## 6. 性能优化技巧

### 批量渲染优化

```typescript
// 按混合模式分组渲染，减少状态切换
function renderByBlendMode() {
  // 1. 先渲染不需要混合的物体
  device.setBlendState({ enabled: false });
  renderOpaqueObjects();

  // 2. 渲染 Normal 混合物体
  device.setBlendState(normalBlendState);
  renderNormalObjects();

  // 3. 渲染 Additive 混合物体
  device.setBlendState(additiveBlendState);
  renderAdditiveObjects();

  // 4. 渲染 Multiply 混合物体
  device.setBlendState(multiplyBlendState);
  renderMultiplyObjects();
}
```

### UBO 合并优化

```typescript
// 将多个 UBO 合并以减少绑定调用
const compositeUBO = new Float32Array(16);
function updateCompositeUBO() {
  // 混合模式参数 (8 floats)
  compositeUBO.set(blendUBO, 0);

  // 变换矩阵 (12 floats)
  compositeUBO.set(transformMatrix, 8);

  // 一次性更新
  compositeBuffer.update(compositeUBO, 0);
}
```

## 7. 调试工具

### 混合模式可视化

```typescript
// 创建混合模式预览窗口
function createBlendModePreview() {
  const previewDiv = document.createElement('div');
  previewDiv.style.cssText = `
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 256px;
    height: 256px;
    border: 2px solid white;
    background: repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 20px 20px;
  `;

  // 在此背景上绘制各种混合模式示例
  return previewDiv;
}
```

### 性能监控

```typescript
// 监控混合操作的性能
const blendStats = {
  drawCalls: 0,
  blendStateChanges: 0,
  uboUpdates: 0,

  startFrame() {
    this.drawCalls = 0;
    this.blendStateChanges = 0;
    this.uboUpdates = 0;
  },

  recordDrawCall() {
    this.drawCalls++;
  },

  recordBlendChange() {
    this.blendStateChanges++;
  },

  recordUBOUpdate() {
    this.uboUpdates++;
  }
};
```

## 8. 相关文件

- **源代码**: `packages/rhi/demo/src/blend-modes.ts`
- **演示页面**: `packages/rhi/demo/html/blend-modes.html`
- **UBO 实现**: `packages/rhi/llmdoc/reference/push-constants.md`
- **着色器工具**: `packages/rhi/llmdoc/reference/shader-utils-reference.md`
- **WebGL 实现**: `/llmdoc/architecture/webgl-implementation.md`

## 9. 下一步学习

在掌握混合模式后，可以继续探索：

1. **高级着色器**: 程序化纹理和噪声函数
2. **后处理效果**: 全屏渲染和后期处理
3. **帧缓冲区**: 离屏渲染和多重渲染目标
4. **GPU 驱动渲染**: 完全基于 GPU 的渲染流水线