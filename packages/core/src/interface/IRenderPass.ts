import type { Scene } from '../scene/scene';
import type { Camera } from '../camera/camera';
import type { IGraphicsDevice, IRenderPassEncoder } from './IGraphicsDevice';
import type { RenderTargetInfo, RenderPassDescriptor, ITextureView } from './rhi';

/**
 * 渲染通道配置选项，用于在创建或执行时指定行为。
 */
export interface RenderPassExecutionOptions {
  /**
   * 覆盖此通道的默认渲染目标信息。
   * 如果提供，通道将渲染到这些指定的视图。
   */
  overrideRenderTarget?: {
    colorViews: (ITextureView | null)[];
    depthStencilView?: ITextureView | null;
  };

  /**
   * 自定义 RenderPassDescriptor 的属性，例如清除值、加载/存储操作。
   * 这将与从 renderTarget 或 overrideRenderTarget 派生的描述符合并。
   */
  customPassDescriptor?: Partial<RenderPassDescriptor>;
}

/**
 * 渲染通道接口 - 定义渲染通道流程
 */
export interface IRenderPass {
  /**
   * 渲染通道名称
   */
  name: string,

  /**
   * 渲染通道是否启用
   */
  enabled: boolean,

  /**
   * 渲染通道优先级（决定执行顺序）
   */
  priority: number,

  /**
   * 渲染目标
   */
  renderTarget: IRenderTarget | null,

  /**
   * 准备渲染通道
   * @param scene - 场景
   * @param camera - 相机
   */
  prepare(scene: Scene, camera: Camera): void,

  /**
   * 执行渲染通道
   * @param scene - 场景
   * @param camera - 相机
   */
  execute(scene: Scene, camera: Camera): void,

  /**
   * 渲染通道后处理
   */
  postProcess(): void,

  /**
   * 设置渲染目标
   * @param renderTarget - 渲染目标
   */
  setRenderTarget(renderTarget: IRenderTarget | null): void,

  /**
   * 销毁渲染通道
   */
  destroy(): void,
}