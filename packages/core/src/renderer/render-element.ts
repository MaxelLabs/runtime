/**
 * render-element.ts
 * 渲染元素 - 封装可渲染对象的所有必要信息
 * 基于RHI硬件抽象层规范
 */

import type { Matrix4, BoundingBox } from '@maxellabs/math';
import type { Material } from '../material/material';
import type { GameObject } from '../scene/game-object';
import type { IRHIRenderPipeline, IRHIBindGroup } from '../interface/rhi';
import type { MeshRenderer } from '../components';

/**
 * 渲染优先级枚举
 */
export enum RenderPriority {
  /** 背景渲染 */
  BACKGROUND = 1000,
  /** 不透明物体 */
  OPAQUE = 2000,
  /** 透明物体 */
  TRANSPARENT = 3000,
  /** 覆盖层 */
  OVERLAY = 4000,
}

/**
 * 渲染元素接口
 * 包含渲染一个物体所需的所有信息
 */
export interface RenderElement {
  /**
   * 唯一标识符
   */
  readonly id: string;

  /**
   * 关联的游戏对象
   */
  readonly gameObject: GameObject;

  /**
   * 材质
   */
  readonly material: Material;

  /**
   * 网格
   */
  readonly mesh: MeshRenderer;

  /**
   * 世界变换矩阵
   */
  readonly worldMatrix: Matrix4;

  /**
   * 世界空间包围盒
   */
  readonly worldBounds: BoundingBox;

  /**
   * 渲染优先级
   */
  readonly priority: number;

  /**
   * 渲染层级
   */
  readonly layer: number;

  /**
   * 是否透明
   */
  readonly isTransparent: boolean;

  /**
   * 是否投射阴影
   */
  readonly castShadow: boolean;

  /**
   * 是否接收阴影
   */
  readonly receiveShadow: boolean;

  /**
   * 距离相机的距离（用于排序）
   */
  distanceToCamera: number;

  /**
   * RHI渲染管线（缓存）
   */
  renderPipeline?: IRHIRenderPipeline;

  /**
   * RHI绑定组（缓存）
   */
  bindGroups?: IRHIBindGroup[];

  /**
   * 更新距离相机的距离
   */
  updateDistanceToCamera?(cameraPosition: ReadonlyArray<number>): void;

  /**
   * 清理RHI资源缓存
   */
  clearRHICache?(): void;
}

/**
 * 渲染元素实现类
 */
export class RenderElementImpl implements RenderElement {
  readonly id: string;
  readonly gameObject: GameObject;
  readonly material: Material;
  readonly mesh: MeshRenderer;
  readonly worldMatrix: Matrix4;
  readonly worldBounds: BoundingBox;
  readonly priority: number;
  readonly layer: number;
  readonly isTransparent: boolean;
  readonly castShadow: boolean;
  readonly receiveShadow: boolean;

  distanceToCamera = 0;
  renderPipeline?: IRHIRenderPipeline;
  bindGroups?: IRHIBindGroup[];

  constructor(
    gameObject: GameObject,
    material: Material,
    mesh: MeshRenderer,
    worldMatrix: Matrix4,
    worldBounds: BoundingBox,
    options: {
      priority?: number;
      layer?: number;
      castShadow?: boolean;
      receiveShadow?: boolean;
    } = {}
  ) {
    this.id = `${gameObject.getId()}-${material.getId()}-${mesh.getId()}`;
    this.gameObject = gameObject;
    this.material = material;
    this.mesh = mesh;
    this.worldMatrix = worldMatrix;
    this.worldBounds = worldBounds;

    // 根据材质透明度确定渲染优先级和透明性
    this.isTransparent = material.getTransparency() < 1.0 || material.getBlendMode() !== 'opaque';
    this.priority = options.priority ?? (this.isTransparent ? RenderPriority.TRANSPARENT : RenderPriority.OPAQUE);
    this.layer = options.layer ?? 0;
    this.castShadow = options.castShadow ?? true;
    this.receiveShadow = options.receiveShadow ?? true;
  }

  /**
   * 更新距离相机的距离
   */
  updateDistanceToCamera(cameraPosition: ReadonlyArray<number>): void {
    const bounds = this.worldBounds;
    const dx = bounds.center.x - cameraPosition[0];
    const dy = bounds.center.y - cameraPosition[1];
    const dz = bounds.center.z - cameraPosition[2];
    this.distanceToCamera = Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 清理RHI资源缓存
   */
  clearRHICache(): void {
    this.renderPipeline = undefined;
    if (this.bindGroups) {
      for (const bindGroup of this.bindGroups) {
        bindGroup.destroy();
      }
      this.bindGroups = undefined;
    }
  }
}

/**
 * 渲染元素比较函数
 */
export class RenderElementComparator {
  /**
   * 不透明物体排序 - 前到后，减少过度绘制
   */
  static compareOpaque(a: RenderElement, b: RenderElement): number {
    // 首先按优先级排序
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // 然后按层级排序
    if (a.layer !== b.layer) {
      return a.layer - b.layer;
    }

    // 按材质排序以减少状态切换
    const materialIdA = a.material.getId();
    const materialIdB = b.material.getId();
    if (materialIdA !== materialIdB) {
      return materialIdA.localeCompare(materialIdB);
    }

    // 最后按距离排序（近到远）
    return a.distanceToCamera - b.distanceToCamera;
  }

  /**
   * 透明物体排序 - 后到前，确保正确的混合
   */
  static compareTransparent(a: RenderElement, b: RenderElement): number {
    // 首先按优先级排序
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // 然后按层级排序
    if (a.layer !== b.layer) {
      return a.layer - b.layer;
    }

    // 按距离排序（远到近）
    if (a.distanceToCamera !== b.distanceToCamera) {
      return b.distanceToCamera - a.distanceToCamera;
    }

    // 最后按材质排序
    const materialIdA = a.material.getId();
    const materialIdB = b.material.getId();
    return materialIdA.localeCompare(materialIdB);
  }

  /**
   * 阴影投射物体排序
   */
  static compareShadowCaster(a: RenderElement, b: RenderElement): number {
    // 按材质排序以减少状态切换
    const materialIdA = a.material.getId();
    const materialIdB = b.material.getId();
    if (materialIdA !== materialIdB) {
      return materialIdA.localeCompare(materialIdB);
    }

    // 按距离排序（近到远）
    return a.distanceToCamera - b.distanceToCamera;
  }
}
