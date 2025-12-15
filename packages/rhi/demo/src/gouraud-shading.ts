/**
 * gouraud-shading.ts
 * Gouraud 着色（顶点着色） Demo
 *
 * 核心思想：
 * 在顶点着色器中计算光照，生成每个顶点的颜色。
 * 片元着色器则对顶点颜色进行线性插值，得到片元的最终颜色。
 *
 * 特点：
 * - 效率高，计算量集中在顶点。
 * - 效果平滑，但无法表现精细的高光（高光会在多边形内部被错误插值）。
 * - 容易出现马赫带（Mach Bands）现象。
 */
import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, OrbitController, SimpleGUI, Stats } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec3 aNormal;

// Uniform 块
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

uniform Lighting {
  vec3 uLightDirection;
  float uAmbientIntensity;
  float uDiffuseIntensity;
};

// 输出到片元着色器
out vec3 vColor;

void main() {
  // 变换顶点位置和法线到世界空间
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vec3 worldNormal = normalize(mat3(uNormalMatrix) * aNormal);

  // Lambert 漫反射模型
  vec3 lightDir = normalize(uLightDirection);
  float diff = max(dot(worldNormal, lightDir), 0.0);
  vec3 diffuseColor = vec3(1.0, 1.0, 1.0); // 假设物体基础色和光颜色都为白色
  vec3 diffuse = uDiffuseIntensity * diff * diffuseColor;

  // 环境光
  vec3 ambient = uAmbientIntensity * diffuseColor;

  // 最终顶点颜色
  vColor = ambient + diffuse;

  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

// 从顶点着色器传入的插值颜色
in vec3 vColor;

// 输出
out vec4 fragColor;

void main() {
  // 直接输出插值后的颜色
  fragColor = vec4(vColor, 1.0);
}
`;

// ==================== Demo 配置 ====================

interface DemoParams {
  lightX: number;
  lightY: number;
  lightZ: number;
  ambientIntensity: number;
  diffuseIntensity: number;
}

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: 'Gouraud 着色 Demo',
    clearColor: [0.1, 0.1, 0.1, 1.0],
  });

  try {
    await runner.init();

    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });

    const orbit = new OrbitController(runner.canvas, {
      distance: 3.5,
      target: [0, 0, 0],
      elevation: Math.PI / 6,
      azimuth: Math.PI / 4,
    });

    const params: DemoParams = {
      lightX: 1.0,
      lightY: 1.0,
      lightZ: 1.0,
      ambientIntensity: 0.2,
      diffuseIntensity: 0.8,
    };

    // 生成球体几何体
    const geometry = GeometryGenerator.sphere({
      radius: 1,
      normals: true,
      uvs: false, // Gouraud shading 不需要 UV
      widthSegments: 64,
      heightSegments: 32,
    });

    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: geometry.vertices as BufferSource,
        label: 'Sphere Vertex Buffer',
      })
    );

    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: geometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: geometry.indices as BufferSource,
        label: 'Sphere Index Buffer',
      })
    );

    // Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256, // 4 * mat4
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // Lighting uniform: vec3(16) + float(4) + float(4) = 24 bytes, 向上对齐到 32
    const lightingBuffer = runner.track(
      runner.device.createBuffer({
        size: 32,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Lighting Uniform Buffer',
      })
    );

    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Gouraud Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Gouraud Fragment Shader',
      })
    );

    // 绑定组布局
    const bindGroupLayout = runner.track(
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
            visibility: MSpec.RHIShaderStage.VERTEX, // 光照在 VS 中计算
            buffer: { type: 'uniform' },
            name: 'Lighting',
          },
        ],
        'Gouraud BindGroup Layout'
      )
    );

    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [
        { binding: 0, resource: transformBuffer },
        { binding: 1, resource: lightingBuffer },
      ])
    );

    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Gouraud Pipeline Layout')
    );

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
        label: 'Gouraud Render Pipeline',
      })
    );

    // GUI
    const gui = new SimpleGUI();
    gui
      .addSeparator('光照方向 (Light Direction)')
      .add('lightX', {
        value: params.lightX,
        min: -5,
        max: 5,
        step: 0.1,
        onChange: (v) => (params.lightX = v as number),
      })
      .add('lightY', {
        value: params.lightY,
        min: -5,
        max: 5,
        step: 0.1,
        onChange: (v) => (params.lightY = v as number),
      })
      .add('lightZ', {
        value: params.lightZ,
        min: -5,
        max: 5,
        step: 0.1,
        onChange: (v) => (params.lightZ = v as number),
      })
      .addSeparator('光照强度 (Intensity)')
      .add('ambientIntensity', {
        value: params.ambientIntensity,
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => (params.ambientIntensity = v as number),
      })
      .add('diffuseIntensity', {
        value: params.diffuseIntensity,
        min: 0,
        max: 2,
        step: 0.05,
        onChange: (v) => (params.diffuseIntensity = v as number),
      });

    const modelMatrix = new MMath.Matrix4();
    const normalMatrix = new MMath.Matrix4();
    let rotationY = 0;

    // 预分配渲染循环中使用的数组，避免GC压力
    const transformData = new Float32Array(64);
    const lightingData = new Float32Array(8); // 32 bytes
    const lightDir = new MMath.Vector3();

    // 键盘事件
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

    runner.start((dt) => {
      stats.begin();

      orbit.update(dt);
      rotationY += 0.3 * dt;

      modelMatrix.identity().rotateY(rotationY);
      normalMatrix.copyFrom(modelMatrix).invert().transpose();

      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      // 更新 Transform Uniform（复用预分配的数组）
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformData.set(normalMatrix.toArray(), 48);
      transformBuffer.update(transformData, 0);

      // 更新 Lighting Uniform（复用预分配的对象）
      lightDir.set(params.lightX, params.lightY, params.lightZ);
      lightDir.normalize();
      lightingData[0] = lightDir.x;
      lightingData[1] = lightDir.y;
      lightingData[2] = lightDir.z;
      // lightingData[3] is padding
      lightingData[4] = params.ambientIntensity;
      lightingData[5] = params.diffuseIntensity;
      lightingBuffer.update(lightingData, 0);

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

    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);
  } catch (error) {
    console.error('Demo 初始化失败:', error);
    DemoRunner.showError(`Demo 初始化失败: ${(error as Error).message}`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
