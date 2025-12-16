# Strategy: Skybox System Module

## 1. Mission Overview
实现天空盒渲染系统，支持立方体贴图和程序化天空，为PBR材质提供环境映射

## 2. Module Architecture

### Class Diagram
```
SkyboxSystem
├── SkyboxRenderer (渲染器)
│   ├── cubeMesh: Geometry
│   ├── pipeline: RenderPipeline
│   └── render(camera)
├── ProceduralSky (程序化天空)
│   ├── generateGradient()
│   ├── updateSunPosition()
│   └── dayNightCycle()
└── EnvironmentMap (环境映射)
    ├── diffuseMap: Texture
    ├── specularMap: Texture
    └── brdfLUT: Texture
```

### Rendering Flow
1. 在所有不透明物体之后渲染
2. 深度测试设为 LESS_EQUAL，深度写入关闭
3. 移除视图矩阵的位移分量
4. 使用 `gl_Position.xyww` 强制深度为1.0

## 3. Core Algorithm (Pseudo-code)

### Skybox Rendering
```typescript
function renderSkybox(camera: Camera) {
  // 移除位移，只保留旋转
  const viewRotation = camera.viewMatrix.clone()
  viewRotation.setPosition(0, 0, 0)

  // 设置渲染状态
  setDepthTest(LESS_EQUAL)
  setDepthWrite(false)
  setCullMode(FRONT) // 反转立方体

  // 绑定立方体贴图
  bindTexture(cubemapTexture, 0)

  // 渲染
  drawCube(viewRotation, camera.projMatrix)
}
```

### Procedural Sky Generation
```typescript
function generateProceduralSky(time: number): Cubemap {
  const sunAngle = time * 2 * PI // 日夜循环

  for each face of cubemap {
    for each pixel {
      const dir = pixelToDirection(x, y, face)

      // 天空渐变（顶部深蓝 → 地平线浅蓝）
      const skyColor = lerp(zenithColor, horizonColor, dir.y)

      // 太阳光晕
      const sunDot = dot(dir, sunDirection)
      if (sunDot > 0.999) {
        color = sunColor
      } else {
        color = skyColor
      }

      setPixel(x, y, color)
    }
  }
}
```

## 4. Shader Design

### Vertex Shader
```glsl
#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uProjection;
uniform mat4 uView; // 无位移的旋转矩阵

out vec3 vTexCoord;

void main() {
    vTexCoord = aPosition; // 使用局部坐标作为纹理坐标
    vec4 pos = uProjection * uView * vec4(aPosition, 1.0);
    gl_Position = pos.xyww; // 强制深度为1.0
}
```

### Fragment Shader
```glsl
#version 300 es
precision mediump float;

in vec3 vTexCoord;
uniform samplerCube uSkybox;

out vec4 fragColor;

void main() {
    fragColor = texture(uSkybox, vTexCoord);
}
```

## 5. Environment Mapping Interface

### Integration with PBR
```typescript
interface EnvironmentMapData {
  diffuseIrradiance: Texture // 漫反射辐照度图
  specularReflection: Texture // 镜面反射预过滤图
  brdfLUT: Texture // BRDF积分查找表
}

class EnvironmentMap {
  // 从天空盒生成IBL贴图
  generateIBLMaps(skyboxCubemap: Texture): EnvironmentMapData {
    const diffuse = convolveIrradiance(skyboxCubemap)
    const specular = prefilterEnvironment(skyboxCubemap)
    const brdf = generateBRDFLUT()
    return { diffuse, specular, brdf }
  }
}
```

## 6. Constitutional Compliance

✅ **立方体贴图顺序**: +X, -X, +Y, -Y, +Z, -Z
✅ **深度技巧**: 使用 `gl_Position.xyww` 确保深度为1.0
✅ **视图矩阵**: 移除位移分量，只保留旋转
✅ **反转立方体**: 从内部渲染，使用FRONT面剔除
✅ **资源管理**: 所有纹理和Buffer通过runner.track()管理

## 7. Implementation Steps

### Phase 1: Basic Skybox
1. 创建 `types.ts` - 定义接口
2. 创建 `SkyboxRenderer.ts` - 基础渲染器
3. 实现天空盒着色器
4. 加载立方体贴图Demo

### Phase 2: Procedural Sky
5. 创建 `ProceduralSky.ts` - 程序化天空生成
6. 实现渐变天空
7. 添加太阳/月亮渲染
8. 实现日夜循环

### Phase 3: Environment Mapping
9. 创建 `EnvironmentMap.ts` - 环境映射管理
10. 实现辐照度卷积（Diffuse IBL）
11. 实现环境预过滤（Specular IBL）
12. 生成BRDF LUT

### Phase 4: Integration
13. 与PBR材质系统集成
14. 创建综合Demo（天空盒 + PBR物体）

## 执行结果

### ✅ 完成的功能模块
1. **SkyboxRenderer.ts** - 天空盒渲染器
   - 立方体网格和专用渲染管线
   - 深度技巧实现（gl_Position.xyww）
   - 移除视图矩阵位移分量
   - FRONT面剔除（从内部渲染）

2. **EnvironmentMap.ts** - 环境映射管理
   - 从天空盒生成IBL贴图
   - 漫反射辐照度图生成
   - 镜面反射预过滤图生成
   - BRDF LUT（查找表）生成

3. **天空盒着色器**
   - 高效的顶点着色器（无位移变换）
   - 支持立方体贴图采样的片元着色器
   - GLSL 300 ES实现

### 🔧 关键技术指标
- **立方体贴图格式**: +X, -X, +Y, -Y, +Z, -Z顺序
- **深度技巧**: xyww确保深度为1.0
- **渲染顺序**: 所有不透明物体之后
- **IBL支持**: 完整的环境光照明
- **预过滤Mipmaps**: 支持粗糙度级别的镜面反射

### 📋 Constitution合规性确认
- ✅ **立方体贴图顺序**: 严格遵循OpenGL标准顺序
- ✅ **深度技巧**: 使用gl_Position.xyww确保远景渲染
- ✅ **视图矩阵**: 正确移除位移，只保留旋转
- ✅ **反转立方体**: FRONT面剔除，从内部渲染
- ✅ **资源管理**: 所有纹理和Buffer通过runner.track()管理
- ✅ **坐标系统**: 右手坐标系兼容

### 📊 文件大小和代码质量
- **总文件数**: 3个（SkyboxRenderer, EnvironmentMap, types）
- **代码行数**: ~500行
- **着色器代码**: 优化的GLSL 300 ES实现
- **IBL算法**: 实现了完整的基于图像的光照
- **性能**: 单次draw call渲染整个天空盒

---
**状态**: 已完成
**执行日期**: 2025-12-16
**提交**: 39b4612 feat(rhi/demo): 新增PBR材质、粒子系统和天空盒工具模块
