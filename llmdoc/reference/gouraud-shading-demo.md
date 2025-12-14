# Gouraud Shading Demo 参考文档

本文档提供 `gouraud-shading.ts` Demo 的技术细节和实现说明。

## 1. 技术定义

- **着色模型**：Gouraud Shading（高洛德着色 / 顶点着色）
- **核心特征**：在**顶点着色器 (Vertex Shader)** 中计算光照模型，得到每个顶点的颜色。然后，在**片元着色器 (Fragment Shader)** 中对这些顶点颜色进行线性插值，以确定每个像素的最终颜色。
- **优点**：计算效率高，因为光照计算量与顶点数成正比，远小于像素数。
- **缺点**：无法精确表现高光（Specular Highlight）。如果高光区域完全位于一个三角形内部，它将不会被渲染出来。此外，容易产生视觉瑕疵，如“马赫带 (Mach Bands)”。

## 2. 实现要点

### 几何体

Demo 使用程序化生成的球体，因为它能更好地展示平滑着色的效果。

```typescript
const geometry = GeometryGenerator.sphere({
  size: 1,
  normals: true, // 法线是光照计算的必需输入
  uvs: false,    // 本 Demo 不涉及纹理，无需 UV
  segments: 64,  // 较高的分段数使球体更平滑
});
```

### 光照模型

在顶点着色器中实现了简单的 **Lambert 漫反射模型**和**环境光**。

- **环境光 (Ambient)**: 提供一个基础亮度，模拟间接光照，使得物体暗部不至于全黑。
- **漫反射 (Diffuse)**: 模拟光线照射到粗糙表面的效果。其强度取决于表面法线与光照方向的夹角。

### GUI 参数

通过 `SimpleGUI` 提供了对光照参数的实时控制：

- **lightX/Y/Z**: 控制单一平行光的光照方向。
- **ambientIntensity**: 环境光强度，影响物体的整体亮度。
- **diffuseIntensity**: 漫反射强度，影响光照下的表面亮度。

## 3. 着色器代码 (GLSL)

这是 Gouraud Shading 实现的核心。

### 顶点着色器 (`vertexShaderSource`)

所有光照计算都在这里完成。

```glsl
#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec3 aNormal;

// Uniform 块
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

uniform Lighting {
  vec3 uLightDirection;
  float uAmbientIntensity;
  float uDiffuseIntensity;
};

// 输出到片元着色器
out vec3 vColor;

void main() {
  // 变换顶点位置和法线到世界空间
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vec3 worldNormal = normalize(mat3(uNormalMatrix) * aNormal);

  // Lambert 漫反射模型
  vec3 lightDir = normalize(uLightDirection);
  float diff = max(dot(worldNormal, lightDir), 0.0);
  vec3 diffuseColor = vec3(1.0, 1.0, 1.0); // 假设物体基础色和光颜色都为白色
  vec3 diffuse = uDiffuseIntensity * diff * diffuseColor;

  // 环境光
  vec3 ambient = uAmbientIntensity * diffuseColor;

  // 最终顶点颜色
  vColor = ambient + diffuse;

  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
```

### 片元着色器 (`fragmentShaderSource`)

极其简单，只负责接收并输出由硬件插值计算好的颜色。

```glsl
#version 300 es
precision mediump float;

// 从顶点着色器传入的插值颜色
in vec3 vColor;

// 输出
out vec4 fragColor;

void main() {
  // 直接输出插值后的颜色
  fragColor = vec4(vColor, 1.0);
}
```

## 4. Constitution 规则符合性

- **资源追踪**: 所有 RHI 资源（Buffer, Shader, Pipeline 等）均使用 `runner.track()` 进行管理。
- **Uniform Buffer**: `Lighting` Uniform Buffer 的数据填充考虑了 `std140` 布局规则，特别是 `vec3` 会占据 16 字节的对齐空间。
- **着色器精度**: 顶点着色器使用 `highp`, 片元着色器使用 `mediump`。
- **Canvas 容器**: HTML 中使用了 `.container` div 包裹 canvas。
- **UI 布局**: `Stats` 和 `SimpleGUI` 按照默认位置放置（左上角和右上角）。

---
此文档旨在帮助理解 Gouraud Shading 的基本原理及其在 RHI 框架下的具体实现。
