import type { IRHICapabilities } from '@maxellabs/core';
import type { RHIDeviceOptions } from '@maxellabs/core';
import type { RenderAPIType } from '@maxellabs/core';
import { WebGLDevice } from '@maxellabs/rhi';

/**
 * 设备管理器
 * 负责创建和管理渲染设备
 */
export class DeviceManager {
  /** 单例实例 */
  private static instance: DeviceManager;
  /** 当前设备 */
  private device: WebGLDevice | null = null;

  /**
   * 私有构造函数，防止外部直接创建实例
   */
  private constructor() {}

  /**
   * 获取设备管理器实例
   */
  static getInstance(): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }

    return DeviceManager.instance;
  }

  /**
   * 创建WebGL设备
   * @param canvas 目标画布
   * @param options 设备选项
   */
  createDevice(canvas: HTMLCanvasElement, options: RHIDeviceOptions): WebGLDevice {
    if (this.device) {
      return this.device;
    }
    
    this.device = new WebGLDevice(canvas, options);

    return this.device;
  }

  /**
   * 获取当前设备
   */
  getDevice(): WebGLDevice | null {
    return this.device;
  }

  /**
   * 重置设备
   */
  resetDevice(): void {
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
  }

  /**
   * 获取设备能力
   */
  getCapabilities(): IRHICapabilities | null {
    if (!this.device) {
      return null;
    }

    return {
      maxTextureSize: this.device.info.maxTextureSize,
      supportsMSAA: this.device.info.supportsMSAA,
      maxSampleCount: this.device.info.maxSampleCount,
      supportsAnisotropy: this.device.info.supportsAnisotropy,
      backend: this.device.info.backend,
      features: this.device.info.features,
      vendor: this.device.info.vendorName,
      renderer: this.device.info.deviceName,
    };
  }

  /**
   * 获取渲染API类型
   */
  getRenderAPIType(): RenderAPIType {
    if (!this.device) {
      throw new Error('设备尚未创建');
    }

    switch (this.device.info.backend) {
      case 1: // WebGL
        return 'webgl';
      case 2: // WebGL2
        return 'webgl2';
      case 3: // WebGPU
        return 'webgpu';
      default:
        return 'unknown';
    }
  }

  /**
   * 获取WebGL上下文
   */
  getGLContext(): WebGLRenderingContext | WebGL2RenderingContext | null {
    if (!this.device) {
      return null;
    }

    return this.device.getGL();
  }
}