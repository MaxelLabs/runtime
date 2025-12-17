---
title: Demo Development Textures
description: 自动化LLM-Native标准化指南文档
category: guides
subcategory: demo
tags: ['guide', 'llm-native', 'demo', 'demo-developers', 'interface-first', 'code-examples', 'step-by-step']
target_audience: demo-developers
complexity: advanced
estimated_time: f"234 分钟"
last_updated: 2025-12-17
llm_native_compliance: true
version: 1.0.0
---


## 🎯 Context & Goal

### Context
本文档属于**demo**类型的开发指南，面向**demo-developers**。

### Goal
帮助开发者快速理解和掌握相关概念、工具和最佳实践，提高开发效率和代码质量。

### Prerequisites
- 基础的编程知识
- 了解项目架构和基本概念
- 相关领域的开发经验

---

# 纹理系统开发指南

## 概述

纹理系统是RHI Demo系统的第二层，专注于纹理资源的加载、管理和渲染。本层包含5个核心Demo，展示了从基础纹理应用到高级多纹理混合的完整流程。

## 🎨 纹理Demo集

### 1. Texture Loading Demo - 纹理加载

**目标**: 展示基础纹理加载和应用

**技术要点**:
- 纹理资源创建和管理
- 纹理坐标系统
- 纹理采样器配置
- 异步资源加载

**核心实现**:
```typescript
class TextureLoadingDemo {
    private texture: RHITexture2D;
    private sampler: RHISampler;

    async loadTexture(url: string) {
        // 加载图片
        const image = await this.loadImage(url);

        // 创建纹理
        this.texture = this.device.createTexture({
            size: [image.width, image.height],
            format: 'rgba8unorm',
            usage: 'texture-binding' | 'copy-dst'
        });

        // 复制图片数据到纹理
        this.device.queue.copyExternalImageToTexture(
            { source: image },
            { texture: this.texture },
            [image.width, image.height]
        );

        // 创建采样器
        this.sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat'
        });
    }

    private loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
        });
    }
}
```

**着色器实现**:
```glsl
// 顶点着色器
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vTexCoord = aTexCoord;
}

// 片元着色器
precision mediump float;
uniform sampler2D uTexture;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    gl_FragColor = color;
}
```

### 2. Mipmap Generation Demo - Mipmap生成

**目标**: 展示Mipmap的自动生成和效果

**技术要点**:
- Mipmap链的原理和应用
- 不同LOD级别的选择
- Mipmap生成算法
- 性能优化效果

**Mipmap生成实现**:
```typescript
class MipmapGenerator {
    static generateMipmaps(
        device: RHIDevice,
        texture: RHITexture2D,
        imageData: ImageData
    ): void {
        const { width, height } = imageData;
        const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;

        let currentData = imageData;
        let currentWidth = width;
        let currentHeight = height;

        for (let level = 0; level < levels; level++) {
            // 写入当前级别
            device.queue.writeTexture(
                { texture, origin: [0, 0], aspect: 'all', mipLevel: level },
                currentData,
                { bytesPerRow: currentWidth * 4, rowsPerImage: currentHeight },
                [currentWidth, currentHeight]
            );

            // 生成下一级别的数据（2x2平均）
            if (level < levels - 1) {
                currentData = this.downsample(currentData);
                currentWidth = Math.max(1, Math.floor(currentWidth / 2));
                currentHeight = Math.max(1, Math.floor(currentHeight / 2));
            }
        }
    }

    private static downsource(imageData: ImageData): ImageData {
        const { width, height, data } = imageData;
        const newWidth = Math.max(1, Math.floor(width / 2));
        const newHeight = Math.max(1, Math.floor(height / 2));
        const newData = new Uint8ClampedArray(newWidth * newHeight * 4);

        // 2x2块平均算法
        for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
                const srcX = x * 2;
                const srcY = y * 2;

                let r = 0, g = 0, b = 0, a = 0;
                let count = 0;

                // 采样2x2区域
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        const sx = srcX + dx;
                        const sy = srcY + dy;

                        if (sx < width && sy < height) {
                            const idx = (sy * width + sx) * 4;
                            r += data[idx];
                            g += data[idx + 1];
                            b += data[idx + 2];
                            a += data[idx + 3];
                            count++;
                        }
                    }
                }

                // 计算平均值
                const dstIdx = (y * newWidth + x) * 4;
                newData[dstIdx] = r / count;
                newData[dstIdx + 1] = g / count;
                newData[dstIdx + 2] = b / count;
                newData[dstIdx + 3] = a / count;
            }
        }

        return new ImageData(newData, newWidth, newHeight);
    }
}
```

**Mipmap采样配置**:
```typescript
const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear-mipmap-linear', // 使用Mipmap
    mipmapFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    maxAnisotropy: 16 // 各向异性过滤
});
```

### 3. Texture Wrapping Demo - 纹理包裹模式

**目标**: 展示不同的纹理包裹模式效果

**技术要点**:
- 四种包裹模式：repeat, mirror-repeat, clamp-to-edge, mirror-clamp-to-edge
- UV坐标范围处理
- 边界效果展示
- 实时切换和对比

**包裹模式实现**:
```typescript
enum WrapMode {
    Repeat = 'repeat',
    MirrorRepeat = 'mirror-repeat',
    ClampToEdge = 'clamp-to-edge',
    MirrorClampToEdge = 'mirror-clamp-to-edge'
}

class TextureWrappingDemo {
    private samplers: Map<WrapMode, RHISampler> = new Map();

    createSamplers(device: RHIDevice): void {
        const modes = [
            WrapMode.Repeat,
            WrapMode.MirrorRepeat,
            WrapMode.ClampToEdge,
            WrapMode.MirrorClampToEdge
        ];

        for (const mode of modes) {
            const sampler = device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: mode,
                addressModeV: mode
            });
            this.samplers.set(mode, sampler);
        }
    }

    renderWithMode(renderPass: RHIRenderPass, mode: WrapMode): void {
        const sampler = this.samplers.get(mode);
        renderPass.setBindGroup(0, this.createBindGroup(sampler));
        renderPass.draw(6); // 渲染四边形
    }
}
```

**着色器中的包裹处理**:
```glsl
// 手动实现包裹模式（用于演示）
vec2 applyWrapMode(vec2 uv, float mode) {
    if (mode == 0.0) {
        // Repeat
        return fract(uv);
    } else if (mode == 1.0) {
        // Mirror Repeat
        vec2 fracted = fract(uv);
        vec2 floored = floor(uv);
        return mix(fracted, 1.0 - fracted, mod(floored, 2.0));
    } else if (mode == 2.0) {
        // Clamp to Edge
        return clamp(uv, 0.0, 1.0);
    }
    return uv;
}
```

### 4. Texture Filtering Demo - 纹理过滤

**目标**: 展示不同纹理过滤算法的视觉效果

**技术要点**:
- 最近邻过滤 vs 线性过滤
- 各向异性过滤
- 过滤质量与性能平衡
- 放大/缩小不同行为

**过滤模式实现**:
```typescript
interface FilterConfig {
    magFilter: 'nearest' | 'linear';
    minFilter: 'nearest' | 'linear' | 'linear-mipmap-linear';
    mipmapFilter: 'nearest' | 'linear';
    maxAnisotropy: number;
}

class TextureFilteringDemo {
    private configs: FilterConfig[] = [
        {
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
            maxAnisotropy: 1
        },
        {
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            maxAnisotropy: 1
        },
        {
            magFilter: 'linear',
            minFilter: 'linear-mipmap-linear',
            mipmapFilter: 'linear',
            maxAnisotropy: 16
        }
    ];

    createSamplers(device: RHIDevice): RHISampler[] {
        return this.configs.map(config =>
            device.createSampler(config)
        );
    }
}
```

**各向异性过滤效果**:
```typescript
// 创建测试纹理（用于展示各向异性过滤效果）
private createTestTexture(device: RHIDevice): RHITexture2D {
    const size = 256;
    const data = new Uint8Array(size * size * 4);

    // 创建倾斜线条图案
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;

            // 创建对角线条纹
            const line = (x + y) % 8 < 4;

            data[idx] = line ? 255 : 0;     // R
            data[idx + 1] = line ? 255 : 0; // G
            data[idx + 2] = line ? 255 : 0; // B
            data[idx + 3] = 255;             // A
        }
    }

    return device.createTexture({
        size: [size, size],
        format: 'rgba8unorm',
        usage: 'texture-binding' | 'copy-dst'
    });
}
```

### 5. Multi-Texture Demo - 多纹理混合

**目标**: 展示多纹理混合技术

**技术要点**:
- 多纹理单元管理
- 纹理混合模式
- 纹理坐标变换
- 纹理合成效果

**多纹理实现**:
```typescript
class MultiTextureDemo {
    private textures: RHITexture2D[] = [];
    private samplers: RHISampler[] = [];

    async loadTextures(urls: string[]): Promise<void> {
        // 并行加载多个纹理
        const loadPromises = urls.map(url => this.loadTexture(url));
        this.textures = await Promise.all(loadPromises);

        // 为每个纹理创建采样器
        this.samplers = this.textures.map(() =>
            this.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: 'repeat',
                addressModeV: 'repeat'
            })
        );
    }

    createBindGroup(): RHIBindGroup {
        return this.device.createBindGroup({
            layout: this.getBindGroupLayout(),
            entries: [
                {
                    binding: 0,
                    resource: this.samplers[0]
                },
                {
                    binding: 1,
                    resource: this.textures[0].createView()
                },
                {
                    binding: 2,
                    resource: this.samplers[1]
                },
                {
                    binding: 3,
                    resource: this.textures[1].createView()
                }
            ]
        });
    }
}
```

**多纹理着色器**:
```glsl
// 片元着色器
precision mediump float;

uniform sampler2D uTexture0;
uniform sampler2D uTexture1;
uniform float uBlendFactor;
uniform vec2 uTexCoord1; // 第二个纹理的坐标变换参数

varying vec2 vTexCoord;

// 混合模式枚举
#define BLEND_ADD 0
#define BLEND_MULTIPLY 1
#define BLEND_SCREEN 2
#define BLEND_OVERLAY 3

uniform int uBlendMode;

vec4 blendColors(vec4 color1, vec4 color2, float factor) {
    switch (uBlendMode) {
        case BLEND_ADD:
            return mix(color1, color1 + color2, factor);

        case BLEND_MULTIPLY:
            return mix(color1, color1 * color2, factor);

        case BLEND_SCREEN:
            return mix(color1, vec4(1.0) - (vec4(1.0) - color1) * (vec4(1.0) - color2), factor);

        case BLEND_OVERLAY:
            return mix(color1,
                mix(color1 * color2 * 2.0,
                    vec4(1.0) - (vec4(1.0) - color1) * (vec4(1.0) - color2) * 2.0,
                    step(color1, vec4(0.5))), factor);

        default:
            return mix(color1, color2, factor);
    }
}

void main() {
    vec4 color0 = texture2D(uTexture0, vTexCoord);
    vec4 color1 = texture2D(uTexture1, vTexCoord * uTexCoord1);

    gl_FragColor = blendColors(color0, color1, uBlendFactor);
}
```

## 🔧 纹理工具库

### TextureLoader - 纹理加载器

**功能**: 统一的纹理加载接口

```typescript
export class TextureLoader {
    static async load(url: string, options: TextureLoadOptions = {}): Promise<RHITexture2D> {
        const {
            flipY = true,
            generateMipmaps = false,
            premultiplyAlpha = false,
            format = 'rgba8unorm'
        } = options;

        const image = await this.loadImage(url);

        // 预处理图片数据
        const imageData = this.preprocessImage(image, flipY, premultiplyAlpha);

        // 创建纹理
        const texture = device.createTexture({
            size: [image.width, image.height],
            format,
            usage: 'texture-binding' | 'copy-dst'
        });

        // 复制数据
        device.queue.writeTexture(
            { texture },
            imageData,
            { bytesPerRow: image.width * 4 },
            [image.width, image.height]
        );

        // 生成Mipmap
        if (generateMipmaps) {
            MipmapGenerator.generateMipmaps(device, texture, imageData);
        }

        return texture;
    }

    static async loadAll(urls: string[], options: TextureLoadOptions = {}): Promise<RHITexture2D[]> {
        const loadPromises = urls.map(url => this.load(url, options));
        return Promise.all(loadPromises);
    }

    private static async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous'; // 支持跨域图片
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            image.src = url;
        });
    }

    private static preprocessImage(
        image: HTMLImageElement,
        flipY: boolean,
        premultiplyAlpha: boolean
    ): ImageData {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext('2d')!;

        // 应用Y轴翻转
        if (flipY) {
            ctx.save();
            ctx.scale(1, -1);
            ctx.drawImage(image, 0, -image.height);
            ctx.restore();
        } else {
            ctx.drawImage(image, 0, 0);
        }

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // 应用Alpha预乘
        if (premultiplyAlpha) {
            imageData = this.premultiplyAlpha(imageData);
        }

        return imageData;
    }

    private static premultiplyAlpha(imageData: ImageData): ImageData {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3] / 255;
            data[i] *= alpha;     // R
            data[i + 1] *= alpha; // G
            data[i + 2] *= alpha; // B
            // A保持不变
        }
        return imageData;
    }
}
```

### CubemapGenerator - 立方体贴图生成器

**功能**: 生成各种类型的立方体贴图

```typescript
export class CubemapGenerator {
    static skyGradient(config: SkyGradientConfig): RHITextureCube {
        const {
            topColor = [135, 206, 250, 255],
            horizonColor = [176, 196, 222, 255],
            bottomColor = [139, 69, 19, 255],
            size = 256
        } = config;

        const faces: ImageData[] = [];

        // 生成立方体贴图的6个面
        for (let face = 0; face < 6; face++) {
            const imageData = new ImageData(size, size);
            const data = imageData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const idx = (y * size + x) * 4;

                    // 根据Y坐标计算渐变
                    const t = y / (size - 1);
                    let color: number[];

                    if (t < 0.5) {
                        // 顶部到中间
                        const localT = t * 2;
                        color = this.interpolateColor(topColor, horizonColor, localT);
                    } else {
                        // 中间到底部
                        const localT = (t - 0.5) * 2;
                        color = this.interpolateColor(horizonColor, bottomColor, localT);
                    }

                    // 根据面的朝向调整颜色
                    const adjustedColor = this.adjustColorForFace(color, face);

                    data[idx] = adjustedColor[0];
                    data[idx + 1] = adjustedColor[1];
                    data[idx + 2] = adjustedColor[2];
                    data[idx + 3] = adjustedColor[3];
                }
            }

            faces.push(imageData);
        }

        return this.createCubeTextureFromFaces(faces);
    }

    static fromEquirectangular(url: string, size: number = 512): Promise<RHITextureCube> {
        return new Promise(async (resolve, reject) => {
            try {
                // 加载全景图
                const image = await this.loadImage(url);

                // 创建canvas进行转换
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;

                // 生成立方体贴图的6个面
                const faces: ImageData[] = [];

                for (let face = 0; face < 6; face++) {
                    canvas.width = size;
                    canvas.height = size;

                    // 根据面的角度设置变换矩阵
                    this.setupCubeFaceTransform(ctx, face, image.width, image.height);
                    ctx.drawImage(image, 0, 0);

                    faces.push(ctx.getImageData(0, 0, size, size));
                }

                const cubeTexture = this.createCubeTextureFromFaces(faces);
                resolve(cubeTexture);

            } catch (error) {
                reject(error);
            }
        });
    }

    private static setupCubeFaceTransform(
        ctx: CanvasRenderingContext2D,
        face: number,
        sourceWidth: number,
        sourceHeight: number
    ): void {
        const { width, height } = ctx.canvas;

        ctx.save();

        // 设置投影和变换
        ctx.scale(width / Math.PI, height / (Math.PI / 2));

        switch (face) {
            case 0: // +X (右)
                ctx.translate(0, Math.PI / 2);
                ctx.rotate(Math.PI / 2);
                break;
            case 1: // -X (左)
                ctx.translate(Math.PI, Math.PI / 2);
                ctx.rotate(-Math.PI / 2);
                break;
            case 2: // +Y (上)
                ctx.translate(Math.PI / 2, 0);
                ctx.rotate(Math.PI);
                break;
            case 3: // -Y (下)
                ctx.translate(Math.PI / 2, Math.PI);
                break;
            case 4: // +Z (前)
                ctx.translate(Math.PI / 2, Math.PI / 2);
                break;
            case 5: // -Z (后)
                ctx.translate(Math.PI * 1.5, Math.PI / 2);
                break;
        }

        // 设置源图像变换
        ctx.scale(sourceWidth / (2 * Math.PI), sourceHeight / Math.PI);
        ctx.translate(-Math.PI, -Math.PI / 2);

        ctx.restore();
    }

    private static interpolateColor(color1: number[], color2: number[], t: number): number[] {
        return color1.map((c1, i) => Math.round(c1 + (color2[i] - c1) * t));
    }

    private static adjustColorForFace(color: number[], face: number): number[] {
        // 根据面的朝向微调颜色强度
        const intensity = [1.0, 0.95, 0.9, 1.1, 1.05, 1.0][face];
        return color.map(c => Math.min(255, Math.round(c * intensity)));
    }

    private static createCubeTextureFromFaces(faces: ImageData[]): RHITextureCube {
        const size = faces[0].width;

        const texture = device.createTexture({
            size: [size, size, 6],
            format: 'rgba8unorm',
            usage: 'texture-binding' | 'copy-dst'
        });

        // 写入每个面的数据
        faces.forEach((face, index) => {
            device.queue.writeTexture(
                {
                    texture,
                    origin: [0, 0, index],
                    aspect: 'all'
                },
                face,
                { bytesPerRow: size * 4 },
                [size, size]
            );
        });

        return texture;
    }
}
```

## 🎯 纹理性能优化

### 1. 纹理压缩

```typescript
// 支持压缩纹理格式
const compressedFormats = [
    'bc1-rgba-unorm',     // DXT1
    'bc3-rgba-unorm',     // DXT5
    'etc2-rgba8unorm',    // ETC2
    'astc-4x4-unorm'      // ASTC
];

// 自动选择最佳压缩格式
function selectOptimalFormat(device: RHIDevice): GPUTextureFormat {
    for (const format of compressedFormats) {
        if (device.features.has(format)) {
            return format;
        }
    }
    return 'rgba8unorm'; // 降级到未压缩格式
}
```

### 2. 纹理图集

```typescript
class TextureAtlas {
    private textures: Map<string, AtlasRegion> = new Map();
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(maxSize: number = 2048) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = maxSize;
        this.canvas.height = maxSize;
        this.ctx = this.canvas.getContext('2d')!;
    }

    addTexture(name: string, image: HTMLImageElement): AtlasRegion {
        // 找到合适的位置
        const region = this.findFreeRegion(image.width, image.height);

        // 绘制到图集
        this.ctx.drawImage(image, region.x, region.y);

        // 记录区域信息
        this.textures.set(name, region);

        return region;
    }

    createAtlasTexture(): RHITexture2D {
        return device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'rgba8unorm',
            usage: 'texture-binding' | 'copy-dst'
        });
    }
}

interface AtlasRegion {
    x: number;
    y: number;
    width: number;
    height: number;
    uv: [number, number, number, number]; // [u1, v1, u2, v2]
}
```

### 3. 纹理流式加载

```typescript
class StreamingTextureLoader {
    private loadQueue: TextureLoadRequest[] = [];
    private maxConcurrentLoads = 4;
    private currentLoads = 0;

    async loadTexturePriority(request: TextureLoadRequest): Promise<RHITexture2D> {
        return new Promise((resolve, reject) => {
            request.resolve = resolve;
            request.reject = reject;
            this.loadQueue.push(request);
            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.currentLoads >= this.maxConcurrentLoads || this.loadQueue.length === 0) {
            return;
        }

        const request = this.loadQueue.shift()!;
        this.currentLoads++;

        try {
            // 按优先级加载
            const texture = await this.loadTexture(request.url, request.options);
            request.resolve!(texture);
        } catch (error) {
            request.reject!(error);
        } finally {
            this.currentLoads--;
            this.processQueue(); // 处理下一个请求
        }
    }
}

interface TextureLoadRequest {
    url: string;
    priority: number;
    options?: TextureLoadOptions;
    resolve?: (texture: RHITexture2D) => void;
    reject?: (error: Error) => void;
}
```

## 🐛 常见问题

### Q: 纹理显示为黑色怎么办？

A: 排查步骤：
1. 检查纹理是否成功加载（查看Network面板）
2. 验证纹理格式是否支持
3. 确认采样器配置正确
4. 检查UV坐标范围是否在[0,1]内

### Q: Mipmap生成失败怎么办？

A: 常见原因：
- 纹理尺寸不是2的幂次方
- 格式不支持Mipmap
- 内存不足

### Q: 纹理内存占用过高怎么办？

A: 优化策略：
- 使用纹理压缩格式
- 实现纹理图集
- 启用纹理流式加载
- 动态调整纹理质量

## 🔗 相关资源

### 学习资源
- [WebGL Textures - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL)
- [Texture Mapping Fundamentals](https://learnopengl.com/Getting-started/Textures)
- [OpenGL Texture Wrapping](https://www.khronos.org/opengl/wiki/Texture#Wrapping)

### 代码示例
- [Texture Demo源码](../../packages/rhi/demo/src/textures/)
- [TextureLoader实现](../../packages/rhi/demo/src/utils/texture/TextureLoader.ts)
- [CubemapGenerator](../../packages/rhi/demo/src/utils/texture/CubemapGenerator.ts)

### 下一步学习
- [高级渲染开发](./demo-development-advanced.md) - 第四层高级渲染
- [PBR材质系统](../reference/pbr-material-system.md) - 基于物理的渲染

---

**注意**: 纹理系统是3D渲染中的核心组件，正确的纹理管理对性能和视觉质量都有重要影响。建议仔细理解每个Demo的技术要点，并在实际项目中灵活应用。
## 🔌 Interface First

### 核心接口定义
#### TextureLoadingDemo
```typescript
// 接口定义和用法
```

#### MipmapGenerator
```typescript
// 接口定义和用法
```

### 使用流程
1. **初始化**: 按照规范初始化相关组件
2. **配置**: 设置必要的参数和选项
3. **执行**: 调用核心接口执行功能
4. **验证**: 检查结果和状态

---

# 纹理系统开发指南

## 概述

纹理系统是RHI Demo系统的第二层，专注于纹理资源的加载、管理和渲染。本层包含5个核心Demo，展示了从基础纹理应用到高级多纹理混合的完整流程。

## 🎨 纹理Demo集

### 1. Texture Loading Demo - 纹理加载

**目标**: 展示基础纹理加载和应用

**技术要点**:
- 纹理资源创建和管理
- 纹理坐标系统
- 纹理采样器配置
- 异步资源加载

**核心实现**:
```typescript
class TextureLoadingDemo {
    private texture: RHITexture2D;
    private sampler: RHISampler;

    async loadTexture(url: string) {
        // 加载图片
        const image = await this.loadImage(url);

        // 创建纹理
        this.texture = this.device.createTexture({
            size: [image.width, image.height],
            format: 'rgba8unorm',
            usage: 'texture-binding' | 'copy-dst'
        });

        // 复制图片数据到纹理
        this.device.queue.copyExternalImageToTexture(
            { source: image },
            { texture: this.texture },
            [image.width, image.height]
        );

        // 创建采样器
        this.sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat'
        });
    }

    private loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
        });
    }
}
```

**着色器实现**:
```glsl
// 顶点着色器
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vTexCoord = aTexCoord;
}

// 片元着色器
precision mediump float;
uniform sampler2D uTexture;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    gl_FragColor = color;
}
```

### 2. Mipmap Generation Demo - Mipmap生成

**目标**: 展示Mipmap的自动生成和效果

**技术要点**:
- Mipmap链的原理和应用
- 不同LOD级别的选择
- Mipmap生成算法
- 性能优化效果

**Mipmap生成实现**:
```typescript
class MipmapGenerator {
    static generateMipmaps(
        device: RHIDevice,
        texture: RHITexture2D,
        imageData: ImageData
    ): void {
        const { width, height } = imageData;
        const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;

        let currentData = imageData;
        let currentWidth = width;
        let currentHeight = height;

        for (let level = 0; level < levels; level++) {
            // 写入当前级别
            device.queue.writeTexture(
                { texture, origin: [0, 0], aspect: 'all', mipLevel: level },
                currentData,
                { bytesPerRow: currentWidth * 4, rowsPerImage: currentHeight },
                [currentWidth, currentHeight]
            );

            // 生成下一级别的数据（2x2平均）
            if (level < levels - 1) {
                currentData = this.downsample(currentData);
                currentWidth = Math.max(1, Math.floor(currentWidth / 2));
                currentHeight = Math.max(1, Math.floor(currentHeight / 2));
            }
        }
    }

    private static downsource(imageData: ImageData): ImageData {
        const { width, height, data } = imageData;
        const newWidth = Math.max(1, Math.floor(width / 2));
        const newHeight = Math.max(1, Math.floor(height / 2));
        const newData = new Uint8ClampedArray(newWidth * newHeight * 4);

        // 2x2块平均算法
        for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
                const srcX = x * 2;
                const srcY = y * 2;

                let r = 0, g = 0, b = 0, a = 0;
                let count = 0;

                // 采样2x2区域
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        const sx = srcX + dx;
                        const sy = srcY + dy;

                        if (sx < width && sy < height) {
                            const idx = (sy * width + sx) * 4;
                            r += data[idx];
                            g += data[idx + 1];
                            b += data[idx + 2];
                            a += data[idx + 3];
                            count++;
                        }
                    }
                }

                // 计算平均值
                const dstIdx = (y * newWidth + x) * 4;
                newData[dstIdx] = r / count;
                newData[dstIdx + 1] = g / count;
                newData[dstIdx + 2] = b / count;
                newData[dstIdx + 3] = a / count;
            }
        }

        return new ImageData(newData, newWidth, newHeight);
    }
}
```

**Mipmap采样配置**:
```typescript
const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear-mipmap-linear', // 使用Mipmap
    mipmapFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    maxAnisotropy: 16 // 各向异性过滤
});
```

### 3. Texture Wrapping Demo - 纹理包裹模式

**目标**: 展示不同的纹理包裹模式效果

**技术要点**:
- 四种包裹模式：repeat, mirror-repeat, clamp-to-edge, mirror-clamp-to-edge
- UV坐标范围处理
- 边界效果展示
- 实时切换和对比

**包裹模式实现**:
```typescript
enum WrapMode {
    Repeat = 'repeat',
    MirrorRepeat = 'mirror-repeat',
    ClampToEdge = 'clamp-to-edge',
    MirrorClampToEdge = 'mirror-clamp-to-edge'
}

class TextureWrappingDemo {
    private samplers: Map<WrapMode, RHISampler> = new Map();

    createSamplers(device: RHIDevice): void {
        const modes = [
            WrapMode.Repeat,
            WrapMode.MirrorRepeat,
            WrapMode.ClampToEdge,
            WrapMode.MirrorClampToEdge
        ];

        for (const mode of modes) {
            const sampler = device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: mode,
                addressModeV: mode
            });
            this.samplers.set(mode, sampler);
        }
    }

    renderWithMode(renderPass: RHIRenderPass, mode: WrapMode): void {
        const sampler = this.samplers.get(mode);
        renderPass.setBindGroup(0, this.createBindGroup(sampler));
        renderPass.draw(6); // 渲染四边形
    }
}
```

**着色器中的包裹处理**:
```glsl
// 手动实现包裹模式（用于演示）
vec2 applyWrapMode(vec2 uv, float mode) {
    if (mode == 0.0) {
        // Repeat
        return fract(uv);
    } else if (mode == 1.0) {
        // Mirror Repeat
        vec2 fracted = fract(uv);
        vec2 floored = floor(uv);
        return mix(fracted, 1.0 - fracted, mod(floored, 2.0));
    } else if (mode == 2.0) {
        // Clamp to Edge
        return clamp(uv, 0.0, 1.0);
    }
    return uv;
}
```

### 4. Texture Filtering Demo - 纹理过滤

**目标**: 展示不同纹理过滤算法的视觉效果

**技术要点**:
- 最近邻过滤 vs 线性过滤
- 各向异性过滤
- 过滤质量与性能平衡
- 放大/缩小不同行为

**过滤模式实现**:
```typescript
interface FilterConfig {
    magFilter: 'nearest' | 'linear';
    minFilter: 'nearest' | 'linear' | 'linear-mipmap-linear';
    mipmapFilter: 'nearest' | 'linear';
    maxAnisotropy: number;
}

class TextureFilteringDemo {
    private configs: FilterConfig[] = [
        {
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
            maxAnisotropy: 1
        },
        {
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            maxAnisotropy: 1
        },
        {
            magFilter: 'linear',
            minFilter: 'linear-mipmap-linear',
            mipmapFilter: 'linear',
            maxAnisotropy: 16
        }
    ];

    createSamplers(device: RHIDevice): RHISampler[] {
        return this.configs.map(config =>
            device.createSampler(config)
        );
    }
}
```

**各向异性过滤效果**:
```typescript
// 创建测试纹理（用于展示各向异性过滤效果）
private createTestTexture(device: RHIDevice): RHITexture2D {
    const size = 256;
    const data = new Uint8Array(size * size * 4);

    // 创建倾斜线条图案
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;

            // 创建对角线条纹
            const line = (x + y) % 8 < 4;

            data[idx] = line ? 255 : 0;     // R
            data[idx + 1] = line ? 255 : 0; // G
            data[idx + 2] = line ? 255 : 0; // B
            data[idx + 3] = 255;             // A
        }
    }

    return device.createTexture({
        size: [size, size],
        format: 'rgba8unorm',
        usage: 'texture-binding' | 'copy-dst'
    });
}
```

### 5. Multi-Texture Demo - 多纹理混合

**目标**: 展示多纹理混合技术

**技术要点**:
- 多纹理单元管理
- 纹理混合模式
- 纹理坐标变换
- 纹理合成效果

**多纹理实现**:
```typescript
class MultiTextureDemo {
    private textures: RHITexture2D[] = [];
    private samplers: RHISampler[] = [];

    async loadTextures(urls: string[]): Promise<void> {
        // 并行加载多个纹理
        const loadPromises = urls.map(url => this.loadTexture(url));
        this.textures = await Promise.all(loadPromises);

        // 为每个纹理创建采样器
        this.samplers = this.textures.map(() =>
            this.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: 'repeat',
                addressModeV: 'repeat'
            })
        );
    }

    createBindGroup(): RHIBindGroup {
        return this.device.createBindGroup({
            layout: this.getBindGroupLayout(),
            entries: [
                {
                    binding: 0,
                    resource: this.samplers[0]
                },
                {
                    binding: 1,
                    resource: this.textures[0].createView()
                },
                {
                    binding: 2,
                    resource: this.samplers[1]
                },
                {
                    binding: 3,
                    resource: this.textures[1].createView()
                }
            ]
        });
    }
}
```

**多纹理着色器**:
```glsl
// 片元着色器
precision mediump float;

uniform sampler2D uTexture0;
uniform sampler2D uTexture1;
uniform float uBlendFactor;
uniform vec2 uTexCoord1; // 第二个纹理的坐标变换参数

varying vec2 vTexCoord;

// 混合模式枚举
#define BLEND_ADD 0
#define BLEND_MULTIPLY 1
#define BLEND_SCREEN 2
#define BLEND_OVERLAY 3

uniform int uBlendMode;

vec4 blendColors(vec4 color1, vec4 color2, float factor) {
    switch (uBlendMode) {
        case BLEND_ADD:
            return mix(color1, color1 + color2, factor);

        case BLEND_MULTIPLY:
            return mix(color1, color1 * color2, factor);

        case BLEND_SCREEN:
            return mix(color1, vec4(1.0) - (vec4(1.0) - color1) * (vec4(1.0) - color2), factor);

        case BLEND_OVERLAY:
            return mix(color1,
                mix(color1 * color2 * 2.0,
                    vec4(1.0) - (vec4(1.0) - color1) * (vec4(1.0) - color2) * 2.0,
                    step(color1, vec4(0.5))), factor);

        default:
            return mix(color1, color2, factor);
    }
}

void main() {
    vec4 color0 = texture2D(uTexture0, vTexCoord);
    vec4 color1 = texture2D(uTexture1, vTexCoord * uTexCoord1);

    gl_FragColor = blendColors(color0, color1, uBlendFactor);
}
```

## 🔧 纹理工具库

### TextureLoader - 纹理加载器

**功能**: 统一的纹理加载接口

```typescript
export class TextureLoader {
    static async load(url: string, options: TextureLoadOptions = {}): Promise<RHITexture2D> {
        const {
            flipY = true,
            generateMipmaps = false,
            premultiplyAlpha = false,
            format = 'rgba8unorm'
        } = options;

        const image = await this.loadImage(url);

        // 预处理图片数据
        const imageData = this.preprocessImage(image, flipY, premultiplyAlpha);

        // 创建纹理
        const texture = device.createTexture({
            size: [image.width, image.height],
            format,
            usage: 'texture-binding' | 'copy-dst'
        });

        // 复制数据
        device.queue.writeTexture(
            { texture },
            imageData,
            { bytesPerRow: image.width * 4 },
            [image.width, image.height]
        );

        // 生成Mipmap
        if (generateMipmaps) {
            MipmapGenerator.generateMipmaps(device, texture, imageData);
        }

        return texture;
    }

    static async loadAll(urls: string[], options: TextureLoadOptions = {}): Promise<RHITexture2D[]> {
        const loadPromises = urls.map(url => this.load(url, options));
        return Promise.all(loadPromises);
    }

    private static async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous'; // 支持跨域图片
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            image.src = url;
        });
    }

    private static preprocessImage(
        image: HTMLImageElement,
        flipY: boolean,
        premultiplyAlpha: boolean
    ): ImageData {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext('2d')!;

        // 应用Y轴翻转
        if (flipY) {
            ctx.save();
            ctx.scale(1, -1);
            ctx.drawImage(image, 0, -image.height);
            ctx.restore();
        } else {
            ctx.drawImage(image, 0, 0);
        }

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // 应用Alpha预乘
        if (premultiplyAlpha) {
            imageData = this.premultiplyAlpha(imageData);
        }

        return imageData;
    }

    private static premultiplyAlpha(imageData: ImageData): ImageData {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3] / 255;
            data[i] *= alpha;     // R
            data[i + 1] *= alpha; // G
            data[i + 2] *= alpha; // B
            // A保持不变
        }
        return imageData;
    }
}
```

### CubemapGenerator - 立方体贴图生成器

**功能**: 生成各种类型的立方体贴图

```typescript
export class CubemapGenerator {
    static skyGradient(config: SkyGradientConfig): RHITextureCube {
        const {
            topColor = [135, 206, 250, 255],
            horizonColor = [176, 196, 222, 255],
            bottomColor = [139, 69, 19, 255],
            size = 256
        } = config;

        const faces: ImageData[] = [];

        // 生成立方体贴图的6个面
        for (let face = 0; face < 6; face++) {
            const imageData = new ImageData(size, size);
            const data = imageData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const idx = (y * size + x) * 4;

                    // 根据Y坐标计算渐变
                    const t = y / (size - 1);
                    let color: number[];

                    if (t < 0.5) {
                        // 顶部到中间
                        const localT = t * 2;
                        color = this.interpolateColor(topColor, horizonColor, localT);
                    } else {
                        // 中间到底部
                        const localT = (t - 0.5) * 2;
                        color = this.interpolateColor(horizonColor, bottomColor, localT);
                    }

                    // 根据面的朝向调整颜色
                    const adjustedColor = this.adjustColorForFace(color, face);

                    data[idx] = adjustedColor[0];
                    data[idx + 1] = adjustedColor[1];
                    data[idx + 2] = adjustedColor[2];
                    data[idx + 3] = adjustedColor[3];
                }
            }

            faces.push(imageData);
        }

        return this.createCubeTextureFromFaces(faces);
    }

    static fromEquirectangular(url: string, size: number = 512): Promise<RHITextureCube> {
        return new Promise(async (resolve, reject) => {
            try {
                // 加载全景图
                const image = await this.loadImage(url);

                // 创建canvas进行转换
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;

                // 生成立方体贴图的6个面
                const faces: ImageData[] = [];

                for (let face = 0; face < 6; face++) {
                    canvas.width = size;
                    canvas.height = size;

                    // 根据面的角度设置变换矩阵
                    this.setupCubeFaceTransform(ctx, face, image.width, image.height);
                    ctx.drawImage(image, 0, 0);

                    faces.push(ctx.getImageData(0, 0, size, size));
                }

                const cubeTexture = this.createCubeTextureFromFaces(faces);
                resolve(cubeTexture);

            } catch (error) {
                reject(error);
            }
        });
    }

    private static setupCubeFaceTransform(
        ctx: CanvasRenderingContext2D,
        face: number,
        sourceWidth: number,
        sourceHeight: number
    ): void {
        const { width, height } = ctx.canvas;

        ctx.save();

        // 设置投影和变换
        ctx.scale(width / Math.PI, height / (Math.PI / 2));

        switch (face) {
            case 0: // +X (右)
                ctx.translate(0, Math.PI / 2);
                ctx.rotate(Math.PI / 2);
                break;
            case 1: // -X (左)
                ctx.translate(Math.PI, Math.PI / 2);
                ctx.rotate(-Math.PI / 2);
                break;
            case 2: // +Y (上)
                ctx.translate(Math.PI / 2, 0);
                ctx.rotate(Math.PI);
                break;
            case 3: // -Y (下)
                ctx.translate(Math.PI / 2, Math.PI);
                break;
            case 4: // +Z (前)
                ctx.translate(Math.PI / 2, Math.PI / 2);
                break;
            case 5: // -Z (后)
                ctx.translate(Math.PI * 1.5, Math.PI / 2);
                break;
        }

        // 设置源图像变换
        ctx.scale(sourceWidth / (2 * Math.PI), sourceHeight / Math.PI);
        ctx.translate(-Math.PI, -Math.PI / 2);

        ctx.restore();
    }

    private static interpolateColor(color1: number[], color2: number[], t: number): number[] {
        return color1.map((c1, i) => Math.round(c1 + (color2[i] - c1) * t));
    }

    private static adjustColorForFace(color: number[], face: number): number[] {
        // 根据面的朝向微调颜色强度
        const intensity = [1.0, 0.95, 0.9, 1.1, 1.05, 1.0][face];
        return color.map(c => Math.min(255, Math.round(c * intensity)));
    }

    private static createCubeTextureFromFaces(faces: ImageData[]): RHITextureCube {
        const size = faces[0].width;

        const texture = device.createTexture({
            size: [size, size, 6],
            format: 'rgba8unorm',
            usage: 'texture-binding' | 'copy-dst'
        });

        // 写入每个面的数据
        faces.forEach((face, index) => {
            device.queue.writeTexture(
                {
                    texture,
                    origin: [0, 0, index],
                    aspect: 'all'
                },
                face,
                { bytesPerRow: size * 4 },
                [size, size]
            );
        });

        return texture;
    }
}
```

## 🎯 纹理性能优化

### 1. 纹理压缩

```typescript
// 支持压缩纹理格式
const compressedFormats = [
    'bc1-rgba-unorm',     // DXT1
    'bc3-rgba-unorm',     // DXT5
    'etc2-rgba8unorm',    // ETC2
    'astc-4x4-unorm'      // ASTC
];

// 自动选择最佳压缩格式
function selectOptimalFormat(device: RHIDevice): GPUTextureFormat {
    for (const format of compressedFormats) {
        if (device.features.has(format)) {
            return format;
        }
    }
    return 'rgba8unorm'; // 降级到未压缩格式
}
```

### 2. 纹理图集

```typescript
class TextureAtlas {
    private textures: Map<string, AtlasRegion> = new Map();
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(maxSize: number = 2048) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = maxSize;
        this.canvas.height = maxSize;
        this.ctx = this.canvas.getContext('2d')!;
    }

    addTexture(name: string, image: HTMLImageElement): AtlasRegion {
        // 找到合适的位置
        const region = this.findFreeRegion(image.width, image.height);

        // 绘制到图集
        this.ctx.drawImage(image, region.x, region.y);

        // 记录区域信息
        this.textures.set(name, region);

        return region;
    }

    createAtlasTexture(): RHITexture2D {
        return device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'rgba8unorm',
            usage: 'texture-binding' | 'copy-dst'
        });
    }
}

interface AtlasRegion {
    x: number;
    y: number;
    width: number;
    height: number;
    uv: [number, number, number, number]; // [u1, v1, u2, v2]
}
```

### 3. 纹理流式加载

```typescript
class StreamingTextureLoader {
    private loadQueue: TextureLoadRequest[] = [];
    private maxConcurrentLoads = 4;
    private currentLoads = 0;

    async loadTexturePriority(request: TextureLoadRequest): Promise<RHITexture2D> {
        return new Promise((resolve, reject) => {
            request.resolve = resolve;
            request.reject = reject;
            this.loadQueue.push(request);
            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.currentLoads >= this.maxConcurrentLoads || this.loadQueue.length === 0) {
            return;
        }

        const request = this.loadQueue.shift()!;
        this.currentLoads++;

        try {
            // 按优先级加载
            const texture = await this.loadTexture(request.url, request.options);
            request.resolve!(texture);
        } catch (error) {
            request.reject!(error);
        } finally {
            this.currentLoads--;
            this.processQueue(); // 处理下一个请求
        }
    }
}

interface TextureLoadRequest {
    url: string;
    priority: number;
    options?: TextureLoadOptions;
    resolve?: (texture: RHITexture2D) => void;
    reject?: (error: Error) => void;
}
```

## 🐛 常见问题

### Q: 纹理显示为黑色怎么办？

A: 排查步骤：
1. 检查纹理是否成功加载（查看Network面板）
2. 验证纹理格式是否支持
3. 确认采样器配置正确
4. 检查UV坐标范围是否在[0,1]内

### Q: Mipmap生成失败怎么办？

A: 常见原因：
- 纹理尺寸不是2的幂次方
- 格式不支持Mipmap
- 内存不足

### Q: 纹理内存占用过高怎么办？

A: 优化策略：
- 使用纹理压缩格式
- 实现纹理图集
- 启用纹理流式加载
- 动态调整纹理质量

## 🔗 相关资源

### 学习资源
- [WebGL Textures - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL)
- [Texture Mapping Fundamentals](https://learnopengl.com/Getting-started/Textures)
- [OpenGL Texture Wrapping](https://www.khronos.org/opengl/wiki/Texture#Wrapping)

### 代码示例
- [Texture Demo源码](../../packages/rhi/demo/src/textures/)
- [TextureLoader实现](../../packages/rhi/demo/src/utils/texture/TextureLoader.ts)
- [CubemapGenerator](../../packages/rhi/demo/src/utils/texture/CubemapGenerator.ts)

### 下一步学习
- [高级渲染开发](./demo-development-advanced.md) - 第四层高级渲染
- [PBR材质系统](../reference/pbr-material-system.md) - 基于物理的渲染

---

**注意**: 纹理系统是3D渲染中的核心组件，正确的纹理管理对性能和视觉质量都有重要影响。建议仔细理解每个Demo的技术要点，并在实际项目中灵活应用。
## ⚠️ 禁止事项

### 关键约束
- 🚫 **避免硬编码路径**: 使用相对路径或配置文件
- 🚫 **忽略资源清理**: 确保所有资源得到正确释放
- 🚫 **缺少错误处理**: 提供清晰的错误信息和恢复机制

### 常见错误
- ❌ 忽略错误处理和异常情况
- ❌ 缺少必要的性能优化
- ❌ 不遵循项目的编码规范
- ❌ 忽略文档更新和维护

### 最佳实践提醒
- ✅ 始终考虑性能影响
- ✅ 提供清晰的错误信息
- ✅ 保持代码的可维护性
- ✅ 定期更新文档

---

# 纹理系统开发指南

## 概述

纹理系统是RHI Demo系统的第二层，专注于纹理资源的加载、管理和渲染。本层包含5个核心Demo，展示了从基础纹理应用到高级多纹理混合的完整流程。

## 🎨 纹理Demo集

### 1. Texture Loading Demo - 纹理加载

**目标**: 展示基础纹理加载和应用

**技术要点**:
- 纹理资源创建和管理
- 纹理坐标系统
- 纹理采样器配置
- 异步资源加载

**核心实现**:
```typescript
class TextureLoadingDemo {
    private texture: RHITexture2D;
    private sampler: RHISampler;

    async loadTexture(url: string) {
        // 加载图片
        const image = await this.loadImage(url);

        // 创建纹理
        this.texture = this.device.createTexture({
            size: [image.width, image.height],
            format: 'rgba8unorm',
            usage: 'texture-binding' | 'copy-dst'
        });

        // 复制图片数据到纹理
        this.device.queue.copyExternalImageToTexture(
            { source: image },
            { texture: this.texture },
            [image.width, image.height]
        );

        // 创建采样器
        this.sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat'
        });
    }

    private loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
        });
    }
}
```

**着色器实现**:
```glsl
// 顶点着色器
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vTexCoord = aTexCoord;
}

// 片元着色器
precision mediump float;
uniform sampler2D uTexture;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    gl_FragColor = color;
}
```

### 2. Mipmap Generation Demo - Mipmap生成

**目标**: 展示Mipmap的自动生成和效果

**技术要点**:
- Mipmap链的原理和应用
- 不同LOD级别的选择
- Mipmap生成算法
- 性能优化效果

**Mipmap生成实现**:
```typescript
class MipmapGenerator {
    static generateMipmaps(
        device: RHIDevice,
        texture: RHITexture2D,
        imageData: ImageData
    ): void {
        const { width, height } = imageData;
        const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;

        let currentData = imageData;
        let currentWidth = width;
        let currentHeight = height;

        for (let level = 0; level < levels; level++) {
            // 写入当前级别
            device.queue.writeTexture(
                { texture, origin: [0, 0], aspect: 'all', mipLevel: level },
                currentData,
                { bytesPerRow: currentWidth * 4, rowsPerImage: currentHeight },
                [currentWidth, currentHeight]
            );

            // 生成下一级别的数据（2x2平均）
            if (level < levels - 1) {
                currentData = this.downsample(currentData);
                currentWidth = Math.max(1, Math.floor(currentWidth / 2));
                currentHeight = Math.max(1, Math.floor(currentHeight / 2));
            }
        }
    }

    private static downsource(imageData: ImageData): ImageData {
        const { width, height, data } = imageData;
        const newWidth = Math.max(1, Math.floor(width / 2));
        const newHeight = Math.max(1, Math.floor(height / 2));
        const newData = new Uint8ClampedArray(newWidth * newHeight * 4);

        // 2x2块平均算法
        for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
                const srcX = x * 2;
                const srcY = y * 2;

                let r = 0, g = 0, b = 0, a = 0;
                let count = 0;

                // 采样2x2区域
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        const sx = srcX + dx;
                        const sy = srcY + dy;

                        if (sx < width && sy < height) {
                            const idx = (sy * width + sx) * 4;
                            r += data[idx];
                            g += data[idx + 1];
                            b += data[idx + 2];
                            a += data[idx + 3];
                            count++;
                        }
                    }
                }

                // 计算平均值
                const dstIdx = (y * newWidth + x) * 4;
                newData[dstIdx] = r / count;
                newData[dstIdx + 1] = g / count;
                newData[dstIdx + 2] = b / count;
                newData[dstIdx + 3] = a / count;
            }
        }

        return new ImageData(newData, newWidth, newHeight);
    }
}
```

**Mipmap采样配置**:
```typescript
const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear-mipmap-linear', // 使用Mipmap
    mipmapFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    maxAnisotropy: 16 // 各向异性过滤
});
```

### 3. Texture Wrapping Demo - 纹理包裹模式

**目标**: 展示不同的纹理包裹模式效果

**技术要点**:
- 四种包裹模式：repeat, mirror-repeat, clamp-to-edge, mirror-clamp-to-edge
- UV坐标范围处理
- 边界效果展示
- 实时切换和对比

**包裹模式实现**:
```typescript
enum WrapMode {
    Repeat = 'repeat',
    MirrorRepeat = 'mirror-repeat',
    ClampToEdge = 'clamp-to-edge',
    MirrorClampToEdge = 'mirror-clamp-to-edge'
}

class TextureWrappingDemo {
    private samplers: Map<WrapMode, RHISampler> = new Map();

    createSamplers(device: RHIDevice): void {
        const modes = [
            WrapMode.Repeat,
            WrapMode.MirrorRepeat,
            WrapMode.ClampToEdge,
            WrapMode.MirrorClampToEdge
        ];

        for (const mode of modes) {
            const sampler = device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: mode,
                addressModeV: mode
            });
            this.samplers.set(mode, sampler);
        }
    }

    renderWithMode(renderPass: RHIRenderPass, mode: WrapMode): void {
        const sampler = this.samplers.get(mode);
        renderPass.setBindGroup(0, this.createBindGroup(sampler));
        renderPass.draw(6); // 渲染四边形
    }
}
```

**着色器中的包裹处理**:
```glsl
// 手动实现包裹模式（用于演示）
vec2 applyWrapMode(vec2 uv, float mode) {
    if (mode == 0.0) {
        // Repeat
        return fract(uv);
    } else if (mode == 1.0) {
        // Mirror Repeat
        vec2 fracted = fract(uv);
        vec2 floored = floor(uv);
        return mix(fracted, 1.0 - fracted, mod(floored, 2.0));
    } else if (mode == 2.0) {
        // Clamp to Edge
        return clamp(uv, 0.0, 1.0);
    }
    return uv;
}
```

### 4. Texture Filtering Demo - 纹理过滤

**目标**: 展示不同纹理过滤算法的视觉效果

**技术要点**:
- 最近邻过滤 vs 线性过滤
- 各向异性过滤
- 过滤质量与性能平衡
- 放大/缩小不同行为

**过滤模式实现**:
```typescript
interface FilterConfig {
    magFilter: 'nearest' | 'linear';
    minFilter: 'nearest' | 'linear' | 'linear-mipmap-linear';
    mipmapFilter: 'nearest' | 'linear';
    maxAnisotropy: number;
}

class TextureFilteringDemo {
    private configs: FilterConfig[] = [
        {
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
            maxAnisotropy: 1
        },
        {
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            maxAnisotropy: 1
        },
        {
            magFilter: 'linear',
            minFilter: 'linear-mipmap-linear',
            mipmapFilter: 'linear',
            maxAnisotropy: 16
        }
    ];

    createSamplers(device: RHIDevice): RHISampler[] {
        return this.configs.map(config =>
            device.createSampler(config)
        );
    }
}
```

**各向异性过滤效果**:
```typescript
// 创建测试纹理（用于展示各向异性过滤效果）
private createTestTexture(device: RHIDevice): RHITexture2D {
    const size = 256;
    const data = new Uint8Array(size * size * 4);

    // 创建倾斜线条图案
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;

            // 创建对角线条纹
            const line = (x + y) % 8 < 4;

            data[idx] = line ? 255 : 0;     // R
            data[idx + 1] = line ? 255 : 0; // G
            data[idx + 2] = line ? 255 : 0; // B
            data[idx + 3] = 255;             // A
        }
    }

    return device.createTexture({
        size: [size, size],
        format: 'rgba8unorm',
        usage: 'texture-binding' | 'copy-dst'
    });
}
```

### 5. Multi-Texture Demo - 多纹理混合

**目标**: 展示多纹理混合技术

**技术要点**:
- 多纹理单元管理
- 纹理混合模式
- 纹理坐标变换
- 纹理合成效果

**多纹理实现**:
```typescript
class MultiTextureDemo {
    private textures: RHITexture2D[] = [];
    private samplers: RHISampler[] = [];

    async loadTextures(urls: string[]): Promise<void> {
        // 并行加载多个纹理
        const loadPromises = urls.map(url => this.loadTexture(url));
        this.textures = await Promise.all(loadPromises);

        // 为每个纹理创建采样器
        this.samplers = this.textures.map(() =>
            this.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: 'repeat',
                addressModeV: 'repeat'
            })
        );
    }

    createBindGroup(): RHIBindGroup {
        return this.device.createBindGroup({
            layout: this.getBindGroupLayout(),
            entries: [
                {
                    binding: 0,
                    resource: this.samplers[0]
                },
                {
                    binding: 1,
                    resource: this.textures[0].createView()
                },
                {
                    binding: 2,
                    resource: this.samplers[1]
                },
                {
                    binding: 3,
                    resource: this.textures[1].createView()
                }
            ]
        });
    }
}
```

**多纹理着色器**:
```glsl
// 片元着色器
precision mediump float;

uniform sampler2D uTexture0;
uniform sampler2D uTexture1;
uniform float uBlendFactor;
uniform vec2 uTexCoord1; // 第二个纹理的坐标变换参数

varying vec2 vTexCoord;

// 混合模式枚举
#define BLEND_ADD 0
#define BLEND_MULTIPLY 1
#define BLEND_SCREEN 2
#define BLEND_OVERLAY 3

uniform int uBlendMode;

vec4 blendColors(vec4 color1, vec4 color2, float factor) {
    switch (uBlendMode) {
        case BLEND_ADD:
            return mix(color1, color1 + color2, factor);

        case BLEND_MULTIPLY:
            return mix(color1, color1 * color2, factor);

        case BLEND_SCREEN:
            return mix(color1, vec4(1.0) - (vec4(1.0) - color1) * (vec4(1.0) - color2), factor);

        case BLEND_OVERLAY:
            return mix(color1,
                mix(color1 * color2 * 2.0,
                    vec4(1.0) - (vec4(1.0) - color1) * (vec4(1.0) - color2) * 2.0,
                    step(color1, vec4(0.5))), factor);

        default:
            return mix(color1, color2, factor);
    }
}

void main() {
    vec4 color0 = texture2D(uTexture0, vTexCoord);
    vec4 color1 = texture2D(uTexture1, vTexCoord * uTexCoord1);

    gl_FragColor = blendColors(color0, color1, uBlendFactor);
}
```

## 🔧 纹理工具库

### TextureLoader - 纹理加载器

**功能**: 统一的纹理加载接口

```typescript
export class TextureLoader {
    static async load(url: string, options: TextureLoadOptions = {}): Promise<RHITexture2D> {
        const {
            flipY = true,
            generateMipmaps = false,
            premultiplyAlpha = false,
            format = 'rgba8unorm'
        } = options;

        const image = await this.loadImage(url);

        // 预处理图片数据
        const imageData = this.preprocessImage(image, flipY, premultiplyAlpha);

        // 创建纹理
        const texture = device.createTexture({
            size: [image.width, image.height],
            format,
            usage: 'texture-binding' | 'copy-dst'
        });

        // 复制数据
        device.queue.writeTexture(
            { texture },
            imageData,
            { bytesPerRow: image.width * 4 },
            [image.width, image.height]
        );

        // 生成Mipmap
        if (generateMipmaps) {
            MipmapGenerator.generateMipmaps(device, texture, imageData);
        }

        return texture;
    }

    static async loadAll(urls: string[], options: TextureLoadOptions = {}): Promise<RHITexture2D[]> {
        const loadPromises = urls.map(url => this.load(url, options));
        return Promise.all(loadPromises);
    }

    private static async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous'; // 支持跨域图片
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            image.src = url;
        });
    }

    private static preprocessImage(
        image: HTMLImageElement,
        flipY: boolean,
        premultiplyAlpha: boolean
    ): ImageData {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext('2d')!;

        // 应用Y轴翻转
        if (flipY) {
            ctx.save();
            ctx.scale(1, -1);
            ctx.drawImage(image, 0, -image.height);
            ctx.restore();
        } else {
            ctx.drawImage(image, 0, 0);
        }

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // 应用Alpha预乘
        if (premultiplyAlpha) {
            imageData = this.premultiplyAlpha(imageData);
        }

        return imageData;
    }

    private static premultiplyAlpha(imageData: ImageData): ImageData {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3] / 255;
            data[i] *= alpha;     // R
            data[i + 1] *= alpha; // G
            data[i + 2] *= alpha; // B
            // A保持不变
        }
        return imageData;
    }
}
```

### CubemapGenerator - 立方体贴图生成器

**功能**: 生成各种类型的立方体贴图

```typescript
export class CubemapGenerator {
    static skyGradient(config: SkyGradientConfig): RHITextureCube {
        const {
            topColor = [135, 206, 250, 255],
            horizonColor = [176, 196, 222, 255],
            bottomColor = [139, 69, 19, 255],
            size = 256
        } = config;

        const faces: ImageData[] = [];

        // 生成立方体贴图的6个面
        for (let face = 0; face < 6; face++) {
            const imageData = new ImageData(size, size);
            const data = imageData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const idx = (y * size + x) * 4;

                    // 根据Y坐标计算渐变
                    const t = y / (size - 1);
                    let color: number[];

                    if (t < 0.5) {
                        // 顶部到中间
                        const localT = t * 2;
                        color = this.interpolateColor(topColor, horizonColor, localT);
                    } else {
                        // 中间到底部
                        const localT = (t - 0.5) * 2;
                        color = this.interpolateColor(horizonColor, bottomColor, localT);
                    }

                    // 根据面的朝向调整颜色
                    const adjustedColor = this.adjustColorForFace(color, face);

                    data[idx] = adjustedColor[0];
                    data[idx + 1] = adjustedColor[1];
                    data[idx + 2] = adjustedColor[2];
                    data[idx + 3] = adjustedColor[3];
                }
            }

            faces.push(imageData);
        }

        return this.createCubeTextureFromFaces(faces);
    }

    static fromEquirectangular(url: string, size: number = 512): Promise<RHITextureCube> {
        return new Promise(async (resolve, reject) => {
            try {
                // 加载全景图
                const image = await this.loadImage(url);

                // 创建canvas进行转换
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;

                // 生成立方体贴图的6个面
                const faces: ImageData[] = [];

                for (let face = 0; face < 6; face++) {
                    canvas.width = size;
                    canvas.height = size;

                    // 根据面的角度设置变换矩阵
                    this.setupCubeFaceTransform(ctx, face, image.width, image.height);
                    ctx.drawImage(image, 0, 0);

                    faces.push(ctx.getImageData(0, 0, size, size));
                }

                const cubeTexture = this.createCubeTextureFromFaces(faces);
                resolve(cubeTexture);

            } catch (error) {
                reject(error);
            }
        });
    }

    private static setupCubeFaceTransform(
        ctx: CanvasRenderingContext2D,
        face: number,
        sourceWidth: number,
        sourceHeight: number
    ): void {
        const { width, height } = ctx.canvas;

        ctx.save();

        // 设置投影和变换
        ctx.scale(width / Math.PI, height / (Math.PI / 2));

        switch (face) {
            case 0: // +X (右)
                ctx.translate(0, Math.PI / 2);
                ctx.rotate(Math.PI / 2);
                break;
            case 1: // -X (左)
                ctx.translate(Math.PI, Math.PI / 2);
                ctx.rotate(-Math.PI / 2);
                break;
            case 2: // +Y (上)
                ctx.translate(Math.PI / 2, 0);
                ctx.rotate(Math.PI);
                break;
            case 3: // -Y (下)
                ctx.translate(Math.PI / 2, Math.PI);
                break;
            case 4: // +Z (前)
                ctx.translate(Math.PI / 2, Math.PI / 2);
                break;
            case 5: // -Z (后)
                ctx.translate(Math.PI * 1.5, Math.PI / 2);
                break;
        }

        // 设置源图像变换
        ctx.scale(sourceWidth / (2 * Math.PI), sourceHeight / Math.PI);
        ctx.translate(-Math.PI, -Math.PI / 2);

        ctx.restore();
    }

    private static interpolateColor(color1: number[], color2: number[], t: number): number[] {
        return color1.map((c1, i) => Math.round(c1 + (color2[i] - c1) * t));
    }

    private static adjustColorForFace(color: number[], face: number): number[] {
        // 根据面的朝向微调颜色强度
        const intensity = [1.0, 0.95, 0.9, 1.1, 1.05, 1.0][face];
        return color.map(c => Math.min(255, Math.round(c * intensity)));
    }

    private static createCubeTextureFromFaces(faces: ImageData[]): RHITextureCube {
        const size = faces[0].width;

        const texture = device.createTexture({
            size: [size, size, 6],
            format: 'rgba8unorm',
            usage: 'texture-binding' | 'copy-dst'
        });

        // 写入每个面的数据
        faces.forEach((face, index) => {
            device.queue.writeTexture(
                {
                    texture,
                    origin: [0, 0, index],
                    aspect: 'all'
                },
                face,
                { bytesPerRow: size * 4 },
                [size, size]
            );
        });

        return texture;
    }
}
```

## 🎯 纹理性能优化

### 1. 纹理压缩

```typescript
// 支持压缩纹理格式
const compressedFormats = [
    'bc1-rgba-unorm',     // DXT1
    'bc3-rgba-unorm',     // DXT5
    'etc2-rgba8unorm',    // ETC2
    'astc-4x4-unorm'      // ASTC
];

// 自动选择最佳压缩格式
function selectOptimalFormat(device: RHIDevice): GPUTextureFormat {
    for (const format of compressedFormats) {
        if (device.features.has(format)) {
            return format;
        }
    }
    return 'rgba8unorm'; // 降级到未压缩格式
}
```

### 2. 纹理图集

```typescript
class TextureAtlas {
    private textures: Map<string, AtlasRegion> = new Map();
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(maxSize: number = 2048) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = maxSize;
        this.canvas.height = maxSize;
        this.ctx = this.canvas.getContext('2d')!;
    }

    addTexture(name: string, image: HTMLImageElement): AtlasRegion {
        // 找到合适的位置
        const region = this.findFreeRegion(image.width, image.height);

        // 绘制到图集
        this.ctx.drawImage(image, region.x, region.y);

        // 记录区域信息
        this.textures.set(name, region);

        return region;
    }

    createAtlasTexture(): RHITexture2D {
        return device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'rgba8unorm',
            usage: 'texture-binding' | 'copy-dst'
        });
    }
}

interface AtlasRegion {
    x: number;
    y: number;
    width: number;
    height: number;
    uv: [number, number, number, number]; // [u1, v1, u2, v2]
}
```

### 3. 纹理流式加载

```typescript
class StreamingTextureLoader {
    private loadQueue: TextureLoadRequest[] = [];
    private maxConcurrentLoads = 4;
    private currentLoads = 0;

    async loadTexturePriority(request: TextureLoadRequest): Promise<RHITexture2D> {
        return new Promise((resolve, reject) => {
            request.resolve = resolve;
            request.reject = reject;
            this.loadQueue.push(request);
            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.currentLoads >= this.maxConcurrentLoads || this.loadQueue.length === 0) {
            return;
        }

        const request = this.loadQueue.shift()!;
        this.currentLoads++;

        try {
            // 按优先级加载
            const texture = await this.loadTexture(request.url, request.options);
            request.resolve!(texture);
        } catch (error) {
            request.reject!(error);
        } finally {
            this.currentLoads--;
            this.processQueue(); // 处理下一个请求
        }
    }
}

interface TextureLoadRequest {
    url: string;
    priority: number;
    options?: TextureLoadOptions;
    resolve?: (texture: RHITexture2D) => void;
    reject?: (error: Error) => void;
}
```

## 🐛 常见问题

### Q: 纹理显示为黑色怎么办？

A: 排查步骤：
1. 检查纹理是否成功加载（查看Network面板）
2. 验证纹理格式是否支持
3. 确认采样器配置正确
4. 检查UV坐标范围是否在[0,1]内

### Q: Mipmap生成失败怎么办？

A: 常见原因：
- 纹理尺寸不是2的幂次方
- 格式不支持Mipmap
- 内存不足

### Q: 纹理内存占用过高怎么办？

A: 优化策略：
- 使用纹理压缩格式
- 实现纹理图集
- 启用纹理流式加载
- 动态调整纹理质量

## 🔗 相关资源

### 学习资源
- [WebGL Textures - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL)
- [Texture Mapping Fundamentals](https://learnopengl.com/Getting-started/Textures)
- [OpenGL Texture Wrapping](https://www.khronos.org/opengl/wiki/Texture#Wrapping)

### 代码示例
- [Texture Demo源码](../../packages/rhi/demo/src/textures/)
- [TextureLoader实现](../../packages/rhi/demo/src/utils/texture/TextureLoader.ts)
- [CubemapGenerator](../../packages/rhi/demo/src/utils/texture/CubemapGenerator.ts)

### 下一步学习
- [高级渲染开发](./demo-development-advanced.md) - 第四层高级渲染
- [PBR材质系统](../reference/pbr-material-system.md) - 基于物理的渲染

---

**注意**: 纹理系统是3D渲染中的核心组件，正确的纹理管理对性能和视觉质量都有重要影响。建议仔细理解每个Demo的技术要点，并在实际项目中灵活应用。
## 📚 Few-Shot示例

### 问题-解决方案对
**问题**: Demo无法在特定设备上运行
**解决方案**: 添加设备兼容性检查和降级方案
```typescript
if (!device.supportsFeature('requiredFeature')) {
  // 使用降级渲染
  renderer.useFallbackMode();
}
```

**问题**: 资源加载失败导致Demo崩溃
**解决方案**: 实现资源加载重试机制
```typescript
try {
  await resourceLoader.loadWithRetry(texturePath, 3);
} catch (error) {
  console.warn('使用默认纹理:', error);
  texture = defaultTexture;
}
```

### 学习要点
- 理解常见问题和解决方案
- 掌握最佳实践和避免陷阱
- 培养问题解决思维

---

# 纹理系统开发指南

## 概述

纹理系统是RHI Demo系统的第二层，专注于纹理资源的加载、管理和渲染。本层包含5个核心Demo，展示了从基础纹理应用到高级多纹理混合的完整流程。

## 🎨 纹理Demo集

### 1. Texture Loading Demo - 纹理加载

**目标**: 展示基础纹理加载和应用

**技术要点**:
- 纹理资源创建和管理
- 纹理坐标系统
- 纹理采样器配置
- 异步资源加载

**核心实现**:
```typescript
class TextureLoadingDemo {
    private texture: RHITexture2D;
    private sampler: RHISampler;

    async loadTexture(url: string) {
        // 加载图片
        const image = await this.loadImage(url);

        // 创建纹理
        this.texture = this.device.createTexture({
            size: [image.width, image.height],
            format: 'rgba8unorm',
            usage: 'texture-binding' | 'copy-dst'
        });

        // 复制图片数据到纹理
        this.device.queue.copyExternalImageToTexture(
            { source: image },
            { texture: this.texture },
            [image.width, image.height]
        );

        // 创建采样器
        this.sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat'
        });
    }

    private loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
        });
    }
}
```

**着色器实现**:
```glsl
// 顶点着色器
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vTexCoord = aTexCoord;
}

// 片元着色器
precision mediump float;
uniform sampler2D uTexture;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    gl_FragColor = color;
}
```

### 2. Mipmap Generation Demo - Mipmap生成

**目标**: 展示Mipmap的自动生成和效果

**技术要点**:
- Mipmap链的原理和应用
- 不同LOD级别的选择
- Mipmap生成算法
- 性能优化效果

**Mipmap生成实现**:
```typescript
class MipmapGenerator {
    static generateMipmaps(
        device: RHIDevice,
        texture: RHITexture2D,
        imageData: ImageData
    ): void {
        const { width, height } = imageData;
        const levels = Math.floor(Math.log2(Math.max(width, height))) + 1;

        let currentData = imageData;
        let currentWidth = width;
        let currentHeight = height;

        for (let level = 0; level < levels; level++) {
            // 写入当前级别
            device.queue.writeTexture(
                { texture, origin: [0, 0], aspect: 'all', mipLevel: level },
                currentData,
                { bytesPerRow: currentWidth * 4, rowsPerImage: currentHeight },
                [currentWidth, currentHeight]
            );

            // 生成下一级别的数据（2x2平均）
            if (level < levels - 1) {
                currentData = this.downsample(currentData);
                currentWidth = Math.max(1, Math.floor(currentWidth / 2));
                currentHeight = Math.max(1, Math.floor(currentHeight / 2));
            }
        }
    }

    private static downsource(imageData: ImageData): ImageData {
        const { width, height, data } = imageData;
        const newWidth = Math.max(1, Math.floor(width / 2));
        const newHeight = Math.max(1, Math.floor(height / 2));
        const newData = new Uint8ClampedArray(newWidth * newHeight * 4);

        // 2x2块平均算法
        for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
                const srcX = x * 2;
                const srcY = y * 2;

                let r = 0, g = 0, b = 0, a = 0;
                let count = 0;

                // 采样2x2区域
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        const sx = srcX + dx;
                        const sy = srcY + dy;

                        if (sx < width && sy < height) {
                            const idx = (sy * width + sx) * 4;
                            r += data[idx];
                            g += data[idx + 1];
                            b += data[idx + 2];
                            a += data[idx + 3];
                            count++;
                        }
                    }
                }

                // 计算平均值
                const dstIdx = (y * newWidth + x) * 4;
                newData[dstIdx] = r / count;
                newData[dstIdx + 1] = g / count;
                newData[dstIdx + 2] = b / count;
                newData[dstIdx + 3] = a / count;
            }
        }

        return new ImageData(newData, newWidth, newHeight);
    }
}
```

**Mipmap采样配置**:
```typescript
const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear-mipmap-linear', // 使用Mipmap
    mipmapFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    maxAnisotropy: 16 // 各向异性过滤
});
```

### 3. Texture Wrapping Demo - 纹理包裹模式

**目标**: 展示不同的纹理包裹模式效果

**技术要点**:
- 四种包裹模式：repeat, mirror-repeat, clamp-to-edge, mirror-clamp-to-edge
- UV坐标范围处理
- 边界效果展示
- 实时切换和对比

**包裹模式实现**:
```typescript
enum WrapMode {
    Repeat = 'repeat',
    MirrorRepeat = 'mirror-repeat',
    ClampToEdge = 'clamp-to-edge',
    MirrorClampToEdge = 'mirror-clamp-to-edge'
}

class TextureWrappingDemo {
    private samplers: Map<WrapMode, RHISampler> = new Map();

    createSamplers(device: RHIDevice): void {
        const modes = [
            WrapMode.Repeat,
            WrapMode.MirrorRepeat,
            WrapMode.ClampToEdge,
            WrapMode.MirrorClampToEdge
        ];

        for (const mode of modes) {
            const sampler = device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: mode,
                addressModeV: mode
            });
            this.samplers.set(mode, sampler);
        }
    }

    renderWithMode(renderPass: RHIRenderPass, mode: WrapMode): void {
        const sampler = this.samplers.get(mode);
        renderPass.setBindGroup(0, this.createBindGroup(sampler));
        renderPass.draw(6); // 渲染四边形
    }
}
```

**着色器中的包裹处理**:
```glsl
// 手动实现包裹模式（用于演示）
vec2 applyWrapMode(vec2 uv, float mode) {
    if (mode == 0.0) {
        // Repeat
        return fract(uv);
    } else if (mode == 1.0) {
        // Mirror Repeat
        vec2 fracted = fract(uv);
        vec2 floored = floor(uv);
        return mix(fracted, 1.0 - fracted, mod(floored, 2.0));
    } else if (mode == 2.0) {
        // Clamp to Edge
        return clamp(uv, 0.0, 1.0);
    }
    return uv;
}
```

### 4. Texture Filtering Demo - 纹理过滤

**目标**: 展示不同纹理过滤算法的视觉效果

**技术要点**:
- 最近邻过滤 vs 线性过滤
- 各向异性过滤
- 过滤质量与性能平衡
- 放大/缩小不同行为

**过滤模式实现**:
```typescript
interface FilterConfig {
    magFilter: 'nearest' | 'linear';
    minFilter: 'nearest' | 'linear' | 'linear-mipmap-linear';
    mipmapFilter: 'nearest' | 'linear';
    maxAnisotropy: number;
}

class TextureFilteringDemo {
    private configs: FilterConfig[] = [
        {
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
            maxAnisotropy: 1
        },
        {
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            maxAnisotropy: 1
        },
        {
            magFilter: 'linear',
            minFilter: 'linear-mipmap-linear',
            mipmapFilter: 'linear',
            maxAnisotropy: 16
        }
    ];

    createSamplers(device: RHIDevice): RHISampler[] {
        return this.configs.map(config =>
            device.createSampler(config)
        );
    }
}
```

**各向异性过滤效果**:
```typescript
// 创建测试纹理（用于展示各向异性过滤效果）
private createTestTexture(device: RHIDevice): RHITexture2D {
    const size = 256;
    const data = new Uint8Array(size * size * 4);

    // 创建倾斜线条图案
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;

            // 创建对角线条纹
            const line = (x + y) % 8 < 4;

            data[idx] = line ? 255 : 0;     // R
            data[idx + 1] = line ? 255 : 0; // G
            data[idx + 2] = line ? 255 : 0; // B
            data[idx + 3] = 255;             // A
        }
    }

    return device.createTexture({
        size: [size, size],
        format: 'rgba8unorm',
        usage: 'texture-binding' | 'copy-dst'
    });
}
```

### 5. Multi-Texture Demo - 多纹理混合

**目标**: 展示多纹理混合技术

**技术要点**:
- 多纹理单元管理
- 纹理混合模式
- 纹理坐标变换
- 纹理合成效果

**多纹理实现**:
```typescript
class MultiTextureDemo {
    private textures: RHITexture2D[] = [];
    private samplers: RHISampler[] = [];

    async loadTextures(urls: string[]): Promise<void> {
        // 并行加载多个纹理
        const loadPromises = urls.map(url => this.loadTexture(url));
        this.textures = await Promise.all(loadPromises);

        // 为每个纹理创建采样器
        this.samplers = this.textures.map(() =>
            this.device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: 'repeat',
                addressModeV: 'repeat'
            })
        );
    }

    createBindGroup(): RHIBindGroup {
        return this.device.createBindGroup({
            layout: this.getBindGroupLayout(),
            entries: [
                {
                    binding: 0,
                    resource: this.samplers[0]
                },
                {
                    binding: 1,
                    resource: this.textures[0].createView()
                },
                {
                    binding: 2,
                    resource: this.samplers[1]
                },
                {
                    binding: 3,
                    resource: this.textures[1].createView()
                }
            ]
        });
    }
}
```

**多纹理着色器**:
```glsl
// 片元着色器
precision mediump float;

uniform sampler2D uTexture0;
uniform sampler2D uTexture1;
uniform float uBlendFactor;
uniform vec2 uTexCoord1; // 第二个纹理的坐标变换参数

varying vec2 vTexCoord;

// 混合模式枚举
#define BLEND_ADD 0
#define BLEND_MULTIPLY 1
#define BLEND_SCREEN 2
#define BLEND_OVERLAY 3

uniform int uBlendMode;

vec4 blendColors(vec4 color1, vec4 color2, float factor) {
    switch (uBlendMode) {
        case BLEND_ADD:
            return mix(color1, color1 + color2, factor);

        case BLEND_MULTIPLY:
            return mix(color1, color1 * color2, factor);

        case BLEND_SCREEN:
            return mix(color1, vec4(1.0) - (vec4(1.0) - color1) * (vec4(1.0) - color2), factor);

        case BLEND_OVERLAY:
            return mix(color1,
                mix(color1 * color2 * 2.0,
                    vec4(1.0) - (vec4(1.0) - color1) * (vec4(1.0) - color2) * 2.0,
                    step(color1, vec4(0.5))), factor);

        default:
            return mix(color1, color2, factor);
    }
}

void main() {
    vec4 color0 = texture2D(uTexture0, vTexCoord);
    vec4 color1 = texture2D(uTexture1, vTexCoord * uTexCoord1);

    gl_FragColor = blendColors(color0, color1, uBlendFactor);
}
```

## 🔧 纹理工具库

### TextureLoader - 纹理加载器

**功能**: 统一的纹理加载接口

```typescript
export class TextureLoader {
    static async load(url: string, options: TextureLoadOptions = {}): Promise<RHITexture2D> {
        const {
            flipY = true,
            generateMipmaps = false,
            premultiplyAlpha = false,
            format = 'rgba8unorm'
        } = options;

        const image = await this.loadImage(url);

        // 预处理图片数据
        const imageData = this.preprocessImage(image, flipY, premultiplyAlpha);

        // 创建纹理
        const texture = device.createTexture({
            size: [image.width, image.height],
            format,
            usage: 'texture-binding' | 'copy-dst'
        });

        // 复制数据
        device.queue.writeTexture(
            { texture },
            imageData,
            { bytesPerRow: image.width * 4 },
            [image.width, image.height]
        );

        // 生成Mipmap
        if (generateMipmaps) {
            MipmapGenerator.generateMipmaps(device, texture, imageData);
        }

        return texture;
    }

    static async loadAll(urls: string[], options: TextureLoadOptions = {}): Promise<RHITexture2D[]> {
        const loadPromises = urls.map(url => this.load(url, options));
        return Promise.all(loadPromises);
    }

    private static async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous'; // 支持跨域图片
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            image.src = url;
        });
    }

    private static preprocessImage(
        image: HTMLImageElement,
        flipY: boolean,
        premultiplyAlpha: boolean
    ): ImageData {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext('2d')!;

        // 应用Y轴翻转
        if (flipY) {
            ctx.save();
            ctx.scale(1, -1);
            ctx.drawImage(image, 0, -image.height);
            ctx.restore();
        } else {
            ctx.drawImage(image, 0, 0);
        }

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // 应用Alpha预乘
        if (premultiplyAlpha) {
            imageData = this.premultiplyAlpha(imageData);
        }

        return imageData;
    }

    private static premultiplyAlpha(imageData: ImageData): ImageData {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3] / 255;
            data[i] *= alpha;     // R
            data[i + 1] *= alpha; // G
            data[i + 2] *= alpha; // B
            // A保持不变
        }
        return imageData;
    }
}
```

### CubemapGenerator - 立方体贴图生成器

**功能**: 生成各种类型的立方体贴图

```typescript
export class CubemapGenerator {
    static skyGradient(config: SkyGradientConfig): RHITextureCube {
        const {
            topColor = [135, 206, 250, 255],
            horizonColor = [176, 196, 222, 255],
            bottomColor = [139, 69, 19, 255],
            size = 256
        } = config;

        const faces: ImageData[] = [];

        // 生成立方体贴图的6个面
        for (let face = 0; face < 6; face++) {
            const imageData = new ImageData(size, size);
            const data = imageData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const idx = (y * size + x) * 4;

                    // 根据Y坐标计算渐变
                    const t = y / (size - 1);
                    let color: number[];

                    if (t < 0.5) {
                        // 顶部到中间
                        const localT = t * 2;
                        color = this.interpolateColor(topColor, horizonColor, localT);
                    } else {
                        // 中间到底部
                        const localT = (t - 0.5) * 2;
                        color = this.interpolateColor(horizonColor, bottomColor, localT);
                    }

                    // 根据面的朝向调整颜色
                    const adjustedColor = this.adjustColorForFace(color, face);

                    data[idx] = adjustedColor[0];
                    data[idx + 1] = adjustedColor[1];
                    data[idx + 2] = adjustedColor[2];
                    data[idx + 3] = adjustedColor[3];
                }
            }

            faces.push(imageData);
        }

        return this.createCubeTextureFromFaces(faces);
    }

    static fromEquirectangular(url: string, size: number = 512): Promise<RHITextureCube> {
        return new Promise(async (resolve, reject) => {
            try {
                // 加载全景图
                const image = await this.loadImage(url);

                // 创建canvas进行转换
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;

                // 生成立方体贴图的6个面
                const faces: ImageData[] = [];

                for (let face = 0; face < 6; face++) {
                    canvas.width = size;
                    canvas.height = size;

                    // 根据面的角度设置变换矩阵
                    this.setupCubeFaceTransform(ctx, face, image.width, image.height);
                    ctx.drawImage(image, 0, 0);

                    faces.push(ctx.getImageData(0, 0, size, size));
                }

                const cubeTexture = this.createCubeTextureFromFaces(faces);
                resolve(cubeTexture);

            } catch (error) {
                reject(error);
            }
        });
    }

    private static setupCubeFaceTransform(
        ctx: CanvasRenderingContext2D,
        face: number,
        sourceWidth: number,
        sourceHeight: number
    ): void {
        const { width, height } = ctx.canvas;

        ctx.save();

        // 设置投影和变换
        ctx.scale(width / Math.PI, height / (Math.PI / 2));

        switch (face) {
            case 0: // +X (右)
                ctx.translate(0, Math.PI / 2);
                ctx.rotate(Math.PI / 2);
                break;
            case 1: // -X (左)
                ctx.translate(Math.PI, Math.PI / 2);
                ctx.rotate(-Math.PI / 2);
                break;
            case 2: // +Y (上)
                ctx.translate(Math.PI / 2, 0);
                ctx.rotate(Math.PI);
                break;
            case 3: // -Y (下)
                ctx.translate(Math.PI / 2, Math.PI);
                break;
            case 4: // +Z (前)
                ctx.translate(Math.PI / 2, Math.PI / 2);
                break;
            case 5: // -Z (后)
                ctx.translate(Math.PI * 1.5, Math.PI / 2);
                break;
        }

        // 设置源图像变换
        ctx.scale(sourceWidth / (2 * Math.PI), sourceHeight / Math.PI);
        ctx.translate(-Math.PI, -Math.PI / 2);

        ctx.restore();
    }

    private static interpolateColor(color1: number[], color2: number[], t: number): number[] {
        return color1.map((c1, i) => Math.round(c1 + (color2[i] - c1) * t));
    }

    private static adjustColorForFace(color: number[], face: number): number[] {
        // 根据面的朝向微调颜色强度
        const intensity = [1.0, 0.95, 0.9, 1.1, 1.05, 1.0][face];
        return color.map(c => Math.min(255, Math.round(c * intensity)));
    }

    private static createCubeTextureFromFaces(faces: ImageData[]): RHITextureCube {
        const size = faces[0].width;

        const texture = device.createTexture({
            size: [size, size, 6],
            format: 'rgba8unorm',
            usage: 'texture-binding' | 'copy-dst'
        });

        // 写入每个面的数据
        faces.forEach((face, index) => {
            device.queue.writeTexture(
                {
                    texture,
                    origin: [0, 0, index],
                    aspect: 'all'
                },
                face,
                { bytesPerRow: size * 4 },
                [size, size]
            );
        });

        return texture;
    }
}
```

## 🎯 纹理性能优化

### 1. 纹理压缩

```typescript
// 支持压缩纹理格式
const compressedFormats = [
    'bc1-rgba-unorm',     // DXT1
    'bc3-rgba-unorm',     // DXT5
    'etc2-rgba8unorm',    // ETC2
    'astc-4x4-unorm'      // ASTC
];

// 自动选择最佳压缩格式
function selectOptimalFormat(device: RHIDevice): GPUTextureFormat {
    for (const format of compressedFormats) {
        if (device.features.has(format)) {
            return format;
        }
    }
    return 'rgba8unorm'; // 降级到未压缩格式
}
```

### 2. 纹理图集

```typescript
class TextureAtlas {
    private textures: Map<string, AtlasRegion> = new Map();
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(maxSize: number = 2048) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = maxSize;
        this.canvas.height = maxSize;
        this.ctx = this.canvas.getContext('2d')!;
    }

    addTexture(name: string, image: HTMLImageElement): AtlasRegion {
        // 找到合适的位置
        const region = this.findFreeRegion(image.width, image.height);

        // 绘制到图集
        this.ctx.drawImage(image, region.x, region.y);

        // 记录区域信息
        this.textures.set(name, region);

        return region;
    }

    createAtlasTexture(): RHITexture2D {
        return device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'rgba8unorm',
            usage: 'texture-binding' | 'copy-dst'
        });
    }
}

interface AtlasRegion {
    x: number;
    y: number;
    width: number;
    height: number;
    uv: [number, number, number, number]; // [u1, v1, u2, v2]
}
```

### 3. 纹理流式加载

```typescript
class StreamingTextureLoader {
    private loadQueue: TextureLoadRequest[] = [];
    private maxConcurrentLoads = 4;
    private currentLoads = 0;

    async loadTexturePriority(request: TextureLoadRequest): Promise<RHITexture2D> {
        return new Promise((resolve, reject) => {
            request.resolve = resolve;
            request.reject = reject;
            this.loadQueue.push(request);
            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.currentLoads >= this.maxConcurrentLoads || this.loadQueue.length === 0) {
            return;
        }

        const request = this.loadQueue.shift()!;
        this.currentLoads++;

        try {
            // 按优先级加载
            const texture = await this.loadTexture(request.url, request.options);
            request.resolve!(texture);
        } catch (error) {
            request.reject!(error);
        } finally {
            this.currentLoads--;
            this.processQueue(); // 处理下一个请求
        }
    }
}

interface TextureLoadRequest {
    url: string;
    priority: number;
    options?: TextureLoadOptions;
    resolve?: (texture: RHITexture2D) => void;
    reject?: (error: Error) => void;
}
```

## 🐛 常见问题

### Q: 纹理显示为黑色怎么办？

A: 排查步骤：
1. 检查纹理是否成功加载（查看Network面板）
2. 验证纹理格式是否支持
3. 确认采样器配置正确
4. 检查UV坐标范围是否在[0,1]内

### Q: Mipmap生成失败怎么办？

A: 常见原因：
- 纹理尺寸不是2的幂次方
- 格式不支持Mipmap
- 内存不足

### Q: 纹理内存占用过高怎么办？

A: 优化策略：
- 使用纹理压缩格式
- 实现纹理图集
- 启用纹理流式加载
- 动态调整纹理质量

## 🔗 相关资源

### 学习资源
- [WebGL Textures - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL)
- [Texture Mapping Fundamentals](https://learnopengl.com/Getting-started/Textures)
- [OpenGL Texture Wrapping](https://www.khronos.org/opengl/wiki/Texture#Wrapping)

### 代码示例
- [Texture Demo源码](../../packages/rhi/demo/src/textures/)
- [TextureLoader实现](../../packages/rhi/demo/src/utils/texture/TextureLoader.ts)
- [CubemapGenerator](../../packages/rhi/demo/src/utils/texture/CubemapGenerator.ts)

### 下一步学习
- [高级渲染开发](./demo-development-advanced.md) - 第四层高级渲染
- [PBR材质系统](../reference/pbr-material-system.md) - 基于物理的渲染

---

**注意**: 纹理系统是3D渲染中的核心组件，正确的纹理管理对性能和视觉质量都有重要影响。建议仔细理解每个Demo的技术要点，并在实际项目中灵活应用。