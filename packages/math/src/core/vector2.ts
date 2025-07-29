import type { UsdDataType, UsdValue, vec2, Vector2DataType, Vector2Like } from '@maxellabs/specification';
import { NumberEpsilon } from './utils';
import { MathConfig } from '../config/mathConfig';
import { ObjectPool, type Poolable } from '../pool/objectPool';

// 高性能对象池实现
const vector2Pool = new ObjectPool<Vector2>(() => new Vector2(), MathConfig.getPoolConfig().Vector2);

/**
 * 二维向量
 * 实现 @specification 包的 IVector2 接口，提供高性能的2D向量运算
 */
export class Vector2 implements Vector2Like, Poolable {
  /**
   * 二维向量的常量
   */
  static readonly ONE = Object.freeze(new Vector2(1.0, 1.0));
  static readonly ZERO = Object.freeze(new Vector2(0.0, 0.0));
  static readonly X = Object.freeze(new Vector2(1.0, 0.0));
  static readonly Y = Object.freeze(new Vector2(0.0, 1.0));
  static readonly NEGATIVE_X = Object.freeze(new Vector2(-1.0, 0.0));
  static readonly NEGATIVE_Y = Object.freeze(new Vector2(0.0, -1.0));

  // 使用内存对齐的TypedArray，提高SIMD性能
  private elements: Float32Array;

  /**
   * 构造函数，默认为零向量
   * @param x - x分量，默认为0
   * @param y - y分量，默认为0
   */
  constructor(x = 0, y = 0) {
    // 16字节对齐，优化SIMD访问
    this.elements = new Float32Array(4); // 使用4个元素确保对齐
    this.elements[0] = x;
    this.elements[1] = y;
    this.elements[2] = 0; // padding
    this.elements[3] = 0; // padding
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
   * x坐标访问器（IVector2接口）
   */
  get x(): number {
    return this.elements[0];
  }

  set x(value: number) {
    this.elements[0] = value;
  }

  /**
   * y坐标访问器（IVector2接口）
   */
  get y(): number {
    return this.elements[1];
  }

  set y(value: number) {
    this.elements[1] = value;
  }

  // ========== 规范兼容方法 ==========

  /**
   * 转换为IVector2接口格式
   * @returns IVector2接口对象
   */
  toIVector2(): Vector2Like {
    return {
      x: this.x,
      y: this.y,
    };
  }

  /**
   * 从IVector2接口创建Vector2实例
   * @param v - IVector2接口对象
   * @returns Vector2实例
   */
  static fromIVector2(v: Vector2Like): Vector2 {
    return new Vector2(v.x, v.y);
  }

  /**
   * 从IVector2接口设置当前向量值
   * @param v - IVector2接口对象
   * @returns 返回自身，用于链式调用
   */
  fromIVector2(v: Vector2Like): this {
    this.elements[0] = v.x;
    this.elements[1] = v.y;
    return this;
  }

  // ========== USD 兼容方法 ==========

  /**
   * 转换为USD兼容的UsdValue格式（Vector2f）
   * @returns UsdValue数组格式
   */
  toUsdValue(): UsdValue {
    return {
      type: 'float2' as UsdDataType, // 直接使用字符串，类型断言
      value: [this.x, this.y],
    };
  }

  /**
   * 从USD兼容的UsdValue格式创建Vector2实例
   * @param value - UsdValue对象格式
   * @returns Vector2实例
   */
  static fromUsdValue(value: UsdValue): Vector2 {
    if (!value.value || !Array.isArray(value.value) || value.value.length < 2) {
      throw new Error('Invalid UsdValue for Vector2: must have array value with at least 2 elements');
    }
    const [x, y] = value.value as [number, number];
    return new Vector2(x, y);
  }

  /**
   * 从USD兼容的UsdValue格式设置当前向量值
   * @param value - UsdValue对象格式
   * @returns 返回自身，用于链式调用
   */
  fromUsdValue(value: UsdValue): this {
    if (!value.value || !Array.isArray(value.value) || value.value.length < 2) {
      throw new Error('Invalid UsdValue for Vector2: must have array value with at least 2 elements');
    }
    const [x, y] = value.value as [number, number];
    this.elements[0] = x;
    this.elements[1] = y;
    return this;
  }

  // ========== 高性能对象池方法 ==========

  /**
   * 从对象池创建Vector2实例（高性能）
   * @param x - x分量，默认为0
   * @param y - y分量，默认为0
   * @returns Vector2实例
   */
  static create(x = 0, y = 0): Vector2 {
    if (MathConfig.isObjectPoolEnabled()) {
      const instance = vector2Pool.create();
      instance.set(x, y);
      return instance;
    }
    return new Vector2(x, y);
  }

  /**
   * 释放Vector2实例到对象池（高性能）
   * @param vector - 要释放的向量实例
   */
  static release(vector: Vector2): void {
    if (MathConfig.isObjectPoolEnabled() && vector) {
      vector2Pool.release(vector);
    }
  }

  /**
   * 预分配指定数量的Vector2实例到对象池
   * @param count - 预分配数量
   */
  static preallocate(count: number): void {
    if (MathConfig.isObjectPoolEnabled()) {
      vector2Pool.preallocate(count);
    }
  }

  /**
   * 清空对象池
   */
  static clearPool(): void {
    vector2Pool.clear();
  }

  /**
   * 获取对象池统计信息
   */
  static getPoolStats() {
    return vector2Pool.getStats();
  }

  /**
   * 设置向量
   * @param x - x 轴分量
   * @param y - y 轴分量
   * @returns
   */
  set(x: number, y: number): this {
    this.elements[0] = x;
    this.elements[1] = y;

    return this;
  }

  /**
   * 设置零向量
   * @returns 向量
   */
  setZero(): this {
    this.elements[0] = 0;
    this.elements[1] = 0;

    return this;
  }

  /**
   * 通过标量数值创建向量
   * @param num - 数值
   * @returns 向量
   */
  setFromNumber(num: number): this {
    this.elements[0] = num;
    this.elements[1] = num;

    return this;
  }

  /**
   * 通过数组创建向量
   * @param array - 数组
   * @param offset - 起始偏移值，默认为0
   * @returns 向量
   */
  setFromArray(array: Vector2DataType, offset = 0): this {
    this.elements[0] = array[offset] ?? 0;
    this.elements[1] = array[offset + 1] ?? 0;

    return this;
  }

  /**
   * 拷贝向量
   * @param src - 要拷贝的对象
   * @returns 向量
   */
  copyFrom(src: Vector2Like): this {
    this.elements[0] = src.x;
    this.elements[1] = src.y;

    return this;
  }

  /**
   * 克隆向量
   * @returns 克隆结果
   */
  clone(): Vector2 {
    return Vector2.create(this.x, this.y);
  }

  /**
   * 根据下标设置元素值
   * @param index - 下标值
   * @param value - 数字
   * @returns 向量
   */
  setElement(index: number, value: number): this {
    if (index >= 0 && index <= 1) {
      this.elements[index] = value;
    } else {
      console.error('index is out of range: ' + index);
    }

    return this;
  }

  /**
   * 根据下标获取值
   * @param index - 下标
   * @returns 值
   */
  getElement(index: number): number {
    if (index >= 0 && index <= 1) {
      return this.elements[index];
    }
    console.error('index is out of range: ' + index);

    return 0;
  }

  /**
   * 向量相加（优化版本）
   * @param right - 向量 | 数字
   * @returns 向量
   */
  add(right: number | vec2 | Vector2): this {
    const e = this.elements;

    if (typeof right === 'number') {
      e[0] += right;
      e[1] += right;
    } else if (right instanceof Array) {
      e[0] += right[0];
      e[1] += right[1];
    } else {
      e[0] += right.x;
      e[1] += right.y;
    }

    return this;
  }

  /**
   * 向量相加
   * @param left - 向量
   * @param right - 向量
   * @returns 相加结果
   */
  addVectors(left: Vector2, right: Vector2): this {
    const e = this.elements;

    e[0] = left.x + right.x;
    e[1] = left.y + right.y;

    return this;
  }

  /**
   * 向量相减（优化版本）
   * @param right - 向量 |  数字
   * @returns 相减结果
   */
  subtract(right: number | vec2 | Vector2): this {
    const e = this.elements;

    if (typeof right === 'number') {
      e[0] -= right;
      e[1] -= right;
    } else if (right instanceof Array) {
      e[0] -= right[0];
      e[1] -= right[1];
    } else {
      e[0] -= right.x;
      e[1] -= right.y;
    }

    return this;
  }

  /**
   * 向量相减
   * @param left - 向量
   * @param right - 向量
   * @returns 相减结果
   */
  subtractVectors(left: Vector2, right: Vector2): this {
    const e = this.elements;

    e[0] = left.x - right.x;
    e[1] = left.y - right.y;

    return this;
  }

  /**
   * 向量相乘（优化版本）
   * @param right - 向量 | 数字
   * @returns 相乘结果
   */
  multiply(right: number | vec2 | Vector2): this {
    const e = this.elements;

    if (typeof right === 'number') {
      e[0] *= right;
      e[1] *= right;
    } else if (right instanceof Array) {
      e[0] *= right[0];
      e[1] *= right[1];
    } else {
      e[0] *= right.x;
      e[1] *= right.y;
    }

    return this;
  }

  /**
   * 向量相乘
   * @param left - 向量
   * @param right - 向量
   * @returns 相乘结果
   */
  multiplyVectors(left: Vector2, right: Vector2): this {
    const e = this.elements;

    e[0] = left.x * right.x;
    e[1] = left.y * right.y;

    return this;
  }

  /**
   * 向量相除（优化版本）
   * @param right - 向量 | 数字
   * @returns 相除结果
   */
  divide(right: number | vec2 | Vector2): this {
    const e = this.elements;

    if (typeof right === 'number') {
      if (Math.abs(right) < NumberEpsilon) {
        console.warn('Vector2.divide: scalar is too close to zero');
        return this;
      }
      const invRight = 1 / right;
      e[0] *= invRight;
      e[1] *= invRight;
    } else if (right instanceof Array) {
      e[0] /= right[0];
      e[1] /= right[1];
    } else {
      e[0] /= right.x;
      e[1] /= right.y;
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

    return this;
  }

  /**
   * 分量求和
   * @returns 求和结果
   */
  sum(): number {
    return this.x + this.y;
  }

  /**
   * 向量求最小值
   * @param v - 向量
   * @returns 最小值
   */
  min(v: Vector2 | number): this {
    const e = this.elements;

    if (typeof v === 'number') {
      e[0] = Math.min(e[0], v);
      e[1] = Math.min(e[1], v);
    } else {
      e[0] = Math.min(e[0], v.x);
      e[1] = Math.min(e[1], v.y);
    }

    return this;
  }

  /**
   * 向量求最大值
   * @param v - 向量
   * @returns 最大值
   */
  max(v: Vector2 | number): this {
    const e = this.elements;

    if (typeof v === 'number') {
      e[0] = Math.max(e[0], v);
      e[1] = Math.max(e[1], v);
    } else {
      e[0] = Math.max(e[0], v.x);
      e[1] = Math.max(e[1], v.y);
    }

    return this;
  }

  /**
   * 向量阈值约束
   * @param min - 极小值
   * @param max - 极大值
   * @returns 向量
   */
  clamp(min: Vector2 | number, max: Vector2 | number): this {
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

    return this;
  }

  /**
   * 向量取四舍五入
   * @returns 四舍五入结果
   */
  round(): this {
    const e = this.elements;
    e[0] = Math.round(e[0]);
    e[1] = Math.round(e[1]);

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

    return this;
  }

  /**
   * 向量长度
   * @returns 长度
   */
  length(): number {
    const e = this.elements;
    const x = e[0],
      y = e[1];
    return Math.sqrt(x * x + y * y);
  }

  /**
   * 向量长度平方
   * @returns 长度平方
   */
  lengthSquared(): number {
    const e = this.elements;
    const x = e[0],
      y = e[1];
    return x * x + y * y;
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
   * @param other - 向量
   * @param alpha - 插值因子
   * @returns 插值结果
   */
  lerp(other: Vector2, alpha: number): this {
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    const e = this.elements;

    e[0] += (other.x - e[0]) * clampedAlpha;
    e[1] += (other.y - e[1]) * clampedAlpha;

    return this;
  }

  /**
   * 两向量线性插值
   * @param v1 - 向量1
   * @param v2 - 向量2
   * @param alpha - 插值因子
   * @returns 插值结果
   */
  lerpVectors(v1: Vector2, v2: Vector2, alpha: number): this {
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    const e = this.elements;

    e[0] = v1.x + (v2.x - v1.x) * clampedAlpha;
    e[1] = v1.y + (v2.y - v1.y) * clampedAlpha;

    return this;
  }

  /**
   * 向量求点积
   * @param v - 向量
   * @returns 点积
   */
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * 向量求叉积
   * @param v - 向量
   * @returns 叉积
   */
  cross(v: Vector2): number {
    return this.x * v.y - this.y * v.x;
  }

  /**
   * 计算距离
   * @param v - 向量
   * @returns 距离
   */
  distance(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算距离平方
   * @param v - 向量
   * @returns 距离平方
   */
  distanceSquared(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  /**
   * 向量比较
   * @param v - 向量
   * @returns 是否相等
   */
  equals(v: Vector2): boolean {
    return Math.abs(this.x - v.x) < NumberEpsilon && Math.abs(this.y - v.y) < NumberEpsilon;
  }

  /**
   * 判断是否为零向量
   * @returns 是否为零向量
   */
  isZero(): boolean {
    return Math.abs(this.x) < NumberEpsilon && Math.abs(this.y) < NumberEpsilon;
  }

  /**
   * 转换为数组
   * @returns 数组
   */
  toArray(): [x: number, y: number] {
    return [this.x, this.y];
  }

  /**
   * 填充数组
   * @param array - 数组
   * @param offset - 偏移量，默认为0
   */
  fill(array: number[] | Float32Array, offset = 0) {
    array[offset] = this.x;
    array[offset + 1] = this.y;
  }

  /**
   * 设置随机值
   * @returns 向量
   */
  random(): this {
    const e = this.elements;
    e[0] = Math.random();
    e[1] = Math.random();

    return this;
  }

  /**
   * 返回归一化后的新向量
   * @returns 归一化后的新向量
   */
  normalized(): Vector2 {
    const len = this.length();
    if (len < NumberEpsilon) {
      return Vector2.create();
    }
    const scale = 1 / len;
    return Vector2.create(this.x * scale, this.y * scale);
  }

  /**
   * 向量乘以标量，返回新向量
   * @param scalar - 标量值
   * @returns 新向量
   */
  multiplyScalar(scalar: number): Vector2 {
    return Vector2.create(this.x * scalar, this.y * scalar);
  }

  /**
   * 向量除以标量，返回新向量
   * @param scalar - 标量值
   * @returns 新向量
   */
  divideScalar(scalar: number): Vector2 {
    if (Math.abs(scalar) < NumberEpsilon) {
      console.warn('Vector2.divideScalar: scalar is too close to zero');
      return Vector2.create();
    }
    const invScalar = 1 / scalar;
    return Vector2.create(this.x * invScalar, this.y * invScalar);
  }

  // ========== 静态方法 ==========

  /**
   * 通过数字创建向量
   * @param num - 数字
   * @returns 向量
   */
  static fromNumber(num: number): Vector2 {
    return Vector2.create(num, num);
  }

  /**
   * 通过数组创建向量
   * @param array - 数组
   * @param offset - 起始偏移值，默认为0
   * @returns 向量
   */
  static fromArray(array: Vector2DataType, offset = 0): Vector2 {
    return Vector2.create(array[offset] ?? 0, array[offset + 1] ?? 0);
  }

  /**
   * 计算两个向量的和，返回新向量
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 和向量 (a + b)
   */
  static add(a: Vector2, b: Vector2): Vector2 {
    return Vector2.create(a.x + b.x, a.y + b.y);
  }

  /**
   * 计算两个向量的差，返回新向量
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 差向量 (a - b)
   */
  static subtract(a: Vector2, b: Vector2): Vector2 {
    return Vector2.create(a.x - b.x, a.y - b.y);
  }

  /**
   * 计算两个向量的乘积，返回新向量
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 乘积向量 (a * b)
   */
  static multiply(a: Vector2, b: Vector2): Vector2 {
    return Vector2.create(a.x * b.x, a.y * b.y);
  }

  /**
   * 计算两个向量的点积
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 点积值
   */
  static dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  }

  /**
   * 计算两个向量的叉积
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 叉积值
   */
  static cross(a: Vector2, b: Vector2): number {
    return a.x * b.y - a.y * b.x;
  }

  /**
   * 计算两个向量之间的距离
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 距离值
   */
  static distance(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算两个向量之间的距离平方
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 距离平方值
   */
  static distanceSquared(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  /**
   * 在两个向量之间进行线性插值
   * @param a - 起始向量
   * @param b - 目标向量
   * @param t - 插值参数 [0, 1]
   * @returns 插值结果向量
   */
  static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    const clampedT = Math.max(0, Math.min(1, t));
    return Vector2.create(a.x + (b.x - a.x) * clampedT, a.y + (b.y - a.y) * clampedT);
  }

  /**
   * 检查向量是否为有效值
   * @param v - 向量
   * @returns 是否有效
   */
  static isValid(v: Vector2): boolean {
    return !isNaN(v.x) && !isNaN(v.y) && isFinite(v.x) && isFinite(v.y);
  }

  /**
   * 计算向量的反射
   * @param incident - 入射向量
   * @param normal - 法向量（必须是单位向量）
   * @returns 反射向量
   */
  static reflect(incident: Vector2, normal: Vector2): Vector2 {
    const dot = Vector2.dot(incident, normal);
    return Vector2.create(incident.x - 2 * dot * normal.x, incident.y - 2 * dot * normal.y);
  }

  /**
   * 获取向量的最小分量值
   * @param v - 向量
   * @returns 最小分量值
   */
  static minComponent(v: Vector2): number {
    return Math.min(v.x, v.y);
  }

  /**
   * 获取向量的最大分量值
   * @param v - 向量
   * @returns 最大分量值
   */
  static maxComponent(v: Vector2): number {
    return Math.max(v.x, v.y);
  }

  /**
   * 生成随机单位向量
   * @returns 随机单位向量
   */
  static randomUnit(): Vector2 {
    const angle = Math.random() * Math.PI * 2;
    return Vector2.create(Math.cos(angle), Math.sin(angle));
  }

  /**
   * 从角度创建单位向量
   * @param angle - 角度（弧度）
   * @returns 单位向量
   */
  static fromAngle(angle: number): Vector2 {
    return Vector2.create(Math.cos(angle), Math.sin(angle));
  }

  /**
   * 计算向量的角度
   * @param v - 向量
   * @returns 角度（弧度）
   */
  static angle(v: Vector2): number {
    return Math.atan2(v.y, v.x);
  }

  /**
   * 计算两个向量之间的角度
   * @param a - 第一个向量
   * @param b - 第二个向量
   * @returns 角度（弧度）
   */
  static angleBetween(a: Vector2, b: Vector2): number {
    const dot = Vector2.dot(a.normalized(), b.normalized());
    return Math.acos(Math.max(-1, Math.min(1, dot)));
  }
}
