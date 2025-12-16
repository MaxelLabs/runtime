/**
 * post-process.ts
 * 后处理框架（Post-Processing）Demo
 *
 * 核心特性：
 * - 使用后处理管道系统链式应用多个效果
 * - Ping-Pong缓冲区技术避免读写冲突
 * - 支持动态启用/禁用效果
 * - 展示 PostProcessManager 和内置效果的使用
 *
 * 技术要点：
 * - 离屏渲染到纹理
 * - 全屏四边形渲染
 * - 效果链式组合
 * - 实时参数调节
 */

import { MSpec, MMath } from '@maxellabs/core';
import {
  DemoRunner,
  OrbitController,
  Stats,
  GeometryGenerator,
  SimpleGUI,
  RenderTarget,
  PostProcessManager,
  BrightnessContrast,
  GaussianBlur,
  ToneMapping,
} from './utils';

// ==================== 主程序 ====================

const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'Post-Process Demo',
  clearColor: [0.0, 0.0, 0.0, 1.0],
});

let depthTexture: MSpec.IRHITexture;
let sceneRenderTarget: RenderTarget;
let postProcessManager: PostProcessManager;

const updateRenderTargets = () => {
  // 销毁旧资源
  if (depthTexture) {
    depthTexture.destroy();
  }
  if (sceneRenderTarget) {
    sceneRenderTarget.destroy();
  }
  if (postProcessManager) {
    postProcessManager.destroy();
  }

  // 创建深度纹理
  depthTexture = runner.track(
    runner.device.createTexture({
      width: runner.width,
      height: runner.height,
      format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
      usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
      label: 'Scene Depth Texture',
    })
  );

  // 创建场景渲染目标
  sceneRenderTarget = runner.track(
    new RenderTarget(runner.device, {
      width: runner.width,
      height: runner.height,
      colorFormat: MSpec.RHITextureFormat.RGBA8_UNORM,
      depthFormat: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
      label: 'Scene Render Target',
    })
  );

  // 创建后处理管理器
  postProcessManager = runner.track(
    new PostProcessManager(runner.device, {
      width: runner.width,
      height: runner.height,
      useHDR: false,
    })
  );
};

(async function main() {
  try {
    await runner.init();

    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 8,
      enableDamping: true,
      minDistance: 3,
      maxDistance: 20,
    });

    updateRenderTargets();
    runner.onResize(updateRenderTargets);

    // ==================== 创建后处理效果 ====================
    const brightnessContrast = runner.track(
      new BrightnessContrast(runner.device, {
        brightness: 0.0,
        contrast: 1.0,
      })
    );

    const gaussianBlur = runner.track(
      new GaussianBlur(runner.device, {
        radius: 2.0,
      })
    );

    const toneMapping = runner.track(
      new ToneMapping(runner.device, {
        mode: 'aces',
        exposure: 1.0,
        gamma: 2.2,
      })
    );

    // 添加效果到管道
    postProcessManager.addEffect(brightnessContrast);
    postProcessManager.addEffect(gaussianBlur);
    postProcessManager.addEffect(toneMapping);

    // ==================== 创建场景几何体 ====================
    const cubeGeometry = GeometryGenerator.cube({
      size: 2.0,
      normals: true,
    });

    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: cubeGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: cubeGeometry.vertices as BufferSource,
        label: 'Cube Vertex Buffer',
      })
    );

    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: cubeGeometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: cubeGeometry.indices as BufferSource,
        label: 'Cube Index Buffer',
      })
    );

    // ==================== 创建场景着色器 ====================
    const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec3 vWorldNormal;
out vec3 vWorldPosition;

void main() {
  vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPos.xyz;

  mat3 normalMatrix = transpose(inverse(mat3(uModelMatrix)));
  vWorldNormal = normalize(normalMatrix * aNormal);

  gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
`;

    const fragmentShaderSource = `#version 300 es
precision mediump float;

in vec3 vWorldNormal;
in vec3 vWorldPosition;

uniform Lighting {
  vec3 uLightDirection;
  float _pad1;
  vec3 uLightColor;
  float _pad2;
  vec3 uAmbientColor;
  float _pad3;
  vec3 uObjectColor;
  float _pad4;
};

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 lightDir = normalize(uLightDirection);

  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  vec3 ambient = uAmbientColor;
  vec3 lighting = ambient + diffuse;
  vec3 color = lighting * uObjectColor;

  fragColor = vec4(color, 1.0);
}
`;

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

    // ==================== 创建Uniform缓冲区 ====================
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 192,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Buffer',
      })
    );

    const lightingBuffer = runner.track(
      runner.device.createBuffer({
        size: 64,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Lighting Buffer',
      })
    );

    // ==================== 创建场景渲染管线 ====================
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
          name: 'Lighting',
        },
      ])
    );

    const pipelineLayout = runner.track(runner.device.createPipelineLayout([bindGroupLayout]));

    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          arrayStride: 24,
          attributes: [
            { shaderLocation: 0, offset: 0, format: MSpec.RHIVertexFormat.FLOAT32X3 },
            { shaderLocation: 1, offset: 12, format: MSpec.RHIVertexFormat.FLOAT32X3 },
          ],
        },
      ],
    };

    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        rasterizationState: { cullMode: MSpec.RHICullMode.BACK },
        depthStencilState: {
          depthWriteEnabled: true,
          depthCompare: MSpec.RHICompareFunction.LESS,
          format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
        },
      })
    );

    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: { buffer: transformBuffer } },
        { binding: 1, resource: { buffer: lightingBuffer } },
      ])
    );

    // ==================== 创建全屏四边形渲染管线（用于输出到屏幕）====================
    const fullscreenVertexShader = runner.track(
      runner.device.createShaderModule({
        code: `#version 300 es
precision highp float;

out vec2 vUV;

void main() {
  float x = float((gl_VertexID & 1) << 2) - 1.0;
  float y = float((gl_VertexID & 2) << 1) - 1.0;
  vUV = vec2((x + 1.0) * 0.5, (y + 1.0) * 0.5);
  gl_Position = vec4(x, y, 0.0, 1.0);
}`,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
      })
    );

    const fullscreenFragmentShader = runner.track(
      runner.device.createShaderModule({
        code: `#version 300 es
precision mediump float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uTexture;

void main() {
  fragColor = texture(uTexture, vUV);
}`,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
      })
    );

    const fullscreenBindGroupLayout = runner.track(
      runner.device.createBindGroupLayout([
        {
          binding: 0,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          texture: { sampleType: 'float' },
          name: 'uTexture',
        },
        {
          binding: 1,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
          name: 'uSampler',
        },
      ])
    );

    const fullscreenPipelineLayout = runner.track(runner.device.createPipelineLayout([fullscreenBindGroupLayout]));

    const fullscreenPipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader: fullscreenVertexShader,
        fragmentShader: fullscreenFragmentShader,
        vertexLayout: { buffers: [] },
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: fullscreenPipelineLayout,
      })
    );

    const fullscreenSampler = runner.track(
      runner.device.createSampler({
        minFilter: MSpec.RHIFilterMode.LINEAR,
        magFilter: MSpec.RHIFilterMode.LINEAR,
        addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      })
    );

    // ==================== GUI 参数 ====================
    const gui = new SimpleGUI();
    const params = {
      enableBrightness: true,
      brightness: 0.0,
      contrast: 1.0,
      enableBlur: false,
      blurRadius: 2.0,
      enableToneMapping: true,
      exposure: 1.0,
      rotationSpeed: 1.0,
    };

    gui.addSeparator('亮度/对比度 (Brightness/Contrast)');
    gui.add('enableBrightness', {
      value: params.enableBrightness,
      onChange: (v) => {
        params.enableBrightness = v as boolean;
        brightnessContrast.enabled = v as boolean;
      },
    });
    gui.add('brightness', {
      value: params.brightness,
      min: -0.5,
      max: 0.5,
      step: 0.05,
      onChange: (v) => {
        params.brightness = v as number;
        brightnessContrast.setParameters({ brightness: v });
      },
    });
    gui.add('contrast', {
      value: params.contrast,
      min: 0.5,
      max: 2.0,
      step: 0.05,
      onChange: (v) => {
        params.contrast = v as number;
        brightnessContrast.setParameters({ contrast: v });
      },
    });

    gui.addSeparator('高斯模糊 (Gaussian Blur)');
    gui.add('enableBlur', {
      value: params.enableBlur,
      onChange: (v) => {
        params.enableBlur = v as boolean;
        gaussianBlur.enabled = v as boolean;
      },
    });
    gui.add('blurRadius', {
      value: params.blurRadius,
      min: 0.5,
      max: 5.0,
      step: 0.5,
      onChange: (v) => {
        params.blurRadius = v as number;
        gaussianBlur.setParameters({ radius: v });
      },
    });

    gui.addSeparator('色调映射 (Tone Mapping)');
    gui.add('enableToneMapping', {
      value: params.enableToneMapping,
      onChange: (v) => {
        params.enableToneMapping = v as boolean;
        toneMapping.enabled = v as boolean;
      },
    });
    gui.add('exposure', {
      value: params.exposure,
      min: 0.1,
      max: 3.0,
      step: 0.1,
      onChange: (v) => {
        params.exposure = v as number;
        toneMapping.setParameters({ exposure: v });
      },
    });

    gui.addSeparator('场景 (Scene)');
    gui.add('rotationSpeed', {
      value: params.rotationSpeed,
      min: 0.0,
      max: 3.0,
      step: 0.1,
      onChange: (v) => (params.rotationSpeed = v as number),
    });

    // 初始化效果状态
    brightnessContrast.enabled = params.enableBrightness;
    gaussianBlur.enabled = params.enableBlur;
    toneMapping.enabled = params.enableToneMapping;

    // ==================== 渲染循环 ====================
    let time = 0;
    const modelMatrix = new MMath.Matrix4();

    // 更新光照参数
    const lightingData = new Float32Array(16);
    lightingData.set([0.5, 1.0, 0.3, 0], 0); // lightDirection + pad
    lightingData.set([1.0, 1.0, 0.9, 0], 4); // lightColor + pad
    lightingData.set([0.2, 0.2, 0.3, 0], 8); // ambientColor + pad
    lightingData.set([0.8, 0.3, 0.3, 0], 12); // objectColor + pad
    lightingBuffer.update(lightingData, 0);

    runner.start((dt) => {
      orbit.update(dt);
      stats.begin();

      time += dt * params.rotationSpeed;

      // 更新模型矩阵
      modelMatrix
        .identity()
        .rotateY(time)
        .rotateX(time * 0.5);

      // 更新变换Uniform
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);
      const transformData = new Float32Array(48);
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformBuffer.update(transformData, 0);

      const encoder = runner.device.createCommandEncoder();

      // ==================== 第一步：渲染场景到离屏纹理 ====================
      const scenePassDesc = sceneRenderTarget.getRenderPassDescriptor([0.1, 0.15, 0.2, 1.0], 1.0);
      const scenePass = encoder.beginRenderPass(scenePassDesc);
      scenePass.setPipeline(pipeline);
      scenePass.setBindGroup(0, bindGroup);
      scenePass.setVertexBuffer(0, vertexBuffer);
      scenePass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
      scenePass.drawIndexed(cubeGeometry.indexCount, 1, 0, 0, 0);
      scenePass.end();

      // ==================== 第二步：应用后处理链 ====================
      const processedTexture = postProcessManager.process(encoder, sceneRenderTarget.getColorView(0));

      // ==================== 第三步：输出到屏幕 ====================
      const fullscreenBindGroup = runner.device.createBindGroup(fullscreenBindGroupLayout, [
        { binding: 0, resource: processedTexture },
        { binding: 1, resource: fullscreenSampler },
      ]);

      const { passDescriptor } = runner.beginFrame();
      const screenPass = encoder.beginRenderPass(passDescriptor);
      screenPass.setPipeline(fullscreenPipeline);
      screenPass.setBindGroup(0, fullscreenBindGroup);
      screenPass.draw(3, 1, 0, 0);
      screenPass.end();

      runner.endFrame(encoder);

      stats.end();
    });

    // ==================== 帮助信息和键盘事件 ====================
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      'R: 重置视角',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);

    runner.onKey('r', () => {
      orbit.reset();
    });

    runner.onKey('Escape', () => {
      stats.destroy();
      orbit.destroy();
      gui.destroy();
      sceneRenderTarget.destroy();
      postProcessManager.destroy();
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

    const ppStats = postProcessManager.getStats();
    console.info('[Post-Process Demo] Initialized');
    console.info(`  Effects: ${ppStats.enabledEffectCount}/${ppStats.effectCount}`);
    console.info(`  Memory: ${(ppStats.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('Post-Process Demo Error:', error);
    throw error;
  }
})();
