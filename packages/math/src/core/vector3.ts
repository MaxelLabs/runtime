import type { Matrix4 } from './matrix4';
import type { Vector3DataType, Vector3Like, vec3 } from './type';
import { NumberEpsilon, fastInvSqrt } from './utils';
import { Vector2 } from './vector2';

// 对象池配置 - 增加池大小以应对高负载场景
const POOL_SIZE = 2000;
const pool: Vector3[] = [];
let poolIndex = 0;

/**
 * 三维向量
 */
export class Vector3 {
  /**
   * 三维向量的常量
   */
  static readonly X = Object.freeze(new Vector3(1.0, 0.0, 0.0));
  static readonly Y = Object.freeze(new Vector3(0.0, 1.0, 0.0));
  static readonly Z = Object.freeze(new Vector3(0.0, 0.0, 1.0));
  static readonly ONE = Object.freeze(new Vector3(1.0, 1.0, 1.0));
  static readonly ZERO = Object.freeze(new Vector3(0.0, 0.0, 0.0));

  // 使用TypedArray而不是单独的属性，提高内存密度和访问速度
  private elements: Float32Array;

  /**
   * 构造函数，默认值为零向量
   * @param [x=0]
   * @param [y=0]
   * @param [z=0]
   */
  constructor (x = 0, y = 0, z = 0) {
    this.elements = new Float32Array([x, y, z]);
  }

  /**
   * x坐标访问器
   */
  get x (): number {
    return this.elements[0];
  }

  set x (value: number) {
    this.elements[0] = value;
  }

  /**
   * y坐标访问器
   */
  get y (): number {
    return this.elements[1];
  }

  set y (value: number) {
    this.elements[1] = value;
  }

  /**
   * z坐标访问器
   */
  get z (): number {
    return this.elements[2];
  }

  set z (value: number) {
    this.elements[2] = value;
  }

  /**
   * 设置向量
   * @param x - x 轴分量
   * @param y - y 轴分量
   * @param z - z 轴分量
   * @returns 向量
   */
  set (x: number, y: number, z: number): this {
    this.elements[0] = x;
    this.elements[1] = y;
    this.elements[2] = z;

    return this;
  }

  /**
   * 设置零向量
   * @returns 向量
   */
  setZero (): this {
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
  setFromNumber (num: number): this {
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
  setFromArray (array: Vector3DataType, offset = 0): this {
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
  copyFrom (v: Readonly<Vector3> | Vector3Like): this {
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
  clone (): Vector3 {
    return Vector3.create(this.x, this.y, this.z);
  }

  /**
   * 根据下标设置向量分量
   * @param index - 下标值
   * @param value - 数字
   * @returns 向量
   */
  setElement (index: number, value: number): this {
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
  getElement (index: number): number {
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
  add (right: number | vec3 | Vector3): this {
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
  addVectors (left: Vector3, right: Vector3): this {
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
  addScaledVector (right: Vector3, s: number): this {
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
  subtract (right: number | vec3 | Vector3): this {
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
  subtractVectors (left: Vector3, right: Vector3): this {
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
  multiply (right: number | vec3 | Vector3): this {
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
  multiplyVectors (left: Vector3, right: Vector3): this {
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
  length (): number {
    const e = this.elements;
    const x = e[0], y = e[1], z = e[2];

    return Math.sqrt(x * x + y * y + z * z);
  }

  /**
   * 向量长度平方
   * @returns 长度平方
   */
  lengthSquared (): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  /**
   * 向量归一化（优化版本）
   */
  normalize (): this {
    const e = this.elements;
    const x = e[0], y = e[1], z = e[2];
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
  dot (v: Vector3): number {
    const e = this.elements;

    return e[0] * v.x + e[1] * v.y + e[2] * v.z;
  }

  /**
   * 向量求叉积
   * @param right - 向量
   * @returns 叉积结果
   */
  cross (right: Vector3): this {
    return this.crossVectors(this, right);
  }

  /**
   * 向量（a 与 b）求叉积（优化版本）
   * @param left - 向量
   * @param right - 向量
   * @returns 叉积结果
   */
  crossVectors (left: Vector3, right: Vector3): this {
    const e = this.elements;
    const ax = left.x, ay = left.y, az = left.z;
    const bx = right.x, by = right.y, bz = right.z;

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
  distanceTo (v: Vector3): number {
    return Math.sqrt(this.distanceToSquared(v));
  }

  /**
   * 计算到另一个向量的距离平方
   * @param v 另一个向量
   * @returns 距离平方
   */
  distanceToSquared (v: Vector3): number {
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
  scale (v: number): this {
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
  toArray (): [x: number, y: number, z: number] {
    const e = this.elements;

    return [e[0], e[1], e[2]];
  }

  /**
   * 转换为Vector2类型
   * @returns Vector2对象
   */
  toVector2 (): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /**
   * 将向量填充到数组
   * @param array 目标数组
   * @param offset 偏移值
   */
  fill (array: number[] | Float32Array, offset = 0) {
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
  equals (v: Vector3): boolean {
    return this.x === v.x && this.y === v.y && this.z === v.z;
  }

  /**
   * 是否零向量
   * @returns 是否零向量
   */
  isZero (): boolean {
    const eps = NumberEpsilon;
    const { x, y, z } = this;

    return Math.abs(x) <= eps && Math.abs(y) <= eps && Math.abs(z) <= eps;
  }

  /**
   * 向量求最小值
   * @param v - 向量
   * @returns 最小值
   */
  min (v: Vector3 | number): this {
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
  max (v: Vector3 | number): this {
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
  clamp (min: Vector3 | number, max: Vector3 | number): this {
    return this.max(min).min(max);
  }

  /**
   * 向量向下取整
   * @returns 取整结果
   */
  floor (): this {
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
  ceil (): this {
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
  round (): this {
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
  abs (): this {
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
  negate (): this {
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
  setLength (length: number): this {
    return this.normalize().scale(length);
  }

  /**
   * 向量线性插值
   * @param v - 向量
   * @param alpha - 插值比例
   * @returns 插值结果
   */
  lerp (v: Vector3, alpha: number): this {
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
  lerpVectors (v1: Vector3, v2: Vector3, alpha: number): this {
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
  applyMatrix (matrix: Matrix4): this {
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
  applyProjectionMatrix (matrix: Matrix4): this {
    const e = this.elements;
    const x = e[0];
    const y = e[1];
    const z = e[2];
    const m = matrix.getElements();

    // 应用投影矩阵变换并进行齐次坐标除法
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    const invW = (Math.abs(w) < 1e-8) ? 1 : 1 / w;

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
  applyNormalMatrix (matrix: Matrix4): this {
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

  /**
   * 从对象池获取或创建新的 Vector3 实例
   */
  static create (x = 0, y = 0, z = 0): Vector3 {
    if (poolIndex < pool.length) {
      const vector = pool[poolIndex++];

      vector.set(x, y, z);

      return vector;
    }

    return new Vector3(x, y, z);
  }

  /**
   * 释放 Vector3 实例到对象池
   */
  static release (vector: Vector3): void {
    if (poolIndex > 0 && pool.length < POOL_SIZE) {
      poolIndex--;
      pool[poolIndex] = vector;
    }
  }

  /**
   * 预分配对象池
   */
  static preallocate (count: number): void {
    const initialSize = pool.length;

    for (let i = 0; i < count && pool.length < POOL_SIZE; i++) {
      pool.push(new Vector3());
    }
    console.debug(`Vector3池：从${initialSize}增加到${pool.length}`);
  }

  /**
   * 清空对象池
   */
  static clearPool (): void {
    pool.length = 0;
    poolIndex = 0;
  }

  /**
   * 计算两个向量的叉积，返回一个新的向量
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 叉积向量
   */
  static cross (a: Vector3, b: Vector3): Vector3 {
    const ax = a.x, ay = a.y, az = a.z;
    const bx = b.x, by = b.y, bz = b.z;

    return new Vector3(
      ay * bz - az * by,
      az * bx - ax * bz,
      ax * by - ay * bx
    );
  }

  /**
   * 计算两个向量的差值，返回一个新的向量
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 差值向量 (a - b)
   */
  static subtract (a: Vector3, b: Vector3): Vector3 {
    return new Vector3(
      a.x - b.x,
      a.y - b.y,
      a.z - b.z
    );
  }

  /**
   * 返回一个归一化后的新向量
   * @returns 归一化后的新向量
   */
  normalized (): Vector3 {
    const len = this.length();

    if (len < NumberEpsilon) {
      return new Vector3();
    }

    const scale = 1 / len;

    return new Vector3(
      this.x * scale,
      this.y * scale,
      this.z * scale
    );
  }

  /**
   * 向量乘以标量，返回一个新向量
   * @param scalar - 标量值
   * @returns 新向量
   */
  multiplyScalar (scalar: number): Vector3 {
    return new Vector3(
      this.x * scalar,
      this.y * scalar,
      this.z * scalar
    );
  }
}
