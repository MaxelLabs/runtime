/**
 * FrustumCuller - 视锥剔除器
 *
 * 提供视锥体（Frustum）定义和高效的可见性剔除算法。
 * 支持从投影矩阵构建视锥体，并提供包围盒/包围球的相交测试。
 *
 * @remarks
 * - 视锥体由 6 个平面组成：近平面、远平面、左、右、上、下
 * - 支持多种剔除结果：完全可见、部分可见、完全不可见
 * - 遵循 Constitution 规范
 *
 * @example
 * ```typescript
 * // 从相机投影矩阵创建视锥体
 * const frustum = Frustum.fromProjectionMatrix(viewProjectionMatrix);
 *
 * // 检测包围盒是否可见
 * const result = frustum.intersectsBox(boundingBox);
 * if (result !== IntersectionResult.Outside) {
 *   // 渲染该对象
 * }
 * ```
 *
 * @packageDocumentation
 */
import type { MSpec } from '@maxellabs/core';
import { MMath } from '@maxellabs/core';

// ========================================
// Constants
// ========================================

/** 视锥体平面数量 */
const FRUSTUM_PLANE_COUNT = 6;

/** 精度常量 */
const EPSILON = 1e-6;

// ========================================
// Enums
// ========================================

/**
 * 视锥体平面索引
 */
export enum FrustumPlane {
  /** 近平面 */
  Near = 0,
  /** 远平面 */
  Far = 1,
  /** 左平面 */
  Left = 2,
  /** 右平面 */
  Right = 3,
  /** 上平面 */
  Top = 4,
  /** 下平面 */
  Bottom = 5,
}

/**
 * 相交结果
 */
export enum IntersectionResult {
  /** 完全在视锥体外部 */
  Outside = 0,
  /** 与视锥体相交（部分可见） */
  Intersecting = 1,
  /** 完全在视锥体内部 */
  Inside = 2,
}

// ========================================
// Interfaces
// ========================================

/**
 * 视锥体数据接口
 */
export interface FrustumData {
  /** 6 个平面的数据 */
  planes?: Array<{ distance: number; normal: MSpec.Vector3Like }>;
}

// ========================================
// Frustum Class
// ========================================

/**
 * 视锥体类
 *
 * 表示一个由 6 个平面围成的视锥体，通常用于相机的可见性剔除。
 *
 * @example
 * ```typescript
 * const frustum = Frustum.fromProjectionMatrix(camera.viewProjectionMatrix);
 * const isVisible = frustum.containsPoint({ x: 0, y: 0, z: -5 });
 * ```
 */
export class Frustum {
  /** 6 个裁剪平面 */
  private _planes: MMath.Plane[];

  /**
   * 构造函数
   *
   * @param planes - 初始平面数组（可选，默认创建 6 个空平面）
   */
  constructor(planes?: MMath.Plane[]) {
    if (planes && planes.length === FRUSTUM_PLANE_COUNT) {
      // 深拷贝
      this._planes = planes.map((p) => p.clone());
    } else {
      // 创建默认平面
      this._planes = [];
      for (let i = 0; i < FRUSTUM_PLANE_COUNT; i++) {
        this._planes.push(new MMath.Plane());
      }
    }
  }

  // ========================================
  // Static Factory Methods
  // ========================================

  /**
   * 从视图投影矩阵创建视锥体
   *
   * 从组合的视图-投影矩阵中提取 6 个裁剪平面。
   *
   * @param viewProjectionMatrix - 视图投影矩阵 (View * Projection)
   * @returns 新的视锥体实例
   *
   * @example
   * ```typescript
   * const vp = Matrix4.multiply(viewMatrix, projectionMatrix);
   * const frustum = Frustum.fromProjectionMatrix(vp);
   * ```
   */
  static fromProjectionMatrix(viewProjectionMatrix: MSpec.Matrix4Like): Frustum {
    const frustum = new Frustum();
    frustum.setFromProjectionMatrix(viewProjectionMatrix);
    return frustum;
  }

  /**
   * 从数据对象创建视锥体
   *
   * @param data - 视锥体数据
   * @returns 新的视锥体实例
   */
  static fromData(data: Partial<FrustumData>): Frustum {
    const frustum = new Frustum();

    if (data.planes && data.planes.length === FRUSTUM_PLANE_COUNT) {
      for (let i = 0; i < FRUSTUM_PLANE_COUNT; i++) {
        const planeData = data.planes[i];
        frustum._planes[i].set(
          planeData.distance ?? 0,
          new MMath.Vector3(planeData.normal?.x ?? 0, planeData.normal?.y ?? 0, planeData.normal?.z ?? 1)
        );
      }
    }

    return frustum;
  }

  // ========================================
  // Setup Methods
  // ========================================

  /**
   * 从视图投影矩阵设置视锥体平面
   *
   * 使用 Gribb/Hartmann 方法从矩阵中提取平面。
   *
   * @param m - 视图投影矩阵
   * @returns this
   *
   * @see https://www.gamedevs.org/uploads/fast-extraction-viewing-frustum-planes-from-world-view-projection-matrix.pdf
   */
  setFromProjectionMatrix(m: MSpec.Matrix4Like): this {
    const planes = this._planes;

    // 从矩阵中提取平面（Row-Major 布局）
    // 左平面: row3 + row0
    this._setPlaneFromMatrix(planes[FrustumPlane.Left], m.m30 + m.m00, m.m31 + m.m01, m.m32 + m.m02, m.m33 + m.m03);

    // 右平面: row3 - row0
    this._setPlaneFromMatrix(planes[FrustumPlane.Right], m.m30 - m.m00, m.m31 - m.m01, m.m32 - m.m02, m.m33 - m.m03);

    // 下平面: row3 + row1
    this._setPlaneFromMatrix(planes[FrustumPlane.Bottom], m.m30 + m.m10, m.m31 + m.m11, m.m32 + m.m12, m.m33 + m.m13);

    // 上平面: row3 - row1
    this._setPlaneFromMatrix(planes[FrustumPlane.Top], m.m30 - m.m10, m.m31 - m.m11, m.m32 - m.m12, m.m33 - m.m13);

    // 近平面: row3 + row2
    this._setPlaneFromMatrix(planes[FrustumPlane.Near], m.m30 + m.m20, m.m31 + m.m21, m.m32 + m.m22, m.m33 + m.m23);

    // 远平面: row3 - row2
    this._setPlaneFromMatrix(planes[FrustumPlane.Far], m.m30 - m.m20, m.m31 - m.m21, m.m32 - m.m22, m.m33 - m.m23);

    return this;
  }

  // ========================================
  // Intersection Tests
  // ========================================

  /**
   * 检测点是否在视锥体内
   *
   * @param point - 三维点
   * @returns 是否在视锥体内
   */
  containsPoint(point: MSpec.Vector3Like): boolean {
    const vec = new MMath.Vector3(point.x, point.y, point.z);

    for (const plane of this._planes) {
      if (plane.distanceToPoint(vec) < 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检测包围盒与视锥体的相交关系
   *
   * @param box - 包围盒
   * @returns 相交结果
   */
  intersectsBox(box: MSpec.Box3Like): IntersectionResult {
    const min = box.min;
    const max = box.max;

    // 临时向量用于计算
    const p = new MMath.Vector3();

    let allInside = true;

    for (const plane of this._planes) {
      // 找到包围盒上距离平面最远的正向点（p-vertex）
      p.x = plane.normal.x > 0 ? max.x : min.x;
      p.y = plane.normal.y > 0 ? max.y : min.y;
      p.z = plane.normal.z > 0 ? max.z : min.z;

      // 如果 p-vertex 在平面负侧，则完全在外部
      if (plane.distanceToPoint(p) < 0) {
        return IntersectionResult.Outside;
      }

      // 找到包围盒上距离平面最近的负向点（n-vertex）
      p.x = plane.normal.x > 0 ? min.x : max.x;
      p.y = plane.normal.y > 0 ? min.y : max.y;
      p.z = plane.normal.z > 0 ? min.z : max.z;

      // 如果 n-vertex 在平面负侧，则不是完全在内部
      if (plane.distanceToPoint(p) < 0) {
        allInside = false;
      }
    }

    return allInside ? IntersectionResult.Inside : IntersectionResult.Intersecting;
  }

  /**
   * 检测包围盒是否与视锥体相交（快速版本）
   *
   * @param box - 包围盒
   * @returns 是否相交或在内部
   */
  intersectsBoxFast(box: MSpec.Box3Like): boolean {
    return this.intersectsBox(box) !== IntersectionResult.Outside;
  }

  /**
   * 检测包围球与视锥体的相交关系
   *
   * @param sphere - 包围球
   * @returns 相交结果
   */
  intersectsSphere(sphere: MSpec.SphereLike): IntersectionResult {
    const center = new MMath.Vector3(sphere.center.x, sphere.center.y, sphere.center.z);
    const negRadius = -sphere.radius;

    let allInside = true;

    for (const plane of this._planes) {
      const distance = plane.distanceToPoint(center);

      // 球心到平面距离小于负半径，完全在外部
      if (distance < negRadius) {
        return IntersectionResult.Outside;
      }

      // 球心到平面距离小于半径，不是完全在内部
      if (distance < sphere.radius) {
        allInside = false;
      }
    }

    return allInside ? IntersectionResult.Inside : IntersectionResult.Intersecting;
  }

  /**
   * 检测包围球是否与视锥体相交（快速版本）
   *
   * @param sphere - 包围球
   * @returns 是否相交或在内部
   */
  intersectsSphereFast(sphere: MSpec.SphereLike): boolean {
    return this.intersectsSphere(sphere) !== IntersectionResult.Outside;
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * 获取指定平面
   *
   * @param index - 平面索引
   * @returns 平面（深拷贝）
   */
  getPlane(index: FrustumPlane): MMath.Plane {
    return this._planes[index].clone();
  }

  /**
   * 获取所有平面
   *
   * @returns 平面数组（深拷贝）
   */
  getPlanes(): MMath.Plane[] {
    return this._planes.map((p) => p.clone());
  }

  /**
   * 深拷贝当前视锥体
   *
   * @returns 新的视锥体实例
   */
  clone(): Frustum {
    return new Frustum(this._planes);
  }

  /**
   * 从另一个视锥体复制数据
   *
   * @param other - 源视锥体
   * @returns this
   */
  copyFrom(other: Frustum): this {
    for (let i = 0; i < FRUSTUM_PLANE_COUNT; i++) {
      this._planes[i].copyFrom(other._planes[i]);
    }
    return this;
  }

  /**
   * 序列化为数据对象
   *
   * @returns 视锥体数据
   */
  toData(): FrustumData {
    return {
      planes: this._planes.map((p) => ({
        distance: p.distance,
        normal: {
          x: p.normal.x,
          y: p.normal.y,
          z: p.normal.z,
        },
      })),
    };
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * 从矩阵行设置平面
   */
  private _setPlaneFromMatrix(plane: MMath.Plane, a: number, b: number, c: number, d: number): void {
    const length = Math.sqrt(a * a + b * b + c * c);

    if (length < EPSILON) {
      plane.normal.set(0, 0, 1);
      plane.distance = 0;
      return;
    }

    const invLength = 1 / length;
    plane.normal.set(a * invLength, b * invLength, c * invLength);
    plane.distance = d * invLength;
  }
}

// ========================================
// FrustumCuller Class
// ========================================

/**
 * 剔除结果统计
 */
export interface CullingStats {
  /** 总测试数量 */
  totalTested: number;
  /** 可见数量 */
  visible: number;
  /** 被剔除数量 */
  culled: number;
  /** 完全在视锥体内的数量 */
  fullyInside: number;
}

/**
 * 可剔除对象接口
 */
export interface ICullable {
  /** 世界空间包围盒 */
  worldBoundingBox?: MSpec.Box3Like;
  /** 世界空间包围球 */
  worldBoundingSphere?: MSpec.SphereLike;
  /** 是否被剔除 */
  culled?: boolean;
}

/**
 * 视锥剔除器
 *
 * 提供批量视锥剔除功能，支持包围盒和包围球两种模式。
 *
 * @example
 * ```typescript
 * const culler = new FrustumCuller();
 * culler.setFrustum(camera.viewProjectionMatrix);
 *
 * // 批量剔除
 * const stats = culler.cullObjects(objects);
 * console.log(`可见: ${stats.visible}, 剔除: ${stats.culled}`);
 * ```
 */
export class FrustumCuller {
  /** 当前视锥体 */
  private _frustum: Frustum;

  /** 是否启用 */
  private _enabled: boolean = true;

  /** 是否优先使用包围球（更快但不精确） */
  private _useBoundingSphere: boolean = false;

  /**
   * 构造函数
   */
  constructor() {
    this._frustum = new Frustum();
  }

  // ========================================
  // Setup Methods
  // ========================================

  /**
   * 从视图投影矩阵设置视锥体
   *
   * @param viewProjectionMatrix - 视图投影矩阵
   * @returns this
   */
  setFrustum(viewProjectionMatrix: MSpec.Matrix4Like): this {
    this._frustum.setFromProjectionMatrix(viewProjectionMatrix);
    return this;
  }

  /**
   * 设置是否启用剔除
   *
   * @param enabled - 是否启用
   * @returns this
   */
  setEnabled(enabled: boolean): this {
    this._enabled = enabled;
    return this;
  }

  /**
   * 设置是否优先使用包围球
   *
   * @param use - 是否使用
   * @returns this
   */
  setUseBoundingSphere(use: boolean): this {
    this._useBoundingSphere = use;
    return this;
  }

  // ========================================
  // Culling Methods
  // ========================================

  /**
   * 检测单个包围盒的可见性
   *
   * @param box - 包围盒
   * @returns 相交结果
   */
  testBox(box: MSpec.Box3Like): IntersectionResult {
    if (!this._enabled) {
      return IntersectionResult.Inside;
    }
    return this._frustum.intersectsBox(box);
  }

  /**
   * 检测单个包围盒是否可见（快速版本）
   *
   * @param box - 包围盒
   * @returns 是否可见
   */
  isBoxVisible(box: MSpec.Box3Like): boolean {
    if (!this._enabled) {
      return true;
    }
    return this._frustum.intersectsBoxFast(box);
  }

  /**
   * 检测单个包围球的可见性
   *
   * @param sphere - 包围球
   * @returns 相交结果
   */
  testSphere(sphere: MSpec.SphereLike): IntersectionResult {
    if (!this._enabled) {
      return IntersectionResult.Inside;
    }
    return this._frustum.intersectsSphere(sphere);
  }

  /**
   * 检测单个包围球是否可见（快速版本）
   *
   * @param sphere - 包围球
   * @returns 是否可见
   */
  isSphereVisible(sphere: MSpec.SphereLike): boolean {
    if (!this._enabled) {
      return true;
    }
    return this._frustum.intersectsSphereFast(sphere);
  }

  /**
   * 批量剔除对象
   *
   * 对每个对象设置 `culled` 属性，并返回统计信息。
   *
   * @param objects - 可剔除对象数组
   * @returns 剔除统计
   *
   * @example
   * ```typescript
   * const stats = culler.cullObjects(renderables);
   * for (const obj of renderables) {
   *   if (!obj.culled) {
   *     renderer.draw(obj);
   *   }
   * }
   * ```
   */
  cullObjects(objects: ICullable[]): CullingStats {
    const stats: CullingStats = {
      totalTested: objects.length,
      visible: 0,
      culled: 0,
      fullyInside: 0,
    };

    if (!this._enabled) {
      // 禁用时所有对象都可见
      for (const obj of objects) {
        obj.culled = false;
      }
      stats.visible = objects.length;
      stats.fullyInside = objects.length;
      return stats;
    }

    for (const obj of objects) {
      let result: IntersectionResult;

      if (this._useBoundingSphere && obj.worldBoundingSphere) {
        result = this._frustum.intersectsSphere(obj.worldBoundingSphere);
      } else if (obj.worldBoundingBox) {
        result = this._frustum.intersectsBox(obj.worldBoundingBox);
      } else {
        // 没有包围体的对象默认可见
        result = IntersectionResult.Inside;
      }

      if (result === IntersectionResult.Outside) {
        obj.culled = true;
        stats.culled++;
      } else {
        obj.culled = false;
        stats.visible++;
        if (result === IntersectionResult.Inside) {
          stats.fullyInside++;
        }
      }
    }

    return stats;
  }

  /**
   * 过滤可见对象
   *
   * @param objects - 可剔除对象数组
   * @returns 可见对象数组
   */
  filterVisible<T extends ICullable>(objects: T[]): T[] {
    if (!this._enabled) {
      return objects;
    }

    return objects.filter((obj) => {
      if (this._useBoundingSphere && obj.worldBoundingSphere) {
        return this._frustum.intersectsSphereFast(obj.worldBoundingSphere);
      } else if (obj.worldBoundingBox) {
        return this._frustum.intersectsBoxFast(obj.worldBoundingBox);
      }
      return true;
    });
  }

  // ========================================
  // Getters
  // ========================================

  /**
   * 获取当前视锥体
   */
  get frustum(): Frustum {
    return this._frustum;
  }

  /**
   * 是否启用
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * 是否使用包围球
   */
  get useBoundingSphere(): boolean {
    return this._useBoundingSphere;
  }
}
