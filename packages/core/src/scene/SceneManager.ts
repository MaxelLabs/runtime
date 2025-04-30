import type { Engine } from '../Engine';
import { Scene } from './Scene';

/**
 * 场景管理器，负责管理多个场景的创建、激活和销毁
 */
export class SceneManager {
  /** 引擎实例 */
  private _engine: Engine;
  /** 场景列表 */
  private _scenes: Scene[] = [];
  /** 活动场景列表 */
  private _activeScenes: Scene[] = [];
  /** 当前主场景 */
  private _mainScene: Scene | null = null;

  /**
   * 创建场景管理器
   * @param engine 引擎实例
   */
  constructor(engine: Engine) {
    this._engine = engine;
  }

  /**
   * 获取所有场景
   */
  get scenes(): readonly Scene[] {
    return this._scenes;
  }

  /**
   * 获取所有活动场景
   */
  get activeScenes(): readonly Scene[] {
    return this._activeScenes;
  }

  /**
   * 获取当前主场景
   */
  get mainScene(): Scene | null {
    return this._mainScene;
  }

  /**
   * 设置当前主场景
   */
  set mainScene(scene: Scene | null) {
    // 如果场景不在当前管理的场景列表中，则添加
    if (scene && !this._scenes.includes(scene)) {
      this.addScene(scene);
    }

    this._mainScene = scene;

    // 如果设置了主场景，则确保它是活动的
    if (scene && !scene.isActive) {
      scene.isActive = true;
    }
  }

  /**
   * 创建新场景
   * @param name 场景名称
   * @returns 创建的场景
   */
  createScene(name?: string): Scene {
    const scene = new Scene(this._engine, name);
    this.addScene(scene);
    return scene;
  }

  /**
   * 添加场景
   * @param scene 要添加的场景
   */
  addScene(scene: Scene): void {
    if (this._scenes.includes(scene)) {
      return;
    }

    this._scenes.push(scene);
    
    // 如果场景是活动的，添加到活动场景列表
    if (scene.isActive) {
      this._activeScenes.push(scene);
    }

    // 如果没有主场景，将此场景设为主场景
    if (!this._mainScene) {
      this._mainScene = scene;
    }
  }

  /**
   * 移除场景
   * @param scene 要移除的场景
   */
  removeScene(scene: Scene): void {
    const index = this._scenes.indexOf(scene);
    if (index !== -1) {
      this._scenes.splice(index, 1);
      
      // 从活动场景列表中移除
      const activeIndex = this._activeScenes.indexOf(scene);
      if (activeIndex !== -1) {
        this._activeScenes.splice(activeIndex, 1);
      }

      // 如果移除的是主场景，则重置主场景
      if (this._mainScene === scene) {
        this._mainScene = this._scenes.length > 0 ? this._scenes[0] : null;
      }
    }
  }

  /**
   * 根据名称查找场景
   * @param name 场景名称
   * @returns 找到的场景，如果不存在则返回null
   */
  findSceneByName(name: string): Scene | null {
    for (const scene of this._scenes) {
      if (scene.name === name) {
        return scene;
      }
    }
    return null;
  }

  /**
   * 更新所有活动场景
   * @param deltaTime 时间增量（秒）
   */
  update(deltaTime: number): void {
    for (const scene of this._activeScenes) {
      scene.update(deltaTime);
    }
  }

  /**
   * 处理场景激活状态变化
   * @param scene 场景
   * @param active 是否激活
   */
  _processSceneActiveChange(scene: Scene, active: boolean): void {
    const index = this._activeScenes.indexOf(scene);
    
    if (active) {
      // 如果场景激活且不在活动列表中，则添加
      if (index === -1) {
        this._activeScenes.push(scene);
      }
    } else {
      // 如果场景停用且在活动列表中，则移除
      if (index !== -1) {
        this._activeScenes.splice(index, 1);
      }
    }
  }

  /**
   * 销毁场景管理器
   */
  destroy(): void {
    // 销毁所有管理的场景
    for (const scene of this._scenes) {
      scene.destroy();
    }

    this._scenes = [];
    this._activeScenes = [];
    this._mainScene = null;
  }
} 