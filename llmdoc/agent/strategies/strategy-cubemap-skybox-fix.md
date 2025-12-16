# 策略: 修复 Cubemap Skybox 的顶点布局错误

## 1. 分析

*   **Context:** `cubemap-skybox.ts` 示例在渲染时触发了 WebGL 错误 `INVALID_OPERATION: drawArrays: no buffer is bound to enabled attribute`。Investigator 的报告指出，问题的根源在于顶点数据和顶点布局（Vertex Layout）之间存在严重不匹配。具体来说，`GeometryGenerator.cube()` 函数创建了一个包含位置（position）、法线（normal）和纹理坐标（uv）的交错式（interleaved）顶点缓冲，每个顶点的步长（stride）为32字节 `((3+3+2) * 4)`。然而，传递给渲染管线的 `vertexLayout` 却只定义了 `position` 属性，并错误地指定步长为12字节 `(3 * 4)`。这种数据结构与数据描述之间的冲突导致 WebGL 无法正确解析顶点缓冲，从而引发错误。

*   **Constitution:** 本次修复必须严格遵守 Librarian 提供的以下宪法规则：
    1.  **顶点缓冲布局规则：** 顶点数据必须是平铺（interleaved）的 ArrayBuffer，属性顺序严格遵循 Position → Normal → UV。
    2.  **顶点属性配置规则：** `shaderLocation` 必须与顶点着色器中的 `layout(location = N)` 精确匹配。`arrayStride` 必须反映交错式数据的实际总步长。每个属性的 `offset` 必须正确计算。
    3.  **WebGL 错误防范：** 确保所有 `offset` 都是4字节对齐的。

## 2. 评估

<Assessment>
**Complexity:** Level 2 (逻辑)
**Risk:** Low
</Assessment>

**理由:** 此任务涉及对 WebGL 渲染管线状态、数据结构（顶点缓冲）和着色器接口的理解，超出了简单的文本修改，属于逻辑层面。但由于问题定位清晰，修复范围限定在单个 Demo 文件内，因此风险较低。

## 3. 算法/数据结构规范

<MathSpec>
此问题的核心是数据结构的对齐，而非复杂算法。正确的顶点数据结构和布局计算如下：

**数据结构定义 (伪代码):**
```
struct Vertex {
    vec3 position; // 3 * 4 = 12 bytes
    vec3 normal;   // 3 * 4 = 12 bytes
    vec2 uv;       // 2 * 4 =  8 bytes
};
```

**内存布局计算:**
1.  `sizeof(float) = 4` 字节
2.  `arrayStride` (总步长) = `(3 + 3 + 2) * sizeof(float) = 32` 字节
3.  `offset(position)` = `0`
4.  `offset(normal)` = `3 * sizeof(float) = 12`
5.  `offset(uv)` = `(3 + 3) * sizeof(float) = 24`

**顶点属性映射:**
- `position` -> `shaderLocation: 0`
- `normal` -> `shaderLocation: 1`
- `uv` -> `shaderLocation: 2`

</MathSpec>

## 4. 计划

<ExecutionPlan>
**Block 1: 方案设计与决策**

1.  **方案一 (首选): 扩展顶点布局 (Extend Vertex Layout)**
    *   **描述:** 修改 `cubemap-skybox.ts` 中的 `vertexLayout` 对象，使其完整地描述 `GeometryGenerator.cube()` 生成的顶点数据，包括 `position`, `normal`, 和 `uv` 三个属性。
    *   **优点:** 这是最根本、最符合架构的修复方案。它保证了数据源和数据消费者之间的定义完全一致，遵循了宪法规定。
    *   **缺点:** 天空盒的顶点着色器通常只需要 `position`。此方案要求着色器必须声明接收 `normal` 和 `uv` 属性（即使不使用它们），以匹配 `shaderLocation`。
    *   **决策:** **采纳此方案。** 保持数据管道的完整性和一致性是首要原则。

2.  **方案二 (备选): 创建仅包含位置的几何体 (Position-Only Geometry)**
    *   **描述:** 废弃 `GeometryGenerator.cube()` 的使用，转而手动创建一个只包含立方体顶点位置的 `Float32Array`。
    *   **优点:** 实现简单，无需触及着色器代码。
    *   **缺点:** 引入了特定于此 Demo 的几何体创建逻辑，放弃了通用工具 `GeometryGenerator` 的复用性，从长远看不利于代码维护。

**Block 2: 实施步骤**

1.  **读取文件:** 使用 `Read` 工具打开 `/Users/mac/Desktop/project/max/runtime/packages/rhi/demo/src/cubemap-skybox.ts`。
2.  **定位代码:** 找到 `vertexLayout` 的定义（约在第 268-277 行）。
3.  **修改 `vertexLayout`:**
    *   **更新 `arrayStride`:** 将 `arrayStride` 的值从 `12` 修改为 `32`。
    *   **添加属性:** 在 `attributes` 数组中，追加 `normal` 和 `uv` 的属性描述。
    *   **伪代码:**
        ```typescript
        // 原代码:
        // arrayStride: 12,
        // attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }]

        // 修改后:
        arrayStride: 32,
        attributes: [
          { shaderLocation: 0, offset: 0,  format: 'float32x3' }, // position
          { shaderLocation: 1, offset: 12, format: 'float32x3' }, // normal
          { shaderLocation: 2, offset: 24, format: 'float32x2' }  // uv
        ]
        ```
4.  **写入文件:** 使用 `Write` 工具将修改后的内容保存回原文件。
5.  **验证着色器 (重要提示):** 必须检查与此管线关联的顶点着色器代码。确保其包含以下属性定义，否则需要添加：
    ```glsl
    layout(location = 0) in vec3 a_Position;
    layout(location = 1) in vec3 a_Normal;
    layout(location = 2) in vec2 a_Uv;
    ```

**Block 3: 验证与合规性检查**

1.  **编译运行:** 重新编译项目并启动 `cubemap-skybox` demo。
2.  **错误验证:** 检查浏览器控制台，确认 `INVALID_OPERATION` WebGL 错误已消失。
3.  **渲染验证:** 确认天空盒立方体被正确渲染，并且没有出现视觉异常。
4.  **宪法合规性审计:**
    *   [√] 修复后的 `vertexLayout` (stride=32, 3个属性) 与 `GeometryGenerator.cube` 的 interleaved 数据输出完全匹配。
    *   [√] 属性顺序 (Position -> Normal -> UV) 和偏移量 (0, 12, 24) 严格遵守了宪法规定。
    *   [√] 所有修改均在初始化阶段完成，未在渲染循环中创建任何新对象。

</ExecutionPlan>
