/**
 * 全局常量定义
 */

// 渲染相关常量
export const MAX_DIRECTIONAL_LIGHTS = 4;
export const MAX_POINT_LIGHTS = 8;
export const MAX_SPOT_LIGHTS = 4;
export const MAX_SHADOWMAPS = 4;

// 渲染队列排序顺序
export enum RenderQueue {
  BACKGROUND = 1000,  // 背景渲染
  GEOMETRY = 2000,    // 不透明几何体
  ALPHA_TEST = 2500,  // Alpha测试
  TRANSPARENT = 3000, // 透明物体
  OVERLAY = 4000,     // UI和覆盖物
}

// 着色器宏定义
export enum ShaderMacro {
  USE_NORMAL_MAP = 'USE_NORMAL_MAP',
  USE_PBR = 'USE_PBR',
  USE_SHADOWMAP = 'USE_SHADOWMAP',
  USE_SKINNING = 'USE_SKINNING',
  USE_INSTANCING = 'USE_INSTANCING',
}

// 资源类型
export enum ResourceType {
  TEXTURE = 'texture',
  SHADER = 'shader',
  MATERIAL = 'material',
  MESH = 'mesh',
  AUDIO = 'audio',
  PREFAB = 'prefab',
}

// 物理碰撞组
export enum CollisionGroup {
  DEFAULT = 0x00000001,
  STATIC = 0x00000002,
  DYNAMIC = 0x00000004,
  TRIGGER = 0x00000008,
  CHARACTER = 0x00000010,
  PROJECTILE = 0x00000020,
  SENSOR = 0x00000040,
  PARTICLE = 0x00000080,
  ALL = 0xFFFFFFFF,
}

// 事件类型
export enum EventType {
  // 通用事件
  READY = 'ready',
  COMPLETE = 'complete',
  ERROR = 'error',
  
  // 输入事件
  POINTER_DOWN = 'pointerdown',
  POINTER_MOVE = 'pointermove',
  POINTER_UP = 'pointerup',
  KEY_DOWN = 'keydown',
  KEY_UP = 'keyup',
  
  // 资源事件
  RESOURCE_LOADED = 'resourceLoaded',
  RESOURCE_ERROR = 'resourceError',
  RESOURCE_PROGRESS = 'resourceProgress',
  
  // 场景事件
  SCENE_LOAD = 'sceneLoad',
  SCENE_UNLOAD = 'sceneUnload',
  
  // 实体事件
  ENTITY_ADDED = 'entityAdded',
  ENTITY_REMOVED = 'entityRemoved',
  ENTITY_COMPONENT_ADDED = 'entityComponentAdded',
  ENTITY_COMPONENT_REMOVED = 'entityComponentRemoved',
  
  // 物理事件
  COLLISION_ENTER = 'collisionEnter',
  COLLISION_STAY = 'collisionStay',
  COLLISION_EXIT = 'collisionExit',
  TRIGGER_ENTER = 'triggerEnter',
  TRIGGER_STAY = 'triggerStay',
  TRIGGER_EXIT = 'triggerExit',
}

// 纹理过滤模式
export enum TextureFilter {
  NEAREST = 'nearest',
  LINEAR = 'linear',
  NEAREST_MIPMAP_NEAREST = 'nearest_mipmap_nearest',
  LINEAR_MIPMAP_NEAREST = 'linear_mipmap_nearest',
  NEAREST_MIPMAP_LINEAR = 'nearest_mipmap_linear',
  LINEAR_MIPMAP_LINEAR = 'linear_mipmap_linear',
}

// 纹理包装模式
export enum TextureWrap {
  REPEAT = 'repeat',
  CLAMP_TO_EDGE = 'clamp_to_edge',
  MIRRORED_REPEAT = 'mirrored_repeat',
}

// 引擎性能级别
export enum PerformanceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
}

// 日志级别
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// 对象池默认配置
export const OBJECT_POOL_CONFIG = {
  DEFAULT_CAPACITY: 10,
  MAX_SIZE: 100,
  PREWARM: true,
};

// 物理常数
export const PHYSICS_CONSTANTS = {
  GRAVITY: -9.81,
  DEFAULT_FRICTION: 0.5,
  DEFAULT_RESTITUTION: 0.1,
  STEP_SIZE: 1/60,
};

// 文件类型映射
export const FILE_EXTENSIONS = {
  TEXTURE: ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tga'],
  MODEL: ['.gltf', '.glb', '.obj', '.fbx'],
  AUDIO: ['.mp3', '.ogg', '.wav', '.m4a'],
  SHADER: ['.glsl', '.vert', '.frag', '.wgsl'],
  SCENE: ['.scene', '.json'],
};