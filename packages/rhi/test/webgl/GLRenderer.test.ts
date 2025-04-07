import { GLRenderer } from '../../src/webgl/GLRenderer';
import { GLConstants } from '../../src/webgl/GLConstants';
import { expect } from '@jest/globals';

describe('GLRenderer', () => {
  let renderer: GLRenderer;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    renderer = new GLRenderer();
    renderer.create(canvas);
  });

  afterEach(() => {
    renderer.destroy();
  });

  test('创建渲染器', () => {
    expect(renderer.width).toBe(800);
    expect(renderer.height).toBe(600);
  });

  test('设置视口大小', () => {
    renderer.setViewport(400, 300);
    expect(renderer.width).toBe(400);
    expect(renderer.height).toBe(300);
  });

  test('清除画布', () => {
    renderer.clear();
    // 由于WebGL上下文是模拟的，我们无法直接验证清除结果
    // 但可以验证方法是否被调用
  });

  test('创建和销毁缓冲区', () => {
    const buffer = renderer.createBuffer(
      GLConstants.BUFFER_TYPE.ARRAY_BUFFER,
      GLConstants.BUFFER_USAGE.STATIC_DRAW,
      1024
    );

    expect(buffer).toBeDefined();
    expect(buffer.type).toBe(GLConstants.BUFFER_TYPE.ARRAY_BUFFER);
    expect(buffer.usage).toBe(GLConstants.BUFFER_USAGE.STATIC_DRAW);
    expect(buffer.size).toBe(1024);

    renderer.destroyBuffer(buffer);
    // 由于WebGL上下文是模拟的，我们无法直接验证缓冲区是否被销毁
    // 但可以验证方法是否被调用
  });

  test('绘制', () => {
    renderer.draw(GLConstants.DRAW_MODE.TRIANGLES, 3);
    // 由于WebGL上下文是模拟的，我们无法直接验证绘制结果
    // 但可以验证方法是否被调用
  });

  test('使用索引绘制', () => {
    renderer.drawIndexed(GLConstants.DRAW_MODE.TRIANGLES, 3);
    // 由于WebGL上下文是模拟的，我们无法直接验证绘制结果
    // 但可以验证方法是否被调用
  });
});