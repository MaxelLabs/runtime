# Strategy: Improve Multi-Textures Demo

## 1. Analysis
* **Context**: 当前多纹理混合演示使用随机噪声作为遮罩纹理，导致遮罩模式看起来像"杂乱的覆盖层"，与叠加模式（Overlay）的视觉效果差异不够明显。遮罩模式应该展示基于几何形状的可见性控制，而叠加模式应该展示颜色/光线的交互效果。

* **Risk**: 需要修改着色器代码和Uniform块结构，可能会影响现有的混合模式参数传递。但实现过程相对安全，只涉及新增功能，不会破坏现有功能。

## 2. Assessment
<Assessment>
**Complexity**: Medium
**Impacted Layers**: 着色器层、渲染循环层
</Assessment>

## 3. The Plan
<ExecutionPlan>
**Block 1: 着色器修改**
1. 修改 `BlendParams` Uniform 块，添加 `uTime` uniform 用于传递时间
2. 在片段着色器中实现 `float getProceduralMask(vec2 uv)` 函数
3. 实现移动的聚光灯圆形遮罩效果，使用 `distance(uv, center)` 和 `uTime` 计算动态位置

**Block 2: JavaScript 代码更新**
1. 修改 `blendParamsBuffer` 大小从 16 字节增加到 32 字节（包含 uTime）
2. 在渲染循环中更新 `blendParamsData`，传入当前时间值
3. 更新绑定组布局以匹配新的 Uniform 块结构

**Block 3: 遮罩模式实现**
1. 修改 `BLEND_MASK` case，使用 `getProceduralMask(vTexCoord)` 替代纹理采样
2. 保留遮罩纹理绑定以确保向后兼容性，但默认使用程序化遮罩
3. 调整遮罩算法，使聚光灯效果更加明显（边缘柔和过渡）
</ExecutionPlan>