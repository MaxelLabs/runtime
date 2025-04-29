/**
 * 测试套件索引
 * 导出所有WebGL基准测试套件并提供统一运行接口
 */

import { bufferTests } from './buffer-tests';
import { shaderTests } from './shader-tests';
import { textureTests } from './texture-tests';
import { rendererTests } from './renderer-tests';

// 定义测试接口
export interface TestCase {
  name: string;
  iterations: number;
  setup?: (renderer: any) => void;
  execute: (renderer: any) => void;
  teardown?: () => void;
}

export interface TestResult {
  name: string;
  iterations: number;
  duration: number;
  opsPerSecond: number;
}

// 合并所有测试
const allTests: TestCase[] = [
  ...bufferTests || [],
  ...shaderTests || [],
  ...textureTests || [],
  ...rendererTests || []
];

/**
 * 运行所有基准测试
 * @param {Object} renderer 渲染器实例
 * @param {Function} onTestComplete 测试完成回调函数
 * @returns {Promise<Array>} 测试结果数组
 */
export async function runTests(
  renderer: any, 
  onTestComplete?: (result: TestResult) => void
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // 依次运行每个测试
  for (const test of allTests) {
    // 跳过未实现的测试
    if (!test.execute) continue;
    
    try {
      // 设置测试
      if (test.setup) {
        test.setup(renderer);
      }
      
      // 测试执行
      const iterations = test.iterations || 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        test.execute(renderer);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const opsPerSecond = iterations / (duration / 1000);
      
      // 记录结果
      const result: TestResult = {
        name: test.name,
        iterations,
        duration,
        opsPerSecond
      };
      
      results.push(result);
      
      // 回调通知
      if (onTestComplete) {
        onTestComplete(result);
      }
    } catch (error) {
      console.error(`测试 ${test.name} 失败:`, error);
    } finally {
      // 清理测试
      if (test.teardown) {
        test.teardown();
      }
    }
  }
  
  return results;
} 