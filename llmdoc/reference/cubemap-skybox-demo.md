# Cubemap Skybox Demo 参考文档

## 概述

**难度：** 中级
**演示：** 展示如何使用立方体贴图创建天空盒效果

本 Demo 演示了如何使用立方体贴图（Cubemap）技术创建逼真的天空盒效果。通过 `CubemapGenerator` 生成天空渐变纹理，使用反转的立方体几何体从内部渲染，实现无限远的天空效果。

## 核心技术特性

### 1. CubemapGenerator 天空渐变生成
- 使用程序化生成器创建天空渐变立方体贴图
- 支持三层颜色渐变：顶部颜色、地平线颜色、底部颜色
- 动态更新纹理内容，实时预览天空变化

```javascript
let cubemapData = CubemapGenerator.skyGradient({
  size: 512,
  topColor: [135, 206, 235, 255],     // 天空蓝
  horizonColor: [176, 196, 222, 255],  // 淡蓝
  bottomColor: [139, 69, 19, 255],     // 棕色地面
});
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

```glsl
// 顶点着色器中的关键技巧
vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
gl_Position = uProjectionMatrix * viewMatrixNoTranslation * worldPosition;
gl_Position.z = gl_Position.w; // = gl_Position.xyww
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
- **Top Color**：天空顶部颜色（默认天空蓝）
- **Horizon Color**：地平线颜色（默认淡蓝色）
- **Bottom Color**：底部颜色（默认棕色）
- **Intensity**：天空盒亮度强度（0.0 - 2.0）
- **Rotation Speed**：天空旋转速度（0.0 - 0.5）

### 键盘控制
- **R**：重置相机视角
- **Space**：重置天空颜色为默认值
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
- 预先生成 512x512 分辨率的立方体贴图
- 动态更新纹理时只更新必要的面

## 应用场景

1. **户外场景渲染**：为游戏和模拟器提供逼真的天空背景
2. **环境映射**：作为场景的环境光照来源
3. **背景效果**：创建无缝的 360 度全景背景
4. **动态天气**：通过调整颜色模拟不同时间的天空效果

## 扩展建议

1. **HDR 天空盒**：支持高动态范围的天空盒纹理
2. **程序化云朵**：添加噪声函数生成动态云朵效果
3. **日夜循环**：基于时间插值的天空颜色变化
4. **星空效果**：夜间添加星星和月亮效果
5. **大气散射**：实现更真实的大气散射效果

## 相关资源

- **源码**：`packages/rhi/demo/src/cubemap-skybox.ts`
- **演示页面**：`packages/rhi/demo/html/cubemap-skybox.html`
- **CubemapGenerator**：`packages/rhi/demo/src/utils/CubemapGenerator.ts`
- **立方体贴图原理**：[OpenGL Cubemap Tutorial](https://learnopengl.com/Advanced-OpenGL/Cubemaps)