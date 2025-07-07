/**
 * rhiEnums.ts
 * 包含所有RHI相关的枚举定义。
 */

//---------------------------------------------------------------------------------------------------------------------
// 枚举 (Enums)
//---------------------------------------------------------------------------------------------------------------------

/**
 * 索引格式
 */
export enum RHIIndexFormat {
  /** 16位无符号整数 */
  UINT16 = 'uint16',
  /** 32位无符号整数 */
  UINT32 = 'uint32',
}

/**
 * 顶点格式
 */
export enum RHIVertexFormat {
  // 8位格式
  UINT8X2 = 'uint8x2',
  UINT8X4 = 'uint8x4',
  SINT8X2 = 'sint8x2',
  SINT8X4 = 'sint8x4',
  UNORM8X2 = 'unorm8x2',
  UNORM8X4 = 'unorm8x4',
  SNORM8X2 = 'snorm8x2',
  SNORM8X4 = 'snorm8x4',

  // 16位格式
  UINT16X2 = 'uint16x2',
  UINT16X4 = 'uint16x4',
  SINT16X2 = 'sint16x2',
  SINT16X4 = 'sint16x4',
  UNORM16X2 = 'unorm16x2',
  UNORM16X4 = 'unorm16x4',
  SNORM16X2 = 'snorm16x2',
  SNORM16X4 = 'snorm16x4',
  FLOAT16X2 = 'float16x2',
  FLOAT16X4 = 'float16x4',

  // 32位格式
  FLOAT32 = 'float32',
  FLOAT32X2 = 'float32x2',
  FLOAT32X3 = 'float32x3',
  FLOAT32X4 = 'float32x4',
  UINT32 = 'uint32',
  UINT32X2 = 'uint32x2',
  UINT32X3 = 'uint32x3',
  UINT32X4 = 'uint32x4',
  SINT32 = 'sint32',
  SINT32X2 = 'sint32x2',
  SINT32X3 = 'sint32x3',
  SINT32X4 = 'sint32x4',
}

/**
 * 顶点步进模式
 */
export enum RHIVertexStepMode {
  /** 每个顶点 */
  VERTEX = 'vertex',
  /** 每个实例 */
  INSTANCE = 'instance',
}

/**
 * 查询类型
 */
export enum RHIQueryType {
  /** 遮挡查询 */
  OCCLUSION = 'occlusion',
  /** 时间戳查询 */
  TIMESTAMP = 'timestamp',
  /** 管线统计查询 */
  PIPELINE_STATISTICS = 'pipeline-statistics',
}

/**
 * RHI错误类型
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
 * RHI设备特性标志
 * 这些标志值可以按位组合
 */
export enum RHIFeatureFlags {
  /** 支持深度纹理 */
  DEPTH_TEXTURE = 'depth-texture',
  /** 支持浮点纹理 */
  FLOAT_TEXTURE = 'float-texture',
  /** 支持半浮点纹理 */
  HALF_FLOAT_TEXTURE = 'half-float-texture',
  /** 支持多重渲染目标 */
  MULTIPLE_RENDER_TARGETS = 'multiple-render-targets',
  /** 支持实例化绘制 */
  INSTANCED_DRAWING = 'instanced-drawing',
  /** 支持各向异性过滤 */
  ANISOTROPIC_FILTERING = 'anisotropic-filtering',
  /** 支持BC格式压缩纹理 */
  BC_TEXTURE_COMPRESSION = 'bc-texture-compression',
  /** 支持ETC2/EAC格式压缩纹理 */
  ETC2_TEXTURE_COMPRESSION = 'etc2-texture-compression',
  /** 支持ASTC格式压缩纹理 */
  ASTC_TEXTURE_COMPRESSION = 'astc-texture-compression',
  /** 支持计算着色器 */
  COMPUTE_SHADER = 'compute-shader',
  /** 支持存储纹理 */
  STORAGE_TEXTURE = 'storage-texture',
  /** 支持顶点数组对象 */
  VERTEX_ARRAY_OBJECT = 'vertex-array-object',
  /** 支持混合操作 */
  BLEND_OPERATION = 'blend-operation',
  /** 支持间接绘制 */
  INDIRECT_DRAWING = 'indirect-drawing',
  /** 支持光线追踪 */
  RAY_TRACING = 'ray-tracing',
  /** 支持网格着色器 */
  MESH_SHADER = 'mesh-shader',
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

// /**
//  * 图元类型
//  */
// export enum RHIPrimitiveType {
//   /** 点列表 */
//   POINT_LIST = 0,
//   /** 线列表 */
//   LINE_LIST = 1,
//   /** 线条带 */
//   LINE_STRIP = 2,
//   /** 三角形列表 */
//   TRIANGLE_LIST = 3,
//   /** 三角形条带 */
//   TRIANGLE_STRIP = 4,
// }

/**
 * 纹理格式
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
  BC6H_RGB_SFLOAT = 'bc6h-rgb-sfloat',
  BC7_RGBA_UNORM = 'bc7-rgba-unorm',
  BC7_RGBA_UNORM_SRGB = 'bc7-rgba-unorm-srgb',

  // ASTC压缩格式
  ASTC_4x4_UNORM = 'astc-4x4-unorm',
  ASTC_4x4_UNORM_SRGB = 'astc-4x4-unorm-srgb',
  ASTC_5x5_UNORM = 'astc-5x5-unorm',
  ASTC_5x5_UNORM_SRGB = 'astc-5x5-unorm-srgb',
  ASTC_6x6_UNORM = 'astc-6x6-unorm',
  ASTC_6x6_UNORM_SRGB = 'astc-6x6-unorm-srgb',
  ASTC_8x8_UNORM = 'astc-8x8-unorm',
  ASTC_8x8_UNORM_SRGB = 'astc-8x8-unorm-srgb',
  ASTC_10x10_UNORM = 'astc-10x10-unorm',
  ASTC_10x10_UNORM_SRGB = 'astc-10x10-unorm-srgb',
  ASTC_12x12_UNORM = 'astc-12x12-unorm',
  ASTC_12x12_UNORM_SRGB = 'astc-12x12-unorm-srgb',

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
}

/**
 * 缓冲区用途标志
 * 这些标志值可以按位组合
 */
export enum RHIBufferUsage {
  /** 用作顶点缓冲区 */
  VERTEX = 'vertex',
  /** 用作索引缓冲区 */
  INDEX = 'index',
  /** 用作统一缓冲区 */
  UNIFORM = 'uniform',
  /** 用作存储缓冲区 */
  STORAGE = 'storage',
  /** 用作间接命令缓冲区 */
  INDIRECT = 'indirect',
  /** 缓冲区可以被映射以供CPU读取 */
  MAP_READ = 'map-read',
  /** 缓冲区可以被映射以供CPU写入 */
  MAP_WRITE = 'map-write',
  /** 缓冲区可以作为复制操作的源 */
  COPY_SRC = 'copy-src',
  /** 缓冲区可以作为复制操作的目标 */
  COPY_DST = 'copy-dst',
}

/**
 * 着色器阶段标志
 * 这些标志值可以按位组合
 */
export enum RHIShaderStage {
  /** 顶点着色器 */
  VERTEX = 'vertex',
  /** 片段着色器 */
  FRAGMENT = 'fragment',
  /** 计算着色器 */
  COMPUTE = 'compute',
  /** 几何着色器(仅限WebGL) */
  GEOMETRY = 'geometry',
  /** 曲面细分控制着色器 */
  TESS_CONTROL = 'tess-control',
  /** 曲面细分评估着色器 */
  TESS_EVALUATION = 'tess-evaluation',
  /** 网格着色器 */
  MESH = 'mesh',
  /** 任务着色器 */
  TASK = 'task',
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
