import { EventDispatcher } from '../base/eventDispatcher';
import { Texture2D } from '../texture/Texture2D';
import { Mesh } from '../geometry/Mesh';
import { Material } from '../material/Material';
import { Shader } from '../shader/Shader';
import { Engine } from '../Engine';

/**
 * 资源类型枚举
 */
export enum ResourceType {
  /** 纹理 */
  Texture,
  /** 模型 */
  Model,
  /** 材质 */
  Material,
  /** 着色器 */
  Shader,
  /** 网格 */
  Mesh,
  /** 立方体贴图 */
  CubeMap,
  /** 自定义 */
  Custom
}

/**
 * 资源加载状态枚举
 */
export enum ResourceLoadState {
  /** 未加载 */
  Unloaded,
  /** 加载中 */
  Loading,
  /** 已加载 */
  Loaded,
  /** 加载失败 */
  Failed
}

/**
 * 资源接口
 */
export interface Resource {
  /** 资源类型 */
  type: ResourceType;
  /** 资源加载状态 */
  loadState: ResourceLoadState;
  /** 资源路径 */
  path: string;
  /** 资源名称 */
  name: string;
  /** 资源是否由引擎内部创建 */
  isInternal: boolean;
  /** 引用计数 */
  referenceCount: number;
  /** 资源是否可垃圾回收 */
  isGCIgnored: boolean;
  /** 加载资源 */
  load(): Promise<Resource>;
  /** 卸载资源 */
  unload(): void;
  /** 销毁资源 */
  destroy(): void;
}

/**
 * 资源加载选项
 */
export interface ResourceLoadOptions {
  /** 是否缓存资源 */
  cache?: boolean;
}

/**
 * 资源管理器，负责资源的加载、卸载和管理
 */
export class ResourceManager extends EventDispatcher {
  /** 引擎实例 */
  private _engine: Engine;
  /** 资源缓存 */
  private _cache: Map<string, Resource> = new Map();
  /** 资源加载状态 */
  private _loadingPromises: Map<string, Promise<Resource>> = new Map();
  /** 内置资源 */
  private _builtins: Map<string, Resource> = new Map();
  /** 默认资源 */
  private _defaults: Map<ResourceType, Resource> = new Map();
  /** 是否正在进行垃圾回收 */
  private _isGarbageCollecting: boolean = false;

  /**
   * 创建资源管理器
   * @param engine 引擎实例
   */
  constructor(engine: Engine) {
    super();
    this._engine = engine;
    this._initializeBuiltins();
  }

  /**
   * 初始化内置资源
   */
  private _initializeBuiltins(): void {
    // 创建内置材质
    this._createBuiltinMeshes();
    this._createBuiltinTextures();
    this._createBuiltinMaterials();
    this._createBuiltinShaders();
  }

  /**
   * 创建内置网格
   */
  private _createBuiltinMeshes(): void {
    // 创建原始网格 (球体、立方体、平面等)
    const createPrimitiveMesh = (name: string): Mesh => {
      const mesh = new Mesh(name);
      mesh.isInternal = true;
      mesh.isGCIgnored = true;
      mesh.loadState = ResourceLoadState.Loaded;
      this._builtins.set(`mesh:${name}`, mesh);
      return mesh;
    };

    // 创建基础形状
    const cube = createPrimitiveMesh('cube');
    const sphere = createPrimitiveMesh('sphere');
    const plane = createPrimitiveMesh('plane');
    const cylinder = createPrimitiveMesh('cylinder');
    const cone = createPrimitiveMesh('cone');
    const quad = createPrimitiveMesh('quad');

    // 创建立方体
    // 此处应该设置顶点、索引等数据，但为简化示例，省略具体实现
    // cube.setVertices(...);
    // cube.setIndices(...);

    // 同样为其他基础形状设置数据
  }

  /**
   * 创建内置纹理
   */
  private _createBuiltinTextures(): void {
    const createBuiltinTexture = (name: string, width: number = 4, height: number = 4): Texture2D => {
      const texture = new Texture2D(this._engine, width, height);
      texture.name = name;
      texture.isInternal = true;
      texture.isGCIgnored = true;
      texture.loadState = ResourceLoadState.Loaded;
      this._builtins.set(`texture:${name}`, texture);
      return texture;
    };

    // 创建白色纹理
    const whiteTexture = createBuiltinTexture('white');
    const data = new Uint8Array(whiteTexture.width * whiteTexture.height * 4);
    data.fill(255);
    whiteTexture.setPixelData(data);

    // 创建黑色纹理
    const blackTexture = createBuiltinTexture('black');
    const blackData = new Uint8Array(blackTexture.width * blackTexture.height * 4);
    blackData.fill(0);
    blackTexture.setPixelData(blackData);

    // 创建法线纹理 (0.5, 0.5, 1.0, 1.0)
    const normalTexture = createBuiltinTexture('normal');
    const normalData = new Uint8Array(normalTexture.width * normalTexture.height * 4);
    for (let i = 0; i < normalData.length; i += 4) {
      normalData[i] = 128;     // R = 0.5
      normalData[i + 1] = 128; // G = 0.5
      normalData[i + 2] = 255; // B = 1.0
      normalData[i + 3] = 255; // A = 1.0
    }
    normalTexture.setPixelData(normalData);

    // 设置默认纹理
    this._defaults.set(ResourceType.Texture, whiteTexture);
  }

  /**
   * 创建内置材质
   */
  private _createBuiltinMaterials(): void {
    const createBuiltinMaterial = (name: string): Material => {
      const material = new Material(name, this._engine);
      material.isInternal = true;
      material.isGCIgnored = true;
      material.loadState = ResourceLoadState.Loaded;
      this._builtins.set(`material:${name}`, material);
      return material;
    };

    // 创建默认材质
    const defaultMaterial = createBuiltinMaterial('default');
    // 设置默认材质属性
    const whiteTexture = this.getBuiltinTexture('white');
    defaultMaterial.setTexture('diffuse', whiteTexture);

    // 创建错误材质 (显示为粉色)
    const errorMaterial = createBuiltinMaterial('error');
    // 设置错误材质为亮粉色

    // 设置默认材质
    this._defaults.set(ResourceType.Material, defaultMaterial);
  }

  /**
   * 创建内置着色器
   */
  private _createBuiltinShaders(): void {
    const createBuiltinShader = (name: string, vsSource: string, fsSource: string): Shader => {
      const shader = new Shader(name, this._engine);
      shader.isInternal = true;
      shader.isGCIgnored = true;
      shader.loadState = ResourceLoadState.Loaded;
      this._builtins.set(`shader:${name}`, shader);
      return shader;
    };

    // 创建标准着色器
    const standardVS = `
      // 标准顶点着色器代码
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;
      uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
      uniform mat4 projectionMatrix;
      varying vec2 v_uv;
      varying vec3 v_normal;
      void main() {
        v_uv = uv;
        v_normal = (modelMatrix * vec4(normal, 0.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `;

    const standardFS = `
      // 标准片段着色器代码
      precision mediump float;
      varying vec2 v_uv;
      varying vec3 v_normal;
      uniform sampler2D diffuseTexture;
      uniform vec4 diffuseColor;
      void main() {
        vec4 color = texture2D(diffuseTexture, v_uv) * diffuseColor;
        gl_FragColor = color;
      }
    `;

    // 创建标准着色器
    const standardShader = createBuiltinShader('standard', standardVS, standardFS);

    // 设置默认着色器
    this._defaults.set(ResourceType.Shader, standardShader);
  }

  /**
   * 加载纹理
   * @param path 纹理路径
   * @param options 加载选项
   * @returns 加载的纹理
   */
  loadTexture(path: string, options: ResourceLoadOptions = { cache: true }): Promise<Texture2D> {
    return this._loadResource(ResourceType.Texture, path, options) as Promise<Texture2D>;
  }

  /**
   * 加载网格
   * @param path 网格路径
   * @param options 加载选项
   * @returns 加载的网格
   */
  loadMesh(path: string, options: ResourceLoadOptions = { cache: true }): Promise<Mesh> {
    return this._loadResource(ResourceType.Mesh, path, options) as Promise<Mesh>;
  }

  /**
   * 加载着色器
   * @param path 着色器路径
   * @param options 加载选项
   * @returns 加载的着色器
   */
  loadShader(path: string, options: ResourceLoadOptions = { cache: true }): Promise<Shader> {
    return this._loadResource(ResourceType.Shader, path, options) as Promise<Shader>;
  }

  /**
   * 加载模型
   * @param path 模型路径
   * @param options 加载选项
   * @returns 加载的模型
   */
  loadModel(path: string, options: ResourceLoadOptions = { cache: true }): Promise<any> {
    return this._loadResource(ResourceType.Model, path, options);
  }

  /**
   * 加载资源
   * @param type 资源类型
   * @param path 资源路径
   * @param options 加载选项
   * @returns 加载的资源
   */
  private _loadResource(type: ResourceType, path: string, options: ResourceLoadOptions): Promise<Resource> {
    const key = `${type}:${path}`;

    // 检查资源是否已缓存
    if (this._cache.has(key)) {
      const cachedResource = this._cache.get(key);
      // 增加引用计数
      cachedResource.referenceCount++;
      return Promise.resolve(cachedResource);
    }

    // 检查是否正在加载中
    if (this._loadingPromises.has(key)) {
      return this._loadingPromises.get(key);
    }

    // 创建资源实例
    let resource: Resource;
    switch (type) {
      case ResourceType.Texture:
        resource = new Texture2D(this._engine);
        break;
      case ResourceType.Mesh:
        resource = new Mesh();
        break;
      case ResourceType.Shader:
        resource = new Shader('', this._engine);
        break;
      case ResourceType.Material:
        resource = new Material('', this._engine);
        break;
      default:
        return Promise.reject(new Error(`Unsupported resource type: ${type}`));
    }

    // 设置资源属性
    resource.path = path;
    resource.name = path.substring(path.lastIndexOf('/') + 1);
    resource.type = type;
    resource.isInternal = false;
    resource.referenceCount = 1;

    // 开始加载
    const loadPromise = resource.load()
      .then(loadedResource => {
        // 加载完成，从加载中列表移除
        this._loadingPromises.delete(key);

        // 如果需要缓存，则添加到缓存
        if (options.cache) {
          this._cache.set(key, loadedResource);
        }

        return loadedResource;
      })
      .catch(error => {
        // 加载失败，从加载中列表移除
        this._loadingPromises.delete(key);
        console.error(`Failed to load resource: ${path}`, error);

        // 返回默认资源
        if (this._defaults.has(type)) {
          return this._defaults.get(type);
        }

        throw error;
      });

    // 添加到加载中列表
    this._loadingPromises.set(key, loadPromise);

    return loadPromise;
  }

  /**
   * 获取内置网格
   * @param name 网格名称
   * @returns 内置网格
   */
  getBuiltinMesh(name: string): Mesh {
    const key = `mesh:${name}`;
    if (this._builtins.has(key)) {
      return this._builtins.get(key) as Mesh;
    }
    return null;
  }

  /**
   * 获取内置纹理
   * @param name 纹理名称
   * @returns 内置纹理
   */
  getBuiltinTexture(name: string): Texture2D {
    const key = `texture:${name}`;
    if (this._builtins.has(key)) {
      return this._builtins.get(key) as Texture2D;
    }
    return null;
  }

  /**
   * 获取内置材质
   * @param name 材质名称
   * @returns 内置材质
   */
  getBuiltinMaterial(name: string): Material {
    const key = `material:${name}`;
    if (this._builtins.has(key)) {
      return this._builtins.get(key) as Material;
    }
    return null;
  }

  /**
   * 获取内置着色器
   * @param name 着色器名称
   * @returns 内置着色器
   */
  getBuiltinShader(name: string): Shader {
    const key = `shader:${name}`;
    if (this._builtins.has(key)) {
      return this._builtins.get(key) as Shader;
    }
    return null;
  }

  /**
   * 释放资源
   * @param resource 要释放的资源
   * @param force 是否强制释放
   */
  releaseResource(resource: Resource, force: boolean = false): void {
    if (!resource) {
      return;
    }

    // 减少引用计数
    resource.referenceCount--;

    // 如果引用计数为0且不是内部资源，或强制释放，则卸载资源
    if ((resource.referenceCount <= 0 && !resource.isInternal && !resource.isGCIgnored) || force) {
      const key = `${resource.type}:${resource.path}`;
      
      // 从缓存中移除
      this._cache.delete(key);
      
      // 卸载资源
      resource.unload();
    }
  }

  /**
   * 释放所有资源
   * @param skipInternal 是否跳过内部资源
   */
  releaseAll(skipInternal: boolean = true): void {
    // 释放缓存中的所有资源
    for (const resource of this._cache.values()) {
      if (skipInternal && resource.isInternal) {
        continue;
      }
      this.releaseResource(resource, true);
    }
  }

  /**
   * 垃圾回收
   */
  garbageCollect(): void {
    if (this._isGarbageCollecting) {
      return;
    }

    this._isGarbageCollecting = true;

    try {
      // 收集引用计数为0的资源
      const resourcesToRelease: Resource[] = [];
      
      for (const resource of this._cache.values()) {
        if (resource.referenceCount <= 0 && !resource.isInternal && !resource.isGCIgnored) {
          resourcesToRelease.push(resource);
        }
      }

      // 释放资源
      for (const resource of resourcesToRelease) {
        this.releaseResource(resource, true);
      }
    } finally {
      this._isGarbageCollecting = false;
    }
  }

  /**
   * 更新资源管理器
   */
  update(): void {
    // 每帧执行的更新逻辑，可以在这里添加垃圾回收触发逻辑
  }

  /**
   * 销毁资源管理器
   */
  destroy(): void {
    // 释放所有资源
    this.releaseAll(false);
    
    // 清空缓存
    this._cache.clear();
    this._loadingPromises.clear();
    this._builtins.clear();
    this._defaults.clear();
  }
} 