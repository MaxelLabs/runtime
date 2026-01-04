/**
 * ForwardRenderer - 前向渲染器
 *
 * @packageDocumentation
 *
 * @remarks
 * ForwardRenderer 实现基于物理的前向渲染管线。
 *
 * ## 渲染流程
 * 1. beginFrame() - 清屏、准备帧
 * 2. onBeforeRender() - 阴影预渲染（如果启用）
 * 3. render() - 主渲染通道
 * 4. onAfterRender() - 后处理效果
 * 5. endFrame() - 提交命令、呈现
 *
 * ## 设计原则
 * - 继承 Core 的 Renderer 抽象类
 * - 支持可选的 ShadowPass 和 PostProcessPass
 * - 提供 HDR 渲染支持
 */

import type { IRHICommandEncoder, IRHITexture, IRHITextureView } from '@maxellabs/specification';
import { Renderer, type RendererConfig, type RenderContext } from '@maxellabs/core';

/**
 * 后处理通道接口
 */
export interface PostProcessPass {
  /** 通道名称 */
  readonly name: string;

  /** 是否启用 */
  enabled: boolean;

  /**
   * 渲染后处理
   * @param ctx 渲染上下文
   * @param input 输入纹理视图
   * @param output 输出纹理视图
   */
  render(ctx: RenderContext, input: IRHITextureView, output: IRHITextureView): void;

  /** 释放资源 */
  dispose(): void;
}

/**
 * 阴影通道接口
 */
export interface ShadowPass {
  /** 是否启用 */
  enabled: boolean;

  /** 阴影贴图尺寸 */
  mapSize: number;

  /** CSM 级联数 */
  cascadeCount: number;

  /**
   * 渲染阴影贴图
   * @param ctx 渲染上下文
   */
  render(ctx: RenderContext): void;

  /**
   * 获取阴影贴图
   */
  getShadowMap(): IRHITexture | null;

  /** 释放资源 */
  dispose(): void;
}

/**
 * ForwardRenderer 配置
 */
export interface ForwardRendererConfig extends RendererConfig {
  /** 启用 HDR 渲染 */
  hdr?: boolean;

  /** 阴影通道 */
  shadowPass?: ShadowPass;

  /** 后处理通道列表 */
  postProcessPasses?: PostProcessPass[];

  /** 背景颜色 (覆盖 clearColor) */
  backgroundColor?: [number, number, number, number];
}

/**
 * ForwardRenderer - 前向渲染器实现
 *
 * @remarks
 * 继承自 Core 的 Renderer 抽象类，实现前向渲染管线。
 *
 * ## 特性
 * - PBR 材质支持
 * - 可选阴影渲染
 * - 可选后处理效果
 * - HDR 渲染支持
 *
 * ## 使用示例
 * ```typescript
 * const renderer = new ForwardRenderer({
 *   device,
 *   clearColor: [0.1, 0.1, 0.1, 1.0],
 *   hdr: true,
 *   shadowPass: new ShadowPass(device, { mapSize: 2048 }),
 *   postProcessPasses: [new BloomPass(device)]
 * });
 * ```
 */
export class ForwardRenderer extends Renderer {
  /** 阴影通道 */
  private shadowPass?: ShadowPass;

  /** 后处理通道 */
  private postProcessPasses: PostProcessPass[];

  /** HDR 模式 */
  private hdrEnabled: boolean;

  /** 命令编码器 */
  private commandEncoder: IRHICommandEncoder | null = null;

  /** 主渲染目标纹理 (HDR 时使用) */
  private hdrRenderTarget: IRHITexture | null = null;
  private hdrRenderTargetView: IRHITextureView | null = null;

  /**
   * 创建 ForwardRenderer
   * @param config 渲染器配置
   */
  constructor(config: ForwardRendererConfig) {
    super(config);

    this.shadowPass = config.shadowPass;
    this.postProcessPasses = config.postProcessPasses ?? [];
    this.hdrEnabled = config.hdr ?? false;

    // 如果提供了 backgroundColor，覆盖 clearColor
    if (config.backgroundColor) {
      this.config.clearColor = config.backgroundColor;
    }

    // 初始化 HDR 渲染目标
    if (this.hdrEnabled) {
      this.initHDRRenderTarget();
    }
  }

  /**
   * 初始化 HDR 渲染目标
   * @internal
   */
  private initHDRRenderTarget(): void {
    // TODO: 当 RHI 支持时创建 HDR 纹理
    // this.hdrRenderTarget = this.device.createTexture({
    //   width: canvas.width,
    //   height: canvas.height,
    //   format: 'rgba16float',
    //   usage: RHITextureUsage.RENDER_ATTACHMENT | RHITextureUsage.TEXTURE_BINDING
    // });
    // this.hdrRenderTargetView = this.hdrRenderTarget.createView();
  }

  /**
   * 开始帧渲染
   * @override
   */
  override beginFrame(): void {
    super.beginFrame();

    // 创建命令编码器
    this.commandEncoder = this.device.createCommandEncoder('ForwardRenderer');

    // 清屏操作在 render() 的 beginRenderPass 中执行
  }

  /**
   * 结束帧渲染
   * @override
   */
  override endFrame(): void {
    if (this.commandEncoder) {
      // 提交命令
      const commandBuffer = this.commandEncoder.finish();
      this.device.submit([commandBuffer]);
      this.commandEncoder = null;
    }

    super.endFrame();
  }

  /**
   * 预渲染钩子 - 渲染阴影贴图
   * @param ctx 渲染上下文
   * @override
   */
  protected override onBeforeRender(ctx: RenderContext): void {
    // 渲染阴影贴图
    if (this.shadowPass?.enabled) {
      this.shadowPass.render(ctx);
    }
  }

  /**
   * 主渲染方法
   * @param ctx 渲染上下文
   * @override
   */
  protected override render(ctx: RenderContext): void {
    // 如果没有 commandEncoder，跳过渲染
    if (!this.commandEncoder) {
      console.warn('[ForwardRenderer] No command encoder available');
      return;
    }

    // 如果没有可渲染对象，仅清屏
    if (ctx.renderables.length === 0) {
      this.renderEmptyFrame(ctx);
      return;
    }

    // 执行主渲染
    this.renderMainPass(ctx);
  }

  /**
   * 渲染空帧（仅清屏）
   * @param _ctx 渲染上下文
   * @internal
   */
  private renderEmptyFrame(_ctx: RenderContext): void {
    // TODO: 实际的 RHI 调用
    // const pass = this.commandEncoder!.beginRenderPass({
    //   colorAttachments: [{
    //     view: this.getOutputView(),
    //     loadOp: 'clear',
    //     storeOp: 'store',
    //     clearColor: this.config.clearColor
    //   }],
    //   depthStencilAttachment: {
    //     view: this.depthStencilView,
    //     depthLoadOp: 'clear',
    //     depthStoreOp: 'store',
    //     clearDepth: 1.0
    //   }
    // });
    // pass.end();
  }

  /**
   * 执行主渲染通道
   * @param ctx 渲染上下文
   * @internal
   */
  private renderMainPass(ctx: RenderContext): void {
    // TODO: 实际的 RHI 渲染实现
    // 1. 开始渲染通道
    // const pass = this.commandEncoder!.beginRenderPass({...});

    // 2. 按材质分组渲染
    // const renderablesByMaterial = this.groupByMaterial(ctx.renderables);

    // 3. 遍历渲染
    for (const renderable of ctx.renderables) {
      this.renderObject(ctx, renderable);
    }

    // 4. 结束渲染通道
    // pass.end();
  }

  /**
   * 渲染单个对象
   * @param ctx 渲染上下文
   * @param renderable 可渲染对象
   * @internal
   */
  private renderObject(_ctx: RenderContext, _renderable: unknown): void {
    // TODO: 实现单对象渲染
    // 1. 获取网格和材质
    // const mesh = ctx.scene.resourceManager.getMesh(renderable.meshId);
    // const material = ctx.scene.resourceManager.getMaterial(renderable.materialId);
    // 2. 创建材质实例
    // const instance = this.createMaterialInstance(material);
    // 3. 设置变换矩阵
    // instance.setProperty('u_ModelMatrix', renderable.worldMatrix);
    // 4. 绑定并绘制
    // instance.bind();
    // this.drawMesh(mesh);
  }

  /**
   * 后渲染钩子 - 后处理效果
   * @param ctx 渲染上下文
   * @override
   */
  protected override onAfterRender(ctx: RenderContext): void {
    // 执行后处理链
    if (this.postProcessPasses.length === 0) {
      return;
    }

    // TODO: 实现后处理链
    // let input = this.hdrRenderTargetView ?? this.getBackbufferView();
    // for (const pass of this.postProcessPasses) {
    //   if (pass.enabled) {
    //     pass.render(ctx, input, output);
    //     [input, output] = [output, input]; // Ping-pong
    //   }
    // }

    // 避免未使用参数警告
    void ctx;
  }

  /**
   * 添加后处理通道
   * @param pass 后处理通道
   */
  addPostProcessPass(pass: PostProcessPass): void {
    this.postProcessPasses.push(pass);
  }

  /**
   * 移除后处理通道
   * @param pass 后处理通道
   * @returns 是否成功移除
   */
  removePostProcessPass(pass: PostProcessPass): boolean {
    const index = this.postProcessPasses.indexOf(pass);
    if (index !== -1) {
      this.postProcessPasses.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取后处理通道列表
   * @returns 后处理通道数组
   */
  getPostProcessPasses(): readonly PostProcessPass[] {
    return this.postProcessPasses;
  }

  /**
   * 设置阴影通道
   * @param shadowPass 阴影通道（null 禁用）
   */
  setShadowPass(shadowPass: ShadowPass | null): void {
    // 释放旧的阴影通道
    if (this.shadowPass) {
      this.shadowPass.dispose();
    }
    this.shadowPass = shadowPass ?? undefined;
  }

  /**
   * 获取阴影通道
   * @returns 阴影通道（可能为 undefined）
   */
  getShadowPass(): ShadowPass | undefined {
    return this.shadowPass;
  }

  /**
   * 是否启用 HDR
   * @returns HDR 状态
   */
  isHDREnabled(): boolean {
    return this.hdrEnabled;
  }

  /**
   * 设置 HDR 模式
   * @param enabled 是否启用
   */
  setHDREnabled(enabled: boolean): void {
    if (this.hdrEnabled === enabled) {
      return;
    }

    this.hdrEnabled = enabled;

    if (enabled) {
      this.initHDRRenderTarget();
    } else {
      this.disposeHDRRenderTarget();
    }
  }

  /**
   * 释放 HDR 渲染目标
   * @internal
   */
  private disposeHDRRenderTarget(): void {
    if (this.hdrRenderTarget) {
      this.hdrRenderTarget.destroy();
      this.hdrRenderTarget = null;
      this.hdrRenderTargetView = null;
    }
  }

  /**
   * 释放资源
   * @override
   */
  override dispose(): void {
    // 释放阴影通道
    if (this.shadowPass) {
      this.shadowPass.dispose();
      this.shadowPass = undefined;
    }

    // 释放后处理通道
    for (const pass of this.postProcessPasses) {
      pass.dispose();
    }
    this.postProcessPasses.length = 0;

    // 释放 HDR 渲染目标
    this.disposeHDRRenderTarget();

    // 调用父类释放
    super.dispose();
  }
}
