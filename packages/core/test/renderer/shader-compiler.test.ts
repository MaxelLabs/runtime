/**
 * shader-compiler.test.ts
 * ShaderCompiler 单元测试
 *
 * @remarks
 * 测试覆盖：
 * - 构造函数与配置
 * - 编译与缓存
 * - 引用计数管理
 * - 错误处理
 * - Fallback 机制
 * - dispose 清理
 * - 统计接口
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import type { IRHIDevice, IRHIShaderModule } from '@maxellabs/specification';
import { RHIBackend, RHIFeatureFlags } from '@maxellabs/specification';
import { ShaderCompiler, ShaderCompilerError } from '../../src/renderer';

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
    createShaderModule: () => ({}) as IRHIShaderModule,
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

describe('ShaderCompiler', () => {
  let compiler: ShaderCompiler;
  let mockDevice: IRHIDevice;

  beforeEach(() => {
    mockDevice = createMockDevice();
    compiler = new ShaderCompiler({ device: mockDevice });
  });

  afterEach(() => {
    compiler.dispose();
  });

  // ==================== 构造函数测试 ====================
  describe('constructor', () => {
    test('应该创建编译器实例', () => {
      expect(compiler).toBeDefined();
      expect(compiler.getCacheSize()).toBe(0);
    });

    test('应该支持自定义配置', () => {
      const customCompiler = new ShaderCompiler({
        device: mockDevice,
        enableCache: false,
      });
      expect(customCompiler).toBeDefined();
      customCompiler.dispose();
    });

    test('应该支持 fallback 配置', () => {
      const fallbackCompiler = new ShaderCompiler({
        device: mockDevice,
        fallbackShader: {
          vertex: 'fallback vs',
          fragment: 'fallback fs',
        },
      });
      expect(fallbackCompiler).toBeDefined();
      fallbackCompiler.dispose();
    });
  });

  // ==================== 编译测试 ====================
  describe('compile', () => {
    const vertexShader = 'void main() { gl_Position = vec4(0.0); }';
    const fragmentShader = 'void main() { gl_FragColor = vec4(1.0); }';

    test('应该编译着色器程序', async () => {
      const program = await compiler.compile(vertexShader, fragmentShader);
      expect(program).toBeDefined();
      expect(program.id).toBeTruthy();
      expect(program.refCount).toBe(1);
    });

    test('应该缓存编译结果', async () => {
      const p1 = await compiler.compile(vertexShader, fragmentShader);
      const p2 = await compiler.compile(vertexShader, fragmentShader);

      expect(p1.id).toBe(p2.id);
      expect(p1.refCount).toBe(2);
      expect(compiler.getCacheSize()).toBe(1);
    });

    test('应该为不同源码生成不同程序', async () => {
      const p1 = await compiler.compile(vertexShader, fragmentShader);
      const p2 = await compiler.compile(vertexShader + '\n', fragmentShader);

      expect(p1.id).not.toBe(p2.id);
      expect(compiler.getCacheSize()).toBe(2);
    });

    test('应该在空源码时抛出错误', async () => {
      await expect(compiler.compile('', fragmentShader)).rejects.toThrow(ShaderCompilerError);
      await expect(compiler.compile(vertexShader, '')).rejects.toThrow(ShaderCompilerError);
    });

    test('应该在禁用缓存时不缓存', async () => {
      const noCacheCompiler = new ShaderCompiler({
        device: mockDevice,
        enableCache: false,
      });

      const p1 = await noCacheCompiler.compile(vertexShader, fragmentShader);
      const p2 = await noCacheCompiler.compile(vertexShader, fragmentShader);

      // 禁用缓存时，每次都创建新程序
      expect(p1.id).toBe(p2.id); // 哈希相同
      expect(p1.refCount).toBe(1); // 但不共享引用
      expect(p2.refCount).toBe(1);
      expect(noCacheCompiler.getCacheSize()).toBe(0);

      noCacheCompiler.dispose();
    });
  });

  // ==================== 缓存查询测试 ====================
  describe('getProgram', () => {
    const vertexShader = 'void main() { gl_Position = vec4(0.0); }';
    const fragmentShader = 'void main() { gl_FragColor = vec4(1.0); }';

    test('应该返回已缓存的程序', async () => {
      await compiler.compile(vertexShader, fragmentShader);
      const cached = compiler.getProgram(vertexShader, fragmentShader);

      expect(cached).toBeDefined();
      expect(cached?.refCount).toBe(1);
    });

    test('应该对未编译的着色器返回 undefined', () => {
      const program = compiler.getProgram('not compiled', 'not compiled');
      expect(program).toBeUndefined();
    });

    test('应该不增加引用计数', async () => {
      await compiler.compile(vertexShader, fragmentShader);
      const cached1 = compiler.getProgram(vertexShader, fragmentShader);
      const cached2 = compiler.getProgram(vertexShader, fragmentShader);

      expect(cached1?.refCount).toBe(1);
      expect(cached2?.refCount).toBe(1);
    });
  });

  // ==================== 释放测试 ====================
  describe('release', () => {
    const vertexShader = 'void main() { gl_Position = vec4(0.0); }';
    const fragmentShader = 'void main() { gl_FragColor = vec4(1.0); }';

    test('应该减少引用计数', async () => {
      const program = await compiler.compile(vertexShader, fragmentShader);
      expect(program.refCount).toBe(1);

      compiler.release(program);
      expect(compiler.getCacheSize()).toBe(0);
    });

    test('应该在 refCount = 0 时销毁程序', async () => {
      const p1 = await compiler.compile(vertexShader, fragmentShader);
      const p2 = await compiler.compile(vertexShader, fragmentShader);

      expect(p1.refCount).toBe(2);

      compiler.release(p1);
      expect(p1.refCount).toBe(1);
      expect(compiler.getCacheSize()).toBe(1);

      compiler.release(p2);
      expect(compiler.getCacheSize()).toBe(0);
    });

    test('应该处理释放不存在的程序', async () => {
      const program = await compiler.compile(vertexShader, fragmentShader);
      compiler.release(program);

      // 再次释放不应抛出错误
      expect(() => compiler.release(program)).not.toThrow();
    });
  });

  // ==================== dispose 测试 ====================
  describe('dispose', () => {
    test('应该清空所有缓存', async () => {
      await compiler.compile('vs1', 'fs1');
      await compiler.compile('vs2', 'fs2');

      expect(compiler.getCacheSize()).toBe(2);

      compiler.dispose();
      expect(() => compiler.getCacheSize()).toThrow('disposed');
    });

    test('应该防止 dispose 后使用', async () => {
      compiler.dispose();
      await expect(compiler.compile('vs', 'fs')).rejects.toThrow('disposed');
    });

    test('应该是幂等的', () => {
      compiler.dispose();
      expect(() => compiler.dispose()).not.toThrow();
    });

    test('应该防止 dispose 后查询', () => {
      compiler.dispose();
      expect(() => compiler.getProgram('vs', 'fs')).toThrow('disposed');
    });

    test('应该防止 dispose 后释放', async () => {
      const program = await compiler.compile('vs', 'fs');
      compiler.dispose();
      expect(() => compiler.release(program)).toThrow('disposed');
    });
  });

  // ==================== 统计测试 ====================
  describe('getCacheSize', () => {
    test('应该返回正确的缓存大小', async () => {
      expect(compiler.getCacheSize()).toBe(0);

      await compiler.compile('vs1', 'fs1');
      expect(compiler.getCacheSize()).toBe(1);

      await compiler.compile('vs2', 'fs2');
      expect(compiler.getCacheSize()).toBe(2);

      // 相同源码不增加缓存
      await compiler.compile('vs1', 'fs1');
      expect(compiler.getCacheSize()).toBe(2);
    });
  });

  // ==================== 哈希测试 ====================
  describe('hash computation', () => {
    test('应该为相同源码生成相同哈希', async () => {
      const p1 = await compiler.compile('vs', 'fs');
      const p2 = await compiler.compile('vs', 'fs');

      expect(p1.id).toBe(p2.id);
    });

    test('应该为不同源码生成不同哈希', async () => {
      const p1 = await compiler.compile('vs1', 'fs1');
      const p2 = await compiler.compile('vs2', 'fs2');

      expect(p1.id).not.toBe(p2.id);
    });

    test('应该区分顶点和片元着色器', async () => {
      const p1 = await compiler.compile('shader', 'different');
      const p2 = await compiler.compile('different', 'shader');

      expect(p1.id).not.toBe(p2.id);
    });

    test('应该对空格敏感', async () => {
      const p1 = await compiler.compile('vs', 'fs');
      const p2 = await compiler.compile('vs ', 'fs');

      expect(p1.id).not.toBe(p2.id);
    });
  });

  // ==================== 错误处理测试 ====================
  describe('error handling', () => {
    test('应该抛出 ShaderCompilerError', async () => {
      try {
        await compiler.compile('', 'fs');
        expect(true).toBe(false); // 不应到达这里
      } catch (error) {
        expect(error).toBeInstanceOf(ShaderCompilerError);
        expect((error as ShaderCompilerError).name).toBe('ShaderCompilerError');
      }
    });

    test('应该包含错误详情', async () => {
      try {
        await compiler.compile('', 'fs');
      } catch (error) {
        const compilerError = error as ShaderCompilerError;
        expect(compilerError.details).toBeDefined();
        expect(compilerError.details.originalError).toBeDefined();
      }
    });
  });

  // ==================== 引用计数测试 ====================
  describe('reference counting', () => {
    const vs = 'vertex shader';
    const fs = 'fragment shader';

    test('应该正确管理引用计数', async () => {
      const p1 = await compiler.compile(vs, fs);
      expect(p1.refCount).toBe(1);

      const p2 = await compiler.compile(vs, fs);
      expect(p1.refCount).toBe(2);
      expect(p2.refCount).toBe(2);

      // 确认 p1 和 p2 指向同一个程序
      expect(p1).toBe(p2);
    });

    test('应该在释放时递减引用计数', async () => {
      const p1 = await compiler.compile(vs, fs);
      const p2 = await compiler.compile(vs, fs);
      const p3 = await compiler.compile(vs, fs);

      expect(p1.refCount).toBe(3);

      compiler.release(p1);
      expect(p1.refCount).toBe(2);

      compiler.release(p2);
      expect(p1.refCount).toBe(1);

      compiler.release(p3);
      expect(compiler.getCacheSize()).toBe(0);
    });
  });

  // ==================== 集成测试 ====================
  describe('integration', () => {
    test('应该支持多个着色器程序', async () => {
      const programs = await Promise.all([
        compiler.compile('vs1', 'fs1'),
        compiler.compile('vs2', 'fs2'),
        compiler.compile('vs3', 'fs3'),
      ]);

      expect(programs.length).toBe(3);
      expect(compiler.getCacheSize()).toBe(3);

      // 所有程序应该有不同的 ID
      const ids = programs.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    test('应该支持混合使用编译和查询', async () => {
      const p1 = await compiler.compile('vs', 'fs');
      const p2 = compiler.getProgram('vs', 'fs');
      const p3 = await compiler.compile('vs', 'fs');

      expect(p1.id).toBe(p2?.id);
      expect(p1.id).toBe(p3.id);
      expect(p1.refCount).toBe(2); // compile 两次
    });
  });
});
