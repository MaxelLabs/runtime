/**
 * BoundingBox 单元测试
 *
 * 测试包围盒的核心功能：创建、变换、相交检测、深拷贝。
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BoundingBox, MMath } from '../../src';

const { Matrix4 } = MMath;

describe('BoundingBox', () => {
  // ========================================
  // 创建和初始化
  // ========================================

  describe('Creation', () => {
    it('should create empty bounding box by default', () => {
      const bbox = new BoundingBox();
      expect(bbox.isEmpty()).toBe(true);
    });

    it('should create from data with min/max', () => {
      const bbox = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      expect(bbox.isEmpty()).toBe(false);
      expect(bbox.min.x).toBe(-1);
      expect(bbox.max.x).toBe(1);
    });

    it('should create from vertices array', () => {
      const vertices = [0, 0, 0, 1, 2, 3, -1, -2, -3];
      const bbox = BoundingBox.fromVertices(vertices);

      expect(bbox.min.x).toBe(-1);
      expect(bbox.min.y).toBe(-2);
      expect(bbox.min.z).toBe(-3);
      expect(bbox.max.x).toBe(1);
      expect(bbox.max.y).toBe(2);
      expect(bbox.max.z).toBe(3);
    });

    it('should create from center and size', () => {
      const bbox = BoundingBox.fromCenterAndSize({ x: 0, y: 0, z: 0 }, { x: 2, y: 4, z: 6 });

      expect(bbox.min.x).toBe(-1);
      expect(bbox.min.y).toBe(-2);
      expect(bbox.min.z).toBe(-3);
      expect(bbox.max.x).toBe(1);
      expect(bbox.max.y).toBe(2);
      expect(bbox.max.z).toBe(3);
    });

    it('should create from points array', () => {
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 5, y: 10, z: 15 },
        { x: -5, y: -10, z: -15 },
      ];
      const bbox = BoundingBox.fromPoints(points);

      expect(bbox.min.x).toBe(-5);
      expect(bbox.max.y).toBe(10);
    });
  });

  // ========================================
  // 边界条件测试
  // ========================================

  describe('Boundary Conditions', () => {
    it('should handle empty data gracefully', () => {
      const bbox = BoundingBox.fromData({});
      expect(bbox.isEmpty()).toBe(true);
    });

    it('should handle partial data with defaults', () => {
      const bbox = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        // max is missing
      });

      expect(bbox.min.x).toBe(-1);
      // max should be default (Infinity values, making it empty)
    });

    it('should handle zero-size bounding box', () => {
      const bbox = BoundingBox.fromCenterAndSize({ x: 5, y: 5, z: 5 }, { x: 0, y: 0, z: 0 });

      expect(bbox.min.x).toBe(5);
      expect(bbox.max.x).toBe(5);
      expect(bbox.isEmpty()).toBe(false); // A point is not empty
    });
  });

  // ========================================
  // 引用独立性测试 (Critical)
  // ========================================

  describe('Reference Independence', () => {
    it('clone must create independent instance', () => {
      const original = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      const cloned = original.clone();

      // 修改克隆不应影响原始
      cloned.set({ x: -10, y: -10, z: -10 }, { x: 10, y: 10, z: 10 });

      expect(original.min.x).toBe(-1);
      expect(cloned.min.x).toBe(-10);
    });

    it('fromData must not share references with input', () => {
      const inputMin = { x: -1, y: -1, z: -1 };
      const inputMax = { x: 1, y: 1, z: 1 };

      const bbox = BoundingBox.fromData({ min: inputMin, max: inputMax });

      // 修改输入不应影响包围盒
      inputMin.x = -999;

      expect(bbox.min.x).toBe(-1);
    });

    it('toData must return deep copy', () => {
      const bbox = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      const data = bbox.toData();
      data.min!.x = -999;

      expect(bbox.min.x).toBe(-1);
    });
  });

  // ========================================
  // 相交检测
  // ========================================

  describe('Intersection Tests', () => {
    let bboxA: BoundingBox;
    let bboxB: BoundingBox;

    beforeEach(() => {
      bboxA = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 2, y: 2, z: 2 },
      });

      bboxB = BoundingBox.fromData({
        min: { x: 1, y: 1, z: 1 },
        max: { x: 3, y: 3, z: 3 },
      });
    });

    it('should detect intersection between overlapping boxes', () => {
      // 需要先更新世界包围盒
      const identity = new Matrix4();
      bboxA.updateWorldBounds(identity);
      bboxB.updateWorldBounds(identity);

      expect(bboxA.intersectsBox(bboxB, true)).toBe(true);
    });

    it('should detect non-intersection between separate boxes', () => {
      const bboxC = BoundingBox.fromData({
        min: { x: 10, y: 10, z: 10 },
        max: { x: 12, y: 12, z: 12 },
      });

      const identity = new Matrix4();
      bboxA.updateWorldBounds(identity);
      bboxC.updateWorldBounds(identity);

      expect(bboxA.intersectsBox(bboxC, true)).toBe(false);
    });

    it('should detect point containment', () => {
      const identity = new Matrix4();
      bboxA.updateWorldBounds(identity);

      expect(bboxA.containsPoint({ x: 1, y: 1, z: 1 }, true)).toBe(true);
      expect(bboxA.containsPoint({ x: 5, y: 5, z: 5 }, true)).toBe(false);
    });

    it('should detect box containment', () => {
      const innerBox = BoundingBox.fromData({
        min: { x: 0.5, y: 0.5, z: 0.5 },
        max: { x: 1.5, y: 1.5, z: 1.5 },
      });

      const identity = new Matrix4();
      bboxA.updateWorldBounds(identity);
      bboxB.updateWorldBounds(identity);
      innerBox.updateWorldBounds(identity);

      expect(bboxA.containsBox(innerBox, true)).toBe(true);
      expect(bboxA.containsBox(bboxB, true)).toBe(false);
    });
  });

  // ========================================
  // 脏标记和缓存
  // ========================================

  describe('Dirty Flag Management', () => {
    it('should mark dirty when data changes', () => {
      const bbox = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      // 更新后应该不再脏
      const identity = new Matrix4();
      bbox.updateWorldBounds(identity);
      expect(bbox.isWorldDirty).toBe(false);

      // 修改后应该变脏
      bbox.expandByPoint({ x: 10, y: 10, z: 10 });
      expect(bbox.isWorldDirty).toBe(true);
    });

    it('should skip update when not dirty', () => {
      const bbox = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      const identity = new Matrix4();

      // 第一次更新
      bbox.updateWorldBounds(identity);
      const worldMin1 = bbox.worldBox.min.x;

      // 第二次更新（应该跳过）
      bbox.updateWorldBounds(identity);
      const worldMin2 = bbox.worldBox.min.x;

      expect(worldMin1).toBe(worldMin2);
    });
  });

  // ========================================
  // 几何查询
  // ========================================

  describe('Geometric Queries', () => {
    it('should calculate center correctly', () => {
      const bbox = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 4, y: 6, z: 8 },
      });

      const identity = new Matrix4();
      bbox.updateWorldBounds(identity);

      const center = bbox.getCenter(true);
      expect(center.x).toBe(2);
      expect(center.y).toBe(3);
      expect(center.z).toBe(4);
    });

    it('should calculate size correctly', () => {
      const bbox = BoundingBox.fromData({
        min: { x: -1, y: -2, z: -3 },
        max: { x: 1, y: 2, z: 3 },
      });

      const identity = new Matrix4();
      bbox.updateWorldBounds(identity);

      const size = bbox.getSize(true);
      expect(size.x).toBe(2);
      expect(size.y).toBe(4);
      expect(size.z).toBe(6);
    });

    it('should calculate distance to point', () => {
      const bbox = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 1, y: 1, z: 1 },
      });

      const identity = new Matrix4();
      bbox.updateWorldBounds(identity);

      // 点在盒内，距离为 0
      expect(bbox.distanceToPoint({ x: 0.5, y: 0.5, z: 0.5 }, true)).toBe(0);

      // 点在盒外
      const dist = bbox.distanceToPoint({ x: 2, y: 0, z: 0 }, true);
      expect(dist).toBeCloseTo(1, 5);
    });
  });

  // ========================================
  // 修改操作
  // ========================================

  describe('Modification Methods', () => {
    it('should expand by point', () => {
      const bbox = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 1, y: 1, z: 1 },
      });

      bbox.expandByPoint({ x: 5, y: 5, z: 5 });

      expect(bbox.max.x).toBe(5);
      expect(bbox.max.y).toBe(5);
      expect(bbox.max.z).toBe(5);
    });

    it('should expand by scalar', () => {
      const bbox = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 2, y: 2, z: 2 },
      });

      bbox.expandByScalar(1);

      expect(bbox.min.x).toBe(-1);
      expect(bbox.max.x).toBe(3);
    });

    it('should union two boxes', () => {
      const bboxA = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 1, y: 1, z: 1 },
      });

      const bboxB = BoundingBox.fromData({
        min: { x: 2, y: 2, z: 2 },
        max: { x: 3, y: 3, z: 3 },
      });

      bboxA.union(bboxB);

      expect(bboxA.min.x).toBe(0);
      expect(bboxA.max.x).toBe(3);
    });

    it('should make empty', () => {
      const bbox = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 1, y: 1, z: 1 },
      });

      expect(bbox.isEmpty()).toBe(false);

      bbox.makeEmpty();

      expect(bbox.isEmpty()).toBe(true);
    });
  });

  // ========================================
  // 额外相交测试
  // ========================================

  describe('Additional Intersection Tests', () => {
    it('should test markWorldDirty directly', () => {
      const bbox = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      const identity = new Matrix4();
      bbox.updateWorldBounds(identity);
      expect(bbox.isWorldDirty).toBe(false);

      // 直接调用 markWorldDirty
      bbox.markWorldDirty();
      expect(bbox.isWorldDirty).toBe(true);
    });

    it('should test intersectsBox3 with world space', () => {
      const bbox = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 2, y: 2, z: 2 },
      });

      const identity = new Matrix4();
      bbox.updateWorldBounds(identity);

      const box3 = new MMath.Box3(new MMath.Vector3(1, 1, 1), new MMath.Vector3(3, 3, 3));

      expect(bbox.intersectsBox3(box3, true)).toBe(true);
    });

    it('should test intersectsBox3 with local space', () => {
      const bbox = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 2, y: 2, z: 2 },
      });

      const box3 = new MMath.Box3(new MMath.Vector3(10, 10, 10), new MMath.Vector3(12, 12, 12));

      // 使用本地空间，不相交
      expect(bbox.intersectsBox3(box3, false)).toBe(false);
    });

    it('should test intersectsSphere with local space', () => {
      const bbox = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 2, y: 2, z: 2 },
      });

      const sphere = new MMath.Sphere(new MMath.Vector3(1, 1, 1), 0.5);

      // 使用本地空间
      expect(bbox.intersectsSphere(sphere, false)).toBe(true);
    });

    it('should test intersectsBox with local space', () => {
      const bboxA = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 2, y: 2, z: 2 },
      });

      const bboxB = BoundingBox.fromData({
        min: { x: 1, y: 1, z: 1 },
        max: { x: 3, y: 3, z: 3 },
      });

      // 使用本地空间进行相交检测
      expect(bboxA.intersectsBox(bboxB, false)).toBe(true);
    });
  });

  // ========================================
  // 包围球测试
  // ========================================

  describe('Bounding Sphere', () => {
    it('should get bounding sphere and update when dirty', () => {
      const bbox = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      const identity = new Matrix4();
      bbox.updateWorldBounds(identity);

      // 获取包围球（会触发计算）
      const sphere = bbox.getBoundingSphere(true);
      expect(sphere).toBeDefined();
      expect(sphere.center.x).toBeCloseTo(0, 5);
      expect(sphere.radius).toBeGreaterThan(0);
    });

    it('should get bounding sphere in local space', () => {
      const bbox = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 2, y: 2, z: 2 },
      });

      const sphere = bbox.getBoundingSphere(false);
      expect(sphere.center.x).toBeCloseTo(1, 5);
    });
  });

  // ========================================
  // 额外修改方法测试
  // ========================================

  describe('Additional Modification Methods', () => {
    it('should intersect two boxes', () => {
      const bboxA = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 3, y: 3, z: 3 },
      });

      const bboxB = BoundingBox.fromData({
        min: { x: 1, y: 1, z: 1 },
        max: { x: 4, y: 4, z: 4 },
      });

      bboxA.intersect(bboxB);

      // 交集应该是 (1,1,1) 到 (3,3,3)
      expect(bboxA.min.x).toBe(1);
      expect(bboxA.max.x).toBe(3);
    });

    it('should copy from another bounding box', () => {
      const bboxA = BoundingBox.fromData({
        min: { x: 0, y: 0, z: 0 },
        max: { x: 1, y: 1, z: 1 },
      });

      const bboxB = BoundingBox.fromData({
        min: { x: -5, y: -5, z: -5 },
        max: { x: 5, y: 5, z: 5 },
      });

      bboxA.copyFrom(bboxB);

      expect(bboxA.min.x).toBe(-5);
      expect(bboxA.max.x).toBe(5);
    });

    it('should access localBox getter', () => {
      const bbox = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      const localBox = bbox.localBox;
      expect(localBox).toBeDefined();
      expect(localBox.min.x).toBe(-1);
    });
  });

  // ========================================
  // 相等性测试
  // ========================================

  describe('Equality', () => {
    it('should compare equal boxes correctly', () => {
      const bboxA = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      const bboxB = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      expect(bboxA.equals(bboxB)).toBe(true);
    });

    it('should compare unequal boxes correctly', () => {
      const bboxA = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      const bboxB = BoundingBox.fromData({
        min: { x: -2, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      expect(bboxA.equals(bboxB)).toBe(false);
    });

    it('should use tolerance for floating point comparison', () => {
      const bboxA = BoundingBox.fromData({
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      const bboxB = BoundingBox.fromData({
        min: { x: -1 + 1e-8, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 },
      });

      expect(bboxA.equals(bboxB, 1e-6)).toBe(true);
    });
  });
});
