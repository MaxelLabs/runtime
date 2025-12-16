# RHI 渲染管线 API

## 概述

RHI 渲染管线系统将顶点处理、图元装配、光栅化、片段处理等渲染阶段封装成一个完整的可配置单元。通过管线配置，可以控制渲染的各个方面，包括着色器程序、混合模式、深度测试、模板测试等。

## GLRenderPipeline - 渲染管线

### 管线描述符

```typescript
interface RenderPipelineDescriptor {
    label?: string;                           // 调试标签
    layout: GLPipelineLayout;                 // 管线布局
    vertex: VertexState;                      // 顶点着色器状态
    fragment?: FragmentState;                 // 片元着色器状态（可选）
    primitive: PrimitiveState;                // 图元状态
    depthStencil?: DepthStencilState;         // 深度模板状态（可选）
    multisample: MultisampleState;            // 多重采样状态
}
```

### 顶点状态

```typescript
interface VertexState {
    module: GLShader;                         // 顶点着色器模块
    entryPoint: string;                       // 入口点函数名
    buffers: VertexBufferLayout[];            // 顶点缓冲区布局描述
}

interface VertexBufferLayout {
    arrayStride: number;                      // 步长（字节）
    stepMode: GPUVertexStepMode;              // 步进模式（vertex/instance）
    attributes: VertexAttribute[];            // 属性描述
}

interface VertexAttribute {
    format: GPUVertexFormat;                  // 数据格式
    offset: number;                           // 缓冲区内偏移
    shaderLocation: number;                   // 着色器中的位置
}
```

### 片元状态

```typescript
interface FragmentState {
    module: GLShader;                         // 片元着色器模块
    entryPoint: string;                       // 入口点函数名
    targets: ColorTargetState[];              // 颜色输出目标
}

interface ColorTargetState {
    format: GPUTextureFormat;                 // 目标纹理格式
    blend?: BlendState;                       // 混合状态（可选）
    writeMask: GPUColorWriteFlags;            // 颜色写入掩码
}
```

### 基础管线创建

```typescript
// 创建基础渲染管线
const basicPipeline = new GLRenderPipeline(device, {
    label: 'BasicPipeline',
    layout: pipelineLayout,
    vertex: {
        module: vertexShader,
        entryPoint: 'main',
        buffers: [{
            arrayStride: 32,  // position(12) + normal(12) + uv(8)
            stepMode: 'vertex',
            attributes: [
                { format: 'float32x3', offset: 0, shaderLocation: 0 },     // position
                { format: 'float32x3', offset: 12, shaderLocation: 1 },    // normal
                { format: 'float32x2', offset: 24, shaderLocation: 2 }     // uv
            ]
        }]
    },
    fragment: {
        module: fragmentShader,
        entryPoint: 'main',
        targets: [{
            format: 'rgba8unorm',
            blend: {
                color: {
                    srcFactor: 'src-alpha',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                },
                alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                }
            },
            writeMask: GPUColorWrite.ALL
        }]
    },
    primitive: {
        topology: 'triangle-list',
        stripIndexFormat: undefined,
        frontFace: 'ccw',
        cullMode: 'back'
    },
    depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
    },
    multisample: {
        count: 1,
        mask: 0xFFFFFFFF,
        alphaToCoverageEnabled: false
    }
});
```

## 着色器模块管理

### GLShader - 着色器模块

```typescript
class GLShader {
    readonly device: WebGLDevice;
    readonly glShader: WebGLShader;
    readonly type: ShaderType;
    readonly source: string;
    readonly label?: string;

    constructor(device: WebGLDevice, descriptor: ShaderDescriptor);
}

enum ShaderType {
    VERTEX = 'vertex',
    FRAGMENT = 'fragment',
    COMPUTE = 'compute'
}

interface ShaderDescriptor {
    type: ShaderType;
    source: string;
    entryPoints?: string[];
    label?: string;
}
```

### 着色器创建示例

```typescript
// 顶点着色器
const vertexShaderSource = `#version 300 es
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

layout(location = 0) out vec3 v_normal;
layout(location = 1) out vec2 v_uv;

uniform Camera {
    mat4 u_projection;
    mat4 u_view;
    mat4 u_model;
} camera;

void main() {
    gl_Position = camera.u_projection * camera.u_view * camera.u_model * vec4(a_position, 1.0);
    v_normal = mat3(camera.u_model) * a_normal;
    v_uv = a_uv;
}
`;

// 片元着色器
const fragmentShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec3 v_normal;
layout(location = 1) in vec2 v_uv;

layout(location = 0) out vec4 fragColor;

uniform Material {
    vec3 u_albedo;
    float u_metallic;
    float u_roughness;
    float u_ao;
} material;

uniform sampler2D u_albedoTexture;
uniform sampler2D u_normalTexture;
uniform sampler2D u_metallicRoughnessTexture;

void main() {
    vec4 albedo = texture(u_albedoTexture, v_uv) * vec4(material.u_albedo, 1.0);
    fragColor = albedo;
}
`;

// 创建着色器模块
const vertexShader = new GLShader(device, {
    type: ShaderType.VERTEX,
    source: vertexShaderSource,
    label: 'BasicVertexShader'
});

const fragmentShader = new GLShader(device, {
    type: ShaderType.FRAGMENT,
    source: fragmentShaderSource,
    label: 'BasicFragmentShader'
});
```

### 计算着色器

```typescript
// 计算着色器源码
const computeShaderSource = `#version 310 es
layout(local_size_x = 8, local_size_y = 8, local_size_z = 1) in;

layout(binding = 0) readonly uniform InputData {
    vec2 resolution;
    float time;
} input;

layout(binding = 1) writeonly uniform OutputImage {
    vec4 data[];
} output;

void main() {
    ivec2 coord = ivec2(gl_GlobalInvocationID.xy);
    if (coord.x >= int(input.resolution.x) || coord.y >= int(input.resolution.y)) {
        return;
    }

    uint index = coord.y * uint(input.resolution.x) + coord.x;
    vec2 uv = vec2(coord) / input.resolution;

    // 生成程序化纹理
    vec3 color = vec3(
        sin(uv.x * 10.0 + input.time),
        cos(uv.y * 10.0 + input.time),
        sin((uv.x + uv.y) * 5.0 - input.time)
    );

    output.data[index] = vec4(color, 1.0);
}
`;

// 创建计算着色器
const computeShader = new GLShader(device, {
    type: ShaderType.COMPUTE,
    source: computeShaderSource,
    label: 'ProceduralTextureGenerator'
});
```

## GLPipelineLayout - 管线布局

### 布局描述符

```typescript
interface PipelineLayoutDescriptor {
    label?: string;
    bindGroupLayouts: GLBindGroupLayout[];
}

class GLPipelineLayout {
    readonly device: WebGLDevice;
    readonly bindGroupLayouts: GLBindGroupLayout[];
    readonly label?: string;

    constructor(device: WebGLDevice, descriptor: PipelineLayoutDescriptor);
}
```

### 绑定组布局

```typescript
interface BindGroupLayoutDescriptor {
    label?: string;
    entries: BindGroupLayoutEntry[];
}

interface BindGroupLayoutEntry {
    binding: number;                          // 绑定点索引
    visibility: ShaderStageFlags;             // 着色器阶段可见性
    buffer?: BufferBindingLayout;             // 缓冲区绑定布局（可选）
    sampler?: SamplerBindingLayout;           // 采样器绑定布局（可选）
    texture?: TextureBindingLayout;           // 纹理绑定布局（可选）
    storageTexture?: StorageTextureBindingLayout; // 存储纹理布局（可选）
}
```

### 创建管线布局

```typescript
// 相机绑定组布局（UBO）
const cameraBindGroupLayout = new GLBindGroupLayout(device, {
    entries: [{
        binding: 0,
        visibility: ShaderStage.VERTEX | ShaderStage.FRAGMENT,
        buffer: {
            type: 'uniform',
            hasDynamicOffset: false,
            minBindingSize: 192  // 3个4x4矩阵 = 192字节
        }
    }]
});

// 材质绑定组布局（UBO + 纹理 + 采样器）
const materialBindGroupLayout = new GLBindGroupLayout(device, {
    entries: [
        {
            binding: 0,
            visibility: ShaderStage.FRAGMENT,
            buffer: {
                type: 'uniform',
                minBindingSize: 64  // 材质参数
            }
        },
        {
            binding: 1,
            visibility: ShaderStage.FRAGMENT,
            texture: {
                sampleType: 'float',
                viewDimension: '2d'
            }
        },
        {
            binding: 2,
            visibility: ShaderStage.FRAGMENT,
            sampler: {
                type: 'filtering'
            }
        },
        {
            binding: 3,
            visibility: ShaderStage.FRAGMENT,
            texture: {
                sampleType: 'float',
                viewDimension: '2d'
            }
        },
        {
            binding: 4,
            visibility: ShaderStage.FRAGMENT,
            sampler: {
                type: 'filtering'
            }
        }
    ]
});

// 创建管线布局
const pipelineLayout = new GLPipelineLayout(device, {
    label: 'ForwardPipelineLayout',
    bindGroupLayouts: [cameraBindGroupLayout, materialBindGroupLayout]
});
```

### 动态绑定组

```typescript
// 带动态偏移的绑定组布局
const dynamicBindGroupLayout = new GLBindGroupLayout(device, {
    entries: [{
        binding: 0,
        visibility: ShaderStage.VERTEX,
        buffer: {
            type: 'uniform',
            hasDynamicOffset: true,  // 支持动态偏移
            minBindingSize: 64       // 单个对象变换大小
        }
    }]
});

// 创建绑定组时使用动态偏移
const modelBindGroup = new GLBindGroup(device, {
    layout: dynamicBindGroupLayout,
    entries: [{
        binding: 0,
        resource: {
            buffer: modelBuffer,
            offset: 0,
            size: 64 * MAX_OBJECTS  // 预分配空间
        }
    }]
});

// 渲染时使用动态偏移
for (let i = 0; i < objectCount; i++) {
    const dynamicOffset = i * 64;  // 每个对象64字节
    renderPass.setBindGroup(0, modelBindGroup, [dynamicOffset]);
    renderPass.draw(mesh.vertexCount);
}
```

## 渲染状态配置

### 图元状态

```typescript
interface PrimitiveState {
    topology: GPUPrimitiveTopology;           // 图元拓扑类型
    stripIndexFormat?: GPUIndexFormat;        // 带状图元索引格式
    frontFace: GPUFrontFace;                  // 正面方向
    cullMode: GPUCullMode;                    // 裁剪模式
    unclippedDepth?: boolean;                 // 未裁剪深度（WebGL2扩展）
}

enum GPUPrimitiveTopology {
    POINT_LIST = 'point-list',
    LINE_LIST = 'line-list',
    LINE_STRIP = 'line-strip',
    TRIANGLE_LIST = 'triangle-list',
    TRIANGLE_STRIP = 'triangle-strip'
}

enum GPUCullMode {
    NONE = 'none',
    FRONT = 'front',
    BACK = 'back'
}
```

#### 图元状态示例

```typescript
// 点云渲染管线
const pointCloudPipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    primitive: {
        topology: 'point-list',
        cullMode: 'none'
    }
});

// 线框渲染管线
const wireframePipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    primitive: {
        topology: 'line-list',
        cullMode: 'none'
    }
});

// 带状图元管线
const stripPipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    primitive: {
        topology: 'triangle-strip',
        stripIndexFormat: 'uint16',
        cullMode: 'back',
        frontFace: 'ccw'
    }
});
```

### 深度模板状态

```typescript
interface DepthStencilState {
    format: GPUTextureFormat;                 // 深度格式
    depthWriteEnabled?: boolean;              // 深度写入
    depthCompare?: GPUCompareFunction;        // 深度比较函数
    stencilFront?: StencilStateFaceDescriptor; // 正面模板状态
    stencilBack?: StencilStateFaceDescriptor; // 背面模板状态
    depthBias?: number;                       // 深度偏移
    depthBiasSlopeScale?: number;             // 深度偏移斜率缩放
    depthBiasClamp?: number;                  // 深度偏移裁剪
}

enum GPUCompareFunction {
    NEVER = 'never',
    LESS = 'less',
    EQUAL = 'equal',
    LESS_EQUAL = 'less-equal',
    GREATER = 'greater',
    NOT_EQUAL = 'not-equal',
    GREATER_EQUAL = 'greater-equal',
    ALWAYS = 'always'
}
```

#### 深度状态示例

```typescript
// 标准深度测试管线
const depthTestPipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less'
    }
});

// 天空盒管线（深度等于1）
const skyboxPipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false,
        depthCompare: 'less-equal'
    },
    primitive: {
        topology: 'triangle-list',
        cullMode: 'front'  // 反向裁剪天空盒
    }
});

// 透明物体管线（深度写入禁用）
const transparentPipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false,
        depthCompare: 'less'
    }
});
```

#### 模板状态示例

```typescript
// 轮廓渲染管线
const outlinePipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    depthStencil: {
        format: 'depth24plus-stencil8',
        depthWriteEnabled: false,
        depthCompare: 'less',
        stencilFront: {
            compare: 'not-equal',
            failOp: 'keep',
            depthFailOp: 'keep',
            passOp: 'replace'
        },
        stencilBack: {
            compare: 'not-equal',
            failOp: 'keep',
            depthFailOp: 'keep',
            passOp: 'replace'
        }
    }
});

// 镜像渲染管线
const mirrorPipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    depthStencil: {
        format: 'depth24plus-stencil8',
        depthWriteEnabled: true,
        depthCompare: 'less',
        stencilFront: {
            compare: 'equal',
            failOp: 'keep',
            depthFailOp: 'keep',
            passOp: 'replace'
        }
    }
});
```

### 混合状态

```typescript
interface BlendState {
    color: BlendComponent;                    // 颜色混合
    alpha: BlendComponent;                    // Alpha混合
}

interface BlendComponent {
    operation: GPUBlendOperation;             // 混合操作
    srcFactor: GPUBlendFactor;                // 源因子
    dstFactor: GPUBlendFactor;                // 目标因子
}

enum GPUBlendOperation {
    ADD = 'add',
    SUBTRACT = 'subtract',
    REVERSE_SUBTRACT = 'reverse-subtract',
    MIN = 'min',
    MAX = 'max'
}

enum GPUBlendFactor {
    ZERO = 'zero',
    ONE = 'one',
    SRC_COLOR = 'src-color',
    ONE_MINUS_SRC_COLOR = 'one-minus-src-color',
    SRC_ALPHA = 'src-alpha',
    ONE_MINUS_SRC_ALPHA = 'one-minus-src-alpha',
    DST_COLOR = 'dst-color',
    ONE_MINUS_DST_COLOR = 'one-minus-dst-color',
    DST_ALPHA = 'dst-alpha',
    ONE_MINUS_DST_ALPHA = 'one-minus-dst-alpha',
    SRC_ALPHA_SATURATED = 'src-alpha-saturated',
    CONSTANT_COLOR = 'constant-color',
    ONE_MINUS_CONSTANT_COLOR = 'one-minus-constant-color',
    CONSTANT_ALPHA = 'constant-alpha',
    ONE_MINUS_CONSTANT_ALPHA = 'one-minus-constant-alpha'
}
```

#### 混合状态示例

```typescript
// 标准Alpha混合
const alphaBlendPipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    fragment: {
        // ... 其他配置
        targets: [{
            format: 'rgba8unorm',
            blend: {
                color: {
                    srcFactor: 'src-alpha',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                },
                alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                }
            }
        }]
    }
});

// 加法混合（用于发光效果）
const additiveBlendPipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    fragment: {
        targets: [{
            format: 'rgba8unorm',
            blend: {
                color: {
                    srcFactor: 'src-alpha',
                    dstFactor: 'one',
                    operation: 'add'
                },
                alpha: {
                    srcFactor: 'src-alpha',
                    dstFactor: 'one',
                    operation: 'add'
                }
            }
        }]
    }
});

// 屏幕混合（用于特效）
const screenBlendPipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    fragment: {
        targets: [{
            format: 'rgba8unorm',
            blend: {
                color: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-color',
                    operation: 'add'
                },
                alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                }
            }
        }]
    }
});

// 颜色写入控制
const noRedWritePipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    fragment: {
        targets: [{
            format: 'rgba8unorm',
            writeMask: GPUColorWrite.GREEN | GPUColorWrite.BLUE | GPUColorWrite.ALPHA
        }]
    }
});
```

### 多重采样状态

```typescript
interface MultisampleState {
    count: number;                            // 采样数
    mask: number;                             // 采样掩码
    alphaToCoverageEnabled?: boolean;         // Alpha to coverage
}

// MSAA管线
const msaaPipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    multisample: {
        count: 4,
        mask: 0xFFFFFFFF,
        alphaToCoverageEnabled: true
    }
});

// 标准管线
const standardPipeline = new GLRenderPipeline(device, {
    // ... 其他配置
    multisample: {
        count: 1,
        mask: 0xFFFFFFFF,
        alphaToCoverageEnabled: false
    }
});
```

## 管线变体系统

### 管线变体管理

```typescript
class PipelineVariantManager {
    private variants: Map<string, GLRenderPipeline> = new Map();
    private basePipeline: GLRenderPipeline;

    constructor(basePipeline: GLRenderPipeline) {
        this.basePipeline = basePipeline;
    }

    getVariant(options: PipelineOptions): GLRenderPipeline {
        const key = this.getVariantKey(options);

        if (!this.variants.has(key)) {
            const variant = this.createVariant(options);
            this.variants.set(key, variant);
        }

        return this.variants.get(key)!;
    }

    private createVariant(options: PipelineOptions): GLRenderPipeline {
        const descriptor = { ...this.basePipeline.descriptor };

        // 根据选项修改描述符
        if (options.wireframe) {
            descriptor.primitive.topology = 'line-list';
        }

        if (options.transparent) {
            descriptor.fragment.targets[0].blend = getAlphaBlend();
            descriptor.depthStencil.depthWriteEnabled = false;
        }

        if (options.shadowPass) {
            descriptor.fragment = undefined;  // 只需要深度
            descriptor.depthStencil.depthWriteEnabled = true;
            descriptor.depthStencil.depthCompare = 'less';
        }

        return new GLRenderPipeline(this.basePipeline.device, descriptor);
    }

    private getVariantKey(options: PipelineOptions): string {
        return JSON.stringify(options);
    }
}

interface PipelineOptions {
    wireframe?: boolean;
    transparent?: boolean;
    shadowPass?: boolean;
    skinning?: boolean;
    morphTargets?: boolean;
}
```

### 使用管线变体

```typescript
// 管线管理器
const pipelineManager = new PipelineVariantManager(basePipeline);

// 获取不同变体
const opaquePipeline = pipelineManager.getVariant({});
const wireframePipeline = pipelineManager.getVariant({ wireframe: true });
const transparentPipeline = pipelineManager.getVariant({ transparent: true });
const shadowPipeline = pipelineManager.getVariant({ shadowPass: true });

// 渲染时选择合适的管线
function renderObject(obj: RenderObject, renderPass: GLRenderPass) {
    let pipeline: GLRenderPipeline;

    if (renderPass.isShadowPass) {
        pipeline = shadowPipeline;
    } else if (obj.material.transparent) {
        pipeline = transparentPipeline;
    } else if (obj.wireframe) {
        pipeline = wireframePipeline;
    } else {
        pipeline = opaquePipeline;
    }

    renderPass.setPipeline(pipeline);
    // ... 绑定资源和绘制
}
```

## 特殊渲染管线

### 延迟渲染管线

```typescript
// G-Buffer生成管线
const gBufferPipeline = new GLRenderPipeline(device, {
    label: 'GBufferPipeline',
    layout: gBufferLayout,
    vertex: {
        module: gBufferVertexShader,
        entryPoint: 'main',
        buffers: getStandardVertexBuffers()
    },
    fragment: {
        module: gBufferFragmentShader,
        entryPoint: 'main',
        targets: [
            { format: 'rgba8unorm', writeMask: GPUColorWrite.ALL },      // Albedo
            { format: 'rgb10a2unorm', writeMask: GPUColorWrite.ALL },    // Normal
            { format: 'rg8unorm', writeMask: GPUColorWrite.ALL },        // Roughness/Metallic
            { format: 'r8unorm', writeMask: GPUColorWrite.ALL }          // AO
        ]
    },
    primitive: getStandardPrimitiveState(),
    depthStencil: {
        format: 'depth32float',
        depthWriteEnabled: true,
        depthCompare: 'less'
    },
    multisample: getStandardMultisampleState()
});

// 延迟光照管线
const deferredLightingPipeline = new GLRenderPipeline(device, {
    label: 'DeferredLightingPipeline',
    layout: deferredLayout,
    vertex: {
        module: fullscreenVertexShader,
        entryPoint: 'main',
        buffers: []
    },
    fragment: {
        module: deferredLightingShader,
        entryPoint: 'main',
        targets: [{ format: 'rgba16float' }]
    },
    primitive: {
        topology: 'triangle-list',
        stripIndexFormat: undefined,
        frontFace: 'ccw',
        cullMode: 'none'
    },
    depthStencil: undefined  // 不需要深度测试
});
```

### 粒子系统管线

```typescript
const particlePipeline = new GLRenderPipeline(device, {
    label: 'ParticleSystemPipeline',
    layout: particleLayout,
    vertex: {
        module: particleVertexShader,
        entryPoint: 'main',
        buffers: [
            {
                arrayStride: 20,  // position(12) + size(4) + rotation(4)
                stepMode: 'instance',
                attributes: [
                    { format: 'float32x3', offset: 0, shaderLocation: 0 },
                    { format: 'float32', offset: 12, shaderLocation: 1 },
                    { format: 'float32', offset: 16, shaderLocation: 2 }
                ]
            }
        ]
    },
    fragment: {
        module: particleFragmentShader,
        entryPoint: 'main',
        targets: [{
            format: 'rgba8unorm',
            blend: {
                color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
                alpha: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' }
            },
            writeMask: GPUColorWrite.ALL
        }]
    },
    primitive: {
        topology: 'triangle-strip',
        cullMode: 'none'
    },
    depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false,
        depthCompare: 'less'
    }
});
```

### 计算管线

```typescript
class GLComputePipeline {
    readonly device: WebGLDevice;
    readonly layout: GLPipelineLayout;
    readonly computeShader: GLShader;
    readonly label?: string;

    constructor(device: WebGLDevice, descriptor: ComputePipelineDescriptor);
}

interface ComputePipelineDescriptor {
    label?: string;
    layout: GLPipelineLayout;
    compute: ComputeState;
}

interface ComputeState {
    module: GLShader;
    entryPoint: string;
}

// 创建计算管线
const computePipeline = new GLComputePipeline(device, {
    label: 'ParticleUpdatePipeline',
    layout: computeLayout,
    compute: {
        module: particleComputeShader,
        entryPoint: 'main'
    }
});

// 使用计算管线
const pass = encoder.beginComputePass();
pass.setPipeline(computePipeline);
pass.setBindGroup(0, particleBindGroup);
pass.dispatchWorkgroups(
    Math.ceil(particleCount / 256),  // X工作组
    1,  // Y工作组
    1   // Z工作组
);
pass.end();
```

## 管线缓存和优化

### 管线缓存

```typescript
class PipelineCache {
    private cache: Map<string, GLRenderPipeline> = new Map();

    getOrCreatePipeline(
        device: WebGLDevice,
        descriptor: RenderPipelineDescriptor
    ): GLRenderPipeline {
        const key = this.getCacheKey(descriptor);

        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        const pipeline = new GLRenderPipeline(device, descriptor);
        this.cache.set(key, pipeline);

        return pipeline;
    }

    private getCacheKey(descriptor: RenderPipelineDescriptor): string {
        // 创建描述符的稳定哈希键
        return JSON.stringify({
            shaderHashes: {
                vertex: this.getShaderHash(descriptor.vertex.module.source),
                fragment: descriptor.fragment ?
                    this.getShaderHash(descriptor.fragment.module.source) : null
            },
            layout: descriptor.layout.id,
            primitive: descriptor.primitive,
            depthStencil: descriptor.depthStencil,
            multisample: descriptor.multisample,
            targets: descriptor.fragment?.targets.map(t => ({
                format: t.format,
                blend: t.blend,
                writeMask: t.writeMask
            }))
        });
    }

    private getShaderHash(source: string): string {
        // 简单的着色器源码哈希
        return btoa(source.substring(0, 100)).substring(0, 16);
    }

    clear() {
        this.cache.clear();
    }

    getStats(): { size: number; hitRate: number } {
        return {
            size: this.cache.size,
            hitRate: this.hitCount / (this.hitCount + this.missCount)
        };
    }
}
```

### 性能分析

```typescript
class PipelineProfiler {
    private renderTimes: Map<string, number[]> = new Map();

    startRender(pipeline: GLRenderPipeline): number {
        return performance.now();
    }

    endRender(pipeline: GLRenderPipeline, startTime: number) {
        const duration = performance.now() - startTime;
        const timings = this.renderTimes.get(pipeline.label || 'unknown') || [];
        timings.push(duration);

        // 保留最近100次采样
        if (timings.length > 100) {
            timings.shift();
        }

        this.renderTimes.set(pipeline.label || 'unknown', timings);
    }

    getReport(): string {
        let report = '管线性能报告:\n';

        for (const [pipelineName, timings] of this.renderTimes.entries()) {
            const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
            const min = Math.min(...timings);
            const max = Math.max(...timings);

            report += `${pipelineName}:\n`;
            report += `  平均: ${avg.toFixed(3)}ms\n`;
            report += `  最小: ${min.toFixed(3)}ms\n`;
            report += `  最大: ${max.toFixed(3)}ms\n`;
            report += `  样本数: ${timings.length}\n\n`;
        }

        return report;
    }
}
```

## 完整示例：多管线渲染器

```typescript
class MultiPipelineRenderer {
    private device: WebGLDevice;
    private pipelineCache = new PipelineCache();
    private pipelineProfiler = new PipelineProfiler();

    // 不同用途的管线
    private opaquePipeline: GLRenderPipeline;
    private transparentPipeline: GLRenderPipeline;
    private shadowPipeline: GLRenderPipeline;
    private skyboxPipeline: GLRenderPipeline;
    private postProcessPipeline: GLRenderPipeline;

    constructor(device: WebGLDevice) {
        this.device = device;
        this.initializePipelines();
    }

    private initializePipelines() {
        // 创建着色器模块
        const standardVertexShader = this.loadShader('standard.vert', ShaderType.VERTEX);
        const standardFragmentShader = this.loadShader('standard.frag', ShaderType.FRAGMENT);
        const shadowFragmentShader = this.loadShader('shadow.frag', ShaderType.FRAGMENT);
        const skyboxVertexShader = this.loadShader('skybox.vert', ShaderType.VERTEX);
        const skyboxFragmentShader = this.loadShader('skybox.frag', ShaderType.FRAGMENT);

        // 创建管线布局
        const standardLayout = this.createStandardLayout();
        const shadowLayout = this.createShadowLayout();
        const skyboxLayout = this.createSkyboxLayout();

        // 创建不透明物体管线
        this.opaquePipeline = this.pipelineCache.getOrCreatePipeline(this.device, {
            label: 'OpaquePipeline',
            layout: standardLayout,
            vertex: {
                module: standardVertexShader,
                entryPoint: 'main',
                buffers: this.getStandardVertexBuffers()
            },
            fragment: {
                module: standardFragmentShader,
                entryPoint: 'main',
                targets: [{
                    format: 'rgba16float',
                    blend: undefined,
                    writeMask: GPUColorWrite.ALL
                }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
                frontFace: 'ccw'
            },
            depthStencil: {
                format: 'depth32float',
                depthWriteEnabled: true,
                depthCompare: 'less'
            },
            multisample: {
                count: 1,
                mask: 0xFFFFFFFF
            }
        });

        // 创建透明物体管线
        this.transparentPipeline = this.pipelineCache.getOrCreatePipeline(this.device, {
            label: 'TransparentPipeline',
            layout: standardLayout,
            vertex: {
                module: standardVertexShader,
                entryPoint: 'main',
                buffers: this.getStandardVertexBuffers()
            },
            fragment: {
                module: standardFragmentShader,
                entryPoint: 'main',
                targets: [{
                    format: 'rgba16float',
                    blend: getStandardAlphaBlend(),
                    writeMask: GPUColorWrite.ALL
                }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
                frontFace: 'ccw'
            },
            depthStencil: {
                format: 'depth32float',
                depthWriteEnabled: false,
                depthCompare: 'less'
            },
            multisample: {
                count: 1,
                mask: 0xFFFFFFFF
            }
        });

        // 创建阴影贴图管线
        this.shadowPipeline = this.pipelineCache.getOrCreatePipeline(this.device, {
            label: 'ShadowPipeline',
            layout: shadowLayout,
            vertex: {
                module: standardVertexShader,
                entryPoint: 'shadow_main',
                buffers: this.getStandardVertexBuffers()
            },
            fragment: undefined,  // 只需要深度
            primitive: {
                topology: 'triangle-list',
                cullMode: 'front',  // 防止Peter Panning
                frontFace: 'ccw'
            },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: true,
                depthCompare: 'less'
            }
        });

        // 创建天空盒管线
        this.skyboxPipeline = this.pipelineCache.getOrCreatePipeline(this.device, {
            label: 'SkyboxPipeline',
            layout: skyboxLayout,
            vertex: {
                module: skyboxVertexShader,
                entryPoint: 'main',
                buffers: []
            },
            fragment: {
                module: skyboxFragmentShader,
                entryPoint: 'main',
                targets: [{
                    format: 'rgba16float',
                    blend: undefined,
                    writeMask: GPUColorWrite.ALL
                }]
            },
            primitive: {
                topology: 'triangle-strip',
                cullMode: 'front',  // 反向裁剪
                frontFace: 'ccw'
            },
            depthStencil: {
                format: 'depth32float',
                depthWriteEnabled: false,
                depthCompare: 'less-equal'
            }
        });
    }

    renderScene(encoder: GLCommandEncoder, scene: Scene) {
        // 渲染阴影贴图
        this.renderShadows(encoder, scene);

        // 主场景渲染
        this.renderMainScene(encoder, scene);

        // 渲染天空盒
        this.renderSkybox(encoder, scene);

        // 渲染透明物体
        this.renderTransparentObjects(encoder, scene);
    }

    private renderMainScene(encoder: GLCommandEncoder, scene: Scene) {
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: scene.renderTarget.createView(),
                clearValue: { r: 0.1, g: 0.2, b: 0.3, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: scene.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        });

        const startTime = this.pipelineProfiler.startRender(this.opaquePipeline);

        renderPass.setPipeline(this.opaquePipeline);
        renderPass.setBindGroup(0, scene.cameraBindGroup);

        // 渲染不透明物体
        const opaqueObjects = scene.getOpaqueObjects();
        for (const obj of opaqueObjects) {
            renderPass.setBindGroup(1, obj.materialBindGroup);
            renderPass.setBindGroup(2, obj.transformBindGroup);

            renderPass.setVertexBuffer(0, obj.vertexBuffer);
            renderPass.setIndexBuffer(obj.indexBuffer, 'uint16');

            renderPass.drawIndexed(obj.indexCount);
        }

        this.pipelineProfiler.endRender(this.opaquePipeline, startTime);
        renderPass.end();
    }

    private renderTransparentObjects(encoder: GLCommandEncoder, scene: Scene) {
        // 排序透明物体（从后往前）
        const transparentObjects = scene.getTransparentObjects()
            .sort((a, b) => {
                const distA = scene.camera.getDistanceTo(a.position);
                const distB = scene.camera.getDistanceTo(b.position);
                return distB - distA;  // 从远到近
            });

        if (transparentObjects.length === 0) return;

        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: scene.renderTarget.createView(),
                loadOp: 'load',
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: scene.depthTexture.createView(),
                depthLoadOp: 'load',
                depthStoreOp: 'store'
            }
        });

        const startTime = this.pipelineProfiler.startRender(this.transparentPipeline);

        renderPass.setPipeline(this.transparentPipeline);
        renderPass.setBindGroup(0, scene.cameraBindGroup);

        for (const obj of transparentObjects) {
            renderPass.setBindGroup(1, obj.materialBindGroup);
            renderPass.setBindGroup(2, obj.transformBindGroup);

            renderPass.setVertexBuffer(0, obj.vertexBuffer);
            renderPass.setIndexBuffer(obj.indexBuffer, 'uint16');

            renderPass.drawIndexed(obj.indexCount);
        }

        this.pipelineProfiler.endRender(this.transparentPipeline, startTime);
        renderPass.end();
    }

    // ... 其他渲染方法
}
```

## 总结

RHI 渲染管线 API 提供了：

1. **灵活的管线配置** - 支持各种渲染状态和效果
2. **高效的着色器管理** - 模块化着色器系统
3. **强大的绑定系统** - 灵活的资源绑定和布局管理
4. **管线变体支持** - 根据需求动态创建管线变体
5. **性能优化工具** - 缓存和分析工具提升渲染性能

正确使用渲染管线 API 可以实现复杂的渲染效果，同时保持高性能和代码的可维护性。