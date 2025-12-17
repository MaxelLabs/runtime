/**
 * point-lights.ts
 * 点光源（Point Lights）Demo
 *
 * 核心特性：
 * - 支持多个点光源（最多 4 个）
 * - 从点发出的光，具有距离衰减效果
 * - 距离衰减公式：1.0 / (constant + linear * distance + quadratic * distance²)
 * - 典型应用：灯泡、火把、蜡烛
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, OrbitController, Stats, GeometryGenerator, SimpleGUI } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

out vec3 vWorldPosition;
out vec3 vNormal;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

struct PointLight {
  vec3 position;     // 16 bytes (with padding)
  vec3 color;        // 16 bytes (with padding)
  float constant;    // 4 bytes
  float linear;      // 4 bytes
  float quadratic;   // 4 bytes
  float _padding;    // 4 bytes (alignment)
};

layout(std140) uniform PointLights {
  PointLight uLights[4];  // 192 bytes
  int uLightCount;        // 4 bytes
  float uAmbientIntensity;// 4 bytes
  float uShininess;       // 4 bytes
  float _padding;         // 4 bytes
};

uniform CameraData {
  vec3 uCameraPosition;
};

in vec3 vWorldPosition;
in vec3 vNormal;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

  // 环境光
  vec3 ambient = uAmbientIntensity * vec3(1.0);
  vec3 totalDiffuse = vec3(0.0);
  vec3 totalSpecular = vec3(0.0);

  // 遍历所有激活的点光源
  for (int i = 0; i < 4; i++) {
    if (i >= uLightCount) break;

    PointLight light = uLights[i];

    // 计算光照方向和距离
    vec3 lightDir = light.position - vWorldPosition;
    float distance = length(lightDir);
    lightDir = normalize(lightDir);

    // 距离衰减
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * distance * distance);

    // 漫反射（Lambert）
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * light.color * attenuation;
    totalDiffuse += diffuse;

    // 镜面反射（Phong）
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
    vec3 specular = spec * light.color * attenuation;
    totalSpecular += specular;
  }

  vec3 result = ambient + totalDiffuse + totalSpecular;
  fragColor = vec4(result, 1.0);
}
`;

// ==================== 主程序 ====================

const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'Point Lights Demo',
  clearColor: [0.1, 0.1, 0.1, 1.0],
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
      distance: 5,
      enableDamping: true,
    });

    updateDepthTexture();
    runner.onResize(updateDepthTexture);

    // 创建球体几何体
    const sphereGeometry = GeometryGenerator.sphere({
      radius: 1,
      normals: true,
      uvs: false,
    });

    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: sphereGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: sphereGeometry.vertices as BufferSource,
        label: 'Sphere Vertex Buffer',
      })
    );

    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: sphereGeometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: sphereGeometry.indices as BufferSource,
        label: 'Sphere Index Buffer',
      })
    );

    // 创建 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256, // mat4(64)*4
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // PointLights Uniform: 208 bytes (std140)
    const lightsBuffer = runner.track(
      runner.device.createBuffer({
        size: 208,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Point Lights Uniform Buffer',
      })
    );

    // Camera Uniform: 16 bytes (vec3 with padding)
    const cameraBuffer = runner.track(
      runner.device.createBuffer({
        size: 16,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Camera Uniform Buffer',
      })
    );

    // 创建着色器
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

    // 创建绑定组布局
    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout([
        { binding: 0, visibility: MSpec.RHIShaderStage.VERTEX, buffer: { type: 'uniform' }, name: 'Transforms' },
        { binding: 1, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'PointLights' },
        { binding: 2, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'CameraData' },
      ])
    );

    // 创建管线
    const pipelineLayout = runner.track(runner.device.createPipelineLayout([bindGroupLayout]));
    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0,
          stride: 24, // position(12) + normal(12)
          stepMode: 'vertex',
          attributes: [
            { name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 },
            { name: 'aNormal', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 12, shaderLocation: 1 },
          ],
        },
      ],
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

    // 创建绑定组
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: { buffer: transformBuffer } },
        { binding: 1, resource: { buffer: lightsBuffer } },
        { binding: 2, resource: { buffer: cameraBuffer } },
      ])
    );

    // GUI 和光照参数
    const gui = new SimpleGUI();
    const params = {
      lightCount: 2,
      ambientIntensity: 0.1,
      shininess: 32.0,
      // Light 1
      light1X: 2.0,
      light1Y: 2.0,
      light1Z: 2.0,
      light1R: 1.0,
      light1G: 0.0,
      light1B: 0.0,
      light1Constant: 1.0,
      light1Linear: 0.09,
      light1Quadratic: 0.032,
      // Light 2
      light2X: -2.0,
      light2Y: 2.0,
      light2Z: -2.0,
      light2R: 0.0,
      light2G: 1.0,
      light2B: 0.0,
      light2Constant: 1.0,
      light2Linear: 0.09,
      light2Quadratic: 0.032,
      // Light 3
      light3X: 0.0,
      light3Y: -2.0,
      light3Z: 2.0,
      light3R: 0.0,
      light3G: 0.0,
      light3B: 1.0,
      light3Constant: 1.0,
      light3Linear: 0.09,
      light3Quadratic: 0.032,
      // Light 4
      light4X: 0.0,
      light4Y: 3.0,
      light4Z: 0.0,
      light4R: 1.0,
      light4G: 1.0,
      light4B: 1.0,
      light4Constant: 1.0,
      light4Linear: 0.09,
      light4Quadratic: 0.032,
    };

    gui.addSeparator('全局光照 (Global Lighting)');
    gui.add('lightCount', {
      value: params.lightCount,
      min: 1,
      max: 4,
      step: 1,
      onChange: (v) => (params.lightCount = v as number),
    });
    gui.add('ambientIntensity', {
      value: params.ambientIntensity,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => (params.ambientIntensity = v as number),
    });
    gui.add('shininess', {
      value: params.shininess,
      min: 1,
      max: 128,
      step: 1,
      onChange: (v) => (params.shininess = v as number),
    });

    // Light 1
    gui.addSeparator('光源 1 - 位置 (Light 1 - Position)');
    gui.add('light1X', {
      value: params.light1X,
      min: -5,
      max: 5,
      step: 0.1,
      onChange: (v) => (params.light1X = v as number),
    });
    gui.add('light1Y', {
      value: params.light1Y,
      min: -5,
      max: 5,
      step: 0.1,
      onChange: (v) => (params.light1Y = v as number),
    });
    gui.add('light1Z', {
      value: params.light1Z,
      min: -5,
      max: 5,
      step: 0.1,
      onChange: (v) => (params.light1Z = v as number),
    });
    gui.addSeparator('光源 1 - 衰减 (Light 1 - Attenuation)');
    gui.add('light1Constant', {
      value: params.light1Constant,
      min: 0.1,
      max: 2,
      step: 0.01,
      onChange: (v) => (params.light1Constant = v as number),
    });
    gui.add('light1Linear', {
      value: params.light1Linear,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => (params.light1Linear = v as number),
    });
    gui.add('light1Quadratic', {
      value: params.light1Quadratic,
      min: 0,
      max: 1,
      step: 0.001,
      onChange: (v) => (params.light1Quadratic = v as number),
    });

    // Light 2
    gui.addSeparator('光源 2 - 位置 (Light 2 - Position)');
    gui.add('light2X', {
      value: params.light2X,
      min: -5,
      max: 5,
      step: 0.1,
      onChange: (v) => (params.light2X = v as number),
    });
    gui.add('light2Y', {
      value: params.light2Y,
      min: -5,
      max: 5,
      step: 0.1,
      onChange: (v) => (params.light2Y = v as number),
    });
    gui.add('light2Z', {
      value: params.light2Z,
      min: -5,
      max: 5,
      step: 0.1,
      onChange: (v) => (params.light2Z = v as number),
    });

    // 渲染循环
    const modelMatrix = new MMath.Matrix4();
    const normalMatrix = new MMath.Matrix4();
    const lightsData = new Float32Array(52); // 208 bytes / 4 = 52 floats
    const transformData = new Float32Array(64); // 预分配变换数据
    const cameraData = new Float32Array(4); // 预分配相机数据

    runner.start((dt) => {
      orbit.update(dt);
      stats.begin();

      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      modelMatrix.identity().rotateY(Date.now() * 0.0005);
      normalMatrix.copyFrom(modelMatrix).invert().transpose();

      // 更新变换矩阵 Uniform（使用预分配数组）
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformData.set(normalMatrix.toArray(), 48);
      transformBuffer.update(transformData, 0);

      // 更新光照 Uniform (std140)
      // Light 1: offset 0-11 (48 bytes = 12 floats)
      lightsData.set([params.light1X, params.light1Y, params.light1Z, 0], 0);
      lightsData.set([params.light1R, params.light1G, params.light1B, 0], 4);
      lightsData.set([params.light1Constant, params.light1Linear, params.light1Quadratic, 0], 8);

      // Light 2: offset 12-23 (48 bytes = 12 floats)
      lightsData.set([params.light2X, params.light2Y, params.light2Z, 0], 12);
      lightsData.set([params.light2R, params.light2G, params.light2B, 0], 16);
      lightsData.set([params.light2Constant, params.light2Linear, params.light2Quadratic, 0], 20);

      // Light 3: offset 24-35 (48 bytes = 12 floats)
      lightsData.set([params.light3X, params.light3Y, params.light3Z, 0], 24);
      lightsData.set([params.light3R, params.light3G, params.light3B, 0], 28);
      lightsData.set([params.light3Constant, params.light3Linear, params.light3Quadratic, 0], 32);

      // Light 4: offset 36-47 (48 bytes = 12 floats)
      lightsData.set([params.light4X, params.light4Y, params.light4Z, 0], 36);
      lightsData.set([params.light4R, params.light4G, params.light4B, 0], 40);
      lightsData.set([params.light4Constant, params.light4Linear, params.light4Quadratic, 0], 44);

      // Global parameters: offset 48-51 (16 bytes = 4 floats)
      lightsData[48] = params.lightCount;
      lightsData[49] = params.ambientIntensity;
      lightsData[50] = params.shininess;
      lightsData[51] = 0; // padding

      lightsBuffer.update(lightsData, 0);

      // 更新相机位置（使用预分配数组）
      const cameraPosition = orbit.getPosition();
      cameraData[0] = cameraPosition.x;
      cameraData[1] = cameraPosition.y;
      cameraData[2] = cameraPosition.z;
      cameraData[3] = 0;
      cameraBuffer.update(cameraData, 0);

      const { encoder, passDescriptor } = runner.beginFrame();
      passDescriptor.depthStencilAttachment = {
        view: depthTexture.createView(),
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
      };

      const renderPass = encoder.beginRenderPass(passDescriptor);
      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.drawIndexed(sphereGeometry.indexCount!, 1, 0, 0, 0);
      renderPass.end();

      runner.endFrame(encoder);
      stats.end();
    });

    DemoRunner.showHelp(['ESC: 退出 Demo', 'F11: 切换全屏', 'R: 重置视角']);

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
    console.error('Point Lights Demo Error:', error);
    throw error;
  }
})();
