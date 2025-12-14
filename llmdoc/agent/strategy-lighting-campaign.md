# Lighting Demo Campaign Strategy

## <Constitution> 全局规范（所有 Worker 必读）

[粘贴 Librarian 提取的完整宪法规则]

---

## BLOCK A: flat-shading Demo

### A1. 技术定义
- **着色模型**：Flat Shading（平面着色）
- **核心特征**：每个三角形使用统一法线，产生明显的面片效果
- **实现方式**：在顶点着色器中禁用法线插值，使用 `flat` 关键字

### A2. 文件清单
1. `packages/rhi/demo/src/flat-shading.ts`
2. `packages/rhi/demo/html/flat-shading.html`
3. `llmdoc/reference/flat-shading-demo.md`

### A3. 实现要点
**几何体选择：** `GeometryGenerator.sphere()` with `normals: true`
**着色器特殊性：** 使用 `flat in vec3 vNormal;` 禁用插值
**GUI 参数：**
- lightX/Y/Z: 光照方向
- ambientIntensity: 环境光强度（0-1）

### A4. 代码差异点（vs rotating-cube.ts）
- 移除 Blinn-Phong 高光计算
- 简化为 Lambert 漫反射模型
- 着色器中使用 `flat` 关键字

### A5. 验证标准
- [ ] 球体表面呈现明显的多边形面片
- [ ] 旋转时面片边界清晰可见
- [ ] GUI 可调整光照方向

---

## BLOCK B: gouraud-shading Demo

### B1. 技术定义
- **着色模型**：Gouraud Shading（顶点着色）
- **核心特征**：光照在顶点着色器中计算，片元着色器插值颜色
- **实现方式**：顶点着色器输出最终颜色，片元着色器直接使用

### B2. 文件清单
1. `packages/rhi/demo/src/gouraud-shading.ts`
2. `packages/rhi/demo/html/gouraud-shading.html`
3. `llmdoc/reference/gouraud-shading-demo.md`

### B3. 实现要点
**几何体选择：** `GeometryGenerator.sphere()` with `normals: true`
**着色器特殊性：**
- 顶点着色器：完整光照计算（Lambert diffuse + ambient）
- 片元着色器：直接输出插值颜色
**GUI 参数：**
- lightX/Y/Z: 光照方向
- ambientIntensity: 环境光强度
- diffuseIntensity: 漫反射强度

### B4. 代码差异点（vs rotating-cube.ts）
- 光照计算从片元着色器移到顶点着色器
- 输出 `out vec3 vColor;` 而不是 `out vec3 vNormal;`
- 移除 Blinn-Phong 高光

### B5. 验证标准
- [ ] 球体表面呈现平滑渐变，但高光区域不够精细
- [ ] 可见顶点插值的特征（Mach Bands）
- [ ] GUI 可独立调整漫反射和环境光

---

## BLOCK C: phong-lighting Demo

### C1. 技术定义
- **着色模型**：Phong Lighting（片元着色）
- **核心特征**：光照在片元着色器中逐像素计算，精确高光
- **实现方式**：顶点着色器传递法线和位置，片元着色器完整光照计算

### C2. 文件清单
1. `packages/rhi/demo/src/phong-lighting.ts`
2. `packages/rhi/demo/html/phong-lighting.html`
3. `llmdoc/reference/phong-lighting-demo.md`

### C3. 实现要点
**几何体选择：** `GeometryGenerator.sphere()` with `normals: true`
**着色器特殊性：**
- 使用完整 Phong 反射模型（ambient + diffuse + specular）
- 镜面反射使用 `reflect()` 函数
**GUI 参数：**
- lightX/Y/Z: 光照方向
- ambientIntensity: 环境光强度
- diffuseIntensity: 漫反射强度
- specularIntensity: 镜面反射强度
- shininess: 高光指数（1-128）

### C4. 代码差异点（vs rotating-cube.ts）
- 使用 Phong 反射模型而非 Blinn-Phong
- 使用 `reflect(lightDir, normal)` 而非 `halfDir`
- 添加更多 GUI 控制参数

### C5. 验证标准
- [ ] 球体表面呈现精细高光
- [ ] 高光位置随相机移动而变化
- [ ] GUI 可调整所有光照参数

---

## 共享资源（所有 Block 复用）

### 可直接复用（来自 rotating-cube.ts）
```typescript
// 1. Lighting Uniform Block 结构
const lightingBuffer = runner.track(
  runner.device.createBuffer({
    size: 48,  // vec3(16) + vec3(16) + vec3(16)
    usage: MSpec.RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Lighting Uniform Buffer',
  })
);

// 2. 光照数据填充（std140）
const lightingData = new Float32Array(12);
lightingData[0] = lightDir.x;
lightingData[1] = lightDir.y;
lightingData[2] = lightDir.z;
lightingData[3] = 0; // padding
// ...

// 3. 法线矩阵计算
normalMatrix.copyFrom(modelMatrix);
normalMatrix.invert();
normalMatrix.transpose();
```

### 需要修改的部分
- 着色器代码（每个 Demo 不同）
- GUI 参数（根据光照模型调整）
- 清屏颜色（建议深灰色 `[0.1, 0.1, 0.1, 1.0]`）

---

## Execution Order（执行顺序）

**推荐：Parallel Mode（并行模式）**
- BLOCK A, B, C 之间无依赖关系
- 可以同时启动 3 个 Worker 并行开发
- 最大化开发效率

**备选：Sequential Mode（顺序模式）**
- 顺序：A → B → C
- 每个完成后验证，再进行下一个
- 适合发现共性问题

---

## Quality Gates（质量门禁）

**Critic 检查项：**
1. **Constitution 合规性：**
   - [ ] 所有资源使用 `runner.track()`
   - [ ] Uniform Block 使用 std140 对齐
   - [ ] 着色器精度一致性
   - [ ] Canvas 使用 `.container` 包裹

2. **代码一致性：**
   - [ ] 3 个 Demo 的文件结构一致
   - [ ] GUI 参数命名规范统一
   - [ ] 注释和文档风格一致

3. **功能完整性：**
   - [ ] FPS 显示器、OrbitController、MVP 矩阵全部就绪
   - [ ] 键盘快捷键（ESC/F11/R）全部实现
   - [ ] HTML 介绍面板信息完整

---

## Recorder 更新清单

**需要更新的文档：**
1. `llmdoc/guides/demo-development.md` — 更新第三层完成度
2. `llmdoc/index.md` — 添加 3 个新 Demo 的索引
3. `packages/rhi/demo/index.html` — 添加 3 个 Demo 卡片

**卡片文案模板：**
```html
<div class="demo-card">
  <h3>🔆 平面着色 <span class="difficulty intermediate">中级</span></h3>
  <p>演示 Flat Shading 着色模型，展示每个三角形使用统一法线的面片效果。</p>
  <div class="tech-tags">
    <span class="tech-tag">Flat Shading</span>
    <span class="tech-tag">Lambert 漫反射</span>
    <span class="tech-tag">flat 关键字</span>
  </div>
  <a class="demo-link" href="html/flat-shading.html">🎮 运行Demo</a>
</div>
```

---

## Timeline Estimate（时间预估）

- **Parallel Mode**: 30-45 分钟（3 个 Worker 同时）
- **Sequential Mode**: 60-90 分钟（逐个开发）
- **Critic Review**: 15-20 分钟
- **Documentation Update**: 10-15 分钟

**Total**: 约 1-2 小时完成全部 3 个 Demo
