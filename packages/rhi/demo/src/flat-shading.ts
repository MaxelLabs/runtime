/**
 * flat-shading.ts
 * 平面着色 Demo
 *
 * 核心演示:
 * - 使用 `flat` 关键字禁用法线插值，实现平面着色效果。
 * - Lambertian 漫反射光照模型。
 * - Uniform Buffer Object (UBO) 的使用。
 * - std140 内存布局规则。
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, OrbitController, SimpleGUI, Stats } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec3 aNormal;

// Uniform 块 (std140)
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

// 输出到片元着色器 (使用 flat 关键字)
flat out vec3 vNormal;

void main() {
  // 法线转换到世界空间
  vNormal = mat3(uNormalMatrix) * aNormal;
  // 计算裁剪空间坐标
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

// 输入 (flat 表示不进行插值)
flat in vec3 vNormal;

// Uniform 块 (std140)
uniform Lighting {
  vec3 uLightDirection; // 16 bytes
  vec3 uAmbientColor;   // 16 bytes
};

// 输出
out vec4 fragColor;

void main() {
  // 法线归一化
  vec3 normal = normalize(vNormal);

  // 光照方向（已归一化）
  vec3 lightDir = normalize(uLightDirection);

  // Lambert 漫反射
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * vec3(1.0); // 使用白色光源

  // 最终颜色 = 环境光 + 漫反射
  vec3 finalColor = uAmbientColor + diffuse;

  // 输出最终颜色，并应用 gamma 校正（近似）
  fragColor = vec4(pow(finalColor, vec3(1.0/2.2)), 1.0);
}
`;

// ==================== Demo 配置 ====================

interface DemoParams {
  lightX: number;
  lightY: number;
  lightZ: number;
  ambientIntensity: number;
}

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '平面着色 (Flat Shading)',
    clearColor: [0.1, 0.1, 0.1, 1.0],
  });

  try {
    // 2. 初始化
    await runner.init();

    // 3. 创建性能统计
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });

    // 4. 创建相机控制器
    const orbit = new OrbitController(runner.canvas, {
      distance: 4,
      enableDamping: true,
    });

    // 5. Demo 参数
    const params: DemoParams = {
      lightX: 1.0,
      lightY: 1.0,
      lightZ: 1.0,
      ambientIntensity: 0.2,
    };

    // 6. 生成球体几何体
    const geometry = GeometryGenerator.sphere({
      radius: 1,
      normals: true,
      uvs: false,
    });

    // 7. 创建顶点缓冲区和索引缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: geometry.vertices as BufferSource,
        label: 'Sphere Vertex Buffer',
      })
    );
    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: geometry.indices as BufferSource,
        label: 'Sphere Index Buffer',
      })
    );

    // 8. 创建 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256, // 4 * mat4
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // Lighting uniform: vec3(16) + vec3(16) = 32 bytes
    const lightingBuffer = runner.track(
      runner.device.createBuffer({
        size: 32,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Lighting Uniform Buffer',
      })
    );

    // 9. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
      })
    );
    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
      })
    );

    // 10. 创建绑定组布局
    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout(
        [
          { binding: 0, visibility: MSpec.RHIShaderStage.VERTEX, buffer: { type: 'uniform' }, name: 'Transforms' },
          { binding: 1, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'Lighting' },
        ],
        'FlatShading BindGroup Layout'
      )
    );

    // 11. 创建绑定组
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: transformBuffer },
        { binding: 1, resource: lightingBuffer },
      ])
    );

    // 12. 创建管线
    const pipelineLayout = runner.track(runner.device.createPipelineLayout([bindGroupLayout]));
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout: geometry.layout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        depthStencilState: {
          format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
          depthWriteEnabled: true,
          depthCompare: MSpec.RHICompareFunction.LESS,
        },
        label: 'FlatShading Render Pipeline',
      })
    );

    // 13. 创建 GUI
    const gui = new SimpleGUI();
    gui
      .add('lightX', {
        value: params.lightX,
        min: -5,
        max: 5,
        step: 0.1,
        onChange: (v) => (params.lightX = v as number),
      })
      .add('lightY', {
        value: params.lightY,
        min: -5,
        max: 5,
        step: 0.1,
        onChange: (v) => (params.lightY = v as number),
      })
      .add('lightZ', {
        value: params.lightZ,
        min: -5,
        max: 5,
        step: 0.1,
        onChange: (v) => (params.lightZ = v as number),
      })
      .addSeparator('Material')
      .add('ambientIntensity', {
        value: params.ambientIntensity,
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => (params.ambientIntensity = v as number),
      });

    // 14. 矩阵
    const modelMatrix = new MMath.Matrix4();
    const normalMatrix = new MMath.Matrix4();

    // 15. 键盘事件
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

    runner.onKey('r', () => {
      orbit.reset();
    });

    // 16. 预分配渲染循环中使用的数组
    const transformData = new Float32Array(64); // 4 * mat4
    const lightingData = new Float32Array(8); // 32 bytes
    const lightDir = new MMath.Vector3();

    // 17. 启动渲染循环
    runner.start((dt) => {
      stats.begin();
      orbit.update(dt);

      // 更新模型矩阵 (这里我们让它静止)
      modelMatrix.identity();

      // 更新法线矩阵
      normalMatrix.copyFrom(modelMatrix).invert().transpose();

      // 更新 Transform Uniform（使用预分配数组）
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(orbit.getViewMatrix(), 16);
      transformData.set(orbit.getProjectionMatrix(runner.width / runner.height), 32);
      transformData.set(normalMatrix.toArray(), 48);
      transformBuffer.update(transformData, 0);

      // 更新 Lighting Uniform (std140)（使用预分配数组）
      lightDir.set(params.lightX, params.lightY, params.lightZ).normalize();
      lightingData.set([lightDir.x, lightDir.y, lightDir.z], 0);
      lightingData.set([params.ambientIntensity, params.ambientIntensity, params.ambientIntensity], 4);
      lightingBuffer.update(lightingData, 0);

      // 开始渲染
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

    // 17. 显示帮助
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      'R: 重置相机',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
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
