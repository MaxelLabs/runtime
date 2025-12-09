/**
 * triangle.ts
 * 最简单的三角形渲染 Demo
 * 使用 DemoRunner 和 GeometryGenerator 工具库
 */

import { MSpec } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aColor;

out vec3 vColor;

void main() {
  vColor = aColor;
  gl_Position = vec4(aPosition, 1.0);
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

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '三角形渲染 Demo',
    clearColor: [0.1, 0.1, 0.1, 1.0],
  });

  try {
    // 2. 初始化
    await runner.init();

    // 3. 生成三角形几何体
    const geometry = GeometryGenerator.triangle({ colors: true });

    // 4. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: geometry.vertices as BufferSource,
        label: 'Triangle Vertex Buffer',
      })
    );

    // 5. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Triangle Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Triangle Fragment Shader',
      })
    );

    // 6. 创建管线
    const bindGroupLayout = runner.track(runner.device.createBindGroupLayout([], 'Triangle BindGroup Layout'));

    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Triangle Pipeline Layout')
    );

    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout: geometry.layout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Triangle Render Pipeline',
      })
    );

    // 7. 设置键盘事件
    runner.onKey('Escape', () => {
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

    // 8. 启动渲染循环
    runner.start(() => {
      const { encoder, passDescriptor } = runner.beginFrame();

      const renderPass = encoder.beginRenderPass(passDescriptor);
      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.draw(geometry.vertexCount);
      renderPass.end();

      runner.endFrame(encoder);
    });

    // 9. 显示帮助
    DemoRunner.showHelp(['ESC: 退出 Demo', 'F11: 切换全屏']);
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
