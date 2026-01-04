/**
 * UnlitMaterial - 无光照材质
 *
 * @packageDocumentation
 *
 * @remarks
 * UnlitMaterial 是一个简单的无光照材质，只使用基础颜色或纹理。
 * 适用于 UI、天空盒、调试可视化等场景。
 *
 * ## 使用示例
 * ```typescript
 * const material = new UnlitMaterial(device, {
 *   color: [1, 0, 0, 1],
 * });
 *
 * // 或使用纹理
 * const material = new UnlitMaterial(device, {
 *   texture: 'textures/sprite.png',
 * });
 * ```
 */

import type { IRHIDevice } from '@maxellabs/specification';
import { MaterialInstance } from '@maxellabs/core';
import type { IMaterialResource } from '@maxellabs/specification';

/**
 * Unlit 材质配置
 */
export interface UnlitMaterialConfig {
  /** 颜色 [r, g, b, a] (默认: [1, 1, 1, 1]) */
  color?: [number, number, number, number];

  /** 纹理 URI */
  texture?: string;

  /** 透明度模式 (默认: 'opaque') */
  alphaMode?: 'opaque' | 'mask' | 'blend';

  /** 透明度裁剪阈值 (默认: 0.5) */
  alphaCutoff?: number;

  /** 双面渲染 (默认: false) */
  doubleSided?: boolean;
}

/**
 * Unlit 属性名称常量
 * @internal
 */
const UNLIT_PROPERTIES = {
  COLOR: 'u_Color',
  ALPHA_CUTOFF: 'u_AlphaCutoff',
} as const;

/**
 * Unlit 纹理槽名称常量
 * @internal
 */
const UNLIT_TEXTURE_SLOTS = {
  MAIN: 'mainTexture',
} as const;

/**
 * Unlit 着色器 ID
 * @internal
 */
const UNLIT_SHADER_ID = 'engine:unlit';

/**
 * 创建 Unlit 材质资源
 * @internal
 */
function createUnlitMaterialResource(config: UnlitMaterialConfig): IMaterialResource {
  const properties: Record<string, unknown> = {
    [UNLIT_PROPERTIES.COLOR]: config.color ?? [1, 1, 1, 1],
    [UNLIT_PROPERTIES.ALPHA_CUTOFF]: config.alphaCutoff ?? 0.5,
    // 渲染状态作为属性存储，由 Renderer 处理
    _alphaMode: config.alphaMode ?? 'opaque',
    _doubleSided: config.doubleSided ?? false,
  };

  const textures: Record<string, string> = {};
  if (config.texture) {
    textures[UNLIT_TEXTURE_SLOTS.MAIN] = config.texture;
  }

  return {
    shaderId: UNLIT_SHADER_ID,
    properties,
    textures,
  };
}

/**
 * UnlitMaterial - 无光照材质实现
 *
 * @remarks
 * 继承自 Core 的 MaterialInstance，提供简单的无光照渲染。
 */
export class UnlitMaterial extends MaterialInstance {
  /** 材质配置 */
  private readonly _config: Required<Omit<UnlitMaterialConfig, 'texture'>> & {
    texture?: string;
  };

  /** RHI 设备 */
  private readonly _device: IRHIDevice;

  /**
   * 创建 UnlitMaterial
   * @param device RHI 设备
   * @param config 材质配置
   */
  constructor(device: IRHIDevice, config: UnlitMaterialConfig = {}) {
    const materialResource = createUnlitMaterialResource(config);
    super(materialResource, device);

    this._device = device;
    this._config = {
      color: config.color ?? [1, 1, 1, 1],
      alphaMode: config.alphaMode ?? 'opaque',
      alphaCutoff: config.alphaCutoff ?? 0.5,
      doubleSided: config.doubleSided ?? false,
      texture: config.texture,
    };
  }

  /** 获取颜色 */
  get color(): [number, number, number, number] {
    return [...this._config.color] as [number, number, number, number];
  }

  /** 设置颜色 */
  set color(value: [number, number, number, number]) {
    this._config.color = [...value] as [number, number, number, number];
    this.setProperty(UNLIT_PROPERTIES.COLOR, this._config.color);
  }

  /** 获取纹理 URI */
  get texture(): string | undefined {
    return this._config.texture;
  }

  /** 设置纹理 */
  set texture(value: string | undefined) {
    this._config.texture = value;
    if (value) {
      this.setTexture(UNLIT_TEXTURE_SLOTS.MAIN, value);
    }
  }

  /** 获取透明度模式 */
  get alphaMode(): 'opaque' | 'mask' | 'blend' {
    return this._config.alphaMode;
  }

  /** 设置透明度模式 */
  set alphaMode(value: 'opaque' | 'mask' | 'blend') {
    this._config.alphaMode = value;
  }

  /** 获取透明度裁剪阈值 */
  get alphaCutoff(): number {
    return this._config.alphaCutoff;
  }

  /** 设置透明度裁剪阈值 */
  set alphaCutoff(value: number) {
    this._config.alphaCutoff = Math.max(0, Math.min(1, value));
    this.setProperty(UNLIT_PROPERTIES.ALPHA_CUTOFF, this._config.alphaCutoff);
  }

  /** 是否双面渲染 */
  get doubleSided(): boolean {
    return this._config.doubleSided;
  }

  /** 设置双面渲染 */
  set doubleSided(value: boolean) {
    this._config.doubleSided = value;
  }

  /**
   * 序列化为 JSON
   */
  toJSON(): UnlitMaterialConfig {
    return {
      color: this.color,
      texture: this.texture,
      alphaMode: this.alphaMode,
      alphaCutoff: this.alphaCutoff,
      doubleSided: this.doubleSided,
    };
  }

  /**
   * 从 JSON 反序列化
   */
  static fromJSON(device: IRHIDevice, data: UnlitMaterialConfig): UnlitMaterial {
    return new UnlitMaterial(device, data);
  }

  /**
   * 克隆材质
   */
  clone(): UnlitMaterial {
    return UnlitMaterial.fromJSON(this._device, this.toJSON());
  }
}
