# Phong Lighting Demo 参考文档

## 概述

`phong-lighting` Demo 实现了经典的 **Phong 光照模型**（也称 "Phong Reflection Model" 或 "Phong Shading"）。这是计算机图形学历史上最重要的光照模型之一，由 Bui Tuong Phong 于 1973 年提出。

---

## Phong 光照模型原理

### 核心思想

Phong 模型将光照分为三个独立的分量，每个分量模拟不同的物理现象：

1. **环境光（Ambient）**：模拟全局的间接照明，光线从各个角度反射后产生的"背景光"。
2. **漫反射（Diffuse）**：模拟光线照射到粗糙表面后向各个方向均匀散射的现象（Lambert 定律）。
3. **镜面高光（Specular）**：模拟光线在光滑表面产生的镜面反射，视角接近反射方向时最亮。

公式：

```
finalColor = ambient + diffuse + specular

ambient   = ka * Iambient
diffuse   = kd * Id * max(N · L, 0)
specular  = ks * Is * max(R · V, 0)^α
```

其中：
- `N`: 表面法线
- `L`: 光照方向（指向光源）
- `V`: 视线方向（指向摄像机）
- `R`: 反射向量 = reflect(-L, N)
- `α`: 高光指数（shininess），控制高光集中程度
- `k` 系数：材质对各分量的响应系数（本 Demo 中通过 GUI 调节）

---

## 实现要点

### 1. 几何体选择

```typescript
const sphereGeometry = GeometryGenerator.sphere({
  size: 1,
  normals: true,
  uvs: false,
});
```

**为何选球体？**
- 球面有连续变化的法线，可以清晰展示逐像素光照的优势。
- 高光在球面上形成完美的圆形斑点，易于观察镜面反射效果。

---

### 2. 着色器设计

#### 2.1 顶点着色器

**职责：** 将顶点属性（位置、法线）传递到片元着色器。

```glsl
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

out vec3 vWorldPosition;
out vec3 vNormal;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
```

**关键点：**
- `uNormalMatrix` 是模型矩阵的逆转置矩阵，用于正确变换法线（应对非均匀缩放）。
- 传递世界坐标到片元着色器，用于计算视线方向。

#### 2.2 片元着色器

**职责：** 完整执行 Phong 光照计算。

```glsl
uniform Lighting {
  vec3 uLightDirection;
  vec3 uCameraPosition;
  float uAmbientIntensity;
  float uDiffuseIntensity;
  float uSpecularIntensity;
  float uShininess;
};

in vec3 vWorldPosition;
in vec3 vNormal;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightDirection);

  // Ambient
  vec3 ambient = uAmbientIntensity * vec3(1.0);

  // Diffuse
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = uDiffuseIntensity * diff * vec3(1.0);

  // Specular (Phong Reflection Model)
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
  vec3 specular = uSpecularIntensity * spec * vec3(1.0, 1.0, 1.0);

  vec3 result = ambient + diffuse + specular;
  fragColor = vec4(result, 1.0);
}
```

**关键点：**
- `reflect(-lightDir, normal)` 计算反射向量，注意光照方向需要取反。
- `pow(dot(viewDir, reflectDir), shininess)` 控制高光的集中程度。
- 所有三个分量线性叠加。

---

### 3. std140 内存布局

Uniform Block 的内存布局必须遵循 **std140** 标准：

```typescript
const lightingBuffer = runner.track(
  runner.device.createBuffer({
    size: 48,  // vec3(16) + vec3(16) + float(4) * 4 = 48
    usage: MSpec.RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
  })
);
```

**布局规则：**
- `vec3` 占用 16 字节（对齐到 vec4）。
- 4 个 `float` 紧密排列，共 16 字节。

数据填充：

```typescript
lightingData.set([lightDir.x, lightDir.y, lightDir.z], 0);       // offset 0, 占 16 字节
lightingData.set([cameraPos.x, cameraPos.y, cameraPos.z], 4);   // offset 16, 占 16 字节
lightingData[8] = params.ambientIntensity;   // offset 32
lightingData[9] = params.diffuseIntensity;   // offset 36
lightingData[10] = params.specularIntensity; // offset 40
lightingData[11] = params.shininess;         // offset 44
```

---

### 4. 法线矩阵计算

法线矩阵 = (模型矩阵的逆矩阵)的转置矩阵，用于正确变换法线：

```typescript
normalMatrix.copyFrom(modelMatrix).invert().transpose();
```

**为何需要法线矩阵？**
- 模型矩阵可能包含非均匀缩放（例如 `scale(1, 2, 1)`）。
- 法线作为方向向量，不能直接用模型矩阵变换，否则结果不正确。
- 使用逆转置矩阵可以保证法线在变换后仍然垂直于表面。

---

## GUI 参数说明

| 参数                  | 作用                                                         | 默认值 | 范围       |
|-----------------------|--------------------------------------------------------------|--------|------------|
| Light Direction X/Y/Z | 光照方向的 3D 向量分量（会被自动归一化）                     | 0.5    | -1.0 ~ 1.0 |
| Ambient Intensity     | 环境光强度（全局"底色"）                                     | 0.1    | 0 ~ 1      |
| Diffuse Intensity     | 漫反射强度（表面的"主要颜色"）                               | 0.8    | 0 ~ 1      |
| Specular Intensity    | 镜面反射强度（高光的亮度）                                   | 0.6    | 0 ~ 1      |
| Shininess             | 高光指数（值越大，高光越集中；值越小，高光越发散）           | 32.0   | 1 ~ 128    |

---

## Phong vs Blinn-Phong

| 对比项              | Phong                          | Blinn-Phong                          |
|---------------------|--------------------------------|--------------------------------------|
| 高光计算向量        | 反射向量 `R = reflect(-L, N)`  | 半程向量 `H = normalize(L + V)`      |
| 着色器函数          | `reflect()`                    | 无需函数，直接加法 + 归一化          |
| 性能                | 略慢（需要计算反射）           | 略快（加法 + 归一化比反射更简单）    |
| 视觉效果            | 精确反射（物理意义更明确）     | 近似反射（快速且视觉效果接近）       |

本 Demo 使用 **Phong** 模型，可以清楚地看到 `reflect()` 函数的应用。

---

## Constitution 合规性检查

✅ **资源管理：** 所有 Buffer、Texture、Pipeline 均使用 `runner.track()`。
✅ **着色器精度：** 顶点着色器使用 `highp float`，片元着色器使用 `mediump float`。
✅ **Uniform Buffer 对齐：** 严格遵循 std140 布局规则。
✅ **Canvas 包裹：** HTML 中 Canvas 被 `.container` 包裹。
✅ **FPS 显示：** Stats 位于左上角。
✅ **GUI 位置：** SimpleGUI 位于右上角。

---

## 测试与验证

### 视觉效果标准

- [ ] **平滑渐变：** 球体表面呈现平滑的光照过渡，无明显的色块边界（与 Flat Shading 对比）。
- [ ] **高光位置：** 镜面高光在球体表面形成圆形斑点，位置随相机移动而变化。
- [ ] **参数响应：** GUI 滑块调整时，高光、漫反射、环境光立即变化。
- [ ] **高光集中度：** Shininess 从 1 调至 128 时，高光从大面积柔和光晕变为小而锐利的点。

### 性能测试

- 60 FPS 稳定（1080p 分辨率，现代 GPU）。
- 深度测试正常（球体前后关系正确）。
- 无 WebGL 错误或警告。

---

## 扩展学习

### 相关 Demo

- **flat-shading.ts**: 对比平面着色（每个三角面使用相同法线）。
- **gouraud-shading.ts**: 对比顶点着色（光照在顶点着色器计算）。
- **rotating-cube.ts**: 使用 Blinn-Phong 模型的基础演示。

### 参考资料

- [Phong Reflection Model (Wikipedia)](https://en.wikipedia.org/wiki/Phong_reflection_model)
- [LearnOpenGL: Lighting](https://learnopengl.com/Lighting/Basic-Lighting)
- 《计算机图形学圣经》（已添加至 `llmdoc/bibles/`）

---

## 文件清单

| 文件路径                                         | 作用                 |
|--------------------------------------------------|----------------------|
| `packages/rhi/demo/src/phong-lighting.ts`        | 主程序（TypeScript） |
| `packages/rhi/demo/html/phong-lighting.html`     | HTML 入口页面        |
| `llmdoc/reference/phong-lighting-demo.md`        | 本参考文档           |

---

## 更新历史

| 日期       | 作者     | 更改内容                 |
|------------|----------|--------------------------|
| 2025-12-14 | Vanguard | 初次创建 Demo 及文档     |
