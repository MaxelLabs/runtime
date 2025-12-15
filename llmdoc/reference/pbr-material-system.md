# PBR材质系统参考

## 1. 概述

PBR（Physically Based Rendering）材质系统是基于物理的渲染实现，采用 Cook-Torrance BRDF 模型，支持金属度/粗糙度工作流和基于图像的光照（IBL）。

## 2. 核心特性

### 2.1 Cook-Torrance BRDF
```glsl
// 核心BRDF计算
vec3 calculateBRDF(vec3 albedo, float metalness, float roughness,
                   vec3 N, vec3 V, vec3 L) {
    vec3 H = normalize(V + L);

    // Fresnel (Schlick近似)
    vec3 F0 = mix(vec3(0.04), albedo, metalness);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - dot(H, V), 5.0);

    // Normal Distribution (GGX/Trowbridge-Reitz)
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NDF = a2 / (PI * pow(NdotH * NdotH * (a2 - 1.0) + 1.0, 2.0));

    // Geometry (Smith's method)
    float k = pow(roughness + 1.0, 2.0) / 8.0;
    float G = geometrySchlickGGX(NdotV, k) * geometrySchlickGGX(NdotL, k);

    // Cook-Torrance BRDF
    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * NdotV * NdotL + 0.001;
    vec3 specular = numerator / denominator;

    // 能量守恒
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metalness;

    vec3 diffuse = kD * albedo / PI;

    return (diffuse + specular) * NdotL;
}
```

### 2.2 IBL（基于图像的光照）
```glsl
// 环境光照计算
vec3 calculateIBL(vec3 albedo, float metalness, float roughness,
                   vec3 N, vec3 V, vec3 R) {
    // 漫反射IBL
    vec3 F = calculateFresnelRoughness(max(dot(N, V), 0.0), roughness, F0);
    vec3 kS = F;
    vec3 kD = 1.0 - kS;
    kD *= 1.0 - metalness;

    vec3 irradiance = texture(uIrradianceMap, N).rgb;
    vec3 diffuseIBL = irradiance * albedo;

    // 镜面IBL
    const float MAX_REFLECTION_LOD = 4.0;
    vec3 prefilteredColor = textureLod(uPrefilterMap, R,
                                      roughness * MAX_REFLECTION_LOD).rgb;
    vec2 brdf = texture(uBRDFLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;
    vec3 specularIBL = prefilteredColor * (F * brdf.x + brdf.y);

    return kD * diffuseIBL + specularIBL;
}
```

## 3. API参考

### 3.1 PBRMaterial类

```typescript
class PBRMaterial {
    constructor(
        rhi: RHIDevice,
        config?: PBRMaterialConfig
    );

    // 设置材质属性
    setAlbedo(value: Vec3 | Texture): void;
    setMetalness(value: number | Texture): void;
    setRoughness(value: number | Texture): void;
    setNormalMap(texture: Texture): void;
    setAOMap(texture: Texture): void;

    // 设置环境映射
    setEnvironmentMaps(
        irradiance: Texture,
        prefilter: Texture,
        brdfLUT: Texture
    ): void;

    // 渲染方法
    render(
        cmdBuf: CommandBuffer,
        geometry: Geometry,
        transform: Mat4,
        camera: Camera,
        lights: Light[]
    ): void;

    // 资源管理
    dispose(): void;
}
```

### 3.2 配置接口

```typescript
interface PBRMaterialConfig {
    // 基础属性
    albedo?: Vec3 | string;           // 颜色或纹理路径
    metalness?: number | string;      // 0.0 - 1.0
    roughness?: number | string;      // 0.0 - 1.0
    normalMap?: string;               // 法线贴图路径
    aoMap?: string;                   // AO贴图路径

    // 环境映射
    enableIBL?: boolean;              // 是否启用IBL
    irradianceMap?: string;           // 辐射度图路径
    prefilterMap?: string;            // 预过滤图路径
    brdfLUT?: string;                 // BRDF LUT路径

    // 渲染选项
    alphaMode?: 'opaque' | 'mask' | 'blend';
    alphaCutoff?: number;
    doubleSided?: boolean;
}
```

### 3.3 MaterialLibrary类

```typescript
class MaterialLibrary {
    constructor(rhi: RHIDevice);

    // 预设材质
    presets: {
        gold: PBRMaterial;
        silver: PBRMaterial;
        copper: PBRMaterial;
        iron: PBRMaterial;
        plastic: PBRMaterial;
        rubber: PBRMaterial;
        wood: PBRMaterial;
        stone: PBRMaterial;
    };

    // 创建材质
    createMaterial(config: PBRMaterialConfig): PBRMaterial;

    // 加载材质
    async loadMaterial(path: string): Promise<PBRMaterial>;

    // 保存材质
    async saveMaterial(material: PBRMaterial, path: string): Promise<void>;

    // 获取所有材质
    getMaterials(): PBRMaterial[];

    // 清理资源
    dispose(): void;
}
```

## 4. 使用示例

### 4.1 基础使用

```typescript
import { PBRMaterial } from './utils/material/pbr';
import { MaterialLibrary } from './utils/material/pbr';

// 创建RHI设备
const rhi = new WebGLDevice(canvas);

// 创建材质库
const materialLibrary = new MaterialLibrary(rhi);

// 使用预设材质
const goldMaterial = materialLibrary.presets.gold;

// 创建自定义材质
const customMaterial = materialLibrary.createMaterial({
    albedo: [0.8, 0.2, 0.2],
    metalness: 0.0,
    roughness: 0.5,
    normalMap: 'textures/normal.png',
    enableIBL: true
});

// 渲染
function render() {
    // 设置光照
    const lights = [
        {
            position: [10, 10, 10],
            color: [1, 1, 1],
            intensity: 1.0
        }
    ];

    // 渲染物体
    customMaterial.render(
        commandBuffer,
        geometry,
        transform,
        camera,
        lights
    );
}
```

### 4.2 环境映射设置

```typescript
import { IBLLoader } from './utils/material/pbr';

// 加载天空盒
const skyboxTexture = await loadCubemap('textures/skybox/');

// 生成IBL贴图
const iblLoader = new IBLLoader(rhi);
const iblMaps = await iblLoader.generateFromCubemap(skyboxTexture);

// 设置到材质
material.setEnvironmentMaps(
    iblMaps.irradiance,
    iblMaps.prefilter,
    iblMaps.brdfLUT
);
```

### 4.3 动画材质属性

```typescript
// 动画金属度
let metalness = 0.0;
function animate(time) {
    metalness = (Math.sin(time) + 1.0) * 0.5;
    material.setMetalness(metalness);

    // 渲染场景
    render();
}
```

## 5. 性能优化

### 5.1 纹理压缩
```typescript
// 使用压缩纹理格式
const material = materialLibrary.createMaterial({
    albedo: 'textures/albedo.ktx2',    // KTX2压缩格式
    normalMap: 'textures/normal.bc3',  // BC3压缩
    metalness: 'textures/metallic.bc4', // BC4压缩
    roughness: 'textures/roughness.bc4' // BC4压缩
});
```

### 5.2 批量渲染
```typescript
// 相同材质的物体可以批量渲染
const instances = [];
for (let i = 0; i < 100; i++) {
    instances.push({
        transform: createTransform(i),
        material: material
    });
}

// 使用instanced rendering
renderInstanced(instances, material);
```

### 5.3 LOD系统
```typescript
// 根据距离使用不同质量的材质
function selectMaterial(distance: number): PBRMaterial {
    if (distance < 50) {
        return highQualityMaterial;  // 完整PBR
    } else if (distance < 200) {
        return mediumQualityMaterial; // 简化IBL
    } else {
        return lowQualityMaterial;    // 仅漫反射
    }
}
```

## 6. 故障排除

### 6.1 常见问题

**问题**: 材质显示为黑色
- **原因**: 光照设置不正确或法线异常
- **解决**: 检查光源方向和法线贴图

**问题**: IBL效果不明显
- **原因**: 环境贴图未正确加载或设置
- **解决**: 验证IBL贴图格式和绑定

**问题**: 性能问题
- **原因**: 过多的材质切换或纹理采样
- **解决**: 实现材质排序和纹理数组

### 6.2 调试工具

```typescript
// 调试模式
material.setDebugMode({
    showAlbedo: false,
    showNormal: false,
    showMetalness: false,
    showRoughness: false,
    showIBL: true
});
```

## 7. 最佳实践

### 7.1 工作流建议
1. **纹理制作**: 使用线性空间保存纹理
2. **法线贴图**: 确保切线空间正确
3. **环境光**: 使用高质量的HDR环境贴图
4. **性能测试**: 在目标设备上测试性能

### 7.2 优化建议
1. **材质合并**: 相似材质使用参数化
2. **纹理图集**: 小纹理合并为大纹理
3. **实例化渲染**: 相同材质物体批量渲染
4. **预计算**: 离线生成IBL贴图

## 8. 扩展功能

### 8.1 次表面散射
```typescript
// 支持SSS材质
interface SSSConfig {
    thickness?: Texture;
    scatteringColor?: Vec3;
    scatteringDistance?: number;
}
```

### 8.2 清漆层
```typescript
// 双层材质支持
interface ClearcoatConfig {
    factor: number;
    roughness: number;
    normalMap?: Texture;
}
```

### 8.3 各向异性
```typescript
// 各向异性反射
interface AnisotropyConfig {
    direction: Vec2;
    factor: number;
}
```

## 9. 参考资源

### 9.1 理论基础
- [Physically Based Rendering, Third Edition](http://www.pbr-book.org/)
- [Real-Time Rendering, Fourth Edition](https://www.realtimerendering.com/)
- [Microfacet Models for Refraction](https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf)

### 9.2 实现参考
- [Disney Principled BRDF](https://disney-animation.s3.amazonaws.com/library/s2012_pbs_disney_brdf_notes.pdf)
- [Filament PBR Implementation](https://google.github.io/filament/Filament.md.html#materialsystem/pbrmodel)
- [Unreal Engine PBR](https://docs.unrealengine.com/en-US/Engine/Rendering/Materials/PhysicallyBased/)

## 10. 版本历史

- **v1.0.0** - 基础PBR实现
- **v1.1.0** - 添加IBL支持
- **v1.2.0** - 材质库和预设
- **v1.3.0** - 性能优化和批处理
- **v1.4.0** - 扩展材质属性（清漆、SSS等）