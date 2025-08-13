/**
 * Maxellabs 包格式规范
 * 基于 USDZ 扩展的 Maxellabs 包格式 (.maxz)
 */

import type { UsdStage, CompressionAlgorithm, DeviceType, CacheStrategy, GeometryOptimization } from '../core';
import type { DesignDocument } from '../design';
import type { Workflow } from '../workflow';

/**
 * Maxellabs 包格式 (.maxz)
 * 基于 USDZ 的扩展包格式，支持完整的设计到上线流程
 */
export interface MaxellabsPackage {
  /**
   * 包格式版本
   */
  version: string;
  /**
   * 包元数据
   */
  metadata: PackageMetadata;
  /**
   * USD Stage（主场景）
   */
  stage: UsdStage;
  /**
   * 设计文档
   */
  designDocuments: DesignDocument[];
  /**
   * 工作流程
   */
  workflows: Workflow[];
  /**
   * 资产清单
   */
  assetManifest: AssetManifest;
  /**
   * 包配置
   */
  configuration: PackageConfiguration;
}

/**
 * 包元数据
 */
export interface PackageMetadata {
  /**
   * 包名称
   */
  name: string;
  /**
   * 包版本
   */
  version: string;
  /**
   * 包描述
   */
  description?: string;
  /**
   * 作者信息
   */
  author: AuthorInfo;
  /**
   * 许可证
   */
  license?: string;
  /**
   * 关键词
   */
  keywords?: string[];
  /**
   * 主页
   */
  homepage?: string;
  /**
   * 仓库信息
   */
  repository?: RepositoryInfo;
  /**
   * 创建时间
   */
  createdAt: string;
  /**
   * 修改时间
   */
  modifiedAt: string;
  /**
   * 包大小（字节）
   */
  size: number;
  /**
   * 文件数量
   */
  fileCount: number;
  /**
   * 校验和
   */
  checksum: string;
  /**
   * 依赖包
   */
  dependencies?: PackageDependency[];
  /**
   * 兼容性信息
   */
  compatibility: CompatibilityInfo;
}

/**
 * 作者信息
 */
export interface AuthorInfo {
  /**
   * 作者姓名
   */
  name: string;
  /**
   * 作者邮箱
   */
  email?: string;
  /**
   * 作者主页
   */
  url?: string;
  /**
   * 组织
   */
  organization?: string;
}

/**
 * 仓库信息
 */
export interface RepositoryInfo {
  /**
   * 仓库类型
   */
  type: 'git' | 'svn' | 'mercurial';
  /**
   * 仓库 URL
   */
  url: string;
  /**
   * 目录
   */
  directory?: string;
}

/**
 * 包依赖
 */
export interface PackageDependency {
  /**
   * 依赖包名称
   */
  name: string;
  /**
   * 依赖版本
   */
  version: string;
  /**
   * 依赖类型
   */
  type: DependencyType;
  /**
   * 是否可选
   */
  optional?: boolean;
}

/**
 * 依赖类型枚举
 */
export enum DependencyType {
  Runtime = 'runtime',
  Development = 'development',
  Peer = 'peer',
  Optional = 'optional',
}

/**
 * 兼容性信息
 */
export interface CompatibilityInfo {
  /**
   * 最小引擎版本
   */
  minEngineVersion: string;
  /**
   * 最大引擎版本
   */
  maxEngineVersion?: string;
  /**
   * 支持的平台
   */
  platforms: Platform[];
  /**
   * 支持的浏览器
   */
  browsers?: BrowserSupport[];
  /**
   * 支持的设备类型
   */
  deviceTypes?: DeviceType[];
}

/**
 * 平台类型枚举
 */
export enum Platform {
  Web = 'web',
  Desktop = 'desktop',
  Mobile = 'mobile',
  Tablet = 'tablet',
  TV = 'tv',
  VR = 'vr',
  AR = 'ar',
}

/**
 * 浏览器支持
 */
export interface BrowserSupport {
  /**
   * 浏览器名称
   */
  name: string;
  /**
   * 最小版本
   */
  minVersion: string;
  /**
   * 最大版本
   */
  maxVersion?: string;
}

/**
 * 资产清单
 */
export interface AssetManifest {
  /**
   * 资产列表
   */
  assets: AssetEntry[];
  /**
   * 资产统计
   */
  statistics: AssetStatistics;
  /**
   * 资产索引
   */
  index: AssetIndex;
}

/**
 * 资产条目
 */
export interface AssetEntry {
  /**
   * 资产 ID
   */
  id: string;
  /**
   * 资产名称
   */
  name: string;
  /**
   * 资产类型
   */
  type: AssetEntryType;
  /**
   * 文件路径
   */
  path: string;
  /**
   * 文件大小
   */
  size: number;
  /**
   * MIME 类型
   */
  mimeType: string;
  /**
   * 校验和
   */
  checksum: string;
  /**
   * 压缩信息
   */
  compression?: CompressionInfo;
  /**
   * 元数据
   */
  metadata?: Record<string, any>;
  /**
   * 依赖关系
   */
  dependencies?: string[];
  /**
   * 标签
   */
  tags?: string[];
}

/**
 * 包资产条目类型（扩展基础AssetType）
 */
export enum AssetEntryType {
  // 基础类型（来自 AssetType）
  Design = 'design',
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Font = 'font',
  Icon = 'icon',
  Component = 'component',
  Code = 'code',
  Documentation = 'documentation',
  Configuration = 'configuration',

  // USD 特定格式
  USD = 'usd',
  USDA = 'usda',
  USDC = 'usdc',

  // 3D 相关
  Model = 'model',
  Material = 'material',
  Texture = 'texture',
  Shader = 'shader',
  Animation = 'animation',
}

/**
 * 压缩信息
 */
export interface CompressionInfo {
  /**
   * 压缩算法
   */
  algorithm: CompressionAlgorithm;
  /**
   * 压缩前大小
   */
  originalSize: number;
  /**
   * 压缩后大小
   */
  compressedSize: number;
  /**
   * 压缩比
   */
  ratio: number;
}
/**
 * 资产统计
 */
export interface AssetStatistics {
  /**
   * 总文件数
   */
  totalFiles: number;
  /**
   * 总大小
   */
  totalSize: number;
  /**
   * 按类型统计
   */
  byType: Record<AssetEntryType, TypeStatistics>;
  /**
   * 按扩展名统计
   */
  byExtension: Record<string, ExtensionStatistics>;
}

/**
 * 类型统计
 */
export interface TypeStatistics {
  /**
   * 文件数量
   */
  count: number;
  /**
   * 总大小
   */
  size: number;
  /**
   * 平均大小
   */
  averageSize: number;
}

/**
 * 扩展名统计
 */
export interface ExtensionStatistics {
  /**
   * 文件数量
   */
  count: number;
  /**
   * 总大小
   */
  size: number;
  /**
   * MIME 类型
   */
  mimeType: string;
}

/**
 * 资产索引
 */
export interface AssetIndex {
  /**
   * 按 ID 索引
   */
  byId: Record<string, string>;
  /**
   * 按名称索引
   */
  byName: Record<string, string[]>;
  /**
   * 按类型索引
   */
  byType: Record<AssetEntryType, string[]>;
  /**
   * 按标签索引
   */
  byTag: Record<string, string[]>;
  /**
   * 依赖关系图
   */
  dependencyGraph: DependencyGraph;
}

/**
 * 依赖关系图
 */
export interface DependencyGraph {
  /**
   * 节点
   */
  nodes: DependencyNode[];
  /**
   * 边
   */
  edges: DependencyEdge[];
}

/**
 * 依赖节点
 */
export interface DependencyNode {
  /**
   * 节点 ID
   */
  id: string;
  /**
   * 资产 ID
   */
  assetId: string;
  /**
   * 节点类型
   */
  type: string;
}

/**
 * 依赖边
 */
export interface DependencyEdge {
  /**
   * 源节点 ID
   */
  from: string;
  /**
   * 目标节点 ID
   */
  to: string;
  /**
   * 依赖类型
   */
  type: string;
}

/**
 * 包配置
 */
export interface PackageConfiguration {
  /**
   * 构建配置
   */
  build: BuildConfiguration;
  /**
   * 运行时配置
   */
  runtime: RuntimeConfiguration;
  /**
   * 优化配置
   */
  optimization: OptimizationConfiguration;
  /**
   * 安全配置
   */
  security: SecurityConfiguration;
  /**
   * 调试配置
   */
  debug: DebugConfiguration;
}

/**
 * 构建配置
 */
export interface BuildConfiguration {
  /**
   * 构建目标
   */
  target: BuildTarget;
  /**
   * 构建模式
   */
  mode: BuildMode;
  /**
   * 输出目录
   */
  outputDir: string;
  /**
   * 源映射
   */
  sourceMap: boolean;
  /**
   * 压缩
   */
  minify: boolean;
  /**
   * 代码分割
   */
  codeSplitting: boolean;
  /**
   * 树摇
   */
  treeShaking: boolean;
  /**
   * 环境变量
   */
  env: Record<string, string>;
}
/**
 * 构建目标枚举
 */
export enum BuildTarget {
  Web = 'web',
  Node = 'node',
  Electron = 'electron',
  ReactNative = 'react-native',
  Unity = 'unity',
  Unreal = 'unreal',
}

/**
 * 构建模式
 */
export enum BuildMode {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * 运行时配置
 */
export interface RuntimeConfiguration {
  /**
   * 渲染器配置
   */
  renderer: RendererConfiguration;
  /**
   * 加载器配置
   */
  loader: LoaderConfiguration;
  /**
   * 缓存配置
   */
  cache: CacheConfiguration;
  /**
   * 性能配置
   */
  performance: PerformanceConfiguration;
}

/**
 * 渲染器配置
 */
export interface RendererConfiguration {
  /**
   * 渲染器类型
   */
  type: RendererType;
  /**
   * 抗锯齿
   */
  antialias: boolean;
  /**
   * 透明度
   */
  alpha: boolean;
  /**
   * 深度缓冲
   */
  depth: boolean;
  /**
   * 模板缓冲
   */
  stencil: boolean;
  /**
   * 保留绘图缓冲
   */
  preserveDrawingBuffer: boolean;
  /**
   * 功率偏好
   */
  powerPreference: PowerPreference;
}

/**
 * 渲染器类型
 */
export enum RendererType {
  WebGL = 'webgl',
  WebGL2 = 'webgl2',
  WebGPU = 'webgpu',
  Canvas2D = 'canvas2d',
  SVG = 'svg',
}

/**
 * 功率偏好
 */
export enum PowerPreference {
  Default = 'default',
  HighPerformance = 'high-performance',
  LowPower = 'low-power',
}

/**
 * 加载器配置
 */
export interface LoaderConfiguration {
  /**
   * 并发加载数
   */
  concurrency: number;
  /**
   * 超时时间
   */
  timeout: number;
  /**
   * 重试次数
   */
  retries: number;
  /**
   * 预加载
   */
  preload: boolean;
  /**
   * 懒加载
   */
  lazyLoad: boolean;
  /**
   * 缓存策略
   */
  cacheStrategy: CacheStrategy;
}

/**
 * 缓存配置
 */
export interface CacheConfiguration {
  /**
   * 启用缓存
   */
  enabled: boolean;
  /**
   * 缓存大小限制（MB）
   */
  maxSize: number;
  /**
   * 缓存过期时间（秒）
   */
  ttl: number;
  /**
   * 缓存策略
   */
  strategy: CacheStrategy;
  /**
   * 缓存键前缀
   */
  keyPrefix: string;
}

/**
 * 性能配置
 */
export interface PerformanceConfiguration {
  /**
   * 目标帧率
   */
  targetFPS: number;
  /**
   * 最大内存使用（MB）
   */
  maxMemory: number;
  /**
   * GPU 内存限制（MB）
   */
  gpuMemoryLimit: number;
  /**
   * 自适应质量
   */
  adaptiveQuality: boolean;
  /**
   * 性能监控
   */
  monitoring: boolean;
}

/**
 * 优化配置
 */
export interface OptimizationConfiguration {
  /**
   * 纹理优化
   */
  texture: TextureOptimization;
  /**
   * 几何体优化
   */
  geometry: GeometryOptimization;
  /**
   * 材质优化
   */
  material: MaterialOptimization;
  /**
   * 动画优化
   */
  animation: AnimationOptimization;
}

/**
 * 纹理优化
 */
export interface TextureOptimization {
  /**
   * 压缩格式
   */
  compression: TextureCompression[];
  /**
   * 最大尺寸
   */
  maxSize: number;
  /**
   * Mipmap 生成
   */
  generateMipmaps: boolean;
  /**
   * 格式转换
   */
  formatConversion: boolean;
}

/**
 * 纹理压缩
 */
export enum TextureCompression {
  DXT = 'dxt',
  ETC = 'etc',
  PVRTC = 'pvrtc',
  ASTC = 'astc',
  BC7 = 'bc7',
}

/**
 * 材质优化
 */
export interface MaterialOptimization {
  /**
   * 合并材质
   */
  mergeMaterials: boolean;
  /**
   * 移除未使用的材质
   */
  removeUnused: boolean;
  /**
   * 着色器优化
   */
  shaderOptimization: boolean;
}

/**
 * 动画优化
 */
export interface AnimationOptimization {
  /**
   * 关键帧优化
   */
  keyframeOptimization: boolean;
  /**
   * 压缩
   */
  compression: boolean;
  /**
   * 采样率优化
   */
  sampleRateOptimization: boolean;
}

/**
 * 安全配置
 */
export interface SecurityConfiguration {
  /**
   * 内容安全策略
   */
  csp: ContentSecurityPolicy;
  /**
   * 资源完整性
   */
  sri: SubresourceIntegrity;
  /**
   * 访问控制
   */
  accessControl: AccessControl;
}

/**
 * 内容安全策略
 */
export interface ContentSecurityPolicy {
  /**
   * 启用 CSP
   */
  enabled: boolean;
  /**
   * CSP 指令
   */
  directives: Record<string, string[]>;
  /**
   * 报告 URI
   */
  reportUri?: string;
}

/**
 * 子资源完整性
 */
export interface SubresourceIntegrity {
  /**
   * 启用 SRI
   */
  enabled: boolean;
  /**
   * 哈希算法
   */
  algorithm: HashAlgorithm;
  /**
   * 跨域策略
   */
  crossorigin: CrossOriginPolicy;
}

/**
 * 哈希算法
 */
export enum HashAlgorithm {
  SHA256 = 'sha256',
  SHA384 = 'sha384',
  SHA512 = 'sha512',
}

/**
 * 跨域策略
 */
export enum CrossOriginPolicy {
  Anonymous = 'anonymous',
  UseCredentials = 'use-credentials',
}

/**
 * 访问控制
 */
export interface AccessControl {
  /**
   * 允许的域名
   */
  allowedOrigins: string[];
  /**
   * 允许的方法
   */
  allowedMethods: string[];
  /**
   * 允许的头部
   */
  allowedHeaders: string[];
  /**
   * 凭据支持
   */
  credentials: boolean;
}

/**
 * 调试配置
 */
export interface DebugConfiguration {
  /**
   * 启用调试
   */
  enabled: boolean;
  /**
   * 日志级别
   */
  logLevel: LogLevel;
  /**
   * 性能分析
   */
  profiling: boolean;
  /**
   * 统计信息
   */
  stats: boolean;
  /**
   * 调试面板
   */
  debugPanel: boolean;
}

/**
 * 日志级别
 */
export enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Trace = 'trace',
}

/**
 * 包验证结果
 */
export interface PackageValidationResult {
  /**
   * 验证状态
   */
  valid: boolean;
  /**
   * 错误列表
   */
  errors: ValidationError[];
  /**
   * 警告列表
   */
  warnings: ValidationWarning[];
  /**
   * 验证统计
   */
  statistics: ValidationStatistics;
}

/**
 * 验证错误
 */
export interface ValidationError {
  /**
   * 错误代码
   */
  code: string;
  /**
   * 错误消息
   */
  message: string;
  /**
   * 错误位置
   */
  location?: string;
  /**
   * 错误详情
   */
  details?: Record<string, any>;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /**
   * 警告代码
   */
  code: string;
  /**
   * 警告消息
   */
  message: string;
  /**
   * 警告位置
   */
  location?: string;
  /**
   * 建议
   */
  suggestion?: string;
}

/**
 * 验证统计
 */
export interface ValidationStatistics {
  /**
   * 验证时间
   */
  duration: number;
  /**
   * 检查项目数
   */
  checksPerformed: number;
  /**
   * 错误数量
   */
  errorCount: number;
  /**
   * 警告数量
   */
  warningCount: number;
}
