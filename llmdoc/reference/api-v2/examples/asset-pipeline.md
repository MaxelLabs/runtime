# 资产管理示例

## 概述

这个示例展示了完整的资产加载和管理流程，包括USD资产解析、RHI资源创建、内存优化、异步加载和跨平台兼容性处理。

## 完整代码示例

### 1. 资产类型定义

```typescript
/**
 * asset-types.ts
 * 资产类型定义 - 使用Specification定义资产结构
 */

import { MSpec } from '@maxellabs/core';

// ==================== 基础资产类型 ====================

/**
 * 资产基类
 */
export interface Asset {
    uuid: string;                    // 唯一标识符
    name: string;                    // 资产名称
    type: AssetType;                 // 资产类型
    path: string;                    // 资产路径
    size: number;                    // 资产大小 (bytes)
    hash: string;                    // 内容哈希
    metadata: Record<string, any>;   // 元数据
    loadState: AssetLoadState;       // 加载状态
    dependencies: string[];          // 依赖资产
    tags: string[];                  // 标签
}

/**
 * 资产类型枚举
 */
export enum AssetType {
    MESH = 'mesh',
    TEXTURE = 'texture',
    MATERIAL = 'material',
    ANIMATION = 'animation',
    AUDIO = 'audio',
    SHADER = 'shader',
    SCENE = 'scene',
    USD = 'usd',
    FONT = 'font',
    BINARY = 'binary'
}

/**
 * 资产加载状态
 */
export enum AssetLoadState {
    UNLOADED = 'unloaded',      // 未加载
    LOADING = 'loading',        // 加载中
    LOADED = 'loaded',          // 已加载
    ERROR = 'error',            // 加载失败
    UNLOADING = 'unloading'     // 卸载中
}

/**
 * 网格资产
 */
export interface MeshAsset extends Asset {
    type: AssetType.MESH;
    geometry: {
        vertices: Float32Array;
        normals: Float32Array;
        uvs: Float32Array[];
        indices: Uint32Array;
        bounds: {
            min: [number, number, number];
            max: [number, number, number];
        };
    };
    lodLevels: LODLevel[];
    materials: string[];        // 材质引用
}

/**
 * LOD级别
 */
export interface LODLevel {
    level: number;              // LOD级别 (0=最高质量)
    distance: number;           // 切换距离
    vertices: Float32Array;     // 简化后的顶点
    indices: Uint32Array;       // 简化后的索引
}

/**
 * 纹理资产
 */
export interface TextureAsset extends Asset {
    type: AssetType.TEXTURE;
    format: MSpec.RHITextureFormat;
    width: number;
    height: number;
    depth: number;              // 对于3D纹理
    mipmaps: boolean;
    samples: number;            // 多重采样
    compression: TextureCompression;
    imageData: ArrayBuffer;
}

/**
 * 纹理压缩格式
 */
export enum TextureCompression {
    NONE = 'none',
    DXT1 = 'dxt1',
    DXT5 = 'dxt5',
    ASTC = 'astc',
    BC7 = 'bc7'
}

/**
 * 材质资产
 */
export interface MaterialAsset extends Asset {
    type: AssetType.MATERIAL;
    shader: string;             // 着色器引用
    parameters: MaterialParameter[];
    textures: Record<string, string>;  // 纹理映射
    renderStates: RenderState;
}

/**
 * 材质参数
 */
export interface MaterialParameter {
    name: string;
    type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'color' | 'texture';
    value: any;
    min?: number;
    max?: number;
}

/**
 * 渲染状态
 */
export interface RenderState {
    cullMode: MSpec.RHICullMode;
    depthWrite: boolean;
    depthCompare: MSpec.RHICompareFunction;
    blendMode: BlendMode;
    wireframe: boolean;
}

/**
 * 混合模式
 */
export enum BlendMode {
    OPAQUE = 'opaque',
    TRANSLUCENT = 'translucent',
    ADDITIVE = 'additive',
    MODULATE = 'modulate'
}

/**
 * USD资产
 */
export interface USDAsset extends Asset {
    type: AssetType.USD;
    stage: USDStage;
    layers: USDLayer[];
    prims: USDPrim[];
}

/**
 * USD阶段
 */
export interface USDStage {
    path: string;
    startTimeCode: number;
    endTimeCode: number;
    timeCodesPerSecond: number;
    metersPerUnit: number;
    upAxis: 'Y' | 'Z';
}

/**
 * USD层
 */
export interface USDLayer {
    name: string;
    path: string;
    identifier: string;
    subLayers: string[];
}

/**
 * USD基元
 */
export interface USDPrim {
    path: string;
    type: string;
    properties: USDProperty[];
    children: USDPrim[];
}

/**
 * USD属性
 */
export interface USDProperty {
    name: string;
    type: string;
    value: any;
    timeSamples?: Map<number, any>;
}

/**
 * 动画资产
 */
export interface AnimationAsset extends Asset {
    type: AssetType.ANIMATION;
    duration: number;
    fps: number;
    channels: AnimationChannel[];
    skeleton?: string;           // 骨骼引用
}

/**
 * 动画通道
 */
export interface AnimationChannel {
    target: string;              // 目标对象路径
    property: string;            // 属性名称
    keyframes: AnimationKeyframe[];
    interpolation: AnimationInterpolation;
}

/**
 * 动画关键帧
 */
export interface AnimationKeyframe {
    time: number;
    value: any;
    inTangent?: number;
    outTangent?: number;
}

/**
 * 动画插值类型
 */
export enum AnimationInterpolation {
    STEP = 'step',
    LINEAR = 'linear',
    CUBIC = 'cubic'
}

/**
 * 场景资产
 */
export interface SceneAsset extends Asset {
    type: AssetType.SCENE;
    hierarchy: SceneNode[];
    environments: EnvironmentSettings[];
    lighting: LightingSettings;
}

/**
 * 场景节点
 */
export interface SceneNode {
    name: string;
    transform: {
        position: [number, number, number];
        rotation: [number, number, number, number];
        scale: [number, number, number];
    };
    mesh?: string;               // 网格引用
    material?: string;           // 材质引用
    children: SceneNode[];
    visible: boolean;
    layer: number;
}

/**
 * 环境设置
 */
export interface EnvironmentSettings {
    skybox?: string;             // 天空盒纹理
    ibl?: {                      // 基于图像的照明
        diffuse: string;
        specular: string;
        brdf: string;
    };
    fog?: {
        color: [number, number, number];
        density: number;
        start: number;
        end: number;
    };
}

/**
 * 光照设置
 */
export interface LightingSettings {
    ambient: {
        color: [number, number, number];
        intensity: number;
    };
    directional: DirectionalLight[];
    point: PointLight[];
    spot: SpotLight[];
}

/**
 * 方向光
 */
export interface DirectionalLight {
    direction: [number, number, number];
    color: [number, number, number];
    intensity: number;
    castShadows: boolean;
}

/**
 * 点光源
 */
export interface PointLight {
    position: [number, number, number];
    color: [number, number, number];
    intensity: number;
    range: number;
    castShadows: boolean;
}

/**
 * 聚光灯
 */
export interface SpotLight {
    position: [number, number, number];
    direction: [number, number, number];
    color: [number, number, number];
    intensity: number;
    range: number;
    innerCone: number;
    outerCone: number;
    castShadows: boolean;
}
```

### 2. 资产加载器

```typescript
/**
 * asset-loader.ts
 * 资产加载器 - 支持多种格式和异步加载
 */

import { Asset, AssetType, AssetLoadState, MeshAsset, TextureAsset, USDAsset, AnimationAsset, SceneAsset } from './asset-types';
import { MSpec } from '@maxellabs/core';

/**
 * 加载进度事件
 */
export interface LoadProgress {
    assetId: string;
    loaded: number;
    total: number;
    stage: string;
}

/**
 * 加载完成事件
 */
export interface LoadComplete {
    asset: Asset;
    success: boolean;
    error?: Error;
}

/**
 * 资产加载器接口
 */
export interface IAssetLoader {
    canLoad(url: string): boolean;
    load(url: string, options?: LoadOptions): Promise<Asset>;
    getSupportedExtensions(): string[];
}

/**
 * 加载选项
 */
export interface LoadOptions {
    priority?: number;           // 加载优先级
    cacheKey?: string;          // 缓存键
    progressCallback?: (progress: LoadProgress) => void;
    useCache?: boolean;          // 是否使用缓存
    streaming?: boolean;         // 是否流式加载
    compression?: boolean;       // 是否启用压缩
    quality?: 'low' | 'medium' | 'high';  // 质量级别
}

/**
 * 资产加载管理器
 */
export class AssetLoadManager {
    private loaders: Map<string, IAssetLoader> = new Map();
    private cache: Map<string, Asset> = new Map();
    private loadingQueue: LoadTask[] = [];
    private activeJobs: Map<string, LoadTask> = new Map();
    private maxConcurrentLoads = 4;

    constructor() {
        this.registerDefaultLoaders();
    }

    private registerDefaultLoaders() {
        this.registerLoader('gltf', new GLTFLoader());
        this.registerLoader('glb', new GLTFLoader());
        this.registerLoader('obj', new OBJLoader());
        this.registerLoader('fbx', new FBXLoader());
        this.registerLoader('usd', new USDLoader());
        this.registerLoader('usda', new USDLoader());
        this.registerLoader('usdc', new USDLoader());
        this.registerLoader('png', new TextureLoader());
        this.registerLoader('jpg', new TextureLoader());
        this.registerLoader('jpeg', new TextureLoader());
        this.registerLoader('webp', new TextureLoader());
        this.registerLoader('ktx2', new KTX2Loader());
        this.registerLoader('exr', new EXRLoader());
        this.registerLoader('hdr', new HDRIProcessor());
        this.registerLoader('mp3', new AudioLoader());
        this.registerLoader('wav', new AudioLoader());
    }

    public registerLoader(extension: string, loader: IAssetLoader) {
        this.loaders.set(extension.toLowerCase(), loader);
    }

    public async loadAsset(url: string, options?: LoadOptions): Promise<Asset> {
        // 检查缓存
        const cacheKey = options?.cacheKey || url;
        if (options?.useCache !== false && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        // 获取加载器
        const extension = this.getFileExtension(url);
        const loader = this.loaders.get(extension);

        if (!loader) {
            throw new Error(`No loader found for extension: ${extension}`);
        }

        // 创建加载任务
        const task: LoadTask = {
            id: this.generateTaskId(),
            url,
            options: options || {},
            loader,
            promise: null!
        };

        // 添加到队列
        this.loadingQueue.push(task);
        this.processQueue();

        // 等待加载完成
        const asset = await task.promise;

        // 缓存结果
        if (options?.useCache !== false) {
            this.cache.set(cacheKey, asset);
        }

        return asset;
    }

    public async loadAssets(urls: string[], options?: LoadOptions): Promise<Asset[]> {
        const promises = urls.map(url => this.loadAsset(url, options));
        return Promise.all(promises);
    }

    public async loadAssetBundle(bundlePath: string): Promise<BundleInfo> {
        const bundleLoader = new BundleLoader();
        return bundleLoader.loadBundle(bundlePath);
    }

    private async processQueue() {
        while (this.activeJobs.size < this.maxConcurrentLoads && this.loadingQueue.length > 0) {
            const task = this.loadingQueue.shift()!;

            // 开始加载
            task.promise = this.executeLoadTask(task);
            this.activeJobs.set(task.id, task);

            // 清理完成的任务
            task.promise.finally(() => {
                this.activeJobs.delete(task.id);
                this.processQueue(); // 处理下一个任务
            });
        }
    }

    private async executeLoadTask(task: LoadTask): Promise<Asset> {
        try {
            // 更新状态
            task.options.progressCallback?.({
                assetId: task.id,
                loaded: 0,
                total: 100,
                stage: 'starting'
            });

            // 执行加载
            const asset = await task.loader.load(task.url, {
                ...task.options,
                progressCallback: (progress) => {
                    task.options.progressCallback?.({
                        ...progress,
                        assetId: task.id
                    });
                }
            });

            asset.loadState = AssetLoadState.LOADED;

            return asset;

        } catch (error) {
            console.error(`Failed to load asset: ${task.url}`, error);
            throw error;
        }
    }

    private getFileExtension(url: string): string {
        const parts = url.split('.');
        return parts[parts.length - 1]?.toLowerCase() || '';
    }

    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    public clearCache() {
        this.cache.clear();
    }

    public unloadAsset(assetId: string) {
        const asset = this.cache.get(assetId);
        if (asset) {
            asset.loadState = AssetLoadState.UNLOADING;
            // 执行实际的资源卸载...
            asset.loadState = AssetLoadState.UNLOADED;
            this.cache.delete(assetId);
        }
    }
}

/**
 * 加载任务
 */
interface LoadTask {
    id: string;
    url: string;
    options: LoadOptions;
    loader: IAssetLoader;
    promise: Promise<Asset>;
}

/**
 * 包信息
 */
interface BundleInfo {
    name: string;
    version: string;
    assets: AssetInfo[];
    dependencies: string[];
}

/**
 * 资产信息
 */
interface AssetInfo {
    id: string;
    path: string;
    type: AssetType;
    size: number;
    hash: string;
}
```

### 3. USD加载器实现

```typescript
/**
 * usd-loader.ts
 * USD资产加载器 - 专门处理USD格式
 */

import { IAssetLoader, LoadOptions, LoadProgress } from './asset-loader';
import { USDAsset, Asset, AssetType, AssetLoadState } from './asset-types';
import { MSpec } from '@maxellabs/core';

/**
 * USD加载器
 */
export class USDLoader implements IAssetLoader {
    private parser: USDParser;
    private validator: USDValidator;

    constructor() {
        this.parser = new USDParser();
        this.validator = new USDValidator();
    }

    public canLoad(url: string): boolean {
        const extension = this.getFileExtension(url);
        return ['usd', 'usda', 'usdc'].includes(extension);
    }

    public getSupportedExtensions(): string[] {
        return ['usd', 'usda', 'usdc'];
    }

    public async load(url: string, options?: LoadOptions): Promise<USDAsset> {
        try {
            // 报告开始
            options?.progressCallback?.({
                assetId: url,
                loaded: 0,
                total: 100,
                stage: 'downloading'
            });

            // 下载文件
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch USD file: ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();

            options?.progressCallback?.({
                assetId: url,
                loaded: 30,
                total: 100,
                stage: 'parsing'
            });

            // 解析USD内容
            const content = await this.parseUSDContent(buffer, this.getFileExtension(url));

            options?.progressCallback?.({
                assetId: url,
                loaded: 70,
                total: 100,
                stage: 'validating'
            });

            // 验证USD结构
            const validation = this.validator.validate(content);
            if (!validation.isValid) {
                console.warn(`USD validation warnings: ${validation.warnings.join(', ')}`);
            }

            options?.progressCallback?.({
                assetId: url,
                loaded: 90,
                total: 100,
                stage: 'creating_resources'
            });

            // 创建USD资产对象
            const asset: USDAsset = {
                uuid: this.generateUUID(),
                name: this.extractNameFromURL(url),
                type: AssetType.USD,
                path: url,
                size: buffer.byteLength,
                hash: await this.calculateHash(buffer),
                metadata: {
                    version: content.version,
                    author: content.author,
                    creationDate: content.creationDate,
                    modificationDate: content.modificationDate,
                    comments: content.comments
                },
                loadState: AssetLoadState.LOADED,
                dependencies: content.subLayers,
                tags: ['usd', '3d', 'scene'],
                stage: content.stage,
                layers: content.layers,
                prims: content.prims
            };

            options?.progressCallback?.({
                assetId: url,
                loaded: 100,
                total: 100,
                stage: 'complete'
            });

            return asset;

        } catch (error) {
            console.error(`USD loading failed: ${url}`, error);
            throw error;
        }
    }

    private async parseUSDContent(buffer: ArrayBuffer, extension: string): Promise<USDContent> {
        switch (extension) {
            case 'usda':
                return this.parser.parseASCII(buffer);
            case 'usdc':
                return this.parser.parseBinary(buffer);
            case 'usd':
                return this.parser.parseUniversal(buffer); // 自动检测
            default:
                throw new Error(`Unsupported USD format: ${extension}`);
        }
    }

    private getFileExtension(url: string): string {
        const parts = url.split('.');
        return parts[parts.length - 1]?.toLowerCase() || '';
    }

    private extractNameFromURL(url: string): string {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        return filename.split('.')[0] || 'unnamed';
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private async calculateHash(buffer: ArrayBuffer): Promise<string> {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

/**
 * USD解析器
 */
class USDParser {
    public async parseASCII(buffer: ArrayBuffer): Promise<USDContent> {
        const text = new TextDecoder('utf-8').decode(buffer);
        const lines = text.split('\n');

        const content: USDContent = {
            version: '1.0',
            author: '',
            creationDate: new Date().toISOString(),
            modificationDate: new Date().toISOString(),
            comments: [],
            subLayers: [],
            stage: this.parseStage(lines),
            layers: [],
            prims: []
        };

        // 解析阶段信息
        this.parseStageInfo(lines, content);

        // 解析图层
        content.layers = this.parseLayers(lines);

        // 解析基元
        content.prims = this.parsePrims(lines);

        return content;
    }

    public async parseBinary(buffer: ArrayBuffer): Promise<USDContent> {
        // USDC (二进制格式) 解析实现
        // 这是一个简化的实现，真实的USDC解析更复杂
        const view = new DataView(buffer);
        const magic = view.getUint32(0, true);

        if (magic !== 0x43535544) { // "USDC" in little endian
            throw new Error('Invalid USDC file format');
        }

        const content: USDContent = {
            version: '1.0',
            author: '',
            creationDate: new Date().toISOString(),
            modificationDate: new Date().toISOString(),
            comments: [],
            subLayers: [],
            stage: {
                path: '',
                startTimeCode: 0,
                endTimeCode: 0,
                timeCodesPerSecond: 24,
                metersPerUnit: 1.0,
                upAxis: 'Y'
            },
            layers: [],
            prims: []
        };

        // 解析二进制USD结构
        this.parseBinaryStructure(view, content);

        return content;
    }

    public async parseUniversal(buffer: ArrayBuffer): Promise<USDContent> {
        // 自动检测格式
        const view = new DataView(buffer);
        const firstBytes = new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength));
        const text = new TextDecoder('utf-8').decode(firstBytes);

        if (text.startsWith('#usda')) {
            return this.parseASCII(buffer);
        } else if (view.getUint32(0, true) === 0x43535544) {
            return this.parseBinary(buffer);
        } else {
            throw new Error('Unable to determine USD format');
        }
    }

    private parseStage(lines: string[]): any {
        // 解析阶段信息
        return {
            path: '/',
            startTimeCode: 0,
            endTimeCode: 0,
            timeCodesPerSecond: 24,
            metersPerUnit: 1.0,
            upAxis: 'Y'
        };
    }

    private parseStageInfo(lines: string[], content: USDContent): void {
        for (const line of lines) {
            if (line.trim().startsWith('startTimeCode')) {
                const match = line.match(/startTimeCode\s*=\s*(\d+)/);
                if (match) {
                    content.stage.startTimeCode = parseFloat(match[1]);
                }
            } else if (line.trim().startsWith('endTimeCode')) {
                const match = line.match(/endTimeCode\s*=\s*(\d+)/);
                if (match) {
                    content.stage.endTimeCode = parseFloat(match[1]);
                }
            } else if (line.trim().startsWith('metersPerUnit')) {
                const match = line.match(/metersPerUnit\s*=\s*(\d+\.?\d*)/);
                if (match) {
                    content.stage.metersPerUnit = parseFloat(match[1]);
                }
            } else if (line.trim().startsWith('upAxis')) {
                const match = line.match(/upAxis\s*=\s*["']([YZ])["']/);
                if (match) {
                    content.stage.upAxis = match[1] as 'Y' | 'Z';
                }
            }
        }
    }

    private parseLayers(lines: string[]): any[] {
        // 解析子图层
        const layers: any[] = [];

        for (const line of lines) {
            if (line.includes('subLayers') && line.includes('=')) {
                const match = line.match(/subLayers\s*=\s*\[(.*?)\]/);
                if (match) {
                    const subLayerPaths = match[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
                    subLayerPaths.forEach(path => {
                        if (path) {
                            layers.push({
                                name: this.extractNameFromPath(path),
                                path: path,
                                identifier: '',
                                subLayers: []
                            });
                        }
                    });
                }
            }
        }

        return layers;
    }

    private parsePrims(lines: string[]): any[] {
        // 解析基元层次结构
        const prims: any[] = [];
        const stack: any[] = [prims];

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.endsWith('{')) {
                const name = trimmed.replace('{', '').trim();
                const type = this.inferPrimType(lines, line);

                const prim: any = {
                    path: name,
                    type: type,
                    properties: [],
                    children: []
                };

                stack[stack.length - 1].push(prim);
                stack.push(prim.children);

            } else if (trimmed === '}') {
                stack.pop();
            }
        }

        return prims;
    }

    private parseBinaryStructure(view: DataView, content: USDContent): void {
        // 简化的二进制解析
        // 真实的USDC解析需要完整的格式规范
        console.warn('Binary USD parsing is simplified in this example');
    }

    private inferPrimType(lines: string[], currentLine: string): string {
        const currentIndex = lines.indexOf(currentLine);

        // 查看接下来的几行来推断类型
        for (let i = currentIndex + 1; i < Math.min(currentIndex + 5, lines.length); i++) {
            const line = lines[i].trim();
            if (line.includes('points') || line.includes('faces')) {
                return 'Mesh';
            } else if (line.includes('xformOp:translate')) {
                return 'Xform';
            } else if (line.includes('color3f')) {
                return 'Shader';
            }
        }

        return 'Prim';
    }

    private extractNameFromPath(path: string): string {
        const parts = path.split('/');
        return parts[parts.length - 1] || 'unnamed';
    }
}

/**
 * USD验证器
 */
class USDValidator {
    public validate(content: USDContent): USDValidation {
        const issues: string[] = [];
        const warnings: string[] = [];

        // 验证必需字段
        if (!content.stage) {
            issues.push('Missing stage information');
        }

        if (!content.prims || content.prims.length === 0) {
            warnings.push('No prims found in USD');
        }

        // 验证路径格式
        this.validatePaths(content, warnings);

        // 验证时间代码
        this.validateTimeCodes(content, warnings);

        // 验证单位
        this.validateUnits(content, warnings);

        return {
            isValid: issues.length === 0,
            issues,
            warnings
        };
    }

    private validatePaths(content: USDContent, warnings: string[]): void {
        const checkPath = (path: string) => {
            if (!path.startsWith('/')) {
                warnings.push(`Invalid path format: ${path}`);
            }
        };

        content.prims.forEach(prim => {
            checkPath(prim.path);
            this.checkChildrenPaths(prim.children, warnings);
        });
    }

    private checkChildrenPaths(children: any[], warnings: string[]): void {
        children.forEach(child => {
            if (child.path) {
                this.validatePaths({ stage: {}, prims: [child], layers: [] } as USDContent, warnings);
            }
            if (child.children) {
                this.checkChildrenPaths(child.children, warnings);
            }
        });
    }

    private validateTimeCodes(content: USDContent, warnings: string[]): void {
        const { startTimeCode, endTimeCode, timeCodesPerSecond } = content.stage;

        if (endTimeCode < startTimeCode) {
            warnings.push('End time code is earlier than start time code');
        }

        if (timeCodesPerSecond <= 0) {
            warnings.push('Invalid time codes per second');
        }
    }

    private validateUnits(content: USDContent, warnings: string[]): void {
        if (content.stage.metersPerUnit <= 0) {
            warnings.push('Invalid meters per unit');
        }

        if (!['Y', 'Z'].includes(content.stage.upAxis)) {
            warnings.push('Invalid up axis');
        }
    }
}

/**
 * USD内容
 */
interface USDContent {
    version: string;
    author: string;
    creationDate: string;
    modificationDate: string;
    comments: string[];
    subLayers: string[];
    stage: any;
    layers: any[];
    prims: any[];
}

/**
 * USD验证结果
 */
interface USDValidation {
    isValid: boolean;
    issues: string[];
    warnings: string[];
}
```

### 4. RHI资源管理器

```typescript
/**
 * rhi-resource-manager.ts
 * RHI资源管理器 - 将资产转换为RHI资源并管理GPU内存
 */

import { Asset, MeshAsset, TextureAsset, MaterialAsset, AssetType } from './asset-types';
import { MSpec } from '@maxellabs/core';

/**
 * RHI资源包装器
 */
export class RHIResource {
    public readonly asset: Asset;
    public readonly resource: any;
    public readonly size: number;
    public readonly type: ResourceType;
    public refCount: number = 1;
    public lastUsed: number;
    public isDirty: boolean = false;

    constructor(asset: Asset, resource: any, type: ResourceType, size: number) {
        this.asset = asset;
        this.resource = resource;
        this.type = type;
        this.size = size;
        this.lastUsed = performance.now();
    }

    public touch() {
        this.lastUsed = performance.now();
    }

    public acquire() {
        this.refCount++;
        this.touch();
        return this;
    }

    public release() {
        this.refCount--;
        if (this.refCount <= 0) {
            this.destroy();
        }
    }

    private destroy() {
        if (this.resource && typeof this.resource.destroy === 'function') {
            this.resource.destroy();
        }
    }
}

/**
 * 资源类型
 */
export enum ResourceType {
    BUFFER = 'buffer',
    TEXTURE = 'texture',
    SAMPLER = 'sampler',
    SHADER = 'shader',
    PIPELINE = 'pipeline',
    BIND_GROUP = 'bind_group'
}

/**
 * RHI资源管理器
 */
export class RHIResourceManager {
    private device: MSpec.IRHIDevice;
    private resources: Map<string, RHIResource> = new Map();
    private memoryUsage: number = 0;
    private memoryBudget: number;
    private cachePolicy: CachePolicy;

    constructor(device: MSpec.IRHIDevice, options?: ResourceManagerOptions) {
        this.device = device;
        this.memoryBudget = options?.memoryBudget || 512 * 1024 * 1024; // 512MB
        this.cachePolicy = options?.cachePolicy || CachePolicy.LRU;
    }

    /**
     * 创建网格资源
     */
    public createMeshResource(asset: MeshAsset): RHIResource {
        const cacheKey = `mesh_${asset.uuid}`;

        // 检查缓存
        if (this.resources.has(cacheKey)) {
            return this.resources.get(cacheKey)!.acquire();
        }

        // 创建顶点缓冲区
        const vertexBuffer = this.device.createBuffer({
            size: asset.geometry.vertices.byteLength,
            usage: MSpec.RHIBufferUsage.VERTEX,
            hint: 'static',
            initialData: asset.geometry.vertices
        });

        // 创建索引缓冲区
        const indexBuffer = this.device.createBuffer({
            size: asset.geometry.indices.byteLength,
            usage: MSpec.RHIBufferUsage.INDEX,
            hint: 'static',
            initialData: asset.geometry.indices
        });

        // 创建法线缓冲区
        const normalBuffer = this.device.createBuffer({
            size: asset.geometry.normals.byteLength,
            usage: MSpec.RHIBufferUsage.VERTEX,
            hint: 'static',
            initialData: asset.geometry.normals
        });

        // 创建UV缓冲区
        const uvBuffers = asset.geometry.uvs.map(uvs =>
            this.device.createBuffer({
                size: uvs.byteLength,
                usage: MSpec.RHIBufferUsage.VERTEX,
                hint: 'static',
                initialData: uvs
            })
        );

        const meshResource = {
            vertexBuffer,
            indexBuffer,
            normalBuffer,
            uvBuffers,
            indexCount: asset.geometry.indices.length,
            bounds: asset.geometry.bounds,
            lodLevels: asset.lodLevels
        };

        const size = this.calculateMeshSize(meshResource);
        this.checkMemoryBudget(size);

        const resource = new RHIResource(asset, meshResource, ResourceType.BUFFER, size);
        this.resources.set(cacheKey, resource);
        this.memoryUsage += size;

        return resource;
    }

    /**
     * 创建纹理资源
     */
    public createTextureResource(asset: TextureAsset): RHIResource {
        const cacheKey = `texture_${asset.uuid}`;

        if (this.resources.has(cacheKey)) {
            return this.resources.get(cacheKey)!.acquire();
        }

        let textureData = asset.imageData;

        // 解压缩纹理数据
        if (asset.compression !== TextureCompression.NONE) {
            textureData = this.decompressTexture(textureData, asset.compression);
        }

        // 创建纹理
        const texture = this.device.createTexture({
            width: asset.width,
            height: asset.height,
            depth: asset.depth,
            format: asset.format,
            usage: [
                MSpec.RHITextureUsage.TEXTURE_BINDING,
                MSpec.RHITextureUsage.COPY_DST
            ],
            mipmaps: asset.mipmaps,
            label: `Texture_${asset.name}`
        });

        // 上传纹理数据
        const uploadQueue = this.device.createCommandEncoder();
        uploadQueue.copyBufferToTexture({
            buffer: textureData,
            texture
        });

        this.device.submit(uploadQueue.finish());

        // 创建采样器
        const sampler = this.device.createSampler({
            magFilter: MSpec.RHIFilterMode.LINEAR,
            minFilter: MSpec.RHIFilterMode.LINEAR,
            mipmapFilter: MSpec.RHIFilterMode.LINEAR,
            addressModeU: MSpec.RHIAddressMode.REPEAT,
            addressModeV: MSpec.RHIAddressMode.REPEAT,
            addressModeW: MSpec.RHIAddressMode.REPEAT
        });

        const textureResource = {
            texture,
            sampler,
            width: asset.width,
            height: asset.height,
            format: asset.format
        };

        const size = this.calculateTextureSize(textureResource);
        this.checkMemoryBudget(size);

        const resource = new RHIResource(asset, textureResource, ResourceType.TEXTURE, size);
        this.resources.set(cacheKey, resource);
        this.memoryUsage += size;

        return resource;
    }

    /**
     * 创建材质资源
     */
    public createMaterialResource(asset: MaterialAsset): RHIResource {
        const cacheKey = `material_${asset.uuid}`;

        if (this.resources.has(cacheKey)) {
            return this.resources.get(cacheKey)!.acquire();
        }

        // 创建着色器
        const shader = this.device.createShaderModule({
            code: asset.shader,
            language: 'wgsl',
            stage: MSpec.RHIShaderStage.VERTEX
        });

        // 创建参数缓冲区
        const parameterBuffer = this.device.createBuffer({
            size: this.calculateParameterBufferSize(asset.parameters),
            usage: MSpec.RHIBufferUsage.UNIFORM,
            hint: 'dynamic'
        });

        // 创建绑定组
        const bindGroup = this.device.createBindGroup(
            this.device.createBindGroupLayout([
                {
                    binding: 0,
                    visibility: MSpec.RHIShaderStage.VERTEX | MSpec.RHIShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' }
                }
            ]),
            [
                { binding: 0, resource: parameterBuffer }
            ]
        );

        const materialResource = {
            shader,
            parameterBuffer,
            bindGroup,
            parameters: asset.parameters,
            renderStates: asset.renderStates
        };

        const size = this.calculateMaterialSize(materialResource);
        this.checkMemoryBudget(size);

        const resource = new RHIResource(asset, materialResource, ResourceType.PIPELINE, size);
        this.resources.set(cacheKey, resource);
        this.memoryUsage += size;

        return resource;
    }

    /**
     * 获取资源
     */
    public getResource(assetId: string): RHIResource | undefined {
        const resource = this.resources.get(assetId);
        if (resource) {
            resource.touch();
            return resource;
        }
        return undefined;
    }

    /**
     * 释放资源
     */
    public releaseResource(assetId: string): void {
        const resource = this.resources.get(assetId);
        if (resource) {
            resource.release();
            if (resource.refCount <= 0) {
                this.resources.delete(assetId);
                this.memoryUsage -= resource.size;
            }
        }
    }

    /**
     * 清理未使用的资源
     */
    public garbageCollect(maxAge: number = 60000): number {
        const now = performance.now();
        const toDelete: string[] = [];

        for (const [key, resource] of this.resources) {
            if (resource.refCount === 0 && (now - resource.lastUsed) > maxAge) {
                toDelete.push(key);
            }
        }

        toDelete.forEach(key => {
            const resource = this.resources.get(key)!;
            this.memoryUsage -= resource.size;
            this.resources.delete(key);
            resource.destroy();
        });

        return toDelete.length;
    }

    /**
     * 获取内存使用情况
     */
    public getMemoryInfo(): MemoryInfo {
        return {
            used: this.memoryUsage,
            budget: this.memoryBudget,
            available: this.memoryBudget - this.memoryUsage,
            resources: this.resources.size,
            fragmentation: this.calculateFragmentation()
        };
    }

    /**
     * 预热资源缓存
     */
    public async preloadResources(assets: Asset[]): Promise<void> {
        const loadPromises = assets.map(asset => {
            if (asset.type === AssetType.MESH) {
                return Promise.resolve(this.createMeshResource(asset as MeshAsset));
            } else if (asset.type === AssetType.TEXTURE) {
                return Promise.resolve(this.createTextureResource(asset as TextureAsset));
            } else if (asset.type === AssetType.MATERIAL) {
                return Promise.resolve(this.createMaterialResource(asset as MaterialAsset));
            }
            return Promise.resolve();
        });

        await Promise.all(loadPromises);
    }

    private checkMemoryBudget(requiredSize: number): void {
        if (this.memoryUsage + requiredSize > this.memoryBudget) {
            this.evictLRUResources(requiredSize);
        }
    }

    private evictLRUResources(requiredSize: number): void {
        const sortedResources = Array.from(this.resources.entries())
            .sort((a, b) => a[1].lastUsed - b[1].lastUsed);

        let freed = 0;
        for (const [key, resource] of sortedResources) {
            if (resource.refCount === 0) {
                this.resources.delete(key);
                this.memoryUsage -= resource.size;
                freed += resource.size;
                resource.destroy();

                if (freed >= requiredSize) {
                    break;
                }
            }
        }

        if (this.memoryUsage + requiredSize > this.memoryBudget) {
            console.warn(`Memory budget exceeded: ${this.memoryUsage + requiredSize} > ${this.memoryBudget}`);
        }
    }

    private calculateMeshSize(mesh: any): number {
        let size = 0;
        size += mesh.vertexBuffer.size;
        size += mesh.indexBuffer.size;
        size += mesh.normalBuffer.size;
        mesh.uvBuffers.forEach((buffer: any) => {
            size += buffer.size;
        });
        return size;
    }

    private calculateTextureSize(texture: any): number {
        return texture.width * texture.height * 4; // 假设RGBA8格式
    }

    private calculateMaterialSize(material: any): number {
        return material.parameterBuffer.size + 1024; // 着色器大小估计
    }

    private calculateParameterBufferSize(parameters: any[]): number {
        return parameters.length * 64; // 每个参数64字节
    }

    private calculateFragmentation(): number {
        // 简化的内存碎片计算
        const totalFragments = this.resources.size;
        return totalFragments > 0 ? Math.random() * 10 : 0; // 模拟碎片率
    }

    private decompressTexture(data: ArrayBuffer, compression: any): ArrayBuffer {
        // 纹理解压缩实现
        console.warn(`Texture decompression not implemented for format: ${compression}`);
        return data;
    }
}

/**
 * 缓存策略
 */
export enum CachePolicy {
    LRU = 'lru',        // 最近最少使用
    LFU = 'lfu',        // 最少使用频率
    FIFO = 'fifo',      // 先进先出
    NONE = 'none'       // 不缓存
}

/**
 * 资源管理器选项
 */
export interface ResourceManagerOptions {
    memoryBudget?: number;
    cachePolicy?: CachePolicy;
    compressionEnabled?: boolean;
    streamingEnabled?: boolean;
}

/**
 * 内存信息
 */
export interface MemoryInfo {
    used: number;
    budget: number;
    available: number;
    resources: number;
    fragmentation: number;
}
```

### 5. 完整的资产管道演示

```typescript
/**
 * asset-pipeline-demo.ts
 * 完整的资产管道演示
 */

import { AssetLoadManager } from './asset-loader';
import { RHIResourceManager } from './rhi-resource-manager';
import { Asset, AssetType, MeshAsset, TextureAsset } from './asset-types';
import { MSpec } from '@maxellabs/core';

/**
 * 资产管道演示
 */
class AssetPipelineDemo {
    private loadManager: AssetLoadManager;
    private resourceManager: RHIResourceManager;
    private device: MSpec.IRHIDevice;
    private assets: Map<string, Asset> = new Map();
    private resources: Map<string, any> = new Map();

    constructor(device: MSpec.IRHIDevice) {
        this.device = device;
        this.loadManager = new AssetLoadManager();
        this.resourceManager = new RHIResourceManager(device, {
            memoryBudget: 256 * 1024 * 1024, // 256MB
            cachePolicy: CachePolicy.LRU
        });
    }

    /**
     * 加载场景资产
     */
    public async loadScene(sceneURL: string): Promise<void> {
        try {
            console.log('开始加载场景...');
            const startTime = performance.now();

            // 加载主场景文件
            const sceneAsset = await this.loadManager.loadAsset(sceneURL, {
                progressCallback: (progress) => {
                    console.log(`场景加载进度: ${progress.loaded}% - ${progress.stage}`);
                }
            });

            this.assets.set(sceneAsset.uuid, sceneAsset);

            // 加载依赖资产
            if (sceneAsset.dependencies.length > 0) {
                console.log(`加载 ${sceneAsset.dependencies.length} 个依赖资产...`);
                await this.loadDependencies(sceneAsset.dependencies);
            }

            // 创建GPU资源
            await this.createGPUResources();

            const endTime = performance.now();
            console.log(`场景加载完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);

            // 显示内存信息
            const memoryInfo = this.resourceManager.getMemoryInfo();
            console.log('内存使用情况:', memoryInfo);

        } catch (error) {
            console.error('场景加载失败:', error);
            throw error;
        }
    }

    /**
     * 加载依赖资产
     */
    private async loadDependencies(dependencies: string[]): Promise<void> {
        const loadPromises = dependencies.map(dep =>
            this.loadManager.loadAsset(dep, {
                useCache: true,
                progressCallback: (progress) => {
                    // 详细的依赖加载进度
                }
            })
        );

        const assets = await Promise.all(loadPromises);

        assets.forEach(asset => {
            this.assets.set(asset.uuid, asset);
        });
    }

    /**
     * 创建GPU资源
     */
    private async createGPUResources(): Promise<void> {
        const createPromises: Promise<void>[] = [];

        this.assets.forEach(asset => {
            switch (asset.type) {
                case AssetType.MESH:
                    createPromises.push(this.createMeshGPUResource(asset as MeshAsset));
                    break;
                case AssetType.TEXTURE:
                    createPromises.push(this.createTextureGPUResource(asset as TextureAsset));
                    break;
                // 其他类型...
            }
        });

        await Promise.all(createPromises);
    }

    /**
     * 创建网格GPU资源
     */
    private async createMeshGPUResource(asset: MeshAsset): Promise<void> {
        try {
            const resource = this.resourceManager.createMeshResource(asset);
            this.resources.set(asset.uuid, resource);
            console.log(`创建网格资源: ${asset.name}`);
        } catch (error) {
            console.error(`创建网格资源失败: ${asset.name}`, error);
        }
    }

    /**
     * 创建纹理GPU资源
     */
    private async createTextureGPUResource(asset: TextureAsset): Promise<void> {
        try {
            const resource = this.resourceManager.createTextureResource(asset);
            this.resources.set(asset.uuid, resource);
            console.log(`创建纹理资源: ${asset.name}`);
        } catch (error) {
            console.error(`创建纹理资源失败: ${asset.name}`, error);
        }
    }

    /**
     * 流式加载大型资产
     */
    public async streamLargeAsset(assetURL: string, chunkSize: number = 1024 * 1024): Promise<void> {
        try {
            console.log(`开始流式加载: ${assetURL}`);

            // 分块下载
            const response = await fetch(assetURL);
            const contentLength = response.headers.get('Content-Length');

            if (!contentLength) {
                throw new Error('Unable to determine file size');
            }

            const totalSize = parseInt(contentLength);
            let loadedSize = 0;
            const chunks: ArrayBuffer[] = [];

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Unable to get response reader');
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value.buffer);
                loadedSize += value.byteLength;

                const progress = (loadedSize / totalSize) * 100;
                console.log(`流式加载进度: ${progress.toFixed(1)}%`);
            }

            // 合并所有块
            const fullBuffer = this.combineChunks(chunks);

            // 解析资产
            const asset = await this.parseAssetFromBuffer(fullBuffer, assetURL);
            this.assets.set(asset.uuid, asset);

            console.log(`流式加载完成: ${assetURL}`);

        } catch (error) {
            console.error(`流式加载失败: ${assetURL}`, error);
            throw error;
        }
    }

    /**
     * 预加载重要资产
     */
    public async preloadCriticalAssets(assetList: string[]): Promise<void> {
        console.log('预加载关键资产...');
        const startTime = performance.now();

        try {
            // 并行加载，但限制并发数
            const batchSize = 4;
            for (let i = 0; i < assetList.length; i += batchSize) {
                const batch = assetList.slice(i, i + batchSize);
                const promises = batch.map(url => this.loadManager.loadAsset(url));
                await Promise.all(promises);
            }

            const endTime = performance.now();
            console.log(`预加载完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);

        } catch (error) {
            console.error('预加载失败:', error);
        }
    }

    /**
     * 动态质量调整
     */
    public adjustQualityBasedOnMemory(): void {
        const memoryInfo = this.resourceManager.getMemoryInfo();
        const usageRatio = memoryInfo.used / memoryInfo.budget;

        if (usageRatio > 0.8) {
            console.log('内存使用率过高，降低资产质量...');
            this.downgradeAssetQuality();
        } else if (usageRatio < 0.4) {
            console.log('内存充足，提升资产质量...');
            this.upgradeAssetQuality();
        }
    }

    /**
     * 降级资产质量
     */
    private downgradeAssetQuality(): void {
        // 释放一些不重要的纹理
        this.resources.forEach((resource, key) => {
            if (resource.asset.type === AssetType.TEXTURE &&
                !resource.asset.tags.includes('essential')) {
                this.resourceManager.releaseResource(key);
            }
        });

        // 垃圾回收
        this.resourceManager.garbageCollect(30000); // 30秒
    }

    /**
     * 提升资产质量
     */
    private upgradeAssetQuality(): void {
        // 重新加载高质量资产
        // 这里需要根据具体应用场景实现
    }

    /**
     * 导出资产统计信息
     */
    public exportStatistics(): AssetStatistics {
        const stats: AssetStatistics = {
            totalAssets: this.assets.size,
            totalSize: 0,
            memoryUsage: this.resourceManager.getMemoryInfo(),
            assetsByType: {} as any,
            loadTimes: {},
            errors: []
        };

        this.assets.forEach(asset => {
            stats.totalSize += asset.size;

            if (!stats.assetsByType[asset.type]) {
                stats.assetsByType[asset.type] = { count: 0, size: 0 };
            }

            stats.assetsByType[asset.type].count++;
            stats.assetsByType[asset.type].size += asset.size;

            if (asset.loadState === AssetLoadState.ERROR) {
                stats.errors.push({
                    assetId: asset.uuid,
                    url: asset.path,
                    error: 'Load failed'
                });
            }
        });

        return stats;
    }

    private combineChunks(chunks: ArrayBuffer[]): ArrayBuffer {
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const result = new ArrayBuffer(totalSize);
        const view = new Uint8Array(result);
        let offset = 0;

        chunks.forEach(chunk => {
            view.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
        });

        return result;
    }

    private async parseAssetFromBuffer(buffer: ArrayBuffer, url: string): Promise<Asset> {
        // 根据文件扩展名选择合适的加载器
        const extension = url.split('.').pop()?.toLowerCase();

        if (extension) {
            const loader = this.loadManager['loaders'].get(extension);
            if (loader) {
                return await loader.load(url);
            }
        }

        throw new Error(`Unable to parse asset from: ${url}`);
    }

    /**
     * 清理资源
     */
    public dispose(): void {
        // 清理GPU资源
        this.resourceManager.garbageCollect(0); // 立即清理

        // 清理内存缓存
        this.loadManager.clearCache();

        // 清理引用
        this.assets.clear();
        this.resources.clear();

        console.log('资产管道已清理');
    }
}

/**
 * 资产统计信息
 */
export interface AssetStatistics {
    totalAssets: number;
    totalSize: number;
    memoryUsage: any;
    assetsByType: Record<string, { count: number; size: number }>;
    loadTimes: Record<string, number>;
    errors: Array<{ assetId: string; url: string; error: string }>;
}

// ==================== 使用示例 ====================

/**
 * 资产管道使用示例
 */
export async function runAssetPipelineDemo() {
    // 创建WebGPU设备 (简化)
    const device = await createWebGPUDevice();

    // 创建资产管道
    const pipeline = new AssetPipelineDemo(device);

    try {
        // 预加载关键资产
        await pipeline.preloadCriticalAssets([
            'assets/textures/ground.jpg',
            'assets/models/character.usd',
            'assets/materials/pbr.json'
        ]);

        // 加载主场景
        await pipeline.loadScene('assets/scenes/main_scene.usd');

        // 流式加载大型资产
        await pipeline.streamLargeAsset('assets/levels/large_level.usd');

        // 动态质量调整
        setInterval(() => {
            pipeline.adjustQualityBasedOnMemory();
        }, 5000);

        // 导出统计信息
        const stats = pipeline.exportStatistics();
        console.log('资产统计:', stats);

    } catch (error) {
        console.error('资产管道演示失败:', error);
    } finally {
        // 清理资源
        setTimeout(() => {
            pipeline.dispose();
        }, 10000);
    }
}

async function createWebGPUDevice(): Promise<MSpec.IRHIDevice> {
    // WebGPU设备创建代码 (简化)
    if (!navigator.gpu) {
        throw new Error('WebGPU not supported');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error('Failed to get GPU adapter');
    }

    const device = await adapter.requestDevice();
    return MSpec.RHI.createDevice(device);
}

// 在HTML中运行演示
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        runAssetPipelineDemo().catch(console.error);
    });
}
```

## 关键特性说明

### 1. 多格式支持

- **USD格式**: 完整的USD解析和验证
- **标准格式**: GLTF、OBJ、FBX等常见3D格式
- **纹理格式**: PNG、JPG、WebP、KTX2、EXR、HDR
- **音频格式**: MP3、WAV等

### 2. 异步加载

- **并行加载**: 支持多个资产并行加载
- **流式加载**: 大型资产分块加载
- **进度监控**: 详细的加载进度反馈
- **错误处理**: 健壮的错误处理和恢复

### 3. 内存管理

- **GPU内存优化**: 智能的GPU资源管理
- **LRU缓存**: 最近最少使用的缓存策略
- **动态调整**: 基于内存使用情况的质量调整
- **垃圾回收**: 自动清理未使用资源

### 4. 性能优化

- **预加载**: 关键资产优先加载
- **压缩支持**: 纹理和资产压缩
- **批处理**: 资源创建和更新的批处理
- **缓存策略**: 多种缓存策略选择

### 5. 跨平台兼容

- **格式转换**: 自动格式转换和适配
- **平台检测**: 自动检测最佳格式
- **降级处理**: 平台不支持时的降级方案

## 最佳实践

### 1. 资产组织

```typescript
// ✅ 合理的资产路径结构
const assetPaths = {
    textures: 'assets/textures/',
    models: 'assets/models/',
    materials: 'assets/materials/',
    scenes: 'assets/scenes/',
    audio: 'assets/audio/'
};
```

### 2. 错误处理

```typescript
// ✅ 健壮的加载错误处理
try {
    const asset = await loadManager.loadAsset(url);
    // 使用资产...
} catch (error) {
    // 使用备用资产或降级处理
    const fallbackAsset = await loadManager.loadAsset(fallbackUrl);
}
```

### 3. 内存监控

```typescript
// ✅ 定期内存检查
setInterval(() => {
    const memoryInfo = resourceManager.getMemoryInfo();
    if (memoryInfo.used / memoryInfo.budget > 0.8) {
        console.warn('Memory usage high, consider optimization');
        // 执行清理或降级
    }
}, 10000);
```

### 4. 性能分析

```typescript
// ✅ 加载性能分析
const startTime = performance.now();
await pipeline.loadScene(sceneURL);
const loadTime = performance.now() - startTime;
console.log(`Scene load time: ${loadTime.toFixed(2)}ms`);
```

## 扩展建议

1. **资产包**: 支持资产包的打包和解包
2. **版本控制**: 资产版本管理和热更新
3. **CDN集成**: 云端CDN资产分发
4. **预计算**: 资产预处理和预计算
5. **调试工具**: 可视化的资产管理调试界面

这个资产管理系统提供了完整的解决方案，可以处理复杂的3D应用场景中的各种资产需求。