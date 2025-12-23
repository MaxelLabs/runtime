/**
 * SceneComponentRegistry 模块测试
 * 测试场景组件注册表功能
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  SceneComponentRegistry,
  getSceneComponentRegistry,
  type ComponentFactory,
} from '../../src/scene/component-registry';
import { LocalTransform } from '../../src/components/transform';
import type { Name } from '../../src/components/data';
import type { Camera } from '../../src/components/camera';
import type { DirectionalLight } from '../../src/components/light';

describe('SceneComponentRegistry', () => {
  beforeEach(() => {
    // 重置单例以确保测试隔离
    SceneComponentRegistry.resetInstance();
  });

  afterEach(() => {
    SceneComponentRegistry.resetInstance();
  });

  describe('单例模式', () => {
    it('应该返回相同的实例', () => {
      const instance1 = SceneComponentRegistry.getInstance();
      const instance2 = SceneComponentRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('应该在重置后返回新实例', () => {
      const instance1 = SceneComponentRegistry.getInstance();
      SceneComponentRegistry.resetInstance();
      const instance2 = SceneComponentRegistry.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('核心组件注册', () => {
    it('应该自动注册 Transform 组件', () => {
      const registry = SceneComponentRegistry.getInstance();
      expect(registry.has('LocalTransform')).toBe(true);
      expect(registry.has('WorldTransform')).toBe(true);
      expect(registry.has('Parent')).toBe(true);
      expect(registry.has('Children')).toBe(true);
    });

    it('应该自动注册 Data 组件', () => {
      const registry = SceneComponentRegistry.getInstance();
      expect(registry.has('Name')).toBe(true);
      expect(registry.has('Tag')).toBe(true);
      expect(registry.has('Tags')).toBe(true);
      expect(registry.has('Disabled')).toBe(true);
      expect(registry.has('Static')).toBe(true);
      expect(registry.has('Metadata')).toBe(true);
    });

    it('应该自动注册 Visual 组件', () => {
      const registry = SceneComponentRegistry.getInstance();
      expect(registry.has('Visible')).toBe(true);
      expect(registry.has('Layer')).toBe(true);
      expect(registry.has('MeshRef')).toBe(true);
      expect(registry.has('MaterialRef')).toBe(true);
      expect(registry.has('TextureRef')).toBe(true);
      expect(registry.has('CastShadow')).toBe(true);
      expect(registry.has('ReceiveShadow')).toBe(true);
    });

    it('应该自动注册 Camera 组件', () => {
      const registry = SceneComponentRegistry.getInstance();
      expect(registry.has('Camera')).toBe(true);
    });

    it('应该自动注册 Light 组件', () => {
      const registry = SceneComponentRegistry.getInstance();
      expect(registry.has('DirectionalLight')).toBe(true);
      expect(registry.has('PointLight')).toBe(true);
      expect(registry.has('SpotLight')).toBe(true);
      expect(registry.has('AmbientLight')).toBe(true);
    });

    it('应该自动注册 Animation 组件', () => {
      const registry = SceneComponentRegistry.getInstance();
      expect(registry.has('AnimationState')).toBe(true);
    });

    it('应该自动注册 Layout 组件', () => {
      const registry = SceneComponentRegistry.getInstance();
      expect(registry.has('SizeConstraint')).toBe(true);
      expect(registry.has('Anchor')).toBe(true);
      expect(registry.has('Margin')).toBe(true);
      expect(registry.has('Padding')).toBe(true);
      expect(registry.has('FlexContainer')).toBe(true);
      expect(registry.has('FlexItem')).toBe(true);
      expect(registry.has('LayoutResult')).toBe(true);
    });
  });

  describe('register', () => {
    it('应该注册自定义组件', () => {
      const registry = SceneComponentRegistry.getInstance();

      class CustomComponent {
        value = 0;
        static fromData(data: Record<string, unknown>) {
          const instance = new CustomComponent();
          instance.value = (data.value as number) ?? 0;
          return instance;
        }
      }

      registry.register('CustomComponent', CustomComponent);

      expect(registry.has('CustomComponent')).toBe(true);
      expect(registry.getComponentClass('CustomComponent')).toBe(CustomComponent);
    });

    it('应该支持自定义工厂函数', () => {
      const registry = SceneComponentRegistry.getInstance();

      class CustomComponent {
        value = 0;
      }

      const factory: ComponentFactory<CustomComponent> = (data) => {
        const instance = new CustomComponent();
        instance.value = (data.value as number) * 2;
        return instance;
      };

      registry.register('CustomComponent', CustomComponent, { factory });

      const component = registry.createComponent<CustomComponent>('CustomComponent', { value: 5 });
      expect(component?.value).toBe(10);
    });

    it('应该覆盖已存在的注册', () => {
      const registry = SceneComponentRegistry.getInstance();

      class Component1 {
        type = 1;
      }
      class Component2 {
        type = 2;
      }

      registry.register('TestComponent', Component1);
      registry.register('TestComponent', Component2);

      expect(registry.getComponentClass('TestComponent')).toBe(Component2);
    });
  });

  describe('unregister', () => {
    it('应该取消注册组件', () => {
      const registry = SceneComponentRegistry.getInstance();

      class CustomComponent {}
      registry.register('CustomComponent', CustomComponent);

      const result = registry.unregister('CustomComponent');

      expect(result).toBe(true);
      expect(registry.has('CustomComponent')).toBe(false);
    });

    it('应该返回 false 如果组件不存在', () => {
      const registry = SceneComponentRegistry.getInstance();

      const result = registry.unregister('NonExistent');

      expect(result).toBe(false);
    });
  });

  describe('has', () => {
    it('应该返回 true 如果组件已注册', () => {
      const registry = SceneComponentRegistry.getInstance();
      expect(registry.has('LocalTransform')).toBe(true);
    });

    it('应该返回 false 如果组件未注册', () => {
      const registry = SceneComponentRegistry.getInstance();
      expect(registry.has('NonExistent')).toBe(false);
    });
  });

  describe('getComponentClass', () => {
    it('应该返回组件类', () => {
      const registry = SceneComponentRegistry.getInstance();
      expect(registry.getComponentClass('LocalTransform')).toBe(LocalTransform);
    });

    it('应该返回 undefined 如果组件未注册', () => {
      const registry = SceneComponentRegistry.getInstance();
      expect(registry.getComponentClass('NonExistent')).toBeUndefined();
    });
  });

  describe('createComponent', () => {
    it('应该使用 fromData 创建组件', () => {
      const registry = SceneComponentRegistry.getInstance();

      const component = registry.createComponent<Name>('Name', { value: 'TestName' });

      expect(component).not.toBeNull();
      expect(component?.value).toBe('TestName');
    });

    it('应该使用工厂函数创建组件', () => {
      const registry = SceneComponentRegistry.getInstance();

      class CustomComponent {
        value = 0;
      }

      const factory: ComponentFactory<CustomComponent> = (data) => {
        const instance = new CustomComponent();
        instance.value = (data.value as number) * 3;
        return instance;
      };

      registry.register('CustomComponent', CustomComponent, { factory });

      const component = registry.createComponent<CustomComponent>('CustomComponent', { value: 10 });
      expect(component?.value).toBe(30);
    });

    it('应该回退到直接实例化', () => {
      const registry = SceneComponentRegistry.getInstance();

      class SimpleComponent {
        value = 0;
      }

      registry.register('SimpleComponent', SimpleComponent);

      const component = registry.createComponent<SimpleComponent>('SimpleComponent', { value: 42 });
      expect(component).not.toBeNull();
      expect(component?.value).toBe(42);
    });

    it('应该忽略不存在的属性', () => {
      const registry = SceneComponentRegistry.getInstance();

      class SimpleComponent {
        value = 0;
      }

      registry.register('SimpleComponent', SimpleComponent);

      const component = registry.createComponent<SimpleComponent>('SimpleComponent', {
        value: 42,
        nonExistent: 'ignored',
      });
      expect(component).not.toBeNull();
      expect(component?.value).toBe(42);
      expect((component as any).nonExistent).toBeUndefined();
    });

    it('应该返回 null 如果组件未注册', () => {
      const registry = SceneComponentRegistry.getInstance();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const component = registry.createComponent('NonExistent', {});

      expect(component).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown component type'));

      consoleSpy.mockRestore();
    });

    it('应该处理创建错误', () => {
      const registry = SceneComponentRegistry.getInstance();

      class ErrorComponent {
        static fromData() {
          throw new Error('Creation error');
        }
      }

      registry.register('ErrorComponent', ErrorComponent);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const component = registry.createComponent('ErrorComponent', {});

      expect(component).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to create component'), expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('应该创建 LocalTransform 组件', () => {
      const registry = SceneComponentRegistry.getInstance();

      const component = registry.createComponent<LocalTransform>('LocalTransform', {
        position: [1, 2, 3],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1],
      });

      expect(component).not.toBeNull();
    });

    it('应该创建 Camera 组件', () => {
      const registry = SceneComponentRegistry.getInstance();

      const component = registry.createComponent<Camera>('Camera', {
        fov: 60,
        near: 0.1,
        far: 1000,
        aspect: 1.777,
      });

      expect(component).not.toBeNull();
    });

    it('应该创建 DirectionalLight 组件', () => {
      const registry = SceneComponentRegistry.getInstance();

      const component = registry.createComponent<DirectionalLight>('DirectionalLight', {
        color: [1, 1, 1],
        intensity: 1,
        direction: [0, -1, 0],
      });

      expect(component).not.toBeNull();
    });
  });

  describe('getRegisteredTypes', () => {
    it('应该返回所有已注册的类型', () => {
      const registry = SceneComponentRegistry.getInstance();

      const types = registry.getRegisteredTypes();

      expect(types).toContain('LocalTransform');
      expect(types).toContain('WorldTransform');
      expect(types).toContain('Name');
      expect(types).toContain('Camera');
      expect(types.length).toBeGreaterThan(20);
    });
  });

  describe('getStats', () => {
    it('应该返回统计信息', () => {
      const registry = SceneComponentRegistry.getInstance();

      const stats = registry.getStats();

      expect(stats.totalRegistered).toBeGreaterThan(20);
      expect(stats.types).toContain('LocalTransform');
      expect(stats.types.length).toBe(stats.totalRegistered);
    });
  });

  describe('getSceneComponentRegistry', () => {
    it('应该返回单例实例', () => {
      const registry1 = getSceneComponentRegistry();
      const registry2 = getSceneComponentRegistry();

      expect(registry1).toBe(registry2);
      expect(registry1).toBe(SceneComponentRegistry.getInstance());
    });
  });
});
