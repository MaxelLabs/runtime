import type { Engine } from '../engine-ob';
import type { Scene } from '../scene/Scene';
import type { Camera } from '../camera/Camera';
import type { RenderContext } from './RenderContext';
import type { RenderPass } from './RenderPass';

/**
 * 渲染管线基类，定义了渲染流程的基本结构
 */
export abstract class RenderPipeline {
  /** 引擎实例 */
  protected engine: Engine;
  /** 渲染上下文 */
  protected renderContext: RenderContext;
  /** 渲染通道列表 */
  protected renderPasses: RenderPass[] = [];
  /** 是否启用 */
  protected _enabled: boolean = true;

  /**
   * 创建渲染管线
   * @param engine 引擎实例
   */
  constructor(engine: Engine) {
    this.engine = engine;
    this.renderContext = engine._renderContext;
  }

  /**
   * 获取是否启用
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * 设置是否启用
   */
  set enabled(value: boolean) {
    this._enabled = value;
  }

  /**
   * 添加渲染通道
   * @param pass 渲染通道
   */
  addRenderPass(pass: RenderPass): void {
    if (!this.renderPasses.includes(pass)) {
      this.renderPasses.push(pass);
      // 按优先级排序
      this.renderPasses.sort((a, b) => a.priority - b.priority);
    }
  }

  /**
   * 移除渲染通道
   * @param pass 渲染通道
   */
  removeRenderPass(pass: RenderPass): void {
    const index = this.renderPasses.indexOf(pass);

    if (index !== -1) {
      this.renderPasses.splice(index, 1);
    }
  }

  /**
   * 渲染一个场景的摄像机视图
   * @param scene 场景
   * @param camera 摄像机
   */
  render(scene: Scene, camera: Camera): void {
    if (!this._enabled) {
      return;
    }

    // 准备渲染上下文
    this.prepareContext(scene, camera);

    // 执行渲染前操作
    this.preRender(scene, camera);

    // 执行所有渲染通道
    for (const pass of this.renderPasses) {
      if (pass.enabled) {
        pass.render(this.renderContext);
      }
    }

    // 执行渲染后操作
    this.postRender(scene, camera);
  }

  /**
   * 准备渲染上下文
   * @param scene 场景
   * @param camera 摄像机
   */
  protected prepareContext(scene: Scene, camera: Camera): void {
    this.renderContext.reset();
    this.renderContext.setScene(scene);
    this.renderContext.setCamera(camera);

    // 合并全局着色器宏
    this.renderContext.mergeMacros(this.engine._globalShaderMacro);
    // 合并场景着色器宏
    if (scene._globalShaderMacro) {
      this.renderContext.mergeMacros(scene._globalShaderMacro);
    }
    // 合并相机着色器宏
    if (camera._globalShaderMacro) {
      this.renderContext.mergeMacros(camera._globalShaderMacro);
    }
  }

  /**
   * 渲染前操作，子类可重写
   * @param scene 场景
   * @param camera 摄像机
   */
  protected preRender(scene: Scene, camera: Camera): void {
    // 空实现，子类可重写
  }

  /**
   * 渲染后操作，子类可重写
   * @param scene 场景
   * @param camera 摄像机
   */
  protected postRender(scene: Scene, camera: Camera): void {
    // 空实现，子类可重写
  }

  /**
   * 重置渲染管线，子类可重写
   */
  reset(): void {
    // 空实现，子类可重写
  }

  /**
   * 调整大小
   * @param width 宽度
   * @param height 高度
   */
  resize(width: number, height: number): void {
    // 通知所有渲染通道大小变化
    for (const pass of this.renderPasses) {
      pass.resize(width, height);
    }
  }

  /**
   * 销毁渲染管线
   */
  destroy(): void {
    // 销毁所有渲染通道
    for (const pass of this.renderPasses) {
      pass.destroy();
    }
    this.renderPasses = [];
  }
}
