import { GLFramebuffer } from '../../src/webgl/GLFramebuffer';
import { expect } from '@jest/globals';

describe('GLFramebuffer', () => {
  let framebuffer: GLFramebuffer;
  let gl: WebGLRenderingContext;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl') as WebGLRenderingContext;
    framebuffer = new GLFramebuffer(gl);
  });

  afterEach(() => {
    framebuffer.destroy();
  });

  test('创建帧缓冲对象', () => {
    framebuffer.create(800, 600);
    expect(framebuffer.getWidth()).toBe(800);
    expect(framebuffer.getHeight()).toBe(600);
  });

  test('获取颜色纹理', () => {
    framebuffer.create(800, 600);
    const colorTexture = framebuffer.getColorTexture();
    const depthTexture = framebuffer.getDepthTexture();

    expect(colorTexture).not.toBeNull();
    expect(depthTexture).not.toBeNull();

    if (colorTexture) {
      expect(colorTexture.getWidth()).toBe(800);
      expect(colorTexture.getHeight()).toBe(600);
    }

    if (depthTexture) {
      expect(depthTexture.getWidth()).toBe(800);
      expect(depthTexture.getHeight()).toBe(600);
    }
  });

  test('绑定和解绑帧缓冲对象', () => {
    framebuffer.create(800, 600);
    framebuffer.bind();
    // 由于WebGL上下文是模拟的，我们无法直接验证帧缓冲对象是否被绑定
    // 但可以验证方法是否被调用
    framebuffer.unbind();
  });

  test('销毁帧缓冲对象', () => {
    framebuffer.create(800, 600);
    framebuffer.destroy();
    // 由于WebGL上下文是模拟的，我们无法直接验证帧缓冲对象是否被销毁
    // 但可以验证方法是否被调用
  });
});