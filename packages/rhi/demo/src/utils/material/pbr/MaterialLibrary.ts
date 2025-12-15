/**
 * material/pbr/MaterialLibrary.ts
 * PBR材质库 - 预设材质管理
 */

import type { PBRConfig, MaterialPreset } from './types';

/**
 * PBR材质预设库
 *
 * 提供常见材质的物理参数预设：
 * - 金属：金、银、铜
 * - 非金属：塑料、木材、橡胶
 *
 * 所有颜色值均为线性空间
 */
export class MaterialLibrary {
  private static presets: Map<MaterialPreset, PBRConfig> = new Map([
    // ==================== 金属材质 ====================

    [
      'gold',
      {
        albedo: [1.0, 0.766, 0.336], // 金色（线性空间）
        metalness: 1.0,
        roughness: 0.2,
        ao: 1.0,
        normalScale: 1.0,
      },
    ],

    [
      'silver',
      {
        albedo: [0.972, 0.96, 0.915], // 银色（线性空间）
        metalness: 1.0,
        roughness: 0.1,
        ao: 1.0,
        normalScale: 1.0,
      },
    ],

    [
      'copper',
      {
        albedo: [0.955, 0.638, 0.538], // 铜色（线性空间）
        metalness: 1.0,
        roughness: 0.3,
        ao: 1.0,
        normalScale: 1.0,
      },
    ],

    // ==================== 非金属材质 ====================

    [
      'plastic',
      {
        albedo: [0.8, 0.1, 0.1], // 红色塑料（线性空间）
        metalness: 0.0,
        roughness: 0.5,
        ao: 1.0,
        normalScale: 1.0,
      },
    ],

    [
      'wood',
      {
        albedo: [0.6, 0.4, 0.2], // 木材色（线性空间）
        metalness: 0.0,
        roughness: 0.8,
        ao: 1.0,
        normalScale: 1.5, // 木材通常有较强的法线细节
      },
    ],

    [
      'rubber',
      {
        albedo: [0.1, 0.1, 0.1], // 黑色橡胶（线性空间）
        metalness: 0.0,
        roughness: 0.9,
        ao: 1.0,
        normalScale: 1.0,
      },
    ],
  ]);

  /**
   * 获取预设材质配置
   *
   * @param preset 预设名称
   * @returns 材质配置（深拷贝）
   */
  public static getPreset(preset: MaterialPreset): PBRConfig {
    const config = this.presets.get(preset);
    if (!config) {
      throw new Error(`Unknown material preset: ${preset}`);
    }

    // 深拷贝，避免修改原始数据
    return {
      albedo: [...config.albedo] as [number, number, number],
      metalness: config.metalness,
      roughness: config.roughness,
      ao: config.ao,
      normalScale: config.normalScale,
      emissive: config.emissive ? ([...config.emissive] as [number, number, number]) : undefined,
    };
  }

  /**
   * 获取所有预设名称
   */
  public static getAllPresets(): MaterialPreset[] {
    return Array.from(this.presets.keys());
  }

  /**
   * 添加自定义预设
   *
   * @param name 预设名称
   * @param config 材质配置
   */
  public static addPreset(name: string, config: PBRConfig): void {
    this.presets.set(name as MaterialPreset, config);
  }

  /**
   * 创建金属材质变体
   *
   * @param baseColor 基础颜色（线性空间）
   * @param roughness 粗糙度
   * @returns 金属材质配置
   */
  public static createMetal(baseColor: [number, number, number], roughness: number = 0.2): PBRConfig {
    return {
      albedo: baseColor,
      metalness: 1.0,
      roughness: Math.max(0.0, Math.min(1.0, roughness)),
      ao: 1.0,
      normalScale: 1.0,
    };
  }

  /**
   * 创建非金属材质变体
   *
   * @param baseColor 基础颜色（线性空间）
   * @param roughness 粗糙度
   * @returns 非金属材质配置
   */
  public static createDielectric(baseColor: [number, number, number], roughness: number = 0.5): PBRConfig {
    return {
      albedo: baseColor,
      metalness: 0.0,
      roughness: Math.max(0.0, Math.min(1.0, roughness)),
      ao: 1.0,
      normalScale: 1.0,
    };
  }

  /**
   * 线性插值两个材质配置
   *
   * @param a 材质A
   * @param b 材质B
   * @param t 插值因子 (0.0 = A, 1.0 = B)
   * @returns 插值后的材质配置
   */
  public static lerp(a: PBRConfig, b: PBRConfig, t: number): PBRConfig {
    t = Math.max(0.0, Math.min(1.0, t));

    return {
      albedo: [
        a.albedo[0] * (1 - t) + b.albedo[0] * t,
        a.albedo[1] * (1 - t) + b.albedo[1] * t,
        a.albedo[2] * (1 - t) + b.albedo[2] * t,
      ],
      metalness: a.metalness * (1 - t) + b.metalness * t,
      roughness: a.roughness * (1 - t) + b.roughness * t,
      ao: (a.ao || 1.0) * (1 - t) + (b.ao || 1.0) * t,
      normalScale: (a.normalScale || 1.0) * (1 - t) + (b.normalScale || 1.0) * t,
    };
  }

  /**
   * 从sRGB颜色创建材质
   *
   * @param srgbColor sRGB颜色 [0-255]
   * @param metalness 金属度
   * @param roughness 粗糙度
   * @returns 材质配置
   */
  public static fromSRGB(
    srgbColor: [number, number, number],
    metalness: number = 0.0,
    roughness: number = 0.5
  ): PBRConfig {
    // sRGB -> 线性空间
    const linearColor: [number, number, number] = [
      Math.pow(srgbColor[0] / 255, 2.2),
      Math.pow(srgbColor[1] / 255, 2.2),
      Math.pow(srgbColor[2] / 255, 2.2),
    ];

    return {
      albedo: linearColor,
      metalness: Math.max(0.0, Math.min(1.0, metalness)),
      roughness: Math.max(0.0, Math.min(1.0, roughness)),
      ao: 1.0,
      normalScale: 1.0,
    };
  }

  /**
   * 验证材质配置
   *
   * @param config 材质配置
   * @returns 是否有效
   */
  public static validate(config: PBRConfig): boolean {
    // 检查albedo范围 [0, 1]
    if (
      config.albedo[0] < 0 ||
      config.albedo[0] > 1 ||
      config.albedo[1] < 0 ||
      config.albedo[1] > 1 ||
      config.albedo[2] < 0 ||
      config.albedo[2] > 1
    ) {
      return false;
    }

    // 检查metalness和roughness范围 [0, 1]
    if (config.metalness < 0 || config.metalness > 1 || config.roughness < 0 || config.roughness > 1) {
      return false;
    }

    return true;
  }
}
