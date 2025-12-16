# Strategy: 纹理系统第二层 Demo 完成战役

## 1. Analysis
* **Context:** 第二层纹理系统的 5 个 Demo 已经完成了核心实现，但缺少文档支持和入口注册。其中 texture-array Demo 存在底层 WebGL 支持问题，需要先修复。
* **Risk:** texture-array Demo 在 WebGL1 环境下无法运行，因为 TEXTURE_2D_ARRAY 是 WebGL2 特性。需要确保在不支持的环境下给出友好提示。

## 2. Assessment
<Assessment>
**Complexity:** Medium
**Impacted Layers:** Documentation, Entry Points, WebGL Resource Layer
</Assessment>

## 3. The Plan
<ExecutionPlan>
**Block A: 修复 texture-array 底层 WebGL 支持**
1. 修改 `packages/rhi/src/webgl/resources/GLTexture.ts`
   - 在 `getGLTextureTarget` 方法中添加对 `TEXTURE_2D_ARRAY` 的处理
   - 确保正确映射到 `gl.TEXTURE_2D_ARRAY`（WebGL2）

**Block B: 创建 cubemap-skybox Demo 参考文档**
1. 创建 `llmdoc/reference/cubemap-skybox-demo.md`
   - 难度：中级
   - 说明：展示如何使用立方体贴图创建天空盒效果

**Block C: 创建 render-to-texture Demo 参考文档**
1. 创建 `llmdoc/reference/render-to-texture-demo.md`
   - 难度：中级
   - 说明：演示渲染到纹理（RTT）技术，实现镜子效果

**Block D: 创建 texture-array Demo 参考文档**
1. 创建 `llmdoc/reference/texture-array-demo.md`
   - 难度：高级
   - 说明：展示纹理数组的使用，适用于地形渲染等场景

**Block E: 创建 compressed-texture Demo 参考文档**
1. 创建 `llmdoc/reference/compressed-texture-demo.md`
   - 难度：高级
   - 说明：演示各种压缩纹理格式的加载和使用

**Block F: 创建 procedural-texture Demo 参考文档**
1. 创建 `llmdoc/reference/procedural-texture-demo.md`
   - 难度：中级
   - 说明：展示程序化纹理生成技术

**Block G: 统一注册 Demo 入口**
1. 修改 `packages/rhi/demo/index.html`
   - 添加 5 个新 Demo 的导航卡片
   - 按难度排序：中级（cubemap-skybox, render-to-texture, procedural-texture），高级（texture-array, compressed-texture）
   - 确保链接正确指向对应的 HTML 文件

**执行顺序说明：**
- Block A 必须最先执行，修复 texture-array 的底层问题
- Blocks B-F 可以并行执行，各自独立创建文档
- Block G 在所有文档创建完成后执行，统一添加入口链接
</ExecutionPlan>