/**
 * 时间管理类，管理游戏时间相关信息
 */
export class Time {
  /** 当前时间（秒） */
  private _time: number = 0;
  /** 上一帧时间（秒） */
  private _lastTime: number = 0;
  /** 引擎启动以来经过的总秒数 */
  private _sinceStartup: number = 0;
  /** 自上一帧以来经过的秒数 */
  private _deltaTime: number = 0;
  /** 未受缩放影响的deltaTime */
  private _unscaledDeltaTime: number = 0;
  /** 时间缩放系数 */
  private _timeScale: number = 1.0;
  /** 帧数计数 */
  private _frameCount: number = 0;
  /** 固定时间步长（秒） */
  private _fixedDeltaTime: number = 0.02; // 默认50Hz
  /** 最大允许的时间步长（秒） */
  private _maximumDeltaTime: number = 0.3333333; // 默认最低3FPS
  /** 固定更新累积器 */
  private _fixedTimeAccumulator: number = 0;
  /** 上一次实际更新时间（毫秒） */
  private _lastRealTimestamp: number = 0;

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
    this._time = now;
    this._lastTime = now;
    this._sinceStartup = 0;
    this._deltaTime = 0;
    this._unscaledDeltaTime = 0;
    this._frameCount = 0;
    this._fixedTimeAccumulator = 0;
    this._lastRealTimestamp = now;
  }

  /**
   * 更新时间
   */
  update(): void {
    const now = performance.now() / 1000; // 转换为秒
    const realDeltaTime = now - this._lastTime;
    
    // 限制最大时间步长
    this._unscaledDeltaTime = Math.min(realDeltaTime, this._maximumDeltaTime);
    
    // 应用时间缩放
    this._deltaTime = this._unscaledDeltaTime * this._timeScale;
    
    // 更新时间
    this._time += this._deltaTime;
    this._sinceStartup += this._unscaledDeltaTime;
    
    // 更新上一帧时间
    this._lastTime = now;
    
    // 更新帧数
    this._frameCount++;
    
    // 更新固定时间步长累积器
    this._fixedTimeAccumulator += this._deltaTime;
  }

  /**
   * 获取当前时间（秒）
   */
  get time(): number {
    return this._time;
  }

  /**
   * 获取自引擎启动以来经过的总秒数
   */
  get sinceStartup(): number {
    return this._sinceStartup;
  }

  /**
   * 获取自上一帧以来经过的秒数
   */
  get deltaTime(): number {
    return this._deltaTime;
  }

  /**
   * 获取未受缩放影响的deltaTime
   */
  get unscaledDeltaTime(): number {
    return this._unscaledDeltaTime;
  }

  /**
   * 获取时间缩放系数
   */
  get timeScale(): number {
    return this._timeScale;
  }

  /**
   * 设置时间缩放系数
   */
  set timeScale(value: number) {
    this._timeScale = Math.max(0, value);
  }

  /**
   * 获取帧数计数
   */
  get frameCount(): number {
    return this._frameCount;
  }

  /**
   * 获取固定时间步长（秒）
   */
  get fixedDeltaTime(): number {
    return this._fixedDeltaTime;
  }

  /**
   * 设置固定时间步长（秒）
   */
  set fixedDeltaTime(value: number) {
    this._fixedDeltaTime = Math.max(0.0001, value);
  }

  /**
   * 获取最大允许的时间步长（秒）
   */
  get maximumDeltaTime(): number {
    return this._maximumDeltaTime;
  }

  /**
   * 设置最大允许的时间步长（秒）
   */
  set maximumDeltaTime(value: number) {
    this._maximumDeltaTime = Math.max(0.0001, value);
  }

  /**
   * 检查是否需要进行固定更新
   * @returns 是否需要固定更新
   */
  needFixedUpdate(): boolean {
    return this._fixedTimeAccumulator >= this._fixedDeltaTime;
  }

  /**
   * 执行固定更新
   */
  performFixedUpdate(): void {
    this._fixedTimeAccumulator -= this._fixedDeltaTime;
  }
} 