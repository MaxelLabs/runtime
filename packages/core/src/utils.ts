/**
 * 可释放资源接口
 */
export interface Disposable {
  /**
   * 释放资源
   */
  dispose(): void;
}

/**
 * 去抖动函数类型
 */
export type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

/**
 * 节流函数类型
 */
export type ThrottledFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

/**
 * 工具函数集合
 */
export class Utils {
  /**
   * 深度克隆对象
   * @param obj 要克隆的对象
   * @returns 克隆后的对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }

    if (obj instanceof Array) {
      return obj.map(item => Utils.deepClone(item)) as any;
    }

    if (obj instanceof Object) {
      const copy = {} as any;
      Object.keys(obj).forEach(key => {
        copy[key] = Utils.deepClone((obj as any)[key]);
      });
      return copy;
    }

    return obj;
  }

  /**
   * 生成唯一ID
   * @param prefix ID前缀
   * @returns 唯一ID字符串
   */
  static generateUUID(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}_${timestamp}_${randomStr}` : `${timestamp}_${randomStr}`;
  }

  /**
   * 将度数转换为弧度
   * @param degrees 角度值
   * @returns 弧度值
   */
  static degToRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  /**
   * 将弧度转换为度数
   * @param radians 弧度值
   * @returns 角度值
   */
  static radToDeg(radians: number): number {
    return radians * 180 / Math.PI;
  }

  /**
   * 创建去抖动函数
   * @param fn 要执行的函数
   * @param delay 延迟时间(毫秒)
   * @returns 去抖动处理后的函数
   */
  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): DebouncedFunction<T> {
    let timer: number | null = null;

    const debouncedFn = function(this: any, ...args: Parameters<T>): void {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => {
        timer = null;
        fn.apply(this, args);
      }, delay);
    } as DebouncedFunction<T>;

    debouncedFn.cancel = function(): void {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    return debouncedFn;
  }

  /**
   * 创建节流函数
   * @param fn 要执行的函数
   * @param limit 时间限制(毫秒)
   * @returns 节流处理后的函数
   */
  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ): ThrottledFunction<T> {
    let timer: number | null = null;
    let lastRun: number = 0;

    const throttledFn = function(this: any, ...args: Parameters<T>): void {
      const now = Date.now();
      
      if (lastRun === 0) {
        fn.apply(this, args);
        lastRun = now;
        return;
      }
      
      if (timer === null) {
        const remaining = limit - (now - lastRun);
        
        if (remaining <= 0) {
          lastRun = now;
          fn.apply(this, args);
        } else {
          timer = window.setTimeout(() => {
            timer = null;
            lastRun = Date.now();
            fn.apply(this, args);
          }, remaining);
        }
      }
    } as ThrottledFunction<T>;

    throttledFn.cancel = function(): void {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    return throttledFn;
  }

  /**
   * 检查两个区间是否重叠
   * @param min1 区间1最小值
   * @param max1 区间1最大值
   * @param min2 区间2最小值
   * @param max2 区间2最大值
   * @returns 是否重叠
   */
  static rangesOverlap(min1: number, max1: number, min2: number, max2: number): boolean {
    return max1 >= min2 && max2 >= min1;
  }

  /**
   * 将数值限制在指定范围内
   * @param value 要限制的数值
   * @param min 最小值
   * @param max 最大值
   * @returns 限制后的值
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 线性插值
   * @param a 起始值
   * @param b 结束值
   * @param t 插值系数(0-1)
   * @returns 插值结果
   */
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * Utils.clamp(t, 0, 1);
  }

  /**
   * 对数组中的元素进行洗牌(随机排序)
   * @param array 要洗牌的数组
   * @returns 洗牌后的数组
   */
  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * 判断是否在移动设备上运行
   * @returns 是否是移动设备
   */
  static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * 解析URL查询参数
   * @param url URL字符串
   * @returns 查询参数对象
   */
  static parseQueryParams(url: string): Record<string, string> {
    const params: Record<string, string> = {};
    const queryString = url.split('?')[1];
    
    if (!queryString) {
      return params;
    }
    
    const pairs = queryString.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
    
    return params;
  }

  /**
   * 格式化时间为 HH:MM:SS 格式
   * @param seconds 秒数
   * @returns 格式化的时间字符串
   */
  static formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean);
    
    return parts.join(':');
  }
}