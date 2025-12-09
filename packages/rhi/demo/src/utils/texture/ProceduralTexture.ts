/**
 * texture/ProceduralTexture.ts
 * 程序化纹理生成器 - 生成各种测试和调试用纹理
 */

import type {
  TextureData,
  CheckerboardConfig,
  GradientConfig,
  NoiseConfig,
  SolidColorConfig,
  UVDebugConfig,
  NormalMapConfig,
} from './types';

/**
 * 程序化纹理生成器
 *
 * 提供各种预设纹理的生成方法，用于 Demo 测试和调试：
 * - 棋盘格：测试 UV 映射
 * - 渐变：测试纹理采样
 * - 噪声：测试细节渲染
 * - 纯色：基础测试
 * - UV 调试：显示 UV 坐标
 * - 法线贴图：测试法线映射
 *
 * @example
 * ```typescript
 * // 创建棋盘格纹理
 * const checker = ProceduralTexture.checkerboard({ cellSize: 32 });
 *
 * // 创建 RHI 纹理
 * const texture = device.createTexture({
 *   width: checker.width,
 *   height: checker.height,
 *   format: RHITextureFormat.RGBA8_UNORM,
 *   initialData: checker.data,
 * });
 * ```
 */
export class ProceduralTexture {
  /**
   * 生成棋盘格纹理
   * @param config 配置选项
   * @returns 纹理数据
   */
  static checkerboard(config: CheckerboardConfig = {}): TextureData {
    const width = config.width ?? 256;
    const height = config.height ?? 256;
    const cellSize = config.cellSize ?? 32;
    const colorA = config.colorA ?? [255, 255, 255, 255];
    const colorB = config.colorB ?? [128, 128, 128, 255];

    const data = new Uint8Array(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);
        const isColorA = (cellX + cellY) % 2 === 0;
        const color = isColorA ? colorA : colorB;

        const i = (y * width + x) * 4;
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = color[3];
      }
    }

    return { width, height, data };
  }

  /**
   * 生成渐变纹理
   * @param config 配置选项
   * @returns 纹理数据
   */
  static gradient(config: GradientConfig = {}): TextureData {
    const width = config.width ?? 256;
    const height = config.height ?? 256;
    const direction = config.direction ?? 'horizontal';
    const startColor = config.startColor ?? [255, 0, 0, 255];
    const endColor = config.endColor ?? [0, 0, 255, 255];

    const data = new Uint8Array(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let t: number;

        switch (direction) {
          case 'horizontal':
            t = x / (width - 1);
            break;
          case 'vertical':
            t = y / (height - 1);
            break;
          case 'diagonal':
            t = (x / (width - 1) + y / (height - 1)) / 2;
            break;
        }

        const i = (y * width + x) * 4;
        data[i] = Math.round(startColor[0] + (endColor[0] - startColor[0]) * t);
        data[i + 1] = Math.round(startColor[1] + (endColor[1] - startColor[1]) * t);
        data[i + 2] = Math.round(startColor[2] + (endColor[2] - startColor[2]) * t);
        data[i + 3] = Math.round(startColor[3] + (endColor[3] - startColor[3]) * t);
      }
    }

    return { width, height, data };
  }

  /**
   * 生成噪声纹理
   * @param config 配置选项
   * @returns 纹理数据
   */
  static noise(config: NoiseConfig = {}): TextureData {
    const width = config.width ?? 256;
    const height = config.height ?? 256;
    const type = config.type ?? 'white';
    const frequency = config.frequency ?? 4;
    const octaves = config.octaves ?? 4;
    const baseColor = config.baseColor ?? [0, 0, 0, 255];
    const noiseColor = config.noiseColor ?? [255, 255, 255, 255];

    const data = new Uint8Array(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let noiseValue: number;

        switch (type) {
          case 'white':
            noiseValue = Math.random();
            break;
          case 'perlin':
            noiseValue = this.perlinNoise((x / width) * frequency, (y / height) * frequency, octaves);
            break;
          case 'simplex':
            noiseValue = this.simplexNoise((x / width) * frequency, (y / height) * frequency, octaves);
            break;
        }

        const i = (y * width + x) * 4;
        data[i] = Math.round(baseColor[0] + (noiseColor[0] - baseColor[0]) * noiseValue);
        data[i + 1] = Math.round(baseColor[1] + (noiseColor[1] - baseColor[1]) * noiseValue);
        data[i + 2] = Math.round(baseColor[2] + (noiseColor[2] - baseColor[2]) * noiseValue);
        data[i + 3] = Math.round(baseColor[3] + (noiseColor[3] - baseColor[3]) * noiseValue);
      }
    }

    return { width, height, data };
  }

  /**
   * 生成纯色纹理
   * @param config 配置选项
   * @returns 纹理数据
   */
  static solidColor(config: SolidColorConfig = {}): TextureData {
    const width = config.width ?? 1;
    const height = config.height ?? 1;
    const color = config.color ?? [255, 255, 255, 255];

    const data = new Uint8Array(width * height * 4);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = color[3];
    }

    return { width, height, data };
  }

  /**
   * 生成 UV 调试纹理
   * R = U, G = V, B = 0
   * @param config 配置选项
   * @returns 纹理数据
   */
  static uvDebug(config: UVDebugConfig = {}): TextureData {
    const width = config.width ?? 256;
    const height = config.height ?? 256;

    const data = new Uint8Array(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / (width - 1);
        const v = y / (height - 1);

        const i = (y * width + x) * 4;
        data[i] = Math.round(u * 255); // R = U
        data[i + 1] = Math.round(v * 255); // G = V
        data[i + 2] = 0; // B = 0
        data[i + 3] = 255; // A = 1
      }
    }

    return { width, height, data };
  }

  /**
   * 生成法线贴图
   * @param config 配置选项
   * @returns 纹理数据
   */
  static normalMap(config: NormalMapConfig = {}): TextureData {
    const width = config.width ?? 256;
    const height = config.height ?? 256;
    const pattern = config.pattern ?? 'flat';
    const strength = config.strength ?? 0.5;

    const data = new Uint8Array(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let nx = 0;
        let ny = 0;
        const nz = 1;

        switch (pattern) {
          case 'flat':
            // 平面法线，始终朝上
            break;
          case 'bumpy': {
            // 随机凹凸
            const noise = Math.random() * 2 - 1;
            nx = noise * strength;
            ny = noise * strength;
            break;
          }
          case 'wave': {
            // 波浪图案
            const u = x / width;
            const v = y / height;
            nx = Math.sin(u * Math.PI * 8) * strength;
            ny = Math.sin(v * Math.PI * 8) * strength;
            break;
          }
        }

        // 归一化
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len;
        ny /= len;
        const normalizedNz = nz / len;

        // 映射到 0-255 (法线贴图约定: -1~1 -> 0~255)
        const i = (y * width + x) * 4;
        data[i] = Math.round((nx * 0.5 + 0.5) * 255);
        data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        data[i + 2] = Math.round((normalizedNz * 0.5 + 0.5) * 255);
        data[i + 3] = 255;
      }
    }

    return { width, height, data };
  }

  // ==================== 私有噪声函数 ====================

  /** Perlin 噪声 (简化实现) */
  private static perlinNoise(x: number, y: number, octaves: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.interpolatedNoise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return (total / maxValue + 1) / 2; // 归一化到 0-1
  }

  /** Simplex 噪声 (使用 Perlin 近似) */
  private static simplexNoise(x: number, y: number, octaves: number): number {
    // 简化实现，实际使用 Perlin 噪声
    return this.perlinNoise(x * 1.2, y * 1.2, octaves);
  }

  /** 插值噪声 */
  private static interpolatedNoise(x: number, y: number): number {
    const intX = Math.floor(x);
    const fracX = x - intX;
    const intY = Math.floor(y);
    const fracY = y - intY;

    const v1 = this.smoothNoise(intX, intY);
    const v2 = this.smoothNoise(intX + 1, intY);
    const v3 = this.smoothNoise(intX, intY + 1);
    const v4 = this.smoothNoise(intX + 1, intY + 1);

    const i1 = this.cosineInterpolate(v1, v2, fracX);
    const i2 = this.cosineInterpolate(v3, v4, fracX);

    return this.cosineInterpolate(i1, i2, fracY);
  }

  /** 平滑噪声 */
  private static smoothNoise(x: number, y: number): number {
    const corners =
      (this.noise2D(x - 1, y - 1) +
        this.noise2D(x + 1, y - 1) +
        this.noise2D(x - 1, y + 1) +
        this.noise2D(x + 1, y + 1)) /
      16;

    const sides =
      (this.noise2D(x - 1, y) + this.noise2D(x + 1, y) + this.noise2D(x, y - 1) + this.noise2D(x, y + 1)) / 8;

    const center = this.noise2D(x, y) / 4;

    return corners + sides + center;
  }

  /** 2D 伪随机噪声 */
  private static noise2D(x: number, y: number): number {
    const n = x + y * 57;
    const hash = (n << 13) ^ n;
    return 1.0 - ((hash * (hash * hash * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0;
  }

  /** 余弦插值 */
  private static cosineInterpolate(a: number, b: number, t: number): number {
    const ft = t * Math.PI;
    const f = (1 - Math.cos(ft)) * 0.5;
    return a * (1 - f) + b * f;
  }
}
