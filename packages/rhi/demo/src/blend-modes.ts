/**
 * blend-modes.ts
 * 混合模式 Demo
 *
 * 功能演示：
 * - Alpha 混合
 * - 加法混合
 * - 乘法混合
 * - 自定义混合因子和混合操作
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, SimpleGUI, OrbitController, Stats } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

in vec3 aPosition;

uniform vec2 uOffset;
uniform float uScale;
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

void main() {
  vec2 scaledPos = aPosition.xy * uScale;
  vec4 worldPosition = uModelMatrix * vec4(scaledPos + uOffset, aPosition.z, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform vec4 uColor;

out vec4 fragColor;

void main() {
  fragColor = uColor;
}
`;

// ==================== 混合模式定义 ====================

interface BlendModeConfig {
  name: string;
  description: string;
  colorBlendState: MSpec.RHIColorBlendState;
}

const BLEND_MODES: Record<string, BlendModeConfig> = {
  none: {
    name: 'No Blend',
    description: '禁用混合，完全覆盖',
    colorBlendState: {
      blendEnabled: false,
      attachments: [],
    },
  },
  alpha: {
    name: 'Alpha Blend',
    description: '标准透明度混合',
    colorBlendState: {
      blendEnabled: true,
      srcColorFactor: MSpec.RHIBlendFactor.SrcAlpha,
      dstColorFactor: MSpec.RHIBlendFactor.OneMinusSrcAlpha,
      colorBlendOperation: MSpec.RHIBlendOperation.ADD,
      srcAlphaFactor: MSpec.RHIBlendFactor.One,
      dstAlphaFactor: MSpec.RHIBlendFactor.OneMinusSrcAlpha,
      alphaBlendOperation: MSpec.RHIBlendOperation.ADD,
      attachments: [],
    },
  },
  additive: {
    name: 'Additive',
    description: '加法混合，颜色叠加',
    colorBlendState: {
      blendEnabled: true,
      srcColorFactor: MSpec.RHIBlendFactor.SrcAlpha,
      dstColorFactor: MSpec.RHIBlendFactor.One,
      colorBlendOperation: MSpec.RHIBlendOperation.ADD,
      srcAlphaFactor: MSpec.RHIBlendFactor.One,
      dstAlphaFactor: MSpec.RHIBlendFactor.One,
      alphaBlendOperation: MSpec.RHIBlendOperation.ADD,
      attachments: [],
    },
  },
  multiply: {
    name: 'Multiply',
    description: '乘法混合，颜色相乘',
    colorBlendState: {
      blendEnabled: true,
      srcColorFactor: MSpec.RHIBlendFactor.DstColor,
      dstColorFactor: MSpec.RHIBlendFactor.Zero,
      colorBlendOperation: MSpec.RHIBlendOperation.ADD,
      srcAlphaFactor: MSpec.RHIBlendFactor.DstAlpha,
      dstAlphaFactor: MSpec.RHIBlendFactor.Zero,
      alphaBlendOperation: MSpec.RHIBlendOperation.ADD,
      attachments: [],
    },
  },
  screen: {
    name: 'Screen',
    description: '屏幕混合，反向相乘',
    colorBlendState: {
      blendEnabled: true,
      srcColorFactor: MSpec.RHIBlendFactor.One,
      dstColorFactor: MSpec.RHIBlendFactor.OneMinusSrcColor,
      colorBlendOperation: MSpec.RHIBlendOperation.ADD,
      srcAlphaFactor: MSpec.RHIBlendFactor.One,
      dstAlphaFactor: MSpec.RHIBlendFactor.OneMinusSrcAlpha,
      alphaBlendOperation: MSpec.RHIBlendOperation.ADD,
      attachments: [],
    },
  },
  subtract: {
    name: 'Subtract',
    description: '减法混合，颜色相减',
    colorBlendState: {
      blendEnabled: true,
      srcColorFactor: MSpec.RHIBlendFactor.SrcAlpha,
      dstColorFactor: MSpec.RHIBlendFactor.One,
      colorBlendOperation: MSpec.RHIBlendOperation.REVERSE_SUBTRACT,
      srcAlphaFactor: MSpec.RHIBlendFactor.One,
      dstAlphaFactor: MSpec.RHIBlendFactor.One,
      alphaBlendOperation: MSpec.RHIBlendOperation.ADD,
      attachments: [],
    },
  },
  premultiplied: {
    name: 'Premultiplied Alpha',
    description: '预乘Alpha混合',
    colorBlendState: {
      blendEnabled: true,
      srcColorFactor: MSpec.RHIBlendFactor.One,
      dstColorFactor: MSpec.RHIBlendFactor.OneMinusSrcAlpha,
      colorBlendOperation: MSpec.RHIBlendOperation.ADD,
      srcAlphaFactor: MSpec.RHIBlendFactor.One,
      dstAlphaFactor: MSpec.RHIBlendFactor.OneMinusSrcAlpha,
      alphaBlendOperation: MSpec.RHIBlendOperation.ADD,
      attachments: [],
    },
  },
};

// ==================== Demo 配置 ====================

interface DemoParams {
  blendMode: string;
  alpha: number;
  showBackground: boolean;
  animateColors: boolean;
}

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '混合模式 Demo',
    clearColor: [0.15, 0.15, 0.2, 1.0],
  });

  try {
    // 2. 初始化
    await runner.init();

    // 创建性能统计
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });

    // 创建轨道控制器
    const orbit = new OrbitController(runner.canvas, {
      distance: 2,
      target: [0, 0, 0],
      enableDamping: true,
      autoRotate: true,
      autoRotateSpeed: 0.5,
    });

    // 3. Demo 参数
    const params: DemoParams = {
      blendMode: 'alpha',
      alpha: 0.7,
      showBackground: true,
      animateColors: true,
    };

    // 4. 创建三角形顶点数据
    const triangleVertices = new Float32Array([
      0.0,
      0.5,
      0.0, // 顶部
      -0.5,
      -0.5,
      0.0, // 左下
      0.5,
      -0.5,
      0.0, // 右下
    ]);

    // 5. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: triangleVertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: triangleVertices as BufferSource,
        label: 'Blend Triangle Vertex Buffer',
      })
    );

    // 6. 创建变换矩阵 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // 顶点着色器 uniform: offset(vec2) + scale(float) = 16 bytes (对齐)
    const vertexUniformBuffer = runner.track(
      runner.device.createBuffer({
        size: 16,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Blend Vertex Uniform Buffer',
      })
    );

    // 片段着色器 uniform: color(vec4) = 16 bytes
    const colorBuffer = runner.track(
      runner.device.createBuffer({
        size: 16,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Blend Color Buffer',
      })
    );

    // 8. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Blend Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Blend Fragment Shader',
      })
    );

    // 8. 顶点布局
    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0,
          stride: 12, // 3 floats * 4 bytes
          stepMode: 'vertex',
          attributes: [{ name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 }],
        },
      ],
    };

    // 9. 创建绑定组
    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout(
        [
          {
            binding: 0,
            visibility: MSpec.RHIShaderStage.VERTEX,
            buffer: { type: 'uniform' },
            name: 'uOffset',
          },
          {
            binding: 1,
            visibility: MSpec.RHIShaderStage.VERTEX,
            buffer: { type: 'uniform' },
            name: 'Transforms',
          },
          {
            binding: 2,
            visibility: MSpec.RHIShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
            name: 'uColor',
          },
        ],
        'Blend BindGroup Layout'
      )
    );

    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: vertexUniformBuffer },
        { binding: 1, resource: transformBuffer },
        { binding: 2, resource: colorBuffer },
      ])
    );

    const pipelineLayout = runner.track(runner.device.createPipelineLayout([bindGroupLayout], 'Blend Pipeline Layout'));

    // 10. 创建管线缓存（用于不同混合模式）
    const pipelines: Map<string, MSpec.IRHIRenderPipeline> = new Map();

    const getOrCreatePipeline = (mode: string): MSpec.IRHIRenderPipeline => {
      if (!pipelines.has(mode)) {
        const config = BLEND_MODES[mode];
        const pipeline = runner.track(
          runner.device.createRenderPipeline({
            vertexShader,
            fragmentShader,
            vertexLayout,
            primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
            layout: pipelineLayout,
            colorBlendState: config.colorBlendState,
            label: `Blend Pipeline (${mode})`,
          })
        );
        pipelines.set(mode, pipeline);
      }
      return pipelines.get(mode)!;
    };

    // 预创建所有管线
    Object.keys(BLEND_MODES).forEach((mode) => getOrCreatePipeline(mode));

    // 11. 创建模型矩阵
    const modelMatrix = new MMath.Matrix4();

    // 12. 创建 GUI
    const gui = new SimpleGUI();

    gui
      .add('blendMode', {
        value: params.blendMode,
        options: Object.keys(BLEND_MODES),
        onChange: (v) => {
          params.blendMode = v as string;
          // 更新描述显示
          const config = BLEND_MODES[params.blendMode];
          console.info(`${config.name}: ${config.description}`);
        },
      })
      .addSeparator('Options')
      .add('alpha', {
        value: params.alpha,
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          params.alpha = v as number;
        },
      })
      .add('showBackground', {
        value: params.showBackground,
        onChange: (v) => {
          params.showBackground = v as boolean;
        },
      })
      .add('animateColors', {
        value: params.animateColors,
        onChange: (v) => {
          params.animateColors = v as boolean;
        },
      });

    // 13. 设置键盘事件
    runner.onKey('Escape', () => {
      gui.destroy();
      stats.destroy();
      orbit.destroy();
      runner.destroy();
    });

    runner.onKey('F11', (_, event) => {
      event.preventDefault();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        runner.canvas.requestFullscreen();
      }
    });

    // 数字键切换混合模式
    const modeKeys = ['1', '2', '3', '4', '5', '6', '7'];
    const modeNames = Object.keys(BLEND_MODES);
    modeKeys.forEach((key, index) => {
      if (index < modeNames.length) {
        runner.onKey(key, () => {
          params.blendMode = modeNames[index];
          gui.set('blendMode', params.blendMode);
          // const config = BLEND_MODES[params.blendMode];
          // console.log(`${config.name}: ${config.description}`);
        });
      }
    });

    // 14. 渲染函数
    const drawTriangle = (
      renderPass: MSpec.IRHIRenderPass,
      offsetX: number,
      offsetY: number,
      scale: number,
      color: [number, number, number, number]
    ): void => {
      // 更新 Vertex Uniform
      const vertexData = new Float32Array([
        offsetX,
        offsetY, // uOffset
        scale,
        0, // uScale + padding
      ]);
      vertexUniformBuffer.update(vertexData, 0);

      // 更新 Color Uniform
      const colorData = new Float32Array([
        color[0],
        color[1],
        color[2],
        color[3], // uColor
      ]);
      colorBuffer.update(colorData, 0);

      renderPass.setPipeline(getOrCreatePipeline(params.blendMode));
      renderPass.setBindGroup(0, bindGroup);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.draw(3);
    };

    // 15. 启动渲染循环
    let time = 0;

    runner.start((dt) => {
      orbit.update(dt);

      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      const transformData = new Float32Array(64);
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformBuffer.update(transformData, 0);

      stats.begin();

      time += dt;

      const { encoder, passDescriptor } = runner.beginFrame();
      const renderPass = encoder.beginRenderPass(passDescriptor);

      // 计算动画颜色
      const colorOffset = params.animateColors ? time * 0.5 : 0;

      // 绘制背景三角形（如果启用）
      if (params.showBackground) {
        // 白色背景三角形
        drawTriangle(renderPass, 0, 0, 0.8, [1.0, 1.0, 1.0, 1.0]);
      }

      // 绘制三个重叠的彩色三角形
      const triangles = [
        { offset: [-0.2, 0.1], color: [1.0, 0.2, 0.2] }, // 红色
        { offset: [0.2, 0.1], color: [0.2, 0.2, 1.0] }, // 蓝色
        { offset: [0, -0.2], color: [0.2, 1.0, 0.2] }, // 绿色
      ];

      triangles.forEach((tri, index) => {
        // 动画颜色变化
        const color = [...tri.color];
        if (params.animateColors) {
          const phase = colorOffset + (index * Math.PI * 2) / 3;
          color[0] = Math.max(0.2, Math.abs(Math.sin(phase)));
          color[1] = Math.max(0.2, Math.abs(Math.sin(phase + Math.PI / 3)));
          color[2] = Math.max(0.2, Math.abs(Math.sin(phase + (Math.PI * 2) / 3)));
        }

        drawTriangle(renderPass, tri.offset[0], tri.offset[1], 0.5, [color[0], color[1], color[2], params.alpha]);
      });

      renderPass.end();
      runner.endFrame(encoder);

      stats.end();
    });

    // 16. 显示帮助信息
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      '',
      '🖱️ 鼠标控制:',
      '• 左键拖拽: 旋转视角',
      '• 右键拖拽: 平移视角',
      '• 滚轮: 缩放视角',
      '• 中键拖拽: 平移视角',
      '',
      '混合模式 (1-7):',
      '1: none (无混合)',
      '2: alpha (Alpha混合)',
      '3: additive (加法混合)',
      '4: multiply (乘法混合)',
      '5: screen (屏幕混合)',
      '6: subtract (减法混合)',
      '7: premultiplied (预乘Alpha)',
    ]);

    // 17. 输出技术信息
    console.info('Blend Modes Demo');
    console.info('支持的混合模式:');
    Object.entries(BLEND_MODES).forEach(([, config], index) => {
      console.info(`  ${index + 1}. ${config.name}: ${config.description}`);
    });
  } catch (error) {
    console.error('Demo 初始化失败:', error);
    DemoRunner.showError(`Demo 初始化失败: ${(error as Error).message}`);
  }
}

// 启动 Demo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
