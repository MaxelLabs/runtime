/**
 * Engine Utils - 工具函数模块
 *
 * 提供 3D 引擎常用的工具类，包括包围盒计算、视锥剔除和环境探针。
 *
 * @packageDocumentation
 */

// ========================================
// BoundingBox
// ========================================

export { BoundingBox } from './BoundingBox';
export type { BoundingBoxData, BoundingBoxOptions } from './BoundingBox';

// ========================================
// FrustumCuller
// ========================================

export { Frustum, FrustumCuller, FrustumPlane, IntersectionResult } from './FrustumCuller';
export type { FrustumData, CullingStats, ICullable } from './FrustumCuller';

// ========================================
// EnvironmentProbe
// ========================================

export { EnvironmentProbe, ProbeType, ProbeUpdateMode, ProbeState } from './EnvironmentProbe';
export type { EnvironmentProbeConfig, EnvironmentProbeData, SphericalHarmonics } from './EnvironmentProbe';
