/**
 * 浏览器中的WebGL性能测试入口
 */
import { runTests, TestResult } from './tests/index';
import './tests/renderer-tests';
import './tests/texture-tests';
import './tests/shader-tests';
import './tests/buffer-tests';
import { formatNumber, formatTime } from './utils/format';

// 测试结果存储
interface BenchmarkResults {
  tests: TestResult[];
  startTime: number;
  endTime: number;
}

const results: BenchmarkResults = {
  tests: [],
  startTime: 0,
  endTime: 0
};

/**
 * 启动浏览器环境下的性能基准测试
 * @returns {Promise<BenchmarkResults>} 测试结果
 */
export async function startBenchmark(): Promise<BenchmarkResults> {
  console.log('初始化WebGL上下文...');
  const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
  
  try {
    // 记录开始时间
    results.startTime = performance.now();
    
    // 初始化渲染器
    const renderer = await createRenderer(canvas);
    
    // 运行测试套件
    await runTests(renderer, recordTestResult);
    
    // 记录结束时间
    results.endTime = performance.now();
    
    // 显示结果
    displayResults();
    
    return results;
  } catch (error) {
    console.error('基准测试失败:', error);
    throw error;
  }
}

/**
 * 创建WebGL渲染器
 * @param {HTMLCanvasElement} canvas 画布元素
 * @returns {Promise<any>} 渲染器实例
 */
async function createRenderer(canvas: HTMLCanvasElement): Promise<any> {
  // 加载RHI模块
  const { GLRenderer } = await import('@max/rhi');
  
  try {
    const renderer = new GLRenderer();
    renderer.create(canvas);
    renderer.setViewport(canvas.width, canvas.height);
    return renderer;
  } catch (error) {
    console.error('创建渲染器失败:', error);
    throw new Error('无法创建WebGL渲染器. 可能浏览器不支持WebGL或已禁用.');
  }
}

/**
 * 记录测试结果
 * @param {TestResult} testResult 测试结果对象
 */
function recordTestResult(testResult: TestResult): void {
  results.tests.push(testResult);
  
  // 在控制台显示单个测试结果
  console.log(
    `${testResult.name.padEnd(30)} - ` +
    `${formatNumber(testResult.opsPerSecond).padStart(12)} 操作/秒 - ` +
    `${formatTime(testResult.duration).padStart(10)}`
  );
}

/**
 * 显示所有测试结果
 */
function displayResults(): void {
  // 计算总时间
  const totalTime = results.endTime - results.startTime;
  
  // 按每秒操作数排序结果
  results.tests.sort((a, b) => b.opsPerSecond - a.opsPerSecond);
  
  // 控制台显示表头
  console.log('\n' + '='.repeat(80));
  console.log('基准测试结果汇总');
  console.log('='.repeat(80));
  
  console.log(
    '测试名称'.padEnd(30) + ' | ' +
    '操作/秒'.padStart(15) + ' | ' +
    '运行时间'.padStart(12) + ' | ' +
    '迭代次数'.padStart(10)
  );
  console.log('-'.repeat(80));
  
  // 控制台显示每个测试结果
  for (const test of results.tests) {
    console.log(
      test.name.padEnd(30) + ' | ' +
      formatNumber(test.opsPerSecond).padStart(15) + ' | ' +
      formatTime(test.duration).padStart(12) + ' | ' +
      formatNumber(test.iterations).padStart(10)
    );
  }
  
  // 控制台显示总结
  console.log('-'.repeat(80));
  console.log(`总测试时间: ${formatTime(totalTime)}`);
  console.log(`测试数量: ${results.tests.length}`);
} 