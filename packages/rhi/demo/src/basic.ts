import { GLRenderer, GLShader, GLBuffer, GLConstants } from '@max/rhi';
import { Color } from '@max/math';

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
  
  varying vec2 vTexCoord;
  varying vec4 vColor;
  
  void main() {
    vTexCoord = aTexCoord;
    vColor = aColor;
    gl_Position = vec4(aPosition, 1.0);
  }
`;

// 片段着色器源码
const fragmentShaderSource = `
  precision mediump float;
  
  varying vec2 vTexCoord;
  varying vec4 vColor;
  
  void main() {
    gl_FragColor = vColor;
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

// 设置顶点属性
const stride = 36; // 每个顶点36字节 (9个float32 * 4字节)

vertexBuffer.bind();
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 3, GLConstants.DATA_TYPE.FLOAT, false, stride, 0); // 位置
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 2, GLConstants.DATA_TYPE.FLOAT, false, stride, 12); // 纹理坐标
gl.enableVertexAttribArray(2);
gl.vertexAttribPointer(2, 4, GLConstants.DATA_TYPE.FLOAT, false, stride, 20); // 颜色

// 渲染循环
function render () {
  renderer.clear();
  shader.use();
  vertexBuffer.bind(); // 确保绘制前缓冲区已绑定
  gl.drawArrays(GLConstants.DRAW_MODE.TRIANGLES, 0, 3);
  requestAnimationFrame(render);
}

// 开始渲染
render();