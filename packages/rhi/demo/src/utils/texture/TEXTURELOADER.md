# TextureLoader - 纹理加载器

纹理加载器模块提供完整的图片加载、处理和转换功能。

## 功能特性

- **异步图片加载**：支持从 URL/路径加载 PNG/JPG/WebP 等格式
- **批量加载**：支持一次加载多张图片
- **Mipmap 生成**：自动生成完整的 Mipmap 链（双线性插值）
- **Y 轴翻转**：自动处理 WebGL 坐标系差异
- **预乘 Alpha**：支持 Alpha 预乘处理
- **灵活格式**：支持自定义目标纹理格式

## API 文档

### TextureLoader.load(url, options)

从 URL 异步加载单张图片。

```typescript
const texture = await TextureLoader.load('path/to/image.jpg', {
  flipY: true,
  generateMipmaps: true,
});

console.log(`宽度: ${texture.width}, 高度: ${texture.height}`);
console.log(`数据大小: ${texture.data.byteLength} 字节`);
```

**参数**：
- `url: string` - 图片 URL 或相对路径
- `options: TextureLoadOptions` - 加载选项（可选）

**返回**: `Promise<LoadedTexture>` - 已加载的纹理数据

### TextureLoader.loadAll(urls, options)

批量加载多张图片。

```typescript
const textures = await TextureLoader.loadAll([
  'image1.jpg',
  'image2.jpg',
  'image3.jpg',
]);

textures.forEach((texture, index) => {
  console.log(`图片 ${index + 1}: ${texture.width}x${texture.height}`);
});
```

**参数**：
- `urls: string[]` - 图片 URL 数组
- `options: TextureLoadOptions` - 加载选项（可选）

**返回**: `Promise<LoadedTexture[]>` - 已加载的纹理数据数组

### TextureLoader.fromImage(image, options)

从 HTMLImageElement 创建纹理数据。

```typescript
const img = new Image();
img.src = 'texture.jpg';
img.onload = () => {
  const texture = TextureLoader.fromImage(img, {
    flipY: true,
    generateMipmaps: false,
  });
};
```

**参数**：
- `image: HTMLImageElement` - 已加载的图片元素
- `options: TextureLoadOptions` - 加载选项（可选）

**返回**: `LoadedTexture` - 纹理数据

### TextureLoader.fromImageData(imageData, options)

从 ImageData 创建纹理数据。

```typescript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
// 绘制内容到 canvas...
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

const texture = TextureLoader.fromImageData(imageData);
```

**参数**：
- `imageData: ImageData` - Canvas ImageData 对象
- `options: TextureLoadOptions` - 加载选项（可选）

**返回**: `LoadedTexture` - 纹理数据

### TextureLoader.generateMipmaps(data, width, height)

手动生成 Mipmap 链。

```typescript
const data = new Uint8Array(256 * 256 * 4);
// 填充纹理数据...

const mipmaps = TextureLoader.generateMipmaps(data, 256, 256);
console.log(`生成了 ${mipmaps.length} 级 Mipmap`);
```

**参数**：
- `data: Uint8Array` - RGBA 像素数据
- `width: number` - 纹理宽度
- `height: number` - 纹理高度

**返回**: `Uint8Array[]` - Mipmap 数据数组（不包含原始纹理）

### TextureLoader.isCompressedFormat(url)

检测是否为压缩纹理格式（KTX/DDS）。

```typescript
if (TextureLoader.isCompressedFormat('texture.ktx')) {
  console.log('这是一个压缩纹理');
}
```

**参数**：
- `url: string` - 文件 URL

**返回**: `boolean` - 是否为压缩格式

## 选项类型

### TextureLoadOptions

```typescript
interface TextureLoadOptions {
  /** 是否翻转 Y 轴（默认 true） */
  flipY?: boolean;

  /** 是否生成 Mipmap（默认 false） */
  generateMipmaps?: boolean;

  /** 是否预乘 Alpha（默认 false） */
  premultiplyAlpha?: boolean;

  /** 目标纹理格式（默认 'rgba8-unorm'） */
  format?: string;
}
```

### LoadedTexture

```typescript
interface LoadedTexture {
  /** 纹理宽度 */
  width: number;

  /** 纹理高度 */
  height: number;

  /** 像素数据 (RGBA) */
  data: Uint8Array;

  /** Mipmap 链（如果已生成） */
  mipmaps?: Uint8Array[];

  /** 纹理格式 */
  format: string;
}
```

## 使用示例

### 基础加载

```typescript
import { TextureLoader } from './utils/texture';

// 加载纹理
const texture = await TextureLoader.load('assets/texture.jpg', {
  flipY: true,
});

// 创建 RHI 纹理
const rhiTexture = device.createTexture({
  width: texture.width,
  height: texture.height,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.TEXTURE_BINDING | RHITextureUsage.COPY_DST,
  initialData: texture.data,
});
```

### 带 Mipmap 的加载

```typescript
const texture = await TextureLoader.load('assets/texture.jpg', {
  flipY: true,
  generateMipmaps: true,
});

// Mipmap 数据可用于：
if (texture.mipmaps) {
  const mipTexture = device.createTexture({
    width: texture.width,
    height: texture.height,
    format: RHITextureFormat.RGBA8_UNORM,
    mipLevelCount: texture.mipmaps.length + 1,
    initialData: texture.data,
  });
}
```

### 批量加载

```typescript
const textureUrls = [
  'assets/diffuse.jpg',
  'assets/normal.jpg',
  'assets/roughness.jpg',
];

const textures = await TextureLoader.loadAll(textureUrls, {
  flipY: true,
  generateMipmaps: false,
});

const [diffuseTexture, normalTexture, roughnessTexture] = textures;
```

### 预乘 Alpha

```typescript
const texture = await TextureLoader.load('assets/transparent.png', {
  flipY: true,
  premultiplyAlpha: true, // 用于正确的透明度混合
});
```

## 实现细节

### Y 轴翻转

WebGL 的纹理坐标系中，Y 轴指向上方，而图片数据通常以从上到下的行存储。`flipY` 选项会自动处理这个差异。

### Mipmap 生成

Mipmap 使用双线性插值生成，逐级缩小纹理到 1x1。每级大小是前一级的一半（向下取整）。

### 双线性插值

采样算法使用双线性插值确保平滑的缩小过程，提高 Mipmap 质量。

### 预乘 Alpha

预乘 Alpha 处理将 RGB 值乘以 Alpha 值，用于正确的透明度混合：
```
R_premultiplied = R * (A / 255)
G_premultiplied = G * (A / 255)
B_premultiplied = B * (A / 255)
```

## 浏览器兼容性

- 现代浏览器（Chrome, Firefox, Safari, Edge）
- 需要 Canvas 2D API 支持
- 跨域加载需要 CORS 配置

## 性能考虑

- 大纹理加载会阻塞主线程，考虑使用 Web Worker
- Mipmap 生成涉及多次缩放操作，较大纹理可能耗时
- 批量加载时使用 `Promise.all()` 实现并行加载

## 错误处理

```typescript
try {
  const texture = await TextureLoader.load('image.jpg');
} catch (error) {
  console.error('纹理加载失败:', error.message);
}
```

常见错误：
- `无法加载图片` - URL 不存在或 CORS 问题
- `无法获取 Canvas 2D 上下文` - 浏览器不支持
