/**
 * 时间管理类，管理游戏时间相关信息
 *
 * @remarks
 * **时间单位约定**：
 * - 所有内部存储的时间值都使用**秒**作为单位
 * - `update()` 方法接收的参数是**毫秒**，会自动转换为秒
 * - 所有公开的时间属性（deltaTime, fixedDeltaTime 等）都是**秒**
 *
 * **使用示例**：
 * ```typescript
 * const time = new Time();
 *
 * // 在游戏循环中更新（传入毫秒）
 * function gameLoop(timestamp: number) {
 *   const deltaMs = timestamp - lastTimestamp;
 *   time.update(deltaMs); // 传入毫秒
 *
 *   // 使用秒为单位的 deltaTime
 *   object.position.x += velocity * time.deltaTime; // deltaTime 是秒
 *
 *   lastTimestamp = timestamp;
 *   requestAnimationFrame(gameLoop);
 * }
 * ```
 */
export class Time {
  /** 当前游戏时间（秒），受 timeScale 影响 */
  protected time: number = 0;

  /**
   * 上一帧的时间戳（秒）
   * @remarks 使用 performance.now() / 1000 获取，用于内部计算
   */
  protected lastTime: number = 0;

  /** 引擎启动以来经过的总时间（秒），不受 timeScale 影响 */
  protected sinceStartup: number = 0;

  /**
   * 自上一帧以来经过的时间（秒），受 timeScale 影响
   * @remarks 这是游戏逻辑中最常用的时间增量
   */
  deltaTime: number = 0;

  /** 未受 timeScale 影响的时间增量（秒） */
  protected unscaledDeltaTime: number = 0;

  /**
   * 时间缩放系数
   * @remarks
   * - 1.0 = 正常速度
   * - 0.5 = 半速（慢动作）
   * - 2.0 = 双倍速
   * - 0.0 = 暂停
   */
  timeScale: number = 1.0;

  /** 帧数计数 */
  protected frameCount: number = 0;

  /**
   * 固定时间步长（秒）
   * @remarks 用于物理更新等需要固定时间步长的场景，默认 0.02 秒（50Hz）
   */
  fixedDeltaTime: number = 0.02;

  /**
   * 最大允许的时间步长（秒）
   * @remarks 防止因帧率过低导致的时间跳跃，默认约 0.333 秒（最低 3 FPS）
   */
  maximumDeltaTime: number = 0.3333333;

  /** 固定更新累积器（秒） */
  fixedTimeAccumulator: number = 0;

  /**
   * 创建时间管理器
   */
  constructor() {
    this.reset();
  }

  /**
   * 重置时间状态
   * @remarks 将所有时间相关的状态重置为初始值，lastTime 设置为当前时间戳
   */
  reset(): void {
    // 获取当前时间戳并转换为秒
    const nowInSeconds = performance.now() / 1000;

    this.time = 0;
    this.lastTime = nowInSeconds;
    this.sinceStartup = 0;
    this.deltaTime = 0;
    this.unscaledDeltaTime = 0;
    this.frameCount = 0;
    this.fixedTimeAccumulator = 0;
  }

  /**
   * 更新时间状态
   * @param deltaTimeMs 传入的时间差（**毫秒**）
   * @remarks
   * 此方法接收毫秒为单位的时间差，内部会自动转换为秒。
   * 这是为了与 requestAnimationFrame 和 performance.now() 的返回值兼容。
   */
  update(deltaTimeMs: number): void {
    // 将毫秒转换为秒
    const deltaTimeInSeconds = deltaTimeMs / 1000;

    // 限制最大时间步长，防止时间跳跃过大
    this.unscaledDeltaTime = Math.min(deltaTimeInSeconds, this.maximumDeltaTime);

    // 应用时间缩放
    this.deltaTime = this.unscaledDeltaTime * this.timeScale;

    // 更新累积时间
    this.time += this.deltaTime;
    this.sinceStartup += this.unscaledDeltaTime;

    // 更新当前帧时间戳（秒），用于调试和内部参考
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
