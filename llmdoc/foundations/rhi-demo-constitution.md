# RHI Demo Implementation Constitution（RHI Demo 实现宪法）

## 概述统计

**调研时间：** 2025-12-14
**Demo 总数：** 22 个
**分析文件：** 50+ TypeScript 文件

### 关键数据

| 指标 | 数量 | 比例 |
|------|------|------|
| **几何体偏好** | | |
| 使用 Quad/Plane | 11 | 50% |
| 使用 Triangle | 5 | 23% |
| 使用其他几何体 | 6 | 27% |
| **纹理类型** | | |
| 程序化纹理 | 31 处使用 | 73.8% |
| 真实纹理加载 | 11 处使用 | 26.2% |
| **坐标变换** | | |
| X 轴旋转 90° | 3 处 | 13.6% |
| **着色器规范** | | |
| GLSL 版本声明 | 50 | 100% |
| 顶点 highp 精度 | 28 | 56% |
| 片元 mediump 精度 | 22 | 44% |
| **UI 组件** | | |
| 显示帮助信息 | 21 | 95.5% |

---

## 1. UI Layout Rules（UI 布局规则）

### 1.1 FPS 显示器（强制规范）

**位置：** 左上角
**工具类：** `Stats`
**配置：**

```typescript
const stats = new Stats({
  position: 'top-left',  // 强制左上角
  show: ['fps', 'ms']     // 显示 FPS 和帧时间
});
```

**位置样式：**
- `top: 10px; left: 10px;`
- 背景：`rgba(30, 30, 30, 0.9)`
- Z-index: `10001`（最高优先级）

**更新方式：**

```typescript
runner.start((dt) => {
  stats.begin();  // 帧开始
  // ... 渲染逻辑 ...
  stats.end();    // 帧结束
});
```

**例外：** 无。所有 Demo 必须显示 FPS。

### 1.2 场景控制 UI（右上角）

**位置：** 右上角
**工具类：** `SimpleGUI`
**配置：**

```typescript
const gui = new SimpleGUI();  // 自动定位到右上角
```

**位置样式：**
- `top: 10px; right: 10px;`
- 宽度：`280px`
- 背景：`rgba(30, 30, 30, 0.95)`
- Z-index: `10000`

**组件类型：**
1. 数字滑块（min/max/step）
2. 布尔开关（checkbox）
3. 下拉选择（options）
4. 颜色选择器（color picker）

### 1.3 Demo 介绍面板（右下角）

**位置：** 右下角（可选）
**大小限制：** `max-width: 400px`
**内容格式：**

```html
<div style="position: fixed; bottom: 20px; right: 20px; max-width: 400px;">
  <h3>Demo 名称</h3>
  <p>功能描述（不超过 3 行）</p>
  <ul>
    <li>技术点 1</li>
    <li>技术点 2</li>
  </ul>
</div>
```

**例外：** 不强制显示，仅复杂 Demo 使用。

### 1.4 键盘快捷键提示（控制台输出）

**强制规范：** 所有 Demo 必须通过 `DemoRunner.showHelp()` 输出控制说明

```typescript
DemoRunner.showHelp([
  'ESC: 退出 Demo',
  'F11: 切换全屏',
  '1-3: 切换纹理',
  '鼠标左键拖动: 旋转视角',
  '鼠标滚轮: 缩放',
  '鼠标右键拖动: 平移',
]);
```

**通用快捷键（标准）：**
- `ESC`: 退出 Demo
- `F11`: 切换全屏
- `Space`: 暂停/继续（如有动画）
- `0`: 重置视角

---

## 2. Geometry Standards（几何体标准）

### 2.1 几何体优先级（推荐规则）

**优先级排序：**

1. **Quad（四边形）**：2D 纹理展示、UI 元素
2. **Plane（平面）**：地面、测试场景
3. **Cube（立方体）**：3D 物体、天空盒
4. **Sphere（球体）**：环境光、天空球
5. **Triangle（三角形）**：最简单演示

**规则：**
- **纹理展示场景必须使用 Quad/Plane**
- **不推荐单独三角形**（除非演示基础功能）
- **优先使用索引绘制**（IndexBuffer）

### 2.2 几何体生成（GeometryGenerator）

**标准调用：**

```typescript
// Quad（带 UV）
const geometry = GeometryGenerator.quad({
  width: 2,
  height: 2,
  uvs: true,
  colors: false  // 纹理场景不需要顶点颜色
});

// Plane（带法线和 UV）
const geometry = GeometryGenerator.plane({
  width: 10,
  height: 10,
  widthSegments: 1,
  heightSegments: 1,
  normals: true,
  uvs: true
});

// Cube（完整属性）
const geometry = GeometryGenerator.cube({
  size: 1,
  normals: true,
  uvs: true
});
```

### 2.3 坐标系变换（X 轴旋转 90°）

**应用场景：** 当需要将 XZ 平面（水平）转换为 XY 平面（正对相机）时

**标准代码：**

```typescript
// 场景 1：Plane 面向相机（程序化纹理展示）
modelMatrix.identity();
modelMatrix.translate(new MMath.Vector3(x, y, 0));
modelMatrix.rotateX(Math.PI / 2);  // 90 度旋转
modelMatrix.scale(new MMath.Vector3(scale, scale, 1));
```

**何时使用：**
- ✅ 程序化纹理网格展示（procedural-texture.ts）
- ✅ 跑道平面俯视效果（mipmaps.ts）
- ❌ 3D 场景中的地面（保持 XZ 平面）
- ❌ 天空盒内部（rotating-cube.ts）

---

## 3. Texture Guidelines（纹理指南）

### 3.1 纹理类型选择（核心规则）

**优先级：**

1. **真实纹理（外部图片）**：展示真实效果、艺术资源
2. **程序化纹理**：测试、调试、占位符

**规则：**

✅ **使用真实纹理的场景：**
- 纹理过滤演示（texture-filtering.ts）
- Mipmap 对比（mipmaps.ts）
- 多纹理混合（multi-textures.ts）
- 压缩纹理（compressed-texture.ts）

✅ **使用程序化纹理的场景：**
- UV 调试（uvDebug）
- 快速原型（checkerboard, gradient）
- 运行时生成（噪声、法线贴图）

### 3.2 真实纹理加载（TextureLoader）

**标准流程：**

```typescript
// 1. 加载纹理数据
const textureData = await TextureLoader.load('../assets/texture/image.jpg', {
  flipY: true,              // 强制 Y 轴翻转（WebGL 坐标系）
  generateMipmaps: false,   // 需要时生成 Mipmap
  format: 'rgba8-unorm'     // 标准格式
});

// 2. 创建 RHI 纹理
const texture = runner.track(
  runner.device.createTexture({
    width: textureData.width,
    height: textureData.height,
    format: MSpec.RHITextureFormat.RGBA8_UNORM,
    usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
    label: 'My Texture',
  })
);

// 3. 上传数据
texture.update(textureData.data as BufferSource);
```

**重要参数：**
- `flipY: true` — **强制启用**（WebGL 坐标系要求）
- `format: 'rgba8-unorm'` — **标准格式**

### 3.3 程序化纹理生成（ProceduralTexture）

**可用类型：**

```typescript
// 1. 棋盘格（最常用，用于测试）
ProceduralTexture.checkerboard({
  width: 256,
  height: 256,
  cellSize: 32,
  colorA: [255, 255, 255, 255],
  colorB: [64, 64, 64, 255]
});

// 2. UV 调试（显示 UV 坐标）
ProceduralTexture.uvDebug({ width: 512, height: 512 });

// 3. 渐变
ProceduralTexture.gradient({
  width: 256,
  height: 256,
  direction: 'horizontal',
  startColor: [255, 0, 0, 255],
  endColor: [0, 0, 255, 255]
});

// 4. 噪声
ProceduralTexture.noise({
  width: 256,
  height: 256,
  type: 'perlin',
  frequency: 4,
  octaves: 4
});

// 5. 纯色
ProceduralTexture.solidColor({
  width: 256,
  height: 256,
  color: [128, 128, 255, 255]
});

// 6. 法线贴图
ProceduralTexture.normalMap({
  width: 256,
  height: 256,
  pattern: 'bumpy',
  strength: 0.5
});
```

### 3.4 纹理格式和采样器

**标准纹理格式：**

```typescript
format: MSpec.RHITextureFormat.RGBA8_UNORM  // 默认格式
```

**标准采样器配置：**

```typescript
const sampler = runner.track(
  runner.device.createSampler({
    magFilter: MSpec.RHIFilterMode.LINEAR,
    minFilter: MSpec.RHIFilterMode.LINEAR,
    mipmapFilter: MSpec.RHIFilterMode.NEAREST,
    addressModeU: MSpec.RHIAddressMode.REPEAT,
    addressModeV: MSpec.RHIAddressMode.REPEAT,
    label: 'Standard Sampler',
  })
);
```

---

## 4. Shader Conventions（着色器约定）

### 4.1 GLSL 版本和精度（强制规范）

**顶点着色器：**

```glsl
#version 300 es
precision highp float;  // 高精度（顶点计算需要）
```

**片元着色器：**

```glsl
#version 300 es
precision mediump float;  // 中精度（节省性能）
```

### 4.2 顶点属性命名（标准前缀）

```glsl
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;
layout(location = 3) in vec3 aColor;
```

**命名规则：** 前缀 `a` = Attribute

### 4.3 Uniform Block 命名（std140 布局）

```glsl
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};
```

**命名规则：**
- Block 名称：大驼峰（Transforms, Lighting）
- 成员名称：小驼峰 + u 前缀（uModelMatrix）

### 4.4 Varying 变量命名

```glsl
out vec2 vTexCoord;
out vec3 vNormal;
out vec3 vWorldPosition;
```

**命名规则：** 前缀 `v` = Varying

---

## 5. Resource Management（资源管理）

### 5.1 资源追踪（强制规范）

**规则：** 所有 RHI 资源必须通过 `runner.track()` 追踪

```typescript
// ✅ 正确
const buffer = runner.track(
  runner.device.createBuffer({ size: 256, usage: MSpec.RHIBufferUsage.UNIFORM })
);

// ❌ 错误（资源泄漏）
const buffer = runner.device.createBuffer({ ... });
```

### 5.2 Buffer 大小对齐（std140 规则）

**std140 对齐规则：**
- `float`: 4 字节
- `vec2`: 8 字节
- `vec3`: **16 字节**（对齐到 16 字节）
- `vec4`: 16 字节
- `mat4`: 64 字节

**示例：**

```typescript
// Transforms Block: 3 个 mat4 = 192 bytes
const transformBuffer = runner.track(
  runner.device.createBuffer({
    size: 192,
    usage: MSpec.RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Transform Uniform Buffer',
  })
);
```

### 5.3 资源标签（Label）

**强制规范：** 所有资源必须提供有意义的 `label`

```typescript
// ✅ 好的标签
label: 'Transform Uniform Buffer'

// ❌ 坏的标签
label: 'Buffer'
```

---

## 6. HTML File Standards（HTML 文件标准）

### 6.1 文件结构（强制规范）

**标准模板：**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Demo 名称] - RHI Demo</title>
  <link rel="stylesheet" href="https://gw.alipayobjects.com/as/g/antui/antui/10.1.32/dpl/antui.css"/>
  <link rel="stylesheet" href="../css/demo-styles.css" />
</head>
<body>
  <div class="container">
    <canvas id="J-canvas"></canvas>
    <div class="info-panel">
      <h2>[图标] [Demo 标题]</h2>
      <p>[功能描述]</p>
      <div class="tech-tags">
        <span class="tech-tag">技术标签1</span>
        <span class="tech-tag">技术标签2</span>
      </div>
    </div>
  </div>
  <script type="module" src="../src/[demo-name].ts"></script>
</body>
</html>
```

### 6.2 CSS 引用规范

**强制规范：**

1. **AntUI CDN**（必需）：
   ```html
   <link rel="stylesheet" href="https://gw.alipayobjects.com/as/g/antui/antui/10.1.32/dpl/antui.css"/>
   ```

2. **通用样式文件**（必需）：
   ```html
   <link rel="stylesheet" href="../css/demo-styles.css" />
   ```

**禁止：**
- ❌ 内嵌样式（`<style>` 标签）
- ❌ 其他 CSS 文件路径（如 `../css/style.css`）
- ❌ 缺少 AntUI CDN

### 6.3 JavaScript 引用规范

**标准路径：** `../src/[demo-name].ts`

**示例：**
```html
<script type="module" src="../src/flat-shading.ts"></script>
<script type="module" src="../src/texture-2d.ts"></script>
<script type="module" src="../src/cubemap-skybox.ts"></script>
```

**重要：**
- ✅ 使用 `../src/` 路径（TypeScript 源文件）
- ❌ 不要使用 `../dist/` 路径
- ✅ 必须添加 `type="module"` 属性

### 6.4 Canvas 容器规范

**强制规范：** Canvas 必须包裹在 `.container` div 中

```html
<div class="container">
  <canvas id="J-canvas"></canvas>
</div>
```

**禁止：**
```html
<!-- ❌ 错误：直接对 Canvas 设置 100% 尺寸会导致黑屏 -->
<style>
  #J-canvas { width: 100%; height: 100%; }
</style>
```

### 6.5 信息面板规范

**位置：** 左下角（通过 CSS 定位）

**标准结构：**
```html
<div class="info-panel">
  <h2>[图标] [Demo 标题]</h2>
  <p>[功能描述，1-2 句话]</p>
  <div class="tech-tags">
    <span class="tech-tag">技术标签1</span>
    <span class="tech-tag">技术标签2</span>
    <span class="tech-tag">技术标签3</span>
  </div>
</div>
```

**示例：**
```html
<div class="info-panel">
  <h2>🔆 Flat Shading (平面着色)</h2>
  <p>演示 Flat Shading 着色模型，展示每个三角形使用统一法线的面片效果。</p>
  <div class="tech-tags">
    <span class="tech-tag">Flat Shading</span>
    <span class="tech-tag">Lambert 漫反射</span>
    <span class="tech-tag">flat 关键字</span>
  </div>
</div>
```

### 6.6 通用样式文件（demo-styles.css）

**位置：** `packages/rhi/demo/css/demo-styles.css`

**包含内容：**
- 全局样式（body, container）
- Canvas 样式和交互状态（cursor）
- 信息面板样式（.info-panel）
- 技术标签样式（.tech-tags, .tech-tag）
- 错误消息样式（.error-message）
- 加载提示样式（.loading）

**规则：**
- ✅ 所有 Demo 共享此文件
- ✅ 不要在 HTML 中重复定义这些样式
- ❌ 不要创建多个通用样式文件

---

## 7. Performance Best Practices（性能最佳实践）

### 7.1 Buffer Hint

```typescript
// 静态数据
hint: 'static'

// 动态数据（每帧更新）
hint: 'dynamic'
```

### 7.2 Uniform 更新频率

- **每帧更新**：变换矩阵、动画参数
- **按需更新**：静态参数、GUI 修改

---

## 8. 常见错误和反模式

### 8.1 资源泄漏

**❌ 错误：** 没有 track
**✅ 正确：** 使用 `runner.track()`

### 8.2 std140 对齐错误

**❌ 错误：** vec3 没有 padding
**✅ 正确：** 添加 4 字节 padding

### 8.3 Y 轴翻转遗漏

**❌ 错误：** `flipY: false`
**✅ 正确：** `flipY: true`

### 8.4 HTML 引用错误

**❌ 错误：** 使用 `../dist/xxx.js` 或内嵌样式
**✅ 正确：** 使用 `../src/xxx.ts` 和 `../css/demo-styles.css`

---

## 9. 检查清单（Checklist）

创建新 Demo 时，请确保：

### UI 和交互
- [ ] FPS 显示器在左上角
- [ ] SimpleGUI 在右上角
- [ ] 实现 ESC 退出
- [ ] 实现 F11 全屏

### 几何体
- [ ] 纹理展示使用 Quad/Plane
- [ ] 使用索引绘制
- [ ] 正确应用 X 轴旋转

### 纹理
- [ ] 优先使用真实纹理
- [ ] `flipY: true`
- [ ] 格式为 `RGBA8_UNORM`

### 着色器
- [ ] 声明 `#version 300 es`
- [ ] 顶点 `highp`，片元 `mediump`
- [ ] Uniform Block 使用 std140 对齐

### 资源管理
- [ ] 所有资源 `runner.track()`
- [ ] 所有资源有 `label`
- [ ] Buffer 大小正确对齐

### HTML 文件规范
- [ ] 使用 AntUI CDN：`<link rel="stylesheet" href="https://gw.alipayobjects.com/as/g/antui/antui/10.1.32/dpl/antui.css"/>`
- [ ] 引用通用样式：`<link rel="stylesheet" href="../css/demo-styles.css" />`
- [ ] JavaScript 引用：`<script type="module" src="../src/[demo-name].ts"></script>`（使用 src/ 而非 dist/）
- [ ] Canvas 包裹在 `.container` div 中
- [ ] 包含 `.info-panel` 介绍面板

---

## 相关文档

### 🏛️ 核心规范
- [图形系统圣经](./graphics-bible.md) - 本宪法遵循的图形学基础原理
- [编码规范](./coding-conventions.md) - 项目代码风格指南

### 📦 实现参考
- [PBR材质系统](../reference/pbr-material-system.md) - 遵循本宪法的PBR材质实现
- [SimplePBR材质](../learning/tutorials/pbr-migration-guide.md) - 基于本宪法优化的PBR实现
- [阴影工具](../reference/shadow-tools.md) - 遵循本宪法规范的阴影系统
- [粒子系统](../reference/particle-system.md) - 符合本宪法性能要求的粒子效果
- [天空盒系统](../reference/skybox-system.md) - 遵循纹理加载规范的天空盒实现

### 🎬 后处理模块
- [后处理系统](../reference/modules/post-processing-system.md) - 符合本宪法规范的后处理框架
- [FXAA抗锯齿](../reference/modules/fxaa-anti-aliasing.md) - 遵循性能规范的抗锯齿实现

### 🎮 Demo集合
- [参考层Demo集合](../reference/) - 27个完整的技术演示，全部遵循本宪法
- [阴影映射Demo](../reference/shadow-mapping-demo.md) - 完整的阴影技术实现
- [GPU实例化Demo](../reference/instancing-demo.md) - 高性能批量渲染示例
- [纹理压缩Demo](../reference/compressed-texture-demo.md) - 纹理加载和压缩技术应用

### 🔧 开发工具
- [渲染管线整合](../advanced/integration/rendering-pipeline.md) - 将本宪法规范应用到完整渲染管线
- [数学API参考](../api/math-type-reference.md) - 遵循矩阵规范的数学库
- [学习层教程](../learning/) - 基于本宪法的系统化学习路径

---

## 结语

本 Constitution 基于 **22 个 Demo** 的深度分析提炼，确保：

1. **一致性** — 所有 Demo 行为统一
2. **可维护性** — 代码清晰易懂
3. **性能** — 遵循最佳实践
4. **可扩展性** — 易于添加新 Demo

**更新记录：**
- v1.0（2025-12-14）— 初始版本
- v1.1（2025-12-17）— 添加交叉引用系统，精简冗余内容