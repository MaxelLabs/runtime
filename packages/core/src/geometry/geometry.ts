import { Vector2, Vector3 } from '@maxellabs/math';
import { ReferResource } from '../base/refer-resource';

/**
 * 网格属性类型
 */
export enum AttributeType {
  /** 顶点位置 */
  Position,
  /** 顶点法线 */
  Normal,
  /** 纹理坐标 */
  UV,
  /** 顶点颜色 */
  Color,
  /** 切线 */
  Tangent,
  /** 骨骼权重 */
  BoneWeight,
  /** 骨骼索引 */
  BoneIndex,
  /** 自定义属性 */
  Custom,
}

/**
 * 几何体属性接口
 */
export interface GeometryAttribute {
  /** 属性类型 */
  type: AttributeType;
  /** 属性名称（用于自定义属性） */
  name?: string;
  /** 每个顶点的分量数 */
  size: number;
  /** 属性数据 */
  data: Float32Array;
  /** 是否需要更新 */
  dirty?: boolean;
}

/**
 * 几何体基类，定义3D对象的形状
 */
export class Geometry extends ReferResource {
  /** 顶点属性 */
  private _attributes: Map<AttributeType, GeometryAttribute> = new Map();
  /** 自定义属性 */
  private _customAttributes: Map<string, GeometryAttribute> = new Map();
  /** 索引数据 */
  private _indices: Uint16Array | Uint32Array | null = null;
  /** 索引是否需要更新 */
  private _indicesDirty: boolean = false;
  /** 包围盒最小点 */
  private _boundingBoxMin: Vector3 | null = null;
  /** 包围盒最大点 */
  private _boundingBoxMax: Vector3 | null = null;
  /** 包围盒是否需要更新 */
  private _boundingBoxDirty: boolean = true;

  /**
   * 创建一个新的几何体
   */
  constructor() {
    super();
  }

  /**
   * 设置顶点位置属性
   * @param positions 顶点位置数据，每3个值表示一个顶点的xyz坐标
   */
  setPositions(positions: Float32Array | number[]): void {
    const data = positions instanceof Float32Array ? positions : new Float32Array(positions);

    this._attributes.set(AttributeType.Position, {
      type: AttributeType.Position,
      size: 3,
      data,
      dirty: true,
    });

    // 设置顶点位置时，需要更新包围盒
    this._boundingBoxDirty = true;
  }

  /**
   * 获取顶点位置数据
   * @returns 顶点位置数据
   */
  getPositions(): Float32Array | null {
    const attr = this._attributes.get(AttributeType.Position);

    return attr ? attr.data : null;
  }

  /**
   * 设置顶点法线属性
   * @param normals 顶点法线数据，每3个值表示一个顶点的法线向量
   */
  setNormals(normals: Float32Array | number[]): void {
    const data = normals instanceof Float32Array ? normals : new Float32Array(normals);

    this._attributes.set(AttributeType.Normal, {
      type: AttributeType.Normal,
      size: 3,
      data,
      dirty: true,
    });
  }

  /**
   * 获取顶点法线数据
   * @returns 顶点法线数据
   */
  getNormals(): Float32Array | null {
    const attr = this._attributes.get(AttributeType.Normal);

    return attr ? attr.data : null;
  }

  /**
   * 设置纹理坐标属性
   * @param uvs 纹理坐标数据，每2个值表示一个顶点的uv坐标
   */
  setUVs(uvs: Float32Array | number[]): void {
    const data = uvs instanceof Float32Array ? uvs : new Float32Array(uvs);

    this._attributes.set(AttributeType.UV, {
      type: AttributeType.UV,
      size: 2,
      data,
      dirty: true,
    });
  }

  /**
   * 获取纹理坐标数据
   * @returns 纹理坐标数据
   */
  getUVs(): Float32Array | null {
    const attr = this._attributes.get(AttributeType.UV);

    return attr ? attr.data : null;
  }

  /**
   * 设置顶点颜色属性
   * @param colors 顶点颜色数据，每4个值表示一个顶点的rgba颜色
   */
  setColors(colors: Float32Array | number[]): void {
    const data = colors instanceof Float32Array ? colors : new Float32Array(colors);

    this._attributes.set(AttributeType.Color, {
      type: AttributeType.Color,
      size: 4,
      data,
      dirty: true,
    });
  }

  /**
   * 获取顶点颜色数据
   * @returns 顶点颜色数据
   */
  getColors(): Float32Array | null {
    const attr = this._attributes.get(AttributeType.Color);

    return attr ? attr.data : null;
  }

  /**
   * 设置顶点切线属性
   * @param tangents 顶点切线数据，每4个值表示一个顶点的切线向量和手性
   */
  setTangents(tangents: Float32Array | number[]): void {
    const data = tangents instanceof Float32Array ? tangents : new Float32Array(tangents);

    this._attributes.set(AttributeType.Tangent, {
      type: AttributeType.Tangent,
      size: 4,
      data,
      dirty: true,
    });
  }

  /**
   * 获取顶点切线数据
   * @returns 顶点切线数据
   */
  getTangents(): Float32Array | null {
    const attr = this._attributes.get(AttributeType.Tangent);

    return attr ? attr.data : null;
  }

  /**
   * 设置自定义顶点属性
   * @param name 属性名称
   * @param size 每个顶点的分量数
   * @param data 属性数据
   */
  setCustomAttribute(name: string, size: number, data: Float32Array | number[]): void {
    const attributeData = data instanceof Float32Array ? data : new Float32Array(data);

    const attribute: GeometryAttribute = {
      type: AttributeType.Custom,
      name,
      size,
      data: attributeData,
      dirty: true,
    };

    this._customAttributes.set(name, attribute);
  }

  /**
   * 获取自定义顶点属性
   * @param name 属性名称
   * @returns 属性数据
   */
  getCustomAttribute(name: string): Float32Array | null {
    const attr = this._customAttributes.get(name);

    return attr ? attr.data : null;
  }

  /**
   * 设置索引数据
   * @param indices 索引数据
   */
  setIndices(indices: Uint16Array | Uint32Array | number[]): void {
    if (indices instanceof Uint16Array || indices instanceof Uint32Array) {
      this._indices = indices;
    } else {
      // 根据索引值的大小决定使用16位还是32位索引
      const max = Math.max(...indices);

      if (max < 65536) {
        this._indices = new Uint16Array(indices);
      } else {
        this._indices = new Uint32Array(indices);
      }
    }
    this._indicesDirty = true;
  }

  /**
   * 获取索引数据
   * @returns 索引数据
   */
  getIndices(): Uint16Array | Uint32Array | null {
    return this._indices;
  }

  /**
   * 获取顶点数量
   * @returns 顶点数量
   */
  getVertexCount(): number {
    const positions = this.getPositions();

    return positions ? positions.length / 3 : 0;
  }

  /**
   * 获取索引数量
   * @returns 索引数量
   */
  getIndexCount(): number {
    return this._indices ? this._indices.length : 0;
  }

  /**
   * 计算表面法线
   * 根据顶点位置和索引计算每个顶点的法线
   */
  computeNormals(): void {
    const positions = this.getPositions();
    const indices = this.getIndices();

    if (!positions || !indices) {
      console.warn('Cannot compute normals: positions or indices are missing');

      return;
    }

    const vertexCount = this.getVertexCount();
    const normals = new Float32Array(vertexCount * 3);

    // 初始化法线为零向量
    for (let i = 0; i < normals.length; i++) {
      normals[i] = 0;
    }

    // 计算每个三角形的法线并累加到顶点
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i];
      const i2 = indices[i + 1];
      const i3 = indices[i + 2];

      // 获取三角形的三个顶点
      const p1x = positions[i1 * 3];
      const p1y = positions[i1 * 3 + 1];
      const p1z = positions[i1 * 3 + 2];

      const p2x = positions[i2 * 3];
      const p2y = positions[i2 * 3 + 1];
      const p2z = positions[i2 * 3 + 2];

      const p3x = positions[i3 * 3];
      const p3y = positions[i3 * 3 + 1];
      const p3z = positions[i3 * 3 + 2];

      // 计算两个边向量
      const e1x = p2x - p1x;
      const e1y = p2y - p1y;
      const e1z = p2z - p1z;

      const e2x = p3x - p1x;
      const e2y = p3y - p1y;
      const e2z = p3z - p1z;

      // 计算叉积得到法线
      const nx = e1y * e2z - e1z * e2y;
      const ny = e1z * e2x - e1x * e2z;
      const nz = e1x * e2y - e1y * e2x;

      // 将法线累加到三角形的三个顶点
      normals[i1 * 3] += nx;
      normals[i1 * 3 + 1] += ny;
      normals[i1 * 3 + 2] += nz;

      normals[i2 * 3] += nx;
      normals[i2 * 3 + 1] += ny;
      normals[i2 * 3 + 2] += nz;

      normals[i3 * 3] += nx;
      normals[i3 * 3 + 1] += ny;
      normals[i3 * 3 + 2] += nz;
    }

    // 归一化每个顶点的法线
    for (let i = 0; i < vertexCount; i++) {
      const nx = normals[i * 3];
      const ny = normals[i * 3 + 1];
      const nz = normals[i * 3 + 2];

      // 计算长度
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

      // 避免除以零
      if (length > 0) {
        normals[i * 3] = nx / length;
        normals[i * 3 + 1] = ny / length;
        normals[i * 3 + 2] = nz / length;
      }
    }

    // 设置法线属性
    this.setNormals(normals);
  }

  /**
   * 计算切线
   * 根据顶点位置、UV坐标和索引计算每个顶点的切线
   */
  computeTangents(): void {
    const positions = this.getPositions();
    const normals = this.getNormals();
    const uvs = this.getUVs();
    const indices = this.getIndices();

    if (!positions || !normals || !uvs || !indices) {
      console.warn('Cannot compute tangents: positions, normals, uvs or indices are missing');

      return;
    }

    const vertexCount = this.getVertexCount();
    const tangents = new Float32Array(vertexCount * 4);

    // 临时数组，存储计算过程中的切线和副切线
    const tempTangents: Vector3[] = [];
    const tempBitangents: Vector3[] = [];

    for (let i = 0; i < vertexCount; i++) {
      tempTangents.push(new Vector3());
      tempBitangents.push(new Vector3());
    }

    // 对每个三角形计算切线和副切线
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i];
      const i2 = indices[i + 1];
      const i3 = indices[i + 2];

      // 三角形的三个顶点位置
      const p1 = new Vector3(positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
      const p2 = new Vector3(positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
      const p3 = new Vector3(positions[i3 * 3], positions[i3 * 3 + 1], positions[i3 * 3 + 2]);

      // 三角形的三个顶点UV坐标
      const uv1 = new Vector2(uvs[i1 * 2], uvs[i1 * 2 + 1]);
      const uv2 = new Vector2(uvs[i2 * 2], uvs[i2 * 2 + 1]);
      const uv3 = new Vector2(uvs[i3 * 2], uvs[i3 * 2 + 1]);

      // 计算三角形两条边的方向向量
      const e1 = p2.subtract(p1);
      const e2 = p3.subtract(p1);

      // 计算UV坐标的差值
      const deltaUV1 = uv2.subtract(uv1);
      const deltaUV2 = uv3.subtract(uv1);

      // 计算切线和副切线
      const r = 1.0 / (deltaUV1.x * deltaUV2.y - deltaUV1.y * deltaUV2.x);

      const tangent = new Vector3(
        (deltaUV2.y * e1.x - deltaUV1.y * e2.x) * r,
        (deltaUV2.y * e1.y - deltaUV1.y * e2.y) * r,
        (deltaUV2.y * e1.z - deltaUV1.y * e2.z) * r
      );

      const bitangent = new Vector3(
        (deltaUV1.x * e2.x - deltaUV2.x * e1.x) * r,
        (deltaUV1.x * e2.y - deltaUV2.x * e1.y) * r,
        (deltaUV1.x * e2.z - deltaUV2.x * e1.z) * r
      );

      // 将计算出的切线和副切线累加到顶点
      tempTangents[i1].add(tangent);
      tempTangents[i2].add(tangent);
      tempTangents[i3].add(tangent);

      tempBitangents[i1].add(bitangent);
      tempBitangents[i2].add(bitangent);
      tempBitangents[i3].add(bitangent);
    }

    // 计算每个顶点的最终切线（正交化并计算手性）
    for (let i = 0; i < vertexCount; i++) {
      const n = new Vector3(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);

      const t = tempTangents[i];

      // 使切线与法线正交（Gram-Schmidt 正交化）
      const dot = n.dot(t);
      const orthoT = t.subtract(n.multiply(dot)).normalize();

      // 计算手性（确定副切线的方向）
      const b = tempBitangents[i];
      const nCrossT = n.cross(orthoT);
      const w = nCrossT.dot(b) > 0 ? 1 : -1;

      // 存储切线和手性
      tangents[i * 4] = orthoT.x;
      tangents[i * 4 + 1] = orthoT.y;
      tangents[i * 4 + 2] = orthoT.z;
      tangents[i * 4 + 3] = w;
    }

    // 设置切线属性
    this.setTangents(tangents);
  }

  /**
   * 计算包围盒
   */
  computeBoundingBox(): void {
    const positions = this.getPositions();

    if (!positions || positions.length === 0) {
      this._boundingBoxMin = new Vector3(0, 0, 0);
      this._boundingBoxMax = new Vector3(0, 0, 0);
      this._boundingBoxDirty = false;

      return;
    }

    // 初始化边界为第一个顶点
    const min = new Vector3(positions[0], positions[1], positions[2]);

    const max = new Vector3(positions[0], positions[1], positions[2]);

    // 遍历所有顶点，更新边界
    for (let i = 3; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      // 更新最小值
      min.x = Math.min(min.x, x);
      min.y = Math.min(min.y, y);
      min.z = Math.min(min.z, z);

      // 更新最大值
      max.x = Math.max(max.x, x);
      max.y = Math.max(max.y, y);
      max.z = Math.max(max.z, z);
    }

    this._boundingBoxMin = min;
    this._boundingBoxMax = max;
    this._boundingBoxDirty = false;
  }

  /**
   * 获取包围盒最小点
   * @returns 包围盒最小点
   */
  getBoundingBoxMin(): Vector3 {
    if (this._boundingBoxDirty) {
      this.computeBoundingBox();
    }

    return this._boundingBoxMin ? this._boundingBoxMin.clone() : new Vector3();
  }

  /**
   * 获取包围盒最大点
   * @returns 包围盒最大点
   */
  getBoundingBoxMax(): Vector3 {
    if (this._boundingBoxDirty) {
      this.computeBoundingBox();
    }

    return this._boundingBoxMax ? this._boundingBoxMax.clone() : new Vector3();
  }

  /**
   * 获取所有顶点属性
   * @returns 属性映射
   */
  getAttributes(): Map<AttributeType, GeometryAttribute> {
    return new Map(this._attributes);
  }

  /**
   * 获取所有自定义属性
   * @returns 自定义属性映射
   */
  getCustomAttributes(): Map<string, GeometryAttribute> {
    return new Map(this._customAttributes);
  }

  /**
   * 清除几何体数据
   */
  clear(): void {
    this._attributes.clear();
    this._customAttributes.clear();
    this._indices = null;
    this._boundingBoxMin = null;
    this._boundingBoxMax = null;
    this._boundingBoxDirty = true;
    this._indicesDirty = false;
  }

  /**
   * 复制几何体
   * @returns 几何体副本
   */
  clone(): Geometry {
    const geometry = new Geometry();

    // 复制所有属性
    for (const [type, attr] of this._attributes) {
      const clonedAttr: GeometryAttribute = {
        type: attr.type,
        name: attr.name,
        size: attr.size,
        data: new Float32Array(attr.data),
        dirty: true,
      };

      geometry._attributes.set(type, clonedAttr);
    }

    // 复制所有自定义属性
    for (const [name, attr] of this._customAttributes) {
      const clonedAttr: GeometryAttribute = {
        type: attr.type,
        name: attr.name,
        size: attr.size,
        data: new Float32Array(attr.data),
        dirty: true,
      };

      geometry._customAttributes.set(name, clonedAttr);
    }

    // 复制索引
    if (this._indices) {
      geometry._indices =
        this._indices instanceof Uint16Array ? new Uint16Array(this._indices) : new Uint32Array(this._indices);
      geometry._indicesDirty = true;
    }

    // 复制包围盒
    if (this._boundingBoxMin && this._boundingBoxMax) {
      geometry._boundingBoxMin = this._boundingBoxMin.clone();
      geometry._boundingBoxMax = this._boundingBoxMax.clone();
      geometry._boundingBoxDirty = false;
    } else {
      geometry._boundingBoxDirty = true;
    }

    return geometry;
  }

  /**
   * 释放几何体资源
   * 重写ReferResource的onDispose方法
   */
  protected override onDestroy(): void {
    this.clear();
  }
}
