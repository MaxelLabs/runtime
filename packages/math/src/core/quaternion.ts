import type { Euler } from './euler';
import type { Matrix4 } from './matrix4';
import { clamp } from './utils';
import { Vector3 } from './vector3';
import type { Vector4 } from './vector4';
import type { Vector4Like } from './type';

/**
 * 四元数
 */
export class Quaternion {
  static multiply(worldRotation: Quaternion, _localRotation: Quaternion): Quaternion {
    throw new Error('Method not implemented.');
  }
  static invert(worldRotation: Quaternion) {
    throw new Error('Method not implemented.');
  }
  static fromMatrix(rotationMatrix: Matrix4) {
    throw new Error('Method not implemented.');
  }
  transformVector(arg0: Vector3) {
    throw new Error('Method not implemented.');
  }
  private static readonly tempVec0: Vector3 = new Vector3();

  // 使用Float32Array存储四元数元素，提高内存访问效率
  private elements: Float32Array;

  /**
   * 构造函数
   * @param [x=0] - x 分量
   * @param [y=0] - y 分量
   * @param [z=0] - z 分量
   * @param [w=1] - w 分量
   */
  constructor (
    public x = 0,
    public y = 0,
    public z = 0,
    public w = 1,
  ) {
    this.elements = new Float32Array([x, y, z, w]);
  }

  /**
   * 四元数设置
   * @param x - x 分量
   * @param y - y 分量
   * @param z - z 分量
   * @param w - w 分量
   * @returns 四元数
   */
  set (x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;

    this.elements[0] = x;
    this.elements[1] = y;
    this.elements[2] = z;
    this.elements[3] = w;

    return this;
  }

  /**
   * 从欧拉角设置四元数
   * @param x 绕X轴的旋转角度（弧度）
   * @param y 绕Y轴的旋转角度（弧度）
   * @param z 绕Z轴的旋转角度（弧度）
   * @returns 当前四元数
   */
  setFromEuler (x: number, y: number, z: number): Quaternion {
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;

    this.elements[0] = this.x;
    this.elements[1] = this.y;
    this.elements[2] = this.z;
    this.elements[3] = this.w;

    return this.normalize();
  }

  /**
   * 通过旋转轴和旋转角度设置四元数
   * @param axis - 旋转轴
   * @param angle - 旋转角度（弧度）
   * @returns
   */
  setFromAxisAngle (axis: Vector3, angle: number): this {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    const v = Quaternion.tempVec0;

    v.copyFrom(axis).normalize();
    this.x = v.x * s;
    this.y = v.y * s;
    this.z = v.z * s;
    this.w = Math.cos(halfAngle);

    this.elements[0] = this.x;
    this.elements[1] = this.y;
    this.elements[2] = this.z;
    this.elements[3] = this.w;

    return this;
  }

  /**
   * 通过 Vector4Like 创建四元数
   * @param v - Vector4Like
   * @returns
   */
  setFromVector4 (v: Vector4Like): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    this.w = v.w;

    this.elements[0] = this.x;
    this.elements[1] = this.y;
    this.elements[2] = this.z;
    this.elements[3] = this.w;

    return this;
  }

  /**
   * 通过数组设置四元数
   * @param array - 数组
   * @param [offset=0] - 起始偏移值
   * @returns
   */
  setFromArray (array: number[], offset = 0): this {
    this.x = array[offset];
    this.y = array[offset + 1];
    this.z = array[offset + 2];
    this.w = array[offset + 3];

    this.elements[0] = this.x;
    this.elements[1] = this.y;
    this.elements[2] = this.z;
    this.elements[3] = this.w;

    return this;
  }

  /**
   * 通过矩阵设置四元数
   * @param m - 矩阵
   * @returns
   */
  setFromRotationMatrix (m: Matrix4): this {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
    const te = m.getElements();

    const m11 = te[0];
    const m12 = te[4];
    const m13 = te[8];
    const m21 = te[1];
    const m22 = te[5];
    const m23 = te[9];
    const m31 = te[2];
    const m32 = te[6];
    const m33 = te[10];
    const trace = m11 + m22 + m33;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);

      this.w = 0.25 / s;
      this.x = (m32 - m23) * s;
      this.y = (m13 - m31) * s;
      this.z = (m21 - m12) * s;

      this.elements[0] = this.x;
      this.elements[1] = this.y;
      this.elements[2] = this.z;
      this.elements[3] = this.w;
    } else if (m11 > m22 && m11 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

      this.w = (m32 - m23) / s;
      this.x = 0.25 * s;
      this.y = (m12 + m21) / s;
      this.z = (m13 + m31) / s;
      this.negate();

      this.elements[0] = this.x;
      this.elements[1] = this.y;
      this.elements[2] = this.z;
      this.elements[3] = this.w;
    } else if (m22 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

      this.w = (m13 - m31) / s;
      this.x = (m12 + m21) / s;
      this.y = 0.25 * s;
      this.z = (m23 + m32) / s;
      this.negate();

      this.elements[0] = this.x;
      this.elements[1] = this.y;
      this.elements[2] = this.z;
      this.elements[3] = this.w;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

      this.w = (m21 - m12) / s;
      this.x = (m13 + m31) / s;
      this.y = (m23 + m32) / s;
      this.z = 0.25 * s;
      this.negate();

      this.elements[0] = this.x;
      this.elements[1] = this.y;
      this.elements[2] = this.z;
      this.elements[3] = this.w;
    }

    // 兼容原先数学库
    return this;
  }

  /**
   * 通过开始和结束向量设置四元数
   * @param from - 开始向量
   * @param to - 结束向量
   * @returns
   */
  setFromUnitVectors (from: Vector3, to: Vector3): this {
    // assumes direction vectors vFrom and vTo are normalized
    let r = from.dot(to) + 1;

    if (r < Number.EPSILON) {
      r = 0;
      if (Math.abs(from.x) > Math.abs(from.z)) {
        this.x = -from.y;
        this.y = from.x;
        this.z = 0;
        this.w = r;
      } else {
        this.x = 0;
        this.y = -from.z;
        this.z = from.y;
        this.w = r;
      }
    } else {
      this.x = from.y * to.z - from.z * to.y;
      this.y = from.z * to.x - from.x * to.z;
      this.z = from.x * to.y - from.y * to.x;
      this.w = r;
    }

    this.elements[0] = this.x;
    this.elements[1] = this.y;
    this.elements[2] = this.z;
    this.elements[3] = this.w;

    return this.normalize();
  }

  /**
   * 四元数拷贝
   * @param quat - 拷贝目标四元数
   * @returns 拷贝四元数
   */
  copyFrom (quat: Quaternion | Vector4Like): this {
    this.x = quat.x;
    this.y = quat.y;
    this.z = quat.z;
    this.w = quat.w;

    this.elements[0] = this.x;
    this.elements[1] = this.y;
    this.elements[2] = this.z;
    this.elements[3] = this.w;

    return this;
  }

  /**
   * 四元数克隆
   * @returns 克隆结果
   */
  clone (): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  /**
   * 四元数间的夹角计算
   * @param other - 其他四元数
   * @returns 夹角
   */
  angleTo (other: Quaternion): number {
    return 2 * Math.acos(Math.abs(clamp(this.dot(other), - 1, 1)));
  }

  /**
   * 四元数向目标旋转
   * @param q - 四元数
   * @param step - 旋转弧度
   * @returns 目标四元数
   */
  rotateTowards (q: Quaternion, step: number): this {
    const angle = this.angleTo(q);

    if (angle === 0) {
      return this;
    }
    const t = Math.min(1, step / angle);

    this.slerp(q, t);

    return this;
  }

  /**
   * 四元数单位化
   * @returns 单位四元数
   */
  identity (): this {
    return this.set(0, 0, 0, 1);
  }

  /**
   * 四元数求逆
   * @returns 四元数的逆
   */
  invert (): this {
    return this.conjugate();
  }

  /**
   * 四元数取负
   * @returns 负四元数
   */
  negate (): this {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    this.w = -this.w;

    this.elements[0] = this.x;
    this.elements[1] = this.y;
    this.elements[2] = this.z;
    this.elements[3] = this.w;

    return this;
  }

  /**
   * 四元数求共轭值
   * @returns 四元数的共轭值
   */
  conjugate (): this {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;

    this.elements[0] = this.x;
    this.elements[1] = this.y;
    this.elements[2] = this.z;
    this.elements[3] = this.w;

    return this;
  }

  /**
   * 四元数点乘结果
   * @param v
   * @return
   */
  dot (v: Quaternion): number {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
  }

  /**
   * 四元数的模平方
   * @return
   */
  lengthSquared (): number {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }

  /**
   * 四元数的欧式长度
   * @returns 长度
   */
  length (): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  /**
   * 四元数归一化
   * @returns 归一化值
   */
  normalize (): this {
    const e = this.elements;
    const len = e[0] * e[0] + e[1] * e[1] + e[2] * e[2] + e[3] * e[3];

    if (len > 0) {
      const invLen = 1 / Math.sqrt(len);

      e[0] *= invLen;
      e[1] *= invLen;
      e[2] *= invLen;
      e[3] *= invLen;
    }

    return this;
  }

  /**
   * 四元数右乘
   * @param right - 右乘的四元数
   * @returns
   */
  multiply (right: Quaternion): this {
    const a = this.elements;
    const b = right.elements;
    const r = new Float32Array(4);

    r[0] = a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1];
    r[1] = a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0];
    r[2] = a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3];
    r[3] = a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2];

    this.elements = r;

    return this;
  }

  /**
   * 四元数左乘
   * @param left - 左乘的四元数
   * @returns
   */
  premultiply (left: Quaternion): this {
    return this.multiply(left);
  }

  /**
   * 四元数线性插值
   * @see http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/
   * @param other - 四元数
   * @param t - 插值比
   * @returns 插值结果
   */
  slerp (other: Quaternion, t: number): this {
    const e = this.elements;
    const b = other.elements;

    // 计算点积
    let cosHalfTheta = e[0] * b[0] + e[1] * b[1] + e[2] * b[2] + e[3] * b[3];

    // 如果点积为负，取反以获得最短路径
    if (cosHalfTheta < 0) {
      cosHalfTheta = -cosHalfTheta;
      b[0] = -b[0];
      b[1] = -b[1];
      b[2] = -b[2];
      b[3] = -b[3];
    }

    // 如果四元数非常接近，使用线性插值
    if (Math.abs(cosHalfTheta) >= 1.0) {
      e[0] = e[0] + t * (b[0] - e[0]);
      e[1] = e[1] + t * (b[1] - e[1]);
      e[2] = e[2] + t * (b[2] - e[2]);
      e[3] = e[3] + t * (b[3] - e[3]);

      return this.normalize();
    }

    // 计算球面线性插值
    const halfTheta = Math.acos(cosHalfTheta);
    const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

    // 如果角度非常小，使用线性插值
    if (Math.abs(sinHalfTheta) < 0.001) {
      e[0] = e[0] + t * (b[0] - e[0]);
      e[1] = e[1] + t * (b[1] - e[1]);
      e[2] = e[2] + t * (b[2] - e[2]);
      e[3] = e[3] + t * (b[3] - e[3]);

      return this.normalize();
    }

    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    e[0] = e[0] * ratioA + b[0] * ratioB;
    e[1] = e[1] * ratioA + b[1] * ratioB;
    e[2] = e[2] * ratioA + b[2] * ratioB;
    e[3] = e[3] * ratioA + b[3] * ratioB;

    return this.normalize();
  }

  /**
   * 两个四元数的线性插值
   * @param qa - 四元数
   * @param qb - 四元数
   * @param t - 插值比
   */
  slerpQuaternions (qa: Quaternion, qb: Quaternion, t: number) {
    this.copyFrom(qa).slerp(qb, t);
  }

  /**
   * 通过四元数旋转向量
   * @param v - 待旋转向量
   * @param [out] - 旋转结果，如果没有传入直接覆盖输入值
   * @returns
   */
  rotateVector3 (v: Vector3, out?: Vector3): Vector3 {
    const { x: qx, y: qy, z: qz, w: qw } = this;
    const { x: vx, y: vy, z: vz } = v;

    const ix = qw * vx + qy * vz - qz * vy;
    const iy = qw * vy + qz * vx - qx * vz;
    const iz = qw * vz + qx * vy - qy * vx;
    const iw = - qx * vx - qy * vy - qz * vz;

    const res = out ?? v;

    res.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    res.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    res.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return res;
  }

  /**
   * 四元数判等
   * @param quaternion - 四元数
   * @returns 判等结果
   */
  equals (quaternion: Quaternion): boolean {
    return quaternion.x === this.x
      && quaternion.y === this.y
      && quaternion.z === this.z
      && quaternion.w === this.w;
  }

  /**
   * 四元数保存为数组
   * @returns
   */
  toArray (): [x: number, y: number, z: number, w: number] {
    return [this.x, this.y, this.z, this.w];
  }

  /**
   * 四元数转四维向量数组
   * @param vec - 目标保存对象
   * @returns 保存结果
   */
  toVector4 (vec: Vector4): Vector4 {
    return vec.set(this.x, this.y, this.z, this.w);
  }

  /**
   * 四元数转欧拉角
   * @param euler - 目标欧拉角
   * @returns 欧拉角
   */
  toEuler (euler: Euler): Euler {
    return euler.setFromQuaternion(this);
  }

  /**
   * 四元数转矩阵
   * @param mat - 目标矩阵
   * @returns
   */
  toMatrix4 (mat: Matrix4): Matrix4 {
    const zero = new Vector3();
    const one = new Vector3(1, 1, 1);

    return mat.compose(zero, this, one);
  }

  /**
   * 通过欧拉角创建四元数
   * @param euler - 欧拉角
   * @returns 四元数
   */
  static fromEuler (euler: Euler): Quaternion {
    return new Quaternion().setFromEuler(euler.x, euler.y, euler.z);
  }

  /**
   * 通过旋转轴和旋转角度创建四元数
   * @param axis - 旋转轴
   * @param angle - 旋转角（弧度值）
   * @returns 四元数
   */
  static fromAxisAngle (axis: Vector3, angle: number): Quaternion {
    return new Quaternion().setFromAxisAngle(axis, angle);
  }

  /**
   * 通过 Vector4Like 创建四元数
   * @param v - Vector4Like
   * @returns 四元数
   */
  static fromVector4 (v: Vector4Like): Quaternion {
    return new Quaternion().setFromVector4(v);
  }

  /**
   * 通过数组创建四元数
   * @param array - 数组
   * @param [offset=0] - 起始偏移值
   * @returns 四元数
   */
  static fromArray (array: number[], offset = 0): Quaternion {
    return new Quaternion().setFromArray(array, offset);
  }

  /**
   * 通过旋转矩阵创建四元数
   * @param m - 旋转矩阵
   * @returns 四元数
   */
  static fromRotationMatrix (m: Matrix4): Quaternion {
    return new Quaternion().setFromRotationMatrix(m);
  }

  /**
   * 通过开始和结束向量创建四元数
   * @param from - 开始向量
   * @param to - 结束向量
   * @returns
   */
  static fromUnitVectors (from: Vector3, to: Vector3): Quaternion {
    return new Quaternion().setFromUnitVectors(from, to);
  }
}
