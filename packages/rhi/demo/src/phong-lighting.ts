/**
 * phong-lighting.ts
 * Phong 光照模型（逐片元） Demo
 *
 * 功能演示：
 * - 在片元着色器中实现完整的 Phong 光照模型
 * - 包含环境光（Ambient）、漫反射（Diffuse）和镜面光（Specular）
 * - 使用 reflect() 函数计算反射向量
 * - GUI 实时调整光照参数
 * - std140 内存布局的 Uniform Buffer
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

uniform Lighting {
  vec3 uLightDirection;   // 视图空间下的光照方向
  vec3 uCameraPosition;   // 相机世界坐标
  float uAmbientIntensity;
  float uDiffuseIntensity;
  float uSpecularIntensity;
  float uShininess;
};

in vec3 vWorldPosition;
in vec3 vNormal;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightDirection);

  // Ambient
  vec3 ambient = uAmbientIntensity * vec3(1.0);

  // Diffuse
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = uDiffuseIntensity * diff * vec3(1.0);

  // Specular
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
  vec3 specular = uSpecularIntensity * spec * vec3(1.0, 1.0, 1.0);

  vec3 result = ambient + diffuse + specular;
  fragColor = vec4(result, 1.0);
}
`;

// ==================== 主程序 ====================

// 1. 初始化 DemoRunner
const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'Phong Lighting Demo',
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

    // 2. 初始化性能监控和相机控制
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 5,
      enableDamping: true,
    });

    updateDepthTexture();
    runner.onResize(updateDepthTexture);

    // 3. 创建球体几何体
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

    // 4. 创建 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256, // mat4(64)*4
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // std140: vec3 needs 16 bytes padding
    const lightingBuffer = runner.track(
      runner.device.createBuffer({
        size: 48, // vec3(16) + vec3(16) + float(4) * 4 = 48
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Lighting Uniform Buffer',
      })
    );

    // 5. 创建着色器
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

    // 6. 创建绑定组布局
    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout([
        { binding: 0, visibility: MSpec.RHIShaderStage.VERTEX, buffer: { type: 'uniform' }, name: 'Transforms' },
        { binding: 1, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'Lighting' },
      ])
    );

    // 7. 创建管线
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

    // 8. 创建绑定组
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: { buffer: transformBuffer } },
        { binding: 1, resource: { buffer: lightingBuffer } },
      ])
    );

    // 9. GUI 和光照参数
    const gui = new SimpleGUI();
    const params = {
      lightX: 0.5,
      lightY: 0.5,
      lightZ: 0.5,
      ambientIntensity: 0.1,
      diffuseIntensity: 0.8,
      specularIntensity: 0.6,
      shininess: 32.0,
    };

    gui.add('Light Direction X', {
      value: params.lightX,
      min: -1,
      max: 1,
      step: 0.01,
      onChange: (v) => (params.lightX = v as number),
    });
    gui.add('Light Direction Y', {
      value: params.lightY,
      min: -1,
      max: 1,
      step: 0.01,
      onChange: (v) => (params.lightY = v as number),
    });
    gui.add('Light Direction Z', {
      value: params.lightZ,
      min: -1,
      max: 1,
      step: 0.01,
      onChange: (v) => (params.lightZ = v as number),
    });
    gui.addSeparator();
    gui.add('Ambient Intensity', {
      value: params.ambientIntensity,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => (params.ambientIntensity = v as number),
    });
    gui.add('Diffuse Intensity', {
      value: params.diffuseIntensity,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => (params.diffuseIntensity = v as number),
    });
    gui.add('Specular Intensity', {
      value: params.specularIntensity,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => (params.specularIntensity = v as number),
    });
    gui.add('Shininess', {
      value: params.shininess,
      min: 1,
      max: 128,
      step: 1,
      onChange: (v) => (params.shininess = v as number),
    });

    // 10. 渲染循环
    const modelMatrix = new MMath.Matrix4();
    const normalMatrix = new MMath.Matrix4();
    const lightingData = new Float32Array(12); // 3*vec3 + 4*float, with padding
    const transformData = new Float32Array(64); // 预分配变换数据
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

      // 更新光照 Uniform (std140)
      lightDir.set(params.lightX, params.lightY, params.lightZ).normalize();
      lightingData.set([lightDir.x, lightDir.y, lightDir.z], 0);
      const cameraPosition = orbit.getPosition();
      lightingData.set([cameraPosition.x, cameraPosition.y, cameraPosition.z], 4);
      lightingData[8] = params.ambientIntensity;
      lightingData[9] = params.diffuseIntensity;
      lightingData[10] = params.specularIntensity;
      lightingData[11] = params.shininess;
      lightingBuffer.update(lightingData, 0);

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
    console.error('Phong Lighting Demo Error:', error);
    throw error;
  }
})();
