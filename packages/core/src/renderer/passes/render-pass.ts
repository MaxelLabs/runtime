/**
 * RenderPass.ts
 * 渲染通道抽象类
 *
 * 定义渲染通道的基础接口和生命周期
 * 所有具体的渲染通道都需要继承此类
 */

import type { RenderPipeline } from '../render-pipeline';
import type { RenderContext } from '../render-context';
import type { RenderQueue } from '../render-queue';
import type { IRHIRenderPass } from '../../interface/rhi/passes/renderPass';
import type { IRHICommandEncoder } from '../../interface/rhi/commandEncoder';
import type { RenderState } from '../../interface/renderer/renderState';

/**
 * 渲染通道配置
 */
export interface RenderPassConfig {
  /**
   * 通道名称
   */
  name: string;

  /**
   * 是否启用
   */
  enabled?: boolean;

  /**
   * 渲染优先级
   */
  priority?: number;

  /**
   * 深度测试模式
   */
  depthTest?: 'never' | 'less' | 'equal' | 'less-equal' | 'greater' | 'not-equal' | 'greater-equal' | 'always';

  /**
   * 是否写入深度
   */
  depthWrite?: boolean;

  /**
   * 模板测试配置
   */
  stencilTest?: {
    enabled: boolean;
    reference: number;
    readMask: number;
    writeMask: number;
    compare: 'never' | 'less' | 'equal' | 'less-equal' | 'greater' | 'not-equal' | 'greater-equal' | 'always';
    failOp: 'keep' | 'zero' | 'replace' | 'increment' | 'increment-wrap' | 'decrement' | 'decrement-wrap' | 'invert';
    depthFailOp:
      | 'keep'
      | 'zero'
      | 'replace'
      | 'increment'
      | 'increment-wrap'
      | 'decrement'
      | 'decrement-wrap'
      | 'invert';
    passOp: 'keep' | 'zero' | 'replace' | 'increment' | 'increment-wrap' | 'decrement' | 'decrement-wrap' | 'invert';
  };

  /**
   * 混合模式
   */
  blendMode?: 'none' | 'alpha' | 'additive' | 'multiply' | 'screen' | 'overlay';

  /**
   * 面剔除模式
   */
  cullMode?: 'none' | 'front' | 'back';

  /**
   * 清除颜色
   */
  clearColor?: [number, number, number, number];

  /**
   * 清除深度
   */
  clearDepth?: number;

  /**
   * 清除模板
   */
  clearStencil?: number;

  /**
   * 视口
   */
  viewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
    minDepth: number;
    maxDepth: number;
  };

  /**
   * 裁剪矩形
   */
  scissor?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 渲染通道统计信息
 */
export interface RenderPassStats {
  /**
   * 执行时间 (毫秒)
   */
  executionTime: number;

  /**
   * 绘制调用次数
   */
  drawCalls: number;

  /**
   * 渲染的三角形数量
   */
  triangles: number;

  /**
   * 渲染的顶点数量
   */
  vertices: number;

  /**
   * 状态切换次数
   */
  stateChanges: number;

  /**
   * 纹理绑定次数
   */
  textureBindings: number;

  /**
   * 缓冲区绑定次数
   */
  bufferBindings: number;

  /**
   * 渲染的对象数量
   */
  objectCount: number;
}

/**
 * 渲染通道抽象类
 *
 * 定义渲染通道的基础接口，具体的渲染通道需要继承此类
 * 并实现execute方法来定义具体的渲染逻辑
 */
export abstract class RenderPass {
  /**
   * 通道配置
   */
  readonly config: Required<RenderPassConfig>;

  /**
   * 关联的渲染管线
   */
  protected pipeline: RenderPipeline | null = null;

  /**
   * 统计信息
   */
  protected stats: RenderPassStats = {
    executionTime: 0,
    drawCalls: 0,
    triangles: 0,
    vertices: 0,
    stateChanges: 0,
    textureBindings: 0,
    bufferBindings: 0,
    objectCount: 0,
  };

  /**
   * 是否已初始化
   */
  protected initialized = false;

  /**
   * 当前RHI渲染通道
   */
  protected currentRHIPass: IRHIRenderPass | null = null;

  /**
   * 构造函数
   */
  constructor(config: RenderPassConfig) {
    // 设置默认配置
    this.config = {
      name: config.name,
      enabled: config.enabled ?? true,
      priority: config.priority ?? 0,
      depthTest: config.depthTest ?? 'less',
      depthWrite: config.depthWrite ?? true,
      cullMode: config.cullMode ?? 'back',
      blendMode: config.blendMode ?? 'none',
      stencilTest: config.stencilTest ?? {
        enabled: false,
        reference: 0,
        readMask: 0xff,
        writeMask: 0xff,
        compare: 'always',
        failOp: 'keep',
        depthFailOp: 'keep',
        passOp: 'keep',
      },
      clearColor: config.clearColor ?? [0, 0, 0, 1],
      clearDepth: config.clearDepth ?? 1.0,
      clearStencil: config.clearStencil ?? 0,
      viewport: config.viewport ?? {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        minDepth: 0.0,
        maxDepth: 1.0,
      },
      scissor: config.scissor ?? {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      },
    };

    // 初始化统计信息
    this.stats = {
      drawCalls: 0,
      triangles: 0,
      vertices: 0,
      executionTime: 0,
      stateChanges: 0,
      textureBindings: 0,
      bufferBindings: 0,
      objectCount: 0,
    };
  }

  /**
   * 设置关联的渲染管线
   */
  setPipeline(pipeline: RenderPipeline | null): void {
    this.pipeline = pipeline;
  }

  /**
   * 获取关联的渲染管线
   */
  getPipeline(): RenderPipeline | null {
    return this.pipeline;
  }

  /**
   * 初始化通道
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.onInitialize();
      this.initialized = true;
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`RenderPass "${this.config.name}" initialized successfully`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to initialize RenderPass "${this.config.name}":`, error);
      throw error;
    }
  }

  /**
   * 执行渲染通道
   */
  async execute(context: RenderContext, queue: RenderQueue): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // 调用子类的渲染方法
    await this.render(context, queue);
  }

  /**
   * 获取统计信息
   */
  getStats(): Readonly<RenderPassStats> {
    return { ...this.stats };
  }

  /**
   * 是否启用
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 设置启用状态
   */
  setEnabled(enabled: boolean): void {
    (this.config as any).enabled = enabled;
  }

  /**
   * 获取优先级
   */
  getPriority(): number {
    return this.config.priority;
  }

  /**
   * 设置优先级
   */
  setPriority(priority: number): void {
    (this.config as any).priority = priority;
  }

  /**
   * 销毁渲染通道
   */
  destroy(): void {
    this.onDestroy();
    this.initialized = false;
    this.pipeline = null;
    this.currentRHIPass = null;
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`RenderPass "${this.config.name}" destroyed`);
    }
  }

  /**
   * 初始化回调（子类重写）
   */
  protected async onInitialize(): Promise<void> {
    // 默认实现为空，子类可以重写
  }

  /**
   * 准备渲染（子类重写）
   */
  protected async prepare(context: RenderContext, queue: RenderQueue): Promise<void> {
    // 默认实现为空，子类可以重写
  }

  /**
   * 子类必须实现的渲染方法
   */
  protected abstract render(context: RenderContext, queue: RenderQueue): Promise<void>;

  /**
   * 完成渲染（子类重写）
   */
  protected async finalize(context: RenderContext, queue: RenderQueue): Promise<void> {
    // 结束RHI渲染通道
    if (this.currentRHIPass) {
      this.currentRHIPass.end();
      this.currentRHIPass = null;
    }
  }

  /**
   * 销毁回调（子类重写）
   */
  protected onDestroy(): void {
    // 默认实现为空，子类可以重写
  }

  /**
   * 开始渲染通道
   */
  protected beginRenderPass(context: RenderContext, encoder: IRHICommandEncoder, renderTarget?: any): IRHIRenderPass {
    // TODO: 实现渲染通道开始逻辑
    // 这里需要根据配置创建渲染通道描述符
    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: renderTarget?.colorView || this.getMainColorTexture(context)?.view,
          clearValue: this.config.clearColor,
          loadOp: 'clear' as const,
          storeOp: 'store' as const,
        },
      ],
      depthStencilAttachment: {
        view: renderTarget?.depthView || this.getMainDepthTexture(context)?.view,
        depthClearValue: this.config.clearDepth,
        depthLoadOp: 'clear' as const,
        depthStoreOp: 'store' as const,
        stencilClearValue: this.config.clearStencil,
        stencilLoadOp: 'clear' as const,
        stencilStoreOp: 'store' as const,
      },
    };

    return encoder.beginRenderPass(renderPassDescriptor);
  }

  /**
   * 获取主颜色纹理（占位符实现）
   */
  private getMainColorTexture(context: RenderContext): any {
    // TODO: 实现获取主颜色纹理
    return null;
  }

  /**
   * 获取主深度纹理（占位符实现）
   */
  private getMainDepthTexture(context: RenderContext): any {
    // TODO: 实现获取主深度纹理
    return null;
  }

  /**
   * 设置渲染状态
   */
  protected setRenderState(state: Partial<RenderState>): void {
    // TODO: 实现渲染状态设置
    // 这里可以更新配置或缓存状态以供后续使用
    if (state.depthTest !== undefined) {
      this.config.depthTest = state.depthTest;
    }
    if (state.depthWrite !== undefined) {
      this.config.depthWrite = state.depthWrite;
    }
    if (state.cullMode !== undefined) {
      this.config.cullMode = state.cullMode;
    }
    if (state.blendMode !== undefined) {
      // 只接受兼容的混合模式
      const compatibleBlendModes = ['none', 'alpha', 'additive', 'multiply', 'screen', 'overlay'];
      if (compatibleBlendModes.includes(state.blendMode)) {
        this.config.blendMode = state.blendMode as 'none' | 'alpha' | 'additive' | 'multiply' | 'screen' | 'overlay';
      }
    }
  }

  /**
   * 更新统计信息
   */
  protected updateStats(stats: Partial<RenderPassStats>): void {
    Object.assign(this.stats, stats);
  }

  /**
   * 增加绘制调用统计
   */
  protected incrementDrawCall(triangles: number = 0, vertices: number = 0): void {
    this.stats.drawCalls++;
    this.stats.triangles += triangles;
    this.stats.vertices += vertices;
  }

  /**
   * 增加状态切换统计
   */
  protected incrementStateChange(): void {
    this.stats.stateChanges++;
  }

  /**
   * 增加纹理绑定统计
   */
  protected incrementTextureBinding(): void {
    this.stats.textureBindings++;
  }

  /**
   * 增加缓冲区绑定统计
   */
  protected incrementBufferBinding(): void {
    this.stats.bufferBindings++;
  }

  /**
   * 增加对象计数统计
   */
  protected incrementObjectCount(): void {
    this.stats.objectCount++;
  }
}
