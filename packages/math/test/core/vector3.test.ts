/**
 * Vector3 完整测试套件
 * 目标：测试覆盖率 95%+
 */

import { Vector3 } from '../../src/core/vector3';
import { Matrix4 } from '../../src/core/matrix4';
import { Quaternion } from '../../src/core/quaternion';
import { MathConfig } from '../../src/config/mathConfig';
import { performanceTest, TestData, testRandom } from '../setup';

describe('Vector3', () => {
  
  describe('构造函数和基础属性', () => {
    test('应该创建默认零向量', () => {
      const v = new Vector3();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);
    });

    test('应该创建指定值的向量', () => {
      const v = new Vector3(1, 2, 3);
      expect(v.x).toBe(1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(3);
    });

    test('应该正确设置和获取坐标', () => {
      const v = new Vector3();
      v.x = 5;
      v.y = 10;
      v.z = 15;
      expect(v.x).toBe(5);
      expect(v.y).toBe(10);
      expect(v.z).toBe(15);
    });
  });

  describe('常量验证', () => {
    test('应该有正确的常量值', () => {
      expect(Vector3.X).toEqualVector3({ x: 1, y: 0, z: 0 });
      expect(Vector3.Y).toEqualVector3({ x: 0, y: 1, z: 0 });
      expect(Vector3.Z).toEqualVector3({ x: 0, y: 0, z: 1 });
      expect(Vector3.ONE).toEqualVector3({ x: 1, y: 1, z: 1 });
      expect(Vector3.ZERO).toEqualVector3({ x: 0, y: 0, z: 0 });
    });

    test('常量应该是不可变的', () => {
      expect(() => {
        (Vector3.X as any).x = 2;
      }).toThrow();
    });
  });

  describe('对象池功能', () => {
    beforeEach(() => {
      // 确保对象池启用
      MathConfig.enableObjectPool(true);
    });

    test('应该支持对象池创建和释放', () => {
      const v1 = Vector3.create(1, 2, 3);
      expect(v1.x).toBe(1);
      expect(v1.y).toBe(2);
      expect(v1.z).toBe(3);

      // 释放到对象池
      Vector3.release(v1);

      // 再次创建应该复用对象
      const v2 = Vector3.create(4, 5, 6);
      expect(v2.x).toBe(4);
      expect(v2.y).toBe(5);
      expect(v2.z).toBe(6);
    });

    test('应该预分配对象到池中', () => {
      const initialStats = Vector3.getPoolStats();
      Vector3.preallocate(5);
      const afterStats = Vector3.getPoolStats();
      
      expect(afterStats.poolSize - initialStats.poolSize).toBe(5);
    });

    test('应该提供池统计信息', () => {
      const stats = Vector3.getPoolStats();
      expect(typeof stats.totalCreated).toBe('number');
      expect(typeof stats.totalReleased).toBe('number');
      expect(typeof stats.currentActive).toBe('number');
      expect(typeof stats.poolSize).toBe('number');
    });

    test('应该实现池化接口', () => {
      const v = new Vector3(1, 2, 3);
      expect(v.isPoolable()).toBe(true);
      
      v.reset();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);
    });
  });

  describe('基础设置方法', () => {
    let v: Vector3;

    beforeEach(() => {
      v = new Vector3();
    });

    test('set() 应该设置所有分量', () => {
      v.set(1, 2, 3);
      expect(v).toEqualVector3({ x: 1, y: 2, z: 3 });
    });

    test('setZero() 应该设置为零向量', () => {
      v.set(5, 6, 7);
      v.setZero();
      expect(v).toEqualVector3({ x: 0, y: 0, z: 0 });
    });

    test('setFromNumber() 应该设置为相同的标量值', () => {
      v.setFromNumber(5);
      expect(v).toEqualVector3({ x: 5, y: 5, z: 5 });
    });

    test('setFromArray() 应该从数组设置', () => {
      v.setFromArray([1, 2, 3]);
      expect(v).toEqualVector3({ x: 1, y: 2, z: 3 });

      // 测试偏移量
      v.setFromArray([0, 1, 2, 3, 4], 2);
      expect(v).toEqualVector3({ x: 2, y: 3, z: 4 });

      // 测试数组长度不足的情况
      v.setFromArray([1, 2]);
      expect(v).toEqualVector3({ x: 1, y: 2, z: 0 });
    });

    test('copyFrom() 应该从其他向量复制', () => {
      const source = new Vector3(10, 20, 30);
      v.copyFrom(source);
      expect(v).toEqualVector3({ x: 10, y: 20, z: 30 });

      // 测试链式调用
      const result = v.copyFrom(Vector3.X);
      expect(result).toBe(v);
      expect(v).toEqualVector3({ x: 1, y: 0, z: 0 });
    });
  });

  describe('元素访问', () => {
    let v: Vector3;

    beforeEach(() => {
      v = new Vector3(1, 2, 3);
    });

    test('setElement() 应该设置指定索引的元素', () => {
      v.setElement(0, 10);
      expect(v.x).toBe(10);

      v.setElement(1, 20);
      expect(v.y).toBe(20);

      v.setElement(2, 30);
      expect(v.z).toBe(30);

      // 测试链式调用
      const result = v.setElement(0, 100);
      expect(result).toBe(v);
    });

    test('getElement() 应该获取指定索引的元素', () => {
      expect(v.getElement(0)).toBe(1);
      expect(v.getElement(1)).toBe(2);
      expect(v.getElement(2)).toBe(3);
    });

    test('访问无效索引应该处理错误', () => {
      // 模拟 console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(v.getElement(3)).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('index is out of range: 3');

      v.setElement(-1, 100);
      expect(consoleSpy).toHaveBeenCalledWith('index is out of range: -1');

      consoleSpy.mockRestore();
    });
  });

  describe('算术运算', () => {
    let v1: Vector3;
    let v2: Vector3;

    beforeEach(() => {
      v1 = new Vector3(1, 2, 3);
      v2 = new Vector3(4, 5, 6);
    });

    test('add() 支持多种参数类型', () => {
      // 向量加法
      v1.add(v2);
      expect(v1).toEqualVector3({ x: 5, y: 7, z: 9 });

      // 标量加法
      v1.set(1, 2, 3);
      v1.add(10);
      expect(v1).toEqualVector3({ x: 11, y: 12, z: 13 });

      // 数组加法
      v1.set(1, 2, 3);
      v1.add([10, 20, 30]);
      expect(v1).toEqualVector3({ x: 11, y: 22, z: 33 });
    });

    test('addVectors() 应该相加两个向量', () => {
      const result = new Vector3();
      result.addVectors(v1, v2);
      expect(result).toEqualVector3({ x: 5, y: 7, z: 9 });

      // 测试链式调用
      const chainResult = result.addVectors(new Vector3(1, 0, 0), new Vector3(0, 1, 0));
      expect(chainResult).toBe(result);
      expect(result).toEqualVector3({ x: 1, y: 1, z: 0 });
    });

    test('addScaledVector() 应该相加缩放后的向量', () => {
      v1.addScaledVector(v2, 2);
      expect(v1).toEqualVector3({ x: 9, y: 12, z: 15 });

      // 测试负缩放
      v1.set(1, 2, 3);
      v1.addScaledVector(v2, -0.5);
      expect(v1).toEqualVector3({ x: -1, y: -0.5, z: 0 });
    });

    test('subtract() 支持多种参数类型', () => {
      // 向量减法
      v1.subtract(v2);
      expect(v1).toEqualVector3({ x: -3, y: -3, z: -3 });

      // 标量减法
      v1.set(10, 20, 30);
      v1.subtract(5);
      expect(v1).toEqualVector3({ x: 5, y: 15, z: 25 });

      // 数组减法
      v1.set(10, 20, 30);
      v1.subtract([1, 2, 3]);
      expect(v1).toEqualVector3({ x: 9, y: 18, z: 27 });
    });

    test('subtractVectors() 应该相减两个向量', () => {
      const result = new Vector3();
      result.subtractVectors(v2, v1);
      expect(result).toEqualVector3({ x: 3, y: 3, z: 3 });
    });

    test('multiply() 支持多种参数类型', () => {
      // 向量乘法
      v1.multiply(v2);
      expect(v1).toEqualVector3({ x: 4, y: 10, z: 18 });

      // 标量乘法
      v1.set(2, 3, 4);
      v1.multiply(2);
      expect(v1).toEqualVector3({ x: 4, y: 6, z: 8 });

      // 数组乘法
      v1.set(2, 3, 4);
      v1.multiply([2, 3, 4]);
      expect(v1).toEqualVector3({ x: 4, y: 9, z: 16 });
    });

    test('multiplyVectors() 应该相乘两个向量', () => {
      const result = new Vector3();
      result.multiplyVectors(v1, v2);
      expect(result).toEqualVector3({ x: 4, y: 10, z: 18 });
    });
  });

  describe('长度计算', () => {
    test('getLength() 应该返回向量长度', () => {
      const v = new Vector3(3, 4, 0);
      expect(v.getLength()).toBe(5);

      const v2 = new Vector3(1, 1, 1);
      expect(v2.getLength()).toBeCloseTo(Math.sqrt(3));
    });

    test('getLengthSquared() 应该返回长度的平方', () => {
      const v = new Vector3(3, 4, 0);
      expect(v.getLengthSquared()).toBe(25);

      const v2 = new Vector3(1, 1, 1);
      expect(v2.getLengthSquared()).toBe(3);
    });
  });

  describe('normalize() 归一化', () => {
    test('应该正确归一化向量', () => {
      const v = new Vector3(3, 4, 0);
      v.normalize();
      expect(v.getLength()).toBeCloseTo(1);
      expect(v.x).toBeCloseTo(0.6);
      expect(v.y).toBeCloseTo(0.8);
      expect(v.z).toBe(0);
    });

    test('零向量归一化应该保持不变', () => {
      const v = new Vector3(0, 0, 0);
      v.normalize();
      expect(v).toEqualVector3({ x: 0, y: 0, z: 0 });
    });

    test('单位向量归一化应该保持不变', () => {
      const v = new Vector3(1, 0, 0);
      v.normalize();
      expect(v).toEqualVector3({ x: 1, y: 0, z: 0 });
    });

    test('应该返回自身支持链式调用', () => {
      const v = new Vector3(2, 2, 2);
      const result = v.normalize();
      expect(result).toBe(v);
    });
  });

  describe('点积和叉积', () => {
    test('dot() 应该计算点积', () => {
      const v1 = new Vector3(1, 2, 3);
      const v2 = new Vector3(4, 5, 6);
      
      expect(v1.dot(v2)).toBe(32); // 1*4 + 2*5 + 3*6 = 32
    });

    test('Vector3.dot() 静态方法应该计算点积', () => {
      const v1 = new Vector3(1, 0, 0);
      const v2 = new Vector3(0, 1, 0);
      
      expect(Vector3.dot(v1, v2)).toBe(0); // 垂直向量点积为0
    });

    test('cross() 应该计算叉积', () => {
      const v1 = new Vector3(1, 0, 0);
      const v2 = new Vector3(0, 1, 0);
      
      v1.cross(v2);
      expect(v1).toEqualVector3({ x: 0, y: 0, z: 1 });
    });

    test('crossVectors() 应该计算两个向量的叉积', () => {
      const result = new Vector3();
      const v1 = new Vector3(1, 0, 0);
      const v2 = new Vector3(0, 1, 0);
      
      result.crossVectors(v1, v2);
      expect(result).toEqualVector3({ x: 0, y: 0, z: 1 });
    });

    test('叉积的反交换律', () => {
      const v1 = new Vector3(1, 2, 3);
      const v2 = new Vector3(4, 5, 6);
      
      const cross1 = new Vector3().crossVectors(v1, v2);
      const cross2 = new Vector3().crossVectors(v2, v1);
      
      expect(cross1.x).toBeCloseTo(-cross2.x);
      expect(cross1.y).toBeCloseTo(-cross2.y);
      expect(cross1.z).toBeCloseTo(-cross2.z);
    });
  });

  describe('距离计算', () => {
    test('distanceTo() 应该计算到另一个向量的距离', () => {
      const v1 = new Vector3(0, 0, 0);
      const v2 = new Vector3(3, 4, 0);
      
      expect(v1.distanceTo(v2)).toBe(5);
    });

    test('distanceToSquared() 应该计算距离的平方', () => {
      const v1 = new Vector3(0, 0, 0);
      const v2 = new Vector3(3, 4, 0);
      
      expect(v1.distanceToSquared(v2)).toBe(25);
    });

    test('Vector3.distance() 静态方法', () => {
      const v1 = new Vector3(1, 1, 1);
      const v2 = new Vector3(2, 2, 2);
      
      expect(Vector3.distance(v1, v2)).toBeCloseTo(Math.sqrt(3));
    });
  });

  describe('插值方法', () => {
    test('lerp() 应该线性插值', () => {
      const v1 = new Vector3(0, 0, 0);
      const v2 = new Vector3(10, 20, 30);
      
      v1.lerp(v2, 0.5);
      expect(v1).toEqualVector3({ x: 5, y: 10, z: 15 });

      // 测试边界值
      v1.set(0, 0, 0);
      v1.lerp(v2, 0);
      expect(v1).toEqualVector3({ x: 0, y: 0, z: 0 });

      v1.set(0, 0, 0);
      v1.lerp(v2, 1);
      expect(v1).toEqualVector3({ x: 10, y: 20, z: 30 });
    });

    test('Vector3.lerp() 静态方法', () => {
      const v1 = new Vector3(0, 0, 0);
      const v2 = new Vector3(10, 20, 30);
      const result = Vector3.lerp(v1, v2, 0.3);
      
      expect(result).toEqualVector3({ x: 3, y: 6, z: 9 });
    });

    test('lerpVectors() 应该在两个向量间插值', () => {
      const result = new Vector3();
      const v1 = new Vector3(-10, -20, -30);
      const v2 = new Vector3(10, 20, 30);
      
      result.lerpVectors(v1, v2, 0.25);
      expect(result).toEqualVector3({ x: -5, y: -10, z: -15 });
    });
  });

  describe('向量比较和相等性', () => {
    test('equals() 应该比较向量相等性', () => {
      const v1 = new Vector3(1, 2, 3);
      const v2 = new Vector3(1, 2, 3);
      const v3 = new Vector3(1, 2, 4);
      
      expect(v1.equals(v2)).toBe(true);
      expect(v1.equals(v3)).toBe(false);
    });

    test('isZero() 应该检查是否为零向量', () => {
      const v1 = new Vector3(0, 0, 0);
      const v2 = new Vector3(1e-8, 1e-8, 1e-8);
      const v3 = new Vector3(0.1, 0, 0);
      
      expect(v1.isZero()).toBe(true);
      expect(v2.isZero()).toBe(true);
      expect(v3.isZero()).toBe(false);
    });
  });

  describe('工具方法', () => {
    test('clone() 应该创建向量副本', () => {
      const v1 = new Vector3(1, 2, 3);
      const v2 = v1.clone();
      
      expect(v2).not.toBe(v1);
      expect(v2).toEqualVector3({ x: 1, y: 2, z: 3 });
    });

    test('negate() 应该取反向量', () => {
      const v = new Vector3(1, -2, 3);
      v.negate();
      expect(v).toEqualVector3({ x: -1, y: 2, z: -3 });
    });

    test('abs() 应该取绝对值', () => {
      const v = new Vector3(-1, -2, -3);
      v.abs();
      expect(v).toEqualVector3({ x: 1, y: 2, z: 3 });
    });

    test('floor() 应该向下取整', () => {
      const v = new Vector3(1.7, 2.3, -1.8);
      v.floor();
      expect(v).toEqualVector3({ x: 1, y: 2, z: -2 });
    });

    test('ceil() 应该向上取整', () => {
      const v = new Vector3(1.3, 2.7, -1.2);
      v.ceil();
      expect(v).toEqualVector3({ x: 2, y: 3, z: -1 });
    });

    test('round() 应该四舍五入', () => {
      const v = new Vector3(1.4, 2.6, -1.5);
      v.round();
      expect(v).toEqualVector3({ x: 1, y: 3, z: -1 });
    });

    test('min() 应该取最小值', () => {
      const v1 = new Vector3(1, 5, 3);
      const v2 = new Vector3(2, 3, 4);
      
      v1.min(v2);
      expect(v1).toEqualVector3({ x: 1, y: 3, z: 3 });
    });

    test('max() 应该取最大值', () => {
      const v1 = new Vector3(1, 5, 3);
      const v2 = new Vector3(2, 3, 4);
      
      v1.max(v2);
      expect(v1).toEqualVector3({ x: 2, y: 5, z: 4 });
    });

    test('clamp() 应该限制在范围内', () => {
      const v = new Vector3(-5, 0, 15);
      const min = new Vector3(-2, -1, 0);
      const max = new Vector3(2, 1, 10);
      
      v.clamp(min, max);
      expect(v).toEqualVector3({ x: -2, y: 0, z: 10 });
    });

    test('scale() 应该缩放向量', () => {
      const v = new Vector3(2, 3, 4);
      v.scale(2.5);
      expect(v).toEqualVector3({ x: 5, y: 7.5, z: 10 });
    });

    test('setLength() 应该设置向量长度', () => {
      const v = new Vector3(3, 4, 0); // 长度为 5
      v.setLength(10);
      expect(v.getLength()).toBeCloseTo(10);
      expect(v.x).toBeCloseTo(6);  // (3/5) * 10
      expect(v.y).toBeCloseTo(8);  // (4/5) * 10
    });
  });

  describe('数组和序列化', () => {
    test('toArray() 应该转换为数组', () => {
      const v = new Vector3(1, 2, 3);
      expect(v.toArray()).toEqual([1, 2, 3]);
    });

    test('fill() 应该填充到数组', () => {
      const v = new Vector3(1, 2, 3);
      const arr = new Array(10).fill(0);
      v.fill(arr, 3);
      expect(arr[3]).toBe(1);
      expect(arr[4]).toBe(2);
      expect(arr[5]).toBe(3);
    });
  });

  describe('矩阵变换', () => {
    test('applyMatrix() 应该应用矩阵变换', () => {
      const v = new Vector3(1, 0, 0);
      const m = new Matrix4();
      
      // 创建一个沿Y轴90度旋转的矩阵
      // Matrix4 旋转方法需要确认实际 API
      // m.makeRotationY(Math.PI / 2);
      v.applyMatrix(m);
      
      expect(v.x).toBeCloseTo(0, 5);
      expect(v.y).toBeCloseTo(0, 5);
      expect(v.z).toBeCloseTo(-1, 5);
    });

    test('applyQuaternion() 应该应用四元数旋转', () => {
      const v = new Vector3(1, 0, 0);
      const q = new Quaternion();
      
      // Y轴90度旋转
      q.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
      v.applyQuaternion(q);
      
      expect(v.x).toBeCloseTo(0, 5);
      expect(v.y).toBeCloseTo(0, 5);
      expect(v.z).toBeCloseTo(-1, 5);
    });
  });

  describe('更多工具方法', () => {
    test('normalized() 应该返回新的归一化向量', () => {
      const v = new Vector3(3, 4, 0);
      const normalized = v.normalized();
      
      expect(normalized).not.toBe(v);
      expect(normalized.getLength()).toBeCloseTo(1);
      expect(normalized.x).toBeCloseTo(0.6);
      expect(normalized.y).toBeCloseTo(0.8);
    });

    test('multiplyScalar() 应该返回新的缩放向量', () => {
      const v = new Vector3(1, 2, 3);
      const scaled = v.multiplyScalar(2.5);
      
      expect(scaled).not.toBe(v);
      expect(scaled).toEqualVector3({ x: 2.5, y: 5, z: 7.5 });
    });

    test('divideScalar() 应该返回新的除法向量', () => {
      const v = new Vector3(6, 9, 12);
      const divided = v.divideScalar(3);
      
      expect(divided).not.toBe(v);
      expect(divided).toEqualVector3({ x: 2, y: 3, z: 4 });
    });

    test('divideScalar() 应该处理零除数', () => {
      const v = new Vector3(1, 2, 3);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = v.divideScalar(0);
      expect(consoleSpy).toHaveBeenCalledWith('Vector3.divideScalar: scalar is too close to zero');
      expect(result).toEqualVector3({ x: 0, y: 0, z: 0 });
      
      consoleSpy.mockRestore();
    });
  });

  describe('规范接口兼容性', () => {
    test('应该转换为IVector3接口格式', () => {
      const v = new Vector3(1, 2, 3);
      const iVector = v.toIVector3();
      
      expect(iVector).toEqual({ x: 1, y: 2, z: 3 });
    });

    test('应该从IVector3接口创建实例', () => {
      const iVector = { x: 5, y: 10, z: 15 };
      const v = Vector3.fromIVector3(iVector);
      
      expect(v).toEqualVector3(iVector);
    });

    test('应该设置IVector3接口值', () => {
      const v = new Vector3();
      const iVector = { x: 7, y: 14, z: 21 };
      
      v.fromIVector3(iVector);
      expect(v).toEqualVector3(iVector);
    });
  });

  describe('USD兼容性', () => {
    test('应该转换为USD兼容格式', () => {
      const v = new Vector3(1.5, 2.5, 3.5);
      const usdValue = v.toUsdValue();
      
      expect(usdValue.type).toBe('float3');
      expect(usdValue.value).toEqual([1.5, 2.5, 3.5]);
    });
    
    test('应该从usd值创建向量', () => {
      const usdValue = {
        type: 'float3' as any, // 使用 any 类型避免类型错误
        value: [2.1, 3.2, 4.3]
      };
      
      const v = Vector3.fromUsdValue(usdValue);
      expect(v).toEqualVector3({ x: 2.1, y: 3.2, z: 4.3 });
    });
  });

  describe('边界情况', () => {
    test('应该处理NaN值', () => {
      const v = new Vector3(NaN, 2, 3);
      expect(v.getLength()).toBeNaN();
    });

    test('应该处理Infinity值', () => {
      const v = new Vector3(Infinity, 2, 3);
      expect(v.getLength()).toBe(Infinity);
    });

    test('应该处理非常小的值', () => {
      const v = new Vector3(1e-10, 1e-10, 1e-10);
      v.normalize();
      expect(v.getLength()).toBeCloseTo(1);
    });

    test('应该处理非常大的值', () => {
      const v = new Vector3(1e10, 1e10, 1e10);
      const length = v.getLength();
      expect(isFinite(length)).toBe(true);
    });
  });

  describe('性能测试', () => {
    test('基础运算性能', () => {
      const v1 = new Vector3(1, 2, 3);
      const v2 = new Vector3(4, 5, 6);

      performanceTest('Vector3.add', () => {
        v1.add(v2);
      }, 10000);

      performanceTest('Vector3.normalize', () => {
        v1.normalize();
      }, 10000);

      performanceTest('Vector3.dot', () => {
        v1.dot(v2);
      }, 10000);
    });

    test('对象池性能', () => {
      performanceTest('Vector3.create/release (池化)', () => {
        const v = Vector3.create(1, 2, 3);
        Vector3.release(v);
      }, 5000);

      performanceTest('new Vector3 (无池化)', () => {
        new Vector3(1, 2, 3);
      }, 5000);
    });
  });

  describe('随机测试', () => {
    test('随机向量运算正确性', () => {
      for (let i = 0; i < 100; i++) {
        const v1Data = TestData.randomVector3();
        const v2Data = TestData.randomVector3();
        
        const v1 = new Vector3(v1Data.x, v1Data.y, v1Data.z);
        const v2 = new Vector3(v2Data.x, v2Data.y, v2Data.z);
        
        // 加法交换律
        const sum1 = v1.clone().add(v2);
        const sum2 = v2.clone().add(v1);
        expect(sum1.x).toBeCloseTo(sum2.x, 10);
        expect(sum1.y).toBeCloseTo(sum2.y, 10);
        expect(sum1.z).toBeCloseTo(sum2.z, 10);
        
        // 点积交换律
        expect(v1.dot(v2)).toBeCloseTo(v2.dot(v1), 10);
        
        // 归一化后长度应为1（除非是零向量）
        if (v1.getLengthSquared() > 1e-10) {
          const normalized = v1.clone().normalize();
          expect(normalized.getLength()).toBeCloseTo(1, 5);
        }
      }
    });
  });

  describe('内存和清理', () => {
    test('大量对象创建不应导致内存泄漏', () => {
      const initialStats = Vector3.getPoolStats();
      
      const vectors: Vector3[] = [];
      for (let i = 0; i < 1000; i++) {
        vectors.push(Vector3.create(i, i * 2, i * 3));
      }
      
      for (const v of vectors) {
        Vector3.release(v);
      }
      
      const finalStats = Vector3.getPoolStats();
      expect(finalStats.currentActive).toBeLessThanOrEqual(initialStats.currentActive + 10);
    });
  });
});
