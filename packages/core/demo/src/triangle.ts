/**
 * triangle.ts
 * Core 包三角形渲染 Demo
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 目标
 * 验证 Core 包的完整 ECS 渲染流程和声明式 RHI 架构：
 * - Scene 管理实体
 * - Camera 实体提供视图/投影矩阵
 * - 三角形实体包含 Mesh 数据
 * - SimpleRenderer 通过声明式 RHI API 渲染
 *
 * ## 架构
 * ```
 * Scene
 *   ├─ Camera Entity (LocalTransform + Camera + CameraTarget)
 *   ├─ Triangle Entity (LocalTransform + MeshRef)
 *   └─ Renderer (SimpleRenderer)
 * ```
 *
 * ## 声明式 RHI 架构验证
 * 本 Demo 展示了从 ECS 到 RHI 的完整声明式渲染流程：
 * 1. **ECS 数据收集**：RenderSystem 查询实体，收集 Renderable 数据
 * 2. **相机矩阵计算**：CameraSystem 预计算 View/Projection 矩阵
 * 3. **着色器编译**：通过 IRHIDevice.createShaderModule() 编译 GLSL
 * 4. **BindGroup 绑定**：声明式绑定 Uniform Buffer（无 getUniformLocation）
 * 5. **Pipeline 创建**：组合所有渲染状态（着色器、顶点布局、绑定布局）
 * 6. **渲染执行**：通过 RenderPass API 提交渲染命令
 *
 * ## 关键设计点
 * - **FOV 单位**：Camera.setPerspective() 的 FOV 参数单位是【度数】而非弧度
 * - **声明式绑定**：Uniform 绑定通过 BindGroup 预定义，运行时只更新数据
 * - **着色器反射**：通过 ShaderProgram.getReflection() 获取绑定信息
 * - **类型安全**：所有 RHI 类型来自 @maxellabs/specification
 *
 * ## 使用方式
 * 在浏览器中打开 `packages/core/demo/html/triangle.html`
 */

import {
  Scene,
  LocalTransform,
  Camera,
  CameraTarget,
  MeshRef,
  Visible,
  MaterialRef,
  TransformSystem,
  CameraSystem,
  RenderSystem,
  WorldTransform,
} from '@maxellabs/core';
import { WebGLDevice } from '@maxellabs/rhi';
import { SimpleRenderer } from './utils/simple-renderer';

/**
 * 主函数
 *
 * @remarks
 * 创建 Scene、实体和渲染循环。
 */
async function main(): Promise<void> {
  console.info('[Triangle Demo] Starting...');

  // 1. 获取 Canvas 元素
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('[Triangle Demo] Canvas element not found');
    return;
  }

  try {
    // 2. 创建 WebGL Device
    const device = new WebGLDevice(canvas);
    console.info('[Triangle Demo] WebGL Device created');

    // 3. 创建 Scene
    const scene = new Scene({
      device,
      name: 'TriangleDemo',
    });
    console.info('[Triangle Demo] Scene created');

    // 4. 创建 Camera 实体
    const cameraEntity = scene.createEntity('MainCamera');

    // 添加 LocalTransform 组件（相机位置）
    // 注意：相机距离三角形 3 个单位，确保在视锥体内
    const cameraLocalTransform = LocalTransform.fromData({
      position: { x: 0, y: 0, z: 3 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    });
    scene.world.addComponent(cameraEntity, LocalTransform, cameraLocalTransform);

    // 添加 WorldTransform 组件（必需，CameraSystem 依赖此组件）
    scene.world.addComponent(cameraEntity, WorldTransform, new WorldTransform());

    // 添加 Camera 组件
    const cameraComp = new Camera();
    // 注意：setPerspective 的 FOV 参数单位是【度数】，不是弧度！
    // 45 度 FOV 是常用值，远裁剪面设为 1000
    cameraComp.setPerspective(45, canvas.width / canvas.height, 0.1, 1000);
    cameraComp.isMain = true;
    scene.world.addComponent(cameraEntity, Camera, cameraComp);

    // 添加 CameraTarget 组件（LookAt 目标）
    scene.world.addComponent(
      cameraEntity,
      CameraTarget,
      CameraTarget.fromData({
        target: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
      })
    );

    console.info('[Triangle Demo] Camera entity created');

    // 5. 创建三角形实体
    const triangleEntity = scene.createEntity('Triangle');

    // 添加 LocalTransform 组件（三角形位置）
    const triangleLocalTransform = LocalTransform.fromData({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    });
    scene.world.addComponent(triangleEntity, LocalTransform, triangleLocalTransform);

    // 添加 WorldTransform 组件（必需，RenderSystem 依赖此组件）
    scene.world.addComponent(triangleEntity, WorldTransform, new WorldTransform());

    // 添加 MeshRef 组件（引用内置三角形网格）
    scene.world.addComponent(
      triangleEntity,
      MeshRef,
      MeshRef.fromData({
        assetId: 'builtin:triangle',
      })
    );

    // 添加 MaterialRef 组件（必需，RenderSystem 依赖此组件）
    scene.world.addComponent(
      triangleEntity,
      MaterialRef,
      MaterialRef.fromData({
        assetId: 'builtin:default',
      })
    );

    // 添加 Visible 组件（必需，RenderSystem 依赖此组件）
    scene.world.addComponent(
      triangleEntity,
      Visible,
      Visible.fromData({
        value: true,
      })
    );

    console.info('[Triangle Demo] Triangle entity created');

    // 6. 创建 SimpleRenderer（声明式 RHI 渲染器）
    // SimpleRenderer 演示了声明式 RHI 架构：
    // - 使用 ShaderCompiler 编译着色器（支持缓存、引用计数、并发安全）
    // - 通过 BindGroup + BindGroupLayout 声明式绑定 Uniform
    // - 通过 PipelineLayout + RenderPipeline 组合所有渲染状态
    // 详见 packages/core/demo/src/utils/simple-renderer.ts
    //
    // 注意：使用异步工厂方法 create() 而非构造函数，因为着色器编译是异步的
    const renderer = await SimpleRenderer.create({
      device,
      canvas,
      clearColor: [0.1, 0.1, 0.1, 1.0],
    });
    console.info('[Triangle Demo] SimpleRenderer created');

    // 7. 创建并注册 Systems
    // 使用 addSystemInstance 便捷方法，自动提取 metadata 并注册
    // SystemScheduler 会在首次执行时自动调用 initialize
    const transformSystem = new TransformSystem();
    const cameraSystem = new CameraSystem();
    const renderSystem = new RenderSystem();

    // 配置 RenderSystem
    // 注意：RenderSystem 在 Render 阶段（stage=5），CameraSystem 在 PostUpdate 阶段（stage=3）
    // SystemScheduler 保证阶段顺序：CameraSystem 先计算相机矩阵，RenderSystem 再使用它们渲染
    renderSystem.setDevice(device);
    renderSystem.setRenderer(renderer);
    renderSystem.setScene(scene);

    // 使用便捷方法批量注册 Systems
    // 注意：CameraSystem 会自动为带有 Camera 组件的实体创建 CameraMatrices 组件
    scene.scheduler.addSystemInstances(transformSystem, cameraSystem, renderSystem);

    console.info('[Triangle Demo] Systems registered (will auto-initialize on first update)');

    // 8. 渲染循环
    const loop = (): void => {
      // 更新 Scene（执行 PostUpdate 和 Render 阶段的 Systems）
      scene.update(0.016); // 假设 60fps

      // 继续循环
      requestAnimationFrame(loop);
    };

    // 启动渲染循环
    console.info('[Triangle Demo] Starting render loop');
    requestAnimationFrame(loop);

    // 9. 添加清理逻辑（ESC 键退出）
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        console.info('[Triangle Demo] Cleaning up...');
        renderer.dispose();
        scene.dispose();
        console.info('[Triangle Demo] Disposed');
      }
    });

    console.info('[Triangle Demo] Initialized successfully');
    console.info('[Triangle Demo] Press ESC to exit');
  } catch (error) {
    console.error('[Triangle Demo] Initialization failed:', error);
    showError(`Initialization failed: ${(error as Error).message}`);
  }
}

/**
 * 显示错误信息
 *
 * @param message 错误消息
 */
function showError(message: string): void {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 14px;
    z-index: 9999;
  `;
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
}

// 启动 Demo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
