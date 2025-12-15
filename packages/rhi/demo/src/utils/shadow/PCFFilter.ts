/**
 * shadow/PCFFilter.ts
 * PCF软阴影滤波器 - 生成PCF阴影采样的着色器代码
 *
 * PCF (Percentage Closer Filtering) 是一种软阴影技术，
 * 通过对阴影贴图进行多次采样并平均结果来产生柔和的阴影边缘。
 *
 * 支持的采样模式：
 * - 1x1: 硬阴影（1次采样）
 * - 2x2: 基础软阴影（4次采样）
 * - 3x3: 高质量软阴影（9次采样）
 * - 5x5: 超高质量软阴影（25次采样）
 *
 * @example
 * ```typescript
 * // 获取PCF着色器代码片段
 * const pcfCode = PCFFilter.getShaderSnippet({
 *   sampleMode: '3x3',
 *   bias: 0.005,
 * });
 *
 * // 在片元着色器中使用
 * const fragmentShader = `
 *   ${PCFFilter.getUniformDeclaration()}
 *   ${pcfCode}
 *
 *   void main() {
 *     float shadow = calculateShadow(vLightSpacePos, uShadowMap);
 *     // ...
 *   }
 * `;
 * ```
 */

import type { PCFSampleMode, PCFFilterOptions } from './types';

export class PCFFilter {
  /**
   * 获取PCF采样的着色器代码片段
   *
   * @param options PCF配置选项
   * @returns GLSL代码片段，包含calculateShadow函数
   */
  static getShaderSnippet(options: PCFFilterOptions): string {
    const { sampleMode, bias = 0.005, normalBias = 0.0 } = options;

    switch (sampleMode) {
      case '1x1':
        return this.get1x1Snippet(bias, normalBias);
      case '2x2':
        return this.get2x2Snippet(bias, normalBias);
      case '3x3':
        return this.get3x3Snippet(bias, normalBias);
      case '5x5':
        return this.get5x5Snippet(bias, normalBias);
      default:
        console.warn(`[PCFFilter] 未知的采样模式: ${sampleMode}，使用默认3x3`);
        return this.get3x3Snippet(bias, normalBias);
    }
  }

  /**
   * 获取阴影采样所需的Uniform声明
   *
   * @returns GLSL Uniform声明代码
   */
  static getUniformDeclaration(): string {
    return `
// 阴影贴图采样器
uniform sampler2D uShadowMap;

// 阴影参数
uniform float uShadowBias;
uniform float uShadowIntensity;
`;
  }

  /**
   * 获取阴影Uniform Block声明（std140布局）
   *
   * @param binding 绑定点，默认2
   * @returns GLSL Uniform Block声明代码
   */
  static getShadowUniformBlock(binding: number = 2): string {
    return `
layout(std140, binding = ${binding}) uniform ShadowUniforms {
  mat4 uLightViewProjMatrix;  // 64 bytes
  vec3 uLightPosition;        // 12 bytes
  float _pad1;                // 4 bytes (vec3 padding to 16 bytes)
  float uShadowBias;          // 4 bytes
  float uShadowIntensity;     // 4 bytes
  int uPCFSamples;            // 4 bytes
  float _pad2;                // 4 bytes
}; // Total: 96 bytes (std140 aligned)
`;
  }

  /**
   * 获取指定采样模式的采样次数
   *
   * @param mode 采样模式
   * @returns 采样次数
   */
  static getSampleCount(mode: PCFSampleMode): number {
    switch (mode) {
      case '1x1':
        return 1;
      case '2x2':
        return 4;
      case '3x3':
        return 9;
      case '5x5':
        return 25;
      default:
        return 9;
    }
  }

  /**
   * 获取所有可用的采样模式
   *
   * @returns 采样模式数组
   */
  static getAvailableModes(): PCFSampleMode[] {
    return ['1x1', '2x2', '3x3', '5x5'];
  }

  // ==================== 私有方法 - 着色器代码生成 ====================

  /**
   * 1x1硬阴影（单次采样）
   * @private
   */
  private static get1x1Snippet(bias: number, normalBias: number): string {
    return `
/**
 * 计算阴影系数（1x1硬阴影）
 * @param lightSpacePos 光源空间位置
 * @param shadowMap 阴影贴图采样器
 * @return 阴影系数（0.0=无阴影，1.0=完全阴影）
 */
float calculateShadow(vec4 lightSpacePos, sampler2D shadowMap) {
  // 透视除法
  vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;

  // 变换到[0,1]范围
  projCoords = projCoords * 0.5 + 0.5;

  // 超出阴影贴图范围，无阴影
  if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 ||
      projCoords.y < 0.0 || projCoords.y > 1.0) {
    return 0.0;
  }

  // 阴影偏移
  float shadowBias = ${bias.toFixed(6)};
  float shadowNormalBias = ${normalBias.toFixed(6)};

  // 应用 normalBias 到深度比较
  // 注意：通常 normalBias 应该在顶点着色器中应用到 lightSpacePos，
  // 但这里作为后处理的近似，我们可以调整当前深度值。
  // 更准确的做法是 projCoords.xy += normal * shadowNormalBias
  // 但这里我们没有法线信息，所以仅作为深度偏移的额外参数。
  // 为了保持简单和兼容现有签名，我们将 shadowNormalBias 加到 shadowBias 上。
  // 实际应用中，如果需要真正的 normal bias，应该在顶点阶段处理。
  float currentDepth = projCoords.z;
  float closestDepth = texture(shadowMap, projCoords.xy).r;

  // 深度比较
  return currentDepth - (shadowBias + shadowNormalBias) > closestDepth ? 1.0 : 0.0;
}
`;
  }

  /**
   * 2x2软阴影（4次采样）
   * @private
   */
  private static get2x2Snippet(bias: number, normalBias: number): string {
    return `
/**
 * 计算阴影系数（2x2 PCF软阴影）
 * @param lightSpacePos 光源空间位置
 * @param shadowMap 阴影贴图采样器
 * @return 阴影系数（0.0=无阴影，1.0=完全阴影）
 */
float calculateShadow(vec4 lightSpacePos, sampler2D shadowMap) {
  // 透视除法
  vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;

  // 变换到[0,1]范围
  projCoords = projCoords * 0.5 + 0.5;

  // 超出阴影贴图范围，无阴影
  if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 ||
      projCoords.y < 0.0 || projCoords.y > 1.0) {
    return 0.0;
  }

  float shadowBias = ${bias.toFixed(6)};
  float shadowNormalBias = ${normalBias.toFixed(6)};
  float currentDepth = projCoords.z;
  float shadow = 0.0;

  // 获取纹素大小
  vec2 texelSize = 1.0 / vec2(textureSize(shadowMap, 0));

  // 2x2采样
  for (int x = 0; x <= 1; x++) {
    for (int y = 0; y <= 1; y++) {
      vec2 offset = vec2(float(x) - 0.5, float(y) - 0.5) * texelSize;
      float pcfDepth = texture(shadowMap, projCoords.xy + offset).r;
      shadow += currentDepth - (shadowBias + shadowNormalBias) > pcfDepth ? 1.0 : 0.0;
    }
  }

  return shadow / 4.0;
}
`;
  }

  /**
   * 3x3软阴影（9次采样）
   * @private
   */
  private static get3x3Snippet(bias: number, normalBias: number): string {
    return `
/**
 * 计算阴影系数（3x3 PCF软阴影）
 * @param lightSpacePos 光源空间位置
 * @param shadowMap 阴影贴图采样器
 * @return 阴影系数（0.0=无阴影，1.0=完全阴影）
 */
float calculateShadow(vec4 lightSpacePos, sampler2D shadowMap) {
  // 透视除法
  vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;

  // 变换到[0,1]范围
  projCoords = projCoords * 0.5 + 0.5;

  // 超出阴影贴图范围，无阴影
  if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 ||
      projCoords.y < 0.0 || projCoords.y > 1.0) {
    return 0.0;
  }

  float shadowBias = ${bias.toFixed(6)};
  float shadowNormalBias = ${normalBias.toFixed(6)};
  float currentDepth = projCoords.z;
  float shadow = 0.0;

  // 获取纹素大小
  vec2 texelSize = 1.0 / vec2(textureSize(shadowMap, 0));

  // 3x3采样
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 offset = vec2(float(x), float(y)) * texelSize;
      float pcfDepth = texture(shadowMap, projCoords.xy + offset).r;
      shadow += currentDepth - (shadowBias + shadowNormalBias) > pcfDepth ? 1.0 : 0.0;
    }
  }

  return shadow / 9.0;
}
`;
  }

  /**
   * 5x5软阴影（25次采样）
   * @private
   */
  private static get5x5Snippet(bias: number, normalBias: number): string {
    return `
/**
 * 计算阴影系数（5x5 PCF软阴影）
 * @param lightSpacePos 光源空间位置
 * @param shadowMap 阴影贴图采样器
 * @return 阴影系数（0.0=无阴影，1.0=完全阴影）
 */
float calculateShadow(vec4 lightSpacePos, sampler2D shadowMap) {
  // 透视除法
  vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;

  // 变换到[0,1]范围
  projCoords = projCoords * 0.5 + 0.5;

  // 超出阴影贴图范围，无阴影
  if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 ||
      projCoords.y < 0.0 || projCoords.y > 1.0) {
    return 0.0;
  }

  float shadowBias = ${bias.toFixed(6)};
  float shadowNormalBias = ${normalBias.toFixed(6)};
  float currentDepth = projCoords.z;
  float shadow = 0.0;

  // 获取纹素大小
  vec2 texelSize = 1.0 / vec2(textureSize(shadowMap, 0));

  // 5x5采样
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      vec2 offset = vec2(float(x), float(y)) * texelSize;
      float pcfDepth = texture(shadowMap, projCoords.xy + offset).r;
      shadow += currentDepth - (shadowBias + shadowNormalBias) > pcfDepth ? 1.0 : 0.0;
    }
  }

  return shadow / 25.0;
}
`;
  }
}
