# RHI Demo 规范文档

## 概述

本文档定义了Maxellabs 3D Engine RHI (Rendering Hardware Interface) Demo的开发规范和标准。RHI Demo用于展示和测试渲染硬件抽象层的各种功能，包括基础渲染、高级特性和性能测试。

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
  buffers: [
    {
      stride: 24, // 每个顶点的字节数
      attributes: [
        { name: 'aPosition', format: RHIVertexFormat.FLOAT32X3, offset: 0 },
        { name: 'aColor', format: RHIVertexFormat.FLOAT32X3, offset: 12 },
      ],
    },
  ],
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
  colorAttachments: [
    {
      view: renderTargetTexture.createView(),
      loadOp: 'clear',
      storeOp: 'store',
      clearColor: [0.1, 0.1, 0.1, 1.0],
    },
  ],
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
