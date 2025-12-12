/**
 * Euler 完整测试套件
 * 目标：测试覆盖率 95%+
 */

import { Euler } from '../../src/core/euler';
import { Vector3 } from '../../src/core/vector3';
import { Matrix4 } from '../../src/core/matrix4';
import { Quaternion } from '../../src/core/quaternion';
import type { EulerOrder } from '@maxellabs/specification';
import { expect, jest } from '@jest/globals';

const DEG2RAD = Math.PI / 180;

describe('Euler', () => {
  describe('构造函数和基础属性', () => {
    test('应该创建默认零欧拉角', () => {
      const euler = new Euler();
      expect(euler.x).toBe(0);
      expect(euler.y).toBe(0);
      expect(euler.z).toBe(0);
      expect(euler.order).toBe('xyz');
    });

    test('应该创建指定值的欧拉角', () => {
      const euler = new Euler(30, 45, 60);
      expect(euler.x).toBe(30);
      expect(euler.y).toBe(45);
      expect(euler.z).toBe(60);
      expect(euler.order).toBe('xyz');
    });

    test('应该创建指定顺序的欧拉角', () => {
      const euler = new Euler(30, 45, 60, 'yxz' as EulerOrder);
      expect(euler.x).toBe(30);
      expect(euler.y).toBe(45);
      expect(euler.z).toBe(60);
      expect(euler.order).toBe('yxz');
    });

    test('DEFAULT_ORDER应该是xyz', () => {
      expect(Euler.DEFAULT_ORDER).toBe('xyz');
    });
  });

  describe('set方法', () => {
    test('应该设置欧拉角的值', () => {
      const euler = new Euler();

      const result = euler.set(10, 20, 30);

      expect(euler.x).toBe(10);
      expect(euler.y).toBe(20);
      expect(euler.z).toBe(30);
      expect(result).toBe(euler);
    });

    test('应该设置欧拉角的顺序', () => {
      const euler = new Euler();

      euler.set(10, 20, 30, 'zyx' as EulerOrder);

      expect(euler.order).toBe('zyx');
    });

    test('应该保持原有顺序如果未指定', () => {
      const euler = new Euler(0, 0, 0, 'yxz' as EulerOrder);

      euler.set(10, 20, 30);

      expect(euler.order).toBe('yxz');
    });
  });

  describe('setZero方法', () => {
    test('应该将欧拉角设置为零', () => {
      const euler = new Euler(30, 45, 60);

      const result = euler.setZero();

      expect(euler.x).toBe(0);
      expect(euler.y).toBe(0);
      expect(euler.z).toBe(0);
      expect(result).toBe(euler);
    });

    test('应该保持顺序', () => {
      const euler = new Euler(30, 45, 60, 'zyx' as EulerOrder);

      euler.setZero();

      expect(euler.order).toBe('zyx');
    });
  });

  describe('setFromRotationMatrix4方法', () => {
    test('应该从旋转矩阵设置欧拉角（XYZ顺序）', () => {
      const euler = new Euler();
      const originalEuler = new Euler(30, 45, 60, 'xyz' as EulerOrder);
      const matrix = new Matrix4();
      originalEuler.toMatrix4(matrix);

      euler.setFromRotationMatrix4(matrix, 'xyz' as EulerOrder);

      expect(euler.x).toBeCloseTo(30, 3);
      expect(euler.y).toBeCloseTo(45, 3);
      expect(euler.z).toBeCloseTo(60, 3);
    });

    test('应该从旋转矩阵设置欧拉角（YXZ顺序）', () => {
      const euler = new Euler();
      const originalEuler = new Euler(30, 45, 60, 'yxz' as EulerOrder);
      const matrix = new Matrix4();
      originalEuler.toMatrix4(matrix);

      euler.setFromRotationMatrix4(matrix, 'yxz' as EulerOrder);

      expect(euler.order).toBe('yxz');
      expect(euler.x).toBeCloseTo(30, 3);
      expect(euler.y).toBeCloseTo(45, 3);
      expect(euler.z).toBeCloseTo(60, 3);
    });

    test('应该从旋转矩阵设置欧拉角（ZXY顺序）', () => {
      const euler = new Euler();
      const matrix = new Matrix4();

      euler.setFromRotationMatrix4(matrix, 'zxy' as EulerOrder);

      expect(euler.order).toBe('zxy');
    });

    test('应该从旋转矩阵设置欧拉角（ZYX顺序）', () => {
      const euler = new Euler();
      const matrix = new Matrix4();

      euler.setFromRotationMatrix4(matrix, 'zyx' as EulerOrder);

      expect(euler.order).toBe('zyx');
    });

    test('应该从旋转矩阵设置欧拉角（YZX顺序）', () => {
      const euler = new Euler();
      const matrix = new Matrix4();

      euler.setFromRotationMatrix4(matrix, 'yzx' as EulerOrder);

      expect(euler.order).toBe('yzx');
    });

    test('应该从旋转矩阵设置欧拉角（XZY顺序）', () => {
      const euler = new Euler();
      const matrix = new Matrix4();

      euler.setFromRotationMatrix4(matrix, 'xzy' as EulerOrder);

      expect(euler.order).toBe('xzy');
    });
  });

  describe('setFromQuaternion方法', () => {
    test('应该从四元数设置欧拉角', () => {
      const euler = new Euler();
      const originalEuler = new Euler(30, 45, 60, 'xyz' as EulerOrder);
      const quat = new Quaternion();
      originalEuler.toQuaternion(quat);

      euler.setFromQuaternion(quat);

      expect(euler.x).toBeCloseTo(30, 3);
      expect(euler.y).toBeCloseTo(45, 3);
      expect(euler.z).toBeCloseTo(60, 3);
    });

    test('应该从单位四元数设置零欧拉角', () => {
      const euler = new Euler(30, 45, 60);
      const quat = new Quaternion(0, 0, 0, 1);

      euler.setFromQuaternion(quat);

      expect(euler.x).toBeCloseTo(0, 4);
      expect(euler.y).toBeCloseTo(0, 4);
      expect(euler.z).toBeCloseTo(0, 4);
    });
  });

  describe('setFromVector3方法', () => {
    test('应该从三维向量设置欧拉角', () => {
      const euler = new Euler();
      const v = new Vector3(10, 20, 30);

      const result = euler.setFromVector3(v);

      expect(euler.x).toBe(10);
      expect(euler.y).toBe(20);
      expect(euler.z).toBe(30);
      expect(result).toBe(euler);
    });

    test('应该设置指定的顺序', () => {
      const euler = new Euler();
      const v = new Vector3(10, 20, 30);

      euler.setFromVector3(v, 'zxy' as EulerOrder);

      expect(euler.order).toBe('zxy');
    });
  });

  describe('setFromArray方法', () => {
    test('应该从类欧拉角对象设置欧拉角', () => {
      const euler = new Euler();
      const array = { x: 10, y: 20, z: 30 };

      const result = euler.setFromArray(array);

      expect(euler.x).toBe(10);
      expect(euler.y).toBe(20);
      expect(euler.z).toBe(30);
      expect(result).toBe(euler);
    });

    test('应该处理带有顺序的对象', () => {
      const euler = new Euler();
      const array = { x: 10, y: 20, z: 30, order: 'zyx' as EulerOrder };

      euler.setFromArray(array);

      expect(euler.order).toBe('zyx');
    });

    test('应该处理部分属性', () => {
      const euler = new Euler();
      const array = { x: 10, y: 20 } as any;

      euler.setFromArray(array);

      expect(euler.x).toBe(10);
      expect(euler.y).toBe(20);
      expect(euler.z).toBe(0);
    });
  });

  describe('clone方法', () => {
    test('应该克隆欧拉角', () => {
      const original = new Euler(30, 45, 60, 'zyx' as EulerOrder);
      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.x).toBe(original.x);
      expect(cloned.y).toBe(original.y);
      expect(cloned.z).toBe(original.z);
      expect(cloned.order).toBe(original.order);
    });
  });

  describe('copyFrom方法', () => {
    test('应该复制另一个欧拉角', () => {
      const euler1 = new Euler(30, 45, 60, 'zyx' as EulerOrder);
      const euler2 = new Euler();

      const result = euler2.copyFrom(euler1);

      expect(euler2.x).toBe(euler1.x);
      expect(euler2.y).toBe(euler1.y);
      expect(euler2.z).toBe(euler1.z);
      expect(euler2.order).toBe(euler1.order);
      expect(result).toBe(euler2);
    });
  });

  describe('add方法', () => {
    test('应该添加欧拉角', () => {
      const euler1 = new Euler(10, 20, 30);
      const euler2 = new Euler(5, 10, 15);

      const result = euler1.add(euler2);

      expect(euler1.x).toBe(15);
      expect(euler1.y).toBe(30);
      expect(euler1.z).toBe(45);
      expect(result).toBe(euler1);
    });

    test('不应该添加不同顺序的欧拉角', () => {
      const euler1 = new Euler(10, 20, 30, 'xyz' as EulerOrder);
      const euler2 = new Euler(5, 10, 15, 'zyx' as EulerOrder);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      euler1.add(euler2);
      consoleSpy.mockRestore();

      // 值应该保持不变
      expect(euler1.x).toBe(10);
    });
  });

  describe('addEulers方法', () => {
    test('应该添加两个欧拉角', () => {
      const euler = new Euler();
      const left = new Euler(10, 20, 30);
      const right = new Euler(5, 10, 15);

      const result = euler.addEulers(left, right);

      expect(euler.x).toBe(15);
      expect(euler.y).toBe(30);
      expect(euler.z).toBe(45);
      expect(result).toBe(euler);
    });

    test('不应该添加不同顺序的欧拉角', () => {
      const euler = new Euler();
      const left = new Euler(10, 20, 30, 'xyz' as EulerOrder);
      const right = new Euler(5, 10, 15, 'zyx' as EulerOrder);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      euler.addEulers(left, right);
      consoleSpy.mockRestore();
    });
  });

  describe('negate方法', () => {
    test('应该取反欧拉角', () => {
      const euler = new Euler(10, 20, 30);

      const result = euler.negate();

      expect(euler.x).toBe(-10);
      expect(euler.y).toBe(-20);
      expect(euler.z).toBe(-30);
      expect(result).toBe(euler);
    });

    test('应该保持顺序', () => {
      const euler = new Euler(10, 20, 30, 'zyx' as EulerOrder);

      euler.negate();

      expect(euler.order).toBe('zyx');
    });
  });

  describe('reorder方法', () => {
    test('应该重新排序欧拉角', () => {
      const euler = new Euler(30, 45, 60, 'xyz' as EulerOrder);

      const result = euler.reorder('zyx' as EulerOrder);

      expect(euler.order).toBe('zyx');
      expect(result).toBe(euler);
    });

    test('重新排序后应该表示相同的旋转', () => {
      // 使用较小的角度避免万向节锁问题
      const euler1 = new Euler(15, 20, 25, 'xyz' as EulerOrder);
      const quat1 = new Quaternion();
      euler1.toQuaternion(quat1);

      const euler2 = euler1.clone().reorder('yxz' as EulerOrder);
      const quat2 = new Quaternion();
      euler2.toQuaternion(quat2);

      // 比较旋转效果（通过旋转同一个向量）
      const testVec = new Vector3(1, 0, 0);
      const v1 = testVec.clone();
      const v2 = testVec.clone();
      quat1.rotateVector3(v1);
      quat2.rotateVector3(v2);

      expect(v1.x).toBeCloseTo(v2.x, 3);
      expect(v1.y).toBeCloseTo(v2.y, 3);
      expect(v1.z).toBeCloseTo(v2.z, 3);
    });
  });

  describe('rotateVector3方法', () => {
    test('应该旋转向量（使用小角度）', () => {
      // 使用小角度测试，因为弧度和角度的差异在小角度时较小
      const euler = new Euler(0, 0, 0);
      const v = new Vector3(1, 0, 0);
      const out = new Vector3();

      const result = euler.rotateVector3(v, out);

      // 零旋转应该保持向量不变
      expect(result).toBe(out);
      expect(out.x).toBeCloseTo(1, 3);
      expect(out.y).toBeCloseTo(0, 3);
      expect(out.z).toBeCloseTo(0, 3);
    });

    test('应该将旋转结果存储到out参数（90度旋转）', () => {
      const euler = new Euler(0, 90, 0); // 绕Y轴旋转90度
      const v = new Vector3(1, 0, 0);
      const out = new Vector3();

      euler.rotateVector3(v, out);

      expect(out.x).toBeCloseTo(0, 3);
      expect(out.z).toBeCloseTo(-1, 3);
    });

    test('应该返回正确的out参数', () => {
      const euler = new Euler(0, 0, 0);
      const v = new Vector3(1, 2, 3);
      const out = new Vector3();

      const result = euler.rotateVector3(v, out);

      expect(result).toBe(out);
    });

    test('无out参数时应该返回结果向量', () => {
      const euler = new Euler(0, 0, 0);
      const v = new Vector3(1, 2, 3);

      const result = euler.rotateVector3(v);

      // 当没有out时，结果应该是v本身（因为Quaternion.rotateVector3的行为）
      // 但实际上返回的是一个新向量，检查值是否正确
      expect(result.x).toBeCloseTo(1, 3);
      expect(result.y).toBeCloseTo(2, 3);
      expect(result.z).toBeCloseTo(3, 3);
    });
  });

  describe('equals方法', () => {
    test('应该检测相等的欧拉角', () => {
      const euler1 = new Euler(30, 45, 60, 'xyz' as EulerOrder);
      const euler2 = new Euler(30, 45, 60, 'xyz' as EulerOrder);

      expect(euler1.equals(euler2)).toBe(true);
    });

    test('应该检测不相等的欧拉角（值不同）', () => {
      const euler1 = new Euler(30, 45, 60);
      const euler2 = new Euler(30, 45, 61);

      expect(euler1.equals(euler2)).toBe(false);
    });

    test('应该检测不相等的欧拉角（顺序不同）', () => {
      const euler1 = new Euler(30, 45, 60, 'xyz' as EulerOrder);
      const euler2 = new Euler(30, 45, 60, 'zyx' as EulerOrder);

      expect(euler1.equals(euler2)).toBe(false);
    });
  });

  describe('toVector3方法', () => {
    test('应该将欧拉角转换为向量', () => {
      const euler = new Euler(10, 20, 30);
      const vec = new Vector3();

      const result = euler.toVector3(vec);

      expect(result).toBe(vec);
      expect(vec.x).toBe(10);
      expect(vec.y).toBe(20);
      expect(vec.z).toBe(30);
    });
  });

  describe('toArray方法', () => {
    test('应该将欧拉角转换为数组', () => {
      const euler = new Euler(10, 20, 30);

      const result = euler.toArray();

      expect(result).toEqual([10, 20, 30]);
    });
  });

  describe('toQuaternion方法', () => {
    test('应该将欧拉角转换为四元数（XYZ顺序）', () => {
      const euler = new Euler(0, 0, 0, 'xyz' as EulerOrder);
      const quat = new Quaternion();

      euler.toQuaternion(quat);

      expect(quat.x).toBeCloseTo(0, 5);
      expect(quat.y).toBeCloseTo(0, 5);
      expect(quat.z).toBeCloseTo(0, 5);
      expect(quat.w).toBeCloseTo(1, 5);
    });

    test('应该将非零欧拉角转换为四元数', () => {
      const euler = new Euler(90, 0, 0, 'xyz' as EulerOrder);
      const quat = new Quaternion();

      euler.toQuaternion(quat);

      // sin(45度) ~= 0.7071
      expect(quat.x).toBeCloseTo(Math.sin(45 * DEG2RAD), 4);
      expect(quat.y).toBeCloseTo(0, 4);
      expect(quat.z).toBeCloseTo(0, 4);
      expect(quat.w).toBeCloseTo(Math.cos(45 * DEG2RAD), 4);
    });

    test('应该将欧拉角转换为四元数（YXZ顺序）', () => {
      const euler = new Euler(0, 0, 0, 'yxz' as EulerOrder);
      const quat = new Quaternion();

      euler.toQuaternion(quat);

      expect(quat.w).toBeCloseTo(1, 5);
    });

    test('应该将欧拉角转换为四元数（ZXY顺序）', () => {
      const euler = new Euler(0, 0, 0, 'zxy' as EulerOrder);
      const quat = new Quaternion();

      euler.toQuaternion(quat);

      expect(quat.w).toBeCloseTo(1, 5);
    });

    test('应该将欧拉角转换为四元数（ZYX顺序）', () => {
      const euler = new Euler(0, 0, 0, 'zyx' as EulerOrder);
      const quat = new Quaternion();

      euler.toQuaternion(quat);

      expect(quat.w).toBeCloseTo(1, 5);
    });

    test('应该将欧拉角转换为四元数（YZX顺序）', () => {
      const euler = new Euler(0, 0, 0, 'yzx' as EulerOrder);
      const quat = new Quaternion();

      euler.toQuaternion(quat);

      expect(quat.w).toBeCloseTo(1, 5);
    });

    test('应该将欧拉角转换为四元数（XZY顺序）', () => {
      const euler = new Euler(0, 0, 0, 'xzy' as EulerOrder);
      const quat = new Quaternion();

      euler.toQuaternion(quat);

      expect(quat.w).toBeCloseTo(1, 5);
    });
  });

  describe('toMatrix4方法', () => {
    test('应该将欧拉角转换为矩阵（XYZ顺序）', () => {
      const euler = new Euler(0, 0, 0, 'xyz' as EulerOrder);
      const mat = new Matrix4();

      const result = euler.toMatrix4(mat);

      expect(result).toBe(mat);
      // 单位旋转应该是单位矩阵
      const e = mat.getElements();
      expect(e[0]).toBeCloseTo(1, 5);
      expect(e[5]).toBeCloseTo(1, 5);
      expect(e[10]).toBeCloseTo(1, 5);
    });

    test('应该将欧拉角转换为矩阵（YXZ顺序）', () => {
      const euler = new Euler(0, 0, 0, 'yxz' as EulerOrder);
      const mat = new Matrix4();

      euler.toMatrix4(mat);

      const e = mat.getElements();
      expect(e[0]).toBeCloseTo(1, 5);
    });

    test('应该将欧拉角转换为矩阵（ZXY顺序）', () => {
      const euler = new Euler(0, 0, 0, 'zxy' as EulerOrder);
      const mat = new Matrix4();

      euler.toMatrix4(mat);

      const e = mat.getElements();
      expect(e[0]).toBeCloseTo(1, 5);
    });

    test('应该将欧拉角转换为矩阵（ZYX顺序）', () => {
      const euler = new Euler(0, 0, 0, 'zyx' as EulerOrder);
      const mat = new Matrix4();

      euler.toMatrix4(mat);

      const e = mat.getElements();
      expect(e[0]).toBeCloseTo(1, 5);
    });

    test('应该将欧拉角转换为矩阵（YZX顺序）', () => {
      const euler = new Euler(0, 0, 0, 'yzx' as EulerOrder);
      const mat = new Matrix4();

      euler.toMatrix4(mat);

      const e = mat.getElements();
      expect(e[0]).toBeCloseTo(1, 5);
    });

    test('应该将欧拉角转换为矩阵（XZY顺序）', () => {
      const euler = new Euler(0, 0, 0, 'xzy' as EulerOrder);
      const mat = new Matrix4();

      euler.toMatrix4(mat);

      const e = mat.getElements();
      expect(e[0]).toBeCloseTo(1, 5);
    });
  });

  describe('静态方法', () => {
    test('fromRotationMatrix4应该从矩阵创建欧拉角', () => {
      const mat = new Matrix4();
      const euler = Euler.fromRotationMatrix4(mat);

      expect(euler.x).toBeCloseTo(0, 4);
      expect(euler.y).toBeCloseTo(0, 4);
      expect(euler.z).toBeCloseTo(0, 4);
    });

    test('fromQuaternion应该从四元数创建欧拉角', () => {
      const quat = new Quaternion(0, 0, 0, 1);
      const euler = Euler.fromQuaternion(quat);

      expect(euler.x).toBeCloseTo(0, 4);
      expect(euler.y).toBeCloseTo(0, 4);
      expect(euler.z).toBeCloseTo(0, 4);
    });

    test('fromVector3应该从向量创建欧拉角', () => {
      const v = new Vector3(10, 20, 30);
      const euler = Euler.fromVector3(v);

      expect(euler.x).toBe(10);
      expect(euler.y).toBe(20);
      expect(euler.z).toBe(30);
    });

    test('fromArray应该从类欧拉角对象创建欧拉角', () => {
      const array = { x: 10, y: 20, z: 30 };
      const euler = Euler.fromArray(array);

      expect(euler.x).toBe(10);
      expect(euler.y).toBe(20);
      expect(euler.z).toBe(30);
    });
  });

  describe('往返转换测试', () => {
    test('欧拉角到四元数再到欧拉角应该保持一致', () => {
      const original = new Euler(30, 45, 60, 'xyz' as EulerOrder);
      const quat = new Quaternion();
      const result = new Euler();

      original.toQuaternion(quat);
      result.setFromQuaternion(quat, 'xyz' as EulerOrder);

      expect(result.x).toBeCloseTo(original.x, 3);
      expect(result.y).toBeCloseTo(original.y, 3);
      expect(result.z).toBeCloseTo(original.z, 3);
    });

    test('欧拉角到矩阵再到欧拉角应该保持一致', () => {
      const original = new Euler(30, 45, 60, 'xyz' as EulerOrder);
      const mat = new Matrix4();
      const result = new Euler();

      original.toMatrix4(mat);
      result.setFromRotationMatrix4(mat, 'xyz' as EulerOrder);

      expect(result.x).toBeCloseTo(original.x, 3);
      expect(result.y).toBeCloseTo(original.y, 3);
      expect(result.z).toBeCloseTo(original.z, 3);
    });
  });

  describe('边界情况测试', () => {
    test('应该处理零欧拉角', () => {
      const euler = new Euler(0, 0, 0);
      const quat = new Quaternion();
      euler.toQuaternion(quat);

      expect(quat.w).toBeCloseTo(1, 5);
    });

    test('应该处理360度旋转', () => {
      const euler = new Euler(360, 0, 0);
      const quat = new Quaternion();
      euler.toQuaternion(quat);

      // 360度旋转应该接近单位四元数
      expect(Math.abs(quat.w)).toBeCloseTo(1, 4);
    });

    test('应该处理负角度', () => {
      const euler = new Euler(-30, -45, -60);

      expect(euler.x).toBe(-30);
      expect(euler.y).toBe(-45);
      expect(euler.z).toBe(-60);
    });

    test('应该处理大角度', () => {
      const euler = new Euler(720, 0, 0);
      const quat = new Quaternion();
      euler.toQuaternion(quat);

      // 720度旋转应该接近单位四元数
      expect(Math.abs(quat.w)).toBeCloseTo(1, 3);
    });

    test('应该处理万向节锁情况（Y=90度）', () => {
      const euler = new Euler(30, 90, 60, 'xyz' as EulerOrder);
      const mat = new Matrix4();
      euler.toMatrix4(mat);

      // 矩阵应该是有效的，对角线元素应该在合理范围内
      const e = mat.getElements();
      // 检查矩阵元素不是NaN
      expect(isNaN(e[0])).toBe(false);
      expect(isNaN(e[5])).toBe(false);
      expect(isNaN(e[10])).toBe(false);
    });
  });

  describe('所有旋转顺序测试', () => {
    const orders = ['xyz', 'yxz', 'zxy', 'zyx', 'yzx', 'xzy'] as EulerOrder[];

    orders.forEach((order) => {
      test(`应该正确处理${order}顺序的往返转换`, () => {
        const original = new Euler(20, 30, 40, order);
        const quat = new Quaternion();
        const result = new Euler();

        original.toQuaternion(quat);
        result.setFromQuaternion(quat, order);

        expect(result.x).toBeCloseTo(original.x, 2);
        expect(result.y).toBeCloseTo(original.y, 2);
        expect(result.z).toBeCloseTo(original.z, 2);
      });

      test(`应该正确处理${order}顺序的矩阵转换`, () => {
        const euler = new Euler(0, 0, 0, order);
        const mat = new Matrix4();

        euler.toMatrix4(mat);

        const e = mat.getElements();
        expect(e[0]).toBeCloseTo(1, 5);
        expect(e[5]).toBeCloseTo(1, 5);
        expect(e[10]).toBeCloseTo(1, 5);
      });
    });
  });
});
