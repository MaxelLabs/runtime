/**
 * common.ts
 * 通用工具函数
 */

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private frameTime = 0;
  private callbacks: Array<(fps: number, frameTime: number) => void> = [];

  /**
   * 更新性能数据
   */
  update(): void {
    this.frameCount++;
    const currentTime = performance.now();
    this.frameTime = currentTime - this.lastTime;

    if (this.frameTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / this.frameTime);
      this.frameCount = 0;
      this.lastTime = currentTime;

      // 通知回调函数
      this.callbacks.forEach((callback) => callback(this.fps, this.frameTime));
    }
  }

  /**
   * 添加性能更新回调
   */
  onUpdate(callback: (fps: number, frameTime: number) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * 获取当前FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * 获取当前帧时间
   */
  getFrameTime(): number {
    return this.frameTime;
  }
}

/**
 * 事件发射器
 */
export class EventEmitter {
  private events: Map<string, Array<(...args: any[]) => void>> = new Map();

  /**
   * 监听事件
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback: (...args: any[]) => void): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }

  /**
   * 清除所有事件监听
   */
  clear(): void {
    this.events.clear();
  }
}

/**
 * 资源管理器
 */
export class ResourceManager {
  private resources: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  /**
   * 加载资源
   */
  async load<T>(key: string, loader: () => Promise<T>): Promise<T> {
    // 如果资源已存在，直接返回
    if (this.resources.has(key)) {
      return this.resources.get(key);
    }

    // 如果正在加载，返回加载Promise
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    // 开始加载
    const promise = loader()
      .then((resource) => {
        this.resources.set(key, resource);
        this.loadingPromises.delete(key);
        return resource;
      })
      .catch((error) => {
        this.loadingPromises.delete(key);
        throw error;
      });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  /**
   * 获取资源
   */
  get<T>(key: string): T | undefined {
    return this.resources.get(key);
  }

  /**
   * 设置资源
   */
  set(key: string, resource: any): void {
    this.resources.set(key, resource);
  }

  /**
   * 删除资源
   */
  delete(key: string): boolean {
    return this.resources.delete(key);
  }

  /**
   * 清除所有资源
   */
  clear(): void {
    this.resources.clear();
    this.loadingPromises.clear();
  }

  /**
   * 获取资源数量
   */
  size(): number {
    return this.resources.size;
  }
}

/**
 * 数学工具函数
 */
export class MathUtils {
  /**
   * 线性插值
   */
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * 平滑插值
   */
  static smoothstep(a: number, b: number, t: number): number {
    t = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  /**
   * 将值限制在范围内
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 将角度转换为弧度
   */
  static degToRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * 将弧度转换为角度
   */
  static radToDeg(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  /**
   * 生成随机数
   */
  static random(min: number = 0, max: number = 1): number {
    return min + Math.random() * (max - min);
  }

  /**
   * 生成随机整数
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(this.random(min, max + 1));
  }

  /**
   * 计算两点距离
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算两点距离的平方（避免开方运算）
   */
  static distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }

  /**
   * 标准化角度到 [0, 2π] 范围
   */
  static normalizeAngle(angle: number): number {
    while (angle < 0) {
      angle += Math.PI * 2;
    }
    while (angle >= Math.PI * 2) {
      angle -= Math.PI * 2;
    }
    return angle;
  }

  /**
   * 计算最短角度差
   */
  static angleDifference(a: number, b: number): number {
    const diff = this.normalizeAngle(b - a);
    return diff > Math.PI ? diff - Math.PI * 2 : diff;
  }
}

/**
 * 颜色工具函数
 */
export class ColorUtils {
  /**
   * RGB转HSV
   */
  static rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff !== 0) {
      if (max === r) {
        h = ((g - b) / diff) % 6;
      } else if (max === g) {
        h = (b - r) / diff + 2;
      } else {
        h = (r - g) / diff + 4;
      }
      h /= 6;
    }

    const s = max === 0 ? 0 : diff / max;
    const v = max;

    return [h, s, v];
  }

  /**
   * HSV转RGB
   */
  static hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const c = v * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = v - c;

    let r = 0,
      g = 0,
      b = 0;

    if (h < 1 / 6) {
      r = c;
      g = x;
      b = 0;
    } else if (h < 2 / 6) {
      r = x;
      g = c;
      b = 0;
    } else if (h < 3 / 6) {
      r = 0;
      g = c;
      b = x;
    } else if (h < 4 / 6) {
      r = 0;
      g = x;
      b = c;
    } else if (h < 5 / 6) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    return [r + m, g + m, b + m];
  }

  /**
   * 颜色混合
   */
  static blend(
    color1: [number, number, number],
    color2: [number, number, number],
    factor: number
  ): [number, number, number] {
    return [
      MathUtils.lerp(color1[0], color2[0], factor),
      MathUtils.lerp(color1[1], color2[1], factor),
      MathUtils.lerp(color1[2], color2[2], factor),
    ];
  }

  /**
   * 颜色转十六进制字符串
   */
  static toHex(r: number, g: number, b: number): string {
    const toHex = (n: number) =>
      Math.floor(n * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * 十六进制字符串转颜色
   */
  static fromHex(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      throw new Error('Invalid hex color');
    }

    return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
  }
}

/**
 * 时间工具函数
 */
export class TimeUtils {
  private static startTime = performance.now();

  /**
   * 获取从启动开始的时间（秒）
   */
  static getTime(): number {
    return (performance.now() - this.startTime) / 1000;
  }

  /**
   * 重置计时器
   */
  static reset(): void {
    this.startTime = performance.now();
  }

  /**
   * 格式化时间
   */
  static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * 延迟执行
   */
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * 调试工具函数
 */
export class DebugUtils {
  private static logs: string[] = [];
  private static maxLogs = 100;

  /**
   * 记录日志
   */
  static log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    this.logs.push(logMessage);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // eslint-disable-next-line no-console
    console[level](logMessage);
  }

  /**
   * 获取所有日志
   */
  static getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * 清除日志
   */
  static clearLogs(): void {
    this.logs.length = 0;
  }

  /**
   * 性能测试
   */
  static time(label: string): void {
    // eslint-disable-next-line no-console
    console.time(label);
  }

  /**
   * 结束性能测试
   */
  static timeEnd(label: string): void {
    // eslint-disable-next-line no-console
    console.timeEnd(label);
  }

  /**
   * 内存使用情况
   */
  static getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }
}

/**
 * 异步工具函数
 */
export class AsyncUtils {
  /**
   * 并行执行多个异步任务
   */
  static async parallel<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(tasks.map((task) => task()));
  }

  /**
   * 串行执行多个异步任务
   */
  static async series<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    const results: T[] = [];
    for (const task of tasks) {
      results.push(await task());
    }
    return results;
  }

  /**
   * 带超时的Promise
   */
  static timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
    ]);
  }

  /**
   * 重试执行
   */
  static async retry<T>(fn: () => Promise<T>, maxAttempts: number = 3, delay: number = 1000): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await TimeUtils.delay(delay);
        }
      }
    }

    throw lastError!;
  }
}

/**
 * 验证工具函数
 */
export class ValidationUtils {
  /**
   * 验证是否为数字
   */
  static isNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * 验证是否为字符串
   */
  static isString(value: any): value is string {
    return typeof value === 'string';
  }

  /**
   * 验证是否为对象
   */
  static isObject(value: any): value is object {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * 验证是否为数组
   */
  static isArray(value: any): value is any[] {
    return Array.isArray(value);
  }

  /**
   * 验证是否为函数
   */
  static isFunction(value: any): value is any {
    return typeof value === 'function';
  }

  /**
   * 验证数字范围
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return this.isNumber(value) && value >= min && value <= max;
  }

  /**
   * 验证字符串长度
   */
  static isValidLength(value: string, minLength: number, maxLength?: number): boolean {
    if (!this.isString(value)) {
      return false;
    }
    if (value.length < minLength) {
      return false;
    }
    if (maxLength !== undefined && value.length > maxLength) {
      return false;
    }
    return true;
  }
}
