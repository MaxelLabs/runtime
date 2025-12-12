/**
 * Ray 测试套件
 * 目标：测试覆盖率 95%+
 */

import '../setup'; // 确保导入 setup 来加载自定义匹配器
import { Ray } from '../../src/core/ray';
import { Vector3 } from '../../src/core/vector3';
import { Matrix4 } from '../../src/core/matrix4';
import { Box3 } from '../../src/core/box3';
import { Sphere } from '../../src/core/sphere';
import { performanceTest } from '../setup';
import { expect } from '@jest/globals';

// Mock Plane interface for testing
interface MockPlane {
  normal: Vector3;
  distance: number;
}

// Mock Triangle interface for testing
interface MockTriangle {
  p0: Vector3;
  p1: Vector3;
  p2: Vector3;
}

describe('Ray', () => {
  describe('构造函数和基础属性', () => {
    test('应该创建默认射线', () => {
      const ray = new Ray();

      (expect(ray.origin) as any).toEqualVector3(Vector3.ZERO);
      (expect(ray.direction) as any).toEqualVector3(Vector3.X);
      expect(ray.direction.getLength()).toBe(1); // 方向应该是单位向量
    });

    test('应该根据参数创建射线', () => {
      const origin = new Vector3(1, 2, 3);
      const direction = new Vector3(0, 0, 1);
      const ray = new Ray(origin, direction);

      (expect(ray.origin) as any).toEqualVector3(origin);
      (expect(ray.direction) as any).toEqualVector3(direction.normalize());
    });

    test('应该正确设置和获取属性', () => {
      const ray = new Ray();
      ray.origin.set(1, 2, 3);
      ray.direction.set(0, 1, 0);
      ray.direction.normalize();

      expect(ray.origin.x).toBe(1);
      expect(ray.origin.y).toBe(2);
      expect(ray.origin.z).toBe(3);
      expect(ray.direction.getLength()).toBe(1);
    });
  });

  describe('set 方法', () => {
    test('应该正确设置射线', () => {
      const ray = new Ray();
      const origin = new Vector3(5, 6, 7);
      const direction = new Vector3(1, 1, 1);
      const result = ray.set(origin, direction);

      (expect(ray.origin) as any).toEqualVector3(origin);
      (expect(ray.direction) as any).toEqualVector3(direction.normalize());
      expect(result).toBe(ray); // 链式调用
    });
  });

  describe('拷贝和克隆方法', () => {
    test('clone() 应该创建射线副本', () => {
      const ray1 = new Ray(new Vector3(1, 2, 3), new Vector3(0, 1, 0));
      const ray2 = ray1.clone();

      (expect(ray2.origin) as any).toEqualVector3(ray1.origin);
      (expect(ray2.direction) as any).toEqualVector3(ray1.direction);
      expect(ray2).not.toBe(ray1); // 不同的实例
    });

    test('copyFrom() 应该拷贝射线', () => {
      const ray1 = new Ray(new Vector3(1, 2, 3), new Vector3(0, 1, 0));
      const ray2 = new Ray();
      const result = ray2.copyFrom(ray1);

      (expect(ray2.origin) as any).toEqualVector3(ray1.origin);
      (expect(ray2.direction) as any).toEqualVector3(ray1.direction);
      expect(result).toBe(ray2); // 链式调用
    });
  });

  describe('射线计算方法', () => {
    test('at() 应该计算射线上的点', () => {
      const ray = new Ray(new Vector3(0, 0, 0), new Vector3(1, 0, 0));
      const point1 = ray.at(5);
      const point2 = ray.at(0);
      const point3 = ray.at(-2);

      (expect(point1) as any).toEqualVector3({ x: 5, y: 0, z: 0 });
      (expect(point2) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      (expect(point3) as any).toEqualVector3({ x: -2, y: 0, z: 0 });

      // 测试使用 out 参数
      const out = new Vector3();
      const result = ray.at(3, out);
      (expect(out) as any).toEqualVector3({ x: 3, y: 0, z: 0 });
      expect(result).toBe(out);
    });

    test('recast() 应该重新投射射线', () => {
      const ray = new Ray(new Vector3(0, 0, 0), new Vector3(1, 1, 0));
      ray.direction.normalize();
      const result = ray.recast(Math.sqrt(2));

      // 直接检查值
      expect(ray.origin.x).toBeCloseTo(1, 5);
      expect(ray.origin.y).toBeCloseTo(1, 5);
      expect(ray.origin.z).toBeCloseTo(0, 5);
      expect(result).toBe(ray); // 链式调用
    });

    test('equals() 应该比较射线相等', () => {
      const ray1 = new Ray(new Vector3(1, 2, 3), new Vector3(0, 1, 0));
      const ray2 = new Ray(new Vector3(1, 2, 3), new Vector3(0, 1, 0));
      const ray3 = new Ray(new Vector3(1, 2, 3), new Vector3(0, 0, 1));

      expect(ray1.equals(ray2)).toBe(true);
      expect(ray1.equals(ray3)).toBe(false);
    });
  });

  describe('applyMatrix() 变换方法', () => {
    test('应该正确应用变换矩阵', () => {
      const ray = new Ray(new Vector3(1, 0, 0), new Vector3(1, 0, 0));
      const matrix = Matrix4.makeTranslation(0, 2, 0);
      const result = ray.applyMatrix(matrix);

      (expect(ray.origin) as any).toEqualVector3({ x: 1, y: 2, z: 0 });
      (expect(ray.direction) as any).toEqualVector3({ x: 1, y: 0, z: 0 });
      expect(result).toBe(ray);
    });

    test('应该正确处理旋转', () => {
      const ray = new Ray(Vector3.ZERO, new Vector3(1, 0, 0));
      const matrix = Matrix4.makeRotationZ(Math.PI / 2);
      ray.applyMatrix(matrix);

      (expect(ray.origin) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      (expect(ray.direction) as any).toEqualVector3({ x: 0, y: 1, z: 0 });
    });
  });

  describe('intersectBox() 包围盒相交', () => {
    test('应该检测与包围盒的相交', () => {
      const ray = new Ray(new Vector3(-5, 0.5, 0.5), new Vector3(1, 0, 0));
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const intersection = ray.intersectBox(box);

      expect(intersection).toBeDefined();
      (expect(intersection) as any).toEqualVector3({ x: 0, y: 0.5, z: 0.5 });
    });

    test('应该检测与包围盒的相交（从内部）', () => {
      const ray = new Ray(new Vector3(0.5, 0.5, 0.5), new Vector3(1, 0, 0));
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const intersection = ray.intersectBox(box);

      expect(intersection).toBeDefined();
      // When ray starts inside, returns exit point (tmax)
      (expect(intersection) as any).toEqualVector3({ x: 1, y: 0.5, z: 0.5 });
    });

    test('应该返回 undefined 如果不相交', () => {
      const ray = new Ray(new Vector3(-5, 1.5, 0.5), new Vector3(1, 0, 0));
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const intersection = ray.intersectBox(box);

      expect(intersection).toBeUndefined();
    });

    test('应该返回 undefined 如果射线背离盒子', () => {
      const ray = new Ray(new Vector3(-5, 0.5, 0.5), new Vector3(-1, 0, 0));
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const intersection = ray.intersectBox(box);

      expect(intersection).toBeUndefined();
    });

    test('应该使用 out 参数', () => {
      const ray = new Ray(new Vector3(-5, 0.5, 0.5), new Vector3(1, 0, 0));
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
      const out = new Vector3();
      const result = ray.intersectBox(box, out);

      expect(result).toBe(out);
      (expect(out) as any).toEqualVector3({ x: 0, y: 0.5, z: 0.5 });
    });
  });

  describe('intersectSphere() 球体相交', () => {
    test('应该检测与球体的相交（外部）', () => {
      const ray = new Ray(new Vector3(-5, 0, 0), new Vector3(1, 0, 0));
      const sphere = new Sphere(new Vector3(0, 0, 0), 2);
      const intersection = ray.intersectSphere(sphere);

      expect(intersection).toBeDefined();
      expect(intersection!.x).toBeCloseTo(-2, 1);
      expect(intersection!.y).toBeCloseTo(0, 1);
      expect(intersection!.z).toBeCloseTo(0, 1);
    });

    test('应该检测与球体的相交（内部）', () => {
      const ray = new Ray(new Vector3(0, 0, 0), new Vector3(1, 0, 0));
      const sphere = new Sphere(new Vector3(0, 0, 0), 2);
      const intersection = ray.intersectSphere(sphere);

      expect(intersection).toBeDefined();
      expect(intersection!.x).toBeCloseTo(2, 1);
    });

    test('应该返回 undefined 如果不相交', () => {
      const ray = new Ray(new Vector3(-5, 3, 0), new Vector3(1, 0, 0));
      const sphere = new Sphere(new Vector3(0, 0, 0), 2);
      const intersection = ray.intersectSphere(sphere);

      expect(intersection).toBeUndefined();
    });

    test('应该返回 undefined 如果射线背离球体', () => {
      const ray = new Ray(new Vector3(-5, 0, 0), new Vector3(-1, 0, 0));
      const sphere = new Sphere(new Vector3(0, 0, 0), 2);
      const intersection = ray.intersectSphere(sphere);

      expect(intersection).toBeUndefined();
    });
  });

  describe('intersectPlane() 平面相交', () => {
    test('应该检测与平面的相交', () => {
      const ray = new Ray(new Vector3(0, 0, -5), new Vector3(0, 0, 1));
      const plane: MockPlane = { normal: new Vector3(0, 0, 1), distance: 0 }; // XY 平面
      const intersection = ray.intersectPlane(plane);

      expect(intersection).toBeDefined();
      (expect(intersection) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
    });

    test('应该检测与倾斜平面的相交', () => {
      const ray = new Ray(Vector3.ZERO, new Vector3(0, 1, 0));
      const plane: MockPlane = { normal: new Vector3(0, 1, 0), distance: -2 }; // Y = 2 的平面
      const intersection = ray.intersectPlane(plane);

      expect(intersection).toBeDefined();
      (expect(intersection) as any).toEqualVector3({ x: 0, y: 2, z: 0 });
    });

    test('应该返回 undefined 如果平行且不重合', () => {
      const ray = new Ray(Vector3.ZERO, new Vector3(1, 0, 0));
      const plane: MockPlane = { normal: new Vector3(0, 1, 0), distance: 1 }; // Y = -1 的平面
      const intersection = ray.intersectPlane(plane);

      expect(intersection).toBeUndefined();
    });

    test('应该返回原点如果射线在平面上', () => {
      const ray = new Ray(new Vector3(1, 0, 0), new Vector3(1, 0, 0));
      const plane: MockPlane = { normal: new Vector3(0, 1, 0), distance: 0 }; // XY 平面
      const intersection = ray.intersectPlane(plane);

      expect(intersection).toBeDefined();
      (expect(intersection) as any).toEqualVector3({ x: 1, y: 0, z: 0 });
    });

    test('应该返回 undefined 如果相交点在射线反向', () => {
      const ray = new Ray(new Vector3(0, 0, 5), new Vector3(0, 0, 1));
      const plane: MockPlane = { normal: new Vector3(0, 0, 1), distance: 0 };
      const intersection = ray.intersectPlane(plane);

      expect(intersection).toBeUndefined();
    });
  });

  describe('intersectTriangle() 三角形相交', () => {
    test('应该检测与三角形的相交', () => {
      const ray = new Ray(new Vector3(0.5, 0.5, -1), new Vector3(0, 0, 1));
      const triangle: MockTriangle = {
        p0: new Vector3(0, 0, 0),
        p1: new Vector3(1, 0, 0),
        p2: new Vector3(0, 1, 0),
      };
      const intersection = ray.intersectTriangle(triangle);

      expect(intersection).toBeDefined();
      expect(intersection!.z).toBeCloseTo(0, 1);
    });

    test('应该检测与三角形的相交（使用 out 参数）', () => {
      const ray = new Ray(new Vector3(0.2, 0.2, -1), new Vector3(0, 0, 1));
      const triangle: MockTriangle = {
        p0: new Vector3(0, 0, 0),
        p1: new Vector3(1, 0, 0),
        p2: new Vector3(0, 1, 0),
      };
      const out = new Vector3();
      const result = ray.intersectTriangle(triangle, false, out);

      expect(result).toBe(out);
      expect(out.z).toBeCloseTo(0, 1);
    });

    test('应该支持背面剔除', () => {
      const ray = new Ray(new Vector3(0.5, 0.5, 1), new Vector3(0, 0, -1));
      const triangle: MockTriangle = {
        p0: new Vector3(0, 0, 0),
        p1: new Vector3(1, 0, 0),
        p2: new Vector3(0, 1, 0),
      };
      const intersection = ray.intersectTriangle(triangle, true);

      expect(intersection).toBeUndefined();
    });

    test('应该返回 undefined 如果不相交', () => {
      const ray = new Ray(new Vector3(1.5, 1.5, -1), new Vector3(0, 0, 1));
      const triangle: MockTriangle = {
        p0: new Vector3(0, 0, 0),
        p1: new Vector3(1, 0, 0),
        p2: new Vector3(0, 1, 0),
      };
      const intersection = ray.intersectTriangle(triangle);

      expect(intersection).toBeUndefined();
    });
  });

  describe('边界情况和错误处理', () => {
    test('应该处理零长度方向向量', () => {
      const ray = new Ray(Vector3.ZERO, new Vector3(0, 0, 0));
      expect(ray.direction.x).toBe(1); // 应该保持为 X 轴
      expect(ray.direction.y).toBe(0);
      expect(ray.direction.z).toBe(0);
    });

    test('应该处理非单位方向向量', () => {
      const ray = new Ray(Vector3.ZERO, new Vector3(2, 0, 0));
      expect(ray.direction.getLength()).toBe(1);
      expect(ray.direction.x).toBe(1);
    });

    test('应该处理与空包围盒的相交', () => {
      const ray = new Ray(Vector3.ZERO, new Vector3(1, 0, 0));
      const emptyBox = new Box3(new Vector3(1, 1, 1), new Vector3(0, 0, 0)); // 无效包围盒

      // 应该返回 undefined，因为包围盒是无效的
      const intersection = ray.intersectBox(emptyBox);
      expect(intersection).toBeUndefined();
    });

    test('应该处理与半径为0的球体相交', () => {
      const ray = new Ray(new Vector3(-1, 0, 0), new Vector3(1, 0, 0));
      const pointSphere = new Sphere(new Vector3(0, 0, 0), 0);
      const intersection = ray.intersectSphere(pointSphere);

      expect(intersection).toBeDefined();
      (expect(intersection) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
    });

    test('应该处理退化三角形', () => {
      const ray = new Ray(Vector3.ZERO, new Vector3(0, 0, 1));
      const degenerateTriangle: MockTriangle = {
        p0: new Vector3(0, 0, 1),
        p1: new Vector3(0, 0, 1),
        p2: new Vector3(0, 0, 1),
      };
      const intersection = ray.intersectTriangle(degenerateTriangle);

      expect(intersection).toBeUndefined();
    });
  });

  describe('性能测试', () => {
    test('批量射线相交测试性能', () => {
      const ray = new Ray(new Vector3(-5, 0, 0), new Vector3(1, 0, 0));
      const sphere = new Sphere(new Vector3(0, 0, 0), 2);

      performanceTest(
        '射线-球体相交',
        () => {
          ray.intersectSphere(sphere);
        },
        10000
      );
    });

    test('射线变换性能', () => {
      const ray = new Ray(new Vector3(1, 2, 3), new Vector3(1, 0, 0));
      const matrix = Matrix4.makeRotationY(Math.PI / 4);

      performanceTest(
        '射线变换',
        () => {
          ray.applyMatrix(matrix);
          ray.set(new Vector3(1, 2, 3), new Vector3(1, 0, 0));
        },
        5000
      );
    });

    test('包围盒相交性能', () => {
      const ray = new Ray(new Vector3(-5, 0.5, 0.5), new Vector3(1, 0, 0));
      const box = new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 1));

      performanceTest(
        '射线-包围盒相交',
        () => {
          ray.intersectBox(box);
        },
        10000
      );
    });
  });

  describe('复杂场景测试', () => {
    test('应该正确处理射线通过多个包围盒', () => {
      const ray = new Ray(new Vector3(-10, 0.5, 0.5), new Vector3(1, 0, 0));
      const boxes = [
        new Box3(new Vector3(-5, 0, 0), new Vector3(-3, 1, 1)),
        new Box3(new Vector3(-2, 0, 0), new Vector3(0, 1, 1)),
        new Box3(new Vector3(1, 0, 0), new Vector3(3, 1, 1)),
      ];

      const intersections = boxes.map((box) => ray.intersectBox(box)).filter(Boolean);

      expect(intersections).toHaveLength(3); // 射线沿 +X 方向，会击中所有3个盒子
    });

    test('应该正确处理射线与对齐的多个平面', () => {
      const ray = new Ray(new Vector3(0, 0, -10), new Vector3(0, 0, 1));
      const planes: MockPlane[] = [
        { normal: new Vector3(0, 0, 1), distance: 5 }, // z = -5
        { normal: new Vector3(0, 0, 1), distance: 0 }, // z = 0
        { normal: new Vector3(0, 0, 1), distance: -5 }, // z = 5
      ];

      const intersections = planes.map((plane) => ray.intersectPlane(plane));

      (expect(intersections[0]) as any).toEqualVector3({ x: 0, y: 0, z: -5 });
      (expect(intersections[1]) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      (expect(intersections[2]) as any).toEqualVector3({ x: 0, y: 0, z: 5 });
    });
  });
});
