/**
 * Maxellabs 图像元数据规范
 * 图像元数据相关类型定义
 */

/**
 * 图像元数据
 */
export interface ImageMetadata {
  /**
   * EXIF 数据
   */
  exif?: ExifData;
  /**
   * IPTC 数据
   */
  iptc?: IptcData;
  /**
   * XMP 数据
   */
  xmp?: XmpData;
  /**
   * 技术元数据
   */
  technical?: TechnicalMetadata;
  /**
   * 自定义元数据
   */
  custom?: Record<string, any>;
}

/**
 * EXIF 数据
 */
export interface ExifData {
  /**
   * 相机制造商
   */
  make?: string;
  /**
   * 相机型号
   */
  model?: string;
  /**
   * 拍摄时间
   */
  dateTime?: string;
  /**
   * 曝光时间
   */
  exposureTime?: number;
  /**
   * 光圈值
   */
  fNumber?: number;
  /**
   * ISO 感光度
   */
  iso?: number;
  /**
   * 焦距
   */
  focalLength?: number;
  /**
   * 闪光灯
   */
  flash?: boolean;
  /**
   * 白平衡
   */
  whiteBalance?: string;
  /**
   * 测光模式
   */
  meteringMode?: string;
  /**
   * 曝光模式
   */
  exposureMode?: string;
  /**
   * 镜头信息
   */
  lensInfo?: LensInfo;
  /**
   * GPS 坐标
   */
  gps?: GpsData;
}

/**
 * 镜头信息
 */
export interface LensInfo {
  /**
   * 镜头制造商
   */
  make?: string;
  /**
   * 镜头型号
   */
  model?: string;
  /**
   * 最小焦距
   */
  minFocalLength?: number;
  /**
   * 最大焦距
   */
  maxFocalLength?: number;
  /**
   * 最小光圈
   */
  minAperture?: number;
  /**
   * 最大光圈
   */
  maxAperture?: number;
}

/**
 * GPS 数据
 */
export interface GpsData {
  /**
   * 纬度
   */
  latitude: number;
  /**
   * 经度
   */
  longitude: number;
  /**
   * 海拔高度
   */
  altitude?: number;
  /**
   * 方向
   */
  direction?: number;
  /**
   * 时间戳
   */
  timestamp?: string;
}

/**
 * IPTC 数据
 */
export interface IptcData {
  /**
   * 标题
   */
  title?: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 关键词
   */
  keywords?: string[];
  /**
   * 作者
   */
  author?: string;
  /**
   * 版权
   */
  copyright?: string;
  /**
   * 创建日期
   */
  dateCreated?: string;
  /**
   * 城市
   */
  city?: string;
  /**
   * 省份/州
   */
  province?: string;
  /**
   * 国家
   */
  country?: string;
  /**
   * 类别
   */
  category?: string;
  /**
   * 补充类别
   */
  supplementalCategories?: string[];
  /**
   * 紧急程度
   */
  urgency?: number;
  /**
   * 说明撰写者
   */
  captionWriter?: string;
  /**
   * 来源
   */
  source?: string;
  /**
   * 信用
   */
  credit?: string;
}

/**
 * XMP 数据
 */
export interface XmpData {
  /**
   * 创建者工具
   */
  creatorTool?: string;
  /**
   * 评级
   */
  rating?: number;
  /**
   * 标签
   */
  label?: string;
  /**
   * 颜色标签
   */
  colorLabel?: string;
  /**
   * 主题
   */
  subject?: string[];
  /**
   * 用途
   */
  usage?: string;
  /**
   * 许可
   */
  license?: string;
  /**
   * 权利管理
   */
  rightsManagement?: string;
  /**
   * 自定义字段
   */
  custom?: Record<string, any>;
}

/**
 * 技术元数据
 */
export interface TechnicalMetadata {
  /**
   * 文件哈希值
   */
  hash?: string;
  /**
   * 文件签名
   */
  signature?: string;
  /**
   * 压缩比
   */
  compressionRatio?: number;
  /**
   * 质量分数
   */
  qualityScore?: number;
  /**
   * 锐度
   */
  sharpness?: number;
  /**
   * 噪点水平
   */
  noiseLevel?: number;
  /**
   * 动态范围
   */
  dynamicRange?: number;
  /**
   * 色域
   */
  colorGamut?: string;
  /**
   * 直方图数据
   */
  histogram?: HistogramData;
}

/**
 * 直方图数据
 */
export interface HistogramData {
  /**
   * 红色通道
   */
  red: number[];
  /**
   * 绿色通道
   */
  green: number[];
  /**
   * 蓝色通道
   */
  blue: number[];
  /**
   * 亮度通道
   */
  luminance: number[];
}

/**
 * 元数据提取选项
 */
export interface MetadataExtractionOptions {
  /**
   * 是否提取EXIF
   */
  extractExif: boolean;
  /**
   * 是否提取IPTC
   */
  extractIptc: boolean;
  /**
   * 是否提取XMP
   */
  extractXmp: boolean;
  /**
   * 是否提取技术数据
   */
  extractTechnical: boolean;
  /**
   * 是否保留原始数据
   */
  preserveOriginal: boolean;
  /**
   * 隐私模式（移除敏感信息）
   */
  privacyMode: boolean;
}

/**
 * 元数据编辑选项
 */
export interface MetadataEditOptions {
  /**
   * 操作类型
   */
  operation: MetadataOperation;
  /**
   * 目标字段
   */
  fields: string[];
  /**
   * 新值
   */
  values: Record<string, any>;
  /**
   * 是否保留原始值
   */
  preserveOriginal: boolean;
}

/**
 * 元数据操作类型
 */
export enum MetadataOperation {
  /**
   * 添加
   */
  Add = 'add',
  /**
   * 更新
   */
  Update = 'update',
  /**
   * 删除
   */
  Remove = 'remove',
  /**
   * 清除
   */
  Clear = 'clear',
  /**
   * 复制
   */
  Copy = 'copy',
  /**
   * 合并
   */
  Merge = 'merge',
}
