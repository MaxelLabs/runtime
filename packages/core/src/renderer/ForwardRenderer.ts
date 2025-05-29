/**
 * ForwardRenderer.ts
 * 前向渲染管线
 *
 * 实现基础的前向渲染流程，适用于大多数场景
 * 支持多光源、透明度、阴影等功能
 */

import { RenderPipeline, type RenderPipelineConfig } from './RenderPipeline';
import type { RenderContext } from './RenderContext';
import type { RenderQueue } from './RenderQueue';
import { SortStrategy } from './RenderQueue';
import { ShadowPass, DepthPrepass, SkyboxPass, OpaquePass, TransparentPass, PostProcessPass } from './passes';

/**
 * 前向渲染器配置
 */
export interface ForwardRendererConfig extends RenderPipelineConfig {
  /**
   * 是否启用深度预通道
   */
  enableDepthPrepass?: boolean;

  /**
   * 是否启用透明度排序
   */
  enableTransparencySort?: boolean;

  /**
   * 是否启用天空盒渲染
   */
  enableSkybox?: boolean;

  /**
   * 是否启用后处理
   */
  enablePostProcessing?: boolean;

  /**
   * 是否启用抗锯齿
   */
  enableAntiAliasing?: boolean;

  /**
   * 抗锯齿类型
   */
  antiAliasingType?: 'msaa' | 'fxaa' | 'taa';
}

/**
 * 前向渲染管线
 *
 * 前向渲染是最直接的渲染方式，对每个像素计算所有光源的贡献
 * 适用于：
 * - 移动设备
 * - 透明物体较多的场景
 * - 光源数量较少的场景
 */
export class ForwardRenderer extends RenderPipeline {
  /**
   * 前向渲染配置
   */
  declare readonly config: Required<ForwardRendererConfig>;

  /**
   * 深度预通道
   */
  private depthPrepass: DepthPrepass | null = null;

  /**
   * 阴影通道
   */
  private shadowPass: ShadowPass | null = null;

  /**
   * 天空盒通道
   */
  private skyboxPass: SkyboxPass | null = null;

  /**
   * 不透明物体通道
   */
  private opaquePass: OpaquePass | null = null;

  /**
   * 透明物体通道
   */
  private transparentPass: TransparentPass | null = null;

  /**
   * 后处理通道
   */
  private postProcessPass: PostProcessPass | null = null;

  /**
   * 构造函数
   */
  constructor(config: ForwardRendererConfig) {
    // 设置默认配置
    const defaultConfig: Required<ForwardRendererConfig> = {
      ...config,
      enableDepthTest: config.enableDepthTest ?? true,
      enableStencilTest: config.enableStencilTest ?? false,
      enableMSAA: config.enableMSAA ?? true,
      enableHDR: config.enableHDR ?? false,
      enableGammaCorrection: config.enableGammaCorrection ?? true,
      maxLights: config.maxLights ?? 32,
      enableShadows: config.enableShadows ?? true,
      shadowQuality: config.shadowQuality ?? 'medium',
      postProcessEffects: config.postProcessEffects ?? [],
      enableDepthPrepass: config.enableDepthPrepass ?? false,
      enableTransparencySort: config.enableTransparencySort ?? true,
      enableSkybox: config.enableSkybox ?? true,
      enablePostProcessing: config.enablePostProcessing ?? true,
      enableAntiAliasing: config.enableAntiAliasing ?? true,
      antiAliasingType: config.antiAliasingType ?? 'msaa',
    };

    super(defaultConfig);
  }

  /**
   * 初始化渲染通道
   */
  protected async initializePasses(): Promise<void> {
    if (!this.renderer) {
      throw new Error('Renderer not set');
    }

    try {
      // 创建阴影通道
      if (this.config.enableShadows) {
        await this.createShadowPass();
      }

      // 创建深度预通道
      if (this.config.enableDepthPrepass) {
        await this.createDepthPrepass();
      }

      // 创建天空盒通道
      if (this.config.enableSkybox) {
        await this.createSkyboxPass();
      }

      // 创建不透明物体通道
      await this.createOpaquePass();

      // 创建透明物体通道
      await this.createTransparentPass();

      // 创建后处理通道
      if (this.config.enablePostProcessing) {
        await this.createPostProcessPass();
      }

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`ForwardRenderer passes initialized: ${this.passes.length} passes`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize ForwardRenderer passes:', error);
      throw error;
    }
  }

  /**
   * 准备渲染
   */
  protected override async prepare(context: RenderContext, queue: RenderQueue): Promise<void> {
    // 设置渲染队列的排序策略
    queue.updateConfig({
      opaqueSortStrategy: SortStrategy.FrontToBack, // 不透明物体前到后排序，减少overdraw
      transparentSortStrategy: this.config.enableTransparencySort ? SortStrategy.BackToFront : SortStrategy.None,
      enableBatching: true,
      enableInstancing: true,
    });

    // 构建渲染队列
    queue.build();

    // 更新渲染上下文
    const camera = context.getCamera();
    if (camera) {
      queue.setCamera(camera);
    }
  }

  /**
   * 完成渲染
   */
  override async finalize(context: RenderContext, queue: RenderQueue): Promise<void> {
    // 提交命令缓冲区
    const encoder = context.getCommandEncoder();
    if (encoder) {
      const commandBuffer = encoder.finish({
        label: 'ForwardRenderer_CommandBuffer',
      });

      this.renderer!.device.submit([commandBuffer]);
    }

    // 清理临时资源
    context.clearTemporaryResources();
  }

  /**
   * 创建阴影通道
   */
  private async createShadowPass(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating shadow pass...');
    }

    this.shadowPass = new ShadowPass({
      name: 'ShadowPass',
      shadowQuality: this.config.shadowQuality,
      enableSoftShadows: true,
    });

    await this.shadowPass.initialize(this.createRenderContext());
    this.addPass(this.shadowPass);
  }

  /**
   * 创建深度预通道
   */
  private async createDepthPrepass(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating depth prepass...');
    }

    this.depthPrepass = new DepthPrepass({
      name: 'DepthPrepass',
      enableEarlyZ: true,
      includeTransparent: false,
    });

    await this.depthPrepass.initialize(this.createRenderContext());
    this.addPass(this.depthPrepass);
  }

  /**
   * 创建天空盒通道
   */
  private async createSkyboxPass(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating skybox pass...');
    }

    this.skyboxPass = new SkyboxPass({
      name: 'SkyboxPass',
      skyboxType: 'cubemap',
      depthTest: 'less-equal',
      depthWrite: false,
    });

    await this.skyboxPass.initialize(this.createRenderContext());
    this.addPass(this.skyboxPass);
  }

  /**
   * 创建不透明物体通道
   */
  private async createOpaquePass(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating opaque pass...');
    }

    this.opaquePass = new OpaquePass({
      name: 'OpaquePass',
      enableLighting: true,
      enableShadows: this.config.enableShadows,
      maxLights: this.config.maxLights,
      depthTest: 'less',
      depthWrite: true,
    });

    await this.opaquePass.initialize(this.createRenderContext());
    this.addPass(this.opaquePass);
  }

  /**
   * 创建透明物体通道
   */
  private async createTransparentPass(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating transparent pass...');
    }

    this.transparentPass = new TransparentPass({
      name: 'TransparentPass',
      enableLighting: true,
      enableShadows: this.config.enableShadows,
      depthTest: 'less',
      depthWrite: false,
      blendMode: 'alpha',
      enableDepthSort: this.config.enableTransparencySort,
    });

    await this.transparentPass.initialize(this.createRenderContext());
    this.addPass(this.transparentPass);
  }

  /**
   * 创建后处理通道
   */
  private async createPostProcessPass(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating post-process pass...');
    }

    const effects = ['tonemapping', 'gamma-correction'];
    if (this.config.enableAntiAliasing) {
      effects.push(this.config.antiAliasingType);
    }

    this.postProcessPass = new PostProcessPass({
      name: 'PostProcessPass',
      effects: effects as any,
      enableGammaCorrection: this.config.enableGammaCorrection,
      enableAntiAliasing: this.config.enableAntiAliasing,
      antiAliasingType: this.config.antiAliasingType,
    });

    await this.postProcessPass.initialize(this.createRenderContext());
    this.addPass(this.postProcessPass);
  }

  /**
   * 创建渲染上下文（临时方法）
   */
  private createRenderContext(): RenderContext {
    // TODO: 这里应该返回实际的渲染上下文
    // 目前返回一个空对象作为占位符
    return {} as RenderContext;
  }

  /**
   * 获取渲染统计信息
   */
  getDetailedStats() {
    const baseStats = this.getStats();

    return {
      ...baseStats,
      passes: {
        shadow: this.shadowPass?.getStats() || null,
        depthPrepass: this.depthPrepass?.getStats() || null,
        skybox: this.skyboxPass?.getStats() || null,
        opaque: this.opaquePass?.getStats() || null,
        transparent: this.transparentPass?.getStats() || null,
        postProcess: this.postProcessPass?.getStats() || null,
      },
      features: {
        enableDepthPrepass: this.config.enableDepthPrepass,
        enableShadows: this.config.enableShadows,
        enableSkybox: this.config.enableSkybox,
        enablePostProcessing: this.config.enablePostProcessing,
        enableAntiAliasing: this.config.enableAntiAliasing,
        antiAliasingType: this.config.antiAliasingType,
      },
    };
  }

  /**
   * 动态启用/禁用功能
   */
  setFeatureEnabled(feature: string, enabled: boolean): void {
    switch (feature) {
      case 'shadows':
        if (this.shadowPass) {
          this.shadowPass.setEnabled(enabled);
        }
        break;

      case 'skybox':
        if (this.skyboxPass) {
          this.skyboxPass.setEnabled(enabled);
        }
        break;

      case 'postProcessing':
        if (this.postProcessPass) {
          this.postProcessPass.setEnabled(enabled);
        }
        break;

      case 'depthPrepass':
        if (this.depthPrepass) {
          this.depthPrepass.setEnabled(enabled);
        }
        break;

      default:
        console.warn(`Unknown feature: ${feature}`);
    }
  }

  /**
   * 检查功能是否启用
   */
  isFeatureEnabled(feature: string): boolean {
    switch (feature) {
      case 'shadows':
        return this.shadowPass?.isEnabled() ?? false;

      case 'skybox':
        return this.skyboxPass?.isEnabled() ?? false;

      case 'postProcessing':
        return this.postProcessPass?.isEnabled() ?? false;

      case 'depthPrepass':
        return this.depthPrepass?.isEnabled() ?? false;

      default:
        return false;
    }
  }

  /**
   * 获取特定通道
   */
  getShadowPass(): ShadowPass | null {
    return this.shadowPass;
  }

  getDepthPrepass(): DepthPrepass | null {
    return this.depthPrepass;
  }

  getSkyboxPass(): SkyboxPass | null {
    return this.skyboxPass;
  }

  getOpaquePass(): OpaquePass | null {
    return this.opaquePass;
  }

  getTransparentPass(): TransparentPass | null {
    return this.transparentPass;
  }

  getPostProcessPass(): PostProcessPass | null {
    return this.postProcessPass;
  }

  /**
   * 销毁资源
   */
  override async destroy(): Promise<void> {
    // 销毁所有通道
    if (this.shadowPass) {
      await this.shadowPass.destroy();
      this.shadowPass = null;
    }

    if (this.depthPrepass) {
      await this.depthPrepass.destroy();
      this.depthPrepass = null;
    }

    if (this.skyboxPass) {
      await this.skyboxPass.destroy();
      this.skyboxPass = null;
    }

    if (this.opaquePass) {
      await this.opaquePass.destroy();
      this.opaquePass = null;
    }

    if (this.transparentPass) {
      await this.transparentPass.destroy();
      this.transparentPass = null;
    }

    if (this.postProcessPass) {
      await this.postProcessPass.destroy();
      this.postProcessPass = null;
    }

    await super.destroy();
  }
}
