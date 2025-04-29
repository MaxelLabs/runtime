import { Component } from './component';
import { ResourceManager } from '../resource/ResourceManager';

// 全局资源管理器，所有资源共享
let _globalResourceManager: ResourceManager | null = null;

/**
 * 获取全局资源管理器
 */
export function getResourceManager(): ResourceManager {
  if (!_globalResourceManager) {
    _globalResourceManager = new ResourceManager();
  }
  return _globalResourceManager;
}

/**
 * 资源引用接口
 */
export interface IReferable {
  /**
   * 引用计数
   */
  refCount: number;
  
  /**
   * 增加引用计数
   */
  addRef(): void;
  
  /**
   * 减少引用计数
   */
  release(): void;
}

/**
 * 资源基类，提供引用计数功能
 * 所有需要引用计数管理的资源都应继承此类
 */
export class ReferResource implements IReferable {
  /** 是否忽略垃圾回收 */
  isGCIgnored: boolean = false;
  
  /** 引用计数 */
  private _refCount: number = 0;
  
  /** 父资源列表 */
  private _superResources: ReferResource[] = [];
  
  /** 是否已销毁 */
  private _destroyed: boolean = false;
  
  /** 资源管理器 */
  private _resourceManager: ResourceManager;
  
  /**
   * 获取引用计数
   */
  get refCount(): number {
    return this._refCount;
  }
  
  /**
   * 构造函数
   * @param resourceManager 自定义资源管理器，如果不传入则使用全局资源管理器
   */
  constructor(resourceManager?: ResourceManager) {
    this._resourceManager = resourceManager || getResourceManager();
    this._resourceManager._addReferResource(this);
  }
  
  /**
   * 增加引用计数
   */
  addRef(): void {
    this._refCount++;
  }
  
  /**
   * 减少引用计数
   */
  release(): void {
    if (this._refCount > 0) {
      this._refCount--;
    }
    
    // 当引用计数为0时尝试销毁
    if (this._refCount === 0 && !this.isGCIgnored) {
      this.dispose();
    }
  }
  
  /**
   * 销毁资源
   * @param force 是否强制销毁，忽略引用计数
   * @returns 是否成功销毁
   */
  destroy(force: boolean = false): boolean {
    if (this._destroyed) {
      return true;
    }
    
    if (!force && this._refCount > 0) {
      console.warn(`尝试销毁引用计数为 ${this._refCount} 的资源`);
      return false;
    }
    
    // 如果存在父资源且非强制销毁，需要检查父资源
    if (!force && this._superResources.length > 0) {
      for (const superResource of this._superResources) {
        if (superResource.refCount > 0) {
          return false;
        }
      }
    }
    
    this.dispose();
    return true;
  }
  
  /**
   * 释放资源
   * 子类应该重写此方法以实现特定资源的释放逻辑
   */
  protected dispose(): void {
    if (this._destroyed) {
      return;
    }
    
    this._destroyed = true;
    
    // 释放所有相关资源
    this.onDispose();
    
    // 重置状态
    this._refCount = 0;
    this._superResources = [];
    
    // 从资源管理器中移除
    this._resourceManager._deleteReferResource(this);
  }
  
  /**
   * 资源释放时的回调
   * 子类应该重写此方法以实现特定资源的释放逻辑
   */
  protected onDispose(): void {
    // 子类实现具体释放逻辑
  }
  
  /**
   * 关联父资源
   * @param superResource 父资源
   */
  associateSuperResource(superResource: ReferResource): void {
    if (!this._superResources.includes(superResource)) {
      this._superResources.push(superResource);
    }
  }
  
  /**
   * 解除父资源关联
   * @param superResource 父资源
   */
  disassociateSuperResource(superResource: ReferResource): void {
    const index = this._superResources.indexOf(superResource);
    if (index !== -1) {
      this._superResources.splice(index, 1);
    }
  }
  
  /**
   * 将资源添加到资源管理器的特定路径
   * @param path 资源路径
   */
  addToResourceManager(path: string): void {
    this._resourceManager._addAsset(path, this);
  }
} 