/**
 * quad-indexed.ts
 * 索引缓冲区绘制 Demo
 *
 * 功能演示：
 * - 索引缓冲区的创建和使用
 * - drawIndexed API
 * - 顶点复用（4个顶点绘制2个三角形）
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

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
    name: '索引缓冲区绘制 Demo',
    clearColor: [0.1, 0.1, 0.15, 1.0],
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

    // 3. 生成四边形几何体（使用索引绘制）
    const geometry = GeometryGenerator.quad({ colors: true });

    // 4. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: geometry.vertices as BufferSource,
        label: 'Quad Vertex Buffer',
      })
    );

    // 5. 创建索引缓冲区
    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: geometry.indices as BufferSource,
        label: 'Quad Index Buffer',
      })
    );

    // 6. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Quad Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Quad Fragment Shader',
      })
    );

    // 7. 创建 Uniform 缓冲区和绑定组
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

    // 8. 创建管线
    const pipelineLayout = runner.track(runner.device.createPipelineLayout([bindGroupLayout], 'Quad Pipeline Layout'));

    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout: geometry.layout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Quad Render Pipeline',
      })
    );

    // 9. 设置键盘事件
    runner.onKey('Escape', () => {
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

    // 10. 创建模型矩阵
    const modelMatrix = new MMath.Matrix4();

    // 11. 启动渲染循环
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

      const { encoder, passDescriptor } = runner.beginFrame();

      const renderPass = encoder.beginRenderPass(passDescriptor);
      renderPass.setPipeline(pipeline);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
      renderPass.drawIndexed(geometry.indexCount!);
      renderPass.end();

      runner.endFrame(encoder);

      stats.end();
    });

    // 12. 显示帮助信息
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
      '索引缓冲区说明:',
      '• 4个顶点，6个索引',
      '• 顶点复用减少内存',
      '• drawIndexed 绘制',
    ]);

    // 13. 输出技术信息
    console.info('📐 Quad Indexed Demo');
    console.info(`  顶点数: ${geometry.vertexCount}`);
    console.info(`  索引数: ${geometry.indexCount}`);
    console.info(`  索引格式: UINT16`);
    console.info(`  顶点缓冲区大小: ${geometry.vertices.byteLength} bytes`);
    console.info(`  索引缓冲区大小: ${geometry.indices!.byteLength} bytes`);
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
