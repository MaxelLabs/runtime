/**
 * shader.ts
 * 定义着色器资源接口
 */

import type { RHIShaderStage } from '../types/enums';

/**
 * 着色器模块接口
 */
export interface IRHIShaderModule {
  /**
   * 着色器代码
   */
  readonly code: string;

  /**
   * 着色器语言
   */
  readonly language: 'glsl' | 'wgsl' | 'spirv';

  /**
   * 着色器阶段
   */
  readonly stage: RHIShaderStage;

  /**
   * 着色器标签
   */
  readonly label?: string;

  /**
   * 反射信息 - 包含着色器中定义的绑定等信息
   */
  readonly reflection: {
    /**
     * 绑定信息
     */
    bindings: Array<{
      /**
       * 绑定名称
       */
      name: string;

      /**
       * 绑定索引
       */
      binding: number;

      /**
       * 绑定组
       */
      group: number;

      /**
       * 绑定类型
       */
      type: 'uniform-buffer' | 'storage-buffer' | 'sampler' | 'texture' | 'storage-texture';

      /**
       * 数组大小 (如适用)
       */
      arraySize?: number;
    }>;

    /**
     * 入口点信息
     */
    entryPoints: Array<{
      /**
       * 入口点名称
       */
      name: string;

      /**
       * 入口点阶段
       */
      stage: 'vertex' | 'fragment' | 'compute';

      /**
       * 计算着色器工作组大小(如适用)
       */
      workgroupSize?: [number, number, number];
    }>;
  };

  /**
   * 销毁资源
   */
  destroy(): void;
}
