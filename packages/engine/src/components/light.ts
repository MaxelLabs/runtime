/**
 * Light Component - 光源组件
 *
 * @packageDocumentation
 *
 * @remarks
 * Light 组件定义场景中的光源，支持方向光、点光源和聚光灯三种类型。
 * 与 WorldTransform 组件配合使用，确定光源在世界空间中的位置和方向。
 *
 * ## 设计决策
 * - **类型枚举**: LightType 与着色器中的类型值对应
 * - **统一接口**: 所有光源类型使用同一组件，通过 type 字段区分
 * - **默认值**: 提供合理的默认值，简化常见用例
 *
 * ## 使用示例
 * ```typescript
 * // 方向光
 * const dirLight = Light.fromData({
 *   type: LightType.DIRECTIONAL,
 *   direction: { x: -1, y: -1, z: -1 },
 *   color: [1, 1, 1],
 *   intensity: 1
 * });
 *
 * // 点光源
 * const pointLight = Light.fromData({
 *   type: LightType.POINT,
 *   color: [1, 0.8, 0.6],
 *   intensity: 2,
 *   range: 10
 * });
 *
 * // 聚光灯
 * const spotLight = Light.fromData({
 *   type: LightType.SPOT,
 *   color: [1, 1, 1],
 *   intensity: 5,
 *   range: 20,
 *   innerAngle: Math.PI / 6,
 *   outerAngle: Math.PI / 4
 * });
 * ```
 */

import { Component } from '@maxellabs/core';
import type { Vector3Like } from '@maxellabs/specification';

/**
 * 光源类型枚举
 * @remarks 与着色器中的类型值对应
 */
export enum LightType {
  /** 方向光 - 无位置，只有方向，模拟无限远的光源（如太阳） */
  DIRECTIONAL = 0,
  /** 点光源 - 有位置，向所有方向发光，有距离衰减 */
  POINT = 1,
  /** 聚光灯 - 有位置和方向，锥形发光区域 */
  SPOT = 2,
}

/**
 * Light 组件数据接口
 */
export interface ILightData {
  /** 光源类型 */
  lightType: LightType;
  /** 光源颜色 RGB 归一化 [0-1] */
  color: [number, number, number];
  /** 光源强度 */
  intensity: number;
  /** 是否投射阴影 */
  castShadow: boolean;

  // 方向光特有
  /** 光照方向（仅方向光使用，点光源和聚光灯从 WorldTransform 获取） */
  direction?: Vector3Like;

  // 点光源/聚光灯特有
  /** 光源影响范围（仅点光源/聚光灯） */
  range?: number;
  /** 衰减指数（仅点光源/聚光灯，默认 2 表示物理正确的平方衰减） */
  decay?: number;

  // 聚光灯特有
  /** 内锥角（弧度，仅聚光灯，内锥角内光照强度为 100%） */
  innerAngle?: number;
  /** 外锥角（弧度，仅聚光灯，外锥角外光照强度为 0%） */
  outerAngle?: number;
}

/**
 * 最大光源数量
 * @remarks 与着色器中的 MAX_LIGHTS 常量保持一致
 */
export const MAX_LIGHTS = 8;

/**
 * Light 组件 - 光源组件
 *
 * @remarks
 * 此组件定义场景中的光源属性。
 * 光源的位置由 WorldTransform 组件决定（方向光除外）。
 * 聚光灯的方向由 WorldTransform 的旋转决定。
 */
export class Light extends Component implements ILightData {
  /** 光源类型 */
  lightType: LightType = LightType.DIRECTIONAL;

  /** 光源颜色 RGB 归一化 */
  color: [number, number, number] = [1, 1, 1];

  /** 光源强度 */
  intensity: number = 1;

  /** 是否投射阴影 */
  castShadow: boolean = false;

  /** 光照方向（仅方向光） */
  direction: Vector3Like = { x: 0, y: -1, z: 0 };

  /** 光源影响范围（仅点光源/聚光灯） */
  range: number = 10;

  /** 衰减指数（仅点光源/聚光灯） */
  decay: number = 2;

  /** 内锥角（弧度，仅聚光灯，默认 30 度） */
  innerAngle: number = Math.PI / 6;

  /** 外锥角（弧度，仅聚光灯，默认 45 度） */
  outerAngle: number = Math.PI / 4;

  /**
   * 从数据创建 Light 组件
   * @param data 部分光源数据
   * @returns Light 组件实例
   *
   * @remarks
   * 遵循 Constitution 规范：
   * - 使用 Partial<ILightData> 类型
   * - 所有字段提供默认值
   * - 深拷贝对象类型字段
   */
  static fromData(data: Partial<ILightData>): Light {
    const light = new Light();

    // 基础属性
    if (data.lightType !== undefined) {
      light.lightType = data.lightType;
    }

    if (data.color !== undefined) {
      // 深拷贝颜色数组
      light.color = [data.color[0], data.color[1], data.color[2]];
    }

    if (data.intensity !== undefined) {
      light.intensity = data.intensity;
    }

    if (data.castShadow !== undefined) {
      light.castShadow = data.castShadow;
    }

    // 方向光属性
    if (data.direction !== undefined) {
      // 深拷贝方向向量
      light.direction = {
        x: data.direction.x ?? 0,
        y: data.direction.y ?? -1,
        z: data.direction.z ?? 0,
      };
    }

    // 点光源/聚光灯属性
    if (data.range !== undefined) {
      light.range = data.range;
    }

    if (data.decay !== undefined) {
      light.decay = data.decay;
    }

    // 聚光灯属性
    if (data.innerAngle !== undefined) {
      light.innerAngle = data.innerAngle;
    }

    if (data.outerAngle !== undefined) {
      light.outerAngle = data.outerAngle;
    }

    return light;
  }

  /**
   * 克隆 Light 组件
   * @returns 克隆的 Light 实例
   *
   * @remarks
   * 遵循 Constitution 规范：深拷贝所有对象类型字段
   */
  override clone(): Light {
    return Light.fromData({
      lightType: this.lightType,
      color: [this.color[0], this.color[1], this.color[2]],
      intensity: this.intensity,
      castShadow: this.castShadow,
      direction: { x: this.direction.x, y: this.direction.y, z: this.direction.z },
      range: this.range,
      decay: this.decay,
      innerAngle: this.innerAngle,
      outerAngle: this.outerAngle,
    });
  }

  /**
   * 设置为方向光
   * @param direction 光照方向
   * @param color 光源颜色
   * @param intensity 光源强度
   */
  setDirectional(
    direction: Vector3Like = { x: 0, y: -1, z: 0 },
    color: [number, number, number] = [1, 1, 1],
    intensity: number = 1
  ): this {
    this.lightType = LightType.DIRECTIONAL;
    this.direction = { x: direction.x, y: direction.y, z: direction.z };
    this.color = [color[0], color[1], color[2]];
    this.intensity = intensity;
    this.markDirty();
    return this;
  }

  /**
   * 设置为点光源
   * @param color 光源颜色
   * @param intensity 光源强度
   * @param range 影响范围
   * @param decay 衰减指数
   */
  setPoint(
    color: [number, number, number] = [1, 1, 1],
    intensity: number = 1,
    range: number = 10,
    decay: number = 2
  ): this {
    this.lightType = LightType.POINT;
    this.color = [color[0], color[1], color[2]];
    this.intensity = intensity;
    this.range = range;
    this.decay = decay;
    this.markDirty();
    return this;
  }

  /**
   * 设置为聚光灯
   * @param color 光源颜色
   * @param intensity 光源强度
   * @param range 影响范围
   * @param innerAngle 内锥角（弧度）
   * @param outerAngle 外锥角（弧度）
   * @param decay 衰减指数
   */
  setSpot(
    color: [number, number, number] = [1, 1, 1],
    intensity: number = 1,
    range: number = 10,
    innerAngle: number = Math.PI / 6,
    outerAngle: number = Math.PI / 4,
    decay: number = 2
  ): this {
    this.lightType = LightType.SPOT;
    this.color = [color[0], color[1], color[2]];
    this.intensity = intensity;
    this.range = range;
    this.innerAngle = innerAngle;
    this.outerAngle = outerAngle;
    this.decay = decay;
    this.markDirty();
    return this;
  }
}
