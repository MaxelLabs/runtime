/**
 * cubemap-skybox.ts
 * 立方体贴图天空盒演示 Demo
 *
 * 功能演示：
 * - 使用 CubemapGenerator 生成天空渐变立方体贴图
 * - 创建反转的立方体几何体用于内部渲染天空盒
 * - 实现 samplerCube 着色器采样立方体贴图
 * - 使用 gl_Position.xyww 技巧实现无限深度效果
 * - SimpleGUI 控制天空颜色渐变参数
 * - 轨道控制器和性能监控
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, OrbitController, Stats, GeometryGenerator, CubemapGenerator, SimpleGUI } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelMatrix;

out vec3 vWorldPos;

void main() {
  // 移除位移的影响，让天空盒跟随相机
  mat4 viewMatrixNoTranslation = mat4(
    vec4(uViewMatrix[0][0], uViewMatrix[1][0], uViewMatrix[2][0], 0.0),
    vec4(uViewMatrix[0][1], uViewMatrix[1][1], uViewMatrix[2][1], 0.0),
    vec4(uViewMatrix[0][2], uViewMatrix[1][2], uViewMatrix[2][2], 0.0),
    vec4(0.0, 0.0, 0.0, 1.0)
  );

  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPos = worldPosition.xyz;

  // 天空盒技巧：确保深度值为 1.0（最远）
  gl_Position = uProjectionMatrix * viewMatrixNoTranslation * worldPosition;
  gl_Position.z = gl_Position.w; // = gl_Position.xyww
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform samplerCube uSkybox;
uniform float uIntensity;
uniform float uRotationSpeed;
uniform float uTime;

in vec3 vWorldPos;
out vec4 fragColor;

// 简单的 3D 旋转矩阵
mat3 rotateY(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(
    c, 0.0, s,
    0.0, 1.0, 0.0,
    -s, 0.0, c
  );
}

mat3 rotateX(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(
    1.0, 0.0, 0.0,
    0.0, c, -s,
    0.0, s, c
  );
}

void main() {
  // 根据时间旋转天空盒
  vec3 rotatedPos = rotateY(uTime * uRotationSpeed) * rotateX(uTime * uRotationSpeed * 0.5) * vWorldPos;

  // 采样立方体贴图
  vec3 color = texture(uSkybox, normalize(rotatedPos)).rgb;

  // 应用强度
  fragColor = vec4(color * uIntensity, 1.0);
}
`;

// ==================== 主程序 ====================

(async function main() {
  try {
    // 1. 初始化 DemoRunner
    const runner = new DemoRunner({
      canvasId: 'J-canvas',
      name: 'Cubemap Skybox Demo',
      clearColor: [0.0, 0.0, 0.0, 1.0],
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

    // 3. 创建立方体几何体（用于天空盒）
    const cubeGeometry = GeometryGenerator.cube({
      width: 2,
      height: 2,
      depth: 2,
      widthSegments: 1,
      heightSegments: 1,
      depthSegments: 1,
    });

    // 4. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: cubeGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: cubeGeometry.vertices as BufferSource,
        label: 'Skybox Vertex Buffer',
      })
    );

    // 5. 创建变换矩阵 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 192, // 3 matrices * 64 bytes
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // 6. 创建参数 Uniform 缓冲区
    const paramsBuffer = runner.track(
      runner.device.createBuffer({
        size: 16, // intensity + rotationSpeed + time + padding
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Skybox Params Uniform Buffer',
      })
    );

    // 7. 创建天空渐变立方体贴图

    let cubemapData = CubemapGenerator.skyGradient({
      size: 512,
      topColor: [135, 206, 235, 255],     // 天空蓝
      horizonColor: [176, 196, 222, 255],  // 淡蓝
      bottomColor: [139, 69, 19, 255],     // 棕色地面
    });

    const cubeTexture = runner.track(
      runner.device.createTexture({
        width: cubemapData.size,
        height: cubemapData.size,
        depthOrArrayLayers: 6,
        dimension: 'cube',
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING | MSpec.RHITextureUsage.COPY_DST,
        label: 'Skybox Cubemap Texture',
      })
    );

    // 上传立方体贴图数据
    const faceOrder: (keyof typeof cubemapData.faces)[] = ['posX', 'negX', 'posY', 'negY', 'posZ', 'negZ'];
    for (let i = 0; i < 6; i++) {
      const face = faceOrder[i];
      cubeTexture.update(cubemapData.faces[face] as BufferSource, {
        originX: 0,
        originY: 0,
        originZ: i,
        width: cubemapData.size,
        height: cubemapData.size,
        depthOrArrayLayers: 1,
      });
    }

  
    // 8. 创建立方体贴图采样器
    const sampler = runner.track(
      runner.device.createSampler({
        magFilter: MSpec.RHIFilterMode.LINEAR,
        minFilter: MSpec.RHIFilterMode.LINEAR,
        mipmapFilter: MSpec.RHIFilterMode.LINEAR,
        addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        addressModeW: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
        label: 'Skybox Cubemap Sampler',
      })
    );

    // 9. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Skybox Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Skybox Fragment Shader',
      })
    );

    // 10. 创建绑定组布局
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
          name: 'Params',
        },
        {
          binding: 2,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          texture: { sampleType: 'float', viewDimension: 'cube' },
          name: 'uSkybox',
        },
        {
          binding: 3,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
          name: 'uSkyboxSampler',
        },
      ])
    );

    // 11. 创建管线布局
    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Skybox Pipeline Layout')
    );

    // 12. 顶点布局
    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0,
          stride: 12, // 3 floats (position) = 12 bytes
          stepMode: 'vertex',
          attributes: [
            { name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 },
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
        label: 'Skybox Pipeline',
      })
    );

    // 14. 创建绑定组
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: { buffer: transformBuffer } },
        { binding: 1, resource: { buffer: paramsBuffer } },
        { binding: 2, resource: cubeTexture.createView({ dimension: 'cube' }) },
        { binding: 3, resource: sampler },
      ])
    );

    // 15. 模型矩阵
    const modelMatrix = new MMath.Matrix4();

    // 16. 天空盒参数初始值
    let intensity = 1.0;
    let rotationSpeed = 0.0;
    let topColor = [135, 206, 235, 255];
    let horizonColor = [176, 196, 222, 255];
    let bottomColor = [139, 69, 19, 255];

    // ==================== GUI 控制 ====================
    const gui = new SimpleGUI();
    gui.addSeparator('Skybox Colors');

    // 顶部颜色控制
    gui.add('Top Color', {
      value: '#87CEEB',
      onChange: (value) => {
        const hex = value as string;
        topColor = [
          parseInt(hex.slice(1, 3), 16),
          parseInt(hex.slice(3, 5), 16),
          parseInt(hex.slice(5, 7), 16),
          255
        ];
        updateSkyboxTexture();
      },
    });

    // 地平线颜色控制
    gui.add('Horizon Color', {
      value: '#B0C4DE',
      onChange: (value) => {
        const hex = value as string;
        horizonColor = [
          parseInt(hex.slice(1, 3), 16),
          parseInt(hex.slice(3, 5), 16),
          parseInt(hex.slice(5, 7), 16),
          255
        ];
        updateSkyboxTexture();
      },
    });

    // 底部颜色控制
    gui.add('Bottom Color', {
      value: '#8B4513',
      onChange: (value) => {
        const hex = value as string;
        bottomColor = [
          parseInt(hex.slice(1, 3), 16),
          parseInt(hex.slice(3, 5), 16),
          parseInt(hex.slice(5, 7), 16),
          255
        ];
        updateSkyboxTexture();
      },
    });

    gui.addSeparator('Skybox Parameters');

    // 天空盒强度
    gui.add('Intensity', {
      value: intensity,
      min: 0.0,
      max: 2.0,
      step: 0.01,
      onChange: (value) => {
        intensity = value as number;
      },
    });

    // 旋转速度
    gui.add('Rotation Speed', {
      value: rotationSpeed,
      min: 0.0,
      max: 0.5,
      step: 0.01,
      onChange: (value) => {
        rotationSpeed = value as number;
      },
    });

    // 更新天空盒纹理的函数
    function updateSkyboxTexture() {
      cubemapData = CubemapGenerator.skyGradient({
        size: 512,
        topColor,
        horizonColor,
        bottomColor,
      });

      // 上传新的立方体贴图数据
      for (let i = 0; i < 6; i++) {
        const face = faceOrder[i];
        cubeTexture.update(cubemapData.faces[face] as BufferSource, {
          originX: 0,
          originY: 0,
          originZ: i,
          width: cubemapData.size,
          height: cubemapData.size,
          depthOrArrayLayers: 1,
        });
      }
    }

    // ==================== 渲染循环 ====================

    let time = 0;

    runner.start((dt) => {
      orbit.update(dt);
      stats.begin();
      time += dt;

      // 获取视图和投影矩阵
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      // 更新变换矩阵
      const transformData = new Float32Array(48); // 3 matrices * 16 floats
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformBuffer.update(transformData, 0);

      // 更新参数
      const paramsData = new Float32Array(4);
      paramsData[0] = intensity;
      paramsData[1] = rotationSpeed;
      paramsData[2] = time;
      paramsBuffer.update(paramsData, 0);

      const { encoder, passDescriptor } = runner.beginFrame();
      const renderPass = encoder.beginRenderPass(passDescriptor);

      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setBindGroup(0, bindGroup);

      // 绘制立方体（天空盒）
      renderPass.draw(cubeGeometry.vertexCount, 1, 0, 0);

      renderPass.end();
      runner.endFrame(encoder);

      stats.end();
    });

    // ==================== 事件处理 ====================

    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      'R: 重置视角',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);

    // R 键重置视角
    runner.onKey('r', () => {
      orbit.setTarget(0, 0, 0);
      orbit.setDistance(5);
    });

    // Space 键重置颜色
    runner.onKey(' ', () => {
      topColor = [135, 206, 235, 255];
      horizonColor = [176, 196, 222, 255];
      bottomColor = [139, 69, 19, 255];

      gui.set('Top Color', '#87CEEB');
      gui.set('Horizon Color', '#B0C4DE');
      gui.set('Bottom Color', '#8B4513');

      updateSkyboxTexture();
    });

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