/**
 * ResourceTracker.ts
 * WebGL 资源追踪和生命周期管理
 *
 * 提供全局资源注册、泄漏检测和批量销毁功能
 */

/**
 * 可销毁资源接口
 */
export interface IDestroyable {
  destroy(): void;
  /** 调试标签（可选，用于日志输出） */
  label?: string;
}

/**
 * 资源类型分类
 */
export enum ResourceType {
  BUFFER = 'buffer',
  TEXTURE = 'texture',
  SAMPLER = 'sampler',
  SHADER = 'shader',
  PIPELINE = 'pipeline',
  BIND_GROUP = 'bindGroup',
  BIND_GROUP_LAYOUT = 'bindGroupLayout',
  PIPELINE_LAYOUT = 'pipelineLayout',
  QUERY_SET = 'querySet',
  COMMAND_ENCODER = 'commandEncoder',
  OTHER = 'other',
}

/**
 * 资源统计信息
 */
export interface ResourceStats {
  /** 各类型资源数量 */
  byType: Record<ResourceType, number>;
  /** 总资源数量 */
  total: number;
  /** 已注册但未销毁的资源数量（可能泄漏） */
  potentialLeaks: number;
}

/**
 * 资源追踪器
 *
 * 自动追踪所有通过 Device 创建的资源，
 * 提供泄漏检测和批量销毁功能。
 *
 * @example
 * ```typescript
 * const tracker = new ResourceTracker();
 *
 * // 注册资源（通常由 Device 自动调用）
 * const buffer = device.createBuffer(descriptor);
 * tracker.register(buffer, ResourceType.BUFFER);
 *
 * // 销毁资源时自动取消注册
 * buffer.destroy(); // 内部调用 tracker.unregister(buffer)
 *
 * // 检查泄漏
 * const stats = tracker.getStats();
 * if (stats.potentialLeaks > 0) {
 *   console.warn('检测到资源泄漏:', stats);
 * }
 *
 * // 销毁所有资源（如设备销毁时）
 * tracker.destroyAll();
 * ```
 */
export class ResourceTracker {
  /** 资源到类型的映射 */
  private resources = new Map<{ destroy(): void }, ResourceType>();

  /** 是否启用追踪（可用于生产环境禁用） */
  private enabled: boolean;

  /** 追踪器标签（用于调试） */
  private label: string;

  /**
   * 创建资源追踪器
   * @param label 追踪器标签
   * @param enabled 是否启用追踪，默认 true
   */
  constructor(label: string = 'ResourceTracker', enabled: boolean = true) {
    this.label = label;
    this.enabled = enabled;
  }

  /**
   * 注册资源
   * @param resource 要追踪的资源（必须有 destroy 方法）
   * @param type 资源类型
   */
  register(resource: { destroy(): void }, type: ResourceType = ResourceType.OTHER): void {
    if (!this.enabled) {
      return;
    }

    if (this.resources.has(resource)) {
      const resourceLabel = (resource as any).label || '(unnamed)';
      console.warn(`[${this.label}] 资源已注册，跳过重复注册:`, resourceLabel);
      return;
    }

    this.resources.set(resource, type);
  }

  /**
   * 取消注册资源
   * @param resource 要取消追踪的资源
   * @returns 是否成功取消注册
   */
  unregister(resource: { destroy(): void }): boolean {
    if (!this.enabled) {
      return true;
    }

    return this.resources.delete(resource);
  }

  /**
   * 检查资源是否已注册
   * @param resource 要检查的资源
   */
  isRegistered(resource: { destroy(): void }): boolean {
    return this.resources.has(resource);
  }

  /**
   * 获取资源统计信息
   */
  getStats(): ResourceStats {
    const byType: Record<ResourceType, number> = {
      [ResourceType.BUFFER]: 0,
      [ResourceType.TEXTURE]: 0,
      [ResourceType.SAMPLER]: 0,
      [ResourceType.SHADER]: 0,
      [ResourceType.PIPELINE]: 0,
      [ResourceType.BIND_GROUP]: 0,
      [ResourceType.BIND_GROUP_LAYOUT]: 0,
      [ResourceType.PIPELINE_LAYOUT]: 0,
      [ResourceType.QUERY_SET]: 0,
      [ResourceType.COMMAND_ENCODER]: 0,
      [ResourceType.OTHER]: 0,
    };

    for (const type of this.resources.values()) {
      byType[type]++;
    }

    return {
      byType,
      total: this.resources.size,
      potentialLeaks: this.resources.size,
    };
  }

  /**
   * 获取所有已注册资源的列表
   * @param type 可选，筛选特定类型
   */
  getResources(type?: ResourceType): IDestroyable[] {
    if (type === undefined) {
      return Array.from(this.resources.keys());
    }

    const result: IDestroyable[] = [];
    for (const [resource, resourceType] of this.resources) {
      if (resourceType === type) {
        result.push(resource);
      }
    }
    return result;
  }

  /**
   * 销毁所有已注册的资源
   * @param silent 是否静默模式（不输出日志）
   * @returns 销毁的资源数量
   */
  destroyAll(silent: boolean = false): number {
    const count = this.resources.size;

    if (count === 0) {
      return 0;
    }

    if (!silent) {
      console.info(`[${this.label}] 销毁 ${count} 个资源...`);
    }

    // 按类型分组销毁，避免依赖问题
    // 销毁顺序：绑定组 -> 管线 -> 布局 -> 资源
    const destroyOrder: ResourceType[] = [
      ResourceType.COMMAND_ENCODER,
      ResourceType.BIND_GROUP,
      ResourceType.PIPELINE,
      ResourceType.BIND_GROUP_LAYOUT,
      ResourceType.PIPELINE_LAYOUT,
      ResourceType.QUERY_SET,
      ResourceType.SHADER,
      ResourceType.SAMPLER,
      ResourceType.TEXTURE,
      ResourceType.BUFFER,
      ResourceType.OTHER,
    ];

    const resourcesByType = new Map<ResourceType, IDestroyable[]>();
    for (const [resource, type] of this.resources) {
      if (!resourcesByType.has(type)) {
        resourcesByType.set(type, []);
      }
      resourcesByType.get(type)!.push(resource);
    }

    let destroyed = 0;
    for (const type of destroyOrder) {
      const resources = resourcesByType.get(type);
      if (!resources) {
        continue;
      }

      for (const resource of resources) {
        try {
          resource.destroy();
          destroyed++;
        } catch (e) {
          console.error(`[${this.label}] 销毁资源失败:`, resource.label || '(unnamed)', e);
        }
      }
    }

    // 清空映射（destroy 应该已经调用 unregister，但以防万一）
    this.resources.clear();

    if (!silent) {
      console.info(`[${this.label}] 已销毁 ${destroyed}/${count} 个资源`);
    }

    return destroyed;
  }

  /**
   * 输出泄漏报告
   */
  reportLeaks(): void {
    const stats = this.getStats();

    if (stats.total === 0) {
      console.info(`[${this.label}] 无资源泄漏`);
      return;
    }

    console.warn(`[${this.label}] 检测到 ${stats.total} 个潜在资源泄漏:`);

    for (const [type, count] of Object.entries(stats.byType)) {
      if (count > 0) {
        console.warn(`  - ${type}: ${count}`);
      }
    }

    // 列出具体资源
    const resources = this.getResources();
    if (resources.length <= 10) {
      for (const resource of resources) {
        console.warn(`    * ${resource.label || '(unnamed)'}`);
      }
    } else {
      console.warn(`    (共 ${resources.length} 个资源，仅显示前 10 个)`);
      for (let i = 0; i < 10; i++) {
        console.warn(`    * ${resources[i].label || '(unnamed)'}`);
      }
    }
  }

  /**
   * 启用追踪
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用追踪
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * 检查追踪是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 清空所有记录（不销毁资源）
   */
  clear(): void {
    this.resources.clear();
  }
}
