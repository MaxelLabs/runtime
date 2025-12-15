/**
 * particle/ParticleShaders.ts
 * 粒子系统着色器
 *
 * 提供标准的粒子渲染着色器（Billboard 效果）。
 * 支持透明混合和颜色渐变。
 */

/**
 * 粒子顶点着色器
 *
 * 输入：
 * - Buffer 0 (per-vertex):
 *   - location 0: vec3 aPosition (Billboard 局部坐标)
 *   - location 1: vec2 aTexCoord (UV 坐标)
 * - Buffer 1 (per-instance):
 *   - location 2: vec3 instancePosition (粒子世界位置)
 *   - location 3: vec4 instanceColor (粒子颜色)
 *   - location 4: float instanceSize (粒子大小)
 *
 * Uniform:
 * - Transforms (binding 0):
 *   - mat4 uViewMatrix
 *   - mat4 uProjectionMatrix
 *
 * 输出：
 * - vec2 vTexCoord (UV 坐标)
 * - vec4 vColor (粒子颜色)
 */
export const particleVertexShader = `#version 300 es
precision highp float;

// 顶点属性（Billboard 几何体）
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;

// 实例属性（粒子数据）
layout(location = 2) in vec3 instancePosition;
layout(location = 3) in vec4 instanceColor;
layout(location = 4) in float instanceSize;

// Uniform
uniform Transforms {
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

// 输出到片元着色器
out vec2 vTexCoord;
out vec4 vColor;

void main() {
  // Billboard 效果：提取相机的右向量和上向量
  // 视图矩阵的前三列分别是右向量、上向量、前向量
  vec3 cameraRight = vec3(uViewMatrix[0][0], uViewMatrix[1][0], uViewMatrix[2][0]);
  vec3 cameraUp = vec3(uViewMatrix[0][1], uViewMatrix[1][1], uViewMatrix[2][1]);

  // 计算 Billboard 顶点的世界位置
  // 粒子中心位置 + (局部坐标.x * 右向量 + 局部坐标.y * 上向量) * 粒子大小
  vec3 worldPosition = instancePosition
    + cameraRight * aPosition.x * instanceSize
    + cameraUp * aPosition.y * instanceSize;

  // 变换到裁剪空间
  gl_Position = uProjectionMatrix * uViewMatrix * vec4(worldPosition, 1.0);

  // 传递 UV 坐标和颜色
  vTexCoord = aTexCoord;
  vColor = instanceColor;
}
`;

/**
 * 粒子片元着色器（纯色版本）
 *
 * 输入：
 * - vec2 vTexCoord (UV 坐标)
 * - vec4 vColor (粒子颜色)
 *
 * 输出：
 * - vec4 fragColor (最终颜色)
 */
export const particleFragmentShader = `#version 300 es
precision mediump float;

// 从顶点着色器传入
in vec2 vTexCoord;
in vec4 vColor;

// 输出
out vec4 fragColor;

void main() {
  // 圆形粒子（基于距离的 alpha 衰减）
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(vTexCoord, center);
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

  // 应用粒子颜色
  fragColor = vec4(vColor.rgb, vColor.a * alpha);

  // 丢弃完全透明的片元
  if (fragColor.a < 0.01) {
    discard;
  }
}
`;

/**
 * 粒子片元着色器（纹理版本）
 *
 * 输入：
 * - vec2 vTexCoord (UV 坐标)
 * - vec4 vColor (粒子颜色)
 * - sampler2D uParticleTexture (粒子纹理)
 *
 * 输出：
 * - vec4 fragColor (最终颜色)
 */
export const particleFragmentShaderTextured = `#version 300 es
precision mediump float;

// 从顶点着色器传入
in vec2 vTexCoord;
in vec4 vColor;

// 纹理
uniform sampler2D uParticleTexture;

// 输出
out vec4 fragColor;

void main() {
  // 采样粒子纹理
  vec4 texColor = texture(uParticleTexture, vTexCoord);

  // 混合纹理颜色和粒子颜色
  fragColor = texColor * vColor;

  // 丢弃完全透明的片元
  if (fragColor.a < 0.01) {
    discard;
  }
}
`;

/**
 * 粒子片元着色器（软粒子版本，支持深度混合）
 *
 * 输入：
 * - vec2 vTexCoord (UV 坐标)
 * - vec4 vColor (粒子颜色)
 * - sampler2D uDepthTexture (场景深度纹理)
 *
 * 输出：
 * - vec4 fragColor (最终颜色)
 */
export const particleFragmentShaderSoft = `#version 300 es
precision mediump float;

// 从顶点着色器传入
in vec2 vTexCoord;
in vec4 vColor;

// 深度纹理
uniform sampler2D uDepthTexture;

// 软粒子参数
uniform SoftParticleParams {
  float uSoftness; // 软化范围
  vec2 uScreenSize; // 屏幕尺寸
};

// 输出
out vec4 fragColor;

void main() {
  // 圆形粒子
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(vTexCoord, center);
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

  // 软粒子效果（基于深度差异）
  vec2 screenUV = gl_FragCoord.xy / uScreenSize;
  float sceneDepth = texture(uDepthTexture, screenUV).r;
  float particleDepth = gl_FragCoord.z;
  float depthDiff = sceneDepth - particleDepth;
  float softFactor = clamp(depthDiff / uSoftness, 0.0, 1.0);

  // 应用软化因子
  alpha *= softFactor;

  // 应用粒子颜色
  fragColor = vec4(vColor.rgb, vColor.a * alpha);

  // 丢弃完全透明的片元
  if (fragColor.a < 0.01) {
    discard;
  }
}
`;
