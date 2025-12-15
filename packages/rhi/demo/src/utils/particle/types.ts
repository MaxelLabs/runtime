/**
 * particle/types.ts
 * 粒子系统类型定义
 *
 * 定义粒子系统的核心数据结构和配置选项。
 * 遵循 std140 对齐规则，确保 GPU 数据布局正确。
 */

import type { MSpec } from '@maxellabs/core';

/**
 * 粒子发射器形状类型
 */
export type EmitterShape = 'point' | 'box' | 'sphere' | 'cone';

/**
 * 粒子数据（单个粒子的完整状态）
 * 内存布局（std140 对齐）：
 * [0-15]   vec3 position + padding (16 bytes)
 * [16-31]  vec3 velocity + padding (16 bytes)
 * [32-47]  vec4 color (16 bytes)
 * [48-51]  float life (4 bytes)
 * [52-55]  float size (4 bytes)
 * [56-59]  float age (4 bytes)
 * [60-63]  padding (4 bytes)
 * Total: 64 bytes per particle
 */
export interface ParticleData {
  /** 位置 (vec3) */
  position: Float32Array; // 3 floats
  /** 速度 (vec3) */
  velocity: Float32Array; // 3 floats
  /** 颜色 (vec4) */
  color: Float32Array; // 4 floats
  /** 剩余生命周期（秒） */
  life: number;
  /** 粒子大小 */
  size: number;
  /** 已存活时间（秒） */
  age: number;
}

/**
 * 粒子发射器配置
 */
export interface EmitterConfig {
  /** 发射器形状 */
  shape: EmitterShape;
  /** 发射速率（粒子/秒） */
  rate: number;
  /** 粒子生命周期（秒） */
  lifetime: number;
  /** 生命周期随机范围（0-1） */
  lifetimeVariance?: number;
  /** 初始速度 */
  velocity: Float32Array; // vec3
  /** 速度随机范围 */
  velocityVariance?: Float32Array; // vec3
  /** 初始颜色 */
  color: Float32Array; // vec4
  /** 颜色随机范围 */
  colorVariance?: Float32Array; // vec4
  /** 初始大小 */
  size: number;
  /** 大小随机范围（0-1） */
  sizeVariance?: number;
  /** 发射器位置 */
  position?: Float32Array; // vec3
  /** 发射器尺寸（box/sphere/cone 使用） */
  emitterSize?: Float32Array; // vec3
}

/**
 * 粒子系统配置选项
 */
export interface ParticleOptions {
  /** 最大粒子数，默认 10000 */
  maxParticles?: number;
  /** 发射器配置 */
  emitter: EmitterConfig;
  /** 重力加速度（vec3），默认 [0, -9.8, 0] */
  gravity?: Float32Array;
  /** 是否启用粒子回收，默认 true */
  recycleParticles?: boolean;
  /** 资源标签，用于调试 */
  label?: string;
}

/**
 * 粒子系统统计信息
 */
export interface ParticleStats {
  /** 当前激活的粒子数 */
  activeCount: number;
  /** 最大粒子数 */
  maxParticles: number;
  /** 缓冲区使用率（0.0 - 1.0） */
  usage: number;
  /** GPU 缓冲区总大小（字节） */
  bufferSize: number;
  /** 每粒子数据大小（字节） */
  strideBytes: number;
  /** 累计发射的粒子数 */
  totalEmitted: number;
  /** 累计回收的粒子数 */
  totalRecycled: number;
}

/**
 * 粒子力场类型
 */
export type ForceFieldType = 'gravity' | 'wind' | 'vortex' | 'attractor';

/**
 * 粒子力场配置
 */
export interface ForceField {
  /** 力场类型 */
  type: ForceFieldType;
  /** 力场强度 */
  strength: number;
  /** 力场位置（attractor/vortex 使用） */
  position?: Float32Array; // vec3
  /** 力场方向（wind 使用） */
  direction?: Float32Array; // vec3
  /** 影响半径（attractor/vortex 使用） */
  radius?: number;
}

/**
 * 粒子生命周期动画配置
 */
export interface ParticleAnimation {
  /** 颜色渐变（生命周期 0-1 映射到颜色） */
  colorOverLifetime?: {
    start: Float32Array; // vec4
    end: Float32Array; // vec4
  };
  /** 大小渐变（生命周期 0-1 映射到大小） */
  sizeOverLifetime?: {
    start: number;
    end: number;
  };
  /** 透明度渐变（生命周期 0-1 映射到 alpha） */
  alphaOverLifetime?: {
    start: number;
    end: number;
  };
}

/**
 * 粒子属性布局（用于实例化渲染）
 * 每个粒子作为一个实例渲染
 *
 * 实例数据布局（std140 对齐）：
 * [0-15]   vec3 position + padding (16 bytes)
 * [16-31]  vec4 color (16 bytes)
 * [32-35]  float size (4 bytes)
 * [36-39]  padding (4 bytes)
 * Total: 40 bytes per instance
 */
export const PARTICLE_INSTANCE_STRIDE = 40; // bytes

/**
 * 获取粒子实例属性布局
 *
 * @param baseLocation 起始 location，默认 2
 * @returns 实例属性布局数组
 */
export function getParticleInstanceLayout(baseLocation: number = 2) {
  return [
    // vec3 position (需要 padding 到 16 bytes)
    {
      name: 'instancePosition',
      location: baseLocation,
      format: 'float32x3' as MSpec.RHIVertexFormat,
      offset: 0,
    },
    // vec4 color
    {
      name: 'instanceColor',
      location: baseLocation + 1,
      format: 'float32x4' as MSpec.RHIVertexFormat,
      offset: 16,
    },
    // float size
    {
      name: 'instanceSize',
      location: baseLocation + 2,
      format: 'float32' as MSpec.RHIVertexFormat,
      offset: 32,
    },
  ];
}

/**
 * 粒子数据内存布局常量
 */
export const PARTICLE_DATA_LAYOUT = {
  /** 位置偏移（字节） */
  POSITION_OFFSET: 0,
  /** 速度偏移（字节） */
  VELOCITY_OFFSET: 16,
  /** 颜色偏移（字节） */
  COLOR_OFFSET: 32,
  /** 生命周期偏移（字节） */
  LIFE_OFFSET: 48,
  /** 大小偏移（字节） */
  SIZE_OFFSET: 52,
  /** 年龄偏移（字节） */
  AGE_OFFSET: 56,
  /** 每粒子数据大小（字节） */
  STRIDE: 64,
} as const;
