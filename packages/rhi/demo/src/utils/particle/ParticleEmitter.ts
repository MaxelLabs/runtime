/**
 * particle/ParticleEmitter.ts
 * 粒子发射器
 *
 * 负责根据配置生成新粒子。
 * 支持多种发射形状：点、盒、球、锥。
 *
 * 核心特性：
 * - 多种发射形状（point, box, sphere, cone）
 * - 速度和颜色随机变化
 * - 生命周期随机变化
 * - 发射速率控制
 *
 * @example
 * ```typescript
 * const emitter = new ParticleEmitter(particleBuffer, {
 *   shape: 'sphere',
 *   rate: 100, // 100 particles/sec
 *   lifetime: 5.0,
 *   velocity: new Float32Array([0, 5, 0]),
 *   velocityVariance: new Float32Array([2, 1, 2]),
 *   color: new Float32Array([1, 0.5, 0, 1]),
 *   size: 0.1,
 *   emitterSize: new Float32Array([1, 1, 1]),
 * });
 *
 * // 每帧更新
 * emitter.update(deltaTime);
 * ```
 */

import type { ParticleBuffer } from './ParticleBuffer';
import type { EmitterConfig } from './types';

export class ParticleEmitter {
  private buffer: ParticleBuffer;
  private config: EmitterConfig;

  // 发射控制
  private emissionAccumulator: number = 0;
  private position: Float32Array;

  /**
   * 创建粒子发射器
   *
   * @param buffer 粒子缓冲区
   * @param config 发射器配置
   */
  constructor(buffer: ParticleBuffer, config: EmitterConfig) {
    this.buffer = buffer;
    this.config = config;
    this.position = config.position ?? new Float32Array([0, 0, 0]);
  }

  /**
   * 更新发射器（每帧调用）
   *
   * @param deltaTime 时间增量（秒）
   */
  update(deltaTime: number): void {
    // 计算本帧应发射的粒子数
    this.emissionAccumulator += this.config.rate * deltaTime;
    const particlesToEmit = Math.floor(this.emissionAccumulator);
    this.emissionAccumulator -= particlesToEmit;

    // 发射粒子
    for (let i = 0; i < particlesToEmit; i++) {
      this.emitParticle();
    }
  }

  /**
   * 发射单个粒子
   */
  private emitParticle(): void {
    const particle = this.buffer.activateParticle();
    if (!particle) {
      return; // 粒子池已满
    }

    // 设置位置（根据发射器形状）
    this.sampleEmissionShape(particle.position);

    // 设置速度（基础速度 + 随机变化）
    particle.velocity[0] = this.config.velocity[0] + this.randomVariance(this.config.velocityVariance?.[0] ?? 0);
    particle.velocity[1] = this.config.velocity[1] + this.randomVariance(this.config.velocityVariance?.[1] ?? 0);
    particle.velocity[2] = this.config.velocity[2] + this.randomVariance(this.config.velocityVariance?.[2] ?? 0);

    // 设置颜色（基础颜色 + 随机变化）
    particle.color[0] = Math.max(
      0,
      Math.min(1, this.config.color[0] + this.randomVariance(this.config.colorVariance?.[0] ?? 0))
    );
    particle.color[1] = Math.max(
      0,
      Math.min(1, this.config.color[1] + this.randomVariance(this.config.colorVariance?.[1] ?? 0))
    );
    particle.color[2] = Math.max(
      0,
      Math.min(1, this.config.color[2] + this.randomVariance(this.config.colorVariance?.[2] ?? 0))
    );
    particle.color[3] = Math.max(
      0,
      Math.min(1, this.config.color[3] + this.randomVariance(this.config.colorVariance?.[3] ?? 0))
    );

    // 设置生命周期（基础生命周期 + 随机变化）
    const lifetimeVariance = this.config.lifetimeVariance ?? 0;
    particle.life = this.config.lifetime * (1 + this.randomVariance(lifetimeVariance));

    // 设置大小（基础大小 + 随机变化）
    const sizeVariance = this.config.sizeVariance ?? 0;
    particle.size = this.config.size * (1 + this.randomVariance(sizeVariance));

    // 重置年龄
    particle.age = 0;
  }

  /**
   * 根据发射器形状采样位置
   *
   * @param outPosition 输出位置（vec3）
   */
  private sampleEmissionShape(outPosition: Float32Array): void {
    switch (this.config.shape) {
      case 'point':
        this.samplePoint(outPosition);
        break;
      case 'box':
        this.sampleBox(outPosition);
        break;
      case 'sphere':
        this.sampleSphere(outPosition);
        break;
      case 'cone':
        this.sampleCone(outPosition);
        break;
      default:
        this.samplePoint(outPosition);
    }
  }

  /**
   * 点发射器（所有粒子从同一点发射）
   */
  private samplePoint(outPosition: Float32Array): void {
    outPosition[0] = this.position[0];
    outPosition[1] = this.position[1];
    outPosition[2] = this.position[2];
  }

  /**
   * 盒发射器（在盒内随机位置发射）
   */
  private sampleBox(outPosition: Float32Array): void {
    const size = this.config.emitterSize ?? new Float32Array([1, 1, 1]);
    outPosition[0] = this.position[0] + (Math.random() - 0.5) * size[0];
    outPosition[1] = this.position[1] + (Math.random() - 0.5) * size[1];
    outPosition[2] = this.position[2] + (Math.random() - 0.5) * size[2];
  }

  /**
   * 球发射器（在球面上随机位置发射）
   */
  private sampleSphere(outPosition: Float32Array): void {
    const radius = this.config.emitterSize?.[0] ?? 1.0;

    // 均匀球面采样（Marsaglia 方法）
    let x, y, z, lengthSq;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
      lengthSq = x * x + y * y + z * z;
    } while (lengthSq > 1 || lengthSq < 0.01);

    const invLength = radius / Math.sqrt(lengthSq);
    outPosition[0] = this.position[0] + x * invLength;
    outPosition[1] = this.position[1] + y * invLength;
    outPosition[2] = this.position[2] + z * invLength;
  }

  /**
   * 锥发射器（在锥体内随机位置发射）
   */
  private sampleCone(outPosition: Float32Array): void {
    const height = this.config.emitterSize?.[1] ?? 1.0;
    const radius = this.config.emitterSize?.[0] ?? 0.5;

    // 在圆锥内随机采样
    const t = Math.random(); // 高度参数 [0, 1]
    const angle = Math.random() * Math.PI * 2; // 角度 [0, 2π]
    const r = Math.sqrt(Math.random()) * radius * t; // 半径（随高度线性变化）

    outPosition[0] = this.position[0] + r * Math.cos(angle);
    outPosition[1] = this.position[1] + t * height;
    outPosition[2] = this.position[2] + r * Math.sin(angle);
  }

  /**
   * 生成随机变化值（范围 [-variance, +variance]）
   *
   * @param variance 变化范围
   * @returns 随机值
   */
  private randomVariance(variance: number): number {
    return (Math.random() - 0.5) * 2 * variance;
  }

  /**
   * 设置发射器位置
   *
   * @param position 新位置（vec3）
   */
  setPosition(position: Float32Array): void {
    this.position[0] = position[0];
    this.position[1] = position[1];
    this.position[2] = position[2];
  }

  /**
   * 获取发射器位置
   *
   * @returns 位置（vec3）
   */
  getPosition(): Float32Array {
    return this.position;
  }

  /**
   * 更新发射器配置
   *
   * @param config 新配置（部分更新）
   */
  updateConfig(config: Partial<EmitterConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * 获取发射器配置
   *
   * @returns 当前配置
   */
  getConfig(): EmitterConfig {
    return this.config;
  }

  /**
   * 立即发射指定数量的粒子（爆发模式）
   *
   * @param count 粒子数量
   */
  burst(count: number): void {
    for (let i = 0; i < count; i++) {
      this.emitParticle();
    }
  }

  /**
   * 重置发射器状态
   */
  reset(): void {
    this.emissionAccumulator = 0;
  }
}
