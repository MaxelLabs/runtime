import type { Entity } from '../base/entity';
import type { Mesh } from './mesh';
import type { Camera } from '../camera/Camera';
import type { Scene } from '../scene/Scene';
import type { Material } from '../material/Material';
import type { RenderElement } from './render-element';
import type { BatcherManager } from './batcher-manager';
import { RenderQueue } from './render-queue';
import { RenderQueueType } from './renderer-type';

/**
 * 剔除结果类，用于存储和管理场景剔除后的渲染元素
 */
export class CullingResults {
  /** 不透明队列 */
  opaqueQueue: RenderQueue;
  /** Alpha测试队列 */
  alphaTestQueue: RenderQueue;
  /** 透明队列 */
  transparentQueue: RenderQueue;
  /** 已处理的实体缓存 */
  private processedEntities: Set<Entity> = new Set();

  /**
   * 创建剔除结果实例
   */
  constructor() {
    this.opaqueQueue = new RenderQueue(RenderQueueType.Opaque);
    this.alphaTestQueue = new RenderQueue(RenderQueueType.AlphaTest);
    this.transparentQueue = new RenderQueue(RenderQueueType.Transparent);
  }

  /**
   * 重置剔除结果
   */
  reset(): void {
    this.opaqueQueue.clear();
    this.alphaTestQueue.clear();
    this.transparentQueue.clear();
    this.processedEntities.clear();
  }

  /**
   * 对场景进行视锥体剔除
   * @param scene 场景
   * @param camera 摄像机
   */
  cull(scene: Scene, camera: Camera): void {
    this.reset();

    // 获取场景中的所有实体
    const entities = scene.entities;

    // 遍历所有实体进行视锥体剔除
    for (const entity of entities) {
      // 跳过已处理的实体
      if (this.processedEntities.has(entity)) {
        continue;
      }

      // 标记实体为已处理
      this.processedEntities.add(entity);

      // 如果实体不可见或已禁用，则跳过
      if (!entity.active) {
        continue;
      }

      // 执行视锥体剔除
      if (this.isVisible(entity, camera)) {
        // 获取实体的渲染元素
        const renderElements = this.getRenderElements(entity);

        // 将渲染元素添加到对应的渲染队列中
        for (const element of renderElements) {
          if (!element.visible) {
            continue;
          }

          // 计算与相机的距离，用于排序
          this.calculateDistanceForSort(element, camera);

          // 根据材质判断渲染队列
          if (element.material.transparent) {
            this.transparentQueue.pushRenderElement(element);
          } else if (element.material.alphaTest) {
            this.alphaTestQueue.pushRenderElement(element);
          } else {
            this.opaqueQueue.pushRenderElement(element);
          }
        }
      }
    }
  }

  /**
   * 判断实体是否可见（在视锥体内）
   * @param entity 实体
   * @param camera 摄像机
   * @returns 是否可见
   */
  private isVisible(entity: Entity, camera: Camera): boolean {
    // 简单实现：判断包围盒是否在视锥体内
    // 真实实现会更复杂，包括包围盒与视锥体相交测试

    // 默认为可见，具体实现会在后续完善
    return true;
  }

  /**
   * 获取实体的所有渲染元素
   * @param entity 实体
   * @returns 渲染元素数组
   */
  private getRenderElements(entity: Entity): RenderElement[] {
    // 简单实现：返回实体绑定的所有渲染元素
    // 真实实现会从实体的渲染组件中获取渲染元素

    // 获取实体上的MeshRenderer组件
    const renderers = entity.getComponentsOfType('MeshRenderer');
    const elements: RenderElement[] = [];

    for (const renderer of renderers) {
      if (renderer.isActive && renderer.material && renderer.mesh) {
        // 创建渲染元素
        const element = renderer.getRenderElement();

        if (element) {
          elements.push(element);
        }
      }
    }

    return elements;
  }

  /**
   * 计算渲染元素与相机的距离，用于排序
   * @param element 渲染元素
   * @param camera 摄像机
   */
  private calculateDistanceForSort(element: RenderElement, camera: Camera): void {
    // 计算物体中心点到相机的距离
    const worldPosition = element.worldMatrix.getTranslation();
    const cameraPosition = camera.transform.worldPosition;

    // 使用距离平方作为排序值（避免开方操作）
    const distanceSquared =
      (worldPosition.x - cameraPosition.x) ** 2 +
      (worldPosition.y - cameraPosition.y) ** 2 +
      (worldPosition.z - cameraPosition.z) ** 2;

    element.setDistanceForSort(distanceSquared);
  }

  /**
   * 排序并批处理所有渲染队列
   * @param batcherManager 批处理管理器
   */
  sortBatch(batcherManager: BatcherManager): void {
    // 对不透明队列进行排序（从近到远）
    this.opaqueQueue.sortBatch(RenderQueue.compareForOpaque, batcherManager);

    // 对Alpha测试队列进行排序（从近到远）
    this.alphaTestQueue.sortBatch(RenderQueue.compareForOpaque, batcherManager);

    // 对透明队列进行排序（从远到近）
    this.transparentQueue.sortBatch(RenderQueue.compareForTransparent, batcherManager);
  }

  /**
   * 销毁剔除结果
   */
  destroy(): void {
    this.opaqueQueue.destroy();
    this.alphaTestQueue.destroy();
    this.transparentQueue.destroy();
    this.processedEntities.clear();
  }
}
