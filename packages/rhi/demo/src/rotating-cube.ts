/**
 * rotating-cube.ts
 * 旋转立方体 Demo - 展示完整的 RHI 功能
 *
 * 功能演示：
 * - 3D 几何体渲染
 * - 相机控制（OrbitController）
 * - 纹理贴图（程序化纹理）
 * - Uniform 缓冲区
 * - GUI 控制面板
 * - 性能统计
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, OrbitController, ProceduralTexture, SimpleGUI, Stats } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
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

const fragmentShaderSource = `#version 300 es
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

// ==================== Demo 配置 ====================

interface DemoParams {
  rotationSpeed: number;
  autoRotate: boolean;
  lightX: number;
  lightY: number;
  lightZ: number;
  ambientIntensity: number;
  specularIntensity: number;
  textureType: string;
}

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '旋转立方体 Demo',
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
      lightX: 1.0,
      lightY: 1.0,
      lightZ: 1.0,
      ambientIntensity: 1.0, // 适度的环境光，避免过曝
      specularIntensity: 0.5,
      textureType: 'checkerboard',
    };

    // 6. 生成立方体几何体
    const geometry = GeometryGenerator.cube({
      size: 1,
      normals: true,
      uvs: true,
    });

    // 7. 创建顶点缓冲区
    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: geometry.vertices as BufferSource,
        label: 'Cube Vertex Buffer',
      })
    );

    // 8. 创建索引缓冲区
    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: geometry.indices as BufferSource,
        label: 'Cube Index Buffer',
      })
    );

    // 9. 创建 Uniform 缓冲区
    // Transform uniform: 4 个 mat4 = 256 bytes (对齐)
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // Lighting uniform: vec3(16) + vec3(16) + vec3(12) + float(4) = 48 bytes
    // GPU std140 实际布局: uLightDirection(0-11,pad12-15), uLightColor(16-27,pad28-31), uAmbientColor(32-43), uSpecularIntensity(44-47)
    const lightingBuffer = runner.track(
      runner.device.createBuffer({
        size: 48,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Lighting Uniform Buffer',
      })
    );

    // Camera uniform: vec3 = 16 bytes (对齐)
    const cameraBuffer = runner.track(
      runner.device.createBuffer({
        size: 16,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Camera Uniform Buffer',
      })
    );

    // 10. 生成程序化纹理
    const textures: Record<string, ReturnType<typeof ProceduralTexture.checkerboard>> = {
      checkerboard: ProceduralTexture.checkerboard({
        width: 256,
        height: 256,
        cellSize: 32,
        colorA: [255, 255, 255, 255], // 白色
        colorB: [50, 50, 50, 255], // 深灰色，增加对比度
      }),
      gradient: ProceduralTexture.gradient({
        width: 256,
        height: 256,
        direction: 'diagonal',
        startColor: [255, 100, 50, 255],
        endColor: [50, 100, 255, 255],
      }),
      uv: ProceduralTexture.uvDebug({ width: 256, height: 256 }),
      noise: ProceduralTexture.noise({
        width: 256,
        height: 256,
        type: 'perlin',
        frequency: 4,
        octaves: 4,
      }),
    };

    // 创建 RHI 纹理（先创建空纹理，再通过 update 传入数据）
    let currentTexture = runner.track(
      runner.device.createTexture({
        width: 256,
        height: 256,
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
        usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
        label: 'Cube Texture',
      })
    );
    // 使用 update 方法传入初始纹理数据
    currentTexture.update(textures.checkerboard.data as BufferSource);

    // 11. 创建采样器
    const sampler = runner.track(
      runner.device.createSampler({
        magFilter: MSpec.RHIFilterMode.LINEAR,
        minFilter: MSpec.RHIFilterMode.LINEAR,
        mipmapFilter: MSpec.RHIFilterMode.LINEAR,
        addressModeU: MSpec.RHIAddressMode.REPEAT,
        addressModeV: MSpec.RHIAddressMode.REPEAT,
        label: 'Cube Sampler',
        useMipmap: false, // 明确禁用mipmap
      })
    );

    // 12. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Cube Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Cube Fragment Shader',
      })
    );

    // 13. 创建绑定组布局
    // 注意：name 属性必须与 GLSL 着色器中的 uniform block 或 sampler 名称匹配
    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout(
        [
          {
            binding: 0,
            visibility: MSpec.RHIShaderStage.VERTEX,
            buffer: { type: 'uniform' },
            name: 'Transforms', // 对应 vertex shader 中的 uniform Transforms { ... }
          },
          {
            binding: 1,
            visibility: MSpec.RHIShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
            name: 'Lighting', // 对应 fragment shader 中的 uniform Lighting { ... }
          },
          {
            binding: 2,
            visibility: MSpec.RHIShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
            name: 'Camera', // 对应 fragment shader 中的 uniform Camera { ... }
          },
          {
            binding: 3,
            visibility: MSpec.RHIShaderStage.FRAGMENT,
            texture: { sampleType: 'float', viewDimension: '2d' },
            name: 'uTexture', // 对应 fragment shader 中的 uniform sampler2D uTexture
          },
          {
            binding: 4,
            visibility: MSpec.RHIShaderStage.FRAGMENT,
            sampler: { type: 'filtering' },
            name: 'uTexture', // 采样器与纹理共用名称
          },
        ],
        'Cube BindGroup Layout'
      )
    );

    // 14. 创建绑定组
    let bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: transformBuffer },
        { binding: 1, resource: lightingBuffer },
        { binding: 2, resource: cameraBuffer },
        { binding: 3, resource: currentTexture.createView() },
        { binding: 4, resource: sampler },
      ])
    );

    // 15. 创建管线布局和管线
    const pipelineLayout = runner.track(runner.device.createPipelineLayout([bindGroupLayout], 'Cube Pipeline Layout'));

    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout: geometry.layout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        depthStencilState: {
          format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
          depthWriteEnabled: true,
          depthCompare: MSpec.RHICompareFunction.LESS,
        },
        label: 'Cube Render Pipeline',
      })
    );

    // 16. 创建 GUI
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
      .add('lightX', {
        value: params.lightX,
        min: -2,
        max: 2,
        step: 0.1,
        onChange: (v) => {
          params.lightX = v as number;
        },
      })
      .add('lightY', {
        value: params.lightY,
        min: -2,
        max: 2,
        step: 0.1,
        onChange: (v) => {
          params.lightY = v as number;
        },
      })
      .add('lightZ', {
        value: params.lightZ,
        min: -2,
        max: 2,
        step: 0.1,
        onChange: (v) => {
          params.lightZ = v as number;
        },
      })
      .add('ambientIntensity', {
        value: params.ambientIntensity,
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          params.ambientIntensity = v as number;
        },
      })
      .add('specularIntensity', {
        value: params.specularIntensity,
        min: 0,
        max: 2,
        step: 0.1,
        onChange: (v) => {
          params.specularIntensity = v as number;
        },
      })
      .addSeparator('Texture')
      .add('textureType', {
        value: params.textureType,
        options: ['checkerboard', 'gradient', 'uv', 'noise'],
        onChange: (v) => {
          params.textureType = v as string;
          // 更新纹理
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
            // 使用 update 方法传入纹理数据
            currentTexture.update(newTexData.data as BufferSource);
            // 重建绑定组
            bindGroup.destroy();
            bindGroup = runner.track(
              runner.device.createBindGroup(bindGroupLayout, [
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

    // 17. 旋转状态
    let rotationY = 0;
    let rotationX = 0;

    // 18. 矩阵
    const modelMatrix = new MMath.Matrix4();
    const normalMatrix = new MMath.Matrix4();

    // 19. 键盘事件
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

    // 20. 启动渲染循环
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

      // 计算法线矩阵 (模型矩阵的逆转置)
      normalMatrix.copyFrom(modelMatrix);
      normalMatrix.invert();
      normalMatrix.transpose();

      // 获取视图和投影矩阵
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);
      const cameraPos = orbit.getPosition();

      // 更新 Transform Uniform
      const transformData = new Float32Array(64); // 4 * 16
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformData.set(normalMatrix.toArray(), 48);
      transformBuffer.update(transformData, 0);

      // 更新 Lighting Uniform
      // GPU std140 布局: uLightDirection(0-11), uLightColor(16-27), uAmbientColor(32-43), uSpecularIntensity(44-47)
      // 总大小: 48 bytes = 12 floats
      const lightDir = new MMath.Vector3(params.lightX, params.lightY, params.lightZ);
      lightDir.normalize();
      const lightingData = new Float32Array(12); // 48 bytes
      lightingData[0] = lightDir.x; // offset 0
      lightingData[1] = lightDir.y; // offset 4
      lightingData[2] = lightDir.z; // offset 8
      lightingData[3] = 0; // padding to 16-byte boundary
      lightingData[4] = 1.0; // uLightColor.r, offset 16
      lightingData[5] = 1.0; // uLightColor.g, offset 20
      lightingData[6] = 1.0; // uLightColor.b, offset 24
      lightingData[7] = 0; // padding to 16-byte boundary
      lightingData[8] = params.ambientIntensity; // uAmbientColor.r, offset 32
      lightingData[9] = params.ambientIntensity; // uAmbientColor.g, offset 36
      lightingData[10] = params.ambientIntensity; // uAmbientColor.b, offset 40
      lightingData[11] = params.specularIntensity; // uSpecularIntensity, offset 44
      lightingBuffer.update(lightingData, 0);

      // 更新 Camera Uniform
      const cameraData = new Float32Array(4);
      cameraData[0] = cameraPos.x;
      cameraData[1] = cameraPos.y;
      cameraData[2] = cameraPos.z;
      cameraBuffer.update(cameraData, 0);

      // 开始渲染
      const { encoder, passDescriptor } = runner.beginFrame();

      const renderPass = encoder.beginRenderPass(passDescriptor);
      renderPass.setPipeline(pipeline);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
      renderPass.drawIndexed(geometry.indexCount!);
      renderPass.end();

      runner.endFrame(encoder);

      stats.end();
    });

    // 21. 显示帮助
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      'Space: 暂停/继续旋转',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);
  } catch (error) {
    console.error('Demo 初始化失败:', error);
    DemoRunner.showError(`Demo 初始化失败: ${(error as Error).message}`);
  }
}

// 启动 Demo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
