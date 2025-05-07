// 基础类
export * from './base/entity';
export * from './base/component';
export * from './base/transform';

// 场景管理
export * from './scene/scene';

// 相机系统
export * from './camera/camera';

// 几何体系统
export * from './geometry/geometry';

// 材质系统
export * from './material/material';

// 渲染系统
export * from './renderer/mesh';

// 纹理系统
export * from './texture/texture';

// 光照系统
export * from './light/light';

// 工具函数
export * from './utils';

// 接口定义
export * from './interface';

// 基础组件
export * from './base/event';
export * from './base/eventDispatcher';
export * from './base/canvas';
export * from './base/Time';
export * from './base/ObjectPool';
export * from './base/ObjectPoolManager';
export * from './base/eventDispatcher';

// 引擎核心
export * from './engine';

// 场景组件
export * from './scene/Scene';
export * from './scene/SceneManager';

// 资源管理
export * from './resource/ResourceManager';
export * from './resource/EnhancedResourceManager';

// 着色器系统
export * from './shader/ShaderMacro';
export * from './shader/ShaderMacroCollection';
export * from './shader/ShaderProperty';
export * from './shader/ShaderDataGroup';
export * from './shader/ShaderData';
export * from './shader/EnhancedShaderData';
export * from './shader/Shader';

// 渲染器
export * from './renderer/RenderContext';
export * from './renderer/RenderElement';
export * from './renderer/SubRenderElement';
export * from './renderer/RenderQueue';
export * from './renderer/EnhancedRenderQueue';
export * from './renderer/RenderPipeline';
export * from './renderer/ForwardRenderPipeline';
export * from './renderer/RenderPass';
export * from './renderer/RendererType';
export * from './renderer/CullingResults';

// 材质系统
export * from './material/Material';

// 几何系统
export * from './geometry/Mesh';

// 纹理系统
export * from './texture/Texture';
export * from './texture/Texture2D';

// 相机系统
export * from './camera/Camera';

// 光照系统
export * from './light/Light';

// 接口定义
export * from './interface/IHardwareRenderer';

// 序列化系统
export * from './serialization/Serialization';

// 对象池示例
export * from './examples/ObjectPoolExample';

// 输入系统
export * from './input/InputManager';
export * from './input/InputCode';
export * from './input/InputState';

// 导出数学库类型
export type { Vector2, Vector3, Vector4, Matrix3, Matrix4, Quaternion, Color } from '@maxellabs/math';
