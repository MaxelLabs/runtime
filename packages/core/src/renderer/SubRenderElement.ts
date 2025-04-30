import type { Component } from '../base/component';
import type { Material } from '../material/Material';
import type { Mesh } from './mesh';
import { RenderQueueFlags } from './RenderQueue';

/**
 * 子渲染元素，表示一个渲染元素的子部分
 */
export class SubRenderElement {
  /** 关联的组件 */
  component: Component;
  /** 材质 */
  material: Material;
  /** 网格体 */
  primitive: Mesh;
  /** 子网格索引 */
  subPrimitive: number = 0;
  /** 渲染队列标志 */
  renderQueueFlags: number = RenderQueueFlags.All;
  /** 是否是批处理的一部分 */
  batched: boolean = false;
  /** 到相机的距离（用于排序） */
  distanceForSort: number = 0;
  /** 渲染优先级 */
  priority: number = 0;

  /**
   * 创建子渲染元素
   * @param component 组件
   * @param material 材质
   * @param primitive 网格体
   * @param subPrimitive 子网格索引
   */
  constructor (component: Component, material: Material, primitive: Mesh, subPrimitive: number = 0) {
    this.component = component;
    this.material = material;
    this.primitive = primitive;
    this.subPrimitive = subPrimitive;
  }

  /**
   * 设置渲染队列标志
   * @param flags 渲染队列标志
   * @returns 当前子渲染元素
   */
  setRenderQueueFlags (flags: number): SubRenderElement {
    this.renderQueueFlags = flags;
    return this;
  }

  /**
   * 设置排序距离
   * @param distance 到相机的距离
   * @returns 当前子渲染元素
   */
  setDistanceForSort (distance: number): SubRenderElement {
    this.distanceForSort = distance;
    return this;
  }

  /**
   * 设置渲染优先级
   * @param priority 优先级
   * @returns 当前子渲染元素
   */
  setPriority (priority: number): SubRenderElement {
    this.priority = priority;
    return this;
  }

  /**
   * 克隆子渲染元素
   * @returns 新的子渲染元素实例
   */
  clone (): SubRenderElement {
    const result = new SubRenderElement(
      this.component,
      this.material,
      this.primitive,
      this.subPrimitive
    );
    result.renderQueueFlags = this.renderQueueFlags;
    result.distanceForSort = this.distanceForSort;
    result.priority = this.priority;
    return result;
  }
} 