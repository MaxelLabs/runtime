/**
 * cubemap-skybox.ts
 * 立方体贴图天空盒演示 Demo
 *
 * 功能演示：
 * - 使用 CubemapGenerator 从图片加载立方体贴图
 * - 创建反转的立方体几何体用于内部渲染天空盒
 * - 实现 samplerCube 着色器采样立方体贴图
 * - 使用 gl_Position.xyww 技巧实现无限深度效果
 * - SimpleGUI 控制天空盒强度和旋转速度
 * - 轨道控制器和性能监控
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, OrbitController, Stats, GeometryGenerator, CubemapGenerator, SimpleGUI } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

layout(std140) uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

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
precision highp float;

layout(std140) uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

layout(std140) uniform Params {
  float uIntensity;
  float uRotationSpeed;
  float uTime;
  float uPadding;
};

uniform samplerCube uSkybox;

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

  // 7. 加载 Bridge2 立方体贴图

  const cubemapUrls = {
    posX: '../assets/cube/Bridge2/posx.jpg',
    negX: '../assets/cube/Bridge2/negx.jpg',
    posY: '../assets/cube/Bridge2/posy.jpg',
    negY: '../assets/cube/Bridge2/negy.jpg',
    posZ: '../assets/cube/Bridge2/posz.jpg',
    negZ: '../assets/cube/Bridge2/negz.jpg',
  };

  const cubemapData = await CubemapGenerator.loadFromUrls(cubemapUrls);

  const cubeTexture = runner.track(
    runner.device.createTexture({
      width: cubemapData.size,
      height: cubemapData.size,
      depthOrArrayLayers: 6,
      dimension: 'cube' as const,
      format: MSpec.RHITextureFormat.RGBA8_UNORM,
      usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
      label: 'Skybox Cubemap Texture',
    } as MSpec.RHITextureDescriptor)
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
    } as MSpec.RHISamplerDescriptor)
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
  const pipelineLayout = runner.track(runner.device.createPipelineLayout([bindGroupLayout], 'Skybox Pipeline Layout'));

  // 12. 顶点布局
  const vertexLayout: MSpec.RHIVertexLayout = {
    buffers: [
      {
        index: 0,
        stride: 12, // 3 floats (position) = 12 bytes
        stepMode: 'vertex',
        attributes: [{ name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 }],
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

  // ==================== GUI 控制 ====================
  const gui = new SimpleGUI();
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
})();
