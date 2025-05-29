/**
 * Renderer.ts
 * 渲染器主类 - 渲染系统的核心控制器
 *
 * 遵循RHI硬件层优先原则，使用RHI抽象层进行渲染操作
 * 遵循规范包优先原则，支持规范包定义的几何体和材质接口
 */

import type { IRHIDevice } from '../interface/rhi/device';
import type { IRHITexture, IRHITextureView } from '../interface/rhi/resources/texture';
import type { Camera } from '../camera/camera';
import type { Scene } from '../scene/scene';
import type { RenderPipeline } from './render-pipeline';
import { RenderQueue } from './render-queue';
import { RenderContext } from './render-context';
import { MeshRenderer } from '../components/mesh-renderer';
import { EventDispatcher } from '../base';

/**
 * 渲染器配置选项
 */
export interface RendererOptions {
  /**
   * 画布元素
   */
  canvas: HTMLCanvasElement;

  /**
   * 渲染设备
   */
  device: IRHIDevice;

  /**
   * 是否启用深度测试
   */
  enableDepthTest?: boolean;

  /**
   * 是否启用模板测试
   */
  enableStencilTest?: boolean;

  /**
   * 多重采样抗锯齿级别
   */
  msaaLevel?: number;

  /**
   * 是否启用HDR
   */
  enableHDR?: boolean;

  /**
   * 是否启用伽马校正
   */
  enableGammaCorrection?: boolean;

  /**
   * 渲染分辨率缩放
   */
  resolutionScale?: number;

  /**
   * 最大光源数量
   */
  maxLights?: number;

  /**
   * 是否启用阴影
   */
  enableShadows?: boolean;

  /**
   * 阴影贴图分辨率
   */
  shadowMapSize?: number;
}

/**
 * 渲染统计信息
 */
export interface RenderStats {
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
   * 渲染的对象数量
   */
  objects: number;

  /**
   * 渲染时间 (毫秒)
   */
  renderTime: number;

  /**
   * GPU内存使用量 (字节)
   */
  gpuMemoryUsage: number;

  /**
   * 纹理内存使用量 (字节)
   */
  textureMemoryUsage: number;

  /**
   * 缓冲区内存使用量 (字节)
   */
  bufferMemoryUsage: number;
}

/**
 * 渲染器事件
 */
export interface RendererEvents {
  /**
   * 渲染开始前
   */
  beforeRender: { renderer: Renderer; camera: Camera; scene: Scene };

  /**
   * 渲染完成后
   */
  afterRender: { renderer: Renderer; camera: Camera; scene: Scene; stats: RenderStats };

  /**
   * 渲染错误
   */
  renderError: { error: Error; renderer: Renderer };

  /**
   * 设备丢失
   */
  deviceLost: { renderer: Renderer };

  /**
   * 设备恢复
   */
  deviceRestored: { renderer: Renderer };

  /**
   * 画布大小改变
   */
  resize: { width: number; height: number; renderer: Renderer };
}

/**
 * 渲染器主类
 *
 * 负责管理整个渲染流程，包括：
 * - 渲染管线管理
 * - 渲染队列调度
 * - 资源管理
 * - 性能统计
 */
export class Renderer extends EventDispatcher {
  /**
   * 渲染设备
   */
  readonly device: IRHIDevice;

  /**
   * 画布元素
   */
  readonly canvas: HTMLCanvasElement;

  /**
   * 渲染配置
   */
  readonly options: Required<RendererOptions>;

  /**
   * 当前渲染管线
   */
  private currentPipeline: RenderPipeline | null = null;

  /**
   * 渲染队列
   */
  private renderQueue: RenderQueue;

  /**
   * 渲染上下文
   */
  private renderContext: RenderContext;

  /**
   * 颜色纹理
   */
  private colorTexture: IRHITexture | null = null;

  /**
   * 深度纹理
   */
  private depthTexture: IRHITexture | null = null;

  /**
   * 颜色纹理视图
   */
  private colorTextureView: IRHITextureView | null = null;

  /**
   * 深度纹理视图
   */
  private depthTextureView: IRHITextureView | null = null;

  /**
   * 当前画布尺寸
   */
  private canvasSize = { width: 0, height: 0 };

  /**
   * 渲染统计信息
   */
  private stats: RenderStats = {
    drawCalls: 0,
    triangles: 0,
    vertices: 0,
    objects: 0,
    renderTime: 0,
    gpuMemoryUsage: 0,
    textureMemoryUsage: 0,
    bufferMemoryUsage: 0,
  };

  /**
   * 是否已初始化
   */
  private initialized = false;

  /**
   * 是否正在渲染
   */
  private rendering = false;

  /**
   * 构造函数
   */
  constructor(options: RendererOptions) {
    super();

    this.device = options.device;
    this.canvas = options.canvas;

    // 设置默认配置
    this.options = {
      canvas: options.canvas,
      device: options.device,
      enableDepthTest: options.enableDepthTest ?? true,
      enableStencilTest: options.enableStencilTest ?? false,
      msaaLevel: options.msaaLevel ?? 4,
      enableHDR: options.enableHDR ?? false,
      enableGammaCorrection: options.enableGammaCorrection ?? true,
      resolutionScale: options.resolutionScale ?? 1.0,
      maxLights: options.maxLights ?? 32,
      enableShadows: options.enableShadows ?? true,
      shadowMapSize: options.shadowMapSize ?? 1024,
    };

    // 创建渲染队列和上下文
    this.renderQueue = new RenderQueue();
    this.renderContext = new RenderContext(this.device, this.options);

    // 监听画布大小变化
    this.setupResizeObserver();
  }

  /**
   * 初始化渲染器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 初始化渲染上下文
      await this.renderContext.initialize();

      // 创建渲染目标
      this.updateRenderTargets();

      // 设置初始化标志
      this.initialized = true;

      // 记录初始化成功
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Renderer initialized successfully');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize renderer:', error);
      this.emit('renderError', { error: error as Error, renderer: this });
      throw error;
    }
  }

  /**
   * 设置渲染管线
   */
  setPipeline(pipeline: RenderPipeline): void {
    this.currentPipeline = pipeline;
    pipeline.setRenderer(this);
  }

  /**
   * 获取当前渲染管线
   */
  getPipeline(): RenderPipeline | null {
    return this.currentPipeline;
  }

  /**
   * 渲染场景
   */
  async render(camera: Camera, scene: Scene): Promise<void> {
    if (!this.initialized) {
      throw new Error('Renderer not initialized');
    }

    if (this.rendering) {
      console.warn('Renderer is already rendering, skipping frame');
      return;
    }

    if (!this.currentPipeline) {
      throw new Error('No render pipeline set');
    }

    this.rendering = true;
    const startTime = performance.now();

    try {
      // 重置统计信息
      this.resetStats();

      // 触发渲染开始事件
      this.emit('beforeRender', { renderer: this, camera, scene });

      // 更新渲染上下文
      this.renderContext.update(camera, scene);

      // 构建渲染队列
      this.buildRenderQueue(scene, camera);

      // 执行渲染管线
      await this.currentPipeline.execute(this.renderContext, this.renderQueue);

      // 计算渲染时间
      this.stats.renderTime = performance.now() - startTime;

      // 触发渲染完成事件
      this.emit('afterRender', { renderer: this, camera, scene, stats: this.stats });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Render error:', error);
      this.emit('renderError', { error: error as Error, renderer: this });
      throw error;
    } finally {
      this.rendering = false;
    }
  }

  /**
   * 获取渲染统计信息
   */
  getStats(): Readonly<RenderStats> {
    return { ...this.stats };
  }

  /**
   * 获取渲染上下文
   */
  getRenderContext(): RenderContext {
    return this.renderContext;
  }

  /**
   * 获取渲染队列
   */
  getRenderQueue(): RenderQueue {
    return this.renderQueue;
  }

  /**
   * 重置渲染器大小
   */
  resize(width: number, height: number): void {
    if (this.canvasSize.width === width && this.canvasSize.height === height) {
      return;
    }

    this.canvasSize.width = width;
    this.canvasSize.height = height;

    // 更新画布大小
    this.canvas.width = width * this.options.resolutionScale;
    this.canvas.height = height * this.options.resolutionScale;

    // 重新创建渲染目标
    this.updateRenderTargets();

    // 更新渲染上下文
    this.renderContext.resize(width, height);

    // 触发大小改变事件
    this.emit('resize', { width, height, renderer: this });
  }

  /**
   * 销毁渲染器
   */
  override destroy(): void {
    // 销毁渲染目标
    this.destroyRenderTargets();

    // 销毁渲染上下文
    this.renderContext.destroy();

    // 清理渲染队列
    this.renderQueue.clear();

    // 重置状态
    this.initialized = false;
    this.rendering = false;
    this.currentPipeline = null;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Renderer destroyed');
    }
  }

  /**
   * 构建渲染队列
   */
  private buildRenderQueue(scene: Scene, camera: Camera): void {
    // 清理渲染队列
    this.renderQueue.clear();
    this.renderQueue.setCamera(camera);

    // 遍历场景中的所有游戏对象
    const gameObjects = scene.getAllGameObjects();
    for (const gameObject of gameObjects) {
      this.collectRenderElements(gameObject);
    }

    // 构建渲染队列
    this.renderQueue.build();

    if (process.env.NODE_ENV === 'development') {
      const opaqueCount = this.renderQueue.getOpaqueElements().length;
      const transparentCount = this.renderQueue.getTransparentElements().length;
      // eslint-disable-next-line no-console
      console.log(`Render queue built: ${opaqueCount} opaque, ${transparentCount} transparent objects`);
    }
  }

  /**
   * 递归收集渲染元素
   */
  private collectRenderElements(gameObject: any): void {
    // 检查GameObject是否激活
    if (!gameObject.active) {
      return;
    }

    // 尝试获取MeshRenderer组件
    const meshRenderer = gameObject.getComponent(MeshRenderer);
    if (meshRenderer && meshRenderer.canRender()) {
      const renderElement = meshRenderer.createRenderElement();
      if (renderElement) {
        this.renderQueue.addElement(renderElement);
        this.stats.objects++;
      }
    }

    // 递归处理子对象
    for (const child of gameObject.children) {
      this.collectRenderElements(child);
    }
  }

  /**
   * 重置统计信息
   */
  private resetStats(): void {
    this.stats.drawCalls = 0;
    this.stats.triangles = 0;
    this.stats.vertices = 0;
    this.stats.objects = 0;
    this.stats.renderTime = 0;
    // GPU内存统计保持累积
  }

  /**
   * 更新渲染目标
   */
  private updateRenderTargets(): void {
    // 销毁旧的渲染目标
    this.destroyRenderTargets();

    const width = this.canvas.width;
    const height = this.canvas.height;

    if (width <= 0 || height <= 0) {
      return;
    }

    // 创建颜色纹理
    this.colorTexture = this.device.createTexture({
      size: [width, height, 1],
      format: this.options.enableHDR ? 'rgba16float' : 'rgba8unorm',
      usage: 'render-attachment' | 'texture-binding',
      sampleCount: this.options.msaaLevel,
      label: 'ColorTexture',
    });

    // 创建深度纹理
    if (this.options.enableDepthTest) {
      this.depthTexture = this.device.createTexture({
        size: [width, height, 1],
        format: this.options.enableStencilTest ? 'depth24plus-stencil8' : 'depth24plus',
        usage: 'render-attachment',
        sampleCount: this.options.msaaLevel,
        label: 'DepthTexture',
      });
    }

    // 创建纹理视图
    this.colorTextureView = this.colorTexture.createView();
    if (this.depthTexture) {
      this.depthTextureView = this.depthTexture.createView();
    }
  }

  /**
   * 销毁渲染目标
   */
  private destroyRenderTargets(): void {
    if (this.colorTextureView) {
      this.colorTextureView.destroy();
      this.colorTextureView = null;
    }

    if (this.depthTextureView) {
      this.depthTextureView.destroy();
      this.depthTextureView = null;
    }

    if (this.colorTexture) {
      this.colorTexture.destroy();
      this.colorTexture = null;
    }

    if (this.depthTexture) {
      this.depthTexture.destroy();
      this.depthTexture = null;
    }
  }

  /**
   * 设置画布大小监听器
   */
  private setupResizeObserver(): void {
    // 使用ResizeObserver监听画布大小变化
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          this.resize(width, height);
        }
      });

      resizeObserver.observe(this.canvas);
    } else {
      // 降级到window resize事件
      const handleResize = () => {
        const rect = this.canvas.getBoundingClientRect();
        this.resize(rect.width, rect.height);
      };

      window.addEventListener('resize', handleResize);
    }
  }

  /**
   * 更新统计信息
   */
  updateStats(stats: Partial<RenderStats>): void {
    Object.assign(this.stats, stats);
  }

  /**
   * 获取颜色纹理视图
   */
  getColorTextureView(): IRHITextureView | null {
    return this.colorTextureView;
  }

  /**
   * 获取深度纹理视图
   */
  getDepthTextureView(): IRHITextureView | null {
    return this.depthTextureView;
  }
}
