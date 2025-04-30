import { Matrix4, Vector4 } from '@maxellabs/math';
import { ShaderData } from '../shader/ShaderData';
import { ShaderMacroCollection } from '../shader/ShaderMacroCollection';
import { Camera } from '../camera/Camera';
import { Scene } from '../scene/Scene';

/**
 * 渲染上下文类，包含渲染所需的各种上下文信息
 */
export class RenderContext {
  /** 当前渲染的场景 */
  scene: Scene | null = null;
  /** 当前渲染的摄像机 */
  camera: Camera | null = null;
  /** 视图矩阵 */
  viewMatrix: Matrix4 = new Matrix4();
  /** 投影矩阵 */
  projMatrix: Matrix4 = new Matrix4();
  /** 视图投影矩阵 */
  viewProjMatrix: Matrix4 = new Matrix4();
  /** 视口 */
  viewport: Vector4 = new Vector4(0, 0, 1, 1);
  /** 当前着色器宏集合 */
  shaderMacroCollection: ShaderMacroCollection = new ShaderMacroCollection();
  /** 场景着色器数据 */
  sceneShaderData: ShaderData | null = null;
  /** 摄像机着色器数据 */
  cameraShaderData: ShaderData | null = null;
  /** 渲染模式 */
  renderMode: number = 0;
  /** 是否为透明渲染 */
  isTransparent: boolean = false;
  /** 是否使用后处理 */
  enablePostProcess: boolean = false;
  /** 是否启用HDR */
  enableHDR: boolean = false;
  /** 是否启用阴影 */
  enableShadow: boolean = false;

  /**
   * 重置渲染上下文
   */
  reset(): void {
    this.scene = null;
    this.camera = null;
    this.viewMatrix.identity();
    this.projMatrix.identity();
    this.viewProjMatrix.identity();
    this.viewport.set(0, 0, 1, 1);
    this.shaderMacroCollection.clear();
    this.sceneShaderData = null;
    this.cameraShaderData = null;
    this.renderMode = 0;
    this.isTransparent = false;
    this.enablePostProcess = false;
    this.enableHDR = false;
    this.enableShadow = false;
  }

  /**
   * 设置当前渲染场景
   * @param scene 场景
   */
  setScene(scene: Scene): void {
    this.scene = scene;
    this.sceneShaderData = scene.shaderData;
  }

  /**
   * 设置当前渲染摄像机
   * @param camera 摄像机
   */
  setCamera(camera: Camera): void {
    this.camera = camera;
    this.viewMatrix = camera.viewMatrix;
    this.projMatrix = camera.projectionMatrix;
    this.viewProjMatrix = camera.viewProjectionMatrix;
    this.viewport = camera.viewport;
    this.cameraShaderData = camera.shaderData;
    this.enablePostProcess = camera.enablePostProcess;
    this.enableHDR = camera.enableHDR;
  }

  /**
   * 合并着色器宏集合
   * @param macros 要合并的着色器宏集合
   */
  mergeMacros(macros: ShaderMacroCollection): void {
    this.shaderMacroCollection.merge(macros);
  }
} 