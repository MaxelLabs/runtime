/**
 * skybox/ProceduralSky.ts
 * 程序化天空生成器 - 支持渐变天空、太阳/月亮渲染和日夜循环
 */

import { MSpec } from '@maxellabs/core';
import type { DemoRunner } from '../core';
import type { ProceduralSkyOptions } from './types';

/**
 * 程序化天空生成器
 *
 * 提供程序化天空生成功能：
 * - 天空渐变（天顶 -> 地平线 -> 地面）
 * - 太阳/月亮渲染
 * - 日夜循环
 *
 * @example
 * ```typescript
 * const proceduralSky = new ProceduralSky(runner, {
 *   zenithColor: [0.1, 0.3, 0.8],
 *   horizonColor: [0.5, 0.7, 1.0],
 *   sunDirection: [0.5, 0.5, 0.5],
 *   enableDayNightCycle: true,
 * });
 *
 * // 生成立方体贴图
 * const cubemap = proceduralSky.generateCubemap(512);
 *
 * // 更新日夜循环
 * proceduralSky.update(deltaTime);
 * ```
 */
export class ProceduralSky {
  private runner: DemoRunner;
  private options: Required<ProceduralSkyOptions>;

  // 日夜循环状态
  private cycleTime: number = 0;

  // 常量
  private readonly CUBEMAP_FACES = 6;
  private readonly FACE_ORDER = ['positive-x', 'negative-x', 'positive-y', 'negative-y', 'positive-z', 'negative-z'];

  /**
   * 创建程序化天空生成器
   * @param runner Demo运行器
   * @param options 天空选项
   */
  constructor(runner: DemoRunner, options: ProceduralSkyOptions = {}) {
    this.runner = runner;
    this.options = {
      zenithColor: options.zenithColor ?? [0.1, 0.3, 0.8],
      horizonColor: options.horizonColor ?? [0.5, 0.7, 1.0],
      groundColor: options.groundColor ?? [0.3, 0.2, 0.1],
      sunColor: options.sunColor ?? [1.0, 0.9, 0.7],
      sunDirection: options.sunDirection ?? [0.5, 0.5, 0.5],
      sunSize: options.sunSize ?? 0.999,
      enableDayNightCycle: options.enableDayNightCycle ?? false,
      cycleSpeed: options.cycleSpeed ?? 60.0,
    };

    // 归一化太阳方向
    this.normalizeSunDirection();
  }

  /**
   * 归一化太阳方向
   */
  private normalizeSunDirection(): void {
    const dir = this.options.sunDirection;
    const length = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);
    if (length > 0) {
      dir[0] /= length;
      dir[1] /= length;
      dir[2] /= length;
    }
  }

  /**
   * 更新日夜循环
   * @param deltaTime 时间增量（秒）
   */
  update(deltaTime: number): void {
    if (!this.options.enableDayNightCycle) {
      return;
    }

    // 更新循环时间
    this.cycleTime += deltaTime;
    const cycleProgress = (this.cycleTime / this.options.cycleSpeed) % 1.0;

    // 计算太阳角度（0 -> 2π）
    const sunAngle = cycleProgress * 2 * Math.PI;

    // 更新太阳方向（绕X轴旋转）
    this.options.sunDirection[0] = 0;
    this.options.sunDirection[1] = Math.sin(sunAngle);
    this.options.sunDirection[2] = Math.cos(sunAngle);

    this.normalizeSunDirection();
  }

  /**
   * 生成立方体贴图
   * @param size 每个面的尺寸（像素）
   * @returns 立方体贴图纹理
   */
  generateCubemap(size: number = 512): MSpec.IRHITexture {
    // 创建立方体贴图纹理
    const cubemap = this.runner.track(
      this.runner.device.createTexture({
        width: size,
        height: size,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        dimension: MSpec.RHITextureType.TEXTURE_CUBE,
        label: 'Procedural Sky Cubemap',
      })
    );

    // 为每个面生成数据
    for (let faceIndex = 0; faceIndex < this.CUBEMAP_FACES; faceIndex++) {
      const faceData = this.generateFaceData(size, faceIndex);

      // 上传数据到纹理
      // update(data, x, y, z, width, height, depth, mipLevel, arrayLayer)
      cubemap.update(faceData as unknown as BufferSource, 0, 0, 0, size, size, 1, 0, faceIndex);
    }

    return cubemap;
  }

  /**
   * 生成单个立方体贴图面的数据
   * @param size 面的尺寸
   * @param faceIndex 面索引（0-5）
   * @returns RGBA数据
   */
  private generateFaceData(size: number, faceIndex: number): Uint8Array {
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // 计算纹理坐标（0-1）
        const u = (x + 0.5) / size;
        const v = (y + 0.5) / size;

        // 将UV转换为立方体方向
        const dir = this.uvToDirection(u, v, faceIndex);

        // 计算颜色
        const color = this.computeSkyColor(dir);

        // 写入数据
        const index = (y * size + x) * 4;
        data[index + 0] = Math.floor(color[0] * 255);
        data[index + 1] = Math.floor(color[1] * 255);
        data[index + 2] = Math.floor(color[2] * 255);
        data[index + 3] = 255;
      }
    }

    return data;
  }

  /**
   * 将UV坐标转换为立方体方向
   * @param u U坐标（0-1）
   * @param v V坐标（0-1）
   * @param faceIndex 面索引
   * @returns 归一化方向向量
   */
  private uvToDirection(u: number, v: number, faceIndex: number): [number, number, number] {
    // 将UV从[0,1]映射到[-1,1]
    const uc = 2.0 * u - 1.0;
    const vc = 2.0 * v - 1.0;

    let x = 0,
      y = 0,
      z = 0;

    // 根据面索引计算方向
    // 立方体贴图顺序：+X, -X, +Y, -Y, +Z, -Z
    switch (faceIndex) {
      case 0: // +X
        x = 1.0;
        y = -vc;
        z = -uc;
        break;
      case 1: // -X
        x = -1.0;
        y = -vc;
        z = uc;
        break;
      case 2: // +Y
        x = uc;
        y = 1.0;
        z = vc;
        break;
      case 3: // -Y
        x = uc;
        y = -1.0;
        z = -vc;
        break;
      case 4: // +Z
        x = uc;
        y = -vc;
        z = 1.0;
        break;
      case 5: // -Z
        x = -uc;
        y = -vc;
        z = -1.0;
        break;
    }

    // 归一化
    const length = Math.sqrt(x * x + y * y + z * z);
    return [x / length, y / length, z / length];
  }

  /**
   * 计算天空颜色
   * @param dir 方向向量（归一化）
   * @returns RGB颜色（0-1）
   */
  private computeSkyColor(dir: [number, number, number]): [number, number, number] {
    const [dx, dy, dz] = dir;

    // 1. 天空渐变（基于Y分量）
    let skyColor: [number, number, number];

    if (dy > 0) {
      // 上半球：天顶 -> 地平线
      const t = dy; // 0（地平线）-> 1（天顶）
      skyColor = this.lerpColor(this.options.horizonColor, this.options.zenithColor, t);
    } else {
      // 下半球：地平线 -> 地面
      const t = -dy; // 0（地平线）-> 1（地面）
      skyColor = this.lerpColor(this.options.horizonColor, this.options.groundColor, t);
    }

    // 2. 太阳光晕
    const sunDot =
      dx * this.options.sunDirection[0] + dy * this.options.sunDirection[1] + dz * this.options.sunDirection[2];

    if (sunDot > this.options.sunSize) {
      // 在太阳区域内
      const sunIntensity = (sunDot - this.options.sunSize) / (1.0 - this.options.sunSize);
      skyColor = this.lerpColor(skyColor, this.options.sunColor, sunIntensity);
    } else if (sunDot > this.options.sunSize - 0.01) {
      // 太阳边缘光晕
      const glowIntensity = (sunDot - (this.options.sunSize - 0.01)) / 0.01;
      const glowColor: [number, number, number] = [
        this.options.sunColor[0] * 0.5,
        this.options.sunColor[1] * 0.5,
        this.options.sunColor[2] * 0.5,
      ];
      skyColor = this.lerpColor(skyColor, glowColor, glowIntensity * 0.5);
    }

    return skyColor;
  }

  /**
   * 线性插值颜色
   * @param a 起始颜色
   * @param b 结束颜色
   * @param t 插值因子（0-1）
   * @returns 插值后的颜色
   */
  private lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  /**
   * 更新选项
   * @param options 新的选项
   */
  updateOptions(options: Partial<ProceduralSkyOptions>): void {
    if (options.zenithColor !== undefined) {
      this.options.zenithColor = options.zenithColor;
    }
    if (options.horizonColor !== undefined) {
      this.options.horizonColor = options.horizonColor;
    }
    if (options.groundColor !== undefined) {
      this.options.groundColor = options.groundColor;
    }
    if (options.sunColor !== undefined) {
      this.options.sunColor = options.sunColor;
    }
    if (options.sunDirection !== undefined) {
      this.options.sunDirection = options.sunDirection;
      this.normalizeSunDirection();
    }
    if (options.sunSize !== undefined) {
      this.options.sunSize = options.sunSize;
    }
    if (options.enableDayNightCycle !== undefined) {
      this.options.enableDayNightCycle = options.enableDayNightCycle;
    }
    if (options.cycleSpeed !== undefined) {
      this.options.cycleSpeed = options.cycleSpeed;
    }
  }

  /**
   * 获取当前太阳方向
   * @returns 太阳方向向量
   */
  getSunDirection(): [number, number, number] {
    return [...this.options.sunDirection];
  }

  /**
   * 重置日夜循环
   */
  resetCycle(): void {
    this.cycleTime = 0;
  }
}
