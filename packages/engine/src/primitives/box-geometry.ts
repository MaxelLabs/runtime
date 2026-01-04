/**
 * BoxGeometry - 立方体几何体
 *
 * @packageDocumentation
 *
 * @remarks
 * BoxGeometry 生成一个轴对齐的立方体几何体数据。
 *
 * ## 坐标系
 * - 使用右手坐标系
 * - Y 轴向上
 * - 立方体中心在原点
 *
 * ## 使用示例
 * ```typescript
 * const box = new BoxGeometry({ width: 2, height: 2, depth: 2 });
 * const data = box.build();
 * ```
 */

import { GeometryBuilder, type GeometryData, type Vec3Tuple, type Vec2Tuple } from './geometry-builder';

/**
 * BoxGeometry 配置
 */
export interface BoxGeometryConfig {
  /** 宽度 (X 轴方向, 默认: 1) */
  width?: number;

  /** 高度 (Y 轴方向, 默认: 1) */
  height?: number;

  /** 深度 (Z 轴方向, 默认: 1) */
  depth?: number;

  /** X 轴方向分段数 (默认: 1) */
  widthSegments?: number;

  /** Y 轴方向分段数 (默认: 1) */
  heightSegments?: number;

  /** Z 轴方向分段数 (默认: 1) */
  depthSegments?: number;
}

/**
 * BoxGeometry - 立方体几何体
 *
 * @remarks
 * 生成一个带有法线、UV 和切线的立方体几何体。
 * 每个面都有独立的顶点以支持硬边法线。
 */
export class BoxGeometry {
  /** 配置 */
  private readonly config: Required<BoxGeometryConfig>;

  /** 缓存的几何体数据 */
  private cachedData: GeometryData | null = null;

  /**
   * 创建 BoxGeometry
   * @param config 配置选项
   */
  constructor(config: BoxGeometryConfig = {}) {
    this.config = {
      width: config.width ?? 1,
      height: config.height ?? 1,
      depth: config.depth ?? 1,
      widthSegments: Math.max(1, Math.floor(config.widthSegments ?? 1)),
      heightSegments: Math.max(1, Math.floor(config.heightSegments ?? 1)),
      depthSegments: Math.max(1, Math.floor(config.depthSegments ?? 1)),
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
    const { width, height, depth, widthSegments, heightSegments, depthSegments } = this.config;

    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    // 构建 6 个面
    // +X 面 (右)
    this.buildFace(
      builder,
      [halfWidth, -halfHeight, -halfDepth], // 起点
      [0, height / heightSegments, 0], // U 方向步进
      [0, 0, depth / depthSegments], // V 方向步进
      [1, 0, 0], // 法线
      heightSegments,
      depthSegments
    );

    // -X 面 (左)
    this.buildFace(
      builder,
      [-halfWidth, -halfHeight, halfDepth],
      [0, height / heightSegments, 0],
      [0, 0, -depth / depthSegments],
      [-1, 0, 0],
      heightSegments,
      depthSegments
    );

    // +Y 面 (上)
    this.buildFace(
      builder,
      [-halfWidth, halfHeight, -halfDepth],
      [width / widthSegments, 0, 0],
      [0, 0, depth / depthSegments],
      [0, 1, 0],
      widthSegments,
      depthSegments
    );

    // -Y 面 (下)
    this.buildFace(
      builder,
      [-halfWidth, -halfHeight, halfDepth],
      [width / widthSegments, 0, 0],
      [0, 0, -depth / depthSegments],
      [0, -1, 0],
      widthSegments,
      depthSegments
    );

    // +Z 面 (前)
    this.buildFace(
      builder,
      [-halfWidth, -halfHeight, halfDepth],
      [width / widthSegments, 0, 0],
      [0, height / heightSegments, 0],
      [0, 0, 1],
      widthSegments,
      heightSegments
    );

    // -Z 面 (后)
    this.buildFace(
      builder,
      [halfWidth, -halfHeight, -halfDepth],
      [-width / widthSegments, 0, 0],
      [0, height / heightSegments, 0],
      [0, 0, -1],
      widthSegments,
      heightSegments
    );

    this.cachedData = builder.build();
    return this.cachedData;
  }

  /**
   * 构建单个面
   * @param builder 几何体构建器
   * @param origin 起点
   * @param uStep U 方向步进
   * @param vStep V 方向步进
   * @param normal 法线
   * @param uSegments U 方向分段数
   * @param vSegments V 方向分段数
   * @internal
   */
  private buildFace(
    builder: GeometryBuilder,
    origin: Vec3Tuple,
    uStep: Vec3Tuple,
    vStep: Vec3Tuple,
    normal: Vec3Tuple,
    uSegments: number,
    vSegments: number
  ): void {
    const baseIndex = builder.vertexCount;

    // 生成顶点
    for (let v = 0; v <= vSegments; v++) {
      for (let u = 0; u <= uSegments; u++) {
        const position: Vec3Tuple = [
          origin[0] + uStep[0] * u + vStep[0] * v,
          origin[1] + uStep[1] * u + vStep[1] * v,
          origin[2] + uStep[2] * u + vStep[2] * v,
        ];

        const uv: Vec2Tuple = [u / uSegments, v / vSegments];

        builder.addVertex(position, normal, uv);
      }
    }

    // 生成索引
    const stride = uSegments + 1;
    for (let v = 0; v < vSegments; v++) {
      for (let u = 0; u < uSegments; u++) {
        const i0 = baseIndex + v * stride + u;
        const i1 = baseIndex + v * stride + u + 1;
        const i2 = baseIndex + (v + 1) * stride + u + 1;
        const i3 = baseIndex + (v + 1) * stride + u;

        // 两个三角形组成一个四边形
        builder.addQuad(i0, i1, i2, i3);
      }
    }
  }

  /**
   * 获取宽度
   */
  get width(): number {
    return this.config.width;
  }

  /**
   * 获取高度
   */
  get height(): number {
    return this.config.height;
  }

  /**
   * 获取深度
   */
  get depth(): number {
    return this.config.depth;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cachedData = null;
  }
}
