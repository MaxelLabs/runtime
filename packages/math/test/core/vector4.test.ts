/**
 * Vector4 测试套件
 * 目标：测试覆盖率 95%+
 */

import { Vector4 } from '../../src/core/vector4';
import { Matrix4 } from '../../src/core/matrix4';
import { MathConfig } from '../../src/config/mathConfig';
import { performanceTest, testRandom } from '../setup';
import { expect, jest } from '@jest/globals';

describe('Vector4', () => {
  describe('构造函数和基础属性', () => {
    test('应该创建默认零向量', () => {
      const v = new Vector4();

      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);
      expect(v.w).toBe(0);
    });

    test('应该根据参数创建向量', () => {
      const v = new Vector4(1.5, 2.5, 3.5, 4.5);

      expect(v.x).toBe(1.5);
      expect(v.y).toBe(2.5);
      expect(v.z).toBe(3.5);
      expect(v.w).toBe(4.5);
    });

    test('应该正确设置和获取分量', () => {
      const v = new Vector4();

      v.x = 3.14;
      v.y = 2.71;
      v.z = 1.41;
      v.w = 0.577;

      expect(v.x).toBeCloseTo(3.14, 5);
      expect(v.y).toBeCloseTo(2.71, 5);
      expect(v.z).toBeCloseTo(1.41, 5);
      expect(v.w).toBeCloseTo(0.577, 5);
    });
  });

  describe('常量验证', () => {
    test('应该有正确的常量值', () => {
      (expect(Vector4.ZERO) as any).toEqualVector4({ x: 0, y: 0, z: 0, w: 0 });
      (expect(Vector4.ONE) as any).toEqualVector4({ x: 1, y: 1, z: 1, w: 1 });
      (expect(Vector4.X) as any).toEqualVector4({ x: 1, y: 0, z: 0, w: 0 });
      (expect(Vector4.Y) as any).toEqualVector4({ x: 0, y: 1, z: 0, w: 0 });
      (expect(Vector4.Z) as any).toEqualVector4({ x: 0, y: 0, z: 1, w: 0 });
      (expect(Vector4.W) as any).toEqualVector4({ x: 0, y: 0, z: 0, w: 1 });
    });

    test('常量应该是不可变的', () => {
      // Vector4 使用 Object.freeze 冻结，但 Float32Array 在某些环境下可能不完全冻结
      // 检查是否为冻结对象
      expect(Object.isFrozen(Vector4.ONE)).toBe(true);
    });
  });

  describe('对象池功能', () => {
    beforeEach(() => {
      MathConfig.enableObjectPool(true);
    });

    test('应该支持对象池创建和释放', () => {
      const v1 = Vector4.create(1, 2, 3, 4);
      expect(v1.x).toBe(1);
      expect(v1.y).toBe(2);
      expect(v1.z).toBe(3);
      expect(v1.w).toBe(4);

      Vector4.release(v1);

      const v2 = Vector4.create(5, 6, 7, 8);
      expect(v2.x).toBe(5);
      expect(v2.y).toBe(6);
      expect(v2.z).toBe(7);
      expect(v2.w).toBe(8);
    });

    test('应该实现池化接口', () => {
      const v = new Vector4(1, 2, 3, 4);
      expect(v.isPoolable()).toBe(true);

      v.reset();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);
      expect(v.w).toBe(0);
    });

    test('应该支持预分配', () => {
      Vector4.preallocate(10);
      const stats = Vector4.getPoolStats();
      expect(stats.poolSize).toBeGreaterThanOrEqual(10);
    });

    test('应该支持清空池', () => {
      Vector4.create(1, 1, 1, 1);
      Vector4.clearPool();
      const stats = Vector4.getPoolStats();
      expect(stats.poolSize).toBe(0);
    });
  });

  describe('基础操作', () => {
    let v: Vector4;

    beforeEach(() => {
      v = new Vector4();
    });

    test('set() 应该设置向量分量', () => {
      v.set(1.5, 2.5, 3.5, 4.5);
      expect(v.x).toBe(1.5);
      expect(v.y).toBe(2.5);
      expect(v.z).toBe(3.5);
      expect(v.w).toBe(4.5);
    });

    test('setZero() 应该设置为零向量', () => {
      v.set(1, 2, 3, 4);
      v.setZero();
      (expect(v) as any).toEqualVector4(Vector4.ZERO);
    });

    test('setFromNumber() 应该用标量设置', () => {
      v.setFromNumber(3.14);
      expect(v.x).toBeCloseTo(3.14, 5);
      expect(v.y).toBeCloseTo(3.14, 5);
      expect(v.z).toBeCloseTo(3.14, 5);
      expect(v.w).toBeCloseTo(3.14, 5);
    });

    test('setFromArray() 应该从数组设置', () => {
      const array = [1.5, 2.5, 3.5, 4.5, 5.5];
      v.setFromArray(array);
      expect(v.x).toBe(1.5);
      expect(v.y).toBe(2.5);
      expect(v.z).toBe(3.5);
      expect(v.w).toBe(4.5);

      // 测试偏移
      v.setFromArray(array, 1);
      expect(v.x).toBe(2.5);
      expect(v.y).toBe(3.5);
      expect(v.z).toBe(4.5);
      expect(v.w).toBe(5.5);
    });

    test('copyFrom() 应该从其他向量复制', () => {
      const source = new Vector4(3, 4, 5, 6);
      v.copyFrom(source);
      (expect(v) as any).toEqualVector4(source);
    });

    test('clone() 应该创建向量副本', () => {
      v.set(1, 2, 3, 4);
      const cloned = v.clone();

      expect(cloned).not.toBe(v);
      (expect(cloned) as any).toEqualVector4(v);
    });

    test('setElement() 应该按索引设置元素', () => {
      v.setElement(0, 10);
      v.setElement(1, 20);
      v.setElement(2, 30);
      v.setElement(3, 40);

      expect(v.x).toBe(10);
      expect(v.y).toBe(20);
      expect(v.z).toBe(30);
      expect(v.w).toBe(40);

      // 测试边界检查
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      v.setElement(4, 50);
      expect(consoleSpy).toHaveBeenCalledWith('index is out of range: 4');
      consoleSpy.mockRestore();
    });

    test('getElement() 应该按索引获取元素', () => {
      v.set(5, 10, 15, 20);

      expect(v.getElement(0)).toBe(5);
      expect(v.getElement(1)).toBe(10);
      expect(v.getElement(2)).toBe(15);
      expect(v.getElement(3)).toBe(20);

      // 测试边界检查
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(v.getElement(4)).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('index is out of range: 4');
      consoleSpy.mockRestore();
    });
  });

  describe('向量运算', () => {
    test('add() 应该支持向量加法', () => {
      const v1 = new Vector4(1, 2, 3, 4);
      const v2 = new Vector4(5, 6, 7, 8);

      v1.add(v2);
      expect(v1.x).toBe(6);
      expect(v1.y).toBe(8);
      expect(v1.z).toBe(10);
      expect(v1.w).toBe(12);
    });

    test('add() 应该支持标量加法', () => {
      const v = new Vector4(1, 2, 3, 4);

      v.add(5);
      expect(v.x).toBe(6);
      expect(v.y).toBe(7);
      expect(v.z).toBe(8);
      expect(v.w).toBe(9);
    });

    test('add() 应该支持数组加法', () => {
      const v = new Vector4(1, 2, 3, 4);

      v.add([5, 6, 7, 8]);
      expect(v.x).toBe(6);
      expect(v.y).toBe(8);
      expect(v.z).toBe(10);
      expect(v.w).toBe(12);
    });

    test('addVectors() 应该计算两个向量的和', () => {
      const v = new Vector4();
      const v1 = new Vector4(1, 2, 3, 4);
      const v2 = new Vector4(5, 6, 7, 8);

      v.addVectors(v1, v2);
      expect(v.x).toBe(6);
      expect(v.y).toBe(8);
      expect(v.z).toBe(10);
      expect(v.w).toBe(12);
    });

    test('addScaledVector() 应该添加缩放后的向量', () => {
      const v = new Vector4(1, 2, 3, 4);
      const v2 = new Vector4(2, 3, 4, 5);

      v.addScaledVector(v2, 2);
      expect(v.x).toBe(5);
      expect(v.y).toBe(8);
      expect(v.z).toBe(11);
      expect(v.w).toBe(14);
    });

    test('subtract() 应该支持向量减法', () => {
      const v1 = new Vector4(10, 15, 20, 25);
      const v2 = new Vector4(2, 3, 4, 5);

      v1.subtract(v2);
      expect(v1.x).toBe(8);
      expect(v1.y).toBe(12);
      expect(v1.z).toBe(16);
      expect(v1.w).toBe(20);
    });

    test('subtract() 应该支持标量减法', () => {
      const v = new Vector4(10, 15, 20, 25);

      v.subtract(5);
      expect(v.x).toBe(5);
      expect(v.y).toBe(10);
      expect(v.z).toBe(15);
      expect(v.w).toBe(20);
    });

    test('subtract() 应该支持数组减法', () => {
      const v = new Vector4(10, 15, 20, 25);

      v.subtract([3, 5, 7, 9]);
      expect(v.x).toBe(7);
      expect(v.y).toBe(10);
      expect(v.z).toBe(13);
      expect(v.w).toBe(16);
    });

    test('subtractVectors() 应该计算两个向量的差', () => {
      const v = new Vector4();
      const v1 = new Vector4(10, 15, 20, 25);
      const v2 = new Vector4(2, 3, 4, 5);

      v.subtractVectors(v1, v2);
      expect(v.x).toBe(8);
      expect(v.y).toBe(12);
      expect(v.z).toBe(16);
      expect(v.w).toBe(20);
    });

    test('multiply() 应该支持向量乘法', () => {
      const v1 = new Vector4(2, 3, 4, 5);
      const v2 = new Vector4(6, 7, 8, 9);

      v1.multiply(v2);
      expect(v1.x).toBe(12);
      expect(v1.y).toBe(21);
      expect(v1.z).toBe(32);
      expect(v1.w).toBe(45);
    });

    test('multiply() 应该支持标量乘法', () => {
      const v = new Vector4(2, 3, 4, 5);

      v.multiply(3);
      expect(v.x).toBe(6);
      expect(v.y).toBe(9);
      expect(v.z).toBe(12);
      expect(v.w).toBe(15);
    });

    test('multiply() 应该支持数组乘法', () => {
      const v = new Vector4(2, 3, 4, 5);

      v.multiply([2, 4, 6, 8]);
      expect(v.x).toBe(4);
      expect(v.y).toBe(12);
      expect(v.z).toBe(24);
      expect(v.w).toBe(40);
    });

    test('divide() 应该支持向量除法', () => {
      const v1 = new Vector4(12, 21, 32, 45);
      const v2 = new Vector4(2, 3, 4, 5);

      v1.divide(v2);
      expect(v1.x).toBe(6);
      expect(v1.y).toBe(7);
      expect(v1.z).toBe(8);
      expect(v1.w).toBe(9);
    });

    test('divide() 应该支持标量除法', () => {
      const v = new Vector4(6, 9, 12, 15);

      v.divide(3);
      expect(v.x).toBe(2);
      expect(v.y).toBe(3);
      expect(v.z).toBe(4);
      expect(v.w).toBe(5);
    });

    test('scale() 应该缩放向量', () => {
      const v = new Vector4(1, 2, 3, 4);

      v.scale(5);
      expect(v.x).toBe(5);
      expect(v.y).toBe(10);
      expect(v.z).toBe(15);
      expect(v.w).toBe(20);
    });

    test('sum() 应该计算分量和', () => {
      const v = new Vector4(1, 2, 3, 4);
      expect(v.sum()).toBe(10);
    });
  });

  describe('长度和距离计算', () => {
    test('length() 应该计算向量长度', () => {
      const v = new Vector4(1, 2, 2, 2); // sqrt(1+4+4+4) = 3
      expect(v.length()).toBeCloseTo(3.60555, 5);
    });

    test('lengthSquared() 应该计算长度平方', () => {
      const v = new Vector4(1, 2, 2, 2);
      expect(v.lengthSquared()).toBe(13); // 1+4+4+4 = 13
    });

    test('normalize() 应该归一化向量', () => {
      const v = new Vector4(3, 4, 0, 0); // 长度为5
      v.normalize();

      expect(v.length()).toBeCloseTo(1, 5);
      expect(v.x).toBeCloseTo(0.6, 5);
      expect(v.y).toBeCloseTo(0.8, 5);
      expect(v.z).toBeCloseTo(0, 5);
      expect(v.w).toBeCloseTo(0, 5);
    });

    test('零向量归一化应该保持零向量', () => {
      const v = new Vector4(0, 0, 0, 0);
      v.normalize();

      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);
      expect(v.w).toBe(0);
    });

    test('setLength() 应该设置向量长度', () => {
      const v = new Vector4(3, 4, 0, 0);
      v.setLength(10);

      expect(v.length()).toBeCloseTo(10, 5);
    });
  });

  describe('插值和变换', () => {
    test('lerp() 应该线性插值', () => {
      const v1 = new Vector4(0, 0, 0, 0);
      const v2 = new Vector4(10, 20, 30, 40);

      v1.lerp(v2, 0.5);

      expect(v1.x).toBe(5);
      expect(v1.y).toBe(10);
      expect(v1.z).toBe(15);
      expect(v1.w).toBe(20);
    });

    test('lerpVectors() 应该在两向量间插值', () => {
      const v = new Vector4();
      const v1 = new Vector4(0, 0, 0, 0);
      const v2 = new Vector4(10, 20, 30, 40);

      v.lerpVectors(v1, v2, 0.3);

      expect(v.x).toBe(3);
      expect(v.y).toBe(6);
      expect(v.z).toBe(9);
      expect(v.w).toBe(12);
    });

    test('negate() 应该取反向量', () => {
      const v = new Vector4(1, -2, 3, -4);
      v.negate();

      expect(v.x).toBe(-1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(-3);
      expect(v.w).toBe(4);
    });

    test('abs() 应该取绝对值', () => {
      const v = new Vector4(-1, -2, -3, -4);
      v.abs();

      expect(v.x).toBe(1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(3);
      expect(v.w).toBe(4);
    });

    test('floor() 应该向下取整', () => {
      const v = new Vector4(1.7, 2.9, -1.2, -2.5);
      v.floor();

      expect(v.x).toBe(1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(-2);
      expect(v.w).toBe(-3);
    });

    test('ceil() 应该向上取整', () => {
      const v = new Vector4(1.1, 2.3, -1.7, -2.2);
      v.ceil();

      expect(v.x).toBe(2);
      expect(v.y).toBe(3);
      expect(v.z).toBe(-1);
      expect(v.w).toBe(-2);
    });

    test('round() 应该四舍五入', () => {
      const v = new Vector4(1.4, 2.6, -1.4, -1.6);
      v.round();

      expect(v.x).toBe(1);
      expect(v.y).toBe(3);
      expect(v.z).toBe(-1);
      expect(v.w).toBe(-2);
    });

    test('min() 应该求最小值', () => {
      const v1 = new Vector4(5, 3, 7, 1);
      const v2 = new Vector4(2, 6, 4, 8);

      v1.min(v2);
      expect(v1.x).toBe(2);
      expect(v1.y).toBe(3);
      expect(v1.z).toBe(4);
      expect(v1.w).toBe(1);
    });

    test('max() 应该求最大值', () => {
      const v1 = new Vector4(5, 3, 7, 1);
      const v2 = new Vector4(2, 6, 4, 8);

      v1.max(v2);
      expect(v1.x).toBe(5);
      expect(v1.y).toBe(6);
      expect(v1.z).toBe(7);
      expect(v1.w).toBe(8);
    });

    test('clamp() 应该约束向量值', () => {
      const v = new Vector4(5, 15, 25, 35);
      const min = new Vector4(10, 10, 10, 10);
      const max = new Vector4(20, 20, 20, 20);

      v.clamp(min, max);
      expect(v.x).toBe(10);
      expect(v.y).toBe(15);
      expect(v.z).toBe(20);
      expect(v.w).toBe(20);
    });
  });

  describe('比较操作', () => {
    test('equals() 应该比较向量相等性', () => {
      const v1 = new Vector4(1, 2, 3, 4);
      const v2 = new Vector4(1, 2, 3, 4);
      const v3 = new Vector4(1, 2, 3, 5);

      expect(v1.equals(v2)).toBe(true);
      expect(v1.equals(v3)).toBe(false);
    });

    test('isZero() 应该检查零向量', () => {
      const v1 = new Vector4(0, 0, 0, 0);
      const v2 = new Vector4(1, 0, 0, 0);
      // Float32Array 存储时精度有限，使用更小的值
      const v3 = new Vector4(1e-15, 1e-15, 1e-15, 1e-15);

      expect(v1.isZero()).toBe(true);
      expect(v2.isZero()).toBe(false);
      // 极小数值会被 Float32Array 舍入为0
      expect(v3.isZero()).toBe(true);
    });
  });

  describe('数组转换', () => {
    test('toArray() 应该转换为数组', () => {
      const v = new Vector4(1, 2, 3, 4);
      const array = v.toArray();

      expect(array).toEqual([1, 2, 3, 4]);
    });

    test('fill() 应该填充到数组', () => {
      const v = new Vector4(1, 2, 3, 4);
      const array = [0, 0, 0, 0, 0, 0];

      v.fill(array, 1);
      expect(array).toEqual([0, 1, 2, 3, 4, 0]);
    });

    test('fromArray() 静态方法应该从数组创建', () => {
      const array = [3, 4, 5, 6];
      const v = Vector4.fromArray(array);

      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
      expect(v.z).toBe(5);
      expect(v.w).toBe(6);
    });
  });

  describe('规范接口兼容性', () => {
    test('应该转换为IVector4接口格式', () => {
      const v = new Vector4(1, 2, 3, 4);
      const iVector4 = v.toIVector4();

      expect(iVector4).toEqual({ x: 1, y: 2, z: 3, w: 4 });
    });

    test('应该从IVector4接口创建实例', () => {
      const iVector4 = { x: 3, y: 4, z: 5, w: 6 };
      const v = Vector4.fromIVector4(iVector4);

      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
      expect(v.z).toBe(5);
      expect(v.w).toBe(6);
    });

    test('fromIVector4() 应该从接口设置值', () => {
      const v = new Vector4();
      const iVector4 = { x: 5, y: 6, z: 7, w: 8 };

      v.fromIVector4(iVector4);
      expect(v.x).toBe(5);
      expect(v.y).toBe(6);
      expect(v.z).toBe(7);
      expect(v.w).toBe(8);
    });
  });

  describe('USD兼容性', () => {
    test('应该转换为USD兼容格式', () => {
      const v = new Vector4(1, 2, 3, 4);
      const usdValue = v.toUsdValue();

      expect(usdValue.type).toBe('float4');
      expect(usdValue.value).toEqual([1, 2, 3, 4]);
    });

    test('应该从USD格式创建实例', () => {
      const usdValue = { type: 'float4' as any, value: [3, 4, 5, 6] };
      const v = Vector4.fromUsdValue(usdValue);

      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
      expect(v.z).toBe(5);
      expect(v.w).toBe(6);
    });

    test('fromUsdValue() 应该从USD格式设置值', () => {
      const v = new Vector4();
      const usdValue = { type: 'float4' as any, value: [5, 6, 7, 8] };

      v.fromUsdValue(usdValue);
      expect(v.x).toBe(5);
      expect(v.y).toBe(6);
      expect(v.z).toBe(7);
      expect(v.w).toBe(8);
    });

    test('应该处理无效的USD值', () => {
      expect(() => {
        Vector4.fromUsdValue({ type: 'float4' as any, value: null });
      }).toThrow('Invalid UsdValue for Vector4');

      expect(() => {
        Vector4.fromUsdValue({ type: 'float4' as any, value: [1, 2, 3] });
      }).toThrow('Invalid UsdValue for Vector4');
    });
  });

  describe('Vector3转换', () => {
    test('toVector3() 应该转换为Vector3', () => {
      const v4 = new Vector4(1, 2, 3, 4);
      const v3 = v4.toVector3();

      expect(v3.x).toBe(1);
      expect(v3.y).toBe(2);
      expect(v3.z).toBe(3);
    });
  });

  describe('矩阵变换', () => {
    test('applyMatrix() 应该应用矩阵变换', () => {
      const v = new Vector4(1, 0, 0, 1);
      // 创建一个平移矩阵
      const m = new Matrix4();
      m.identity();
      // 手动设置平移矩阵
      const elements = m.getElements();
      elements[12] = 5; // x translation
      elements[13] = 10; // y translation
      elements[14] = 15; // z translation

      v.applyMatrix(m);
      expect(v.x).toBeCloseTo(6, 5);
      expect(v.y).toBeCloseTo(10, 5);
      expect(v.z).toBeCloseTo(15, 5);
      expect(v.w).toBeCloseTo(1, 5);
    });

    test('applyMatrix() 应该支持输出参数', () => {
      const v = new Vector4(1, 2, 3, 4);
      const out = new Vector4();
      const m = new Matrix4();
      m.identity();

      const result = v.applyMatrix(m, out);
      expect(result).toBe(out);
      (expect(result) as any).toEqualVector4(v);
    });
  });

  describe('静态方法', () => {
    test('fromNumber() 应该从标量创建', () => {
      const v = Vector4.fromNumber(5);
      (expect(v) as any).toEqualVector4({ x: 5, y: 5, z: 5, w: 5 });
    });

    test('add() 静态方法应该返回新向量', () => {
      const v1 = new Vector4(1, 2, 3, 4);
      const v2 = new Vector4(5, 6, 7, 8);
      const result = Vector4.add(v1, v2);

      (expect(result) as any).toEqualVector4({ x: 6, y: 8, z: 10, w: 12 });
      (expect(v1) as any).toEqualVector4({ x: 1, y: 2, z: 3, w: 4 });
      (expect(v2) as any).toEqualVector4({ x: 5, y: 6, z: 7, w: 8 });
    });

    test('subtract() 静态方法应该返回新向量', () => {
      const v1 = new Vector4(5, 6, 7, 8);
      const v2 = new Vector4(1, 2, 3, 4);
      const result = Vector4.subtract(v1, v2);

      (expect(result) as any).toEqualVector4({ x: 4, y: 4, z: 4, w: 4 });
    });

    test('multiply() 静态方法应该返回新向量', () => {
      const v1 = new Vector4(2, 3, 4, 5);
      const v2 = new Vector4(3, 4, 5, 6);
      const result = Vector4.multiply(v1, v2);

      (expect(result) as any).toEqualVector4({ x: 6, y: 12, z: 20, w: 30 });
    });

    test('dot() 静态方法应该计算点积', () => {
      const v1 = new Vector4(1, 2, 3, 4);
      const v2 = new Vector4(5, 6, 7, 8);
      const result = Vector4.dot(v1, v2);

      expect(result).toBe(70); // 1*5 + 2*6 + 3*7 + 4*8
    });

    test('distance() 应该计算距离', () => {
      const v1 = new Vector4(0, 0, 0, 0);
      const v2 = new Vector4(1, 1, 1, 1);
      const distance = Vector4.distance(v1, v2);

      expect(distance).toBeCloseTo(2, 5); // sqrt(1+1+1+1) = 2
    });

    test('distanceSquared() 应该计算距离平方', () => {
      const v1 = new Vector4(0, 0, 0, 0);
      const v2 = new Vector4(1, 1, 1, 1);
      const distanceSq = Vector4.distanceSquared(v1, v2);

      expect(distanceSq).toBe(4);
    });

    test('lerp() 静态方法应该插值', () => {
      const v1 = new Vector4(0, 0, 0, 0);
      const v2 = new Vector4(10, 20, 30, 40);
      const result = Vector4.lerp(v1, v2, 0.5);

      (expect(result) as any).toEqualVector4({ x: 5, y: 10, z: 15, w: 20 });
    });

    test('isValid() 应该检查向量有效性', () => {
      const valid = new Vector4(1, 2, 3, 4);
      const invalid1 = new Vector4(NaN, 2, 3, 4);
      const invalid2 = new Vector4(1, Infinity, 3, 4);

      expect(Vector4.isValid(valid)).toBe(true);
      expect(Vector4.isValid(invalid1)).toBe(false);
      expect(Vector4.isValid(invalid2)).toBe(false);
    });

    test('minComponent() 应该返回最小分量', () => {
      const v = new Vector4(5, 2, 8, 1);
      const min = Vector4.minComponent(v);

      expect(min).toBe(1);
    });

    test('maxComponent() 应该返回最大分量', () => {
      const v = new Vector4(5, 2, 8, 1);
      const max = Vector4.maxComponent(v);

      expect(max).toBe(8);
    });
  });

  describe('实用方法', () => {
    test('normalized() 应该返回归一化的新向量', () => {
      const v = new Vector4(3, 4, 0, 0);
      const normalized = v.normalized();

      expect(normalized.length()).toBeCloseTo(1, 5);
      (expect(v) as any).toEqualVector4({ x: 3, y: 4, z: 0, w: 0 });
    });

    test('multiplyScalar() 应该返回缩放后的新向量', () => {
      const v = new Vector4(1, 2, 3, 4);
      const result = v.multiplyScalar(2);

      (expect(result) as any).toEqualVector4({ x: 2, y: 4, z: 6, w: 8 });
      (expect(v) as any).toEqualVector4({ x: 1, y: 2, z: 3, w: 4 });
    });

    test('divideScalar() 应该返回除法后的新向量', () => {
      const v = new Vector4(2, 4, 6, 8);
      const result = v.divideScalar(2);

      (expect(result) as any).toEqualVector4({ x: 1, y: 2, z: 3, w: 4 });
    });

    test('divideScalar() 应该处理零除法', () => {
      const v = new Vector4(1, 2, 3, 4);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const result = v.divideScalar(0);

      (expect(result) as any).toEqualVector4({ x: 0, y: 0, z: 0, w: 0 });
      expect(consoleSpy).toHaveBeenCalledWith('Vector4.divideScalar: scalar is too close to zero');
      consoleSpy.mockRestore();
    });

    test('random() 应该设置随机值', () => {
      const v = new Vector4();
      v.random();

      expect(v.x).toBeGreaterThanOrEqual(0);
      expect(v.x).toBeLessThan(1);
      expect(v.y).toBeGreaterThanOrEqual(0);
      expect(v.y).toBeLessThan(1);
      expect(v.z).toBeGreaterThanOrEqual(0);
      expect(v.z).toBeLessThan(1);
      expect(v.w).toBeGreaterThanOrEqual(0);
      expect(v.w).toBeLessThan(1);
    });
  });

  describe('性能测试', () => {
    test('基础运算性能', () => {
      const v1 = new Vector4(1, 2, 3, 4);
      const v2 = new Vector4(5, 6, 7, 8);

      performanceTest(
        'Vector4.add',
        () => {
          v1.add(v2);
        },
        20000
      );

      performanceTest(
        'Vector4.multiply',
        () => {
          v1.multiply(2);
        },
        20000
      );

      performanceTest(
        'Vector4.normalize',
        () => {
          v1.normalize();
        },
        10000
      );

      performanceTest(
        'Vector4.dot',
        () => {
          v1.dot(v2);
        },
        20000
      );
    });
  });

  describe('随机测试', () => {
    test('随机向量运算正确性', () => {
      for (let i = 0; i < 100; i++) {
        const v1 = createRandomVector4();
        const v2 = createRandomVector4();

        // 测试交换律: a + b = b + a
        const sum1 = v1.clone().add(v2);
        const sum2 = v2.clone().add(v1);
        expect(sum1.equals(sum2)).toBe(true);

        // 测试长度计算
        const length = v1.length();
        const lengthSq = v1.lengthSquared();
        expect(Math.abs(length * length - lengthSq)).toBeLessThan(0.001);
      }
    });
  });

  describe('边界情况', () => {
    test('应该处理NaN值', () => {
      const v = new Vector4(NaN, 1, 2, 3);
      expect(v.x).toBeNaN();
      expect(v.length()).toBeNaN();
    });

    test('应该处理Infinity值', () => {
      const v = new Vector4(Infinity, 1, 2, 3);
      expect(v.x).toBe(Infinity);
      expect(v.length()).toBe(Infinity);
    });

    test('应该处理极大数值', () => {
      const v = new Vector4(1e10, 1e10, 1e10, 1e10);
      expect(v.length()).toBeCloseTo(2 * 1e10, 5);
    });

    test('应该处理极小数值', () => {
      const v = new Vector4(1e-10, 1e-10, 1e-10, 1e-10);
      expect(v.length()).toBeCloseTo(2 * 1e-10, 15);
    });
  });
});

// 辅助函数：创建随机Vector4
function createRandomVector4(): Vector4 {
  return new Vector4(
    testRandom.nextFloat(-100, 100),
    testRandom.nextFloat(-100, 100),
    testRandom.nextFloat(-100, 100),
    testRandom.nextFloat(-100, 100)
  );
}
