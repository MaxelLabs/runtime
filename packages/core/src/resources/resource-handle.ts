/**
 * ResourceHandle Implementation
 * 资源句柄实现
 *
 * @packageDocumentation
 *
 * @remarks
 * 提供 IResourceHandle 的具体实现和工厂函数。
 * 资源句柄是轻量级的数据结构，用于引用已加载的资源。
 *
 * @example
 * ```typescript
 * const handle = createResourceHandle('models/cube.glb', ResourceType.Mesh, 1);
 * console.log(handle.toString()); // "ResourceHandle(mesh:models/cube.glb)"
 * ```
 */

import type { IResourceHandle, ResourceType } from '@maxellabs/specification';

// ============================================================================
// ResourceHandle Class
// ============================================================================

/**
 * ResourceHandle - 资源句柄实现
 * @description 实现 IResourceHandle 接口的具体类
 */
export class ResourceHandle implements IResourceHandle {
  /** 资源唯一 ID */
  public readonly id: string;

  /** 资源类型 */
  public readonly type: ResourceType;

  /** 资源 URI */
  public readonly uri: string;

  /**
   * 构造函数
   * @param id 资源 ID
   * @param type 资源类型
   * @param uri 资源 URI
   */
  constructor(id: string, type: ResourceType, uri: string) {
    this.id = id;
    this.type = type;
    this.uri = uri;
  }

  /**
   * 转换为字符串（用于调试）
   * @returns 字符串表示
   */
  toString(): string {
    return `ResourceHandle(${this.type}:${this.uri})`;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * 创建资源句柄
 * @param uri 资源 URI
 * @param type 资源类型
 * @param idCounter 资源 ID 计数器
 * @returns 新的资源句柄实例
 */
export function createResourceHandle(uri: string, type: ResourceType, idCounter: number): ResourceHandle {
  const id = `${type}_${idCounter}`;
  return new ResourceHandle(id, type, uri);
}
