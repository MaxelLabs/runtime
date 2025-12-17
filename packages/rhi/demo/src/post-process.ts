/**
 * post-process.ts
 * PBR + 后处理 Demo - 展示 PBR 渲染 + 后处理效果链
 *
 * 核心特性：
 * - PBR 材质渲染（Cook-Torrance BRDF）
 * - 离屏渲染到纹理（Render-to-Texture）
 * - 后处理效果链（Bloom 泛光 -> FXAA 抗锯齿）
 * - Ping-Pong 缓冲区管理
 * - 实时参数调节
 *
 * 渲染流程：
 * 1. 场景Pass：PBR 渲染到离屏纹理
 * 2. Bloom Pass：提取高亮区域并模糊叠加
 * 3. FXAA Pass：抗锯齿处理
 * 4. 输出到屏幕
 */

import { MSpec, MMath } from '@maxellabs/core';
import type { SimplePBRLightParams, SimplePBRMaterialParams } from './utils';
import {
  DemoRunner,
  OrbitController,
  Stats,
  GeometryGenerator,
  SimpleGUI,
  SimplePBRMaterial,
  RenderTarget,
  FXAA,
  Bloom,
} from './utils';

// ==================== 主程序 ====================

const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'PBR + Post-Processing Demo',
  clearColor: [0.0, 0.0, 0.0, 1.0],
});

// 渲染目标
let sceneRenderTarget: RenderTarget; // 场景离屏渲染
let bloomRenderTarget: RenderTarget; // Bloom 中间缓冲
let depthTexture: MSpec.IRHITexture;

// 后处理效果
let bloomEffect: Bloom | null = null;
let fxaaEffect: FXAA | null = null;

// 后处理参数
const postProcessParams = {
  // Bloom 参数
  enableBloom: true,
  bloomThreshold: 0.3, // 降低阈值，更多区域产生 bloom
  bloomIntensity: 2.5, // 增强强度
  bloomRadius: 8, // 增大模糊半径
  // FXAA 参数
  enableFXAA: true,
  fxaaSubpixelQuality: 0.75,
  fxaaEdgeThreshold: 0.166,
  fxaaEdgeThresholdMin: 0.0833,
};

const updateRenderTargets = () => {
  // 销毁旧资源
  if (depthTexture) {
    depthTexture.destroy();
  }
  if (sceneRenderTarget) {
    sceneRenderTarget.destroy();
  }
  if (bloomRenderTarget) {
    bloomRenderTarget.destroy();
  }

  // 创建场景渲染目标（离屏）
  sceneRenderTarget = runner.track(
    new RenderTarget(runner.device, {
      width: runner.width,
      height: runner.height,
      colorFormat: MSpec.RHITextureFormat.RGBA8_UNORM,
      depthFormat: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
      label: 'Scene Render Target',
    })
  );

  // 创建 Bloom 中间缓冲
  bloomRenderTarget = runner.track(
    new RenderTarget(runner.device, {
      width: runner.width,
      height: runner.height,
      colorFormat: MSpec.RHITextureFormat.RGBA8_UNORM,
      label: 'Bloom Render Target',
    })
  );

  depthTexture = sceneRenderTarget.getDepthTexture()!;
};

// PBR 材质参数
const materialParams: SimplePBRMaterialParams = {
  metallic: 0.9,
  roughness: 0.3,
  albedo: [1.0, 0.8, 0.2], // 金色 - 更容易看到 Bloom 效果
  ambientStrength: 0.05,
};

// 光源参数 - 增强亮度以产生更明显的 Bloom
const lightParams: SimplePBRLightParams[] = [
  {
    position: [3.0, 3.0, 3.0],
    color: [5.0, 5.0, 5.0], // 大幅增强亮度
    constant: 1.0,
    linear: 0.09,
    quadratic: 0.032,
  },
  {
    position: [-3.0, 2.0, 2.0],
    color: [3.0, 3.5, 4.0], // 偏蓝色高亮
    constant: 1.0,
    linear: 0.09,
    quadratic: 0.032,
  },
];

(async function main() {
  try {
    await runner.init();

    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 5,
      enableDamping: true,
    });

    updateRenderTargets();
    runner.onResize(() => {
      updateRenderTargets();
      // 重新创建后处理效果（分辨率改变）
      if (bloomEffect) {
        bloomEffect.destroy();
        bloomEffect = runner.track(
          new Bloom(runner.device, {
            threshold: postProcessParams.bloomThreshold,
            intensity: postProcessParams.bloomIntensity,
            radius: postProcessParams.bloomRadius,
          })
        );
      }
      if (fxaaEffect) {
        fxaaEffect.destroy();
        fxaaEffect = runner.track(
          new FXAA(runner.device, {
            subpixelQuality: postProcessParams.fxaaSubpixelQuality,
            edgeThreshold: postProcessParams.fxaaEdgeThreshold,
            edgeThresholdMin: postProcessParams.fxaaEdgeThresholdMin,
          })
        );
      }
    });

    // ==================== 创建场景几何体 ====================

    // 创建球体几何体
    const sphereGeometry = GeometryGenerator.sphere({
      radius: 1,
      normals: true,
      uvs: false,
    });

    const vertexBuffer = runner.track(
      runner.device.createBuffer({
        size: sphereGeometry.vertices.byteLength,
        usage: MSpec.RHIBufferUsage.VERTEX,
        hint: 'static',
        initialData: sphereGeometry.vertices as BufferSource,
        label: 'Sphere Vertex Buffer',
      })
    );

    const indexBuffer = runner.track(
      runner.device.createBuffer({
        size: sphereGeometry.indices!.byteLength,
        usage: MSpec.RHIBufferUsage.INDEX,
        hint: 'static',
        initialData: sphereGeometry.indices as BufferSource,
        label: 'Sphere Index Buffer',
      })
    );

    // ==================== 创建 PBR 材质 ====================

    const pbrMaterial = new SimplePBRMaterial(runner.device, materialParams, lightParams);

    // 初始化材质（加载环境贴图）
    const cubemapUrls = {
      posX: '../assets/cube/Bridge2/posx.jpg',
      negX: '../assets/cube/Bridge2/negx.jpg',
      posY: '../assets/cube/Bridge2/posy.jpg',
      negY: '../assets/cube/Bridge2/negy.jpg',
      posZ: '../assets/cube/Bridge2/posz.jpg',
      negZ: '../assets/cube/Bridge2/negz.jpg',
    };

    await pbrMaterial.initialize(cubemapUrls);

    // ==================== 创建后处理效果 ====================

    bloomEffect = runner.track(
      new Bloom(runner.device, {
        threshold: postProcessParams.bloomThreshold,
        intensity: postProcessParams.bloomIntensity,
        radius: postProcessParams.bloomRadius,
      })
    );

    fxaaEffect = runner.track(
      new FXAA(runner.device, {
        subpixelQuality: postProcessParams.fxaaSubpixelQuality,
        edgeThreshold: postProcessParams.fxaaEdgeThreshold,
        edgeThresholdMin: postProcessParams.fxaaEdgeThresholdMin,
      })
    );

    // ==================== GUI 控制 ====================

    const gui = new SimpleGUI();

    // PBR 材质控制
    gui.addSeparator('🎨 PBR Material');
    gui.add('metallic', {
      value: materialParams.metallic,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.metallic = v as number;
      },
    });

    gui.add('roughness', {
      value: materialParams.roughness,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.roughness = v as number;
      },
    });

    gui.add('ambientStrength', {
      value: materialParams.ambientStrength,
      min: 0,
      max: 0.2,
      step: 0.01,
      onChange: (v) => {
        materialParams.ambientStrength = v as number;
      },
    });

    // Albedo 颜色控制
    gui.addSeparator('🌈 Albedo Color');
    gui.add('albedoR', {
      value: materialParams.albedo[0],
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.albedo[0] = v as number;
      },
    });
    gui.add('albedoG', {
      value: materialParams.albedo[1],
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.albedo[1] = v as number;
      },
    });
    gui.add('albedoB', {
      value: materialParams.albedo[2],
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        materialParams.albedo[2] = v as number;
      },
    });

    // Bloom 控制
    gui.addSeparator('🌟 Bloom');
    gui.add('enableBloom', {
      value: postProcessParams.enableBloom,
      onChange: (v) => {
        postProcessParams.enableBloom = v as boolean;
      },
    });

    gui.add('bloomThreshold', {
      value: postProcessParams.bloomThreshold,
      min: 0,
      max: 2,
      step: 0.05,
      onChange: (v) => {
        postProcessParams.bloomThreshold = v as number;
        bloomEffect?.setParameters({ threshold: v });
      },
    });

    gui.add('bloomIntensity', {
      value: postProcessParams.bloomIntensity,
      min: 0,
      max: 5,
      step: 0.1,
      onChange: (v) => {
        postProcessParams.bloomIntensity = v as number;
        bloomEffect?.setParameters({ intensity: v });
      },
    });

    gui.add('bloomRadius', {
      value: postProcessParams.bloomRadius,
      min: 1,
      max: 15,
      step: 1,
      onChange: (v) => {
        postProcessParams.bloomRadius = v as number;
        bloomEffect?.setParameters({ radius: v });
      },
    });

    // FXAA 控制
    gui.addSeparator('✨ FXAA');
    gui.add('enableFXAA', {
      value: postProcessParams.enableFXAA,
      onChange: (v) => {
        postProcessParams.enableFXAA = v as boolean;
      },
    });

    gui.add('fxaaSubpixelQuality', {
      value: postProcessParams.fxaaSubpixelQuality,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        postProcessParams.fxaaSubpixelQuality = v as number;
        fxaaEffect?.setParameters({ subpixelQuality: v });
      },
    });

    // 矩阵
    const modelMatrix = new MMath.Matrix4();
    const normalMatrix = new MMath.Matrix4();

    // ==================== 键盘事件处理 ====================

    runner.onKey('Escape', () => {
      stats.destroy();
      orbit.destroy();
      gui.destroy();
      pbrMaterial.destroy();
      if (bloomEffect) {
        bloomEffect.destroy();
      }
      if (fxaaEffect) {
        fxaaEffect.destroy();
      }
      if (sceneRenderTarget) {
        sceneRenderTarget.destroy();
      }
      if (bloomRenderTarget) {
        bloomRenderTarget.destroy();
      }
      runner.destroy();
    });

    runner.onKey('F11', (_, event) => {
      event.preventDefault();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        runner.canvas.requestFullscreen();
      }
    });

    // 显示帮助信息
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);

    // ==================== 渲染循环 ====================

    runner.start((dt) => {
      stats.begin();

      orbit.update(dt);

      // 更新材质参数
      pbrMaterial.setMaterialParams(materialParams);
      pbrMaterial.update();
      pbrMaterial.reset(); // Reset dynamic offsets

      // 缓慢旋转
      modelMatrix.identity();
      modelMatrix.rotateY(performance.now() * 0.0005);

      // 计算法线矩阵
      normalMatrix.copyFrom(modelMatrix);
      normalMatrix.invert();
      normalMatrix.transpose();

      // 更新变换矩阵
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);
      const cameraPos = orbit.getPosition();

      pbrMaterial.updateTransforms(modelMatrix, viewMatrix, projMatrix, normalMatrix, cameraPos);

      // 开始渲染
      const { encoder, passDescriptor } = runner.beginFrame();

      // ==================== Pass 1: 场景渲染到离屏纹理 ====================

      const scenePass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: sceneRenderTarget.getColorTexture().createView(),
            loadOp: 'clear',
            storeOp: 'store',
            clearColor: [0.05, 0.05, 0.08, 1.0], // 深蓝色背景
          },
        ],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          clearDepth: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
        },
      });

      // 绑定材质并渲染
      pbrMaterial.bind(scenePass);
      scenePass.setVertexBuffer(0, vertexBuffer);
      scenePass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
      scenePass.drawIndexed(sphereGeometry.indices!.length);

      scenePass.end();

      // ==================== Pass 2-3: 后处理链 ====================

      const sceneTexture = sceneRenderTarget.getColorTexture();
      const bloomTexture = bloomRenderTarget.getColorTexture();
      const outputView = passDescriptor.colorAttachments![0].view;

      // 确定后处理链
      const applyBloom = postProcessParams.enableBloom && bloomEffect;
      const applyFXAA = postProcessParams.enableFXAA && fxaaEffect;

      if (applyBloom && applyFXAA) {
        // Bloom -> FXAA -> 屏幕
        const sceneView = sceneTexture.createView();
        const bloomView = bloomTexture.createView();

        // Pass 2: Bloom
        bloomEffect!.apply(encoder, sceneView, bloomView);

        // Pass 3: FXAA
        fxaaEffect!.apply(encoder, bloomView, outputView);
      } else if (applyBloom) {
        // Bloom -> 屏幕
        const sceneView = sceneTexture.createView();
        bloomEffect!.apply(encoder, sceneView, outputView);
      } else if (applyFXAA) {
        // FXAA -> 屏幕
        const sceneView = sceneTexture.createView();
        fxaaEffect!.apply(encoder, sceneView, outputView);
      } else {
        // 直接复制到屏幕 - 使用简单的 blit pass
        const outputPass = encoder.beginRenderPass(passDescriptor);
        outputPass.end();
        // 使用 copyTextureToCanvas 命令
        encoder.copyTextureToCanvas({
          source: sceneTexture.createView(),
          destination: runner.canvas,
        });
      }

      runner.endFrame(encoder);

      stats.end();
    });
  } catch (error) {
    console.error('Demo initialization failed:', error);
    throw error;
  }
})();
