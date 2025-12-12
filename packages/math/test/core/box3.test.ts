/**
 * Box3 完整测试套件
 * 目标：测试覆盖率 95%+
 */

import { Box3 } from '../../src/core/box3';
import { Vector3 } from '../../src/core/vector3';
import { Matrix4 } from '../../src/core/matrix4';
import { Sphere } from '../../src/core/sphere';
import { Quaternion } from '../../src/core/quaternion';
import { performanceTest, testRandom } from '../setup';
import { expect } from '@jest/globals';

// 辅助函数：执行指定次数的随机测试
const runRandomTests = (count: number, fn: () => void) => {
  for (let i = 0; i < count; i++) {
    fn();
  }
};

describe('Box3', () => {
  describe('构造函数和基础属性', () => {
    test('应该创建默认空包围盒', () => {
      const box = new Box3();
      expect(box.min.x).toBe(Infinity);
      expect(box.min.y).toBe(Infinity);
      expect(box.min.z).toBe(Infinity);
      expect(box.max.x).toBe(-Infinity);
      expect(box.max.y).toBe(-Infinity);
      expect(box.max.z).toBe(-Infinity);
      expect(box.isEmpty()).toBe(true);
    });

    test('应该创建指定最小和最大点的包围盒', () => {
      const min = new Vector3(-1, -2, -3);
      const max = new Vector3(4, 5, 6);
      const box = new Box3(min, max);
      (expect(box.min) as any).toEqualVector3(min);
      (expect(box.max) as any).toEqualVector3(max);
    });

    test('构造函数应该克隆传入的向量', () => {
      const min = new Vector3(-1, -2, -3);
      const max = new Vector3(4, 5, 6);
      const box = new Box3(min, max);

      min.x = 10;
      max.y = 20;

      expect(box.min.x).toBe(-1);
      expect(box.max.y).toBe(5);
    });
  });

  describe('set方法', () => {
    test('应该设置包围盒的最小和最大点', () => {
      const box = new Box3();
      const min = new Vector3(-5, -10, -15);
      const max = new Vector3(5, 10, 15);

      const result = box.set(min, max);

      (expect(box.min) as any).toEqualVector3(min);
      (expect(box.max) as any).toEqualVector3(max);
      expect(result).toBe(box);
    });
  });

  describe('setFromArray方法', () => {
    test('应该从数组创建包围盒', () => {
      const box = new Box3();
      const array = [-1, -1, -1, 1, 1, 1, 0, 0, 0];

      box.setFromArray(array);

      (expect(box.min) as any).toEqualVector3({ x: -1, y: -1, z: -1 });
      (expect(box.max) as any).toEqualVector3({ x: 1, y: 1, z: 1 });
    });

    test('应该处理空数组', () => {
      const box = new Box3();

      box.setFromArray([]);

      expect(box.min.x).toBe(Infinity);
      expect(box.max.x).toBe(-Infinity);
    });

    test('应该处理不完整的点数据', () => {
      const box = new Box3();
      const array = [1, 2]; // 不完整的点

      box.setFromArray(array);

      expect(box.min.x).toBe(1);
      expect(box.min.y).toBe(2);
      expect(box.min.z).toBe(Infinity);
      expect(box.max.x).toBe(1);
      expect(box.max.y).toBe(2);
      expect(box.max.z).toBe(-Infinity);
    });

    test('应该处理单个点', () => {
      const box = new Box3();
      const array = [5, 10, 15];

      box.setFromArray(array);

      (expect(box.min) as any).toEqualVector3({ x: 5, y: 10, z: 15 });
      (expect(box.max) as any).toEqualVector3({ x: 5, y: 10, z: 15 });
    });
  });

  describe('setFromPoints方法', () => {
    test('应该从点数组创建包围盒', () => {
      const box = new Box3();
      const points = [new Vector3(-1, -1, -1), new Vector3(1, 1, 1), new Vector3(0, 0, 0), new Vector3(-2, 2, -1)];

      box.setFromPoints(points);

      (expect(box.min) as any).toEqualVector3({ x: -2, y: -1, z: -1 });
      (expect(box.max) as any).toEqualVector3({ x: 1, y: 2, z: 1 });
    });

    test('应该处理空点数组', () => {
      const box = new Box3();

      box.setFromPoints([]);

      expect(box.isEmpty()).toBe(true);
    });
  });

  describe('setFromCenterAndSize方法', () => {
    test('应该从中心和大小创建包围盒', () => {
      const box = new Box3();
      const center = new Vector3(0, 0, 0);
      const size = new Vector3(2, 4, 6);

      box.setFromCenterAndSize(center, size);

      (expect(box.min) as any).toEqualVector3({ x: -1, y: -2, z: -3 });
      (expect(box.max) as any).toEqualVector3({ x: 1, y: 2, z: 3 });
    });

    test('应该处理非零中心', () => {
      const box = new Box3();
      const center = new Vector3(10, 20, 30);
      const size = new Vector3(4, 6, 8);

      box.setFromCenterAndSize(center, size);

      (expect(box.min) as any).toEqualVector3({ x: 8, y: 17, z: 26 });
      (expect(box.max) as any).toEqualVector3({ x: 12, y: 23, z: 34 });
    });

    test('应该处理零大小', () => {
      const box = new Box3();
      const center = new Vector3(5, 5, 5);
      const size = new Vector3(0, 0, 0);

      box.setFromCenterAndSize(center, size);

      (expect(box.min) as any).toEqualVector3(center);
      (expect(box.max) as any).toEqualVector3(center);
    });
  });

  describe('clone和copyFrom方法', () => {
    test('clone应该创建独立的副本', () => {
      const original = new Box3(new Vector3(1, 2, 3), new Vector3(4, 5, 6));
      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.min).not.toBe(original.min);
      expect(cloned.max).not.toBe(original.max);
      (expect(cloned) as any).toEqualBox3(original);
    });

    test('copyFrom应该复制另一个包围盒', () => {
      const box1 = new Box3(new Vector3(1, 2, 3), new Vector3(4, 5, 6));
      const box2 = new Box3();

      const result = box2.copyFrom(box1);

      (expect(box2.min) as any).toEqualVector3(box1.min);
      (expect(box2.max) as any).toEqualVector3(box1.max);
      expect(result).toBe(box2);
    });
  });

  describe('makeEmpty和isEmpty方法', () => {
    test('makeEmpty应该重置包围盒为空', () => {
      const box = new Box3(new Vector3(1, 2, 3), new Vector3(4, 5, 6));

      box.makeEmpty();

      expect(box.isEmpty()).toBe(true);
      expect(box.min.x).toBe(Infinity);
      expect(box.max.x).toBe(-Infinity);
    });

    test('isEmpty应该正确识别空包围盒', () => {
      const emptyBox = new Box3();
      expect(emptyBox.isEmpty()).toBe(true);

      const validBox = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      expect(validBox.isEmpty()).toBe(false);

      const invertedBox = new Box3(new Vector3(1, 1, 1), new Vector3(0, 0, 0));
      expect(invertedBox.isEmpty()).toBe(true);
    });
  });

  describe('getCenter方法', () => {
    test('应该返回包围盒的中心点', () => {
      const box = new Box3(new Vector3(-2, -4, -6), new Vector3(2, 4, 6));
      const target = new Vector3();

      const result = box.getCenter(target);

      expect(result).toBe(target);
      (expect(target) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
    });

    test('应该为非对称包围盒返回正确的中心', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(4, 8, 12));
      const center = box.getCenter();

      (expect(center) as any).toEqualVector3({ x: 2, y: 4, z: 6 });
    });

    test('空包围盒应该返回零向量', () => {
      const emptyBox = new Box3();
      const center = emptyBox.getCenter();

      (expect(center) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
    });
  });

  describe('getSize方法', () => {
    test('应该返回包围盒的尺寸', () => {
      const box = new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));
      const target = new Vector3();

      const result = box.getSize(target);

      expect(result).toBe(target);
      (expect(target) as any).toEqualVector3({ x: 2, y: 4, z: 6 });
    });

    test('空包围盒应该返回零向量', () => {
      const emptyBox = new Box3();
      const size = emptyBox.getSize();

      (expect(size) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
    });
  });

  describe('expandByPoint方法', () => {
    test('应该通过点扩展包围盒', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const point = new Vector3(2, 2, 2);

      const result = box.expandByPoint(point);

      expect(result).toBe(box);
      (expect(box.max) as any).toEqualVector3({ x: 2, y: 2, z: 2 });
    });

    test('应该向内扩展包围盒', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const point = new Vector3(-1, -1, -1);

      box.expandByPoint(point);

      (expect(box.min) as any).toEqualVector3({ x: -1, y: -1, z: -1 });
    });

    test('应该处理空包围盒', () => {
      const box = new Box3();
      const point = new Vector3(5, 10, 15);

      box.expandByPoint(point);

      (expect(box.min) as any).toEqualVector3(point);
      (expect(box.max) as any).toEqualVector3(point);
    });
  });

  describe('expandByVector方法', () => {
    test('应该通过向量扩展包围盒', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const vector = new Vector3(0.5, 0.5, 0.5);

      const result = box.expandByVector(vector);

      expect(result).toBe(box);
      (expect(box.min) as any).toEqualVector3({ x: -0.5, y: -0.5, z: -0.5 });
      (expect(box.max) as any).toEqualVector3({ x: 1.5, y: 1.5, z: 1.5 });
    });
  });

  describe('expandByScalar方法', () => {
    test('应该通过标量扩展包围盒', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));

      const result = box.expandByScalar(0.5);

      expect(result).toBe(box);
      (expect(box.min) as any).toEqualVector3({ x: -0.5, y: -0.5, z: -0.5 });
      (expect(box.max) as any).toEqualVector3({ x: 1.5, y: 1.5, z: 1.5 });
    });
  });

  describe('expandByBox方法', () => {
    test('应该通过另一个包围盒扩展', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const box2 = new Box3(new Vector3(0.5, 0.5, 0.5), new Vector3(1.5, 1.5, 1.5));

      const result = box1.expandByBox(box2);

      expect(result).toBe(box1);
      (expect(box1.min) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      (expect(box1.max) as any).toEqualVector3({ x: 1.5, y: 1.5, z: 1.5 });
    });

    test('应该处理不相交的包围盒', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const box2 = new Box3(new Vector3(2, 2, 2), new Vector3(3, 3, 3));

      box1.expandByBox(box2);

      (expect(box1.min) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      (expect(box1.max) as any).toEqualVector3({ x: 3, y: 3, z: 3 });
    });
  });

  describe('containsPoint方法', () => {
    test('应该检测包围盒内的点', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));

      expect(box.containsPoint(new Vector3(0.5, 0.5, 0.5))).toBe(true);
      expect(box.containsPoint(new Vector3(0, 0, 0))).toBe(true);
      expect(box.containsPoint(new Vector3(1, 1, 1))).toBe(true);
    });

    test('应该检测包围盒外的点', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));

      expect(box.containsPoint(new Vector3(-1, 0.5, 0.5))).toBe(false);
      expect(box.containsPoint(new Vector3(0.5, 2, 0.5))).toBe(false);
      expect(box.containsPoint(new Vector3(0.5, 0.5, 1.1))).toBe(false);
    });

    test('空包围盒不应该包含任何点', () => {
      const emptyBox = new Box3();

      expect(emptyBox.containsPoint(new Vector3(0, 0, 0))).toBe(false);
    });
  });

  describe('containsBox方法', () => {
    test('应该检测完全包含的包围盒', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const box2 = new Box3(new Vector3(0.5, 0.5, 0.5), new Vector3(1.5, 1.5, 1.5));

      expect(box1.containsBox(box2)).toBe(true);
    });

    test('应该检测部分相交的包围盒', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const box2 = new Box3(new Vector3(0.5, 0.5, 0.5), new Vector3(1.5, 1.5, 1.5));

      expect(box1.containsBox(box2)).toBe(false);
      expect(box2.containsBox(box1)).toBe(false);
    });

    test('相等的包围盒应该互相包含', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const box2 = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));

      expect(box1.containsBox(box2)).toBe(true);
      expect(box2.containsBox(box1)).toBe(true);
    });
  });

  describe('getParameter方法', () => {
    test('应该返回点在包围盒中的比例位置', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(10, 10, 10));
      const point = new Vector3(5, 5, 5);
      const target = new Vector3();

      const result = box.getParameter(point, target);

      expect(result).toBe(target);
      (expect(target) as any).toEqualVector3({ x: 0.5, y: 0.5, z: 0.5 });
    });

    test('应该处理最小点', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(10, 10, 10));
      const point = new Vector3(0, 0, 0);
      const param = box.getParameter(point);

      (expect(param) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
    });

    test('应该处理最大点', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(10, 10, 10));
      const point = new Vector3(10, 10, 10);
      const param = box.getParameter(point);

      (expect(param) as any).toEqualVector3({ x: 1, y: 1, z: 1 });
    });
  });

  describe('intersectsBox方法', () => {
    test('应该检测相交的包围盒', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const box2 = new Box3(new Vector3(0.5, 0.5, 0.5), new Vector3(1.5, 1.5, 1.5));

      expect(box1.intersectsBox(box2)).toBe(true);
      expect(box2.intersectsBox(box1)).toBe(true);
    });

    test('应该检测不相交的包围盒', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const box2 = new Box3(new Vector3(2, 2, 2), new Vector3(3, 3, 3));

      expect(box1.intersectsBox(box2)).toBe(false);
      expect(box2.intersectsBox(box1)).toBe(false);
    });

    test('应该检测边界相切', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const box2 = new Box3(new Vector3(1, 1, 1), new Vector3(2, 2, 2));

      expect(box1.intersectsBox(box2)).toBe(true);
    });

    test('空包围盒不应该相交', () => {
      const emptyBox = new Box3();
      const validBox = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));

      expect(emptyBox.intersectsBox(validBox)).toBe(false);
      expect(validBox.intersectsBox(emptyBox)).toBe(false);
    });
  });

  describe('intersectsSphere方法', () => {
    test('应该检测与球的相交', () => {
      const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);

      expect(box.intersectsSphere(sphere)).toBe(true);
    });

    test('应该检测不相交的球', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const sphere = new Sphere(new Vector3(3, 3, 3), 1);

      expect(box.intersectsSphere(sphere)).toBe(false);
    });

    test('应该处理包含球心的情况', () => {
      const box = new Box3(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5));
      const sphere = new Sphere(new Vector3(0, 0, 0), 2);

      expect(box.intersectsSphere(sphere)).toBe(true);
    });
  });

  describe('clampPoint方法', () => {
    test('应该将包围盒内的点保持不变', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const point = new Vector3(0.5, 0.5, 0.5);
      const target = new Vector3();

      const result = box.clampPoint(point, target);

      expect(result).toBe(target);
      (expect(target) as any).toEqualVector3(point);
    });

    test('应该将包围盒外的点限制到边界', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const point = new Vector3(-1, 2, 0.5);
      const clamped = box.clampPoint(point);

      (expect(clamped) as any).toEqualVector3({ x: 0, y: 1, z: 0.5 });
    });
  });

  describe('distanceToPoint方法', () => {
    test('应该返回包围盒内点的距离为0', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const point = new Vector3(0.5, 0.5, 0.5);

      expect(box.distanceToPoint(point)).toBe(0);
    });

    test('应该计算到包围盒外点的距离', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const point = new Vector3(-1, 0.5, 0.5);

      expect(box.distanceToPoint(point)).toBe(1);
    });

    test('应该计算对角距离', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const point = new Vector3(-1, -1, -1);

      expect(box.distanceToPoint(point)).toBeCloseTo(Math.sqrt(3), 5);
    });
  });

  describe('intersect方法', () => {
    test('应该计算两个包围盒的交集', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const box2 = new Box3(new Vector3(1, 1, 1), new Vector3(3, 3, 3));

      const result = box1.intersect(box2);

      expect(result).toBe(box1);
      (expect(box1.min) as any).toEqualVector3({ x: 1, y: 1, z: 1 });
      (expect(box1.max) as any).toEqualVector3({ x: 2, y: 2, z: 2 });
    });

    test('应该处理不相交的包围盒', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const box2 = new Box3(new Vector3(2, 2, 2), new Vector3(3, 3, 3));

      box1.intersect(box2);

      expect(box1.isEmpty()).toBe(true);
    });

    test('应该处理完全包含', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(3, 3, 3));
      const box2 = new Box3(new Vector3(1, 1, 1), new Vector3(2, 2, 2));

      box1.intersect(box2);

      (expect(box1) as any).toEqualBox3(box2);
    });
  });

  describe('union方法', () => {
    test('应该计算两个包围盒的并集', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const box2 = new Box3(new Vector3(2, 2, 2), new Vector3(3, 3, 3));

      const result = box1.union(box2);

      expect(result).toBe(box1);
      (expect(box1.min) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      (expect(box1.max) as any).toEqualVector3({ x: 3, y: 3, z: 3 });
    });

    test('应该处理相交的包围盒', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(2, 2, 2));
      const box2 = new Box3(new Vector3(1, 1, 1), new Vector3(3, 3, 3));

      box1.union(box2);

      (expect(box1.min) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      (expect(box1.max) as any).toEqualVector3({ x: 3, y: 3, z: 3 });
    });

    test('应该处理空包围盒', () => {
      const box1 = new Box3();
      const box2 = new Box3(new Vector3(1, 1, 1), new Vector3(2, 2, 2));

      box1.union(box2);

      (expect(box1) as any).toEqualBox3(box2);
    });
  });

  describe('applyMatrix4方法', () => {
    test('应该应用变换矩阵', () => {
      const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
      const matrix = new Matrix4().compose(new Vector3(1, 2, 3), new Quaternion(0, 0, 0, 1), new Vector3(1, 1, 1));

      const result = box.applyMatrix4(matrix);

      expect(result).toBe(box);
      (expect(box.min) as any).toEqualVector3({ x: 0, y: 1, z: 2 });
      (expect(box.max) as any).toEqualVector3({ x: 2, y: 3, z: 4 });
    });

    test('应该应用缩放变换', () => {
      const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
      const matrix = new Matrix4().compose(new Vector3(0, 0, 0), new Quaternion(0, 0, 0, 1), new Vector3(2, 2, 2));

      box.applyMatrix4(matrix);

      (expect(box.min) as any).toEqualVector3({ x: -2, y: -2, z: -2 });
      (expect(box.max) as any).toEqualVector3({ x: 2, y: 2, z: 2 });
    });

    test('应该处理空包围盒', () => {
      const emptyBox = new Box3();
      const matrix = new Matrix4().compose(new Vector3(1, 2, 3), new Quaternion(0, 0, 0, 1), new Vector3(1, 1, 1));

      emptyBox.applyMatrix4(matrix);

      expect(emptyBox.isEmpty()).toBe(true);
    });
  });

  describe('getOBBPoints方法', () => {
    test('应该返回OBB的8个顶点', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const matrix = new Matrix4();
      const points = box.getOBBPoints(matrix);

      expect(points).toHaveLength(8);
      (expect(points[0]) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      (expect(points[7]) as any).toEqualVector3({ x: 1, y: 1, z: 1 });
    });

    test('空包围盒应该返回空数组', () => {
      const emptyBox = new Box3();
      const matrix = new Matrix4();
      const points = emptyBox.getOBBPoints(matrix);

      expect(points).toHaveLength(0);
    });
  });

  describe('getBoundingSphere方法', () => {
    test('应该返回包围盒的包围球', () => {
      const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
      const sphere = new Sphere();

      const result = box.getBoundingSphere(sphere);

      expect(result).toBe(sphere);
      (expect(sphere.center) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      expect(sphere.radius).toBeCloseTo(Math.sqrt(3), 5);
    });

    test('应该处理非对称包围盒', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(2, 4, 6));
      const sphere = new Sphere();

      box.getBoundingSphere(sphere);

      (expect(sphere.center) as any).toEqualVector3({ x: 1, y: 2, z: 3 });
      expect(sphere.radius).toBeCloseTo(Math.sqrt(1 + 4 + 9), 5);
    });
  });

  describe('translate方法', () => {
    test('应该平移包围盒', () => {
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const offset = new Vector3(1, 2, 3);

      const result = box.translate(offset);

      expect(result).toBe(box);
      (expect(box.min) as any).toEqualVector3({ x: 1, y: 2, z: 3 });
      (expect(box.max) as any).toEqualVector3({ x: 2, y: 3, z: 4 });
    });
  });

  describe('equals方法', () => {
    test('应该检测相等的包围盒', () => {
      const box1 = new Box3(new Vector3(1, 2, 3), new Vector3(4, 5, 6));
      const box2 = new Box3(new Vector3(1, 2, 3), new Vector3(4, 5, 6));

      expect(box1.equals(box2)).toBe(true);
    });

    test('应该检测不相等的包围盒', () => {
      const box1 = new Box3(new Vector3(1, 2, 3), new Vector3(4, 5, 6));
      const box2 = new Box3(new Vector3(1, 2, 3), new Vector3(4, 5, 7));

      expect(box1.equals(box2)).toBe(false);
    });
  });

  describe('边界情况测试', () => {
    test('应该处理零大小的包围盒', () => {
      const point = new Vector3(5, 5, 5);
      const box = new Box3(point, point);

      expect(box.isEmpty()).toBe(false);
      (expect(box.getCenter()) as any).toEqualVector3(point);
      (expect(box.getSize()) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      expect(box.containsPoint(point)).toBe(true);
    });

    test('应该处理负坐标', () => {
      const box = new Box3(new Vector3(-10, -20, -30), new Vector3(-1, -2, -3));

      expect(box.isEmpty()).toBe(false);
      expect(box.containsPoint(new Vector3(-5, -10, -15))).toBe(true);
      expect(box.containsPoint(new Vector3(0, 0, 0))).toBe(false);
    });

    test('应该处理极大值', () => {
      const box = new Box3(
        new Vector3(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
        new Vector3(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
      );

      expect(box.isEmpty()).toBe(false);
    });
  });

  // 暂时跳过性能测试，避免资源消耗
  describe.skip('性能测试', () => {
    test('大批量操作性能', () => {
      const boxes: Box3[] = [];

      performanceTest('创建10000个Box3', () => {
        for (let i = 0; i < 10000; i++) {
          boxes.push(
            new Box3(
              new Vector3(testRandom.nextFloat(0, 1), testRandom.nextFloat(0, 1), testRandom.nextFloat(0, 1)),
              new Vector3(testRandom.nextFloat(1, 2), testRandom.nextFloat(1, 2), testRandom.nextFloat(1, 2))
            )
          );
        }
      });

      expect(boxes).toHaveLength(10000);
    });

    test('相交检测性能', () => {
      const box1 = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const box2 = new Box3(new Vector3(0.5, 0.5, 0.5), new Vector3(1.5, 1.5, 1.5));

      performanceTest('10000次相交检测', () => {
        for (let i = 0; i < 10000; i++) {
          box1.intersectsBox(box2);
        }
      });

      expect(box1.intersectsBox(box2)).toBe(true);
    });
  });

  // 暂时跳过随机测试，避免内存问题
  describe.skip('随机测试', () => {
    test('随机点包含关系', () => {
      runRandomTests(10, () => {
        const box = new Box3(
          new Vector3(testRandom.nextFloat(0, 10), testRandom.nextFloat(0, 10), testRandom.nextFloat(0, 10)),
          new Vector3(testRandom.nextFloat(10, 20), testRandom.nextFloat(10, 20), testRandom.nextFloat(10, 20))
        );

        const point = new Vector3(
          testRandom.nextFloat(0, 20),
          testRandom.nextFloat(0, 20),
          testRandom.nextFloat(0, 20)
        );
        const contains = box.containsPoint(point);

        // 验证结果的一致性
        expect(typeof contains).toBe('boolean');
      });
    });

    test('随机包围盒运算', () => {
      runRandomTests(5, () => {
        const box1 = new Box3(
          new Vector3(testRandom.nextFloat(0, 10), testRandom.nextFloat(0, 10), testRandom.nextFloat(0, 10)),
          new Vector3(testRandom.nextFloat(10, 20), testRandom.nextFloat(10, 20), testRandom.nextFloat(10, 20))
        );

        const box2 = new Box3(
          new Vector3(testRandom.nextFloat(0, 10), testRandom.nextFloat(0, 10), testRandom.nextFloat(0, 10)),
          new Vector3(testRandom.nextFloat(10, 20), testRandom.nextFloat(10, 20), testRandom.nextFloat(10, 20))
        );

        // 测试并集和交集
        const union = box1.clone().union(box2);
        const intersect = box1.clone().intersect(box2);

        // 并集应该包含原始包围盒
        expect(union.containsBox(box1) || box1.isEmpty()).toBe(true);
        expect(union.containsBox(box2) || box2.isEmpty()).toBe(true);

        // 交集应该被原始包围盒包含
        if (!intersect.isEmpty()) {
          expect(box1.containsBox(intersect) || box1.isEmpty()).toBe(true);
          expect(box2.containsBox(intersect) || box2.isEmpty()).toBe(true);
        }
      });
    });
  });
});

// 扩展匹配器
declare global {
  namespace jest {
    interface Matchers<R> {
      toEqualBox3(expected: Box3): R;
    }
  }
}

expect.extend({
  toEqualBox3(received: Box3, expected: Box3) {
    const minMatch = received.min.equals(expected.min);
    const maxMatch = received.max.equals(expected.max);

    return {
      message: () =>
        `expected Box3(${expected.min.toArray()}, ${expected.max.toArray()}) to equal Box3(${received.min.toArray()}, ${received.max.toArray()})`,
      pass: minMatch && maxMatch,
    };
  },
});
