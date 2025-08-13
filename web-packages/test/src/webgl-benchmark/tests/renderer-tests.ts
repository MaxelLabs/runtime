/**
 * 渲染器性能测试套件
 */

import { ClearFlags } from '@maxellabs/rhi';
import { TestCase } from './index';

// 存储用于测试的临时对象
interface TestData {
  colors: Array<{r: number, g: number, b: number, a: number}>;
  currentColorIndex: number;
  width?: number;
  height?: number;
}

let testData: TestData = {
  colors: [
    { r: 0.1, g: 0.2, b: 0.3, a: 1.0 },
    { r: 0.7, g: 0.5, b: 0.3, a: 1.0 },
    { r: 0.2, g: 0.8, b: 0.1, a: 1.0 },
    { r: 0.9, g: 0.1, b: 0.5, a: 1.0 }
  ],
  currentColorIndex: 0
};

export const rendererTests: TestCase[] = [
  {
    name: '渲染器: 清除屏幕',
    iterations: 1000,
    setup: (renderer) => {
      // 不需要特别的设置
    },
    execute: (renderer) => {
      // 每次使用不同的颜色，避免优化
      const color = testData.colors[testData.currentColorIndex];
      renderer.setClearColor(color.r, color.g, color.b, color.a);
      renderer.clear(ClearFlags.COLOR | ClearFlags.DEPTH | ClearFlags.STENCIL);
      
      // 轮换颜色
      testData.currentColorIndex = (testData.currentColorIndex + 1) % testData.colors.length;
    },
    teardown: () => {
      // 不需要特别的清理
    }
  },
  
  {
    name: '渲染器: 设置视口',
    iterations: 500,
    setup: (renderer) => {
      // 获取画布尺寸
      const canvas = renderer.getGL().canvas;
      testData.width = canvas.width;
      testData.height = canvas.height;
    },
    execute: (renderer) => {
      // 设置不同的视口尺寸
      if (testData.width !== undefined && testData.height !== undefined) {
        renderer.setViewport(0, 0, testData.width, testData.height);
        renderer.setViewport(0, 0, testData.width / 2, testData.height / 2);
        renderer.setViewport(testData.width / 2, testData.height / 2, testData.width / 2, testData.height / 2);
        renderer.setViewport(0, 0, testData.width, testData.height); // 恢复原始视口
      }
    },
    teardown: () => {
      // 不需要特别的清理
    }
  },
  
  {
    name: '渲染器: 状态切换(深度测试)',
    iterations: 1000,
    setup: (renderer) => {
      // 确保默认状态
      renderer.disableDepthTest();
    },
    execute: (renderer) => {
      renderer.enableDepthTest();
      renderer.disableDepthTest();
    },
    teardown: (renderer) => {
      // 确保还原状态
      renderer.disableDepthTest();
    }
  },
  
  {
    name: '渲染器: 状态切换(混合)',
    iterations: 1000,
    setup: (renderer) => {
      // 确保默认状态
      renderer.disableBlend();
    },
    execute: (renderer) => {
      renderer.enableBlend();
      renderer.disableBlend();
    },
    teardown: (renderer) => {
      // 确保还原状态
      renderer.disableBlend();
    }
  },
  
  {
    name: '渲染器: 状态切换(面剔除)',
    iterations: 1000,
    setup: (renderer) => {
      // 确保默认状态
      renderer.disableCullFace();
    },
    execute: (renderer) => {
      renderer.enableCullFace();
      renderer.setCullFace('back');
      renderer.disableCullFace();
    },
    teardown: (renderer) => {
      // 确保还原状态
      renderer.disableCullFace();
    }
  }
]; 