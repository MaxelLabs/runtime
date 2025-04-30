import { RenderPipeline } from './RenderPipeline';
import { OpaqueRenderPass } from './passes/OpaqueRenderPass';
import { TransparentRenderPass } from './passes/TransparentRenderPass';
import { ShadowRenderPass } from './passes/ShadowRenderPass';
import { UIRenderPass } from './passes/UIRenderPass';
import { RenderPassType } from './RenderPass';
import type { Engine } from '../Engine';
import type { Scene } from '../scene/Scene';
import type { Camera } from '../camera/Camera';

/**
 * 前向渲染管线配置
 */
export interface ForwardRenderPipelineOptions {
  /** 是否启用阴影 */
  enableShadow?: boolean;
  /** 是否启用后处理 */
  enablePostProcess?: boolean;
  /** 是否启用HDR */
  enableHDR?: boolean;
}

/**
 * 前向渲染管线，实现了基本的前向渲染流程
 */
export class ForwardRenderPipeline extends RenderPipeline {
  /** 不透明物体渲染通道 */
  private _opaquePass: OpaqueRenderPass;
  /** 透明物体渲染通道 */
  private _transparentPass: TransparentRenderPass;
  /** 阴影渲染通道 */
  private _shadowPass: ShadowRenderPass;
  /** UI渲染通道 */
  private _uiPass: UIRenderPass;
  /** 是否启用阴影 */
  private _enableShadow: boolean;

  /**
   * 创建前向渲染管线
   * @param engine 引擎实例
   * @param options 配置选项
   */
  constructor(engine: Engine, options: ForwardRenderPipelineOptions = {}) {
    super(engine);
    
    this._enableShadow = options.enableShadow ?? false;
    
    // 创建各种渲染通道
    this._createRenderPasses();
  }

  /**
   * 创建渲染通道
   */
  private _createRenderPasses(): void {
    // 创建阴影渲染通道
    if (this._enableShadow) {
      this._shadowPass = new ShadowRenderPass("ShadowPass", 0);
      this.addRenderPass(this._shadowPass);
    }

    // 创建不透明物体渲染通道
    this._opaquePass = new OpaqueRenderPass("OpaquePass", 100);
    this.addRenderPass(this._opaquePass);
    
    // 创建透明物体渲染通道
    this._transparentPass = new TransparentRenderPass("TransparentPass", 200);
    this.addRenderPass(this._transparentPass);
    
    // 创建UI渲染通道
    this._uiPass = new UIRenderPass("UIPass", 300);
    this.addRenderPass(this._uiPass);
  }

  /**
   * 预渲染
   * @param scene 场景
   * @param camera 摄像机
   */
  protected override preRender(scene: Scene, camera: Camera): void {
    // 设置渲染上下文的阴影标志
    this.renderContext.enableShadow = this._enableShadow && scene.castShadows;
    
    // 如果场景中没有主光源，则关闭阴影
    if (this.renderContext.enableShadow && !scene.mainLight) {
      this.renderContext.enableShadow = false;
    }
    
    // 如果启用了阴影，则启用阴影通道
    if (this._shadowPass) {
      this._shadowPass.enabled = this.renderContext.enableShadow;
    }
  }

  /**
   * 设置是否启用阴影
   * @param enable 是否启用
   */
  setEnableShadow(enable: boolean): void {
    if (this._enableShadow !== enable) {
      this._enableShadow = enable;
      
      // 如果切换到启用状态，但还没有创建阴影通道，则创建
      if (enable && !this._shadowPass) {
        this._shadowPass = new ShadowRenderPass("ShadowPass", 0);
        this.addRenderPass(this._shadowPass);
      }
      
      // 如果切换到禁用状态，但有阴影通道，则禁用
      if (!enable && this._shadowPass) {
        this._shadowPass.enabled = false;
      }
    }
  }
  
  /**
   * 获取是否启用阴影
   */
  getEnableShadow(): boolean {
    return this._enableShadow;
  }
  
  /**
   * 销毁
   */
  override destroy(): void {
    super.destroy();
    this._opaquePass = null;
    this._transparentPass = null;
    this._shadowPass = null;
    this._uiPass = null;
  }
} 