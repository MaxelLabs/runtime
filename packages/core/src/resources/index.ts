/**
 * Resource Management
 * 资源管理模块
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策
 *
 * ResourceManager 是 Core 包提供的资源管理器，负责：
 * 1. 资源加载（异步）
 * 2. 资源缓存
 * 3. 资源引用计数
 * 4. 资源释放
 *
 * ## 资源类型
 *
 * Core 定义了以下基础资源类型：
 * - Mesh: 网格数据
 * - Texture: 纹理数据
 * - Material: 材质数据
 * - Shader: 着色器数据
 *
 * ## 扩展方式
 *
 * 应用包可以通过 `registerLoader` 注册自定义加载器来支持新的资源类型。
 *
 * @example
 * ```typescript
 * const resourceManager = new ResourceManager(device);
 *
 * // 加载资源
 * const meshHandle = await resourceManager.loadMesh('models/cube.glb');
 * const textureHandle = await resourceManager.loadTexture('textures/diffuse.png');
 *
 * // 使用资源
 * const mesh = resourceManager.getMesh(meshHandle);
 *
 * // 释放资源
 * resourceManager.release(meshHandle);
 * ```
 */

import { ResourceType, ResourceState } from '@maxellabs/specification';
import type {
  IRHIDevice,
  IResourceHandle,
  IMeshResource,
  ITextureResource,
  IMaterialResource,
  IResourceLoader,
  IDisposable,
} from '@maxellabs/specification';

// ============ 向后兼容的类型别名 ============

/**
 * @deprecated 使用 IResourceHandle 代替
 */
export type ResourceHandle = IResourceHandle;

/**
 * @deprecated 使用 IMeshResource 代替
 */
export type MeshResource = IMeshResource;

/**
 * @deprecated 使用 ITextureResource 代替
 */
export type TextureResource = ITextureResource;

/**
 * @deprecated 使用 IMaterialResource 代替
 */
export type MaterialResource = IMaterialResource;

/**
 * @deprecated 使用 IResourceLoader 代替
 */
export type ILoader<T> = IResourceLoader<T>;

// ============ 内部资源条目 ============

/**
 * ResourceEntry - 内部资源条目
 */
interface ResourceEntry<T> {
  /** 资源数据 */
  data: T | null;
  /** 资源状态 */
  state: ResourceState;
  /** 引用计数 */
  refCount: number;
  /** 加载 Promise */
  loadPromise: Promise<T> | null;
  /** 错误信息 */
  error: Error | null;
}

// ============ ResourceManager ============

/**
 * ResourceManager - 资源管理器
 * 负责资源的加载、缓存和释放
 */
export class ResourceManager implements IDisposable {
  /** RHI 设备 */
  private device: IRHIDevice | null = null;

  /** 资源缓存 */
  private meshes: Map<string, ResourceEntry<MeshResource>> = new Map();
  private textures: Map<string, ResourceEntry<TextureResource>> = new Map();
  private materials: Map<string, ResourceEntry<MaterialResource>> = new Map();

  /** 自定义加载器 */
  private loaders: Map<string, ILoader<unknown>> = new Map();

  /** 资源 ID 计数器 */
  private resourceIdCounter: number = 0;

  /** 是否已销毁 */
  private _disposed: boolean = false;

  constructor(device?: IRHIDevice) {
    this.device = device ?? null;
  }

  /**
   * 设置 RHI 设备
   */
  setDevice(device: IRHIDevice): void {
    this.device = device;
  }

  /**
   * 检查是否已销毁
   */
  isDisposed(): boolean {
    return this._disposed;
  }

  // ==================== 网格资源 ====================

  /**
   * 加载网格资源
   */
  async loadMesh(uri: string): Promise<ResourceHandle> {
    this.checkDisposed();

    // 检查缓存
    let entry = this.meshes.get(uri);
    if (entry) {
      entry.refCount++;
      if (entry.loadPromise) {
        await entry.loadPromise;
      }
      return this.createHandle(uri, ResourceType.Mesh);
    }

    // 创建新条目
    entry = {
      data: null,
      state: ResourceState.Loading,
      refCount: 1,
      loadPromise: null,
      error: null,
    };
    this.meshes.set(uri, entry);

    // 异步加载
    entry.loadPromise = this.doLoadMesh(uri, entry);
    await entry.loadPromise;

    return this.createHandle(uri, ResourceType.Mesh);
  }

  /**
   * 获取网格资源
   */
  getMesh(handle: ResourceHandle): MeshResource | undefined {
    if (handle.type !== ResourceType.Mesh) {
      return undefined;
    }
    const entry = this.meshes.get(handle.uri);
    return entry?.data ?? undefined;
  }

  /**
   * 实际加载网格（子类可重写）
   */
  protected async doLoadMesh(uri: string, entry: ResourceEntry<MeshResource>): Promise<MeshResource> {
    // 默认实现：创建空网格
    // 实际加载逻辑由应用包实现或注册自定义加载器
    const loader = this.loaders.get('mesh');
    if (loader) {
      try {
        const data = (await loader.load(uri, this.device!)) as MeshResource;
        entry.data = data;
        entry.state = ResourceState.Loaded;
        return data;
      } catch (error) {
        entry.state = ResourceState.Failed;
        entry.error = error instanceof Error ? error : new Error(String(error));
        throw entry.error;
      }
    }

    // 没有加载器，返回空网格
    const emptyMesh: MeshResource = {
      vertexBuffer: null,
      indexBuffer: null,
      indexCount: 0,
      vertexCount: 0,
      primitiveType: 'triangles',
    };
    entry.data = emptyMesh;
    entry.state = ResourceState.Loaded;
    return emptyMesh;
  }

  // ==================== 纹理资源 ====================

  /**
   * 加载纹理资源
   */
  async loadTexture(uri: string): Promise<ResourceHandle> {
    this.checkDisposed();

    // 检查缓存
    let entry = this.textures.get(uri);
    if (entry) {
      entry.refCount++;
      if (entry.loadPromise) {
        await entry.loadPromise;
      }
      return this.createHandle(uri, ResourceType.Texture);
    }

    // 创建新条目
    entry = {
      data: null,
      state: ResourceState.Loading,
      refCount: 1,
      loadPromise: null,
      error: null,
    };
    this.textures.set(uri, entry);

    // 异步加载
    entry.loadPromise = this.doLoadTexture(uri, entry);
    await entry.loadPromise;

    return this.createHandle(uri, ResourceType.Texture);
  }

  /**
   * 获取纹理资源
   */
  getTexture(handle: ResourceHandle): TextureResource | undefined {
    if (handle.type !== ResourceType.Texture) {
      return undefined;
    }
    const entry = this.textures.get(handle.uri);
    return entry?.data ?? undefined;
  }

  /**
   * 实际加载纹理（子类可重写）
   */
  protected async doLoadTexture(uri: string, entry: ResourceEntry<TextureResource>): Promise<TextureResource> {
    const loader = this.loaders.get('texture');
    if (loader) {
      try {
        const data = (await loader.load(uri, this.device!)) as TextureResource;
        entry.data = data;
        entry.state = ResourceState.Loaded;
        return data;
      } catch (error) {
        entry.state = ResourceState.Failed;
        entry.error = error instanceof Error ? error : new Error(String(error));
        throw entry.error;
      }
    }

    // 没有加载器，返回空纹理
    const emptyTexture: TextureResource = {
      texture: null,
      width: 1,
      height: 1,
      hasMipmaps: false,
    };
    entry.data = emptyTexture;
    entry.state = ResourceState.Loaded;
    return emptyTexture;
  }

  // ==================== 材质资源 ====================

  /**
   * 加载材质资源
   */
  async loadMaterial(uri: string): Promise<ResourceHandle> {
    this.checkDisposed();

    // 检查缓存
    let entry = this.materials.get(uri);
    if (entry) {
      entry.refCount++;
      if (entry.loadPromise) {
        await entry.loadPromise;
      }
      return this.createHandle(uri, ResourceType.Material);
    }

    // 创建新条目
    entry = {
      data: null,
      state: ResourceState.Loading,
      refCount: 1,
      loadPromise: null,
      error: null,
    };
    this.materials.set(uri, entry);

    // 异步加载
    entry.loadPromise = this.doLoadMaterial(uri, entry);
    await entry.loadPromise;

    return this.createHandle(uri, ResourceType.Material);
  }

  /**
   * 获取材质资源
   */
  getMaterial(handle: ResourceHandle): MaterialResource | undefined {
    if (handle.type !== ResourceType.Material) {
      return undefined;
    }
    const entry = this.materials.get(handle.uri);
    return entry?.data ?? undefined;
  }

  /**
   * 实际加载材质（子类可重写）
   */
  protected async doLoadMaterial(uri: string, entry: ResourceEntry<MaterialResource>): Promise<MaterialResource> {
    const loader = this.loaders.get('material');
    if (loader) {
      try {
        const data = (await loader.load(uri, this.device!)) as MaterialResource;
        entry.data = data;
        entry.state = ResourceState.Loaded;
        return data;
      } catch (error) {
        entry.state = ResourceState.Failed;
        entry.error = error instanceof Error ? error : new Error(String(error));
        throw entry.error;
      }
    }

    // 没有加载器，返回空材质
    const emptyMaterial: MaterialResource = {
      shaderId: 'default',
      properties: {},
      textures: {},
    };
    entry.data = emptyMaterial;
    entry.state = ResourceState.Loaded;
    return emptyMaterial;
  }

  // ==================== 资源释放 ====================

  /**
   * 释放资源
   */
  release(handle: ResourceHandle): void {
    this.checkDisposed();

    switch (handle.type) {
      case ResourceType.Mesh:
        this.releaseMesh(handle.uri);
        break;
      case ResourceType.Texture:
        this.releaseTexture(handle.uri);
        break;
      case ResourceType.Material:
        this.releaseMaterial(handle.uri);
        break;
    }
  }

  private releaseMesh(uri: string): void {
    const entry = this.meshes.get(uri);
    if (!entry) {
      return;
    }

    entry.refCount--;
    if (entry.refCount <= 0) {
      // 释放 GPU 资源
      if (entry.data) {
        entry.data.vertexBuffer?.destroy();
        entry.data.indexBuffer?.destroy();
      }
      entry.state = ResourceState.Released;
      this.meshes.delete(uri);
    }
  }

  private releaseTexture(uri: string): void {
    const entry = this.textures.get(uri);
    if (!entry) {
      return;
    }

    entry.refCount--;
    if (entry.refCount <= 0) {
      // 释放 GPU 资源
      if (entry.data?.texture) {
        entry.data.texture.destroy();
      }
      entry.state = ResourceState.Released;
      this.textures.delete(uri);
    }
  }

  private releaseMaterial(uri: string): void {
    const entry = this.materials.get(uri);
    if (!entry) {
      return;
    }

    entry.refCount--;
    if (entry.refCount <= 0) {
      entry.state = ResourceState.Released;
      this.materials.delete(uri);
    }
  }

  /**
   * 释放所有资源
   */
  releaseAll(): void {
    // 释放所有网格
    for (const [_, entry] of this.meshes) {
      if (entry.data) {
        entry.data.vertexBuffer?.destroy();
        entry.data.indexBuffer?.destroy();
      }
    }
    this.meshes.clear();

    // 释放所有纹理
    for (const [_, entry] of this.textures) {
      if (entry.data?.texture) {
        entry.data.texture.destroy();
      }
    }
    this.textures.clear();

    // 释放所有材质
    this.materials.clear();
  }

  // ==================== 加载器注册 ====================

  /**
   * 注册自定义加载器
   */
  registerLoader<T>(type: string, loader: ILoader<T>): void {
    this.loaders.set(type, loader as ILoader<unknown>);
  }

  /**
   * 获取加载器
   */
  getLoader<T>(type: string): ILoader<T> | undefined {
    return this.loaders.get(type) as ILoader<T> | undefined;
  }

  // ==================== 统计信息 ====================

  /**
   * 获取统计信息
   */
  getStats(): {
    meshCount: number;
    textureCount: number;
    materialCount: number;
    loaderCount: number;
  } {
    return {
      meshCount: this.meshes.size,
      textureCount: this.textures.size,
      materialCount: this.materials.size,
      loaderCount: this.loaders.size,
    };
  }

  // ==================== 生命周期 ====================

  /**
   * 销毁资源管理器
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    this.releaseAll();
    this.loaders.clear();
    this._disposed = true;
  }

  // ==================== 私有方法 ====================

  private checkDisposed(): void {
    if (this._disposed) {
      throw new Error('ResourceManager has been disposed');
    }
  }

  private createHandle(uri: string, type: ResourceType): ResourceHandle {
    return {
      id: `${type}_${++this.resourceIdCounter}`,
      type,
      uri,
    };
  }
}
