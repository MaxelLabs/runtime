/**
 * Light Components
 * 光源相关的数据组件
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策
 *
 * 光源组件用于定义场景中的光照。
 * 支持以下光源类型：
 * - **DirectionalLight**：方向光（太阳光）
 * - **PointLight**：点光源
 * - **SpotLight**：聚光灯
 *
 * 所有组件都继承自 Component 基类，提供：
 * - 引用计数管理（继承自 ReferResource）
 * - 组件启用/禁用状态
 * - 组件脏标记（用于优化更新）
 */

import { Component } from '../base';
import type {
  ColorLike,
  IDirectionalLightData,
  IPointLightData,
  ISpotLightData,
  ShadowType,
  IShadowConfig,
} from '@maxellabs/specification';
import { LightType } from '@maxellabs/specification';
// ============ 默认值 ============

/**
 * 默认光源颜色（白色）
 */
const DEFAULT_LIGHT_COLOR: ColorLike = { r: 1, g: 1, b: 1, a: 1 };

/**
 * 默认光源强度
 */
const DEFAULT_INTENSITY = 1;

/**
 * 默认阴影配置
 */
const DEFAULT_SHADOW_CONFIG: IShadowConfig = {
  enabled: false,
  type: 'soft' as ShadowType,
  resolution: 1024,
  bias: 0.005,
  normalBias: 0.02,
  strength: 1,
  distance: 50,
};

/**
 * 默认裁剪掩码（全部层）
 */
const DEFAULT_CULLING_MASK = 0xffffffff;

/**
 * 默认点光范围
 */
const DEFAULT_RANGE = 10;

/**
 * 默认聚光灯内锥角（30度）
 */
const DEFAULT_INNER_CONE_ANGLE = Math.PI / 6;

/**
 * 默认聚光灯外锥角（45度）
 */
const DEFAULT_OUTER_CONE_ANGLE = Math.PI / 4;

// ============ 光源组件 ============

/**
 * DirectionalLight Component - 方向光组件
 * @description 模拟无限远的平行光（如太阳光）
 * @implements IDirectionalLightData from @maxellabs/specification
 */
export class DirectionalLight extends Component implements IDirectionalLightData {
  /** 光源类型 */
  readonly lightType: LightType.Directional = LightType.Directional;

  /** 光源颜色 */
  color: ColorLike = { ...DEFAULT_LIGHT_COLOR };

  /** 光源强度 */
  intensity: number = DEFAULT_INTENSITY;

  /** 是否投射阴影 */
  castShadow: boolean = true;

  /** 阴影配置 */
  shadow: IShadowConfig = { ...DEFAULT_SHADOW_CONFIG, cascadeCount: 4 };

  /** 裁剪掩码 */
  cullingMask: number = DEFAULT_CULLING_MASK;

  /**
   * 从规范数据创建组件
   */
  static fromData(data: Partial<IDirectionalLightData>): DirectionalLight {
    const component = new DirectionalLight();

    if (data.color !== undefined) {
      component.color = { ...data.color };
    }
    if (data.intensity !== undefined) {
      component.intensity = data.intensity;
    }
    if (data.castShadow !== undefined) {
      component.castShadow = data.castShadow;
    }
    if (data.shadow !== undefined) {
      component.shadow = { ...DEFAULT_SHADOW_CONFIG, ...data.shadow };
    }
    if (data.cullingMask !== undefined) {
      component.cullingMask = data.cullingMask;
    }

    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): DirectionalLight {
    const cloned = new DirectionalLight();
    cloned.color = { ...this.color };
    cloned.intensity = this.intensity;
    cloned.castShadow = this.castShadow;
    cloned.shadow = { ...this.shadow };
    cloned.cullingMask = this.cullingMask;
    return cloned;
  }

  /**
   * 设置光源颜色
   */
  setColor(r: number, g: number, b: number): this {
    this.color.r = r;
    this.color.g = g;
    this.color.b = b;
    this.markDirty();
    return this;
  }
}

/**
 * PointLight Component - 点光源组件
 * @description 从一个点向四周发射光线
 * @implements IPointLightData from @maxellabs/specification
 */
export class PointLight extends Component implements IPointLightData {
  /** 光源类型 */
  readonly lightType: LightType.Point = LightType.Point;

  /** 光源颜色 */
  color: ColorLike = { ...DEFAULT_LIGHT_COLOR };

  /** 光源强度 */
  intensity: number = DEFAULT_INTENSITY;

  /** 光照范围 */
  range: number = DEFAULT_RANGE;

  /** 是否投射阴影 */
  castShadow: boolean = false;

  /** 阴影配置 */
  shadow: IShadowConfig = { ...DEFAULT_SHADOW_CONFIG };

  /** 裁剪掩码 */
  cullingMask: number = DEFAULT_CULLING_MASK;

  /**
   * 从规范数据创建组件
   */
  static fromData(data: Partial<IPointLightData>): PointLight {
    const component = new PointLight();

    if (data.color !== undefined) {
      component.color = { ...data.color };
    }
    if (data.intensity !== undefined) {
      component.intensity = data.intensity;
    }
    if (data.range !== undefined) {
      component.range = data.range;
    }
    if (data.castShadow !== undefined) {
      component.castShadow = data.castShadow;
    }
    if (data.shadow !== undefined) {
      component.shadow = { ...DEFAULT_SHADOW_CONFIG, ...data.shadow };
    }
    if (data.cullingMask !== undefined) {
      component.cullingMask = data.cullingMask;
    }

    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): PointLight {
    const cloned = new PointLight();
    cloned.color = { ...this.color };
    cloned.intensity = this.intensity;
    cloned.range = this.range;
    cloned.castShadow = this.castShadow;
    cloned.shadow = { ...this.shadow };
    cloned.cullingMask = this.cullingMask;
    return cloned;
  }

  /**
   * 设置光源颜色
   */
  setColor(r: number, g: number, b: number): this {
    this.color.r = r;
    this.color.g = g;
    this.color.b = b;
    this.markDirty();
    return this;
  }
}

/**
 * SpotLight Component - 聚光灯组件
 * @description 从一个点向锥形区域发射光线
 * @implements ISpotLightData from @maxellabs/specification
 */
export class SpotLight extends Component implements ISpotLightData {
  /** 光源类型 */
  readonly lightType: LightType.Spot = LightType.Spot;

  /** 光源颜色 */
  color: ColorLike = { ...DEFAULT_LIGHT_COLOR };

  /** 光源强度 */
  intensity: number = DEFAULT_INTENSITY;

  /** 光照范围 */
  range: number = DEFAULT_RANGE;

  /** 内锥角度（弧度） */
  innerConeAngle: number = DEFAULT_INNER_CONE_ANGLE;

  /** 外锥角度（弧度） */
  outerConeAngle: number = DEFAULT_OUTER_CONE_ANGLE;

  /** 是否投射阴影 */
  castShadow: boolean = false;

  /** 阴影配置 */
  shadow: IShadowConfig = { ...DEFAULT_SHADOW_CONFIG };

  /** 裁剪掩码 */
  cullingMask: number = DEFAULT_CULLING_MASK;

  /**
   * 从规范数据创建组件
   */
  static fromData(data: Partial<ISpotLightData>): SpotLight {
    const component = new SpotLight();

    if (data.color !== undefined) {
      component.color = { ...data.color };
    }
    if (data.intensity !== undefined) {
      component.intensity = data.intensity;
    }
    if (data.range !== undefined) {
      component.range = data.range;
    }
    if (data.innerConeAngle !== undefined) {
      component.innerConeAngle = data.innerConeAngle;
    }
    if (data.outerConeAngle !== undefined) {
      component.outerConeAngle = data.outerConeAngle;
    }
    if (data.castShadow !== undefined) {
      component.castShadow = data.castShadow;
    }
    if (data.shadow !== undefined) {
      component.shadow = { ...DEFAULT_SHADOW_CONFIG, ...data.shadow };
    }
    if (data.cullingMask !== undefined) {
      component.cullingMask = data.cullingMask;
    }

    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): SpotLight {
    const cloned = new SpotLight();
    cloned.color = { ...this.color };
    cloned.intensity = this.intensity;
    cloned.range = this.range;
    cloned.innerConeAngle = this.innerConeAngle;
    cloned.outerConeAngle = this.outerConeAngle;
    cloned.castShadow = this.castShadow;
    cloned.shadow = { ...this.shadow };
    cloned.cullingMask = this.cullingMask;
    return cloned;
  }

  /**
   * 设置光源颜色
   */
  setColor(r: number, g: number, b: number): this {
    this.color.r = r;
    this.color.g = g;
    this.color.b = b;
    this.markDirty();
    return this;
  }

  /**
   * 设置锥角
   */
  setConeAngles(inner: number, outer: number): this {
    this.innerConeAngle = inner;
    this.outerConeAngle = outer;
    this.markDirty();
    return this;
  }
}

/**
 * AmbientLight Component - 环境光组件
 * @description 全局均匀光照，无方向和位置
 */
export class AmbientLight extends Component {
  /** 光源颜色 */
  color: ColorLike = { r: 0.1, g: 0.1, b: 0.1, a: 1 };

  /** 光源强度 */
  intensity: number = 1;

  /**
   * 从规范数据创建组件
   */
  static fromData(data: Partial<{ color: ColorLike; intensity: number }>): AmbientLight {
    const component = new AmbientLight();

    if (data.color !== undefined) {
      component.color = { ...data.color };
    }
    if (data.intensity !== undefined) {
      component.intensity = data.intensity;
    }

    return component;
  }

  /**
   * 克隆组件
   */
  override clone(): AmbientLight {
    const cloned = new AmbientLight();
    cloned.color = { ...this.color };
    cloned.intensity = this.intensity;
    return cloned;
  }
}
