/**
 * spotlight.ts
 * 聚光灯（Spotlight）Demo
 *
 * 核心特性：
 * - 锥形光束效果（内外锥角）
 * - 位置 + 方向向量
 * - 距离衰减
 * - 边缘平滑过渡（smoothstep）
 * - 典型应用：手电筒、舞台灯、车灯
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

layout(std140) uniform Spotlight {
  vec3 uLightPosition;      // 16 bytes (12 + 4 padding)
  vec3 uLightDirection;     // 16 bytes (12 + 4 padding)
  vec3 uLightColor;         // 16 bytes (12 + 4 padding)
  float uInnerCutoff;       // 4 bytes (cos of inner angle)
  float uOuterCutoff;       // 4 bytes (cos of outer angle)
  float uConstant;          // 4 bytes
  float uLinear;            // 4 bytes
  float uQuadratic;         // 4 bytes
  float uAmbientIntensity;  // 4 bytes
  float uShininess;         // 4 bytes
  float _padding;           // 4 bytes
};

uniform CameraData {
  vec3 uCameraPosition;
};

in vec3 vWorldPosition;
in vec3 vNormal;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightPosition - vWorldPosition);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

  // 距离衰减
  float distance = length(uLightPosition - vWorldPosition);
  float attenuation = 1.0 / (uConstant + uLinear * distance + uQuadratic * distance * distance);

  // 锥角计算（Spotlight 效果）
  float theta = dot(lightDir, normalize(-uLightDirection));
  float epsilon = uInnerCutoff - uOuterCutoff;
  float spotIntensity = clamp((theta - uOuterCutoff) / epsilon, 0.0, 1.0);

  // 环境光
  vec3 ambient = uAmbientIntensity * uLightColor;

  // 漫反射（Lambert）
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  // 镜面反射（Phong）
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
  vec3 specular = spec * uLightColor;

  // 应用衰减和聚光灯强度
  ambient *= attenuation * spotIntensity;
  diffuse *= attenuation * spotIntensity;
  specular *= attenuation * spotIntensity;

  vec3 result = ambient + diffuse + specular;
  fragColor = vec4(result, 1.0);
}
`;

// ==================== 主程序 ====================

const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'Spotlight Demo',
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

    // Spotlight Uniform: 80 bytes (std140)
    // vec3(16) * 3 + float(4) * 8 = 48 + 32 = 80 bytes
    const spotlightBuffer = runner.track(
      runner.device.createBuffer({
        size: 80,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Spotlight Uniform Buffer',
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
        { binding: 1, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'Spotlight' },
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
        { binding: 1, resource: { buffer: spotlightBuffer } },
        { binding: 2, resource: { buffer: cameraBuffer } },
      ])
    );

    // GUI 和光照参数
    const gui = new SimpleGUI();
    const params = {
      lightPosX: 0.0,
      lightPosY: 3.0,
      lightPosZ: 2.0,
      lightDirX: 0.0,
      lightDirY: -1.0,
      lightDirZ: -0.5,
      innerAngle: 12.5,
      outerAngle: 17.5,
      constant: 1.0,
      linear: 0.09,
      quadratic: 0.032,
      ambientIntensity: 0.1,
      shininess: 32.0,
    };

    gui.addSeparator('光源位置 (Light Position)');
    gui.add('lightPosX', {
      value: params.lightPosX,
      min: -5,
      max: 5,
      step: 0.1,
      onChange: (v) => (params.lightPosX = v as number),
    });
    gui.add('lightPosY', {
      value: params.lightPosY,
      min: -5,
      max: 5,
      step: 0.1,
      onChange: (v) => (params.lightPosY = v as number),
    });
    gui.add('lightPosZ', {
      value: params.lightPosZ,
      min: -5,
      max: 5,
      step: 0.1,
      onChange: (v) => (params.lightPosZ = v as number),
    });

    gui.addSeparator('光照方向 (Light Direction)');
    gui.add('lightDirX', {
      value: params.lightDirX,
      min: -1,
      max: 1,
      step: 0.05,
      onChange: (v) => (params.lightDirX = v as number),
    });
    gui.add('lightDirY', {
      value: params.lightDirY,
      min: -1,
      max: 1,
      step: 0.05,
      onChange: (v) => (params.lightDirY = v as number),
    });
    gui.add('lightDirZ', {
      value: params.lightDirZ,
      min: -1,
      max: 1,
      step: 0.05,
      onChange: (v) => (params.lightDirZ = v as number),
    });

    gui.addSeparator('锥角设置 (Cone Angles)');
    gui.add('innerAngle', {
      value: params.innerAngle,
      min: 0,
      max: 45,
      step: 0.5,
      onChange: (v) => (params.innerAngle = v as number),
    });
    gui.add('outerAngle', {
      value: params.outerAngle,
      min: 0,
      max: 45,
      step: 0.5,
      onChange: (v) => (params.outerAngle = v as number),
    });

    gui.addSeparator('衰减参数 (Attenuation)');
    gui.add('constant', {
      value: params.constant,
      min: 0.1,
      max: 2,
      step: 0.01,
      onChange: (v) => (params.constant = v as number),
    });
    gui.add('linear', {
      value: params.linear,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => (params.linear = v as number),
    });
    gui.add('quadratic', {
      value: params.quadratic,
      min: 0,
      max: 1,
      step: 0.001,
      onChange: (v) => (params.quadratic = v as number),
    });

    gui.addSeparator('光照强度 (Intensity)');
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

    // 渲染循环
    const modelMatrix = new MMath.Matrix4();
    const normalMatrix = new MMath.Matrix4();
    const spotlightData = new Float32Array(20); // 80 bytes / 4 = 20 floats
    const transformData = new Float32Array(64); // 预分配变换数据
    const cameraData = new Float32Array(4); // 预分配相机数据
    const lightDir = new MMath.Vector3(); // 预分配光照方向向量

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

      // 更新 Spotlight Uniform (std140)
      // Light Position: offset 0-3 (16 bytes)
      spotlightData.set([params.lightPosX, params.lightPosY, params.lightPosZ, 0], 0);

      // Light Direction: offset 4-7 (16 bytes)
      lightDir.set(params.lightDirX, params.lightDirY, params.lightDirZ).normalize();
      spotlightData.set([lightDir.x, lightDir.y, lightDir.z, 0], 4);

      // Light Color: offset 8-11 (16 bytes) - white light
      spotlightData.set([1.0, 1.0, 1.0, 0], 8);

      // Cone angles (convert to cosine): offset 12-13
      spotlightData[12] = Math.cos(MMath.degToRad(params.innerAngle));
      spotlightData[13] = Math.cos(MMath.degToRad(params.outerAngle));

      // Attenuation: offset 14-16
      spotlightData[14] = params.constant;
      spotlightData[15] = params.linear;
      spotlightData[16] = params.quadratic;

      // Intensity and shininess: offset 17-19
      spotlightData[17] = params.ambientIntensity;
      spotlightData[18] = params.shininess;
      spotlightData[19] = 0; // padding

      spotlightBuffer.update(spotlightData, 0);

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
    console.error('Spotlight Demo Error:', error);
    throw error;
  }
})();
