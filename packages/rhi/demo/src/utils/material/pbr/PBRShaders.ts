/**
 * material/pbr/PBRShaders.ts
 * PBR着色器代码（Cook-Torrance BRDF模型）
 */

/**
 * PBR顶点着色器
 *
 * 输出：
 * - vWorldPos: 世界空间位置
 * - vNormal: 世界空间法线
 * - vTexCoord: 纹理坐标
 * - vTBN: 切线空间到世界空间的变换矩阵
 */
export const pbrVertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;
layout(location = 3) in vec3 aTangent;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec3 vWorldPos;
out vec3 vNormal;
out vec2 vTexCoord;
out mat3 vTBN;

void main() {
    // 世界空间位置
    vWorldPos = (uModel * vec4(aPosition, 1.0)).xyz;

    // 世界空间法线
    vNormal = mat3(uModel) * aNormal;

    // 纹理坐标
    vTexCoord = aTexCoord;

    // 计算TBN矩阵（切线空间 -> 世界空间）
    vec3 T = normalize(mat3(uModel) * aTangent);
    vec3 N = normalize(vNormal);
    // 重新正交化T（Gram-Schmidt过程）
    T = normalize(T - dot(T, N) * N);
    vec3 B = cross(N, T);
    vTBN = mat3(T, B, N);

    gl_Position = uProjection * uView * vec4(vWorldPos, 1.0);
}
`;

/**
 * PBR片段着色器（基础版本 - 无IBL）
 *
 * 实现Cook-Torrance BRDF模型：
 * - Fresnel: Schlick近似
 * - Normal Distribution: GGX/Trowbridge-Reitz
 * - Geometry: Smith's method
 */
export const pbrFragmentShader = `#version 300 es
precision mediump float;

const float PI = 3.14159265359;

in vec3 vWorldPos;
in vec3 vNormal;
in vec2 vTexCoord;
in mat3 vTBN;

// 材质参数
uniform vec3 uAlbedo;
uniform float uMetalness;
uniform float uRoughness;
uniform float uAO;

// 材质贴图
uniform sampler2D uAlbedoMap;
uniform sampler2D uMetalnessMap;
uniform sampler2D uRoughnessMap;
uniform sampler2D uNormalMap;
uniform sampler2D uAOMap;

// 贴图启用标志
uniform bool uUseAlbedoMap;
uniform bool uUseMetalnessMap;
uniform bool uUseRoughnessMap;
uniform bool uUseNormalMap;
uniform bool uUseAOMap;

// 光源（最多4个点光源）
uniform vec3 uLightPositions[4];
uniform vec3 uLightColors[4];
uniform int uLightCount;

// 相机位置
uniform vec3 uCameraPos;

// 渲染配置
uniform bool uEnableGammaCorrection;

out vec4 fragColor;

// ==================== BRDF函数 ====================

/**
 * Fresnel-Schlick近似
 * F0: 0度入射角的菲涅尔反射率
 * cosTheta: 半程向量H与视线V的夹角余弦
 */
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

/**
 * GGX/Trowbridge-Reitz法线分布函数
 * NdotH: 法线N与半程向量H的夹角余弦
 * roughness: 粗糙度
 */
float distributionGGX(float NdotH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH2 = NdotH * NdotH;

    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return a2 / denom;
}

/**
 * Smith's Schlick-GGX几何遮蔽函数（单向）
 */
float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float denom = NdotV * (1.0 - k) + k;

    return NdotV / denom;
}

/**
 * Smith's method几何函数（双向）
 */
float geometrySmith(float NdotV, float NdotL, float roughness) {
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

// ==================== 主函数 ====================

void main() {
    // 采样材质属性
    vec3 albedo = uUseAlbedoMap
        ? pow(texture(uAlbedoMap, vTexCoord).rgb, vec3(2.2))  // sRGB -> 线性
        : uAlbedo;

    float metalness = uUseMetalnessMap
        ? texture(uMetalnessMap, vTexCoord).r
        : uMetalness;

    float roughness = uUseRoughnessMap
        ? texture(uRoughnessMap, vTexCoord).r
        : uRoughness;

    float ao = uUseAOMap
        ? texture(uAOMap, vTexCoord).r
        : uAO;

    // 获取法线
    vec3 N;
    if (uUseNormalMap) {
        // 从法线贴图采样（切线空间）
        vec3 normalMap = texture(uNormalMap, vTexCoord).rgb * 2.0 - 1.0;
        N = normalize(vTBN * normalMap);
    } else {
        N = normalize(vNormal);
    }

    vec3 V = normalize(uCameraPos - vWorldPos);

    // 计算F0（0度入射角的菲涅尔反射率）
    // 非金属使用0.04，金属使用albedo
    vec3 F0 = mix(vec3(0.04), albedo, metalness);

    // 直接光照累积
    vec3 Lo = vec3(0.0);

    for(int i = 0; i < 4; i++) {
        if(i >= uLightCount) break;

        vec3 L = normalize(uLightPositions[i] - vWorldPos);
        vec3 H = normalize(V + L);

        // 计算光照衰减（距离平方衰减）
        float distance = length(uLightPositions[i] - vWorldPos);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = uLightColors[i] * attenuation;

        // Cook-Torrance BRDF
        float NdotV = max(dot(N, V), 0.0);
        float NdotL = max(dot(N, L), 0.0);
        float NdotH = max(dot(N, H), 0.0);
        float HdotV = max(dot(H, V), 0.0);

        // D: 法线分布函数
        float D = distributionGGX(NdotH, roughness);

        // F: 菲涅尔项
        vec3 F = fresnelSchlick(HdotV, F0);

        // G: 几何遮蔽函数
        float G = geometrySmith(NdotV, NdotL, roughness);

        // 镜面反射BRDF
        vec3 numerator = D * F * G;
        float denominator = 4.0 * NdotV * NdotL + 0.001; // 防止除零
        vec3 specular = numerator / denominator;

        // 能量守恒：kS + kD = 1
        vec3 kS = F; // 镜面反射比例
        vec3 kD = vec3(1.0) - kS; // 漫反射比例
        kD *= 1.0 - metalness; // 金属没有漫反射

        // Lambertian漫反射
        vec3 diffuse = kD * albedo / PI;

        // 累加该光源的贡献
        Lo += (diffuse + specular) * radiance * NdotL;
    }

    // 环境光（简单的常数环境光）
    vec3 ambient = vec3(0.03) * albedo * ao;

    vec3 color = ambient + Lo;

    // Gamma校正（线性 -> sRGB）
    if (uEnableGammaCorrection) {
        color = pow(color, vec3(1.0 / 2.2));
    }

    fragColor = vec4(color, 1.0);
}
`;

/**
 * PBR片段着色器（完整版本 - 支持IBL）
 */
export const pbrFragmentShaderWithIBL = `#version 300 es
precision mediump float;

const float PI = 3.14159265359;
const float MAX_REFLECTION_LOD = 4.0;

in vec3 vWorldPos;
in vec3 vNormal;
in vec2 vTexCoord;
in mat3 vTBN;

// 材质参数
uniform vec3 uAlbedo;
uniform float uMetalness;
uniform float uRoughness;
uniform float uAO;

// 材质贴图
uniform sampler2D uAlbedoMap;
uniform sampler2D uMetalnessMap;
uniform sampler2D uRoughnessMap;
uniform sampler2D uNormalMap;
uniform sampler2D uAOMap;

// IBL贴图
uniform samplerCube uIrradianceMap;
uniform samplerCube uPrefilterMap;
uniform sampler2D uBRDFLUT;

// 贴图启用标志
uniform bool uUseAlbedoMap;
uniform bool uUseMetalnessMap;
uniform bool uUseRoughnessMap;
uniform bool uUseNormalMap;
uniform bool uUseAOMap;
uniform bool uEnableIBL;

// 光源（最多4个点光源）
uniform vec3 uLightPositions[4];
uniform vec3 uLightColors[4];
uniform int uLightCount;

// 相机位置
uniform vec3 uCameraPos;

// 渲染配置
uniform bool uEnableGammaCorrection;

out vec4 fragColor;

// ==================== BRDF函数 ====================

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

float distributionGGX(float NdotH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH2 = NdotH * NdotH;

    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return a2 / denom;
}

float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float denom = NdotV * (1.0 - k) + k;

    return NdotV / denom;
}

float geometrySmith(float NdotV, float NdotL, float roughness) {
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

// ==================== 主函数 ====================

void main() {
    // 采样材质属性
    vec3 albedo = uUseAlbedoMap
        ? pow(texture(uAlbedoMap, vTexCoord).rgb, vec3(2.2))
        : uAlbedo;

    float metalness = uUseMetalnessMap
        ? texture(uMetalnessMap, vTexCoord).r
        : uMetalness;

    float roughness = uUseRoughnessMap
        ? texture(uRoughnessMap, vTexCoord).r
        : uRoughness;

    float ao = uUseAOMap
        ? texture(uAOMap, vTexCoord).r
        : uAO;

    // 获取法线
    vec3 N;
    if (uUseNormalMap) {
        vec3 normalMap = texture(uNormalMap, vTexCoord).rgb * 2.0 - 1.0;
        N = normalize(vTBN * normalMap);
    } else {
        N = normalize(vNormal);
    }

    vec3 V = normalize(uCameraPos - vWorldPos);
    vec3 R = reflect(-V, N);

    // 计算F0
    vec3 F0 = mix(vec3(0.04), albedo, metalness);

    // ==================== 直接光照 ====================
    vec3 Lo = vec3(0.0);

    for(int i = 0; i < 4; i++) {
        if(i >= uLightCount) break;

        vec3 L = normalize(uLightPositions[i] - vWorldPos);
        vec3 H = normalize(V + L);

        float distance = length(uLightPositions[i] - vWorldPos);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = uLightColors[i] * attenuation;

        float NdotV = max(dot(N, V), 0.0);
        float NdotL = max(dot(N, L), 0.0);
        float NdotH = max(dot(N, H), 0.0);
        float HdotV = max(dot(H, V), 0.0);

        float D = distributionGGX(NdotH, roughness);
        vec3 F = fresnelSchlick(HdotV, F0);
        float G = geometrySmith(NdotV, NdotL, roughness);

        vec3 numerator = D * F * G;
        float denominator = 4.0 * NdotV * NdotL + 0.001;
        vec3 specular = numerator / denominator;

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metalness;

        vec3 diffuse = kD * albedo / PI;

        Lo += (diffuse + specular) * radiance * NdotL;
    }

    // ==================== 环境光照（IBL） ====================
    vec3 ambient;

    if (uEnableIBL) {
        float NdotV = max(dot(N, V), 0.0);

        // 漫反射IBL
        vec3 irradiance = texture(uIrradianceMap, N).rgb;
        vec3 diffuse = irradiance * albedo;

        // 镜面IBL
        vec3 prefilteredColor = textureLod(uPrefilterMap, R, roughness * MAX_REFLECTION_LOD).rgb;
        vec2 brdf = texture(uBRDFLUT, vec2(NdotV, roughness)).rg;
        vec3 specular = prefilteredColor * (F0 * brdf.x + brdf.y);

        // 能量守恒
        vec3 F = fresnelSchlickRoughness(NdotV, F0, roughness);
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metalness;

        ambient = (kD * diffuse + specular) * ao;
    } else {
        // 简单环境光
        ambient = vec3(0.03) * albedo * ao;
    }

    vec3 color = ambient + Lo;

    // Gamma校正
    if (uEnableGammaCorrection) {
        color = pow(color, vec3(1.0 / 2.2));
    }

    fragColor = vec4(color, 1.0);
}
`;
