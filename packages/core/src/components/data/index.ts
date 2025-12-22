/**
 * Data Components
 * 基于 specification 的元数据和标签相关数据组件
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策：fromData 接受 Specification 接口类型
 *
 * 所有组件的 `fromData()` 方法直接接受 Specification 中定义的接口类型（如 `IName`、`ITag`），
 * 而不是 `Partial<T>` 类型。这是基于以下考虑：
 *
 * 1. **类型安全**: Specification 接口定义了数据的完整契约，fromData 应该验证输入符合契约
 * 2. **数据来源明确**: 组件数据通常来自序列化的场景文件或 API，这些数据应该是完整的
 * 3. **职责分离**: 如果需要部分数据创建，应该在调用方处理默认值，而不是在组件内部
 * 4. **与 Specification 对齐**: 保持与 specification 包的类型一致性
 */

import type { IName, ITag, ITags, IDisabled, IMetadata, IStatic } from '@maxellabs/specification';

/**
 * Name Component - 名称组件
 * @description 实现 IName 接口,存储实体的可读名称
 */
export class Name implements IName {
  /** 名称值 */
  value: string = '';

  /**
   * 从 IName 规范数据创建组件
   * @param data IName 规范数据
   * @returns Name 组件实例
   */
  static fromData(data: IName): Name {
    const component = new Name();
    component.value = data.value;
    return component;
  }
}

/**
 * Tag Component - 标签组件
 * @description 实现 ITag 接口,为实体添加单个字符串标签
 */
export class Tag implements ITag {
  /** 标签值 */
  value: string = '';

  /**
   * 从 ITag 规范数据创建组件
   * @param data ITag 规范数据
   * @returns Tag 组件实例
   */
  static fromData(data: ITag): Tag {
    const component = new Tag();
    component.value = data.value;
    return component;
  }
}

/**
 * Tags Component - 多标签组件
 * @description 实现 ITags 接口,为实体添加多个标签
 */
export class Tags implements ITags {
  /** 标签集合 */
  values: string[] = [];

  /**
   * 从 ITags 规范数据创建组件
   * @param data ITags 规范数据
   * @returns Tags 组件实例
   */
  static fromData(data: ITags): Tags {
    const component = new Tags();
    component.values = [...data.values];
    return component;
  }
}

/**
 * Metadata Component - 元数据组件
 * @description 实现 IMetadata 接口,存储实体的元数据信息
 */
export class Metadata implements IMetadata {
  /** 名称 */
  name?: string;

  /** 描述 */
  description?: string;

  /** 标签 */
  tags?: string[];

  /** 自定义数据 */
  customData?: Record<string, unknown>;

  /**
   * 从 IMetadata 规范数据创建组件
   * @param data IMetadata 规范数据
   * @returns Metadata 组件实例
   */
  static fromData(data: IMetadata): Metadata {
    const component = new Metadata();
    if (data.name !== undefined) {
      component.name = data.name;
    }
    if (data.description !== undefined) {
      component.description = data.description;
    }
    if (data.tags !== undefined) {
      component.tags = [...data.tags];
    }
    if (data.customData !== undefined) {
      component.customData = { ...data.customData };
    }
    return component;
  }
}

/**
 * Disabled Component - 禁用组件
 * @description 实现 IDisabled 接口,标记实体被禁用
 */
export class Disabled implements IDisabled {
  /** 禁用原因 */
  reason?: string;

  /**
   * 从 IDisabled 规范数据创建组件
   * @param data IDisabled 规范数据
   * @returns Disabled 组件实例
   */
  static fromData(data: IDisabled): Disabled {
    const component = new Disabled();
    if (data.reason !== undefined) {
      component.reason = data.reason;
    }
    return component;
  }
}

/**
 * Static Component - 静态标记组件
 * @description 实现 IStatic 接口,标记实体为静态 (变换不会改变,可以优化)
 *
 * @remarks
 * 这是一个纯标记组件（Tag Component），不包含任何数据字段。
 * 它的存在本身就表示实体具有"静态"属性，可用于：
 * - 跳过变换更新计算
 * - 启用静态批处理优化
 * - 标记不需要物理模拟的对象
 *
 * @example
 * ```typescript
 * // 方式1：直接创建
 * const staticTag = new Static();
 *
 * // 方式2：使用工厂方法（保持 API 一致性）
 * const staticTag = Static.fromData();
 * ```
 */
export class Static implements IStatic {
  /**
   * 创建 Static 组件实例
   *
   * @remarks
   * 作为标记组件，此方法不需要任何参数。
   * 保留此方法是为了与其他组件保持 API 一致性。
   *
   * @returns Static 组件实例
   */
  static fromData(): Static {
    return new Static();
  }
}
