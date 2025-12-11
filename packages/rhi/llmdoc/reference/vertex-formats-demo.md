# 顶点格式 Demo 参考

本文档提供顶点格式架构的完整实现参考，展示如何使用不同的顶点数据格式实现内存优化。

## 1. 核心架构

### 四种顶点格式对比

顶点格式演示展示了四种不同的顶点数据配置及其内存效率对比：

| 格式类型 | 字节/顶点 | 相对占用 | 节省空间 | 位置格式 | 颜色格式 | 法线格式 |
|---------|----------|--------|----------|----------|----------|----------|
| Standard (FLOAT32) | 28 | 100% | 基准 | FLOAT32x3 | FLOAT32x3 | FLOAT32 |
| Compressed Color (UNORM8x4) | 16 | 57% | 43% ↓ | FLOAT32x3 | UNORM8x4 | FLOAT32 |
| Half Precision (FLOAT16) | 22 | 79% | 21% ↓ | FLOAT16x4 | FLOAT32x3 | FLOAT16x2 |
| Ultra Compact | 8 | 29% | 71% ↓ | FLOAT16x4 | UNORM8x4 | SNORM16x2 |

### 顶点布局配置

每种格式使用不同的顶点布局配置：

```typescript
// Standard 格式配置
const vertexLayout: MSpec.RHIVertexLayout = {
  buffers: [
    {
      index: 0,
      stride: 28,
      stepMode: 'vertex',
      attributes: [
        {
          name: 'aPosition',
          format: MSpec.RHIVertexFormat.FLOAT32x3,
          offset: 0,
          shaderLocation: 0,
        },
        {
          name: 'aColor',
          format: MSpec.RHIVertexFormat.FLOAT32x3,
          offset: 12,
          shaderLocation: 1,
        },
        {
          name: 'aNormal',
          format: MSpec.RHIVertexFormat.FLOAT32,
          offset: 24,
          shaderLocation: 2,
        },
      ],
    },
  ],
};

// Ultra Compact 格式配置
const ultraCompactLayout: MSpec.RHIVertexLayout = {
  buffers: [
    {
      index: 0,
      stride: 8,
      stepMode: 'vertex',
      attributes: [
        {
          name: 'aPosition',
          format: MSpec.RHIVertexFormat.FLOAT16x4,
          offset: 0,
          shaderLocation: 0,
        },
        {
          name: 'aColor',
          format: MSpec.RHIVertexFormat.UNORM8x4,
          offset: 8,
          shaderLocation: 1,
        },
        {
          name: 'aNormal',
          format: MSpec.RHIVertexFormat.SNORM16x2,
          offset: 12,
          shaderLocation: 2,
        },
      ],
    },
  ],
};
```

## 2. 数据转换与归一化

### UNORM8x4 转换

8位无符号归一化格式自动转换到 0-1 范围：

```typescript
// 生成时：将 0-255 映射到 0-1
function generateCompressedColors() {
  const colors = new Uint8Array(vertexCount * 4);
  for (let i = 0; i < vertexCount; i++) {
    // 在着色器中自动归一化
    colors[i * 4] = 255;     // R = 1.0
    colors[i * 4 + 1] = 128; // G = 0.5
    colors[i * 4 + 2] = 64;  // B = 0.25
    colors[i * 4 + 3] = 255; // A = 1.0
  }
  return colors;
}
```

### SNORM16x2 转换

16位有符号归一化格式自动转换到 -1 到 1 �范围：

```typescript
// 生成时：将 -32768-32767 映射到 -1-1
function generateCompressedNormals() {
  const normals = new Int16Array(vertexCount * 2);
  for (let i = 0; i < vertexCount; i++) {
    // 在着色器中自动归一化
    normals[i * 2] = 0;       // Nx = 0.0
    normals[i * 2 + 1] = 32767; // Ny = 1.0
  }
  return normals;
}
```

## 3. 着色器实现

### 通用顶点着色器

支持多种格式的统一顶点着色器：

```glsl
#version 300 es
layout(location = 0) in vec3 aPosition;    // FLOAT32x3 或 FLOAT16x4
layout(location = 1) in vec4 aColor;     // FLOAT32x3 或 UNORM8x4
layout(location = 2) in vec2 aNormal;    // FLOAT16x2 或 SNORM16x2

uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

out vec4 vColor;
out vec3 vNormal;

void main() {
  // 自动处理不同格式的数据归一化
  vColor = aColor;  // UNORM8x4 和 SNORM16x2 自动归一化

  // 从压缩的法线重构3D法线
  vNormal = normalize(vec3(aNormal.x, 0.5, aNormal.y));

  // MVP 变换
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
```

### 片段着色器

简单的光照计算：

```glsl
#version 300 es
precision mediump float;

in vec4 vColor;
in vec3 vNormal;

out vec4 fragColor;

void main() {
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float diffuse = max(dot(vNormal, lightDir), 0.3);
  fragColor = vColor * (0.7 + 0.3 * diffuse);
}
```

## 4. 多管线管理

### 创建多种格式管线

```typescript
// 创建不同格式的渲染管线
const pipelines = new Map<string, MSpec.IRHIRenderPipeline>();

function createPipeline(format: string, layout: MSpec.RHIVertexLayout) {
  return runner.device.createRenderPipeline({
    vertexLayout,
    fragment: {
      entryPoint: 'main',
      module: runner.device.createShaderModule({
        code: FS_SHADER,
      }),
      targets: [{
        format: MSpec.RHITextureFormat.RGBA8_UNORM,
      }],
    },
    vertex: {
      entryPoint: 'main',
      module: runner.device.createShaderModule({
        code: VS_SHADER,
      }),
    },
  });
}

// 为每种格式创建管线
const standardLayout = createStandardLayout();
const compressedLayout = createCompressedLayout();
const halfPrecisionLayout = createHalfPrecisionLayout();
const ultraCompactLayout = createUltraCompactLayout();

pipelines.set('standard', createPipeline('standard', standardLayout));
pipelines.set('compressed', createPipeline('compressed', compressedLayout));
pipelines.set('half', createPipeline('half', halfPrecisionLayout));
pipelines.set('ultra', createPipeline('ultra', ultraCompactLayout));
```

## 5. 实时格式切换

### 数据重构

在切换格式时需要重构顶点数据：

```typescript
function convertVertexData(fromFormat: string, toFormat: string) {
  const vertexCount = geometry.vertexCount;
  const newData = new Float32Array(vertexCount * 12); // 最大缓冲区

  switch (toFormat) {
    case 'standard':
      // 从其他格式转换到标准格式
      if (fromFormat === 'compressed') {
        for (let i = 0; i < vertexCount; i++) {
          const pos = geometry.positions.subarray(i * 3, i * 3 + 3);
          const col = geometry.colors.subarray(i * 4, i * 4 + 4);
          const nor = geometry.normals.subarray(i * 1, i * 1 + 1);

          // 复制位置（保持FLOAT32）
          newData.set(pos, i * 12);

          // 扩展颜色（UNORM8x4 -> FLOAT32x3）
          newData[i * 12 + 4] = col[0] / 255;
          newData[i * 12 + 5] = col[1] / 255;
          newData[i * 12 + 6] = col[2] / 255;

          // 扩展法线（保持FLOAT32）
          newData[i * 12 + 8] = nor[0];
        }
      }
      break;

    case 'ultra':
      // 压缩到最紧凑格式
      const compactData = new ArrayBuffer(vertexCount * 8);
      const compactView = new DataView(compactData);

      for (let i = 0; i < vertexCount; i++) {
        // 压缩位置（FLOAT32x3 -> FLOAT16x4）
        // 压缩颜色（FLOAT32x3 -> UNORM8x4）
        // 压缩法线（FLOAT32 -> SNORM16x2）
      }
      break;
  }

  return newData;
}
```

## 6. 内存优化策略

### 缓冲区预分配

为不同格式预分配缓冲区：

```typescript
// 预分配缓冲区池
const bufferPool = new Map<string, MSpec.IRHIBuffer>();

function createBufferForFormat(format: string, size: number) {
  const buffer = runner.device.createBuffer({
    size,
    usage: MSpec.RHIBufferUsage.VERTEX,
    hint: 'static',
    label: `Vertex Buffer - ${format}`,
  });
  return runner.track(buffer);
}

// 为每种格式创建缓冲区
const bufferSizes = {
  standard: vertexCount * 28,
  compressed: vertexCount * 16,
  half: vertexCount * 22,
  ultra: vertexCount * 8,
};

bufferPool.set('standard', createBufferForFormat('standard', bufferSizes.standard));
bufferPool.set('compressed', createBufferForFormat('compressed', bufferSizes.compressed));
bufferPool.set('half', createBufferForFormat('half', bufferSizes.half));
bufferPool.set('ultra', createBufferForFormat('ultra', bufferSizes.ultra));
```

## 7. 性能监控

### 内存占用监控

实时显示不同格式的内存占用：

```typescript
function updateMemoryUI() {
  const formats = [
    { name: 'Standard', bytes: 28, ratio: 1.0 },
    { name: 'Compressed', bytes: 16, ratio: 0.57 },
    { name: 'Half Precision', bytes: 22, ratio: 0.79 },
    { name: 'Ultra Compact', bytes: 8, ratio: 0.29 },
  ];

  // 更新内存占用条形图
  formats.forEach(format => {
    const bar = document.getElementById(`memory-${format.name.toLowerCase().replace(' ', '-')}`);
    if (bar) {
      bar.style.width = `${format.ratio * 100}%`;
      bar.textContent = `${format.bytes} bytes (${Math.round(format.ratio * 100)}%)`;
    }
  });
}
```

## 8. 使用场景

### 适用场景

- **内存受限设备**：移动设备、Web 应用
- **大型场景**：包含大量几何体的场景
- **批量渲染**：大量相同几何体的实例化渲染
- **GPU 内存优化**：减少显存占用

### 选择策略

1. **Standard**：需要高精度的场景（物理模拟、CAD）
2. **Compressed**：颜色不重要或可以使用压缩格式的场景
3. **Half Precision**：位置和法线可以降低精度的场景
4. **Ultra Compact**：极度内存敏感的场景

## 9. 源码位置

- **Demo 实现**：`packages/rhi/demo/src/vertex-formats.ts`
- **HTML 页面**：`packages/rhi/demo/html/vertex-formats.html`
- **实现文档**：`packages/rhi/demo/src/VERTEX_FORMATS_IMPLEMENTATION.md`
- **Demo 演示**：`packages/rhi/demo/html/vertex-formats.html`

## 10. 相关文档

- [RHI 接口参考](../reference/rhi-interfaces.md#顶点格式接口)
- [顶点布局规范](../reference/rhi-interfaces.md#顶点布局接口)
- [渲染管线创建](../reference/rhi-interfaces.md#渲染管线接口)
- [多顶点缓冲区 Demo](../reference/multiple-buffers-demo.md)
- [动态缓冲区 Demo](../reference/dynamic-buffer-demo.md)
- [Demo 开发指南](../guides/demo-development.md)