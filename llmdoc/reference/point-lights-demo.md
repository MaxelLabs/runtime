---
title: "Point Lights Demo参考文档"
id: "point-lights-demo"
type: "reference"
tags: ["point-lights", "lighting", "attenuation", "real-time-rendering", "phong-shading"]
category: "demo"
demo_type: "interactive"
related_ids: ["graphics-bible", "pbr-material-system", "directional-light-demo", "spotlight-demo"]
difficulty: "beginner"
prerequisites: ["基础渲染管线", "着色器编程", "向量数学", "光照模型"]
estimated_time: "20-25分钟"
version: "1.0.0"
status: "complete"
---

# Point Lights Demo参考文档

## 🎯 学习目标
完成本Demo后，您将能够：
- 实现完整的点光源光照系统，包括距离衰减计算
- 掌握std140内存布局规范，确保CPU和GPU数据一致性
- 理解并优化多光源渲染性能（最多4个点光源）
- 调整衰减参数控制光照范围和强度分布
- 解决常见多光源渲染问题（光照重叠、性能瓶颈）

## ⚠️ 禁止事项
- **禁止** 在std140布局中使用vec3而不进行16字节对齐
- **禁止** 在片元着色器中不检查lightCount就遍历所有光源
- **禁止** 混用左手和右手坐标系的光照计算
- **禁止** 在点光源计算中忽略距离衰减导致的物理错误
- **禁止** 在uniform缓冲区中使用动态数组大小

## 🔧 核心接口定义

### IPointLight
```typescript
interface IPointLight {
  // 位置和颜色
  position: Vec3;
  color: Vec3;

  // 衰减参数
  constant: number;    // 常数衰减
  linear: number;      // 线性衰减
  quadratic: number;   // 二次衰减

  // 状态控制
  enabled: boolean;
  intensity: number;

  // 辅助方法
  getAttenuation(distance: number): number;
  getInfluenceRadius(threshold: number): number;
}
```

### IPointLightSystem
```typescript
interface IPointLightSystem {
  // 光源管理
  addLight(light: IPointLight): void;
  removeLight(lightId: string): void;
  updateLight(lightId: string, updates: Partial<IPointLight>): void;

  // 批量操作
  setLights(lights: IPointLight[]): void;
  getActiveLights(): IPointLight[];

  // Uniform缓冲区管理
  updateUniformBuffer(): void;
  getLightCount(): number;

  // 性能优化
  enableCulling(enabled: boolean): void;
  setMaxLights(maxCount: number): void;
}
```

### IAttenuationCalculator
```typescript
interface IAttenuationCalculator {
  // 衰减计算
  calculateAttenuation(light: IPointLight, distance: number): number;

  // 范围计算
  calculateRadius(light: IPointLight, threshold: number): number;

  // 预设参数
  getAttenuationPreset(range: 'short' | 'medium' | 'long' | 'extreme'): {
    constant: number;
    linear: number;
    quadratic: number;
  };
}
```

## 📝 Few-Shot 示例

### 问题1：点光源光照范围控制不准确
**解决方案**：
```typescript
// 精确的衰减半径计算
class PreciseAttenuation implements IAttenuationCalculator {
  calculateRadius(light: IPointLight, threshold: number = 0.01): number {
    // 求解衰减方程: threshold = 1 / (c + l*r + q*r^2)
    // 转换为二次方程: q*r^2 + l*r + (c - 1/threshold) = 0

    const c = light.constant;
    const l = light.linear;
    const q = light.quadratic;
    const d = c - 1.0 / threshold;

    if (Math.abs(q) < 0.001) {
      // 线性情况
      return Math.max(0, -d / l);
    }

    // 二次方程求解
    const discriminant = l * l - 4 * q * d;
    if (discriminant < 0) {
      return 0; // 无实数解
    }

    const sqrtDisc = Math.sqrt(discriminant);
    const r1 = (-l + sqrtDisc) / (2 * q);
    const r2 = (-l - sqrtDisc) / (2 * q);

    return Math.max(0, Math.max(r1, r2));
  }

  // 使用距离剔除优化性能
  cullLights(camera: Camera, lights: IPointLight[]): IPointLight[] {
    return lights.filter(light => {
      const radius = this.calculateRadius(light);
      const distance = light.position.distance(camera.position);
      return distance <= radius + camera.farPlane;
    });
  }
}
```

### 问题2：std140内存布局数据错位
**解决方案**：
```typescript
// 正确的std140数据打包
class PointLightUniformPacker {
  private readonly FLOAT_SIZE = 4;
  private readonly VEC3_SIZE = 16; // vec3需要16字节对齐
  private readonly LIGHT_SIZE = 48; // 每个光源48字节

  packLights(lights: IPointLight[]): Float32Array {
    const buffer = new Float32Array(208); // 4光源 + 控制参数

    for (let i = 0; i < 4; i++) {
      const offset = i * 12; // 每个光源12个float
      const light = i < lights.length ? lights[i] : this.getDefaultLight();

      // vec3 position (16字节对齐)
      buffer[offset] = light.position.x;
      buffer[offset + 1] = light.position.y;
      buffer[offset + 2] = light.position.z;
      buffer[offset + 3] = 0; // padding

      // vec3 color (16字节对齐)
      buffer[offset + 4] = light.color.x;
      buffer[offset + 5] = light.color.y;
      buffer[offset + 6] = light.color.z;
      buffer[offset + 7] = 0; // padding

      // float attenuation parameters
      buffer[offset + 8] = light.constant;
      buffer[offset + 9] = light.linear;
      buffer[offset + 10] = light.quadratic;
      buffer[offset + 11] = 0; // padding
    }

    // 全局参数 (偏移192)
    buffer[192] = Math.min(lights.length, 4); // lightCount
    buffer[193] = 0.1; // ambientIntensity
    buffer[194] = 32; // shininess
    buffer[195] = 0; // padding

    return buffer;
  }
}
```

### 问题3：多光源渲染性能优化
**解决方案**：
```typescript
class OptimizedPointLightRenderer {
  private lightSystem: IPointLightSystem;
  private lodManager: PointLightLOD;

  constructor(device: IRHIDevice) {
    this.lightSystem = new PointLightSystem(device, 4);
    this.lodManager = new PointLightLOD();
  }

  render(renderContext: RenderContext): void {
    // 距离剔除
    const visibleLights = this.cullLightsByDistance(
      this.lightSystem.getActiveLights(),
      renderContext.camera
    );

    // 重要性排序（距离相机近的优先）
    const sortedLights = this.sortByImportance(visibleLights, renderContext.camera);

    // LOD优化
    const lodLights = this.lodManager.applyLOD(sortedLights, renderContext);

    // 更新uniform缓冲区
    this.lightSystem.setLights(lodLights);
    this.lightSystem.updateUniformBuffer();
  }

  private cullLightsByDistance(lights: IPointLight[], camera: Camera): IPointLight[] {
    return lights.filter(light => {
      const distance = light.position.distance(camera.position);
      const influenceRadius = this.calculateInfluenceRadius(light);
      return distance <= influenceRadius + camera.farPlane;
    });
  }

  private sortByImportance(lights: IPointLight[], camera: Camera): IPointLight[] {
    return lights.sort((a, b) => {
      const distA = a.position.distance(camera.position);
      const distB = b.position.distance(camera.position);
      const intensityA = a.intensity / (distA * distA);
      const intensityB = b.intensity / (distB * distB);
      return intensityB - intensityA; // 降序排列
    });
  }
}

// 简化版着色器（移动设备优化）
const simplifiedPointLightShader = `
#version 300 es
precision mediump float;

struct PointLight {
  vec3 position;
  vec3 color;
  float constant;
  float linear;
  float quadratic;
};

uniform PointLight uLights[4];
uniform int uLightCount;
uniform float uAmbientIntensity;

in vec3 vNormal;
in vec3 vWorldPosition;
out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 result = vec3(uAmbientIntensity);

  for (int i = 0; i < 4; i++) {
    if (i >= uLightCount) break;

    vec3 lightDir = uLights[i].position - vWorldPosition;
    float distance = length(lightDir);
    lightDir = normalize(lightDir);

    // 简化衰减计算（性能优先）
    float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);

    // Lambert漫反射
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * uLights[i].color * attenuation;

    result += diffuse;
  }

  fragColor = vec4(result, 1.0);
}
`;
```

## 概述

**文件路径**：`packages/rhi/demo/src/point-lights.ts`
**Demo 名称**：Point Lights (点光源)
**完成时间**：2025-12-15

## 技术定义

### 光源类型
- **类型**：点光源（Point Light）
- **核心特征**：光从一个点向四周发散，具有距离衰减效果
- **典型应用**：灯泡、火把、蜡烛、街灯
- **实现方式**：使用位置向量 + 距离衰减公式

### 关键特性
1. **多光源支持**：最多支持 4 个点光源同时工作
2. **距离衰减**：光照强度随距离增加而衰减
3. **独立控制**：每个光源有独立的位置、颜色和衰减参数
4. **逐片元计算**：在片元着色器中计算光照，效果精细

## 核心实现

### 1. 距离衰减公式

```glsl
float distance = length(lightPosition - fragPosition);
float attenuation = 1.0 / (constant + linear * distance + quadratic * distance * distance);
```

**参数说明**：
- `constant`：常数衰减（通常为 1.0）
- `linear`：线性衰减系数（控制近距离衰减速度）
- `quadratic`：二次衰减系数（控制远距离衰减速度）

**典型值推荐**：
- 短距离（7 单位）：constant=1.0, linear=0.7, quadratic=1.8
- 中距离（13 单位）：constant=1.0, linear=0.35, quadratic=0.44
- 长距离（32 单位）：constant=1.0, linear=0.14, quadratic=0.07
- 超长距离（100 单位）：constant=1.0, linear=0.09, quadratic=0.032

### 2. Uniform Buffer 布局（std140）

```glsl
struct PointLight {
  vec3 position;     // 16 bytes (with padding)
  vec3 color;        // 16 bytes (with padding)
  float constant;    // 4 bytes
  float linear;      // 4 bytes
  float quadratic;   // 4 bytes
  float _padding;    // 4 bytes (alignment)
};
// Total per light: 48 bytes

layout(std140) uniform PointLights {
  PointLight uLights[4];  // 192 bytes (48 * 4)
  int uLightCount;        // 4 bytes
  float uAmbientIntensity;// 4 bytes
  float uShininess;       // 4 bytes
  float _padding;         // 4 bytes
};
// Total: 208 bytes
```

**内存布局解释**：
- 每个 PointLight 结构体占 48 字节
- `vec3` 类型在 std140 中必须对齐到 16 字节
- 数组 `uLights[4]` 总共占 192 字节
- 全局参数（lightCount, ambientIntensity, shininess）占 16 字节

### 3. 片元着色器光照计算

```glsl
void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

  // 环境光
  vec3 ambient = uAmbientIntensity * vec3(1.0);
  vec3 totalDiffuse = vec3(0.0);
  vec3 totalSpecular = vec3(0.0);

  // 遍历所有激活的点光源
  for (int i = 0; i < 4; i++) {
    if (i >= uLightCount) break;

    PointLight light = uLights[i];

    // 计算光照方向和距离
    vec3 lightDir = light.position - vWorldPosition;
    float distance = length(lightDir);
    lightDir = normalize(lightDir);

    // 距离衰减
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * distance * distance);

    // 漫反射（Lambert）
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * light.color * attenuation;
    totalDiffuse += diffuse;

    // 镜面反射（Phong）
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
    vec3 specular = spec * light.color * attenuation;
    totalSpecular += specular;
  }

  vec3 result = ambient + totalDiffuse + totalSpecular;
  fragColor = vec4(result, 1.0);
}
```

## GUI 参数配置

### 全局参数
- **lightCount**：激活的光源数量（1-4）
- **ambientIntensity**：环境光强度（0.0-1.0）
- **shininess**：高光指数（1-128）

### 每个光源的参数
- **Position (X/Y/Z)**：光源位置（-5 到 5）
- **Color (R/G/B)**：光源颜色（0.0-1.0）
- **Attenuation**：
  - `constant`：常数项（0.1-2.0）
  - `linear`：线性项（0.0-1.0）
  - `quadratic`：二次项（0.0-1.0）

### 默认配置

```typescript
// 光源 1（红色）：右上前方
position: [2.0, 2.0, 2.0]
color: [1.0, 0.0, 0.0]
constant: 1.0, linear: 0.09, quadratic: 0.032

// 光源 2（绿色）：左上后方
position: [-2.0, 2.0, -2.0]
color: [0.0, 1.0, 0.0]
constant: 1.0, linear: 0.09, quadratic: 0.032

// 光源 3（蓝色）：下方前方
position: [0.0, -2.0, 2.0]
color: [0.0, 0.0, 1.0]
constant: 1.0, linear: 0.09, quadratic: 0.032

// 光源 4（白色）：正上方
position: [0.0, 3.0, 0.0]
color: [1.0, 1.0, 1.0]
constant: 1.0, linear: 0.09, quadratic: 0.032
```

## 验证标准

- [x] 球体表面呈现明显的距离衰减效果
- [x] 多光源叠加效果正确（颜色混合自然）
- [x] 可独立调整每个光源的位置和衰减参数
- [x] GUI 可实时调整光源数量（1-4）
- [x] 近距离区域明亮，远距离区域逐渐变暗
- [x] 不同颜色的光源在交汇处产生正确的颜色混合

## 与其他 Demo 的差异

### vs Directional Light
- **位置**：点光源有位置，平行光只有方向
- **衰减**：点光源有距离衰减，平行光无衰减
- **应用**：点光源适合局部照明，平行光适合全局照明

### vs Spotlight
- **光束形状**：点光源向四周均匀发散，聚光灯是锥形光束
- **参数**：点光源无方向和锥角参数
- **复杂度**：点光源计算更简单

## 常见问题

### Q1: 如何调整光照范围？
A: 调整衰减参数：
- 减小 `linear` 和 `quadratic` 可以增大光照范围
- 增大 `linear` 和 `quadratic` 可以减小光照范围

### Q2: 多光源性能如何优化？
A:
- 使用 `uLightCount` 动态控制激活光源数量
- 在循环中使用 `break` 提前退出
- 考虑使用延迟渲染（Deferred Rendering）处理大量光源

### Q3: 为什么需要 std140 对齐？
A: std140 是 OpenGL 的统一内存布局规则，确保 CPU 和 GPU 对 Uniform Buffer 的内存布局理解一致。`vec3` 必须对齐到 16 字节，因此需要添加 padding。

## 扩展方向

1. **光源可视化**：在光源位置绘制小球体，方便调试
2. **光源动画**：让光源沿路径移动或闪烁
3. **阴影投射**：添加 Shadow Mapping 实现点光源阴影
4. **体积光**：实现 Light Scattering 效果
5. **光源剔除**：根据距离自动剔除影响较小的光源

## 相关文件

- **源码**：`packages/rhi/demo/src/point-lights.ts`
- **HTML**：`packages/rhi/demo/html/point-lights.html`
- **策略文档**：`llmdoc/agent/strategy-light-sources-campaign.md` (BLOCK B)

## 参考资料

- Learn OpenGL: [Multiple Lights](https://learnopengl.com/Lighting/Multiple-lights)
- [Point Light Attenuation](https://imdoingitwrong.wordpress.com/2011/01/31/light-attenuation/)
- Ogre3D Wiki: [Attenuation Shortcut](https://wiki.ogre3d.org/tiki-index.php?page=-Point+Light+Attenuation)
