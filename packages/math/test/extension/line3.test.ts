/**
 * Line3 Test Suite
 * Target: 95%+ Coverage
 * Note: Line3 is a minimal class with only constructor
 */

import '../setup';
import { Line3 } from '../../src/extension/line3';
import { Vector3 } from '../../src/core/vector3';
import { expect } from '@jest/globals';

describe('Line3', () => {
  describe('Constructor and Basic Properties', () => {
    test('should create default line at origin', () => {
      const line = new Line3();
      (expect(line.start) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
      (expect(line.end) as any).toEqualVector3({ x: 0, y: 0, z: 0 });
    });

    test('should create line with specified start and end', () => {
      const start = new Vector3(1, 2, 3);
      const end = new Vector3(4, 5, 6);
      const line = new Line3(start, end);

      (expect(line.start) as any).toEqualVector3({ x: 1, y: 2, z: 3 });
      (expect(line.end) as any).toEqualVector3({ x: 4, y: 5, z: 6 });
    });

    test('should clone start and end vectors', () => {
      const start = new Vector3(1, 1, 1);
      const end = new Vector3(2, 2, 2);
      const line = new Line3(start, end);

      start.x = 100;
      expect(line.start.x).toBe(1);
    });

    test('should have independent start and end', () => {
      const line = new Line3(new Vector3(1, 2, 3), new Vector3(4, 5, 6));

      line.start.x = 10;
      line.end.x = 40;

      expect(line.start.x).toBe(10);
      expect(line.end.x).toBe(40);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero-length line', () => {
      const line = new Line3(new Vector3(5, 5, 5), new Vector3(5, 5, 5));

      (expect(line.start) as any).toEqualVector3({ x: 5, y: 5, z: 5 });
      (expect(line.end) as any).toEqualVector3({ x: 5, y: 5, z: 5 });
    });

    test('should handle negative coordinates', () => {
      const line = new Line3(new Vector3(-1, -2, -3), new Vector3(-4, -5, -6));

      (expect(line.start) as any).toEqualVector3({ x: -1, y: -2, z: -3 });
      (expect(line.end) as any).toEqualVector3({ x: -4, y: -5, z: -6 });
    });

    test('should handle large values', () => {
      const line = new Line3(new Vector3(1e6, 1e6, 1e6), new Vector3(2e6, 2e6, 2e6));

      expect(line.start.x).toBe(1e6);
      expect(line.end.x).toBe(2e6);
    });
  });
});
