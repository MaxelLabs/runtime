import type { Matrix4 } from './matrix4';
import type { Vector4DataType, Vector4Like, vec4 } from './type';
import { Vector3 } from './vector3';
/**
 * 四维向量
 */
export declare class Vector4 {
    x: number;
    y: number;
    z: number;
    w: number;
    /**
     * 四维向量的常量
     */
    static readonly ONE: Vector4;
    static readonly ZERO: Vector4;
    /**
     * 构造函数
     * @param [x=0] - x 轴分量
     * @param [y=0] - y 轴分量
     * @param [z=0] - z 轴分量
     * @param [w=1] - w 轴分量
     */
    constructor(x?: number, y?: number, z?: number, w?: number);
    /**
     * 设置向量
     * @param x - x 轴分量
     * @param y - y 轴分量
     * @param z - z 轴分量
     * @param w - w 轴分量
     * @returns
     */
    set(x: number, y: number, z: number, w: number): this;
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
     * 通过数组创建向量
     * @param array - 数组
     * @param [offset=0] - 起始偏移值
     * @returns 向量
     */
    setFromArray(array: Vector4DataType, offset?: number): this;
    /**
     * 拷贝向量
     * @param v - 复制对象
     * @returns 拷贝结果
     */
    copyFrom(v: Vector4Like): this;
    /**
     * 克隆向量
     * @returns 克隆结果
     */
    clone(): Vector4;
    /**
     * 根据下标设置向量分量
     * @param index - 下标值
     * @param value - 分量值
     * @returns 向量
     */
    setElement(index: number, value: number): this;
    /**
     * 根据下标获取向量分量
     * @param index - 下标
     * @returns 分量值
     */
    getElement(index: number): number;
    /**
     * 向量相加
     * @param right - 相加对象，向量 | 数字
     * @returns 相加结果
     */
    add(right: number | vec4 | Vector4): this;
    /**
     * 向量相加
     * @param left - 向量
     * @param right - 向量
     * @returns 求和结果
     */
    addVectors(left: Vector4, right: Vector4): this;
    /**
     * 向量比例缩放后相加
     * @param right - 向量
     * @param s - 比例
     * @returns 求和结果
     */
    addScaledVector(right: Vector4, s: number): this;
    /**
     * 向量相减
     * @param right - 相减对象，向量 | 数字
     * @returns 相减结果
     */
    subtract(right: number | vec4 | Vector4): this;
    /**
     * 向量相减
     * @param left - 向量
     * @param right - 向量
     * @returns 向量
     */
    subtractVectors(left: Vector4, right: Vector4): this;
    /**
     * 向量相乘
     * @param right - 相乘对象，对象 | 数字
     * @returns 向量
     */
    multiply(right: number | vec4 | Vector4): this;
    /**
     * 向量相乘
     * @param left - 向量
     * @param right - 向量
     * @returns 向量
     */
    multiplyVectors(left: Vector4, right: Vector4): this;
    /**
     * 向量相除
     * @param right - 相除对象，对象 | 数字
     * @returns 向量
     */
    divide(right: number | vec4 | Vector4): this;
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
     * @returns 最小值
     */
    min(v: Vector4 | number): this;
    /**
     * 向量求最大值
     * @param v - 向量或数值
     * @returns 最大值
     */
    max(v: Vector4 | number): this;
    /**
     * 向量阈值约束
     * @param min - 最小值
     * @param max - 最大值
     * @returns 向量
     */
    clamp(min: Vector4 | number, max: Vector4 | number): this;
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
     * @returns 求值结果
     */
    round(): this;
    /**
     * 向量取绝对值
     * @returns 向量
     */
    abs(): this;
    /**
     * 向量取反
     * @returns 取反结果
     */
    negate(): this;
    /**
     * 向量长度平方
     * @returns 长度平方
     */
    lengthSquared(): number;
    /**
     * 向量长度
     * @returns 长度
     */
    length(): number;
    /**
     * 向量归一化
     * @returns 归一化结果
     */
    normalize(): this;
    /**
     * 设置向量长度
     * @param length - 长度
     * @returns 向量
     */
    setLength(length: number): this;
    /**
     * 向量求线性插值
     * @param v - 向量
     * @param alpha - 插值比例
     * @returns 插值结果
     */
    lerp(v: Vector4, alpha: number): this;
    /**
     * 两向量求线性插值
     * @param v1 - 第一个向量
     * @param v2 - 第二个向量
     * @param alpha - 插值比例
     * @returns 插值结果
     */
    lerpVectors(v1: Vector4, v2: Vector4, alpha: number): this;
    /**
     * 向量求点积
     * @param v - 向量
     * @returns 点积结果
     */
    dot(v: Vector4): number;
    /**
     * 向量判等
     * @param v - 向量
     * @returns 判等结果
     */
    equals(v: Vector4): boolean;
    /**
     * 是否零向量
     * @returns 是否零向量
     */
    isZero(): boolean;
    /**
     * 向量转数组
     * @returns 数组
     */
    toArray(): [x: number, y: number, z: number, z: number];
    toVector3(): Vector3;
    fill(array: number[] | Float32Array, offset?: number): void;
    /**
     * 生成随机向量
     * @returns 向量
     */
    random(): this;
    /**
     * 变换矩阵作用于向量
     * @param m - 变换矩阵
     * @param [out] - 输出结果，如果没有设置就直接覆盖当前值
     * @returns 向量
     */
    applyMatrix(m: Matrix4, out?: Vector4): Vector4;
    /**
     * 通过标量数值创建向量
     * @param num - 数值
     * @returns 向量
     */
    static fromNumber(num: number): Vector4;
    /**
     * 通过数组创建向量
     * @param array - 数组
     * @param [offset=0] - 起始偏移值
     * @returns 向量
     */
    static fromArray(array: Vector4DataType, offset?: number): Vector4;
}
//# sourceMappingURL=vector4.d.ts.map