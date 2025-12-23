/**
 * Maxellabs 设计资产定义
 * 包含资产库、资产分类和资产管理相关类型
 */

import type { AssetType, LicenseType, BaseLicense, BaseCategory, Nameable, Describable } from '../core';

/**
 * 资产库
 *
 * @description 组合 Nameable trait
 */
export interface AssetLibrary extends Nameable {
  /**
   * 资产列表
   */
  assets: DesignAsset[];
  /**
   * 资产分类
   */
  categories?: AssetCategory[];
}

/**
 * 设计资产
 *
 * @description 组合 Nameable, Describable traits
 */
export interface DesignAsset extends Nameable, Describable {
  /**
   * 资产 ID
   */
  id: string;
  /**
   * 资产类型
   */
  type: AssetType;
  /**
   * 文件URL
   */
  url: string;
  /**
   * 文件大小
   */
  size?: number;
  /**
   * 资产标签
   */
  tags?: string[];
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 缩略图
   */
  thumbnail?: string;
  /**
   * 许可信息
   */
  license?: AssetLicense;
  /**
   * 版本信息
   */
  version?: string;
  /**
   * 分辨率信息
   */
  resolution?: AssetResolution;
}

/**
 * 资产分类
 *
 * @description 继承自 BaseCategory，添加图标和排序字段
 */
export interface AssetCategory extends BaseCategory {
  /**
   * 分类图标
   */
  icon?: string;
  /**
   * 排序权重
   */
  order?: number;
}

/**
 * 资产许可
 *
 * @description 继承自 BaseLicense，组合 Nameable trait，添加资产特有的版权和归属字段
 */
export interface AssetLicense extends BaseLicense, Nameable {
  /**
   * 许可类型（覆盖为具体类型）
   */
  type: LicenseType;
  /**
   * 版权信息
   */
  copyright?: string;
  /**
   * 归属信息
   */
  attribution?: string;
}

/**
 * 资产分辨率
 */
export interface AssetResolution {
  /**
   * 宽度
   */
  width: number;
  /**
   * 高度
   */
  height: number;
  /**
   * DPI
   */
  dpi?: number;
  /**
   * 颜色模式
   */
  colorMode?: ColorMode;
}

/**
 * 颜色模式
 */
export enum ColorMode {
  RGB = 'rgb',
  RGBA = 'rgba',
  CMYK = 'cmyk',
  Grayscale = 'grayscale',
  Indexed = 'indexed',
}
