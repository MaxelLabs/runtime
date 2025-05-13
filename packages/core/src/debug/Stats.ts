/**
 * 性能统计类
 * 跟踪和显示引擎运行性能数据
 */
export class Stats {
  /** 是否启用 */
  private static enabled: boolean = false;
  /** 帧率历史数据 */
  private static fpsHistory: number[] = [];
  /** FPS历史记录最大长度 */
  private static maxHistory: number = 60;
  /** 总运行时间(毫秒) */
  private static totalTime: number = 0;
  /** 总帧数 */
  private static totalFrames: number = 0;
  /** 当前帧率 */
  private static currentFPS: number = 0;
  /** 上一次更新时间 */
  private static lastTime: number = 0;
  /** 渲染统计数据 */
  private static renderStats = {
    drawCalls: 0,
    triangles: 0,
    vertices: 0,
    uniforms: 0,
    textures: 0,
  };
  /** 内存使用统计(如果可用) */
  private static memoryStats = {
    totalJSHeapSize: 0,
    usedJSHeapSize: 0,
    jsHeapSizeLimit: 0,
  };
  /** 性能标记数据 */
  private static markers: Map<string, { total: number, count: number, min: number, max: number }> = new Map();

  /**
   * 启用性能统计
   */
  static enable (): void {
    Stats.enabled = true;
    Stats.lastTime = performance.now();
  }

  /**
   * 禁用性能统计
   */
  static disable (): void {
    Stats.enabled = false;
  }

  /**
   * 是否已启用
   */
  static isEnabled (): boolean {
    return Stats.enabled;
  }

  /**
   * 更新帧率计算
   * 每帧调用一次
   */
  static update (): void {
    if (!Stats.enabled) {return;}

    const now = performance.now();
    const elapsed = now - Stats.lastTime;

    // 更新总帧数和总时间
    Stats.totalFrames++;
    Stats.totalTime += elapsed;

    // 计算当前帧率
    if (elapsed > 0) {
      Stats.currentFPS = 1000 / elapsed;
      Stats.fpsHistory.push(Stats.currentFPS);

      // 保持历史记录在指定长度
      if (Stats.fpsHistory.length > Stats.maxHistory) {
        Stats.fpsHistory.shift();
      }
    }

    // 更新内存统计
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory as any;

      Stats.memoryStats.totalJSHeapSize = memory.totalJSHeapSize || 0;
      Stats.memoryStats.usedJSHeapSize = memory.usedJSHeapSize || 0;
      Stats.memoryStats.jsHeapSizeLimit = memory.jsHeapSizeLimit || 0;
    }

    Stats.lastTime = now;
  }

  /**
   * 重置渲染统计数据
   * 每帧开始前调用
   */
  static resetRenderStats (): void {
    if (!Stats.enabled) {return;}

    Stats.renderStats.drawCalls = 0;
    Stats.renderStats.triangles = 0;
    Stats.renderStats.vertices = 0;
    Stats.renderStats.uniforms = 0;
    Stats.renderStats.textures = 0;
  }

  /**
   * 增加绘制调用次数
   * @param count 增加数量，默认为1
   */
  static addDrawCall (count: number = 1): void {
    if (!Stats.enabled) {return;}
    Stats.renderStats.drawCalls += count;
  }

  /**
   * 增加三角形数量
   * @param count 增加数量
   */
  static addTriangles (count: number): void {
    if (!Stats.enabled) {return;}
    Stats.renderStats.triangles += count;
  }

  /**
   * 增加顶点数量
   * @param count 增加数量
   */
  static addVertices (count: number): void {
    if (!Stats.enabled) {return;}
    Stats.renderStats.vertices += count;
  }

  /**
   * 开始性能标记
   * @param name 标记名称
   * @returns 开始时间戳
   */
  static beginMarker (name: string): number {
    if (!Stats.enabled) {return 0;}

    // 如果在浏览器环境且支持Performance API
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}_start`);
    }

    return performance.now();
  }

  /**
   * 结束性能标记并计算执行时间
   * @param name 标记名称
   * @param startTime 开始时间戳
   */
  static endMarker (name: string, startTime: number): void {
    if (!Stats.enabled) {return;}

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 在浏览器环境且支持Performance API
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${name}_end`);
      try {
        performance.measure(name, `${name}_start`, `${name}_end`);
      } catch (e) {
        // 可能因为标记不存在而失败，忽略错误
      }
    }

    // 更新标记统计数据
    let markerStats = Stats.markers.get(name);

    if (!markerStats) {
      markerStats = { total: 0, count: 0, min: Number.MAX_VALUE, max: 0 };
      Stats.markers.set(name, markerStats);
    }

    markerStats.total += duration;
    markerStats.count++;
    markerStats.min = Math.min(markerStats.min, duration);
    markerStats.max = Math.max(markerStats.max, duration);
  }

  /**
   * 获取当前FPS
   */
  static getFPS (): number {
    return Stats.currentFPS;
  }

  /**
   * 获取平均FPS
   */
  static getAverageFPS (): number {
    if (Stats.fpsHistory.length === 0) {return 0;}

    const sum = Stats.fpsHistory.reduce((a, b) => a + b, 0);

    return sum / Stats.fpsHistory.length;
  }

  /**
   * 获取最小FPS
   */
  static getMinFPS (): number {
    if (Stats.fpsHistory.length === 0) {return 0;}

    return Math.min(...Stats.fpsHistory);
  }

  /**
   * 获取最大FPS
   */
  static getMaxFPS (): number {
    if (Stats.fpsHistory.length === 0) {return 0;}

    return Math.max(...Stats.fpsHistory);
  }

  /**
   * 获取渲染统计数据
   */
  static getRenderStats (): Readonly<typeof Stats.renderStats> {
    return { ...Stats.renderStats };
  }

  /**
   * 获取内存使用统计
   */
  static getMemoryStats (): Readonly<typeof Stats.memoryStats> {
    return { ...Stats.memoryStats };
  }

  /**
   * 获取性能标记统计数据
   */
  static getMarkerStats (): Record<string, { average: number, min: number, max: number, count: number }> {
    const result: Record<string, { average: number, min: number, max: number, count: number }> = {};

    Stats.markers.forEach((value, key) => {
      result[key] = {
        average: value.count > 0 ? value.total / value.count : 0,
        min: value.min === Number.MAX_VALUE ? 0 : value.min,
        max: value.max,
        count: value.count,
      };
    });

    return result;
  }

  /**
   * 重置所有统计数据
   */
  static reset (): void {
    Stats.fpsHistory = [];
    Stats.totalTime = 0;
    Stats.totalFrames = 0;
    Stats.currentFPS = 0;
    Stats.resetRenderStats();
    Stats.markers.clear();
    Stats.lastTime = performance.now();
  }

  /**
   * 获取总运行时间(秒)
   */
  static getTotalRunTime (): number {
    return Stats.totalTime / 1000;
  }

  /**
   * 获取总帧数
   */
  static getTotalFrames (): number {
    return Stats.totalFrames;
  }
}