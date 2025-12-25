/**
 * simple-renderer.ts
 * 简单渲染器 - 用于验证 Core 包的 ECS 渲染流程
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计目标
 * - 继承 Renderer 抽象类
 * - 从 Scene 查询实体（Camera、MeshRef）
 * - 使用 IRHIDevice 接口（无 WebGL 直接调用）
 * - 验证完整的 ECS 渲染流程
 * - **展示声明式渲染架构**（BindGroup + PipelineLayout）
 *
 * ## 架构约束
 * - ✅ NO WebGL Dependencies: 仅通过 IRHIDevice 操作
 * - ✅ All Types from Specification: 所有 RHI 类型来自 @maxellabs/specification
 * - ✅ ECS Integration: 从 Scene 查询实体数据
 * - ✅ Declarative Binding: 使用 BindGroup 声明式绑定 Uniform
 *
 * ## 声明式架构说明
 * 本渲染器展示了现代 RHI 的声明式设计模式：
 *
 * ### 1. 着色器编译
 * ```typescript
 * // 使用 IRHIDevice.createShaderModule() 编译着色器
 * const vertexShader = device.createShaderModule({
 *   code: vertexShaderSource,
 *   language: 'glsl',
 *   stage: RHIShaderStage.VERTEX
 * });
 * ```
 *
 * ### 2. BindGroup 声明式绑定（取代命令式 setUniform）
 * ```typescript
 * // 旧模式（命令式，已废弃）：
 * // const location = gl.getUniformLocation(program, 'u_MVP');
 * // gl.uniformMatrix4fv(location, false, mvpMatrix);
 *
 * // 新模式（声明式，本 Demo 使用）：
 * const bindGroupLayout = device.createBindGroupLayout([
 *   { binding: 0, visibility: RHIShaderStage.VERTEX, buffer: { type: 'uniform' } }
 * ]);
 * const bindGroup = device.createBindGroup(bindGroupLayout, [
 *   { binding: 0, resource: uniformBuffer }  // 声明式绑定
 * ]);
 * ```
 *
 * ### 3. VertexLayout 声明式定义（取代 bindBuffer + vertexAttribPointer）
 * ```typescript
 * const vertexLayout = {
 *   buffers: [{
 *     attributes: [
 *       { name: 'aPosition', shaderLocation: 0, format: FLOAT32x3 }
 *     ]
 *   }]
 * };
 * ```
 *
 * ### 4. RenderPipeline 组合所有状态
 * ```typescript
 * const pipeline = device.createRenderPipeline({
 *   vertexShader,
 *   fragmentShader,
 *   vertexLayout,
 *   layout: pipelineLayout  // 包含所有 BindGroupLayout
 * });
 * ```
 *
 * ## 为什么是声明式？
 * - ✅ **类型安全**：编译时检查绑定冲突
 * - ✅ **性能优化**：驱动程序可预优化状态切换
 * - ✅ **跨平台**：WebGPU/Vulkan/Metal 统一抽象
 * - ✅ **可维护性**：清晰的资源依赖关系
 */

import { Renderer, MMath, MSpec } from '@maxellabs/core';
import type { RendererConfig, RenderContext } from '@maxellabs/core';
import type {
  IRHIBuffer,
  IRHIShaderModule,
  IRHIRenderPipeline,
  IRHIBindGroupLayout,
  IRHIBindGroup,
  IRHIPipelineLayout,
  IRHICommandEncoder,
  IRHITexture,
  IRHITextureView,
} from '@maxellabs/specification';

// ==================== 着色器源码 ====================

const vertexShaderSource = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aColor;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec3 vColor;

void main() {
  vColor = aColor;
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

in vec3 vColor;
out vec4 fragColor;

void main() {
  fragColor = vec4(vColor, 1.0);
}
`;

// ==================== 内置三角形数据 ====================

/**
 * 三角形顶点数据（位置 + 颜色）
 * 格式：[x, y, z, r, g, b, ...]
 */
const TRIANGLE_VERTICES = new Float32Array([
  // 顶点1: 顶部 (红色)
  0.0, 0.5, 0.0, 1.0, 0.0, 0.0,
  // 顶点2: 左下 (绿色)
  -0.5, -0.5, 0.0, 0.0, 1.0, 0.0,
  // 顶点3: 右下 (蓝色)
  0.5, -0.5, 0.0, 0.0, 0.0, 1.0,
]);

/**
 * 顶点布局描述
 */
const VERTEX_LAYOUT: MSpec.RHIVertexLayout = {
  buffers: [
    {
      index: 0,
      stride: 24, // 6 floats * 4 bytes = 24 bytes
      attributes: [
        {
          name: 'aPosition',
          shaderLocation: 0,
          offset: 0,
          format: MSpec.RHIVertexFormat.FLOAT32x3,
        },
        {
          name: 'aColor',
          shaderLocation: 1,
          offset: 12, // 3 floats * 4 bytes
          format: MSpec.RHIVertexFormat.FLOAT32x3,
        },
      ],
    },
  ],
};

// ==================== SimpleRenderer 配置扩展 ====================

/**
 * SimpleRenderer 配置接口
 */
export interface SimpleRendererConfig extends RendererConfig {
  /** Canvas 元素 */
  canvas: HTMLCanvasElement;
}

// ==================== SimpleRenderer 实现 ====================

/**
 * 简单渲染器
 *
 * @remarks
 * 用于验证 Core 包的 ECS 渲染流程。
 *
 * ## 功能
 * - 从 Scene 查询 Camera 实体获取视图/投影矩阵
 * - 从 Scene 查询 MeshRef 实体获取渲染对象
 * - 使用内置三角形数据（assetId: 'builtin:triangle'）
 *
 * ## 生命周期
 * 1. 构造函数：初始化 GPU 资源
 * 2. render()：从 Scene 查询实体并渲染
 * 3. dispose()：释放所有资源
 */
export class SimpleRenderer extends Renderer {
  /** 顶点缓冲区 */
  private vertexBuffer: IRHIBuffer | null = null;

  /** Uniform 缓冲区 */
  private uniformBuffer: IRHIBuffer | null = null;

  /** 渲染管线 */
  private pipeline: IRHIRenderPipeline | null = null;

  /** 绑定组 */
  private bindGroup: IRHIBindGroup | null = null;

  /** 顶点着色器模块 */
  private vertexShader: IRHIShaderModule | null = null;

  /** 片元着色器模块 */
  private fragmentShader: IRHIShaderModule | null = null;

  /** Transform Uniform 数据缓冲区 */
  private transformData: Float32Array;

  /** 离屏渲染目标纹理 */
  private renderTargetTexture: IRHITexture | null = null;

  /** 离屏渲染目标视图 */
  private renderTargetView: IRHITextureView | null = null;

  /** Canvas 元素引用 */
  private canvas: HTMLCanvasElement;

  /** 扩展配置 */
  protected override config: SimpleRendererConfig;

  /**
   * 创建 SimpleRenderer
   *
   * @param config 渲染器配置
   */
  constructor(config: SimpleRendererConfig) {
    super(config);
    this.config = config;
    this.canvas = config.canvas;

    // 预分配 Transform Uniform 数据（3个 mat4 = 192 bytes，对齐到 256）
    this.transformData = new Float32Array(64); // 4 * 16

    // 初始化 GPU 资源
    this.initResources();
  }

  /**
   * 初始化 GPU 资源
   */
  private initResources(): void {
    const device = this.getDevice();

    // 1. 创建顶点缓冲区
    this.vertexBuffer = device.createBuffer({
      size: TRIANGLE_VERTICES.byteLength,
      usage: MSpec.RHIBufferUsage.VERTEX,
      hint: 'static',
      initialData: new Float32Array(TRIANGLE_VERTICES),
      label: 'Triangle Vertex Buffer',
    });

    // 2. 创建 Uniform 缓冲区（Transform: 3个 mat4）
    this.uniformBuffer = device.createBuffer({
      size: 256, // 对齐到 256 bytes
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: 'Transform Uniform Buffer',
    });

    // 3. 编译着色器（声明式 - Step 1）
    // 注意：不再使用 getUniformLocation()，着色器仅编译和反射
    this.vertexShader = device.createShaderModule({
      code: vertexShaderSource,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.VERTEX,
      label: 'Triangle Vertex Shader',
    });

    this.fragmentShader = device.createShaderModule({
      code: fragmentShaderSource,
      language: 'glsl',
      stage: MSpec.RHIShaderStage.FRAGMENT,
      label: 'Triangle Fragment Shader',
    });

    // 4. 创建绑定组布局（声明式 - Step 2）
    // 定义 Uniform 绑定点，无需运行时查询位置
    const bindGroupLayout: IRHIBindGroupLayout = device.createBindGroupLayout(
      [
        {
          binding: 0, // 对应着色器中的 binding = 0
          visibility: MSpec.RHIShaderStage.VERTEX,
          buffer: { type: 'uniform' },
          name: 'Transforms',
        },
      ],
      'Triangle BindGroup Layout'
    );

    // 5. 创建绑定组（声明式 - Step 3）
    // 将 Uniform Buffer 绑定到 binding 0，无需 setUniform()
    this.bindGroup = device.createBindGroup(bindGroupLayout, [{ binding: 0, resource: this.uniformBuffer }]);

    // 6. 创建管线布局（声明式 - Step 4）
    // 定义管线可以访问的所有 BindGroupLayout
    // 注意：与 WebGL 的动态绑定不同，这是静态声明
    const pipelineLayout: IRHIPipelineLayout = device.createPipelineLayout(
      [bindGroupLayout],
      'Triangle Pipeline Layout'
    );

    // 7. 创建渲染管线（声明式 - Step 5）
    // 组合所有渲染状态：着色器、顶点布局、绑定布局
    // 这个 Pipeline 对象封装了完整的渲染状态，无需运行时设置
    this.pipeline = device.createRenderPipeline({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      vertexLayout: VERTEX_LAYOUT,
      primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
      layout: pipelineLayout,
      label: 'Triangle Render Pipeline',
    });

    // 8. 创建离屏渲染目标
    this.createRenderTarget();

    console.info('[SimpleRenderer] GPU resources initialized');
  }

  /**
   * 创建离屏渲染目标
   */
  private createRenderTarget(): void {
    const device = this.getDevice();
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 销毁旧的渲染目标
    if (this.renderTargetTexture) {
      this.renderTargetTexture.destroy();
    }

    // 创建颜色渲染目标纹理
    this.renderTargetTexture = device.createTexture({
      width,
      height,
      format: MSpec.RHITextureFormat.RGBA8_UNORM,
      usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
      dimension: MSpec.RHITextureType.TEXTURE_2D,
      label: 'SimpleRenderer RenderTarget',
    });

    // 创建视图
    this.renderTargetView = this.renderTargetTexture.createView();
  }

  /**
   * 从 RenderContext 获取相机矩阵
   * @remarks
   * 新设计：相机矩阵由 CameraSystem 计算并存储在 RenderContext 中
   * Renderer 不再直接访问 ECS 组件
   */
  private getCameraMatrices(ctx: RenderContext): {
    viewMatrix: MMath.Matrix4;
    projectionMatrix: MMath.Matrix4;
  } {
    // 从 RenderContext 获取预计算的矩阵
    if (ctx.viewMatrix && ctx.projectionMatrix) {
      const viewMatrix = new MMath.Matrix4();
      const projectionMatrix = new MMath.Matrix4();

      // 转换 Matrix4Like 到 Math.Matrix4
      viewMatrix.fromIMatrix4x4(ctx.viewMatrix);
      projectionMatrix.fromIMatrix4x4(ctx.projectionMatrix);

      return { viewMatrix, projectionMatrix };
    }

    // Fallback: 返回单位矩阵
    console.warn('[SimpleRenderer] Camera matrices not available in RenderContext');
    return {
      viewMatrix: new MMath.Matrix4(),
      projectionMatrix: new MMath.Matrix4(),
    };
  }

  /**
   * 主渲染方法
   *
   * @param ctx 渲染上下文
   *
   * @remarks
   * 新设计：
   * - 相机矩阵从 ctx.viewMatrix/projectionMatrix 获取（由 CameraSystem 计算）
   * - 可渲染对象从 ctx.renderables 获取（由 RenderSystem 收集）
   * - Renderer 不再执行 ECS Query，职责更清晰
   */
  protected override render(ctx: RenderContext): void {
    // 验证资源
    if (!this.pipeline || !this.vertexBuffer || !this.bindGroup || !this.uniformBuffer || !this.renderTargetView) {
      console.error('[SimpleRenderer] GPU resources not initialized');
      return;
    }

    // 获取相机矩阵（从 RenderContext）
    const { viewMatrix, projectionMatrix } = this.getCameraMatrices(ctx);

    // 遍历渲染每个对象（从 RenderContext.renderables）
    for (const renderable of ctx.renderables) {
      // 只渲染内置三角形
      if (renderable.meshId !== 'builtin:triangle') {
        continue;
      }

      // 从 Renderable 获取世界矩阵
      const modelMatrix = new MMath.Matrix4();
      modelMatrix.fromIMatrix4x4(renderable.worldMatrix);

      // 更新 Transform Uniform（声明式数据传递）
      // 注意：数据通过 Buffer.update() 传递，而非命令式的 setUniform()
      // 绑定关系已在 BindGroup 创建时声明，这里只更新数据
      this.transformData.set(modelMatrix.toArray(), 0);
      this.transformData.set(viewMatrix.toArray(), 16);
      this.transformData.set(projectionMatrix.toArray(), 32);
      this.uniformBuffer!.update(new Float32Array(this.transformData), 0);

      // 创建命令编码器（记录渲染命令）
      const encoder: IRHICommandEncoder = this.device.createCommandEncoder('Triangle Render');

      // 创建渲染通道描述符（声明式渲染目标配置）
      const passDescriptor = {
        colorAttachments: [
          {
            view: this.renderTargetView!,
            loadOp: 'clear' as const,
            storeOp: 'store' as const,
            clearColor: this.config.clearColor || [0.1, 0.1, 0.1, 1.0],
          },
        ],
      };

      // 开始渲染通道（声明式渲染状态绑定）
      const renderPass = encoder.beginRenderPass(passDescriptor);
      renderPass.setPipeline(this.pipeline!); // 绑定 Pipeline（包含着色器、顶点布局等）
      renderPass.setBindGroup(0, this.bindGroup!); // 绑定 BindGroup（包含 Uniform 绑定）
      renderPass.setVertexBuffer(0, this.vertexBuffer!); // 绑定顶点缓冲区
      renderPass.draw(3); // 绘制 3 个顶点（1个三角形）
      renderPass.end();

      // 复制到画布
      encoder.copyTextureToCanvas({
        source: this.renderTargetView!,
        destination: this.canvas,
      });

      // 提交命令
      this.device.submit([encoder.finish()]);
    }
  }

  /**
   * 释放资源
   */
  override dispose(): void {
    // 释放 GPU 资源
    this.vertexBuffer?.destroy();
    this.uniformBuffer?.destroy();
    this.pipeline?.destroy();
    this.bindGroup?.destroy();
    this.vertexShader?.destroy();
    this.fragmentShader?.destroy();
    this.renderTargetTexture?.destroy();

    // 调用父类 dispose
    super.dispose();

    console.info('[SimpleRenderer] Resources disposed');
  }
}
