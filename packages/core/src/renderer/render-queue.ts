/**
 * render-queue.ts
 * 渲染队列 - 收集、排序和批处理渲染元素
 * 基于RHI硬件抽象层规范
 */

import { Vector3 } from '@maxellabs/math';
import type { Camera } from '../camera/camera';
import type { Scene } from '../scene/scene';
import { MeshRenderer } from '../components/mesh-renderer';
import type { RenderElement } from './render-element';
import { RenderElementImpl, RenderElementComparator } from './render-element';
import type { GameObject } from '../scene';

/**
 * 渲染队列配置
 */
export interface RenderQueueConfig {
  /**
   * 是否启用视锥裁剪
   */
  enableFrustumCulling?: boolean;

  /**
   * 是否启用距离排序
   */
  enableDistanceSorting?: boolean;

  /**
   * 最大渲染距离
   */
  maxRenderDistance?: number;

  /**
   * 渲染层级掩码
   */
  layerMask?: number;
}

/**
 * 渲染队列统计信息
 */
export interface RenderQueueStatistics {
  /**
   * 总的游戏对象数量
   */
  totalObjects: number;

  /**
   * 经过裁剪后的渲染元素数量
   */
  culledElements: number;

  /**
   * 不透明渲染元素数量
   */
  opaqueElements: number;

  /**
   * 透明渲染元素数量
   */
  transparentElements: number;

  /**
   * 阴影投射元素数量
   */
  shadowCasterElements: number;

  /**
   * 队列构建时间(毫秒)
   */
  buildTime: number;
}

/**
 * 渲染队列类
 * 负责收集场景中的可渲染对象，并按照渲染需求进行排序和分组
 */
export class RenderQueue {
  private config: Required<RenderQueueConfig>;
  private statistics: RenderQueueStatistics;

  // 渲染元素队列
  private opaqueElements: RenderElement[] = [];
  private transparentElements: RenderElement[] = [];
  private shadowCasterElements: RenderElement[] = [];

  // 临时变量，避免频繁分配
  private readonly tempVector3 = new Vector3();

  /**
   * 构造函数
   */
  constructor(config: RenderQueueConfig = {}) {
    this.config = {
      enableFrustumCulling: true,
      enableDistanceSorting: true,
      maxRenderDistance: 1000,
      layerMask: 0xffffffff,
      ...config,
    };

    this.statistics = {
      totalObjects: 0,
      culledElements: 0,
      opaqueElements: 0,
      transparentElements: 0,
      shadowCasterElements: 0,
      buildTime: 0,
    };
  }

  /**
   * 获取配置
   */
  getConfig(): Required<RenderQueueConfig> {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<RenderQueueConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * 获取统计信息
   */
  getStatistics(): RenderQueueStatistics {
    return { ...this.statistics };
  }

  /**
   * 获取不透明渲染元素
   */
  getOpaqueElements(): readonly RenderElement[] {
    return this.opaqueElements;
  }

  /**
   * 获取透明渲染元素
   */
  getTransparentElements(): readonly RenderElement[] {
    return this.transparentElements;
  }

  /**
   * 获取阴影投射元素
   */
  getShadowCasterElements(): readonly RenderElement[] {
    return this.shadowCasterElements;
  }

  /**
   * 构建渲染队列
   * @param scene 场景
   * @param camera 相机
   */
  build(scene: Scene, camera: Camera): void {
    const startTime = performance.now();

    // 清空之前的队列
    this.clear();

    // 获取相机位置和视锥
    const cameraPosition = camera.getPosition();
    const frustum = camera.getFrustum();

    // 遍历场景中的所有游戏对象
    this.collectRenderElements(scene, camera, cameraPosition, frustum);

    // 排序渲染元素
    this.sortRenderElements(cameraPosition);

    // 更新统计信息
    this.statistics.buildTime = performance.now() - startTime;
    this.statistics.opaqueElements = this.opaqueElements.length;
    this.statistics.transparentElements = this.transparentElements.length;
    this.statistics.shadowCasterElements = this.shadowCasterElements.length;
    this.statistics.culledElements = this.statistics.opaqueElements + this.statistics.transparentElements;
  }

  /**
   * 收集渲染元素
   */
  private collectRenderElements(scene: Scene, camera: Camera, cameraPosition: Vector3, frustum: any): void {
    let totalObjects = 0;

    // 遍历场景中的所有游戏对象
    scene.traverse((gameObject: GameObject) => {
      totalObjects++;

      // 检查游戏对象是否活跃
      if (!gameObject.getActive()) {
        return;
      }

      // 检查层级掩码
      const layer = gameObject.getLayer();
      if ((this.config.layerMask & (1 << layer)) === 0) {
        return;
      }

      // 获取MeshRenderer组件
      const meshRenderer = gameObject.getComponent(MeshRenderer);
      if (!meshRenderer || !meshRenderer.getEnabled()) {
        return;
      }

      const material = meshRenderer.getMaterial();
      const mesh = meshRenderer.getMesh();

      if (!material || !mesh) {
        return;
      }

      // 获取世界变换矩阵和包围盒
      const worldMatrix = gameObject.getTransform().getWorldMatrix();
      const worldBounds = meshRenderer.getWorldBounds();

      // 视锥裁剪
      if (this.config.enableFrustumCulling && frustum) {
        if (!frustum.intersectsBoundingBox(worldBounds)) {
          return;
        }
      }

      // 距离裁剪
      if (this.config.maxRenderDistance > 0) {
        this.tempVector3.set(
          worldBounds.center.x - cameraPosition.x,
          worldBounds.center.y - cameraPosition.y,
          worldBounds.center.z - cameraPosition.z
        );

        const distance = this.tempVector3.getLength();
        if (distance > this.config.maxRenderDistance) {
          return;
        }
      }

      // 创建渲染元素
      const renderElement = new RenderElementImpl(gameObject, material, mesh, worldMatrix, worldBounds, {
        layer: layer,
        castShadow: meshRenderer.getCastShadow(),
        receiveShadow: meshRenderer.getReceiveShadow(),
      });

      // 更新距离到相机
      if (this.config.enableDistanceSorting) {
        renderElement.updateDistanceToCamera(cameraPosition);
      }

      // 添加到相应的队列
      if (renderElement.isTransparent) {
        this.transparentElements.push(renderElement);
      } else {
        this.opaqueElements.push(renderElement);
      }

      // 添加到阴影投射队列
      if (renderElement.castShadow) {
        this.shadowCasterElements.push(renderElement);
      }
    });

    this.statistics.totalObjects = totalObjects;
  }

  /**
   * 排序渲染元素
   */
  private sortRenderElements(cameraPosition: Vector3): void {
    if (!this.config.enableDistanceSorting) {
      return;
    }

    // 更新所有元素到相机的距离
    const allElements = [...this.opaqueElements, ...this.transparentElements, ...this.shadowCasterElements];
    for (const element of allElements) {
      element.updateDistanceToCamera(cameraPosition);
    }

    // 排序不透明物体（前到后）
    this.opaqueElements.sort(RenderElementComparator.compareOpaque);

    // 排序透明物体（后到前）
    this.transparentElements.sort(RenderElementComparator.compareTransparent);

    // 排序阴影投射物体
    this.shadowCasterElements.sort(RenderElementComparator.compareShadowCaster);
  }

  /**
   * 清空队列
   */
  clear(): void {
    // 清理RHI缓存
    for (const element of this.opaqueElements) {
      element.clearRHICache?.();
    }
    for (const element of this.transparentElements) {
      element.clearRHICache?.();
    }
    for (const element of this.shadowCasterElements) {
      element.clearRHICache?.();
    }

    this.opaqueElements.length = 0;
    this.transparentElements.length = 0;
    this.shadowCasterElements.length = 0;

    // 重置统计信息
    this.statistics.totalObjects = 0;
    this.statistics.culledElements = 0;
    this.statistics.opaqueElements = 0;
    this.statistics.transparentElements = 0;
    this.statistics.shadowCasterElements = 0;
    this.statistics.buildTime = 0;
  }

  /**
   * 销毁渲染队列
   */
  destroy(): void {
    this.clear();
  }
}
