# Strategy: Graphics Bible Optimization

## 1. Analysis
* **Context:** 当前的 `graphics-bible.md` 文档需要根据最新的调研报告进行优化，以建立一套清晰、精确且符合现代图形学实践的渲染宪法。
* **Constitution:**
    - **坐标系:** 右手坐标系 (+X 右, +Y 上, +Z 前)
    - **矩阵布局:** 列主序 (Column-Major), 通过 `m[col*4+row]` 访问
    - **矩阵运算:** 后乘 (Post-multiplication), 例如 `NewTransform = OldTransform * AdditionalTransform`
    - **浮点数比较:** 必须使用 `EPSILON` (核心层 `1e-6`)
    - **性能:** 禁止在循环中创建新对象 (`new Vector3()`, `new Matrix4()`, etc.)，必须复用实例
    - **依赖:** 必须使用官方数学库 `packages/math/src/core/`

## 2. Assessment
<Assessment>
**Complexity:** Level 3
**Risk:** High (定义了渲染引擎的基石，错误将导致全局性问题)
</Assessment>

## 3. Math/Algo Specification (MANDATORY for Level 3)
<MathSpec>
### 1. 图像处理流程 (MVP Transform)
该流程将局部坐标系下的顶点 `P_local` 转换到屏幕坐标系 `P_screen`。

1.  **符号定义:**
    *   `P_local`: 顶点在模型局部坐标系下的坐标 `(x, y, z, 1)`
    *   `M_model`: 模型矩阵 (Model Matrix)，将顶点从局部空间变换到世界空间
    *   `M_view`: 视图矩阵 (View Matrix)，将顶点从世界空间变换到观察空间
    *   `M_proj`: 投影矩阵 (Projection Matrix)，将顶点从观察空间变换到裁剪空间
    *   `P_clip`: 裁剪空间坐标 `(cx, cy, cz, cw)`
    *   `P_ndc`: 归一化设备坐标 (Normalized Device Coordinates) `(nx, ny, nz)`
    *   `P_screen`: 屏幕坐标 `(sx, sy)`

2.  **变换公式 (后乘):**
    ```
    // 单步运算
    P_world = M_model * P_local
    P_view = M_view * P_world
    P_clip = M_proj * P_view

    // 级联运算 (符合后乘规则)
    M_mvp = M_proj * M_view * M_model
    P_clip = M_mvp * P_local
    ```

3.  **透视除法:**
    ```
    P_ndc.x = P_clip.x / P_clip.w
    P_ndc.y = P_clip.y / P_clip.w
    P_ndc.z = P_clip.z / P_clip.w
    ```
    *   NDC 空间范围: `x, y, z` 均在 `[-1, 1]` 区间内 (OpenGL 规范)。

### 2. 纹理坐标系 (UV)
1.  **原点:** (0, 0) 位于纹理图像的 **左下角**。
2.  **U 轴:** 从左到右，范围 `[0, 1]`。
3.  **V 轴:** 从下到上，范围 `[0, 1]`。
    *   这与 OpenGL/WebGL 的标准一致，可以简化与 RHI 层的对接。

### 3. 图像采样和过滤 (双线性插值)
当采样点 `(u, v)` 不与任何纹理像素中心重合时，使用双线性插值计算颜色。

1.  **输入:**
    *   `uv`: 归一化的纹理坐标 `(u, v)`
    *   `texture`: 纹理对象
    *   `tex_dims`: 纹理尺寸 `(width, height)`

2.  **伪代码:**
    ```
    // 1. 计算实际像素坐标
    xy = uv * tex_dims - 0.5

    // 2. 获取四个相邻像素的整数坐标
    x0 = floor(xy.x), y0 = floor(xy.y)
    x1 = x0 + 1, y1 = y0 + 1

    // 3. 采样四个像素的颜色
    C00 = sample(texture, x0, y0) // 左下
    C10 = sample(texture, x1, y0) // 右下
    C01 = sample(texture, x0, y1) // 左上
    C11 = sample(texture, x1, y1) // 右上

    // 4. 计算插值权重
    tx = xy.x - x0
    ty = xy.y - y0

    // 5. 执行两次线性插值 (lerp)
    C_bottom = lerp(C00, C10, tx) // 底部插值
    C_top = lerp(C01, C11, tx)    // 顶部插值

    // 6. 最终颜色
    final_color = lerp(C_bottom, C_top, ty) // 垂直插值
    return final_color
    ```

### 4. 颜色空间转换 (Gamma Correction)
为了在线性空间中进行正确的光照计算，需要对 sRGB 颜色空间的纹理和颜色值进行转换。

1.  **sRGB -> Linear:**
    ```
    // 适用于从 sRGB 纹理或颜色选择器获取的颜色
    // gamma_factor ≈ 2.2
    linear_color = pow(srgb_color, gamma_factor)
    ```

2.  **Linear -> sRGB:**
    ```
    // 适用于将最终计算出的线性颜色写入帧缓冲区
    // inv_gamma_factor = 1.0 / gamma_factor
    srgb_color = pow(linear_color, inv_gamma_factor)
    ```

### 5. 与 RHI 层的接口规范
1.  **顶点缓冲布局 (Vertex Buffer Layout):**
    *   数据必须是平铺 (interleaved) 的 `ArrayBuffer`。
    *   顺序: Position (vec3), Normal (vec3), UV (vec2), Tangent (vec4) ...
    *   示例: `[Px, Py, Pz, Nx, Ny, Nz, U, V, ...]`

2.  **统一缓冲对象 (Uniform Buffer Object / UBO):**
    *   矩阵数据必须以 **列主序** 格式上传到 GPU。
    *   `Float32Array` 在填充时应遵循 `[col0_row0, col0_row1, ..., col1_row0, ...]` 的顺序。
</MathSpec>

## 4. The Plan
<ExecutionPlan>
**Block 1: 规范核心数学流程**
1. 打开 `llmdoc/reference/graphics-bible.md` 文件。
2. 新增或重写 "Coordinate Systems and Transformations" 章节。
3. 嵌入 **MVP Transform** 的数学公式和变换流程图，明确指出使用右手坐标系和后乘规则。

**Block 2: 定义纹理坐标系**
1. 在 `graphics-bible.md` 中创建 "Texture Coordinate System" 章节。
2. 明确定义 UV 原点为左下角，并提供图示说明，以避免混淆。

**Block 3: 确立采样与过滤标准**
1. 在 `graphics-bible.md` 中创建 "Texture Sampling and Filtering" 章节。
2. 写入 **双线性插值** 的伪代码和算法说明，作为默认的 `LINEAR` 过滤实现标准。

**Block 4: 标准化颜色空间**
1. 在 `graphics-bible.md` 中创建 "Color Space" 章节。
2. 写入 **sRGB <-> Linear** 的转换公式，并强制规定：所有光照计算必须在线性空间中进行。

**Block 5: 明确 RHI 接口契约**
1. 在 `graphics-bible.md` 中创建 "RHI Data Interface" 章节。
2. 详细描述顶点缓冲区的内存布局（Interleaved format）和 UBO 中矩阵的列主序布局，作为与底层图形 API 通信的硬性规定。
</ExecutionPlan>
