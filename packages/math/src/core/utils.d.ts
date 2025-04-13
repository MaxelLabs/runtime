/**
 * 数学工具函数
 */
export declare const NumberEpsilon = 1e-10;
export declare const DEG2RAD: number;
export declare const RAD2DEG: number;
export declare const PI2: number;
export declare const hasSIMD: () => boolean;
/**
 * 优化的正弦函数，使用优化的缓存和小角度近似
 */
export declare function fastSin(angle: number): number;
/**
 * 优化的余弦函数，使用优化的缓存
 */
export declare function fastCos(angle: number): number;
/**
 * 优化的平方根函数
 */
export declare function fastSqrt(x: number): number;
/**
 * 优化的反平方根函数 - 改进版本的 Quake III 算法
 */
export declare function fastInvSqrt(x: number): number;
/**
 * 清除三角函数缓存
 */
export declare function clearTrigCache(): void;
export declare function isZero(v: number): boolean;
export declare function isEqual(a: number, b: number): boolean;
export declare const damp: (x: number, y: number, lambda: number, dt: number) => number;
/**
 * 线性插值 - 优化版本
 */
export declare function lerp(x: number, y: number, t: number): number;
export declare const degToRad: (degrees: number) => number;
export declare const radToDeg: (radians: number) => number;
export declare function clamp(value: number, min: number, max: number): number;
/**
 * 数值小数位截断
 */
export declare function truncateDecimals(value: number, decimals: number): number;
/**
 * 更高效的三次方计算
 */
export declare function cube(x: number): number;
/**
 * 安全地计算两个数的商，避免除以零错误
 */
export declare function safeDivide(a: number, b: number, fallback?: number): number;
//# sourceMappingURL=utils.d.ts.map