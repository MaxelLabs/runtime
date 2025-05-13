/**
 * 着色器属性类型枚举
 */
export enum ShaderPropertyType {
  /** 浮点数 */
  Float = 0,
  /** 整数 */
  Int = 1,
  /** 二维向量 */
  Vector2 = 2,
  /** 三维向量 */
  Vector3 = 3,
  /** 四维向量 */
  Vector4 = 4,
  /** 颜色 */
  Color = 5,
  /** 矩阵 */
  Matrix4 = 6,
  /** 纹理 */
  Texture = 7,
  /** 结构体 */
  Struct = 8,
  /** 数组 */
  Array = 9
}

/**
 * 着色器属性类，管理着色器属性的名称和ID映射
 */
export class ShaderProperty {
  /** 全局属性ID计数器 */
  private static _propertyIDCounter: number = 0;
  /** 属性名称到ID的映射表 */
  private static _nameToIDMap: Map<string, number> = new Map();
  /** ID到属性名称的映射表 */
  private static _idToNameMap: Map<number, string> = new Map();

  /** 属性ID */
  private _id: number;
  /** 属性名称 */
  private _name: string;
  /** 属性类型 */
  private _type: ShaderPropertyType;

  /**
   * 创建着色器属性
   * @param nameOrID 属性名称或ID
   * @param type 属性类型
   */
  constructor (nameOrID: string | number, type: ShaderPropertyType = ShaderPropertyType.Float) {
    if (typeof nameOrID === 'string') {
      this._name = nameOrID;
      this._id = ShaderProperty.getIDByName(nameOrID);
    } else {
      this._id = nameOrID;
      this._name = ShaderProperty.getNameById(nameOrID) || '';
    }
    this._type = type;
  }

  /**
   * 获取属性ID
   */
  get id (): number {
    return this._id;
  }

  /**
   * 获取属性名称
   */
  get name (): string {
    return this._name;
  }

  /**
   * 获取属性类型
   */
  get type (): ShaderPropertyType {
    return this._type;
  }

  /**
   * 通过属性名称获取属性ID
   * @param name 属性名称
   * @returns 属性ID
   */
  static getIDByName (name: string): number {
    if (ShaderProperty._nameToIDMap.has(name)) {
      return ShaderProperty._nameToIDMap.get(name);
    }

    const id = ShaderProperty._propertyIDCounter++;

    ShaderProperty._nameToIDMap.set(name, id);
    ShaderProperty._idToNameMap.set(id, name);

    return id;
  }

  /**
   * 通过属性ID获取属性名称
   * @param id 属性ID
   * @returns 属性名称
   */
  static getNameById (id: number): string {
    return ShaderProperty._idToNameMap.get(id) || '';
  }

  /**
   * 检查属性ID是否存在
   * @param id 属性ID
   * @returns 是否存在
   */
  static hasID (id: number): boolean {
    return ShaderProperty._idToNameMap.has(id);
  }

  /**
   * 检查属性名称是否存在
   * @param name 属性名称
   * @returns 是否存在
   */
  static hasName (name: string): boolean {
    return ShaderProperty._nameToIDMap.has(name);
  }

  /**
   * 获取所有属性名称
   * @returns 属性名称数组
   */
  static getAllPropertyNames (): string[] {
    return Array.from(ShaderProperty._nameToIDMap.keys());
  }

  /**
   * 创建常用的内置着色器属性
   */
  static createBuiltins (): void {
    // 创建常用的内置着色器属性
    // 矩阵
    ShaderProperty.getIDByName('modelMatrix');
    ShaderProperty.getIDByName('viewMatrix');
    ShaderProperty.getIDByName('projectionMatrix');
    ShaderProperty.getIDByName('viewProjectionMatrix');
    ShaderProperty.getIDByName('modelViewMatrix');
    ShaderProperty.getIDByName('normalMatrix');

    // 常用纹理名称
    ShaderProperty.getIDByName('mainTexture');
    ShaderProperty.getIDByName('diffuseTexture');
    ShaderProperty.getIDByName('normalTexture');
    ShaderProperty.getIDByName('specularTexture');
    ShaderProperty.getIDByName('emissiveTexture');
    ShaderProperty.getIDByName('roughnessTexture');
    ShaderProperty.getIDByName('metallicTexture');
    ShaderProperty.getIDByName('occlusionTexture');

    // 常用材质参数
    ShaderProperty.getIDByName('diffuseColor');
    ShaderProperty.getIDByName('specularColor');
    ShaderProperty.getIDByName('emissiveColor');
    ShaderProperty.getIDByName('roughness');
    ShaderProperty.getIDByName('metallic');
    ShaderProperty.getIDByName('opacity');

    // 常用相机参数
    ShaderProperty.getIDByName('cameraPosition');
    ShaderProperty.getIDByName('cameraDirection');
    ShaderProperty.getIDByName('nearPlane');
    ShaderProperty.getIDByName('farPlane');

    // 常用光照参数
    ShaderProperty.getIDByName('lightPosition');
    ShaderProperty.getIDByName('lightDirection');
    ShaderProperty.getIDByName('lightColor');
    ShaderProperty.getIDByName('lightIntensity');
    ShaderProperty.getIDByName('ambientColor');
  }
}