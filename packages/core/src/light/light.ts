import { Component } from '../base/component';
import { Entity } from '../base/entity';
import { Vector3 } from '@maxellabs/math';

/**
 * 光源类型枚举
 */
export enum LightType {
  /** 平行光 */
  Directional,
  /** 点光源 */
  Point,
  /** 聚光灯 */
  Spot,
  /** 环境光 */
  Ambient
}

/**
 * 光源基类
 */
export abstract class Light extends Component {
  /** 光源类型 */
  protected _type: LightType;
  /** 光源颜色 (RGB, 范围0-1) */
  protected _color: Vector3 = new Vector3(1, 1, 1);
  /** 光源强度 */
  protected _intensity: number = 1.0;
  /** 是否投射阴影 */
  protected _castShadow: boolean = false;
  /** 阴影贴图大小 */
  protected _shadowMapSize: number = 1024;
  /** 阴影偏移 */
  protected _shadowBias: number = 0.005;

  /**
   * 创建一个新的光源组件
   * @param entity 所属实体
   * @param type 光源类型
   */
  constructor(entity: Entity, type: LightType) {
    super(entity);
    this._type = type;
  }

  /** 获取光源类型 */
  get type(): LightType {
    return this._type;
  }

  /** 获取光源颜色 */
  get color(): Vector3 {
    return this._color.clone();
  }

  /** 设置光源颜色 */
  set color(value: Vector3) {
    this._color.copyFrom(value);
  }

  /** 设置光源RGB颜色 */
  setColor(r: number, g: number, b: number): void {
    this._color.set(r, g, b);
  }

  /** 获取光源强度 */
  get intensity(): number {
    return this._intensity;
  }

  /** 设置光源强度 */
  set intensity(value: number) {
    this._intensity = value;
  }

  /** 获取是否投射阴影 */
  get castShadow(): boolean {
    return this._castShadow;
  }

  /** 设置是否投射阴影 */
  set castShadow(value: boolean) {
    this._castShadow = value;
  }

  /** 获取阴影贴图大小 */
  get shadowMapSize(): number {
    return this._shadowMapSize;
  }

  /** 设置阴影贴图大小 */
  set shadowMapSize(value: number) {
    this._shadowMapSize = Math.pow(2, Math.round(Math.log2(value))); // 确保是2的幂次方
  }

  /** 获取阴影偏移 */
  get shadowBias(): number {
    return this._shadowBias;
  }

  /** 设置阴影偏移 */
  set shadowBias(value: number) {
    this._shadowBias = value;
  }

  /** 当组件启用时调用 */
  override onEnable(): void {
    // 子类可以重写该方法
  }

  /** 当组件禁用时调用 */
  override onDisable(): void {
    // 子类可以重写该方法
  }
}

/**
 * 平行光，模拟从无限远处照射的光线，如太阳光
 */
export class DirectionalLight extends Light {
  /** 光源方向 */
  private _direction: Vector3 = new Vector3(0, -1, 0);
  /** 阴影距离 */
  private _shadowDistance: number = 50;
  /** 阴影正交相机尺寸 */
  private _shadowOrthoSize: number = 10;

  /**
   * 创建一个新的平行光组件
   * @param entity 所属实体
   */
  constructor(entity: Entity) {
    super(entity, LightType.Directional);
  }

  /** 获取光源方向 */
  get direction(): Vector3 {
    // 使用实体的前方向作为光源方向
    return this.entity.transform.forward;
  }

  /** 设置光源方向 */
  set direction(value: Vector3) {
    // 旋转实体使其前方向朝向指定方向
    this._direction.copyFrom(value).normalize();
    const normalizedDir = this._direction.clone().normalize();
    this.entity.transform.lookAt(
      new Vector3(
        this.entity.transform.worldPosition.x + normalizedDir.x,
        this.entity.transform.worldPosition.y + normalizedDir.y,
        this.entity.transform.worldPosition.z + normalizedDir.z
      )
    );
  }

  /** 获取阴影距离 */
  get shadowDistance(): number {
    return this._shadowDistance;
  }

  /** 设置阴影距离 */
  set shadowDistance(value: number) {
    this._shadowDistance = Math.max(0.1, value);
  }

  /** 获取阴影正交相机尺寸 */
  get shadowOrthoSize(): number {
    return this._shadowOrthoSize;
  }

  /** 设置阴影正交相机尺寸 */
  set shadowOrthoSize(value: number) {
    this._shadowOrthoSize = Math.max(0.1, value);
  }
}

/**
 * 点光源，从一个点向四面八方发射光线
 */
export class PointLight extends Light {
  /** 光照范围，超出此范围光照衰减为0 */
  private _range: number = 10;
  /** 衰减系数，影响光照强度随距离衰减的速率 */
  private _attenuation: number = 1.0;

  /**
   * 创建一个新的点光源组件
   * @param entity 所属实体
   */
  constructor(entity: Entity) {
    super(entity, LightType.Point);
  }

  /** 获取光照范围 */
  get range(): number {
    return this._range;
  }

  /** 设置光照范围 */
  set range(value: number) {
    this._range = Math.max(0, value);
  }

  /** 获取衰减系数 */
  get attenuation(): number {
    return this._attenuation;
  }

  /** 设置衰减系数 */
  set attenuation(value: number) {
    this._attenuation = Math.max(0, value);
  }

  /** 
   * 计算给定位置处的光照强度
   * @param position 世界空间中的位置
   * @returns 光照强度，范围0-1
   */
  calculateIntensityAt(position: Vector3): number {
    const lightPos = this.entity.transform.worldPosition;
    const distance = position.distanceTo(lightPos);
    
    if (distance >= this._range) return 0;
    
    // 计算基于距离的衰减
    const falloff = 1.0 - Math.pow(distance / this._range, this._attenuation);
    return Math.max(0, falloff) * this._intensity;
  }
}

/**
 * 聚光灯，从一个点发射锥形光束
 */
export class SpotLight extends Light {
  /** 光照范围，超出此范围光照衰减为0 */
  private _range: number = 10;
  /** 衰减系数，影响光照强度随距离衰减的速率 */
  private _attenuation: number = 1.0;
  /** 聚光灯内锥角度（度数） */
  private _innerConeAngle: number = 30;
  /** 聚光灯外锥角度（度数） */
  private _outerConeAngle: number = 45;

  /**
   * 创建一个新的聚光灯组件
   * @param entity 所属实体
   */
  constructor(entity: Entity) {
    super(entity, LightType.Spot);
  }

  /** 获取光照方向 */
  get direction(): Vector3 {
    // 使用实体的前方向作为光源方向
    return this.entity.transform.forward;
  }

  /** 获取光照范围 */
  get range(): number {
    return this._range;
  }

  /** 设置光照范围 */
  set range(value: number) {
    this._range = Math.max(0, value);
  }

  /** 获取衰减系数 */
  get attenuation(): number {
    return this._attenuation;
  }

  /** 设置衰减系数 */
  set attenuation(value: number) {
    this._attenuation = Math.max(0, value);
  }

  /** 获取内锥角度（度数） */
  get innerConeAngle(): number {
    return this._innerConeAngle;
  }

  /** 设置内锥角度（度数） */
  set innerConeAngle(value: number) {
    this._innerConeAngle = Math.max(0, Math.min(value, this._outerConeAngle));
  }

  /** 获取外锥角度（度数） */
  get outerConeAngle(): number {
    return this._outerConeAngle;
  }

  /** 设置外锥角度（度数） */
  set outerConeAngle(value: number) {
    this._outerConeAngle = Math.max(this._innerConeAngle, Math.min(value, 90));
  }

  /** 
   * 计算给定位置处的光照强度
   * @param position 世界空间中的位置
   * @returns 光照强度，范围0-1
   */
  calculateIntensityAt(position: Vector3): number {
    const lightPos = this.entity.transform.worldPosition;
    const lightDir = this.direction;
    
    // 计算到目标点的向量
    const toTarget = position.subtract(lightPos).normalize();
    
    // 计算与光照方向的夹角余弦值
    const cosAngle = lightDir.dot(toTarget);
    
    // 转换角度范围
    const innerCos = Math.cos(this._innerConeAngle * Math.PI / 180);
    const outerCos = Math.cos(this._outerConeAngle * Math.PI / 180);
    
    // 如果在外锥角之外，则没有光照
    if (cosAngle < outerCos) return 0;
    
    // 计算距离衰减
    const distance = position.distanceTo(lightPos);
    if (distance >= this._range) return 0;
    const distanceFalloff = 1.0 - Math.pow(distance / this._range, this._attenuation);
    
    // 计算角度衰减
    let angleFalloff = 1.0;
    if (cosAngle < innerCos) {
      // 在内锥角和外锥角之间，光照强度平滑过渡
      angleFalloff = (cosAngle - outerCos) / (innerCos - outerCos);
    }
    
    return Math.max(0, distanceFalloff * angleFalloff) * this._intensity;
  }
}

/**
 * 环境光，为场景提供基础环境光照
 */
export class AmbientLight extends Light {
  /**
   * 创建一个新的环境光组件
   * @param entity 所属实体
   */
  constructor(entity: Entity) {
    super(entity, LightType.Ambient);
    // 环境光不投射阴影
    this._castShadow = false;
  }
} 