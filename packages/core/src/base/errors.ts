/**
 * 错误信息接口
 */
export interface ErrorInfo {
  /** 错误消息 */
  message: string;
  /** 发生错误的组件/模块 */
  component?: string;
  /** 发生错误的时间戳 */
  timestamp: number;
  /** 错误堆栈（如果有） */
  stack?: string;
}

/**
 * 全局错误收集数组
 * 用户可以通过检查此数组的长度来判断是否有错误
 */
export const errors: ErrorInfo[] = [];

/**
 * 记录错误到全局数组并抛出异常
 * 这样可以做到错误集中处理：既记录错误信息，又统一抛出
 * @param message 错误消息
 * @param component 组件名称（可选）
 * @param error 原始错误对象（可选）
 * @throws {Error} 总是抛出错误，确保调用者可以统一处理
 */
export function logError(message: string, component?: string, error?: Error): void {
  errors.push({
    message,
    component,
    timestamp: Date.now(),
    stack: error?.stack,
  });
  throw new Error(message);
}

/**
 * 清空错误数组
 */
export function clearErrors(): void {
  errors.length = 0;
}

/**
 * 获取错误数量
 */
export function getErrorCount(): number {
  return errors.length;
}
