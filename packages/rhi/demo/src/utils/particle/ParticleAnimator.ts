/**
 * particle/ParticleAnimator.ts
 * 粒子动画控制器
 *
 * 负责粒子的生命周期动画（颜色、大小、透明度渐变）。
 * 支持自定义动画曲线和力场效果。
 *
 * 核心特性：
 * - 颜色渐变（Color Over Lifetime）
 * - 大小渐变（Size Over Lifetime）
 * - 透明度渐变（Alpha Over Lifetime）
 * - 力场支持（重力、风力、涡流、吸引器）
 *
 * @example
 * ```typescript
 * const animator = new ParticleAnimator(particleBuffer, {
 *   colorOverLifetime: {
 *     start: new Float32Array([1, 1, 0, 1]), // 黄色
 *     end: new Float32Array([1, 0, 0, 0]),   // 红色透明
 *   },
 *   sizeOverLifetime: {
 *     start: 0.1,
 *     end: 0.5,
 *   },
 * });
 *
 * // 每帧更新
 * animator.update(deltaTime);
 * ```
 */

import type { ParticleBuffer } from './ParticleBuffer';
import type { ParticleAnimation, ForceField } from './types';

export class ParticleAnimator {
  private buffer: ParticleBuffer;
  private animation: ParticleAnimation;
  private forceFields: ForceField[] = [];

  /**
   * 创建粒子动画控制器
   *
   * @param buffer 粒子缓冲区
   * @param animation 动画配置
   */
  constructor(buffer: ParticleBuffer, animation: ParticleAnimation = {}) {
    this.buffer = buffer;
    this.animation = animation;
  }

  /**
   * 更新粒子动画（每帧调用）
   *
   * @param deltaTime 时间增量（秒）
   */
  update(deltaTime: number): void {
    const particles = this.buffer.getActiveParticles();

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];

      // 计算生命周期进度（0-1）
      const totalLife = particle.life + particle.age;
      const lifeProgress = totalLife > 0 ? particle.age / totalLife : 0;

      // 应用颜色渐变
      if (this.animation.colorOverLifetime) {
        this.applyColorGradient(particle, lifeProgress);
      }

      // 应用大小渐变
      if (this.animation.sizeOverLifetime) {
        this.applySizeGradient(particle, lifeProgress);
      }

      // 应用透明度渐变
      if (this.animation.alphaOverLifetime) {
        this.applyAlphaGradient(particle, lifeProgress);
      }
    }

    // 应用力场
    this.applyForceFields(deltaTime);
  }

  /**
   * 应用颜色渐变
   *
   * @param particle 粒子数据
   * @param t 生命周期进度（0-1）
   */
  private applyColorGradient(particle: any, t: number): void {
    const config = this.animation.colorOverLifetime!;
    const start = config.start;
    const end = config.end;

    // 线性插值
    particle.color[0] = start[0] + (end[0] - start[0]) * t;
    particle.color[1] = start[1] + (end[1] - start[1]) * t;
    particle.color[2] = start[2] + (end[2] - start[2]) * t;
    particle.color[3] = start[3] + (end[3] - start[3]) * t;
  }

  /**
   * 应用大小渐变
   *
   * @param particle 粒子数据
   * @param t 生命周期进度（0-1）
   */
  private applySizeGradient(particle: any, t: number): void {
    const config = this.animation.sizeOverLifetime!;
    const start = config.start;
    const end = config.end;

    // 线性插值
    particle.size = start + (end - start) * t;
  }

  /**
   * 应用透明度渐变
   *
   * @param particle 粒子数据
   * @param t 生命周期进度（0-1）
   */
  private applyAlphaGradient(particle: any, t: number): void {
    const config = this.animation.alphaOverLifetime!;
    const start = config.start;
    const end = config.end;

    // 线性插值
    particle.color[3] = start + (end - start) * t;
  }

  /**
   * 应用所有力场
   *
   * @param deltaTime 时间增量（秒）
   */
  private applyForceFields(deltaTime: number): void {
    for (const field of this.forceFields) {
      switch (field.type) {
        case 'gravity':
          this.applyGravity(field, deltaTime);
          break;
        case 'wind':
          this.applyWind(field, deltaTime);
          break;
        case 'vortex':
          this.applyVortex(field, deltaTime);
          break;
        case 'attractor':
          this.applyAttractor(field, deltaTime);
          break;
      }
    }
  }

  // 临时力向量（复用，避免在循环中创建新对象）
  private _tempForce = new Float32Array(3);

  /**
   * 应用重力力场
   *
   * @param field 力场配置
   * @param deltaTime 时间增量（秒）
   */
  private applyGravity(field: ForceField, deltaTime: number): void {
    this._tempForce[0] = 0;
    this._tempForce[1] = -field.strength;
    this._tempForce[2] = 0;
    this.buffer.applyForce(this._tempForce, deltaTime);
  }

  /**
   * 应用风力力场
   *
   * @param field 力场配置
   * @param deltaTime 时间增量（秒）
   */
  private applyWind(field: ForceField, deltaTime: number): void {
    if (!field.direction) {
      return;
    }

    this._tempForce[0] = field.direction[0] * field.strength;
    this._tempForce[1] = field.direction[1] * field.strength;
    this._tempForce[2] = field.direction[2] * field.strength;

    this.buffer.applyForce(this._tempForce, deltaTime);
  }

  /**
   * 应用涡流力场
   *
   * @param field 力场配置
   * @param deltaTime 时间增量（秒）
   */
  private applyVortex(field: ForceField, deltaTime: number): void {
    if (!field.position) {
      return;
    }

    const particles = this.buffer.getActiveParticles();
    const center = field.position;
    const radius = field.radius ?? 5.0;

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];

      // 计算到涡流中心的向量
      const dx = particle.position[0] - center[0];
      const dy = particle.position[1] - center[1];
      const dz = particle.position[2] - center[2];
      const distSq = dx * dx + dy * dy + dz * dz;

      // 只影响半径内的粒子
      if (distSq > radius * radius) {
        continue;
      }

      const dist = Math.sqrt(distSq);
      if (dist < 0.01) {
        continue;
      }

      // 计算切向力（垂直于径向）
      const tangentX = -dz;
      const tangentZ = dx;
      const tangentLength = Math.sqrt(tangentX * tangentX + tangentZ * tangentZ);

      if (tangentLength < 0.01) {
        continue;
      }

      // 归一化切向量
      const tx = tangentX / tangentLength;
      const tz = tangentZ / tangentLength;

      // 应用涡流力（强度随距离衰减）
      const falloff = 1.0 - dist / radius;
      const force = field.strength * falloff;

      particle.velocity[0] += tx * force * deltaTime;
      particle.velocity[2] += tz * force * deltaTime;
    }
  }

  /**
   * 应用吸引器力场
   *
   * @param field 力场配置
   * @param deltaTime 时间增量（秒）
   */
  private applyAttractor(field: ForceField, deltaTime: number): void {
    if (!field.position) {
      return;
    }

    const particles = this.buffer.getActiveParticles();
    const center = field.position;
    const radius = field.radius ?? 5.0;

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];

      // 计算到吸引器中心的向量
      const dx = center[0] - particle.position[0];
      const dy = center[1] - particle.position[1];
      const dz = center[2] - particle.position[2];
      const distSq = dx * dx + dy * dy + dz * dz;

      // 只影响半径内的粒子
      if (distSq > radius * radius) {
        continue;
      }

      const dist = Math.sqrt(distSq);
      if (dist < 0.01) {
        continue;
      }

      // 归一化方向向量
      const dirX = dx / dist;
      const dirY = dy / dist;
      const dirZ = dz / dist;

      // 应用吸引力（强度随距离衰减）
      const falloff = 1.0 - dist / radius;
      const force = field.strength * falloff;

      particle.velocity[0] += dirX * force * deltaTime;
      particle.velocity[1] += dirY * force * deltaTime;
      particle.velocity[2] += dirZ * force * deltaTime;
    }
  }

  /**
   * 添加力场
   *
   * @param field 力场配置
   */
  addForceField(field: ForceField): void {
    this.forceFields.push(field);
  }

  /**
   * 移除力场
   *
   * @param index 力场索引
   */
  removeForceField(index: number): void {
    if (index >= 0 && index < this.forceFields.length) {
      this.forceFields.splice(index, 1);
    }
  }

  /**
   * 清空所有力场
   */
  clearForceFields(): void {
    this.forceFields = [];
  }

  /**
   * 获取所有力场
   *
   * @returns 力场数组
   */
  getForceFields(): readonly ForceField[] {
    return this.forceFields;
  }

  /**
   * 更新动画配置
   *
   * @param animation 新动画配置（部分更新）
   */
  updateAnimation(animation: Partial<ParticleAnimation>): void {
    Object.assign(this.animation, animation);
  }

  /**
   * 获取动画配置
   *
   * @returns 当前动画配置
   */
  getAnimation(): ParticleAnimation {
    return this.animation;
  }
}
