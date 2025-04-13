import { Vector3 } from './vector3';
import type { Vector4 } from './vector4';
import type { Quaternion } from './quaternion';
import type { mat4 } from './type';
/**
 * 四阶矩阵（列优先矩阵）
 */
export declare class Matrix4 {
    static readonly IDENTITY: Readonly<Matrix4>;
    static readonly ZERO: Readonly<Matrix4>;
    private static readonly tempVec0;
    private static readonly tempVec1;
    private static readonly tempVec2;
    private static readonly tempMat0;
    /**
     * 使用Float32Array存储矩阵元素，提高内存访问效率
     */
    private elements;
    constructor();
    /**
     * 设置单位矩阵
     */
    identity(): this;
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
    set(m11: number, m21: number, m31: number, m41: number, m12: number, m22: number, m32: number, m42: number, m13: number, m23: number, m33: number, m43: number, m14: number, m24: number, m34: number, m44: number): this;
    /**
     * 矩阵克隆
     * @returns 克隆结果
     */
    clone(): Matrix4;
    /**
     * 矩阵复制
     * @param m - 复制对象
     * @returns 复制结果
     */
    copyFrom(m: Matrix4): this;
    /**
     * 矩阵乘法（优化版本）
     */
    multiply(m: Matrix4): this;
    /**
     * 矩阵求逆（优化版本）
     */
    invert(): this;
    /**
     * 设置为零矩阵
     * @returns 矩阵
     */
    setZero(): this;
    /**
     * 矩阵转数组 - 优化为直接返回Float32Array的拷贝
     * @returns 数组
     */
    toArray(): mat4;
    /**
     * 将矩阵数据填充到目标数组
     * @param array 目标数组
     * @param offset 起始偏移值
     */
    fill(array: number[] | Float32Array, offset?: number): void;
    /**
     * 矩阵变换点
     * @param v - 输入点
     * @param out - 输出点，如果没有设置就直接返回新的点
     * @returns 变换结果
     */
    transformPoint(v: Vector3, out?: Vector3): Vector3;
    /**
     * 矩阵变换向量(不包括平移部分)
     * @param v - 输入向量
     * @param out - 输出向量，如果没有设置就直接返回新的向量
     * @returns 变换结果
     */
    transformVector(v: Vector3, out?: Vector3): Vector3;
    /**
     * 矩阵变换四维向量
     * @param v - 输入向量
     * @param out - 输出向量，如果没有设置就直接返回新的向量
     * @returns 变换结果
     */
    transformVector4(v: Vector4, out?: Vector4): Vector4;
    /**
     * 矩阵变换法向量
     * @param v - 输入法向量
     * @param out - 输出法向量，如果没有设置就直接返回新的向量
     * @returns 变换结果
     */
    transformNormal(v: Vector3, out?: Vector3): Vector3;
    /**
     * 通过位置、旋转和缩放组合成一个变换矩阵
     * @param position - 位置
     * @param rotation - 旋转
     * @param scale - 缩放
     * @returns 变换矩阵
     */
    compose(position: Vector3, rotation: Quaternion, scale: Vector3): this;
    /**
     * 从对象池获取一个 Matrix4 实例
     */
    static create(): Matrix4;
    /**
     * 将 Matrix4 实例释放回对象池
     */
    static release(matrix: Matrix4): void;
    /**
     * 预分配对象池
     */
    static preallocate(count: number): void;
    /**
     * 清空对象池
     */
    static clearPool(): void;
    /**
     * 获取矩阵元素数组
     */
    getElements(): Float32Array;
}
//# sourceMappingURL=matrix4.d.ts.map