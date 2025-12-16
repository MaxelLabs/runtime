/**
 * shader/ShaderUtils.ts
 * ShaderUtils 着色器工具类
 *
 * 提供着色器工具函数：
 * - Uniform 块生成和布局计算
 * - 常用着色器模板
 * - 着色器代码片段库
 */

import type {
  UniformBlockDefinition,
  UniformField,
  BasicVertexShaderOptions,
  BasicFragmentShaderOptions,
  PhongShaders,
  Std140LayoutInfo,
  Std140FieldOffset,
} from './types';

/**
 * ShaderUtils 着色器工具类
 * 提供着色器生成、布局计算和代码片段管理
 */
export class ShaderUtils {
  /**
   * std140 类型信息表
   * 定义每个类型的大小和对齐要求
   */
  private static readonly STD140_TYPE_INFO = {
    float: { size: 4, alignment: 4 },
    int: { size: 4, alignment: 4 },
    uint: { size: 4, alignment: 4 },
    bool: { size: 4, alignment: 4 },
    vec2: { size: 8, alignment: 8 },
    vec3: { size: 12, alignment: 16 }, // vec3 对齐到 16 字节
    vec4: { size: 16, alignment: 16 },
    mat3: { size: 48, alignment: 16 }, // 3 个 vec3，每个对齐到 16
    mat4: { size: 64, alignment: 16 }, // 4 个 vec4
  };

  /**
   * 获取类型的 std140 信息
   */
  private static getTypeInfo(type: string): { size: number; alignment: number } {
    const info = (this.STD140_TYPE_INFO as Record<string, any>)[type];
    if (!info) {
      throw new Error(`Unknown GLSL type: ${type}`);
    }
    return info;
  }

  // ===== Uniform 块工具 =====

  /**
   * 生成 Uniform 块 GLSL 代码
   * 采用 std140 标准布局
   *
   * @param definition - Uniform 块定义
   * @returns GLSL Uniform 块代码
   *
   * @example
   * ```typescript
   * const block = ShaderUtils.generateUniformBlock({
   *   name: 'Transforms',
   *   binding: 0,
   *   fields: [
   *     { name: 'uModelMatrix', type: 'mat4' },
   *     { name: 'uViewMatrix', type: 'mat4' },
   *   ],
   * });
   * // 输出: uniform Transforms { mat4 uModelMatrix; mat4 uViewMatrix; };
   * ```
   */
  static generateUniformBlock(definition: UniformBlockDefinition): string {
    const { name, binding: _binding, fields } = definition;

    let code = `layout(std140) uniform ${name} {\n`;

    for (const field of fields) {
      const arrayPart = field.arraySize ? `[${field.arraySize}]` : '';
      code += `  ${field.type} ${field.name}${arrayPart};\n`;
    }

    code += '};\n';

    return code;
  }

  /**
   * 计算 Uniform 块大小（std140 布局）
   *
   * @param fields - 字段定义列表
   * @returns 总大小（字节），对齐到 16 字节
   *
   * @example
   * ```typescript
   * const fields = [
   *   { name: 'time', type: 'float' },
   *   { name: 'color', type: 'vec3' },
   *   { name: 'matrix', type: 'mat4' },
   * ];
   * const size = ShaderUtils.calculateUniformBlockSize(fields);
   * // 返回: 96
   * ```
   */
  static calculateUniformBlockSize(fields: UniformField[]): number {
    let offset = 0;
    let maxAlignment = 1;

    for (const field of fields) {
      const typeInfo = this.getTypeInfo(field.type);
      const alignment = typeInfo.alignment;

      // 对齐当前字段
      offset = Math.ceil(offset / alignment) * alignment;

      // 计算字段大小
      let fieldSize = typeInfo.size;
      if (field.arraySize) {
        // 数组元素步长必须是 16 字节
        fieldSize = Math.ceil(typeInfo.size / 16) * 16 * field.arraySize;
      }

      offset += fieldSize;
      maxAlignment = Math.max(maxAlignment, alignment);
    }

    // 对齐总大小到 16 字节
    return Math.ceil(offset / 16) * 16;
  }

  /**
   * 计算 Uniform 块详细布局信息
   *
   * @param fields - 字段定义列表
   * @returns 布局信息，包含每个字段的偏移和大小
   */
  static calculateUniformBlockLayout(fields: UniformField[]): Std140LayoutInfo {
    const fieldOffsets: Std140FieldOffset[] = [];
    const fieldMap = new Map<string, Std140FieldOffset>();
    let offset = 0;

    for (const field of fields) {
      const typeInfo = this.getTypeInfo(field.type);
      const alignment = typeInfo.alignment;

      // 对齐当前字段
      offset = Math.ceil(offset / alignment) * alignment;

      // 计算字段大小
      let fieldSize = typeInfo.size;
      if (field.arraySize) {
        // 数组元素步长必须是 16 字节
        fieldSize = Math.ceil(typeInfo.size / 16) * 16 * field.arraySize;
      }

      const fieldInfo: Std140FieldOffset = {
        name: field.name,
        offset,
        size: fieldSize,
      };

      fieldOffsets.push(fieldInfo);
      fieldMap.set(field.name, fieldInfo);
      offset += fieldSize;
    }

    // 总大小对齐到 16 字节
    const totalSize = Math.ceil(offset / 16) * 16;

    return {
      fields: fieldOffsets,
      totalSize,
      fieldMap,
    };
  }

  /**
   * 生成标准 Transforms 块（MVP 矩阵）
   *
   * @param binding - 绑定点，默认为 0
   * @returns GLSL Uniform 块代码
   *
   * @example
   * ```typescript
   * const block = ShaderUtils.getTransformsBlock(0);
   * // 包含 uModelMatrix, uViewMatrix, uProjectionMatrix
   * ```
   */
  static getTransformsBlock(binding = 0): string {
    return this.generateUniformBlock({
      name: 'Transforms',
      binding,
      fields: [
        { name: 'uModelMatrix', type: 'mat4' },
        { name: 'uViewMatrix', type: 'mat4' },
        { name: 'uProjectionMatrix', type: 'mat4' },
      ],
    });
  }

  /**
   * 生成标准 Lighting 块
   *
   * @param binding - 绑定点，默认为 1
   * @returns GLSL Uniform 块代码
   *
   * @example
   * ```typescript
   * const block = ShaderUtils.getLightingBlock(1);
   * // 包含光照相关参数
   * ```
   */
  static getLightingBlock(binding = 1): string {
    return this.generateUniformBlock({
      name: 'Lighting',
      binding,
      fields: [
        { name: 'uLightPosition', type: 'vec4' }, // xyz: 位置, w: 类型
        { name: 'uLightColor', type: 'vec4' }, // rgb: 颜色, a: 强度
        { name: 'uAmbientColor', type: 'vec4' }, // rgb: 环境光, a: 强度
      ],
    });
  }

  /**
   * 生成标准 Material 块
   *
   * @param binding - 绑定点，默认为 2
   * @returns GLSL Uniform 块代码
   *
   * @example
   * ```typescript
   * const block = ShaderUtils.getMaterialBlock(2);
   * // 包含材质参数
   * ```
   */
  static getMaterialBlock(binding = 2): string {
    return this.generateUniformBlock({
      name: 'Material',
      binding,
      fields: [
        { name: 'uAmbientColor', type: 'vec3' },
        { name: 'uDiffuseColor', type: 'vec3' },
        { name: 'uSpecularColor', type: 'vec3' },
        { name: 'uShininess', type: 'float' },
      ],
    });
  }

  // ===== 着色器模板 =====

  /**
   * 基础顶点着色器（带 MVP 变换）
   *
   * @param options - 着色器选项
   * @returns 顶点着色器代码
   *
   * @example
   * ```typescript
   * const vs = ShaderUtils.basicVertexShader({
   *   hasNormals: true,
   *   hasUVs: true,
   *   hasColors: false,
   * });
   * ```
   */
  static basicVertexShader(options: BasicVertexShaderOptions = {}): string {
    const { hasNormals = false, hasUVs = false, hasColors = false } = options;

    let code = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
`;

    if (hasNormals) {
      code += `in vec3 aNormal;
`;
    }

    if (hasUVs) {
      code += `in vec2 aTexCoord;
`;
    }

    if (hasColors) {
      code += `in vec3 aColor;
`;
    }

    code += `
// Uniform 块
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

// 输出
out vec3 vPosition;
`;

    if (hasNormals) {
      code += `out vec3 vNormal;
`;
    }

    if (hasUVs) {
      code += `out vec2 vTexCoord;
`;
    }

    if (hasColors) {
      code += `out vec3 vColor;
`;
    }

    code += `
void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vPosition = worldPosition.xyz;
`;

    if (hasNormals) {
      code += `  vNormal = mat3(uModelMatrix) * aNormal;
`;
    }

    if (hasUVs) {
      code += `  vTexCoord = aTexCoord;
`;
    }

    if (hasColors) {
      code += `  vColor = aColor;
`;
    }

    code += `  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

    return code;
  }

  /**
   * 基础片段着色器
   *
   * @param options - 着色器选项
   * @returns 片段着色器代码
   *
   * @example
   * ```typescript
   * const fs = ShaderUtils.basicFragmentShader({
   *   mode: 'vertexColor',
   *   hasLighting: false,
   * });
   * ```
   */
  static basicFragmentShader(options: BasicFragmentShaderOptions = {}): string {
    const { mode = 'solid', hasLighting = false } = options;

    let code = `#version 300 es
precision mediump float;

// 输入
in vec3 vPosition;
`;

    if (mode === 'vertexColor') {
      code += `in vec3 vColor;
`;
    }

    if (mode === 'texture') {
      code += `in vec2 vTexCoord;
uniform sampler2D uTexture;
`;
    }

    if (hasLighting) {
      code += `in vec3 vNormal;
uniform Lighting {
  vec4 uLightPosition;
  vec4 uLightColor;
  vec4 uAmbientColor;
};
uniform Camera {
  vec3 uCameraPosition;
};
`;
    }

    code += `
// 输出
out vec4 fragColor;

void main() {
`;

    if (mode === 'solid') {
      code += `  fragColor = vec4(0.5, 0.5, 1.0, 1.0);  // 蓝色
`;
    } else if (mode === 'vertexColor') {
      code += `  fragColor = vec4(vColor, 1.0);
`;
    } else if (mode === 'texture') {
      code += `  fragColor = texture(uTexture, vTexCoord);
`;
    }

    if (hasLighting && mode !== 'solid') {
      code += `
  // 简单光照计算
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightPosition.xyz - vPosition);
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor.rgb;
  vec3 ambient = uAmbientColor.rgb;
  vec3 lighting = ambient + diffuse;

  fragColor.rgb *= lighting;
`;
    }

    code += `}
`;

    return code;
  }

  /**
   * 完整的 Phong 光照着色器对
   *
   * @returns 包含顶点着色器和片段着色器的对象
   *
   * @example
   * ```typescript
   * const { vertex, fragment } = ShaderUtils.phongShaders();
   * ```
   */
  static phongShaders(): PhongShaders {
    const vertex = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

// Uniform 块
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

// 输出
out vec3 vNormal;
out vec2 vTexCoord;
out vec3 vWorldPosition;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = mat3(uNormalMatrix) * aNormal;
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

    const fragment = `#version 300 es
precision mediump float;

// 输入
in vec3 vNormal;
in vec2 vTexCoord;
in vec3 vWorldPosition;

// Uniform
uniform sampler2D uTexture;

uniform Lighting {
  vec3 uLightDirection;
  vec3 uLightColor;
  vec3 uAmbientColor;
  float uSpecularIntensity;
};

uniform Camera {
  vec3 uCameraPosition;
};

// 输出
out vec4 fragColor;

void main() {
  // 采样纹理
  vec4 texColor = texture(uTexture, vTexCoord);

  // 法线归一化
  vec3 normal = normalize(vNormal);

  // 光照方向（已归一化）
  vec3 lightDir = normalize(uLightDirection);

  // 漫反射
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  // 镜面反射 (Blinn-Phong)
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
  vec3 specular = uSpecularIntensity * spec * uLightColor;

  // 最终颜色
  vec3 ambient = uAmbientColor;
  vec3 lighting = ambient + diffuse + specular;
  fragColor = vec4(texColor.rgb * lighting, texColor.a);
}
`;

    return { vertex, fragment };
  }

  // ===== 着色器片段库 =====

  /**
   * 获取光照计算代码片段
   * 实现 Phong 光照模型
   *
   * @returns GLSL 代码片段
   */
  static getLightingSnippet(): string {
    return `
// 计算光照
vec3 computeLighting(vec3 normal, vec3 lightDir, vec3 viewDir,
                     vec3 lightColor, vec3 ambientColor, float specularIntensity) {
  // 漫反射
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * lightColor;

  // 镜面反射 (Blinn-Phong)
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
  vec3 specular = specularIntensity * spec * lightColor;

  // 组合
  return ambientColor + diffuse + specular;
}
`;
  }

  /**
   * 获取法线变换代码片段
   *
   * @returns GLSL 代码片段
   */
  static getNormalTransformSnippet(): string {
    return `
// 变换法线到世界空间
vec3 transformNormal(mat3 normalMatrix, vec3 normal) {
  return normalize(normalMatrix * normal);
}
`;
  }

  /**
   * 获取纹理采样代码片段
   *
   * @returns GLSL 代码片段
   */
  static getTextureSamplingSnippet(): string {
    return `
// 采样纹理
vec4 sampleTexture(sampler2D texture, vec2 texCoord) {
  return texture(texture, texCoord);
}

// 采样纹理并应用伽马矫正
vec4 sampleTextureWithGamma(sampler2D texture, vec2 texCoord, float gamma) {
  vec4 texColor = texture(texture, texCoord);
  texColor.rgb = pow(texColor.rgb, vec3(1.0 / gamma));
  return texColor;
}
`;
  }

  /**
   * 获取常见的 Uniform 属性声明
   *
   * @returns GLSL 代码片段
   */
  static getCommonUniformsSnippet(): string {
    return `
// 常见 Uniform
uniform sampler2D uMainTexture;
uniform vec3 uCameraPosition;
uniform float uTime;
`;
  }

  /**
   * 获取屏幕空间位置计算片段
   *
   * @returns GLSL 代码片段
   */
  static getScreenPositionSnippet(): string {
    return `
// 计算屏幕空间位置（0-1）
vec2 getScreenPosition(vec4 clipPos) {
  vec3 ndc = clipPos.xyz / clipPos.w;
  return ndc.xy * 0.5 + 0.5;
}
`;
  }
}
