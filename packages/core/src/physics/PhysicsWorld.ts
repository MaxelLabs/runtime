import { Vector3 } from '@maxellabs/math';
import { MaxObject } from '../base/max-object';

/**
 * 碰撞检测模式
 */
export enum CollisionDetectionMode {
  /** 离散检测：标准的、更快的碰撞检测，适用于大多数情况 */
  Discrete,
  /** 连续检测：处理高速移动物体的碰撞穿透，但更耗性能 */
  Continuous
}

/**
 * 物理世界设置
 */
export interface PhysicsWorldSettings {
  /** 重力，默认(0, -9.81, 0) */
  gravity?: Vector3;
  /** 模拟时间步长，默认1/60 */
  fixedTimeStep?: number;
  /** 最大子步数，默认3 */
  maxSubSteps?: number;
  /** 碰撞检测模式 */
  collisionDetectionMode?: CollisionDetectionMode;
  /** 是否启用调试绘制 */
  debugDraw?: boolean;
}

/**
 * 物理世界基类
 * 管理物理模拟、碰撞检测和响应
 */
export abstract class PhysicsWorld extends MaxObject {
  /** 重力向量 */
  protected gravity: Vector3;
  /** 固定时间步长 */
  protected fixedTimeStep: number;
  /** 最大子步数 */
  protected maxSubSteps: number;
  /** 碰撞检测模式 */
  protected collisionDetectionMode: CollisionDetectionMode;
  /** 是否启用物理模拟 */
  protected enabled: boolean = true;
  /** 是否启用调试绘制 */
  protected debugDraw: boolean = false;
  /** 积累的时间 */
  protected accumulator: number = 0;

  /**
   * 创建物理世界
   * @param settings 物理世界设置
   */
  constructor(settings?: PhysicsWorldSettings) {
    super();
    this.gravity = settings?.gravity ? settings.gravity.clone() : new Vector3(0, -9.81, 0);
    this.fixedTimeStep = settings?.fixedTimeStep ?? 1/60;
    this.maxSubSteps = settings?.maxSubSteps ?? 3;
    this.collisionDetectionMode = settings?.collisionDetectionMode ?? CollisionDetectionMode.Discrete;
    this.debugDraw = settings?.debugDraw ?? false;
  }

  /**
   * 步进物理模拟
   * @param deltaTime 真实时间步长(秒)
   */
  step(deltaTime: number): void {
    if (!this.enabled) {return;}
    
    this.preStep();
    
    // 使用半固定时间步长 (accumulator pattern)
    this.accumulator += deltaTime;
    let subSteps = 0;
    
    while (this.accumulator >= this.fixedTimeStep && subSteps < this.maxSubSteps) {
      this.internalStep(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
      subSteps++;
    }
    
    // 如果积累的时间还有剩余但达到最大子步数，一次性消耗掉
    if (subSteps >= this.maxSubSteps && this.accumulator > 0) {
      this.internalStep(this.accumulator);
      this.accumulator = 0;
    }
    
    this.postStep();
  }
  
  /**
   * 在步进前执行
   * 子类可以重写此方法
   */
  protected preStep(): void {}
  
  /**
   * 在步进后执行
   * 子类可以重写此方法
   */
  protected postStep(): void {}
  
  /**
   * 内部步进实现，子类必须实现此方法
   * @param timeStep 时间步长
   */
  protected abstract internalStep(timeStep: number): void;

  /**
   * 设置重力
   * @param gravity 重力向量
   */
  setGravity(gravity: Vector3): void {
    this.gravity.copyFrom(gravity);
  }

  /**
   * 获取当前重力
   */
  getGravity(): Vector3 {
    return this.gravity.clone();
  }

  /**
   * 设置是否启用物理模拟
   * @param enabled 是否启用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 获取是否启用物理模拟
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 设置碰撞检测模式
   * @param mode 碰撞检测模式
   */
  setCollisionDetectionMode(mode: CollisionDetectionMode): void {
    this.collisionDetectionMode = mode;
  }

  /**
   * 获取碰撞检测模式
   */
  getCollisionDetectionMode(): CollisionDetectionMode {
    return this.collisionDetectionMode;
  }

  /**
   * 设置是否启用调试绘制
   * @param enabled 是否启用
   */
  setDebugDraw(enabled: boolean): void {
    this.debugDraw = enabled;
  }

  /**
   * 获取是否启用调试绘制
   */
  isDebugDrawEnabled(): boolean {
    return this.debugDraw;
  }

  /**
   * 设置固定时间步长
   * @param timeStep 时间步长(秒)
   */
  setFixedTimeStep(timeStep: number): void {
    this.fixedTimeStep = timeStep;
  }

  /**
   * 获取固定时间步长
   */
  getFixedTimeStep(): number {
    return this.fixedTimeStep;
  }

  /**
   * 设置最大子步数
   * @param steps 最大子步数
   */
  setMaxSubSteps(steps: number): void {
    this.maxSubSteps = steps;
  }

  /**
   * 获取最大子步数
   */
  getMaxSubSteps(): number {
    return this.maxSubSteps;
  }

  /**
   * 重置物理世界
   * 子类必须实现以清除所有物理对象和状态
   */
  abstract reset(): void;

  /**
   * 渲染调试信息
   * 子类应实现以可视化物理世界
   */
  abstract renderDebug(): void;
} 