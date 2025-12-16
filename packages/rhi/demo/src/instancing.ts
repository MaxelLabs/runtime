/**
 * instancing.ts
 * 实例化渲染（GPU Instancing）Demo
 *
 * 核心特性：
 * - 使用 GPU 实例化技术高效渲染大量相同几何体
 * - 单次 Draw Call 渲染 10000+ 个立方体
 * - 每个实例拥有独立的变换矩阵和颜色
 * - 展示 InstanceBuffer 和 InstancedRenderer 工具库的使用
 *
 * 技术要点：
 * - Per-Instance Attributes（实例属性）
 * - Vertex Buffer Divisor（顶点缓冲区分频器）
 * - 批量数据更新优化
 * - 内存布局：mat4 modelMatrix (64 bytes) + vec4 color (16 bytes) = 80 bytes/instance
 */

import { MSpec, MMath } from '@maxellabs/core';
import {
  DemoRunner,
  OrbitController,
  Stats,
  GeometryGenerator,
  SimpleGUI,
  InstanceBuffer,
  InstancedRenderer,
  getStandardInstanceLayout,
} from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

// Per-vertex attributes (Buffer 0)
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

// Per-instance attributes (Buffer 1)
layout(location = 2) in vec4 aInstanceMatrixRow0;
layout(location = 3) in vec4 aInstanceMatrixRow1;
layout(location = 4) in vec4 aInstanceMatrixRow2;
layout(location = 5) in vec4 aInstanceMatrixRow3;
layout(location = 6) in vec4 aInstanceColor;

uniform Camera {
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec3 vWorldNormal;
out vec3 vWorldPosition;
out vec4 vInstanceColor;

void main() {
  // 重建实例模型矩阵
  mat4 instanceMatrix = mat4(
    aInstanceMatrixRow0,
    aInstanceMatrixRow1,
    aInstanceMatrixRow2,
    aInstanceMatrixRow3
  );

  // 计算世界空间位置
  vec4 worldPos = instanceMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPos.xyz;

  // 计算世界空间法线（简化版，假设无非均匀缩放）
  mat3 normalMatrix = mat3(instanceMatrix);
  vWorldNormal = normalize(normalMatrix * aNormal);

  // 传递实例颜色
  vInstanceColor = aInstanceColor;

  gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform Lighting {
  vec3 uLightDirection;
  float _pad1;
  vec3 uLightColor;
  float _pad2;
  vec3 uAmbientColor;
  float _pad3;
};

in vec3 vWorldNormal;
in vec3 vWorldPosition;
in vec4 vInstanceColor;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 lightDir = normalize(uLightDirection);

  // Lambert 漫反射
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  // 环境光
  vec3 ambient = uAmbientColor;

  // 最终颜色 = (环境光 + 漫反射) * 实例颜色
  vec3 result = (ambient + diffuse) * vInstanceColor.rgb;
  fragColor = vec4(result, vInstanceColor.a);
}
`;

// ==================== 主程序 ====================

const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'GPU Instancing Demo',
  clearColor: [0.05, 0.05, 0.1, 1.0],
});

let depthTexture: MSpec.IRHITexture;

const updateDepthTexture = () => {
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
};

(async function main() {
  try {
    await runner.init();

    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 30,
      enableDamping: true,
      minDistance: 5,
      maxDistance: 100,
    });

    updateDepthTexture();
    runner.onResize(updateDepthTexture);

    // ==================== 创建基础几何体（立方体）====================
    const cubeGeometry = GeometryGenerator.cube({
      size: 0.8,
      normals: true,
      uvs: false,
    });

    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: cubeGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: cubeGeometry.vertices as BufferSource,
        label: 'Cube Vertex Buffer',
      })
    );

    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: cubeGeometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: cubeGeometry.indices as BufferSource,
        label: 'Cube Index Buffer',
      })
    );

    // ==================== 创建实例缓冲区 ====================
    const MAX_INSTANCES = 10000;
    const instanceBuffer = runner.track(
      new InstanceBuffer(runner.device, {
        maxInstances: MAX_INSTANCES,
        instanceLayout: getStandardInstanceLayout(2), // location 2-6
        dynamic: true,
        label: 'CubeInstanceBuffer',
      })
    );

    // ==================== 创建实例化渲染器 ====================
    const instancedRenderer = new InstancedRenderer(runner.device, instanceBuffer, {
      vertexBuffer,
      indexBuffer,
      vertexCount: cubeGeometry.vertexCount,
      indexCount: cubeGeometry.indexCount,
      indexFormat: MSpec.RHIIndexFormat.UINT16,
    });

    // ==================== 创建 Uniform 缓冲区 ====================
    // Camera Uniform: mat4 view + mat4 projection = 128 bytes
    const cameraBuffer = runner.track(
      runner.device.createBuffer({
        size: 128,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Camera Uniform Buffer',
      })
    );

    // Lighting Uniform: vec3 + pad + vec3 + pad + vec3 + pad = 48 bytes
    const lightingBuffer = runner.track(
      runner.device.createBuffer({
        size: 48,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Lighting Uniform Buffer',
      })
    );

    // ==================== 创建着色器 ====================
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
      })
    );

    // ==================== 创建绑定组布局 ====================
    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout([
        { binding: 0, visibility: MSpec.RHIShaderStage.VERTEX, buffer: { type: 'uniform' }, name: 'Camera' },
        { binding: 1, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'Lighting' },
      ])
    );

    // ==================== 创建渲染管线 ====================
    const pipelineLayout = runner.track(runner.device.createPipelineLayout([bindGroupLayout]));

    // 获取顶点布局（基础几何 + 实例属性）
    const vertexBufferLayouts = instancedRenderer.getVertexBufferLayouts(24); // 24 = vec3 pos + vec3 normal

    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: vertexBufferLayouts,
    };

    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        rasterizationState: { cullMode: MSpec.RHICullMode.BACK },
        depthStencilState: {
          depthWriteEnabled: true,
          depthCompare: MSpec.RHICompareFunction.LESS,
          format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
        },
      })
    );

    // ==================== 创建绑定组 ====================
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: { buffer: cameraBuffer } },
        { binding: 1, resource: { buffer: lightingBuffer } },
      ])
    );

    // ==================== GUI 参数 ====================
    const gui = new SimpleGUI();
    const params = {
      instanceCount: 1000,
      gridSize: 10,
      spacing: 2.0,
      rotationSpeed: 0.5,
      colorMode: 0, // 0: position-based, 1: random, 2: gradient
      animatePositions: false,
    };

    gui.addSeparator('实例化参数 (Instancing)');
    gui.add('instanceCount', {
      value: params.instanceCount,
      min: 100,
      max: MAX_INSTANCES,
      step: 100,
      onChange: (v) => {
        params.instanceCount = v as number;
        updateInstanceData();
      },
    });
    gui.add('spacing', {
      value: params.spacing,
      min: 1.0,
      max: 5.0,
      step: 0.1,
      onChange: (v) => {
        params.spacing = v as number;
        updateInstanceData();
      },
    });
    gui.add('rotationSpeed', {
      value: params.rotationSpeed,
      min: 0,
      max: 2.0,
      step: 0.1,
      onChange: (v) => (params.rotationSpeed = v as number),
    });

    gui.addSeparator('颜色模式 (Color Mode)');
    gui.add('colorMode', {
      value: params.colorMode,
      min: 0,
      max: 2,
      step: 1,
      onChange: (v) => {
        params.colorMode = v as number;
        updateInstanceData();
      },
    });

    gui.addSeparator('动画 (Animation)');
    gui.add('animatePositions', {
      value: params.animatePositions,
      onChange: (v) => (params.animatePositions = v as boolean),
    });

    // ==================== 实例数据生成 ====================
    const instanceData = new Float32Array(MAX_INSTANCES * 20); // 80 bytes = 20 floats per instance
    const tempMatrix = new MMath.Matrix4();
    const tempVec = new MMath.Vector3();

    const updateInstanceData = () => {
      const count = params.instanceCount;
      const spacing = params.spacing;

      // 计算网格尺寸
      const gridDim = Math.ceil(Math.cbrt(count));
      const halfGrid = (gridDim * spacing) / 2;

      for (let i = 0; i < count; i++) {
        const offset = i * 20;

        // 计算 3D 网格位置
        const ix = i % gridDim;
        const iy = Math.floor((i / gridDim) % gridDim);
        const iz = Math.floor(i / (gridDim * gridDim));

        const x = ix * spacing - halfGrid;
        const y = iy * spacing - halfGrid;
        const z = iz * spacing - halfGrid;

        // 设置模型矩阵（平移）
        tempVec.set(x, y, z);
        tempMatrix.identity().translate(tempVec);
        const matrixArray = tempMatrix.toArray();
        instanceData.set(matrixArray, offset);

        // 设置颜色
        let r: number, g: number, b: number;
        switch (params.colorMode) {
          case 0: // Position-based
            r = (ix / gridDim) * 0.8 + 0.2;
            g = (iy / gridDim) * 0.8 + 0.2;
            b = (iz / gridDim) * 0.8 + 0.2;
            break;
          case 1: // Random
            r = Math.random() * 0.8 + 0.2;
            g = Math.random() * 0.8 + 0.2;
            b = Math.random() * 0.8 + 0.2;
            break;
          case 2: {
            // Gradient
            const t = i / count;
            r = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
            g = Math.sin(t * Math.PI * 2 + (Math.PI * 2) / 3) * 0.5 + 0.5;
            b = Math.sin(t * Math.PI * 2 + (Math.PI * 4) / 3) * 0.5 + 0.5;
            break;
          }

          default:
            r = g = b = 1.0;
        }
        instanceData.set([r, g, b, 1.0], offset + 16);
      }

      // 批量更新到 GPU
      instanceBuffer.updateAll(instanceData, count);
    };

    // 初始化实例数据
    updateInstanceData();

    // ==================== 光照参数 ====================
    const lightingData = new Float32Array(12);
    lightingData.set([0.5, 1.0, 0.3, 0], 0); // lightDirection + padding
    lightingData.set([1.0, 1.0, 1.0, 0], 4); // lightColor + padding
    lightingData.set([0.2, 0.2, 0.3, 0], 8); // ambientColor + padding
    lightingBuffer.update(lightingData, 0);

    // ==================== 渲染循环 ====================
    let time = 0;
    const cameraData = new Float32Array(32);

    runner.start((dt) => {
      orbit.update(dt);
      stats.begin();

      time += dt * params.rotationSpeed;

      // 动画更新（可选）
      if (params.animatePositions) {
        const count = params.instanceCount;
        const spacing = params.spacing;
        const gridDim = Math.ceil(Math.cbrt(count));
        const halfGrid = (gridDim * spacing) / 2;

        for (let i = 0; i < count; i++) {
          const offset = i * 20;

          const ix = i % gridDim;
          const iy = Math.floor((i / gridDim) % gridDim);
          const iz = Math.floor(i / (gridDim * gridDim));

          const x = ix * spacing - halfGrid;
          const y = iy * spacing - halfGrid + Math.sin(time + i * 0.1) * 0.5;
          const z = iz * spacing - halfGrid;

          // 添加旋转动画
          tempVec.set(x, y, z);
          tempMatrix
            .identity()
            .translate(tempVec)
            .rotateY(time + i * 0.01);

          const matrixArray = tempMatrix.toArray();
          instanceData.set(matrixArray, offset);
        }

        instanceBuffer.updateAll(instanceData, count);
      }

      // 更新相机 Uniform
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);
      cameraData.set(viewMatrix, 0);
      cameraData.set(projMatrix, 16);
      cameraBuffer.update(cameraData, 0);

      // 渲染
      const { encoder, passDescriptor } = runner.beginFrame();
      passDescriptor.depthStencilAttachment = {
        view: depthTexture.createView(),
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
      };

      const renderPass = encoder.beginRenderPass(passDescriptor);
      renderPass.setPipeline(pipeline);
      renderPass.setBindGroup(0, bindGroup);

      // 使用实例化渲染器执行 Draw Call
      instancedRenderer.draw(renderPass, params.instanceCount);

      renderPass.end();
      runner.endFrame(encoder);

      stats.end();
    });

    // ==================== 帮助信息和键盘事件 ====================
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      'R: 重置视角',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);

    runner.onKey('r', () => {
      orbit.reset();
    });

    runner.onKey('Escape', () => {
      if (depthTexture) {
        depthTexture.destroy();
      }
      stats.destroy();
      orbit.destroy();
      gui.destroy();
      instanceBuffer.destroy();
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

    // 显示统计信息
    const instanceStats = instanceBuffer.getStats();
    console.info('[Instancing Demo] Initialized');
    console.info(`  Max Instances: ${instanceStats.maxInstances}`);
    console.info(`  Buffer Size: ${(instanceStats.bufferSize / 1024).toFixed(2)} KB`);
    console.info(`  Stride: ${instanceStats.strideBytes} bytes/instance`);
  } catch (error) {
    console.error('Instancing Demo Error:', error);
    throw error;
  }
})();
