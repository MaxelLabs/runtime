# RHI 基础渲染 Demo 实现需求调研报告

## 1. 当前 Demo 结构分析

### 1.1 已有 Demo 概览

| Demo名称 | 文件 | 功能 | 特点 |
|---------|------|------|------|
| triangle | triangle.ts | 最简单的三角形渲染 | 基础渲染流程，MVP变换，顶点颜色 |
| rotating-cube | rotating-cube.ts | 旋转立方体 | 3D变换、纹理、光照、GUI、相机控制 |
| quad-indexed | quad-indexed.ts | 索引缓冲区绘制 | 顶点复用，索引绘制 |
| primitive-types | primitive-types.ts | 图元拓扑类型 | 点/线/三角形绘制 |
| viewport-scissor | viewport-scissor.ts | 视口和裁剪矩形 | 多视口渲染，裁剪测试 |
| blend-modes | blend-modes.ts | 混合模式 | 各种混合模式，支持纹理和MVP变换 |

### 1.2 通用代码模式

#### 必需组件（自 2025-12-10 起新增）
1. **DemoRunner 初始化**
```typescript
const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'Demo Name',
  clearColor: [0.1, 0.1, 0.1, 1.0],
});
await runner.init();
```

2. **Stats 性能监控**
```typescript
const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
```

3. **OrbitController 相机控制**
```typescript
const orbit = new OrbitController(runner.canvas, {
  distance: 3,
  target: [0, 0, 0],
  enableDamping: true,
});
```

4. **MVP 矩阵变换**
```typescript
// 渲染循环中
orbit.update(dt);
const viewMatrix = orbit.getViewMatrix();
const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);

// 更新 Transform Uniform
const transformData = new Float32Array(64);
transformData.set(modelMatrix.toArray(), 0);
transformData.set(viewMatrix, 16);
transformData.set(projMatrix, 32);
transformBuffer.update(transformData, 0);
```

#### 着色器标准格式
```glsl
// 顶点着色器必须包含 Transforms uniform 块
uniform Transforms {
  mat4 uModelMatrix;
  mat4 uViewMatrix;
  mat4 uProjectionMatrix;
};

// 使用 MVP 变换
gl_Position = uProjectionMatrix * uViewMatrix * (uModelMatrix * vec4(aPosition, 1.0));
```

#### 渲染循环标准结构
```typescript
runner.start((dt) => {
  orbit.update(dt);
  stats.begin();

  const { encoder, passDescriptor } = runner.beginFrame();
  // 渲染代码...
  runner.endFrame(encoder);

  stats.end();
});
```

### 1.3 工具库使用模式

#### GeometryGenerator
- `triangle({ colors: true })` - 生成带颜色的三角形
- `quad({ uvs: true, colors: true })` - 生成带UV和颜色的四边形
- `cube({ normals: true, uvs: true })` - 生成带法线和UV的立方体
- 支持多种几何体：sphere、torus、cone、cylinder、capsule

#### 缓冲区创建模式
```typescript
const vertexBuffer = runner.track(
  runner.device.createBuffer({
    size: geometry.vertices.byteLength,
    usage: MSpec.RHIBufferUsage.VERTEX,
    hint: 'static',
    initialData: geometry.vertices as BufferSource,
  })
);
```

#### 着色器和管线创建
```typescript
const shader = runner.track(
  runner.device.createShaderModule({
    code: shaderSource,
    language: 'glsl',
    stage: MSpec.RHIShaderStage.VERTEX,
  })
);

const pipeline = runner.track(
  runner.device.createRenderPipeline({
    vertexShader,
    fragmentShader,
    vertexLayout: geometry.layout,
    primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
    layout: pipelineLayout,
  })
);
```

### 1.4 文件组织结构
```
demo/src/
├── triangle.ts              # 基础三角形
├── rotating-cube.ts         # 完整功能演示
├── quad-indexed.ts          # 索引绘制
├── primitive-types.ts       # 图元类型
├── viewport-scissor.ts      # 视口裁剪
├── blend-modes.ts           # 混合模式
└── utils/                   # 工具库
    ├── index.ts
    ├── core/
    ├── geometry/
    ├── texture/
    ├── camera/
    ├── ui/
    └── shader/
```

## 2. 待实现基础渲染 Demo 分析

### 2.1 colored-triangle（顶点颜色）

#### 实现要点
- **验证功能**：顶点颜色属性使用
- **复用基础**：可基于 triangle.ts 修改
- **RHI特性**：RHIVertexFormat.FLOAT32x3 颜色属性
- **WebGL要求**：WebGL 2.0 基础功能

#### 技术实现
```typescript
// 生成带颜色的三角形
const geometry = GeometryGenerator.triangle({ colors: true });

// 着色器中需要 aColor 属性
in vec3 aColor;
out vec3 vColor;
vColor = aColor;

// 片段着色器输出顶点颜色
fragColor = vec4(vColor, 1.0);
```

#### 所需工具
- GeometryGenerator.triangle() 已支持颜色
- 标准 MVP 变换
- OrbitController 相机控制
- Stats 性能监控

### 2.2 multiple-buffers（多顶点缓冲区）

#### 实现要点
- **验证功能**：多个顶点缓冲区的分离使用
- **RHI特性**：多个 setVertexBuffer() 调用
- **WebGL要求**：WebGL 2.0 多缓冲区支持
- **应用场景**：位置、法线、UV 等属性分离存储

#### 技术实现
```typescript
// 创建多个缓冲区
const positionBuffer = runner.track(...);
const normalBuffer = runner.track(...);
const uvBuffer = runner.track(...);

// 渲染时分别设置
renderPass.setVertexBuffer(0, positionBuffer);
renderPass.setVertexBuffer(1, normalBuffer);
renderPass.setVertexBuffer(2, uvBuffer);

// 顶点布局需要配置多个缓冲区
vertexLayout: {
  buffers: [
    { index: 0, stride: 12, stepMode: 'vertex', attributes: [...] },
    { index: 1, stride: 12, stepMode: 'vertex', attributes: [...] },
    { index: 2, stride: 8, stepMode: 'vertex', attributes: [...] },
  ]
}
```

#### 所需工具
- GeometryGenerator 需要分离属性的选项
- 复杂的顶点布局配置
- 多缓冲区管理

### 2.3 dynamic-buffer（缓冲区动态更新）

#### 实现要点
- **验证功能**：缓冲区数据的动态更新
- **RHI特性**：buffer.update() 方法使用
- **WebGL要求**：WebGL 2.0 动态缓冲区
- **应用场景**：动画、变形、粒子系统

#### 技术实现
```typescript
// 创建动态缓冲区
const dynamicBuffer = runner.track(
  runner.device.createBuffer({
    size: vertexCount * 12, // 位置数据大小
    usage: MSpec.RHIBufferUsage.VERTEX,
    hint: 'dynamic', // 动态更新
  })
);

// 每帧更新数据
const newData = new Float32Array(...); // 计算新位置
dynamicBuffer.update(newData, 0);

// 渲染时使用
renderPass.setVertexBuffer(0, dynamicBuffer);
```

#### 所需工具
- 动态数据生成（例如：旋转动画）
- 性能优化（避免每帧全量更新）
- OrbitController 相机控制

### 2.4 vertex-formats（各种顶点格式）

#### 实现要点
- **验证功能**：不同的顶点数据格式
- **RHI特性**：RHIVertexFormat 枚举的各种格式
- **WebGL要求**：WebGL 2.0 支持的各种格式
- **应用场景**：优化内存使用、特殊数据类型

#### 技术实现
```typescript
// 各种顶点格式示例
const formats = [
  { name: 'FLOAT32x3', format: MSpec.RHIVertexFormat.FLOAT32x3 },
  { name: 'FLOAT32x4', format: MSpec.RHIVertexFormat.FLOAT32x4 },
  { name: 'UINT16x2', format: MSpec.RHIVertexFormat.UINT16x2 },
  { name: 'UNORM8x4', format: MSpec.RHIVertexFormat.UNORM8x4 },
  // 更多格式...
];

// 为每种格式创建几何体和渲染
```

#### 所需工具
- 支持多种格式的几何体生成器
- 格式转换工具
- 内存使用对比展示

### 2.5 depth-test（深度测试）

#### 实现要点
- **验证功能**：深度测试的开启和关闭
- **RHI特性**：depthStencilState 配置
- **WebGL要求**：WebGL 2.0 深度测试
- **应用场景**：3D 物体的正确遮挡关系

#### 技术实现
```typescript
// 创建带有深度状态的管线
const pipeline = runner.track(
  runner.device.createRenderPipeline({
    // ...其他配置
    depthStencilState: {
      format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
      depthWriteEnabled: true,
      depthCompare: MSpec.RHCICompareFunction.LESS,
    },
  })
);

// 渲染通道需要深度附件
const passDescriptor = {
  colorAttachments: [colorAttachment],
  depthAttachment: {
    view: depthTexture.createView(),
    depthClearValue: 1.0,
    depthLoadOp: 'clear',
    depthStoreOp: 'store',
  },
};
```

#### 所需工具
- 深度纹理管理
- 多个 3D 物体的场景
- GUI 控制深度测试开关

### 2.6 stencil-test（模板测试）

#### 实现要点
- **验证功能**：模板测试的使用
- **RHI特性**：depthStencilState 模板配置
- **WebGL要求**：WebGL 2.0 模板测试
- **应用场景**：阴影、轮廓、遮罩效果

#### 技术实现
```typescript
// 创建带有模板状态的管线
const pipeline = runner.track(
  runner.device.createRenderPipeline({
    // ...其他配置
    depthStencilState: {
      format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
      depthWriteEnabled: true,
      depthCompare: MSpec.RHCICompareFunction.LESS,
      stencilFront: {
        compare: MSpec.RHCICompareFunction.ALWAYS,
        depthFailOp: MSpec.RHIStencilOperation.KEEP,
        failOp: MSpec.RHIStencilOperation.KEEP,
        passOp: MSpec.RHIStencilOperation.REPLACE,
      },
      stencilBack: {
        compare: MSpec.RHCICompareFunction.ALWAYS,
        depthFailOp: MSpec.RHIStencilOperation.KEEP,
        failOp: MSpec.RHIStencilOperation.KEEP,
        passOp: MSpec.RHIStencilOperation.REPLACE,
      },
      stencilReadMask: 0xff,
      stencilWriteMask: 0xff,
    },
  })
);
```

#### 所需工具
- 模板纹理管理
- 复杂的模板操作示例
- GUI 控制模板测试参数

## 3. 技术要求总结

### 3.1 MVP 矩阵系统集成
- 所有 Demo 必须支持完整的 Model-View-Projection 变换
- 使用 OrbitController 进行相机控制
- Transform uniform 块必须包含 uModelMatrix、uViewMatrix、uProjectionMatrix

### 3.2 性能监控
- 每个 Demo 必须包含 Stats 性能面板
- 位置：左上角（'top-left'）
- 显示：FPS 和帧时间（['fps', 'ms']）

### 3.3 交互控制
- ESC 键：退出 Demo
- F11 键：切换全屏
- 鼠标控制：左键旋转、滚轮缩放、右键平移

### 3.4 UI 布局
- 左下角：Info Panel，显示 Demo 介绍和技术要点
- 可选：GUI 控制面板（用于调整参数）

### 3.5 WebGL 扩展要求
- 所有 Demo 应在 WebGL 2.0 基础上实现
- 不需要额外的 WebGL 扩展
- 利用标准的 WebGL 2.0 功能

### 3.6 文件命名和位置
- 文件名：小写连字符格式（如 colored-triangle.ts）
- 位置：packages/rhi/demo/src/
- 导入：统一从 './utils' 导入工具库

## 4. 实现优先级建议

### 第一优先级（基础功能）
1. **colored-triangle** - 简单扩展，展示顶点颜色
2. **depth-test** - 3D 渲染必需功能

### 第二优先级（进阶功能）
3. **multiple-buffers** - 展示多缓冲区使用
4. **dynamic-buffer** - 动态数据更新

### 第三优先级（高级功能）
5. **vertex-formats** - 格式多样性
6. **stencil-test** - 模板测试

## 5. 注意事项

1. **复用现有代码**：尽量复用 triangle.ts 和 rotating-cube.ts 的代码
2. **性能考虑**：动态缓冲区更新时注意性能优化
3. **错误处理**：包含完整的错误处理和用户友好的错误信息
4. **资源管理**：使用 runner.track() 自动管理资源生命周期
5. **文档完善**：每个 Demo 的注释要清晰说明功能和技术要点

---

## 代码参考路径

- DemoRunner：`packages/rhi/demo/src/utils/core/DemoRunner.ts`
- GeometryGenerator：`packages/rhi/demo/src/utils/geometry/GeometryGenerator.ts`
- OrbitController：`packages/rhi/demo/src/utils/camera/OrbitController.ts`
- Stats：`packages/rhi/demo/src/utils/ui/Stats.ts`
- MSpec 枚举：`packages/specification/src/common/rhi/types/enums.ts`
- triangle.ts：`packages/rhi/demo/src/triangle.ts`
- rotating-cube.ts：`packages/rhi/demo/src/rotating-cube.ts`