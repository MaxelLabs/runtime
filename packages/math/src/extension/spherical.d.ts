import { Vector3 } from '../core/vector3';
/**
 * 球坐标
 */
declare class Spherical {
    radius: number;
    phi: number;
    theta: number;
    /**
     * 球坐标构造函数
     * @param [radius=1] - 球半径
     * @param [phi=0] - 极角，y 轴弧度
     * @param [theta=0] - 方位角，z轴 弧度
     */
    constructor(radius?: number, phi?: number, theta?: number);
    /**
     * 设置球坐标
     * @param radius - 球半径
     * @param phi - 极角
     * @param theta - 方位角
     * @returns 球坐标
     */
    set(radius: number, phi: number, theta: number): this;
    /**
     * 复制球坐标
     * @param other - 球坐标
     * @returns 复制结果
     */
    copyFrom(other: Spherical): this;
    /**
     * 球坐标有效判断
     * @returns 有效判断结果
     */
    makeSafe(): this;
    /**
     * 初始化球坐标
     * @returns 初始球坐标
     */
    makeEmpty(): this;
    /**
     * 通过空间坐标设置球坐标
     * @param v - 空间坐标
     * @returns 球坐标
     */
    setFromVec3(v: Vector3): Spherical;
    /**
     * 通过笛卡尔坐标设置球坐标表
     * @param x - 笛卡尔坐标系x轴坐标
     * @param y - 笛卡尔坐标系y轴坐标
     * @param z - 笛卡尔坐标系z轴坐标
     * @returns 球坐标
     */
    setFromCartesianCoords(x: number, y: number, z: number): this;
    /**
     * 克隆球坐标
     * @returns 克隆结果
     */
    clone(): Spherical;
    getCartesianCoords(): Vector3;
}
export { Spherical };
//# sourceMappingURL=spherical.d.ts.map