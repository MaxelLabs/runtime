/**
 * Basic Shaders for ForwardRenderer
 * 基础着色器源码
 *
 * @packageDocumentation
 *
 * @remarks
 * 包含支持多光源的 PBR 着色器实现。
 * 支持方向光、点光源和聚光灯三种光源类型。
 */

/**
 * 最大光源数量
 * @remarks 与 lights-ubo.ts 中的 MAX_LIGHTS 保持一致
 */
const MAX_LIGHTS = 8;

/**
 * 基础顶点着色器 (WebGL2 / GLSL ES 3.00)
 * 使用 Uniform Block (UBO) 传递矩阵
 */
export const BASIC_VERTEX_SHADER_300 = `#version 300 es
precision highp float;

// Vertex attributes
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

// Uniform Block for matrices
layout(std140) uniform Matrices {
  mat4 u_modelMatrix;
  mat4 u_viewMatrix;
  mat4 u_projectionMatrix;
  mat4 u_normalMatrix;
};

// Varyings
out vec3 v_position;
out vec3 v_normal;
out vec2 v_uv;

void main() {
  vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
  v_position = worldPosition.xyz;
  v_normal = mat3(u_normalMatrix) * a_normal;
  v_uv = a_uv;

  gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}
`;

/**
 * 多光源 PBR 片段着色器 (WebGL2 / GLSL ES 3.00)
 * 支持方向光、点光源和聚光灯
 */
export const BASIC_FRAGMENT_SHADER_300 = `#version 300 es
precision highp float;

// 最大光源数量
#define MAX_LIGHTS ${MAX_LIGHTS}

// 光源类型常量
#define LIGHT_TYPE_DIRECTIONAL 0
#define LIGHT_TYPE_POINT 1
#define LIGHT_TYPE_SPOT 2

// Varyings
in vec3 v_position;
in vec3 v_normal;
in vec2 v_uv;

// Material Uniform Block
layout(std140) uniform Material {
  vec4 u_baseColor;
  float u_metallic;
  float u_roughness;
  vec2 _pad0;  // padding for std140
  vec3 u_lightDirection;  // 保留用于单光源回退
  float _pad1;
  vec3 u_lightColor;      // 保留用于单光源回退
  float _pad2;
  vec3 u_cameraPosition;
  float _pad3;
};

// Lights Uniform Block
layout(std140) uniform Lights {
  vec4 u_lightColors[MAX_LIGHTS];      // xyz = RGB, w = intensity
  vec4 u_lightPositions[MAX_LIGHTS];   // xyz = position, w = type
  vec4 u_lightDirections[MAX_LIGHTS];  // xyz = direction, w = range
  vec4 u_lightParams[MAX_LIGHTS];      // x = innerCos, y = outerCos, z = decay, w = shadowIndex
  uint u_lightCount;
};

// Output
out vec4 fragColor;

// ==================== PBR 常量 ====================
const float PI = 3.14159265359;

// ==================== PBR 核心函数 ====================

/**
 * Fresnel-Schlick 近似
 */
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

/**
 * GGX 法线分布函数
 */
float distributionGGX(vec3 N, vec3 H, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = max(dot(N, H), 0.0);
  float NdotH2 = NdotH * NdotH;

  float num = a2;
  float denom = (NdotH2 * (a2 - 1.0) + 1.0);
  denom = PI * denom * denom;

  return num / denom;
}

/**
 * Schlick-GGX 几何函数
 */
float geometrySchlickGGX(float NdotV, float roughness) {
  float r = roughness + 1.0;
  float k = (r * r) / 8.0;

  float num = NdotV;
  float denom = NdotV * (1.0 - k) + k;

  return num / denom;
}

/**
 * Smith 几何函数
 */
float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  float ggx2 = geometrySchlickGGX(NdotV, roughness);
  float ggx1 = geometrySchlickGGX(NdotL, roughness);

  return ggx1 * ggx2;
}

/**
 * 计算单个光源的 PBR 贡献
 */
vec3 calculatePBRLight(
  vec3 N,
  vec3 V,
  vec3 L,
  vec3 radiance,
  vec3 albedo,
  float metallic,
  float roughness
) {
  vec3 H = normalize(V + L);

  // 基础反射率
  vec3 F0 = vec3(0.04);
  F0 = mix(F0, albedo, metallic);

  // Cook-Torrance BRDF
  float NDF = distributionGGX(N, H, roughness);
  float G = geometrySmith(N, V, L, roughness);
  vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

  vec3 numerator = NDF * G * F;
  float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
  vec3 specular = numerator / denominator;

  // 能量守恒
  vec3 kS = F;
  vec3 kD = vec3(1.0) - kS;
  kD *= 1.0 - metallic;

  float NdotL = max(dot(N, L), 0.0);

  return (kD * albedo / PI + specular) * radiance * NdotL;
}

// ==================== 光源计算函数 ====================

/**
 * 计算方向光贡献
 */
vec3 calculateDirectionalLight(
  int index,
  vec3 N,
  vec3 V,
  vec3 albedo,
  float metallic,
  float roughness
) {
  vec3 lightColor = u_lightColors[index].rgb;
  float intensity = u_lightColors[index].w;
  vec3 L = normalize(-u_lightDirections[index].xyz);

  return calculatePBRLight(N, V, L, lightColor * intensity, albedo, metallic, roughness);
}

/**
 * 计算点光源贡献
 */
vec3 calculatePointLight(
  int index,
  vec3 worldPos,
  vec3 N,
  vec3 V,
  vec3 albedo,
  float metallic,
  float roughness
) {
  vec3 lightColor = u_lightColors[index].rgb;
  float intensity = u_lightColors[index].w;
  vec3 lightPos = u_lightPositions[index].xyz;
  float range = u_lightDirections[index].w;
  float decay = u_lightParams[index].z;

  vec3 L = lightPos - worldPos;
  float distance = length(L);
  L = normalize(L);

  // 距离衰减
  float attenuation = pow(max(1.0 - distance / range, 0.0), decay);

  return calculatePBRLight(N, V, L, lightColor * intensity * attenuation, albedo, metallic, roughness);
}

/**
 * 计算聚光灯贡献
 */
vec3 calculateSpotLight(
  int index,
  vec3 worldPos,
  vec3 N,
  vec3 V,
  vec3 albedo,
  float metallic,
  float roughness
) {
  vec3 lightColor = u_lightColors[index].rgb;
  float intensity = u_lightColors[index].w;
  vec3 lightPos = u_lightPositions[index].xyz;
  vec3 lightDir = normalize(u_lightDirections[index].xyz);
  float range = u_lightDirections[index].w;
  float innerCos = u_lightParams[index].x;
  float outerCos = u_lightParams[index].y;
  float decay = u_lightParams[index].z;

  vec3 L = lightPos - worldPos;
  float distance = length(L);
  L = normalize(L);

  // 距离衰减
  float distanceAttenuation = pow(max(1.0 - distance / range, 0.0), decay);

  // 锥形衰减
  float theta = dot(L, -lightDir);
  float spotAttenuation = smoothstep(outerCos, innerCos, theta);

  float attenuation = distanceAttenuation * spotAttenuation;

  return calculatePBRLight(N, V, L, lightColor * intensity * attenuation, albedo, metallic, roughness);
}

/**
 * 计算所有光源的总贡献
 */
vec3 calculateAllLights(
  vec3 worldPos,
  vec3 N,
  vec3 V,
  vec3 albedo,
  float metallic,
  float roughness
) {
  vec3 totalLight = vec3(0.0);

  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= int(u_lightCount)) break;

    int lightType = int(u_lightPositions[i].w);

    if (lightType == LIGHT_TYPE_DIRECTIONAL) {
      totalLight += calculateDirectionalLight(i, N, V, albedo, metallic, roughness);
    } else if (lightType == LIGHT_TYPE_POINT) {
      totalLight += calculatePointLight(i, worldPos, N, V, albedo, metallic, roughness);
    } else if (lightType == LIGHT_TYPE_SPOT) {
      totalLight += calculateSpotLight(i, worldPos, N, V, albedo, metallic, roughness);
    }
  }

  return totalLight;
}

void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(u_cameraPosition - v_position);

  vec3 albedo = u_baseColor.rgb;
  float metallic = u_metallic;
  float roughness = u_roughness;

  // 环境光
  vec3 ambient = albedo * 0.03;

  // 计算所有光源贡献
  vec3 Lo = vec3(0.0);

  if (u_lightCount > 0u) {
    // 使用多光源系统
    Lo = calculateAllLights(v_position, N, V, albedo, metallic, roughness);
  } else {
    // 回退到单光源（兼容旧代码）
    vec3 L = normalize(-u_lightDirection);
    vec3 H = normalize(L + V);

    float NdotL = max(dot(N, L), 0.0);
    float NdotH = max(dot(N, H), 0.0);
    float shininess = mix(8.0, 256.0, 1.0 - roughness);
    float specular = pow(NdotH, shininess) * (1.0 - roughness);

    vec3 diffuse = albedo * NdotL * u_lightColor;
    vec3 specularColor = mix(vec3(0.04), albedo, metallic);
    vec3 spec = specularColor * specular * u_lightColor;

    Lo = diffuse + spec;
  }

  vec3 finalColor = ambient + Lo;

  // Gamma 校正
  finalColor = pow(finalColor, vec3(1.0 / 2.2));

  fragColor = vec4(finalColor, u_baseColor.a);
}
`;

/**
 * Unlit 顶点着色器 (WebGL2 / GLSL ES 3.00)
 */
export const UNLIT_VERTEX_SHADER_300 = `#version 300 es
precision highp float;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

out vec2 v_uv;

void main() {
  v_uv = a_uv;
  gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);
}
`;

/**
 * Unlit 片段着色器 (WebGL2 / GLSL ES 3.00)
 */
export const UNLIT_FRAGMENT_SHADER_300 = `#version 300 es
precision highp float;

in vec2 v_uv;

uniform vec4 u_color;

out vec4 fragColor;

void main() {
  fragColor = u_color;
}
`;

/**
 * WebGL1 兼容的顶点着色器 (GLSL ES 1.00)
 */
export const BASIC_VERTEX_SHADER_100 = `
precision highp float;

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;

varying vec3 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

void main() {
  vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
  v_position = worldPosition.xyz;
  v_normal = mat3(u_normalMatrix) * a_normal;
  v_uv = a_uv;

  gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}
`;

/**
 * WebGL1 兼容的片段着色器 (GLSL ES 1.00)
 * 注意：WebGL1 不支持 UBO，使用单光源简化版本
 */
export const BASIC_FRAGMENT_SHADER_100 = `
precision highp float;

varying vec3 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

uniform vec4 u_baseColor;
uniform float u_metallic;
uniform float u_roughness;
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_cameraPosition;

void main() {
  vec3 N = normalize(v_normal);
  vec3 L = normalize(-u_lightDirection);
  vec3 V = normalize(u_cameraPosition - v_position);
  vec3 H = normalize(L + V);

  float NdotL = max(dot(N, L), 0.0);
  float NdotH = max(dot(N, H), 0.0);
  float shininess = mix(8.0, 256.0, 1.0 - u_roughness);
  float specular = pow(NdotH, shininess) * (1.0 - u_roughness);

  vec3 ambient = u_baseColor.rgb * 0.1;
  vec3 diffuse = u_baseColor.rgb * NdotL * u_lightColor;
  vec3 specularColor = mix(vec3(0.04), u_baseColor.rgb, u_metallic);
  vec3 spec = specularColor * specular * u_lightColor;

  vec3 finalColor = ambient + diffuse + spec;
  finalColor = pow(finalColor, vec3(1.0 / 2.2));

  gl_FragColor = vec4(finalColor, u_baseColor.a);
}
`;
