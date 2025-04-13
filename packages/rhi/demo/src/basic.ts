import { GLRenderer, GLShader, GLBuffer, GLConstants, GLTexture, GLFramebuffer } from '@max/rhi';
import { Color, Matrix4, Vector3 } from '@max/math';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const renderer = new GLRenderer();

renderer.create(canvas);
renderer.setViewport(canvas.width, canvas.height);
renderer.setClearColor(new Color(0, 0, 0, 1));
renderer.clear();

const gl = renderer.getGL();

// 顶点着色器源码
const vertexShaderSource = `
  attribute vec3 aPosition;
  attribute vec2 aTexCoord;
  attribute vec4 aColor;
  
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  varying vec2 vTexCoord;
  varying vec4 vColor;
  
  void main() {
    vTexCoord = aTexCoord;
    vColor = aColor;
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
  }
`;

// 片段着色器源码
const fragmentShaderSource = `
  precision mediump float;
  
  varying vec2 vTexCoord;
  varying vec4 vColor;
  
  uniform sampler2D uTexture;
  uniform float uTime;
  
  void main() {
    vec4 texColor = texture2D(uTexture, vTexCoord);
    gl_FragColor = mix(texColor, vColor, sin(uTime) * 0.5 + 0.5);
  }
`;

// 创建着色器
const shader = new GLShader(gl);

shader.create(vertexShaderSource, fragmentShaderSource);

// 创建顶点数据
const vertices = new Float32Array([
  // 位置(x,y,z)   // 纹理坐标(u,v)  // 颜色(r,g,b,a)
  -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
  0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0,
  0.0, 0.5, 0.0, 0.5, 1.0, 0.0, 0.0, 1.0, 1.0,
]);

// 创建顶点缓冲区
const vertexBuffer = new GLBuffer(gl, GLConstants.BUFFER_TYPE.ARRAY_BUFFER, GLConstants.BUFFER_USAGE.STATIC_DRAW, vertices.byteLength);

vertexBuffer.create();
vertexBuffer.bind();
vertexBuffer.update(vertices);

// 创建纹理
const texture = new GLTexture(gl);
texture.create(256, 256, gl.RGBA, gl.UNSIGNED_BYTE, {
  minFilter: gl.LINEAR,
  magFilter: gl.LINEAR,
  wrapS: gl.CLAMP_TO_EDGE,
  wrapT: gl.CLAMP_TO_EDGE,
  generateMipmaps: true
});

// 创建帧缓冲
const framebuffer = new GLFramebuffer(gl);
framebuffer.create(canvas.width, canvas.height, {
  samples: 4,
  colorAttachments: 1,
  depthStencil: true
});

// 设置顶点属性
const stride = 36; // 每个顶点36字节 (9个float32 * 4字节)

vertexBuffer.bind();
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 3, GLConstants.DATA_TYPE.FLOAT, false, stride, 0); // 位置
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 2, GLConstants.DATA_TYPE.FLOAT, false, stride, 12); // 纹理坐标
gl.enableVertexAttribArray(2);
gl.vertexAttribPointer(2, 4, GLConstants.DATA_TYPE.FLOAT, false, stride, 20); // 颜色

// 创建变换矩阵
const modelViewMatrix = new Matrix4();
const projectionMatrix = new Matrix4();
projectionMatrix.perspective(45, canvas.width / canvas.height, 0.1, 100.0);
modelViewMatrix.translate(new Vector3(0, 0, -2));

// 渲染循环
let time = 0;
function render() {
  time += 0.01;
  
  // 渲染到帧缓冲
  framebuffer.bind();
  renderer.setViewport(canvas.width, canvas.height);
  renderer.clear();
  
  shader.use();
  shader.setUniform('uModelViewMatrix', modelViewMatrix.elements);
  shader.setUniform('uProjectionMatrix', projectionMatrix.elements);
  shader.setUniform('uTime', time);
  
  texture.bind(0);
  vertexBuffer.bind();
  gl.drawArrays(GLConstants.DRAW_MODE.TRIANGLES, 0, 3);
  
  // 渲染到屏幕
  framebuffer.unbind();
  renderer.setViewport(canvas.width, canvas.height);
  renderer.clear();
  
  framebuffer.blitToScreen();
  
  requestAnimationFrame(render);
}

// 开始渲染
render();