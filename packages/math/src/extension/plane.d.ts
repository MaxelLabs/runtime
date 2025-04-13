import { Vector3 } from '../core/vector3';
/**
 * 平面类
 */
export declare class Plane {
    distance: number;
    normal: Vector3;
    constructor(distance?: number, normal?: Vector3);
    set(distance: number, normal: Vector3): Plane;
    copyFrom(target: Plane): Plane;
    static setFromNormalAndCoplanarPoint(point: Vector3, normal: Vector3): Plane;
    setFromNormalAndCoplanarPoint(point: Vector3, normal: Vector3): this;
    clone(): Plane;
    distanceToPoint(point: Vector3): number;
}
//# sourceMappingURL=plane.d.ts.map