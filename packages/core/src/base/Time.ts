/**
 * 时间管理类，管理游戏时间相关信息
 */
export class Time {
  /** 当前时间（秒） */
  protected time: number = 0;
  /** 上一帧时间（秒） */
  protected lastTime: number = 0;
  /** 引擎启动以来经过的总秒数 */
  protected sinceStartup: number = 0;
  /** 自上一帧以来经过的秒数 */
  deltaTime: number = 0;
  /** 未受缩放影响的deltaTime */
  protected unscaledDeltaTime: number = 0;
  /** 时间缩放系数 */
  timeScale: number = 1.0;
  /** 帧数计数 */
  protected frameCount: number = 0;
  /** 固定时间步长（秒） */
  fixedDeltaTime: number = 0.02; // 默认50Hz
  /** 最大允许的时间步长（秒） */
  maximumDeltaTime: number = 0.3333333; // 默认最低3FPS
  /** 固定更新累积器 */
  fixedTimeAccumulator: number = 0;

  /**
   * 创建时间管理器
   */
  constructor() {
    this.reset();
  }

  /**
   * 重置时间
   */
  reset(): void {
    const now = performance.now() / 1000; // 转换为秒

    this.time = 0;
    this.lastTime = now;
    this.sinceStartup = 0;
    this.deltaTime = 0;
    this.unscaledDeltaTime = 0;
    this.frameCount = 0;
    this.fixedTimeAccumulator = 0;
  }

  /**
   * 更新时间
   * @param deltaTime 传入的时间差（毫秒）
   */
  update(deltaTime: number): void {
    // 将毫秒转换为秒
    const deltaTimeInSeconds = deltaTime / 1000;

    // 限制最大时间步长，防止时间跳跃过大
    this.unscaledDeltaTime = Math.min(deltaTimeInSeconds, this.maximumDeltaTime);

    // 应用时间缩放
    this.deltaTime = this.unscaledDeltaTime * this.timeScale;

    // 更新累积时间
    this.time += this.deltaTime;
    this.sinceStartup += this.unscaledDeltaTime;

    // 更新当前帧时间（用于下次计算）
    this.lastTime = performance.now() / 1000;

    // 更新帧数
    this.frameCount++;

    // 更新固定时间步长累积器
    this.fixedTimeAccumulator += this.deltaTime;
  }

  /**
   * 检查是否需要进行固定更新
   * @returns 是否需要固定更新
   */
  needFixedUpdate(): boolean {
    return this.fixedTimeAccumulator >= this.fixedDeltaTime;
  }

  /**
   * 执行固定更新
   */
  performFixedUpdate(): void {
    this.fixedTimeAccumulator -= this.fixedDeltaTime;
  }

  /**
   * 获取当前时间（秒）
   */
  get currentTime(): number {
    return this.time;
  }

  /**
   * 获取引擎启动以来的时间（秒）
   */
  get timeSinceStartup(): number {
    return this.sinceStartup;
  }

  /**
   * 获取当前帧数
   */
  get frame(): number {
    return this.frameCount;
  }

  /**
   * 获取未缩放的时间增量
   */
  get unscaledDelta(): number {
    return this.unscaledDeltaTime;
  }

  /**
   * 计算当前帧率
   */
  get fps(): number {
    return this.deltaTime > 0 ? 1 / this.deltaTime : 0;
  }
}
