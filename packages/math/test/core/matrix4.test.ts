/**
 * Matrix4 测试套件
 * 目标：测试覆盖率 95%+
 */

import { Matrix4 } from '../../src/core/matrix4';
import { Vector3 } from '../../src/core/vector3';
import { Quaternion } from '../../src/core/quaternion';
import { MathConfig } from '../../src/config/mathConfig';
import { performanceTest, TestData } from '../setup';

describe('Matrix4', () => {
  describe('构造函数和基础属性', () => {
    test('应该创建默认单位矩阵', () => {
      const m = new Matrix4();
      const elements = m.getElements();

      // 检查单位矩阵
      expect(elements[0]).toBe(1); // m11
      expect(elements[5]).toBe(1); // m22
      expect(elements[10]).toBe(1); // m33
      expect(elements[15]).toBe(1); // m44

      // 检查其他元素为0
      expect(elements[1]).toBe(0);
      expect(elements[2]).toBe(0);
      expect(elements[4]).toBe(0);
    });

    test('应该正确获取和设置矩阵元素', () => {
      const m = new Matrix4();
      const testElements = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

      m.set(
        testElements[0],
        testElements[4],
        testElements[8],
        testElements[12],
        testElements[1],
        testElements[5],
        testElements[9],
        testElements[13],
        testElements[2],
        testElements[6],
        testElements[10],
        testElements[14],
        testElements[3],
        testElements[7],
        testElements[11],
        testElements[15]
      );

      const elements = m.getElements();
      expect(elements).toEqual(testElements);
    });
  });

  describe('常量验证', () => {
    test('应该有正确的单位矩阵常量', () => {
      const identity = Matrix4.IDENTITY;
      const elements = identity.getElements();

      expect(elements[0]).toBe(1);
      expect(elements[5]).toBe(1);
      expect(elements[10]).toBe(1);
      expect(elements[15]).toBe(1);
    });

    test('应该有正确的零矩阵常量', () => {
      const zero = Matrix4.ZERO;
      const elements = zero.getElements();

      for (let i = 0; i < 16; i++) {
        expect(elements[i]).toBe(0);
      }
    });

    test('常量应该是不可变的', () => {
      expect(() => {
        (Matrix4.IDENTITY as any).set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2);
      }).toThrow();
    });
  });

  describe('对象池功能', () => {
    beforeEach(() => {
      MathConfig.enableObjectPool(true);
    });

    test('应该支持对象池创建和释放', () => {
      const m1 = Matrix4.create();
      expect(m1).toBeInstanceOf(Matrix4);

      Matrix4.release(m1);

      const m2 = Matrix4.create();
      expect(m2).toBeInstanceOf(Matrix4);
    });

    test('应该实现池化接口', () => {
      const m = new Matrix4();
      expect(m.isPoolable()).toBe(true);

      m.reset();
      expect(m.getElements()).toEqualMatrix4(Matrix4.IDENTITY.getElements());
    });
  });

  describe('基础操作', () => {
    let m: Matrix4;

    beforeEach(() => {
      m = new Matrix4();
    });

    test('identity() 应该设置为单位矩阵', () => {
      m.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
      m.identity();

      expect(m.getElements()).toEqualMatrix4(Matrix4.IDENTITY.getElements());
    });

    test('copyFrom() 应该从其他矩阵复制', () => {
      const source = new Matrix4();
      source.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

      m.copyFrom(source);
      expect(m.getElements()).toEqual(source.getElements());
    });

    test('clone() 应该创建矩阵副本', () => {
      m.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
      const cloned = m.clone();

      expect(cloned).not.toBe(m);
      expect(cloned.getElements()).toEqual(m.getElements());
    });
  });

  describe('矩阵运算', () => {
    test('multiply() 应该计算矩阵乘法', () => {
      const m1 = new Matrix4();
      const m2 = new Matrix4();

      m1.set(1, 0, 0, 1, 0, 1, 0, 2, 0, 0, 1, 3, 0, 0, 0, 1);
      m2.set(1, 0, 0, 4, 0, 1, 0, 5, 0, 0, 1, 6, 0, 0, 0, 1);

      m1.multiply(m2);

      const result = m1.getElements();
      expect(result[12]).toBe(5); // 平移x = 1 + 4
      expect(result[13]).toBe(7); // 平移y = 2 + 5
      expect(result[14]).toBe(9); // 平移z = 3 + 6
    });

    test('Matrix4.multiply() 静态方法', () => {
      const m1 = new Matrix4();
      const m2 = new Matrix4();
      const target = new Matrix4();

      // 使用实际存在的方法
      m1.scale(new Vector3(2, 3, 4));
      m2.translate(new Vector3(1, 2, 3));

      const result = Matrix4.multiply(m1, m2, target);
      expect(result).toBeInstanceOf(Matrix4);
    });

    test('invert() 应该计算逆矩阵', () => {
      const m = new Matrix4();
      m.scale(new Vector3(2, 3, 4));

      const original = m.clone();
      m.invert();

      // 矩阵与其逆相乘应该得到单位矩阵
      const identity = original.multiply(m);
      const elements = identity.getElements();

      expect(elements[0]).toBeCloseTo(1, 5);
      expect(elements[5]).toBeCloseTo(1, 5);
      expect(elements[10]).toBeCloseTo(1, 5);
      expect(elements[15]).toBeCloseTo(1, 5);
    });

    test('transpose() 应该计算转置矩阵', () => {
      const m = new Matrix4();
      m.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

      m.transpose();

      const elements = m.getElements();
      expect(elements[1]).toBe(5); // 原来的(1,0)位置
      expect(elements[4]).toBe(2); // 原来的(0,1)位置
    });
  });

  describe('变换矩阵创建', () => {
    test('makeTranslation() 应该创建平移矩阵', () => {
      const m = new Matrix4();
      m.translate(new Vector3(1, 2, 3));

      const elements = m.getElements();
      expect(elements[12]).toBe(1); // tx
      expect(elements[13]).toBe(2); // ty
      expect(elements[14]).toBe(3); // tz
      expect(elements[0]).toBe(1); // 保持单位矩阵的其他部分
    });

    test('makeScale() 应该创建缩放矩阵', () => {
      const m = new Matrix4();
      m.scale(new Vector3(2, 3, 4));

      const elements = m.getElements();
      expect(elements[0]).toBe(2); // sx
      expect(elements[5]).toBe(3); // sy
      expect(elements[10]).toBe(4); // sz
    });

    test('makeRotationX() 应该创建绕X轴旋转矩阵', () => {
      const m = new Matrix4();
      const angle = Math.PI / 2; // 90度

      m.rotateX(angle);

      const elements = m.getElements();
      expect(elements[0]).toBe(1);
      expect(elements[5]).toBeCloseTo(Math.cos(angle), 5);
      expect(elements[6]).toBeCloseTo(-Math.sin(angle), 5);
      expect(elements[9]).toBeCloseTo(Math.sin(angle), 5);
      expect(elements[10]).toBeCloseTo(Math.cos(angle), 5);
    });

    test('makeRotationY() 应该创建绕Y轴旋转矩阵', () => {
      const m = new Matrix4();
      const angle = Math.PI / 2; // 90度

      m.rotateY(angle);

      const elements = m.getElements();
      expect(elements[0]).toBeCloseTo(Math.cos(angle), 5);
      expect(elements[2]).toBeCloseTo(Math.sin(angle), 5);
      expect(elements[5]).toBe(1);
      expect(elements[8]).toBeCloseTo(-Math.sin(angle), 5);
      expect(elements[10]).toBeCloseTo(Math.cos(angle), 5);
    });

    test('makeRotationZ() 应该创建绕Z轴旋转矩阵', () => {
      const m = new Matrix4();
      const angle = Math.PI / 2; // 90度

      m.rotateZ(angle);

      const elements = m.getElements();
      expect(elements[0]).toBeCloseTo(Math.cos(angle), 5);
      expect(elements[1]).toBeCloseTo(-Math.sin(angle), 5);
      expect(elements[4]).toBeCloseTo(Math.sin(angle), 5);
      expect(elements[5]).toBeCloseTo(Math.cos(angle), 5);
      expect(elements[10]).toBe(1);
    });
  });

  describe('四元数转换', () => {
    test('makeRotationFromQuaternion() 应该从四元数创建旋转矩阵', () => {
      const m = new Matrix4();
      const q = new Quaternion();
      q.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2); // Y轴90度旋转

      m.makeRotationFromQuaternion(q);

      const elements = m.getElements();
      expect(elements[0]).toBeCloseTo(0, 3); // cos(90°) = 0
      expect(elements[2]).toBeCloseTo(1, 3); // sin(90°) = 1
      expect(elements[8]).toBeCloseTo(-1, 3); // -sin(90°) = -1
      expect(elements[10]).toBeCloseTo(0, 3); // cos(90°) = 0
    });
  });

  describe('向量变换', () => {
    test('transformVector3() 应该变换向量', () => {
      const m = new Matrix4();
      const v = new Vector3(1, 2, 3);

      // 创建简单的平移矩阵
      m.translate(new Vector3(10, 20, 30));

      const result = m.transformVector(v);

      expect(result.x).toBe(11); // 1 + 10
      expect(result.y).toBe(22); // 2 + 20
      expect(result.z).toBe(33); // 3 + 30
    });

    test('transformVector3() 应该正确处理旋转', () => {
      const m = new Matrix4();
      const v = new Vector3(1, 0, 0); // X轴单位向量

      // 绕Z轴旋转90度
      m.rotateZ(Math.PI / 2);

      const result = m.transformVector(v);

      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(1, 5); // 旋转后变成Y轴方向
      expect(result.z).toBeCloseTo(0, 5);
    });
  });

  describe('投影矩阵', () => {
    test('makePerspective() 应该创建透视投影矩阵', () => {
      const m = new Matrix4();
      const fov = Math.PI / 4; // 45度
      const aspect = 16 / 9;
      const near = 0.1;
      const far = 1000;

      m.perspective(fov, aspect, near, far);

      const elements = m.getElements();

      // 检查透视投影矩阵的基本结构
      expect(elements[0]).toBeGreaterThan(0); // X缩放
      expect(elements[5]).toBeGreaterThan(0); // Y缩放
      expect(elements[10]).toBeLessThan(0); // Z缩放（负值）
      expect(elements[15]).toBe(0); // w分量为0表示透视投影
    });

    test('makeOrthographic() 应该创建正交投影矩阵', () => {
      const m = new Matrix4();
      const left = -10,
        right = 10;
      const top = 10,
        bottom = -10;
      const near = 0.1,
        far = 1000;

      m.orthographic(left, right, bottom, top, near, far);

      const elements = m.getElements();

      // 检查正交投影矩阵的基本结构
      expect(elements[0]).toBe(2 / (right - left)); // X缩放
      expect(elements[5]).toBe(2 / (top - bottom)); // Y缩放
      expect(elements[10]).toBe(-2 / (far - near)); // Z缩放
      expect(elements[15]).toBe(1); // w分量为1表示正交投影
    });
  });

  describe('规范接口兼容性', () => {
    test('应该转换为IMatrix4接口格式', () => {
      const m = new Matrix4();
      m.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

      const iMatrix = m.toIMatrix4x4();
      expect(iMatrix.m00).toBe(1);
      expect(iMatrix.m11).toBe(2);
      expect(iMatrix.m22).toBe(3);
    });

    test('应该从IMatrix4接口创建实例', () => {
      const iMatrix = {
        m00: 1,
        m10: 2,
        m20: 3,
        m30: 4,
        m01: 5,
        m11: 6,
        m21: 7,
        m31: 8,
        m02: 9,
        m12: 10,
        m22: 11,
        m32: 12,
        m03: 13,
        m13: 14,
        m23: 15,
        m33: 16,
      };

      const m = Matrix4.fromIMatrix4x4(iMatrix);
      expect(m.m00).toBe(1);
      expect(m.m11).toBe(6);
      expect(m.m22).toBe(11);
      expect(m.m33).toBe(16);
    });
  });

  describe('USD兼容性', () => {
    test('应该转换为USD兼容格式', () => {
      const m = new Matrix4();
      m.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

      const usdValue = m.toUsdValue();
      expect(usdValue.type).toBe('matrix4d');
      expect(usdValue.value).toEqual(m.getElements());
    });
  });

  describe('性能测试', () => {
    test('基础运算性能', () => {
      const m1 = new Matrix4();
      const m2 = new Matrix4();
      const v = new Vector3(1, 2, 3);

      m1.scale(new Vector3(2, 2, 2));
      m2.translate(new Vector3(1, 2, 3));

      performanceTest(
        'Matrix4.multiply',
        () => {
          m1.multiply(m2);
        },
        5000
      );

      performanceTest(
        'Matrix4.transformVector3',
        () => {
          m1.transformVector(v);
        },
        10000
      );

      performanceTest(
        'Matrix4.invert',
        () => {
          m1.invert();
        },
        1000
      );
    });
  });

  describe('随机测试', () => {
    test('随机矩阵运算正确性', () => {
      for (let i = 0; i < 20; i++) {
        const elements = TestData.randomMatrix4Elements();
        const m = new Matrix4();

        m.set(
          elements[0],
          elements[4],
          elements[8],
          elements[12],
          elements[1],
          elements[5],
          elements[9],
          elements[13],
          elements[2],
          elements[6],
          elements[10],
          elements[14],
          elements[3],
          elements[7],
          elements[11],
          elements[15]
        );

        // 测试转置的转置等于原矩阵
        const original = m.clone();
        m.transpose().transpose();

        const originalElements = original.getElements();
        const resultElements = m.getElements();

        for (let j = 0; j < 16; j++) {
          expect(resultElements[j]).toBeCloseTo(originalElements[j], 5);
        }
      }
    });
  });

  describe('边界情况', () => {
    test('应该处理NaN值', () => {
      const m = new Matrix4();
      m.set(NaN, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

      const elements = m.getElements();
      expect(elements[0]).toBeNaN();
    });

    test('应该处理Infinity值', () => {
      const m = new Matrix4();
      m.set(Infinity, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

      const elements = m.getElements();
      expect(elements[0]).toBe(Infinity);
    });

    test('应该处理奇异矩阵的逆运算', () => {
      const m = new Matrix4();
      // 创建一个奇异矩阵（行列式为0）
      m.set(1, 2, 3, 4, 2, 4, 6, 8, 3, 6, 9, 12, 4, 8, 12, 16);

      // 奇异矩阵的逆应该处理得当（不抛出异常）
      expect(() => {
        m.invert();
      }).not.toThrow();
    });
  });
});
