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
  /** 错误级别 */
  level: 'error' | 'warning';
}

/**
 * 错误收集配置
 */
export interface ErrorConfig {
  /** 最大错误数量，超过后会移除最旧的错误 */
  maxErrorCount: number;
  /** 最大警告数量，超过后会移除最旧的警告 */
  maxWarningCount: number;
}

/**
 * 默认配置
 */
const defaultConfig: ErrorConfig = {
  maxErrorCount: 1000,
  maxWarningCount: 500,
};

/**
 * 当前配置
 */
let currentConfig: ErrorConfig = { ...defaultConfig };

/**
 * 全局错误收集数组
 * 用户可以通过检查此数组的长度来判断是否有错误
 */
export const errors: ErrorInfo[] = [];

/**
 * 全局警告收集数组
 */
export const warnings: ErrorInfo[] = [];

/**
 * 配置错误收集系统
 * @param config 配置选项
 */
export function configureErrors(config: Partial<ErrorConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * 获取当前配置
 */
export function getErrorConfig(): Readonly<ErrorConfig> {
  return { ...currentConfig };
}

/**
 * 添加错误信息到数组，自动管理数组大小
 * @param info 错误信息
 * @param array 目标数组
 * @param maxCount 最大数量
 */
function addToArray(info: ErrorInfo, array: ErrorInfo[], maxCount: number): void {
  // 如果超过最大数量，移除最旧的记录
  while (array.length >= maxCount) {
    array.shift();
  }
  array.push(info);
}

/**
 * 记录错误到全局数组并抛出异常
 * 这样可以做到错误集中处理：既记录错误信息，又统一抛出
 * @param message 错误消息
 * @param component 组件名称（可选）
 * @param error 原始错误对象（可选）
 * @throws {Error} 总是抛出错误，确保调用者可以统一处理
 */
export function logError(message: string, component?: string, error?: Error): never {
  const errorInfo: ErrorInfo = {
    message,
    component,
    timestamp: Date.now(),
    stack: error?.stack,
    level: 'error',
  };
  addToArray(errorInfo, errors, currentConfig.maxErrorCount);
  throw new Error(message);
}

/**
 * 记录警告到全局数组，不抛出异常
 * 用于非致命性问题的记录
 * @param message 警告消息
 * @param component 组件名称（可选）
 */
export function logWarning(message: string, component?: string): void {
  const warningInfo: ErrorInfo = {
    message,
    component,
    timestamp: Date.now(),
    level: 'warning',
  };
  addToArray(warningInfo, warnings, currentConfig.maxWarningCount);
}

/**
 * 清空错误数组
 */
export function clearErrors(): void {
  errors.length = 0;
}

/**
 * 清空警告数组
 */
export function clearWarnings(): void {
  warnings.length = 0;
}

/**
 * 清空所有错误和警告
 */
export function clearAll(): void {
  clearErrors();
  clearWarnings();
}

/**
 * 获取错误数量
 */
export function getErrorCount(): number {
  return errors.length;
}

/**
 * 获取警告数量
 */
export function getWarningCount(): number {
  return warnings.length;
}
