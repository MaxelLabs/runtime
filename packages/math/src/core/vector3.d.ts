import type { Matrix4 } from './matrix4';
import type { Vector3DataType, Vector3Like, vec3 } from './type';
import { Vector2 } from './vector2';
/**
 * 三维向量
 */
export declare class Vector3 {
    /**
     * 三维向量的常量
     */
    static readonly X: Readonly<Vector3>;
    static readonly Y: Readonly<Vector3>;
    static readonly Z: Readonly<Vector3>;
    static readonly ONE: Readonly<Vector3>;
    static readonly ZERO: Readonly<Vector3>;
    private elements;
    /**
     * 构造函数，默认值为零向量
     * @param [x=0]
     * @param [y=0]
     * @param [z=0]
     */
    constructor(x?: number, y?: number, z?: number);
    /**
     * x坐标访问器
     */
    get x(): number;
    set x(value: number);
    /**
     * y坐标访问器
     */
    get y(): number;
    set y(value: number);
    /**
     * z坐标访问器
     */
    get z(): number;
    set z(value: number);
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
     * 克隆向量，使用对象池
     * @returns 新的向量
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
     * @returns 向量分量
     */
    getElement(index: number): number;
    /**
     * 向量相加（优化版本）
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
     * 向量相减（优化版本）
     * @param right - 向量 | 数字
     * @returns 相减结果
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
     * @param right - 相乘对象，对象 | 数字
     * @returns 向量
     */
    multiply(right: number | vec3 | Vector3): this;
    /**
     * 向量相乘
     * @param left - 向量
     * @param right - 向量
     * @returns 向量
     */
    multiplyVectors(left: Vector3, right: Vector3): this;
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
     * 向量归一化（优化版本）
     */
    normalize(): this;
    /**
     * 向量求点积
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
     * 向量（a 与 b）求叉积（优化版本）
     * @param left - 向量
     * @param right - 向量
     * @returns 叉积结果
     */
    crossVectors(left: Vector3, right: Vector3): this;
    /**
     * 计算到另一个向量的距离
     * @param v 另一个向量
     * @returns 距离
     */
    distanceTo(v: Vector3): number;
    /**
     * 计算到另一个向量的距离平方
     * @param v 另一个向量
     * @returns 距离平方
     */
    distanceToSquared(v: Vector3): number;
    /**
     * 向量缩放
     * @param v - 数字
     * @returns 缩放结果
     */
    scale(v: number): this;
    /**
     * 向量转数组
     * @returns 数组
     */
    toArray(): [x: number, y: number, z: number];
    /**
     * 转换为Vector2类型
     * @returns Vector2对象
     */
    toVector2(): Vector2;
    /**
     * 将向量填充到数组
     * @param array 目标数组
     * @param offset 偏移值
     */
    fill(array: number[] | Float32Array, offset?: number): void;
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
     * 向量求最小值
     * @param v - 向量
     * @returns 最小值
     */
    min(v: Vector3 | number): this;
    /**
     * 向量求最大值
     * @param v - 向量
     * @returns 最大值
     */
    max(v: Vector3 | number): this;
    /**
     * 向量阈值约束
     * @param min - 极小值
     * @param max - 极大值
     * @returns 向量
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
     * @returns 取整结果
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
     * 设置向量长度
     * @param length - 长度
     * @returns 向量
     */
    setLength(length: number): this;
    /**
     * 向量线性插值
     * @param v - 向量
     * @param alpha - 插值比例
     * @returns 插值结果
     */
    lerp(v: Vector3, alpha: number): this;
    /**
     * 两向量间的线性插值
     * @param v1 - 第一个向量
     * @param v2 - 第二个向量
     * @param alpha - 插值比例
     * @returns 插值结果
     */
    lerpVectors(v1: Vector3, v2: Vector3, alpha: number): this;
    /**
     * 变换矩阵作用于向量
     * @param matrix - 变换矩阵
     * @returns 向量
     */
    applyMatrix(matrix: Matrix4): this;
    /**
     * 应用投影矩阵变换
     * @param matrix - 变换矩阵
     * @returns 向量
     */
    applyProjectionMatrix(matrix: Matrix4): this;
    /**
     * 应用法线变换矩阵
     * @param matrix - 变换矩阵
     * @returns 向量
     */
    applyNormalMatrix(matrix: Matrix4): this;
    /**
     * 从对象池获取或创建新的 Vector3 实例
     */
    static create(x?: number, y?: number, z?: number): Vector3;
    /**
     * 释放 Vector3 实例到对象池
     */
    static release(vector: Vector3): void;
    /**
     * 预分配对象池
     */
    static preallocate(count: number): void;
    /**
     * 清空对象池
     */
    static clearPool(): void;
}
//# sourceMappingURL=vector3.d.ts.map