/**
 * MaterialInstance Component - 材质实例组件
 *
 * @packageDocumentation
 *
 * @remarks
 * MaterialInstance 存储已创建的材质实例引用。
 * 与 Core 的 MaterialRef（引用外部资源 ID）不同，MaterialInstance 直接持有材质对象。
 */

import { Component } from '@maxellabs/core';
import type { PBRMaterial } from '../materials/PBR-material';
import type { UnlitMaterial } from '../materials/unlit-material';

/**
 * 材质类型联合
 */
export type MaterialType = PBRMaterial | UnlitMaterial;

/**
 * MaterialInstance 组件 - 存储材质实例
 *
 * @remarks
 * 此组件由 Engine.createMesh() 创建并添加到实体上。
 * ForwardRenderer 在渲染时读取此组件获取材质参数。
 */
export class MaterialInstance extends Component {
  /** 材质实例 */
  material: MaterialType | null = null;

  /**
   * 克隆组件
   * @returns 克隆的 MaterialInstance 实例
   *
   * @remarks
   * 注意：克隆共享材质引用。如需独立材质，应重新创建。
   */
  override clone(): MaterialInstance {
    const cloned = new MaterialInstance();
    cloned.material = this.material;
    return cloned;
  }
}
