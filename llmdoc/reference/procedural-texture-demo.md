# Procedural Texture Demo 实现参考

## 概述

procedural-texture 是 RHI Demo 系统第二层（纹理系统）的第五个演示，展示 6 种程序化纹理生成技术，通过算法动态生成各种纹理效果，无需外部图像资源。

## 功能演示

- **6 种纹理类型**：棋盘格、渐变、噪声、纯色、UV 调试、法线贴图
- **网格展示**：3×2 网格同时显示所有纹理类型
- **独立查看**：可切换到单纹理模式进行详细观察
- **实时参数调整**：通过 GUI 动态修改纹理参数并即时更新
- **纹理导出**：支持将生成的纹理导出为图片

## 核心技术点

### 1. ProceduralTexture 工具类

程序化纹理生成的核心工具类，提供 6 种静态方法：

```typescript
class ProceduralTexture {
  // 1. 棋盘格生成
  static checkerboard(options: {
    width: number;
    height: number;
    cellSize: number;
    colorA: [number, number, number, number];
    colorB: [number, number, number, number];
  }): TextureData;

  // 2. 渐变生成
  static gradient(options: {
    width: number;
    height: number;
    direction: 'horizontal' | 'vertical' | 'diagonal';
    startColor: [number, number, number, number];
    endColor: [number, number, number, number];
  }): TextureData;

  // 3. 噪声生成
  static noise(options: {
    width: number;
    height: number;
    type: 'white' | 'perlin' | 'simplex';
    frequency: number;
    octaves: number;
    baseColor: [number, number, number, number];
    noiseColor: [number, number, number, number];
  }): TextureData;

  // 4. 纯色生成
  static solidColor(options: {
    width: number;
    height: number;
    color: [number, number, number, number];
  }): TextureData;

  // 5. UV 调试纹理
  static uvDebug(options: {
    width: number;
    height: number;
  }): TextureData;

  // 6. 法线贴图生成
  static normalMap(options: {
    width: number;
    height: number;
    pattern: 'flat' | 'bumpy' | 'wave';
    strength: number;
  }): TextureData;
}
```

### 2. 纹理数据结构

```typescript
interface TextureData {
  width: number;
  height: number;
  data: Uint8Array; // RGBA 格式，每个分量 8 位
}
```

### 3. 棋盘格算法实现

```typescript
static checkerboard(options: CheckerboardOptions): TextureData {
  const { width, height, cellSize, colorA, colorB } = options;
  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);
      const isEven = (cellX + cellY) % 2 === 0;

      const color = isEven ? colorA : colorB;
      const index = (y * width + x) * 4;

      data[index] = color[0];     // R
      data[index + 1] = color[1]; // G
      data[index + 2] = color[2]; // B
      data[index + 3] = color[3]; // A
    }
  }

  return { width, height, data };
}
```

### 4. 渐变算法实现

```typescript
static gradient(options: GradientOptions): TextureData {
  const { width, height, direction, startColor, endColor } = options;
  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 计算插值因子
      let t: number;
      switch (direction) {
        case 'horizontal':
          t = x / (width - 1);
          break;
        case 'vertical':
          t = y / (height - 1);
          break;
        case 'diagonal':
          t = (x + y) / (width + height - 2);
          break;
      }

      // 线性插值
      const index = (y * width + x) * 4;
      data[index] = startColor[0] + (endColor[0] - startColor[0]) * t;
      data[index + 1] = startColor[1] + (endColor[1] - startColor[1]) * t;
      data[index + 2] = startColor[2] + (endColor[2] - startColor[2]) * t;
      data[index + 3] = startColor[3] + (endColor[3] - startColor[3]) * t;
    }
  }

  return { width, height, data };
}
```

### 5. 噪声算法实现（Perlin 噪声示例）

```typescript
// 简化的 Perlin 噪声实现
class PerlinNoise {
  private permutation: number[];

  constructor() {
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }
    // 洗牌
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }
  }

  noise2D(x: number, y: number): number {
    // Perlin 噪声 2D 实现
    // 包含网格插值、梯度计算等
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    // 计算相对坐标
    x -= Math.floor(x);
    y -= Math.floor(y);

    // 计算淡入函数
    const u = this.fade(x);
    const v = this.fade(y);

    // 哈希梯度
    const A = this.permutation[X] + Y;
    const B = this.permutation[X + 1] + Y;

    // 插值
    return this.lerp(v,
      this.lerp(u, this.grad(this.permutation[A], x, y),
                   this.grad(this.permutation[B], x - 1, y)),
      this.lerp(u, this.grad(this.permutation[A + 1], x, y - 1),
                   this.grad(this.permutation[B + 1], x - 1, y - 1))
    );
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    // 根据哈希值返回梯度
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}
```

### 6. 法线贴图算法

```typescript
static normalMap(options: NormalMapOptions): TextureData {
  const { width, height, pattern, strength } = options;
  const data = new Uint8Array(width * height * 4);

  // 首先生成高度图
  const heightMap = new Float32Array(width * height);

  switch (pattern) {
    case 'flat':
      // 平面
      break;
    case 'bumpy':
      // 随机凸起
      for (let i = 0; i < 10; i++) {
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        const radius = 10 + Math.random() * 20;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist < radius) {
              const h = 1 - dist / radius;
              heightMap[y * width + x] += h * h;
            }
          }
        }
      }
      break;
    case 'wave':
      // 波浪
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          heightMap[y * width + x] = Math.sin(x * 0.05) * Math.cos(y * 0.05);
        }
      }
      break;
  }

  // 从高度图计算法线
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // 计算梯度
      const hL = heightMap[y * width + (x - 1)];
      const hR = heightMap[y * width + (x + 1)];
      const hU = heightMap[(y - 1) * width + x];
      const hD = heightMap[(y + 1) * width + x];

      const dx = (hR - hL) * strength;
      const dy = (hD - hU) * strength;

      // 计算法线
      const nx = -dx;
      const ny = -dy;
      const nz = 1;

      // 归一化
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const index = (y * width + x) * 4;

      // 转换到 [0, 255] 范围
      data[index] = (nx / len * 0.5 + 0.5) * 255;
      data[index + 1] = (ny / len * 0.5 + 0.5) * 255;
      data[index + 2] = (nz / len * 0.5 + 0.5) * 255;
      data[index + 3] = 255;
    }
  }

  return { width, height, data };
}
```

### 7. 纹理动态更新

```typescript
// 创建纹理
const texture = runner.device.createTexture({
  width: 256,
  height: 256,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.TEXTURE_BINDING | RHITextureUsage.COPY_DST,
  label: 'Procedural Texture',
});

// 更新纹理数据
function updateTexture(index: number) {
  const data = generateTextureData(index); // 生成新的纹理数据
  texture.update(data.data as BufferSource);
}

// 在 GUI 中响应参数变化
gui.add('Cell Size', {
  value: textureParams.checkerboardCellSize,
  min: 4,
  max: 128,
  step: 4,
  onChange: (v) => {
    textureParams.checkerboardCellSize = v;
    updateTexture(0); // 更新棋盘格纹理
  },
});
```

### 8. 多纹理渲染

网格布局渲染 6 个纹理：

```typescript
// 3x2 网格渲染
function renderGrid() {
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);

    // 计算位置
    const x = (col - 1) * 1.1;
    const y = row === 0 ? 0.55 : -0.55;

    // 设置模型矩阵
    modelMatrix.identity();
    modelMatrix.translate(new MMath.Vector3(x, y, 0));
    modelMatrix.scale(new MMath.Vector3(0.35, 0.35, 1));

    // 更新 uniform buffer
    updateTransformBuffer();

    // 绑定对应纹理并渲染
    renderPass.setBindGroup(0, bindGroups[i]);
    renderPass.drawIndexed(geometry.indexCount);
  }
}
```

## 纹理类型详解

### 1. Checkerboard（棋盘格）
- **用途**：测试纹理坐标、验证采样器设置
- **参数**：格子大小、两种颜色
- **特点**：简单清晰的几何图案

### 2. Gradient（渐变）
- **用途**：测试颜色插值、创建背景效果
- **参数**：渐变方向、起始颜色、结束颜色
- **类型**：水平、垂直、对角线

### 3. Noise（噪声）
- **用途**：生成自然纹理、创建随机效果
- **类型**：
  - White noise：完全随机
  - Perlin noise：自然连续
  - Simplex noise：改进的 Perlin
- **参数**：频率、倍频、颜色

### 4. Solid Color（纯色）
- **用途**：测试纹理绑定、创建纯色区域
- **参数**：颜色值

### 5. UV Debug（UV 调试）
- **用途**：可视化 UV 坐标、检查纹理映射
- **特征**：
  - U 坐标映射到红色通道
  - V 坐标映射到绿色通道
  - 网格线辅助定位

### 6. Normal Map（法线贴图）
- **用途**：为光照计算提供法线信息
- **参数**：图案类型、强度
- **格式**：RGB 编码的法线向量

## 性能优化

### 1. 纹理复用
```typescript
// 缓存生成的纹理数据
const textureCache = new Map<string, TextureData>();

function getTexture(key: string, generator: () => TextureData): TextureData {
  if (!textureCache.has(key)) {
    textureCache.set(key, generator());
  }
  return textureCache.get(key)!;
}
```

### 2. 按需更新
```typescript
// 只有参数变化时才重新生成
let lastParams = { ...textureParams };

function shouldUpdate(): boolean {
  return JSON.stringify(lastParams) !== JSON.stringify(textureParams);
}
```

### 3. GPU 计算
对于复杂的纹理生成，可以考虑使用计算着色器：

```glsl
#version 450

layout(local_size_x = 16, local_size_y = 16) in;

layout(binding = 0, rgba8) uniform writeonly image2D outputTexture;

uniform Params {
  float frequency;
  int octaves;
  float time;
};

// 在 GPU 上并行生成噪声
void main() {
  ivec2 coord = ivec2(gl_GlobalInvocationID.xy);
  vec2 uv = vec2(coord) / vec2(imageSize(outputTexture));

  float noise = fbm(uv * frequency, octaves, time);

  vec4 color = vec4(noise, noise, noise, 1.0);
  imageStore(outputTexture, coord, color);
}
```

## 交互控制

### GUI 参数
- **View Mode**：切换显示模式（全部/单个纹理）
- **Checkerboard**：格子大小、颜色
- **Gradient**：方向、颜色
- **Noise**：类型、频率、倍频
- **Normal Map**：图案、强度

### 快捷键
- **0**：显示所有纹理
- **1-6**：切换到对应纹理
- **E**：导出当前纹理
- **ESC**：退出 Demo

## 扩展建议

1. **更多纹理类型**：
   - 分形地形
   - 细胞自动机
   - Voronoi 图

2. **纹理混合**：
   - 多层纹理合成
   - 蒙版混合
   - 权重混合

3. **实时动画**：
   - 时间相关噪声
   - 动态法线贴图
   - 粒子系统纹理

4. **高级功能**：
   - 纹理序列导出
   - 自定义着色器
   - 预设管理

## 相关文件

- `demo/src/procedural-texture.ts` - 主程序实现
- `demo/html/procedural-texture.html` - HTML 界面
- `demo/src/utils/ProceduralTexture.ts` - 程序化纹理生成工具
- `src/webgl/resources/GLTexture.ts` - WebGL 纹理实现

## 技术注意事项

1. **数据格式**：纹理数据使用 Uint8Array 格式，每个像素 4 字节（RGBA）
2. **坐标系**：Y 轴向下，原点在左上角
3. **线程安全**：纹理更新在主线程进行，避免并发问题
4. **内存管理**：及时释放不需要的纹理数据
5. **性能权衡**：复杂算法考虑使用 WebGL 计算着色器加速