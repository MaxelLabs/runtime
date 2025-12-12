# Texture Wrapping Demo 实现参考

## 概述

texture-wrapping 是 RHI Demo 系统第二层（纹理系统）的第三个演示，展示 3 种纹理包裹模式的视觉效果差异，包括 REPEAT、MIRROR_REPEAT 和 CLAMP_TO_EDGE。

## 功能演示

- **3 种包裹模式对比**：REPEAT（重复）、MIRROR_REPEAT（镜像重复）、CLAMP_TO_EDGE（钳制到边缘）
- **UV 超范围可视化**：通过 UV 坐标超出 [0,1] 范围展示包裹效果
- **动态切换**：支持 GUI 下拉菜单和快捷键（1-3）快速切换包裹模式
- **程序化纹理**：使用棋盘格纹理清晰展示包裹边界

## 核心技术点

### 1. 包裹模式配置

```typescript
// 3 种包裹模式配置
const WRAPPING_CONFIGS = {
  repeat: {
    name: 'Repeat (重复)',
    addressModeU: RHIAddressMode.REPEAT,
    addressModeV: RHIAddressMode.REPEAT,
  },
  mirrorRepeat: {
    name: 'Mirror Repeat (镜像重复)',
    addressModeU: RHIAddressMode.MIRRORED_REPEAT,
    addressModeV: RHIAddressMode.MIRRORED_REPEAT,
  },
  clampToEdge: {
    name: 'Clamp to Edge (钳制到边缘)',
    addressModeU: RHIAddressMode.CLAMP_TO_EDGE,
    addressModeV: RHIAddressMode.CLAMP_TO_EDGE,
  },
};
```

### 2. 几何体与 UV 设计

使用扩展 UV 范围的平面展示包裹效果：

```typescript
const geometry = GeometryGenerator.plane({
  width: 6,
  height: 6,
  widthSegments: 20,
  heightSegments: 20,

  // 自定义 UV 范围 [-1, 2]，超出标准 [0,1] 范围
  uvs: true,

  // 稍微倾斜以便更好地观察效果
  transform: MMath.Matrix4.makeRotationX(-Math.PI / 6)
    .mul(MMath.Matrix4.makeTranslation(0, -1, 0)),
});

// 手动修改 UV 坐标以超出 [0,1] 范围
const uvArray = new Float32Array(geometry.uvs.length);
for (let i = 0; i < geometry.uvs.length; i += 2) {
  // 将 UV 从 [0,1] 映射到 [-1, 2]
  uvArray[i] = geometry.uvs[i] * 3 - 1;     // U: [-1, 2]
  uvArray[i + 1] = geometry.uvs[i + 1] * 3 - 1; // V: [-1, 2]
}
geometry.uvs = uvArray;
```

### 3. 程序化纹理生成

使用带标记的棋盘格纹理：

```typescript
const checkerboard = ProceduralTexture.checkerboard({
  width: 256,
  height: 256,
  cellSize: 32,
  colorA: [255, 255, 255, 255],    // 白色格子
  colorB: [64, 64, 64, 255],       // 灰色格子

  // 添加边框标记以便观察包裹边界
  borderSize: 2,
  borderColor: [255, 0, 0, 255],   // 红色边框
});

const texture = runner.device.createTexture({
  width: 256,
  height: 256,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.TEXTURE_BINDING,
});

texture.update(checkerboard.data);
```

### 4. 采样器创建

```typescript
// 为每种包裹模式创建对应的采样器
const samplers = new Map<string, IRHISampler>();

for (const [key, config] of Object.entries(WRAPPING_CONFIGS)) {
  const sampler = runner.device.createSampler({
    magFilter: RHIFilterMode.NEAREST,  // 使用最近邻过滤以便清晰观察包裹
    minFilter: RHIFilterMode.NEAREST,
    addressModeU: config.addressModeU,
    addressModeV: config.addressModeV,
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
out vec2 vOriginalTexCoord; // 保存原始 UV 用于调试

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vTexCoord = aTexCoord;
  vOriginalTexCoord = aTexCoord;
}
```

**片段着色器**：

```glsl
#version 300 es
precision mediump float;

uniform sampler2D uTexture;
uniform float uShowUVBounds;  // 是否显示 UV 边界

in vec2 vTexCoord;
in vec2 vOriginalTexCoord;
out vec4 fragColor;

void main() {
  // 标准纹理采样，采样器自动处理包裹模式
  vec4 texColor = texture(uTexture, vTexCoord);

  // 可选：显示 UV 边界
  if (uShowUVBounds > 0.5) {
    // 在 UV = 0 和 UV = 1 的位置绘制细线
    vec2 uvDist = min(fract(vOriginalTexCoord), 1.0 - fract(vOriginalTexCoord));
    float uvEdge = smoothstep(0.0, 0.02, min(uvDist.x, uvDist.y));

    if (uvEdge < 0.5) {
      // UV 边界用绿色高亮
      texColor = mix(vec4(0, 1, 0, 1), texColor, uvEdge);
    }
  }

  fragColor = texColor;
}
```

### 6. GUI 控制

```typescript
const gui = new SimpleGUI();

// 包裹模式下拉菜单
gui.add('wrappingMode', {
  value: 'repeat',
  options: [
    { value: 'repeat', label: '1. Repeat (重复)' },
    { value: 'mirrorRepeat', label: '2. Mirror Repeat (镜像重复)' },
    { value: 'clampToEdge', label: '3. Clamp to Edge (钳制到边缘)' },
  ],
  onChange: (value: string) => {
    currentWrappingMode = value;
    updateBindGroup();
  },
});

// UV 边界显示开关
gui.add('showUVBounds', {
  value: false,
  label: '显示 UV 边界',
  onChange: (value: boolean) => {
    showUVBounds = value;
  },
});

// 快捷键支持
runner.onKey('1', () => setWrappingMode('repeat'));
runner.onKey('2', () => setWrappingMode('mirrorRepeat'));
runner.onKey('3', () => setWrappingMode('clampToEdge'));
runner.onKey('u', () => toggleUVBounds());
```

### 7. 可视化辅助

```typescript
// 在场景周围添加 UV 坐标标记
function createUVMarkers() {
  const markers: Mesh[] = [];

  // UV = 0, 0.5, 1.0 的位置标记
  const uvValues = [-1, -0.5, 0, 0.5, 1, 1.5, 2];

  for (const u of uvValues) {
    for (const v of uvValues) {
      // 在关键 UV 点放置小球
      const position = [u * 2 - 1, v * 2 - 1, 0.1]; // 稍微抬高
      const marker = GeometryGenerator.sphere({ radius: 0.05 });

      // 根据是否在 [0,1] 范围内设置颜色
      const inRange = (u >= 0 && u <= 1 && v >= 0 && v <= 1);
      const color = inRange ? [0, 1, 0, 1] : [1, 0, 0, 1]; // 绿色=范围内，红色=范围外

      markers.push({
        geometry: marker,
        color,
        position,
      });
    }
  }

  return markers;
}
```

## 包裹模式说明

### 1. REPEAT（重复）
- **原理**：纹理在 UV 超出 [0,1] 时重复
- **UV 映射**：UV = 1.5 等同于 UV = 0.5
- **应用场景**：地砖、墙壁、重复图案

### 2. MIRROR_REPEAT（镜像重复）
- **原理**：纹理在 UV 超出时镜像翻转
- **UV 映射**：UV = 1.5 等同于 UV = 0.5（镜像）
- **应用场景**：无缝贴图、避免明显重复

### 3. CLAMP_TO_EDGE（钳制到边缘）
- **原理**：UV 超出时使用边缘像素
- **UV 映射**：UV < 0 使用 0，UV > 1 使用 1
- **应用场景**：单个贴图、避免拉伸

## 技术细节

### WebGL 中的实现

```glsl
// GLSL 内置函数处理包裹模式
vec4 texture(sampler2D sampler, vec2 coord);

// 等效的手动实现
vec4 sampleTexture(sampler2D sampler, vec2 coord) {
  vec2 uv = coord;

  // REPEAT
  uv = fract(coord);

  // MIRROR_REPEAT
  uv = fract(coord * 0.5) * 2.0;
  if (uv.x > 1.0) uv.x = 2.0 - uv.x;
  if (uv.y > 1.0) uv.y = 2.0 - uv.y;

  // CLAMP_TO_EDGE
  uv = clamp(coord, 0.0, 1.0);

  return texture(sampler, uv);
}
```

## 相关文件

- `demo/src/texture-wrapping.ts` - 主程序
- `demo/html/texture-wrapping.html` - HTML 页面
- `demo/src/utils/texture/ProceduralTexture.ts` - 程序化纹理生成器
- `src/webgl/resources/GLSampler.ts` - WebGL 采样器实现

## 交互控制

- **1-3 数字键**：切换包裹模式
- **U 键**：切换 UV 边界显示
- **ESC**：退出 Demo
- **F11**：切换全屏
- **鼠标左键拖动**：旋转视角
- **鼠标滚轮**：缩放
- **鼠标右键拖动**：平移

## 技术注意事项

1. **UV 范围控制**：通过修改几何体的 UV 数组实现超出范围的效果
2. **过滤模式选择**：使用 NEAREST 过滤可以更清晰观察包裹边界
3. **程序化纹理**：棋盘格纹理便于观察重复和镜像效果
4. **性能考虑**：包裹模式在硬件层面实现，性能差异很小
5. **纹理坐标**：记住 WebGL 中纹理坐标原点在左下角