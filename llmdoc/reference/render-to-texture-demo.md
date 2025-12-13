# Render-to-Texture Demo 实现参考

## 概述

render-to-texture 是 RHI Demo 系统第二层（纹理系统）的高级演示，展示离屏渲染（Render-to-Texture, RTT）技术和多通道渲染流程。该演示通过两遍渲染实现实时后处理效果，是现代图形渲染中的核心技术。

## 功能演示

- **双通道渲染**：第一遍将 3D 场景渲染到离屏纹理，第二遍将纹理渲染到屏幕
- **实时后处理效果**：像素化、颜色反转、灰度、模糊等效果
- **分屏对比模式**：支持全屏 RTT、分屏对比和原始渲染三种模式
- **渲染目标管理**：演示 1024x1024 高分辨率离屏渲染目标的创建和使用
- **动态纹理切换**：支持渐变、棋盘格、噪声三种程序化纹理

## 核心技术点

### 1. 渲染目标（RenderTarget）创建

```typescript
// 创建 1024x1024 的渲染目标，包含颜色和深度附件
const renderTarget = runner.track(
  new RenderTarget(runner.device, {
    width: 1024,
    height: 1024,
    colorFormat: MSpec.RHITextureFormat.RGBA8_UNORM,
    depthFormat: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
    label: 'RTT Target',
  })
);
```

### 2. 双渲染通道设计

**第一遍 - 场景渲染到纹理**：

```typescript
// 获取渲染目标的 Pass Descriptor
const rttPassDescriptor = renderTarget.getRenderPassDescriptor([0.1, 0.1, 0.2, 1.0]);

// 开始离屏渲染
const firstPass = encoder.beginRenderPass({
  colorAttachments: rttPassDescriptor.colorAttachments,
  depthStencilAttachment: rttPassDescriptor.depthStencilAttachment,
});

firstPass.setPipeline(firstPassPipeline);
firstPass.setBindGroup(0, firstPassBindGroup);
firstPass.setVertexBuffer(0, cubeVertexBuffer);
firstPass.setIndexBuffer(cubeIndexBuffer, MSpec.RHIIndexFormat.UINT16);
firstPass.drawIndexed(cubeGeometry.indexCount!);
firstPass.end();
```

**第二遍 - 纹理渲染到屏幕**：

```typescript
// 渲染到主屏幕
const secondPass = encoder.beginRenderPass({
  colorAttachments: passDescriptor.colorAttachments,
});

secondPass.setPipeline(secondPassPipeline);
secondPass.setBindGroup(0, secondPassBindGroup);
secondPass.setVertexBuffer(0, quadVertexBuffer);
secondPass.draw(quadGeometry.vertexCount);
secondPass.end();
```

### 3. 第一遍着色器实现

**顶点着色器**：标准 3D 渲染管线

```glsl
#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
  mat4 uNormalMatrix;
};

out vec3 vNormal;
out vec2 vTexCoord;
out vec3 vWorldPosition;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = mat3(uNormalMatrix) * aNormal;
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
```

**片段着色器**：Phong 光照模型

```glsl
#version 300 es
precision mediump float;

in vec3 vNormal;
in vec2 vTexCoord;
in vec3 vWorldPosition;

uniform sampler2D uTexture;

uniform Lighting {
  vec3 uLightDirection;
  vec3 uLightColor;
  vec3 uAmbientColor;
  float uSpecularIntensity;
};

uniform Camera {
  vec3 uCameraPosition;
};

out vec4 fragColor;

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightDirection);

  // 漫反射
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  // 镜面反射 (Blinn-Phong)
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
  vec3 specular = uSpecularIntensity * spec * uLightColor;

  // 最终颜色
  vec3 ambient = uAmbientColor;
  vec3 lighting = ambient + diffuse + specular;
  fragColor = vec4(texColor.rgb * lighting, texColor.a);
}
```

### 4. 第二遍着色器实现

**顶点着色器**：全屏四边形

```glsl
#version 300 es
precision highp float;

in vec3 aPosition;
in vec2 aTexCoord;

uniform SecondPassUniforms {
  vec2 uResolution;
  float uSplitMode;
  int uEffect;
};

out vec2 vTexCoord;
out vec2 vScreenCoord;

void main() {
  vTexCoord = aTexCoord;
  vScreenCoord = (aPosition.xy * 0.5 + 0.5) * uResolution;
  gl_Position = vec4(aPosition, 1.0);
}
```

**片段着色器**：后处理效果

```glsl
#version 300 es
precision mediump float;

in vec2 vTexCoord;
in vec2 vScreenCoord;

uniform SecondPassUniforms {
  vec2 uResolution;
  float uSplitMode;
  int uEffect;
};
uniform sampler2D uRTTexture;

out vec4 fragColor;

// 像素化效果
vec4 pixelate(sampler2D tex, vec2 uv, float pixelSize) {
  vec2 pixelatedUV = floor(uv * pixelSize) / pixelSize;
  return texture(tex, pixelatedUV);
}

// 简单模糊效果
vec4 simpleBlur(sampler2D tex, vec2 uv, vec2 texelSize) {
  vec4 color = vec4(0.0);
  float total = 0.0;

  for(int x = -2; x <= 2; x++) {
    for(int y = -2; y <= 2; y++) {
      float weight = 1.0 / (abs(float(x)) + abs(float(y)) + 1.0);
      vec2 offset = vec2(float(x), float(y)) * texelSize;
      color += texture(tex, uv + offset) * weight;
      total += weight;
    }
  }

  return color / total;
}

void main() {
  vec4 color;
  vec2 uv = vTexCoord;

  // 分屏模式处理
  if (uSplitMode == 1.0) {
    // 左侧显示RTT效果，右侧显示原始
    if (vScreenCoord.x < uResolution.x * 0.5) {
      uv.x = uv.x * 2.0; // 拉伸左侧
      color = texture(uRTTexture, uv);
    } else {
      color = vec4(0.2, 0.2, 0.3, 1.0); // 背景色
    }
  } else if (uSplitMode == 2.0) {
    // 原始模式（直接渲染）
    color = vec4(0.2, 0.2, 0.3, 1.0);
  } else {
    // 完整RTT模式
    color = texture(uRTTexture, uv);
  }

  // 应用后处理效果
  vec2 texelSize = 1.0 / uResolution;

  if (uEffect == 1) { // 像素化
    float pixelCount = 50.0;
    color = pixelate(uRTTexture, uv, pixelCount);
  } else if (uEffect == 2) { // 颜色反转
    color.rgb = 1.0 - color.rgb;
  } else if (uEffect == 3) { // 灰度
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = vec3(gray);
  } else if (uEffect == 4) { // 模糊
    color = simpleBlur(uRTTexture, uv, texelSize);
  }

  fragColor = color;
}
```

### 5. 绑定组管理

**第一遍绑定组**（包含纹理、光照等）：

```typescript
const firstPassBindGroupLayout = runner.track(
  runner.device.createBindGroupLayout(
    [
      {
        binding: 0,
        visibility: MSpec.RHIShaderStage.VERTEX,
        buffer: { type: 'uniform' },
        name: 'Transforms',
      },
      {
        binding: 1,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
        name: 'Lighting',
      },
      {
        binding: 2,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
        name: 'Camera',
      },
      {
        binding: 3,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float', viewDimension: '2d' },
        name: 'uTexture',
      },
      {
        binding: 4,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        sampler: { type: 'filtering' },
        name: 'uTexture',
      },
    ],
    'First Pass BindGroup Layout'
  )
);
```

**第二遍绑定组**（使用渲染目标作为纹理）：

```typescript
const secondPassBindGroupLayout = runner.track(
  runner.device.createBindGroupLayout(
    [
      {
        binding: 0,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
        name: 'SecondPassUniforms',
      },
      {
        binding: 1,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        texture: { sampleType: 'float', viewDimension: '2d' },
        name: 'uRTTexture',
      },
      {
        binding: 2,
        visibility: MSpec.RHIShaderStage.FRAGMENT,
        sampler: { type: 'filtering' },
        name: 'uRTTexture',
      },
    ],
    'Second Pass BindGroup Layout'
  )
);

// 创建绑定组时使用渲染目标的颜色视图
const secondPassBindGroup = runner.track(
  runner.device.createBindGroup(secondPassBindGroupLayout, [
    { binding: 0, resource: secondPassUniformBuffer },
    { binding: 1, resource: renderTarget.getColorView(0) }, // 关键：使用渲染目标的视图
    { binding: 2, resource: sampler },
  ])
);
```

### 6. 渲染模式控制

```typescript
// GUI 控制
gui.add('splitMode', {
  value: params.splitMode,
  options: ['0', '1', '2'], // 0: full RTT, 1: split screen, 2: original
  onChange: (v) => {
    params.splitMode = parseInt(v as string);
  },
});

// 后处理效果选择
gui.add('effect', {
  value: params.effect,
  options: ['0', '1', '2', '3', '4'], // 0: none, 1: pixelate, 2: invert, 3: grayscale, 4: blur
  onChange: (v) => {
    params.effect = parseInt(v as string);
  },
});
```

## 后处理效果详解

### 1. 像素化（Pixelation）
- **原理**：将 UV 坐标量化到较低的精度
- **用途**：复古风格、性能优化
- **实现**：`floor(uv * pixelSize) / pixelSize`

### 2. 颜色反转（Invert）
- **原理**：`RGB = 1.0 - RGB`
- **用途**：特效、负片效果
- **性能**：极快，单次数学运算

### 3. 灰度（Grayscale）
- **原理**：加权平均 `Gray = 0.299*R + 0.587*G + 0.114*B`
- **用途**：复古风格、强调形状
- **优化**：可用更简单的 `(R+G+B)/3.0` 代替

### 4. 模糊（Blur）
- **原理**：卷积核滤波，周围像素加权平均
- **用途**：柔化、发光效果、景深
- **优化**：可分离卷积、降采样等

## 程序化纹理生成

Demo 使用三种程序化纹理，无需外部图片资源：

```typescript
// 渐变纹理
const gradient = ProceduralTexture.gradient({
  width: 256,
  height: 256,
  direction: 'diagonal',
  startColor: [255, 100, 50, 255],
  endColor: [50, 100, 255, 255],
});

// 棋盘格纹理
const checkerboard = ProceduralTexture.checkerboard({
  width: 256,
  height: 256,
  cellSize: 16,
  colorA: [255, 200, 100, 255],
  colorB: [100, 50, 200, 255],
});

// Perlin 噪声纹理
const noise = ProceduralTexture.noise({
  width: 256,
  height: 256,
  type: 'perlin',
  frequency: 8,
  octaves: 3,
});
```

## 性能优化要点

### 1. 渲染目标尺寸选择
- 1024x1024 是性能和质量的平衡点
- 可根据设备性能动态调整
- 移动设备建议使用 512x512

### 2. 着色器优化
- 使用 `precision mediump float` 节省带宽
- 避免复杂的分支语句
- 使用 `uniform` 而非 `const` 传递参数

### 3. 渲染流程优化
- 只在需要时执行第一遍渲染
- 条件渲染：`if (params.splitMode !== 2)`
- 避免不必要的纹理切换

## 交互控制

- **鼠标左键拖动**：旋转 3D 场景视角
- **鼠标滚轮**：缩放场景
- **鼠标右键拖动**：平移场景
- **空格键**：暂停/继续自动旋转
- **ESC**：退出 Demo
- **F11**：切换全屏模式

## 扩展应用

Render-to-Texture 技术是许多高级效果的基础：

1. **镜面反射**：渲染反射视角到纹理
2. **阴影映射**：从光源视角渲染深度纹理
3. **延迟渲染**：多渲染目标（MRT）
4. **环境映射**：立方体贴图渲染
5. **视频录制**：逐帧渲染到纹理并编码
6. **VR 渲染**：左右眼分别渲染到纹理

## 相关文件

- `packages/rhi/demo/src/render-to-texture.ts` - 主程序实现
- `packages/rhi/demo/html/render-to-texture.html` - HTML 界面
- `packages/rhi/src/webgl/resources/GLRenderTarget.ts` - WebGL 渲染目标实现
- `packages/rhi/demo/src/utils/RenderTarget.ts` - 渲染目标封装类
- `packages/rhi/demo/src/utils/ProceduralTexture.ts` - 程序化纹理生成器

## 技术注意事项

1. **WebGL 限制**：确保渲染目标格式被设备支持
2. **内存管理**：及时销毁不再使用的渲染目标
3. **深度缓冲**：离屏渲染需要独立的深度缓冲
4. **视口匹配**：渲染目标和屏幕尺寸可能不同，注意 UV 映射
5. **性能监控**：使用 `Stats` 类监控 RTT 对性能的影响