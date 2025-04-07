// 模拟WebGL上下文
class MockWebGLRenderingContext {
  // 常量
  ARRAY_BUFFER = 0x8892;
  ELEMENT_ARRAY_BUFFER = 0x8893;
  STATIC_DRAW = 0x88E4;
  DYNAMIC_DRAW = 0x88E8;
  STREAM_DRAW = 0x88E0;
  VERTEX_SHADER = 0x8B31;
  FRAGMENT_SHADER = 0x8B30;
  BYTE = 0x1400;
  UNSIGNED_BYTE = 0x1401;
  SHORT = 0x1402;
  UNSIGNED_SHORT = 0x1403;
  INT = 0x1404;
  UNSIGNED_INT = 0x1405;
  FLOAT = 0x1406;
  DOUBLE = 0x140A;
  RGB = 0x1907;
  RGBA = 0x1908;
  LUMINANCE = 0x1909;
  LUMINANCE_ALPHA = 0x190A;
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
  CLAMP_TO_EDGE = 0x812F;
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
  BLEND = 0x0BE2;
  DEPTH_TEST = 0x0B71;
  CULL_FACE = 0x0B44;
  SCISSOR_TEST = 0x0C11;
  COLOR_BUFFER_BIT = 0x00004000;
  DEPTH_BUFFER_BIT = 0x00000100;
  TEXTURE_2D = 0x0DE1;
  FRAMEBUFFER = 0x8D40;
  COLOR_ATTACHMENT0 = 0x8CE0;
  DEPTH_ATTACHMENT = 0x8D00;
  FRAMEBUFFER_COMPLETE = 0x8CD5;

  // 属性
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  // 方法
  viewport(x: number, y: number, width: number, height: number): void {}
  clearColor(r: number, g: number, b: number, a: number): void {}
  clear(mask: number): void {}
  createBuffer(): WebGLBuffer | null { return null; }
  deleteBuffer(buffer: WebGLBuffer | null): void {}
  bindBuffer(target: number, buffer: WebGLBuffer | null): void {}
  bufferData(target: number, data: BufferSource | null, usage: number): void {}
  createShader(type: number): WebGLShader | null { return null; }
  deleteShader(shader: WebGLShader | null): void {}
  shaderSource(shader: WebGLShader, source: string): void {}
  compileShader(shader: WebGLShader): void {}
  getShaderParameter(shader: WebGLShader, pname: number): any { return null; }
  getShaderInfoLog(shader: WebGLShader): string | null { return null; }
  createProgram(): WebGLProgram | null { return null; }
  deleteProgram(program: WebGLProgram | null): void {}
  attachShader(program: WebGLProgram, shader: WebGLShader): void {}
  linkProgram(program: WebGLProgram): void {}
  getProgramParameter(program: WebGLProgram, pname: number): any { return null; }
  getProgramInfoLog(program: WebGLProgram): string | null { return null; }
  useProgram(program: WebGLProgram | null): void {}
  getUniformLocation(program: WebGLProgram, name: string): WebGLUniformLocation | null { return null; }
  uniform1f(location: WebGLUniformLocation | null, v0: number): void {}
  uniform2f(location: WebGLUniformLocation | null, v0: number, v1: number): void {}
  uniform3f(location: WebGLUniformLocation | null, v0: number, v1: number, v2: number): void {}
  uniform4f(location: WebGLUniformLocation | null, v0: number, v1: number, v2: number, v3: number): void {}
  uniformMatrix4fv(location: WebGLUniformLocation | null, transpose: boolean, value: Float32List): void {}
  uniform1i(location: WebGLUniformLocation | null, v0: number): void {}
  createTexture(): WebGLTexture | null { return null; }
  deleteTexture(texture: WebGLTexture | null): void {}
  bindTexture(target: number, texture: WebGLTexture | null): void {}
  texImage2D(target: number, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, pixels?: BufferSource | null): void {}
  texParameteri(target: number, pname: number, param: number): void {}
  createVertexArray(): WebGLVertexArrayObject | null { return null; }
  deleteVertexArray(vertexArray: WebGLVertexArrayObject | null): void {}
  bindVertexArray(vertexArray: WebGLVertexArrayObject | null): void {}
  enableVertexAttribArray(index: number): void {}
  vertexAttribPointer(index: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void {}
  createFramebuffer(): WebGLFramebuffer | null { return null; }
  deleteFramebuffer(framebuffer: WebGLFramebuffer | null): void {}
  bindFramebuffer(target: number, framebuffer: WebGLFramebuffer | null): void {}
  framebufferTexture2D(target: number, attachment: number, textarget: number, texture: WebGLTexture | null, level: number): void {}
  checkFramebufferStatus(target: number): number { return this.FRAMEBUFFER_COMPLETE; }
  enable(cap: number): void {}
  disable(cap: number): void {}
  blendFunc(sfactor: number, dfactor: number): void {}
  depthFunc(func: number): void {}
  cullFace(mode: number): void {}
  scissor(x: number, y: number, width: number, height: number): void {}
}

// 扩展HTMLCanvasElement
declare global {
  interface HTMLCanvasElement {
    getContext(contextId: '2d' | 'bitmaprenderer' | 'webgl', options?: any): CanvasRenderingContext2D | ImageBitmapRenderingContext | WebGLRenderingContext | null;
  }
}

// 模拟getContext方法
HTMLCanvasElement.prototype.getContext = function(contextId: '2d' | 'bitmaprenderer' | 'webgl', options?: any): CanvasRenderingContext2D | ImageBitmapRenderingContext | WebGLRenderingContext | null {
  if (contextId === 'webgl') {
    return new MockWebGLRenderingContext(this);
  }
  return null;
}; 