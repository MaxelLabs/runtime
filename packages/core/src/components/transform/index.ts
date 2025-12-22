/**
 * Transform Components
 * 基于 specification 的变换相关数据组件
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策：fromData 接受 Partial<T> 类型
 *
 * 所有组件的 `fromData()` 方法接受 `Partial<T>` 类型，允许从部分数据创建组件。
 * 这是基于以下考虑：
 *
 * 1. **灵活性**: 允许调用方只提供需要修改的字段，其他字段使用默认值
 * 2. **实际使用场景**: 组件数据可能来自不完整的序列化数据或增量更新
 * 3. **防御性编程**: 实现中使用空值检查，确保即使传入不完整数据也不会导致运行时错误
 * 4. **类型安全**: 使用 `Partial<T>` 明确表达了方法可以接受部分数据的意图
 *
 * 所有组件都继承自 Component 基类，提供：
 * - 引用计数管理（继承自 ReferResource）
 * - 组件启用/禁用状态
 * - 组件脏标记（用于优化更新）
 * - 组件所属实体引用
 */

import type {
  ITransform,
  IParent,
  IChildren,
  Vector3Like,
  QuaternionLike,
  Matrix4Like,
  TransformSpace,
} from '@maxellabs/specification';
import { Component } from '../base';

/**
 * LocalTransform Component - 本地变换组件
 * @description 继承 Component 基类，实现 ITransform 接口，存储实体的本地空间变换
 */
export class LocalTransform extends Component implements ITransform {
  /** 位置 */
  position: Vector3Like = { x: 0, y: 0, z: 0 };

  /** 旋转四元数 */
  rotation: QuaternionLike = { x: 0, y: 0, z: 0, w: 1 };

  /** 缩放 */
  scale: Vector3Like = { x: 1, y: 1, z: 1 };

  /** 变换矩阵 (可选) */
  matrix?: Matrix4Like;

  /** 锚点 (可选) */
  anchor?: Vector3Like;

  /** 变换空间 (可选) */
  space?: TransformSpace;

  /**
   * 从部分 ITransform 规范数据创建组件
   * @param data 部分 ITransform 规范数据，缺失字段将使用默认值
   * @returns LocalTransform 组件实例
   *
   * @remarks
   * 此方法接受部分数据，对输入进行空值检查，缺失字段使用默认值：
   * - position: 默认 { x: 0, y: 0, z: 0 }
   * - rotation: 默认 { x: 0, y: 0, z: 0, w: 1 }（单位四元数）
   * - scale: 默认 { x: 1, y: 1, z: 1 }
   *
   * @example
   * ```typescript
   * // 只设置位置，其他使用默认值
   * const transform = LocalTransform.fromData({ position: { x: 1, y: 2, z: 3 } });
   *
   * // 创建默认变换
   * const defaultTransform = LocalTransform.fromData({});
   * ```
   */
  static fromData(data: Partial<ITransform>): LocalTransform {
    const component = new LocalTransform();

    // 位置：使用空值检查，缺失时使用默认值
    if (data.position) {
      component.position = {
        x: data.position.x ?? 0,
        y: data.position.y ?? 0,
        z: data.position.z ?? 0,
      };
    }

    // 旋转：使用空值检查，缺失时使用单位四元数
    if (data.rotation) {
      component.rotation = {
        x: data.rotation.x ?? 0,
        y: data.rotation.y ?? 0,
        z: data.rotation.z ?? 0,
        w: data.rotation.w ?? 1,
      };
    }

    // 缩放：使用空值检查，缺失时使用单位缩放
    if (data.scale) {
      component.scale = {
        x: data.scale.x ?? 1,
        y: data.scale.y ?? 1,
        z: data.scale.z ?? 1,
      };
    }

    if (data.matrix) {
      component.matrix = { ...data.matrix };
    }

    if (data.anchor) {
      component.anchor = { ...data.anchor };
    }

    // 处理 space 字段，避免数据丢失
    if (data.space !== undefined) {
      component.space = data.space;
    }

    // 标记为脏，需要更新
    component.markDirty();

    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 LocalTransform 实例
   */
  override clone(): LocalTransform {
    const cloned = new LocalTransform();
    cloned.position = { ...this.position };
    cloned.rotation = { ...this.rotation };
    cloned.scale = { ...this.scale };
    if (this.matrix) {
      cloned.matrix = { ...this.matrix };
    }
    if (this.anchor) {
      cloned.anchor = { ...this.anchor };
    }
    if (this.space !== undefined) {
      cloned.space = this.space;
    }
    return cloned;
  }
}

/**
 * WorldTransform Component - 世界变换组件
 * @description 继承 Component 基类，实现 ITransform 接口，存储计算后的世界空间变换
 */
export class WorldTransform extends Component implements ITransform {
  /** 世界位置 */
  position: Vector3Like = { x: 0, y: 0, z: 0 };

  /** 世界旋转 */
  rotation: QuaternionLike = { x: 0, y: 0, z: 0, w: 1 };

  /** 世界缩放 */
  scale: Vector3Like = { x: 1, y: 1, z: 1 };

  /** 世界变换矩阵 */
  matrix?: Matrix4Like;

  /** 变换空间 (可选) */
  space?: TransformSpace;

  /**
   * 从部分 ITransform 规范数据��建组件
   * @param data 部分 ITransform 规范数据，缺失字段将使用默认值
   * @returns WorldTransform 组件实例
   *
   * @remarks
   * 此方法接受部分数据，对输入进行空值检查，缺失字段使用默认值：
   * - position: 默认 { x: 0, y: 0, z: 0 }
   * - rotation: 默认 { x: 0, y: 0, z: 0, w: 1 }（单位四元数）
   * - scale: 默认 { x: 1, y: 1, z: 1 }
   *
   * @example
   * ```typescript
   * // 只设置位置，其他使用默认值
   * const transform = WorldTransform.fromData({ position: { x: 1, y: 2, z: 3 } });
   *
   * // 创建默认变换
   * const defaultTransform = WorldTransform.fromData({});
   * ```
   */
  static fromData(data: Partial<ITransform>): WorldTransform {
    const component = new WorldTransform();

    // 位置：使用空值检查，缺失时使用默认值
    if (data.position) {
      component.position = {
        x: data.position.x ?? 0,
        y: data.position.y ?? 0,
        z: data.position.z ?? 0,
      };
    }

    // 旋转：使用空值检查，缺失时使用单位四元数
    if (data.rotation) {
      component.rotation = {
        x: data.rotation.x ?? 0,
        y: data.rotation.y ?? 0,
        z: data.rotation.z ?? 0,
        w: data.rotation.w ?? 1,
      };
    }

    // 缩放：使用空值检查，缺失时使用单位缩放
    if (data.scale) {
      component.scale = {
        x: data.scale.x ?? 1,
        y: data.scale.y ?? 1,
        z: data.scale.z ?? 1,
      };
    }

    if (data.matrix) {
      component.matrix = { ...data.matrix };
    }

    // 处理 space 字段，避免数据丢失
    if (data.space !== undefined) {
      component.space = data.space;
    }

    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 WorldTransform 实例
   */
  override clone(): WorldTransform {
    const cloned = new WorldTransform();
    cloned.position = { ...this.position };
    cloned.rotation = { ...this.rotation };
    cloned.scale = { ...this.scale };
    if (this.matrix) {
      cloned.matrix = { ...this.matrix };
    }
    if (this.space !== undefined) {
      cloned.space = this.space;
    }
    return cloned;
  }
}

/**
 * Parent Component - 父级组件
 * @description 继承 Component 基类，实现 IParent 接口，存储父级实体引用
 */
export class Parent extends Component implements IParent {
  /** 父级实体 ID */
  entity: number = -1;

  /**
   * 从 IParent 规范数据创建组件
   * @param data IParent 规范数据
   * @returns Parent 组件实例
   */
  static fromData(data: IParent): Parent {
    const component = new Parent();
    component.entity = data.entity;
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 Parent 实例
   */
  override clone(): Parent {
    const cloned = new Parent();
    cloned.entity = this.entity;
    return cloned;
  }
}

/**
 * Children Component - 子级组件
 * @description 继承 Component 基类，实现 IChildren 接口，存储子级实体列表
 */
export class Children extends Component implements IChildren {
  /** 子级实体 ID 列表 */
  entities: number[] = [];

  /**
   * 从 IChildren 规范数据创建组件
   * @param data IChildren 规范数据
   * @returns Children 组件实例
   */
  static fromData(data: IChildren): Children {
    const component = new Children();
    component.entities = [...data.entities];
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 Children 实例
   */
  override clone(): Children {
    const cloned = new Children();
    cloned.entities = [...this.entities];
    return cloned;
  }
}
