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
 * - LightSpaceMatrix: 光源空间变换矩阵（用于阴影贴图）
 *
 * 输出：
 * - vWorldPosition: 世界空间位置
 * - vNormal: 世界空间法线
 * - vLightSpacePosition: 光源空间位置（用于阴影采样）
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

uniform LightSpaceMatrix {
  mat4 uLightSpaceMatrix;
};

out vec3 vWorldPosition;
out vec3 vNormal;
out vec4 vLightSpacePosition;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
  vLightSpacePosition = uLightSpaceMatrix * worldPosition;
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
 * - PCF软阴影
 * - HDR色调映射 + Gamma校正
 *
 * Uniform Blocks:
 * - PBRMaterial: 材质参数（albedo, metallic, roughness, ambientStrength）
 * - PointLights: 点光源数据（最多2个）
 * - CameraData: 相机位置
 * - ShadowParams: 阴影参数（强度、偏移、PCF采样数）
 *
 * Uniforms:
 * - uEnvironmentMap: 环境立方体贴图
 * - uShadowMap: 阴影深度贴图
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

// 阴影参数
uniform ShadowParams {
  float uShadowStrength;  // 阴影强度 (0.0 - 1.0)
  float uShadowBias;      // 阴影偏移
  int uPCFSamples;        // PCF采样数 (1, 4, 9)
  float uDebugShadow;     // 调试模式：0=关闭, 1=显示阴影因子
};

uniform samplerCube uEnvironmentMap;
uniform sampler2D uShadowMap;

in vec3 vWorldPosition;
in vec3 vNormal;
in vec4 vLightSpacePosition;

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

// ==================== 阴影计算 ====================

/**
 * PCF软阴影计算
 * @param lightSpacePos 光源空间位置
 * @param bias 阴影偏移
 * @return 阴影因子 (0.0 = 完全阴影, 1.0 = 无阴影)
 */
float calculateShadow(vec4 lightSpacePos, float bias) {
  // 透视除法（正交投影下 w = 1.0，但仍需要执行以保持通用性）
  vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;

  // 变换到[0,1]范围（NDC [-1,1] -> Texture [0,1]）
  projCoords = projCoords * 0.5 + 0.5;

  // 超出阴影贴图范围，认为不在阴影中
  if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 ||
      projCoords.y < 0.0 || projCoords.y > 1.0) {
    return 1.0;
  }

  // 当前片段深度（在光源空间中）
  float currentDepth = projCoords.z;

  // 从 Shadow Map 采样深度
  float closestDepth = texture(uShadowMap, projCoords.xy).r;

  // 阴影测试：如果当前深度大于采样深度+bias，则在阴影中
  float shadow = 0.0;

  if (uPCFSamples == 1) {
    // 无PCF，直接采样
    shadow = currentDepth > (closestDepth + bias) ? 1.0 : 0.0;
  } else if (uPCFSamples == 4) {
    // 2x2 PCF
    vec2 texelSize = 1.0 / vec2(textureSize(uShadowMap, 0));
    for (int x = -1; x <= 0; ++x) {
      for (int y = -1; y <= 0; ++y) {
        float pcfDepth = texture(uShadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
        shadow += currentDepth > (pcfDepth + bias) ? 1.0 : 0.0;
      }
    }
    shadow /= 4.0;
  } else {
    // 3x3 PCF (uPCFSamples == 9)
    vec2 texelSize = 1.0 / vec2(textureSize(uShadowMap, 0));
    for (int x = -1; x <= 1; ++x) {
      for (int y = -1; y <= 1; ++y) {
        float pcfDepth = texture(uShadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
        shadow += currentDepth > (pcfDepth + bias) ? 1.0 : 0.0;
      }
    }
    shadow /= 9.0;
  }

  // 应用阴影强度
  shadow = mix(0.0, shadow, uShadowStrength);

  // 返回阴影因子 (1.0 = 无阴影, 0.0 = 完全阴影)
  return 1.0 - shadow;
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

  // 计算阴影因子
  float shadowFactor = calculateShadow(vLightSpacePosition, uShadowBias);

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

    // 应用阴影到光源贡献
    Lo += (kD * albedo / PI + specular) * radiance * NdotL * shadowFactor;
  }

  // 环境光 (IBL)
  vec3 kS_env = fresnelSchlick(max(dot(N, V), 0.0), F0);
  vec3 kD_env = 1.0 - kS_env;
  kD_env *= 1.0 - metallic;

  vec3 irradiance = texture(uEnvironmentMap, N).rgb;
  vec3 diffuse = irradiance * albedo;

  vec3 R = reflect(-V, N);
  vec3 prefilteredColor = texture(uEnvironmentMap, R).rgb;
  vec3 specular = prefilteredColor * (F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - max(dot(N, V), 0.0), 0.0, 1.0), 5.0));

  // 阴影也影响环境光的漫反射部分（但保留一部分环境光作为全局光照）
  float ambientShadow = mix(1.0, shadowFactor, 0.5); // 阴影对环境光的影响减半
  vec3 ambient = (kD_env * diffuse * ambientShadow + specular) * uAmbientStrength;

  vec3 color = ambient + Lo;

  // 调试模式：直接显示阴影因子或其他调试信息
  if (uDebugShadow > 3.5) {
    // debugShadow=4: 显示深度差异 (currentDepth - sampledDepth)
    vec3 lsPos = vLightSpacePosition.xyz / vLightSpacePosition.w;
    lsPos = lsPos * 0.5 + 0.5;
    float sampledDepth = texture(uShadowMap, lsPos.xy).r;
    float diff = lsPos.z - sampledDepth; // 正值=在阴影中，负值=不在阴影中
    // 可视化：绿色=负值(不在阴影)，红色=正值(在阴影)
    if (diff > 0.0) {
      fragColor = vec4(diff * 10.0, 0.0, 0.0, 1.0); // 红色 = 在阴影中
    } else {
      fragColor = vec4(0.0, -diff * 10.0, 0.0, 1.0); // 绿色 = 不在阴影
    }
    return;
  }
  if (uDebugShadow > 2.5) {
    // debugShadow=3: 显示 Shadow Map 采样的深度值（用于验证纹理绑定）
    vec3 lsPos = vLightSpacePosition.xyz / vLightSpacePosition.w;
    lsPos = lsPos * 0.5 + 0.5;
    float sampledDepth = texture(uShadowMap, lsPos.xy).r;
    fragColor = vec4(vec3(sampledDepth), 1.0);
    return;
  }
  if (uDebugShadow > 1.5) {
    // debugShadow=2: 显示光源空间坐标 (用于调试矩阵变换)
    vec3 lsPos = vLightSpacePosition.xyz / vLightSpacePosition.w;
    lsPos = lsPos * 0.5 + 0.5;
    fragColor = vec4(lsPos, 1.0);
    return;
  }
  if (uDebugShadow > 0.5) {
    // debugShadow=1: 显示阴影因子：白色=无阴影(1.0)，黑色=完全阴影(0.0)
    fragColor = vec4(vec3(shadowFactor), 1.0);
    return;
  }

  // HDR色调映射（Reinhard）
  color = color / (color + vec3(1.0));
  // Gamma校正
  color = pow(color, vec3(1.0 / 2.2));

  fragColor = vec4(color, 1.0);
}
`;
