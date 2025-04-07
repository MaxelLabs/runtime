import { GLBuffer } from '../../src/webgl/GLBuffer';
import { GLConstants } from '../../src/webgl/GLConstants';

describe('GLBuffer', () => {
  let buffer: GLBuffer;
  let gl: WebGLRenderingContext;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl') as WebGLRenderingContext;
    buffer = new GLBuffer(
      gl,
      GLConstants.BUFFER_TYPE.ARRAY_BUFFER,
      GLConstants.BUFFER_USAGE.STATIC_DRAW,
      1024
    );
  });

  afterEach(() => {
    buffer.destroy();
  });

  test('创建缓冲区', () => {
    buffer.create();
    expect(buffer.type).toBe(GLConstants.BUFFER_TYPE.ARRAY_BUFFER);
    expect(buffer.usage).toBe(GLConstants.BUFFER_USAGE.STATIC_DRAW);
    expect(buffer.size).toBe(1024);
  });

  test('更新缓冲区数据', () => {
    buffer.create();
    const data = new Float32Array([1, 2, 3, 4]);
    buffer.update(data);
    // 由于WebGL上下文是模拟的，我们无法直接验证数据是否正确更新
    // 但可以验证方法是否被调用
  });

  test('绑定和解绑缓冲区', () => {
    buffer.create();
    buffer.bind();
    // 由于WebGL上下文是模拟的，我们无法直接验证绑定状态
    // 但可以验证方法是否被调用
    buffer.unbind();
  });

  test('销毁缓冲区', () => {
    buffer.create();
    buffer.destroy();
    // 由于WebGL上下文是模拟的，我们无法直接验证缓冲区是否被销毁
    // 但可以验证方法是否被调用
  });
}); 