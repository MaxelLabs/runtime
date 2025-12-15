# PBR材质系统使用指南

## 快速开始

### 1. 创建基础材质

```typescript
import { PBRMaterial, MaterialLibrary } from '@/utils';

// 使用预设材质
const goldConfig = MaterialLibrary.getPreset('gold');
const material = new PBRMaterial(device, goldConfig);

// 设置光源
material.setLights([
  {
    position: [5, 5, 5],
    color: [1, 1, 1],
    intensity: 300.0,
  },
]);
```

### 2. 渲染循环

```typescript
function render() {
  // 更新uniform数据
  material.updateUniforms(
    modelMatrix,
    viewMatrix,
    projectionMatrix,
    cameraPosition
  );

  // 绑定材质
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  material.bind(passEncoder);

  // 绘制几何体
  passEncoder.setVertexBuffer(0, vertexBuffer);
  passEncoder.setIndexBuffer(indexBuffer, 'uint16');
  passEncoder.drawIndexed(indexCount);

  passEncoder.end();
}
```

## 材质预设

### 可用预设

```typescript
// 金属材质
'gold'    // 金色，metalness=1.0, roughness=0.2
'silver'  // 银色，metalness=1.0, roughness=0.1
'copper'  // 铜色，metalness=1.0, roughness=0.3

// 非金属材质
'plastic' // 红色塑料，metalness=0.0, roughness=0.5
'wood'    // 木材色，metalness=0.0, roughness=0.8
'rubber'  // 黑色橡胶，metalness=0.0, roughness=0.9
```

### 获取预设

```typescript
const config = MaterialLibrary.getPreset('gold');
console.log(config);
// {
//   albedo: [1.0, 0.766, 0.336],
//   metalness: 1.0,
//   roughness: 0.2,
//   ao: 1.0,
//   normalScale: 1.0
// }
```

## 自定义材质

### 创建金属材质

```typescript
// 方法1：使用工厂函数
const customMetal = MaterialLibrary.createMetal(
  [0.8, 0.5, 0.2], // 橙色（线性空间）
  0.3              // 粗糙度
);

// 方法2：手动配置
const config: PBRConfig = {
  albedo: [0.8, 0.5, 0.2],
  metalness: 1.0,
  roughness: 0.3,
  ao: 1.0,
};
```

### 创建非金属材质

```typescript
// 方法1：使用工厂函数
const customDielectric = MaterialLibrary.createDielectric(
  [0.2, 0.6, 0.8], // 蓝色（线性空间）
  0.7              // 粗糙度
);

// 方法2：从sRGB颜色创建
const material = MaterialLibrary.fromSRGB(
  [51, 153, 204], // sRGB颜色 [0-255]
  0.0,            // 非金属
  0.7             // 粗糙度
);
```

## 纹理贴图

### 加载纹理

```typescript
import { TextureLoader } from '@/utils';

// 加载所有PBR贴图
const [albedoMap, metalnessMap, roughnessMap, normalMap, aoMap] =
  await Promise.all([
    TextureLoader.load('textures/albedo.jpg'),
    TextureLoader.load('textures/metalness.jpg'),
    TextureLoader.load('textures/roughness.jpg'),
    TextureLoader.load('textures/normal.jpg'),
    TextureLoader.load('textures/ao.jpg'),
  ]);
```

### 创建带纹理的材质

```typescript
const material = new PBRMaterial(
  device,
  {
    albedo: [1, 1, 1],    // 纹理会调制此值
    metalness: 1.0,
    roughness: 0.5,
    normalScale: 1.5,     // 法线强度
  },
  {
    albedoMap,
    metalnessMap,
    roughnessMap,
    normalMap,
    aoMap,
  }
);
```

### 纹理注意事项

1. **Albedo贴图**：必须是sRGB格式，着色器会自动转换到线性空间
2. **Metalness/Roughness贴图**：必须是线性空间
3. **Normal贴图**：切线空间法线，需要模型提供切线数据
4. **AO贴图**：线性空间，用于环境光遮蔽

## IBL环境光照

### 生成IBL贴图

```typescript
import { IBLLoader } from '@/utils/material/pbr';

// 1. 加载环境立方体贴图
const environmentMap = await loadCubemap('env/skybox');

// 2. 生成IBL贴图
const iblLoader = new IBLLoader(device);
const iblTextures = await iblLoader.generateIBLTextures(environmentMap);

// iblTextures包含：
// - irradianceMap: 辐照度图（漫反射）
// - prefilterMap: 预过滤环境图（镜面）
// - brdfLUT: BRDF查找表
```

### 使用IBL材质

```typescript
const material = new PBRMaterial(
  device,
  config,
  textures,
  iblTextures  // 传入IBL贴图
);

// IBL会自动启用
// 材质会同时使用直接光照和环境光照
```

## 光源配置

### 点光源

```typescript
material.setLights([
  {
    position: [5, 5, 5],
    color: [1, 1, 1],      // 白光
    intensity: 300.0,      // 光照强度
  },
  {
    position: [-5, 5, 5],
    color: [1, 0.8, 0.6],  // 暖色光
    intensity: 200.0,
  },
]);
```

### 多光源

```typescript
// 最多支持4个光源
const lights: LightConfig[] = [
  { position: [5, 5, 5], color: [1, 1, 1], intensity: 300 },
  { position: [-5, 5, 5], color: [1, 0.8, 0.6], intensity: 200 },
  { position: [0, -5, 5], color: [0.6, 0.8, 1], intensity: 150 },
  { position: [0, 5, -5], color: [1, 0.6, 0.8], intensity: 100 },
];

material.setLights(lights);
```

## 材质操作

### 动态修改属性

```typescript
// 修改单个属性
material.setProperty('roughness', 0.5);
material.setProperty('metalness', 1.0);
material.setProperty('albedo', [1, 0.5, 0.2]);
```

### 材质插值

```typescript
// 在两个材质之间插值
const gold = MaterialLibrary.getPreset('gold');
const copper = MaterialLibrary.getPreset('copper');

// 50%金 + 50%铜
const blended = MaterialLibrary.lerp(gold, copper, 0.5);

// 动画示例
let t = 0;
function animate() {
  t = (t + 0.01) % 1.0;
  const config = MaterialLibrary.lerp(gold, copper, t);
  material.setProperty('albedo', config.albedo);
  material.setProperty('roughness', config.roughness);
}
```

## 顶点数据格式

PBR材质需要以下顶点属性：

```typescript
// 顶点布局（每个顶点11个float）
const vertexData = new Float32Array([
  // position (vec3)
  x, y, z,
  // normal (vec3)
  nx, ny, nz,
  // texCoord (vec2)
  u, v,
  // tangent (vec3)
  tx, ty, tz,
]);

// 创建顶点缓冲区
const vertexBuffer = device.createBuffer({
  label: 'PBR_VertexBuffer',
  size: vertexData.byteLength,
  usage: RHIBufferUsage.VERTEX | RHIBufferUsage.COPY_DST,
  initialData: vertexData,
});
```

### 计算切线

```typescript
// 如果模型没有切线数据，需要计算
function computeTangents(positions, normals, texCoords, indices) {
  const tangents = new Float32Array(positions.length);

  // 对每个三角形计算切线
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;

    // ... 切线计算逻辑
  }

  return tangents;
}
```

## 性能优化

### 1. 材质批处理

```typescript
// 相同材质的物体使用同一个材质实例
const sharedMaterial = new PBRMaterial(device, config);

// 渲染多个物体
objects.forEach(obj => {
  sharedMaterial.updateUniforms(
    obj.modelMatrix,
    viewMatrix,
    projMatrix,
    cameraPos
  );
  sharedMaterial.bind(passEncoder);
  obj.draw(passEncoder);
});
```

### 2. 纹理复用

```typescript
// 多个材质共享纹理
const sharedNormalMap = await TextureLoader.load('textures/normal.jpg');

const material1 = new PBRMaterial(device, config1, {
  normalMap: sharedNormalMap,
});

const material2 = new PBRMaterial(device, config2, {
  normalMap: sharedNormalMap,
});
```

### 3. LOD系统

```typescript
// 根据距离选择材质复杂度
function selectMaterial(distance: number) {
  if (distance < 10) {
    return highQualityMaterial; // 完整PBR + IBL
  } else if (distance < 50) {
    return mediumQualityMaterial; // PBR无IBL
  } else {
    return lowQualityMaterial; // 简化光照
  }
}
```

## 调试技巧

### 1. 可视化材质属性

```typescript
// 只显示albedo
material.setProperty('metalness', 0);
material.setProperty('roughness', 1);

// 只显示法线
// 在片段着色器中：fragColor = vec4(N * 0.5 + 0.5, 1.0);

// 只显示粗糙度
// 在片段着色器中：fragColor = vec4(vec3(roughness), 1.0);
```

### 2. 验证能量守恒

```typescript
// 检查 kD + kS = 1
// 在片段着色器中添加：
// vec3 kS = F;
// vec3 kD = vec3(1.0) - kS;
// float sum = kD.r + kS.r;
// if (abs(sum - 1.0) > 0.01) {
//   fragColor = vec4(1, 0, 0, 1); // 红色表示错误
// }
```

### 3. 光照调试

```typescript
// 只显示漫反射
// Lo = diffuse * radiance * NdotL;

// 只显示镜面反射
// Lo = specular * radiance * NdotL;

// 只显示环境光
// color = ambient;
```

## 常见问题

### Q: 材质看起来太暗？
A: 检查光源强度和距离衰减。点光源使用距离平方衰减，可能需要较大的intensity值（如300-1000）。

### Q: 金属材质没有反射？
A: 确保启用了IBL。金属材质的镜面反射主要来自环境光照。

### Q: 法线贴图没有效果？
A: 检查模型是否提供了切线数据（aTangent），以及法线贴图是否为切线空间。

### Q: 颜色不正确？
A: 确保albedo颜色在线性空间。如果从sRGB转换，使用`MaterialLibrary.fromSRGB()`。

### Q: 性能问题？
A:
1. 减少光源数量（最多4个）
2. 禁用IBL（如果不需要）
3. 降低纹理分辨率
4. 使用材质批处理

## 完整示例

```typescript
import {
  PBRMaterial,
  MaterialLibrary,
  IBLLoader,
  TextureLoader,
} from '@/utils';

async function createPBRScene(device: RHIDevice) {
  // 1. 加载纹理
  const textures = {
    albedoMap: await TextureLoader.load('textures/albedo.jpg'),
    metalnessMap: await TextureLoader.load('textures/metalness.jpg'),
    roughnessMap: await TextureLoader.load('textures/roughness.jpg'),
    normalMap: await TextureLoader.load('textures/normal.jpg'),
    aoMap: await TextureLoader.load('textures/ao.jpg'),
  };

  // 2. 生成IBL
  const environmentMap = await loadCubemap('env/skybox');
  const iblLoader = new IBLLoader(device);
  const iblTextures = await iblLoader.generateIBLTextures(environmentMap);

  // 3. 创建材质
  const config = MaterialLibrary.getPreset('gold');
  const material = new PBRMaterial(device, config, textures, iblTextures);

  // 4. 设置光源
  material.setLights([
    { position: [5, 5, 5], color: [1, 1, 1], intensity: 300 },
    { position: [-5, 5, 5], color: [1, 0.8, 0.6], intensity: 200 },
  ]);

  // 5. 渲染循环
  function render() {
    material.updateUniforms(
      modelMatrix,
      viewMatrix,
      projectionMatrix,
      cameraPosition
    );

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    material.bind(passEncoder);

    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.setIndexBuffer(indexBuffer, 'uint16');
    passEncoder.drawIndexed(indexCount);

    passEncoder.end();
  }

  return { material, render };
}
```
