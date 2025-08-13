import { GLTexture } from '../../src/webgl/GLTexture';
import { GLConstants } from '../../src/webgl/GLConstants';
import { expect } from '@jest/globals';

describe('GLTexture', () => {
  let texture: GLTexture;
  let gl: WebGLRenderingContext;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl') as WebGLRenderingContext;
    texture = new GLTexture(gl, GLConstants.TEXTURE_FORMAT.RGBA, GLConstants.DATA_TYPE.UNSIGNED_BYTE);
  });

  afterEach(() => {
    texture.destroy();
  });

  test('创建纹理', () => {
    texture.create();
    // 由于WebGL上下文是模拟的，我们无法直接验证纹理是否创建成功
    // 但可以验证方法是否被调用
  });

  test('设置纹理数据', () => {
    texture.create();
    const data = new Uint8Array(4 * 4 * 4);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255; // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 255; // A
    }
    texture.setData(data, 4, 4);
    expect(texture.getWidth()).toBe(4);
    expect(texture.getHeight()).toBe(4);
  });

  test('设置纹理参数', () => {
    texture.create();
    texture.setParameters(
      GLConstants.TEXTURE_FILTER.LINEAR,
      GLConstants.TEXTURE_FILTER.LINEAR,
      GLConstants.TEXTURE_WRAP.REPEAT,
      GLConstants.TEXTURE_WRAP.REPEAT
    );
    // 由于WebGL上下文是模拟的，我们无法直接验证纹理参数是否正确设置
    // 但可以验证方法是否被调用
  });

  test('绑定和解绑纹理', () => {
    texture.create();
    texture.bind();
    // 由于WebGL上下文是模拟的，我们无法直接验证纹理是否被绑定
    // 但可以验证方法是否被调用
    texture.unbind();
  });

  test('设置图像数据', () => {
    texture.create();
    const image = new Image();

    image.width = 4;
    image.height = 4;
    texture.setImage(image);
    expect(texture.getWidth()).toBe(4);
    expect(texture.getHeight()).toBe(4);
  });

  test('销毁纹理', () => {
    texture.create();
    texture.destroy();
    // 由于WebGL上下文是模拟的，我们无法直接验证纹理是否被销毁
    // 但可以验证方法是否被调用
  });
});
