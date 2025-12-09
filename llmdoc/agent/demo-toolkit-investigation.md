# Demo 工具库功能调查报告

## 代码证据

### 核心框架 (DemoRunner)
- `packages/rhi/demo/src/utils/core/DemoRunner.ts` (DemoRunner): 统一的 Demo 生命周期管理器，包含初始化、渲染循环、事件处理、资源追踪和清理功能。
- `packages/rhi/demo/src/utils/core/types.ts` (DemoConfig, DemoState, RenderCallback): 配置接口和类型定义。

### 几何体生成 (GeometryGenerator)
- `packages/rhi/demo/src/utils/geometry/GeometryGenerator.ts` (GeometryGenerator): 几何体工厂类，提供多种几何体生成方法。
- `packages/rhi/demo/src/utils/geometry/types.ts` (GeometryData, VertexAttributeConfig): 几何体数据模型和属性定义。

### 纹理工具 (ProceduralTexture)
- `packages/rhi/demo/src/utils/texture/ProceduralTexture.ts` (ProceduralTexture): 程序化纹理生成器，支持多种纹理类型。
- `packages/rhi/demo/src/utils/texture/types.ts` (TextureData, *Config): 纹理配置接口集合。

### UI 工具 (SimpleGUI & Stats)
- `packages/rhi/demo/src/utils/ui/SimpleGUI.ts` (SimpleGUI): 零依赖的轻量级 GUI 控制面板。
- `packages/rhi/demo/src/utils/ui/Stats.ts` (Stats): 性能统计面板，显示 FPS、帧时间等实时指标。
- `packages/rhi/demo/src/utils/ui/types.ts` (GUIParamConfig, StatsConfig): UI 配置接口。

### 相机系统 (OrbitController)
- `packages/rhi/demo/src/utils/camera/OrbitController.ts` (OrbitController): 轨道相机控制器，支持鼠标/触摸交互。
- `packages/rhi/demo/src/utils/camera/types.ts` (OrbitControllerConfig): 相机配置接口。

### 统一导出
- `packages/rhi/demo/src/utils/index.ts`: 统一导出所有工具模块的入口文件。

---

## 报告

### 完整的 API 文档

#### 1. DemoRunner API

**初始化与生命周期:**
- `constructor(config: DemoConfig)` - 创建 Demo 运行器
- `async init(): Promise<void>` - 初始化 WebGL 设备、画布和事件监听
- `start(callback: RenderCallback): void` - 启动渲染循环
- `pause(): void` - 暂停渲染
- `resume(): void` - 恢复渲染
- `stop(): void` - 停止渲染循环（不销毁资源）
- `destroy(): void` - 销毁所有资源并清理

**属性访问:**
- `get device: WebGLDevice` - 获取 WebGL 设备
- `get canvas: HTMLCanvasElement` - 获取画布元素
- `get width: number` - 获取画布宽度
- `get height: number` - 获取画布高度
- `get renderTarget: MSpec.IRHITexture` - 获取渲染目标纹理
- `get currentState: DemoState` - 获取当前运行状态
- `get isRunning: boolean` - 是否正在运行

**资源管理:**
- `track<T>(resource: T): T` - 追踪资源，自动销毁
- `untrack(resource: { destroy(): void }): void` - 取消资源追踪
- `onCleanup(callback: CleanupCallback): void` - 注册清理回调

**渲染辅助:**
- `beginFrame(label?: string): { encoder, passDescriptor }` - 开始帧，返回编码器和渲染通道描述符
  - `passDescriptor` 包含 `colorAttachments` 和可选的 `depthStencilAttachment`
  - 深度缓冲自动配置：格式 `DEPTH24_UNORM_STENCIL8`，清除值 1.0，模板清除值 0
- `endFrame(encoder: IRHICommandEncoder): void` - 结束帧，复制到画布并提交
- `createRenderTarget(config?: RenderTargetConfig): MSpec.IRHITexture` - 创建或重建渲染目标
  - 支持自定义宽度、高度、格式
  - 深度格式固定为 `DEPTH24_UNORM_STENCIL8`

**事件处理:**
- `onKey(key: string, callback: KeyCallback): void` - 注册键盘事件回调
  - `key` 为 '*' 时表示监听所有键
  - 回调签名：`(key: string, event: KeyboardEvent) => void`
- `onResize(callback: ResizeCallback): void` - 注册窗口大小变化回调
  - 回调签名：`(width: number, height: number) => void`

**静态工具:**
- `static showError(message: string): void` - 显示错误信息到页面
- `static showHelp(lines: string[]): void` - 显示帮助信息到控制台

---

#### 2. GeometryGenerator API

**生成方法（全部为静态方法）:**

**triangle(options?)**
- 生成三角形
- 选项：`{ colors?: boolean }`
- 返回：`GeometryData` - 包含顶点数据、顶点数量、布局等
- 顶点数：3，索引数：无（非索引）

**quad(options?)**
- 生成四边形（两个三角形）
- 选项：`{ width?: number, height?: number, uvs?: boolean, colors?: boolean }`
- 返回：`GeometryData` - 包含顶点和索引数据
- 顶点数：4，索引数：6
- **支持 UV 坐标和顶点颜色**

**cube(options?)**
- 生成立方体（6 个面，每个面 4 个顶点）
- 选项：`{ size?: number, width?: number, height?: number, depth?: number, normals?: boolean, uvs?: boolean }`
- 返回：`GeometryData`
- 顶点数：24，索引数：36
- 法线：面法向量（每个面共享）
- UV：纹理坐标（0-1）

**plane(options?)**
- 生成平面，支持细分
- 选项：`{ width?: number, height?: number, widthSegments?: number, heightSegments?: number, normals?: boolean, uvs?: boolean }`
- 返回：`GeometryData`
- 顶点数：`(widthSegments+1) * (heightSegments+1)`
- 索引数：`widthSegments * heightSegments * 6`
- 法线：始终向上 (0, 1, 0)

**sphere(options?)**
- 生成球体（UV 球面）
- 选项：`{ radius?: number, widthSegments?: number, heightSegments?: number, normals?: boolean, uvs?: boolean }`
- 返回：`GeometryData`
- 顶点数：`(widthSegments+1) * (heightSegments+1)`
- 法线：归一化的球心向外向量
- UV：基于球坐标的自动映射

**数据结构 (GeometryData):**
```
{
  vertices: Float32Array          // 交错格式顶点数据
  indices?: Uint16Array|Uint32Array // 可选索引
  vertexCount: number             // 顶点数量
  indexCount?: number             // 索引数量
  vertexStride: number            // 每个顶点的字节数
  layout: MSpec.RHIVertexLayout   // 顶点布局
  attributes: VertexAttributeConfig[] // 属性信息
}
```

**顶点属性类型:**
- `'position'` - 顶点位置 (3 floats)
- `'normal'` - 法向量 (3 floats)
- `'uv'` - 纹理坐标 (2 floats)
- `'color'` - 顶点颜色 (3 floats)
- `'tangent'` - 切线向量 (定义存在，未实现)

---

#### 3. ProceduralTexture API

**纹理生成方法（全部为静态方法）:**

**checkerboard(config?)**
- 生成棋盘格纹理
- 配置：`{ width?: 256, height?: 256, cellSize?: 32, colorA?: [255,255,255,255], colorB?: [128,128,128,255] }`
- 用途：测试 UV 映射

**gradient(config?)**
- 生成渐变纹理
- 配置：
  - `direction?: 'horizontal' | 'vertical' | 'diagonal'`
  - `startColor?: [255,0,0,255]`
  - `endColor?: [0,0,255,255]`
- 用途：测试纹理采样

**noise(config?)**
- 生成噪声纹理
- 配置：
  - `type?: 'white' | 'perlin' | 'simplex'`
  - `frequency?: 4` (对 perlin/simplex)
  - `octaves?: 4` (对 perlin/simplex)
  - `baseColor?: [0,0,0,255]`
  - `noiseColor?: [255,255,255,255]`
- 用途：测试细节渲染
- **白噪声：完全随机**
- **Perlin 噪声：梯度噪声的多八度实现**
- **Simplex 噪声：Perlin 噪声的近似实现**

**solidColor(config?)**
- 生成纯色纹理
- 配置：`{ width?: 1, height?: 1, color?: [255,255,255,255] }`
- 用途：基础测试

**uvDebug(config?)**
- 生成 UV 调试纹理
- 格式：R = U, G = V, B = 0, A = 1
- 用途：可视化 UV 坐标

**normalMap(config?)**
- 生成法线贴图
- 配置：
  - `pattern?: 'flat' | 'bumpy' | 'wave'`
  - `strength?: 0.5`
- 法线编码：法线 (-1~1) 映射到 (0~255)
- 用途：测试法线映射

**返回值 (TextureData):**
```
{
  width: number       // 纹理宽度
  height: number      // 纹理高度
  data: Uint8Array    // RGBA 像素数据 (0-255 范围)
}
```

---

#### 4. SimpleGUI API

**构造与管理:**
- `constructor()` - 创建 GUI 面板（自动添加到 DOM）
- `destroy(): void` - 销毁 GUI

**控制项管理:**
- `add(name: string, config: GUIParamConfig): SimpleGUI` - 添加控制项（支持链式调用）
  - 支持类型：`number`、`boolean`、`string`、`[number, number, number]`（RGB 颜色）
- `addSeparator(label?: string): SimpleGUI` - 添加分隔线
- `get<T>(name: string): T | undefined` - 获取参数值
- `set(name: string, value: GUIParamValue): void` - 设置参数值

**控制项配置 (GUIParamConfig):**
```
{
  value: number | boolean | string | [r,g,b]  // 参数初始值
  min?: number                                 // 最小值（数字）
  max?: number                                 // 最大值（数字）
  step?: number                                // 步进值（数字）
  options?: string[]                           // 选项列表（字符串）
  onChange?: (value) => void                   // 值变化回调
}
```

**自动生成的控制类型:**
- **number** → 滑块 (range input)
- **boolean** → 复选框 (checkbox)
- **string (无 options)** → 文本输入 (text input)
- **string (有 options)** → 下拉选择 (select)
- **[r,g,b]** → 颜色选择器 (color input)

**UI 特性:**
- 固定位置在右上角
- 支持折叠/展开
- 最大高度限制，超过时垂直滚动
- 数字显示两位小数

---

#### 5. Stats API

**构造与管理:**
- `constructor(config?: StatsConfig)` - 创建性能统计面板
  - 配置：`{ position?: 'top-left'|'top-right'|'bottom-left'|'bottom-right', show?: ['fps'|'ms'|'memory'][] }`
- `destroy(): void` - 销毁面板

**使用流程:**
- `begin(): void` - 在渲染开始前调用
- `end(): void` - 在渲染结束后调用
- 自动每秒更新一次显示

**显示内容:**
- **FPS** - 每秒帧数（30-55: 黄色，>=55: 绿色，<30: 红色）
- **MS** - 帧时间（毫秒，保留一位小数）
- **Memory** - 内存使用（MB，仅 Chrome 等支持 `performance.memory` 的浏览器）

---

#### 6. OrbitController API

**构造:**
- `constructor(canvas: HTMLCanvasElement, config?: OrbitControllerConfig)` - 创建轨道相机控制器

**配置参数 (OrbitControllerConfig):**
```
{
  target?: [x, y, z]           // 目标点 (默认 [0,0,0])
  distance?: number            // 初始距离 (默认 5)
  minDistance?: number         // 最小距离 (默认 1)
  maxDistance?: number         // 最大距离 (默认 100)

  azimuth?: number             // 初始方位角/水平旋转 (弧度，默认 0)
  elevation?: number           // 初始仰角/垂直旋转 (弧度，默认 PI/6)
  minElevation?: number        // 最小仰角 (默认 -PI/2 + 0.1)
  maxElevation?: number        // 最大仰角 (默认 PI/2 - 0.1)

  rotateSpeed?: number         // 旋转灵敏度 (默认 0.005)
  zoomSpeed?: number           // 缩放灵敏度 (默认 0.1)
  panSpeed?: number            // 平移灵敏度 (默认 0.01)

  enableDamping?: boolean      // 启用阻尼平滑 (默认 true)
  dampingFactor?: number       // 阻尼系数 (默认 0.1)

  autoRotate?: boolean         // 自动旋转 (默认 false)
  autoRotateSpeed?: number     // 自动旋转速度 (弧度/秒，默认 0.5)
}
```

**控制交互:**
- **左键拖动** - 旋转视角
- **右键/中键拖动** - 平移目标点
- **滚轮** - 缩放距离

**属性和方法:**
- `getPosition(): Vector3` - 获取当前相机位置
- `getTarget(): Vector3` - 获取目标点
- `setTarget(x, y, z): void` - 设置目标点
- `getDistance(): number` - 获取距离
- `setDistance(distance): void` - 设置距离
- `getAzimuth(): number` - 获取方位角
- `setAzimuth(azimuth): void` - 设置方位角
- `getElevation(): number` - 获取仰角
- `setElevation(elevation): void` - 设置仰角
- `setAutoRotate(enabled): void` - 启用/禁用自动旋转
- `setAutoRotateSpeed(speed): void` - 设置自动旋转速度

**矩阵方法:**
- `getViewMatrix(): Float32Array` - 获取视图矩阵
- `getProjectionMatrix(aspect): Float32Array` - 获取投影矩阵
- `getViewProjectionMatrix(aspect): Float32Array` - 获取视图投影矩阵

**生命周期:**
- `update(deltaTime): void` - 在渲染循环中每帧调用（处理阻尼和自动旋转）
- `destroy(): void` - 销毁控制器并移除事件监听

---

### result

#### 1. **DemoRunner 完整 API**

包含以下核心功能：
- **生命周期管理**: init → start → (pause/resume) → stop/destroy
- **渲染支持**: beginFrame/endFrame，自动处理颜色和深度附件
- **深度/模板配置**: 自动创建深度缓冲 (DEPTH24_UNORM_STENCIL8)，stencil 清除值为 0
- **资源追踪**: track/untrack 自动销毁
- **事件处理**: onKey、onResize 回调
- **渲染目标**: 自动创建和重建

#### 2. **GeometryGenerator 支持的几何体**

已实现的方法：
- ✅ `triangle()` - 基础三角形，支持顶点颜色
- ✅ `quad()` - **四边形完全支持**，支持 UV、颜色、索引绘制
- ✅ `cube()` - 立方体，支持法线、UV、索引
- ✅ `plane()` - 平面细分，支持任意分段数
- ✅ `sphere()` - 球体，球坐标生成

**图元类型支持**：
- 所有方法返回的 `GeometryData` 包含 `RHIVertexLayout`，完整支持顶点格式定义
- 支持三角形列表 (TRIANGLE_LIST) 作为默认图元
- 不支持其他图元类型（点、线、带）的显式生成方法

#### 3. **ProceduralTexture 支持的纹理**

完整的纹理类型：
- ✅ `checkerboard()` - 棋盘格
- ✅ `gradient()` - 渐变 (水平、竖直、对角线)
- ✅ `noise()` - 白噪声、Perlin 噪声、Simplex 噪声
- ✅ `solidColor()` - 纯色
- ✅ `uvDebug()` - UV 坐标可视化
- ✅ `normalMap()` - 法线贴图 (平面、凹凸、波浪)

所有纹理均返回 `TextureData { width, height, data: Uint8Array }`，可直接用于 RHI 纹理创建。

#### 4. **SimpleGUI 控制项支持**

自动类型推导：
- 数字 → 滑块 (slider)
- 布尔值 → 复选框 (checkbox)
- 字符串 (无 options) → 文本输入 (text)
- 字符串 (有 options) → 下拉框 (select)
- RGB 三元组 → 颜色选择器 (color)

链式 API，零依赖实现。

---

### conclusions

**关键发现：**

1. **Quad 支持**: GeometryGenerator 完全支持四边形生成，包括：
   - 自定义宽高
   - 可选 UV 坐标
   - 可选顶点颜色
   - 索引化绘制（6 个索引，2 个三角形）

2. **深度/模板配置**: DemoRunner.beginFrame() 自动提供：
   - 深度格式：`DEPTH24_UNORM_STENCIL8`
   - 深度清除值：1.0
   - 模板清除值：0
   - 支持通过 passDescriptor 自定义附件配置

3. **图元类型**: 几何体生成器暂未直接支持非三角形图元的生成方法，但：
   - 顶点布局完整支持任意格式
   - 可通过自定义几何数据和布局实现其他图元类型

4. **纹理支持**: ProceduralTexture 涵盖常见测试纹理，全部返回标准 `TextureData` 格式

5. **UI 完整性**: SimpleGUI 零依赖实现常见控制类型，Stats 提供性能监测

6. **相机系统**: OrbitController 提供完整的 3D 相机交互，支持阻尼和自动旋转

---

### relations

**模块依赖关系：**

- `DemoRunner` 调用 `WebGLDevice`（RHI 核心）、管理渲染循环和事件处理
- `beginFrame()` 返回的 `passDescriptor` 包含通过 `renderTarget.createView()` 生成的纹理视图
- `GeometryGenerator` 生成的 `GeometryData.layout` 遵循 RHI 的 `RHIVertexLayout` 规范
- `ProceduralTexture` 生成的 `TextureData.data` 可直接传入 `device.createTexture({ initialData: ... })`
- `OrbitController` 基于 `MMath` (数学库) 的 `Vector3` 和 `Matrix4` 进行计算
- `SimpleGUI` 和 `Stats` 均为纯 DOM/Canvas 实现，无外部依赖
- 所有工具通过 `utils/index.ts` 统一导出供 Demo 使用

**数据流：**
```
DemoRunner.device
  → createTexture(ProceduralTexture.checkerboard())
  → createBuffer(GeometryGenerator.quad())
  → createRenderPipeline()

DemoRunner.beginFrame()
  → { encoder, passDescriptor }
  → encoder.beginRenderPass(passDescriptor)
  → pass.draw() / drawIndexed()
  → DemoRunner.endFrame(encoder)

OrbitController.update(deltaTime)
  → getViewMatrix() / getProjectionMatrix()
  → 传入 shader 的 uniform buffer

SimpleGUI.add() / Stats.begin()/end()
  → DOM 元素或 Canvas 绘制
```
