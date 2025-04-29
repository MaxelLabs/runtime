/**
 * 命令行环境中的WebGL性能测试入口
 */

import { JSDOM } from 'jsdom';
import chalk from 'chalk';
import { runTests } from './tests/index';

// 创建虚拟DOM环境
const dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="webgl-canvas" width="800" height="600"></canvas></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

// 添加性能API
global.performance = {
  now: () => {
    return Number(process.hrtime.bigint() / BigInt(1000000));
  }
};

/**
 * 运行命令行环境下的性能基准测试
 */
async function startBenchmark(): Promise<void> {
  console.log(chalk.blue('初始化WebGL上下文...'));
  
  try {
    const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
    
    // 记录开始时间
    const startTime = performance.now();
    
    console.log(chalk.yellow('警告: 在命令行环境中，WebGL上下文可能无法正常工作'));
    console.log(chalk.yellow('建议使用浏览器环境进行完整测试: npm run test:browser'));
    
    console.log(chalk.red('终止测试 - 请在浏览器中运行完整测试'));
    
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('基准测试失败:'), error);
    process.exit(1);
  }
}

startBenchmark(); 