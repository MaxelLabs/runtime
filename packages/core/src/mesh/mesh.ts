/**
 * mesh.ts
 * 网格系统实现
 *
 * 基于规范包的MeshGeometry接口实现，遵循规范包优先原则
 */

import { Resource, ResourceType } from '../resource/resource';
import {
  type MeshGeometry,
  type GeometryProperties,
  type MaterialBinding,
  type LODConfiguration,
  TopologyType,
  GeometryType,
  VertexAttribute,
  UsdDataType,
} from '@maxellabs/math';
import type { UsdValue, BoundingBox, BoundingSphere, VertexAttributeDescriptor } from '@maxellabs/math';
import type { IRHIDevice } from '../interface/rhi/device';
import type { IRHIBuffer } from '../interface/rhi/resources/buffer';
import type { IRHIVertexArray } from '../interface/rhi/resources/vertexArray';
import { RHIBufferUsage } from '../interface/rhi/types/enums';
import { EventEmitter } from '../base/event-emitter';

/**
 * 网格事件类型
 */
export enum MeshEvent {
  /** 网格数据更新 */
  DATA_UPDATED = 'dataUpdated',
  /** 网格编译完成 */
  COMPILED = 'compiled',
  /** 网格编译失败 */
  COMPILE_FAILED = 'compileFailed',
  /** 包围盒更新 */
  BOUNDS_UPDATED = 'boundsUpdated',
}

/**
 * 网格实现类
 *
 * 实现规范包的MeshGeometry接口，提供完整的网格功能
 */
export class Mesh extends Resource implements MeshGeometry {
  readonly typeName = 'Geometry' as const;

  /**
   * 网格属性
   */
  attributes: {
    points: UsdValue;
    faceVertexIndices: UsdValue;
    faceVertexCounts: UsdValue;
    normals?: UsdValue;
    uvs?: UsdValue;
    colors?: UsdValue;
    tangents?: UsdValue;
    bitangents?: UsdValue;
  };

  /**
   * 几何体属性
   */
  properties: GeometryProperties;

  /**
   * 材质绑定
   */
  materialBinding?: MaterialBinding[];

  /**
   * LOD配置
   */
  lodConfig?: LODConfiguration;

  /**
   * 网格关系
   */
  relationships: Record<string, string[]> = {};

  /**
   * 子对象
   */
  children: any[] = [];

  /**
   * 元数据
   */
  override metadata: Record<string, any> = {};

  /**
   * 事件分发器
   */
  private eventEmitter = new EventEmitter<Record<MeshEvent, any>>();

  /**
   * RHI设备引用
   */
  private device: IRHIDevice | null = null;

  /**
   * 顶点缓冲区
   */
  private vertexBuffers = new Map<VertexAttribute, IRHIBuffer>();

  /**
   * 索引缓冲区
   */
  private indexBuffer: IRHIBuffer | null = null;

  /**
   * 顶点数组对象
   */
  private vertexArray: IRHIVertexArray | null = null;

  /**
   * 顶点属性
   */
  private vertexAttributes = new Map<VertexAttribute, VertexAttributeDescriptor>();

  /**
   * 索引数据
   */
  private indices: Uint16Array | Uint32Array | null = null;

  /**
   * 是否需要重新编译
   */
  private needsRecompile = true;

  /**
   * 网格路径（实现MeshGeometry接口）
   */
  readonly path: string;

  /**
   * 是否激活（实现MeshGeometry接口）
   */
  readonly active: boolean = true;

  /**
   * 构造函数
   */
  constructor(name: string = 'Mesh') {
    super(ResourceType.MESH, name);

    // 初始化路径
    this.path = `/geometry/${name}`;

    // 初始化默认属性
    this.attributes = {
      points: { value: [], type: UsdDataType.Point3f },
      faceVertexIndices: { value: [], type: UsdDataType.Int },
      faceVertexCounts: { value: [], type: UsdDataType.Int },
    };

    // 初始化几何体属性
    this.properties = {
      boundingBox: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      },
      boundingSphere: {
        center: { x: 0, y: 0, z: 0 },
        radius: { value: 0, type: UsdDataType.Float },
      },
      vertexCount: 0,
      faceCount: 0,
      triangleCount: 0,
      geometryType: GeometryType.Mesh as any,
      topology: TopologyType.Triangles,
      isClosed: false,
      hasUVs: false,
      hasNormals: false,
      hasVertexColors: false,
    };
  }

  /**
   * 设置RHI设备
   */
  setDevice(device: IRHIDevice): void {
    this.device = device;
    this.needsRecompile = true;
  }

  /**
   * 设置顶点位置
   */
  setPositions(positions: Float32Array): void {
    this.setVertexAttribute(VertexAttribute.Position, {
      type: VertexAttribute.Position,
      data: positions,
      componentCount: 3,
      normalized: false,
      stride: 0,
      offset: 0,
    });

    // 更新属性
    this.attributes.points.value = Array.from(positions);
    this.properties.vertexCount = positions.length / 3;

    this.updateBounds();
    this.needsRecompile = true;
    this.eventEmitter.emit(MeshEvent.DATA_UPDATED, { attribute: 'positions' });
  }

  /**
   * 设置法线
   */
  setNormals(normals: Float32Array): void {
    this.setVertexAttribute(VertexAttribute.Normal, {
      type: VertexAttribute.Normal,
      data: normals,
      componentCount: 3,
      normalized: false,
      stride: 0,
      offset: 0,
    });

    this.attributes.normals = { value: Array.from(normals), type: UsdDataType.Normal3f };
    this.properties.hasNormals = true;

    this.needsRecompile = true;
    this.eventEmitter.emit(MeshEvent.DATA_UPDATED, { attribute: 'normals' });
  }

  /**
   * 设置UV坐标
   */
  setUVs(uvs: Float32Array): void {
    this.setVertexAttribute(VertexAttribute.TexCoord0, {
      type: VertexAttribute.TexCoord0,
      data: uvs,
      componentCount: 2,
      normalized: false,
      stride: 0,
      offset: 0,
    });

    this.attributes.uvs = { value: Array.from(uvs), type: UsdDataType.Vector2f };
    this.properties.hasUVs = true;

    this.needsRecompile = true;
    this.eventEmitter.emit(MeshEvent.DATA_UPDATED, { attribute: 'uvs' });
  }

  /**
   * 设置顶点颜色
   */
  setColors(colors: Float32Array): void {
    this.setVertexAttribute(VertexAttribute.Color, {
      type: VertexAttribute.Color,
      data: colors,
      componentCount: 4,
      normalized: false,
      stride: 0,
      offset: 0,
    });

    this.attributes.colors = { value: Array.from(colors), type: UsdDataType.Color3f };
    this.properties.hasVertexColors = true;

    this.needsRecompile = true;
    this.eventEmitter.emit(MeshEvent.DATA_UPDATED, { attribute: 'colors' });
  }

  /**
   * 设置索引
   */
  setIndices(indices: Uint16Array | Uint32Array): void {
    this.indices = indices;
    this.attributes.faceVertexIndices.value = Array.from(indices);

    // 计算面数和三角形数
    this.properties.faceCount = indices.length / 3;
    this.properties.triangleCount = indices.length / 3;

    // 更新面顶点数（假设都是三角形）
    const faceVertexCounts = new Array(this.properties.faceCount).fill(3);
    this.attributes.faceVertexCounts.value = faceVertexCounts;

    this.needsRecompile = true;
    this.eventEmitter.emit(MeshEvent.DATA_UPDATED, { attribute: 'indices' });
  }

  /**
   * 获取顶点属性
   */
  getVertexAttribute(type: VertexAttribute): VertexAttributeDescriptor | undefined {
    return this.vertexAttributes.get(type);
  }

  /**
   * 获取索引数据
   */
  getIndices(): Uint16Array | Uint32Array | null {
    return this.indices;
  }

  /**
   * 获取顶点数量
   */
  getVertexCount(): number {
    return this.properties.vertexCount;
  }

  /**
   * 获取三角形数量
   */
  getTriangleCount(): number {
    return this.properties.triangleCount;
  }

  /**
   * 获取包围盒
   */
  getBoundingBox(): BoundingBox {
    return this.properties.boundingBox;
  }

  /**
   * 获取包围球
   */
  getBoundingSphere(): BoundingSphere {
    return this.properties.boundingSphere;
  }

  /**
   * 编译网格
   */
  async compile(): Promise<void> {
    if (!this.device || !this.needsRecompile) {
      return;
    }

    try {
      // 创建顶点缓冲区
      await this.createVertexBuffers();

      // 创建索引缓冲区
      await this.createIndexBuffer();

      // 创建顶点数组对象
      await this.createVertexArray();

      this.needsRecompile = false;
      this.eventEmitter.emit(MeshEvent.COMPILED, { mesh: this });
    } catch (error) {
      this.eventEmitter.emit(MeshEvent.COMPILE_FAILED, { error, mesh: this });
      throw error;
    }
  }

  /**
   * 获取顶点数组对象
   */
  getVertexArray(): IRHIVertexArray | null {
    return this.vertexArray;
  }

  /**
   * 监听网格事件
   */
  on<T extends MeshEvent>(event: T, listener: (data: any) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * 移除事件监听
   */
  off<T extends MeshEvent>(event: T, listener: (data: any) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * 克隆网格
   */
  clone(): Mesh {
    const cloned = new Mesh(this.name + '_clone');

    // 深拷贝属性
    cloned.attributes = JSON.parse(JSON.stringify(this.attributes));
    cloned.properties = JSON.parse(JSON.stringify(this.properties));

    // 拷贝顶点属性
    for (const [type, attribute] of this.vertexAttributes) {
      cloned.vertexAttributes.set(type, {
        ...attribute,
        data: new Float32Array(attribute.data),
      });
    }

    // 拷贝索引
    if (this.indices) {
      cloned.indices =
        this.indices instanceof Uint16Array ? new Uint16Array(this.indices) : new Uint32Array(this.indices);
    }

    cloned.setDevice(this.device!);
    return cloned;
  }

  /**
   * 销毁网格
   */
  override destroy(): void {
    // 清理顶点缓冲区
    for (const buffer of this.vertexBuffers.values()) {
      buffer.destroy();
    }
    this.vertexBuffers.clear();

    // 清理索引缓冲区
    if (this.indexBuffer) {
      this.indexBuffer.destroy();
      this.indexBuffer = null;
    }

    // 清理顶点数组对象
    if (this.vertexArray) {
      this.vertexArray.destroy();
      this.vertexArray = null;
    }

    // 清理事件监听
    this.eventEmitter.removeAllListeners();

    super.destroy();
  }

  /**
   * 实现Resource基类的loadImpl方法
   */
  protected async loadImpl(url: string): Promise<void> {
    // 从URL加载网格数据的实现
    throw new Error('Mesh.loadImpl not implemented yet');
  }

  /**
   * 设置顶点属性
   */
  private setVertexAttribute(type: VertexAttribute, attribute: VertexAttributeDescriptor): void {
    this.vertexAttributes.set(type, attribute);
  }

  /**
   * 更新包围盒和包围球
   */
  private updateBounds(): void {
    const positions = this.vertexAttributes.get(VertexAttribute.Position);
    if (!positions) {
      return;
    }

    const data = positions.data;
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    // 计算包围盒
    for (let i = 0; i < data.length; i += 3) {
      const x = data[i];
      const y = data[i + 1];
      const z = data[i + 2];

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    }

    this.properties.boundingBox = {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
    };

    // 计算包围球
    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;
    const centerZ = (minZ + maxZ) * 0.5;

    let maxDistanceSq = 0;
    for (let i = 0; i < data.length; i += 3) {
      const dx = data[i] - centerX;
      const dy = data[i + 1] - centerY;
      const dz = data[i + 2] - centerZ;
      const distanceSq = dx * dx + dy * dy + dz * dz;
      maxDistanceSq = Math.max(maxDistanceSq, distanceSq);
    }

    this.properties.boundingSphere = {
      center: { x: centerX, y: centerY, z: centerZ },
      radius: { value: Math.sqrt(maxDistanceSq), type: UsdDataType.Float },
    };

    this.eventEmitter.emit(MeshEvent.BOUNDS_UPDATED, {
      boundingBox: this.properties.boundingBox,
      boundingSphere: this.properties.boundingSphere,
    });
  }

  /**
   * 创建顶点缓冲区
   */
  private async createVertexBuffers(): Promise<void> {
    if (!this.device) {
      return;
    }

    // 清理现有缓冲区
    for (const buffer of this.vertexBuffers.values()) {
      buffer.destroy();
    }
    this.vertexBuffers.clear();

    // 为每个顶点属性创建缓冲区
    for (const [type, attribute] of this.vertexAttributes) {
      const buffer = this.device.createBuffer({
        size: attribute.data.byteLength,
        usage: RHIBufferUsage.VERTEX,
        label: `${this.name}_${type}_buffer`,
      });

      // TODO: 写入数据到缓冲区
      // buffer.writeData(attribute.data);

      this.vertexBuffers.set(type, buffer);
    }
  }

  /**
   * 创建索引缓冲区
   */
  private async createIndexBuffer(): Promise<void> {
    if (!this.device || !this.indices) {
      return;
    }

    if (this.indexBuffer) {
      this.indexBuffer.destroy();
    }

    this.indexBuffer = this.device.createBuffer({
      size: this.indices.byteLength,
      usage: RHIBufferUsage.INDEX,
      label: `${this.name}_index_buffer`,
    });

    // TODO: 写入数据到缓冲区
    // this.indexBuffer.writeData(this.indices);
  }

  /**
   * 创建顶点数组对象
   */
  private async createVertexArray(): Promise<void> {
    if (!this.device) {
      return;
    }

    // TODO: 实现顶点数组对象创建
    // 这里需要根据RHI接口创建顶点数组对象

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Creating vertex array for mesh:', this.name);
    }
  }
}
