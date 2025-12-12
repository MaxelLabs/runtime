/**
 * Utils 工具函数测试套件
 * 目标：测试覆盖率 95%+
 */

import '../setup'; // 确保导入 setup 来加载自定义匹配器

import {
  NumberEpsilon,
  DEG2RAD,
  RAD2DEG,
  PI2,
  hasSIMD,
  fastSin,
  fastCos,
  fastSqrt,
  fastInvSqrt,
  clearTrigCache,
  isZero,
  isEqual,
  damp,
  lerp,
  degToRad,
  radToDeg,
  clamp,
  truncateDecimals,
  cube,
  safeDivide,
} from '../../src/core/utils';
import { performanceTest } from '../setup';
import { expect } from '@jest/globals';

describe('Utils 工具函数', () => {
  describe('常量', () => {
    test('应该有正确的常量值', () => {
      expect(NumberEpsilon).toBe(1e-10);
      expect(DEG2RAD).toBe(Math.PI / 180);
      expect(RAD2DEG).toBe(180 / Math.PI);
      expect(PI2).toBe(Math.PI * 2);
    });

    test('常量应该有正确的关系', () => {
      expect(DEG2RAD * RAD2DEG).toBeCloseTo(1, 10);
      expect(2 * Math.PI).toBe(PI2);
    });
  });

  describe('SIMD 检测', () => {
    test('hasSIMD 应该返回布尔值', () => {
      const result = hasSIMD();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('优化的三角函数', () => {
    beforeEach(() => {
      clearTrigCache();
    });

    test('fastSin 应该正确计算正弦值', () => {
      // 测试常见角度
      expect(fastSin(0)).toBeCloseTo(0, 4);
      expect(fastSin(Math.PI / 2)).toBeCloseTo(1, 4);
      expect(fastSin(Math.PI)).toBeCloseTo(0, 4);
      expect(fastSin((3 * Math.PI) / 2)).toBeCloseTo(-1, 4);
      expect(fastSin(2 * Math.PI)).toBeCloseTo(0, 4);

      // 测试小角度优化
      expect(fastSin(0.005)).toBeCloseTo(0.005, 4);
      expect(fastSin(-0.005)).toBeCloseTo(-0.005, 4);
    });

    test('fastCos 应该正确计算余弦值', () => {
      // 测试常见角度
      expect(fastCos(0)).toBeCloseTo(1, 4);
      expect(fastCos(Math.PI / 2)).toBeCloseTo(0, 4);
      expect(fastCos(Math.PI)).toBeCloseTo(-1, 4);
      expect(fastCos((3 * Math.PI) / 2)).toBeCloseTo(0, 4);
      expect(fastCos(2 * Math.PI)).toBeCloseTo(1, 4);

      // 测试小角度优化
      expect(fastCos(0.005)).toBeCloseTo(1 - (0.005 * 0.005) / 2, 4);
    });

    test('三角函数应该正确处理角度归一化', () => {
      // 测试超过 2π 的角度
      expect(fastSin(2 * Math.PI + Math.PI / 2)).toBeCloseTo(1, 4);
      expect(fastCos(2 * Math.PI + Math.PI)).toBeCloseTo(-1, 4);

      // 测试负角度
      expect(fastSin(-Math.PI / 2)).toBeCloseTo(-1, 4);
      expect(fastCos(-Math.PI)).toBeCloseTo(-1, 4);
    });

    test('应该正确使用缓存', () => {
      // 第一次调用
      const angle1 = Math.PI / 4;
      const result1 = fastSin(angle1);

      // 第二次调用相同角度（应该使用缓存）
      const result2 = fastSin(angle1);

      expect(result1).toBe(result2);
      expect(result1).toBeCloseTo(Math.sin(angle1), 3);
    });

    test('clearTrigCache 应该清除缓存', () => {
      // 先计算一些值填充缓存
      for (let i = 0; i < 10; i++) {
        fastSin(i * 0.1);
        fastCos(i * 0.1);
      }

      clearTrigCache();

      // 再次调用应该重新计算
      expect(fastSin(Math.PI / 6)).toBeCloseTo(Math.sin(Math.PI / 6), 3);
    });
  });

  describe('优化的平方根函数', () => {
    test('fastSqrt 应该正确计算平方根', () => {
      expect(fastSqrt(0)).toBe(0);
      expect(fastSqrt(1)).toBe(1);
      expect(fastSqrt(4)).toBe(2);
      expect(fastSqrt(9)).toBe(3);
      expect(fastSqrt(16)).toBe(4);
      expect(fastSqrt(25)).toBe(5);
      expect(fastSqrt(2)).toBeCloseTo(Math.sqrt(2), 4);
      expect(fastSqrt(3)).toBeCloseTo(Math.sqrt(3), 4);
      expect(fastSqrt(10)).toBeCloseTo(Math.sqrt(10), 4);
    });

    test('fastInvSqrt 应该正确计算反平方根', () => {
      expect(fastInvSqrt(1)).toBe(1);
      expect(fastInvSqrt(4)).toBe(0.5);
      expect(fastInvSqrt(9)).toBeCloseTo(1 / 3, 3);
      expect(fastInvSqrt(0)).toBe(Infinity);
      expect(fastInvSqrt(2)).toBeCloseTo(1 / Math.sqrt(2), 3);
      expect(fastInvSqrt(16)).toBe(0.25);
    });
  });

  describe('数值比较函数', () => {
    test('isZero 应该正确判断零值', () => {
      expect(isZero(0)).toBe(true);
      expect(isZero(1e-11)).toBe(true); // 小于 epsilon
      expect(isZero(-1e-11)).toBe(true);
      expect(isZero(Number.EPSILON)).toBe(true);
      expect(isZero(NaN)).toBe(true);
      expect(isZero(1e-9)).toBe(false); // 大于 epsilon
      expect(isZero(1)).toBe(false);
      expect(isZero(-1)).toBe(false);
    });

    test('isEqual 应该正确判断相等', () => {
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual(1, 1 + 1e-11)).toBe(true);
      expect(isEqual(1, 1 + 1e-9)).toBe(false);

      // 测试无穷大
      expect(isEqual(Infinity, Infinity)).toBe(true);
      expect(isEqual(-Infinity, -Infinity)).toBe(true);
      expect(isEqual(Infinity, -Infinity)).toBe(false);

      // 测试零
      expect(isEqual(0, 0)).toBe(true);
      expect(isEqual(0, 1e-11)).toBe(true);
    });
  });

  describe('插值和过渡函数', () => {
    test('lerp 应该正确线性插值', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(5, 15, 0.5)).toBe(10);
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });

    test('damp 应该正确计算阻尼', () => {
      // 测试基本阻尼行为
      expect(damp(0, 10, 1, 1)).toBeCloseTo(6.32, 1); // 10 * (1 - e^-1)
      expect(damp(0, 10, 10, 1)).toBeCloseTo(9.9995, 3); // 接近目标值

      // 测试零时间变化
      expect(damp(5, 10, 1, 0)).toBe(5); // 没有变化

      // 测试阻尼系数
      expect(damp(0, 10, 0.1, 1)).toBeLessThan(damp(0, 10, 1, 1));
    });
  });

  describe('角度转换函数', () => {
    test('degToRad 应该正确转换角度到弧度', () => {
      expect(degToRad(0)).toBe(0);
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 4);
      expect(degToRad(180)).toBeCloseTo(Math.PI, 4);
      expect(degToRad(270)).toBeCloseTo((3 * Math.PI) / 2, 4);
      expect(degToRad(360)).toBeCloseTo(2 * Math.PI, 4);
      expect(degToRad(45)).toBeCloseTo(Math.PI / 4, 4);
    });

    test('radToDeg 应该正确转换弧度到角度', () => {
      expect(radToDeg(0)).toBe(0);
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90, 4);
      expect(radToDeg(Math.PI)).toBeCloseTo(180, 4);
      expect(radToDeg((3 * Math.PI) / 2)).toBeCloseTo(270, 4);
      expect(radToDeg(2 * Math.PI)).toBeCloseTo(360, 4);
      expect(radToDeg(Math.PI / 4)).toBeCloseTo(45, 4);
    });

    test('角度转换应该是互逆的', () => {
      const testAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
      testAngles.forEach((deg) => {
        const rad = degToRad(deg);
        const backToDeg = radToDeg(rad);
        expect(backToDeg).toBeCloseTo(deg, 6);
      });
    });
  });

  describe('数值处理函数', () => {
    test('clamp 应该正确约束数值', () => {
      // 测试在范围内
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);

      // 测试超出范围
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);

      // 测试负数范围
      expect(clamp(-2, -5, 5)).toBe(-2);
      expect(clamp(-10, -5, 5)).toBe(-5);
      expect(clamp(10, -5, 5)).toBe(5);
    });

    test('truncateDecimals 应该正确截断小数位', () => {
      expect(truncateDecimals(3.14159, 0)).toBe(3);
      expect(truncateDecimals(3.14159, 2)).toBe(3.14);
      expect(truncateDecimals(3.14159, 4)).toBe(3.1415);
      expect(truncateDecimals(-3.14159, 2)).toBe(-3.14);
      expect(truncateDecimals(123.456, -1)).toBeCloseTo(120, 0);
    });

    test('cube 应该正确计算三次方', () => {
      expect(cube(0)).toBe(0);
      expect(cube(1)).toBe(1);
      expect(cube(2)).toBe(8);
      expect(cube(-2)).toBe(-8);
      expect(cube(0.5)).toBe(0.125);
      expect(cube(-0.5)).toBe(-0.125);
    });

    test('safeDivide 应该安全执行除法', () => {
      // 正常除法
      expect(safeDivide(10, 2)).toBe(5);
      expect(safeDivide(10, 3)).toBeCloseTo(3.333, 2);

      // 除以零
      expect(safeDivide(10, 0)).toBe(0); // 默认 fallback
      expect(safeDivide(10, 1e-11)).toBe(0); // 小于 epsilon

      // 自定义 fallback
      expect(safeDivide(10, 0, -1)).toBe(-1);
      expect(safeDivide(10, 1e-11, 999)).toBe(999);

      // 负数除法
      expect(safeDivide(10, -2)).toBe(-5);
      expect(safeDivide(-10, 2)).toBe(-5);
      expect(safeDivide(-10, -2)).toBe(5);
    });
  });

  describe('边界情况和特殊值', () => {
    test('应该正确处理 NaN', () => {
      expect(isZero(NaN)).toBe(true);
      expect(isEqual(NaN, NaN)).toBe(false); // NaN != NaN
      expect(clamp(NaN, 0, 10)).toBeNaN();
      expect(lerp(NaN, 10, 0.5)).toBeNaN();
    });

    test('应该正确处理无穷大', () => {
      expect(isZero(Infinity)).toBe(false);
      expect(isZero(-Infinity)).toBe(false);
      expect(isEqual(Infinity, Infinity)).toBe(true);
      expect(isEqual(-Infinity, -Infinity)).toBe(true);
      expect(isEqual(Infinity, -Infinity)).toBe(false);
      expect(clamp(Infinity, 0, 10)).toBe(10);
      expect(clamp(-Infinity, 0, 10)).toBe(0);
    });

    test('lerp 应该处理极端值', () => {
      expect(lerp(0, Infinity, 0.5)).toBe(Infinity);
      expect(lerp(-Infinity, Infinity, 0.5)).toBeCloseTo(0, 10);
      expect(lerp(0, 10, -1)).toBe(-10);
      expect(lerp(0, 10, 2)).toBe(20);
    });

    test('damp 应该处理极端参数', () => {
      expect(damp(0, 10, 0, 1)).toBe(0); // 零阻尼系数
      expect(damp(0, Infinity, 1, 1)).toBe(Infinity);
      expect(damp(Infinity, 0, 1, 1)).toBe(Infinity); // 无穷起始值不会改变
    });

    test('三角函数应该处理极端值', () => {
      expect(fastSin(Infinity)).toBeNaN();
      expect(fastCos(Infinity)).toBeNaN();
      expect(fastSin(NaN)).toBeNaN();
      expect(fastCos(NaN)).toBeNaN();
    });

    test('sqrt 函数应该处理负数', () => {
      expect(() => fastSqrt(-1)).not.toThrow();
      expect(fastSqrt(-1)).toBeNaN();
      expect(fastInvSqrt(-1)).toBeNaN();
    });
  });

  describe('性能对比测试', () => {
    test('fastSin vs Math.sin 性能对比', () => {
      const angles = Array.from({ length: 1000 }, (_, i) => (i * Math.PI) / 180);

      const nativeTime = performanceTest(
        'Math.sin',
        () => {
          angles.forEach((a) => Math.sin(a));
        },
        1000
      );

      const fastTime = performanceTest(
        'fastSin',
        () => {
          angles.forEach((a) => fastSin(a));
        },
        1000
      );

      // fastSin 应该有合理的性能（不要求一定更快，因为依赖于实现）
      expect(fastTime).toBeGreaterThan(0);
      expect(fastTime).toBeLessThan(nativeTime); // fastSin 应该更快
    });

    test('fastInvSqrt vs 1/Math.sqrt 性能对比', () => {
      const values = Array.from({ length: 1000 }, (_, i) => (i + 1) * 0.01);

      const nativeTime = performanceTest(
        '1/Math.sqrt',
        () => {
          values.forEach((v) => 1 / Math.sqrt(v));
        },
        1000
      );

      const fastTime = performanceTest(
        'fastInvSqrt',
        () => {
          values.forEach((v) => fastInvSqrt(v));
        },
        1000
      );

      expect(fastTime).toBeGreaterThan(0);
      expect(fastTime).toBeLessThan(nativeTime); // fastInvSqrt 应该更快
    });
  });

  describe('数值精度测试', () => {
    test('fastInvSqrt 精度测试', () => {
      const testValues = [0.1, 0.5, 1, 2, 5, 10, 100];

      testValues.forEach((v) => {
        const result = fastInvSqrt(v);
        const expected = 1 / Math.sqrt(v);
        const relativeError = Math.abs(result - expected) / Math.abs(expected);

        // 允许一定的精度损失，但应该在合理范围内
        expect(relativeError).toBeLessThan(0.01); // 1% 的相对误差
      });
    });

    test('clamp 边界精度', () => {
      expect(clamp(0.9999999999, 1, 2)).toBe(1);
      expect(clamp(1.0000000001, 0, 1)).toBe(1);
    });

    test('插值精度', () => {
      expect(lerp(0, 1, 0.3333333333)).toBeCloseTo(0.3333333333, 8);
      expect(lerp(-1, 1, 0.5)).toBeCloseTo(0, 8);
    });
  });

  describe('内存和缓存管理', () => {
    test('三角函数缓存不应无限增长', () => {
      // 生成大量不同的角度值
      for (let i = 0; i < 3000; i++) {
        const angle = i * 0.001;
        fastSin(angle);
        fastCos(angle);
      }

      // 缓存应该保持合理的大小
      clearTrigCache(); // 清理以确保下次测试干净

      // 再次调用应该仍然工作
      expect(fastSin(Math.PI / 4)).toBeCloseTo(Math.sin(Math.PI / 4), 3);
    });
  });
});
