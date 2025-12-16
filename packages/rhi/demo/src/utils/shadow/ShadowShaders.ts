/**
 * shadow/ShadowShaders.ts
 * 阴影着色器代码生成器 - 提供阴影渲染所需的着色器代码
 *
 * 功能特性：
 * - 深度Pass着色器（只渲染深度）
 * - 场景Pass阴影采样代码片段
 * - 标准Uniform Block定义
 *
 * @example
 * ```typescript
 * // 获取深度Pass着色器
 * const depthVS = ShadowShaders.getDepthVertexShader();
 * const depthFS = ShadowShaders.getDepthFragmentShader();
 *
 * // 获取场景Pass阴影采样代码
 * const shadowSnippet = ShadowShaders.getShadowSamplingSnippet('3x3');
 * ```
 */

import type { PCFSampleMode } from './types';
import { PCFFilter } from './PCFFilter';

export class ShadowShaders {
  /**
   * 获取深度Pass顶点着色器
   * 用于渲染阴影贴图（只需要深度信息）
   *
   * @param transformBinding Uniform Block绑定点，默认0
   * @returns GLSL顶点着色器代码
   */
  static getDepthVertexShader(_transformBinding: number = 0): string {
    return `#version 300 es
precision highp float;

// 顶点属性
layout(location = 0) in vec3 aPosition;

// 变换矩阵
layout(std140) uniform ShadowTransforms {
  mat4 uLightViewProjMatrix;  // 64 bytes
  mat4 uModelMatrix;          // 64 bytes
}; // Total: 128 bytes

void main() {
  gl_Position = uLightViewProjMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
`;
  }

  /**
   * 获取深度Pass片元着色器
   * 最小化着色器，深度自动写入
   *
   * @returns GLSL片元着色器代码
   */
  static getDepthFragmentShader(): string {
    return `#version 300 es
precision mediump float;

// 深度自动写入，无需输出颜色
// 但WebGL2需要至少一个输出
out vec4 fragColor;

void main() {
  // 空输出，深度由gl_FragCoord.z自动写入
  fragColor = vec4(0.0);
}
`;
  }

  /**
   * 获取场景Pass的阴影采样代码片段
   * 包含calculateShadow函数
   *
   * @param pcfMode PCF采样模式
   * @param bias 阴影偏移，默认0.005
   * @returns GLSL代码片段
   */
  static getShadowSamplingSnippet(pcfMode: PCFSampleMode = '3x3', bias: number = 0.005): string {
    return PCFFilter.getShaderSnippet({ sampleMode: pcfMode, bias });
  }

  /**
   * 获取阴影Uniform Block声明
   *
   * @param binding 绑定点，默认2
   * @returns GLSL Uniform Block声明
   */
  static getShadowUniformBlock(_binding: number = 2): string {
    return PCFFilter.getShadowUniformBlock(_binding);
  }

  /**
   * 获取完整的场景Pass顶点着色器（带阴影支持）
   *
   * @param options 配置选项
   * @returns GLSL顶点着色器代码
   */
  static getSceneVertexShader(
    options: {
      hasNormals?: boolean;
      hasUVs?: boolean;
      transformBinding?: number;
      shadowBinding?: number;
    } = {}
  ): string {
    const {
      hasNormals = true,
      hasUVs = false,
      transformBinding: _transformBinding = 0,
      shadowBinding: _shadowBinding = 2,
    } = options;

    return `#version 300 es
precision highp float;

// 顶点属性
layout(location = 0) in vec3 aPosition;
${hasNormals ? 'layout(location = 1) in vec3 aNormal;' : ''}
${hasUVs ? 'layout(location = 2) in vec2 aTexCoord;' : ''}

// 变换矩阵
layout(std140) uniform Transforms {
  mat4 uModelMatrix;       // 64 bytes
  mat4 uViewMatrix;        // 64 bytes
  mat4 uProjectionMatrix;  // 64 bytes
}; // Total: 192 bytes

// 阴影矩阵
layout(std140) uniform ShadowUniforms {
  highp mat4 uLightViewProjMatrix;  // 64 bytes
  highp vec3 uLightPosition;        // 12 bytes
  highp float _pad_shadow_1;        // 4 bytes (vec3 padding to 16 bytes)
  highp float uShadowBias;          // 4 bytes
  highp float uShadowIntensity;     // 4 bytes
  highp int uPCFSamples;            // 4 bytes
  highp float _pad_shadow_2;        // 4 bytes
}; // Total: 96 bytes (std140 aligned)

// 输出到片元着色器
out vec3 vWorldPosition;
${hasNormals ? 'out vec3 vWorldNormal;' : ''}
${hasUVs ? 'out vec2 vTexCoord;' : ''}
out vec4 vLightSpacePosition;

void main() {
  // 世界空间位置
  vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPos.xyz;

  ${
    hasNormals
      ? `
  // 世界空间法线（使用法线矩阵）
  mat3 normalMatrix = transpose(inverse(mat3(uModelMatrix)));
  vWorldNormal = normalize(normalMatrix * aNormal);
  `
      : ''
  }

  ${hasUVs ? 'vTexCoord = aTexCoord;' : ''}

  // 光源空间位置（用于阴影计算）
  vLightSpacePosition = uLightViewProjMatrix * worldPos;

  // 最终位置
  gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
`;
  }

  /**
   * 获取完整的场景Pass片元着色器（带阴影支持）
   *
   * @param options 配置选项
   * @returns GLSL片元着色器代码
   */
  static getSceneFragmentShader(
    options: {
      hasNormals?: boolean;
      hasUVs?: boolean;
      pcfMode?: PCFSampleMode;
      shadowBias?: number;
      lightingBinding?: number;
    } = {}
  ): string {
    const {
      hasNormals = true,
      hasUVs = false,
      pcfMode = '3x3',
      shadowBias = 0.005,
      lightingBinding: _lightingBinding = 1,
    } = options;

    const shadowSnippet = this.getShadowSamplingSnippet(pcfMode, shadowBias);

    return `#version 300 es
precision mediump float;

// 输入
in vec3 vWorldPosition;
${hasNormals ? 'in vec3 vWorldNormal;' : ''}
${hasUVs ? 'in vec2 vTexCoord;' : ''}
in vec4 vLightSpacePosition;

// 阴影参数 (Shadow Uniforms)
layout(std140) uniform ShadowUniforms {
  highp mat4 uLightViewProjMatrix;  // 64 bytes
  highp vec3 uLightPosition;        // 12 bytes
  highp float _pad_shadow_1;        // 4 bytes
  highp float uShadowBias;          // 4 bytes
  highp float uShadowIntensity;     // 4 bytes
  highp int uPCFSamples;            // 4 bytes
  highp float _pad_shadow_2;        // 4 bytes
}; // Total: 96 bytes

// 光照参数
layout(std140) uniform Lighting {
  // 主光源 (Main Light) - 投射阴影
  vec3 uMainLightDir;     // 12 bytes
  float _pad_main_1;      // 4 bytes
  vec3 uMainLightColor;   // 12 bytes
  float _pad_main_2;      // 4 bytes

  // 补光 (Fill Light)
  vec3 uFillLightDir;     // 12 bytes
  float _pad_fill_1;      // 4 bytes
  vec3 uFillLightColor;   // 12 bytes
  float _pad_fill_2;      // 4 bytes

  // 背光 (Back Light)
  vec3 uBackLightDir;     // 12 bytes
  float _pad_back_1;      // 4 bytes
  vec3 uBackLightColor;   // 12 bytes
  float _pad_back_2;      // 4 bytes

  // 环境与材质
  vec3 uAmbientColor;     // 12 bytes
  float _pad_amb_1;       // 4 bytes
  vec3 uObjectColor;      // 12 bytes
  float _pad_obj_1;       // 4 bytes
}; // Total: 128 bytes

// 阴影贴图
uniform sampler2D uShadowMap;

// 输出
out vec4 fragColor;

${shadowSnippet}

void main() {
  ${
    hasNormals
      ? `
  // 法线
  vec3 normal = normalize(vWorldNormal);

  // 1. 主光源 (Main Light) - 带阴影
  vec3 mainLightDir = normalize(-uMainLightDir);
  float mainDiff = max(dot(normal, mainLightDir), 0.0);
  vec3 mainDiffuse = mainDiff * uMainLightColor;

  // 计算阴影
  float shadow = calculateShadow(vLightSpacePosition, uShadowMap);
  vec3 mainLighting = (1.0 - shadow) * mainDiffuse;

  // 2. 补光 (Fill Light)
  vec3 fillLightDir = normalize(-uFillLightDir);
  float fillDiff = max(dot(normal, fillLightDir), 0.0);
  vec3 fillLighting = fillDiff * uFillLightColor;

  // 3. 背光 (Back Light)
  vec3 backLightDir = normalize(-uBackLightDir);
  float backDiff = max(dot(normal, backLightDir), 0.0);
  vec3 backLighting = backDiff * uBackLightColor;

  // 环境光
  vec3 ambient = uAmbientColor;

  // 最终光照组合
  vec3 lighting = ambient + mainLighting + fillLighting + backLighting;
  `
      : `
  // 无法线，简单的环境光+主光颜色
  vec3 ambient = uAmbientColor;
  float shadow = calculateShadow(vLightSpacePosition, uShadowMap);
  vec3 lighting = ambient + (1.0 - shadow) * uMainLightColor;
  `
  }

  vec3 color = lighting * uObjectColor;
  fragColor = vec4(color, 1.0);
}
`;
  }
}
