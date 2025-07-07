/**
 * 缓冲区用途标志
 * 这些标志值可以按位组合
 */
export enum RHIBufferUsage {
  /** 用作顶点缓冲区 */
  VERTEX = 0x1,
  /** 用作索引缓冲区 */
  INDEX = 0x2,
  /** 用作统一缓冲区 */
  UNIFORM = 0x4,
  /** 用作存储缓冲区 */
  STORAGE = 0x8,
  /** 用作间接命令缓冲区 */
  INDIRECT = 0x10,
  /** 缓冲区可以被映射以供CPU读取 */
  MAP_READ = 0x20,
  /** 缓冲区可以被映射以供CPU写入 */
  MAP_WRITE = 0x40,
  /** 缓冲区可以作为复制操作的源 */
  COPY_SRC = 0x80,
  /** 缓冲区可以作为复制操作的目标 */
  COPY_DST = 0x100,
}

export enum RHIShaderBindingType {
  /** 统一缓冲区 */
  UNIFORM_BUFFER = 'uniform-buffer',
  /** 存储缓冲区 */
  STORAGE_BUFFER = 'storage-buffer',
  /** 采样器 */
  SAMPLER = 'sampler',
}

/**
 * 着色器阶段标志
 * 这些标志值可以按位组合
 */
export enum RHIShaderStage {
  /** 顶点着色器 */
  VERTEX = 0x1,
  /** 片段着色器 */
  FRAGMENT = 0x2,
  /** 计算着色器 */
  COMPUTE = 0x4,
  /** 几何着色器(仅限WebGL) */
  GEOMETRY = 0x8,
  /** 曲面细分控制着色器 */
  TESS_CONTROL = 0x10,
  /** 曲面细分评估着色器 */
  TESS_EVALUATION = 0x20,
  /** 网格着色器 */
  MESH = 0x40,
  /** 任务着色器 */
  TASK = 0x80,
}
