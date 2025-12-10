/**
 * viewport-scissor.ts
 * 视口和裁剪 Demo
 *
 * 功能演示：
 * - setViewport API（设置渲染视口）
 * - setScissorRect API（设置裁剪矩形）
 * - 多视口分屏渲染
 * - 裁剪效果演示
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, SimpleGUI, OrbitController, Stats } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aColor;

uniform float uRotation;
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec3 vColor;

void main() {
  // 旋转变换
  float c = cos(uRotation);
  float s = sin(uRotation);
  mat2 rotation = mat2(c, -s, s, c);
  vec2 rotatedPos = rotation * aPosition.xy;

  vColor = aColor;
  vec4 worldPosition = uModelMatrix * vec4(rotatedPos, aPosition.z, 1.0);
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

// ==================== Demo 配置 ====================

interface DemoParams {
  mode: string;
  scissorEnabled: boolean;
  scissorX: number;
  scissorY: number;
  scissorWidth: number;
  scissorHeight: number;
  rotationSpeed: number;
}

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '视口和裁剪 Demo',
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
      autoRotate: false,
      autoRotateSpeed: 0.5,
    });

    // 3. Demo 参数
    const params: DemoParams = {
      mode: 'quad-viewport',
      scissorEnabled: true,
      scissorX: 0.1,
      scissorY: 0.1,
      scissorWidth: 0.8,
      scissorHeight: 0.8,
      rotationSpeed: 1.0,
    };

    // 4. 生成几何体
    const triangle = GeometryGenerator.triangle({ colors: true });

    // 5. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: triangle.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: triangle.vertices as BufferSource,
        label: 'Viewport Triangle Vertex Buffer',
      })
    );

    // 6. 创建 Uniform 缓冲区（旋转角度）
    const uniformBuffer = runner.track(
      runner.device.createBuffer({
        size: 16, // 对齐到 16 字节
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Rotation Uniform Buffer',
      })
    );

    // 7. 创建变换矩阵 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // 8. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Viewport Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Viewport Fragment Shader',
      })
    );

    // 9. 创建绑定组
    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout(
        [
          {
            binding: 0,
            visibility: MSpec.RHIShaderStage.VERTEX,
            buffer: { type: 'uniform' },
            name: 'uRotation',
          },
          {
            binding: 1,
            visibility: MSpec.RHIShaderStage.VERTEX,
            buffer: { type: 'uniform' },
            name: 'Transforms',
          },
        ],
        'Viewport BindGroup Layout'
      )
    );

    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: uniformBuffer },
        { binding: 1, resource: transformBuffer },
      ])
    );

    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Viewport Pipeline Layout')
    );

    // 10. 创建管线
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout: triangle.layout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Viewport Render Pipeline',
      })
    );

    // 11. 创建 GUI
    const gui = new SimpleGUI();

    gui
      .add('mode', {
        value: params.mode,
        options: ['single', 'quad-viewport', 'scissor-demo'],
        onChange: (v) => {
          params.mode = v as string;
        },
      })
      .addSeparator('Scissor Settings')
      .add('scissorEnabled', {
        value: params.scissorEnabled,
        onChange: (v) => {
          params.scissorEnabled = v as boolean;
        },
      })
      .add('scissorX', {
        value: params.scissorX,
        min: 0,
        max: 0.5,
        step: 0.05,
        onChange: (v) => {
          params.scissorX = v as number;
        },
      })
      .add('scissorY', {
        value: params.scissorY,
        min: 0,
        max: 0.5,
        step: 0.05,
        onChange: (v) => {
          params.scissorY = v as number;
        },
      })
      .add('scissorWidth', {
        value: params.scissorWidth,
        min: 0.2,
        max: 1.0,
        step: 0.05,
        onChange: (v) => {
          params.scissorWidth = v as number;
        },
      })
      .add('scissorHeight', {
        value: params.scissorHeight,
        min: 0.2,
        max: 1.0,
        step: 0.05,
        onChange: (v) => {
          params.scissorHeight = v as number;
        },
      })
      .addSeparator('Animation')
      .add('rotationSpeed', {
        value: params.rotationSpeed,
        min: 0,
        max: 3,
        step: 0.1,
        onChange: (v) => {
          params.rotationSpeed = v as number;
        },
      });

    // 12. 动画状态
    let rotation = 0;

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

    // 模式切换快捷键
    runner.onKey('1', () => {
      params.mode = 'single';
      gui.set('mode', 'single');
    });
    runner.onKey('2', () => {
      params.mode = 'quad-viewport';
      gui.set('mode', 'quad-viewport');
    });
    runner.onKey('3', () => {
      params.mode = 'scissor-demo';
      gui.set('mode', 'scissor-demo');
    });

    // 14. 创建模型矩阵
    const modelMatrix = new MMath.Matrix4();

    // 15. 渲染函数
    const renderTriangle = (renderPass: MSpec.IRHIRenderPass, rotationAngle: number): void => {
      // 更新 Uniform
      const uniformData = new Float32Array([rotationAngle, 0, 0, 0]);
      uniformBuffer.update(uniformData, 0);

      renderPass.setPipeline(pipeline);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.draw(triangle.vertexCount);
    };

    // 16. 启动渲染循环
    runner.start((dt) => {
      orbit.update(dt);

      // 更新旋转
      rotation += params.rotationSpeed * dt;

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

      const w = runner.width;
      const h = runner.height;

      if (params.mode === 'single') {
        // 单视口模式
        renderPass.setViewport(0, 0, w, h, 0, 1);
        if (params.scissorEnabled) {
          const sx = Math.floor(params.scissorX * w);
          const sy = Math.floor(params.scissorY * h);
          const sw = Math.floor(params.scissorWidth * w);
          const sh = Math.floor(params.scissorHeight * h);
          renderPass.setScissorRect(sx, sy, sw, sh);
        }
        renderTriangle(renderPass, rotation);
      } else if (params.mode === 'quad-viewport') {
        // 四分屏视口模式
        const hw = Math.floor(w / 2);
        const hh = Math.floor(h / 2);
        const viewports = [
          { x: 0, y: hh, rotation: rotation }, // 左上
          { x: hw, y: hh, rotation: rotation + Math.PI / 2 }, // 右上
          { x: 0, y: 0, rotation: rotation + Math.PI }, // 左下
          { x: hw, y: 0, rotation: rotation + (Math.PI * 3) / 2 }, // 右下
        ];

        for (const vp of viewports) {
          renderPass.setViewport(vp.x, vp.y, hw, hh, 0, 1);
          renderPass.setScissorRect(vp.x, vp.y, hw, hh);
          renderTriangle(renderPass, vp.rotation);
        }
      } else if (params.mode === 'scissor-demo') {
        // 裁剪演示模式
        renderPass.setViewport(0, 0, w, h, 0, 1);

        // 动态裁剪区域
        const time = Date.now() * 0.001;
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = Math.min(w, h) * 0.3;

        // 计算动态裁剪矩形（围绕中心旋转）
        const sx = Math.floor(centerX + Math.cos(time) * radius - 100);
        const sy = Math.floor(centerY + Math.sin(time) * radius - 100);
        const sw = 200;
        const sh = 200;

        renderPass.setScissorRect(sx, sy, sw, sh);
        renderTriangle(renderPass, rotation);
      }

      renderPass.end();
      runner.endFrame(encoder);

      stats.end();
    });

    // 17. 显示帮助信息
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
      '模式切换:',
      '1: 单视口 (Scissor)',
      '2: 四分屏视口',
      '3: 裁剪动画演示',
    ]);

    // 18. 输出技术信息
    console.info('📐 Viewport & Scissor Demo');
    console.info('API 演示:');
    console.info('  • setViewport(x, y, w, h, minDepth, maxDepth)');
    console.info('  • setScissorRect(x, y, w, h)');
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
