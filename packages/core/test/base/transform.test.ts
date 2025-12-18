/**
 * Transform 模块测试
 * 测试变换组件
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Transform } from '../../src/base/transform';
import { Entity } from '../../src/base/entity';
import { clearErrors, errors } from '../../src/base/errors';

describe('Transform - 变换组件', () => {
  let entity: Entity;
  let transform: Transform;

  beforeEach(() => {
    clearErrors();
    entity = new Entity('TestEntity', null, { syncTransformAwake: true });
    transform = entity.transform!;
  });

  describe('构造函数', () => {
    it('应该创建变换组件', () => {
      expect(transform).toBeInstanceOf(Transform);
      expect(transform.entity).toBe(entity);
    });

    it('应该有默认位置 (0, 0, 0)', () => {
      const pos = transform.getPosition();
      expect(pos.x).toBe(0);
      expect(pos.y).toBe(0);
      expect(pos.z).toBe(0);
    });

    it('应该有默认缩放 (1, 1, 1)', () => {
      const scale = transform.getScale();
      expect(scale.x).toBe(1);
      expect(scale.y).toBe(1);
      expect(scale.z).toBe(1);
    });

    it('应该有默认旋转 (单位四元数)', () => {
      const rot = transform.getRotation();
      expect(rot.x).toBe(0);
      expect(rot.y).toBe(0);
      expect(rot.z).toBe(0);
      expect(rot.w).toBe(1);
    });
  });

  describe('位置操作', () => {
    it('应该设置位置', () => {
      transform.setPositionXYZ(1, 2, 3);

      const pos = transform.getPosition();
      expect(pos.x).toBe(1);
      expect(pos.y).toBe(2);
      expect(pos.z).toBe(3);
    });

    it('应该获取世界位置', () => {
      transform.setPositionXYZ(1, 2, 3);

      const worldPos = transform.getWorldPosition();
      expect(worldPos.x).toBe(1);
      expect(worldPos.y).toBe(2);
      expect(worldPos.z).toBe(3);
    });
  });

  describe('缩放操作', () => {
    it('应该设置缩放', () => {
      transform.setScaleXYZ(2, 3, 4);

      const scale = transform.getScale();
      expect(scale.x).toBe(2);
      expect(scale.y).toBe(3);
      expect(scale.z).toBe(4);
    });
  });

  describe('旋转操作', () => {
    it('应该设置旋转四元数', () => {
      transform.setRotationQuaternion(0, 0, 0.707, 0.707);

      const rot = transform.getRotation();
      expect(rot.z).toBeCloseTo(0.707, 2);
      expect(rot.w).toBeCloseTo(0.707, 2);
    });

    it('应该从欧拉角设置旋转', () => {
      // setRotationFromEuler 接收角度值
      // 注意：setFromEuler 的实现可能使用不同的欧拉角顺序
      // 这里只验证旋转后四元数不是单位四元数
      transform.setRotationFromEuler(0, 90, 0);

      const rot = transform.getRotation();
      // 验证旋转已应用（不再是单位四元数）
      expect(rot.w).not.toBe(1);
      // 验证 y 分量有值（绕 Y 轴旋转）
      expect(Math.abs(rot.y)).toBeGreaterThan(0.5);
    });
  });

  describe('层级结构', () => {
    it('应该设置父级', () => {
      const parentEntity = new Entity('Parent', null, { syncTransformAwake: true });
      const parentTransform = parentEntity.transform!;

      transform.setParent(parentTransform);

      expect(transform.getParent()).toBe(parentTransform);
      expect(parentTransform.getChildren()).toContain(transform);
    });

    it('应该移除父级', () => {
      const parentEntity = new Entity('Parent', null, { syncTransformAwake: true });
      const parentTransform = parentEntity.transform!;

      transform.setParent(parentTransform);
      transform.setParent(null);

      expect(transform.getParent()).toBeNull();
      expect(parentTransform.getChildren()).not.toContain(transform);
    });

    it('应该检测循环引用', () => {
      const parentEntity = new Entity('Parent', null, { syncTransformAwake: true });
      const parentTransform = parentEntity.transform!;

      transform.setParent(parentTransform);

      // 尝试让父级成为子级的子级
      expect(() => {
        parentTransform.setParent(transform);
      }).toThrow();

      expect(errors.length).toBeGreaterThan(0);
    });

    it('应该添加子级', () => {
      const childEntity = new Entity('Child', null, { syncTransformAwake: true });
      const childTransform = childEntity.transform!;

      transform.addChild(childTransform);

      expect(transform.getChildren()).toContain(childTransform);
      expect(childTransform.getParent()).toBe(transform);
    });

    it('应该移除子级', () => {
      const childEntity = new Entity('Child', null, { syncTransformAwake: true });
      const childTransform = childEntity.transform!;

      transform.addChild(childTransform);
      transform.removeChild(childTransform);

      expect(transform.getChildren()).not.toContain(childTransform);
      expect(childTransform.getParent()).toBeNull();
    });
  });

  describe('世界变换', () => {
    it('应该计算世界位置（有父级）', () => {
      const parentEntity = new Entity('Parent', null, { syncTransformAwake: true });
      const parentTransform = parentEntity.transform!;

      parentTransform.setPositionXYZ(10, 0, 0);
      transform.setParent(parentTransform);
      transform.setPositionXYZ(5, 0, 0);

      const worldPos = transform.getWorldPosition();
      expect(worldPos.x).toBeCloseTo(15, 5);
    });

    it('应该计算世界缩放（有父级）', () => {
      const parentEntity = new Entity('Parent', null, { syncTransformAwake: true });
      const parentTransform = parentEntity.transform!;

      parentTransform.setScaleXYZ(2, 2, 2);
      transform.setParent(parentTransform);
      transform.setScaleXYZ(3, 3, 3);

      const worldScale = transform.getWorldScale();
      expect(worldScale.x).toBeCloseTo(6, 5);
      expect(worldScale.y).toBeCloseTo(6, 5);
      expect(worldScale.z).toBeCloseTo(6, 5);
    });
  });

  describe('方向向量', () => {
    it('应该获取前方向', () => {
      const forward = transform.getForward();
      expect(forward.z).toBeCloseTo(-1, 5);
    });

    it('应该获取上方向', () => {
      const up = transform.getUp();
      expect(up.y).toBeCloseTo(1, 5);
    });

    it('应该获取右方向', () => {
      const right = transform.getRight();
      expect(right.x).toBeCloseTo(1, 5);
    });
  });

  describe('矩阵操作', () => {
    it('应该获取本地矩阵', () => {
      transform.setPositionXYZ(1, 2, 3);

      const localMatrix = transform.getLocalMatrix();
      expect(localMatrix).toBeDefined();
    });

    it('应该获取世界矩阵', () => {
      transform.setPositionXYZ(1, 2, 3);

      const worldMatrix = transform.getWorldMatrix();
      expect(worldMatrix).toBeDefined();
    });
  });

  describe('平移操作', () => {
    it('应该在世界空间平移', () => {
      transform.setPositionXYZ(0, 0, 0);
      transform.translateForward(10);

      const pos = transform.getPosition();
      expect(pos.z).toBeCloseTo(-10, 5);
    });

    it('应该在本地空间平移', () => {
      transform.setPositionXYZ(0, 0, 0);
      transform.translateLocal(1, 0, 0);

      const pos = transform.getPosition();
      expect(pos.x).toBeCloseTo(1, 5);
    });
  });

  describe('旋转操作', () => {
    it('应该绕世界Y轴旋转', () => {
      transform.rotateWorldY(Math.PI / 2);

      const rot = transform.getRotation();
      expect(rot.y).toBeCloseTo(0.707, 2);
    });

    it('应该绕本地Y轴旋转', () => {
      transform.rotateLocalY(Math.PI / 2);

      const rot = transform.getRotation();
      expect(rot.y).toBeCloseTo(0.707, 2);
    });
  });

  describe('dispose - 释放', () => {
    it('应该释放变换组件', () => {
      transform.dispose();

      expect(transform.isDisposed()).toBe(true);
    });

    it('释放时应该移除所有子级', () => {
      const childEntity = new Entity('Child', null, { syncTransformAwake: true });
      const childTransform = childEntity.transform!;

      transform.addChild(childTransform);
      transform.dispose();

      expect(childTransform.getParent()).toBeNull();
    });

    it('释放时应该从父级移除', () => {
      const parentEntity = new Entity('Parent', null, { syncTransformAwake: true });
      const parentTransform = parentEntity.transform!;

      transform.setParent(parentTransform);
      transform.dispose();

      expect(parentTransform.getChildren()).not.toContain(transform);
    });
  });

  describe('isDirty - 脏标记', () => {
    it('初始状态应该是脏的', () => {
      expect(transform.isDirty()).toBe(true);
    });

    it('更新矩阵后应该不脏', () => {
      transform.getWorldMatrix();
      transform.getForward();

      expect(transform.isDirty()).toBe(false);
    });

    it('修改位置后应该变脏', () => {
      transform.getWorldMatrix();
      transform.setPositionXYZ(1, 2, 3);

      expect(transform.isDirty()).toBe(true);
    });
  });
});
