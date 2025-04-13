import type { Matrix4 } from './matrix4';
import { Box3 } from './box3';
import { Vector3 } from './vector3';
/**
 * 球
 */
export declare class Sphere {
    center: Vector3;
    radius: number;
    /**
     * 构造函数
     * @param [center=Vector3.ZERO] - 球心，默认值为(0, 0, 0)
     * @param [radius=-1] - 半径
     */
    constructor(center?: Readonly<Vector3>, radius?: number);
    /**
     * 通过参数设置球
     * @param center - 球心
     * @param radius - 半径
     * @returns
     */
    set(center: Vector3, radius: number): this;
    /**
     * 通过空间点与球心设置球
     * @param points - 三维空间点
     * @param [optionalCenter] - 指定球心
     * @returns
     */
    setFromPoints(points: Vector3[], optionalCenter?: Vector3): this;
    /**
     * 复制球
     * @param sphere - 球信息
     * @returns 复制结果
     */
    copyFrom(sphere: Sphere): this;
    /**
     * 球判空
     * @returns 判空结果
     */
    isEmpty(): boolean;
    /**
     * 球置空
     * @returns 置空结果
     */
    makeEmpty(): this;
    /**
     * 三维空间点包围判断
     * @param point - 三维空间点
     * @returns 空间点包含判断
     */
    containsPoint(point: Vector3): boolean;
    /**
     * 空间点与球表面的最短距离
     * @param point - 三维空间点
     * @returns 距离结果
     */
    distanceToPoint(point: Vector3): number;
    /**
     * 与球相交判断
     * @param sphere - 球
     * @returns 相交判断结果
     */
    intersectsSphere(sphere: Sphere): boolean;
    /**
     * 与包围盒相交判断
     * @param box - 三维包围盒
     * @returns 相交判断结果
     */
    intersectsBox(box: Box3): boolean;
    /**
     * 收敛空间点在球范围内
     * 注：乘法的效率要比开方高很多
     * @param point - 三维空间点
     * @param [target] - 结果保存对象
     * @returns 收敛结果
     */
    clampPoint(point: Vector3, target?: Vector3): Vector3;
    /**
     * 根据包围盒获取球
     * @param target - 包围盒
     * @returns 球
     */
    getBoundingBox(target: Box3): Box3;
    /**
     * 球空间变换
     * @param matrix - 空间变化矩阵
     * @returns 变换结果
     */
    applyMatrix4(matrix: Matrix4): this;
    /**
     * 球位移
     * @param offset - 位移信息
     * @returns 位移结果
     */
    translate(offset: Vector3): this;
    /**
     * 通过三维空间点对球进行扩展
     * @param point - 扩展点
     * @returns 扩展结果
     */
    expandByPoint(point: Vector3): this;
    /**
     * 包围球求并集
     * @param sphere - 包围球
     * @returns 求并结果
     */
    union(sphere: Sphere): this;
    /**
     * 包围球求交集
     * @param other - 其它包围球
     * @returns 求交结果
     */
    intersect(other: Sphere): this;
    /**
     * 包围球判等
     * @param sphere - 包围球
     * @returns 判等结果
     */
    equals(sphere: Sphere): boolean;
    /**
     * 包围球克隆
     * @returns 克隆结果
     */
    clone(): Sphere;
}
//# sourceMappingURL=sphere.d.ts.map