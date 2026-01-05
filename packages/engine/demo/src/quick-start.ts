/**
 * quick-start.ts
 * Engine 快速入门 Demo
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 目标
 * 展示 Engine 包的核心 API 和一站式开发体验：
 * - Engine 主类初始化
 * - PBRMaterial 材质创建
 * - 内置几何体生成
 * - 渲染循环启动
 *
 * ## 架构
 * ```
 * Engine
 *   ├─ device: WebGLDevice
 *   ├─ scene: Scene (ECS)
 *   ├─ renderer: ForwardRenderer
 *   └─ resources: ResourceManager
 * ```
 *
 * ## 使用方式
 * 在浏览器中打开 `packages/engine/demo/html/quick-start.html`
 */

import { Engine } from '../../src';
import { LocalTransform, WorldTransform } from '@maxellabs/core';

// Stats tracking
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;
let frameTime = 0;

/**
 * Update stats display
 */
function updateStats(deltaTime: number): void {
  frameCount++;
  frameTime = deltaTime * 1000;

  const currentTime = performance.now();
  if (currentTime - lastTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = currentTime;

    // Update UI
    const fpsEl = document.getElementById('fps');
    const frameTimeEl = document.getElementById('frameTime');
    const trianglesEl = document.getElementById('triangles');

    if (fpsEl) {
      fpsEl.textContent = fps.toString();
    }
    if (frameTimeEl) {
      frameTimeEl.textContent = frameTime.toFixed(2) + ' ms';
    }
    if (trianglesEl) {
      trianglesEl.textContent = '12';
    } // Box has 12 triangles
  }
}

/**
 * Show error message
 */
function showError(message: string): void {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(244, 67, 54, 0.95);
    color: white;
    padding: 24px 32px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    z-index: 9999;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  `;
  errorDiv.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 12px;">Error</div>
    <div>${message}</div>
  `;
  document.body.appendChild(errorDiv);

  // Hide loading
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'none';
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.info('[Engine Quick Start] Initializing...');

  try {
    // 1. Create Engine instance
    // Engine wraps Core Scene + RHI Device + ForwardRenderer
    const engine = new Engine({
      canvas: '#canvas',
      antialias: true,
      debug: true,
    });

    console.info('[Engine Quick Start] Engine created');
    console.info('[Engine Quick Start] - Device:', engine.device);
    console.info('[Engine Quick Start] - Scene:', engine.scene);
    console.info('[Engine Quick Start] - Renderer:', engine.renderer);

    // 2. Create PBR material with metallic-roughness workflow
    const redMaterial = engine.createPBRMaterial({
      baseColor: [0.8, 0.2, 0.2, 1.0], // Red
      metallic: 0.5,
      roughness: 0.3,
    });
    console.info('[Engine Quick Start] PBR Material created:', redMaterial);

    // 3. Create Unlit material for comparison
    const whiteMaterial = engine.createUnlitMaterial({
      color: [1.0, 1.0, 1.0, 1.0],
    });
    console.info('[Engine Quick Start] Unlit Material created:', whiteMaterial);

    // 4. Create geometries using convenience API
    const boxGeometry = engine.createBoxGeometry(1, 1, 1);
    console.info('[Engine Quick Start] Box Geometry created:', {
      positions: boxGeometry.positions.length / 3,
      normals: boxGeometry.normals?.length,
      uvs: boxGeometry.uvs?.length,
      indices: boxGeometry.indices?.length,
    });

    const sphereGeometry = engine.createSphereGeometry(0.5);
    console.info('[Engine Quick Start] Sphere Geometry created:', {
      positions: sphereGeometry.positions.length / 3,
    });

    const planeGeometry = engine.createPlaneGeometry(2, 2);
    console.info('[Engine Quick Start] Plane Geometry created:', {
      positions: planeGeometry.positions.length / 3,
    });

    const cylinderGeometry = engine.createCylinderGeometry(0.5, 0.5, 1, 32);
    console.info('[Engine Quick Start] Cylinder Geometry created:', {
      positions: cylinderGeometry.positions.length / 3,
    });

    // 5. Create mesh entities (geometry + material = renderable entity)
    // This is the key step that was missing!
    const boxMesh = engine.createMesh(boxGeometry, redMaterial, {
      position: [0, 0, 0],
      name: 'RedBox',
    });
    console.info('[Engine Quick Start] Box Mesh entity created:', boxMesh);

    const sphereMesh = engine.createMesh(sphereGeometry, whiteMaterial, {
      position: [2, 0, 0],
      name: 'WhiteSphere',
    });
    console.info('[Engine Quick Start] Sphere Mesh entity created:', sphereMesh);

    const planeMesh = engine.createMesh(planeGeometry, redMaterial, {
      position: [0, -1, 0],
      rotation: [-0.7071068, 0, 0, 0.7071068], // Quaternion: -90° around X axis
      name: 'RedPlane',
    });
    console.info('[Engine Quick Start] Plane Mesh entity created:', planeMesh);

    const cylinderMesh = engine.createMesh(cylinderGeometry, whiteMaterial, {
      position: [-2, 0, 0],
      name: 'WhiteCylinder',
    });
    console.info('[Engine Quick Start] Cylinder Mesh entity created:', cylinderMesh);

    // 6. Animation state
    let time = 0;
    const cameraRadius = 6;
    const cameraHeight = 3;

    // 7. Set up callbacks for the render loop
    engine.onBeforeRender = (deltaTime: number) => {
      time += deltaTime;

      // Animate camera around the scene (验证 Camera 集成)
      const cameraEntity = engine.mainCamera;
      if (cameraEntity !== null) {
        const localTransform = engine.scene.world.getComponent(cameraEntity, LocalTransform);
        const worldTransform = engine.scene.world.getComponent(cameraEntity, WorldTransform);

        if (localTransform) {
          // 相机绕 Y 轴旋转
          localTransform.position.x = Math.sin(time * 0.3) * cameraRadius;
          localTransform.position.y = cameraHeight;
          localTransform.position.z = Math.cos(time * 0.3) * cameraRadius;
          localTransform.markDirty();

          // 同步到 WorldTransform (简化版，实际应由 TransformSystem 处理)
          if (worldTransform) {
            worldTransform.position.x = localTransform.position.x;
            worldTransform.position.y = localTransform.position.y;
            worldTransform.position.z = localTransform.position.z;
          }
        }
      }

      // Animate box rotation (验证 WorldTransform 集成)
      const boxTransform = engine.scene.world.getComponent(boxMesh, LocalTransform);
      const boxWorldTransform = engine.scene.world.getComponent(boxMesh, WorldTransform);
      if (boxTransform && boxWorldTransform) {
        // 绕 Y 轴旋转
        const angle = time * 0.5;
        const halfAngle = angle / 2;
        boxTransform.rotation.x = 0;
        boxTransform.rotation.y = Math.sin(halfAngle);
        boxTransform.rotation.z = 0;
        boxTransform.rotation.w = Math.cos(halfAngle);
        boxTransform.markDirty();

        // 同步到 WorldTransform
        boxWorldTransform.rotation.x = boxTransform.rotation.x;
        boxWorldTransform.rotation.y = boxTransform.rotation.y;
        boxWorldTransform.rotation.z = boxTransform.rotation.z;
        boxWorldTransform.rotation.w = boxTransform.rotation.w;
      }

      // Update stats
      updateStats(deltaTime);
    };

    engine.onAfterRender = () => {
      // Post-render logic (if needed)
    };

    // 8. Start the render loop
    console.info('[Engine Quick Start] Starting render loop...');
    engine.start();

    // 9. Handle cleanup on ESC key
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        console.info('[Engine Quick Start] Stopping...');
        engine.stop();
        engine.dispose();
        console.info('[Engine Quick Start] Disposed');
      }
    });

    // 10. Log success
    console.info('[Engine Quick Start] Initialized successfully!');
    console.info('[Engine Quick Start] Press ESC to exit');

    // Log API summary
    console.info(`
╔══════════════════════════════════════════════════════════════╗
║                    Engine Quick Start Demo                   ║
╠══════════════════════════════════════════════════════════════╣
║  Created Resources:                                          ║
║  ├─ PBRMaterial (red, metallic=0.5, roughness=0.3)          ║
║  ├─ UnlitMaterial (white)                                    ║
║  ├─ BoxGeometry (1×1×1)                                      ║
║  ├─ SphereGeometry (r=0.5)                                   ║
║  ├─ PlaneGeometry (2×2)                                      ║
║  └─ CylinderGeometry (r=0.5, h=1)                           ║
╠══════════════════════════════════════════════════════════════╣
║  Created Mesh Entities:                                      ║
║  ├─ RedBox (center)                                          ║
║  ├─ WhiteSphere (right)                                      ║
║  ├─ RedPlane (floor)                                         ║
║  └─ WhiteCylinder (left)                                     ║
╠══════════════════════════════════════════════════════════════╣
║  Engine Architecture:                                        ║
║  ├─ device: IRHIDevice (WebGLDevice)                        ║
║  ├─ scene: Scene (from @maxellabs/core)                     ║
║  ├─ renderer: ForwardRenderer                                ║
║  └─ resources: ResourceManager                               ║
╚══════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('[Engine Quick Start] Failed:', error);
    showError((error as Error).message);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
