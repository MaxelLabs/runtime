---
id: "strategy-shadow-system"
type: "strategy"
title: "阴影系统技术规格"
description: "Engine 包阴影系统的详细技术规格，包括 ShadowPass 设计、阴影矩阵计算、PCF 软阴影和 CSM 级联阴影"
tags: ["engine", "shadow", "shadow-map", "pcf", "csm", "depth", "rendering"]
context_dependency: ["arch-engine-architecture-spec", "strategy-lighting-system"]
related_ids: ["strategy-lighting-system", "arch-engine-architecture-spec"]
last_updated: "2026-01-05"
---

# 阴影系统技术规格

> **Context**: Engine 包需要实现阴影系统以增强场景真实感。
> **Goal**: 实现基于阴影贴图的阴影系统，支持 PCF 软阴影和 CSM 级联阴影。

---

## 1. 设计目标

### 1.1 功能需求

| 需求 | 描述 | 优先级 |
|------|------|:------:|
| 方向光阴影 | 方向光的阴影贴图渲染 | P1 |
| PCF 软阴影 | 百分比近似过滤软阴影 | P1 |
| 阴影偏移 | 深度偏移和法线偏移 | P1 |
| CSM 级联阴影 | 级联阴影贴图 | P2 |
| 点光源阴影 | 立方体阴影贴图 | P2 |
| 聚光灯阴影 | 透视阴影贴图 | P2 |

### 1.2 性能目标

- 阴影贴图分辨率可配置 512/1024/2048/4096
- 单个方向光阴影渲染开销 < 2ms
- CSM 4 级联总开销 < 5ms
- 支持阴影贴图缓存和复用

---

## 2. 接口定义

### 2.1 阴影配置接口

```typescript
/**
 * 阴影配置
 */
interface ShadowConfig {
  /** 是否启用阴影 */
  enabled: boolean;
  /** 阴影贴图尺寸 默认 1024 */
  mapSize: number;
  /** 深度偏移 默认 0.005 */
  bias: number;
  /** 法线偏移 默认 0.02 */
  normalBias: number;
  /** PCF 采样半径 默认 1 */
  radius: number;
  /** PCF 采样数 默认 9 */
  samples: number;
  /** CSM 级联数 默认 4 */
  cascades: number;
  /** CSM 分割模式 */
  cascadeSplitMode: 'uniform' | 'logarithmic' | 'practical';
  /** CSM 分割 lambda 实用分割模式参数 */
  cascadeSplitLambda: number;
}

/**
 * 默认阴影配置
 */
const DEFAULT_SHADOW_CONFIG: ShadowConfig = {
  enabled: true,
  mapSize: 1024,
  bias: 0.005,
  normalBias: 0.02,
  radius: 1,
  samples: 9,
  cascades: 4,
  cascadeSplitMode: 'practical',
  cascadeSplitLambda: 0.5
};
```

### 2.2 ShadowPass 接口

```typescript
/**
 * 阴影通道接口
 */
interface IShadowPass {
  /** 阴影贴图纹理 */
  shadowMap: IRHITexture;
  /** 阴影贴图视图 */
  shadowMapView: IRHITextureView;
  /** 光源视图投影矩阵 */
  lightViewProjection: Float32Array;
  /** 阴影配置 */
  config: ShadowConfig;
  
  /**
   * 渲染阴影贴图
   * @param scene 场景
   * @param light 光源
   * @param camera 主相机 用于 CSM 计算
   */
  render(scene: Scene, light: Light, camera?: Camera): void;
  
  /**
   * 获取阴影矩阵
   * @param cascadeIndex CSM 级联索引
   */
  getShadowMatrix(cascadeIndex?: number): Float32Array;
  
  /**
   * 获取级联分割距离
   */
  getCascadeSplits(): Float32Array;
  
  /**
   * 调整阴影贴图尺寸
   */
  resize(mapSize: number): void;
  
  /**
   * 释放资源
   */
  dispose(): void;
}
```

### 2.3 ShadowCaster 组件

```typescript
/**
 * 阴影投射组件
 * 标记实体是否投射阴影
 */
class ShadowCaster extends Component {
  /** 是否投射阴影 */
  castShadow: boolean = true;
  
  static fromData(data: Partial<{ castShadow: boolean }>): ShadowCaster;
  clone(): ShadowCaster;
}

/**
 * 阴影接收组件
 * 标记实体是否接收阴影
 */
class ShadowReceiver extends Component {
  /** 是否接收阴影 */
  receiveShadow: boolean = true;
  
  static fromData(data: Partial<{ receiveShadow: boolean }>): ShadowReceiver;
  clone(): ShadowReceiver;
}
```

---

## 3. 阴影矩阵计算

### 3.1 方向光阴影矩阵

```pseudocode
/**
 * 计算方向光的光源空间矩阵
 * @param light 方向光
 * @param sceneBounds 场景包围盒
 * @returns 光源视图投影矩阵
 */
FUNCTION calculateDirectionalLightMatrix(light: DirectionalLight, sceneBounds: BoundingBox): Float32Array
  // 1. 计算光源方向
  lightDir = normalize(light.direction)
  
  // 2. 构建光源坐标系
  // 选择一个不与光源方向平行的向上向量
  IF abs(lightDir.y) < 0.99:
    worldUp = vec3(0, 1, 0)
  ELSE:
    worldUp = vec3(0, 0, 1)
  
  lightRight = normalize(cross(worldUp, lightDir))
  lightUp = cross(lightDir, lightRight)
  
  // 3. 计算场景中心
  sceneCenter = (sceneBounds.min + sceneBounds.max) * 0.5
  
  // 4. 计算光源位置 在场景后方
  lightDistance = length(sceneBounds.max - sceneBounds.min)
  lightPos = sceneCenter - lightDir * lightDistance
  
  // 5. 构建视图矩阵
  viewMatrix = createLookAt(lightPos, sceneCenter, lightUp)
  
  // 6. 将场景包围盒变换到光源空间
  lightSpaceBounds = transformBounds(sceneBounds, viewMatrix)
  
  // 7. 构建正交投影矩阵
  projMatrix = createOrthographic(
    lightSpaceBounds.min.x, lightSpaceBounds.max.x,
    lightSpaceBounds.min.y, lightSpaceBounds.max.y,
    -lightSpaceBounds.max.z, -lightSpaceBounds.min.z
  )
  
  // 8. 返回光源视图投影矩阵
  RETURN multiply(projMatrix, viewMatrix)
```

### 3.2 CSM 级联分割计算

```pseudocode
/**
 * 计算 CSM 级联分割距离
 * @param near 相机近平面
 * @param far 相机远平面
 * @param cascades 级联数量
 * @param lambda 分割参数 0=均匀 1=对数
 * @returns 分割距离数组
 */
FUNCTION calculateCascadeSplits(near: number, far: number, cascades: number, lambda: number): number[]
  splits = []
  
  FOR i = 1 TO cascades:
    // 均匀分割
    uniformSplit = near + (far - near) * (i / cascades)
    
    // 对数分割
    logSplit = near * pow(far / near, i / cascades)
    
    // 实用分割 混合均匀和对数
    practicalSplit = lambda * logSplit + (1 - lambda) * uniformSplit
    
    splits.push(practicalSplit)
  
  RETURN splits

/**
 * 计算单个级联的光源矩阵
 * @param light 方向光
 * @param camera 主相机
 * @param nearSplit 近分割距离
 * @param farSplit 远分割距离
 * @returns 光源视图投影矩阵
 */
FUNCTION calculateCascadeMatrix(
  light: DirectionalLight,
  camera: Camera,
  nearSplit: number,
  farSplit: number
): Float32Array
  // 1. 计算该级联的视锥体角点
  frustumCorners = calculateFrustumCorners(camera, nearSplit, farSplit)
  
  // 2. 计算视锥体中心
  frustumCenter = calculateCenter(frustumCorners)
  
  // 3. 计算光源视图矩阵
  lightDir = normalize(light.direction)
  lightView = createLookAt(
    frustumCenter - lightDir * 100,  // 光源位置
    frustumCenter,                    // 目标
    vec3(0, 1, 0)                     // 上向量
  )
  
  // 4. 将视锥体角点变换到光源空间
  lightSpaceCorners = []
  FOR corner IN frustumCorners:
    lightSpaceCorners.push(transform(corner, lightView))
  
  // 5. 计算光源空间包围盒
  minX = minY = minZ = Infinity
  maxX = maxY = maxZ = -Infinity
  FOR corner IN lightSpaceCorners:
    minX = min(minX, corner.x)
    maxX = max(maxX, corner.x)
    minY = min(minY, corner.y)
    maxY = max(maxY, corner.y)
    minZ = min(minZ, corner.z)
    maxZ = max(maxZ, corner.z)
  
  // 6. 扩展 Z 范围以包含阴影投射物
  zExtension = 100
  minZ -= zExtension
  
  // 7. 构建正交投影矩阵
  lightProj = createOrthographic(minX, maxX, minY, maxY, -maxZ, -minZ)
  
  RETURN multiply(lightProj, lightView)
```

---

## 4. 着色器实现

### 4.1 阴影 UBO 布局

```glsl
// 阴影 UBO - binding 4
layout(std140) uniform ShadowUBO {
  // CSM 级联的光源视图投影矩阵
  mat4 u_shadowMatrices[4];    // offset 0,   size 256
  
  // 阴影参数
  // x = bias, y = normalBias, z = radius, w = mapSize
  vec4 u_shadowParams;         // offset 256, size 16
  
  // CSM 级联分割距离
  vec4 u_cascadeSplits;        // offset 272, size 16
};  // Total: 288 bytes
```

### 4.2 阴影采样函数

```glsl
// 阴影贴图采样器
uniform sampler2D u_shadowMap;

/**
 * 基础阴影采样
 */
float sampleShadow(vec3 shadowCoord) {
  float depth = texture(u_shadowMap, shadowCoord.xy).r;
  return shadowCoord.z > depth ? 0.0 : 1.0;
}

/**
 * PCF 软阴影采样
 * @param shadowCoord 阴影空间坐标
 * @param radius PCF 采样半径
 * @param mapSize 阴影贴图尺寸
 */
float sampleShadowPCF(vec3 shadowCoord, float radius, float mapSize) {
  float shadow = 0.0;
  float texelSize = 1.0 / mapSize;
  
  // 3x3 PCF
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 offset = vec2(float(x), float(y)) * texelSize * radius;
      float depth = texture(u_shadowMap, shadowCoord.xy + offset).r;
      shadow += shadowCoord.z > depth ? 0.0 : 1.0;
    }
  }
  
  return shadow / 9.0;
}

/**
 * 计算阴影坐标
 * @param worldPos 世界空间位置
 * @param normal 世界空间法线
 * @param cascadeIndex CSM 级联索引
 */
vec3 calculateShadowCoord(vec3 worldPos, vec3 normal, int cascadeIndex) {
  // 应用法线偏移
  vec3 biasedPos = worldPos + normal * u_shadowParams.y;
  
  // 变换到光源空间
  vec4 shadowPos = u_shadowMatrices[cascadeIndex] * vec4(biasedPos, 1.0);
  
  // 透视除法
  vec3 shadowCoord = shadowPos.xyz / shadowPos.w;
  
  // 变换到 [0, 1] 范围
  shadowCoord = shadowCoord * 0.5 + 0.5;
  
  // 应用深度偏移
  shadowCoord.z -= u_shadowParams.x;
  
  return shadowCoord;
}

/**
 * 选择 CSM 级联
 * @param viewZ 视图空间 Z 坐标
 */
int selectCascade(float viewZ) {
  for (int i = 0; i < 4; i++) {
    if (viewZ < u_cascadeSplits[i]) {
      return i;
    }
  }
  return 3;
}

/**
 * 计算阴影因子
 * @param worldPos 世界空间位置
 * @param normal 世界空间法线
 * @param viewZ 视图空间 Z 坐标
 */
float calculateShadow(vec3 worldPos, vec3 normal, float viewZ) {
  // 选择级联
  int cascade = selectCascade(viewZ);
  
  // 计算阴影坐标
  vec3 shadowCoord = calculateShadowCoord(worldPos, normal, cascade);
  
  // 边界检查
  if (shadowCoord.x < 0.0 || shadowCoord.x > 1.0 ||
      shadowCoord.y < 0.0 || shadowCoord.y > 1.0 ||
      shadowCoord.z < 0.0 || shadowCoord.z > 1.0) {
    return 1.0;  // 不在阴影范围内
  }
  
  // PCF 采样
  return sampleShadowPCF(shadowCoord, u_shadowParams.z, u_shadowParams.w);
}
```

---

## 5. ShadowPass 实现

### 5.1 类结构

```pseudocode
CLASS ShadowPass IMPLEMENTS IShadowPass:
  // RHI 资源
  PRIVATE device: IRHIDevice
  PRIVATE shadowMap: IRHITexture
  PRIVATE shadowMapView: IRHITextureView
  PRIVATE depthPipeline: IRHIRenderPipeline
  PRIVATE depthShader: IRHIShaderModule
  
  // 阴影数据
  PRIVATE config: ShadowConfig
  PRIVATE shadowMatrices: Float32Array[4]
  PRIVATE cascadeSplits: Float32Array
  
  // UBO
  PRIVATE shadowUBO: IRHIBuffer
  PRIVATE shadowBindGroup: IRHIBindGroup
  
  CONSTRUCTOR(device: IRHIDevice, config?: Partial<ShadowConfig>):
    this.device = device
    this.config = { ...DEFAULT_SHADOW_CONFIG, ...config }
    this.initResources()
  
  PRIVATE FUNCTION initResources():
    // 1. 创建阴影贴图
    shadowMap = device.createTexture({
      width: config.mapSize,
      height: config.mapSize,
      format: DEPTH32_FLOAT,
      usage: RENDER_ATTACHMENT | SAMPLED,
      label: 'ShadowMap'
    })
    shadowMapView = shadowMap.createView()
    
    // 2. 创建深度着色器
    depthShader = device.createShaderModule({
      code: DEPTH_ONLY_SHADER,
      language: 'glsl',
      stage: VERTEX
    })
    
    // 3. 创建深度渲染管线
    depthPipeline = device.createRenderPipeline({
      vertexShader: depthShader,
      fragmentShader: null,  // 仅深度
      vertexLayout: STANDARD_VERTEX_LAYOUT,
      depthStencilState: {
        format: DEPTH32_FLOAT,
        depthWriteEnabled: true,
        depthCompare: LESS
      },
      rasterizationState: {
        cullMode: FRONT,  // 背面剔除减少 Peter Panning
        depthBias: config.bias,
        depthBiasSlopeScale: 2.0
      }
    })
    
    // 4. 创建阴影 UBO
    shadowUBO = device.createBuffer({
      size: SHADOW_UBO_SIZE,
      usage: UNIFORM,
      hint: 'dynamic'
    })
  
  FUNCTION render(scene: Scene, light: Light, camera?: Camera):
    IF light.type != DIRECTIONAL:
      RETURN  // 暂只支持方向光
    
    // 1. 计算阴影矩阵
    IF camera AND config.cascades > 1:
      // CSM 模式
      splits = calculateCascadeSplits(camera.near, camera.far, config.cascades, config.cascadeSplitLambda)
      cascadeSplits = new Float32Array(splits)
      
      prevSplit = camera.near
      FOR i = 0 TO config.cascades - 1:
        shadowMatrices[i] = calculateCascadeMatrix(light, camera, prevSplit, splits[i])
        prevSplit = splits[i]
    ELSE:
      // 单阴影贴图模式
      sceneBounds = calculateSceneBounds(scene)
      shadowMatrices[0] = calculateDirectionalLightMatrix(light, sceneBounds)
    
    // 2. 更新阴影 UBO
    updateShadowUBO()
    
    // 3. 渲染阴影贴图
    encoder = device.createCommandEncoder()
    
    renderPass = encoder.beginRenderPass({
      colorAttachments: [],
      depthStencilAttachment: {
        view: shadowMapView,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        clearDepth: 1.0
      }
    })
    
    renderPass.setPipeline(depthPipeline)
    
    // 查询所有阴影投射物
    query = scene.world.query({ all: [MeshInstance, WorldTransform, ShadowCaster] })
    
    query.forEach((entity, components) => {
      meshInstance = components[0]
      worldTransform = components[1]
      shadowCaster = components[2]
      
      IF NOT shadowCaster.castShadow:
        RETURN
      
      // 更新模型矩阵
      modelMatrix = buildModelMatrix(worldTransform)
      // ... 绘制
    })
    
    renderPass.end()
    device.submit([encoder.finish()])
  
  PRIVATE FUNCTION updateShadowUBO():
    data = new Float32Array(72)  // 288 / 4
    
    // 阴影矩阵
    FOR i = 0 TO 3:
      data.set(shadowMatrices[i], i * 16)
    
    // 阴影参数
    data[64] = config.bias
    data[65] = config.normalBias
    data[66] = config.radius
    data[67] = config.mapSize
    
    // 级联分割
    data[68] = cascadeSplits[0] || 0
    data[69] = cascadeSplits[1] || 0
    data[70] = cascadeSplits[2] || 0
    data[71] = cascadeSplits[3] || 0
    
    shadowUBO.update(data)
```

---

## 6. 实现步骤

### 6.1 Step 1: 创建 ShadowCaster/ShadowReceiver 组件

**文件**: `packages/engine/src/components/shadow.ts`

### 6.2 Step 2: 创建深度着色器

**文件**: `packages/engine/src/renderers/shaders/depth.glsl`

### 6.3 Step 3: 实现 ShadowPass 类

**文件**: `packages/engine/src/passes/shadow-pass.ts`

### 6.4 Step 4: 集成到渲染器

**文件**: `packages/engine/src/renderers/simple-webgl-renderer.ts`

### 6.5 Step 5: 更新主着色器

**文件**: `packages/engine/src/renderers/shaders.ts`

---

## 7. 验证标准

- [ ] 方向光阴影正确投射
- [ ] PCF 软阴影边缘平滑
- [ ] 无明显 Peter Panning 现象
- [ ] 无明显阴影痤疮
- [ ] CSM 级联过渡平滑
- [ ] 阴影贴图分辨率可调

---

## 8. 禁止事项

- 🚫 **每帧重新创建阴影贴图** - 必须复用
- 🚫 **忽略深度偏移** - 会导致阴影痤疮
- 🚫 **使用前面剔除** - 会导致 Peter Panning
- 🚫 **硬编码级联数量** - 使用配置

---

## 9. 相关文档

- [多光源系统策略](./strategy-lighting-system.md)
- [Engine 架构规格](../architecture/engine-architecture-spec.md)