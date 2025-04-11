import type { IPipelineContext } from '@sruim/core';

import type * as spec from '@sruim/specification';

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
  setVec2 (uniformName: string, value: spec.Vector2): void {
    throw new Error('Method not implemented.');
  }
  setVec3 (uniformName: string, value: spec.Vector3): void {
    throw new Error('Method not implemented.');
  }
  setVec4 (uniformName: string, value: spec.Color): void {
    throw new Error('Method not implemented.');
  }
}