/**
 * 数学工具函数
 */

// 性能优化相关的常量
export const NumberEpsilon = 1e-10;
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;
export const PI2 = Math.PI * 2;

// 缓存常用计算结果
const sinCache = new Map<number, number>();
const cosCache = new Map<number, number>();
const MAX_CACHE_SIZE = 2000; // 限制缓存大小

// 检测 SIMD 支持
export const hasSIMD = (): boolean => {
  return typeof (globalThis as any).SIMD !== 'undefined';
};

/**
 * 优化的正弦函数，使用优化的缓存和小角度近似
 */
export function fastSin(angle: number): number {
  // 角度归一化到 [0, 2π)
  const normalized = angle % PI2;
  const normalizedKey = Math.floor(normalized * 1000) | 0;

  if (sinCache.has(normalizedKey)) {
    return sinCache.get(normalizedKey)!;
  }

  // 小角度优化: sin(x) ≈ x 当 x 接近 0
  let result;

  if (Math.abs(normalized) < 0.01) {
    result = normalized;
  } else {
    // 使用标准库计算
    result = Math.sin(normalized);
  }

  // 管理缓存大小
  if (sinCache.size >= MAX_CACHE_SIZE) {
    // 清理约 20% 的缓存
    const keys = Array.from(sinCache.keys()).slice(0, MAX_CACHE_SIZE / 5);

    for (const key of keys) {
      sinCache.delete(key);
    }
  }

  sinCache.set(normalizedKey, result);

  return result;
}

/**
 * 优化的余弦函数，使用优化的缓存
 */
export function fastCos(angle: number): number {
  // 角度归一化到 [0, 2π)
  const normalized = angle % PI2;
  const normalizedKey = Math.floor(normalized * 1000) | 0;

  if (cosCache.has(normalizedKey)) {
    return cosCache.get(normalizedKey)!;
  }

  // 小角度优化: cos(x) ≈ 1 - x²/2 当 x 接近 0
  let result;

  if (Math.abs(normalized) < 0.01) {
    result = 1 - (normalized * normalized) / 2;
  } else {
    // 标准库计算
    result = Math.cos(normalized);
  }

  // 管理缓存大小
  if (cosCache.size >= MAX_CACHE_SIZE) {
    // 清理约 20% 的缓存
    const keys = Array.from(cosCache.keys()).slice(0, MAX_CACHE_SIZE / 5);

    for (const key of keys) {
      cosCache.delete(key);
    }
  }

  cosCache.set(normalizedKey, result);

  return result;
}

/**
 * 优化的平方根函数
 */
export function fastSqrt(x: number): number {
  // 对于常见值如 0, 1, 4, 9 等可以直接返回结果
  if (x === 0 || x === 1) {
    return x;
  }
  if (x === 4) {
    return 2;
  }
  if (x === 9) {
    return 3;
  }
  if (x === 16) {
    return 4;
  }

  return Math.sqrt(x);
}

/**
 * 优化的反平方根函数 - 改进版本的 Quake III 算法
 */
export function fastInvSqrt(x: number): number {
  // 特殊值优化
  if (x === 0) {
    return Infinity;
  }
  if (x === 1) {
    return 1;
  }
  if (x === 4) {
    return 0.5;
  }
  if (x === 9) {
    return 1 / 3;
  }

  const halfx = 0.5 * x;
  const buffer = new ArrayBuffer(4);
  const floatView = new Float32Array(buffer);
  const intView = new Int32Array(buffer);

  floatView[0] = x;
  // 更精确的魔数
  intView[0] = 0x5f375a86 - (intView[0] >> 1);
  let y = floatView[0];

  // 两次迭代以提高精度
  y = y * (1.5 - halfx * y * y);
  y = y * (1.5 - halfx * y * y); // 增加一次迭代提高精度

  return y;
}

/**
 * 清除三角函数缓存
 */
export function clearTrigCache(): void {
  sinCache.clear();
  cosCache.clear();
}

export function isZero(v: number): boolean {
  return isNaN(v) || Math.abs(v) < NumberEpsilon;
}

export function isEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < NumberEpsilon || (a === Infinity && b === Infinity) || (a === -Infinity && b === -Infinity);
}

// http://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
export const damp = (x: number, y: number, lambda: number, dt: number): number =>
  lerp(x, y, 1 - Math.exp(-lambda * dt));

/**
 * 线性插值 - 优化版本
 */
export function lerp(x: number, y: number, t: number): number {
  return (1 - t) * x + t * y;
}

export const degToRad = (degrees: number): number => degrees * DEG2RAD;

export const radToDeg = (radians: number): number => radians * RAD2DEG;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 数值小数位截断
 */
export function truncateDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);

  return Math.trunc(value * factor) / factor;
}

/**
 * 更高效的三次方计算
 */
export function cube(x: number): number {
  return x * x * x;
}

/**
 * 安全地计算两个数的商，避免除以零错误
 */
export function safeDivide(a: number, b: number, fallback = 0): number {
  return Math.abs(b) < NumberEpsilon ? fallback : a / b;
}
