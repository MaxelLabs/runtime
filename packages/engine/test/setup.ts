/**
 * Jest 测试环境设置
 * Engine 包测试配置
 */

import { beforeAll, afterEach, jest } from '@jest/globals';
import { performance as nodePerformance } from 'perf_hooks';

// Mock HTMLCanvasElement for Node environment
if (typeof HTMLCanvasElement === 'undefined') {
  (global as any).HTMLCanvasElement = class HTMLCanvasElement {
    tagName = 'CANVAS';
  };
}

// Polyfill performance API for Node environment (Node 16+ has it globally, but ensure compatibility)
if (typeof performance === 'undefined') {
  (global as any).performance = nodePerformance;
}

// 设置全局测试配置
beforeAll(() => {
  console.info('Engine 测试环境初始化');
});

// 每个测试后清理
afterEach(() => {
  jest.clearAllMocks();
});

// 性能测试工具
export function performanceTest(name: string, fn: () => void, iterations: number = 10000): number {
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const end = performance.now();
  const duration = end - start;

  console.info(`性能测试 [${name}]: ${duration.toFixed(2)}ms (${iterations} 次迭代)`);

  return duration;
}

// 测试数据生成器
export const TestData = {
  // 生成随机字符串
  randomString(length: number = 10): string {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  },

  // 生成随机整数
  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // 生成随机浮点数
  randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  },

  // 生成随机 Vector3Like
  randomVector3(min: number = -100, max: number = 100): { x: number; y: number; z: number } {
    return {
      x: this.randomFloat(min, max),
      y: this.randomFloat(min, max),
      z: this.randomFloat(min, max),
    };
  },
};
