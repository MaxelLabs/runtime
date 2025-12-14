# Flat Shading Demo 参考文档

## 1. 概述

`flat-shading.ts` Demo 旨在演示一种非真实感渲染技术——平面着色（Flat Shading）。该技术通过为每个多边形（通常是三角形）应用统一的光照计算，从而产生一种独特的、棱角分明的视觉风格。这与更平滑的着色模型（如 Gouraud 或 Phong 着色）形成鲜明对比。

**核心技术点:**

- **GLSL `flat` 关键字**: 这是实现平面着色的关键。当一个 `varying`（在 GLSL 3.0+ 中是 `out`/`in` 变量）被声明为 `flat` 时，它的值将不会在片元着色器中进行插值。取而代之的是，该图元（例如三角形）的所有片元都将使用来自“provoking vertex”（主顶点）的该变量值。
- **光照模型**: Demo 采用了简化的 Lambertian 漫反射模型，外加一个环境光分量。这足以清晰地展示平面着色的效果，而不会被高光等复杂计算所干扰。
- **Uniform Buffer Object (UBO)**: 所有的变换矩阵和光照参数都通过 UBO 传递给着色器，并遵循 `std140` 内存布局标准。

## 2. 文件结构

- `packages/rhi/demo/src/flat-shading.ts`: TypeScript 源码，负责 RHI 初始化、资源创建、GUI 设置和渲染循环。
- `packages/rhi/demo/html/flat-shading.html`: Demo 的 HTML 入口文件，包含 Canvas 和信息面板。
- `llmdoc/reference/flat-shading-demo.md`: 本文档。

## 3. 代码详解

### 3.1. 着色器 (Shaders)

#### 顶点着色器 (`vertexShaderSource`)

```glsl
#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

// 使用 'flat' 关键字是实现平面着色的核心
flat out vec3 vNormal;

void main() {
  // 将法线变换到世界空间
  vNormal = mat3(uNormalMatrix) * aNormal;
  // 计算最终的裁剪空间坐标
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
```

- **`flat out vec3 vNormal;`**: 这是关键行。`flat` 告诉 GPU 不要对 `vNormal` 变量进行插值。因此，一个三角形内的所有片元都会接收到完全相同的法线向量，该向量来自该三角形的三个顶点之一（主顶点）。

#### 片元着色器 (`fragmentShaderSource`)

```glsl
#version 300 es
precision mediump float;

// 'vNormal' 的输入同样需要标记为 'flat'
flat in vec3 vNormal;

uniform Lighting {
  vec3 uLightDirection;
  vec3 uAmbientColor;
};

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightDirection);

  // 简单的 Lambert 漫反射计算
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * vec3(1.0); // 光源颜色为白色

  // 最终颜色 = 环境光 + 漫反射
  vec3 finalColor = uAmbientColor + diffuse;

  fragColor = vec4(pow(finalColor, vec3(1.0/2.2)), 1.0); // Gamma 校正
}
```

- **`flat in vec3 vNormal;`**: 输入变量的 `flat` 声明必须与顶点着色器的输出匹配。
- 光照计算非常直接：一个简单的 `dot` 乘积来计算漫反射强度，然后与环境光相加。

### 3.2. TypeScript 实现 (`flat-shading.ts`)

#### 几何体生成

```typescript
const geometry = GeometryGenerator.sphere({
  size: 1,
  normals: true, // 必须生成法线
});
```

- 我们选择一个球体是因为它的曲面特性可以很好地突出平面着色的“面片化”效果。如果使用像立方体这样本身就是平面的几何体，效果将不那么明显。

#### Uniform Buffer (std140 布局)

```typescript
// Lighting uniform: vec3(16) + vec3(16) = 32 bytes
const lightingBuffer = runner.track(
  runner.device.createBuffer({
    size: 32,
    usage: MSpec.RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
  })
);

// ... 在渲染循环中 ...

const lightDir = new MMath.Vector3(params.lightX, params.lightY, params.lightZ).normalize();
const lightingData = new Float32Array(8); // 32 bytes = 8 floats
// vec3 lightDir 占用 16 字节 (前 4 个 float)
lightingData.set([lightDir.x, lightDir.y, lightDir.z], 0);
// vec3 ambientColor 占用 16 字节 (后 4 个 float)
lightingData.set([params.ambientIntensity, params.ambientIntensity, params.ambientIntensity], 4);
lightingBuffer.update(lightingData, 0);
```

- 根据 `std140` 布局规则，`vec3` 类型在 uniform 块中必须对齐到 16 字节（等同于 `vec4`）。因此，包含两个 `vec3` 的 `Lighting` uniform 块总大小为 `16 + 16 = 32` 字节。
- 在 `Float32Array` 中，这意味着每个 `vec3` 占据 4 个浮点数的空间，最后一个浮点数作为填充。

## 4. 如何运行

1. 确保已编译整个项目。
2. 在浏览器中打开 `packages/rhi/demo/html/flat-shading.html` 文件。
3. 观察屏幕上显示的球体，它应该呈现出清晰的多边形面片。
4. 使用右侧的 GUI 控件调整光照方向和环境光强度，观察着色效果的变化。
