/**
 * RHI渲染硬件接口枚举定义
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
  NEAREST = 'nearest',
  LINEAR = 'linear',
  NEAREST_MIPMAP_NEAREST = 'nearest-mipmap-nearest',
  LINEAR_MIPMAP_NEAREST = 'linear-mipmap-nearest',
  NEAREST_MIPMAP_LINEAR = 'nearest-mipmap-linear',
  LINEAR_MIPMAP_LINEAR = 'linear-mipmap-linear',
}

/**
 * 寻址模式统一定义
 */
export enum RHIAddressMode {
  REPEAT = 'repeat',
  MIRROR_REPEAT = 'mirror-repeat',
  CLAMP_TO_EDGE = 'clamp-to-edge',
  CLAMP_TO_BORDER = 'clamp-to-border',
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
  NONE = 'none',
  FRONT = 'front',
  BACK = 'back',
  FRONT_AND_BACK = 'front-and-back',
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
  UINT8x2 = 'uint8x2',
  UINT8x4 = 'uint8x4',
  SINT8x2 = 'sint8x2',
  SINT8x4 = 'sint8x4',
  UNORM8x2 = 'unorm8x2',
  UNORM8x4 = 'unorm8x4',
  SNORM8x2 = 'snorm8x2',
  SNORM8x4 = 'snorm8x4',
  UINT16x2 = 'uint16x2',
  UINT16x4 = 'uint16x4',
  SINT16x2 = 'sint16x2',
  SINT16x4 = 'sint16x4',
  UNORM16x2 = 'unorm16x2',
  UNORM16x4 = 'unorm16x4',
  SNORM16x2 = 'snorm16x2',
  SNORM16x4 = 'snorm16x4',
  FLOAT16x2 = 'float16x2',
  FLOAT16x4 = 'float16x4',
  FLOAT32 = 'float32',
  FLOAT32x2 = 'float32x2',
  FLOAT32x3 = 'float32x3',
  FLOAT32x4 = 'float32x4',
  UINT32 = 'uint32',
  UINT32x2 = 'uint32x2',
  UINT32x3 = 'uint32x3',
  UINT32x4 = 'uint32x4',
  SINT32 = 'sint32',
  SINT32x2 = 'sint32x2',
  SINT32x3 = 'sint32x3',
  SINT32x4 = 'sint32x4',
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
 * 使用位标志表示设备支持的特性
 *
 * @example
 * ```typescript
 * // 检查是否支持某个特性
 * if (device.info.features & RHIFeatureFlags.COMPUTE_SHADER) {
 *   // 使用计算着色器
 * }
 *
 * // 检查多个特性
 * const required = RHIFeatureFlags.INSTANCED_DRAWING | RHIFeatureFlags.UNIFORM_BUFFER;
 * if ((device.info.features & required) === required) {
 *   // 同时支持实例化绘制和 UBO
 * }
 * ```
 */
export enum RHIFeatureFlags {
  // ==================== 纹理相关特性 ====================
  /** 深度纹理支持 (WebGL: WEBGL_depth_texture) */
  DEPTH_TEXTURE = 1 << 0,
  /** 浮点纹理支持 (WebGL: OES_texture_float) */
  FLOAT_TEXTURE = 1 << 1,
  /** 半浮点纹理支持 (WebGL: OES_texture_half_float) */
  HALF_FLOAT_TEXTURE = 1 << 2,
  /** 浮点纹理线性过滤 (WebGL: OES_texture_float_linear) */
  FLOAT_TEXTURE_LINEAR = 1 << 3,

  // ==================== 渲染相关特性 ====================
  /** 多渲染目标支持 (WebGL: WEBGL_draw_buffers / WebGL2 原生) */
  MULTIPLE_RENDER_TARGETS = 1 << 4,
  /** 实例化绘制支持 (WebGL: ANGLE_instanced_arrays / WebGL2 原生) */
  INSTANCED_DRAWING = 1 << 5,
  /** 间接绘制支持 (WebGL2 + 扩展) */
  INDIRECT_DRAWING = 1 << 6,
  /** 多重间接绘制支持 (WebGL: WEBGL_multi_draw) */
  MULTI_DRAW_INDIRECT = 1 << 7,
  /** 各向异性过滤支持 (WebGL: EXT_texture_filter_anisotropic) */
  ANISOTROPIC_FILTERING = 1 << 8,

  // ==================== 纹理压缩格式 ====================
  /** BC(S3TC) 纹理压缩 (WebGL: WEBGL_compressed_texture_s3tc) */
  BC_TEXTURE_COMPRESSION = 1 << 9,
  /** ETC2 纹理压缩 (WebGL: WEBGL_compressed_texture_etc) */
  ETC2_TEXTURE_COMPRESSION = 1 << 10,
  /** ASTC 纹理压缩 (WebGL: WEBGL_compressed_texture_astc) */
  ASTC_TEXTURE_COMPRESSION = 1 << 11,

  // ==================== 着色器与缓冲区特性 ====================
  /** 计算着色器支持 (WebGPU / WebGL 不支持) */
  COMPUTE_SHADER = 1 << 12,
  /** 存储纹理支持 */
  STORAGE_TEXTURE = 1 << 13,
  /** 顶点数组对象支持 (WebGL: OES_vertex_array_object / WebGL2 原生) */
  VERTEX_ARRAY_OBJECT = 1 << 14,
  /** Uniform Buffer Object 支持 (WebGL2 原生) */
  UNIFORM_BUFFER = 1 << 15,
  /** 存储缓冲区支持 (SSBO, WebGPU / WebGL 不支持) */
  STORAGE_BUFFER = 1 << 16,

  // ==================== 混合与操作特性 ====================
  /** 高级混合操作支持 (WebGL: EXT_blend_minmax) */
  BLEND_OPERATION = 1 << 17,

  // ==================== 查询特性 ====================
  /** 遮挡查询支持 (WebGL2 原生) */
  OCCLUSION_QUERY = 1 << 18,
  /** 时间戳查询支持 (WebGPU / WebGL 不支持) */
  TIMESTAMP_QUERY = 1 << 19,

  // ==================== 高级特性 (WebGPU/未来) ====================
  /** 光线追踪支持 */
  RAY_TRACING = 1 << 20,
  /** 网格着色器支持 */
  MESH_SHADER = 1 << 21,
  /** 可变速率着色支持 */
  VARIABLE_RATE_SHADING = 1 << 22,
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

/**
 * Uniform 数据类型统一定义
 * 用于着色器 uniform 变量和 UBO 布局
 *
 * 命名遵循 WebGPU/GLSL 风格：
 * - 标量：FLOAT, INT, UINT, BOOL
 * - 向量：VEC2, VEC3, VEC4 (前缀 I/U/B 表示 int/uint/bool)
 * - 矩阵：MAT2, MAT3, MAT4 (MATCxR 表示 C 列 R 行)
 * - 采样器：SAMPLER_2D, SAMPLER_CUBE 等
 */
export enum RHIUniformType {
  // ==================== 标量类型 ====================
  /** 32位浮点数 */
  FLOAT = 'float',
  /** 32位有符号整数 */
  INT = 'int',
  /** 32位无符号整数 */
  UINT = 'uint',
  /** 布尔值（在 GPU 中占 4 字节） */
  BOOL = 'bool',

  // ==================== 浮点向量 ====================
  /** 2分量浮点向量 */
  VEC2 = 'vec2',
  /** 3分量浮点向量 */
  VEC3 = 'vec3',
  /** 4分量浮点向量 */
  VEC4 = 'vec4',

  // ==================== 整数向量 ====================
  /** 2分量有符号整数向量 */
  IVEC2 = 'ivec2',
  /** 3分量有符号整数向量 */
  IVEC3 = 'ivec3',
  /** 4分量有符号整数向量 */
  IVEC4 = 'ivec4',

  // ==================== 无符号整数向量 ====================
  /** 2分量无符号整数向量 */
  UVEC2 = 'uvec2',
  /** 3分量无符号整数向量 */
  UVEC3 = 'uvec3',
  /** 4分量无符号整数向量 */
  UVEC4 = 'uvec4',

  // ==================== 布尔向量 ====================
  /** 2分量布尔向量 */
  BVEC2 = 'bvec2',
  /** 3分量布尔向量 */
  BVEC3 = 'bvec3',
  /** 4分量布尔向量 */
  BVEC4 = 'bvec4',

  // ==================== 方阵矩阵 ====================
  /** 2x2 浮点矩阵 */
  MAT2 = 'mat2',
  /** 3x3 浮点矩阵 */
  MAT3 = 'mat3',
  /** 4x4 浮点矩阵 */
  MAT4 = 'mat4',

  // ==================== 非方阵矩阵 ====================
  /** 2列3行 浮点矩阵 */
  MAT2X3 = 'mat2x3',
  /** 2列4行 浮点矩阵 */
  MAT2X4 = 'mat2x4',
  /** 3列2行 浮点矩阵 */
  MAT3X2 = 'mat3x2',
  /** 3列4行 浮点矩阵 */
  MAT3X4 = 'mat3x4',
  /** 4列2行 浮点矩阵 */
  MAT4X2 = 'mat4x2',
  /** 4列3行 浮点矩阵 */
  MAT4X3 = 'mat4x3',

  // ==================== 纹理采样器 ====================
  /** 2D 纹理采样器 */
  SAMPLER_2D = 'sampler2D',
  /** 3D 纹理采样器 */
  SAMPLER_3D = 'sampler3D',
  /** 立方体纹理采样器 */
  SAMPLER_CUBE = 'samplerCube',
  /** 2D 阴影纹理采样器 */
  SAMPLER_2D_SHADOW = 'sampler2DShadow',
  /** 2D 数组纹理采样器 */
  SAMPLER_2D_ARRAY = 'sampler2DArray',
  /** 立方体阴影纹理采样器 */
  SAMPLER_CUBE_SHADOW = 'samplerCubeShadow',
}
