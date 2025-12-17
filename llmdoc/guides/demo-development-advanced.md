---
title: Demo Development Advanced
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: demo
tags: ['guide', 'llm-native', 'demo', 'demo-developers', 'interface-first', 'code-examples', 'step-by-step']
target_audience: demo-developers
complexity: advanced
estimated_time: f"121 分钟"
last_updated: 2025-12-17
llm_native_compliance: true
version: 1.0.0
---


## 🎯 Context & Goal

### Context
本文档属于**demo**类型的开发指南，面向**demo-developers**。

### Goal
帮助开发者快速理解和掌握相关概念、工具和最佳实践，提高开发效率和代码质量。

### Prerequisites
- 基础的编程知识
- 了解项目架构和基本概念
- 相关领域的开发经验

---

# 高级渲染系统开发指南

## 概述

高级渲染系统是RHI Demo系统的第三和第四层，展示了现代3D渲染的核心技术。包括完整的光照系统、基于物理的渲染(PBR)、实时阴影、GPU粒子系统和实例化渲染等高级特性。

## 🌟 光照系统Demo

### 1. Directional Light Demo - 平行光

**目标**: 展示平行光的渲染效果和实现

**技术要点**:
- 平行光的光照模型
- Lambert漫反射和Phong镜面反射
- 光源方向向量计算
- std140 Uniform缓冲区对齐

**核心实现**:
```typescript
class DirectionalLightDemo {
    private lightUniformBuffer: RHIUniformBuffer;
    private lightDirection: MMath.Vector3 = new MMath.Vector3(0.5, -1.0, 0.3).normalize();

    private createLightUniformBuffer(): void {
        const lightData = new Float32Array([
            // vec3 lightDirection (12 bytes) + padding (4 bytes)
            ...this.lightDirection.toArray(), 0,
            // vec3 lightColor (12 bytes) + float lightIntensity (4 bytes)
            1.0, 1.0, 1.0, 1.0,
            // vec3 ambientColor (12 bytes) + padding (4 bytes)
            0.1, 0.1, 0.1, 0
        ]);

        this.lightUniformBuffer = this.device.createBuffer({
            size: lightData.byteLength,
            usage: 'uniform' | 'copy-dst',
            mappedAtCreation: true
        });

        new Float32Array(this.lightUniformBuffer.getMappedRange()).set(lightData);
        this.lightUniformBuffer.unmap();
    }
}
```

**Phong光照着色器核心**:
```glsl
// 计算光照
vec3 lightDir = normalize(-uLightDirection);
float diff = max(dot(vNormal, lightDir), 0.0);
vec3 diffuse = diff * uLightColor * uLightIntensity;

// 镜面反射
vec3 viewDir = normalize(uViewPosition - vPosition);
vec3 reflectDir = reflect(-lightDir, vNormal);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
vec3 specular = spec * uLightColor * uLightIntensity;
```

### 2. Point Lights Demo - 多点光源

**目标**: 展示多个点光源的渲染效果

**技术要点**:
- 点光源的距离衰减
- 多光源累加计算
- 208字节Uniform缓冲区管理
- 动态光源开关控制

**关键实现**:
```typescript
interface PointLight {
    position: MMath.Vector3;
    color: MMath.Vector3;
    intensity: number;
    radius: number;
    enabled: boolean;
}

// std140对齐：每个光源52字节，4个光源共208字节
const lightData = new Float32Array(52);
```

**点光源衰减着色器**:
```glsl
float attenuation = max(1.0 - distance / light.radius, 0.0);
attenuation = attenuation * attenuation; // 二次衰减
vec3 diffuse = diff * light.color * light.intensity * attenuation;
```

## 🎨 PBR材质系统

### PBR Material Demo - 物理基础渲染

**目标**: 展示基于物理的渲染效果

**技术要点**:
- Cook-Torrance BRDF模型
- 金属度/粗糙度工作流
- 环境光照(IBL)
- 线性空间渲染

**PBR材质实现**:
```typescript
class PBRMaterial {
    private albedoTexture: RHITexture2D;
    private normalTexture: RHITexture2D;
    private metallicRoughnessTexture: RHITexture2D;
    private aoTexture: RHITexture2D;
    private materialUniform: RHIUniformBuffer;

    private createMaterialUniform(): void {
        const materialData = new Float32Array([
            // vec3 albedo (12 bytes) + float metallic (4 bytes)
            1.0, 1.0, 1.0, 0.0,
            // float roughness (4 bytes) + float ao (4 bytes) + padding (8 bytes)
            0.5, 1.0, 0.0, 0.0
        ]);
    }
}
```

**PBR着色器核心**:
```glsl
// Cook-Torrance BRDF计算
vec3 calculateBRDF(vec3 albedo, float metallic, float roughness, vec3 N, vec3 V, vec3 L) {
    vec3 H = normalize(V + L);
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);

    // 漫反射部分
    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    vec3 kD = (1.0 - F0) * (1.0 - metallic);
    vec3 diffuse = kD * albedo / PI;

    // 镜面反射部分 (GGX + Smith + Schlick)
    float alpha = roughness * roughness;
    float D = alpha2 / (PI * denominator * denominator);
    float G = G1L * G1V;
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - HdotV, 5.0);
    vec3 specular = (D * G * F) / (4.0 * NdotV * NdotL + 0.001);

    return diffuse + specular;
}
```

## 🌑 阴影映射系统

### Shadow Mapping Demo - 实时阴影

**目标**: 展示实时阴影映射技术

**技术要点**:
- 阴影贴图生成和使用
- PCF软阴影滤波
- 光源空间矩阵计算
- 阴影偏移和 acne问题解决

**阴影贴图管理器**:
```typescript
export class ShadowMap {
    public readonly depthTexture: RHITexture2D;
    public readonly depthView: RHITextureView;
    public readonly sampler: RHISampler;

    constructor(device: RHIDevice, resolution: number = 1024) {
        this.depthTexture = device.createTexture({
            size: [resolution, resolution],
            format: 'depth24plus',
            usage: 'texture-binding' | 'render-attachment'
        });

        // PCF比较采样器
        this.sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            compare: 'less'
        });
    }
}
```

**PCF软阴影实现**:
```typescript
export class PCFFilter {
    static getShaderSnippet(options: {
        sampleMode: '1x1' | '2x2' | '3x3' | '5x5';
        bias: number;
    }): string {
        return `
            float calculateShadow(sampler2D shadowMap, vec4 lightSpacePos) {
                vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
                projCoords = projCoords * 0.5 + 0.5;
                float currentDepth = projCoords.z - ${options.bias.toFixed(4)};

                // PCF采样
                float shadow = 0.0;
                for(int i = 0; i < ${this.getSampleCount(options.sampleMode)}; i++) {
                    vec2 offset = getSampleOffset(i, '${options.sampleMode}');
                    float depth = texture(shadowMap, projCoords.xy + offset).r;
                    shadow += (currentDepth > depth) ? 1.0 : 0.0;
                }

                return shadow / ${this.getSampleCount(options.sampleMode)};
            }
        `;
    }
}
```

## 🎆 粒子系统

### Particle System Demo - GPU粒子

**目标**: 展示高性能的GPU粒子系统

**技术要点**:
- GPU实例化渲染粒子
- 粒子生命周期管理
- 发射器和更新器系统
- 10,000+粒子性能优化

**粒子渲染器**:
```typescript
export class ParticleRenderer {
    private instanceBuffer: RHIBuffer;
    private maxParticles: number;

    constructor(device: RHIDevice, maxParticles: number = 10000) {
        // 每个粒子实例包含: position(3) + velocity(3) + life(1) + size(1) = 8 floats
        const instanceDataSize = maxParticles * 8 * 4;
        this.instanceBuffer = device.createBuffer({
            size: instanceDataSize,
            usage: 'vertex' | 'copy-dst'
        });
    }

    updateParticles(particles: ParticleData[]): void {
        const instanceData = new Float32Array(this.particleCount * 8);
        // 准备实例数据并更新缓冲区
        this.device.queue.writeBuffer(this.instanceBuffer, 0, instanceData);
    }
}
```

**粒子着色器**:
```glsl
#version 300 es
in vec3 aInstancePosition;
in vec3 aInstanceVelocity;
in float aInstanceLife;
in float aInstanceSize;

void main() {
    vLife = aInstanceLife;

    // Billboard变换
    vec3 particlePos = aInstancePosition;
    vec3 cameraRight = normalize(cross(vec3(0.0, 1.0, 0.0), uCameraPosition - particlePos));
    vec3 cameraUp = cross(cameraRight, uCameraPosition - particlePos);

    float size = aInstanceSize * mix(0.5, 1.0, aInstanceLife);
    vec3 offset = aPosition.x * cameraRight * size + aPosition.y * cameraUp * size;
    vec3 worldPos = particlePos + offset;

    gl_Position = uViewProjection * vec4(worldPos, 1.0);
    vTexCoord = aPosition * 0.5 + 0.5;
}
```

## 🏗️ 实例化渲染

### Instanced Rendering Demo - GPU实例化

**目标**: 展示高效的实例化渲染技术

**技术要点**:
- Per-Instance Attributes
- Vertex Buffer Divisor
- 单次Draw Call渲染大量对象
- 内存优化和性能提升

**实例化渲染器**:
```typescript
export class InstancedRenderer {
    private instanceBuffer: RHIBuffer;
    private maxInstances: number;

    constructor(device: RHIDevice, geometry: GeometryData, maxInstances: number = 10000) {
        // 每个实例包含：变换矩阵(16) + 颜色(4) = 20 floats
        const instanceDataSize = maxInstances * 20 * 4;
        this.instanceBuffer = device.createBuffer({
            size: instanceDataSize,
            usage: 'vertex' | 'copy-dst'
        });
    }

    createPipeline(): RHIRenderPipeline {
        return this.device.createRenderPipeline({
            vertex: {
                buffers: [
                    // 几何体顶点缓冲区
                    { arrayStride: this.geometry.vertexStride },
                    // 实例数据缓冲区
                    {
                        arrayStride: 20 * 4,
                        stepMode: 'instance',
                        attributes: [
                            { shaderLocation: 3, offset: 0, format: 'float32x4' },
                            { shaderLocation: 4, offset: 16, format: 'float32x4' },
                            { shaderLocation: 5, offset: 32, format: 'float32x4' },
                            { shaderLocation: 6, offset: 48, format: 'float32x4' },
                            { shaderLocation: 7, offset: 64, format: 'float32x4' }
                        ]
                    }
                ]
            }
        });
    }
}
```

## 🎬 后处理系统

### Post-Processing Demo - 后处理效果

**目标**: 展示各种后处理渲染效果

**技术要点**:
- 渲染到纹理(RTT)
- 多通道渲染
- 屏幕空间效果
- 效果链组合

**后处理管理器**:
```typescript
export class PostProcessManager {
    private renderTargets: RHITexture2D[] = [];
    private pipelines: Map<string, RHIRenderPipeline> = new Map();

    constructor(device: RHIDevice, width: number, height: number) {
        // 创建多个渲染目标用于效果链
        for (let i = 0; i < 2; i++) {
            const texture = device.createTexture({
                size: [width, height],
                format: 'rgba16float',
                usage: 'texture-binding' | 'render-attachment'
            });
            this.renderTargets.push(texture);
        }
    }

    applyEffect(effectName: string, inputTexture: RHITexture2D, outputTexture: RHITexture2D): void {
        // 渲染全屏四边形应用效果
        const pipeline = this.pipelines.get(effectName);
        // 设置渲染通道并执行效果
    }
}
```

## 🔧 性能优化技巧

### 1. 批处理优化

```typescript
// 按材质分组渲染
const renderGroups = new Map<string, RenderObject[]>();
objects.forEach(obj => {
    const key = obj.material.id;
    if (!renderGroups.has(key)) {
        renderGroups.set(key, []);
    }
    renderGroups.get(key)!.push(obj);
});

// 批量渲染相同材质的对象
for (const [materialId, group] of renderGroups) {
    if (group.length > INSTANCING_THRESHOLD) {
        renderInstanced(group, material);
    } else {
        group.forEach(obj => renderSingle(obj, material));
    }
}
```

### 2. 自适应质量

```typescript
class AdaptiveQuality {
    private targetFrameTime = 16.67; // 60 FPS
    private currentQuality = 1.0;

    adjustQuality(frameTime: number): void {
        if (frameTime > this.targetFrameTime * 1.2) {
            this.currentQuality = Math.max(0.5, this.currentQuality * 0.9);
        } else if (frameTime < this.targetFrameTime * 0.8) {
            this.currentQuality = Math.min(1.0, this.currentQuality * 1.05);
        }
        this.applyQualitySettings();
    }
}
```

## 📊 性能指标

### 高级渲染性能基准

| 技术 | 对象数量 | FPS | GPU内存 | 关键优化 |
|------|----------|-----|---------|----------|
| PBR材质 | 1000 | 60 | 200MB | 纹理压缩 |
| 阴影映射 | 500 | 60 | 150MB | PCF 3x3 |
| 粒子系统 | 10,000 | 60 | 100MB | GPU实例化 |
| 实例化渲染 | 10,000 | 60 | 50MB | 单次Draw Call |
| 后处理 | Fullscreen | 60 | 80MB | HDR格式 |

## 🔗 相关资源

### 技术文档
- [PBR材质系统](../reference/pbr-material-system.md) - 完整PBR实现
- [阴影工具](../reference/shadow-tools.md) - 阴影系统工具
- [粒子系统](../reference/particle-system.md) - GPU粒子系统
- [实例化工具](../reference/instancing-tools.md) - 实例化渲染工具

### 学习资源
- [Physically Based Rendering](https://pbr-book.org/) - PBR理论
- [Real-Time Rendering](https://www.realtimerendering.com/) - 实时渲染技术
- [Learn OpenGL Advanced](https://learnopengl.com/Advanced-OpenGL) - 高级OpenGL技术

### 下一步学习
- [WebGPU开发指南](../guides/webgpu-development.md) - 下一代图形API
- [性能优化示例](../reference/api-v2/examples/performance-optimization.md) - 性能优化最佳实践

---

**注意**: 高级渲染系统涉及复杂的数学计算和GPU编程，建议在掌握基础渲染和纹理系统后再学习本部分内容。同时要注意性能与质量的平衡，根据目标平台选择合适的技术方案。
## 🔌 Interface First

### 核心接口定义
#### DirectionalLightDemo
```typescript
// 接口定义和用法
```

#### PBRMaterial
```typescript
// 接口定义和用法
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

# 高级渲染系统开发指南

## 概述

高级渲染系统是RHI Demo系统的第三和第四层，展示了现代3D渲染的核心技术。包括完整的光照系统、基于物理的渲染(PBR)、实时阴影、GPU粒子系统和实例化渲染等高级特性。

## 🌟 光照系统Demo

### 1. Directional Light Demo - 平行光

**目标**: 展示平行光的渲染效果和实现

**技术要点**:
- 平行光的光照模型
- Lambert漫反射和Phong镜面反射
- 光源方向向量计算
- std140 Uniform缓冲区对齐

**核心实现**:
```typescript
class DirectionalLightDemo {
    private lightUniformBuffer: RHIUniformBuffer;
    private lightDirection: MMath.Vector3 = new MMath.Vector3(0.5, -1.0, 0.3).normalize();

    private createLightUniformBuffer(): void {
        const lightData = new Float32Array([
            // vec3 lightDirection (12 bytes) + padding (4 bytes)
            ...this.lightDirection.toArray(), 0,
            // vec3 lightColor (12 bytes) + float lightIntensity (4 bytes)
            1.0, 1.0, 1.0, 1.0,
            // vec3 ambientColor (12 bytes) + padding (4 bytes)
            0.1, 0.1, 0.1, 0
        ]);

        this.lightUniformBuffer = this.device.createBuffer({
            size: lightData.byteLength,
            usage: 'uniform' | 'copy-dst',
            mappedAtCreation: true
        });

        new Float32Array(this.lightUniformBuffer.getMappedRange()).set(lightData);
        this.lightUniformBuffer.unmap();
    }
}
```

**Phong光照着色器核心**:
```glsl
// 计算光照
vec3 lightDir = normalize(-uLightDirection);
float diff = max(dot(vNormal, lightDir), 0.0);
vec3 diffuse = diff * uLightColor * uLightIntensity;

// 镜面反射
vec3 viewDir = normalize(uViewPosition - vPosition);
vec3 reflectDir = reflect(-lightDir, vNormal);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
vec3 specular = spec * uLightColor * uLightIntensity;
```

### 2. Point Lights Demo - 多点光源

**目标**: 展示多个点光源的渲染效果

**技术要点**:
- 点光源的距离衰减
- 多光源累加计算
- 208字节Uniform缓冲区管理
- 动态光源开关控制

**关键实现**:
```typescript
interface PointLight {
    position: MMath.Vector3;
    color: MMath.Vector3;
    intensity: number;
    radius: number;
    enabled: boolean;
}

// std140对齐：每个光源52字节，4个光源共208字节
const lightData = new Float32Array(52);
```

**点光源衰减着色器**:
```glsl
float attenuation = max(1.0 - distance / light.radius, 0.0);
attenuation = attenuation * attenuation; // 二次衰减
vec3 diffuse = diff * light.color * light.intensity * attenuation;
```

## 🎨 PBR材质系统

### PBR Material Demo - 物理基础渲染

**目标**: 展示基于物理的渲染效果

**技术要点**:
- Cook-Torrance BRDF模型
- 金属度/粗糙度工作流
- 环境光照(IBL)
- 线性空间渲染

**PBR材质实现**:
```typescript
class PBRMaterial {
    private albedoTexture: RHITexture2D;
    private normalTexture: RHITexture2D;
    private metallicRoughnessTexture: RHITexture2D;
    private aoTexture: RHITexture2D;
    private materialUniform: RHIUniformBuffer;

    private createMaterialUniform(): void {
        const materialData = new Float32Array([
            // vec3 albedo (12 bytes) + float metallic (4 bytes)
            1.0, 1.0, 1.0, 0.0,
            // float roughness (4 bytes) + float ao (4 bytes) + padding (8 bytes)
            0.5, 1.0, 0.0, 0.0
        ]);
    }
}
```

**PBR着色器核心**:
```glsl
// Cook-Torrance BRDF计算
vec3 calculateBRDF(vec3 albedo, float metallic, float roughness, vec3 N, vec3 V, vec3 L) {
    vec3 H = normalize(V + L);
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);

    // 漫反射部分
    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    vec3 kD = (1.0 - F0) * (1.0 - metallic);
    vec3 diffuse = kD * albedo / PI;

    // 镜面反射部分 (GGX + Smith + Schlick)
    float alpha = roughness * roughness;
    float D = alpha2 / (PI * denominator * denominator);
    float G = G1L * G1V;
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - HdotV, 5.0);
    vec3 specular = (D * G * F) / (4.0 * NdotV * NdotL + 0.001);

    return diffuse + specular;
}
```

## 🌑 阴影映射系统

### Shadow Mapping Demo - 实时阴影

**目标**: 展示实时阴影映射技术

**技术要点**:
- 阴影贴图生成和使用
- PCF软阴影滤波
- 光源空间矩阵计算
- 阴影偏移和 acne问题解决

**阴影贴图管理器**:
```typescript
export class ShadowMap {
    public readonly depthTexture: RHITexture2D;
    public readonly depthView: RHITextureView;
    public readonly sampler: RHISampler;

    constructor(device: RHIDevice, resolution: number = 1024) {
        this.depthTexture = device.createTexture({
            size: [resolution, resolution],
            format: 'depth24plus',
            usage: 'texture-binding' | 'render-attachment'
        });

        // PCF比较采样器
        this.sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            compare: 'less'
        });
    }
}
```

**PCF软阴影实现**:
```typescript
export class PCFFilter {
    static getShaderSnippet(options: {
        sampleMode: '1x1' | '2x2' | '3x3' | '5x5';
        bias: number;
    }): string {
        return `
            float calculateShadow(sampler2D shadowMap, vec4 lightSpacePos) {
                vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
                projCoords = projCoords * 0.5 + 0.5;
                float currentDepth = projCoords.z - ${options.bias.toFixed(4)};

                // PCF采样
                float shadow = 0.0;
                for(int i = 0; i < ${this.getSampleCount(options.sampleMode)}; i++) {
                    vec2 offset = getSampleOffset(i, '${options.sampleMode}');
                    float depth = texture(shadowMap, projCoords.xy + offset).r;
                    shadow += (currentDepth > depth) ? 1.0 : 0.0;
                }

                return shadow / ${this.getSampleCount(options.sampleMode)};
            }
        `;
    }
}
```

## 🎆 粒子系统

### Particle System Demo - GPU粒子

**目标**: 展示高性能的GPU粒子系统

**技术要点**:
- GPU实例化渲染粒子
- 粒子生命周期管理
- 发射器和更新器系统
- 10,000+粒子性能优化

**粒子渲染器**:
```typescript
export class ParticleRenderer {
    private instanceBuffer: RHIBuffer;
    private maxParticles: number;

    constructor(device: RHIDevice, maxParticles: number = 10000) {
        // 每个粒子实例包含: position(3) + velocity(3) + life(1) + size(1) = 8 floats
        const instanceDataSize = maxParticles * 8 * 4;
        this.instanceBuffer = device.createBuffer({
            size: instanceDataSize,
            usage: 'vertex' | 'copy-dst'
        });
    }

    updateParticles(particles: ParticleData[]): void {
        const instanceData = new Float32Array(this.particleCount * 8);
        // 准备实例数据并更新缓冲区
        this.device.queue.writeBuffer(this.instanceBuffer, 0, instanceData);
    }
}
```

**粒子着色器**:
```glsl
#version 300 es
in vec3 aInstancePosition;
in vec3 aInstanceVelocity;
in float aInstanceLife;
in float aInstanceSize;

void main() {
    vLife = aInstanceLife;

    // Billboard变换
    vec3 particlePos = aInstancePosition;
    vec3 cameraRight = normalize(cross(vec3(0.0, 1.0, 0.0), uCameraPosition - particlePos));
    vec3 cameraUp = cross(cameraRight, uCameraPosition - particlePos);

    float size = aInstanceSize * mix(0.5, 1.0, aInstanceLife);
    vec3 offset = aPosition.x * cameraRight * size + aPosition.y * cameraUp * size;
    vec3 worldPos = particlePos + offset;

    gl_Position = uViewProjection * vec4(worldPos, 1.0);
    vTexCoord = aPosition * 0.5 + 0.5;
}
```

## 🏗️ 实例化渲染

### Instanced Rendering Demo - GPU实例化

**目标**: 展示高效的实例化渲染技术

**技术要点**:
- Per-Instance Attributes
- Vertex Buffer Divisor
- 单次Draw Call渲染大量对象
- 内存优化和性能提升

**实例化渲染器**:
```typescript
export class InstancedRenderer {
    private instanceBuffer: RHIBuffer;
    private maxInstances: number;

    constructor(device: RHIDevice, geometry: GeometryData, maxInstances: number = 10000) {
        // 每个实例包含：变换矩阵(16) + 颜色(4) = 20 floats
        const instanceDataSize = maxInstances * 20 * 4;
        this.instanceBuffer = device.createBuffer({
            size: instanceDataSize,
            usage: 'vertex' | 'copy-dst'
        });
    }

    createPipeline(): RHIRenderPipeline {
        return this.device.createRenderPipeline({
            vertex: {
                buffers: [
                    // 几何体顶点缓冲区
                    { arrayStride: this.geometry.vertexStride },
                    // 实例数据缓冲区
                    {
                        arrayStride: 20 * 4,
                        stepMode: 'instance',
                        attributes: [
                            { shaderLocation: 3, offset: 0, format: 'float32x4' },
                            { shaderLocation: 4, offset: 16, format: 'float32x4' },
                            { shaderLocation: 5, offset: 32, format: 'float32x4' },
                            { shaderLocation: 6, offset: 48, format: 'float32x4' },
                            { shaderLocation: 7, offset: 64, format: 'float32x4' }
                        ]
                    }
                ]
            }
        });
    }
}
```

## 🎬 后处理系统

### Post-Processing Demo - 后处理效果

**目标**: 展示各种后处理渲染效果

**技术要点**:
- 渲染到纹理(RTT)
- 多通道渲染
- 屏幕空间效果
- 效果链组合

**后处理管理器**:
```typescript
export class PostProcessManager {
    private renderTargets: RHITexture2D[] = [];
    private pipelines: Map<string, RHIRenderPipeline> = new Map();

    constructor(device: RHIDevice, width: number, height: number) {
        // 创建多个渲染目标用于效果链
        for (let i = 0; i < 2; i++) {
            const texture = device.createTexture({
                size: [width, height],
                format: 'rgba16float',
                usage: 'texture-binding' | 'render-attachment'
            });
            this.renderTargets.push(texture);
        }
    }

    applyEffect(effectName: string, inputTexture: RHITexture2D, outputTexture: RHITexture2D): void {
        // 渲染全屏四边形应用效果
        const pipeline = this.pipelines.get(effectName);
        // 设置渲染通道并执行效果
    }
}
```

## 🔧 性能优化技巧

### 1. 批处理优化

```typescript
// 按材质分组渲染
const renderGroups = new Map<string, RenderObject[]>();
objects.forEach(obj => {
    const key = obj.material.id;
    if (!renderGroups.has(key)) {
        renderGroups.set(key, []);
    }
    renderGroups.get(key)!.push(obj);
});

// 批量渲染相同材质的对象
for (const [materialId, group] of renderGroups) {
    if (group.length > INSTANCING_THRESHOLD) {
        renderInstanced(group, material);
    } else {
        group.forEach(obj => renderSingle(obj, material));
    }
}
```

### 2. 自适应质量

```typescript
class AdaptiveQuality {
    private targetFrameTime = 16.67; // 60 FPS
    private currentQuality = 1.0;

    adjustQuality(frameTime: number): void {
        if (frameTime > this.targetFrameTime * 1.2) {
            this.currentQuality = Math.max(0.5, this.currentQuality * 0.9);
        } else if (frameTime < this.targetFrameTime * 0.8) {
            this.currentQuality = Math.min(1.0, this.currentQuality * 1.05);
        }
        this.applyQualitySettings();
    }
}
```

## 📊 性能指标

### 高级渲染性能基准

| 技术 | 对象数量 | FPS | GPU内存 | 关键优化 |
|------|----------|-----|---------|----------|
| PBR材质 | 1000 | 60 | 200MB | 纹理压缩 |
| 阴影映射 | 500 | 60 | 150MB | PCF 3x3 |
| 粒子系统 | 10,000 | 60 | 100MB | GPU实例化 |
| 实例化渲染 | 10,000 | 60 | 50MB | 单次Draw Call |
| 后处理 | Fullscreen | 60 | 80MB | HDR格式 |

## 🔗 相关资源

### 技术文档
- [PBR材质系统](../reference/pbr-material-system.md) - 完整PBR实现
- [阴影工具](../reference/shadow-tools.md) - 阴影系统工具
- [粒子系统](../reference/particle-system.md) - GPU粒子系统
- [实例化工具](../reference/instancing-tools.md) - 实例化渲染工具

### 学习资源
- [Physically Based Rendering](https://pbr-book.org/) - PBR理论
- [Real-Time Rendering](https://www.realtimerendering.com/) - 实时渲染技术
- [Learn OpenGL Advanced](https://learnopengl.com/Advanced-OpenGL) - 高级OpenGL技术

### 下一步学习
- [WebGPU开发指南](../guides/webgpu-development.md) - 下一代图形API
- [性能优化示例](../reference/api-v2/examples/performance-optimization.md) - 性能优化最佳实践

---

**注意**: 高级渲染系统涉及复杂的数学计算和GPU编程，建议在掌握基础渲染和纹理系统后再学习本部分内容。同时要注意性能与质量的平衡，根据目标平台选择合适的技术方案。
## ⚠️ 禁止事项

### 关键约束
- 🚫 **避免硬编码路径**: 使用相对路径或配置文件
- 🚫 **忽略资源清理**: 确保所有资源得到正确释放
- 🚫 **缺少错误处理**: 提供清晰的错误信息和恢复机制

### 常见错误
- ❌ 忽略错误处理和异常情况
- ❌ 缺少必要的性能优化
- ❌ 不遵循项目的编码规范
- ❌ 忽略文档更新和维护

### 最佳实践提醒
- ✅ 始终考虑性能影响
- ✅ 提供清晰的错误信息
- ✅ 保持代码的可维护性
- ✅ 定期更新文档

---

# 高级渲染系统开发指南

## 概述

高级渲染系统是RHI Demo系统的第三和第四层，展示了现代3D渲染的核心技术。包括完整的光照系统、基于物理的渲染(PBR)、实时阴影、GPU粒子系统和实例化渲染等高级特性。

## 🌟 光照系统Demo

### 1. Directional Light Demo - 平行光

**目标**: 展示平行光的渲染效果和实现

**技术要点**:
- 平行光的光照模型
- Lambert漫反射和Phong镜面反射
- 光源方向向量计算
- std140 Uniform缓冲区对齐

**核心实现**:
```typescript
class DirectionalLightDemo {
    private lightUniformBuffer: RHIUniformBuffer;
    private lightDirection: MMath.Vector3 = new MMath.Vector3(0.5, -1.0, 0.3).normalize();

    private createLightUniformBuffer(): void {
        const lightData = new Float32Array([
            // vec3 lightDirection (12 bytes) + padding (4 bytes)
            ...this.lightDirection.toArray(), 0,
            // vec3 lightColor (12 bytes) + float lightIntensity (4 bytes)
            1.0, 1.0, 1.0, 1.0,
            // vec3 ambientColor (12 bytes) + padding (4 bytes)
            0.1, 0.1, 0.1, 0
        ]);

        this.lightUniformBuffer = this.device.createBuffer({
            size: lightData.byteLength,
            usage: 'uniform' | 'copy-dst',
            mappedAtCreation: true
        });

        new Float32Array(this.lightUniformBuffer.getMappedRange()).set(lightData);
        this.lightUniformBuffer.unmap();
    }
}
```

**Phong光照着色器核心**:
```glsl
// 计算光照
vec3 lightDir = normalize(-uLightDirection);
float diff = max(dot(vNormal, lightDir), 0.0);
vec3 diffuse = diff * uLightColor * uLightIntensity;

// 镜面反射
vec3 viewDir = normalize(uViewPosition - vPosition);
vec3 reflectDir = reflect(-lightDir, vNormal);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
vec3 specular = spec * uLightColor * uLightIntensity;
```

### 2. Point Lights Demo - 多点光源

**目标**: 展示多个点光源的渲染效果

**技术要点**:
- 点光源的距离衰减
- 多光源累加计算
- 208字节Uniform缓冲区管理
- 动态光源开关控制

**关键实现**:
```typescript
interface PointLight {
    position: MMath.Vector3;
    color: MMath.Vector3;
    intensity: number;
    radius: number;
    enabled: boolean;
}

// std140对齐：每个光源52字节，4个光源共208字节
const lightData = new Float32Array(52);
```

**点光源衰减着色器**:
```glsl
float attenuation = max(1.0 - distance / light.radius, 0.0);
attenuation = attenuation * attenuation; // 二次衰减
vec3 diffuse = diff * light.color * light.intensity * attenuation;
```

## 🎨 PBR材质系统

### PBR Material Demo - 物理基础渲染

**目标**: 展示基于物理的渲染效果

**技术要点**:
- Cook-Torrance BRDF模型
- 金属度/粗糙度工作流
- 环境光照(IBL)
- 线性空间渲染

**PBR材质实现**:
```typescript
class PBRMaterial {
    private albedoTexture: RHITexture2D;
    private normalTexture: RHITexture2D;
    private metallicRoughnessTexture: RHITexture2D;
    private aoTexture: RHITexture2D;
    private materialUniform: RHIUniformBuffer;

    private createMaterialUniform(): void {
        const materialData = new Float32Array([
            // vec3 albedo (12 bytes) + float metallic (4 bytes)
            1.0, 1.0, 1.0, 0.0,
            // float roughness (4 bytes) + float ao (4 bytes) + padding (8 bytes)
            0.5, 1.0, 0.0, 0.0
        ]);
    }
}
```

**PBR着色器核心**:
```glsl
// Cook-Torrance BRDF计算
vec3 calculateBRDF(vec3 albedo, float metallic, float roughness, vec3 N, vec3 V, vec3 L) {
    vec3 H = normalize(V + L);
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);

    // 漫反射部分
    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    vec3 kD = (1.0 - F0) * (1.0 - metallic);
    vec3 diffuse = kD * albedo / PI;

    // 镜面反射部分 (GGX + Smith + Schlick)
    float alpha = roughness * roughness;
    float D = alpha2 / (PI * denominator * denominator);
    float G = G1L * G1V;
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - HdotV, 5.0);
    vec3 specular = (D * G * F) / (4.0 * NdotV * NdotL + 0.001);

    return diffuse + specular;
}
```

## 🌑 阴影映射系统

### Shadow Mapping Demo - 实时阴影

**目标**: 展示实时阴影映射技术

**技术要点**:
- 阴影贴图生成和使用
- PCF软阴影滤波
- 光源空间矩阵计算
- 阴影偏移和 acne问题解决

**阴影贴图管理器**:
```typescript
export class ShadowMap {
    public readonly depthTexture: RHITexture2D;
    public readonly depthView: RHITextureView;
    public readonly sampler: RHISampler;

    constructor(device: RHIDevice, resolution: number = 1024) {
        this.depthTexture = device.createTexture({
            size: [resolution, resolution],
            format: 'depth24plus',
            usage: 'texture-binding' | 'render-attachment'
        });

        // PCF比较采样器
        this.sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            compare: 'less'
        });
    }
}
```

**PCF软阴影实现**:
```typescript
export class PCFFilter {
    static getShaderSnippet(options: {
        sampleMode: '1x1' | '2x2' | '3x3' | '5x5';
        bias: number;
    }): string {
        return `
            float calculateShadow(sampler2D shadowMap, vec4 lightSpacePos) {
                vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
                projCoords = projCoords * 0.5 + 0.5;
                float currentDepth = projCoords.z - ${options.bias.toFixed(4)};

                // PCF采样
                float shadow = 0.0;
                for(int i = 0; i < ${this.getSampleCount(options.sampleMode)}; i++) {
                    vec2 offset = getSampleOffset(i, '${options.sampleMode}');
                    float depth = texture(shadowMap, projCoords.xy + offset).r;
                    shadow += (currentDepth > depth) ? 1.0 : 0.0;
                }

                return shadow / ${this.getSampleCount(options.sampleMode)};
            }
        `;
    }
}
```

## 🎆 粒子系统

### Particle System Demo - GPU粒子

**目标**: 展示高性能的GPU粒子系统

**技术要点**:
- GPU实例化渲染粒子
- 粒子生命周期管理
- 发射器和更新器系统
- 10,000+粒子性能优化

**粒子渲染器**:
```typescript
export class ParticleRenderer {
    private instanceBuffer: RHIBuffer;
    private maxParticles: number;

    constructor(device: RHIDevice, maxParticles: number = 10000) {
        // 每个粒子实例包含: position(3) + velocity(3) + life(1) + size(1) = 8 floats
        const instanceDataSize = maxParticles * 8 * 4;
        this.instanceBuffer = device.createBuffer({
            size: instanceDataSize,
            usage: 'vertex' | 'copy-dst'
        });
    }

    updateParticles(particles: ParticleData[]): void {
        const instanceData = new Float32Array(this.particleCount * 8);
        // 准备实例数据并更新缓冲区
        this.device.queue.writeBuffer(this.instanceBuffer, 0, instanceData);
    }
}
```

**粒子着色器**:
```glsl
#version 300 es
in vec3 aInstancePosition;
in vec3 aInstanceVelocity;
in float aInstanceLife;
in float aInstanceSize;

void main() {
    vLife = aInstanceLife;

    // Billboard变换
    vec3 particlePos = aInstancePosition;
    vec3 cameraRight = normalize(cross(vec3(0.0, 1.0, 0.0), uCameraPosition - particlePos));
    vec3 cameraUp = cross(cameraRight, uCameraPosition - particlePos);

    float size = aInstanceSize * mix(0.5, 1.0, aInstanceLife);
    vec3 offset = aPosition.x * cameraRight * size + aPosition.y * cameraUp * size;
    vec3 worldPos = particlePos + offset;

    gl_Position = uViewProjection * vec4(worldPos, 1.0);
    vTexCoord = aPosition * 0.5 + 0.5;
}
```

## 🏗️ 实例化渲染

### Instanced Rendering Demo - GPU实例化

**目标**: 展示高效的实例化渲染技术

**技术要点**:
- Per-Instance Attributes
- Vertex Buffer Divisor
- 单次Draw Call渲染大量对象
- 内存优化和性能提升

**实例化渲染器**:
```typescript
export class InstancedRenderer {
    private instanceBuffer: RHIBuffer;
    private maxInstances: number;

    constructor(device: RHIDevice, geometry: GeometryData, maxInstances: number = 10000) {
        // 每个实例包含：变换矩阵(16) + 颜色(4) = 20 floats
        const instanceDataSize = maxInstances * 20 * 4;
        this.instanceBuffer = device.createBuffer({
            size: instanceDataSize,
            usage: 'vertex' | 'copy-dst'
        });
    }

    createPipeline(): RHIRenderPipeline {
        return this.device.createRenderPipeline({
            vertex: {
                buffers: [
                    // 几何体顶点缓冲区
                    { arrayStride: this.geometry.vertexStride },
                    // 实例数据缓冲区
                    {
                        arrayStride: 20 * 4,
                        stepMode: 'instance',
                        attributes: [
                            { shaderLocation: 3, offset: 0, format: 'float32x4' },
                            { shaderLocation: 4, offset: 16, format: 'float32x4' },
                            { shaderLocation: 5, offset: 32, format: 'float32x4' },
                            { shaderLocation: 6, offset: 48, format: 'float32x4' },
                            { shaderLocation: 7, offset: 64, format: 'float32x4' }
                        ]
                    }
                ]
            }
        });
    }
}
```

## 🎬 后处理系统

### Post-Processing Demo - 后处理效果

**目标**: 展示各种后处理渲染效果

**技术要点**:
- 渲染到纹理(RTT)
- 多通道渲染
- 屏幕空间效果
- 效果链组合

**后处理管理器**:
```typescript
export class PostProcessManager {
    private renderTargets: RHITexture2D[] = [];
    private pipelines: Map<string, RHIRenderPipeline> = new Map();

    constructor(device: RHIDevice, width: number, height: number) {
        // 创建多个渲染目标用于效果链
        for (let i = 0; i < 2; i++) {
            const texture = device.createTexture({
                size: [width, height],
                format: 'rgba16float',
                usage: 'texture-binding' | 'render-attachment'
            });
            this.renderTargets.push(texture);
        }
    }

    applyEffect(effectName: string, inputTexture: RHITexture2D, outputTexture: RHITexture2D): void {
        // 渲染全屏四边形应用效果
        const pipeline = this.pipelines.get(effectName);
        // 设置渲染通道并执行效果
    }
}
```

## 🔧 性能优化技巧

### 1. 批处理优化

```typescript
// 按材质分组渲染
const renderGroups = new Map<string, RenderObject[]>();
objects.forEach(obj => {
    const key = obj.material.id;
    if (!renderGroups.has(key)) {
        renderGroups.set(key, []);
    }
    renderGroups.get(key)!.push(obj);
});

// 批量渲染相同材质的对象
for (const [materialId, group] of renderGroups) {
    if (group.length > INSTANCING_THRESHOLD) {
        renderInstanced(group, material);
    } else {
        group.forEach(obj => renderSingle(obj, material));
    }
}
```

### 2. 自适应质量

```typescript
class AdaptiveQuality {
    private targetFrameTime = 16.67; // 60 FPS
    private currentQuality = 1.0;

    adjustQuality(frameTime: number): void {
        if (frameTime > this.targetFrameTime * 1.2) {
            this.currentQuality = Math.max(0.5, this.currentQuality * 0.9);
        } else if (frameTime < this.targetFrameTime * 0.8) {
            this.currentQuality = Math.min(1.0, this.currentQuality * 1.05);
        }
        this.applyQualitySettings();
    }
}
```

## 📊 性能指标

### 高级渲染性能基准

| 技术 | 对象数量 | FPS | GPU内存 | 关键优化 |
|------|----------|-----|---------|----------|
| PBR材质 | 1000 | 60 | 200MB | 纹理压缩 |
| 阴影映射 | 500 | 60 | 150MB | PCF 3x3 |
| 粒子系统 | 10,000 | 60 | 100MB | GPU实例化 |
| 实例化渲染 | 10,000 | 60 | 50MB | 单次Draw Call |
| 后处理 | Fullscreen | 60 | 80MB | HDR格式 |

## 🔗 相关资源

### 技术文档
- [PBR材质系统](../reference/pbr-material-system.md) - 完整PBR实现
- [阴影工具](../reference/shadow-tools.md) - 阴影系统工具
- [粒子系统](../reference/particle-system.md) - GPU粒子系统
- [实例化工具](../reference/instancing-tools.md) - 实例化渲染工具

### 学习资源
- [Physically Based Rendering](https://pbr-book.org/) - PBR理论
- [Real-Time Rendering](https://www.realtimerendering.com/) - 实时渲染技术
- [Learn OpenGL Advanced](https://learnopengl.com/Advanced-OpenGL) - 高级OpenGL技术

### 下一步学习
- [WebGPU开发指南](../guides/webgpu-development.md) - 下一代图形API
- [性能优化示例](../reference/api-v2/examples/performance-optimization.md) - 性能优化最佳实践

---

**注意**: 高级渲染系统涉及复杂的数学计算和GPU编程，建议在掌握基础渲染和纹理系统后再学习本部分内容。同时要注意性能与质量的平衡，根据目标平台选择合适的技术方案。
## 📚 Few-Shot示例

### 问题-解决方案对
**问题**: Demo无法在特定设备上运行
**解决方案**: 添加设备兼容性检查和降级方案
```typescript
if (!device.supportsFeature('requiredFeature')) {
  // 使用降级渲染
  renderer.useFallbackMode();
}
```

**问题**: 资源加载失败导致Demo崩溃
**解决方案**: 实现资源加载重试机制
```typescript
try {
  await resourceLoader.loadWithRetry(texturePath, 3);
} catch (error) {
  console.warn('使用默认纹理:', error);
  texture = defaultTexture;
}
```

### 学习要点
- 理解常见问题和解决方案
- 掌握最佳实践和避免陷阱
- 培养问题解决思维

---

# 高级渲染系统开发指南

## 概述

高级渲染系统是RHI Demo系统的第三和第四层，展示了现代3D渲染的核心技术。包括完整的光照系统、基于物理的渲染(PBR)、实时阴影、GPU粒子系统和实例化渲染等高级特性。

## 🌟 光照系统Demo

### 1. Directional Light Demo - 平行光

**目标**: 展示平行光的渲染效果和实现

**技术要点**:
- 平行光的光照模型
- Lambert漫反射和Phong镜面反射
- 光源方向向量计算
- std140 Uniform缓冲区对齐

**核心实现**:
```typescript
class DirectionalLightDemo {
    private lightUniformBuffer: RHIUniformBuffer;
    private lightDirection: MMath.Vector3 = new MMath.Vector3(0.5, -1.0, 0.3).normalize();

    private createLightUniformBuffer(): void {
        const lightData = new Float32Array([
            // vec3 lightDirection (12 bytes) + padding (4 bytes)
            ...this.lightDirection.toArray(), 0,
            // vec3 lightColor (12 bytes) + float lightIntensity (4 bytes)
            1.0, 1.0, 1.0, 1.0,
            // vec3 ambientColor (12 bytes) + padding (4 bytes)
            0.1, 0.1, 0.1, 0
        ]);

        this.lightUniformBuffer = this.device.createBuffer({
            size: lightData.byteLength,
            usage: 'uniform' | 'copy-dst',
            mappedAtCreation: true
        });

        new Float32Array(this.lightUniformBuffer.getMappedRange()).set(lightData);
        this.lightUniformBuffer.unmap();
    }
}
```

**Phong光照着色器核心**:
```glsl
// 计算光照
vec3 lightDir = normalize(-uLightDirection);
float diff = max(dot(vNormal, lightDir), 0.0);
vec3 diffuse = diff * uLightColor * uLightIntensity;

// 镜面反射
vec3 viewDir = normalize(uViewPosition - vPosition);
vec3 reflectDir = reflect(-lightDir, vNormal);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
vec3 specular = spec * uLightColor * uLightIntensity;
```

### 2. Point Lights Demo - 多点光源

**目标**: 展示多个点光源的渲染效果

**技术要点**:
- 点光源的距离衰减
- 多光源累加计算
- 208字节Uniform缓冲区管理
- 动态光源开关控制

**关键实现**:
```typescript
interface PointLight {
    position: MMath.Vector3;
    color: MMath.Vector3;
    intensity: number;
    radius: number;
    enabled: boolean;
}

// std140对齐：每个光源52字节，4个光源共208字节
const lightData = new Float32Array(52);
```

**点光源衰减着色器**:
```glsl
float attenuation = max(1.0 - distance / light.radius, 0.0);
attenuation = attenuation * attenuation; // 二次衰减
vec3 diffuse = diff * light.color * light.intensity * attenuation;
```

## 🎨 PBR材质系统

### PBR Material Demo - 物理基础渲染

**目标**: 展示基于物理的渲染效果

**技术要点**:
- Cook-Torrance BRDF模型
- 金属度/粗糙度工作流
- 环境光照(IBL)
- 线性空间渲染

**PBR材质实现**:
```typescript
class PBRMaterial {
    private albedoTexture: RHITexture2D;
    private normalTexture: RHITexture2D;
    private metallicRoughnessTexture: RHITexture2D;
    private aoTexture: RHITexture2D;
    private materialUniform: RHIUniformBuffer;

    private createMaterialUniform(): void {
        const materialData = new Float32Array([
            // vec3 albedo (12 bytes) + float metallic (4 bytes)
            1.0, 1.0, 1.0, 0.0,
            // float roughness (4 bytes) + float ao (4 bytes) + padding (8 bytes)
            0.5, 1.0, 0.0, 0.0
        ]);
    }
}
```

**PBR着色器核心**:
```glsl
// Cook-Torrance BRDF计算
vec3 calculateBRDF(vec3 albedo, float metallic, float roughness, vec3 N, vec3 V, vec3 L) {
    vec3 H = normalize(V + L);
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);

    // 漫反射部分
    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    vec3 kD = (1.0 - F0) * (1.0 - metallic);
    vec3 diffuse = kD * albedo / PI;

    // 镜面反射部分 (GGX + Smith + Schlick)
    float alpha = roughness * roughness;
    float D = alpha2 / (PI * denominator * denominator);
    float G = G1L * G1V;
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - HdotV, 5.0);
    vec3 specular = (D * G * F) / (4.0 * NdotV * NdotL + 0.001);

    return diffuse + specular;
}
```

## 🌑 阴影映射系统

### Shadow Mapping Demo - 实时阴影

**目标**: 展示实时阴影映射技术

**技术要点**:
- 阴影贴图生成和使用
- PCF软阴影滤波
- 光源空间矩阵计算
- 阴影偏移和 acne问题解决

**阴影贴图管理器**:
```typescript
export class ShadowMap {
    public readonly depthTexture: RHITexture2D;
    public readonly depthView: RHITextureView;
    public readonly sampler: RHISampler;

    constructor(device: RHIDevice, resolution: number = 1024) {
        this.depthTexture = device.createTexture({
            size: [resolution, resolution],
            format: 'depth24plus',
            usage: 'texture-binding' | 'render-attachment'
        });

        // PCF比较采样器
        this.sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            compare: 'less'
        });
    }
}
```

**PCF软阴影实现**:
```typescript
export class PCFFilter {
    static getShaderSnippet(options: {
        sampleMode: '1x1' | '2x2' | '3x3' | '5x5';
        bias: number;
    }): string {
        return `
            float calculateShadow(sampler2D shadowMap, vec4 lightSpacePos) {
                vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
                projCoords = projCoords * 0.5 + 0.5;
                float currentDepth = projCoords.z - ${options.bias.toFixed(4)};

                // PCF采样
                float shadow = 0.0;
                for(int i = 0; i < ${this.getSampleCount(options.sampleMode)}; i++) {
                    vec2 offset = getSampleOffset(i, '${options.sampleMode}');
                    float depth = texture(shadowMap, projCoords.xy + offset).r;
                    shadow += (currentDepth > depth) ? 1.0 : 0.0;
                }

                return shadow / ${this.getSampleCount(options.sampleMode)};
            }
        `;
    }
}
```

## 🎆 粒子系统

### Particle System Demo - GPU粒子

**目标**: 展示高性能的GPU粒子系统

**技术要点**:
- GPU实例化渲染粒子
- 粒子生命周期管理
- 发射器和更新器系统
- 10,000+粒子性能优化

**粒子渲染器**:
```typescript
export class ParticleRenderer {
    private instanceBuffer: RHIBuffer;
    private maxParticles: number;

    constructor(device: RHIDevice, maxParticles: number = 10000) {
        // 每个粒子实例包含: position(3) + velocity(3) + life(1) + size(1) = 8 floats
        const instanceDataSize = maxParticles * 8 * 4;
        this.instanceBuffer = device.createBuffer({
            size: instanceDataSize,
            usage: 'vertex' | 'copy-dst'
        });
    }

    updateParticles(particles: ParticleData[]): void {
        const instanceData = new Float32Array(this.particleCount * 8);
        // 准备实例数据并更新缓冲区
        this.device.queue.writeBuffer(this.instanceBuffer, 0, instanceData);
    }
}
```

**粒子着色器**:
```glsl
#version 300 es
in vec3 aInstancePosition;
in vec3 aInstanceVelocity;
in float aInstanceLife;
in float aInstanceSize;

void main() {
    vLife = aInstanceLife;

    // Billboard变换
    vec3 particlePos = aInstancePosition;
    vec3 cameraRight = normalize(cross(vec3(0.0, 1.0, 0.0), uCameraPosition - particlePos));
    vec3 cameraUp = cross(cameraRight, uCameraPosition - particlePos);

    float size = aInstanceSize * mix(0.5, 1.0, aInstanceLife);
    vec3 offset = aPosition.x * cameraRight * size + aPosition.y * cameraUp * size;
    vec3 worldPos = particlePos + offset;

    gl_Position = uViewProjection * vec4(worldPos, 1.0);
    vTexCoord = aPosition * 0.5 + 0.5;
}
```

## 🏗️ 实例化渲染

### Instanced Rendering Demo - GPU实例化

**目标**: 展示高效的实例化渲染技术

**技术要点**:
- Per-Instance Attributes
- Vertex Buffer Divisor
- 单次Draw Call渲染大量对象
- 内存优化和性能提升

**实例化渲染器**:
```typescript
export class InstancedRenderer {
    private instanceBuffer: RHIBuffer;
    private maxInstances: number;

    constructor(device: RHIDevice, geometry: GeometryData, maxInstances: number = 10000) {
        // 每个实例包含：变换矩阵(16) + 颜色(4) = 20 floats
        const instanceDataSize = maxInstances * 20 * 4;
        this.instanceBuffer = device.createBuffer({
            size: instanceDataSize,
            usage: 'vertex' | 'copy-dst'
        });
    }

    createPipeline(): RHIRenderPipeline {
        return this.device.createRenderPipeline({
            vertex: {
                buffers: [
                    // 几何体顶点缓冲区
                    { arrayStride: this.geometry.vertexStride },
                    // 实例数据缓冲区
                    {
                        arrayStride: 20 * 4,
                        stepMode: 'instance',
                        attributes: [
                            { shaderLocation: 3, offset: 0, format: 'float32x4' },
                            { shaderLocation: 4, offset: 16, format: 'float32x4' },
                            { shaderLocation: 5, offset: 32, format: 'float32x4' },
                            { shaderLocation: 6, offset: 48, format: 'float32x4' },
                            { shaderLocation: 7, offset: 64, format: 'float32x4' }
                        ]
                    }
                ]
            }
        });
    }
}
```

## 🎬 后处理系统

### Post-Processing Demo - 后处理效果

**目标**: 展示各种后处理渲染效果

**技术要点**:
- 渲染到纹理(RTT)
- 多通道渲染
- 屏幕空间效果
- 效果链组合

**后处理管理器**:
```typescript
export class PostProcessManager {
    private renderTargets: RHITexture2D[] = [];
    private pipelines: Map<string, RHIRenderPipeline> = new Map();

    constructor(device: RHIDevice, width: number, height: number) {
        // 创建多个渲染目标用于效果链
        for (let i = 0; i < 2; i++) {
            const texture = device.createTexture({
                size: [width, height],
                format: 'rgba16float',
                usage: 'texture-binding' | 'render-attachment'
            });
            this.renderTargets.push(texture);
        }
    }

    applyEffect(effectName: string, inputTexture: RHITexture2D, outputTexture: RHITexture2D): void {
        // 渲染全屏四边形应用效果
        const pipeline = this.pipelines.get(effectName);
        // 设置渲染通道并执行效果
    }
}
```

## 🔧 性能优化技巧

### 1. 批处理优化

```typescript
// 按材质分组渲染
const renderGroups = new Map<string, RenderObject[]>();
objects.forEach(obj => {
    const key = obj.material.id;
    if (!renderGroups.has(key)) {
        renderGroups.set(key, []);
    }
    renderGroups.get(key)!.push(obj);
});

// 批量渲染相同材质的对象
for (const [materialId, group] of renderGroups) {
    if (group.length > INSTANCING_THRESHOLD) {
        renderInstanced(group, material);
    } else {
        group.forEach(obj => renderSingle(obj, material));
    }
}
```

### 2. 自适应质量

```typescript
class AdaptiveQuality {
    private targetFrameTime = 16.67; // 60 FPS
    private currentQuality = 1.0;

    adjustQuality(frameTime: number): void {
        if (frameTime > this.targetFrameTime * 1.2) {
            this.currentQuality = Math.max(0.5, this.currentQuality * 0.9);
        } else if (frameTime < this.targetFrameTime * 0.8) {
            this.currentQuality = Math.min(1.0, this.currentQuality * 1.05);
        }
        this.applyQualitySettings();
    }
}
```

## 📊 性能指标

### 高级渲染性能基准

| 技术 | 对象数量 | FPS | GPU内存 | 关键优化 |
|------|----------|-----|---------|----------|
| PBR材质 | 1000 | 60 | 200MB | 纹理压缩 |
| 阴影映射 | 500 | 60 | 150MB | PCF 3x3 |
| 粒子系统 | 10,000 | 60 | 100MB | GPU实例化 |
| 实例化渲染 | 10,000 | 60 | 50MB | 单次Draw Call |
| 后处理 | Fullscreen | 60 | 80MB | HDR格式 |

## 🔗 相关资源

### 技术文档
- [PBR材质系统](../reference/pbr-material-system.md) - 完整PBR实现
- [阴影工具](../reference/shadow-tools.md) - 阴影系统工具
- [粒子系统](../reference/particle-system.md) - GPU粒子系统
- [实例化工具](../reference/instancing-tools.md) - 实例化渲染工具

### 学习资源
- [Physically Based Rendering](https://pbr-book.org/) - PBR理论
- [Real-Time Rendering](https://www.realtimerendering.com/) - 实时渲染技术
- [Learn OpenGL Advanced](https://learnopengl.com/Advanced-OpenGL) - 高级OpenGL技术

### 下一步学习
- [WebGPU开发指南](../guides/webgpu-development.md) - 下一代图形API
- [性能优化示例](../reference/api-v2/examples/performance-optimization.md) - 性能优化最佳实践

---

**注意**: 高级渲染系统涉及复杂的数学计算和GPU编程，建议在掌握基础渲染和纹理系统后再学习本部分内容。同时要注意性能与质量的平衡，根据目标平台选择合适的技术方案。