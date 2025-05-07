import type { IRHICapabilities, IRHIDevice, RHIDeviceOptions } from '@maxellabs/core';
import type { RenderAPIType } from '@maxellabs/core';
import type { GLRenderer } from '@maxellabs/rhi';
import { GLDevice } from '@maxellabs/rhi';

export class DeviceManager {
  private static instance: DeviceManager;
  private device: IRHIDevice | null = null;

  private constructor () {}

  public static getInstance (): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }

    return DeviceManager.instance;
  }

  public createDevice (canvas: HTMLCanvasElement, options: RHIDeviceOptions): IRHIDevice {
    if (this.device) {
      return this.device;
    }
    this.device = new GLDevice(canvas, options);

    return this.device;
  }

  public getDevice (): IRHIDevice | null {
    return this.device;
  }

  public resetDevice (): void {
    this.device = null;
  }
  public getCapabilities (): IRHICapabilities | null {
    if (!this.device) {
      return null;
    }

    return this.device.getCapabilities();
  }
  public getRenderAPIType (): RenderAPIType {
    if (!this.device) {
      throw new Error('Device not created yet');
    }

    return this.device.getRenderAPIType();
  }
  public getRenderer (): GLRenderer | null {
    if (!this.device) {
      return null;
    }

    return this.device.getRenderer();
  }
  public getGLContext (): WebGLRenderingContext | WebGL2RenderingContext | null {
    if (!this.device) {
      return null;
    }

    return this.device.getGLContext();
  }
  public getGLCapabilities (): IRHICapabilities | null {
    if (!this.device) {
      return null;
    }

    return this.device.getGLCapabilities();
  }
}