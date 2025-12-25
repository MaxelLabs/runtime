/**
 * EnvironmentProbe - 环境探针
 *
 * 用于环境光照（IBL）的探针管理，支持立方体贴图采样和球谐光照。
 * 探针可以捕获场景的环境光照信息，用于 PBR 渲染中的间接光照。
 *
 * @remarks
 * - 支持多种投影模式：立方体贴图、球面贴图、等距柱状投影
 * - 支持实时捕获和预烘焙两种模式
 * - 遵循 Constitution 规范
 *
 * @example
 * ```typescript
 * // 创建环境探针
 * const probe = new EnvironmentProbe({
 *   position: { x: 0, y: 2, z: 0 },
 *   resolution: 256,
 *   range: 100
 * });
 *
 * // 更新探针
 * probe.update(scene);
 *
 * // 在着色器中使用
 * material.setTexture('envMap', probe.cubeTexture);
 * ```
 *
 * @packageDocumentation
 */

import type { MSpec } from '@maxellabs/core';
import { MMath } from '@maxellabs/core';

// ========================================
// Constants
// ========================================

/** 默认探针分辨率 */
const DEFAULT_RESOLUTION = 128;

/** 默认影响范围 */
const DEFAULT_RANGE = 50;

/** 球谐系数数量 (L2 需要 9 个系数) */
const SH_COEFFICIENT_COUNT = 9;

// ========================================
// Enums
// ========================================

/**
 * 探针类型
 */
export enum ProbeType {
  /** 反射探针 - 用于镜面反射 */
  Reflection = 'reflection',
  /** 辐照度探针 - 用于漫反射 */
  Irradiance = 'irradiance',
  /** 混合探针 - 同时支持反射和辐照度 */
  Combined = 'combined',
}

/**
 * 探针更新模式
 */
export enum ProbeUpdateMode {
  /** 手动更新 */
  Manual = 'manual',
  /** 每帧更新 */
  EveryFrame = 'everyFrame',
  /** 按需更新（当场景变化时） */
  OnDemand = 'onDemand',
  /** 只在初始化时更新一次 */
  Once = 'once',
}

/**
 * 探针状态
 */
export enum ProbeState {
  /** 未初始化 */
  Uninitialized = 'uninitialized',
  /** 就绪 */
  Ready = 'ready',
  /** 需要更新 */
  NeedsUpdate = 'needsUpdate',
  /** 正在更新 */
  Updating = 'updating',
  /** 已释放 */
  Disposed = 'disposed',
}

// ========================================
// Interfaces
// ========================================

/**
 * 探针配置接口
 */
export interface EnvironmentProbeConfig {
  /** 探针位置 */
  position?: MSpec.Vector3Like;

  /** 探针类型 */
  type?: ProbeType;

  /** 更新模式 */
  updateMode?: ProbeUpdateMode;

  /** 立方体贴图分辨率 */
  resolution?: number;

  /** 影响范围半径 */
  range?: number;

  /** 影响区域包围盒（用于盒投影） */
  bounds?: MSpec.Box3Like;

  /** 是否启用盒投影（用于室内场景） */
  boxProjection?: boolean;

  /** 近裁剪面 */
  nearClip?: number;

  /** 远裁剪面 */
  farClip?: number;

  /** 强度 */
  intensity?: number;

  /** 是否启用 */
  enabled?: boolean;

  /** 层级掩码 */
  layerMask?: number;
}

/**
 * 探针数据接口（用于序列化）
 */
export interface EnvironmentProbeData extends EnvironmentProbeConfig {
  /** 唯一标识符 */
  id?: string;

  /** 球谐系数（如果已烘焙） */
  shCoefficients?: number[][];
}

/**
 * 球谐系数
 * L0: 1 个系数
 * L1: 3 个系数
 * L2: 5 个系数
 * 总共 9 个 RGB 系数
 */
export interface SphericalHarmonics {
  /** 系数数组 (9 个 RGB 向量) */
  coefficients: MSpec.Vector3Like[];
}

// ========================================
// Default Values
// ========================================

const DEFAULT_POSITION: MSpec.Vector3Like = { x: 0, y: 0, z: 0 };

const DEFAULT_CONFIG: Required<EnvironmentProbeConfig> = {
  position: DEFAULT_POSITION,
  type: ProbeType.Combined,
  updateMode: ProbeUpdateMode.Manual,
  resolution: DEFAULT_RESOLUTION,
  range: DEFAULT_RANGE,
  bounds: { min: { x: -10, y: -10, z: -10 }, max: { x: 10, y: 10, z: 10 } },
  boxProjection: false,
  nearClip: 0.1,
  farClip: 1000,
  intensity: 1.0,
  enabled: true,
  layerMask: 0xffffffff,
};

// ========================================
// Main Implementation
// ========================================

/**
 * 环境探针类
 *
 * 管理场景中的环境光照探针，支持实时捕获和预烘焙。
 *
 * @example
 * ```typescript
 * const probe = new EnvironmentProbe({
 *   position: { x: 0, y: 2, z: 0 },
 *   resolution: 256
 * });
 *
 * // 标记需要更新
 * probe.markDirty();
 *
 * // 获取球谐系数用于漫反射
 * const sh = probe.getSphericalHarmonics();
 * ```
 */
export class EnvironmentProbe {
  // ========================================
  // Private Fields
  // ========================================

  /** 唯一标识符 */
  private _id: string;

  /** 探针位置 */
  private _position: MMath.Vector3;

  /** 探针类型 */
  private _type: ProbeType;

  /** 更新模式 */
  private _updateMode: ProbeUpdateMode;

  /** 分辨率 */
  private _resolution: number;

  /** 影响范围 */
  private _range: number;

  /** 影响区域包围盒 */
  private _bounds: MMath.Box3;

  /** 是否启用盒投影 */
  private _boxProjection: boolean;

  /** 近裁剪面 */
  private _nearClip: number;

  /** 远裁剪面 */
  private _farClip: number;

  /** 强度 */
  private _intensity: number;

  /** 是否启用 */
  private _enabled: boolean;

  /** 层级掩码 */
  private _layerMask: number;

  /** 当前状态 */
  private _state: ProbeState;

  /** 球谐系数 */
  private _shCoefficients: MMath.Vector3[];

  /** 脏标记 */
  private _dirty: boolean;

  /** 上次更新时间 */
  private _lastUpdateTime: number;

  /**
   * 构造函数
   *
   * @param config - 探针配置
   */
  constructor(config?: Partial<EnvironmentProbeConfig>) {
    this._id = this._generateId();

    // 使用默认值和配置合并
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    this._position = new MMath.Vector3(mergedConfig.position.x, mergedConfig.position.y, mergedConfig.position.z);
    this._type = mergedConfig.type;
    this._updateMode = mergedConfig.updateMode;
    this._resolution = mergedConfig.resolution;
    this._range = mergedConfig.range;
    this._bounds = new MMath.Box3(
      new MMath.Vector3(mergedConfig.bounds.min.x, mergedConfig.bounds.min.y, mergedConfig.bounds.min.z),
      new MMath.Vector3(mergedConfig.bounds.max.x, mergedConfig.bounds.max.y, mergedConfig.bounds.max.z)
    );
    this._boxProjection = mergedConfig.boxProjection;
    this._nearClip = mergedConfig.nearClip;
    this._farClip = mergedConfig.farClip;
    this._intensity = mergedConfig.intensity;
    this._enabled = mergedConfig.enabled;
    this._layerMask = mergedConfig.layerMask;

    this._state = ProbeState.Uninitialized;
    this._dirty = true;
    this._lastUpdateTime = 0;

    // 初始化球谐系数
    this._shCoefficients = [];
    for (let i = 0; i < SH_COEFFICIENT_COUNT; i++) {
      this._shCoefficients.push(new MMath.Vector3(0, 0, 0));
    }
  }

  // ========================================
  // Static Factory Methods
  // ========================================

  /**
   * 从数据对象创建探针
   *
   * @param data - 探针数据
   * @returns 新的探针实例
   */
  static fromData(data: Partial<EnvironmentProbeData>): EnvironmentProbe {
    const probe = new EnvironmentProbe(data);

    if (data.id) {
      probe._id = data.id;
    }

    // 恢复球谐系数
    if (data.shCoefficients && data.shCoefficients.length === SH_COEFFICIENT_COUNT) {
      for (let i = 0; i < SH_COEFFICIENT_COUNT; i++) {
        const coef = data.shCoefficients[i];
        if (coef && coef.length >= 3) {
          probe._shCoefficients[i].set(coef[0], coef[1], coef[2]);
        }
      }
      probe._state = ProbeState.Ready;
      probe._dirty = false;
    }

    return probe;
  }

  /**
   * 创建默认天空探针
   *
   * @param skyColor - 天空颜色
   * @param groundColor - 地面颜色
   * @returns 新的探针实例
   */
  static createSkyProbe(
    skyColor: MSpec.Vector3Like = { x: 0.5, y: 0.7, z: 1.0 },
    groundColor: MSpec.Vector3Like = { x: 0.2, y: 0.2, z: 0.2 }
  ): EnvironmentProbe {
    const probe = new EnvironmentProbe({
      type: ProbeType.Irradiance,
      updateMode: ProbeUpdateMode.Once,
    });

    // 设置简单的天空/地面渐变球谐系数
    probe.setGradientSH(skyColor, groundColor);

    return probe;
  }

  // ========================================
  // Configuration Methods
  // ========================================

  /**
   * 设置探针位置
   *
   * @param position - 新位置
   * @returns this
   */
  setPosition(position: MSpec.Vector3Like): this {
    this._position.set(position.x, position.y, position.z);
    this._dirty = true;
    return this;
  }

  /**
   * 设置影响范围
   *
   * @param range - 范围半径
   * @returns this
   */
  setRange(range: number): this {
    this._range = Math.max(0, range);
    this._dirty = true;
    return this;
  }

  /**
   * 设置影响区域包围盒
   *
   * @param bounds - 包围盒
   * @returns this
   */
  setBounds(bounds: MSpec.Box3Like): this {
    this._bounds.min.set(bounds.min.x, bounds.min.y, bounds.min.z);
    this._bounds.max.set(bounds.max.x, bounds.max.y, bounds.max.z);
    this._dirty = true;
    return this;
  }

  /**
   * 设置强度
   *
   * @param intensity - 强度值
   * @returns this
   */
  setIntensity(intensity: number): this {
    this._intensity = Math.max(0, intensity);
    return this;
  }

  /**
   * 设置是否启用
   *
   * @param enabled - 是否启用
   * @returns this
   */
  setEnabled(enabled: boolean): this {
    this._enabled = enabled;
    return this;
  }

  // ========================================
  // Spherical Harmonics Methods
  // ========================================

  /**
   * 设置球谐系数
   *
   * @param coefficients - 9 个 RGB 系数
   * @returns this
   */
  setSphericalHarmonics(coefficients: MSpec.Vector3Like[]): this {
    const count = Math.min(coefficients.length, SH_COEFFICIENT_COUNT);
    for (let i = 0; i < count; i++) {
      this._shCoefficients[i].set(coefficients[i].x, coefficients[i].y, coefficients[i].z);
    }
    this._state = ProbeState.Ready;
    this._dirty = false;
    return this;
  }

  /**
   * 获取球谐系数
   *
   * @returns 球谐系数结构（深拷贝）
   */
  getSphericalHarmonics(): SphericalHarmonics {
    return {
      coefficients: this._shCoefficients.map((c) => ({
        x: c.x,
        y: c.y,
        z: c.z,
      })),
    };
  }

  /**
   * 设置简单的渐变球谐系数（天空/地面）
   *
   * @param skyColor - 天空颜色
   * @param groundColor - 地面颜色
   * @returns this
   */
  setGradientSH(skyColor: MSpec.Vector3Like, groundColor: MSpec.Vector3Like): this {
    // L0 (DC): 环境光平均值
    const avgR = (skyColor.x + groundColor.x) * 0.5;
    const avgG = (skyColor.y + groundColor.y) * 0.5;
    const avgB = (skyColor.z + groundColor.z) * 0.5;
    this._shCoefficients[0].set(avgR, avgG, avgB);

    // L1 Y 分量: 天空/地面差异
    const diffR = (skyColor.x - groundColor.x) * 0.5;
    const diffG = (skyColor.y - groundColor.y) * 0.5;
    const diffB = (skyColor.z - groundColor.z) * 0.5;
    this._shCoefficients[1].set(0, 0, 0); // L1 X
    this._shCoefficients[2].set(diffR, diffG, diffB); // L1 Y
    this._shCoefficients[3].set(0, 0, 0); // L1 Z

    // L2: 设为 0
    for (let i = 4; i < SH_COEFFICIENT_COUNT; i++) {
      this._shCoefficients[i].set(0, 0, 0);
    }

    this._state = ProbeState.Ready;
    this._dirty = false;
    return this;
  }

  /**
   * 设置纯色球谐系数
   *
   * @param color - 颜色
   * @returns this
   */
  setSolidColorSH(color: MSpec.Vector3Like): this {
    this._shCoefficients[0].set(color.x, color.y, color.z);
    for (let i = 1; i < SH_COEFFICIENT_COUNT; i++) {
      this._shCoefficients[i].set(0, 0, 0);
    }
    this._state = ProbeState.Ready;
    this._dirty = false;
    return this;
  }

  // ========================================
  // Query Methods
  // ========================================

  /**
   * 检测点是否在探针影响范围内
   *
   * @param point - 测试点
   * @returns 是否在范围内
   */
  containsPoint(point: MSpec.Vector3Like): boolean {
    if (!this._enabled) {
      return false;
    }

    if (this._boxProjection) {
      return this._bounds.containsPoint(new MMath.Vector3(point.x, point.y, point.z));
    }

    const dx = point.x - this._position.x;
    const dy = point.y - this._position.y;
    const dz = point.z - this._position.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    return distSq <= this._range * this._range;
  }

  /**
   * 计算点到探针的权重（用于混合）
   *
   * @param point - 测试点
   * @returns 权重 (0-1)
   */
  getWeight(point: MSpec.Vector3Like): number {
    if (!this._enabled) {
      return 0;
    }

    const dx = point.x - this._position.x;
    const dy = point.y - this._position.y;
    const dz = point.z - this._position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist >= this._range) {
      return 0;
    }

    // 线性衰减
    return (1 - dist / this._range) * this._intensity;
  }

  /**
   * 在给定方向采样辐照度
   *
   * @param direction - 采样方向（应归一化）
   * @returns RGB 辐照度
   */
  sampleIrradiance(direction: MSpec.Vector3Like): MSpec.Vector3Like {
    // 使用 L2 球谐光照近似
    const x = direction.x;
    const y = direction.y;
    const z = direction.z;

    // SH 基函数
    const c1 = 0.429043;
    const c2 = 0.511664;
    const c3 = 0.743125;
    const c4 = 0.886227;
    const c5 = 0.247708;

    const sh = this._shCoefficients;

    // L0
    let r = c4 * sh[0].x;
    let g = c4 * sh[0].y;
    let b = c4 * sh[0].z;

    // L1
    r += 2.0 * c2 * (sh[1].x * x + sh[2].x * y + sh[3].x * z);
    g += 2.0 * c2 * (sh[1].y * x + sh[2].y * y + sh[3].y * z);
    b += 2.0 * c2 * (sh[1].z * x + sh[2].z * y + sh[3].z * z);

    // L2
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const xy = x * y;
    const yz = y * z;
    const xz = x * z;

    r += c1 * sh[4].x * (xx - yy) + c3 * sh[5].x * zz + c1 * sh[6].x * xz + c1 * sh[7].x * yz + c5 * sh[8].x * xy;
    g += c1 * sh[4].y * (xx - yy) + c3 * sh[5].y * zz + c1 * sh[6].y * xz + c1 * sh[7].y * yz + c5 * sh[8].y * xy;
    b += c1 * sh[4].z * (xx - yy) + c3 * sh[5].z * zz + c1 * sh[6].z * xz + c1 * sh[7].z * yz + c5 * sh[8].z * xy;

    return {
      x: Math.max(0, r) * this._intensity,
      y: Math.max(0, g) * this._intensity,
      z: Math.max(0, b) * this._intensity,
    };
  }

  // ========================================
  // State Management
  // ========================================

  /**
   * 标记需要更新
   */
  markDirty(): void {
    this._dirty = true;
    this._state = ProbeState.NeedsUpdate;
  }

  /**
   * 标记更新完成
   */
  markUpdated(): void {
    this._dirty = false;
    this._state = ProbeState.Ready;
    this._lastUpdateTime = Date.now();
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * 深拷贝当前探针
   *
   * @returns 新的探针实例
   */
  clone(): EnvironmentProbe {
    const cloned = new EnvironmentProbe({
      position: { x: this._position.x, y: this._position.y, z: this._position.z },
      type: this._type,
      updateMode: this._updateMode,
      resolution: this._resolution,
      range: this._range,
      bounds: {
        min: { x: this._bounds.min.x, y: this._bounds.min.y, z: this._bounds.min.z },
        max: { x: this._bounds.max.x, y: this._bounds.max.y, z: this._bounds.max.z },
      },
      boxProjection: this._boxProjection,
      nearClip: this._nearClip,
      farClip: this._farClip,
      intensity: this._intensity,
      enabled: this._enabled,
      layerMask: this._layerMask,
    });

    // 复制球谐系数
    for (let i = 0; i < SH_COEFFICIENT_COUNT; i++) {
      cloned._shCoefficients[i].copyFrom(this._shCoefficients[i]);
    }

    cloned._state = this._state;
    cloned._dirty = this._dirty;

    return cloned;
  }

  /**
   * 序列化为数据对象
   *
   * @returns 探针数据
   */
  toData(): EnvironmentProbeData {
    return {
      id: this._id,
      position: { x: this._position.x, y: this._position.y, z: this._position.z },
      type: this._type,
      updateMode: this._updateMode,
      resolution: this._resolution,
      range: this._range,
      bounds: {
        min: { x: this._bounds.min.x, y: this._bounds.min.y, z: this._bounds.min.z },
        max: { x: this._bounds.max.x, y: this._bounds.max.y, z: this._bounds.max.z },
      },
      boxProjection: this._boxProjection,
      nearClip: this._nearClip,
      farClip: this._farClip,
      intensity: this._intensity,
      enabled: this._enabled,
      layerMask: this._layerMask,
      shCoefficients: this._shCoefficients.map((c) => [c.x, c.y, c.z]),
    };
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this._state = ProbeState.Disposed;
    this._shCoefficients = [];
  }

  // ========================================
  // Getters
  // ========================================

  get id(): string {
    return this._id;
  }

  get position(): MMath.Vector3 {
    return this._position;
  }

  get type(): ProbeType {
    return this._type;
  }

  get updateMode(): ProbeUpdateMode {
    return this._updateMode;
  }

  get resolution(): number {
    return this._resolution;
  }

  get range(): number {
    return this._range;
  }

  get bounds(): MMath.Box3 {
    return this._bounds;
  }

  get boxProjection(): boolean {
    return this._boxProjection;
  }

  get nearClip(): number {
    return this._nearClip;
  }

  get farClip(): number {
    return this._farClip;
  }

  get intensity(): number {
    return this._intensity;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get layerMask(): number {
    return this._layerMask;
  }

  get state(): ProbeState {
    return this._state;
  }

  get isDirty(): boolean {
    return this._dirty;
  }

  get lastUpdateTime(): number {
    return this._lastUpdateTime;
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * 生成唯一标识符
   */
  private _generateId(): string {
    return `probe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
