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
