---
title: "RHI Demo实现宪法"
id: "rhi-demo-constitution"
type: "constitution"
tags: ["demo", "ui-layout", "geometry", "texture", "shader", "performance", "html-standards"]
related_ids: ["graphics-system-bible", "coding-conventions", "pbr-material-system"]
token_cost: "high"
context_dependency: ["webgl-basics", "rhi-api", "demo-structure"]
---

# RHI Demo 实现宪法

## Context
本文档是RHI Demo开发的权威规范，基于对22个Demo的深度分析提炼。所有Demo实现必须严格遵守本文档定义的UI布局、几何体标准、纹理指南和性能要求。

## Goal
确保所有Demo的一致性、可维护性、性能和可扩展性。提供统一的开发标准，减少重复工作，提升开发效率。

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

## 接口定义

### Demo基础接口
```typescript
interface DemoConfiguration {
  name: string;
  title: string;
  description: string;
  techTags: string[];
  geometry?: GeometryType;
  textureType?: TextureType;
  requiresFullscreen?: boolean;
  showHelp?: boolean;
}

interface DemoRunner {
  device: RHIDevice;
  canvas: HTMLCanvasElement;

  // 资源管理
  track<T>(resource: T): T;

  // UI管理
  showHelp(commands: string[]): void;

  // 渲染循环
  start(callback: (dt: number) => void): void;
  stop(): void;
}
```

### UI布局接口
```typescript
interface UIComponents {
  stats: Stats;           // FPS显示器
  gui: SimpleGUI;         // 场景控制
  infoPanel?: HTMLElement; // 介绍面板
}

interfaceUILayout {
  stats: {
    position: 'top-left';
    show: ['fps', 'ms'];
  };
  gui: {
    position: 'top-right';
    width: number;
  };
  infoPanel?: {
    position: 'bottom-right';
    maxWidth: number;
  };
}
```

### 几何体和纹理接口
```typescript
type GeometryType = 'quad' | 'plane' | 'cube' | 'sphere' | 'triangle';

interface GeometryOptions {
  width?: number;
  height?: number;
  size?: number;
  widthSegments?: number;
  heightSegments?: number;
  normals?: boolean;
  uvs?: boolean;
  colors?: boolean;
}

type TextureType = 'real' | 'procedural';

interface TextureOptions {
  flipY: boolean;           // 强制 true
  generateMipmaps?: boolean;
  format: RHITextureFormat; // RGBA8_UNORM
}
```

## 1. UI布局规则 (强制规范)

### 1.1 FPS显示器 (左上角)

```typescript
// 强制配置
const stats = new Stats({
  position: 'top-left',
  show: ['fps', 'ms']
});
```

**位置样式：**
- `top: 10px; left: 10px;`
- 背景：`rgba(30, 30, 30, 0.9)`
- Z-index: `10001` (最高优先级)

**更新方式：**
```typescript
runner.start((dt) => {
  stats.begin();
  // 渲染逻辑
  stats.end();
});
```

**负面约束：**
- ❌ 禁止修改FPS位置
- ❌ 禁止隐藏FPS显示
- ❌ 禁止使用其他性能监控库

### 1.2 场景控制UI (右上角)

```typescript
// 标准GUI配置
const gui = new SimpleGUI(); // 自动定位到右上角
```

**支持的组件类型：**
1. 数字滑块：`gui.addSlider(params, 'value', min, max, step)`
2. 布尔开关：`gui.addCheckbox(params, 'enabled')`
3. 下拉选择：`gui.addSelect(params, 'mode', options)`
4. 颜色选择器：`gui.addColor(params, 'color')`

**位置样式：**
- `top: 10px; right: 10px;`
- 宽度：`280px`
- 背景：`rgba(30, 30, 30, 0.95)`

### 1.3 Demo介绍面板 (右下角，可选)

```typescript
// HTML结构
const infoPanel = `
<div class="info-panel">
  <h2>🔆 Demo名称</h2>
  <p>功能描述（不超过3行）</p>
  <div class="tech-tags">
    <span class="tech-tag">技术标签1</span>
    <span class="tech-tag">技术标签2</span>
  </div>
</div>
`;
```

**使用规则：**
- ✅ 复杂Demo推荐使用
- ❌ 简单Demo不强制要求
- ✅ 位置固定在右下角
- ❌ 限制最大宽度400px

### 1.4 键盘快捷键 (强制规范)

```typescript
// 必须输出帮助信息
DemoRunner.showHelp([
  'ESC: 退出Demo',
  'F11: 切换全屏',
  '鼠标左键拖动: 旋转视角',
  '鼠标滚轮: 缩放',
  '鼠标右键拖动: 平移'
]);
```

**通用快捷键：**
- `ESC`: 退出Demo (必需)
- `F11`: 切换全屏 (必需)
- `Space`: 暂停/继续 (动画Demo)
- `0`: 重置视角 (3D Demo)

## 2. 几何体标准

### 2.1 几何体优先级

```typescript
// 推荐的几何体选择顺序
const GEOMETRY_PRIORITY: GeometryType[] = [
  'quad',    // 2D纹理展示
  'plane',   // 地面、测试场景
  'cube',    // 3D物体、天空盒
  'sphere',  // 环境光、天空球
  'triangle' // 最简单演示
];
```

**使用规则：**
- ✅ 纹理展示必须使用Quad/Plane
- ❌ 不推荐单独三角形（除非基础演示）
- ✅ 优先使用索引绘制

### 2.2 几何体生成标准

```typescript
// Quad生成（带UV）
function createQuad(options?: GeometryOptions): Geometry {
  return GeometryGenerator.quad({
    width: 2,
    height: 2,
    uvs: true,
    colors: false, // 纹理场景不需要顶点颜色
    ...options
  });
}

// Plane生成（带法线和UV）
function createPlane(options?: GeometryOptions): Geometry {
  return GeometryGenerator.plane({
    width: 10,
    height: 10,
    widthSegments: 1,
    heightSegments: 1,
    normals: true,
    uvs: true,
    ...options
  });
}
```

### 2.3 坐标系变换 (X轴旋转90°)

**应用场景：** 将XZ平面转换为XY平面

```typescript
// 标准变换代码
function applyPlaneTransform(
  modelMatrix: Matrix4,
  x: number, y: number, z: number,
  scale: number = 1
): void {
  modelMatrix.identity();
  modelMatrix.translate(new Vector3(x, y, z));
  modelMatrix.rotateX(Math.PI / 2); // 90度旋转
  modelMatrix.scale(new Vector3(scale, scale, 1));
}
```

**使用时机：**
- ✅ 程序化纹理展示
- ✅ 跑道平面俯视效果
- ❌ 3D场景中的地面（保持XZ平面）
- ❌ 天空盒内部

## 3. 纹理指南

### 3.1 纹理类型选择

```typescript
// 纹理选择决策树
function selectTextureType(demoType: string): TextureType {
  const realTextureDemos = [
    'texture-filtering',
    'mipmaps',
    'multi-textures',
    'compressed-texture'
  ];

  return realTextureDemos.includes(demoType) ? 'real' : 'procedural';
}
```

### 3.2 真实纹理加载标准

```typescript
// 标准纹理加载流程
async function loadTexture(
  runner: DemoRunner,
  path: string,
  options?: Partial<TextureOptions>
): Promise<RHITexture> {
  // 1. 加载纹理数据
  const textureData = await TextureLoader.load(path, {
    flipY: true,                    // 强制启用
    generateMipmaps: false,         // 按需生成
    format: 'rgba8-unorm',          // 标准格式
    ...options
  });

  // 2. 创建RHI纹理
  const texture = runner.track(
    runner.device.createTexture({
      width: textureData.width,
      height: textureData.height,
      format: MSpec.RHITextureFormat.RGBA8_UNORM,
      usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
      label: `Texture: ${path}`
    })
  );

  // 3. 上传数据
  texture.update(textureData.data as BufferSource);
  return texture;
}
```

**关键参数：**
- `flipY: true` - **强制启用**（WebGL坐标系要求）
- `format: 'rgba8-unorm'` - **标准格式**

### 3.3 程序化纹理生成

```typescript
// 可用的程序化纹理类型
interface ProceduralTextureTypes {
  checkerboard: {
    width: number;
    height: number;
    cellSize: number;
    colorA: number[];
    colorB: number[];
  };
  uvDebug: { width: number; height: number };
  gradient: {
    width: number;
    height: number;
    direction: 'horizontal' | 'vertical';
    startColor: number[];
    endColor: number[];
  };
  noise: {
    width: number;
    height: number;
    type: 'perlin' | 'simplex';
    frequency: number;
    octaves: number;
  };
  solidColor: {
    width: number;
    height: number;
    color: number[];
  };
  normalMap: {
    width: number;
    height: number;
    pattern: 'bumpy' | 'ridge';
    strength: number;
  };
}
```

## 4. 着色器约定

### 4.1 GLSL版本和精度

```glsl
// 顶点着色器模板
#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

// Uniform blocks
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

// Varying
out vec2 vTexCoord;
out vec3 vNormal;
out vec3 vWorldPosition;
```

```glsl
// 片元着色器模板
#version 300 es
precision mediump float;

in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vWorldPosition;

uniform sampler2D uTexture;

out vec4 fragColor;
```

### 4.2 命名约定

**Attribute命名：**
- `aPosition`: 位置属性
- `aNormal`: 法线属性
- `aTexCoord`: 纹理坐标
- `aColor`: 顶点颜色

**Uniform Block命名：**
- `Transforms`: 变换矩阵
- `Lighting`: 光照参数
- `Material`: 材质属性

**Varying命名：**
- `vTexCoord`: 纹理坐标
- `vNormal`: 法线向量
- `vWorldPosition`: 世界坐标

## 5. 资源管理

### 5.1 资源追踪 (强制规范)

```typescript
// 正确的资源创建
function createBuffer(runner: DemoRunner, size: number): RHIBuffer {
  return runner.track(
    runner.device.createBuffer({
      size,
      usage: MSpec.RHIBufferUsage.UNIFORM,
      hint: 'dynamic',
      label: 'Transform Uniform Buffer'
    })
  );
}

// 错误示例 - 资源泄漏
// function createBadBuffer(device: RHIDevice, size: number): RHIBuffer {
//   return device.createBuffer({ size, usage: MSpec.RHIBufferUsage.UNIFORM });
// }
```

### 5.2 Buffer大小对齐 (std140)

```typescript
// std140对齐规则
const STD140_ALIGNMENT = {
  FLOAT: 4,
  VEC2: 8,
  VEC3: 16,  // 注意：需要16字节对齐
  VEC4: 16,
  MAT4: 64
};

// 标准Transform Buffer大小
const TRANSFORM_BUFFER_SIZE = 192; // 3个mat4 = 192 bytes
```

## 6. HTML文件标准

### 6.1 文件结构模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo名称 - RHI Demo</title>
  <link rel="stylesheet" href="https://gw.alipayobjects.com/as/g/antui/antui/10.1.32/dpl/antui.css"/>
  <link rel="stylesheet" href="../css/demo-styles.css" />
</head>
<body>
  <div class="container">
    <canvas id="J-canvas"></canvas>
    <div class="info-panel">
      <h2>[图标] Demo标题</h2>
      <p>功能描述</p>
      <div class="tech-tags">
        <span class="tech-tag">技术标签1</span>
        <span class="tech-tag">技术标签2</span>
      </div>
    </div>
  </div>
  <script type="module" src="../src/demo-name.ts"></script>
</body>
</html>
```

### 6.2 CSS引用规范

**强制引用：**
```html
<!-- AntUI CDN - 必需 -->
<link rel="stylesheet" href="https://gw.alipayobjects.com/as/g/antui/antui/10.1.32/dpl/antui.css"/>

<!-- 通用样式文件 - 必需 -->
<link rel="stylesheet" href="../css/demo-styles.css" />
```

**禁止：**
- ❌ 内嵌样式（`<style>`标签）
- ❌ 其他CSS文件路径
- ❌ 缺少AntUI CDN

### 6.3 JavaScript引用规范

```html
<!-- 正确：使用TypeScript源文件 -->
<script type="module" src="../src/flat-shading.ts"></script>
<script type="module" src="../src/texture-2d.ts"></script>

<!-- 错误：禁止以下用法 -->
<!-- <script src="../dist/flat-shading.js"></script> -->
<!-- <script>内嵌代码</script> -->
```

## Few-Shot示例

### 示例1：创建标准Demo
```typescript
// 问题：创建符合规范的Demo
// 解决方案：
async function createDemo(runner: DemoRunner): Promise<void> {
  // 1. 设置UI
  const stats = new Stats({ position: 'top-left' });
  const gui = new SimpleGUI();

  // 2. 创建几何体
  const geometry = createQuad({ width: 2, height: 2 });

  // 3. 加载纹理
  const texture = await loadTexture(runner, '../assets/texture.jpg');

  // 4. 显示帮助
  DemoRunner.showHelp([
    'ESC: 退出Demo',
    'F11: 切换全屏',
    '鼠标左键拖动: 旋转视角'
  ]);

  // 5. 开始渲染循环
  runner.start((dt) => {
    stats.begin();
    // 渲染逻辑
    stats.end();
  });
}
```

### 示例2：正确的纹理处理
```typescript
// 问题：处理纹理坐标和Y轴翻转
// 错误方式：
// const texture = loadTexture(path, { flipY: false }); // ❌

// 正确方式：
async function loadTextureCorrectly(runner: DemoRunner, path: string): Promise<RHITexture> {
  const textureData = await TextureLoader.load(path, {
    flipY: true, // ✅ 强制启用
    generateMipmaps: true
  });

  return runner.track(runner.device.createTexture({
    width: textureData.width,
    height: textureData.height,
    format: MSpec.RHITextureFormat.RGBA8_UNORM
  }));
}
```

### 示例3：资源管理
```typescript
// 问题：避免资源泄漏
// 错误方式：
// const buffer = device.createBuffer({...}); // ❌ 未追踪

// 正确方式：
function createManagedResource(runner: DemoRunner): RHIBuffer {
  return runner.track(
    runner.device.createBuffer({
      size: 192,
      usage: MSpec.RHIBufferUsage.UNIFORM,
      label: 'Managed Buffer' // ✅ 提供有意义的标签
    })
  );
}
```

## 检查清单

创建新Demo时必须确保：

### UI和交互
- [ ] FPS显示器在左上角
- [ ] SimpleGUI在右上角
- [ ] 实现ESC退出
- [ ] 实现F11全屏
- [ ] 显示帮助信息

### 几何体和纹理
- [ ] 纹理展示使用Quad/Plane
- [ ] 使用索引绘制
- [ ] 正确应用X轴旋转
- [ ] 真实纹理flipY: true
- [ ] 格式为RGBA8_UNORM

### 着色器
- [ ] 声明#version 300 es
- [ ] 顶点highp精度
- [ ] 片元mediump精度
- [ ] Uniform Block使用std140对齐

### 资源管理
- [ ] 所有资源使用runner.track()
- [ ] 所有资源有label
- [ ] Buffer大小正确对齐

### HTML文件规范
- [ ] 引用AntUI CDN
- [ ] 引用demo-styles.css
- [ ] JavaScript引用src/文件
- [ ] Canvas包裹在.container中
- [ ] 包含.info-panel

## 相关文档

### 🏛️ 核心规范
- [图形系统圣经](./graphics-bible.md) - 图形学基础原理
- [编码规范](./coding-conventions.md) - 代码风格指南

### 📦 实现参考
- [PBR材质系统](../reference/pbr-material-system.md) - 遵循本宪法的PBR实现
- [阴影工具](../reference/shadow-tools.md) - 阴影系统实现
- [粒子系统](../reference/particle-system.md) - 粒子效果实现

### 🎬 Demo集合
- [参考层Demo集合](../reference/) - 27个技术演示
- [阴影映射Demo](../reference/shadow-mapping-demo.md) - 阴影技术实现
- [GPU实例化Demo](../reference/instancing-demo.md) - 高性能渲染

### 🔧 开发工具
- [渲染管线整合](../advanced/integration/rendering-pipeline.md) - 管线集成
- [数学API参考](../api/math-type-reference.md) - 数学库使用