/**
 * Transform Components
 * 基于 specification 的变换相关数据组件
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策：fromData 接受 Specification 接口类型
 *
 * 所有组件的 `fromData()` 方法直接接受 Specification 中定义的接口类型（如 `ITransform`），
 * 而不是 `Partial<T>` 类型。这是基于以下考虑：
 *
 * 1. **类型安全**: Specification 接口定义了数据的完整契约，fromData 应该验证输入符合契约
 * 2. **数据来源明确**: 组件数据通常来自序列化的场景文件或 API，这些数据应该是完整的
 * 3. **职责分离**: 如果需要部分数据创建，应该在调用方处理默认值，而不是在组件内部
 * 4. **与 Specification 对齐**: 保持与 specification 包的类型一致性
 * 5. **API 一致性**: 与 Visual 组件（如 MeshRef、MaterialRef）保持相同的设计模式
 *
 * 如果确实需要从部分数据创建组件，可以：
 * - 使用 `new Component()` 创建默认实例，然后手动赋值
 * - 在调用方使用展开运算符合并默认值：`Component.fromData({ ...defaults, ...partialData })`
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
 * 表示无父级实体的常量
 * @remarks
 * 使用 -1 作为无父级的标识，因为有效的实体 ID 从 0 开始
 */
export const NO_PARENT_ENTITY = -1;

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
   * 从 ITransform 规范数据创建组件
   * @param data ITransform 规范数据
   * @returns LocalTransform 组件实例
   *
   * @example
   * ```typescript
   * const transform = LocalTransform.fromData({
   *   position: { x: 1, y: 2, z: 3 },
   *   rotation: { x: 0, y: 0, z: 0, w: 1 },
   *   scale: { x: 1, y: 1, z: 1 }
   * });
   * ```
   */
  static fromData(data: ITransform): LocalTransform {
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

    // 可选字段
    if (data.matrix !== undefined) {
      component.matrix = { ...data.matrix };
    }

    if (data.anchor !== undefined) {
      component.anchor = { ...data.anchor };
    }

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
   * 从 ITransform 规范数据创建组件
   * @param data ITransform 规范数据
   * @returns WorldTransform 组件实例
   *
   * @example
   * ```typescript
   * const transform = WorldTransform.fromData({
   *   position: { x: 1, y: 2, z: 3 },
   *   rotation: { x: 0, y: 0, z: 0, w: 1 },
   *   scale: { x: 1, y: 1, z: 1 }
   * });
   * ```
   */
  static fromData(data: ITransform): WorldTransform {
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

    // 可选字段
    if (data.matrix !== undefined) {
      component.matrix = { ...data.matrix };
    }

    if (data.space !== undefined) {
      component.space = data.space;
    }

    // 标记为脏，需要更新
    component.markDirty();

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
  /**
   * 父级实体 ID
   * @remarks
   * 使用 NO_PARENT_ENTITY (-1) 表示无父级
   * @see NO_PARENT_ENTITY
   */
  entity: number = NO_PARENT_ENTITY;

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
