/**
 * dynamic-buffer.ts
 * 缓冲区动态更新演示 Demo
 * 展示使用 DYNAMIC_DRAW hint 更新顶点缓冲区的波浪动画效果
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec3 aNormal;
in vec3 aColor;

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
  vNormal = aNormal;
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
in vec3 vNormal;
in vec3 vPosition;

out vec4 fragColor;

void main() {
  // 简单的 Phong 光照
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float diffuse = max(dot(normalize(vNormal), lightDir), 0.3);

  // 结合颜色和光照
  fragColor = vec4(vColor * diffuse, 1.0);
}
`;

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '缓冲区动态更新 Demo',
    clearColor: [0.05, 0.05, 0.05, 1.0],
  });

  try {
    // 2. 初始化
    await runner.init();

    // 3. 创建性能统计
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });

    // 4. 创建轨道控制器
    const orbit = new OrbitController(runner.canvas, {
      distance: 6,
      target: [0, 0, 0],
      enableDamping: true,
      autoRotate: false,
      autoRotateSpeed: 0.3,
    });

    // 5. 生成平面几何体，使用高分段数便于波浪效果
    const geometry = GeometryGenerator.plane({
      width: 4,
      height: 4,
      widthSegments: 32,
      heightSegments: 32,
      colors: true,
      normals: true,
    });

    // 6. 创建动态顶点缓冲区（关键：使用 'dynamic' hint）
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'dynamic', // 使用 DYNAMIC_DRAW，适合频繁更新
        initialData: geometry.vertices as BufferSource,
        label: 'Dynamic Vertex Buffer',
      })
    );

    // 7. 创建索引缓冲区
    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.indices!.byteLength,
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
        label: 'Dynamic Buffer Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Dynamic Buffer Fragment Shader',
      })
    );

    // 9. 创建 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256, // std140 对齐
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // 10. 创建绑定组布局
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
        'Dynamic Buffer BindGroup Layout'
      )
    );

    // 11. 创建绑定组
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [{ binding: 0, resource: transformBuffer }])
    );

    // 12. 创建管线布局
    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Dynamic Buffer Pipeline Layout')
    );

    // 13. 创建管线
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout: geometry.layout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Dynamic Buffer Render Pipeline',
      })
    );

    // 14. 提取原始顶点位置数据用于波浪计算
    const floatsPerVertex = 9; // 3(pos) + 3(normal) + 3(color)
    const originalPositions = new Float32Array(geometry.vertices);
    const dynamicPositions = new Float32Array(geometry.vertices);

    // 15. 模型矩阵
    const modelMatrix = new MMath.Matrix4();

    // 16. 波浪参数
    let time = 0;
    const waveAmplitude = 0.3;
    const waveFrequencyX = 2.0;
    const waveFrequencyZ = 2.0;
    const waveSpeed = 1.0;

    // 17. 设置键盘事件
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

    // 18. 启动渲染循环
    runner.start((dt) => {
      // 更新轨道控制器
      orbit.update(dt);

      // 更新时间
      time += dt * waveSpeed;

      // 更新顶点位置（波浪效果）
      for (let i = 0; i < geometry.vertexCount; i++) {
        // 从原始数据读取位置
        const origX = originalPositions[i * floatsPerVertex];
        const origZ = originalPositions[i * floatsPerVertex + 2];

        // 计算波浪高度
        const waveX = Math.sin(origX * waveFrequencyX + time) * Math.cos(origZ * waveFrequencyZ + time);
        const waveZ = Math.cos(origX * waveFrequencyX + time) * Math.sin(origZ * waveFrequencyZ + time);
        const height = (waveX + waveZ) * 0.5 * waveAmplitude;

        // 复制原始数据到动态数据
        dynamicPositions[i * floatsPerVertex] = origX;
        dynamicPositions[i * floatsPerVertex + 1] = height;
        dynamicPositions[i * floatsPerVertex + 2] = origZ;

        // 保持法线和颜色不变
        dynamicPositions[i * floatsPerVertex + 3] = originalPositions[i * floatsPerVertex + 3];
        dynamicPositions[i * floatsPerVertex + 4] = originalPositions[i * floatsPerVertex + 4];
        dynamicPositions[i * floatsPerVertex + 5] = originalPositions[i * floatsPerVertex + 5];
        dynamicPositions[i * floatsPerVertex + 6] = originalPositions[i * floatsPerVertex + 6];
        dynamicPositions[i * floatsPerVertex + 7] = originalPositions[i * floatsPerVertex + 7];
        dynamicPositions[i * floatsPerVertex + 8] = originalPositions[i * floatsPerVertex + 8];
      }

      // 部分更新缓冲区（使用 bufferSubData，性能更优）
      vertexBuffer.update(dynamicPositions, 0);

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
      renderPass.setIndexBuffer(indexBuffer, 'uint16');
      renderPass.drawIndexed(geometry.indexCount!);
      renderPass.end();

      runner.endFrame(encoder);

      // 结束性能统计
      stats.end();
    });

    // 19. 显示帮助
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      '空格: 切换自动旋转',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
      '',
      '💡 观察平面的波浪动画效果',
      '这是通过每帧动态更新顶点位置实现的',
      '使用 hint: "dynamic" 的缓冲区性能优化',
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
