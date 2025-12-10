/**
 * colored-triangle.ts
 * 顶点颜色插值演示 Demo
 * 展示顶点颜色在光栅化过程中的平滑插值效果
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec3 aColor;

// Uniform 块
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

// 传递给片段着色器的变量
out vec3 vColor;
out vec3 vPosition;

void main() {
  vColor = aColor;
  vPosition = aPosition;

  // MVP 变换
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

// 从顶点着色器接收的插值数据
in vec3 vColor;
in vec3 vPosition;

out vec4 fragColor;

void main() {
  // 直接使用插值后的颜色
  fragColor = vec4(vColor, 1.0);

  // 可选：添加位置相关的效果
  // float intensity = 0.8 + 0.2 * sin(vPosition.y * 10.0);
  // fragColor *= intensity;
}
`;

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '顶点颜色插值 Demo',
    clearColor: [0.05, 0.05, 0.05, 1.0],
  });

  try {
    // 2. 初始化
    await runner.init();

    // 3. 创建性能统计
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });

    // 4. 创建轨道控制器
    const orbit = new OrbitController(runner.canvas, {
      distance: 2,
      target: [0, 0, 0],
      enableDamping: true,
      autoRotate: true, // 自动旋转以便更好地观察颜色插值
      autoRotateSpeed: 0.3,
    });

    // 5. 生成三角形几何体，默认使用鲜艳的三原色
    const geometry = GeometryGenerator.triangle({ colors: true });

    // 6. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: geometry.vertices as BufferSource,
        label: 'Colored Triangle Vertex Buffer',
      })
    );

    // 7. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Colored Triangle Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Colored Triangle Fragment Shader',
      })
    );

    // 8. 创建 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256, // std140 对齐
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // 9. 创建绑定组布局
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
        'Colored Triangle BindGroup Layout'
      )
    );

    // 10. 创建绑定组
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [{ binding: 0, resource: transformBuffer }])
    );

    // 11. 创建管线布局
    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Colored Triangle Pipeline Layout')
    );

    // 12. 创建管线
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout: geometry.layout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Colored Triangle Render Pipeline',
      })
    );

    // 13. 模型矩阵（可以添加动画）
    const modelMatrix = new MMath.Matrix4();
    let rotation = 0;

    // 14. 设置键盘事件
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

    runner.onKey(' ', () => {
      // 空格键切换自动旋转
      orbit.autoRotate = !orbit.autoRotate;
    });

    // 15. 启动渲染循环
    runner.start((dt) => {
      // 更新轨道控制器
      orbit.update(dt);

      // 可选：添加额外的旋转动画
      if (!orbit.autoRotate) {
        rotation += dt * 0.5;
        modelMatrix.fromRotation(rotation, [0, 1, 0]);
      }

      // 获取视图和投影矩阵
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      // 更新 Transform Uniform
      const transformData = new Float32Array(64);
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformBuffer.update(transformData, 0);

      // 开始性能统计
      stats.begin();
      const { encoder, passDescriptor } = runner.beginFrame();

      const renderPass = encoder.beginRenderPass(passDescriptor);
      renderPass.setPipeline(pipeline);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.draw(geometry.vertexCount);
      renderPass.end();

      runner.endFrame(encoder);

      // 结束性能统计
      stats.end();
    });

    // 16. 显示帮助
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      '空格: 切换自动旋转',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
      '',
      '💡 观察三角形内部的颜色渐变',
      '这是顶点颜色在光栅化过程中的插值效果',
    ]);
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
