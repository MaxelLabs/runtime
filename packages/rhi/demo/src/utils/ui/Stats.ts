/**
 * ui/Stats.ts
 * 性能统计面板 - 显示 FPS、帧时间等
 */

import type { StatsConfig } from './types';

/**
 * 性能统计面板
 *
 * 显示实时性能数据：
 * - FPS (每秒帧数)
 * - MS (帧时间，毫秒)
 * - Memory (内存使用，如果可用)
 *
 * @example
 * ```typescript
 * const stats = new Stats();
 *
 * runner.start((dt) => {
 *   stats.begin();
 *
 *   // ... 渲染代码 ...
 *
 *   stats.end();
 * });
 * ```
 */
export class Stats {
  private container: HTMLDivElement;
  private fpsElement: HTMLSpanElement | null = null;
  private msElement: HTMLSpanElement | null = null;
  private memElement: HTMLSpanElement | null = null;

  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private lastFrameTime: number = performance.now();
  private fps: number = 0;
  private ms: number = 0;

  private config: Required<StatsConfig>;

  constructor(config: StatsConfig = {}) {
    this.config = {
      position: config.position ?? 'top-left',
      show: config.show ?? ['fps', 'ms'],
    };

    this.container = this.createContainer();
    this.createPanels();
    document.body.appendChild(this.container);
  }

  /**
   * 帧开始时调用
   */
  begin(): void {
    this.lastFrameTime = performance.now();
  }

  /**
   * 帧结束时调用
   */
  end(): void {
    const now = performance.now();
    this.ms = now - this.lastFrameTime;
    this.frameCount++;

    // 每秒更新一次显示
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
      this.updateDisplay();
    }
  }

  /**
   * 销毁统计面板
   */
  destroy(): void {
    this.container.remove();
  }

  // ==================== 私有方法 ====================

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'stats-panel';

    const positions: Record<string, string> = {
      'top-left': 'top: 10px; left: 10px;',
      'top-right': 'top: 10px; right: 300px;',
      'bottom-left': 'bottom: 10px; left: 10px;',
      'bottom-right': 'bottom: 10px; right: 10px;',
    };

    container.style.cssText = `
      position: fixed;
      ${positions[this.config.position]}
      background: rgba(30, 30, 30, 0.9);
      border-radius: 4px;
      padding: 8px 12px;
      font-family: monospace;
      font-size: 12px;
      color: #fff;
      z-index: 10001;
      min-width: 80px;
    `;

    return container;
  }

  private createPanels(): void {
    if (this.config.show.includes('fps')) {
      this.fpsElement = this.createPanel('FPS', '#0f0');
    }

    if (this.config.show.includes('ms')) {
      this.msElement = this.createPanel('MS', '#0ff');
    }

    if (this.config.show.includes('memory')) {
      this.memElement = this.createPanel('MB', '#f0f');
    }
  }

  private createPanel(label: string, color: string): HTMLSpanElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    `;

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    labelSpan.style.color = '#888';

    const valueSpan = document.createElement('span');
    valueSpan.style.color = color;
    valueSpan.style.marginLeft = '12px';
    valueSpan.textContent = '--';
    valueSpan.style.fontSize = '14px';

    panel.appendChild(labelSpan);
    panel.appendChild(valueSpan);
    this.container.appendChild(panel);

    return valueSpan;
  }

  private updateDisplay(): void {
    if (this.fpsElement) {
      this.fpsElement.textContent = String(this.fps);
      // 根据 FPS 调整颜色
      if (this.fps >= 55) {
        this.fpsElement.style.color = '#0f0';
      } else if (this.fps >= 30) {
        this.fpsElement.style.color = '#ff0';
      } else {
        this.fpsElement.style.color = '#f00';
      }
    }

    if (this.msElement) {
      this.msElement.textContent = this.ms.toFixed(1);
    }

    if (this.memElement && (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory) {
      const mem = (performance as Performance & { memory: { usedJSHeapSize: number } }).memory;
      const mb = Math.round(mem.usedJSHeapSize / (1024 * 1024));
      this.memElement.textContent = String(mb);
    }
  }
}
