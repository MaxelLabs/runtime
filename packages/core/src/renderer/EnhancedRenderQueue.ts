import { RenderElement } from './RenderElement';
import { SubRenderElement } from './SubRenderElement';
import { Material } from '../material/Material';
import { Shader } from '../shader/Shader';
import { ObjectPoolManager } from '../base/ObjectPoolManager';

/**
 * 渲染队列排序模式
 */
export enum RenderQueueSortMode {
  /** 从前到后排序 (适用于不透明物体) */
  FRONT_TO_BACK = 0,
  /** 从后到前排序 (适用于透明物体) */
  BACK_TO_FRONT = 1,
  /** 按材质排序 (减少状态切换) */
  MATERIAL = 2,
  /** 按着色器排序 (减少着色器切换) */
  SHADER = 3,
  /** 按优先级排序 */
  PRIORITY = 4,
  /** 不排序 */
  NONE = 5
}

/**
 * 渲染队列阶段
 */
export enum RenderQueueStage {
  /** 背景阶段 (深度写入，从前到后) */
  BACKGROUND = 0,
  /** 几何阶段 (不透明物体，深度写入，从前到后) */
  GEOMETRY = 1000,
  /** Alpha测试阶段 (深度写入，从前到后) */
  ALPHA_TEST = 2000,
  /** 几何后处理阶段 (屏幕空间特效，深度写入可选) */
  GEOMETRY_LAST = 2500,
  /** 透明阶段 (无深度写入，从后到前) */
  TRANSPARENT = 3000,
  /** 叠加阶段 (无深度写入，从后到前) */
  OVERLAY = 4000
}

/**
 * 渲染队列描述
 */
export interface RenderQueueDesc {
  /** 渲染队列ID */
  id: number;
  /** 渲染队列阶段 */
  stage: RenderQueueStage;
  /** 是否是透明队列 */
  isTransparent: boolean;
  /** 是否写入深度 */
  writeDepth: boolean;
  /** 排序模式 */
  sortMode: RenderQueueSortMode;
  /** 是否启用批处理 */
  enableBatching: boolean;
  /** 是否启用实例化 */
  enableInstancing: boolean;
}

/**
 * 渲染状态哈希计算工具
 */
class RenderStateHash {
  /**
   * 计算材质的渲染状态哈希值
   * @param material 材质
   * @returns 状态哈希值
   */
  public static calculate(material: Material): number {
    let hash = 0;
    
    // 如果材质没有渲染状态，返回0
    if (!material || !material.renderState) {
      return hash;
    }
    
    // 按位组合关键状态为一个哈希值
    // 混合状态
    if (material.renderState.blendState && material.renderState.blendState.enabled) {
      hash |= 1;
    }
    
    // 深度状态
    if (material.renderState.depthState) {
      if (material.renderState.depthState.writeEnabled) {
        hash |= (1 << 1);
      }
      
      if (material.renderState.depthState.compareFunc) {
        hash |= ((material.renderState.depthState.compareFunc & 0x7) << 2);
      }
    }
    
    // 剔除状态
    if (material.renderState.cullMode != null) {
      hash |= ((material.renderState.cullMode & 0x3) << 5);
    }
    
    return hash;
  }
}

/**
 * 增强的渲染队列，支持多种排序策略和批处理优化
 */
export class EnhancedRenderQueue {
  /** 队列ID */
  public id: number;
  
  /** 队列描述 */
  public desc: RenderQueueDesc;
  
  /** 渲染元素列表 */
  public renderElements: RenderElement[] = [];
  
  /** 子渲染元素列表 */
  public subRenderElements: SubRenderElement[] = [];
  
  /** 是否需要排序 */
  public needsSort: boolean = false;
  
  /** 批处理分组 */
  private batchGroups: Map<number, SubRenderElement[]> = new Map();
  
  /** 实例化分组 */
  private instanceGroups: Map<number, SubRenderElement[]> = new Map();
  
  /** 批处理结果 */
  private batchedElements: SubRenderElement[] = [];
  
  /** 子渲染元素对象池 */
  private static subElementPool = ObjectPoolManager.getInstance().createPool<SubRenderElement>(
    'renderer:subElement',
    () => {
      const subElem = new SubRenderElement();
      subElem.renderElement = null;
      subElem.material = null;
      subElem.subMesh = null;
      subElem.depth = 0;
      subElem.priority = 0;
      subElem.stateHash = 0;
      subElem.shaderId = 0;
      return subElem;
    },
    (subElem) => {
      subElem.renderElement = null;
      subElem.material = null;
      subElem.subMesh = null;
      subElem.depth = 0;
      subElem.priority = 0;
      subElem.stateHash = 0;
      subElem.shaderId = 0;
    },
    { initialCapacity: 100, maxSize: 1000, logStats: false }
  );

  /**
   * 创建渲染队列
   * @param id 队列ID
   * @param stage 队列阶段
   * @param isTransparent 是否是透明队列
   */
  constructor(id: number, stage: RenderQueueStage, isTransparent: boolean = false) {
    this.id = id;
    this.desc = {
      id,
      stage,
      isTransparent,
      writeDepth: !isTransparent,
      sortMode: isTransparent ? RenderQueueSortMode.BACK_TO_FRONT : RenderQueueSortMode.FRONT_TO_BACK,
      enableBatching: true,
      enableInstancing: true
    };
  }

  /**
   * 添加渲染元素到队列
   * @param element 渲染元素
   */
  addRenderElement(element: RenderElement): void {
    if (!element) {
      return;
    }
    
    this.renderElements.push(element);
    this.needsSort = true;
  }

  /**
   * 准备渲染队列，分解渲染元素并排序
   */
  prepare(): void {
    // 清空子渲染元素
    this.releaseSubRenderElements();
    
    // 从渲染元素创建子渲染元素
    this.createSubRenderElements();
    
    // 排序子渲染元素
    this.sort();
    
    // 如果启用了批处理，执行批处理
    if (this.desc.enableBatching) {
      this.batchElements();
    }
    
    // 如果启用了实例化，执行实例化
    if (this.desc.enableInstancing) {
      this.instanceElements();
    }
  }

  /**
   * 创建子渲染元素
   */
  private createSubRenderElements(): void {
    // 确保有效的渲染元素
    if (!this.renderElements || this.renderElements.length === 0) {
      return;
    }
    
    for (const renderElement of this.renderElements) {
      // 跳过无效渲染元素
      if (!renderElement || !renderElement.subMeshes || renderElement.subMeshes.length === 0) {
        continue;
      }
      
      for (let i = 0; i < renderElement.subMeshes.length; i++) {
        // 获取子网格对应的材质
        let material: Material = null;
        try {
          material = renderElement.getSubMeshMaterial ? renderElement.getSubMeshMaterial(i) : null;
        } catch (e) {
          console.warn('获取子网格材质失败', e);
          continue;
        }
        
        if (!material || !material.renderState) {
          continue;
        }
        
        // 如果渲染元素和队列的透明状态不匹配，则跳过
        const isMatTransparent = material.renderState.blendState && material.renderState.blendState.enabled;
        if (isMatTransparent !== this.desc.isTransparent) {
          continue;
        }
        
        // 创建子渲染元素
        const subElement = EnhancedRenderQueue.subElementPool.get();
        
        // 设置子渲染元素属性
        subElement.renderElement = renderElement;
        subElement.material = material;
        subElement.subMesh = renderElement.subMeshes[i];
        subElement.depth = renderElement.depth || 0;
        subElement.priority = material.renderPriority || 0;
        subElement.stateHash = RenderStateHash.calculate(material);
        subElement.shaderId = material.shader ? material.shader.id : 0;
        
        this.subRenderElements.push(subElement);
      }
    }
  }

  /**
   * 释放子渲染元素回对象池
   */
  private releaseSubRenderElements(): void {
    // 返回所有子渲染元素到对象池
    if (this.subRenderElements.length > 0) {
      EnhancedRenderQueue.subElementPool.releaseAll(this.subRenderElements);
    }
    
    this.subRenderElements = [];
    this.batchedElements = [];
    this.batchGroups.clear();
    this.instanceGroups.clear();
  }

  /**
   * 排序子渲染元素
   */
  private sort(): void {
    if (!this.needsSort || this.subRenderElements.length <= 1) {
      return;
    }
    
    // 根据排序模式选择比较函数
    let compareFn: (a: SubRenderElement, b: SubRenderElement) => number;
    
    switch (this.desc.sortMode) {
      case RenderQueueSortMode.FRONT_TO_BACK:
        compareFn = this.frontToBackCompare;
        break;
        
      case RenderQueueSortMode.BACK_TO_FRONT:
        compareFn = this.backToFrontCompare;
        break;
        
      case RenderQueueSortMode.MATERIAL:
        compareFn = this.materialCompare;
        break;
        
      case RenderQueueSortMode.SHADER:
        compareFn = this.shaderCompare;
        break;
        
      case RenderQueueSortMode.PRIORITY:
        compareFn = this.priorityCompare;
        break;
        
      case RenderQueueSortMode.NONE:
      default:
        // 不排序
        return;
    }
    
    // 执行排序
    this.subRenderElements.sort(compareFn);
    this.needsSort = false;
  }

  /**
   * 从前到后排序比较
   */
  private frontToBackCompare = (a: SubRenderElement, b: SubRenderElement): number => {
    // 首先按优先级排序
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    // 然后按深度从前到后排序
    if (a.depth !== b.depth) {
      return a.depth - b.depth;
    }
    
    // 最后按状态和着色器排序，减少状态切换
    if (a.stateHash !== b.stateHash) {
      return a.stateHash - b.stateHash;
    }
    
    return a.shaderId - b.shaderId;
  };

  /**
   * 从后到前排序比较
   */
  private backToFrontCompare = (a: SubRenderElement, b: SubRenderElement): number => {
    // 首先按优先级排序
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    // 然后按深度从后到前排序
    if (a.depth !== b.depth) {
      return b.depth - a.depth;
    }
    
    // 最后按状态和着色器排序，减少状态切换
    if (a.stateHash !== b.stateHash) {
      return a.stateHash - b.stateHash;
    }
    
    return a.shaderId - b.shaderId;
  };

  /**
   * 按材质排序比较
   */
  private materialCompare = (a: SubRenderElement, b: SubRenderElement): number => {
    // 首先按材质ID排序
    const materialIdA = a.material?.id || 0;
    const materialIdB = b.material?.id || 0;
    
    if (materialIdA !== materialIdB) {
      return materialIdA - materialIdB;
    }
    
    // 然后按深度排序
    return this.desc.isTransparent ? (b.depth - a.depth) : (a.depth - b.depth);
  };

  /**
   * 按着色器排序比较
   */
  private shaderCompare = (a: SubRenderElement, b: SubRenderElement): number => {
    // 首先按着色器ID排序
    if (a.shaderId !== b.shaderId) {
      return a.shaderId - b.shaderId;
    }
    
    // 然后按状态哈希排序
    if (a.stateHash !== b.stateHash) {
      return a.stateHash - b.stateHash;
    }
    
    // 最后按深度排序
    return this.desc.isTransparent ? (b.depth - a.depth) : (a.depth - b.depth);
  };

  /**
   * 按优先级排序比较
   */
  private priorityCompare = (a: SubRenderElement, b: SubRenderElement): number => {
    // 首先按优先级排序
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    // 然后按深度排序
    return this.desc.isTransparent ? (b.depth - a.depth) : (a.depth - b.depth);
  };

  /**
   * 批处理渲染元素
   */
  private batchElements(): void {
    // 首先将元素分组
    this.groupElementsForBatching();
    
    // 清空批处理结果
    this.batchedElements = [];
    
    // 处理每个批处理组
    for (const [batchKey, elements] of this.batchGroups.entries()) {
      if (elements.length <= 1) {
        // 单个元素直接添加
        this.batchedElements.push(...elements);
      } else {
        // 多个元素可以合批
        const batchedElement = this.createBatchedElement(elements);
        if (batchedElement) {
          this.batchedElements.push(batchedElement);
        } else {
          // 如果无法批处理，则添加原始元素
          this.batchedElements.push(...elements);
        }
      }
    }
    
    // 使用批处理结果替换原始子渲染元素
    if (this.batchedElements.length > 0) {
      this.subRenderElements = this.batchedElements;
    }
  }

  /**
   * 按批处理键分组元素
   */
  private groupElementsForBatching(): void {
    this.batchGroups.clear();
    
    for (const element of this.subRenderElements) {
      // 跳过不支持批处理的材质
      if (!element.material || !element.material.enableBatching) {
        continue;
      }
      
      // 计算批处理键
      const batchKey = this.calculateBatchKey(element);
      
      // 添加到对应的批处理组
      if (!this.batchGroups.has(batchKey)) {
        this.batchGroups.set(batchKey, []);
      }
      
      this.batchGroups.get(batchKey).push(element);
    }
  }

  /**
   * 计算批处理键
   */
  private calculateBatchKey(element: SubRenderElement): number {
    // 批处理键应该包括着色器ID、材质ID和共享状态
    const shaderId = element.shaderId;
    const materialId = element.material?.id || 0;
    const stateHash = element.stateHash;
    
    // 组合成一个单一的键
    return ((shaderId & 0xFFF) << 20) | ((materialId & 0xFF) << 12) | (stateHash & 0xFFF);
  }

  /**
   * 创建批处理后的渲染元素
   */
  private createBatchedElement(elements: SubRenderElement[]): SubRenderElement | null {
    // 这里应该创建一个合并了多个元素的新SubRenderElement
    // 实际实现需要合并几何数据
    // 这里简化处理，实际应该实现具体的批处理逻辑
    
    if (elements.length <= 0) {
      return null;
    }
    
    // 简单返回第一个元素作为示例
    // 实际实现中，这里应该创建一个包含批处理信息的新元素
    return elements[0];
  }

  /**
   * 处理实例化渲染
   */
  private instanceElements(): void {
    // 首先将元素分组
    this.groupElementsForInstancing();
    
    // 处理每个实例化组
    for (const [instanceKey, elements] of this.instanceGroups.entries()) {
      if (elements.length <= 1) {
        // 单个元素不需要实例化
        continue;
      }
      
      // 创建实例化元素
      const instancedElement = this.createInstancedElement(elements);
      if (instancedElement) {
        // 将原始元素替换为实例化元素
        // 在实际的渲染循环中应用此实例化数据
      }
    }
  }

  /**
   * 按实例化键分组元素
   */
  private groupElementsForInstancing(): void {
    this.instanceGroups.clear();
    
    for (const element of this.subRenderElements) {
      // 跳过不支持实例化的材质
      if (!element.material || !element.material.enableInstancing) {
        continue;
      }
      
      // 计算实例化键
      const instanceKey = this.calculateInstanceKey(element);
      
      // 添加到对应的实例化组
      if (!this.instanceGroups.has(instanceKey)) {
        this.instanceGroups.set(instanceKey, []);
      }
      
      this.instanceGroups.get(instanceKey).push(element);
    }
  }

  /**
   * 计算实例化键
   */
  private calculateInstanceKey(element: SubRenderElement): number {
    // 实例化键应该包括着色器ID、材质ID和网格ID
    const shaderId = element.shaderId;
    const materialId = element.material?.id || 0;
    const meshId = element.subMesh?.id || 0;
    
    // 组合成一个单一的键
    return ((shaderId & 0xFFF) << 20) | ((materialId & 0xFF) << 12) | (meshId & 0xFFF);
  }

  /**
   * 创建实例化渲染元素
   */
  private createInstancedElement(elements: SubRenderElement[]): SubRenderElement | null {
    // 这里应该创建一个包含实例化数据的元素
    // 实际实现需要收集所有实例的变换信息
    // 这里简化处理，实际应该实现具体的实例化逻辑
    
    if (elements.length <= 0) {
      return null;
    }
    
    // 简单返回第一个元素作为示例
    // 实际实现中，这里应该创建一个包含实例化信息的新元素
    return elements[0];
  }

  /**
   * 清空渲染队列
   */
  clear(): void {
    this.releaseSubRenderElements();
    this.renderElements = [];
    this.needsSort = false;
  }
  
  /**
   * 获取子渲染元素数量
   */
  getElementCount(): number {
    return this.subRenderElements.length;
  }
  
  /**
   * 设置排序模式
   * @param mode 排序模式
   */
  setSortMode(mode: RenderQueueSortMode): void {
    if (this.desc.sortMode !== mode) {
      this.desc.sortMode = mode;
      this.needsSort = true;
    }
  }
  
  /**
   * 分析渲染队列性能
   */
  analyzePerformance(): void {
    // 分析对象池性能
    ObjectPoolManager.getInstance().analyzePerformance(true);
    
    // 输出统计信息
    console.info(
      `渲染队列(ID=${this.id}, 阶段=${RenderQueueStage[this.desc.stage]})统计:\n` +
      `- 原始渲染元素: ${this.renderElements.length}\n` +
      `- 子渲染元素: ${this.subRenderElements.length}\n` +
      `- 批处理分组: ${this.batchGroups.size}\n` +
      `- 实例化分组: ${this.instanceGroups.size}\n` +
      `- 是否需要排序: ${this.needsSort}`
    );
  }
} 