/**
 * stencil-test.ts
 * 模板测试演示 Demo
 * 展示使用模板缓冲区实现轮廓效果（Outline Effect）
 *
 * 功能演示：
 * - 模板缓冲区的读写操作
 * - 模板比较函数和操作
 * - 两遍渲染实现轮廓效果
 * - 模板状态配置
 */

import { MSpec, MMath } from '@maxellabs/core';
import { DemoRunner, GeometryGenerator, OrbitController, Stats, SimpleGUI } from './utils';

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
};

// 可选：用于放大的缩放因子
uniform ScaleParams {
  float uScale;
};

void main() {
  // 将法线转换到视图空间
  mat3 normalMatrix = transpose(inverse(mat3(uViewMatrix * uModelMatrix)));
  vec3 viewNormal = normalize(normalMatrix * aNormal);

  // 将位置转换到视图空间
  vec4 viewPos = uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);

  // 沿法线方向挤出顶点创建轮廓
  // 使用较小的缩放因子确保轮廓效果合适
  float outlineWidth = (uScale - 1.0) * 0.1;
  vec4 outlinePos = viewPos + vec4(viewNormal * outlineWidth, 0.0);

  // 投影到屏幕空间
  gl_Position = uProjectionMatrix * outlinePos;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

// Uniform：颜色参数
uniform ColorParams {
  vec3 uColor;
};

out vec4 fragColor;

void main() {
  fragColor = vec4(uColor, 1.0);
}
`;

// ==================== Demo 参数 ====================

interface DemoParams {
  outlineScale: number;
  outlineColor: [number, number, number];
  enableOutline: boolean;
  mainColor: [number, number, number];
}

// ==================== Demo 实现 ====================

async function main(): Promise<void> {
  // 1. 创建 DemoRunner
  const runner = new DemoRunner({
    canvasId: 'J-canvas',
    name: '模板测试 Demo',
    clearColor: [0.05, 0.05, 0.05, 1.0],
    deviceOptions: {
      depth: true, // 启用深度缓冲
      stencil: true, // 启用模板缓冲
    },
  });

  try {
    // 2. 初始化
    await runner.init();

    // 3. 创建性能统计
    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });

    // 4. 创建轨道控制器
    const orbit = new OrbitController(runner.canvas, {
      distance: 3,
      target: [0, 0, 0],
      enableDamping: true,
      autoRotate: false,
      autoRotateSpeed: 0.5,
    });

    // 5. Demo 参数
    const params: DemoParams = {
      outlineScale: 1.5, // 增大轮廓缩放倍数以获得更明显的效果
      outlineColor: [1.0, 1.0, 0.0] as [number, number, number], // 黄色轮廓更加醒目
      enableOutline: true,
      mainColor: [0.2, 0.5, 1.0] as [number, number, number], // 蓝色主体
    };

    // 6. 生成立方体几何体
    const geometry = GeometryGenerator.cube({
      size: 1.0,
      colors: false,
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

    // Transform uniform: 3 个 mat4 = 192 bytes
    const transformBuffer = runner.track(
      runner.device.createBuffer({
        size: 256,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transform Uniform Buffer',
      })
    );

    // Scale uniform: float (对齐为 16 bytes)
    const scaleParamsBuffer = runner.track(
      runner.device.createBuffer({
        size: 16,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Scale Params Uniform Buffer',
      })
    );

    // Color uniform: vec3 (对齐为 16 bytes)
    const colorParamsBuffer = runner.track(
      runner.device.createBuffer({
        size: 16,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Color Params Uniform Buffer',
      })
    );

    // 10. 创建绑定组布局（用于第一遍渲染：正常渲染）
    const normalBindGroupLayout = runner.track(
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
            visibility: MSpec.RHIShaderStage.VERTEX,
            buffer: { type: 'uniform' },
            name: 'ScaleParams',
          },
          {
            binding: 2,
            visibility: MSpec.RHIShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
            name: 'ColorParams',
          },
        ],
        'Normal BindGroup Layout'
      )
    );

    // 11. 创建绑定组（用于第一遍渲染）
    const normalBindGroup = runner.track(
      runner.device.createBindGroup(normalBindGroupLayout, [
        { binding: 0, resource: transformBuffer },
        { binding: 1, resource: scaleParamsBuffer },
        { binding: 2, resource: colorParamsBuffer },
      ])
    );

    // 12. 创建着色器
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: vertexShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
        label: 'Stencil Test Vertex Shader',
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: fragmentShaderSource,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
        label: 'Stencil Test Fragment Shader',
      })
    );

    // 13. 创建管线布局
    const pipelineLayout = runner.track(
      runner.device.createPipelineLayout([normalBindGroupLayout], 'Stencil Test Pipeline Layout')
    );

    // 14. 创建第一遍管线：正常渲染，写入模板缓冲
    // 配置：模板比较函数为 ALWAYS，通过时写入参考值（REPLACE）
    const normalPipeline = runner.track(
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
          // 正面模板配置
          stencilFront: {
            compare: MSpec.RHICompareFunction.ALWAYS, // 总是通过模板测试
            failOp: MSpec.RHIStencilOperation.KEEP, // 测试失败时保持
            depthFailOp: MSpec.RHIStencilOperation.KEEP, // 深度测试失败时保持
            passOp: MSpec.RHIStencilOperation.REPLACE, // 通过时替换为参考值
            reference: 1, // 模板参考值
            readMask: 0xff,
            writeMask: 0xff,
          },
          // 背面模板配置（相同）
          stencilBack: {
            compare: MSpec.RHICompareFunction.ALWAYS,
            failOp: MSpec.RHIStencilOperation.KEEP,
            depthFailOp: MSpec.RHIStencilOperation.KEEP,
            passOp: MSpec.RHIStencilOperation.REPLACE,
            reference: 1,
            readMask: 0xff,
            writeMask: 0xff,
          },
        },
        label: 'Normal Render Pipeline',
      })
    );

    // 15. 创建第二遍管线：轮廓渲染，仅在模板不等于 1 时绘制
    const outlinePipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout: geometry.layout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        depthStencilState: {
          format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
          depthWriteEnabled: false, // 轮廓不写入深度
          depthTestEnabled: true, // 启用深度测试，确保轮廓正确遮挡
          depthCompare: MSpec.RHICompareFunction.LESS_EQUAL, // 使用LESS_EQUAL确保轮廓正确显示
          // 正面模板配置
          stencilFront: {
            compare: MSpec.RHICompareFunction.NOT_EQUAL, // 仅在模板 != 参考值时通过
            failOp: MSpec.RHIStencilOperation.KEEP,
            depthFailOp: MSpec.RHIStencilOperation.KEEP,
            passOp: MSpec.RHIStencilOperation.KEEP,
            reference: 1,
            readMask: 0xff,
            writeMask: 0x00, // 轮廓不写入模板缓冲
          },
          // 背面模板配置（相同）
          stencilBack: {
            compare: MSpec.RHICompareFunction.NOT_EQUAL,
            failOp: MSpec.RHIStencilOperation.KEEP,
            depthFailOp: MSpec.RHIStencilOperation.KEEP,
            passOp: MSpec.RHIStencilOperation.KEEP,
            reference: 1,
            readMask: 0xff,
            writeMask: 0x00,
          },
        },
        label: 'Outline Render Pipeline',
      })
    );

    // 16. 创建 GUI
    const gui = new SimpleGUI();

    gui
      .add('enableOutline', {
        value: params.enableOutline,
        onChange: (v) => {
          params.enableOutline = v as boolean;
        },
      })
      .add('outlineScale', {
        value: params.outlineScale,
        min: 1.0,
        max: 3.0, // 增加最大值到3.0，允许更宽的轮廓
        step: 0.01,
        onChange: (v) => {
          params.outlineScale = v as number;
        },
      })
      .addSeparator('Colors')
      .add('mainColorR', {
        value: params.mainColor[0],
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          params.mainColor[0] = v as number;
        },
      })
      .add('mainColorG', {
        value: params.mainColor[1],
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          params.mainColor[1] = v as number;
        },
      })
      .add('mainColorB', {
        value: params.mainColor[2],
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          params.mainColor[2] = v as number;
        },
      })
      .addSeparator('Outline Color')
      .add('outlineColorR', {
        value: params.outlineColor[0],
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          params.outlineColor[0] = v as number;
        },
      })
      .add('outlineColorG', {
        value: params.outlineColor[1],
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          params.outlineColor[1] = v as number;
        },
      })
      .add('outlineColorB', {
        value: params.outlineColor[2],
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          params.outlineColor[2] = v as number;
        },
      });

    // 17. 模型矩阵
    const modelMatrix = new MMath.Matrix4();
    let rotationY = 0;

    // 18. 键盘事件
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
      params.enableOutline = !params.enableOutline;
      gui.set('enableOutline', params.enableOutline);
    });

    // 19. 启动渲染循环
    runner.start((dt) => {
      rotationY += 0.5 * dt;

      // 更新轨道控制器
      orbit.update(dt);

      // 获取视图和投影矩阵
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

      // 开始性能统计
      stats.begin();

      // 更新模型矩阵
      modelMatrix.identity().rotateY(rotationY);

      // 使用 DemoRunner 的标准渲染流程
      const { encoder, passDescriptor } = runner.beginFrame();

      // 合并 passDescriptor，确保模板缓冲被清除
      const fullPassDescriptor: any = {
        ...passDescriptor,
        depthStencilAttachment: {
          ...passDescriptor.depthStencilAttachment,
          stencilLoadOp: 'clear',
          stencilStoreOp: 'store',
          clearStencil: 0, // 清除模板缓冲为 0
        },
      };

      const renderPass = encoder.beginRenderPass(fullPassDescriptor);

      // ===== 第一遍：正常渲染（写入模板缓冲） =====
      renderPass.setPipeline(normalPipeline);
      renderPass.setBindGroup(0, normalBindGroup);

      // 更新 Transform Uniform
      const transformData = new Float32Array(64);
      transformData.set(modelMatrix.toArray(), 0);
      transformData.set(viewMatrix, 16);
      transformData.set(projMatrix, 32);
      transformBuffer.update(transformData, 0);

      // 更新 Scale Uniform（第一遍缩放为 1.0）
      const scaleData = new Float32Array(4);
      scaleData[0] = 1.0;
      scaleParamsBuffer.update(scaleData, 0);

      // 更新 Color Uniform（主体颜色）
      const colorData = new Float32Array(4);
      colorData[0] = params.mainColor[0];
      colorData[1] = params.mainColor[1];
      colorData[2] = params.mainColor[2];
      colorParamsBuffer.update(colorData, 0);

      // 绘制第一遍（正常的立方体）
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
      renderPass.drawIndexed(geometry.indexCount!);

      // ===== 第二遍：轮廓渲染（仅在模板不等于 1 时绘制） =====
      if (params.enableOutline) {
        renderPass.setPipeline(outlinePipeline);
        renderPass.setBindGroup(0, normalBindGroup);

        // 更新 Scale Uniform（轮廓放大）
        const outlineScaleData = new Float32Array(4);
        outlineScaleData[0] = params.outlineScale;
        scaleParamsBuffer.update(outlineScaleData, 0);

        // 更新 Color Uniform（轮廓颜色）
        const outlineColorData = new Float32Array(4);
        outlineColorData[0] = params.outlineColor[0];
        outlineColorData[1] = params.outlineColor[1];
        outlineColorData[2] = params.outlineColor[2];
        colorParamsBuffer.update(outlineColorData, 0);

        // 绘制第二遍（放大的立方体轮廓）
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
        renderPass.drawIndexed(geometry.indexCount!);
      }

      renderPass.end();

      runner.endFrame(encoder);

      // 结束性能统计
      stats.end();
    });

    // 20. 显示帮助
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      'Space: 切换轮廓显示',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
      '',
      '💡 模板测试演示：使用模板缓冲实现轮廓效果',
      '第一遍渲染：正常绘制物体，写入模板值',
      '第二遍渲染：绘制放大的物体，仅在模板值不匹配处显示轮廓',
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
