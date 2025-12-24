/**
 * SceneEntityMetadata 模块测试
 * 测试场景实体元数据组件功能
 */

import { describe, it, expect } from '@jest/globals';
import { SceneEntityMetadata } from '../../src/scene/entity/scene-entity-metadata';

describe('SceneEntityMetadata', () => {
  describe('constructor', () => {
    it('应该创建具有默认值的元数据', () => {
      const metadata = new SceneEntityMetadata();

      expect(metadata.sceneId).toBe('');
      expect(metadata.active).toBe(true);
    });
  });

  describe('fromData', () => {
    it('应该从完整数据创建元数据', () => {
      const metadata = SceneEntityMetadata.fromData({
        sceneId: 'scene_1',
        active: false,
      });

      expect(metadata.sceneId).toBe('scene_1');
      expect(metadata.active).toBe(false);
    });

    it('应该从部分数据创建元数据（只有 sceneId）', () => {
      const metadata = SceneEntityMetadata.fromData({
        sceneId: 'scene_2',
      });

      expect(metadata.sceneId).toBe('scene_2');
      expect(metadata.active).toBe(true); // 默认值
    });

    it('应该从部分数据创建元数据（只有 active）', () => {
      const metadata = SceneEntityMetadata.fromData({
        active: false,
      });

      expect(metadata.sceneId).toBe(''); // 默认值
      expect(metadata.active).toBe(false);
    });

    it('应该从空数据创建元数据', () => {
      const metadata = SceneEntityMetadata.fromData({});

      expect(metadata.sceneId).toBe('');
      expect(metadata.active).toBe(true);
    });

    it('应该处理 active 为 true 的情况', () => {
      const metadata = SceneEntityMetadata.fromData({
        sceneId: 'scene_3',
        active: true,
      });

      expect(metadata.active).toBe(true);
    });

    it('应该处理空字符串 sceneId', () => {
      const metadata = SceneEntityMetadata.fromData({
        sceneId: '',
        active: true,
      });

      expect(metadata.sceneId).toBe('');
    });

    it('应该处理特殊字符的 sceneId', () => {
      const specialId = 'scene_测试_123!@#';
      const metadata = SceneEntityMetadata.fromData({
        sceneId: specialId,
      });

      expect(metadata.sceneId).toBe(specialId);
    });
  });

  describe('clone', () => {
    it('应该创建元数据的深拷贝', () => {
      const original = SceneEntityMetadata.fromData({
        sceneId: 'scene_1',
        active: false,
      });

      const cloned = original.clone();

      expect(cloned.sceneId).toBe('scene_1');
      expect(cloned.active).toBe(false);
    });

    it('克隆应该是独立的对象', () => {
      const original = SceneEntityMetadata.fromData({
        sceneId: 'scene_1',
        active: true,
      });

      const cloned = original.clone();

      // 修改克隆不应影响原始对象
      cloned.sceneId = 'scene_2';
      cloned.active = false;

      expect(original.sceneId).toBe('scene_1');
      expect(original.active).toBe(true);
    });

    it('应该克隆默认值的元数据', () => {
      const original = new SceneEntityMetadata();
      const cloned = original.clone();

      expect(cloned.sceneId).toBe('');
      expect(cloned.active).toBe(true);
    });

    it('克隆应该返回 SceneEntityMetadata 实例', () => {
      const original = new SceneEntityMetadata();
      const cloned = original.clone();

      expect(cloned).toBeInstanceOf(SceneEntityMetadata);
    });
  });

  describe('属性可修改性', () => {
    it('sceneId 应该可以修改', () => {
      const metadata = new SceneEntityMetadata();
      metadata.sceneId = 'new_scene';

      expect(metadata.sceneId).toBe('new_scene');
    });

    it('active 应该可以修改', () => {
      const metadata = new SceneEntityMetadata();
      metadata.active = false;

      expect(metadata.active).toBe(false);
    });

    it('应该支持多次修改', () => {
      const metadata = new SceneEntityMetadata();

      metadata.sceneId = 'scene_1';
      expect(metadata.sceneId).toBe('scene_1');

      metadata.sceneId = 'scene_2';
      expect(metadata.sceneId).toBe('scene_2');

      metadata.active = false;
      expect(metadata.active).toBe(false);

      metadata.active = true;
      expect(metadata.active).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('应该处理 undefined 值（fromData）', () => {
      const metadata = SceneEntityMetadata.fromData({
        sceneId: undefined,
        active: undefined,
      } as any);

      // undefined 不会覆盖默认值
      expect(metadata.sceneId).toBe('');
      expect(metadata.active).toBe(true);
    });

    it('应该处理非常长的 sceneId', () => {
      const longId = 'a'.repeat(1000);
      const metadata = SceneEntityMetadata.fromData({
        sceneId: longId,
      });

      expect(metadata.sceneId).toBe(longId);
    });
  });
});
