/**
 * Jest 测试环境设置
 * 配置全局测试环境和工具函数
 */

import { MathConfig } from '../src/config/mathConfig';

// 设置全局测试配置
beforeAll(() => {
  // 启用所有性能特性用于测试
  MathConfig.enableObjectPool(true);
  MathConfig.enableSIMD(true);
  MathConfig.enableBatchOperations(true);

  // 设置较小的对象池大小用于测试
  MathConfig.setPoolSize({
    Vector2: 10,
    Vector3: 20,
    Vector4: 10,
    Matrix3: 5,
    Matrix4: 5,
    Quaternion: 10,
    Color: 10,
  });

  // 设置测试精度
  MathConfig.setEpsilon(1e-6);
});

// 每个测试后清理
afterEach(() => {
  // 清理所有对象池
  jest.clearAllMocks();
});

// 全局测试工具函数
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeCloseTo(expected: number, precision?: number): R;
      toEqualVector2(expected: { x: number; y: number }, precision?: number): R;
      toEqualVector3(expected: { x: number; y: number; z: number }, precision?: number): R;
      toEqualVector4(expected: { x: number; y: number; z: number; w: number }, precision?: number): R;
      toEqualQuaternion(expected: { x: number; y: number; z: number; w: number }, precision?: number): R;
      toEqualMatrix4(expected: number[] | Float32Array): R;
    }
  }
}

// 自定义匹配器
expect.extend({
  toEqualVector2(received: any, expected: { x: number; y: number }, precision = 6) {
    const pass =
      Math.abs(received.x - expected.x) < Math.pow(10, -precision) &&
      Math.abs(received.y - expected.y) < Math.pow(10, -precision);

    if (pass) {
      return {
        message: () => `期望 ${received} 不等于 ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `期望 ${received} 等于 ${expected}`,
        pass: false,
      };
    }
  },
  toEqualVector3(received: any, expected: { x: number; y: number; z: number }, precision = 6) {
    const pass =
      Math.abs(received.x - expected.x) < Math.pow(10, -precision) &&
      Math.abs(received.y - expected.y) < Math.pow(10, -precision) &&
      Math.abs(received.z - expected.z) < Math.pow(10, -precision);

    if (pass) {
      return {
        message: () => `期望 ${received} 不等于 ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `期望 ${received} 等于 ${expected}`,
        pass: false,
      };
    }
  },

  toEqualQuaternion(received: any, expected: { x: number; y: number; z: number; w: number }, precision = 6) {
    const pass =
      Math.abs(received.x - expected.x) < Math.pow(10, -precision) &&
      Math.abs(received.y - expected.y) < Math.pow(10, -precision) &&
      Math.abs(received.z - expected.z) < Math.pow(10, -precision) &&
      Math.abs(received.w - expected.w) < Math.pow(10, -precision);

    if (pass) {
      return {
        message: () => `期望 ${received} 不等于 ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `期望 ${received} 等于 ${expected}`,
        pass: false,
      };
    }
  },

  toEqualMatrix4(received: any, expected: number[], precision = 6) {
    if (!received.elements || !Array.isArray(expected) || expected.length !== 16) {
      return {
        message: () => `无效的矩阵参数`,
        pass: false,
      };
    }

    let pass = true;
    for (let i = 0; i < 16; i++) {
      if (Math.abs(received.elements[i] - expected[i]) >= Math.pow(10, -precision)) {
        pass = false;
        break;
      }
    }

    if (pass) {
      return {
        message: () => `期望矩阵不等于预期值`,
        pass: true,
      };
    } else {
      return {
        message: () => `期望矩阵等于预期值，但实际不等`,
        pass: false,
      };
    }
  },
});

// 性能测试辅助函数
export const performanceTest = (name: string, fn: () => void, iterations = 1000) => {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const duration = end - start;

  console.log(
    `[性能] ${name}: ${iterations} 次迭代, 总时间: ${duration.toFixed(2)}ms, 平均: ${(duration / iterations).toFixed(4)}ms/次`
  );

  return duration;
};

// 内存测试辅助函数
export const memoryTest = (name: string, fn: () => void) => {
  // 手动触发垃圾回收（如果可用）
  if (global.gc) {
    global.gc();
  }

  const initialMemory = process.memoryUsage();

  fn();

  if (global.gc) {
    global.gc();
  }

  const finalMemory = process.memoryUsage();
  const memoryDiff = finalMemory.heapUsed - initialMemory.heapUsed;

  console.log(`[内存] ${name}: 内存变化: ${memoryDiff} bytes (${(memoryDiff / 1024 / 1024).toFixed(2)} MB)`);

  return memoryDiff;
};

// 随机数生成器（确定性）
export class SeededRandom {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextFloat(min = 0, max = 1): number {
    return min + (max - min) * this.next();
  }

  nextInt(min = 0, max = 100): number {
    return Math.floor(this.nextFloat(min, max + 1));
  }
}

// 导出测试用的随机数生成器实例
export const testRandom = new SeededRandom();

// 测试数据生成器
export const TestData = {
  // 生成随机向量
  randomVector3: () => ({
    x: testRandom.nextFloat(-100, 100),
    y: testRandom.nextFloat(-100, 100),
    z: testRandom.nextFloat(-100, 100),
  }),

  // 生成单位向量
  randomUnitVector3: () => {
    const v = TestData.randomVector3();
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  },

  // 生成随机四元数
  randomQuaternion: () => ({
    x: testRandom.nextFloat(-1, 1),
    y: testRandom.nextFloat(-1, 1),
    z: testRandom.nextFloat(-1, 1),
    w: testRandom.nextFloat(-1, 1),
  }),

  // 生成单位四元数
  randomUnitQuaternion: () => {
    const q = TestData.randomQuaternion();
    const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
    return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
  },

  // 生成随机矩阵元素
  randomMatrix4Elements: (): number[] => {
    const elements: number[] = [];
    for (let i = 0; i < 16; i++) {
      elements[i] = testRandom.nextFloat(-10, 10);
    }
    return elements;
  },

  // 常用测试向量
  testVectors: [
    { x: 0, y: 0, z: 0 }, // 零向量
    { x: 1, y: 0, z: 0 }, // X轴单位向量
    { x: 0, y: 1, z: 0 }, // Y轴单位向量
    { x: 0, y: 0, z: 1 }, // Z轴单位向量
    { x: 1, y: 1, z: 1 }, // 对角向量
    { x: -1, y: -1, z: -1 }, // 负对角向量
    { x: 3, y: 4, z: 5 }, // 随机向量1
    { x: -2, y: 6, z: -8 }, // 随机向量2
  ],

  // 常用测试四元数
  testQuaternions: [
    { x: 0, y: 0, z: 0, w: 1 }, // 单位四元数
    { x: 1, y: 0, z: 0, w: 0 }, // X轴旋转90度
    { x: 0, y: 1, z: 0, w: 0 }, // Y轴旋转90度
    { x: 0, y: 0, z: 1, w: 0 }, // Z轴旋转90度
    { x: 0.5, y: 0.5, z: 0.5, w: 0.5 }, // 复合旋转
  ],
};
