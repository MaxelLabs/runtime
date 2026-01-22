/**
 * GLB Parser - GLB 二进制格式解析器
 *
 * @packageDocumentation
 *
 * @remarks
 * 解析 GLB (Binary glTF) 文件格式。
 * GLB 文件结构:
 * - 12 字节头部 (magic, version, length)
 * - JSON chunk (类型 0x4E4F534A)
 * - Binary chunk (类型 0x004E4942, 可选)
 */

import {
  GLB_MAGIC,
  GLB_CHUNK_TYPE_JSON,
  GLB_CHUNK_TYPE_BIN,
  type GLTFDocument,
  type GLBHeader,
  type GLBChunk,
  type GLBParseResult,
} from './gltf-types';

/**
 * GLB 解析器
 */
export class GLBParser {
  /**
   * 解析 GLB 数据
   * @param arrayBuffer GLB 文件的 ArrayBuffer
   * @returns 解析结果，包含 JSON 和可选的二进制缓冲区
   */
  static parse(arrayBuffer: ArrayBuffer): GLBParseResult {
    const dataView = new DataView(arrayBuffer);

    // 1. 解析头部
    const header = this.parseHeader(dataView);
    this.validateHeader(header, arrayBuffer.byteLength);

    // 2. 解析 chunks
    let offset = 12; // 头部大小
    let json: GLTFDocument | null = null;
    let binaryBuffer: ArrayBuffer | undefined;

    while (offset < header.length) {
      const chunk = this.parseChunk(dataView, arrayBuffer, offset);

      if (chunk.chunkType === GLB_CHUNK_TYPE_JSON) {
        // JSON chunk
        const jsonString = new TextDecoder().decode(chunk.chunkData);
        json = JSON.parse(jsonString) as GLTFDocument;
      } else if (chunk.chunkType === GLB_CHUNK_TYPE_BIN) {
        // Binary chunk
        binaryBuffer = chunk.chunkData;
      }
      // 忽略未知 chunk 类型

      // 移动到下一个 chunk
      // chunk 头部 8 字节 + chunk 数据
      offset += 8 + chunk.chunkLength;

      // 确保 4 字节对齐
      offset = Math.ceil(offset / 4) * 4;
    }

    if (!json) {
      throw new Error('[GLBParser] No JSON chunk found in GLB file');
    }

    return { json, binaryBuffer };
  }

  /**
   * 解析 GLB 头部
   */
  private static parseHeader(dataView: DataView): GLBHeader {
    return {
      magic: dataView.getUint32(0, true),
      version: dataView.getUint32(4, true),
      length: dataView.getUint32(8, true),
    };
  }

  /**
   * 验证 GLB 头部
   */
  private static validateHeader(header: GLBHeader, actualLength: number): void {
    // 检查 magic number
    if (header.magic !== GLB_MAGIC) {
      const magicHex = header.magic.toString(16).padStart(8, '0');
      throw new Error(`[GLBParser] Invalid GLB magic number: 0x${magicHex}, expected 0x${GLB_MAGIC.toString(16)}`);
    }

    // 检查版本
    if (header.version !== 2) {
      throw new Error(`[GLBParser] Unsupported GLB version: ${header.version}, only version 2 is supported`);
    }

    // 检查长度
    if (header.length !== actualLength) {
      console.warn(`[GLBParser] GLB header length (${header.length}) does not match actual length (${actualLength})`);
    }
  }

  /**
   * 解析单个 chunk
   */
  private static parseChunk(dataView: DataView, arrayBuffer: ArrayBuffer, offset: number): GLBChunk {
    const chunkLength = dataView.getUint32(offset, true);
    const chunkType = dataView.getUint32(offset + 4, true);
    const chunkData = arrayBuffer.slice(offset + 8, offset + 8 + chunkLength);

    return { chunkLength, chunkType, chunkData };
  }

  /**
   * 检查是否为 GLB 文件
   * @param arrayBuffer 文件数据
   * @returns 是否为 GLB 格式
   */
  static isGLB(arrayBuffer: ArrayBuffer): boolean {
    if (arrayBuffer.byteLength < 12) {
      return false;
    }

    const dataView = new DataView(arrayBuffer);
    const magic = dataView.getUint32(0, true);
    return magic === GLB_MAGIC;
  }
}
