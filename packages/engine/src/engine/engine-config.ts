/**
 * EngineConfig - Engine Configuration Interface
 * 引擎配置接口
 *
 * @packageDocumentation
 */

/**
 * Shadow configuration
 */
export interface ShadowConfig {
  /** Enable shadows */
  enabled: boolean;

  /** Shadow map size (default: 1024) */
  mapSize?: number;

  /** CSM cascade count (default: 4) */
  cascades?: number;
}

/**
 * Post-processing configuration
 */
export interface PostProcessingConfig {
  /** Enable bloom effect */
  bloom?: boolean;

  /** Tone mapping mode */
  toneMapping?: 'linear' | 'reinhard' | 'aces';

  /** Enable SSAO */
  ssao?: boolean;
}

/**
 * Engine configuration options
 */
export interface EngineConfig {
  /** Canvas element or selector */
  canvas: HTMLCanvasElement | string;

  /** Render mode (default: 'forward') */
  renderMode?: 'forward' | 'deferred';

  /** Enable antialiasing (default: false) */
  antialias?: boolean;

  /** Shadow configuration */
  shadows?: ShadowConfig;

  /** Post-processing configuration */
  postProcessing?: PostProcessingConfig;

  /** Enable debug mode (default: false) */
  debug?: boolean;
}
