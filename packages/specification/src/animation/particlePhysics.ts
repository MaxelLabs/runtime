/**
 * Maxellabs 粒子物理模块
 * 粒子物理、碰撞和力场的定义
 */

import type { Vector3Like, RequiredEnableable } from '../core';

/**
 * 粒子物理
 */

export interface ParticlePhysics {
  /**
   * 重力 [x, y, z]
   */
  gravity: Vector3Like;
  /**
   * 阻尼
   */
  damping: number;
  /**
   * 碰撞
   */
  collision?: ParticleCollision;
  /**
   * 力场
   */
  forceFields?: ForceField[];
}

/**
 * 粒子碰撞
 *
 * @description 组合 RequiredEnableable trait
 */
export interface ParticleCollision extends RequiredEnableable {
  /**
   * 碰撞层
   */
  layers: string[];
  /**

   * 弹性系数
   */
  bounce: number;
  /**
   * 生命周期损失
   */
  lifetimeLoss: number;
}

/**
 * 力场
 */
export interface ForceField {
  /**
   * 力场类型
   */
  type: ForceFieldType;
  /**
   * 强度
   */
  strength: number;

  /**
   * 位置 [x, y, z]
   */
  position: [number, number, number];
  /**
   * 影响范围
   */
  range: number;
  /**
   * 衰减
   */
  falloff: number;
}

/**
 * 力场类型
 */
export enum ForceFieldType {
  Point = 'point',
  Directional = 'directional',
  Vortex = 'vortex',
  Turbulence = 'turbulence',
}
