import { VertexAttribute } from '@maxellabs/specification';

/**
 * 几何体数据接口
 */
export interface GeometryData {
  attributes: {
    [key: string]: number[] | Float32Array;
  };
  indices: number[] | Uint16Array | Uint32Array;
  vertexCount?: number;
  indexCount?: number;
  boundingBox?: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

/**
 * 几何体创建选项
 */
export interface GeometryOptions {
  /** 是否使用32位索引 */
  use32BitIndices?: boolean;
  /** 是否计算包围盒 */
  computeBoundingBox?: boolean;
  /** 是否使用TypedArray */
  useTypedArrays?: boolean;
}

/**
 * 几何体工具类
 * 提供创建基本几何体的静态方法
 */
export class GeometryUtils {
  /**
   * 创建立方体几何体数据
   * @param width 宽度
   * @param height 高度
   * @param depth 深度
   * @param widthSegments 宽度分段数
   * @param heightSegments 高度分段数
   * @param depthSegments 深度分段数
   * @param options 创建选项
   * @returns 几何体数据对象
   */
  static createBox(
    width: number = 1,
    height: number = 1,
    depth: number = 1,
    widthSegments: number = 1,
    heightSegments: number = 1,
    depthSegments: number = 1,
    options: GeometryOptions = {}
  ): GeometryData {
    // 规范化分段数，至少为1
    widthSegments = Math.floor(Math.max(1, widthSegments));
    heightSegments = Math.floor(Math.max(1, heightSegments));
    depthSegments = Math.floor(Math.max(1, depthSegments));

    // 预计算顶点和索引数量
    const totalVertices =
      2 *
      ((widthSegments + 1) * (heightSegments + 1) +
        (widthSegments + 1) * (depthSegments + 1) +
        (depthSegments + 1) * (heightSegments + 1));

    const totalIndices =
      2 * (widthSegments * heightSegments + widthSegments * depthSegments + depthSegments * heightSegments) * 6;

    // 预分配数组容量
    const positions = options.useTypedArrays
      ? new Float32Array(totalVertices * 3)
      : new Array<number>(totalVertices * 3);
    const normals = options.useTypedArrays ? new Float32Array(totalVertices * 3) : new Array<number>(totalVertices * 3);
    const uvs = options.useTypedArrays ? new Float32Array(totalVertices * 2) : new Array<number>(totalVertices * 2);
    const indices = options.use32BitIndices ? new Uint32Array(totalIndices) : new Uint16Array(totalIndices);

    // 半尺寸
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    // 创建结果对象
    const result = {
      positions: positions as number[],
      normals: normals as number[],
      uvs: uvs as number[],
      indices: indices as unknown as number[],
      posIndex: 0,
      normalIndex: 0,
      uvIndex: 0,
      indexIndex: 0,
    };

    // 添加每个面的顶点数据
    let vertexCount = 0;

    // 前面 (Z+)
    vertexCount = this.addBoxFace(
      result,
      widthSegments,
      heightSegments,
      width,
      height,
      -1,
      -1,
      1, // 左下角起点位置
      1,
      0,
      0, // 水平方向
      0,
      1,
      0, // 垂直方向
      0,
      0,
      1, // 法线方向
      vertexCount
    );

    // 后面 (Z-)
    vertexCount = this.addBoxFace(
      result,
      widthSegments,
      heightSegments,
      width,
      height,
      1,
      -1,
      -1, // 左下角起点位置
      -1,
      0,
      0, // 水平方向
      0,
      1,
      0, // 垂直方向
      0,
      0,
      -1, // 法线方向
      vertexCount
    );

    // 上面 (Y+)
    vertexCount = this.addBoxFace(
      result,
      widthSegments,
      depthSegments,
      width,
      depth,
      -1,
      1,
      -1, // 左下角起点位置
      1,
      0,
      0, // 水平方向
      0,
      0,
      1, // 垂直方向
      0,
      1,
      0, // 法线方向
      vertexCount
    );

    // 下面 (Y-)
    vertexCount = this.addBoxFace(
      result,
      widthSegments,
      depthSegments,
      width,
      depth,
      -1,
      -1,
      1, // 左下角起点位置
      1,
      0,
      0, // 水平方向
      0,
      0,
      -1, // 垂直方向
      0,
      -1,
      0, // 法线方向
      vertexCount
    );

    // 右面 (X+)
    vertexCount = this.addBoxFace(
      result,
      depthSegments,
      heightSegments,
      depth,
      height,
      1,
      -1,
      -1, // 左下角起点位置
      0,
      0,
      1, // 水平方向
      0,
      1,
      0, // 垂直方向
      1,
      0,
      0, // 法线方向
      vertexCount
    );

    // 左面 (X-)
    vertexCount = this.addBoxFace(
      result,
      depthSegments,
      heightSegments,
      depth,
      height,
      -1,
      -1,
      1, // 左下角起点位置
      0,
      0,
      -1, // 水平方向
      0,
      1,
      0, // 垂直方向
      -1,
      0,
      0, // 法线方向
      vertexCount
    );

    // 缩放到正确尺寸
    for (let i = 0; i < result.posIndex; i += 3) {
      result.positions[i] *= halfWidth;
      result.positions[i + 1] *= halfHeight;
      result.positions[i + 2] *= halfDepth;
    }

    // 创建最终几何体数据
    const geometryData: GeometryData = {
      attributes: {
        [VertexAttribute.Position]: result.positions.slice(0, result.posIndex),
        [VertexAttribute.Normal]: result.normals.slice(0, result.normalIndex),
        [VertexAttribute.TexCoord0]: result.uvs.slice(0, result.uvIndex),
      },
      indices: result.indices.slice(0, result.indexIndex),
      vertexCount: vertexCount,
      indexCount: result.indexIndex,
    };

    // 计算包围盒
    if (options.computeBoundingBox) {
      geometryData.boundingBox = this.computeBoundingBox(geometryData.attributes[VertexAttribute.Position]);
    }

    // 验证几何体数据完整性
    if (!this.validateGeometry(geometryData)) {
      console.warn('创建的立方体几何体数据验证失败');
    }

    // 转换为TypedArray
    if (options.useTypedArrays) {
      return this.toTypedArrays(geometryData);
    }

    return geometryData;
  }

  /**
   * 添加立方体的一个面
   * @param result 结果对象
   * @param segmentsW 水平分段数
   * @param segmentsH 垂直分段数
   * @param width 宽度
   * @param height 高度
   * @param startX 起点X坐标
   * @param startY 起点Y坐标
   * @param startZ 起点Z坐标
   * @param uDirX U方向X分量
   * @param uDirY U方向Y分量
   * @param uDirZ U方向Z分量
   * @param vDirX V方向X分量
   * @param vDirY V方向Y分量
   * @param vDirZ V方向Z分量
   * @param normalX 法线X分量
   * @param normalY 法线Y分量
   * @param normalZ 法线Z分量
   * @param vertexOffset 顶点偏移
   * @returns 更新后的顶点数量
   */
  private static addBoxFace(
    result: {
      positions: number[];
      normals: number[];
      uvs: number[];
      indices: number[];
      posIndex: number;
      normalIndex: number;
      uvIndex: number;
      indexIndex: number;
    },
    segmentsW: number,
    segmentsH: number,
    width: number,
    height: number,
    startX: number,
    startY: number,
    startZ: number,
    uDirX: number,
    uDirY: number,
    uDirZ: number,
    vDirX: number,
    vDirY: number,
    vDirZ: number,
    normalX: number,
    normalY: number,
    normalZ: number,
    vertexOffset: number
  ): number {
    const { positions, normals, uvs, indices } = result;

    // 使用局部变量提高性能
    let posIdx = result.posIndex;
    let normalIdx = result.normalIndex;
    let uvIdx = result.uvIndex;
    let indexIdx = result.indexIndex;

    // 批量计算顶点
    const verticesPerRow = segmentsW + 1;
    const totalVertices = verticesPerRow * (segmentsH + 1);

    // 遍历网格点
    for (let y = 0; y <= segmentsH; y++) {
      const vPct = y / segmentsH;

      for (let x = 0; x <= segmentsW; x++) {
        const uPct = x / segmentsW;

        // 计算顶点位置
        const posX = startX + uDirX * uPct * width + vDirX * vPct * height;
        const posY = startY + uDirY * uPct * width + vDirY * vPct * height;
        const posZ = startZ + uDirZ * uPct * width + vDirZ * vPct * height;

        // 使用索引直接赋值而不是push
        positions[posIdx++] = posX;
        positions[posIdx++] = posY;
        positions[posIdx++] = posZ;

        normals[normalIdx++] = normalX;
        normals[normalIdx++] = normalY;
        normals[normalIdx++] = normalZ;

        uvs[uvIdx++] = uPct;
        uvs[uvIdx++] = vPct;
      }
    }

    // 批量添加索引
    for (let y = 0; y < segmentsH; y++) {
      for (let x = 0; x < segmentsW; x++) {
        // 每个单元格由两个三角形组成
        const v1 = vertexOffset + y * verticesPerRow + x;
        const v2 = v1 + 1;
        const v3 = v1 + verticesPerRow;
        const v4 = v3 + 1;

        // 第一个三角形
        indices[indexIdx++] = v1;
        indices[indexIdx++] = v2;
        indices[indexIdx++] = v3;

        // 第二个三角形
        indices[indexIdx++] = v2;
        indices[indexIdx++] = v4;
        indices[indexIdx++] = v3;
      }
    }

    // 更新索引
    result.posIndex = posIdx;
    result.normalIndex = normalIdx;
    result.uvIndex = uvIdx;
    result.indexIndex = indexIdx;

    return vertexOffset + totalVertices;
  }

  /**
   * 创建球体几何体数据
   * @param radius 半径
   * @param widthSegments 经度分段数
   * @param heightSegments 纬度分段数
   * @param phiStart 水平起始角度
   * @param phiLength 水平扫描角度
   * @param thetaStart 垂直起始角度
   * @param thetaLength 垂直扫描角度
   * @param options 创建选项
   * @returns 几何体数据对象
   */
  static createSphere(
    radius: number = 1,
    widthSegments: number = 32,
    heightSegments: number = 16,
    phiStart: number = 0,
    phiLength: number = Math.PI * 2,
    thetaStart: number = 0,
    thetaLength: number = Math.PI,
    options: GeometryOptions = {}
  ): GeometryData {
    // 规范化分段数
    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));

    const totalVertices = (widthSegments + 1) * (heightSegments + 1);
    const totalIndices = widthSegments * heightSegments * 6;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    positions.length = totalVertices * 3;
    normals.length = totalVertices * 3;
    uvs.length = totalVertices * 2;
    indices.length = totalIndices;

    let posIdx = 0;
    let normalIdx = 0;
    let uvIdx = 0;
    let indexIdx = 0;

    // 生成顶点
    for (let y = 0; y <= heightSegments; y++) {
      const thetaPct = y / heightSegments;
      const theta = thetaStart + thetaPct * thetaLength;

      for (let x = 0; x <= widthSegments; x++) {
        const phiPct = x / widthSegments;
        const phi = phiStart + phiPct * phiLength;

        // 计算球面坐标
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        // 顶点法线（归一化方向）
        const nx = sinPhi * sinTheta;
        const ny = cosTheta;
        const nz = cosPhi * sinTheta;

        // 顶点位置
        positions[posIdx++] = radius * nx;
        positions[posIdx++] = radius * ny;
        positions[posIdx++] = radius * nz;

        normals[normalIdx++] = nx;
        normals[normalIdx++] = ny;
        normals[normalIdx++] = nz;

        uvs[uvIdx++] = phiPct;
        uvs[uvIdx++] = 1 - thetaPct;
      }
    }

    // 生成索引
    for (let y = 0; y < heightSegments; y++) {
      const rowStart = y * (widthSegments + 1);
      const nextRowStart = (y + 1) * (widthSegments + 1);

      for (let x = 0; x < widthSegments; x++) {
        const current = rowStart + x;
        const next = current + 1;
        const nextRow = nextRowStart + x;
        const nextRowNext = nextRow + 1;

        // 两个三角形
        indices[indexIdx++] = current;
        indices[indexIdx++] = next;
        indices[indexIdx++] = nextRow;

        indices[indexIdx++] = next;
        indices[indexIdx++] = nextRowNext;
        indices[indexIdx++] = nextRow;
      }
    }

    const geometryData: GeometryData = {
      attributes: {
        [VertexAttribute.Position]: positions,
        [VertexAttribute.Normal]: normals,
        [VertexAttribute.TexCoord0]: uvs,
      },
      indices: indices,
      vertexCount: totalVertices,
      indexCount: indexIdx,
    };

    if (options.computeBoundingBox) {
      geometryData.boundingBox = this.computeBoundingBox(positions);
    }

    if (options.useTypedArrays) {
      return this.toTypedArrays(geometryData);
    }

    return geometryData;
  }

  /**
   * 创建平面几何体数据
   * @param width 宽度
   * @param height 高度
   * @param widthSegments 宽度分段数
   * @param heightSegments 高度分段数
   * @param options 创建选项
   * @returns 几何体数据对象
   */
  static createPlane(
    width: number = 1,
    height: number = 1,
    widthSegments: number = 1,
    heightSegments: number = 1,
    options: GeometryOptions = {}
  ): GeometryData {
    // 规范化分段数
    widthSegments = Math.floor(Math.max(1, widthSegments));
    heightSegments = Math.floor(Math.max(1, heightSegments));

    const totalVertices = (widthSegments + 1) * (heightSegments + 1);

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // 半尺寸
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // 分段大小
    const segmentWidth = width / widthSegments;
    const segmentHeight = height / heightSegments;

    let posIdx = 0;
    let normalIdx = 0;
    let uvIdx = 0;
    let indexIdx = 0;

    // 生成顶点
    for (let y = 0; y <= heightSegments; y++) {
      const py = y * segmentHeight - halfHeight;

      for (let x = 0; x <= widthSegments; x++) {
        const px = x * segmentWidth - halfWidth;

        // 位置
        positions[posIdx++] = px;
        positions[posIdx++] = 0;
        positions[posIdx++] = py;

        // 法线（朝上）
        normals[normalIdx++] = 0;
        normals[normalIdx++] = 1;
        normals[normalIdx++] = 0;

        // UV
        uvs[uvIdx++] = x / widthSegments;
        uvs[uvIdx++] = 1 - y / heightSegments;
      }
    }

    // 生成索引
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = y * (widthSegments + 1) + x;
        const b = a + 1;
        const c = a + (widthSegments + 1);
        const d = c + 1;

        // 两个三角形
        indices[indexIdx++] = a;
        indices[indexIdx++] = b;
        indices[indexIdx++] = c;

        indices[indexIdx++] = b;
        indices[indexIdx++] = d;
        indices[indexIdx++] = c;
      }
    }

    const geometryData: GeometryData = {
      attributes: {
        [VertexAttribute.Position]: positions,
        [VertexAttribute.Normal]: normals,
        [VertexAttribute.TexCoord0]: uvs,
      },
      indices: indices,
      vertexCount: totalVertices,
      indexCount: indexIdx,
    };

    if (options.computeBoundingBox) {
      geometryData.boundingBox = this.computeBoundingBox(positions);
    }

    if (options.useTypedArrays) {
      return this.toTypedArrays(geometryData);
    }

    return geometryData;
  }

  /**
   * 创建圆柱体几何体数据
   * @param radiusTop 顶部半径
   * @param radiusBottom 底部半径
   * @param height 高度
   * @param radialSegments 径向分段数
   * @param heightSegments 高度分段数
   * @param openEnded 是否开口（不包含顶部和底部）
   * @param options 创建选项
   * @returns 几何体数据对象
   */
  static createCylinder(
    radiusTop: number = 1,
    radiusBottom: number = 1,
    height: number = 1,
    radialSegments: number = 32,
    heightSegments: number = 1,
    openEnded: boolean = false,
    options: GeometryOptions = {}
  ): GeometryData {
    // 规范化分段数
    radialSegments = Math.floor(Math.max(3, radialSegments));
    heightSegments = Math.floor(Math.max(1, heightSegments));

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // 临时变量
    const halfHeight = height / 2;
    let index = 0;

    // 生成圆柱侧面顶点
    const indexArray: number[][] = [];

    // 生成顶点
    for (let y = 0; y <= heightSegments; y++) {
      const indexRow: number[] = [];
      const v = y / heightSegments;

      // 在高度的百分比位置计算半径
      const radius = v * (radiusBottom - radiusTop) + radiusTop;

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * Math.PI * 2;

        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        // 顶点位置
        const px = radius * sinTheta;
        const py = -v * height + halfHeight;
        const pz = radius * cosTheta;

        positions.push(px, py, pz);

        // 顶点法线
        const slope = (radiusBottom - radiusTop) / height;
        const nx = sinTheta;
        const ny = slope;
        const nz = cosTheta;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

        normals.push(nx / len, ny / len, nz / len);

        // 顶点UV
        uvs.push(u, 1 - v);

        indexRow.push(index++);
      }

      indexArray.push(indexRow);
    }

    // 生成侧面索引
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < radialSegments; x++) {
        const a = indexArray[y][x];
        const b = indexArray[y + 1][x];
        const c = indexArray[y + 1][x + 1];
        const d = indexArray[y][x + 1];

        // 两个三角形
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    // 如果不是开口的，则添加顶面和底面
    if (!openEnded) {
      // 添加顶部圆面
      if (radiusTop > 0) {
        const topIndex = index;

        // 中心点
        positions.push(0, halfHeight, 0);
        normals.push(0, 1, 0);
        uvs.push(0.5, 0.5);
        index++;

        // 添加边缘顶点
        for (let x = 0; x <= radialSegments; x++) {
          const u = x / radialSegments;
          const theta = u * Math.PI * 2;

          const sinTheta = Math.sin(theta);
          const cosTheta = Math.cos(theta);

          positions.push(radiusTop * sinTheta, halfHeight, radiusTop * cosTheta);
          normals.push(0, 1, 0);
          uvs.push(0.5 + 0.5 * sinTheta, 0.5 + 0.5 * cosTheta);

          index++;
        }

        // 添加三角形索引
        for (let x = 0; x < radialSegments; x++) {
          indices.push(topIndex, topIndex + x + 1, topIndex + x + 2);
        }
      }

      // 添加底部圆面
      if (radiusBottom > 0) {
        const bottomIndex = index;

        // 中心点
        positions.push(0, -halfHeight, 0);
        normals.push(0, -1, 0);
        uvs.push(0.5, 0.5);
        index++;

        // 添加边缘顶点
        for (let x = 0; x <= radialSegments; x++) {
          const u = x / radialSegments;
          const theta = u * Math.PI * 2;

          const sinTheta = Math.sin(theta);
          const cosTheta = Math.cos(theta);

          positions.push(radiusBottom * sinTheta, -halfHeight, radiusBottom * cosTheta);
          normals.push(0, -1, 0);
          uvs.push(0.5 + 0.5 * sinTheta, 0.5 + 0.5 * cosTheta);

          index++;
        }

        // 添加三角形索引（注意底面要反向）
        for (let x = 0; x < radialSegments; x++) {
          indices.push(bottomIndex, bottomIndex + x + 2, bottomIndex + x + 1);
        }
      }
    }

    const geometryData: GeometryData = {
      attributes: {
        [VertexAttribute.Position]: positions,
        [VertexAttribute.Normal]: normals,
        [VertexAttribute.TexCoord0]: uvs,
      },
      indices: indices,
      vertexCount: index,
      indexCount: indices.length,
    };

    if (options.computeBoundingBox) {
      geometryData.boundingBox = this.computeBoundingBox(positions);
    }

    if (options.useTypedArrays) {
      return this.toTypedArrays(geometryData);
    }

    return geometryData;
  }

  /**
   * 计算几何体包围盒
   */
  static computeBoundingBox(positions: number[] | Float32Array): {
    min: [number, number, number];
    max: [number, number, number];
  } {
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    }

    return {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    };
  }

  /**
   * 转换为TypedArray
   */
  static toTypedArrays(data: GeometryData): GeometryData {
    const result: GeometryData = {
      attributes: {},
      indices:
        data.indices instanceof Array
          ? new (data.indices.length > 65535 ? Uint32Array : Uint16Array)(data.indices)
          : data.indices,
      vertexCount: data.vertexCount,
      indexCount: data.indexCount,
      boundingBox: data.boundingBox,
    };

    // 转换属性数组
    for (const [key, value] of Object.entries(data.attributes)) {
      result.attributes[key] = value instanceof Array ? new Float32Array(value) : value;
    }

    return result;
  }

  /**
   * 验证几何体数据完整性
   */
  static validateGeometry(data: GeometryData): boolean {
    const positions = data.attributes[VertexAttribute.Position];
    const normals = data.attributes[VertexAttribute.Normal];
    const uvs = data.attributes[VertexAttribute.TexCoord0];

    // 检查基本属性存在
    if (!positions || positions.length === 0) {
      console.error('几何体缺少位置属性');
      return false;
    }

    if (!normals || normals.length !== positions.length) {
      console.error('几何体法线数量与位置不匹配');
      return false;
    }

    if (!uvs || uvs.length !== (positions.length / 3) * 2) {
      console.error('几何体UV坐标数量不正确');
      return false;
    }

    // 检查索引有效性
    const maxIndex = positions.length / 3 - 1;
    for (let i = 0; i < data.indices.length; i++) {
      if (data.indices[i] > maxIndex) {
        console.error(`无效的索引值: ${data.indices[i]}, 最大允许: ${maxIndex}`);
        return false;
      }
    }

    // 检查索引数量是否为3的倍数
    if (data.indices.length % 3 !== 0) {
      console.error('索引数量必须是3的倍数（三角形）');
      return false;
    }

    return true;
  }

  /**
   * 计算几何体的切线向量
   */
  static computeTangents(data: GeometryData): void {
    const positions = data.attributes[VertexAttribute.Position] as number[];
    const normals = data.attributes[VertexAttribute.Normal] as number[];
    const uvs = data.attributes[VertexAttribute.TexCoord0] as number[];
    const indices = data.indices as number[];

    const tangents = new Array<number>(positions.length);
    const bitangents = new Array<number>(positions.length);

    // 初始化为零
    tangents.fill(0);
    bitangents.fill(0);

    // 计算每个三角形的切线和副切线
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i];
      const i2 = indices[i + 1];
      const i3 = indices[i + 2];

      // 获取顶点位置
      const x1 = positions[i1 * 3],
        y1 = positions[i1 * 3 + 1],
        z1 = positions[i1 * 3 + 2];
      const x2 = positions[i2 * 3],
        y2 = positions[i2 * 3 + 1],
        z2 = positions[i2 * 3 + 2];
      const x3 = positions[i3 * 3],
        y3 = positions[i3 * 3 + 1],
        z3 = positions[i3 * 3 + 2];

      // 获取UV坐标
      const u1 = uvs[i1 * 2],
        v1 = uvs[i1 * 2 + 1];
      const u2 = uvs[i2 * 2],
        v2 = uvs[i2 * 2 + 1];
      const u3 = uvs[i3 * 2],
        v3 = uvs[i3 * 2 + 1];

      // 计算边向量
      const dx1 = x2 - x1,
        dy1 = y2 - y1,
        dz1 = z2 - z1;
      const dx2 = x3 - x1,
        dy2 = y3 - y1,
        dz2 = z3 - z1;

      // 计算UV增量
      const du1 = u2 - u1,
        dv1 = v2 - v1;
      const du2 = u3 - u1,
        dv2 = v3 - v1;

      // 计算切线和副切线
      const det = du1 * dv2 - du2 * dv1;

      if (Math.abs(det) > 1e-6) {
        const invDet = 1.0 / det;

        const tx = invDet * (dv2 * dx1 - dv1 * dx2);
        const ty = invDet * (dv2 * dy1 - dv1 * dy2);
        const tz = invDet * (dv2 * dz1 - dv1 * dz2);

        // 累加到顶点
        for (const idx of [i1, i2, i3]) {
          tangents[idx * 3] += tx;
          tangents[idx * 3 + 1] += ty;
          tangents[idx * 3 + 2] += tz;
        }
      }
    }

    // 正交化和归一化切线
    for (let i = 0; i < positions.length / 3; i++) {
      const nx = normals[i * 3];
      const ny = normals[i * 3 + 1];
      const nz = normals[i * 3 + 2];

      let tx = tangents[i * 3];
      let ty = tangents[i * 3 + 1];
      let tz = tangents[i * 3 + 2];

      // Gram-Schmidt正交化
      const dot = nx * tx + ny * ty + nz * tz;
      tx -= nx * dot;
      ty -= ny * dot;
      tz -= nz * dot;

      // 归一化
      const len = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (len > 1e-6) {
        tangents[i * 3] = tx / len;
        tangents[i * 3 + 1] = ty / len;
        tangents[i * 3 + 2] = tz / len;
      } else {
        tangents[i * 3] = 1;
        tangents[i * 3 + 1] = 0;
        tangents[i * 3 + 2] = 0;
      }
    }

    data.attributes[VertexAttribute.Tangent] = tangents;
  }
}
