# 动画系统示例

## 概述

这个示例展示了如何使用 Specification 库定义动画数据，Math 库进行数学计算，以及 RHI 库渲染动画结果。实现了完整的关键帧动画系统，包括多层动画混合、缓动函数和性能优化。

## 完整代码示例

### 1. 动画数据结构定义

```typescript
/**
 * animation-data-structures.ts
 * 使用Specification定义动画数据结构
 */

import { MSpec, MMath } from '@maxellabs/core';

// ==================== 动画数据结构 ====================

/**
 * 动画关键帧
 */
export interface AnimationKeyframe {
    time: number;           // 时间点 (秒)
    value: number | MMath.Vector3 | MMath.Quaternion;  // 关键帧值
    inTangent?: number;     // 入切线 (缓动)
    outTangent?: number;    // 出切线 (缓手)
}

/**
 * 动画通道
 */
export interface AnimationChannel {
    name: string;                           // 通道名称 (如 "position", "rotation", "scale")
    keyframes: AnimationKeyframe[];         // 关键帧列表
    interpolation: 'linear' | 'cubic' | 'step';  // 插值类型
}

/**
 * 动画剪辑
 */
export interface AnimationClip {
    name: string;               // 剪辑名称
    duration: number;           // 持续时间 (秒)
    channels: AnimationChannel[]; // 动画通道
    loop: boolean;              // 是否循环
    speed: number;              // 播放速度
}

/**
 * 动画层
 */
export interface AnimationLayer {
    name: string;               // 层名称
    weight: number;             // 层权重 (0-1)
    clips: AnimationClip[];     // 剪辑列表
    blendMode: 'override' | 'additive';  // 混合模式
    enabled: boolean;           // 是否启用
}

/**
 * 动画状态
 */
export interface AnimationState {
    name: string;               // 状态名称
    clip: AnimationClip;        // 对应的动画剪辑
    speed: number;              // 播放速度
    loop: boolean;              // 是否循环
    transitions: AnimationTransition[]; // 状态转换
}

/**
 * 状态转换
 */
export interface AnimationTransition {
    to: string;                 // 目标状态
    duration: number;           // 转换时间
    exitTime?: number;          // 退出时间
    hasExitTime: boolean;       // 是否有退出时间
    conditions?: AnimationCondition[];  // 转换条件
}

/**
 * 转换条件
 */
export interface AnimationCondition {
    parameter: string;          // 参数名称
    value: any;                 // 参数值
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=';  // 比较操作符
}

/**
 * 动画控制器
 */
export interface AnimationControllerSpec {
    layers: AnimationLayer[];    // 动画层
    parameters: Record<string, any>;  // 参数
    states: AnimationState[];   // 状态机状态
    defaultState: string;       // 默认状态
}
```

### 2. 缓动函数库

```typescript
/**
 * easing-functions.ts
 * 缓动函数集合 - 使用Math库实现
 */

import { MMath } from '@maxellabs/core';

/**
 * 缓动函数类型
 */
export type EasingFunction = (t: number) => number;

/**
 * 缓动函数集合
 */
export class EasingFunctions {
    // ==================== 线性缓动 ====================

    /**
     * 线性缓动
     */
    static linear(t: number): number {
        return t;
    }

    // ==================== 二次缓动 ====================

    /**
     * 二次缓入 (ease-in)
     */
    static quadIn(t: number): number {
        return t * t;
    }

    /**
     * 二次缓出 (ease-out)
     */
    static quadOut(t: number): number {
        return 1 - (1 - t) * (1 - t);
    }

    /**
     * 二次缓入缓出 (ease-in-out)
     */
    static quadInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // ==================== 三次缓动 ====================

    /**
     * 三次缓入 (ease-in)
     */
    static cubicIn(t: number): number {
        return t * t * t;
    }

    /**
     * 三次缓出 (ease-out)
     */
    static cubicOut(t: number): number {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * 三次缓入缓出 (ease-in-out)
     */
    static cubicInOut(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // ==================== 弹性缓动 ====================

    /**
     * 弹性缓入
     */
    static elasticIn(t: number): number {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3);
    }

    /**
     * 弹性缓出
     */
    static elasticOut(t: number): number {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    }

    /**
     * 弹性缓入缓出
     */
    static elasticInOut(t: number): number {
        if (t === 0) return 0;
        if (t === 1) return 1;

        const c5 = (2 * Math.PI) / 4.5;
        return t < 0.5
            ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
            : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
    }

    // ==================== 反弹缓动 ====================

    /**
     * 反弹缓入
     */
    static bounceIn(t: number): number {
        return 1 - this.bounceOut(1 - t);
    }

    /**
     * 反弹缓出
     */
    static bounceOut(t: number): number {
        const n1 = 7.5625;
        const d1 = 2.75;

        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }

    /**
     * 反弹缓入缓出
     */
    static bounceInOut(t: number): number {
        return t < 0.5
            ? (1 - this.bounceOut(1 - 2 * t)) / 2
            : (1 + this.bounceOut(2 * t - 1)) / 2;
    }

    // ==================== 震动缓动 ====================

    /**
     * 震动效果
     * @param t 时间 (0-1)
     * @param decay 衰减因子
     * @param frequency 频率
     */
    static shake(t: number, decay: number = 0.5, frequency: number = 10): number {
        const envelope = Math.exp(-decay * t * 10);
        return Math.sin(frequency * Math.PI * t) * envelope * (1 - t);
    }

    /**
     * 脉冲效果
     * @param t 时间 (0-1)
     * @param count 脉冲次数
     */
    static pulse(t: number, count: number = 3): number {
        return 0.5 + 0.5 * Math.sin(2 * Math.PI * count * t);
    }

    // ==================== 自定义缓动 ====================

    /**
     * 创建缓动函数组合
     */
    static combine(easing1: EasingFunction, easing2: EasingFunction, blend: number = 0.5): EasingFunction {
        return (t: number) => {
            return easing1(t) * (1 - blend) + easing2(t) * blend;
        };
    }

    /**
     * 创建缓动函数映射
     */
    static map(easing: EasingFunction, min: number, max: number): EasingFunction {
        return (t: number) => {
            const mapped = easing(t);
            return min + mapped * (max - min);
        };
    }
}
```

### 3. 插值器

```typescript
/**
 * interpolators.ts
 * 插值器实现 - 使用Math库进行数值插值
 */

import { MMath } from '@maxellabs/core';
import { AnimationKeyframe } from './animation-data-structures';
import { EasingFunctions, EasingFunction } from './easing-functions';

/**
 * 插值结果
 */
export interface InterpolationResult {
    value: number | MMath.Vector3 | MMath.Quaternion;
    normalized: boolean;  // 是否已归一化
}

/**
 * 抽象插值器基类
 */
export abstract class Interpolator {
    protected easing: EasingFunction;

    constructor(easing: EasingFunction = EasingFunctions.linear) {
        this.easing = easing;
    }

    abstract interpolate(keyframes: AnimationKeyframe[], time: number): InterpolationResult;
}

/**
 * 标量插值器
 */
export class ScalarInterpolator extends Interpolator {
    interpolate(keyframes: AnimationKeyframe[], time: number): InterpolationResult {
        if (keyframes.length === 0) {
            return { value: 0, normalized: false };
        }

        if (keyframes.length === 1) {
            return {
                value: keyframes[0].value as number,
                normalized: false
            };
        }

        // 找到合适的两个关键帧
        let startIndex = 0;
        for (let i = 0; i < keyframes.length - 1; i++) {
            if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
                startIndex = i;
                break;
            }
            if (time < keyframes[i].time) {
                startIndex = i;
                break;
            }
        }

        const startFrame = keyframes[startIndex];
        const endFrame = keyframes[Math.min(startIndex + 1, keyframes.length - 1)];

        if (time <= startFrame.time) {
            return { value: startFrame.value as number, normalized: false };
        }

        const duration = endFrame.time - startFrame.time;
        if (duration <= 0) {
            return { value: startFrame.value as number, normalized: false };
        }

        const localTime = time - startFrame.time;
        const normalizedTime = localTime / duration;

        // 应用缓动函数
        const easedTime = this.easing(normalizedTime);

        const startValue = startFrame.value as number;
        const endValue = endFrame.value as number;

        const interpolatedValue = startValue + (endValue - startValue) * easedTime;

        return {
            value: interpolatedValue,
            normalized: false
        };
    }
}

/**
 * Vector3 插值器
 */
export class Vector3Interpolator extends Interpolator {
    interpolate(keyframes: AnimationKeyframe[], time: number): InterpolationResult {
        if (keyframes.length === 0) {
            return { value: MMath.Vector3.zero(), normalized: false };
        }

        if (keyframes.length === 1) {
            return {
                value: keyframes[0].value as MMath.Vector3,
                normalized: false
            };
        }

        // 使用对象池创建临时向量
        const result = MMath.Vector3.fromPool();

        // 找到合适的两个关键帧
        let startIndex = 0;
        for (let i = 0; i < keyframes.length - 1; i++) {
            if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
                startIndex = i;
                break;
            }
        }

        const startFrame = keyframes[startIndex];
        const endFrame = keyframes[Math.min(startIndex + 1, keyframes.length - 1)];

        if (time <= startFrame.time) {
            result.copyFrom(startFrame.value as MMath.Vector3);
            return { value: result, normalized: false };
        }

        const duration = endFrame.time - startFrame.time;
        if (duration <= 0) {
            result.copyFrom(startFrame.value as MMath.Vector3);
            return { value: result, normalized: false };
        }

        const localTime = time - startFrame.time;
        const normalizedTime = localTime / duration;

        // 应用缓动函数
        const easedTime = this.easing(normalizedTime);

        const startValue = startFrame.value as MMath.Vector3;
        const endValue = endFrame.value as MMath.Vector3;

        // 线性插值
        result.copyFrom(startValue);
        result.lerp(endValue, easedTime);

        return {
            value: result,
            normalized: false
        };
    }
}

/**
 * 四元数插值器 (SLERP)
 */
export class QuaternionInterpolator extends Interpolator {
    interpolate(keyframes: AnimationKeyframe[], time: number): InterpolationResult {
        if (keyframes.length === 0) {
            return { value: MMath.Quaternion.identity(), normalized: true };
        }

        if (keyframes.length === 1) {
            const q = keyframes[0].value as MMath.Quaternion;
            return { value: q.clone(), normalized: true };
        }

        // 使用对象池创建临时四元数
        const result = MMath.Quaternion.fromPool();

        // 找到合适的两个关键帧
        let startIndex = 0;
        for (let i = 0; i < keyframes.length - 1; i++) {
            if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
                startIndex = i;
                break;
            }
        }

        const startFrame = keyframes[startIndex];
        const endFrame = keyframes[Math.min(startIndex + 1, keyframes.length - 1)];

        if (time <= startFrame.time) {
            result.copyFrom(startFrame.value as MMath.Quaternion);
            return { value: result, normalized: true };
        }

        const duration = endFrame.time - startFrame.time;
        if (duration <= 0) {
            result.copyFrom(startFrame.value as MMath.Quaternion);
            return { value: result, normalized: true };
        }

        const localTime = time - startFrame.time;
        let normalizedTime = localTime / duration;

        // 应用缓动函数 (注意：四元数插值通常不使用缓动)
        // 这里使用缓动主要是为了展示可能性
        normalizedTime = this.easing(normalizedTime);

        const startValue = startFrame.value as MMath.Quaternion;
        const endValue = endFrame.value as MMath.Quaternion;

        // 球面线性插值 (SLERP)
        result.copyFrom(startValue);
        result.slerp(endValue, normalizedTime);

        // 确保四元数是归一化的
        result.normalize();

        return {
            value: result,
            normalized: true
        };
    }
}
```

### 4. 动画混合器

```typescript
/**
 * animation-mixer.ts
 * 动画混合器 - 处理多层动画混合
 */

import { MMath } from '@maxellabs/core';
import { AnimationLayer, AnimationClip, AnimationChannel } from './animation-data-structures';
import { ScalarInterpolator, Vector3Interpolator, QuaternionInterpolator, InterpolationResult } from './interpolators';

/**
 * 变换数据
 */
export class Transform {
    public position: MMath.Vector3;
    public rotation: MMath.Quaternion;
    public scale: MMath.Vector3;

    constructor() {
        this.position = MMath.Vector3.fromPool();
        this.rotation = MMath.Quaternion.identity();
        this.scale = MMath.Vector3.fromPool().set(1, 1, 1);
    }

    public copyFrom(other: Transform): void {
        this.position.copyFrom(other.position);
        this.rotation.copyFrom(other.rotation);
        this.scale.copyFrom(other.scale);
    }

    public lerp(target: Transform, t: number): void {
        this.position.lerp(target.position, t);
        this.rotation.slerp(target.rotation, t);
        this.scale.lerp(target.scale, t);
    }

    public multiply(other: Transform): void {
        // 简化的变换组合
        this.position.multiply(this.scale);
        // 四元数旋转会在后续的矩阵变换中处理
    }

    public getMatrix(): MMath.Matrix4 {
        const matrix = MMath.Matrix4.fromPool();
        matrix.compose(this.position, this.rotation, this.scale);
        return matrix;
    }

    public dispose(): void {
        MMath.Vector3.toPool(this.position);
        MMath.Vector3.toPool(this.scale);
    }
}

/**
 * 动画评估结果
 */
export interface AnimationEvaluationResult {
    transform: Transform;
    weight: number;
    layerName: string;
}

/**
 * 动画混合器
 */
export class AnimationMixer {
    private layers: AnimationLayer[] = [];
    private interpolators: Map<string, any> = new Map();
    private currentTime: number = 0;
    private defaultTransform: Transform;

    constructor() {
        this.defaultTransform = new Transform();
        this.setupInterpolators();
    }

    private setupInterpolators(): void {
        this.interpolators.set('position', new Vector3Interpolator());
        this.interpolators.set('rotation', new QuaternionInterpolator());
        this.interpolators.set('scale', new Vector3Interpolator());
        this.interpolators.set('scalar', new ScalarInterpolator());
    }

    /**
     * 添加动画层
     */
    public addLayer(layer: AnimationLayer): void {
        this.layers.push(layer);
        // 按权重排序 (高权重的层优先处理)
        this.layers.sort((a, b) => b.weight - a.weight);
    }

    /**
     * 移除动画层
     */
    public removeLayer(layerName: string): void {
        this.layers = this.layers.filter(layer => layer.name !== layerName);
    }

    /**
     * 获取动画层
     */
    public getLayer(layerName: string): AnimationLayer | undefined {
        return this.layers.find(layer => layer.name === layerName);
    }

    /**
     * 设置当前时间
     */
    public setTime(time: number): void {
        this.currentTime = time;
    }

    /**
     * 获取当前时间
     */
    public getTime(): number {
        return this.currentTime;
    }

    /**
     * 评估单个动画剪辑
     */
    public evaluateClip(clip: AnimationClip, time: number): Transform {
        const result = new Transform();

        // 计算实际播放时间 (考虑循环和速度)
        const adjustedTime = time * clip.speed;
        const duration = clip.duration;
        let evalTime = adjustedTime;

        if (clip.loop) {
            evalTime = adjustedTime % duration;
        } else {
            evalTime = Math.min(adjustedTime, duration);
        }

        // 评估每个通道
        clip.channels.forEach(channel => {
            const interpolationResult = this.evaluateChannel(channel, evalTime);

            switch (channel.name) {
                case 'position':
                    result.position.copyFrom(interpolationResult.value as MMath.Vector3);
                    break;
                case 'rotation':
                    result.rotation.copyFrom(interpolationResult.value as MMath.Quaternion);
                    break;
                case 'scale':
                    result.scale.copyFrom(interpolationResult.value as MMath.Vector3);
                    break;
                case 'scalar':
                    // 标量值可以用于其他属性，这里不处理
                    break;
            }
        });

        return result;
    }

    /**
     * 评估动画通道
     */
    private evaluateChannel(channel: AnimationChannel, time: number): InterpolationResult {
        const interpolator = this.interpolators.get(channel.name);

        if (!interpolator) {
            console.warn(`No interpolator found for channel: ${channel.name}`);
            return { value: 0, normalized: false };
        }

        return interpolator.interpolate(channel.keyframes, time);
    }

    /**
     * 混合所有动画层
     */
    public blendLayers(): AnimationEvaluationResult[] {
        const results: AnimationEvaluationResult[] = [];

        // 从低权重到高权重处理 (准备混合)
        const sortedLayers = [...this.layers].sort((a, b) => a.weight - b.weight);

        let accumulatedTransform = new Transform();
        let accumulatedWeight = 0;

        for (const layer of sortedLayers) {
            if (!layer.enabled || layer.weight <= 0) {
                continue;
            }

            // 评估该层的所有剪辑
            for (const clip of layer.clips) {
                const clipTransform = this.evaluateClip(clip, this.currentTime);

                // 创建混合结果
                const blendedTransform = new Transform();

                if (layer.blendMode === 'additive') {
                    // 加性混合
                    blendedTransform.copyFrom(accumulatedTransform);
                    blendedTransform.position.add(clipTransform.position.multiplyScalar(layer.weight));
                    // 四元数的加性混合比较复杂，这里简化处理
                } else {
                    // 覆盖混合
                    const blendFactor = layer.weight / (layer.weight + accumulatedWeight);
                    blendedTransform.position.lerp(clipTransform.position, blendFactor);
                    blendedTransform.rotation.slerp(clipTransform.rotation, blendFactor);
                    blendedTransform.scale.lerp(clipTransform.scale, blendFactor);
                }

                results.push({
                    transform: blendedTransform,
                    weight: layer.weight,
                    layerName: layer.name
                });

                accumulatedTransform = blendedTransform;
                accumulatedWeight += layer.weight;
            }
        }

        // 如果没有动画，返回默认变换
        if (results.length === 0) {
            results.push({
                transform: this.defaultTransform,
                weight: 1.0,
                layerName: 'default'
            });
        }

        return results;
    }

    /**
     * 获取最终混合结果
     */
    public getFinalTransform(): Transform {
        const results = this.blendLayers();

        if (results.length === 0) {
            return new Transform();
        }

        // 返回最高权重的结果作为最终结果
        results.sort((a, b) => b.weight - a.weight);
        return results[0].transform;
    }

    /**
     * 更新动画
     */
    public update(deltaTime: number): void {
        this.currentTime += deltaTime;
    }

    /**
     * 重置动画
     */
    public reset(): void {
        this.currentTime = 0;
    }
}
```

### 5. 完整的动画系统演示

```typescript
/**
 * animation-demo.ts
 * 完整的动画系统演示
 */

import { MSpec, MMMath } from '@maxellabs/core';
import { AnimationLayer, AnimationClip, AnimationChannel, AnimationKeyframe } from './animation-data-structures';
import { EasingFunctions } from './easing-functions';
import { AnimationMixer, Transform } from './animation-mixer';

/**
 * 动画演示场景
 */
class AnimationDemo {
    private canvas: HTMLCanvasElement;
    private device: MSpec.IRHIDevice;
    private context: GPUCanvasContext;

    private animationMixer: AnimationMixer;
    private renderables: Map<string, Renderable> = new Map();

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.animationMixer = new AnimationMixer();
        this.createAnimations();
        this.createRenderables();
    }

    private createAnimations() {
        // ==================== 行走动画 ====================
        const walkClip: AnimationClip = {
            name: 'walk',
            duration: 1.0,
            loop: true,
            speed: 1.0,
            channels: [
                {
                    name: 'position',
                    interpolation: 'linear',
                    keyframes: [
                        { time: 0, value: new MMMath.Vector3(0, 0, 0) },
                        { time: 0.5, value: new MMMath.Vector3(0, 0.5, 0) },
                        { time: 1.0, value: new MMMath.Vector3(0, 0, 0) }
                    ]
                },
                {
                    name: 'rotation',
                    interpolation: 'cubic',
                    keyframes: [
                        { time: 0, value: MMMath.Quaternion.identity() },
                        { time: 0.25, value: new MMMath.Quaternion().setFromEuler(0, Math.PI / 6, 0) },
                        { time: 0.75, value: new MMMath.Quaternion().setFromEuler(0, -Math.PI / 6, 0) },
                        { time: 1.0, value: MMMath.Quaternion.identity() }
                    ]
                }
            ]
        };

        // ==================== 跳跃动画 ====================
        const jumpClip: AnimationClip = {
            name: 'jump',
            duration: 0.8,
            loop: false,
            speed: 1.0,
            channels: [
                {
                    name: 'position',
                    interpolation: 'cubic',
                    keyframes: [
                        { time: 0, value: new MMMath.Vector3(0, 0, 0) },
                        { time: 0.2, value: new MMMath.Vector3(0, 0.2, 0) },
                        { time: 0.5, value: new MMMath.Vector3(0, 2, 0) },
                        { time: 0.8, value: new MMMath.Vector3(0, 0, 0) }
                    ]
                },
                {
                    name: 'rotation',
                    interpolation: 'linear',
                    keyframes: [
                        { time: 0, value: MMMath.Quaternion.identity() },
                        { time: 0.4, value: new MMMath.Quaternion().setFromEuler(0, 0, Math.PI / 2) },
                        { time: 0.8, value: MMMath.Quaternion().setFromEuler(0, 0, Math.PI) }
                    ]
                }
            ]
        };

        // ==================== 缩放脉冲动画 ====================
        const scaleClip: AnimationClip = {
            name: 'scale',
            duration: 0.5,
            loop: true,
            speed: 2.0,
            channels: [
                {
                    name: 'scale',
                    interpolation: 'cubic',
                    keyframes: [
                        { time: 0, value: new MMMath.Vector3(1, 1, 1) },
                        { time: 0.25, value: new MMMath.Vector3(1.2, 1.2, 1.2) },
                        { time: 0.5, value: new MMMath.Vector3(1, 1, 1) }
                    ]
                }
            ]
        };

        // ==================== 创建动画层 ====================

        // 基础层 (行走动画)
        const baseLayer: AnimationLayer = {
            name: 'base',
            weight: 1.0,
            enabled: true,
            blendMode: 'override',
            clips: [walkClip]
        };

        // 动作层 (跳跃动画)
        const actionLayer: AnimationLayer = {
            name: 'action',
            weight: 0.0,
            enabled: false,
            blendMode: 'additive',
            clips: [jumpClip]
        };

        // 效果层 (缩放动画)
        const effectLayer: AnimationLayer = {
            name: 'effect',
            weight: 0.3,
            enabled: true,
            blendMode: 'override',
            clips: [scaleClip]
        };

        // 添加到混合器
        this.animationMixer.addLayer(baseLayer);
        this.animationMixer.addLayer(actionLayer);
        this.animationMixer.addLayer(effectLayer);
    }

    private createRenderables() {
        // 创建角色立方体
        const character = new Renderable(
            this.device,
            'character',
            new MMMath.Vector3(-3, 0, 0),
            new MMMath.Vector3(1, 2, 1)
        );
        this.renderables.set('character', character);

        // 创建环境球体
        const environment = new Renderable(
            this.device,
            'environment',
            new MMMath.Vector3(3, 0, 0),
            new MMMath.Vector3(1, 1, 1)
        );
        this.renderables.set('environment', environment);
    }

    public async init() {
        // 初始化WebGPU设备等
        await this.initDevice();

        // 开始动画循环
        this.startAnimationLoop();
    }

    private async initDevice() {
        // WebGPU初始化代码 (类似之前的示例)
        if (!navigator.gpu) {
            throw new Error('WebGPU not supported');
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error('Failed to get GPU adapter');
        }

        const device = await adapter.requestDevice();
        const context = this.canvas.getContext('webgpu') as GPUCanvasContext;

        context.configure({
            device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'opaque',
        });

        this.device = MSpec.RHI.createDevice(device);
        this.context = context;
    }

    private startAnimationLoop() {
        let lastTime = performance.now();

        const animate = (currentTime: number) => {
            const deltaTime = (currentTime - lastTime) / 1000; // 转换为秒
            lastTime = currentTime;

            // 更新动画
            this.animationMixer.update(deltaTime);

            // 获取动画结果并应用到渲染对象
            this.updateRenderables();

            // 渲染场景
            this.render();

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    private updateRenderables() {
        // 获取最终变换
        const finalTransform = this.animationMixer.getFinalTransform();
        const matrix = finalTransform.getMatrix();

        // 应用到角色
        const character = this.renderables.get('character');
        if (character) {
            character.setTransform(matrix);
        }

        // 环境对象使用独立的动画
        const environment = this.renderables.get('environment');
        if (environment) {
            const envMatrix = MMMath.Matrix4.fromPool();
            envMatrix.identity();
            envMatrix.translate(new MMMath.Vector3(3, 0, 0));
            envMatrix.rotateY(performance.now() * 0.001);
            environment.setTransform(envMatrix);
            MMMath.Matrix4.toPool(envMatrix);
        }
    }

    private render() {
        // 渲染代码 (使用RHI)
        const encoder = this.device.createCommandEncoder();
        const currentTextureView = this.context.getCurrentTexture().createView();

        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: currentTextureView,
                loadOp: 'clear',
                clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        });

        // 渲染所有对象
        this.renderables.forEach(renderable => {
            renderable.render(renderPass);
        });

        renderPass.end();
        this.device.submit(encoder.finish());
    }

    // 控制方法
    public playAnimation(layerName: string, enabled: boolean) {
        const layer = this.animationMixer.getLayer(layerName);
        if (layer) {
            layer.enabled = enabled;
        }
    }

    public setLayerWeight(layerName: string, weight: number) {
        const layer = this.animationMixer.getLayer(layerName);
        if (layer) {
            layer.weight = Math.max(0, Math.min(1, weight));
            this.animationMixer.addLayer(layer); // 重新排序
        }
    }
}

/**
 * 可渲染对象
 */
class Renderable {
    private device: MSpec.IRHIDevice;
    private name: string;
    private position: MMMath.Vector3;
    private scale: MMMath.Vector3;
    private transform: MMMath.Matrix4;
    private pipeline: MSpec.IRHIRenderPipeline;
    private vertexBuffer: MSpec.IRHIBuffer;
    private indexBuffer: MSpec.IRHIBuffer;
    private uniformBuffer: MSpec.IRHIBuffer;

    constructor(device: MSpec.IRHIDevice, name: string, position: MMMath.Vector3, scale: MMMath.Vector3) {
        this.device = device;
        this.name = name;
        this.position = position.clone();
        this.scale = scale.clone();
        this.transform = MMMath.Matrix4.fromPool();
        this.transform.identity();
        this.transform.compose(position, MMMath.Quaternion.identity(), scale);

        this.createRenderResources();
    }

    private createRenderResources() {
        // 创建几何体 (简化的立方体)
        const vertices = new Float32Array([
            // 立方体顶点
            -0.5, -0.5, -0.5,  0,  0, -1,
             0.5, -0.5, -0.5,  0,  0, -1,
             0.5,  0.5, -0.5,  0,  0, -1,
            -0.5,  0.5, -0.5,  0,  0, -1,
            // ... 其他面
        ]);

        const indices = new Uint16Array([
            0, 1, 2,  0, 2, 3,
            // ... 其他索引
        ]);

        this.vertexBuffer = this.device.createBuffer({
            size: vertices.byteLength,
            usage: MSpec.RHIBufferUsage.VERTEX,
            hint: 'static',
            initialData: vertices
        });

        this.indexBuffer = this.device.createBuffer({
            size: indices.byteLength,
            usage: MSpec.RHIBufferUsage.INDEX,
            hint: 'static',
            initialData: indices
        });

        this.uniformBuffer = this.device.createBuffer({
            size: 64, // mat4
            usage: MSpec.RHIBufferUsage.UNIFORM,
            hint: 'dynamic'
        });

        // 创建管线 (简化)
        const vertexShader = this.device.createShaderModule({
            code: `
                @vertex
                fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
                    return uniforms.mvpMatrix * vec4<f32>(position, 1.0);
                }
            `,
            language: 'wgsl',
            stage: MSpec.RHIShaderStage.VERTEX
        });

        const fragmentShader = this.device.createShaderModule({
            code: `
                @fragment
                fn main() -> @location(0) vec4<f32> {
                    return vec4<f32>(0.7, 0.3, 0.2, 1.0);
                }
            `,
            language: 'wgsl',
            stage: MSpec.RHIShaderStage.FRAGMENT
        });

        this.pipeline = this.device.createRenderPipeline({
            vertexShader,
            fragmentShader,
            // ... 其他配置
        });
    }

    public setTransform(matrix: MMMath.Matrix4) {
        this.transform.copyFrom(matrix);

        // 更新uniform缓冲区
        const data = new Float32Array(16);
        data.set(matrix.getElements());
        this.uniformBuffer.update(data);
    }

    public render(renderPass: MSpec.IRHIRenderPass) {
        renderPass.setPipeline(this.pipeline);
        renderPass.setVertexBuffer(0, this.vertexBuffer);
        renderPass.setIndexBuffer(this.indexBuffer, MSpec.RHIIndexFormat.UINT16);
        renderPass.setBindGroup(0, 0);
        renderPass.drawIndexed(36); // 立方体索引数
    }
}

// ==================== HTML界面控制 ====================

// 在HTML中添加控制界面
function setupAnimationControls(demo: AnimationDemo) {
    // 动画控制按钮
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        padding: 15px;
        border-radius: 5px;
        color: white;
    `;

    controlsDiv.innerHTML = `
        <h3>动画控制</h3>
        <div>
            <label>跳跃动画: <input type="checkbox" id="jump-toggle"></label>
        </div>
        <div>
            <label>跳跃权重: <input type="range" id="jump-weight" min="0" max="1" step="0.1" value="0"></label>
            <span id="jump-weight-value">0</span>
        </div>
        <div>
            <label>缩放权重: <input type="range" id="scale-weight" min="0" max="1" step="0.1" value="0.3"></label>
            <span id="scale-weight-value">0.3</span>
        </div>
    `;

    document.body.appendChild(controlsDiv);

    // 绑定事件
    document.getElementById('jump-toggle')?.addEventListener('change', (e) => {
        demo.playAnimation('action', (e.target as HTMLInputElement).checked);
    });

    document.getElementById('jump-weight')?.addEventListener('input', (e) => {
        const weight = parseFloat((e.target as HTMLInputElement).value);
        demo.setLayerWeight('action', weight);
        document.getElementById('jump-weight-value')!.textContent = weight.toFixed(1);
    });

    document.getElementById('scale-weight')?.addEventListener('input', (e) => {
        const weight = parseFloat((e.target as HTMLInputElement).value);
        demo.setLayerWeight('effect', weight);
        document.getElementById('scale-weight-value')!.textContent = weight.toFixed(1);
    });
}

// ==================== 程序入口 ====================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const demo = new AnimationDemo('animation-canvas');
        await demo.init();
        setupAnimationControls(demo);

        console.log('动画系统演示启动成功！');
    } catch (error) {
        console.error('动画系统初始化失败:', error);
    }
});
```

## 关键特性说明

### 1. 数据结构设计

- **Specification驱动**: 使用Specification库定义标准化的动画数据结构
- **类型安全**: TypeScript接口确保数据类型正确性
- **扩展性**: 易于添加新的动画类型和属性

### 2. 缓动函数

- **多种缓动**: 线性、二次、三次、弹性、反弹等多种缓动类型
- **组合能力**: 可以组合不同的缓动函数创建复杂效果
- **性能优化**: 预计算和缓存常用值

### 3. 插值系统

- **多类型支持**: 支持标量、Vector3、Quaternion等类型的插值
- **SLERP四元数插值**: 确保旋转的平滑性和正确性
- **对象池优化**: 使用Math库的对象池管理临时对象

### 4. 多层动画混合

- **权重系统**: 每个动画层都有独立的权重控制
- **混合模式**: 支持覆盖和加性两种混合模式
- **优先级**: 高权重层优先处理

### 5. 性能优化

- **对象池**: 大量使用对象池避免内存分配
- **批量处理**: 批量更新动画状态
- **懒加载**: 按需创建插值器和资源

## 最佳实践

### 1. 动画数据组织

```typescript
// ✅ 使用清晰的命名和结构
const walkClip: AnimationClip = {
    name: 'walk',
    duration: 1.0,
    loop: true,
    speed: 1.0,
    channels: [
        {
            name: 'position',
            interpolation: 'linear',
            keyframes: [...]
        }
    ]
};
```

### 2. 性能监控

```typescript
// ✅ 监控动画性能
class AnimationProfiler {
    private frameTime = 0;
    private animationTime = 0;

    beginFrame() {
        this.frameTime = performance.now();
    }

    beginAnimation() {
        this.animationTime = performance.now();
    }

    endAnimation() {
        const animationDuration = performance.now() - this.animationTime;
        if (animationDuration > 16) { // 超过16ms
            console.warn(`Animation update took ${animationDuration.toFixed(2)}ms`);
        }
    }
}
```

### 3. 内存管理

```typescript
// ✅ 正确使用对象池
const tempVector = MMath.Vector3.fromPool();
// 使用tempVector...
MMath.Vector3.toPool(tempVector); // 归还到池
```

### 4. 错误处理

```typescript
// ✅ 健壮的错误处理
public evaluateClip(clip: AnimationClip, time: number): Transform {
    if (!clip || clip.channels.length === 0) {
        console.warn('Invalid clip, returning default transform');
        return new Transform();
    }

    try {
        // 评估逻辑...
    } catch (error) {
        console.error(`Error evaluating clip ${clip.name}:`, error);
        return new Transform();
    }
}
```

## 扩展建议

1. **状态机系统**: 添加复杂的状态转换逻辑
2. **动画事件**: 支持关键帧事件回调
3. **反向播放**: 支持动画反向播放
4. **动画混合树**: 更复杂的混合逻辑
5. **LOD系统**: 根据距离调整动画质量
6. **压缩算法**: 动画数据压缩和优化

这个动画系统提供了完整的框架，可以满足大多数3D应用的动画需求，并且具有良好的扩展性。