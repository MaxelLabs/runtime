/**
 * RenderContext Tests
 * 渲染上下文测试
 */

import { describe, it, expect } from '@jest/globals';
import { createEmptyRenderContext } from '../../src/renderer/render-context';
import type { IScene } from '../../src/rhi/IScene';
import type { EntityId } from '../../src/ecs';
import type { IRHIDevice } from '@maxellabs/specification';

describe('RenderContext', () => {
  describe('createEmptyRenderContext', () => {
    it('should create empty context with provided values', () => {
      const mockScene = {} as IScene;
      const mockCamera = 1 as EntityId;
      const mockDevice = {} as IRHIDevice;

      const ctx = createEmptyRenderContext(mockScene, mockCamera, mockDevice);

      expect(ctx.scene).toBe(mockScene);
      expect(ctx.camera).toBe(mockCamera);
      expect(ctx.device).toBe(mockDevice);
    });

    it('should initialize with empty renderables array', () => {
      const mockScene = {} as IScene;
      const mockCamera = 1 as EntityId;
      const mockDevice = {} as IRHIDevice;

      const ctx = createEmptyRenderContext(mockScene, mockCamera, mockDevice);

      expect(ctx.renderables).toEqual([]);
      expect(Array.isArray(ctx.renderables)).toBe(true);
    });

    it('should initialize matrices to null', () => {
      const mockScene = {} as IScene;
      const mockCamera = 1 as EntityId;
      const mockDevice = {} as IRHIDevice;

      const ctx = createEmptyRenderContext(mockScene, mockCamera, mockDevice);

      expect(ctx.viewMatrix).toBeNull();
      expect(ctx.projectionMatrix).toBeNull();
      expect(ctx.viewProjectionMatrix).toBeNull();
    });

    it('should initialize time and frameCount', () => {
      const mockScene = {} as IScene;
      const mockCamera = 1 as EntityId;
      const mockDevice = {} as IRHIDevice;

      const ctx = createEmptyRenderContext(mockScene, mockCamera, mockDevice);

      expect(ctx.time).toBe(0);
      expect(ctx.frameCount).toBe(0);
    });

    it('should not have customData by default', () => {
      const mockScene = {} as IScene;
      const mockCamera = 1 as EntityId;
      const mockDevice = {} as IRHIDevice;

      const ctx = createEmptyRenderContext(mockScene, mockCamera, mockDevice);

      expect(ctx.customData).toBeUndefined();
    });

    it('should allow modification of returned context', () => {
      const mockScene = {} as IScene;
      const mockCamera = 1 as EntityId;
      const mockDevice = {} as IRHIDevice;

      const ctx = createEmptyRenderContext(mockScene, mockCamera, mockDevice);

      // Modify context
      ctx.time = 1.5;
      ctx.frameCount = 100;
      ctx.customData = { test: 'value' };

      expect(ctx.time).toBe(1.5);
      expect(ctx.frameCount).toBe(100);
      expect(ctx.customData).toEqual({ test: 'value' });
    });
  });
});
