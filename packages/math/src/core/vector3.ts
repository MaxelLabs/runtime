import { UsdDataType } from '@maxellabs/specification';
import type { UsdValue, vec3, Vector3DataType, Vector3Like } from '@maxellabs/specification';
import type { Matrix4 } from './matrix4';
import type { Quaternion } from './quaternion';
import { NumberEpsilon, fastInvSqrt } from './utils';
import { Vector2 } from './vector2';
import { MathConfig } from '../config/mathConfig';
import { ObjectPool, type Poolable } from '../pool/objectPool';

// 高性能对象池实现
const vector3Pool = new ObjectPool<Vector3>(() => new Vector3(), MathConfig.getPoolConfig().Vector3);

/**
 * 三维向量
 * 实现 @specification 包的 IVector3 接口，提供高性能的3D向量运算
 */
export class Vector3 implements Vector3Like, Poolable {
  /**
   * 三维向量的常量
   */
  static readonly X = Object.freeze(new Vector3(1.0, 0.0, 0.0));
  static readonly Y = Object.freeze(new Vector3(0.0, 1.0, 0.0));
  static readonly Z = Object.freeze(new Vector3(0.0, 0.0, 1.0));
  static readonly ONE = Object.freeze(new Vector3(1.0, 1.0, 1.0));
  static readonly ZERO = Object.freeze(new Vector3(0.0, 0.0, 0.0));

  // 轴向常量
  static readonly POSITIVE_X = new Vector3(1.0, 0.0, 0.0);
  static readonly POSITIVE_Y = new Vector3(0.0, 1.0, 0.0);
  static readonly POSITIVE_Z = new Vector3(0.0, 0.0, 1.0);
  static readonly NEGATIVE_X = new Vector3(-1.0, 0.0, 0.0);
  static readonly NEGATIVE_Y = new Vector3(0.0, -1.0, 0.0);
  static readonly NEGATIVE_Z = new Vector3(0.0, 0.0, -1.0);

  // 使用内存对齐的TypedArray，提高SIMD性能
  private elements: Float32Array;

  /**
   * 构造函数，默认值为零向量
   * @param x - x分量，默认为0
   * @param y - y分量，默认为0
   * @param z - z分量，默认为0
   */
  constructor(x = 0, y = 0, z = 0) {
    // 16字节对齐，优化SIMD访问
    this.elements = new Float32Array(4); // 使用4个元素确保对齐
    this.elements[0] = x;
    this.elements[1] = y;
    this.elements[2] = z;
    this.elements[3] = 0; // padding for alignment
  }

  /**
   * 重置对象状态（对象池接口）
   */
  reset(): void {
    this.elements[0] = 0;
    this.elements[1] = 0;
    this.elements[2] = 0;
    this.elements[3] = 0;
  }

  /**
   * 检查对象是否可池化（对象池接口）
   */
  isPoolable(): boolean {
    return true;
  }

  /**
   * x坐标访问器（IVector3接口）
   */
  get x(): number {
    return this.elements[0];
  }

  set x(value: number) {
    this.elements[0] = value;
  }

  /**
   * y坐标访问器（IVector3接口）
   */
  get y(): number {
    return this.elements[1];
  }

  set y(value: number) {
    this.elements[1] = value;
  }

  /**
   * z坐标访问器（IVector3接口）
   */
  get z(): number {
    return this.elements[2];
  }

  set z(value: number) {
    this.elements[2] = value;
  }

  /**
   * 设置向量
   * @param x - x 轴分量
   * @param y - y 轴分量
   * @param z - z 轴分量
   * @returns 向量
   */
  set(x: number, y: number, z: number): this {
    this.elements[0] = x;
    this.elements[1] = y;
    this.elements[2] = z;

    return this;
  }

  /**
   * 设置零向量
   * @returns 向量
   */
  setZero(): this {
    this.elements[0] = 0;
    this.elements[1] = 0;
    this.elements[2] = 0;

    return this;
  }

  /**
   * 通过标量数值设置向量
   * @param num - 数值
   * @returns 向量
   */
  setFromNumber(num: number): this {
    this.elements[0] = num;
    this.elements[1] = num;
    this.elements[2] = num;

    return this;
  }

  /**
   * 通过数组设置向量
   * @param array - 数组
   * @param [offset=0] - 起始偏移值
   * @returns 向量
   */
  setFromArray(array: Vector3DataType, offset = 0): this {
    this.elements[0] = array[offset] ?? 0;
    this.elements[1] = array[offset + 1] ?? 0;
    this.elements[2] = array[offset + 2] ?? 0;

    return this;
  }

  /**
   * 从另一个向量复制值
   * @param v - 源向量
   * @returns 返回自身，用于链式调用
   */
  copyFrom(v: Readonly<Vector3> | Vector3Like): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;

    // 更新elements数组
    if (this.elements) {
      this.elements[0] = this.x;
      this.elements[1] = this.y;
      this.elements[2] = this.z;
    }

    return this;
  }

  /**
   * 克隆向量，使用对象池
   * @returns 新的向量
   */
  clone(): Vector3 {
    return Vector3.create(this.x, this.y, this.z);
  }

  /**
   * 根据下标设置向量分量
   * @param index - 下标值
   * @param value - 数字
   * @returns 向量
   */
  setElement(index: number, value: number): this {
    if (index >= 0 && index <= 2) {
      this.elements[index] = value;
    } else {
      console.error('index is out of range: ' + index);
    }

    return this;
  }

  /**
   * 根据下标获取向量分量
   * @param index - 下标
   * @returns 向量分量
   */
  getElement(index: number): number {
    if (index >= 0 && index <= 2) {
      return this.elements[index];
    }
    console.error('index is out of range: ' + index);

    return 0;
  }

  /**
   * 向量相加（优化版本）
   * @param right - 向量 | 数字
   * @returns 相加结果
   */
  add(right: number | vec3 | Vector3): this {
    const e = this.elements;

    if (typeof right === 'number') {
      e[0] += right;
      e[1] += right;
      e[2] += right;
    } else if (right instanceof Array) {
      e[0] += right[0];
      e[1] += right[1];
      e[2] += right[2];
    } else {
      e[0] += right.x;
      e[1] += right.y;
      e[2] += right.z;
    }

    return this;
  }

  /**
   * 向量相加
   * @param left - 向量
   * @param right - 向量
   * @returns 相加结果
   */
  addVectors(left: Vector3, right: Vector3): this {
    const e = this.elements;

    e[0] = left.x + right.x;
    e[1] = left.y + right.y;
    e[2] = left.z + right.z;

    return this;
  }

  /**
   * 向量乘比例后相加
   * @param right - 向量
   * @param s - 比例
   * @returns 相加结果
   */
  addScaledVector(right: Vector3, s: number): this {
    const e = this.elements;

    e[0] += right.x * s;
    e[1] += right.y * s;
    e[2] += right.z * s;

    return this;
  }

  /**
   * 向量相减（优化版本）
   * @param right - 向量 | 数字
   * @returns 相减结果
   */
  subtract(right: number | vec3 | Vector3): this {
    const e = this.elements;

    if (typeof right === 'number') {
      e[0] -= right;
      e[1] -= right;
      e[2] -= right;
    } else if (right instanceof Array) {
      e[0] -= right[0];
      e[1] -= right[1];
      e[2] -= right[2];
    } else {
      e[0] -= right.x;
      e[1] -= right.y;
      e[2] -= right.z;
    }

    return this;
  }

  /**
   * 向量相减
   * @param left - 向量
   * @param right - 向量
   * @returns 相减结果
   */
  subtractVectors(left: Vector3, right: Vector3): this {
    const e = this.elements;

    e[0] = left.x - right.x;
    e[1] = left.y - right.y;
    e[2] = left.z - right.z;

    return this;
  }

  /**
   * 向量相乘
   * @param right - 相乘对象，对象 | 数字
   * @returns 向量
   */
  multiply(right: number | vec3 | Vector3): this {
    const e = this.elements;

    if (typeof right === 'number') {
      e[0] *= right;
      e[1] *= right;
      e[2] *= right;
    } else if (right instanceof Array) {
      e[0] *= right[0];
      e[1] *= right[1];
      e[2] *= right[2];
    } else {
      e[0] *= right.x;
      e[1] *= right.y;
      e[2] *= right.z;
    }

    return this;
  }

  /**
   * 向量相乘
   * @param left - 向量
   * @param right - 向量
   * @returns 向量
   */
  multiplyVectors(left: Vector3, right: Vector3): this {
    const e = this.elements;

    e[0] = left.x * right.x;
    e[1] = left.y * right.y;
    e[2] = left.z * right.z;

    return this;
  }

  /**
   * 向量长度
   * @returns 长度
   */
  getLength(): number {
    const e = this.elements;
    const x = e[0],
      y = e[1],
      z = e[2];

    return Math.sqrt(x * x + y * y + z * z);
  }

  /**
   * 向量长度平方
   * @returns 长度平方
   */
  getLengthSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  /**
   * 向量归一化（优化版本）
   */
  normalize(): this {
    const e = this.elements;
    const x = e[0],
      y = e[1],
      z = e[2];
    const len = x * x + y * y + z * z;

    if (len > 0) {
      // 使用快速反平方根算法
      const invLen = fastInvSqrt(len);

      e[0] = x * invLen;
      e[1] = y * invLen;
      e[2] = z * invLen;
    }

    return this;
  }

  /**
   * 向量求点积
   * @param v - 向量
   * @returns 点积结果
   */
  dot(v: Vector3): number {
    const e = this.elements;

    return e[0] * v.x + e[1] * v.y + e[2] * v.z;
  }

  /**
   * 应用四元数旋转到向量
   * @param q - 要应用的四元数
   * @returns 返回this，用于链式调用
   */
  applyQuaternion(q: Quaternion): this {
    // 保存当前值以便计算
    const x = this.x;
    const y = this.y;
    const z = this.z;

    // 获取四元数分量
    const qx = q.x;
    const qy = q.y;
    const qz = q.z;
    const qw = q.w;

    // 基于公式: v' = q * v * q^-1 的优化计算
    // 计算 q * v (其中v被视为纯四元数，w=0)
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    // 计算 (q * v) * q^-1
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    if (this.elements) {
      this.elements[0] = this.x;
      this.elements[1] = this.y;
      this.elements[2] = this.z;
    }

    return this;
  }

  /**
   * 向量求叉积
   * @param right - 向量
   * @returns 叉积结果
   */
  cross(right: Vector3): this {
    return this.crossVectors(this, right);
  }

  /**
   * 向量（a 与 b）求叉积（优化版本）
   * @param left - 向量
   * @param right - 向量
   * @returns 叉积结果
   */
  crossVectors(left: Vector3, right: Vector3): this {
    const e = this.elements;
    const ax = left.x,
      ay = left.y,
      az = left.z;
    const bx = right.x,
      by = right.y,
      bz = right.z;

    e[0] = ay * bz - az * by;
    e[1] = az * bx - ax * bz;
    e[2] = ax * by - ay * bx;

    return this;
  }

  /**
   * 计算到另一个向量的距离
   * @param v 另一个向量
   * @returns 距离
   */
  distanceTo(v: Vector3): number {
    return Math.sqrt(this.distanceToSquared(v));
  }

  /**
   * 计算到另一个向量的距离平方
   * @param v 另一个向量
   * @returns 距离平方
   */
  distanceToSquared(v: Vector3): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;

    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * 向量缩放
   * @param v - 数字
   * @returns 缩放结果
   */
  scale(v: number): this {
    const e = this.elements;

    e[0] *= v;
    e[1] *= v;
    e[2] *= v;

    return this;
  }

  /**
   * 向量转数组
   * @returns 数组
   */
  toArray(): [x: number, y: number, z: number] {
    const e = this.elements;

    return [e[0], e[1], e[2]];
  }

  /**
   * 转换为Vector2类型
   * @returns Vector2对象
   */
  toVector2(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /**
   * 将向量填充到数组
   * @param array 目标数组
   * @param offset 偏移值
   */
  fill(array: number[] | Float32Array, offset = 0) {
    const e = this.elements;

    array[offset] = e[0];
    array[offset + 1] = e[1];
    array[offset + 2] = e[2];
  }

  /**
   * 向量判等
   * @param v - 向量
   * @returns 判等结果
   */
  equals(v: Vector3): boolean {
    return this.x === v.x && this.y === v.y && this.z === v.z;
  }

  /**
   * 是否零向量
   * @returns 是否零向量
   */
  isZero(): boolean {
    const eps = NumberEpsilon;
    const { x, y, z } = this;

    return Math.abs(x) <= eps && Math.abs(y) <= eps && Math.abs(z) <= eps;
  }

  /**
   * 向量求最小值
   * @param v - 向量
   * @returns 最小值
   */
  min(v: Vector3 | number): this {
    const e = this.elements;

    if (typeof v === 'number') {
      e[0] = Math.min(e[0], v);
      e[1] = Math.min(e[1], v);
      e[2] = Math.min(e[2], v);
    } else {
      e[0] = Math.min(e[0], v.x);
      e[1] = Math.min(e[1], v.y);
      e[2] = Math.min(e[2], v.z);
    }

    return this;
  }

  /**
   * 向量求最大值
   * @param v - 向量
   * @returns 最大值
   */
  max(v: Vector3 | number): this {
    const e = this.elements;

    if (typeof v === 'number') {
      e[0] = Math.max(e[0], v);
      e[1] = Math.max(e[1], v);
      e[2] = Math.max(e[2], v);
    } else {
      e[0] = Math.max(e[0], v.x);
      e[1] = Math.max(e[1], v.y);
      e[2] = Math.max(e[2], v.z);
    }

    return this;
  }

  /**
   * 向量阈值约束
   * @param min - 极小值
   * @param max - 极大值
   * @returns 向量
   */
  clamp(min: Vector3 | number, max: Vector3 | number): this {
    return this.max(min).min(max);
  }

  /**
   * 向量向下取整
   * @returns 取整结果
   */
  floor(): this {
    const e = this.elements;

    e[0] = Math.floor(e[0]);
    e[1] = Math.floor(e[1]);
    e[2] = Math.floor(e[2]);

    return this;
  }

  /**
   * 向量向上取整
   * @returns 取整结果
   */
  ceil(): this {
    const e = this.elements;

    e[0] = Math.ceil(e[0]);
    e[1] = Math.ceil(e[1]);
    e[2] = Math.ceil(e[2]);

    return this;
  }

  /**
   * 向量四舍五入
   * @returns 取整结果
   */
  round(): this {
    const e = this.elements;

    e[0] = Math.round(e[0]);
    e[1] = Math.round(e[1]);
    e[2] = Math.round(e[2]);

    return this;
  }

  /**
   * 向量取绝对值
   * @returns 向量
   */
  abs(): this {
    const e = this.elements;

    e[0] = Math.abs(e[0]);
    e[1] = Math.abs(e[1]);
    e[2] = Math.abs(e[2]);

    return this;
  }

  /**
   * 向量取反
   * @returns 取反结果
   */
  negate(): this {
    const e = this.elements;

    e[0] = -e[0];
    e[1] = -e[1];
    e[2] = -e[2];

    return this;
  }

  /**
   * 设置向量长度
   * @param length - 长度
   * @returns 向量
   */
  setLength(length: number): this {
    return this.normalize().scale(length);
  }

  /**
   * 向量线性插值
   * @param v - 向量
   * @param alpha - 插值比例
   * @returns 插值结果
   */
  lerp(v: Vector3, alpha: number): this {
    const e = this.elements;

    e[0] += (v.x - e[0]) * alpha;
    e[1] += (v.y - e[1]) * alpha;
    e[2] += (v.z - e[2]) * alpha;

    return this;
  }

  /**
   * 两向量间的线性插值
   * @param v1 - 第一个向量
   * @param v2 - 第二个向量
   * @param alpha - 插值比例
   * @returns 插值结果
   */
  lerpVectors(v1: Vector3, v2: Vector3, alpha: number): this {
    const e = this.elements;

    e[0] = v1.x + (v2.x - v1.x) * alpha;
    e[1] = v1.y + (v2.y - v1.y) * alpha;
    e[2] = v1.z + (v2.z - v1.z) * alpha;

    return this;
  }

  /**
   * 变换矩阵作用于向量
   * @param matrix - 变换矩阵
   * @returns 向量
   */
  applyMatrix(matrix: Matrix4): this {
    const e = this.elements;
    const x = e[0];
    const y = e[1];
    const z = e[2];
    const m = matrix.getElements();

    // 应用矩阵变换 (列优先矩阵)
    e[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    e[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    e[2] = m[2] * x + m[6] * y + m[10] * z + m[14];

    return this;
  }

  /**
   * 应用投影矩阵变换
   * @param matrix - 变换矩阵
   * @returns 向量
   */
  applyProjectionMatrix(matrix: Matrix4): this {
    const e = this.elements;
    const x = e[0];
    const y = e[1];
    const z = e[2];
    const m = matrix.getElements();

    // 应用投影矩阵变换并进行齐次坐标除法
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    const invW = Math.abs(w) < 1e-8 ? 1 : 1 / w;

    e[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) * invW;
    e[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) * invW;
    e[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) * invW;

    return this;
  }

  /**
   * 应用法线变换矩阵
   * @param matrix - 变换矩阵
   * @returns 向量
   */
  applyNormalMatrix(matrix: Matrix4): this {
    // 法线向量变换需要使用矩阵的伴随转置矩阵
    // 对于刚体变换，可以直接使用旋转部分
    const e = this.elements;
    const x = e[0];
    const y = e[1];
    const z = e[2];
    const m = matrix.getElements();

    // 只应用旋转部分
    e[0] = m[0] * x + m[1] * y + m[2] * z;
    e[1] = m[4] * x + m[5] * y + m[6] * z;
    e[2] = m[8] * x + m[9] * y + m[10] * z;

    // 归一化结果
    return this.normalize();
  }

  // ========== 规范兼容方法 ==========

  /**
   * 转换为IVector3接口格式
   * @returns IVector3接口对象
   */
  toIVector3(): Vector3Like {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
    };
  }

  /**
   * 从IVector3接口创建Vector3实例
   * @param v - IVector3接口对象
   * @returns Vector3实例
   */
  static fromIVector3(v: Vector3Like): Vector3 {
    return new Vector3(v.x, v.y, v.z);
  }

  /**
   * 从IVector3接口设置当前向量值
   * @param v - IVector3接口对象
   * @returns 返回自身，用于链式调用
   */
  fromIVector3(v: Vector3Like): this {
    this.elements[0] = v.x;
    this.elements[1] = v.y;
    this.elements[2] = v.z;
    return this;
  }

  // ========== USD 兼容方法 ==========

  /**
   * 转换为USD兼容的UsdValue格式（Vector3f）
   * @returns UsdValue数组格式
   */
  toUsdValue(): UsdValue {
    return {
      type: UsdDataType.Vector3f,
      value: [this.x, this.y, this.z],
    };
  }

  /**
   * 从USD兼容的UsdValue格式创建Vector3实例
   * @param value - UsdValue对象格式
   * @returns Vector3实例
   */
  static fromUsdValue(value: UsdValue): Vector3 {
    if (!value.value || !Array.isArray(value.value) || value.value.length < 3) {
      throw new Error('Invalid UsdValue for Vector3: must have array value with at least 3 elements');
    }
    const [x, y, z] = value.value as [number, number, number];
    return new Vector3(x, y, z);
  }

  /**
   * 从USD兼容的UsdValue格式设置当前向量值
   * @param value - UsdValue对象格式
   * @returns 返回自身，用于链式调用
   */
  fromUsdValue(value: UsdValue): this {
    if (!value.value || !Array.isArray(value.value) || value.value.length < 3) {
      throw new Error('Invalid UsdValue for Vector3: must have array value with at least 3 elements');
    }
    const [x, y, z] = value.value as [number, number, number];
    this.elements[0] = x;
    this.elements[1] = y;
    this.elements[2] = z;
    return this;
  }

  // ========== 高性能对象池方法 ==========

  /**
   * 从对象池创建Vector3实例（高性能）
   * @param x - x分量，默认为0
   * @param y - y分量，默认为0
   * @param z - z分量，默认为0
   * @returns Vector3实例
   */
  static create(x = 0, y = 0, z = 0): Vector3 {
    if (MathConfig.isObjectPoolEnabled()) {
      const instance = vector3Pool.create();
      instance.set(x, y, z);
      return instance;
    }
    return new Vector3(x, y, z);
  }

  /**
   * 释放Vector3实例到对象池（高性能）
   * @param vector - 要释放的向量实例
   */
  static release(vector: Vector3): void {
    if (MathConfig.isObjectPoolEnabled() && vector) {
      vector3Pool.release(vector);
    }
  }

  /**
   * 预分配指定数量的Vector3实例到对象池
   * @param count - 预分配数量
   */
  static preallocate(count: number): void {
    if (MathConfig.isObjectPoolEnabled()) {
      vector3Pool.preallocate(count);
    }
  }

  /**
   * 清空对象池
   */
  static clearPool(): void {
    vector3Pool.clear();
  }

  /**
   * 获取对象池统计信息
   */
  static getPoolStats() {
    return vector3Pool.getStats();
  }

  /**
   * 检查是否支持SIMD优化
   */
  static hasSIMDSupport(): boolean {
    return MathConfig.isSIMDEnabled();
  }

  // ========== 实用方法 ==========

  /**
   * 返回一个归一化后的新向量
   * @returns 归一化后的新向量
   */
  normalized(): Vector3 {
    const len = this.getLength();

    if (len < NumberEpsilon) {
      return Vector3.create();
    }

    const scale = 1 / len;
    return Vector3.create(this.x * scale, this.y * scale, this.z * scale);
  }

  /**
   * 向量乘以标量，返回一个新向量
   * @param scalar - 标量值
   * @returns 新向量
   */
  multiplyScalar(scalar: number): Vector3 {
    return Vector3.create(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  /**
   * 向量除以标量，返回一个新向量
   * @param scalar - 标量值
   * @returns 新向量
   */
  divideScalar(scalar: number): Vector3 {
    if (Math.abs(scalar) < NumberEpsilon) {
      console.warn('Vector3.divideScalar: scalar is too close to zero');
      return Vector3.create();
    }
    const invScalar = 1 / scalar;
    return Vector3.create(this.x * invScalar, this.y * invScalar, this.z * invScalar);
  }

  // ========== 静态计算方法 ==========

  /**
   * 计算两个向量的叉积，返回一个新的向量
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 叉积向量
   */
  static cross(a: Vector3, b: Vector3): Vector3 {
    const ax = a.x,
      ay = a.y,
      az = a.z;
    const bx = b.x,
      by = b.y,
      bz = b.z;

    return Vector3.create(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  }

  /**
   * 计算两个向量的差值，返回一个新的向量
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 差值向量 (a - b)
   */
  static subtract(a: Vector3, b: Vector3): Vector3 {
    return Vector3.create(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  /**
   * 计算两个向量的和，返回一个新的向量
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 和向量 (a + b)
   */
  static add(a: Vector3, b: Vector3): Vector3 {
    return Vector3.create(a.x + b.x, a.y + b.y, a.z + b.z);
  }

  /**
   * 计算两个向量的乘积，返回一个新的向量
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 乘积向量 (a * b)
   */
  static multiply(a: Vector3, b: Vector3): Vector3 {
    return Vector3.create(a.x * b.x, a.y * b.y, a.z * b.z);
  }

  /**
   * 计算两个向量的点积
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 点积值
   */
  static dot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  /**
   * 计算两个向量之间的距离
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 距离值
   */
  static distance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 计算两个向量之间的距离平方
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 距离平方值
   */
  static distanceSquared(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * 在两个向量之间进行线性插值
   * @param a - 起始向量
   * @param b - 目标向量
   * @param t - 插值参数 [0, 1]
   * @returns 插值结果向量
   */
  static lerp(a: Vector3, b: Vector3, t: number): Vector3 {
    const clampedT = Math.max(0, Math.min(1, t));
    return Vector3.create(a.x + (b.x - a.x) * clampedT, a.y + (b.y - a.y) * clampedT, a.z + (b.z - a.z) * clampedT);
  }

  /**
   * 在两个向量之间进行球面线性插值
   * @param a - 起始向量
   * @param b - 目标向量
   * @param t - 插值参数 [0, 1]
   * @returns 插值结果向量
   */
  static slerp(a: Vector3, b: Vector3, t: number): Vector3 {
    const clampedT = Math.max(0, Math.min(1, t));

    // 计算角度
    const dot = Vector3.dot(a.normalized(), b.normalized());
    const theta = Math.acos(Math.max(-1, Math.min(1, dot)));

    if (Math.abs(theta) < NumberEpsilon) {
      // 向量几乎平行，使用线性插值
      return Vector3.lerp(a, b, clampedT);
    }

    const sinTheta = Math.sin(theta);
    const factor1 = Math.sin((1 - clampedT) * theta) / sinTheta;
    const factor2 = Math.sin(clampedT * theta) / sinTheta;

    return Vector3.create(a.x * factor1 + b.x * factor2, a.y * factor1 + b.y * factor2, a.z * factor1 + b.z * factor2);
  }

  /**
   * 计算向量的反射
   * @param incident - 入射向量
   * @param normal - 法向量（必须是单位向量）
   * @returns 反射向量
   */
  static reflect(incident: Vector3, normal: Vector3): Vector3 {
    const dot = Vector3.dot(incident, normal);
    return Vector3.create(
      incident.x - 2 * dot * normal.x,
      incident.y - 2 * dot * normal.y,
      incident.z - 2 * dot * normal.z
    );
  }

  /**
   * 计算向量的折射
   * @param incident - 入射向量（必须是单位向量）
   * @param normal - 法向量（必须是单位向量）
   * @param eta - 折射率
   * @returns 折射向量，如果发生全反射则返回null
   */
  static refract(incident: Vector3, normal: Vector3, eta: number): Vector3 | null {
    const cosI = -Vector3.dot(incident, normal);
    const sin2T = eta * eta * (1 - cosI * cosI);

    if (sin2T > 1) {
      // 全反射
      return null;
    }

    const cosT = Math.sqrt(1 - sin2T);

    return Vector3.create(
      eta * incident.x + (eta * cosI - cosT) * normal.x,
      eta * incident.y + (eta * cosI - cosT) * normal.y,
      eta * incident.z + (eta * cosI - cosT) * normal.z
    );
  }

  /**
   * 获取向量的最小分量值
   * @param v - 向量
   * @returns 最小分量值
   */
  static minComponent(v: Vector3): number {
    return Math.min(v.x, Math.min(v.y, v.z));
  }

  /**
   * 获取向量的最大分量值
   * @param v - 向量
   * @returns 最大分量值
   */
  static maxComponent(v: Vector3): number {
    return Math.max(v.x, Math.max(v.y, v.z));
  }

  /**
   * 检查向量是否为有效值
   * @param v - 向量
   * @returns 是否有效
   */
  static isValid(v: Vector3): boolean {
    return !isNaN(v.x) && !isNaN(v.y) && !isNaN(v.z) && isFinite(v.x) && isFinite(v.y) && isFinite(v.z);
  }

  /**
   * 计算三个向量中每个分量的最小值
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @param c - 第三个向量
   * @returns 最小值向量
   */
  static min3(a: Vector3, b: Vector3, c: Vector3): Vector3 {
    return Vector3.create(Math.min(a.x, b.x, c.x), Math.min(a.y, b.y, c.y), Math.min(a.z, b.z, c.z));
  }

  /**
   * 计算三个向量中每个分量的最大值
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @param c - 第三个向量
   * @returns 最大值向量
   */
  static max3(a: Vector3, b: Vector3, c: Vector3): Vector3 {
    return Vector3.create(Math.max(a.x, b.x, c.x), Math.max(a.y, b.y, c.y), Math.max(a.z, b.z, c.z));
  }
}
