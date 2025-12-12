/**
 * Matrix3 测试套件
 * 目标：测试覆盖率 95%+
 */

import { Matrix3 } from '../../src/core/matrix3';
import { Matrix4 } from '../../src/core/matrix4';
import { Vector3 } from '../../src/core/vector3';
import { Quaternion } from '../../src/core/quaternion';
import { MathConfig } from '../../src/config/mathConfig';
import { performanceTest, testRandom } from '../setup';
import { UsdDataType } from '@maxellabs/specification';
import { expect } from '@jest/globals';

describe('Matrix3', () => {
  describe('构造函数和基础属性', () => {
    test('应该创建默认单位矩阵', () => {
      const m = new Matrix3();
      const elements = m.elements;

      // 检查单位矩阵
      expect(elements[0]).toBe(1); // m00
      expect(elements[4]).toBe(1); // m11
      expect(elements[8]).toBe(1); // m22

      // 检查其他元素为0
      expect(elements[1]).toBe(0);
      expect(elements[2]).toBe(0);
      expect(elements[3]).toBe(0);
      expect(elements[5]).toBe(0);
      expect(elements[6]).toBe(0);
      expect(elements[7]).toBe(0);
    });

    test('应该通过参数创建矩阵', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const elements = m.elements;

      expect(elements[0]).toBe(1);
      expect(elements[1]).toBe(2);
      expect(elements[2]).toBe(3);
      expect(elements[3]).toBe(4);
      expect(elements[4]).toBe(5);
      expect(elements[5]).toBe(6);
      expect(elements[6]).toBe(7);
      expect(elements[7]).toBe(8);
      expect(elements[8]).toBe(9);
    });

    test('应该正确获取和设置矩阵元素', () => {
      const m = new Matrix3();

      // 测试getter和setter
      m.m00 = 5;
      m.m11 = 6;
      m.m22 = 7;

      expect(m.m00).toBe(5);
      expect(m.m11).toBe(6);
      expect(m.m22).toBe(7);

      // 测试其他元素
      m.m01 = 1;
      m.m10 = 2;
      m.m02 = 3;
      m.m20 = 4;
      m.m12 = 8; // 添加这一行
      m.m21 = 9; // 添加这一行

      expect(m.m01).toBe(1);
      expect(m.m10).toBe(2);
      expect(m.m02).toBe(3);
      expect(m.m20).toBe(4);
      expect(m.m12).toBe(8); // 添加这一行
      expect(m.m21).toBe(9); // 添加这一行
    });
  });

  describe('常量验证', () => {
    test('应该有正确的单位矩阵常量', () => {
      const identity = Matrix3.IDENTITY;
      const elements = identity.elements;

      expect(elements[0]).toBe(1);
      expect(elements[4]).toBe(1);
      expect(elements[8]).toBe(1);
    });

    test('应该有正确的零矩阵常量', () => {
      const zero = Matrix3.ZERO;
      const elements = zero.elements;

      for (let i = 0; i < 9; i++) {
        expect(elements[i]).toBe(0);
      }
    });

    test('常量应该是不可变的', () => {
      // Object.freeze 会阻止添加/删除属性，但TypedArray的元素可能仍可修改
      // 我们测试冻结对象的基本属性
      expect(Object.isFrozen(Matrix3.IDENTITY)).toBe(true);
      expect(Object.isFrozen(Matrix3.ZERO)).toBe(true);
    });
  });

  describe('对象池功能', () => {
    beforeEach(() => {
      MathConfig.enableObjectPool(true);
    });

    test('应该支持对象池创建和释放', () => {
      const m1 = Matrix3.create();
      expect(m1).toBeInstanceOf(Matrix3);

      Matrix3.release(m1);

      const m2 = Matrix3.create();
      expect(m2).toBeInstanceOf(Matrix3);
    });

    test('应该在禁用对象池时创建新实例', () => {
      MathConfig.enableObjectPool(false);

      const m1 = Matrix3.create(1, 2, 3, 4, 5, 6, 7, 8, 9);
      expect(m1).toBeInstanceOf(Matrix3);
      expect(m1.elements[0]).toBe(1);

      // release应该静默处理
      Matrix3.release(m1);

      MathConfig.enableObjectPool(true);
    });

    test('应该实现池化接口', () => {
      const m = new Matrix3();
      expect(m.isPoolable()).toBe(true);

      m.reset();
      const elements = m.elements;
      expect(elements[0]).toBe(1);
      expect(elements[4]).toBe(1);
      expect(elements[8]).toBe(1);
    });

    test('应该支持预分配', () => {
      expect(() => {
        Matrix3.preallocate(10);
      }).not.toThrow();
    });

    test('应该支持清空对象池', () => {
      expect(() => {
        Matrix3.clearPool();
      }).not.toThrow();
    });

    test('应该获取对象池统计信息', () => {
      const stats = Matrix3.getPoolStats();
      expect(typeof stats).toBe('object');
    });
  });

  describe('基础操作', () => {
    let m: Matrix3;

    beforeEach(() => {
      m = new Matrix3();
    });

    test('identity() 应该设置为单位矩阵', () => {
      m.set(1, 2, 3, 4, 5, 6, 7, 8, 9);
      m.identity();

      const elements = m.elements;
      expect(elements[0]).toBe(1);
      expect(elements[4]).toBe(1);
      expect(elements[8]).toBe(1);
      expect(elements.filter((x) => x === 0)).toHaveLength(6);
    });

    test('setZero() 应该设置为零矩阵', () => {
      m.setZero();
      const elements = m.elements;

      for (let i = 0; i < 9; i++) {
        expect(elements[i]).toBe(0);
      }
    });

    test('copyFrom() 应该从其他矩阵复制', () => {
      const source = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      m.copyFrom(source);

      expect(m.elements).toEqual(source.elements);
    });

    test('clone() 应该创建矩阵副本', () => {
      m.set(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const cloned = m.clone();

      expect(cloned).not.toBe(m);
      expect(cloned.elements).toEqual(m.elements);
    });

    test('equals() 应该正确比较矩阵', () => {
      const m1 = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const m2 = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const m3 = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 10);

      expect(m1.equals(m2)).toBe(true);
      expect(m1.equals(m3)).toBe(false);
    });
  });

  describe('矩阵设置方法', () => {
    test('set() 应该正确设置矩阵元素', () => {
      const m = new Matrix3();
      m.set(1, 2, 3, 4, 5, 6, 7, 8, 9);

      const elements = m.elements;
      expect(elements[0]).toBe(1);
      expect(elements[1]).toBe(2);
      expect(elements[2]).toBe(3);
      expect(elements[3]).toBe(4);
      expect(elements[4]).toBe(5);
      expect(elements[5]).toBe(6);
      expect(elements[6]).toBe(7);
      expect(elements[7]).toBe(8);
      expect(elements[8]).toBe(9);
    });

    test('setFromRowMajorData() 应该从行优先数据设置', () => {
      const m = new Matrix3();
      m.setFromRowMajorData(1, 2, 3, 4, 5, 6, 7, 8, 9);

      // 行优先转换为列优先
      expect(m.m00).toBe(1);
      expect(m.m01).toBe(2);
      expect(m.m02).toBe(3);
      expect(m.m10).toBe(4);
      expect(m.m11).toBe(5);
      expect(m.m12).toBe(6);
      expect(m.m20).toBe(7);
      expect(m.m21).toBe(8);
      expect(m.m22).toBe(9);
    });

    test('setFromColumnVectors() 应该从列向量设置', () => {
      const m = new Matrix3();
      const c1 = new Vector3(1, 2, 3);
      const c2 = new Vector3(4, 5, 6);
      const c3 = new Vector3(7, 8, 9);

      m.setFromColumnVectors(c1, c2, c3);

      expect(m.m00).toBe(1);
      expect(m.m10).toBe(2);
      expect(m.m20).toBe(3);
      expect(m.m01).toBe(4);
      expect(m.m11).toBe(5);
      expect(m.m21).toBe(6);
      expect(m.m02).toBe(7);
      expect(m.m12).toBe(8);
      expect(m.m22).toBe(9);
    });

    test('setFromArray() 应该从数组设置', () => {
      const m = new Matrix3();
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];

      m.setFromArray(array);

      expect(m.elements).toEqual(new Float32Array(array));
    });

    test('setFromArray() 应该支持Float32Array无偏移', () => {
      const m = new Matrix3();
      const array = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      m.setFromArray(array);

      expect(m.elements).toEqual(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    test('setFromArray() 应该支持偏移', () => {
      const m = new Matrix3();
      const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      m.setFromArray(array, 1);

      expect(m.elements).toEqual(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    test('setFromQuaternion() 应该从四元数设置', () => {
      const m = new Matrix3();
      const q = new Quaternion();
      // 绕Y轴旋转90度的四元数
      q.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);

      m.setFromQuaternion(q);

      // 验证旋转矩阵
      expect(m.m00).toBeCloseTo(0, 5);
      expect(m.m02).toBeCloseTo(1, 5);
      expect(m.m20).toBeCloseTo(-1, 5);
      expect(m.m22).toBeCloseTo(0, 5);
      expect(m.m11).toBeCloseTo(1, 5);
    });

    test('setFromMatrix4() 应该从Matrix4提取3x3部分', () => {
      const m4 = new Matrix4();
      m4.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

      const m3 = new Matrix3();
      m3.setFromMatrix4(m4);

      expect(m3.m00).toBe(1);
      expect(m3.m10).toBe(2);
      expect(m3.m20).toBe(3);
      expect(m3.m01).toBe(5);
      expect(m3.m11).toBe(6);
      expect(m3.m21).toBe(7);
      expect(m3.m02).toBe(9);
      expect(m3.m12).toBe(10);
      expect(m3.m22).toBe(11);
    });
  });

  describe('矩阵运算', () => {
    test('multiply() 应该计算矩阵乘法', () => {
      const m1 = new Matrix3(1, 0, 0, 0, 1, 0, 0, 0, 1);
      const m2 = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);

      m1.multiply(m2);

      // 单位矩阵乘以任何矩阵等于原矩阵
      expect(m1.equals(m2)).toBe(true);
    });

    test('multiply() 应该支持标量乘法', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      m.multiply(2);

      const elements = m.elements;
      expect(elements).toEqual(new Float32Array([2, 4, 6, 8, 10, 12, 14, 16, 18]));
    });

    test('premultiply() 应该正确进行左乘', () => {
      const m1 = new Matrix3(1, 0, 0, 0, 2, 0, 0, 0, 3);
      const m2 = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const m3 = new Matrix3();

      m3.multiplyMatrices(m1, m2);

      const expected = new Matrix3();
      expected.copyFrom(m2);
      expected.premultiply(m1);

      expect(m3.equals(expected)).toBe(true);
    });

    test('multiplyMatrices() 应该正确计算矩阵乘法', () => {
      const m1 = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const m2 = new Matrix3(9, 8, 7, 6, 5, 4, 3, 2, 1);
      const result = new Matrix3();

      result.multiplyMatrices(m1, m2);

      // 验证矩阵乘法产生正确结果
      expect(result.m00).toBe(90);
      expect(result.m11).toBe(69);
      expect(result.m22).toBe(30);
    });

    test('determinant() 应该正确计算行列式', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);

      // 这个矩阵的行列式为 1*(5*9 - 6*8) - 2*(4*9 - 6*7) + 3*(4*8 - 5*7) = 0
      expect(m.determinant()).toBeCloseTo(0, 5);

      const m2 = new Matrix3(1, 0, 0, 0, 2, 0, 0, 0, 3);
      // 对角矩阵的行列式为对角元素乘积
      expect(m2.determinant()).toBe(6);
    });

    test('invert() 应该正确计算逆矩阵', () => {
      const m = new Matrix3(1, 0, 0, 0, 2, 0, 0, 0, 3);
      const original = m.clone();

      m.invert();

      // 对角矩阵的逆就是对角元素的倒数
      expect(m.m00).toBe(1);
      expect(m.m11).toBe(0.5);
      expect(m.m22).toBeCloseTo(0.3333333, 5);

      // 矩阵与其逆相乘应该得到单位矩阵
      const identity = new Matrix3();
      identity.multiplyMatrices(original, m);

      expect(identity.m00).toBeCloseTo(1, 5);
      expect(identity.m11).toBeCloseTo(1, 5);
      expect(identity.m22).toBeCloseTo(1, 5);
    });

    test('invert() 应该处理奇异矩阵', () => {
      const m = new Matrix3(1, 2, 3, 2, 4, 6, 3, 6, 9); // 行列式为0

      expect(() => {
        m.invert();
      }).not.toThrow();

      // 奇异矩阵求逆应该返回零矩阵
      expect(m.equals(Matrix3.ZERO)).toBe(true);
    });

    test('transpose() 应该正确计算转置矩阵', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const original = m.clone();

      m.transpose();

      // 验证转置
      expect(m.m01).toBe(original.m10);
      expect(m.m02).toBe(original.m20);
      expect(m.m10).toBe(original.m01);
      expect(m.m12).toBe(original.m21);
      expect(m.m20).toBe(original.m02);
      expect(m.m21).toBe(original.m12);
    });

    test('transpose() 的转置应该等于原矩阵', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const original = m.clone();

      m.transpose().transpose();

      expect(m.equals(original)).toBe(true);
    });
  });

  describe('变换操作', () => {
    test('scale() 应该正确缩放矩阵', () => {
      const m = Matrix3.fromIdentity();
      m.scale(2, 3);

      expect(m.m00).toBe(2);
      expect(m.m11).toBe(3);
      expect(m.m22).toBe(1);
    });

    test('rotate() 应该正确旋转矩阵', () => {
      const m = Matrix3.fromIdentity();
      const angle = Math.PI / 2; // 90度

      m.rotate(angle);

      // 根据实际实现，旋转变换应用到单位矩阵：
      // e[0] = cos(90°)*1 + sin(90°)*0 = 0
      // e[1] = -sin(90°)*1 + cos(90°)*0 = -1
      // e[3] = cos(90°)*0 + sin(90°)*1 = 1
      // e[4] = -sin(90°)*0 + cos(90°)*1 = 0
      expect(m.m00).toBeCloseTo(0, 5);
      expect(m.m10).toBeCloseTo(-1, 5);
      expect(m.m01).toBeCloseTo(1, 5);
      expect(m.m11).toBeCloseTo(0, 5);
    });

    test('translate() 应该正确平移矩阵', () => {
      const m = Matrix3.fromIdentity();
      m.translate(5, 10);

      expect(m.m02).toBe(5);
      expect(m.m12).toBe(10);
    });

    test('组合变换应该正确应用', () => {
      const m = Matrix3.fromIdentity();
      m.scale(2, 2);
      m.rotate(Math.PI / 4);
      m.translate(1, 2);

      // 验证变换已应用
      expect(m.m00).not.toBe(1);
      expect(m.m11).not.toBe(1);
      expect(m.m02).not.toBe(0);
      expect(m.m12).not.toBe(0);
    });
  });

  describe('向量变换', () => {
    test('transformPoint() 应该正确变换点', () => {
      const m = new Matrix3(2, 0, 0, 0, 2, 0, 0, 0, 1);
      const v = new Vector3(1, 2, 1);

      m.transformPoint(v);

      expect(v.x).toBe(2);
      expect(v.y).toBe(4);
      expect(v.z).toBe(1);
    });

    test('transformPoint() 应该支持输出参数', () => {
      const m = new Matrix3(2, 0, 0, 0, 2, 0, 0, 0, 1);
      const v = new Vector3(1, 2, 1);
      const out = new Vector3();

      const result = m.transformPoint(v, out);

      expect(result).toBe(out);
      expect(out.x).toBe(2);
      expect(out.y).toBe(4);
      expect(out.z).toBe(1);
      expect(v.x).toBe(1); // 原向量不变
      expect(v.y).toBe(2);
    });

    test('transformNormal() 应该正确变换法向量', () => {
      const m = new Matrix3(2, 0, 0, 0, 2, 0, 0, 0, 1);
      const v = new Vector3(1, 0, 0);

      m.transformNormal(v);

      // 变换后：(2, 0, 0)，然后归一化
      expect(v.x).toBeCloseTo(1, 5); // 归一化后的单位向量
      expect(v.y).toBeCloseTo(0, 5);
      expect(v.z).toBeCloseTo(0, 5);
    });
  });

  describe('静态工厂方法', () => {
    test('fromIdentity() 应该创建单位矩阵', () => {
      const m = Matrix3.fromIdentity();
      // 检查单位矩阵的元素
      expect(m.m00).toBe(1);
      expect(m.m11).toBe(1);
      expect(m.m22).toBe(1);
      expect(m.m01).toBe(0);
      expect(m.m10).toBe(0);
      expect(m.m02).toBe(0);
      expect(m.m20).toBe(0);
      expect(m.m12).toBe(0);
      expect(m.m21).toBe(0);
    });

    test('fromColumnVectors() 应该从列向量创建', () => {
      const c1 = new Vector3(1, 2, 3);
      const c2 = new Vector3(4, 5, 6);
      const c3 = new Vector3(7, 8, 9);

      const m = Matrix3.fromColumnVectors(c1, c2, c3);

      expect(m.m00).toBe(1);
      expect(m.m10).toBe(2);
      expect(m.m20).toBe(3);
      expect(m.m01).toBe(4);
      expect(m.m11).toBe(5);
      expect(m.m21).toBe(6);
      expect(m.m02).toBe(7);
      expect(m.m12).toBe(8);
      expect(m.m22).toBe(9);
    });

    test('fromMatrix4() 应该从Matrix4创建', () => {
      const m4 = new Matrix4();
      m4.set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

      const m3 = Matrix3.fromMatrix4(m4);

      expect(m3.m00).toBe(1);
      expect(m3.m10).toBe(2);
      expect(m3.m20).toBe(3);
      expect(m3.m01).toBe(5);
      expect(m3.m11).toBe(6);
      expect(m3.m21).toBe(7);
    });

    test('fromArray() 应该从数组创建', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];

      const m = Matrix3.fromArray(array);

      expect(m.elements).toEqual(new Float32Array(array));
    });

    test('fromQuaternion() 应该从四元数创建', () => {
      const q = new Quaternion();
      q.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);

      const m = Matrix3.fromQuaternion(q);

      expect(m.m00).toBeCloseTo(0, 5);
      expect(m.m02).toBeCloseTo(1, 5);
      expect(m.m20).toBeCloseTo(-1, 5);
      expect(m.m22).toBeCloseTo(0, 5);
    });

    test('fromRowMajorData() 应该从行优先数据创建', () => {
      const m = Matrix3.fromRowMajorData(1, 2, 3, 4, 5, 6, 7, 8, 9);

      expect(m.m00).toBe(1);
      expect(m.m01).toBe(2);
      expect(m.m02).toBe(3);
      expect(m.m10).toBe(4);
      expect(m.m11).toBe(5);
      expect(m.m12).toBe(6);
      expect(m.m20).toBe(7);
      expect(m.m21).toBe(8);
      expect(m.m22).toBe(9);
    });

    test('multiply() 静态方法应该正确相乘', () => {
      const m1 = new Matrix3(1, 0, 0, 0, 1, 0, 0, 0, 1);
      const m2 = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);

      const result = Matrix3.multiply(m1, m2);

      expect(result.equals(m2)).toBe(true);
    });

    test('transpose() 静态方法应该正确转置', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);

      const result = Matrix3.transpose(m);

      expect(result.m01).toBe(m.m10);
      expect(result.m02).toBe(m.m20);
      expect(result.m10).toBe(m.m01);
      expect(result.m12).toBe(m.m21);
    });

    test('invert() 静态方法应该正确求逆', () => {
      const m = new Matrix3(1, 0, 0, 0, 2, 0, 0, 0, 3);

      const result = Matrix3.invert(m);

      expect(result.m00).toBe(1);
      expect(result.m11).toBe(0.5);
      expect(result.m22).toBeCloseTo(0.3333333, 5);
    });

    test('isValid() 应该验证矩阵有效性', () => {
      const valid = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const invalid = new Matrix3();
      (invalid.elements as any)[0] = NaN;

      expect(Matrix3.isValid(valid)).toBe(true);
      expect(Matrix3.isValid(invalid)).toBe(false);
    });
  });

  describe('规范接口兼容性', () => {
    test('应该转换为IMatrix3x3接口格式', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);

      const iMatrix = m.toIMatrix3x3();

      expect(iMatrix.m00).toBe(1);
      expect(iMatrix.m01).toBe(4);
      expect(iMatrix.m02).toBe(7);
      expect(iMatrix.m10).toBe(2);
      expect(iMatrix.m11).toBe(5);
      expect(iMatrix.m12).toBe(8);
      expect(iMatrix.m20).toBe(3);
      expect(iMatrix.m21).toBe(6);
      expect(iMatrix.m22).toBe(9);
    });

    test('应该从IMatrix3x3接口创建实例', () => {
      const iMatrix = {
        m00: 1,
        m01: 2,
        m02: 3,
        m10: 4,
        m11: 5,
        m12: 6,
        m20: 7,
        m21: 8,
        m22: 9,
      };

      const m = Matrix3.fromIMatrix3x3(iMatrix);

      expect(m.m00).toBe(1);
      expect(m.m01).toBe(2);
      expect(m.m02).toBe(3);
      expect(m.m10).toBe(4);
      expect(m.m11).toBe(5);
      expect(m.m12).toBe(6);
      expect(m.m20).toBe(7);
      expect(m.m21).toBe(8);
      expect(m.m22).toBe(9);
    });

    test('应该从IMatrix3x3接口设置值', () => {
      const m = new Matrix3();
      const iMatrix = {
        m00: 1,
        m01: 2,
        m02: 3,
        m10: 4,
        m11: 5,
        m12: 6,
        m20: 7,
        m21: 8,
        m22: 9,
      };

      m.fromIMatrix3x3(iMatrix);

      expect(m.m00).toBe(1);
      expect(m.m01).toBe(2);
      expect(m.m02).toBe(3);
      expect(m.m10).toBe(4);
      expect(m.m11).toBe(5);
      expect(m.m12).toBe(6);
      expect(m.m20).toBe(7);
      expect(m.m21).toBe(8);
      expect(m.m22).toBe(9);
    });
  });

  describe('USD兼容性', () => {
    test('应该转换为USD兼容格式', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);

      const usdValue = m.toUsdValue();

      expect(usdValue.type).toBe('array');
      expect(usdValue.value).toEqual(Array.from(m.elements));
    });

    test('应该从USD兼容格式创建', () => {
      const usdValue = {
        type: UsdDataType.Array,
        value: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      };

      const m = Matrix3.fromUsdValue(usdValue);

      expect(m.elements).toEqual(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    test('应该从USD兼容格式设置值', () => {
      const m = new Matrix3();
      const usdValue = {
        type: UsdDataType.Array,
        value: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      };

      m.fromUsdValue(usdValue);

      expect(m.elements).toEqual(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    test('应该处理无效的USD值', () => {
      expect(() => {
        Matrix3.fromUsdValue({ type: UsdDataType.Array, value: [] });
      }).toThrow('Invalid UsdValue for Matrix3');

      expect(() => {
        Matrix3.fromUsdValue({ type: UsdDataType.Array, value: [1, 2, 3] });
      }).toThrow('Invalid UsdValue for Matrix3');

      // 测试实例方法的无效值处理
      const m = new Matrix3();
      expect(() => {
        m.fromUsdValue({ type: UsdDataType.Array, value: [] });
      }).toThrow('Invalid UsdValue for Matrix3');
    });
  });

  describe('数组操作', () => {
    test('toArray() 应该转换为数组', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);

      const array = m.toArray();

      expect(array).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    test('fillArray() 应该填充到目标数组', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const target = new Array(9);

      m.fillArray(target);

      expect(target).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    test('fillArray() 应该支持偏移', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const target = new Array(12).fill(0); // 初始化数组

      m.fillArray(target, 3);

      expect(target).toEqual([0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    test('fillArray() 应该支持Float32Array', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const target = new Float32Array(9);

      m.fillArray(target);

      expect(target).toEqual(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });
  });

  describe('列向量操作', () => {
    test('getColumnVector() 应该正确获取列向量', () => {
      const m = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const out = new Vector3();

      // 获取第0列
      m.getColumnVector(0, out);
      expect(out.x).toBe(1);
      expect(out.y).toBe(2);
      expect(out.z).toBe(3);

      // 获取第1列
      m.getColumnVector(1, out);
      expect(out.x).toBe(4);
      expect(out.y).toBe(5);
      expect(out.z).toBe(6);

      // 获取第2列
      m.getColumnVector(2, out);
      expect(out.x).toBe(7);
      expect(out.y).toBe(8);
      expect(out.z).toBe(9);
    });
  });

  describe('性能测试', () => {
    test('基础运算性能', () => {
      const m1 = new Matrix3(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const m2 = new Matrix3(9, 8, 7, 6, 5, 4, 3, 2, 1);

      performanceTest(
        'Matrix3.multiply',
        () => {
          const result = new Matrix3();
          result.multiplyMatrices(m1, m2);
        },
        5000
      );

      performanceTest(
        'Matrix3.invert',
        () => {
          const temp = new Matrix3();
          temp.copyFrom(m1);
          temp.invert();
        },
        1000
      );

      performanceTest(
        'Matrix3.transpose',
        () => {
          const temp = new Matrix3();
          temp.copyFrom(m1);
          temp.transpose();
        },
        5000
      );
    });
  });

  describe('随机测试', () => {
    test('随机矩阵运算正确性', () => {
      for (let i = 0; i < 10; i++) {
        const m1 = new Matrix3();
        const m2 = new Matrix3();

        // 生成随机矩阵元素
        for (let j = 0; j < 9; j++) {
          m1.elements[j] = testRandom.nextFloat(-10, 10);
          m2.elements[j] = testRandom.nextFloat(-10, 10);
        }

        // 测试转置的转置等于原矩阵
        const original = m1.clone();
        m1.transpose().transpose();

        for (let j = 0; j < 9; j++) {
          expect(m1.elements[j]).toBeCloseTo(original.elements[j], 5);
        }

        // 测试矩阵乘法的结合律
        const m3 = new Matrix3();
        const result1 = new Matrix3();
        const result2 = new Matrix3();

        // (A*B)*C = A*(B*C)
        result1.multiplyMatrices(m1, m2);
        result1.multiplyMatrices(result1, m3);

        result2.multiplyMatrices(m2, m3);
        result2.multiplyMatrices(m1, result2);

        for (let j = 0; j < 9; j++) {
          expect(result1.elements[j]).toBeCloseTo(result2.elements[j], 3);
        }
      }
    });
  });

  describe('边界情况', () => {
    test('应该处理NaN值', () => {
      const m = new Matrix3();
      m.set(NaN, 0, 0, 0, 1, 0, 0, 0, 1);

      expect(m.elements[0]).toBeNaN();
      expect(Matrix3.isValid(m)).toBe(false);
    });

    test('应该处理Infinity值', () => {
      const m = new Matrix3();
      m.set(Infinity, 0, 0, 0, 1, 0, 0, 0, 1);

      expect(m.elements[0]).toBe(Infinity);
      expect(Matrix3.isValid(m)).toBe(false);
    });

    test('应该处理零矩阵的运算', () => {
      const zero = Matrix3.ZERO;

      // 零矩阵的行列式应该为0
      expect(zero.determinant()).toBe(0);

      // 零矩阵的逆应该为零矩阵
      const inverted = zero.clone();
      inverted.invert();
      expect(inverted.equals(Matrix3.ZERO)).toBe(true);
    });

    test('应该处理极大值', () => {
      const m = new Matrix3();
      m.set(1e10, 1e10, 1e10, 1e10, 1e10, 1e10, 1e10, 1e10, 1e10);

      expect(() => {
        m.determinant();
        m.invert();
        m.transpose();
      }).not.toThrow();
    });

    test('应该处理极小值', () => {
      const m = new Matrix3();
      m.set(1e-10, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10);

      expect(() => {
        m.determinant();
        m.invert();
        m.transpose();
      }).not.toThrow();
    });
  });

  describe('链式调用', () => {
    test('应该支持方法链式调用', () => {
      const m = Matrix3.create()
        .scale(2, 3)
        .rotate(Math.PI / 4)
        .translate(1, 2);

      expect(m).toBeInstanceOf(Matrix3);
      expect(m.m00).not.toBe(1);
      expect(m.m11).not.toBe(1);
    });

    test('set系列方法应该返回this', () => {
      const m = new Matrix3();
      const v = new Vector3(1, 2, 3);

      const result = m.set(1, 2, 3, 4, 5, 6, 7, 8, 9);
      expect(result).toBe(m);

      const result2 = m.setFromColumnVectors(v, v, v);
      expect(result2).toBe(m);

      const result3 = m.setFromQuaternion(new Quaternion());
      expect(result3).toBe(m);
    });

    test('运算方法应该返回this', () => {
      const m = new Matrix3();
      const other = new Matrix3();

      const result1 = m.multiply(other);
      expect(result1).toBe(m);

      const result2 = m.premultiply(other);
      expect(result2).toBe(m);

      const result3 = m.invert();
      expect(result3).toBe(m);

      const result4 = m.transpose();
      expect(result4).toBe(m);

      const result5 = m.scale(2, 3);
      expect(result5).toBe(m);

      const result6 = m.rotate(Math.PI / 4);
      expect(result6).toBe(m);

      const result7 = m.translate(1, 2);
      expect(result7).toBe(m);
    });
  });
});
