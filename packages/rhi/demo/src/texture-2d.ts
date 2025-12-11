/**
 * texture-2d.ts
 * 基础 2D 纹理加载和采样 Demo
 *
 * 功能演示：
 * - 使用 TextureLoader 加载外部图片纹理
 * - 使用 ProceduralTexture 生成程序化纹理
 * - 多纹理对比显示（图片/棋盘格/UV调试）
 * - 基础纹理采样和 UV 映射
 */

import { MSpec, MMath } from '@maxellabs/core';
import {
  DemoRunner,
  OrbitController,
  Stats,
  TextureLoader,
  GeometryGenerator,
  ProceduralTexture,
  SimpleGUI,
} from './utils';

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

// ==================== 纹理配置 ====================

interface TextureInfo {
  name: string;
  description: string;
  position: [number, number, number];
  type: 'image' | 'procedural';
  source?: string; // URL for image type
  generator?: () => { data: Uint8Array; width: number; height: number }; // Function for procedural type
}

const TEXTURE_CONFIGS: TextureInfo[] = [
  {
    name: 'UV Debug',
    description: '显示 UV 坐标',
    position: [-2.5, 0, 0],
    type: 'procedural',
    generator: () => ProceduralTexture.uvDebug({ width: 512, height: 512 }),
  },
  {
    name: 'Caravaggio',
    description: '外部图片纹理',
    position: [0, 0, 0],
    type: 'image',
    source: '../assets/texture/758px-Canestra_di_frutta_(Caravaggio).jpg',
  },
  {
    name: 'Checkerboard',
    description: '棋盘格测试',
    position: [2.5, 0, 0],
    type: 'procedural',
    generator: () =>
      ProceduralTexture.checkerboard({
        width: 512,
        height: 512,
        cellSize: 32,
        colorA: [255, 255, 255, 255],
        colorB: [64, 64, 64, 255],
      }),
  },
];

// ==================== 主程序 ====================

(async function main() {
  try {
    // 1. 初始化 DemoRunner
    const runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Texture 2D Demo',
      clearColor: [0.1, 0.1, 0.15, 1.0],
    });

    await runner.init();

    // 2. 初始化性能监控和相机控制
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 6,
      target: [0, 0, 0],
      enableDamping: true,
      autoRotate: false,
    });

    // 3. 创建平面几何体（带纹理坐标）
    const planeGeometry = GeometryGenerator.quad({
      width: 2,
      height: 2,
      uvs: true,
    });

    // 4. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: planeGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: planeGeometry.vertices as BufferSource,
        label: 'Texture Plane Vertex Buffer',
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

    // 6. 加载/生成所有纹理（同时保存位置信息）
    // eslint-disable-next-line no-console
    console.log('[Texture 2D Demo] Creating textures...');

    interface TextureEntry {
      texture: MSpec.IRHITexture;
      position: [number, number, number];
      name: string;
    }
    const textureEntries: TextureEntry[] = [];

    for (const config of TEXTURE_CONFIGS) {
      let textureData: { data: Uint8Array; width: number; height: number };

      if (config.type === 'image' && config.source) {
        // 使用 TextureLoader 加载外部图片
        // eslint-disable-next-line no-console
        console.log(`[Texture 2D Demo] Loading image: ${config.name}`);
        try {
          textureData = await TextureLoader.load(config.source, {
            flipY: true,
            generateMipmaps: false,
            format: 'rgba8-unorm',
          });
        } catch (error) {
          console.error(`[Texture 2D Demo] Failed to load image: ${config.name}`, error);
          continue;
        }
      } else if (config.type === 'procedural' && config.generator) {
        // 使用 ProceduralTexture 生成程序化纹理
        // eslint-disable-next-line no-console
        console.log(`[Texture 2D Demo] Generating procedural: ${config.name}`);
        textureData = config.generator();
      } else {
        console.warn(`[Texture 2D Demo] Invalid config for: ${config.name}`);
        continue;
      }

      // 创建 RHI 纹理
      const texture = runner.track(
        runner.device.createTexture({
          width: textureData.width,
          height: textureData.height,
          format: MSpec.RHITextureFormat.RGBA8_UNORM,
          usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
          label: `Texture: ${config.name}`,
        })
      );
      texture.update(textureData.data as BufferSource);

      // eslint-disable-next-line no-console
      console.log(`[Texture 2D Demo] Created "${config.name}": ${textureData.width}x${textureData.height}`);

      textureEntries.push({
        texture,
        position: config.position,
        name: config.name,
      });
    }

    // eslint-disable-next-line no-console
    console.log(`[Texture 2D Demo] Total textures created: ${textureEntries.length}`);

    // 7. 创建采样器
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

    // 8. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Texture Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Texture Fragment Shader',
      })
    );

    // 9. 创建绑定组布局（所有资源在同一个布局中，避免 binding 点冲突）
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
      runner.device.createPipelineLayout([bindGroupLayout], 'Texture Pipeline Layout')
    );

    // 11. 顶点布局
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

    // 12. 创建渲染管线
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Texture Pipeline',
      })
    );

    // 13. 为每个纹理创建完整的绑定组
    const renderData = textureEntries.map((entry) => {
      const bindGroup = runner.track(
        runner.device.createBindGroup(bindGroupLayout, [
          { binding: 0, resource: { buffer: transformBuffer } },
          { binding: 1, resource: entry.texture.createView() },
          { binding: 2, resource: sampler },
        ])
      );

      // 所有纹理都显示在中心
      const modelMatrix = new MMath.Matrix4();

      return { bindGroup, modelMatrix, name: entry.name };
    });

    // 当前选中的纹理索引
    let currentTextureIndex = 1; // 默认选中 Caravaggio

    // ==================== GUI 控制 ====================
    const gui = new SimpleGUI();
    gui.addSeparator('Texture Selector');

    // 添加纹理选择下拉框
    const textureNames = renderData.map((d) => d.name);
    gui.add('Current Texture', {
      value: textureNames[currentTextureIndex],
      options: textureNames,
      onChange: (value) => {
        const name = value as string;
        const index = renderData.findIndex((d) => d.name === name);
        if (index !== -1) {
          currentTextureIndex = index;
          // eslint-disable-next-line no-console
          console.log(`[Texture 2D Demo] Switched to: ${name}`);
        }
      },
    });

    // ==================== 渲染循环 ====================

    runner.start((dt) => {
      orbit.update(dt);
      stats.begin();

      // 获取视图和投影矩阵
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      const { encoder, passDescriptor } = runner.beginFrame();
      const renderPass = encoder.beginRenderPass(passDescriptor);

      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);

      // 只渲染当前选中的纹理
      const currentData = renderData[currentTextureIndex];

      // 更新变换矩阵
      const transformData = new Float32Array(64);
      transformData.set(currentData.modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformBuffer.update(transformData, 0);

      // 绑定对应的绑定组
      renderPass.setBindGroup(0, currentData.bindGroup);

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
      '1-3: 切换纹理',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);

    // 注册纹理切换快捷键
    textureEntries.forEach((entry, index) => {
      const key = (index + 1).toString();
      runner.onKey(key, () => {
        currentTextureIndex = index;
        gui.set('Current Texture', entry.name);
        // eslint-disable-next-line no-console
        console.log(`[Texture 2D Demo] Switched to: ${entry.name}`);
      });
    });

    // 0 键重置视角（仅重置相机）
    runner.onKey('0', () => {
      // eslint-disable-next-line no-console
      console.log('[Texture 2D Demo] Reset view');
      orbit.setTarget(0, 0, 0);
      orbit.setDistance(6);
    });

    runner.onKey('Escape', () => {
      // eslint-disable-next-line no-console
      console.log('[Texture 2D Demo] Exiting...');
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
    console.log('[Texture 2D Demo] Initialized successfully!');
    // eslint-disable-next-line no-console
    console.log('[Texture 2D Demo] Textures displayed:');
    renderData.forEach((data, i) => {
      // eslint-disable-next-line no-console
      console.log(`  ${i + 1}. ${data.name}`);
    });
  } catch (error) {
    console.error('[Texture 2D Demo] Error:', error);
    throw error;
  }
})();
