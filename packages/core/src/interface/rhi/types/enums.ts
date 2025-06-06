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
