/**
 * Primitives Module - 内置几何体模块
 *
 * @packageDocumentation
 *
 * @remarks
 * 提供 Engine 包的内置几何体实现。
 *
 * ## 模块内容
 * - GeometryBuilder - 几何体数据构建器
 * - BoxGeometry - 立方体
 * - SphereGeometry - 球体
 * - PlaneGeometry - 平面
 * - CylinderGeometry - 圆柱体
 */

export { GeometryBuilder } from './geometry-builder';
export type { GeometryData, Vec2Tuple, Vec3Tuple, Vec4Tuple } from './geometry-builder';

export { BoxGeometry } from './box-geometry';
export type { BoxGeometryConfig } from './box-geometry';

export { SphereGeometry } from './sphere-geometry';
export type { SphereGeometryConfig } from './sphere-geometry';

export { PlaneGeometry } from './plane-geometry';
export type { PlaneGeometryConfig } from './plane-geometry';

export { CylinderGeometry } from './cylinder-geometry';
export type { CylinderGeometryConfig } from './cylinder-geometry';
