import type { IPipelineContext } from '@max/core';
import type { Vector2, Vector3, Color } from '@max/math';

export class GLPipelineContext implements IPipelineContext {
  isReady: boolean;

  constructor () {
    this.isReady = false;
  }

  dispose (): void {
    throw new Error('Method not implemented.');
  }
  setFloat (uniformName: string, value: number): void {
    throw new Error('Method not implemented.');
  }
  setInt (uniformName: string, value: number): void {
    throw new Error('Method not implemented.');
  }
  setVec2 (uniformName: string, value: Vector2): void {
    throw new Error('Method not implemented.');
  }
  setVec3 (uniformName: string, value: Vector3): void {
    throw new Error('Method not implemented.');
  }
  setVec4 (uniformName: string, value: Color): void {
    throw new Error('Method not implemented.');
  }
}