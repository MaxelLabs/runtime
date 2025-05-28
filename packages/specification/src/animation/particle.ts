/**
 * Maxellabs 粒子系统模块
 * 粒子系统、发射器和物理的定义
 */

import type { BlendMode, RenderMode, SortMode } from '../core/enums';
import type { ValueRange, ColorRange, AnimationCurve, ColorCurve, VelocityCurve } from './curve';
import type { ParticlePhysics } from './particlePhysics';

/**
 * 粒子系统
 */
export interface ParticleSystem {
  /**
   * 系统名称
   */
  name: string;
  /**
   * 发射器
   */
  emitter: ParticleEmitter;
  /**
   * 粒子配置
   */
  particle: ParticleConfig;
  /**
   * 渲染配置
   */
  renderer: ParticleRenderer;
  /**
   * 物理配置
   */
  physics?: ParticlePhysics;
}

/**
 * 粒子发射器
 */
export interface ParticleEmitter {
  /**
   * 发射形状
   */
  shape: EmitterShape;
  /**
   * 发射速率
   */
  rate: number;
  /**
   * 爆发发射
   */
  bursts?: ParticleBurst[];
  /**
   * 生命周期
   */
  lifetime: number;
  /**
   * 循环
   */
  loop: boolean;
}

/**
 * 发射器形状
 */
export enum EmitterShape {
  Point = 'point',
  Line = 'line',
  Rectangle = 'rectangle',
  Circle = 'circle',
  Sphere = 'sphere',
  Box = 'box',
  Cone = 'cone',
}

/**
 * 粒子爆发
 */
export interface ParticleBurst {
  /**
   * 触发时间
   */
  time: number;
  /**
   * 粒子数量
   */
  count: number;
  /**
   * 重复次数
   */
  cycles: number;
  /**
   * 重复间隔
   */
  interval: number;
}

/**
 * 粒子配置
 */
export interface ParticleConfig {
  /**
   * 生命周期
   */
  lifetime: ValueRange;
  /**
   * 初始速度
   */
  startVelocity: ValueRange;
  /**
   * 初始大小
   */
  startSize: ValueRange;
  /**
   * 初始颜色
   */
  startColor: ColorRange;
  /**
   * 初始旋转
   */
  startRotation: ValueRange;
  /**
   * 大小变化
   */
  sizeOverLifetime?: AnimationCurve;
  /**
   * 颜色变化
   */
  colorOverLifetime?: ColorCurve;
  /**
   * 速度变化
   */
  velocityOverLifetime?: VelocityCurve;
  /**
   * 旋转变化
   */
  rotationOverLifetime?: AnimationCurve;
}

/**
 * 粒子渲染器
 */
export interface ParticleRenderer {
  /**
   * 渲染模式（使用core类型）
   */
  mode: RenderMode;
  /**
   * 材质
   */
  material: string;
  /**
   * 纹理
   */
  texture?: string;
  /**
   * 混合模式（使用core类型）
   */
  blendMode: BlendMode;
  /**
   * 排序模式
   */
  sortMode: SortMode;
}
