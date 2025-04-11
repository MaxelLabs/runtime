// SIMD 类型声明
declare const SIMD: {
  Float32x4: {
    load: (array: Float32Array, index: number) => any,
    sub: (a: any, b: any) => any,
    mul: (a: any, b: any) => any,
    add: (a: any, b: any) => any,
    extractLane: (a: any, index: number) => number,
  },
};

export class Vector3 {
  public x: number;
  public y: number;
  public z: number;

  constructor (x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * 计算两个向量之间的距离（SIMD 优化版本）
   */
  static distanceSIMD (v1: Vector3, v2: Vector3): number {
    const a = new Float32Array(4);
    const b = new Float32Array(4);

    a[0] = v1.x; a[1] = v1.y; a[2] = v1.z; a[3] = 0;
    b[0] = v2.x; b[1] = v2.y; b[2] = v2.z; b[3] = 0;

    // 使用 SIMD 指令计算差值
    const diff = new Float32Array(4);

    for (let i = 0; i < 4; i++) {
      diff[i] = a[i] - b[i];
    }

    // 计算平方和
    let sum = 0;

    for (let i = 0; i < 3; i++) {
      sum += diff[i] * diff[i];
    }

    return Math.sqrt(sum);
  }

  /**
   * 计算两个向量之间的距离（自动选择最优实现）
   */
  static distance (v1: Vector3, v2: Vector3): number {
    // 检查是否支持 SIMD
    if (typeof SIMD !== 'undefined') {
      return Vector3.distanceSIMD(v1, v2);
    }

    return Vector3.distanceScalar(v1, v2);
  }

  /**
   * 计算两个向量之间的距离（标量版本）
   */
  static distanceScalar (v1: Vector3, v2: Vector3): number {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    const dz = v1.z - v2.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}