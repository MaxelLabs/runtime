# Strategy: Graphics Bible Constitution

## 1. Analysis
* **Context:** 当前项目缺乏一份关于图形学系统的核心“宪法”文档，导致新开发者学习曲线陡峭，老开发者也可能在实现上产生分歧。侦察情报已经揭示了图形系统的核心基石：右手坐标系、列主序矩阵和分层精度标准。本策略旨在将这些隐性知识显性化、标准化，形成一份权威的《图形学圣经》（Graphics Bible），作为未来所有图形相关开发的最高准则。
* **Constitution:**
    * **坐标系 (Coordinate System):** 右手坐标系 (Right-Handed). X轴指向右方, Y轴指向上方, Z轴指向前方（视线方向/屏幕外）。
    * **矩阵系统 (Matrix System):** 列主序 (Column-Major) 内存布局。矩阵乘法为后乘 (Post-multiplication)，即 `A.multiply(B)` 计算 `A = A × B`。
    * **数值精度 (Numerical Precision):** 核心EPSILON为 `1e-6`。采用混合误差法进行浮点数比较。

## 2. Assessment
<Assessment>
**Complexity:** Level 3
**Risk:** Low (文档编写风险低，但其准确性对整个图形系统至关重要)
</Assessment>

## 3. Math/Algo Specification (MANDATORY for Level 3)
<MathSpec>
*在编写最终文档前，必须通过以下数学和伪代码验证核心概念。*

1.  **坐标系验证 (Coordinate System Validation):**
    *   **规则:** 基向量叉积必须符合右手定则。
    *   **伪代码:**
        ```
        const X_AXIS = Vector3(1, 0, 0);
        const Y_AXIS = Vector3(0, 1, 0);
        const Z_AXIS = Vector3(0, 0, 1);

        // 验证 X × Y = Z
        const XY_Cross = Cross(X_AXIS, Y_AXIS);
        assert(equals(XY_Cross, Z_AXIS), "X × Y should be Z");

        // 验证 Y × Z = X
        const YZ_Cross = Cross(Y_AXIS, Z_AXIS);
        assert(equals(YZ_Cross, X_AXIS), "Y × Z should be X");
        ```

2.  **矩阵内存布局与索引 (Matrix Memory Layout & Indexing):**
    *   **规则:** 遵循列主序 (Column-Major)。数组 `[m0, m1, m2, m3, ...]` 中，`[m0, m1, m2]` 是第一个列向量。
    *   **表示法:**
        ```
        // Matrix M
        [ m0, m4, m8,  m12 ]  // Row 1
        [ m1, m5, m9,  m13 ]  // Row 2
        [ m2, m6, m10, m14 ]  // Row 3
        [ m3, m7, m11, m15 ]  // Row 4

        // Column 0 = [m0, m1, m2, m3]
        // Column 1 = [m4, m5, m6, m7]
        ```

3.  **变换顺序 (Transformation Order):**
    *   **规则:** 变换矩阵以“后乘”方式应用于点或向量，即 `p' = Projection × View × Model × p`。
    *   **伪代码:**
        ```
        // 代码实现应与数学表达一致
        let M_Model = createTranslation(1, 0, 0);
        let M_View = createLookAt(eye, target, up);
        let M_Proj = createPerspective(fov, aspect, near, far);

        // 链式调用
        let MVP = M_Proj.clone().multiply(M_View).multiply(M_Model);

        // 应用于点
        let transformed_point = MVP.transformPoint(original_point);
        ```

4.  **LookAt 矩阵构造 (Right-Handed LookAt):**
    *   **规则:** 为右手坐标系构建观察矩阵。
    *   **伪代码:**
        ```
        function createLookAt(eye, target, up):
            // Z轴：从目标指向观察者
            z_axis = Normalize(eye - target);
            // X轴：上向量与Z轴的叉积
            x_axis = Normalize(Cross(up, z_axis));
            // Y轴：Z轴与X轴的叉积
            y_axis = Cross(z_axis, x_axis);

            // 构造视图矩阵（从世界到相机）
            // 这是相机坐标系到世界坐标系的变换矩阵的逆
            return Matrix4(
                x_axis.x, y_axis.x, z_axis.x, 0,
                x_axis.y, y_axis.y, z_axis.y, 0,
                x_axis.z, y_axis.z, z_axis.z, 0,
                -Dot(x_axis, eye), -Dot(y_axis, eye), -Dot(z_axis, eye), 1
            ); // 最后一列是平移部分
        ```

5.  **浮点数比较 (Floating-Point Comparison):**
    *   **规则:** 使用混合相对与绝对误差法。
    *   **伪代码:**
        ```
        function equals(a, b, epsilon = 1e-6):
            let diff = abs(a - b);
            if (a == b): // 处理无穷大等情况
                return true;
            else if (a == 0 || b == 0 || diff < EPSILON_MIN_NORMAL):
                // 对于接近零的数或其中一个为零的情况，使用绝对误差
                return diff < (epsilon * EPSILON_MIN_NORMAL);
            else:
                // 否则使用相对误差
                return diff / (abs(a) + abs(b)) < epsilon;
        ```

</MathSpec>

## 4. The Plan
<ExecutionPlan>
**Block 1: [宪法] 核心原则与坐标系 (Core Principles & Coordinate System)**
1.  **目的:** 建立图形系统的绝对真理，统一所有开发者的心智模型。
2.  **章节一：基本教义 (The Creed)**
    *   明确宣布项目采用 **右手坐标系**。
    *   使用图表清晰展示轴向：+X (右), +Y (上), +Z (前/朝向观察者)。
    *   提供 `X × Y = Z` 的叉积验证代码示例，作为坐标系“指纹”。
3.  **章节二：世界与空间 (World & Spaces)**
    *   定义模型空间 (Model Space)、世界空间 (World Space)、观察空间 (View Space)、裁剪空间 (Clip Space) 的概念和转换流程。

**Block 2: [法典] 矩阵系统详解 (Matrix System Deep Dive)**
1.  **目的:** 消除矩阵操作的模糊性，规定唯一的实现标准。
2.  **章节三：内存布局 (Memory Layout)**
    *   强制规定所有矩阵实例必须采用 **列主序 (Column-Major)** 布局。
    *   提供一个 `Matrix4` 数组 `elements[16]` 与其在数学表达中的对应关系图。
    *   **反面教材:** 指出 `[m0, m1, m2, m3]` 代表第一行是 **错误** 的理解。
3.  **章节四：矩阵乘法 (Matrix Multiplication)**
    *   定义 `A.multiply(B)` 的数学意义为 `A_new = A_old × B` (后乘)。
    *   强调变换链的正确顺序：`Proj × View × Model`。
    *   提供代码示例，展示如何从零构建一个完整的 `MVP` 矩阵。
    *   **最佳实践:** 推荐使用 `packages/math/src/core/` 下的矩阵库，并废弃旧有实现。

**Block 3: [度量衡] 数值精度与比较 (Numerics & Precision)**
1.  **目的:** 统一浮点数处理标准，避免因精度问题导致的微小但致命的bug。
2.  **章节五：EPSILON 的分级**
    *   **核心层 (Core Math):** `1e-6`，用于矩阵、向量等底层运算。
    *   **动画层 (Animation):** `1e-5`，用于关键帧插值和时间比较。
    *   **UI/应用层 (UI/Application):** `1e-4`，用于UI布局、拾取等不要求高精度场景。
3.  **章节六：官方比较函数 (Official Comparison Function)**
    *   提供官方 `equals(a, b, epsilon)` 函数的实现代码（参考 MathSpec）。
    *   **强制规定:** 禁止在代码中使用 `a === b` 来直接比较浮点数。

**Block 4: [案例] 关键公式与最佳实践 (Key Formulas & Best Practices)**
1.  **目的:** 提供可以直接复制和使用的权威代码片段，减少重复造轮子和错误实现。
2.  **章节七：核心公式库 (Core Formula Library)**
    *   提供经过验证的 `LookAt` (右手系)、`Perspective`、`Orthographic` 投影矩阵的实现代码和数学推导。
    *   解释点变换 (`p' = M × p`) 与向量（方向）变换 (`v' = M × v`, w=0) 的区别，并提供代码。
3.  **章节八：代码风格与性能**
    *   **Do:** 优先使用矩阵库提供的内置方法（如 `invert()`, `transpose()`）。
    *   **Don't:** 在循环中频繁创建 `new Matrix4()` 或 `new Vector3()`。提倡复用实例。
    *   **Do:** 尽可能预计算不变的矩阵（如投影矩阵）。
</ExecutionPlan>
