/**
 * Sphere 完整测试套件
 * 目标：测试覆盖率 95%+
 */

import { Sphere } from '../../src/core/sphere';
import { Vector3 } from '../../src/core/vector3';
import { Box3 } from '../../src/core/box3';
import { Matrix4 } from '../../src/core/matrix4';
import { Quaternion } from '../../src/core/quaternion';
import { expect } from '@jest/globals';

describe('Sphere', () => {
  describe('构造函数和基础属性', () => {
    test('应该创建默认空球', () => {
      const sphere = new Sphere();
      (expect(sphere.center) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      expect(sphere.radius).toBe(-1);
      expect(sphere.isEmpty()).toBe(true);
    });

    test('应该创建指定中心和半径的球', () => {
      const center = new Vector3(1, 2, 3);
      const sphere = new Sphere(center, 5);
      (expect(sphere.center) as any).toEqualVector3({ x: 1, y: 2, z: 3 });
      expect(sphere.radius).toBe(5);
    });

    test('构造函数应该克隆传入的中心点', () => {
      const center = new Vector3(1, 2, 3);
      const sphere = new Sphere(center, 5);

      center.x = 10;

      expect(sphere.center.x).toBe(1);
    });
  });

  describe('set方法', () => {
    test('应该设置球的中心和半径', () => {
      const sphere = new Sphere();
      const center = new Vector3(5, 10, 15);

      const result = sphere.set(center, 10);

      (expect(sphere.center) as any).toEqualVector3(center);
      expect(sphere.radius).toBe(10);
      expect(result).toBe(sphere);
    });
  });

  describe('setFromPoints方法', () => {
    test('应该从点数组创建球（无指定中心）', () => {
      const sphere = new Sphere();
      const points = [new Vector3(-1, -1, -1), new Vector3(1, 1, 1), new Vector3(0, 0, 0)];

      sphere.setFromPoints(points);

      // 中心应该是包围盒的中心
      (expect(sphere.center) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      expect(sphere.radius).toBeGreaterThan(0);
    });

    test('应该从点数组创建球（指定中心）', () => {
      const sphere = new Sphere();
      const points = [new Vector3(-2, 0, 0), new Vector3(2, 0, 0)];
      const center = new Vector3(0, 0, 0);

      sphere.setFromPoints(points, center);

      (expect(sphere.center) as any).toEqualVector3(center);
      expect(sphere.radius).toBe(2);
    });

    test('应该处理单个点', () => {
      const sphere = new Sphere();
      const center = new Vector3(1, 2, 3);
      const points = [new Vector3(1, 2, 3)];

      sphere.setFromPoints(points, center);

      (expect(sphere.center) as any).toEqualVector3(center);
      expect(sphere.radius).toBe(0);
    });
  });

  describe('copyFrom方法', () => {
    test('应该复制另一个球', () => {
      const sphere1 = new Sphere(new Vector3(1, 2, 3), 5);
      const sphere2 = new Sphere();

      const result = sphere2.copyFrom(sphere1);

      (expect(sphere2.center) as any).toEqualVector3(sphere1.center);
      expect(sphere2.radius).toBe(sphere1.radius);
      expect(result).toBe(sphere2);
    });
  });

  describe('isEmpty和makeEmpty方法', () => {
    test('isEmpty应该正确识别空球', () => {
      const emptySphere = new Sphere();
      expect(emptySphere.isEmpty()).toBe(true);

      const validSphere = new Sphere(new Vector3(0, 0, 0), 1);
      expect(validSphere.isEmpty()).toBe(false);
    });

    test('isEmpty应该识别负半径的球为空', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), -5);
      expect(sphere.isEmpty()).toBe(true);
    });

    test('makeEmpty应该重置球为空', () => {
      const sphere = new Sphere(new Vector3(1, 2, 3), 5);

      const result = sphere.makeEmpty();

      (expect(sphere.center) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      expect(sphere.radius).toBe(-1);
      expect(sphere.isEmpty()).toBe(true);
      expect(result).toBe(sphere);
    });
  });

  describe('containsPoint方法', () => {
    test('应该检测球内的点', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 2);

      expect(sphere.containsPoint(new Vector3(0, 0, 0))).toBe(true);
      expect(sphere.containsPoint(new Vector3(1, 0, 0))).toBe(true);
      expect(sphere.containsPoint(new Vector3(0, 1, 0))).toBe(true);
      expect(sphere.containsPoint(new Vector3(0, 0, 1))).toBe(true);
    });

    test('应该检测球面上的点', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);

      expect(sphere.containsPoint(new Vector3(1, 0, 0))).toBe(true);
      expect(sphere.containsPoint(new Vector3(0, 1, 0))).toBe(true);
      expect(sphere.containsPoint(new Vector3(0, 0, 1))).toBe(true);
    });

    test('应该检测球外的点', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);

      expect(sphere.containsPoint(new Vector3(2, 0, 0))).toBe(false);
      expect(sphere.containsPoint(new Vector3(0, 2, 0))).toBe(false);
      expect(sphere.containsPoint(new Vector3(0, 0, 2))).toBe(false);
    });

    test('应该处理非原点中心的球', () => {
      const sphere = new Sphere(new Vector3(5, 5, 5), 1);

      expect(sphere.containsPoint(new Vector3(5, 5, 5))).toBe(true);
      expect(sphere.containsPoint(new Vector3(5.5, 5.5, 5.5))).toBe(true);
      expect(sphere.containsPoint(new Vector3(0, 0, 0))).toBe(false);
    });
  });

  describe('distanceToPoint方法', () => {
    test('应该计算球心到点的距离减去半径', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);

      expect(sphere.distanceToPoint(new Vector3(2, 0, 0))).toBe(1);
      expect(sphere.distanceToPoint(new Vector3(0, 0, 0))).toBe(-1);
    });

    test('应该返回球面上点的距离为0', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);

      expect(sphere.distanceToPoint(new Vector3(1, 0, 0))).toBe(0);
    });

    test('应该返回球内点的负距离', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 2);

      expect(sphere.distanceToPoint(new Vector3(0.5, 0, 0))).toBe(-1.5);
    });
  });

  describe('intersectsSphere方法', () => {
    test('应该检测相交的球', () => {
      const sphere1 = new Sphere(new Vector3(0, 0, 0), 2);
      const sphere2 = new Sphere(new Vector3(3, 0, 0), 2);

      expect(sphere1.intersectsSphere(sphere2)).toBe(true);
      expect(sphere2.intersectsSphere(sphere1)).toBe(true);
    });

    test('应该检测不相交的球', () => {
      const sphere1 = new Sphere(new Vector3(0, 0, 0), 1);
      const sphere2 = new Sphere(new Vector3(5, 0, 0), 1);

      expect(sphere1.intersectsSphere(sphere2)).toBe(false);
      expect(sphere2.intersectsSphere(sphere1)).toBe(false);
    });

    test('应该检测相切的球', () => {
      const sphere1 = new Sphere(new Vector3(0, 0, 0), 1);
      const sphere2 = new Sphere(new Vector3(2, 0, 0), 1);

      expect(sphere1.intersectsSphere(sphere2)).toBe(true);
    });

    test('应该检测包含的球', () => {
      const sphere1 = new Sphere(new Vector3(0, 0, 0), 5);
      const sphere2 = new Sphere(new Vector3(0, 0, 0), 1);

      expect(sphere1.intersectsSphere(sphere2)).toBe(true);
      expect(sphere2.intersectsSphere(sphere1)).toBe(true);
    });
  });

  describe('intersectsBox方法', () => {
    test('应该检测与包围盒的相交', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 2);
      const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

      expect(sphere.intersectsBox(box)).toBe(true);
    });

    test('应该检测不相交的包围盒', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);
      const box = new Box3(new Vector3(5, 5, 5), new Vector3(6, 6, 6));

      expect(sphere.intersectsBox(box)).toBe(false);
    });
  });

  describe('clampPoint方法', () => {
    test('应该保持球内的点不变', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 2);
      const point = new Vector3(0.5, 0.5, 0.5);
      const target = new Vector3();

      const result = sphere.clampPoint(point, target);

      expect(result).toBe(target);
      (expect(target) as any).toEqualVector3(point);
    });

    test('应该将球外的点限制到球面', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);
      const point = new Vector3(3, 0, 0);
      const clamped = sphere.clampPoint(point);

      expect(clamped.x).toBeCloseTo(1, 5);
      expect(clamped.y).toBeCloseTo(0, 5);
      expect(clamped.z).toBeCloseTo(0, 5);
    });

    test('应该返回新的Vector3如果没有提供target', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);
      const point = new Vector3(0.5, 0, 0);

      const result = sphere.clampPoint(point);

      expect(result).not.toBe(point);
    });
  });

  describe('getBoundingBox方法', () => {
    test('应该返回球的包围盒', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);
      const box = new Box3();

      const result = sphere.getBoundingBox(box);

      expect(result).toBe(box);
      (expect(box.min) as any).toEqualVector3({ x: -1, y: -1, z: -1 });
      (expect(box.max) as any).toEqualVector3({ x: 1, y: 1, z: 1 });
    });

    test('应该处理非原点中心的球', () => {
      const sphere = new Sphere(new Vector3(5, 10, 15), 2);
      const box = new Box3();

      sphere.getBoundingBox(box);

      (expect(box.min) as any).toEqualVector3({ x: 3, y: 8, z: 13 });
      (expect(box.max) as any).toEqualVector3({ x: 7, y: 12, z: 17 });
    });

    test('应该处理空球', () => {
      const emptySphere = new Sphere();
      const box = new Box3();

      emptySphere.getBoundingBox(box);

      expect(box.isEmpty()).toBe(true);
    });
  });

  describe('applyMatrix4方法', () => {
    test('应该应用变换矩阵', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);
      const matrix = new Matrix4().compose(new Vector3(1, 2, 3), new Quaternion(0, 0, 0, 1), new Vector3(1, 1, 1));

      const result = sphere.applyMatrix4(matrix);

      expect(result).toBe(sphere);
      (expect(sphere.center) as any).toEqualVector3({ x: 1, y: 2, z: 3 });
      expect(sphere.radius).toBe(1);
    });

    test('应该应用缩放变换', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);
      const matrix = new Matrix4().compose(new Vector3(0, 0, 0), new Quaternion(0, 0, 0, 1), new Vector3(2, 2, 2));

      sphere.applyMatrix4(matrix);

      expect(sphere.radius).toBe(2);
    });

    test('应该处理非均匀缩放', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);
      const matrix = new Matrix4().compose(new Vector3(0, 0, 0), new Quaternion(0, 0, 0, 1), new Vector3(2, 3, 4));

      sphere.applyMatrix4(matrix);

      // 半径应该是最大缩放因子
      expect(sphere.radius).toBeCloseTo(4, 5);
    });
  });

  describe('translate方法', () => {
    test('应该平移球', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);
      const offset = new Vector3(1, 2, 3);

      const result = sphere.translate(offset);

      expect(result).toBe(sphere);
      (expect(sphere.center) as any).toEqualVector3({ x: 1, y: 2, z: 3 });
      expect(sphere.radius).toBe(1);
    });
  });

  describe('expandByPoint方法', () => {
    test('应该扩展球以包含点', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1);
      const point = new Vector3(3, 0, 0);

      const result = sphere.expandByPoint(point);

      expect(result).toBe(sphere);
      expect(sphere.radius).toBeGreaterThan(1);
      expect(sphere.containsPoint(point)).toBe(true);
    });

    test('不应该缩小球', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 5);
      const point = new Vector3(1, 0, 0);

      sphere.expandByPoint(point);

      expect(sphere.radius).toBe(5);
    });

    test('应该处理球内的点', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 2);
      const point = new Vector3(0.5, 0.5, 0.5);

      sphere.expandByPoint(point);

      expect(sphere.radius).toBe(2);
    });
  });

  describe('union方法', () => {
    test('应该计算两个球的并集', () => {
      const sphere1 = new Sphere(new Vector3(0, 0, 0), 1);
      const sphere2 = new Sphere(new Vector3(3, 0, 0), 1);

      const result = sphere1.union(sphere2);

      expect(result).toBe(sphere1);
      expect(sphere1.containsPoint(new Vector3(0, 0, 0))).toBe(true);
      expect(sphere1.containsPoint(new Vector3(3, 0, 0))).toBe(true);
    });

    test('应该处理包含关系', () => {
      const sphere1 = new Sphere(new Vector3(0, 0, 0), 5);
      const sphere2 = new Sphere(new Vector3(0, 0, 0), 1);

      sphere1.union(sphere2);

      expect(sphere1.radius).toBe(5);
    });

    test('应该处理被包含的情况', () => {
      const sphere1 = new Sphere(new Vector3(0, 0, 0), 1);
      const sphere2 = new Sphere(new Vector3(0, 0, 0), 5);

      sphere1.union(sphere2);

      expect(sphere1.radius).toBe(5);
    });

    test('应该处理空球', () => {
      const sphere1 = new Sphere();
      const sphere2 = new Sphere(new Vector3(0, 0, 0), 1);

      sphere1.union(sphere2);

      (expect(sphere1.center) as any).toEqualVector3(sphere2.center);
      expect(sphere1.radius).toBe(sphere2.radius);
    });

    test('应该处理并入空球', () => {
      const sphere1 = new Sphere(new Vector3(0, 0, 0), 1);
      const sphere2 = new Sphere();

      sphere1.union(sphere2);

      expect(sphere1.radius).toBe(1);
    });
  });

  describe('intersect方法', () => {
    test('应该计算两个球的交集', () => {
      const sphere1 = new Sphere(new Vector3(0, 0, 0), 2);
      const sphere2 = new Sphere(new Vector3(2, 0, 0), 2);

      const result = sphere1.intersect(sphere2);

      expect(result).toBe(sphere1);
      expect(sphere1.isEmpty()).toBe(false);
    });

    test('应该处理不相交的球', () => {
      const sphere1 = new Sphere(new Vector3(0, 0, 0), 1);
      const sphere2 = new Sphere(new Vector3(10, 0, 0), 1);

      sphere1.intersect(sphere2);

      expect(sphere1.isEmpty()).toBe(true);
    });
  });

  describe('equals方法', () => {
    test('应该检测相等的球', () => {
      const sphere1 = new Sphere(new Vector3(1, 2, 3), 5);
      const sphere2 = new Sphere(new Vector3(1, 2, 3), 5);

      expect(sphere1.equals(sphere2)).toBe(true);
    });

    test('应该检测不相等的球（中心不同）', () => {
      const sphere1 = new Sphere(new Vector3(1, 2, 3), 5);
      const sphere2 = new Sphere(new Vector3(1, 2, 4), 5);

      expect(sphere1.equals(sphere2)).toBe(false);
    });

    test('应该检测不相等的球（半径不同）', () => {
      const sphere1 = new Sphere(new Vector3(1, 2, 3), 5);
      const sphere2 = new Sphere(new Vector3(1, 2, 3), 6);

      expect(sphere1.equals(sphere2)).toBe(false);
    });
  });

  describe('clone方法', () => {
    test('应该克隆球', () => {
      const original = new Sphere(new Vector3(1, 2, 3), 5);
      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.center).not.toBe(original.center);
      expect(cloned.equals(original)).toBe(true);
    });
  });

  describe('边界情况测试', () => {
    test('应该处理零半径的球', () => {
      const sphere = new Sphere(new Vector3(5, 5, 5), 0);

      expect(sphere.isEmpty()).toBe(false);
      expect(sphere.containsPoint(new Vector3(5, 5, 5))).toBe(true);
      expect(sphere.containsPoint(new Vector3(5.1, 5, 5))).toBe(false);
    });

    test('应该处理负半径的球', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), -5);

      expect(sphere.isEmpty()).toBe(true);
    });

    test('应该处理非常大的球', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1e10);

      expect(sphere.isEmpty()).toBe(false);
      expect(sphere.containsPoint(new Vector3(1e9, 0, 0))).toBe(true);
    });

    test('应该处理非常小的球', () => {
      const sphere = new Sphere(new Vector3(0, 0, 0), 1e-10);

      expect(sphere.isEmpty()).toBe(false);
      expect(sphere.radius).toBe(1e-10);
    });
  });
});
