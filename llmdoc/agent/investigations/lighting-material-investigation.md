# environment-mapping Demo 技术调研报告

**调研任务**: 环境映射Demo的技术需求和实现路径  
**调研日期**: 2025-12-15  
**调研模式**: Campaign Task (Investigator)

---

## 一、现状盘点

### 1.1 立方体贴图工具 ✅ 完备

**位置**: `/Users/mac/Desktop/project/max/runtime/packages/rhi/demo/src/utils/texture/CubemapGenerator.ts`

**可用方法**:
- `solidColor(config)` - 生成纯色立方体贴图
- `skyGradient(config)` - 生成天空渐变立方体贴图（顶部-中间-底部三色）
- `debug(config)` - 生成调试立方体贴图（每个面不同颜色+标签）
- `loadFromUrls(urls)` - 从 6 张图片 URL 加载立方体贴图
- `fromEquirectangular(url, size)` - 从全景图转换为立方体贴图

**评估**: 工具链**完备**，支持所有常见立方体贴图生成场景。

---

### 1.2 立方体贴图渲染 ✅ 已验证

**参考 Demo**: `/Users/mac/Desktop/project/max/runtime/packages/rhi/demo/src/cubemap-skybox.ts`

**核心技术**:
- `samplerCube` 采样器绑定（GLSL 300 ES）
- `texture(uSkybox, direction)` 采样立方体贴图
- 移除视图矩阵位移（让天空盒跟随相机）
- `gl_Position.z = gl_Position.w` 技巧（强制深度为 1.0）
- RHI 层支持 `dimension: 'cube'` 纹理创建
- 6 个面按顺序上传：posX/negX/posY/negY/posZ/negZ

**评估**: 立方体贴图渲染**已验证**，Demo 运行正常。

---

### 1.3 反射/折射 Shader 片段 ⚠️ 部分存在

**已有 `reflect()` 使用**（用于 Phong 镜面光）:
```glsl
// 在 phong-lighting.ts、directional-light.ts、spotlight.ts 等 Demo 中
vec3 reflectDir = reflect(-lightDir, normal);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
```

**缺失**:
- ❌ 未找到 `refract()` 函数的实际使用示例
- ❌ 未找到基于 `reflect()` 计算环境反射方向的代码片段
- ❌ 未找到 Fresnel 效果相关代码

**评估**: Shader 片段**部分存在**，需补充环境映射专用片段。

---

### 1.4 相机位置传递 ✅ 已标准化

**现有实现模式**（来自多个光照 Demo）:
```typescript
// TypeScript 端（CPU）
const cameraPosition = orbit.getPosition(); // 返回 Vector3
cameraData.set([cameraPosition.x, cameraPosition.y, cameraPosition.z, 0], 0);
cameraBuffer.update(cameraData, 0);

// GLSL 端（Uniform 块）
uniform Camera {
  vec3 uCameraPosition;
  float uPadding; // std140 对齐到 16 字节
};

// 片元着色器中计算视线方向
vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
```

**评估**: 相机位置传递**已标准化**，可直接复用。

---

## 二、缺失项清单

### 2.1 核心功能缺失

| 序号 | 缺失项               | 优先级 | 描述                                                         |
| ---- | -------------------- | ------ | ------------------------------------------------------------ |
| 1    | 反射环境映射 Shader  | P0     | 计算反射向量并采样立方体贴图的片元着色器代码                 |
| 2    | 折射环境映射 Shader  | P1     | 使用 `refract()` 实现折射效果（需要材质折射率参数）          |
| 3    | Fresnel 混合         | P1     | 根据视角动态混合反射/折射比例（Schlick 近似）                |
| 4    | 与 Phong 光照集成    | P2     | 将环境映射与漫反射/镜面光混合（避免完全覆盖光照计算）        |
| 5    | Chrome/Glass 材质预设 | P2     | 提供典型材质参数预设（金属全反射、玻璃折射率 1.5）          |

---

### 2.2 Shader 片段库扩展需求

**建议在 ShaderUtils 中添加**:

```typescript
// ShaderUtils.ts 新增方法
static getEnvironmentMappingSnippet(): string {
  return `
// 计算环境反射颜色
vec3 computeReflection(vec3 viewDir, vec3 normal, samplerCube envMap) {
  vec3 reflectDir = reflect(-viewDir, normal);
  return texture(envMap, reflectDir).rgb;
}

// 计算环境折射颜色
vec3 computeRefraction(vec3 viewDir, vec3 normal, samplerCube envMap, float eta) {
  vec3 refractDir = refract(-viewDir, normal, eta);
  return texture(envMap, refractDir).rgb;
}

// Fresnel-Schlick 近似
float computeFresnel(vec3 viewDir, vec3 normal, float F0) {
  float cosTheta = max(dot(viewDir, normal), 0.0);
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}
`;
}
```

---

## 三、实现建议

### 3.1 最小化实现路径（Reflection Only）

**目标**: 创建一个只支持反射的环境映射 Demo，快速验证技术栈。

**关键步骤**:

1. **复用 cubemap-skybox Demo 的立方体贴图加载逻辑**（Bridge2 纹理集）
2. **创建反射球体/茶壶几何体**（使用 `GeometryGenerator.sphere()`）
3. **片元着色器核心代码**:
   ```glsl
   uniform samplerCube uEnvironmentMap;
   in vec3 vWorldPosition;
   in vec3 vNormal;
   
   void main() {
     vec3 normal = normalize(vNormal);
     vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
     vec3 reflectDir = reflect(-viewDir, normal);
     
     vec3 reflectionColor = texture(uEnvironmentMap, reflectDir).rgb;
     fragColor = vec4(reflectionColor, 1.0);
   }
   ```
4. **Uniform 缓冲区**: 复用现有 Transforms + Camera 布局
5. **GUI 参数**: 反射强度滑块（lerp 到基础材质颜色）

**工作量估计**: 2-4 小时

---

### 3.2 完整实现路径（Reflection + Refraction + Fresnel）

**目标**: 实现玻璃/金属/塑料等多材质效果。

**新增关键步骤**:

6. **材质参数 Uniform 块**（std140 对齐）:
   ```glsl
   uniform Material {
     float uRefractionRatio; // 折射率（1.0/1.5 for glass）
     float uFresnelF0;       // Fresnel 基础反射率（0.04 for dielectric）
     float uReflectivity;    // 反射强度（0.0-1.0）
     float uPadding;
   };
   ```
7. **片元着色器混合逻辑**:
   ```glsl
   vec3 reflection = computeReflection(viewDir, normal, uEnvironmentMap);
   vec3 refraction = computeRefraction(viewDir, normal, uEnvironmentMap, uRefractionRatio);
   float fresnel = computeFresnel(viewDir, normal, uFresnelF0);
   
   vec3 finalColor = mix(refraction, reflection, fresnel);
   ```
8. **GUI 材质预设下拉框**:
   - Chrome: `reflectivity=1.0, F0=0.56`
   - Glass: `refractionRatio=0.67, F0=0.04`
   - Water: `refractionRatio=0.75, F0=0.02`

**工作量估计**: 6-10 小时

---

### 3.3 与光照系统集成（Optional）

**目标**: 将环境映射与 Phong 光照混合，避免完全覆盖基础漫反射。

**混合策略**:
```glsl
// Phong 光照计算（环境光 + 漫反射 + 镜面光）
vec3 phongLighting = ambient + diffuse + specular;

// 环境映射
vec3 envColor = mix(refraction, reflection, fresnel);

// 最终颜色（根据材质金属度混合）
vec3 finalColor = mix(phongLighting, envColor, uMetallic);
```

**注意**: 需要扩展材质 Uniform 块，添加 `uMetallic` 参数（金属度）。

---

## 四、技术风险与依赖

### 4.1 已验证的依赖项 ✅

- RHI 层支持 `dimension: 'cube'` 纹理（WebGL 实现）
- `samplerCube` 在 GLSL 300 ES 中可用
- OrbitController 提供 `getPosition()` 方法
- 所有光照 Demo 均已验证相机位置传递

### 4.2 需要验证的技术点 ⚠️

1. **refract() 函数在 WebGL2 中的精度问题**
   - 全反射情况（critical angle）的处理
   - 建议在实现时添加保护代码：
     ```glsl
     vec3 refractDir = refract(-viewDir, normal, eta);
     if (length(refractDir) < 0.01) {
       // 全反射 fallback
       refractDir = reflect(-viewDir, normal);
     }
     ```

2. **立方体贴图 Mipmap 支持**
   - 当前 `CubemapGenerator.loadFromUrls()` 未生成 Mipmap
   - 如需模糊反射（粗糙表面），需要调用 `texture.generateMipmaps()`

---

## 五、文档与代码索引

### 5.1 关键文件路径

| 类型       | 路径                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| 工具类     | `/packages/rhi/demo/src/utils/texture/CubemapGenerator.ts`                               |
| 参考 Demo  | `/packages/rhi/demo/src/cubemap-skybox.ts`                                               |
| 光照参考   | `/packages/rhi/demo/src/phong-lighting.ts`                                               |
| Shader工具 | `/packages/rhi/demo/src/utils/shader/ShaderUtils.ts`                                     |
| 图形圣经   | `/llmdoc/reference/graphics-bible.md`                                                    |
| Demo指南   | `/llmdoc/guides/demo-development.md`                                                     |

### 5.2 相关 Demo 实现状态

| Demo 名称         | 状态     | 技术关联                             |
| ----------------- | -------- | ------------------------------------ |
| cubemap-skybox    | ✅ 完成  | 立方体贴图采样、samplerCube 绑定    |
| phong-lighting    | ✅ 完成  | reflect() 使用、相机位置传递、Phong 光照 |
| directional-light | ✅ 完成  | 视线方向计算、镜面反射               |
| environment-mapping | ⏳ 待实现 | **本次调研目标**                     |

---

## 六、执行建议

### 6.1 最小化验证（2-4 小时）

**目标**: 快速验证环境反射是否工作。

**任务清单**:
- [ ] 复用 cubemap-skybox 的立方体贴图加载代码
- [ ] 创建 `environment-mapping.ts` 文件
- [ ] 实现纯反射材质（Chrome 效果）
- [ ] 添加反射强度 GUI 滑块
- [ ] 创建 `html/environment-mapping.html` 入口页
- [ ] 在 `demo/index.html` 注册入口卡片

### 6.2 完整实现（6-10 小时）

**目标**: 支持多材质切换（金属/玻璃/水）。

**任务清单**:
- [ ] 实现 Fresnel-Schlick 近似
- [ ] 添加 refract() 折射效果
- [ ] 扩展 ShaderUtils 添加环境映射片段库
- [ ] 实现材质预设切换（Chrome/Glass/Water）
- [ ] 创建 Demo 参考文档 `llmdoc/reference/environment-mapping-demo.md`
- [ ] 同步更新 `llmdoc/guides/demo-development.md`

### 6.3 高级扩展（Optional）

- [ ] 与 Phong 光照混合（金属度参数）
- [ ] 支持粗糙度参数（控制 Mipmap LOD）
- [ ] 动态环境映射（Render-to-Cubemap）

---

## 七、关键技术决策

### 7.1 材质参数存储方式

**推荐**: 使用独立的 Material Uniform 块（std140 对齐）

```typescript
// 16 字节对齐
const materialBuffer = runner.device.createBuffer({
  size: 16, // 4 floats
  usage: RHIBufferUsage.UNIFORM,
  hint: 'dynamic',
});

// 材质数据
const materialData = new Float32Array([
  refractionRatio, // float
  fresnelF0,       // float
  reflectivity,    // float
  0.0,             // padding
]);
```

**理由**: 
- 符合现有 Demo 的 Uniform 布局习惯
- 易于与 ShaderUtils 工具链集成
- 支持动态切换材质预设

---

### 7.2 立方体贴图复用策略

**推荐**: 直接复用 cubemap-skybox 的加载逻辑

**理由**:
- Bridge2 纹理集质量高，适合反射效果
- 避免重复实现资源加载代码
- 可以共享同一个立方体贴图（天空盒 + 环境映射）

**实现提示**:
```typescript
// 1. 加载立方体贴图
const cubemapData = await CubemapGenerator.loadFromUrls(cubemapUrls);

// 2. 创建纹理（用于天空盒和环境映射）
const cubeTexture = runner.track(
  runner.device.createTexture({
    width: cubemapData.size,
    height: cubemapData.size,
    depthOrArrayLayers: 6,
    dimension: 'cube',
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.TEXTURE_BINDING,
  })
);

// 3. 上传数据
faceOrder.forEach((face, i) => {
  cubeTexture.update(cubemapData.faces[face], 0, 0, 0, size, size, 1, 0, i);
});

// 4. 绑定到两个着色器（天空盒 + 反射物体）
bindGroupSkybox.setTexture(2, cubeTexture.createView());
bindGroupObject.setTexture(2, cubeTexture.createView());
```

---

## 八、总结

### 8.1 技术栈成熟度评估

| 模块         | 成熟度 | 说明                                     |
| ------------ | ------ | ---------------------------------------- |
| 立方体贴图   | ✅ 100% | CubemapGenerator 工具完备                |
| 采样器绑定   | ✅ 100% | samplerCube 已验证                       |
| 相机位置传递 | ✅ 100% | 多个光照 Demo 已标准化                   |
| reflect() 使用 | ✅ 90%  | Phong 镜面光已用，需扩展到环境方向计算   |
| refract() 使用 | ⚠️ 0%   | 未找到现有使用，需要独立实现             |
| Fresnel 计算 | ⚠️ 0%   | 未找到现有实现                           |

**总体评估**: **技术栈 70% 完备**，主要缺失 refract + Fresnel 实现。

---

### 8.2 实现路径建议

**推荐顺序**: 

1. **Phase 1: 纯反射 Demo**（2-4 小时）
   - 快速验证技术栈
   - 输出可运行的 Chrome 材质效果
   - 创建最小化文档

2. **Phase 2: 完整材质系统**（6-10 小时）
   - 添加折射和 Fresnel
   - 实现多材质预设
   - 完善文档和代码注释

3. **Phase 3: 光照集成**（Optional，8-12 小时）
   - 与 Phong 光照混合
   - 支持粗糙度/金属度
   - PBR 材质预研

---

### 8.3 潜在风险与缓解措施

| 风险                       | 影响 | 缓解措施                                         |
| -------------------------- | ---- | ------------------------------------------------ |
| refract() 全反射边界情况   | 中   | 添加 fallback 代码，全反射时使用 reflect()       |
| Fresnel 参数调优困难       | 低   | 提供典型材质预设（Chrome/Glass/Water）          |
| 与 Phong 光照冲突          | 中   | Phase 1 先不混合，Phase 3 再集成                 |
| 立方体贴图 Mipmap 缺失     | 低   | 手动调用 `texture.generateMipmaps()`             |

---

**报告生成时间**: 2025-12-15  
**调研人**: Radar (Investigator)  
**下一步行动**: 等待 Worker 团队基于本报告实施 environment-mapping Demo  
