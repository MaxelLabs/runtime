/**
 * Renderer Tests
 * 渲染器基类测试
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Renderer } from '../../src/renderer/renderer';
import type { RenderContext } from '../../src/renderer/render-context';
import type { RendererConfig } from '../../src/renderer/renderer';
import type { IRHIDevice } from '@maxellabs/specification';
import type { IScene } from '../../src/rhi/IScene';
import type { EntityId } from '../../src/ecs';
import type { IMaterialResource } from '@maxellabs/specification';

// Test Renderer implementation
class TestRenderer extends Renderer {
  public renderCalled = false;
  public onBeforeRenderCalled = false;
  public onAfterRenderCalled = false;

  protected render(_ctx: RenderContext): void {
    this.renderCalled = true;
  }

  protected override onBeforeRender(_ctx: RenderContext): void {
    this.onBeforeRenderCalled = true;
  }

  protected override onAfterRender(_ctx: RenderContext): void {
    this.onAfterRenderCalled = true;
  }
}

describe('Renderer', () => {
  let mockDevice: IRHIDevice;
  let mockScene: IScene;
  let mockCamera: EntityId;
  let config: RendererConfig;

  beforeEach(() => {
    mockDevice = {} as IRHIDevice;
    mockScene = {
      getMesh: jest.fn(),
      getMaterial: jest.fn(),
      getTexture: jest.fn(),
      world: {
        getComponent: jest.fn().mockReturnValue(null),
      },
    } as unknown as IScene;
    mockCamera = 1 as EntityId;

    config = {
      device: mockDevice,
      clearColor: [0.1, 0.1, 0.1, 1.0],
      clearDepth: true,
    };
  });

  describe('constructor', () => {
    it('should create renderer with config', () => {
      const renderer = new TestRenderer(config);

      expect(renderer.getDevice()).toBe(mockDevice);
      expect(renderer.getFrameCount()).toBe(0);
    });

    it('should apply default config values', () => {
      const minimalConfig: RendererConfig = { device: mockDevice };
      const renderer = new TestRenderer(minimalConfig);

      expect(renderer.getDevice()).toBe(mockDevice);
    });
  });

  describe('frame lifecycle', () => {
    it('should call beginFrame and endFrame', () => {
      const renderer = new TestRenderer(config);

      renderer.beginFrame();
      expect(() => renderer.endFrame()).not.toThrow();
    });

    it('should warn on nested beginFrame calls', () => {
      const renderer = new TestRenderer(config);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      renderer.beginFrame();
      renderer.beginFrame(); // Should warn

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already rendering'));

      renderer.endFrame();
      consoleSpy.mockRestore();
    });

    it('should warn on endFrame without beginFrame', () => {
      const renderer = new TestRenderer(config);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      renderer.endFrame(); // Should warn

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('without beginFrame'));
      consoleSpy.mockRestore();
    });

    it('should increment frame count', () => {
      const renderer = new TestRenderer(config);

      expect(renderer.getFrameCount()).toBe(0);

      renderer.beginFrame();
      renderer.endFrame();

      expect(renderer.getFrameCount()).toBe(1);

      renderer.beginFrame();
      renderer.endFrame();

      expect(renderer.getFrameCount()).toBe(2);
    });
  });

  describe('renderScene', () => {
    it('should call hooks in correct order', () => {
      const renderer = new TestRenderer(config);

      renderer.renderScene(mockScene, mockCamera);

      expect(renderer.onBeforeRenderCalled).toBe(true);
      expect(renderer.renderCalled).toBe(true);
      expect(renderer.onAfterRenderCalled).toBe(true);
    });

    it('should create render context', () => {
      const _renderer = new TestRenderer(config);
      let capturedContext: RenderContext | undefined;

      class ContextCaptureRenderer extends Renderer {
        protected render(ctx: RenderContext): void {
          capturedContext = ctx;
        }
      }

      const contextRenderer = new ContextCaptureRenderer(config);
      contextRenderer.renderScene(mockScene, mockCamera);

      expect(capturedContext).toBeDefined();
      expect(capturedContext!.scene).toBe(mockScene);
      expect(capturedContext!.camera).toBe(mockCamera);
      expect(capturedContext!.device).toBe(mockDevice);
    });
  });

  describe('material instance management', () => {
    it('should create material instance', () => {
      const renderer = new TestRenderer(config);
      const mockMaterial: IMaterialResource = {
        shaderId: 'pbr',
        properties: { baseColor: [1, 0, 0, 1] },
        textures: {},
      };

      const instance1 = renderer.createMaterialInstance(mockMaterial);
      expect(instance1).toBeDefined();
      expect(instance1.getShaderId()).toBe('pbr');
    });

    it('should cache material instances by shaderId', () => {
      const renderer = new TestRenderer(config);
      const mockMaterial: IMaterialResource = {
        shaderId: 'pbr',
        properties: {},
        textures: {},
      };

      const instance1 = renderer.createMaterialInstance(mockMaterial);
      const instance2 = renderer.createMaterialInstance(mockMaterial);

      expect(instance1).toBe(instance2); // Same instance
    });

    it('should create different instances for different shaders', () => {
      const renderer = new TestRenderer(config);
      const material1: IMaterialResource = {
        shaderId: 'pbr',
        properties: {},
        textures: {},
      };
      const material2: IMaterialResource = {
        shaderId: 'unlit',
        properties: {},
        textures: {},
      };

      const instance1 = renderer.createMaterialInstance(material1);
      const instance2 = renderer.createMaterialInstance(material2);

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('dispose', () => {
    it('should dispose all material instances', () => {
      const renderer = new TestRenderer(config);
      const mockMaterial: IMaterialResource = {
        shaderId: 'pbr',
        properties: {},
        textures: {},
      };

      const instance = renderer.createMaterialInstance(mockMaterial);
      const disposeSpy = jest.spyOn(instance, 'dispose');

      renderer.dispose();

      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should reset frame count', () => {
      const renderer = new TestRenderer(config);

      renderer.beginFrame();
      renderer.endFrame();
      expect(renderer.getFrameCount()).toBe(1);

      renderer.dispose();
      expect(renderer.getFrameCount()).toBe(0);
    });

    it('should be safe to call multiple times', () => {
      const renderer = new TestRenderer(config);

      renderer.dispose();
      expect(() => renderer.dispose()).not.toThrow();
    });
  });

  describe('extension points', () => {
    it('should allow subclass to customize render context', () => {
      class CustomContextRenderer extends Renderer {
        protected override createRenderContext(scene: IScene, camera: EntityId): RenderContext {
          const ctx = super.createRenderContext(scene, camera);
          ctx.customData = { shadowMap: 'custom-data' };
          return ctx;
        }

        protected render(_ctx: RenderContext): void {
          // No-op
        }
      }

      const _renderer = new CustomContextRenderer(config);
      let capturedContext: RenderContext | undefined;

      class ContextInspector extends CustomContextRenderer {
        protected override render(ctx: RenderContext): void {
          capturedContext = ctx;
        }
      }

      const inspector = new ContextInspector(config);
      inspector.renderScene(mockScene, mockCamera);

      expect(capturedContext).toBeDefined();
      expect(capturedContext!.customData).toEqual({ shadowMap: 'custom-data' });
    });
  });
});
