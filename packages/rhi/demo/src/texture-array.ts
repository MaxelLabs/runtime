/**
 * texture-array.ts
 * 2D 纹理数组演示 Demo (WebGL2)
 *
 * 功能演示：
 * - 创建 2D 纹理数组，包含多个层 (8 层)
 * - 每层有不同的程序化纹理
 * - 通过滑块切换显示不同层
 * - 展示纹理数组的内存优势
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, OrbitController, Stats, ProceduralTexture, SimpleGUI } from './utils';

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

uniform sampler2DArray uTextureArray;
uniform LayerControl {
  float uLayerIndex;
  float uLayerCount;
};

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  // 使用 layer 索引采样特定层
  vec3 texCoord = vec3(vTexCoord, uLayerIndex);
  vec4 color = texture(uTextureArray, texCoord);

  // 如果 layer 超出范围，显示紫色
  if (uLayerIndex >= uLayerCount || uLayerIndex < 0.0) {
    color = vec4(0.8, 0.2, 0.8, 1.0);
  }

  fragColor = color;
}
`;

// ==================== 几何体创建 ====================

interface QuadGeometry {
  vertices: Float32Array;
  vertexCount: number;
}

/**
 * 创建四边形几何体（用于显示纹理）
 */
function createQuad(size: number = 4.0, uvScale: number = 2.0): QuadGeometry {
  const halfSize = size / 2;
  const vertices = new Float32Array([
    // 位置 (x, y, z) + UV (u, v)
    // 第一个三角形
    -halfSize,
    0,
    -halfSize,
    0,
    0,
    -halfSize,
    0,
    halfSize,
    0,
    uvScale,
    halfSize,
    0,
    halfSize,
    uvScale,
    uvScale,

    // 第二个三角形
    -halfSize,
    0,
    -halfSize,
    0,
    0,
    halfSize,
    0,
    halfSize,
    uvScale,
    uvScale,
    halfSize,
    0,
    -halfSize,
    uvScale,
    0,
  ]);

  return {
    vertices,
    vertexCount: 6,
  };
}

// ==================== 层纹理生成函数 ====================

/**
 * 生成圆形图案纹理
 */
function generateCircles(width: number, height: number): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // 计算到中心的距离
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 创建多个同心圆
      const radius1 = maxRadius * 0.3;
      const radius2 = maxRadius * 0.6;
      const radius3 = maxRadius * 0.9;

      if (distance < radius1) {
        // 最内圈 - 红色
        data[i] = 255;
        data[i + 1] = 100;
        data[i + 2] = 100;
      } else if (distance < radius2) {
        // 中圈 - 绿色
        data[i] = 100;
        data[i + 1] = 255;
        data[i + 2] = 100;
      } else if (distance < radius3) {
        // 外圈 - 蓝色
        data[i] = 100;
        data[i + 1] = 100;
        data[i + 2] = 255;
      } else {
        // 背景 - 深灰色
        const pattern = (x + y) % 20 < 10 ? 80 : 60;
        data[i] = pattern;
        data[i + 1] = pattern;
        data[i + 2] = pattern;
      }
      data[i + 3] = 255;
    }
  }

  return data;
}

/**
 * 生成条纹图案纹理
 */
function generateStripes(width: number, height: number): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  const stripeWidth = 16;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const stripeIndex = Math.floor(x / stripeWidth) % 4;

      switch (stripeIndex) {
        case 0: // 红色条纹
          data[i] = 255;
          data[i + 1] = 50;
          data[i + 2] = 50;
          break;
        case 1: // 绿色条纹
          data[i] = 50;
          data[i + 1] = 255;
          data[i + 2] = 50;
          break;
        case 2: // 蓝色条纹
          data[i] = 50;
          data[i + 1] = 50;
          data[i + 2] = 255;
          break;
        case 3: // 黄色条纹
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 50;
          break;
      }
      data[i + 3] = 255;
    }
  }

  return data;
}

/**
 * 生成随机像素纹理
 */
function generateRandomPixels(width: number, height: number): Uint8Array {
  const data = new Uint8Array(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    // 生成随机颜色
    data[i] = Math.floor(Math.random() * 256); // R
    data[i + 1] = Math.floor(Math.random() * 256); // G
    data[i + 2] = Math.floor(Math.random() * 256); // B
    data[i + 3] = 255; // A
  }

  return data;
}

/**
 * 生成波浪图案纹理
 */
function generateWaves(width: number, height: number): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  const waveCount = 8;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // 创建正弦波
      const wave1 = Math.sin((x / width) * Math.PI * waveCount) * 0.5 + 0.5;
      const wave2 = Math.sin((y / height) * Math.PI * waveCount) * 0.5 + 0.5;
      const combined = (wave1 + wave2) / 2;

      // 从蓝色到青色渐变
      data[i] = Math.floor(combined * 100); // R
      data[i + 1] = Math.floor(combined * 200); // G
      data[i + 2] = 255; // B
      data[i + 3] = 255; // A
    }
  }

  return data;
}

/**
 * 生成混合图案纹理
 */
function generateMixedPattern(width: number, height: number): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  const gridSize = 32;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const gridX = Math.floor(x / gridSize);
      const gridY = Math.floor(y / gridSize);
      const cellIndex = (gridX + gridY) % 3;

      switch (cellIndex) {
        case 0: {
          // 棋盘格模式
          const checker = (Math.floor(x / (gridSize / 4)) + Math.floor(y / (gridSize / 4))) % 2;
          if (checker === 0) {
            data[i] = 200;
            data[i + 1] = 200;
            data[i + 2] = 200;
          } else {
            data[i] = 50;
            data[i + 1] = 50;
            data[i + 2] = 50;
          }
          break;
        }
        case 1: {
          // 径向渐变
          const dx = x - (gridX * gridSize + gridSize / 2);
          const dy = y - (gridY * gridSize + gridSize / 2);
          const dist = Math.sqrt(dx * dx + dy * dy) / (gridSize / 2);
          data[i] = Math.floor(dist * 255);
          data[i + 1] = Math.floor((1 - dist) * 255);
          data[i + 2] = 128;
          break;
        }
        case 2: {
          // 对角线
          const diagonal = (x % gridSize) + (y % gridSize) < gridSize ? 1 : 0;
          data[i] = diagonal * 255;
          data[i + 1] = diagonal * 128;
          data[i + 2] = (1 - diagonal) * 255;
          break;
        }
      }
      data[i + 3] = 255;
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
      name: 'Texture Array Demo',
      clearColor: [0.05, 0.05, 0.1, 1.0],
    });

    await runner.init();

    // 2. 检查 WebGL2 支持
    // WebGL2 是纹理数组功能的必要条件
    // 注意：实际检测应根据具体的设备 API 进行

    // 3. 初始化性能监控和相机控制
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 6,
      target: [0, 0, 0],
      enableDamping: true,
      autoRotate: false,
      minElevation: Math.PI * 0.1,
      maxElevation: Math.PI * 0.8,
    });

    // 4. 状态变量
    let currentLayer = 0;
    const layerCount = 8;
    let uvScale = 2.0;

    // 5. 创建四边形几何体
    let quadGeometry = createQuad(4.0, uvScale);

    // 6. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: quadGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'dynamic',
        initialData: quadGeometry.vertices as BufferSource,
        label: 'Quad Vertex Buffer',
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

    // 8. 创建层控制 Uniform 缓冲区
    const layerBuffer = runner.track(
      runner.device.createBuffer({
        size: 16, // 对齐到 16 字节
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Layer Control Uniform Buffer',
      })
    );

    // 9. 创建纹理数组

    const textureSize = 256;
    const arrayTexture = runner.track(
      runner.device.createTexture({
        width: textureSize,
        height: textureSize,
        depthOrArrayLayers: layerCount,
        dimension: MSpec.RHITextureType.TEXTURE_2D_ARRAY,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING | MSpec.RHITextureUsage.COPY_DST,
        label: 'Demo Texture Array',
      })
    );

    // 10. 生成并更新每一层的纹理
    const layerGenerators = [
      // Layer 0: 棋盘格
      () =>
        ProceduralTexture.checkerboard({
          width: textureSize,
          height: textureSize,
          cellSize: 16,
          colorA: [255, 255, 255, 255],
          colorB: [64, 64, 64, 255],
        }).data,

      // Layer 1: 渐变
      () =>
        ProceduralTexture.gradient({
          width: textureSize,
          height: textureSize,
          direction: 'diagonal',
          startColor: [255, 0, 0, 255],
          endColor: [0, 0, 255, 255],
        }).data,

      // Layer 2: 噪声
      () =>
        ProceduralTexture.noise({
          width: textureSize,
          height: textureSize,
          frequency: 0.05,
          octaves: 4,
        }).data,

      // Layer 3: 圆形图案
      () => generateCircles(textureSize, textureSize),

      // Layer 4: 条纹
      () => generateStripes(textureSize, textureSize),

      // Layer 5: 随机像素
      () => generateRandomPixels(textureSize, textureSize),

      // Layer 6: 波浪
      () => generateWaves(textureSize, textureSize),

      // Layer 7: 混合图案
      () => generateMixedPattern(textureSize, textureSize),
    ];

    const layerNames = [
      'Checkerboard',
      'Gradient',
      'Noise',
      'Circles',
      'Stripes',
      'Random Pixels',
      'Waves',
      'Mixed Pattern',
    ];

    // 更新每一层
    for (let layer = 0; layer < layerCount; layer++) {
      const layerData = layerGenerators[layer]();
      arrayTexture.update(layerData as BufferSource, 0, 0, layer);
    }

    
    // 11. 创建采样器
    const sampler = runner.track(
      runner.device.createSampler({
        magFilter: MSpec.RHIFilterMode.LINEAR,
        minFilter: MSpec.RHIFilterMode.LINEAR,
        addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        label: 'Texture Array Sampler',
      })
    );

    // 12. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Texture Array Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Texture Array Fragment Shader',
      })
    );

    // 13. 创建绑定组布局
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
          name: 'LayerControl',
        },
        {
          binding: 2,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          texture: { sampleType: 'float', viewDimension: '2d-array' },
          name: 'uTextureArray',
        },
        {
          binding: 3,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
          name: 'uSampler',
        },
      ])
    );

    // 14. 创建管线布局
    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Texture Array Pipeline Layout')
    );

    // 15. 顶点布局
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

    // 16. 创建渲染管线
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Texture Array Pipeline',
      })
    );

    // 17. 创建绑定组
    const textureView = arrayTexture.createView();
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: { buffer: transformBuffer } },
        { binding: 1, resource: { buffer: layerBuffer } },
        { binding: 2, resource: textureView },
        { binding: 3, resource: sampler },
      ])
    );

    // 18. 模型矩阵
    const modelMatrix = new MMath.Matrix4();
    modelMatrix.rotateX((-Math.PI / 2) * 0.6);

    // 19. 更新函数
    const updateLayerBuffer = () => {
      const layerData = new Float32Array([currentLayer, layerCount, 0, 0]);
      layerBuffer.update(layerData, 0);
    };
    updateLayerBuffer();

    const updateVertexBuffer = () => {
      quadGeometry = createQuad(4.0, uvScale);
      vertexBuffer.update(quadGeometry.vertices as BufferSource, 0);
    };

    // ==================== GUI 控制 ====================

    const gui = new SimpleGUI();

    gui.addSeparator('Texture Array Control');

    gui.add('Layer Index', {
      value: currentLayer,
      min: 0,
      max: layerCount - 1,
      step: 1,
      onChange: (value) => {
        currentLayer = value as number;
        updateLayerBuffer();
      },
    });

    gui.add('Layer Name', {
      value: layerNames[currentLayer],
      options: layerNames,
      onChange: (value) => {
        const index = layerNames.indexOf(value as string);
        if (index !== -1) {
          currentLayer = index;
          updateLayerBuffer();
          gui.set('Layer Index', currentLayer);
        }
      },
    });

    gui.addSeparator('Display');

    gui.add('UV Scale', {
      value: uvScale,
      min: 0.5,
      max: 4,
      step: 0.5,
      onChange: (value) => {
        uvScale = value as number;
        updateVertexBuffer();
      },
    });

    gui.addSeparator('Texture Info');
    // 注意：SimpleGUI 可能不支持 addInfo，使用 separator 代替

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
      renderPass.setBindGroup(0, bindGroup);

      // 绘制
      renderPass.draw(quadGeometry.vertexCount, 1, 0, 0);

      renderPass.end();
      runner.endFrame(encoder);

      stats.end();
    });

    // ==================== 事件处理 ====================

    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      '←/→: 切换纹理层',
      '1-8: 快速跳转到特定层',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
    ]);

    // 方向键切换层
    runner.onKey('ArrowLeft', () => {
      currentLayer = Math.max(0, currentLayer - 1);
      updateLayerBuffer();
      gui.set('Layer Index', currentLayer);
      gui.set('Layer Name', layerNames[currentLayer]);
    });

    runner.onKey('ArrowRight', () => {
      currentLayer = Math.min(layerCount - 1, currentLayer + 1);
      updateLayerBuffer();
      gui.set('Layer Index', currentLayer);
      gui.set('Layer Name', layerNames[currentLayer]);
    });

    // 数字键快速跳转
    for (let i = 1; i <= layerCount; i++) {
      runner.onKey(i.toString(), () => {
        currentLayer = i - 1;
        updateLayerBuffer();
        gui.set('Layer Index', currentLayer);
        gui.set('Layer Name', layerNames[currentLayer]);
      });
    }

    runner.onKey('Escape', () => {
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

  } catch (error) {
    throw error;
  }
})();
