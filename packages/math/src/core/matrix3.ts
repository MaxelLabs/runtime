import { UsdDataType } from '@maxellabs/specification';
import type { mat3, Matrix3DataType, Matrix3Like, UsdValue } from '@maxellabs/specification';
import type { Matrix4 } from './matrix4';
import type { Quaternion } from './quaternion';
import { isEqual } from './utils';
import type { Vector3 } from './vector3';
import { MathConfig } from '../config/mathConfig';
import { ObjectPool, type Poolable } from '../pool/objectPool';

// 高性能对象池实现
const matrix3Pool = new ObjectPool<Matrix3>(() => new Matrix3(), MathConfig.getPoolConfig().Matrix3);

/**
 * 三维矩阵（列优先矩阵）
 * 实现 @specification 包的 IMatrix3x3 接口，提供高性能的3x3矩阵运算
 */
export class Matrix3 implements Matrix3Like, Poolable {
  static readonly IDENTITY = Object.freeze(new Matrix3(1, 0, 0, 0, 1, 0, 0, 0, 1));
  static readonly ZERO = Object.freeze(new Matrix3(0, 0, 0, 0, 0, 0, 0, 0, 0));

  /**
   * 矩阵值数组 - 使用 TypedArray 提高性能
   */
  elements: Float32Array;

  /**
   * 构造函数，初始值为单位矩阵
   * @param m11 - 第 1 行，第 1 列，默认为1
   * @param m21 - 第 2 行，第 1 列，默认为0
   * @param m31 - 第 3 行，第 1 列，默认为0
   * @param m12 - 第 1 行，第 2 列，默认为0
   * @param m22 - 第 2 行，第 2 列，默认为1
   * @param m32 - 第 3 行，第 2 列，默认为0
   * @param m13 - 第 1 行，第 3 列，默认为0
   * @param m23 - 第 2 行，第 3 列，默认为0
   * @param m33 - 第 3 行，第 3 列，默认为1
   */
  constructor(m11 = 1, m21 = 0, m31 = 0, m12 = 0, m22 = 1, m32 = 0, m13 = 0, m23 = 0, m33 = 1) {
    this.elements = new Float32Array([m11, m21, m31, m12, m22, m32, m13, m23, m33]);
  }
  m13: number;
  m23: number;
  m31: number;
  m32: number;
  m33: number;

  /**
   * 重置对象状态（对象池接口）
   */
  reset(): void {
    this.elements.set([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  }

  /**
   * 检查对象是否可池化（对象池接口）
   */
  isPoolable(): boolean {
    return true;
  }

  // ========== IMatrix3x3 接口属性 ==========

  get m00(): number {
    return this.elements[0];
  }
  set m00(value: number) {
    this.elements[0] = value;
  }

  get m01(): number {
    return this.elements[3];
  }
  set m01(value: number) {
    this.elements[3] = value;
  }

  get m02(): number {
    return this.elements[6];
  }
  set m02(value: number) {
    this.elements[6] = value;
  }

  get m10(): number {
    return this.elements[1];
  }
  set m10(value: number) {
    this.elements[1] = value;
  }

  get m11(): number {
    return this.elements[4];
  }
  set m11(value: number) {
    this.elements[4] = value;
  }

  get m12(): number {
    return this.elements[7];
  }
  set m12(value: number) {
    this.elements[7] = value;
  }

  get m20(): number {
    return this.elements[2];
  }
  set m20(value: number) {
    this.elements[2] = value;
  }

  get m21(): number {
    return this.elements[5];
  }
  set m21(value: number) {
    this.elements[5] = value;
  }

  get m22(): number {
    return this.elements[8];
  }
  set m22(value: number) {
    this.elements[8] = value;
  }

  // ========== 规范兼容方法 ==========

  /**
   * 转换为IMatrix3x3接口格式
   * @returns IMatrix3x3接口对象
   */
  toIMatrix3x3(): Matrix3Like {
    return {
      m00: this.m00,
      m01: this.m01,
      m02: this.m02,
      m10: this.m10,
      m11: this.m11,
      m12: this.m12,
      m20: this.m20,
      m21: this.m21,
      m22: this.m22,
    };
  }

  /**
   * 从IMatrix3x3接口创建Matrix3实例
   * @param m - IMatrix3x3接口对象
   * @returns Matrix3实例
   */
  static fromIMatrix3x3(m: Matrix3Like): Matrix3 {
    return new Matrix3(m.m00, m.m10, m.m20, m.m01, m.m11, m.m21, m.m02, m.m12, m.m22);
  }

  /**
   * 从IMatrix3x3接口设置当前矩阵值
   * @param m - IMatrix3x3接口对象
   * @returns 返回自身，用于链式调用
   */
  fromIMatrix3x3(m: Matrix3Like): this {
    return this.set(m.m00, m.m10, m.m20, m.m01, m.m11, m.m21, m.m02, m.m12, m.m22);
  }

  // ========== USD 兼容方法 ==========

  /**
   * 转换为USD兼容的UsdValue格式（Array）
   * @returns UsdValue对象格式
   */
  toUsdValue(): UsdValue {
    return {
      type: UsdDataType.Array,
      value: Array.from(this.elements),
    };
  }

  /**
   * 从USD兼容的UsdValue格式创建Matrix3实例
   * @param value - UsdValue对象格式
   * @returns Matrix3实例
   */
  static fromUsdValue(value: UsdValue): Matrix3 {
    if (!value.value || !Array.isArray(value.value) || value.value.length < 9) {
      throw new Error('Invalid UsdValue for Matrix3: must have array value with at least 9 elements');
    }
    const elements = value.value as number[];
    return new Matrix3(
      elements[0],
      elements[1],
      elements[2],
      elements[3],
      elements[4],
      elements[5],
      elements[6],
      elements[7],
      elements[8]
    );
  }

  /**
   * 从USD兼容的UsdValue格式设置当前矩阵值
   * @param value - UsdValue对象格式
   * @returns 返回自身，用于链式调用
   */
  fromUsdValue(value: UsdValue): this {
    if (!value.value || !Array.isArray(value.value) || value.value.length < 9) {
      throw new Error('Invalid UsdValue for Matrix3: must have array value with at least 9 elements');
    }
    const elements = value.value as number[];
    this.elements.set(elements.slice(0, 9));
    return this;
  }

  // ========== 高性能对象池方法 ==========

  /**
   * 从对象池创建Matrix3实例（高性能）
   * @param m11 - 第 1 行，第 1 列，默认为1
   * @param m21 - 第 2 行，第 1 列，默认为0
   * @param m31 - 第 3 行，第 1 列，默认为0
   * @param m12 - 第 1 行，第 2 列，默认为0
   * @param m22 - 第 2 行，第 2 列，默认为1
   * @param m32 - 第 3 行，第 2 列，默认为0
   * @param m13 - 第 1 行，第 3 列，默认为0
   * @param m23 - 第 2 行，第 3 列，默认为0
   * @param m33 - 第 3 行，第 3 列，默认为1
   * @returns Matrix3实例
   */
  static create(m11 = 1, m21 = 0, m31 = 0, m12 = 0, m22 = 1, m32 = 0, m13 = 0, m23 = 0, m33 = 1): Matrix3 {
    if (MathConfig.isObjectPoolEnabled()) {
      const instance = matrix3Pool.create();
      instance.set(m11, m21, m31, m12, m22, m32, m13, m23, m33);
      return instance;
    }
    return new Matrix3(m11, m21, m31, m12, m22, m32, m13, m23, m33);
  }

  /**
   * 释放Matrix3实例到对象池（高性能）
   * @param matrix - 要释放的矩阵实例
   */
  static release(matrix: Matrix3): void {
    if (MathConfig.isObjectPoolEnabled() && matrix) {
      matrix3Pool.release(matrix);
    }
  }

  /**
   * 预分配指定数量的Matrix3实例到对象池
   * @param count - 预分配数量
   */
  static preallocate(count: number): void {
    if (MathConfig.isObjectPoolEnabled()) {
      matrix3Pool.preallocate(count);
    }
  }

  /**
   * 清空对象池
   */
  static clearPool(): void {
    matrix3Pool.clear();
  }

  /**
   * 获取对象池统计信息
   */
  static getPoolStats() {
    return matrix3Pool.getStats();
  }

  /**
   * 设置矩阵
   * @param m11 - 第 1 行，第 1 列
   * @param m21 - 第 2 行，第 1 列
   * @param m31 - 第 3 行，第 1 列
   * @param m12 - 第 1 行，第 2 列
   * @param m22 - 第 2 行，第 2 列
   * @param m32 - 第 3 行，第 2 列
   * @param m13 - 第 1 行，第 3 列
   * @param m23 - 第 2 行，第 3 列
   * @param m33 - 第 3 行，第 3 列
   * @returns
   */
  set(
    m11: number,
    m21: number,
    m31: number,
    m12: number,
    m22: number,
    m32: number,
    m13: number,
    m23: number,
    m33: number
  ): this {
    const e = this.elements;

    e[0] = m11;
    e[3] = m12;
    e[6] = m13;
    e[1] = m21;
    e[4] = m22;
    e[7] = m23;
    e[2] = m31;
    e[5] = m32;
    e[8] = m33;

    return this;
  }

  /**
   * 设置矩阵通过行优先数据
   * @param m11 - 第 1 行，第 1 列
   * @param m12 - 第 1 行，第 2 列
   * @param m13 - 第 1 行，第 3 列
   * @param m21 - 第 2 行，第 1 列
   * @param m22 - 第 2 行，第 2 列
   * @param m23 - 第 2 行，第 3 列
   * @param m31 - 第 3 行，第 1 列
   * @param m32 - 第 3 行，第 2 列
   * @param m33 - 第 3 行，第 3 列
   * @returns 矩阵
   */
  setFromRowMajorData(
    m11: number,
    m12: number,
    m13: number,
    m21: number,
    m22: number,
    m23: number,
    m31: number,
    m32: number,
    m33: number
  ): this {
    const e = this.elements;

    e[0] = m11;
    e[3] = m12;
    e[6] = m13;
    e[1] = m21;
    e[4] = m22;
    e[7] = m23;
    e[2] = m31;
    e[5] = m32;
    e[8] = m33;

    return this;
  }

  /**
   * 通过列向量设置矩阵
   * @param c1 - 第一列
   * @param c2 - 第二列
   * @param c3 - 第三列
   * @returns 矩阵
   */
  setFromColumnVectors(c1: Vector3, c2: Vector3, c3: Vector3): this {
    return this.set(c1.x, c1.y, c1.z, c2.x, c2.y, c2.z, c3.x, c3.y, c3.z);
  }

  /**
   * 通过四阶矩阵设置三阶矩阵
   * @param m - 四阶矩阵
   * @returns 矩阵
   */
  setFromMatrix4(m: Matrix4): this {
    const me = m.getElements();

    return this.set(me[0], me[1], me[2], me[4], me[5], me[6], me[8], me[9], me[10]);
  }

  /**
   * 通过数组设置矩阵
   * @param array - 数组
   * @param [offset=0] - 起始偏移值
   * @returns 矩阵
   */
  setFromArray(array: Matrix3DataType, offset = 0): this {
    if (array instanceof Float32Array && offset === 0) {
      this.elements.set(array.subarray(0, 9));
    } else {
      for (let i = 0; i < 9; i++) {
        this.elements[i] = array[offset + i];
      }
    }

    return this;
  }

  /**
   * 通过四元数设置矩阵
   * @param quat - 四元数
   * @returns 矩阵
   */
  setFromQuaternion(quat: Quaternion): this {
    const { x, y, z, w } = quat;
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const xy = x * y2;
    const xz = x * z2;
    const yy = y * y2;
    const yz = y * z2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;

    const te = this.elements;

    te[0] = 1 - (yy + zz);
    te[1] = xy + wz;
    te[2] = xz - wy;
    te[3] = xy - wz;
    te[4] = 1 - (xx + zz);
    te[5] = yz + wx;
    te[6] = xz + wy;
    te[7] = yz - wx;
    te[8] = 1 - (xx + yy);

    return this;
  }

  /**
   * 矩阵清零
   * @returns 零矩阵
   */
  setZero(): this {
    const e = this.elements;

    e.fill(0);

    return this;
  }

  /**
   * 矩阵单位化
   * @returns 单位矩阵
   */
  identity(): this {
    return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  /**
   * 矩阵克隆，使用对象池
   * @returns 克隆结果
   */
  clone(): Matrix3 {
    return Matrix3.create().copyFrom(this);
  }

  /**
   * 矩阵复制
   * @param m - 复制对象
   * @returns 复制结果
   */
  copyFrom(m: Matrix3): this {
    this.elements.set(m.elements);

    return this;
  }

  /**
   * 得到列向量
   * @param i - 列向量索引，从 0 开始
   * @returns 列向量
   */
  getColumnVector(i: number, v: Vector3): Vector3 {
    const e = this.elements;

    return v.set(e[i * 3], e[i * 3 + 1], e[i * 3 + 2]);
  }

  /**
   * 矩阵缩放
   * @param sx - x 轴缩放分量
   * @param sy - y 轴缩放分量
   * @returns 缩放结果
   */
  scale(sx: number, sy: number): this {
    const e = this.elements;

    e[0] *= sx;
    e[3] *= sx;
    e[6] *= sx;
    e[1] *= sy;
    e[4] *= sy;
    e[7] *= sy;

    return this;
  }

  /**
   * 矩阵旋转
   * @param theta - 旋转角度（弧度）
   * @returns 旋转结果
   */
  rotate(theta: number): this {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const e = this.elements;

    const m11 = e[0],
      m12 = e[3],
      m13 = e[6];
    const m21 = e[1],
      m22 = e[4],
      m23 = e[7];

    e[0] = c * m11 + s * m21;
    e[3] = c * m12 + s * m22;
    e[6] = c * m13 + s * m23;

    e[1] = -s * m11 + c * m21;
    e[4] = -s * m12 + c * m22;
    e[7] = -s * m13 + c * m23;

    return this;
  }

  /**
   * 矩阵平移
   * @param x - x 轴平移分量
   * @param y - y 轴平移分量
   * @returns 平移结果
   */
  translate(x: number, y: number): this {
    const e = this.elements;

    e[0] += x * e[2];
    e[3] += x * e[5];
    e[6] += x * e[8];
    e[1] += y * e[2];
    e[4] += y * e[5];
    e[7] += y * e[8];

    return this;
  }

  /**
   * 矩阵右乘
   * @param right - 相乘矩阵
   * @returns 右乘结果
   */
  multiply(right: Matrix3 | number): this {
    if (typeof right === 'number') {
      const e = this.elements;

      for (let i = 0; i < 9; i++) {
        e[i] *= right;
      }

      return this;
    } else {
      return this.multiplyMatrices(this, right);
    }
  }

  /**
   * 矩阵左乘
   * @param left - 相乘矩阵
   * @returns 左乘结果
   */
  premultiply(left: Matrix3): this {
    return this.multiplyMatrices(left, this);
  }

  /**
   * 矩阵乘法
   * @param left - 矩阵
   * @param right - 矩阵
   * @returns 相乘结果
   */
  multiplyMatrices(left: Matrix3, right: Matrix3): this {
    const ae = left.elements;
    const be = right.elements;
    const te = this.elements;

    const a11 = ae[0],
      a12 = ae[3],
      a13 = ae[6];
    const a21 = ae[1],
      a22 = ae[4],
      a23 = ae[7];
    const a31 = ae[2],
      a32 = ae[5],
      a33 = ae[8];

    const b11 = be[0],
      b12 = be[3],
      b13 = be[6];
    const b21 = be[1],
      b22 = be[4],
      b23 = be[7];
    const b31 = be[2],
      b32 = be[5],
      b33 = be[8];

    te[0] = a11 * b11 + a12 * b21 + a13 * b31;
    te[3] = a11 * b12 + a12 * b22 + a13 * b32;
    te[6] = a11 * b13 + a12 * b23 + a13 * b33;

    te[1] = a21 * b11 + a22 * b21 + a23 * b31;
    te[4] = a21 * b12 + a22 * b22 + a23 * b32;
    te[7] = a21 * b13 + a22 * b23 + a23 * b33;

    te[2] = a31 * b11 + a32 * b21 + a33 * b31;
    te[5] = a31 * b12 + a32 * b22 + a33 * b32;
    te[8] = a31 * b13 + a32 * b23 + a33 * b33;

    return this;
  }

  /**
   * 矩阵求行列式值
   * @returns 行列式结果
   */
  determinant(): number {
    const e = this.elements;
    const m11 = e[0],
      m21 = e[3],
      m31 = e[6];
    const m12 = e[1],
      m22 = e[4],
      m32 = e[7];
    const m13 = e[2],
      m23 = e[5],
      m33 = e[8];

    return m11 * (m22 * m33 - m23 * m32) + m12 * (m23 * m31 - m21 * m33) + m13 * (m21 * m32 - m22 * m31);
  }

  /**
   * 矩阵求逆
   * @returns 逆矩阵
   */
  invert(): this {
    const e = this.elements;
    const m11 = e[0],
      m12 = e[3],
      m13 = e[6];
    const m21 = e[1],
      m22 = e[4],
      m23 = e[7];
    const m31 = e[2],
      m32 = e[5],
      m33 = e[8];
    const t11 = m33 * m22 - m32 * m23;
    const t12 = m32 * m13 - m33 * m12;
    const t13 = m23 * m12 - m22 * m13;
    const det = m11 * t11 + m21 * t12 + m31 * t13;

    if (Math.abs(det) < 1e-8) {
      return this.setZero();
    }

    const detInv = 1 / det;

    e[0] = t11 * detInv;
    e[1] = (m31 * m23 - m33 * m21) * detInv;
    e[2] = (m32 * m21 - m31 * m22) * detInv;

    e[3] = t12 * detInv;
    e[4] = (m33 * m11 - m31 * m13) * detInv;
    e[5] = (m31 * m12 - m32 * m11) * detInv;

    e[6] = t13 * detInv;
    e[7] = (m21 * m13 - m23 * m11) * detInv;
    e[8] = (m22 * m11 - m21 * m12) * detInv;

    return this;
  }

  /**
   * 矩阵转置
   * @returns 转置结果
   */
  transpose(): this {
    let t: number;
    const e = this.elements;

    t = e[1];
    e[1] = e[3];
    e[3] = t;
    t = e[2];
    e[2] = e[6];
    e[6] = t;
    t = e[5];
    e[5] = e[7];
    e[7] = t;

    return this;
  }

  /**
   * 对点进行矩阵变换
   * @param v - 输入点
   * @param out - 输出点，如果没有会覆盖输入的数据
   * @returns 变换后的结果
   */
  transformPoint(v: Vector3, out?: Vector3): Vector3 {
    const { x, y, z } = v;
    const e = this.elements;

    const res = out ?? v;

    res.x = e[0] * x + e[3] * y + e[6] * z;
    res.y = e[1] * x + e[4] * y + e[7] * z;
    res.z = e[2] * x + e[5] * y + e[8] * z;

    return res;
  }

  /**
   * 对法向量进行矩阵变换
   * @param v - 输入向量
   * @param out - 输出向量，如果没有会覆盖输入的数据
   * @returns 变换后的结果
   */
  transformNormal(v: Vector3, out?: Vector3): Vector3 {
    return this.transformPoint(v, out).normalize();
  }

  /**
   * 矩阵判等
   * @param matrix - 矩阵
   * @returns 判等结果
   */
  equals(matrix: Matrix3): boolean {
    const te = this.elements;
    const me = matrix.elements;

    for (let i = 0; i < 9; i++) {
      if (!isEqual(te[i], me[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * 矩阵转为数组
   * @returns
   */
  toArray(): mat3 {
    return Array.from(this.elements) as mat3;
  }

  /**
   * 将矩阵数据填充到目标数组
   * @param array 目标数组
   * @param offset 偏移值
   */
  fillArray(array: number[] | Float32Array, offset = 0) {
    const e = this.elements;

    if (array instanceof Float32Array && offset === 0 && array.length >= 9) {
      // 对于 Float32Array，我们可以直接使用 set 方法
      array.set(e);
    } else {
      // 手动复制
      array[offset] = e[0];
      array[offset + 1] = e[1];
      array[offset + 2] = e[2];
      array[offset + 3] = e[3];
      array[offset + 4] = e[4];
      array[offset + 5] = e[5];
      array[offset + 6] = e[6];
      array[offset + 7] = e[7];
      array[offset + 8] = e[8];
    }
  }

  // ========== 静态工厂方法 ==========

  /**
   * 创建单位矩阵
   * @returns 单位矩阵
   */
  static fromIdentity(): Matrix3 {
    return Matrix3.create();
  }

  /**
   * 通过列向量创建矩阵
   * @param c1 - 第一列
   * @param c2 - 第二列
   * @param c3 - 第三列
   * @returns 矩阵
   */
  static fromColumnVectors(c1: Vector3, c2: Vector3, c3: Vector3): Matrix3 {
    return Matrix3.create().setFromColumnVectors(c1, c2, c3);
  }

  /**
   * 通过四阶矩阵创建矩阵（获取空间变换矩阵旋转缩放部分）
   * @param m - 四阶矩阵
   * @returns 矩阵
   */
  static fromMatrix4(m: Matrix4): Matrix3 {
    return Matrix3.create().setFromMatrix4(m);
  }

  /**
   * 通过数组创建矩阵
   * @param array - 数组（列优先）
   * @param offset - 起始偏移值，默认为0
   * @returns 矩阵
   */
  static fromArray(array: Matrix3DataType, offset = 0): Matrix3 {
    return Matrix3.create().setFromArray(array, offset);
  }

  /**
   * 通过四元数创建矩阵
   * @param quat - 四元数
   * @returns 矩阵
   */
  static fromQuaternion(quat: Quaternion): Matrix3 {
    return Matrix3.create().setFromQuaternion(quat);
  }

  /**
   * 通过行优先数据创建矩阵
   * @param m11 - 第 1 行，第 1 列
   * @param m12 - 第 1 行，第 2 列
   * @param m13 - 第 1 行，第 3 列
   * @param m21 - 第 2 行，第 1 列
   * @param m22 - 第 2 行，第 2 列
   * @param m23 - 第 2 行，第 3 列
   * @param m31 - 第 3 行，第 1 列
   * @param m32 - 第 3 行，第 2 列
   * @param m33 - 第 3 行，第 3 列
   * @returns 矩阵
   */
  static fromRowMajorData(
    m11: number,
    m12: number,
    m13: number,
    m21: number,
    m22: number,
    m23: number,
    m31: number,
    m32: number,
    m33: number
  ): Matrix3 {
    return Matrix3.create().set(m11, m21, m31, m12, m22, m32, m13, m23, m33);
  }

  /**
   * 矩阵相乘
   * @param a - 左矩阵
   * @param b - 右矩阵
   * @returns 相乘结果
   */
  static multiply(a: Matrix3, b: Matrix3): Matrix3 {
    const result = Matrix3.create();
    return result.multiplyMatrices(a, b);
  }

  /**
   * 矩阵转置
   * @param m - 输入矩阵
   * @returns 转置结果
   */
  static transpose(m: Matrix3): Matrix3 {
    const result = Matrix3.create();
    return result.copyFrom(m).transpose();
  }

  /**
   * 矩阵求逆
   * @param m - 输入矩阵
   * @returns 逆矩阵
   */
  static invert(m: Matrix3): Matrix3 {
    const result = Matrix3.create();
    return result.copyFrom(m).invert();
  }

  /**
   * 检查矩阵是否为有效值
   * @param m - 矩阵
   * @returns 是否有效
   */
  static isValid(m: Matrix3): boolean {
    const e = m.elements;
    for (let i = 0; i < 9; i++) {
      if (isNaN(e[i]) || !isFinite(e[i])) {
        return false;
      }
    }
    return true;
  }
}
