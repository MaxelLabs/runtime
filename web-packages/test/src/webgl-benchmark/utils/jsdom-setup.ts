import { JSDOM } from 'jsdom';

/**
 * 初始化JSDOM环境，提供WebGL模拟
 * @returns {{window: Window, cleanup: Function}} JSDOM窗口对象和清理函数
 */
export async function setupJSDOM() {
  // 创建基本JSDOM实例
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>WebGL Benchmark</title>
      </head>
      <body>
        <canvas id="webgl-canvas" width="800" height="600"></canvas>
      </body>
    </html>
  `, {
    pretendToBeVisual: true,
    resources: 'usable',
    runScripts: 'dangerously'
  });

  const window = dom.window;
  
  // 模拟WebGL上下文
  mockWebGL(window);

  return {
    window,
    cleanup: () => {
      window.close();
    }
  };
}

/**
 * 模拟WebGL和WebGL2上下文
 * @param {Window} window JSDOM窗口对象
 */
function mockWebGL(window) {
  // WebGL相关类
  class WebGLBuffer {}
  class WebGLShader {}
  class WebGLProgram {}
  class WebGLTexture {}
  class WebGLFramebuffer {}
  class WebGLRenderbuffer {}
  class WebGLUniformLocation {}
  class WebGLVertexArrayObject {}

  // 模拟WebGL渲染上下文
  class WebGLRenderingContext {
    constructor() {
      // 常量
      this.ARRAY_BUFFER = 34962;
      this.ELEMENT_ARRAY_BUFFER = 34963;
      this.TEXTURE_2D = 3553;
      this.FRAMEBUFFER = 36160;
      this.VERTEX_SHADER = 35633;
      this.FRAGMENT_SHADER = 35632;
      this.FLOAT = 5126;
      this.UNSIGNED_BYTE = 5121;
      this.RGBA = 6408;
      this.RGB = 6407;
      this.DEPTH_TEST = 2929;
      this.BLEND = 3042;
      this.TRIANGLES = 4;
      this.TEXTURE0 = 33984;
      this.COLOR_BUFFER_BIT = 16384;
      this.DEPTH_BUFFER_BIT = 256;
      this.STATIC_DRAW = 35044;
      this.DYNAMIC_DRAW = 35048;
      
      // 公共成员
      this.canvas = null;
      this.drawingBufferWidth = 800;
      this.drawingBufferHeight = 600;
    }
    
    // 基本方法
    getExtension(name) { return {}; }
    createBuffer() { return new WebGLBuffer(); }
    bindBuffer(target, buffer) {}
    bufferData(target, data, usage) {}
    createTexture() { return new WebGLTexture(); }
    bindTexture(target, texture) {}
    texImage2D() {}
    createFramebuffer() { return new WebGLFramebuffer(); }
    bindFramebuffer(target, framebuffer) {}
    createRenderbuffer() { return new WebGLRenderbuffer(); }
    bindRenderbuffer(target, renderbuffer) {}
    createProgram() { return new WebGLProgram(); }
    useProgram(program) {}
    linkProgram(program) {}
    createShader(type) { return new WebGLShader(); }
    shaderSource(shader, source) {}
    compileShader(shader) {}
    attachShader(program, shader) {}
    getUniformLocation() { return new WebGLUniformLocation(); }
    uniform1i() {}
    uniform1f() {}
    uniform2f() {}
    uniform3f() {}
    uniform4f() {}
    uniformMatrix4fv() {}
    getAttribLocation() { return 0; }
    vertexAttribPointer() {}
    enableVertexAttribArray() {}
    disableVertexAttribArray() {}
    enable() {}
    disable() {}
    blendFunc() {}
    depthFunc() {}
    clearColor() {}
    clear() {}
    drawArrays() {}
    drawElements() {}
    viewport() {}
    getParameter() { return {}; }
    getShaderParameter() { return true; }
    getProgramParameter() { return true; }
    getError() { return 0; }
  }

  // WebGL2继承WebGL1
  class WebGL2RenderingContext extends WebGLRenderingContext {
    constructor() {
      super();
      this.createVertexArray = function() { return new WebGLVertexArrayObject(); };
      this.bindVertexArray = function() {};
      this.getUniformBlockIndex = function() { return 0; };
      this.uniformBlockBinding = function() {};
    }
  }

  // 扩展HTMLCanvasElement
  const originalGetContext = window.HTMLCanvasElement.prototype.getContext;
  window.HTMLCanvasElement.prototype.getContext = function(contextType, attributes) {
    if (contextType === 'webgl' || contextType === 'experimental-webgl') {
      return new WebGLRenderingContext();
    } else if (contextType === 'webgl2') {
      return new WebGL2RenderingContext();
    }
    return originalGetContext.call(this, contextType, attributes);
  };

  // 添加必要的数组类型
  window.Float32Array = window.Float32Array || Array;
  window.Uint8Array = window.Uint8Array || Array;
  window.Uint16Array = window.Uint16Array || Array;
  window.Uint32Array = window.Uint32Array || Array;
  
  // 添加性能测量API
  if (!window.performance) {
    window.performance = {};
  }
  if (!window.performance.now) {
    const start = Date.now();
    window.performance.now = function() {
      return Date.now() - start;
    };
  }
} 