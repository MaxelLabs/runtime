import type { Euler } from './euler';
import type { Matrix4 } from './matrix4';
import { Vector3 } from './vector3';
import type { Vector4 } from './vector4';
import type { Vector4Like } from './type';
/**
 * 四元数
 */
export declare class Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
    private static readonly tempVec0;
    /**
     * 构造函数
     * @param [x=0] - x 分量
     * @param [y=0] - y 分量
     * @param [z=0] - z 分量
     * @param [w=1] - w 分量
     */
    constructor(x?: number, y?: number, z?: number, w?: number);
    /**
     * 四元数设置
     * @param x - x 分量
     * @param y - y 分量
     * @param z - z 分量
     * @param w - w 分量
     * @returns 四元数
     */
    set(x: number, y: number, z: number, w: number): this;
    /**
     * 通过欧拉角设置四元数
     * @param euler - 欧拉角
     * @returns
     */
    setFromEuler(euler: Euler): this;
    /**
     * 通过旋转轴和旋转角度设置四元数
     * @param axis - 旋转轴
     * @param angle - 旋转角度（弧度）
     * @returns
     */
    setFromAxisAngle(axis: Vector3, angle: number): this;
    /**
     * 通过 Vector4Like 创建四元数
     * @param v - Vector4Like
     * @returns
     */
    setFromVector4(v: Vector4Like): this;
    /**
     * 通过数组设置四元数
     * @param array - 数组
     * @param [offset=0] - 起始偏移值
     * @returns
     */
    setFromArray(array: number[], offset?: number): this;
    /**
     * 通过矩阵设置四元数
     * @param m - 矩阵
     * @returns
     */
    setFromRotationMatrix(m: Matrix4): this;
    /**
     * 通过开始和结束向量设置四元数
     * @param from - 开始向量
     * @param to - 结束向量
     * @returns
     */
    setFromUnitVectors(from: Vector3, to: Vector3): this;
    /**
     * 四元数拷贝
     * @param quat - 拷贝目标四元数
     * @returns 拷贝四元数
     */
    copyFrom(quat: Quaternion | Vector4Like): this;
    /**
     * 四元数克隆
     * @returns 克隆结果
     */
    clone(): Quaternion;
    /**
     * 四元数间的夹角计算
     * @param other - 其他四元数
     * @returns 夹角
     */
    angleTo(other: Quaternion): number;
    /**
     * 四元数向目标旋转
     * @param q - 四元数
     * @param step - 旋转弧度
     * @returns 目标四元数
     */
    rotateTowards(q: Quaternion, step: number): this;
    /**
     * 四元数单位化
     * @returns 单位四元数
     */
    identity(): this;
    /**
     * 四元数求逆
     * @returns 四元数的逆
     */
    invert(): this;
    /**
     * 四元数取负
     * @returns 负四元数
     */
    negate(): this;
    /**
     * 四元数求共轭值
     * @returns 四元数的共轭值
     */
    conjugate(): this;
    /**
     * 四元数点乘结果
     * @param v
     * @return
     */
    dot(v: Quaternion): number;
    /**
     * 四元数的模平方
     * @return
     */
    lengthSquared(): number;
    /**
     * 四元数的欧式长度
     * @returns 长度
     */
    length(): number;
    /**
     * 四元数归一化
     * @returns 归一化值
     */
    normalize(): this;
    /**
     * 四元数右乘
     * @param right - 右乘的四元数
     * @returns
     */
    multiply(right: Quaternion): this;
    /**
     * 四元数左乘
     * @param left - 左乘的四元数
     * @returns
     */
    premultiply(left: Quaternion): this;
    /**
     * 四元数乘法
     * @param left - 四元数
     * @param right - 四元数
     * @returns 四元数
     */
    multiplyQuaternions(left: Quaternion, right: Quaternion): this;
    /**
     * 四元数线性插值
     * @see http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/
     * @param other - 四元数
     * @param t - 插值比
     * @returns 插值结果
     */
    slerp(other: Quaternion, t: number): this;
    /**
     * 两个四元数的线性插值
     * @param qa - 四元数
     * @param qb - 四元数
     * @param t - 插值比
     */
    slerpQuaternions(qa: Quaternion, qb: Quaternion, t: number): void;
    /**
     * 通过四元数旋转向量
     * @param v - 待旋转向量
     * @param [out] - 旋转结果，如果没有传入直接覆盖输入值
     * @returns
     */
    rotateVector3(v: Vector3, out?: Vector3): Vector3;
    /**
     * 四元数判等
     * @param quaternion - 四元数
     * @returns 判等结果
     */
    equals(quaternion: Quaternion): boolean;
    /**
     * 四元数保存为数组
     * @returns
     */
    toArray(): [x: number, y: number, z: number, w: number];
    /**
     * 四元数转四维向量数组
     * @param vec - 目标保存对象
     * @returns 保存结果
     */
    toVector4(vec: Vector4): Vector4;
    /**
     * 四元数转欧拉角
     * @param euler - 目标欧拉角
     * @returns 欧拉角
     */
    toEuler(euler: Euler): Euler;
    /**
     * 四元数转矩阵
     * @param mat - 目标矩阵
     * @returns
     */
    toMatrix4(mat: Matrix4): Matrix4;
    /**
     * 通过欧拉角创建四元数
     * @param euler - 欧拉角
     * @returns 四元数
     */
    static fromEuler(euler: Euler): Quaternion;
    /**
     * 通过旋转轴和旋转角度创建四元数
     * @param axis - 旋转轴
     * @param angle - 旋转角（弧度值）
     * @returns 四元数
     */
    static fromAxisAngle(axis: Vector3, angle: number): Quaternion;
    /**
     * 通过 Vector4Like 创建四元数
     * @param v - Vector4Like
     * @returns 四元数
     */
    static fromVector4(v: Vector4Like): Quaternion;
    /**
     * 通过数组创建四元数
     * @param array - 数组
     * @param [offset=0] - 起始偏移值
     * @returns 四元数
     */
    static fromArray(array: number[], offset?: number): Quaternion;
    /**
     * 通过旋转矩阵创建四元数
     * @param m - 旋转矩阵
     * @returns 四元数
     */
    static fromRotationMatrix(m: Matrix4): Quaternion;
    /**
     * 通过开始和结束向量创建四元数
     * @param from - 开始向量
     * @param to - 结束向量
     * @returns
     */
    static fromUnitVectors(from: Vector3, to: Vector3): Quaternion;
}
