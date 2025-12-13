# Cubemap Skybox Demo 参考文档

## 概述

**难度：** 中级
**演示：** 展示如何使用立方体贴图创建天空盒效果

本 Demo 演示了如何使用立方体贴图（Cubemap）技术创建逼真的天空盒效果。通过加载静态图片资源创建立方体贴图，使用反转的立方体几何体从内部渲染，实现无限远的天空效果。

## 核心技术特性

### 1. 静态资源立方体贴图加载
- 使用 `CubemapGenerator.loadFromUrls` 从 6 个面的图片文件加载立方体贴图
- 加载 Bridge2 场景的预设立方体贴图资源
- 支持异步加载，确保纹理数据完全就绪后再使用

```javascript
const cubemapUrls = {
  posX: '../assets/cube/Bridge2/posx.jpg',
  negX: '../assets/cube/Bridge2/negx.jpg',
  posY: '../assets/cube/Bridge2/posy.jpg',
  negY: '../assets/cube/Bridge2/negy.jpg',
  posZ: '../assets/cube/Bridge2/posz.jpg',
  negZ: '../assets/cube/Bridge2/negz.jpg',
};

const cubemapData = await CubemapGenerator.loadFromUrls(cubemapUrls);
```

### 2. 立方体贴图创建和上传
- 创建 6 个面的立方体贴图资源
- 按照立方体贴图标准顺序（+X, -X, +Y, -Y, +Z, -Z）上传数据
- 使用 CLAMP_TO_EDGE 避免接缝问题

```javascript
const cubeTexture = device.createTexture({
  width: cubemapData.size,
  height: cubemapData.size,
  depthOrArrayLayers: 6,
  dimension: 'cube',
  format: MSpec.RHITextureFormat.RGBA8_UNORM,
  usage: MSpec.RHITextureUsage.TEXTURE_BINDING | MSpec.RHITextureUsage.COPY_DST,
});
```

### 3. 天空盒渲染技巧
- **反转立方体几何体**：从立方体内部渲染天空
- **移除视图矩阵位移**：让天空盒始终跟随相机移动
- **gl_Position.xyww**：强制深度值为 1.0，确保天空盒在最远处渲染
- **Uniform Block 精度一致性**：确保 Uniform Block 在所有着色器阶段使用相同精度

```glsl
// 顶点着色器中的关键技巧
#version 300 es
precision highp float;  // 必须与片段着色器保持一致

layout(std140) uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
gl_Position = uProjectionMatrix * viewMatrixNoTranslation * worldPosition;
gl_Position.z = gl_Position.w; // = gl_Position.xyww
```

```glsl
// 片段着色器中的精度匹配
#version 300 es
precision highp float;  // 必须与顶点着色器保持一致

layout(std140) uniform Transforms {
  mat4 uModelMatrix;     // 与顶点着色器中的定义完全相同
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};
```

### 4. samplerCube 立方体贴图采样
- 在片段着色器中使用 samplerCube 采样立方体贴图
- 根据 3D 方向向量采样对应纹理颜色
- 支持基于时间的旋转动画效果

```glsl
// 片段着色器中的立方体贴图采样
vec3 rotatedPos = rotateY(uTime * uRotationSpeed) * rotateX(uTime * uRotationSpeed * 0.5) * vWorldPos;
vec3 color = texture(uSkybox, normalize(rotatedPos)).rgb;
```

## 交互控制

### GUI 参数
- **Intensity**：天空盒亮度强度（0.0 - 2.0）
- **Rotation Speed**：天空旋转速度（0.0 - 0.5）

### 键盘控制
- **R**：重置相机视角
- **F11**：切换全屏模式
- **ESC**：退出 Demo

### 鼠标控制
- **左键拖动**：旋转相机视角
- **滚轮**：缩放相机距离
- **右键拖动**：平移相机

## 技术实现细节

### 1. 资源管理
- 使用 DemoRunner 自动追踪和清理 GPU 资源
- 顶点缓冲区存储立方体位置数据
- Uniform 缓冲区存储变换矩阵和参数

### 2. 渲染管线配置
```javascript
// 绑定组布局定义
const bindGroupLayout = device.createBindGroupLayout([
  {
    binding: 0,
    visibility: MSpec.RHIShaderStage.VERTEX,
    buffer: { type: 'uniform' },
    name: 'Transforms',
  },
  {
    binding: 2,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    texture: { sampleType: 'float', viewDimension: 'cube' },
    name: 'uSkybox',
  },
  {
    binding: 3,
    visibility: MSpec.RHIShaderStage.FRAGMENT,
    sampler: { type: 'filtering' },
    name: 'uSkyboxSampler',
  },
]);
```

### 3. 性能优化
- 使用线性滤波（LINEAR）确保高质量渲染
- 加载高分辨率的静态图片资源
- 立方体贴图采样使用 CLAMP_TO_EDGE 避免接缝问题

## 应用场景

1. **户外场景渲染**：为游戏和模拟器提供逼真的天空背景
2. **环境映射**：作为场景的环境光照来源
3. **背景效果**：创建无缝的 360 度全景背景
4. **静态天空**：使用预渲染的高质量天空图像

## 扩展建议

1. **HDR 天空盒**：支持高动态范围的天空盒纹理
2. **程序化云朵**：添加噪声函数生成动态云朵效果
3. **日夜循环**：通过切换不同立方体贴图实现日夜变化
4. **星空效果**：夜间添加星星和月亮效果
5. **大气散射**：实现更真实的大气散射效果
6. **多天空盒切换**：支持在运行时动态切换不同的天空资源

## 已知问题和解决方案

### Shader 精度匹配错误
**问题：** "Precisions of uniform block members must match across shaders"
**原因：** Uniform Block 在顶点着色器和片段着色器中使用了不同的精度
**解决方案：** 确保所有着色器阶段对相同的 Uniform Block 使用相同的精度（highp）

## 相关资源

- **源码**：`packages/rhi/demo/src/cubemap-skybox.ts`
- **演示页面**：`packages/rhi/demo/html/cubemap-skybox.html`
- **CubemapGenerator**：`packages/rhi/demo/src/utils/CubemapGenerator.ts`
- **立方体贴图原理**：[OpenGL Cubemap Tutorial](https://learnopengl.com/Advanced-OpenGL/Cubemaps)
- **WebGL Uniform Block 规范**：[OpenGL ES 3.0 Specification - Uniform Blocks](https://www.khronos.org/registry/OpenGL/specs/es/3.0/es_spec_3.0.pdf)