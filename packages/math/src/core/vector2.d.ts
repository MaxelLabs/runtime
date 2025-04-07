import type { Vector2DataType, Vector2Like, vec2 } from './type';
/**
 * 二维向量
 */
export declare class Vector2 {
    x: number;
    y: number;
    /**
     * 二维向量的常量
     */
    static readonly ONE: Vector2;
    static readonly ZERO: Vector2;
    /**
     * 构造函数，默认为零向量
     * @param [x=0] - x 分量
     * @param [y=0] - y 分量
     */
    constructor(x?: number, y?: number);
    /**
     * 设置向量
     * @param x - x 轴分量
     * @param y - y 轴分量
     * @returns
     */
    set(x: number, y: number): this;
    /**
     * 设置零向量
     * @returns 向量
     */
    setZero(): this;
    /**
     * 通过标量数值创建向量
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
    setFromArray(array: Vector2DataType, offset?: number): this;
    /**
     * 拷贝向量
     * @param src - 要拷贝的对象
     * @returns 向量
     */
    copyFrom(src: Vector2Like): this;
    /**
     * 克隆向量
     * @returns 克隆结果
     */
    clone(): Vector2;
    /**
     * 根据下标设置元素值
     * @param index - 下标值
     * @param value - 数字
     * @returns 向量
     */
    setElement(index: number, value: number): this;
    /**
     * 根据下标获取值
     * @param index - 下标
     * @returns 值
     */
    getElement(index: number): number;
    /**
     * 向量相加
     * @param right - 向量 | 数字
     * @returns 向量
     */
    add(right: number | vec2 | Vector2): this;
    /**
     * 向量相加
     * @param left - 向量
     * @param right - 向量
     * @returns 相加结果
     */
    addVectors(left: Vector2, right: Vector2): this;
    /**
     * 向量相减
     * @param right - 向量 |  数字
     * @returns 相减结果
     */
    subtract(right: number | vec2 | Vector2): this;
    /**
     * 向量相减
     * @param left - 向量
     * @param right - 向量
     * @returns 相减结果
     */
    subtractVectors(left: Vector2, right: Vector2): this;
    /**
     * 向量相乘
     * @param right - 向量 | 数字
     * @returns 相乘结果
     */
    multiply(right: number | vec2 | Vector2): this;
    /**
     * 向量相乘
     * @param left - 向量
     * @param right - 向量
     * @returns 相乘结果
     */
    multiplyVectors(left: Vector2, right: Vector2): this;
    /**
     * 向量相除
     * @param right - 向量 | 数字
     * @returns 相除结果
     */
    divide(right: number | vec2 | Vector2): this;
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
     * @param v - 向量
     * @returns 最小值
     */
    min(v: Vector2 | number): this;
    /**
     * 向量求最大值
     * @param v - 向量
     * @returns 最大值
     */
    max(v: Vector2 | number): this;
    /**
     * 向量阈值约束
     * @param min - 极小值
     * @param max - 极大值
     * @returns 向量
     */
    clamp(min: Vector2 | number, max: Vector2 | number): this;
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
     * 向量取四舍五入
     * @returns 四舍五入结果
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
     * 向量长度
     * @returns 求值结果
     */
    length(): number;
    /**
     * 向量长度平方
     * @returns 求值结果
     */
    lengthSquared(): number;
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
     * 向量线性插值
     * @param other - 向量
     * @param alpha - 插值比
     * @returns 计算结果
     */
    lerp(other: Vector2, alpha: number): this;
    /**
     * 向量线性插值
     * @param v1 - 向量
     * @param v2 - 向量
     * @param alpha - 插值比
     * @returns 计算结果
     */
    lerpVectors(v1: Vector2, v2: Vector2, alpha: number): this;
    /**
     * 向量点乘
     * @param v - 向量
     * @returns 点乘结果
     */
    dot(v: Vector2): number;
    /**
     * 向量叉乘
     * @param v - 向量
     * @returns 叉乘结果
     */
    cross(v: Vector2): number;
    /**
     * 点距离
     * @param v - 点
     * @returns 距离
     */
    distance(v: Vector2): number;
    /**
     * 点距离平方
     * @param v - 点
     * @returns 距离平方
     */
    distanceSquared(v: Vector2): number;
    /**
     * 向量判等
     * @param v - 向量
     * @returns 判等结果
     */
    equals(v: Vector2): boolean;
    /**
     * 是否零向量
     * @returns 是否零向量
     */
    isZero(): boolean;
    /**
     * 向量转数组
     * @returns 数组
     */
    toArray(): [x: number, y: number];
    fill(array: number[] | Float32Array, offset?: number): void;
    /**
     * 随机生成向量
     * @returns 向量
     */
    random(): this;
    /**
     * 通过标量创建向量
     * @param num - 数值
     * @returns 向量
     */
    static fromNumber(num: number): Vector2;
    /**
     * 通过数组创建向量
     * @param array - 数组
     * @param [offset=0] - 起始偏移值
     * @returns 向量
     */
    static fromArray(array: Vector2DataType, offset?: number): Vector2;
}
