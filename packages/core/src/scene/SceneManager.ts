import { MaxObject } from '../base/maxObject';
import { Container, ServiceKeys } from '../base/IOC';
import { Scene } from './Scene';

/**
 * 场景管理器
 * 负责创建、加载和管理场景
 */
export class SceneManager extends MaxObject {
  /** 场景列表 */
  private scenes: Map<string, Scene> = new Map();
  /** 当前活动场景 */
  private _activeScene: Scene | null = null;
  /** IOC容器 */
  private container: Container;

  /**
   * 创建场景管理器
   */
  constructor() {
    super();
    this.container = Container.getInstance();
    
    // 注册到IOC容器
    this.container.register(ServiceKeys.SCENE_MANAGER, this);
  }

  /**
   * 创建新场景
   * @param name 场景名称
   * @returns 新创建的场景
   */
  createScene(name?: string): Scene {
    // 生成场景名称
    const sceneName = name || `Scene_${this.scenes.size + 1}`;
    
    // 检查场景名称是否已存在
    if (this.scenes.has(sceneName)) {
      console.warn(`Scene with name '${sceneName}' already exists. Creating with a unique name.`);
      return this.createScene(`${sceneName}_${Date.now()}`);
    }
    
    // 创建新场景
    const scene = new Scene(sceneName);
    
    // 添加到场景列表
    this.scenes.set(scene.id, scene);
    
    return scene;
  }

  /**
   * 加载场景
   * @param scene 场景对象或场景ID
   * @returns 是否成功加载
   */
  loadScene(scene: Scene | string): boolean {
    let targetScene: Scene | null = null;
    
    if (typeof scene === 'string') {
      // 通过ID查找场景
      targetScene = this.scenes.get(scene) || null;
      if (!targetScene) {
        console.error(`Scene with id '${scene}' not found`);
        return false;
      }
    } else {
      targetScene = scene;
    }
    
    // 设置为活动场景
    this.setActiveScene(targetScene);
    
    return true;
  }

  /**
   * 设置活动场景
   * @param scene 要设置为活动的场景
   */
  setActiveScene(scene: Scene | null): void {
    // 如果当前已有活动场景，先卸载
    if (this._activeScene && this._activeScene !== scene) {
      this._activeScene.onUnload();
    }
    
    this._activeScene = scene;
    
    // 如果有新场景，加载它
    if (scene) {
      scene.onLoad();
    }
  }

  /**
   * 获取场景通过ID
   * @param id 场景ID
   * @returns 场景对象或null
   */
  getSceneById(id: string): Scene | null {
    return this.scenes.get(id) || null;
  }

  /**
   * 销毁场景
   * @param scene 要销毁的场景对象或ID
   * @returns 是否成功销毁
   */
  destroyScene(scene: Scene | string): boolean {
    let targetScene: Scene | null = null;
    
    if (typeof scene === 'string') {
      // 通过ID查找场景
      targetScene = this.scenes.get(scene) || null;
      if (!targetScene) {
        console.error(`Scene with id '${scene}' not found`);
        return false;
      }
    } else {
      targetScene = scene;
    }
    
    // 如果要销毁的是当前活动场景，先卸载
    if (this._activeScene === targetScene) {
      this.setActiveScene(null);
    }
    
    // 销毁场景
    targetScene.destroy();
    
    // 从场景列表中移除
    return this.scenes.delete(targetScene.id);
  }

  /**
   * 获取当前活动场景
   */
  get activeScene(): Scene | null {
    return this._activeScene;
  }

  /**
   * 获取所有场景
   */
  getAllScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }

  /**
   * 获取场景数量
   */
  get sceneCount(): number {
    return this.scenes.size;
  }

  /**
   * 销毁场景管理器
   */
  override destroy(): void {
    // 销毁所有场景
    this.scenes.forEach(scene => {
      scene.destroy();
    });
    
    // 清空场景列表
    this.scenes.clear();
    this._activeScene = null;
    
    // 从IOC容器中移除
    this.container.remove(ServiceKeys.SCENE_MANAGER);
    
    super.destroy();
  }
} 