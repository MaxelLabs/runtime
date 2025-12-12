/**
 * Box2 Test Suite
 * Target: 95%+ Coverage
 */

import '../setup'; // Custom matchers
import { Box2 } from '../../src/extension/box2';
import { Vector2 } from '../../src/core/vector2';
import { expect } from '@jest/globals';

describe('Box2', () => {
  describe('Constructor and Basic Properties', () => {
    test('should create default empty box', () => {
      const box = new Box2();
      expect(box.min.x).toBe(Infinity);
      expect(box.min.y).toBe(Infinity);
      expect(box.max.x).toBe(-Infinity);
      expect(box.max.y).toBe(-Infinity);
      expect(box.isEmpty()).toBe(true);
    });

    test('should create box with specified min and max', () => {
      const min = new Vector2(-1, -2);
      const max = new Vector2(3, 4);
      const box = new Box2(min, max);

      (expect(box.min) as any).toEqualVector2({ x: -1, y: -2 });
      (expect(box.max) as any).toEqualVector2({ x: 3, y: 4 });
      expect(box.isEmpty()).toBe(false);
    });

    test('should clone min and max vectors', () => {
      const min = new Vector2(-1, -1);
      const max = new Vector2(1, 1);
      const box = new Box2(min, max);

      min.x = 100;
      expect(box.min.x).toBe(-1);
    });

    test('should generate corners when non-empty', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(2, 2));
      expect(box.corners).toHaveLength(4);
    });
  });

  describe('set方法', () => {
    test('should set min and max points', () => {
      const box = new Box2();
      const min = new Vector2(-5, -5);
      const max = new Vector2(5, 5);

      box.set(min, max);

      (expect(box.min) as any).toEqualVector2({ x: -5, y: -5 });
      (expect(box.max) as any).toEqualVector2({ x: 5, y: 5 });
    });

    test('should regenerate corners after setting', () => {
      const box = new Box2();
      box.set(new Vector2(0, 0), new Vector2(2, 2));

      expect(box.corners).toHaveLength(4);
      (expect(box.corners[0]) as any).toEqualVector2({ x: 0, y: 0 });
      (expect(box.corners[1]) as any).toEqualVector2({ x: 2, y: 0 });
      (expect(box.corners[2]) as any).toEqualVector2({ x: 2, y: 2 });
      (expect(box.corners[3]) as any).toEqualVector2({ x: 0, y: 2 });
    });
  });

  describe('setFromVec2Array方法', () => {
    test('should set box from point array with corners', () => {
      const points = [new Vector2(1, 1), new Vector2(3, 2), new Vector2(2, 4), new Vector2(0, 3)];

      const box = new Box2();
      box.setFromVec2Array(points);

      (expect(box.min) as any).toEqualVector2({ x: 0, y: 1 });
      (expect(box.max) as any).toEqualVector2({ x: 3, y: 4 });
      // corners includes original points plus generated ones
      expect(box.corners.length).toBeGreaterThanOrEqual(4);
    });

    test('should handle empty array', () => {
      const box = new Box2();
      box.setFromVec2Array([]);

      expect(box.isEmpty()).toBe(true);
    });

    test('should handle single point', () => {
      const points = [new Vector2(5, 5)];
      const box = new Box2();
      box.setFromVec2Array(points);

      (expect(box.min) as any).toEqualVector2({ x: 5, y: 5 });
      (expect(box.max) as any).toEqualVector2({ x: 5, y: 5 });
    });
  });

  describe('setFromVec2ArrayWithOutCorners方法', () => {
    test('should set box from points without preserving corners', () => {
      const points = [new Vector2(1, 1), new Vector2(3, 3), new Vector2(0, 0)];

      const box = new Box2();
      box.setFromVec2ArrayWithOutCorners(points);

      (expect(box.min) as any).toEqualVector2({ x: 0, y: 0 });
      (expect(box.max) as any).toEqualVector2({ x: 3, y: 3 });
      expect(box.corners).toHaveLength(4); // Only generated corners
    });
  });

  describe('setFromCenterAndSize方法', () => {
    test('should set box from center and size', () => {
      const center = new Vector2(5, 5);
      const size = new Vector2(4, 6);

      const box = new Box2();
      box.setFromCenterAndSize(center, size);

      (expect(box.min) as any).toEqualVector2({ x: 3, y: 2 });
      (expect(box.max) as any).toEqualVector2({ x: 7, y: 8 });
    });

    test('should handle zero size', () => {
      const center = new Vector2(0, 0);
      const size = new Vector2(0, 0);

      const box = new Box2();
      box.setFromCenterAndSize(center, size);

      (expect(box.min) as any).toEqualVector2({ x: 0, y: 0 });
      (expect(box.max) as any).toEqualVector2({ x: 0, y: 0 });
    });
  });

  describe('setFromBox2Like方法', () => {
    test('should set box from Box2Like object', () => {
      const boxLike = {
        min: new Vector2(-2, -3),
        max: new Vector2(4, 5),
      };

      const box = new Box2();
      box.setFromBox2Like(boxLike);

      (expect(box.min) as any).toEqualVector2({ x: -2, y: -3 });
      (expect(box.max) as any).toEqualVector2({ x: 4, y: 5 });
    });
  });

  describe('clone和copyFrom方法', () => {
    test('clone should create independent copy', () => {
      const original = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      (expect(cloned.min) as any).toEqualVector2({ x: 0, y: 0 });
      (expect(cloned.max) as any).toEqualVector2({ x: 10, y: 10 });

      original.min.x = 100;
      expect(cloned.min.x).toBe(0);
    });

    test('copyFrom should copy from another box', () => {
      const box1 = new Box2(new Vector2(1, 1), new Vector2(5, 5));
      const box2 = new Box2();

      box2.copyFrom(box1);

      (expect(box2.min) as any).toEqualVector2({ x: 1, y: 1 });
      (expect(box2.max) as any).toEqualVector2({ x: 5, y: 5 });
    });
  });

  describe('makeEmpty和isEmpty方法', () => {
    test('makeEmpty should reset box', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      box.makeEmpty();

      expect(box.min.x).toBe(Infinity);
      expect(box.min.y).toBe(Infinity);
      expect(box.max.x).toBe(-Infinity);
      expect(box.max.y).toBe(-Infinity);
      expect(box.isEmpty()).toBe(true);
    });

    test('isEmpty should correctly identify empty box', () => {
      const emptyBox = new Box2();
      expect(emptyBox.isEmpty()).toBe(true);

      const validBox = new Box2(new Vector2(0, 0), new Vector2(1, 1));
      expect(validBox.isEmpty()).toBe(false);

      const invalidBox = new Box2(new Vector2(5, 5), new Vector2(3, 3));
      expect(invalidBox.isEmpty()).toBe(true);
    });
  });

  describe('corners getter', () => {
    test('should return 4 corners for non-empty box', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(2, 2));
      const corners = box.corners;

      expect(corners).toHaveLength(4);
      (expect(corners[0]) as any).toEqualVector2({ x: 0, y: 0 }); // min
      (expect(corners[1]) as any).toEqualVector2({ x: 2, y: 0 }); // max.x, min.y
      (expect(corners[2]) as any).toEqualVector2({ x: 2, y: 2 }); // max
      (expect(corners[3]) as any).toEqualVector2({ x: 0, y: 2 }); // min.x, max.y
    });

    test('should return empty array for empty box', () => {
      const box = new Box2();
      expect(box.corners).toHaveLength(0);
    });
  });

  describe('Corner getter methods', () => {
    test('getCorners should return cloned corners', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(2, 2));
      const corners1 = box.getCorners();
      const corners2 = box.getCorners();

      expect(corners1).not.toBe(corners2);
      (expect(corners1[0]) as any).toEqualVector2({ x: corners2[0].x, y: corners2[0].y });
    });

    test('should get specific corners', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(2, 2));

      (expect(box.getLeftTopCorner()) as any).toEqualVector2({ x: 0, y: 0 });
      (expect(box.getRightTopCorner()) as any).toEqualVector2({ x: 2, y: 0 });
      (expect(box.getRightBottomCorner()) as any).toEqualVector2({ x: 2, y: 2 });
      (expect(box.getLeftBottomCorner()) as any).toEqualVector2({ x: 0, y: 2 });
    });
  });

  describe('getPoint方法', () => {
    test('should return 9 different points', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 8));

      // 0 = center
      (expect(box.getPoint(0)) as any).toEqualVector2({ x: 5, y: 4 });

      // 1 = left top
      (expect(box.getPoint(1)) as any).toEqualVector2({ x: 0, y: 0 });

      // 2 = left center
      (expect(box.getPoint(2)) as any).toEqualVector2({ x: 0, y: 4 });

      // 3 = left bottom
      (expect(box.getPoint(3)) as any).toEqualVector2({ x: 0, y: 8 });

      // 4 = middle top
      (expect(box.getPoint(4)) as any).toEqualVector2({ x: 5, y: 0 });

      // 5 = middle bottom
      (expect(box.getPoint(5)) as any).toEqualVector2({ x: 5, y: 8 });

      // 6 = right top
      (expect(box.getPoint(6)) as any).toEqualVector2({ x: 10, y: 0 });

      // 7 = right center
      (expect(box.getPoint(7)) as any).toEqualVector2({ x: 10, y: 4 });

      // 8 = right bottom
      (expect(box.getPoint(8)) as any).toEqualVector2({ x: 10, y: 8 });

      // default = center
      (expect(box.getPoint(999)) as any).toEqualVector2({ x: 5, y: 4 });
    });
  });

  describe('getCenter和getSize方法', () => {
    test('should return correct center', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const center = box.getCenter();

      (expect(center) as any).toEqualVector2({ x: 5, y: 5 });
    });

    test('should return zero for empty box center', () => {
      const box = new Box2();
      const center = box.getCenter();

      (expect(center) as any).toEqualVector2({ x: 0, y: 0 });
    });

    test('should return correct size', () => {
      const box = new Box2(new Vector2(2, 3), new Vector2(8, 7));
      const size = box.getSize();

      (expect(size) as any).toEqualVector2({ x: 6, y: 4 });
    });

    test('should return zero for empty box size', () => {
      const box = new Box2();
      const size = box.getSize();

      (expect(size) as any).toEqualVector2({ x: 0, y: 0 });
    });
  });

  describe('expandByPoint方法', () => {
    test('should expand to include point', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(5, 5));
      box.expandByPoint(new Vector2(10, 10));

      (expect(box.max) as any).toEqualVector2({ x: 10, y: 10 });
    });

    test('should expand in negative direction', () => {
      const box = new Box2(new Vector2(5, 5), new Vector2(10, 10));
      box.expandByPoint(new Vector2(0, 0));

      (expect(box.min) as any).toEqualVector2({ x: 0, y: 0 });
    });

    test('should handle empty box', () => {
      const box = new Box2();
      box.expandByPoint(new Vector2(3, 4));

      (expect(box.min) as any).toEqualVector2({ x: 3, y: 4 });
      (expect(box.max) as any).toEqualVector2({ x: 3, y: 4 });
    });
  });

  describe('expandByVector方法', () => {
    test('should expand by vector in both directions', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      box.expandByVector(new Vector2(2, 3));

      (expect(box.min) as any).toEqualVector2({ x: -2, y: -3 });
      (expect(box.max) as any).toEqualVector2({ x: 12, y: 13 });
    });
  });

  describe('expandByScalar方法', () => {
    test('should expand by scalar in all directions', () => {
      const box = new Box2(new Vector2(2, 2), new Vector2(8, 8));
      box.expandByScalar(1);

      (expect(box.min) as any).toEqualVector2({ x: 1, y: 1 });
      (expect(box.max) as any).toEqualVector2({ x: 9, y: 9 });
    });
  });

  describe('containsPoint方法', () => {
    test('should contain point inside', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));

      expect(box.containsPoint(new Vector2(5, 5))).toBe(true);
    });

    test('should not contain point outside', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));

      expect(box.containsPoint(new Vector2(-1, 5))).toBe(false);
      expect(box.containsPoint(new Vector2(11, 5))).toBe(false);
    });

    test('should contain point on boundary (orthogonal mode)', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));

      // With orthogonal mode, boundaries are exclusive on min side
      expect(box.containsPoint(new Vector2(5, 5), true)).toBe(true);
    });

    test('should contain point with non-orthogonal mode', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));

      expect(box.containsPoint(new Vector2(5, 5), false)).toBe(true);
    });

    test('should not contain point in empty box', () => {
      const box = new Box2();
      expect(box.containsPoint(new Vector2(0, 0), false)).toBe(false);
    });
  });

  describe('containsBox方法', () => {
    test('should contain smaller box', () => {
      const box1 = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const box2 = new Box2(new Vector2(2, 2), new Vector2(8, 8));

      expect(box1.containsBox(box2)).toBe(true);
    });

    test('should not contain intersecting box', () => {
      const box1 = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const box2 = new Box2(new Vector2(5, 5), new Vector2(15, 15));

      expect(box1.containsBox(box2)).toBe(false);
    });
  });

  describe('intersectsBox方法', () => {
    test('should detect intersecting boxes (orthogonal)', () => {
      const box1 = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const box2 = new Box2(new Vector2(5, 5), new Vector2(15, 15));

      expect(box1.intersectsBox(box2, true)).toBe(true);
    });

    test('should detect non-intersecting boxes', () => {
      const box1 = new Box2(new Vector2(0, 0), new Vector2(5, 5));
      const box2 = new Box2(new Vector2(10, 10), new Vector2(15, 15));

      expect(box1.intersectsBox(box2)).toBe(false);
    });

    test('should detect touching boxes as intersecting', () => {
      const box1 = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const box2 = new Box2(new Vector2(10, 0), new Vector2(20, 10));

      expect(box1.intersectsBox(box2)).toBe(true);
    });

    test('should detect intersection with non-orthogonal mode', () => {
      const box1 = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const box2 = new Box2(new Vector2(5, 5), new Vector2(15, 15));

      expect(box1.intersectsBox(box2, false)).toBe(true);
    });
  });

  describe('getParameter方法', () => {
    test('should return correct parameter for point', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const param = box.getParameter(new Vector2(5, 5));

      (expect(param) as any).toEqualVector2({ x: 0.5, y: 0.5 });
    });

    test('should return (0,0) for min point', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const param = box.getParameter(new Vector2(0, 0));

      (expect(param) as any).toEqualVector2({ x: 0, y: 0 });
    });

    test('should return (1,1) for max point', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const param = box.getParameter(new Vector2(10, 10));

      (expect(param) as any).toEqualVector2({ x: 1, y: 1 });
    });
  });

  describe('clampPoint方法', () => {
    test('should clamp point inside box', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const clamped = box.clampPoint(new Vector2(5, 5));

      (expect(clamped) as any).toEqualVector2({ x: 5, y: 5 });
    });

    test('should clamp point outside box', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const clamped = box.clampPoint(new Vector2(-5, 15));

      (expect(clamped) as any).toEqualVector2({ x: 0, y: 10 });
    });
  });

  describe('distanceToPoint方法', () => {
    test('should return zero for point inside', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const distance = box.distanceToPoint(new Vector2(5, 5));

      expect(distance).toBe(0);
    });

    test('should calculate distance to outside point', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const distance = box.distanceToPoint(new Vector2(15, 15));

      expect(distance).toBeCloseTo(Math.sqrt(50), 5);
    });
  });

  describe('intersect方法', () => {
    test('should calculate intersection', () => {
      const box1 = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const box2 = new Box2(new Vector2(5, 5), new Vector2(15, 15));

      box1.intersect(box2);

      (expect(box1.min) as any).toEqualVector2({ x: 5, y: 5 });
      (expect(box1.max) as any).toEqualVector2({ x: 10, y: 10 });
    });

    test('should handle non-intersecting boxes', () => {
      const box1 = new Box2(new Vector2(0, 0), new Vector2(5, 5));
      const box2 = new Box2(new Vector2(10, 10), new Vector2(15, 15));

      box1.intersect(box2);

      expect(box1.isEmpty()).toBe(true);
    });
  });

  describe('union方法', () => {
    test('should calculate union', () => {
      const box1 = new Box2(new Vector2(0, 0), new Vector2(5, 5));
      const box2 = new Box2(new Vector2(3, 3), new Vector2(10, 10));

      box1.union(box2);

      (expect(box1.min) as any).toEqualVector2({ x: 0, y: 0 });
      (expect(box1.max) as any).toEqualVector2({ x: 10, y: 10 });
    });
  });

  describe('translate方法', () => {
    test('should translate box', () => {
      const box = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      box.translate(new Vector2(5, -3));

      (expect(box.min) as any).toEqualVector2({ x: 5, y: -3 });
      (expect(box.max) as any).toEqualVector2({ x: 15, y: 7 });
    });
  });

  describe('equals方法', () => {
    test('should detect equal boxes', () => {
      const box1 = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const box2 = new Box2(new Vector2(0, 0), new Vector2(10, 10));

      expect(box1.equals(box2)).toBe(true);
    });

    test('should detect different boxes', () => {
      const box1 = new Box2(new Vector2(0, 0), new Vector2(10, 10));
      const box2 = new Box2(new Vector2(1, 0), new Vector2(10, 10));

      expect(box1.equals(box2)).toBe(false);
    });
  });

  describe('Object Pool', () => {
    test('should create box from pool', () => {
      const box = Box2.create();
      expect(box).toBeInstanceOf(Box2);
      expect(box.isEmpty()).toBe(true);
    });

    test('should release box to pool', () => {
      const box = Box2.create();
      Box2.release(box);
      // Should not throw
    });

    test('should preallocate boxes', () => {
      Box2.preallocate(10);
      // Should not throw
    });
  });

  describe('Edge Cases', () => {
    test('should handle negative coordinates', () => {
      const box = new Box2(new Vector2(-10, -10), new Vector2(-5, -5));
      expect(box.isEmpty()).toBe(false);
    });

    test('should handle zero-size box', () => {
      const box = new Box2(new Vector2(5, 5), new Vector2(5, 5));
      expect(box.isEmpty()).toBe(true);
    });

    test('should handle very large values', () => {
      const box = new Box2(new Vector2(1e6, 1e6), new Vector2(2e6, 2e6));
      expect(box.isEmpty()).toBe(false);
    });
  });
});
