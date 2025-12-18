/**
 * Jest 测试环境设置
 * 配置全局测试环境和工具函数
 */

import { beforeAll, afterEach, expect, jest } from '@jest/globals';

// Mock HTMLCanvasElement for Node environment
if (typeof HTMLCanvasElement === 'undefined') {
  (global as any).HTMLCanvasElement = class HTMLCanvasElement {
    tagName = 'CANVAS';
  };
}

// 设置全局测试配置
beforeAll(() => {
  // Core包测试配置
  console.info('Core测试环境初始化');
});

// 每个测试后清理
afterEach(() => {
  jest.clearAllMocks();
});

// 全局测试工具函数
declare global {
  namespace jest {
    interface Matchers<R> {
      // 对象池测试匹配器
      toHavePoolStats(expected: { available?: number; inUse?: number; total?: number }): R;
    }
  }
}

// 自定义匹配器
expect.extend({
  toHavePoolStats(received: any, expected: { available?: number; inUse?: number; total?: number }) {
    const stats = received;
    let pass = true;
    const messages: string[] = [];

    if (expected.available !== undefined && stats.available !== expected.available) {
      pass = false;
      messages.push(`available: 期望 ${expected.available}, 实际 ${stats.available}`);
    }

    if (expected.inUse !== undefined && stats.inUse !== expected.inUse) {
      pass = false;
      messages.push(`inUse: 期望 ${expected.inUse}, 实际 ${stats.inUse}`);
    }

    if (expected.total !== undefined && stats.total !== expected.total) {
      pass = false;
      messages.push(`total: 期望 ${expected.total}, 实际 ${stats.total}`);
    }

    if (pass) {
      return {
        message: () => `期望对象池状态不匹配`,
        pass: true,
      };
    } else {
      return {
        message: () => `对象池状态不匹配:\n${messages.join('\n')}`,
        pass: false,
      };
    }
  },
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

// 内存测试工具
export function memoryTest(name: string, fn: () => void): void {
  if (global.gc) {
    global.gc();
    const before = process.memoryUsage().heapUsed;

    fn();

    global.gc();
    const after = process.memoryUsage().heapUsed;
    const diff = (after - before) / 1024 / 1024;

    console.info(`内存测试 [${name}]: ${diff.toFixed(2)}MB`);
  } else {
    console.warn('内存测试需要 --expose-gc 标志');
  }
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
};
