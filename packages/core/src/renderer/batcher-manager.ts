import type { Engine } from '../engine';
import type { Component } from '../base/component';
import type { RenderQueue } from './render-queue';
import type { SubRenderElement } from './sub-render-element';

/**
 * 批处理管理器，负责对渲染元素进行批处理以提高性能
 */
export class BatcherManager {
  /** 引擎实例 */
  private engine: Engine;

  /**
   * 创建批处理管理器
   * @param engine 引擎实例
   */
  constructor(engine: Engine) {
    this.engine = engine;
  }

  /**
   * 批处理渲染队列中的元素
   * @param renderQueue 渲染队列
   */
  batch(renderQueue: RenderQueue): void {
    const { elements, batchedSubElements } = renderQueue;
    let preSubElement: SubRenderElement | null = null;
    let preComponent: Component | null = null;
    let preConstructor: Function | null = null;

    // 清空之前的批处理结果
    batchedSubElements.length = 0;

    // 遍历所有渲染元素的子元素
    for (let i = 0, n = elements.length; i < n; ++i) {
      const subElements = elements[i].subRenderElements;

      for (let j = 0, m = subElements.length; j < m; ++j) {
        const subElement = subElements[j];

        // 检查子渲染元素是否属于当前渲染队列
        if (!(subElement.renderQueueFlags & (1 << renderQueue.renderQueueType))) {
          continue;
        }

        const component = subElement.component;
        const constructor = component.constructor;

        if (preSubElement) {
          // 检查是否可以与前一个元素合并批处理
          if (preConstructor === constructor && this.canBatch(preComponent!, preSubElement, component, subElement)) {
            // 合并批处理
            this.performBatch(preComponent!, preSubElement, component, subElement);
            subElement.batched = true;
          } else {
            // 无法合并，添加到批处理队列中
            batchedSubElements.push(preSubElement);
            preSubElement = subElement;
            preComponent = component;
            preConstructor = constructor;
            this.prepareForBatch(component, subElement);
            subElement.batched = false;
          }
        } else {
          // 第一个元素
          preSubElement = subElement;
          preComponent = component;
          preConstructor = constructor;
          this.prepareForBatch(component, subElement);
          subElement.batched = false;
        }
      }
    }

    // 添加最后一个元素
    if (preSubElement) {
      batchedSubElements.push(preSubElement);
    }
  }

  /**
   * 检查两个渲染元素是否可以合并批处理
   * @param comp1 第一个组件
   * @param subElement1 第一个子渲染元素
   * @param comp2 第二个组件
   * @param subElement2 第二个子渲染元素
   * @returns 是否可以合并批处理
   */
  private canBatch(
    comp1: Component,
    subElement1: SubRenderElement,
    comp2: Component,
    subElement2: SubRenderElement
  ): boolean {
    // 默认实现：相同材质和网格类型可以合并
    return subElement1.material === subElement2.material && subElement1.primitive === subElement2.primitive;
  }

  /**
   * 执行批处理合并
   * @param comp1 第一个组件
   * @param subElement1 第一个子渲染元素
   * @param comp2 第二个组件
   * @param subElement2 第二个子渲染元素
   */
  private performBatch(
    comp1: Component,
    subElement1: SubRenderElement,
    comp2: Component,
    subElement2: SubRenderElement
  ): void {
    // 默认空实现，具体组件类型可以自定义批处理逻辑
  }

  /**
   * 准备批处理
   * @param component 组件
   * @param subElement 子渲染元素
   */
  private prepareForBatch(component: Component, subElement: SubRenderElement): void {
    // 默认空实现，具体组件类型可以自定义批处理准备逻辑
  }

  /**
   * 上传批处理后的缓冲区数据
   */
  uploadBuffer(): void {
    // 子类中实现具体的缓冲区上传逻辑
  }

  /**
   * 销毁批处理管理器
   */
  destroy(): void {
    this.engine = null as any;
  }
}
