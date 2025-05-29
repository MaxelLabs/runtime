import type { EngineOptions } from './engine';
import { Engine } from './engine';
import { Scene, Camera, DirectionalLight, BoxGeometry, PBRMaterial, MeshRenderer, ITransform } from '@maxellabs/core';
import { Vector3, Quaternion } from '@maxellabs/math';

/**
 * 创建一个基础的演示场景
 */
export function createDemoScene(): Scene {
  // 创建场景
  const scene = new Scene('DemoScene');

  // 添加摄像机
  const cameraNode = scene.createNode('Camera');
  const camera = cameraNode.addComponent(Camera);

  camera.setPerspective(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  cameraNode.transform.setPosition(new Vector3(0, 5, 10));
  cameraNode.transform.lookAt(new Vector3(0, 0, 0));
  scene.setMainCamera(camera);

  // 添加方向光
  const lightNode = scene.createNode('DirectionalLight');
  const light = lightNode.addComponent(DirectionalLight);

  light.intensity = 1.0;
  light.color.set(1, 1, 1);
  lightNode.transform.setRotation(Quaternion.fromEuler(new Vector3(-45, 45, 0)));

  // 添加一个立方体
  const boxNode = scene.createNode('Box');
  const boxRenderer = boxNode.addComponent(MeshRenderer);

  boxRenderer.mesh = new BoxGeometry(1, 1, 1);
  boxRenderer.material = new PBRMaterial();
  boxRenderer.material.baseColor.set(0.5, 0.5, 1.0);
  boxRenderer.material.roughness = 0.3;
  boxRenderer.material.metallic = 0.7;

  // 添加一个平面作为地面
  const groundNode = scene.createNode('Ground');
  const groundTransform = groundNode.transform;

  groundTransform.setPosition(new Vector3(0, -1, 0));
  groundTransform.setScale(new Vector3(10, 0.1, 10));
  const groundRenderer = groundNode.addComponent(MeshRenderer);

  groundRenderer.mesh = new BoxGeometry(1, 1, 1);
  groundRenderer.material = new PBRMaterial();
  groundRenderer.material.baseColor.set(0.2, 0.2, 0.2);
  groundRenderer.material.roughness = 0.9;
  groundRenderer.material.metallic = 0.1;

  // 设置场景的更新函数，让立方体旋转
  scene.onUpdate = (deltaTime: number) => {
    // 旋转立方体
    const rotation = boxNode.transform.getRotation();
    const eulerAngles = Quaternion.toEuler(rotation);

    eulerAngles.y += deltaTime * 30; // 每秒旋转30度
    boxNode.transform.setRotation(Quaternion.fromEuler(eulerAngles));
  };

  return scene;
}

/**
 * 创建并初始化演示引擎
 * @param canvas 目标画布
 * @param options 引擎选项
 * @returns 初始化的引擎实例
 */
export async function createDemoEngine(
  canvas: HTMLCanvasElement,
  options: Partial<EngineOptions> = {}
): Promise<Engine> {
  // 合并默认选项
  const defaultOptions: EngineOptions = {
    canvas,
    width: canvas.width,
    height: canvas.height,
    clearColor: [0.1, 0.1, 0.1, 1],
    antialias: true,
    autoStart: true,
    targetFrameRate: 60,
    enableShadow: true,
    debug: false,
  };

  const finalOptions = { ...defaultOptions, ...options } as EngineOptions;

  // 创建引擎
  const engine = new Engine(finalOptions);

  // 初始化引擎
  await engine.initialize();

  // 创建演示场景
  const scene = createDemoScene();

  // 加载场景
  engine.loadScene(scene);

  // 处理窗口大小变化
  window.addEventListener('resize', () => {
    // 更新画布大小
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 更新摄像机宽高比
    const mainCamera = scene.getMainCamera();

    if (mainCamera) {
      mainCamera.setAspectRatio(window.innerWidth / window.innerHeight);
    }

    // 更新渲染器大小
    const renderer = engine.getContainer().resolve(engine.getServiceKeys().RENDERER);

    if (renderer) {
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  });

  return engine;
}

/**
 * 启动演示
 * @param containerId 容器元素ID
 */
export function startDemo(containerId: string = 'app'): void {
  // 获取容器元素
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`找不到ID为"${containerId}"的容器元素`);

    return;
  }

  // 创建画布
  const canvas = document.createElement('canvas');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  // 创建并启动引擎
  createDemoEngine(canvas)
    .then((engine) => {
      console.log('演示引擎启动成功');
    })
    .catch((error) => {
      console.error('演示引擎启动失败:', error);
    });
}
