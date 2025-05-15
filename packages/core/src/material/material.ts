import { Vector4 } from '@maxellabs/math';
import { ReferResource } from '../base/refer-resource';
import { CullFace, DepthFunc, BlendMode } from './constants';

/**
 * 材质参数类型
 */
export enum MaterialParamType {
  /** 浮点数 */
  Float,
  /** 整数 */
  Integer,
  /** 布尔值 */
  Boolean,
  /** 2维向量 */
  Vector2,
  /** 3维向量 */
  Vector3,
  /** 4维向量 */
  Vector4,
  /** 颜色 */
  Color,
  /** 4x4矩阵 */
  Matrix4,
  /** 纹理 */
  Texture
}

/**
 * 材质参数
 */
export interface MaterialParam {
  /** 参数名称 */
  name: string,
  /** 参数类型 */
  type: MaterialParamType,
  /** 参数值 */
  value: any,
}

/**
 * 材质基类，定义物体的外观
 */
export class Material extends ReferResource {
  /** 是否启用 */
  private _enabled: boolean = true;
  /** 渲染面类型 */
  private _cullFace: CullFace = CullFace.Back;
  /** 是否启用深度测试 */
  private _depthTest: boolean = true;
  /** 是否启用深度写入 */
  private _depthWrite: boolean = true;
  /** 深度测试函数 */
  private _depthFunc: DepthFunc = DepthFunc.LessEqual;
  /** 混合模式 */
  private _blendMode: BlendMode = BlendMode.Opaque;
  /** 透明度，范围0到1 */
  private _opacity: number = 1.0;
  /** 着色器ID */
  private _shaderId: string = '';
  /** 参数映射表 */
  private _params: Map<string, MaterialParam> = new Map();
  /** 材质是否需要更新 */
  private _dirty: boolean = true;

  /**
   * 创建一个新的材质
   * @param name 材质名称
   */
  constructor (name: string = 'Material') {
    super();
    this.name = name;
  }

  /** 获取是否启用 */
  get enabled (): boolean {
    return this._enabled;
  }

  /** 设置是否启用 */
  set enabled (value: boolean) {
    this._enabled = value;
    this._dirty = true;
  }

  /** 获取渲染面类型 */
  get cullFace (): CullFace {
    return this._cullFace;
  }

  /** 设置渲染面类型 */
  set cullFace (value: CullFace) {
    this._cullFace = value;
    this._dirty = true;
  }

  /** 获取是否启用深度测试 */
  get depthTest (): boolean {
    return this._depthTest;
  }

  /** 设置是否启用深度测试 */
  set depthTest (value: boolean) {
    this._depthTest = value;
    this._dirty = true;
  }

  /** 获取是否启用深度写入 */
  get depthWrite (): boolean {
    return this._depthWrite;
  }

  /** 设置是否启用深度写入 */
  set depthWrite (value: boolean) {
    this._depthWrite = value;
    this._dirty = true;
  }

  /** 获取深度测试函数 */
  get depthFunc (): DepthFunc {
    return this._depthFunc;
  }

  /** 设置深度测试函数 */
  set depthFunc (value: DepthFunc) {
    this._depthFunc = value;
    this._dirty = true;
  }

  /** 获取混合模式 */
  get blendMode (): BlendMode {
    return this._blendMode;
  }

  /** 设置混合模式 */
  set blendMode (value: BlendMode) {
    this._blendMode = value;
    this._dirty = true;
  }

  /** 获取透明度 */
  get opacity (): number {
    return this._opacity;
  }

  /** 设置透明度 */
  set opacity (value: number) {
    // 确保透明度在有效范围内
    this._opacity = Math.max(0, Math.min(1, value));
    this._dirty = true;
  }

  /** 获取着色器ID */
  get shaderId (): string {
    return this._shaderId;
  }

  /** 设置着色器ID */
  set shaderId (value: string) {
    this._shaderId = value;
    this._dirty = true;
  }

  /** 获取材质是否需要更新 */
  get dirty (): boolean {
    return this._dirty;
  }

  /** 设置材质是否需要更新 */
  set dirty (value: boolean) {
    this._dirty = value;
  }

  /**
   * 设置浮点数参数
   * @param name 参数名称
   * @param value 参数值
   */
  setFloat (name: string, value: number): void {
    this._params.set(name, {
      name,
      type: MaterialParamType.Float,
      value,
    });
    this._dirty = true;
  }

  /**
   * 获取浮点数参数
   * @param name 参数名称
   * @param defaultValue 默认值
   * @returns 参数值
   */
  getFloat (name: string, defaultValue: number = 0): number {
    const param = this._params.get(name);

    if (param && param.type === MaterialParamType.Float) {
      return param.value as number;
    }

    return defaultValue;
  }

  /**
   * 设置整数参数
   * @param name 参数名称
   * @param value 参数值
   */
  setInt (name: string, value: number): void {
    this._params.set(name, {
      name,
      type: MaterialParamType.Integer,
      value: Math.floor(value),
    });
    this._dirty = true;
  }

  /**
   * 获取整数参数
   * @param name 参数名称
   * @param defaultValue 默认值
   * @returns 参数值
   */
  getInt (name: string, defaultValue: number = 0): number {
    const param = this._params.get(name);

    if (param && param.type === MaterialParamType.Integer) {
      return param.value as number;
    }

    return defaultValue;
  }

  /**
   * 设置布尔参数
   * @param name 参数名称
   * @param value 参数值
   */
  setBool (name: string, value: boolean): void {
    this._params.set(name, {
      name,
      type: MaterialParamType.Boolean,
      value,
    });
    this._dirty = true;
  }

  /**
   * 获取布尔参数
   * @param name 参数名称
   * @param defaultValue 默认值
   * @returns 参数值
   */
  getBool (name: string, defaultValue: boolean = false): boolean {
    const param = this._params.get(name);

    if (param && param.type === MaterialParamType.Boolean) {
      return param.value as boolean;
    }

    return defaultValue;
  }

  /**
   * 设置Vector4参数（颜色）
   * @param name 参数名称
   * @param r 红色分量(0-1)
   * @param g 绿色分量(0-1)
   * @param b 蓝色分量(0-1)
   * @param a 透明度(0-1)
   */
  setColor (name: string, r: number, g: number, b: number, a: number = 1): void {
    this._params.set(name, {
      name,
      type: MaterialParamType.Color,
      value: new Vector4(r, g, b, a),
    });
    this._dirty = true;
  }

  /**
   * 获取Vector4参数（颜色）
   * @param name 参数名称
   * @param defaultValue 默认值
   * @returns 参数值
   */
  getColor (name: string, defaultValue: Vector4 = new Vector4(1, 1, 1, 1)): Vector4 {
    const param = this._params.get(name);

    if (param && param.type === MaterialParamType.Color) {
      return (param.value as Vector4).clone();
    }

    return defaultValue.clone();
  }

  /**
   * 设置纹理参数
   * @param name 参数名称
   * @param value 纹理
   */
  setTexture (name: string, value: any): void {
    // 如果是引用计数资源，增加引用计数
    if (value && typeof value.addRef === 'function') {
      value.addRef();

      // 如果已有旧纹理，释放引用
      const oldParam = this._params.get(name);

      if (oldParam && oldParam.type === MaterialParamType.Texture &&
          oldParam.value && typeof oldParam.value.release === 'function') {
        oldParam.value.release();
      }
    }

    this._params.set(name, {
      name,
      type: MaterialParamType.Texture,
      value,
    });
    this._dirty = true;
  }

  /**
   * 获取纹理参数
   * @param name 参数名称
   * @param defaultValue 默认值
   * @returns 参数值
   */
  getTexture (name: string, defaultValue: any = null): any {
    const param = this._params.get(name);

    if (param && param.type === MaterialParamType.Texture) {
      return param.value;
    }

    return defaultValue;
  }

  /**
   * 获取所有参数
   * @returns 参数列表
   */
  getParams (): MaterialParam[] {
    return Array.from(this._params.values());
  }

  /**
   * 清除所有参数
   */
  clearParams (): void {
    // 释放所有纹理引用
    for (const [_, param] of this._params) {
      if (param.type === MaterialParamType.Texture &&
          param.value && typeof param.value.release === 'function') {
        param.value.release();
      }
    }

    this._params.clear();
    this._dirty = true;
  }

  /**
   * 判断是否为透明材质
   * @returns 是否为透明材质
   */
  isTransparent (): boolean {
    return this._blendMode !== BlendMode.Opaque || this._opacity < 1.0;
  }

  /**
   * 复制材质
   * @returns 材质副本
   */
  clone (): Material {
    const material = new Material(this.name + ' (Clone)');

    material._enabled = this._enabled;
    material._cullFace = this._cullFace;
    material._depthTest = this._depthTest;
    material._depthWrite = this._depthWrite;
    material._depthFunc = this._depthFunc;
    material._blendMode = this._blendMode;
    material._opacity = this._opacity;
    material._shaderId = this._shaderId;

    // 复制参数
    for (const [name, param] of this._params) {
      let value: any;

      // 对于引用类型的参数，需要创建副本
      if (param.type === MaterialParamType.Vector2 ||
          param.type === MaterialParamType.Vector3 ||
          param.type === MaterialParamType.Vector4 ||
          param.type === MaterialParamType.Color ||
          param.type === MaterialParamType.Matrix4) {
        if (typeof param.value.clone === 'function') {
          value = param.value.clone();
        } else {
          value = param.value;
        }
      } else if (param.type === MaterialParamType.Texture) {
        // 对于纹理，增加引用计数
        value = param.value;
        if (value && typeof value.addRef === 'function') {
          value.addRef();
        }
      } else {
        value = param.value;
      }

      material._params.set(name, {
        name: param.name,
        type: param.type,
        value,
      });
    }

    material._dirty = true;

    return material;
  }

  /**
   * 释放材质资源
   * 重写ReferResource的onDispose方法
   */
  protected override onDestroy (): void {
    this.clearParams();
  }
}