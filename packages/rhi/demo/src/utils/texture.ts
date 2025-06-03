/**
 * texture.ts
 * 纹理生成工具
 * 提供程序化纹理生成功能
 */

/**
 * 纹理数据接口
 */
export interface TextureData {
  /** 纹理数据 */
  data: Uint8Array;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 通道数 */
  channels: number;
}

/**
 * 颜色接口
 */
export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * 生成纯色纹理
 * @param width 宽度
 * @param height 高度
 * @param color 颜色
 * @returns 纹理数据
 */
export function createSolidTexture(width: number, height: number, color: Color): TextureData {
  const channels = color.a !== undefined ? 4 : 3;
  const data = new Uint8Array(width * height * channels);

  const r = Math.floor(color.r * 255);
  const g = Math.floor(color.g * 255);
  const b = Math.floor(color.b * 255);
  const a = color.a !== undefined ? Math.floor(color.a * 255) : 255;

  for (let i = 0; i < width * height; i++) {
    const index = i * channels;
    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
    if (channels === 4) {
      data[index + 3] = a;
    }
  }

  return { data, width, height, channels };
}

/**
 * 生成棋盘格纹理
 * @param width 宽度
 * @param height 高度
 * @param checkSize 格子大小
 * @param color1 颜色1
 * @param color2 颜色2
 * @returns 纹理数据
 */
export function createCheckerboardTexture(
  width: number,
  height: number,
  checkSize: number,
  color1: Color = { r: 1, g: 1, b: 1 },
  color2: Color = { r: 0, g: 0, b: 0 }
): TextureData {
  const channels = 4;
  const data = new Uint8Array(width * height * channels);

  const r1 = Math.floor(color1.r * 255);
  const g1 = Math.floor(color1.g * 255);
  const b1 = Math.floor(color1.b * 255);
  const a1 = Math.floor((color1.a || 1) * 255);

  const r2 = Math.floor(color2.r * 255);
  const g2 = Math.floor(color2.g * 255);
  const b2 = Math.floor(color2.b * 255);
  const a2 = Math.floor((color2.a || 1) * 255);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * channels;
      const isWhite = (Math.floor(x / checkSize) % 2 === 0) !== (Math.floor(y / checkSize) % 2 === 0);

      if (isWhite) {
        data[index] = r1;
        data[index + 1] = g1;
        data[index + 2] = b1;
        data[index + 3] = a1;
      } else {
        data[index] = r2;
        data[index + 1] = g2;
        data[index + 2] = b2;
        data[index + 3] = a2;
      }
    }
  }

  return { data, width, height, channels };
}

/**
 * 生成渐变纹理
 * @param width 宽度
 * @param height 高度
 * @param startColor 起始颜色
 * @param endColor 结束颜色
 * @param direction 渐变方向 ('horizontal' | 'vertical' | 'diagonal' | 'radial')
 * @returns 纹理数据
 */
export function createGradientTexture(
  width: number,
  height: number,
  startColor: Color,
  endColor: Color,
  direction: 'horizontal' | 'vertical' | 'diagonal' | 'radial' = 'horizontal'
): TextureData {
  const channels = 4;
  const data = new Uint8Array(width * height * channels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * channels;

      let t = 0;
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
        case 'radial':
          {
            const centerX = width * 0.5;
            const centerY = height * 0.5;
            const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
            const distance = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
            t = Math.min(distance / maxDistance, 1);
          }
          break;
      }

      // 线性插值
      const r = Math.floor((startColor.r + (endColor.r - startColor.r) * t) * 255);
      const g = Math.floor((startColor.g + (endColor.g - startColor.g) * t) * 255);
      const b = Math.floor((startColor.b + (endColor.b - startColor.b) * t) * 255);
      const a = Math.floor(((startColor.a || 1) + ((endColor.a || 1) - (startColor.a || 1)) * t) * 255);

      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = a;
    }
  }

  return { data, width, height, channels };
}

/**
 * 生成噪声纹理
 * @param width 宽度
 * @param height 高度
 * @param scale 噪声缩放
 * @param octaves 噪声层数
 * @param persistence 持续性
 * @returns 纹理数据
 */
export function createNoiseTexture(
  width: number,
  height: number,
  scale: number = 0.1,
  octaves: number = 4,
  persistence: number = 0.5
): TextureData {
  const channels = 4;
  const data = new Uint8Array(width * height * channels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * channels;

      let noise = 0;
      let amplitude = 1;
      let frequency = scale;
      let maxValue = 0;

      for (let i = 0; i < octaves; i++) {
        noise += perlinNoise(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= 2;
      }

      noise = noise / maxValue;
      noise = (noise + 1) * 0.5; // 归一化到 [0, 1]

      const value = Math.floor(noise * 255);
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
      data[index + 3] = 255;
    }
  }

  return { data, width, height, channels };
}

/**
 * 生成法线贴图
 * @param width 宽度
 * @param height 高度
 * @param strength 强度
 * @returns 纹理数据
 */
export function createNormalMap(width: number, height: number, strength: number = 1.0): TextureData {
  const channels = 4;
  const data = new Uint8Array(width * height * channels);

  // 生成高度图
  const heightMap = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      heightMap[index] = perlinNoise(x * 0.05, y * 0.05);
    }
  }

  // 计算法线
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * channels;

      // 获取相邻像素的高度
      const left = heightMap[y * width + Math.max(0, x - 1)];
      const right = heightMap[y * width + Math.min(width - 1, x + 1)];
      const up = heightMap[Math.max(0, y - 1) * width + x];
      const down = heightMap[Math.min(height - 1, y + 1) * width + x];

      // 计算梯度
      const dx = (right - left) * strength;
      const dy = (down - up) * strength;

      // 计算法线向量
      const nx = -dx;
      const ny = -dy;
      const nz = 1.0;

      // 归一化
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const normalizedNx = nx / length;
      const normalizedNy = ny / length;
      const normalizedNz = nz / length;

      // 转换到 [0, 255] 范围
      data[index] = Math.floor((normalizedNx + 1) * 127.5); // R = X
      data[index + 1] = Math.floor((normalizedNy + 1) * 127.5); // G = Y
      data[index + 2] = Math.floor((normalizedNz + 1) * 127.5); // B = Z
      data[index + 3] = 255; // A
    }
  }

  return { data, width, height, channels };
}

/**
 * 生成彩虹纹理
 * @param width 宽度
 * @param height 高度
 * @param cycles 循环次数
 * @returns 纹理数据
 */
export function createRainbowTexture(width: number, height: number, cycles: number = 1): TextureData {
  const channels = 4;
  const data = new Uint8Array(width * height * channels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * channels;

      // 计算色相
      const u = x / (width - 1);
      const v = y / (height - 1);
      const hue = ((u + v) * 0.5 * cycles) % 1.0;

      // HSV转RGB
      const rgb = hsvToRgb(hue, 1.0, 1.0);

      data[index] = Math.floor(rgb[0] * 255);
      data[index + 1] = Math.floor(rgb[1] * 255);
      data[index + 2] = Math.floor(rgb[2] * 255);
      data[index + 3] = 255;
    }
  }

  return { data, width, height, channels };
}

/**
 * 生成UV测试纹理
 * @param width 宽度
 * @param height 高度
 * @returns 纹理数据
 */
export function createUVTestTexture(width: number, height: number): TextureData {
  const channels = 4;
  const data = new Uint8Array(width * height * channels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * channels;

      const u = x / (width - 1);
      const v = y / (height - 1);

      // U坐标映射到红色通道，V坐标映射到绿色通道
      data[index] = Math.floor(u * 255); // R = U
      data[index + 1] = Math.floor(v * 255); // G = V
      data[index + 2] = 0; // B = 0
      data[index + 3] = 255; // A = 1
    }
  }

  return { data, width, height, channels };
}

/**
 * 简单的Perlin噪声实现
 */
function perlinNoise(x: number, y: number): number {
  // 简化的噪声函数，实际应用中可以使用更复杂的实现
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

/**
 * HSV转RGB
 */
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 1 / 6) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 2 / 6) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 3 / 6) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 4 / 6) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 5 / 6) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return [r + m, g + m, b + m];
}

/**
 * 混合两个纹理
 * @param texture1 纹理1
 * @param texture2 纹理2
 * @param factor 混合因子 (0-1)
 * @returns 混合后的纹理数据
 */
export function blendTextures(texture1: TextureData, texture2: TextureData, factor: number): TextureData {
  if (texture1.width !== texture2.width || texture1.height !== texture2.height) {
    throw new Error('Textures must have the same dimensions');
  }

  const width = texture1.width;
  const height = texture1.height;
  const channels = Math.max(texture1.channels, texture2.channels);
  const data = new Uint8Array(width * height * channels);

  for (let i = 0; i < width * height; i++) {
    for (let c = 0; c < channels; c++) {
      const index = i * channels + c;

      const value1 = c < texture1.channels ? texture1.data[i * texture1.channels + c] : 0;
      const value2 = c < texture2.channels ? texture2.data[i * texture2.channels + c] : 0;

      data[index] = Math.floor(value1 * (1 - factor) + value2 * factor);
    }
  }

  return { data, width, height, channels };
}

/**
 * 调整纹理亮度
 * @param texture 纹理数据
 * @param brightness 亮度调整 (-1 到 1)
 * @returns 调整后的纹理数据
 */
export function adjustBrightness(texture: TextureData, brightness: number): TextureData {
  const data = new Uint8Array(texture.data.length);
  const adjustment = brightness * 255;

  for (let i = 0; i < texture.data.length; i++) {
    // 跳过alpha通道
    if (texture.channels === 4 && (i + 1) % 4 === 0) {
      data[i] = texture.data[i];
    } else {
      data[i] = Math.max(0, Math.min(255, texture.data[i] + adjustment));
    }
  }

  return {
    data,
    width: texture.width,
    height: texture.height,
    channels: texture.channels,
  };
}

/**
 * 调整纹理对比度
 * @param texture 纹理数据
 * @param contrast 对比度调整 (0 到 2，1为原始)
 * @returns 调整后的纹理数据
 */
export function adjustContrast(texture: TextureData, contrast: number): TextureData {
  const data = new Uint8Array(texture.data.length);

  for (let i = 0; i < texture.data.length; i++) {
    // 跳过alpha通道
    if (texture.channels === 4 && (i + 1) % 4 === 0) {
      data[i] = texture.data[i];
    } else {
      const normalized = texture.data[i] / 255;
      const adjusted = (normalized - 0.5) * contrast + 0.5;
      data[i] = Math.max(0, Math.min(255, Math.floor(adjusted * 255)));
    }
  }

  return {
    data,
    width: texture.width,
    height: texture.height,
    channels: texture.channels,
  };
}
