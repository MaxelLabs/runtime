import type { Matrix4 } from './matrix4';
import type { Quaternion } from './quaternion';
import type { Matrix3DataType, mat3 } from './type';
import type { Vector3 } from './vector3';
/**
 * 三维矩阵（列优先矩阵）
 */
export declare class Matrix3 {
    /**
     * 矩阵值数组
     */
    elements: number[];
    /**
     * 构造函数，初始值为零矩阵
     * @param [m11=1] - 第 1 行，第 1 列
     * @param [m21=0] - 第 2 行，第 1 列
     * @param [m31=0] - 第 3 行，第 1 列
     * @param [m12=0] - 第 1 行，第 2 列
     * @param [m22=1] - 第 2 行，第 2 列
     * @param [m32=0] - 第 3 行，第 2 列
     * @param [m13=0] - 第 1 行，第 3 列
     * @param [m23=0] - 第 2 行，第 3 列
     * @param [m33=1] - 第 3 行，第 3 列
     */
    constructor(m11?: number, m21?: number, m31?: number, m12?: number, m22?: number, m32?: number, m13?: number, m23?: number, m33?: number);
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
    set(m11: number, m21: number, m31: number, m12: number, m22: number, m32: number, m13: number, m23: number, m33: number): this;
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
    setFromRowMajorData(m11: number, m12: number, m13: number, m21: number, m22: number, m23: number, m31: number, m32: number, m33: number): this;
    /**
     * 通过列向量设置矩阵
     * @param c1 - 第一列
     * @param c2 - 第二列
     * @param c3 - 第三列
     * @returns 矩阵
     */
    setFromColumnVectors(c1: Vector3, c2: Vector3, c3: Vector3): this;
    /**
     * 通过四阶矩阵设置三阶矩阵
     * @param m - 四阶矩阵
     * @returns 矩阵
     */
    setFromMatrix4(m: Matrix4): this;
    /**
     * 通过数组设置矩阵
     * @param array - 数组
     * @param [offset=0] - 起始偏移值
     * @returns 矩阵
     */
    setFromArray(array: Matrix3DataType, offset?: number): this;
    /**
     * 通过四元数设置矩阵
     * @param quat - 四元数
     * @returns 矩阵
     */
    setFromQuaternion(quat: Quaternion): this;
    /**
     * 矩阵清零
     * @returns 零矩阵
     */
    setZero(): this;
    /**
     * 矩阵单位化
     * @returns 单位矩阵
     */
    identity(): this;
    /**
     * 矩阵克隆
     * @returns 克隆结果
     */
    clone(): Matrix3;
    /**
     * 矩阵复制
     * @param m - 复制对象
     * @returns 复制结果
     */
    copyFrom(m: Matrix3): this;
    /**
     * 得到列向量
     * @param i - 列向量索引，从 0 开始
     * @returns 列向量
     */
    getColumnVector(i: number, v: Vector3): Vector3;
    /**
     * 矩阵缩放
     * @param sx - x 轴缩放分量
     * @param sy - y 轴缩放分量
     * @returns 缩放结果
     */
    scale(sx: number, sy: number): this;
    /**
     * 矩阵旋转
     * @param theta - 旋转角度（弧度）
     * @returns 旋转结果
     */
    rotate(theta: number): this;
    /**
     * 矩阵平移
     * @param x - x 轴平移分量
     * @param y - y 轴平移分量
     * @returns 平移结果
     */
    translate(x: number, y: number): this;
    /**
     * 矩阵右乘
     * @param right - 相乘矩阵
     * @returns 右乘结果
     */
    multiply(right: Matrix3 | number): this;
    /**
     * 矩阵左乘
     * @param left - 相乘矩阵
     * @returns 左乘结果
     */
    premultiply(left: Matrix3): this;
    /**
     * 矩阵乘法
     * @param left - 矩阵
     * @param right - 矩阵
     * @returns 相乘结果
     */
    multiplyMatrices(left: Matrix3, right: Matrix3): this;
    /**
     * 矩阵求行列式值
     * @returns 行列式结果
     */
    determinant(): number;
    /**
     * 矩阵求逆
     * @returns 逆矩阵
     */
    invert(): this;
    /**
     * 矩阵转置
     * @returns 转置结果
     */
    transpose(): this;
    /**
     * 对点进行矩阵变换
     * @param v - 输入点
     * @param out - 输出点，如果没有会覆盖输入的数据
     * @returns 变换后的结果
     */
    transformPoint(v: Vector3, out?: Vector3): Vector3;
    /**
     * 对法向量进行矩阵变换
     * @param v - 输入向量
     * @param out - 输出向量，如果没有会覆盖输入的数据
     * @returns 变换后的结果
     */
    transformNormal(v: Vector3, out?: Vector3): Vector3;
    /**
     * 矩阵判等
     * @param matrix - 矩阵
     * @returns 判等结果
     */
    equals(matrix: Matrix3): boolean;
    /**
     * 矩阵转为数组
     * @returns
     */
    toArray(): mat3;
    fill(array: number[] | Float32Array, offset?: number): void;
    /**
     * 创建单位阵
     * @returns 单位矩阵
     */
    static fromIdentity(): Matrix3;
    /**
     * 通过列向量创建矩阵
     * @param c1 - 第一列
     * @param c2 - 第二列
     * @param c3 - 第三列
     * @returns 矩阵
     */
    static fromColumnVectors(c1: Vector3, c2: Vector3, c3: Vector3): Matrix3;
    /**
     * 通过四阶矩阵创建矩阵（获取空间变换矩阵旋转缩放部分）
     * @param m - 四阶矩阵
     * @returns 矩阵
     */
    static fromMatrix4(m: Matrix4): Matrix3;
    /**
     * 通过数组创建矩阵
     * @param array - 数组（列优先）
     * @param [offset=0] - 起始偏移值
     * @returns 矩阵
     */
    static fromArray(array: Matrix3DataType, offset?: number): Matrix3;
    /**
     * 通过四元数创建矩阵
     * @param quat - 四元数
     * @returns 矩阵
     */
    static fromQuaternion(quat: Quaternion): Matrix3;
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
    static fromRowMajorData(m11: number, m12: number, m13: number, m21: number, m22: number, m23: number, m31: number, m32: number, m33: number): Matrix3;
}
