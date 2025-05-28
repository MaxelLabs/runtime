/**
 * Maxellabs 图像规范 - 导出索引
 * 统一导出图像相关的所有类型定义
 */

// 基础类型
export * from './base';

// 元数据相关
export * from './metadata';

// 处理相关
export * from './processing';

// 集合和缓存相关
export * from './collection';

// 重新导出常用类型组合
export type {
  // 基础接口
  ImagePrim,
  ImageResource,
  ImageDimensions,
  ImageRegion,
  ImagePoint,
  ImageStats,
  ImageColorInfo,
  ImageQuality,

  // 格式和枚举
  ImageFormat,
  CompressionType,
  ImageScaleMode,
  ImageSortBy,
  SortOrder,
} from './base';

export type {
  // 元数据
  LensInfo,
  GpsData,
  MetadataExtractionOptions,
  MetadataEditOptions,
  MetadataOperation,
} from './metadata';

export type {
  // 处理
  ImageTransformType,
  ScaleTransformParams,
  RotateTransformParams,
  CropTransformParams,
  CropMode,
  SmartCropOptions,
  ResamplingAlgorithm,
  ColorQuantization,
  QuantizationAlgorithm,
  AlphaHandling,
  SizeLimit,
  ErrorHandling,
  BatchOutputSettings,
} from './processing';

export type {
  // 集合
  CollectionPermissions,
  SharingSettings,
  LibraryStatistics,
  ActivityRecord,
  ActivityType,
  StorageType,
  BackupSettings,
  BackupFrequency,
  CleanupPolicy,
  CleanupRule,
  CleanupCondition,
  CleanupAction,
  PreloadPriority,
  PreloadStrategy,
  CacheCompressionSettings,
  CompressionAlgorithm,
} from './collection';
