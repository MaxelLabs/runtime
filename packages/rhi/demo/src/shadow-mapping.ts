/**
 * shadow-mapping.ts
 * PBR+Shadow 完整演示 - 阶段3：实时阴影贴图与PCF软阴影 ✅
 *
 * 当前场景配置：
 * - 地面平面（20x20，双面渲染，灰色）
 * - 球体（中心位置，红色，缓慢旋转）
 * - 大立方体（左侧，1.5x1.5x1.5）
 * - 小立方体（右侧，0.8x0.8x0.8）
 * - 长方体（后方，2.0x1.0x0.5，45度角）
 * - 单个主光源（位置：[10, 15, 10]，适合投射阴影）
 *
 * 技术特性：
 * - 完整的PBR材质系统（Cook-Torrance BRDF）
 * - 环境贴图光照（简化版IBL）
 * - Shadow Map深度渲染（从光源视角，2048x2048）
 * - 实时阴影贴图与PCF软阴影（1x1/2x2/3x3可配置）
 * - 深度可视化（分屏显示：左=正常场景，右=深度图）
 * - GUI控制（阴影强度、偏移、PCF采样数、PBR参数）
 *
 * 已完成阶段：
 * - ✅ 阶段1：基础PBR场景
 * - ✅ 阶段2：深度图输出与调试可视化
 * - ✅ 阶段3：实时阴影贴图与PCF软阴影
 */

import { MSpec, MMath } from '@maxellabs/core';
import type { SimplePBRLightParams, SimplePBRMaterialParams, ShadowParams } from './utils';
import { DemoRunner, OrbitController, Stats, GeometryGenerator, SimpleGUI, SimplePBRMaterial } from './utils';

// ==================== 着色器代码 ====================

// 深度Pass顶点着色器（从光源视角渲染）
const depthVertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform LightSpaceMatrix {
  mat4 uLightSpaceMatrix;
};

void main() {
  gl_Position = uLightSpaceMatrix * vec4(aPosition, 1.0);
}
`;

// 深度Pass片段着色器（不需要输出颜色，深度自动写入）
const depthFragmentShader = `#version 300 es
precision highp float;
out vec4 fragColor;

void main() {
  // 深度值会自动写入深度缓冲
  fragColor = vec4(0.0);
}
`;

// 深度可视化顶点着色器（全屏四边形）
const depthVisVertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition; // 全屏四边形顶点 [-1,1]

out vec2 vTexCoord;

void main() {
  vTexCoord = aPosition * 0.5 + 0.5; // 转换到 [0,1]
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// 深度可视化片段着色器
const depthVisFragmentShader = `#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D uDepthMap;
uniform DepthVisParams {
  vec2 uDepthRange;
  vec2 uDepthRangePadding;
};

// 线性化深度值
float linearizeDepth(float depth) {
  float uNear = uDepthRange.x;
  float uFar = uDepthRange.y;
  float viewZ = mix(uNear, uFar, depth);
  return (viewZ - uNear) / (uFar - uNear);
}

void main() {
  float depth = texture(uDepthMap, vTexCoord).r;
  float linearDepth = linearizeDepth(depth);
  fragColor = vec4(vec3(linearDepth), 1.0);
}
`;

// ==================== 主程序 ====================

const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'PBR+Shadow Demo - Phase 2',
  clearColor: [0.1, 0.1, 0.1, 1.0],
});

// Shadow Map 配置
const SHADOW_MAP_SIZE = 2048; // 阴影贴图分辨率

let depthTexture: MSpec.IRHITexture;
let shadowMapTexture: MSpec.IRHITexture; // Shadow Map深度纹理

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

// 材质参数
const materialParams: SimplePBRMaterialParams = {
  metallic: 0.5,
  roughness: 0.5,
  albedo: [1.0, 0.0, 0.0], // 红色
  ambientStrength: 0.03,
};

// 阴影参数
const shadowParams: ShadowParams = {
  enabled: true,
  strength: 0.8,
  bias: 0.002, // 降低 bias，减少 peter-panning（阴影分离）
  pcfSamples: 9, // 默认3x3 PCF
  debugShadow: 0, // 调试模式：0=关闭, 1=显示阴影因子
};

// 光源参数 - 单个主光源用于阴影投射
const lightParams: SimplePBRLightParams[] = [
  {
    position: [10.0, 15.0, 10.0], // 上方偏侧面，适合投射阴影
    color: [1.0, 1.0, 1.0],
    constant: 1.0,
    linear: 0.09,
    quadratic: 0.032,
  },
];

(async function main() {
  try {
    await runner.init();

    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 12, // 增加距离以观察整个场景
      enableDamping: true,
    });

    updateDepthTexture();
    runner.onResize(updateDepthTexture);

    // ==================== 创建Shadow Map ====================

    // Shadow Map深度纹理（固定大小，不随窗口变化）
    shadowMapTexture = runner.track(
      runner.device.createTexture({
        width: SHADOW_MAP_SIZE,
        height: SHADOW_MAP_SIZE,
        format: MSpec.RHITextureFormat.DEPTH32_FLOAT,
        usage: [
          MSpec.RHITextureUsage.RENDER_ATTACHMENT,
          MSpec.RHITextureUsage.TEXTURE_BINDING,
        ] as unknown as MSpec.RHITextureUsage,
        label: 'Shadow Map',
      })
    );

    // ==================== 光源视角矩阵 ====================

    const lightPosition = new MMath.Vector3(
      lightParams[0].position[0],
      lightParams[0].position[1],
      lightParams[0].position[2]
    );
    const lightTarget = new MMath.Vector3(0, 0, 0); // 光源看向原点
    const lightUp = new MMath.Vector3(0, 1, 0);

    // 光源视图矩阵
    const lightViewMatrix = new MMath.Matrix4();
    lightViewMatrix.lookAt(lightPosition, lightTarget, lightUp);

    // 光源投影矩阵（正交投影，覆盖整个场景）
    const shadowFrustumSize = 20.0; // 阴影覆盖范围
    const shadowNear = 0.1;
    const shadowFar = 50.0;
    const lightProjectionMatrix = new MMath.Matrix4();
    lightProjectionMatrix.orthographic(
      -shadowFrustumSize,
      shadowFrustumSize,
      -shadowFrustumSize,
      shadowFrustumSize,
      shadowNear,
      shadowFar
    );

    // ==================== 创建深度Pass着色器和管线 ====================

    const depthVS = runner.device.createShaderModule({
      code: depthVertexShader,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.VERTEX,
    });

    const depthFS = runner.device.createShaderModule({
      code: depthFragmentShader,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.FRAGMENT,
    });

    // 深度Pass的Uniform Buffer（光源空间矩阵）
    const lightSpaceMatrixBuffer = runner.track(
      runner.device.createBuffer({
        size: 64, // mat4 = 16 floats = 64 bytes
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Light Space Matrix Buffer',
      })
    );

    const lightSpaceMatrixData = new Float32Array(16);

    // 深度Pass绑定组布局
    const depthBindGroupLayout = runner.device.createBindGroupLayout([
      {
        binding: 0,
        visibility: MSpec.RHIShaderStage.VERTEX,
        buffer: { type: 'uniform' },
        name: 'LightSpaceMatrix',
      },
    ]);

    const depthBindGroup = runner.device.createBindGroup(depthBindGroupLayout, [
      { binding: 0, resource: lightSpaceMatrixBuffer },
    ]);

    const depthPipelineLayout = runner.device.createPipelineLayout([depthBindGroupLayout]);

    const depthVertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0,
          stride: 24, // position(12) + normal(12)，但深度Pass只用position
          stepMode: 'vertex',
          attributes: [{ name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 }],
        },
      ],
    };

    const depthPipeline = runner.device.createRenderPipeline({
      vertexShader: depthVS,
      fragmentShader: depthFS,
      vertexLayout: depthVertexLayout,
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: depthPipelineLayout,
      rasterizationState: { cullMode: MSpec.RHICullMode.BACK },
      depthStencilState: {
        depthWriteEnabled: true,
        depthCompare: MSpec.RHICompareFunction.LESS,
        format: MSpec.RHITextureFormat.DEPTH32_FLOAT,
      },
    });

    // ==================== 创建深度可视化着色器和管线 ====================

    // 全屏四边形几何体
    const quadVertices = new Float32Array([
      -1.0,
      -1.0, // 左下
      1.0,
      -1.0, // 右下
      -1.0,
      1.0, // 左上
      1.0,
      1.0, // 右上
    ]);

    const quadIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);

    const quadVertexBuffer = runner.track(
      runner.device.createBuffer({
        size: quadVertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: quadVertices as BufferSource,
        label: 'Quad Vertex Buffer',
      })
    );

    const quadIndexBuffer = runner.track(
      runner.device.createBuffer({
        size: quadIndices.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: quadIndices as BufferSource,
        label: 'Quad Index Buffer',
      })
    );

    const depthVisVS = runner.device.createShaderModule({
      code: depthVisVertexShader,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.VERTEX,
    });

    const depthVisFS = runner.device.createShaderModule({
      code: depthVisFragmentShader,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.FRAGMENT,
    });

    // 深度可视化参数Buffer
    const depthVisParamsBuffer = runner.track(
      runner.device.createBuffer({
        size: 16, // 2个float + padding
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Depth Vis Params Buffer',
      })
    );

    const depthVisParamsData = new Float32Array([shadowNear, shadowFar, 0, 0]);
    depthVisParamsBuffer.update(depthVisParamsData as BufferSource, 0);

    // 深度可视化采样器
    const depthSampler = runner.device.createSampler({
      magFilter: MSpec.RHIFilterMode.NEAREST,
      minFilter: MSpec.RHIFilterMode.NEAREST,
      mipmapFilter: MSpec.RHIFilterMode.NEAREST,
      addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
      label: 'Depth Sampler',
    });

    const depthVisBindGroupLayout = runner.device.createBindGroupLayout([
      {
        binding: 0,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float', viewDimension: '2d' },
        name: 'uDepthMap',
      },
      {
        binding: 1,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        sampler: { type: 'filtering' },
        name: 'uDepthMapSampler',
      },
      {
        binding: 2,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
        name: 'DepthVisParams',
      },
    ]);

    const depthVisBindGroup = runner.device.createBindGroup(depthVisBindGroupLayout, [
      { binding: 0, resource: shadowMapTexture.createView() },
      { binding: 1, resource: depthSampler },
      { binding: 2, resource: depthVisParamsBuffer },
    ]);

    const depthVisPipelineLayout = runner.device.createPipelineLayout([depthVisBindGroupLayout]);

    const depthVisVertexLayout: MSpec.RHIVertexLayout = {
      buffers: [
        {
          index: 0,
          stride: 8, // vec2 = 8 bytes
          stepMode: 'vertex',
          attributes: [{ name: 'aPosition', format: MSpec.RHIVertexFormat.FLOAT32x2, offset: 0, shaderLocation: 0 }],
        },
      ],
    };

    const depthVisPipeline = runner.device.createRenderPipeline({
      vertexShader: depthVisVS,
      fragmentShader: depthVisFS,
      vertexLayout: depthVisVertexLayout,
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: depthVisPipelineLayout,
      rasterizationState: { cullMode: MSpec.RHICullMode.NONE },
    });

    // ==================== 创建几何体 ====================

    // 1. 地面平面 (20x20)
    // 手动创建几何体以确保正确性（解决 GeometryGenerator 可能存在的索引问题）
    const planeGeometry = {
      vertices: new Float32Array([
        // x, y, z, nx, ny, nz
        -10,
        0,
        -10,
        0,
        1,
        0, // 0: 左上 (Top view: 左上对应 z负, x负) -> 实际上是世界坐标的 (-10, -10)
        10,
        0,
        -10,
        0,
        1,
        0, // 1: 右上
        -10,
        0,
        10,
        0,
        1,
        0, // 2: 左下
        10,
        0,
        10,
        0,
        1,
        0, // 3: 右下
      ]),
      indices: new Uint32Array([
        // 使用 Uint32Array 匹配 UINT32 格式
        0,
        2,
        1, // Tri 1
        1,
        2,
        3, // Tri 2
      ]),
    };
    /*
    const planeGeometry = GeometryGenerator.plane({
      width: 20,
      height: 20,
      widthSegments: 1,
      heightSegments: 1,
      normals: true,
      uvs: false,
    });
    */

    const planeVertexBuffer = runner.track(
      runner.device.createBuffer({
        size: planeGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: planeGeometry.vertices as BufferSource,
        label: 'Plane Vertex Buffer',
      })
    );

    const planeIndexBuffer = runner.track(
      runner.device.createBuffer({
        size: planeGeometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: planeGeometry.indices as BufferSource,
        label: 'Plane Index Buffer',
      })
    );

    // 2. 球体
    const sphereGeometry = GeometryGenerator.sphere({
      radius: 1,
      normals: true,
      uvs: false,
    });

    const sphereVertexBuffer = runner.track(
      runner.device.createBuffer({
        size: sphereGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: sphereGeometry.vertices as BufferSource,
        label: 'Sphere Vertex Buffer',
      })
    );

    const sphereIndexBuffer = runner.track(
      runner.device.createBuffer({
        size: sphereGeometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: sphereGeometry.indices as BufferSource,
        label: 'Sphere Index Buffer',
      })
    );

    // 3. 立方体 (大)
    const cubeGeometry1 = GeometryGenerator.cube({
      width: 1.5,
      height: 1.5,
      depth: 1.5,
      normals: true,
      uvs: false,
    });

    const cube1VertexBuffer = runner.track(
      runner.device.createBuffer({
        size: cubeGeometry1.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: cubeGeometry1.vertices as BufferSource,
        label: 'Cube1 Vertex Buffer',
      })
    );

    const cube1IndexBuffer = runner.track(
      runner.device.createBuffer({
        size: cubeGeometry1.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: cubeGeometry1.indices as BufferSource,
        label: 'Cube1 Index Buffer',
      })
    );

    // 4. 立方体 (小)
    const cubeGeometry2 = GeometryGenerator.cube({
      width: 0.8,
      height: 0.8,
      depth: 0.8,
      normals: true,
      uvs: false,
    });

    const cube2VertexBuffer = runner.track(
      runner.device.createBuffer({
        size: cubeGeometry2.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: cubeGeometry2.vertices as BufferSource,
        label: 'Cube2 Vertex Buffer',
      })
    );

    const cube2IndexBuffer = runner.track(
      runner.device.createBuffer({
        size: cubeGeometry2.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: cubeGeometry2.indices as BufferSource,
        label: 'Cube2 Index Buffer',
      })
    );

    // 5. 长方体
    const boxGeometry = GeometryGenerator.cube({
      width: 2.0,
      height: 1.0,
      depth: 0.5,
      normals: true,
      uvs: false,
    });

    const boxVertexBuffer = runner.track(
      runner.device.createBuffer({
        size: boxGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: boxGeometry.vertices as BufferSource,
        label: 'Box Vertex Buffer',
      })
    );

    const boxIndexBuffer = runner.track(
      runner.device.createBuffer({
        size: boxGeometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: boxGeometry.indices as BufferSource,
        label: 'Box Index Buffer',
      })
    );

    // ==================== 创建材质 ====================

    // 创建SimplePBRMaterial（默认材质）
    const pbrMaterial = new SimplePBRMaterial(runner.device, materialParams, lightParams, {}, shadowParams);

    // 创建地面材质（双面渲染）
    const groundMaterialParams: SimplePBRMaterialParams = {
      metallic: 0.0,
      roughness: 0.9,
      albedo: [0.6, 0.6, 0.6], // 灰色地面
      ambientStrength: 10.0, // 增加环境光以便看清阴影
    };
    const groundMaterial = new SimplePBRMaterial(
      runner.device,
      groundMaterialParams,
      lightParams,
      {
        cullMode: MSpec.RHICullMode.NONE, // 双面渲染
      },
      shadowParams
    );

    // 初始化材质（加载环境贴图）
    const cubemapUrls = {
      posX: '../assets/cube/Bridge2/posx.jpg',
      negX: '../assets/cube/Bridge2/negx.jpg',
      posY: '../assets/cube/Bridge2/posy.jpg',
      negY: '../assets/cube/Bridge2/negy.jpg',
      posZ: '../assets/cube/Bridge2/posz.jpg',
      negZ: '../assets/cube/Bridge2/negz.jpg',
    };

    await pbrMaterial.initialize(cubemapUrls);
    await groundMaterial.initialize(cubemapUrls);

    // 设置Shadow Map
    pbrMaterial.setShadowMap(shadowMapTexture);
    groundMaterial.setShadowMap(shadowMapTexture);

    // GUI 控制
    const gui = new SimpleGUI();

    // 阴影控制
    gui.addSeparator('🌑 Shadow Settings');
    gui.add('shadowStrength', {
      value: shadowParams.strength,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        shadowParams.strength = v as number;
        pbrMaterial.setShadowParams({ strength: shadowParams.strength });
        groundMaterial.setShadowParams({ strength: shadowParams.strength });
      },
    });

    gui.add('shadowBias', {
      value: shadowParams.bias,
      min: 0,
      max: 0.01, // 增加最大范围以便调试
      step: 0.0001,
      onChange: (v) => {
        shadowParams.bias = v as number;
        pbrMaterial.setShadowParams({ bias: shadowParams.bias });
        groundMaterial.setShadowParams({ bias: shadowParams.bias });
      },
    });

    gui.add('pcfSamples', {
      value: shadowParams.pcfSamples,
      min: 1,
      max: 9,
      step: 1,
      onChange: (v) => {
        const samples = v as number;
        // 限制为1, 4, 9
        let validSamples = 1;
        if (samples >= 7) {
          validSamples = 9;
        } else if (samples >= 3) {
          validSamples = 4;
        } else {
          validSamples = 1;
        }

        shadowParams.pcfSamples = validSamples;
        pbrMaterial.setShadowParams({ pcfSamples: validSamples });
        groundMaterial.setShadowParams({ pcfSamples: validSamples });
      },
    });

    // 深度可视化控制
    let showDepthVis = true; // 默认显示分屏

    gui.addSeparator('🔍 Depth Visualization');
    gui.add('showDepth', {
      value: showDepthVis,
      onChange: (v) => {
        showDepthVis = v as boolean;
      },
    });

    gui.add('debugShadow', {
      value: shadowParams.debugShadow ?? 0,
      min: 0,
      max: 4,
      step: 1,
      onChange: (v) => {
        shadowParams.debugShadow = v as number;
        pbrMaterial.setShadowParams({ debugShadow: shadowParams.debugShadow });
        groundMaterial.setShadowParams({ debugShadow: shadowParams.debugShadow });
      },
    });

    gui.addSeparator('🎨 PBR Material');
    gui.add('metallic', {
      value: materialParams.metallic,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.metallic = v as number;
      },
    });

    gui.add('roughness', {
      value: materialParams.roughness,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.roughness = v as number;
      },
    });

    gui.add('ambientStrength', {
      value: materialParams.ambientStrength,
      min: 0,
      max: 0.2,
      step: 0.01,
      onChange: (v) => {
        materialParams.ambientStrength = v as number;
      },
    });

    gui.addSeparator('🌈 Albedo Color');
    gui.add('albedoR', {
      value: materialParams.albedo[0],
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.albedo[0] = v as number;
      },
    });
    gui.add('albedoG', {
      value: materialParams.albedo[1],
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.albedo[1] = v as number;
      },
    });
    gui.add('albedoB', {
      value: materialParams.albedo[2],
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.albedo[2] = v as number;
      },
    });

    // 矩阵
    const modelMatrix = new MMath.Matrix4();
    const normalMatrix = new MMath.Matrix4();
    const lightSpaceMatrix = new MMath.Matrix4();
    const depthLightSpaceMatrix = new MMath.Matrix4(); // 深度 Pass 专用矩阵（避免污染）

    // 渲染循环
    runner.start((dt) => {
      stats.begin();

      orbit.update(dt);

      // 计算光源空间矩阵（Projection * View，不含 Model）
      // 这个矩阵用于 PBR shader 中的阴影采样
      lightSpaceMatrix.copyFrom(lightProjectionMatrix);
      lightSpaceMatrix.multiply(lightViewMatrix);

      // 更新材质参数
      pbrMaterial.setMaterialParams(materialParams);
      pbrMaterial.updateLightSpaceMatrix(lightSpaceMatrix);
      pbrMaterial.update();
      pbrMaterial.reset(); // Reset dynamic offsets

      groundMaterial.setMaterialParams(groundMaterialParams);
      groundMaterial.updateLightSpaceMatrix(lightSpaceMatrix);
      groundMaterial.update();
      groundMaterial.reset(); // Reset dynamic offsets

      // 获取相机矩阵
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);
      const cameraPos = orbit.getPosition();

      const { encoder, passDescriptor } = runner.beginFrame();

      // ==================== Pass 1: 深度渲染（从光源视角） ====================

      // 深度Pass:渲染到Shadow Map
      const depthPass = encoder.beginRenderPass({
        colorAttachments: [], // 深度Pass不需要颜色附件
        depthStencilAttachment: {
          view: shadowMapTexture.createView(),
          clearDepth: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
        },
      });
      depthPass.setPipeline(depthPipeline);
      depthPass.setBindGroup(0, depthBindGroup);

      // 渲染每个物体到Shadow Map
      const renderDepthObject = (modelMat: MMath.Matrix4) => {
        // 计算光源空间矩阵: Projection * View * Model
        // 使用专用矩阵，避免污染 lightSpaceMatrix
        depthLightSpaceMatrix.copyFrom(lightProjectionMatrix);
        depthLightSpaceMatrix.multiply(lightViewMatrix);
        depthLightSpaceMatrix.multiply(modelMat);

        // 更新Uniform
        lightSpaceMatrixData.set(depthLightSpaceMatrix.getElements(), 0);
        lightSpaceMatrixBuffer.update(lightSpaceMatrixData as BufferSource, 0);
      };

      // 注意：地面不渲染到 Shadow Map（地面只接收阴影，不投射阴影）
      // 只渲染投射阴影的物体

      // 球体
      modelMatrix.identity();
      modelMatrix.translate(new MMath.Vector3(0, 1.5, 0));
      modelMatrix.rotateY(performance.now() * 0.0005);
      renderDepthObject(modelMatrix);
      depthPass.setVertexBuffer(0, sphereVertexBuffer);
      depthPass.setIndexBuffer(sphereIndexBuffer, MSpec.RHIIndexFormat.UINT16);
      depthPass.drawIndexed(sphereGeometry.indices!.length);

      // 大立方体
      modelMatrix.identity();
      modelMatrix.translate(new MMath.Vector3(-3, 1.2, 2));
      modelMatrix.rotateY(performance.now() * 0.0003);
      renderDepthObject(modelMatrix);
      depthPass.setVertexBuffer(0, cube1VertexBuffer);
      depthPass.setIndexBuffer(cube1IndexBuffer, MSpec.RHIIndexFormat.UINT16);
      depthPass.drawIndexed(cubeGeometry1.indices!.length);

      // 小立方体
      modelMatrix.identity();
      modelMatrix.translate(new MMath.Vector3(3, 0.8, -2));
      modelMatrix.rotateY(performance.now() * 0.0007);
      renderDepthObject(modelMatrix);
      depthPass.setVertexBuffer(0, cube2VertexBuffer);
      depthPass.setIndexBuffer(cube2IndexBuffer, MSpec.RHIIndexFormat.UINT16);
      depthPass.drawIndexed(cubeGeometry2.indices!.length);

      // 长方体
      modelMatrix.identity();
      modelMatrix.translate(new MMath.Vector3(-2, 1.0, -3));
      modelMatrix.rotateY(Math.PI / 4);
      renderDepthObject(modelMatrix);
      depthPass.setVertexBuffer(0, boxVertexBuffer);
      depthPass.setIndexBuffer(boxIndexBuffer, MSpec.RHIIndexFormat.UINT16);
      depthPass.drawIndexed(boxGeometry.indices!.length);

      depthPass.end();

      // ==================== Pass 2: 正常渲染（PBR场景） ====================

      // 根据showDepthVis决定是否分屏
      if (showDepthVis) {
        // 分屏模式：左半屏渲染正常场景
        passDescriptor.colorAttachments![0].loadOp = 'clear';
        passDescriptor.depthStencilAttachment = {
          view: depthTexture.createView(),
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
        };

        const renderPass = encoder.beginRenderPass(passDescriptor);

        // 设置视口为左半屏
        renderPass.setViewport(0, 0, runner.width / 2, runner.height, 0, 1);

        // 渲染地面
        modelMatrix.identity();
        normalMatrix.copyFrom(modelMatrix);
        normalMatrix.invert();
        normalMatrix.transpose();
        groundMaterial.updateTransforms(modelMatrix, viewMatrix, projMatrix, normalMatrix, cameraPos);
        groundMaterial.bind(renderPass);
        renderPass.setVertexBuffer(0, planeVertexBuffer);
        renderPass.setIndexBuffer(planeIndexBuffer, MSpec.RHIIndexFormat.UINT32);
        renderPass.drawIndexed(planeGeometry.indices!.length);

        // 渲染球体
        modelMatrix.identity();
        modelMatrix.translate(new MMath.Vector3(0, 1.5, 0));
        modelMatrix.rotateY(performance.now() * 0.0005);
        normalMatrix.copyFrom(modelMatrix);
        normalMatrix.invert();
        normalMatrix.transpose();
        pbrMaterial.updateTransforms(modelMatrix, viewMatrix, projMatrix, normalMatrix, cameraPos);
        pbrMaterial.bind(renderPass);
        renderPass.setVertexBuffer(0, sphereVertexBuffer);
        renderPass.setIndexBuffer(sphereIndexBuffer, MSpec.RHIIndexFormat.UINT16);
        renderPass.drawIndexed(sphereGeometry.indices!.length);

        // 渲染大立方体
        modelMatrix.identity();
        modelMatrix.translate(new MMath.Vector3(-3, 1.2, 2));
        modelMatrix.rotateY(performance.now() * 0.0003);
        normalMatrix.copyFrom(modelMatrix);
        normalMatrix.invert();
        normalMatrix.transpose();
        pbrMaterial.updateTransforms(modelMatrix, viewMatrix, projMatrix, normalMatrix, cameraPos);
        pbrMaterial.bind(renderPass);
        renderPass.setVertexBuffer(0, cube1VertexBuffer);
        renderPass.setIndexBuffer(cube1IndexBuffer, MSpec.RHIIndexFormat.UINT16);
        renderPass.drawIndexed(cubeGeometry1.indices!.length);

        // 渲染小立方体
        modelMatrix.identity();
        modelMatrix.translate(new MMath.Vector3(3, 0.8, -2));
        modelMatrix.rotateY(performance.now() * 0.0007);
        normalMatrix.copyFrom(modelMatrix);
        normalMatrix.invert();
        normalMatrix.transpose();
        pbrMaterial.updateTransforms(modelMatrix, viewMatrix, projMatrix, normalMatrix, cameraPos);
        pbrMaterial.bind(renderPass);
        renderPass.setVertexBuffer(0, cube2VertexBuffer);
        renderPass.setIndexBuffer(cube2IndexBuffer, MSpec.RHIIndexFormat.UINT16);
        renderPass.drawIndexed(cubeGeometry2.indices!.length);

        // 渲染长方体
        modelMatrix.identity();
        modelMatrix.translate(new MMath.Vector3(-2, 1.0, -3));
        modelMatrix.rotateY(Math.PI / 4);
        normalMatrix.copyFrom(modelMatrix);
        normalMatrix.invert();
        normalMatrix.transpose();
        pbrMaterial.updateTransforms(modelMatrix, viewMatrix, projMatrix, normalMatrix, cameraPos);
        pbrMaterial.bind(renderPass);
        renderPass.setVertexBuffer(0, boxVertexBuffer);
        renderPass.setIndexBuffer(boxIndexBuffer, MSpec.RHIIndexFormat.UINT16);
        renderPass.drawIndexed(boxGeometry.indices!.length);

        renderPass.end();

        // ==================== Pass 3: 深度可视化（右半屏） ====================

        const depthVisPass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: passDescriptor.colorAttachments![0].view,
              loadOp: 'load', // 保留左半屏的内容
              storeOp: 'store',
            },
          ],
        });

        // 设置视口为右半屏
        depthVisPass.setViewport(runner.width / 2, 0, runner.width / 2, runner.height, 0, 1);
        depthVisPass.setPipeline(depthVisPipeline);
        depthVisPass.setBindGroup(0, depthVisBindGroup);
        depthVisPass.setVertexBuffer(0, quadVertexBuffer);
        depthVisPass.setIndexBuffer(quadIndexBuffer, MSpec.RHIIndexFormat.UINT16);
        depthVisPass.drawIndexed(6);

        depthVisPass.end();
      } else {
        // 全屏模式：正常渲染
        passDescriptor.depthStencilAttachment = {
          view: depthTexture.createView(),
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
        };

        const renderPass = encoder.beginRenderPass(passDescriptor);

        // 渲染地面
        modelMatrix.identity();
        normalMatrix.copyFrom(modelMatrix);
        normalMatrix.invert();
        normalMatrix.transpose();
        groundMaterial.updateTransforms(modelMatrix, viewMatrix, projMatrix, normalMatrix, cameraPos);
        groundMaterial.bind(renderPass);
        renderPass.setVertexBuffer(0, planeVertexBuffer);
        renderPass.setIndexBuffer(planeIndexBuffer, MSpec.RHIIndexFormat.UINT32);
        renderPass.drawIndexed(planeGeometry.indices!.length);

        // 渲染球体
        modelMatrix.identity();
        modelMatrix.translate(new MMath.Vector3(0, 1.5, 0));
        modelMatrix.rotateY(performance.now() * 0.0005);
        normalMatrix.copyFrom(modelMatrix);
        normalMatrix.invert();
        normalMatrix.transpose();
        pbrMaterial.updateTransforms(modelMatrix, viewMatrix, projMatrix, normalMatrix, cameraPos);
        pbrMaterial.bind(renderPass);
        renderPass.setVertexBuffer(0, sphereVertexBuffer);
        renderPass.setIndexBuffer(sphereIndexBuffer, MSpec.RHIIndexFormat.UINT16);
        renderPass.drawIndexed(sphereGeometry.indices!.length);

        // 渲染大立方体
        modelMatrix.identity();
        modelMatrix.translate(new MMath.Vector3(-3, 1.2, 2));
        modelMatrix.rotateY(performance.now() * 0.0003);
        normalMatrix.copyFrom(modelMatrix);
        normalMatrix.invert();
        normalMatrix.transpose();
        pbrMaterial.updateTransforms(modelMatrix, viewMatrix, projMatrix, normalMatrix, cameraPos);
        pbrMaterial.bind(renderPass);
        renderPass.setVertexBuffer(0, cube1VertexBuffer);
        renderPass.setIndexBuffer(cube1IndexBuffer, MSpec.RHIIndexFormat.UINT16);
        renderPass.drawIndexed(cubeGeometry1.indices!.length);

        // 渲染小立方体
        modelMatrix.identity();
        modelMatrix.translate(new MMath.Vector3(3, 0.8, -2));
        modelMatrix.rotateY(performance.now() * 0.0007);
        normalMatrix.copyFrom(modelMatrix);
        normalMatrix.invert();
        normalMatrix.transpose();
        pbrMaterial.updateTransforms(modelMatrix, viewMatrix, projMatrix, normalMatrix, cameraPos);
        pbrMaterial.bind(renderPass);
        renderPass.setVertexBuffer(0, cube2VertexBuffer);
        renderPass.setIndexBuffer(cube2IndexBuffer, MSpec.RHIIndexFormat.UINT16);
        renderPass.drawIndexed(cubeGeometry2.indices!.length);

        // 渲染长方体
        modelMatrix.identity();
        modelMatrix.translate(new MMath.Vector3(-2, 1.0, -3));
        modelMatrix.rotateY(Math.PI / 4);
        normalMatrix.copyFrom(modelMatrix);
        normalMatrix.invert();
        normalMatrix.transpose();
        pbrMaterial.updateTransforms(modelMatrix, viewMatrix, projMatrix, normalMatrix, cameraPos);
        pbrMaterial.bind(renderPass);
        renderPass.setVertexBuffer(0, boxVertexBuffer);
        renderPass.setIndexBuffer(boxIndexBuffer, MSpec.RHIIndexFormat.UINT16);
        renderPass.drawIndexed(boxGeometry.indices!.length);

        renderPass.end();
      }

      runner.endFrame(encoder);

      stats.end();
    });
  } catch (error) {
    console.error('Demo initialization failed:', error);
    throw error;
  }
})();
