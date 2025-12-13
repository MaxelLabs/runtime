# Strategy: Fix Skybox Demo (COMPLETED)

## 1. Analysis
* **Context:** `packages/rhi/demo/src/cubemap-skybox.ts` 目前使用 `CubemapGenerator.skyGradient()` 生成程序化的天空渐变立方体贴图。GUI 控制允许用户实时调整顶部、地平线和底部颜色。由于某些未明原因，这个 demo 可能出现问题（可能是天空渐变算法的问题）。
* **Risk:**
  - 将同步的纹理生成改为异步加载，需要正确处理 Promise
  - 移除 GUI 控件可能影响用户交互体验
  - 需要确保资源路径的正确性

## 2. Assessment
<Assessment>
**Complexity:** Medium
**Impacted Layers:** Demo 初始化流程、纹理加载、GUI 控制
</Assessment>

## 3. The Plan
<ExecutionPlan>
**Block 1: 资源路径定义**
1. 在 `cubemap-skybox.ts` 中定义 Bridge2 资源的 URL 映射
2. 使用相对路径指向 `assets/cube/Bridge2/` 目录下的 6 个图片
3. 确保路径格式与 `loadFromUrls()` 方法期望的格式匹配

**Block 2: 修改纹理加载逻辑**
1. 将第 157-162 行的 `CubemapGenerator.skyGradient()` 调用替换为 `await CubemapGenerator.loadFromUrls()`
2. 由于 `main()` 函数已经是 async (第 94 行)，可以直接使用 await
3. 保持纹理创建和上传逻辑不变（第 164-188 行）

**Block 3: 清理 GUI 控制**
1. 移除或注释掉第 306-351 行的渐变颜色 GUI 控件（Top Color, Horizon Color, Bottom Color）
2. 保留 Intensity 和 Rotation Speed 控件
3. 移除第 298-302 行的颜色变量定义
4. 修改或移除 `updateSkyboxTexture()` 函数（第 378-398 行），因为不再需要动态更新纹理

**Block 4: 事件处理更新**
1. 移除或修改空格键重置颜色的处理（第 461-471 行）
2. 考虑添加其他有用的控制，如切换不同的天空盒预设

**关键实现细节:**
- `loadFromUrls()` 方法接受 `Record<CubemapFace, string>` 类型的参数
- CubemapFace 类型定义为: 'posX', 'negX', 'posY', 'negY', 'posZ', 'negZ'
- 返回的 Promise 解析为 `CubemapData` 对象，结构与 `skyGradient()` 返回的相同
- 资源路径应该使用相对于 demo HTML 文件的路径

**验证步骤:**
1. 确保所有 6 个面都能正确加载
2. 验证天空盒渲染效果正确
3. 测试残留的 GUI 控件（Intensity, Rotation Speed）仍然工作
</ExecutionPlan>