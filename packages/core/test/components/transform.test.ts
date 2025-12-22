import { LocalTransform, WorldTransform, Parent, Children } from '../../src/components/transform';
import { describe, it, expect } from '@jest/globals';

describe('Transform Components', () => {
  describe('LocalTransform', () => {
    it('should create from ITransform data', () => {
      const transform = LocalTransform.fromData({
        position: { x: 10, y: 20, z: 30 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      });

      expect(transform.position.x).toBe(10);
      expect(transform.position.y).toBe(20);
      expect(transform.position.z).toBe(30);
      expect(transform.rotation.w).toBe(1);
      expect(transform.scale.x).toBe(1);
      expect(transform.dirty).toBe(true);
    });

    it('should create with custom rotation', () => {
      const transform = LocalTransform.fromData({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0.707, z: 0, w: 0.707 },
        scale: { x: 1, y: 1, z: 1 },
      });

      expect(transform.rotation.y).toBeCloseTo(0.707, 3);
      expect(transform.rotation.w).toBeCloseTo(0.707, 3);
    });

    it('should create with non-uniform scale', () => {
      const transform = LocalTransform.fromData({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 2, y: 1, z: 0.5 },
      });

      expect(transform.scale.x).toBe(2);
      expect(transform.scale.y).toBe(1);
      expect(transform.scale.z).toBe(0.5);
    });

    it('should copy optional matrix if provided', () => {
      const matrix = {
        m00: 1,
        m01: 0,
        m02: 0,
        m03: 0,
        m10: 0,
        m11: 1,
        m12: 0,
        m13: 0,
        m20: 0,
        m21: 0,
        m22: 1,
        m23: 0,
        m30: 0,
        m31: 0,
        m32: 0,
        m33: 1,
      };

      const transform = LocalTransform.fromData({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
        matrix,
      });

      expect(transform.matrix).toBeDefined();
      expect(transform.matrix!.m00).toBe(1);
      expect(transform.matrix!.m33).toBe(1);
    });

    it('should copy optional anchor if provided', () => {
      const transform = LocalTransform.fromData({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
        anchor: { x: 0.5, y: 0.5, z: 0.5 },
      });

      expect(transform.anchor).toBeDefined();
      expect(transform.anchor!.x).toBe(0.5);
    });
  });

  describe('WorldTransform', () => {
    it('should create from ITransform data', () => {
      const world = WorldTransform.fromData({
        position: { x: 100, y: 200, z: 300 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      });

      expect(world.position.x).toBe(100);
      expect(world.position.y).toBe(200);
      expect(world.position.z).toBe(300);
    });

    it('should preserve matrix data if provided', () => {
      const matrix = {
        m00: 2,
        m01: 0,
        m02: 0,
        m03: 0,
        m10: 0,
        m11: 2,
        m12: 0,
        m13: 0,
        m20: 0,
        m21: 0,
        m22: 2,
        m23: 0,
        m30: 10,
        m31: 20,
        m32: 30,
        m33: 1,
      };

      const world = WorldTransform.fromData({
        position: { x: 10, y: 20, z: 30 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 2, y: 2, z: 2 },
        matrix,
      });

      expect(world.matrix).toBeDefined();
      expect(world.matrix!.m00).toBe(2);
      expect(world.matrix!.m30).toBe(10);
    });
  });

  describe('Parent', () => {
    it('should create from IParent data', () => {
      const parent = Parent.fromData({ entity: 123 });
      expect(parent.entity).toBe(123);
    });

    it('should store parent entity ID correctly', () => {
      const parent = Parent.fromData({ entity: 0 });
      expect(parent.entity).toBe(0);
    });
  });

  describe('Children', () => {
    it('should create from IChildren data', () => {
      const children = Children.fromData({ entities: [1, 2, 3] });
      expect(children.entities).toEqual([1, 2, 3]);
    });

    it('should create independent copy of array', () => {
      const original = [1, 2, 3];
      const children = Children.fromData({ entities: original });
      original.push(4);

      expect(children.entities).toEqual([1, 2, 3]);
      expect(children.entities).not.toEqual(original);
    });

    it('should handle empty children array', () => {
      const children = Children.fromData({ entities: [] });
      expect(children.entities).toEqual([]);
    });
  });
});
