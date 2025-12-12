/**
 * texture-filtering.ts
 * 纹理过滤模式演示 Demo
 *
 * 功能演示：
 * - 最近邻过滤 (NEAREST) - 像素化效果，适合像素艺术
 * - 线性过滤 (LINEAR) - 平滑效果，适合照片
 * - 各向异性过滤 (Anisotropic) - 倾斜视角高质量过滤
 * - Mipmap 过滤模式对比
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

// ==================== 过滤模式配置 ====================

interface FilterConfig {
  name: string;
  description: string;
  minFilter: MSpec.RHIFilterMode;
  magFilter: MSpec.RHIFilterMode;
  mipmapFilter: MSpec.RHIFilterMode;
  maxAnisotropy: number;
}

const FILTER_CONFIGS: FilterConfig[] = [
  {
    name: 'NEAREST',
    description: '最近邻过滤 - 像素化效果',
    minFilter: MSpec.RHIFilterMode.NEAREST,
    magFilter: MSpec.RHIFilterMode.NEAREST,
    mipmapFilter: MSpec.RHIFilterMode.NEAREST,
    maxAnisotropy: 1,
  },
  {
    name: 'LINEAR',
    description: '线性过滤 - 平滑效果',
    minFilter: MSpec.RHIFilterMode.LINEAR,
    magFilter: MSpec.RHIFilterMode.LINEAR,
    mipmapFilter: MSpec.RHIFilterMode.NEAREST,
    maxAnisotropy: 1,
  },
  {
    name: 'BILINEAR',
    description: '双线性过滤 + Mipmap',
    minFilter: MSpec.RHIFilterMode.LINEAR_MIPMAP_NEAREST,
    magFilter: MSpec.RHIFilterMode.LINEAR,
    mipmapFilter: MSpec.RHIFilterMode.NEAREST,
    maxAnisotropy: 1,
  },
  {
    name: 'TRILINEAR',
    description: '三线性过滤 - 高质量',
    minFilter: MSpec.RHIFilterMode.LINEAR_MIPMAP_LINEAR,
    magFilter: MSpec.RHIFilterMode.LINEAR,
    mipmapFilter: MSpec.RHIFilterMode.LINEAR,
    maxAnisotropy: 1,
  },
  {
    name: 'ANISOTROPIC x4',
    description: '各向异性过滤 x4',
    minFilter: MSpec.RHIFilterMode.LINEAR_MIPMAP_LINEAR,
    magFilter: MSpec.RHIFilterMode.LINEAR,
    mipmapFilter: MSpec.RHIFilterMode.LINEAR,
    maxAnisotropy: 4,
  },
  {
    name: 'ANISOTROPIC x16',
    description: '各向异性过滤 x16 - 最高质量',
    minFilter: MSpec.RHIFilterMode.LINEAR_MIPMAP_LINEAR,
    magFilter: MSpec.RHIFilterMode.LINEAR,
    mipmapFilter: MSpec.RHIFilterMode.LINEAR,
    maxAnisotropy: 16,
  },
];

// ==================== 主程序 ====================

(async function main() {
  try {
    // 1. 初始化 DemoRunner
    const runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Texture Filtering Demo',
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
      // 允许更大的倾斜角度以观察各向异性过滤效果
      minElevation: -Math.PI * 0.4,
      maxElevation: Math.PI * 0.4,
    });

    // 3. 创建倾斜平面几何体（更好地展示过滤效果）
    // 使用一个较大的平面，展示远近不同距离的过滤效果
    const planeGeometry = GeometryGenerator.quad({
      width: 4,
      height: 4,
      uvs: true,
    });

    // 4. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: planeGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: planeGeometry.vertices as BufferSource,
        label: 'Filtering Plane Vertex Buffer',
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

    // 6. 创建测试纹理（棋盘格最能体现过滤效果差异）
    // eslint-disable-next-line no-console
    console.log('[Texture Filtering Demo] Creating test texture...');

    // 使用高分辨率棋盘格以更好展示过滤效果
    const checkerData = ProceduralTexture.checkerboard({
      width: 512,
      height: 512,
      cellSize: 8, // 小格子更能体现过滤差异
      colorA: [255, 255, 255, 255],
      colorB: [32, 32, 32, 255],
    });

    // 创建带 Mipmap 的纹理
    const texture = runner.track(
      runner.device.createTexture({
        width: checkerData.width,
        height: checkerData.height,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        mipLevelCount: Math.floor(Math.log2(Math.max(checkerData.width, checkerData.height))) + 1,
        label: 'Checkerboard Texture with Mipmaps',
      })
    );
    texture.update(checkerData.data as BufferSource);

    // 生成 Mipmap
    const mipmapLevels = TextureLoader.generateMipmaps(checkerData.data, checkerData.width, checkerData.height);
    for (let level = 0; level < mipmapLevels.length; level++) {
      texture.update(mipmapLevels[level] as BufferSource, 0, 0, 0, undefined, undefined, undefined, level + 1);
    }

    // eslint-disable-next-line no-console
    console.log(`[Texture Filtering Demo] Created texture with ${mipmapLevels.length + 1} mip levels`);

    // 7. 为每种过滤模式创建采样器
    const samplers = FILTER_CONFIGS.map((config) =>
      runner.track(
        runner.device.createSampler({
          magFilter: config.magFilter,
          minFilter: config.minFilter,
          mipmapFilter: config.mipmapFilter,
          addressModeU: MSpec.RHIAddressMode.REPEAT,
          addressModeV: MSpec.RHIAddressMode.REPEAT,
          maxAnisotropy: config.maxAnisotropy,
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
        label: 'Filtering Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Filtering Fragment Shader',
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
      runner.device.createPipelineLayout([bindGroupLayout], 'Filtering Pipeline Layout')
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
        label: 'Filtering Pipeline',
      })
    );

    // 13. 获取纹理视图
    const textureView = texture.createView();

    // 14. 为每种过滤模式创建绑定组
    const bindGroups = samplers.map((sampler) =>
      runner.track(
        runner.device.createBindGroup(bindGroupLayout, [
          { binding: 0, resource: { buffer: transformBuffer } },
          { binding: 1, resource: textureView },
          { binding: 2, resource: sampler },
        ])
      )
    );

    // 当前选中的过滤模式索引
    let currentFilterIndex = 1; // 默认选中 LINEAR

    // 模型矩阵（将平面倾斜以更好展示过滤效果）
    const modelMatrix = new MMath.Matrix4();
    // 绕 X 轴旋转 -60 度，使平面倾斜
    modelMatrix.rotateX(-Math.PI / 3);

    // UV 缩放因子（控制纹理重复次数）
    let uvScale = 4;

    // ==================== GUI 控制 ====================
    const gui = new SimpleGUI();
    gui.addSeparator('Filter Mode');

    // 添加过滤模式选择下拉框
    const filterNames = FILTER_CONFIGS.map((c) => c.name);
    gui.add('Filter', {
      value: filterNames[currentFilterIndex],
      options: filterNames,
      onChange: (value) => {
        const name = value as string;
        const index = FILTER_CONFIGS.findIndex((c) => c.name === name);
        if (index !== -1) {
          currentFilterIndex = index;
          // eslint-disable-next-line no-console
          console.log(`[Texture Filtering Demo] Switched to: ${FILTER_CONFIGS[index].description}`);
        }
      },
    });

    gui.addSeparator('Texture');

    // UV 缩放滑块
    gui.add('UV Scale', {
      value: uvScale,
      min: 1,
      max: 16,
      step: 1,
      onChange: (value) => {
        uvScale = value as number;
      },
    });

    // 倾斜角度滑块
    let tiltAngle = -60;
    gui.add('Tilt Angle', {
      value: tiltAngle,
      min: -85,
      max: 0,
      step: 5,
      onChange: (value) => {
        tiltAngle = value as number;
        modelMatrix.identity();
        modelMatrix.rotateX((tiltAngle * Math.PI) / 180);
      },
    });

    // ==================== 渲染循环 ====================

    runner.start((dt) => {
      orbit.update(dt);
      stats.begin();

      // 获取视图和投影矩阵
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      // 更新变换矩阵（包含 UV 缩放信息）
      const transformData = new Float32Array(64);
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      // 第四个矩阵位置存储额外数据（UV 缩放）
      transformData[48] = uvScale;
      transformBuffer.update(transformData, 0);

      const { encoder, passDescriptor } = runner.beginFrame();
      const renderPass = encoder.beginRenderPass(passDescriptor);

      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);

      // 绑定当前选中的过滤模式对应的绑定组
      renderPass.setBindGroup(0, bindGroups[currentFilterIndex]);

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
      '1-6: 切换过滤模式',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);

    // 注册过滤模式切换快捷键
    FILTER_CONFIGS.forEach((config, index) => {
      const key = (index + 1).toString();
      runner.onKey(key, () => {
        currentFilterIndex = index;
        gui.set('Filter', config.name);
        // eslint-disable-next-line no-console
        console.log(`[Texture Filtering Demo] Switched to: ${config.description}`);
      });
    });

    // 0 键重置视角
    runner.onKey('0', () => {
      // eslint-disable-next-line no-console
      console.log('[Texture Filtering Demo] Reset view');
      orbit.setTarget(0, 0, 0);
      orbit.setDistance(4);
    });

    runner.onKey('Escape', () => {
      // eslint-disable-next-line no-console
      console.log('[Texture Filtering Demo] Exiting...');
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
    console.log('[Texture Filtering Demo] Initialized successfully!');
    // eslint-disable-next-line no-console
    console.log('[Texture Filtering Demo] Available filter modes:');
    FILTER_CONFIGS.forEach((config, i) => {
      // eslint-disable-next-line no-console
      console.log(`  ${i + 1}. ${config.name} - ${config.description}`);
    });
  } catch (error) {
    console.error('[Texture Filtering Demo] Error:', error);
    throw error;
  }
})();
