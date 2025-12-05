import type {
  GeometryProperties,
  LODConfiguration,
  MaterialBinding,
  TopologyType,
  GeometryType,
  GeometryPrim,
  CoreBoundingBox as BoundingBox,
  VertexAttributeDescriptor,
} from '@maxellabs/specification';
import { VertexAttribute } from '@maxellabs/specification';
import { Resource, ResourceType } from '../resource/resource';
import type { ResourceLoadOptions } from '../resource/resource';
import type {
  IRHIDevice,
  IRHIBuffer,
  RHIVertexBufferLayout,
} from '@maxellabs/specification';
import { RHIBufferUsage, RHIIndexFormat, RHIVertexFormat } from '@maxellabs/specification';

/**
 * 几何体缓冲区数据
 */
interface GeometryBufferData {
  /** 原始数据 */
  data: ArrayBuffer | ArrayBufferView;
  /** RHI缓冲区（如果已创建） */
  rhiBuffer?: IRHIBuffer;
  /** 缓冲区用途 */
  usage: RHIBufferUsage;
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
  protected vertexBuffers: Map<VertexAttribute, GeometryBufferData> = new Map();

  /** 索引数据缓冲区 */
  protected indexBuffer: GeometryBufferData | null = null;

  /** 顶点属性描述 */
  protected attributeDescriptors: Map<VertexAttribute, VertexAttributeDescriptor> = new Map();

  /** 顶点数量 */
  protected vertexCount: number = 0;

  /** 索引数量 */
  protected indexCount: number = 0;

  /** 索引格式 */
  protected indexFormat: RHIIndexFormat = RHIIndexFormat.UINT16;

  /** 包围盒 */
  protected boundingBox: BoundingBox | null = null;

  /** 是否需要更新包围盒 */
  protected needsUpdateBounds: boolean = true;

  /** RHI设备引用 */
  protected device: IRHIDevice | null = null;

  /**
   * 创建几何体
   * @param name 几何体名称
   */
  constructor(name?: string) {
    super(ResourceType.GEOMETRY, name);
    this.path = `/geometry/${this.name}`;
  }

  /**
   * 设置RHI设备
   */
  setDevice(device: IRHIDevice): void {
    this.device = device;
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
      usage: RHIBufferUsage.VERTEX,
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
  getVertexAttribute(attribute: VertexAttribute): GeometryBufferData | null {
    return this.vertexBuffers.get(attribute) || null;
  }

  /**
   * 设置索引数据
   * @param data 索引数据
   * @param format 索引格式
   */
  setIndices(data: ArrayBuffer | ArrayBufferView, format: RHIIndexFormat = RHIIndexFormat.UINT16): void {
    this.indexBuffer = {
      data,
      usage: RHIBufferUsage.INDEX,
    };

    this.indexFormat = format;

    // 计算索引数量
    const elementSize = format === RHIIndexFormat.UINT32 ? 4 : 2;
    this.indexCount = data.byteLength / elementSize;
    this.incrementVersion();
  }

  /**
   * 获取索引数据
   * @returns 索引缓冲区或null
   */
  getIndices(): GeometryBufferData | null {
    return this.indexBuffer;
  }

  /**
   * 获取索引格式
   */
  getIndexFormat(): RHIIndexFormat {
    return this.indexFormat;
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
   * 获取顶点布局（用于RHI渲染管线）
   */
  getVertexLayout(): RHIVertexBufferLayout[] {
    const layouts: RHIVertexBufferLayout[] = [];
    let bufferIndex = 0;

    for (const [attribute, descriptor] of this.attributeDescriptors) {
      const bufferData = this.vertexBuffers.get(attribute);
      if (!bufferData) {
        continue;
      }

      layouts.push({
        index: bufferIndex++,
        stride: descriptor.stride || this.getAttributeSize(descriptor),
        stepMode: 'vertex',
        attributes: [
          {
            shaderLocation: this.getAttributeLocation(attribute),
            format: this.getAttributeFormat(descriptor),
            offset: descriptor.offset || 0,
          },
        ],
      });
    }

    return layouts;
  }

  /**
   * 获取顶点缓冲区（RHI）
   */
  getVertexBuffer(attribute?: VertexAttribute): IRHIBuffer | null {
    if (attribute) {
      const bufferData = this.vertexBuffers.get(attribute);
      return bufferData?.rhiBuffer || null;
    }

    // 返回第一个可用的顶点缓冲区
    for (const bufferData of this.vertexBuffers.values()) {
      if (bufferData.rhiBuffer) {
        return bufferData.rhiBuffer;
      }
    }
    return null;
  }

  /**
   * 获取索引缓冲区（RHI）
   */
  getIndexBuffer(): IRHIBuffer | null {
    return this.indexBuffer?.rhiBuffer || null;
  }

  /**
   * 创建RHI缓冲区
   */
  createRHIBuffers(): void {
    if (!this.device) {
      console.warn('Geometry: RHI设备未设置，无法创建缓冲区');
      return;
    }

    // 创建顶点缓冲区
    for (const [attribute, bufferData] of this.vertexBuffers) {
      if (!bufferData.rhiBuffer) {
        bufferData.rhiBuffer = this.device.createBuffer({
            size: bufferData.data.byteLength,
            usage: bufferData.usage,
            initialData: bufferData.data as any,
            label: `Geometry-${this.name}-${attribute}`,
          });
      }
    }

    // 创建索引缓冲区
    if (this.indexBuffer && !this.indexBuffer.rhiBuffer) {
      this.indexBuffer.rhiBuffer = this.device.createBuffer({
        size: this.indexBuffer.data.byteLength,
        usage: this.indexBuffer.usage,
        initialData: this.indexBuffer.data as any,
        label: `Geometry-${this.name}-Index`,
      });
    }
  }

  /**
   * 获取属性位置
   */
  private getAttributeLocation(attribute: VertexAttribute): number {
    switch (attribute) {
      case VertexAttribute.Position:
        return 0;
      case VertexAttribute.Normal:
        return 1;
      case VertexAttribute.TexCoord0:
        return 2;
      case VertexAttribute.TexCoord1:
        return 3;
      case VertexAttribute.Color:
        return 4;
      case VertexAttribute.Tangent:
        return 5;
      default:
        return 0;
    }
  }

  /**
   * 获取属性格式
   */
  private getAttributeFormat(descriptor: VertexAttributeDescriptor): RHIVertexFormat {
    // 根据描述符返回RHI格式枚举
    // 这里需要根据实际的RHI格式枚举来实现
    return RHIVertexFormat.Float32x3; // 默认格式，实际应该根据descriptor计算
  }

  /**
   * 获取属性大小
   */
  private getAttributeSize(descriptor: VertexAttributeDescriptor): number {
    // 根据描述符计算属性大小
    return 12; // 默认3个float32，实际应该根据descriptor计算
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
   * 清空几何体数据
   */
  clear(): void {
    // 销毁RHI缓冲区
    for (const bufferData of this.vertexBuffers.values()) {
      bufferData.rhiBuffer?.destroy();
    }
    this.indexBuffer?.rhiBuffer?.destroy();

    this.vertexBuffers.clear();
    this.indexBuffer = null;
    this.attributeDescriptors.clear();
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
   * 实现Resource的loadImpl方法
   */
  protected async loadImpl(url: string, options?: ResourceLoadOptions): Promise<void> {
    // 子类实现具体的加载逻辑
    throw new Error('Geometry.loadImpl must be implemented by subclass');
  }

  /**
   * 克隆几何体
   */
  clone(): Geometry {
    // 子类实现具体的克隆逻辑
    throw new Error('Geometry.clone must be implemented by subclass');
  }

  /**
   * 更新资源大小
   */
  protected override updateSize(): void {
    let totalSize = 0;

    // 计算顶点缓冲区大小
    for (const bufferData of this.vertexBuffers.values()) {
      totalSize += bufferData.data.byteLength;
    }

    // 计算索引缓冲区大小
    if (this.indexBuffer) {
      totalSize += this.indexBuffer.data.byteLength;
    }

    this.setSize(totalSize);
  }

  /**
   * 资源释放时的清理
   */
  protected override onRelease(): void {
    this.clear();
  }
}
