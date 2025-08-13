// 模拟WebGL和WebGL2上下文和相关类

// 创建模拟的WebGL类
class MockWebGLBuffer {}
class MockWebGLShader {}
class MockWebGLProgram {}
class MockWebGLUniformLocation {}
class MockWebGLTexture {}
class MockWebGLVertexArrayObject {}
class MockWebGLFramebuffer {}

class MockWebGLRenderingContext {
  // 常量
  ARRAY_BUFFER = 0x8892;
  ELEMENT_ARRAY_BUFFER = 0x8893;
  STATIC_DRAW = 0x88e4;
  DYNAMIC_DRAW = 0x88e8;
  STREAM_DRAW = 0x88e0;
  VERTEX_SHADER = 0x8b31;
  FRAGMENT_SHADER = 0x8b30;
  BYTE = 0x1400;
  UNSIGNED_BYTE = 0x1401;
  SHORT = 0x1402;
  UNSIGNED_SHORT = 0x1403;
  INT = 0x1404;
  UNSIGNED_INT = 0x1405;
  FLOAT = 0x1406;
  DOUBLE = 0x140a;
  RGB = 0x1907;
  RGBA = 0x1908;
  LUMINANCE = 0x1909;
  LUMINANCE_ALPHA = 0x190a;
  ALPHA = 0x1906;
  DEPTH_COMPONENT = 0x1902;
  TEXTURE_MIN_FILTER = 0x2801;
  TEXTURE_MAG_FILTER = 0x2800;
  TEXTURE_WRAP_S = 0x2802;
  TEXTURE_WRAP_T = 0x2803;
  NEAREST = 0x2600;
  LINEAR = 0x2601;
  NEAREST_MIPMAP_NEAREST = 0x2700;
  LINEAR_MIPMAP_NEAREST = 0x2701;
  NEAREST_MIPMAP_LINEAR = 0x2702;
  LINEAR_MIPMAP_LINEAR = 0x2703;
  REPEAT = 0x2901;
  CLAMP_TO_EDGE = 0x812f;
  MIRRORED_REPEAT = 0x8370;
  POINTS = 0x0000;
  LINES = 0x0001;
  LINE_LOOP = 0x0002;
  LINE_STRIP = 0x0003;
  TRIANGLES = 0x0004;
  TRIANGLE_STRIP = 0x0005;
  TRIANGLE_FAN = 0x0006;
  NEVER = 0x0200;
  LESS = 0x0201;
  EQUAL = 0x0202;
  LEQUAL = 0x0203;
  GREATER = 0x0204;
  NOTEQUAL = 0x0205;
  GEQUAL = 0x0206;
  ALWAYS = 0x0207;
  ZERO = 0;
  ONE = 1;
  SRC_COLOR = 0x0300;
  ONE_MINUS_SRC_COLOR = 0x0301;
  SRC_ALPHA = 0x0302;
  ONE_MINUS_SRC_ALPHA = 0x0303;
  DST_ALPHA = 0x0304;
  ONE_MINUS_DST_ALPHA = 0x0305;
  DST_COLOR = 0x0306;
  ONE_MINUS_DST_COLOR = 0x0307;
  SRC_ALPHA_SATURATE = 0x0308;
  FRONT = 0x0404;
  BACK = 0x0405;
  FRONT_AND_BACK = 0x0408;
  BLEND = 0x0be2;
  DEPTH_TEST = 0x0b71;
  CULL_FACE = 0x0b44;
  SCISSOR_TEST = 0x0c11;
  COLOR_BUFFER_BIT = 0x00004000;
  DEPTH_BUFFER_BIT = 0x00000100;
  TEXTURE_2D = 0x0de1;
  FRAMEBUFFER = 0x8d40;
  COLOR_ATTACHMENT0 = 0x8ce0;
  DEPTH_ATTACHMENT = 0x8d00;
  FRAMEBUFFER_COMPLETE = 0x8cd5;
  TEXTURE0 = 0x84c0;
  TEXTURE1 = 0x84c1;
  TEXTURE2 = 0x84c2;
  TEXTURE3 = 0x84c3;
  TEXTURE4 = 0x84c4;
  TEXTURE5 = 0x84c5;
  TEXTURE6 = 0x84c6;
  TEXTURE7 = 0x84c7;

  // 属性
  canvas: any;

  constructor(canvas: any) {
    this.canvas = canvas;
  }

  // 方法
  viewport(x: number, y: number, width: number, height: number): void {}
  clearColor(r: number, g: number, b: number, a: number): void {}
  clear(mask: number): void {}
  createBuffer(): MockWebGLBuffer {
    return new MockWebGLBuffer();
  }
  deleteBuffer(buffer: MockWebGLBuffer | null): void {}
  bindBuffer(target: number, buffer: MockWebGLBuffer | null): void {}
  bufferData(target: number, data: any, usage: number): void {}
  createShader(type: number): MockWebGLShader {
    return new MockWebGLShader();
  }
  deleteShader(shader: MockWebGLShader | null): void {}
  shaderSource(shader: MockWebGLShader, source: string): void {}
  compileShader(shader: MockWebGLShader): void {}
  getShaderParameter(shader: MockWebGLShader, pname: number): any {
    return true;
  }
  getShaderInfoLog(shader: MockWebGLShader): string | null {
    return null;
  }
  createProgram(): MockWebGLProgram {
    return new MockWebGLProgram();
  }
  deleteProgram(program: MockWebGLProgram | null): void {}
  attachShader(program: MockWebGLProgram, shader: MockWebGLShader): void {}
  detachShader(program: MockWebGLProgram, shader: MockWebGLShader): void {}
  linkProgram(program: MockWebGLProgram): void {}
  getProgramParameter(program: MockWebGLProgram, pname: number): any {
    return true;
  }
  getProgramInfoLog(program: MockWebGLProgram): string | null {
    return null;
  }
  useProgram(program: MockWebGLProgram | null): void {}
  getUniformLocation(program: MockWebGLProgram, name: string): MockWebGLUniformLocation {
    return new MockWebGLUniformLocation();
  }
  uniform1f(location: MockWebGLUniformLocation | null, v0: number): void {}
  uniform2f(location: MockWebGLUniformLocation | null, v0: number, v1: number): void {}
  uniform3f(location: MockWebGLUniformLocation | null, v0: number, v1: number, v2: number): void {}
  uniform4f(location: MockWebGLUniformLocation | null, v0: number, v1: number, v2: number, v3: number): void {}
  uniformMatrix4fv(location: MockWebGLUniformLocation | null, transpose: boolean, value: any): void {}
  uniform1i(location: MockWebGLUniformLocation | null, v0: number): void {}
  createTexture(): MockWebGLTexture {
    return new MockWebGLTexture();
  }
  deleteTexture(texture: MockWebGLTexture | null): void {}
  bindTexture(target: number, texture: MockWebGLTexture | null): void {}
  activeTexture(texture: number): void {}
  texImage2D(
    target: number,
    level: number,
    internalformat: number,
    width: number,
    height: number,
    border: number,
    format: number,
    type: number,
    pixels?: any
  ): void {}
  texParameteri(target: number, pname: number, param: number): void {}
  createVertexArray(): MockWebGLVertexArrayObject {
    return new MockWebGLVertexArrayObject();
  }
  deleteVertexArray(vertexArray: MockWebGLVertexArrayObject | null): void {}
  bindVertexArray(vertexArray: MockWebGLVertexArrayObject | null): void {}
  enableVertexAttribArray(index: number): void {}
  vertexAttribPointer(
    index: number,
    size: number,
    type: number,
    normalized: boolean,
    stride: number,
    offset: number
  ): void {}
  createFramebuffer(): MockWebGLFramebuffer {
    return new MockWebGLFramebuffer();
  }
  deleteFramebuffer(framebuffer: MockWebGLFramebuffer | null): void {}
  bindFramebuffer(target: number, framebuffer: MockWebGLFramebuffer | null): void {}
  framebufferTexture2D(
    target: number,
    attachment: number,
    textarget: number,
    texture: MockWebGLTexture | null,
    level: number
  ): void {}
  checkFramebufferStatus(target: number): number {
    return this.FRAMEBUFFER_COMPLETE;
  }
  enable(cap: number): void {}
  disable(cap: number): void {}
  blendFunc(sfactor: number, dfactor: number): void {}
  depthFunc(func: number): void {}
  cullFace(mode: number): void {}
  scissor(x: number, y: number, width: number, height: number): void {}
  drawArrays(mode: number, first: number, count: number): void {}
  drawElements(mode: number, count: number, type: number, offset: number): void {}
}

// 使用继承的方式模拟WebGL2上下文
class MockWebGL2RenderingContext extends MockWebGLRenderingContext {
  // WebGL2特有的属性和方法可以在这里添加
}

// 直接修改HTMLCanvasElement.prototype
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: function (contextId: string) {
    if (contextId === 'webgl' || contextId === 'experimental-webgl') {
      return new MockWebGLRenderingContext(this);
    } else if (contextId === 'webgl2') {
      return new MockWebGL2RenderingContext(this);
    }

    return null;
  },
  configurable: true,
  writable: true,
});

// 设置全局变量
global.WebGLRenderingContext = MockWebGLRenderingContext as any;
global.WebGL2RenderingContext = MockWebGL2RenderingContext as any;
global.WebGLBuffer = MockWebGLBuffer as any;
global.WebGLShader = MockWebGLShader as any;
global.WebGLProgram = MockWebGLProgram as any;
global.WebGLUniformLocation = MockWebGLUniformLocation as any;
global.WebGLTexture = MockWebGLTexture as any;
global.WebGLVertexArrayObject = MockWebGLVertexArrayObject as any;
global.WebGLFramebuffer = MockWebGLFramebuffer as any;

// 确保数组类型存在
global.Float32Array = global.Float32Array || Array;
global.Uint8Array = global.Uint8Array || Array;
global.Uint16Array = global.Uint16Array || Array;
global.Uint32Array = global.Uint32Array || Array;
