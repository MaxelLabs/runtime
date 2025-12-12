/**
 * Quaternion 完整测试套件
 * 目标：测试覆盖率 95%+
 */

import { Quaternion } from '../../src/core/quaternion';
import { Vector3 } from '../../src/core/vector3';
import { Matrix4 } from '../../src/core/matrix4';
import { MathConfig } from '../../src/config/mathConfig';
import { performanceTest, TestData } from '../setup';
import { expect } from '@jest/globals';

describe('Quaternion', () => {
  describe('构造函数和基础属性', () => {
    test('应该创建默认单位四元数', () => {
      const q = new Quaternion();
      expect(q.x).toBe(0);
      expect(q.y).toBe(0);
      expect(q.z).toBe(0);
      expect(q.w).toBe(1);
    });

    test('应该创建指定值的四元数', () => {
      const q = new Quaternion(0.1, 0.2, 0.3, 0.4);
      expect(q.x).toBe(0.1);
      expect(q.y).toBe(0.2);
      expect(q.z).toBe(0.3);
      expect(q.w).toBe(0.4);
    });

    test('应该正确设置和获取分量', () => {
      const q = new Quaternion();
      q.x = 0.5;
      q.y = 0.6;
      q.z = 0.7;
      q.w = 0.8;
      expect(q.x).toBe(0.5);
      expect(q.y).toBe(0.6);
      expect(q.z).toBe(0.7);
      expect(q.w).toBe(0.8);
    });
  });

  describe('常量验证', () => {
    test('应该有正确的单位四元数常量', () => {
      (expect(Quaternion.IDENTITY) as any).toEqualQuaternion({ x: 0, y: 0, z: 0, w: 1 });
    });

    test('常量应该是不可变的', () => {
      expect(() => {
        (Quaternion.IDENTITY as any).x = 2;
      }).toThrow();
    });
  });

  describe('对象池功能', () => {
    beforeEach(() => {
      MathConfig.enableObjectPool(true);
    });

    test('应该支持对象池创建和释放', () => {
      const q1 = Quaternion.create(0.1, 0.2, 0.3, 0.4);
      expect(q1.x).toBe(0.1);
      expect(q1.y).toBe(0.2);
      expect(q1.z).toBe(0.3);
      expect(q1.w).toBe(0.4);

      Quaternion.release(q1);

      const q2 = Quaternion.create(0.5, 0.6, 0.7, 0.8);
      expect(q2.x).toBe(0.5);
      expect(q2.y).toBe(0.6);
      expect(q2.z).toBe(0.7);
      expect(q2.w).toBe(0.8);
    });

    test('应该实现池化接口', () => {
      const q = new Quaternion(0.1, 0.2, 0.3, 0.4);
      expect(q.isPoolable()).toBe(true);

      q.reset();
      expect(q.x).toBe(0);
      expect(q.y).toBe(0);
      expect(q.z).toBe(0);
      expect(q.w).toBe(1);
    });
  });

  describe('基础操作', () => {
    let q: Quaternion;

    beforeEach(() => {
      q = new Quaternion();
    });

    test('set() 应该设置所有分量', () => {
      q.set(0.1, 0.2, 0.3, 0.4);
      (expect(q) as any).toEqualQuaternion({ x: 0.1, y: 0.2, z: 0.3, w: 0.4 });
    });

    test('identity() 应该设置为单位四元数', () => {
      q.set(0.1, 0.2, 0.3, 0.4);
      q.identity();
      (expect(q) as any).toEqualQuaternion({ x: 0, y: 0, z: 0, w: 1 });
    });

    test('copyFrom() 应该从其他四元数复制', () => {
      const source = new Quaternion(0.5, 0.6, 0.7, 0.8);
      q.copyFrom(source);
      (expect(q) as any).toEqualQuaternion({ x: 0.5, y: 0.6, z: 0.7, w: 0.8 });
    });

    test('clone() 应该创建四元数副本', () => {
      q.set(0.1, 0.2, 0.3, 0.4);
      const cloned = q.clone();

      expect(cloned).not.toBe(q);
      (expect(cloned) as any).toEqualQuaternion({ x: 0.1, y: 0.2, z: 0.3, w: 0.4 });
    });
  });

  describe('四元数运算', () => {
    test('multiply() 应该计算四元数乘法', () => {
      const q1 = new Quaternion(0, 0, 0, 1); // 单位四元数
      const q2 = new Quaternion(0.707, 0, 0, 0.707); // 绕X轴90度旋转

      q1.multiply(q2);
      expect(q1.x).toBeCloseTo(0.707, 3);
      expect(q1.y).toBeCloseTo(0, 3);
      expect(q1.z).toBeCloseTo(0, 3);
      expect(q1.w).toBeCloseTo(0.707, 3);
    });

    test('Quaternion.multiply() 静态方法', () => {
      const q1 = new Quaternion(0, 0, 0, 1);
      const q2 = new Quaternion(0.707, 0, 0, 0.707);

      const result = Quaternion.multiply(q1, q2);
      expect(result.x).toBeCloseTo(0.707, 3);
      expect(result.w).toBeCloseTo(0.707, 3);
    });

    test('invert() 应该计算逆四元数', () => {
      const q = new Quaternion(0.1, 0.2, 0.3, 0.4);
      q.normalize(); // 先归一化

      const original = q.clone();
      q.invert();

      // 四元数与其逆相乘应该得到单位四元数
      const identity = original.multiply(q);
      expect(identity.x).toBeCloseTo(0, 5);
      expect(identity.y).toBeCloseTo(0, 5);
      expect(identity.z).toBeCloseTo(0, 5);
      expect(identity.w).toBeCloseTo(1, 5);
    });

    test('conjugate() 应该计算共轭四元数', () => {
      const q = new Quaternion(0.1, 0.2, 0.3, 0.4);
      q.conjugate();

      expect(q.x).toBe(-0.1);
      expect(q.y).toBe(-0.2);
      expect(q.z).toBe(-0.3);
      expect(q.w).toBe(0.4);
    });
  });

  describe('长度和归一化', () => {
    test('length() 应该返回四元数长度', () => {
      const q = new Quaternion(1, 2, 2, 0);
      expect(q.length()).toBe(3);
    });

    test('lengthSquared() 应该返回长度平方', () => {
      const q = new Quaternion(1, 2, 2, 0);
      expect(q.lengthSquared()).toBe(9);
    });

    test('normalize() 应该正确归一化四元数', () => {
      const q = new Quaternion(1, 2, 2, 0);
      q.normalize();

      expect(q.length()).toBeCloseTo(1, 5);
      expect(q.x).toBeCloseTo(1 / 3, 5);
      expect(q.y).toBeCloseTo(2 / 3, 5);
      expect(q.z).toBeCloseTo(2 / 3, 5);
      expect(q.w).toBeCloseTo(0, 5);
    });

    test('零四元数归一化应该保持不变', () => {
      const q = new Quaternion(0, 0, 0, 0);
      q.normalize();
      (expect(q) as any).toEqualQuaternion({ x: 0, y: 0, z: 0, w: 0 });
    });
  });

  describe('轴角转换', () => {
    test('setFromAxisAngle() 应该从轴角设置四元数', () => {
      const q = new Quaternion();
      const axis = new Vector3(0, 1, 0); // Y轴
      const angle = Math.PI / 2; // 90度

      q.setFromAxisAngle(axis, angle);

      expect(q.x).toBeCloseTo(0, 5);
      expect(q.y).toBeCloseTo(0.707, 3);
      expect(q.z).toBeCloseTo(0, 5);
      expect(q.w).toBeCloseTo(0.707, 3);
    });

    test('转换为轴角的逆运算验证', () => {
      const q = new Quaternion();
      const axis = new Vector3(0, 1, 0);
      const angle = Math.PI / 2;

      q.setFromAxisAngle(axis, angle);

      // 验证设置后的四元数正确
      expect(q.y).toBeCloseTo(Math.sin(angle / 2), 3);
      expect(q.w).toBeCloseTo(Math.cos(angle / 2), 3);
    });
  });

  describe('欧拉角转换', () => {
    test('setFromEuler() 应该从欧拉角设置四元数', () => {
      const q = new Quaternion();

      // 测试简单的Y轴90度旋转
      q.setFromEuler(0, Math.PI / 2, 0);

      expect(q.x).toBeCloseTo(0, 5);
      expect(q.y).toBeCloseTo(0.707, 3);
      expect(q.z).toBeCloseTo(0, 5);
      expect(q.w).toBeCloseTo(0.707, 3);
    });
  });

  describe('矩阵转换', () => {
    test('setFromRotationMatrix() 应该从旋转矩阵设置四元数', () => {
      const q = new Quaternion();
      const matrix = new Matrix4();

      // 创建Y轴90度旋转矩阵
      matrix.rotateY(Math.PI / 2);

      q.setFromRotationMatrix(matrix);

      expect(q.x).toBeCloseTo(0, 3);
      expect(q.y).toBeCloseTo(0.707, 3);
      expect(q.z).toBeCloseTo(0, 3);
      expect(q.w).toBeCloseTo(0.707, 3);
    });

    test('Quaternion.fromMatrix() 静态方法', () => {
      const matrix = new Matrix4();
      matrix.rotateY(Math.PI / 2);

      const q = Quaternion.fromMatrix(matrix);
      expect(q.y).toBeCloseTo(0.707, 3);
      expect(q.w).toBeCloseTo(0.707, 3);
    });
  });

  describe('插值', () => {
    test('slerp() 应该球面线性插值', () => {
      const q1 = new Quaternion(0, 0, 0, 1); // 单位四元数
      const q2 = new Quaternion();
      q2.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2); // Y轴90度

      q1.slerp(q2, 0.5);

      // 中间值应该是45度旋转
      expect(q1.y).toBeCloseTo(Math.sin(Math.PI / 8), 3);
      expect(q1.w).toBeCloseTo(Math.cos(Math.PI / 8), 3);
    });

    test('slerpQuaternions() 应该在两个四元数间插值', () => {
      const result = new Quaternion();
      const q1 = new Quaternion(0, 0, 0, 1);
      const q2 = new Quaternion();
      q2.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);

      result.slerpQuaternions(q1, q2, 0.5);

      expect(result.y).toBeCloseTo(Math.sin(Math.PI / 8), 3);
      expect(result.w).toBeCloseTo(Math.cos(Math.PI / 8), 3);
    });
  });

  describe('规范接口兼容性', () => {
    test('应该转换为IQuaternion接口格式', () => {
      const q = new Quaternion(0.1, 0.2, 0.3, 0.4);
      const iQuaternion = q.toIQuaternion();

      expect(iQuaternion).toEqual({ x: 0.1, y: 0.2, z: 0.3, w: 0.4 });
    });

    test('应该从IQuaternion接口创建实例', () => {
      const iQuaternion = { x: 0.5, y: 0.6, z: 0.7, w: 0.8 };
      const q = Quaternion.fromIQuaternion(iQuaternion);

      (expect(q) as any).toEqualQuaternion(iQuaternion);
    });
  });

  describe('USD兼容性', () => {
    test('应该转换为USD兼容格式', () => {
      const q = new Quaternion(0.1, 0.2, 0.3, 0.4);
      const usdValue = q.toUsdValue();

      expect(usdValue.type).toBe('quatf');
      expect(usdValue.value).toEqual([0.1, 0.2, 0.3, 0.4]);
    });
  });

  describe('性能测试', () => {
    test('基础运算性能', () => {
      const q1 = new Quaternion(0.1, 0.2, 0.3, 0.4);
      const q2 = new Quaternion(0.5, 0.6, 0.7, 0.8);

      performanceTest(
        'Quaternion.multiply',
        () => {
          q1.multiply(q2);
        },
        10000
      );

      performanceTest(
        'Quaternion.normalize',
        () => {
          q1.normalize();
        },
        10000
      );

      performanceTest(
        'Quaternion.slerp',
        () => {
          q1.slerp(q2, 0.5);
        },
        5000
      );
    });
  });

  describe('随机测试', () => {
    test('随机四元数运算正确性', () => {
      for (let i = 0; i < 50; i++) {
        const q1Data = TestData.randomQuaternion();
        const q2Data = TestData.randomQuaternion();

        const q1 = new Quaternion(q1Data.x, q1Data.y, q1Data.z, q1Data.w);
        const q2 = new Quaternion(q2Data.x, q2Data.y, q2Data.z, q2Data.w);

        q1.normalize();
        q2.normalize();

        // 归一化后长度应为1
        expect(q1.length()).toBeCloseTo(1, 5);
        expect(q2.length()).toBeCloseTo(1, 5);

        // 四元数与其逆相乘应得到单位四元数
        const original = q1.clone();
        const inverted = q1.clone().invert();
        const identity = original.multiply(inverted);

        expect(identity.length()).toBeCloseTo(1, 3);
      }
    });
  });

  describe('边界情况', () => {
    test('应该处理NaN值', () => {
      const q = new Quaternion(NaN, 0.2, 0.3, 0.4);
      expect(q.length()).toBeNaN();
    });

    test('应该处理Infinity值', () => {
      const q = new Quaternion(Infinity, 0.2, 0.3, 0.4);
      expect(q.length()).toBe(Infinity);
    });
  });
});
