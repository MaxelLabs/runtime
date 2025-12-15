# Point Lights Demo 参考文档

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
