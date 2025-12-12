/**
 * Spherical Test Suite
 * Target: 95%+ Coverage
 */

import '../setup';
import { Spherical } from '../../src/extension/spherical';
import { Vector3 } from '../../src/core/vector3';
import { expect } from '@jest/globals';

describe('Spherical', () => {
  describe('Constructor and Basic Properties', () => {
    test('should create default spherical with radius 1', () => {
      const spherical = new Spherical();

      expect(spherical.radius).toBe(1);
      expect(spherical.phi).toBe(0);
      expect(spherical.theta).toBe(0);
    });

    test('should create spherical with specified values', () => {
      const spherical = new Spherical(5, Math.PI / 4, Math.PI / 2);

      expect(spherical.radius).toBe(5);
      expect(spherical.phi).toBe(Math.PI / 4);
      expect(spherical.theta).toBe(Math.PI / 2);
    });
  });

  describe('set方法', () => {
    test('should set all values', () => {
      const spherical = new Spherical();
      spherical.set(10, Math.PI / 3, Math.PI / 6);

      expect(spherical.radius).toBe(10);
      expect(spherical.phi).toBe(Math.PI / 3);
      expect(spherical.theta).toBe(Math.PI / 6);
    });

    test('should return this for chaining', () => {
      const spherical = new Spherical();
      const result = spherical.set(5, 1, 2);

      expect(result).toBe(spherical);
    });
  });

  describe('copyFrom方法', () => {
    test('should copy from another spherical', () => {
      const spherical1 = new Spherical(10, Math.PI / 4, Math.PI / 2);
      const spherical2 = new Spherical();

      spherical2.copyFrom(spherical1);

      expect(spherical2.radius).toBe(10);
      expect(spherical2.phi).toBe(Math.PI / 4);
      expect(spherical2.theta).toBe(Math.PI / 2);
    });

    test('should return this for chaining', () => {
      const spherical1 = new Spherical(5, 1, 2);
      const spherical2 = new Spherical();
      const result = spherical2.copyFrom(spherical1);

      expect(result).toBe(spherical2);
    });
  });

  describe('clone方法', () => {
    test('should create independent copy', () => {
      const original = new Spherical(10, Math.PI / 4, Math.PI / 2);
      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.radius).toBe(10);
      expect(cloned.phi).toBe(Math.PI / 4);
      expect(cloned.theta).toBe(Math.PI / 2);

      original.radius = 20;
      expect(cloned.radius).toBe(10);
    });
  });

  describe('makeSafe方法', () => {
    test('should clamp phi to safe range', () => {
      const spherical = new Spherical(1, 0, 0);
      spherical.makeSafe();

      const EPS = 0.000001;
      expect(spherical.phi).toBeGreaterThanOrEqual(EPS);
      expect(spherical.phi).toBeLessThanOrEqual(Math.PI - EPS);
    });

    test('should clamp phi at PI', () => {
      const spherical = new Spherical(1, Math.PI, 0);
      spherical.makeSafe();

      const EPS = 0.000001;
      expect(spherical.phi).toBeLessThanOrEqual(Math.PI - EPS);
    });

    test('should not change valid phi', () => {
      const spherical = new Spherical(1, Math.PI / 2, 0);
      spherical.makeSafe();

      expect(spherical.phi).toBe(Math.PI / 2);
    });

    test('should return this for chaining', () => {
      const spherical = new Spherical();
      const result = spherical.makeSafe();

      expect(result).toBe(spherical);
    });
  });

  describe('makeEmpty方法', () => {
    test('should reset to default values', () => {
      const spherical = new Spherical(10, Math.PI / 4, Math.PI / 2);
      spherical.makeEmpty();

      expect(spherical.radius).toBe(1);
      expect(spherical.phi).toBe(0);
      expect(spherical.theta).toBe(0);
    });

    test('should return this for chaining', () => {
      const spherical = new Spherical(10, 1, 2);
      const result = spherical.makeEmpty();

      expect(result).toBe(spherical);
    });
  });

  describe('setFromVec3方法', () => {
    test('should set from vector on positive x-axis', () => {
      const spherical = new Spherical();
      spherical.setFromVec3(new Vector3(5, 0, 0));

      expect(spherical.radius).toBeCloseTo(5, 5);
      expect(spherical.phi).toBeCloseTo(Math.PI / 2, 5);
      expect(spherical.theta).toBeCloseTo(Math.PI / 2, 5);
    });

    test('should set from vector on positive y-axis', () => {
      const spherical = new Spherical();
      spherical.setFromVec3(new Vector3(0, 5, 0));

      expect(spherical.radius).toBeCloseTo(5, 5);
      expect(spherical.phi).toBeCloseTo(0, 5);
      expect(spherical.theta).toBe(0);
    });

    test('should set from vector on positive z-axis', () => {
      const spherical = new Spherical();
      spherical.setFromVec3(new Vector3(0, 0, 5));

      expect(spherical.radius).toBeCloseTo(5, 5);
      expect(spherical.phi).toBeCloseTo(Math.PI / 2, 5);
      expect(spherical.theta).toBeCloseTo(0, 5);
    });
  });

  describe('setFromCartesianCoords方法', () => {
    test('should set from cartesian coordinates', () => {
      const spherical = new Spherical();
      spherical.setFromCartesianCoords(1, 0, 0);

      expect(spherical.radius).toBeCloseTo(1, 5);
      expect(spherical.phi).toBeCloseTo(Math.PI / 2, 5);
    });

    test('should handle origin', () => {
      const spherical = new Spherical();
      spherical.setFromCartesianCoords(0, 0, 0);

      expect(spherical.radius).toBe(0);
      expect(spherical.phi).toBe(0);
      expect(spherical.theta).toBe(0);
    });

    test('should handle negative y', () => {
      const spherical = new Spherical();
      spherical.setFromCartesianCoords(0, -5, 0);

      expect(spherical.radius).toBeCloseTo(5, 5);
      expect(spherical.phi).toBeCloseTo(Math.PI, 5);
    });

    test('should return this for chaining', () => {
      const spherical = new Spherical();
      const result = spherical.setFromCartesianCoords(1, 2, 3);

      expect(result).toBe(spherical);
    });
  });

  describe('getCartesianCoords方法', () => {
    test('should convert back to cartesian for x-axis point', () => {
      const spherical = new Spherical();
      spherical.setFromCartesianCoords(5, 0, 0);

      const cartesian = spherical.getCartesianCoords();

      expect(cartesian.x).toBeCloseTo(5, 4);
      expect(cartesian.y).toBeCloseTo(0, 4);
      expect(cartesian.z).toBeCloseTo(0, 4);
    });

    test('should convert back to cartesian for y-axis point', () => {
      const spherical = new Spherical();
      spherical.setFromCartesianCoords(0, 5, 0);

      const cartesian = spherical.getCartesianCoords();

      expect(cartesian.x).toBeCloseTo(0, 4);
      expect(cartesian.y).toBeCloseTo(5, 4);
      expect(cartesian.z).toBeCloseTo(0, 4);
    });

    test('should convert back to cartesian for z-axis point', () => {
      const spherical = new Spherical();
      spherical.setFromCartesianCoords(0, 0, 5);

      const cartesian = spherical.getCartesianCoords();

      expect(cartesian.x).toBeCloseTo(0, 4);
      expect(cartesian.y).toBeCloseTo(0, 4);
      expect(cartesian.z).toBeCloseTo(5, 4);
    });

    test('should be inverse of setFromCartesianCoords', () => {
      const original = new Vector3(3, 4, 5);
      const spherical = new Spherical();
      spherical.setFromCartesianCoords(original.x, original.y, original.z);

      const result = spherical.getCartesianCoords();

      expect(result.x).toBeCloseTo(original.x, 4);
      expect(result.y).toBeCloseTo(original.y, 4);
      expect(result.z).toBeCloseTo(original.z, 4);
    });

    test('should handle default spherical', () => {
      const spherical = new Spherical();
      const cartesian = spherical.getCartesianCoords();

      // Default: radius=1, phi=0, theta=0
      // x = r * sin(phi) * sin(theta) = 1 * sin(0) * sin(0) = 0
      // y = r * cos(phi) = 1 * cos(0) = 1
      // z = r * sin(phi) * cos(theta) = 1 * sin(0) * cos(0) = 0
      expect(cartesian.x).toBeCloseTo(0, 5);
      expect(cartesian.y).toBeCloseTo(1, 5);
      expect(cartesian.z).toBeCloseTo(0, 5);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero radius', () => {
      const spherical = new Spherical(0, Math.PI / 2, Math.PI / 2);
      const cartesian = spherical.getCartesianCoords();

      expect(cartesian.x).toBeCloseTo(0, 5);
      expect(cartesian.y).toBeCloseTo(0, 5);
      expect(cartesian.z).toBeCloseTo(0, 5);
    });

    test('should handle negative radius', () => {
      const spherical = new Spherical(-5, Math.PI / 2, 0);
      const cartesian = spherical.getCartesianCoords();

      // Negative radius should flip direction
      expect(cartesian.z).toBeCloseTo(-5, 4);
    });

    test('should handle boundary angles', () => {
      const spherical = new Spherical(1, Math.PI, 0);
      const cartesian = spherical.getCartesianCoords();

      expect(cartesian.y).toBeCloseTo(-1, 4);
    });
  });
});
