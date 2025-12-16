/**
 * material/pbr/SimplePBRTypes.ts
 * 简化版PBR材质系统类型定义
 */

/**
 * 简化版PBR材质参数
 */
export interface SimplePBRMaterialParams {
  /** 基础颜色（线性空间RGB） */
  albedo: [number, number, number];
  /** 金属度 (0.0 = 非金属, 1.0 = 金属) */
  metallic: number;
  /** 粗糙度 (0.0 = 光滑, 1.0 = 粗糙) */
  roughness: number;
  /** 环境光强度 */
  ambientStrength: number;
}

/**
 * 点光源参数
 */
export interface SimplePBRLightParams {
  /** 光源位置（世界空间） */
  position: [number, number, number];
  /** 光源颜色（线性空间RGB） */
  color: [number, number, number];
  /** 常数衰减系数 */
  constant: number;
  /** 线性衰减系数 */
  linear: number;
  /** 二次衰减系数 */
  quadratic: number;
}

/**
 * 简化版PBR材质配置
 */
export interface SimplePBRMaterialConfig {
  /** 材质参数 */
  material: SimplePBRMaterialParams;
  /** 光源列表（最多2个） */
  lights: SimplePBRLightParams[];
  /** 环境贴图URL配置 */
  cubemapUrls: {
    posX: string;
    negX: string;
    posY: string;
    negY: string;
    posZ: string;
    negZ: string;
  };
}
