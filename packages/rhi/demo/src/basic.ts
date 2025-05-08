import {
  RHIAddressMode,
  RHIBackend,
  RHIBufferUsage,
  RHICompareFunction,
  RHIFilterMode,
  RHIPrimitiveTopology,
  RHIShaderStage,
  RHITextureFormat,
  RHITextureUsage,
  RHIVertexFormat,
  RHIVertexLayout,
} from '@maxellabs/core';
import { WebGLDevice } from '../../src/webgl/WebGLDevice';
import { Color, Matrix4, Vector3 } from '@maxellabs/math';

// 获取画布并调整大小
const canvas = document.getElementById('J-canvas') as HTMLCanvasElement;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 创建设备
const device = new WebGLDevice(canvas);

console.log('设备信息:', device.getInfo());

// 顶点着色器源码
const vertexShaderSource = `
  in vec3 aPosition;
in vec2 aTexCoord;
in vec4 aColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vTexCoord;
out vec4 vColor;

void main() {
  vTexCoord = aTexCoord;
  vColor = aColor;
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

// 片段着色器源码
const fragmentShaderSource = `#version 300 es
precision mediump float;

in vec2 vTexCoord;
in vec4 vColor;

uniform sampler2D uTexture;
uniform float uTime;

out vec4 fragColor;

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  fragColor = mix(texColor, vColor, sin(uTime) * 0.5 + 0.5);
}
`;

// 创建着色器模块
const vertexShader = device.createShaderModule({
  code: vertexShaderSource,
  language: 'glsl',
  stage: 'vertex',
  label: 'Basic Vertex Shader',
});

const fragmentShader = device.createShaderModule({
  code: fragmentShaderSource,
  language: 'glsl',
  stage: 'fragment',
  label: 'Basic Fragment Shader',
});

// 创建顶点数据
const vertices = new Float32Array([
  // Position(x,y,z)  // Texture coords(u,v)  // Color(r,g,b,a)
  -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
  0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0,
  0.0, 0.5, 0.0, 0.5, 1.0, 0.0, 0.0, 1.0, 1.0,
]);

// 创建顶点缓冲区
const vertexBuffer = device.createBuffer({
  size: vertices.byteLength,
  usage: RHIBufferUsage.VERTEX,
  hint: 'static',
  initialData: vertices,
  label: 'Vertex Buffer',
});

// 定义顶点布局
const vertexLayout: RHIVertexLayout = {

  buffers: [
    {
      stride: 36, // 9个float每顶点
      stepMode: 'vertex',
      attributes: [
        {
          name: 'aPosition',
          format: RHIVertexFormat.FLOAT32X3,
          offset: 0,
          shaderLocation: 0,
        },
        {
          name: 'aTexCoord',
          format: RHIVertexFormat.FLOAT32X2,
          offset: 12, // 3个float后的偏移
          shaderLocation: 0,
        },
        {
          name: 'aColor',
          format: RHIVertexFormat.FLOAT32X4,
          offset: 20, // 3个float + 2个float后的偏移
          shaderLocation: 0,
        },
      ],
      index: 0,
    },
  ],
};

// 创建绑定组布局
const bindGroupLayout = device.createBindGroupLayout([
  {
    binding: 0,
    type: 'uniform-buffer',
    visibility: RHIShaderStage.VERTEX,
    name: 'uModelViewMatrix',
  },
  {
    binding: 1,
    type: 'uniform-buffer',
    visibility: RHIShaderStage.VERTEX,
    name: 'uProjectionMatrix',
  },
  {
    binding: 2,
    type: 'texture',
    visibility: RHIShaderStage.FRAGMENT,
    name: 'uTexture',
  },
  {
    binding: 3,
    type: 'sampler',
    visibility: RHIShaderStage.FRAGMENT,
    name: 'uTextureSampler',
  },
  {
    binding: 4,
    type: 'uniform-buffer',
    visibility: RHIShaderStage.FRAGMENT,
    name: 'uTime',
  },
], 'Main Bind Group Layout');

// 创建管线布局
const pipelineLayout = device.createPipelineLayout([bindGroupLayout], 'Main Pipeline Layout');

// 创建渲染管线
const renderPipeline = device.createRenderPipeline({
  vertexShader,
  fragmentShader,
  vertexLayout,
  primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
  layout: pipelineLayout,
  depthStencilState: {
    depthTestEnabled: true,
    depthWriteEnabled: true,
    depthCompareFunction: RHICompareFunction.LESS_EQUAL,
    stencilTestEnabled: false,
    stencilReadMask: 0xff,
    stencilWriteMask: 0xff,
    stencilFront: {
      compareFunction: RHICompareFunction.ALWAYS,
      failOperation: 'keep',
      depthFailOperation: 'keep',
      passOperation: 'keep',
    },
    stencilBack: {
      compareFunction: RHICompareFunction.ALWAYS,
      failOperation: 'keep',
      depthFailOperation: 'keep',
      passOperation: 'keep',
    },
  },
  colorBlendState: {
    blendEnabled: true,
    srcColorFactor: 'src-alpha',
    dstColorFactor: 'one-minus-src-alpha',
    colorBlendOperation: 'add',
    srcAlphaFactor: 'one',
    dstAlphaFactor: 'one-minus-src-alpha',
    alphaBlendOperation: 'add',
    colorWriteMask: [true, true, true, true],
  },
  label: 'Main Render Pipeline',
});

// 创建棋盘格纹理数据
const textureSize = 256;
const textureData = new Uint8Array(textureSize * textureSize * 4);

for (let y = 0; y < textureSize; y++) {
  for (let x = 0; x < textureSize; x++) {
    const index = (y * textureSize + x) * 4;
    const isCheckerboard = (Math.floor(x / 32) % 2 === 0) !== (Math.floor(y / 32) % 2 === 0);

    textureData[index] = isCheckerboard ? 255 : 0;     // R
    textureData[index + 1] = isCheckerboard ? 255 : 0; // G
    textureData[index + 2] = isCheckerboard ? 255 : 0; // B
    textureData[index + 3] = 255;                     // A
  }
}

// 创建纹理
const texture = device.createTexture({
  width: textureSize,
  height: textureSize,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.SAMPLED | RHITextureUsage.COPY_DST,
  dimension: '2d',
  label: 'Checkerboard Texture',
});

// 更新纹理数据
texture.update(textureData);

// 创建纹理视图
const textureView = texture.createView();

// 创建采样器
const sampler = device.createSampler({
  magFilter: 'linear',
  minFilter: 'linear',
  mipmapFilter: 'linear',
  addressModeU: 'repeat',
  addressModeV: 'repeat',
  maxAnisotropy: 1,
  label: 'Texture Sampler',
});

// 创建变换矩阵
const modelViewMatrix = new Matrix4();
const projectionMatrix = new Matrix4();

projectionMatrix.perspective(45, canvas.width / canvas.height, 0.1, 100.0);
modelViewMatrix.translate(new Vector3(0, 0, -2));

// 创建uniform缓冲区
const modelViewMatrixBuffer = device.createBuffer({
  size: 64, // 4x4矩阵，每个元素4字节
  usage: RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
  label: 'ModelView Matrix Buffer',
});

const projectionMatrixBuffer = device.createBuffer({
  size: 64, // 4x4矩阵，每个元素4字节
  usage: RHIBufferUsage.UNIFORM,
  hint: 'static',
  label: 'Projection Matrix Buffer',
});

const timeBuffer = device.createBuffer({
  size: 4, // 单个float
  usage: RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
  label: 'Time Buffer',
});

// 更新矩阵缓冲区
modelViewMatrixBuffer.update(new Float32Array(modelViewMatrix.getElements()));
projectionMatrixBuffer.update(new Float32Array(projectionMatrix.getElements()));

// 创建绑定组
const bindGroup = device.createBindGroup(bindGroupLayout, [
  {
    binding: 0,
    resource: modelViewMatrixBuffer,
  },
  {
    binding: 1,
    resource: projectionMatrixBuffer,
  },
  {
    binding: 2,
    resource: textureView,
  },
  {
    binding: 3,
    resource: sampler,
  },
  {
    binding: 4,
    resource: timeBuffer,
  },
], 'Main Bind Group');

// 渲染循环
let time = 0;

function render () {
  time += 0.01;

  // 更新旋转
  modelViewMatrix.identity();
  modelViewMatrix.translate(new Vector3(0, 0, -2));
  // modelViewMatrix.rotate(time * 0.5, new Vector3(1, 0, 0));
  // modelViewMatrix.rotate(Math.sin(time * 0.3) * 0.2, new Vector3(0, 1, 0));

  // 更新uniform缓冲区
  modelViewMatrixBuffer.update(new Float32Array(modelViewMatrix.getElements()));
  timeBuffer.update(new Float32Array([time]));

  // 创建命令编码器
  const encoder = device.createCommandEncoder('Main Encoder');

  // 开始渲染通道
  const renderPass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: texture.createView(), // 使用一个临时纹理作为渲染目标
        loadOp: 'clear',
        storeOp: 'store',
        clearColor: [0.1, 0.1, 0.1, 1.0],
      },
    ],
    depthStencilAttachment: {
      view: texture.createView(), // 在实际应用中，这应该是深度纹理
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
      clearDepth: 1.0,
      depthWriteEnabled: true,
    },
  });

  // 设置视口
  renderPass.setViewport(0, 0, canvas.width, canvas.height, 0, 1);

  // 设置渲染管线
  renderPass.setPipeline(renderPipeline);

  // 设置绑定组
  renderPass.setBindGroup(0, bindGroup);

  // 设置顶点缓冲区
  renderPass.setVertexBuffer(0, vertexBuffer);

  // 绘制
  renderPass.draw(3);

  // 结束渲染通道
  renderPass.end();

  // 完成命令编码
  const commandBuffer = encoder.finish();

  // 提交命令
  device.submit([commandBuffer]);

  // 请求下一帧
  requestAnimationFrame(render);
}

// 处理窗口大小变化
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 更新投影矩阵
  projectionMatrix.perspective(45, canvas.width / canvas.height, 0.1, 100.0);
  projectionMatrixBuffer.update(new Float32Array(projectionMatrix.getElements()));
});

// 开始渲染
render();