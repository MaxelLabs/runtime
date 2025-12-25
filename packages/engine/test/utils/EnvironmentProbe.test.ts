/**
 * EnvironmentProbe 单元测试
 *
 * 测试环境探针的核心功能：创建、球谐光照、范围检测、序列化。
 */

import { describe, it, expect } from '@jest/globals';
import { EnvironmentProbe, ProbeType, ProbeUpdateMode, ProbeState } from '../../src/utils/EnvironmentProbe';

describe('EnvironmentProbe', () => {
  // ========================================
  // 创建和初始化
  // ========================================

  describe('Creation', () => {
    it('should create probe with default values', () => {
      const probe = new EnvironmentProbe();

      expect(probe.type).toBe(ProbeType.Combined);
      expect(probe.updateMode).toBe(ProbeUpdateMode.Manual);
      expect(probe.resolution).toBe(128);
      expect(probe.range).toBe(50);
      expect(probe.intensity).toBe(1.0);
      expect(probe.enabled).toBe(true);
    });

    it('should create probe with custom config', () => {
      const probe = new EnvironmentProbe({
        position: { x: 10, y: 20, z: 30 },
        type: ProbeType.Reflection,
        resolution: 256,
        range: 100,
        intensity: 0.5,
      });

      expect(probe.position.x).toBe(10);
      expect(probe.position.y).toBe(20);
      expect(probe.position.z).toBe(30);
      expect(probe.type).toBe(ProbeType.Reflection);
      expect(probe.resolution).toBe(256);
      expect(probe.range).toBe(100);
      expect(probe.intensity).toBe(0.5);
    });

    it('should generate unique ID', () => {
      const probe1 = new EnvironmentProbe();
      const probe2 = new EnvironmentProbe();

      expect(probe1.id).toBeDefined();
      expect(probe2.id).toBeDefined();
      expect(probe1.id).not.toBe(probe2.id);
    });

    it('should create sky probe with gradient', () => {
      const probe = EnvironmentProbe.createSkyProbe(
        { x: 0.5, y: 0.7, z: 1.0 }, // sky color
        { x: 0.2, y: 0.2, z: 0.2 } // ground color
      );

      expect(probe.type).toBe(ProbeType.Irradiance);
      expect(probe.state).toBe(ProbeState.Ready);
      expect(probe.isDirty).toBe(false);
    });
  });

  // ========================================
  // 状态管理
  // ========================================

  describe('State Management', () => {
    it('should start in uninitialized state', () => {
      const probe = new EnvironmentProbe();
      expect(probe.state).toBe(ProbeState.Uninitialized);
    });

    it('should mark dirty when requested', () => {
      const probe = new EnvironmentProbe();
      probe.markDirty();

      expect(probe.isDirty).toBe(true);
      expect(probe.state).toBe(ProbeState.NeedsUpdate);
    });

    it('should mark updated when completed', () => {
      const probe = new EnvironmentProbe();
      probe.markDirty();
      probe.markUpdated();

      expect(probe.isDirty).toBe(false);
      expect(probe.state).toBe(ProbeState.Ready);
      expect(probe.lastUpdateTime).toBeGreaterThan(0);
    });

    it('should transition to disposed state', () => {
      const probe = new EnvironmentProbe();
      probe.dispose();

      expect(probe.state).toBe(ProbeState.Disposed);
    });
  });

  // ========================================
  // 配置方法
  // ========================================

  describe('Configuration', () => {
    it('should set position', () => {
      const probe = new EnvironmentProbe();
      probe.setPosition({ x: 100, y: 200, z: 300 });

      expect(probe.position.x).toBe(100);
      expect(probe.position.y).toBe(200);
      expect(probe.position.z).toBe(300);
      expect(probe.isDirty).toBe(true);
    });

    it('should set range', () => {
      const probe = new EnvironmentProbe();
      probe.setRange(200);

      expect(probe.range).toBe(200);
      expect(probe.isDirty).toBe(true);
    });

    it('should clamp negative range to zero', () => {
      const probe = new EnvironmentProbe();
      probe.setRange(-10);

      expect(probe.range).toBe(0);
    });

    it('should set intensity', () => {
      const probe = new EnvironmentProbe();
      probe.setIntensity(2.0);

      expect(probe.intensity).toBe(2.0);
    });

    it('should clamp negative intensity to zero', () => {
      const probe = new EnvironmentProbe();
      probe.setIntensity(-1.0);

      expect(probe.intensity).toBe(0);
    });

    it('should set enabled state', () => {
      const probe = new EnvironmentProbe();
      probe.setEnabled(false);

      expect(probe.enabled).toBe(false);
    });
  });

  // ========================================
  // 球谐系数
  // ========================================

  describe('Spherical Harmonics', () => {
    it('should set spherical harmonics coefficients', () => {
      const probe = new EnvironmentProbe();
      const coefficients = Array(9)
        .fill(null)
        .map((_, i) => ({ x: i, y: i, z: i }));

      probe.setSphericalHarmonics(coefficients);

      const sh = probe.getSphericalHarmonics();
      expect(sh.coefficients.length).toBe(9);
      expect(sh.coefficients[0].x).toBe(0);
      expect(sh.coefficients[8].x).toBe(8);
    });

    it('should set solid color spherical harmonics', () => {
      const probe = new EnvironmentProbe();
      probe.setSolidColorSH({ x: 1, y: 0.5, z: 0.25 });

      const sh = probe.getSphericalHarmonics();

      // L0 应该是颜色
      expect(sh.coefficients[0].x).toBe(1);
      expect(sh.coefficients[0].y).toBe(0.5);
      expect(sh.coefficients[0].z).toBe(0.25);

      // 其他系数应该是 0
      for (let i = 1; i < 9; i++) {
        expect(sh.coefficients[i].x).toBe(0);
        expect(sh.coefficients[i].y).toBe(0);
        expect(sh.coefficients[i].z).toBe(0);
      }
    });

    it('should set gradient spherical harmonics', () => {
      const probe = new EnvironmentProbe();
      probe.setGradientSH({ x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 });

      const sh = probe.getSphericalHarmonics();

      // L0 应该是平均值
      expect(sh.coefficients[0].x).toBe(0.5);
      expect(sh.coefficients[0].y).toBe(0.5);
      expect(sh.coefficients[0].z).toBe(0.5);

      // L1 Y 应该是差异
      expect(sh.coefficients[2].x).toBe(0.5);
    });

    it('getSphericalHarmonics should return deep copy', () => {
      const probe = new EnvironmentProbe();
      probe.setSolidColorSH({ x: 1, y: 1, z: 1 });

      const sh = probe.getSphericalHarmonics();
      sh.coefficients[0].x = 999;

      const sh2 = probe.getSphericalHarmonics();
      expect(sh2.coefficients[0].x).toBe(1);
    });
  });

  // ========================================
  // 辐照度采样
  // ========================================

  describe('Irradiance Sampling', () => {
    it('should sample irradiance in up direction', () => {
      const probe = EnvironmentProbe.createSkyProbe({ x: 0.8, y: 0.9, z: 1.0 }, { x: 0.2, y: 0.2, z: 0.2 });

      // 采样向上方向
      const upIrradiance = probe.sampleIrradiance({ x: 0, y: 1, z: 0 });

      // 应该接近天空颜色
      expect(upIrradiance.x).toBeGreaterThan(0.4);
      expect(upIrradiance.y).toBeGreaterThan(0.4);
      expect(upIrradiance.z).toBeGreaterThan(0.4);
    });

    it('should sample irradiance in down direction', () => {
      const probe = EnvironmentProbe.createSkyProbe({ x: 0.8, y: 0.9, z: 1.0 }, { x: 0.2, y: 0.2, z: 0.2 });

      // 采样向下方向
      const downIrradiance = probe.sampleIrradiance({ x: 0, y: -1, z: 0 });

      // 应该接近地面颜色
      expect(downIrradiance.x).toBeLessThan(0.5);
      expect(downIrradiance.y).toBeLessThan(0.5);
      expect(downIrradiance.z).toBeLessThan(0.5);
    });

    it('should apply intensity to irradiance', () => {
      const probe = new EnvironmentProbe({ intensity: 2.0 });
      probe.setSolidColorSH({ x: 0.5, y: 0.5, z: 0.5 });

      const irradiance = probe.sampleIrradiance({ x: 0, y: 1, z: 0 });

      // 强度为 2.0，所以应该是基础值的 2 倍
      expect(irradiance.x).toBeGreaterThan(0);
    });

    it('should clamp negative irradiance to zero', () => {
      const probe = new EnvironmentProbe();
      // 设置一些可能产生负值的系数
      probe.setSphericalHarmonics([
        { x: -1, y: -1, z: -1 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
      ]);

      const irradiance = probe.sampleIrradiance({ x: 0, y: 1, z: 0 });

      expect(irradiance.x).toBeGreaterThanOrEqual(0);
      expect(irradiance.y).toBeGreaterThanOrEqual(0);
      expect(irradiance.z).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================
  // 范围和权重
  // ========================================

  describe('Range and Weight', () => {
    it('should detect point inside range', () => {
      const probe = new EnvironmentProbe({
        position: { x: 0, y: 0, z: 0 },
        range: 10,
      });

      expect(probe.containsPoint({ x: 5, y: 0, z: 0 })).toBe(true);
      expect(probe.containsPoint({ x: 15, y: 0, z: 0 })).toBe(false);
    });

    it('should return false when disabled', () => {
      const probe = new EnvironmentProbe({
        position: { x: 0, y: 0, z: 0 },
        range: 10,
      });
      probe.setEnabled(false);

      expect(probe.containsPoint({ x: 5, y: 0, z: 0 })).toBe(false);
    });

    it('should calculate weight based on distance', () => {
      const probe = new EnvironmentProbe({
        position: { x: 0, y: 0, z: 0 },
        range: 10,
        intensity: 1.0,
      });

      // 在中心，权重应该是 1.0
      expect(probe.getWeight({ x: 0, y: 0, z: 0 })).toBe(1.0);

      // 在边缘，权重应该接近 0
      expect(probe.getWeight({ x: 10, y: 0, z: 0 })).toBeCloseTo(0, 5);

      // 在一半距离，权重应该是 0.5
      expect(probe.getWeight({ x: 5, y: 0, z: 0 })).toBeCloseTo(0.5, 5);
    });

    it('should return zero weight when outside range', () => {
      const probe = new EnvironmentProbe({
        position: { x: 0, y: 0, z: 0 },
        range: 10,
      });

      expect(probe.getWeight({ x: 20, y: 0, z: 0 })).toBe(0);
    });

    it('should return zero weight when disabled', () => {
      const probe = new EnvironmentProbe({
        position: { x: 0, y: 0, z: 0 },
        range: 10,
      });
      probe.setEnabled(false);

      expect(probe.getWeight({ x: 0, y: 0, z: 0 })).toBe(0);
    });

    it('should use box projection when enabled', () => {
      const probe = new EnvironmentProbe({
        position: { x: 0, y: 0, z: 0 },
        boxProjection: true,
        bounds: {
          min: { x: -5, y: -5, z: -5 },
          max: { x: 5, y: 5, z: 5 },
        },
      });

      // 在盒子内
      expect(probe.containsPoint({ x: 3, y: 3, z: 3 })).toBe(true);

      // 在盒子外
      expect(probe.containsPoint({ x: 10, y: 0, z: 0 })).toBe(false);
    });
  });

  // ========================================
  // 序列化
  // ========================================

  describe('Serialization', () => {
    it('should serialize to data', () => {
      const probe = new EnvironmentProbe({
        position: { x: 1, y: 2, z: 3 },
        type: ProbeType.Reflection,
        resolution: 256,
        range: 100,
      });
      probe.setSolidColorSH({ x: 0.5, y: 0.5, z: 0.5 });

      const data = probe.toData();

      expect(data.id).toBe(probe.id);
      expect(data.position?.x).toBe(1);
      expect(data.position?.y).toBe(2);
      expect(data.position?.z).toBe(3);
      expect(data.type).toBe(ProbeType.Reflection);
      expect(data.resolution).toBe(256);
      expect(data.range).toBe(100);
      expect(data.shCoefficients).toBeDefined();
      expect(data.shCoefficients?.length).toBe(9);
    });

    it('should deserialize from data', () => {
      const originalProbe = new EnvironmentProbe({
        position: { x: 1, y: 2, z: 3 },
        type: ProbeType.Irradiance,
        resolution: 512,
      });
      originalProbe.setSolidColorSH({ x: 0.8, y: 0.6, z: 0.4 });

      const data = originalProbe.toData();
      const restoredProbe = EnvironmentProbe.fromData(data);

      expect(restoredProbe.id).toBe(originalProbe.id);
      expect(restoredProbe.position.x).toBe(1);
      expect(restoredProbe.type).toBe(ProbeType.Irradiance);
      expect(restoredProbe.resolution).toBe(512);

      // 球谐系数应该恢复
      const originalSH = originalProbe.getSphericalHarmonics();
      const restoredSH = restoredProbe.getSphericalHarmonics();

      expect(restoredSH.coefficients[0].x).toBeCloseTo(originalSH.coefficients[0].x, 5);
    });

    it('clone should create independent copy', () => {
      const original = new EnvironmentProbe({
        position: { x: 10, y: 20, z: 30 },
        range: 100,
      });

      const cloned = original.clone();

      // 修改克隆不应影响原始
      cloned.setPosition({ x: 999, y: 999, z: 999 });
      cloned.setRange(999);

      expect(original.position.x).toBe(10);
      expect(original.range).toBe(100);
    });
  });

  // ========================================
  // 边界条件
  // ========================================

  describe('Edge Cases', () => {
    it('should handle partial config gracefully', () => {
      const probe = new EnvironmentProbe({
        position: { x: 1, y: 2, z: 3 },
        // 其他使用默认值
      });

      expect(probe.position.x).toBe(1);
      expect(probe.range).toBe(50); // 默认值
    });

    it('should handle fromData with missing shCoefficients', () => {
      const probe = EnvironmentProbe.fromData({
        position: { x: 0, y: 0, z: 0 },
        // 没有 shCoefficients
      });

      expect(probe.state).toBe(ProbeState.Uninitialized);
    });

    it('should handle fromData with partial shCoefficients', () => {
      const probe = EnvironmentProbe.fromData({
        shCoefficients: [
          [1, 0, 0],
          [0, 1, 0],
          // 只有 2 个，不足 9 个
        ],
      });

      // 应该不崩溃，但也不会标记为 Ready
      expect(probe).toBeDefined();
    });
  });
});
