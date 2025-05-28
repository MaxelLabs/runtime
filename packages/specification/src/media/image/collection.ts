/**
 * Maxellabs 图像集合规范
 * 图像集合管理和缓存相关类型定义
 */

import type { ImageSortBy, SortOrder, ImageScaleMode, ImageFormat } from './base';
import type { ImageOptimization } from './processing';
import type { DeviceType } from '../../core/base';

/**
 * 图像变体
 */
export interface ImageVariant {
  /**
   * 变体名称
   */
  name: string;
  /**
   * 变体描述
   */
  description?: string;
  /**
   * 目标尺寸
   */
  size: {
    width: number;
    height: number;
  };
  /**
   * 缩放模式
   */
  scaleMode: ImageScaleMode;
  /**
   * 输出格式
   */
  format: ImageFormat;
  /**
   * 优化配置
   */
  optimization: ImageOptimization;
  /**
   * 用途标签
   */
  usage?: string[];
  /**
   * 设备类型
   */
  deviceType?: DeviceType[];
  /**
   * 像素密度
   */
  pixelDensity?: number;
}

/**
 * 图像集合
 */
export interface ImageCollection {
  /**
   * 集合ID
   */
  id: string;
  /**
   * 集合名称
   */
  name: string;
  /**
   * 集合描述
   */
  description?: string;
  /**
   * 图像列表
   */
  images: string[];
  /**
   * 集合标签
   */
  tags?: string[];
  /**
   * 分类
   */
  category?: string;
  /**
   * 排序方式
   */
  sortBy?: ImageSortBy;
  /**
   * 排序顺序
   */
  sortOrder?: SortOrder;
  /**
   * 创建时间
   */
  createdAt: string;
  /**
   * 修改时间
   */
  modifiedAt: string;
  /**
   * 创建者
   */
  creator?: string;
  /**
   * 权限设置
   */
  permissions?: CollectionPermissions;
}

/**
 * 集合权限
 */
export interface CollectionPermissions {
  /**
   * 公开访问
   */
  public: boolean;
  /**
   * 可读用户列表
   */
  readers?: string[];
  /**
   * 可写用户列表
   */
  writers?: string[];
  /**
   * 管理员列表
   */
  administrators?: string[];
  /**
   * 共享设置
   */
  sharing?: SharingSettings;
}

/**
 * 共享设置
 */
export interface SharingSettings {
  /**
   * 是否允许共享
   */
  enabled: boolean;
  /**
   * 共享链接
   */
  shareUrl?: string;
  /**
   * 过期时间
   */
  expiresAt?: string;
  /**
   * 密码保护
   */
  password?: string;
  /**
   * 下载权限
   */
  allowDownload: boolean;
}

/**
 * 图像库
 */
export interface ImageLibrary {
  /**
   * 库名称
   */
  name: string;
  /**
   * 库描述
   */
  description?: string;
  /**
   * 图像集合
   */
  collections: Record<string, ImageCollection>;
  /**
   * 库设置
   */
  settings: LibrarySettings;
  /**
   * 统计信息
   */
  statistics?: LibraryStatistics;
}

/**
 * 库设置
 */
export interface LibrarySettings {
  /**
   * 默认排序
   */
  defaultSortBy: ImageSortBy;
  /**
   * 默认排序顺序
   */
  defaultSortOrder: SortOrder;
  /**
   * 缩略图设置
   */
  thumbnail: ThumbnailSettings;
  /**
   * 预览设置
   */
  preview: PreviewSettings;
  /**
   * 存储设置
   */
  storage: StorageSettings;
}

/**
 * 缩略图设置
 */
export interface ThumbnailSettings {
  /**
   * 缩略图尺寸
   */
  sizes: number[];
  /**
   * 默认尺寸
   */
  defaultSize: number;
  /**
   * 质量
   */
  quality: number;
  /**
   * 格式
   */
  format: ImageFormat;
  /**
   * 自动生成
   */
  autoGenerate: boolean;
}

/**
 * 预览设置
 */
export interface PreviewSettings {
  /**
   * 预览尺寸
   */
  maxSize: {
    width: number;
    height: number;
  };
  /**
   * 质量
   */
  quality: number;
  /**
   * 格式
   */
  format: ImageFormat;
  /**
   * 延迟加载
   */
  lazyLoading: boolean;
}

/**
 * 存储设置
 */
export interface StorageSettings {
  /**
   * 存储类型
   */
  type: StorageType;
  /**
   * 存储配置
   */
  config: Record<string, any>;
  /**
   * 备份设置
   */
  backup?: BackupSettings;
  /**
   * 清理策略
   */
  cleanup?: CleanupPolicy;
}

/**
 * 存储类型
 */
export enum StorageType {
  /**
   * 本地存储
   */
  Local = 'local',
  /**
   * 云存储
   */
  Cloud = 'cloud',
  /**
   * CDN
   */
  CDN = 'cdn',
  /**
   * 混合存储
   */
  Hybrid = 'hybrid',
}

/**
 * 备份设置
 */
export interface BackupSettings {
  /**
   * 是否启用备份
   */
  enabled: boolean;
  /**
   * 备份频率
   */
  frequency: BackupFrequency;
  /**
   * 备份保留期
   */
  retention: number;
  /**
   * 备份位置
   */
  location: string;
}

/**
 * 备份频率
 */
export enum BackupFrequency {
  /**
   * 实时
   */
  Realtime = 'realtime',
  /**
   * 每小时
   */
  Hourly = 'hourly',
  /**
   * 每日
   */
  Daily = 'daily',
  /**
   * 每周
   */
  Weekly = 'weekly',
  /**
   * 每月
   */
  Monthly = 'monthly',
}

/**
 * 清理策略
 */
export interface CleanupPolicy {
  /**
   * 自动清理
   */
  autoCleanup: boolean;
  /**
   * 清理间隔（天）
   */
  interval: number;
  /**
   * 保留期（天）
   */
  retentionDays: number;
  /**
   * 清理规则
   */
  rules: CleanupRule[];
}

/**
 * 清理规则
 */
export interface CleanupRule {
  /**
   * 规则名称
   */
  name: string;
  /**
   * 条件
   */
  condition: CleanupCondition;
  /**
   * 动作
   */
  action: CleanupAction;
  /**
   * 是否启用
   */
  enabled: boolean;
}

/**
 * 清理条件
 */
export enum CleanupCondition {
  /**
   * 未使用时间
   */
  UnusedTime = 'unused-time',
  /**
   * 文件大小
   */
  FileSize = 'file-size',
  /**
   * 访问频率
   */
  AccessFrequency = 'access-frequency',
  /**
   * 重复文件
   */
  Duplicate = 'duplicate',
}

/**
 * 清理动作
 */
export enum CleanupAction {
  /**
   * 删除
   */
  Delete = 'delete',
  /**
   * 归档
   */
  Archive = 'archive',
  /**
   * 压缩
   */
  Compress = 'compress',
  /**
   * 移动
   */
  Move = 'move',
}

/**
 * 库统计信息
 */
export interface LibraryStatistics {
  /**
   * 总图像数量
   */
  totalImages: number;
  /**
   * 总文件大小
   */
  totalSize: number;
  /**
   * 集合数量
   */
  totalCollections: number;
  /**
   * 格式分布
   */
  formatDistribution: Record<string, number>;
  /**
   * 尺寸分布
   */
  sizeDistribution: Record<string, number>;
  /**
   * 最近活动
   */
  recentActivity: ActivityRecord[];
}

/**
 * 活动记录
 */
export interface ActivityRecord {
  /**
   * 活动类型
   */
  type: ActivityType;
  /**
   * 活动时间
   */
  timestamp: string;
  /**
   * 用户
   */
  user?: string;
  /**
   * 目标资源
   */
  target: string;
  /**
   * 详细信息
   */
  details?: Record<string, any>;
}

/**
 * 活动类型
 */
export enum ActivityType {
  /**
   * 上传
   */
  Upload = 'upload',
  /**
   * 下载
   */
  Download = 'download',
  /**
   * 编辑
   */
  Edit = 'edit',
  /**
   * 删除
   */
  Delete = 'delete',
  /**
   * 移动
   */
  Move = 'move',
  /**
   * 复制
   */
  Copy = 'copy',
  /**
   * 重命名
   */
  Rename = 'rename',
  /**
   * 分享
   */
  Share = 'share',
}

/**
 * 图像缓存
 */
export interface ImageCache {
  /**
   * 缓存策略
   */
  strategy: CacheStrategy;
  /**
   * 缓存大小限制（MB）
   */
  maxSize: number;
  /**
   * 缓存过期时间（秒）
   */
  ttl: number;
  /**
   * 预加载配置
   */
  preload?: PreloadConfig;
  /**
   * 压缩设置
   */
  compression?: CacheCompressionSettings;
}

/**
 * 缓存策略
 */
export enum CacheStrategy {
  /**
   * 无缓存
   */
  None = 'none',
  /**
   * 内存缓存
   */
  Memory = 'memory',
  /**
   * 磁盘缓存
   */
  Disk = 'disk',
  /**
   * 混合缓存
   */
  Hybrid = 'hybrid',
  /**
   * 智能缓存
   */
  Smart = 'smart',
}

/**
 * 预加载配置
 */
export interface PreloadConfig {
  /**
   * 启用预加载
   */
  enabled: boolean;
  /**
   * 预加载数量
   */
  count: number;
  /**
   * 预加载优先级
   */
  priority: PreloadPriority;
  /**
   * 预加载策略
   */
  strategy: PreloadStrategy;
}

/**
 * 预加载优先级
 */
export enum PreloadPriority {
  /**
   * 低
   */
  Low = 'low',
  /**
   * 中
   */
  Medium = 'medium',
  /**
   * 高
   */
  High = 'high',
  /**
   * 关键
   */
  Critical = 'critical',
}

/**
 * 预加载策略
 */
export enum PreloadStrategy {
  /**
   * 顺序加载
   */
  Sequential = 'sequential',
  /**
   * 智能预测
   */
  Predictive = 'predictive',
  /**
   * 用户行为
   */
  UserBehavior = 'user-behavior',
  /**
   * 视口可见
   */
  Viewport = 'viewport',
}

/**
 * 缓存压缩设置
 */
export interface CacheCompressionSettings {
  /**
   * 是否启用压缩
   */
  enabled: boolean;
  /**
   * 压缩算法
   */
  algorithm: CompressionAlgorithm;
  /**
   * 压缩级别
   */
  level: number;
}

/**
 * 压缩算法
 */
export enum CompressionAlgorithm {
  /**
   * Gzip
   */
  Gzip = 'gzip',
  /**
   * Brotli
   */
  Brotli = 'brotli',
  /**
   * LZ4
   */
  LZ4 = 'lz4',
  /**
   * Zstandard
   */
  Zstd = 'zstd',
}
