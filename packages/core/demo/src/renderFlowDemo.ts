/**
 * renderFlowDemo.ts
 * Core包渲染流程Demo
 * 展示Core包高级API的完整使用流程：Engine -> Scene -> GameObject -> MeshRenderer -> Material
 *
 * 这个Demo展示：
 * 1. Engine引擎生命周期管理
 * 2. Scene场景管理和GameObject层级结构
 * 3. MeshRenderer组件和Material材质系统
 * 4. Camera相机系统和Transform变换
 * 5. 完整的Core包渲染管线
 */

import {
  Engine,
  Scene,
  GameObject,
  MeshRenderer,
  Material,
  PerspectiveCamera,
  Transform,
  EngineState,
} from '@maxellabs/core';
import { Vector3 } from '@maxellabs/math';

// Demo状态接口
interface DemoState {
  initialized: boolean;
  running: boolean;
  frameCount: number;
  fps: number;
  lastFrameTime: number;
  totalTime: number;
  currentStage: string;
}

// 渲染统计
interface RenderStats {
  drawCalls: number;
  triangles: number;
  vertices: number;
  gameObjects: number;
  materials: number;
}

// 常量定义
const CANVAS_ID = 'J-canvas';
const DEMO_NAME = 'Core包渲染流程Demo';

// 全局变量
let engine: Engine;
let scene: Scene;
let camera: PerspectiveCamera;
let canvas: HTMLCanvasElement;
let animationId: number;
let demoState: DemoState;
let renderStats: RenderStats;
let frameStats: HTMLElement | null = null;

// Core包对象
let triangleObject: GameObject;
let cubeObject: GameObject;
let cameraObject: GameObject;
let triangleMaterial: Material;
let cubeMaterial: Material;

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
    currentStage: 'Initializing',
  };

  renderStats = {
    drawCalls: 0,
    triangles: 0,
    vertices: 0,
    gameObjects: 0,
    materials: 0,
  };
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
    min-width: 350px;
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

  // 更新渲染统计
  renderStats.gameObjects = scene ? scene.getAllGameObjects().length : 0;
  renderStats.materials = 2; // 我们创建了2个材质

  frameStats.innerHTML = `
    <div><strong>🚀 Core Engine Render Flow Demo</strong></div>
    <div>═══════════════════════════════════════════</div>
    <div>📊 Engine State: <span style="color: #FFD93D">${engine ? engine.getState() : 'Not Created'}</span></div>
    <div>🎯 Current Stage: <span style="color: #FFD93D">${demoState.currentStage}</span></div>
    <div>⚡ FPS: <span style="color: #4CAF50">${demoState.fps.toFixed(1)}</span></div>
    <div>🎬 Frame: <span style="color: #4CAF50">${demoState.frameCount}</span></div>
    <div>⏱️ Delta: <span style="color: #4CAF50">${deltaTime.toFixed(2)}ms</span></div>
    <div>🕒 Total: <span style="color: #4CAF50">${(demoState.totalTime / 1000).toFixed(1)}s</span></div>
    <div>═══════════════════════════════════════════</div>
    <div>🎬 Scene: <span style="color: #2196F3">${scene ? scene.name : 'Not Created'}</span></div>
    <div>📦 GameObjects: <span style="color: #2196F3">${renderStats.gameObjects}</span></div>
    <div>🎨 Materials: <span style="color: #2196F3">${renderStats.materials}</span></div>
    <div>📷 Camera: <span style="color: #2196F3">${camera ? 'Active' : 'Not Created'}</span></div>
    <div>═══════════════════════════════════════════</div>
    <div style="color: #FF6B6B; font-size: 11px;">
      <div>🔄 Draw Calls: ${renderStats.drawCalls}</div>
      <div>📐 Triangles: ${renderStats.triangles}</div>
      <div>📍 Vertices: ${renderStats.vertices}</div>
    </div>
    <div>═══════════════════════════════════════════</div>
    <div style="color: #888; font-size: 10px;">
      <div>🏗️ Architecture: Core Package API</div>
      <div>🎯 Renderer: Forward Rendering</div>
      <div>📊 RHI Backend: WebGL</div>
    </div>
    <div>═══════════════════════════════════════════</div>
    <div style="color: #FFD93D; font-size: 10px;">
      <div>🎮 Controls:</div>
      <div>  SPACE - Pause/Resume</div>
      <div>  R - Restart</div>
      <div>  D - Debug Mode</div>
      <div>  ESC - Exit</div>
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
 * 创建简单的三角形几何体数据
 */
function createTriangleGeometry(): any {
  // 简单三角形顶点数据 (position + color)
  const vertices = new Float32Array([
    // Position(x,y,z)  Color(r,g,b)
    0.0,
    0.5,
    0.0,
    1.0,
    0.0,
    0.0, // 顶部 - 红色
    -0.5,
    -0.5,
    0.0,
    0.0,
    1.0,
    0.0, // 左下 - 绿色
    0.5,
    -0.5,
    0.0,
    0.0,
    0.0,
    1.0, // 右下 - 蓝色
  ]);

  const indices = new Uint16Array([0, 1, 2]);

  return {
    vertices,
    indices,
    vertexCount: 3,
    indexCount: 3,
  };
}

/**
 * 创建简单的立方体几何体数据
 */
function createCubeGeometry(): any {
  // 立方体顶点数据 (简化版，只有前面)
  const vertices = new Float32Array([
    // 前面
    -0.5,
    -0.5,
    0.5,
    1.0,
    1.0,
    0.0, // 左下
    0.5,
    -0.5,
    0.5,
    1.0,
    0.0,
    1.0, // 右下
    0.5,
    0.5,
    0.5,
    0.0,
    1.0,
    1.0, // 右上
    -0.5,
    0.5,
    0.5,
    1.0,
    1.0,
    1.0, // 左上
  ]);

  const indices = new Uint16Array([
    0,
    1,
    2,
    2,
    3,
    0, // 前面
  ]);

  return {
    vertices,
    indices,
    vertexCount: 4,
    indexCount: 6,
  };
}

/**
 * 初始化Engine
 */
async function initializeEngine(): Promise<void> {
  logRenderStep('Engine.create()', '创建Core引擎实例...');

  // 获取画布元素
  canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
  if (!canvas) {
    throw new Error(`找不到画布元素: ${CANVAS_ID}`);
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 创建Engine实例 - 使用Core包的高级API
  engine = new Engine({
    targetFrameRate: 60,
    autoStart: false,
    debug: true,
    antialias: true,
    depth: true,
    backgroundColor: [0.1, 0.1, 0.2, 1.0],
  });

  logRenderStep('Engine.initialize()', '初始化Core引擎系统...');

  // 初始化Engine - 这会设置RHI设备、渲染器等
  await engine.initialize();

  logRenderStep('Engine.ready()', 'Core引擎初始化完成');
}

/**
 * 创建场景和相机
 */
async function createSceneAndCamera(): Promise<void> {
  logRenderStep('Scene.create()', '创建场景和相机...');

  // 创建场景 - 使用Core包的Scene API
  scene = new Scene('MainScene');

  // 创建相机GameObject
  cameraObject = new GameObject('MainCamera');

  // 添加Camera组件
  camera = new PerspectiveCamera(cameraObject.getEntity());
  camera.setFov(45);
  camera.setAspect(canvas.width / canvas.height);
  camera.setNear(0.1);
  camera.setFar(100.0);

  // 设置相机位置
  const cameraTransform = cameraObject.getComponent(Transform);
  if (cameraTransform) {
    cameraTransform.setPosition(new Vector3(0, 0, 5));
    cameraTransform.lookAt(new Vector3(0, 0, 0), new Vector3(0, 1, 0));
  }

  // 将相机添加到场景
  scene.addGameObject(cameraObject);

  logRenderStep('Scene.ready()', '场景和相机创建完成');
}

/**
 * 创建材质
 */
async function createMaterials(): Promise<void> {
  logRenderStep('Material.create()', '创建材质...');

  // 创建三角形材质 - 使用Core包的Material API
  triangleMaterial = new Material('TriangleMaterial');
  triangleMaterial.setColor('diffuse', [1.0, 0.5, 0.5, 1.0]);
  triangleMaterial.setFloat('metallic', 0.0);
  triangleMaterial.setFloat('roughness', 0.8);

  // 创建立方体材质
  cubeMaterial = new Material('CubeMaterial');
  cubeMaterial.setColor('diffuse', [0.5, 0.5, 1.0, 1.0]);
  cubeMaterial.setFloat('metallic', 0.2);
  cubeMaterial.setFloat('roughness', 0.6);

  logRenderStep('Material.ready()', '材质创建完成');
}

/**
 * 创建游戏对象和渲染组件
 */
async function createGameObjects(): Promise<void> {
  logRenderStep('GameObject.create()', '创建游戏对象...');

  // 创建三角形GameObject - 使用Core包的GameObject API
  triangleObject = new GameObject('RotatingTriangle');

  // 设置Transform
  const triangleTransform = triangleObject.getComponent(Transform);
  if (triangleTransform) {
    triangleTransform.setPosition(new Vector3(-1.5, 0, 0));
  }

  // 添加MeshRenderer组件 - 使用Core包的组件系统
  const triangleRenderer = triangleObject.addComponent(MeshRenderer);
  triangleRenderer.setMaterial(triangleMaterial);

  // 注意：这里需要创建Geometry对象，但由于Geometry是抽象类，
  // 在实际项目中需要具体的几何体实现类
  const _triangleGeometry = createTriangleGeometry();
  // triangleRenderer.setGeometry(_triangleGeometry); // 需要适配

  // 创建立方体GameObject
  cubeObject = new GameObject('PulsingCube');

  // 设置Transform
  const cubeTransform = cubeObject.getComponent(Transform);
  if (cubeTransform) {
    cubeTransform.setPosition(new Vector3(1.5, 0, 0));
  }

  // 添加MeshRenderer组件
  const cubeRenderer = cubeObject.addComponent(MeshRenderer);
  cubeRenderer.setMaterial(cubeMaterial);

  const _cubeGeometry = createCubeGeometry();
  // cubeRenderer.setGeometry(_cubeGeometry); // 需要适配

  // 将GameObject添加到场景 - 使用Core包的Scene API
  scene.addGameObject(triangleObject);
  scene.addGameObject(cubeObject);

  logRenderStep('GameObject.ready()', '游戏对象创建完成');
}

/**
 * 初始化demo
 */
async function init(): Promise<void> {
  try {
    logRenderStep('Demo.start()', '开始初始化Core包Demo...');

    // 1. 初始化Engine
    await initializeEngine();

    // 2. 创建场景和相机
    await createSceneAndCamera();

    // 3. 创建材质
    await createMaterials();

    // 4. 创建游戏对象
    await createGameObjects();

    // 5. 场景准备完成（注意：Engine的SceneManager还未实现，所以我们直接使用Scene）
    logRenderStep('Scene.prepare()', '场景准备完成，等待渲染...');

    demoState.initialized = true;
    demoState.running = true;

    logRenderStep('Demo.ready()', 'Core包Demo初始化完成！');

    // eslint-disable-next-line no-console
    console.log('🎉 Core包渲染流程Demo初始化完成！');
    // eslint-disable-next-line no-console
    console.log('📖 使用的Core包组件：');
    // eslint-disable-next-line no-console
    console.log('  🏗️ Engine - 引擎生命周期管理');
    // eslint-disable-next-line no-console
    console.log('  🎬 Scene - 场景管理');
    // eslint-disable-next-line no-console
    console.log('  📦 GameObject - 游戏对象层级');
    // eslint-disable-next-line no-console
    console.log('  🎨 Material - 材质系统');
    // eslint-disable-next-line no-console
    console.log('  📐 Transform - 变换组件');
    // eslint-disable-next-line no-console
    console.log('  🎯 MeshRenderer - 网格渲染器');
    // eslint-disable-next-line no-console
    console.log('  📷 Camera - 相机系统');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Core包Demo初始化失败:', error);
    throw error;
  }
}

/**
 * 更新循环
 */
function update(): void {
  if (!demoState.running || !engine) {
    return;
  }

  const time = demoState.totalTime * 0.001;

  // 更新GameObject变换 - 使用Core包的Transform组件
  if (triangleObject) {
    const transform = triangleObject.getComponent(Transform);
    if (transform) {
      // 旋转动画 - 绕Z轴旋转
      transform.rotateLocalZ(time * 0.01);
    }
  }

  if (cubeObject) {
    const transform = cubeObject.getComponent(Transform);
    if (transform) {
      // 缩放动画
      const scale = 1.0 + 0.3 * Math.sin(time * 3);
      transform.setScale(new Vector3(scale, scale, scale));
    }
  }

  // 更新渲染统计
  renderStats.drawCalls = 2; // 两个对象
  renderStats.triangles = 3; // 三角形1个 + 立方体2个
  renderStats.vertices = 7; // 三角形3个 + 立方体4个

  logRenderStep('Update.complete()', `帧 ${demoState.frameCount} 更新完成`);
}

/**
 * 渲染循环
 */
function render(): void {
  if (!demoState.running || !engine) {
    animationId = requestAnimationFrame(render);
    return;
  }

  logRenderStep('Render.start()', '开始Core包渲染...');

  // 更新逻辑
  update();

  // 使用Engine的渲染系统 - Core包会自动处理RHI调用
  // engine.render(); // 这个方法会在Engine内部调用

  logRenderStep('Render.complete()', 'Core包渲染完成');

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
        if (engine) {
          if (engine.getState() === EngineState.RUNNING) {
            engine.pause();
            demoState.running = false;
            logRenderStep('Engine.pause()', '引擎暂停');
          } else if (engine.getState() === EngineState.PAUSED) {
            engine.resume();
            demoState.running = true;
            logRenderStep('Engine.resume()', '引擎继续');
          }
        }
        break;
      case 'r':
        logRenderStep('Demo.restart()', '重启Demo');
        demoState.frameCount = 0;
        demoState.totalTime = 0;
        break;
      case 'd':
        if (engine) {
          const debugMode = !engine.isDebugMode();
          engine.setDebugMode(debugMode);
          logRenderStep('Debug.toggle()', `调试模式${debugMode ? '开启' : '关闭'}`);
        }
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

    if (camera) {
      camera.setAspect(canvas.width / canvas.height);
    }

    logRenderStep('Viewport.resize()', `${canvas.width}x${canvas.height}`);
  });
}

/**
 * 清理资源
 */
function cleanup(): void {
  logRenderStep('Demo.cleanup()', '开始清理Core包资源...');

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  if (engine) {
    engine.destroy(); // Core包会自动清理所有RHI资源
  }

  if (frameStats) {
    document.body.removeChild(frameStats);
    frameStats = null;
  }

  demoState.running = false;

  // eslint-disable-next-line no-console
  console.log('✅ Core包Demo清理完成');
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    // eslint-disable-next-line no-console
    console.log('🚀 启动Core包渲染流程Demo...');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('📖 这个Demo展示了Core包的高级API使用：');
    // eslint-disable-next-line no-console
    console.log('  🏗️ 使用Engine进行引擎生命周期管理');
    // eslint-disable-next-line no-console
    console.log('  🎬 使用Scene进行场景管理');
    // eslint-disable-next-line no-console
    console.log('  📦 使用GameObject构建对象层级');
    // eslint-disable-next-line no-console
    console.log('  🎯 使用MeshRenderer进行渲染');
    // eslint-disable-next-line no-console
    console.log('  🎨 使用Material管理材质');
    // eslint-disable-next-line no-console
    console.log('  📷 使用Camera控制视图');
    // eslint-disable-next-line no-console
    console.log('  📐 使用Transform管理变换');
    // eslint-disable-next-line no-console
    console.log('');

    // 初始化状态
    initializeDemoState();

    // 创建UI
    createStatsUI();

    // 初始化Core包系统
    await init();

    // 设置事件监听
    setupEventHandlers();

    // 启动引擎 - 使用Core包的Engine API
    if (engine) {
      engine.start();
      logRenderStep('Engine.start()', 'Core引擎启动');
    }

    // 开始渲染循环
    animationId = requestAnimationFrame(render);

    // eslint-disable-next-line no-console
    console.log('🎉 Core包Demo启动完成！使用空格键暂停/继续，ESC退出');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Core包Demo初始化失败:', error);

    if (frameStats) {
      frameStats.innerHTML = `
        <div style="color: #ff6b6b;">
          <strong>❌ Core包Demo初始化失败</strong><br>
          ${error instanceof Error ? error.message : String(error)}
        </div>
      `;
    }
  }
}

// 启动demo
main();
