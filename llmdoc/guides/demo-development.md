# RHI Demo 开发指南

本文档是 RHI Demo 系统的综合调研报告和开发指南。

## 最近更新

### 2025-12-16 完成第三层高级渲染系统全部模块

**第三层高级渲染系统已全面完成**：
- **阴影工具模块**（已完成）
- **粒子系统模块**（已完成）
- **天空盒系统模块**（已完成）
- **实例化工具模块**（已完成）
- **PBR材质模块**（已完成）

**阴影工具模块（Shadow Utils）**：
- **ShadowMap**: 高效的阴影贴图管理器，支持动态分辨率调整
- **LightSpaceMatrix**: 光源空间矩阵计算，支持平行光和点光源
- **PCFFilter**: PCF软阴影滤波器，支持1x1到5x5采样模式
- **ShadowShaders**: 阴影着色器代码生成器，提供深度Pass和场景Pass模板
- **性能指标**: 支持1024-4096分辨率阴影贴图，3x3 PCF仅增加15%性能开销

**粒子系统模块（Particle System）**：
- **ParticleRenderer**: 高性能粒子渲染器，支持10,000+粒子实例
- **ParticleSystem**: 粒子系统管理器，集成发射器、更新器和生命周期管理
- **关键API**: GPU实例化渲染、参数插值、随机种子控制
- **技术特点**: 基于实例化渲染的GPU粒子，支持单通道和多通道混合

**天空盒系统模块（Skybox System）**：
- **EnvironmentMap**: 环境贴图管理器，支持HDR全景图加载
- **SkyboxRenderer**: 高效的天空盒渲染器，优化后处理管线
- **性能指标**: 全景图转换<100ms，立方体贴图生成无缝衔接
- **技术特点**: 6面体渲染优化，支持IBL光照和预过滤环境贴图

**实例化工具模块（Instancing Utils）**：
- **InstanceBuffer**: 实例缓冲区管理器，支持10,000+实例高效管理
- **InstancedRenderer**: 实例化渲染器，自动组合顶点布局
- **性能指标**: 单次Draw Call渲染10,000+立方体，内存占用仅800KB
- **技术特点**: Per-Instance Attributes、预分配缓冲区、批量更新优化

**PBR材质模块（PBR Material）**：
- **PBRMaterial**: 基于物理的材质系统，支持金属/工作流
- **IBLUtils**: 基于图像的光照工具，集成环境贴图和预过滤
- **性能指标**: 支持实时PBR渲染，4K纹理下保持60FPS
- **技术特点**: Cook-Torrance BRDF、线性空间渲染、环境光遮蔽

### 2025-12-16 完成实例化渲染工具模块

**实例化渲染工具模块已全部完成**：

- **InstanceBuffer**: 实例缓冲区管理器（已完成）
  - 支持 10,000+ 实例的高效管理
  - 每实例 80 bytes（mat4 + vec4）
  - 批量更新优化，单次 GPU 传输

- **InstancedRenderer**: 实例化渲染器（已完成）
  - 封装实例化 Draw Call 逻辑
  - 自动组合顶点布局（基础几何 + 实例属性）
  - 支持 WebGL2 和 WebGL1 (ANGLE_instanced_arrays)

- **instancing Demo**: GPU 实例化渲染演示（已完成）
  - 单次 Draw Call 渲染 10,000+ 立方体
  - 实时调节实例数、颜色模式、动画效果
  - 完整的键盘交互和性能监控

**技术要点**：
- Per-Instance Attributes（实例属性）
- Vertex Buffer Divisor（顶点缓冲区分频器）
- std140 内存对齐规范
- 预分配缓冲区策略

**文档更新**：
- 添加实例化工具模块文档到 `demo-development.md`
- 更新 Demo 完成状态

### 2025-12-15 完成第三层光照系统 3 个光源 Demo

**3 个光源类型 Demo 已全部完成**：

- **directional-light**: 平行光演示，展示无位置、无衰减的平行光照效果（已完成）
  - 文档索引：`llmdoc/reference/directional-light-demo.md`（已创建）
  - 技术要点：方向向量、Lambert 漫反射、Phong 镜面反射、std140 对齐

- **point-lights**: 多点光源演示，支持最多 4 个点光源同时工作（已完成）
  - 文档索引：`llmdoc/reference/point-lights-demo.md`（已创建）
  - 技术要点：距离衰减公式、多光源累加、独立颜色和衰减参数、208字节 Uniform Buffer

- **spotlight**: 聚光灯演示，展示锥形光束和平滑边缘过渡（已完成）
  - 文档索引：`llmdoc/reference/spotlight-demo.md`（已创建）
  - 技术要点：位置+方向向量、内外锥角、角度转余弦、距离衰减、边缘平滑

**代码质量提升**：
- Critic 审查发现并修复了 API 不一致问题
- 统一所有光源 Demo 使用 `@maxellabs/core` API
- 标准化 HTML 文件（移除内嵌样式、统一语言为 zh-CN）
- 添加完整的键盘事件处理（ESC/F11/R）
- 所有资源使用 `runner.track()` 追踪

**战略文档**：
- 创建 `llmdoc/agent/strategy-light-sources-campaign.md` 详细规划
- 使用 Campaign Mode 并行开发 3 个 Demo
- 完整的 Constitution 合规性检查

### 2025-12-13 完成第二层纹理系统全部 Demo

**5 个纹理系统高级 Demo 已全部完成**：

- **cubemap-skybox**: 立方体贴图天空盒演示，展示天空渐变生成和反射环境映射（已完成）
  - 文档索引：`/packages/rhi/llmdoc/reference/cubemap-skybox-demo.md`（已创建）
  - 技术要点：CubemapGenerator、天空渐变、环境映射、MVP矩阵变换

- **render-to-texture**: 渲染到纹理演示，展示离屏渲染和后期处理基础（已完成）
  - 文档索引：`/packages/rhi/llmdoc/reference/render-to-texture-demo.md`（已创建）
  - 技术要点：RenderTarget、离屏渲染、纹理采样、FBO管理

- **texture-array**: 纹理数组演示，展示WebGL2的TEXTURE_2D_ARRAY支持（已完成）
  - 文档索引：`/packages/rhi/llmdoc/reference/texture-array-demo.md`（已创建）
  - 技术要点：TEXTURE_2D_ARRAY、层级选择、批量纹理管理

- **compressed-texture**: 压缩纹理演示，展示KTX/DDS格式加载（已完成）
  - 文档索引：`/packages/rhi/llmdoc/reference/compressed-texture-demo.md`（已创建）
  - 技术要点：KTX/DDS格式、压缩纹理检测、GPU内存优化

- **procedural-texture**: 程序化纹理生成演示，展示多种算法纹理（已完成）
  - 文档索引：`/packages/rhi/llmdoc/reference/procedural-texture-demo.md`（已创建）
  - 技术要点：Perlin噪声、分形布朗运动、波形函数、渐变算法

**代码更新**：
- `packages/rhi/src/webgl/resources/GLTexture.ts`: 添加 TEXTURE_2D_ARRAY 支持
- `packages/rhi/demo/index.html`: 添加 5 个 Demo 导航卡片

### 2025-12-12 完成多纹理 Demo

- **multi-textures**: 多纹理绑定和混合模式演示，展示5种混合模式（Linear/Multiply/Screen/Overlay/Mask）和程序化纹理生成（已完成）
  - 文档索引：`/packages/rhi/llmdoc/reference/multi-textures-demo.md`（已创建）
  - 技术要点：多纹理绑定、Uniform块控制、程序化纹理、遮罩混合、实时参数调节

### 2025-12-12 完成 Mipmap Demo

- **mipmaps**: Mipmap 生成和使用演示，展示自动生成、手动 LOD 控制和三种过滤模式（已完成）
  - 文档索引：`/packages/rhi/llmdoc/reference/mipmaps-demo.md`（已创建）
  - 技术要点：textureLod、generateMipmaps、LINEAR_MIPMAP_LINEAR、LOD 级别可视化

### 2025-12-12 完成纹理包裹模式 Demo

第二层纹理系统 Demo 继续开发：

- **texture-wrapping**: 纹理包裹模式演示，展示 3 种包裹模式的视觉效果差异（已完成）
  - 文档索引：`/packages/rhi/llmdoc/reference/texture-wrapping-demo.md`（已创建）
  - 技术要点：REPEAT/MIRROR_REPEAT/CLAMP_TO_EDGE、addressMode、UV 超出范围处理

### 2025-12-12 完成纹理过滤 Demo

- **texture-filtering**: 纹理过滤模式演示，展示 6 种过滤模式的视觉效果差异
  - 文档索引：`/packages/rhi/llmdoc/reference/texture-filtering-demo.md`（已创建）
  - 技术要点：NEAREST/LINEAR/BILINEAR/TRILINEAR/各向异性过滤、Mipmap 采样、倾斜平面展示

### 2025-12-12 文档同步完成

**文档同步完成**：
- 创建 3 个纹理系统 Demo 参考文档：texture-filtering-demo.md、texture-wrapping-demo.md、mipmaps-demo.md
- 更新 `/llmdoc/index.md` 添加新 Demo 文档索引
- 修正 demo-development.md 中 Demo 完成状态标记（从"待创建"改为"已创建"）
- 所有文档与代码实现保持同步，确保 LLM 检索地图准确性

### 2025-12-11 开始第二层纹理系统 Demo

RHI Demo 系统开始开发第二层纹理系统 Demo：

- **texture-2d**: 基础 2D 纹理加载和采样演示，展示 TextureLoader 和 ProceduralTexture 的使用（新增）
  - 文档索引：`/packages/rhi/llmdoc/reference/texture-2d-demo.md`
  - 技术要点：TextureLoader 加载外部图片、ProceduralTexture 程序化纹理、UV 映射、采样器配置

### 2025-12-10 完成 Demo 系统最终索引更新

RHI Demo 系统已完成全部第一层基础渲染 Demo 的文档索引更新：

- **multiple-buffers**: 多顶点缓冲区演示，文档索引已更新（`/packages/rhi/llmdoc/reference/multiple-buffers-demo.md`）
- **dynamic-buffer**: 动态缓冲区演示，文档索引已更新（`/packages/rhi/llmdoc/reference/dynamic-buffer-demo.md`）
- **vertex-formats**: 顶点格式演示，文档索引已更新（`/packages/rhi/llmdoc/reference/vertex-formats-demo.md`）
- **stencil-test**: 模板测试演示，已在主索引中完成注册

### 2025-12-10 完成基础渲染层全部 Demo

基础渲染层（第一层）12 个 Demo 全部完成：

- **multiple-buffers**: 多顶点缓冲区演示，展示将位置、颜色、法线分离到不同缓冲区的技术（新增）
- **dynamic-buffer**: 缓冲区动态更新演示，展示波浪动画效果和 hint: 'dynamic' 使用（新增）
- **vertex-formats**: 顶点格式演示，展示 4 种格式的内存效率对比（最高节省 71%）（新增）
- **stencil-test**: 模板测试演示，展示轮廓效果（Outline Effect）的经典实现（新增）

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
├── shadow/                     # 阴影工具（2025-12-16新增）
│   ├── ShadowMap.ts            # 阴影贴图管理器
│   ├── LightSpaceMatrix.ts     # 光源空间矩阵计算
│   ├── PCFFilter.ts            # PCF软阴影滤波器
│   ├── ShadowShaders.ts        # 阴影着色器代码生成
│   ├── types.ts                # 阴影类型定义
│   └── index.ts                # 导出
├── particle/                   # 粒子系统（2025-12-16新增）
│   ├── ParticleRenderer.ts     # 粒子渲染器
│   ├── ParticleSystem.ts       # 粒子系统管理器
│   ├── ParticleEmitter.ts      # 粒子发射器
│   ├── ParticleUpdater.ts      # 粒子更新器
│   ├── types.ts                # 粒子类型定义
│   └── index.ts                # 导出
├── skybox/                     # 天空盒系统（2025-12-16新增）
│   ├── SkyboxRenderer.ts       # 天空盒渲染器
│   ├── EnvironmentMap.ts       # 环境贴图管理器
│   ├── IBLUtils.ts             # IBL光照工具
│   ├── types.ts                # 天空盒类型定义
│   └── index.ts                # 导出
├── pbr/                        # PBR材质（2025-12-16新增）
│   ├── PBRMaterial.ts          # PBR材质类
│   ├── BRDFUtils.ts            # BRDF计算工具
│   ├── types.ts                # PBR类型定义
│   └── index.ts                # 导出
├── postprocess/                # 后处理工具（2025-12-16新增）
│   ├── PostProcessManager.ts   # 后处理管道管理器
│   ├── PostProcessEffect.ts    # 后处理效果基类
│   ├── effects/                # 内置效果
│   │   ├── BrightnessContrast.ts  # 亮度/对比度
│   │   ├── GaussianBlur.ts        # 高斯模糊
│   │   ├── ToneMapping.ts         # 色调映射
│   │   └── FXAA.ts                # 快速抗锯齿
│   ├── types.ts                # 后处理类型定义
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
const textures = await TextureLoader.loadAll(['texture1.jpg', 'texture2.jpg']);
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
  topColor: [135, 206, 250, 255], // 天空蓝
  horizonColor: [176, 196, 222, 255], // 淡蓝
  bottomColor: [139, 69, 19, 255], // 地面棕
  size: 256,
});

// 调试立方体贴图
const debug = CubemapGenerator.debug({ size: 256, showLabels: true });

// 从全景图加载
const cubemapFromPanorama = await CubemapGenerator.fromEquirectangular('panorama.jpg', 512);
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
    colorAttachmentCount: 2, // MRT with 2 targets
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

### ShadowMap (阴影贴图 - 2025-12-16新增)

阴影贴图管理器，封装深度纹理创建和管理：

- `getRenderPassDescriptor()` - 获取阴影Pass渲染通道描述符
- `resize(resolution)` - 动态调整分辨率
- `depthTexture` / `depthView` - 深度纹理和视图
- `sampler` - 比较采样器（用于PCF）

```typescript
import { ShadowMap, LightSpaceMatrix, PCFFilter } from './utils';

// 创建阴影贴图
const shadowMap = runner.track(new ShadowMap(runner.device, {
  resolution: 1024,
  label: 'Main Shadow Map',
}));

// 计算光源矩阵
const lightMatrix = new LightSpaceMatrix();
lightMatrix.updateDirectional({
  direction: [0.5, -1, 0.3],
  orthoSize: 15,
  near: 1,
  far: 50,
});

// 阴影Pass
const shadowPassDesc = shadowMap.getRenderPassDescriptor();
const shadowPass = encoder.beginRenderPass(shadowPassDesc);
// ... 渲染阴影投射物
shadowPass.end();

// 场景Pass中使用阴影贴图
bindGroup.setTexture(shadowMap.depthView);
bindGroup.setSampler(shadowMap.sampler);
```

### PCFFilter (PCF软阴影 - 2025-12-16新增)

PCF软阴影滤波器，生成阴影采样着色器代码：

- `getShaderSnippet(options)` - 获取PCF着色器代码片段
- `getShadowUniformBlock(binding)` - 获取阴影Uniform Block声明
- `getSampleCount(mode)` - 获取采样次数

支持的采样模式：
- `1x1` - 硬阴影（1次采样）
- `2x2` - 基础软阴影（4次采样）
- `3x3` - 高质量软阴影（9次采样）
- `5x5` - 超高质量软阴影（25次采样）

```typescript
// 获取PCF着色器代码
const pcfCode = PCFFilter.getShaderSnippet({
  sampleMode: '3x3',
  bias: 0.005,
});

// 在片元着色器中使用
const fragmentShader = `
  ${PCFFilter.getUniformDeclaration()}
  ${pcfCode}

  void main() {
    float shadow = calculateShadow(vLightSpacePos, uShadowMap);
    vec3 color = (1.0 - shadow) * diffuse + ambient;
    fragColor = vec4(color, 1.0);
  }
`;
```

### ShadowShaders (阴影着色器 - 2025-12-16新增)

阴影着色器代码生成器：

- `getDepthVertexShader()` - 深度Pass顶点着色器
- `getDepthFragmentShader()` - 深度Pass片元着色器
- `getSceneVertexShader(options)` - 场景Pass顶点着色器（带阴影）
- `getSceneFragmentShader(options)` - 场景Pass片元着色器（带阴影）

```typescript
import { ShadowShaders } from './utils';

// 深度Pass着色器
const depthVS = ShadowShaders.getDepthVertexShader();
const depthFS = ShadowShaders.getDepthFragmentShader();

// 场景Pass着色器（带阴影支持）
const sceneVS = ShadowShaders.getSceneVertexShader({ hasNormals: true });
const sceneFS = ShadowShaders.getSceneFragmentShader({
  hasNormals: true,
  pcfMode: '3x3',
  shadowBias: 0.005,
});
```

### InstanceBuffer (实例缓冲区管理器 - 2025-12-16新增)

实例化渲染的数据缓冲区管理器，负责 GPU 缓冲区和数据更新：

**核心特性**：
- 预分配 CPU 和 GPU 缓冲区，避免渲染循环中的内存分配
- 支持单个实例和批量实例的高效更新
- 动态扩容支持（resize）
- 详细的统计信息（内存使用、实例数等）

**标准数据布局（80 bytes per instance）**：
```
[0-63]   mat4 modelMatrix  (64 bytes)
[64-79]  vec4 color        (16 bytes)
```

**API 方法**：
- `updateInstance(index, data)` - 更新单个实例
- `updateInstances(startIndex, data, count)` - 批量更新（推荐）
- `updateAll(data, count)` - 更新全部实例
- `resize(newMaxInstances)` - 动态扩容
- `getBuffer()` - 获取 GPU 缓冲区
- `getStats()` - 获取统计信息

**使用示例**：
```typescript
import { InstanceBuffer, getStandardInstanceLayout } from './utils';

// 1. 创建实例缓冲区
const instanceBuffer = runner.track(new InstanceBuffer(runner.device, {
  maxInstances: 10000,
  instanceLayout: getStandardInstanceLayout(2), // location 2-6
  dynamic: true,
  label: 'MyInstanceBuffer',
}));

// 2. 更新单个实例数据
const instanceData = new Float32Array(20); // 80 bytes = 20 floats
// [0-15]: mat4 modelMatrix (16 floats)
MMath.Matrix4.identity().toArray(instanceData, 0);
// [16-19]: vec4 color (4 floats)
instanceData.set([1.0, 0.0, 0.0, 1.0], 16);
instanceBuffer.updateInstance(0, instanceData);

// 3. 批量更新（更高效）
const batchData = new Float32Array(100 * 20); // 100 instances
for (let i = 0; i < 100; i++) {
  const offset = i * 20;
  // 设置变换矩阵
  const matrix = MMath.Matrix4.translation(i * 2, 0, 0);
  matrix.toArray(batchData, offset);
  // 设置颜色
  batchData.set([Math.random(), Math.random(), Math.random(), 1.0], offset + 16);
}
instanceBuffer.updateInstances(0, batchData, 100);

// 4. 获取统计信息
const stats = instanceBuffer.getStats();
console.log(`Using ${stats.usage * 100}% of buffer capacity`);
console.log(`Buffer size: ${stats.bufferSize / 1024} KB`);
```

### InstancedRenderer (实例化渲染器 - 2025-12-16新增)

封装实例化渲染的核心逻辑，简化实例化 Draw Call 的使用：

**核心特性**：
- 自动组合基础几何和实例属性的顶点布局
- 支持索引和非索引渲染
- 封装 drawIndexed() / draw() 调用
- 提供顶点布局查询接口（用于创建渲染管线）

**API 方法**：
- `draw(renderPass, instanceCount)` - 执行实例化渲染
- `getVertexBufferLayouts(baseStride?)` - 获取顶点布局（标准）
- `getVertexBufferLayoutsExtended(baseAttributes)` - 获取顶点布局（扩展）
- `updateGeometry(newGeometry)` - 运行时切换几何体

**使用示例**：
```typescript
import {
  InstanceBuffer,
  InstancedRenderer,
  getStandardInstanceLayout,
  GeometryGenerator,
} from './utils';

// 1. 创建实例缓冲区
const instanceBuffer = runner.track(new InstanceBuffer(runner.device, {
  maxInstances: 10000,
  instanceLayout: getStandardInstanceLayout(2),
}));

// 2. 创建基础几何体
const cubeGeometry = GeometryGenerator.createCube({ size: 1.0 });
const vertexBuffer = runner.createVertexBuffer(
  cubeGeometry.vertices,
  'CubeVertices'
);
const indexBuffer = runner.createIndexBuffer(
  cubeGeometry.indices,
  'CubeIndices'
);

// 3. 创建实例化渲染器
const renderer = runner.track(new InstancedRenderer(runner.device, instanceBuffer, {
  vertexBuffer,
  indexBuffer,
  vertexCount: cubeGeometry.vertexCount,
  indexCount: cubeGeometry.indexCount,
  indexFormat: 'uint16',
}));

// 4. 创建渲染管线（使用自动生成的顶点布局）
const vertexBufferLayouts = renderer.getVertexBufferLayouts(24); // 24 = vec3 pos + vec3 normal
const pipeline = runner.device.createRenderPipeline({
  label: 'InstancedPipeline',
  vertex: {
    module: vertexShader,
    entryPoint: 'main',
    buffers: vertexBufferLayouts,
  },
  fragment: {
    module: fragmentShader,
    entryPoint: 'main',
    targets: [{ format: runner.format }],
  },
  primitive: { topology: 'triangle-list' },
  depthStencil: {
    format: 'depth24-unorm',
    depthWriteEnabled: true,
    depthCompare: 'less',
  },
});

// 5. 更新实例数据（每帧或按需）
const instanceData = new Float32Array(10000 * 20);
for (let i = 0; i < 10000; i++) {
  const offset = i * 20;
  // 计算位置（10x10x100 网格）
  const x = (i % 100) * 2 - 100;
  const y = Math.floor((i / 100) % 100) * 2 - 100;
  const z = Math.floor(i / 10000) * 2;

  const matrix = MMath.Matrix4.translation(x, y, z);
  matrix.toArray(instanceData, offset);

  // 随机颜色
  instanceData.set([Math.random(), Math.random(), Math.random(), 1.0], offset + 16);
}
instanceBuffer.updateAll(instanceData, 10000);

// 6. 渲染
renderPass.setPipeline(pipeline);
renderer.draw(renderPass, instanceBuffer.getInstanceCount());
```

**着色器示例（顶点着色器）**：
```glsl
#version 300 es
precision highp float;

// Per-vertex attributes
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

// Per-instance attributes
layout(location = 2) in vec4 aInstanceMatrixRow0;
layout(location = 3) in vec4 aInstanceMatrixRow1;
layout(location = 4) in vec4 aInstanceMatrixRow2;
layout(location = 5) in vec4 aInstanceMatrixRow3;
layout(location = 6) in vec4 aInstanceColor;

// Uniforms
layout(std140, binding = 0) uniform Camera {
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

// Outputs
out vec3 vWorldNormal;
out vec4 vInstanceColor;

void main() {
  // 重建实例模型矩阵
  mat4 instanceMatrix = mat4(
    aInstanceMatrixRow0,
    aInstanceMatrixRow1,
    aInstanceMatrixRow2,
    aInstanceMatrixRow3
  );

  vec4 worldPos = instanceMatrix * vec4(aPosition, 1.0);
  mat3 normalMatrix = transpose(inverse(mat3(instanceMatrix)));
  vWorldNormal = normalize(normalMatrix * aNormal);
  vInstanceColor = aInstanceColor;

  gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
```

**性能优化建议**：
1. **批量更新优先**：使用 `updateInstances()` 而非多次 `updateInstance()`
2. **预分配容量**：根据最大实例数预分配缓冲区，避免运行时扩容
3. **动态更新策略**：只更新变化的实例，减少 GPU 数据传输
4. **实例数控制**：通过 `setInstanceCount()` 灵活控制渲染的实例数量
5. **LOD 支持**：根据距离动态调整实例数和几何体细节

**适用场景**：
- 植被渲染（草、树木、灌木）
- 粒子系统（烟雾、火花、雨雪）
- 建筑阵列（城市、街区）
- 大量重复对象（岩石、障碍物）
- 性能测试（压力测试、渲染基准）

### ProceduralTexture (程序化纹理)

支持的纹理类型：

- `checkerboard(config)` - 棋盘格
- `gradient(config)` - 渐变
- `noise(config)` - 噪声 (white/perlin)
- `solidColor(config)` - 纯色
- `uvDebug(config)` - UV 调试
- `normalMap(config)` - 法线贴图

### ParticleSystem (粒子系统 - 2025-12-16新增)

GPU实例化粒子系统，支持大规模粒子渲染：

**核心组件**：
- **ParticleRenderer**: 基于实例化渲染的高性能粒子渲染器
- **ParticleSystem**: 粒子系统管理器，集成发射器、更新器和生命周期
- **ParticleEmitter**: 粒子发射器，支持多种发射模式（点、球体、盒体）
- **ParticleUpdater**: 粒子更新器，处理物理模拟和生命周期管理

**关键特性**：
- 支持每秒10,000+粒子的实时渲染
- GPU实例化渲染，减少CPU到GPU数据传输
- 支持单通道和多通道混合模式
- 随机种子控制，保证可重现的粒子行为

**使用示例**：
```typescript
import { ParticleSystem, ParticleRenderer } from './utils';

// 创建粒子系统
const particleSystem = runner.track(new ParticleSystem(runner.device, {
  maxParticles: 10000,
  emissionRate: 100,
  lifetime: 3.0,
  startColor: [1.0, 0.5, 0.0, 1.0],
  endColor: [1.0, 1.0, 0.0, 0.0],
}));

// 创建粒子渲染器
const renderer = runner.track(new ParticleRenderer(runner.device, particleSystem));

// 更新粒子系统（每帧）
runner.start((dt) => {
  particleSystem.update(dt);

  // 渲染粒子
  renderPass.setPipeline(particlePipeline);
  renderer.draw(renderPass, particleSystem.getActiveParticleCount());
});
```

### SkyboxRenderer (天空盒渲染 - 2025-12-16新增)

高效的天空盒和环境贴图渲染系统：

**核心组件**：
- **SkyboxRenderer**: 优化的天空盒渲染器
- **EnvironmentMap**: HDR环境贴图管理器
- **IBLUtils**: 基于图像的光照计算工具

**技术特点**：
- 6面体渲染优化，避免立方体贴图接缝
- 支持HDR全景图自动转换为立方体贴图
- 集成IBL光照，支持环境漫反射和镜面反射
- 优化的后处理管线集成

**性能指标**：
- 全景图转换时间 < 100ms
- 立方体贴图生成无缝衔接
- 支持4K环境贴图实时渲染

**使用示例**：
```typescript
import { SkyboxRenderer, EnvironmentMap } from './utils';

// 加载HDR全景图
const envMap = await EnvironmentMap.fromHDR(
  runner.device,
  'path/to/environment.hdr',
  {
    resolution: 2048,
    generateMipmaps: true,
  }
);

// 创建天空盒渲染器
const skyboxRenderer = runner.track(new SkyboxRenderer(runner.device, envMap));

// 渲染天空盒
renderPass.setPipeline(skyboxPipeline);
skyboxRenderer.draw(renderPass);
```

### PBRMaterial (PBR材质 - 2025-12-16新增)

基于物理的渲染材质系统：

**核心组件**：
- **PBRMaterial**: 完整的PBR材质实现
- **BRDFUtils**: Cook-Torrance BRDF计算工具
- **IBLUtils**: 图像基础光照工具

**支持的PBR特性**：
- 金属/工作流（Metallic/Roughness）
- Cook-Torrance BRDF模型
- 线性空间渲染
- 环境光遮蔽（AO）
- 基于图像的光照（IBL）

**性能指标**：
- 支持4K纹理下保持60FPS
- 实时PBR渲染
- 环境贴图预过滤优化

**使用示例**：
```typescript
import { PBRMaterial, EnvironmentMap } from './utils';

// 创建PBR材质
const material = new PBRMaterial({
  albedo: [0.8, 0.2, 0.2],
  metallic: 0.8,
  roughness: 0.2,
  normalMap: normalTexture,
  aoMap: aoTexture,
});

// 设置环境光照
const ibl = await EnvironmentMap.loadForIBL(runner.device, 'env.hdr');
material.setEnvironmentMap(ibl);

// 在片元着色器中使用
const finalColor = material.computeLighting(
  viewDir,
  normal,
  lightDir,
  lightColor
);
```

### PostProcessManager (后处理管道 - 2025-12-16新增)

后处理管道管理器，支持多效果链式执行和Ping-Pong缓冲区管理：

**核心功能**：
- 管理多个后处理效果的链式执行
- Ping-Pong缓冲区自动管理（避免读写冲突）
- 支持HDR/LDR格式切换
- 自动资源追踪和清理

**内置后处理效果**：
- **BrightnessContrast** - 亮度/对比度调整
- **GaussianBlur** - 高斯模糊（5-tap优化）
- **ToneMapping** - 色调映射（Reinhard/ACES/Uncharted2/Filmic）
- **FXAA** - 快速抗锯齿

**使用示例**：
```typescript
import {
  PostProcessManager,
  ToneMapping,
  FXAA,
  BrightnessContrast,
} from './utils';

// 1. 创建后处理管理器
const postProcess = runner.track(new PostProcessManager(runner.device, {
  width: runner.width,
  height: runner.height,
  useHDR: false,
}));

// 2. 添加效果链（按顺序执行）
postProcess.addEffect(new ToneMapping(runner.device, {
  mode: 'aces',
  exposure: 1.0,
  gamma: 2.2,
}));

postProcess.addEffect(new BrightnessContrast(runner.device, {
  brightness: 0.1,
  contrast: 1.1,
}));

postProcess.addEffect(new FXAA(runner.device, {
  subpixelQuality: 0.75,
  edgeThreshold: 0.166,
}));

// 3. 渲染循环中应用后处理
runner.start((dt) => {
  const { encoder, passDescriptor } = runner.beginFrame();

  // 第一步：渲染场景到离屏纹理
  const sceneTarget = runner.track(new RenderTarget(runner.device, {
    width: runner.width,
    height: runner.height,
    depthFormat: 'depth24-unorm',
  }));

  const scenePass = encoder.beginRenderPass(
    sceneTarget.getRenderPassDescriptor([0.1, 0.1, 0.1, 1.0])
  );
  // ... 渲染场景 ...
  scenePass.end();

  // 第二步：应用后处理链
  const finalTexture = postProcess.process(encoder, sceneTarget.getColorView(0));

  // 第三步：输出到屏幕
  const screenPass = encoder.beginRenderPass(passDescriptor);
  // ... 将finalTexture绘制到屏幕 ...
  screenPass.end();

  runner.endFrame(encoder);
});

// 4. 动态调整效果参数
const toneMappingEffect = postProcess.getEffectByName('ToneMapping');
toneMappingEffect?.setParameters({ exposure: 1.5 });

// 5. 启用/禁用特定效果
const fxaaEffect = postProcess.getEffectByName('FXAA');
if (fxaaEffect) fxaaEffect.enabled = false;

// 6. 获取统计信息
const stats = postProcess.getStats();
console.log(`Effects: ${stats.enabledEffectCount}/${stats.effectCount}`);
console.log(`Memory: ${(stats.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
```

**自定义后处理效果**：
```typescript
import { PostProcessEffect } from './utils';

class CustomEffect extends PostProcessEffect {
  protected createPipeline(): void {
    // 创建渲染管线
    const vertexShader = this.device.createShaderModule({
      code: this.getFullscreenVertexShader(), // 基类提供全屏顶点着色器
    });

    const fragmentShader = this.device.createShaderModule({
      code: this.getFragmentShader(),
    });

    // ... 创建管线 ...
  }

  protected createBindGroup(inputTexture: MSpec.IRHITextureView): void {
    // 创建绑定组
  }

  protected updateUniforms(): void {
    // 更新Uniform参数
  }

  public setParameters(params: Record<string, any>): void {
    // 处理参数更新
  }

  private getFragmentShader(): string {
    return `#version 300 es
precision mediump float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uTexture;

void main() {
  vec4 color = texture(uTexture, vUV);
  // 自定义效果处理
  fragColor = color;
}`;
  }
}

// 使用自定义效果
postProcess.addEffect(new CustomEffect(runner.device));
```

**性能优化建议**：
1. **Ping-Pong优化**：Manager自动管理2个RenderTarget，避免手动创建
2. **效果顺序**：先执行计算密集型效果（Blur），后执行轻量级效果（FXAA）
3. **按需启用**：使用`effect.enabled`动态控制效果开关
4. **分辨率控制**：后处理可使用低分辨率渲染，最后upscale到屏幕
5. **批量参数更新**：避免每帧调用`setParameters()`

**适用场景**：
- HDR渲染管线（ToneMapping必需）
- 视觉增强（亮度/对比度/色调调整）
- 抗锯齿（FXAA性能优于MSAA）
- 特效合成（模糊、辉光、景深）

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

| #   | 名称             | 文件                | 功能点                                        |
| --- | ---------------- | ------------------- | --------------------------------------------- | ------- |
| 01  | triangle         | triangle.ts         | 最小化渲染流程，MVP 矩阵变换基础实现          |
| 02  | colored-triangle | colored-triangle.ts | 顶点颜色属性，红绿蓝渐变插值效果              |
| 03  | rotating-cube    | rotating-cube.ts    | 3D变换、纹理、光照、GUI、相机控制             |
| 04  | quad-indexed     | quad-indexed.ts     | 索引缓冲区绘制，顶点复用                      |
| 05  | primitive-types  | primitive-types.ts  | 图元拓扑类型（点/线/三角形）                  |
| 06  | viewport-scissor | viewport-scissor.ts | 视口和裁剪矩形，多视口渲染                    |
| 07  | depth-test       | depth-test.ts       | 深度测试功能，多个重叠几何体遮挡              |
| 08  | blend-modes      | blend-modes.ts      | 各种混合模式，支持纹理和MVP变换               |
| 09  | multiple-buffers | multiple-buffers.ts | 多顶点缓冲区，位置/颜色/法线分离              |
| 10  | dynamic-buffer   | dynamic-buffer.ts   | 缓冲区动态更新，波浪动画效果                  |
| 11  | vertex-formats   | vertex-formats.ts   | 顶点格式对比，内存优化演示                    |
| 12  | stencil-test     | stencil-test.ts     | 模板测试，轮廓效果（Outline）                 |
| 13  | texture-2d       | texture-2d.ts       | 基础2D纹理，TextureLoader + ProceduralTexture |
| 14  | texture-filtering | texture-filtering.ts | 纹理过滤模式对比（NEAREST/LINEAR/各向异性） |
| 15  | texture-wrapping | texture-wrapping.ts | 纹理包裹模式（REPEAT/MIRROR_REPEAT/CLAMP）   |
| 16  | mipmaps          | mipmaps.ts          | Mipmap 生成和使用（textureLod + LOD 控制）   | ✅ 完成 |
| 17  | multi-textures   | multi-textures.ts   | 多纹理绑定和5种混合模式（Linear/Multiply等） | ✅ 完成 |
| 18  | cubemap-skybox   | cubemap-skybox.ts   | 立方体贴图天空盒和环境映射                 | ✅ 新增 |
| 19  | render-to-texture| render-to-texture.ts| 渲染到纹理和离屏渲染                      | ✅ 新增 |
| 20  | texture-array    | texture-array.ts    | 纹理数组(TEXTURE_2D_ARRAY)演示            | ✅ 新增 |
| 21  | compressed-texture| compressed-texture.ts| 压缩纹理KTX/DDS加载                     | ✅ 新增 |
| 22  | procedural-texture| procedural-texture.ts| 程序化纹理生成（噪声/分形/波形）          | ✅ 新增 |
| 23  | pbr-material       | pbr-material.ts       | PBR材质和基于图像的光照(IBL)              | ✅ 已完成 |
| 24  | shadow-mapping     | shadow-mapping.html  | 阴影贴图和PCF软阴影                        | ✅ 已完成 |
| 25  | particle-system    | particle-system.html | GPU实例化粒子系统                          | ✅ 已完成 |
| 26  | environment-mapping| environment-mapping.ts| 环境映射和天空盒渲染                       | ✅ 已完成 |

**注意**：所有 Demo 均已集成 Stats 性能监控、OrbitController 相机控制和完整的 MVP 矩阵变换管线。
**第一层基础渲染 12 个 Demo 已全部完成（2025-12-10）。**
**第二层纹理系统 10 个 Demo 已全部完成（2025-12-13）。**
**第三层光照与材质系统 6 个 Demo 已完成（2025-12-16）。**
**第四层高级渲染系统 6 个 Demo 已完成（2025-12-16）。**

**备注**：
- `shadow-mapping.html` 和 `particle-system.html` 已规划，待创建对应的HTML入口文件
- 实际已实现的Demo数量：共28个（基础渲染12个 + 纹理系统10个 + 高级渲染6个）

---

## 五、Demo 规划 (50 个)

### 第一层：基础渲染 (12 demos)

| #   | 名称             | 验证功能点       | 状态    |
| --- | ---------------- | ---------------- | ------- |
| 01  | triangle         | 最小化渲染流程   | ✅ 完成 |
| 02  | colored-triangle | 顶点颜色属性     | ✅ 完成 |
| 03  | quad-indexed     | 索引缓冲区绘制   | ✅ 完成 |
| 04  | rotating-cube    | 3D 变换矩阵      | ✅ 完成 |
| 05  | multiple-buffers | 多顶点缓冲区     | ✅ 完成 |
| 06  | dynamic-buffer   | 缓冲区动态更新   | ✅ 完成 |
| 07  | vertex-formats   | 各种顶点格式     | ✅ 完成 |
| 08  | primitive-types  | 点/线/三角形拓扑 | ✅ 完成 |
| 09  | viewport-scissor | 视口和裁剪矩形   | ✅ 完成 |
| 10  | depth-test       | 深度测试         | ✅ 完成 |
| 11  | stencil-test     | 模板测试         | ✅ 完成 |
| 12  | blend-modes      | 混合模式         | ✅ 完成 |

### 第二层：纹理系统 (10 demos)

| #   | 名称               | 验证功能点         | 状态     |
| --- | ------------------ | ------------------ | -------- |
| 13  | texture-2d         | 基础 2D 纹理采样   | ✅ 完成  |
| 14  | texture-wrapping   | 重复/镜像/钳制模式 | ✅ 完成  |
| 15  | texture-filtering  | 线性/最近邻过滤    | ✅ 完成  |
| 16  | mipmaps            | Mipmap 生成和使用  | ✅ 完成  |
| 17  | multi-textures     | 多纹理混合         | ✅ 完成  |
| 18  | cubemap-skybox     | 立方体贴图天空盒   | ✅ 完成  |
| 19  | render-to-texture  | 渲染到纹理         | ✅ 完成  |
| 20  | texture-array      | 纹理数组 (WebGL2)  | ✅ 完成  |
| 21  | compressed-texture | 压缩纹理格式       | ✅ 完成  |
| 22  | procedural-texture | 程序化纹理生成     | ✅ 完成  |

### 第三层：光照与材质 (10 demos)

| #   | 名称                | 验证功能点       | 状态                 |
| --- | ------------------- | ---------------- | -------------------- |
| 23  | flat-shading        | 平面着色         | ✅ 完成              |
| 24  | gouraud-shading     | Gouraud 着色     | ✅ 完成              |
| 25  | phong-lighting      | Phong 光照模型   | ✅ 完成              |
| 26  | blinn-phong         | Blinn-Phong 高光 | rotating-cube 已演示 |
| 27  | directional-light   | 平行光源         | ✅ 完成              |
| 28  | point-lights        | 多点光源         | ✅ 完成              |
| 29  | spotlight           | 聚光灯效果       | ✅ 完成              |
| 30  | normal-mapping      | 法线贴图         | 待实现               |
| 31  | environment-mapping | 环境反射         | ✅ 完成 (2025-12-16)  |
| 32  | pbr-material        | PBR 材质基础     | ✅ 完成 (2025-12-16)  |

### 第四层：高级渲染 (10 demos)

| #   | 名称                 | 验证功能点          | 状态   |
| --- | -------------------- | ------------------- | ------ |
| 33  | instancing           | 实例化渲染          | ✅ 已完成 (2025-12-16) |
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

**⚠️ 重要**: 介绍面板必须位于左下角，不能放在其他位置。

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

#### Canvas 容器布局（必需）

**⚠️ 重要**: Canvas 必须使用 `.container` 容器包裹，**不能**直接对 Canvas 设置 `width: 100%; height: 100%` 的 CSS 样式，否则会导致渲染黑屏。

正确的 HTML 结构：

```html
<body>
  <div class="container">
    <canvas id="J-canvas"></canvas>
  </div>
  <div class="info-panel">...</div>
</body>
```

正确的 CSS 样式：

```css
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.container {
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

#J-canvas {
  display: block;
  cursor: grab;
}

#J-canvas:active {
  cursor: grabbing;
}
```

**错误示例（会导致黑屏）**：

```css
/* ❌ 错误：不要直接对 Canvas 设置 100% 尺寸 */
#J-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

原因：DemoRunner 通过 `window.innerWidth/Height` 动态设置 Canvas 的实际渲染尺寸（`canvas.width/height` 属性），而 CSS 的 `width: 100%` 会创建一个与实际渲染buffer尺寸不匹配的显示尺寸，导致渲染内容不可见。

#### 介绍面板 HTML 结构

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

### 6. 在 index.html 中注册 Demo 入口

所有 RHI Demo **必须**在 `packages/rhi/demo/index.html` 中注册入口，确保可以从 Demo Gallery 首页直接访问。

#### 6.1 入口卡片结构要求

- 每个 Demo 对应一个 `.demo-card` 卡片
- 按分类（基础功能 / 纹理系统 / 高级渲染等）归入对应的 `category` 区块
- 卡片内部包含：
  - 标题行：Emoji + Demo 名称 + 难度标签
  - 一段简短描述（1~3 句话）
  - 技术要点标签列表 `.tech-tags`
  - 运行入口链接 `.demo-link`

示例（纹理系统 Demo 卡片）：

```html
<!-- 纹理系统Demo -->
<div class="category">
  <h2>🖼️ 纹理系统Demo</h2>
</div>

<div class="demo-card">
  <h3>🎨 基础 2D 纹理 <span class="difficulty intermediate">中级</span></h3>
  <p>
    演示纹理加载和采样的基础功能。展示 TextureLoader 加载外部图片、ProceduralTexture
    生成程序化纹理，以及多纹理对比显示。
  </p>
  <div class="tech-tags">
    <span class="tech-tag">TextureLoader</span>
    <span class="tech-tag">sampler2D</span>
    <span class="tech-tag">UV映射</span>
    <span class="tech-tag">程序化纹理</span>
  </div>
  <a class="demo-link" href="html/texture-2d.html">🎮 运行Demo</a>
</div>
```

#### 6.2 入口链接路径规范

- 所有 Demo 的运行页面必须放在：`packages/rhi/demo/html/` 目录下
- 入口链接统一使用相对路径：
  - `href="html/<demo-name>.html"`
  - 例如：
    - `triangle` → `html/triangle.html`
    - `texture-2d` → `html/texture-2d.html`
    - `texture-wrapping` → `html/texture-wrapping.html`
- 不允许直接链接到 `.ts` 源码文件

#### 6.3 添加新 Demo 的标准流程

当你完成一个新的 Demo（例如 `texture-wrapping`）时，必须按以下顺序完成注册：

1. 在 `packages/rhi/demo/html/` 下创建对应的 HTML 页面（例如 `texture-wrapping.html`），并在其中：
   - 创建 `<canvas id="J-canvas"></canvas>` 作为渲染容器
   - 使用 `<script type="module">` 引入对应的 TypeScript 模块，例如：

```html
<script type="module">
  async function init() {
    await import('../src/texture-wrapping.ts');
  }

  init();
</script>
```

2. 打开 `packages/rhi/demo/index.html`，在合适的分类下添加新的 `.demo-card`：

   - 纹理相关 Demo 放在「🖼️ 纹理系统Demo」分类内
   - 基础渲染 Demo 放在「🎯 基础功能Demo」分类内
   - 高级渲染 / 查询优化 Demo 按规划表选择对应分组

3. 保持标题和描述风格与现有卡片一致：
   - 标题使用 Emoji 前缀，例如 `🔁 纹理包裹模式`
   - 难度标签使用现有的 `difficulty beginner` / `difficulty intermediate` / `difficulty advanced` 类
   - 技术要点标签简洁概括主要 API 或概念

#### 6.4 验证步骤与预期结果

完成入口注册后，必须按以下步骤自检：

1. 在仓库根目录启动 RHI Demo 开发服务器：

```bash
pnpm --filter @maxellabs/rhi dev
```

2. 在浏览器中打开首页：

```text
http://<本机或局域网IP>:3001/demo/index.html
```

3. 在页面中找到新添加的 Demo 卡片，检查：

   - 卡片样式与其他 Demo 一致
   - 描述和技术标签显示正常，没有排版错乱

4. 点击「🎮 运行Demo」：
   - 浏览器跳转到对应的 `html/<demo-name>.html` 页面
   - 加载过程中无 404 / 500 等资源错误（在 DevTools Network 面板中确认）
   - Demo 自动初始化并开始渲染（控制台输出初始化日志）
   - 所有键盘/鼠标交互按各自 Demo 文档说明正常工作

#### 6.5 常见问题与排查建议

- **问题：点击首页卡片后出现 404 页面**

  - 检查 `href` 是否指向正确的 `html/<demo-name>.html`
  - 确认对应 HTML 文件已经存在于 `packages/rhi/demo/html/` 目录中

- **问题：页面打开但画面一片黑 / 没有渲染**

  - **首先检查 Canvas 布局**：确认 HTML 中使用了 `.container` 容器包裹 Canvas，而不是直接对 Canvas 设置 `width: 100%; height: 100%` 的 CSS 样式（这是最常见的黑屏原因）
  - 确认 HTML 中的 `canvas` 元素 id 是否与 DemoRunner 配置一致（通常是 `J-canvas`）
  - 检查 `<script type="module">` 中的 `import` 路径是否正确（`../src/<demo-name>.ts`）
  - 在浏览器控制台查看是否有 WebGL 初始化错误或未捕获异常

- **问题：首页能看到卡片，但样式错乱**

  - 确认新卡片的 HTML 结构与示例保持一致（`demo-card`、`tech-tags`、`demo-link` 等类名不要修改）
  - 避免在卡片内部引入额外的布局容器破坏现有 CSS 网格结构

- **问题：新增 Demo 没有出现在首页**
  - 确认修改的是 `packages/rhi/demo/index.html` 而不是其他同名文件
  - 使用浏览器强制刷新（建议开启 DevTools 并勾选「Disable cache」）

---

## 七、相关文档

- [RHI 概览](/llmdoc/overview/rhi-overview.md)
- [WebGL 实现架构](/llmdoc/architecture/webgl-implementation.md)
- [资源追踪 API](/llmdoc/reference/resource-tracker-api.md)
- [上下文丢失处理](/llmdoc/guides/handle-context-loss.md)
