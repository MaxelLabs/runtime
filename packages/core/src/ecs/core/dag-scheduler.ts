/**
 * DAG 拓扑排序调度器
 * 用于处理 System 之间的依赖关系
 *
 * @remarks
 * **核心功能**:
 * - 拓扑排序（Kahn 算法）
 * - 循环依赖检测
 * - 并行执行分析
 *
 * @example
 * ```typescript
 * // 定义 System 类型
 * interface MySystem {
 *   name: string;
 *   execute: () => void;
 * }
 *
 * const scheduler = new DAGScheduler<MySystem>();
 *
 * // 添加节点和依赖
 * const physicsSys: MySystem = { name: 'Physics', execute: () => {} };
 * const transformSys: MySystem = { name: 'Transform', execute: () => {} };
 *
 * scheduler.addNode('Physics', physicsSys);
 * scheduler.addNode('Transform', transformSys);
 * scheduler.addDependency('Transform', 'Physics'); // Transform 依赖 Physics
 *
 * // 拓扑排序
 * const result = scheduler.topologicalSort();
 * if (result.success) {
 *   console.log(result.sorted.map(n => n.id)); // ['Physics', 'Transform']
 * }
 * ```
 */

/**
 * DAG 节点
 */
interface DAGNode<T> {
  id: string;
  data: T;
  dependencies: Set<string>; // 依赖的节点 ID
  dependents: Set<string>; // 依赖此节点的节点 ID
}

/**
 * 拓扑排序结果
 */
export interface TopologicalSortResult<T> {
  /** 是否成功 */
  success: boolean;
  /** 排序后的节点列表 */
  sorted: Array<{ id: string; data: T }>;
  /** 错误信息 */
  error?: string;
  /** 循环依赖路径（如果有） */
  cycle?: string[];
}

/**
 * 并行执行层级
 */
export interface ParallelBatch<T> {
  /** 当前批次可并行执行的节点 */
  nodes: Array<{ id: string; data: T }>;
  /** 批次索引（越小越早执行） */
  level: number;
}

/**
 * DAG 调度器
 *
 * @remarks
 * DAGScheduler 是一个通用的有向无环图调度器，可用于任何需要依赖排序的场景。
 * 虽然主要用于 SystemScheduler 内部，但也可以独立使用。
 *
 * **独立使用场景**:
 * - 任务调度系统
 * - 构建系统依赖分析
 * - 模块加载顺序计算
 * - 任何需要拓扑排序的场景
 */
export class DAGScheduler<T> {
  private nodes = new Map<string, DAGNode<T>>();

  // 缓存版本控制：用于检测节点是否发生变化
  private currentVersion: number = 0;

  /**
   * 使缓存失效
   * 在节点或依赖关系变更时调用
   */
  private invalidateCache(): void {
    this.currentVersion++;
  }

  /**
   * 复制节点数据（避免修改原始数据）
   * 直接从原始数据创建副本，避免双重复制的性能开销
   * @returns 节点副本的 Map
   */
  private copyNodes(): Map<string, DAGNode<T>> {
    // 直接从原始数据创建副本（浅复制 + Set 复制）
    const nodesCopy = new Map<string, DAGNode<T>>();
    for (const [id, node] of this.nodes) {
      nodesCopy.set(id, {
        id: node.id,
        data: node.data,
        dependencies: new Set(node.dependencies),
        dependents: new Set(node.dependents),
      });
    }
    return nodesCopy;
  }

  /**
   * 添加节点
   * @param id 节点 ID
   * @param data 节点数据
   */
  addNode(id: string, data: T): void {
    if (this.nodes.has(id)) {
      console.warn(`DAGScheduler: Node "${id}" already exists, replacing...`);
    }

    this.nodes.set(id, {
      id,
      data,
      dependencies: new Set(),
      dependents: new Set(),
    });

    this.invalidateCache();
  }

  /**
   * 添加依赖关系
   * @param from 依赖者（需要等待的节点）
   * @param to 被依赖者（需要先执行的节点）
   * @returns 是否成功添加
   * @remarks
   * 表示 `from` 依赖 `to`，即 `to` 必须在 `from` 之前执行
   */
  addDependency(from: string, to: string): boolean {
    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);

    if (!fromNode) {
      console.warn(`DAGScheduler: Node "${from}" does not exist`);
      return false;
    }

    if (!toNode) {
      console.warn(`DAGScheduler: Node "${to}" does not exist`);
      return false;
    }

    // 添加依赖关系
    fromNode.dependencies.add(to);
    toNode.dependents.add(from);

    this.invalidateCache();
    return true;
  }

  /**
   * 移除节点
   * @param id 节点 ID
   * @returns 是否成功移除
   */
  removeNode(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) {
      return false;
    }

    // 清理所有相关依赖关系
    for (const depId of node.dependencies) {
      const depNode = this.nodes.get(depId);
      if (depNode) {
        depNode.dependents.delete(id);
      }
    }

    for (const dependentId of node.dependents) {
      const dependentNode = this.nodes.get(dependentId);
      if (dependentNode) {
        dependentNode.dependencies.delete(id);
      }
    }

    this.nodes.delete(id);
    this.invalidateCache();
    return true;
  }

  /**
   * 拓扑排序（Kahn 算法）
   * @returns 排序结果
   */
  topologicalSort(): TopologicalSortResult<T> {
    // 处理空节点情况
    if (this.nodes.size === 0) {
      return { success: true, sorted: [] };
    }

    // 复制节点以避免修改原始数据
    const nodesCopy = this.copyNodes();

    const sorted: Array<{ id: string; data: T }> = [];
    const queue: string[] = [];
    let queueHead = 0; // 使用索引指针代替 shift()，避免 O(n²) 复杂度

    // 1. 找到所有入度为 0 的节点（无依赖）
    for (const [id, node] of nodesCopy) {
      if (node.dependencies.size === 0) {
        queue.push(id);
      }
    }

    // 2. Kahn 算法（使用索引指针实现 O(n) 出队）
    while (queueHead < queue.length) {
      const currentId = queue[queueHead++]; // O(1) 出队
      const currentNode = nodesCopy.get(currentId)!;

      sorted.push({ id: currentId, data: currentNode.data });

      // 移除所有从当前节点出发的边
      for (const dependentId of currentNode.dependents) {
        const dependentNode = nodesCopy.get(dependentId)!;
        dependentNode.dependencies.delete(currentId);

        // 如果依赖者的入度变为 0，加入队列
        if (dependentNode.dependencies.size === 0) {
          queue.push(dependentId);
        }
      }
    }

    // 3. 检查是否存在循环依赖
    if (sorted.length !== this.nodes.size) {
      const cycle = this.detectCycle();
      return {
        success: false,
        sorted: [],
        error: `Circular dependency detected: ${cycle.join(' -> ')}`,
        cycle,
      };
    }

    return { success: true, sorted };
  }

  /**
   * 检测循环依赖
   * @returns 循环路径（如果存在），只包含循环部分
   */
  detectCycle(): string[] {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];
    let cycleFound: string[] = [];

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);
      path.push(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!visited.has(depId)) {
            if (dfs(depId)) {
              return true;
            }
          } else if (recStack.has(depId)) {
            // 找到循环，提取循环部分
            // path 包含从起点到当前节点的路径，depId 是形成循环的节点
            // 例如：path = ['A', 'B', 'C']，depId = 'A'
            // 循环路径应该是 ['A', 'B', 'C', 'A']
            const cycleStart = path.indexOf(depId);
            // 只取从循环起点到当前节点的部分，然后添加起点形成闭环
            cycleFound = [...path.slice(cycleStart), depId];
            return true;
          }
        }
      }

      recStack.delete(nodeId);
      path.pop();
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) {
          return cycleFound;
        }
      }
    }

    return [];
  }

  /**
   * 分析并行执行层级
   * @returns 并行批次列表
   * @remarks
   * 将节点分组为多个批次，同一批次内的节点可以并行执行
   */
  analyzeParallelBatches(): ParallelBatch<T>[] {
    // 处理空节点情况（与 topologicalSort 保持一致）
    if (this.nodes.size === 0) {
      return [];
    }

    // 复制节点以避免修改原始数据
    const nodesCopy = this.copyNodes();

    const batches: ParallelBatch<T>[] = [];
    let level = 0;

    while (nodesCopy.size > 0) {
      const currentBatch: Array<{ id: string; data: T }> = [];

      // 找到所有入度为 0 的节点
      const readyNodes: string[] = [];
      for (const [id, node] of nodesCopy) {
        if (node.dependencies.size === 0) {
          readyNodes.push(id);
        }
      }

      if (readyNodes.length === 0) {
        // 存在循环依赖，无法继续
        console.error('DAGScheduler: Circular dependency detected during parallel analysis');
        break;
      }

      // 将就绪节点加入当前批次
      for (const nodeId of readyNodes) {
        const node = nodesCopy.get(nodeId)!;
        currentBatch.push({ id: nodeId, data: node.data });

        // 移除所有从当前节点出发的边
        for (const dependentId of node.dependents) {
          const dependentNode = nodesCopy.get(dependentId);
          if (dependentNode) {
            dependentNode.dependencies.delete(nodeId);
          }
        }

        nodesCopy.delete(nodeId);
      }

      batches.push({ nodes: currentBatch, level });
      level++;
    }

    return batches;
  }

  /**
   * 获取节点数量
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * 清空所有节点
   */
  clear(): void {
    this.nodes.clear();
    this.invalidateCache();
  }

  /**
   * 获取节点信息（用于调试）
   */
  getNodeInfo(id: string):
    | {
        id: string;
        dependencies: string[];
        dependents: string[];
      }
    | undefined {
    const node = this.nodes.get(id);
    if (!node) {
      return undefined;
    }

    return {
      id: node.id,
      dependencies: Array.from(node.dependencies),
      dependents: Array.from(node.dependents),
    };
  }

  /**
   * 获取所有节点信息（用于调试）
   */
  getAllNodesInfo(): Array<{
    id: string;
    dependencies: string[];
    dependents: string[];
  }> {
    return Array.from(this.nodes.values()).map((node) => ({
      id: node.id,
      dependencies: Array.from(node.dependencies),
      dependents: Array.from(node.dependents),
    }));
  }
}
