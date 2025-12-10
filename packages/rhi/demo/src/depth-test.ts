/**
 * depth-test.ts
 * 深度测试演示 Demo
 * 展示 3D 渲染中深度缓冲区和深度测试的重要性
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, OrbitController, Stats } from './utils';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec3 aColor;

// Uniform 块
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

// 传递给片段着色器的变量
out vec3 vColor;
out float vDepth;

void main() {
  vColor = aColor;

  // MVP 变换
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

  // 计算深度值（用于可视化）
  vDepth = gl_Position.z;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

// 从顶点着色器接收的插值数据
in vec3 vColor;
in float vDepth;

out vec4 fragColor;

void main() {
  // 使用顶点颜色
  fragColor = vec4(vColor, 1.0);

  // 可选：根据深度调整颜色亮度（深度可视化）
  float normalizedDepth = (vDepth + 1.0) * 0.5;
  fragColor.rgb *= (normalizedDepth);
}
`;

// ==================== Demo 实现 ====================

interface RenderObject {
  name: string;
  geometry: any;
  modelMatrix: MMath.Matrix4;
  color: [number, number, number];
  vertexBuffer?: any;
}

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '深度测试 Demo',
    clearColor: [0.05, 0.05, 0.05, 1.0],
    deviceOptions: {
      depth: true, // 启用深度缓冲
      stencil: true, // 启用模板缓冲（DEPTH24_STENCIL8格式需要）
    },
  });

  try {
    // 2. 初始化
    await runner.init();

    // 3. 创建性能统计
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });

    // 4. 创建轨道控制器
    const orbit = new OrbitController(runner.canvas, {
      distance: 5,
      target: [0, 0, 0],
      enableDamping: true,
      autoRotate: false,
      autoRotateSpeed: 0.1,
    });

    // 5. 创建渲染对象集合
    const renderObjects: RenderObject[] = [];

    // 创建多个几何体来展示深度测试
    // 后面的正方形 - 红色
    const backQuad = {
      name: 'backQuad',
      geometry: GeometryGenerator.plane({
        width: 2,
        height: 2,
        colors: false,
      }),
      modelMatrix: new MMath.Matrix4().translate(new MMath.Vector3(0, 0, -1.5)),
      color: [1.0, 0.2, 0.2] as [number, number, number],
    };
    renderObjects.push(backQuad);

    // 中间的立方体 - 绿色
    const cube = {
      name: 'cube',
      geometry: GeometryGenerator.cube({
        size: 1.5,
        colors: false,
      }),
      modelMatrix: new MMath.Matrix4().translate(new MMath.Vector3(-0.5, 0, 0)),
      color: [0.2, 1.0, 0.2] as [number, number, number],
    };
    renderObjects.push(cube);

    // 前面的球体 - 蓝色
    const sphere = {
      name: 'sphere',
      geometry: GeometryGenerator.sphere({
        radius: 0.8,
        widthSegments: 32,
        heightSegments: 24,
        colors: false,
      }),
      modelMatrix: new MMath.Matrix4().translate(new MMath.Vector3(0.5, 0, 0.5)),
      color: [0.2, 0.2, 1.0] as [number, number, number],
    };
    renderObjects.push(sphere);

    // 顶部三角形 - 黄色
    const topTriangle = {
      name: 'topTriangle',
      geometry: GeometryGenerator.triangle({
        colors: false,
      }),
      modelMatrix: new MMath.Matrix4()
        .translate(new MMath.Vector3(0, 1.5, 0))
        .scale(new MMath.Vector3(0.8, 0.8, 0.8))
        .rotateZ(Math.PI / 4),
      color: [1.0, 1.0, 0.2] as [number, number, number],
    };
    renderObjects.push(topTriangle);

    // 6. 为每个几何体创建顶点缓冲区和添加颜色属性
    for (const obj of renderObjects) {
      // 修改几何体以包含颜色属性
      const vertexData: number[] = [];
      const vertexCount = obj.geometry.vertices.length / 3; // 只有位置
      const stride = 24; // 3 pos + 3 color = 6 floats * 4 bytes

      for (let i = 0; i < vertexCount; i++) {
        // 位置
        vertexData.push(
          obj.geometry.vertices[i * 3],
          obj.geometry.vertices[i * 3 + 1],
          obj.geometry.vertices[i * 3 + 2]
        );
        // 颜色
        vertexData.push(obj.color[0], obj.color[1], obj.color[2]);
      }

      // 更新顶点数据
      obj.geometry.vertices = new Float32Array(vertexData);

      // 更新顶点布局
      obj.geometry.layout = {
        buffers: [
          {
            index: 0,
            stride: stride,
            attributes: [
              {
                format: MSpec.RHIVertexFormat.FLOAT32x3,
                offset: 0,
                shaderLocation: 0,
              },
              {
                format: MSpec.RHIVertexFormat.FLOAT32x3,
                offset: 12,
                shaderLocation: 1,
              },
            ],
          },
        ],
      };

      // 创建缓冲区
      obj.vertexBuffer = runner.track(
        runner.device.createBuffer({
          size: obj.geometry.vertices.byteLength,
          usage: MSpec.RHIBufferUsage.VERTEX,
          hint: 'static',
          initialData: obj.geometry.vertices as BufferSource,
          label: `${obj.name} Vertex Buffer`,
        })
      );
    }

    // 7. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Depth Test Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Depth Test Fragment Shader',
      })
    );

    // 8. 创建 Uniform 缓冲区
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // 9. 创建绑定组布局
    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout(
        [
          {
            binding: 0,
            visibility: MSpec.RHIShaderStage.VERTEX,
            buffer: { type: 'uniform' },
            name: 'Transforms',
          },
        ],
        'Depth Test BindGroup Layout'
      )
    );

    // 10. 创建绑定组
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [{ binding: 0, resource: transformBuffer }])
    );

    // 11. 创建管线布局
    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([bindGroupLayout], 'Depth Test Pipeline Layout')
    );

    // 12. 创建管线（启用深度测试）
    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout: renderObjects[0].geometry.layout, // 所有对象使用相同布局
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        depthStencilState: {
          format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
          depthWriteEnabled: true, // 启用深度写入
          depthCompare: MSpec.RHICompareFunction.LESS_EQUAL, // 深度比较函数
        },
        label: 'Depth Test Render Pipeline',
      })
    );

    // 13. 动画参数
    const time = { value: 0 };

    // 14. 设置键盘事件
    runner.onKey('Escape', () => {
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

    // 15. 启动渲染循环
    runner.start((dt) => {
      time.value += dt;

      // 更新轨道控制器
      orbit.update(dt);

      // 获取视图和投影矩阵
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      // 开始性能统计
      stats.begin();

      // 使用 DemoRunner 的标准渲染流程
      const { encoder, passDescriptor } = runner.beginFrame();

      const renderPass = encoder.beginRenderPass(passDescriptor);
      renderPass.setPipeline(pipeline);
      renderPass.setBindGroup(0, bindGroup);

      // 渲染所有对象
      for (const obj of renderObjects) {
        // 添加简单的动画
        if (obj.name === 'topTriangle') {
          obj.modelMatrix
            .identity()
            .translate(new MMath.Vector3(Math.sin(time.value * 2) * 0.5, 1.5, Math.cos(time.value * 2) * 0.5))
            .scale(new MMath.Vector3(0.8, 0.8, 0.8))
            .rotateY(time.value);
        } else if (obj.name === 'cube') {
          obj.modelMatrix
            .identity()
            .translate(new MMath.Vector3(-0.5, 0, 0))
            .rotateY(time.value * 0.5);
        }

        // 更新 Transform Uniform
        const transformData = new Float32Array(64);
        transformData.set(obj.modelMatrix.toArray(), 0);
        transformData.set(viewMatrix, 16);
        transformData.set(projMatrix, 32);
        transformBuffer.update(transformData, 0);

        // 绘制对象
        renderPass.setVertexBuffer(0, obj.vertexBuffer);
        renderPass.draw(obj.geometry.vertexCount);
      }

      renderPass.end();

      runner.endFrame(encoder);

      // 结束性能统计
      stats.end();
    });

    // 16. 显示帮助
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      '空格: 切换自动旋转',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
      '',
      '💡 深度测试确保正确的前后遮挡关系',
      '尝试旋转视角观察物体的遮挡效果',
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
