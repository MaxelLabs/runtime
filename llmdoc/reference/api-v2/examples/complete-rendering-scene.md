# 完整渲染场景示例

## 概述

这个示例展示了如何使用 RHI、Math 和 Specification 三个库协作创建一个完整的3D渲染场景，包括几何体渲染、相机控制、材质系统和性能监控。

## 完整代码示例

### 1. HTML 基础页面

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maxellabs Runtime - 完整渲染场景</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            font-family: Arial, sans-serif;
            color: white;
        }

        #canvas-container {
            width: 100vw;
            height: 100vh;
            position: relative;
        }

        #render-canvas {
            width: 100%;
            height: 100%;
            display: block;
        }

        #stats {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
        }

        #controls {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            padding: 15px;
            border-radius: 5px;
            width: 250px;
        }

        .control-group {
            margin-bottom: 15px;
        }

        .control-group label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
        }

        .control-group input {
            width: 100%;
        }
    </style>
</head>
<body>
    <div id="canvas-container">
        <canvas id="render-canvas"></canvas>

        <div id="stats">
            <div>FPS: <span id="fps">0</span></div>
            <div>Frame Time: <span id="frame-time">0</span>ms</div>
            <div>Draw Calls: <span id="draw-calls">0</span></div>
        </div>

        <div id="controls">
            <h3>场景控制</h3>

            <div class="control-group">
                <label>相机距离: <span id="camera-distance-value">10</span></label>
                <input type="range" id="camera-distance" min="3" max="30" value="10" step="0.1">
            </div>

            <div class="control-group">
                <label>旋转速度: <span id="rotation-speed-value">1</span></label>
                <input type="range" id="rotation-speed" min="0" max="3" value="1" step="0.1">
            </div>

            <div class="control-group">
                <label>光照强度: <span id="light-intensity-value">1</span></label>
                <input type="range" id="light-intensity" min="0" max="3" value="1" step="0.1">
            </div>

            <div class="control-group">
                <label>渲染模式:</label>
                <select id="render-mode">
                    <option value="lit">光照渲染</option>
                    <option value="wireframe">线框模式</option>
                    <option value="depth">深度可视化</option>
                </select>
            </div>
        </div>
    </div>

    <script type="module" src="./complete-rendering-scene.js"></script>
</body>
</html>
```

### 2. TypeScript 核心代码

```typescript
/**
 * complete-rendering-scene.ts
 * 完整渲染场景示例 - 展示RHI、Math、Specification三个库的协作
 */

import { MSpec, MMath } from '@maxellabs/core';

// ==================== 工具类定义 ====================

/**
 * 性能监控器
 */
class PerformanceMonitor {
    private frameCount = 0;
    private lastTime = performance.now();
    private fps = 0;
    private frameTime = 0;
    private drawCalls = 0;

    begin() {
        this.frameCount++;
        const now = performance.now();
        const delta = now - this.lastTime;

        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.frameCount = 0;
            this.lastTime = now;
            this.updateUI();
        }

        this.frameTime = delta;
        this.drawCalls = 0;
    }

    addDrawCall() {
        this.drawCalls++;
    }

    end() {
        // 帧结束，统计收集完成
    }

    private updateUI() {
        const fpsElement = document.getElementById('fps');
        const frameTimeElement = document.getElementById('frame-time');
        const drawCallsElement = document.getElementById('draw-calls');

        if (fpsElement) fpsElement.textContent = this.fps.toString();
        if (frameTimeElement) frameTimeElement.textContent = this.frameTime.toFixed(1);
        if (drawCallsElement) drawCallsElement.textContent = this.drawCalls.toString();
    }
}

/**
 * 相机控制器
 */
class CameraController {
    public distance = 10;
    public rotation = new MMath.Vector2(0, 0);
    public target = new MMath.Vector3(0, 0, 0);

    private canvas: HTMLCanvasElement;
    private isDragging = false;
    private lastMousePos = new MMath.Vector2(0, 0);

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMousePos.set(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.lastMousePos.x;
            const deltaY = e.clientY - this.lastMousePos.y;

            this.rotation.x += deltaX * 0.01;
            this.rotation.y += deltaY * 0.01;

            // 限制垂直旋转角度
            this.rotation.y = Math.max(-Math.PI / 2 + 0.1,
                                       Math.min(Math.PI / 2 - 0.1, this.rotation.y));

            this.lastMousePos.set(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // 鼠标滚轮控制距离
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.distance = Math.max(3, Math.min(30, this.distance + e.deltaY * 0.01));
        });
    }

    getViewMatrix(): MMath.Matrix4 {
        const viewMatrix = new MMath.Matrix4();

        // 计算相机位置
        const cameraPos = new MMath.Vector3();
        cameraPos.x = this.distance * Math.sin(this.rotation.x) * Math.cos(this.rotation.y);
        cameraPos.y = this.distance * Math.sin(this.rotation.y);
        cameraPos.z = this.distance * Math.cos(this.rotation.x) * Math.cos(this.rotation.y);

        viewMatrix.lookAt(cameraPos, this.target, new MMath.Vector3(0, 1, 0));
        return viewMatrix;
    }

    getProjectionMatrix(aspect: number): MMath.Matrix4 {
        const projMatrix = new MMath.Matrix4();
        projMatrix.perspective(Math.PI / 4, aspect, 0.1, 1000);
        return projMatrix;
    }

    getPosition(): MMath.Vector3 {
        const pos = new MMath.Vector3();
        pos.x = this.distance * Math.sin(this.rotation.x) * Math.cos(this.rotation.y);
        pos.y = this.distance * Math.sin(this.rotation.y);
        pos.z = this.distance * Math.cos(this.rotation.x) * Math.cos(this.rotation.y);
        return pos;
    }
}

/**
 * 几何体生成器
 */
class GeometryGenerator {
    static createCube(width: number = 1, height: number = 1, depth: number = 1) {
        const w = width / 2;
        const h = height / 2;
        const d = depth / 2;

        const vertices = new Float32Array([
            // 前面
            -w, -h,  d,  0,  0,  1,
             w, -h,  d,  0,  0,  1,
             w,  h,  d,  0,  0,  1,
            -w,  h,  d,  0,  0,  1,

            // 后面
            -w, -h, -d,  0,  0, -1,
            -w,  h, -d,  0,  0, -1,
             w,  h, -d,  0,  0, -1,
             w, -h, -d,  0,  0, -1,

            // 上面
            -w,  h, -d,  0,  1,  0,
            -w,  h,  d,  0,  1,  0,
             w,  h,  d,  0,  1,  0,
             w,  h, -d,  0,  1,  0,

            // 下面
            -w, -h, -d,  0, -1,  0,
             w, -h, -d,  0, -1,  0,
             w, -h,  d,  0, -1,  0,
            -w, -h,  d,  0, -1,  0,

            // 右面
             w, -h, -d,  1,  0,  0,
             w,  h, -d,  1,  0,  0,
             w,  h,  d,  1,  0,  0,
             w, -h,  d,  1,  0,  0,

            // 左面
            -w, -h, -d, -1,  0,  0,
            -w, -h,  d, -1,  0,  0,
            -w,  h,  d, -1,  0,  0,
            -w,  h, -d, -1,  0,  0,
        ]);

        const indices = new Uint16Array([
            0,  1,  2,  0,  2,  3,   // 前面
            4,  5,  6,  4,  6,  7,   // 后面
            8,  9,  10,  8,  10, 11, // 上面
            12, 13, 14, 12, 14, 15, // 下面
            16, 17, 18, 16, 18, 19, // 右面
            20, 21, 22, 20, 22, 23, // 左面
        ]);

        return { vertices, indices };
    }

    static createSphere(radius: number = 1, segments: number = 32) {
        const vertices: number[] = [];
        const indices: number[] = [];

        // 生成顶点
        for (let lat = 0; lat <= segments; lat++) {
            const theta = (lat * Math.PI) / segments;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let lon = 0; lon <= segments; lon++) {
                const phi = (lon * 2 * Math.PI) / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;

                vertices.push(
                    radius * x, radius * y, radius * z, // 位置
                    x, y, z                              // 法线
                );
            }
        }

        // 生成索引
        for (let lat = 0; lat < segments; lat++) {
            for (let lon = 0; lon < segments; lon++) {
                const first = lat * (segments + 1) + lon;
                const second = first + segments + 1;

                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }

        return {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices)
        };
    }
}

// ==================== 主程序 ====================

class CompleteRenderingScene {
    private canvas: HTMLCanvasElement;
    private device: MSpec.IRHIDevice;
    private context: GPUCanvasContext;

    private camera: CameraController;
    private perfMonitor: PerformanceMonitor;

    // 渲染资源
    private pipelines: Map<string, MSpec.IRHIRenderPipeline> = new Map();
    private geometries: Map<string, { vertexBuffer: MSpec.IRHIBuffer, indexBuffer: MSpec.IRHIBuffer, indexCount: number }> = new Map();
    private uniformBuffers: Map<string, MSpec.IRHIBuffer> = new Map();
    private depthTexture: MSpec.IRHITexture;

    // 场景参数
    private rotationSpeed = 1.0;
    private lightIntensity = 1.0;
    private renderMode: 'lit' | 'wireframe' | 'depth' = 'lit';

    // 矩阵缓存（使用对象池）
    private modelMatrix = MMath.Matrix4.fromPool();
    private viewMatrix = MMath.Matrix4.fromPool();
    private projMatrix = MMath.Matrix4.fromPool();
    private normalMatrix = MMath.Matrix4.fromPool();
    private mvpMatrix = MMath.Matrix4.fromPool();

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }

        this.camera = new CameraController(this.canvas);
        this.perfMonitor = new PerformanceMonitor();
        this.setupUI();
    }

    private async initDevice() {
        // 检查WebGPU支持
        if (!navigator.gpu) {
            throw new Error('WebGPU not supported');
        }

        // 获取GPU适配器
        const adapter = await navigator.gpu.requestAdapter({
            powerPreference: 'high-performance'
        });

        if (!adapter) {
            throw new Error('Failed to get GPU adapter');
        }

        // 创建设备
        const device = await adapter.requestDevice();

        // 获取画布上下文
        const context = this.canvas.getContext('webgpu') as GPUCanvasContext;
        if (!context) {
            throw new Error('Failed to get WebGPU context');
        }

        // 配置画布格式
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
            device,
            format: presentationFormat,
            alphaMode: 'opaque',
        });

        // 创建RHI设备包装器
        this.device = MSpec.RHI.createDevice(device);
        this.context = context;
    }

    private createShaders() {
        // 基础顶点着色器
        const vertexShaderCode = `
            struct Uniforms {
                modelMatrix: mat4x4<f32>,
                viewMatrix: mat4x4<f32>,
                projMatrix: mat4x4<f32>,
                normalMatrix: mat4x4<f32>,
                mvpMatrix: mat4x4<f32>,
                lightPos: vec3<f32>,
                lightIntensity: f32,
                cameraPos: vec3<f32>,
                time: f32,
            };

            @binding(0) @group(0) var<uniform> uniforms: Uniforms;

            struct VertexInput {
                @location(0) position: vec3<f32>,
                @location(1) normal: vec3<f32>,
            };

            struct VertexOutput {
                @builtin(position) position: vec4<f32>,
                @location(0) worldPos: vec3<f32>,
                @location(1) normal: vec3<f32>,
                @location(2) viewNormal: vec3<f32>,
            };

            @vertex
            fn main(input: VertexInput) -> VertexOutput {
                var output: VertexOutput;

                let worldPos = uniforms.modelMatrix * vec4<f32>(input.position, 1.0);
                output.position = uniforms.mvpMatrix * vec4<f32>(input.position, 1.0);
                output.worldPos = worldPos.xyz;

                // 转换法线到世界空间
                let worldNormal = uniforms.normalMatrix * vec4<f32>(input.normal, 0.0);
                output.normal = normalize(worldNormal.xyz);

                // 转换法线到视图空间
                let viewNormal = (uniforms.viewMatrix * worldNormal).xyz;
                output.viewNormal = normalize(viewNormal);

                return output;
            }
        `;

        // 光照片段着色器
        const fragmentShaderCode = `
            struct Uniforms {
                modelMatrix: mat4x4<f32>,
                viewMatrix: mat4x4<f32>,
                projMatrix: mat4x4<f32>,
                normalMatrix: mat4x4<f32>,
                mvpMatrix: mat4x4<f32>,
                lightPos: vec3<f32>,
                lightIntensity: f32,
                cameraPos: vec3<f32>,
                time: f32,
            };

            @binding(0) @group(0) var<uniform> uniforms: Uniforms;

            struct FragmentInput {
                @location(0) worldPos: vec3<f32>,
                @location(1) normal: vec3<f32>,
                @location(2) viewNormal: vec3<f32>,
            };

            struct FragmentOutput {
                @location(0) color: vec4<f32>,
            };

            @fragment
            fn main(input: FragmentInput) -> FragmentOutput {
                var output: FragmentOutput;

                // 基础材质颜色
                let baseColor = vec3<f32>(0.7, 0.3, 0.2);

                // 环境光
                let ambientColor = vec3<f32>(0.1, 0.1, 0.1);

                // 计算光照
                let lightDir = normalize(uniforms.lightPos - input.worldPos);
                let viewDir = normalize(uniforms.cameraPos - input.worldPos);
                let halfDir = normalize(lightDir + viewDir);

                // Lambert漫反射
                let NdotL = max(dot(input.normal, lightDir), 0.0);
                let diffuse = baseColor * NdotL;

                // Blinn-Phong高光
                let NdotH = max(dot(input.normal, halfDir), 0.0);
                let specular = pow(NdotH, 32.0) * uniforms.lightIntensity;

                // 组合最终颜色
                let finalColor = ambientColor + diffuse * uniforms.lightIntensity + specular * 0.5;

                output.color = vec4<f32>(finalColor, 1.0);
                return output;
            }
        `;

        // 线框着色器
        const wireframeFragmentShader = `
            struct FragmentInput {
                @location(0) worldPos: vec3<f32>,
                @location(1) normal: vec3<f32>,
                @location(2) viewNormal: vec3<f32>,
            };

            struct FragmentOutput {
                @location(0) color: vec4<f32>,
            };

            @fragment
            fn main(input: FragmentInput) -> FragmentOutput {
                var output: FragmentOutput;
                output.color = vec4<f32>(0.0, 1.0, 0.0, 1.0); // 绿色线框
                return output;
            }
        `;

        // 深度可视化着色器
        const depthFragmentShader = `
            struct FragmentInput {
                @location(0) worldPos: vec3<f32>,
                @location(1) normal: vec3<f32>,
                @location(2) viewNormal: vec3<f32>,
            };

            struct FragmentOutput {
                @location(0) color: vec4<f32>,
            };

            @fragment
            fn main(input: FragmentInput) -> FragmentOutput {
                var output: FragmentOutput;

                // 基于世界位置的深度可视化
                let depth = length(input.worldPos) / 20.0;
                let depthColor = vec3<f32>(depth, depth, depth);

                output.color = vec4<f32>(depthColor, 1.0);
                return output;
            }
        `;

        return {
            vertex: this.device.createShaderModule({
                code: vertexShaderCode,
                language: 'wgsl',
                stage: MSpec.RHIShaderStage.VERTEX,
            }),
            fragment: this.device.createShaderModule({
                code: fragmentShaderCode,
                language: 'wgsl',
                stage: MSpec.RHIShaderStage.FRAGMENT,
            }),
            wireframeFragment: this.device.createShaderModule({
                code: wireframeFragmentShader,
                language: 'wgsl',
                stage: MSpec.RHIShaderStage.FRAGMENT,
            }),
            depthFragment: this.device.createShaderModule({
                code: depthFragmentShader,
                language: 'wgsl',
                stage: MSpec.RHIShaderStage.FRAGMENT,
            }),
        };
    }

    private async createRenderResources() {
        const shaders = this.createShaders();

        // 创建绑定组布局
        const bindGroupLayout = this.device.createBindGroupLayout([
            {
                binding: 0,
                visibility: MSpec.RHIShaderStage.VERTEX | MSpec.RHIShaderStage.FRAGMENT,
                buffer: { type: 'uniform' },
            }
        ]);

        // 创建Uniform缓冲区
        const uniformBuffer = this.device.createBuffer({
            size: 256, // 足够容纳所有矩阵和参数
            usage: MSpec.RHIBufferUsage.UNIFORM,
            hint: 'dynamic',
            label: 'Scene Uniforms'
        });
        this.uniformBuffers.set('scene', uniformBuffer);

        // 创建绑定组
        const bindGroup = this.device.createBindGroup(bindGroupLayout, [
            { binding: 0, resource: uniformBuffer }
        ]);

        // 创建管线布局
        const pipelineLayout = this.device.createPipelineLayout([bindGroupLayout]);

        // 定义顶点布局
        const vertexLayout: MSpec.RHIVertexLayout = {
            buffers: [
                {
                    index: 0,
                    stride: 24, // position(12) + normal(12)
                    stepMode: 'vertex',
                    attributes: [
                        { name: 'position', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 0, shaderLocation: 0 },
                        { name: 'normal', format: MSpec.RHIVertexFormat.FLOAT32x3, offset: 12, shaderLocation: 1 }
                    ]
                }
            ]
        };

        // 创建光照渲染管线
        const litPipeline = this.device.createRenderPipeline({
            vertexShader: shaders.vertex,
            fragmentShader: shaders.fragment,
            vertexLayout,
            primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
            layout: pipelineLayout,
            rasterizationState: {
                cullMode: MSpec.RHICullMode.BACK,
                frontFace: MSpec.RHIFrontFace.CCW,
            },
            depthStencilState: {
                depthWriteEnabled: true,
                depthCompare: MSpec.RHICompareFunction.LESS,
                format: MSpec.RHITextureFormat.DEPTH24_PLUS_STENCIL8,
            },
        });
        this.pipelines.set('lit', litPipeline);

        // 创建线框渲染管线
        const wireframePipeline = this.device.createRenderPipeline({
            vertexShader: shaders.vertex,
            fragmentShader: shaders.wireframeFragment,
            vertexLayout,
            primitiveTopology: MSpec.RHIPrimitiveTopology.LINE_LIST,
            layout: pipelineLayout,
            rasterizationState: {
                cullMode: MSpec.RHICullMode.NONE,
            },
            depthStencilState: {
                depthWriteEnabled: true,
                depthCompare: MSpec.RHICompareFunction.LESS,
                format: MSpec.RHITextureFormat.DEPTH24_PLUS_STENCIL8,
            },
        });
        this.pipelines.set('wireframe', wireframePipeline);

        // 创建深度可视化管线
        const depthPipeline = this.device.createRenderPipeline({
            vertexShader: shaders.vertex,
            fragmentShader: shaders.depthFragment,
            vertexLayout,
            primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
            layout: pipelineLayout,
            rasterizationState: {
                cullMode: MSpec.RHICullMode.BACK,
            },
            depthStencilState: {
                depthWriteEnabled: true,
                depthCompare: MSpec.RHICompareFunction.LESS,
                format: MSpec.RHITextureFormat.DEPTH24_PLUS_STENCIL8,
            },
        });
        this.pipelines.set('depth', depthPipeline);

        // 创建几何体
        this.createGeometries();

        // 创建深度纹理
        this.updateDepthTexture();
    }

    private createGeometries() {
        // 创建立方体
        const cubeGeometry = GeometryGenerator.createCube(2, 2, 2);
        const cubeVertexBuffer = this.device.createBuffer({
            size: cubeGeometry.vertices.byteLength,
            usage: MSpec.RHIBufferUsage.VERTEX,
            hint: 'static',
            initialData: cubeGeometry.vertices,
            label: 'Cube Vertex Buffer'
        });
        const cubeIndexBuffer = this.device.createBuffer({
            size: cubeGeometry.indices.byteLength,
            usage: MSpec.RHIBufferUsage.INDEX,
            hint: 'static',
            initialData: cubeGeometry.indices,
            label: 'Cube Index Buffer'
        });

        this.geometries.set('cube', {
            vertexBuffer: cubeVertexBuffer,
            indexBuffer: cubeIndexBuffer,
            indexCount: cubeGeometry.indices.length
        });

        // 创建球体
        const sphereGeometry = GeometryGenerator.createSphere(1, 24);
        const sphereVertexBuffer = this.device.createBuffer({
            size: sphereGeometry.vertices.byteLength,
            usage: MSpec.RHIBufferUsage.VERTEX,
            hint: 'static',
            initialData: sphereGeometry.vertices,
            label: 'Sphere Vertex Buffer'
        });
        const sphereIndexBuffer = this.device.createBuffer({
            size: sphereGeometry.indices.byteLength,
            usage: MSpec.RHIBufferUsage.INDEX,
            hint: 'static',
            initialData: sphereGeometry.indices,
            label: 'Sphere Index Buffer'
        });

        this.geometries.set('sphere', {
            vertexBuffer: sphereVertexBuffer,
            indexBuffer: sphereIndexBuffer,
            indexCount: sphereGeometry.indices.length
        });
    }

    private updateDepthTexture() {
        if (this.depthTexture) {
            this.depthTexture.destroy();
        }

        this.depthTexture = this.device.createTexture({
            width: this.canvas.width,
            height: this.canvas.height,
            format: MSpec.RHITextureFormat.DEPTH24_PLUS_STENCIL8,
            usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
            label: 'Depth Texture'
        });
    }

    private updateUniforms(time: number) {
        // 获取矩阵
        this.viewMatrix.copyFrom(this.camera.getViewMatrix());
        this.projMatrix.copyFrom(this.camera.getProjectionMatrix(this.canvas.width / this.canvas.height));
        const cameraPos = this.camera.getPosition();

        // 准备Uniform数据
        const uniformData = new Float32Array(64); // 256 bytes / 4 bytes per float

        // 矩阵数据（每个矩阵16个float）
        const matrices = [
            this.modelMatrix,
            this.viewMatrix,
            this.projMatrix,
            this.normalMatrix,
            this.mvpMatrix
        ];

        matrices.forEach((matrix, index) => {
            uniformData.set(matrix.getElements(), index * 16);
        });

        // 其他参数
        uniformData[80] = 5.0; // lightPos.x
        uniformData[81] = 10.0; // lightPos.y
        uniformData[82] = 5.0; // lightPos.z
        uniformData[83] = this.lightIntensity; // lightIntensity

        uniformData[84] = cameraPos.x; // cameraPos.x
        uniformData[85] = cameraPos.y; // cameraPos.y
        uniformData[86] = cameraPos.z; // cameraPos.z
        uniformData[87] = time; // time

        // 更新缓冲区
        this.uniformBuffers.get('scene')?.update(uniformData);
    }

    private renderScene(time: number) {
        this.perfMonitor.begin();

        // 更新Uniforms
        this.updateUniforms(time);

        // 创建命令编码器
        const encoder = this.device.createCommandEncoder();

        // 获取当前纹理视图
        const currentTextureView = this.context.getCurrentTexture().createView();

        // 开始渲染通道
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: currentTextureView,
                loadOp: 'clear',
                clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        });

        // 获取当前渲染模式对应的管线
        const pipeline = this.pipelines.get(this.renderMode);
        if (!pipeline) {
            console.error(`Pipeline '${this.renderMode}' not found`);
            return;
        }

        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, 0); // 使用默认绑定组

        // 渲染立方体
        this.modelMatrix.identity();
        this.modelMatrix.translate(new MMath.Vector3(-2, 0, 0));
        this.modelMatrix.rotateY(time * 0.0005 * this.rotationSpeed);
        this.updateUniforms(time); // 重新更新以包含新的模型矩阵

        const cube = this.geometries.get('cube');
        if (cube) {
            renderPass.setVertexBuffer(0, cube.vertexBuffer);
            renderPass.setIndexBuffer(cube.indexBuffer, MSpec.RHIIndexFormat.UINT16);
            renderPass.drawIndexed(cube.indexCount);
            this.perfMonitor.addDrawCall();
        }

        // 渲染球体
        this.modelMatrix.identity();
        this.modelMatrix.translate(new MMath.Vector3(2, 0, 0));
        this.modelMatrix.rotateY(time * 0.0008 * this.rotationSpeed);
        this.updateUniforms(time); // 重新更新以包含新的模型矩阵

        const sphere = this.geometries.get('sphere');
        if (sphere) {
            renderPass.setVertexBuffer(0, sphere.vertexBuffer);
            renderPass.setIndexBuffer(sphere.indexBuffer, MSpec.RHIIndexFormat.UINT16);
            renderPass.drawIndexed(sphere.indexCount);
            this.perfMonitor.addDrawCall();
        }

        renderPass.end();

        // 提交命令
        this.device.submit(encoder.finish());

        this.perfMonitor.end();
    }

    private setupUI() {
        // 相机距离控制
        const distanceSlider = document.getElementById('camera-distance') as HTMLInputElement;
        const distanceValue = document.getElementById('camera-distance-value');
        if (distanceSlider && distanceValue) {
            distanceSlider.addEventListener('input', (e) => {
                this.camera.distance = parseFloat((e.target as HTMLInputElement).value);
                distanceValue.textContent = this.camera.distance.toFixed(1);
            });
        }

        // 旋转速度控制
        const speedSlider = document.getElementById('rotation-speed') as HTMLInputElement;
        const speedValue = document.getElementById('rotation-speed-value');
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                this.rotationSpeed = parseFloat((e.target as HTMLInputElement).value);
                speedValue.textContent = this.rotationSpeed.toFixed(1);
            });
        }

        // 光照强度控制
        const intensitySlider = document.getElementById('light-intensity') as HTMLInputElement;
        const intensityValue = document.getElementById('light-intensity-value');
        if (intensitySlider && intensityValue) {
            intensitySlider.addEventListener('input', (e) => {
                this.lightIntensity = parseFloat((e.target as HTMLInputElement).value);
                intensityValue.textContent = this.lightIntensity.toFixed(1);
            });
        }

        // 渲染模式控制
        const modeSelect = document.getElementById('render-mode') as HTMLSelectElement;
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                this.renderMode = (e.target as HTMLSelectElement).value as 'lit' | 'wireframe' | 'depth';
            });
        }
    }

    private startRenderLoop() {
        const render = (time: number) => {
            this.renderScene(time);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    public async start() {
        try {
            await this.initDevice();
            await this.createRenderResources();

            // 处理窗口大小变化
            window.addEventListener('resize', () => {
                this.canvas.width = this.canvas.clientWidth;
                this.canvas.height = this.canvas.clientHeight;
                this.updateDepthTexture();
            });

            this.startRenderLoop();

            console.log('渲染场景初始化成功！');
        } catch (error) {
            console.error('初始化失败:', error);
            throw error;
        }
    }

    public dispose() {
        // 归还对象池中的矩阵
        MMath.Matrix4.toPool(this.modelMatrix);
        MMath.Matrix4.toPool(this.viewMatrix);
        MMath.Matrix4.toPool(this.projMatrix);
        MMath.Matrix4.toPool(this.normalMatrix);
        MMath.Matrix4.toPool(this.mvpMatrix);

        // 销毁资源
        this.geometries.forEach(geo => {
            geo.vertexBuffer.destroy();
            geo.indexBuffer.destroy();
        });

        this.uniformBuffers.forEach(buffer => {
            buffer.destroy();
        });

        if (this.depthTexture) {
            this.depthTexture.destroy();
        }
    }
}

// ==================== 程序入口 ====================

// 确保DOM加载完成
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const scene = new CompleteRenderingScene('render-canvas');
        await scene.start();

        // 清理函数
        window.addEventListener('beforeunload', () => {
            scene.dispose();
        });

    } catch (error) {
        console.error('启动场景失败:', error);

        // 显示错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 5px;
            font-family: monospace;
        `;
        errorDiv.textContent = `初始化错误: ${error}`;
        document.body.appendChild(errorDiv);
    }
});
```

## 关键特性说明

### 1. 资源管理

- **Buffer管理**: 使用RHI创建和管理顶点、索引和Uniform缓冲区
- **纹理管理**: 动态创建和更新深度纹理
- **对象池**: 使用Math库的对象池管理矩阵对象，避免频繁内存分配

### 2. 相机控制

- **轨道相机**: 支持鼠标拖拽旋转、滚轮缩放
- **视图矩阵**: 使用Math库计算视图和投影矩阵
- **平滑控制**: 提供响应式的相机交互

### 3. 渲染管线

- **多模式渲染**: 支持光照、线框、深度可视化三种渲染模式
- **动态切换**: 运行时切换渲染管线
- **深度测试**: 正确的深度缓冲和排序

### 4. 性能优化

- **性能监控**: 实时FPS、帧时间和绘制调用统计
- **资源复用**: 缓冲区和其他资源的有效复用
- **批量渲染**: 合理的渲染批处理

### 5. 错误处理

- **WebGPU检测**: 检查浏览器支持
- **资源验证**: 验证资源创建和初始化
- **优雅降级**: 友好的错误提示

## 最佳实践

### 1. 内存管理

```typescript
// ✅ 使用对象池
const matrix = MMath.Matrix4.fromPool();
// ... 使用矩阵
MMath.Matrix4.toPool(matrix); // 归还到池

// ❌ 避免频繁创建
const matrix = new MMath.Matrix4(); // 每次都分配新内存
```

### 2. 性能监控

```typescript
// ✅ 监控关键指标
perfMonitor.begin();
// 渲染代码
perfMonitor.addDrawCall();
perfMonitor.end();
```

### 3. 资源清理

```typescript
// ✅ 正确销毁资源
public dispose() {
    // 销毁缓冲区
    this.geometries.forEach(geo => {
        geo.vertexBuffer.destroy();
        geo.indexBuffer.destroy();
    });

    // 归还对象池
    MMath.Matrix4.toPool(this.modelMatrix);
}
```

### 4. 错误处理

```typescript
// ✅ 优雅的错误处理
try {
    await this.initDevice();
    await this.createRenderResources();
    this.startRenderLoop();
} catch (error) {
    console.error('初始化失败:', error);
    // 显示用户友好的错误信息
}
```

## 扩展建议

1. **添加更多几何体**: 圆柱体、圆锥体、复杂网格
2. **材质系统**: PBR材质、纹理贴图、法线贴图
3. **光照系统**: 多光源、阴影、环境光遮蔽
4. **后处理**: 泛光、景深、色调映射
5. **动画系统**: 骨骼动画、变形动画、粒子系统

这个示例提供了完整的基础框架，开发者可以根据具体需求进行扩展和定制。