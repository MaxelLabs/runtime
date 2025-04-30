import { RenderPass, RenderPassType } from '../RenderPass';
import type { RenderContext } from '../RenderContext';

/**
 * 不透明物体渲染通道，用于渲染场景中的不透明物体
 */
export class OpaqueRenderPass extends RenderPass {
  /**
   * 创建不透明物体渲染通道
   * @param name 通道名称
   * @param priority 优先级
   */
  constructor(name: string, priority: number) {
    super(name, RenderPassType.Opaque, priority);
  }

  /**
   * 执行渲染通道
   * @param context 渲染上下文
   */
  override render(context: RenderContext): void {
    const { scene, camera } = context;
    
    if (!scene || !camera) {
      return;
    }

    // 获取当前渲染目标
    const renderTarget = this.renderTarget || camera.renderTarget;
    
    // 获取硬件渲染器
    const renderer = scene.engine._hardwareRenderer;

    // 设置渲染目标
    if (renderTarget) {
      renderer.bindRenderTarget(renderTarget);
    } else {
      renderer.bindDefaultRenderTarget();
    }

    // 设置视口
    const viewport = camera.viewport;
    renderer.setViewport(
      viewport.x,
      viewport.y,
      viewport.z,
      viewport.w
    );

    // 如果需要清除缓冲区
    if (camera.clearFlags) {
      renderer.clear(camera.clearFlags);
    }

    // 准备场景中的可见渲染对象
    scene._prepareRenderObjects(camera);

    // 获取不透明渲染队列
    const opaqueQueue = scene._opaqueQueue;

    // 如果队列为空，直接返回
    if (opaqueQueue.length === 0) {
      return;
    }

    // 设置渲染上下文状态
    context.isTransparent = false;
    
    // 遍历渲染不透明对象
    for (let i = 0, len = opaqueQueue.length; i < len; i++) {
      const renderObject = opaqueQueue[i];
      
      // 渲染对象
      this._renderObject(renderObject, context);
    }
  }

  /**
   * 渲染单个对象
   * @param renderObject 渲染对象
   * @param context 渲染上下文
   */
  private _renderObject(renderObject: any, context: RenderContext): void {
    const renderer = context.scene.engine._hardwareRenderer;
    
    // 获取渲染对象的材质
    const material = renderObject.material;
    
    // 如果没有材质，则跳过
    if (!material) {
      return;
    }
    
    // 获取渲染对象的网格
    const mesh = renderObject.mesh;
    
    // 如果没有网格，则跳过
    if (!mesh) {
      return;
    }

    // 获取着色器程序
    const shaderProgram = material.getShaderProgram(context.shaderMacroCollection);
    
    // 如果没有着色器程序，则跳过
    if (!shaderProgram) {
      return;
    }
    
    // 绑定着色器程序
    renderer.bindShaderProgram(shaderProgram);
    
    // 更新材质的着色器参数
    material.updateShaderData(context);
    
    // 绑定全局着色器数据
    renderer.bindShaderData(context.sceneShaderData);
    renderer.bindShaderData(context.cameraShaderData);
    
    // 绑定材质的着色器数据
    renderer.bindShaderData(material.shaderData);
    
    // 绑定网格顶点数据
    renderer.bindVertexBuffers(mesh.vertexBuffers);
    
    // 如果有索引缓冲区，则使用索引缓冲区绘制
    if (mesh.indexBuffer) {
      renderer.bindIndexBuffer(mesh.indexBuffer);
      renderer.drawIndexed(mesh.indexBuffer.count);
    } else {
      // 否则，使用顶点数量绘制
      renderer.draw(mesh.vertexBuffers[0].count);
    }
  }
} 