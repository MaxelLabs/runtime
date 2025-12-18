/**
 * texture-wrapping.ts
 * 纹理包裹模式演示 Demo
 *
 * 功能演示：
 * - REPEAT: 重复平铺纹理
 * - MIRROR_REPEAT: 镜像重复纹理
 * - CLAMP_TO_EDGE: 钳制到边缘像素
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, OrbitController, Stats, GeometryGenerator, ProceduralTexture, SimpleGUI } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec2 vTexCoord;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vTexCoord = aTexCoord;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform sampler2D uTexture;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  fragColor = texColor;
}
`;

// ==================== 包裹模式配置 ====================

interface WrappingConfig {
  name: string;
  description: string;
  mode: MSpec.RHIAddressMode;
}

const WRAPPING_CONFIGS: WrappingConfig[] = [
  {
    name: 'REPEAT',
    description: '重复 (Repeat)',
    mode: MSpec.RHIAddressMode.REPEAT,
  },
  {
    name: 'MIRROR_REPEAT',
    description: '镜像重复 (Mirrored)',
    mode: MSpec.RHIAddressMode.MIRROR_REPEAT,
  },
  {
    name: 'CLAMP_TO_EDGE',
    description: '钳制边缘 (Clamp)',
    mode: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  },
];

// ==================== 主程序 ====================

(async function main() {
  try {
    // 1. 初始化 DemoRunner
    const runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Texture Wrapping Demo',
      clearColor: [0.08, 0.08, 0.12, 1.0],
    });

    await runner.init();

    // 2. 初始化性能监控和相机控制
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 4,
      target: [0, 0, 0],
      enableDamping: true,
      autoRotate: false,
    });

    // 3. 创建倾斜平面几何体（UV 范围 [-1, 2] 以展示包裹效果）
    const planeGeometry = GeometryGenerator.quad({
      width: 4,
      height: 4,
      uvs: true,
    });

    // 手动调整 UV 坐标到 [-1, 2] 范围
    // quad 数据布局: position (3 floats) + uv (2 floats) = 5 floats per vertex, 4 vertices total
    const vertices = new Float32Array(planeGeometry.vertices);
    const floatsPerVertex = 5; // position(3) + uv(2)
    for (let i = 0; i < 4; i++) {
      const uvXIndex = i * floatsPerVertex + 3; // UV x index (after position)
      const uvYIndex = i * floatsPerVertex + 4; // UV y index
      vertices[uvXIndex] = vertices[uvXIndex] * 3 - 1; // [0,1] -> [-1,2]
      vertices[uvYIndex] = vertices[uvYIndex] * 3 - 1; // [0,1] -> [-1,2]
    }

    // 4. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: vertices as BufferSource,
        label: 'Wrapping Plane Vertex Buffer',
      })
    );

    // 5. 创建变换矩阵 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // 6. 创建棋盘格纹理
    // eslint-disable-next-line no-console
    console.log('[Texture Wrapping Demo] Creating checkerboard texture...');

    const checkerData = ProceduralTexture.checkerboard({
      width: 256,
      height: 256,
      cellSize: 16,
      colorA: [255, 100, 100, 255], // 红色
      colorB: [100, 100, 255, 255], // 蓝色
    });

    // 创建纹理
    const texture = runner.track(
      runner.device.createTexture({
        width: checkerData.width,
        height: checkerData.height,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Checkerboard Texture',
      })
    );
    texture.update(checkerData.data as BufferSource);

    // eslint-disable-next-line no-console
    console.log(`[Texture Wrapping Demo] Created ${checkerData.width}x${checkerData.height} texture`);

    // 7. 为每种包裹模式创建采样器
    const samplers = WRAPPING_CONFIGS.map((config) =>
      runner.track(
        runner.device.createSampler({
          magFilter: MSpec.RHIFilterMode.LINEAR,
          minFilter: MSpec.RHIFilterMode.LINEAR,
          addressModeU: config.mode,
          addressModeV: config.mode,
          label: `Sampler: ${config.name}`,
        })
      )
    );

    // 8. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Wrapping Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Wrapping Fragment Shader',
      })
    );

    // 9. 创建绑定组布局
    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout([
        {
          binding: 0,
          visibility: MSpec.RHIShaderStage.VERTEX,
          buffer: { type: 'uniform' },
          name: 'Transforms',
        },
        {
          binding: 1,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          texture: { sampleType: 'float', viewDimension: '2d' },
          name: 'uTexture',
        },
        {
          binding: 2,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
          name: 'uSampler',
        },
      ])
    );

    // 10. 创建管线布局
    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Wrapping Pipeline Layout')
    );

    // 11. 顶点布局
    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0,
          stride: 20,
          stepMode: 'vertex',
          attributes: [
            { name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 },
            { name: 'aTexCoord', format: MSpec.RHIVertexFormat.FLOAT32x2, offset: 12, shaderLocation: 1 },
          ],
        },
      ],
    };

    // 12. 创建渲染管线
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Wrapping Pipeline',
      })
    );

    // 13. 获取纹理视图
    const textureView = texture.createView();

    // 14. 为每种包裹模式创建绑定组
    const bindGroups = samplers.map((sampler) =>
      runner.track(
        runner.device.createBindGroup(bindGroupLayout, [
          { binding: 0, resource: { buffer: transformBuffer } },
          { binding: 1, resource: textureView },
          { binding: 2, resource: sampler },
        ])
      )
    );

    // 当前选中的包裹模式索引
    let currentWrappingIndex = 0; // 默认选中 REPEAT

    // 模型矩阵
    const modelMatrix = new MMath.Matrix4();

    // UV 缩放因子
    let uvScale = 1.0;

    // 平面倾斜角度
    let tiltAngle = 45;

    // ==================== GUI 控制 ====================
    const gui = new SimpleGUI();
    gui.addSeparator('Wrapping Mode');

    // 添加包裹模式选择下拉框
    const wrappingNames = WRAPPING_CONFIGS.map((c) => c.description);
    gui.add('Mode', {
      value: wrappingNames[currentWrappingIndex],
      options: wrappingNames,
      onChange: (value) => {
        const desc = value as string;
        const index = WRAPPING_CONFIGS.findIndex((c) => c.description === desc);
        if (index !== -1) {
          currentWrappingIndex = index;
          // eslint-disable-next-line no-console
          console.log(`[Texture Wrapping Demo] Switched to: ${WRAPPING_CONFIGS[index].name}`);
        }
      },
    });

    gui.addSeparator('Texture');

    // UV 缩放滑块
    gui.add('UV Scale', {
      value: uvScale,
      min: 0.5,
      max: 3.0,
      step: 0.1,
      onChange: (value) => {
        uvScale = value as number;
      },
    });

    // 倾斜角度滑块
    gui.add('Tilt Angle', {
      value: tiltAngle,
      min: 0,
      max: 90,
      step: 5,
      onChange: (value) => {
        tiltAngle = value as number;
        modelMatrix.identity();
        modelMatrix.rotateX((tiltAngle * Math.PI) / 180);
      },
    });

    // 初始化模型矩阵
    modelMatrix.rotateX((tiltAngle * Math.PI) / 180);

    // ==================== 预分配渲染循环数据 ====================
    const transformData = new Float32Array(64);

    // ==================== 渲染循环 ====================

    runner.start((dt) => {
      orbit.update(dt);
      stats.begin();

      // 获取视图和投影矩阵
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      // 更新变换矩阵（使用预分配数组）
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformData[48] = uvScale; // 第四个矩阵位置存储 UV 缩放
      transformBuffer.update(transformData, 0);

      const { encoder, passDescriptor } = runner.beginFrame();
      const renderPass = encoder.beginRenderPass(passDescriptor);

      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);

      // 绑定当前选中的包裹模式对应的绑定组
      renderPass.setBindGroup(0, bindGroups[currentWrappingIndex]);

      // 绘制
      renderPass.draw(planeGeometry.vertexCount, 1, 0, 0);

      renderPass.end();
      runner.endFrame(encoder);

      stats.end();
    });

    // ==================== 事件处理 ====================

    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      '1-3: 切换包裹模式',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);

    // 注册包裹模式切换快捷键
    WRAPPING_CONFIGS.forEach((config, index) => {
      const key = (index + 1).toString();
      runner.onKey(key, () => {
        currentWrappingIndex = index;
        gui.set('Mode', config.description);
        // eslint-disable-next-line no-console
        console.log(`[Texture Wrapping Demo] Switched to: ${config.name}`);
      });
    });

    // 0 键重置视角
    runner.onKey('0', () => {
      // eslint-disable-next-line no-console
      console.log('[Texture Wrapping Demo] Reset view');
      orbit.setTarget(0, 0, 0);
      orbit.setDistance(4);
    });

    runner.onKey('Escape', () => {
      // eslint-disable-next-line no-console
      console.log('[Texture Wrapping Demo] Exiting...');
      stats.destroy();
      orbit.destroy();
      gui.destroy();
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

    // eslint-disable-next-line no-console
    console.log('[Texture Wrapping Demo] Initialized successfully!');
    // eslint-disable-next-line no-console
    console.log('[Texture Wrapping Demo] Available wrapping modes:');
    WRAPPING_CONFIGS.forEach((config, i) => {
      // eslint-disable-next-line no-console
      console.log(`  ${i + 1}. ${config.name} - ${config.description}`);
    });
  } catch (error) {
    console.error('[Texture Wrapping Demo] Error:', error);
    throw error;
  }
})();
