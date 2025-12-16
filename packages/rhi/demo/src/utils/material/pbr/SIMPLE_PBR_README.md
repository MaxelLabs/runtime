# SimplePBRMaterial - 简化版PBR材质工具

## 概述

`SimplePBRMaterial` 是基于 `demo/src/pbr-material.ts` 中已验证可工作的PBR实现提取的工具类。它提供了一个简单、易用的API来创建和管理PBR材质。

## 特性

- **简单的Uniform Buffer方案**：使用std140布局的Uniform Block
- **Cook-Torrance BRDF模型**：完整的物理渲染管线
- **环境贴图直接采样**：无需复杂的IBL预计算
- **支持最多2个点光源**：简化的光源系统
- **HDR色调映射 + Gamma校正**：正确的颜色空间处理

## 文件结构

```
demo/src/utils/material/pbr/
├── SimplePBRMaterial.ts    # 材质类（封装Pipeline、Buffer、BindGroup）
├── SimplePBRShaders.ts     # 着色器代码（顶点和片段着色器）
├── SimplePBRTypes.ts       # 类型定义
└── SIMPLE_PBR_README.md    # 本文档
```

## 使用示例

### 基础用法

```typescript
import { SimplePBRMaterial } from './utils/material/pbr';
import type { SimplePBRMaterialParams, SimplePBRLightParams } from './utils/material/pbr';

// 1. 定义材质参数
const materialParams: SimplePBRMaterialParams = {
  albedo: [1.0, 0.0, 0.0],  // 红色
  metallic: 0.5,
  roughness: 0.5,
  ambientStrength: 0.03,
};

// 2. 定义光源参数（最多2个）
const lightParams: SimplePBRLightParams[] = [
  {
    position: [3.0, 3.0, 3.0],
    color: [1.0, 1.0, 1.0],
    constant: 1.0,
    linear: 0.09,
    quadratic: 0.032,
  },
];

// 3. 创建材质
const pbrMaterial = new SimplePBRMaterial(device, materialParams, lightParams);

// 4. 初始化（加载环境贴图）
await pbrMaterial.initialize({
  posX: '../assets/cube/Bridge2/posx.jpg',
  negX: '../assets/cube/Bridge2/negx.jpg',
  posY: '../assets/cube/Bridge2/posy.jpg',
  negY: '../assets/cube/Bridge2/negy.jpg',
  posZ: '../assets/cube/Bridge2/posz.jpg',
  negZ: '../assets/cube/Bridge2/negz.jpg',
});

// 5. 渲染循环
runner.start((dt) => {
  // 更新材质参数
  pbrMaterial.setMaterialParams({ metallic: 0.8 });
  pbrMaterial.update();

  // 更新变换矩阵
  pbrMaterial.updateTransforms(
    modelMatrix,
    viewMatrix,
    projMatrix,
    normalMatrix,
    cameraPos
  );

  // 渲染
  const renderPass = encoder.beginRenderPass(passDescriptor);
  pbrMaterial.bind(renderPass);
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.setIndexBuffer(indexBuffer, indexFormat);
  renderPass.drawIndexed(indexCount);
  renderPass.end();
});
```

## API 文档

### SimplePBRMaterial

#### 构造函数

```typescript
constructor(
  device: IRHIDevice,
  materialParams: SimplePBRMaterialParams,
  lightParams?: SimplePBRLightParams[]
)
```

#### 方法

##### `initialize(cubemapUrls): Promise<void>`

初始化材质资源，加载环境贴图。

**参数：**
- `cubemapUrls`: 环境贴图的6个面的URL

##### `setMaterialParams(params: Partial<SimplePBRMaterialParams>): void`

更新材质参数。

**参数：**
- `params`: 要更新的材质参数（部分更新）

##### `setLights(lights: SimplePBRLightParams[]): void`

更新光源参数。

**参数：**
- `lights`: 光源数组（最多2个）

##### `updateTransforms(...): void`

更新变换矩阵和相机数据。

**参数：**
- `modelMatrix`: 模型矩阵
- `viewMatrix`: 视图矩阵
- `projMatrix`: 投影矩阵
- `normalMatrix`: 法线矩阵
- `cameraPos`: 相机位置

##### `update(): void`

更新Uniform数据（每帧调用）。

##### `bind(renderPass: IRHIRenderPass): void`

绑定材质到渲染通道。

##### `destroy(): void`

销毁材质资源。

## 类型定义

### SimplePBRMaterialParams

```typescript
interface SimplePBRMaterialParams {
  albedo: [number, number, number];      // 基础颜色（线性空间RGB）
  metallic: number;                      // 金属度 (0.0 - 1.0)
  roughness: number;                     // 粗糙度 (0.0 - 1.0)
  ambientStrength: number;               // 环境光强度
}
```

### SimplePBRLightParams

```typescript
interface SimplePBRLightParams {
  position: [number, number, number];    // 光源位置（世界空间）
  color: [number, number, number];       // 光源颜色（线性空间RGB）
  constant: number;                      // 常数衰减系数
  linear: number;                        // 线性衰减系数
  quadratic: number;                     // 二次衰减系数
}
```

## 顶点数据要求

材质期望的顶点数据格式：

```typescript
// 顶点布局：position(12 bytes) + normal(12 bytes) = 24 bytes/vertex
const vertexLayout = {
  stride: 24,
  attributes: [
    { name: 'aPosition', format: FLOAT32x3, offset: 0 },   // 位置
    { name: 'aNormal',   format: FLOAT32x3, offset: 12 },  // 法线
  ],
};
```

## Uniform Buffer 布局

### Transforms (256 bytes)

```glsl
uniform Transforms {
  mat4 uModelMatrix;       // 64 bytes
  mat4 uViewMatrix;        // 64 bytes
  mat4 uProjectionMatrix;  // 64 bytes
  mat4 uNormalMatrix;      // 64 bytes
};
```

### PBRMaterial (32 bytes, std140)

```glsl
layout(std140) uniform PBRMaterial {
  vec3 uAlbedo;           // 16 bytes (12 + 4 padding)
  float uMetallic;        // 4 bytes
  float uRoughness;       // 4 bytes
  float uAmbientStrength; // 4 bytes
  float _padMat1;         // 4 bytes
  float _padMat2;         // 4 bytes
};
```

### PointLights (112 bytes, std140)

```glsl
struct PointLight {
  vec3 position;     // 16 bytes (with padding)
  vec3 color;        // 16 bytes (with padding)
  float constant;    // 4 bytes
  float linear;      // 4 bytes
  float quadratic;   // 4 bytes
  float _padding;    // 4 bytes
};

layout(std140) uniform PointLights {
  PointLight uLights[2];  // 96 bytes
  int uLightCount;        // 4 bytes
  float _pad1;            // 4 bytes
  float _pad2;            // 4 bytes
  float _pad3;            // 4 bytes
};
```

### CameraData (16 bytes)

```glsl
uniform CameraData {
  vec3 uCameraPosition;   // 16 bytes (with padding)
};
```

## 与完整版PBRMaterial的区别

| 特性 | SimplePBRMaterial | PBRMaterial |
|------|-------------------|-------------|
| 纹理贴图 | ❌ 不支持 | ✅ 支持（Albedo, Normal, Metallic, Roughness, AO） |
| IBL预计算 | ❌ 直接采样 | ✅ 支持（Irradiance Map, Prefilter Map, BRDF LUT） |
| 切线空间 | ❌ 不需要 | ✅ 支持法线贴图 |
| 光源数量 | 最多2个 | 最多4个 |
| 顶点数据 | Position + Normal | Position + Normal + UV + Tangent |
| 复杂度 | 简单 | 复杂 |
| 适用场景 | 快速原型、简单场景 | 生产环境、复杂材质 |

## 注意事项

1. **环境贴图必需**：材质依赖环境贴图进行环境光照计算
2. **光源限制**：最多支持2个点光源
3. **顶点格式**：必须包含位置和法线数据
4. **颜色空间**：所有颜色参数使用线性空间，着色器内部处理Gamma校正
5. **资源管理**：使用完毕后调用 `destroy()` 释放资源

## 示例Demo

完整示例请参考：`demo/src/pbr-material.ts`

## 重构历史

- **2025-12-16**: 从 `pbr-material.ts` 提取可工作的实现，创建工具类
- 保持原有功能完整性
- 简化API，提高可复用性
