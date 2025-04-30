import type { Matrix4, Vector2, Vector3, Vector4, Color } from '@maxellabs/math';

/**
 * 着色器统一变量类型
 */
export enum ShaderUniformType {
  FLOAT = 'float',
  INT = 'int',
  BOOL = 'bool',
  FLOAT_VEC2 = 'vec2',
  FLOAT_VEC3 = 'vec3',
  FLOAT_VEC4 = 'vec4',
  INT_VEC2 = 'ivec2',
  INT_VEC3 = 'ivec3',
  INT_VEC4 = 'ivec4',
  BOOL_VEC2 = 'bvec2',
  BOOL_VEC3 = 'bvec3',
  BOOL_VEC4 = 'bvec4',
  FLOAT_MAT2 = 'mat2',
  FLOAT_MAT3 = 'mat3',
  FLOAT_MAT4 = 'mat4',
  SAMPLER_2D = 'sampler2D',
  SAMPLER_CUBE = 'samplerCube',
  SAMPLER_3D = 'sampler3D',
  SAMPLER_2D_ARRAY = 'sampler2DArray'
}

/**
 * 着色器属性信息
 */
export interface ShaderAttributeInfo {
  /**
   * 属性名称
   */
  name: string;
  
  /**
   * 属性位置
   */
  location: number;
  
  /**
   * 属性类型
   */
  type: number;
  
  /**
   * 属性大小
   */
  size: number;
}

/**
 * 着色器统一变量信息
 */
export interface ShaderUniformInfo {
  /**
   * 统一变量名称
   */
  name: string;
  
  /**
   * 统一变量位置
   */
  location: any;
  
  /**
   * 统一变量类型
   */
  type: ShaderUniformType;
  
  /**
   * 统一变量大小
   */
  size: number;
  
  /**
   * 统一变量是否为数组
   */
  isArray: boolean;
  
  /**
   * 纹理单元序号(仅用于采样器)
   */
  textureUnit?: number;
}

/**
 * 着色器宏定义
 */
export interface ShaderDefine {
  /**
   * 宏名称
   */
  name: string;
  
  /**
   * 宏值
   */
  value: string | number | boolean;
}

/**
 * 着色器创建选项
 */
export interface ShaderCreateOptions {
  /**
   * 顶点着色器源码
   */
  vertexSource: string;
  
  /**
   * 片段着色器源码
   */
  fragmentSource: string;
  
  /**
   * 宏定义列表
   */
  defines?: ShaderDefine[];
  
  /**
   * 是否自动检测属性和统一变量
   */
  autoDetectVariables?: boolean;
}

/**
 * 着色器接口 - 定义着色器程序和参数设置
 */
export interface IShader {
  /**
   * 着色器程序ID
   */
  id: number;
  
  /**
   * 着色器是否就绪可用
   */
  isReady: boolean;
  
  /**
   * 顶点着色器源码
   */
  vertexSource: string;
  
  /**
   * 片段着色器源码
   */
  fragmentSource: string;
  
  /**
   * 宏定义列表
   */
  defines: ShaderDefine[];
  
  /**
   * 获取着色器属性信息
   */
  getAttributes(): ShaderAttributeInfo[];
  
  /**
   * 获取着色器统一变量信息
   */
  getUniforms(): ShaderUniformInfo[];
  
  /**
   * 添加宏定义
   * @param name 宏名称
   * @param value 宏值
   */
  addDefine(name: string, value?: string | number | boolean): void;
  
  /**
   * 移除宏定义
   * @param name 宏名称
   */
  removeDefine(name: string): void;
  
  /**
   * 使用宏定义重新编译着色器
   */
  recompile(): Promise<boolean>;
  
  /**
   * 绑定着色器程序
   */
  bind(): void;
  
  /**
   * 解绑着色器程序
   */
  unbind(): void;
  
  /**
   * 设置float统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniform1f(name: string, value: number): void;
  
  /**
   * 设置int统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniform1i(name: string, value: number): void;
  
  /**
   * 设置bool统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniform1b(name: string, value: boolean): void;
  
  /**
   * 设置vec2统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniform2f(name: string, value: Vector2 | [number, number]): void;
  
  /**
   * 设置vec3统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniform3f(name: string, value: Vector3 | [number, number, number]): void;
  
  /**
   * 设置vec4统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniform4f(name: string, value: Vector4 | Color | [number, number, number, number]): void;
  
  /**
   * 设置mat2统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniformMatrix2(name: string, value: Float32Array): void;
  
  /**
   * 设置mat3统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniformMatrix3(name: string, value: Float32Array): void;
  
  /**
   * 设置mat4统一变量
   * @param name - 变量名
   * @param value - 矩阵值
   */
  setUniformMatrix4(name: string, value: Matrix4 | Float32Array): void;
  
  /**
   * 设置float数组统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniform1fv(name: string, value: Float32Array | number[]): void;
  
  /**
   * 设置vec2数组统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniform2fv(name: string, value: Float32Array | number[]): void;
  
  /**
   * 设置vec3数组统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniform3fv(name: string, value: Float32Array | number[]): void;
  
  /**
   * 设置vec4数组统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniform4fv(name: string, value: Float32Array | number[]): void;
  
  /**
   * 设置int数组统一变量
   * @param name - 变量名
   * @param value - 变量值
   */
  setUniform1iv(name: string, value: Int32Array | number[]): void;
  
  /**
   * 获取属性位置
   * @param name - 属性名
   * @returns 属性位置
   */
  getAttributeLocation(name: string): number;
  
  /**
   * 获取统一变量位置
   * @param name - 统一变量名
   * @returns 统一变量位置
   */
  getUniformLocation(name: string): any;
  
  /**
   * 获取统一变量类型
   * @param name - 统一变量名
   */
  getUniformType(name: string): ShaderUniformType | undefined;
  
  /**
   * 销毁着色器程序
   */
  destroy(): void;
} 