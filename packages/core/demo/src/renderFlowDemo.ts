/**
 * renderFlowDemo.ts
 * Core包渲染流程Demo
 * 展示从Engine初始化到WebGL渲染的完整流程
 *
 * 这个Demo展示：
 * 1. Core包架构概念（通过日志和状态显示）
 * 2. 使用@maxellabs/rhi进行真正的WebGL渲染
 * 3. 完整的渲染管线流程
 * 4. 性能监控和状态追踪
 */

import type { IRHITexture, RHIVertexLayout } from '@maxellabs/core';
import {
  RHIBufferUsage,
  RHIVertexFormat,
  RHIPrimitiveTopology,
  RHITextureFormat,
  RHITextureUsage,
  RHIShaderStage,
} from '@maxellabs/core';
import { WebGLDevice } from '@maxellabs/rhi';
import { Vector3 } from '@maxellabs/math';

// Demo状态接口
interface DemoState {
  initialized: boolean;
  running: boolean;
  frameCount: number;
  fps: number;
  lastFrameTime: number;
  totalTime: number;
  gameObjects: GameObjectInfo[];
  currentStage: string;
}

// 模拟GameObject信息
interface GameObjectInfo {
  id: string;
  name: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  components: string[];
}

// 模拟Engine状态
interface EngineState {
  state: 'initializing' | 'running' | 'paused' | 'destroyed';
  systems: string[];
  memoryUsage: number;
  activeScene: string;
}

// 模拟渲染统计
interface RenderStats {
  drawCalls: number;
  triangles: number;
  vertices: number;
  textures: number;
  shaders: number;
}

// 常量定义
const CANVAS_ID = 'J-canvas';
const DEMO_NAME = 'Core渲染流程Demo';

// 全局变量
let device: WebGLDevice;
let canvas: HTMLCanvasElement;
let animationId: number;
let renderTargetTexture: IRHITexture;
let demoState: DemoState;
let engineState: EngineState;
let renderStats: RenderStats;
let frameStats: HTMLElement | null = null;

// 着色器源码 - 展示Core包的变换矩阵系统
const vertexShaderSource = `#version 300 es
precision highp float;

// 顶点属性
in vec3 aPosition;
in vec3 aColor;

// Uniform变量 - 模拟Core包的变换矩阵
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

// 输出到片段着色器
out vec3 vColor;
out float vTime;

void main() {
  vColor = aColor;
  vTime = uTime;

  // 模拟Core包的完整变换流程
  // 1. 模型变换（Transform组件）
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);

  // 2. 视图变换（Camera组件）
  vec4 viewPosition = uViewMatrix * worldPosition;

  // 3. 投影变换（Camera投影矩阵）
  gl_Position = uProjectionMatrix * viewPosition;
}
`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

// 来自顶点着色器的输入
in vec3 vColor;
in float vTime;

// 输出颜色
out vec4 fragColor;

void main() {
  // 模拟动态材质效果（Material组件）
  vec3 color = vColor * (0.8 + 0.2 * sin(vTime * 2.0));
  fragColor = vec4(color, 1.0);
}
`;

/**
 * 初始化Demo状态
 */
function initializeDemoState(): void {
  demoState = {
    initialized: false,
    running: false,
    frameCount: 0,
    fps: 0,
    lastFrameTime: performance.now(),
    totalTime: 0,
    gameObjects: [],
    currentStage: 'Initializing',
  };

  engineState = {
    state: 'initializing',
    systems: ['TimeManager', 'SceneManager', 'ResourceManager', 'InputManager', 'RenderSystem'],
    memoryUsage: 20,
    activeScene: 'MainScene',
  };

  renderStats = {
    drawCalls: 0,
    triangles: 0,
    vertices: 0,
    textures: 1,
    shaders: 1,
  };

  // 创建模拟的GameObject
  demoState.gameObjects = [
    {
      id: 'triangle_1',
      name: 'RotatingTriangle',
      position: new Vector3(-1.5, 0, 0),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1, 1),
      components: ['Transform', 'MeshRenderer', 'Material'],
    },
    {
      id: 'triangle_2',
      name: 'PulsingTriangle',
      position: new Vector3(1.5, 0, 0),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1, 1),
      components: ['Transform', 'MeshRenderer', 'Material', 'Animator'],
    },
    {
      id: 'camera',
      name: 'MainCamera',
      position: new Vector3(0, 0, 3),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1, 1),
      components: ['Transform', 'Camera'],
    },
  ];
}

/**
 * 创建UI统计信息显示
 */
function createStatsUI(): void {
  frameStats = document.createElement('div');
  frameStats.id = 'demo-stats';
  frameStats.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: #00ff00;
    padding: 15px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    border-radius: 8px;
    z-index: 1000;
    min-width: 300px;
    border: 1px solid #00ff00;
    backdrop-filter: blur(10px);
  `;
  document.body.appendChild(frameStats);
}

/**
 * 更新统计信息显示
 */
function updateStatsUI(): void {
  if (!frameStats) {
    return;
  }

  const currentTime = performance.now();
  const deltaTime = currentTime - demoState.lastFrameTime;
  demoState.lastFrameTime = currentTime;
  demoState.frameCount++;
  demoState.totalTime += deltaTime;

  // 计算FPS
  if (deltaTime > 0) {
    demoState.fps = 1000 / deltaTime;
  }

  // 模拟内存使用增长
  engineState.memoryUsage = 20;

  frameStats.innerHTML = `
    <div><strong>🚀 Core Engine WebGL Render Flow</strong></div>
    <div>═══════════════════════════════════════</div>
    <div>📊 Engine State: <span style="color: #FFD93D">${engineState.state}</span></div>
    <div>🎯 Current Stage: <span style="color: #FFD93D">${demoState.currentStage}</span></div>
    <div>⚡ FPS: <span style="color: #4CAF50">${demoState.fps.toFixed(1)}</span></div>
    <div>🎬 Frame: <span style="color: #4CAF50">${demoState.frameCount}</span></div>
    <div>⏱️ Delta: <span style="color: #4CAF50">${deltaTime.toFixed(2)}ms</span></div>
    <div>🕒 Total: <span style="color: #4CAF50">${(demoState.totalTime / 1000).toFixed(1)}s</span></div>
    <div>═══════════════════════════════════════</div>
    <div>🎬 Scene: <span style="color: #2196F3">${engineState.activeScene}</span></div>
    <div>📦 GameObjects: <span style="color: #2196F3">${demoState.gameObjects.length}</span></div>
    <div>🔧 Systems: <span style="color: #2196F3">${engineState.systems.length}</span></div>
    <div>💾 Memory: <span style="color: #2196F3">${engineState.memoryUsage.toFixed(1)}MB</span></div>
    <div>═══════════════════════════════════════</div>
    <div style="color: #FF6B6B; font-size: 11px;">
      <div>🔄 Draw Calls: ${renderStats.drawCalls}</div>
      <div>📐 Triangles: ${renderStats.triangles}</div>
      <div>📍 Vertices: ${renderStats.vertices}</div>
      <div>🎨 Textures: ${renderStats.textures}</div>
      <div>💡 Shaders: ${renderStats.shaders}</div>
    </div>
    <div>═══════════════════════════════════════</div>
    <div style="color: #888; font-size: 10px;">
      <div>🌐 WebGL Device: Active</div>
      <div>🎯 RHI Pipeline: Running</div>
      <div>📊 Render Target: RGBA8</div>
    </div>
  `;
}

/**
 * 记录渲染流程步骤
 */
function logRenderStep(step: string, details?: string): void {
  // eslint-disable-next-line no-console
  console.log(`🔄 [${DEMO_NAME}] ${step}${details ? ` - ${details}` : ''}`);
  demoState.currentStage = step;
}

/**
 * 创建4x4旋转矩阵（绕Z轴）
 */
function createRotationMatrix4(angleInRadians: number): Float32Array {
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);

  return new Float32Array([c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

/**
 * 创建4x4缩放矩阵
 */
function createScaleMatrix4(scaleX: number, scaleY: number, scaleZ: number): Float32Array {
  return new Float32Array([scaleX, 0, 0, 0, 0, scaleY, 0, 0, 0, 0, scaleZ, 0, 0, 0, 0, 1]);
}

/**
 * 创建4x4平移矩阵
 */
function createTranslationMatrix4(x: number, y: number, z: number): Float32Array {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
}

/**
 * 创建透视投影矩阵
 */
function createPerspectiveMatrix4(fov: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1.0 / Math.tan(fov / 2);
  const rangeInv = 1 / (near - far);

  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (near + far) * rangeInv,
    -1,
    0,
    0,
    near * far * rangeInv * 2,
    0,
  ]);
}

/**
 * 初始化demo
 */
async function init(): Promise<void> {
  logRenderStep('Engine.initialize()', '开始初始化Core引擎...');

  // 模拟Engine初始化的各个阶段
  await simulateEngineInit();

  logRenderStep('RHI.setup()', '设置WebGL渲染硬件接口...');

  // 获取画布元素
  canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
  if (!canvas) {
    throw new Error(`找不到画布元素: ${CANVAS_ID}`);
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 创建WebGL设备 - 使用@maxellabs/rhi
  device = new WebGLDevice(canvas);
  logRenderStep('RHI.createDevice()', 'WebGL设备创建成功');

  // 创建着色器程序
  const vertexShader = device.createShaderModule({
    code: vertexShaderSource,
    language: 'glsl',
    stage: 'vertex',
    label: 'Core Flow Vertex Shader',
  });

  const fragmentShader = device.createShaderModule({
    code: fragmentShaderSource,
    language: 'glsl',
    stage: 'fragment',
    label: 'Core Flow Fragment Shader',
  });

  logRenderStep('Material.compile()', '着色器编译完成');

  // 创建几何数据 - 两个三角形
  const vertices = new Float32Array([
    // 第一个三角形（左侧）
    -0.5,
    0.5,
    0.0,
    1.0,
    0.2,
    0.2, // 红色顶点
    -1.0,
    -0.5,
    0.0,
    0.2,
    1.0,
    0.2, // 绿色顶点
    -0.0,
    -0.5,
    0.0,
    0.2,
    0.2,
    1.0, // 蓝色顶点

    // 第二个三角形（右侧）
    0.5,
    0.5,
    0.0,
    1.0,
    1.0,
    0.2, // 黄色顶点
    0.0,
    -0.5,
    0.0,
    1.0,
    0.2,
    1.0, // 紫色顶点
    1.0,
    -0.5,
    0.0,
    0.2,
    1.0,
    1.0, // 青色顶点
  ]);

  // 创建顶点缓冲区
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: RHIBufferUsage.VERTEX,
    hint: 'static',
    initialData: vertices,
    label: 'Core Demo Vertex Buffer',
  });

  logRenderStep('Geometry.upload()', '几何数据上传到GPU');

  // 定义顶点布局
  const vertexLayout: RHIVertexLayout = {
    buffers: [
      {
        index: 0,
        stride: 24, // 6个float (位置3 + 颜色3) * 4字节
        stepMode: 'vertex',
        attributes: [
          {
            name: 'aPosition',
            format: RHIVertexFormat.FLOAT32X3,
            offset: 0,
            shaderLocation: 0,
          },
          {
            name: 'aColor',
            format: RHIVertexFormat.FLOAT32X3,
            offset: 12,
            shaderLocation: 1,
          },
        ],
      },
    ],
  };

  // 创建独立的Uniform缓冲区
  const modelMatrixBuffer = device.createBuffer({
    size: 64, // 4x4矩阵，每个元素4字节
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Model Matrix Buffer',
  });

  const viewMatrixBuffer = device.createBuffer({
    size: 64, // 4x4矩阵，每个元素4字节
    usage: RHIBufferUsage.UNIFORM,
    hint: 'static',
    label: 'View Matrix Buffer',
  });

  const projectionMatrixBuffer = device.createBuffer({
    size: 64, // 4x4矩阵，每个元素4字节
    usage: RHIBufferUsage.UNIFORM,
    hint: 'static',
    label: 'Projection Matrix Buffer',
  });

  const timeBuffer = device.createBuffer({
    size: 4, // 单个float
    usage: RHIBufferUsage.UNIFORM,
    hint: 'dynamic',
    label: 'Time Buffer',
  });

  // 创建绑定组布局
  const bindGroupLayout = device.createBindGroupLayout(
    [
      {
        binding: 0,
        visibility: RHIShaderStage.VERTEX,
        buffer: {
          type: 'uniform',
        },
        name: 'uModelMatrix',
      },
      {
        binding: 1,
        visibility: RHIShaderStage.VERTEX,
        buffer: {
          type: 'uniform',
        },
        name: 'uViewMatrix',
      },
      {
        binding: 2,
        visibility: RHIShaderStage.VERTEX,
        buffer: {
          type: 'uniform',
        },
        name: 'uProjectionMatrix',
      },
      {
        binding: 3,
        visibility: RHIShaderStage.FRAGMENT,
        buffer: {
          type: 'uniform',
        },
        name: 'uTime',
      },
    ],
    'Transform Bind Group Layout'
  );

  // 创建绑定组
  const bindGroup = device.createBindGroup(
    bindGroupLayout,
    [
      { binding: 0, resource: modelMatrixBuffer },
      { binding: 1, resource: viewMatrixBuffer },
      { binding: 2, resource: projectionMatrixBuffer },
      { binding: 3, resource: timeBuffer },
    ],
    'Transform Bind Group'
  );

  // 创建管线布局
  const pipelineLayout = device.createPipelineLayout([bindGroupLayout], 'Core Demo Pipeline Layout');

  // 创建渲染管线
  const renderPipeline = device.createRenderPipeline({
    vertexShader,
    fragmentShader,
    vertexLayout,
    primitiveTopology: RHIPrimitiveTopology.TRIANGLE_LIST,
    layout: pipelineLayout,
    label: 'Core Demo Render Pipeline',
  });

  logRenderStep('RenderPipeline.create()', '渲染管线创建完成');

  // 初始化变换矩阵
  const viewMatrix = createTranslationMatrix4(0, 0, -3);
  const projectionMatrix = createPerspectiveMatrix4((45 * Math.PI) / 180, canvas.width / canvas.height, 0.1, 100.0);

  // 更新初始矩阵
  viewMatrixBuffer.update(viewMatrix);
  projectionMatrixBuffer.update(projectionMatrix);

  // 创建渲染目标
  renderTargetTexture = device.createTexture({
    width: canvas.width,
    height: canvas.height,
    format: RHITextureFormat.RGBA8_UNORM,
    usage: RHITextureUsage.RENDER_TARGET | RHITextureUsage.SAMPLED,
    dimension: '2d',
    label: 'Core Demo Render Target',
  });

  // 保存资源供渲染使用
  (window as any).coreFlowResources = {
    vertexBuffer,
    modelMatrixBuffer,
    viewMatrixBuffer,
    projectionMatrixBuffer,
    timeBuffer,
    bindGroup,
    renderPipeline,
    vertexCount: 6, // 两个三角形
  };

  logRenderStep('Scene.ready()', 'Scene和资源初始化完成');

  engineState.state = 'running';
  demoState.initialized = true;
  demoState.running = true;

  // eslint-disable-next-line no-console
  console.log('🎉 Core渲染流程Demo初始化完成！使用WebGL进行真实渲染');
}

/**
 * 模拟Engine初始化过程
 */
async function simulateEngineInit(): Promise<void> {
  const stages = [
    'IOC Container Setup',
    'Time Manager Init',
    'Scene Manager Init',
    'Resource Manager Init',
    'Input Manager Init',
    'Render System Init',
  ];

  for (const stage of stages) {
    logRenderStep('Engine.init()', stage);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

/**
 * 渲染循环
 */
function render(): void {
  const resources = (window as any).coreFlowResources;
  if (!resources || !demoState.running) {
    animationId = requestAnimationFrame(render);
    return;
  }

  logRenderStep('Renderer.render()', '开始WebGL渲染帧');

  // 更新时间和变换
  const time = demoState.totalTime * 0.001;

  // 更新GameObject变换（模拟Core包的Transform组件）
  demoState.gameObjects.forEach((obj) => {
    if (obj.name === 'RotatingTriangle') {
      obj.rotation.z = time * 60; // 旋转动画
    } else if (obj.name === 'PulsingTriangle') {
      const scale = 1.0 + 0.3 * Math.sin(time * 3);
      obj.scale.x = scale;
      obj.scale.y = scale;
    }
  });

  // 创建变换矩阵（模拟Core包的Transform组件计算）
  const modelMatrix1 = createRotationMatrix4((time * 30 * Math.PI) / 180);
  const modelMatrix2 = createScaleMatrix4(1.0 + 0.3 * Math.sin(time * 3), 1.0 + 0.3 * Math.sin(time * 3), 1.0);

  // 设置视图矩阵（模拟Core包的Camera组件）
  const viewMatrix = createTranslationMatrix4(0, 0, -3);

  // 设置投影矩阵（模拟Core包的Camera投影）
  const projectionMatrix = createPerspectiveMatrix4((45 * Math.PI) / 180, canvas.width / canvas.height, 0.1, 100.0);

  // 开始WebGL渲染
  const commandEncoder = device.createCommandEncoder('Core Demo Render Commands');

  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: renderTargetTexture.createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearColor: [0.1, 0.1, 0.2, 1.0],
      },
    ],
    label: 'Core Demo Render Pass',
  });

  renderPass.setPipeline(resources.renderPipeline);
  renderPass.setVertexBuffer(0, resources.vertexBuffer);
  renderPass.setBindGroup(0, resources.bindGroup);

  // 重置渲染统计
  renderStats.drawCalls = 0;
  renderStats.triangles = 0;
  renderStats.vertices = 0;

  // 更新统一的view和projection矩阵
  resources.viewMatrixBuffer.update(viewMatrix);
  resources.projectionMatrixBuffer.update(projectionMatrix);
  resources.timeBuffer.update(new Float32Array([time]));

  // 渲染第一个三角形（旋转）
  resources.modelMatrixBuffer.update(modelMatrix1);
  renderPass.draw(3, 1, 0, 0);

  renderStats.drawCalls++;
  renderStats.triangles++;
  renderStats.vertices += 3;

  // 渲染第二个三角形（缩放）
  resources.modelMatrixBuffer.update(modelMatrix2);
  renderPass.draw(3, 1, 3, 0);

  renderStats.drawCalls++;
  renderStats.triangles++;
  renderStats.vertices += 3;

  renderPass.end();

  commandEncoder.copyTextureToCanvas({
    source: renderTargetTexture.createView(),
    destination: canvas,
    origin: [0, 0],
    extent: [canvas.width, canvas.height],
  });

  // 提交WebGL命令
  device.submit([commandEncoder.finish()]);

  logRenderStep('Frame.complete()', `WebGL帧 ${demoState.frameCount} 渲染完成`);

  // 更新UI
  updateStatsUI();

  // 继续下一帧
  animationId = requestAnimationFrame(render);
}

/**
 * 设置事件监听
 */
function setupEventHandlers(): void {
  // 键盘控制
  document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
      case ' ':
        demoState.running = !demoState.running;
        engineState.state = demoState.running ? 'running' : 'paused';
        logRenderStep('Engine.pause()', `引擎${demoState.running ? '继续' : '暂停'}`);
        break;
      case 'r':
        logRenderStep('Engine.restart()', '重启渲染循环');
        demoState.frameCount = 0;
        demoState.totalTime = 0;
        break;
      case 'd':
        logRenderStep('Debug.toggle()', '切换调试模式');
        break;
      case 'escape':
        cleanup();
        break;
    }
  });

  // 窗口大小变化
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    logRenderStep('Viewport.resize()', `${canvas.width}x${canvas.height}`);
  });
}

/**
 * 清理资源
 */
function cleanup(): void {
  logRenderStep('Engine.destroy()', '开始清理WebGL资源...');

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  if (device) {
    device.destroy();
  }

  if (frameStats) {
    document.body.removeChild(frameStats);
    frameStats = null;
  }

  engineState.state = 'destroyed';
  demoState.running = false;

  // eslint-disable-next-line no-console
  console.log('✅ Core WebGL渲染流程Demo清理完成');
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    // eslint-disable-next-line no-console
    console.log('🚀 启动Core包WebGL渲染流程Demo...');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('📖 这个Demo展示了Core包到@maxellabs/rhi WebGL渲染的完整流程：');
    // eslint-disable-next-line no-console
    console.log('  1. 🔧 Engine初始化和生命周期管理');
    // eslint-disable-next-line no-console
    console.log('  2. 🎬 Scene和GameObject概念演示');
    // eslint-disable-next-line no-console
    console.log('  3. 📐 Transform变换矩阵计算');
    // eslint-disable-next-line no-console
    console.log('  4. 🎨 Material和着色器编译');
    // eslint-disable-next-line no-console
    console.log('  5. 📷 Camera视图和投影变换');
    // eslint-disable-next-line no-console
    console.log('  6. 🎯 @maxellabs/rhi WebGL渲染执行');
    // eslint-disable-next-line no-console
    console.log('');

    // 初始化状态
    initializeDemoState();

    // 创建UI
    createStatsUI();

    // 初始化WebGL渲染系统
    await init();

    // 设置事件监听
    setupEventHandlers();

    // 开始渲染循环
    animationId = requestAnimationFrame(render);

    // eslint-disable-next-line no-console
    console.log('🎉 WebGL Demo启动完成！使用空格键暂停/继续，ESC退出');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ WebGL Demo初始化失败:', error);

    if (frameStats) {
      frameStats.innerHTML = `
        <div style="color: #ff6b6b;">
          <strong>❌ WebGL Demo初始化失败</strong><br>
          ${error instanceof Error ? error.message : String(error)}
        </div>
      `;
    }
  }
}

// 启动demo
main();
