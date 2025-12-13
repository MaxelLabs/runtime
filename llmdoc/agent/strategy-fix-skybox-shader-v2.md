# Strategy: Fix Skybox Shader Implementation Issues (COMPLETED)

## 1. Analysis
* **Context:** 仔细检查 `cubemap-skybox.ts` 代码后，发现以下问题：
  1. **Uniform Block 不匹配**：着色器中定义了 `Transforms` Uniform Block，但 JavaScript 代码中只上传了 3 个矩阵（48 floats），而 std140 布局下每个 mat4 需要 16 个元素，总共需要 48 元素，这部分是正确的
  2. **创建 BindGroup 时缺少 sampler 绑定**：BindGroupLayout 定义了 4 个绑定，但在创建 BindGroup 时（第 301-308 行）缺少了 sampler 的绑定
  3. **Texture createView 参数问题**：第 305 行创建 cube view 时可能需要指定正确的 dimension
* **风险:** Uniform buffer 大小不匹配和绑定组不完整会导致运行时错误或渲染异常。

## 2. Assessment
<Assessment>
**Complexity:** High
**Impacted Layers:** Shaders (GLSL), Uniform Buffers, Bind Groups, Pipeline State
</Assessment>

## 3. The Plan
<ExecutionPlan>
**Block 1: 修复 Uniform Buffer 数据布局**
1. 修正 transform 数据上传（第 357-361 行）：
   - 当前代码正确创建了 48 个元素的 Float32Array
   - 正确设置了 3 个矩阵的数据
   - **无需修改**，这部分实现是正确的

2. 验证 Params buffer 大小：
   - 当前：16 bytes（4 floats）
   - std140 布局下：4 个 float = 16 bytes，正确
   - **无需修改**，这部分实现是正确的

**Block 2: 修复 BindGroup 创建**
1. 在创建 BindGroup 时添加 sampler 绑定（第 301-308 行）：
   - 当前只有 4 个资源绑定
   - 但 BindGroupLayout 定义了 4 个绑定点
   - 检查 sampler 对象是否在绑定数组中
   - 如果缺少，需要添加 `{ binding: 3, resource: sampler }`

2. 修复后的 BindGroup 创建应该是：
```typescript
const bindGroup = runner.track(
  runner.device.createBindGroup(bindGroupLayout, [
    { binding: 0, resource: { buffer: transformBuffer } },
    { binding: 1, resource: { buffer: paramsBuffer } },
    { binding: 2, resource: cubeTexture.createView({ dimension: 'cube' }) },
    { binding: 3, resource: sampler },  // 确保这行存在
  ])
);
```

**Block 3: 修复 Texture View 创建**
1. 确保创建 cube texture view 时指定正确的 dimension（第 305 行）：
   - `cubeTexture.createView({ dimension: 'cube' })` 应该是正确的
   - 如果类型错误，可能需要使用 `MSpec.RHITextViewDimension.CUBE` 或类似常量

**Block 4: 修复潜在的 TypeScript 类型错误**
1. 检查 MSpec.RHI* 枚举值：
   - 确保 `MSpec.RHITextureFormat.RGBA8_UNORM` 存在
   - 确保 `MSpec.RHITextureUsage.TEXTURE_BINDING | MSpec.RHITextureUsage.COPY_DST` 有效
   - 确保 `MSpec.RHIFilterMode.LINEAR` 存在

2. 如果某些枚举值不存在，需要：
   - 查找正确的枚举名称
   - 或者使用字符串值（如果 API 允许）

**Block 5: 添加错误处理和调试**
1. 在着色器创建后添加编译错误检查：
```typescript
const vertexShader = runner.track(
  runner.device.createShaderModule({
    code: vertexShaderSource,
    language: 'glsl',
    stage: MSpec.RHIShaderStage.VERTEX,
    label: 'Skybox Vertex Shader',
  })
);

// 检查编译错误
const vertexInfo = vertexShader.getCompilationInfo();
if (vertexInfo.messages.length > 0) {
  console.error('Vertex shader compilation errors:', vertexInfo.messages);
}
```

2. 同样为 fragment shader 添加错误检查

**关键问题诊断：**
- 最可能的问题是 BindGroup 创建时缺少 sampler 绑定
- 其次是 MSpec 类型定义可能不完整或有变化
- 着色器代码本身看起来是正确的，Uniform Block 定义也是正确的

**优先级：**
1. 首先修复 BindGroup 创建，确保所有 4 个绑定点都被正确绑定
2. 然后检查并修复任何 TypeScript 类型错误
3. 最后添加错误处理以便未来调试
</ExecutionPlan>