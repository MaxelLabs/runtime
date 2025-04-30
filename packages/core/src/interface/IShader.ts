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
  SAMPLER_2D_ARRAY = 'sampler2DArray',
  SAMPLER_2D_SHADOW = 'sampler2DShadow',
  SAMPLER_CUBE_SHADOW = 'samplerCubeShadow',
  UNSIGNED_INT = 'uint',
  UNSIGNED_INT_VEC2 = 'uvec2',
  UNSIGNED_INT_VEC3 = 'uvec3',
  UNSIGNED_INT_VEC4 = 'uvec4'
}

/**
 * 着色器错误类型
 */
export enum ShaderErrorType {
  COMPILE_ERROR = 'compile',
  LINK_ERROR = 'link',
  VALIDATION_ERROR = 'validation'
}

/**
 * 着色器错误信息
 */
export interface ShaderError {
  /**
   * 错误类型
   */
  type: ShaderErrorType,

  /**
   * 着色器阶段 (vertex/fragment/compute)
   */
  stage?: string,

  /**
   * 错误信息
   */
  message: string,

  /**
   * 错误行号
   */
  line?: number,

  /**
   * 源代码上下文
   */
  source?: string,
}

/**
 * 着色器编译状态
 */
export interface ShaderCompileStatus {
  /**
   * 是否成功编译
   */
  success: boolean,

  /**
   * 编译时间(毫秒)
   */
  compileTime?: number,

  /**
   * 错误列表
   */
  errors?: ShaderError[],

  /**
   * 警告列表
   */
  warnings?: string[],
}

/**
 * 着色器属性信息
 */
export interface ShaderAttributeInfo {
  /**
   * 属性名称
   */
  name: string,

  /**
   * 属性位置
   */
  location: number,

  /**
   * 属性类型
   */
  type: number,

  /**
   * 属性大小
   */
  size: number,
}

/**
 * 着色器统一变量信息
 */
export interface ShaderUniformInfo {
  /**
   * 统一变量名称
   */
  name: string,

  /**
   * 统一变量位置
   */
  location: any,

  /**
   * 统一变量类型
   */
  type: ShaderUniformType,

  /**
   * 统一变量大小
   */
  size: number,

  /**
   * 统一变量是否为数组
   */
  isArray: boolean,

  /**
   * 纹理单元序号(仅用于采样器)
   */
  textureUnit?: number,
}

/**
 * 着色器宏定义
 */
export interface ShaderDefine {
  /**
   * 宏名称
   */
  name: string,

  /**
   * 宏值
   */
  value: string | number | boolean,
}

/**
 * 着色器创建选项
 */
export interface ShaderCreateOptions {
  /**
   * 顶点着色器源码
   */
  vertexSource: string,

  /**
   * 片段着色器源码
   */
  fragmentSource: string,

  /**
   * 计算着色器源码(可选)
   */
  computeSource?: string,

  /**
   * 宏定义列表
   */
  defines?: ShaderDefine[],

  /**
   * 是否自动检测属性和统一变量
   */
  autoDetectVariables?: boolean,

  /**
   * 是否优化着色器(生产环境)
   */
  optimize?: boolean,

  /**
   * 调试信息级别
   */
  debugLevel?: 'none' | 'warnings' | 'all',

  /**
   * 预处理函数，可对着色器源码进行处理
   */
  preprocessor?: (source: string, stage: string) => string,

  /**
   * 标签(用于调试)
   */
  label?: string,
}

/**
 * 着色器接口 - 定义着色器程序和参数设置
 */
export interface IShader {
  /**
   * 着色器程序ID
   */
  id: number,

  /**
   * 着色器是否就绪可用
   */
  isReady: boolean,

  /**
   * 顶点着色器源码
   */
  vertexSource: string,

  /**
   * 片段着色器源码
   */
  fragmentSource: string,

  /**
   * 计算着色器源码(如果有)
   */
  computeSource?: string,

  /**
   * 宏定义列表
   */
  defines: ShaderDefine[],

  /**
   * 编译状态
   */
  compileStatus: ShaderCompileStatus,

  /**
   * 着色器标签
   */
  label?: string,

  /**
   * 获取着色器属性信息
   * @returns 属性信息数组
   */
  getAttributes(): ShaderAttributeInfo[],

  /**
   * 获取着色器统一变量信息
   * @returns 统一变量信息数组
   */
  getUniforms(): ShaderUniformInfo[],

  /**
   * 添加宏定义
   * @param name 宏名称
   * @param value 宏值
   * @returns 着色器实例(链式调用)
   */
  addDefine(name: string, value?: string | number | boolean): this,

  /**
   * 移除宏定义
   * @param name 宏名称
   * @returns 着色器实例(链式调用)
   */
  removeDefine(name: string): this,

  /**
   * 设置多个宏定义
   * @param defines 宏定义对象
   * @returns 着色器实例(链式调用)
   */
  setDefines(defines: Record<string, string | number | boolean>): this,

  /**
   * 使用宏定义重新编译着色器
   * @returns 编译是否成功的Promise
   * @throws 当编译失败时可能抛出错误
   */
  recompile(): Promise<boolean>,

  /**
   * 绑定着色器程序
   */
  bind(): void,

  /**
   * 解绑着色器程序
   */
  unbind(): void,

  /**
   * 验证着色器程序
   * @returns 验证是否通过
   */
  validate(): boolean,

  /**
   * 获取编译和链接的错误信息
   * @returns 错误信息数组
   */
  getErrors(): ShaderError[],

  /**
   * 获取编译和链接的警告信息
   * @returns 警告信息数组
   */
  getWarnings(): string[],

  /**
   * 设置float统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniform1f(name: string, value: number): boolean,

  /**
   * 设置int统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniform1i(name: string, value: number): boolean,

  /**
   * 设置bool统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniform1b(name: string, value: boolean): boolean,

  /**
   * 设置vec2统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniform2f(name: string, value: Vector2 | [number, number]): boolean,

  /**
   * 设置vec3统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniform3f(name: string, value: Vector3 | [number, number, number]): boolean,

  /**
   * 设置vec4统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniform4f(name: string, value: Vector4 | Color | [number, number, number, number]): boolean,

  /**
   * 设置mat2统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniformMatrix2(name: string, value: Float32Array): boolean,

  /**
   * 设置mat3统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniformMatrix3(name: string, value: Float32Array): boolean,

  /**
   * 设置mat4统一变量
   * @param name - 变量名
   * @param value - 矩阵值
   * @returns 设置是否成功
   */
  setUniformMatrix4(name: string, value: Matrix4 | Float32Array): boolean,

  /**
   * 设置float数组统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniform1fv(name: string, value: Float32Array | number[]): boolean,

  /**
   * 设置vec2数组统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniform2fv(name: string, value: Float32Array | number[]): boolean,

  /**
   * 设置vec3数组统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniform3fv(name: string, value: Float32Array | number[]): boolean,

  /**
   * 设置vec4数组统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniform4fv(name: string, value: Float32Array | number[]): boolean,

  /**
   * 设置int数组统一变量
   * @param name - 变量名
   * @param value - 变量值
   * @returns 设置是否成功
   */
  setUniform1iv(name: string, value: Int32Array | number[]): boolean,

  /**
   * 批量设置多个统一变量
   * @param uniforms - 统一变量对象，键为变量名，值为变量值
   * @returns 设置失败的变量名数组
   */
  setUniforms(uniforms: Record<string, any>): string[],

  /**
   * 获取属性位置
   * @param name - 属性名
   * @returns 属性位置，找不到时返回-1
   */
  getAttributeLocation(name: string): number,

  /**
   * 获取统一变量位置
   * @param name - 统一变量名
   * @returns 统一变量位置，找不到时返回null
   */
  getUniformLocation(name: string): any,

  /**
   * 获取统一变量类型
   * @param name - 统一变量名
   * @returns 统一变量类型，找不到时返回undefined
   */
  getUniformType(name: string): ShaderUniformType | undefined,

  /**
   * 获取着色器源码，包含预处理后的宏定义
   * @param stage - 阶段 ('vertex', 'fragment', 'compute')
   * @returns 处理后的源码
   */
  getProcessedSource(stage: 'vertex' | 'fragment' | 'compute'): string,

  /**
   * 销毁着色器程序
   */
  destroy(): void,
}