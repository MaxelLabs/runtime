# Texture Array Demo 参考文档

**难度等级**：高级
**技术类型**：WebGL2 特性、纹理渲染
**文件路径**：`packages/rhi/demo/src/texture-array.ts`
**演示页面**：`packages/rhi/demo/html/texture-array.html`

## 概述

Texture Array Demo 展示了 WebGL2 的 2D 纹理数组（TEXTURE_2D_ARRAY）技术，该技术允许在单个纹理对象中存储多个 2D 纹理层。这对于地形渲染、纹理图集、体素渲染等场景非常有用，相比传统的多个 2D 纹理，它提供了更好的性能和更简洁的 API。

## 核心特性

### WebGL2 独占特性

- **TEXTURE_2D_ARRAY**：仅支持 WebGL2，无法在 WebGL1 中使用
- **sampler2DArray**：专门的纹理数组采样器类型
- **3D 纹理坐标**：使用 (u, v, layer) 三维坐标采样

### 功能演示

1. **8 层程序化纹理**：每层展示不同的程序化纹理算法
2. **实时层切换**：通过滑块和键盘快捷键切换显示的纹理层
3. **UV 缩放控制**：动态调整纹理重复次数
4. **性能监控**：实时显示 FPS 和渲染时间

## 技术实现详解

### 1. 纹理数组创建

```typescript
const arrayTexture = runner.track(
  runner.device.createTexture({
    width: textureSize,
    height: textureSize,
    depthOrArrayLayers: layerCount, // 8 层
    dimension: MSpec.RHITextureType.TEXTURE_2D_ARRAY,
    format: MSpec.RHITextureFormat.RGBA8_UNORM,
    usage: MSpec.RHITextureUsage.TEXTURE_BINDING | MSpec.RHITextureUsage.COPY_DST,
    label: 'Demo Texture Array',
  })
);
```

**关键参数**：
- `depthOrArrayLayers`: 指定层数（8 层）
- `dimension`: 必须设置为 `TEXTURE_2D_ARRAY`
- `format`: 使用 RGBA8_UNORM 格式

### 2. 纹理数据生成

每层使用不同的程序化纹理算法：

```typescript
const layerGenerators = [
  // Layer 0: 棋盘格
  () => ProceduralTexture.checkerboard({...}).data,
  // Layer 1: 渐变
  () => ProceduralTexture.gradient({...}).data,
  // Layer 2: 噪声
  () => ProceduralTexture.noise({...}).data,
  // Layer 3-7: 自定义算法
  () => generateCircles(textureSize, textureSize),
  () => generateStripes(textureSize, textureSize),
  () => generateRandomPixels(textureSize, textureSize),
  () => generateWaves(textureSize, textureSize),
  () => generateMixedPattern(textureSize, textureSize),
];
```

### 3. 逐层数据更新

```typescript
for (let layer = 0; layer < layerCount; layer++) {
  const layerData = layerGenerators[layer]();
  arrayTexture.update(layerData as BufferSource, 0, 0, layer);
}
```

**注意**：使用 `texture.update()` 时最后一个参数指定层索引。

### 4. 着色器实现

#### 顶点着色器

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

#### 片元着色器

```glsl
#version 300 es
precision highp float;

uniform sampler2DArray uTextureArray;
uniform LayerControl {
  float uLayerIndex;
  float uLayerCount;
};

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  // 使用三维坐标采样：(u, v, layer)
  vec3 texCoord = vec3(vTexCoord, uLayerIndex);
  vec4 color = texture(uTextureArray, texCoord);

  // 超出范围的层显示紫色
  if (uLayerIndex >= uLayerCount || uLayerIndex < 0.0) {
    color = vec4(0.8, 0.2, 0.8, 1.0);
  }

  fragColor = color;
}
```

### 5. 绑定组布局

```typescript
const bindGroupLayout = runner.track(
  runner.device.createBindGroupLayout([
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
      name: 'LayerControl',
    },
    {
      binding: 2,
      visibility: MSpec.RHIShaderStage.FRAGMENT,
      texture: { sampleType: 'float', viewDimension: '2d-array' },
      name: 'uTextureArray',
    },
    {
      binding: 3,
      visibility: MSpec.RHIShaderStage.FRAGMENT,
      sampler: { type: 'filtering' },
      name: 'uSampler',
    },
  ])
);
```

**关键点**：
- 纹理的 `viewDimension` 必须设置为 `'2d-array'`
- 需要专门的 Uniform 控制层索引

### 6. 层控制实现

```typescript
// Uniform 缓冲区
const layerBuffer = runner.track(
  runner.device.createBuffer({
    size: 16, // std140 对齐
    usage: MSpec.RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Layer Control Uniform Buffer',
  })
);

// 更新层索引
const updateLayerBuffer = () => {
  const layerData = new Float32Array([currentLayer, layerCount, 0, 0]);
  layerBuffer.update(layerData, 0);
};
```

## 交互控制

### GUI 控件

1. **Layer Index**：滑块控制当前显示的层（0-7）
2. **Layer Name**：下拉菜单快速选择特定层
3. **UV Scale**：控制纹理重复次数（0.5-4.0）

### 键盘快捷键

- **←/→**：切换到上一层/下一层
- **1-8**：快速跳转到特定层
- **ESC**：退出 Demo
- **F11**：切换全屏
- **鼠标左键拖动**：旋转视角
- **鼠标滚轮**：缩放

## 程序化纹理算法

### 1. 同心圆 (generateCircles)

```typescript
function generateCircles(width: number, height: number): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 4;

  // 创建多个同心圆，每个圆不同颜色
  // 最内圈：红色，中圈：绿色，外圈：蓝色
}
```

### 2. 条纹图案 (generateStripes)

```typescript
function generateStripes(width: number, height: number): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  const stripeWidth = 16;

  // 生成垂直条纹，循环使用 4 种颜色
  // 红、绿、蓝、黄
}
```

### 3. 波浪图案 (generateWaves)

```typescript
function generateWaves(width: number, height: number): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  const waveCount = 8;

  // 使用正弦函数创建波浪效果
  // 结合 X 和 Y 方向的波浪
}
```

### 4. 混合图案 (generateMixedPattern)

```typescript
function generateMixedPattern(width: number, height: number): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  const gridSize = 32;

  // 在每个网格单元内使用不同算法：
  // - 棋盘格
  // - 径向渐变
  // - 对角线
}
```

## 性能考虑

### 内存优势

- **单个纹理对象**：相比 8 个独立的 2D 纹理，减少了绑定切换
- **统一的采样器**：所有层共享相同的采样设置
- **更少的 API 调用**：一次绑定即可访问所有层

### 性能限制

- **WebGL2 要求**：无法在 WebGL1 设备上运行
- **层大小限制**：所有层必须具有相同的尺寸和格式
- **内存占用**：虽然 API 更简洁，但内存占用与多个独立纹理相同

## 兼容性检查

Demo 应包含 WebGL2 支持检测：

```typescript
// 检查 WebGL2 支持
const gl = runner.canvas.getContext('webgl2');
if (!gl) {
  // 显示友好的错误信息
  document.body.innerHTML = `
    <div style="color: white; text-align: center; padding-top: 100px;">
      <h2>WebGL2 Required</h2>
      <p>This demo requires WebGL2 support for texture arrays.</p>
      <p>Please use a modern browser that supports WebGL2.</p>
    </div>
  `;
  return;
}
```

## 应用场景

### 1. 地形渲染

- 纹理切片：不同高度使用不同纹理
- 季节变化：通过层索引切换季节纹理

### 2. 纹理图集

- 精子动画：每一帧存储在一个层中
- UI 元素：相关 UI 元素存储在同一纹理数组中

### 3. 体素渲染

- 材质索引：通过层索引选择不同材质
- LOD 系统：不同细节级别存储在不同层中

## 扩展建议

1. **动画纹理**：通过动态更新层实现纹理动画
2. **3D 纹理转换**：支持从 2D 纹理数组生成真 3D 纹理
3. **压缩格式**：使用 ASTC 或 ETC2 压缩减少内存占用
4. **Mipmap 生成**：为每层生成 mipmap 以改善远距离渲染质量

## 故障排除

### 常见问题

1. **WebGL1 不兼容**
   - 确保使用支持 WebGL2 的浏览器
   - 添加兼容性检测和友好提示

2. **层采样失败**
   - 检查着色器中的 sampler2DArray 类型
   - 确保 viewDimension 设置为 '2d-array'

3. **性能问题**
   - 考虑降低纹理分辨率
   - 减少层数或使用更简单的算法

## 相关资源

- [WebGL2 纹理数组规范](https://www.khronos.org/registry/webgl/specs/latest/2.0/#TEXTURE_2D_ARRAY)
- [WebGL2 sampler2DArray 文档](https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf)
- [程序化纹理生成算法](./procedural-texture-demo.md)