/**
 * PBRMaterial - 基于物理的渲染材质
 *
 * @packageDocumentation
 *
 * @remarks
 * PBRMaterial 实现了 glTF 2.0 标准的 PBR 金属度-粗糙度工作流。
 *
 * ## 支持的属性
 * - baseColor: 基础颜色 (RGBA)
 * - metallic: 金属度 (0-1)
 * - roughness: 粗糙度 (0-1)
 * - normal: 法线贴图
 * - occlusion: 环境光遮蔽
 * - emissive: 自发光
 *
 * ## 使用示例
 * ```typescript
 * const material = new PBRMaterial(device, {
 *   baseColor: [1, 0, 0, 1],
 *   metallic: 0.0,
 *   roughness: 0.5
 * });
 *
 * // 动态修改
 * material.baseColor = [0, 1, 0, 1];
 * material.roughness = 0.8;
 * ```
 */

import type { IRHIDevice } from '@maxellabs/specification';
import { MaterialInstance } from '@maxellabs/core';
import type { IMaterialResource } from '@maxellabs/specification';

/**
 * 透明度模式
 */
export type AlphaMode = 'opaque' | 'mask' | 'blend';

/**
 * PBR 材质配置
 */
export interface PBRMaterialConfig {
  /** 基础颜色 [r, g, b, a] (默认: [1, 1, 1, 1]) */
  baseColor?: [number, number, number, number];

  /** 基础颜色纹理 URI */
  baseColorTexture?: string;

  /** 金属度 (0-1, 默认: 0) */
  metallic?: number;

  /** 粗糙度 (0-1, 默认: 1) */
  roughness?: number;

  /** 金属度-粗糙度纹理 URI */
  metallicRoughnessTexture?: string;

  /** 法线纹理 URI */
  normalTexture?: string;

  /** 法线缩放 (默认: 1) */
  normalScale?: number;

  /** 遮蔽纹理 URI */
  occlusionTexture?: string;

  /** 遮蔽强度 (默认: 1) */
  occlusionStrength?: number;

  /** 自发光颜色 [r, g, b] (默认: [0, 0, 0]) */
  emissiveColor?: [number, number, number];

  /** 自发光纹理 URI */
  emissiveTexture?: string;

  /** 自发光强度 (默认: 1) */
  emissiveIntensity?: number;

  /** 透明度模式 (默认: 'opaque') */
  alphaMode?: AlphaMode;

  /** 透明度裁剪阈值 (alphaMode='mask' 时使用, 默认: 0.5) */
  alphaCutoff?: number;

  /** 双面渲染 (默认: false) */
  doubleSided?: boolean;
}

/**
 * PBR 材质属性名称常量
 * @internal
 */
const PBR_PROPERTIES = {
  BASE_COLOR: 'u_BaseColor',
  METALLIC: 'u_Metallic',
  ROUGHNESS: 'u_Roughness',
  NORMAL_SCALE: 'u_NormalScale',
  OCCLUSION_STRENGTH: 'u_OcclusionStrength',
  EMISSIVE_COLOR: 'u_EmissiveColor',
  EMISSIVE_INTENSITY: 'u_EmissiveIntensity',
  ALPHA_CUTOFF: 'u_AlphaCutoff',
} as const;

/**
 * PBR 纹理槽名称常量
 * @internal
 */
const PBR_TEXTURE_SLOTS = {
  BASE_COLOR: 'baseColorTexture',
  METALLIC_ROUGHNESS: 'metallicRoughnessTexture',
  NORMAL: 'normalTexture',
  OCCLUSION: 'occlusionTexture',
  EMISSIVE: 'emissiveTexture',
} as const;

/**
 * PBR 着色器 ID
 * @internal
 */
const PBR_SHADER_ID = 'engine:pbr';

/**
 * 创建 PBR 材质资源
 * @internal
 */
function createPBRMaterialResource(config: PBRMaterialConfig): IMaterialResource {
  const properties: Record<string, unknown> = {
    [PBR_PROPERTIES.BASE_COLOR]: config.baseColor ?? [1, 1, 1, 1],
    [PBR_PROPERTIES.METALLIC]: config.metallic ?? 0,
    [PBR_PROPERTIES.ROUGHNESS]: config.roughness ?? 1,
    [PBR_PROPERTIES.NORMAL_SCALE]: config.normalScale ?? 1,
    [PBR_PROPERTIES.OCCLUSION_STRENGTH]: config.occlusionStrength ?? 1,
    [PBR_PROPERTIES.EMISSIVE_COLOR]: config.emissiveColor ?? [0, 0, 0],
    [PBR_PROPERTIES.EMISSIVE_INTENSITY]: config.emissiveIntensity ?? 1,
    [PBR_PROPERTIES.ALPHA_CUTOFF]: config.alphaCutoff ?? 0.5,
    // 渲染状态作为属性存储，由 Renderer 处理
    _alphaMode: config.alphaMode ?? 'opaque',
    _doubleSided: config.doubleSided ?? false,
  };

  const textures: Record<string, string> = {};
  if (config.baseColorTexture) {
    textures[PBR_TEXTURE_SLOTS.BASE_COLOR] = config.baseColorTexture;
  }
  if (config.metallicRoughnessTexture) {
    textures[PBR_TEXTURE_SLOTS.METALLIC_ROUGHNESS] = config.metallicRoughnessTexture;
  }
  if (config.normalTexture) {
    textures[PBR_TEXTURE_SLOTS.NORMAL] = config.normalTexture;
  }
  if (config.occlusionTexture) {
    textures[PBR_TEXTURE_SLOTS.OCCLUSION] = config.occlusionTexture;
  }
  if (config.emissiveTexture) {
    textures[PBR_TEXTURE_SLOTS.EMISSIVE] = config.emissiveTexture;
  }

  return {
    shaderId: PBR_SHADER_ID,
    properties,
    textures,
  };
}

/**
 * PBRMaterial - PBR 材质实现
 *
 * @remarks
 * 继承自 Core 的 MaterialInstance，添加 PBR 特定的属性访问器。
 *
 * ## 设计原则
 * 1. 继承 MaterialInstance 以复用参数管理和 GPU 绑定
 * 2. 提供类型安全的属性访问器
 * 3. 支持运行时属性修改
 * 4. 支持序列化/反序列化
 */
export class PBRMaterial extends MaterialInstance {
  /** 材质配置 */
  private readonly _config: Required<
    Omit<
      PBRMaterialConfig,
      'baseColorTexture' | 'metallicRoughnessTexture' | 'normalTexture' | 'occlusionTexture' | 'emissiveTexture'
    >
  > & {
    baseColorTexture?: string;
    metallicRoughnessTexture?: string;
    normalTexture?: string;
    occlusionTexture?: string;
    emissiveTexture?: string;
  };

  /** RHI 设备 */
  private readonly _device: IRHIDevice;

  /**
   * 创建 PBRMaterial
   * @param device RHI 设备
   * @param config 材质配置
   */
  constructor(device: IRHIDevice, config: PBRMaterialConfig = {}) {
    const materialResource = createPBRMaterialResource(config);
    super(materialResource, device);

    this._device = device;
    this._config = {
      baseColor: config.baseColor ?? [1, 1, 1, 1],
      metallic: config.metallic ?? 0,
      roughness: config.roughness ?? 1,
      normalScale: config.normalScale ?? 1,
      occlusionStrength: config.occlusionStrength ?? 1,
      emissiveColor: config.emissiveColor ?? [0, 0, 0],
      emissiveIntensity: config.emissiveIntensity ?? 1,
      alphaMode: config.alphaMode ?? 'opaque',
      alphaCutoff: config.alphaCutoff ?? 0.5,
      doubleSided: config.doubleSided ?? false,
      baseColorTexture: config.baseColorTexture,
      metallicRoughnessTexture: config.metallicRoughnessTexture,
      normalTexture: config.normalTexture,
      occlusionTexture: config.occlusionTexture,
      emissiveTexture: config.emissiveTexture,
    };
  }

  // ==================== 基础颜色 ====================

  /** 获取基础颜色 */
  get baseColor(): [number, number, number, number] {
    return [...this._config.baseColor] as [number, number, number, number];
  }

  /** 设置基础颜色 */
  set baseColor(value: [number, number, number, number]) {
    this._config.baseColor = [...value] as [number, number, number, number];
    this.setProperty(PBR_PROPERTIES.BASE_COLOR, this._config.baseColor);
  }

  /** 获取基础颜色纹理 URI */
  get baseColorTexture(): string | undefined {
    return this._config.baseColorTexture;
  }

  /** 设置基础颜色纹理 */
  set baseColorTexture(value: string | undefined) {
    this._config.baseColorTexture = value;
    if (value) {
      this.setTexture(PBR_TEXTURE_SLOTS.BASE_COLOR, value);
    }
  }

  // ==================== 金属度-粗糙度 ====================

  /** 获取金属度 */
  get metallic(): number {
    return this._config.metallic;
  }

  /** 设置金属度 */
  set metallic(value: number) {
    this._config.metallic = Math.max(0, Math.min(1, value));
    this.setProperty(PBR_PROPERTIES.METALLIC, this._config.metallic);
  }

  /** 获取粗糙度 */
  get roughness(): number {
    return this._config.roughness;
  }

  /** 设置粗糙度 */
  set roughness(value: number) {
    this._config.roughness = Math.max(0, Math.min(1, value));
    this.setProperty(PBR_PROPERTIES.ROUGHNESS, this._config.roughness);
  }

  /** 获取金属度-粗糙度纹理 URI */
  get metallicRoughnessTexture(): string | undefined {
    return this._config.metallicRoughnessTexture;
  }

  /** 设置金属度-粗糙度纹理 */
  set metallicRoughnessTexture(value: string | undefined) {
    this._config.metallicRoughnessTexture = value;
    if (value) {
      this.setTexture(PBR_TEXTURE_SLOTS.METALLIC_ROUGHNESS, value);
    }
  }

  // ==================== 法线 ====================

  /** 获取法线纹理 URI */
  get normalTexture(): string | undefined {
    return this._config.normalTexture;
  }

  /** 设置法线纹理 */
  set normalTexture(value: string | undefined) {
    this._config.normalTexture = value;
    if (value) {
      this.setTexture(PBR_TEXTURE_SLOTS.NORMAL, value);
    }
  }

  /** 获取法线缩放 */
  get normalScale(): number {
    return this._config.normalScale;
  }

  /** 设置法线缩放 */
  set normalScale(value: number) {
    this._config.normalScale = value;
    this.setProperty(PBR_PROPERTIES.NORMAL_SCALE, value);
  }

  // ==================== 遮蔽 ====================

  /** 获取遮蔽纹理 URI */
  get occlusionTexture(): string | undefined {
    return this._config.occlusionTexture;
  }

  /** 设置遮蔽纹理 */
  set occlusionTexture(value: string | undefined) {
    this._config.occlusionTexture = value;
    if (value) {
      this.setTexture(PBR_TEXTURE_SLOTS.OCCLUSION, value);
    }
  }

  /** 获取遮蔽强度 */
  get occlusionStrength(): number {
    return this._config.occlusionStrength;
  }

  /** 设置遮蔽强度 */
  set occlusionStrength(value: number) {
    this._config.occlusionStrength = Math.max(0, Math.min(1, value));
    this.setProperty(PBR_PROPERTIES.OCCLUSION_STRENGTH, this._config.occlusionStrength);
  }

  // ==================== 自发光 ====================

  /** 获取自发光颜色 */
  get emissiveColor(): [number, number, number] {
    return [...this._config.emissiveColor] as [number, number, number];
  }

  /** 设置自发光颜色 */
  set emissiveColor(value: [number, number, number]) {
    this._config.emissiveColor = [...value] as [number, number, number];
    this.setProperty(PBR_PROPERTIES.EMISSIVE_COLOR, this._config.emissiveColor);
  }

  /** 获取自发光纹理 URI */
  get emissiveTexture(): string | undefined {
    return this._config.emissiveTexture;
  }

  /** 设置自发光纹理 */
  set emissiveTexture(value: string | undefined) {
    this._config.emissiveTexture = value;
    if (value) {
      this.setTexture(PBR_TEXTURE_SLOTS.EMISSIVE, value);
    }
  }

  /** 获取自发光强度 */
  get emissiveIntensity(): number {
    return this._config.emissiveIntensity;
  }

  /** 设置自发光强度 */
  set emissiveIntensity(value: number) {
    this._config.emissiveIntensity = Math.max(0, value);
    this.setProperty(PBR_PROPERTIES.EMISSIVE_INTENSITY, this._config.emissiveIntensity);
  }

  // ==================== 透明度 ====================

  /** 获取透明度模式 */
  get alphaMode(): AlphaMode {
    return this._config.alphaMode;
  }

  /** 设置透明度模式 */
  set alphaMode(value: AlphaMode) {
    this._config.alphaMode = value;
    // Note: alphaMode 影响渲染状态，需要重建 Pipeline
    // 这里仅记录状态，实际渲染状态在 Renderer 中处理
  }

  /** 获取透明度裁剪阈值 */
  get alphaCutoff(): number {
    return this._config.alphaCutoff;
  }

  /** 设置透明度裁剪阈值 */
  set alphaCutoff(value: number) {
    this._config.alphaCutoff = Math.max(0, Math.min(1, value));
    this.setProperty(PBR_PROPERTIES.ALPHA_CUTOFF, this._config.alphaCutoff);
  }

  // ==================== 双面渲染 ====================

  /** 是否双面渲染 */
  get doubleSided(): boolean {
    return this._config.doubleSided;
  }

  /** 设置双面渲染 */
  set doubleSided(value: boolean) {
    this._config.doubleSided = value;
    // Note: doubleSided 影响渲染状态，需要重建 Pipeline
    // 这里仅记录状态，实际渲染状态在 Renderer 中处理
  }

  // ==================== 序列化 ====================

  /**
   * 序列化为 JSON
   * @returns 材质属性对象
   */
  toJSON(): PBRMaterialConfig {
    return {
      baseColor: this.baseColor,
      metallic: this.metallic,
      roughness: this.roughness,
      normalScale: this.normalScale,
      occlusionStrength: this.occlusionStrength,
      emissiveColor: this.emissiveColor,
      emissiveIntensity: this.emissiveIntensity,
      alphaMode: this.alphaMode,
      alphaCutoff: this.alphaCutoff,
      doubleSided: this.doubleSided,
      baseColorTexture: this.baseColorTexture,
      metallicRoughnessTexture: this.metallicRoughnessTexture,
      normalTexture: this.normalTexture,
      occlusionTexture: this.occlusionTexture,
      emissiveTexture: this.emissiveTexture,
    };
  }

  /**
   * 从 JSON 反序列化
   * @param device RHI 设备
   * @param data 材质属性对象
   * @returns PBRMaterial 实例
   */
  static fromJSON(device: IRHIDevice, data: PBRMaterialConfig): PBRMaterial {
    return new PBRMaterial(device, data);
  }

  /**
   * 克隆材质
   * @returns 新的 PBRMaterial 实例
   */
  clone(): PBRMaterial {
    return PBRMaterial.fromJSON(this._device, this.toJSON());
  }
}
