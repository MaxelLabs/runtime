import type { Box2 } from './box2';
import { Vector2 } from '../core/vector2';
/**
 * 二维圆
 */
export declare class Circle {
    center: Vector2;
    radius: number;
    /**
     * 构造函数，默认值为圆心为原点，半径为0
     * @param [center=new Vector2()] - 圆心
     * @param [radius=0] - 半径
     */
    constructor(center?: Vector2, radius?: number);
    /**
     * 通过中心点与大小设置圆
     * @param center - 圆心
     * @param radius - 半径
     * @returns
     */
    set(center: Vector2, radius: number): this;
    /**
     * 克隆圆
     * @returns 克隆结果
     */
    clone(): Circle;
    /**
     * 复制圆
     * @param circle - 复制对象
     * @returns 复制结果
     */
    copyFrom(circle: Circle): this;
    /**
     * 圆置空
     * @returns 置空结果
     */
    makeEmpty(): this;
    /**
     * 圆判空
     * @returns 判空结果
     */
    isEmpty(): boolean;
    /**
     * 获取圆心
     * @param [target=new Vector2()] - 目标结果对象
     * @returns 圆心
     */
    getCenter(target?: Vector2): Vector2;
    /**
     * 获取半径
     * @returns 半径
     */
    getRadius(): number;
    /**
     * 通过二维空间点扩展圆
     * @param point - 二维空间点
     * @returns 扩展结果
     */
    expandByPoint(point: Vector2): this;
    /**
     * 通过大小扩展圆
     * @param scalar - 扩展大小
     * @returns 扩展结果
     */
    expandByScalar(scalar: number): this;
    /**
     * 判断圆是否包含二维空间点
     * @param point - 二维空间点
     * @returns 包含判断结果
     */
    containsPoint(point: Vector2): boolean;
    /**
     * 判断圆是否包含二维包围盒
     * @param box - 二维包围盒
     * @returns 包含判断结果
     */
    containsBox(box: Box2): boolean;
    /**
     * 判断圆与二维包围盒的相交关系
     * @param box - 二维包围盒
     * @returns 相交判断结果
     */
    intersectsBox(box: Box2): boolean;
    /**
     * 求点与圆的最短距离
     * @param point - 二维空间点
     * @returns 距离
     */
    distanceToPoint(point: Vector2): number;
    /**
     * 圆求交集
     * @param circle - 二维圆
     * @returns 求交结果
     */
    intersect(circle: Circle): this;
    /**
     * 圆求并集
     * @param circle - 二维圆
     * @returns 求并结果
     */
    union(circle: Circle): this;
    /**
     * 圆的位移
     * @param offset - 二维向量
     * @returns 位移结果
     */
    translate(offset: Vector2): this;
    /**
     * 圆判等
     * @param circle - 二维圆
     * @returns 判等结果
     */
    equals(circle: Circle): boolean;
}
//# sourceMappingURL=circle.d.ts.map