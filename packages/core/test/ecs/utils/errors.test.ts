/**
 * errors 模块测试
 * 测试错误收集机制
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { errors, logError, clearErrors, getErrorCount } from '../../../src/ecs/utils/errors';

describe('errors - 错误收集机制', () => {
  beforeEach(() => {
    // 每个测试前清空错误数组
    clearErrors();
  });

  describe('logError - 记录并抛出错误', () => {
    it('应该将错误添加到全局数组', () => {
      expect(errors.length).toBe(0);

      try {
        logError('Test error', 'TestComponent');
      } catch {
        // 预期会抛出错误
      }

      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('Test error');
      expect(errors[0].component).toBe('TestComponent');
    });

    it('应该抛出Error异常', () => {
      expect(() => {
        logError('Test error');
      }).toThrow('Test error');
    });

    it('应该记录时间戳', () => {
      const before = Date.now();

      try {
        logError('Test error');
      } catch {
        // ignore
      }

      const after = Date.now();

      expect(errors[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(errors[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('应该记录错误堆栈', () => {
      const originalError = new Error('Original error');

      try {
        logError('Wrapped error', 'Component', originalError);
      } catch {
        // ignore
      }

      expect(errors[0].stack).toBe(originalError.stack);
    });

    it('应该支持不传component参数', () => {
      try {
        logError('Error without component');
      } catch {
        // ignore
      }

      expect(errors[0].component).toBeUndefined();
    });

    it('应该支持不传error参数', () => {
      try {
        logError('Simple error', 'Component');
      } catch {
        // ignore
      }

      expect(errors[0].stack).toBeUndefined();
    });

    it('应该累积多个错误', () => {
      try {
        logError('Error 1');
      } catch {
        // ignore
      }

      try {
        logError('Error 2');
      } catch {
        // ignore
      }

      try {
        logError('Error 3');
      } catch {
        // ignore
      }

      expect(errors.length).toBe(3);
      expect(errors[0].message).toBe('Error 1');
      expect(errors[1].message).toBe('Error 2');
      expect(errors[2].message).toBe('Error 3');
    });
  });

  describe('clearErrors - 清空错误数组', () => {
    it('应该清空所有错误', () => {
      try {
        logError('Error 1');
      } catch {
        // ignore
      }

      try {
        logError('Error 2');
      } catch {
        // ignore
      }

      expect(errors.length).toBe(2);

      clearErrors();

      expect(errors.length).toBe(0);
    });

    it('应该可以重复调用', () => {
      clearErrors();
      clearErrors();
      clearErrors();

      expect(errors.length).toBe(0);
    });
  });

  describe('getErrorCount - 获取错误数量', () => {
    it('应该返回正确的错误数量', () => {
      expect(getErrorCount()).toBe(0);

      try {
        logError('Error 1');
      } catch {
        // ignore
      }

      expect(getErrorCount()).toBe(1);

      try {
        logError('Error 2');
      } catch {
        // ignore
      }

      expect(getErrorCount()).toBe(2);
    });

    it('清空后应该返回0', () => {
      try {
        logError('Error');
      } catch {
        // ignore
      }

      expect(getErrorCount()).toBe(1);

      clearErrors();

      expect(getErrorCount()).toBe(0);
    });
  });

  describe('错误收集模式 - 集中处理', () => {
    it('应该支持捕获错误并继续执行', () => {
      let executionContinued = false;

      try {
        logError('Critical error', 'System');
      } catch {
        // 捕获错误，进行降级处理
        console.info('Error caught, continuing with fallback');
      }

      executionContinued = true;

      expect(executionContinued).toBe(true);
      expect(errors.length).toBe(1);
    });

    it('应该允许检查错误历史', () => {
      try {
        logError('Error 1', 'ModuleA');
      } catch {
        // ignore
      }

      try {
        logError('Error 2', 'ModuleB');
      } catch {
        // ignore
      }

      // 用户可以检查错误历史
      const moduleAErrors = errors.filter((e) => e.component === 'ModuleA');
      const moduleBErrors = errors.filter((e) => e.component === 'ModuleB');

      expect(moduleAErrors.length).toBe(1);
      expect(moduleBErrors.length).toBe(1);
    });

    it('应该支持错误分析和报告', () => {
      try {
        logError('Network timeout', 'NetworkLayer');
      } catch {
        // ignore
      }

      try {
        logError('Parse failed', 'DataParser');
      } catch {
        // ignore
      }

      try {
        logError('Validation error', 'DataParser');
      } catch {
        // ignore
      }

      // 统计各组件的错误数
      const errorsByComponent = errors.reduce(
        (acc, err) => {
          const comp = err.component || 'Unknown';
          acc[comp] = (acc[comp] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(errorsByComponent['NetworkLayer']).toBe(1);
      expect(errorsByComponent['DataParser']).toBe(2);
    });
  });
});
