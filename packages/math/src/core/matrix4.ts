import { Vector3 } from './vector3';
import type { Vector4 } from './vector4';
import type { Quaternion } from './quaternion';
import type { mat4 } from './type';

// 对象池配置
const MATRIX4_POOL_SIZE = 100;
const matrix4Pool: Matrix4[] = [];
let matrix4PoolIndex = 0;

/**
 * 四阶矩阵（列优先矩阵）
 */
export class Matrix4 {
  static readonly IDENTITY = Object.freeze(new Matrix4().identity());

  static readonly ZERO = Object.freeze(new Matrix4().setZero());

  private static readonly tempVec0: Vector3 = new Vector3();
  private static readonly tempVec1: Vector3 = new Vector3();
  private static readonly tempVec2: Vector3 = new Vector3();
  private static readonly tempMat0: Matrix4 = new Matrix4();

  /**
   * 使用Float32Array存储矩阵元素，提高内存访问效率
   */
  private elements: Float32Array;

  constructor () {
    this.elements = new Float32Array(16);
    this.identity();
  }

  /**
   * 设置单位矩阵
   */
  identity (): this {
    const e = this.elements;

    e[0] = 1; e[4] = 0; e[8] = 0; e[12] = 0;
    e[1] = 0; e[5] = 1; e[9] = 0; e[13] = 0;
    e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
    e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;

    return this;
  }

  /**
   * 设置矩阵
   * @param m11 - 第 1 行，第 1 列
   * @param m21 - 第 2 行，第 1 列
   * @param m31 - 第 3 行，第 1 列
   * @param m41 - 第 4 行，第 1 列
   * @param m12 - 第 1 行，第 2 列
   * @param m22 - 第 2 行，第 2 列
   * @param m32 - 第 3 行，第 2 列
   * @param m42 - 第 4 行，第 2 列
   * @param m13 - 第 1 行，第 3 列
   * @param m23 - 第 2 行，第 3 列
   * @param m33 - 第 3 行，第 3 列
   * @param m43 - 第 4 行，第 3 列
   * @param m14 - 第 1 行，第 4 列
   * @param m24 - 第 2 行，第 4 列
   * @param m34 - 第 3 行，第 4 列
   * @param m44 - 第 4 行，第 4 列
   * @returns 矩阵
   */
  set (
    m11: number, m21: number, m31: number, m41: number,
    m12: number, m22: number, m32: number, m42: number,
    m13: number, m23: number, m33: number, m43: number,
    m14: number, m24: number, m34: number, m44: number,
  ): this {
    const e = this.elements;

    e[0] = m11; e[1] = m21; e[2] = m31; e[3] = m41;
    e[4] = m12; e[5] = m22; e[6] = m32; e[7] = m42;
    e[8] = m13; e[9] = m23; e[10] = m33; e[11] = m43;
    e[12] = m14; e[13] = m24; e[14] = m34; e[15] = m44;

    return this;
  }

  /**
   * 矩阵克隆
   * @returns 克隆结果
   */
  clone (): Matrix4 {
    // 使用对象池创建矩阵
    return Matrix4.create().copyFrom(this);
  }

  /**
   * 矩阵复制
   * @param m - 复制对象
   * @returns 复制结果
   */
  copyFrom (m: Matrix4): this {
    const te = this.elements;
    const me = m.elements;

    // 优化复制操作，使用set方法而不是展开操作
    te.set(me);

    return this;
  }

  /**
   * 矩阵乘法（优化版本）
   */
  multiply (m: Matrix4): this {
    const a = this.elements;
    const b = m.elements;
    const r = new Float32Array(16);

    // 展开循环，减少分支预测失败
    r[0] = a[0] * b[0] + a[4] * b[1] + a[8] * b[2] + a[12] * b[3];
    r[1] = a[1] * b[0] + a[5] * b[1] + a[9] * b[2] + a[13] * b[3];
    r[2] = a[2] * b[0] + a[6] * b[1] + a[10] * b[2] + a[14] * b[3];
    r[3] = a[3] * b[0] + a[7] * b[1] + a[11] * b[2] + a[15] * b[3];

    r[4] = a[0] * b[4] + a[4] * b[5] + a[8] * b[6] + a[12] * b[7];
    r[5] = a[1] * b[4] + a[5] * b[5] + a[9] * b[6] + a[13] * b[7];
    r[6] = a[2] * b[4] + a[6] * b[5] + a[10] * b[6] + a[14] * b[7];
    r[7] = a[3] * b[4] + a[7] * b[5] + a[11] * b[6] + a[15] * b[7];

    r[8] = a[0] * b[8] + a[4] * b[9] + a[8] * b[10] + a[12] * b[11];
    r[9] = a[1] * b[8] + a[5] * b[9] + a[9] * b[10] + a[13] * b[11];
    r[10] = a[2] * b[8] + a[6] * b[9] + a[10] * b[10] + a[14] * b[11];
    r[11] = a[3] * b[8] + a[7] * b[9] + a[11] * b[10] + a[15] * b[11];

    r[12] = a[0] * b[12] + a[4] * b[13] + a[8] * b[14] + a[12] * b[15];
    r[13] = a[1] * b[12] + a[5] * b[13] + a[9] * b[14] + a[13] * b[15];
    r[14] = a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15];
    r[15] = a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15];

    this.elements = r;

    return this;
  }

  /**
   * 矩阵求逆（优化版本）
   */
  invert (): this {
    const e = this.elements;
    const r = new Float32Array(16);

    // 计算行列式
    const det =
      e[0] * (e[5] * e[10] * e[15] - e[5] * e[11] * e[14] - e[9] * e[6] * e[15] + e[9] * e[7] * e[14] + e[13] * e[6] * e[11] - e[13] * e[7] * e[10]) -
      e[1] * (e[4] * e[10] * e[15] - e[4] * e[11] * e[14] - e[8] * e[6] * e[15] + e[8] * e[7] * e[14] + e[12] * e[6] * e[11] - e[12] * e[7] * e[10]) +
      e[2] * (e[4] * e[9] * e[15] - e[4] * e[11] * e[13] - e[8] * e[5] * e[15] + e[8] * e[7] * e[13] + e[12] * e[5] * e[11] - e[12] * e[7] * e[9]) -
      e[3] * (e[4] * e[9] * e[14] - e[4] * e[10] * e[13] - e[8] * e[5] * e[14] + e[8] * e[6] * e[13] + e[12] * e[5] * e[10] - e[12] * e[6] * e[9]);

    if (det === 0) {
      console.warn('Matrix4: Matrix is not invertible.');

      return this;
    }

    const invDet = 1 / det;

    // 计算伴随矩阵并乘以逆行列式
    r[0] = (e[5] * e[10] * e[15] - e[5] * e[11] * e[14] - e[9] * e[6] * e[15] + e[9] * e[7] * e[14] + e[13] * e[6] * e[11] - e[13] * e[7] * e[10]) * invDet;
    r[1] = (-e[1] * e[10] * e[15] + e[1] * e[11] * e[14] + e[9] * e[2] * e[15] - e[9] * e[3] * e[14] - e[13] * e[2] * e[11] + e[13] * e[3] * e[10]) * invDet;
    r[2] = (e[1] * e[6] * e[15] - e[1] * e[7] * e[14] - e[5] * e[2] * e[15] + e[5] * e[3] * e[14] + e[13] * e[2] * e[7] - e[13] * e[3] * e[6]) * invDet;
    r[3] = (-e[1] * e[6] * e[11] + e[1] * e[7] * e[10] + e[5] * e[2] * e[11] - e[5] * e[3] * e[10] - e[9] * e[2] * e[7] + e[9] * e[3] * e[6]) * invDet;

    r[4] = (-e[4] * e[10] * e[15] + e[4] * e[11] * e[14] + e[8] * e[6] * e[15] - e[8] * e[7] * e[14] - e[12] * e[6] * e[11] + e[12] * e[7] * e[10]) * invDet;
    r[5] = (e[0] * e[10] * e[15] - e[0] * e[11] * e[14] - e[8] * e[2] * e[15] + e[8] * e[3] * e[14] + e[12] * e[2] * e[11] - e[12] * e[3] * e[10]) * invDet;
    r[6] = (-e[0] * e[6] * e[15] + e[0] * e[7] * e[14] + e[4] * e[2] * e[15] - e[4] * e[3] * e[14] - e[12] * e[2] * e[7] + e[12] * e[3] * e[6]) * invDet;
    r[7] = (e[0] * e[6] * e[11] - e[0] * e[7] * e[10] - e[4] * e[2] * e[11] + e[4] * e[3] * e[10] + e[8] * e[2] * e[7] - e[8] * e[3] * e[6]) * invDet;

    r[8] = (e[4] * e[9] * e[15] - e[4] * e[11] * e[13] - e[8] * e[5] * e[15] + e[8] * e[7] * e[13] + e[12] * e[5] * e[11] - e[12] * e[7] * e[9]) * invDet;
    r[9] = (-e[0] * e[9] * e[15] + e[0] * e[11] * e[13] + e[8] * e[1] * e[15] - e[8] * e[3] * e[13] - e[12] * e[1] * e[11] + e[12] * e[3] * e[9]) * invDet;
    r[10] = (e[0] * e[5] * e[15] - e[0] * e[7] * e[13] - e[4] * e[1] * e[15] + e[4] * e[3] * e[13] + e[12] * e[1] * e[7] - e[12] * e[3] * e[5]) * invDet;
    r[11] = (-e[0] * e[5] * e[11] + e[0] * e[7] * e[9] + e[4] * e[1] * e[11] - e[4] * e[3] * e[9] - e[8] * e[1] * e[7] + e[8] * e[3] * e[5]) * invDet;

    r[12] = (-e[4] * e[9] * e[14] + e[4] * e[10] * e[13] + e[8] * e[5] * e[14] - e[8] * e[6] * e[13] - e[12] * e[5] * e[10] + e[12] * e[6] * e[9]) * invDet;
    r[13] = (e[0] * e[9] * e[14] - e[0] * e[10] * e[13] - e[8] * e[1] * e[14] + e[8] * e[2] * e[13] + e[12] * e[1] * e[10] - e[12] * e[2] * e[9]) * invDet;
    r[14] = (-e[0] * e[5] * e[14] + e[0] * e[6] * e[13] + e[4] * e[1] * e[14] - e[4] * e[2] * e[13] - e[12] * e[1] * e[6] + e[12] * e[2] * e[5]) * invDet;
    r[15] = (e[0] * e[5] * e[10] - e[0] * e[6] * e[9] - e[4] * e[1] * e[10] + e[4] * e[2] * e[9] + e[8] * e[1] * e[6] - e[8] * e[2] * e[5]) * invDet;

    this.elements = r;

    return this;
  }

  /**
   * 设置为零矩阵
   * @returns 矩阵
   */
  setZero (): this {
    const e = this.elements;

    e[0] = 0; e[1] = 0; e[2] = 0; e[3] = 0;
    e[4] = 0; e[5] = 0; e[6] = 0; e[7] = 0;
    e[8] = 0; e[9] = 0; e[10] = 0; e[11] = 0;
    e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 0;

    return this;
  }

  /**
   * 矩阵转数组 - 优化为直接返回Float32Array的拷贝
   * @returns 数组
   */
  toArray (): mat4 {
    // 返回一个元素数组的拷贝而不是展开操作
    return Array.from(this.elements) as mat4;
  }

  /**
   * 将矩阵数据填充到目标数组
   * @param array 目标数组
   * @param offset 起始偏移值
   */
  fill (array: number[] | Float32Array, offset = 0) {
    const te = this.elements;

    if (array instanceof Float32Array && offset === 0 && array.length >= 16) {
      // 对于 Float32Array，我们可以直接使用 set 方法
      array.set(te);
    } else {
      // 手动复制
      array[offset] = te[0];
      array[offset + 1] = te[1];
      array[offset + 2] = te[2];
      array[offset + 3] = te[3];
      array[offset + 4] = te[4];
      array[offset + 5] = te[5];
      array[offset + 6] = te[6];
      array[offset + 7] = te[7];
      array[offset + 8] = te[8];
      array[offset + 9] = te[9];
      array[offset + 10] = te[10];
      array[offset + 11] = te[11];
      array[offset + 12] = te[12];
      array[offset + 13] = te[13];
      array[offset + 14] = te[14];
      array[offset + 15] = te[15];
    }
  }

  /**
   * 矩阵变换点
   * @param v - 输入点
   * @param out - 输出点，如果没有设置就直接返回新的点
   * @returns 变换结果
   */
  transformPoint (v: Vector3, out?: Vector3): Vector3 {
    const x = v.x;
    const y = v.y;
    const z = v.z;
    const e = this.elements;

    const result = out || new Vector3();

    // 应用仿射变换
    result.x = e[0] * x + e[4] * y + e[8] * z + e[12];
    result.y = e[1] * x + e[5] * y + e[9] * z + e[13];
    result.z = e[2] * x + e[6] * y + e[10] * z + e[14];

    return result;
  }

  /**
   * 矩阵变换向量(不包括平移部分)
   * @param v - 输入向量
   * @param out - 输出向量，如果没有设置就直接返回新的向量
   * @returns 变换结果
   */
  transformVector (v: Vector3, out?: Vector3): Vector3 {
    const x = v.x;
    const y = v.y;
    const z = v.z;
    const e = this.elements;

    const result = out || new Vector3();

    // 只应用线性部分
    result.x = e[0] * x + e[4] * y + e[8] * z;
    result.y = e[1] * x + e[5] * y + e[9] * z;
    result.z = e[2] * x + e[6] * y + e[10] * z;

    return result;
  }

  /**
   * 矩阵变换四维向量
   * @param v - 输入向量
   * @param out - 输出向量，如果没有设置就直接返回新的向量
   * @returns 变换结果
   */
  transformVector4 (v: Vector4, out?: Vector4): Vector4 {
    const x = v.x;
    const y = v.y;
    const z = v.z;
    const w = v.w;
    const e = this.elements;

    const result = out || v;

    result.x = e[0] * x + e[4] * y + e[8] * z + e[12] * w;
    result.y = e[1] * x + e[5] * y + e[9] * z + e[13] * w;
    result.z = e[2] * x + e[6] * y + e[10] * z + e[14] * w;
    result.w = e[3] * x + e[7] * y + e[11] * z + e[15] * w;

    return result;
  }

  /**
   * 矩阵变换法向量
   * @param v - 输入法向量
   * @param out - 输出法向量，如果没有设置就直接返回新的向量
   * @returns 变换结果
   */
  transformNormal (v: Vector3, out?: Vector3): Vector3 {
    // 法向量变换需要使用原矩阵的逆转置矩阵
    // 对于刚体变换，可以直接使用旋转部分
    const x = v.x;
    const y = v.y;
    const z = v.z;
    const e = this.elements;

    const result = out || new Vector3();

    // 假设矩阵是正交的（只有旋转），直接使用转置
    result.x = e[0] * x + e[1] * y + e[2] * z;
    result.y = e[4] * x + e[5] * y + e[6] * z;
    result.z = e[8] * x + e[9] * y + e[10] * z;

    // 归一化结果
    return result.normalize();
  }

  /**
   * 通过位置、旋转和缩放组合成一个变换矩阵
   * @param position - 位置
   * @param rotation - 旋转
   * @param scale - 缩放
   * @returns 变换矩阵
   */
  compose (position: Vector3, rotation: Quaternion, scale: Vector3): this {
    const e = this.elements;

    const x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    const sx = scale.x, sy = scale.y, sz = scale.z;

    e[0] = (1 - (yy + zz)) * sx;
    e[1] = (xy + wz) * sx;
    e[2] = (xz - wy) * sx;
    e[3] = 0;

    e[4] = (xy - wz) * sy;
    e[5] = (1 - (xx + zz)) * sy;
    e[6] = (yz + wx) * sy;
    e[7] = 0;

    e[8] = (xz + wy) * sz;
    e[9] = (yz - wx) * sz;
    e[10] = (1 - (xx + yy)) * sz;
    e[11] = 0;

    e[12] = position.x;
    e[13] = position.y;
    e[14] = position.z;
    e[15] = 1;

    return this;
  }

  /**
   * 创建透视投影矩阵
   * @param fov - 视场角，单位为角度
   * @param aspect - 宽高比
   * @param near - 近平面距离
   * @param far - 远平面距离
   * @returns 透视投影矩阵
   */
  perspective (fov: number, aspect: number, near: number, far: number): this {
    const e = this.elements;
    const tanHalfFov = Math.tan(fov * Math.PI / 360);
    const range = 1.0 / (near - far);

    e[0] = 1.0 / (tanHalfFov * aspect);
    e[1] = 0;
    e[2] = 0;
    e[3] = 0;

    e[4] = 0;
    e[5] = 1.0 / tanHalfFov;
    e[6] = 0;
    e[7] = 0;

    e[8] = 0;
    e[9] = 0;
    e[10] = (near + far) * range;
    e[11] = -1;

    e[12] = 0;
    e[13] = 0;
    e[14] = 2 * near * far * range;
    e[15] = 0;

    return this;
  }

  /**
   * 创建平移矩阵或应用平移变换
   * @param v - 平移向量
   * @returns 平移后的矩阵
   */
  translate (v: Vector3): this {
    const e = this.elements;
    const x = v.x, y = v.y, z = v.z;

    e[12] = e[0] * x + e[4] * y + e[8] * z + e[12];
    e[13] = e[1] * x + e[5] * y + e[9] * z + e[13];
    e[14] = e[2] * x + e[6] * y + e[10] * z + e[14];
    e[15] = e[3] * x + e[7] * y + e[11] * z + e[15];

    return this;
  }

  /**
   * 创建正交投影矩阵
   * @param left - 左平面距离
   * @param right - 右平面距离
   * @param bottom - 底平面距离
   * @param top - 顶平面距离
   * @param near - 近平面距离
   * @param far - 远平面距离
   * @returns 正交投影矩阵
   */
  orthographic (left: number, right: number, bottom: number, top: number, near: number, far: number): this {
    const e = this.elements;
    const w = 1.0 / (right - left);
    const h = 1.0 / (top - bottom);
    const d = 1.0 / (far - near);

    e[0] = 2 * w;
    e[1] = 0;
    e[2] = 0;
    e[3] = 0;

    e[4] = 0;
    e[5] = 2 * h;
    e[6] = 0;
    e[7] = 0;

    e[8] = 0;
    e[9] = 0;
    e[10] = -2 * d;
    e[11] = 0;

    e[12] = -(right + left) * w;
    e[13] = -(top + bottom) * h;
    e[14] = -(far + near) * d;
    e[15] = 1;

    return this;
  }

  /**
   * 围绕指定轴旋转
   * @param axis - 旋转轴（需要是单位向量）
   * @param angle - 旋转角度（弧度）
   * @returns 旋转后的矩阵
   */
  rotateOnAxis (axis: Vector3, angle: number): this {
    // 确保轴是单位向量
    const normalizedAxis = axis.normalized();
    const x = normalizedAxis.x, y = normalizedAxis.y, z = normalizedAxis.z;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const t = 1 - c;
    const tx = t * x, ty = t * y;

    // 创建旋转矩阵
    const rotationMatrix = Matrix4.create();
    const re = rotationMatrix.elements;

    re[0] = tx * x + c;
    re[1] = tx * y + s * z;
    re[2] = tx * z - s * y;
    re[3] = 0;

    re[4] = tx * y - s * z;
    re[5] = ty * y + c;
    re[6] = ty * z + s * x;
    re[7] = 0;

    re[8] = tx * z + s * y;
    re[9] = ty * z - s * x;
    re[10] = t * z * z + c;
    re[11] = 0;

    re[12] = 0;
    re[13] = 0;
    re[14] = 0;
    re[15] = 1;

    // 应用旋转
    this.multiply(rotationMatrix);
    Matrix4.release(rotationMatrix);

    return this;
  }

  /**
   * 绕X轴旋转
   * @param angle - 旋转角度（弧度）
   * @returns 旋转后的矩阵
   */
  rotateX (angle: number): this {
    const e = this.elements;
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    // 应用旋转变换
    const a10 = e[4], a11 = e[5], a12 = e[6], a13 = e[7];
    const a20 = e[8], a21 = e[9], a22 = e[10], a23 = e[11];

    // 第二行
    e[4] = a10 * c + a20 * s;
    e[5] = a11 * c + a21 * s;
    e[6] = a12 * c + a22 * s;
    e[7] = a13 * c + a23 * s;

    // 第三行
    e[8] = a10 * -s + a20 * c;
    e[9] = a11 * -s + a21 * c;
    e[10] = a12 * -s + a22 * c;
    e[11] = a13 * -s + a23 * c;

    return this;
  }

  /**
   * 绕Y轴旋转
   * @param angle - 旋转角度（弧度）
   * @returns 旋转后的矩阵
   */
  rotateY (angle: number): this {
    const e = this.elements;
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    // 应用旋转变换
    const a00 = e[0], a01 = e[1], a02 = e[2], a03 = e[3];
    const a20 = e[8], a21 = e[9], a22 = e[10], a23 = e[11];

    // 第一行
    e[0] = a00 * c - a20 * s;
    e[1] = a01 * c - a21 * s;
    e[2] = a02 * c - a22 * s;
    e[3] = a03 * c - a23 * s;

    // 第三行
    e[8] = a00 * s + a20 * c;
    e[9] = a01 * s + a21 * c;
    e[10] = a02 * s + a22 * c;
    e[11] = a03 * s + a23 * c;

    return this;
  }

  /**
   * 绕Z轴旋转
   * @param angle - 旋转角度（弧度）
   * @returns 旋转后的矩阵
   */
  rotateZ (angle: number): this {
    const e = this.elements;
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    // 应用旋转变换
    const a00 = e[0], a01 = e[1], a02 = e[2], a03 = e[3];
    const a10 = e[4], a11 = e[5], a12 = e[6], a13 = e[7];

    // 第一行
    e[0] = a00 * c + a10 * s;
    e[1] = a01 * c + a11 * s;
    e[2] = a02 * c + a12 * s;
    e[3] = a03 * c + a13 * s;

    // 第二行
    e[4] = a10 * c - a00 * s;
    e[5] = a11 * c - a01 * s;
    e[6] = a12 * c - a02 * s;
    e[7] = a13 * c - a03 * s;

    return this;
  }

  /**
   * 应用缩放变换
   * @param v - 缩放向量
   * @returns 缩放后的矩阵
   */
  scale (v: Vector3): this {
    const e = this.elements;
    const x = v.x, y = v.y, z = v.z;

    e[0] *= x; e[4] *= y; e[8] *= z;
    e[1] *= x; e[5] *= y; e[9] *= z;
    e[2] *= x; e[6] *= y; e[10] *= z;
    e[3] *= x; e[7] *= y; e[11] *= z;

    return this;
  }

  /**
   * 创建一个从指定位置朝向目标的视图矩阵
   * @param eye - 摄像机位置
   * @param target - 目标位置
   * @param up - 上方向向量
   * @returns 视图矩阵
   */
  lookAt (eye: Vector3, target: Vector3, up: Vector3): this {
    const z = Vector3.subtract(eye, target).normalize();

    if (z.lengthSquared() === 0) {
      z.z = 1;
    }

    const x = Vector3.cross(up, z).normalize();

    if (x.lengthSquared() === 0) {
      z.x += 0.0001;
      x.copyFrom(Vector3.cross(up, z).normalize());
    }

    const y = Vector3.cross(z, x);

    const e = this.elements;

    e[0] = x.x; e[4] = y.x; e[8] = z.x; e[12] = eye.x;
    e[1] = x.y; e[5] = y.y; e[9] = z.y; e[13] = eye.y;
    e[2] = x.z; e[6] = y.z; e[10] = z.z; e[14] = eye.z;
    e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;

    return this.invert();
  }

  /**
   * 矩阵转置
   * @returns 转置后的矩阵
   */
  transpose (): this {
    const e = this.elements;
    let tmp;

    tmp = e[1]; e[1] = e[4]; e[4] = tmp;
    tmp = e[2]; e[2] = e[8]; e[8] = tmp;
    tmp = e[3]; e[3] = e[12]; e[12] = tmp;
    tmp = e[6]; e[6] = e[9]; e[9] = tmp;
    tmp = e[7]; e[7] = e[13]; e[13] = tmp;
    tmp = e[11]; e[11] = e[14]; e[14] = tmp;

    return this;
  }

  /**
   * 从欧拉角创建旋转矩阵
   * @param x - X轴旋转角度（弧度）
   * @param y - Y轴旋转角度（弧度）
   * @param z - Z轴旋转角度（弧度）
   * @param order - 旋转顺序，默认为'XYZ'
   * @returns 旋转矩阵
   */
  setFromEuler (x: number, y: number, z: number, order = 'XYZ'): this {
    this.identity();

    switch (order) {
      case 'XYZ':
        return this.rotateX(x).rotateY(y).rotateZ(z);
      case 'YXZ':
        return this.rotateY(y).rotateX(x).rotateZ(z);
      case 'ZXY':
        return this.rotateZ(z).rotateX(x).rotateY(y);
      case 'ZYX':
        return this.rotateZ(z).rotateY(y).rotateX(x);
      case 'YZX':
        return this.rotateY(y).rotateZ(z).rotateX(x);
      case 'XZY':
        return this.rotateX(x).rotateZ(z).rotateY(y);
      default:
        console.warn(`Matrix4: Unsupported rotation order: ${order}, fallback to 'XYZ'`);

        return this.rotateX(x).rotateY(y).rotateZ(z);
    }
  }

  /**
   * 从对象池获取一个 Matrix4 实例
   */
  static create (): Matrix4 {
    if (matrix4PoolIndex < matrix4Pool.length) {
      return matrix4Pool[matrix4PoolIndex++].identity();
    }

    return new Matrix4();
  }

  /**
   * 将 Matrix4 实例释放回对象池
   */
  static release (matrix: Matrix4): void {
    if (matrix4PoolIndex > 0 && matrix4Pool.length < MATRIX4_POOL_SIZE) {
      matrix4PoolIndex--;
      matrix4Pool[matrix4PoolIndex] = matrix;
    }
  }

  /**
   * 预分配对象池
   */
  static preallocate (count: number): void {
    const initialSize = matrix4Pool.length;

    for (let i = 0; i < count && matrix4Pool.length < MATRIX4_POOL_SIZE; i++) {
      matrix4Pool.push(new Matrix4());
    }
    console.debug(`Matrix4池：从${initialSize}增加到${matrix4Pool.length}`);
  }

  /**
   * 清空对象池
   */
  static clearPool (): void {
    matrix4Pool.length = 0;
    matrix4PoolIndex = 0;
  }

  /**
   * 获取矩阵元素数组
   */
  getElements (): Float32Array {
    return this.elements;
  }

  /**
   * 矩阵乘法，将两个矩阵相乘并将结果存储在目标矩阵中
   * @param a - 第一个矩阵
   * @param b - 第二个矩阵
   * @param target - 目标矩阵，用于存储结果
   * @returns 目标矩阵
   */
  static multiply (a: Matrix4, b: Matrix4, target: Matrix4): Matrix4 {
    const ae = a.getElements();
    const be = b.getElements();
    const te = target.getElements();

    const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
    const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
    const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
    const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

    const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
    const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
    const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
    const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

    te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;

    te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;

    te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;

    te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
    te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
    te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
    te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

    return target;
  }

  /**
   * 分解矩阵为位置、旋转和缩放
   * @param position - 用于存储位置的向量
   * @param rotation - 用于存储旋转的四元数
   * @param scale - 用于存储缩放的向量
   * @returns 返回自身，用于链式调用
   */
  decompose (position: Vector3, rotation: Quaternion, scale: Vector3): this {
    const e = this.elements;

    // 提取位置
    position.x = e[12];
    position.y = e[13];
    position.z = e[14];

    // 创建临时变量用于计算
    const matrix = this.clone();
    const me = matrix.elements;

    // 移除平移部分
    me[12] = 0;
    me[13] = 0;
    me[14] = 0;
    me[15] = 1;

    // 提取缩放
    // 计算矩阵各列的长度
    const sx = new Vector3(me[0], me[1], me[2]).length();
    const sy = new Vector3(me[4], me[5], me[6]).length();
    const sz = new Vector3(me[8], me[9], me[10]).length();

    scale.x = sx;
    scale.y = sy;
    scale.z = sz;

    // 移除缩放
    if (sx !== 0) {
      me[0] /= sx;
      me[1] /= sx;
      me[2] /= sx;
    }
    if (sy !== 0) {
      me[4] /= sy;
      me[5] /= sy;
      me[6] /= sy;
    }
    if (sz !== 0) {
      me[8] /= sz;
      me[9] /= sz;
      me[10] /= sz;
    }

    // 此时矩阵只包含旋转信息，提取旋转四元数
    rotation.setFromRotationMatrix(matrix);

    return this;
  }

  /**
   * 创建一个朝向指定方向的旋转矩阵
   * @param forward - 前方向向量
   * @param up - 上方向向量
   * @returns 返回自身，用于链式调用
   */
  setLookRotation (forward: Vector3, up: Vector3): this {
    // 确保前方向是单位向量
    const f = forward.normalized();

    // 计算右方向（确保与上方向垂直）
    const r = Vector3.cross(up, f).normalized();

    // 重新计算上方向（确保三个方向互相垂直）
    const u = Vector3.cross(f, r).normalized();

    const e = this.elements;

    // 构建旋转矩阵
    e[0] = r.x;
    e[4] = r.y;
    e[8] = r.z;
    e[1] = u.x;
    e[5] = u.y;
    e[9] = u.z;
    e[2] = f.x;
    e[6] = f.y;
    e[10] = f.z;

    // 保持平移和缩放不变
    return this;
  }
}
