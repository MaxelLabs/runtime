/**
 * procedural-texture.ts
 * 程序化纹理生成器 Demo
 *
 * 功能演示：
 * - 展示所有 ProceduralTexture 生成方法
 * - 网格布局显示 6 种纹理类型
 * - GUI 选择纹理类型进行详细查看
 * - 实时参数调整
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, ProceduralTexture, SimpleGUI } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

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
  vec4 color = texture(uTexture, vTexCoord);

  // 添加边框效果
  vec2 border = smoothstep(vec2(0.0), vec2(0.02), vTexCoord) *
               smoothstep(vec2(1.0), vec2(0.98), vTexCoord);
  color.rgb *= border.x * border.y;

  fragColor = color;
}
`;

// ==================== 主程序 ====================


const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'Procedural Texture Demo',
  clearColor: [0.05, 0.05, 0.1, 1.0] as [number, number, number, number],
});

runner.init().then(() => {
  // 纹理类型名称
  const textureNames = [
    'Checkerboard',
    'Gradient',
    'Noise',
    'Solid Color',
    'UV Debug',
    'Normal Map',
  ];

  // 创建所有纹理
  const textures: MSpec.IRHITexture[] = [];

  // 纹理参数状态
  const textureParams = {
    // 棋盘格参数
    checkerboardCellSize: 32,
    checkerboardColorA: [255, 255, 255, 255] as [number, number, number, number],
    checkerboardColorB: [0, 0, 0, 255] as [number, number, number, number],

    // 渐变参数
    gradientDirection: 'horizontal' as 'horizontal' | 'vertical' | 'diagonal',
    gradientStartColor: [255, 0, 0, 255] as [number, number, number, number],
    gradientEndColor: [0, 0, 255, 255] as [number, number, number, number],

    // 噪声参数
    noiseType: 'white' as 'white' | 'perlin' | 'simplex',
    noiseFrequency: 4,
    noiseOctaves: 4,
    noiseBaseColor: [0, 0, 0, 255] as [number, number, number, number],
    noiseColor: [255, 255, 255, 255] as [number, number, number, number],

    // 纯色参数
    solidColor: [128, 128, 255, 255] as [number, number, number, number],

    // UV调试参数
    uvDebugSize: 256,

    // 法线贴图参数
    normalMapPattern: 'flat' as 'flat' | 'bumpy' | 'wave',
    normalMapStrength: 0.5,

    // 当前选中的纹理
    selectedTexture: -1, // -1 表示显示全部
  };

  // 创建采样器
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

  // 创建所有程序化纹理
  function createAllTextures() {
    // 1. 棋盘格
    const checkerData = ProceduralTexture.checkerboard({
      width: 256,
      height: 256,
      cellSize: textureParams.checkerboardCellSize,
      colorA: textureParams.checkerboardColorA,
      colorB: textureParams.checkerboardColorB,
    });

    const checkerTexture = runner.track(
      runner.device.createTexture({
        width: checkerData.width,
        height: checkerData.height,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Checkerboard Texture',
      })
    );
    checkerTexture.update(checkerData.data as BufferSource);
    textures[0] = checkerTexture;

    // 2. 渐变
    const gradientData = ProceduralTexture.gradient({
      width: 256,
      height: 256,
      direction: textureParams.gradientDirection,
      startColor: textureParams.gradientStartColor,
      endColor: textureParams.gradientEndColor,
    });

    const gradientTexture = runner.track(
      runner.device.createTexture({
        width: gradientData.width,
        height: gradientData.height,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Gradient Texture',
      })
    );
    gradientTexture.update(gradientData.data as BufferSource);
    textures[1] = gradientTexture;

    // 3. 噪声
    const noiseData = ProceduralTexture.noise({
      width: 256,
      height: 256,
      type: textureParams.noiseType,
      frequency: textureParams.noiseFrequency,
      octaves: textureParams.noiseOctaves,
      baseColor: textureParams.noiseBaseColor,
      noiseColor: textureParams.noiseColor,
    });

    const noiseTexture = runner.track(
      runner.device.createTexture({
        width: noiseData.width,
        height: noiseData.height,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Noise Texture',
      })
    );
    noiseTexture.update(noiseData.data as BufferSource);
    textures[2] = noiseTexture;

    // 4. 纯色
    const solidData = ProceduralTexture.solidColor({
      width: 256,
      height: 256,
      color: textureParams.solidColor,
    });

    const solidTexture = runner.track(
      runner.device.createTexture({
        width: solidData.width,
        height: solidData.height,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Solid Color Texture',
      })
    );
    solidTexture.update(solidData.data as BufferSource);
    textures[3] = solidTexture;

    // 5. UV调试
    const uvData = ProceduralTexture.uvDebug({
      width: textureParams.uvDebugSize,
      height: textureParams.uvDebugSize,
    });

    const uvTexture = runner.track(
      runner.device.createTexture({
        width: uvData.width,
        height: uvData.height,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'UV Debug Texture',
      })
    );
    uvTexture.update(uvData.data as BufferSource);
    textures[4] = uvTexture;

    // 6. 法线贴图
    const normalData = ProceduralTexture.normalMap({
      width: 256,
      height: 256,
      pattern: textureParams.normalMapPattern,
      strength: textureParams.normalMapStrength,
    });

    const normalTexture = runner.track(
      runner.device.createTexture({
        width: normalData.width,
        height: normalData.height,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Normal Map Texture',
      })
    );
    normalTexture.update(normalData.data as BufferSource);
    textures[5] = normalTexture;
  }

  // 更新特定纹理
  function updateTexture(index: number) {
    let data: { width: number; height: number; data: Uint8Array };

    switch (index) {
      case 0: // 棋盘格
        data = ProceduralTexture.checkerboard({
          width: 256,
          height: 256,
          cellSize: textureParams.checkerboardCellSize,
          colorA: textureParams.checkerboardColorA,
          colorB: textureParams.checkerboardColorB,
        });
        break;

      case 1: // 渐变
        data = ProceduralTexture.gradient({
          width: 256,
          height: 256,
          direction: textureParams.gradientDirection,
          startColor: textureParams.gradientStartColor,
          endColor: textureParams.gradientEndColor,
        });
        break;

      case 2: // 噪声
        data = ProceduralTexture.noise({
          width: 256,
          height: 256,
          type: textureParams.noiseType,
          frequency: textureParams.noiseFrequency,
          octaves: textureParams.noiseOctaves,
          baseColor: textureParams.noiseBaseColor,
          noiseColor: textureParams.noiseColor,
        });
        break;

      case 3: // 纯色
        data = ProceduralTexture.solidColor({
          width: 256,
          height: 256,
          color: textureParams.solidColor,
        });
        break;

      case 4: // UV调试
        data = ProceduralTexture.uvDebug({
          width: textureParams.uvDebugSize,
          height: textureParams.uvDebugSize,
        });
        break;

      case 5: // 法线贴图
        data = ProceduralTexture.normalMap({
          width: 256,
          height: 256,
          pattern: textureParams.normalMapPattern,
          strength: textureParams.normalMapStrength,
        });
        break;

      default:
        return;
    }

    textures[index].update(data.data as BufferSource);
  }

  // 初始化纹理
  createAllTextures();

  // 创建平面几何体
  const geometry = GeometryGenerator.plane({
    width: 1.5,
    height: 1.0,
    widthSegments: 1,
    heightSegments: 1,
    normals: true,
    uvs: true,
  });

  // 创建顶点缓冲区 (交错数据)
  const vertexBuffer = runner.track(
    runner.device.createBuffer({
      size: geometry.vertices.byteLength,
      usage: MSpec.RHIBufferUsage.VERTEX,
      hint: 'static',
      label: 'Vertex Buffer',
    })
  );
  vertexBuffer.update(geometry.vertices);

  // 创建索引缓冲区
  const indexBuffer = runner.track(
    runner.device.createBuffer({
      size: geometry.indices.byteLength,
      usage: MSpec.RHIBufferUsage.INDEX,
      hint: 'static',
      label: 'Index Buffer',
    })
  );
  indexBuffer.update(geometry.indices);

  // 创建变换矩阵缓冲区
  const transformBuffer = runner.track(
    runner.device.createBuffer({
      size: 256, // 4 matrices * 64 bytes
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: 'Transform Uniform Buffer',
    })
  );

  // 创建着色器
  const vertexShader = runner.track(
    runner.device.createShaderModule(vertexShaderSource, 'Procedural Texture Vertex Shader')
  );

  const fragmentShader = runner.track(
    runner.device.createShaderModule(fragmentShaderSource, 'Procedural Texture Fragment Shader')
  );

  // 创建绑定组布局
  const bindGroupLayout = runner.track(
    runner.device.createBindGroupLayout([
      {
        binding: 0,
        visibility: MSpec.RHIShaderStage.VERTEX | MSpec.RHIShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
        name: 'uTransforms',
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

  // 创建管线布局
  const pipelineLayout = runner.track(
    runner.device.createPipelineLayout([bindGroupLayout], 'Procedural Texture Pipeline Layout')
  );

  // 创建渲染管线
  const pipeline = runner.track(
    runner.device.createRenderPipeline({
      vertexShader,
      fragmentShader,
      vertexLayout: geometry.layout,
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
      label: 'Procedural Texture Pipeline',
    })
  );

  // 为每个纹理创建绑定组
  const bindGroups: MSpec.IRHIBindGroup[] = [];
  for (let i = 0; i < 6; i++) {
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: { buffer: transformBuffer } },
        { binding: 1, resource: textures[i].createView() },
        { binding: 2, resource: sampler },
      ])
    );
    bindGroups.push(bindGroup);
  }

  // 模型矩阵
  const modelMatrix = new MMath.Matrix4();
  const viewMatrix = new MMath.Matrix4();
  const projectionMatrix = new MMath.Matrix4();

  // 设置相机
  viewMatrix.lookAt(
    new MMath.Vector3(0, 0, 3),
    new MMath.Vector3(0, 0, 0),
    new MMath.Vector3(0, 1, 0)
  );

  // 设置GUI
  const gui = new SimpleGUI();

  // 视图模式选择
  gui.add('View Mode', {
    value: 'All Textures',
    options: ['All Textures', ...textureNames],
    onChange: (value) => {
      const val = value as string;
      if (val === 'All Textures') {
        textureParams.selectedTexture = -1;
      } else {
        textureParams.selectedTexture = textureNames.indexOf(val);
      }
    },
  });

  gui.addSeparator('Checkerboard');

  gui.add('Cell Size', {
    value: textureParams.checkerboardCellSize,
    min: 4,
    max: 128,
    step: 4,
    onChange: (v) => {
      textureParams.checkerboardCellSize = v as number;
      updateTexture(0);
    },
  });

  gui.addSeparator('Gradient');

  gui.add('Direction', {
    value: textureParams.gradientDirection,
    options: ['horizontal', 'vertical', 'diagonal'],
    onChange: (v) => {
      textureParams.gradientDirection = v as 'horizontal' | 'vertical' | 'diagonal';
      updateTexture(1);
    },
  });

  gui.addSeparator('Noise');

  gui.add('Type', {
    value: textureParams.noiseType,
    options: ['white', 'perlin', 'simplex'],
    onChange: (v) => {
      textureParams.noiseType = v as 'white' | 'perlin' | 'simplex';
      updateTexture(2);
    },
  });

  gui.add('Frequency', {
    value: textureParams.noiseFrequency,
    min: 1,
    max: 16,
    step: 0.5,
    onChange: (v) => {
      textureParams.noiseFrequency = v as number;
      updateTexture(2);
    },
  });

  gui.add('Octaves', {
    value: textureParams.noiseOctaves,
    min: 1,
    max: 8,
    step: 1,
    onChange: (v) => {
      textureParams.noiseOctaves = v as number;
      updateTexture(2);
    },
  });

  gui.addSeparator('Normal Map');

  gui.add('Pattern', {
    value: textureParams.normalMapPattern,
    options: ['flat', 'bumpy', 'wave'],
    onChange: (v) => {
      textureParams.normalMapPattern = v as 'flat' | 'bumpy' | 'wave';
      updateTexture(5);
    },
  });

  gui.add('Strength', {
    value: textureParams.normalMapStrength,
    min: 0,
    max: 1,
    step: 0.1,
    onChange: (v) => {
      textureParams.normalMapStrength = v as number;
      updateTexture(5);
    },
  });

  // 渲染函数
  function render() {
    // 更新投影矩阵
    const aspect = runner.width / runner.height;
    projectionMatrix.perspective(Math.PI / 4, aspect, 0.1, 100);

    // 使用 beginFrame/endFrame 模式
    const { encoder, passDescriptor } = runner.beginFrame();

    // 开始渲染通道
    const renderPass = encoder.beginRenderPass(passDescriptor);

    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, 'uint16');

    // 更新变换矩阵数据
    const transformData = new Float32Array(48); // 3 matrices

    if (textureParams.selectedTexture >= 0 && textureParams.selectedTexture < 6) {
      // 单纹理模式 - 居中显示一个大的纹理
      modelMatrix.identity();
      modelMatrix.translate(new MMath.Vector3(0, 0, 0));
      modelMatrix.scale(new MMath.Vector3(1.5, 1.5, 1));

      modelMatrix.toArray(transformData, 0);
      viewMatrix.toArray(transformData, 16);
      projectionMatrix.toArray(transformData, 32);
      transformBuffer.update(transformData);

      renderPass.setBindGroup(0, bindGroups[textureParams.selectedTexture]);
      renderPass.drawIndexed(geometry.indexCount);
    } else {
      // 多纹理网格模式 (3x2)
      for (let i = 0; i < 6; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);

        const x = (col - 1) * 1.1;
        const y = row === 0 ? 0.55 : -0.55;

        modelMatrix.identity();
        modelMatrix.translate(new MMath.Vector3(x, y, 0));
        modelMatrix.scale(new MMath.Vector3(0.35, 0.35, 1));

        modelMatrix.toArray(transformData, 0);
        viewMatrix.toArray(transformData, 16);
        projectionMatrix.toArray(transformData, 32);
        transformBuffer.update(transformData);

        renderPass.setBindGroup(0, bindGroups[i]);
        renderPass.drawIndexed(geometry.indexCount);
      }
    }

    renderPass.end();

    // 结束帧
    runner.endFrame(encoder);
  }

  // 启动渲染循环
  runner.start(render);
});

