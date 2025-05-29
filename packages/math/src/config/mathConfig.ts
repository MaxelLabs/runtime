/**
 * Maxellabs Math Library 配置管理
 * 提供全局配置选项和性能调优参数
 */

/**
 * 对象池配置
 */
export interface PoolConfig {
  Vector2: number;
  Vector3: number;
  Vector4: number;
  Matrix3: number;
  Matrix4: number;
  Quaternion: number;
  Color: number;
}

/**
 * SIMD配置
 */
export interface SIMDConfig {
  enabled: boolean;
  autoDetect: boolean;
  fallbackThreshold: number;
}

/**
 * 性能配置
 */
export interface PerformanceConfig {
  enableObjectPool: boolean;
  enableSIMD: boolean;
  enableBatchOperations: boolean;
  memoryAlignment: boolean;
}

/**
 * 数学库全局配置
 */
export interface MathLibConfig {
  epsilon: number;
  pool: PoolConfig;
  simd: SIMDConfig;
  performance: PerformanceConfig;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: MathLibConfig = {
  epsilon: 1e-6,
  pool: {
    Vector2: 1000,
    Vector3: 2000,
    Vector4: 500,
    Matrix3: 200,
    Matrix4: 100,
    Quaternion: 500,
    Color: 300,
  },
  simd: {
    enabled: true,
    autoDetect: true,
    fallbackThreshold: 100, // 少于100个元素时不使用SIMD
  },
  performance: {
    enableObjectPool: true,
    enableSIMD: true,
    enableBatchOperations: true,
    memoryAlignment: true,
  },
};

/**
 * 数学库配置管理器
 */
export class MathConfig {
  private static config: MathLibConfig = { ...DEFAULT_CONFIG };

  /**
   * 获取当前配置
   */
  static getConfig(): Readonly<MathLibConfig> {
    return this.config;
  }

  /**
   * 设置完整配置
   */
  static setConfig(config: Partial<MathLibConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * 设置精度值
   */
  static setEpsilon(epsilon: number): void {
    this.config.epsilon = epsilon;
  }

  /**
   * 获取精度值
   */
  static getEpsilon(): number {
    return this.config.epsilon;
  }

  /**
   * 设置对象池大小
   */
  static setPoolSize(poolConfig: Partial<PoolConfig>): void {
    this.config.pool = {
      ...this.config.pool,
      ...poolConfig,
    };
  }

  /**
   * 获取对象池配置
   */
  static getPoolConfig(): Readonly<PoolConfig> {
    return this.config.pool;
  }

  /**
   * 启用/禁用SIMD
   */
  static enableSIMD(enabled: boolean): void {
    this.config.simd.enabled = enabled;
    this.config.performance.enableSIMD = enabled;
  }

  /**
   * 检查SIMD是否启用
   */
  static isSIMDEnabled(): boolean {
    return this.config.simd.enabled && this.config.performance.enableSIMD;
  }

  /**
   * 启用/禁用对象池
   */
  static enableObjectPool(enabled: boolean): void {
    this.config.performance.enableObjectPool = enabled;
  }

  /**
   * 检查对象池是否启用
   */
  static isObjectPoolEnabled(): boolean {
    return this.config.performance.enableObjectPool;
  }

  /**
   * 启用/禁用批量运算
   */
  static enableBatchOperations(enabled: boolean): void {
    this.config.performance.enableBatchOperations = enabled;
  }

  /**
   * 检查批量运算是否启用
   */
  static isBatchOperationsEnabled(): boolean {
    return this.config.performance.enableBatchOperations;
  }

  /**
   * 设置SIMD回退阈值
   */
  static setSIMDFallbackThreshold(threshold: number): void {
    this.config.simd.fallbackThreshold = threshold;
  }

  /**
   * 获取SIMD回退阈值
   */
  static getSIMDFallbackThreshold(): number {
    return this.config.simd.fallbackThreshold;
  }

  /**
   * 重置为默认配置
   */
  static reset(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * 获取性能统计信息
   */
  static getPerformanceStats(): {
    objectPoolEnabled: boolean;
    simdEnabled: boolean;
    batchOperationsEnabled: boolean;
    memoryAlignmentEnabled: boolean;
  } {
    return {
      objectPoolEnabled: this.config.performance.enableObjectPool,
      simdEnabled: this.config.performance.enableSIMD,
      batchOperationsEnabled: this.config.performance.enableBatchOperations,
      memoryAlignmentEnabled: this.config.performance.memoryAlignment,
    };
  }
}

/**
 * 导出默认配置
 */
export { DEFAULT_CONFIG };
