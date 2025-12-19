/**
 * ECS 调试工具
 * 提供实体检查、性能监控、可视化等调试功能
 *
 * @example
 * ```typescript
 * // 检查实体
 * console.log(inspect(world, entity));
 *
 * // 打印层级树
 * console.log(printHierarchy(world));
 *
 * // 性能监控
 * const monitor = new PerformanceMonitor();
 * monitor.begin('Update');
 * scheduler.update(deltaTime);
 * monitor.end('Update');
 * console.log(monitor.getReport());
 * ```
 */

import type { World } from './world';
import type { EntityId } from './entity-id';
import { EntityId as EntityIdUtils, INVALID_ENTITY } from './entity-id';
import { Name, Tag, Position, Rotation, Scale, Parent, Children, Active } from './entity-builder';

// ============ 实体检查 ============

/**
 * 实体检查结果
 */
export interface EntityInspection {
  /** 实体 ID */
  id: EntityId;
  /** 索引 */
  index: number;
  /** 版本号 */
  generation: number;
  /** 名称 */
  name: string;
  /** 是否激活 */
  active: boolean;
  /** 父级 ID */
  parent: EntityId | null;
  /** 子级 ID 列表 */
  children: EntityId[];
  /** 标签 */
  tags: string[];
  /** 组件数据 */
  components: Record<string, any>;
}

/**
 * 检查实体
 * @param world World 实例
 * @param entity 实体 ID
 * @returns 检查结果
 */
export function inspect(world: World, entity: EntityId): EntityInspection | null {
  if (!world.isAlive(entity)) {
    return null;
  }

  const nameComp = world.getComponent(entity, Name);
  const activeComp = world.getComponent(entity, Active);
  const parentComp = world.getComponent(entity, Parent);
  const childrenComp = world.getComponent(entity, Children);
  const tagComp = world.getComponent(entity, Tag);
  const posComp = world.getComponent(entity, Position);
  const rotComp = world.getComponent(entity, Rotation);
  const scaleComp = world.getComponent(entity, Scale);

  const components: Record<string, any> = {};

  if (posComp) {
    components['Position'] = { x: posComp.x, y: posComp.y, z: posComp.z };
  }
  if (rotComp) {
    components['Rotation'] = { x: rotComp.x, y: rotComp.y, z: rotComp.z, w: rotComp.w };
  }
  if (scaleComp) {
    components['Scale'] = { x: scaleComp.x, y: scaleComp.y, z: scaleComp.z };
  }

  return {
    id: entity,
    index: EntityIdUtils.index(entity),
    generation: EntityIdUtils.generation(entity),
    name: nameComp?.value ?? `Entity_${EntityIdUtils.index(entity)}`,
    active: activeComp?.value ?? true,
    parent: parentComp?.entity !== INVALID_ENTITY ? (parentComp?.entity ?? null) : null,
    children: childrenComp?.entities ?? [],
    tags: tagComp ? Array.from(tagComp.values) : [],
    components,
  };
}

/**
 * 格式化实体信息为字符串
 */
export function inspectString(world: World, entity: EntityId): string {
  const info = inspect(world, entity);
  if (!info) {
    return `Entity(${entity}) - NOT FOUND`;
  }

  const lines: string[] = [];
  lines.push(`Entity: ${info.name} (id=${info.id}, index=${info.index}, gen=${info.generation})`);
  lines.push(`  Active: ${info.active}`);

  if (info.parent !== null) {
    const parentName = world.getComponent(info.parent, Name)?.value ?? `Entity_${EntityIdUtils.index(info.parent)}`;
    lines.push(`  Parent: ${parentName} (${info.parent})`);
  }

  if (info.children.length > 0) {
    lines.push(`  Children: ${info.children.length}`);
    for (const child of info.children) {
      const childName = world.getComponent(child, Name)?.value ?? `Entity_${EntityIdUtils.index(child)}`;
      lines.push(`    - ${childName} (${child})`);
    }
  }

  if (info.tags.length > 0) {
    lines.push(`  Tags: [${info.tags.join(', ')}]`);
  }

  lines.push(`  Components:`);
  for (const [name, data] of Object.entries(info.components)) {
    lines.push(`    ${name}: ${JSON.stringify(data)}`);
  }

  return lines.join('\n');
}

// ============ 层级树 ============

/**
 * 层级树节点
 */
export interface HierarchyNode {
  entity: EntityId;
  name: string;
  active: boolean;
  children: HierarchyNode[];
}

/**
 * 构建层级树
 * @param world World 实例
 * @returns 根节点列表
 */
export function buildHierarchy(world: World): HierarchyNode[] {
  const roots: HierarchyNode[] = [];

  // 查找所有根实体（无父级）
  const query = world.query({ all: [Name], none: [Parent] });
  query.forEach((entity) => {
    roots.push(buildHierarchyNode(world, entity));
  });

  // 也包括有 Parent 但 Parent 无效的实体
  const withParent = world.query({ all: [Parent] });
  withParent.forEach((entity, [parent]) => {
    if ((parent as Parent).entity === INVALID_ENTITY) {
      roots.push(buildHierarchyNode(world, entity));
    }
  });

  return roots;
}

/**
 * 递归构建层级节点
 */
function buildHierarchyNode(world: World, entity: EntityId): HierarchyNode {
  const nameComp = world.getComponent(entity, Name);
  const activeComp = world.getComponent(entity, Active);
  const childrenComp = world.getComponent(entity, Children);

  const children: HierarchyNode[] = [];
  if (childrenComp) {
    for (const child of childrenComp.entities) {
      children.push(buildHierarchyNode(world, child));
    }
  }

  return {
    entity,
    name: nameComp?.value ?? `Entity_${EntityIdUtils.index(entity)}`,
    active: activeComp?.value ?? true,
    children,
  };
}

/**
 * 打印层级树
 * @param world World 实例
 * @returns 格式化的层级树字符串
 */
export function printHierarchy(world: World): string {
  const roots = buildHierarchy(world);
  const lines: string[] = [];

  for (const root of roots) {
    printHierarchyNode(root, '', true, lines);
  }

  return lines.join('\n');
}

/**
 * 递归打印层级节点
 */
function printHierarchyNode(node: HierarchyNode, prefix: string, isLast: boolean, lines: string[]): void {
  const connector = isLast ? '└── ' : '├── ';
  const activeMarker = node.active ? '' : ' [INACTIVE]';
  lines.push(`${prefix}${connector}${node.name} (${node.entity})${activeMarker}`);

  const childPrefix = prefix + (isLast ? '    ' : '│   ');
  for (let i = 0; i < node.children.length; i++) {
    printHierarchyNode(node.children[i], childPrefix, i === node.children.length - 1, lines);
  }
}

// ============ 性能监控 ============

/**
 * 性能采样
 */
interface PerformanceSample {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
}

/**
 * 性能统计
 */
export interface PerformanceStats {
  name: string;
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  lastTime: number;
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private samples: Map<string, PerformanceSample[]> = new Map();
  private activeSamples: Map<string, number> = new Map();
  private maxSamples: number;

  constructor(maxSamples: number = 100) {
    this.maxSamples = maxSamples;
  }

  /**
   * 开始计时
   */
  begin(name: string): void {
    this.activeSamples.set(name, performance.now());
  }

  /**
   * 结束计时
   */
  end(name: string): number {
    const startTime = this.activeSamples.get(name);
    if (startTime === undefined) {
      console.warn(`PerformanceMonitor: No active sample for "${name}"`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 保存采样
    let samples = this.samples.get(name);
    if (!samples) {
      samples = [];
      this.samples.set(name, samples);
    }

    samples.push({ name, startTime, endTime, duration });

    // 限制采样数量
    if (samples.length > this.maxSamples) {
      samples.shift();
    }

    this.activeSamples.delete(name);
    return duration;
  }

  /**
   * 测量函数执行时间
   */
  measure<T>(name: string, fn: () => T): T {
    this.begin(name);
    try {
      return fn();
    } finally {
      this.end(name);
    }
  }

  /**
   * 获取统计信息
   */
  getStats(name: string): PerformanceStats | null {
    const samples = this.samples.get(name);
    if (!samples || samples.length === 0) {
      return null;
    }

    const durations = samples.map((s) => s.duration);
    const totalTime = durations.reduce((a, b) => a + b, 0);

    return {
      name,
      count: samples.length,
      totalTime,
      avgTime: totalTime / samples.length,
      minTime: Math.min(...durations),
      maxTime: Math.max(...durations),
      lastTime: durations[durations.length - 1],
    };
  }

  /**
   * 获取所有统计信息
   */
  getAllStats(): PerformanceStats[] {
    const stats: PerformanceStats[] = [];
    for (const name of this.samples.keys()) {
      const s = this.getStats(name);
      if (s) {
        stats.push(s);
      }
    }
    return stats;
  }

  /**
   * 获取报告
   */
  getReport(): string {
    const stats = this.getAllStats();
    if (stats.length === 0) {
      return 'No performance data collected.';
    }

    const lines: string[] = ['Performance Report:', ''];

    // 按平均时间排序
    stats.sort((a, b) => b.avgTime - a.avgTime);

    // 表头
    lines.push('Name                          | Count |   Avg   |   Min   |   Max   |  Last');
    lines.push('-'.repeat(80));

    for (const s of stats) {
      const name = s.name.padEnd(30);
      const count = s.count.toString().padStart(5);
      const avg = s.avgTime.toFixed(2).padStart(7) + 'ms';
      const min = s.minTime.toFixed(2).padStart(7) + 'ms';
      const max = s.maxTime.toFixed(2).padStart(7) + 'ms';
      const last = s.lastTime.toFixed(2).padStart(7) + 'ms';
      lines.push(`${name} | ${count} | ${avg} | ${min} | ${max} | ${last}`);
    }

    return lines.join('\n');
  }

  /**
   * 清空数据
   */
  clear(): void {
    this.samples.clear();
    this.activeSamples.clear();
  }
}

// ============ World 统计 ============

/**
 * World 统计信息
 */
export interface WorldStats {
  entities: number;
  archetypes: number;
  queries: number;
  componentTypes: number;
  resources: number;
  memoryEstimate: number;
}

/**
 * 获取 World 详细统计
 */
export function getWorldStats(world: World): WorldStats {
  const basicStats = world.getStats();

  // 估算内存占用
  const memoryEstimate =
    basicStats.entities * 100 + // 每个实体约 100 字节
    basicStats.archetypes * 1000 + // 每个 Archetype 约 1KB
    basicStats.queries * 500; // 每个 Query 约 500 字节

  return {
    ...basicStats,
    memoryEstimate,
  };
}

/**
 * 打印 World 统计
 */
export function printWorldStats(world: World): string {
  const stats = getWorldStats(world);
  const lines: string[] = [
    'World Statistics:',
    `  Entities: ${stats.entities}`,
    `  Archetypes: ${stats.archetypes}`,
    `  Queries: ${stats.queries}`,
    `  Component Types: ${stats.componentTypes}`,
    `  Resources: ${stats.resources}`,
    `  Memory Estimate: ${(stats.memoryEstimate / 1024).toFixed(2)} KB`,
  ];
  return lines.join('\n');
}

// ============ 查询调试 ============

/**
 * 打印查询结果
 */
export function printQueryResults(world: World, query: any, maxResults: number = 10): string {
  const results = query.collect();
  const lines: string[] = [`Query Results (${results.length} entities):`];

  const displayCount = Math.min(results.length, maxResults);
  for (let i = 0; i < displayCount; i++) {
    const result = results[i];
    const nameComp = world.getComponent(result.entity, Name);
    const name = nameComp?.value ?? `Entity_${EntityIdUtils.index(result.entity)}`;
    lines.push(`  ${i + 1}. ${name} (${result.entity})`);
    lines.push(`     Components: ${JSON.stringify(result.components)}`);
  }

  if (results.length > maxResults) {
    lines.push(`  ... and ${results.length - maxResults} more`);
  }

  return lines.join('\n');
}

// ============ 全局调试工具 ============

/**
 * 调试工具集合
 */
export const Debug = {
  inspect,
  inspectString,
  buildHierarchy,
  printHierarchy,
  getWorldStats,
  printWorldStats,
  printQueryResults,
  PerformanceMonitor,
};

/**
 * 全局性能监控器
 */
export const globalPerformanceMonitor = new PerformanceMonitor();
