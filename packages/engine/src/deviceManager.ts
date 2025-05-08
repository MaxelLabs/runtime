import type { IRHICapabilities, RHIDeviceOptions } from '@maxellabs/core';
import type { RenderAPIType } from '@maxellabs/core';
import type { GLRenderer } from '@maxellabs/rhi';
import { GLDevice } from '@maxellabs/rhi';

export class DeviceManager {
  private static instance: DeviceManager;
  private device: GLDevice | null = null;

  private constructor () {}

  static getInstance (): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }

    return DeviceManager.instance;
  }

  createDevice (canvas: HTMLCanvasElement, options: RHIDeviceOptions): GLDevice {
    if (this.device) {
      return this.device;
    }
    this.device = new GLDevice(canvas, options);

    return this.device;
  }

  getDevice (): GLDevice | null {
    return this.device;
  }

  resetDevice (): void {
    this.device = null;
  }
  getCapabilities (): IRHICapabilities | null {
    if (!this.device) {
      return null;
    }

    return this.device.getCapabilities();
  }
  getRenderAPIType (): RenderAPIType {
    if (!this.device) {
      throw new Error('Device not created yet');
    }

    return this.device.getRenderAPIType();
  }
  getRenderer (): GLRenderer | null {
    if (!this.device) {
      return null;
    }

    return this.device.getRenderer();
  }
  getGLContext (): WebGLRenderingContext | WebGL2RenderingContext | null {
    if (!this.device) {
      return null;
    }

    return this.device.getGLContext();
  }
  getGLCapabilities (): IRHICapabilities | null {
    if (!this.device) {
      return null;
    }

    return this.device.getGLCapabilities();
  }
}