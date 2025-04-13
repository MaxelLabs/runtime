import type { Matrix4 } from './matrix4';
import type { Sphere } from './sphere';
import { Vector3 } from './vector3';
/**
 * 三维包围盒
 */
export declare class Box3 {
    min: Vector3;
    max: Vector3;
    /**
     * 构造函数，传入值为空时表示空包围盒
     * @param [min=new Vector3(Infinity)] - 最小角点
     * @param [max=new Vector3(-Infinity)] - 最大角点
     */
    constructor(min?: Vector3, max?: Vector3);
    /**
     * 设置三维包围盒的值
     * @param min - 三维包围盒最小点
     * @param max - 三维包围盒最大点
     * @returns
     */
    set(min: Vector3, max: Vector3): this;
    /**
     * 通过数组构建三维包围盒
     * @param array - 数组集合（每三个数视为一个三维空间点）
     * @returns 三维包围盒
     */
    setFromArray(array: number[]): this;
    /**
     * 通过三维空间点构建三维包围盒
     * @param points - 三维空间点集合
     * @returns 三维包围盒
     */
    setFromPoints(points: Vector3[]): this;
    /**
     * 通过三维空间点（包围盒中心）和大小确定包围盒
     * @param center - 三维包围盒中心点
     * @param size - 三维包围盒大小值
     * @returns 三维包围盒
     */
    setFromCenterAndSize(center: Vector3, size: Vector3): this;
    /**
     * 通过实体构建包围盒
     * @param object - 构件实体
     * @returns 三维包围盒
     */
    setFromObject(object: any): this;
    /**
     * 克隆三维包围盒
     * @returns 克隆结果
     */
    clone(): Box3;
    /**
     * 复制三维包围盒
     * @param box - 复制对象
     * @returns 复制结果
     */
    copyFrom(box: Box3): this;
    /**
     * 三维包围盒置空
     * @returns 置空结果
     */
    makeEmpty(): this;
    /**
     * 三维包围盒判空
     * @returns 判空结果
     */
    isEmpty(): boolean;
    /**
     * 获取三维包围盒中心
     * @param [target=new Vector3()]
     * @returns
     */
    getCenter(target?: Vector3): Vector3;
    /**
     * 获取三维包围盒大小
     * @param [target=new Vector3()] - 结果保存对象
     * @returns 三维包围盒大小
     */
    getSize(target?: Vector3): Vector3;
    /**
     * 通过三维空间点扩展三维包围盒
     * @param point - 三维空间点
     * @returns 扩展结果
     */
    expandByPoint(point: Vector3): this;
    /**
     * 通过三维向量扩展三维包围盒
     * @param vector - 三维向量
     * @returns 扩展结果
     */
    expandByVector(vector: Vector3): this;
    /**
     * 通过实数扩展三维包围盒
     * @param scalar - 扩展大小
     * @returns 扩展结果
     */
    expandByScalar(scalar: number): this;
    /**
     * 通过包围盒扩展三维包围盒
     * @param box
     * @returns
     */
    expandByBox(box: Box3): this;
    /**
     * 通过实体扩展三维包围盒
     * @param object - 构件实体
     * @returns 扩展结果
     */
    expandByObject(object: any): this;
    /**
     * 判断三维包围盒相交关系(if this intersect other)
     * @param point - 三维空间点
     * @returns 点包含判断结果
     */
    containsPoint(point: Vector3): boolean;
    /**
     * 判断三维包围盒与三维包围盒的包含关系
     * @param other - 三维包围盒
     * @returns 包围盒包含结果（true 表示包含 other, false 表示不包含 other）
     */
    containsBox(other: Box3): boolean;
    /**
     * 获取点在三维包围盒的比例位置
     * @param point - 三维空间点
     * @param [target=new Vector3()] - 结果保存对象
     * @returns 点在包围盒比例位置
     */
    getParameter(point: Vector3, target?: Vector3): Vector3;
    /**
     * 判断三维包围盒相交关系(if this intersect other)
     * @param other - 三维包围盒
     * @returns 相交判断结果
     */
    intersectsBox(other: Box3): boolean;
    /**
     * 判断三维包围盒和球是否相交
     * @param sphere
     * @returns
     */
    intersectsSphere(sphere: Sphere): boolean;
    /**
     * 求点与三维包围盒的最近点
     * @param point - 三维空间点
     * @param [target=new Vector3()] - 结果存放对象
     * @returns 计算结果
     */
    clampPoint(point: Vector3, target?: Vector3): Vector3;
    /**
     * 三维空间点到三维包围盒的距离
     * @param point - 三维包围盒
     * @returns 距离结果
     */
    distanceToPoint(point: Vector3): number;
    /**
     * 三维包围盒求交集
     * @param box - 三维包围盒
     * @returns 求交结果
     */
    intersect(box: Box3): this;
    /**
     * 三维包围盒求并集
     * @param box - 三维包围盒
     * @returns 求并结果
     */
    union(box: Box3): this;
    /**
     * 通过三维变换矩阵变化三维包围盒
     * @param matrix - 三维变换矩阵
     * @returns 变换结果
     */
    applyMatrix4(matrix: Matrix4, center?: Vector3): this;
    getOBBPoints(matrix: Matrix4, center?: Vector3): Vector3[];
    /**
     * 通过包围盒获取包围球
     * @param target
     * @returns
     */
    getBoundingSphere(target: Sphere): Sphere;
    /**
     * 三维包围盒位移
     * @param offset - 三维位移向量
     * @returns 位移结果
     */
    translate(offset: Vector3): this;
    /**
     * 三维包围盒判等
     * @param other - 三维包围盒
     * @returns 判等结果
     */
    equals(other: Box3): boolean;
}
//# sourceMappingURL=box3.d.ts.map