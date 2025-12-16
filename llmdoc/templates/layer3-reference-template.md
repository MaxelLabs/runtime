---
<!-- AI元数据区域 - API参考文档专用 -->
<!-- METADATA_START -->
{
  "title": "API参考文档标题",
  "layer": "reference",
  "category": "reference",
  "subcategory": "api",
  "version": "2.1.0",
  "lastModified": "2024-01-15",
  "author": "API团队",
  "reviewer": "技术审核",
  "tags": ["api", "reference", "typescript", "webgl"],
  "keywords": ["API", "接口", "类", "方法", "属性", "类型定义"],
  "estimatedReadTime": 45,
  "difficulty": "advanced",
  "prerequisites": [
    {
      "title": "TypeScript基础",
      "type": "skill"
    },
    {
      "title": "WebGL概念",
      "type": "concept",
      "url": "../foundations/webgl-concepts.md"
    }
  ],
  "relatedDocs": [
    {
      "title": "使用指南",
      "url": "../guide/usage.md",
      "relation": "prerequisite"
    },
    {
      "title": "示例代码",
      "url": "../examples/index.md",
      "relation": "followup"
    }
  ],
  "codeExamples": {
    "typescript": 25,
    "glsl": 8,
    "javascript": 12,
    "json": 5
  },
  "apiInfo": {
    "module": "@maxel/rhi",
    "stability": "stable",
    "deprecated": false,
    "experimental": false
  }
}
<!-- METADATA_END -->

<!-- API文档标识 -->
<api-documentation module="@maxel/rhi" version="2.1.0" />
<semantic-tag type="document-type" value="api-reference" />
<toc-depth max="6" auto-generate="true" />

# [L3] API参考文档标题

<!-- API概览信息 -->
<api-overview>
> **📦 模块**: `@maxel/rhi`
> **🔖 版本**: v2.1.0 (Stable)
> **⏱️ 完整阅读**: 45分钟 | **快速查找**: 5分钟
> **🎯 适用场景**: WebGL2渲染、硬件抽象、跨平台开发
</api-overview>

## 🔍 快速导航

<!-- API快速索引 -->
<api-index>
**核心类**:
- [`RHIDevice`](#rhidevice) - 设备管理
- [`CommandBuffer`](#commandbuffer) - 命令缓冲
- [`RenderPipeline`](#renderpipeline) - 渲染管线

**工具类型**:
- [`Vec2`](#vec2), [`Vec3`](#vec3), [`Vec4`](#vec4) - 向量类型
- [`Mat3`](#mat3), [`Mat4`](#mat4) - 矩阵类型
- [`Color`](#color) - 颜色类型

**枚举**:
- [`PixelFormat`](#pixelformat) - 像素格式
- [`PrimitiveType`](#primitivetype) - 图元类型
- [`BlendMode`](#blendmode) - 混合模式
</api-index>

---

## 📚 模块导出

<module-exports name="@maxel/rhi">
### 命名空间导出
```typescript
export * from './device';
export * from './commands';
export * from './pipeline';
export * from './resources';
export * from './types';
export * from './constants';
```

### 默认导出
```typescript
export { RHIDevice as default } from './device';
```
</module-exports>

---

## 🏗️ 核心类

<api-class name="RHIDevice" stable="true" since="2.0.0">
### 类声明

```typescript
/**
 * WebGL硬件抽象设备
 * 提供统一的渲染硬件接口，屏蔽底层API差异
 *
 * @example
 * ```typescript
 * // 创建设备
 * const device = new RHIDevice(canvas);
 *
 * // 检查支持
 * if (device.isFeatureSupported('instanced-rendering')) {
 *   console.log('支持实例化渲染');
 * }
 * ```
 */
export class RHIDevice {
  // 只读属性
  public readonly canvas: HTMLCanvasElement;
  public readonly gl: WebGL2RenderingContext;
  public readonly capabilities: DeviceCapabilities;
  public readonly info: DeviceInfo;

  // 构造函数
  constructor(canvas: HTMLCanvasElement, options?: RHIDeviceOptions);

  // 设备方法
  public createBuffer<T>(descriptor: BufferDescriptor<T>): Buffer<T>;
  public createTexture(descriptor: TextureDescriptor): Texture;
  public createPipeline(descriptor: PipelineDescriptor): RenderPipeline;

  // 资源管理
  public destroy(): void;
  public flush(): void;
  public finish(): void;

  // 功能查询
  public isFeatureSupported(feature: string): boolean;
  public getExtension(name: string): any;
}
```

### 构造函数

<constructor-detail class="RHIDevice">
```typescript
constructor(canvas: HTMLCanvasElement, options?: RHIDeviceOptions)
```

**参数**:
| 参数名 | 类型 | 必需 | 默认值 | 描述 |
|--------|------|------|--------|------|
| `canvas` | `HTMLCanvasElement` | ✅ | - | WebGL画布元素 |
| `options` | `RHIDeviceOptions` | ❌ | `{}` | 设备配置选项 |

**配置选项**:
```typescript
interface RHIDeviceOptions {
  alpha?: boolean;           // 是否启用alpha通道
  depth?: boolean;           // 是否启用深度缓冲
  stencil?: boolean;         // 是否启用模板缓冲
  antialias?: boolean;       // 是否启用抗锯齿
  premultipliedAlpha?: boolean; // 是否预乘alpha
  preserveDrawingBuffer?: boolean; // 是否保持绘图缓冲
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  failIfMajorPerformanceCaveat?: boolean;
}
```

**抛出异常**:
- `WebGLNotSupportedError`: 浏览器不支持WebGL2
- `CanvasNotFoundError`: 找不到画布元素

**示例**:
```typescript
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const device = new RHIDevice(canvas, {
  antialias: true,
  powerPreference: 'high-performance'
});
```
</constructor-detail>

### 属性详情

<property-detail class="RHIDevice" name="capabilities">
```typescript
public readonly capabilities: DeviceCapabilities;
```

**描述**: 设备能力信息，包含硬件支持的特性详情

**类型定义**:
```typescript
interface DeviceCapabilities {
  maxTextureSize: number;           // 最大纹理尺寸
  maxVertexAttributes: number;      // 最大顶点属性数
  maxUniformBufferBindings: number; // 最大uniform缓冲绑定数
  maxDrawBuffers: number;           // 最大绘制缓冲数
  maxVertexTextureImageUnits: number; // 最大顶点纹理单元数
  maxTextureImageUnits: number;     // 最大片段纹理单元数
  maxCombinedTextureImageUnits: number; // 最大组合纹理单元数
  maxColorAttachments: number;      // 最大颜色附件数
  maxRenderbufferSize: number;      // 最大渲染缓冲尺寸
  maxTransformFeedbackInterleavedComponents: number;
  maxTransformFeedbackSeparateAttributes: number;
  maxTransformFeedbackSeparateComponents: number;
  maxSamples: number;               // 最大采样数
  maxServerWaitTimeout: number;     // 最大服务器等待超时
  max3DTextureSize: number;         // 最大3D纹理尺寸
  maxArrayTextureLayers: number;    // 最大数组纹理层数
  maxCubeMapTextureSize: number;    // 最大立方体贴图尺寸
  maxVertexUniformVectors: number;  // 最大顶点uniform向量数
  maxFragmentUniformVectors: number; // 最大片段uniform向量数
  maxVaryingVectors: number;        // 最大varying向量数
  maxVertexOutputComponents: number; // 最大顶点输出组件数
  maxFragmentInputComponents: number; // 最大片段输入组件数
  maxProgramTexelOffset: number;    // 最大程序纹理偏移
  minProgramTexelOffset: number;    // 最小程序纹理偏移
  maxClipDistances: number;         // 最大裁剪距离数
  maxDrawIndexedIndex: number;      // 最大索引绘制索引数
  maxElementsIndices: number;       // 最大元素索引数
  maxElementsVertices: number;      // 最大元素顶点数
  maxSamplesWebgl: number;          // WebGL最大采样数
  supportedExtensions: string[];    // 支持的扩展列表
}
```

**示例**:
```typescript
console.log(`最大纹理尺寸: ${device.capabilities.maxTextureSize}`);
console.log(`支持实例化渲染: ${device.capabilities.supportedExtensions.includes('ANGLE_instanced_arrays')}`);
```
</property-detail>

### 方法详情

<method-detail class="RHIDevice" name="createBuffer">
```typescript
public createBuffer<T>(descriptor: BufferDescriptor<T>): Buffer<T>
```

**描述**: 创建顶点缓冲或索引缓冲

**泛型参数**:
- `T`: 缓冲数据类型，如 `Float32Array`, `Uint16Array` 等

**参数**:
| 参数名 | 类型 | 描述 |
|--------|------|------|
| `descriptor` | `BufferDescriptor<T>` | 缓冲描述符 |

**返回值**: `Buffer<T>` - 缓冲对象

**描述符类型**:
```typescript
interface BufferDescriptor<T> {
  size: number;                    // 缓冲大小（字节）
  usage: BufferUsage;              // 缓冲用途
  data?: T | ArrayBufferView;      // 初始数据（可选）
  mappedAtCreation?: boolean;      // 创建时是否映射
}
```

**使用示例**:
```typescript
// 创建顶点缓冲
const vertices = new Float32Array([
  // 位置      // UV坐标
  0, 0, 0,    0, 0,
  1, 0, 0,    1, 0,
  1, 1, 0,    1, 1
]);

const vertexBuffer = device.createBuffer({
  size: vertices.byteLength,
  usage: BufferUsage.Vertex,
  data: vertices
});

// 创建索引缓冲
const indices = new Uint16Array([0, 1, 2]);
const indexBuffer = device.createBuffer({
  size: indices.byteLength,
  usage: BufferUsage.Index,
  data: indices
});
```

**性能提示**:
- 使用 `BufferUsage.Static` 静态数据
- 使用 `BufferUsage.Dynamic` 频繁更新的数据
- 使用 `BufferUsage.Stream` 每帧都变化的数据
</method-detail>

<method-detail class="RHIDevice" name="createTexture">
```typescript
public createTexture(descriptor: TextureDescriptor): Texture
```

**描述**: 创建纹理对象

**参数**:
```typescript
interface TextureDescriptor {
  dimension: TextureDimension;     // 纹理维度
  size: {
    width: number;
    height: number;
    depth?: number;                // 3D纹理专用
    arrayLayerCount?: number;      // 数组纹理专用
  };
  format: PixelFormat;             // 像素格式
  mipLevelCount?: number;          // Mip层级数
  sampleCount?: number;            // 采样数
  usage: TextureUsage;             // 纹理用途
  viewFormats?: PixelFormat[];     // 视图格式
}
```

**示例**:
```typescript
// 创建2D纹理
const texture = device.createTexture({
  dimension: TextureDimension.T2D,
  size: { width: 1024, height: 1024 },
  format: PixelFormat.RGBA8Unorm,
  mipLevelCount: 1,
  usage: TextureUsage.RenderAttachment | TextureUsage.TextureBinding
});

// 创建立方体贴图
const cubeTexture = device.createTexture({
  dimension: TextureDimension.T2D,
  size: { width: 512, height: 512, arrayLayerCount: 6 },
  format: PixelFormat.RGBA8Unorm,
  mipLevelCount: 1,
  usage: TextureUsage.TextureBinding
});
```
</method-detail>

<method-detail class="RHIDevice" name="isFeatureSupported">
```typescript
public isFeatureSupported(feature: string): boolean
```

**描述**: 检查设备是否支持特定功能

**支持的功能**:
| 功能名 | 描述 | 示例 |
|--------|------|------|
| `'webgl2'` | WebGL2支持 | `device.isFeatureSupported('webgl2')` |
| `'instanced-rendering'` | 实例化渲染 | `device.isFeatureSupported('instanced-rendering')` |
| `'depth-texture'` | 深度纹理 | `device.isFeatureSupported('depth-texture')` |
| `'texture-float'` | 浮点纹理 | `device.isFeatureSupported('texture-float')` |
| `'texture-half-float'` | 半浮纹理 | `device.isFeatureSupported('texture-half-float')` |
| `'texture-rgba32f'` | RGBA32F纹理 | `device.isFeatureSupported('texture-rgba32f')` |

**示例**:
```typescript
if (device.isFeatureSupported('instanced-rendering')) {
  // 使用实例化渲染
  renderInstanced();
} else {
  // 回退方案
  renderSeparately();
}
```
</method-detail>
</api-class>

---

## 🎯 工具类型

<api-types namespace="CoreTypes">
### Vec2 - 2D向量

```typescript
/**
 * 2D向量类型，表示二维空间中的点或方向
 */
export type Vec2 = [x: number, y: number];

/**
 * Vec2类，提供2D向量操作
 */
export class Vec2 {
  constructor(x?: number, y?: number);

  // 属性访问
  get x(): number;
  get y(): number;
  set x(value: number);
  set y(value: number);

  // 基础运算
  add(v: Vec2): Vec2;
  subtract(v: Vec2): Vec2;
  multiply(scalar: number): Vec2;
  divide(scalar: number): Vec2;

  // 向量运算
  dot(v: Vec2): number;
  length(): number;
  lengthSquared(): number;
  normalize(): Vec2;
  angle(v: Vec2): number;

  // 静态方法
  static zero(): Vec2;
  static one(): Vec2;
  static up(): Vec2;
  static down(): Vec2;
  static left(): Vec2;
  static right(): Vec2;
  static distance(a: Vec2, b: Vec2): number;
  static lerp(a: Vec2, b: Vec2, t: number): Vec2;
}

/**
 * Vec2相关的工具函数
 */
export namespace Vec2Ops {
  export function create(x: number, y: number): Vec2;
  export function clone(v: Vec2): Vec2;
  export function equals(a: Vec2, b: Vec2, epsilon?: number): boolean;
  export function toString(v: Vec2): string;
}
```

**使用示例**:
```typescript
import { Vec2, Vec2Ops } from '@maxel/rhi';

// 创建向量
const v1 = new Vec2(3, 4);
const v2 = Vec2.create(1, 2);

// 向量运算
const sum = v1.add(v2);           // (4, 6)
const dot = v1.dot(v2);           // 11
const length = v1.length();       // 5
const normalized = v1.normalize(); // (0.6, 0.8)

// 静态方法
const distance = Vec2.distance(v1, v2); // √13
const lerp = Vec2.lerp(v1, v2, 0.5);   // (2, 3)
```
</api-types>

---

## 🎨 枚举类型

<api-enums>
### PixelFormat - 像素格式

```typescript
/**
 * 纹理像素格式枚举
 * 定义纹理数据的存储格式和通道类型
 */
export enum PixelFormat {
  // 8位无符号整数格式
  R8Unorm = 'r8unorm',
  RG8Unorm = 'rg8unorm',
  RGB8Unorm = 'rgb8unorm',
  RGBA8Unorm = 'rgba8unorm',

  // 8位有符号整数格式
  R8Snorm = 'r8snorm',
  RG8Snorm = 'rg8snorm',
  RGB8Snorm = 'rgb8snorm',
  RGBA8Snorm = 'rgba8snorm',

  // 16位浮点格式
  R16Float = 'r16float',
  RG16Float = 'rg16float',
  RGB16Float = 'rgb16float',
  RGBA16Float = 'rgba16float',

  // 32位浮点格式
  R32Float = 'r32float',
  RG32Float = 'rg32float',
  RGB32Float = 'rgb32float',
  RGBA32Float = 'rgba32float',

  // 深度格式
  Depth24Plus = 'depth24plus',
  Depth24PlusStencil8 = 'depth24plus-stencil8',
  Depth32Float = 'depth32float',

  // 压缩格式
  BC1RGBUnorm = 'bc1-rgb-unorm',
  BC1RGBAUnorm = 'bc1-rgba-unorm',
  BC3RGBAUnorm = 'bc3-rgba-unorm',
  BC4RUnorm = 'bc4-r-unorm',
  BC5RGUnorm = 'bc5-rg-unorm',
  BC7RGBAUnorm = 'bc7-rgba-unorm',
}
```

**格式选择指南**:

| 用途 | 推荐格式 | 说明 |
|------|----------|------|
| 颜色纹理 | `RGBA8Unorm` | 标准8位颜色 |
| 高精度纹理 | `RGBA16Float` | HDR贴图 |
| 法线贴图 | `RGB8Unorm` | 8位法线数据 |
| 灰度图 | `R8Unorm` | 单通道数据 |
| 深度缓冲 | `Depth24Plus` | 24位深度 |
| 阴影贴图 | `Depth24Plus` | 深度比较 |

### BufferUsage - 缓冲用途

```typescript
export enum BufferUsage {
  /** 映射到CPU，可用于GPU读取 */
  MapRead = 0x0001,
  /** 映射到CPU，可用于GPU写入 */
  MapWrite = 0x0002,
  /** 可用作顶点缓冲 */
  Vertex = 0x0004,
  /** 可用作索引缓冲 */
  Index = 0x0008,
  /** 可用作uniform缓冲 */
  Uniform = 0x0010,
  /** 可用作存储缓冲 */
  Storage = 0x0020,
  /** 可用作间接绘制缓冲 */
  Indirect = 0x0040,
  /** 查询结果缓冲 */
  QueryResolve = 0x0080,
}
```

**使用示例**:
```typescript
// 顶点缓冲
const vertexBuffer = device.createBuffer({
  size: bufferSize,
  usage: BufferUsage.Vertex,
  data: vertexData
});

// 动态uniform缓冲
const uniformBuffer = device.createBuffer({
  size: uniformSize,
  usage: BufferUsage.Uniform | BufferUsage.MapWrite
});

// 存储缓冲（计算着色器）
const storageBuffer = device.createBuffer({
  size: storageSize,
  usage: BufferUsage.Storage | BufferUsage.MapRead | BufferUsage.MapWrite
});
```

### BlendMode - 混合模式

```typescript
export enum BlendMode {
  /** 禁用混合 */
  None = 'none',
  /** 标准alpha混合 */
  Alpha = 'alpha',
  /** 预乘alpha混合 */
  PremultipliedAlpha = 'premultiplied-alpha',
  /** 加法混合 */
  Add = 'add',
  /** 减法混合 */
  Subtract = 'subtract',
  /** 反转减法混合 */
  ReverseSubtract = 'reverse-subtract',
  /** 最小值混合 */
  Min = 'min',
  /** 最大值混合 */
  Max = 'max',
  /** 乘法混合 */
  Multiply = 'multiply',
  /** 屏幕混合 */
  Screen = 'screen',
  /** 覆盖混合 */
  Overlay = 'overlay',
  /** 柔光混合 */
  SoftLight = 'soft-light',
  /** 强光混合 */
  HardLight = 'hard-light',
}
```

**混合模式效果**:

| 模式 | 公式 | 用途 |
|------|------|------|
| `Alpha` | `src * src.a + dst * (1 - src.a)` | 标准透明 |
| `Add` | `src + dst` | 发光效果 |
| `Multiply` | `src * dst` | 阴影、叠加 |
| `Screen` | `1 - (1-src)*(1-dst)` | 高光、闪烁 |
| `Overlay` | `src < 0.5 ? 2*src*dst : 1-2*(1-src)*(1-dst)` | 对比度 |
</api-enums>

---

## 🔄 接口定义

<api-interfaces>
### DeviceCapabilities - 设备能力

```typescript
/**
 * 设备能力接口，描述硬件支持的各种特性
 */
export interface DeviceCapabilities extends BaseCapabilities {
  // 纹理能力
  readonly maxTextureSize: number;
  readonly max3DTextureSize: number;
  readonly maxCubeMapTextureSize: number;
  readonly maxArrayTextureLayers: number;
  readonly maxColorAttachments: number;
  readonly maxRenderbufferSize: number;

  // 顶点处理能力
  readonly maxVertexAttributes: number;
  readonly maxVertexUniformVectors: number;
  readonly maxVertexOutputComponents: number;
  readonly maxVertexTextureImageUnits: number;

  // 片段处理能力
  readonly maxFragmentUniformVectors: number;
  readonly maxFragmentInputComponents: number;
  readonly maxTextureImageUnits: number;

  // 通用能力
  readonly maxVaryingVectors: number;
  readonly maxUniformBufferBindings: number;
  readonly maxCombinedTextureImageUnits: number;
  readonly maxSamples: number;
  readonly maxDrawBuffers: number;
  readonly maxElementsIndices: number;
  readonly maxElementsVertices: number;
  readonly maxDrawIndexedIndex: number;

  // 变换反馈
  readonly maxTransformFeedbackInterleavedComponents: number;
  readonly maxTransformFeedbackSeparateAttributes: number;
  readonly maxTransformFeedbackSeparateComponents: number;

  // 其他
  readonly maxServerWaitTimeout: number;
  readonly maxProgramTexelOffset: number;
  readonly minProgramTexelOffset: number;
  readonly maxClipDistances: number;
  readonly maxSamplesWebgl: number;

  // 支持的扩展
  readonly supportedExtensions: readonly string[];

  // 功能支持标志
  readonly features: {
    instancedArrays: boolean;
    vertexArrayObject: boolean;
    drawBuffers: boolean;
    depthTexture: boolean;
    textureFloat: boolean;
    textureHalfFloat: boolean;
    textureFloatLinear: boolean;
    textureHalfFloatLinear: boolean;
    colorBufferFloat: boolean;
    colorBufferHalfFloat: boolean;
    standardDerivatives: boolean;
    shaderTextureLod: boolean;
    fragDepth: boolean;
    drawInstanced: boolean;
    instancedArrays: boolean;
    blendEquationMinMax: boolean;
  };
}
```

### TextureDescriptor - 纹理描述符

```typescript
/**
 * 纹理创建描述符
 */
export interface TextureDescriptor {
  /** 纹理维度 */
  dimension: TextureDimension;
  /** 纹理尺寸 */
  size: {
    width: number;
    height: number;
    depth?: number;
    arrayLayerCount?: number;
  };
  /** 像素格式 */
  format: PixelFormat;
  /** Mip层级数 */
  mipLevelCount?: number;
  /** 多重采样数 */
  sampleCount?: number;
  /** 纹理用途 */
  usage: TextureUsage;
  /** 视图格式（可选） */
  viewFormats?: PixelFormat[];
  /** 标签（调试用） */
  label?: string;
}
```

### PipelineDescriptor - 渲染管线描述符

```typescript
/**
 * 渲染管线描述符
 */
export interface PipelineDescriptor {
  /** 顶点阶段 */
  vertex: VertexState;
  /** 片段阶段（可选） */
  fragment?: FragmentState;
  /** 图元类型 */
  primitive: PrimitiveState;
  /** 深度模板状态 */
  depthStencil?: DepthStencilState;
  /** 多重采样状态 */
  multisample: MultisampleState;
  /** 颜色混合状态 */
  color: ColorState[];
  /** 布局 */
  layout: GPUPipelineLayout;
  /** 标签 */
  label?: string;
}
```

**使用示例**:
```typescript
const pipelineDescriptor: PipelineDescriptor = {
  vertex: {
    module: vertexShaderModule,
    entryPoint: 'main',
    buffers: [vertexBufferLayout]
  },
  fragment: {
    module: fragmentShaderModule,
    entryPoint: 'main',
    targets: [{
      format: PixelFormat.RGBA8Unorm,
      blend: {
        color: {
          srcFactor: BlendFactor.SrcAlpha,
          dstFactor: BlendFactor.OneMinusSrcAlpha
        }
      }
    }]
  },
  primitive: {
    topology: PrimitiveTopology.TriangleList,
    cullMode: CullMode.Back
  },
  depthStencil: {
    format: PixelFormat.Depth24Plus,
    depthWriteEnabled: true,
    depthCompare: CompareFunction.Less
  },
  multisample: {
    count: 4,
    mask: 0xFFFFFFFF
  },
  layout: device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  })
};

const pipeline = device.createRenderPipeline(pipelineDescriptor);
```
</api-interfaces>

---

## 🚀 速查手册

<quick-reference>
### 常用操作模式

**创建基础渲染流程**:
```typescript
// 1. 创建设备
const device = new RHIDevice(canvas);

// 2. 创建资源
const texture = device.createTexture(textureDescriptor);
const buffer = device.createBuffer(bufferDescriptor);
const pipeline = device.createPipeline(pipelineDescriptor);

// 3. 创建命令编码器
const encoder = device.createCommandEncoder();

// 4. 开始渲染通道
const renderPass = encoder.beginRenderPass(renderPassDescriptor);

// 5. 设置管线和绑定
renderPass.setPipeline(pipeline);
renderPass.setBindGroup(0, bindGroup);
renderPass.setVertexBuffer(0, vertexBuffer);
renderPass.setIndexBuffer(indexBuffer);

// 6. 绘制
renderPass.drawIndexed(indexCount);

// 7. 结束渲染通道
renderPass.end();

// 8. 提交命令
device.submit([encoder.finish()]);
```

**常见格式映射**:
```typescript
// 数据类型到WebGL格式的映射
const formatMap = {
  'Float32Array': { type: 'FLOAT', size: 4 },
  'Uint16Array': { type: 'UNSIGNED_SHORT', size: 2 },
  'Uint32Array': { type: 'UNSIGNED_INT', size: 4 },
  'Int32Array': { type: 'INT', size: 4 }
};

// 纹理格式选择指南
const getTextureFormat = (channels: number, hdr: boolean): PixelFormat => {
  if (channels === 1) return hdr ? PixelFormat.R32Float : PixelFormat.R8Unorm;
  if (channels === 2) return hdr ? PixelFormat.RG16Float : PixelFormat.RG8Unorm;
  if (channels === 3) return hdr ? PixelFormat.RGBA16Float : PixelFormat.RGBA8Unorm;
  if (channels === 4) return hdr ? PixelFormat.RGBA16Float : PixelFormat.RGBA8Unorm;
  return PixelFormat.RGBA8Unorm;
};
```

**性能优化检查清单**:
- [ ] 使用正确的缓冲用途标记
- [ ] 最小化状态变更
- [ ] 批量绘制调用
- [ ] 合理使用Mip贴图
- [ ] 启用背面剔除
- [ ] 使用实例化渲染
- [ ] 避免频繁的资源创建/销毁
- [ ] 使用对象池管理临时资源
</quick-reference>

---

## 📖 版本历史

<changelog>
### v2.1.0 (2024-01-15)
**新增**:
- 添加 `BlendMode.Overlay` 混合模式
- 新增 `DeviceCapabilities.features` 详细功能支持查询
- 扩展 `TextureDescriptor` 支持 `viewFormats`

**改进**:
- 优化缓冲创建性能
- 改进错误消息的可读性
- 增强类型推断

**修复**:
- 修复立方体贴图数组层计算错误
- 修复多重采样状态不一致问题
- 修复深度格式转换bug

### v2.0.0 (2023-12-01)
**重大更新**:
- 完全重构API设计，与WebGPU标准对齐
- 新增资源生命周期管理
- 改进类型安全性和错误处理

** breaking changes**:
- 旧版API已移除，请使用迁移指南
- 部分枚举值重命名
- 构造函数参数变更

**新特性**:
- 支持计算着色器
- 新增存储缓冲类型
- 支持多线程渲染
</changelog>

---

<!-- API文档页脚 -->
<api-footer>
**📦 NPM包**: `@maxel/rhi@2.1.0`
**📖 文档版本**: v2.1.0
**🔄 更新频率**: 每月发布
**📊 API覆盖**: 98% | **🧪 测试覆盖**: 95%
**🔗 相关文档**: [使用指南](../guide/usage.md) | [示例代码](../examples/) | [性能优化](../performance/)
</api-footer>