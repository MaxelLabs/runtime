# PBR+IBL+Shadow Demo 实施指南

## 概述
本指南详细说明如何在现有的 shadow-mapping.ts 基础上，升级为完整的 PBR+IBL+Shadow 演示系统。

## 实施步骤

### 第一步：备份和准备
```bash
# 备份原始文件
cp packages/rhi/demo/src/shadow-mapping.ts packages/rhi/demo/src/shadow-mapping-backup.ts
```

### 第二步：核心着色器实现

#### 1. 创建 PBR+Shadow 整合着色器

**顶点着色器 (pbr_shadow_vert.glsl)**:
```glsl
#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;
layout(location = 3) in vec3 aTangent;

// Uniforms
layout(std140) uniform PBRUniforms {
    mat4 uModel;
    mat4 uView;
    mat4 uProjection;
    mat4 uLightSpaceMatrix;
    vec3 uCameraPos;
    vec3 uAlbedo;
    float uMetalness;
    float uRoughness;
    float uAO;
    float uShadowBias;
    float uShadowIntensity;
    float uShadowPCFRadius;
    int uPCFSamples;
    int uLightCount;
    vec3 uLightPositions[4];
    vec3 uLightColors[4];
};

// Outputs to fragment shader
out vec3 vWorldPos;
out vec3 vNormal;
out vec2 vTexCoord;
out vec3 vTangent;
out vec3 vBitangent;
out vec4 vShadowCoord;

void main() {
    // World space position
    vWorldPos = (uModel * vec4(aPosition, 1.0)).xyz;

    // Normal matrix for normal transformation
    mat3 normalMatrix = transpose(inverse(mat3(uModel)));
    vNormal = normalize(normalMatrix * aNormal);
    vTangent = normalize(normalMatrix * aTangent);
    vBitangent = cross(vNormal, vTangent);

    // Pass through texture coordinates
    vTexCoord = aTexCoord;

    // Calculate shadow coordinates
    vShadowCoord = uLightSpaceMatrix * vec4(vWorldPos, 1.0);

    // Final position
    gl_Position = uProjection * uView * vec4(vWorldPos, 1.0);
}
```

**片段着色器 (pbr_shadow_frag.glsl)**:
```glsl
#version 300 es
precision highp float;

// Inputs from vertex shader
in vec3 vWorldPos;
in vec3 vNormal;
in vec2 vTexCoord;
in vec3 vTangent;
in vec3 vBitangent;
in vec4 vShadowCoord;

// Uniforms
layout(std140) uniform PBRUniforms {
    mat4 uModel;
    mat4 uView;
    mat4 uProjection;
    mat4 uLightSpaceMatrix;
    vec3 uCameraPos;
    vec3 uAlbedo;
    float uMetalness;
    float uRoughness;
    float uAO;
    float uShadowBias;
    float uShadowIntensity;
    float uShadowPCFRadius;
    int uPCFSamples;
    int uLightCount;
    vec3 uLightPositions[4];
    vec3 uLightColors[4];
};

// PBR Textures
uniform sampler2D uAlbedoMap;
uniform sampler2D uNormalMap;
uniform sampler2D uMetallicRoughnessMap;
uniform sampler2D uAOMap;
uniform sampler2D uEmissiveMap;

// IBL Textures
uniform samplerCube uIrradianceMap;
uniform samplerCube uPrefilterMap;
uniform sampler2D uBRDFLUT;

// Shadow
uniform sampler2D uShadowMap;
uniform sampler2D uShadowSampler;

// Output
out vec4 fragColor;

// Constants
const float PI = 3.14159265359;
const float MAX_REFLECTION_LOD = 4.0;

// PBR helper functions
vec3 getNormalFromMap() {
    vec3 tangentNormal = texture(uNormalMap, vTexCoord).xyz * 2.0 - 1.0;

    vec3 Q1 = dFdx(vWorldPos);
    vec3 Q2 = dFdy(vWorldPos);
    vec2 st1 = dFdx(vTexCoord);
    vec2 st2 = dFdy(vTexCoord);

    vec3 N = normalize(vNormal);
    vec3 T = normalize(Q1 * st2.t - Q2 * st1.t);
    vec3 B = -normalize(cross(N, T));
    mat3 TBN = mat3(T, B, N);

    return normalize(TBN * tangentNormal);
}

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

float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float num = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return num / denom;
}

float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// PCF Shadow calculation
float calculatePCFShadow(vec4 shadowCoord, float bias) {
    // Perform perspective divide
    vec3 projCoords = shadowCoord.xyz / shadowCoord.w;
    projCoords = projCoords * 0.5 + 0.5;

    // Check if outside shadow map
    if (projCoords.x < 0.0 || projCoords.x > 1.0 ||
        projCoords.y < 0.0 || projCoords.y > 1.0 ||
        projCoords.z < 0.0 || projCoords.z > 1.0) {
        return 1.0;
    }

    // Get current depth from light's perspective
    float currentDepth = projCoords.z;

    // Calculate shadow
    float shadow = 0.0;
    vec2 texelSize = 1.0 / textureSize(uShadowMap, 0);

    // Poisson disk sampling pattern
    vec2 poissonDisk[16] = vec2[](
        vec2(-0.94201624, -0.39906216),
        vec2(0.94558609, -0.76890725),
        vec2(-0.09418410, -0.92938870),
        vec2(0.34495938, 0.29387760),
        vec2(-0.91588581, 0.45771432),
        vec2(-0.81544232, -0.87912464),
        vec2(-0.38277543, 0.27676845),
        vec2(0.97484398, 0.75648379),
        vec2(0.44323325, -0.97511554),
        vec2(0.53742981, -0.47372819),
        vec2(-0.26496911, -0.41893023),
        vec2(0.79197514, 0.19090188),
        vec2(-0.24188840, 0.99706507),
        vec2(-0.81409955, 0.91437590),
        vec2(0.19984126, 0.78641367),
        vec2(0.14383161, -0.14100790)
    );

    for (int i = 0; i < min(uPCFSamples, 16); ++i) {
        vec2 offset = poissonDisk[i] * uShadowPCFRadius * texelSize;
        float pcfDepth = texture(uShadowMap, projCoords.xy + offset).r;
        shadow += (currentDepth - bias) > pcfDepth ? 0.0 : 1.0;
    }

    shadow /= float(uPCFSamples);

    return mix(1.0, shadow, uShadowIntensity);
}

void main() {
    // Material properties
    vec3 albedo = pow(texture(uAlbedoMap, vTexCoord).rgb, vec3(2.2));
    float metallic = texture(uMetallicRoughnessMap, vTexCoord).b;
    float roughness = texture(uMetallicRoughnessMap, vTexCoord).g;
    float ao = texture(uAOMap, vTexCoord).r;

    // Use uniform values as fallback
    albedo *= uAlbedo;
    metallic = max(metallic, uMetalness);
    roughness = max(roughness, uRoughness);
    ao *= uAO;

    // Input normal
    vec3 N = getNormalFromMap();
    vec3 V = normalize(uCameraPos - vWorldPos);
    vec3 R = reflect(-V, N);

    // Calculate reflectance at normal incidence
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    // Direct lighting
    vec3 Lo = vec3(0.0);
    for(int i = 0; i < uLightCount && i < 4; ++i) {
        vec3 L = normalize(uLightPositions[i] - vWorldPos);
        vec3 H = normalize(V + L);
        vec3 radiance = uLightColors[i];

        // Cook-Torrance BRDF
        float NDF = distributionGGX(N, H, roughness);
        float G = geometrySmith(N, V, L, roughness);
        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        vec3 numerator = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
        vec3 specular = numerator / denominator;

        // Add to outgoing radiance Lo
        float NdotL = max(dot(N, L), 0.0);
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    // Ambient lighting (IBL)
    vec3 F = fresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);
    vec3 kS = F;
    vec3 kD = 1.0 - kS;
    kD *= 1.0 - metallic;

    vec3 irradiance = texture(uIrradianceMap, N).rgb;
    vec3 diffuseIBL = irradiance * albedo;

    vec3 prefilteredColor = textureLod(uPrefilterMap, R, roughness * MAX_REFLECTION_LOD).rgb;
    vec2 brdf = texture(uBRDFLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;
    vec3 specularIBL = prefilteredColor * (F * brdf.x + brdf.y);

    vec3 ambient = (kD * diffuseIBL + specularIBL) * ao;

    // Shadow calculation
    float shadowFactor = calculatePCFShadow(vShadowCoord, uShadowBias);

    // Final color
    vec3 color = ambient + Lo * shadowFactor;

    // HDR tonemapping
    color = color / (color + vec3(1.0));

    // Gamma correction
    color = pow(color, vec3(1.0/2.2));

    fragColor = vec4(color, 1.0);
}
```

### 第三步：TypeScript 实现结构

#### 1. 主类结构
```typescript
class PBRShadowDemo {
    // Core systems
    private runner: DemoRunner;
    private device: MSpec.IRHIDevice;

    // Rendering resources
    private shadowMap: ShadowMap;
    private lightSpaceMatrix: LightSpaceMatrix;

    // PBR system
    private materialLibrary: MaterialLibrary;
    private iblLoader: IBLLoader;
    private iblTextures: IBLTextures;

    // Geometries
    private planeGeometry: GeometryData;
    private sphereGeometries: GeometryData[];
    private cubeGeometries: GeometryData[];

    // Scene objects
    private sceneObjects: SceneObject[];

    // Render pipelines
    private shadowPipeline: MSpec.IRHIRenderPipeline;
    private pbrPipeline: MSpec.IRHIRenderPipeline;

    // Uniform buffers
    private shadowUniformBuffer: MSpec.IRHIBuffer;
    private pbrUniformBuffers: MSpec.IRHIBuffer[];

    // Light configuration
    private mainLight: {
        position: MMath.Vector3;
        direction: MMath.Vector3;
        color: MMath.Vector3;
        intensity: number;
    };
}
```

#### 2. 初始化流程
```typescript
async init(): Promise<void> {
    // 1. Initialize core systems
    await this.runner.init();
    this.device = this.runner.device;

    // 2. Load and generate IBL textures
    await this.loadEnvironmentMap();

    // 3. Create shadow system
    this.createShadowSystem();

    // 4. Initialize PBR materials
    this.createPBRMaterials();

    // 5. Create geometries
    this.createGeometries();

    // 6. Create render pipelines
    this.createRenderPipelines();

    // 7. Setup scene objects
    this.setupScene();

    // 8. Start render loop
    this.startRenderLoop();
}
```

#### 3. 场景对象配置
```typescript
interface SceneObject {
    geometry: GeometryData;
    material: PBRMaterial;
    transform: MMath.Matrix4;
    castShadow: boolean;
    receiveShadow: boolean;
}

setupScene(): void {
    this.sceneObjects = [];

    // Ground plane (receives shadow)
    this.sceneObjects.push({
        geometry: this.planeGeometry,
        material: this.materialLibrary.presets.stone,
        transform: new MMath.Matrix4().identity()
            .translate(new MMath.Vector3(0, 0, 0))
            .scale(new MMath.Vector3(20, 1, 20)),
        castShadow: false,
        receiveShadow: true
    });

    // Metal sphere (casts and receives shadow)
    this.sceneObjects.push({
        geometry: this.sphereGeometries[0],
        material: this.materialLibrary.presets.gold,
        transform: new MMath.Matrix4().identity()
            .translate(new MMath.Vector3(-3, 2, 0)),
        castShadow: true,
        receiveShadow: true
    });

    // Plastic cube (casts and receives shadow)
    this.sceneObjects.push({
        geometry: this.cubeGeometries[0],
        material: this.materialLibrary.presets.plastic,
        transform: new MMath.Matrix4().identity()
            .translate(new MMath.Vector3(3, 1.5, 0))
            .scale(new MMath.Vector3(1.5, 1.5, 1.5)),
        castShadow: true,
        receiveShadow: true
    });

    // Wood sphere
    this.sceneObjects.push({
        geometry: this.sphereGeometries[1],
        material: this.materialLibrary.presets.wood,
        transform: new MMath.Matrix4().identity()
            .translate(new MMath.Vector3(0, 1.8, 3)),
        castShadow: true,
        receiveShadow: true
    });

    // Iron cube with varying roughness
    this.sceneObjects.push({
        geometry: this.cubeGeometries[1],
        material: this.materialLibrary.presets.iron,
        transform: new MMath.Matrix4().identity()
            .translate(new MMath.Vector3(-2, 1, -3))
            .scale(new MMath.Vector3(1, 2, 1)),
        castShadow: true,
        receiveShadow: true
    });
}
```

### 第四步：渲染循环实现

```typescript
private renderFrame = (deltaTime: number): void => {
    // 1. Update camera and orbit controller
    this.orbitController.update(deltaTime);

    // 2. Update light position (if animated)
    if (this.params.animateLight) {
        this.updateLightAnimation(deltaTime);
    }

    // 3. Calculate view and projection matrices
    const viewMatrix = this.orbitController.getViewMatrix();
    const projectionMatrix = this.orbitController.getProjectionMatrix(
        this.runner.width / this.runner.height
    );

    // 4. Update light space matrix
    this.updateLightSpaceMatrix();

    // 5. Render shadow pass
    this.renderShadowPass();

    // 6. Render main PBR pass
    this.renderPBRPass(viewMatrix, projectionMatrix);

    // 7. Render skybox
    this.renderSkybox(viewMatrix, projectionMatrix);

    // 8. Update stats
    this.stats.end();
};

renderShadowPass(): void {
    const encoder = this.device.createCommandEncoder();
    const passDesc = this.shadowMap.getRenderPassDescriptor(1.0);
    const pass = encoder.beginRenderPass(passDesc);

    pass.setPipeline(this.shadowPipeline);

    // Render all shadow casting objects
    for (const obj of this.sceneObjects) {
        if (!obj.castShadow) continue;

        // Update shadow uniforms
        this.updateShadowUniforms(obj.transform);

        // Draw
        pass.setVertexBuffer(0, obj.geometry.vertexBuffer);
        pass.setIndexBuffer(obj.geometry.indexBuffer, MSpec.RHIIndexFormat.UINT16);
        pass.drawIndexed(obj.geometry.indexCount!);
    }

    pass.end();
    this.device.submit([encoder.finish()]);
}

renderPBRPass(viewMatrix: Float32Array, projectionMatrix: Float32Array): void {
    const { passDescriptor } = this.runner.beginFrame();

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass(passDescriptor);

    pass.setPipeline(this.pbrPipeline);

    // Render all scene objects
    for (let i = 0; i < this.sceneObjects.length; i++) {
        const obj = this.sceneObjects[i];

        // Update PBR uniforms
        this.updatePBRUniforms(
            obj,
            viewMatrix,
            projectionMatrix,
            i
        );

        // Bind material and textures
        pass.setBindGroup(0, this.pbrBindGroups[i]);

        // Draw
        pass.setVertexBuffer(0, obj.geometry.vertexBuffer);
        pass.setIndexBuffer(obj.geometry.indexBuffer, MSpec.RHIIndexFormat.UINT16);
        pass.drawIndexed(obj.geometry.indexCount!);
    }

    pass.end();
    this.device.submit([encoder.finish()]);
    this.runner.endFrame(encoder);
}
```

### 第五步：GUI控制设置

```typescript
setupGUI(): void {
    const gui = new SimpleGUI();

    // Light controls
    gui.addSeparator('Light Settings');
    gui.add('lightX', {
        value: this.params.lightX,
        min: -20, max: 20, step: 0.5,
        onChange: (v) => this.params.lightX = v as number
    });
    gui.add('lightY', {
        value: this.params.lightY,
        min: 5, max: 30, step: 0.5,
        onChange: (v) => this.params.lightY = v as number
    });
    gui.add('lightZ', {
        value: this.params.lightZ,
        min: -20, max: 20, step: 0.5,
        onChange: (v) => this.params.lightZ = v as number
    });

    // Shadow controls
    gui.addSeparator('Shadow Settings');
    gui.add('shadowBias', {
        value: this.params.shadowBias,
        min: 0.0, max: 0.05, step: 0.001,
        onChange: (v) => this.params.shadowBias = v as number
    });
    gui.add('shadowIntensity', {
        value: this.params.shadowIntensity,
        min: 0.0, max: 1.0, step: 0.05,
        onChange: (v) => this.params.shadowIntensity = v as number
    });
    gui.add('pcfSamples', {
        value: this.params.pcfSamples,
        min: 1, max: 32, step: 1,
        onChange: (v) => this.params.pcfSamples = v as number
    });
    gui.add('pcfRadius', {
        value: this.params.pcfRadius,
        min: 0.0, max: 5.0, step: 0.1,
        onChange: (v) => this.params.pcfRadius = v as number
    });

    // Animation
    gui.addSeparator('Animation');
    gui.add('animateLight', {
        value: this.params.animateLight,
        onChange: (v) => this.params.animateLight = v as boolean
    });

    // Debug views
    gui.addSeparator('Debug');
    gui.add('showShadowMap', {
        value: this.params.showShadowMap,
        onChange: (v) => this.params.showShadowMap = v as boolean
    });
}
```

## 关键注意事项

1. **资源管理**：确保所有资源通过 `runner.track()` 进行管理
2. **内存布局**：严格遵守 std140 对齐规则
3. **性能优化**：
   - 批量渲染相同材质的物体
   - 使用实例化渲染减少 Draw Call
   - 根据距离调整阴影贴图分辨率

4. **调试技巧**：
   - 使用 Half/Float 精度查看中间计算结果
   - 可视化 ShadowMap 和各种 PBR 组件
   - 逐步增加特性（先PBR，再IBL，最后Shadow）

5. **测试方案**：
   - 测试不同材质组合
   - 验证阴影在不同光照条件下的表现
   - 性能测试（帧率、Draw Call数量）

这个实施指南提供了完整的代码结构和技术细节，可以指导开发者一步步实现 PBR+IBL+Shadow 的完整演示系统。