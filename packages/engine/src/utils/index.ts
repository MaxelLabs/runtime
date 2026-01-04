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

export { BoundingBox } from './bounding-box';
export type { BoundingBoxData, BoundingBoxOptions } from './bounding-box';

// ========================================
// FrustumCuller
// ========================================

export { Frustum, FrustumCuller, FrustumPlane, IntersectionResult } from './frustum-culler';
export type { FrustumData, CullingStats, ICullable } from './frustum-culler';

// ========================================
// EnvironmentProbe
// ========================================

export { EnvironmentProbe, ProbeType, ProbeUpdateMode, ProbeState } from './environment-probe';
export type { EnvironmentProbeConfig, EnvironmentProbeData, SphericalHarmonics } from './environment-probe';
