/**
 * primitive-types.ts
 * 图元拓扑类型 Demo
 *
 * 功能演示：
 * - 不同的图元拓扑类型
 * - POINT_LIST、LINE_LIST、LINE_STRIP、TRIANGLE_LIST、TRIANGLE_STRIP
 * - 通过 GUI 切换不同拓扑类型
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, SimpleGUI, OrbitController, Stats } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aColor;

out vec3 vColor;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

void main() {
  vColor = aColor;
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  gl_PointSize = 10.0; // 点的大小
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

in vec3 vColor;
out vec4 fragColor;

void main() {
  fragColor = vec4(vColor, 1.0);
}
`;

// ==================== 顶点数据生成 ====================

/**
 * 生成用于展示不同图元类型的顶点数据
 * 生成一个圆形排列的点
 */
function generateCircleVertices(count: number, radius: number): BufferSource {
  const data: number[] = [];
  const colors = [
    [1.0, 0.3, 0.3], // 红
    [1.0, 0.6, 0.2], // 橙
    [1.0, 1.0, 0.3], // 黄
    [0.3, 1.0, 0.3], // 绿
    [0.3, 1.0, 1.0], // 青
    [0.3, 0.3, 1.0], // 蓝
    [0.8, 0.3, 1.0], // 紫
    [1.0, 0.3, 0.8], // 粉
  ];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    // 位置
    data.push(x, y, 0);
    // 颜色
    const color = colors[i % colors.length];
    data.push(color[0], color[1], color[2]);
  }

  return new Float32Array(data);
}

// ==================== Demo 配置 ====================

interface DemoParams {
  primitiveType: string;
  vertexCount: number;
}

// 图元类型映射
const PRIMITIVE_MAP: Record<string, MSpec.RHIPrimitiveTopology> = {
  POINT_LIST: MSpec.RHIPrimitiveTopology.POINT_LIST,
  LINE_LIST: MSpec.RHIPrimitiveTopology.LINE_LIST,
  LINE_STRIP: MSpec.RHIPrimitiveTopology.LINE_STRIP,
  TRIANGLE_LIST: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
  TRIANGLE_STRIP: MSpec.RHIPrimitiveTopology.TRIANGLE_STRIP,
};

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '图元拓扑类型 Demo',
    clearColor: [0.08, 0.08, 0.12, 1.0],
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
      autoRotate: false,
      autoRotateSpeed: 0.5,
    });

    // 3. Demo 参数
    const params: DemoParams = {
      primitiveType: 'LINE_STRIP',
      vertexCount: 8,
    };

    // 4. 生成顶点数据
    let vertices = generateCircleVertices(params.vertexCount, 0.6);

    // 5. 创建顶点缓冲区
    let vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'dynamic',
        initialData: vertices as BufferSource,
        label: 'Primitive Vertex Buffer',
      })
    );

    // 6. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Primitive Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Primitive Fragment Shader',
      })
    );

    // 7. 顶点布局
    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0,
          stride: 24, // 6 floats * 4 bytes
          stepMode: 'vertex',
          attributes: [
            { name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 },
            { name: 'aColor', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 12, shaderLocation: 1 },
          ],
        },
      ],
    };

    // 8. 创建 Uniform 缓冲区和绑定组
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout(
        [
          {
            binding: 0,
            visibility: MSpec.RHIShaderStage.VERTEX,
            buffer: { type: 'uniform' },
            name: 'Transforms',
          },
        ],
        'BindGroup Layout'
      )
    );

    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [{ binding: 0, resource: transformBuffer }])
    );

    // 9. 创建管线布局
    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Primitive Pipeline Layout')
    );

    // 10. 创建管线缓存（用于不同图元类型）
    const pipelines: Map<string, MSpec.IRHIRenderPipeline> = new Map();

    const getOrCreatePipeline = (type: string): MSpec.IRHIRenderPipeline => {
      if (!pipelines.has(type)) {
        const pipeline = runner.track(
          runner.device.createRenderPipeline({
            vertexShader,
            fragmentShader,
            vertexLayout,
            primitiveTopology: PRIMITIVE_MAP[type],
            layout: pipelineLayout,
            label: `Primitive Pipeline (${type})`,
          })
        );
        pipelines.set(type, pipeline);
      }
      return pipelines.get(type)!;
    };

    // 预创建所有管线
    Object.keys(PRIMITIVE_MAP).forEach((type) => getOrCreatePipeline(type));

    // 11. 创建 GUI
    const gui = new SimpleGUI();

    gui
      .add('primitiveType', {
        value: params.primitiveType,
        options: Object.keys(PRIMITIVE_MAP),
        onChange: (v) => {
          params.primitiveType = v as string;
        },
      })
      .addSeparator('Vertices')
      .add('vertexCount', {
        value: params.vertexCount,
        min: 3,
        max: 16,
        step: 1,
        onChange: (v) => {
          params.vertexCount = v as number;
          // 重新生成顶点数据
          vertices = generateCircleVertices(params.vertexCount, 0.6);
          // 更新缓冲区
          if (vertices.byteLength <= vertexBuffer.size) {
            vertexBuffer.update(vertices as BufferSource, 0);
          } else {
            // 需要重新创建更大的缓冲区
            vertexBuffer.destroy();
            vertexBuffer = runner.track(
              runner.device.createBuffer({
                size: vertices.byteLength,
                usage: MSpec.RHIBufferUsage.VERTEX,
                hint: 'dynamic',
                initialData: vertices as BufferSource,
                label: 'Primitive Vertex Buffer',
              })
            );
          }
        },
      });

    // 12. 设置键盘事件
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

    // 数字键切换图元类型
    const typeKeys = ['1', '2', '3', '4', '5'];
    const typeNames = Object.keys(PRIMITIVE_MAP);
    typeKeys.forEach((key, index) => {
      if (index < typeNames.length) {
        runner.onKey(key, () => {
          params.primitiveType = typeNames[index];
          gui.set('primitiveType', params.primitiveType);
        });
      }
    });

    // 13. 创建模型矩阵
    const modelMatrix = new MMath.Matrix4();

    // 14. 预分配渲染循环中使用的数组
    const transformData = new Float32Array(64);

    // 15. 启动渲染循环
    runner.start((dt) => {
      orbit.update(dt);

      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      // 更新 Transform Uniform（使用预分配数组）
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformBuffer.update(transformData, 0);

      stats.begin();

      const { encoder, passDescriptor } = runner.beginFrame();

      const renderPass = encoder.beginRenderPass(passDescriptor);
      renderPass.setPipeline(getOrCreatePipeline(params.primitiveType));
      renderPass.setBindGroup(0, bindGroup);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.draw(params.vertexCount);
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
      '数字键切换图元类型:',
      '1: POINT_LIST (点)',
      '2: LINE_LIST (线段)',
      '3: LINE_STRIP (线带)',
      '4: TRIANGLE_LIST (三角形)',
      '5: TRIANGLE_STRIP (三角带)',
    ]);

    // 17. 输出技术信息
    console.info('🎯 Primitive Types Demo');
    console.info('支持的图元类型:');
    Object.keys(PRIMITIVE_MAP).forEach((type, index) => {
      console.info(`  ${index + 1}. ${type}`);
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
