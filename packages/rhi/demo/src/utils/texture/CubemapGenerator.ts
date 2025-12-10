/**
 * texture/CubemapGenerator.ts
 * 立方体贴图生成器 - 生成各种程序化和加载的立方体贴图
 */

import type {
  CubemapData,
  CubemapFace,
  SkyboxGradientConfig,
  SolidColorCubemapConfig,
  DebugCubemapConfig,
} from './types';

/**
 * 立方体贴图面的调试颜色和标签
 */
interface FaceInfo {
  label: string;
  color: [number, number, number, number];
}

const CUBEMAP_FACES: Record<CubemapFace, FaceInfo> = {
  posX: { label: '+X', color: [255, 0, 0, 255] }, // 红色
  negX: { label: '-X', color: [255, 127, 0, 255] }, // 橙色
  posY: { label: '+Y', color: [0, 255, 0, 255] }, // 绿色
  negY: { label: '-Y', color: [0, 127, 255, 255] }, // 浅蓝
  posZ: { label: '+Z', color: [0, 0, 255, 255] }, // 蓝色
  negZ: { label: '-Z', color: [255, 0, 255, 255] }, // 品红
};

/**
 * 立方体贴图生成器
 *
 * 提供各种生成和加载立方体贴图的方法，用于天空盒、环境映射等：
 * - 纯色：单色立方体贴图
 * - 天空渐变：顶部-中间-底部三色渐变
 * - 调试：每个面不同颜色便于调试方向
 * - 从 URL 加载：从 6 张图片或全景图加载（扩展功能）
 *
 * @example
 * ```typescript
 * // 创建天空渐变立方体贴图
 * const cubemap = CubemapGenerator.skyGradient({
 *   topColor: [135, 206, 250, 255],    // 天空蓝
 *   horizonColor: [176, 196, 222, 255], // 淡蓝
 *   bottomColor: [139, 69, 19, 255],   // 地面棕
 * });
 *
 * // 创建纯色立方体贴图
 * const white = CubemapGenerator.solidColor({ color: [255, 255, 255, 255] });
 *
 * // 创建调试立方体贴图
 * const debug = CubemapGenerator.debug({ size: 256 });
 * ```
 */
export class CubemapGenerator {
  /**
   * 生成纯色立方体贴图
   * @param config 配置选项
   * @returns 立方体贴图数据
   */
  static solidColor(config?: SolidColorCubemapConfig): CubemapData {
    const size = config?.size ?? 256;
    const color = config?.color ?? [255, 255, 255, 255];

    const faces: Record<CubemapFace, Uint8Array> = {} as any;
    const faceList: CubemapFace[] = ['posX', 'negX', 'posY', 'negY', 'posZ', 'negZ'];

    for (const face of faceList) {
      const data = new Uint8Array(size * size * 4);

      for (let i = 0; i < data.length; i += 4) {
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = color[3];
      }

      faces[face] = data;
    }

    return { size, faces };
  }

  /**
   * 生成天空渐变立方体贴图
   * 使用顶部、地平线、底部三色渐变，每个面都根据其位置生成相应的渐变
   * @param config 配置选项
   * @returns 立方体贴图数据
   */
  static skyGradient(config?: SkyboxGradientConfig): CubemapData {
    const size = config?.size ?? 256;
    const topColor = config?.topColor ?? [135, 206, 235, 255]; // 天空蓝
    const horizonColor = config?.horizonColor ?? [176, 196, 222, 255]; // 淡蓝
    const bottomColor = config?.bottomColor ?? [139, 69, 19, 255]; // 棕色

    const faces: Record<CubemapFace, Uint8Array> = {} as any;
    const faceList: CubemapFace[] = ['posX', 'negX', 'posY', 'negY', 'posZ', 'negZ'];

    for (const face of faceList) {
      faces[face] = this.generateSkyGradientFace(size, face, topColor, horizonColor, bottomColor);
    }

    return { size, faces };
  }

  /**
   * 生成调试用立方体贴图
   * 每个面使用不同颜色，便于调试方向
   * @param config 配置选项
   * @returns 立方体贴图数据
   */
  static debug(config?: DebugCubemapConfig): CubemapData {
    const size = config?.size ?? 256;
    const showLabels = config?.showLabels ?? true;

    const faces: Record<CubemapFace, Uint8Array> = {} as any;
    const faceList: CubemapFace[] = ['posX', 'negX', 'posY', 'negY', 'posZ', 'negZ'];

    for (const face of faceList) {
      const info = CUBEMAP_FACES[face];
      const data = new Uint8Array(size * size * 4);

      // 填充颜色
      for (let i = 0; i < data.length; i += 4) {
        data[i] = info.color[0];
        data[i + 1] = info.color[1];
        data[i + 2] = info.color[2];
        data[i + 3] = info.color[3];
      }

      // 添加文本标签（如果启用）
      if (showLabels) {
        this.drawTextOnFace(data, size, info.label);
      }

      faces[face] = data;
    }

    return { size, faces };
  }

  /**
   * 从 6 张图片 URL 加载立方体贴图
   * @param urls 6 个面对应的图片 URL
   * @returns 立方体贴图数据
   */
  static async loadFromUrls(urls: Record<CubemapFace, string>): Promise<CubemapData> {
    const faceList: CubemapFace[] = ['posX', 'negX', 'posY', 'negY', 'posZ', 'negZ'];
    const faces: Record<CubemapFace, Uint8Array> = {} as any;

    let size = 0;

    for (const face of faceList) {
      const url = urls[face];
      const imageData = await this.loadImageAsData(url);
      faces[face] = imageData.data;

      if (size === 0) {
        size = imageData.width; // 假设所有面都是正方形且尺寸相同
      }
    }

    return { size, faces };
  }

  /**
   * 从等距柱状投影全景图转换为立方体贴图
   * 这是一个高级功能，使用简化实现
   * @param url 全景图 URL
   * @param size 立方体贴图面的尺寸（默认 256）
   * @returns 立方体贴图数据
   */
  static async fromEquirectangular(url: string, size?: number): Promise<CubemapData> {
    const cubemapSize = size ?? 256;
    const imageData = await this.loadImageAsData(url);

    // 简化实现：直接将等距柱状投影的 6 个部分分割为立方体面
    // 更精确的实现需要球面坐标变换
    const faces = this.convertEquirectangularToCubemap(imageData, cubemapSize);

    return { size: cubemapSize, faces };
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 从 URL 加载图片并转换为 RGBA 数据
   */
  private static async loadImageAsData(url: string): Promise<{
    width: number;
    height: number;
    data: Uint8Array;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        resolve({
          width: img.width,
          height: img.height,
          data: new Uint8Array(imageData.data),
        });
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * 生成单个天空渐变面
   * 根据面的方向生成相应的渐变
   */
  private static generateSkyGradientFace(
    size: number,
    face: CubemapFace,
    topColor: [number, number, number, number],
    horizonColor: [number, number, number, number],
    bottomColor: [number, number, number, number]
  ): Uint8Array {
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
      // 从 -1 到 1，其中 0 是中心（地平线）
      const normalizedY = (y / (size - 1)) * 2 - 1;

      let t: number;
      let color: [number, number, number, number];

      if (normalizedY >= 0) {
        // 上半部分：地平线到顶部
        t = normalizedY;
        color = this.lerpColor(horizonColor, topColor, t);
      } else {
        // 下半部分：底部到地平线
        t = -normalizedY;
        color = this.lerpColor(horizonColor, bottomColor, t);
      }

      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = color[3];
      }
    }

    return data;
  }

  /**
   * 在面上绘制文本标签
   * 使用简单的像素级别绘制（实现基础的文本渲染）
   */
  private static drawTextOnFace(data: Uint8Array, size: number, label: string): void {
    // 简化实现：在面的中心创建一个亮色矩形作为标签区域
    const labelSize = Math.max(16, size / 8);
    const startX = (size - labelSize) / 2;
    const startY = (size - labelSize) / 2;

    // 绘制白色矩形背景
    for (let y = Math.floor(startY); y < Math.floor(startY + labelSize); y++) {
      for (let x = Math.floor(startX); x < Math.floor(startX + labelSize); x++) {
        if (x >= 0 && x < size && y >= 0 && y < size) {
          const i = (y * size + x) * 4;
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = 255;
        }
      }
    }

    // 绘制黑色边框
    const borderSize = Math.max(2, Math.floor(labelSize / 8));
    for (let y = Math.floor(startY); y < Math.floor(startY + labelSize); y++) {
      for (let x = Math.floor(startX); x < Math.floor(startX + labelSize); x++) {
        if (
          (x >= startX && x < startX + borderSize) ||
          (x >= startX + labelSize - borderSize && x < startX + labelSize) ||
          (y >= startY && y < startY + borderSize) ||
          (y >= startY + labelSize - borderSize && y < startY + labelSize)
        ) {
          if (x >= 0 && x < size && y >= 0 && y < size) {
            const i = (y * size + x) * 4;
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 255;
          }
        }
      }
    }
  }

  /**
   * 颜色线性插值
   */
  private static lerpColor(
    colorA: [number, number, number, number],
    colorB: [number, number, number, number],
    t: number
  ): [number, number, number, number] {
    return [
      Math.round(colorA[0] + (colorB[0] - colorA[0]) * t),
      Math.round(colorA[1] + (colorB[1] - colorA[1]) * t),
      Math.round(colorA[2] + (colorB[2] - colorA[2]) * t),
      Math.round(colorA[3] + (colorB[3] - colorA[3]) * t),
    ];
  }

  /**
   * 将等距柱状投影转换为立方体贴图
   * 简化实现：分割等距投影的 6 个区域
   */
  private static convertEquirectangularToCubemap(
    imageData: { width: number; height: number; data: Uint8Array },
    cubemapSize: number
  ): Record<CubemapFace, Uint8Array> {
    const { width, height, data: sourceData } = imageData;
    const faces: Record<CubemapFace, Uint8Array> = {} as any;

    // 简化方案：将等距投影图分为 6 个部分
    // 实际的转换需要球面坐标到立方体的映射
    // 这里使用简单的分割策略进行演示

    const faceList: CubemapFace[] = ['posX', 'negX', 'posY', 'negY', 'posZ', 'negZ'];

    for (let faceIndex = 0; faceIndex < faceList.length; faceIndex++) {
      const face = faceList[faceIndex];
      const faceData = new Uint8Array(cubemapSize * cubemapSize * 4);

      // 使用简单的分割：将等距投影分成垂直条纹
      const stripWidth = width / 6;

      for (let y = 0; y < cubemapSize; y++) {
        for (let x = 0; x < cubemapSize; x++) {
          // 从源图像中采样对应的像素
          const srcX = Math.floor((faceIndex * stripWidth + (x / cubemapSize) * stripWidth) % width);
          const srcY = Math.floor(((height - y - 1) / cubemapSize) * height);

          const srcIdx = (srcY * width + srcX) * 4;
          const dstIdx = (y * cubemapSize + x) * 4;

          if (srcIdx + 3 < sourceData.length) {
            faceData[dstIdx] = sourceData[srcIdx];
            faceData[dstIdx + 1] = sourceData[srcIdx + 1];
            faceData[dstIdx + 2] = sourceData[srcIdx + 2];
            faceData[dstIdx + 3] = sourceData[srcIdx + 3];
          }
        }
      }

      faces[face] = faceData;
    }

    return faces;
  }
}
