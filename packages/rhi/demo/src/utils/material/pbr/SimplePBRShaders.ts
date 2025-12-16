/**
 * material/pbr/SimplePBRShaders.ts
 * 简化版PBR着色器（基于pbr-material.ts的可工作实现）
 *
 * 特性：
 * - Cook-Torrance BRDF
 * - 金属度/粗糙度工作流
 * - 简单的环境贴图采样（无预计算IBL）
 * - 支持最多2个点光源
 */

/**
 * 简化版PBR顶点着色器
 *
 * 输入：
 * - aPosition: 顶点位置
 * - aNormal: 顶点法线
 *
 * Uniform Blocks:
 * - Transforms: 包含模型、视图、投影和法线矩阵
 *
 * 输出：
 * - vWorldPosition: 世界空间位置
 * - vNormal: 世界空间法线
 */
export const simplePBRVertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

out vec3 vWorldPosition;
out vec3 vNormal;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

/**
 * 简化版PBR片段着色器
 *
 * 实现Cook-Torrance BRDF模型：
 * - GGX法线分布函数
 * - Schlick几何衰减
 * - Fresnel反射（Schlick近似）
 * - HDR色调映射 + Gamma校正
 *
 * Uniform Blocks:
 * - PBRMaterial: 材质参数（albedo, metallic, roughness, ambientStrength）
 * - PointLights: 点光源数据（最多2个）
 * - CameraData: 相机位置
 *
 * Uniforms:
 * - uEnvironmentMap: 环境立方体贴图
 */
export const simplePBRFragmentShader = `#version 300 es
precision mediump float;

// 点光源结构体
struct PointLight {
  vec3 position;     // 16 bytes (with padding)
  vec3 color;        // 16 bytes (with padding)
  float constant;    // 4 bytes
  float linear;      // 4 bytes
  float quadratic;   // 4 bytes
  float _padding;    // 4 bytes (alignment)
};

// PBR材质参数
layout(std140) uniform PBRMaterial {
  vec3 uAlbedo;           // 16 bytes (12 + 4 padding)
  float uMetallic;        // 4 bytes
  float uRoughness;       // 4 bytes
  float uAmbientStrength; // 4 bytes
  float _padMat1;         // 4 bytes
  float _padMat2;         // 4 bytes
};

// 点光源数据
layout(std140) uniform PointLights {
  PointLight uLights[2];  // 96 bytes
  int uLightCount;        // 4 bytes
  float _pad1;
  float _pad2;
  float _pad3;
};

// 相机数据
uniform CameraData {
  vec3 uCameraPosition;   // 16 bytes (with padding)
};

uniform samplerCube uEnvironmentMap;

in vec3 vWorldPosition;
in vec3 vNormal;

out vec4 fragColor;

// 常量
const float PI = 3.14159265359;

// ==================== PBR函数 ====================

// Trowbridge-Reitz GGX 法线分布函数
float DistributionGGX(vec3 N, vec3 H, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = max(dot(N, H), 0.0);
  float NdotH2 = NdotH * NdotH;

  float num = a2;
  float denom = (NdotH2 * (a2 - 1.0) + 1.0);
  denom = PI * denom * denom;

  return num / denom;
}

// Schlick-GGX 几何衰减函数
float GeometrySchlickGGX(float NdotV, float roughness) {
  float r = (roughness + 1.0);
  float k = (r * r) / 8.0;

  float num = NdotV;
  float denom = NdotV * (1.0 - k) + k;

  return num / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  float ggx2 = GeometrySchlickGGX(NdotV, roughness);
  float ggx1 = GeometrySchlickGGX(NdotL, roughness);

  return ggx1 * ggx2;
}

// Fresnel反射（Schlick近似）
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// ==================== 主函数 ====================

void main() {
  vec3 albedo = uAlbedo;
  float metallic = uMetallic;
  float roughness = max(uRoughness, 0.04); // 限制最小粗糙度

  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCameraPosition - vWorldPosition);

  // 计算F0（表面反射率）
  vec3 F0 = vec3(0.04); // 非金属的基础反射率
  F0 = mix(F0, albedo, metallic);

  // 反射率方程（累加所有光源贡献）
  vec3 Lo = vec3(0.0);

  for (int i = 0; i < 2; i++) {
    if (i >= uLightCount) break;

    PointLight light = uLights[i];

    // 光源方向
    vec3 L = normalize(light.position - vWorldPosition);
    vec3 H = normalize(V + L);
    float distance = length(light.position - vWorldPosition);

    // 距离衰减
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * distance * distance);
    vec3 radiance = light.color * attenuation;

    // Cook-Torrance BRDF
    float NDF = DistributionGGX(N, H, roughness);
    float G = GeometrySmith(N, V, L, roughness);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 kS = F; // 镜面反射比率
    vec3 kD = vec3(1.0) - kS; // 漫反射比率
    kD *= 1.0 - metallic; // 金属材质没有漫反射

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    vec3 specular = numerator / denominator;

    float NdotL = max(dot(N, L), 0.0);
    Lo += (kD * albedo / PI + specular) * radiance * NdotL;
  }

  // 环境光 (IBL)
  // 采样环境贴图作为漫反射环境光
  // 简单的近似：漫反射部分直接采样环境贴图（通常应该使用预计算的 Irradiance Map）
  vec3 kS_env = fresnelSchlick(max(dot(N, V), 0.0), F0);
  vec3 kD_env = 1.0 - kS_env;
  kD_env *= 1.0 - metallic;

  vec3 irradiance = texture(uEnvironmentMap, N).rgb;
  vec3 diffuse = irradiance * albedo;

  // 采样环境贴图作为镜面反射环境光
  // 简单的近似：使用反射向量采样（通常应该使用 Prefiltered Environment Map + BRDF LUT）
  vec3 R = reflect(-V, N);
  vec3 prefilteredColor = texture(uEnvironmentMap, R).rgb;
  vec3 specular = prefilteredColor * (F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - max(dot(N, V), 0.0), 0.0, 1.0), 5.0));

  vec3 ambient = (kD_env * diffuse + specular) * uAmbientStrength;

  vec3 color = ambient + Lo;

  // HDR色调映射（Reinhard）
  color = color / (color + vec3(1.0));
  // Gamma校正
  color = pow(color, vec3(1.0 / 2.2));

  fragColor = vec4(color, 1.0);
}
`;
