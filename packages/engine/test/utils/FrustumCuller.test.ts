/**
 * FrustumCuller 单元测试
 *
 * 测试视锥体和剔除器的核心功能：平面提取、相交检测、批量剔除。
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  Frustum,
  FrustumCuller,
  FrustumPlane,
  IntersectionResult,
  type ICullable,
} from '../../src/utils/FrustumCuller';
import { Matrix4, Vector3 } from '@maxellabs/math';

// 创建一个简单的透视投影矩阵
function createPerspectiveMatrix(fov: number, aspect: number, near: number, far: number): Matrix4 {
  const matrix = new Matrix4();
  const f = 1.0 / Math.tan((fov * Math.PI) / 360);
  const nf = 1 / (near - far);

  // Row-major 格式
  matrix.set(f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0);

  return matrix;
}

// 创建一个简单的视图矩阵（看向 -Z 方向）
function createViewMatrix(eye: Vector3, target: Vector3, up: Vector3): Matrix4 {
  const matrix = new Matrix4();
  matrix.lookAt(eye, target, up);
  return matrix;
}

describe('Frustum', () => {
  // ========================================
  // 创建和初始化
  // ========================================

  describe('Creation', () => {
    it('should create frustum with 6 planes', () => {
      const frustum = new Frustum();
      const planes = frustum.getPlanes();

      expect(planes.length).toBe(6);
    });

    it('should create from projection matrix', () => {
      const projMatrix = createPerspectiveMatrix(60, 16 / 9, 0.1, 100);
      const frustum = Frustum.fromProjectionMatrix(projMatrix);

      const planes = frustum.getPlanes();
      expect(planes.length).toBe(6);

      // 验证平面法线已归一化
      for (const plane of planes) {
        const length = Math.sqrt(
          plane.normal.x * plane.normal.x + plane.normal.y * plane.normal.y + plane.normal.z * plane.normal.z
        );
        expect(length).toBeCloseTo(1, 5);
      }
    });

    it('should create from data', () => {
      const frustum = Frustum.fromData({
        planes: [
          { distance: 0, normal: { x: 1, y: 0, z: 0 } },
          { distance: 0, normal: { x: -1, y: 0, z: 0 } },
          { distance: 0, normal: { x: 0, y: 1, z: 0 } },
          { distance: 0, normal: { x: 0, y: -1, z: 0 } },
          { distance: 0, normal: { x: 0, y: 0, z: 1 } },
          { distance: 0, normal: { x: 0, y: 0, z: -1 } },
        ],
      });

      const nearPlane = frustum.getPlane(FrustumPlane.Near);
      expect(nearPlane).toBeDefined();
    });
  });

  // ========================================
  // 点包含测试
  // ========================================

  describe('Point Containment', () => {
    let frustum: Frustum;

    beforeEach(() => {
      // 创建一个简单的视锥体（朝 -Z 方向）
      const projMatrix = createPerspectiveMatrix(90, 1, 1, 100);
      const viewMatrix = createViewMatrix(new Vector3(0, 0, 0), new Vector3(0, 0, -1), new Vector3(0, 1, 0));

      // 组合视图投影矩阵
      const vpMatrix = new Matrix4();
      vpMatrix.copyFrom(projMatrix);
      vpMatrix.multiply(viewMatrix);

      frustum = Frustum.fromProjectionMatrix(vpMatrix);
    });

    it('should contain point in front of camera', () => {
      // 在相机前方的点应该在视锥体内
      expect(frustum.containsPoint({ x: 0, y: 0, z: -10 })).toBe(true);
    });

    it('should not contain point behind camera', () => {
      // 在相机后方的点应该在视锥体外
      expect(frustum.containsPoint({ x: 0, y: 0, z: 10 })).toBe(false);
    });

    it('should not contain point too far away', () => {
      // 超过远裁剪面的点应该在视锥体外
      expect(frustum.containsPoint({ x: 0, y: 0, z: -200 })).toBe(false);
    });
  });

  // ========================================
  // 包围盒相交测试
  // ========================================

  describe('Box Intersection', () => {
    let frustum: Frustum;

    beforeEach(() => {
      const projMatrix = createPerspectiveMatrix(90, 1, 1, 100);
      frustum = Frustum.fromProjectionMatrix(projMatrix);
    });

    it('should detect box fully inside frustum', () => {
      const box = {
        min: { x: -1, y: -1, z: -20 },
        max: { x: 1, y: 1, z: -10 },
      };

      const result = frustum.intersectsBox(box);
      expect(result).not.toBe(IntersectionResult.Outside);
    });

    it('should detect box fully outside frustum', () => {
      const box = {
        min: { x: -1, y: -1, z: 10 },
        max: { x: 1, y: 1, z: 20 },
      };

      const result = frustum.intersectsBox(box);
      expect(result).toBe(IntersectionResult.Outside);
    });

    it('should detect box intersecting frustum boundary', () => {
      // 部分在近裁剪面附近的盒子
      const box = {
        min: { x: -1, y: -1, z: -5 },
        max: { x: 1, y: 1, z: 5 },
      };

      const result = frustum.intersectsBox(box);
      // 应该是相交或在内部，不应该完全在外部
      expect(result).not.toBe(IntersectionResult.Outside);
    });

    it('should use fast intersection test correctly', () => {
      const boxInside = {
        min: { x: -1, y: -1, z: -20 },
        max: { x: 1, y: 1, z: -10 },
      };

      const boxOutside = {
        min: { x: -1, y: -1, z: 10 },
        max: { x: 1, y: 1, z: 20 },
      };

      expect(frustum.intersectsBoxFast(boxInside)).toBe(true);
      expect(frustum.intersectsBoxFast(boxOutside)).toBe(false);
    });
  });

  // ========================================
  // 包围球相交测试
  // ========================================

  describe('Sphere Intersection', () => {
    let frustum: Frustum;

    beforeEach(() => {
      const projMatrix = createPerspectiveMatrix(90, 1, 1, 100);
      frustum = Frustum.fromProjectionMatrix(projMatrix);
    });

    it('should detect sphere inside frustum', () => {
      const sphere = {
        center: { x: 0, y: 0, z: -20 },
        radius: 5,
      };

      const result = frustum.intersectsSphere(sphere);
      expect(result).not.toBe(IntersectionResult.Outside);
    });

    it('should detect sphere outside frustum', () => {
      const sphere = {
        center: { x: 0, y: 0, z: 50 },
        radius: 5,
      };

      const result = frustum.intersectsSphere(sphere);
      expect(result).toBe(IntersectionResult.Outside);
    });

    it('should use fast sphere test correctly', () => {
      const sphereInside = {
        center: { x: 0, y: 0, z: -20 },
        radius: 5,
      };

      expect(frustum.intersectsSphereFast(sphereInside)).toBe(true);
    });
  });

  // ========================================
  // 序列化
  // ========================================

  describe('Serialization', () => {
    it('should serialize to data and back', () => {
      const projMatrix = createPerspectiveMatrix(60, 16 / 9, 0.1, 100);
      const original = Frustum.fromProjectionMatrix(projMatrix);

      const data = original.toData();
      const restored = Frustum.fromData(data);

      // 验证平面数据相同
      const originalPlanes = original.getPlanes();
      const restoredPlanes = restored.getPlanes();

      for (let i = 0; i < 6; i++) {
        expect(restoredPlanes[i].normal.x).toBeCloseTo(originalPlanes[i].normal.x, 5);
        expect(restoredPlanes[i].normal.y).toBeCloseTo(originalPlanes[i].normal.y, 5);
        expect(restoredPlanes[i].normal.z).toBeCloseTo(originalPlanes[i].normal.z, 5);
        expect(restoredPlanes[i].distance).toBeCloseTo(originalPlanes[i].distance, 5);
      }
    });

    it('clone should create independent copy', () => {
      const projMatrix = createPerspectiveMatrix(60, 16 / 9, 0.1, 100);
      const original = Frustum.fromProjectionMatrix(projMatrix);

      const cloned = original.clone();

      // 修改克隆的平面不应影响原始
      const newProjMatrix = createPerspectiveMatrix(30, 4 / 3, 1, 1000);
      cloned.setFromProjectionMatrix(newProjMatrix);

      const originalPlanes = original.getPlanes();
      const clonedPlanes = cloned.getPlanes();

      // 平面应该不同
      expect(originalPlanes[0].distance).not.toBeCloseTo(clonedPlanes[0].distance, 2);
    });
  });
});

describe('FrustumCuller', () => {
  // ========================================
  // 基础功能
  // ========================================

  describe('Basic Functionality', () => {
    it('should create culler instance', () => {
      const culler = new FrustumCuller();
      expect(culler).toBeDefined();
      expect(culler.enabled).toBe(true);
    });

    it('should set frustum from matrix', () => {
      const culler = new FrustumCuller();
      const projMatrix = createPerspectiveMatrix(60, 16 / 9, 0.1, 100);

      culler.setFrustum(projMatrix);

      expect(culler.frustum).toBeDefined();
    });

    it('should toggle enabled state', () => {
      const culler = new FrustumCuller();

      culler.setEnabled(false);
      expect(culler.enabled).toBe(false);

      culler.setEnabled(true);
      expect(culler.enabled).toBe(true);
    });

    it('should toggle bounding sphere mode', () => {
      const culler = new FrustumCuller();

      culler.setUseBoundingSphere(true);
      expect(culler.useBoundingSphere).toBe(true);

      culler.setUseBoundingSphere(false);
      expect(culler.useBoundingSphere).toBe(false);
    });
  });

  // ========================================
  // 单对象测试
  // ========================================

  describe('Single Object Tests', () => {
    let culler: FrustumCuller;

    beforeEach(() => {
      culler = new FrustumCuller();
      const projMatrix = createPerspectiveMatrix(90, 1, 1, 100);
      culler.setFrustum(projMatrix);
    });

    it('should test box visibility', () => {
      const visibleBox = {
        min: { x: -1, y: -1, z: -20 },
        max: { x: 1, y: 1, z: -10 },
      };

      const invisibleBox = {
        min: { x: -1, y: -1, z: 50 },
        max: { x: 1, y: 1, z: 60 },
      };

      expect(culler.isBoxVisible(visibleBox)).toBe(true);
      expect(culler.isBoxVisible(invisibleBox)).toBe(false);
    });

    it('should test sphere visibility', () => {
      const visibleSphere = {
        center: { x: 0, y: 0, z: -20 },
        radius: 5,
      };

      const invisibleSphere = {
        center: { x: 0, y: 0, z: 50 },
        radius: 5,
      };

      expect(culler.isSphereVisible(visibleSphere)).toBe(true);
      expect(culler.isSphereVisible(invisibleSphere)).toBe(false);
    });

    it('should return visible when disabled', () => {
      culler.setEnabled(false);

      const box = {
        min: { x: -1, y: -1, z: 50 },
        max: { x: 1, y: 1, z: 60 },
      };

      // 禁用时应该返回可见
      expect(culler.isBoxVisible(box)).toBe(true);
    });
  });

  // ========================================
  // 批量剔除
  // ========================================

  describe('Batch Culling', () => {
    let culler: FrustumCuller;
    let objects: ICullable[];

    beforeEach(() => {
      culler = new FrustumCuller();
      const projMatrix = createPerspectiveMatrix(90, 1, 1, 100);
      culler.setFrustum(projMatrix);

      objects = [
        // 可见对象
        {
          worldBoundingBox: {
            min: { x: -1, y: -1, z: -20 },
            max: { x: 1, y: 1, z: -10 },
          },
        },
        // 不可见对象
        {
          worldBoundingBox: {
            min: { x: -1, y: -1, z: 50 },
            max: { x: 1, y: 1, z: 60 },
          },
        },
        // 可见对象
        {
          worldBoundingBox: {
            min: { x: -1, y: -1, z: -50 },
            max: { x: 1, y: 1, z: -40 },
          },
        },
      ];
    });

    it('should cull objects and return stats', () => {
      const stats = culler.cullObjects(objects);

      expect(stats.totalTested).toBe(3);
      expect(stats.visible).toBe(2);
      expect(stats.culled).toBe(1);
    });

    it('should set culled flag on objects', () => {
      culler.cullObjects(objects);

      expect(objects[0].culled).toBe(false);
      expect(objects[1].culled).toBe(true);
      expect(objects[2].culled).toBe(false);
    });

    it('should filter visible objects', () => {
      const visible = culler.filterVisible(objects);

      expect(visible.length).toBe(2);
      expect(visible).toContain(objects[0]);
      expect(visible).not.toContain(objects[1]);
      expect(visible).toContain(objects[2]);
    });

    it('should handle objects without bounding volumes', () => {
      const objectsWithMissing: ICullable[] = [
        {
          worldBoundingBox: {
            min: { x: -1, y: -1, z: 50 },
            max: { x: 1, y: 1, z: 60 },
          },
        },
        {
          // 没有包围体
        },
      ];

      const stats = culler.cullObjects(objectsWithMissing);

      // 没有包围体的对象应该默认可见
      expect(stats.visible).toBe(1);
      expect(objectsWithMissing[1].culled).toBe(false);
    });

    it('should use bounding sphere when configured', () => {
      culler.setUseBoundingSphere(true);

      const objectsWithSphere: ICullable[] = [
        {
          worldBoundingSphere: {
            center: { x: 0, y: 0, z: -20 },
            radius: 5,
          },
        },
        {
          worldBoundingSphere: {
            center: { x: 0, y: 0, z: 50 },
            radius: 5,
          },
        },
      ];

      const stats = culler.cullObjects(objectsWithSphere);

      expect(stats.visible).toBe(1);
      expect(stats.culled).toBe(1);
    });

    it('should return all visible when disabled', () => {
      culler.setEnabled(false);

      const stats = culler.cullObjects(objects);

      expect(stats.visible).toBe(3);
      expect(stats.culled).toBe(0);
      expect(stats.fullyInside).toBe(3);
    });
  });
});
