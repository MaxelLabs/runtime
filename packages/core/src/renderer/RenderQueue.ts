/**
 * RenderQueue.ts
 * 渲染队列类
 *
 * 负责管理和排序渲染元素，优化渲染性能
 * 支持多种排序策略和批处理优化
 */

import type { Camera } from '../camera/camera';
import type { Material } from '../material/material';
import type { Geometry } from '../geometry/geometry';
import type { Transform } from '../base/transform';
import type { Matrix4 } from '@maxellabs/math';

/**
 * 渲染元素
 */
export interface RenderElement {
  /**
   * 元素ID
   */
  id: string;

  /**
   * 几何体
   */
  geometry: Geometry;

  /**
   * 材质
   */
  material: Material;

  /**
   * 变换矩阵
   */
  transform: Transform;

  /**
   * 世界变换矩阵
   */
  worldMatrix: Matrix4;

  /**
   * 模型视图投影矩阵
   */
  mvpMatrix?: Matrix4;

  /**
   * 到相机的距离
   */
  distanceToCamera: number;

  /**
   * 渲染层级
   */
  renderLayer: number;

  /**
   * 渲染优先级
   */
  priority: number;

  /**
   * 是否透明
   */
  isTransparent: boolean;

  /**
   * 是否投射阴影
   */
  castShadows: boolean;

  /**
   * 是否接受阴影
   */
  receiveShadows: boolean;

  /**
   * 包围盒（用于视锥剔除）
   */
  boundingBox?: {
    min: [number, number, number];
    max: [number, number, number];
  };

  /**
   * 用户数据
   */
  userData?: any;
}

/**
 * 渲染批次
 */
export interface RenderBatch {
  /**
   * 批次ID
   */
  id: string;

  /**
   * 材质
   */
  material: Material;

  /**
   * 几何体
   */
  geometry: Geometry;

  /**
   * 元素列表
   */
  elements: RenderElement[];

  /**
   * 实例数据
   */
  instanceData?: {
    /**
     * 变换矩阵数组
     */
    transforms: Matrix4[];

    /**
     * 颜色数组
     */
    colors?: Float32Array;

    /**
     * 其他实例属性
     */
    attributes?: Record<string, Float32Array>;
  };

  /**
   * 是否使用实例化渲染
   */
  useInstancing: boolean;

  /**
   * 渲染优先级
   */
  priority: number;
}

/**
 * 排序策略
 */
export enum SortStrategy {
  /**
   * 不排序
   */
  None = 'none',

  /**
   * 按距离排序（前到后）
   */
  FrontToBack = 'front-to-back',

  /**
   * 按距离排序（后到前）
   */
  BackToFront = 'back-to-front',

  /**
   * 按材质排序
   */
  ByMaterial = 'by-material',

  /**
   * 按渲染状态排序
   */
  ByRenderState = 'by-render-state',

  /**
   * 按层级排序
   */
  ByLayer = 'by-layer',

  /**
   * 自定义排序
   */
  Custom = 'custom',
}

/**
 * 渲染队列配置
 */
export interface RenderQueueConfig {
  /**
   * 不透明物体排序策略
   */
  opaqueSortStrategy: SortStrategy;

  /**
   * 透明物体排序策略
   */
  transparentSortStrategy: SortStrategy;

  /**
   * 是否启用批处理
   */
  enableBatching: boolean;

  /**
   * 是否启用实例化渲染
   */
  enableInstancing: boolean;

  /**
   * 最大批次大小
   */
  maxBatchSize: number;

  /**
   * 最大实例数量
   */
  maxInstanceCount: number;

  /**
   * 是否启用视锥剔除
   */
  enableFrustumCulling: boolean;

  /**
   * 是否启用遮挡剔除
   */
  enableOcclusionCulling: boolean;

  /**
   * 自定义排序函数
   */
  customSortFunction?: (a: RenderElement, b: RenderElement) => number;
}

/**
 * 渲染队列类
 *
 * 负责管理渲染元素的收集、排序和批处理
 * 提供多种优化策略以提高渲染性能
 */
export class RenderQueue {
  /**
   * 配置
   */
  private config: Required<RenderQueueConfig>;

  /**
   * 不透明渲染元素
   */
  private opaqueElements: RenderElement[] = [];

  /**
   * 透明渲染元素
   */
  private transparentElements: RenderElement[] = [];

  /**
   * 渲染批次
   */
  private batches: RenderBatch[] = [];

  /**
   * 当前相机
   */
  private currentCamera: Camera | null = null;

  /**
   * 视锥体平面（用于剔除）
   */
  private frustumPlanes: Float32Array = new Float32Array(24); // 6个平面，每个4个分量

  /**
   * 统计信息
   */
  private stats = {
    totalElements: 0,
    opaqueElements: 0,
    transparentElements: 0,
    culledElements: 0,
    batches: 0,
    instancedElements: 0,
  };

  /**
   * 构造函数
   */
  constructor(config: Partial<RenderQueueConfig> = {}) {
    this.config = {
      opaqueSortStrategy: config.opaqueSortStrategy ?? SortStrategy.FrontToBack,
      transparentSortStrategy: config.transparentSortStrategy ?? SortStrategy.BackToFront,
      enableBatching: config.enableBatching ?? true,
      enableInstancing: config.enableInstancing ?? true,
      maxBatchSize: config.maxBatchSize ?? 1000,
      maxInstanceCount: config.maxInstanceCount ?? 1000,
      enableFrustumCulling: config.enableFrustumCulling ?? true,
      enableOcclusionCulling: config.enableOcclusionCulling ?? false,
      customSortFunction: config.customSortFunction ?? undefined,
    };
  }

  /**
   * 设置相机
   */
  setCamera(camera: Camera): void {
    this.currentCamera = camera;

    if (this.config.enableFrustumCulling) {
      this.updateFrustumPlanes(camera);
    }
  }

  /**
   * 添加渲染元素
   */
  addElement(element: RenderElement): void {
    // 视锥剔除
    if (this.config.enableFrustumCulling && this.currentCamera) {
      if (!this.isInFrustum(element)) {
        this.stats.culledElements++;
        return;
      }
    }

    // 计算到相机的距离
    if (this.currentCamera) {
      element.distanceToCamera = this.calculateDistanceToCamera(element);
    }

    // 根据透明度分类
    if (element.isTransparent) {
      this.transparentElements.push(element);
    } else {
      this.opaqueElements.push(element);
    }

    this.stats.totalElements++;
  }

  /**
   * 批量添加渲染元素
   */
  addElements(elements: RenderElement[]): void {
    for (const element of elements) {
      this.addElement(element);
    }
  }

  /**
   * 构建渲染队列
   */
  build(): void {
    // 更新统计信息
    this.stats.opaqueElements = this.opaqueElements.length;
    this.stats.transparentElements = this.transparentElements.length;

    // 排序元素
    this.sortElements();

    // 构建批次
    if (this.config.enableBatching) {
      this.buildBatches();
    }
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
   * 获取渲染批次
   */
  getBatches(): readonly RenderBatch[] {
    return this.batches;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.opaqueElements.length = 0;
    this.transparentElements.length = 0;
    this.batches.length = 0;
    this.currentCamera = null;

    // 重置统计信息
    this.stats.totalElements = 0;
    this.stats.opaqueElements = 0;
    this.stats.transparentElements = 0;
    this.stats.culledElements = 0;
    this.stats.batches = 0;
    this.stats.instancedElements = 0;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RenderQueueConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * 排序元素
   */
  private sortElements(): void {
    // 排序不透明元素
    this.sortElementArray(this.opaqueElements, this.config.opaqueSortStrategy);

    // 排序透明元素
    this.sortElementArray(this.transparentElements, this.config.transparentSortStrategy);
  }

  /**
   * 排序元素数组
   */
  private sortElementArray(elements: RenderElement[], strategy: SortStrategy): void {
    switch (strategy) {
      case SortStrategy.None:
        break;

      case SortStrategy.FrontToBack:
        elements.sort((a, b) => a.distanceToCamera - b.distanceToCamera);
        break;

      case SortStrategy.BackToFront:
        elements.sort((a, b) => b.distanceToCamera - a.distanceToCamera);
        break;

      case SortStrategy.ByMaterial:
        elements.sort((a, b) => {
          const materialA = a.material.id || '';
          const materialB = b.material.id || '';
          return materialA.localeCompare(materialB);
        });
        break;

      case SortStrategy.ByRenderState:
        elements.sort((a, b) => {
          // 按渲染状态排序（材质、着色器等）
          const stateA = this.getRenderStateHash(a);
          const stateB = this.getRenderStateHash(b);
          return stateA - stateB;
        });
        break;

      case SortStrategy.ByLayer:
        elements.sort((a, b) => {
          if (a.renderLayer !== b.renderLayer) {
            return a.renderLayer - b.renderLayer;
          }
          return a.priority - b.priority;
        });
        break;

      case SortStrategy.Custom:
        if (this.config.customSortFunction) {
          elements.sort(this.config.customSortFunction);
        }
        break;
    }
  }

  /**
   * 构建渲染批次
   */
  private buildBatches(): void {
    this.batches.length = 0;

    // 为不透明元素构建批次
    this.buildBatchesForElements(this.opaqueElements);

    // 为透明元素构建批次
    this.buildBatchesForElements(this.transparentElements);

    this.stats.batches = this.batches.length;
  }

  /**
   * 为元素数组构建批次
   */
  private buildBatchesForElements(elements: RenderElement[]): void {
    const batches = new Map<string, RenderElement[]>();

    // 按材质和几何体分组
    for (const element of elements) {
      const key = this.getBatchKey(element);

      if (!batches.has(key)) {
        batches.set(key, []);
      }

      const batch = batches.get(key)!;
      if (batch.length < this.config.maxBatchSize) {
        batch.push(element);
      } else {
        // 创建新批次
        this.createBatch(batch);
        batches.set(key, [element]);
      }
    }

    // 创建剩余的批次
    for (const elements of batches.values()) {
      if (elements.length > 0) {
        this.createBatch(elements);
      }
    }
  }

  /**
   * 创建渲染批次
   */
  private createBatch(elements: RenderElement[]): void {
    if (elements.length === 0) {
      return;
    }

    const firstElement = elements[0];
    const useInstancing =
      this.config.enableInstancing && elements.length > 1 && elements.length <= this.config.maxInstanceCount;

    const batch: RenderBatch = {
      id: `batch_${this.batches.length}`,
      material: firstElement.material,
      geometry: firstElement.geometry,
      elements,
      useInstancing,
      priority: Math.min(...elements.map((e) => e.priority)),
    };

    if (useInstancing) {
      batch.instanceData = {
        transforms: elements.map((e) => e.worldMatrix),
      };
      this.stats.instancedElements += elements.length;
    }

    this.batches.push(batch);
  }

  /**
   * 获取批次键
   */
  private getBatchKey(element: RenderElement): string {
    return `${element.material.id || 'default'}_${element.geometry.id || 'default'}`;
  }

  /**
   * 获取渲染状态哈希
   */
  private getRenderStateHash(element: RenderElement): number {
    // 简单的哈希函数，实际实现可能更复杂
    let hash = 0;
    const materialId = element.material.id || '';
    const geometryId = element.geometry.id || '';

    for (let i = 0; i < materialId.length; i++) {
      hash = ((hash << 5) - hash + materialId.charCodeAt(i)) & 0xffffffff;
    }

    for (let i = 0; i < geometryId.length; i++) {
      hash = ((hash << 5) - hash + geometryId.charCodeAt(i)) & 0xffffffff;
    }

    return hash;
  }

  /**
   * 计算到相机的距离
   */
  private calculateDistanceToCamera(element: RenderElement): number {
    if (!this.currentCamera) {
      return 0;
    }

    const cameraPosition = this.currentCamera.getPosition();
    const elementPosition = element.transform.getPosition();

    const dx = elementPosition.x - cameraPosition.x;
    const dy = elementPosition.y - cameraPosition.y;
    const dz = elementPosition.z - cameraPosition.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 更新视锥体平面
   */
  private updateFrustumPlanes(camera: Camera): void {
    // TODO: 实现视锥体平面计算
    // 这里需要根据相机的投影矩阵和视图矩阵计算6个视锥体平面
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Updating frustum planes for camera:', camera.name);
    }
  }

  /**
   * 检查元素是否在视锥体内
   */
  private isInFrustum(element: RenderElement): boolean {
    // TODO: 实现视锥体剔除
    // 这里需要检查元素的包围盒是否与视锥体相交

    // 临时实现，总是返回true
    return true;
  }
}
