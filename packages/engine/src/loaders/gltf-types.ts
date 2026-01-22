/**
 * glTF 2.0 类型定义
 *
 * @packageDocumentation
 *
 * @remarks
 * 定义 glTF 2.0 规范中的所有类型接口。
 * 参考: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
 */

import type { EntityId } from '@maxellabs/core';
import type { IRHITexture } from '@maxellabs/specification';
import type { PBRMaterial } from '../materials/PBR-material';

// ========================================
// glTF Document Types
// ========================================

/**
 * glTF 文档根对象
 */
export interface GLTFDocument {
  asset: GLTFAsset;
  scene?: number;
  scenes?: GLTFScene[];
  nodes?: GLTFNode[];
  meshes?: GLTFMesh[];
  accessors?: GLTFAccessor[];
  bufferViews?: GLTFBufferView[];
  buffers?: GLTFBuffer[];
  materials?: GLTFMaterial[];
  textures?: GLTFTexture[];
  images?: GLTFImage[];
  samplers?: GLTFSampler[];
  animations?: GLTFAnimation[];
  skins?: GLTFSkin[];
  cameras?: GLTFCamera[];
  extensions?: Record<string, unknown>;
  extensionsUsed?: string[];
  extensionsRequired?: string[];
}

/**
 * 资产信息
 */
export interface GLTFAsset {
  version: string;
  generator?: string;
  copyright?: string;
  minVersion?: string;
}

/**
 * 场景
 */
export interface GLTFScene {
  name?: string;
  nodes?: number[];
  extensions?: Record<string, unknown>;
}

/**
 * 节点
 */
export interface GLTFNode {
  name?: string;
  children?: number[];
  mesh?: number;
  camera?: number;
  skin?: number;
  matrix?: number[];
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  weights?: number[];
  extensions?: {
    KHR_lights_punctual?: { light: number };
    [key: string]: unknown;
  };
}

/**
 * 网格
 */
export interface GLTFMesh {
  name?: string;
  primitives: GLTFPrimitive[];
  weights?: number[];
}

/**
 * 图元
 */
export interface GLTFPrimitive {
  attributes: {
    POSITION?: number;
    NORMAL?: number;
    TANGENT?: number;
    TEXCOORD_0?: number;
    TEXCOORD_1?: number;
    COLOR_0?: number;
    JOINTS_0?: number;
    WEIGHTS_0?: number;
    [key: string]: number | undefined;
  };
  indices?: number;
  material?: number;
  mode?: GLTFPrimitiveMode;
  targets?: Array<{
    POSITION?: number;
    NORMAL?: number;
    TANGENT?: number;
    [key: string]: number | undefined;
  }>;
}

/**
 * 图元模式
 */
export enum GLTFPrimitiveMode {
  POINTS = 0,
  LINES = 1,
  LINE_LOOP = 2,
  LINE_STRIP = 3,
  TRIANGLES = 4,
  TRIANGLE_STRIP = 5,
  TRIANGLE_FAN = 6,
}

/**
 * Accessor
 */
export interface GLTFAccessor {
  bufferView?: number;
  byteOffset?: number;
  componentType: GLTFComponentType;
  normalized?: boolean;
  count: number;
  type: GLTFAccessorType;
  max?: number[];
  min?: number[];
  sparse?: GLTFAccessorSparse;
  name?: string;
}

/**
 * 组件类型
 */
export enum GLTFComponentType {
  BYTE = 5120,
  UNSIGNED_BYTE = 5121,
  SHORT = 5122,
  UNSIGNED_SHORT = 5123,
  UNSIGNED_INT = 5125,
  FLOAT = 5126,
}

/**
 * Accessor 类型
 */
export type GLTFAccessorType = 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4';

/**
 * 稀疏 Accessor
 */
export interface GLTFAccessorSparse {
  count: number;
  indices: {
    bufferView: number;
    byteOffset?: number;
    componentType: GLTFComponentType;
  };
  values: {
    bufferView: number;
    byteOffset?: number;
  };
}

/**
 * BufferView
 */
export interface GLTFBufferView {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
  target?: GLTFBufferViewTarget;
  name?: string;
}

/**
 * BufferView 目标
 */
export enum GLTFBufferViewTarget {
  ARRAY_BUFFER = 34962,
  ELEMENT_ARRAY_BUFFER = 34963,
}

/**
 * Buffer
 */
export interface GLTFBuffer {
  uri?: string;
  byteLength: number;
  name?: string;
}

/**
 * 材质
 */
export interface GLTFMaterial {
  name?: string;
  pbrMetallicRoughness?: {
    baseColorFactor?: [number, number, number, number];
    baseColorTexture?: GLTFTextureInfo;
    metallicFactor?: number;
    roughnessFactor?: number;
    metallicRoughnessTexture?: GLTFTextureInfo;
  };
  normalTexture?: GLTFNormalTextureInfo;
  occlusionTexture?: GLTFOcclusionTextureInfo;
  emissiveTexture?: GLTFTextureInfo;
  emissiveFactor?: [number, number, number];
  alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND';
  alphaCutoff?: number;
  doubleSided?: boolean;
  extensions?: {
    KHR_materials_unlit?: Record<string, never>;
    [key: string]: unknown;
  };
}

/**
 * 纹理信息
 */
export interface GLTFTextureInfo {
  index: number;
  texCoord?: number;
  extensions?: Record<string, unknown>;
}

/**
 * 法线纹理信息
 */
export interface GLTFNormalTextureInfo extends GLTFTextureInfo {
  scale?: number;
}

/**
 * 遮蔽纹理信息
 */
export interface GLTFOcclusionTextureInfo extends GLTFTextureInfo {
  strength?: number;
}

/**
 * 纹理
 */
export interface GLTFTexture {
  sampler?: number;
  source?: number;
  name?: string;
  extensions?: Record<string, unknown>;
}

/**
 * 图像
 */
export interface GLTFImage {
  uri?: string;
  mimeType?: string;
  bufferView?: number;
  name?: string;
}

/**
 * 采样器
 */
export interface GLTFSampler {
  magFilter?: GLTFMagFilter;
  minFilter?: GLTFMinFilter;
  wrapS?: GLTFWrapMode;
  wrapT?: GLTFWrapMode;
  name?: string;
}

/**
 * 放大过滤器
 */
export enum GLTFMagFilter {
  NEAREST = 9728,
  LINEAR = 9729,
}

/**
 * 缩小过滤器
 */
export enum GLTFMinFilter {
  NEAREST = 9728,
  LINEAR = 9729,
  NEAREST_MIPMAP_NEAREST = 9984,
  LINEAR_MIPMAP_NEAREST = 9985,
  NEAREST_MIPMAP_LINEAR = 9986,
  LINEAR_MIPMAP_LINEAR = 9987,
}

/**
 * 纹理环绕模式
 */
export enum GLTFWrapMode {
  CLAMP_TO_EDGE = 33071,
  MIRRORED_REPEAT = 33648,
  REPEAT = 10497,
}

/**
 * 动画
 */
export interface GLTFAnimation {
  name?: string;
  channels: GLTFAnimationChannel[];
  samplers: GLTFAnimationSampler[];
}

/**
 * 动画通道
 */
export interface GLTFAnimationChannel {
  sampler: number;
  target: {
    node?: number;
    path: 'translation' | 'rotation' | 'scale' | 'weights';
  };
}

/**
 * 动画采样器
 */
export interface GLTFAnimationSampler {
  input: number;
  output: number;
  interpolation?: 'LINEAR' | 'STEP' | 'CUBICSPLINE';
}

/**
 * 骨骼
 */
export interface GLTFSkin {
  name?: string;
  inverseBindMatrices?: number;
  skeleton?: number;
  joints: number[];
}

/**
 * 相机
 */
export interface GLTFCamera {
  name?: string;
  type: 'perspective' | 'orthographic';
  perspective?: {
    aspectRatio?: number;
    yfov: number;
    zfar?: number;
    znear: number;
  };
  orthographic?: {
    xmag: number;
    ymag: number;
    zfar: number;
    znear: number;
  };
}

// ========================================
// Loader Result Types
// ========================================

/**
 * 网格数据
 */
export interface MeshData {
  /** 顶点位置 */
  positions: Float32Array;
  /** 法线 */
  normals?: Float32Array;
  /** 纹理坐标 */
  uvs?: Float32Array;
  /** 第二套 UV */
  uvs2?: Float32Array;
  /** 顶点颜色 */
  colors?: Float32Array;
  /** 切线 */
  tangents?: Float32Array;
  /** 索引 */
  indices?: Uint16Array | Uint32Array;
  /** 骨骼权重 */
  weights?: Float32Array;
  /** 骨骼索引 */
  joints?: Uint16Array;
  /** 变形目标 */
  morphTargets?: MorphTarget[];
  /** 材质索引 */
  materialIndex?: number;
}

/**
 * 变形目标
 */
export interface MorphTarget {
  positions?: Float32Array;
  normals?: Float32Array;
  tangents?: Float32Array;
}

/**
 * 动画片段
 */
export interface AnimationClip {
  name: string;
  duration: number;
  channels: AnimationChannelData[];
}

/**
 * 动画通道数据
 */
export interface AnimationChannelData {
  targetNode: number;
  targetPath: 'translation' | 'rotation' | 'scale' | 'weights';
  sampler: AnimationSamplerData;
}

/**
 * 动画采样器数据
 */
export interface AnimationSamplerData {
  input: Float32Array;
  output: Float32Array;
  interpolation: 'LINEAR' | 'STEP' | 'CUBICSPLINE';
}

/**
 * 骨骼数据
 */
export interface SkinData {
  name?: string;
  inverseBindMatrices?: Float32Array;
  skeleton?: number;
  joints: number[];
}

/**
 * glTF 加载结果
 */
export interface GLTFResult {
  /** 默认场景根实体 */
  scene: EntityId;
  /** 所有场景 */
  scenes: EntityId[];
  /** 网格数据映射 */
  meshes: Map<number, MeshData[]>;
  /** 材质映射 */
  materials: Map<number, PBRMaterial>;
  /** 纹理映射 */
  textures: Map<number, IRHITexture>;
  /** 动画片段 */
  animations: AnimationClip[];
  /** 相机实体 */
  cameras: EntityId[];
  /** 光源实体 */
  lights: EntityId[];
  /** 骨骼数据 */
  skins: SkinData[];
  /** 原始 glTF JSON */
  json: GLTFDocument;
  /** 节点到实体的映射 */
  nodeEntityMap: Map<number, EntityId>;
}

// ========================================
// Loader Config Types
// ========================================

/**
 * glTF 加载器配置
 */
export interface GLTFLoaderConfig {
  /** 是否立即加载纹理 默认 true */
  loadTextures?: boolean;
  /** 是否生成切线 默认 true */
  generateTangents?: boolean;
  /** 是否计算包围盒 默认 true */
  computeBounds?: boolean;
  /** Draco 解码器路径 */
  dracoDecoderPath?: string;
  /** KTX2 转码器路径 */
  ktx2TranscoderPath?: string;
}

/**
 * glTF 加载选项（用于 Engine.loadGLTF）
 */
export interface GLTFLoadOptions {
  /** 进度回调 */
  onProgress?: (progress: GLTFLoadProgress) => void;
  /** 加载器配置 */
  config?: GLTFLoaderConfig;
}

/**
 * 加载进度回调
 */
export interface GLTFLoadProgress {
  loaded: number;
  total: number;
  stage: 'json' | 'buffers' | 'textures' | 'meshes' | 'materials' | 'scene';
}

// ========================================
// GLB Types
// ========================================

/**
 * GLB 头部
 */
export interface GLBHeader {
  magic: number;
  version: number;
  length: number;
}

/**
 * GLB Chunk
 */
export interface GLBChunk {
  chunkLength: number;
  chunkType: number;
  chunkData: ArrayBuffer;
}

/**
 * GLB 解析结果
 */
export interface GLBParseResult {
  json: GLTFDocument;
  binaryBuffer?: ArrayBuffer;
}

// ========================================
// Constants
// ========================================

/** GLB Magic Number: 'glTF' */
export const GLB_MAGIC = 0x46546c67;

/** GLB JSON Chunk Type */
export const GLB_CHUNK_TYPE_JSON = 0x4e4f534a;

/** GLB Binary Chunk Type */
export const GLB_CHUNK_TYPE_BIN = 0x004e4942;
