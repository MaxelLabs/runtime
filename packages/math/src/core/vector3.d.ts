import type { Euler } from './euler';
import type { Matrix3 } from './matrix3';
import type { Quaternion } from './quaternion';
import type { Matrix4 } from './matrix4';
import type { Vector3DataType, Vector3Like, vec3 } from './type';
import { Vector2 } from './vector2';
/**
 * 三维向量
 */
export declare class Vector3 {
    x: number;
    y: number;
    z: number;
    /**
     * 三维向量的常量
     */
    static readonly X: Vector3;
    static readonly Y: Vector3;
    static readonly Z: Vector3;
    static readonly ONE: Vector3;
    static readonly ZERO: Vector3;
    /**
     * 构造函数，默认值为零向量
     * @param [x=0]
     * @param [y=0]
     * @param [z=0]
     */
    constructor(x?: number, y?: number, z?: number);
    /**
     * 设置向量
     * @param x - x 轴分量
     * @param y - y 轴分量
     * @param z - z 轴分量
     * @returns 向量
     */
    set(x: number, y: number, z: number): this;
    /**
     * 设置零向量
     * @returns 向量
     */
    setZero(): this;
    /**
     * 通过标量数值设置向量
     * @param num - 数值
     * @returns 向量
     */
    setFromNumber(num: number): this;
    /**
     * 通过数组设置向量
     * @param array - 数组
     * @param [offset=0] - 起始偏移值
     * @returns 向量
     */
    setFromArray(array: Vector3DataType, offset?: number): this;
    /**
     * 拷贝向量
     * @param v - 要拷贝的对象
     * @returns 向量
     */
    copyFrom(v: Vector3Like): this;
    /**
     * 克隆向量
     * @returns 向量
     */
    clone(): Vector3;
    /**
     * 根据下标设置向量分量
     * @param index - 下标值
     * @param value - 数字
     * @returns 向量
     */
    setElement(index: number, value: number): this;
    /**
     * 根据下标获取向量分量
     * @param index - 下标
     * @returns
     */
    getElement(index: number): number;
    /**
     * 向量相加
     * @param right - 向量 | 数字
     * @returns 相加结果
     */
    add(right: number | vec3 | Vector3): this;
    /**
     * 向量相加
     * @param left - 向量
     * @param right - 向量
     * @returns 相加结果
     */
    addVectors(left: Vector3, right: Vector3): this;
    /**
     * 向量乘比例后相加
     * @param right - 向量
     * @param s - 比例
     * @returns 相加结果
     */
    addScaledVector(right: Vector3, s: number): this;
    /**
     * 向量相减
     * @param right - 向量 | 数字
     * @returns 相减
     */
    subtract(right: number | vec3 | Vector3): this;
    /**
     * 向量相减
     * @param left - 向量
     * @param right - 向量
     * @returns 相减结果
     */
    subtractVectors(left: Vector3, right: Vector3): this;
    /**
     * 向量相乘
     * @param right - 向量 | 数字
     * @returns 相乘结果
     */
    multiply(right: number | vec3 | Vector3): this;
    /**
     * 向量相乘
     * @param left - 向量
     * @param right - 向量
     * @returns 相乘结果
     */
    multiplyVectors(left: Vector3, right: Vector3): this;
    /**
     * 向量相除
     * @param right - 向量 | 数字
     * @returns 相除结果
     */
    divide(right: number | vec3 | Vector3): this;
    /**
     * 向量缩放
     * @param v - 数字
     * @returns 缩放结果
     */
    scale(v: number): this;
    /**
     * 分量求和
     * @returns 求和结果
     */
    sum(): number;
    /**
     * 向量求最小值
     * @param v - 向量或数值
     * @returns 求值结果
     */
    min(v: Vector3 | number): this;
    /**
     * 向量求最大值
     * @param v - 向量或数值
     * @returns 求值结果
     */
    max(v: Vector3 | number): this;
    /**
     * 向量阈值约束
     * @param min - 向量
     * @param max - 向量
     * @returns 求值结果
     */
    clamp(min: Vector3 | number, max: Vector3 | number): this;
    /**
     * 向量向下取整
     * @returns 取整结果
     */
    floor(): this;
    /**
     * 向量向上取整
     * @returns 取整结果
     */
    ceil(): this;
    /**
     * 向量四舍五入
     * @returns 计算结果
     */
    round(): this;
    /**
     * 向量取绝对值
     * @returns 向量
     */
    abs(): this;
    /**
     * 向量取反
     * @returns 向量
     */
    negate(): this;
    /**
     * 向量长度
     * @returns 长度
     */
    length(): number;
    /**
     * 向量长度平方
     * @returns 长度平方
     */
    lengthSquared(): number;
    /**
     * 向量归一化
     * @returns 向量
     */
    normalize(): this;
    /**
     * 设置向量长度
     * @param length - 长度
     * @returns 向量
     */
    setLength(length: number): this;
    /**
     * 向量间求线性插值
     * @param other - 向量
     * @param alpha - 插值比例
     * @returns 插值结果
     */
    lerp(other: Vector3, alpha: number): this;
    /**
     * 向量间求线性插值
     * @param v1 - 第一个向量
     * @param v2 - 第二个向量
     * @param alpha - 插值比例
     * @returns 求值结果
     */
    lerpVectors(v1: Vector3, v2: Vector3, alpha: number): this;
    /**
     * 向量求点积，点积为零表示两向量垂直
     * @param v - 向量
     * @returns 点积结果
     */
    dot(v: Vector3): number;
    /**
     * 向量求叉积
     * @param right - 向量
     * @returns 叉积结果
     */
    cross(right: Vector3): this;
    /**
     * 向量（a 与 b）求叉积
     * @param left - 向量
     * @param right - 向量
     * @returns 叉积结果
     */
    crossVectors(left: Vector3, right: Vector3): this;
    /**
     * 向量反射
     * @param normal - 法线
     * @returns 反射结果
     */
    reflect(normal: Vector3): this;
    /**
     * 计算向量距离
     * @param v - 向量
     * @returns 距离
     */
    distance(v: Vector3): number;
    /**
     * 计算向量距离平方
     * @param v - 向量
     * @returns 距离平方
     */
    distanceSquared(v: Vector3): number;
    /**
     * 向量判等
     * @param v - 向量
     * @returns 判等结果
     */
    equals(v: Vector3): boolean;
    /**
     * 是否零向量
     * @returns 是否零向量
     */
    isZero(): boolean;
    /**
     * 向量转数组
     * @param array - 目标保存对象
     * @returns 数组
     */
    toArray(): [x: number, y: number, z: number];
    toVector2(): Vector2;
    fill(array: number[] | Float32Array, offset?: number): void;
    /**
     * 获取随机向量
     * @returns
     */
    random(): this;
    /**
     * 用欧拉角旋转向量
     * @param euler - 欧拉角
     * @param [out] - 输出结果，如果没有就覆盖当前向量值
     * @returns 旋转结果
     */
    applyEuler(euler: Euler, out?: Vector3): Vector3;
    /**
     * 用四元数旋转向量
     * @param q - 四元数
     * @param [out] - 输出结果，如果没有就覆盖当前向量值
     * @returns 旋转结果
     */
    applyQuaternion(q: Quaternion, out?: Vector3): Vector3;
    /**
     * 用矩阵变换点
     * @param m - 变换矩阵
     * @param [out] - 输出结果，如果没有就覆盖当前向量值
     * @returns 结果点
     */
    applyMatrix(m: Matrix3 | Matrix4, out?: Vector3): Vector3;
    /**
     * 用法向量矩阵变换法向量
     * @param m - 法向量矩阵
     * @param [out] - 输出结果，如果没有就覆盖当前向量值
     * @returns 向量
     */
    applyNormalMatrix(m: Matrix3 | Matrix4, out?: Vector3): Vector3;
    /**
     * 用投影矩阵变换点
     * @param m - 投影矩阵
     * @param [out] - 输出结果，如果没有就覆盖当前向量值
     * @returns 结果点
     */
    applyProjectionMatrix(m: Matrix4, out?: Vector3): Vector3;
    /**
     * 通过标量数值创建向量
     * @param num - 数值
     * @returns 向量
     */
    static fromNumber(num: number): Vector3;
    /**
     * 通过数组创建向量
     * @param array - 数组
     * @param [offset=0] - 起始偏移值
     * @returns 向量
     */
    static fromArray(array: Vector3DataType, offset?: number): Vector3;
}
