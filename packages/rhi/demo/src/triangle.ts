/**
 * triangle.ts
 * 最简单的三角形渲染demo
 * 展示RHI的基础渲染能力
 */

import type { IRHITexture, RHIVertexLayout } from '@maxellabs/core';
import {
  RHIBufferUsage,
  RHIVertexFormat,
  RHIPrimitiveTopology,
  RHITextureFormat,
  RHITextureUsage,
} from '@maxellabs/core';
import { WebGLDevice } from '../../src/webgl/GLDevice';

// 常量定义
const CANVAS_ID = 'J-canvas';
const DEMO_NAME = '三角形渲染Demo';

// 全局变量
let device: WebGLDevice;
let canvas: HTMLCanvasElement;
let animationId: number;
let renderTargetTexture: IRHITexture;

// 顶点着色器源码
const vertexShaderSource = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec3 aColor;

// 输出到片段着色器
out vec3 vColor;

void main() {
  vColor = aColor;
  gl_Position = vec4(aPosition, 1.0);
}
`;

// 片段着色器源码
const fragmentShaderSource = `#version 300 es
precision mediump float;

// 来自顶点着色器的输入
in vec3 vColor;

// 输出颜色
out vec4 fragColor;

void main() {
  fragColor = vec4(vColor, 1.0);
}
`;

/**
 * 初始化demo
 */
async function init(): Promise<void> {
  console.info(`${DEMO_NAME} 开始初始化...`);

  // ===== 第1步：准备渲染目标 =====
  // 获取画布元素，这是我们的渲染目标
  canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
  if (!canvas) {
    throw new Error(`找不到画布元素: ${CANVAS_ID}`);
  }

  // 设置画布大小匹配窗口大小
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // ===== 第2步：创建RHI设备 =====
  // WebGLDevice是RHI的WebGL实现，负责管理WebGL上下文和资源
  device = new WebGLDevice(canvas);
  console.info('WebGL设备创建成功');

  // ===== 第3步：创建着色器程序 =====
  // 顶点着色器：处理顶点位置变换和颜色传递
  const vertexShader = device.createShaderModule({
    code: vertexShaderSource,
    language: 'glsl',
    stage: 'vertex',
    label: 'Triangle Vertex Shader',
  });

  // 片段着色器：处理像素颜色计算
  const fragmentShader = device.createShaderModule({
    code: fragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'Triangle Fragment Shader',
  });

  console.info('着色器模块创建成功');

  // ===== 第4步：准备几何数据 =====
  // 定义三角形的顶点数据，每个顶点包含位置(x,y,z)和颜色(r,g,b)
  const vertices = new Float32Array([
    // 顶点位置        // 顶点颜色
    0.0,
    0.5,
    0.0,
    1.0,
    0.0,
    0.0, // 顶部顶点 - 红色
    -0.5,
    -0.5,
    0.0,
    0.0,
    1.0,
    0.0, // 左下顶点 - 绿色
    0.5,
    -0.5,
    0.0,
    0.0,
    0.0,
    1.0, // 右下顶点 - 蓝色
  ]);

  // ===== 第5步：创建顶点缓冲区 =====
  // 将顶点数据上传到GPU显存中
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: RHIBufferUsage.VERTEX,
    hint: 'static',
    initialData: vertices,
    label: 'Triangle Vertex Buffer',
  });

  console.info('顶点缓冲区创建成功');

  // ===== 第6步：定义顶点布局 =====
  // 告诉GPU如何解释顶点缓冲区中的数据
  const vertexLayout: RHIVertexLayout = {
    buffers: [
      {
        index: 0,
        stride: 24, // 6个float每顶点 (3位置 + 3颜色) * 4字节
        stepMode: 'vertex',
        attributes: [
          {
            name: 'aPosition',
            format: RHIVertexFormat.FLOAT32X3,
            offset: 0,
            shaderLocation: 0,
          },
          {
            name: 'aColor',
            format: RHIVertexFormat.FLOAT32X3,
            offset: 12, // 3个float后的偏移
            shaderLocation: 1,
          },
        ],
      },
    ],
  };

  // ===== 第7步：创建渲染管线 =====
  // 创建空的绑定组布局（这个demo不需要uniform）
  const bindGroupLayout = device.createBindGroupLayout([], 'Triangle BindGroup Layout');

  // 创建管线布局
  const pipelineLayout = device.createPipelineLayout([bindGroupLayout], 'Triangle Pipeline Layout');

  // 创建渲染管线，组合着色器、顶点布局和渲染状态
  const renderPipeline = device.createRenderPipeline({
    vertexShader,
    fragmentShader,
    vertexLayout,
    primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
    layout: pipelineLayout,
    label: 'Triangle Render Pipeline',
  });

  console.info('渲染管线创建成功');

  // ===== 第8步：创建渲染目标纹理 =====
  // 创建一个纹理作为渲染目标，最后会拷贝到画布上
  renderTargetTexture = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
  });

  // ===== 第9步：保存资源供渲染使用 =====
  // 存储资源到全局变量以便渲染循环使用
  (window as any).triangleResources = {
    vertexBuffer,
    renderPipeline,
    vertexCount: 3,
  };

  console.info(`${DEMO_NAME} 初始化完成`);
}

/**
 * 渲染循环
 */
function render(): void {
  const resources = (window as any).triangleResources;
  if (!resources) {
    return;
  }

  try {
    // ===== 渲染步骤1：创建命令编码器 =====
    // 命令编码器用于记录渲染命令，最后一次性提交给GPU
    const commandEncoder = device.createCommandEncoder('Triangle Render');

    // ===== 渲染步骤2：配置渲染通道 =====
    // 渲染通道描述符定义渲染目标和清除操作
    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: renderTargetTexture.createView(), // 渲染到我们创建的纹理
          loadOp: 'clear' as const, // 开始时清除颜色缓冲区
          storeOp: 'store' as const, // 结束时保存渲染结果
          clearColor: [0.1, 0.1, 0.1, 1.0] as [number, number, number, number], // 深灰色背景
        },
      ],
    };

    // ===== 渲染步骤3：开始渲染通道 =====
    // 开始记录渲染命令
    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);

    // ===== 渲染步骤4：设置渲染管线 =====
    // 绑定之前创建的渲染管线（着色器程序和渲染状态）
    renderPass.setPipeline(resources.renderPipeline);

    // ===== 渲染步骤5：绑定顶点数据 =====
    // 将顶点缓冲区绑定到管线的第0个槽位
    renderPass.setVertexBuffer(0, resources.vertexBuffer);

    // ===== 渲染步骤6：执行绘制命令 =====
    // 绘制3个顶点组成的三角形
    renderPass.draw(resources.vertexCount);

    // ===== 渲染步骤7：结束渲染通道 =====
    renderPass.end();

    // ===== 渲染步骤8：拷贝到画布 =====
    // 将渲染结果从纹理拷贝到画布上显示
    commandEncoder.copyTextureToCanvas({
      source: renderTargetTexture.createView(),
      destination: canvas,
    });

    // ===== 渲染步骤9：提交命令 =====
    // 将所有记录的命令提交给GPU执行
    device.submit([commandEncoder.finish()]);

    // ===== 渲染步骤10：请求下一帧 =====
    // 注册下一帧的渲染回调，实现连续渲染
    animationId = requestAnimationFrame(render);
  } catch (error) {
    console.error('渲染错误:', error);
  }
}

/**
 * 设置事件处理器
 */
function setupEventHandlers(): void {
  // 窗口大小改变时重新调整画布大小
  window.addEventListener('resize', () => {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
    }
  });

  // eslint-disable-next-line no-console
  console.log('事件处理器设置完成');
}

/**
 * 清理资源
 */
function cleanup(): void {
  // eslint-disable-next-line no-console
  console.log('开始清理资源...');

  // 停止动画循环
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = 0;
  }

  // 清理WebGL资源
  const resources = (window as any).triangleResources;
  if (resources) {
    resources.vertexBuffer?.destroy();
    resources.renderPipeline?.destroy();
    (window as any).triangleResources = null;
  }

  // 销毁设备
  if (device) {
    device.destroy();
  }

  // eslint-disable-next-line no-console
  console.log('资源清理完成');
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    await init();
    setupEventHandlers();
    render();

    // eslint-disable-next-line no-console
    console.log(`${DEMO_NAME} 启动成功！`);
    // eslint-disable-next-line no-console
    console.log('控制说明:');
    // eslint-disable-next-line no-console
    console.log('- ESC: 退出demo');
    // eslint-disable-next-line no-console
    console.log('- F11: 切换全屏');
  } catch (error) {
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
    errorDiv.textContent = `${DEMO_NAME} 初始化失败: ${(error as Error).message}`;
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
