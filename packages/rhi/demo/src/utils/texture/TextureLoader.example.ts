/**
 * texture/TextureLoader.example.ts
 * TextureLoader 使用示例
 */

import { TextureLoader } from './TextureLoader';

/**
 * 示例 1: 基础图片加载
 */
export async function example1_basicLoad() {
  // 从 URL 加载纹理
  const _texture = await TextureLoader.load('assets/texture.jpg', {
    flipY: true,
  });

  // 输出: 加载完成和大小信息
  // 在实际应用中，可以使用 logger 或回调函数
}

/**
 * 示例 2: 带 Mipmap 的加载
 */
export async function example2_mipmapLoad() {
  const texture = await TextureLoader.load('assets/texture.jpg', {
    flipY: true,
    generateMipmaps: true,
  });

  // 输出: 原始大小和 Mipmap 层级信息
  // 在实际应用中，可以使用 logger 或回调函数

  // 列出每个 Mipmap 的大小
  texture.mipmaps?.forEach((_mipmap, _index) => {
    // 这里可以处理每个 mipmap 层级的数据
    // 如果需要，可以计算每个层级的尺寸
  });
}

/**
 * 示例 3: 批量加载纹理
 */
export async function example3_batchLoad() {
  const urls = ['assets/diffuse.jpg', 'assets/normal.jpg', 'assets/metallic.jpg'];

  const textures = await TextureLoader.loadAll(urls, {
    flipY: true,
    generateMipmaps: false,
  });

  // 输出: 成功加载的纹理数量和每个纹理的大小
  // 在实际应用中，可以使用 logger 或回调函数
  textures.forEach((texture, i) => {
    // 这里可以处理每个加载的纹理
  });
}

/**
 * 示例 4: 处理透明纹理
 */
export async function example4_transparentTexture() {
  const _texture = await TextureLoader.load('assets/transparent.png', {
    flipY: true,
    premultiplyAlpha: true, // 预乘 Alpha
    generateMipmaps: true,
  });

  // 透明纹理加载完成，Alpha 预乘已启用
  // 在实际应用中，可以使用 logger 或回调函数
}

/**
 * 示例 5: 从 Canvas 创建纹理
 */
export async function example5_canvasToTexture() {
  // 创建 Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  // 绘制渐变
  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, 'red');
  gradient.addColorStop(1, 'blue');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  // 获取 ImageData
  const imageData = ctx.getImageData(0, 0, 256, 256);

  // 转换为纹理
  const _texture = TextureLoader.fromImageData(imageData, {
    flipY: true,
    generateMipmaps: true,
  });

  // 从 Canvas 创建纹理完成
  // 在实际应用中，可以使用 logger 或回调函数输出纹理信息
}

/**
 * 示例 6: 检测压缩纹理格式
 */
export function example6_detectCompressed() {
  const formats = ['texture.jpg', 'texture.ktx', 'texture.ktx2', 'texture.dds'];

  formats.forEach((url) => {
    const _isCompressed = TextureLoader.isCompressedFormat(url);
    // 这里可以记录或处理每个格式的压缩检测结果
    // 在实际应用中，可以使用 logger 或回调函数
  });
}

/**
 * 示例 7: 集成到 RHI 设备
 */
export async function example7_rhiIntegration(device: any) {
  // 加载纹理
  const texture = await TextureLoader.load('assets/texture.jpg', {
    flipY: true,
    generateMipmaps: true,
  });

  // 创建 RHI 纹理对象
  // 注意: 实际使用需要导入 RHI 类型
  const rhiTexture = device.createTexture({
    width: texture.width,
    height: texture.height,
    format: 'rgba8-unorm', // RHITextureFormat.RGBA8_UNORM
    usage: 'texture-binding', // RHITextureUsage.TEXTURE_BINDING
    mipLevelCount: (texture.mipmaps?.length ?? 0) + 1,
    initialData: texture.data,
  });

  // RHI 纹理创建成功
  // 在实际应用中，可以使用 logger 或回调函数输出创建状态

  return rhiTexture;
}

/**
 * 示例 8: 错误处理
 */
export async function example8_errorHandling() {
  try {
    // 尝试加载不存在的纹理
    const _texture = await TextureLoader.load('assets/nonexistent.jpg');
    // 加载完成，这里可以处理纹理
  } catch (ignore) {
    // 在实际应用中，应该使用适当的错误处理机制
    // 例如：logger.error('纹理加载失败:', error.message)
    // 或者将错误传递给上层处理
  }
}

/**
 * 示例 9: 性能测试
 */
export async function example9_performanceTest() {
  const startTime = performance.now();

  const _texture = await TextureLoader.load('assets/large-texture.jpg', {
    flipY: true,
    generateMipmaps: true,
    premultiplyAlpha: false,
  });

  const endTime = performance.now();
  const _duration = endTime - startTime;

  // 性能测试完成，可以记录加载时间和纹理信息
  // 在实际应用中，可以使用 logger 或性能监控工具
  // 例如：logger.info(`加载时间: ${duration.toFixed(2)}ms`)
  // 例如：logger.info(`总大小: ${(texture.data.byteLength / 1024 / 1024).toFixed(2)} MB`)
  // 例如：logger.info(`Mipmap 层级: ${texture.mipmaps?.length ?? 0}`)
}
