# Compressed Texture Demo 实现参考

## 概述

compressed-texture 是 RHI Demo 系统第二层（纹理系统）的第五个演示，展示各种压缩纹理格式的检测、加载和使用，以及压缩纹理在内存优化方面的优势。

## 功能演示

- **压缩格式检测**：自动检测设备支持的压缩纹理格式（S3TC/DXT、ETC2、ASTC、PVRTC、BPTC）
- **格式对比展示**：同时展示多种压缩格式的视觉效果和质量差异
- **内存使用对比**：实时显示压缩纹理相对于未压缩纹理的内存节省量
- **交互式选择**：支持单独查看某个压缩格式的详细效果
- **平台适配说明**：展示不同压缩格式的适用平台

## 核心技术点

### 1. 压缩格式信息定义

```typescript
const compressionFormats = [
  {
    id: 'BC1_RGBA_UNORM',
    name: 'BC1 (DXT1)',
    compression: '4:1',
    quality: 'Medium',
    platforms: 'Desktop (AMD/Intel/NVIDIA)',
    size: 512,
  },
  {
    id: 'BC3_RGBA_UNORM',
    name: 'BC3 (DXT5)',
    compression: '4:1',
    quality: 'High',
    platforms: 'Desktop (AMD/Intel/NVIDIA)',
    size: 512,
  },
  {
    id: 'BC7_RGBA_UNORM',
    name: 'BC7',
    compression: '6:1',
    quality: 'Very High',
    platforms: 'Desktop (DX11+)',
    size: 512,
  },
  {
    id: 'ETC2_RGB8_UNORM',
    name: 'ETC2 RGB8',
    compression: '4:1',
    quality: 'High',
    platforms: 'Mobile (Android/OpenGL ES 3.0)',
    size: 512,
  },
  {
    id: 'ASTC_4x4_RGBA',
    name: 'ASTC 4x4',
    compression: '8:1',
    quality: 'Very High',
    platforms: 'Mobile (iOS/Android)',
    size: 512,
  },
];
```

### 2. 压缩格式检测实现

```typescript
// 检测 WebGL 支持的压缩格式
function detectCompressionSupport(gl: WebGL2RenderingContext) {
  const extensions = {
    s3tc: gl.getExtension('WEBGL_compressed_texture_s3tc'),
    s3tc_srgb: gl.getExtension('WEBGL_compressed_texture_s3tc_srgb'),
    etc2: gl.getExtension('WEBGL_compressed_texture_etc'),
    etc2_eac: gl.getExtension('WEBGL_compressed_texture_etc1'),
    astc: gl.getExtension('WEBGL_compressed_texture_astc'),
    pvrtc: gl.getExtension('WEBGL_compressed_texture_pvrtc'),
    bptc: gl.getExtension('EXT_texture_compression_bptc'),
  };

  return {
    // S3TC (DXT) 桌面端标准
    BC1: !!extensions.s3tc,
    BC3: !!extensions.s3tc,
    BC5: !!extensions.s3tc,

    // ETC2 移动端标准
    ETC2_RGB8: !!extensions.etc2,
    ETC2_RGBA8: !!extensions.etc2,

    // ASTC 通用格式
    ASTC_4x4: !!extensions.astc,
    ASTC_8x8: !!extensions.astc,

    // PVRTC iOS 专属
    PVRTC1_4bpp: !!extensions.pvrtc,
    PVRTC1_2bpp: !!extensions.pvrtc,

    // BPTC 高端格式
    BC7: !!extensions.bptc,
  };
}
```

### 3. 压缩纹理创建

```typescript
// 为每种压缩格式创建纹理
const textures: MSpec.IRHITexture[] = [];
const formatSupport: boolean[] = [];

for (const format of compressionFormats) {
  // 检查格式支持
  const supported = runner.device.features.hasTextureFormat(format.id);

  formatSupport.push(supported);

  if (supported) {
    // 创建压缩纹理
    const texture = runner.device.createTexture({
      width: format.size,
      height: format.size,
      format: MSpec.RHITextureFormat[format.id],
      usage: MSpec.RHITextureUsage.TEXTURE_BINDING | MSpec.RHITextureUsage.COPY_DST,
      mipLevelCount: 1,
      label: `${format.name} Texture`,
    });

    // 加载压缩数据（实际项目中应从 .dds/.ktx/.astc 等文件加载）
    const compressedData = loadCompressedTextureData(format.id);
    texture.update(compressedData);

    textures.push(texture);
  } else {
    // 使用 RGBA 纹理作为占位符
    textures.push(createPlaceholderTexture(format));
  }
}
```

### 4. 内存使用计算

```typescript
// 计算压缩纹理的内存使用
function calculateMemoryUsage(format: CompressionFormat, size: number) {
  const pixels = size * size;

  // 未压缩 RGBA8 的内存
  const uncompressedSize = pixels * 4; // 4 bytes per pixel

  // 根据压缩格式计算实际大小
  let compressedSize = uncompressedSize;

  if (format.id.includes('BC1') || format.id.includes('DXT1')) {
    // BC1/DXT1: 8 bytes per 4x4 block
    compressedSize = Math.ceil(size / 4) * Math.ceil(size / 4) * 8;
  } else if (format.id.includes('BC3') || format.id.includes('DXT5') || format.id.includes('ETC2')) {
    // BC3/DXT5/ETC2: 16 bytes per 4x4 block
    compressedSize = Math.ceil(size / 4) * Math.ceil(size / 4) * 16;
  } else if (format.id.includes('ASTC')) {
    // ASTC: 16 bytes per block regardless of block size
    const blockSize = getASTCBlockSize(format.id); // e.g., 4x4, 8x8
    compressedSize = Math.ceil(size / blockSize.width) * Math.ceil(size / blockSize.height) * 16;
  }

  return {
    uncompressed: uncompressedSize,
    compressed: compressedSize,
    ratio: uncompressedSize / compressedSize,
    saved: uncompressedSize - compressedSize,
  };
}
```

### 5. 着色器实现

**顶点着色器**：

```glsl
#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec2 vTexCoord;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
  vTexCoord = aTexCoord;
}
```

**片段着色器**：

```glsl
#version 300 es
precision mediump float;

uniform sampler2D uTexture;
uniform float uSelected;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec4 color = texture(uTexture, vTexCoord);

  // 如果不是选中的纹理，添加灰度效果
  if (uSelected < 0.5) {
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(color.rgb, vec3(gray), 0.7);
  }

  // 添加边框
  vec2 border = smoothstep(vec2(0.0), vec2(0.02), vTexCoord) *
               smoothstep(vec2(1.0), vec2(0.98), vTexCoord);
  color.rgb *= border.x * border.y;

  fragColor = color;
}
```

### 6. 渲染布局管理

```typescript
// 更新选择状态
function updateSelection() {
  for (let i = 0; i < selectedStates.length; i++) {
    selectedStates[i] = (selectedIndex === -1 || selectedIndex === i) ? 1.0 : 0.0;
  }
}

// 渲染循环中的布局计算
if (selectedIndex === -1) {
  // 显示所有格式 - 网格布局
  const cols = 3;
  const rows = Math.ceil(textures.length / cols);
  const spacing = 1.5;
  const scale = 0.8;

  for (let i = 0; i < textures.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = (col - cols / 2 + 0.5) * spacing;
    const y = (rows / 2 - row - 0.5) * spacing;

    modelMatrix.identity();
    modelMatrix.translate(new MMath.Vector3(x, y, 0));
    modelMatrix.scale(new MMath.Vector3(scale, scale, 1));

    // 渲染当前纹理
    renderTexture(i);
  }
} else {
  // 显示单个格式 - 居中放大
  modelMatrix.identity();
  modelMatrix.scale(new MMath.Vector3(2, 2, 1));
  renderTexture(selectedIndex);
}
```

### 7. GUI 控制实现

```typescript
// 显示模式控制
gui.add('Display Mode', {
  value: 'All Formats',
  options: ['All Formats', 'Single Format'],
  onChange: (value) => {
    selectedIndex = value === 'All Formats' ? -1 : 0;
    updateSelection();
  },
});

// 单个格式选择
if (selectedIndex >= 0) {
  gui.add('Selected Format', {
    value: compressionFormats[0].name,
    options: compressionFormats.map(f => f.name),
    onChange: (value) => {
      selectedIndex = compressionFormats.findIndex(f => f.name === value);
      updateSelection();
    },
  });
}

// 快捷键支持
for (let i = 1; i <= Math.min(textures.length, 9); i++) {
  runner.onKey(i.toString(), () => {
    selectedIndex = i - 1;
    updateSelection();
  });
}

runner.onKey('0', () => {
  selectedIndex = -1;
  updateSelection();
});
```

## 压缩格式详解

### 1. BC1/DXT1 (S3TC)
- **压缩比**：4:1 (8 bits/像素)
- **特性**：RGB 5:6:5，可选 1-bit Alpha
- **平台**：桌面端广泛支持
- **适用**：无 Alpha 或简单 Alpha 的纹理

### 2. BC3/DXT5 (S3TC)
- **压缩比**：4:1 (8 bits/像素)
- **特性**：完整 8-bit Alpha 通道
- **平台**：桌面端广泛支持
- **适用**：需要 Alpha 通道的纹理

### 3. BC7 (BPTC)
- **压缩比**：6:1 (8 bits/像素)
- **特性**：高质量 HDR 支持
- **平台**：DX11+ 硬件
- **适用**：高质量纹理，HDR 内容

### 4. ETC2
- **压缩比**：4:1 (8 bits/像素)
- **特性**：OpenGL ES 3.0 标准格式
- **平台**：Android 设备原生支持
- **适用**：Android 平台通用纹理

### 5. ASTC
- **压缩比**：2:1 到 25:1 可调
- **特性**：块大小灵活 (4x4 到 12x12)
- **平台**：现代移动设备
- **适用**：需要平衡质量和文件大小

### 6. PVRTC
- **压缩比**：4:1 或 8:1
- **特性**：PowerVR GPU 原生格式
- **平台**：iOS 设备
- **适用**：iOS 平台优化

## 内存优化策略

### 1. 格式选择指南

```typescript
function selectOptimalFormat(support: CompressionSupport, platform: Platform) {
  if (platform.isDesktop) {
    // 桌面端优先选择
    if (support.BC7) return 'BC7';      // 最高质量
    if (support.BC3) return 'BC3';      // 带Alpha
    return 'BC1';                       // 基础RGB
  } else if (platform.isAndroid) {
    // Android 优先选择
    if (support.ASTC) return 'ASTC_4x4';  // 通用高质量
    return 'ETC2_RGB8';                    // 原生支持
  } else if (platform.isIOS) {
    // iOS 优先选择
    if (support.ASTC) return 'ASTC_4x4';   // 通用
    return 'PVRTC1_4bpp';                  // 原生支持
  }

  // 兜底使用 RGBA8
  return 'RGBA8_UNORM';
}
```

### 2. Mipmap 内存考虑

```typescript
// 计算包含 Mipmap 的总内存
function calculateMipmapMemory(format: CompressionFormat, size: number) {
  let totalSize = 0;
  let currentSize = size;

  while (currentSize >= 1) {
    totalSize += calculateMemoryUsage(format, currentSize).compressed;
    currentSize = Math.floor(currentSize / 2);
  }

  return totalSize;
}
```

### 3. 压缩纹理加载优化

```typescript
// 异步流式加载压缩纹理
async function loadCompressedTextureStreaming(url: string, format: string) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();

  // 解析压缩纹理文件格式 (.dds/.ktx)
  const parsed = parseCompressedTexture(arrayBuffer);

  // 创建纹理
  const texture = runner.device.createTexture({
    width: parsed.width,
    height: parsed.height,
    format: format,
    usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
    mipLevelCount: parsed.mipLevels,
  });

  // 分块上传以避免阻塞
  for (let level = 0; level < parsed.mipLevels; level++) {
    const mipData = parsed.getMipLevel(level);
    texture.update(mipData, level);

    // 让出控制权避免卡顿
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return texture;
}
```

## 相关文件

- `demo/src/compressed-texture.ts` - 主程序实现
- `demo/html/compressed-texture.html` - HTML 页面和 UI
- `src/webgl/resources/GLTexture.ts` - WebGL 纹理资源管理
- `src/utils/texture/TextureLoader.ts` - 纹理加载工具
- `src/utils/device/CapabilityDetector.ts` - 设备能力检测

## 交互控制

- **1-5 数字键**：切换到对应压缩格式
- **0**：显示所有格式对比
- **ESC**：退出 Demo
- **F11**：切换全屏
- **鼠标左键拖动**：旋转视角
- **鼠标滚轮**：缩放
- **鼠标右键拖动**：平移

## 技术注意事项

1. **格式检测**：必须在使用前检测压缩格式支持，避免运行时错误
2. **块对齐**：压缩纹理的尺寸必须是 4 的倍数（除 PVRTC 某些格式）
3. **Mipmap 限制**：不是所有压缩格式都支持自动 Mipmap 生成
4. **跨平台考虑**：不同平台支持的压缩格式差异很大，需要准备多套资源
5. **质量权衡**：压缩率越高，视觉质量损失越大，需要根据使用场景选择
6. **调试困难**：压缩纹理难以调试，建议在开发阶段使用未压缩纹理

## 性能优化建议

1. **批量检测**：启动时一次性检测所有压缩格式支持
2. **缓存结果**：将格式检测结果缓存避免重复检测
3. **按需加载**：只加载当前平台支持的压缩格式
4. **内存池**：为压缩纹理预分配内存池提高加载速度
5. **异步解码**：使用 Web Worker 解码压缩数据避免阻塞主线程