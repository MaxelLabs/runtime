import { MaxObject } from '../base/maxObject';

/**
 * 动画插值类型
 */
export enum InterpolationType {
  /** 线性插值 */
  Linear,
  /** 阶梯插值 */
  Step,
  /** 立方样条插值 */
  CubicSpline
}

/**
 * 动画循环模式
 */
export enum LoopMode {
  /** 一次 */
  Once,
  /** 循环 */
  Loop,
  /** 往复 */
  PingPong,
  /** 重复最后一帧 */
  ClampForever
}

/**
 * 动画基类
 * 管理动画状态和更新
 */
export abstract class Animation extends MaxObject {
  /** 动画名称 */
  private animationName: string;
  /** 当前时间(秒) */
  protected time: number = 0;
  /** 动画速度倍率 */
  protected speed: number = 1.0;
  /** 动画时长(秒) */
  protected duration: number = 0;
  /** 是否正在播放 */
  protected playing: boolean = false;
  /** 循环模式 */
  protected loopMode: LoopMode = LoopMode.Once;
  /** 动画权重 */
  protected weight: number = 1.0;
  /** 延迟播放时间(秒) */
  protected delay: number = 0;
  /** 是否反向播放 */
  protected reverse: boolean = false;
  /** 当前归一化时间(0-1) */
  protected normalizedTime: number = 0;
  /** 动画是否已经完成 */
  protected finished: boolean = false;

  /**
   * 创建动画
   * @param name 动画名称
   * @param duration 动画时长(秒)
   */
  constructor(name: string, duration: number = 0) {
    super();
    this.animationName = name;
    this.duration = Math.max(0, duration);
  }

  /**
   * 播放动画
   */
  play(): void {
    this.playing = true;
    this.finished = false;
  }

  /**
   * 暂停动画
   */
  pause(): void {
    this.playing = false;
  }

  /**
   * 停止动画
   */
  stop(): void {
    this.playing = false;
    this.time = 0;
    this.normalizedTime = 0;
    this.finished = true;
  }

  /**
   * 重置动画
   */
  reset(): void {
    this.time = 0;
    this.normalizedTime = 0;
    this.finished = false;
  }

  /**
   * 设置动画时间
   * @param time 时间(秒)
   */
  setTime(time: number): void {
    this.time = Math.max(0, Math.min(time, this.duration));
    this.updateNormalizedTime();
    this.sample();
  }

  /**
   * 设置归一化时间(0-1)
   * @param normalizedTime 归一化时间
   */
  setNormalizedTime(normalizedTime: number): void {
    this.normalizedTime = Math.max(0, Math.min(normalizedTime, 1));
    this.time = this.normalizedTime * this.duration;
    this.sample();
  }

  /**
   * 设置动画速度
   * @param speed 速度倍率
   */
  setSpeed(speed: number): void {
    this.speed = speed;
  }

  /**
   * 设置循环模式
   * @param mode 循环模式
   */
  setLoopMode(mode: LoopMode): void {
    this.loopMode = mode;
  }

  /**
   * 设置动画权重
   * @param weight 权重
   */
  setWeight(weight: number): void {
    this.weight = Math.max(0, Math.min(weight, 1));
  }

  /**
   * 设置延迟时间
   * @param delay 延迟(秒)
   */
  setDelay(delay: number): void {
    this.delay = Math.max(0, delay);
  }

  /**
   * 设置是否反向播放
   * @param reverse 是否反向
   */
  setReverse(reverse: boolean): void {
    this.reverse = reverse;
  }

  /**
   * 更新动画
   * @param deltaTime 时间增量(秒)
   */
  update(deltaTime: number): void {
    if (!this.playing || this.finished) {return;}
    
    // 如果有延迟，先处理延迟
    if (this.delay > 0) {
      this.delay -= deltaTime;
      if (this.delay > 0) {return;}
      
      // 延迟结束，补偿剩余时间
      deltaTime = -this.delay;
      this.delay = 0;
    }
    
    // 计算实际时间增量(考虑速度和方向)
    const actualDelta = deltaTime * this.speed * (this.reverse ? -1 : 1);
    
    // 更新时间
    this.time += actualDelta;
    
    // 根据循环模式处理时间
    this.processLoopMode();
    
    // 更新归一化时间
    this.updateNormalizedTime();
    
    // 采样动画帧
    this.sample();
  }
  
  /**
   * 处理循环模式
   */
  private processLoopMode(): void {
    // 如果动画时长为0，直接设为完成
    if (this.duration <= 0) {
      this.finished = true;
      return;
    }
    
    switch (this.loopMode) {
      case LoopMode.Once:
        if (this.time >= this.duration) {
          this.time = this.duration;
          this.finished = true;
        } else if (this.time <= 0) {
          this.time = 0;
          this.finished = true;
        }
        break;
        
      case LoopMode.Loop:
        while (this.time >= this.duration) {
          this.time -= this.duration;
        }
        while (this.time < 0) {
          this.time += this.duration;
        }
        break;
        
      case LoopMode.PingPong:
        const fullCycle = this.duration * 2;
        let cycleTime = this.time % fullCycle;
        
        if (cycleTime < 0) {
          cycleTime += fullCycle;
        }
        
        if (cycleTime >= this.duration) {
          // 反向阶段
          this.time = this.duration - (cycleTime - this.duration);
        } else {
          // 正向阶段
          this.time = cycleTime;
        }
        break;
        
      case LoopMode.ClampForever:
        if (this.time >= this.duration) {
          this.time = this.duration;
        } else if (this.time <= 0) {
          this.time = 0;
        }
        break;
    }
  }
  
  /**
   * 更新归一化时间
   */
  private updateNormalizedTime(): void {
    if (this.duration <= 0) {
      this.normalizedTime = 1;
    } else {
      this.normalizedTime = this.time / this.duration;
    }
  }

  /**
   * 获取动画名称
   */
  getName(): string {
    return this.animationName;
  }

  /**
   * 获取当前时间
   */
  getTime(): number {
    return this.time;
  }

  /**
   * 获取归一化时间
   */
  getNormalizedTime(): number {
    return this.normalizedTime;
  }

  /**
   * 获取动画时长
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * 获取动画速度
   */
  getSpeed(): number {
    return this.speed;
  }

  /**
   * 获取循环模式
   */
  getLoopMode(): LoopMode {
    return this.loopMode;
  }

  /**
   * 获取动画权重
   */
  getWeight(): number {
    return this.weight;
  }

  /**
   * 是否正在播放
   */
  isPlaying(): boolean {
    return this.playing;
  }

  /**
   * 是否已完成
   */
  isFinished(): boolean {
    return this.finished;
  }

  /**
   * 采样当前时间的动画帧
   * 子类必须实现此方法
   */
  protected abstract sample(): void;
} 