/**
 * CylinderGeometry - 圆柱体几何体
 *
 * @packageDocumentation
 *
 * @remarks
 * CylinderGeometry 生成一个圆柱体几何体数据。
 *
 * ## 坐标系
 * - 使用右手坐标系
 * - Y 轴向上（圆柱体轴向）
 * - 圆柱体中心在原点
 *
 * ## 使用示例
 * ```typescript
 * const cylinder = new CylinderGeometry({
 *   radiusTop: 0.5,
 *   radiusBottom: 0.5,
 *   height: 2,
 *   radialSegments: 32
 * });
 * const data = cylinder.build();
 * ```
 */

import { GeometryBuilder, type GeometryData, type Vec3Tuple, type Vec2Tuple } from './geometry-builder';

/**
 * CylinderGeometry 配置
 */
export interface CylinderGeometryConfig {
  /** 顶部半径 (默认: 0.5) */
  radiusTop?: number;

  /** 底部半径 (默认: 0.5) */
  radiusBottom?: number;

  /** 高度 (默认: 1) */
  height?: number;

  /** 圆周分段数 (默认: 32) */
  radialSegments?: number;

  /** 高度分段数 (默认: 1) */
  heightSegments?: number;

  /** 是否开口 (不生成顶部和底部, 默认: false) */
  openEnded?: boolean;

  /** 起始角度 (弧度, 默认: 0) */
  thetaStart?: number;

  /** 扫描角度 (弧度, 默认: 2π) */
  thetaLength?: number;
}

/**
 * CylinderGeometry - 圆柱体几何体
 *
 * @remarks
 * 生成一个带有法线、UV 和切线的圆柱体几何体。
 * 支持圆锥体（radiusTop 或 radiusBottom 为 0）。
 */
export class CylinderGeometry {
  /** 配置 */
  private readonly config: Required<CylinderGeometryConfig>;

  /** 缓存的几何体数据 */
  private cachedData: GeometryData | null = null;

  /**
   * 创建 CylinderGeometry
   * @param config 配置选项
   */
  constructor(config: CylinderGeometryConfig = {}) {
    this.config = {
      radiusTop: config.radiusTop ?? 0.5,
      radiusBottom: config.radiusBottom ?? 0.5,
      height: config.height ?? 1,
      radialSegments: Math.max(3, Math.floor(config.radialSegments ?? 32)),
      heightSegments: Math.max(1, Math.floor(config.heightSegments ?? 1)),
      openEnded: config.openEnded ?? false,
      thetaStart: config.thetaStart ?? 0,
      thetaLength: config.thetaLength ?? Math.PI * 2,
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
    const { radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength } =
      this.config;

    const halfHeight = height / 2;

    // 构建侧面
    this.buildTorso(builder, radiusTop, radiusBottom, height, radialSegments, heightSegments, thetaStart, thetaLength);

    // 构建顶部和底部
    if (!openEnded) {
      if (radiusTop > 0) {
        this.buildCap(builder, true, radiusTop, halfHeight, radialSegments, thetaStart, thetaLength);
      }
      if (radiusBottom > 0) {
        this.buildCap(builder, false, radiusBottom, -halfHeight, radialSegments, thetaStart, thetaLength);
      }
    }

    this.cachedData = builder.build();
    return this.cachedData;
  }

  /**
   * 构建侧面
   * @internal
   */
  private buildTorso(
    builder: GeometryBuilder,
    radiusTop: number,
    radiusBottom: number,
    height: number,
    radialSegments: number,
    heightSegments: number,
    thetaStart: number,
    thetaLength: number
  ): void {
    const halfHeight = height / 2;
    const slope = (radiusBottom - radiusTop) / height;

    // 生成顶点
    const indexArray: number[][] = [];

    for (let y = 0; y <= heightSegments; y++) {
      const row: number[] = [];
      const v = y / heightSegments;
      const radius = v * (radiusBottom - radiusTop) + radiusTop;
      const posY = v * height - halfHeight;

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = thetaStart + u * thetaLength;

        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        // 位置
        const position: Vec3Tuple = [radius * sinTheta, posY, radius * cosTheta];

        // 法线 (考虑斜率)
        const normalLength = Math.sqrt(1 + slope * slope);
        const normal: Vec3Tuple = [sinTheta / normalLength, slope / normalLength, cosTheta / normalLength];

        // UV
        const uv: Vec2Tuple = [u, 1 - v];

        const index = builder.addVertex(position, normal, uv);
        row.push(index);
      }

      indexArray.push(row);
    }

    // 生成索引
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < radialSegments; x++) {
        const a = indexArray[y][x];
        const b = indexArray[y + 1][x];
        const c = indexArray[y + 1][x + 1];
        const d = indexArray[y][x + 1];

        builder.addTriangle(a, b, d);
        builder.addTriangle(b, c, d);
      }
    }
  }

  /**
   * 构建顶部或底部
   * @internal
   */
  private buildCap(
    builder: GeometryBuilder,
    isTop: boolean,
    radius: number,
    y: number,
    radialSegments: number,
    thetaStart: number,
    thetaLength: number
  ): void {
    const sign = isTop ? 1 : -1;
    const normal: Vec3Tuple = [0, sign, 0];

    // 中心顶点
    const centerIndex = builder.addVertex([0, y, 0], normal, [0.5, 0.5]);

    // 边缘顶点
    const edgeIndices: number[] = [];

    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = thetaStart + u * thetaLength;

      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      const position: Vec3Tuple = [radius * sinTheta, y, radius * cosTheta];

      // UV 映射到圆形
      const uvX = sinTheta * 0.5 + 0.5;
      const uvY = cosTheta * 0.5 * sign + 0.5;
      const uv: Vec2Tuple = [uvX, uvY];

      const index = builder.addVertex(position, normal, uv);
      edgeIndices.push(index);
    }

    // 生成三角形
    for (let x = 0; x < radialSegments; x++) {
      if (isTop) {
        builder.addTriangle(centerIndex, edgeIndices[x + 1], edgeIndices[x]);
      } else {
        builder.addTriangle(centerIndex, edgeIndices[x], edgeIndices[x + 1]);
      }
    }
  }

  /**
   * 获取顶部半径
   */
  get radiusTop(): number {
    return this.config.radiusTop;
  }

  /**
   * 获取底部半径
   */
  get radiusBottom(): number {
    return this.config.radiusBottom;
  }

  /**
   * 获取高度
   */
  get height(): number {
    return this.config.height;
  }

  /**
   * 获取圆周分段数
   */
  get radialSegments(): number {
    return this.config.radialSegments;
  }

  /**
   * 获取高度分段数
   */
  get heightSegments(): number {
    return this.config.heightSegments;
  }

  /**
   * 是否开口
   */
  get openEnded(): boolean {
    return this.config.openEnded;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cachedData = null;
  }
}
