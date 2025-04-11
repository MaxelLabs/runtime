import { Vector2 } from '../core/vector2';
/**
 * 二维包围盒
 */
export declare class Box2 {
    min: Vector2;
    max: Vector2;
    /**
     * @member corners - 二维包围盒角点
     */
    corners: Vector2[];
    /**
     * 构造函数，传入值为空时表示空包围盒
     * @param min - 最小点
     * @param max - 最大点
     */
    constructor(min?: Vector2, max?: Vector2);
    /**
     * 通过最大最小点设置二维包围盒
     * @param min 最小点
     * @param max 最大点
     * @returns 二维包围盒
     */
    set(min: Vector2, max: Vector2): this;
    /**
     * 通过角点设置二维包围盒
     * @param vecArray - 二维空间点数组
     * @returns 二维包围盒
     */
    setFromVec2Array(vecArray: Vector2[]): this;
    setFromVec2ArrayWithOutCorners(vecArray: Vector2[]): this;
    /**
     * 通过中心与大小设置二维包围盒
     * @param center - 二维中心点
     * @param size - 二维大小
     * @returns 二维包围盒
     */
    setFromCenterAndSize(center: Vector2, size: Vector2): this;
    /**
     * 克隆二维包围盒
     * @returns 克隆结果
     */
    clone(): Box2;
    /**
     * 复制二维包围盒
     * @param box - 二维包围盒
     * @returns 复制结果
     */
    copyFrom(box: Box2): this;
    /**
     * 二维包围盒置空
     * @returns 置空结果
     */
    makeEmpty(): this;
    /**
     * 二维包围盒判空
     * @returns 判空结果
     */
    isEmpty(): boolean;
    /**
     * 获取二维包围盒角点
     * @returns 二维包围盒角点
     */
    getCorners(): Vector2[];
    /**
     * 过去二维包围盒左上角点
     * @returns 二维包围盒左上角点
     */
    getLeftTopCorner(): Vector2;
    /**
     * 获取二维包围盒右上角点
     * @returns 二维包围盒右上角点
     */
    getRightTopCorner(): Vector2;
    /**
     * 获取二维包围盒右下角点
     * @returns 二维包围盒右下角点
     */
    getRightBottomCorner(): Vector2;
    /**
     * 获取二维包围盒左下角点
     * @returns 二维包围盒左下角点
     */
    getLeftBottomCorner(): Vector2;
    /**
     * 通过类型获取二维包围盒指定点
     * @param type - 包围盒顶点顺序
     * @returns 二维包围盒指定点
     */
    getPoint(type: number): Vector2;
    /**
     * 获取二维包围盒中心点
     * @param [target=new Vector2()] - 目标点(用以存放二维包围盒中心点)
     * @returns 二维包围盒中心点
     */
    getCenter(target?: Vector2): Vector2;
    /**
     * 获取二维包围盒大小
     * @param [target=new Vector2()] - 目标向量(用以存放二维包围盒大小)
     * @returns 二维包围盒大小
     */
    getSize(target?: Vector2): Vector2;
    /**
     * 通过二维空间点扩展二维包围盒
     * @param point - 二维空间点
     * @returns 扩展包围盒
     */
    expandByPoint(point: Vector2): this;
    /**
     * 通过向量扩展二维包围盒
     * @param vector - 二维向量
     * @returns 扩展结果
     */
    expandByVector(vector: Vector2): this;
    /**
     * 通过大小扩展二维包围盒
     * @param scalar - 扩展大小
     * @returns 扩展结果
     */
    expandByScalar(scalar: number): this;
    /**
     * 判断二维包围盒是否包含二维空间点
     * @param point 二维空间点
     * @param [isOrthogonal=true] - 包围盒正交判断
     * @returns 点包含判断结果
     */
    containsPoint(point: Vector2, isOrthogonal?: boolean): boolean;
    /**
     * 判断二维包围盒包含关系(if this contains other)
     * @param box - 其它包围盒
     * @returns 二维包围盒包含判断结果
     */
    containsBox(box: Box2): boolean;
    /**
     * 获取点以包围盒左上角顶点为原点的相对位置
     * @param point - 指定二维空间点
     * @param [target=new Vector2()] - 目标空间点
     * @returns 计算结果空间点
     */
    getParameter(point: Vector2, target?: Vector2): Vector2;
    /**
     * 判断二维包围盒相交关系(if this intersect other)
     * @param box - 二维包围盒
     * @param [isOrthogonal=true] - 正交判断(当前包围盒)
     * @returns 相交判断结果
     */
    intersectsBox(box: Box2, isOrthogonal?: boolean): boolean;
    /**
     * 求点与二维包围盒的最近点
     * @param point - 二维空间点
     * @param [target=new Vector2()] - 结果点
     * @returns 二维空间点
     */
    clampPoint(point: Vector2, target?: Vector2): Vector2;
    /**
     * 求点到二维包围盒的距离
     * @param point - 二维空间点
     * @returns 距离
     */
    distanceToPoint(point: Vector2): number;
    /**
     * 二维包围盒求交集
     * @param box - 二维包围盒
     * @returns 求交结果
     */
    intersect(box: Box2): this;
    /**
     * 二维包围盒求并集
     * @param box - 二维包围盒
     * @returns 求并结果
     */
    union(box: Box2): this;
    /**
     * 二维包围盒位移
     * @param offset - 位移向量
     * @returns 位移结果
     */
    translate(offset: Vector2): this;
    /**
     * 二维包围盒判等
     * @param box - 二维包围盒
     * @returns 判等结果
     */
    equals(box: Box2): boolean;
}
