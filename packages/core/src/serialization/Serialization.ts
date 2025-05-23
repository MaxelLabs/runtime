/**
 * 序列化标志
 */
export enum SerializeFlags {
  /** 默认行为 */
  Default = 0,
  /** 不序列化null值 */
  IgnoreNull = 1 << 0,
  /** 不序列化未定义值 */
  IgnoreUndefined = 1 << 1,
  /** 格式化JSON输出 */
  PrettyPrint = 1 << 2,
  /** 包含类型信息 */
  IncludeTypeInfo = 1 << 3,
  /** 忽略私有属性 */
  IgnorePrivate = 1 << 4,
  /** 不保存默认值 */
  IgnoreDefault = 1 << 5,
}

/**
 * 序列化字段属性
 */
export interface SerializeField {
  /** 序列化名称，默认使用属性名 */
  name?: string;
  /** 是否可序列化，默认true */
  serializable?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 自定义序列化函数 */
  serialize?: (value: any) => any;
  /** 自定义反序列化函数 */
  deserialize?: (data: any) => any;
  /** 类型信息 */
  type?: any;
}

/**
 * 序列化字段元数据
 */
interface SerializeFieldInfo {
  name: string;
  propertyKey: string;
  defaultValue?: any;
  serializable: boolean;
  serialize?: (value: any) => any;
  deserialize?: (data: any) => any;
  type?: any;
}

/**
 * 可序列化接口
 */
export interface ISerializable {
  /**
   * 自定义序列化方法
   * @returns 序列化后的对象
   */
  _serialize(): any;

  /**
   * 自定义反序列化方法
   * @param data 反序列化数据
   */
  _deserialize(data: any): void;
}

/**
 * 类型信息
 */
interface TypeInfo {
  type: string;
  module?: string;
}

/**
 * 元数据存储
 */
const metadataMap: Map<Function, Map<string, SerializeFieldInfo>> = new Map();

/**
 * 类型注册表
 */
const typeRegistry: Map<string, Function> = new Map();

/**
 * 序列化字段装饰器
 * @param options 字段配置选项
 */
export function serializable(options: SerializeField = {}): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') {
      return;
    }

    const constructor = target.constructor;

    // 确保类有元数据映射
    if (!metadataMap.has(constructor)) {
      metadataMap.set(constructor, new Map());
    }

    const metadata = metadataMap.get(constructor);

    // 保存字段元数据
    metadata.set(propertyKey, {
      name: options.name || propertyKey,
      propertyKey,
      defaultValue: options.defaultValue,
      serializable: options.serializable !== false,
      serialize: options.serialize,
      deserialize: options.deserialize,
      type: options.type,
    });
  };
}

/**
 * 序列化类装饰器
 * @param typeName 类型名称
 * @param module 模块名
 */
export function serializableClass(typeName?: string, module?: string): ClassDecorator {
  return function (target: Function) {
    // 注册类型
    const name = typeName || target.name;

    typeRegistry.set(module ? `${module}.${name}` : name, target);

    // 确保有元数据映射
    if (!metadataMap.has(target)) {
      metadataMap.set(target, new Map());
    }
  };
}

/**
 * 序列化管理器
 */
export class SerializationManager {
  /**
   * 注册类型
   * @param type 类型构造函数
   * @param typeName 类型名称
   * @param module 模块名
   */
  static registerType(type: Function, typeName?: string, module?: string): void {
    const name = typeName || type.name;

    typeRegistry.set(module ? `${module}.${name}` : name, type);
  }

  /**
   * 获取类型
   * @param typeName 类型名称
   * @returns 类型构造函数
   */
  static getType(typeName: string): Function | undefined {
    return typeRegistry.get(typeName);
  }

  /**
   * 对象序列化
   * @param obj 待序列化对象
   * @param flags 序列化标志
   * @returns 序列化后的JSON字符串
   */
  static serialize(obj: any, flags: SerializeFlags = SerializeFlags.Default): string {
    const data = this.toJSON(obj, flags);

    const indent = flags & SerializeFlags.PrettyPrint ? 2 : undefined;

    return JSON.stringify(data, null, indent);
  }

  /**
   * 将对象转换为可序列化的JSON对象
   * @param obj 源对象
   * @param flags 序列化标志
   * @returns 可序列化的JSON对象
   */
  static toJSON(obj: any, flags: SerializeFlags = SerializeFlags.Default): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // 处理原始类型
    if (typeof obj !== 'object') {
      return obj;
    }

    // 处理数组
    if (Array.isArray(obj)) {
      return obj.map((item) => this.toJSON(item, flags));
    }

    // 处理Date对象
    if (obj instanceof Date) {
      return {
        __type: 'Date',
        value: obj.toISOString(),
      };
    }

    // 处理Map对象
    if (obj instanceof Map) {
      const entries = Array.from(obj.entries()).map(([key, value]) => ({
        key: this.toJSON(key, flags),
        value: this.toJSON(value, flags),
      }));

      return {
        __type: 'Map',
        entries,
      };
    }

    // 处理Set对象
    if (obj instanceof Set) {
      return {
        __type: 'Set',
        values: Array.from(obj).map((item) => this.toJSON(item, flags)),
      };
    }

    // 使用自定义序列化方法
    if (typeof obj._serialize === 'function') {
      const data = obj._serialize();

      // 添加类型信息
      if (flags & SerializeFlags.IncludeTypeInfo) {
        for (const [constructor, typeInfo] of typeRegistry.entries()) {
          if (obj instanceof constructor) {
            data.__type = constructor.name;

            break;
          }
        }
      }

      return data;
    }

    // 创建结果对象
    const result: any = {};

    // 添加类型信息
    if (flags & SerializeFlags.IncludeTypeInfo) {
      const constructor = obj.constructor;

      if (constructor && constructor !== Object) {
        for (const [typeName, typeConstructor] of typeRegistry.entries()) {
          if (constructor === typeConstructor) {
            result.__type = typeName;

            break;
          }
        }
      }
    }

    // 获取类的元数据
    const metadata = metadataMap.get(obj.constructor) || new Map();

    // 序列化所有字段
    for (const [propertyKey, fieldInfo] of metadata.entries()) {
      if (!fieldInfo.serializable) {
        continue;
      }

      const value = obj[propertyKey];

      // 忽略空值
      if (
        (flags & SerializeFlags.IgnoreNull && value === null) ||
        (flags & SerializeFlags.IgnoreUndefined && value === undefined)
      ) {
        continue;
      }

      // 忽略默认值
      if (flags & SerializeFlags.IgnoreDefault && value === fieldInfo.defaultValue) {
        continue;
      }

      // 使用自定义序列化函数
      if (fieldInfo.serialize) {
        result[fieldInfo.name] = fieldInfo.serialize(value);
      } else {
        result[fieldInfo.name] = this.toJSON(value, flags);
      }
    }

    // 处理没有元数据的普通对象属性
    if (metadata.size === 0) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // 忽略私有属性
          if (flags & SerializeFlags.IgnorePrivate && key.startsWith('_')) {
            continue;
          }

          const value = obj[key];

          // 忽略空值
          if (
            (flags & SerializeFlags.IgnoreNull && value === null) ||
            (flags & SerializeFlags.IgnoreUndefined && value === undefined)
          ) {
            continue;
          }

          result[key] = this.toJSON(value, flags);
        }
      }
    }

    return result;
  }

  /**
   * 反序列化对象
   * @param json JSON字符串或对象
   * @param targetType 目标类型
   * @returns 反序列化的对象
   */
  static deserialize<T>(json: string | any, targetType?: Function): T {
    const data = typeof json === 'string' ? JSON.parse(json) : json;

    return this.fromJSON<T>(data, targetType);
  }

  /**
   * 从JSON对象创建实例
   * @param data JSON数据
   * @param targetType 目标类型
   * @returns 反序列化的对象
   */
  static fromJSON<T>(data: any, targetType?: Function): T {
    if (data === null || data === undefined) {
      return data;
    }

    // 处理原始类型
    if (typeof data !== 'object') {
      return data;
    }

    // 处理数组
    if (Array.isArray(data)) {
      return data.map((item) => this.fromJSON(item)) as any;
    }

    // 处理特殊类型
    if (data.__type) {
      // 处理Date
      if (data.__type === 'Date') {
        return new Date(data.value) as any;
      }

      // 处理Map
      if (data.__type === 'Map') {
        const map = new Map();

        for (const entry of data.entries) {
          map.set(this.fromJSON(entry.key), this.fromJSON(entry.value));
        }

        return map as any;
      }

      // 处理Set
      if (data.__type === 'Set') {
        const set = new Set();

        for (const value of data.values) {
          set.add(this.fromJSON(value));
        }

        return set as any;
      }

      // 处理自定义类型
      const typeConstructor = this.getType(data.__type) || targetType;

      if (typeConstructor) {
        return this.createInstanceFromData(typeConstructor, data);
      }
    }

    // 如果提供了目标类型
    if (targetType) {
      return this.createInstanceFromData(targetType, data);
    }

    // 处理普通对象
    const result: any = {};

    for (const key in data) {
      if (data.hasOwnProperty(key) && key !== '__type') {
        result[key] = this.fromJSON(data[key]);
      }
    }

    return result as T;
  }

  /**
   * 从数据创建类型实例
   * @param type 类型构造函数
   * @param data JSON数据
   * @returns 创建的实例
   */
  private static createInstanceFromData<T>(type: Function, data: any): T {
    // 创建实例
    const instance = new (type as any)();

    // 使用自定义反序列化方法
    if (typeof instance._deserialize === 'function') {
      instance._deserialize(data);

      return instance;
    }

    // 获取类的元数据
    const metadata = metadataMap.get(type) || new Map();

    // 处理所有可序列化字段
    for (const [propertyKey, fieldInfo] of metadata.entries()) {
      if (!fieldInfo.serializable) {
        continue;
      }

      const dataKey = fieldInfo.name;

      if (dataKey in data) {
        const value = data[dataKey];

        // 使用自定义反序列化函数
        if (fieldInfo.deserialize) {
          instance[propertyKey] = fieldInfo.deserialize(value);
        } else if (fieldInfo.type) {
          // 使用类型信息反序列化
          instance[propertyKey] = this.fromJSON(value, fieldInfo.type);
        } else {
          // 直接反序列化
          instance[propertyKey] = this.fromJSON(value);
        }
      } else if (fieldInfo.defaultValue !== undefined) {
        // 设置默认值
        instance[propertyKey] = fieldInfo.defaultValue;
      }
    }

    // 如果没有元数据，处理所有属性
    if (metadata.size === 0) {
      for (const key in data) {
        if (data.hasOwnProperty(key) && key !== '__type') {
          instance[key] = this.fromJSON(data[key]);
        }
      }
    }

    return instance as T;
  }

  /**
   * 克隆对象
   * @param obj 源对象
   * @returns 克隆后的对象
   */
  static clone<T>(obj: T): T {
    const json = this.serialize(obj, SerializeFlags.IncludeTypeInfo);

    return this.deserialize(json);
  }
}
