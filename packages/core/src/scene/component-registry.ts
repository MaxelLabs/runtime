/**
 * Scene Component Registry
 * 场景组件注册表 - 用于场景数据反序列化
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策
 *
 * SceneComponentRegistry 提供组件类型标识符到组件类的映射，用于：
 * 1. 场景数据反序列化时查找组件类
 * 2. 支持自定义组件扩展
 * 3. 提供类型安全的组件实例化
 *
 * ## 与 ECS ComponentRegistry 的区别
 *
 * - ECS ComponentRegistry: 管理组件类型 ID（数字）和存储
 * - SceneComponentRegistry: 管理组件类型标识符（字符串）到组件类的映射，用于序列化/反序列化
 *
 * ## 使用流程
 *
 * ```
 * 1. 注册组件: registry.register('MeshRef', MeshRef)
 * 2. 反序列化: const component = registry.createComponent('MeshRef', data)
 * ```
 */

import type { ComponentClass } from '../ecs';

// Import all core components
import { LocalTransform, WorldTransform, Parent, Children } from '../components/transform';
import { Name, Tag, Tags, Disabled, Static, Metadata } from '../components/data';
import { Visible, Layer, MeshRef, MaterialRef, TextureRef, CastShadow, ReceiveShadow } from '../components/visual';
import { Camera } from '../components/camera';
import { DirectionalLight, PointLight, SpotLight, AmbientLight } from '../components/light';
import { AnimationState } from '../components/animation';
import { SizeConstraint, Anchor, Margin, Padding, FlexContainer, FlexItem, LayoutResult } from '../components/layout';

/**
 * 组件工厂函数类型
 */
export type ComponentFactory<T = unknown> = (data: Record<string, unknown>) => T;

/**
 * 组件注册信息
 */
export interface ComponentRegistration<T = unknown> {
  /** 组件类 */
  componentClass: ComponentClass<T>;
  /** 工厂函数（可选，默认使用 fromData） */
  factory?: ComponentFactory<T>;
}

/**
 * SceneComponentRegistry - 场景组件注册表
 * 管理组件类型标识符到组件类的映射
 */
export class SceneComponentRegistry {
  /** 单例实例 */
  private static _instance: SceneComponentRegistry | null = null;

  /** 组件注册表 */
  private registrations: Map<string, ComponentRegistration> = new Map();

  /**
   * 获取单例实例
   */
  static getInstance(): SceneComponentRegistry {
    if (!SceneComponentRegistry._instance) {
      SceneComponentRegistry._instance = new SceneComponentRegistry();
      SceneComponentRegistry._instance.registerCoreComponents();
    }
    return SceneComponentRegistry._instance;
  }

  /**
   * 重置单例（用于测试）
   */
  static resetInstance(): void {
    SceneComponentRegistry._instance = null;
  }

  /**
   * 注册核心组件
   */
  private registerCoreComponents(): void {
    // Transform Components
    this.register('LocalTransform', LocalTransform);
    this.register('WorldTransform', WorldTransform);
    this.register('Parent', Parent);
    this.register('Children', Children);

    // Data Components
    this.register('Name', Name);
    this.register('Tag', Tag);
    this.register('Tags', Tags);
    this.register('Disabled', Disabled);
    this.register('Static', Static);
    this.register('Metadata', Metadata);

    // Visual Components
    this.register('Visible', Visible);
    this.register('Layer', Layer);
    this.register('MeshRef', MeshRef);
    this.register('MaterialRef', MaterialRef);
    this.register('TextureRef', TextureRef);
    this.register('CastShadow', CastShadow);
    this.register('ReceiveShadow', ReceiveShadow);

    // Camera Component
    this.register('Camera', Camera);

    // Light Components
    this.register('DirectionalLight', DirectionalLight);
    this.register('PointLight', PointLight);
    this.register('SpotLight', SpotLight);
    this.register('AmbientLight', AmbientLight);

    // Animation Component
    this.register('AnimationState', AnimationState);

    // Layout Components
    this.register('SizeConstraint', SizeConstraint);
    this.register('Anchor', Anchor);
    this.register('Margin', Margin);
    this.register('Padding', Padding);
    this.register('FlexContainer', FlexContainer);
    this.register('FlexItem', FlexItem);
    this.register('LayoutResult', LayoutResult);
  }

  /**
   * 注册组件
   * @param typeId 组件类型标识符
   * @param componentClass 组件类
   * @param factory 可选的工厂函数
   */
  register<T>(typeId: string, componentClass: ComponentClass<T>, factory?: ComponentFactory<T>): void {
    this.registrations.set(typeId, {
      componentClass: componentClass as ComponentClass,
      factory: factory as ComponentFactory | undefined,
    });
  }

  /**
   * 取消注册组件
   * @param typeId 组件类型标识符
   */
  unregister(typeId: string): boolean {
    return this.registrations.delete(typeId);
  }

  /**
   * 检查组件是否已注册
   * @param typeId 组件类型标识符
   */
  has(typeId: string): boolean {
    return this.registrations.has(typeId);
  }

  /**
   * 获取组件类
   * @param typeId 组件类型标识符
   */
  getComponentClass<T = unknown>(typeId: string): ComponentClass<T> | undefined {
    return this.registrations.get(typeId)?.componentClass as ComponentClass<T> | undefined;
  }

  /**
   * 创建组件实例
   * @param typeId 组件类型标识符
   * @param data 组件数据
   */
  createComponent<T = unknown>(typeId: string, data: Record<string, unknown>): T | null {
    const registration = this.registrations.get(typeId);
    if (!registration) {
      console.warn(`[ComponentRegistry] Unknown component type: ${typeId}`);
      return null;
    }

    try {
      // 优先使用工厂函数
      if (registration.factory) {
        return registration.factory(data) as T;
      }

      // 使用 fromData 静态方法
      const componentClass = registration.componentClass as ComponentClass<T> & {
        fromData?: (data: Record<string, unknown>) => T;
      };

      if (typeof componentClass.fromData === 'function') {
        return componentClass.fromData(data);
      }

      // 回退：直接实例化并赋值
      const instance = new componentClass() as Record<string, unknown>;
      for (const [key, value] of Object.entries(data)) {
        if (key in instance) {
          instance[key] = value;
        }
      }
      return instance as T;
    } catch (error) {
      console.error(`[ComponentRegistry] Failed to create component ${typeId}:`, error);
      return null;
    }
  }

  /**
   * 获取所有已注册的组件类型
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * 获取注册表统计信息
   */
  getStats(): { totalRegistered: number; types: string[] } {
    return {
      totalRegistered: this.registrations.size,
      types: this.getRegisteredTypes(),
    };
  }
}

/**
 * 获取默认场景组件注册表实例
 */
export function getSceneComponentRegistry(): SceneComponentRegistry {
  return SceneComponentRegistry.getInstance();
}
