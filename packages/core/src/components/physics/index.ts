/**
 * Physics Components
 * 基于 specification 的物理模拟相关数据组件
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策：fromData 接受 Specification 接口类型
 *
 * 所有组件的 `fromData()` 方法直接接受 Specification 中定义的接口类型（如 `Vector3Like`、`IMass`），
 * 而不是 `Partial<T>` 类型。这是基于以下考虑：
 *
 * 1. **类型安全**: Specification 接口定义了数据的完整契约，fromData 应该验证输入符合契约
 * 2. **数据来源明确**: 组件数据通常来自序列化的场景文件或 API，这些数据应该是完整的
 * 3. **职责分离**: 如果需要部分数据创建，应该在调用方处理默认值，而不是在组件内部
 * 4. **与 Specification 对齐**: 保持与 specification 包的类型一致性
 *
 * ## 物理组件说明
 *
 * - `Velocity`, `Acceleration`, `AngularVelocity`: 实现 `Vector3Like` 接口，表示三维向量
 * - `Mass`, `Gravity`, `Damping`: 实现专用的 ECS 接口 (`IMass`, `IGravity`, `IDamping`)
 */

import type { Vector3Like, IMass, IGravity, IDamping } from '@maxellabs/specification';

/**
 * Velocity Component - 速度组件
 * @description 实现 Vector3Like 接口,存储实体的线性速度 (单位/秒)
 */
export class Velocity implements Vector3Like {
  /** X 轴速度 */
  x: number = 0;

  /** Y 轴速度 */
  y: number = 0;

  /** Z 轴速度 */
  z: number = 0;

  /**
   * 从 Vector3Like 规范数据创建组件
   * @param data Vector3Like 规范数据
   * @returns Velocity 组件实例
   */
  static fromData(data: Vector3Like): Velocity {
    const component = new Velocity();
    component.x = data.x;
    component.y = data.y;
    component.z = data.z;
    return component;
  }
}

/**
 * Acceleration Component - 加速度组件
 * @description 实现 Vector3Like 接口,存储实体的加速度 (单位/秒²)
 */
export class Acceleration implements Vector3Like {
  /** X 轴加速度 */
  x: number = 0;

  /** Y 轴加速度 */
  y: number = 0;

  /** Z 轴加速度 */
  z: number = 0;

  /**
   * 从 Vector3Like 规范数据创建组件
   * @param data Vector3Like 规范数据
   * @returns Acceleration 组件实例
   */
  static fromData(data: Vector3Like): Acceleration {
    const component = new Acceleration();
    component.x = data.x;
    component.y = data.y;
    component.z = data.z;
    return component;
  }
}

/**
 * AngularVelocity Component - 角速度组件
 * @description 实现 Vector3Like 接口,存储实体的旋转速度 (弧度/秒)
 */
export class AngularVelocity implements Vector3Like {
  /** X 轴角速度 */
  x: number = 0;

  /** Y 轴角速度 */
  y: number = 0;

  /** Z 轴角速度 */
  z: number = 0;

  /**
   * 从 Vector3Like 规范数据创建组件
   * @param data Vector3Like 规范数据
   * @returns AngularVelocity 组件实例
   */
  static fromData(data: Vector3Like): AngularVelocity {
    const component = new AngularVelocity();
    component.x = data.x;
    component.y = data.y;
    component.z = data.z;
    return component;
  }
}

/**
 * Mass Component - 质量组件
 * @description 实现 IMass 接口,存储实体的质量 (千克)
 */
export class Mass implements IMass {
  /** 质量值 (kg) */
  value: number = 1;

  /** 是否为无限质量 (不可移动) */
  infinite?: boolean;

  /**
   * 从 IMass 规范数据创建组件
   * @param data IMass 规范数据
   * @returns Mass 组件实例
   */
  static fromData(data: IMass): Mass {
    const component = new Mass();
    component.value = data.value;
    if (data.infinite !== undefined) {
      component.infinite = data.infinite;
    }
    return component;
  }
}

/**
 * Gravity Component - 重力组件
 * @description 实现 IGravity 接口,标记实体受重力影响
 */
export class Gravity implements IGravity {
  /** 重力缩放因子 */
  scale: number = 1;

  /**
   * 从 IGravity 规范数据创建组件
   * @param data IGravity 规范数据
   * @returns Gravity 组件实例
   */
  static fromData(data: IGravity): Gravity {
    const component = new Gravity();
    component.scale = data.scale;
    return component;
  }
}

/**
 * Damping Component - 阻尼组件
 * @description 实现 IDamping 接口,线性和角速度阻尼
 */
export class Damping implements IDamping {
  /** 线性阻尼 (0-1) */
  linear: number = 0.01;

  /** 角阻尼 (0-1) */
  angular: number = 0.01;

  /**
   * 从 IDamping 规范数据创建组件
   * @param data IDamping 规范数据
   * @returns Damping 组件实例
   */
  static fromData(data: IDamping): Damping {
    const component = new Damping();
    component.linear = data.linear;
    component.angular = data.angular;
    return component;
  }
}
