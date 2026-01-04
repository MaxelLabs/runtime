/**
 * PlaneGeometry - 平面几何体
 *
 * @packageDocumentation
 *
 * @remarks
 * 创建一个水平平面几何体，中心在原点，法线朝上 (+Y)。
 *
 * ## 使用示例
 * ```typescript
 * const plane = new PlaneGeometry(10, 10);
 * const data = plane.getData();
 * ```
 */

import { GeometryBuilder, type GeometryData, type Vec3Tuple, type Vec2Tuple } from './geometry-builder';

/**
 * PlaneGeometry 配置
 */
export interface PlaneGeometryConfig {
  /** 宽度 (X 轴, 默认: 1) */
  width?: number;

  /** 高度 (Z 轴, 默认: 1) */
  height?: number;

  /** 宽度分段数 (默认: 1) */
  widthSegments?: number;

  /** 高度分段数 (默认: 1) */
  heightSegments?: number;
}

/**
 * PlaneGeometry - 平面几何体
 */
export class PlaneGeometry {
  /** 几何体数据 */
  private data: GeometryData;

  /** 配置 */
  private readonly config: Required<PlaneGeometryConfig>;

  /**
   * 创建 PlaneGeometry
   * @param width 宽度 (默认: 1)
   * @param height 高度 (默认: 1)
   * @param widthSegments 宽度分段数 (默认: 1)
   * @param heightSegments 高度分段数 (默认: 1)
   */
  constructor(width: number = 1, height: number = 1, widthSegments: number = 1, heightSegments: number = 1) {
    this.config = {
      width,
      height,
      widthSegments: Math.max(1, Math.floor(widthSegments)),
      heightSegments: Math.max(1, Math.floor(heightSegments)),
    };

    this.data = this.build();
  }

  /**
   * 构建几何体数据
   */
  private build(): GeometryData {
    const builder = new GeometryBuilder();
    const { width, height, widthSegments, heightSegments } = this.config;

    // const hw = width / 2;
    // const hh = height / 2;

    // 生成顶点
    const grid: number[][] = [];

    for (let iz = 0; iz <= heightSegments; iz++) {
      const row: number[] = [];
      const v = iz / heightSegments;
      const z = (v - 0.5) * height;

      for (let ix = 0; ix <= widthSegments; ix++) {
        const u = ix / widthSegments;
        const x = (u - 0.5) * width;

        const index = builder.addVertex(
          [x, 0, z] as Vec3Tuple, // position (Y = 0, XZ 平面)
          [0, 1, 0] as Vec3Tuple, // normal (+Y)
          [u, 1 - v] as Vec2Tuple // uv
        );
        row.push(index);
      }

      grid.push(row);
    }

    // 生成索引
    for (let iz = 0; iz < heightSegments; iz++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const i0 = grid[iz][ix];
        const i1 = grid[iz][ix + 1];
        const i2 = grid[iz + 1][ix + 1];
        const i3 = grid[iz + 1][ix];

        builder.addQuad(i0, i1, i2, i3);
      }
    }

    return builder.build();
  }

  /**
   * 获取几何体数据
   */
  getData(): GeometryData {
    return this.data;
  }

  /**
   * 获取配置
   */
  getConfig(): Readonly<Required<PlaneGeometryConfig>> {
    return this.config;
  }
}
