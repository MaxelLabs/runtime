/**
 * SIMD支持和检测模块
 * 提供跨平台的SIMD优化支持
 */

import { MathConfig } from '../config/mathConfig';

/**
 * SIMD提供者接口
 */
export interface SIMDProvider {
  /** 检查是否支持SIMD */
  isSupported(): boolean;

  /** 向量加法 */
  addVectors(a: Float32Array, b: Float32Array, result: Float32Array, count: number): void;

  /** 向量减法 */
  subtractVectors(a: Float32Array, b: Float32Array, result: Float32Array, count: number): void;

  /** 向量乘法 */
  multiplyVectors(a: Float32Array, b: Float32Array, result: Float32Array, count: number): void;

  /** 向量标量乘法 */
  multiplyScalar(a: Float32Array, scalar: number, result: Float32Array, count: number): void;

  /** 向量点积 */
  dotProduct(a: Float32Array, b: Float32Array, count: number): number;

  /** 向量长度平方 */
  lengthSquared(a: Float32Array, count: number): number;

  /** 向量归一化 */
  normalize(a: Float32Array, result: Float32Array, count: number): void;

  /** 4x4矩阵乘法 */
  multiplyMatrix4(a: Float32Array, b: Float32Array, result: Float32Array): void;

  /** 矩阵向量乘法 */
  transformVector3(matrix: Float32Array, vector: Float32Array, result: Float32Array): void;

  /** 批量矩阵向量变换 */
  transformVector3Array(matrix: Float32Array, vectors: Float32Array, result: Float32Array, count: number): void;
}

/**
 * 标准实现（回退方案）
 */
class StandardSIMDProvider implements SIMDProvider {
  isSupported(): boolean {
    return true; // 标准实现总是可用
  }

  addVectors(a: Float32Array, b: Float32Array, result: Float32Array, count: number): void {
    for (let i = 0; i < count; i++) {
      result[i] = a[i] + b[i];
    }
  }

  subtractVectors(a: Float32Array, b: Float32Array, result: Float32Array, count: number): void {
    for (let i = 0; i < count; i++) {
      result[i] = a[i] - b[i];
    }
  }

  multiplyVectors(a: Float32Array, b: Float32Array, result: Float32Array, count: number): void {
    for (let i = 0; i < count; i++) {
      result[i] = a[i] * b[i];
    }
  }

  multiplyScalar(a: Float32Array, scalar: number, result: Float32Array, count: number): void {
    for (let i = 0; i < count; i++) {
      result[i] = a[i] * scalar;
    }
  }

  dotProduct(a: Float32Array, b: Float32Array, count: number): number {
    let result = 0;
    for (let i = 0; i < count; i++) {
      result += a[i] * b[i];
    }
    return result;
  }

  lengthSquared(a: Float32Array, count: number): number {
    let result = 0;
    for (let i = 0; i < count; i++) {
      result += a[i] * a[i];
    }
    return result;
  }

  normalize(a: Float32Array, result: Float32Array, count: number): void {
    const length = Math.sqrt(this.lengthSquared(a, count));
    if (length > 0) {
      const invLength = 1 / length;
      this.multiplyScalar(a, invLength, result, count);
    } else {
      for (let i = 0; i < count; i++) {
        result[i] = 0;
      }
    }
  }

  multiplyMatrix4(a: Float32Array, b: Float32Array, result: Float32Array): void {
    // 4x4矩阵乘法（列优先）
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += a[row + k * 4] * b[k + col * 4];
        }
        result[row + col * 4] = sum;
      }
    }
  }

  transformVector3(matrix: Float32Array, vector: Float32Array, result: Float32Array): void {
    const x = vector[0];
    const y = vector[1];
    const z = vector[2];

    result[0] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
    result[1] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
    result[2] = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
  }

  transformVector3Array(matrix: Float32Array, vectors: Float32Array, result: Float32Array, count: number): void {
    for (let i = 0; i < count; i++) {
      const offset = i * 3;
      this.transformVector3(matrix, vectors.subarray(offset, offset + 3), result.subarray(offset, offset + 3));
    }
  }
}

/**
 * WebAssembly SIMD实现
 */
class WebAssemblySIMDProvider implements SIMDProvider {
  private wasmModule: any = null;
  private supported = false;

  constructor() {
    this.detectSupport();
  }

  private async detectSupport(): Promise<void> {
    try {
      // 检查WebAssembly SIMD支持
      if (typeof WebAssembly !== 'undefined' && WebAssembly.validate) {
        // 简单的SIMD检测字节码
        const simdTestBytes = new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b, 0x03, 0x02, 0x01,
          0x00, 0x0a, 0x0a, 0x01, 0x08, 0x00, 0x41, 0x00, 0xfd, 0x0f, 0x0b,
        ]);

        this.supported = WebAssembly.validate(simdTestBytes);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      this.supported = false;
    }
  }

  isSupported(): boolean {
    return this.supported;
  }

  // WebAssembly SIMD实现（这里提供接口，实际实现需要编译WASM模块）
  addVectors(a: Float32Array, b: Float32Array, result: Float32Array, count: number): void {
    if (this.wasmModule && this.wasmModule.addVectors) {
      this.wasmModule.addVectors(a, b, result, count);
    } else {
      // 回退到标准实现
      standardProvider.addVectors(a, b, result, count);
    }
  }

  subtractVectors(a: Float32Array, b: Float32Array, result: Float32Array, count: number): void {
    if (this.wasmModule && this.wasmModule.subtractVectors) {
      this.wasmModule.subtractVectors(a, b, result, count);
    } else {
      standardProvider.subtractVectors(a, b, result, count);
    }
  }

  multiplyVectors(a: Float32Array, b: Float32Array, result: Float32Array, count: number): void {
    if (this.wasmModule && this.wasmModule.multiplyVectors) {
      this.wasmModule.multiplyVectors(a, b, result, count);
    } else {
      standardProvider.multiplyVectors(a, b, result, count);
    }
  }

  multiplyScalar(a: Float32Array, scalar: number, result: Float32Array, count: number): void {
    if (this.wasmModule && this.wasmModule.multiplyScalar) {
      this.wasmModule.multiplyScalar(a, scalar, result, count);
    } else {
      standardProvider.multiplyScalar(a, scalar, result, count);
    }
  }

  dotProduct(a: Float32Array, b: Float32Array, count: number): number {
    if (this.wasmModule && this.wasmModule.dotProduct) {
      return this.wasmModule.dotProduct(a, b, count);
    } else {
      return standardProvider.dotProduct(a, b, count);
    }
  }

  lengthSquared(a: Float32Array, count: number): number {
    if (this.wasmModule && this.wasmModule.lengthSquared) {
      return this.wasmModule.lengthSquared(a, count);
    } else {
      return standardProvider.lengthSquared(a, count);
    }
  }

  normalize(a: Float32Array, result: Float32Array, count: number): void {
    if (this.wasmModule && this.wasmModule.normalize) {
      this.wasmModule.normalize(a, result, count);
    } else {
      standardProvider.normalize(a, result, count);
    }
  }

  multiplyMatrix4(a: Float32Array, b: Float32Array, result: Float32Array): void {
    if (this.wasmModule && this.wasmModule.multiplyMatrix4) {
      this.wasmModule.multiplyMatrix4(a, b, result);
    } else {
      standardProvider.multiplyMatrix4(a, b, result);
    }
  }

  transformVector3(matrix: Float32Array, vector: Float32Array, result: Float32Array): void {
    if (this.wasmModule && this.wasmModule.transformVector3) {
      this.wasmModule.transformVector3(matrix, vector, result);
    } else {
      standardProvider.transformVector3(matrix, vector, result);
    }
  }

  transformVector3Array(matrix: Float32Array, vectors: Float32Array, result: Float32Array, count: number): void {
    if (this.wasmModule && this.wasmModule.transformVector3Array) {
      this.wasmModule.transformVector3Array(matrix, vectors, result, count);
    } else {
      standardProvider.transformVector3Array(matrix, vectors, result, count);
    }
  }
}

/**
 * JavaScript优化实现（使用展开循环等技术）
 */
class OptimizedJSProvider implements SIMDProvider {
  isSupported(): boolean {
    return true;
  }

  addVectors(a: Float32Array, b: Float32Array, result: Float32Array, count: number): void {
    // 展开循环，每次处理4个元素
    let i = 0;
    const unrolledCount = count - (count % 4);

    for (; i < unrolledCount; i += 4) {
      result[i] = a[i] + b[i];
      result[i + 1] = a[i + 1] + b[i + 1];
      result[i + 2] = a[i + 2] + b[i + 2];
      result[i + 3] = a[i + 3] + b[i + 3];
    }

    // 处理剩余元素
    for (; i < count; i++) {
      result[i] = a[i] + b[i];
    }
  }

  subtractVectors(a: Float32Array, b: Float32Array, result: Float32Array, count: number): void {
    let i = 0;
    const unrolledCount = count - (count % 4);

    for (; i < unrolledCount; i += 4) {
      result[i] = a[i] - b[i];
      result[i + 1] = a[i + 1] - b[i + 1];
      result[i + 2] = a[i + 2] - b[i + 2];
      result[i + 3] = a[i + 3] - b[i + 3];
    }

    for (; i < count; i++) {
      result[i] = a[i] - b[i];
    }
  }

  multiplyVectors(a: Float32Array, b: Float32Array, result: Float32Array, count: number): void {
    let i = 0;
    const unrolledCount = count - (count % 4);

    for (; i < unrolledCount; i += 4) {
      result[i] = a[i] * b[i];
      result[i + 1] = a[i + 1] * b[i + 1];
      result[i + 2] = a[i + 2] * b[i + 2];
      result[i + 3] = a[i + 3] * b[i + 3];
    }

    for (; i < count; i++) {
      result[i] = a[i] * b[i];
    }
  }

  multiplyScalar(a: Float32Array, scalar: number, result: Float32Array, count: number): void {
    let i = 0;
    const unrolledCount = count - (count % 4);

    for (; i < unrolledCount; i += 4) {
      result[i] = a[i] * scalar;
      result[i + 1] = a[i + 1] * scalar;
      result[i + 2] = a[i + 2] * scalar;
      result[i + 3] = a[i + 3] * scalar;
    }

    for (; i < count; i++) {
      result[i] = a[i] * scalar;
    }
  }

  dotProduct(a: Float32Array, b: Float32Array, count: number): number {
    let result = 0;
    let i = 0;
    const unrolledCount = count - (count % 4);

    for (; i < unrolledCount; i += 4) {
      result += a[i] * b[i] + a[i + 1] * b[i + 1] + a[i + 2] * b[i + 2] + a[i + 3] * b[i + 3];
    }

    for (; i < count; i++) {
      result += a[i] * b[i];
    }

    return result;
  }

  lengthSquared(a: Float32Array, count: number): number {
    let result = 0;
    let i = 0;
    const unrolledCount = count - (count % 4);

    for (; i < unrolledCount; i += 4) {
      result += a[i] * a[i] + a[i + 1] * a[i + 1] + a[i + 2] * a[i + 2] + a[i + 3] * a[i + 3];
    }

    for (; i < count; i++) {
      result += a[i] * a[i];
    }

    return result;
  }

  normalize(a: Float32Array, result: Float32Array, count: number): void {
    const length = Math.sqrt(this.lengthSquared(a, count));
    if (length > 0) {
      const invLength = 1 / length;
      this.multiplyScalar(a, invLength, result, count);
    } else {
      for (let i = 0; i < count; i++) {
        result[i] = 0;
      }
    }
  }

  multiplyMatrix4(a: Float32Array, b: Float32Array, result: Float32Array): void {
    // 优化的4x4矩阵乘法
    const a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
    const a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
    const a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
    const a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];

    const b00 = b[0],
      b01 = b[1],
      b02 = b[2],
      b03 = b[3];
    const b10 = b[4],
      b11 = b[5],
      b12 = b[6],
      b13 = b[7];
    const b20 = b[8],
      b21 = b[9],
      b22 = b[10],
      b23 = b[11];
    const b30 = b[12],
      b31 = b[13],
      b32 = b[14],
      b33 = b[15];

    result[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    result[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    result[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    result[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;

    result[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    result[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    result[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    result[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;

    result[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    result[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    result[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    result[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;

    result[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    result[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    result[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    result[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
  }

  transformVector3(matrix: Float32Array, vector: Float32Array, result: Float32Array): void {
    const x = vector[0];
    const y = vector[1];
    const z = vector[2];

    result[0] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
    result[1] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
    result[2] = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
  }

  transformVector3Array(matrix: Float32Array, vectors: Float32Array, result: Float32Array, count: number): void {
    // 预计算矩阵元素
    const m00 = matrix[0],
      m01 = matrix[4],
      m02 = matrix[8],
      m03 = matrix[12];
    const m10 = matrix[1],
      m11 = matrix[5],
      m12 = matrix[9],
      m13 = matrix[13];
    const m20 = matrix[2],
      m21 = matrix[6],
      m22 = matrix[10],
      m23 = matrix[14];

    for (let i = 0; i < count; i++) {
      const offset = i * 3;
      const x = vectors[offset];
      const y = vectors[offset + 1];
      const z = vectors[offset + 2];

      result[offset] = m00 * x + m01 * y + m02 * z + m03;
      result[offset + 1] = m10 * x + m11 * y + m12 * z + m13;
      result[offset + 2] = m20 * x + m21 * y + m22 * z + m23;
    }
  }
}

// 创建提供者实例
const standardProvider = new StandardSIMDProvider();
const optimizedJSProvider = new OptimizedJSProvider();
const wasmProvider = new WebAssemblySIMDProvider();

/**
 * SIMD管理器
 */
export class SIMDManager {
  private static currentProvider: SIMDProvider = standardProvider;
  private static providers: Map<string, SIMDProvider> = new Map([
    ['standard', standardProvider],
    ['optimized', optimizedJSProvider],
    ['wasm', wasmProvider],
  ]);

  /**
   * 初始化SIMD支持
   */
  static async initialize(): Promise<void> {
    if (MathConfig.isSIMDEnabled()) {
      // 按优先级检测可用的SIMD实现
      if (wasmProvider.isSupported()) {
        this.currentProvider = wasmProvider;
        console.info('使用WebAssembly SIMD实现');
      } else {
        this.currentProvider = optimizedJSProvider;
        console.info('使用优化的JavaScript实现');
      }
    } else {
      this.currentProvider = standardProvider;
      console.info('使用标准实现');
    }
  }

  /**
   * 获取当前SIMD提供者
   */
  static getProvider(): SIMDProvider {
    return this.currentProvider;
  }

  /**
   * 设置SIMD提供者
   */
  static setProvider(name: string): boolean {
    const provider = this.providers.get(name);
    if (provider && provider.isSupported()) {
      this.currentProvider = provider;
      return true;
    }
    return false;
  }

  /**
   * 检查SIMD是否可用
   */
  static isSupported(): boolean {
    return this.currentProvider !== standardProvider;
  }

  /**
   * 获取所有可用的提供者
   */
  static getAvailableProviders(): string[] {
    const available: string[] = [];
    for (const [name, provider] of this.providers.entries()) {
      if (provider.isSupported()) {
        available.push(name);
      }
    }
    return available;
  }

  /**
   * 注册自定义SIMD提供者
   */
  static registerProvider(name: string, provider: SIMDProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * 检查是否应该使用SIMD（基于数据大小）
   */
  static shouldUseSIMD(dataSize: number): boolean {
    return MathConfig.isSIMDEnabled() && dataSize >= MathConfig.getSIMDFallbackThreshold() && this.isSupported();
  }
}

// 自动初始化
SIMDManager.initialize();
