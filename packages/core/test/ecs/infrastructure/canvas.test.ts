/**
 * Canvas 模块测试
 * 测试画布封装
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Canvas } from '../../../src/infrastructure/canvas';
import { clearErrors, errors } from '../../../src/utils/errors';

// Mock DOM环境
const createMockCanvas = (id: string = 'testCanvas', width: number = 800, height: number = 600): any => {
  // 创建一个HTMLCanvasElement实例（使用mock类）
  const canvas = Object.create(HTMLCanvasElement.prototype);

  // 设置基本属性
  canvas.id = id;
  canvas.width = width;
  canvas.height = height;
  canvas.tagName = 'CANVAS';
  canvas.style = {};
  canvas._clientWidth = width;
  canvas._clientHeight = height;

  // 使用defineProperty定义getter/setter
  Object.defineProperty(canvas, 'clientWidth', {
    get() {
      return this._clientWidth || width;
    },
    set(value: number) {
      this._clientWidth = value;
    },
    configurable: true,
  });

  Object.defineProperty(canvas, 'clientHeight', {
    get() {
      return this._clientHeight || height;
    },
    set(value: number) {
      this._clientHeight = value;
    },
    configurable: true,
  });

  return canvas;
};

// Mock document.getElementById
const mockGetElementById = (canvas: HTMLCanvasElement | null) => {
  global.document = {
    getElementById: (id: string) => canvas,
  } as any;
};

describe('Canvas - 画布封装', () => {
  beforeEach(() => {
    clearErrors();
    // 设置基本的全局环境
    (global as any).window = {};
    (global as any).document = {};
  });

  describe('构造函数 - 使用元素', () => {
    it('应该接受HTMLCanvasElement', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      expect(canvas.getWidth()).toBe(800);
      expect(canvas.getHeight()).toBe(600);
    });
  });

  describe('构造函数 - 使用ID', () => {
    it('应该通过ID查找画布', () => {
      const mockCanvas = createMockCanvas('myCanvas');
      mockGetElementById(mockCanvas);

      const canvas = new Canvas('myCanvas');

      expect(canvas.getWidth()).toBe(800);
    });

    it('找不到画布应该抛出错误', () => {
      mockGetElementById(null);

      expect(() => {
        new Canvas('nonexistent');
      }).toThrow();

      expect(errors.length).toBeGreaterThan(0);
    });

    it('元素不是canvas应该抛出错误', () => {
      const mockDiv = { id: 'notCanvas', tagName: 'DIV' } as any;
      mockGetElementById(mockDiv);

      expect(() => {
        new Canvas('notCanvas');
      }).toThrow();

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('getWidth/setWidth', () => {
    it('应该获取画布宽度', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      expect(canvas.getWidth()).toBe(800);
    });

    it('应该设置画布宽度', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      canvas.setWidth(1024);

      expect(canvas.getWidth()).toBe(1024);
    });
  });

  describe('getHeight/setHeight', () => {
    it('应该获取画布高度', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      expect(canvas.getHeight()).toBe(600);
    });

    it('应该设置画布高度', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      canvas.setHeight(768);

      expect(canvas.getHeight()).toBe(768);
    });
  });

  describe('getClientWidth/getClientHeight', () => {
    it('应该获取客户端宽度', () => {
      const mockCanvas = createMockCanvas();
      mockCanvas._clientWidth = 1000;

      const canvas = new Canvas(mockCanvas);

      expect(canvas.getClientWidth()).toBe(1000);
    });

    it('应该获取客户端高度', () => {
      const mockCanvas = createMockCanvas();
      mockCanvas._clientHeight = 800;

      const canvas = new Canvas(mockCanvas);

      expect(canvas.getClientHeight()).toBe(800);
    });
  });

  describe('resizeByClientSize', () => {
    it('客户端尺寸不同时应该调整大小', () => {
      const mockCanvas = createMockCanvas();
      mockCanvas._clientWidth = 1024;
      mockCanvas._clientHeight = 768;

      const canvas = new Canvas(mockCanvas);

      const resized = canvas.resizeByClientSize();

      expect(resized).toBe(true);
      expect(canvas.getWidth()).toBe(1024);
      expect(canvas.getHeight()).toBe(768);
    });

    it('客户端尺寸相同时不应该调整', () => {
      const mockCanvas = createMockCanvas();

      const canvas = new Canvas(mockCanvas);

      const resized = canvas.resizeByClientSize();

      expect(resized).toBe(false);
    });

    it('应该支持指定宽高', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      const resized = canvas.resizeByClientSize(1920, 1080);

      expect(resized).toBe(true);
      expect(canvas.getWidth()).toBe(1920);
      expect(canvas.getHeight()).toBe(1080);
    });

    it('应该支持只指定宽度', () => {
      const mockCanvas = createMockCanvas();
      mockCanvas._clientHeight = 1080;

      const canvas = new Canvas(mockCanvas);

      canvas.resizeByClientSize(1920, undefined);

      expect(canvas.getWidth()).toBe(1920);
      expect(canvas.getHeight()).toBe(1080); // 使用clientHeight
    });
  });

  describe('getElement 方法', () => {
    it('应该返回原生 Canvas 元素', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      expect(canvas.getElement()).toBe(mockCanvas);
    });
  });

  describe('getDevicePixelRatio 方法', () => {
    it('应该返回当前设备像素比', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      expect(canvas.getDevicePixelRatio()).toBeGreaterThanOrEqual(1);
    });

    it('禁用 DPR 处理时应该返回 1', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas, { handleDevicePixelRatio: false });

      expect(canvas.getDevicePixelRatio()).toBe(1);
    });
  });

  describe('getSystemDevicePixelRatio 方法', () => {
    it('应该返回系统设备像素比', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      expect(canvas.getSystemDevicePixelRatio()).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateDevicePixelRatio 方法', () => {
    it('应该更新设备像素比', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      const dpr = canvas.updateDevicePixelRatio();

      expect(dpr).toBeGreaterThanOrEqual(1);
    });

    it('应该限制最大设备像素比', () => {
      (global as any).window = { devicePixelRatio: 4 };
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas, { maxDevicePixelRatio: 2 });

      const dpr = canvas.updateDevicePixelRatio();

      expect(dpr).toBeLessThanOrEqual(2);
    });
  });

  describe('enableAutoResize 和 disableAutoResize 方法', () => {
    it('应该启用自动 resize', () => {
      const mockCanvas = createMockCanvas();
      (global as any).window = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      const canvas = new Canvas(mockCanvas);
      canvas.enableAutoResize();

      expect((global as any).window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('应该禁用自动 resize', () => {
      const mockCanvas = createMockCanvas();
      (global as any).window = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      const canvas = new Canvas(mockCanvas);
      canvas.enableAutoResize();
      canvas.disableAutoResize();

      expect((global as any).window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('多次启用不应该重复添加监听器', () => {
      const mockCanvas = createMockCanvas();
      (global as any).window = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      const canvas = new Canvas(mockCanvas);
      canvas.enableAutoResize();
      canvas.enableAutoResize();
      canvas.enableAutoResize();

      expect((global as any).window.addEventListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispose - 释放', () => {
    it('应该释放画布', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      canvas.dispose();

      expect(canvas.isDisposed()).toBe(true);
    });

    it('应该禁用自动 resize', () => {
      const mockCanvas = createMockCanvas();
      (global as any).window = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      const canvas = new Canvas(mockCanvas);
      canvas.enableAutoResize();
      canvas.dispose();

      expect((global as any).window.removeEventListener).toHaveBeenCalled();
    });

    it('多次释放应该是安全的', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      canvas.dispose();
      canvas.dispose();
      canvas.dispose();

      expect(canvas.isDisposed()).toBe(true);
    });

    it('释放后不应该启用自动 resize', () => {
      const mockCanvas = createMockCanvas();
      (global as any).window = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      const canvas = new Canvas(mockCanvas);
      canvas.dispose();
      canvas.enableAutoResize();

      expect((global as any).window.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('静态方法', () => {
    it('isWebGLSupported 应该返回布尔值', () => {
      const result = Canvas.isWebGLSupported();
      expect(typeof result).toBe('boolean');
    });

    it('isWebGL2Supported 应该返回布尔值', () => {
      const result = Canvas.isWebGL2Supported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('复杂场景', () => {
    it('应该处理窗口resize', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      // 初始尺寸
      expect(canvas.getWidth()).toBe(800);
      expect(canvas.getHeight()).toBe(600);

      // 模拟窗口resize
      mockCanvas._clientWidth = 1024;
      mockCanvas._clientHeight = 768;

      canvas.resizeByClientSize();

      expect(canvas.getWidth()).toBe(1024);
      expect(canvas.getHeight()).toBe(768);
    });

    it('应该支持多次调整大小', () => {
      const mockCanvas = createMockCanvas();
      const canvas = new Canvas(mockCanvas);

      canvas.setWidth(1024);
      canvas.setHeight(768);
      expect(canvas.getWidth()).toBe(1024);

      canvas.setWidth(1920);
      canvas.setHeight(1080);
      expect(canvas.getWidth()).toBe(1920);

      canvas.setWidth(800);
      canvas.setHeight(600);
      expect(canvas.getWidth()).toBe(800);
    });
  });
});
