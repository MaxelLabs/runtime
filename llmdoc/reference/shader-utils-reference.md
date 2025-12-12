# ShaderUtils 着色器工具参考

**最后更新**: 2025-12-10
**版本**: Demo Utils v1.0
**模块位置**: `packages/rhi/demo/src/utils/shader/`

## 概述

ShaderUtils 是 RHI Demo 工具库中的着色器代码生成和管理工具。它提供以下功能：

- **Uniform 块生成**: 自动生成符合 std140 布局规范的 GLSL Uniform 块
- **布局计算**: 计算 Uniform 块字段的偏移和大小（std140）
- **着色器模板**: 提供常用的顶点和片段着色器模板
- **代码片段库**: 提供可复用的 GLSL 代码片段

## API 参考

### Uniform 块工具

#### `generateUniformBlock(definition: UniformBlockDefinition): string`

生成符合 std140 布局规范的 GLSL Uniform 块代码。

**参数**:
- `definition.name` - Uniform 块名称
- `definition.binding` - 绑定点编号
- `definition.fields` - 字段定义数组

**返回值**: GLSL 代码字符串

**示例**:
```typescript
const block = ShaderUtils.generateUniformBlock({
  name: 'CustomParams',
  binding: 3,
  fields: [
    { name: 'time', type: 'float' },
    { name: 'resolution', type: 'vec2' },
    { name: 'colors', type: 'vec4', arraySize: 4 },
  ],
});

console.log(block);
// 输出:
// layout(std140, binding = 3) uniform CustomParams {
//   float time;
//   vec2 resolution;
//   vec4 colors[4];
// };
```

#### `calculateUniformBlockSize(fields: UniformField[]): number`

计算 Uniform 块的总大小（字节），包括 std140 对齐。

**参数**:
- `fields` - 字段定义数组

**返回值**: 总大小（字节），对齐到 16 字节

**std140 对齐规则**:
- float: 4 字节
- vec2: 8 字节
- vec3: 16 字节（特殊！）
- vec4: 16 字节
- mat3: 48 字节（3 个 vec3）
- mat4: 64 字节（4 个 vec4）
- 数组元素步长: 16 字节

**示例**:
```typescript
const size = ShaderUtils.calculateUniformBlockSize([
  { name: 'time', type: 'float' },       // offset 0, size 4
  { name: 'color', type: 'vec3' },       // offset 16, size 12（对齐！）
  { name: 'matrix', type: 'mat4' },      // offset 32, size 64
]);

console.log(size); // 96
```

#### `calculateUniformBlockLayout(fields: UniformField[]): Std140LayoutInfo`

计算详细的 Uniform 块布局信息，包括每个字段的偏移。

**参数**:
- `fields` - 字段定义数组

**返回值**: 布局信息对象，包含：
- `fields` - 字段偏移信息数组
- `totalSize` - 总大小（字节）
- `fieldMap` - 字段名到偏移信息的映射

**示例**:
```typescript
const layout = ShaderUtils.calculateUniformBlockLayout([
  { name: 'time', type: 'float' },
  { name: 'position', type: 'vec3' },
  { name: 'matrix', type: 'mat4' },
]);

console.log(layout.fieldMap.get('position'));
// { name: 'position', offset: 16, size: 12 }

console.log(layout.totalSize); // 96
```

#### `getTransformsBlock(binding?: number): string`

生成标准的 MVP 矩阵 Uniform 块。

**参数**:
- `binding` - 绑定点（默认 0）

**返回值**: GLSL 代码

**包含的字段**:
- `uModelMatrix` (mat4) - 模型矩阵
- `uViewMatrix` (mat4) - 视图矩阵
- `uProjectionMatrix` (mat4) - 投影矩阵

**示例**:
```typescript
const block = ShaderUtils.getTransformsBlock(0);

// layout(std140, binding = 0) uniform Transforms {
//   mat4 uModelMatrix;
//   mat4 uViewMatrix;
//   mat4 uProjectionMatrix;
// };
```

#### `getLightingBlock(binding?: number): string`

生成标准的光照参数 Uniform 块。

**参数**:
- `binding` - 绑定点（默认 1）

**返回值**: GLSL 代码

**包含的字段**:
- `uLightPosition` (vec4) - 光源位置（xyz）和类型（w）
- `uLightColor` (vec4) - 光源颜色（rgb）和强度（a）
- `uAmbientColor` (vec4) - 环境光颜色（rgb）和强度（a）

#### `getMaterialBlock(binding?: number): string`

生成标准的材质参数 Uniform 块。

**参数**:
- `binding` - 绑定点（默认 2）

**返回值**: GLSL 代码

**包含的字段**:
- `uAmbientColor` (vec3) - 环境光颜色
- `uDiffuseColor` (vec3) - 漫反射颜色
- `uSpecularColor` (vec3) - 镜面反射颜色
- `uShininess` (float) - 光泽度

### 着色器模板

#### `basicVertexShader(options?: BasicVertexShaderOptions): string`

生成基础顶点着色器，支持 MVP 矩阵变换。

**参数选项**:
- `hasNormals` - 是否包含法线属性（默认 false）
- `hasUVs` - 是否包含纹理坐标属性（默认 false）
- `hasColors` - 是否包含顶点颜色属性（默认 false）

**返回值**: 完整的顶点着色器代码

**输出 varyings**:
- `vPosition` - 世界空间位置
- `vNormal` - 世界空间法线（当 hasNormals=true）
- `vTexCoord` - 纹理坐标（当 hasUVs=true）
- `vColor` - 顶点颜色（当 hasColors=true）

**示例**:
```typescript
const vs = ShaderUtils.basicVertexShader({
  hasNormals: true,
  hasUVs: true,
  hasColors: false,
});
```

#### `basicFragmentShader(options?: BasicFragmentShaderOptions): string`

生成基础片段着色器。

**参数选项**:
- `mode` - 着色模式（'solid' | 'vertexColor' | 'texture'，默认 'solid'）
- `hasLighting` - 是否包含光照计算（默认 false）

**返回值**: 完整的片段着色器代码

**着色模式**:
- `solid` - 输出固定蓝色
- `vertexColor` - 使用插值的顶点颜色
- `texture` - 采样纹理贴图

**示例**:
```typescript
const fs = ShaderUtils.basicFragmentShader({
  mode: 'vertexColor',
  hasLighting: false,
});
```

#### `phongShaders(): PhongShaders`

生成完整的 Phong 光照着色器对。

**返回值**: 包含 vertex 和 fragment 属性的对象

**光照模型**: Blinn-Phong
- 环境光
- 漫反射
- 镜面反射

**示例**:
```typescript
const { vertex, fragment } = ShaderUtils.phongShaders();

// 使用着色器
const vsModule = device.createShaderModule({
  code: vertex,
  language: 'glsl',
  stage: MSpec.RHIShaderStage.VERTEX,
});

const fsModule = device.createShaderModule({
  code: fragment,
  language: 'glsl',
  stage: MSpec.RHIShaderStage.FRAGMENT,
});
```

### 代码片段库

#### `getLightingSnippet(): string`

获取 Phong 光照计算函数片段。

**函数签名**:
```glsl
vec3 computeLighting(vec3 normal, vec3 lightDir, vec3 viewDir,
                     vec3 lightColor, vec3 ambientColor, float specularIntensity)
```

#### `getNormalTransformSnippet(): string`

获取法线变换函数片段。

**函数签名**:
```glsl
vec3 transformNormal(mat3 normalMatrix, vec3 normal)
```

#### `getTextureSamplingSnippet(): string`

获取纹理采样函数片段。

**包含函数**:
- `sampleTexture(sampler2D texture, vec2 texCoord)` - 简单采样
- `sampleTextureWithGamma(sampler2D texture, vec2 texCoord, float gamma)` - 带伽马矫正

#### `getCommonUniformsSnippet(): string`

获取常见 Uniform 声明片段。

**包含声明**:
- `uniform sampler2D uMainTexture`
- `uniform vec3 uCameraPosition`
- `uniform float uTime`

#### `getScreenPositionSnippet(): string`

获取屏幕空间位置计算函数片段。

**函数签名**:
```glsl
vec2 getScreenPosition(vec4 clipPos)  // 返回 0-1 范围的屏幕坐标
```

## 实际用法示例

### 示例 1: 使用标准 Uniform 块

```typescript
import { ShaderUtils } from './utils';

// 生成着色器代码
const vertexShaderCode = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

${ShaderUtils.getTransformsBlock(0)}
${ShaderUtils.getLightingBlock(1)}

out vec3 vNormal;
out vec2 vTexCoord;
out vec3 vWorldPosition;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = mat3(uModelMatrix) * aNormal;
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;
```

### 示例 2: 计算 Uniform 缓冲区大小

```typescript
import { ShaderUtils } from './utils';

// 计算需要的缓冲区大小
const transformsSize = ShaderUtils.calculateUniformBlockSize([
  { name: 'uModelMatrix', type: 'mat4' },
  { name: 'uViewMatrix', type: 'mat4' },
  { name: 'uProjectionMatrix', type: 'mat4' },
]);

const transformBuffer = runner.track(
  runner.device.createBuffer({
    size: transformsSize,
    usage: MSpec.RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Transform Uniform Buffer',
  })
);
```

### 示例 3: 使用预定义着色器

```typescript
import { ShaderUtils } from './utils';

// 使用 Phong 着色器对
const { vertex, fragment } = ShaderUtils.phongShaders();

const vertexShader = device.createShaderModule({
  code: vertex,
  language: 'glsl',
  stage: MSpec.RHIShaderStage.VERTEX,
});

const fragmentShader = device.createShaderModule({
  code: fragment,
  language: 'glsl',
  stage: MSpec.RHIShaderStage.FRAGMENT,
});
```

## 最佳实践

### 1. 使用预定义的标准块

优先使用 `getTransformsBlock()`、`getLightingBlock()` 等预定义块，而不是手动编写，以确保正确的 std140 对齐。

### 2. 计算缓冲区大小

总是使用 `calculateUniformBlockSize()` 或 `calculateUniformBlockLayout()` 来计算缓冲区大小，避免手动计算导致的对齐错误。

### 3. 组合代码片段

使用代码片段库的函数组合自己的着色器，提高代码复用性：

```typescript
const fragmentShaderCode = `#version 300 es
precision mediump float;

in vec3 vNormal;
in vec2 vTexCoord;
in vec3 vWorldPosition;

uniform sampler2D uTexture;
${ShaderUtils.getLightingBlock(1)}

out vec4 fragColor;

${ShaderUtils.getLightingSnippet()}

void main() {
  vec4 texColor = texture(uTexture, vTexCoord);
  vec3 normal = normalize(vNormal);
  vec3 lighting = computeLighting(normal, ...);
  fragColor = vec4(texColor.rgb * lighting, texColor.a);
}
`;
```

### 4. 处理特殊类型对齐

特别注意 vec3 的特殊对齐规则（16 字节），使用 `calculateUniformBlockLayout()` 时会自动处理。

## 类型定义

### UniformField

```typescript
interface UniformField {
  name: string;
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'int' | 'uint' | 'bool';
  arraySize?: number;  // 数组大小，undefined 表示非数组
}
```

### UniformBlockDefinition

```typescript
interface UniformBlockDefinition {
  name: string;
  binding: number;
  fields: UniformField[];
}
```

### Std140LayoutInfo

```typescript
interface Std140LayoutInfo {
  fields: Std140FieldOffset[];
  totalSize: number;
  fieldMap: Map<string, Std140FieldOffset>;
}
```

## 文件结构

```
packages/rhi/demo/src/utils/shader/
├── index.ts           # 模块导出
├── types.ts           # 类型定义
└── ShaderUtils.ts     # 实现类
```

## 导入方式

```typescript
// 导入工具类
import { ShaderUtils } from './utils';

// 导入类型
import type { UniformField, UniformBlockDefinition } from './utils';
```

## 相关文档

- [MVP 矩阵实现架构](../architecture/mvp-matrix-implementation.md)
- [Push Constants 实现](./push-constants.md)
- [std140 布局规范](./push-constants.md#3-std140-布局规范)
