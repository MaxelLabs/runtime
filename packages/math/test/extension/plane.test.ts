/**
 * Plane Test Suite
 * Target: 95%+ Coverage
 */

import '../setup';
import { Plane } from '../../src/extension/plane';
import { Vector3 } from '../../src/core/vector3';
import { expect } from '@jest/globals';

describe('Plane', () => {
  describe('Constructor and Basic Properties', () => {
    test('should create default plane with z-normal', () => {
      const plane = new Plane();
      expect(plane.distance).toBe(0);
      (expect(plane.normal) as any).toEqualVector3({ x: 0, y: 0, z: 1 });
    });

    test('should create plane with specified distance and normal', () => {
      const normal = new Vector3(1, 0, 0);
      const plane = new Plane(5, normal);

      expect(plane.distance).toBe(5);
      (expect(plane.normal) as any).toEqualVector3({ x: 1, y: 0, z: 0 });
    });

    test('should normalize the normal vector', () => {
      const normal = new Vector3(2, 0, 0);
      const plane = new Plane(4, normal);

      expect(plane.distance).toBe(2); // 4 / length(2,0,0) = 4/2 = 2
      (expect(plane.normal) as any).toEqualVector3({ x: 1, y: 0, z: 0 });
    });

    test('should handle zero-length normal', () => {
      const normal = new Vector3(0, 0, 0);
      const plane = new Plane(5, normal);

      // Should default to (0, 0, 1)
      (expect(plane.normal) as any).toEqualVector3({ x: 0, y: 0, z: 1 });
    });
  });

  describe('set方法', () => {
    test('should set distance and normal', () => {
      const plane = new Plane();
      const normal = new Vector3(0, 1, 0);

      plane.set(10, normal);

      expect(plane.distance).toBe(10);
      (expect(plane.normal) as any).toEqualVector3({ x: 0, y: 1, z: 0 });
    });

    test('should normalize normal in set', () => {
      const plane = new Plane();
      const normal = new Vector3(3, 0, 0);

      plane.set(6, normal);

      expect(plane.distance).toBe(2); // 6 / 3 = 2
      (expect(plane.normal) as any).toEqualVector3({ x: 1, y: 0, z: 0 });
    });

    test('should handle zero-length normal in set', () => {
      const plane = new Plane();
      plane.set(5, new Vector3(0, 0, 0));

      (expect(plane.normal) as any).toEqualVector3({ x: 0, y: 0, z: 1 });
    });
  });

  describe('copyFrom方法', () => {
    test('should copy from another plane', () => {
      const plane1 = new Plane(5, new Vector3(1, 0, 0));
      const plane2 = new Plane();

      plane2.copyFrom(plane1);

      expect(plane2.distance).toBe(5);
      (expect(plane2.normal) as any).toEqualVector3({ x: 1, y: 0, z: 0 });
    });
  });

  describe('clone方法', () => {
    test('should create independent copy', () => {
      const original = new Plane(5, new Vector3(1, 0, 0));
      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.distance).toBe(5);
      (expect(cloned.normal) as any).toEqualVector3({ x: 1, y: 0, z: 0 });

      original.distance = 10;
      expect(cloned.distance).toBe(5);
    });
  });

  describe('setFromNormalAndCoplanarPoint (static)', () => {
    test('should create plane from normal and point', () => {
      const point = new Vector3(0, 0, 5);
      const normal = new Vector3(0, 0, 1);

      const plane = Plane.setFromNormalAndCoplanarPoint(point, normal);

      expect(plane.distance).toBe(-5);
      (expect(plane.normal) as any).toEqualVector3({ x: 0, y: 0, z: 1 });
    });

    test('should handle point at origin', () => {
      const point = new Vector3(0, 0, 0);
      const normal = new Vector3(1, 0, 0);

      const plane = Plane.setFromNormalAndCoplanarPoint(point, normal);

      expect(plane.distance).toBeCloseTo(0, 5);
    });
  });

  describe('setFromNormalAndCoplanarPoint (instance)', () => {
    test('should set plane from normal and point', () => {
      const plane = new Plane();
      const point = new Vector3(0, 5, 0);
      const normal = new Vector3(0, 1, 0);

      plane.setFromNormalAndCoplanarPoint(point, normal);

      expect(plane.distance).toBe(-5);
      (expect(plane.normal) as any).toEqualVector3({ x: 0, y: 1, z: 0 });
    });
  });

  describe('distanceToPoint方法', () => {
    test('should return positive distance for point in front', () => {
      const plane = new Plane(0, new Vector3(0, 0, 1));
      const point = new Vector3(0, 0, 5);

      expect(plane.distanceToPoint(point)).toBe(5);
    });

    test('should return negative distance for point behind', () => {
      const plane = new Plane(0, new Vector3(0, 0, 1));
      const point = new Vector3(0, 0, -5);

      expect(plane.distanceToPoint(point)).toBe(-5);
    });

    test('should return zero for point on plane', () => {
      const plane = new Plane(0, new Vector3(0, 0, 1));
      const point = new Vector3(10, 10, 0);

      expect(plane.distanceToPoint(point)).toBe(0);
    });

    test('should work with offset plane', () => {
      const plane = new Plane(5, new Vector3(0, 0, 1));
      const point = new Vector3(0, 0, 0);

      expect(plane.distanceToPoint(point)).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    test('should handle negative distance', () => {
      const plane = new Plane(-5, new Vector3(1, 0, 0));
      expect(plane.distance).toBe(-5);
    });

    test('should handle diagonal normal', () => {
      const normal = new Vector3(1, 1, 1);
      const plane = new Plane(0, normal);

      const length = Math.sqrt(3);
      expect(plane.normal.x).toBeCloseTo(1 / length, 5);
      expect(plane.normal.y).toBeCloseTo(1 / length, 5);
      expect(plane.normal.z).toBeCloseTo(1 / length, 5);
    });

    test('should handle very large values', () => {
      const plane = new Plane(1e6, new Vector3(0, 0, 1));
      expect(plane.distance).toBe(1e6);
    });
  });
});
