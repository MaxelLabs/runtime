/**
 * GeometryBuilder - 几何体数据构建器
 *
 * @packageDocumentation
 *
 * @remarks
 * GeometryBuilder 提供构建几何体顶点数据的工具方法。
 *
 * ## 顶点布局
 * 标准顶点布局包含：
 * - position: vec3 (12 bytes)
 * - normal: vec3 (12 bytes)
 * - uv: vec2 (8 bytes)
 * - tangent: vec4 (16 bytes) [可选]
 *
 * ## 使用示例
 * ```typescript
 * const builder = new GeometryBuilder();
 * builder.addVertex([0, 0, 0], [0, 1, 0], [0.5, 0.5]);
 * builder.addVertex([1, 0, 0], [0, 1, 0], [1, 0.5]);
 * builder.addTriangle(0, 1, 2);
 *
 * const data = builder.build();
 * ```
 */

/**
 * 3D 向量元组类型
 */
export type Vec3Tuple = [number, number, number];

/**
 * 2D 向量元组类型
 */
export type Vec2Tuple = [number, number];

/**
 * 4D 向量元组类型
 */
export type Vec4Tuple = [number, number, number, number];

/**
 * 几何体数据结构
 */
export interface GeometryData {
  /** 顶点位置数组 (x, y, z) */
  positions: Float32Array;

  /** 顶点法线数组 (nx, ny, nz) */
  normals: Float32Array;

  /** 纹理坐标数组 (u, v) */
  uvs: Float32Array;

  /** 切线数组 (tx, ty, tz, tw) [可选] */
  tangents?: Float32Array;

  /** 索引数组 */
  indices: Uint16Array | Uint32Array;

  /** 顶点数量 */
  vertexCount: number;

  /** 索引数量 */
  indexCount: number;
}

/**
 * 顶点数据
 * @internal
 */
interface VertexData {
  position: Vec3Tuple;
  normal: Vec3Tuple;
  uv: Vec2Tuple;
  tangent?: Vec4Tuple;
}

/**
 * GeometryBuilder - 几何体构建器
 */
export class GeometryBuilder {
  /** 顶点数据 */
  private vertices: VertexData[] = [];

  /** 索引数据 */
  private indices: number[] = [];

  /** 是否计算切线 */
  private computeTangents: boolean;

  /**
   * 创建 GeometryBuilder
   * @param computeTangents 是否计算切线 (默认: true)
   */
  constructor(computeTangents: boolean = true) {
    this.computeTangents = computeTangents;
  }

  /**
   * 添加顶点
   * @param position 位置 [x, y, z]
   * @param normal 法线 [nx, ny, nz]
   * @param uv 纹理坐标 [u, v]
   * @param tangent 切线 [tx, ty, tz, tw] (可选)
   * @returns 顶点索引
   */
  addVertex(position: Vec3Tuple, normal: Vec3Tuple, uv: Vec2Tuple, tangent?: Vec4Tuple): number {
    const index = this.vertices.length;

    this.vertices.push({
      position: [position[0], position[1], position[2]],
      normal: [normal[0], normal[1], normal[2]],
      uv: [uv[0], uv[1]],
      tangent: tangent ? [tangent[0], tangent[1], tangent[2], tangent[3]] : undefined,
    });

    return index;
  }

  /**
   * 添加三角形
   * @param i0 顶点索引 0
   * @param i1 顶点索引 1
   * @param i2 顶点索引 2
   */
  addTriangle(i0: number, i1: number, i2: number): void {
    this.indices.push(i0, i1, i2);
  }

  /**
   * 添加四边形 (两个三角形)
   * @param i0 顶点索引 0 (左下)
   * @param i1 顶点索引 1 (右下)
   * @param i2 顶点索引 2 (右上)
   * @param i3 顶点索引 3 (左上)
   */
  addQuad(i0: number, i1: number, i2: number, i3: number): void {
    // 第一个三角形: 0-1-2
    this.indices.push(i0, i1, i2);
    // 第二个三角形: 0-2-3
    this.indices.push(i0, i2, i3);
  }

  /**
   * 获取顶点数量
   */
  get vertexCount(): number {
    return this.vertices.length;
  }

  /**
   * 获取索引数量
   */
  get indexCount(): number {
    return this.indices.length;
  }

  /**
   * 清空数据
   */
  clear(): void {
    this.vertices.length = 0;
    this.indices.length = 0;
  }

  /**
   * 构建几何体数据
   * @returns 几何体数据
   */
  build(): GeometryData {
    const vertexCount = this.vertices.length;
    const indexCount = this.indices.length;

    // 分配数组
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const tangents = this.computeTangents ? new Float32Array(vertexCount * 4) : undefined;

    // 填充数据
    for (let i = 0; i < vertexCount; i++) {
      const v = this.vertices[i];

      positions[i * 3 + 0] = v.position[0];
      positions[i * 3 + 1] = v.position[1];
      positions[i * 3 + 2] = v.position[2];

      normals[i * 3 + 0] = v.normal[0];
      normals[i * 3 + 1] = v.normal[1];
      normals[i * 3 + 2] = v.normal[2];

      uvs[i * 2 + 0] = v.uv[0];
      uvs[i * 2 + 1] = v.uv[1];

      if (tangents && v.tangent) {
        tangents[i * 4 + 0] = v.tangent[0];
        tangents[i * 4 + 1] = v.tangent[1];
        tangents[i * 4 + 2] = v.tangent[2];
        tangents[i * 4 + 3] = v.tangent[3];
      }
    }

    // 使用 16 位或 32 位索引
    const indices = vertexCount <= 65535 ? new Uint16Array(this.indices) : new Uint32Array(this.indices);

    // 如果需要计算切线且顶点没有切线数据
    if (this.computeTangents && tangents) {
      this.calculateTangents(positions, normals, uvs, indices, tangents);
    }

    return {
      positions,
      normals,
      uvs,
      tangents,
      indices,
      vertexCount,
      indexCount,
    };
  }

  /**
   * 计算切线
   * @internal
   */
  private calculateTangents(
    positions: Float32Array,
    normals: Float32Array,
    uvs: Float32Array,
    indices: Uint16Array | Uint32Array,
    tangents: Float32Array
  ): void {
    const vertexCount = positions.length / 3;
    const tan1 = new Float32Array(vertexCount * 3);
    const tan2 = new Float32Array(vertexCount * 3);

    // 遍历所有三角形
    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i];
      const i1 = indices[i + 1];
      const i2 = indices[i + 2];

      // 获取顶点位置
      const p0x = positions[i0 * 3],
        p0y = positions[i0 * 3 + 1],
        p0z = positions[i0 * 3 + 2];
      const p1x = positions[i1 * 3],
        p1y = positions[i1 * 3 + 1],
        p1z = positions[i1 * 3 + 2];
      const p2x = positions[i2 * 3],
        p2y = positions[i2 * 3 + 1],
        p2z = positions[i2 * 3 + 2];

      // 获取 UV
      const u0 = uvs[i0 * 2],
        v0 = uvs[i0 * 2 + 1];
      const u1 = uvs[i1 * 2],
        v1 = uvs[i1 * 2 + 1];
      const u2 = uvs[i2 * 2],
        v2 = uvs[i2 * 2 + 1];

      // 边向量
      const e1x = p1x - p0x,
        e1y = p1y - p0y,
        e1z = p1z - p0z;
      const e2x = p2x - p0x,
        e2y = p2y - p0y,
        e2z = p2z - p0z;

      // UV 差值
      const du1 = u1 - u0,
        dv1 = v1 - v0;
      const du2 = u2 - u0,
        dv2 = v2 - v0;

      const r = 1.0 / (du1 * dv2 - du2 * dv1 + 1e-10);

      // 切线方向
      const tx = (dv2 * e1x - dv1 * e2x) * r;
      const ty = (dv2 * e1y - dv1 * e2y) * r;
      const tz = (dv2 * e1z - dv1 * e2z) * r;

      // 副切线方向
      const bx = (du1 * e2x - du2 * e1x) * r;
      const by = (du1 * e2y - du2 * e1y) * r;
      const bz = (du1 * e2z - du2 * e1z) * r;

      // 累加到顶点
      tan1[i0 * 3] += tx;
      tan1[i0 * 3 + 1] += ty;
      tan1[i0 * 3 + 2] += tz;
      tan1[i1 * 3] += tx;
      tan1[i1 * 3 + 1] += ty;
      tan1[i1 * 3 + 2] += tz;
      tan1[i2 * 3] += tx;
      tan1[i2 * 3 + 1] += ty;
      tan1[i2 * 3 + 2] += tz;

      tan2[i0 * 3] += bx;
      tan2[i0 * 3 + 1] += by;
      tan2[i0 * 3 + 2] += bz;
      tan2[i1 * 3] += bx;
      tan2[i1 * 3 + 1] += by;
      tan2[i1 * 3 + 2] += bz;
      tan2[i2 * 3] += bx;
      tan2[i2 * 3 + 1] += by;
      tan2[i2 * 3 + 2] += bz;
    }

    // 正交化并归一化
    for (let i = 0; i < vertexCount; i++) {
      const nx = normals[i * 3],
        ny = normals[i * 3 + 1],
        nz = normals[i * 3 + 2];
      const tx = tan1[i * 3],
        ty = tan1[i * 3 + 1],
        tz = tan1[i * 3 + 2];

      // Gram-Schmidt 正交化
      const dot = nx * tx + ny * ty + nz * tz;
      let ox = tx - nx * dot;
      let oy = ty - ny * dot;
      let oz = tz - nz * dot;

      // 归一化
      const len = Math.sqrt(ox * ox + oy * oy + oz * oz) + 1e-10;
      ox /= len;
      oy /= len;
      oz /= len;

      // 计算 handedness (w 分量)
      const bx = tan2[i * 3],
        by = tan2[i * 3 + 1],
        bz = tan2[i * 3 + 2];
      const cx = ny * oz - nz * oy;
      const cy = nz * ox - nx * oz;
      const cz = nx * oy - ny * ox;
      const w = cx * bx + cy * by + cz * bz < 0 ? -1 : 1;

      tangents[i * 4] = ox;
      tangents[i * 4 + 1] = oy;
      tangents[i * 4 + 2] = oz;
      tangents[i * 4 + 3] = w;
    }
  }
}
