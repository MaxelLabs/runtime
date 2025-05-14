/**
 * 日志级别枚举
 */
export enum LogLevel {
  /** 调试信息 */
  Debug = 0,
  /** 普通信息 */
  Info = 1,
  /** 警告信息 */
  Warning = 2,
  /** 错误信息 */
  Error = 3,
  /** 关闭日志 */
  None = 4
}

/**
 * 日志系统
 * 提供分级别的日志管理，可以根据环境切换日志级别
 */
export class Logger {
  /** 日志级别 */
  private static level: LogLevel = LogLevel.Info;
  /** 是否在日志前添加时间戳 */
  private static showTimestamp: boolean = true;
  /** 是否启用堆栈追踪（仅对错误有效） */
  private static enableStackTrace: boolean = true;
  /** 日志前缀 */
  private static prefix: string = '[MAX Engine]';
  /** 是否将日志保存到存储中 */
  private static saveToStorage: boolean = false;
  /** 日志历史记录 */
  private static history: string[] = [];
  /** 最大历史记录条数 */
  private static maxHistorySize: number = 1000;

  /**
   * 设置日志级别
   * @param level 日志级别
   */
  static setLevel (level: LogLevel): void {
    Logger.level = level;
  }

  /**
   * 获取当前日志级别
   */
  static getLevel (): LogLevel {
    return Logger.level;
  }

  /**
   * 设置是否显示时间戳
   * @param show 是否显示
   */
  static setShowTimestamp (show: boolean): void {
    Logger.showTimestamp = show;
  }

  /**
   * 设置是否启用堆栈追踪
   * @param enable 是否启用
   */
  static setEnableStackTrace (enable: boolean): void {
    Logger.enableStackTrace = enable;
  }

  /**
   * 设置日志前缀
   * @param prefix 前缀字符串
   */
  static setPrefix (prefix: string): void {
    Logger.prefix = prefix;
  }

  /**
   * 设置是否将日志保存到存储
   * @param save 是否保存
   */
  static setSaveToStorage (save: boolean): void {
    Logger.saveToStorage = save;
  }

  /**
   * 格式化日志消息
   * @param message 消息内容
   * @param level 日志级别
   * @returns 格式化后的消息
   */
  private static formatMessage (message: string, level: LogLevel): string {
    const levelName = LogLevel[level];
    let formattedMessage = `${Logger.prefix} [${levelName}]`;

    if (Logger.showTimestamp) {
      const timestamp = new Date().toISOString();

      formattedMessage += ` [${timestamp}]`;
    }

    formattedMessage += `: ${message}`;

    return formattedMessage;
  }

  /**
   * 保存日志到历史记录
   * @param message 消息内容
   */
  private static saveToHistory (message: string): void {
    Logger.history.push(message);

    // 限制历史记录大小
    if (Logger.history.length > Logger.maxHistorySize) {
      Logger.history.shift();
    }

    // 保存到本地存储
    if (Logger.saveToStorage && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('max_engine_logs', JSON.stringify(Logger.history.slice(-100)));
      } catch (e) {
        // 存储可能会失败，忽略错误
      }
    }
  }

  /**
   * 输出调试级别日志
   * @param message 日志消息
   * @param optionalParams 可选参数
   */
  static debug (message: string, ...optionalParams: any[]): void {
    if (Logger.level <= LogLevel.Debug) {
      const formattedMessage = Logger.formatMessage(message, LogLevel.Debug);

      console.debug(formattedMessage, ...optionalParams);
      Logger.saveToHistory(formattedMessage);
    }
  }

  /**
   * 输出信息级别日志
   * @param message 日志消息
   * @param optionalParams 可选参数
   */
  static info (message: string, ...optionalParams: any[]): void {
    if (Logger.level <= LogLevel.Info) {
      const formattedMessage = Logger.formatMessage(message, LogLevel.Info);

      console.info(formattedMessage, ...optionalParams);
      Logger.saveToHistory(formattedMessage);
    }
  }

  /**
   * 输出警告级别日志
   * @param message 日志消息
   * @param optionalParams 可选参数
   */
  static warn (message: string, ...optionalParams: any[]): void {
    if (Logger.level <= LogLevel.Warning) {
      const formattedMessage = Logger.formatMessage(message, LogLevel.Warning);

      console.warn(formattedMessage, ...optionalParams);
      Logger.saveToHistory(formattedMessage);
    }
  }

  /**
   * 输出错误级别日志
   * @param message 日志消息
   * @param optionalParams 可选参数
   */
  static error (message: string, ...optionalParams: any[]): void {
    if (Logger.level <= LogLevel.Error) {
      const formattedMessage = Logger.formatMessage(message, LogLevel.Error);

      if (Logger.enableStackTrace) {
        console.error(formattedMessage, ...optionalParams, new Error().stack);
      } else {
        console.error(formattedMessage, ...optionalParams);
      }

      Logger.saveToHistory(formattedMessage);
    }
  }

  /**
   * 获取日志历史记录
   * @returns 日志历史记录数组
   */
  static getHistory (): string[] {
    return [...Logger.history];
  }

  /**
   * 清除日志历史记录
   */
  static clearHistory (): void {
    Logger.history = [];

    if (Logger.saveToStorage && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('max_engine_logs');
      } catch (e) {
        // 存储可能会失败，忽略错误
      }
    }
  }

  /**
   * 加载存储中的日志历史
   */
  static loadHistoryFromStorage (): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const storedLogs = localStorage.getItem('max_engine_logs');

        if (storedLogs) {
          const parsedLogs = JSON.parse(storedLogs);

          if (Array.isArray(parsedLogs)) {
            Logger.history = parsedLogs;
          }
        }
      } catch (e) {
        // 读取可能会失败，忽略错误
      }
    }
  }
}