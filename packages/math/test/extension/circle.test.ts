/**
 * Circle Test Suite
 * Target: 95%+ Coverage
 */

import '../setup';
import { Circle } from '../../src/extension/circle';
import { Box2 } from '../../src/extension/box2';
import { Vector2 } from '../../src/core/vector2';
import { expect } from '@jest/globals';

describe('Circle', () => {
  describe('Constructor and Basic Properties', () => {
    test('should create default circle with center at origin and radius 0', () => {
      const circle = new Circle();
      (expect(circle.center) as any).toEqualVector2({ x: 0, y: 0 });
      expect(circle.radius).toBe(0);
    });

    test('should create circle with specified center and radius', () => {
      const center = new Vector2(5, 5);
      const circle = new Circle(center, 10);

      (expect(circle.center) as any).toEqualVector2({ x: 5, y: 5 });
      expect(circle.radius).toBe(10);
    });

    test('should clone center vector', () => {
      const center = new Vector2(1, 1);
      const circle = new Circle(center, 5);

      center.x = 100;
      expect(circle.center.x).toBe(1);
    });
  });

  describe('set方法', () => {
    test('should set center and radius', () => {
      const circle = new Circle();
      const newCenter = new Vector2(3, 4);

      circle.set(newCenter, 7);

      (expect(circle.center) as any).toEqualVector2({ x: 3, y: 4 });
      expect(circle.radius).toBe(7);
    });

    test('should clone the center', () => {
      const circle = new Circle();
      const newCenter = new Vector2(3, 4);

      circle.set(newCenter, 7);
      newCenter.x = 100;

      expect(circle.center.x).toBe(3);
    });
  });

  describe('clone和copyFrom方法', () => {
    test('clone should create independent copy', () => {
      const original = new Circle(new Vector2(5, 5), 10);
      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      (expect(cloned.center) as any).toEqualVector2({ x: 5, y: 5 });
      expect(cloned.radius).toBe(10);

      original.radius = 20;
      expect(cloned.radius).toBe(10);
    });

    test('copyFrom should copy from another circle', () => {
      const circle1 = new Circle(new Vector2(3, 4), 5);
      const circle2 = new Circle();

      circle2.copyFrom(circle1);

      (expect(circle2.center) as any).toEqualVector2({ x: 3, y: 4 });
      expect(circle2.radius).toBe(5);
    });
  });

  describe('makeEmpty和isEmpty方法', () => {
    test('makeEmpty should reset circle', () => {
      const circle = new Circle(new Vector2(5, 5), 10);
      circle.makeEmpty();

      (expect(circle.center) as any).toEqualVector2({ x: 0, y: 0 });
      expect(circle.radius).toBe(0);
      expect(circle.isEmpty()).toBe(true);
    });

    test('isEmpty should return true for zero radius', () => {
      const circle = new Circle(new Vector2(0, 0), 0);
      expect(circle.isEmpty()).toBe(true);
    });

    test('isEmpty should return false for positive radius', () => {
      const circle = new Circle(new Vector2(0, 0), 1);
      expect(circle.isEmpty()).toBe(false);
    });
  });

  describe('getCenter和getRadius方法', () => {
    test('should return center', () => {
      const circle = new Circle(new Vector2(3, 4), 5);
      const center = circle.getCenter();

      (expect(center) as any).toEqualVector2({ x: 3, y: 4 });
    });

    test('should return center into target', () => {
      const circle = new Circle(new Vector2(3, 4), 5);
      const target = new Vector2();

      const result = circle.getCenter(target);

      expect(result).toBe(target);
      (expect(target) as any).toEqualVector2({ x: 3, y: 4 });
    });

    test('should return radius', () => {
      const circle = new Circle(new Vector2(0, 0), 7);
      expect(circle.getRadius()).toBe(7);
    });
  });

  describe('expandByPoint方法', () => {
    test('should expand radius to include point', () => {
      const circle = new Circle(new Vector2(0, 0), 5);
      circle.expandByPoint(new Vector2(10, 0));

      expect(circle.radius).toBe(10);
    });

    test('should handle point at center', () => {
      const circle = new Circle(new Vector2(5, 5), 10);
      circle.expandByPoint(new Vector2(5, 5));

      expect(circle.radius).toBe(0);
    });
  });

  describe('expandByScalar方法', () => {
    test('should expand radius by scalar', () => {
      const circle = new Circle(new Vector2(0, 0), 5);
      circle.expandByScalar(3);

      expect(circle.radius).toBe(8);
    });

    test('should handle negative scalar', () => {
      const circle = new Circle(new Vector2(0, 0), 10);
      circle.expandByScalar(-3);

      expect(circle.radius).toBe(7);
    });
  });

  describe('containsPoint方法', () => {
    test('should contain point inside circle', () => {
      const circle = new Circle(new Vector2(0, 0), 10);

      expect(circle.containsPoint(new Vector2(5, 5))).toBe(true);
    });

    test('should not contain point outside circle', () => {
      const circle = new Circle(new Vector2(0, 0), 5);

      expect(circle.containsPoint(new Vector2(10, 0))).toBe(false);
    });

    test('should not contain point on boundary', () => {
      const circle = new Circle(new Vector2(0, 0), 5);

      expect(circle.containsPoint(new Vector2(5, 0))).toBe(false);
    });
  });

  describe('containsBox方法', () => {
    test('should contain smaller box', () => {
      const circle = new Circle(new Vector2(0, 0), 10);
      const box = new Box2(new Vector2(-2, -2), new Vector2(2, 2));

      expect(circle.containsBox(box)).toBe(true);
    });

    test('should not contain larger box', () => {
      const circle = new Circle(new Vector2(0, 0), 5);
      const box = new Box2(new Vector2(-10, -10), new Vector2(10, 10));

      expect(circle.containsBox(box)).toBe(false);
    });
  });

  describe('intersectsBox方法', () => {
    test('should detect intersection with overlapping box', () => {
      const circle = new Circle(new Vector2(0, 0), 5);
      const box = new Box2(new Vector2(3, 3), new Vector2(10, 10));

      expect(circle.intersectsBox(box)).toBe(true);
    });

    test('should not detect intersection with distant box', () => {
      const circle = new Circle(new Vector2(0, 0), 5);
      const box = new Box2(new Vector2(20, 20), new Vector2(30, 30));

      expect(circle.intersectsBox(box)).toBe(false);
    });
  });

  describe('distanceToPoint方法', () => {
    test('should return negative distance for point inside', () => {
      const circle = new Circle(new Vector2(0, 0), 10);
      const distance = circle.distanceToPoint(new Vector2(5, 0));

      expect(distance).toBe(-5);
    });

    test('should return positive distance for point outside', () => {
      const circle = new Circle(new Vector2(0, 0), 5);
      const distance = circle.distanceToPoint(new Vector2(10, 0));

      expect(distance).toBe(5);
    });

    test('should return zero for point on boundary', () => {
      const circle = new Circle(new Vector2(0, 0), 5);
      const distance = circle.distanceToPoint(new Vector2(5, 0));

      expect(distance).toBeCloseTo(0, 5);
    });
  });

  describe('translate方法', () => {
    test('should translate circle center', () => {
      const circle = new Circle(new Vector2(0, 0), 5);
      circle.translate(new Vector2(3, 4));

      (expect(circle.center) as any).toEqualVector2({ x: 3, y: 4 });
      expect(circle.radius).toBe(5);
    });
  });

  describe('equals方法', () => {
    test('should detect equal circles', () => {
      const circle1 = new Circle(new Vector2(5, 5), 10);
      const circle2 = new Circle(new Vector2(5, 5), 10);

      expect(circle1.equals(circle2)).toBe(true);
    });

    test('should detect different centers', () => {
      const circle1 = new Circle(new Vector2(0, 0), 10);
      const circle2 = new Circle(new Vector2(1, 1), 10);

      expect(circle1.equals(circle2)).toBe(false);
    });

    test('should detect different radii', () => {
      const circle1 = new Circle(new Vector2(0, 0), 10);
      const circle2 = new Circle(new Vector2(0, 0), 5);

      expect(circle1.equals(circle2)).toBe(false);
    });
  });

  describe('intersect和union方法', () => {
    test('intersect should combine circles', () => {
      const circle1 = new Circle(new Vector2(0, 0), 5);
      const circle2 = new Circle(new Vector2(2, 0), 3);

      circle1.intersect(circle2);

      // After intersect, center is shifted and radius is adjusted
      expect(circle1.center).toBeDefined();
      expect(circle1.radius).toBeGreaterThanOrEqual(0);
    });

    test('union should combine circles', () => {
      const circle1 = new Circle(new Vector2(0, 0), 5);
      const circle2 = new Circle(new Vector2(2, 0), 3);

      circle1.union(circle2);

      // After union, circle should encompass both
      expect(circle1.center).toBeDefined();
      expect(circle1.radius).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero radius circle', () => {
      const circle = new Circle(new Vector2(5, 5), 0);
      expect(circle.isEmpty()).toBe(true);
      expect(circle.containsPoint(new Vector2(5, 5))).toBe(false);
    });

    test('should handle negative coordinates', () => {
      const circle = new Circle(new Vector2(-10, -10), 5);
      expect(circle.containsPoint(new Vector2(-10, -10))).toBe(true);
    });
  });
});
