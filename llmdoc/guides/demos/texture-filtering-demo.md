# Texture Filtering Demo 实现参考

## 概述

texture-filtering 是 RHI Demo 系统第二层（纹理系统）的第二个演示，展示 6 种纹理过滤模式的视觉效果差异，包括最近邻、双线性、三线性和各向异性过滤。

## 功能演示

- **6 种过滤模式对比**：NEAREST、LINEAR、BILINEAR、TRILINEAR、各向异性 4x、各向异性 16x
- **倾斜平面展示**：通过透视投影展示过滤效果在远近位置的差异
- **动态切换**：支持 GUI 下拉菜单和快捷键（1-6）快速切换过滤模式
- **Mipmap 可视化**：自动生成 Mipmap 展示高级过滤效果

## 核心技术点

### 1. 过滤模式配置

```typescript
// 6 种过滤模式配置
const FILTER_CONFIGS = {
  nearest: {
    name: 'Nearest (最近邻)',
    magFilter: RHIFilterMode.NEAREST,
    minFilter: RHIFilterMode.NEAREST,
  },
  linear: {
    name: 'Linear (线性)',
    magFilter: RHIFilterMode.LINEAR,
    minFilter: RHIFilterMode.LINEAR,
  },
  bilinear: {
    name: 'Bilinear (双线性)',
    magFilter: RHIFilterMode.LINEAR,
    minFilter: RHIFilterMode.LINEAR,
    generateMipmaps: true,
    mipmapFilter: RHIFilterMode.NEAREST,
  },
  trilinear: {
    name: 'Trilinear (三线性)',
    magFilter: RHIFilterMode.LINEAR,
    minFilter: RHIFilterMode.LINEAR_MIPMAP_LINEAR,
    mipmapFilter: RHIFilterMode.LINEAR,
  },
  anisotropic4x: {
    name: 'Anisotropic 4x',
    magFilter: RHIFilterMode.LINEAR,
    minFilter: RHIFilterMode.LINEAR_MIPMAP_LINEAR,
    mipmapFilter: RHIFilterMode.LINEAR,
    maxAnisotropy: 4,
  },
  anisotropic16x: {
    name: 'Anisotropic 16x',
    magFilter: RHIFilterMode.LINEAR,
    minFilter: RHIFilterMode.LINEAR_MIPMAP_LINEAR,
    mipmapFilter: RHIFilterMode.LINEAR,
    maxAnisotropy: 16,
  },
};
```

### 2. 几何体设计

使用倾斜平面展示过滤效果：

```typescript
const geometry = GeometryGenerator.plane({
  width: 6,
  height: 6,
  widthSegments: 40,
  heightSegments: 40,

  // UV 范围 0-4，重复 4 次以便观察像素化效果
  uvs: true,

  // 倾斜角度 60 度，产生透视效果
  transform: MMath.Matrix4.makeRotationX(-Math.PI / 3)
    .mul(MMath.Matrix4.makeTranslation(0, -1, 0)),
});
```

### 3. Mipmap 自动生成

```typescript
// 创建纹理时启用 Mipmap
const texture = runner.device.createTexture({
  width: 512,
  height: 512,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.TEXTURE_BINDING,
  mipLevelCount: 9, // 512x512 -> 1x1 需要 9 个级别
});

// 使用 TextureLoader 生成 Mipmap
const textureData = await TextureLoader.load(imageUrl, {
  flipY: true,
  generateMipmaps: true, // 自动生成 Mipmap 链
});

texture.update(textureData.data);
```

### 4. 采样器动态创建

```typescript
// 为每种过滤模式创建对应的采样器
const samplers = new Map<string, IRHISampler>();

for (const [key, config] of Object.entries(FILTER_CONFIGS)) {
  const sampler = runner.device.createSampler({
    magFilter: config.magFilter,
    minFilter: config.minFilter,
    mipmapFilter: config.mipmapFilter,
    addressModeU: RHIAddressMode.REPEAT,
    addressModeV: RHIAddressMode.REPEAT,
    maxAnisotropy: config.maxAnisotropy || 1,
    label: `Sampler_${config.name}`,
  });
  samplers.set(key, sampler);
}
```

### 5. 着色器实现

**顶点着色器**：

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

**片段着色器**：

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

### 6. GUI 控制

```typescript
const gui = new SimpleGUI();

// 添加过滤模式下拉菜单
gui.add('filterMode', {
  value: 'trilinear',
  options: [
    { value: 'nearest', label: '1. Nearest (最近邻)' },
    { value: 'linear', label: '2. Linear (线性)' },
    { value: 'bilinear', label: '3. Bilinear (双线性)' },
    { value: 'trilinear', label: '4. Trilinear (三线性)' },
    { value: 'anisotropic4x', label: '5. Anisotropic 4x' },
    { value: 'anisotropic16x', label: '6. Anisotropic 16x' },
  ],
  onChange: (value: string) => {
    currentFilterMode = value;
    updateBindGroup();
  },
});

// 快捷键支持
runner.onKey('1', () => setFilterMode('nearest'));
runner.onKey('2', () => setFilterMode('linear'));
runner.onKey('3', () => setFilterMode('bilinear'));
runner.onKey('4', () => setFilterMode('trilinear'));
runner.onKey('5', () => setFilterMode('anisotropic4x'));
runner.onKey('6', () => setFilterMode('anisotropic16x'));
```

### 7. 绑定组动态更新

```typescript
function updateBindGroup() {
  const sampler = samplers.get(currentFilterMode);

  if (textureBindGroup) {
    textureBindGroup.destroy();
  }

  textureBindGroup = runner.device.createBindGroup(textureBindGroupLayout, [
    { binding: 0, resource: texture.createView() },
    { binding: 1, resource: sampler },
  ]);
}
```

## 过滤模式说明

### 1. NEAREST（最近邻）
- **原理**：选择最近的纹素
- **效果**：像素化明显，适合像素艺术
- **性能**：最快

### 2. LINEAR（线性）
- **原理**：对最近的 4 个纹素进行双线性插值
- **效果**：平滑过渡，适合近处观察
- **性能**：较快

### 3. BILINEAR（双线性 Mipmap）
- **原理**：在两个 Mipmap 级别之间进行线性插值
- **效果**：减少远处闪烁
- **性能**：中等

### 4. TRILINEAR（三线性）
- **原理**：在 Mipmap 级别间和纹素间都进行插值
- **效果**：平滑的 Mipmap 过渡
- **性能**：较慢

### 5. ANISOTROPIC（各向异性）
- **原理**：在倾斜表面采样多个纹素
- **效果**：保持远处细节清晰
- **性能**：最慢，但效果最好

## 资源依赖

- `demo/assets/texture/checkerboard.png` - 棋盘格纹理（用于观察像素化效果）
- `demo/assets/texture/text_pattern.png` - 文字图案（用于观察细节损失）

## 相关文件

- `demo/src/texture-filtering.ts` - 主程序
- `demo/html/texture-filtering.html` - HTML 页面
- `demo/src/utils/texture/TextureLoader.ts` - 纹理加载工具
- `src/webgl/resources/GLSampler.ts` - WebGL 采样器实现

## 交互控制

- **1-6 数字键**：切换过滤模式
- **ESC**：退出 Demo
- **F11**：切换全屏
- **鼠标左键拖动**：旋转视角
- **鼠标滚轮**：缩放
- **鼠标右键拖动**：平移

## 技术注意事项

1. **Mipmap 生成**：`generateMipmaps: true` 会调用 `gl.generateMipmap()` 自动生成所有级别
2. **各向异性限制**：`maxAnisotropy` 的最大值受 GPU 限制，通常为 16
3. **采样器性能**：NEAREST 最快，ANISOTROPIC 最慢，应根据需求权衡
4. **UV 重复**：通过 `addressModeU/V: REPEAT` 和 UV 范围 [0,4] 实现纹理重复
5. **倾斜角度**：60 度倾斜能很好展示透视过滤效果，但不要过陡以免丢失细节