/**
 * Physics Components
 * 基于 specification 的物理模拟相关数据组件
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策
 *
 * 所有物理组件都继承自 Component 基类，提供：
 * - 引用计数管理（继承自 ReferResource）
 * - 组件启用/禁用状态
 * - 组件脏标记（用于优化更新）
 * - 组件所属实体引用
 *
 * ## 物理组件说明
 *
 * - `Velocity`, `Acceleration`, `AngularVelocity`: 继承 Component，实现 `Vector3Like` 接口，表示三维向量
 * - `Mass`, `Gravity`, `Damping`: 继承 Component，实现专用的 ECS 接口 (`IMass`, `IGravity`, `IDamping`)
 */

import type { Vector3Like, IMass, IGravity, IDamping } from '@maxellabs/specification';
import { Component } from '../base';

/**
 * Velocity Component - 速度组件
 * @description 继承 Component 基类，实现 Vector3Like 接口，存储实体的线性速度 (单位/秒)
 */
export class Velocity extends Component implements Vector3Like {
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

  /**
   * 克隆组件
   * @returns 克隆的 Velocity 实例
   */
  override clone(): Velocity {
    const cloned = new Velocity();
    cloned.x = this.x;
    cloned.y = this.y;
    cloned.z = this.z;
    return cloned;
  }
}

/**
 * Acceleration Component - 加速度组件
 * @description 继承 Component 基类，实现 Vector3Like 接口，存储实体的加速度 (单位/秒²)
 */
export class Acceleration extends Component implements Vector3Like {
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

  /**
   * 克隆组件
   * @returns 克隆的 Acceleration 实例
   */
  override clone(): Acceleration {
    const cloned = new Acceleration();
    cloned.x = this.x;
    cloned.y = this.y;
    cloned.z = this.z;
    return cloned;
  }
}

/**
 * AngularVelocity Component - 角速度组件
 * @description 继承 Component 基类，实现 Vector3Like 接口，存储实体的旋转速度 (弧度/秒)
 */
export class AngularVelocity extends Component implements Vector3Like {
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

  /**
   * 克隆组件
   * @returns 克隆的 AngularVelocity 实例
   */
  override clone(): AngularVelocity {
    const cloned = new AngularVelocity();
    cloned.x = this.x;
    cloned.y = this.y;
    cloned.z = this.z;
    return cloned;
  }
}

/**
 * Mass Component - 质量组件
 * @description 继承 Component 基类，实现 IMass 接口，存储实体的质量 (千克)
 */
export class Mass extends Component implements IMass {
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

  /**
   * 克隆组件
   * @returns 克隆的 Mass 实例
   */
  override clone(): Mass {
    const cloned = new Mass();
    cloned.value = this.value;
    if (this.infinite !== undefined) {
      cloned.infinite = this.infinite;
    }
    return cloned;
  }
}

/**
 * Gravity Component - 重力组件
 * @description 继承 Component 基类，实现 IGravity 接口，标记实体受重力影响
 */
export class Gravity extends Component implements IGravity {
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

  /**
   * 克隆组件
   * @returns 克隆的 Gravity 实例
   */
  override clone(): Gravity {
    const cloned = new Gravity();
    cloned.scale = this.scale;
    return cloned;
  }
}

/**
 * Damping Component - 阻尼组件
 * @description 继承 Component 基类，实现 IDamping 接口，线性和角速度阻尼
 */
export class Damping extends Component implements IDamping {
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

  /**
   * 克隆组件
   * @returns 克隆的 Damping 实例
   */
  override clone(): Damping {
    const cloned = new Damping();
    cloned.linear = this.linear;
    cloned.angular = this.angular;
    return cloned;
  }
}
