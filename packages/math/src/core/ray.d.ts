import type { Matrix4 } from './matrix4';
import type { Box3Like, PlaneLike, SphereLike, TriangleLike } from './type';
import { Vector3 } from './vector3';
/**
 * 光线类
 */
export declare class Ray {
    private static readonly tempVec0;
    private static readonly tempVec1;
    private static readonly tempVec2;
    private static readonly tempVec3;
    /**
     * 光线的原点
     */
    origin: Vector3;
    /**
     * 光线的方向
     */
    direction: Vector3;
    /**
     * 构造函数
     * @param [origin] - 原点，默认是 (0, 0, 0)
     * @param [direction] - 方向，默认是 (1, 0, 0)
     */
    constructor(origin?: Vector3, direction?: Vector3);
    /**
     * 光线设置
     * @param origin - 原点
     * @param direction - 方向
     * @returns
     */
    set(origin: Vector3, direction: Vector3): this;
    /**
     * 光线克隆
     * @returns 克隆结果
     */
    clone(): Ray;
    /**
     * 光线拷贝
     * @param ray - 要拷贝对象
     * @returns 拷贝结果
     */
    copyFrom(ray: Ray): this;
    /**
     * 根据t计算新的光线原点
     * @param t - 光线的系数 t
     * @returns
     */
    recast(t: number): this;
    /**
     * 根据t值计算光线上的点
     * @param t - 光线的系数 t
     * @param [out] - 计算的点
     * @returns
     */
    at(t: number, out?: Vector3): Vector3;
    /**
     * 光线相等判断
     * @param other - 其他对象
     * @returns
     */
    equals(other: Ray): boolean;
    /**
     * 根据矩阵对光线进行变换
     * @param m - 变换矩阵
     * @returns
     */
    applyMatrix(m: Matrix4): this;
    /**
     * 光线和包围盒求交
     * @param box - 类包围盒对象
     * @param [out] - 交点
     * @returns
     */
    intersectBox(box: Box3Like, out?: Vector3): Vector3 | undefined;
    /**
     * 光线和平面求交
     * @param plane - 类平面对象
     * @param [out] - 交点
     * @returns
     */
    intersectPlane(plane: PlaneLike, out?: Vector3): Vector3 | undefined;
    /**
     * 光线和圆求交
     * @param sphere - 类球对象
     * @param [out] - 交点
     * @returns
     */
    intersectSphere(sphere: SphereLike, out?: Vector3): Vector3 | undefined;
    /**
     * 光线和三角形求交
     * @param triangle - 类三角形对象
     * @param [out] - 交点
     * @param [backfaceCulling] - 是否背面剔除
     * @returns
     */
    intersectTriangle(triangle: TriangleLike, out?: Vector3, backfaceCulling?: boolean): Vector3 | undefined;
}
