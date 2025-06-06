/**
 * texture.ts
 * 纹理映射demo
 * 展示纹理采样和多种纹理效果
 */

import type { IRHITexture, RHIVertexLayout } from '@maxellabs/core';
import {
  RHIBufferUsage,
  RHIVertexFormat,
  RHIPrimitiveTopology,
  RHITextureFormat,
  RHITextureUsage,
  RHIIndexFormat,
  RHIShaderStage,
} from '@maxellabs/core';
import { WebGLDevice } from '../../src/webgl/GLDevice';
import { Matrix4, Vector3 } from '@maxellabs/math';

// 常量定义
const CANVAS_ID = 'J-canvas';
const DEMO_NAME = '纹理映射Demo';

// 全局变量
let device: WebGLDevice;
let canvas: HTMLCanvasElement;
let animationId: number;
let startTime: number;
let renderTargetTexture: IRHITexture;

// 顶点着色器源码
const vertexShaderSource = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec2 aTexCoord;

// Uniform变量
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

// 输出到片段着色器
out vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;

  // 计算最终位置
  mat4 mvpMatrix = uProjectionMatrix * uViewMatrix * uModelMatrix;
  gl_Position = mvpMatrix * vec4(aPosition, 1.0);
}
`;

// 片段着色器源码
const fragmentShaderSource = `#version 300 es
precision mediump float;

// 来自顶点着色器的输入
in vec2 vTexCoord;

// 纹理和采样器
uniform sampler2D uTexture1;
uniform sampler2D uTexture2;

// Uniform变量
uniform float uTime;
uniform float uMixFactor;

// 输出颜色
out vec4 fragColor;

void main() {
  // 采样两个纹理
  vec4 color1 = texture(uTexture1, vTexCoord);
  vec4 color2 = texture(uTexture2, vTexCoord + vec2(sin(uTime * 0.5) * 0.1, cos(uTime * 0.3) * 0.1));

  // 混合两个纹理
  vec4 mixedColor = mix(color1, color2, uMixFactor);

  // 添加一些动态效果
  float wave = sin(vTexCoord.x * 10.0 + uTime) * sin(vTexCoord.y * 10.0 + uTime) * 0.1;
  mixedColor.rgb += wave;

  fragColor = mixedColor;
}
`;

/**
 * 生成红蓝条纹纹理（替代棋盘格）
 */
function generateRedBlueStripesTexture(size: number, stripeWidth: number): Uint8Array {
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      // 创建垂直红蓝条纹
      const isRed = Math.floor(x / stripeWidth) % 2 === 0;

      if (isRed) {
        data[index] = 255; // R - 红色
        data[index + 1] = 0; // G
        data[index + 2] = 0; // B
      } else {
        data[index] = 0; // R
        data[index + 1] = 0; // G - 蓝色
        data[index + 2] = 255; // B
      }
      data[index + 3] = 255; // A
    }
  }

  return data;
}

/**
 * 生成渐变纹理
 */
function generateGradientTexture(size: number): Uint8Array {
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const u = x / (size - 1);
      const v = y / (size - 1);

      // 创建彩虹渐变
      const hue = (u + v) * 0.5;
      const rgb = hslToRgb(hue, 1.0, 0.5);

      data[index] = Math.floor(rgb[0] * 255); // R
      data[index + 1] = Math.floor(rgb[1] * 255); // G
      data[index + 2] = Math.floor(rgb[2] * 255); // B
      data[index + 3] = 255; // A
    }
  }

  return data;
}

/**
 * HSL转RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 1 / 6) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 2 / 6) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 3 / 6) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 4 / 6) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 5 / 6) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return [r + m, g + m, b + m];
}

/**
 * 初始化demo
 */
async function init(): Promise<void> {
  console.info(`${DEMO_NAME} 开始初始化...`);

  // ===== 第1步：准备渲染目标 =====
  // 获取画布元素
  canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
  if (!canvas) {
    throw new Error(`找不到画布元素: ${CANVAS_ID}`);
  }

  // 设置画布大小
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // ===== 第2步：创建RHI设备 =====
  // WebGLDevice是RHI的WebGL实现
  device = new WebGLDevice(canvas);
  console.info('WebGL设备创建成功');

  // ===== 第3步：创建着色器程序 =====
  // 顶点着色器：处理3D变换和纹理坐标传递
  const vertexShader = device.createShaderModule({
    code: vertexShaderSource,
    language: 'glsl',
    stage: 'vertex',
    label: 'Texture Vertex Shader',
  });

  // 片段着色器：处理纹理采样和混合效果
  const fragmentShader = device.createShaderModule({
    code: fragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'Texture Fragment Shader',
  });

  console.info('着色器模块创建成功');

  // ===== 第4步：准备几何数据 =====
  // 定义四边形顶点数据（两个三角形组成），包含位置和纹理坐标
  const vertices = new Float32Array([
    // 位置(x,y,z)    // 纹理坐标(u,v)
    -1.0,
    -1.0,
    0.0,
    0.0,
    0.0, // 左下
    1.0,
    -1.0,
    0.0,
    1.0,
    0.0, // 右下
    1.0,
    1.0,
    0.0,
    1.0,
    1.0, // 右上
    -1.0,
    1.0,
    0.0,
    0.0,
    1.0, // 左上
  ]);

  // 索引数据定义两个三角形
  const indices = new Uint16Array([
    0,
    1,
    2, // 第一个三角形
    2,
    3,
    0, // 第二个三角形
  ]);

  // ===== 第5步：创建顶点和索引缓冲区 =====
  // 创建顶点缓冲区
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: RHIBufferUsage.VERTEX,
    hint: 'static',
    initialData: vertices,
    label: 'Texture Vertex Buffer',
  });

  // 创建索引缓冲区
  const indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: RHIBufferUsage.INDEX,
    hint: 'static',
    initialData: indices,
    label: 'Texture Index Buffer',
  });

  console.info('缓冲区创建成功');

  // ===== 第6步：定义顶点布局 =====
  // 描述顶点数据的结构
  const vertexLayout: RHIVertexLayout = {
    buffers: [
      {
        index: 0,
        stride: 20, // 5个float每顶点 (3位置 + 2纹理坐标) * 4字节
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
        ],
      },
    ],
  };

  // ===== 第7步：创建纹理资源 =====
  const textureSize = 256;

  // 生成并创建红蓝条纹纹理
  const redBlueStripesData = generateRedBlueStripesTexture(textureSize, 32);
  const texture1 = device.createTexture({
    width: textureSize,
    height: textureSize,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.SAMPLED | RHITextureUsage.COPY_DST,
    dimension: '2d',
    label: 'Red Blue Stripes Texture',
  });
  texture1.update(redBlueStripesData);

  // 生成并创建渐变纹理
  const gradientData = generateGradientTexture(textureSize);
  const texture2 = device.createTexture({
    width: textureSize,
    height: textureSize,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.SAMPLED | RHITextureUsage.COPY_DST,
    dimension: '2d',
    label: 'Gradient Texture',
  });
  texture2.update(gradientData);

  console.info('纹理创建成功');

  // ===== 第8步：创建Uniform缓冲区 =====
  // 创建时间uniform缓冲区（仅存储当前时间）
  const timeBuffer = device.createBuffer({
    size: 4, // 单个float
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Time Buffer',
    extension: {
      typeInfo: {
        uniformName: 'uTime',
        uniformType: 'float',
      },
    },
  });

  const mixFactorBuffer = device.createBuffer({
    size: 4, // 单个float
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Mix Factor Buffer',
    extension: {
      typeInfo: {
        uniformName: 'uMixFactor',
        uniformType: 'float',
      },
    },
  });

  // ===== 第9步：创建绑定组布局和绑定组 =====
  // 修改绑定组布局，正确处理所有uniform
  const bindGroupLayout = device.createBindGroupLayout(
    [
      // 模型矩阵
      {
        binding: 0,
        visibility: RHIShaderStage.VERTEX,
        name: 'uModelMatrix',
        buffer: {
          type: 'uniform',
        },
      },
      // 视图矩阵
      {
        binding: 1,
        visibility: RHIShaderStage.VERTEX,
        name: 'uViewMatrix',
        buffer: {
          type: 'uniform',
        },
      },
      // 投影矩阵
      {
        binding: 2,
        visibility: RHIShaderStage.VERTEX,
        name: 'uProjectionMatrix',
        buffer: {
          type: 'uniform',
        },
      },
      // 时间uniform
      {
        binding: 3,
        visibility: RHIShaderStage.FRAGMENT,
        name: 'uTime',
        buffer: {
          type: 'uniform',
        },
      },
      // 混合因子uniform
      {
        binding: 4,
        visibility: RHIShaderStage.FRAGMENT,
        name: 'uMixFactor',
        buffer: {
          type: 'uniform',
        },
      },
      // 纹理1
      {
        binding: 5,
        visibility: RHIShaderStage.FRAGMENT,
        name: 'uTexture1',
        texture: {
          sampleType: 'float',
          viewDimension: '2d',
        },
      },
      // 纹理2
      {
        binding: 6,
        visibility: RHIShaderStage.FRAGMENT,
        name: 'uTexture2',
        texture: {
          sampleType: 'float',
          viewDimension: '2d',
        },
      },
      // 纹理采样器
      {
        binding: 7,
        visibility: RHIShaderStage.FRAGMENT,
        sampler: { type: 'filtering' },
        name: 'uTextureSampler',
      },
    ],
    'Texture BindGroup Layout'
  );

  // 创建采样器
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    mipmapFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    label: 'Texture Sampler',
  });

  // 创建分离的uniform缓冲区
  const modelMatrixBuffer = device.createBuffer({
    size: 64, // 单个4x4矩阵
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Model Matrix Buffer',
    extension: {
      typeInfo: {
        uniformName: 'uModelMatrix',
        uniformType: 'mat4',
      },
    },
  });

  const viewMatrixBuffer = device.createBuffer({
    size: 64,
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'View Matrix Buffer',
    extension: {
      typeInfo: {
        uniformName: 'uViewMatrix',
        uniformType: 'mat4',
      },
    },
  });

  const projectionMatrixBuffer = device.createBuffer({
    size: 64,
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Projection Matrix Buffer',
    extension: {
      typeInfo: {
        uniformName: 'uProjectionMatrix',
        uniformType: 'mat4',
      },
    },
  });

  // 创建绑定组
  const bindGroup = device.createBindGroup(
    bindGroupLayout,
    [
      { binding: 0, resource: modelMatrixBuffer },
      { binding: 1, resource: viewMatrixBuffer },
      { binding: 2, resource: projectionMatrixBuffer },
      { binding: 3, resource: timeBuffer },
      { binding: 4, resource: mixFactorBuffer },
      { binding: 5, resource: texture1.createView() },
      { binding: 6, resource: texture2.createView() },
      { binding: 7, resource: sampler },
    ],
    'Texture BindGroup'
  );

  // ===== 第10步：创建渲染管线 =====
  // 创建管线布局
  const pipelineLayout = device.createPipelineLayout([bindGroupLayout], 'Texture Pipeline Layout');

  // 创建渲染管线，组合所有渲染状态
  const renderPipeline = device.createRenderPipeline({
    vertexShader,
    fragmentShader,
    vertexLayout,
    primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
    layout: pipelineLayout,
    label: 'Texture Render Pipeline',
  });

  console.info('渲染管线创建成功');

  // ===== 第11步：创建渲染目标纹理 =====
  renderTargetTexture = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Render Target Texture',
  });

  // ===== 第12步：初始化3D变换矩阵 =====
  // 初始化变换矩阵
  const modelMatrix = new Matrix4();
  const viewMatrix = new Matrix4();
  const projectionMatrix = new Matrix4();

  // 设置相机视图矩阵
  viewMatrix.lookAt(
    new Vector3(0, 0, 3), // 相机位置
    new Vector3(0, 0, 0), // 目标位置
    new Vector3(0, 1, 0) // 上方向
  );

  // 设置透视投影矩阵
  projectionMatrix.perspective(
    (45 * Math.PI) / 180, // FOV
    canvas.width / canvas.height, // 宽高比
    0.1, // 近平面
    100.0 // 远平面
  );

  // ===== 初始化矩阵缓冲区数据 =====
  // 立即更新矩阵缓冲区，确保初始数据正确传递到GPU
  modelMatrixBuffer.update(new Float32Array(modelMatrix.getElements()));
  viewMatrixBuffer.update(new Float32Array(viewMatrix.getElements()));
  projectionMatrixBuffer.update(new Float32Array(projectionMatrix.getElements()));

  // 初始化时间和混合因子缓冲区
  const initialTimeData = new Float32Array([0.0]);
  const initialMixFactorData = new Float32Array([0.5]); // 初始混合因子设为0.5
  timeBuffer.update(initialTimeData);
  mixFactorBuffer.update(initialMixFactorData);

  // 调试：打印矩阵数据
  console.info('模型矩阵:', Array.from(modelMatrix.getElements()));
  console.info('视图矩阵:', Array.from(viewMatrix.getElements()));
  console.info('投影矩阵:', Array.from(projectionMatrix.getElements()));
  console.info('初始时间:', initialTimeData[0]);
  console.info('初始混合因子:', initialMixFactorData[0]);

  console.info('矩阵初始化完成，数据已同步到GPU');

  // ===== 第13步：保存资源供渲染使用 =====
  // 存储资源到全局变量
  (window as any).textureResources = {
    vertexBuffer,
    indexBuffer,
    renderPipeline,
    bindGroup,
    modelMatrixBuffer,
    viewMatrixBuffer,
    projectionMatrixBuffer,
    timeBuffer,
    mixFactorBuffer,
    modelMatrix,
    viewMatrix,
    projectionMatrix,
    renderTargetTexture,
    indexCount: indices.length,
  };

  startTime = performance.now();
  console.info(`${DEMO_NAME} 初始化完成`);
}

/**
 * 渲染循环
 */
function render(): void {
  const resources = (window as any).textureResources;
  if (!resources) {
    return;
  }

  try {
    const currentTime = (performance.now() - startTime) / 1000;

    // ===== 渲染步骤1：更新动画数据 =====
    // 更新模型矩阵（旋转动画）
    resources.modelMatrix.identity();
    resources.modelMatrix.rotateY(currentTime * 0.1); // Y轴旋转
    resources.modelMatrix.rotateX(Math.sin(currentTime) * 0.3); // X轴摆动

    // ===== 渲染步骤2：更新Uniform缓冲区 =====
    // 按照basic.ts的成功模式，使用new Float32Array包装数据
    resources.modelMatrixBuffer.update(new Float32Array(resources.modelMatrix.getElements()));
    resources.viewMatrixBuffer.update(new Float32Array(resources.viewMatrix.getElements()));
    resources.projectionMatrixBuffer.update(new Float32Array(resources.projectionMatrix.getElements()));

    // 更新时间uniform缓冲区
    const timeData = new Float32Array([currentTime]);
    resources.timeBuffer.update(timeData);

    // 更新混合因子uniform缓冲区
    const mixFactorData = new Float32Array([(Math.sin(currentTime * 0.8) + 1) * 0.5]);
    resources.mixFactorBuffer.update(mixFactorData);

    // 调试信息：每秒打印一次状态
    if (Math.floor(currentTime) !== Math.floor(currentTime - 1 / 60)) {
      console.info(`渲染状态 - 时间: ${currentTime.toFixed(2)}, 混合因子: ${mixFactorData[0].toFixed(3)}`);
    }

    // ===== 渲染步骤3：创建命令编码器 =====
    // 开始记录渲染命令
    const commandEncoder = device.createCommandEncoder('Texture Render');

    // ===== 渲染步骤4：配置渲染通道 =====
    // 创建渲染通道描述符
    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: resources.renderTargetTexture.createView(), // 渲染到纹理
          loadOp: 'clear' as const, // 清除颜色缓冲区
          storeOp: 'store' as const, // 保存渲染结果
          clearColor: [0, 0, 0, 1.0] as [number, number, number, number], // 深蓝色背景
        },
      ],
    };

    // ===== 渲染步骤5：开始渲染通道 =====
    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);

    // ===== 渲染步骤6：设置渲染管线 =====
    // 绑定渲染管线（着色器和渲染状态）
    renderPass.setPipeline(resources.renderPipeline);

    // ===== 渲染步骤7：绑定几何数据 =====
    // 设置顶点缓冲区
    renderPass.setVertexBuffer(0, resources.vertexBuffer);

    // 设置索引缓冲区
    renderPass.setIndexBuffer(resources.indexBuffer, RHIIndexFormat.UINT16);

    // ===== 渲染步骤8：绑定资源 =====
    // 设置绑定组（uniform缓冲区、纹理）
    renderPass.setBindGroup(0, resources.bindGroup);

    // ===== 渲染步骤9：执行绘制命令 =====
    // 绘制索引化几何体（四边形）
    renderPass.drawIndexed(resources.indexCount);

    // ===== 渲染步骤10：结束渲染通道 =====
    renderPass.end();

    // ===== 渲染步骤11：拷贝到画布 =====
    // 将渲染结果从纹理拷贝到画布显示
    commandEncoder.copyTextureToCanvas({
      source: resources.renderTargetTexture.createView(),
      destination: canvas,
    });

    // ===== 渲染步骤12：提交命令 =====
    // 将所有命令提交给GPU执行
    device.submit([commandEncoder.finish()]);

    // ===== 渲染步骤13：请求下一帧 =====
    // 注册下一帧渲染回调，实现连续动画
    animationId = requestAnimationFrame(render);
  } catch (error) {
    console.error('渲染错误:', error);
  }
}

/**
 * 设置事件处理器
 */
function setupEventHandlers(): void {
  // 窗口大小改变
  window.addEventListener('resize', () => {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // 获取resources
      const resources = (window as any).textureResources;
      if (resources) {
        // 销毁之前的渲染目标纹理
        if (resources.renderTargetTexture) {
          resources.renderTargetTexture.destroy();
        }

        // 创建新的渲染目标纹理
        resources.renderTargetTexture = device.createTexture({
          width: canvas.width,
          height: canvas.height,
          format: RHITextureFormat.RGBA8_UNORM,
          usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
          dimension: '2d',
          label: 'Render Target Texture',
        });

        // 更新投影矩阵
        resources.projectionMatrix.perspective((45 * Math.PI) / 180, canvas.width / canvas.height, 0.1, 100.0);
        resources.projectionMatrixBuffer.update(new Float32Array(resources.projectionMatrix.getElements()));
      }
    }
  });

  // 键盘事件
  window.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'Escape':
        cleanup();
        break;
      case 'F11':
        event.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          canvas.requestFullscreen();
        }
        break;
      case 'Space':
        event.preventDefault();
        // 重置动画
        startTime = performance.now();
        break;
    }
  });

  console.info('事件处理器设置完成');
}

/**
 * 清理资源
 */
function cleanup(): void {
  console.info('开始清理资源...');

  // 停止动画循环
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = 0;
  }

  // 清理WebGL资源
  const resources = (window as any).textureResources;
  if (resources) {
    resources.vertexBuffer?.destroy();
    resources.indexBuffer?.destroy();
    resources.renderPipeline?.destroy();
    resources.bindGroup?.destroy();
    resources.modelMatrixBuffer?.destroy();
    resources.viewMatrixBuffer?.destroy();
    resources.projectionMatrixBuffer?.destroy();
    resources.timeBuffer?.destroy();
    resources.mixFactorBuffer?.destroy();
    resources.renderTargetTexture?.destroy();
    (window as any).textureResources = null;
  }

  // 销毁设备
  if (device) {
    device.destroy();
  }

  console.info('资源清理完成');
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    await init();
    setupEventHandlers();
    render();

    console.info(`${DEMO_NAME} 启动成功！`);
    console.info('控制说明:');
    console.info('- ESC: 退出demo');
    console.info('- F11: 切换全屏');
    console.info('- Space: 重置动画');
  } catch (error: any) {
    console.error(`${DEMO_NAME} 初始化失败:`, error);

    // 显示错误信息到页面
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: monospace;
      z-index: 1000;
    `;
    errorDiv.textContent = `${DEMO_NAME} 初始化失败: ${error.message}`;
    document.body.appendChild(errorDiv);
  }
}

// 页面加载完成后启动demo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', cleanup);
