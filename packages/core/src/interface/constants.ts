/**
 * 图形API常量定义文件
 * 包含渲染相关的所有枚举类型和常量
 */

/**
 * 渲染API类型
 */
export enum RenderAPIType {
  WEBGL1 = 'webgl1',
  WEBGL2 = 'webgl2',
  WEBGPU = 'webgpu'
}

/**
 * 缓冲区类型
 */
export enum BufferType {
  VERTEX = 0x8892,    // WebGL: gl.ARRAY_BUFFER
  INDEX = 0x8893,     // WebGL: gl.ELEMENT_ARRAY_BUFFER
  UNIFORM = 0x8A11,   // WebGL: gl.UNIFORM_BUFFER
  STORAGE = 0x90D2    // WebGL2: gl.SHADER_STORAGE_BUFFER
}

/**
 * 缓冲区使用方式
 */
export enum BufferUsage {
  STATIC = 0x88E4,    // WebGL: gl.STATIC_DRAW
  DYNAMIC = 0x88E8,   // WebGL: gl.DYNAMIC_DRAW
  STREAM = 0x88E0     // WebGL: gl.STREAM_DRAW
}

/**
 * 图元绘制模式
 */
export enum PrimitiveType {
  POINTS = 0x0000,          // WebGL: gl.POINTS
  LINES = 0x0001,           // WebGL: gl.LINES
  LINE_LOOP = 0x0002,       // WebGL: gl.LINE_LOOP
  LINE_STRIP = 0x0003,      // WebGL: gl.LINE_STRIP
  TRIANGLES = 0x0004,       // WebGL: gl.TRIANGLES
  TRIANGLE_STRIP = 0x0005,  // WebGL: gl.TRIANGLE_STRIP
  TRIANGLE_FAN = 0x0006     // WebGL: gl.TRIANGLE_FAN
}

/**
 * 纹理格式
 */
export enum TextureFormat {
  // 标准格式
  RGB = 0x1907,             // WebGL: gl.RGB
  RGBA = 0x1908,            // WebGL: gl.RGBA
  ALPHA = 0x1906,           // WebGL: gl.ALPHA
  LUMINANCE = 0x1909,       // WebGL: gl.LUMINANCE
  LUMINANCE_ALPHA = 0x190A, // WebGL: gl.LUMINANCE_ALPHA
  
  // 深度/模板格式
  DEPTH = 0x1902,           // WebGL: gl.DEPTH_COMPONENT
  DEPTH_STENCIL = 0x84F9,   // WebGL: gl.DEPTH_STENCIL
  
  // WebGL2/扩展支持的格式
  RGBA32F = 0x8814,         // Float32 RGBA
  RGB32F = 0x8815,          // Float32 RGB
  RGBA16F = 0x881A,         // Float16 RGBA
  RGB16F = 0x881B,          // Float16 RGB
  R32F = 0x822E,            // Float32 R
  R16F = 0x822D,            // Float16 R
  R8 = 0x8229,              // UInt8 R
  RG8 = 0x822B,             // UInt8 RG
  RG16F = 0x822F,           // Float16 RG
  RG32F = 0x8230,           // Float32 RG
  
  // 压缩格式
  COMPRESSED_RGB_S3TC_DXT1 = 0x83F0,
  COMPRESSED_RGBA_S3TC_DXT1 = 0x83F1,
  COMPRESSED_RGBA_S3TC_DXT3 = 0x83F2,
  COMPRESSED_RGBA_S3TC_DXT5 = 0x83F3
}

/**
 * 纹理过滤模式
 */
export enum TextureFilter {
  NEAREST = 0x2600,                // WebGL: gl.NEAREST
  LINEAR = 0x2601,                 // WebGL: gl.LINEAR
  NEAREST_MIPMAP_NEAREST = 0x2700, // WebGL: gl.NEAREST_MIPMAP_NEAREST
  LINEAR_MIPMAP_NEAREST = 0x2701,  // WebGL: gl.LINEAR_MIPMAP_NEAREST
  NEAREST_MIPMAP_LINEAR = 0x2702,  // WebGL: gl.NEAREST_MIPMAP_LINEAR
  LINEAR_MIPMAP_LINEAR = 0x2703    // WebGL: gl.LINEAR_MIPMAP_LINEAR
}

/**
 * 纹理类型
 */
export enum TextureType {
  TEXTURE_2D = 0x0DE1,       // WebGL: gl.TEXTURE_2D
  TEXTURE_CUBE_MAP = 0x8513, // WebGL: gl.TEXTURE_CUBE_MAP
  TEXTURE_3D = 0x806F,       // WebGL2: gl.TEXTURE_3D
  TEXTURE_2D_ARRAY = 0x8C1A  // WebGL2: gl.TEXTURE_2D_ARRAY
}

/**
 * 纹理用途
 */
export enum TextureUsage {
  SAMPLED = 0,       // 用于采样(着色器读取)
  RENDER_TARGET = 1, // 用作渲染目标
  STORAGE = 2,       // 用于存储(计算着色器读写)
  DEPTH_STENCIL = 3  // 用作深度/模板附件
}

/**
 * 纹理环绕模式
 */
export enum TextureAddressMode {
  REPEAT = 0x2901,          // WebGL: gl.REPEAT
  CLAMP_TO_EDGE = 0x812F,   // WebGL: gl.CLAMP_TO_EDGE
  MIRRORED_REPEAT = 0x8370  // WebGL: gl.MIRRORED_REPEAT
}

/**
 * 混合因子
 */
export enum BlendFactor {
  ZERO = 0,                      // WebGL: gl.ZERO
  ONE = 1,                       // WebGL: gl.ONE
  SRC_COLOR = 0x0300,            // WebGL: gl.SRC_COLOR
  ONE_MINUS_SRC_COLOR = 0x0301,  // WebGL: gl.ONE_MINUS_SRC_COLOR
  DST_COLOR = 0x0306,            // WebGL: gl.DST_COLOR
  ONE_MINUS_DST_COLOR = 0x0307,  // WebGL: gl.ONE_MINUS_DST_COLOR
  SRC_ALPHA = 0x0302,            // WebGL: gl.SRC_ALPHA
  ONE_MINUS_SRC_ALPHA = 0x0303,  // WebGL: gl.ONE_MINUS_SRC_ALPHA
  DST_ALPHA = 0x0304,            // WebGL: gl.DST_ALPHA
  ONE_MINUS_DST_ALPHA = 0x0305,  // WebGL: gl.ONE_MINUS_DST_ALPHA
  CONSTANT_COLOR = 0x8001,       // WebGL: gl.CONSTANT_COLOR
  ONE_MINUS_CONSTANT_COLOR = 0x8002, // WebGL: gl.ONE_MINUS_CONSTANT_COLOR
  CONSTANT_ALPHA = 0x8003,       // WebGL: gl.CONSTANT_ALPHA
  ONE_MINUS_CONSTANT_ALPHA = 0x8004 // WebGL: gl.ONE_MINUS_CONSTANT_ALPHA
}

/**
 * 混合方程
 */
export enum BlendEquation {
  ADD = 0x8006,              // WebGL: gl.FUNC_ADD
  SUBTRACT = 0x800A,         // WebGL: gl.FUNC_SUBTRACT
  REVERSE_SUBTRACT = 0x800B, // WebGL: gl.FUNC_REVERSE_SUBTRACT
  MIN = 0x8007,              // WebGL: gl.MIN_EXT
  MAX = 0x8008               // WebGL: gl.MAX_EXT
}

/**
 * 剔除模式
 */
export enum CullMode {
  NONE = 0,
  FRONT = 0x0404,  // WebGL: gl.FRONT
  BACK = 0x0405,   // WebGL: gl.BACK
  FRONT_AND_BACK = 0x0408  // WebGL: gl.FRONT_AND_BACK
}

/**
 * 比较函数
 */
export enum CompareFunc {
  NEVER = 0x0200,    // WebGL: gl.NEVER
  LESS = 0x0201,     // WebGL: gl.LESS
  EQUAL = 0x0202,    // WebGL: gl.EQUAL
  LEQUAL = 0x0203,   // WebGL: gl.LEQUAL
  GREATER = 0x0204,  // WebGL: gl.GREATER
  NOTEQUAL = 0x0205, // WebGL: gl.NOTEQUAL
  GEQUAL = 0x0206,   // WebGL: gl.GEQUAL
  ALWAYS = 0x0207    // WebGL: gl.ALWAYS
}

/**
 * 着色器类型
 */
export enum ShaderType {
  VERTEX = 0x8B31,   // WebGL: gl.VERTEX_SHADER
  FRAGMENT = 0x8B30, // WebGL: gl.FRAGMENT_SHADER
  COMPUTE = 0x91B9   // WebGL2 (with extension): gl.COMPUTE_SHADER
}

/**
 * 纹理单元
 */
export enum TextureUnit {
  TEXTURE0 = 0x84C0,  // WebGL: gl.TEXTURE0
  TEXTURE1 = 0x84C1,  // WebGL: gl.TEXTURE1
  TEXTURE2 = 0x84C2,  // WebGL: gl.TEXTURE2
  TEXTURE3 = 0x84C3,  // WebGL: gl.TEXTURE3
  TEXTURE4 = 0x84C4,  // WebGL: gl.TEXTURE4
  TEXTURE5 = 0x84C5,  // WebGL: gl.TEXTURE5
  TEXTURE6 = 0x84C6,  // WebGL: gl.TEXTURE6
  TEXTURE7 = 0x84C7,  // WebGL: gl.TEXTURE7
  TEXTURE8 = 0x84C8,  // WebGL: gl.TEXTURE8
  TEXTURE9 = 0x84C9,  // WebGL: gl.TEXTURE9
  TEXTURE10 = 0x84CA, // WebGL: gl.TEXTURE10
  TEXTURE11 = 0x84CB, // WebGL: gl.TEXTURE11
  TEXTURE12 = 0x84CC, // WebGL: gl.TEXTURE12
  TEXTURE13 = 0x84CD, // WebGL: gl.TEXTURE13
  TEXTURE14 = 0x84CE, // WebGL: gl.TEXTURE14
  TEXTURE15 = 0x84CF  // WebGL: gl.TEXTURE15
}

/**
 * 深度掩码
 */
export enum DepthMask {
  FALSE = 0,
  TRUE = 1
}

/**
 * 着色模型
 */
export enum ShadingModel {
  FLAT = 'flat',
  SMOOTH = 'smooth'
}

/**
 * 材质类型
 */
export enum MaterialType {
  UNLIT = 'unlit',
  LAMBERT = 'lambert',
  PHONG = 'phong',
  PBR = 'pbr',
  CUSTOM = 'custom'
}

/**
 * 光照类型
 */
export enum LightType {
  DIRECTIONAL = 'directional',
  POINT = 'point',
  SPOT = 'spot',
  AREA = 'area',
  AMBIENT = 'ambient'
}

/**
 * 阴影类型
 */
export enum ShadowType {
  NONE = 'none',
  HARD = 'hard',
  PCF = 'pcf',
  VSM = 'vsm'
}

/**
 * 渲染通道类型
 */
export enum RenderPassType {
  FORWARD = 'forward',
  DEFERRED = 'deferred',
  SHADOW = 'shadow',
  POST_PROCESS = 'post-process',
  CUSTOM = 'custom'
}

/**
 * 渲染队列
 */
export enum RenderQueue {
  BACKGROUND = 1000,
  GEOMETRY = 2000,
  ALPHA_TEST = 2450,
  TRANSPARENT = 3000,
  OVERLAY = 4000
} 