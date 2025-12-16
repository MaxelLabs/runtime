# 图形学圣经 (Graphics Bible)

本文档是项目图形系统的核心宪法，所有相关的代码实现都必须严格遵守本文档定义的规则。

## 第一章：基本教义 (The Creed)

### 1.1 坐标系：右手坐标系

本项目统一采用 **右手坐标系 (Right-Handed Coordinate System)**。

-   **+X 轴**: 指向右方
-   **+Y 轴**: 指向上方
-   **+Z 轴**: 指向前方 (从屏幕内部指向观察者)

![Right-Handed Coordinate System](https://i.imgur.com/EAb7e1s.png)

#### 验证法则

所有与坐标系相关的基础运算，必须符合右手定则。基向量的叉积是判断坐标系性质的“指纹”。

```typescript
// 验证: X × Y = Z
const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const Z_AXIS = new Vector3(0, 0, 1);

const xyResult = new Vector3().crossVectors(X_AXIS, Y_AXIS);
console.assert(xyResult.equals(Z_AXIS), "坐标系验证失败: X × Y 应该等于 Z");

// 验证: Y × Z = X
const yzResult = new Vector3().crossVectors(Y_AXIS, Z_AXIS);
console.assert(yzResult.equals(X_AXIS), "坐标系验证失败: Y × Z 应该等于 X");
```

## 第二章：核心变换与矩阵系统

### 2.1 MVP 变换流程 (MVP Transform)

该流程将局部坐标系下的顶点 `P_local` 转换到屏幕坐标系 `P_screen`。这是渲染管线的核心。

#### 1. 符号定义

*   `P_local`: 顶点在模型局部坐标系下的坐标 `(x, y, z, 1)`
*   `M_model`: 模型矩阵 (Model Matrix)，将顶点从局部空间变换到世界空间
*   `M_view`: 视图矩阵 (View Matrix)，将顶点从世界空间变换到观察空间
*   `M_proj`: 投影矩阵 (Projection Matrix)，将顶点从观察空间变换到裁剪空间
*   `P_clip`: 裁剪空间坐标 `(cx, cy, cz, cw)`
*   `P_ndc`: 归一化设备坐标 (Normalized Device Coordinates) `(nx, ny, nz)`
*   `P_screen`: 屏幕坐标 `(sx, sy)`

#### 2. 变换公式 (后乘)

变换遵循后乘 (Post-multiplication) 规则，与代码实现顺序一致。

```
// 单步运算
P_world = M_model * P_local
P_view = M_view * P_world
P_clip = M_proj * P_view

// 级联运算 (符合后乘规则)
M_mvp = M_proj * M_view * M_model
P_clip = M_mvp * P_local
```

#### 3. 透视除法

从裁剪空间 (Clip Space) 到 NDC 空间的转换通过透视除法完成。

```
P_ndc.x = P_clip.x / P_clip.w
P_ndc.y = P_clip.y / P_clip.w
P_ndc.z = P_clip.z / P_clip.w
```

*   **NDC 空间范围**: `x, y, z` 均在 `[-1, 1]` 区间内，符合 OpenGL 规范。超出此范围的几何体将被裁剪。

### 2.2 内存布局：列主序 (Column-Major)

所有矩阵实例在内存中都必须采用 **列主序 (Column-Major)** 布局。这意味着数组中的连续元素构成矩阵的**列**。

对于一个 4x4 矩阵，其 `elements[16]` 数组的布局如下：

|       | Column 0 | Column 1 | Column 2 | Column 3 |
| :---- | :------: | :------: | :------: | :------: |
| **Row 0** | `m[0]`   | `m[4]`   | `m[8]`   | `m[12]`  |
| **Row 1** | `m[1]`   | `m[5]`   | `m[9]`   | `m[13]`  |
| **Row 2** | `m[2]`   | `m[6]`   | `m[10]`  | `m[14]`  |
| **Row 3** | `m[3]`   | `m[7]`   | `m[11]`  | `m[15]`  |

**警告：** 任何将 `[m[0], m[1], m[2], m[3]]` 视为矩阵第一行的实现都是 **绝对错误** 的，必须被禁止。

### 2.3 矩阵乘法：后乘 (Post-multiplication)

矩阵乘法 `A.multiply(B)` 的数学意义为 `A = A × B`。这是一个 **in-place** 操作，即 `A` 实例自身会被修改。

`p_clip = M_projection × M_view × M_model × p_model`

在代码中，由于 `multiply` 是 in-place 操作，为了不修改原始矩阵，必须先 `clone()`：

```typescript
// 假设 M_model, M_view, M_proj 已经计算好
// 必须使用 clone() 来防止 M_proj 被修改
const M_mvp = M_proj.clone().multiply(M_view).multiply(M_model);

// 将模型空间的点变换到裁剪空间
const transformedPoint = originalPoint.applyMatrix4(M_mvp);
```

## 第三章：纹理与颜色空间

### 3.1 纹理坐标系 (UV)

1.  **原点**: (0, 0) 位于纹理图像的 **左下角**。
2.  **U 轴**: 从左到右，范围 `[0, 1]`。
3.  **V 轴**: 从下到上，范围 `[0, 1]`。

这与 OpenGL/WebGL 的标准一致，可以简化与 RHI 层的对接。

![UV Coordinate System](https://i.imgur.com/V2iQ42B.png)

### 3.2 纹理采样与过滤 (双线性插值)

当采样点 `(u, v)` 不与任何纹理像素中心重合时，使用双线性插值计算颜色，作为 `LINEAR` 过滤的默认实现标准。

#### 伪代码

```
// 1. 输入
// uv: 归一化的纹理坐标 (u, v)
// texture: 纹理对象
// tex_dims: 纹理尺寸 (width, height)

// 2. 计算实际像素坐标
xy = uv * tex_dims - 0.5

// 3. 获取四个相邻像素的整数坐标
x0 = floor(xy.x), y0 = floor(xy.y)
x1 = x0 + 1, y1 = y0 + 1

// 4. 采样四个像素的颜色
C00 = sample(texture, x0, y0) // 左下
C10 = sample(texture, x1, y0) // 右下
C01 = sample(texture, x0, y1) // 左上
C11 = sample(texture, x1, y1) // 右上

// 5. 计算插值权重
tx = xy.x - x0
ty = xy.y - y0

// 6. 执行两次线性插值 (lerp)
C_bottom = lerp(C00, C10, tx) // 底部插值
C_top = lerp(C01, C11, tx)    // 顶部插值

// 7. 最终颜色
final_color = lerp(C_bottom, C_top, ty) // 垂直插值
return final_color
```

### 3.3 颜色空间 (Color Space)

为了在线性空间中进行正确的光照计算，需要对 sRGB 颜色空间的纹理和颜色值进行 Gamma 校正。**所有光照计算必须在线性空间中进行。**

#### 1. sRGB -> Linear

适用于从 sRGB 纹理或颜色选择器获取的颜色。

```
// gamma_factor ≈ 2.2
linear_color = pow(srgb_color, gamma_factor)
```

#### 2. Linear -> sRGB

适用于将最终计算出的线性颜色写入帧缓冲区。

```
// inv_gamma_factor = 1.0 / gamma_factor
srgb_color = pow(linear_color, inv_gamma_factor)
```

## 第四章：数值精度与性能

### 4.1 EPSILON 标准

所有浮点数比较必须使用 `EPSILON` 来避免精度问题。核心数学库的默认值为 `1e-6`。严禁在新代码中使用 `a === b` 来直接比较两个浮点数。

```typescript
function fuzzyEquals(a: number, b: number, epsilon: number = 1e-6): boolean {
    return Math.abs(a - b) < epsilon;
}
```

### 4.2 性能：禁止在循环中创建新对象

**绝对禁止** 在循环或高频调用函数（如 `update`）中创建新的实例 (`new Matrix4()`, `new Vector3()`)。这会导致严重的性能问题和GC压力。必须复用实例。

```typescript
// --- 错误示范 ---
function updatePositions_BAD(objects: any[]): void {
    for (const obj of objects) {
        const tempVec = new Vector3(0, 1, 0); // 每次循环都创建新对象
        obj.position.add(tempVec);
    }
}

// --- 正确示范 ---
const _tempVec = new Vector3(0, 1, 0); // 在外部创建一次
function updatePositions_GOOD(objects: any[]): void {
    for (const obj of objects) {
        obj.position.add(_tempVec); // 复用对象
    }
}
```

## 第五章：RHI 数据接口契约

本章定义了与底层图形 API (Render Hardware Interface) 通信的硬性规定。

### 5.1 顶点缓冲布局 (Vertex Buffer Layout)

-   数据必须是平铺 (interleaved) 的 `ArrayBuffer`。
-   顶点属性顺序: Position (vec3), Normal (vec3), UV (vec2), Tangent (vec4) ...
-   示例: `[Px, Py, Pz, Nx, Ny, Nz, U, V, ...]`

### 5.2 统一缓冲对象 (UBO)

-   矩阵数据必须以 **列主序** 格式上传到 GPU。
-   `Float32Array` 在填充时应遵循 `[col0_row0, col0_row1, ..., col1_row0, ...]` 的顺序。

---

## 相关文档

### 🏛️ 基础规范
- [RHI Demo 实现宪法](./rhi-demo-constitution.md) - Demo开发的详细规范和最佳实践
- [编码规范](./coding-conventions.md) - 项目代码风格指南

### 🔧 技术实现
- [矩阵数学API](../api/math-type-reference.md) - 数学库的具体API参考
- [渲染管线整合](../advanced/integration/rendering-pipeline.md) - 将图形学原理应用到渲染管线

### 📦 材质与渲染系统
- [PBR材质系统](../reference/pbr-material-system.md) - 基于物理的渲染实现，严格遵循本圣经的坐标系和颜色空间规则
- [PBR迁移指南](../learning/tutorials/pbr-migration-guide.md) - 从旧PBR到SimplePBR的迁移，遵循图形学最佳实践
- [粒子系统](../reference/particle-system.md) - GPU加速粒子效果，使用本圣经定义的变换系统
- [阴影工具](../reference/shadow-tools.md) - 实时阴影渲染，基于本圣经的光照计算原理

### 🎬 后处理系统
- [后处理系统](../reference/modules/post-processing-system.md) - 完整后处理框架，处理本圣经定义的颜色空间转换
- [FXAA抗锯齿](../reference/modules/fxaa-anti-aliasing.md) - 快速抗锯齿技术，应用于线性颜色空间

### 🎮 演示和示例
- [方向光源Demo](../reference/directional-light-demo.md) - 光照计算的实际应用
- [Phong光照Demo](../reference/phong-lighting-demo.md) - 光照模型的实现示例
- [阴影映射Demo](../reference/shadow-mapping-demo.md) - 阴影技术的完整实现
- [GPU实例化Demo](../reference/instancing-demo.md) - 高效批量渲染，展示变换矩阵优化

### 📚 学习路径
- [Learning 学习层](../learning/) - 从基础到高级的完整学习路径
- [Reference 参考层](../reference/) - 完整的技术文档和API参考
