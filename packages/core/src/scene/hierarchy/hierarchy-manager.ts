/**
 * HierarchyManager - 场景层级管理器
 *
 * Responsibilities:
 * - Parent-child relationships
 * - Tree traversal
 * - Root entity management
 */

import type { EntityId } from '../../ecs';
import type { World } from '../../ecs';
import { Parent, Children } from '../../components';

/**
 * HierarchyManager 接口
 */
export interface IHierarchyManager {
  // === Root ===
  getRoot(): EntityId;

  // === Hierarchy ===
  setParent(entity: EntityId, parent: EntityId | null): void;
  getParent(entity: EntityId): EntityId | null;
  getChildren(entity: EntityId): EntityId[];

  // === Operations ===
  reparent(entity: EntityId, newParent: EntityId): void;
  detachFromParent(entity: EntityId): void;

  // === Traversal ===
  traverse(root: EntityId, callback: (entity: EntityId) => void): void;
  traverseDepthFirst(root: EntityId, callback: (entity: EntityId, depth: number) => void): void;
}

/**
 * HierarchyManager 实现
 */
export class HierarchyManager implements IHierarchyManager {
  private world: World;
  private root: EntityId;

  constructor(world: World, root: EntityId) {
    this.world = world;
    this.root = root;
  }

  getRoot(): EntityId {
    return this.root;
  }

  setParent(entity: EntityId, parent: EntityId | null): void {
    // 1. Detach from current parent
    this.detachFromParent(entity);

    // 2. Set new parent
    const actualParent = parent ?? this.root;
    if (actualParent === (-1 as EntityId)) {
      return;
    }

    // 3. Add Parent component to child
    if (this.world.hasComponent(entity, Parent)) {
      const comp = this.world.getComponent(entity, Parent)!;
      comp.entity = actualParent;
    } else {
      this.world.addComponent(entity, Parent, Parent.fromData({ entity: actualParent }));
    }

    // 4. Update parent's Children component
    let childrenComp = this.world.getComponent(actualParent, Children);
    if (!childrenComp) {
      this.world.addComponent(actualParent, Children, Children.fromData({ entities: [] }));
      childrenComp = this.world.getComponent(actualParent, Children)!;
    }

    if (!childrenComp.entities.includes(entity)) {
      childrenComp.entities.push(entity);
    }
  }

  getParent(entity: EntityId): EntityId | null {
    const comp = this.world.getComponent(entity, Parent);
    return comp?.entity ?? null;
  }

  getChildren(entity: EntityId): EntityId[] {
    const comp = this.world.getComponent(entity, Children);
    return comp?.entities ? [...comp.entities] : [];
  }

  reparent(entity: EntityId, newParent: EntityId): void {
    this.setParent(entity, newParent);
  }

  detachFromParent(entity: EntityId): void {
    const parentComp = this.world.getComponent(entity, Parent);
    if (!parentComp || parentComp.entity === null) {
      return;
    }

    const parentEntity = parentComp.entity;
    const childrenComp = this.world.getComponent(parentEntity, Children);

    if (childrenComp) {
      const index = childrenComp.entities.indexOf(entity);
      if (index !== -1) {
        childrenComp.entities.splice(index, 1);
      }
    }

    // Remove Parent component
    this.world.removeComponent(entity, Parent);
  }

  // === Traversal ===
  traverse(root: EntityId, callback: (entity: EntityId) => void): void {
    callback(root);

    const children = this.getChildren(root);
    for (const child of children) {
      this.traverse(child, callback);
    }
  }

  traverseDepthFirst(root: EntityId, callback: (entity: EntityId, depth: number) => void, depth = 0): void {
    callback(root, depth);

    const children = this.getChildren(root);
    for (const child of children) {
      this.traverseDepthFirst(child, callback, depth + 1);
    }
  }
}
