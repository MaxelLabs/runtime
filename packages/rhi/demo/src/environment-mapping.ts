/**
 * environment-mapping.ts
 * 环境映射 Demo - Phase 1: 纯反射
 *
 * 功能演示：
 * - 使用立方体贴图实现环境反射效果
 * - reflect() 函数计算反射方向
 * - samplerCube 采样立方体环境贴图
 * - 基于相机位置的视线方向计算
 * - 实时反射强度调节
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, OrbitController, Stats, GeometryGenerator, CubemapGenerator, SimpleGUI } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

layout(std140) uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

out vec3 vWorldPosition;
out vec3 vNormal;

void main() {
  vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPos.xyz;
  vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

layout(std140) uniform Camera {
  vec3 uCameraPosition;
  float uPadding;
};

layout(std140) uniform Material {
  float uReflectivity;  // 反射强度 (0.0-1.0)
  vec3 uBaseColor;      // 基础颜色
};

uniform samplerCube uEnvironmentMap;

in vec3 vWorldPosition;
in vec3 vNormal;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

  // 计算反射方向
  vec3 reflectDir = reflect(-viewDir, normal);

  // 采样环境贴图
  vec3 reflectionColor = texture(uEnvironmentMap, reflectDir).rgb;

  // 混合基础颜色和反射颜色
  vec3 finalColor = mix(uBaseColor, reflectionColor, uReflectivity);

  fragColor = vec4(finalColor, 1.0);
}
`;

// ==================== 主程序 ====================

(async function main() {
  // 1. 初始化 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: 'Environment Mapping Demo',
    clearColor: [0.1, 0.1, 0.15, 1.0],
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

  // 3. 创建深度纹理
  let depthTexture = runner.track(
    runner.device.createTexture({
      width: runner.width,
      height: runner.height,
      format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
      usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
      label: 'Depth Texture',
    })
  );

  runner.onResize(() => {
    if (depthTexture) {
      depthTexture.destroy();
    }
    depthTexture = runner.track(
      runner.device.createTexture({
        width: runner.width,
        height: runner.height,
        format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
        usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
        label: 'Depth Texture',
      })
    );
  });

  // 4. 创建球体几何体
  const sphereGeometry = GeometryGenerator.sphere({
    radius: 1,
    normals: true,
    uvs: false,
  });

  // 5. 创建顶点缓冲区
  const vertexBuffer = runner.track(
    runner.device.createBuffer({
      size: sphereGeometry.vertices.byteLength,
      usage: MSpec.RHIBufferUsage.VERTEX,
      hint: 'static',
      initialData: sphereGeometry.vertices as BufferSource,
      label: 'Sphere Vertex Buffer',
    })
  );

  // 6. 创建索引缓冲区
  const indexBuffer = runner.track(
    runner.device.createBuffer({
      size: sphereGeometry.indices!.byteLength,
      usage: MSpec.RHIBufferUsage.INDEX,
      hint: 'static',
      initialData: sphereGeometry.indices as BufferSource,
      label: 'Sphere Index Buffer',
    })
  );

  // 7. 创建 Uniform 缓冲区

  // Transforms Buffer (4 matrices * 64 bytes = 256 bytes)
  const transformBuffer = runner.track(
    runner.device.createBuffer({
      size: 256,
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: 'Transform Uniform Buffer',
    })
  );

  // Camera Buffer (vec3 + padding = 16 bytes)
  const cameraBuffer = runner.track(
    runner.device.createBuffer({
      size: 16,
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: 'Camera Uniform Buffer',
    })
  );

  // Material Buffer (float + vec3. Base align of vec3 is 16. float at 0, vec3 at 16. Total 32 bytes)
  const materialBuffer = runner.track(
    runner.device.createBuffer({
      size: 32,
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: 'Material Uniform Buffer',
    })
  );

  // 8. 加载 Bridge2 立方体贴图（复用 cubemap-skybox 的代码）
  const cubemapUrls = {
    posX: '../assets/cube/Bridge2/posx.jpg',
    negX: '../assets/cube/Bridge2/negx.jpg',
    posY: '../assets/cube/Bridge2/posy.jpg',
    negY: '../assets/cube/Bridge2/negy.jpg',
    posZ: '../assets/cube/Bridge2/posz.jpg',
    negZ: '../assets/cube/Bridge2/negz.jpg',
  };

  console.info('Loading cubemap textures...');
  const cubemapData = await CubemapGenerator.loadFromUrls(cubemapUrls);
  console.info('Cubemap loaded successfully, size:', cubemapData.size);

  const cubeTexture = runner.track(
    runner.device.createTexture({
      width: cubemapData.size,
      height: cubemapData.size,
      depthOrArrayLayers: 6,
      dimension: 'cube' as const,
      format: MSpec.RHITextureFormat.RGBA8_UNORM,
      usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
      label: 'Environment Cubemap Texture',
    } as MSpec.RHITextureDescriptor)
  );

  // 上传立方体贴图数据
  const faceOrder: (keyof typeof cubemapData.faces)[] = ['posX', 'negX', 'posY', 'negY', 'posZ', 'negZ'];
  for (let i = 0; i < 6; i++) {
    const face = faceOrder[i];
    cubeTexture.update(cubemapData.faces[face] as BufferSource, 0, 0, 0, cubemapData.size, cubemapData.size, 1, 0, i);
  }

  // 9. 创建立方体贴图采样器
  const sampler = runner.track(
    runner.device.createSampler({
      magFilter: MSpec.RHIFilterMode.LINEAR,
      minFilter: MSpec.RHIFilterMode.LINEAR,
      mipmapFilter: MSpec.RHIFilterMode.LINEAR,
      addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      addressModeW: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      label: 'Environment Cubemap Sampler',
    })
  );

  // 10. 创建着色器
  const vertexShader = runner.track(
    runner.device.createShaderModule({
      code: vertexShaderSource,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.VERTEX,
      label: 'Environment Mapping Vertex Shader',
    })
  );

  const fragmentShader = runner.track(
    runner.device.createShaderModule({
      code: fragmentShaderSource,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.FRAGMENT,
      label: 'Environment Mapping Fragment Shader',
    })
  );

  // 11. 创建绑定组布局
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
        name: 'Camera',
      },
      {
        binding: 2,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
        name: 'Material',
      },
      {
        binding: 3,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float', viewDimension: 'cube' },
        name: 'uEnvironmentMap',
      },
      {
        binding: 4,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        sampler: { type: 'filtering' },
        name: 'uEnvironmentMapSampler',
      },
    ])
  );

  // 12. 创建管线布局
  const pipelineLayout = runner.track(
    runner.device.createPipelineLayout([bindGroupLayout], 'Environment Mapping Pipeline Layout')
  );

  // 13. 顶点布局
  const vertexLayout: MSpec.RHIVertexLayout = {
    buffers: [
      {
        index: 0,
        stride: 24, // position(3*4) + normal(3*4) = 24 bytes
        stepMode: 'vertex',
        attributes: [
          { name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 },
          { name: 'aNormal', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 12, shaderLocation: 1 },
        ],
      },
    ],
  };

  // 14. 创建渲染管线
  const pipeline = runner.track(
    runner.device.createRenderPipeline({
      vertexShader,
      fragmentShader,
      vertexLayout,
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
      depthStencilState: {
        format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
        depthWriteEnabled: true,
        depthCompare: MSpec.RHICompareFunction.LESS_EQUAL,
      },
      rasterizationState: {
        cullMode: MSpec.RHICullMode.BACK,
      },
      label: 'Environment Mapping Pipeline',
    })
  );

  // 15. 创建绑定组
  const bindGroup = runner.track(
    runner.device.createBindGroup(bindGroupLayout, [
      { binding: 0, resource: { buffer: transformBuffer } },
      { binding: 1, resource: { buffer: cameraBuffer } },
      { binding: 2, resource: { buffer: materialBuffer } },
      { binding: 3, resource: cubeTexture.createView() },
      { binding: 4, resource: sampler },
    ])
  );

  // 16. 模型矩阵
  const modelMatrix = new MMath.Matrix4();

  // 17. 材质参数初始值
  let reflectivity = 0.9; // 高反射率（Chrome效果）
  let baseColor = [0.1, 0.1, 0.1]; // 深灰色基础色

  // ==================== GUI 控制 ====================
  const gui = new SimpleGUI();
  gui.addSeparator('Environment Mapping');

  // 反射强度
  gui.add('Reflectivity', {
    value: reflectivity,
    min: 0.0,
    max: 1.0,
    step: 0.01,
    onChange: (value) => {
      reflectivity = value as number;
    },
  });

  // 基础颜色
  gui.addColorPicker('Base Color', {
    value: [25 / 255, 25 / 255, 25 / 255], // RGB 0-1
    onChange: (value) => {
      const rgb = value as number[];
      baseColor = [rgb[0], rgb[1], rgb[2]];
    },
  });

  gui.addSeparator('Camera');
  gui.add('Auto Rotate', {
    value: false,
    onChange: (value) => {
      orbit.setAutoRotate(value as boolean);
    },
  });

  // ==================== 渲染循环 ====================

  runner.start((dt) => {
    orbit.update(dt);
    stats.begin();

    // 获取视图和投影矩阵
    const viewMatrix = orbit.getViewMatrix();
    const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

    // 计算法线矩阵
    const normalMatrix = new MMath.Matrix4();
    normalMatrix.copyFrom(modelMatrix);
    normalMatrix.invert();
    normalMatrix.transpose();

    // 更新 Transforms Uniform Buffer
    const transformData = new Float32Array(64); // 4 matrices * 16 floats
    transformData.set(modelMatrix.toArray(), 0);
    transformData.set(viewMatrix, 16);
    transformData.set(projMatrix, 32);
    transformData.set(normalMatrix.toArray(), 48);
    transformBuffer.update(transformData, 0);

    // 更新 Camera Uniform Buffer (vec3 + padding)
    const cameraPosition = orbit.getPosition();
    const cameraData = new Float32Array(4);
    cameraData[0] = cameraPosition.x;
    cameraData[1] = cameraPosition.y;
    cameraData[2] = cameraPosition.z;
    cameraData[3] = 0; // padding
    cameraBuffer.update(cameraData, 0);

    // 更新 Material Uniform Buffer (std140: float + vec3 with padding)
    // uReflectivity: offset 0
    // padding: 4-16
    // uBaseColor: offset 16
    const materialData = new Float32Array(8);
    materialData[0] = reflectivity;
    // padding 1, 2, 3
    materialData[4] = baseColor[0];
    materialData[5] = baseColor[1];
    materialData[6] = baseColor[2];
    // padding 7
    materialBuffer.update(materialData, 0);

    // 开始渲染
    const { encoder, passDescriptor } = runner.beginFrame();

    // 设置深度附件
    passDescriptor.depthStencilAttachment = {
      view: depthTexture.createView(),
      depthLoadOp: 'clear' as const,
      depthStoreOp: 'store' as const,
      depthClearValue: 1.0,
    };

    const renderPass = encoder.beginRenderPass(passDescriptor);

    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
    renderPass.setBindGroup(0, bindGroup);

    // 绘制球体
    renderPass.drawIndexed(sphereGeometry.indexCount!, 1, 0, 0, 0);

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
    '提示: 调整反射强度观察环境映射效果',
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
