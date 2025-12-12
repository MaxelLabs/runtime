# Mipmaps Demo 实现参考

## 概述

mipmaps 是 RHI Demo 系统第二层（纹理系统）的第四个演示，展示 Mipmap 的生成、使用和手动 LOD 控制。包括自动生成、手动控制 LOD 级别，以及三种过滤模式的对比。

## 功能演示

- **自动 Mipmap 生成**：展示 `gl.generateMipmap()` 自动生成的 Mipmap 链
- **手动 LOD 控制**：使用 `textureLod()` 精确控制采样级别
- **可视化的 Mipmap 链**：每个级别使用不同颜色标记
- **三种过滤模式对比**：NEAREST、LINEAR_MIPMAP_NEAREST、LINEAR_MIPMAP_LINEAR
- **LOD 偏移控制**：模拟距离对 Mipmap 选择的影响

## 核心技术点

### 1. Mipmap 配置

```typescript
// Mipmap 过滤模式配置
const MIPMAP_CONFIGS = {
  none: {
    name: 'No Mipmap (无 Mipmap)',
    minFilter: RHIFilterMode.LINEAR,
    magFilter: RHIFilterMode.LINEAR,
    lodBias: 0.0,
  },
  nearest: {
    name: 'Nearest Mipmap (最近邻 Mipmap)',
    minFilter: RHIFilterMode.LINEAR_MIPMAP_NEAREST,
    magFilter: RHIFilterMode.LINEAR,
    lodBias: 0.0,
  },
  linear: {
    name: 'Linear Mipmap (线性 Mipmap)',
    minFilter: RHIFilterMode.LINEAR_MIPMAP_LINEAR,
    magFilter: RHIFilterMode.LINEAR,
    lodBias: 0.0,
  },
};

// 计算最大 Mipmap 级别
function getMaxMipmapLevels(width: number, height: number): number {
  return Math.floor(Math.log2(Math.max(width, height))) + 1;
}
```

### 2. 带颜色标记的 Mipmap 生成

```typescript
// HSL 转 RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) {
        t += 1;
      }
      if (t > 1) {
        t -= 1;
      }
      if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
      }
      if (t < 1 / 2) {
        return q;
      }
      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
      }

      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// 生成带颜色标记的棋盘格 Mipmap 级别
function generateColoredMipmapLevel(size: number, level: number, maxLevels: number): Uint8Array {
  const data = new Uint8Array(size * size * 4);
  const hue = (level / maxLevels) * 300; // 颜色从红色渐变到紫色

  const [r, g, b] = hslToRgb(hue, 0.8, 0.5);
  const [r2, g2, b2] = hslToRgb((hue + 180) % 360, 0.8, 0.5); // 互补色

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const checkerSize = Math.max(1, size / 4); // 每级保持 4x4 格子
      const checker = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2;

      if (checker === 0) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      } else {
        data[i] = r2;
        data[i + 1] = g2;
        data[i + 2] = b2;
        data[i + 3] = 255;
      }
    }
  }

  return data;
}
```

### 3. 纹理创建与 Mipmap 上传

```typescript
// 创建支持 Mipmap 的纹理
const texture = runner.device.createTexture({
  width: 512,
  height: 512,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.TEXTURE_BINDING,
  mipLevelCount: maxMipmapLevels,
});

// 手动上传每个 Mipmap 级别
const mipmapLevels = generateColoredMipmaps(baseData, 512, 512);

for (let level = 0; level < mipmapLevels.length; level++) {
  const levelWidth = Math.max(1, 512 >> level);
  const levelHeight = Math.max(1, 512 >> level);

  texture.update(mipmapLevels[level], {
    mipLevel: level,
    x: 0,
    y: 0,
    width: levelWidth,
    height: levelHeight,
  });
}
```

### 4. 延伸平面几何体

```typescript
interface PlaneGeometry {
  vertices: Float32Array;
  vertexCount: number;
}

// 创建延伸平面几何体（用于展示远近距离的 Mipmap 效果）
function createExtendedPlane(
  width: number,
  height: number,
  widthSegments: number,
  heightSegments: number,
  uvScale: number = 4.0
): PlaneGeometry {
  const vertices: number[] = [];

  // 每个顶点包含：位置 (3) + UV (2) = 5 个浮点数
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const u0 = x / widthSegments;
      const u1 = (x + 1) / widthSegments;
      const v0 = y / heightSegments;
      const v1 = (y + 1) / heightSegments;

      const x0 = (u0 - 0.5) * width;
      const x1 = (u1 - 0.5) * width;
      const z0 = (v0 - 0.5) * height;
      const z1 = (v1 - 0.5) * height;

      // 第一个三角形
      vertices.push(x0, 0, z0, u0 * uvScale, v0 * uvScale);
      vertices.push(x0, 0, z1, u0 * uvScale, v1 * uvScale);
      vertices.push(x1, 0, z1, u1 * uvScale, v1 * uvScale);

      // 第二个三角形
      vertices.push(x0, 0, z0, u0 * uvScale, v0 * uvScale);
      vertices.push(x1, 0, z1, u1 * uvScale, v1 * uvScale);
      vertices.push(x1, 0, z0, u1 * uvScale, v0 * uvScale);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    vertexCount: widthSegments * heightSegments * 6,
  };
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
precision highp float;

uniform sampler2D uTexture;
uniform LodControl {
  float uForcedLod; // -1.0 = 自动, 0.0-8.0 = 手动指定 LOD 级别
};

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 texColor;
  if (uForcedLod < 0.0) {
    // 自动 LOD 选择
    texColor = texture(uTexture, vTexCoord);
  } else {
    // 手动指定 LOD 级别
    texColor = textureLod(uTexture, vTexCoord, uForcedLod);
  }
  fragColor = texColor;
}
```

### 6. 模型矩阵和变换

```typescript
// 模型矩阵
const modelMatrix = new MMath.Matrix4();

const updateModelMatrix = () => {
  modelMatrix.identity();
  modelMatrix.rotateX((-tiltAngle * Math.PI) / 180);
  const translation = new MMath.Vector3(0, 0, -10);
  modelMatrix.translate(translation);
};
updateModelMatrix();
```

### 7. GUI 控制

```typescript
const gui = new SimpleGUI();

gui.addSeparator('Mipmap Mode');

const modeNames = MIPMAP_CONFIGS.map((c) => c.name);
gui.add('Mode', {
  value: modeNames[currentModeIndex],
  options: modeNames,
  onChange: (value) => {
    const index = MIPMAP_CONFIGS.findIndex((c) => c.name === value);
    if (index !== -1) {
      currentModeIndex = index;
      updateBindGroup();
    }
  },
});

gui.addSeparator('LOD Control');

gui.add('Forced LOD', {
  value: forcedLod,
  min: -1,
  max: 8,
  step: 0.5,
  onChange: (value) => {
    forcedLod = value as number;
    updateLodBuffer();
  },
});

gui.add('Show LOD Colors', {
  value: showLodColors,
  onChange: (value) => {
    showLodColors = value as boolean;
    updateBindGroup();
  },
});

gui.addSeparator('Scene');

gui.add('UV Scale', {
  value: uvScale,
  min: 1,
  max: 10,
  step: 0.5,
  onChange: (value) => {
    uvScale = value as number;
    updateVertexBuffer();
  },
});

gui.add('Tilt Angle', {
  value: tiltAngle,
  min: 0,
  max: 90,
  step: 5,
  onChange: (value) => {
    tiltAngle = value as number;
    updateModelMatrix();
  },
});
```

### 7. 性能优化

```typescript
// 使用纹理数组存储不同 Mipmap 级别（可选优化）
const textureArray = runner.device.createTexture({
  width: 512,
  height: 512,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.TEXTURE_BINDING,
  dimension: '2d-array',
  arrayLength: maxMipmapLevels,
});

// 批量上传所有级别
const allLevels = new Uint8Array(totalSize);
let offset = 0;
for (let level = 0; level < mipmapLevels.length; level++) {
  allLevels.set(mipmapLevels[level], offset);
  offset += mipmapLevels[level].length;
}

textureArray.update(allLevels, { arrayLayer: 0, mipLevel: 0 });
```

## Mipmap 技术细节

### 1. LOD 计算公式

```
LOD = log2(max(||∂u/∂x||, ||∂u/∂y||, ||∂v/∂x||, ||∂v/∂y||))
```

其中 u, v 是纹理坐标，x, y 是屏幕坐标。

### 2. 三线性插值

```glsl
// 两个最近的 Mipmap 级别
float lod = floor(texLod);
float nextLod = lod + 1;
float t = fract(texLod);

// 级别内双线性插值
vec4 color1 = textureLod(tex, uv, lod);
vec4 color2 = textureLod(tex, uv, nextLod);

// 级别间线性插值
vec4 finalColor = mix(color1, color2, t);
```

### 3. 各向异性过滤（可选扩展）

```typescript
const anisotropicSampler = runner.device.createSampler({
  magFilter: RHIFilterMode.LINEAR,
  minFilter: RHIFilterMode.LINEAR_MIPMAP_LINEAR,
  mipmapFilter: RHIFilterMode.LINEAR,
  maxAnisotropy: 16, // 各向异性采样倍数
  addressModeU: RHIAddressMode.REPEAT,
  addressModeV: RHIAddressMode.REPEAT,
});
```

## 相关文件

- `demo/src/mipmaps.ts` - 主程序
- `demo/html/mipmaps.html` - HTML 页面
- `demo/src/utils/texture/TextureLoader.ts` - Mipmap 生成工具
- `src/webgl/resources/GLTexture.ts` - WebGL 纹理实现

## 交互控制

- **ESC**: 退出 Demo
- **F11**: 切换全屏
- **1-3**: 切换 Mipmap 模式
- **L**: 锁定/解锁 LOD
- **↑/↓**: 调整 LOD 级别
- **C**: 切换 LOD 颜色显示
- **鼠标左键拖动**: 旋转视角
- **鼠标滚轮**: 缩放

## 技术注意事项

1. **着色器兼容性**: WebGL2 中不需要 `binding` qualifier，已移除不兼容的语法
2. **纹理更新**: texture.update() 的 mipLevel 参数是第8个参数（在 options 对象中）
3. **模型变换**: 使用 Vector3 对象进行平移，而不是三个独立参数
4. **函数规范**: 使用箭头函数而不是函数声明以符合项目规范
5. **内存使用**: Mipmap 增加约 33% 的内存使用（1 + 1/4 + 1/16 + ...）
6. **纹理尺寸**: 必须是 2 的幂次才能生成完整的 Mipmap 链
7. **性能权衡**: 提高远处渲染质量，但增加内存使用