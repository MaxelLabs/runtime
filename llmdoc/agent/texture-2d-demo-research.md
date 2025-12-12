<!-- This entire block is your raw intelligence report for other agents. It is NOT a final document. -->

### Code Sections (The Evidence)

- `/demo/src/rotating-cube.ts` (程序化纹理使用): 展示了如何使用 ProceduralTexture 生成纹理并在着色器中采样
- `/demo/src/blend-modes.ts` (图片纹理加载): 展示了如何加载外部图片并创建纹理
- `/demo/src/utils/texture/TextureLoader.ts` (纹理加载工具): 提供完整的纹理加载功能
- `/demo/src/utils/shader/ShaderUtils.ts` (着色器工具): 提供 getTextureSamplingSnippet() 等纹理相关代码片段
- `/src/webgl/resources/GLTexture.ts` (RHI纹理实现): IRHITexture 接口的 WebGL 实现
- `/src/webgl/resources/GLSampler.ts` (RHI采样器实现): IRHISampler 接口的 WebGL 实现

### Report (The Answers)

#### result

基于对 RHI Demo 系统的深入调研，以下是开发 texture-2d Demo 的关键发现：

**1. 现有 Demo 实现模式**

- **rotating-cube.ts**: 使用 ProceduralTexture 生成程序化纹理（棋盘格、渐变、UV调试、噪声）
- **blend-modes.ts**: 加载外部图片文件（Caravaggio水果静物画），展示混合模式

**代码结构模式**：
- 使用 DemoRunner 统一管理生命周期
- 必需组件：Stats（性能监控）、OrbitController（相机控制）
- 资源通过 runner.track() 自动管理
- 着色器采用 GLSL 300 es 版本

**2. TextureLoader 工具库**

```typescript
// 基础用法
const texture = await TextureLoader.load('path/to/image.jpg', {
  flipY: true,              // 默认：true（符合WebGL坐标系）
  generateMipmaps: false,   // 默认：false
  premultiplyAlpha: false,  // 默认：false
  format: 'rgba8-unorm'     // 默认：'rgba8-unorm'
});

// 创建RHI纹理
const rhiTexture = device.createTexture({
  width: texture.width,
  height: texture.height,
  format: MSpec.RHITextureFormat.RGBA8_UNORM,
  usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
});
rhiTexture.update(texture.data);
```

**关键方法**：
- `load(url, options)` - 单张图片加载
- `loadAll(urls, options)` - 批量加载
- `fromImage(image, options)` - 从HTMLImageElement创建
- `generateMipmaps(data, width, height)` - 生成Mipmap链
- `isCompressedFormat(url)` - 检测压缩格式

**3. 着色器实现**

**纹理采样着色器代码**：
```glsl
#version 300 es
precision mediump float;

// 顶点着色器传递
in vec2 vTexCoord;

// 纹理uniform
uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  fragColor = texColor;
}
```

**ShaderUtils 提供的代码片段**：
- `getTextureSamplingSnippet()` - 包含基础采样和伽马矫正采样函数
- `basicFragmentShader({ mode: 'texture' })` - 支持纹理模式的基础片段着色器

**4. RHI 纹理 API**

**创建纹理**：
```typescript
const texture = device.createTexture({
  width: 256,
  height: 256,
  format: MSpec.RHITextureFormat.RGBA8_UNORM,
  usage: MSpec.RHITextureUsage.TEXTURE_BINDING,
  label: 'Demo Texture',
});

// 上传数据
texture.update(pixelData);
```

**创建采样器**：
```typescript
const sampler = device.createSampler({
  magFilter: MSpec.RHIFilterMode.LINEAR,
  minFilter: MSpec.RHIFilterMode.LINEAR,
  mipmapFilter: MSpec.RHIFilterMode.LINEAR,
  addressModeU: MSpec.RHIAddressMode.REPEAT,
  addressModeV: MSpec.RHIAddressMode.REPEAT,
  label: 'Demo Sampler',
});
```

**BindGroup 绑定**：
```typescript
const bindGroupLayout = device.createBindGroupLayout([
  {
    binding: 0,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: '2d' },
    name: 'uTexture',
  },
  {
    binding: 1,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSampler',
  }
]);

const bindGroup = device.createBindGroup(bindGroupLayout, [
  { binding: 0, resource: texture.createView() },
  { binding: 1, resource: sampler },
]);
```

#### conclusions

- **TextureLoader 已完备**: 提供了完整的纹理加载功能，包括Y轴翻转、Mipmap生成、预乘Alpha等选项
- **着色器模式明确**: 使用 `uniform sampler2D` 声明，通过 `texture()` 函数采样
- **资源管理自动化**: 通过 runner.track() 自动管理纹理和采样器生命周期
- **绑定组名称匹配**: BindGroupLayout 中的 name 属性必须与着色器中的 uniform 名称匹配

#### relations

- `TextureLoader.load()` → 返回 `LoadedTexture` → 通过 `texture.update()` 上传到 `IRHITexture`
- 着色器中的 `sampler2D` uniform → 对应 BindGroupLayout 中的 texture binding
- 纹理和采样器在 BindGroup 中分别使用不同的 binding 点（通常纹理在前，采样器在后）
- `IRHITexture.createView()` 创建纹理视图，用于绑定到着色器
- 所有 Demo 都遵循相同的 MVP 矩阵变换模式，使用 ShaderUtils 生成的 Transforms uniform 块