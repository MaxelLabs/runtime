# Demo 实现所需 RHI API 调查报告

日期: 2025-12-10
调查范围: Demo 四大功能块 API 签名和使用示例

---

## 代码证据清单

### 核心类型定义文件

- `packages/specification/src/common/rhi/types/enums.ts` (RHIBlendFactor, RHIBlendOperation, RHIPrimitiveTopology, RHIIndexFormat): 枚举定义
- `packages/specification/src/common/rhi/types/states.ts` (RHIColorBlendState, RHIBlendComponent): 混合状态类型
- `packages/specification/src/common/rhi/types/descriptors.ts` (RHIRenderPipelineDescriptor): 管线描述符
- `packages/specification/src/common/rhi/resources/buffer.ts` (IRHIBuffer): 缓冲区接口
- `packages/specification/src/common/rhi/passes/renderPass.ts` (IRHIRenderPass): 渲染通道接口
- `packages/specification/src/common/rhi/pipeline.ts` (IRHIRenderPipeline): 管线接口

### WebGL 实现文件

- `packages/rhi/src/webgl/commands/GLRenderPass.ts` (WebGLRenderPass): 渲染通道实现
- `packages/rhi/src/webgl/resources/GLBuffer.ts` (GLBuffer): 缓冲区实现
- `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts` (WebGLRenderPipeline): 管线实现
- `packages/rhi/src/webgl/utils/GLUtils.ts` (WebGLUtils): 工具转换函数

---

## 报告

### 1. quad-indexed - 索引缓冲区 API

#### 1.1 createBuffer 的 INDEX usage

**位置**: `packages/specification/src/common/rhi/types/enums.ts:122-132`

```typescript
export enum RHIBufferUsage {
  VERTEX = 'vertex',
  INDEX = 'index',      // <-- 索引缓冲区标志
  UNIFORM = 'uniform',
  STORAGE = 'storage',
  INDIRECT = 'indirect',
  MAP_READ = 'map-read',
  MAP_WRITE = 'map-write',
  COPY_SRC = 'copy-src',
  COPY_DST = 'copy-dst',
}
```

**API 签名**:
```typescript
interface RHIBufferDescriptor {
  size: number;           // 缓冲区大小（字节）
  usage: RHIBufferUsage;  // 使用 RHIBufferUsage.INDEX
  initialData?: BufferSource;  // 初始数据
  hint?: 'static' | 'dynamic' | 'stream';
  label?: string;
}

// 创建索引缓冲区示例
const indexData = new Uint16Array([0, 1, 2, 1, 3, 2]);
const indexBuffer = device.createBuffer({
  size: indexData.byteLength,
  usage: RHIBufferUsage.INDEX,
  initialData: indexData,
  hint: 'static',
  label: 'IndexBuffer'
});
```

**WebGL 实现**: `packages/rhi/src/webgl/resources/GLBuffer.ts:56-75`
- 在构造函数中根据 usage 获取 GL buffer target (gl.ELEMENT_ARRAY_BUFFER)
- 通过 gl.bufferData 初始化数据

#### 1.2 setIndexBuffer 方法

**位置**: `packages/specification/src/common/rhi/passes/renderPass.ts:23-25`

**API 签名**:
```typescript
interface IRHIRenderPass {
  /**
   * 设置索引缓冲区
   */
  setIndexBuffer(
    buffer: IRHIBuffer,           // 索引缓冲区
    indexFormat: RHIIndexFormat,  // 索引格式
    offset?: number               // 缓冲区偏移（字节）
  ): void;
}
```

**WebGL 实现**: `packages/rhi/src/webgl/commands/GLRenderPass.ts:320-339`
```typescript
setIndexBuffer(buffer: MSpec.IRHIBuffer, indexFormat: MSpec.RHIIndexFormat, offset: number = 0): void {
  this.currentIndexBuffer = buffer as GLBuffer;
  this.currentIndexFormat = indexFormat;
  this.currentIndexOffset = offset;

  this.encoder.addCommand(() => {
    const gl = this.gl;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.currentIndexBuffer!.getGLBuffer());
  });
}
```

**使用示例**:
```typescript
const renderPass = encoder.beginRenderPass(passDescriptor);
renderPass.setPipeline(pipeline);
renderPass.setVertexBuffer(0, vertexBuffer);

// 设置索引缓冲区，使用 UINT16 格式
renderPass.setIndexBuffer(indexBuffer, RHIIndexFormat.UINT16, 0);

renderPass.drawIndexed(6);  // 绘制 6 个索引
renderPass.end();
```

#### 1.3 drawIndexed 方法

**位置**: `packages/specification/src/common/rhi/passes/renderPass.ts:44-51`

**API 签名**:
```typescript
interface IRHIRenderPass {
  /**
   * 使用索引绘制几何体
   */
  drawIndexed(
    indexCount: number,       // 索引数量
    instanceCount?: number,   // 实例数量（默认 1）
    firstIndex?: number,      // 第一个索引偏移（默认 0）
    baseVertex?: number,      // 顶点基础偏移（默认 0）
    firstInstance?: number    // 第一个实例偏移（默认 0）
  ): void;
}
```

**WebGL 实现**: `packages/rhi/src/webgl/commands/GLRenderPass.ts:484-539`
```typescript
drawIndexed(
  indexCount: number,
  instanceCount: number = 1,
  firstIndex: number = 0,
  baseVertex: number = 0,
  firstInstance: number = 0
): void {
  const primitiveType = this.utils.primitiveTopologyToGL(this.currentPipeline.primitiveTopology);
  const indexType = this.currentIndexFormat === MSpec.RHIIndexFormat.UINT16 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
  const bytesPerIndex = this.currentIndexFormat === MSpec.RHIIndexFormat.UINT16 ? 2 : 4;
  const offset = this.currentIndexOffset + firstIndex * bytesPerIndex;

  if (instanceCount > 1) {
    // WebGL2: drawElementsInstanced
    // WebGL1: ANGLE_instanced_arrays.drawElementsInstancedANGLE
  } else {
    gl.drawElements(primitiveType, indexCount, indexType, offset);
  }
}
```

**使用示例**:
```typescript
// 方式 1: 简单的索引绘制
renderPass.drawIndexed(6);

// 方式 2: 带实例数据的索引绘制
renderPass.drawIndexed(6, 4);  // 绘制 6 个索引，4 个实例

// 方式 3: 复杂的偏移绘制
renderPass.drawIndexed(6, 1, 3, 0, 0);  // 从第 3 个索引开始，绘制 6 个索引
```

#### 1.4 索引格式（UINT16/UINT32）

**位置**: `packages/specification/src/common/rhi/types/enums.ts:244-248`

```typescript
export enum RHIIndexFormat {
  UINT16 = 'uint16',   // 16 位无符号整数索引
  UINT32 = 'uint32',   // 32 位无符号整数索引
}
```

**相关转换**: `packages/rhi/src/webgl/commands/GLRenderPass.ts:506-507`
```typescript
const indexType = this.currentIndexFormat === MSpec.RHIIndexFormat.UINT16
  ? gl.UNSIGNED_SHORT
  : gl.UNSIGNED_INT;
```

---

### 2. primitive-types - 图元拓扑 API

#### 2.1 RHIPrimitiveTopology 枚举

**位置**: `packages/specification/src/common/rhi/types/enums.ts:214-222`

```typescript
export enum RHIPrimitiveTopology {
  POINT_LIST = 0,        // 点列
  LINE_LIST = 1,         // 线段列
  LINE_STRIP = 2,        // 连续线段
  TRIANGLE_LIST = 3,     // 三角形列（默认）
  TRIANGLE_STRIP = 4,    // 连续三角形
}
```

#### 2.2 在创建管线时指定 primitiveTopology

**位置**: `packages/specification/src/common/rhi/types/descriptors.ts:189-234`

**API 签名**:
```typescript
interface RHIRenderPipelineDescriptor {
  vertexShader: IRHIShaderModule;
  fragmentShader: IRHIShaderModule;
  vertexLayout: RHIVertexLayout;
  primitiveTopology: RHIPrimitiveTopology;  // <-- 图元拓扑指定位置
  rasterizationState?: RHIRasterizationState;
  depthStencilState?: RHIDepthStencilState;
  colorBlendState?: RHIColorBlendState;
  layout: IRHIPipelineLayout;
  label?: string;
}
```

**WebGL 实现**: `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts:52`
```typescript
this._primitiveTopology = descriptor.primitiveTopology;
```

**转换函数**: `packages/rhi/src/webgl/utils/GLUtils.ts:658-675`
```typescript
primitiveTopologyToGL(topology: MSpec.RHIPrimitiveTopology): number {
  const gl = this.gl;

  switch (topology) {
    case MSpec.RHIPrimitiveTopology.POINT_LIST:
      return gl.POINTS;
    case MSpec.RHIPrimitiveTopology.LINE_LIST:
      return gl.LINES;
    case MSpec.RHIPrimitiveTopology.LINE_STRIP:
      return gl.LINE_STRIP;
    case MSpec.RHIPrimitiveTopology.TRIANGLE_LIST:
      return gl.TRIANGLES;
    case MSpec.RHIPrimitiveTopology.TRIANGLE_STRIP:
      return gl.TRIANGLE_STRIP;
    default:
      return gl.TRIANGLES;
  }
}
```

**使用示例**:
```typescript
// 创建点列渲染管线
const pointPipeline = device.createRenderPipeline({
  vertexShader: vertexModule,
  fragmentShader: fragmentModule,
  vertexLayout: vertexLayout,
  primitiveTopology: RHIPrimitiveTopology.POINT_LIST,  // 指定为点列
  layout: pipelineLayout,
});

// 创建线段渲染管线
const linePipeline = device.createRenderPipeline({
  vertexShader: vertexModule,
  fragmentShader: fragmentModule,
  vertexLayout: vertexLayout,
  primitiveTopology: RHIPrimitiveTopology.LINE_STRIP,  // 连续线段
  layout: pipelineLayout,
});

// 创建三角形渲染管线（标准）
const triPipeline = device.createRenderPipeline({
  vertexShader: vertexModule,
  fragmentShader: fragmentModule,
  vertexLayout: vertexLayout,
  primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
  layout: pipelineLayout,
});
```

---

### 3. viewport-scissor - 视口裁剪 API

#### 3.1 setViewport 方法

**位置**: `packages/specification/src/common/rhi/passes/renderPass.ts:54-56`

**API 签名**:
```typescript
interface IRHIRenderPass {
  /**
   * 设置视口
   * @param x 视口左上角 X 坐标
   * @param y 视口左上角 Y 坐标
   * @param width 视口宽度
   * @param height 视口高度
   * @param minDepth 深度范围最小值（0-1，默认 0）
   * @param maxDepth 深度范围最大值（0-1，默认 1）
   */
  setViewport(
    x: number,
    y: number,
    width: number,
    height: number,
    minDepth?: number,
    maxDepth?: number
  ): void;
}
```

**WebGL 实现**: `packages/rhi/src/webgl/commands/GLRenderPass.ts:544-558`
```typescript
setViewport(x: number, y: number, width: number, height: number, minDepth: number = 0, maxDepth: number = 1): void {
  this.viewport = { x, y, width, height, minDepth, maxDepth };

  this.encoder.addCommand(() => {
    const gl = this.gl;
    gl.viewport(x, y, width, height);
    gl.depthRange(minDepth, maxDepth);
  });
}
```

**使用示例**:
```typescript
const renderPass = encoder.beginRenderPass(passDescriptor);

// 标准全屏视口
renderPass.setViewport(0, 0, canvasWidth, canvasHeight);

// 左上角视口（四分之一屏幕）
renderPass.setViewport(0, 0, canvasWidth / 2, canvasHeight / 2);

// 右下角视口
renderPass.setViewport(canvasWidth / 2, canvasHeight / 2, canvasWidth / 2, canvasHeight / 2);

// 自定义深度范围
renderPass.setViewport(0, 0, canvasWidth, canvasHeight, 0.1, 0.9);
```

#### 3.2 setScissor 方法（以及 setScissorRect）

**位置**: `packages/specification/src/common/rhi/passes/renderPass.ts:59-61`

**API 签名**:
```typescript
interface IRHIRenderPass {
  /**
   * 设置裁剪矩形
   * @param x 裁剪矩形左上角 X 坐标
   * @param y 裁剪矩形左上角 Y 坐标
   * @param width 裁剪矩形宽度
   * @param height 裁剪矩形高度
   */
  setScissorRect(
    x: number,
    y: number,
    width: number,
    height: number
  ): void;
}
```

**WebGL 实现**: `packages/rhi/src/webgl/commands/GLRenderPass.ts:563-577`
```typescript
setScissorRect(x: number, y: number, width: number, height: number): void {
  this.scissorRect = { x, y, width, height };

  this.encoder.addCommand(() => {
    const gl = this.gl;
    gl.scissor(x, y, width, height);
    gl.enable(gl.SCISSOR_TEST);
  });
}
```

**使用示例**:
```typescript
const renderPass = encoder.beginRenderPass(passDescriptor);
renderPass.setPipeline(pipeline);

// 设置整个屏幕的视口
renderPass.setViewport(0, 0, 800, 600);

// 设置裁剪区域仅为左上角四分之一
renderPass.setScissorRect(0, 0, 400, 300);

// 绘制将只在左上角四分之一的区域显示
renderPass.draw(vertexCount);

renderPass.end();
```

#### 3.3 RHIViewport 和 RHIScissorRect 类型

**位置**: `packages/rhi/src/webgl/commands/GLRenderPass.ts:38-39`

```typescript
// 内部类型定义
private viewport: { x: number; y: number; width: number; height: number; minDepth: number; maxDepth: number };
private scissorRect: { x: number; y: number; width: number; height: number };
```

**使用示例** (完整 Demo):
```typescript
const runner = new DemoRunner({ canvasId: 'J-canvas', name: 'Viewport-Scissor' });
await runner.init();

const encoder = runner.device.createCommandEncoder();
const renderPass = encoder.beginRenderPass(passDescriptor);

renderPass.setPipeline(pipeline);
renderPass.setVertexBuffer(0, vertexBuffer);

// 分屏渲染
// 左屏
renderPass.setViewport(0, 0, 400, 600);
renderPass.setScissorRect(0, 0, 400, 600);
renderPass.draw(vertexCount);

// 右屏
renderPass.setViewport(400, 0, 400, 600);
renderPass.setScissorRect(400, 0, 400, 600);
renderPass.draw(vertexCount);

renderPass.end();
runner.device.queue.submit(encoder.finish());
```

---

### 4. blend-modes - 混合模式 API

#### 4.1 RHIBlendState 配置

**位置**: `packages/specification/src/common/rhi/types/states.ts:119-186`

**核心类型**:
```typescript
interface RHIColorBlendState {
  // 渲染目标的混合状态
  attachments: RHIColorBlendAttachment[];

  // 颜色混合常量
  blendConstants?: [number, number, number, number];

  // 是否启用混合
  blendEnabled?: boolean;

  // 颜色混合操作（WebGL 中使用）
  colorBlendOperation?: RHIBlendOperation;

  // Alpha 混合操作
  alphaBlendOperation?: RHIBlendOperation;

  // 源颜色因子
  srcColorFactor?: RHIBlendFactor;

  // 目标颜色因子
  dstColorFactor?: RHIBlendFactor;

  // 源 Alpha 因子
  srcAlphaFactor?: RHIBlendFactor;

  // 目标 Alpha 因子
  dstAlphaFactor?: RHIBlendFactor;

  // 混合颜色
  blendColor?: [number, number, number, number];

  // 颜色写入掩码
  writeMask?: number;  // 0x1: Red, 0x2: Green, 0x4: Blue, 0x8: Alpha
}

interface RHIColorBlendAttachment {
  color: RHIBlendComponent;
  alpha: RHIBlendComponent;
}

interface RHIBlendComponent {
  enable?: boolean;
  srcFactor?: RHIBlendFactor;
  dstFactor?: RHIBlendFactor;
  operation?: RHIBlendOperation;
}
```

#### 4.2 RHIBlendFactor 枚举

**位置**: `packages/specification/src/common/rhi/types/enums.ts:178-197`

```typescript
export enum RHIBlendFactor {
  Zero = 'zero',                           // (0, 0, 0, 0)
  One = 'one',                             // (1, 1, 1, 1)
  SrcColor = 'src-color',                  // 源颜色
  OneMinusSrcColor = 'one-minus-src-color', // 1 - 源颜色
  DstColor = 'dst-color',                  // 目标颜色
  OneMinusDstColor = 'one-minus-dst-color', // 1 - 目标颜色
  SrcAlpha = 'src-alpha',                  // 源 Alpha
  OneMinusSrcAlpha = 'one-minus-src-alpha', // 1 - 源 Alpha
  DstAlpha = 'dst-alpha',                  // 目标 Alpha
  OneMinusDstAlpha = 'one-minus-dst-alpha', // 1 - 目标 Alpha
  ConstantColor = 'constant-color',        // 混合常量颜色
  OneMinusConstantColor = 'one-minus-constant-color',
  ConstantAlpha = 'constant-alpha',        // 混合常量 Alpha
  OneMinusConstantAlpha = 'one-minus-constant-alpha',
  SrcAlphaSaturate = 'src-alpha-saturate', // min(SrcA, 1-DstA)
}
```

**WebGL 转换**: `packages/rhi/src/webgl/utils/GLUtils.ts:588-625`

#### 4.3 RHIBlendOperation 枚举

**位置**: `packages/specification/src/common/rhi/types/enums.ts:168-176`

```typescript
export enum RHIBlendOperation {
  ADD = 0,              // 加法混合
  SUBTRACT = 1,         // 减法混合
  REVERSE_SUBTRACT = 2, // 反向减法混合
  MIN = 3,              // 最小值（需要 EXT_blend_minmax 扩展）
  MAX = 4,              // 最大值（需要 EXT_blend_minmax 扩展）
}
```

**WebGL 转换**: `packages/rhi/src/webgl/utils/GLUtils.ts:630-653`
```typescript
blendOperationToGL(operation: MSpec.RHIBlendOperation): number {
  switch (operation) {
    case MSpec.RHIBlendOperation.ADD:
      return gl.FUNC_ADD;
    case MSpec.RHIBlendOperation.SUBTRACT:
      return gl.FUNC_SUBTRACT;
    case MSpec.RHIBlendOperation.REVERSE_SUBTRACT:
      return gl.FUNC_REVERSE_SUBTRACT;
    case MSpec.RHIBlendOperation.MIN: {
      const minExt = this.extension['EXT_blend_minmax'];
      return minExt ? minExt.MIN_EXT : gl.FUNC_ADD;
    }
    case MSpec.RHIBlendOperation.MAX: {
      const maxExt = this.extension['EXT_blend_minmax'];
      return maxExt ? maxExt.MAX_EXT : gl.FUNC_ADD;
    }
    default:
      return gl.FUNC_ADD;
  }
}
```

#### 4.4 在创建管线时指定 blendState

**位置**: `packages/specification/src/common/rhi/types/descriptors.ts:189-234`

**API 签名**:
```typescript
interface RHIRenderPipelineDescriptor {
  vertexShader: IRHIShaderModule;
  fragmentShader: IRHIShaderModule;
  vertexLayout: RHIVertexLayout;
  primitiveTopology: RHIPrimitiveTopology;
  rasterizationState?: RHIRasterizationState;
  depthStencilState?: RHIDepthStencilState;
  colorBlendState?: RHIColorBlendState;  // <-- 混合状态配置位置
  layout: IRHIPipelineLayout;
  label?: string;
}
```

**WebGL 实现应用**: `packages/rhi/src/webgl/pipeline/GLRenderPipeline.ts:337-338, 455-480`
```typescript
if (this._colorBlendState) {
  this.applyColorBlendState(this._colorBlendState);
}

private applyColorBlendState(state: MSpec.RHIColorBlendState): void {
  const gl = this.gl;
  const blendEnabled = state.blendEnabled ?? false;
  const colorOp = state.colorBlendOperation ?? MSpec.RHIBlendOperation.ADD;
  const alphaOp = state.alphaBlendOperation ?? MSpec.RHIBlendOperation.ADD;
  const srcColor = state.srcColorFactor ?? MSpec.RHIBlendFactor.One;
  const dstColor = state.dstColorFactor ?? MSpec.RHIBlendFactor.Zero;
  const srcAlpha = state.srcAlphaFactor ?? MSpec.RHIBlendFactor.One;
  const dstAlpha = state.dstAlphaFactor ?? MSpec.RHIBlendFactor.Zero;

  if (blendEnabled) {
    gl.enable(gl.BLEND);
    gl.blendEquationSeparate(
      this.utils.blendOperationToGL(colorOp),
      this.utils.blendOperationToGL(alphaOp)
    );
    gl.blendFuncSeparate(
      this.utils.blendFactorToGL(srcColor),
      this.utils.blendFactorToGL(dstColor),
      this.utils.blendFactorToGL(srcAlpha),
      this.utils.blendFactorToGL(dstAlpha)
    );
  } else {
    gl.disable(gl.BLEND);
  }
}
```

**使用示例** (透明度混合):
```typescript
// 创建支持透明度混合的渲染管线
const blendPipeline = device.createRenderPipeline({
  vertexShader: vertexModule,
  fragmentShader: fragmentModule,
  vertexLayout: vertexLayout,
  primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
  colorBlendState: {
    blendEnabled: true,
    colorBlendOperation: RHIBlendOperation.ADD,
    alphaBlendOperation: RHIBlendOperation.ADD,
    srcColorFactor: RHIBlendFactor.SrcAlpha,        // 源 Alpha
    dstColorFactor: RHIBlendFactor.OneMinusSrcAlpha, // 1 - 源 Alpha
    srcAlphaFactor: RHIBlendFactor.One,
    dstAlphaFactor: RHIBlendFactor.Zero,
    blendColor: [0, 0, 0, 1],
    writeMask: 0xF,  // 写入所有通道
  },
  layout: pipelineLayout,
});
```

**使用示例** (加法混合):
```typescript
const additivePipeline = device.createRenderPipeline({
  vertexShader: vertexModule,
  fragmentShader: fragmentModule,
  vertexLayout: vertexLayout,
  primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
  colorBlendState: {
    blendEnabled: true,
    colorBlendOperation: RHIBlendOperation.ADD,
    alphaBlendOperation: RHIBlendOperation.ADD,
    srcColorFactor: RHIBlendFactor.One,   // 加法模式
    dstColorFactor: RHIBlendFactor.One,
    srcAlphaFactor: RHIBlendFactor.One,
    dstAlphaFactor: RHIBlendFactor.One,
  },
  layout: pipelineLayout,
});
```

**使用示例** (乘法混合):
```typescript
const multiplicativePipeline = device.createRenderPipeline({
  vertexShader: vertexModule,
  fragmentShader: fragmentModule,
  vertexLayout: vertexLayout,
  primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
  colorBlendState: {
    blendEnabled: true,
    colorBlendOperation: RHIBlendOperation.ADD,
    srcColorFactor: RHIBlendFactor.DstColor,
    dstColorFactor: RHIBlendFactor.Zero,
    srcAlphaFactor: RHIBlendFactor.DstColor,
    dstAlphaFactor: RHIBlendFactor.Zero,
  },
  layout: pipelineLayout,
});
```

**在渲染通道中设置混合常量**:

`packages/specification/src/common/rhi/passes/renderPass.ts:64-66`

```typescript
interface IRHIRenderPass {
  /**
   * 设置混合常量
   */
  setBlendConstant(color: [number, number, number, number]): void;
}
```

**实现**: `packages/rhi/src/webgl/commands/GLRenderPass.ts:582-595`

---

## 结论

### 总结四大功能模块 API 可用性

| 功能 | 状态 | 关键 API | 文件位置 |
|------|------|---------|---------|
| **quad-indexed** | ✅ 完整 | `createBuffer(INDEX)`, `setIndexBuffer()`, `drawIndexed()`, `RHIIndexFormat` | spec/enums, spec/passes, rhi/commands |
| **primitive-types** | ✅ 完整 | `RHIPrimitiveTopology` 枚举，管线描述符 | spec/enums, spec/descriptors, rhi/pipeline |
| **viewport-scissor** | ✅ 完整 | `setViewport()`, `setScissorRect()` | spec/passes, rhi/commands |
| **blend-modes** | ✅ 完整 | `RHIBlendState`, `RHIBlendFactor`, `RHIBlendOperation`, 管线配置 | spec/states, spec/enums, rhi/pipeline |

### 关键发现

1. **完整的 WebGL 实现**: 所有四个 API 模块都有完整的 WebGL 实现
2. **类型安全**: 所有枚举和接口定义清晰，支持 TypeScript 类型检查
3. **方便的工具函数**: GLUtils 提供了完整的 RHI→WebGL 转换函数
4. **灵活的配置**: 支持静态（管线配置）和动态（渲染通道调用）两种设置方式

### Demo 实现路径

1. **quad-indexed**: 创建 UINT16 索引缓冲区，调用 `setIndexBuffer()` + `drawIndexed()`
2. **primitive-types**: 在管线描述符中指定 `primitiveTopology`
3. **viewport-scissor**: 在渲染通道中调用 `setViewport()` + `setScissorRect()`
4. **blend-modes**: 在管线描述符中配置 `colorBlendState` 对象

所有 API 都已完整实现，可直接使用！
