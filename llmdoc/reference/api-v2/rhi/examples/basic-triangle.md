# 基础三角形渲染示例

这是最简单的RHI渲染示例，展示如何创建一个彩色三角形。

## 完整代码

```typescript
import { WebGLDevice, BufferUsage, VertexFormat, PrimitiveTopology } from '@maxellabs/rhi';
import { Vec3 } from '@maxellabs/math';

// 顶点着色器
const vertexShaderSource = `
  struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) color: vec3<f32>,
  }

  struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) color: vec3<f32>,
  }

  @vertex
  fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.clip_position = vec4<f32>(input.position, 1.0);
    output.color = input.color;
    return output;
  }
`;

// 片元着色器
const fragmentShaderSource = `
  @fragment
  fn main(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
    return vec4<f32>(color, 1.0);
  }
`;

class BasicTriangle {
  private device: WebGLDevice;
  private pipeline: RenderPipeline;
  private vertexBuffer: Buffer;

  constructor(canvas: HTMLCanvasElement) {
    // 初始化设备
    this.device = new WebGLDevice(canvas);

    // 创建顶点数据
    const vertices = new Float32Array([
      // 位置              // 颜色
      0.0,  0.5, 0.0,     1.0, 0.0, 0.0,  // 顶部 - 红色
     -0.5, -0.5, 0.0,     0.0, 1.0, 0.0,  // 左侧 - 绿色
      0.5, -0.5, 0.0,     0.0, 0.0, 1.0,  // 右侧 - 蓝色
    ]);

    // 创建顶点缓冲区
    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: BufferUsage.Vertex,
      mappedAtCreation: true,
      data: vertices
    });

    // 编译着色器
    const vertexShader = this.device.createShader({
      code: vertexShaderSource
    });
    const fragmentShader = this.device.createShader({
      code: fragmentShaderSource
    });

    // 创建渲染管线
    this.pipeline = this.device.createRenderPipeline({
      label: 'Basic Triangle Pipeline',
      vertex: {
        module: vertexShader,
        entryPoint: 'main',
        buffers: [{
          arrayStride: 24, // 每个顶点 24 字节 (6个float32)
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: VertexFormat.Float32x3 // position
            },
            {
              shaderLocation: 1,
              offset: 12,
              format: VertexFormat.Float32x3 // color
            }
          ]
        }]
      },
      fragment: {
        module: fragmentShader,
        entryPoint: 'main',
        targets: [{
          format: TextureFormat.RGBA8Unorm
        }]
      },
      primitive: {
        topology: PrimitiveTopology.TriangleList
      }
    });
  }

  render() {
    // 创建命令编码器
    const commandEncoder = this.device.createCommandEncoder();

    // 开始渲染通道
    const textureView = this.device.getContext().getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
        loadOp: LoadOp.Clear,
        storeOp: StoreOp.Store
      }]
    });

    // 设置渲染状态
    renderPass.setPipeline(this.pipeline);
    renderPass.setVertexBuffer(0, this.vertexBuffer);

    // 绘制三角形
    renderPass.draw(3);
    renderPass.end();

    // 提交命令
    const commandBuffer = commandEncoder.finish();
    this.device.submit(commandBuffer);
  }

  dispose() {
    this.vertexBuffer.destroy();
  }
}

// 使用示例
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const triangle = new BasicTriangle(canvas);

// 渲染循环
function frame() {
  triangle.render();
  requestAnimationFrame(frame);
}

frame();

// 清理资源
window.addEventListener('unload', () => {
  triangle.dispose();
});
```

## 关键点说明

### 1. 顶点数据布局
- 每个顶点包含位置（3个float）和颜色（3个float）
- 总共24字节（6 × 4字节）
- 使用 `arrayStride` 定义步长

### 2. 属性映射
- `shaderLocation`: 着色器中的属性位置
- `offset`: 在顶点缓冲区中的字节偏移
- `format`: 数据格式类型

### 3. 渲染流程
1. 创建设备和资源
2. 编译着色器
3. 创建渲染管线
4. 设置渲染状态
5. 执行绘制命令
6. 提交命令缓冲区

### 4. 资源管理
- 记得在不需要时释放资源
- 使用 `mappedAtCreation` 在创建时上传数据
- 清晰值和加载/存储操作

## 变体示例

### 使用索引绘制

```typescript
// 顶点数据（去重）
const vertices = new Float32Array([
  // 位置              // 颜色
  0.0,  0.5, 0.0,     1.0, 0.0, 0.0,  // 顶部 - 红色
 -0.5, -0.5, 0.0,     0.0, 1.0, 0.0,  // 左侧 - 绿色
  0.5, -0.5, 0.0,     0.0, 0.0, 1.0,  // 右侧 - 蓝色
]);

// 索引数据
const indices = new Uint16Array([0, 1, 2]);

// 创建索引缓冲区
const indexBuffer = this.device.createBuffer({
  size: indices.byteLength,
  usage: BufferUsage.Index,
  mappedAtCreation: true,
  data: indices
});

// 在渲染时
renderPass.setIndexBuffer(indexBuffer);
renderPass.drawIndexed(3); // 使用索引绘制
```

### 动态颜色

```typescript
// 使用uniform传递时间
const uniformBuffer = this.device.createBuffer({
  size: 16, // 一个vec4
  usage: BufferUsage.Uniform | BufferUsage.CopyDst
});

// 在着色器中使用
const vertexShaderSource = `
  struct Uniforms {
    time: f32,
  }

  @group(0) @binding(0) var<uniform> uniforms: Uniforms;

  @vertex
  fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
    // 简单的摆动效果
    let wave = sin(uniforms.time) * 0.1;
    return vec4<f32>(position.x + wave, position.y, position.z, 1.0);
  }
`;

// 更新uniform
function updateUniforms(time: number) {
  const data = new Float32Array([time, 0, 0, 0]);
  this.device.queue.writeBuffer(uniformBuffer, 0, data);
}
```

## 性能提示

1. **批量渲染**: 对于多个三角形，使用索引缓冲区
2. **静态数据**: 对于不改变的数据，使用 `mappedAtCreation`
3. **动态数据**: 对于频繁更新的数据，使用 `writeBuffer`
4. **资源复用**: 创建资源后尽量复用，避免频繁创建销毁

## 下一步

- [添加纹理](./textured-quad.md)
- [变换和动画](./transform-animation.md)
- [实例化渲染](./instanced-rendering.md)
- [深度缓冲](./depth-buffer.md)