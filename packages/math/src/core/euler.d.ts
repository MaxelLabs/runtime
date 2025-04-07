import { Quaternion } from './quaternion';
import type { Vector3 } from './vector3';
import { Matrix4 } from './matrix4';
/**
 * 欧拉角顺序
 */
export declare enum EulerOrder {
    XYZ = 0,
    XZY = 1,
    YXZ = 2,
    YZX = 3,
    ZXY = 4,
    ZYX = 5
}
/**
 * 欧拉角
 */
export declare class Euler {
    x: number;
    y: number;
    z: number;
    order: EulerOrder;
    static readonly DEFAULT_ORDER = EulerOrder.ZYX;
    private static readonly tempQuat0;
    private static readonly tempMat0;
    /**
     * 构造函数，传入值为 x, y, z 方向分量以及欧拉角顺序
     * @param [x=0] - x 方向分量
     * @param [y=0] - y 方向分量
     * @param [z=0] - z 方向分量
     * @param [order=Euler.DEFAULT_ORDER] - 欧拉角顺序
     */
    constructor(x?: number, y?: number, z?: number, order?: EulerOrder);
    /**
     * 设置欧拉角
     * @param x - x 方向分量
     * @param y - y 方向分量
     * @param z - z 方向分量
     * @param [order] - 欧拉角顺序
     * @returns
     */
    set(x: number, y: number, z: number, order?: EulerOrder): this;
    setZero(order?: EulerOrder): this;
    /**
     * 通过矩阵设置欧拉角
     * @param m - 矩阵
     * @param [order] - 欧拉角顺序
     * @returns
     */
    setFromRotationMatrix4(m: Matrix4, order?: EulerOrder): this;
    /**
     * 通过四元数设置欧拉角
     * @param quat - 四元数
     * @param [order] - 欧拉角顺序
     * @returns
     */
    setFromQuaternion(quat: Quaternion, order?: EulerOrder): this;
    /**
     * 通过三维向量设置欧拉角
     * @param v - 三维向量
     * @param [order] - 欧拉角顺序
     * @returns
     */
    setFromVector3(v: Vector3, order?: EulerOrder): this;
    /**
     * 通过数组设置欧拉角
     * @param array - 数组
     * @param [offset=0] - 偏移
     * @param [order] - 欧拉角顺序
     * @returns
     */
    setFromArray(array: number[], offset?: number, order?: EulerOrder): this;
    /**
     * 克隆欧拉角
     * @returns 克隆结果
     */
    clone(): Euler;
    /**
     * 复制欧拉角
     * @param euler - 复制对象
     * @returns 复制结果
     */
    copyFrom(euler: Euler): this;
    add(euler: Euler): this;
    addEulers(left: Euler, right: Euler): this;
    negate(): this;
    /**
     * 修改欧拉角顺序
     * @param newOrder - 欧拉角顺序
     * @returns 修改结果
     */
    reorder(newOrder: EulerOrder): this;
    /**
     * 通过四元数旋转向量
     * @param v - 待旋转向量
     * @param out - 旋转结果，如果没有传入直接覆盖输入值
     * @returns
     */
    rotateVector3(v: Vector3, out?: Vector3): Vector3;
    /**
     * 欧拉角相等判断
     * @param euler - 欧拉角
     * @returns 判断结果
     */
    equals(euler: Euler): boolean;
    /**
     * 欧拉角保存于三维向量
     * @param vec - 目标保存对象
     * @returns 保存结果
     */
    toVector3(vec: Vector3): Vector3;
    /**
     * 欧拉角转数组
     * @returns 保存结果
     */
    toArray(): [x: number, y: number, z: number];
    /**
     * 欧拉角转四元数
     * @param quat - 目标四元数
     * @returns 目标四元数
     */
    toQuaternion(quat: Quaternion): Quaternion;
    /**
     * 欧拉角转矩阵
     * @param mat - 目标矩阵
     * @returns 返回目标矩阵
     */
    toMatrix4(mat: Matrix4): Matrix4;
    /**
     * 通过矩阵创建欧拉角
     * @param m - 矩阵
     * @param [order=Euler.DEFAULT_ORDER] - 欧拉角顺序
     * @returns 创建结果
     */
    static fromRotationMatrix4(m: Matrix4, order?: EulerOrder): Euler;
    /**
     * 通过四元数创建欧拉角
     * @param quat - 四元数
     * @param [order=Euler.DEFAULT_ORDER] - 欧拉角顺序
     * @returns 创建结果
     */
    static fromQuaternion(quat: Quaternion, order?: EulerOrder): Euler;
    /**
     * 通过三维向量创建欧拉角
     * @param v - 三维向量
     * @param [order=Euler.DEFAULT_ORDER] - 欧拉角顺序
     * @returns 创建结果
     */
    static fromVector3(v: Vector3, order?: EulerOrder): Euler;
    /**
     * 通过数组创建欧拉角
     * @param array - 数组
     * @param [offset=0] - 偏移
     * @param [order=Euler.DEFAULT_ORDER] - 欧拉角顺序
     * @returns 创建结果
     */
    static fromArray(array: number[], offset?: number, order?: EulerOrder): Euler;
}
