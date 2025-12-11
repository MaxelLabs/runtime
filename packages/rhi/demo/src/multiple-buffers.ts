/**
 * multiple-buffers.ts
 * 多顶点缓冲区演示 Demo
 * 展示将位置、颜色、法线分离到不同缓冲区的技术
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, OrbitController, Stats } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

// 来自不同缓冲区的顶点属性
layout(location = 0) in vec3 aPosition;  // 来自 buffer 0
layout(location = 1) in vec3 aColor;     // 来自 buffer 1
layout(location = 2) in vec3 aNormal;    // 来自 buffer 2

// Uniform 块
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

// 传递给片段着色器的变量
out vec3 vColor;
out vec3 vNormal;
out vec3 vPosition;

void main() {
  vColor = aColor;
  vPosition = aPosition;
  vNormal = mat3(uModelMatrix) * aNormal;

  // MVP 变换
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

// 从顶点着色器接收的插值数据
in vec3 vColor;
in vec3 vNormal;
in vec3 vPosition;

out vec4 fragColor;

void main() {
  // 使用插值颜色作为基础
  vec3 color = vColor;

  // 简单的面光照：基于法线方向
  vec3 normalizedNormal = normalize(vNormal);
  float intensity = 0.6 + 0.4 * max(0.0, dot(normalizedNormal, vec3(0.0, 1.0, 0.0)));

  fragColor = vec4(color * intensity, 1.0);
}
`;

// ==================== 顶点数据生成 ====================

/**
 * 生成四面体（金字塔）的顶点数据
 * 分离为位置、颜色、法线三个数组
 */
function generateTetrahedronData() {
  // 四面体顶点位置
  const positions = [
    // 底面三角形
    -0.5, -0.4, 0.5, 0.5, -0.4, 0.5, 0.0, -0.4, -0.5,
    // 顶点
    0.0, 0.5, 0.0,
  ];

  // 颜色数据（每个顶点一个颜色）
  const colors = [
    1.0,
    0.2,
    0.2, // 红色
    0.2,
    1.0,
    0.2, // 绿色
    0.2,
    0.2,
    1.0, // 蓝色
    1.0,
    1.0,
    0.2, // 黄色
  ];

  // 法线数据（每个顶点的法线）
  const normals = [
    -0.707,
    -0.707,
    0.0, // 底面左顶点的法线
    0.707,
    -0.707,
    0.0, // 底面右顶点的法线
    0.0,
    -0.707,
    -0.707, // 底面后顶点的法线
    0.0,
    0.707,
    0.0, // 顶点的法线
  ];

  // 面索引（定义如何组成三角形）
  const indices = [
    // 底面
    0, 1, 2,
    // 前面
    0, 3, 1,
    // 左面
    0, 2, 3,
    // 右面
    1, 3, 2,
  ];

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    vertexCount: 4,
    indexCount: indices.length,
  };
}

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '多顶点缓冲区 Demo',
    clearColor: [0.05, 0.05, 0.05, 1.0],
  });

  try {
    // 2. 初始化
    await runner.init();

    // 3. 创建性能统计
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });

    // 4. 创建轨道控制器
    const orbit = new OrbitController(runner.canvas, {
      distance: 2.5,
      target: [0, 0, 0],
      enableDamping: true,
      autoRotate: true,
      autoRotateSpeed: 0.4,
    });

    // 5. 生成几何体数据
    const geometry = generateTetrahedronData();

    // 6. 创建三个独立的顶点缓冲区
    const positionBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.positions.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: geometry.positions as BufferSource,
        label: 'Position Buffer',
      })
    );

    const colorBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.colors.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: geometry.colors as BufferSource,
        label: 'Color Buffer',
      })
    );

    const normalBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.normals.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: geometry.normals as BufferSource,
        label: 'Normal Buffer',
      })
    );

    // 7. 创建索引缓冲区
    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.indices.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: geometry.indices as BufferSource,
        label: 'Index Buffer',
      })
    );

    // 8. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Multiple Buffers Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Multiple Buffers Fragment Shader',
      })
    );

    // 9. 创建顶点布局（多缓冲区配置）
    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0, // 位置缓冲区
          stride: 12, // 3 * 4 bytes
          stepMode: 'vertex',
          attributes: [
            {
              name: 'aPosition',
              format: MSpec.RHIVertexFormat.FLOAT32x3,
              offset: 0,
              shaderLocation: 0,
            },
          ],
        },
        {
          index: 1, // 颜色缓冲区
          stride: 12, // 3 * 4 bytes
          stepMode: 'vertex',
          attributes: [
            {
              name: 'aColor',
              format: MSpec.RHIVertexFormat.FLOAT32x3,
              offset: 0,
              shaderLocation: 1,
            },
          ],
        },
        {
          index: 2, // 法线缓冲区
          stride: 12, // 3 * 4 bytes
          stepMode: 'vertex',
          attributes: [
            {
              name: 'aNormal',
              format: MSpec.RHIVertexFormat.FLOAT32x3,
              offset: 0,
              shaderLocation: 2,
            },
          ],
        },
      ],
    };

    // 10. 创建 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256, // std140 对齐
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // 11. 创建绑定组布局
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
        'Multiple Buffers BindGroup Layout'
      )
    );

    // 12. 创建绑定组
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [{ binding: 0, resource: transformBuffer }])
    );

    // 13. 创建管线布局
    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Multiple Buffers Pipeline Layout')
    );

    // 14. 创建渲染管线
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Multiple Buffers Render Pipeline',
      })
    );

    // 15. 模型矩阵
    const modelMatrix = new MMath.Matrix4();

    // 16. 设置键盘事件
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

    // 自动旋转状态追踪
    let autoRotateEnabled = true;

    runner.onKey(' ', () => {
      // 空格键切换自动旋转
      autoRotateEnabled = !autoRotateEnabled;
      orbit.setAutoRotate(autoRotateEnabled);
    });

    // 17. 启动渲染循环
    runner.start((dt) => {
      // 更新轨道控制器
      orbit.update(dt);

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

      // 绑定三个顶点缓冲区到不同的槽位
      renderPass.setVertexBuffer(0, positionBuffer);
      renderPass.setVertexBuffer(1, colorBuffer);
      renderPass.setVertexBuffer(2, normalBuffer);

      // 绑定索引缓冲区
      renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);

      // 使用索引缓冲区进行绘制
      renderPass.drawIndexed(geometry.indexCount);
      renderPass.end();

      runner.endFrame(encoder);

      // 结束性能统计
      stats.end();
    });

    // 18. 显示帮助
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      '空格: 切换自动旋转',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
      '',
      '💡 这个 Demo 展示了多顶点缓冲区的使用方法',
      '位置、颜色和法线分别存储在不同的缓冲区中',
      '通过 setVertexBuffer(slot, buffer) 绑定到不同的槽位',
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
