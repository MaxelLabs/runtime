import { GLRenderer, GLShader, GLBuffer, GLConstants, GLTexture, GLFramebuffer, GLVertexArray } from '@max/rhi';
import { Color, Matrix4, Vector3 } from '@max/math';

// Get canvas and resize it to fill the window
const canvas = document.getElementById('J-canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Create renderer
const renderer = new GLRenderer();
renderer.create(canvas);
renderer.setViewport(canvas.width, canvas.height);
renderer.setClearColor(new Color(0.1, 0.1, 0.1, 1));
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

// Create shader program
const shader = new GLShader(gl);
shader.create(vertexShaderSource, fragmentShaderSource);

// Create vertex data
const vertices = new Float32Array([
  // Position(x,y,z)  // Texture coords(u,v)  // Color(r,g,b,a)
  -0.5, -0.5, 0.0,    0.0, 0.0,               1.0, 0.0, 0.0, 1.0,
   0.5, -0.5, 0.0,    1.0, 0.0,               0.0, 1.0, 0.0, 1.0,
   0.0,  0.5, 0.0,    0.5, 1.0,               0.0, 0.0, 1.0, 1.0,
]);

// Create vertex buffer
const vertexBuffer = new GLBuffer(gl, GLConstants.BUFFER_TYPE.ARRAY_BUFFER, GLConstants.BUFFER_USAGE.STATIC_DRAW, vertices.byteLength);
vertexBuffer.create();
vertexBuffer.bind();
vertexBuffer.update(vertices);

// 创建顶点数组对象来存储属性绑定
const vao = new GLVertexArray(gl);
vao.create();
vao.bind();

// 使用着色器程序以便能够获取属性位置
shader.use();

// 使用GLVertexArray的setAttribute方法设置顶点属性
const stride = 9 * 4; // 9个浮点数每顶点 (3位置 + 2纹理坐标 + 4颜色) * 4字节每浮点数
vao.setAttribute('aPosition', vertexBuffer, 3, GLConstants.DATA_TYPE.FLOAT, false, stride, 0);
vao.setAttribute('aTexCoord', vertexBuffer, 2, GLConstants.DATA_TYPE.FLOAT, false, stride, 12);
vao.setAttribute('aColor', vertexBuffer, 4, GLConstants.DATA_TYPE.FLOAT, false, stride, 20);

// 完成属性设置后解绑VAO和着色器
vao.unbind();
gl.useProgram(null);

// 创建棋盘格纹理
const texture = new GLTexture(gl);
texture.create(256, 256, gl.RGBA, gl.UNSIGNED_BYTE, {
  minFilter: gl.LINEAR,
  magFilter: gl.LINEAR,
  wrapS: gl.CLAMP_TO_EDGE,
  wrapT: gl.CLAMP_TO_EDGE,
  generateMipmaps: false // 禁用mipmap生成，避免某些WebGL实现的兼容性问题
});

// Generate checkerboard pattern
const textureData = new Uint8Array(256 * 256 * 4);
for (let y = 0; y < 256; y++) {
  for (let x = 0; x < 256; x++) {
    const index = (y * 256 + x) * 4;
    const isCheckerboard = (Math.floor(x / 32) % 2 === 0) !== (Math.floor(y / 32) % 2 === 0);
    textureData[index] = isCheckerboard ? 255 : 0;     // R
    textureData[index + 1] = isCheckerboard ? 255 : 0; // G
    textureData[index + 2] = isCheckerboard ? 255 : 0; // B
    textureData[index + 3] = 255;                     // A
  }
}
texture.upload(textureData);

// Create framebuffer for offscreen rendering
const framebuffer = new GLFramebuffer(gl);
framebuffer.create(canvas.width, canvas.height, {
  samples: 0, // Disable multisampling for compatibility
  colorAttachments: 1,
  depthStencil: false // 禁用深度模板附件，避免格式不兼容问题
});

// 变换矩阵已经在上面设置好了，这里不需要重复设置顶点属性

// 创建全屏四边形着色器
const fsQuadVS = `
  attribute vec2 aPosition;
  varying vec2 vTexCoord;
  void main() {
    vTexCoord = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const fsQuadFS = `
  precision mediump float;
  varying vec2 vTexCoord;
  uniform sampler2D uTexture;
  void main() {
    gl_FragColor = texture2D(uTexture, vTexCoord);
  }
`;

const fsQuadShader = new GLShader(gl);
fsQuadShader.create(fsQuadVS, fsQuadFS);

// 创建全屏四边形顶点数据和VAO
const fsQuadVertices = new Float32Array([
  -1.0, -1.0,
   1.0, -1.0,
  -1.0,  1.0,
   1.0,  1.0
]);

const fsQuadBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, fsQuadVertices.byteLength);
fsQuadBuffer.create();
fsQuadBuffer.bind();
fsQuadBuffer.update(fsQuadVertices);

const fsQuadVAO = new GLVertexArray(gl);
fsQuadVAO.create();
fsQuadVAO.bind();

// 使用全屏四边形着色器以便能够获取属性位置
fsQuadShader.use();

// 设置顶点属性
fsQuadVAO.setAttribute('aPosition', fsQuadBuffer, 2, GLConstants.DATA_TYPE.FLOAT, false, 0, 0);

// 完成设置后解绑VAO和着色器
fsQuadVAO.unbind();
gl.useProgram(null);

// 创建变换矩阵
const modelViewMatrix = new Matrix4();
const projectionMatrix = new Matrix4();
projectionMatrix.perspective(45, canvas.width / canvas.height, 0.1, 100.0);
modelViewMatrix.translate(new Vector3(0, 0, -2));

// 渲染循环
let time = 0;
function render() {
  time += 0.01;
  
  // 确保没有活动的着色器
  gl.useProgram(null);
  
  // First pass: Render to framebuffer
  framebuffer.bind();
  renderer.setViewport(canvas.width, canvas.height);
  renderer.clear();
  
  // 使用着色器
  shader.use();
  
  // 设置uniform变量 - 直接使用GLShader的方法
  const mvMatrix = modelViewMatrix.getElements();
  const projMatrix = projectionMatrix.getElements();
  
  // 使用GLShader提供的方法设置uniform
  shader.setUniformMatrix4fv('uModelViewMatrix', mvMatrix);
  shader.setUniformMatrix4fv('uProjectionMatrix', projMatrix);
  shader.setUniform1f('uTime', time);
  
  // 绑定纹理到纹理单元0
  texture.bind(0);
  
  // 设置纹理采样器uniform
  shader.setUniform1i('uTexture', 0);
  
  // Bind VAO and draw
  vao.bind();
  gl.drawArrays(GLConstants.DRAW_MODE.TRIANGLES, 0, 3);
  vao.unbind();
  
  // Second pass: Render framebuffer to screen
  framebuffer.unbind();
  renderer.setViewport(canvas.width, canvas.height);
  renderer.clear();
  
  // Draw the framebuffer's color attachment to the screen
  const colorTexture = framebuffer.getColorAttachment(0);
  if (colorTexture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    
    // 使用全屏四边形着色器
    fsQuadShader.use();
    
    // 设置纹理采样器uniform
    fsQuadShader.setUniform1i('uTexture', 0);
    
    // 绑定VAO并绘制
    fsQuadVAO.bind();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    fsQuadVAO.unbind();
  }
  
  requestAnimationFrame(render);
}

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  renderer.setViewport(canvas.width, canvas.height);
  projectionMatrix.perspective(45, canvas.width / canvas.height, 0.1, 100.0);
  
  // Recreate framebuffer with new size
  framebuffer.destroy();
  framebuffer.create(canvas.width, canvas.height, {
    samples: 0,
    colorAttachments: 1,
    depthStencil: false // 保持与上面相同的配置
  });
});

// 开始渲染
render();