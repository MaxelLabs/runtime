/**
 * shader/types.ts
 * ShaderUtils 着色器工具类的类型定义
 */

/**
 * Uniform 块字段定义
 */
export interface UniformField {
  /** 字段名 */
  name: string;
  /** 字段类型 */
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'int' | 'uint' | 'bool';
  /** 数组大小，undefined 表示非数组 */
  arraySize?: number;
}

/**
 * Uniform 块定义
 */
export interface UniformBlockDefinition {
  /** 块名称 */
  name: string;
  /** 绑定点 */
  binding: number;
  /** 字段列表 */
  fields: UniformField[];
}

/**
 * Uniform 块字段信息（计算后）
 */
export interface UniformFieldInfo {
  /** 字段名 */
  name: string;
  /** 字段类型 */
  type: string;
  /** 字段在缓冲区中的偏移（字节） */
  offset: number;
  /** 字段大小（字节） */
  size: number;
  /** 对齐要求（字节） */
  alignment: number;
  /** 是否为数组 */
  isArray: boolean;
  /** 数组大小 */
  arraySize?: number;
  /** 数组元素步长（字节） */
  stride?: number;
}

/**
 * 着色器片段定义
 */
export interface ShaderSnippets {
  /** 顶点属性声明 */
  vertexAttributes: string;
  /** Uniform 块声明 */
  uniformBlocks: string;
  /** 主函数 */
  main: string;
}

/**
 * 顶点着色器选项
 */
export interface BasicVertexShaderOptions {
  /** 是否包含法线 */
  hasNormals?: boolean;
  /** 是否包含纹理坐标 */
  hasUVs?: boolean;
  /** 是否包含顶点颜色 */
  hasColors?: boolean;
}

/**
 * 片段着色器选项
 */
export interface BasicFragmentShaderOptions {
  /** 着色模式 */
  mode?: 'solid' | 'vertexColor' | 'texture';
  /** 是否包含光照计算 */
  hasLighting?: boolean;
}

/**
 * Phong 着色器对
 */
export interface PhongShaders {
  /** 顶点着色器代码 */
  vertex: string;
  /** 片段着色器代码 */
  fragment: string;
}

/**
 * std140 布局的字段偏移信息
 */
export interface Std140FieldOffset {
  /** 字段名 */
  name: string;
  /** 字段偏移（字节） */
  offset: number;
  /** 字段大小（字节） */
  size: number;
}

/**
 * std140 布局计算结果
 */
export interface Std140LayoutInfo {
  /** 所有字段的偏移信息 */
  fields: Std140FieldOffset[];
  /** 总大小（字节） */
  totalSize: number;
  /** 字段名到偏移的映射 */
  fieldMap: Map<string, Std140FieldOffset>;
}
