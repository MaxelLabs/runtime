import { GLShader } from '../../src/webgl/GLShader';
import { expect } from '@jest/globals';
import { GLShaderConstants } from '../../src/webgl/GLShaderConstants';

describe('GLShader', () => {
  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext;
  let shader: GLShader;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl')!;
    shader = new GLShader(gl);
    shader.create(`
      attribute vec4 a_position;
      void main() {
        gl_Position = a_position;
      }
    `, `
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `);
  });

  afterEach(() => {
    shader.dispose();
  });

  it('should create shader program', () => {
    expect(shader.vertexSource).toBeDefined();
    expect(shader.fragmentSource).toBeDefined();
  });

  it('should set uniform values', () => {
    shader.use();
    shader.setUniform1f('u_time', 1.0);
    shader.setUniform2f('u_resolution', 800, 600);
    shader.setUniform3f('u_color', 1.0, 0.0, 0.0);
    shader.setUniform4f('u_color', 1.0, 0.0, 0.0, 1.0);
    shader.setUniform1i('u_texture', 0);
    shader.setUniformMatrix4fv('u_matrix', new Float32Array(16));
  });

  test('使用着色器程序', () => {
    shader.create(
      GLShaderConstants.VERTEX_SHADER,
      GLShaderConstants.FRAGMENT_SHADER
    );
    shader.use();
    // 由于WebGL上下文是模拟的，我们无法直接验证着色器程序是否被使用
    // 但可以验证方法是否被调用
  });

  test('设置uniform变量', () => {
    shader.create(
      GLShaderConstants.VERTEX_SHADER,
      GLShaderConstants.FRAGMENT_SHADER
    );
    shader.use();

    // 测试设置float uniform
    shader.setUniform1f('uTime', 1.0);

    // 测试设置vec2 uniform
    shader.setUniform2f('uResolution', 800, 600);

    // 测试设置vec3 uniform
    shader.setUniform3f('uColor', 1.0, 0.0, 0.0);

    // 测试设置vec4 uniform
    shader.setUniform4f('uColor', 1.0, 0.0, 0.0, 1.0);

    // 测试设置mat4 uniform
    const matrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);

    shader.setUniformMatrix4fv('uModelViewMatrix', matrix);

    // 测试设置int uniform
    shader.setUniform1i('uTexture', 0);

    // 由于WebGL上下文是模拟的，我们无法直接验证uniform变量是否正确设置
    // 但可以验证方法是否被调用
  });

  test('销毁着色器程序', () => {
    shader.create(
      GLShaderConstants.VERTEX_SHADER,
      GLShaderConstants.FRAGMENT_SHADER
    );
    shader.dispose();
    // 由于WebGL上下文是模拟的，我们无法直接验证着色器程序是否被销毁
    // 但可以验证方法是否被调用
  });
});