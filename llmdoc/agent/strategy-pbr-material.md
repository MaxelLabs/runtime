# Strategy: PBR Material System Module

## 1. Mission Overview
实现基于物理的渲染（PBR）材质系统，支持金属度/粗糙度工作流和IBL光照

## 2. Module Architecture

### Class Diagram
```
PBRMaterialSystem
├── PBRMaterial (材质类)
│   ├── albedo: Texture
│   ├── metalness: Texture
│   ├── roughness: Texture
│   ├── normal: Texture
│   ├── ao: Texture
│   └── setProperty()
├── IBLLoader (IBL支持)
│   ├── diffuseIrradiance: Texture
│   ├── specularPrefilter: Texture
│   └── brdfLUT: Texture
└── MaterialLibrary (材质库)
    └── presets: Map<string, PBRConfig>
```

### Data Flow
1. 加载纹理贴图（Albedo, Metalness, Roughness, Normal, AO）
2. 加载环境映射（从Skybox生成IBL贴图）
3. PBR着色器计算：直接光照 + IBL间接光照
4. 输出最终颜色

## 3. Core Algorithm (Pseudo-code)

### PBR Shading Model
```glsl
// Cook-Torrance BRDF
vec3 pbrShading(
  vec3 albedo,
  float metalness,
  float roughness,
  vec3 N, vec3 V, vec3 L
) {
  vec3 H = normalize(V + L);

  // Fresnel (Schlick近似)
  vec3 F0 = mix(vec3(0.04), albedo, metalness);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - dot(H, V), 5.0);

  // Normal Distribution (GGX/Trowbridge-Reitz)
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = max(dot(N, H), 0.0);
  float denom = (NdotH * NdotH * (a2 - 1.0) + 1.0);
  float D = a2 / (PI * denom * denom);

  // Geometry (Smith's method)
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
  float G = smithG(NdotV, k) * smithG(NdotL, k);

  // Specular BRDF
  vec3 specular = (D * F * G) / (4.0 * NdotV * NdotL + 0.001);

  // Diffuse (Lambertian)
  vec3 kD = (1.0 - F) * (1.0 - metalness);
  vec3 diffuse = kD * albedo / PI;

  return (diffuse + specular) * NdotL;
}
```

### IBL Integration
```glsl
vec3 iblShading(
  vec3 albedo,
  float metalness,
  float roughness,
  vec3 N, vec3 V
) {
  // Diffuse IBL (辐照度图)
  vec3 irradiance = texture(uIrradianceMap, N).rgb;
  vec3 diffuse = irradiance * albedo;

  // Specular IBL (预过滤环境图 + BRDF LUT)
  vec3 R = reflect(-V, N);
  float NdotV = max(dot(N, V), 0.0);

  vec3 prefilteredColor = textureLod(
    uPrefilterMap,
    R,
    roughness * MAX_REFLECTION_LOD
  ).rgb;

  vec2 brdf = texture(uBRDFLUT, vec2(NdotV, roughness)).rg;
  vec3 F0 = mix(vec3(0.04), albedo, metalness);
  vec3 specular = prefilteredColor * (F0 * brdf.x + brdf.y);

  // 组合
  vec3 kD = (1.0 - F0) * (1.0 - metalness);
  return kD * diffuse + specular;
}
```

## 4. Shader Design Framework

### Vertex Shader
```glsl
#version 300 es
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
    vWorldPos = (uModel * vec4(aPosition, 1.0)).xyz;
    vNormal = mat3(uModel) * aNormal;
    vTexCoord = aTexCoord;

    // 计算TBN矩阵（用于法线贴图）
    vec3 T = normalize(mat3(uModel) * aTangent);
    vec3 N = normalize(vNormal);
    vec3 B = cross(N, T);
    vTBN = mat3(T, B, N);

    gl_Position = uProjection * uView * vec4(vWorldPos, 1.0);
}
```

### Fragment Shader
```glsl
#version 300 es
precision mediump float;

in vec3 vWorldPos;
in vec3 vNormal;
in vec2 vTexCoord;
in mat3 vTBN;

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

// 光源
uniform vec3 uLightPositions[4];
uniform vec3 uLightColors[4];
uniform vec3 uCameraPos;

out vec4 fragColor;

void main() {
    // 采样纹理
    vec3 albedo = texture(uAlbedoMap, vTexCoord).rgb;
    float metalness = texture(uMetalnessMap, vTexCoord).r;
    float roughness = texture(uRoughnessMap, vTexCoord).r;
    float ao = texture(uAOMap, vTexCoord).r;

    // 法线贴图
    vec3 normalMap = texture(uNormalMap, vTexCoord).rgb * 2.0 - 1.0;
    vec3 N = normalize(vTBN * normalMap);

    vec3 V = normalize(uCameraPos - vWorldPos);

    // 直接光照
    vec3 Lo = vec3(0.0);
    for(int i = 0; i < 4; i++) {
        vec3 L = normalize(uLightPositions[i] - vWorldPos);
        Lo += pbrShading(albedo, metalness, roughness, N, V, L)
              * uLightColors[i];
    }

    // 环境光照（IBL）
    vec3 ambient = iblShading(albedo, metalness, roughness, N, V) * ao;

    vec3 color = ambient + Lo;

    // Gamma校正
    color = pow(color, vec3(1.0/2.2));

    fragColor = vec4(color, 1.0);
}
```

## 5. Material Library Design

### Preset Materials
```typescript
const MaterialPresets = {
  gold: {
    albedo: [1.0, 0.766, 0.336],
    metalness: 1.0,
    roughness: 0.2
  },
  silver: {
    albedo: [0.972, 0.960, 0.915],
    metalness: 1.0,
    roughness: 0.1
  },
  copper: {
    albedo: [0.955, 0.638, 0.538],
    metalness: 1.0,
    roughness: 0.3
  },
  plastic: {
    albedo: [0.8, 0.1, 0.1],
    metalness: 0.0,
    roughness: 0.5
  },
  wood: {
    albedo: [0.6, 0.4, 0.2],
    metalness: 0.0,
    roughness: 0.8,
    normalScale: 1.5
  },
  rubber: {
    albedo: [0.1, 0.1, 0.1],
    metalness: 0.0,
    roughness: 0.9
  }
}
```

## 6. Constitutional Compliance

✅ **线性空间光照**: 所有光照计算在线性空间
✅ **Gamma校正**: sRGB纹理读取时自动转换，输出时应用Gamma
✅ **Uniform Block**: 使用std140布局，16字节对齐
✅ **纹理坐标**: 左下角为原点
✅ **资源管理**: 所有纹理通过runner.track()管理

## 7. Implementation Steps

### Phase 1: Basic PBR
1. 创建 `types.ts` - 定义接口
2. 创建 `PBRMaterial.ts` - 基础材质类
3. 实现PBR着色器（无IBL）
4. 测试金属/非金属材质

### Phase 2: Texture Support
5. 添加纹理加载（Albedo, Metalness, Roughness）
6. 添加法线贴图支持
7. 添加AO贴图支持

### Phase 3: IBL Integration
8. 创建 `IBLLoader.ts` - IBL贴图生成
9. 实现辐照度卷积
10. 实现镜面预过滤
11. 生成BRDF LUT

### Phase 4: Material Library
12. 创建 `MaterialLibrary.ts` - 材质库
13. 添加预设材质（金属、木材、塑料等）
14. 创建材质展示Demo

### Phase 5: Advanced Features
15. 添加多光源支持
16. 添加阴影支持（集成ShadowMap）
17. 优化性能（材质批处理）
