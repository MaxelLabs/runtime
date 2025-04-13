import { Vector2 } from '../core/vector2';
/**
 * 二维线段
 */
export declare class Line2 {
    start: Vector2;
    end: Vector2;
    /**
     * 构造函数
     * @param [start=Vector2.ZERO] - 线段起点，默认值为(0, 0)
     * @param [end=Vector2.ZERO] - 线段终点，默认值为(0, 0)
     */
    constructor(start?: Vector2, end?: Vector2);
    /**
     * 设置二维线段
     * @param start - 线段起点
     * @param end - 线段终点
     * @returns 二维线段
     */
    set(start: Vector2, end: Vector2): this;
    /**
     * 复制二维线段
     * @param line - 复制对象
     * @returns 复制结果
     */
    copyFrom(line: Line2): this;
    /**
     * 二维线段求方向
     * @returns 二维线段方向
     */
    direction(): Vector2;
    /**
     * 二维线段求中点
     * @param [target=new Vector2()] - 目标保存对象
     * @returns 二维线段中点
     */
    getCenter(target?: Vector2): Vector2;
    /**
     * 二维线段向量值
     * @param [target=new Vector2()] - 目标保存对象
     * @returns 二维线段向量值
     */
    delta(target?: Vector2): Vector2;
    /**
     * 二维线段欧式距离平方
     * @returns 计算结果
     */
    distanceSq(): number;
    /**
     * 二维线段欧式距离
     * @returns 计算结果
     */
    distance(): number;
    /**
     * 求二维线段比例点
     * @param t - 比例值
     * @param [target=new Vector2()] - 目标保存对象
     * @returns 比例点结果
     */
    at(t: number, target?: Vector2): Vector2;
    /**
     * 求点与线段的最短距离
     * @param point - 二维空间点
     * @param clampToLine - 是否限制于线段内
     * @returns 距离结果
     */
    closestPointToPointParameter(point: Vector2, clampToLine: boolean): number;
    /**
     * 求点与线段的最近交点
     * @param point - 二维空间点
     * @param clampToLine - 是否限制于线段内
     * @param [target=new Vector2()] - 目标保存对象
     * @returns 最近交点
     */
    closestPointToPoint(point: Vector2, clampToLine: boolean, target?: Vector2): Vector2;
    /**
     * 二维线段判等
     * @param line - 二维线段
     * @returns 判等结果
     */
    equals(line: Line2): boolean;
    /**
     * 克隆二维线段
     * @returns 克隆结果
     */
    clone(): Line2;
    /**
     * 二维线段求长度
     * @returns 长度
     */
    length(): number;
    /**
     * 二维线段判断相交
     * @param other - 二维线段
     * @returns 相交判断结果
     */
    crossWithLine(other: Line2): boolean;
}
//# sourceMappingURL=line2.d.ts.map