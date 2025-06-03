# RHI Demo 规范文档

## 概述

本文档定义了Maxellabs 3D Engine RHI (Rendering Hardware Interface) Demo的开发规范和标准。RHI Demo用于展示和测试渲染硬件抽象层的各种功能，包括基础渲染、高级特性和性能测试。

## 目录结构

```
packages/rhi/demo/
├── README.md              # 本规范文档
├── index.html            # Demo主页面，包含所有demo的导航
├── tsconfig.json         # TypeScript配置
├── html/                 # HTML页面文件
│   ├── index.html        # 详细的demo列表页面
│   ├── basic.html        # 基础渲染demo页面
│   ├── deferred.html     # 延迟渲染demo页面
│   ├── triangle.html     # 三角形demo页面
│   ├── texture.html      # 纹理demo页面
│   ├── lighting.html     # 光照demo页面
│   ├── shadow.html       # 阴影demo页面
│   ├── postprocess.html  # 后处理demo页面
│   └── performance.html  # 性能测试demo页面
├── src/                  # TypeScript源码文件
│   ├── basic.ts          # 基础渲染demo
│   ├── deferRender.ts    # 延迟渲染demo
│   ├── triangle.ts       # 三角形demo
│   ├── texture.ts        # 纹理demo
│   ├── lighting.ts       # 光照demo
│   ├── shadow.ts         # 阴影demo
│   ├── postprocess.ts    # 后处理demo
│   ├── performance.ts    # 性能测试demo
│   └── utils/            # 工具函数
│       ├── geometry.ts   # 几何体生成工具
│       ├── shader.ts     # 着色器工具
│       ├── texture.ts    # 纹理工具
│       └── camera.ts     # 相机控制工具
└── assets/               # 资源文件
    ├── textures/         # 纹理资源
    ├── models/           # 模型资源
    └── shaders/          # 着色器文件
```

## Demo分类

### 1. 基础功能Demo (Basic)
- **triangle.ts**: 最简单的三角形渲染
- **basic.ts**: 基础渲染功能展示
- **texture.ts**: 纹理映射和采样

### 2. 高级渲染Demo (Advanced)
- **lighting.ts**: 光照模型（Phong、PBR等）
- **shadow.ts**: 阴影映射技术
- **deferRender.ts**: 延迟渲染管线
- **postprocess.ts**: 后处理效果

### 3. 性能测试Demo (Performance)
- **performance.ts**: 渲染性能基准测试
- **instancing.ts**: 实例化渲染测试
- **batching.ts**: 批处理渲染测试

## Demo开发规范

### 1. 文件命名规范

- **HTML文件**: 使用小写字母和连字符，如 `basic.html`, `deferred-rendering.html`
- **TypeScript文件**: 使用camelCase命名，如 `basic.ts`, `deferRender.ts`
- **资源文件**: 使用小写字母和下划线，如 `checker_board.png`, `normal_map.jpg`

### 2. 代码结构规范

每个demo的TypeScript文件应遵循以下结构：

```typescript
// 1. 导入依赖
import type { ... } from '@maxellabs/core';
import { ... } from '@maxellabs/core';
import { ... } from '@maxellabs/math';

// 2. 常量定义
const CANVAS_ID = 'J-canvas';
const DEMO_NAME = 'Demo Name';

// 3. 全局变量
let device: WebGLDevice;
let canvas: HTMLCanvasElement;

// 4. 着色器源码
const vertexShaderSource = `...`;
const fragmentShaderSource = `...`;

// 5. 初始化函数
async function init(): Promise<void> {
  // 初始化设备和资源
}

// 6. 渲染循环
function render(): void {
  // 渲染逻辑
}

// 7. 事件处理
function setupEventHandlers(): void {
  // 事件监听器设置
}

// 8. 清理函数
function cleanup(): void {
  // 资源清理
}

// 9. 主函数
async function main(): Promise<void> {
  try {
    await init();
    setupEventHandlers();
    render();
  } catch (error) {
    console.error(`${DEMO_NAME} 初始化失败:`, error);
  }
}

// 10. 启动demo
main();
```

### 3. HTML页面规范

每个demo的HTML页面应包含：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Demo名称] - RHI Demo</title>
  <link rel="stylesheet" href="https://gw.alipayobjects.com/as/g/antui/antui/10.1.32/dpl/antui.css"/>
  <style>
    .container {
      width: 100vw;
      height: 100vh;
      background-color: #000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .controls {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 10px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <canvas id="J-canvas"></canvas>
  </div>
  
  <div class="controls">
    <h3>[Demo名称]</h3>
    <p>[Demo描述]</p>
    <!-- 控制面板 -->
  </div>
  
  <script type="module" src="../src/[demo-file].ts"></script>
</body>
</html>
```

### 4. 错误处理规范

- 所有异步操作必须使用try-catch包装
- 提供清晰的错误信息和调试信息
- 在控制台输出有意义的日志信息
- 优雅地处理设备不支持的功能

### 5. 性能规范

- 避免在渲染循环中创建新对象
- 合理使用缓冲区和纹理缓存
- 提供FPS显示和性能监控
- 支持不同质量级别的渲染

### 6. 交互规范

- 支持鼠标/触摸交互（旋转、缩放、平移）
- 提供键盘快捷键
- 包含控制面板用于调整参数
- 支持全屏模式

## 常见问题和最佳实践

### 1. Uniform缓冲区数据传递问题

**问题描述**: 在texture.ts开发过程中发现，uniform缓冲区的数据没有正确传递到GPU，导致着色器中的uniform值始终为0。

**根本原因**:
- 直接使用 `matrix.getElements()` 返回的Float32Array可能存在引用问题
- RHI系统的缓冲区更新可能需要新的Float32Array实例

**解决方案**:
```typescript
// ❌ 错误的方式 - 直接使用getElements()
resources.modelMatrixBuffer.update(resources.modelMatrix.getElements());

// ✅ 正确的方式 - 创建新的Float32Array
resources.modelMatrixBuffer.update(new Float32Array(resources.modelMatrix.getElements()));
```

**最佳实践**:
1. 始终使用 `new Float32Array()` 包装矩阵数据
2. 确保在初始化时就设置所有uniform的初始值
3. 使用WebGL调试工具验证uniform值是否正确传递

### 2. 绑定组布局配置问题

**问题描述**: 使用字符串形式的visibility会导致绑定失败。

**解决方案**:
```typescript
// ❌ 错误的方式
{
  binding: 0,
  visibility: 'vertex',  // 字符串形式
  buffer: { type: 'uniform' }
}

// ✅ 正确的方式
{
  binding: 0,
  visibility: RHIShaderStage.VERTEX,  // 使用枚举常量
  buffer: { type: 'uniform' }
}
```

**最佳实践**:
1. 导入并使用 `RHIShaderStage` 枚举
2. 参考 `basic.ts` 等成功案例的实现方式
3. 确保绑定组布局与着色器中的uniform声明一致

### 3. 调试技巧

**WebGL调试工具使用**:
1. 使用Spector.js等工具进行抓帧分析
2. 检查uniform值是否正确传递
3. 验证纹理绑定和采样器设置
4. 监控WebGL命令执行序列

**控制台调试**:
```typescript
// 添加调试信息
console.info('矩阵数据:', Array.from(matrix.getElements()));
console.info('Uniform值:', uniformValue);

// 定期输出状态
if (frameCount % 60 === 0) {
  console.info(`帧数: ${frameCount}, 时间: ${currentTime}`);
}
```

### 4. 渲染管线问题排查

**常见问题检查清单**:
- [ ] 所有required导入是否正确
- [ ] 绑定组布局是否使用正确的枚举值
- [ ] uniform缓冲区是否使用new Float32Array包装
- [ ] 初始化时是否设置了所有uniform的初始值
- [ ] 着色器源码是否与绑定组布局匹配
- [ ] 纹理和采样器是否正确绑定

### 5. copyTextureToCanvas问题

**问题描述**: copyTextureToCanvas显示的是原始纹理而不是渲染结果。

**可能原因**:
1. 渲染目标纹理没有正确设置
2. 片段着色器输出有问题
3. uniform值传递失败导致着色器逻辑错误

**排查步骤**:
```typescript
// 1. 验证渲染目标纹理配置
const renderTargetTexture = device.createTexture({
  width: canvas.width,
  height: canvas.height,
  format: RHITextureFormat.RGBA8_UNORM,
  usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,  // 必须包含SAMPLED
  dimension: '2d',
});

// 2. 确认渲染通道配置
const renderPassDescriptor = {
  colorAttachments: [{
    view: renderTargetTexture.createView(),  // 渲染到正确的纹理
    loadOp: 'clear' as const,
    storeOp: 'store' as const,
    clearColor: [0, 0, 0, 1.0] as [number, number, number, number],
  }],
};

// 3. 验证copyTextureToCanvas调用
commandEncoder.copyTextureToCanvas({
  source: renderTargetTexture.createView(),  // 确保使用正确的源纹理
  destination: canvas,
});
```

**最佳实践**:
1. 先确保uniform值正确传递
2. 使用简化的片段着色器测试基本功能
3. 逐步添加复杂的渲染效果

## 着色器规范

### 1. 着色器命名
- 使用描述性名称，如 `BasicVertexShader`, `PBRFragmentShader`
- 在着色器源码中添加注释说明功能

### 2. 着色器结构
```glsl
#version 300 es
precision highp float;

// 输入变量
in vec3 aPosition;
in vec2 aTexCoord;

// 输出变量
out vec2 vTexCoord;

// Uniform变量
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  // 主要逻辑
}
```

### 3. Uniform管理
- 使用Uniform缓冲区对象(UBO)管理相关的uniform
- 按功能分组uniform（相机、材质、光照等）
- 提供uniform更新的工具函数

## 资源管理规范

### 1. 纹理资源
- 支持多种格式（PNG、JPG、HDR等）
- 提供纹理生成工具（程序化纹理）
- 实现纹理缓存和复用机制

### 2. 几何体资源
- 提供基础几何体生成器（立方体、球体、平面等）
- 支持模型文件加载（OBJ、GLTF等）
- 实现几何体优化和LOD

### 3. 着色器资源
- 支持着色器文件加载和编译
- 提供着色器变体管理
- 实现着色器热重载（开发模式）

## 测试规范

### 1. 功能测试
- 每个demo必须在主流浏览器中测试
- 验证不同设备和分辨率的兼容性
- 测试错误处理和边界情况

### 2. 性能测试
- 提供帧率监控
- 测试内存使用情况
- 验证GPU利用率

### 3. 视觉测试
- 提供参考图像对比
- 验证渲染结果的正确性
- 测试不同光照条件下的表现

## 文档规范

### 1. 代码注释
- 所有公共函数必须有JSDoc注释
- 复杂算法需要详细的实现说明
- 着色器代码需要中文注释

### 2. README文件
- 每个demo需要独立的说明文档
- 包含技术要点和实现细节
- 提供相关资源和参考链接

### 3. API文档
- 使用TypeDoc生成API文档
- 保持文档与代码同步更新
- 提供使用示例和最佳实践

## 发布规范

### 1. 版本管理
- 遵循语义化版本控制
- 维护CHANGELOG记录变更
- 标记重要的里程碑版本

### 2. 构建流程
- 使用TypeScript编译检查
- 运行ESLint代码检查
- 执行自动化测试

### 3. 部署要求
- 支持静态文件部署
- 提供CDN加速访问
- 确保HTTPS安全访问

## 贡献指南

### 1. 开发流程
1. Fork项目仓库
2. 创建功能分支
3. 开发并测试demo
4. 提交Pull Request
5. 代码审查和合并

### 2. 代码规范
- 遵循项目的ESLint配置
- 使用Prettier格式化代码
- 编写单元测试和集成测试

### 3. 提交规范
- 使用约定式提交格式
- 提供清晰的提交信息
- 关联相关的Issue编号

---

## 更新日志

- **v1.0.0** (2024-01-01): 初始版本，建立基础规范
- **v1.1.0** (2024-01-15): 添加性能测试规范
- **v1.2.0** (2024-02-01): 完善着色器和资源管理规范 

## RHI渲染流程详解

### 概述

RHI（Render Hardware Interface，渲染硬件接口）是Maxellabs 3D Engine的核心渲染抽象层，提供了统一的API来支持多种渲染后端（WebGL、WebGL2、WebGPU等）。本章节详细介绍RHI的完整渲染流程。

### 渲染流程架构

RHI渲染流程采用现代图形API的设计理念，基于命令编码器模式：

```
初始化阶段 → 渲染循环 → 资源清理
    ↓           ↓          ↓
  设备创建    命令录制    资源销毁
  资源准备    命令提交    内存释放
  管线配置    显示呈现    
```

### 详细渲染流程

#### 阶段1：初始化阶段

##### 1.1 设备创建
```typescript
// 创建RHI设备，选择合适的渲染后端
const device = new WebGLDevice(canvas);
```

##### 1.2 着色器创建
```typescript
// 创建顶点着色器
const vertexShader = device.createShaderModule({
  code: vertexShaderSource,
  language: 'glsl',
  stage: 'vertex',
});

// 创建片段着色器
const fragmentShader = device.createShaderModule({
  code: fragmentShaderSource,
  language: 'glsl', 
  stage: 'fragment',
});
```

##### 1.3 几何数据准备
```typescript
// 定义顶点数据
const vertices = new Float32Array([...]);

// 创建顶点缓冲区
const vertexBuffer = device.createBuffer({
  size: vertices.byteLength,
  usage: RHIBufferUsage.VERTEX,
  initialData: vertices,
});
```

##### 1.4 顶点布局定义
```typescript
// 描述顶点数据结构
const vertexLayout: RHIVertexLayout = {
  buffers: [{
    stride: 24, // 每个顶点的字节数
    attributes: [
      { name: 'aPosition', format: RHIVertexFormat.FLOAT32X3, offset: 0 },
      { name: 'aColor', format: RHIVertexFormat.FLOAT32X3, offset: 12 },
    ],
  }],
};
```

##### 1.5 资源绑定设置
```typescript
// 创建绑定组布局
const bindGroupLayout = device.createBindGroupLayout([
  { binding: 0, visibility: 'vertex', buffer: { type: 'uniform' } },
  { binding: 1, visibility: 'fragment', texture: { sampleType: 'float', viewDimension: '2d' } },
]);

// 创建绑定组
const bindGroup = device.createBindGroup(bindGroupLayout, [
  { binding: 0, resource: { buffer: uniformBuffer } },
  { binding: 1, resource: textureView },
]);
```

##### 1.6 渲染管线创建
```typescript
// 创建渲染管线
const renderPipeline = device.createRenderPipeline({
  vertexShader,
  fragmentShader,
  vertexLayout,
  primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
  layout: pipelineLayout,
});
```

#### 阶段2：渲染循环

##### 2.1 命令编码器创建
```typescript
// 创建命令编码器，用于记录渲染命令
const commandEncoder = device.createCommandEncoder('Frame Render');
```

##### 2.2 渲染通道配置
```typescript
// 配置渲染通道
const renderPassDescriptor = {
  colorAttachments: [{
    view: renderTargetTexture.createView(),
    loadOp: 'clear',
    storeOp: 'store', 
    clearColor: [0.1, 0.1, 0.1, 1.0],
  }],
};
```

##### 2.3 渲染命令录制
```typescript
// 开始渲染通道
const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);

// 设置渲染管线
renderPass.setPipeline(renderPipeline);

// 绑定顶点数据
renderPass.setVertexBuffer(0, vertexBuffer);

// 绑定资源
renderPass.setBindGroup(0, bindGroup);

// 执行绘制
renderPass.draw(vertexCount);

// 结束渲染通道
renderPass.end();
```

##### 2.4 结果输出
```typescript
// 拷贝渲染结果到画布
commandEncoder.copyTextureToCanvas({
  source: renderTargetTexture.createView(),
  destination: canvas,
});
```

##### 2.5 命令提交
```typescript
// 提交命令给GPU执行
device.submit([commandEncoder.finish()]);
```

#### 阶段3：资源清理

```typescript
// 销毁资源
vertexBuffer.destroy();
renderPipeline.destroy();
device.destroy();
```

### 渲染流程特点

#### 命令缓冲模式
- **延迟执行**：渲染命令先记录，后统一提交
- **批量处理**：多个命令可以批量提交，提高效率
- **状态隔离**：每个命令编码器是独立的状态容器

#### 资源绑定模型
- **绑定组**：将相关资源（缓冲区、纹理、采样器）组合
- **布局匹配**：绑定组必须与着色器期望的布局匹配
- **高效切换**：预创建的绑定组可以快速切换

#### 渲染通道设计
- **明确边界**：每个渲染通道有明确的开始和结束
- **资源管理**：自动处理渲染目标的加载和存储
- **并行友好**：不同渲染通道可以并行录制

### 性能优化要点

#### 资源复用
- 尽量复用缓冲区和纹理
- 避免频繁创建和销毁资源
- 使用对象池管理临时资源

#### 批量绘制
- 合并相似的绘制调用
- 使用实例化渲染减少绘制次数
- 动态批处理相同材质的物体

#### 状态排序
- 按渲染状态对绘制调用排序
- 减少状态切换开销
- 优先使用绑定组切换而非管线切换

#### 内存管理
- 及时更新动态缓冲区
- 避免不必要的数据拷贝
- 使用合适的缓冲区使用标志

### Demo中的实现示例

#### 三角形Demo（基础流程）
1. **几何创建**：定义三角形顶点（位置+颜色）
2. **着色器编译**：顶点变换 + 颜色插值
3. **管线配置**：基础渲染状态
4. **绘制执行**：简单的draw调用

#### 纹理Demo（高级功能）
1. **纹理生成**：程序化生成棋盘格和渐变纹理
2. **uniform管理**：矩阵变换和动画参数
3. **资源绑定**：多纹理和采样器组合
4. **动画渲染**：实时更新和混合效果

### 扩展性设计

RHI设计支持未来扩展：

#### 多后端支持
- **WebGL/WebGL2**：当前主要目标
- **WebGPU**：现代浏览器的新标准
- **原生后端**：DirectX、OpenGL、Vulkan等

#### 高级特性
- **计算着色器**：通用GPU计算
- **几何着色器**：顶点生成和变换
- **细分着色器**：动态几何细分
- **光线追踪**：硬件加速光线追踪

#### 优化功能
- **多线程渲染**：并行命令录制
- **GPU驱动渲染**：减少CPU开销
- **自适应质量**：根据性能动态调整

这种设计确保了RHI既能满足当前需求，又具备未来扩展的灵活性。 