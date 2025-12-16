# Strategy: Shadow Mapping Demo 分阶段实施

## 1. Analysis

### Context
现有的 shadow-mapping.ts 文件已经包含了完整的 PBR+IBL+Shadow 实现框架，但存在以下关键问题：
- 着色器使用硬编码而非工具模块提供
- Uniform 布局可能不符合 std140 对齐要求
- 天空盒渲染被注释（方法签名不匹配）
- 缺少深度图的可视化调试功能

### Constitution
根据 Graphics Bible 规范：
1. **坐标系**：右手坐标系，+X 右，+Y 上，+Z 前
2. **矩阵**：列主序布局，后乘规则 `MVP = P * V * M`
3. **颜色空间**：光照计算必须在线性空间，sRGB 纹理需要 gamma 校正
4. **UBO**：必须遵循 std140 对齐，vec3 需要填充到 16 字节
5. **阴影渲染**：使用 DEPTH24_UNORM 格式，必须有 bias

## 2. Assessment
<Assessment>
**Complexity**: Level 3
**Risk**: High
</Assessment>

## 3. Math/Algo Specification

<MathSpec>
### MVP 变换（阶段1）
```
P_clip = P_projection * P_view * P_model * P_local
MVP = Projection.multiply(View).multiply(Model)
```

### 光源空间矩阵（阶段2）
```
L_view = LookAt(lightPos, target, up)
L_proj = Ortho(-orthoSize, orthoSize, -orthoSize, orthoSize, near, far)
L_VP = L_proj * L_view
shadowCoord = L_VP * worldPos
```

### PCF 阴影计算（阶段3）
```
float shadow = 0.0
for i = 0 to PCFSamples:
    offset = poissonDisk[i] * radius * texelSize
    depth = texture(shadowMap, shadowCoord.xy + offset).r
    shadow += (shadowCoord.z - bias) > depth ? 0.0 : 1.0
return shadow / PCFSamples
```

### std140 Uniform 布局
```
// 严格对齐的 PBR Uniform 结构
layout(std140) uniform PBRUniforms {
    mat4 uModel;            // 0-63
    mat4 uView;             // 64-127
    mat4 uProjection;       // 128-191
    mat4 uLightSpaceMatrix; // 192-255
    vec3 uCameraPos;        // 256-267
    float pad0;             // 268-271
    vec3 uAlbedo;           // 272-283
    float pad1;             // 284-287
    float uMetalness;       // 288-291
    float uRoughness;       // 292-295
    float uAO;              // 296-299
    float pad2;             // 300-303
    int uLightCount;        // 304-307
    vec3 pad3;              // 308-311
    vec3 uLightPositions[4];// 312-375
    vec3 uLightColors[4];   // 376-439
    float uShadowBias;      // 440-443
    float uShadowIntensity; // 444-447
    float pad4[14];         // 448-511
};
```

## 4. The Plan
<ExecutionPlan>

### 阶段1：PBR + IBL + 灯光（基础渲染）

**目标**：场景能正常渲染，看到 PBR 材质效果

**修改区域**：
1. 使用工具模块的着色器而非硬编码
2. 修复 Uniform 布局符合 std140
3. 集成 MaterialLibrary 的材质
4. 恢复天空盒渲染

**实施步骤**：
1. **替换 PBR 着色器**（第517-707行）
   - 使用 `PBRShaders.getVertexShader()` 和 `PBRShaders.getFragmentShader()`
   - 确保着色器与材质库兼容

2. **修复 Uniform 布局**（第986-1036行）
   - 严格按照 std140 对齐填充 Float32Array
   - 每个vec3后添加填充，避免越界
   - 验证矩阵是列主序

3. **集成材质库**（第206-252行）
   - 确保材质正确绑定到着色器
   - 验证纹理绑定点一致性
   - 检查采样器状态

4. **恢复天空盒渲染**（第1118-1121行）
   - 修正 SkyboxRenderer.render() 方法调用
   - 传递正确的参数

**验证标准**：
- [ ] 场景中所有物体正常渲染
- [ ] 不同材质（金属、塑料、木材）有明显区别
- [ ] 环境光照效果可见
- [ ] 天空盒正确显示
- [ ] 没有 console 错误

### 阶段2：Depth 图输出（调试可视化）

**目标**：验证深度 Pass 工作正常，添加深度图可视化

**实施步骤**：
1. **创建深度可视化着色器**
   - 添加深度贴图可视化片段着色器
   - 将线性深度转换为可视化颜色

2. **添加调试渲染通道**
   ```typescript
   function renderDepthDebug(): void {
       // 在屏幕角落渲染深度贴图
       const debugViewport = { x: width - 256, y: height - 256, width: 256, height: 256 };
       // 使用深度可视化着色器渲染
   }
   ```

3. **集成 GUI 控制**（第927-931行）
   - `showShadowMap` 参数控制深度图显示
   - 添加深度图切换开关

4. **验证深度数据**
   - 确保深度值在 [0, 1] 范围
   - 检查阴影投射者正确渲染到深度贴图
   - 验证深度精度

**验证标准**：
- [ ] 深度贴图正确生成
- [ ] 深度值分布合理（近处亮远处暗）
- [ ] GUI 可以开关深度图显示
- [ ] 深度贴图只包含阴影投射物体

### 阶段3：阴影集成（完整阴影效果）

**目标**：完成完整的阴影效果，集成 PCF 软阴影

**实施步骤**：
1. **集成阴影着色器模块**
   - 使用 `ShadowShaders.getPBRShadowShader()`
   - 确保与 PBR 着色器正确组合

2. **实现 PCF 软阴影**
   - 集成 `PCFFilter` 工具模块
   - 支持可配置的采样数量和半径
   - 使用 Poisson Disk 采样模式

3. **优化阴影参数**
   - 动态调整 shadow bias
   - 实现基于距离的自适应 PCF 半径
   - 添加阴影强度控制

4. **性能优化**
   - 实现视锥体裁剪
   - 添加阴影接收标记
   - 优化 Draw Call 数量

**关键着色器修改**：
```glsl
// 在 PBR 片段着色器中添加阴影计算
float calculateShadowPCF(vec4 shadowCoord) {
    vec3 projCoords = shadowCoord.xyz / shadowCoord.w;
    projCoords = projCoords * 0.5 + 0.5;

    float shadow = 0.0;
    vec2 texelSize = 1.0 / textureSize(uShadowMap, 0);

    for(int i = 0; i < uPCFSamples; ++i) {
        vec2 offset = poissonDisk[i] * uPCFRadius * texelSize;
        float depth = texture(uShadowMap, projCoords.xy + offset).r;
        shadow += (projCoords.z - uShadowBias) > depth ? 0.0 : 1.0;
    }

    return shadow / float(uPCFSamples);
}
```

5. **添加级联阴影支持（可选）**
   - 为大场景预留 CSM 接口
   - 支持多级联阴影混合

**验证标准**：
- [ ] 阴影正确投射到地面
- [ ] 软阴影边缘平滑
- [ ] 没有 shadow acne 或 peter panning
- [ ] 动态光源时阴影实时更新
- [ ] 性能保持在 60 FPS 以上

### 通用调试工具

1. **添加调试模式**
   ```typescript
   const debugMode = {
       showWireframe: false,
       showNormals: false,
       showDepthMap: false,
       showShadowCascade: false,
       freezeShadows: false
   };
   ```

2. **性能监控**
   - 添加阴影渲染时间统计
   - 监控 Draw Call 数量
   - 跟踪内存使用

3. **错误处理**
   - 检测着色器编译错误
   - 验证纹理加载成功
   - 处理设备兼容性问题

</ExecutionPlan>