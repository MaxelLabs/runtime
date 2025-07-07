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
  UINT16 = 0,
  /** 32位无符号整数 */
  UINT32 = 1,
}

/**
 * 顶点格式
 */
export enum RHIVertexFormat {
  // 8位格式
  UINT8X2 = 0,
  UINT8X4 = 1,
  SINT8X2 = 2,
  SINT8X4 = 3,
  UNORM8X2 = 4,
  UNORM8X4 = 5,
  SNORM8X2 = 6,
  SNORM8X4 = 7,

  // 16位格式
  UINT16X2 = 8,
  UINT16X4 = 9,
  SINT16X2 = 10,
  SINT16X4 = 11,
  UNORM16X2 = 12,
  UNORM16X4 = 13,
  SNORM16X2 = 14,
  SNORM16X4 = 15,
  FLOAT16X2 = 16,
  FLOAT16X4 = 17,

  // 32位格式
  FLOAT32 = 18,
  FLOAT32X2 = 19,
  FLOAT32X3 = 20,
  FLOAT32X4 = 21,
  UINT32 = 22,
  UINT32X2 = 23,
  UINT32X3 = 24,
  UINT32X4 = 25,
  SINT32 = 26,
  SINT32X2 = 27,
  SINT32X3 = 28,
  SINT32X4 = 29,
}

/**
 * 顶点步进模式
 */
export enum RHIVertexStepMode {
  /** 每个顶点 */
  VERTEX = 0,
  /** 每个实例 */
  INSTANCE = 1,
}

/**
 * 查询类型
 */
export enum RHIQueryType {
  /** 遮挡查询 */
  OCCLUSION = 0,
  /** 时间戳查询 */
  TIMESTAMP = 1,
  /** 管线统计查询 */
  PIPELINE_STATISTICS = 2,
}

/**
 * RHI错误类型
 */
export enum RHIErrorType {
  /** 内部错误 */
  INTERNAL = 0,
  /** 验证错误 */
  VALIDATION = 1,
  /** 内存不足 */
  OUT_OF_MEMORY = 2,
  /** 设备丢失 */
  DEVICE_LOST = 3,
}

/**
 * RHI设备特性标志
 * 这些标志值可以按位组合
 */
export enum RHIFeatureFlags {
  /** 支持深度纹理 */
  DEPTH_TEXTURE = 0x1,
  /** 支持浮点纹理 */
  FLOAT_TEXTURE = 0x2,
  /** 支持半浮点纹理 */
  HALF_FLOAT_TEXTURE = 0x4,
  /** 支持多重渲染目标 */
  MULTIPLE_RENDER_TARGETS = 0x8,
  /** 支持实例化绘制 */
  INSTANCED_DRAWING = 0x10,
  /** 支持各向异性过滤 */
  ANISOTROPIC_FILTERING = 0x20,
  /** 支持BC格式压缩纹理 */
  BC_TEXTURE_COMPRESSION = 0x40,
  /** 支持ETC2/EAC格式压缩纹理 */
  ETC2_TEXTURE_COMPRESSION = 0x80,
  /** 支持ASTC格式压缩纹理 */
  ASTC_TEXTURE_COMPRESSION = 0x100,
  /** 支持计算着色器 */
  COMPUTE_SHADER = 0x200,
  /** 支持存储纹理 */
  STORAGE_TEXTURE = 0x400,
  /** 支持顶点数组对象 */
  VERTEX_ARRAY_OBJECT = 0x800,
  /** 支持混合操作 */
  BLEND_OPERATION = 0x1000,
  /** 支持间接绘制 */
  INDIRECT_DRAWING = 0x2000,
  /** 支持光线追踪 */
  RAY_TRACING = 0x4000,
  /** 支持网格着色器 */
  MESH_SHADER = 0x8000,
}

/**
 * 模板操作
 */
export enum RHIStencilOperation {
  /** 保持当前值 */
  KEEP = 0,
  /** 设置为零 */
  ZERO = 1,
  /** 设置为参考值 */
  REPLACE = 2,
  /** 增加并限制在范围内 */
  INCR_CLAMP = 3,
  /** 减少并限制在范围内 */
  DECR_CLAMP = 4,
  /** 按位反转 */
  INVERT = 5,
  /** 增加并环绕 */
  INCR_WRAP = 6,
  /** 减少并环绕 */
  DECR_WRAP = 7,
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
  R8_UNORM = 0,
  R8_SNORM = 1,
  R8_UINT = 2,
  R8_SINT = 3,

  // 16位格式
  R16_UINT = 4,
  R16_SINT = 5,
  R16_FLOAT = 6,
  RG8_UNORM = 7,
  RG8_SNORM = 8,
  RG8_UINT = 9,
  RG8_SINT = 10,

  // 32位格式
  R32_UINT = 11,
  R32_SINT = 12,
  R32_FLOAT = 13,
  RG16_UINT = 14,
  RG16_SINT = 15,
  RG16_FLOAT = 16,
  RGBA8_UNORM = 17,
  RGBA8_UNORM_SRGB = 18,
  RGBA8_SNORM = 19,
  RGBA8_UINT = 20,
  RGBA8_SINT = 21,
  BGRA8_UNORM = 22,
  BGRA8_UNORM_SRGB = 23,

  // 64位格式
  RG32_UINT = 24,
  RG32_SINT = 25,
  RG32_FLOAT = 26,
  RGBA16_UINT = 27,
  RGBA16_SINT = 28,
  RGBA16_FLOAT = 29,

  // 128位格式
  RGBA32_UINT = 30,
  RGBA32_SINT = 31,
  RGBA32_FLOAT = 32,

  // 深度/模板格式
  DEPTH16_UNORM = 33,
  DEPTH24_UNORM = 34,
  DEPTH32_FLOAT = 35,
  DEPTH24_UNORM_STENCIL8 = 36,
  DEPTH32_FLOAT_STENCIL8 = 37,

  // 压缩纹理格式
  BC1_RGBA_UNORM = 38,
  BC1_RGBA_UNORM_SRGB = 39,
  BC2_RGBA_UNORM = 40,
  BC2_RGBA_UNORM_SRGB = 41,
  BC3_RGBA_UNORM = 42,
  BC3_RGBA_UNORM_SRGB = 43,
  BC4_R_UNORM = 44,
  BC4_R_SNORM = 45,
  BC5_RG_UNORM = 46,
  BC5_RG_SNORM = 47,
  BC6H_RGB_UFLOAT = 48,
  BC6H_RGB_SFLOAT = 49,
  BC7_RGBA_UNORM = 50,
  BC7_RGBA_UNORM_SRGB = 51,

  // ASTC压缩格式
  ASTC_4x4_UNORM = 52,
  ASTC_4x4_UNORM_SRGB = 53,
  ASTC_5x5_UNORM = 54,
  ASTC_5x5_UNORM_SRGB = 55,
  ASTC_6x6_UNORM = 56,
  ASTC_6x6_UNORM_SRGB = 57,
  ASTC_8x8_UNORM = 58,
  ASTC_8x8_UNORM_SRGB = 59,
  ASTC_10x10_UNORM = 60,
  ASTC_10x10_UNORM_SRGB = 61,
  ASTC_12x12_UNORM = 62,
  ASTC_12x12_UNORM_SRGB = 63,

  // ETC2/EAC压缩格式
  ETC2_RGB8_UNORM = 64,
  ETC2_RGB8_UNORM_SRGB = 65,
  ETC2_RGB8A1_UNORM = 66,
  ETC2_RGB8A1_UNORM_SRGB = 67,
  ETC2_RGBA8_UNORM = 68,
  ETC2_RGBA8_UNORM_SRGB = 69,
  EAC_R11_UNORM = 70,
  EAC_R11_SNORM = 71,
  EAC_RG11_UNORM = 72,
  EAC_RG11_SNORM = 73,
}

/**
 * 绑定组布局条目类型
 */
export enum RHIBindGroupLayoutEntryType {
  /** 统一缓冲区 */
  UNIFORM_BUFFER = 0,
  /** 存储缓冲区 */
  STORAGE_BUFFER = 1,
  /** 只读存储缓冲区 */
  READONLY_STORAGE_BUFFER = 2,
  /** 采样器 */
  SAMPLER = 3,
  /** 纹理 */
  TEXTURE = 4,
  /** 存储纹理 */
  STORAGE_TEXTURE = 5,
}
