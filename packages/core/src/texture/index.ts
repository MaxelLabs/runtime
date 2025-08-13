/**
 * texture/index.ts
 * 纹理系统模块导出
 */

// 纹理基类
export { Texture, TextureEventType, type TextureEventData, type TextureOptions } from './texture';

// 2D纹理
export { Texture2D, Texture2DEventType, type Texture2DOptions } from './texture2d';

// 立方体纹理
export { TextureCube, TextureCubeEventType, CubeFace, type TextureCubeOptions } from './texture-cube';

// 纹理管理器
export { TextureManager, TextureManagerEventType, type TextureManagerConfig } from './texture-manager';
