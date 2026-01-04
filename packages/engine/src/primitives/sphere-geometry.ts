/**
 * SphereGeometry - 球体几何体
 *
 * @packageDocumentation
 *
 * @remarks
 * SphereGeometry 生成一个 UV 球体几何体数据。
 *
 * ## 坐标系
 * - 使用右手坐标系
 * - Y 轴向上
 * - 球心在原点
 *
 * ## 使用示例
 * ```typescript
 * const sphere = new SphereGeometry({ radius: 1, segments: 32, rings: 16 });
 * const data = sphere.build();
 * ```
 */

import { GeometryBuilder, type GeometryData, type Vec3Tuple, type Vec2Tuple } from './geometry-builder';

/**
 * SphereGeometry 配置
 */
export interface SphereGeometryConfig {
  /** 半径 (默认: 0.5) */
  radius?: number;

  /** 水平分段数 (经度方向, 默认: 32) */
  segments?: number;

  /** 垂直分段数 (纬度方向, 默认: 16) */
  rings?: number;

  /** 水平起始角度 (弧度, 默认: 0) */
  phiStart?: number;

  /** 水平扫描角度 (弧度, 默认: 2π) */
  phiLength?: number;

  /** 垂直起始角度 (弧度, 默认: 0) */
  thetaStart?: number;

  /** 垂直扫描角度 (弧度, 默认: π) */
  thetaLength?: number;
}

/**
 * SphereGeometry - 球体几何体
 *
 * @remarks
 * 生成一个带有法线、UV 和切线的 UV 球体几何体。
 * 使用球面坐标系生成顶点。
 */
export class SphereGeometry {
  /** 配置 */
  private readonly config: Required<SphereGeometryConfig>;

  /** 缓存的几何体数据 */
  private cachedData: GeometryData | null = null;

  /**
   * 创建 SphereGeometry
   * @param config 配置选项
   */
  constructor(config: SphereGeometryConfig = {}) {
    this.config = {
      radius: config.radius ?? 0.5,
      segments: Math.max(3, Math.floor(config.segments ?? 32)),
      rings: Math.max(2, Math.floor(config.rings ?? 16)),
      phiStart: config.phiStart ?? 0,
      phiLength: config.phiLength ?? Math.PI * 2,
      thetaStart: config.thetaStart ?? 0,
      thetaLength: config.thetaLength ?? Math.PI,
    };
  }

  /**
   * 构建几何体数据
   * @returns 几何体数据
   */
  build(): GeometryData {
    if (this.cachedData) {
      return this.cachedData;
    }

    const builder = new GeometryBuilder(true);
    const { radius, segments, rings, phiStart, phiLength, thetaStart, thetaLength } = this.config;

    // 生成顶点
    const grid: number[][] = [];

    for (let iy = 0; iy <= rings; iy++) {
      const row: number[] = [];
      const v = iy / rings;

      // 特殊处理极点的 UV 偏移
      let uOffset = 0;
      if (iy === 0 && thetaStart === 0) {
        uOffset = 0.5 / segments;
      } else if (iy === rings && thetaStart + thetaLength === Math.PI) {
        uOffset = -0.5 / segments;
      }

      for (let ix = 0; ix <= segments; ix++) {
        const u = ix / segments;

        // 球面坐标
        const theta = thetaStart + v * thetaLength;
        const phi = phiStart + u * phiLength;

        // 转换为笛卡尔坐标
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = -radius * sinTheta * cosPhi;
        const y = radius * cosTheta;
        const z = radius * sinTheta * sinPhi;

        const position: Vec3Tuple = [x, y, z];

        // 法线 (归一化的位置向量)
        const normal: Vec3Tuple = [-sinTheta * cosPhi, cosTheta, sinTheta * sinPhi];

        // UV 坐标
        const uv: Vec2Tuple = [u + uOffset, 1 - v];

        const index = builder.addVertex(position, normal, uv);
        row.push(index);
      }

      grid.push(row);
    }

    // 生成索引
    for (let iy = 0; iy < rings; iy++) {
      for (let ix = 0; ix < segments; ix++) {
        const a = grid[iy][ix + 1];
        const b = grid[iy][ix];
        const c = grid[iy + 1][ix];
        const d = grid[iy + 1][ix + 1];

        // 跳过退化三角形（极点）
        if (iy !== 0 || thetaStart > 0) {
          builder.addTriangle(a, b, d);
        }
        if (iy !== rings - 1 || thetaStart + thetaLength < Math.PI) {
          builder.addTriangle(b, c, d);
        }
      }
    }

    this.cachedData = builder.build();
    return this.cachedData;
  }

  /**
   * 获取半径
   */
  get radius(): number {
    return this.config.radius;
  }

  /**
   * 获取水平分段数
   */
  get segments(): number {
    return this.config.segments;
  }

  /**
   * 获取垂直分段数
   */
  get rings(): number {
    return this.config.rings;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cachedData = null;
  }
}
