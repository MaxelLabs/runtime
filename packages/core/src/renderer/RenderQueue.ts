import type { BatcherManager } from './BatcherManager';
import type { RenderElement } from './RenderElement';
import type { RenderContext } from './RenderContext';
import type { SubRenderElement } from './SubRenderElement';
import type { RenderQueueType } from './RendererType';

/**
 * 渲染队列标记类型
 */
export enum RenderQueueMaskType {
  /** 无掩码 */
  No = 0,
  /** 写入掩码 */
  Write = 1,
  /** 读取掩码 */
  Read = 2
}

/**
 * 渲染队列，负责对渲染元素进行管理和排序
 */
export class RenderQueue {
  /** 不透明物体排序函数 */
  static compareForOpaque (a: RenderElement, b: RenderElement): number {
    // 先按优先级排序，再按距离排序（从近到远）
    return a.priority - b.priority || a.distanceForSort - b.distanceForSort;
  }

  /** 透明物体排序函数 */
  static compareForTransparent (a: RenderElement, b: RenderElement): number {
    // 先按优先级排序，再按距离排序（从远到近）
    return a.priority - b.priority || b.distanceForSort - a.distanceForSort;
  }

  /** 所有渲染元素 */
  readonly elements: RenderElement[] = [];
  /** 批处理后的子渲染元素 */
  readonly batchedSubElements: SubRenderElement[] = [];

  /**
   * 创建渲染队列
   * @param renderQueueType 渲染队列类型
   */
  constructor(public readonly renderQueueType: RenderQueueType) {}

  /**
   * 添加渲染元素
   * @param element 渲染元素
   */
  pushRenderElement (element: RenderElement): void {
    this.elements.push(element);
  }

  /**
   * 排序并批处理
   * @param compareFunc 比较函数
   * @param batcherManager 批处理管理器
   */
  sortBatch (compareFunc: Function, batcherManager: BatcherManager): void {
    // 快速排序
    this._quickSort(this.elements, 0, this.elements.length, compareFunc);
    this.batch(batcherManager);
  }

  /**
   * 执行批处理
   * @param batcherManager 批处理管理器
   */
  batch (batcherManager: BatcherManager): void {
    batcherManager.batch(this);
  }

  /**
   * 渲染队列中的所有元素
   * @param context 渲染上下文
   * @param pipelineStage 管线阶段标识
   * @param maskType 掩码类型
   */
  render (
    context: RenderContext,
    pipelineStage: string,
    maskType: RenderQueueMaskType = RenderQueueMaskType.No
  ): void {
    const batchedSubElements = this.batchedSubElements;
    const length = batchedSubElements.length;
    if (length === 0) {
      return;
    }

    const { scene, camera } = context;
    const engine = context.engine;
    const renderer = engine._renderer;

    for (let i = 0; i < length; i++) {
      const subElement = batchedSubElements[i];
      const { component, material, primitive } = subElement;

      // 更新渲染器的变换矩阵数据
      component._updateTransformShaderData(context);

      // 渲染单个子元素
      renderer.drawPrimitive(primitive, material, context);
    }
  }

  /**
   * 清空队列
   */
  clear (): void {
    this.elements.length = 0;
    this.batchedSubElements.length = 0;
  }

  /**
   * 销毁队列
   */
  destroy (): void {
    this.clear();
  }

  /**
   * 快速排序算法
   * @param array 要排序的数组
   * @param left 左边界
   * @param right 右边界
   * @param compareFunc 比较函数
   */
  private _quickSort (array: any[], left: number, right: number, compareFunc: Function): void {
    if (right - left <= 1) {
      return;
    }

    const pivot = array[Math.floor((left + right) / 2)];
    const newLeft = this._partition(array, left, right, pivot, compareFunc);
    this._quickSort(array, left, newLeft, compareFunc);
    this._quickSort(array, newLeft, right, compareFunc);
  }

  /**
   * 快速排序分区函数
   */
  private _partition (array: any[], left: number, right: number, pivot: any, compareFunc: Function): number {
    while (left < right) {
      while (compareFunc(array[left], pivot) < 0) {
        left++;
      }
      while (compareFunc(array[right - 1], pivot) > 0) {
        right--;
      }
      if (left < right) {
        const temp = array[left];
        array[left] = array[right - 1];
        array[right - 1] = temp;
        left++;
        right--;
      }
    }
    return left;
  }
}

/**
 * 渲染队列标志
 */
export enum RenderQueueFlags {
  /** 无 */
  None = 0x0,
  /** 不透明 */
  Opaque = 0x1,
  /** Alpha测试 */
  AlphaTest = 0x2,
  /** 透明 */
  Transparent = 0x4,
  /** 所有 */
  All = 0x7
} 