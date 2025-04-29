import { Scene } from '../scene/scene';
import { Camera } from '../camera/camera';
import { Entity } from '../base/entity';
import { Mesh } from './mesh';
import { Light, LightType } from '../light/light';

/**
 * 渲染器设置接口
 */
export interface RendererOptions {
  canvas: HTMLCanvasElement;
  width?: number;
  height?: number;
  clearColor?: [number, number, number, number];
  antialias?: boolean;
}

/**
 * 渲染器基类 - 处理场景渲染
 */
export abstract class Renderer {
  protected canvas: HTMLCanvasElement;
  protected width: number;
  protected height: number;
  protected clearColor: [number, number, number, number] = [0, 0, 0, 1];
  protected antialias: boolean = true;
  protected isInitialized: boolean = false;

  constructor(options: RendererOptions) {
    this.canvas = options.canvas;
    this.width = options.width || this.canvas.width;
    this.height = options.height || this.canvas.height;
    
    if (options.clearColor) {
      this.clearColor = options.clearColor;
    }
    
    if (options.antialias !== undefined) {
      this.antialias = options.antialias;
    }
  }

  /**
   * 初始化渲染器
   */
  public abstract initialize(): void;

  /**
   * 调整渲染器大小
   */
  public setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 子类应实现此方法以更新视口
    this.updateViewport();
  }

  /**
   * 更新视口
   */
  protected abstract updateViewport(): void;

  /**
   * 渲染场景
   */
  public abstract render(scene: Scene, camera: Camera): void;

  /**
   * 清除场景
   */
  protected abstract clear(): void;

  /**
   * 销毁渲染器并释放资源
   */
  public abstract dispose(): void;
}

/**
 * WebGL渲染器实现
 */
export class WebGLRenderer extends Renderer {
  private gl: WebGLRenderingContext | null = null;
  private meshes: Map<string, WebGLMeshData> = new Map();
  
  /**
   * 初始化WebGL上下文
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      this.gl = this.canvas.getContext('webgl', {
        antialias: this.antialias,
        alpha: true,
      });
      
      if (!this.gl) {
        throw new Error('WebGL not supported');
      }
      
      // 设置初始状态
      this.gl.clearColor(
        this.clearColor[0],
        this.clearColor[1],
        this.clearColor[2],
        this.clearColor[3]
      );
      
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.enable(this.gl.CULL_FACE);
      this.gl.cullFace(this.gl.BACK);
      
      this.updateViewport();
      this.isInitialized = true;
      
      console.log('WebGLRenderer initialized');
    } catch (error) {
      console.error('Failed to initialize WebGLRenderer:', error);
    }
  }
  
  /**
   * 更新视口大小
   */
  protected updateViewport(): void {
    if (this.gl) {
      this.gl.viewport(0, 0, this.width, this.height);
    }
  }
  
  /**
   * 清除渲染缓冲区
   */
  protected clear(): void {
    if (this.gl) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
  }
  
  /**
   * 渲染场景
   */
  public render(scene: Scene, camera: Camera): void {
    if (!this.gl || !this.isInitialized) {
      this.initialize();
    }
    
    this.clear();
    
    // 收集场景中的可渲染对象
    const renderables = this.collectRenderables(scene);
    
    // 处理灯光
    const lights = this.collectLights(scene);
    
    // 为每个可渲染对象执行渲染流程
    for (const entity of renderables) {
      this.renderEntity(entity, camera, lights);
    }
  }
  
  /**
   * 收集场景中的可渲染实体
   */
  private collectRenderables(scene: Scene): Entity[] {
    const renderables: Entity[] = [];
    
    scene.traverse((entity) => {
      // 如果实体具有Mesh组件，则加入渲染列表
      if (entity.getComponent(Mesh)) {
        renderables.push(entity);
      }
    });
    
    return renderables;
  }
  
  /**
   * 收集场景中的灯光
   */
  private collectLights(scene: Scene): Light[] {
    const lights: Light[] = [];
    
    scene.traverse((entity) => {
      const lightComponents = entity.getComponentsOfType(Light);
      lights.push(...lightComponents);
    });
    
    return lights;
  }
  
  /**
   * 渲染单个实体
   */
  private renderEntity(entity: Entity, camera: Camera, lights: Light[]): void {
    const mesh = entity.getComponent(Mesh);
    if (!mesh) return;
    
    // 这里应该有更详细的渲染逻辑，包括：
    // 1. 获取或创建WebGL缓冲区
    // 2. 设置着色器程序
    // 3. 设置顶点属性
    // 4. 设置统一变量（变换矩阵、材质属性、灯光等）
    // 5. 绘制命令
    
    // 简化的实现占位符
    console.log(`Rendering entity: ${entity.name}`);
  }
  
  /**
   * 销毁渲染器并释放资源
   */
  public dispose(): void {
    // 清除所有缓冲区和着色器程序
    this.meshes.clear();
    
    // 重置状态
    this.isInitialized = false;
    this.gl = null;
    
    console.log('WebGLRenderer disposed');
  }
}

/**
 * WebGL渲染数据类型（内部使用）
 */
interface WebGLMeshData {
  vertexBuffer: WebGLBuffer | null;
  indexBuffer: WebGLBuffer | null;
  normalBuffer: WebGLBuffer | null;
  uvBuffer: WebGLBuffer | null;
  // 着色器程序、属性位置等其他渲染数据
} 