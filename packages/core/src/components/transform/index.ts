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
 *
 * 如果确实需要从部分数据创建组件，可以：
 * - 使用 `new Component()` 创建默认实例，然后手动赋值
 * - 在调用方使用展开运算符合并默认值：`Component.fromData({ ...defaults, ...partialData })`
 */

import type {
  ITransform,
  IParent,
  IChildren,
  Vector3Like,
  QuaternionLike,
  Matrix4Like,
} from '@maxellabs/specification';

/**
 * LocalTransform Component - 本地变换组件
 * @description 实现 ITransform 接口,存储实体的本地空间变换
 */
export class LocalTransform implements ITransform {
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

  /** 脏标记 (ECS 优化用) */
  dirty: boolean = true;

  /**
   * 从 ITransform 规范数据创建组件
   * @param data ITransform 规范数据
   * @returns LocalTransform 组件实例
   */
  static fromData(data: ITransform): LocalTransform {
    const component = new LocalTransform();

    component.position = {
      x: data.position.x,
      y: data.position.y,
      z: data.position.z,
    };

    component.rotation = {
      x: data.rotation.x,
      y: data.rotation.y,
      z: data.rotation.z,
      w: data.rotation.w,
    };

    component.scale = {
      x: data.scale.x,
      y: data.scale.y,
      z: data.scale.z,
    };

    if (data.matrix) {
      component.matrix = { ...data.matrix };
    }

    if (data.anchor) {
      component.anchor = { ...data.anchor };
    }

    return component;
  }
}

/**
 * WorldTransform Component - 世界变换组件
 * @description 实现 ITransform 接口,存储计算后的世界空间变换
 */
export class WorldTransform implements ITransform {
  /** 世界位置 */
  position: Vector3Like = { x: 0, y: 0, z: 0 };

  /** 世界旋转 */
  rotation: QuaternionLike = { x: 0, y: 0, z: 0, w: 1 };

  /** 世界缩放 */
  scale: Vector3Like = { x: 1, y: 1, z: 1 };

  /** 世界变换矩阵 */
  matrix?: Matrix4Like;

  /**
   * 从 ITransform 规范数据创建组件
   * @param data ITransform 规范数据
   * @returns WorldTransform 组件实例
   */
  static fromData(data: ITransform): WorldTransform {
    const component = new WorldTransform();

    component.position = {
      x: data.position.x,
      y: data.position.y,
      z: data.position.z,
    };

    component.rotation = {
      x: data.rotation.x,
      y: data.rotation.y,
      z: data.rotation.z,
      w: data.rotation.w,
    };

    component.scale = {
      x: data.scale.x,
      y: data.scale.y,
      z: data.scale.z,
    };

    if (data.matrix) {
      component.matrix = { ...data.matrix };
    }

    return component;
  }
}

/**
 * Parent Component - 父级组件
 * @description 实现 IParent 接口,存储父级实体引用
 */
export class Parent implements IParent {
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
}

/**
 * Children Component - 子级组件
 * @description 实现 IChildren 接口,存储子级实体列表
 */
export class Children implements IChildren {
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
}
