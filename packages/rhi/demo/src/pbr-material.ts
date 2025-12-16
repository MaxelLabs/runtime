/**
 * pbr-material.ts
 * 基于物理的渲染（PBR）材质系统 Demo
 *
 * 核心特性：
 * - Cook-Torrance BRDF（双向反射分布函数）
 * - 金属度/粗糙度工作流（Metallic/Roughness Workflow）
 * - GGX法线分布函数（NDF）
 * - Schlick几何衰减（Geometry Attenuation）
 * - Fresnel反射（Fresnel Reflection）
 * - HDR色调映射 + Gamma校正
 *
 * 重构说明：
 * - 使用 SimplePBRMaterial 工具类封装材质逻辑
 * - 保持原有功能完整性
 */

import { MSpec, MMath } from '@maxellabs/core';
import type { SimplePBRLightParams, SimplePBRMaterialParams } from './utils';
import { DemoRunner, OrbitController, Stats, GeometryGenerator, SimpleGUI, SimplePBRMaterial } from './utils';

// ==================== 主程序 ====================

const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'PBR Material Demo',
  clearColor: [0.1, 0.1, 0.1, 1.0],
});

let depthTexture: MSpec.IRHITexture;

const updateDepthTexture = () => {
  if (depthTexture) {
    depthTexture.destroy();
  }
  depthTexture = runner.track(
    runner.device.createTexture({
      width: runner.width,
      height: runner.height,
      format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
      usage: MSpec.RHITextureUsage.RENDER_ATTACHMENT,
      label: 'Depth Texture',
    })
  );
};

// 材质参数
const materialParams: SimplePBRMaterialParams = {
  metallic: 0.5,
  roughness: 0.5,
  albedo: [1.0, 0.0, 0.0], // 红色
  ambientStrength: 0.03,
};

// 光源参数
const lightParams: SimplePBRLightParams[] = [
  {
    position: [3.0, 3.0, 3.0],
    color: [1.0, 1.0, 1.0],
    constant: 1.0,
    linear: 0.09,
    quadratic: 0.032,
  },
  {
    position: [-3.0, 2.0, 2.0],
    color: [0.8, 0.9, 1.0],
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

    updateDepthTexture();
    runner.onResize(updateDepthTexture);

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

    // 创建SimplePBRMaterial
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

    // GUI 控制
    const gui = new SimpleGUI();

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

    // 矩阵
    const modelMatrix = new MMath.Matrix4();
    const normalMatrix = new MMath.Matrix4();

    // 渲染循环
    runner.start((dt) => {
      stats.begin();

      orbit.update(dt);

      // 更新材质参数
      pbrMaterial.setMaterialParams(materialParams);
      pbrMaterial.update();

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

      // 渲染
      const { encoder, passDescriptor } = runner.beginFrame();

      // 设置深度附件
      passDescriptor.depthStencilAttachment = {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      };

      const renderPass = encoder.beginRenderPass(passDescriptor);

      // 绑定材质并渲染
      pbrMaterial.bind(renderPass);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setIndexBuffer(indexBuffer, MSpec.RHIIndexFormat.UINT16);
      renderPass.drawIndexed(sphereGeometry.indices!.length);

      renderPass.end();

      runner.endFrame(encoder);

      stats.end();
    });
  } catch (error) {
    console.error('Demo initialization failed:', error);
    throw error;
  }
})();
