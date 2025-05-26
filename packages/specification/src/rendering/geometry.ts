/**
 * Maxellabs 几何体渲染规范
 * 几何体和网格渲染相关类型定义
 */

import type { UsdPrim, UsdValue } from '../core/usd';

/**
 * 几何体基础接口
 */
export interface GeometryPrim extends UsdPrim {
  typeName: 'Geometry';
}

/**
 * 网格几何体
 */
export interface MeshGeometry extends GeometryPrim {
  attributes: {
    /**
     * 顶点位置
     */
    points: UsdValue; // Point3f[]
    /**
     * 面顶点索引
     */
    faceVertexIndices: UsdValue; // int[]
    /**
     * 每个面的顶点数
     */
    faceVertexCounts: UsdValue; // int[]
    /**
     * 法线
     */
    normals?: UsdValue; // Normal3f[]
    /**
     * UV 坐标
     */
    uvs?: UsdValue; // float2[]
    /**
     * 顶点颜色
     */
    colors?: UsdValue; // Color3f[]
    /**
     * 切线
     */
    tangents?: UsdValue; // Vector3f[]
    /**
     * 双切线
     */
    bitangents?: UsdValue; // Vector3f[]
  };
  /**
   * 几何体属性
   */
  properties: GeometryProperties;
  /**
   * 材质绑定
   */
  materialBinding?: MaterialBinding[];
  /**
   * LOD 配置
   */
  lodConfig?: LODConfiguration;
}

/**
 * 几何体属性
 */
export interface GeometryProperties {
  /**
   * 边界框
   */
  boundingBox: BoundingBox;
  /**
   * 边界球
   */
  boundingSphere: BoundingSphere;
  /**
   * 顶点数量
   */
  vertexCount: number;
  /**
   * 面数量
   */
  faceCount: number;
  /**
   * 三角形数量
   */
  triangleCount: number;
  /**
   * 几何体类型
   */
  geometryType: GeometryType;
  /**
   * 拓扑类型
   */
  topology: TopologyType;
  /**
   * 是否闭合
   */
  isClosed: boolean;
  /**
   * 是否有纹理坐标
   */
  hasUVs: boolean;
  /**
   * 是否有法线
   */
  hasNormals: boolean;
  /**
   * 是否有顶点颜色
   */
  hasVertexColors: boolean;
}

/**
 * 边界框
 */
export interface BoundingBox {
  /**
   * 最小点
   */
  min: [number, number, number];
  /**
   * 最大点
   */
  max: [number, number, number];
  /**
   * 中心点
   */
  center: [number, number, number];
  /**
   * 尺寸
   */
  size: [number, number, number];
}

/**
 * 边界球
 */
export interface BoundingSphere {
  /**
   * 中心点
   */
  center: [number, number, number];
  /**
   * 半径
   */
  radius: number;
}

/**
 * 几何体类型
 */
export enum GeometryType {
  /**
   * 网格
   */
  Mesh = 'mesh',
  /**
   * 曲线
   */
  Curve = 'curve',
  /**
   * 点云
   */
  Points = 'points',
  /**
   * 体积
   */
  Volume = 'volume',
  /**
   * 实例
   */
  Instancer = 'instancer',
}

/**
 * 拓扑类型
 */
export enum TopologyType {
  /**
   * 三角形
   */
  Triangles = 'triangles',
  /**
   * 四边形
   */
  Quads = 'quads',
  /**
   * 多边形
   */
  Polygons = 'polygons',
  /**
   * 线段
   */
  Lines = 'lines',
  /**
   * 点
   */
  Points = 'points',
}

/**
 * 材质绑定
 */
export interface MaterialBinding {
  /**
   * 材质路径
   */
  materialPath: string;
  /**
   * 绑定强度
   */
  bindingStrength: BindingStrength;
  /**
   * 面组
   */
  faceGroups?: number[];
  /**
   * 用途
   */
  purpose?: MaterialPurpose;
}

/**
 * 绑定强度
 */
export enum BindingStrength {
  /**
   * 弱绑定
   */
  Weak = 'weak',
  /**
   * 强绑定
   */
  Strong = 'strong',
}

/**
 * 材质用途
 */
export enum MaterialPurpose {
  /**
   * 默认
   */
  Default = 'default',
  /**
   * 预览
   */
  Preview = 'preview',
  /**
   * 渲染
   */
  Render = 'render',
}

/**
 * LOD 配置
 */
export interface LODConfiguration {
  /**
   * LOD 级别
   */
  levels: LODLevel[];
  /**
   * 距离计算方式
   */
  distanceMode: DistanceMode;
  /**
   * 淡入淡出
   */
  fadeTransition?: FadeTransition;
}

/**
 * LOD 级别
 */
export interface LODLevel {
  /**
   * 级别索引
   */
  level: number;
  /**
   * 距离范围
   */
  distance: [number, number];
  /**
   * 几何体引用
   */
  geometryRef: string;
  /**
   * 质量因子
   */
  qualityFactor: number;
  /**
   * 三角形数量
   */
  triangleCount: number;
}

/**
 * 距离计算模式
 */
export enum DistanceMode {
  /**
   * 边界球距离
   */
  BoundingSphere = 'bounding-sphere',
  /**
   * 边界框距离
   */
  BoundingBox = 'bounding-box',
  /**
   * 屏幕空间大小
   */
  ScreenSize = 'screen-size',
}

/**
 * 淡入淡出过渡
 */
export interface FadeTransition {
  /**
   * 启用淡入淡出
   */
  enabled: boolean;
  /**
   * 过渡距离
   */
  transitionDistance: number;
  /**
   * 过渡曲线
   */
  curve: TransitionCurve;
}

/**
 * 过渡曲线
 */
export enum TransitionCurve {
  /**
   * 线性
   */
  Linear = 'linear',
  /**
   * 平滑
   */
  Smooth = 'smooth',
  /**
   * 快速
   */
  Fast = 'fast',
  /**
   * 慢速
   */
  Slow = 'slow',
}

/**
 * 基础几何体
 */
export interface PrimitiveGeometry extends GeometryPrim {
  /**
   * 基础几何体类型
   */
  primitiveType: PrimitiveType;
  /**
   * 几何体参数
   */
  parameters: Record<string, any>;
}

/**
 * 基础几何体类型
 */
export enum PrimitiveType {
  /**
   * 立方体
   */
  Cube = 'cube',
  /**
   * 球体
   */
  Sphere = 'sphere',
  /**
   * 圆柱体
   */
  Cylinder = 'cylinder',
  /**
   * 圆锥体
   */
  Cone = 'cone',
  /**
   * 平面
   */
  Plane = 'plane',
  /**
   * 圆环
   */
  Torus = 'torus',
  /**
   * 胶囊
   */
  Capsule = 'capsule',
}

/**
 * 曲线几何体
 */
export interface CurveGeometry extends GeometryPrim {
  attributes: {
    /**
     * 控制点
     */
    points: UsdValue; // Point3f[]
    /**
     * 曲线权重
     */
    weights?: UsdValue; // float[]
    /**
     * 节点向量
     */
    knots?: UsdValue; // float[]
    /**
     * 曲线阶数
     */
    order?: UsdValue; // int
    /**
     * 曲线范围
     */
    ranges?: UsdValue; // float2[]
  };
  /**
   * 曲线类型
   */
  curveType: CurveType;
  /**
   * 曲线基础
   */
  basis: CurveBasis;
  /**
   * 是否闭合
   */
  closed: boolean;
  /**
   * 曲线宽度
   */
  widths?: number[];
}

/**
 * 曲线类型
 */
export enum CurveType {
  /**
   * 线性
   */
  Linear = 'linear',
  /**
   * 贝塞尔
   */
  Bezier = 'bezier',
  /**
   * B样条
   */
  BSpline = 'bspline',
  /**
   * NURBS
   */
  NURBS = 'nurbs',
  /**
   * Catmull-Rom
   */
  CatmullRom = 'catmull-rom',
}

/**
 * 曲线基础
 */
export enum CurveBasis {
  /**
   * 贝塞尔
   */
  Bezier = 'bezier',
  /**
   * B样条
   */
  BSpline = 'bspline',
  /**
   * Catmull-Rom
   */
  CatmullRom = 'catmull-rom',
  /**
   * 线性
   */
  Linear = 'linear',
}

/**
 * 点云几何体
 */
export interface PointsGeometry extends GeometryPrim {
  attributes: {
    /**
     * 点位置
     */
    points: UsdValue; // Point3f[]
    /**
     * 点颜色
     */
    colors?: UsdValue; // Color3f[]
    /**
     * 点大小
     */
    widths?: UsdValue; // float[]
    /**
     * 点法线
     */
    normals?: UsdValue; // Normal3f[]
    /**
     * 点ID
     */
    ids?: UsdValue; // int[]
  };
  /**
   * 点渲染类型
   */
  renderType: PointRenderType;
  /**
   * 点数量
   */
  pointCount: number;
}

/**
 * 点渲染类型
 */
export enum PointRenderType {
  /**
   * 像素点
   */
  Pixel = 'pixel',
  /**
   * 圆形
   */
  Circle = 'circle',
  /**
   * 方形
   */
  Square = 'square',
  /**
   * 精灵
   */
  Sprite = 'sprite',
  /**
   * 实例化
   */
  Instanced = 'instanced',
}

/**
 * 体积几何体
 */
export interface VolumeGeometry extends GeometryPrim {
  /**
   * 体积数据
   */
  volumeData: VolumeData;
  /**
   * 体积属性
   */
  properties: VolumeProperties;
}

/**
 * 体积数据
 */
export interface VolumeData {
  /**
   * 数据格式
   */
  format: VolumeFormat;
  /**
   * 数据路径
   */
  dataPath: string;
  /**
   * 体素尺寸
   */
  voxelSize: [number, number, number];
  /**
   * 网格尺寸
   */
  gridSize: [number, number, number];
  /**
   * 数据范围
   */
  dataRange: [number, number];
}

/**
 * 体积格式
 */
export enum VolumeFormat {
  /**
   * OpenVDB
   */
  OpenVDB = 'openvdb',
  /**
   * 原始数据
   */
  Raw = 'raw',
  /**
   * DICOM
   */
  DICOM = 'dicom',
  /**
   * NIfTI
   */
  NIfTI = 'nifti',
}

/**
 * 体积属性
 */
export interface VolumeProperties {
  /**
   * 密度
   */
  density: number;
  /**
   * 散射系数
   */
  scattering: number;
  /**
   * 吸收系数
   */
  absorption: number;
  /**
   * 发射强度
   */
  emission: number;
  /**
   * 各向异性
   */
  anisotropy: number;
}

/**
 * 实例化几何体
 */
export interface InstancerGeometry extends GeometryPrim {
  /**
   * 原型几何体
   */
  prototypes: string[];
  /**
   * 实例变换
   */
  transforms: InstanceTransform[];
  /**
   * 实例属性
   */
  instanceAttributes?: InstanceAttributes;
}

/**
 * 实例变换
 */
export interface InstanceTransform {
  /**
   * 变换矩阵
   */
  matrix: number[];
  /**
   * 原型索引
   */
  prototypeIndex: number;
  /**
   * 实例ID
   */
  instanceId?: number;
}

/**
 * 实例属性
 */
export interface InstanceAttributes {
  /**
   * 颜色
   */
  colors?: [number, number, number][];
  /**
   * 缩放
   */
  scales?: [number, number, number][];
  /**
   * 旋转
   */
  rotations?: [number, number, number, number][];
  /**
   * 可见性
   */
  visibility?: boolean[];
}

/**
 * 几何体变形
 */
export interface GeometryDeformation {
  /**
   * 变形类型
   */
  type: DeformationType;
  /**
   * 变形参数
   */
  parameters: Record<string, any>;
  /**
   * 影响权重
   */
  weight: number;
  /**
   * 是否启用
   */
  enabled: boolean;
}

/**
 * 变形类型
 */
export enum DeformationType {
  /**
   * 骨骼动画
   */
  Skeletal = 'skeletal',
  /**
   * 形变目标
   */
  BlendShape = 'blend-shape',
  /**
   * 顶点动画
   */
  VertexAnimation = 'vertex-animation',
  /**
   * 物理模拟
   */
  Physics = 'physics',
  /**
   * 程序化变形
   */
  Procedural = 'procedural',
}

/**
 * 几何体优化
 */
export interface GeometryOptimization {
  /**
   * 简化配置
   */
  simplification?: SimplificationConfig;
  /**
   * 压缩配置
   */
  compression?: CompressionConfig;
  /**
   * 缓存配置
   */
  caching?: CachingConfig;
}

/**
 * 简化配置
 */
export interface SimplificationConfig {
  /**
   * 简化算法
   */
  algorithm: SimplificationAlgorithm;
  /**
   * 目标三角形数
   */
  targetTriangles?: number;
  /**
   * 简化比例
   */
  simplificationRatio?: number;
  /**
   * 保持边界
   */
  preserveBoundaries: boolean;
  /**
   * 保持UV接缝
   */
  preserveUVSeams: boolean;
  /**
   * 保持法线
   */
  preserveNormals: boolean;
}

/**
 * 简化算法
 */
export enum SimplificationAlgorithm {
  /**
   * 边折叠
   */
  EdgeCollapse = 'edge-collapse',
  /**
   * 顶点聚类
   */
  VertexClustering = 'vertex-clustering',
  /**
   * 二次误差度量
   */
  QuadricErrorMetric = 'quadric-error-metric',
  /**
   * 渐进网格
   */
  ProgressiveMesh = 'progressive-mesh',
}

/**
 * 压缩配置
 */
export interface CompressionConfig {
  /**
   * 顶点压缩
   */
  vertexCompression?: VertexCompression;
  /**
   * 索引压缩
   */
  indexCompression?: IndexCompression;
  /**
   * 属性压缩
   */
  attributeCompression?: AttributeCompression;
}

/**
 * 顶点压缩
 */
export interface VertexCompression {
  /**
   * 位置量化
   */
  positionQuantization: number;
  /**
   * 法线量化
   */
  normalQuantization: number;
  /**
   * UV量化
   */
  uvQuantization: number;
  /**
   * 颜色量化
   */
  colorQuantization: number;
}

/**
 * 索引压缩
 */
export interface IndexCompression {
  /**
   * 压缩算法
   */
  algorithm: IndexCompressionAlgorithm;
  /**
   * 重排序
   */
  reordering: boolean;
}

/**
 * 索引压缩算法
 */
export enum IndexCompressionAlgorithm {
  /**
   * 三角形条带
   */
  TriangleStrips = 'triangle-strips',
  /**
   * 三角形扇形
   */
  TriangleFans = 'triangle-fans',
  /**
   * 德劳内三角化
   */
  Delaunay = 'delaunay',
}

/**
 * 属性压缩
 */
export interface AttributeCompression {
  /**
   * 压缩格式
   */
  format: AttributeFormat;
  /**
   * 压缩质量
   */
  quality: number;
}

/**
 * 属性格式
 */
export enum AttributeFormat {
  /**
   * 半精度浮点
   */
  Half = 'half',
  /**
   * 8位整数
   */
  Byte = 'byte',
  /**
   * 16位整数
   */
  Short = 'short',
  /**
   * 32位整数
   */
  Int = 'int',
}

/**
 * 缓存配置
 */
export interface CachingConfig {
  /**
   * 启用缓存
   */
  enabled: boolean;
  /**
   * 缓存策略
   */
  strategy: CacheStrategy;
  /**
   * 缓存大小限制
   */
  maxSize: number;
  /**
   * 缓存过期时间
   */
  ttl: number;
}

/**
 * 缓存策略
 */
export enum CacheStrategy {
  /**
   * 最近最少使用
   */
  LRU = 'lru',
  /**
   * 最近最常使用
   */
  LFU = 'lfu',
  /**
   * 先进先出
   */
  FIFO = 'fifo',
  /**
   * 时间到期
   */
  TTL = 'ttl',
}
