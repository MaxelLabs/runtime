/**
 * 层级结构工具函数
 *
 * 提供通用的层级结构操作，如循环引用检测等
 */

/**
 * 具有父级引用的节点接口
 */
export interface HierarchyNode<T> {
  /** 获取父节点 */
  getParent(): T | null;
}

/**
 * 检查是否存在循环引用
 *
 * @param node 当前节点
 * @param potentialAncestor 潜在的祖先节点（要检查的节点）
 * @param getParent 获取父节点的函数
 * @returns 如果 potentialAncestor 是 node 的祖先，返回 true
 *
 * @remarks
 * 此函数用于在设置父子关系前检测是否会形成循环引用。
 * 如果将 potentialAncestor 设置为 node 的父级会导致循环，则返回 true。
 *
 * @example
 * ```typescript
 * // 检查将 parentEntity 设置为 childEntity 的父级是否会形成循环
 * if (checkCircularReference(parentEntity, childEntity, (e) => e.getParent())) {
 *   console.error('检测到循环引用！');
 * }
 * ```
 */
export function checkCircularReference<T>(node: T, potentialAncestor: T, getParent: (node: T) => T | null): boolean {
  // 如果是同一个节点，直接返回 true
  if (node === potentialAncestor) {
    return true;
  }

  // 遍历 potentialAncestor 的祖先链，检查是否包含 node
  let current = getParent(potentialAncestor);

  while (current !== null) {
    if (current === node) {
      return true;
    }
    current = getParent(current);
  }

  return false;
}

/**
 * 检查节点是否是另一个节点的祖先
 *
 * @param potentialAncestor 潜在的祖先节点
 * @param node 要检查的节点
 * @param getParent 获取父节点的函数
 * @returns 如果 potentialAncestor 是 node 的祖先，返回 true
 *
 * @example
 * ```typescript
 * if (isAncestorOf(grandparent, child, (e) => e.getParent())) {
 *   console.log('grandparent 是 child 的祖先');
 * }
 * ```
 */
export function isAncestorOf<T>(potentialAncestor: T, node: T, getParent: (node: T) => T | null): boolean {
  let current = getParent(node);

  while (current !== null) {
    if (current === potentialAncestor) {
      return true;
    }
    current = getParent(current);
  }

  return false;
}

/**
 * 获取节点的所有祖先
 *
 * @param node 起始节点
 * @param getParent 获取父节点的函数
 * @returns 祖先节点数组，从直接父级到根节点
 *
 * @example
 * ```typescript
 * const ancestors = getAncestors(entity, (e) => e.getParent());
 * // ancestors[0] 是直接父级，ancestors[ancestors.length - 1] 是根节点
 * ```
 */
export function getAncestors<T>(node: T, getParent: (node: T) => T | null): T[] {
  const ancestors: T[] = [];
  let current = getParent(node);

  while (current !== null) {
    ancestors.push(current);
    current = getParent(current);
  }

  return ancestors;
}

/**
 * 获取节点的层级深度
 *
 * @param node 要检查的节点
 * @param getParent 获取父节点的函数
 * @returns 节点的深度（根节点为 0）
 *
 * @example
 * ```typescript
 * const depth = getHierarchyDepth(entity, (e) => e.getParent());
 * ```
 */
export function getHierarchyDepth<T>(node: T, getParent: (node: T) => T | null): number {
  let depth = 0;
  let current = getParent(node);

  while (current !== null) {
    depth++;
    current = getParent(current);
  }

  return depth;
}

/**
 * 查找两个节点的最近公共祖先
 *
 * @param nodeA 第一个节点
 * @param nodeB 第二个节点
 * @param getParent 获取父节点的函数
 * @returns 最近公共祖先，如果没有则返回 null
 *
 * @example
 * ```typescript
 * const commonAncestor = findCommonAncestor(entityA, entityB, (e) => e.getParent());
 * ```
 */
export function findCommonAncestor<T>(nodeA: T, nodeB: T, getParent: (node: T) => T | null): T | null {
  // 获取 nodeA 的所有祖先（包括自身）
  const ancestorsA = new Set<T>();

  ancestorsA.add(nodeA);
  let current: T | null = getParent(nodeA);

  while (current !== null) {
    ancestorsA.add(current);
    current = getParent(current);
  }

  // 从 nodeB 开始向上遍历，找到第一个在 ancestorsA 中的节点
  if (ancestorsA.has(nodeB)) {
    return nodeB;
  }
  current = getParent(nodeB);

  while (current !== null) {
    if (ancestorsA.has(current)) {
      return current;
    }
    current = getParent(current);
  }

  return null;
}
