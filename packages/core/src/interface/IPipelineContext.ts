import type * as spec from '@sruim/specification';

export interface IPipelineContext {
  isReady: boolean,
  /** Releases the resources associated with the pipeline. */
  dispose(): void,
  setFloat(uniformName: string, value: number): void,
  setInt(uniformName: string, value: number): void,
  setVec2(uniformName: string, value: spec.Vector2): void,
  setVec3(uniformName: string, value: spec.Vector3): void,
  setVec4(uniformName: string, value: spec.Color): void,
}