import { UsdDataType, type IQuaternion } from '@maxellabs/specification';
import type { UsdValue } from '@maxellabs/specification';
import type { Euler } from './euler';
import { Matrix4 } from './matrix4';
import { clamp } from './utils';
import { Vector3 } from './vector3';
import type { Vector4 } from './vector4';
import type { Vector4Like } from './type';
import { MathConfig } from '../config/mathConfig';
import { ObjectPool, type Poolable } from '../pool/objectPool';

// 高性能对象池实现
const quaternionPool = new ObjectPool<Quaternion>(() => new Quaternion(), MathConfig.getPoolConfig().Quaternion);

/**
 * 四元数
 * 实现 @specification 包的 IQuaternion 接口，提供高性能的四元数运算
 */
export class Quaternion implements IQuaternion, Poolable {
  /**
   * 四元数常量
   */
  static readonly IDENTITY = Object.freeze(new Quaternion(0, 0, 0, 1));

  /**
   * 四元数相乘，返回一个新的四元数
   * @param a - 四元数 a
   * @param b - 四元数 b
   * @returns 相乘结果
   */
  static multiply(a: Quaternion, b: Quaternion): Quaternion {
    const ax = a.x,
      ay = a.y,
      az = a.z,
      aw = a.w;
    const bx = b.x,
      by = b.y,
      bz = b.z,
      bw = b.w;

    const result = Quaternion.create();

    result.x = ax * bw + aw * bx + ay * bz - az * by;
    result.y = ay * bw + aw * by + az * bx - ax * bz;
    result.z = az * bw + aw * bz + ax * by - ay * bx;
    result.w = aw * bw - ax * bx - ay * by - az * bz;

    return result;
  }

  /**
   * 返回一个四元数的逆
   * @param q - 四元数
   * @returns 逆四元数
   */
  static invert(q: Quaternion): Quaternion {
    const result = q.clone();

    return result.invert();
  }

  static fromMatrix(rotationMatrix: Matrix4): Quaternion {
    const quaternion = Quaternion.create();

    quaternion.setFromRotationMatrix(rotationMatrix);
    quaternion.normalize();

    return quaternion;
  }

  private static readonly tempVec0: Vector3 = new Vector3();

  // 使用内存对齐的TypedArray，提高SIMD性能
  private elements: Float32Array;

  /**
   * 构造函数
   * @param x - x分量，默认为0
   * @param y - y分量，默认为0
   * @param z - z分量，默认为0
   * @param w - w分量，默认为1
   */
  constructor(x = 0, y = 0, z = 0, w = 1) {
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
    this.elements[3] = 1;
  }

  /**
   * 检查对象是否可池化（对象池接口）
   */
  isPoolable(): boolean {
    return true;
  }

  /**
   * x坐标访问器（IQuaternion接口）
   */
  get x(): number {
    return this.elements[0];
  }

  set x(value: number) {
    this.elements[0] = value;
  }

  /**
   * y坐标访问器（IQuaternion接口）
   */
  get y(): number {
    return this.elements[1];
  }

  set y(value: number) {
    this.elements[1] = value;
  }

  /**
   * z坐标访问器（IQuaternion接口）
   */
  get z(): number {
    return this.elements[2];
  }

  set z(value: number) {
    this.elements[2] = value;
  }

  /**
   * w坐标访问器（IQuaternion接口）
   */
  get w(): number {
    return this.elements[3];
  }

  set w(value: number) {
    this.elements[3] = value;
  }

  // ========== 规范兼容方法 ==========

  /**
   * 转换为IQuaternion接口格式
   * @returns IQuaternion接口对象
   */
  toIQuaternion(): IQuaternion {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
      w: this.w,
    };
  }

  /**
   * 从IQuaternion接口创建Quaternion实例
   * @param q - IQuaternion接口对象
   * @returns Quaternion实例
   */
  static fromIQuaternion(q: IQuaternion): Quaternion {
    return new Quaternion(q.x, q.y, q.z, q.w);
  }

  /**
   * 从IQuaternion接口设置当前四元数值
   * @param q - IQuaternion接口对象
   * @returns 返回自身，用于链式调用
   */
  fromIQuaternion(q: IQuaternion): this {
    this.elements[0] = q.x;
    this.elements[1] = q.y;
    this.elements[2] = q.z;
    this.elements[3] = q.w;
    return this;
  }

  // ========== USD 兼容方法 ==========

  /**
   * 转换为USD兼容的UsdValue格式（Quaternionf）
   * @returns UsdValue对象格式
   */
  toUsdValue(): UsdValue {
    return {
      type: UsdDataType.Quatf,
      value: [this.x, this.y, this.z, this.w],
    };
  }

  /**
   * 从USD兼容的UsdValue格式创建Quaternion实例
   * @param value - UsdValue对象格式
   * @returns Quaternion实例
   */
  static fromUsdValue(value: UsdValue): Quaternion {
    if (!value.value || !Array.isArray(value.value) || value.value.length < 4) {
      throw new Error('Invalid UsdValue for Quaternion: must have array value with at least 4 elements');
    }
    const [x, y, z, w] = value.value as [number, number, number, number];
    return new Quaternion(x, y, z, w);
  }

  /**
   * 从USD兼容的UsdValue格式设置当前四元数值
   * @param value - UsdValue对象格式
   * @returns 返回自身，用于链式调用
   */
  fromUsdValue(value: UsdValue): this {
    if (!value.value || !Array.isArray(value.value) || value.value.length < 4) {
      throw new Error('Invalid UsdValue for Quaternion: must have array value with at least 4 elements');
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
   * 从对象池创建Quaternion实例（高性能）
   * @param x - x分量，默认为0
   * @param y - y分量，默认为0
   * @param z - z分量，默认为0
   * @param w - w分量，默认为1
   * @returns Quaternion实例
   */
  static create(x = 0, y = 0, z = 0, w = 1): Quaternion {
    if (MathConfig.isObjectPoolEnabled()) {
      const instance = quaternionPool.create();
      instance.set(x, y, z, w);
      return instance;
    }
    return new Quaternion(x, y, z, w);
  }

  /**
   * 释放Quaternion实例到对象池（高性能）
   * @param quaternion - 要释放的四元数实例
   */
  static release(quaternion: Quaternion): void {
    if (MathConfig.isObjectPoolEnabled() && quaternion) {
      quaternionPool.release(quaternion);
    }
  }

  /**
   * 预分配指定数量的Quaternion实例到对象池
   * @param count - 预分配数量
   */
  static preallocate(count: number): void {
    if (MathConfig.isObjectPoolEnabled()) {
      quaternionPool.preallocate(count);
    }
  }

  /**
   * 清空对象池
   */
  static clearPool(): void {
    quaternionPool.clear();
  }

  /**
   * 获取对象池统计信息
   */
  static getPoolStats() {
    return quaternionPool.getStats();
  }

  /**
   * 四元数设置
   * @param x - x 分量
   * @param y - y 分量
   * @param z - z 分量
   * @param w - w 分量
   * @returns 四元数
   */
  set(x: number, y: number, z: number, w: number): this {
    this.elements[0] = x;
    this.elements[1] = y;
    this.elements[2] = z;
    this.elements[3] = w;

    return this;
  }

  /**
   * 根据方向向量和上向量设置四元数
   * @param direction 前方向向量
   * @param upVector 上方向向量
   * @returns 返回自身，用于链式调用
   */
  setFromDirection(direction: Vector3, upVector: Vector3): this {
    // 正规化方向向量
    const normalizedDirection = Vector3.ZERO.copyFrom(direction).normalize();

    // 如果方向向量接近零向量，则返回单位四元数
    if (normalizedDirection.lengthSquared() < 0.0001) {
      return this.identity();
    }

    // 计算右向量（确保垂直于上向量和方向向量）
    const right = Vector3.cross(upVector, normalizedDirection).normalize();

    // 如果右向量接近零向量（上向量和方向向量平行），使用一个后备方案
    if (right.lengthSquared() < 0.0001) {
      // 选择一个不与方向向量平行的轴
      const fallbackUp = Math.abs(normalizedDirection.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);

      right.copyFrom(Vector3.cross(fallbackUp, normalizedDirection)).normalize();
    }

    // 重新计算上向量以确保三个向量相互垂直
    const correctedUp = Vector3.cross(normalizedDirection, right).normalize();

    // 从这三个方向向量构建旋转矩阵
    const lookMatrix = new Matrix4();

    lookMatrix.set(
      right.x,
      right.y,
      right.z,
      0,
      correctedUp.x,
      correctedUp.y,
      correctedUp.z,
      0,
      normalizedDirection.x,
      normalizedDirection.y,
      normalizedDirection.z,
      0,
      0,
      0,
      0,
      1
    );

    // 从旋转矩阵设置四元数
    return this.setFromRotationMatrix(lookMatrix);
  }

  /**
   * 从欧拉角设置四元数
   * @param x 绕X轴的旋转角度（弧度）
   * @param y 绕Y轴的旋转角度（弧度）
   * @param z 绕Z轴的旋转角度（弧度）
   * @returns 当前四元数
   */
  setFromEuler(x: number, y: number, z: number): Quaternion {
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);

    this.elements[0] = s1 * c2 * c3 + c1 * s2 * s3;
    this.elements[1] = c1 * s2 * c3 - s1 * c2 * s3;
    this.elements[2] = c1 * c2 * s3 + s1 * s2 * c3;
    this.elements[3] = c1 * c2 * c3 - s1 * s2 * s3;

    return this.normalize();
  }

  /**
   * 通过旋转轴和旋转角度设置四元数
   * @param axis - 旋转轴
   * @param angle - 旋转角度（弧度）
   * @returns
   */
  setFromAxisAngle(axis: Vector3, angle: number): this {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    const v = Quaternion.tempVec0;

    v.copyFrom(axis).normalize();
    this.elements[0] = v.x * s;
    this.elements[1] = v.y * s;
    this.elements[2] = v.z * s;
    this.elements[3] = Math.cos(halfAngle);

    return this;
  }

  /**
   * 通过Vector4设置四元数
   * @param v - Vector4对象
   * @returns 四元数
   */
  setFromVector4(v: Vector4Like): this {
    this.elements[0] = v.x;
    this.elements[1] = v.y;
    this.elements[2] = v.z;
    this.elements[3] = v.w;

    return this;
  }

  /**
   * 通过数组设置四元数
   * @param array - 数组
   * @param offset - 起始偏移值，默认为0
   * @returns 四元数
   */
  setFromArray(array: number[], offset = 0): this {
    this.elements[0] = array[offset] ?? 0;
    this.elements[1] = array[offset + 1] ?? 0;
    this.elements[2] = array[offset + 2] ?? 0;
    this.elements[3] = array[offset + 3] ?? 1;

    return this;
  }

  /**
   * 从旋转矩阵设置四元数
   * @param m - 旋转矩阵
   * @returns 四元数
   */
  setFromRotationMatrix(m: Matrix4): this {
    const te = m.getElements();
    const m11 = te[0],
      m12 = te[4],
      m13 = te[8];
    const m21 = te[1],
      m22 = te[5],
      m23 = te[9];
    const m31 = te[2],
      m32 = te[6],
      m33 = te[10];

    const trace = m11 + m22 + m33;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);

      this.elements[3] = 0.25 / s;
      this.elements[0] = (m32 - m23) * s;
      this.elements[1] = (m13 - m31) * s;
      this.elements[2] = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

      this.elements[3] = (m32 - m23) / s;
      this.elements[0] = 0.25 * s;
      this.elements[1] = (m12 + m21) / s;
      this.elements[2] = (m13 + m31) / s;
    } else if (m22 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

      this.elements[3] = (m13 - m31) / s;
      this.elements[0] = (m12 + m21) / s;
      this.elements[1] = 0.25 * s;
      this.elements[2] = (m23 + m32) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

      this.elements[3] = (m21 - m12) / s;
      this.elements[0] = (m13 + m31) / s;
      this.elements[1] = (m23 + m32) / s;
      this.elements[2] = 0.25 * s;
    }

    return this;
  }

  /**
   * 从两个单位向量设置四元数
   * @param from - 起始向量
   * @param to - 目标向量
   * @returns 四元数
   */
  setFromUnitVectors(from: Vector3, to: Vector3): this {
    let r = from.dot(to) + 1;

    if (r < Number.EPSILON) {
      r = 0;

      if (Math.abs(from.x) > Math.abs(from.z)) {
        this.elements[0] = -from.y;
        this.elements[1] = from.x;
        this.elements[2] = 0;
        this.elements[3] = r;
      } else {
        this.elements[0] = 0;
        this.elements[1] = -from.z;
        this.elements[2] = from.y;
        this.elements[3] = r;
      }
    } else {
      const cross = Vector3.cross(from, to);
      this.elements[0] = cross.x;
      this.elements[1] = cross.y;
      this.elements[2] = cross.z;
      this.elements[3] = r;
    }

    return this.normalize();
  }

  /**
   * 拷贝四元数
   * @param quat - 四元数
   * @returns 四元数
   */
  copyFrom(quat: Quaternion | Vector4Like): this {
    this.elements[0] = quat.x;
    this.elements[1] = quat.y;
    this.elements[2] = quat.z;
    this.elements[3] = quat.w;

    return this;
  }

  /**
   * 克隆四元数
   * @returns 克隆结果
   */
  clone(): Quaternion {
    return Quaternion.create(this.x, this.y, this.z, this.w);
  }

  /**
   * 计算与另一个四元数的角度
   * @param other - 另一个四元数
   * @returns 角度（弧度）
   */
  angleTo(other: Quaternion): number {
    return 2 * Math.acos(Math.abs(clamp(this.dot(other), -1, 1)));
  }

  /**
   * 向目标四元数旋转指定步长
   * @param q - 目标四元数
   * @param step - 步长（弧度）
   * @returns 四元数
   */
  rotateTowards(q: Quaternion, step: number): this {
    const angle = this.angleTo(q);

    if (angle === 0) {
      return this;
    }

    const t = Math.min(1, step / angle);

    this.slerp(q, t);

    return this;
  }

  /**
   * 设置为单位四元数
   * @returns 四元数
   */
  identity(): this {
    this.elements[0] = 0;
    this.elements[1] = 0;
    this.elements[2] = 0;
    this.elements[3] = 1;

    return this;
  }

  /**
   * 四元数求逆
   * @returns 四元数
   */
  invert(): this {
    const lengthSq = this.lengthSquared();

    if (lengthSq === 0) {
      this.elements[0] = 0;
      this.elements[1] = 0;
      this.elements[2] = 0;
      this.elements[3] = 1;
    } else {
      const invLengthSq = 1 / lengthSq;
      this.elements[0] = -this.elements[0] * invLengthSq;
      this.elements[1] = -this.elements[1] * invLengthSq;
      this.elements[2] = -this.elements[2] * invLengthSq;
      this.elements[3] = this.elements[3] * invLengthSq;
    }

    return this;
  }

  /**
   * 四元数取反
   * @returns 四元数
   */
  negate(): this {
    this.elements[0] = -this.elements[0];
    this.elements[1] = -this.elements[1];
    this.elements[2] = -this.elements[2];
    this.elements[3] = -this.elements[3];

    return this;
  }

  /**
   * 四元数共轭
   * @returns 四元数
   */
  conjugate(): this {
    this.elements[0] = -this.elements[0];
    this.elements[1] = -this.elements[1];
    this.elements[2] = -this.elements[2];

    return this;
  }

  /**
   * 四元数求点积
   * @param v - 四元数
   * @returns 点积结果
   */
  dot(v: Quaternion): number {
    const e = this.elements;
    return e[0] * v.x + e[1] * v.y + e[2] * v.z + e[3] * v.w;
  }

  /**
   * 四元数长度平方
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
   * 四元数长度
   * @returns 长度
   */
  length(): number {
    return Math.sqrt(this.lengthSquared());
  }

  /**
   * 四元数归一化
   * @returns 四元数
   */
  normalize(): this {
    const len = this.length();

    if (len === 0) {
      this.elements[0] = 0;
      this.elements[1] = 0;
      this.elements[2] = 0;
      this.elements[3] = 1;
    } else {
      const invLen = 1 / len;
      this.elements[0] *= invLen;
      this.elements[1] *= invLen;
      this.elements[2] *= invLen;
      this.elements[3] *= invLen;
    }

    return this;
  }

  /**
   * 四元数相乘
   * @param right - 四元数
   * @returns 四元数
   */
  multiply(right: Quaternion): this {
    const e = this.elements;
    const ax = e[0],
      ay = e[1],
      az = e[2],
      aw = e[3];
    const bx = right.x,
      by = right.y,
      bz = right.z,
      bw = right.w;

    e[0] = ax * bw + aw * bx + ay * bz - az * by;
    e[1] = ay * bw + aw * by + az * bx - ax * bz;
    e[2] = az * bw + aw * bz + ax * by - ay * bx;
    e[3] = aw * bw - ax * bx - ay * by - az * bz;

    return this;
  }

  /**
   * 四元数左乘
   * @param left - 四元数
   * @returns 四元数
   */
  premultiply(left: Quaternion): this {
    return this.multiplyQuaternions(left, this);
  }

  /**
   * 两个四元数相乘
   * @param a - 四元数a
   * @param b - 四元数b
   * @returns 四元数
   */
  multiplyQuaternions(a: Quaternion, b: Quaternion): this {
    const e = this.elements;
    const ax = a.x,
      ay = a.y,
      az = a.z,
      aw = a.w;
    const bx = b.x,
      by = b.y,
      bz = b.z,
      bw = b.w;

    e[0] = ax * bw + aw * bx + ay * bz - az * by;
    e[1] = ay * bw + aw * by + az * bx - ax * bz;
    e[2] = az * bw + aw * bz + ax * by - ay * bx;
    e[3] = aw * bw - ax * bx - ay * by - az * bz;

    return this;
  }

  /**
   * 四元数球面线性插值
   * @param other - 目标四元数
   * @param t - 插值参数 [0, 1]
   * @returns 四元数
   */
  slerp(other: Quaternion, t: number): this {
    if (t === 0) {
      return this;
    }
    if (t === 1) {
      return this.copyFrom(other);
    }

    const e = this.elements;
    const x = e[0],
      y = e[1],
      z = e[2],
      w = e[3];

    let cosHalfTheta = w * other.w + x * other.x + y * other.y + z * other.z;

    if (cosHalfTheta < 0) {
      e[3] = -other.w;
      e[0] = -other.x;
      e[1] = -other.y;
      e[2] = -other.z;

      cosHalfTheta = -cosHalfTheta;
    } else {
      this.copyFrom(other);
    }

    if (cosHalfTheta >= 1.0) {
      e[3] = w;
      e[0] = x;
      e[1] = y;
      e[2] = z;

      return this;
    }

    const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

    if (sqrSinHalfTheta <= Number.EPSILON) {
      const s = 1 - t;
      e[3] = s * w + t * e[3];
      e[0] = s * x + t * e[0];
      e[1] = s * y + t * e[1];
      e[2] = s * z + t * e[2];

      this.normalize();

      return this;
    }

    const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    e[3] = w * ratioA + e[3] * ratioB;
    e[0] = x * ratioA + e[0] * ratioB;
    e[1] = y * ratioA + e[1] * ratioB;
    e[2] = z * ratioA + e[2] * ratioB;

    return this;
  }

  /**
   * 两个四元数间的球面线性插值
   * @param qa - 起始四元数
   * @param qb - 目标四元数
   * @param t - 插值参数 [0, 1]
   * @returns 四元数
   */
  slerpQuaternions(qa: Quaternion, qb: Quaternion, t: number) {
    return this.copyFrom(qa).slerp(qb, t);
  }

  /**
   * 旋转向量
   * @param v - 向量
   * @param out - 输出向量，可选
   * @returns 旋转后的向量
   */
  rotateVector3(v: Vector3, out?: Vector3): Vector3 {
    const result = out || Vector3.create();

    // 使用四元数旋转公式: v' = q * v * q^-1
    const qx = this.x,
      qy = this.y,
      qz = this.z,
      qw = this.w;
    const vx = v.x,
      vy = v.y,
      vz = v.z;

    // 计算 q * v (其中v被视为纯四元数，w=0)
    const ix = qw * vx + qy * vz - qz * vy;
    const iy = qw * vy + qz * vx - qx * vz;
    const iz = qw * vz + qx * vy - qy * vx;
    const iw = -qx * vx - qy * vy - qz * vz;

    // 计算 (q * v) * q^-1
    result.set(
      ix * qw + iw * -qx + iy * -qz - iz * -qy,
      iy * qw + iw * -qy + iz * -qx - ix * -qz,
      iz * qw + iw * -qz + ix * -qy - iy * -qx
    );

    return result;
  }

  /**
   * 变换向量（旧方法名，保持兼容性）
   * @param v - 向量
   * @returns 变换后的向量
   */
  transformVector(v: Vector3): Vector3 {
    return this.rotateVector3(v);
  }

  /**
   * 四元数判等
   * @param quaternion - 四元数
   * @returns 判等结果
   */
  equals(quaternion: Quaternion): boolean {
    return quaternion.x === this.x && quaternion.y === this.y && quaternion.z === this.z && quaternion.w === this.w;
  }

  /**
   * 四元数转数组
   * @returns 数组
   */
  toArray(): [x: number, y: number, z: number, w: number] {
    const e = this.elements;
    return [e[0], e[1], e[2], e[3]];
  }

  /**
   * 四元数转Vector4
   * @param vec - Vector4对象
   * @returns Vector4对象
   */
  toVector4(vec: Vector4): Vector4 {
    return vec.set(this.x, this.y, this.z, this.w);
  }

  /**
   * 四元数转欧拉角
   * @param euler - 欧拉角对象
   * @returns 欧拉角对象
   */
  toEuler(euler: Euler): Euler {
    return euler.setFromQuaternion(this);
  }

  /**
   * 四元数转矩阵
   * @param mat - 矩阵对象
   * @returns 矩阵对象
   */
  toMatrix4(mat: Matrix4): Matrix4 {
    return mat.makeRotationFromQuaternion(this);
  }

  /**
   * 从欧拉角创建四元数
   * @param euler - 欧拉角
   * @returns 四元数
   */
  static fromEuler(euler: Euler): Quaternion {
    const quaternion = Quaternion.create();
    return quaternion.setFromEuler(euler.x, euler.y, euler.z);
  }

  /**
   * 从轴角创建四元数
   * @param axis - 旋转轴
   * @param angle - 旋转角度
   * @returns 四元数
   */
  static fromAxisAngle(axis: Vector3, angle: number): Quaternion {
    const quaternion = Quaternion.create();
    return quaternion.setFromAxisAngle(axis, angle);
  }

  /**
   * 从Vector4创建四元数
   * @param v - Vector4对象
   * @returns 四元数
   */
  static fromVector4(v: Vector4Like): Quaternion {
    const quaternion = Quaternion.create();
    return quaternion.setFromVector4(v);
  }

  /**
   * 从数组创建四元数
   * @param array - 数组
   * @param offset - 起始偏移值，默认为0
   * @returns 四元数
   */
  static fromArray(array: number[], offset = 0): Quaternion {
    const quaternion = Quaternion.create();
    return quaternion.setFromArray(array, offset);
  }

  /**
   * 从旋转矩阵创建四元数
   * @param m - 旋转矩阵
   * @returns 四元数
   */
  static fromRotationMatrix(m: Matrix4): Quaternion {
    const quaternion = Quaternion.create();
    return quaternion.setFromRotationMatrix(m);
  }

  /**
   * 从两个单位向量创建四元数
   * @param from - 起始向量
   * @param to - 目标向量
   * @returns 四元数
   */
  static fromUnitVectors(from: Vector3, to: Vector3): Quaternion {
    const quaternion = Quaternion.create();
    return quaternion.setFromUnitVectors(from, to);
  }

  /**
   * 从欧拉角创建四元数（旧方法名，保持兼容性）
   * @param x - X轴旋转角度
   * @param y - Y轴旋转角度
   * @param z - Z轴旋转角度
   * @returns 四元数
   */
  fromEulerAngles(x: number, y: number, z: number): Quaternion {
    return this.setFromEuler(x, y, z);
  }

  /**
   * 计算两个四元数的点积
   * @param a - 第一个四元数
   * @param b - 第二个四元数
   * @returns 点积值
   */
  static dot(a: Quaternion, b: Quaternion): number {
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  }

  /**
   * 在两个四元数之间进行球面线性插值
   * @param a - 起始四元数
   * @param b - 目标四元数
   * @param t - 插值参数 [0, 1]
   * @returns 插值结果四元数
   */
  static slerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
    const result = Quaternion.create();
    return result.copyFrom(a).slerp(b, t);
  }

  /**
   * 检查四元数是否为有效值
   * @param q - 四元数
   * @returns 是否有效
   */
  static isValid(q: Quaternion): boolean {
    return (
      !isNaN(q.x) &&
      !isNaN(q.y) &&
      !isNaN(q.z) &&
      !isNaN(q.w) &&
      isFinite(q.x) &&
      isFinite(q.y) &&
      isFinite(q.z) &&
      isFinite(q.w)
    );
  }
}
