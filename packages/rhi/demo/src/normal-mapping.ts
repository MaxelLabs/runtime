/**
 * normal-mapping.ts
 * 法线贴图 (Normal Mapping) Demo
 *
 * 功能演示：
 * - 切线空间 (Tangent Space) 法线映射
 * - TBN 矩阵构建 (Tangent-Bitangent-Normal)
 * - 程序化法线贴图生成
 * - Phong 光照模型结合法线映射
 * - 实时切换法线贴图图案和强度
 *
 * 技术要点：
 * - 顶点着色器计算 TBN 矩阵并传递到片元着色器
 * - Gram-Schmidt 正交化确保切线和法线正交
 * - 法线贴图采样后从 [0,1] 转换到 [-1,1]
 * - 使用 TBN 矩阵将切线空间法线转换到世界空间
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, OrbitController, Stats, GeometryGenerator, SimpleGUI, ProceduralTexture } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;
layout(location = 3) in vec3 aTangent;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

out vec3 vWorldPosition;
out vec2 vTexCoord;
out mat3 vTBN;

void main() {
  // 变换到世界空间
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;

  // 变换切线和法线到世界空间
  vec3 T = normalize((uNormalMatrix * vec4(aTangent, 0.0)).xyz);
  vec3 N = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);

  // Gram-Schmidt 正交化（重新正交化切线）
  T = normalize(T - dot(T, N) * N);

  // 计算副切线（Bitangent）
  vec3 B = cross(N, T);

  // 构建 TBN 矩阵（切线空间到世界空间的变换矩阵）
  vTBN = mat3(T, B, N);

  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform sampler2D uNormalMap;

uniform Lighting {
  vec3 uLightPosition;    // 光源世界坐标
  float _padding1;        // std140 padding
  vec3 uCameraPosition;   // 相机世界坐标
  float _padding2;        // std140 padding
  vec3 uLightColor;       // 光源颜色
  float uAmbientIntensity;
  float uDiffuseIntensity;
  float uSpecularIntensity;
  float uShininess;
  float uNormalStrength;  // 法线强度
};

uniform Settings {
  float uEnableNormalMap; // 是否启用法线贴图 (0.0 = 禁用, 1.0 = 启用)
  float _pad1;
  float _pad2;
  float _pad3;
};

in vec3 vWorldPosition;
in vec2 vTexCoord;
in mat3 vTBN;

out vec4 fragColor;

void main() {
  // 从法线贴图采样（切线空间，范围 [0,1]）
  vec3 normalTS = texture(uNormalMap, vTexCoord).rgb;
  // 转换到 [-1, 1]
  normalTS = normalTS * 2.0 - 1.0;

  // 应用法线强度
  normalTS.xy *= uNormalStrength;
  normalTS = normalize(normalTS);

  // 转换到世界空间
  vec3 normalWS = normalize(vTBN * normalTS);

  // 如果禁用法线贴图，使用 TBN 的 Z 分量（原始法线）
  vec3 normal = mix(normalize(vTBN[2]), normalWS, uEnableNormalMap);

  // 计算光照方向
  vec3 lightDir = normalize(uLightPosition - vWorldPosition);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

  // Ambient（环境光）
  vec3 ambient = uAmbientIntensity * uLightColor;

  // Diffuse（漫反射）
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = uDiffuseIntensity * diff * uLightColor;

  // Specular（镜面反射）
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
  vec3 specular = uSpecularIntensity * spec * uLightColor;

  // 材质颜色（浅灰色）
  vec3 materialColor = vec3(0.8, 0.8, 0.8);

  vec3 result = (ambient + diffuse + specular) * materialColor;
  fragColor = vec4(result, 1.0);
}
`;

// ==================== 主程序 ====================

// 1. 初始化 DemoRunner
const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'Normal Mapping Demo',
  clearColor: [0.1, 0.1, 0.15, 1.0],
});

let depthTexture: MSpec.IRHITexture;
let normalTexture: MSpec.IRHITexture;
let sampler: MSpec.IRHISampler;

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

// 光照参数
const lightingParams = {
  ambientIntensity: 0.2,
  diffuseIntensity: 0.8,
  specularIntensity: 0.5,
  shininess: 32.0,
  normalStrength: 1.0,
  enableNormalMap: true,
  pattern: 'bumpy' as 'flat' | 'bumpy' | 'wave',
  lightRotation: 0,
};

// 更新法线贴图
const updateNormalMap = (pattern: 'flat' | 'bumpy' | 'wave') => {
  if (normalTexture) {
    normalTexture.destroy();
  }

  const normalMapData = ProceduralTexture.normalMap({
    width: 512,
    height: 512,
    pattern,
    strength: 0.5,
  });

  normalTexture = runner.track(
    runner.device.createTexture({
      width: normalMapData.width,
      height: normalMapData.height,
      format: MSpec.RHITextureFormat.RGBA8_UNORM,
      usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
      // initialData is not supported in descriptor directly, use update instead
      label: `Normal Map (${pattern})`,
    })
  );

  // flipY logic needs to be handled during data generation or manually if needed,
  // but assuming ProceduralTexture.normalMap returns data that is ready to use or we just update it.
  // ProceduralTexture.normalMap returns Uint8Array usually.
  normalTexture.update(normalMapData.data as BufferSource, 0, 0, 0, normalMapData.width, normalMapData.height, 1);
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

    // 3. 创建平面几何体（启用切线）
    const planeGeometry = GeometryGenerator.plane({
      width: 3,
      height: 3,
      widthSegments: 20,
      heightSegments: 20,
      normals: true,
      uvs: true,
      tangents: true,
    });

    // 检查切线数据
    if (!planeGeometry.tangents) {
      throw new Error('Tangent data is required for normal mapping');
    }

    // 创建顶点缓冲区（Position + Normal + UV）
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: planeGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: planeGeometry.vertices as BufferSource,
        label: 'Plane Vertex Buffer',
      })
    );

    // 创建切线缓冲区（独立的顶点缓冲区）
    const tangentBuffer = runner.track(
      runner.device.createBuffer({
        size: planeGeometry.tangents.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: planeGeometry.tangents as BufferSource,
        label: 'Plane Tangent Buffer',
      })
    );

    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: planeGeometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: planeGeometry.indices! as BufferSource,
        label: 'Plane Index Buffer',
      })
    );

    // 4. 创建 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256, // mat4(64) * 4
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // std140: vec3(16) + vec3(16) + vec3(16) + float*4(16) = 64
    const lightingBuffer = runner.track(
      runner.device.createBuffer({
        size: 64,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Lighting Uniform Buffer',
      })
    );

    // Settings buffer: float(4) + padding(12) = 16
    const settingsBuffer = runner.track(
      runner.device.createBuffer({
        size: 16,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Settings Uniform Buffer',
      })
    );

    // 5. 创建法线贴图和采样器
    updateNormalMap(lightingParams.pattern);

    sampler = runner.track(
      runner.device.createSampler({
        magFilter: MSpec.RHIFilterMode.LINEAR,
        minFilter: MSpec.RHIFilterMode.LINEAR,
        mipmapFilter: MSpec.RHIFilterMode.LINEAR,
        addressModeU: MSpec.RHIAddressMode.REPEAT,
        addressModeV: MSpec.RHIAddressMode.REPEAT,
        label: 'Normal Map Sampler',
      })
    );

    // 6. 创建着色器
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

    // 7. 创建绑定组布局
    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout([
        { binding: 0, visibility: MSpec.RHIShaderStage.VERTEX, buffer: { type: 'uniform' }, name: 'Transforms' },
        { binding: 1, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'Lighting' },
        { binding: 2, visibility: MSpec.RHIShaderStage.FRAGMENT, buffer: { type: 'uniform' }, name: 'Settings' },
        {
          binding: 3,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          texture: { sampleType: 'float', viewDimension: '2d' },
          name: 'uNormalMap',
        },
        {
          binding: 4,
          visibility: MSpec.RHIShaderStage.FRAGMENT,
          sampler: { type: 'filtering' },
          name: 'uNormalMapSampler',
        },
      ])
    );

    // 8. 创建管线
    const pipelineLayout = runner.track(runner.device.createPipelineLayout([bindGroupLayout]));

    // 顶点布局：缓冲区 0 (Position + Normal + UV) + 缓冲区 1 (Tangent)
    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0,
          stride: 32, // position(12) + normal(12) + uv(8)
          stepMode: 'vertex',
          attributes: [
            { name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 },
            { name: 'aNormal', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 12, shaderLocation: 1 },
            { name: 'aTexCoord', format: MSpec.RHIVertexFormat.FLOAT32x2, offset: 24, shaderLocation: 2 },
          ],
        },
        {
          index: 1,
          stride: 12, // tangent(12)
          stepMode: 'vertex',
          attributes: [{ name: 'aTangent', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 3 }],
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

    // 9. 创建绑定组
    // normalTexture is initialized in updateNormalMap which is called before this
    let bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: { buffer: transformBuffer } },
        { binding: 1, resource: { buffer: lightingBuffer } },
        { binding: 2, resource: { buffer: settingsBuffer } },
        { binding: 3, resource: normalTexture!.createView() },
        { binding: 4, resource: sampler },
      ])
    );

    // 10. 创建 GUI
    const gui = new SimpleGUI();
    gui.add('Ambient Intensity', {
      value: lightingParams.ambientIntensity,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => (lightingParams.ambientIntensity = v as number),
    });
    gui.add('Diffuse Intensity', {
      value: lightingParams.diffuseIntensity,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => (lightingParams.diffuseIntensity = v as number),
    });
    gui.add('Specular Intensity', {
      value: lightingParams.specularIntensity,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => (lightingParams.specularIntensity = v as number),
    });
    gui.add('Shininess', {
      value: lightingParams.shininess,
      min: 1,
      max: 128,
      step: 1,
      onChange: (v) => (lightingParams.shininess = v as number),
    });

    gui.addSeparator();
    gui.add('Normal Strength', {
      value: lightingParams.normalStrength,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v) => (lightingParams.normalStrength = v as number),
    });
    gui.add('Enable Normal Map', {
      value: lightingParams.enableNormalMap,
      // type: 'checkbox', // SimpleGUI automatically detects boolean
      onChange: (v) => (lightingParams.enableNormalMap = v as boolean),
    });
    gui.add('Pattern', {
      value: lightingParams.pattern,
      options: ['flat', 'bumpy', 'wave'],
      onChange: (v) => {
        lightingParams.pattern = v as 'flat' | 'bumpy' | 'wave';
        updateNormalMap(lightingParams.pattern);
        // 重新创建绑定组
        bindGroup.destroy();
        bindGroup = runner.track(
          runner.device.createBindGroup(bindGroupLayout, [
            { binding: 0, resource: { buffer: transformBuffer } },
            { binding: 1, resource: { buffer: lightingBuffer } },
            { binding: 2, resource: { buffer: settingsBuffer } },
            { binding: 3, resource: normalTexture!.createView() },
            { binding: 4, resource: sampler },
          ])
        );
      },
    });

    gui.addSeparator();
    gui.add('Light Rotation', {
      value: lightingParams.lightRotation,
      min: 0,
      max: 360,
      step: 1,
      onChange: (v) => (lightingParams.lightRotation = v as number),
    });

    // 11. 渲染循环
    const modelMatrix = new MMath.Matrix4();
    const normalMatrix = new MMath.Matrix4();

    runner.start((dt) => {
      orbit.update(dt);
      stats.begin();

      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      // 计算法线矩阵（模型矩阵的逆转置）
      normalMatrix.copyFrom(modelMatrix).invert().transpose();

      // 更新 Transform Uniform
      const transformData = new Float32Array(64);
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformData.set(normalMatrix.toArray(), 48);
      transformBuffer.update(transformData, 0);

      // 更新光源位置（旋转）
      const lightAngle = (lightingParams.lightRotation * Math.PI) / 180;
      const lightRadius = 4;
      const lightPos = new MMath.Vector3(Math.cos(lightAngle) * lightRadius, 3, Math.sin(lightAngle) * lightRadius);

      // 更新 Lighting Uniform (std140 对齐)
      const cameraPosition = orbit.getPosition();
      const lightingData = new Float32Array(16);
      lightingData[0] = lightPos.x;
      lightingData[1] = lightPos.y;
      lightingData[2] = lightPos.z;
      lightingData[3] = 0; // padding
      lightingData[4] = cameraPosition.x;
      lightingData[5] = cameraPosition.y;
      lightingData[6] = cameraPosition.z;
      lightingData[7] = 0; // padding
      lightingData[8] = 1.0; // light color R
      lightingData[9] = 1.0; // light color G
      lightingData[10] = 1.0; // light color B
      lightingData[11] = lightingParams.ambientIntensity;
      lightingData[12] = lightingParams.diffuseIntensity;
      lightingData[13] = lightingParams.specularIntensity;
      lightingData[14] = lightingParams.shininess;
      lightingData[15] = lightingParams.normalStrength;
      lightingBuffer.update(lightingData, 0);

      // 更新 Settings Uniform
      const settingsData = new Float32Array(4);
      settingsData[0] = lightingParams.enableNormalMap ? 1.0 : 0.0;
      settingsBuffer.update(settingsData, 0);

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
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setVertexBuffer(1, tangentBuffer);
      renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
      renderPass.drawIndexed(planeGeometry.indexCount!, 1, 0, 0, 0);
      renderPass.end();

      runner.endFrame(encoder);
      stats.end();
    });

    // 12. 显示操作提示
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      'R: 重置视角',
      '鼠标左键拖拽: 旋转相机',
      '鼠标右键拖拽: 平移相机',
      '鼠标滚轮: 缩放',
      '调整法线强度观察凹凸细节',
      '切换图案类型对比效果',
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

    console.info('Normal Mapping Demo 启动成功！');
  } catch (error) {
    console.error('初始化失败:', error);
    throw error;
  }
})();
