/**
 * event-emitter.ts
 * 简单的事件发射器实现
 */

/**
 * 简单的事件发射器，用于Material和Mesh等类的事件处理
 */
export class EventEmitter<T extends Record<string, any>> {
  private listeners = new Map<keyof T, Set<(data: T[keyof T]) => void>>();

  /**
   * 添加事件监听器
   */
  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as any);
  }

  /**
   * 移除事件监听器
   */
  off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener as any);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * 触发事件
   */
  emit<K extends keyof T>(event: K, data: T[K]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${String(event)}:`, error);
        }
      });
    }
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }
}
