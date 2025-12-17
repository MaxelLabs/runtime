/**
 * mipmaps.ts
 * Mipmap 三分屏对比演示 Demo
 *
 * 功能演示：
 * - 三分屏并排对比渲染（左/中/右）
 * - 左侧：无 Mipmap（远处摩尔纹）
 * - 中间：双线性 Mipmap（级别跳跃）
 * - 右侧：三线性 Mipmap（平滑过渡）
 * - 手动 LOD 控制（textureLod）
 * - 带颜色标记的 LOD 级别可视化
 */

import { MSpec, MMath } from '@maxellabs/core';
import {
  DemoRunner,
  OrbitController,
  Stats,
  TextureLoader,
  ProceduralTexture,
  SimpleGUI,
  GeometryGenerator,
} from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = /* glsl */ `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

layout(std140) uniform Transforms {
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

const fragmentShaderSource = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uTexture;
layout(std140) uniform LodControl {
  float uForcedLod; // -1.0 = 自动, 0.0-8.0 = 手动指定 LOD 级别
};

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 texColor;
  if (uForcedLod < 0.0) {
    // 自动 LOD 选择
    texColor = texture(uTexture, vTexCoord);
  } else {
    // 手动指定 LOD 级别
    texColor = textureLod(uTexture, vTexCoord, uForcedLod);
  }
  fragColor = texColor;
}
`;

// ==================== 带颜色标记的 Mipmap 生成 ====================

/**
 * HSL 转 RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) {
        t += 1;
      }
      if (t > 1) {
        t -= 1;
      }
      if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
      }
      if (t < 1 / 2) {
        return q;
      }
      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
      }

      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * 生成带颜色标记的棋盘格 Mipmap 级别
 * 每个 LOD 级别使用不同的颜色（从红色渐变到紫色）
 */
function generateColoredMipmapLevel(size: number, level: number, maxLevels: number): Uint8Array {
  const data = new Uint8Array(size * size * 4);
  const hue = (level / maxLevels) * 300; // 颜色从红色渐变到紫色

  const [r, g, b] = hslToRgb(hue, 0.8, 0.5);
  const [r2, g2, b2] = hslToRgb((hue + 180) % 360, 0.8, 0.5); // 互补色

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const checkerSize = Math.max(1, size / 4); // 每级保持 4x4 格子
      const checker = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2;

      if (checker === 0) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      } else {
        data[i] = r2;
        data[i + 1] = g2;
        data[i + 2] = b2;
        data[i + 3] = 255;
      }
    }
  }

  return data;
}

// ==================== 主程序 ====================

(async function main() {
  try {
    // 1. 初始化 DemoRunner
    const runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Mipmap 三分屏对比 Demo',
      clearColor: [0.06, 0.06, 0.1, 1.0],
    });

    await runner.init();

    // 2. 初始化性能监控和相机控制
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 25,
      target: [0, 0, -50],
      azimuth: 0,
      elevation: MMath.degToRad(45), // 45° 俯视角
      enableDamping: true,
      autoRotate: true, // 自动旋转
      autoRotateSpeed: 0.5,
    });

    // 3. 状态变量
    let forcedLod = -1.0; // -1 = 自动
    let showLodColors = false;

    // 4. 创建跑道平面几何体
    const geometry = GeometryGenerator.plane({
      width: 20,
      height: 200,
      widthSegments: 1,
      heightSegments: 20,
      normals: true,
      uvs: true,
    });

    // 5. 手动缩放 UV（4x 重复）
    const floatsPerVertex = 8; // Position(3) + Normal(3) + UV(2)
    for (let i = 0; i < geometry.vertexCount; i++) {
      const baseIndex = i * floatsPerVertex;
      geometry.vertices[baseIndex + 6] *= 4.0; // U
      geometry.vertices[baseIndex + 7] *= 4.0; // V
    }

    // 6. 创建顶点缓冲区和索引缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        initialData: geometry.vertices as BufferSource,
        label: 'Runway Vertex Buffer',
      })
    );

    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        initialData: geometry.indices as BufferSource,
        label: 'Runway Index Buffer',
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

    // 8. 创建 LOD 控制 Uniform 缓冲区
    const lodBuffer = runner.track(
      runner.device.createBuffer({
        size: 16, // 对齐到 16 字节
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'LOD Control Uniform Buffer',
      })
    );

    // 9. 创建纹理
    // eslint-disable-next-line no-console
    console.log('[Mipmap Demo] Creating textures...');

    const baseSize = 256;
    const maxMipLevels = Math.floor(Math.log2(baseSize)) + 1; // 9 levels: 256->1

    // 普通棋盘格纹理数据
    const checkerData = ProceduralTexture.checkerboard({
      width: baseSize,
      height: baseSize,
      cellSize: 16,
      colorA: [255, 255, 255, 255],
      colorB: [64, 64, 64, 255],
    });

    // 9.1 无 Mipmap 纹理
    const texture_no_mips = runner.track(
      runner.device.createTexture({
        width: baseSize,
        height: baseSize,
        mipLevelCount: 1, // 只有 Level 0
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Texture No Mipmaps',
      })
    );
    texture_no_mips.update(checkerData.data as BufferSource);

    // 9.2 有 Mipmap 纹理（普通）
    const texture_with_mips = runner.track(
      runner.device.createTexture({
        width: baseSize,
        height: baseSize,
        mipLevelCount: maxMipLevels,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Texture With Mipmaps',
      })
    );
    texture_with_mips.update(checkerData.data as BufferSource);

    // 生成 Mipmap
    const mipmapLevels = TextureLoader.generateMipmaps(checkerData.data, baseSize, baseSize);
    for (let level = 0; level < mipmapLevels.length; level++) {
      const levelWidth = Math.max(1, baseSize >> (level + 1));
      const levelHeight = Math.max(1, baseSize >> (level + 1));
      texture_with_mips.update(
        mipmapLevels[level] as BufferSource,
        0,
        0,
        0,
        levelWidth,
        levelHeight,
        undefined,
        level + 1
      );
    }

    // 9.3 有 Mipmap 纹理（彩色标记）
    const texture_colored = runner.track(
      runner.device.createTexture({
        width: baseSize,
        height: baseSize,
        mipLevelCount: maxMipLevels,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Colored Mipmap Texture',
      })
    );

    // 为每个 LOD 级别生成不同颜色的纹理
    for (let level = 0; level < maxMipLevels; level++) {
      const levelSize = Math.max(1, baseSize >> level);
      const levelData = generateColoredMipmapLevel(levelSize, level, maxMipLevels);
      texture_colored.update(levelData as BufferSource, 0, 0, 0, levelSize, levelSize, undefined, level);
    }

    // eslint-disable-next-line no-console
    console.log(`[Mipmap Demo] Created textures with ${maxMipLevels} mip levels`);

    // 10. 创建三个采样器
    const sampler_no_mip = runner.track(
      runner.device.createSampler({
        minFilter: MSpec.RHIFilterMode.LINEAR,
        magFilter: MSpec.RHIFilterMode.LINEAR,
        mipmapFilter: MSpec.RHIFilterMode.NEAREST,
        addressModeU: MSpec.RHIAddressMode.REPEAT,
        addressModeV: MSpec.RHIAddressMode.REPEAT,
        label: 'Sampler No Mipmap',
      })
    );

    const sampler_bilinear = runner.track(
      runner.device.createSampler({
        minFilter: MSpec.RHIFilterMode.LINEAR_MIPMAP_NEAREST,
        magFilter: MSpec.RHIFilterMode.LINEAR,
        mipmapFilter: MSpec.RHIFilterMode.NEAREST,
        addressModeU: MSpec.RHIAddressMode.REPEAT,
        addressModeV: MSpec.RHIAddressMode.REPEAT,
        label: 'Sampler Bilinear',
      })
    );

    const sampler_trilinear = runner.track(
      runner.device.createSampler({
        minFilter: MSpec.RHIFilterMode.LINEAR_MIPMAP_LINEAR,
        magFilter: MSpec.RHIFilterMode.LINEAR,
        mipmapFilter: MSpec.RHIFilterMode.LINEAR,
        addressModeU: MSpec.RHIAddressMode.REPEAT,
        addressModeV: MSpec.RHIAddressMode.REPEAT,
        label: 'Sampler Trilinear',
      })
    );

    // 11. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Mipmap Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Mipmap Fragment Shader',
      })
    );

    // 12. 创建绑定组布局
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
          name: 'LodControl',
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

    // 13. 创建管线布局
    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Mipmap Pipeline Layout')
    );

    // 14. 创建渲染管线
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout: geometry.layout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Mipmap Pipeline',
      })
    );

    // 15. 创建纹理视图
    const view_no_mips = runner.track(texture_no_mips.createView());
    const view_with_mips = runner.track(texture_with_mips.createView());
    const view_colored = runner.track(texture_colored.createView());

    // 16. 创建 BindGroup（3 种采样器 × 2 种纹理）
    const createBindGroups = (useColoredTexture: boolean) => {
      const normalView = useColoredTexture ? view_colored : view_with_mips;

      return [
        // 左侧：无 Mipmap
        runner.track(
          runner.device.createBindGroup(bindGroupLayout, [
            { binding: 0, resource: { buffer: transformBuffer } },
            { binding: 1, resource: { buffer: lodBuffer } },
            { binding: 2, resource: view_no_mips },
            { binding: 3, resource: sampler_no_mip },
          ])
        ),
        // 中间：双线性
        runner.track(
          runner.device.createBindGroup(bindGroupLayout, [
            { binding: 0, resource: { buffer: transformBuffer } },
            { binding: 1, resource: { buffer: lodBuffer } },
            { binding: 2, resource: normalView },
            { binding: 3, resource: sampler_bilinear },
          ])
        ),
        // 右侧：三线性
        runner.track(
          runner.device.createBindGroup(bindGroupLayout, [
            { binding: 0, resource: { buffer: transformBuffer } },
            { binding: 1, resource: { buffer: lodBuffer } },
            { binding: 2, resource: normalView },
            { binding: 3, resource: sampler_trilinear },
          ])
        ),
      ];
    };

    let bindGroups = createBindGroups(false);

    // 17. 模型矩阵（保持单位矩阵）
    const modelMatrix = new MMath.Matrix4();

    // 18. 更新 LOD 缓冲区
    const updateLodBuffer = () => {
      const lodData = new Float32Array([forcedLod, 0, 0, 0]);
      lodBuffer.update(lodData, 0);
    };
    updateLodBuffer();

    // ==================== GUI 控制 ====================

    const gui = new SimpleGUI();

    gui.addSeparator('LOD Control');

    gui.add('Forced LOD', {
      value: forcedLod,
      min: -1,
      max: 8,
      step: 0.5,
      onChange: (value) => {
        forcedLod = value as number;
        updateLodBuffer();
      },
    });

    gui.add('Show LOD Colors', {
      value: showLodColors,
      onChange: (value) => {
        showLodColors = value as boolean;
        bindGroups = createBindGroups(showLodColors);
      },
    });

    // ==================== 预分配渲染循环数据 ====================
    const transformData = new Float32Array(64);

    // ==================== 渲染循环 ====================

    runner.start((_dt) => {
      orbit.update(_dt);
      stats.begin();

      // 计算宽高比（三分屏调整）
      const viewMatrix = orbit.getViewMatrix();
      const aspectRatio = runner.width / runner.height / 3;
      const projMatrix = orbit.getProjectionMatrix(aspectRatio);

      // 更新 Transform Uniform（使用预分配数组）
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformBuffer.update(transformData, 0);

      const { encoder, passDescriptor } = runner.beginFrame();
      const renderPass = encoder.beginRenderPass(passDescriptor);

      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);

      const viewportWidth = runner.width / 3;
      const viewportHeight = runner.height;

      // 左侧视口：无 Mipmap
      renderPass.setViewport(0, 0, viewportWidth, viewportHeight);
      renderPass.setBindGroup(0, bindGroups[0]);
      renderPass.drawIndexed(geometry.indexCount!, 1, 0, 0, 0);

      // 中间视口：双线性
      renderPass.setViewport(viewportWidth, 0, viewportWidth, viewportHeight);
      renderPass.setBindGroup(0, bindGroups[1]);
      renderPass.drawIndexed(geometry.indexCount!, 1, 0, 0, 0);

      // 右侧视口：三线性
      renderPass.setViewport(viewportWidth * 2, 0, viewportWidth, viewportHeight);
      renderPass.setBindGroup(0, bindGroups[2]);
      renderPass.drawIndexed(geometry.indexCount!, 1, 0, 0, 0);

      renderPass.end();
      runner.endFrame(encoder);

      stats.end();
    });

    // ==================== 事件处理 ====================

    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      'L: 锁定/解锁 LOD（快速切换自动/手动）',
      '↑/↓: 调整 LOD 级别',
      'C: 切换 LOD 颜色显示',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '',
      '左侧 = 无 Mipmap | 中间 = 双线性 | 右侧 = 三线性',
    ]);

    // L 键锁定/解锁 LOD
    runner.onKey('l', () => {
      if (forcedLod < 0) {
        forcedLod = 3;
      } else {
        forcedLod = -1;
      }
      updateLodBuffer();
      gui.set('Forced LOD', forcedLod);
      // eslint-disable-next-line no-console
      console.log(`[Mipmap Demo] LOD ${forcedLod < 0 ? 'unlocked (auto)' : `locked to ${forcedLod}`}`);
    });

    // 方向键调整 LOD
    runner.onKey('ArrowUp', (_, event) => {
      event.preventDefault();
      if (forcedLod < 8) {
        forcedLod = Math.min(8, forcedLod + 0.5);
        if (forcedLod < 0) {
          forcedLod = 0;
        }
        updateLodBuffer();
        gui.set('Forced LOD', forcedLod);
      }
    });

    runner.onKey('ArrowDown', (_, event) => {
      event.preventDefault();
      if (forcedLod >= -1) {
        forcedLod = Math.max(-1, forcedLod - 0.5);
        updateLodBuffer();
        gui.set('Forced LOD', forcedLod);
      }
    });

    // C 键切换 LOD 颜色显示
    runner.onKey('c', () => {
      showLodColors = !showLodColors;
      bindGroups = createBindGroups(showLodColors);
      gui.set('Show LOD Colors', showLodColors);
      // eslint-disable-next-line no-console
      console.log(`[Mipmap Demo] LOD colors: ${showLodColors ? 'ON' : 'OFF'}`);
    });

    runner.onKey('Escape', () => {
      // eslint-disable-next-line no-console
      console.log('[Mipmap Demo] Exiting...');
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
    console.log('[Mipmap Demo] Initialized successfully!');
    // eslint-disable-next-line no-console
    console.log('[Mipmap Demo] Three-panel comparison: No Mipmap | Bilinear | Trilinear');
  } catch (error) {
    console.error('[Mipmap Demo] Error:', error);
    throw error;
  }
})();
