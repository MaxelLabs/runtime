/**
 * Color 测试套件
 * 目标：测试覆盖率 95%+
 */

import '../setup'; // 确保导入 setup 来加载自定义匹配器
import { Color, hslToRgb, rgbToHsl, type HSLColor } from '../../src/core/color';
import { Vector4 } from '../../src/core/vector4';
import { MathConfig } from '../../src/config/mathConfig';
import { performanceTest } from '../setup';
import { expect } from '@jest/globals';
import { UsdDataType } from '@maxellabs/specification';

// 辅助函数：验证颜色值
function expectColorEquals(
  c: { r: number; g: number; b: number; a: number },
  expected: { r: number; g: number; b: number; a: number },
  precision = 6
) {
  expect(c.r).toBeCloseTo(expected.r, precision);
  expect(c.g).toBeCloseTo(expected.g, precision);
  expect(c.b).toBeCloseTo(expected.b, precision);
  expect(c.a).toBeCloseTo(expected.a, precision);
}

describe('Color', () => {
  beforeEach(() => {
    // 确保每个测试开始时对象池是干净的
    Color.clearPool();
    MathConfig.enableObjectPool(false); // 默认关闭对象池
  });

  describe('构造函数和基础属性', () => {
    test('应该创建默认颜色（黑色）', () => {
      const c = new Color();
      expect(c.r).toBe(0);
      expect(c.g).toBe(0);
      expect(c.b).toBe(0);
      expect(c.a).toBe(1);
    });

    test('应该根据参数创建颜色', () => {
      const c = new Color(0.5, 0.3, 0.7, 0.8);
      expect(c.r).toBeCloseTo(0.5, 5);
      expect(c.g).toBeCloseTo(0.3, 5);
      expect(c.b).toBeCloseTo(0.7, 5);
      expect(c.a).toBeCloseTo(0.8, 5);
    });

    test('应该正确设置和获取分量', () => {
      const c = new Color();
      c.r = 0.8;
      c.g = 0.6;
      c.b = 0.4;
      c.a = 0.9;

      expect(c.r).toBeCloseTo(0.8, 5);
      expect(c.g).toBeCloseTo(0.6, 5);
      expect(c.b).toBeCloseTo(0.4, 5);
      expect(c.a).toBeCloseTo(0.9, 5);
    });
  });

  describe('颜色常量', () => {
    test('应该有正确的颜色常量值', () => {
      expectColorEquals(Color.BLACK, { r: 0, g: 0, b: 0, a: 1 });
      expectColorEquals(Color.WHITE, { r: 1, g: 1, b: 1, a: 1 });
      expectColorEquals(Color.RED, { r: 1, g: 0, b: 0, a: 1 });
      expectColorEquals(Color.GREEN, { r: 0, g: 1, b: 0, a: 1 });
      expectColorEquals(Color.BLUE, { r: 0, g: 0, b: 1, a: 1 });
      expectColorEquals(Color.CLEAR, { r: 0, g: 0, b: 0, a: 0 });
    });

    test('颜色常量应该是不可变的', () => {
      // Object.freeze on class with Float32Array doesn't prevent internal mutation
      // This is a design limitation, not a bug
      try {
        (Color.RED as any).r = 0.5;
      } catch (ignoreError) {
        // May or may not throw depending on strict mode
      }
      // The key assertion is value integrity
      expect(Color.RED.r).toBe(1);
    });
  });

  describe('设置方法', () => {
    test('set() 应该正确设置颜色值', () => {
      const c = new Color();
      const result = c.set(0.2, 0.4, 0.6, 0.8);

      expectColorEquals(c, { r: 0.2, g: 0.4, b: 0.6, a: 0.8 });
      expect(result).toBe(c); // 链式调用
    });

    test('setZero() 应该设置为零颜色', () => {
      const c = new Color(1, 1, 1, 1);
      const result = c.setZero();

      expectColorEquals(c, { r: 0, g: 0, b: 0, a: 0 });
      expect(result).toBe(c);
    });

    test('setFromNumber() 应该从数值设置颜色', () => {
      const c = new Color();
      const result = c.setFromNumber(0.5);

      expectColorEquals(c, { r: 0.5, g: 0.5, b: 0.5, a: 0.5 });
      expect(result).toBe(c);
    });

    test('setFromVector4() 应该从Vector4设置颜色', () => {
      const c = new Color();
      const v4 = new Vector4(0.3, 0.7, 0.2, 0.9);
      const result = c.setFromVector4(v4);

      expectColorEquals(c, { r: 0.3, g: 0.7, b: 0.2, a: 0.9 });
      expect(result).toBe(c);
    });

    test('setFromArray() 应该从数组设置颜色', () => {
      const c = new Color();
      const array = [0.1, 0.2, 0.3, 0.4, 0.5];

      c.setFromArray(array);
      expectColorEquals(c, { r: 0.1, g: 0.2, b: 0.3, a: 0.4 });

      c.setFromArray(array, 1);
      expectColorEquals(c, { r: 0.2, g: 0.3, b: 0.4, a: 0.5 });
    });
  });

  describe('HSV 颜色空间', () => {
    test('setFromHSV() 应该正确转换', () => {
      const c = new Color();

      // 红色 (H=0, S=1, V=1)
      c.setFromHSV(0, 1, 1);
      expect(c.r).toBeCloseTo(1, 2);
      expect(c.g).toBeCloseTo(0, 2);
      expect(c.b).toBeCloseTo(0, 2);

      // 绿色 (H=120, S=1, V=1)
      c.setFromHSV(120, 1, 1);
      expect(c.r).toBeCloseTo(0, 2);
      expect(c.g).toBeCloseTo(1, 2);
      expect(c.b).toBeCloseTo(0, 2);

      // 蓝色 (H=240, S=1, V=1)
      c.setFromHSV(240, 1, 1);
      expect(c.r).toBeCloseTo(0, 2);
      expect(c.g).toBeCloseTo(0, 2);
      expect(c.b).toBeCloseTo(1, 2);
    });

    test('toHSV() 应该正确转换为HSV', () => {
      const c = new Color(1, 0, 0);
      const hsv = c.toHSV();

      // toHSV 返回 Color(h, s, v, a) 而不是 HSLColor 结构
      expect(hsv.r).toBeCloseTo(0, 2); // h
      expect(hsv.g).toBeCloseTo(1, 2); // s
      expect(hsv.b).toBeCloseTo(1, 2); // v
      expect(hsv.a).toBe(1);
    });

    test('fromHSV() 静态方法', () => {
      const c = Color.fromHSV(180, 0.5, 0.8);
      expect(c.r).toBeCloseTo(0.4, 2);
      expect(c.g).toBeCloseTo(0.8, 2);
      expect(c.b).toBeCloseTo(0.8, 2);
    });
  });

  describe('HSL 颜色空间', () => {
    test('setFromHSL() 应该正确转换', () => {
      const c = new Color();

      // 红色 (H=0, S=1, L=0.5)
      c.setFromHSL(0, 1, 0.5);
      expect(c.r).toBeCloseTo(1, 2);
      expect(c.g).toBeCloseTo(0, 2);
      expect(c.b).toBeCloseTo(0, 2);

      // 灰色 (S=0)
      c.setFromHSL(0, 0, 0.5);
      expect(c.r).toBeCloseTo(0.5, 2);
      expect(c.g).toBeCloseTo(0.5, 2);
      expect(c.b).toBeCloseTo(0.5, 2);
    });

    test('toHSL() 应该正确转换为HSL', () => {
      const c = new Color(1, 0, 0);
      const hsl = c.toHSL();

      expect(hsl.h).toBeCloseTo(0, 2);
      expect(hsl.s).toBeCloseTo(1, 2);
      expect(hsl.l).toBeCloseTo(0.5, 2);
      expect(hsl.a).toBe(1);
    });

    test('fromHSL() 静态方法', () => {
      const c = Color.fromHSL(120, 0.8, 0.3);
      expect(c.g).toBeCloseTo(0.54, 2);
    });
  });

  describe('十六进制字符串转换', () => {
    test('setFromHexString() 应该解析RGB格式', () => {
      const c = new Color();
      c.setFromHexString('#FF0000');
      expectColorEquals(c, { r: 1, g: 0, b: 0, a: 1 });

      c.setFromHexString('#00FF00');
      expectColorEquals(c, { r: 0, g: 1, b: 0, a: 1 });

      c.setFromHexString('#0000FF');
      expectColorEquals(c, { r: 0, g: 0, b: 1, a: 1 });
    });

    test('setFromHexString() 应该解析RGBA格式', () => {
      const c = new Color();
      c.setFromHexString('#FF000080');
      expect(c.r).toBeCloseTo(1, 2);
      expect(c.g).toBeCloseTo(0, 2);
      expect(c.b).toBeCloseTo(0, 2);
      expect(c.a).toBeCloseTo(0x80 / 255, 2);
    });

    test('toHexString() 应该正确转换', () => {
      const c = new Color(1, 0, 0, 1);
      expect(c.toHexString()).toBe('#FF0000FF');
      expect(c.toHexString(false)).toBe('#FF0000');

      const c2 = new Color(0, 1, 0, 0.5);
      expect(c2.toHexString()).toBe('#00FF0080');
    });

    test('fromHexString() 静态方法', () => {
      const c = Color.fromHexString('#FF8800');
      expectColorEquals(c, { r: 1, g: 0x88 / 255, b: 0, a: 1 });
    });

    test('应该处理无效的十六进制字符串', () => {
      const c = new Color(1, 1, 1, 1);
      c.setFromHexString('invalid');
      expectColorEquals(c, { r: 1, g: 1, b: 1, a: 1 }); // 不应该改变

      c.setFromHexString('#FF00');
      expectColorEquals(c, { r: 1, g: 1, b: 1, a: 1 }); // 不应该改变
    });
  });

  describe('颜色运算', () => {
    test('add() 应该正确相加', () => {
      const c1 = new Color(0.3, 0.5, 0.7, 0.9);
      const c2 = new Color(0.2, 0.3, 0.1, 0.1);

      c1.add(c2);
      expectColorEquals(c1, { r: 0.5, g: 0.8, b: 0.8, a: 1.0 });

      // 与数字相加
      c1.set(0.5, 0.5, 0.5, 0.5);
      c1.add(0.1);
      expectColorEquals(c1, { r: 0.6, g: 0.6, b: 0.6, a: 0.6 });
    });

    test('subtract() 应该正确相减', () => {
      const c1 = new Color(0.7, 0.6, 0.5, 0.4);
      const c2 = new Color(0.2, 0.3, 0.1, 0.1);

      c1.subtract(c2);
      expectColorEquals(c1, { r: 0.5, g: 0.3, b: 0.4, a: 0.3 });
    });

    test('multiply() 应该正确相乘', () => {
      const c1 = new Color(0.5, 0.4, 0.3, 0.8);
      const c2 = new Color(2, 2, 2, 2);

      c1.multiply(c2);
      expectColorEquals(c1, { r: 1, g: 0.8, b: 0.6, a: 1.6 });
    });

    test('scale() 应该正确缩放', () => {
      const c = new Color(0.2, 0.4, 0.6, 0.8);
      c.scale(2);
      expectColorEquals(c, { r: 0.4, g: 0.8, b: 1.2, a: 1.6 });
    });

    test('lerp() 应该正确插值', () => {
      const c1 = new Color(0, 0, 0, 0);
      const c2 = new Color(1, 1, 1, 1);

      c1.lerp(c2, 0.5);
      expectColorEquals(c1, { r: 0.5, g: 0.5, b: 0.5, a: 0.5 });
    });

    test('min() 和 max() 应该正确计算', () => {
      const c1 = new Color(0.5, 0.7, 0.3, 0.9);
      const c2 = new Color(0.3, 0.8, 0.4, 0.8);

      c1.min(c2);
      expectColorEquals(c1, { r: 0.3, g: 0.7, b: 0.3, a: 0.8 });

      c1.max(c2);
      expectColorEquals(c1, { r: 0.3, g: 0.8, b: 0.4, a: 0.8 });
    });

    test('clamp() 应该正确约束', () => {
      const c = new Color(1.5, -0.5, 0.5, 1.2);
      const min = new Color(0, 0, 0, 0);
      const max = new Color(1, 1, 1, 1);

      c.clamp(min, max);
      expect(c.r).toBe(1);
      expect(c.g).toBe(0);
      expect(c.b).toBe(0.5);
      expect(c.a).toBe(1);
    });
  });

  describe('静态运算方法', () => {
    test('Color.add() 静态方法', () => {
      const c1 = new Color(0.2, 0.3, 0.4, 0.5);
      const c2 = new Color(0.1, 0.2, 0.3, 0.4);
      const result = Color.add(c1, c2);

      expectColorEquals(result, { r: 0.3, g: 0.5, b: 0.7, a: 0.9 });
      expect(result).not.toBe(c1); // 应该是新对象
      expect(result).not.toBe(c2);
    });

    test('Color.lerp() 静态方法', () => {
      const c1 = new Color(0, 0, 0, 0);
      const c2 = new Color(1, 1, 1, 1);
      const result = Color.lerp(c1, c2, 0.25);

      expectColorEquals(result, { r: 0.25, g: 0.25, b: 0.25, a: 0.25 });
    });
  });

  describe('Gamma/Linear 空间转换', () => {
    test('toLinear() 应该转换为线性空间', () => {
      const c = new Color(0.5, 0.5, 0.5, 1);
      c.toLinear();

      const expected = Color.gammaToLinear(0.5);
      expect(c.r).toBeCloseTo(expected, 2);
      expect(c.g).toBeCloseTo(expected, 2);
      expect(c.b).toBeCloseTo(expected, 2);
    });

    test('toGamma() 应该转换为Gamma空间', () => {
      const c = new Color(0.5, 0.5, 0.5, 1);
      c.toGamma();

      const expected = Color.linearToGamma(0.5);
      expect(c.r).toBeCloseTo(expected, 2);
      expect(c.g).toBeCloseTo(expected, 2);
      expect(c.b).toBeCloseTo(expected, 2);
    });

    test('gammaToLinear() 静态方法', () => {
      expect(Color.gammaToLinear(0)).toBe(0);
      expect(Color.gammaToLinear(1)).toBe(1);
      expect(Color.gammaToLinear(0.5)).toBeGreaterThan(0.5);
    });

    test('linearToGamma() 静态方法', () => {
      expect(Color.linearToGamma(0)).toBe(0);
      expect(Color.linearToGamma(1)).toBe(1);
      expect(Color.linearToGamma(0.5)).toBeLessThan(0.5);
    });
  });

  describe('辅助方法', () => {
    test('luminance() 应该计算亮度', () => {
      const c = new Color(1, 1, 1, 1);
      expect(c.luminance()).toBeCloseTo(1, 2);

      const c2 = new Color(0.3, 0.59, 0.11, 1);
      expect(c2.luminance()).toBeCloseTo(0.3 * 0.3 + 0.59 * 0.59 + 0.11 * 0.11, 2);
    });

    test('equals() 应该比较相等', () => {
      const c1 = new Color(0.5, 0.5, 0.5, 0.5);
      const c2 = new Color(0.5, 0.5, 0.5, 0.5);
      const c3 = new Color(0.5, 0.5, 0.5, 0.6);

      expect(c1.equals(c2)).toBe(true);
      expect(c1.equals(c3)).toBe(false);
    });

    test('toArray() 应该转换为数组', () => {
      const c = new Color(0.1, 0.2, 0.3, 0.4);
      const array = c.toArray();

      expect(array[0]).toBeCloseTo(0.1, 5);
      expect(array[1]).toBeCloseTo(0.2, 5);
      expect(array[2]).toBeCloseTo(0.3, 5);
      expect(array[3]).toBeCloseTo(0.4, 5);
    });

    test('toVector4() 应该转换为Vector4', () => {
      const c = new Color(0.1, 0.2, 0.3, 0.4);
      const v4 = c.toVector4();

      expect(v4.x).toBeCloseTo(0.1, 5);
      expect(v4.y).toBeCloseTo(0.2, 5);
      expect(v4.z).toBeCloseTo(0.3, 5);
      expect(v4.w).toBeCloseTo(0.4, 5);
    });

    test('fill() 应该填充到数组', () => {
      const c = new Color(0.1, 0.2, 0.3, 0.4);
      const array = new Float32Array(10);

      c.fill(array, 2);
      expect(array[2]).toBeCloseTo(0.1, 5);
      expect(array[3]).toBeCloseTo(0.2, 5);
      expect(array[4]).toBeCloseTo(0.3, 5);
      expect(array[5]).toBeCloseTo(0.4, 5);
    });

    test('isValid() 静态方法', () => {
      const validColor = new Color(0.5, 0.5, 0.5, 1);
      const invalidColor = new Color(NaN, Infinity, -Infinity, 0.5);

      expect(Color.isValid(validColor)).toBe(true);
      expect(Color.isValid(invalidColor)).toBe(false);
    });

    test('ToHex() 静态方法', () => {
      expect(Color.ToHex(0)).toBe('00');
      expect(Color.ToHex(15)).toBe('0F');
      expect(Color.ToHex(255)).toBe('FF');
      expect(Color.ToHex(16)).toBe('10');
    });
  });

  describe('规范兼容方法', () => {
    test('toIColor() 应该转换为IColor接口', () => {
      const c = new Color(0.3, 0.5, 0.7, 0.9);
      const icolor = c.toIColor();

      expect(icolor.r).toBeCloseTo(0.3, 5);
      expect(icolor.g).toBeCloseTo(0.5, 5);
      expect(icolor.b).toBeCloseTo(0.7, 5);
      expect(icolor.a).toBeCloseTo(0.9, 5);
    });

    test('fromIColor() 静态方法', () => {
      const icolor = { r: 0.4, g: 0.6, b: 0.8, a: 1 };
      const c = Color.fromIColor(icolor);

      expectColorEquals(c, icolor);
    });

    test('fromIColor() 实例方法', () => {
      const c = new Color();
      const icolor = { r: 0.7, g: 0.3, b: 0.9, a: 0.5 };
      const result = c.fromIColor(icolor);

      expectColorEquals(c, icolor);
      expect(result).toBe(c);
    });

    test('toUsdValue() 应该转换为USD格式', () => {
      const c = new Color(0.1, 0.2, 0.3, 0.4);
      const usdValue = c.toUsdValue();

      expect(usdValue.type).toBe('color4f');
      const value = usdValue.value as number[];
      expect(value[0]).toBeCloseTo(0.1, 5);
      expect(value[1]).toBeCloseTo(0.2, 5);
      expect(value[2]).toBeCloseTo(0.3, 5);
      expect(value[3]).toBeCloseTo(0.4, 5);
    });

    test('fromUsdValue() 静态方法', () => {
      const usdValue = { type: UsdDataType.Color4f, value: [0.3, 0.5, 0.7, 0.9] };
      const c = Color.fromUsdValue(usdValue);

      expectColorEquals(c, { r: 0.3, g: 0.5, b: 0.7, a: 0.9 });
    });

    test('应该处理无效的USD值', () => {
      expect(() => {
        Color.fromUsdValue({ type: UsdDataType.Color4f, value: [] });
      }).toThrow('Invalid UsdValue for Color');

      expect(() => {
        Color.fromUsdValue({ type: UsdDataType.Color4f, value: [0.1, 0.2] });
      }).toThrow('Invalid UsdValue for Color');
    });
  });

  describe('对象池功能', () => {
    beforeEach(() => {
      MathConfig.enableObjectPool(true);
      Color.clearPool();
    });

    afterEach(() => {
      MathConfig.enableObjectPool(false);
    });

    test('create() 应该使用对象池创建实例', () => {
      const c1 = Color.create(0.5, 0.5, 0.5, 0.5);
      const c2 = Color.create();

      expect(c1).toBeInstanceOf(Color);
      expectColorEquals(c1, { r: 0.5, g: 0.5, b: 0.5, a: 0.5 });
      expectColorEquals(c2, { r: 0, g: 0, b: 0, a: 1 });
    });

    test('release() 应该释放实例到对象池', () => {
      const c = Color.create(0.5, 0.5, 0.5, 0.5);
      Color.release(c);

      const stats = Color.getPoolStats();
      expect(stats.poolSize).toBe(1);
    });

    test('preallocate() 应该预分配实例', () => {
      Color.preallocate(5);

      const stats = Color.getPoolStats();
      expect(stats.poolSize).toBe(5);
    });

    test('clearPool() 应该清空对象池', () => {
      Color.preallocate(3);
      Color.clearPool();

      const stats = Color.getPoolStats();
      expect(stats.poolSize).toBe(0);
    });

    test('getPoolStats() 应该返回统计信息', () => {
      const stats = Color.getPoolStats();
      expect(stats).toHaveProperty('poolSize');
      expect(stats).toHaveProperty('activeObjects');
      expect(stats).toHaveProperty('totalCreated');
    });

    test('reset() 应该重置对象状态', () => {
      const c = Color.create(0.5, 0.6, 0.7, 0.8);
      c.reset();

      expectColorEquals(c, { r: 0, g: 0, b: 0, a: 1 });
    });

    test('isPoolable() 应该返回true', () => {
      const c = new Color();
      expect(c.isPoolable()).toBe(true);
    });
  });

  describe('边界情况和错误处理', () => {
    test('getElement() 和 setElement() 应该正确处理索引', () => {
      const c = new Color(0.1, 0.2, 0.3, 0.4);

      expect(c.getElement(0)).toBe(0.1);
      expect(c.getElement(1)).toBe(0.2);
      expect(c.getElement(2)).toBe(0.3);
      expect(c.getElement(3)).toBe(0.4);
      expect(c.getElement(4)).toBe(0); // 越界

      c.setElement(1, 0.5);
      expect(c.g).toBe(0.5);

      // 测试越界
      c.setElement(5, 0.9);
      expect(c.a).toBe(0.4); // 不应该改变
    });

    test('divide() 应该正确处理除法', () => {
      const c = new Color(1, 2, 3, 4);
      c.divide(2);
      expectColorEquals(c, { r: 0.5, g: 1, b: 1.5, a: 2 });
    });

    test('fromHSL() 应该处理边界值', () => {
      let c = Color.fromHSL(360, 0, 0);
      // L=0 应该产生黑色
      expectColorEquals(c, { r: 0, g: 0, b: 0, a: 1 });

      c = Color.fromHSL(-120, 1, 1);
      // L=1 应该产生白色
      expectColorEquals(c, { r: 1, g: 1, b: 1, a: 1 });
    });

    test('从数组设置应该处理undefined值', () => {
      const c = new Color();
      c.setFromArray([0.1]);
      expectColorEquals(c, { r: 0.1, g: 0, b: 0, a: 1 });

      c.setFromArray([0.2, 0.3]);
      expectColorEquals(c, { r: 0.2, g: 0.3, b: 0, a: 1 });

      c.setFromArray([0.4, 0.5, 0.6]);
      expectColorEquals(c, { r: 0.4, g: 0.5, b: 0.6, a: 1 });
    });
  });

  describe('HSL 工具函数', () => {
    test('hslToRgb() 应该正确转换', () => {
      const rgb1 = hslToRgb(0, 1, 0.5);
      expect(rgb1[0]).toBeCloseTo(1, 2);
      expect(rgb1[1]).toBeCloseTo(0, 2);
      expect(rgb1[2]).toBeCloseTo(0, 2);
      expect(rgb1[3]).toBe(1);

      const rgb2 = hslToRgb(120, 1, 0.5);
      expect(rgb2[0]).toBeCloseTo(0, 2);
      expect(rgb2[1]).toBeCloseTo(1, 2);
      expect(rgb2[2]).toBeCloseTo(0, 2);

      const rgb3 = hslToRgb(0, 0, 0.7);
      expect(rgb3[0]).toBeCloseTo(0.7, 2);
      expect(rgb3[1]).toBeCloseTo(0.7, 2);
      expect(rgb3[2]).toBeCloseTo(0.7, 2);
    });

    test('rgbToHsl() 应该正确转换', () => {
      const hsl1: HSLColor = rgbToHsl(1, 0, 0);
      expect(hsl1.h).toBeCloseTo(0, 2);
      expect(hsl1.s).toBeCloseTo(1, 2);
      expect(hsl1.l).toBeCloseTo(0.5, 2);
      expect(hsl1.a).toBe(1);

      const hsl2: HSLColor = rgbToHsl(0.5, 0.5, 0.5);
      expect(hsl2.h).toBeCloseTo(0, 2);
      expect(hsl2.s).toBeCloseTo(0, 2);
      expect(hsl2.l).toBeCloseTo(0.5, 2);
    });

    test('HSL转换应该是双向的', () => {
      const original = { h: 240, s: 0.8, l: 0.3, a: 0.7 };
      const rgb = hslToRgb(original.h, original.s, original.l, original.a);
      const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2], rgb[3]);

      expect(hsl.h).toBeCloseTo(original.h, 1);
      expect(hsl.s).toBeCloseTo(original.s, 1);
      expect(hsl.l).toBeCloseTo(original.l, 1);
      expect(hsl.a).toBeCloseTo(original.a, 2);
    });
  });

  describe('性能测试', () => {
    test('颜色创建性能', () => {
      performanceTest(
        '颜色创建性能',
        () => {
          const c = new Color(Math.random(), Math.random(), Math.random(), Math.random());
          c.luminance();
        },
        10000
      );
    });

    test('HSL转换性能', () => {
      performanceTest(
        'HSL转换性能',
        () => {
          const c = new Color(Math.random(), Math.random(), Math.random(), 1);
          c.toHSL();
        },
        5000
      );
    });

    test('十六进制转换性能', () => {
      performanceTest(
        '十六进制转换性能',
        () => {
          const c = new Color(Math.random(), Math.random(), Math.random(), Math.random());
          c.toHexString();
        },
        5000
      );
    });

    test('Gamma转换性能', () => {
      performanceTest(
        'Gamma转换性能',
        () => {
          const c = new Color(Math.random(), Math.random(), Math.random(), 1);
          c.toLinear().toGamma();
        },
        5000
      );
    });
  });
});
