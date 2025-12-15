
# Directional Light Demo - 参考文档

本文档详细说明了 `directional-light` Demo 的技术实现，该 Demo 用于演示平行光源下的 Lambert 漫反射和 Phong 镜面反射光照模型。

## 1. 技术概述

- **光源类型**: 平行光 (Directional Light)。
- **核心特征**: 光源被假定在无限远处，因此所有光线都是平行的。它只有一个方向向量，没有具体位置，光照强度不会随距离衰减。
- **光照模型**:
    - **环境光 (Ambient)**: 模拟场景中间接光照的全局光。
    - **漫反射 (Diffuse)**: 模拟光线照射到粗糙表面后向各个方向均匀反射的效果，遵循兰伯特余弦定律。
    - **镜面反射 (Specular)**: 模拟光线照射到光滑表面后的高光反射，遵循 Phong 模型。

## 2. 文件结构

- **主程序**: `packages/rhi/demo/src/directional-light.ts`
- **HTML 入口**: `packages/rhi/demo/html/directional-light.html`
- **本文档**: `llmdoc/reference/directional-light-demo.md`

## 3. 实现细节

### 几何体

- 使用 `GeometryGenerator.sphere` 创建一个半径为 1 的球体。
- 必须生成法线 (`normals: true`)，因为它们是光照计算的关键输入。

### 着色器

#### 顶点着色器 (`vs`)

- **输入**: `aPosition` (顶点位置), `aNormal` (顶点法线)。
- **Uniforms**: `Transforms` UBO，包含 `uModelMatrix`, `uViewMatrix`, `uProjectionMatrix`。
- **输出**:
    - `gl_Position`: 顶点的最终裁剪空间位置。
    - `v_worldPos`: 传递给片元着色器的世界空间位置。
    - `v_normal`: 转换到世界空间的法线向量。

#### 片元着色器 (`fs`)

- **输入**: `v_worldPos`, `v_normal`。
- **Uniforms**:
    - `uEyePosition`: 摄像机/观察者的世界空间位置。
    - `DirectionalLight` UBO，包含光照参数。
- **光照计算**:
    1.  `normal = normalize(v_normal)`: 标准化法线。
    2.  `lightDir = normalize(uLightDirection)`: 标准化光照方向向量（从物体指向光源）。
    3.  `viewDir = normalize(uEyePosition - v_worldPos)`: 计算观察方向。
    4.  **环境光**: `ambient = uAmbientIntensity * uLightColor`。
    5.  **漫反射**: `diff = max(dot(normal, lightDir), 0.0)`，确保结果不为负。
    6.  **镜面反射**:
        - `reflectDir = reflect(-lightDir, normal)`: 计算反射光向量。
        - `spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess)`: 计算高光强度。
    7.  **最终颜色**: `result = ambient + diffuse + specular`。

### Uniform Buffer Object (UBO)

为了高效地将数据从 CPU 传递到 GPU，我们使用了两个 UBO。

#### `Transforms` UBO

- **大小**: 192 字节 (mat4 * 3)。
- **成员**:
    - `uModelMatrix`: 模型矩阵 (64 字节)。
    - `uViewMatrix`: 视图矩阵 (64 字节)。
    - `uProjectionMatrix`: 投影矩阵 (64 字节)。

#### `DirectionalLight` UBO

- **布局**: `std140`。
- **大小**: 48 字节。
- **成员**:
    ```glsl
    layout(std140) uniform DirectionalLight {
      vec3 uLightDirection;    // 16 bytes (vec3 + 4-byte padding)
      vec3 uLightColor;        // 16 bytes (vec3 + 4-byte padding)
      float uAmbientIntensity; // 4 bytes
      float uDiffuseIntensity; // 4 bytes
      float uSpecularIntensity;// 4 bytes
      float uShininess;        // 4 bytes
    };
    ```
- **注意**: `vec3` 类型在 `std140` 布局下会占用 16 字节，与 `vec4` 相同，因此在 CPU 端填充数据时必须考虑到这一点。

### GUI 参数

通过 `SimpleGUI` 库，可以实时调整以下光照参数：
- `lightDirX/Y/Z`: 控制光照方向向量的三个分量。
- `ambientIntensity`: 环境光强度。
- `diffuseIntensity`: 漫反射强度。
- `specularIntensity`: 镜面反射强度。
- `shininess`: 高光指数，值越大，高光点越小越亮。

## 4. 宪法合规性

- **资源管理**: 所有 `Buffer`, `RenderPipeline` 等 RHI 资源均通过 `runner.track()` 进行追踪，防止内存泄漏。
- **UBO 对齐**: `DirectionalLight` UBO 严格遵循 `std140` 内存对齐规则。
- **着色器精度**: 顶点着色器使用 `highp`, 片元着色器使用 `mediump`。
- **HTML 规范**: HTML 文件引用了指定的 AntUI CDN 和本地 demo 样式表。
- **UI 位置**: FPS 统计位于左上角，GUI 控制面板位于右上角。
