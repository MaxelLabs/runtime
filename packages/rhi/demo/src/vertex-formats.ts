/**
 * vertex-formats.ts
 * 顶点格式演示 Demo
 *
 * 功能演示：
 * - 不同的顶点格式和数据类型
 * - FLOAT32x3 (位置) vs FLOAT16x4 (半精度)
 * - UNORM8x4 (归一化颜色) vs FLOAT32x3 (浮点颜色)
 * - SNORM16x2 (归一化法线) vs FLOAT32x3 (浮点法线)
 * - 实时显示内存使用对比
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, SimpleGUI, OrbitController, Stats } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

// 不同格式的属性
in vec3 aPosition;      // 位置（FLOAT32x3）
in vec4 aColor;         // 颜色（UNORM8x4，自动归一化到 0-1）
in vec2 aNormal;        // 法线XZ（SNORM16x2，自动归一化到 -1 到 1）

out vec4 vColor;
out vec3 vNormal;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

void main() {
  vColor = aColor;
  // 恢复法线为3D向量 (假设Y为0.5)
  vNormal = normalize(vec3(aNormal.x, 0.5, aNormal.y));

  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

in vec4 vColor;
in vec3 vNormal;
out vec4 fragColor;

void main() {
  // 简单的漫反射光照
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float diffuse = max(dot(vNormal, lightDir), 0.3);
  fragColor = vColor * (0.7 + 0.3 * diffuse);
}
`;

// ==================== 顶点格式配置 ====================

interface VertexFormatConfig {
  name: string;
  description: string;
  bytesPerVertex: number;
  memoryPercent: number;
  format: {
    position: MSpec.RHIVertexFormat;
    color: MSpec.RHIVertexFormat;
    normal: MSpec.RHIVertexFormat;
  };
  stride: number;
}

const VERTEX_FORMATS: Record<string, VertexFormatConfig> = {
  standard: {
    name: 'Standard (FLOAT32)',
    description: '标准浮点格式',
    // FLOAT32x3(12) + FLOAT32x3(12) + FLOAT32(4) = 28 字节
    bytesPerVertex: 28,
    memoryPercent: 100,
    format: {
      position: MSpec.RHIVertexFormat.FLOAT32x3,
      color: MSpec.RHIVertexFormat.FLOAT32x3,
      normal: MSpec.RHIVertexFormat.FLOAT32,
    },
    stride: 28,
  },
  compressed_color: {
    name: 'Compressed Color',
    description: '使用8位无符号归一化颜色（节省 28%）',
    // FLOAT32x3(12) + UNORM8x4(4) + FLOAT32(4) = 20 字节
    bytesPerVertex: 20,
    memoryPercent: 72,
    format: {
      position: MSpec.RHIVertexFormat.FLOAT32x3,
      color: MSpec.RHIVertexFormat.UNORM8x4,
      normal: MSpec.RHIVertexFormat.FLOAT32,
    },
    stride: 20,
  },
  half_precision: {
    name: 'Half Precision (FLOAT16)',
    description: '使用半精度浮点位置（节省 14%）',
    // FLOAT16x4(8) + FLOAT32x3(12) + FLOAT16x2(4) = 24 字节
    bytesPerVertex: 24,
    memoryPercent: 86,
    format: {
      position: MSpec.RHIVertexFormat.FLOAT16x4,
      color: MSpec.RHIVertexFormat.FLOAT32x3,
      normal: MSpec.RHIVertexFormat.FLOAT16x2,
    },
    stride: 24,
  },
  ultra_compact: {
    name: 'Ultra Compact',
    description: '最紧凑格式：半精度 + 8位颜色（节省 43%）',
    // FLOAT16x4(8) + UNORM8x4(4) + SNORM16x2(4) = 16 字节
    bytesPerVertex: 16,
    memoryPercent: 57,
    format: {
      position: MSpec.RHIVertexFormat.FLOAT16x4,
      color: MSpec.RHIVertexFormat.UNORM8x4,
      normal: MSpec.RHIVertexFormat.SNORM16x2,
    },
    stride: 16,
  },
};

// ==================== 几何体生成 ====================

/**
 * 使用指定顶点格式生成立方体
 */
function generateCubeWithFormat(format: VertexFormatConfig): {
  vertices: BufferSource;
  stride: number;
  indices: Uint16Array;
} {
  // 立方体顶点位置 (标准化坐标)
  const positions: number[] = [
    // 前面
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    // 后面
    -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5,
    // 顶面
    -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
    // 底面
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
    // 右面
    0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,
    // 左面
    -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
  ];

  // 颜色（每个面不同颜色）
  const colorsByFace = [
    [1.0, 0.0, 0.0, 1.0], // 前 - 红
    [0.0, 1.0, 0.0, 1.0], // 后 - 绿
    [0.0, 0.0, 1.0, 1.0], // 顶 - 蓝
    [1.0, 1.0, 0.0, 1.0], // 底 - 黄
    [1.0, 0.0, 1.0, 1.0], // 右 - 品红
    [0.0, 1.0, 1.0, 1.0], // 左 - 青
  ];

  const colors: number[] = [];
  for (let i = 0; i < 6; i++) {
    const color = colorsByFace[i];
    for (let j = 0; j < 4; j++) {
      colors.push(...color);
    }
  }

  // 法线方向（按面索引）
  const faceNormals = [
    [0, 0, 1], // 前
    [0, 0, -1], // 后
    [0, 1, 0], // 顶
    [0, -1, 0], // 底
    [1, 0, 0], // 右
    [-1, 0, 0], // 左
  ];

  // 生成顶点数据
  const stride = format.stride;
  const vertexCount = 24;
  const vertices = new ArrayBuffer(stride * vertexCount);
  const view32 = new Float32Array(vertices);
  const view8 = new Uint8Array(vertices);
  const view16 = new Int16Array(vertices);
  const viewU16 = new Uint16Array(vertices);

  // Float16 转换辅助函数
  function floatToFloat16(value: number): number {
    const floatView = new Float32Array(1);
    const int32View = new Int32Array(floatView.buffer);
    floatView[0] = value;
    const f = int32View[0];
    const sign = (f >> 31) & 0x0001;
    const exp = (f >> 23) & 0x00ff;
    let frac = f & 0x007fffff;

    if (exp === 0) {
      return sign << 15;
    } else if (exp === 0xff) {
      return (sign << 15) | 0x7c00 | (frac ? 0x0200 : 0);
    }

    const newExp = exp - 127 + 15;
    if (newExp >= 31) {
      return (sign << 15) | 0x7c00;
    } else if (newExp <= 0) {
      if (newExp < -10) {
        return sign << 15;
      }
      frac |= 0x00800000;
      const shift = 14 - newExp;
      return (sign << 15) | (frac >> shift);
    }
    return (sign << 15) | (newExp << 10) | (frac >> 13);
  }

  for (let i = 0; i < vertexCount; i++) {
    const faceIndex = Math.floor(i / 4);
    const byteOffset = i * stride;

    // 写入位置
    if (format.format.position === MSpec.RHIVertexFormat.FLOAT32x3) {
      // FLOAT32x3: 12 字节
      view32[byteOffset / 4] = positions[i * 3];
      view32[byteOffset / 4 + 1] = positions[i * 3 + 1];
      view32[byteOffset / 4 + 2] = positions[i * 3 + 2];
    } else if (format.format.position === MSpec.RHIVertexFormat.FLOAT16x4) {
      // FLOAT16x4: 8 字节 (使用真正的 Float16)
      viewU16[byteOffset / 2] = floatToFloat16(positions[i * 3]);
      viewU16[byteOffset / 2 + 1] = floatToFloat16(positions[i * 3 + 1]);
      viewU16[byteOffset / 2 + 2] = floatToFloat16(positions[i * 3 + 2]);
      viewU16[byteOffset / 2 + 3] = floatToFloat16(1.0); // w = 1.0
    }

    // 计算颜色偏移
    let colorOffset = 0;
    if (format.format.position === MSpec.RHIVertexFormat.FLOAT32x3) {
      colorOffset = byteOffset + 12; // FLOAT32x3 = 12 字节
    } else {
      colorOffset = byteOffset + 8; // FLOAT16x4 = 8 字节
    }

    // 写入颜色
    if (format.format.color === MSpec.RHIVertexFormat.FLOAT32x3) {
      // FLOAT32x3: 12 字节
      view32[colorOffset / 4] = colors[i * 4];
      view32[colorOffset / 4 + 1] = colors[i * 4 + 1];
      view32[colorOffset / 4 + 2] = colors[i * 4 + 2];
    } else if (format.format.color === MSpec.RHIVertexFormat.UNORM8x4) {
      // UNORM8x4: 4 字节
      view8[colorOffset] = Math.round(colors[i * 4] * 255);
      view8[colorOffset + 1] = Math.round(colors[i * 4 + 1] * 255);
      view8[colorOffset + 2] = Math.round(colors[i * 4 + 2] * 255);
      view8[colorOffset + 3] = Math.round(colors[i * 4 + 3] * 255);
    }

    // 计算法线偏移
    let normalOffset = 0;
    const colorSize =
      format.format.color === MSpec.RHIVertexFormat.FLOAT32x3
        ? 12
        : format.format.color === MSpec.RHIVertexFormat.UNORM8x4
          ? 4
          : 0;
    normalOffset = colorOffset + colorSize;

    // 写入法线
    const normal = faceNormals[faceIndex];
    if (format.format.normal === MSpec.RHIVertexFormat.SNORM16x2) {
      // SNORM16x2: 4 字节
      view16[normalOffset / 2] = Math.round(normal[0] * 32767);
      view16[normalOffset / 2 + 1] = Math.round(normal[2] * 32767);
    } else if (format.format.normal === MSpec.RHIVertexFormat.FLOAT16x2) {
      // FLOAT16x2: 4 字节
      viewU16[normalOffset / 2] = floatToFloat16(normal[0]);
      viewU16[normalOffset / 2 + 1] = floatToFloat16(normal[2]);
    } else if (format.format.normal === MSpec.RHIVertexFormat.FLOAT32) {
      // FLOAT32: 4 字节 (只存储一个分量，用于演示)
      view32[normalOffset / 4] = normal[1]; // 存储 Y 分量
    }
  }

  // 索引数据
  const indices = new Uint16Array([
    0,
    1,
    2,
    2,
    3,
    0, // 前
    4,
    6,
    5,
    6,
    7,
    4, // 后
    8,
    9,
    10,
    10,
    11,
    8, // 顶
    12,
    14,
    13,
    14,
    15,
    12, // 底
    16,
    17,
    18,
    18,
    19,
    16, // 右
    20,
    22,
    21,
    22,
    23,
    20, // 左
  ]);

  return {
    vertices: new Uint8Array(vertices),
    stride,
    indices,
  };
}

// ==================== Demo 参数 ====================

interface DemoParams {
  formatType: string;
  rotateX: boolean;
  rotateY: boolean;
}

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '顶点格式演示 Demo',
    clearColor: [0.08, 0.08, 0.12, 1.0],
  });

  try {
    // 2. 初始化
    await runner.init();

    // 创建性能统计
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });

    // 创建轨道控制器
    const orbit = new OrbitController(runner.canvas, {
      distance: 3,
      target: [0, 0, 0],
      enableDamping: true,
      autoRotate: true,
      autoRotateSpeed: 1,
    });

    // 3. Demo 参数
    const params: DemoParams = {
      formatType: 'ultra_compact',
      rotateX: true,
      rotateY: true,
    };

    // 4. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Vertex Format Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Vertex Format Fragment Shader',
      })
    );

    // 5. 创建全局 Transform Uniform 缓冲区和绑定组
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout(
        [
          {
            binding: 0,
            visibility: MSpec.RHIShaderStage.VERTEX,
            buffer: { type: 'uniform' },
            name: 'Transforms',
          },
        ],
        'BindGroup Layout'
      )
    );

    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [{ binding: 0, resource: transformBuffer }])
    );

    const pipelineLayout = runner.track(runner.device.createPipelineLayout([bindGroupLayout], 'Pipeline Layout'));

    // 6. 为每种格式创建缓冲区和管线
    const formatResources: Map<
      string,
      {
        vertexBuffer: MSpec.IRHIBuffer;
        indexBuffer: MSpec.IRHIBuffer;
        pipeline: MSpec.IRHIRenderPipeline;
        indexCount: number;
        config: VertexFormatConfig;
      }
    > = new Map();

    for (const [key, config] of Object.entries(VERTEX_FORMATS)) {
      // 生成几何体
      const { vertices, stride, indices } = generateCubeWithFormat(config);

      // 创建顶点缓冲区
      const vertexBuffer = runner.track(
        runner.device.createBuffer({
          size: vertices.byteLength,
          usage: MSpec.RHIBufferUsage.VERTEX,
          hint: 'static',
          initialData: vertices,
          label: `Vertex Format Buffer (${key})`,
        })
      );

      // 创建索引缓冲区
      const indexBuffer = runner.track(
        runner.device.createBuffer({
          size: indices.byteLength,
          usage: MSpec.RHIBufferUsage.INDEX,
          hint: 'static',
          initialData: indices as BufferSource,
          label: `Vertex Format Index Buffer (${key})`,
        })
      );

      // 创建顶点布局
      const vertexLayout: MSpec.RHIVertexLayout = {
        buffers: [
          {
            index: 0,
            stride: stride,
            stepMode: 'vertex',
            attributes: [
              {
                name: 'aPosition',
                format: config.format.position,
                offset: 0,
                shaderLocation: 0,
              },
              {
                name: 'aColor',
                format: config.format.color,
                offset: config.format.position === MSpec.RHIVertexFormat.FLOAT32x3 ? 12 : 8,
                shaderLocation: 1,
              },
              {
                name: 'aNormal',
                format: config.format.normal,
                offset: stride - 4,
                shaderLocation: 2,
              },
            ],
          },
        ],
      };

      // 创建管线
      const pipeline = runner.track(
        runner.device.createRenderPipeline({
          vertexShader,
          fragmentShader,
          vertexLayout,
          primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
          layout: pipelineLayout,
          label: `Vertex Format Pipeline (${key})`,
        })
      );

      formatResources.set(key, {
        vertexBuffer,
        indexBuffer,
        pipeline,
        indexCount: indices.length,
        config,
      });
    }

    // 7. 创建 GUI
    const gui = new SimpleGUI();

    gui
      .add('formatType', {
        value: params.formatType,
        options: Object.keys(VERTEX_FORMATS),
        onChange: (v) => {
          params.formatType = v as string;
          const config = VERTEX_FORMATS[params.formatType];
          console.info(`📊 ${config.name}`);
          console.info(`💾 每顶点字节数: ${config.bytesPerVertex}`);
          console.info(`📈 内存相对标准格式: ${config.memoryPercent}%`);
        },
      })
      .addSeparator('Animation')
      .add('rotateX', {
        value: params.rotateX,
        onChange: (v) => {
          params.rotateX = v as boolean;
        },
      })
      .add('rotateY', {
        value: params.rotateY,
        onChange: (v) => {
          params.rotateY = v as boolean;
        },
      });

    // 8. 设置键盘事件
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

    // 数字键切换格式
    const formatKeys = ['1', '2', '3', '4'];
    const formatNames = Object.keys(VERTEX_FORMATS);
    formatKeys.forEach((key, index) => {
      if (index < formatNames.length) {
        runner.onKey(key, () => {
          params.formatType = formatNames[index];
          gui.set('formatType', params.formatType);
        });
      }
    });

    // 9. 创建模型矩阵
    const modelMatrix = new MMath.Matrix4();

    // 10. 启动渲染循环
    let time = 0;

    runner.start((dt) => {
      time += dt;

      orbit.update(dt);

      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      // 更新模型矩阵（旋转）
      modelMatrix.identity();
      if (params.rotateY) {
        modelMatrix.rotateY(time * 0.5);
      }
      if (params.rotateX) {
        modelMatrix.rotateX(time * 0.3);
      }

      const transformData = new Float32Array(64);
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformBuffer.update(transformData, 0);

      stats.begin();

      const { encoder, passDescriptor } = runner.beginFrame();
      const renderPass = encoder.beginRenderPass(passDescriptor);

      // 获取当前格式资源
      const resources = formatResources.get(params.formatType);
      if (resources) {
        renderPass.setPipeline(resources.pipeline);
        renderPass.setBindGroup(0, bindGroup);
        renderPass.setVertexBuffer(0, resources.vertexBuffer);
        renderPass.setIndexBuffer(resources.indexBuffer, MSpec.RHIIndexFormat.UINT16);
        renderPass.drawIndexed(resources.indexCount);
      }

      renderPass.end();
      runner.endFrame(encoder);

      stats.end();
    });

    // 11. 显示帮助信息
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      '',
      '🖱️ 鼠标控制:',
      '• 左键拖拽: 旋转视角',
      '• 右键拖拽: 平移视角',
      '• 滚轮: 缩放视角',
      '',
      '顶点格式 (1-4):',
      '1: Standard (FLOAT32)',
      '2: Compressed Color (UNORM8x4)',
      '3: Half Precision (FLOAT16)',
      '4: Ultra Compact',
    ]);

    // 12. 输出技术信息
    console.info('📊 Vertex Formats Demo');
    console.info('支持的顶点格式:');
    Object.entries(VERTEX_FORMATS).forEach(([key, config], index) => {
      console.info(`  ${index + 1}. ${config.name}`);
      console.info(`     - ${config.description}`);
      console.info(`     - 每顶点: ${config.bytesPerVertex} 字节 (相对: ${config.memoryPercent}%)`);
    });
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
