import { GLRenderer, GLBuffer, GLShader, GLVertexArray, GLConstants } from '@sruim/rhi/webgl';

// 获取canvas元素
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('Canvas not found');
}

// 创建渲染器
const renderer = new GLRenderer(canvas);

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
const shader = renderer.createShader(vertexShaderSource, fragmentShaderSource);

// 创建顶点数据
const vertices = new Float32Array([
  // 位置(x,y,z)   // 纹理坐标(u,v)  // 颜色(r,g,b,a)
  -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
  0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0,
  0.0, 0.5, 0.0, 0.5, 1.0, 0.0, 0.0, 1.0, 1.0,
]);

// 创建顶点缓冲区
const vertexBuffer = renderer.createBuffer(GLConstants.ARRAY_BUFFER, vertices, GLConstants.STATIC_DRAW);

// 创建顶点数组
const vertexArray = renderer.createVertexArray();

vertexArray.bind();
vertexArray.setVertexAttribPointer(0, 3, GLConstants.FLOAT, false, 36, 0);  // 位置
vertexArray.setVertexAttribPointer(1, 2, GLConstants.FLOAT, false, 36, 12); // 纹理坐标
vertexArray.setVertexAttribPointer(2, 4, GLConstants.FLOAT, false, 36, 20); // 颜色
vertexArray.enableVertexAttribArray(0);
vertexArray.enableVertexAttribArray(1);
vertexArray.enableVertexAttribArray(2);

// 渲染循环
function render () {
  // 清除画布
  renderer.clear(GLConstants.COLOR_BUFFER_BIT | GLConstants.DEPTH_BUFFER_BIT);

  // 使用着色器
  shader.use();

  // 绘制三角形
  renderer.drawArrays(GLConstants.TRIANGLES, 0, 3);

  // 请求下一帧
  requestAnimationFrame(render);
}

// 开始渲染
render();