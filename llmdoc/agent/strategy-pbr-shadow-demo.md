# Strategy: PBR+IBL+Shadow Demo 重写

## 1. Analysis
* **Context**: 现有的 shadow-mapping.ts 演示使用简单的 Phong 光照模型，需要升级为完整的 PBR+IBL+Shadow 系统
* **Constitution**:
  - 右手坐标系（Graphics Bible）
  - 列主序矩阵布局（Column-Major）
  - 线性空间光照计算
  - std140 UBO 对齐规则
  - 后乘矩阵运算规则

## 2. Assessment
<Assessment>
**Complexity**: Level 3 (Deep)
**Risk**: High - 需要整合三大系统（PBR、IBL、Shadow）并解决Shader兼容性
</Assessment>

## 3. Math/Algo Specification
<MathSpec>
### 渲染管线设计
1. **Pass 1 - Shadow Pass**:
   ```
   // 深度预渲染，从光源视角
   for each object in scene:
       lightMVP = LightProjection * LightView * ModelMatrix
       renderDepth(object, lightMVP)
   ```

2. **Pass 2 - PBR+IBL+Shadow Pass**:
   ```
   // 主渲染，整合PBR和阴影
   for each object in scene:
       // 1. 计算阴影坐标
       shadowCoord = LightSpaceMatrix * WorldPos

       // 2. PCF阴影采样
       shadowFactor = PCF(shadowMap, shadowCoord, bias)

       // 3. PBR BRDF计算
       Lo = calculatePBR(albedo, metallic, roughness, normal, V, lights)

       // 4. IBL环境光
       iblColor = calculateIBL(N, V, roughness, metallic)

       // 5. 合成最终颜色
       finalColor = (Lo + iblColor) * shadowFactor + ambient
   ```

### Shader整合方案
1. **顶点着色器**:
   - 输出：世界位置、法线、UV、切线
   - 计算阴影坐标：vShadowCoord = LightMatrix * worldPos

2. **片段着色器**:
   ```
   // PBR计算
   vec3 N = normalize(vNormal);
   vec3 V = normalize(cameraPos - vWorldPos);
   vec3 R = reflect(-V, N);

   // 阴影计算
   vec3 shadowCoord = vShadowCoord.xyz / vShadowCoord.w;
   float shadow = calculatePCFShadow(shadowCoord);

   // PBR + IBL
   vec3 albedo = texture(albedoMap, vUV).rgb;
   float metallic = texture(metallicMap, vUV).r;
   float roughness = texture(roughnessMap, vUV).r;

   vec3 Lo = calculateBRDF(N, V, L, albedo, metallic, roughness);
   vec3 F = calculateFresnelRoughness(max(dot(N, V), 0.0), roughness, F0);
   vec3 kS = F;
   vec3 kD = (1.0 - kS) * (1.0 - metallic);

   vec3 irradiance = texture(irradianceMap, N).rgb;
   vec3 prefilteredColor = textureLod(prefilterMap, R, roughness * MAX_LOD).rgb;
   vec2 brdf = texture(brdfLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;
   vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);
   vec3 ibl = kD * irradiance * albedo + specular;

   // 最终合成
   vec3 color = Lo * shadow + ibl;
   ```

### Uniform布局设计（std140对齐）
```glsl
layout(std140) uniform PBRUniforms {
    // 变换矩阵 (192 bytes)
    mat4 uModel;        // 64 bytes
    mat4 uView;         // 64 bytes
    mat4 uProjection;   // 64 bytes

    // 相机和材质 (48 bytes)
    vec3 uCameraPos;    // 12 bytes + 4 padding
    vec3 uAlbedo;       // 12 bytes + 4 padding
    float uMetalness;   // 4 bytes
    float uRoughness;   // 4 bytes
    float uAO;          // 4 bytes
    float padding1;     // 4 bytes

    // 光源数据 (80 bytes)
    int uLightCount;    // 4 bytes
    float padding2[3];  // 12 bytes
    vec3 uLightPositions[4];  // 48 bytes
    vec3 uLightColors[4];     // 48 bytes

    // 阴影数据 (64 bytes)
    mat4 uLightSpaceMatrix;  // 64 bytes
    float uShadowBias;       // 4 bytes
    float uShadowIntensity;  // 4 bytes
    float uShadowPCFRadius;  // 4 bytes
    int uPCFSamples;         // 4 bytes
    float padding3[4];       // 16 bytes
};
```
</MathSpec>

## 4. The Plan
<ExecutionPlan>
**Block 1: 场景设置和资源加载**
1. 创建DemoRunner实例，配置canvas和基础参数
2. 加载天空盒HDR纹理（使用现有CubemapGenerator）
3. 初始化IBL加载器，生成三张IBL贴图
4. 创建阴影贴图（ShadowMap，分辨率2048x2048）
5. 创建几何体：
   - 大型plane（接收阴影）
   - 3个sphere（不同材质：金属、塑料、木材）
   - 2个cube（不同粗糙度）

**Block 2: PBR材质系统初始化**
1. 创建MaterialLibrary实例
2. 定义材质配置：
   - Gold材质：albedo=[1,0.7,0.2], metalness=1.0, roughness=0.2
   - Plastic材质：albedo=[0.3,0.5,0.8], metalness=0.0, roughness=0.6
   - Wood材质：使用wood纹理贴图
3. 为每个几何体分配对应材质
4. 设置IBL贴图到所有材质

**Block 3: 渲染管线创建**
1. 创建深度Pass管线：
   - 简单的深度着色器（复用ShadowShaders）
   - 绑定LightSpaceMatrix uniform

2. 创建PBR+IBL+Shadow Pass管线：
   - 顶点着色器：输出世界坐标和阴影坐标
   - 片段着色器：整合PBR、IBL和阴影计算
   - 绑定组布局：
     - Binding 0: PBRUniforms (UBO)
     - Binding 1-5: PBR纹理（albedo, normal, metallic-roughness, ao）
     - Binding 6-8: IBL纹理（irradiance, prefilter, brdfLUT）
     - Binding 9: ShadowMap
     - Binding 10: ShadowSampler

**Block 4: 渲染循环实现**
1. 深度Pass：
   - 设置光源视角（斜上方定向光）
   - 渲染所有物体到阴影贴图

2. 主Pass：
   - 设置相机视角
   - 更新所有物体的变换矩阵
   - 渲染每个物体：
     - 绑定对应的材质和几何体
     - 更新PBRUniforms
     - 执行渲染

**Block 5: 优化和调试**
1. 实现GUI控制：
   - 光源位置和方向
   - 阴影参数（bias、PCF采样数）
   - PBR参数（可调节材质属性）

2. 性能优化：
   - 批量渲染相同材质物体
   - 视锥体裁剪

3. 调试视图：
   - 可视化阴影贴图
   - 切换PBR组件显示（albedo、metalness、roughness）
</ExecutionPlan>