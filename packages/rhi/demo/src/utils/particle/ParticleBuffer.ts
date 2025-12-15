/**
 * particle/ParticleBuffer.ts
 * 粒子数据缓冲区管理器
 *
 * 负责管理粒子系统的 CPU 和 GPU 数据缓冲区。
 * 使用对象池模式预分配粒子，避免运行时内存分配。
 *
 * 核心特性：
 * - 预分配粒子池（默认 10000 个粒子）
 * - 高效的粒子激活/回收机制（swap-and-pop）
 * - 双缓冲 GPU 数据更新
 * - 详细的统计信息
 *
 * 内存布局（std140 对齐）：
 * 每个粒子 64 bytes：
 * [0-15]   vec3 position + padding
 * [16-31]  vec3 velocity + padding
 * [32-47]  vec4 color
 * [48-51]  float life
 * [52-55]  float size
 * [56-59]  float age
 * [60-63]  padding
 *
 * @example
 * ```typescript
 * const buffer = runner.track(new ParticleBuffer(runner.device, {
 *   maxParticles: 10000,
 *   label: 'MyParticleBuffer',
 * }));
 *
 * // 激活新粒子
 * const particle = buffer.activateParticle();
 * particle.position.set([0, 0, 0]);
 * particle.velocity.set([1, 2, 0]);
 * particle.color.set([1, 0, 0, 1]);
 * particle.life = 5.0;
 * particle.size = 0.1;
 *
 * // 更新所有粒子
 * buffer.update(deltaTime);
 *
 * // 上传到 GPU
 * buffer.uploadToGPU();
 * ```
 */

import { MSpec } from '@maxellabs/core';
import type { ParticleData, ParticleStats } from './types';
// import { PARTICLE_DATA_LAYOUT } from './types';

export interface ParticleBufferOptions {
  /** 最大粒子数，默认 10000 */
  maxParticles?: number;
  /** 资源标签，用于调试 */
  label?: string;
}

export class ParticleBuffer {
  private device: MSpec.IRHIDevice;
  private maxParticles: number;
  private label: string;

  // CPU 数据（粒子池）
  private particles: ParticleData[] = [];
  private activeCount: number = 0;

  // GPU 缓冲区（用于实例化渲染）
  private gpuBuffer: MSpec.IRHIBuffer;
  private cpuBuffer: Float32Array;

  // 统计信息
  private totalEmitted: number = 0;
  private totalRecycled: number = 0;

  // 实例数据步长（40 bytes per instance）
  private readonly instanceStride = 10; // 10 floats = 40 bytes

  // 默认重力向量（避免在循环中创建新对象）
  private static readonly DEFAULT_GRAVITY = new Float32Array([0, -9.8, 0]);

  /**
   * 创建粒子缓冲区
   *
   * @param device RHI 设备
   * @param options 配置选项
   */
  constructor(device: MSpec.IRHIDevice, options: ParticleBufferOptions = {}) {
    this.device = device;
    this.maxParticles = options.maxParticles ?? 10000;
    this.label = options.label ?? 'ParticleBuffer';

    // 预分配粒子池
    this.initializeParticlePool();

    // 创建 CPU 缓冲区（用于实例化渲染数据）
    // 每个粒子：vec3 position (4 floats with padding) + vec4 color (4 floats) + float size (1 float) + padding (1 float)
    this.cpuBuffer = new Float32Array(this.maxParticles * this.instanceStride);

    // 创建 GPU 缓冲区
    const bufferSize = this.maxParticles * this.instanceStride * 4; // 4 bytes per float
    this.gpuBuffer = device.createBuffer({
      label: `${this.label}_GPU`,
      size: bufferSize,
      usage: MSpec.RHIBufferUsage.VERTEX,
    });

    console.info(`[ParticleBuffer] Created: maxParticles=${this.maxParticles}, bufferSize=${bufferSize} bytes`);
  }

  /**
   * 初始化粒子池（预分配所有粒子对象）
   */
  private initializeParticlePool(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        position: new Float32Array(3),
        velocity: new Float32Array(3),
        color: new Float32Array(4),
        life: 0,
        size: 0,
        age: 0,
      });
    }
  }

  /**
   * 激活一个新粒子（从池中获取）
   *
   * @returns 粒子数据引用，如果池已满则返回 null
   */
  activateParticle(): ParticleData | null {
    if (this.activeCount >= this.maxParticles) {
      console.warn('[ParticleBuffer] Particle pool exhausted');
      return null;
    }

    const particle = this.particles[this.activeCount];
    this.activeCount++;
    this.totalEmitted++;

    // 重置粒子状态
    particle.position.fill(0);
    particle.velocity.fill(0);
    particle.color.set([1, 1, 1, 1]);
    particle.life = 0;
    particle.size = 1.0;
    particle.age = 0;

    return particle;
  }

  /**
   * 回收死亡粒子（swap-and-pop 算法）
   *
   * @param index 要回收的粒子索引
   */
  private recycleParticle(index: number): void {
    if (index < 0 || index >= this.activeCount) {
      return;
    }

    // Swap with last active particle
    const lastIndex = this.activeCount - 1;
    if (index !== lastIndex) {
      const temp = this.particles[index];
      this.particles[index] = this.particles[lastIndex];
      this.particles[lastIndex] = temp;
    }

    this.activeCount--;
    this.totalRecycled++;
  }

  /**
   * 更新所有激活的粒子
   *
   * @param deltaTime 时间增量（秒）
   * @param gravity 重力加速度（vec3），默认 [0, -9.8, 0]
   */
  update(deltaTime: number, gravity: Float32Array = ParticleBuffer.DEFAULT_GRAVITY): void {
    // 从后向前遍历，方便回收粒子
    for (let i = this.activeCount - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // 更新生命周期
      particle.life -= deltaTime;
      particle.age += deltaTime;

      // 回收死亡粒子
      if (particle.life <= 0) {
        this.recycleParticle(i);
        continue;
      }

      // 应用重力
      particle.velocity[0] += gravity[0] * deltaTime;
      particle.velocity[1] += gravity[1] * deltaTime;
      particle.velocity[2] += gravity[2] * deltaTime;

      // 更新位置
      particle.position[0] += particle.velocity[0] * deltaTime;
      particle.position[1] += particle.velocity[1] * deltaTime;
      particle.position[2] += particle.velocity[2] * deltaTime;
    }
  }

  /**
   * 应用力场到所有粒子
   *
   * @param force 力向量（vec3）
   * @param deltaTime 时间增量（秒）
   */
  applyForce(force: Float32Array, deltaTime: number): void {
    for (let i = 0; i < this.activeCount; i++) {
      const particle = this.particles[i];
      particle.velocity[0] += force[0] * deltaTime;
      particle.velocity[1] += force[1] * deltaTime;
      particle.velocity[2] += force[2] * deltaTime;
    }
  }

  /**
   * 上传粒子数据到 GPU（用于实例化渲染）
   *
   * 实例数据布局：
   * [0-2]   vec3 position
   * [3]     padding
   * [4-7]   vec4 color
   * [8]     float size
   * [9]     padding
   */
  uploadToGPU(): void {
    if (this.activeCount === 0) {
      return;
    }

    // 填充 CPU 缓冲区
    for (let i = 0; i < this.activeCount; i++) {
      const particle = this.particles[i];
      const offset = i * this.instanceStride;

      // vec3 position + padding
      this.cpuBuffer[offset + 0] = particle.position[0];
      this.cpuBuffer[offset + 1] = particle.position[1];
      this.cpuBuffer[offset + 2] = particle.position[2];
      this.cpuBuffer[offset + 3] = 0; // padding

      // vec4 color
      this.cpuBuffer[offset + 4] = particle.color[0];
      this.cpuBuffer[offset + 5] = particle.color[1];
      this.cpuBuffer[offset + 6] = particle.color[2];
      this.cpuBuffer[offset + 7] = particle.color[3];

      // float size + padding
      this.cpuBuffer[offset + 8] = particle.size;
      this.cpuBuffer[offset + 9] = 0; // padding
    }

    // 上传到 GPU
    const dataSize = this.activeCount * this.instanceStride;
    this.gpuBuffer.update(this.cpuBuffer.subarray(0, dataSize) as unknown as BufferSource, 0);
  }

  /**
   * 获取 GPU 缓冲区（用于绑定到渲染管线）
   *
   * @returns GPU 缓冲区句柄
   */
  getBuffer(): MSpec.IRHIBuffer {
    return this.gpuBuffer;
  }

  /**
   * 获取当前激活的粒子数
   *
   * @returns 激活粒子数量
   */
  getActiveCount(): number {
    return this.activeCount;
  }

  /**
   * 获取粒子数据（用于外部访问）
   *
   * @param index 粒子索引
   * @returns 粒子数据引用
   */
  getParticle(index: number): ParticleData | null {
    if (index < 0 || index >= this.activeCount) {
      return null;
    }
    return this.particles[index];
  }

  /**
   * 获取所有激活的粒子
   *
   * @returns 激活粒子数组（只读）
   */
  getActiveParticles(): readonly ParticleData[] {
    return this.particles.slice(0, this.activeCount);
  }

  /**
   * 获取统计信息
   *
   * @returns 粒子缓冲区统计信息
   */
  getStats(): ParticleStats {
    return {
      activeCount: this.activeCount,
      maxParticles: this.maxParticles,
      usage: this.activeCount / this.maxParticles,
      bufferSize: this.maxParticles * this.instanceStride * 4,
      strideBytes: this.instanceStride * 4,
      totalEmitted: this.totalEmitted,
      totalRecycled: this.totalRecycled,
    };
  }

  /**
   * 获取实例数据步长（字节数）
   *
   * @returns 每实例数据的字节数
   */
  getStrideBytes(): number {
    return this.instanceStride * 4;
  }

  /**
   * 清空所有粒子
   */
  clear(): void {
    this.activeCount = 0;
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    console.info(`[ParticleBuffer] Destroying: ${this.label}`);
    this.gpuBuffer.destroy();
    this.particles = [];
  }
}
