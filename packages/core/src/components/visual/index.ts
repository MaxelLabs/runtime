/**
 * Visual Components
 * 基于 specification 的视觉渲染相关数据组件
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策：fromData 接受 Specification 接口类型
 *
 * 所有组件的 `fromData()` 方法直接接受 Specification 中定义的接口类型（如 `IMeshRef`、`ColorLike`），
 * 而不是 `Partial<T>` 类型。这是基于以下考虑：
 *
 * 1. **类型安全**: Specification 接口定义了数据的完整契约，fromData 应该验证输入符合契约
 * 2. **数据来源明确**: 组件数据通常来自序列化的场景文件或 API，这些数据应该是完整的
 * 3. **职责分离**: 如果需要部分数据创建，应该在调用方处理默认值，而不是在组件内部
 * 4. **与 Specification 对齐**: 保持与 specification 包的类型一致性
 * 5. **API 一致性**: 与 Transform 组件保持相同的设计模式
 *
 * 如果确实需要从部分数据创建组件，可以：
 * - 使用 `new Component()` 创建默认实例，然后手动赋值
 * - 在调用方使用展开运算符合并默认值：`Component.fromData({ ...defaults, ...partialData })`
 *
 * ## 关于 enabled 属性命名
 *
 * 某些组件（如 MaterialRef）需要区分两种启用状态：
 * - `enabled`: 继承自 Component 基类，控制组件本身是否启用
 * - `materialEnabled` 等: 接口定义的特定启用状态
 *
 * 为避免命名冲突，specification 包中的接口使用明确的命名（如 `materialEnabled`）
 * 而不是继承 `Enableable` trait。
 */

import type {
  ColorLike,
  BaseTextureRef,
  TextureTransform,
  TextureSampler,
  IMeshRef,
  IMaterialRef,
  IVisible,
  ILayer,
  ICastShadow,
  IReceiveShadow,
} from '@maxellabs/specification';
import { Component } from '../base/component';

/**
 * MeshRef Component - 网格引用组件
 * @description 继承 Component 基类，实现 IMeshRef 接口，引用外部网格资源
 */
export class MeshRef extends Component implements IMeshRef {
  /** 网格资源 ID */
  assetId: string = '';

  /** 网格名称 (用于多网格资源) */
  meshName?: string;

  /** 子网格索引 */
  submeshIndex?: number;

  /**
   * 从 IMeshRef 规范数据创建组件
   * @param data IMeshRef 规范数据
   * @returns MeshRef 组件实例
   */
  static fromData(data: IMeshRef): MeshRef {
    const component = new MeshRef();
    component.assetId = data.assetId;
    if (data.meshName !== undefined) {
      component.meshName = data.meshName;
    }
    if (data.submeshIndex !== undefined) {
      component.submeshIndex = data.submeshIndex;
    }
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 MeshRef 实例
   */
  override clone(): MeshRef {
    const cloned = new MeshRef();
    cloned.assetId = this.assetId;
    if (this.meshName !== undefined) {
      cloned.meshName = this.meshName;
    }
    if (this.submeshIndex !== undefined) {
      cloned.submeshIndex = this.submeshIndex;
    }
    return cloned;
  }
}

/**
 * MaterialRef Component - 材质引用组件
 * @description 继承 Component 基类，实现 IMaterialRef 接口，引用外部材质资源
 *
 * @remarks
 * ## 关于 enabled 属性
 *
 * 此组件有两个独立的启用状态：
 * - `enabled`: 继承自 Component 基类，控制组件本身是否启用
 * - `materialEnabled`: IMaterialRef 接口定义，控制材质是否启用
 *
 * 这两个属性语义不同，不应混淆：
 * - 当 `enabled = false` 时，整个组件被禁用，系统可能跳过处理此组件
 * - 当 `materialEnabled = false` 时，组件仍然活跃，但材质效果被禁用
 */
export class MaterialRef extends Component implements IMaterialRef {
  /** 材质资源 ID */
  assetId: string = '';

  /** 材质参数覆盖 */
  overrides?: Record<string, unknown>;

  /** 材质是否启用（独立于组件的 enabled 状态） */
  materialEnabled?: boolean;

  /**
   * 从 IMaterialRef 规范数据创建组件
   * @param data IMaterialRef 规范数据
   * @returns MaterialRef 组件实例
   */
  static fromData(data: IMaterialRef): MaterialRef {
    const component = new MaterialRef();
    component.assetId = data.assetId;
    if (data.overrides !== undefined) {
      component.overrides = { ...data.overrides };
    }
    if (data.materialEnabled !== undefined) {
      component.materialEnabled = data.materialEnabled;
    }
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 MaterialRef 实例
   */
  override clone(): MaterialRef {
    const cloned = new MaterialRef();
    cloned.assetId = this.assetId;
    if (this.overrides !== undefined) {
      cloned.overrides = { ...this.overrides };
    }
    if (this.materialEnabled !== undefined) {
      cloned.materialEnabled = this.materialEnabled;
    }
    return cloned;
  }
}

/**
 * TextureRef Component - 纹理引用组件
 * @description 继承 Component 基类，实现 BaseTextureRef 接口，引用外部纹理资源
 */
export class TextureRef extends Component implements BaseTextureRef {
  /** 纹理资源 ID */
  assetId: string = '';

  /** 纹理槽/用途 */
  slot?: string;

  /** UV 通道 */
  uvChannel?: number;

  /** UV 变换 */
  transform?: TextureTransform;

  /** 采样器配置 */
  sampler?: TextureSampler;

  /** 强度/影响度 */
  intensity?: number;

  /**
   * 从 BaseTextureRef 规范数据创建组件
   * @param data BaseTextureRef 规范数据
   * @returns TextureRef 组件实例
   */
  static fromData(data: BaseTextureRef): TextureRef {
    const component = new TextureRef();
    component.assetId = data.assetId;
    if (data.slot !== undefined) {
      component.slot = data.slot;
    }
    if (data.uvChannel !== undefined) {
      component.uvChannel = data.uvChannel;
    }
    if (data.transform !== undefined) {
      // 深拷贝 transform 对象
      component.transform = {
        scale: data.transform.scale ? { ...data.transform.scale } : undefined,
        offset: data.transform.offset ? { ...data.transform.offset } : undefined,
        rotation: data.transform.rotation,
      };
    }
    if (data.sampler !== undefined) {
      // 深拷贝 sampler 对象
      component.sampler = { ...data.sampler };
    }
    if (data.intensity !== undefined) {
      component.intensity = data.intensity;
    }
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 TextureRef 实例
   * @remarks
   * 使用深拷贝确保嵌套对象不会共享引用
   */
  override clone(): TextureRef {
    const cloned = new TextureRef();
    cloned.assetId = this.assetId;
    if (this.slot !== undefined) {
      cloned.slot = this.slot;
    }
    if (this.uvChannel !== undefined) {
      cloned.uvChannel = this.uvChannel;
    }
    if (this.transform !== undefined) {
      cloned.transform = {
        scale: this.transform.scale ? { ...this.transform.scale } : undefined,
        offset: this.transform.offset ? { ...this.transform.offset } : undefined,
        rotation: this.transform.rotation,
      };
    }
    if (this.sampler !== undefined) {
      // 深拷贝 sampler 对象，确保所有属性都被复制
      // TextureSampler 接口定义的属性：wrapS, wrapT, minFilter, magFilter
      cloned.sampler = {
        wrapS: this.sampler.wrapS,
        wrapT: this.sampler.wrapT,
        minFilter: this.sampler.minFilter,
        magFilter: this.sampler.magFilter,
      };
    }
    if (this.intensity !== undefined) {
      cloned.intensity = this.intensity;
    }
    return cloned;
  }
}

/**
 * Color Component - 颜色组件
 * @description 继承 Component 基类，实现 ColorLike 接口，RGBA 颜色数据
 */
export class Color extends Component implements ColorLike {
  /** 红色通道 (0-1) */
  r: number = 1;

  /** 绿色通道 (0-1) */
  g: number = 1;

  /** 蓝色通道 (0-1) */
  b: number = 1;

  /** 透明度通道 (0-1) */
  a: number = 1;

  /**
   * 从 ColorLike 规范数据创建组件
   * @param data ColorLike 规范数据
   * @returns Color 组件实例
   */
  static fromData(data: ColorLike): Color {
    const component = new Color();
    component.r = data.r;
    component.g = data.g;
    component.b = data.b;
    component.a = data.a;
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 Color 实例
   */
  override clone(): Color {
    const cloned = new Color();
    cloned.r = this.r;
    cloned.g = this.g;
    cloned.b = this.b;
    cloned.a = this.a;
    return cloned;
  }
}

/**
 * Visible Component - 可见性组件
 * @description 继承 Component 基类，实现 IVisible 接口，控制实体渲染可见性
 */
export class Visible extends Component implements IVisible {
  /** 是否可见 */
  value: boolean = true;

  /**
   * 从 IVisible 规范数据创建组件
   * @param data IVisible 规范数据
   * @returns Visible 组件实例
   */
  static fromData(data: IVisible): Visible {
    const component = new Visible();
    component.value = data.value;
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 Visible 实例
   */
  override clone(): Visible {
    const cloned = new Visible();
    cloned.value = this.value;
    return cloned;
  }
}

/**
 * Layer Component - 渲染层级组件
 * @description 继承 Component 基类，实现 ILayer 接口，控制实体所属渲染层
 */
export class Layer extends Component implements ILayer {
  /** 层级掩码 (32位) */
  mask: number = 1;

  /**
   * 从 ILayer 规范数据创建组件
   * @param data ILayer 规范数据
   * @returns Layer 组件实例
   */
  static fromData(data: ILayer): Layer {
    const component = new Layer();
    component.mask = data.mask;
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 Layer 实例
   */
  override clone(): Layer {
    const cloned = new Layer();
    cloned.mask = this.mask;
    return cloned;
  }
}

/**
 * CastShadow Component - 投射阴影组件
 * @description 继承 Component 基类，实现 ICastShadow 接口，控制实体是否投射阴影
 */
export class CastShadow extends Component implements ICastShadow {
  /** 是否投射阴影 */
  value: boolean = true;

  /**
   * 从 ICastShadow 规范数据创建组件
   * @param data ICastShadow 规范数据
   * @returns CastShadow 组件实例
   */
  static fromData(data: ICastShadow): CastShadow {
    const component = new CastShadow();
    component.value = data.value;
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 CastShadow 实例
   */
  override clone(): CastShadow {
    const cloned = new CastShadow();
    cloned.value = this.value;
    return cloned;
  }
}

/**
 * ReceiveShadow Component - 接收阴影组件
 * @description 继承 Component 基类，实现 IReceiveShadow 接口，控制实体是否接收阴影
 */
export class ReceiveShadow extends Component implements IReceiveShadow {
  /** 是否接收阴影 */
  value: boolean = true;

  /**
   * 从 IReceiveShadow 规范数据创建组件
   * @param data IReceiveShadow 规范数据
   * @returns ReceiveShadow 组件实例
   */
  static fromData(data: IReceiveShadow): ReceiveShadow {
    const component = new ReceiveShadow();
    component.value = data.value;
    return component;
  }

  /**
   * 克隆组件
   * @returns 克隆的 ReceiveShadow 实例
   */
  override clone(): ReceiveShadow {
    const cloned = new ReceiveShadow();
    cloned.value = this.value;
    return cloned;
  }
}
