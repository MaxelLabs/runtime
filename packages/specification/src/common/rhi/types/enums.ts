/**
 * RHI渲染硬件接口枚举定义 - 权威来源
 * 所有RHI相关的枚举类型定义
 */

/**
 * 纹理格式统一定义
 */
export enum RHITextureFormat {
  // 8位格式
  R8_UNORM = 'r8-unorm',
  R8_SNORM = 'r8-snorm',
  R8_UINT = 'r8-uint',
  R8_SINT = 'r8-sint',

  // 16位格式
  R16_UINT = 'r16-uint',
  R16_SINT = 'r16-sint',
  R16_FLOAT = 'r16-float',
  RG8_UNORM = 'rg8-unorm',
  RG8_SNORM = 'rg8-snorm',
  RG8_UINT = 'rg8-uint',
  RG8_SINT = 'rg8-sint',

  // 32位格式
  R32_UINT = 'r32-uint',
  R32_SINT = 'r32-sint',
  R32_FLOAT = 'r32-float',
  RG16_UINT = 'rg16-uint',
  RG16_SINT = 'rg16-sint',
  RG16_FLOAT = 'rg16-float',
  RGBA8_UNORM = 'rgba8-unorm',
  RGBA8_UNORM_SRGB = 'rgba8-unorm-srgb',
  RGBA8_SNORM = 'rgba8-snorm',
  RGBA8_UINT = 'rgba8-uint',
  RGBA8_SINT = 'rgba8-sint',
  BGRA8_UNORM = 'bgra8-unorm',
  BGRA8_UNORM_SRGB = 'bgra8-unorm-srgb',

  // 64位格式
  RG32_UINT = 'rg32-uint',
  RG32_SINT = 'rg32-sint',
  RG32_FLOAT = 'rg32-float',
  RGBA16_UINT = 'rgba16-uint',
  RGBA16_SINT = 'rgba16-sint',
  RGBA16_FLOAT = 'rgba16-float',

  // 128位格式
  RGBA32_UINT = 'rgba32-uint',
  RGBA32_SINT = 'rgba32-sint',
  RGBA32_FLOAT = 'rgba32-float',

  // 深度/模板格式
  DEPTH16_UNORM = 'depth16-unorm',
  DEPTH24_UNORM = 'depth24-unorm',
  DEPTH32_FLOAT = 'depth32-float',
  DEPTH24_UNORM_STENCIL8 = 'depth24-unorm-stencil8',
  DEPTH32_FLOAT_STENCIL8 = 'depth32-float-stencil8',

  // 压缩纹理格式
  BC1_RGBA_UNORM = 'bc1-rgba-unorm',
  BC1_RGBA_UNORM_SRGB = 'bc1-rgba-unorm-srgb',
  BC2_RGBA_UNORM = 'bc2-rgba-unorm',
  BC2_RGBA_UNORM_SRGB = 'bc2-rgba-unorm-srgb',
  BC3_RGBA_UNORM = 'bc3-rgba-unorm',
  BC3_RGBA_UNORM_SRGB = 'bc3-rgba-unorm-srgb',
  BC4_R_UNORM = 'bc4-r-unorm',
  BC4_R_SNORM = 'bc4-r-snorm',
  BC5_RG_UNORM = 'bc5-rg-unorm',
  BC5_RG_SNORM = 'bc5-rg-snorm',
  BC6H_RGB_UFLOAT = 'bc6h-rgb-ufloat',
  BC6H_RGB_FLOAT = 'bc6h-rgb-float',
  BC7_RGBA_UNORM = 'bc7-rgba-unorm',
  BC7_RGBA_UNORM_SRGB = 'bc7-rgba-unorm-srgb',

  // ETC2/EAC压缩格式
  ETC2_RGB8_UNORM = 'etc2-rgb8-unorm',
  ETC2_RGB8_UNORM_SRGB = 'etc2-rgb8-unorm-srgb',
  ETC2_RGB8A1_UNORM = 'etc2-rgb8a1-unorm',
  ETC2_RGB8A1_UNORM_SRGB = 'etc2-rgb8a1-unorm-srgb',
  ETC2_RGBA8_UNORM = 'etc2-rgba8-unorm',
  ETC2_RGBA8_UNORM_SRGB = 'etc2-rgba8-unorm-srgb',
  EAC_R11_UNORM = 'eac-r11-unorm',
  EAC_R11_SNORM = 'eac-r11-snorm',
  EAC_RG11_UNORM = 'eac-rg11-unorm',
  EAC_RG11_SNORM = 'eac-rg11-snorm',

  // ASTC压缩格式
  ASTC_4X4_UNORM = 'astc-4x4-unorm',
  ASTC_4X4_UNORM_SRGB = 'astc-4x4-unorm-srgb',
  ASTC_5X4_UNORM = 'astc-5x4-unorm',
  ASTC_5X4_UNORM_SRGB = 'astc-5x4-unorm-srgb',
  ASTC_5X5_UNORM = 'astc-5x5-unorm',
  ASTC_5X5_UNORM_SRGB = 'astc-5x5-unorm-srgb',
  ASTC_6X5_UNORM = 'astc-6x5-unorm',
  ASTC_6X5_UNORM_SRGB = 'astc-6x5-unorm-srgb',
  ASTC_6X6_UNORM = 'astc-6x6-unorm',
  ASTC_6X6_UNORM_SRGB = 'astc-6x6-unorm-srgb',
  ASTC_8X5_UNORM = 'astc-8x5-unorm',
  ASTC_8X5_UNORM_SRGB = 'astc-8x5-unorm-srgb',
  ASTC_8X6_UNORM = 'astc-8x6-unorm',
  ASTC_8X6_UNORM_SRGB = 'astc-8x6-unorm-srgb',
  ASTC_8X8_UNORM = 'astc-8x8-unorm',
  ASTC_8X8_UNORM_SRGB = 'astc-8x8-unorm-srgb',
  ASTC_10X5_UNORM = 'astc-10x5-unorm',
  ASTC_10X5_UNORM_SRGB = 'astc-10x5-unorm-srgb',
  ASTC_10X6_UNORM = 'astc-10x6-unorm',
  ASTC_10X6_UNORM_SRGB = 'astc-10x6-unorm-srgb',
  ASTC_10X8_UNORM = 'astc-10x8-unorm',
  ASTC_10X8_UNORM_SRGB = 'astc-10x8-unorm-srgb',
  ASTC_10X10_UNORM = 'astc-10x10-unorm',
  ASTC_10X10_UNORM_SRGB = 'astc-10x10-unorm-srgb',
  ASTC_12X10_UNORM = 'astc-12x10-unorm',
  ASTC_12X10_UNORM_SRGB = 'astc-12x10-unorm-srgb',
  ASTC_12X12_UNORM = 'astc-12x12-unorm',
  ASTC_12X12_UNORM_SRGB = 'astc-12x12-unorm-srgb',
}

/**
 * 缓冲区用途统一定义
 */
export enum RHIBufferUsage {
  VERTEX = 'vertex',
  INDEX = 'index',
  UNIFORM = 'uniform',
  STORAGE = 'storage',
  INDIRECT = 'indirect',
  MAP_READ = 'map-read',
  MAP_WRITE = 'map-write',
  COPY_SRC = 'copy-src',
  COPY_DST = 'copy-dst',
}

/**
 * 纹理用途统一定义
 */
export enum RHITextureUsage {
  TEXTURE_BINDING = 'texture-binding',
  STORAGE_BINDING = 'storage-binding',
  RENDER_ATTACHMENT = 'render-attachment',
  COPY_SRC = 'copy-src',
  COPY_DST = 'copy-dst',
}

/**
 * 过滤模式统一定义
 */
export enum RHIFilterMode {
  Nearest = 'nearest',
  Linear = 'linear',
  NearestMipmapNearest = 'nearest-mipmap-nearest',
  LinearMipmapNearest = 'linear-mipmap-nearest',
  NearestMipmapLinear = 'nearest-mipmap-linear',
  LinearMipmapLinear = 'linear-mipmap-linear',
}

/**
 * 寻址模式统一定义
 */
export enum RHIAddressMode {
  Repeat = 'repeat',
  MirrorRepeat = 'mirror-repeat',
  ClampToEdge = 'clamp-to-edge',
  ClampToBorder = 'clamp-to-border',
}

/**
 * 混合操作统一定义
 */
export enum RHIBlendOperation {
  ADD = 0,
  SUBTRACT = 1,
  REVERSE_SUBTRACT = 2,
  MIN = 3,
  MAX = 4,
}

/**
 * 混合因子统一定义
 */
export enum RHIBlendFactor {
  Zero = 'zero',
  One = 'one',
  SrcColor = 'src-color',
  OneMinusSrcColor = 'one-minus-src-color',
  DstColor = 'dst-color',
  OneMinusDstColor = 'one-minus-dst-color',
  SrcAlpha = 'src-alpha',
  OneMinusSrcAlpha = 'one-minus-src-alpha',
  DstAlpha = 'dst-alpha',
  OneMinusDstAlpha = 'one-minus-dst-alpha',
  ConstantColor = 'constant-color',
  OneMinusConstantColor = 'one-minus-constant-color',
  ConstantAlpha = 'constant-alpha',
  OneMinusConstantAlpha = 'one-minus-constant-alpha',
  SrcAlphaSaturate = 'src-alpha-saturate',
}

/**
 * 比较函数统一定义
 */
export enum RHICompareFunction {
  NEVER = 0,
  LESS = 1,
  EQUAL = 2,
  LESS_EQUAL = 3,
  GREATER = 4,
  NOT_EQUAL = 5,
  GREATER_EQUAL = 6,
  ALWAYS = 7,
}

/**
 * 图元拓扑统一定义
 */
export enum RHIPrimitiveTopology {
  POINT_LIST = 0,
  LINE_LIST = 1,
  LINE_STRIP = 2,
  TRIANGLE_LIST = 3,
  TRIANGLE_STRIP = 4,
}

/**
 * 正面方向统一定义
 */
export enum RHIFrontFace {
  CW = 0,
  CCW = 1,
}

/**
 * 面剔除模式统一定义
 */
export enum RHICullMode {
  None = 'none',
  Front = 'front',
  Back = 'back',
  FrontAndBack = 'front-and-back',
}

/**
 * 索引格式统一定义
 */
export enum RHIIndexFormat {
  UINT16 = 'uint16',
  UINT32 = 'uint32',
}

/**
 * 顶点格式统一定义
 */
export enum RHIVertexFormat {
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

/**
 * 着色器阶段统一定义
 */
export enum RHIShaderStage {
  VERTEX = 'vertex',
  FRAGMENT = 'fragment',
  COMPUTE = 'compute',
  GEOMETRY = 'geometry',
  TESS_CONTROL = 'tess-control',
  TESS_EVALUATION = 'tess-evaluation',
  MESH = 'mesh',
  TASK = 'task',
}

/**
 * RHI特性标志统一定义
 */
export enum RHIFeatureFlags {
  DEPTH_TEXTURE = 'depth-texture',
  FLOAT_TEXTURE = 'float-texture',
  HALF_FLOAT_TEXTURE = 'half-float-texture',
  MULTIPLE_RENDER_TARGETS = 'multiple-render-targets',
  INSTANCED_DRAWING = 'instanced-drawing',
  ANISOTROPIC_FILTERING = 'anisotropic-filtering',
  BC_TEXTURE_COMPRESSION = 'bc-texture-compression',
  ETC2_TEXTURE_COMPRESSION = 'etc2-texture-compression',
  ASTC_TEXTURE_COMPRESSION = 'astc-texture-compression',
  COMPUTE_SHADER = 'compute-shader',
  STORAGE_TEXTURE = 'storage-texture',
  VERTEX_ARRAY_OBJECT = 'vertex-array-object',
  BLEND_OPERATION = 'blend-operation',
  INDIRECT_DRAWING = 'indirect-drawing',
  RAY_TRACING = 'ray-tracing',
  MESH_SHADER = 'mesh-shader',
}

/**
 * 顶点步进模式（RHI特有）
 */
export enum RHIVertexStepMode {
  VERTEX = 'vertex',
  INSTANCE = 'instance',
}

/**
 * 查询类型（RHI特有）
 */
export enum RHIQueryType {
  OCCLUSION = 'occlusion',
  TIMESTAMP = 'timestamp',
  PIPELINE_STATISTICS = 'pipeline-statistics',
}

//---------------------------------------------------------------------------------------------------------------------
// RHI特有的枚举（不与core重复的）
//---------------------------------------------------------------------------------------------------------------------

/**
 * 错误类型
 */
export enum RHIErrorType {
  /** 内部错误 */
  INTERNAL = 'internal',
  /** 验证错误 */
  VALIDATION = 'validation',
  /** 内存不足 */
  OUT_OF_MEMORY = 'out-of-memory',
  /** 设备丢失 */
  DEVICE_LOST = 'device-lost',
}

/**
 * 模板操作
 */
export enum RHIStencilOperation {
  /** 保持当前值 */
  KEEP = 'keep',
  /** 设置为零 */
  ZERO = 'zero',
  /** 设置为参考值 */
  REPLACE = 'replace',
  /** 增加并限制在范围内 */
  INCR_CLAMP = 'incr-clamp',
  /** 减少并限制在范围内 */
  DECR_CLAMP = 'decr-clamp',
  /** 按位反转 */
  INVERT = 'invert',
  /** 增加并环绕 */
  INCR_WRAP = 'incr-wrap',
  /** 减少并环绕 */
  DECR_WRAP = 'decr-wrap',
}

/**
 * 纹理类型
 */
export enum RHITextureType {
  /** 2D纹理 */
  TEXTURE_2D = '2d',
  /** 3D纹理 */
  TEXTURE_3D = '3d',
  /** 立方体纹理 */
  TEXTURE_CUBE = 'cube',
  /** 1D纹理 */
  TEXTURE_1D = '1d',
  /** 2D数组纹理 */
  TEXTURE_2D_ARRAY = '2d-array',
}

/**
 * 绑定组布局条目类型
 */
export enum RHIBindGroupLayoutEntryType {
  /** 统一缓冲区 */
  UNIFORM_BUFFER = 'uniform-buffer',
  /** 存储缓冲区 */
  STORAGE_BUFFER = 'storage-buffer',
  /** 只读存储缓冲区 */
  READONLY_STORAGE_BUFFER = 'readonly-storage-buffer',
  /** 采样器 */
  SAMPLER = 'sampler',
  /** 纹理 */
  TEXTURE = 'texture',
  /** 存储纹理 */
  STORAGE_TEXTURE = 'storage-texture',
}
