/**
 * texture-wrapping.ts
 * 纹理包裹模式 Demo
 *
 * 功能演示：
 * - REPEAT: 重复纹理
 * - MIRROR_REPEAT: 镜像重复
 * - CLAMP_TO_EDGE: 边缘夹紧
 * - 动态 UV 缩放控制
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

uniform UVParams {
  float uUVScale;
  float _padding1;
  float _padding2;
  float _padding3;
};

out vec2 vTexCoord;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  // 应用 UV 缩放，使纹理坐标超出 [0,1] 范围
  vTexCoord = (aTexCoord - 0.5) * uUVScale + 0.5;
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

interface WrapModeConfig {
  name: string;
  addressMode: MSpec.RHIAddressMode;
  description: string;
}

const WRAP_MODES: WrapModeConfig[] = [
  {
    name: 'Repeat',
    addressMode: MSpec.RHIAddressMode.REPEAT,
    description: '纹理重复平铺',
  },
  {
    name: 'Mirror Repeat',
    addressMode: MSpec.RHIAddressMode.MIRROR_REPEAT,
    description: '镜像重复',
  },
  {
    name: 'Clamp to Edge',
    addressMode: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
    description: '边缘颜色延伸',
  },
];

// ==================== 主程序 ====================

(async function main() {
  try {
    // 1. 初始化 DemoRunner
    const runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Texture Wrapping Demo',
      clearColor: [0.1, 0.1, 0.15, 1.0],
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

    // 3. 创建平面几何体（带纹理坐标）
    const planeGeometry = GeometryGenerator.quad({
      width: 3,
      height: 3,
      uvs: true,
    });

    // 4. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: planeGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: planeGeometry.vertices as BufferSource,
        label: 'Wrapping Plane Vertex Buffer',
      })
    );

    // 5. 创建 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    const uvParamsBuffer = runner.track(
      runner.device.createBuffer({
        size: 16, // float uUVScale + 3 padding
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'UV Params Buffer',
      })
    );

    // 6. 生成程序化纹理（带箭头的棋盘格，便于观察包裹效果）
    // eslint-disable-next-line no-console
    console.log('[Texture Wrapping Demo] Generating textures...');

    // 使用 UV Debug 纹理（R=U, G=V）
    const uvDebugData = ProceduralTexture.uvDebug({ width: 256, height: 256 });

    // 使用棋盘格纹理
    const checkerData = ProceduralTexture.checkerboard({
      width: 256,
      height: 256,
      cellSize: 32,
      colorA: [255, 200, 100, 255],
      colorB: [50, 50, 150, 255],
    });

    // 创建纹理配置
    const textureConfigs = [
      { name: 'UV Debug', data: uvDebugData },
      { name: 'Checkerboard', data: checkerData },
    ];

    // 创建 RHI 纹理
    const textures = textureConfigs.map((config) => {
      const texture = runner.track(
        runner.device.createTexture({
          width: config.data.width,
          height: config.data.height,
          format: MSpec.RHITextureFormat.RGBA8_UNORM,
          usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
          label: `Texture: ${config.name}`,
        })
      );
      texture.update(config.data.data as BufferSource);
      // eslint-disable-next-line no-console
      console.log(`[Texture Wrapping Demo] Created "${config.name}"`);
      return { name: config.name, texture };
    });

    // 7. 为每种包裹模式创建采样器
    const samplers = WRAP_MODES.map((mode) => {
      const sampler = runner.track(
        runner.device.createSampler({
          magFilter: MSpec.RHIFilterMode.LINEAR,
          minFilter: MSpec.RHIFilterMode.LINEAR,
          mipmapFilter: MSpec.RHIFilterMode.NEAREST,
          addressModeU: mode.addressMode,
          addressModeV: mode.addressMode,
          label: `Sampler: ${mode.name}`,
        })
      );
      // eslint-disable-next-line no-console
      console.log(`[Texture Wrapping Demo] Created sampler "${mode.name}"`);
      return { name: mode.name, sampler };
    });

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
          visibility: MSpec.RHIShaderStage.VERTEX,
          buffer: { type: 'uniform' },
          name: 'UVParams',
        },
        {
          binding: 2,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          texture: { sampleType: 'float', viewDimension: '2d' },
          name: 'uTexture',
        },
        {
          binding: 3,
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

    // 13. 为每种纹理+采样器组合创建绑定组
    interface RenderEntry {
      textureIndex: number;
      samplerIndex: number;
      bindGroup: MSpec.IRHIBindGroup;
    }

    const createBindGroup = (textureIndex: number, samplerIndex: number): MSpec.IRHIBindGroup => {
      return runner.track(
        runner.device.createBindGroup(bindGroupLayout, [
          { binding: 0, resource: { buffer: transformBuffer } },
          { binding: 1, resource: { buffer: uvParamsBuffer } },
          { binding: 2, resource: textures[textureIndex].texture.createView() },
          { binding: 3, resource: samplers[samplerIndex].sampler },
        ])
      );
    };

    // 预创建所有组合的绑定组
    const bindGroups: RenderEntry[] = [];
    for (let ti = 0; ti < textures.length; ti++) {
      for (let si = 0; si < samplers.length; si++) {
        bindGroups.push({
          textureIndex: ti,
          samplerIndex: si,
          bindGroup: createBindGroup(ti, si),
        });
      }
    }

    // 14. 状态变量
    let currentTextureIndex = 0;
    let currentSamplerIndex = 0;
    let uvScale = 2.0; // 默认2倍，展示包裹效果

    const getCurrentBindGroup = (): MSpec.IRHIBindGroup => {
      const entry = bindGroups.find(
        (e) => e.textureIndex === currentTextureIndex && e.samplerIndex === currentSamplerIndex
      );
      return entry?.bindGroup ?? bindGroups[0].bindGroup;
    };

    // 15. 模型矩阵
    const modelMatrix = new MMath.Matrix4();

    // ==================== GUI 控制 ====================
    const gui = new SimpleGUI();
    gui.addSeparator('Texture Wrapping');

    // 纹理选择
    gui.add('Texture', {
      value: textures[currentTextureIndex].name,
      options: textures.map((t) => t.name),
      onChange: (value) => {
        const name = value as string;
        const index = textures.findIndex((t) => t.name === name);
        if (index !== -1) {
          currentTextureIndex = index;
          // eslint-disable-next-line no-console
          console.log(`[Texture Wrapping Demo] Texture: ${name}`);
        }
      },
    });

    // 包裹模式选择
    gui.add('Wrap Mode', {
      value: WRAP_MODES[currentSamplerIndex].name,
      options: WRAP_MODES.map((m) => m.name),
      onChange: (value) => {
        const name = value as string;
        const index = WRAP_MODES.findIndex((m) => m.name === name);
        if (index !== -1) {
          currentSamplerIndex = index;
          // eslint-disable-next-line no-console
          console.log(`[Texture Wrapping Demo] Wrap Mode: ${name} - ${WRAP_MODES[index].description}`);
        }
      },
    });

    // UV 缩放滑块
    gui.add('UV Scale', {
      value: uvScale,
      min: 0.5,
      max: 4.0,
      step: 0.1,
      onChange: (value) => {
        uvScale = value as number;
      },
    });

    // ==================== 渲染循环 ====================

    runner.start((dt) => {
      orbit.update(dt);
      stats.begin();

      // 获取视图和投影矩阵
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      // 更新变换矩阵
      const transformData = new Float32Array(64);
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformBuffer.update(transformData, 0);

      // 更新 UV 参数
      const uvParamsData = new Float32Array(4);
      uvParamsData[0] = uvScale;
      uvParamsBuffer.update(uvParamsData, 0);

      const { encoder, passDescriptor } = runner.beginFrame();
      const renderPass = encoder.beginRenderPass(passDescriptor);

      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setBindGroup(0, getCurrentBindGroup());

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
      'T: 切换纹理',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
    ]);

    // 包裹模式快捷键
    WRAP_MODES.forEach((mode, index) => {
      const key = (index + 1).toString();
      runner.onKey(key, () => {
        currentSamplerIndex = index;
        gui.set('Wrap Mode', mode.name);
        // eslint-disable-next-line no-console
        console.log(`[Texture Wrapping Demo] Wrap Mode: ${mode.name}`);
      });
    });

    // 纹理切换快捷键
    runner.onKey('t', () => {
      currentTextureIndex = (currentTextureIndex + 1) % textures.length;
      gui.set('Texture', textures[currentTextureIndex].name);
      // eslint-disable-next-line no-console
      console.log(`[Texture Wrapping Demo] Texture: ${textures[currentTextureIndex].name}`);
    });

    runner.onKey('Escape', () => {
      // eslint-disable-next-line no-console
      console.log('[Texture Wrapping Demo] Exiting...');
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

    // eslint-disable-next-line no-console
    console.log('[Texture Wrapping Demo] Initialized successfully!');
    // eslint-disable-next-line no-console
    console.log('[Texture Wrapping Demo] Available wrap modes:');
    WRAP_MODES.forEach((mode, i) => {
      // eslint-disable-next-line no-console
      console.log(`  ${i + 1}. ${mode.name} - ${mode.description}`);
    });
  } catch (error) {
    console.error('[Texture Wrapping Demo] Error:', error);
    throw error;
  }
})();
