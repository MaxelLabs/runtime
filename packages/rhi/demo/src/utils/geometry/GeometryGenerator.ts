/**
 * geometry/GeometryGenerator.ts
 * 几何体生成器 - 提供常用几何体的顶点数据生成
 */

import { MSpec } from '@maxellabs/core';
import type { GeometryData, VertexAttributeConfig, PlaneOptions, CubeOptions, SphereOptions } from './types';

/**
 * 几何体生成器
 *
 * 提供常用几何体的顶点数据生成，支持自定义属性配置。
 *
 * @example
 * ```typescript
 * // 生成带颜色的三角形
 * const triangle = GeometryGenerator.triangle({ colors: true });
 *
 * // 生成带 UV 的平面
 * const plane = GeometryGenerator.plane({
 *   width: 2,
 *   height: 2,
 *   uvs: true,
 *   normals: true,
 * });
 *
 * // 创建缓冲区
 * const vertexBuffer = device.createBuffer({
 *   size: triangle.vertices.byteLength,
 *   usage: MSpec.RHIBufferUsage.VERTEX,
 *   initialData: triangle.vertices,
 * });
 * ```
 */
export class GeometryGenerator {
  // ==================== 基础几何体 ====================

  /**
   * 生成三角形
   * @param options 生成选项
   * @returns 几何体数据
   */
  static triangle(options: { colors?: boolean } = {}): GeometryData {
    const hasColors = options.colors ?? true;

    // 属性配置
    const attributes: VertexAttributeConfig[] = [
      {
        name: 'aPosition',
        type: 'position',
        format: MSpec.RHIVertexFormat.FLOAT32x3,
        shaderLocation: 0,
      },
    ];

    if (hasColors) {
      attributes.push({
        name: 'aColor',
        type: 'color',
        format: MSpec.RHIVertexFormat.FLOAT32x3,
        shaderLocation: 1,
      });
    }

    // 计算步长
    const stride = hasColors ? 24 : 12; // 3 floats + (3 floats)

    // 顶点数据
    const vertices = hasColors
      ? new Float32Array([
          // 位置 (x, y, z)     颜色 (r, g, b)
          0.0,
          0.5,
          0.0,
          1.0,
          0.0,
          0.0, // 顶部 - 红色
          -0.5,
          -0.5,
          0.0,
          0.0,
          1.0,
          0.0, // 左下 - 绿色
          0.5,
          -0.5,
          0.0,
          0.0,
          0.0,
          1.0, // 右下 - 蓝色
        ])
      : new Float32Array([
          0.0,
          0.5,
          0.0, // 顶部
          -0.5,
          -0.5,
          0.0, // 左下
          0.5,
          -0.5,
          0.0, // 右下
        ]);

    return {
      vertices,
      vertexCount: 3,
      vertexStride: stride,
      layout: this.buildVertexLayout(attributes, stride),
      attributes,
    };
  }

  /**
   * 生成四边形（两个三角形）
   * @param options 生成选项
   * @returns 几何体数据
   */
  static quad(
    options: {
      width?: number;
      height?: number;
      uvs?: boolean;
      colors?: boolean;
    } = {}
  ): GeometryData {
    const width = options.width ?? 1;
    const height = options.height ?? 1;
    const hasUvs = options.uvs ?? false;
    const hasColors = options.colors ?? false;

    const hw = width / 2;
    const hh = height / 2;

    // 属性配置
    const attributes: VertexAttributeConfig[] = [
      {
        name: 'aPosition',
        type: 'position',
        format: MSpec.RHIVertexFormat.FLOAT32x3,
        shaderLocation: 0,
      },
    ];

    let floatsPerVertex = 3;

    if (hasUvs) {
      attributes.push({
        name: 'aTexCoord',
        type: 'uv',
        format: MSpec.RHIVertexFormat.FLOAT32x2,
        shaderLocation: 1,
      });
      floatsPerVertex += 2;
    }

    if (hasColors) {
      attributes.push({
        name: 'aColor',
        type: 'color',
        format: MSpec.RHIVertexFormat.FLOAT32x3,
        shaderLocation: hasUvs ? 2 : 1,
      });
      floatsPerVertex += 3;
    }

    const stride = floatsPerVertex * 4;

    // 构建顶点数据（使用索引绘制）
    const vertexData: number[] = [];

    // 4 个顶点
    const positions = [
      [-hw, -hh, 0], // 左下
      [hw, -hh, 0], // 右下
      [hw, hh, 0], // 右上
      [-hw, hh, 0], // 左上
    ];

    const uvCoords = [
      [0, 1], // 左下
      [1, 1], // 右下
      [1, 0], // 右上
      [0, 0], // 左上
    ];

    const colorValues = [
      [1, 0, 0], // 红
      [0, 1, 0], // 绿
      [0, 0, 1], // 蓝
      [1, 1, 0], // 黄
    ];

    for (let i = 0; i < 4; i++) {
      vertexData.push(...positions[i]);
      if (hasUvs) {
        vertexData.push(...uvCoords[i]);
      }
      if (hasColors) {
        vertexData.push(...colorValues[i]);
      }
    }

    // 索引（两个三角形）
    const indices = new Uint16Array([
      0,
      1,
      2, // 第一个三角形
      0,
      2,
      3, // 第二个三角形
    ]);

    return {
      vertices: new Float32Array(vertexData),
      indices,
      vertexCount: 4,
      indexCount: 6,
      vertexStride: stride,
      layout: this.buildVertexLayout(attributes, stride),
      attributes,
    };
  }

  /**
   * 生成立方体
   * @param options 生成选项
   * @returns 几何体数据
   */
  static cube(options: CubeOptions = {}): GeometryData {
    const size = options.size ?? 1;
    const width = options.width ?? size;
    const height = options.height ?? size;
    const depth = options.depth ?? size;
    const hasNormals = options.normals ?? true;
    const hasUvs = options.uvs ?? true;

    const hw = width / 2;
    const hh = height / 2;
    const hd = depth / 2;

    // 属性配置
    const attributes: VertexAttributeConfig[] = [
      {
        name: 'aPosition',
        type: 'position',
        format: MSpec.RHIVertexFormat.FLOAT32x3,
        shaderLocation: 0,
      },
    ];

    let floatsPerVertex = 3;

    if (hasNormals) {
      attributes.push({
        name: 'aNormal',
        type: 'normal',
        format: MSpec.RHIVertexFormat.FLOAT32x3,
        shaderLocation: 1,
      });
      floatsPerVertex += 3;
    }

    if (hasUvs) {
      attributes.push({
        name: 'aTexCoord',
        type: 'uv',
        format: MSpec.RHIVertexFormat.FLOAT32x2,
        shaderLocation: hasNormals ? 2 : 1,
      });
      floatsPerVertex += 2;
    }

    const stride = floatsPerVertex * 4;

    // 6 个面，每个面 4 个顶点
    const vertexData: number[] = [];
    const indexData: number[] = [];

    // 定义 6 个面
    const faces = [
      // 前面 (z = +hd)
      {
        positions: [
          [-hw, -hh, hd],
          [hw, -hh, hd],
          [hw, hh, hd],
          [-hw, hh, hd],
        ],
        normal: [0, 0, 1],
      },
      // 后面 (z = -hd)
      {
        positions: [
          [hw, -hh, -hd],
          [-hw, -hh, -hd],
          [-hw, hh, -hd],
          [hw, hh, -hd],
        ],
        normal: [0, 0, -1],
      },
      // 上面 (y = +hh)
      {
        positions: [
          [-hw, hh, hd],
          [hw, hh, hd],
          [hw, hh, -hd],
          [-hw, hh, -hd],
        ],
        normal: [0, 1, 0],
      },
      // 下面 (y = -hh)
      {
        positions: [
          [-hw, -hh, -hd],
          [hw, -hh, -hd],
          [hw, -hh, hd],
          [-hw, -hh, hd],
        ],
        normal: [0, -1, 0],
      },
      // 右面 (x = +hw)
      {
        positions: [
          [hw, -hh, hd],
          [hw, -hh, -hd],
          [hw, hh, -hd],
          [hw, hh, hd],
        ],
        normal: [1, 0, 0],
      },
      // 左面 (x = -hw)
      {
        positions: [
          [-hw, -hh, -hd],
          [-hw, -hh, hd],
          [-hw, hh, hd],
          [-hw, hh, -hd],
        ],
        normal: [-1, 0, 0],
      },
    ];

    const uvCoords = [
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ];

    let vertexIndex = 0;

    for (const face of faces) {
      for (let i = 0; i < 4; i++) {
        vertexData.push(...face.positions[i]);
        if (hasNormals) {
          vertexData.push(...face.normal);
        }
        if (hasUvs) {
          vertexData.push(...uvCoords[i]);
        }
      }

      // 两个三角形
      indexData.push(vertexIndex, vertexIndex + 1, vertexIndex + 2, vertexIndex, vertexIndex + 2, vertexIndex + 3);

      vertexIndex += 4;
    }

    return {
      vertices: new Float32Array(vertexData),
      indices: new Uint16Array(indexData),
      vertexCount: 24,
      indexCount: 36,
      vertexStride: stride,
      layout: this.buildVertexLayout(attributes, stride),
      attributes,
    };
  }

  /**
   * 生成平面
   * @param options 生成选项
   * @returns 几何体数据
   */
  static plane(options: PlaneOptions = {}): GeometryData {
    const width = options.width ?? 1;
    const height = options.height ?? 1;
    const widthSegments = options.widthSegments ?? 1;
    const heightSegments = options.heightSegments ?? 1;
    const hasNormals = options.normals ?? true;
    const hasUvs = options.uvs ?? true;

    // 属性配置
    const attributes: VertexAttributeConfig[] = [
      {
        name: 'aPosition',
        type: 'position',
        format: MSpec.RHIVertexFormat.FLOAT32x3,
        shaderLocation: 0,
      },
    ];

    let floatsPerVertex = 3;

    if (hasNormals) {
      attributes.push({
        name: 'aNormal',
        type: 'normal',
        format: MSpec.RHIVertexFormat.FLOAT32x3,
        shaderLocation: 1,
      });
      floatsPerVertex += 3;
    }

    if (hasUvs) {
      attributes.push({
        name: 'aTexCoord',
        type: 'uv',
        format: MSpec.RHIVertexFormat.FLOAT32x2,
        shaderLocation: hasNormals ? 2 : 1,
      });
      floatsPerVertex += 2;
    }

    const stride = floatsPerVertex * 4;

    const vertexData: number[] = [];
    const indexData: number[] = [];

    const segmentWidth = width / widthSegments;
    const segmentHeight = height / heightSegments;

    // 生成顶点
    for (let iy = 0; iy <= heightSegments; iy++) {
      const y = iy * segmentHeight - height / 2;

      for (let ix = 0; ix <= widthSegments; ix++) {
        const x = ix * segmentWidth - width / 2;

        // 位置
        vertexData.push(x, 0, y);

        // 法线 (向上)
        if (hasNormals) {
          vertexData.push(0, 1, 0);
        }

        // UV
        if (hasUvs) {
          vertexData.push(ix / widthSegments, 1 - iy / heightSegments);
        }
      }
    }

    // 生成索引
    for (let iy = 0; iy < heightSegments; iy++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const a = ix + (widthSegments + 1) * iy;
        const b = ix + (widthSegments + 1) * (iy + 1);
        const c = ix + 1 + (widthSegments + 1) * (iy + 1);
        const d = ix + 1 + (widthSegments + 1) * iy;

        indexData.push(a, b, d);
        indexData.push(b, c, d);
      }
    }

    const vertexCount = (widthSegments + 1) * (heightSegments + 1);
    const indexCount = widthSegments * heightSegments * 6;

    return {
      vertices: new Float32Array(vertexData),
      indices: new Uint16Array(indexData),
      vertexCount,
      indexCount,
      vertexStride: stride,
      layout: this.buildVertexLayout(attributes, stride),
      attributes,
    };
  }

  /**
   * 生成球体
   * @param options 生成选项
   * @returns 几何体数据
   */
  static sphere(options: SphereOptions = {}): GeometryData {
    const radius = options.radius ?? 0.5;
    const widthSegments = Math.max(3, options.widthSegments ?? 32);
    const heightSegments = Math.max(2, options.heightSegments ?? 16);
    const hasNormals = options.normals ?? true;
    const hasUvs = options.uvs ?? true;

    // 属性配置
    const attributes: VertexAttributeConfig[] = [
      {
        name: 'aPosition',
        type: 'position',
        format: MSpec.RHIVertexFormat.FLOAT32x3,
        shaderLocation: 0,
      },
    ];

    let floatsPerVertex = 3;

    if (hasNormals) {
      attributes.push({
        name: 'aNormal',
        type: 'normal',
        format: MSpec.RHIVertexFormat.FLOAT32x3,
        shaderLocation: 1,
      });
      floatsPerVertex += 3;
    }

    if (hasUvs) {
      attributes.push({
        name: 'aTexCoord',
        type: 'uv',
        format: MSpec.RHIVertexFormat.FLOAT32x2,
        shaderLocation: hasNormals ? 2 : 1,
      });
      floatsPerVertex += 2;
    }

    const stride = floatsPerVertex * 4;

    const vertexData: number[] = [];
    const indexData: number[] = [];

    // 生成顶点
    for (let iy = 0; iy <= heightSegments; iy++) {
      const v = iy / heightSegments;
      const phi = v * Math.PI;

      for (let ix = 0; ix <= widthSegments; ix++) {
        const u = ix / widthSegments;
        const theta = u * Math.PI * 2;

        // 球面坐标转笛卡尔坐标
        const x = -radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(theta) * Math.sin(phi);

        // 位置
        vertexData.push(x, y, z);

        // 法线（单位球面上的点即为法线方向）
        if (hasNormals) {
          const nx = x / radius;
          const ny = y / radius;
          const nz = z / radius;
          vertexData.push(nx, ny, nz);
        }

        // UV
        if (hasUvs) {
          vertexData.push(u, v);
        }
      }
    }

    // 生成索引
    for (let iy = 0; iy < heightSegments; iy++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const a = ix + (widthSegments + 1) * iy;
        const b = ix + (widthSegments + 1) * (iy + 1);
        const c = ix + 1 + (widthSegments + 1) * (iy + 1);
        const d = ix + 1 + (widthSegments + 1) * iy;

        if (iy !== 0) {
          indexData.push(a, b, d);
        }
        if (iy !== heightSegments - 1) {
          indexData.push(b, c, d);
        }
      }
    }

    const vertexCount = (widthSegments + 1) * (heightSegments + 1);
    const indexCount = indexData.length;

    return {
      vertices: new Float32Array(vertexData),
      indices: new Uint16Array(indexData),
      vertexCount,
      indexCount,
      vertexStride: stride,
      layout: this.buildVertexLayout(attributes, stride),
      attributes,
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 构建顶点布局
   * @param attributes 属性配置
   * @param stride 步长
   * @returns 顶点布局
   */
  private static buildVertexLayout(attributes: VertexAttributeConfig[], stride: number): MSpec.RHIVertexLayout {
    let offset = 0;
    const layoutAttributes: MSpec.RHIVertexAttribute[] = [];

    for (const attr of attributes) {
      layoutAttributes.push({
        name: attr.name,
        format: attr.format,
        offset,
        shaderLocation: attr.shaderLocation,
      });

      // 计算下一个属性的偏移
      offset += this.getFormatSize(attr.format);
    }

    return {
      buffers: [
        {
          index: 0,
          stride,
          stepMode: 'vertex',
          attributes: layoutAttributes,
        },
      ],
    };
  }

  /**
   * 获取顶点格式的字节大小
   * @param format 顶点格式
   * @returns 字节大小
   */
  private static getFormatSize(format: MSpec.RHIVertexFormat): number {
    switch (format) {
      case MSpec.RHIVertexFormat.FLOAT32:
        return 4;
      case MSpec.RHIVertexFormat.FLOAT32x2:
        return 8;
      case MSpec.RHIVertexFormat.FLOAT32x3:
        return 12;
      case MSpec.RHIVertexFormat.FLOAT32x4:
        return 16;
      case MSpec.RHIVertexFormat.UINT8x2:
      case MSpec.RHIVertexFormat.SINT8x2:
      case MSpec.RHIVertexFormat.UNORM8x2:
      case MSpec.RHIVertexFormat.SNORM8x2:
        return 2;
      case MSpec.RHIVertexFormat.UINT8x4:
      case MSpec.RHIVertexFormat.SINT8x4:
      case MSpec.RHIVertexFormat.UNORM8x4:
      case MSpec.RHIVertexFormat.SNORM8x4:
        return 4;
      case MSpec.RHIVertexFormat.UINT16x2:
      case MSpec.RHIVertexFormat.SINT16x2:
      case MSpec.RHIVertexFormat.UNORM16x2:
      case MSpec.RHIVertexFormat.SNORM16x2:
      case MSpec.RHIVertexFormat.FLOAT16x2:
        return 4;
      case MSpec.RHIVertexFormat.UINT16x4:
      case MSpec.RHIVertexFormat.SINT16x4:
      case MSpec.RHIVertexFormat.UNORM16x4:
      case MSpec.RHIVertexFormat.SNORM16x4:
      case MSpec.RHIVertexFormat.FLOAT16x4:
        return 8;
      case MSpec.RHIVertexFormat.UINT32:
      case MSpec.RHIVertexFormat.SINT32:
        return 4;
      case MSpec.RHIVertexFormat.UINT32x2:
      case MSpec.RHIVertexFormat.SINT32x2:
        return 8;
      case MSpec.RHIVertexFormat.UINT32x3:
      case MSpec.RHIVertexFormat.SINT32x3:
        return 12;
      case MSpec.RHIVertexFormat.UINT32x4:
      case MSpec.RHIVertexFormat.SINT32x4:
        return 16;
      default:
        return 4;
    }
  }
}
