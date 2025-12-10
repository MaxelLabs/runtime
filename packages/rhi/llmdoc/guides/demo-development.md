# RHI Demo 开发指南

本文档是 RHI Demo 系统的综合调研报告和开发指南。

## 最近更新

### 2025-12-10 新增基础渲染 Demo

添加了两个基础渲染 Demo，进一步完善 RHI Demo 系统的核心功能：

- **colored-triangle**: 顶点颜色插值演示，展示红绿蓝渐变插值效果
- **depth-test**: 深度测试演示，展示多个重叠几何体的正确遮挡关系

### 2025-12-10 新增工具库功能

添加了四个新的工具库模块，进一步完善 Demo 开发能力：

- **TextureLoader**: 纹理加载器（图片加载、Y 轴翻转、Mipmap 自动生成、批量加载）
- **CubemapGenerator**: 立方体贴图工具（纯色、天空渐变、调试着色、从 URL 加载、全景图转换）
- **RenderTarget**: 渲染目标管理器（离屏渲染、多渲染目标 MRT、自动资源管理）
- **ShaderUtils**: 着色器工具类（Uniform 块生成、std140 布局计算、着色器模板、代码片段库）
- **GeometryGenerator 扩展**: 新增 Torus（圆环）、Cone（圆锥）、Cylinder（圆柱）、Capsule（胶囊体）

---

## 一、RHI API 功能模块清单

### 1. 资源模块 (Resources)

| 接口                 | 方法/属性                           | WebGL 实现状态           |
| -------------------- | ----------------------------------- | ------------------------ |
| **IRHIBuffer**       | update(), map(), unmap(), destroy() | ✅ 完整支持              |
| **IRHITexture**      | update(), createView(), destroy()   | ✅ 2D/3D/Cube/压缩       |
| **IRHITextureView**  | texture, format, dimension          | ✅ 逻辑视图              |
| **IRHISampler**      | filter, addressMode                 | ✅ WebGL2原生/WebGL1模拟 |
| **IRHIShaderModule** | code, stage, reflection             | ✅ GLSL编译+反射         |
| **IRHIQuerySet**     | getResult(), reset()                | ✅ 仅WebGL2              |

### 2. 管线模块 (Pipeline)

| 接口                    | 关键特性                                     | WebGL 实现状态 |
| ----------------------- | -------------------------------------------- | -------------- |
| **IRHIRenderPipeline**  | 顶点布局, 混合状态, 深度模板, Push Constants | ✅ std140 UBO  |
| **IRHIComputePipeline** | 计算着色器                                   | ❌ WebGL不支持 |
| **IRHIPipelineLayout**  | 绑定组布局                                   | ✅ 完整        |

### 3. 绑定模块 (Bindings)

| 接口                    | 支持的绑定类型                           | WebGL 实现状态      |
| ----------------------- | ---------------------------------------- | ------------------- |
| **IRHIBindGroupLayout** | buffer, sampler, texture, storageTexture | ✅ 纹理单元自动分配 |
| **IRHIBindGroup**       | 实际资源绑定                             | ✅ uniform数据设置  |

### 4. 命令模块 (Commands)

| 接口                   | 方法                                                                        | WebGL 实现状态 |
| ---------------------- | --------------------------------------------------------------------------- | -------------- |
| **IRHICommandEncoder** | beginRenderPass(), copy\*()                                                 | ✅ 命令队列    |
| **IRHIRenderPass**     | draw(), drawIndexed(), drawIndirect(), setViewport(), beginOcclusionQuery() | ✅ 多附件支持  |
| **IRHIComputePass**    | dispatch()                                                                  | ❌ WebGL不支持 |

### 5. 设备模块 (Device)

| 功能                    | WebGL 实现状态           |
| ----------------------- | ------------------------ |
| 资源创建 (create\*)     | ✅ 11个工厂方法          |
| 特性检测 (hasFeature)   | ✅ 23个特性标志          |
| 扩展检测 (hasExtension) | ✅ WebGL扩展查询         |
| 上下文生命周期          | ✅ ACTIVE/LOST/DESTROYED |
| 资源追踪                | ✅ 自动注册+泄漏检测     |

---

## 二、工具库结构

```
demo/src/utils/
├── index.ts                    # 统一导出
├── core/                       # 核心框架
│   ├── DemoRunner.ts           # Demo 运行器
│   └── types.ts                # 类型定义
├── geometry/                   # 几何体生成
│   ├── GeometryGenerator.ts    # 几何体工厂
│   └── types.ts                # 几何体类型
├── texture/                    # 纹理工具
│   ├── TextureLoader.ts        # 纹理加载器（新增）
│   ├── CubemapGenerator.ts     # 立方体贴图生成器（新增）
│   ├── ProceduralTexture.ts    # 程序化纹理
│   └── types.ts                # 纹理类型
├── rendering/                  # 渲染工具（新增）
│   ├── RenderTarget.ts         # 渲染目标管理器
│   ├── types.ts                # 渲染类型
│   └── index.ts                # 导出
├── shader/                     # 着色器工具（新增）
│   ├── ShaderUtils.ts          # 着色器工具类
│   ├── types.ts                # 着色器类型
│   └── index.ts                # 导出
├── camera/                     # 相机系统
│   ├── OrbitController.ts      # 轨道控制器
│   └── types.ts                # 相机类型
└── ui/                         # UI 工具
    ├── SimpleGUI.ts            # 零依赖 GUI 面板
    ├── Stats.ts                # 性能统计面板
    └── types.ts                # UI 类型
```

**注意**: 数学库使用 `@maxellabs/math` 包中的 `MMath`。工具库已随演示系统重构完成。

---

## 三、已实现工具

### DemoRunner (核心)

统一的 Demo 生命周期管理：

```typescript
import { DemoRunner, GeometryGenerator } from './utils';

const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'Demo Name',
  clearColor: [0.1, 0.1, 0.1, 1.0],
});

await runner.init();

const geometry = GeometryGenerator.triangle({ colors: true });
const buffer = runner.track(runner.device.createBuffer({...}));

runner.start((dt) => {
  const { encoder, passDescriptor } = runner.beginFrame();
  // 渲染代码
  runner.endFrame(encoder);
});
```

### GeometryGenerator (几何体)

支持的几何体：

- `triangle(options)` - 三角形
- `quad(options)` - 四边形
- `cube(options)` - 立方体
- `plane(options)` - 平面
- `sphere(options)` - 球体
- `torus(options)` - 圆环（新增）
- `cone(options)` - 圆锥（新增）
- `cylinder(options)` - 圆柱（新增）
- `capsule(options)` - 胶囊体（新增）

### TextureLoader (纹理加载器 - 新增)

图片加载和处理工具：

- `load(url, options)` - 从 URL 加载单张图片纹理
- `loadAll(urls, options)` - 批量加载多张图片
- `fromImage(image, options)` - 从 HTMLImageElement 创建纹理数据
- `fromImageData(imageData, options)` - 从 ImageData 创建纹理数据
- `generateMipmaps(data, width, height)` - 生成 Mipmap 链（双线性插值）
- `isCompressedFormat(url)` - 检测 KTX/KTX2/DDS 压缩纹理格式

选项支持：
- `flipY` - Y 轴翻转（符合 WebGL 坐标系），默认 `true`
- `generateMipmaps` - 自动生成 Mipmap 链，默认 `false`
- `premultiplyAlpha` - 预乘 Alpha 处理，默认 `false`
- `format` - 纹理格式，默认 `'rgba8-unorm'`

```typescript
// 从 URL 加载单张图片
const texture = await TextureLoader.load('path/to/image.jpg', {
  flipY: true,
  generateMipmaps: true,
});

// 批量加载
const textures = await TextureLoader.loadAll([
  'texture1.jpg',
  'texture2.jpg',
]);
```

### CubemapGenerator (立方体贴图 - 新增)

生成和加载立方体贴图（天空盒、环境映射等）：

- `solidColor(config)` - 生成纯色立方体贴图
- `skyGradient(config)` - 生成天空渐变立方体贴图（顶部-中间-底部）
- `debug(config)` - 生成调试用立方体贴图（每个面不同颜色）
- `loadFromUrls(urls)` - 从 6 张图片 URL 加载立方体贴图
- `fromEquirectangular(url, size)` - 从全景图（等距柱状投影）转换为立方体贴图

```typescript
// 创建天空渐变立方体贴图
const cubemap = CubemapGenerator.skyGradient({
  topColor: [135, 206, 250, 255],    // 天空蓝
  horizonColor: [176, 196, 222, 255], // 淡蓝
  bottomColor: [139, 69, 19, 255],   // 地面棕
  size: 256,
});

// 调试立方体贴图
const debug = CubemapGenerator.debug({ size: 256, showLabels: true });

// 从全景图加载
const cubemapFromPanorama = await CubemapGenerator.fromEquirectangular(
  'panorama.jpg',
  512
);
```

### RenderTarget (渲染目标 - 新增)

简化离屏渲染的封装，自动管理 FBO 和纹理资源：

- 支持多渲染目标（MRT - Multiple Render Targets）
- 自动资源追踪和生命周期管理
- 可选深度/模板附件
- 动态调整大小

主要方法：
- `getRenderPassDescriptor(clearColor?, depthClearValue?)` - 获取渲染通道描述符
- `getColorView(index)` - 获取颜色附件纹理视图
- `getColorTexture(index)` - 获取颜色附件纹理
- `getDepthView()` - 获取深度附件纹理视图
- `getDepthTexture()` - 获取深度附件纹理
- `resize(width, height)` - 调整渲染目标大小
- `destroy()` - 销毁所有资源

```typescript
const renderTarget = runner.track(
  new RenderTarget(runner.device, {
    width: 800,
    height: 600,
    colorAttachmentCount: 2,  // MRT with 2 targets
    depthFormat: RHITextureFormat.DEPTH24_UNORM_STENCIL8,
  })
);

// 获取渲染通道描述符
const passDescriptor = renderTarget.getRenderPassDescriptor([0.1, 0.1, 0.1, 1.0]);

// 获取颜色纹理进行后续采样
const colorTexture = renderTarget.getColorView(0);
```

### ShaderUtils (着色器工具 - 新增)

生成和管理着色器代码：

**Uniform 块工具：**
- `generateUniformBlock(definition)` - 生成 Uniform 块 GLSL 代码（std140 布局）
- `calculateUniformBlockSize(fields)` - 计算 std140 布局大小（字节）
- `calculateUniformBlockLayout(fields)` - 获取详细布局信息（字段偏移）

**标准 Uniform 块：**
- `getTransformsBlock(binding)` - MVP 矩阵块（uModelMatrix, uViewMatrix, uProjectionMatrix）
- `getLightingBlock(binding)` - 光照参数块（uLightPosition, uLightColor, uAmbientColor）
- `getMaterialBlock(binding)` - 材质参数块（uAmbientColor, uDiffuseColor, uSpecularColor, uShininess）

**着色器模板：**
- `basicVertexShader(options)` - 基础顶点着色器（支持法线、UV、顶点颜色）
- `basicFragmentShader(options)` - 基础片段着色器（支持纯色、顶点颜色、纹理、光照）
- `phongShaders()` - 完整的 Phong 光照着色器对（顶点 + 片段）

**着色器片段库：**
- `getLightingSnippet()` - Phong 光照计算代码片段
- `getNormalTransformSnippet()` - 法线变换代码片段
- `getTextureSamplingSnippet()` - 纹理采样代码片段
- `getCommonUniformsSnippet()` - 常见 Uniform 声明
- `getScreenPositionSnippet()` - 屏幕空间位置计算

```typescript
// 生成 Uniform 块
const block = ShaderUtils.generateUniformBlock({
  name: 'Transforms',
  binding: 0,
  fields: [
    { name: 'uModelMatrix', type: 'mat4' },
    { name: 'uViewMatrix', type: 'mat4' },
    { name: 'uProjectionMatrix', type: 'mat4' },
  ],
});

// 计算 Uniform 块大小
const size = ShaderUtils.calculateUniformBlockSize([
  { name: 'time', type: 'float' },
  { name: 'color', type: 'vec3' },
]);

// 使用着色器模板
const vs = ShaderUtils.basicVertexShader({
  hasNormals: true,
  hasUVs: true,
  hasColors: false,
});

const fs = ShaderUtils.basicFragmentShader({
  mode: 'texture',
  hasLighting: true,
});

// Phong 着色器
const { vertex, fragment } = ShaderUtils.phongShaders();
```

### ProceduralTexture (程序化纹理)

支持的纹理类型：

- `checkerboard(config)` - 棋盘格
- `gradient(config)` - 渐变
- `noise(config)` - 噪声 (white/perlin)
- `solidColor(config)` - 纯色
- `uvDebug(config)` - UV 调试
- `normalMap(config)` - 法线贴图

### OrbitController (轨道相机)

球面坐标相机控制：

- 鼠标左键拖动：旋转视角
- 鼠标滚轮：缩放
- 鼠标右键/中键拖动：平移
- 阻尼平滑过渡
- 自动旋转

```typescript
const orbit = new OrbitController(canvas, {
  distance: 5,
  target: [0, 0, 0],
  enableDamping: true,
});

runner.start((dt) => {
  orbit.update(dt);
  const viewMatrix = orbit.getViewMatrix();
  const projMatrix = orbit.getProjectionMatrix(aspect);
});
```

### SimpleGUI (GUI 面板)

零依赖的轻量级 GUI：

- 数字滑块
- 布尔开关
- 颜色选择器
- 下拉选择

```typescript
const gui = new SimpleGUI();
gui.add('speed', { value: 1.0, min: 0, max: 5, onChange: (v) => {...} });
gui.add('enabled', { value: true, onChange: (v) => {...} });
gui.addSeparator('Section');
```

### Stats (性能统计)

实时性能面板：

- FPS 显示
- 帧时间 (ms)
- 内存使用 (可选)

```typescript
const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
runner.start((dt) => {
  stats.begin();
  // 渲染代码
  stats.end();
});
```

---

## 四、已完成 Demo

| #   | 名称             | 文件                | 功能点                               |
| --- | ---------------- | ------------------- | ------------------------------------ |
| 01  | triangle         | triangle.ts         | 最小化渲染流程，MVP 矩阵变换基础实现 |
| 02  | colored-triangle  | colored-triangle.ts  | 顶点颜色属性，红绿蓝渐变插值效果     |
| 03  | rotating-cube    | rotating-cube.ts    | 3D变换、纹理、光照、GUI、相机控制    |
| 04  | quad-indexed     | quad-indexed.ts     | 索引缓冲区绘制，顶点复用             |
| 05  | primitive-types  | primitive-types.ts  | 图元拓扑类型（点/线/三角形）         |
| 06  | viewport-scissor | viewport-scissor.ts | 视口和裁剪矩形，多视口渲染           |
| 07  | depth-test       | depth-test.ts       | 深度测试功能，多个重叠几何体遮挡     |
| 08  | stencil-test     | stencil-test.ts     | 模板测试功能，轮廓效果实现           |
| 09  | blend-modes      | blend-modes.ts      | 各种混合模式（Alpha/加法/乘法等），支持纹理和MVP变换 |

**注意**：所有 Demo 均已集成 Stats 性能监控、OrbitController 相机控制和完整的 MVP 矩阵变换管线（自 2025-12-10）。

---

## 五、Demo 规划 (50 个)

### 第一层：基础渲染 (12 demos)

| #   | 名称             | 验证功能点       | 状态                   |
| --- | ---------------- | ---------------- | ---------------------- |
| 01  | triangle         | 最小化渲染流程   | ✅ 完成                |
| 02  | colored-triangle | 顶点颜色属性     | ✅ 完成                |
| 03  | quad-indexed     | 索引缓冲区绘制   | ✅ 完成                |
| 04  | rotating-cube    | 3D 变换矩阵      | ✅ 完成                |
| 05  | multiple-buffers | 多顶点缓冲区     | 待实现                 |
| 06  | dynamic-buffer   | 缓冲区动态更新   | 待实现                 |
| 07  | vertex-formats   | 各种顶点格式     | 待实现                 |
| 08  | primitive-types  | 点/线/三角形拓扑 | ✅ 完成                |
| 09  | viewport-scissor | 视口和裁剪矩形   | ✅ 完成                |
| 10  | depth-test       | 深度测试         | ✅ 完成                |
| 11  | stencil-test     | 模板测试         | ✅ 完成（2025-12-10 新增） |
| 12  | blend-modes      | 混合模式         | ✅ 完成，支持 MVP 变换和纹理 |

### 第二层：纹理系统 (10 demos)

| #   | 名称               | 验证功能点         | 状态     |
| --- | ------------------ | ------------------ | -------- |
| 13  | texture-2d         | 基础 2D 纹理采样   | 待实现   |
| 14  | texture-wrapping   | 重复/镜像/钳制模式 | 待实现   |
| 15  | texture-filtering  | 线性/最近邻过滤    | 待实现   |
| 16  | mipmaps            | Mipmap 生成和使用  | 待实现   |
| 17  | multi-textures     | 多纹理混合         | 待实现   |
| 18  | cubemap-skybox     | 立方体贴图天空盒   | 待实现   |
| 19  | render-to-texture  | 渲染到纹理         | 待实现   |
| 20  | texture-array      | 纹理数组 (WebGL2)  | 待实现   |
| 21  | compressed-texture | 压缩纹理格式       | 待实现   |
| 22  | procedural-texture | 程序化纹理生成     | 部分完成 |

### 第三层：光照与材质 (10 demos)

| #   | 名称                | 验证功能点       | 状态                 |
| --- | ------------------- | ---------------- | -------------------- |
| 23  | flat-shading        | 平面着色         | 待实现               |
| 24  | gouraud-shading     | Gouraud 着色     | 待实现               |
| 25  | phong-lighting      | Phong 光照模型   | 待实现               |
| 26  | blinn-phong         | Blinn-Phong 高光 | rotating-cube 已演示 |
| 27  | directional-light   | 平行光源         | 待实现               |
| 28  | point-lights        | 多点光源         | 待实现               |
| 29  | spotlight           | 聚光灯效果       | 待实现               |
| 30  | normal-mapping      | 法线贴图         | 待实现               |
| 31  | environment-mapping | 环境反射         | 待实现               |
| 32  | pbr-material        | PBR 材质基础     | 待实现               |

### 第四层：高级渲染 (10 demos)

| #   | 名称                 | 验证功能点          | 状态   |
| --- | -------------------- | ------------------- | ------ |
| 33  | instancing           | 实例化渲染          | 待实现 |
| 34  | indirect-draw        | 间接绘制            | 待实现 |
| 35  | multi-render-targets | MRT 多渲染目标      | 待实现 |
| 36  | shadow-mapping       | 基础阴影贴图        | 待实现 |
| 37  | pcf-shadows          | PCF 软阴影          | 待实现 |
| 38  | post-process         | 后处理框架          | 待实现 |
| 39  | bloom                | 辉光效果            | 待实现 |
| 40  | fxaa                 | FXAA 抗锯齿         | 待实现 |
| 41  | deferred-shading     | 延迟着色 (G-Buffer) | 待实现 |
| 42  | msaa                 | 多重采样抗锯齿      | 待实现 |

### 第五层：查询与优化 (8 demos)

| #   | 名称              | 验证功能点         | 状态                 |
| --- | ----------------- | ------------------ | -------------------- |
| 43  | occlusion-query   | 遮挡查询           | 待实现               |
| 44  | timestamp-query   | 时间戳查询         | 待实现               |
| 45  | push-constants    | Push Constants API | 待实现               |
| 46  | uniform-buffer    | UBO 使用           | rotating-cube 已演示 |
| 47  | resource-tracking | 资源追踪演示       | 待实现               |
| 48  | context-recovery  | 上下文丢失恢复     | 待实现               |
| 49  | performance-tips  | 性能优化技巧       | 待实现               |
| 50  | stress-test       | 压力测试           | 待实现               |

---

## 六、Demo 开发规范

### 1. 必需组件（自 2025-12-10 起强制）

每个 Demo **必须**包含以下组件：

#### MVP 矩阵变换（自 2025-12-10 起新增）

所有 Demo 必须实现完整的 Model-View-Projection 矩阵变换管线：

```typescript
import { MMath } from '@maxellabs/core';

// 1. 创建模型矩阵
const modelMatrix = new MMath.Matrix4();

// 2. 在渲染循环中更新变换
runner.start((dt) => {
  orbit.update(dt);

  // 获取视图和投影矩阵
  const viewMatrix = orbit.getViewMatrix();
  const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

  // 3. 更新 Uniform 缓冲区
  const transformData = new Float32Array(64);
  transformData.set(modelMatrix.toArray(), 0);
  transformData.set(viewMatrix, 16);
  transformData.set(projMatrix, 32);
  transformBuffer.update(transformData, 0);

  // 渲染代码...
});
```

**着色器要求**：

```glsl
// 必须包含 Transforms uniform 块
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

// 使用 MVP 变换
gl_Position = uProjectionMatrix * uViewMatrix * (uModelMatrix * vec4(aPosition, 1.0));
```

#### Stats 性能监控

```typescript
import { Stats } from './utils';

// 初始化
const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });

// 渲染循环中
runner.start((dt) => {
  stats.begin();
  // 渲染代码...
  stats.end();
});
```

#### OrbitController 相机控制

```typescript
import { OrbitController } from './utils';

// 初始化
const orbit = new OrbitController(runner.canvas, {
  distance: 3, // 根据场景大小调整
  target: [0, 0, 0],
  enableDamping: true,
  autoRotate: false,
  autoRotateSpeed: 0.5,
});

// 渲染循环中
runner.start((dt) => {
  orbit.update(dt);
  // 获取矩阵
  const viewMatrix = orbit.getViewMatrix();
  const projMatrix = orbit.getProjectionMatrix(aspect);
});

// 退出时销毁
runner.onKey('Escape', () => {
  stats.destroy();
  orbit.destroy();
  runner.destroy();
});
```

### 2. UI 布局规范

#### 左上角：Stats 性能监控

- 由 Stats 组件自动渲染
- 位置：`position: 'top-left'`
- 显示 FPS 和帧时间

#### 左下角：Demo 介绍面板

```css
.info-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  font-size: 13px;
  max-width: 320px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}
```

HTML 结构：

```html
<div class="info-panel">
  <h3>🔺 Demo 名称</h3>
  <p class="description">简洁的 Demo 描述...</p>
  <div class="tech-points">
    <h4>💡 技术要点</h4>
    <ul>
      <li>技术点 1</li>
      <li>技术点 2</li>
      <li>技术点 3</li>
    </ul>
  </div>
</div>
```

### 3. 渲染循环规范

```typescript
runner.start((dt) => {
  // 1. 更新状态
  orbit.update(dt);

  // 2. 开始性能统计
  stats.begin();

  // 3. 渲染代码
  const { encoder, passDescriptor } = runner.beginFrame();
  // ... 渲染逻辑 ...
  runner.endFrame(encoder);

  // 4. 结束性能统计
  stats.end();
});
```

### 4. 帮助信息规范

必须包含以下内容：

- ESC：退出 Demo
- F11：切换全屏
- 鼠标控制说明

```typescript
DemoRunner.showHelp([
  'ESC: 退出 Demo',
  'F11: 切换全屏',
  '鼠标左键拖动: 旋转视角',
  '鼠标滚轮: 缩放',
  '鼠标右键拖动: 平移',
]);
```

### 5. 导入规范

```typescript
import { MSpec } from '@maxellabs/core';
import {
  DemoRunner,
  GeometryGenerator,
  OrbitController, // 必需
  Stats, // 必需
} from './utils';
```

---

## 七、相关文档

- [RHI 概览](/llmdoc/overview/rhi-overview.md)
- [WebGL 实现架构](/llmdoc/architecture/webgl-implementation.md)
- [资源追踪 API](/llmdoc/reference/resource-tracker-api.md)
- [上下文丢失处理](/llmdoc/guides/handle-context-loss.md)
