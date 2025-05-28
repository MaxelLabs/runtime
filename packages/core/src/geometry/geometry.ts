import type { GeometryPrim, BoundingBox } from '@maxellabs/math';
import { VertexAttribute } from '@maxellabs/math';
import { Resource, ResourceType } from '../resource/resource';
import type { ResourceLoadOptions } from '../resource/resource';

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
 * 顶点属性类型枚举（继承规范包定义）
 */

/**
 * 几何体数据类型
 */
export enum GeometryDataType {
  BYTE = 5120,
  UNSIGNED_BYTE = 5121,
  SHORT = 5122,
  UNSIGNED_SHORT = 5123,
  INT = 5124,
  UNSIGNED_INT = 5125,
  FLOAT = 5126,
}

/**
 * 顶点属性描述
 */
export interface VertexAttributeDescriptor {
  /** 属性名称 */
  name: VertexAttribute;
  /** 数据类型 */
  type: GeometryDataType;
  /** 组件数量 */
  size: number;
  /** 是否归一化 */
  normalized?: boolean;
  /** 字节偏移 */
  offset?: number;
  /** 字节步长 */
  stride?: number;
}

/**
 * 几何体数据缓冲区
 */
export interface GeometryBuffer {
  /** 缓冲区数据 */
  data: ArrayBuffer | ArrayBufferView;
  /** 目标类型（顶点缓冲区或索引缓冲区） */
  target: number;
  /** 使用方式 */
  usage: number;
}

/**
 * 几何体基类
 * 提供几何体数据的基础框架，包括顶点数据、索引数据和属性描述
 * 实现规范包的GeometryPrim接口
 */
export abstract class Geometry extends Resource implements GeometryPrim {
  // GeometryPrim 必需属性
  readonly typeName = 'Geometry' as const;
  readonly path: string;
  readonly active: boolean = true;
  readonly attributes: Record<string, any> = {};
  readonly relationships: Record<string, any> = {};
  readonly children: any[] = [];
  /** 顶点数据缓冲区 */
  protected vertexBuffers: Map<VertexAttribute, GeometryBuffer> = new Map();
  /** 索引数据缓冲区 */
  protected indexBuffer: GeometryBuffer | null = null;
  /** 顶点属性描述 */
  protected attributeDescriptors: Map<VertexAttribute, VertexAttributeDescriptor> = new Map();
  /** 顶点数量 */
  protected vertexCount: number = 0;
  /** 索引数量 */
  protected indexCount: number = 0;
  /** 包围盒 */
  protected boundingBox: BoundingBox | null = null;
  /** 是否需要更新包围盒 */
  protected needsUpdateBounds: boolean = true;

  /**
   * 创建几何体
   * @param name 几何体名称
   */
  constructor(name?: string) {
    super(ResourceType.GEOMETRY, name);
    this.path = `/geometry/${this.name}`;
  }

  /**
   * 设置顶点属性数据
   * @param attribute 属性类型
   * @param data 顶点数据
   * @param descriptor 属性描述
   */
  setVertexAttribute(
    attribute: VertexAttribute,
    data: ArrayBuffer | ArrayBufferView,
    descriptor: VertexAttributeDescriptor
  ): void {
    this.vertexBuffers.set(attribute, {
      data,
      target: 34962, // GL_ARRAY_BUFFER
      usage: 35044, // GL_STATIC_DRAW
    });

    this.attributeDescriptors.set(attribute, descriptor);
    this.needsUpdateBounds = true;
    this.incrementVersion();
  }

  /**
   * 获取顶点属性数据
   * @param attribute 属性类型
   * @returns 缓冲区数据或null
   */
  getVertexAttribute(attribute: VertexAttribute): GeometryBuffer | null {
    return this.vertexBuffers.get(attribute) || null;
  }

  /**
   * 设置索引数据
   * @param data 索引数据
   * @param type 数据类型
   */
  setIndices(data: ArrayBuffer | ArrayBufferView, type: GeometryDataType = GeometryDataType.UNSIGNED_SHORT): void {
    this.indexBuffer = {
      data,
      target: 34963, // GL_ELEMENT_ARRAY_BUFFER
      usage: 35044, // GL_STATIC_DRAW
    };

    // 计算索引数量
    const elementSize = this.getDataTypeSize(type);
    this.indexCount = data.byteLength / elementSize;
    this.incrementVersion();
  }

  /**
   * 获取索引数据
   * @returns 索引缓冲区或null
   */
  getIndices(): GeometryBuffer | null {
    return this.indexBuffer;
  }

  /**
   * 获取顶点属性描述
   * @param attribute 属性类型
   * @returns 属性描述或null
   */
  getAttributeDescriptor(attribute: VertexAttribute): VertexAttributeDescriptor | null {
    return this.attributeDescriptors.get(attribute) || null;
  }

  /**
   * 获取所有顶点属性
   * @returns 属性映射
   */
  getAllAttributes(): Map<VertexAttribute, VertexAttributeDescriptor> {
    return new Map(this.attributeDescriptors);
  }

  /**
   * 获取顶点数量
   */
  getVertexCount(): number {
    return this.vertexCount;
  }

  /**
   * 设置顶点数量
   * @param count 顶点数量
   */
  setVertexCount(count: number): void {
    this.vertexCount = count;
  }

  /**
   * 获取索引数量
   */
  getIndexCount(): number {
    return this.indexCount;
  }

  /**
   * 获取包围盒
   * @returns 包围盒
   */
  getBoundingBox(): BoundingBox {
    if (this.needsUpdateBounds || !this.boundingBox) {
      this.updateBoundingBox();
    }
    return this.boundingBox!;
  }

  /**
   * 更新包围盒
   */
  protected updateBoundingBox(): void {
    const positionBuffer = this.getVertexAttribute(VertexAttribute.Position);
    if (!positionBuffer) {
      this.boundingBox = {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
        center: { x: 0, y: 0, z: 0 },
        size: { x: 0, y: 0, z: 0 },
      };
      return;
    }

    const positions = new Float32Array(
      positionBuffer.data instanceof ArrayBuffer
        ? positionBuffer.data
        : positionBuffer.data.buffer.slice(
            positionBuffer.data.byteOffset,
            positionBuffer.data.byteOffset + positionBuffer.data.byteLength
          )
    );

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

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    this.boundingBox = {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
      center: { x: centerX, y: centerY, z: centerZ },
      size: { x: maxX - minX, y: maxY - minY, z: maxZ - minZ },
    };

    this.needsUpdateBounds = false;
  }

  /**
   * 获取数据类型的字节大小
   * @param type 数据类型
   * @returns 字节大小
   */
  protected getDataTypeSize(type: GeometryDataType): number {
    switch (type) {
      case GeometryDataType.BYTE:
      case GeometryDataType.UNSIGNED_BYTE:
        return 1;
      case GeometryDataType.SHORT:
      case GeometryDataType.UNSIGNED_SHORT:
        return 2;
      case GeometryDataType.INT:
      case GeometryDataType.UNSIGNED_INT:
      case GeometryDataType.FLOAT:
        return 4;
      default:
        return 1;
    }
  }

  /**
   * 清空几何体数据
   */
  clear(): void {
    this.vertexBuffers.clear();
    this.attributeDescriptors.clear();
    this.indexBuffer = null;
    this.vertexCount = 0;
    this.indexCount = 0;
    this.boundingBox = null;
    this.needsUpdateBounds = true;
    this.incrementVersion();
  }

  /**
   * 检查几何体是否有效
   */
  isValid(): boolean {
    return this.vertexCount > 0 && this.vertexBuffers.size > 0;
  }

  /**
   * 实现Resource基类的loadImpl方法
   */
  protected async loadImpl(url: string, options?: ResourceLoadOptions): Promise<void> {
    // 默认实现，子类可以重写来支持从URL加载几何体数据
    throw new Error('Geometry.loadImpl not implemented. Override in subclass.');
  }

  /**
   * 克隆几何体
   */
  clone(): Geometry {
    throw new Error('Geometry.clone not implemented. Override in subclass.');
  }

  /**
   * 计算几何体的内存使用情况
   */
  protected override updateSize(): void {
    let totalSize = 0;

    // 计算顶点缓冲区大小
    for (const buffer of this.vertexBuffers.values()) {
      totalSize += buffer.data.byteLength;
    }

    // 计算索引缓冲区大小
    if (this.indexBuffer) {
      totalSize += this.indexBuffer.data.byteLength;
    }

    this.size = totalSize;
  }

  /**
   * 释放几何体资源
   */
  protected override onRelease(): void {
    this.clear();
  }
}
