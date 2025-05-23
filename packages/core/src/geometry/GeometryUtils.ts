/**
 * 顶点属性枚举
 */
export enum VertexAttribute {
  Position = 'POSITION',
  Normal = 'NORMAL',
  Tangent = 'TANGENT',
  Color = 'COLOR',
  TexCoord0 = 'TEXCOORD_0',
  TexCoord1 = 'TEXCOORD_1',
  BoneIndex = 'JOINTS_0',
  BoneWeight = 'WEIGHTS_0',
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
   * @returns 几何体数据对象
   */
  static createBox(
    width: number = 1,
    height: number = 1,
    depth: number = 1,
    widthSegments: number = 1,
    heightSegments: number = 1,
    depthSegments: number = 1
  ): GeometryData {
    // 规范化分段数，至少为1
    widthSegments = Math.floor(Math.max(1, widthSegments));
    heightSegments = Math.floor(Math.max(1, heightSegments));
    depthSegments = Math.floor(Math.max(1, depthSegments));

    // 半尺寸
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    // 创建六个面
    const result = {
      positions: [] as number[],
      normals: [] as number[],
      uvs: [] as number[],
      indices: [] as number[],
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
    for (let i = 0; i < result.positions.length; i += 3) {
      result.positions[i] *= halfWidth;
      result.positions[i + 1] *= halfHeight;
      result.positions[i + 2] *= halfDepth;
    }

    return {
      attributes: {
        [VertexAttribute.Position]: result.positions,
        [VertexAttribute.Normal]: result.normals,
        [VertexAttribute.TexCoord0]: result.uvs,
      },
      indices: result.indices,
    };
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
    result: { positions: number[]; normals: number[]; uvs: number[]; indices: number[] },
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

    // 遍历网格点
    for (let y = 0; y <= segmentsH; y++) {
      const vPct = y / segmentsH;

      for (let x = 0; x <= segmentsW; x++) {
        const uPct = x / segmentsW;

        // 计算顶点位置
        const posX = startX + uDirX * uPct * width + vDirX * vPct * height;
        const posY = startY + uDirY * uPct * width + vDirY * vPct * height;
        const posZ = startZ + uDirZ * uPct * width + vDirZ * vPct * height;

        // 添加顶点
        positions.push(posX, posY, posZ);

        // 添加法线
        normals.push(normalX, normalY, normalZ);

        // 添加UV
        uvs.push(uPct, vPct);
      }
    }

    // 添加索引
    const rowVerts = segmentsW + 1;

    for (let y = 0; y < segmentsH; y++) {
      for (let x = 0; x < segmentsW; x++) {
        // 每个单元格由两个三角形组成
        const v1 = vertexOffset + y * rowVerts + x;
        const v2 = vertexOffset + y * rowVerts + x + 1;
        const v3 = vertexOffset + (y + 1) * rowVerts + x + 1;
        const v4 = vertexOffset + (y + 1) * rowVerts + x;

        // 添加两个三角形
        indices.push(v1, v2, v4);
        indices.push(v2, v3, v4);
      }
    }

    // 返回新的顶点偏移
    return vertexOffset + (segmentsW + 1) * (segmentsH + 1);
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
   * @returns 几何体数据对象
   */
  static createSphere(
    radius: number = 1,
    widthSegments: number = 32,
    heightSegments: number = 16,
    phiStart: number = 0,
    phiLength: number = Math.PI * 2,
    thetaStart: number = 0,
    thetaLength: number = Math.PI
  ): GeometryData {
    // 规范化分段数
    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

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
        const px = radius * nx;
        const py = radius * ny;
        const pz = radius * nz;

        // 添加顶点数据
        positions.push(px, py, pz);
        normals.push(nx, ny, nz);
        uvs.push(phiPct, 1 - thetaPct);
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
        indices.push(current, next, nextRow);
        indices.push(next, nextRowNext, nextRow);
      }
    }

    return {
      attributes: {
        [VertexAttribute.Position]: positions,
        [VertexAttribute.Normal]: normals,
        [VertexAttribute.TexCoord0]: uvs,
      },
      indices: indices,
    };
  }

  /**
   * 创建平面几何体数据
   * @param width 宽度
   * @param height 高度
   * @param widthSegments 宽度分段数
   * @param heightSegments 高度分段数
   * @returns 几何体数据对象
   */
  static createPlane(
    width: number = 1,
    height: number = 1,
    widthSegments: number = 1,
    heightSegments: number = 1
  ): GeometryData {
    // 规范化分段数
    widthSegments = Math.floor(Math.max(1, widthSegments));
    heightSegments = Math.floor(Math.max(1, heightSegments));

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

    // 生成顶点
    for (let y = 0; y <= heightSegments; y++) {
      const py = y * segmentHeight - halfHeight;

      for (let x = 0; x <= widthSegments; x++) {
        const px = x * segmentWidth - halfWidth;

        // 位置
        positions.push(px, 0, py);

        // 法线（朝上）
        normals.push(0, 1, 0);

        // UV
        uvs.push(x / widthSegments, 1 - y / heightSegments);
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
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    return {
      attributes: {
        [VertexAttribute.Position]: positions,
        [VertexAttribute.Normal]: normals,
        [VertexAttribute.TexCoord0]: uvs,
      },
      indices: indices,
    };
  }

  /**
   * 创建圆柱体几何体数据
   * @param radiusTop 顶部半径
   * @param radiusBottom 底部半径
   * @param height 高度
   * @param radialSegments 径向分段数
   * @param heightSegments 高度分段数
   * @param openEnded 是否开口（不包含顶部和底部）
   * @returns 几何体数据对象
   */
  static createCylinder(
    radiusTop: number = 1,
    radiusBottom: number = 1,
    height: number = 1,
    radialSegments: number = 32,
    heightSegments: number = 1,
    openEnded: boolean = false
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
        const nx = sinTheta;
        const ny = 0;
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

    return {
      attributes: {
        [VertexAttribute.Position]: positions,
        [VertexAttribute.Normal]: normals,
        [VertexAttribute.TexCoord0]: uvs,
      },
      indices: indices,
    };
  }
}

/**
 * 几何体数据接口
 */
export interface GeometryData {
  attributes: {
    [key: string]: number[];
  };
  indices: number[];
}
