import type { RenderContext } from './RenderContext';
import type { RenderTarget } from '../texture/RenderTarget';

/**
 * 渲染通道类型枚举
 */
export enum RenderPassType {
  /** 不透明物体渲染 */
  Opaque,
  /** 透明物体渲染 */
  Transparent,
  /** 阴影渲染 */
  Shadow,
  /** 后处理 */
  PostProcess,
  /** 用户界面 */
  UI,
  /** 自定义 */
  Custom,
}

/**
 * 渲染通道基类，定义了渲染通道的基本结构
 */
export abstract class RenderPass {
  /** 通道名称 */
  name: string;
  /** 通道类型 */
  type: RenderPassType;
  /** 优先级（数值越小越先渲染） */
  priority: number = 0;
  /** 是否启用 */
  enabled: boolean = true;
  /** 渲染目标 */
  protected _renderTarget: RenderTarget | null = null;

  /**
   * 创建渲染通道
   * @param name 通道名称
   * @param type 通道类型
   * @param priority 优先级（数值越小越先渲染）
   */
  constructor(name: string, type: RenderPassType, priority: number = 0) {
    this.name = name;
    this.type = type;
    this.priority = priority;
  }

  /**
   * 获取渲染目标
   */
  get renderTarget(): RenderTarget | null {
    return this._renderTarget;
  }

  /**
   * 设置渲染目标
   */
  set renderTarget(value: RenderTarget | null) {
    this._renderTarget = value;
  }

  /**
   * 执行渲染通道
   * @param context 渲染上下文
   */
  abstract render(context: RenderContext): void;

  /**
   * 调整大小
   * @param width 宽度
   * @param height 高度
   */
  resize(width: number, height: number): void {
    // 基类默认实现，子类可重写
  }

  /**
   * 销毁渲染通道
   */
  destroy(): void {
    // 基类默认实现，子类可重写
    this._renderTarget = null;
  }
}
