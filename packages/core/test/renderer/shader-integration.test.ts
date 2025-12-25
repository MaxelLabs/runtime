/**
 * shader-integration.test.ts
 * Renderer + ShaderCompiler 集成测试
 *
 * @remarks
 * 测试覆盖：
 * - Renderer 持有 ShaderCompiler
 * - MaterialInstance 与 ShaderCompiler 集成
 * - dispose 清理流程
 * - 完整的渲染流程模拟
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import type { IRHIDevice } from '@maxellabs/specification';
import { RHIBackend, RHIFeatureFlags } from '@maxellabs/specification';
import { Renderer, ShaderCompiler, type RendererConfig, type RenderContext } from '../../src/renderer';

/**
 * 创建 Mock IRHIDevice
 */
function createMockDevice(): IRHIDevice {
  return {
    info: {
      deviceName: 'Mock Device',
      vendorName: 'Mock Vendor',
      backend: RHIBackend.WebGL2,
      features: RHIFeatureFlags.VERTEX_ARRAY_OBJECT,
      maxTextureSize: 4096,
      supportsAnisotropy: false,
      supportsMSAA: false,
      maxSampleCount: 1,
      maxBindings: 16,
      shaderLanguageVersion: '1.0',
    },
    hasFeature: () => false,
    createBuffer: () => ({}) as any,
    createTexture: () => ({}) as any,
    createSampler: () => ({}) as any,
    createShaderModule: () => ({}) as any,
    createBindGroupLayout: () => ({}) as any,
    createPipelineLayout: () => ({}) as any,
    createBindGroup: () => ({}) as any,
    createRenderPipeline: () => ({}) as any,
    createComputePipeline: () => ({}) as any,
    createQuerySet: () => ({}) as any,
    createCommandEncoder: () => ({}) as any,
    submit: () => {},
    checkDeviceLost: async () => {},
    destroy: () => {},
  };
}

/**
 * 测试用 Renderer 实现
 */
class TestRenderer extends Renderer {
  shaderCompiler: ShaderCompiler;

  constructor(config: RendererConfig) {
    super(config);
    this.shaderCompiler = new ShaderCompiler({ device: this.getDevice() });
  }

  protected render(ctx: RenderContext): void {
    // Test implementation - 不执行实际渲染
  }

  override dispose(): void {
    this.shaderCompiler.dispose();
    super.dispose();
  }
}

describe('Renderer + ShaderCompiler Integration', () => {
  let renderer: TestRenderer;
  let mockDevice: IRHIDevice;

  beforeEach(() => {
    mockDevice = createMockDevice();
    renderer = new TestRenderer({ device: mockDevice });
  });

  afterEach(() => {
    renderer.dispose();
  });

  // ==================== 基础集成测试 ====================
  describe('basic integration', () => {
    test('Renderer 应该持有 ShaderCompiler 实例', () => {
      expect(renderer.shaderCompiler).toBeDefined();
      expect(renderer.shaderCompiler).toBeInstanceOf(ShaderCompiler);
    });

    test('ShaderCompiler 应该使用 Renderer 的 device', () => {
      expect(renderer.getDevice()).toBe(mockDevice);
    });

    test('应该能够编译着色器', async () => {
      const program = await renderer.shaderCompiler.compile(
        'void main() { gl_Position = vec4(0.0); }',
        'void main() { gl_FragColor = vec4(1.0); }'
      );

      expect(program).toBeDefined();
      expect(program.refCount).toBe(1);
    });
  });

  // ==================== MaterialInstance 集成测试 ====================
  describe('MaterialInstance integration', () => {
    test('应该能够创建 MaterialInstance', () => {
      const material = {
        shaderId: 'pbr',
        properties: {},
        textures: {},
      };

      const instance = renderer.createMaterialInstance(material);
      expect(instance).toBeDefined();
      expect(instance.getShaderId()).toBe('pbr');
    });

    test('应该能够为多个 MaterialInstance 共享着色器', async () => {
      const vs = 'vertex shader';
      const fs = 'fragment shader';

      const p1 = await renderer.shaderCompiler.compile(vs, fs);
      const p2 = await renderer.shaderCompiler.compile(vs, fs);

      expect(p1.id).toBe(p2.id);
      expect(p1.refCount).toBe(2);
    });
  });

  // ==================== dispose 清理测试 ====================
  describe('dispose cleanup', () => {
    test('应该在 dispose 时清理 ShaderCompiler', async () => {
      await renderer.shaderCompiler.compile('vs', 'fs');
      expect(renderer.shaderCompiler.getCacheSize()).toBe(1);

      renderer.dispose();

      expect(() => renderer.shaderCompiler.getCacheSize()).toThrow('disposed');
    });

    test('应该清理所有缓存的着色器', async () => {
      await renderer.shaderCompiler.compile('vs1', 'fs1');
      await renderer.shaderCompiler.compile('vs2', 'fs2');
      await renderer.shaderCompiler.compile('vs3', 'fs3');

      expect(renderer.shaderCompiler.getCacheSize()).toBe(3);

      renderer.dispose();

      expect(() => renderer.shaderCompiler.getCacheSize()).toThrow('disposed');
    });

    test('应该是幂等的', () => {
      renderer.dispose();
      expect(() => renderer.dispose()).not.toThrow();
    });
  });

  // ==================== 缓存行为测试 ====================
  describe('caching behavior', () => {
    test('应该缓存编译结果', async () => {
      const vs = 'vertex shader';
      const fs = 'fragment shader';

      const p1 = await renderer.shaderCompiler.compile(vs, fs);
      expect(renderer.shaderCompiler.getCacheSize()).toBe(1);

      const p2 = await renderer.shaderCompiler.compile(vs, fs);
      expect(renderer.shaderCompiler.getCacheSize()).toBe(1);

      expect(p1.id).toBe(p2.id);
      expect(p1.refCount).toBe(2);
    });

    test('应该为不同着色器创建不同缓存', async () => {
      await renderer.shaderCompiler.compile('vs1', 'fs1');
      await renderer.shaderCompiler.compile('vs2', 'fs2');

      expect(renderer.shaderCompiler.getCacheSize()).toBe(2);
    });
  });

  // ==================== 引用计数测试 ====================
  describe('reference counting', () => {
    test('应该正确管理引用计数', async () => {
      const vs = 'vertex shader';
      const fs = 'fragment shader';

      const p1 = await renderer.shaderCompiler.compile(vs, fs);
      expect(p1.refCount).toBe(1);

      const p2 = await renderer.shaderCompiler.compile(vs, fs);
      expect(p1.refCount).toBe(2);

      renderer.shaderCompiler.release(p1);
      expect(p1.refCount).toBe(1);

      renderer.shaderCompiler.release(p2);
      expect(renderer.shaderCompiler.getCacheSize()).toBe(0);
    });
  });

  // ==================== 错误处理测试 ====================
  describe('error handling', () => {
    test('应该处理空着色器源码', async () => {
      await expect(renderer.shaderCompiler.compile('', 'fs')).rejects.toThrow();
    });

    test('应该在 dispose 后拒绝编译', async () => {
      renderer.dispose();
      await expect(renderer.shaderCompiler.compile('vs', 'fs')).rejects.toThrow('disposed');
    });
  });

  // ==================== 多 Renderer 实例测试 ====================
  describe('multiple renderer instances', () => {
    test('应该支持多个 Renderer 实例', () => {
      const renderer2 = new TestRenderer({ device: mockDevice });

      expect(renderer.shaderCompiler).not.toBe(renderer2.shaderCompiler);

      renderer2.dispose();
    });

    test('不同 Renderer 的缓存应该独立', async () => {
      const renderer2 = new TestRenderer({ device: mockDevice });

      await renderer.shaderCompiler.compile('vs', 'fs');
      expect(renderer.shaderCompiler.getCacheSize()).toBe(1);
      expect(renderer2.shaderCompiler.getCacheSize()).toBe(0);

      await renderer2.shaderCompiler.compile('vs', 'fs');
      expect(renderer2.shaderCompiler.getCacheSize()).toBe(1);

      renderer2.dispose();
    });
  });

  // ==================== 性能测试 ====================
  describe('performance', () => {
    test('应该快速查询缓存', async () => {
      const vs = 'vertex shader';
      const fs = 'fragment shader';

      await renderer.shaderCompiler.compile(vs, fs);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        renderer.shaderCompiler.getProgram(vs, fs);
      }
      const end = performance.now();

      // 1000 次查询应该在 10ms 内完成
      expect(end - start).toBeLessThan(10);
    });

    test('应该快速计算哈希', async () => {
      const vs = 'vertex shader'.repeat(100);
      const fs = 'fragment shader'.repeat(100);

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        await renderer.shaderCompiler.compile(vs + i, fs + i);
      }
      const end = performance.now();

      // 100 次编译应该在合理时间内完成
      expect(end - start).toBeLessThan(1000);
    });
  });

  // ==================== 统计测试 ====================
  describe('statistics', () => {
    test('应该提供准确的缓存统计', async () => {
      expect(renderer.shaderCompiler.getCacheSize()).toBe(0);

      await renderer.shaderCompiler.compile('vs1', 'fs1');
      expect(renderer.shaderCompiler.getCacheSize()).toBe(1);

      await renderer.shaderCompiler.compile('vs2', 'fs2');
      expect(renderer.shaderCompiler.getCacheSize()).toBe(2);

      await renderer.shaderCompiler.compile('vs1', 'fs1');
      expect(renderer.shaderCompiler.getCacheSize()).toBe(2);
    });
  });
});
