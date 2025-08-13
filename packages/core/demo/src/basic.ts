import type { RHIVertexLayout } from '@maxellabs/core';
import {
  RHIBufferUsage,
  RHICompareFunction,
  RHIPrimitiveTopology,
  RHIShaderStage,
  RHITextureFormat,
  RHITextureUsage,
  RHIVertexFormat,
  RHIBlendFactor,
  RHIBlendOperation,
  RHITextureType,
} from '@maxellabs/core';
import { WebGLDevice } from '@maxellabs/rhi';
import { Matrix4, Vector3 } from '@maxellabs/math';

// 获取画布并调整大小
const canvas = document.getElementById('J-canvas') as HTMLCanvasElement;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 创建设备
const device = new WebGLDevice(canvas);

// 顶点着色器源码
const vertexShaderSource = `#version 300 es
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

// 创建顶点数据 - 简单三角形
const vertices = new Float32Array([
  // Position(x,y,z)  // Texture coords(u,v)  // Color(r,g,b,a)
  -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.5, 0.0, 0.5, 1.0,
  0.0, 0.0, 1.0, 1.0,
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
const vertexLayout = {
  buffers: [
    {
      stride: 36, // 9个float每顶点 (3+2+4)*4
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
          shaderLocation: 1,
        },
        {
          name: 'aColor',
          format: RHIVertexFormat.FLOAT32X4,
          offset: 20, // 3+2个float后的偏移
          shaderLocation: 2,
        },
      ],
      index: 0,
    },
  ],
};

// 创建棋盘格纹理数据
const textureSize = 256;
const textureData = new Uint8Array(textureSize * textureSize * 4);

for (let y = 0; y < textureSize; y++) {
  for (let x = 0; x < textureSize; x++) {
    const index = (y * textureSize + x) * 4;
    const isCheckerboard = (Math.floor(x / 32) % 2 === 0) !== (Math.floor(y / 32) % 2 === 0);

    textureData[index] = isCheckerboard ? 255 : 0; // R
    textureData[index + 1] = isCheckerboard ? 255 : 0; // G
    textureData[index + 2] = isCheckerboard ? 255 : 0; // B
    textureData[index + 3] = 255; // A
  }
}

// 创建纹理
const texture = device.createTexture({
  width: textureSize,
  height: textureSize,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.SAMPLED | RHITextureUsage.COPY_DST,
  dimension: RHITextureType.TEXTURE_2D,
  label: 'Checkerboard Texture',
});

// 更新纹理数据
texture.update(textureData);

// 创建纹理视图
const textureView = texture.createView();

// 创建渲染目标纹理
let renderTargetTexture = device.createTexture({
  width: canvas.width,
  height: canvas.height,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
  dimension: RHITextureType.TEXTURE_2D,
  label: 'Render Target Texture',
});

// 创建采样器
const sampler = device.createSampler({
  magFilter: 'linear',
  minFilter: 'linear',
  mipmapFilter: 'linear',
  addressModeU: 'repeat',
  addressModeV: 'repeat',
  label: 'Texture Sampler',
});

// 变换矩阵
let rotationX = 0;
let rotationY = 0;
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

// 创建绑定组布局
const bindGroupLayout = device.createBindGroupLayout(
  [
    {
      // Binding 0: Uniform Buffer
      binding: 0,
      visibility: RHIShaderStage.VERTEX,
      buffer: {
        type: 'uniform', // 使用 'uniform' 并嵌套在 buffer 对象内
        // hasDynamicOffset: false, // 可选
        // minBindingSize: 64, // 可选
      },
      name: 'uModelViewMatrix', // name 作为我们内部扩展添加，用于查找 uniform location
    },
    {
      // Binding 1: Uniform Buffer
      binding: 1,
      visibility: RHIShaderStage.VERTEX,
      buffer: {
        type: 'uniform',
      },
      name: 'uProjectionMatrix',
    },
    {
      // Binding 2: Texture
      binding: 2,
      visibility: RHIShaderStage.FRAGMENT,
      texture: {
        sampleType: 'float', // 需要指定 sampleType
        viewDimension: '2d', // 需要指定 viewDimension
        // multisampled: false, // 可选
      },
      name: 'uTexture', // 对应 shader 中的 sampler2D uniform
    },
    {
      // Binding 3: Sampler
      binding: 3,
      visibility: RHIShaderStage.FRAGMENT,
      sampler: {
        type: 'filtering', // 需要指定 sampler 类型 (filtering, non-filtering, comparison)
        // comparison: false, // 可选
      },
      name: 'uTextureSampler', // 这个 name 可能在 WebGL 中不直接用于 getUniformLocation，但可以保留用于调试或特殊逻辑
      // sampler uniform 的值通常是 texture unit index
    },
    {
      // Binding 4: Uniform Buffer
      binding: 4,
      visibility: RHIShaderStage.FRAGMENT,
      buffer: {
        type: 'uniform',
      },
      name: 'uTime',
    },
  ],
  'Main Bind Group Layout'
);

// 创建管线布局
const pipelineLayout = device.createPipelineLayout([bindGroupLayout], 'Main Pipeline Layout');

// 创建渲染管线
const pipeline = device.createRenderPipeline({
  vertexShader,
  fragmentShader,
  vertexLayout: vertexLayout as RHIVertexLayout,
  primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
  layout: pipelineLayout,
  depthStencilState: {
    depthWriteEnabled: true,
    depthCompare: RHICompareFunction.LESS,
    format: RHITextureFormat.DEPTH24_UNORM_STENCIL8,
  },
  colorBlendState: {
    attachments: [
      {
        color: {
          enable: true,
          srcFactor: RHIBlendFactor.SRC_ALPHA,
          dstFactor: RHIBlendFactor.ONE_MINUS_SRC_ALPHA,
          operation: RHIBlendOperation.ADD,
        },
        alpha: {
          enable: true,
          srcFactor: RHIBlendFactor.ONE,
          dstFactor: RHIBlendFactor.ONE_MINUS_SRC_ALPHA,
          operation: RHIBlendOperation.ADD,
        },
      },
    ],
  },
  label: 'Main Render Pipeline',
});

// 创建绑定组
const bindGroup = device.createBindGroup(
  bindGroupLayout,
  [
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
  ],
  'Main Bind Group'
);

// 渲染循环
let time = 0;

function render() {
  time += 0.01;

  // 更新旋转
  rotationX += 0.01;
  rotationY += 0.02;

  // 更新模型视图矩阵
  modelViewMatrix.identity();
  modelViewMatrix.translate(new Vector3(0, 0, -2));
  modelViewMatrix.rotateX(rotationX);
  modelViewMatrix.rotateY(rotationY);

  // 更新uniform缓冲区
  modelViewMatrixBuffer.update(new Float32Array(modelViewMatrix.getElements()));
  timeBuffer.update(new Float32Array([time]));

  const commandEncoder = device.createCommandEncoder();
  const renderPassDescriptor = {
    colorAttachments: [
      {
        view: renderTargetTexture.createView(),
        loadOp: 'clear' as 'clear' | 'load' | 'none',
        storeOp: 'store' as 'store' | 'discard',
        clearColor: [0.1, 0.1, 0.1, 1.0] as [number, number, number, number],
      },
    ],
  };
  const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);

  renderPass.setPipeline(pipeline);
  renderPass.setBindGroup(0, bindGroup);

  renderPass.setVertexBuffer(0, vertexBuffer);

  renderPass.draw(3, 1, 0, 0);
  renderPass.end();

  commandEncoder.copyTextureToCanvas({
    source: renderTargetTexture.createView(),
    destination: canvas,
  });

  device.submit([commandEncoder.finish()]);

  requestAnimationFrame(render);
}

// 处理窗口大小变化
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 销毁之前的纹理
  renderTargetTexture.destroy();

  // 创建新的渲染目标纹理
  renderTargetTexture = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: RHITextureType.TEXTURE_2D,
    label: 'Render Target Texture',
  });

  // 更新投影矩阵
  projectionMatrix.perspective(45, canvas.width / canvas.height, 0.1, 100.0);
  projectionMatrixBuffer.update(new Float32Array(projectionMatrix.getElements()));
});

// 开始渲染
render();
