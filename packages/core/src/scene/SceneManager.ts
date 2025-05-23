import { EventDispatcher } from '../base/event-dispatcher';
import { Container, ServiceKeys } from '../base/IOC';
import { Scene } from './Scene';
import { ObjectPool } from '../base/object-pool';

/**
 * 场景管理器事件类型
 */
export enum SceneManagerEvent {
  /** 场景创建 */
  SCENE_CREATED = 'sceneCreated',
  /** 场景加载 */
  SCENE_LOADED = 'sceneLoaded',
  /** 场景卸载 */
  SCENE_UNLOADED = 'sceneUnloaded',
  /** 场景销毁 */
  SCENE_DESTROYED = 'sceneDestroyed',
  /** 活动场景变更 */
  ACTIVE_SCENE_CHANGED = 'activeSceneChanged',
}

/**
 * 场景管理器
 * 负责创建、加载和管理场景
 */
export class SceneManager extends EventDispatcher {
  /** 场景列表 */
  private scenes: Map<string, Scene> = new Map();
  /** 当前活动场景 */
  private activeScene: Scene | null = null;
  /** IOC容器 */
  private container: Container;
  /** 数组对象池 - 用于返回场景列表 */
  private static readonly sceneArrayPool = new ObjectPool<Scene[]>(
    'sceneManagerArrayPool',
    () => [],
    (array) => (array.length = 0),
    2,
    10
  );

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
    if (this.getSceneByName(sceneName)) {
      console.warn(`场景名称 '${sceneName}' 已存在。创建使用唯一名称.`);

      return this.createScene(`${sceneName}_${Date.now()}`);
    }

    // 创建新场景
    const scene = new Scene(sceneName);

    // 添加到场景列表
    this.scenes.set(scene.id, scene);

    // 派发场景创建事件
    this.dispatchEvent(SceneManagerEvent.SCENE_CREATED, { scene });

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
        console.error(`未找到ID为 '${scene}' 的场景`);

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
    // 如果尝试设置当前已经是活动场景的场景，直接返回
    if (this.activeScene === scene) {
      return;
    }

    const previousScene = this.activeScene;

    // 如果当前已有活动场景，先卸载
    if (previousScene) {
      previousScene.onUnload();

      // 派发场景卸载事件
      this.dispatchEvent(SceneManagerEvent.SCENE_UNLOADED, { scene: previousScene });
    }

    this.activeScene = scene;

    // 如果有新场景，加载它
    if (scene) {
      scene.onLoad();

      // 派发场景加载事件
      this.dispatchEvent(SceneManagerEvent.SCENE_LOADED, { scene });
    }

    // 派发活动场景变更事件
    this.dispatchEvent(SceneManagerEvent.ACTIVE_SCENE_CHANGED, {
      previousScene,
      currentScene: scene,
    });
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
   * 获取场景通过名称
   * @param name 场景名称
   * @returns 找到的第一个匹配场景或null
   */
  getSceneByName(name: string): Scene | null {
    for (const scene of this.scenes.values()) {
      if (scene.name === name) {
        return scene;
      }
    }

    return null;
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
        console.error(`未找到ID为 '${scene}' 的场景`);

        return false;
      }
    } else {
      targetScene = scene;
    }

    // 如果要销毁的是当前活动场景，先卸载
    if (this.activeScene === targetScene) {
      this.setActiveScene(null);
    }

    // 派发场景销毁前事件
    this.dispatchEvent(SceneManagerEvent.SCENE_DESTROYED, {
      scene: targetScene,
      state: 'before',
    });

    // 销毁场景
    targetScene.destroy();

    // 从场景列表中移除
    const result = this.scenes.delete(targetScene.id);

    // 派发场景销毁后事件
    if (result) {
      this.dispatchEvent(SceneManagerEvent.SCENE_DESTROYED, {
        scene: targetScene,
        state: 'after',
      });
    }

    return result;
  }

  /**
   * 获取当前活动场景
   */
  getActiveScene(): Scene | null {
    return this.activeScene;
  }

  /**
   * 获取所有场景
   * @returns 场景数组（从对象池获取，使用完请释放）
   */
  getAllScenes(): Scene[] {
    const result = SceneManager.sceneArrayPool.get();

    for (const scene of this.scenes.values()) {
      result.push(scene);
    }

    return result;
  }

  /**
   * 释放场景数组回对象池
   * @param array 从getAllScenes获取的数组
   */
  releaseSceneArray(array: Scene[]): void {
    SceneManager.sceneArrayPool.release(array);
  }

  /**
   * 获取场景数量
   */
  getSceneCount(): number {
    return this.scenes.size;
  }

  /**
   * 销毁所有场景
   */
  destroyAllScenes(): void {
    // 先卸载活动场景
    this.setActiveScene(null);

    // 复制场景ID列表以避免在迭代过程中修改集合
    const sceneIds: string[] = [];

    for (const scene of this.scenes.values()) {
      sceneIds.push(scene.id);
    }

    // 销毁所有场景
    for (const id of sceneIds) {
      this.destroyScene(id);
    }
  }

  /**
   * 销毁场景管理器
   */
  override destroy(): void {
    // 销毁所有场景
    this.destroyAllScenes();

    // 清空场景列表
    this.scenes.clear();
    this.activeScene = null;

    // 从IOC容器中移除
    this.container.remove(ServiceKeys.SCENE_MANAGER);

    super.destroy();
  }
}
