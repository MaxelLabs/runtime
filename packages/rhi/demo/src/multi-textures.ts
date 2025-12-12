/**
 * multi-textures.ts
 * 多纹理混合演示 Demo
 *
 * 功能演示：
 * - 多纹理同时绑定和采样
 * - 5 种混合模式：Linear、Multiply、Screen、Overlay、Mask
 * - 使用 ProceduralTexture 生成程序化纹理
 * - Uniform 块控制混合参数
 * - 实时参数调节和快捷键切换
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

uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D uMaskTexture;

uniform BlendParams {
  float uMixFactor;
  int uBlendMode;
  float uMaskThreshold;
};

in vec2 vTexCoord;
out vec4 fragColor;

// 混合模式枚举
const int BLEND_LINEAR = 0;
const int BLEND_MULTIPLY = 1;
const int BLEND_SCREEN = 2;
const int BLEND_OVERLAY = 3;
const int BLEND_MASK = 4;

vec3 blendMultiply(vec3 base, vec3 blend) {
  return base * blend;
}

vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 blendOverlay(vec3 base, vec3 blend) {
  return mix(
    2.0 * base * blend,
    1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
    step(0.5, base)
  );
}

void main() {
  vec4 color1 = texture(uTexture1, vTexCoord);
  vec4 color2 = texture(uTexture2, vTexCoord);
  vec4 maskColor = texture(uMaskTexture, vTexCoord);

  vec3 result = color1.rgb;

  // 根据混合模式计算结果
  switch (uBlendMode) {
    case BLEND_LINEAR:
      result = mix(color1.rgb, color2.rgb, uMixFactor);
      break;

    case BLEND_MULTIPLY:
      result = mix(color1.rgb, blendMultiply(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_SCREEN:
      result = mix(color1.rgb, blendScreen(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_OVERLAY:
      result = mix(color1.rgb, blendOverlay(color1.rgb, color2.rgb), uMixFactor);
      break;

    case BLEND_MASK:
      // 使用遮罩纹理控制混合
      float mask = (maskColor.r + maskColor.g + maskColor.b) / 3.0;
      float blend = step(uMaskThreshold, mask) * uMixFactor;
      result = mix(color1.rgb, color2.rgb, blend);
      break;

    default:
      result = color1.rgb;
      break;
  }

  fragColor = vec4(result, 1.0);
}
`;

// ==================== 混合模式配置 ====================

interface BlendMode {
  name: string;
  description: string;
  id: number;
}

const BLEND_MODES: BlendMode[] = [
  {
    name: 'Linear',
    description: '线性插值混合',
    id: 0,
  },
  {
    name: 'Multiply',
    description: '乘法混合（变暗）',
    id: 1,
  },
  {
    name: 'Screen',
    description: '屏幕混合（变亮）',
    id: 2,
  },
  {
    name: 'Overlay',
    description: '叠加混合（对比度增强）',
    id: 3,
  },
  {
    name: 'Mask',
    description: '遮罩混合（基于遮罩纹理）',
    id: 4,
  },
];

// ==================== 主程序 ====================

(async function main() {
  try {
    // 1. 初始化 DemoRunner
    const runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Multi-Textures Demo',
      clearColor: [0.1, 0.1, 0.15, 1.0],
    });

    await runner.init();

    // 2. 初始化性能监控和相机控制
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 3,
      target: [0, 0, 0],
      enableDamping: true,
      autoRotate: false,
    });

    // 3. 创建平面几何体
    const planeGeometry = GeometryGenerator.plane({
      width: 3,
      height: 3,
      widthSegments: 1,
      heightSegments: 1,
      uvs: true,
    });

    // 4. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: planeGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: planeGeometry.vertices as BufferSource,
        label: 'Multi-Textures Plane Vertex Buffer',
      })
    );

    // 5. 创建变换矩阵 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256, // 4 matrices * 64 bytes
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // 6. 创建混合参数 Uniform 缓冲区
    const blendParamsBuffer = runner.track(
      runner.device.createBuffer({
        size: 16, // float + int + float + padding
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Blend Params Uniform Buffer',
      })
    );

    // 7. 创建程序化纹理
    // eslint-disable-next-line no-console
    console.log('[Multi-Textures Demo] Creating procedural textures...');

    // 纹理 1：棋盘格
    const checkerData = ProceduralTexture.checkerboard({
      width: 512,
      height: 512,
      cellSize: 32,
      colorA: [255, 100, 100, 255], // 红色
      colorB: [100, 100, 255, 255], // 蓝色
    });

    const texture1 = runner.track(
      runner.device.createTexture({
        width: checkerData.width,
        height: checkerData.height,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Checkerboard Texture',
      })
    );
    texture1.update(checkerData.data as BufferSource);

    // 纹理 2：渐变
    const gradientData = ProceduralTexture.gradient({
      width: 512,
      height: 512,
      direction: 'diagonal',
      colors: [
        { position: 0.0, color: [255, 200, 0, 255] }, // 黄色
        { position: 0.5, color: [255, 0, 200, 255] }, // 紫色
        { position: 1.0, color: [0, 200, 255, 255] }, // 青色
      ],
    });

    const texture2 = runner.track(
      runner.device.createTexture({
        width: gradientData.width,
        height: gradientData.height,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Gradient Texture',
      })
    );
    texture2.update(gradientData.data as BufferSource);

    // 遮罩纹理：噪声
    const noiseData = ProceduralTexture.noise({
      width: 512,
      height: 512,
      type: 'white',
      scale: 0.02,
    });

    const maskTexture = runner.track(
      runner.device.createTexture({
        width: noiseData.width,
        height: noiseData.height,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Noise Mask Texture',
      })
    );
    maskTexture.update(noiseData.data as BufferSource);

    // eslint-disable-next-line no-console
    console.log('[Multi-Textures Demo] Created 3 procedural textures');

    // 8. 创建采样器
    const sampler = runner.track(
      runner.device.createSampler({
        magFilter: MSpec.RHIFilterMode.LINEAR,
        minFilter: MSpec.RHIFilterMode.LINEAR,
        mipmapFilter: MSpec.RHIFilterMode.NEAREST,
        addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        label: 'Texture Sampler',
      })
    );

    // 9. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Multi-Textures Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Multi-Textures Fragment Shader',
      })
    );

    // 10. 创建绑定组布局（3 个纹理 + 3 个采样器）
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
          buffer: { type: 'uniform' },
          name: 'BlendParams',
        },
        {
          binding: 2,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          texture: { sampleType: 'float', viewDimension: '2d' },
          name: 'uTexture1',
        },
        {
          binding: 3,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
          name: 'uSampler1',
        },
        {
          binding: 4,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          texture: { sampleType: 'float', viewDimension: '2d' },
          name: 'uTexture2',
        },
        {
          binding: 5,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
          name: 'uSampler2',
        },
        {
          binding: 6,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          texture: { sampleType: 'float', viewDimension: '2d' },
          name: 'uMaskTexture',
        },
        {
          binding: 7,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
          name: 'uMaskSampler',
        },
      ])
    );

    // 11. 创建管线布局
    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Multi-Textures Pipeline Layout')
    );

    // 12. 顶点布局
    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0,
          stride: 20, // 3 floats (position) + 2 floats (texCoord) = 20 bytes
          stepMode: 'vertex',
          attributes: [
            { name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 },
            { name: 'aTexCoord', format: MSpec.RHIVertexFormat.FLOAT32x2, offset: 12, shaderLocation: 1 },
          ],
        },
      ],
    };

    // 13. 创建渲染管线
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Multi-Textures Pipeline',
      })
    );

    // 14. 创建绑定组
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: { buffer: transformBuffer } },
        { binding: 1, resource: { buffer: blendParamsBuffer } },
        { binding: 2, resource: texture1.createView() },
        { binding: 3, resource: sampler },
        { binding: 4, resource: texture2.createView() },
        { binding: 5, resource: sampler },
        { binding: 6, resource: maskTexture.createView() },
        { binding: 7, resource: sampler },
      ])
    );

    // 15. 模型矩阵
    const modelMatrix = new MMath.Matrix4();

    // 16. 混合参数初始值
    let mixFactor = 0.5;
    let blendMode = 0; // Linear
    let maskThreshold = 0.5;

    // ==================== GUI 控制 ====================
    const gui = new SimpleGUI();
    gui.addSeparator('Blend Mode');

    // 混合模式下拉选择
    const blendModeNames = BLEND_MODES.map((m) => m.name);
    gui.add('Blend Mode', {
      value: blendModeNames[blendMode],
      options: blendModeNames,
      onChange: (value) => {
        const name = value as string;
        const index = BLEND_MODES.findIndex((m) => m.name === name);
        if (index !== -1) {
          blendMode = index;
          // eslint-disable-next-line no-console
          console.log(`[Multi-Textures Demo] Switched to: ${BLEND_MODES[index].description}`);
        }
      },
    });

    gui.addSeparator('Blend Parameters');

    // 混合因子滑块
    gui.add('Mix Factor', {
      value: mixFactor,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      onChange: (value) => {
        mixFactor = value as number;
      },
    });

    // 遮罩阈值滑块（仅在 Mask 模式下有效）
    gui.add('Mask Threshold', {
      value: maskThreshold,
      min: 0.0,
      max: 1.0,
      step: 0.01,
      onChange: (value) => {
        maskThreshold = value as number;
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

      // 更新混合参数
      const blendParamsData = new Float32Array(4);
      blendParamsData[0] = mixFactor;
      blendParamsData[1] = blendMode;
      blendParamsData[2] = maskThreshold;
      blendParamsBuffer.update(blendParamsData, 0);

      const { encoder, passDescriptor } = runner.beginFrame();
      const renderPass = encoder.beginRenderPass(passDescriptor);

      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setBindGroup(0, bindGroup);

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
      '1-5: 切换混合模式',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);

    // 注册混合模式切换快捷键
    BLEND_MODES.forEach((mode, index) => {
      const key = (index + 1).toString();
      runner.onKey(key, () => {
        blendMode = mode.id;
        gui.set('Blend Mode', mode.name);
        // eslint-disable-next-line no-console
        console.log(`[Multi-Textures Demo] Switched to: ${mode.description}`);
      });
    });

    // 0 键重置视角
    runner.onKey('0', () => {
      // eslint-disable-next-line no-console
      console.log('[Multi-Textures Demo] Reset view');
      orbit.setTarget(0, 0, 0);
      orbit.setDistance(3);
    });

    runner.onKey('Escape', () => {
      // eslint-disable-next-line no-console
      console.log('[Multi-Textures Demo] Exiting...');
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
    console.log('[Multi-Textures Demo] Initialized successfully!');
    // eslint-disable-next-line no-console
    console.log('[Multi-Textures Demo] Available blend modes:');
    BLEND_MODES.forEach((mode, i) => {
      // eslint-disable-next-line no-console
      console.log(`  ${i + 1}. ${mode.name} - ${mode.description}`);
    });
  } catch (error) {
    console.error('[Multi-Textures Demo] Error:', error);
    throw error;
  }
})();
