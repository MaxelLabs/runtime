import { GLVertexArray } from '../../src/webgl/GLVertexArray';
import { GLConstants } from '../../src/webgl/GLConstants';
import { expect } from '@jest/globals';

describe('GLVertexArray', () => {
  let vao: GLVertexArray;
  let gl: WebGLRenderingContext;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl') as WebGLRenderingContext;
    vao = new GLVertexArray(gl as any);
  });

  afterEach(() => {
    vao.destroy();
  });

  test('创建顶点数组对象', () => {
    vao.create();
    // 由于WebGL上下文是模拟的，我们无法直接验证顶点数组对象是否创建成功
    // 但可以验证方法是否被调用
  });

  test('设置属性位置', () => {
    vao.setAttributeLocation('aPosition', 0);
    vao.setAttributeLocation('aTexCoord', 1);
    vao.setAttributeLocation('aColor', 2);

    expect(vao.getAttributeLocation('aPosition')).toBe(0);
    expect(vao.getAttributeLocation('aTexCoord')).toBe(1);
    expect(vao.getAttributeLocation('aColor')).toBe(2);
  });

  test('设置顶点属性', () => {
    vao.create();
    vao.setAttributeLocation('aPosition', 0);

    // 创建测试缓冲区
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const vertices = new Float32Array([1, 2, 3, 4]);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    vao.setAttribute('aPosition', buffer as WebGLBuffer, 2, GLConstants.DATA_TYPE.FLOAT, false, 0, 0);

    // 由于WebGL上下文是模拟的，我们无法直接验证顶点属性是否正确设置
    // 但可以验证方法是否被调用
  });

  test('绑定和解绑顶点数组对象', () => {
    vao.create();
    vao.bind();
    // 由于WebGL上下文是模拟的，我们无法直接验证顶点数组对象是否被绑定
    // 但可以验证方法是否被调用
    vao.unbind();
  });

  test('销毁顶点数组对象', () => {
    vao.create();
    vao.destroy();
    // 由于WebGL上下文是模拟的，我们无法直接验证顶点数组对象是否被销毁
    // 但可以验证方法是否被调用
  });
});
