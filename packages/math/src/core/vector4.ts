import type { UsdDataType, UsdValue, vec4, Vector4DataType, Vector4Like } from '@maxellabs/specification';
import type { Matrix4 } from './matrix4';
import { NumberEpsilon } from './utils';
import { Vector3 } from './vector3';
import { MathConfig } from '../config/mathConfig';
import { ObjectPool, type Poolable } from '../pool/objectPool';

// 高性能对象池实现
const vector4Pool = new ObjectPool<Vector4>(() => new Vector4(), MathConfig.getPoolConfig().Vector4);

/**
 * 四维向量
 * 实现 @specification 包的 IVector4 接口，提供高性能的4D向量运算
 */
export class Vector4 implements Vector4Like, Poolable {
  /**
   * 四维向量的常量
   */
  static readonly ONE = Object.freeze(new Vector4(1.0, 1.0, 1.0, 1.0));
  static readonly ZERO = Object.freeze(new Vector4(0.0, 0.0, 0.0, 0.0));
  static readonly X = Object.freeze(new Vector4(1.0, 0.0, 0.0, 0.0));
  static readonly Y = Object.freeze(new Vector4(0.0, 1.0, 0.0, 0.0));
  static readonly Z = Object.freeze(new Vector4(0.0, 0.0, 1.0, 0.0));
  static readonly W = Object.freeze(new Vector4(0.0, 0.0, 0.0, 1.0));

  // 使用内存对齐的TypedArray，提高SIMD性能
  private elements: Float32Array;

  /**
   * 构造函数
   * @param x - x分量，默认为0
   * @param y - y分量，默认为0
   * @param z - z分量，默认为0
   * @param w - w分量，默认为0
   */
  constructor(x = 0, y = 0, z = 0, w = 0) {
    // 16字节对齐，优化SIMD访问
    this.elements = new Float32Array(4);
    this.elements[0] = x;
    this.elements[1] = y;
    this.elements[2] = z;
    this.elements[3] = w;
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
   * x坐标访问器（IVector4接口）
   */
  get x(): number {
    return this.elements[0];
  }

  set x(value: number) {
    this.elements[0] = value;
  }

  /**
   * y坐标访问器（IVector4接口）
   */
  get y(): number {
    return this.elements[1];
  }

  set y(value: number) {
    this.elements[1] = value;
  }

  /**
   * z坐标访问器（IVector4接口）
   */
  get z(): number {
    return this.elements[2];
  }

  set z(value: number) {
    this.elements[2] = value;
  }

  /**
   * w坐标访问器（IVector4接口）
   */
  get w(): number {
    return this.elements[3];
  }

  set w(value: number) {
    this.elements[3] = value;
  }

  // ========== 规范兼容方法 ==========

  /**
   * 转换为IVector4接口格式
   * @returns IVector4接口对象
   */
  toIVector4(): Vector4Like {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
      w: this.w,
    };
  }

  /**
   * 从IVector4接口创建Vector4实例
   * @param v - IVector4接口对象
   * @returns Vector4实例
   */
  static fromIVector4(v: Vector4Like): Vector4 {
    return new Vector4(v.x, v.y, v.z, v.w);
  }

  /**
   * 从IVector4接口设置当前向量值
   * @param v - IVector4接口对象
   * @returns 返回自身，用于链式调用
   */
  fromIVector4(v: Vector4Like): this {
    this.elements[0] = v.x;
    this.elements[1] = v.y;
    this.elements[2] = v.z;
    this.elements[3] = v.w;
    return this;
  }

  // ========== USD 兼容方法 ==========

  /**
   * 转换为USD兼容的UsdValue格式（Vector4f）
   * @returns UsdValue对象格式
   */
  toUsdValue(): UsdValue {
    return {
      type: 'float4' as UsdDataType, // 直接使用字符串，类型断言
      value: [this.x, this.y, this.z, this.w],
    };
  }

  /**
   * 从USD兼容的UsdValue格式创建Vector4实例
   * @param value - UsdValue对象格式
   * @returns Vector4实例
   */
  static fromUsdValue(value: UsdValue): Vector4 {
    if (!value.value || !Array.isArray(value.value) || value.value.length < 4) {
      throw new Error('Invalid UsdValue for Vector4: must have array value with at least 4 elements');
    }
    const [x, y, z, w] = value.value as [number, number, number, number];
    return new Vector4(x, y, z, w);
  }

  /**
   * 从USD兼容的UsdValue格式设置当前向量值
   * @param value - UsdValue对象格式
   * @returns 返回自身，用于链式调用
   */
  fromUsdValue(value: UsdValue): this {
    if (!value.value || !Array.isArray(value.value) || value.value.length < 4) {
      throw new Error('Invalid UsdValue for Vector4: must have array value with at least 4 elements');
    }
    const [x, y, z, w] = value.value as [number, number, number, number];
    this.elements[0] = x;
    this.elements[1] = y;
    this.elements[2] = z;
    this.elements[3] = w;
    return this;
  }

  // ========== 高性能对象池方法 ==========

  /**
   * 从对象池创建Vector4实例（高性能）
   * @param x - x分量，默认为0
   * @param y - y分量，默认为0
   * @param z - z分量，默认为0
   * @param w - w分量，默认为0
   * @returns Vector4实例
   */
  static create(x = 0, y = 0, z = 0, w = 0): Vector4 {
    if (MathConfig.isObjectPoolEnabled()) {
      const instance = vector4Pool.create();
      instance.set(x, y, z, w);
      return instance;
    }
    return new Vector4(x, y, z, w);
  }

  /**
   * 释放Vector4实例到对象池（高性能）
   * @param vector - 要释放的向量实例
   */
  static release(vector: Vector4): void {
    if (MathConfig.isObjectPoolEnabled() && vector) {
      vector4Pool.release(vector);
    }
  }

  /**
   * 预分配指定数量的Vector4实例到对象池
   * @param count - 预分配数量
   */
  static preallocate(count: number): void {
    if (MathConfig.isObjectPoolEnabled()) {
      vector4Pool.preallocate(count);
    }
  }

  /**
   * 清空对象池
   */
  static clearPool(): void {
    vector4Pool.clear();
  }

  /**
   * 获取对象池统计信息
   */
  static getPoolStats() {
    return vector4Pool.getStats();
  }

  /**
   * 设置向量
   * @param x - x 轴分量
   * @param y - y 轴分量
   * @param z - z 轴分量
   * @param w - w 轴分量
   * @returns
   */
  set(x: number, y: number, z: number, w: number): this {
    this.elements[0] = x;
    this.elements[1] = y;
    this.elements[2] = z;
    this.elements[3] = w;

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
    this.elements[3] = 0;

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
    this.elements[3] = num;

    return this;
  }

  /**
   * 通过数组创建向量
   * @param array - 数组
   * @param offset - 起始偏移值，默认为0
   * @returns 向量
   */
  setFromArray(array: Vector4DataType, offset = 0): this {
    this.elements[0] = array[offset] ?? 0;
    this.elements[1] = array[offset + 1] ?? 0;
    this.elements[2] = array[offset + 2] ?? 0;
    this.elements[3] = array[offset + 3] ?? 0;

    return this;
  }

  /**
   * 拷贝向量
   * @param v - 复制对象
   * @returns 拷贝结果
   */
  copyFrom(v: Vector4Like): this {
    this.elements[0] = v.x;
    this.elements[1] = v.y;
    this.elements[2] = v.z;
    this.elements[3] = v.w;

    return this;
  }

  /**
   * 克隆向量
   * @returns 克隆结果
   */
  clone(): Vector4 {
    return Vector4.create(this.x, this.y, this.z, this.w);
  }

  /**
   * 根据下标设置向量分量
   * @param index - 下标值
   * @param value - 分量值
   * @returns 向量
   */
  setElement(index: number, value: number): this {
    if (index >= 0 && index <= 3) {
      this.elements[index] = value;
    } else {
      console.error('index is out of range: ' + index);
    }

    return this;
  }

  /**
   * 根据下标获取向量分量
   * @param index - 下标
   * @returns 分量值
   */
  getElement(index: number): number {
    if (index >= 0 && index <= 3) {
      return this.elements[index];
    }
    console.error('index is out of range: ' + index);

    return 0;
  }

  /**
   * 向量相加（优化版本）
   * @param right - 相加对象，向量 | 数字
   * @returns 相加结果
   */
  add(right: number | vec4 | Vector4): this {
    const e = this.elements;

    if (typeof right === 'number') {
      e[0] += right;
      e[1] += right;
      e[2] += right;
      e[3] += right;
    } else if (right instanceof Array) {
      e[0] += right[0];
      e[1] += right[1];
      e[2] += right[2];
      e[3] += right[3];
    } else {
      e[0] += right.x;
      e[1] += right.y;
      e[2] += right.z;
      e[3] += right.w;
    }

    return this;
  }

  /**
   * 向量相加
   * @param left - 向量
   * @param right - 向量
   * @returns 求和结果
   */
  addVectors(left: Vector4, right: Vector4): this {
    const e = this.elements;

    e[0] = left.x + right.x;
    e[1] = left.y + right.y;
    e[2] = left.z + right.z;
    e[3] = left.w + right.w;

    return this;
  }

  /**
   * 向量乘比例后相加
   * @param right - 向量
   * @param s - 比例
   * @returns 相加结果
   */
  addScaledVector(right: Vector4, s: number): this {
    const e = this.elements;

    e[0] += right.x * s;
    e[1] += right.y * s;
    e[2] += right.z * s;
    e[3] += right.w * s;

    return this;
  }

  /**
   * 向量相减（优化版本）
   * @param right - 相减对象，向量 | 数字
   * @returns 相减结果
   */
  subtract(right: number | vec4 | Vector4): this {
    const e = this.elements;

    if (typeof right === 'number') {
      e[0] -= right;
      e[1] -= right;
      e[2] -= right;
      e[3] -= right;
    } else if (right instanceof Array) {
      e[0] -= right[0];
      e[1] -= right[1];
      e[2] -= right[2];
      e[3] -= right[3];
    } else {
      e[0] -= right.x;
      e[1] -= right.y;
      e[2] -= right.z;
      e[3] -= right.w;
    }

    return this;
  }

  /**
   * 向量相减
   * @param left - 向量
   * @param right - 向量
   * @returns 相减结果
   */
  subtractVectors(left: Vector4, right: Vector4): this {
    const e = this.elements;

    e[0] = left.x - right.x;
    e[1] = left.y - right.y;
    e[2] = left.z - right.z;
    e[3] = left.w - right.w;

    return this;
  }

  /**
   * 向量相乘（优化版本）
   * @param right - 相乘对象，向量 | 数字
   * @returns 相乘结果
   */
  multiply(right: number | vec4 | Vector4): this {
    const e = this.elements;

    if (typeof right === 'number') {
      e[0] *= right;
      e[1] *= right;
      e[2] *= right;
      e[3] *= right;
    } else if (right instanceof Array) {
      e[0] *= right[0];
      e[1] *= right[1];
      e[2] *= right[2];
      e[3] *= right[3];
    } else {
      e[0] *= right.x;
      e[1] *= right.y;
      e[2] *= right.z;
      e[3] *= right.w;
    }

    return this;
  }

  /**
   * 向量相乘
   * @param left - 向量
   * @param right - 向量
   * @returns 相乘结果
   */
  multiplyVectors(left: Vector4, right: Vector4): this {
    const e = this.elements;

    e[0] = left.x * right.x;
    e[1] = left.y * right.y;
    e[2] = left.z * right.z;
    e[3] = left.w * right.w;

    return this;
  }

  /**
   * 向量相除（优化版本）
   * @param right - 相除对象，向量 | 数字
   * @returns 相除结果
   */
  divide(right: number | vec4 | Vector4): this {
    const e = this.elements;

    if (typeof right === 'number') {
      if (Math.abs(right) < NumberEpsilon) {
        console.warn('Vector4.divide: scalar is too close to zero');
        return this;
      }
      const invRight = 1 / right;
      e[0] *= invRight;
      e[1] *= invRight;
      e[2] *= invRight;
      e[3] *= invRight;
    } else if (right instanceof Array) {
      e[0] /= right[0];
      e[1] /= right[1];
      e[2] /= right[2];
      e[3] /= right[3];
    } else {
      e[0] /= right.x;
      e[1] /= right.y;
      e[2] /= right.z;
      e[3] /= right.w;
    }

    return this;
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
    e[3] *= v;

    return this;
  }

  /**
   * 分量求和
   * @returns 求和结果
   */
  sum(): number {
    const e = this.elements;
    return e[0] + e[1] + e[2] + e[3];
  }

  /**
   * 向量求最小值
   * @param v - 向量
   * @returns 最小值
   */
  min(v: Vector4 | number): this {
    const e = this.elements;

    if (typeof v === 'number') {
      e[0] = Math.min(e[0], v);
      e[1] = Math.min(e[1], v);
      e[2] = Math.min(e[2], v);
      e[3] = Math.min(e[3], v);
    } else {
      e[0] = Math.min(e[0], v.x);
      e[1] = Math.min(e[1], v.y);
      e[2] = Math.min(e[2], v.z);
      e[3] = Math.min(e[3], v.w);
    }

    return this;
  }

  /**
   * 向量求最大值
   * @param v - 向量
   * @returns 最大值
   */
  max(v: Vector4 | number): this {
    const e = this.elements;

    if (typeof v === 'number') {
      e[0] = Math.max(e[0], v);
      e[1] = Math.max(e[1], v);
      e[2] = Math.max(e[2], v);
      e[3] = Math.max(e[3], v);
    } else {
      e[0] = Math.max(e[0], v.x);
      e[1] = Math.max(e[1], v.y);
      e[2] = Math.max(e[2], v.z);
      e[3] = Math.max(e[3], v.w);
    }

    return this;
  }

  /**
   * 向量阈值约束
   * @param min - 极小值
   * @param max - 极大值
   * @returns 向量
   */
  clamp(min: Vector4 | number, max: Vector4 | number): this {
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
    e[3] = Math.floor(e[3]);

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
    e[3] = Math.ceil(e[3]);

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
    e[3] = Math.round(e[3]);

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
    e[3] = Math.abs(e[3]);

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
    e[3] = -e[3];

    return this;
  }

  /**
   * 向量长度平方
   * @returns 长度平方
   */
  lengthSquared(): number {
    const e = this.elements;
    const x = e[0],
      y = e[1],
      z = e[2],
      w = e[3];
    return x * x + y * y + z * z + w * w;
  }

  /**
   * 向量长度
   * @returns 长度
   */
  length(): number {
    return Math.sqrt(this.lengthSquared());
  }

  /**
   * 向量归一化
   * @returns 归一化结果
   */
  normalize(): this {
    const len = this.length();
    if (len > NumberEpsilon) {
      const invLen = 1 / len;
      const e = this.elements;
      e[0] *= invLen;
      e[1] *= invLen;
      e[2] *= invLen;
      e[3] *= invLen;
    }
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
  lerp(v: Vector4, alpha: number): this {
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    const e = this.elements;

    e[0] += (v.x - e[0]) * clampedAlpha;
    e[1] += (v.y - e[1]) * clampedAlpha;
    e[2] += (v.z - e[2]) * clampedAlpha;
    e[3] += (v.w - e[3]) * clampedAlpha;

    return this;
  }

  /**
   * 两向量间的线性插值
   * @param v1 - 第一个向量
   * @param v2 - 第二个向量
   * @param alpha - 插值比例
   * @returns 插值结果
   */
  lerpVectors(v1: Vector4, v2: Vector4, alpha: number): this {
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    const e = this.elements;

    e[0] = v1.x + (v2.x - v1.x) * clampedAlpha;
    e[1] = v1.y + (v2.y - v1.y) * clampedAlpha;
    e[2] = v1.z + (v2.z - v1.z) * clampedAlpha;
    e[3] = v1.w + (v2.w - v1.w) * clampedAlpha;

    return this;
  }

  /**
   * 向量求点积
   * @param v - 向量
   * @returns 点积结果
   */
  dot(v: Vector4): number {
    const e = this.elements;
    return e[0] * v.x + e[1] * v.y + e[2] * v.z + e[3] * v.w;
  }

  /**
   * 向量判等
   * @param v - 向量
   * @returns 判等结果
   */
  equals(v: Vector4): boolean {
    return (
      Math.abs(this.x - v.x) < NumberEpsilon &&
      Math.abs(this.y - v.y) < NumberEpsilon &&
      Math.abs(this.z - v.z) < NumberEpsilon &&
      Math.abs(this.w - v.w) < NumberEpsilon
    );
  }

  /**
   * 是否零向量
   * @returns 是否零向量
   */
  isZero(): boolean {
    return (
      Math.abs(this.x) < NumberEpsilon &&
      Math.abs(this.y) < NumberEpsilon &&
      Math.abs(this.z) < NumberEpsilon &&
      Math.abs(this.w) < NumberEpsilon
    );
  }

  /**
   * 向量转数组
   * @returns 数组
   */
  toArray(): [x: number, y: number, z: number, w: number] {
    const e = this.elements;
    return [e[0], e[1], e[2], e[3]];
  }

  /**
   * 转换为Vector3类型
   * @returns Vector3对象
   */
  toVector3(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  /**
   * 将向量填充到数组
   * @param array - 目标数组
   * @param offset - 偏移值，默认为0
   */
  fill(array: number[] | Float32Array, offset = 0) {
    const e = this.elements;

    array[offset] = e[0];
    array[offset + 1] = e[1];
    array[offset + 2] = e[2];
    array[offset + 3] = e[3];
  }

  /**
   * 设置随机值
   * @returns 向量
   */
  random(): this {
    const e = this.elements;

    e[0] = Math.random();
    e[1] = Math.random();
    e[2] = Math.random();
    e[3] = Math.random();

    return this;
  }

  /**
   * 应用矩阵变换
   * @param m - 变换矩阵
   * @param out - 输出向量，可选
   * @returns 变换后的向量
   */
  applyMatrix(m: Matrix4, out?: Vector4): Vector4 {
    const result = out || this;
    const e = this.elements;
    const x = e[0],
      y = e[1],
      z = e[2],
      w = e[3];
    const me = m.getElements();

    result.set(
      me[0] * x + me[4] * y + me[8] * z + me[12] * w,
      me[1] * x + me[5] * y + me[9] * z + me[13] * w,
      me[2] * x + me[6] * y + me[10] * z + me[14] * w,
      me[3] * x + me[7] * y + me[11] * z + me[15] * w
    );

    return result;
  }

  // ========== 实用方法 ==========

  /**
   * 返回归一化后的新向量
   * @returns 归一化后的新向量
   */
  normalized(): Vector4 {
    const len = this.length();
    if (len < NumberEpsilon) {
      return Vector4.create();
    }
    const scale = 1 / len;
    return Vector4.create(this.x * scale, this.y * scale, this.z * scale, this.w * scale);
  }

  /**
   * 向量乘以标量，返回新向量
   * @param scalar - 标量值
   * @returns 新向量
   */
  multiplyScalar(scalar: number): Vector4 {
    return Vector4.create(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
  }

  /**
   * 向量除以标量，返回新向量
   * @param scalar - 标量值
   * @returns 新向量
   */
  divideScalar(scalar: number): Vector4 {
    if (Math.abs(scalar) < NumberEpsilon) {
      console.warn('Vector4.divideScalar: scalar is too close to zero');
      return Vector4.create();
    }
    const invScalar = 1 / scalar;
    return Vector4.create(this.x * invScalar, this.y * invScalar, this.z * invScalar, this.w * invScalar);
  }

  // ========== 静态方法 ==========

  /**
   * 通过标量创建向量
   * @param num - 数值
   * @returns 向量
   */
  static fromNumber(num: number): Vector4 {
    return Vector4.create(num, num, num, num);
  }

  /**
   * 通过数组创建向量
   * @param array - 数组
   * @param offset - 起始偏移值，默认为0
   * @returns 向量
   */
  static fromArray(array: Vector4DataType, offset = 0): Vector4 {
    return Vector4.create(array[offset] ?? 0, array[offset + 1] ?? 0, array[offset + 2] ?? 0, array[offset + 3] ?? 0);
  }

  /**
   * 计算两个向量的和，返回新向量
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 和向量 (a + b)
   */
  static add(a: Vector4, b: Vector4): Vector4 {
    return Vector4.create(a.x + b.x, a.y + b.y, a.z + b.z, a.w + b.w);
  }

  /**
   * 计算两个向量的差，返回新向量
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 差向量 (a - b)
   */
  static subtract(a: Vector4, b: Vector4): Vector4 {
    return Vector4.create(a.x - b.x, a.y - b.y, a.z - b.z, a.w - b.w);
  }

  /**
   * 计算两个向量的乘积，返回新向量
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 乘积向量 (a * b)
   */
  static multiply(a: Vector4, b: Vector4): Vector4 {
    return Vector4.create(a.x * b.x, a.y * b.y, a.z * b.z, a.w * b.w);
  }

  /**
   * 计算两个向量的点积
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 点积值
   */
  static dot(a: Vector4, b: Vector4): number {
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  }

  /**
   * 计算两个向量之间的距离
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 距离值
   */
  static distance(a: Vector4, b: Vector4): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    const dw = a.w - b.w;
    return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
  }

  /**
   * 计算两个向量之间的距离平方
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 距离平方值
   */
  static distanceSquared(a: Vector4, b: Vector4): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    const dw = a.w - b.w;
    return dx * dx + dy * dy + dz * dz + dw * dw;
  }

  /**
   * 在两个向量之间进行线性插值
   * @param a - 起始向量
   * @param b - 目标向量
   * @param t - 插值参数 [0, 1]
   * @returns 插值结果向量
   */
  static lerp(a: Vector4, b: Vector4, t: number): Vector4 {
    const clampedT = Math.max(0, Math.min(1, t));
    return Vector4.create(
      a.x + (b.x - a.x) * clampedT,
      a.y + (b.y - a.y) * clampedT,
      a.z + (b.z - a.z) * clampedT,
      a.w + (b.w - a.w) * clampedT
    );
  }

  /**
   * 检查向量是否为有效值
   * @param v - 向量
   * @returns 是否有效
   */
  static isValid(v: Vector4): boolean {
    return (
      !isNaN(v.x) &&
      !isNaN(v.y) &&
      !isNaN(v.z) &&
      !isNaN(v.w) &&
      isFinite(v.x) &&
      isFinite(v.y) &&
      isFinite(v.z) &&
      isFinite(v.w)
    );
  }

  /**
   * 获取向量的最小分量值
   * @param v - 向量
   * @returns 最小分量值
   */
  static minComponent(v: Vector4): number {
    return Math.min(v.x, Math.min(v.y, Math.min(v.z, v.w)));
  }

  /**
   * 获取向量的最大分量值
   * @param v - 向量
   * @returns 最大分量值
   */
  static maxComponent(v: Vector4): number {
    return Math.max(v.x, Math.max(v.y, Math.max(v.z, v.w)));
  }
}
