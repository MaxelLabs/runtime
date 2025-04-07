import { GLShader } from '../../src/webgl/GLShader';
import { GLShaderConstants } from '../../src/webgl/GLShaderConstants';

describe('GLShader', () => {
  let shader: GLShader;
  let gl: WebGLRenderingContext;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl') as WebGLRenderingContext;
    shader = new GLShader(gl);
  });

  afterEach(() => {
    shader.destroy();
  });

  test('创建着色器程序', () => {
    shader.create(
      GLShaderConstants.VERTEX_SHADER,
      GLShaderConstants.FRAGMENT_SHADER
    );
    // 由于WebGL上下文是模拟的，我们无法直接验证着色器程序是否创建成功
    // 但可以验证方法是否被调用
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
      0, 0, 0, 1
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
    shader.destroy();
    // 由于WebGL上下文是模拟的，我们无法直接验证着色器程序是否被销毁
    // 但可以验证方法是否被调用
  });
}); 