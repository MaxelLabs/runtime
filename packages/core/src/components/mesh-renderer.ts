/**
 * MeshRenderer.ts
 * 网格渲染器组件
 *
 * 将Mesh和Material组合到GameObject上，使其成为可渲染对象
 */

import { Component } from '../base/component';
import type { Material } from '../material/material';
import type { Entity } from '../base/entity';
import type { BoundingBox } from '@maxellabs/math';
import { AlphaMode } from '@maxellabs/math';
import type { Geometry } from '../geometry';
import type { RHIVertexBufferLayout } from '../interface';
import { RHIIndexFormat } from '../interface/rhi/types/enums';

/**
 * 网格渲染器组件
 *
 * 负责将网格和材质结合，提供渲染所需的数据
 */
export class MeshRenderer extends Component {
  getVertexBuffer() {
    return this.geometry?.getVertexBuffer();
  }

  getIndexBuffer() {
    return this.geometry?.getIndexBuffer();
  }

  getIndexFormat(): RHIIndexFormat {
    return this.geometry?.getIndexFormat() || RHIIndexFormat.UINT16;
  }

  getIndexCount() {
    return this.geometry?.getIndexCount() || 0;
  }

  getVertexCount() {
    return this.geometry?.getVertexCount() || 0;
  }
  /**
   * 网格对象
   */
  private geometry: Geometry | null = null;

  /**
   * 材质对象
   */
  private material: Material | null = null;

  /**
   * 是否投射阴影
   */
  private castShadows = true;

  /**
   * 是否接受阴影
   */
  private receiveShadows = true;

  /**
   * 渲染层级
   */
  private renderLayer = 0;

  /**
   * 渲染优先级
   */
  private priority = 0;
  readonly typeName = 'MeshRenderer';

  /**
   * 构造函数
   */
  constructor(entity: Entity) {
    super(entity);
  }

  getVertexLayout(): RHIVertexBufferLayout[] {
    return this.geometry?.getVertexLayout() || [];
  }

  /**
   * 获取网格
   */
  getGeometry(): Geometry | null {
    return this.geometry;
  }

  /**
   * 设置网格
   */
  setGeometry(geometry: Geometry | null): void {
    if (this.geometry !== geometry) {
      this.geometry = geometry;
      this.markDirty();
    }
  }

  /**
   * 获取材质
   */
  getMaterial(): Material | null {
    return this.material;
  }

  /**
   * 设置材质
   */
  setMaterial(material: Material | null): void {
    if (this.material !== material) {
      this.material = material;
      this.markDirty();
    }
  }

  /**
   * 是否启用渲染
   */
  isEnabled(): boolean {
    return this.getEnabled();
  }

  /**
   * 设置是否启用渲染
   */
  override setEnabled(enabled: boolean): void {
    super.setEnabled(enabled);
    this.markDirty();
  }

  /**
   * 是否投射阴影
   */
  getCastShadows(): boolean {
    return this.castShadows;
  }

  /**
   * 设置是否投射阴影
   */
  setCastShadows(castShadows: boolean): void {
    if (this.castShadows !== castShadows) {
      this.castShadows = castShadows;
      this.markDirty();
    }
  }

  /**
   * 是否接受阴影
   */
  getReceiveShadows(): boolean {
    return this.receiveShadows;
  }

  /**
   * 设置是否接受阴影
   */
  setReceiveShadows(receiveShadows: boolean): void {
    if (this.receiveShadows !== receiveShadows) {
      this.receiveShadows = receiveShadows;
      this.markDirty();
    }
  }

  /**
   * 获取渲染层级
   */
  getRenderLayer(): number {
    return this.renderLayer;
  }

  /**
   * 设置渲染层级
   */
  setRenderLayer(layer: number): void {
    if (this.renderLayer !== layer) {
      this.renderLayer = layer;
      this.markDirty();
    }
  }

  /**
   * 获取渲染优先级
   */
  getPriority(): number {
    return this.priority;
  }

  /**
   * 设置渲染优先级
   */
  setPriority(priority: number): void {
    if (this.priority !== priority) {
      this.priority = priority;
      this.markDirty();
    }
  }

  /**
   * 检查是否可以渲染
   */
  canRender(): boolean {
    return this.getEnabled() && this.geometry !== null && this.material !== null;
  }

  /**
   * 检查是否透明
   */
  isTransparent(): boolean {
    if (!this.material) {
      return false;
    }

    // 检查材质透明模式
    const alphaMode = this.material.getAlphaMode();
    return alphaMode === AlphaMode.Blend || this.material.getOpacity() < 1.0;
  }

  /**
   * 创建渲染元素
   */
  createRenderElement(): any | null {
    if (!this.canRender() || !this.geometry || !this.material) {
      return null;
    }

    const transform = this.entity.transform;
    const worldMatrix = transform.getWorldMatrix();

    return {
      id: this.entity.id,
      geometry: this.geometry,
      material: this.material,
      transform,
      worldMatrix,
      distanceToCamera: 0, // 将在渲染队列中计算
      renderLayer: this.renderLayer,
      priority: this.priority,
      isTransparent: this.isTransparent(),
      castShadows: this.castShadows,
      receiveShadows: this.receiveShadows,
      boundingBox: this.getBoundingBox(),
    };
  }

  /**
   * 获取包围盒
   */
  private getBoundingBox() {
    if (!this.geometry) {
      return undefined;
    }

    const boundingBox = this.geometry.getBoundingBox();
    // const worldMatrix = this.entity.transform.getWorldMatrix();

    // 将包围盒转换到世界空间
    const corners = [
      [boundingBox.min.x, boundingBox.min.y, boundingBox.min.z],
      [boundingBox.max.x, boundingBox.min.y, boundingBox.min.z],
      [boundingBox.min.x, boundingBox.max.y, boundingBox.min.z],
      [boundingBox.max.x, boundingBox.max.y, boundingBox.min.z],
      [boundingBox.min.x, boundingBox.min.y, boundingBox.max.z],
      [boundingBox.max.x, boundingBox.min.y, boundingBox.max.z],
      [boundingBox.min.x, boundingBox.max.y, boundingBox.max.z],
      [boundingBox.max.x, boundingBox.max.y, boundingBox.max.z],
    ];

    // 计算世界空间包围盒
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    for (const corner of corners) {
      // TODO: 使用worldMatrix变换corner
      // 这里需要Matrix4的变换方法
      const x = corner[0];
      const y = corner[1];
      const z = corner[2];

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    }

    return {
      min: [minX, minY, minZ] as [number, number, number],
      max: [maxX, maxY, maxZ] as [number, number, number],
    };
  }

  /**
   * 标记为已修改
   */
  private markDirty(): void {
    // 可以在这里触发渲染队列更新事件
  }

  /**
   * 组件更新
   */
  override update(deltaTime: number): void {
    // MeshRenderer通常不需要每帧更新
    // 但可以在这里检查材质或网格的变化
  }

  /**
   * 组件销毁
   */
  override destroy(): void {
    this.geometry = null;
    this.material = null;
    super.destroy();
  }

  /**
   * 获取网格（适配Mesh接口）
   */
  getMesh(): any {
    // 将Geometry适配为Mesh接口
    if (!this.geometry) {
      return null;
    }

    return {
      ...this.geometry,
      getId: () => this.geometry?.name || 'unknown',
      getVertexLayout: () => [], // TODO: 从geometry获取顶点布局
      getVertexBuffer: () => null, // TODO: 从RHI获取
      getIndexBuffer: () => null, // TODO: 从RHI获取
      getIndexFormat: () => 'uint16' as const,
      getVertexCount: () => 0, // TODO: 从geometry获取
      getIndexCount: () => 0, // TODO: 从geometry获取
    };
  }

  /**
   * 获取世界空间包围盒（适配render-queue接口）
   */
  getWorldBounds(): BoundingBox {
    const bounds = this.getBoundingBox();
    if (!bounds) {
      return {
        center: { x: 0, y: 0, z: 0 },
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
        size: { x: 0, y: 0, z: 0 },
      };
    }

    const centerX = (bounds.min[0] + bounds.max[0]) * 0.5;
    const centerY = (bounds.min[1] + bounds.max[1]) * 0.5;
    const centerZ = (bounds.min[2] + bounds.max[2]) * 0.5;

    return {
      center: { x: centerX, y: centerY, z: centerZ },
      min: { x: bounds.min[0], y: bounds.min[1], z: bounds.min[2] },
      max: { x: bounds.max[0], y: bounds.max[1], z: bounds.max[2] },
      size: {
        x: bounds.max[0] - bounds.min[0],
        y: bounds.max[1] - bounds.min[1],
        z: bounds.max[2] - bounds.min[2],
      },
    };
  }

  /**
   * 获取是否投射阴影（适配render-queue接口）
   */
  getCastShadow(): boolean {
    return this.getCastShadows();
  }

  /**
   * 获取是否接收阴影（适配render-queue接口）
   */
  getReceiveShadow(): boolean {
    return this.getReceiveShadows();
  }
}
