/**
 * Line2 Test Suite
 * Target: 95%+ Coverage
 */

import '../setup';
import { Line2 } from '../../src/extension/line2';
import { Vector2 } from '../../src/core/vector2';
import { expect } from '@jest/globals';

describe('Line2', () => {
  describe('Constructor and Basic Properties', () => {
    test('should create default line at origin', () => {
      const line = new Line2();
      (expect(line.start) as any).toEqualVector2({ x: 0, y: 0 });
      (expect(line.end) as any).toEqualVector2({ x: 0, y: 0 });
    });

    test('should create line with specified start and end', () => {
      const start = new Vector2(1, 2);
      const end = new Vector2(3, 4);
      const line = new Line2(start, end);

      (expect(line.start) as any).toEqualVector2({ x: 1, y: 2 });
      (expect(line.end) as any).toEqualVector2({ x: 3, y: 4 });
    });

    test('should clone start and end vectors', () => {
      const start = new Vector2(1, 1);
      const end = new Vector2(2, 2);
      const line = new Line2(start, end);

      start.x = 100;
      expect(line.start.x).toBe(1);
    });
  });

  describe('set方法', () => {
    test('should set start and end', () => {
      const line = new Line2();
      const start = new Vector2(0, 0);
      const end = new Vector2(10, 10);

      line.set(start, end);

      (expect(line.start) as any).toEqualVector2({ x: 0, y: 0 });
      (expect(line.end) as any).toEqualVector2({ x: 10, y: 10 });
    });
  });

  describe('copyFrom和clone方法', () => {
    test('copyFrom should copy from another line', () => {
      const line1 = new Line2(new Vector2(1, 2), new Vector2(3, 4));
      const line2 = new Line2();

      line2.copyFrom(line1);

      (expect(line2.start) as any).toEqualVector2({ x: 1, y: 2 });
      (expect(line2.end) as any).toEqualVector2({ x: 3, y: 4 });
    });

    test('clone should create independent copy', () => {
      const original = new Line2(new Vector2(1, 2), new Vector2(3, 4));
      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      (expect(cloned.start) as any).toEqualVector2({ x: 1, y: 2 });
      (expect(cloned.end) as any).toEqualVector2({ x: 3, y: 4 });

      original.start.x = 100;
      expect(cloned.start.x).toBe(1);
    });
  });

  describe('direction方法', () => {
    test('should return normalized direction', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(10, 0));
      const dir = line.direction();

      (expect(dir) as any).toEqualVector2({ x: 1, y: 0 });
    });

    test('should return correct diagonal direction', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(1, 1));
      const dir = line.direction();

      const expected = 1 / Math.sqrt(2);
      expect(dir.x).toBeCloseTo(expected, 5);
      expect(dir.y).toBeCloseTo(expected, 5);
    });
  });

  describe('getCenter方法', () => {
    test('should return midpoint', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(10, 10));
      const center = line.getCenter();

      (expect(center) as any).toEqualVector2({ x: 5, y: 5 });
    });

    test('should use target when provided', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(4, 6));
      const target = new Vector2();

      const result = line.getCenter(target);

      expect(result).toBe(target);
      (expect(target) as any).toEqualVector2({ x: 2, y: 3 });
    });
  });

  describe('delta方法', () => {
    test('should return difference vector', () => {
      const line = new Line2(new Vector2(1, 2), new Vector2(4, 6));
      const delta = line.delta();

      (expect(delta) as any).toEqualVector2({ x: 3, y: 4 });
    });

    test('should use target when provided', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(5, 5));
      const target = new Vector2();

      const result = line.delta(target);

      expect(result).toBe(target);
      (expect(target) as any).toEqualVector2({ x: 5, y: 5 });
    });
  });

  describe('distanceSq和distance方法', () => {
    test('distanceSq should return squared distance', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(3, 4));
      expect(line.distanceSq()).toBe(25);
    });

    test('distance should return euclidean distance', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(3, 4));
      expect(line.distance()).toBe(5);
    });
  });

  describe('length方法', () => {
    test('should return line length', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(3, 4));
      expect(line.length()).toBe(5);
    });

    test('should return 0 for zero-length line', () => {
      const line = new Line2(new Vector2(5, 5), new Vector2(5, 5));
      expect(line.length()).toBe(0);
    });
  });

  describe('at方法', () => {
    test('should return point at parameter t=0', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(10, 10));
      const point = line.at(0);

      (expect(point) as any).toEqualVector2({ x: 0, y: 0 });
    });

    test('should return point at parameter t=1', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(10, 10));
      const point = line.at(1);

      (expect(point) as any).toEqualVector2({ x: 10, y: 10 });
    });

    test('should return point at parameter t=0.5', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(10, 10));
      const point = line.at(0.5);

      (expect(point) as any).toEqualVector2({ x: 5, y: 5 });
    });

    test('should extrapolate beyond t=1', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(10, 0));
      const point = line.at(2);

      (expect(point) as any).toEqualVector2({ x: 20, y: 0 });
    });
  });

  describe('closestPointToPointParameter方法', () => {
    test('should return parameter for closest point', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(10, 0));
      const t = line.closestPointToPointParameter(new Vector2(5, 5), true);

      expect(t).toBe(0.5);
    });

    test('should clamp to 0 when point is before start', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(10, 0));
      const t = line.closestPointToPointParameter(new Vector2(-5, 0), true);

      expect(t).toBe(0);
    });

    test('should clamp to 1 when point is after end', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(10, 0));
      const t = line.closestPointToPointParameter(new Vector2(15, 0), true);

      expect(t).toBe(1);
    });

    test('should not clamp when clampToLine is false', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(10, 0));
      const t = line.closestPointToPointParameter(new Vector2(15, 0), false);

      expect(t).toBe(1.5);
    });
  });

  describe('closestPointToPoint方法', () => {
    test('should return closest point on line', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(10, 0));
      const closest = line.closestPointToPoint(new Vector2(5, 5), true);

      (expect(closest) as any).toEqualVector2({ x: 5, y: 0 });
    });

    test('should use target when provided', () => {
      const line = new Line2(new Vector2(0, 0), new Vector2(10, 0));
      const target = new Vector2();

      const result = line.closestPointToPoint(new Vector2(5, 5), true, target);

      expect(result).toBe(target);
      (expect(target) as any).toEqualVector2({ x: 5, y: 0 });
    });
  });

  describe('equals方法', () => {
    test('should detect equal lines', () => {
      const line1 = new Line2(new Vector2(0, 0), new Vector2(10, 10));
      const line2 = new Line2(new Vector2(0, 0), new Vector2(10, 10));

      expect(line1.equals(line2)).toBe(true);
    });

    test('should detect different lines', () => {
      const line1 = new Line2(new Vector2(0, 0), new Vector2(10, 10));
      const line2 = new Line2(new Vector2(0, 0), new Vector2(10, 11));

      expect(line1.equals(line2)).toBe(false);
    });
  });

  describe('crossWithLine方法', () => {
    test('should detect crossing lines', () => {
      const line1 = new Line2(new Vector2(0, 0), new Vector2(10, 10));
      const line2 = new Line2(new Vector2(0, 10), new Vector2(10, 0));

      expect(line1.crossWithLine(line2)).toBe(true);
    });

    test('should not detect parallel lines', () => {
      const line1 = new Line2(new Vector2(0, 0), new Vector2(10, 0));
      const line2 = new Line2(new Vector2(0, 5), new Vector2(10, 5));

      expect(line1.crossWithLine(line2)).toBe(false);
    });

    test('should not detect non-crossing lines', () => {
      const line1 = new Line2(new Vector2(0, 0), new Vector2(5, 0));
      const line2 = new Line2(new Vector2(10, 0), new Vector2(10, 10));

      expect(line1.crossWithLine(line2)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero-length line', () => {
      const line = new Line2(new Vector2(5, 5), new Vector2(5, 5));

      expect(line.length()).toBe(0);
      expect(line.distanceSq()).toBe(0);
    });

    test('should handle negative coordinates', () => {
      const line = new Line2(new Vector2(-10, -10), new Vector2(-5, -5));

      expect(line.length()).toBeCloseTo(Math.sqrt(50), 5);
    });
  });
});
