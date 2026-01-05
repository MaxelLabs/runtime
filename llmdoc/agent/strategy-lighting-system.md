---
id: "strategy-lighting-system"
type: "strategy"
title: "多光源系统技术规格"
description: "Engine 包多光源系统的详细技术规格，包括 Light 组件设计、UBO 布局、着色器集成和实现步骤"
tags: ["engine", "lighting", "pbr", "shader", "ubo", "directional-light", "point-light", "spot-light"]
context_dependency: ["arch-engine-architecture-spec", "arch-engine-package"]
related_ids: ["strategy-shadow-system", "arch-engine-architecture-spec"]
last_updated: "2026-01-05"
---

# 多光源系统技术规格

> **Context**: Engine 包当前仅支持单个硬编码光源，需要扩展为支持多光源的完整光照系统。
> **Goal**: 实现支持 8 个光源同时渲染的多光源系统，包括方向光、点光源和聚光灯。

---

## 1. 设计目标

### 1.1 功能需求

| 需求 | 描述 | 优先级 |
|------|------|:------:|
| 多光源支持 | 同时支持最多 8 个光源 | P1 |
| 光源类型 | 方向光、点光源、聚光灯 | P1 |
| 光照衰减 | 点光源和聚光灯的距离衰减 | P1 |
| 聚光灯锥形 | 内外锥角的平滑过渡 | P1 |
| 阴影投射 | 光源可配置是否投射阴影 | P1 |
| 动态更新 | 运行时修改光源属性 | P1 |

### 1.2 性能目标

- 光源数据通过 UBO 批量传递，避免每帧多次 uniform 更新
- 着色器中使用循环处理多光源，支持编译时展开优化
- 光源数量动态可变，未使用的光源槽位不参与计算

---

## 2. 接口定义

### 2.1 光源类型枚举

```typescript
/**
 * 光源类型
 * @remarks 与着色器中的类型值对应
 */
enum LightType {
  /** 方向光 - 无位置，只有方向 */
  DIRECTIONAL = 0,
  /** 点光源 - 有位置，向所有方向发光 */
  POINT = 1,
  /** 聚光灯 - 有位置和方向，锥形发光 */
  SPOT = 2
}
```

### 2.2 Light 组件接口

```typescript
/**
 * Light 组件数据接口
 */
interface ILightData {
  /** 光源类型 */
  type: LightType;
  /** 光源颜色 RGB 归一化 */
  color: [number, number, number];
  /** 光源强度 */
  intensity: number;
  /** 是否投射阴影 */
  castShadow: boolean;
  
  // 方向光特有
  /** 光照方向 仅方向光 */
  direction?: Vector3Like;
  
  // 点光源/聚光灯特有
  /** 光源范围 仅点光源/聚光灯 */
  range?: number;
  /** 衰减指数 仅点光源/聚光灯 默认 2 */
  decay?: number;
  
  // 聚光灯特有
  /** 内锥角 弧度 仅聚光灯 */
  innerAngle?: number;
  /** 外锥角 弧度 仅聚光灯 */
  outerAngle?: number;
}

/**
 * Light 组件
 */
class Light extends Component implements ILightData {
  type: LightType = LightType.DIRECTIONAL;
  color: [number, number, number] = [1, 1, 1];
  intensity: number = 1;
  castShadow: boolean = false;
  direction: Vector3Like = { x: 0, y: -1, z: 0 };
  range: number = 10;
  decay: number = 2;
  innerAngle: number = Math.PI / 6;  // 30 度
  outerAngle: number = Math.PI / 4;  // 45 度
  
  static fromData(data: Partial<ILightData>): Light;
  clone(): Light;
}
```

### 2.3 便捷工厂方法

```typescript
// Engine 类扩展
class Engine {
  /**
   * 创建方向光
   */
  createDirectionalLight(config?: {
    direction?: [number, number, number];
    color?: [number, number, number];
    intensity?: number;
    castShadow?: boolean;
  }): EntityId;
  
  /**
   * 创建点光源
   */
  createPointLight(config?: {
    position?: [number, number, number];
    color?: [number, number, number];
    intensity?: number;
    range?: number;
    decay?: number;
    castShadow?: boolean;
  }): EntityId;
  
  /**
   * 创建聚光灯
   */
  createSpotLight(config?: {
    position?: [number, number, number];
    direction?: [number, number, number];
    color?: [number, number, number];
    intensity?: number;
    range?: number;
    innerAngle?: number;
    outerAngle?: number;
    castShadow?: boolean;
  }): EntityId;
}
```

---

## 3. UBO 布局设计

### 3.1 std140 布局规范

```glsl
// 光照 UBO - binding 3
// 最大支持 MAX_LIGHTS = 8 个光源
layout(std140) uniform LightsUBO {
  // 每个光源的颜色和强度
  // xyz = RGB 颜色, w = 强度
  vec4 u_lightColors[8];       // offset 0,   size 128
  
  // 每个光源的位置和类型
  // xyz = 位置 方向光忽略, w = 类型 0=dir, 1=point, 2=spot
  vec4 u_lightPositions[8];    // offset 128, size 128
  
  // 每个光源的方向和范围
  // xyz = 方向 点光源忽略, w = 范围 方向光忽略
  vec4 u_lightDirections[8];   // offset 256, size 128
  
  // 每个光源的额外参数
  // x = 内锥角余弦, y = 外锥角余弦, z = 衰减指数, w = 阴影索引 -1表示无阴影
  vec4 u_lightParams[8];       // offset 384, size 128
  
  // 当前活跃光源数量
  uint u_lightCount;           // offset 512, size 4
  vec3 _pad;                   // offset 516, size 12 padding
};  // Total: 528 bytes
```

### 3.2 TypeScript 数据结构

```typescript
/**
 * 光照 UBO 数据
 */
interface LightsUBOData {
  lightColors: Float32Array;      // 32 floats = 8 * vec4
  lightPositions: Float32Array;   // 32 floats
  lightDirections: Float32Array;  // 32 floats
  lightParams: Float32Array;      // 32 floats
  lightCount: number;
}

const MAX_LIGHTS = 8;
const LIGHTS_UBO_SIZE = 528; // bytes

/**
 * 创建光照 UBO 数据
 */
function createLightsUBOData(): LightsUBOData {
  return {
    lightColors: new Float32Array(32),
    lightPositions: new Float32Array(32),
    lightDirections: new Float32Array(32),
    lightParams: new Float32Array(32),
    lightCount: 0
  };
}
```

---

## 4. 着色器实现

### 4.1 光照计算函数

```glsl
// ==================== 光照计算函数 ====================

/**
 * 计算方向光贡献
 */
vec3 calculateDirectionalLight(
  int index,
  vec3 N,           // 法线
  vec3 V,           // 视线方向
  vec3 albedo,
  float metallic,
  float roughness
) {
  vec3 lightColor = u_lightColors[index].rgb;
  float intensity = u_lightColors[index].w;
  vec3 L = normalize(-u_lightDirections[index].xyz);
  
  return calculatePBRLight(N, V, L, lightColor * intensity, albedo, metallic, roughness);
}

/**
 * 计算点光源贡献
 */
vec3 calculatePointLight(
  int index,
  vec3 worldPos,
  vec3 N,
  vec3 V,
  vec3 albedo,
  float metallic,
  float roughness
) {
  vec3 lightColor = u_lightColors[index].rgb;
  float intensity = u_lightColors[index].w;
  vec3 lightPos = u_lightPositions[index].xyz;
  float range = u_lightDirections[index].w;
  float decay = u_lightParams[index].z;
  
  vec3 L = lightPos - worldPos;
  float distance = length(L);
  L = normalize(L);
  
  // 距离衰减
  float attenuation = pow(max(1.0 - distance / range, 0.0), decay);
  
  return calculatePBRLight(N, V, L, lightColor * intensity * attenuation, albedo, metallic, roughness);
}

/**
 * 计算聚光灯贡献
 */
vec3 calculateSpotLight(
  int index,
  vec3 worldPos,
  vec3 N,
  vec3 V,
  vec3 albedo,
  float metallic,
  float roughness
) {
  vec3 lightColor = u_lightColors[index].rgb;
  float intensity = u_lightColors[index].w;
  vec3 lightPos = u_lightPositions[index].xyz;
  vec3 lightDir = normalize(u_lightDirections[index].xyz);
  float range = u_lightDirections[index].w;
  float innerCos = u_lightParams[index].x;
  float outerCos = u_lightParams[index].y;
  float decay = u_lightParams[index].z;
  
  vec3 L = lightPos - worldPos;
  float distance = length(L);
  L = normalize(L);
  
  // 距离衰减
  float distanceAttenuation = pow(max(1.0 - distance / range, 0.0), decay);
  
  // 锥形衰减
  float theta = dot(L, -lightDir);
  float spotAttenuation = smoothstep(outerCos, innerCos, theta);
  
  float attenuation = distanceAttenuation * spotAttenuation;
  
  return calculatePBRLight(N, V, L, lightColor * intensity * attenuation, albedo, metallic, roughness);
}

/**
 * 计算所有光源的总贡献
 */
vec3 calculateAllLights(
  vec3 worldPos,
  vec3 N,
  vec3 V,
  vec3 albedo,
  float metallic,
  float roughness
) {
  vec3 totalLight = vec3(0.0);
  
  for (int i = 0; i < int(u_lightCount); i++) {
    int lightType = int(u_lightPositions[i].w);
    
    if (lightType == 0) {
      // 方向光
      totalLight += calculateDirectionalLight(i, N, V, albedo, metallic, roughness);
    } else if (lightType == 1) {
      // 点光源
      totalLight += calculatePointLight(i, worldPos, N, V, albedo, metallic, roughness);
    } else if (lightType == 2) {
      // 聚光灯
      totalLight += calculateSpotLight(i, worldPos, N, V, albedo, metallic, roughness);
    }
  }
  
  return totalLight;
}
```

### 4.2 PBR 光照核心函数

```glsl
// ==================== PBR 核心函数 ====================

const float PI = 3.14159265359;

/**
 * Fresnel-Schlick 近似
 */
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

/**
 * GGX 法线分布函数
 */
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

/**
 * Schlick-GGX 几何函数
 */
float geometrySchlickGGX(float NdotV, float roughness) {
  float r = roughness + 1.0;
  float k = (r * r) / 8.0;
  
  float num = NdotV;
  float denom = NdotV * (1.0 - k) + k;
  
  return num / denom;
}

/**
 * Smith 几何函数
 */
float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  float ggx2 = geometrySchlickGGX(NdotV, roughness);
  float ggx1 = geometrySchlickGGX(NdotL, roughness);
  
  return ggx1 * ggx2;
}

/**
 * 计算单个光源的 PBR 贡献
 */
vec3 calculatePBRLight(
  vec3 N,
  vec3 V,
  vec3 L,
  vec3 radiance,
  vec3 albedo,
  float metallic,
  float roughness
) {
  vec3 H = normalize(V + L);
  
  // 基础反射率
  vec3 F0 = vec3(0.04);
  F0 = mix(F0, albedo, metallic);
  
  // Cook-Torrance BRDF
  float NDF = distributionGGX(N, H, roughness);
  float G = geometrySmith(N, V, L, roughness);
  vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
  
  vec3 numerator = NDF * G * F;
  float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
  vec3 specular = numerator / denominator;
  
  // 能量守恒
  vec3 kS = F;
  vec3 kD = vec3(1.0) - kS;
  kD *= 1.0 - metallic;
  
  float NdotL = max(dot(N, L), 0.0);
  
  return (kD * albedo / PI + specular) * radiance * NdotL;
}
```

---

## 5. 渲染器集成

### 5.1 SimpleWebGLRenderer 扩展

```pseudocode
CLASS SimpleWebGLRenderer:
  // 新增属性
  PRIVATE lightsBuffer: IRHIBuffer
  PRIVATE lightsBindGroupLayout: IRHIBindGroupLayout
  PRIVATE lightsBindGroup: IRHIBindGroup
  PRIVATE lightsUBOData: LightsUBOData
  
  FUNCTION initRHIResources():
    // ... 现有初始化 ...
    
    // 创建光照 UBO
    lightsBuffer = device.createBuffer({
      size: LIGHTS_UBO_SIZE,
      usage: UNIFORM,
      hint: 'dynamic',
      label: 'LightsUBO'
    })
    
    // 创建光照绑定组布局
    lightsBindGroupLayout = device.createBindGroupLayout([
      {
        binding: 3,
        visibility: FRAGMENT,
        buffer: { type: 'uniform' },
        name: 'LightsUBO'
      }
    ])
    
    // 创建光照绑定组
    lightsBindGroup = device.createBindGroup(
      lightsBindGroupLayout,
      [{ binding: 3, resource: { buffer: lightsBuffer } }]
    )
    
    // 更新管线布局
    pipelineLayout = device.createPipelineLayout([
      matricesBindGroupLayout,
      materialBindGroupLayout,
      lightsBindGroupLayout  // 新增
    ])
  
  FUNCTION render(ctx: RenderContext):
    // 1. 收集场景中的光源
    lights = collectLights(ctx.scene.world)
    
    // 2. 更新光照 UBO
    updateLightsUBO(lights)
    
    // 3. 渲染循环中绑定光照 BindGroup
    renderPass.setBindGroup(2, lightsBindGroup)
    
    // ... 其余渲染逻辑 ...
  
  FUNCTION collectLights(world: World): Light[]:
    query = world.query({ all: [Light, WorldTransform] })
    lights = []
    
    query.forEach((entity, components) => {
      light = components[0] as Light
      transform = components[1] as WorldTransform
      lights.push({ light, transform })
    })
    
    world.removeQuery(query)
    RETURN lights.slice(0, MAX_LIGHTS)
  
  FUNCTION updateLightsUBO(lights: LightWithTransform[]):
    data = lightsUBOData
    data.lightCount = lights.length
    
    FOR i = 0 TO lights.length - 1:
      light = lights[i].light
      transform = lights[i].transform
      
      // 颜色和强度
      data.lightColors[i * 4 + 0] = light.color[0]
      data.lightColors[i * 4 + 1] = light.color[1]
      data.lightColors[i * 4 + 2] = light.color[2]
      data.lightColors[i * 4 + 3] = light.intensity
      
      // 位置和类型
      data.lightPositions[i * 4 + 0] = transform.position.x
      data.lightPositions[i * 4 + 1] = transform.position.y
      data.lightPositions[i * 4 + 2] = transform.position.z
      data.lightPositions[i * 4 + 3] = light.type
      
      // 方向和范围
      IF light.type == DIRECTIONAL:
        dir = normalizeDirection(light.direction)
      ELSE:
        dir = getForwardFromRotation(transform.rotation)
      
      data.lightDirections[i * 4 + 0] = dir.x
      data.lightDirections[i * 4 + 1] = dir.y
      data.lightDirections[i * 4 + 2] = dir.z
      data.lightDirections[i * 4 + 3] = light.range
      
      // 额外参数
      data.lightParams[i * 4 + 0] = cos(light.innerAngle)
      data.lightParams[i * 4 + 1] = cos(light.outerAngle)
      data.lightParams[i * 4 + 2] = light.decay
      data.lightParams[i * 4 + 3] = light.castShadow ? shadowIndex : -1
    
    // 上传到 GPU
    lightsBuffer.update(packLightsUBO(data))
```

---

## 6. 实现步骤

### 6.1 Step 1: 创建 Light 组件

**文件**: `packages/engine/src/components/light.ts`

```typescript
// 1. 定义 LightType 枚举
// 2. 定义 ILightData 接口
// 3. 实现 Light 组件类
// 4. 实现 fromData() 和 clone() 方法
// 5. 导出到 components/index.ts
```

### 6.2 Step 2: 创建光照 UBO 管理

**文件**: `packages/engine/src/renderers/lights-ubo.ts`

```typescript
// 1. 定义 LightsUBOData 接口
// 2. 实现 createLightsUBOData() 函数
// 3. 实现 packLightsUBO() 函数
// 4. 实现 updateLightsUBO() 函数
```

### 6.3 Step 3: 更新着色器

**文件**: `packages/engine/src/renderers/shaders.ts`

```typescript
// 1. 添加 LightsUBO uniform block
// 2. 添加 PBR 光照计算函数
// 3. 添加多光源循环计算
// 4. 更新片段着色器主函数
```

### 6.4 Step 4: 扩展 SimpleWebGLRenderer

**文件**: `packages/engine/src/renderers/simple-webgl-renderer.ts`

```typescript
// 1. 添加光照相关属性
// 2. 在 initRHIResources() 中创建光照 UBO
// 3. 在 render() 中收集光源并更新 UBO
// 4. 在渲染循环中绑定光照 BindGroup
```

### 6.5 Step 5: 扩展 Engine 便捷 API

**文件**: `packages/engine/src/engine/engine.ts`

```typescript
// 1. 注册 Light 组件
// 2. 实现 createDirectionalLight()
// 3. 实现 createPointLight()
// 4. 实现 createSpotLight()
```

### 6.6 Step 6: 更新 Demo

**文件**: `packages/engine/demo/src/quick-start.ts`

```typescript
// 1. 添加多个光源示例
// 2. 演示不同光源类型
// 3. 演示动态修改光源属性
```

---

## 7. 验证标准

### 7.1 功能验证

- [ ] 方向光正确照亮场景
- [ ] 点光源有正确的距离衰减
- [ ] 聚光灯有正确的锥形衰减
- [ ] 多个光源可以同时工作
- [ ] 光源颜色和强度可以动态修改
- [ ] 光源位置和方向可以动态修改

### 7.2 性能验证

- [ ] 8 个光源同时渲染时帧率稳定
- [ ] UBO 更新不会造成明显卡顿
- [ ] 未使用的光源槽位不影响性能

### 7.3 兼容性验证

- [ ] WebGL 1.0 回退正常工作
- [ ] WebGL 2.0 UBO 正常工作
- [ ] 移动设备上正常运行

---

## 8. 禁止事项

- 🚫 **每帧创建新的 UBO** - 必须复用预创建的缓冲区
- 🚫 **硬编码光源数量** - 使用 MAX_LIGHTS 常量
- 🚫 **忽略 std140 对齐** - 严格遵循 std140 布局规则
- 🚫 **在着色器中使用动态数组** - WebGL 不支持
- 🚫 **跳过光源类型检查** - 必须根据类型选择正确的计算函数

---

## 9. 相关文档

- [Engine 架构规格](../architecture/engine-architecture-spec.md)
- [阴影系统策略](./strategy-shadow-system.md)
- [着色器编译器](../architecture/shader-compiler.md)