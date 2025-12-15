# 阴影贴图 Demo 参考文档

## 概述

阴影贴图（Shadow Mapping）Demo 是第四层高级渲染技术的第一个演示，展示了动态阴影渲染的核心技术。本 Demo 使用深度纹理和两遍渲染技术，实现了实时的软阴影效果。

## 技术特点

### 1. 深度纹理渲染
- **格式**: DEPTH24_UNORM 精度深度纹理
- **工具**: RenderTarget 工具类管理阴影贴图
- **分辨率**: 可动态调节（512-4096）
- **性能**: 平衡质量和渲染速度

### 2. 两遍渲染技术
```mermaid
graph TD
    A[阴影Pass] --> B[渲染深度到纹理]
    C[场景Pass] --> D[采样阴影贴图]
    D --> E[计算阴影系数]
    E --> F[最终光照计算]
```

#### 阴影Pass（Depth Pass）
- 目标：只渲染深度信息到阴影贴图
- 着色器：最小化，只计算位置
- 管线：前面剔除，避免自阴影
- 输出：深度纹理

#### 场景Pass（Lighting Pass）
- 目标：渲染最终场景，包含阴影
- 着色器：完整光照 + 阴影计算
- 管线：标准光照管线
- 输入：阴影贴图 + 场景几何

### 3. PCF 软阴影
支持三种采样模式：
- **1x1**: 硬阴影（最快）
- **2x2**: 基础软阴影
- **3x3**: 高质量软阴影

#### PCF 算法实现
```glsl
float calculateShadow(vec4 lightSpacePos, float bias) {
  // 透视除法
  vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
  projCoords = projCoords * 0.5 + 0.5;  // [-1,1] -> [0,1]

  float currentDepth = projCoords.z;
  float shadow = 0.0;
  vec2 texelSize = 1.0 / vec2(textureSize(uShadowMap, 0));

  // 3x3 PCF 采样
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 offset = vec2(float(x), float(y)) * texelSize;
      float pcfDepth = texture(uShadowMap, projCoords.xy + offset).r;
      shadow += currentDepth - bias > pcfDepth ? 1.0 : 0.0;
    }
  }

  return shadow / 9.0;  // 3x3 = 9 samples
}
```

### 4. 阴影偏移（Shadow Bias）
- **问题**: 阴影痤疮（Shadow Acne）
- **原因**: 深度精度误差导致表面自阴影
- **解决**: 添加偏移量，移动阴影测试位置
- **控制**: GUI 实时调节偏移参数

### 5. 光源空间变换
完整的坐标变换管线：
1. 世界空间 → 光源视图空间
2. 视图空间 → 光源投影空间
3. NDC 空间 → 纹理空间 (0-1)

```typescript
// 计算光源视图投影矩阵
lightViewMatrix.lookAt(lightPosition, lightTarget, lightUp);
lightProjMatrix.orthographic(-10, 10, -10, 10, 1, 50);
lightViewProjMatrix.multiply(lightProjMatrix, lightViewMatrix);
```

## 核心组件

### RenderTarget 阴影贴图
```typescript
const shadowMap = runner.track(
  new RenderTarget(runner.device, {
    width: shadowMapResolution,
    height: shadowMapResolution,
    colorAttachmentCount: 0,  // 只需要深度
    depthFormat: MSpec.RHITextureFormat.DEPTH24_UNORM,
    label: 'Shadow Map',
  })
);
```

### 阴影采样器
```typescript
const shadowSampler = runner.device.createSampler({
  minFilter: MSpec.RHIFilterMode.LINEAR,
  magFilter: MSpec.RHIFilterMode.LINEAR,
  addressModeU: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  addressModeV: MSpec.RHIAddressMode.CLAMP_TO_EDGE,
  compare: MSpec.RHICompareFunction.LESS,  // 比较采样器
  label: 'Shadow Sampler',
});
```

### Uniform 缓冲区布局

#### ShadowTransforms (128 bytes)
- `uLightViewProjMatrix`: mat4 (64 bytes)
- `uModelMatrix`: mat4 (64 bytes)

#### SceneUniforms (64 bytes)
- `uLightPosition`: vec3 + padding (16 bytes)
- `uLightColor`: vec3 + padding (16 bytes)
- `uObjectColor`: vec3 + padding (16 bytes)
- `uShadowBias`: float (4 bytes)
- `uPCFSamples`: int (4 bytes)
- `uAmbientIntensity`: float (4 bytes)
- padding: 4 bytes

## 性能考虑

### 1. 分辨率权衡
| 分辨率 | 质量 | 性能影响 | 推荐场景 |
|--------|------|----------|----------|
| 512 | 低 | 最小 | 移动设备 |
| 1024 | 中 | 轻微 | 桌面默认 |
| 2048 | 高 | 中等 | 高质量 |
| 4096 | 极高 | 严重 | 室内场景 |

### 2. PCF 采样开销
- 1x1: 1 次纹理采样
- 2x2: 4 次纹理采样
- 3x3: 9 次纹理采样

### 3. 渲染批次
- 阴影Pass：2个 draw call（平面 + 立方体）
- 场景Pass：2个 draw call（平面 + 立方体）
- 总计：4个 draw call + 资源绑定

## 交互控制

### GUI 参数面板
- **光源位置 (X, Y, Z)**: 实时调整平行光位置
- **阴影偏移**: 消除阴影痤疮的偏移量
- **PCF 采样数**: 1(硬阴影) / 4(2x2) / 9(3x3)
- **环境光强度**: 调节场景基础亮度
- **阴影贴图分辨率**: 动态调整深度纹理大小

### 相机控制
- 鼠标左键：旋转视角
- 鼠标滚轮：缩放
- 鼠标右键：平移
- R键：重置视角
- ESC：退出Demo

## 技术挑战与解决方案

### 1. 阴影痤疮（Shadow Acne）
**问题**: 表面出现不应该有的阴影条纹
**原因**: 深度缓冲精度误差导致表面自阴影
**解决**:
- 添加阴影偏移（Shadow Bias）
- 使用前面剔除渲染阴影

### 2. Peter Panning
**问题**: 阴影与物体分离，看起来像在漂浮
**原因**: 偏移量过大导致阴影偏离
**解决**:
- 仔细调节偏移参数
- 使用基于法线的动态偏移

### 3. 阴影贴图边缘
**问题**: 阴影贴图边界出现锯齿
**解决**:
- Clamp-to-Edge 边缘模式
- 适当扩大光源投影范围

## 扩展方向

### 1. 级联阴影贴图（CSM）
- 多级阴影贴图覆盖不同距离
- 平滑级联过渡
- 适合大场景

### 2. 变形阴影贴图
- 更紧密的视锥体包围
- 提高阴影精度
- 适合聚光灯

### 3. 阴影贴图过滤
- Variance Shadow Maps
- Exponential Shadow Maps
- 减少PCF采样开销

## 调试技巧

### 1. 可视化阴影贴图
- 在场景角落显示深度纹理
- 检查深度值分布
- 验证光源视锥体覆盖

### 2. 阴影边界调试
- 绘制光源投影边界框
- 确保包含所有阴影接收体
- 避免场景物体超出边界

### 3. 性能分析
- 使用WebGL Inspector分析渲染
- 监控纹理带宽使用
- 优化渲染批次

## 相关技术文档

- [RHI 渲染目标工具](/llmdoc/guides/render-target-usage.md)
- [WebGL2 深度纹理](/llmdoc/webgl2/depth-textures.md)
- [PCF 算法详解](/llmdoc/algorithms/pcf-filtering.md)
- [阴影偏移原理](/llmdoc/algorithms/shadow-bias.md)

## 总结

阴影贴图Demo成功展示了现代实时渲染中的核心技术：
- 深度纹理渲染与管理
- 两遍渲染管线设计
- PCF 软阴影算法实现
- 阴影偏移问题解决

为更高级的阴影技术（如级联阴影、变形阴影）奠定了坚实基础，是学习实时阴影渲染的理想起点。