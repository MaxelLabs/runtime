/**
 * RenderPipeline.ts
 * 渲染管线抽象类
 *
 * 定义渲染管线的基础接口和执行流程
 * 遵循RHI硬件层优先原则，使用RHI抽象层进行渲染操作
 */

import type { Renderer } from './Renderer';
import type { RenderContext } from './RenderContext';
import type { RenderQueue } from './RenderQueue';
import type { RenderPass } from './passes/RenderPass';

/**
 * 渲染管线配置
 */
export interface RenderPipelineConfig {
  /**
   * 管线名称
   */
  name: string;

  /**
   * 是否启用深度测试
   */
  enableDepthTest?: boolean;

  /**
   * 是否启用模板测试
   */
  enableStencilTest?: boolean;

  /**
   * 是否启用多重采样
   */
  enableMSAA?: boolean;

  /**
   * 是否启用HDR
   */
  enableHDR?: boolean;

  /**
   * 是否启用伽马校正
   */
  enableGammaCorrection?: boolean;

  /**
   * 最大光源数量
   */
  maxLights?: number;

  /**
   * 是否启用阴影
   */
  enableShadows?: boolean;

  /**
   * 阴影质量级别
   */
  shadowQuality?: 'low' | 'medium' | 'high' | 'ultra';

  /**
   * 后处理效果列表
   */
  postProcessEffects?: string[];
}

/**
 * 渲染管线统计信息
 */
export interface RenderPipelineStats {
  /**
   * 管线执行时间 (毫秒)
   */
  executionTime: number;

  /**
   * 渲染通道数量
   */
  passCount: number;

  /**
   * 绘制调用次数
   */
  drawCalls: number;

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
}

/**
 * 渲染管线抽象类
 *
 * 定义渲染管线的基础接口，具体的渲染管线（如前向渲染、延迟渲染）
 * 需要继承此类并实现具体的渲染逻辑
 */
export abstract class RenderPipeline {
  /**
   * 管线配置
   */
  readonly config: Required<RenderPipelineConfig>;

  /**
   * 关联的渲染器
   */
  protected renderer: Renderer | null = null;

  /**
   * 渲染通道列表
   */
  protected passes: RenderPass[] = [];

  /**
   * 管线统计信息
   */
  protected stats: RenderPipelineStats = {
    executionTime: 0,
    passCount: 0,
    drawCalls: 0,
    stateChanges: 0,
    textureBindings: 0,
    bufferBindings: 0,
  };

  /**
   * 是否已初始化
   */
  protected initialized = false;

  /**
   * 构造函数
   */
  constructor(config: RenderPipelineConfig) {
    // 设置默认配置
    this.config = {
      name: config.name,
      enableDepthTest: config.enableDepthTest ?? true,
      enableStencilTest: config.enableStencilTest ?? false,
      enableMSAA: config.enableMSAA ?? true,
      enableHDR: config.enableHDR ?? false,
      enableGammaCorrection: config.enableGammaCorrection ?? true,
      maxLights: config.maxLights ?? 32,
      enableShadows: config.enableShadows ?? true,
      shadowQuality: config.shadowQuality ?? 'medium',
      postProcessEffects: config.postProcessEffects ?? [],
    };
  }

  /**
   * 设置关联的渲染器
   */
  setRenderer(renderer: Renderer): void {
    this.renderer = renderer;
  }

  /**
   * 获取关联的渲染器
   */
  getRenderer(): Renderer | null {
    return this.renderer;
  }

  /**
   * 初始化渲染管线
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!this.renderer) {
      throw new Error('Renderer not set');
    }

    try {
      // 初始化渲染通道
      await this.initializePasses();

      // 设置初始化标志
      this.initialized = true;

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`RenderPipeline "${this.config.name}" initialized successfully`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to initialize RenderPipeline "${this.config.name}":`, error);
      throw error;
    }
  }

  /**
   * 执行渲染管线
   */
  async execute(context: RenderContext, queue: RenderQueue): Promise<void> {
    if (!this.initialized) {
      throw new Error('RenderPipeline not initialized');
    }

    if (!this.renderer) {
      throw new Error('Renderer not set');
    }

    const startTime = performance.now();

    try {
      // 重置统计信息
      this.resetStats();

      // 准备渲染
      await this.prepare(context, queue);

      // 执行渲染通道
      await this.executePasses(context, queue);

      // 完成渲染
      await this.finalize(context, queue);

      // 更新统计信息
      this.stats.executionTime = performance.now() - startTime;
      this.stats.passCount = this.passes.length;

      // 更新渲染器统计信息
      this.renderer.updateStats({
        drawCalls: this.stats.drawCalls,
        renderTime: this.stats.executionTime,
      });
    } catch (error) {
      console.error(`RenderPipeline "${this.config.name}" execution failed:`, error);
      throw error;
    }
  }

  /**
   * 添加渲染通道
   */
  addPass(pass: RenderPass): void {
    this.passes.push(pass);
    pass.setPipeline(this);
  }

  /**
   * 移除渲染通道
   */
  removePass(pass: RenderPass): void {
    const index = this.passes.indexOf(pass);
    if (index !== -1) {
      this.passes.splice(index, 1);
      pass.setPipeline(null);
    }
  }

  /**
   * 获取渲染通道列表
   */
  getPasses(): readonly RenderPass[] {
    return this.passes;
  }

  /**
   * 获取统计信息
   */
  getStats(): Readonly<RenderPipelineStats> {
    return { ...this.stats };
  }

  /**
   * 销毁渲染管线
   */
  destroy(): void {
    // 销毁所有渲染通道
    for (const pass of this.passes) {
      pass.destroy();
    }
    this.passes.length = 0;

    // 重置状态
    this.initialized = false;
    this.renderer = null;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`RenderPipeline "${this.config.name}" destroyed`);
    }
  }

  /**
   * 初始化渲染通道（抽象方法）
   * 子类需要实现此方法来创建和配置渲染通道
   */
  protected abstract initializePasses(): Promise<void>;

  /**
   * 准备渲染（可选重写）
   * 在执行渲染通道之前的准备工作
   */
  protected async prepare(context: RenderContext, queue: RenderQueue): Promise<void> {
    // 默认实现为空，子类可以重写
  }

  /**
   * 执行渲染通道
   */
  protected async executePasses(context: RenderContext, queue: RenderQueue): Promise<void> {
    for (const pass of this.passes) {
      if (pass.isEnabled()) {
        await pass.execute(context, queue);

        // 累积统计信息
        const passStats = pass.getStats();
        this.stats.drawCalls += passStats.drawCalls;
        this.stats.stateChanges += passStats.stateChanges;
        this.stats.textureBindings += passStats.textureBindings;
        this.stats.bufferBindings += passStats.bufferBindings;
      }
    }
  }

  /**
   * 完成渲染（可选重写）
   * 在执行渲染通道之后的清理工作
   */
  protected async finalize(context: RenderContext, queue: RenderQueue): Promise<void> {
    // 默认实现为空，子类可以重写
  }

  /**
   * 重置统计信息
   */
  protected resetStats(): void {
    this.stats.executionTime = 0;
    this.stats.passCount = 0;
    this.stats.drawCalls = 0;
    this.stats.stateChanges = 0;
    this.stats.textureBindings = 0;
    this.stats.bufferBindings = 0;
  }

  /**
   * 更新统计信息
   */
  protected updateStats(stats: Partial<RenderPipelineStats>): void {
    Object.assign(this.stats, stats);
  }

  /**
   * 检查功能支持
   */
  protected checkFeatureSupport(feature: string): boolean {
    if (!this.renderer) {
      return false;
    }

    const device = this.renderer.device;
    const deviceInfo = device.info;

    // 根据设备信息检查功能支持
    switch (feature) {
      case 'msaa':
        return deviceInfo.supportsMSAA;
      case 'anisotropy':
        return deviceInfo.supportsAnisotropy;
      case 'hdr':
        return !!(deviceInfo.features & 0x01); // 假设HDR是第一个特性位
      case 'shadows':
        return true; // 基础阴影支持
      default:
        return false;
    }
  }

  /**
   * 获取设备限制
   */
  protected getDeviceLimits() {
    if (!this.renderer) {
      return null;
    }

    const deviceInfo = this.renderer.device.info;
    return {
      maxTextureSize: deviceInfo.maxTextureSize,
      maxSampleCount: deviceInfo.maxSampleCount,
      maxBindings: deviceInfo.maxBindings,
    };
  }
}
