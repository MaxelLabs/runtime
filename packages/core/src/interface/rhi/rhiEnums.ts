/**
 * rhiEnums.ts
 * 包含所有RHI相关的枚举定义。
 */

//---------------------------------------------------------------------------------------------------------------------
// 枚举 (Enums)
//---------------------------------------------------------------------------------------------------------------------

/**
 * 缓冲区用途标志
 */
export enum BufferUsage {
  None = 0,
  MapRead = 1 << 0,      // CPU 可读
  MapWrite = 1 << 1,     // CPU 可写
  CopySrc = 1 << 2,      // 可作为拷贝源
  CopyDst = 1 << 3,      // 可作为拷贝目标
  Index = 1 << 4,        // 索引缓冲区
  Vertex = 1 << 5,       // 顶点缓冲区
  Uniform = 1 << 6,      // Uniform缓冲区 (UBO)
  Storage = 1 << 7,      // 存储缓冲区 (SSBO)
  Indirect = 1 << 8,     // 间接绘制/派发参数
  QueryResolve = 1 << 9, // 查询结果
}

/**
 * 纹理维度
 */
export enum TextureDimension {
  D1 = '1d',
  D2 = '2d',
  D3 = '3d',
}

/**
 * 纹理视图维度
 */
export enum TextureViewDimension {
  D1 = '1d',
  D2 = '2d',
  D2Array = '2d-array',
  Cube = 'cube',
  CubeArray = 'cube-array',
  D3 = '3d',
}

/**
 * 纹理类型 (更接近 WebGPU 的 TextureDimension)
 */
export enum TextureType {
  Texture1D = '1d',
  Texture2D = '2d',
  Texture3D = '3d',
}

/**
 * 纹理格式
 */
export enum TextureFormat {
  // 8-bit formats
  R8Unorm = 'r8unorm',
  R8Snorm = 'r8snorm',
  R8Uint = 'r8uint',
  R8Sint = 'r8sint',

  // 16-bit formats
  R16Uint = 'r16uint',
  R16Sint = 'r16sint',
  R16Float = 'r16float',
  RG8Unorm = 'rg8unorm',
  RG8Snorm = 'rg8snorm',
  RG8Uint = 'rg8uint',
  RG8Sint = 'rg8sint',

  // 32-bit formats
  R32Uint = 'r32uint',
  R32Sint = 'r32sint',
  R32Float = 'r32float',
  RG16Uint = 'rg16uint',
  RG16Sint = 'rg16sint',
  RG16Float = 'rg16float',
  RGBA8Unorm = 'rgba8unorm',
  RGBA8UnormSrgb = 'rgba8unorm-srgb',
  RGBA8Snorm = 'rgba8snorm',
  RGBA8Uint = 'rgba8uint',
  RGBA8Sint = 'rgba8sint',
  BGRA8Unorm = 'bgra8unorm',
  BGRA8UnormSrgb = 'bgra8unorm-srgb',

  // Packed 32-bit formats
  RGB9E5Ufloat = 'rgb9e5ufloat',
  RGB10A2Unorm = 'rgb10a2unorm',
  RG11B10Ufloat = 'rg11b10ufloat',

  // 64-bit formats
  RG32Uint = 'rg32uint',
  RG32Sint = 'rg32sint',
  RG32Float = 'rg32float',
  RGBA16Uint = 'rgba16uint',
  RGBA16Sint = 'rgba16sint',
  RGBA16Float = 'rgba16float',

  // 128-bit formats
  RGBA32Uint = 'rgba32uint',
  RGBA32Sint = 'rgba32sint',
  RGBA32Float = 'rgba32float',

  // Depth/stencil formats
  Stencil8 = 'stencil8',
  Depth16Unorm = 'depth16unorm',
  Depth24Plus = 'depth24plus',
  Depth24PlusStencil8 = 'depth24plus-stencil8',
  Depth32Float = 'depth32float',
  Depth32FloatStencil8 = 'depth32float-stencil8', // WebGPU specific

  // BC compressed formats (DXT)
  BC1RGBAUnorm = 'bc1-rgba-unorm',
  BC1RGBAUnormSrgb = 'bc1-rgba-unorm-srgb',
  BC2RGBAUnorm = 'bc2-rgba-unorm',
  BC2RGBAUnormSrgb = 'bc2-rgba-unorm-srgb',
  BC3RGBAUnorm = 'bc3-rgba-unorm',
  BC3RGBAUnormSrgb = 'bc3-rgba-unorm-srgb',
  BC4RUnorm = 'bc4-r-unorm',
  BC4RSnorm = 'bc4-r-snorm',
  BC5RGUnorm = 'bc5-rg-unorm',
  BC5RGSnorm = 'bc5-rg-snorm',
  BC6HRGBUfloat = 'bc6h-rgb-ufloat',
  BC6HRGBFloat = 'bc6h-rgb-float',
  BC7RGBAUnorm = 'bc7-rgba-unorm',
  BC7RGBAUnormSrgb = 'bc7-rgba-unorm-srgb',

  // ETC2/EAC compressed formats
  ETC2RGB8Unorm = 'etc2-rgb8unorm',
  ETC2RGB8UnormSrgb = 'etc2-rgb8unorm-srgb',
  ETC2RGB8A1Unorm = 'etc2-rgb8a1unorm',
  ETC2RGB8A1UnormSrgb = 'etc2-rgb8a1unorm-srgb',
  ETC2RGBA8Unorm = 'etc2-rgba8unorm',
  ETC2RGBA8UnormSrgb = 'etc2-rgba8unorm-srgb',
  EACR11Unorm = 'eac-r11unorm',
  EACR11Snorm = 'eac-r11snorm',
  EACRG11Unorm = 'eac-rg11unorm',
  EACRG11Snorm = 'eac-rg11snorm',

  // ASTC compressed formats
  ASTC4x4Unorm = 'astc-4x4-unorm',
  ASTC4x4UnormSrgb = 'astc-4x4-unorm-srgb',
  // ... (add more ASTC formats as needed)
}

/**
 * 纹理用途标志 (WebGPU style)
 */
export enum TextureUsageFlags {
  None = 0,
  CopySrc = 1 << 0,
  CopyDst = 1 << 1,
  TextureBinding = 1 << 2, // TextureBinding / Sampled in WebGPU, combines Sampled + InputAttachment in Vulkan
  StorageBinding = 1 << 3, // Storage image
  RenderAttachment = 1 << 4, // Color attachment, depth/stencil attachment, resolve attachment
}

export enum AddressMode {
  Repeat = 'repeat',
  ClampToEdge = 'clamp-to-edge',
  MirrorRepeat = 'mirror-repeat',
}

export enum FilterMode {
  Nearest = 'nearest',
  Linear = 'linear',
}

export enum CompareFunction {
  Never = 'never',
  Less = 'less',
  Equal = 'equal',
  LessEqual = 'less-equal',
  Greater = 'greater',
  NotEqual = 'not-equal',
  GreaterEqual = 'greater-equal',
  Always = 'always',
}

export enum PrimitiveType {
  PointList = 'point-list',
  LineList = 'line-list',
  LineStrip = 'line-strip',
  TriangleList = 'triangle-list',
  TriangleStrip = 'triangle-strip',
}

export enum IndexFormat {
  Uint16 = 'uint16',
  Uint32 = 'uint32',
}

export enum ShaderStage {
  Vertex = 1 << 0,
  Fragment = 1 << 1,
  Compute = 1 << 2,
}

export enum BlendFactor {
  Zero = 'zero',
  One = 'one',
  Src = 'src',
  OneMinusSrc = 'one-minus-src',
  SrcAlpha = 'src-alpha',
  OneMinusSrcAlpha = 'one-minus-src-alpha',
  Dst = 'dst',
  OneMinusDst = 'one-minus-dst',
  DstAlpha = 'dst-alpha',
  OneMinusDstAlpha = 'one-minus-dst-alpha',
  SrcAlphaSaturated = 'src-alpha-saturated',
  Constant = 'constant',
  OneMinusConstant = 'one-minus-constant',
}

export enum BlendOperation {
  Add = 'add',
  Subtract = 'subtract',
  ReverseSubtract = 'reverse-subtract',
  Min = 'min',
  Max = 'max',
}

export enum StencilOperation {
  Keep = 'keep',
  Zero = 'zero',
  Replace = 'replace',
  IncrementClamp = 'increment-clamp',
  DecrementClamp = 'decrement-clamp',
  Invert = 'invert',
  IncrementWrap = 'increment-wrap',
  DecrementWrap = 'decrement-wrap',
}

export enum CullMode {
  None = 'none',
  Front = 'front',
  Back = 'back',
}

export enum FrontFace {
  CCW = 'ccw',
  CW = 'cw',
}

export enum VertexFormat {
  Uint8x2 = 'uint8x2',
  Uint8x4 = 'uint8x4',
  Sint8x2 = 'sint8x2',
  Sint8x4 = 'sint8x4',
  Unorm8x2 = 'unorm8x2',
  Unorm8x4 = 'unorm8x4',
  Snorm8x2 = 'snorm8x2',
  Snorm8x4 = 'snorm8x4',
  Uint16x2 = 'uint16x2',
  Uint16x4 = 'uint16x4',
  Sint16x2 = 'sint16x2',
  Sint16x4 = 'sint16x4',
  Unorm16x2 = 'unorm16x2',
  Unorm16x4 = 'unorm16x4',
  Snorm16x2 = 'snorm16x2',
  Snorm16x4 = 'snorm16x4',
  Float16x2 = 'float16x2',
  Float16x4 = 'float16x4',
  Float32 = 'float32',
  Float32x2 = 'float32x2',
  Float32x3 = 'float32x3',
  Float32x4 = 'float32x4',
  Uint32 = 'uint32',
  Uint32x2 = 'uint32x2',
  Uint32x3 = 'uint32x3',
  Uint32x4 = 'uint32x4',
  Sint32 = 'sint32',
  Sint32x2 = 'sint32x2',
  Sint32x3 = 'sint32x3',
  Sint32x4 = 'sint32x4',
}

export enum MapMode {
  Read = 1, // Corresponds to WebGPU GPUMapMode.READ
  Write = 2, // Corresponds to WebGPU GPUMapMode.WRITE
}

export enum BindGroupLayoutEntryType {
  Sampler = 'sampler',
  Texture = 'texture',
  StorageTexture = 'storage-texture',
  UniformBuffer = 'uniform-buffer',
  StorageBuffer = 'storage-buffer',
} 