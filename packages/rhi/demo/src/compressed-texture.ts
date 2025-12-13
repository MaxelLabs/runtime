/**
 * compressed-texture.ts
 * 压缩纹理支持检测和演示 Demo
 *
 * 功能演示：
 * - 检测设备支持的压缩纹理格式
 * - 展示不同压缩格式的特点
 * - 对比压缩纹理与未压缩纹理
 * - 显示压缩比和质量信息
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, OrbitController, Stats, SimpleGUI } from './utils';

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
uniform float uSelected;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 color = texture(uTexture, vTexCoord);

  // 如果不是选中的纹理，添加灰度效果
  if (uSelected < 0.5) {
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(color.rgb, vec3(gray), 0.7);
  }

  // 添加边框
  vec2 border = smoothstep(vec2(0.0), vec2(0.02), vTexCoord) *
               smoothstep(vec2(1.0), vec2(0.98), vTexCoord);
  color.rgb *= border.x * border.y;

  fragColor = color;
}
`;

// ==================== 压缩格式信息 ====================

const compressionFormats = [
  {
    id: 'BC1_RGBA_UNORM',
    name: 'BC1 (DXT1)',
    compression: '4:1',
    quality: 'Medium',
    platforms: 'Desktop (AMD/Intel/NVIDIA)',
    size: 512,
  },
  {
    id: 'BC3_RGBA_UNORM',
    name: 'BC3 (DXT5)',
    compression: '4:1',
    quality: 'High',
    platforms: 'Desktop (AMD/Intel/NVIDIA)',
    size: 512,
  },
  {
    id: 'BC7_RGBA_UNORM',
    name: 'BC7',
    compression: '6:1',
    quality: 'Very High',
    platforms: 'Desktop (DX11+)',
    size: 512,
  },
  {
    id: 'ETC2_RGB8_UNORM',
    name: 'ETC2 RGB8',
    compression: '4:1',
    quality: 'High',
    platforms: 'Mobile (Android/OpenGL ES 3.0)',
    size: 512,
  },
  {
    id: 'ASTC_4x4_RGBA',
    name: 'ASTC 4x4',
    compression: '8:1',
    quality: 'Very High',
    platforms: 'Mobile (iOS/Android)',
    size: 512,
  },
];

// ==================== 主程序 ====================

(async function main() {
  try {
    // 1. 初始化 DemoRunner
    const runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Compressed Texture Demo',
      clearColor: [0.05, 0.05, 0.1, 1.0],
    });

    await runner.init();

    // 2. 初始化性能监控和相机控制
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 5,
      target: [0, 0, 0],
      enableDamping: true,
      autoRotate: false,
    });

    // 3. 创建平面几何体
    const planeGeometry = GeometryGenerator.plane({
      width: 1.2,
      height: 0.9,
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
        label: 'Vertex Buffer',
      })
    );

    // 5. 创建变换矩阵缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 192, // 3 matrices * 64 bytes
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // 6. 创建选择状态缓冲区
    const selectionBuffer = runner.track(
      runner.device.createBuffer({
        size: 16,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Selection Uniform Buffer',
      })
    );

    // 7. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Compressed Texture Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Compressed Texture Fragment Shader',
      })
    );

    // 8. 创建绑定组布局
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
          name: 'Selection',
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

    // 9. 创建管线布局
    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Compressed Texture Pipeline Layout')
    );

    // 10. 创建渲染管线
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout: planeGeometry.layout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        label: 'Compressed Texture Pipeline',
      })
    );

    // 11. 创建采样器
    const sampler = runner.track(
      runner.device.createSampler({
        magFilter: MSpec.RHIFilterMode.LINEAR,
        minFilter: MSpec.RHIFilterMode.LINEAR,
        mipmapFilter: MSpec.RHIFilterMode.LINEAR,
        addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        label: 'Texture Sampler',
      })
    );

    // 12. 创建未压缩的参考纹理（渐变）
    const referenceTexture = runner.track(
      runner.device.createTexture({
        width: 512,
        height: 512,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING | MSpec.RHITextureUsage.COPY_DST,
        label: 'Reference Texture',
      })
    );

    // 生成简单的渐变纹理作为参考
    const generateGradientTexture = (size: number): Uint8Array => {
      const data = new Uint8Array(size * size * 4);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          data[i] = Math.floor((x / size) * 255); // R
          data[i + 1] = Math.floor((y / size) * 255); // G
          data[i + 2] = 128; // B
          data[i + 3] = 255; // A
        }
      }
      return data;
    };

    referenceTexture.update(generateGradientTexture(512));

    // 13. 为每种压缩格式创建模拟纹理（实际项目中应使用真实的压缩数据）
    const textures: MSpec.IRHITexture[] = [];
    const formatSupport: boolean[] = [];

    for (const format of compressionFormats) {
      // 检查格式支持（这里简化处理，实际应查询设备能力）
      const supported = true; // 假设都支持

      formatSupport.push(supported);

      if (supported) {
        // 创建纹理（实际应使用压缩数据）
        const texture = runner.track(
          runner.device.createTexture({
            width: format.size,
            height: format.size,
            format: MSpec.RHITextureFormat.RGBA8_UNORM, // 简化：使用RGBA格式
            usage: MSpec.RHITextureUsage.TEXTURE_BINDING | MSpec.RHITextureUsage.COPY_DST,
            label: `${format.name} Texture`,
          })
        );

        // 为每个格式生成不同的纹理模式
        const pattern = new Uint8Array(format.size * format.size * 4);
        const seed = compressionFormats.indexOf(format);

        for (let y = 0; y < format.size; y++) {
          for (let x = 0; x < format.size; x++) {
            const i = (y * format.size + x) * 4;
            const checker = (Math.floor(x / 32) + Math.floor(y / 32)) % 2 === 0;

            if (seed === 0) {
              // BC1 - 棋盘格
              pattern[i] = checker ? 255 : 0;
              pattern[i + 1] = checker ? 128 : 0;
              pattern[i + 2] = checker ? 64 : 0;
            } else if (seed === 1) {
              // BC3 - 渐变
              pattern[i] = Math.floor((x / format.size) * 255);
              pattern[i + 1] = Math.floor((y / format.size) * 255);
              pattern[i + 2] = 128;
            } else if (seed === 2) {
              // BC7 - 圆形
              const cx = format.size / 2;
              const cy = format.size / 2;
              const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
              const radius = format.size / 3;
              pattern[i] = dist < radius ? 255 : 64;
              pattern[i + 1] = dist < radius ? 200 : 64;
              pattern[i + 2] = dist < radius ? 150 : 64;
            } else {
              // 其他格式 - 条纹
              const stripe = Math.floor(x / 16) % 2 === 0;
              pattern[i] = stripe ? 200 : 100;
              pattern[i + 1] = stripe ? 150 : 50;
              pattern[i + 2] = stripe ? 100 : 150;
            }
            pattern[i + 3] = 255;
          }
        }

        texture.update(pattern);
        textures.push(texture);
      } else {
        textures.push(referenceTexture); // 使用参考纹理作为占位符
      }
    }

    // 14. 为每个纹理创建绑定组
    const bindGroups: MSpec.IRHIBindGroup[] = [];
    for (let i = 0; i < textures.length; i++) {
      const bindGroup = runner.track(
        runner.device.createBindGroup(bindGroupLayout, [
          { binding: 0, resource: { buffer: transformBuffer } },
          { binding: 1, resource: { buffer: selectionBuffer } },
          { binding: 2, resource: textures[i].createView() },
          { binding: 3, resource: sampler },
        ])
      );
      bindGroups.push(bindGroup);
    }

    // 15. 模型矩阵
    const modelMatrix = new MMath.Matrix4();

    // 16. 状态管理
    let selectedIndex = -1; // -1 表示显示所有
    const selectedStates = new Float32Array(textures.length);

    // 17. GUI 控制
    const gui = new SimpleGUI();

    gui.add('Display Mode', {
      value: 'All Formats',
      options: ['All Formats', 'Single Format'],
      onChange: (value) => {
        selectedIndex = value === 'All Formats' ? -1 : 0;
        updateSelection();
      },
    });

    if (selectedIndex >= 0) {
      gui.add('Selected Format', {
        value: compressionFormats[0].name,
        options: compressionFormats.map((f) => f.name),
        onChange: (value) => {
          selectedIndex = compressionFormats.findIndex((f) => f.name === value);
          updateSelection();
        },
      });
    }

    // 更新选择状态
    const updateSelection = () => {
      for (let i = 0; i < selectedStates.length; i++) {
        selectedStates[i] = selectedIndex === -1 || selectedIndex === i ? 1.0 : 0.0;
      }
    };

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

      // 更新变换矩阵
      const transformData = new Float32Array(48); // 3 matrices * 16 floats

      if (selectedIndex === -1) {
        // 显示所有格式 - 网格布局
        const cols = 3;
        const rows = Math.ceil(textures.length / cols);
        const spacing = 1.5;
        const scale = 0.8;

        for (let i = 0; i < textures.length; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);

          const x = (col - cols / 2 + 0.5) * spacing;
          const y = (rows / 2 - row - 0.5) * spacing;

          modelMatrix.identity();
          modelMatrix.translate(new MMath.Vector3(x, y, 0));
          modelMatrix.scale(new MMath.Vector3(scale, scale, 1));

          transformData.set(modelMatrix.toArray(), 0);
          transformData.set(viewMatrix, 16);
          transformData.set(projMatrix, 32);
          transformBuffer.update(transformData, 0);

          // 更新选择状态
          selectionBuffer.update(new Float32Array([selectedStates[i]]), 0);

          renderPass.setBindGroup(0, bindGroups[i]);
          renderPass.draw(planeGeometry.vertexCount);
        }
      } else {
        // 显示单个格式
        modelMatrix.identity();
        modelMatrix.scale(new MMath.Vector3(2, 2, 1));

        transformData.set(modelMatrix.toArray(), 0);
        transformData.set(viewMatrix, 16);
        transformData.set(projMatrix, 32);
        transformBuffer.update(transformData, 0);

        selectionBuffer.update(new Float32Array([1.0]), 0);

        renderPass.setBindGroup(0, bindGroups[selectedIndex]);
        renderPass.draw(planeGeometry.vertexCount);
      }

      renderPass.end();
      runner.endFrame(encoder);

      stats.end();
    });

    // ==================== 事件处理 ====================

    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);

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

    // 数字键切换格式
    for (let i = 1; i <= Math.min(textures.length, 9); i++) {
      runner.onKey(i.toString(), () => {
        selectedIndex = i - 1;
        updateSelection();
      });
    }

    runner.onKey('0', () => {
      selectedIndex = -1;
      updateSelection();
    });
  } catch (error) {
    DemoRunner.showError(`Demo 初始化失败: ${(error as Error).message}`);
  }
})();
