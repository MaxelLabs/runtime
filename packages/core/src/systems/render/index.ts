/**
 * Render System
 * 渲染系统 - 基础渲染循环
 *
 * @packageDocumentation
 *
 * @remarks
 * ## 设计决策
 *
 * RenderSystem 是 Core 包提供的基础渲染系统，负责：
 * 1. 收集可见渲染对象
 * 2. 调用 RHI 接口执行渲染
 * 3. 提供扩展点供应用包自定义渲染流程
 *
 * ## 执行阶段
 *
 * RenderSystem 在 Render 阶段执行，是渲染流程的最后环节。
 *
 * ## 扩展方式
 *
 * 应用包可以通过以下方式扩展渲染：
 * 1. 继承 RenderSystem 重写 `onRender` 方法
 * 2. 实现自定义的渲染通道
 * 3. 注册渲染钩子
 *
 * @example
 * ```typescript
 * class PBRRenderSystem extends RenderSystem {
 *   onBeforeRender(ctx: SystemRenderContext): void {
 *     // 阴影贴图渲染
 *   }
 *
 *   onRender(ctx: SystemRenderContext, renderables: Renderable[]): void {
 *     // PBR 渲染
 *   }
 * }
 * ```
 */

import type { SystemContext, Query, EntityId } from '../../ecs';
import { SystemStage } from '../../ecs';
import type { ISystem, SystemMetadata, SystemExecutionStats } from '../types';
import { MeshRef, MaterialRef, Visible } from '../../components/visual';
import { WorldTransform } from '../../components/transform';
import { Camera } from '../../components/camera';
import { CameraMatrices } from '../camera';
import type { IRHIDevice, IRHICommandEncoder } from '@maxellabs/specification';
import type { Renderer } from '../../renderer';
import type { IScene } from '../../rhi/IScene';
import type { Renderable } from '../../renderer/render-context';

// ============ System 特有的渲染上下文 ============

/**
 * SystemRenderContext - System 渲染上下文
 * 传递给渲染钩子的上下文信息
 *
 * @remarks
 * 此接口是 RenderSystem 内部使用的上下文，包含 System 特有的字段。
 * 与 renderer/render-context.ts 中的 RenderContext 不同：
 * - 添加了 systemContext（ECS 上下文）
 * - 添加了 encoder（命令编码器）
 * - 使用 CameraMatrices 组件而非独立的矩阵字段
 *
 * ## 设计决策
 * - RenderSystem 使用 SystemRenderContext（包含 ECS 上下文）
 * - Renderer 使用 RenderContext（纯渲染数据，无 ECS 依赖）
 * - 两者通过 Renderable 类型共享可渲染对象数据
 */
export interface SystemRenderContext {
  /** System 上下文 */
  systemContext: SystemContext;
  /** Scene 引用 (用于资源访问) */
  scene: IScene | null;
  /** RHI 设备 */
  device: IRHIDevice | null;
  /** 命令编码器 */
  encoder: IRHICommandEncoder | null;
  /** 主相机实体 */
  mainCamera: EntityId | null;
  /** 相机矩阵 */
  cameraMatrices: CameraMatrices | null;
  /** 当前帧的可渲染对象 */
  renderables: Renderable[];
  /** 当前时间（秒） */
  time: number;
  /** 帧计数 */
  frameCount: number;
}

/**
 * RenderHook - 渲染钩子
 */
export type RenderHook = (ctx: SystemRenderContext) => void;

// ============ RenderSystem 实现 ============

/**
 * RenderSystem
 * 基础渲染系统，收集可见对象并执行渲染
 */
export class RenderSystem implements ISystem {
  readonly metadata: SystemMetadata = {
    name: 'RenderSystem',
    description: '基础渲染系统，收集可见对象并执行渲染',
    stage: SystemStage.Render,
    priority: 0,
    // 注意：无需声明 after: ['CameraSystem']
    // 原因：RenderSystem 在 Render 阶段（stage=5），CameraSystem 在 PostUpdate 阶段（stage=3）
    // SystemScheduler 保证不同阶段按固定顺序执行：
    //   1. FrameStart (0)
    //   2. PreUpdate (1)
    //   3. Update (2)
    //   4. PostUpdate (3) ← CameraSystem 在此阶段计算相机矩阵
    //   5. PreRender (4)
    //   6. Render (5) ← RenderSystem 在此阶段使用 CameraSystem 的输出
    //   7. FrameEnd (6)
  };

  /** RHI 设备 */
  protected device: IRHIDevice | null = null;

  /** Renderer 实例 */
  protected renderer?: Renderer;

  /** Scene 引用 */
  protected scene: IScene | null = null;

  /** 可渲染对象查询 */
  protected renderableQuery?: Query;

  /** 相机查询 */
  protected cameraQuery?: Query;

  /** 可渲染对象缓存 */
  protected renderables: Renderable[] = [];

  /** 渲染前钩子 */
  protected beforeRenderHooks: RenderHook[] = [];

  /** 渲染后钩子 */
  protected afterRenderHooks: RenderHook[] = [];

  /**
   * 设置 RHI 设备
   */
  setDevice(device: IRHIDevice): void {
    this.device = device;
  }

  /**
   * 设置渲染器 (NEW)
   * @param renderer Renderer instance
   *
   * @remarks
   * When a Renderer is set, RenderSystem will delegate rendering to it.
   * If no Renderer is set, RenderSystem falls back to legacy hooks.
   */
  setRenderer(renderer: Renderer): void {
    this.renderer = renderer;
  }

  /**
   * 初始化系统
   */
  initialize(ctx: SystemContext): Query | undefined {
    // 创建可渲染对象查询
    this.renderableQuery = ctx.world.query({
      all: [MeshRef, MaterialRef, WorldTransform, Visible],
    });

    // 创建相机查询
    this.cameraQuery = ctx.world.query({
      all: [Camera, WorldTransform, CameraMatrices],
    });

    return this.renderableQuery;
  }

  /**
   * 设置 Scene 引用
   * @param scene Scene instance
   *
   * @remarks
   * 允许 RenderSystem 直接访问 Scene，避免类型不安全的 hack。
   */
  setScene(scene: IScene): void {
    this.scene = scene;
  }

  /**
   * 执行系统逻辑
   */
  execute(ctx: SystemContext, query?: Query): SystemExecutionStats | void {
    const startTime = performance.now();

    // 1. 清空上一帧的渲染对象
    this.renderables.length = 0;

    // 2. 收集可见渲染对象
    this.collectRenderables(ctx, query ?? this.renderableQuery);

    // 3. 排序渲染对象
    this.sortRenderables();

    // 4. 获取主相机
    const mainCamera = this.findMainCamera(ctx);

    // 5. 创建渲染上下文
    const renderCtx: SystemRenderContext = {
      systemContext: ctx,
      scene: this.scene,
      device: this.device,
      encoder: null,
      mainCamera: mainCamera?.entity ?? null,
      cameraMatrices: mainCamera?.matrices ?? null,
      renderables: this.renderables,
      time: ctx.totalTime,
      frameCount: ctx.frameCount,
    };

    // NEW: 如果有 Renderer，使用 Renderer 渲染
    if (this.renderer && this.device && mainCamera && this.scene) {
      // 执行渲染前钩子 (确保钩子在 Renderer 模式下也被调用)
      this.onBeforeRender(renderCtx);
      for (const hook of this.beforeRenderHooks) {
        hook(renderCtx);
      }

      // 将 RenderSystem 收集的 renderables 传递给 Renderer
      // 类型已统一，无需映射
      this.renderer.setRenderables(this.renderables);

      // 使用 Renderer 渲染
      this.renderer.beginFrame();
      this.renderer.renderScene(this.scene, mainCamera.entity);
      this.renderer.endFrame();

      // 执行渲染后钩子
      for (const hook of this.afterRenderHooks) {
        hook(renderCtx);
      }
      this.onAfterRender(renderCtx);

      return {
        entityCount: this.renderables.length,
        executionTimeMs: performance.now() - startTime,
        skipped: false,
      };
    }

    // 6. 执行渲染前钩子 (Fallback: 保留现有逻辑)
    this.onBeforeRender(renderCtx);
    for (const hook of this.beforeRenderHooks) {
      hook(renderCtx);
    }

    // 7. 执行主渲染
    if (this.device && mainCamera) {
      this.onRender(renderCtx, this.renderables);
    }

    // 8. 执行渲染后钩子
    for (const hook of this.afterRenderHooks) {
      hook(renderCtx);
    }
    this.onAfterRender(renderCtx);

    return {
      entityCount: this.renderables.length,
      executionTimeMs: performance.now() - startTime,
      skipped: !this.device,
    };
  }

  /**
   * 收集可渲染对象
   */
  protected collectRenderables(ctx: SystemContext, query?: Query): void {
    if (!query) {
      return;
    }

    query.forEach((entity, components) => {
      const meshRef = components[0] as MeshRef;
      const materialRef = components[1] as MaterialRef;
      const worldTransform = components[2] as WorldTransform;
      const visible = components[3] as Visible;

      // 检查可见性
      if (!visible.value) {
        return;
      }

      // 创建 Renderable
      const renderable: Renderable = {
        entity,
        meshId: meshRef.assetId,
        materialId: materialRef.assetId,
        worldMatrix: worldTransform.matrix ?? {
          m00: 1,
          m01: 0,
          m02: 0,
          m03: worldTransform.position.x,
          m10: 0,
          m11: 1,
          m12: 0,
          m13: worldTransform.position.y,
          m20: 0,
          m21: 0,
          m22: 1,
          m23: worldTransform.position.z,
          m30: 0,
          m31: 0,
          m32: 0,
          m33: 1,
        },
        layer: 0, // 可以从 Layer 组件获取
        sortKey: 0, // 可以基于深度或材质计算
        visible: visible.value,
      };

      this.renderables.push(renderable);
    });
  }

  /**
   * 排序可渲染对象
   * 默认按 sortKey 排序，子类可重写实现自定义排序
   */
  protected sortRenderables(): void {
    this.renderables.sort((a, b) => a.sortKey - b.sortKey);
  }

  /**
   * 查找主相机
   */
  protected findMainCamera(ctx: SystemContext): { entity: EntityId; matrices: CameraMatrices } | null {
    if (!this.cameraQuery) {
      return null;
    }

    let mainCameraEntity: EntityId | null = null;
    let mainCameraMatrices: CameraMatrices | null = null;
    let highestPriority = -Infinity;

    this.cameraQuery.forEach((entity, components) => {
      const camera = components[0] as Camera;
      const matrices = components[2] as CameraMatrices;

      // 优先选择标记为主相机的
      if (camera.isMain) {
        if (camera.priority > highestPriority) {
          mainCameraEntity = entity;
          mainCameraMatrices = matrices;
          highestPriority = camera.priority;
        }
      }
    });

    if (mainCameraEntity !== null && mainCameraMatrices !== null) {
      return { entity: mainCameraEntity, matrices: mainCameraMatrices };
    }

    return null;
  }

  // ==================== 扩展点 ====================

  /**
   * 渲染前回调（子类可重写）
   */
  protected onBeforeRender(_ctx: SystemRenderContext): void {
    // 子类实现
  }

  /**
   * 主渲染回调（子类可重写）
   * @remarks
   * 默认实现不做任何渲染，由具体应用包实现渲染逻辑
   */
  protected onRender(_ctx: SystemRenderContext, _renderables: Renderable[]): void {
    // 子类实现具体渲染逻辑
    // 例如：
    // - Engine: PBR 渲染
    // - Effects: 精灵/粒子渲染
    // - Charts: 图表渲染
    // - Design: 矢量图形渲染
  }

  /**
   * 渲染后回调（子类可重写）
   */
  protected onAfterRender(_ctx: SystemRenderContext): void {
    // 子类实现
  }

  // ==================== 钩子管理 ====================

  /**
   * 添加渲染前钩子
   */
  addBeforeRenderHook(hook: RenderHook): void {
    this.beforeRenderHooks.push(hook);
  }

  /**
   * 移除渲染前钩子
   */
  removeBeforeRenderHook(hook: RenderHook): boolean {
    const index = this.beforeRenderHooks.indexOf(hook);
    if (index !== -1) {
      this.beforeRenderHooks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 添加渲染后钩子
   */
  addAfterRenderHook(hook: RenderHook): void {
    this.afterRenderHooks.push(hook);
  }

  /**
   * 移除渲染后钩子
   */
  removeAfterRenderHook(hook: RenderHook): boolean {
    const index = this.afterRenderHooks.indexOf(hook);
    if (index !== -1) {
      this.afterRenderHooks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 销毁系统
   */
  dispose(ctx: SystemContext): void {
    if (this.renderableQuery) {
      ctx.world.removeQuery(this.renderableQuery);
      this.renderableQuery = undefined;
    }
    if (this.cameraQuery) {
      ctx.world.removeQuery(this.cameraQuery);
      this.cameraQuery = undefined;
    }
    this.renderables.length = 0;
    this.beforeRenderHooks.length = 0;
    this.afterRenderHooks.length = 0;
  }
}

// ============ 便捷函数 ============

/**
 * 创建 RenderSystem 实例
 */
export function createRenderSystem(): RenderSystem {
  return new RenderSystem();
}
