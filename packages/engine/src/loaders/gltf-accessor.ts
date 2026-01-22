/**
 * glTF Accessor 读取工具
 *
 * @packageDocumentation
 *
 * @remarks
 * 从 glTF buffers 中读取 accessor 数据。
 * 支持紧密排列和交错排列的数据。
 */

import { GLTFComponentType, type GLTFDocument, type GLTFAccessor, type GLTFAccessorType } from './gltf-types';

/**
 * 类型化数组类型
 */
type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array;

/**
 * 类型化数组构造函数
 */
type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor;

/**
 * glTF Accessor 读取器
 */
export class GLTFAccessorReader {
  private json: GLTFDocument;
  private buffers: ArrayBuffer[];

  constructor(json: GLTFDocument, buffers: ArrayBuffer[]) {
    this.json = json;
    this.buffers = buffers;
  }

  /**
   * 读取 accessor 数据
   * @param accessorIndex accessor 索引
   * @returns 类型化数组
   */
  readAccessor(accessorIndex: number): TypedArray {
    const accessor = this.json.accessors?.[accessorIndex];
    if (!accessor) {
      throw new Error(`[GLTFAccessorReader] Accessor ${accessorIndex} not found`);
    }

    // 处理没有 bufferView 的情况（稀疏 accessor 或全零数据）
    if (accessor.bufferView === undefined) {
      return this.createZeroArray(accessor);
    }

    const bufferView = this.json.bufferViews?.[accessor.bufferView];
    if (!bufferView) {
      throw new Error(`[GLTFAccessorReader] BufferView ${accessor.bufferView} not found`);
    }

    const buffer = this.buffers[bufferView.buffer];
    if (!buffer) {
      throw new Error(`[GLTFAccessorReader] Buffer ${bufferView.buffer} not found`);
    }

    // 计算偏移
    const byteOffset = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);

    // 获取元素信息
    const componentSize = getComponentSize(accessor.componentType);
    const elementCount = getElementCount(accessor.type);
    const stride = bufferView.byteStride ?? componentSize * elementCount;

    // 获取类型化数组构造函数
    const TypedArrayClass = getTypedArrayClass(accessor.componentType);

    // 检查是否为紧密排列
    if (stride === componentSize * elementCount) {
      // 紧密排列，直接创建视图
      return new TypedArrayClass(buffer, byteOffset, accessor.count * elementCount);
    } else {
      // 交错排列，需要复制数据
      return this.readInterleavedData(buffer, byteOffset, stride, accessor, TypedArrayClass);
    }
  }

  /**
   * 读取 accessor 数据为 Float32Array
   * @param accessorIndex accessor 索引
   * @returns Float32Array
   */
  readAccessorAsFloat32(accessorIndex: number): Float32Array {
    const data = this.readAccessor(accessorIndex);
    if (data instanceof Float32Array) {
      return data;
    }
    // 转换为 Float32Array
    return new Float32Array(data);
  }

  /**
   * 读取 accessor 数据为 Uint16Array
   * @param accessorIndex accessor 索引
   * @returns Uint16Array
   */
  readAccessorAsUint16(accessorIndex: number): Uint16Array {
    const data = this.readAccessor(accessorIndex);
    if (data instanceof Uint16Array) {
      return data;
    }
    // 转换为 Uint16Array
    return new Uint16Array(data);
  }

  /**
   * 读取 accessor 数据为 Uint32Array
   * @param accessorIndex accessor 索引
   * @returns Uint32Array
   */
  readAccessorAsUint32(accessorIndex: number): Uint32Array {
    const data = this.readAccessor(accessorIndex);
    if (data instanceof Uint32Array) {
      return data;
    }
    // 转换为 Uint32Array
    return new Uint32Array(data);
  }

  /**
   * 创建全零数组
   */
  private createZeroArray(accessor: GLTFAccessor): TypedArray {
    const elementCount = getElementCount(accessor.type);
    const TypedArrayClass = getTypedArrayClass(accessor.componentType);
    return new TypedArrayClass(accessor.count * elementCount);
  }

  /**
   * 读取交错数据
   */
  private readInterleavedData(
    buffer: ArrayBuffer,
    byteOffset: number,
    stride: number,
    accessor: GLTFAccessor,
    TypedArrayClass: TypedArrayConstructor
  ): TypedArray {
    const componentSize = getComponentSize(accessor.componentType);
    const elementCount = getElementCount(accessor.type);
    const result = new TypedArrayClass(accessor.count * elementCount);
    const dataView = new DataView(buffer);

    for (let i = 0; i < accessor.count; i++) {
      const srcOffset = byteOffset + i * stride;
      for (let j = 0; j < elementCount; j++) {
        const value = readComponent(dataView, srcOffset + j * componentSize, accessor.componentType);
        result[i * elementCount + j] = value;
      }
    }

    return result;
  }
}

/**
 * 获取组件大小（字节）
 */
export function getComponentSize(componentType: GLTFComponentType): number {
  switch (componentType) {
    case GLTFComponentType.BYTE:
    case GLTFComponentType.UNSIGNED_BYTE:
      return 1;
    case GLTFComponentType.SHORT:
    case GLTFComponentType.UNSIGNED_SHORT:
      return 2;
    case GLTFComponentType.UNSIGNED_INT:
    case GLTFComponentType.FLOAT:
      return 4;
    default:
      throw new Error(`[GLTFAccessorReader] Unknown component type: ${componentType}`);
  }
}

/**
 * 获取元素数量
 */
export function getElementCount(type: GLTFAccessorType): number {
  switch (type) {
    case 'SCALAR':
      return 1;
    case 'VEC2':
      return 2;
    case 'VEC3':
      return 3;
    case 'VEC4':
      return 4;
    case 'MAT2':
      return 4;
    case 'MAT3':
      return 9;
    case 'MAT4':
      return 16;
    default:
      throw new Error(`[GLTFAccessorReader] Unknown accessor type: ${type}`);
  }
}

/**
 * 获取类型化数组构造函数
 */
export function getTypedArrayClass(componentType: GLTFComponentType): TypedArrayConstructor {
  switch (componentType) {
    case GLTFComponentType.BYTE:
      return Int8Array;
    case GLTFComponentType.UNSIGNED_BYTE:
      return Uint8Array;
    case GLTFComponentType.SHORT:
      return Int16Array;
    case GLTFComponentType.UNSIGNED_SHORT:
      return Uint16Array;
    case GLTFComponentType.UNSIGNED_INT:
      return Uint32Array;
    case GLTFComponentType.FLOAT:
      return Float32Array;
    default:
      throw new Error(`[GLTFAccessorReader] Unknown component type: ${componentType}`);
  }
}

/**
 * 从 DataView 读取单个组件值
 */
function readComponent(dataView: DataView, offset: number, componentType: GLTFComponentType): number {
  switch (componentType) {
    case GLTFComponentType.BYTE:
      return dataView.getInt8(offset);
    case GLTFComponentType.UNSIGNED_BYTE:
      return dataView.getUint8(offset);
    case GLTFComponentType.SHORT:
      return dataView.getInt16(offset, true);
    case GLTFComponentType.UNSIGNED_SHORT:
      return dataView.getUint16(offset, true);
    case GLTFComponentType.UNSIGNED_INT:
      return dataView.getUint32(offset, true);
    case GLTFComponentType.FLOAT:
      return dataView.getFloat32(offset, true);
    default:
      throw new Error(`[GLTFAccessorReader] Unknown component type: ${componentType}`);
  }
}
