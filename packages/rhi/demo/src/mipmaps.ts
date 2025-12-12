/**
 * mipmaps.ts
 * Mipmap 生成和使用演示 Demo
 *
 * 功能演示：
 * - 自动生成 Mipmap 链
 * - 手动 LOD 控制（textureLod）
 * - 三种过滤模式对比（无 Mipmap / 双线性 / 三线性）
 * - 带颜色标记的 LOD 级别可视化
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, OrbitController, Stats, TextureLoader, ProceduralTexture, SimpleGUI } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = /* glsl */ `#version 300 es
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

const fragmentShaderSource = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uTexture;
uniform LodControl {
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

// ==================== Mipmap 模式配置 ====================

interface MipmapConfig {
  name: string;
  description: string;
  minFilter: MSpec.RHIFilterMode;
  magFilter: MSpec.RHIFilterMode;
  mipmapFilter: MSpec.RHIFilterMode;
}

const MIPMAP_CONFIGS: MipmapConfig[] = [
  {
    name: 'noMipmap',
    description: '无 Mipmap - 远处会出现摩尔纹',
    minFilter: MSpec.RHIFilterMode.LINEAR,
    magFilter: MSpec.RHIFilterMode.LINEAR,
    mipmapFilter: MSpec.RHIFilterMode.NEAREST,
  },
  {
    name: 'bilinear',
    description: '双线性 Mipmap - 级别间跳跃',
    minFilter: MSpec.RHIFilterMode.LINEAR_MIPMAP_NEAREST,
    magFilter: MSpec.RHIFilterMode.LINEAR,
    mipmapFilter: MSpec.RHIFilterMode.NEAREST,
  },
  {
    name: 'trilinear',
    description: '三线性 Mipmap - 平滑过渡',
    minFilter: MSpec.RHIFilterMode.LINEAR_MIPMAP_LINEAR,
    magFilter: MSpec.RHIFilterMode.LINEAR,
    mipmapFilter: MSpec.RHIFilterMode.LINEAR,
  },
];

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

// ==================== 延伸平面几何体 ====================

interface PlaneGeometry {
  vertices: Float32Array;
  vertexCount: number;
}

/**
 * 创建延伸平面几何体（用于展示远近距离的 Mipmap 效果）
 */
function createExtendedPlane(
  width: number,
  height: number,
  widthSegments: number,
  heightSegments: number,
  uvScale: number = 4.0
): PlaneGeometry {
  const vertices: number[] = [];

  // 每个顶点包含：位置 (3) + UV (2) = 5 个浮点数
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const u0 = x / widthSegments;
      const u1 = (x + 1) / widthSegments;
      const v0 = y / heightSegments;
      const v1 = (y + 1) / heightSegments;

      const x0 = (u0 - 0.5) * width;
      const x1 = (u1 - 0.5) * width;
      const z0 = (v0 - 0.5) * height;
      const z1 = (v1 - 0.5) * height;

      // 第一个三角形
      vertices.push(x0, 0, z0, u0 * uvScale, v0 * uvScale);
      vertices.push(x0, 0, z1, u0 * uvScale, v1 * uvScale);
      vertices.push(x1, 0, z1, u1 * uvScale, v1 * uvScale);

      // 第二个三角形
      vertices.push(x0, 0, z0, u0 * uvScale, v0 * uvScale);
      vertices.push(x1, 0, z1, u1 * uvScale, v1 * uvScale);
      vertices.push(x1, 0, z0, u1 * uvScale, v0 * uvScale);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    vertexCount: widthSegments * heightSegments * 6,
  };
}

// ==================== 主程序 ====================

(async function main() {
  try {
    // 1. 初始化 DemoRunner
    const runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Mipmap Demo',
      clearColor: [0.06, 0.06, 0.1, 1.0],
    });

    await runner.init();

    // 2. 初始化性能监控和相机控制
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 8,
      target: [0, 0, -5],
      enableDamping: true,
      autoRotate: false,
      minElevation: 0.1,
      maxElevation: Math.PI * 0.45,
    });

    // 3. 状态变量
    let currentModeIndex = 2; // 默认三线性
    let forcedLod = -1.0; // -1 = 自动
    let uvScale = 4.0;
    let tiltAngle = 60;
    let showLodColors = false;

    // 4. 创建延伸平面几何体
    let planeGeometry = createExtendedPlane(40, 40, 20, 20, uvScale);

    // 5. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: planeGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'dynamic',
        initialData: planeGeometry.vertices as BufferSource,
        label: 'Mipmap Plane Vertex Buffer',
      })
    );

    // 6. 创建变换矩阵 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // 7. 创建 LOD 控制 Uniform 缓冲区
    const lodBuffer = runner.track(
      runner.device.createBuffer({
        size: 16, // 对齐到 16 字节
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'LOD Control Uniform Buffer',
      })
    );

    // 8. 创建普通棋盘格纹理（带 Mipmap）
    // eslint-disable-next-line no-console
    console.log('[Mipmap Demo] Creating textures...');

    const baseSize = 256;
    const maxMipLevels = Math.floor(Math.log2(baseSize)) + 1; // 9 levels: 256->1

    // 普通棋盘格纹理
    const checkerData = ProceduralTexture.checkerboard({
      width: baseSize,
      height: baseSize,
      cellSize: 16,
      colorA: [255, 255, 255, 255],
      colorB: [64, 64, 64, 255],
    });

    const normalTexture = runner.track(
      runner.device.createTexture({
        width: baseSize,
        height: baseSize,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        mipLevelCount: maxMipLevels,
        label: 'Normal Checkerboard Texture',
      })
    );
    normalTexture.update(checkerData.data as BufferSource);

    // 生成 Mipmap
    const mipmapLevels = TextureLoader.generateMipmaps(checkerData.data, baseSize, baseSize);
    for (let level = 0; level < mipmapLevels.length; level++) {
      normalTexture.update(mipmapLevels[level] as BufferSource, 0, 0, 0, undefined, undefined, undefined, level + 1);
    }

    // 9. 创建带颜色标记的纹理
    const coloredTexture = runner.track(
      runner.device.createTexture({
        width: baseSize,
        height: baseSize,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        mipLevelCount: maxMipLevels,
        label: 'Colored Mipmap Texture',
      })
    );

    // 为每个 LOD 级别生成不同颜色的纹理
    for (let level = 0; level < maxMipLevels; level++) {
      const levelSize = Math.max(1, baseSize >> level);
      const levelData = generateColoredMipmapLevel(levelSize, level, maxMipLevels);
      coloredTexture.update(levelData as BufferSource, 0, 0, 0, undefined, undefined, undefined, level);
    }

    // eslint-disable-next-line no-console
    console.log(`[Mipmap Demo] Created textures with ${maxMipLevels} mip levels`);

    // 10. 为每种模式创建采样器
    const samplers = MIPMAP_CONFIGS.map((config) =>
      runner.track(
        runner.device.createSampler({
          magFilter: config.magFilter,
          minFilter: config.minFilter,
          mipmapFilter: config.mipmapFilter,
          addressModeU: MSpec.RHIAddressMode.REPEAT,
          addressModeV: MSpec.RHIAddressMode.REPEAT,
          label: `Sampler: ${config.name}`,
        })
      )
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

    // 14. 顶点布局
    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0,
          stride: 20, // 3 * 4 (position) + 2 * 4 (uv)
          stepMode: 'vertex',
          attributes: [
            { name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 },
            { name: 'aTexCoord', format: MSpec.RHIVertexFormat.FLOAT32x2, offset: 12, shaderLocation: 1 },
          ],
        },
      ],
    };

    // 15. 创建渲染管线
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Mipmap Pipeline',
      })
    );

    // 16. 创建绑定组（每个模式 x 两种纹理）
    const normalTextureView = normalTexture.createView();
    const coloredTextureView = coloredTexture.createView();

    const createBindGroup = (samplerIndex: number, useColoredTexture: boolean) => {
      return runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: { buffer: transformBuffer } },
        { binding: 1, resource: { buffer: lodBuffer } },
        { binding: 2, resource: useColoredTexture ? coloredTextureView : normalTextureView },
        { binding: 3, resource: samplers[samplerIndex] },
      ]);
    };

    let currentBindGroup = runner.track(createBindGroup(currentModeIndex, showLodColors));

    // 17. 模型矩阵
    const modelMatrix = new MMath.Matrix4();

    const updateModelMatrix = () => {
      modelMatrix.identity();
      modelMatrix.rotateX((-tiltAngle * Math.PI) / 180);
      const translation = new MMath.Vector3(0, 0, -10);
      modelMatrix.translate(translation);
    };
    updateModelMatrix();

    // 18. 更新函数
    const updateBindGroup = () => {
      currentBindGroup = runner.track(createBindGroup(currentModeIndex, showLodColors));
    };

    const updateLodBuffer = () => {
      const lodData = new Float32Array([forcedLod, 0, 0, 0]);
      lodBuffer.update(lodData, 0);
    };
    updateLodBuffer();

    const updateVertexBuffer = () => {
      planeGeometry = createExtendedPlane(40, 40, 20, 20, uvScale);
      vertexBuffer.update(planeGeometry.vertices as BufferSource, 0);
    };

    // ==================== GUI 控制 ====================

    const gui = new SimpleGUI();

    gui.addSeparator('Mipmap Mode');

    const modeNames = MIPMAP_CONFIGS.map((c) => c.name);
    gui.add('Mode', {
      value: modeNames[currentModeIndex],
      options: modeNames,
      onChange: (value) => {
        const index = MIPMAP_CONFIGS.findIndex((c) => c.name === value);
        if (index !== -1) {
          currentModeIndex = index;
          updateBindGroup();
          // eslint-disable-next-line no-console
          console.log(`[Mipmap Demo] Switched to: ${MIPMAP_CONFIGS[index].description}`);
        }
      },
    });

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
        updateBindGroup();
      },
    });

    gui.addSeparator('Scene');

    gui.add('UV Scale', {
      value: uvScale,
      min: 1,
      max: 10,
      step: 0.5,
      onChange: (value) => {
        uvScale = value as number;
        updateVertexBuffer();
      },
    });

    gui.add('Tilt Angle', {
      value: tiltAngle,
      min: 0,
      max: 90,
      step: 5,
      onChange: (value) => {
        tiltAngle = value as number;
        updateModelMatrix();
      },
    });

    // ==================== 渲染循环 ====================

    runner.start((_dt) => {
      orbit.update(_dt);
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

      const { encoder, passDescriptor } = runner.beginFrame();
      const renderPass = encoder.beginRenderPass(passDescriptor);

      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setBindGroup(0, currentBindGroup);

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
      '1-3: 切换 Mipmap 模式',
      'L: 锁定/解锁 LOD',
      '↑/↓: 调整 LOD 级别',
      'C: 切换 LOD 颜色显示',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
    ]);

    // 快捷键 1-3 切换模式
    MIPMAP_CONFIGS.forEach((config, index) => {
      const key = (index + 1).toString();
      runner.onKey(key, () => {
        currentModeIndex = index;
        updateBindGroup();
        gui.set('Mode', config.name);
        // eslint-disable-next-line no-console
        console.log(`[Mipmap Demo] Switched to: ${config.description}`);
      });
    });

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
      updateBindGroup();
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
    console.log('[Mipmap Demo] Available modes:');
    MIPMAP_CONFIGS.forEach((config, i) => {
      // eslint-disable-next-line no-console
      console.log(`  ${i + 1}. ${config.name} - ${config.description}`);
    });
  } catch (error) {
    console.error('[Mipmap Demo] Error:', error);
    throw error;
  }
})();
