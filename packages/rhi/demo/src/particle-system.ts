/**
 * particle-system.ts
 * GPU 粒子系统 Demo
 *
 * 核心特性：
 * - 使用 GPU 实例化技术高效渲染 10000+ 粒子
 * - 多种发射器形状（点、盒、球、锥）
 * - 粒子生命周期管理和动画
 * - 力场效果（重力、风力、涡流、吸引器）
 * - 颜色/大小/透明度随生命周期渐变
 *
 * 技术要点：
 * - ParticleBuffer：粒子数据管理和 GPU 上传
 * - ParticleEmitter：粒子发射器
 * - ParticleAnimator：生命周期动画
 * - ParticleRenderer：Billboard 实例化渲染
 * - 透明混合（Alpha/Additive）
 */

import { MSpec } from '@maxellabs/core';
import {
  DemoRunner,
  OrbitController,
  Stats,
  SimpleGUI,
  ParticleBuffer,
  ParticleEmitter,
  ParticleAnimator,
  ParticleRenderer,
  particleVertexShader,
  particleFragmentShader,
} from './utils';

// ==================== 主程序 ====================

const runner = new DemoRunner({
  canvasId: 'J-canvas',
  name: 'GPU Particle System Demo',
  clearColor: [0.02, 0.02, 0.05, 1.0],
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

(async function main() {
  try {
    await runner.init();

    const stats = new Stats({ position: 'top-left', show: ['fps', 'ms'] });
    const orbit = new OrbitController(runner.canvas, {
      distance: 15,
      enableDamping: true,
      minDistance: 3,
      maxDistance: 50,
      target: [0, 2, 0],
    });

    updateDepthTexture();
    runner.onResize(updateDepthTexture);

    // ==================== GUI 参数 ====================
    const gui = new SimpleGUI();
    const params = {
      // 发射器参数
      emitterShape: 0, // 0: point, 1: box, 2: sphere, 3: cone
      emissionRate: 200,
      particleLifetime: 3.0,
      particleSize: 0.15,
      // 速度参数
      initialVelocityY: 5.0,
      velocityVariance: 2.0,
      // 动画参数
      enableColorGradient: true,
      enableSizeGradient: true,
      enableAlphaGradient: true,
      // 力场参数
      gravity: -3.0,
      enableWind: false,
      windStrength: 2.0,
      enableVortex: false,
      vortexStrength: 3.0,
      // 渲染参数
      blendMode: 0, // 0: alpha, 1: additive
    };

    // ==================== 创建粒子系统组件 ====================
    const MAX_PARTICLES = 10000;

    // 1. 粒子缓冲区
    const particleBuffer = runner.track(
      new ParticleBuffer(runner.device, {
        maxParticles: MAX_PARTICLES,
        label: 'MainParticleBuffer',
      })
    );

    // 2. 粒子发射器配置
    const getEmitterConfig = () => {
      const shapes = ['point', 'box', 'sphere', 'cone'] as const;
      return {
        shape: shapes[params.emitterShape],
        rate: params.emissionRate,
        lifetime: params.particleLifetime,
        lifetimeVariance: 0.3,
        velocity: new Float32Array([0, params.initialVelocityY, 0]),
        velocityVariance: new Float32Array([
          params.velocityVariance,
          params.velocityVariance * 0.5,
          params.velocityVariance,
        ]),
        color: new Float32Array([1.0, 0.8, 0.3, 1.0]), // 温暖的金黄色
        colorVariance: new Float32Array([0.2, 0.2, 0.1, 0]),
        size: params.particleSize,
        sizeVariance: 0.3,
        position: new Float32Array([0, 0, 0]),
        emitterSize: new Float32Array([1.0, 2.0, 1.0]), // box/sphere/cone 尺寸
      };
    };

    // 3. 粒子发射器
    const emitter = new ParticleEmitter(particleBuffer, getEmitterConfig());

    // 4. 粒子动画器
    const animator = new ParticleAnimator(particleBuffer, {
      colorOverLifetime: {
        start: new Float32Array([1.0, 0.9, 0.4, 1.0]), // 亮黄色
        end: new Float32Array([1.0, 0.2, 0.1, 0.0]), // 红色透明
      },
      sizeOverLifetime: {
        start: params.particleSize,
        end: params.particleSize * 0.3,
      },
      alphaOverLifetime: {
        start: 1.0,
        end: 0.0,
      },
    });

    // 添加重力力场
    animator.addForceField({
      type: 'gravity',
      strength: Math.abs(params.gravity),
    });

    // 5. 粒子渲染器
    const particleRenderer = runner.track(
      new ParticleRenderer(runner.device, particleBuffer, {
        billboardSize: params.particleSize,
        blendMode: params.blendMode === 0 ? 'alpha' : 'additive',
        label: 'MainParticleRenderer',
      })
    );

    // ==================== 创建 Uniform 缓冲区 ====================
    // Transforms Uniform: mat4 view + mat4 projection = 128 bytes
    const transformsBuffer = runner.track(
      runner.device.createBuffer({
        size: 128,
        usage: MSpec.RHIBufferUsage.UNIFORM,
        hint: 'dynamic',
        label: 'Transforms Uniform Buffer',
      })
    );

    // ==================== 创建着色器 ====================
    const vertexShader = runner.track(
      runner.device.createShaderModule({
        code: particleVertexShader,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.VERTEX,
      })
    );

    const fragmentShader = runner.track(
      runner.device.createShaderModule({
        code: particleFragmentShader,
        language: 'glsl',
        stage: MSpec.RHIShaderStage.FRAGMENT,
      })
    );

    // ==================== 创建绑定组布局 ====================
    const bindGroupLayout = runner.track(
      runner.device.createBindGroupLayout([
        { binding: 0, visibility: MSpec.RHIShaderStage.VERTEX, buffer: { type: 'uniform' }, name: 'Transforms' },
      ])
    );

    // ==================== 创建渲染管线 ====================
    const pipelineLayout = runner.track(runner.device.createPipelineLayout([bindGroupLayout]));

    // 获取顶点缓冲区布局
    const vertexBufferLayouts = particleRenderer.getVertexBufferLayouts();

    const vertexLayout: MSpec.RHIVertexLayout = {
      buffers: vertexBufferLayouts,
    };

    // 获取混合状态
    const blendState = particleRenderer.getBlendState();

    const pipeline = runner.track(
      runner.device.createRenderPipeline({
        vertexShader,
        fragmentShader,
        vertexLayout,
        primitiveTopology: MSpec.RHIPrimitiveTopology.TRIANGLE_LIST,
        layout: pipelineLayout,
        rasterizationState: { cullMode: MSpec.RHICullMode.NONE }, // 双面渲染
        depthStencilState: {
          depthWriteEnabled: false, // 粒子不写深度
          depthCompare: MSpec.RHICompareFunction.LESS,
          format: MSpec.RHITextureFormat.DEPTH24_UNORM_STENCIL8,
        },
        colorBlendState: blendState,
      })
    );

    // ==================== 创建绑定组 ====================
    const bindGroup = runner.track(
      runner.device.createBindGroup(bindGroupLayout, [{ binding: 0, resource: { buffer: transformsBuffer } }])
    );

    // ==================== GUI 控制 ====================
    gui.addSeparator('发射器参数 (Emitter)');
    gui.add('emitterShape', {
      value: params.emitterShape,
      min: 0,
      max: 3,
      step: 1,
      onChange: (v) => {
        params.emitterShape = v as number;
        emitter.updateConfig(getEmitterConfig());
      },
    });
    gui.add('emissionRate', {
      value: params.emissionRate,
      min: 10,
      max: 500,
      step: 10,
      onChange: (v) => {
        params.emissionRate = v as number;
        emitter.updateConfig({ rate: params.emissionRate });
      },
    });
    gui.add('particleLifetime', {
      value: params.particleLifetime,
      min: 0.5,
      max: 10.0,
      step: 0.5,
      onChange: (v) => {
        params.particleLifetime = v as number;
        emitter.updateConfig({ lifetime: params.particleLifetime });
      },
    });
    gui.add('particleSize', {
      value: params.particleSize,
      min: 0.05,
      max: 0.5,
      step: 0.01,
      onChange: (v) => {
        params.particleSize = v as number;
        emitter.updateConfig({ size: params.particleSize });
        particleRenderer.setBillboardSize(params.particleSize);
      },
    });

    gui.addSeparator('速度参数 (Velocity)');
    gui.add('initialVelocityY', {
      value: params.initialVelocityY,
      min: 0,
      max: 15.0,
      step: 0.5,
      onChange: (v) => {
        params.initialVelocityY = v as number;
        emitter.updateConfig({ velocity: new Float32Array([0, params.initialVelocityY, 0]) });
      },
    });
    gui.add('velocityVariance', {
      value: params.velocityVariance,
      min: 0,
      max: 5.0,
      step: 0.1,
      onChange: (v) => {
        params.velocityVariance = v as number;
        emitter.updateConfig({
          velocityVariance: new Float32Array([
            params.velocityVariance,
            params.velocityVariance * 0.5,
            params.velocityVariance,
          ]),
        });
      },
    });

    gui.addSeparator('力场参数 (Forces)');
    gui.add('gravity', {
      value: params.gravity,
      min: -15.0,
      max: 0,
      step: 0.5,
      onChange: (v) => {
        params.gravity = v as number;
        // 更新重力力场
        animator.clearForceFields();
        animator.addForceField({ type: 'gravity', strength: Math.abs(params.gravity) });
        if (params.enableWind) {
          animator.addForceField({
            type: 'wind',
            strength: params.windStrength,
            direction: new Float32Array([1, 0, 0]),
          });
        }
        if (params.enableVortex) {
          animator.addForceField({
            type: 'vortex',
            strength: params.vortexStrength,
            position: new Float32Array([0, 3, 0]),
            radius: 5.0,
          });
        }
      },
    });
    gui.add('enableWind', {
      value: params.enableWind,
      onChange: (v) => {
        params.enableWind = v as boolean;
        animator.clearForceFields();
        animator.addForceField({ type: 'gravity', strength: Math.abs(params.gravity) });
        if (params.enableWind) {
          animator.addForceField({
            type: 'wind',
            strength: params.windStrength,
            direction: new Float32Array([1, 0, 0]),
          });
        }
        if (params.enableVortex) {
          animator.addForceField({
            type: 'vortex',
            strength: params.vortexStrength,
            position: new Float32Array([0, 3, 0]),
            radius: 5.0,
          });
        }
      },
    });
    gui.add('enableVortex', {
      value: params.enableVortex,
      onChange: (v) => {
        params.enableVortex = v as boolean;
        animator.clearForceFields();
        animator.addForceField({ type: 'gravity', strength: Math.abs(params.gravity) });
        if (params.enableWind) {
          animator.addForceField({
            type: 'wind',
            strength: params.windStrength,
            direction: new Float32Array([1, 0, 0]),
          });
        }
        if (params.enableVortex) {
          animator.addForceField({
            type: 'vortex',
            strength: params.vortexStrength,
            position: new Float32Array([0, 3, 0]),
            radius: 5.0,
          });
        }
      },
    });

    gui.addSeparator('动画参数 (Animation)');
    gui.add('enableColorGradient', {
      value: params.enableColorGradient,
      onChange: (v) => {
        params.enableColorGradient = v as boolean;
        animator.updateAnimation({
          colorOverLifetime: params.enableColorGradient
            ? {
                start: new Float32Array([1.0, 0.9, 0.4, 1.0]),
                end: new Float32Array([1.0, 0.2, 0.1, 0.0]),
              }
            : undefined,
        });
      },
    });
    gui.add('enableSizeGradient', {
      value: params.enableSizeGradient,
      onChange: (v) => {
        params.enableSizeGradient = v as boolean;
        animator.updateAnimation({
          sizeOverLifetime: params.enableSizeGradient
            ? { start: params.particleSize, end: params.particleSize * 0.3 }
            : undefined,
        });
      },
    });
    gui.add('enableAlphaGradient', {
      value: params.enableAlphaGradient,
      onChange: (v) => {
        params.enableAlphaGradient = v as boolean;
        animator.updateAnimation({
          alphaOverLifetime: params.enableAlphaGradient ? { start: 1.0, end: 0.0 } : undefined,
        });
      },
    });

    // ==================== 渲染循环 ====================
    const transformsData = new Float32Array(32);

    runner.start((dt) => {
      orbit.update(dt);
      stats.begin();

      // 1. 发射新粒子
      emitter.update(dt);

      // 2. 更新粒子物理和动画
      particleBuffer.update(dt, new Float32Array([0, params.gravity, 0]));
      animator.update(dt);

      // 3. 上传粒子数据到 GPU
      particleBuffer.uploadToGPU();

      // 4. 更新相机 Uniform
      const viewMatrix = orbit.getViewMatrix();
      const projMatrix = orbit.getProjectionMatrix(runner.width / runner.height);
      transformsData.set(viewMatrix, 0);
      transformsData.set(projMatrix, 16);
      transformsBuffer.update(transformsData, 0);

      // 5. 渲染
      const { encoder, passDescriptor } = runner.beginFrame();
      passDescriptor.depthStencilAttachment = {
        view: depthTexture.createView(),
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
      };

      const renderPass = encoder.beginRenderPass(passDescriptor);
      renderPass.setPipeline(pipeline);
      renderPass.setBindGroup(0, bindGroup);

      // 使用粒子渲染器绘制
      particleRenderer.render(renderPass);

      renderPass.end();
      runner.endFrame(encoder);

      stats.end();
    });

    // ==================== 帮助信息和键盘事件 ====================
    DemoRunner.showHelp([
      'ESC: 退出 Demo',
      'F11: 切换全屏',
      'R: 重置视角',
      'SPACE: 粒子爆发',
      '鼠标左键拖动: 旋转视角',
      '鼠标滚轮: 缩放',
      '鼠标右键拖动: 平移',
    ]);

    runner.onKey('r', () => {
      orbit.reset();
    });

    runner.onKey(' ', () => {
      // 粒子爆发效果
      emitter.burst(100);
    });

    runner.onKey('Escape', () => {
      if (depthTexture) {
        depthTexture.destroy();
      }
      stats.destroy();
      orbit.destroy();
      gui.destroy();
      particleBuffer.destroy();
      particleRenderer.destroy();
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

    // 显示统计信息
    const particleStats = particleBuffer.getStats();
    console.info('[Particle System Demo] Initialized');
    console.info(`  Max Particles: ${particleStats.maxParticles}`);
    console.info(`  Buffer Size: ${(particleStats.bufferSize / 1024).toFixed(2)} KB`);
    console.info(`  Stride: ${particleStats.strideBytes} bytes/particle`);
  } catch (error) {
    console.error('Particle System Demo Error:', error);
    throw error;
  }
})();
