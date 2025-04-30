/**
 * 着色器宏定义类，用于管理着色器预处理宏
 */
export class ShaderMacro {
  /** 全局宏定义ID计数器 */
  private static _macroIDCounter: number = 0;
  /** 宏名称到ID的映射表 */
  private static _nameToIDMap: Map<string, number> = new Map();
  /** ID到宏名称的映射表 */
  private static _idToNameMap: Map<number, string> = new Map();
  /** ID到宏对象的映射表 */
  private static _idToMacroMap: Map<number, ShaderMacro> = new Map();

  /** 宏ID */
  private _id: number;
  /** 宏名称 */
  private _name: string;
  /** 宏值 */
  private _value: string | number | boolean;

  /**
   * 创建着色器宏定义
   * @param name 宏名称
   * @param value 宏值
   */
  constructor(name: string, value: string | number | boolean = '') {
    this._name = name;
    this._value = value;
    this._id = ShaderMacro._getIDByName(name);

    // 将宏实例添加到全局映射表
    ShaderMacro._idToMacroMap.set(this._id, this);
  }

  /**
   * 获取宏ID
   */
  get id(): number {
    return this._id;
  }

  /**
   * 获取宏名称
   */
  get name(): string {
    return this._name;
  }

  /**
   * 获取宏值
   */
  get value(): string | number | boolean {
    return this._value;
  }

  /**
   * 设置宏值
   */
  set value(value: string | number | boolean) {
    this._value = value;
  }

  /**
   * 通过宏名称获取宏ID（内部方法）
   * @param name 宏名称
   * @returns 宏ID
   */
  private static _getIDByName(name: string): number {
    if (ShaderMacro._nameToIDMap.has(name)) {
      return ShaderMacro._nameToIDMap.get(name);
    }

    const id = ShaderMacro._macroIDCounter++;
    ShaderMacro._nameToIDMap.set(name, id);
    ShaderMacro._idToNameMap.set(id, name);
    return id;
  }

  /**
   * 通过宏名称获取宏定义对象
   * @param name 宏名称
   * @returns 宏定义对象
   */
  static getByName(name: string): ShaderMacro {
    const id = ShaderMacro._getIDByName(name);
    
    if (ShaderMacro._idToMacroMap.has(id)) {
      return ShaderMacro._idToMacroMap.get(id);
    }
    
    return new ShaderMacro(name);
  }

  /**
   * 通过宏ID获取宏名称
   * @param id 宏ID
   * @returns 宏名称
   */
  static getNameById(id: number): string {
    return ShaderMacro._idToNameMap.get(id) || '';
  }

  /**
   * 通过宏ID获取宏定义对象
   * @param id 宏ID
   * @returns 宏定义对象
   */
  static getById(id: number): ShaderMacro {
    if (ShaderMacro._idToMacroMap.has(id)) {
      return ShaderMacro._idToMacroMap.get(id);
    }
    
    const name = ShaderMacro.getNameById(id);
    if (name) {
      return new ShaderMacro(name);
    }
    
    return null;
  }

  /**
   * 获取宏在GLSL中的表示
   * @returns GLSL中的宏定义字符串
   */
  toGLSL(): string {
    if (this._value === false) {
      // 如果值为false，则不定义该宏
      return '';
    } else if (this._value === true || this._value === '') {
      // 如果值为true或空字符串，则定义为无值宏
      return `#define ${this._name}`;
    } else {
      // 定义为有值宏
      return `#define ${this._name} ${this._value}`;
    }
  }

  /**
   * 创建常用的内置宏定义
   */
  static createBuiltins(): void {
    // 创建常用的内置宏
    ShaderMacro.getByName('ENGINE_VERSION');
    ShaderMacro.getByName('ENGINE_IS_WEBGL2');
    ShaderMacro.getByName('ENGINE_IS_WEBGPU');
    ShaderMacro.getByName('ENGINE_IS_COLORSPACE_GAMMA');
    ShaderMacro.getByName('ENGINE_IS_COLORSPACE_LINEAR');
    ShaderMacro.getByName('ENGINE_NO_DEPTH_TEXTURE');
    ShaderMacro.getByName('ENGINE_SUPPORTS_FLOAT_TEXTURE');
    ShaderMacro.getByName('ENGINE_MAX_JOINTS');
    ShaderMacro.getByName('ENGINE_MAX_LIGHTS');
    ShaderMacro.getByName('ENGINE_ENABLE_SHADOW');
    ShaderMacro.getByName('ENGINE_ENABLE_HDR');
    ShaderMacro.getByName('ENGINE_ENABLE_PBR');
  }
} 