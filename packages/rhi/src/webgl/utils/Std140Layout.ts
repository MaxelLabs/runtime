/**
 * Std140Layout.ts
 * std140 内存布局计算工具
 *
 * 实现 GLSL std140 布局规范的自动对齐和填充计算
 * 用于将 TypeScript 数据结构转换为 GPU UBO 兼容格式
 */

import { MSpec } from '@maxellabs/core';

// 使用统一的 RHIUniformType，并为向后兼容导出别名
const RHIUniformType = MSpec.RHIUniformType;

/**
 * @deprecated 请使用 MSpec.RHIUniformType 代替
 * 保留此别名用于向后兼容
 */
export const Std140Type = RHIUniformType;

/**
 * std140 类型信息
 */
interface Std140TypeInfo {
  /** 基础对齐值（字节） */
  baseAlignment: number;
  /** 类型大小（字节） */
  size: number;
  /** 元素数量（用于向量和矩阵） */
  elements: number;
  /** 是否为矩阵类型 */
  isMatrix: boolean;
  /** 矩阵列数（仅矩阵类型有效） */
  columns?: number;
  /** 矩阵行数（仅矩阵类型有效） */
  rows?: number;
}

/**
 * 字段定义
 */
export interface Std140FieldDefinition {
  /** 字段名称 */
  name: string;
  /** 字段类型 */
  type: MSpec.RHIUniformType;
  /** 数组长度（可选，非数组为 undefined） */
  arrayLength?: number;
}

/**
 * 计算后的字段布局
 */
export interface Std140FieldLayout {
  /** 字段名称 */
  name: string;
  /** 字段类型 */
  type: MSpec.RHIUniformType;
  /** 字节偏移 */
  offset: number;
  /** 字段大小（包含填充） */
  size: number;
  /** 对齐值 */
  alignment: number;
  /** 数组长度（非数组为 undefined） */
  arrayLength?: number;
  /** 数组步长（每个元素占用的字节数，仅数组有效） */
  arrayStride?: number;
}

/**
 * UBO 布局
 */
export interface Std140Layout {
  /** 所有字段的布局 */
  fields: Std140FieldLayout[];
  /** 总大小（字节，已对齐到 16 字节边界） */
  totalSize: number;
  /** 字段名到布局的映射 */
  fieldMap: Map<string, Std140FieldLayout>;
}

/**
 * std140 类型信息表
 * 仅包含可用于 UBO 的数据类型（不包含采样器）
 */
const TYPE_INFO: Partial<Record<MSpec.RHIUniformType, Std140TypeInfo>> = {
  // 标量类型：对齐 4，大小 4
  [RHIUniformType.FLOAT]: { baseAlignment: 4, size: 4, elements: 1, isMatrix: false },
  [RHIUniformType.INT]: { baseAlignment: 4, size: 4, elements: 1, isMatrix: false },
  [RHIUniformType.UINT]: { baseAlignment: 4, size: 4, elements: 1, isMatrix: false },
  [RHIUniformType.BOOL]: { baseAlignment: 4, size: 4, elements: 1, isMatrix: false },

  // vec2：对齐 8，大小 8
  [RHIUniformType.VEC2]: { baseAlignment: 8, size: 8, elements: 2, isMatrix: false },
  [RHIUniformType.IVEC2]: { baseAlignment: 8, size: 8, elements: 2, isMatrix: false },
  [RHIUniformType.UVEC2]: { baseAlignment: 8, size: 8, elements: 2, isMatrix: false },
  [RHIUniformType.BVEC2]: { baseAlignment: 8, size: 8, elements: 2, isMatrix: false },

  // vec3：对齐 16，大小 12（特殊规则！）
  [RHIUniformType.VEC3]: { baseAlignment: 16, size: 12, elements: 3, isMatrix: false },
  [RHIUniformType.IVEC3]: { baseAlignment: 16, size: 12, elements: 3, isMatrix: false },
  [RHIUniformType.UVEC3]: { baseAlignment: 16, size: 12, elements: 3, isMatrix: false },
  [RHIUniformType.BVEC3]: { baseAlignment: 16, size: 12, elements: 3, isMatrix: false },

  // vec4：对齐 16，大小 16
  [RHIUniformType.VEC4]: { baseAlignment: 16, size: 16, elements: 4, isMatrix: false },
  [RHIUniformType.IVEC4]: { baseAlignment: 16, size: 16, elements: 4, isMatrix: false },
  [RHIUniformType.UVEC4]: { baseAlignment: 16, size: 16, elements: 4, isMatrix: false },
  [RHIUniformType.BVEC4]: { baseAlignment: 16, size: 16, elements: 4, isMatrix: false },

  // 矩阵：按列存储，每列对齐到 16 字节
  [RHIUniformType.MAT2]: { baseAlignment: 16, size: 32, elements: 4, isMatrix: true, columns: 2, rows: 2 },
  [RHIUniformType.MAT3]: { baseAlignment: 16, size: 48, elements: 9, isMatrix: true, columns: 3, rows: 3 },
  [RHIUniformType.MAT4]: { baseAlignment: 16, size: 64, elements: 16, isMatrix: true, columns: 4, rows: 4 },

  // 非方阵矩阵
  [RHIUniformType.MAT2X3]: { baseAlignment: 16, size: 32, elements: 6, isMatrix: true, columns: 2, rows: 3 },
  [RHIUniformType.MAT2X4]: { baseAlignment: 16, size: 32, elements: 8, isMatrix: true, columns: 2, rows: 4 },
  [RHIUniformType.MAT3X2]: { baseAlignment: 16, size: 48, elements: 6, isMatrix: true, columns: 3, rows: 2 },
  [RHIUniformType.MAT3X4]: { baseAlignment: 16, size: 48, elements: 12, isMatrix: true, columns: 3, rows: 4 },
  [RHIUniformType.MAT4X2]: { baseAlignment: 16, size: 64, elements: 8, isMatrix: true, columns: 4, rows: 2 },
  [RHIUniformType.MAT4X3]: { baseAlignment: 16, size: 64, elements: 12, isMatrix: true, columns: 4, rows: 3 },
};

/**
 * std140 布局计算器
 *
 * 用于计算 GLSL uniform block 的内存布局
 */
export class Std140Calculator {
  /**
   * 获取类型的基础对齐值
   */
  static getBaseAlignment(type: MSpec.RHIUniformType): number {
    return TYPE_INFO[type]?.baseAlignment ?? 4;
  }

  /**
   * 获取类型的大小
   */
  static getTypeSize(type: MSpec.RHIUniformType): number {
    return TYPE_INFO[type]?.size ?? 4;
  }

  /**
   * 获取数组元素的对齐步长
   * 在 std140 中，数组元素必须对齐到 16 字节
   */
  static getArrayStride(type: MSpec.RHIUniformType): number {
    const typeInfo = TYPE_INFO[type];

    if (!typeInfo) {
      return 16;
    }

    // std140 规则：数组元素步长必须是 16 的倍数
    return Math.ceil(typeInfo.size / 16) * 16;
  }

  /**
   * 对齐偏移到指定对齐值
   */
  static alignOffset(offset: number, alignment: number): number {
    return Math.ceil(offset / alignment) * alignment;
  }

  /**
   * 检查类型是否支持 std140 布局
   * 采样器类型不能用于 UBO
   */
  static isTypeSupported(type: MSpec.RHIUniformType): boolean {
    return TYPE_INFO[type] !== undefined;
  }

  /**
   * 计算字段布局
   *
   * @param fields 字段定义数组
   * @returns UBO 布局信息
   */
  static calculateLayout(fields: Std140FieldDefinition[]): Std140Layout {
    const layouts: Std140FieldLayout[] = [];
    const fieldMap = new Map<string, Std140FieldLayout>();
    let currentOffset = 0;

    for (const field of fields) {
      const typeInfo = TYPE_INFO[field.type];

      if (!typeInfo) {
        console.warn(`类型 ${field.type} 不支持 std140 布局（可能是采样器类型），跳过字段 ${field.name}`);
        continue;
      }

      let alignment: number;
      let size: number;
      let arrayStride: number | undefined;

      if (field.arrayLength !== undefined && field.arrayLength > 0) {
        // 数组类型：元素对齐到 16 字节
        arrayStride = this.getArrayStride(field.type);
        alignment = 16; // 数组起始位置对齐到 16
        size = arrayStride * field.arrayLength;
      } else {
        // 非数组类型
        alignment = typeInfo.baseAlignment;
        size = typeInfo.size;
      }

      // 对齐当前偏移
      currentOffset = this.alignOffset(currentOffset, alignment);

      const layout: Std140FieldLayout = {
        name: field.name,
        type: field.type,
        offset: currentOffset,
        size,
        alignment,
        arrayLength: field.arrayLength,
        arrayStride,
      };

      layouts.push(layout);
      fieldMap.set(field.name, layout);

      // 移动到下一个字段
      currentOffset += size;
    }

    // 最终大小对齐到 16 字节（UBO 要求）
    const totalSize = this.alignOffset(currentOffset, 16);

    return {
      fields: layouts,
      totalSize,
      fieldMap,
    };
  }

  /**
   * 创建符合 std140 布局的数据缓冲区
   *
   * @param layout 布局信息
   * @returns Float32Array 缓冲区
   */
  static createBuffer(layout: Std140Layout): Float32Array {
    return new Float32Array(layout.totalSize / 4);
  }

  /**
   * 将数据写入 std140 缓冲区
   *
   * @param buffer 目标缓冲区
   * @param layout 布局信息
   * @param fieldName 字段名
   * @param data 要写入的数据
   */
  static writeField(
    buffer: Float32Array | Int32Array | Uint32Array,
    layout: Std140Layout,
    fieldName: string,
    data: number | number[] | Float32Array
  ): void {
    const fieldLayout = layout.fieldMap.get(fieldName);

    if (!fieldLayout) {
      console.warn(`字段 ${fieldName} 不存在于布局中`);

      return;
    }

    const offset = fieldLayout.offset / 4; // 转换为 float32 索引

    if (typeof data === 'number') {
      // 标量值
      buffer[offset] = data;
    } else if (Array.isArray(data) || data instanceof Float32Array) {
      // 数组或向量/矩阵
      const typeInfo = TYPE_INFO[fieldLayout.type];

      if (!typeInfo) {
        return;
      }

      if (typeInfo.isMatrix && typeInfo.columns && typeInfo.rows) {
        // 矩阵需要按列存储，每列对齐到 16 字节
        this.writeMatrix(buffer, offset, data, typeInfo.columns, typeInfo.rows);
      } else if (fieldLayout.arrayLength !== undefined && fieldLayout.arrayStride !== undefined) {
        // 数组类型
        this.writeArray(buffer, offset, data, fieldLayout.arrayStride / 4, fieldLayout.arrayLength);
      } else {
        // 普通向量
        for (let i = 0; i < data.length && i < typeInfo.elements; i++) {
          buffer[offset + i] = data[i];
        }
      }
    }
  }

  /**
   * 写入矩阵数据（按列存储，每列对齐到 16 字节）
   */
  private static writeMatrix(
    buffer: Float32Array | Int32Array | Uint32Array,
    offset: number,
    data: number[] | Float32Array,
    columns: number,
    rows: number
  ): void {
    const columnStride = 4; // 每列占 16 字节 = 4 个 float32

    for (let col = 0; col < columns; col++) {
      for (let row = 0; row < rows; row++) {
        // 矩阵通常按列主序存储
        const srcIndex = col * rows + row;
        const dstIndex = offset + col * columnStride + row;

        if (srcIndex < data.length) {
          buffer[dstIndex] = data[srcIndex];
        }
      }
    }
  }

  /**
   * 写入数组数据（每个元素对齐到 16 字节）
   */
  private static writeArray(
    buffer: Float32Array | Int32Array | Uint32Array,
    offset: number,
    data: number[] | Float32Array,
    strideInFloats: number,
    arrayLength: number
  ): void {
    for (let i = 0; i < arrayLength && i < data.length; i++) {
      buffer[offset + i * strideInFloats] = data[i];
    }
  }

  /**
   * 从原始 ArrayBufferView 复制数据到 std140 对齐的缓冲区
   * 假设输入数据是紧密打包的
   *
   * @param srcData 源数据
   * @param srcOffset 源数据偏移（字节）
   * @param layout 目标布局
   * @param dstBuffer 目标缓冲区
   */
  static copyPackedToStd140(
    srcData: ArrayBufferView,
    srcOffset: number,
    layout: Std140Layout,
    dstBuffer: Float32Array
  ): void {
    const srcView = new Float32Array(srcData.buffer, srcData.byteOffset + srcOffset);
    let srcIndex = 0;

    for (const field of layout.fields) {
      const dstIndex = field.offset / 4;
      const typeInfo = TYPE_INFO[field.type];

      if (!typeInfo) {
        continue;
      }

      if (field.arrayLength !== undefined && field.arrayStride !== undefined) {
        // 数组：逐元素复制
        const elementsPerItem = typeInfo.elements;
        const strideInFloats = field.arrayStride / 4;

        for (let i = 0; i < field.arrayLength; i++) {
          for (let j = 0; j < elementsPerItem; j++) {
            if (srcIndex < srcView.length) {
              dstBuffer[dstIndex + i * strideInFloats + j] = srcView[srcIndex++];
            }
          }
        }
      } else if (typeInfo.isMatrix && typeInfo.columns && typeInfo.rows) {
        // 矩阵：按列复制，每列对齐
        const columnStride = 4;

        for (let col = 0; col < typeInfo.columns; col++) {
          for (let row = 0; row < typeInfo.rows; row++) {
            if (srcIndex < srcView.length) {
              dstBuffer[dstIndex + col * columnStride + row] = srcView[srcIndex++];
            }
          }
        }
      } else {
        // 标量或向量
        for (let i = 0; i < typeInfo.elements; i++) {
          if (srcIndex < srcView.length) {
            dstBuffer[dstIndex + i] = srcView[srcIndex++];
          }
        }
      }
    }
  }
}

/**
 * Push Constants 布局定义
 * 用于定义管线的 push constants 结构
 */
export interface PushConstantLayoutDescriptor {
  /** 布局名称（用于 UBO 块名） */
  name?: string;
  /** 字段定义 */
  fields: Std140FieldDefinition[];
}
