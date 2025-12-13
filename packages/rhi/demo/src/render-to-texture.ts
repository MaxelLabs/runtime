/**
 * render-to-texture.ts
 * 渲染到纹理 Demo - 展示离屏渲染和多通道渲染技术
 *
 * 功能演示：
 * - 离屏渲染到纹理 (Render-to-Texture)
 * - 多遍渲染：第一遍渲染3D场景到纹理，第二遍渲染纹理到四边形
 * - 实时后处理效果：像素化、颜色反转、灰度、模糊
 * - 分屏对比模式：RTT效果 vs 原始渲染
 * - 渲染目标管理
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, OrbitController, ProceduralTexture, RenderTarget, SimpleGUI, Stats } from './utils';

// ==================== 着色器源码 ====================

// 第一遍着色器：渲染旋转的立方体到纹理
const firstPassVertexShader = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

// Uniform 块
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

// 输出到片元着色器
out vec3 vNormal;
out vec2 vTexCoord;
out vec3 vWorldPosition;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = mat3(uNormalMatrix) * aNormal;
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const firstPassFragmentShader = `#version 300 es
precision mediump float;

// 输入
in vec3 vNormal;
in vec2 vTexCoord;
in vec3 vWorldPosition;

// Uniform
uniform sampler2D uTexture;

uniform Lighting {
  vec3 uLightDirection;
  vec3 uLightColor;
  vec3 uAmbientColor;
  float uSpecularIntensity;
};

uniform Camera {
  vec3 uCameraPosition;
};

// 输出
out vec4 fragColor;

void main() {
  // 采样纹理
  vec4 texColor = texture(uTexture, vTexCoord);

  // 法线归一化
  vec3 normal = normalize(vNormal);

  // 光照方向（已归一化）
  vec3 lightDir = normalize(uLightDirection);

  // 漫反射
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  // 镜面反射 (Blinn-Phong)
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
  vec3 specular = uSpecularIntensity * spec * uLightColor;

  // 最终颜色
  vec3 ambient = uAmbientColor;
  vec3 lighting = ambient + diffuse + specular;
  fragColor = vec4(texColor.rgb * lighting, texColor.a);
}
`;

// 第二遍着色器：将纹理渲染到四边形，应用后处理效果
const secondPassVertexShader = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec2 aTexCoord;

// Uniform
uniform SecondPassUniforms {
  vec2 uResolution;
  float uSplitMode;
  int uEffect;
};

// 输出到片元着色器
out vec2 vTexCoord;
out vec2 vScreenCoord;

void main() {
  vTexCoord = aTexCoord;
  vScreenCoord = (aPosition.xy * 0.5 + 0.5) * uResolution;
  gl_Position = vec4(aPosition, 1.0);
}
`;

const secondPassFragmentShader = `#version 300 es
precision mediump float;

// 输入
in vec2 vTexCoord;
in vec2 vScreenCoord;

// Uniform
uniform SecondPassUniforms {
  vec2 uResolution;
  float uSplitMode;
  int uEffect;
};
uniform sampler2D uRTTexture;  // 渲染到纹理的结果

// 输出
out vec4 fragColor;

// 像素化效果
vec4 pixelate(sampler2D tex, vec2 uv, float pixelSize) {
  vec2 pixelatedUV = floor(uv * pixelSize) / pixelSize;
  return texture(tex, pixelatedUV);
}

// 简单模糊效果
vec4 simpleBlur(sampler2D tex, vec2 uv, vec2 texelSize) {
  vec4 color = vec4(0.0);
  float total = 0.0;

  for(int x = -2; x <= 2; x++) {
    for(int y = -2; y <= 2; y++) {
      float weight = 1.0 / (abs(float(x)) + abs(float(y)) + 1.0);
      vec2 offset = vec2(float(x), float(y)) * texelSize;
      color += texture(tex, uv + offset) * weight;
      total += weight;
    }
  }

  return color / total;
}

void main() {
  vec4 color;
  vec2 uv = vTexCoord;

  // 分屏模式处理
  if (uSplitMode == 1.0) {
    // 左侧显示RTT效果，右侧显示原始
    if (vScreenCoord.x < uResolution.x * 0.5) {
      uv.x = uv.x * 2.0; // 拉伸左侧
      color = texture(uRTTexture, uv);
    } else {
      // 右侧
      color = vec4(0.2, 0.2, 0.3, 1.0); // 背景色
    }
  } else if (uSplitMode == 2.0) {
    // 原始模式（直接渲染）
    color = vec4(0.2, 0.2, 0.3, 1.0);
  } else {
    // 完整RTT模式
    color = texture(uRTTexture, uv);
  }

  // 应用后处理效果
  vec2 texelSize = 1.0 / uResolution;

  if (uEffect == 1) { // 像素化
    float pixelCount = 50.0; // 像素数量
    color = pixelate(uRTTexture, uv, pixelCount);
  } else if (uEffect == 2) { // 颜色反转
    color.rgb = 1.0 - color.rgb;
  } else if (uEffect == 3) { // 灰度
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = vec3(gray);
  } else if (uEffect == 4) { // 模糊
    color = simpleBlur(uRTTexture, uv, texelSize);
  }

  fragColor = color;
}
`;

// ==================== Demo 配置 ====================

interface DemoParams {
  rotationSpeed: number;
  autoRotate: boolean;
  lightIntensity: number;
  splitMode: number; // 0: full RTT, 1: split screen, 2: original
  effect: number; // 0: none, 1: pixelate, 2: invert, 3: grayscale, 4: blur
  textureType: string;
}

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '渲染到纹理 Demo',
    clearColor: [0.05, 0.05, 0.1, 1.0],
  });

  try {
    // 2. 初始化
    await runner.init();

    // 3. 创建性能统计
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });

    // 4. 创建相机控制器
    const orbit = new OrbitController(runner.canvas, {
      distance: 3,
      target: [0, 0, 0],
      elevation: Math.PI / 6,
      azimuth: Math.PI / 4,
      enableDamping: true,
      dampingFactor: 0.08,
    });

    // 5. Demo 参数
    const params: DemoParams = {
      rotationSpeed: 0.5,
      autoRotate: false,
      lightIntensity: 1.0,
      splitMode: 0,
      effect: 0,
      textureType: 'gradient',
    };

    // 6. 生成立方体几何体
    const cubeGeometry = GeometryGenerator.cube({
      size: 1,
      normals: true,
      uvs: true,
    });

    // 7. 生成四边形几何体（用于第二遍渲染）
    const quadGeometry = GeometryGenerator.quad({
      width: 2,
      height: 2,
      uvs: true,
    });

    // 8. 创建渲染目标 (1024x1024)
    const renderTarget = runner.track(
      new RenderTarget(runner.device, {
        width: 1024,
        height: 1024,
        colorFormat: MSpec.RHITextureFormat.RGBA8_UNORM,
        depthFormat: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
        label: 'RTT Target',
      })
    );

    // 9. 创建立方体资源（第一遍）
    const cubeVertexBuffer = runner.track(
      runner.device.createBuffer({
        size: cubeGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: cubeGeometry.vertices as BufferSource,
        label: 'Cube Vertex Buffer',
      })
    );

    const cubeIndexBuffer = runner.track(
      runner.device.createBuffer({
        size: cubeGeometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: cubeGeometry.indices as BufferSource,
        label: 'Cube Index Buffer',
      })
    );

    // 10. 创建四边形资源（第二遍）
    const quadVertexBuffer = runner.track(
      runner.device.createBuffer({
        size: quadGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: quadGeometry.vertices as BufferSource,
        label: 'Quad Vertex Buffer',
      })
    );

    // 11. 创建 Uniform 缓冲区
    // Transform uniform: 4 个 mat4 = 256 bytes
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // Lighting uniform
    const lightingBuffer = runner.track(
      runner.device.createBuffer({
        size: 48,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Lighting Uniform Buffer',
      })
    );

    // Camera uniform
    const cameraBuffer = runner.track(
      runner.device.createBuffer({
        size: 16,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Camera Uniform Buffer',
      })
    );

    // 第二遍渲染的 Uniform
    const secondPassUniformBuffer = runner.track(
      runner.device.createBuffer({
        size: 32, // vec2 resolution + float splitMode + int effect + padding
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Second Pass Uniform Buffer',
      })
    );

    // 12. 生成程序化纹理
    const textures: Record<string, ReturnType<typeof ProceduralTexture.gradient>> = {
      gradient: ProceduralTexture.gradient({
        width: 256,
        height: 256,
        direction: 'diagonal',
        startColor: [255, 100, 50, 255],
        endColor: [50, 100, 255, 255],
      }),
      checkerboard: ProceduralTexture.checkerboard({
        width: 256,
        height: 256,
        cellSize: 16,
        colorA: [255, 200, 100, 255],
        colorB: [100, 50, 200, 255],
      }),
      noise: ProceduralTexture.noise({
        width: 256,
        height: 256,
        type: 'perlin',
        frequency: 8,
        octaves: 3,
      }),
    };

    // 创建纹理
    let currentTexture = runner.track(
      runner.device.createTexture({
        width: 256,
        height: 256,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Cube Texture',
      })
    );
    currentTexture.update(textures.gradient.data as BufferSource);

    // 13. 创建采样器
    const sampler = runner.track(
      runner.device.createSampler({
        magFilter: MSpec.RHIFilterMode.LINEAR,
        minFilter: MSpec.RHIFilterMode.LINEAR,
        mipmapFilter: MSpec.RHIFilterMode.LINEAR,
        addressModeU: MSpec.RHIAddressMode.REPEAT,
        addressModeV: MSpec.RHIAddressMode.REPEAT,
        label: 'Sampler',
      })
    );

    // 14. 创建第一遍着色器
    const firstPassVertexShaderModule = runner.track(
      runner.device.createShaderModule({
        code: firstPassVertexShader,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'First Pass Vertex Shader',
      })
    );

    const firstPassFragmentShaderModule = runner.track(
      runner.device.createShaderModule({
        code: firstPassFragmentShader,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'First Pass Fragment Shader',
      })
    );

    // 15. 创建第二遍着色器
    const secondPassVertexShaderModule = runner.track(
      runner.device.createShaderModule({
        code: secondPassVertexShader,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Second Pass Vertex Shader',
      })
    );

    const secondPassFragmentShaderModule = runner.track(
      runner.device.createShaderModule({
        code: secondPassFragmentShader,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Second Pass Fragment Shader',
      })
    );

    // 16. 创建绑定组布局（第一遍）
    const firstPassBindGroupLayout = runner.track(
      runner.device.createBindGroupLayout(
        [
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
            name: 'Lighting',
          },
          {
            binding: 2,
            visibility: MSpec.RHIShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
            name: 'Camera',
          },
          {
            binding: 3,
            visibility: MSpec.RHIShaderStage.FRAGMENT,
            texture: { sampleType: 'float', viewDimension: '2d' },
            name: 'uTexture',
          },
          {
            binding: 4,
            visibility: MSpec.RHIShaderStage.FRAGMENT,
            sampler: { type: 'filtering' },
            name: 'uTexture',
          },
        ],
        'First Pass BindGroup Layout'
      )
    );

    // 17. 创建绑定组布局（第二遍）
    const secondPassBindGroupLayout = runner.track(
      runner.device.createBindGroupLayout(
        [
          {
            binding: 0,
            visibility: MSpec.RHIShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
            name: 'SecondPassUniforms',
          },
          {
            binding: 1,
            visibility: MSpec.RHIShaderStage.FRAGMENT,
            texture: { sampleType: 'float', viewDimension: '2d' },
            name: 'uRTTexture',
          },
          {
            binding: 2,
            visibility: MSpec.RHIShaderStage.FRAGMENT,
            sampler: { type: 'filtering' },
            name: 'uRTTexture',
          },
        ],
        'Second Pass BindGroup Layout'
      )
    );

    // 18. 创建绑定组
    let firstPassBindGroup = runner.track(
      runner.device.createBindGroup(firstPassBindGroupLayout, [
        { binding: 0, resource: transformBuffer },
        { binding: 1, resource: lightingBuffer },
        { binding: 2, resource: cameraBuffer },
        { binding: 3, resource: currentTexture.createView() },
        { binding: 4, resource: sampler },
      ])
    );

    let secondPassBindGroup = runner.track(
      runner.device.createBindGroup(secondPassBindGroupLayout, [
        { binding: 0, resource: secondPassUniformBuffer },
        { binding: 1, resource: renderTarget.getColorView(0) },
        { binding: 2, resource: sampler },
      ])
    );

    // 19. 创建管线
    const firstPassPipelineLayout = runner.track(
      runner.device.createPipelineLayout([firstPassBindGroupLayout], 'First Pass Pipeline Layout')
    );

    const firstPassPipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader: firstPassVertexShaderModule,
        fragmentShader: firstPassFragmentShaderModule,
        vertexLayout: cubeGeometry.layout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: firstPassPipelineLayout,
        depthStencilState: {
          format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
          depthWriteEnabled: true,
          depthCompare: MSpec.RHICompareFunction.LESS,
        },
        label: 'First Pass Pipeline',
      })
    );

    const secondPassPipelineLayout = runner.track(
      runner.device.createPipelineLayout([secondPassBindGroupLayout], 'Second Pass Pipeline Layout')
    );

    const secondPassPipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader: secondPassVertexShaderModule,
        fragmentShader: secondPassFragmentShaderModule,
        vertexLayout: quadGeometry.layout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: secondPassPipelineLayout,
        label: 'Second Pass Pipeline',
      })
    );

    // 20. 创建 GUI
    const gui = new SimpleGUI();

    gui
      .add('rotationSpeed', {
        value: params.rotationSpeed,
        min: 0,
        max: 3,
        step: 0.1,
        onChange: (v) => {
          params.rotationSpeed = v as number;
        },
      })
      .add('autoRotate', {
        value: params.autoRotate,
        onChange: (v) => {
          params.autoRotate = v as boolean;
        },
      })
      .addSeparator('Lighting')
      .add('lightIntensity', {
        value: params.lightIntensity,
        min: 0,
        max: 2,
        step: 0.1,
        onChange: (v) => {
          params.lightIntensity = v as number;
        },
      })
      .addSeparator('Render Mode')
      .add('splitMode', {
        value: params.splitMode,
        options: ['0', '1', '2'],
        onChange: (v) => {
          params.splitMode = parseInt(v as string);
        },
      })
      .addSeparator('Post-Effect')
      .add('effect', {
        value: params.effect,
        options: ['0', '1', '2', '3', '4'],
        onChange: (v) => {
          params.effect = parseInt(v as string);
        },
      })
      .addSeparator('Texture')
      .add('textureType', {
        value: params.textureType,
        options: ['gradient', 'checkerboard', 'noise'],
        onChange: (v) => {
          params.textureType = v as string;
          const newTexData = textures[params.textureType];
          if (newTexData) {
            currentTexture.destroy();
            currentTexture = runner.track(
              runner.device.createTexture({
                width: newTexData.width,
                height: newTexData.height,
                format: MSpec.RHITextureFormat.RGBA8_UNORM,
                usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
                label: 'Cube Texture',
              })
            );
            currentTexture.update(newTexData.data as BufferSource);
            // 重建绑定组
            firstPassBindGroup.destroy();
            firstPassBindGroup = runner.track(
              runner.device.createBindGroup(firstPassBindGroupLayout, [
                { binding: 0, resource: transformBuffer },
                { binding: 1, resource: lightingBuffer },
                { binding: 2, resource: cameraBuffer },
                { binding: 3, resource: currentTexture.createView() },
                { binding: 4, resource: sampler },
              ])
            );
          }
        },
      });

    // 21. 旋转状态
    let rotationY = 0;
    let rotationX = 0;

    // 22. 矩阵
    const modelMatrix = new MMath.Matrix4();
    const normalMatrix = new MMath.Matrix4();

    // 23. 键盘事件
    runner.onKey('Escape', () => {
      gui.destroy();
      stats.destroy();
      orbit.destroy();
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

    runner.onKey(' ', () => {
      params.autoRotate = !params.autoRotate;
      gui.set('autoRotate', params.autoRotate);
    });

    // 24. 启动渲染循环
    runner.start((dt) => {
      stats.begin();

      // 更新旋转
      if (params.autoRotate) {
        rotationY += params.rotationSpeed * dt;
        rotationX += params.rotationSpeed * 0.3 * dt;
      }

      // 更新相机
      orbit.update(dt);

      // 更新模型矩阵
      modelMatrix.identity();
      modelMatrix.rotateY(rotationY);
      modelMatrix.rotateX(rotationX);

      // 计算法线矩阵
      normalMatrix.copyFrom(modelMatrix);
      normalMatrix.invert();
      normalMatrix.transpose();

      // 获取视图和投影矩阵
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);
      const cameraPos = orbit.getPosition();

      // 更新 Transform Uniform
      const transformData = new Float32Array(64);
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformData.set(normalMatrix.toArray(), 48);
      transformBuffer.update(transformData, 0);

      // 更新 Lighting Uniform
      const lightingData = new Float32Array(12);
      lightingData[0] = 1.0;
      lightingData[1] = 1.0;
      lightingData[2] = 1.0;
      lightingData[3] = 0;
      lightingData[4] = params.lightIntensity;
      lightingData[5] = params.lightIntensity;
      lightingData[6] = params.lightIntensity;
      lightingData[7] = 0;
      lightingData[8] = 0.3;
      lightingData[9] = 0.3;
      lightingData[10] = 0.3;
      lightingData[11] = 0.5;
      lightingBuffer.update(lightingData, 0);

      // 更新 Camera Uniform
      const cameraData = new Float32Array(4);
      cameraData[0] = cameraPos.x;
      cameraData[1] = cameraPos.y;
      cameraData[2] = cameraPos.z;
      cameraBuffer.update(cameraData, 0);

      // 更新第二遍 Uniform
      const secondPassData = new Float32Array(8); // 32 bytes
      secondPassData[0] = runner.width;
      secondPassData[1] = runner.height;
      secondPassData[2] = params.splitMode;
      secondPassData[3] = params.effect; // effect 作为 int 存储在 float 数组中
      secondPassUniformBuffer.update(secondPassData, 0);

      // 开始渲染
      const { encoder, passDescriptor } = runner.beginFrame();

      // 第一遍：渲染到纹理
      if (params.splitMode !== 2) {
        const rttPassDescriptor = renderTarget.getRenderPassDescriptor([0.1, 0.1, 0.2, 1.0]);
        const firstPass = encoder.beginRenderPass({
          colorAttachments: rttPassDescriptor.colorAttachments,
          depthStencilAttachment: rttPassDescriptor.depthStencilAttachment,
        });
        firstPass.setPipeline(firstPassPipeline);
        firstPass.setBindGroup(0, firstPassBindGroup);
        firstPass.setVertexBuffer(0, cubeVertexBuffer);
        firstPass.setIndexBuffer(cubeIndexBuffer, MSpec.RHIIndexFormat.UINT16);
        firstPass.drawIndexed(cubeGeometry.indexCount!);
        firstPass.end();
      }

      // 第二遍：渲染到屏幕
      const secondPass = encoder.beginRenderPass({
        colorAttachments: passDescriptor.colorAttachments,
      });
      secondPass.setPipeline(secondPassPipeline);
      secondPass.setBindGroup(0, secondPassBindGroup);
      secondPass.setVertexBuffer(0, quadVertexBuffer);
      secondPass.draw(quadGeometry.vertexCount);
      secondPass.end();

      runner.endFrame(encoder);

      stats.end();
    });

    // 25. 显示帮助
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      'Space: 暂停/继续旋转',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);
  } catch (error) {
    DemoRunner.showError(`Demo 初始化失败: ${(error as Error).message}`);
  }
}

// 启动 Demo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}