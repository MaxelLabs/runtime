/**
 * BoundingBox - 包围盒计算工具
 *
 * 基于 @maxellabs/math 的 Box3 封装，提供本地空间和世界空间的包围盒管理。
 * 支持从顶点数据、变换矩阵计算包围盒，并提供缓存优化。
 *
 * @remarks
 * - 所有操作都使用深拷贝，防止引用污染
 * - 支持脏标记优化，避免重复计算
 * - 遵循 Constitution 规范
 *
 * @example
 * ```typescript
 * // 从顶点数据创建包围盒
 * const bbox = BoundingBox.fromVertices([0, 0, 0, 1, 1, 1, -1, -1, -1]);
 *
 * // 应用世界变换
 * bbox.updateWorldBounds(worldMatrix);
 *
 * // 检测相交
 * if (bbox.intersectsBox(otherBbox)) {
 *   console.log('相交');
 * }
 * ```
 *
 * @packageDocumentation
 */

import { Box3, Vector3, Sphere, Matrix4 } from '@maxellabs/math';
import type { Vector3Like, Matrix4Like } from '@maxellabs/specification';

// ========================================
// Constants
// ========================================

/** 精度常量 - 用于浮点数比较 */
const EPSILON = 1e-6;

// ========================================
// Interfaces
// ========================================

/**
 * 包围盒数据接口
 * 用于序列化和反序列化
 */
export interface BoundingBoxData {
  /** 最小角点 */
  min?: Vector3Like;
  /** 最大角点 */
  max?: Vector3Like;
}

/**
 * 包围盒配置选项
 */
export interface BoundingBoxOptions {
  /** 是否自动更新世界包围盒 */
  autoUpdateWorld?: boolean;
}

// ========================================
// Default Values
// ========================================

const DEFAULT_MIN: Vector3Like = { x: Infinity, y: Infinity, z: Infinity };
const DEFAULT_MAX: Vector3Like = { x: -Infinity, y: -Infinity, z: -Infinity };

/** 临时矩阵（用于避免频繁创建对象） */
const _tempMatrix = new Matrix4();

// ========================================
// Main Implementation
// ========================================

/**
 * 包围盒工具类
 *
 * 提供本地空间和世界空间的包围盒管理，支持相交检测、包含测试等操作。
 *
 * @example
 * ```typescript
 * const bbox = new BoundingBox();
 * bbox.setFromVertices(vertices);
 * bbox.updateWorldBounds(worldMatrix);
 * ```
 */
export class BoundingBox {
  /** 本地空间包围盒 */
  private _localBox: Box3;

  /** 世界空间包围盒（缓存） */
  private _worldBox: Box3;

  /** 包围球（缓存） */
  private _boundingSphere: Sphere;

  /** 本地包围盒脏标记 */
  private _localDirty: boolean = true;

  /** 世界包围盒脏标记 */
  private _worldDirty: boolean = true;

  /** 包围球脏标记 */
  private _sphereDirty: boolean = true;

  /** 配置选项 */
  private _options: BoundingBoxOptions;

  /**
   * 构造函数
   *
   * @param data - 初始化数据（可选）
   * @param options - 配置选项
   */
  constructor(data?: Partial<BoundingBoxData>, options?: BoundingBoxOptions) {
    this._localBox = new Box3();
    this._worldBox = new Box3();
    this._boundingSphere = new Sphere(new Vector3(), 0);
    this._options = { autoUpdateWorld: true, ...options };

    if (data) {
      this.setFromData(data);
    }
  }

  // ========================================
  // Static Factory Methods
  // ========================================

  /**
   * 从数据对象创建包围盒
   *
   * @param data - 包围盒数据
   * @returns 新的包围盒实例
   *
   * @example
   * ```typescript
   * const bbox = BoundingBox.fromData({
   *   min: { x: -1, y: -1, z: -1 },
   *   max: { x: 1, y: 1, z: 1 }
   * });
   * ```
   */
  static fromData(data: Partial<BoundingBoxData>): BoundingBox {
    return new BoundingBox(data);
  }

  /**
   * 从顶点数组创建包围盒
   *
   * @param vertices - 顶点数组（每三个数为一个点 [x, y, z, x, y, z, ...]）
   * @returns 新的包围盒实例
   *
   * @example
   * ```typescript
   * const vertices = [0, 0, 0, 1, 1, 1, -1, -1, -1];
   * const bbox = BoundingBox.fromVertices(vertices);
   * ```
   */
  static fromVertices(vertices: number[]): BoundingBox {
    const bbox = new BoundingBox();
    bbox.setFromVertices(vertices);
    return bbox;
  }

  /**
   * 从点集合创建包围盒
   *
   * @param points - 三维点集合
   * @returns 新的包围盒实例
   */
  static fromPoints(points: Vector3Like[]): BoundingBox {
    const bbox = new BoundingBox();
    bbox.setFromPoints(points);
    return bbox;
  }

  /**
   * 从中心点和尺寸创建包围盒
   *
   * @param center - 中心点
   * @param size - 尺寸（宽度、高度、深度）
   * @returns 新的包围盒实例
   *
   * @example
   * ```typescript
   * const bbox = BoundingBox.fromCenterAndSize(
   *   { x: 0, y: 0, z: 0 },
   *   { x: 2, y: 2, z: 2 }
   * );
   * ```
   */
  static fromCenterAndSize(center: Vector3Like, size: Vector3Like): BoundingBox {
    const bbox = new BoundingBox();
    bbox.setFromCenterAndSize(center, size);
    return bbox;
  }

  // ========================================
  // Data Setup Methods
  // ========================================

  /**
   * 从数据对象设置包围盒
   *
   * @param data - 包围盒数据
   * @returns this（支持链式调用）
   */
  setFromData(data: Partial<BoundingBoxData>): this {
    const min = data.min ?? DEFAULT_MIN;
    const max = data.max ?? DEFAULT_MAX;

    this._localBox.min.set(min.x ?? Infinity, min.y ?? Infinity, min.z ?? Infinity);
    this._localBox.max.set(max.x ?? -Infinity, max.y ?? -Infinity, max.z ?? -Infinity);

    this._markDirty();
    return this;
  }

  /**
   * 从顶点数组设置包围盒
   *
   * @param vertices - 顶点数组（每三个数为一个点）
   * @returns this
   */
  setFromVertices(vertices: number[]): this {
    this._localBox.setFromArray(vertices);
    this._markDirty();
    return this;
  }

  /**
   * 从点集合设置包围盒
   *
   * @param points - 三维点集合
   * @returns this
   */
  setFromPoints(points: Vector3Like[]): this {
    this._localBox.makeEmpty();

    for (const point of points) {
      this._localBox.expandByPoint(new Vector3(point.x, point.y, point.z));
    }

    this._markDirty();
    return this;
  }

  /**
   * 从中心点和尺寸设置包围盒
   *
   * @param center - 中心点
   * @param size - 尺寸
   * @returns this
   */
  setFromCenterAndSize(center: Vector3Like, size: Vector3Like): this {
    const centerVec = new Vector3(center.x, center.y, center.z);
    const sizeVec = new Vector3(size.x, size.y, size.z);
    this._localBox.setFromCenterAndSize(centerVec, sizeVec);
    this._markDirty();
    return this;
  }

  /**
   * 设置最小和最大角点
   *
   * @param min - 最小角点
   * @param max - 最大角点
   * @returns this
   */
  set(min: Vector3Like, max: Vector3Like): this {
    this._localBox.min.set(min.x, min.y, min.z);
    this._localBox.max.set(max.x, max.y, max.z);
    this._markDirty();
    return this;
  }

  // ========================================
  // World Space Updates
  // ========================================

  /**
   * 更新世界空间包围盒
   *
   * 将本地包围盒通过世界变换矩阵转换到世界空间。
   *
   * @param worldMatrix - 世界变换矩阵
   * @returns this
   *
   * @example
   * ```typescript
   * const worldMatrix = entity.getWorldTransform();
   * bbox.updateWorldBounds(worldMatrix);
   * ```
   */
  updateWorldBounds(worldMatrix: Matrix4Like): this {
    if (!this._worldDirty && !this._localDirty) {
      return this;
    }

    // 复制本地包围盒到世界包围盒
    this._worldBox.copyFrom(this._localBox);

    // 应用变换矩阵
    if (!this._localBox.isEmpty()) {
      // 使用临时矩阵避免频繁创建对象
      _tempMatrix.set(
        worldMatrix.m00,
        worldMatrix.m01,
        worldMatrix.m02,
        worldMatrix.m03,
        worldMatrix.m10,
        worldMatrix.m11,
        worldMatrix.m12,
        worldMatrix.m13,
        worldMatrix.m20,
        worldMatrix.m21,
        worldMatrix.m22,
        worldMatrix.m23,
        worldMatrix.m30,
        worldMatrix.m31,
        worldMatrix.m32,
        worldMatrix.m33
      );
      this._worldBox.applyMatrix4(_tempMatrix);
    }

    this._localDirty = false;
    this._worldDirty = false;
    this._sphereDirty = true;
    return this;
  }

  /**
   * 标记世界包围盒需要更新
   *
   * 当实体变换改变时调用此方法。
   */
  markWorldDirty(): void {
    this._worldDirty = true;
    this._sphereDirty = true;
  }

  // ========================================
  // Intersection Tests
  // ========================================

  /**
   * 检测与另一个包围盒是否相交
   *
   * @param other - 另一个包围盒
   * @param useWorldSpace - 是否使用世界空间（默认 true）
   * @returns 是否相交
   */
  intersectsBox(other: BoundingBox, useWorldSpace: boolean = true): boolean {
    const thisBox = useWorldSpace ? this._worldBox : this._localBox;
    const otherBox = useWorldSpace ? other._worldBox : other._localBox;
    return thisBox.intersectsBox(otherBox);
  }

  /**
   * 检测与 Box3 是否相交
   *
   * @param box - Box3 实例
   * @param useWorldSpace - 是否使用世界空间
   * @returns 是否相交
   */
  intersectsBox3(box: Box3, useWorldSpace: boolean = true): boolean {
    const thisBox = useWorldSpace ? this._worldBox : this._localBox;
    return thisBox.intersectsBox(box);
  }

  /**
   * 检测与球体是否相交
   *
   * @param sphere - 球体
   * @param useWorldSpace - 是否使用世界空间
   * @returns 是否相交
   */
  intersectsSphere(sphere: Sphere, useWorldSpace: boolean = true): boolean {
    const thisBox = useWorldSpace ? this._worldBox : this._localBox;
    return thisBox.intersectsSphere(sphere);
  }

  /**
   * 检测是否包含某个点
   *
   * @param point - 三维点
   * @param useWorldSpace - 是否使用世界空间
   * @returns 是否包含
   */
  containsPoint(point: Vector3Like, useWorldSpace: boolean = true): boolean {
    const thisBox = useWorldSpace ? this._worldBox : this._localBox;
    return thisBox.containsPoint(new Vector3(point.x, point.y, point.z));
  }

  /**
   * 检测是否完全包含另一个包围盒
   *
   * @param other - 另一个包围盒
   * @param useWorldSpace - 是否使用世界空间
   * @returns 是否包含
   */
  containsBox(other: BoundingBox, useWorldSpace: boolean = true): boolean {
    const thisBox = useWorldSpace ? this._worldBox : this._localBox;
    const otherBox = useWorldSpace ? other._worldBox : other._localBox;
    return thisBox.containsBox(otherBox);
  }

  // ========================================
  // Geometric Queries
  // ========================================

  /**
   * 获取包围盒中心点
   *
   * @param useWorldSpace - 是否使用世界空间
   * @returns 中心点（深拷贝）
   */
  getCenter(useWorldSpace: boolean = true): Vector3 {
    const box = useWorldSpace ? this._worldBox : this._localBox;
    return box.getCenter();
  }

  /**
   * 获取包围盒尺寸
   *
   * @param useWorldSpace - 是否使用世界空间
   * @returns 尺寸向量（深拷贝）
   */
  getSize(useWorldSpace: boolean = true): Vector3 {
    const box = useWorldSpace ? this._worldBox : this._localBox;
    return box.getSize();
  }

  /**
   * 获取点到包围盒的距离
   *
   * @param point - 三维点
   * @param useWorldSpace - 是否使用世界空间
   * @returns 距离（点在盒内时返回 0）
   */
  distanceToPoint(point: Vector3Like, useWorldSpace: boolean = true): number {
    const box = useWorldSpace ? this._worldBox : this._localBox;
    return box.distanceToPoint(new Vector3(point.x, point.y, point.z));
  }

  /**
   * 获取包围球
   *
   * @param useWorldSpace - 是否使用世界空间
   * @returns 包围球（深拷贝）
   */
  getBoundingSphere(useWorldSpace: boolean = true): Sphere {
    if (this._sphereDirty) {
      const box = useWorldSpace ? this._worldBox : this._localBox;
      box.getBoundingSphere(this._boundingSphere);
      this._sphereDirty = false;
    }
    // 返回深拷贝
    return new Sphere(this._boundingSphere.center.clone(), this._boundingSphere.radius);
  }

  // ========================================
  // Modification Methods
  // ========================================

  /**
   * 扩展包围盒以包含指定点
   *
   * @param point - 三维点
   * @returns this
   */
  expandByPoint(point: Vector3Like): this {
    this._localBox.expandByPoint(new Vector3(point.x, point.y, point.z));
    this._markDirty();
    return this;
  }

  /**
   * 通过标量扩展包围盒
   *
   * @param scalar - 扩展量
   * @returns this
   */
  expandByScalar(scalar: number): this {
    this._localBox.expandByScalar(scalar);
    this._markDirty();
    return this;
  }

  /**
   * 合并另一个包围盒
   *
   * @param other - 另一个包围盒
   * @returns this
   */
  union(other: BoundingBox): this {
    this._localBox.union(other._localBox);
    this._markDirty();
    return this;
  }

  /**
   * 与另一个包围盒求交集
   *
   * @param other - 另一个包围盒
   * @returns this
   */
  intersect(other: BoundingBox): this {
    this._localBox.intersect(other._localBox);
    this._markDirty();
    return this;
  }

  /**
   * 清空包围盒
   *
   * @returns this
   */
  makeEmpty(): this {
    this._localBox.makeEmpty();
    this._worldBox.makeEmpty();
    this._markDirty();
    return this;
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * 检查包围盒是否为空
   *
   * @returns 是否为空
   */
  isEmpty(): boolean {
    return this._localBox.isEmpty();
  }

  /**
   * 深拷贝当前包围盒
   *
   * @returns 新的包围盒实例
   */
  clone(): BoundingBox {
    const cloned = new BoundingBox();
    cloned._localBox.copyFrom(this._localBox);
    cloned._worldBox.copyFrom(this._worldBox);
    cloned._localDirty = this._localDirty;
    cloned._worldDirty = this._worldDirty;
    cloned._sphereDirty = this._sphereDirty;
    cloned._options = { ...this._options };
    return cloned;
  }

  /**
   * 从另一个包围盒复制数据
   *
   * @param other - 源包围盒
   * @returns this
   */
  copyFrom(other: BoundingBox): this {
    this._localBox.copyFrom(other._localBox);
    this._worldBox.copyFrom(other._worldBox);
    this._localDirty = other._localDirty;
    this._worldDirty = other._worldDirty;
    this._sphereDirty = other._sphereDirty;
    return this;
  }

  /**
   * 检查两个包围盒是否相等
   *
   * @param other - 另一个包围盒
   * @param tolerance - 容差值
   * @returns 是否相等
   */
  equals(other: BoundingBox, tolerance: number = EPSILON): boolean {
    const thisMin = this._localBox.min;
    const thisMax = this._localBox.max;
    const otherMin = other._localBox.min;
    const otherMax = other._localBox.max;

    return (
      Math.abs(thisMin.x - otherMin.x) < tolerance &&
      Math.abs(thisMin.y - otherMin.y) < tolerance &&
      Math.abs(thisMin.z - otherMin.z) < tolerance &&
      Math.abs(thisMax.x - otherMax.x) < tolerance &&
      Math.abs(thisMax.y - otherMax.y) < tolerance &&
      Math.abs(thisMax.z - otherMax.z) < tolerance
    );
  }

  /**
   * 序列化为数据对象
   *
   * @returns 包围盒数据
   */
  toData(): BoundingBoxData {
    return {
      min: {
        x: this._localBox.min.x,
        y: this._localBox.min.y,
        z: this._localBox.min.z,
      },
      max: {
        x: this._localBox.max.x,
        y: this._localBox.max.y,
        z: this._localBox.max.z,
      },
    };
  }

  // ========================================
  // Getters
  // ========================================

  /**
   * 获取本地空间包围盒（只读）
   */
  get localBox(): Box3 {
    return this._localBox;
  }

  /**
   * 获取世界空间包围盒（只读）
   */
  get worldBox(): Box3 {
    return this._worldBox;
  }

  /**
   * 获取最小角点（本地空间）
   */
  get min(): Vector3 {
    return this._localBox.min;
  }

  /**
   * 获取最大角点（本地空间）
   */
  get max(): Vector3 {
    return this._localBox.max;
  }

  /**
   * 是否需要更新世界包围盒
   */
  get isWorldDirty(): boolean {
    return this._worldDirty;
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * 标记脏状态
   *
   * 当本地包围盒数据改变时调用，标记世界包围盒需要重新计算。
   */
  private _markDirty(): void {
    this._localDirty = true;
    this._worldDirty = true;
    this._sphereDirty = true;
  }
}
