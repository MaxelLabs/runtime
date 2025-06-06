/**
 * render-test.ts
 * 渲染系统测试 - 验证渲染管线完整性
 */

import { Scene } from '../scene/scene';
import { GameObject } from '../scene/game-object';
import { PerspectiveCamera } from '../camera/perspective-camera';
import { ForwardRenderer } from './forward-renderer';
import { Material } from '../material/material';
import { Geometry } from '../geometry/geometry';
import { MeshRenderer } from '../components/mesh-renderer';
import { Transform } from '../base/transform';
import { VertexAttribute, Vector3 } from '@maxellabs/math';
import { RHIIndexFormat } from '../../../specification/src/common/rhi/types/enums';
import type { IRHIDevice } from '../../../specification/src/common/rhi';

/**
 * 简单的立方体几何体类
 */
class CubeGeometry extends Geometry {
  constructor(name = 'CubeGeometry') {
    super(name);
    this.createCubeData();
  }

  private createCubeData(): void {
    // 立方体顶点数据
    const vertices = new Float32Array([
      // 前面
      -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
      // 后面
      -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1,
      // 顶面
      -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
      // 底面
      -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
      // 右面
      1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
      // 左面
      -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1,
    ]);

    // 立方体索引数据
    const indices = new Uint16Array([
      0,
      1,
      2,
      0,
      2,
      3, // 前面
      4,
      5,
      6,
      4,
      6,
      7, // 后面
      8,
      9,
      10,
      8,
      10,
      11, // 顶面
      12,
      13,
      14,
      12,
      14,
      15, // 底面
      16,
      17,
      18,
      16,
      18,
      19, // 右面
      20,
      21,
      22,
      20,
      22,
      23, // 左面
    ]);

    // 立方体法线数据
    const normals = new Float32Array([
      // 前面
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      // 后面
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      // 顶面
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      // 底面
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      // 右面
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      // 左面
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    ]);

    // 立方体UV数据
    const uvs = new Float32Array([
      // 前面
      0, 0, 1, 0, 1, 1, 0, 1,
      // 后面
      1, 0, 1, 1, 0, 1, 0, 0,
      // 顶面
      0, 1, 0, 0, 1, 0, 1, 1,
      // 底面
      1, 1, 0, 1, 0, 0, 1, 0,
      // 右面
      1, 0, 1, 1, 0, 1, 0, 0,
      // 左面
      0, 0, 1, 0, 1, 1, 0, 1,
    ]);

    // 设置顶点属性
    this.setVertexAttribute(VertexAttribute.Position, vertices, {
      type: VertexAttribute.Position,
      data: vertices,
      componentCount: 3,
      normalized: false,
      stride: 12, // 3 * 4 bytes
      offset: 0,
    });

    this.setVertexAttribute(VertexAttribute.Normal, normals, {
      type: VertexAttribute.Normal,
      data: normals,
      componentCount: 3,
      normalized: false,
      stride: 12, // 3 * 4 bytes
      offset: 0,
    });

    this.setVertexAttribute(VertexAttribute.TexCoord0, uvs, {
      type: VertexAttribute.TexCoord0,
      data: uvs,
      componentCount: 2,
      normalized: false,
      stride: 8, // 2 * 4 bytes
      offset: 0,
    });

    // 设置索引
    this.setIndices(indices, RHIIndexFormat.UINT16);

    // 设置顶点数量
    this.setVertexCount(24);
  }

  protected override async loadImpl(): Promise<void> {
    // 立方体几何体不需要从外部加载
  }
}

/**
 * 渲染测试类
 * 验证从场景构建到最终渲染的完整流程
 */
export class RenderTest {
  private device: IRHIDevice;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: ForwardRenderer;

  constructor(device: IRHIDevice) {
    this.device = device;
    this.scene = new Scene('TestScene');

    // 创建相机实体
    const cameraEntity = new GameObject('Camera');
    this.camera = new PerspectiveCamera(cameraEntity.getEntity(), 75, 1.0, 0.1, 1000);
    this.renderer = new ForwardRenderer(device);
  }

  /**
   * 初始化测试场景
   */
  initializeTestScene(): void {
    // 创建测试游戏对象
    const gameObject = new GameObject('TestCube');
    const transform = gameObject.getComponent(Transform);
    if (transform) {
      transform.setPosition(new Vector3(0, 0, -5));
    }

    // 创建材质
    const material = new Material('TestMaterial');
    material.setColor('diffuse', [1.0, 0.5, 0.5, 1.0]);
    material.setDevice(this.device);

    // 创建立方体几何体
    const geometry = new CubeGeometry('TestCube');
    geometry.setDevice(this.device);

    // 添加MeshRenderer组件到游戏对象
    const meshRenderer = gameObject.addComponent(MeshRenderer);
    meshRenderer.setMaterial(material);
    meshRenderer.setGeometry(geometry);

    // 添加到场景
    this.scene.addGameObject(gameObject);

    // 设置相机位置
    this.camera.setPosition(new Vector3(0, 0, 0));
    this.camera.lookAt(new Vector3(0, 0, -1), new Vector3(0, 1, 0));
  }

  /**
   * 执行渲染测试
   */
  executeRenderTest(): boolean {
    try {
      // 设置渲染目标（需要实际的纹理视图）
      // const colorTarget = this.device.createTexture(...);
      // const depthTarget = this.device.createTexture(...);
      // this.renderer.setRenderTargets(colorTarget.createView(), depthTarget.createView());

      // 执行渲染
      this.renderer.render(this.scene, this.camera);

      // 渲染测试成功完成
      // 可以在这里添加成功回调或事件分发

      return true;
    } catch (error) {
      console.error('渲染测试失败:', error);
      return false;
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.renderer.destroy();
    this.scene.destroy();
  }
}
