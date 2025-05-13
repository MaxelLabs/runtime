import { Animation, InterpolationType, LoopMode } from './Animation';
import { ReferResource } from '../base/ReferResource';

/**
 * 关键帧数据
 */
export interface Keyframe<T> {
  /** 时间(秒) */
  time: number,
  /** 值 */
  value: T,
  /** 插值方式 */
  interpolation?: InterpolationType,
  /** 输入切线(仅用于曲线插值) */
  inTangent?: number | number[],
  /** 输出切线(仅用于曲线插值) */
  outTangent?: number | number[],
}

/**
 * 动画通道
 */
export interface AnimationTrack<T> {
  /** 通道名称 */
  name: string,
  /** 目标属性路径 */
  path: string,
  /** 关键帧数据 */
  keyframes: Keyframe<T>[],
  /** 默认插值类型 */
  interpolation: InterpolationType,
}

/**
 * 动画片段
 * 包含多个动画通道，每个通道控制物体的不同属性
 */
export class AnimationClip extends ReferResource {
  /** 片段名称 */
  private name: string;
  /** 动画通道列表 */
  private tracks: AnimationTrack<any>[] = [];
  /** 动画时长 */
  private duration: number = 0;
  /** 是否循环 */
  private loop: boolean = false;
  /** 采样率 */
  private sampleRate: number = 30;

  /**
   * 创建动画片段
   * @param name 片段名称
   */
  constructor (name: string) {
    super();
    this.name = name;
  }

  /**
   * 获取片段名称
   */
  getName (): string {
    return this.name;
  }

  /**
   * 添加动画通道
   * @param track 动画通道
   */
  addTrack<T>(track: AnimationTrack<T>): void {
    this.tracks.push(track);
    this.updateDuration();
  }

  /**
   * 移除动画通道
   * @param nameOrIndex 通道名称或索引
   * @returns 是否成功移除
   */
  removeTrack (nameOrIndex: string | number): boolean {
    if (typeof nameOrIndex === 'string') {
      const index = this.tracks.findIndex(track => track.name === nameOrIndex);

      if (index === -1) {return false;}

      this.tracks.splice(index, 1);
      this.updateDuration();

      return true;
    } else {
      if (nameOrIndex < 0 || nameOrIndex >= this.tracks.length) {return false;}

      this.tracks.splice(nameOrIndex, 1);
      this.updateDuration();

      return true;
    }
  }

  /**
   * 获取动画通道
   * @param nameOrIndex 通道名称或索引
   * @returns 动画通道或undefined
   */
  getTrack<T>(nameOrIndex: string | number): AnimationTrack<T> | undefined {
    if (typeof nameOrIndex === 'string') {
      return this.tracks.find(track => track.name === nameOrIndex) as AnimationTrack<T>;
    } else {
      return this.tracks[nameOrIndex] as AnimationTrack<T>;
    }
  }

  /**
   * 获取所有通道
   */
  getAllTracks (): AnimationTrack<any>[] {
    return [...this.tracks];
  }

  /**
   * 获取通道数量
   */
  getTrackCount (): number {
    return this.tracks.length;
  }

  /**
   * 更新动画时长
   */
  private updateDuration (): void {
    this.duration = 0;

    for (const track of this.tracks) {
      if (track.keyframes.length > 0) {
        const lastKeyframe = track.keyframes[track.keyframes.length - 1];

        this.duration = Math.max(this.duration, lastKeyframe.time);
      }
    }
  }

  /**
   * 获取动画时长
   */
  getDuration (): number {
    return this.duration;
  }

  /**
   * 设置是否循环
   * @param loop 是否循环
   */
  setLoop (loop: boolean): void {
    this.loop = loop;
  }

  /**
   * 是否循环
   */
  isLoop (): boolean {
    return this.loop;
  }

  /**
   * 设置采样率
   * @param rate 采样率(每秒帧数)
   */
  setSampleRate (rate: number): void {
    this.sampleRate = Math.max(1, rate);
  }

  /**
   * 获取采样率
   */
  getSampleRate (): number {
    return this.sampleRate;
  }

  /**
   * 对指定时间进行采样
   * @param time 时间(秒)
   * @returns 采样结果，每个通道的当前值 { trackName: value }
   */
  sample (time: number): Record<string, any> {
    const result: Record<string, any> = {};

    // 如果启用循环，处理时间循环
    if (this.loop && this.duration > 0) {
      time = time % this.duration;
      if (time < 0) {
        time += this.duration;
      }
    }

    // 对每个通道进行采样
    for (const track of this.tracks) {
      const value = this.sampleTrack(track, time);

      if (value !== undefined) {
        result[track.path] = value;
      }
    }

    return result;
  }

  /**
   * 对单个通道在指定时间进行采样
   * @param track 动画通道
   * @param time 时间(秒)
   * @returns 采样值或undefined
   */
  private sampleTrack<T>(track: AnimationTrack<T>, time: number): T | undefined {
    const keyframes = track.keyframes;

    if (keyframes.length === 0) {
      return undefined;
    }

    // 如果只有一个关键帧或时间在第一个关键帧之前
    if (keyframes.length === 1 || time <= keyframes[0].time) {
      return keyframes[0].value;
    }

    // 如果时间在最后一个关键帧之后
    if (time >= keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1].value;
    }

    // 查找时间所在的两个关键帧
    let i = 1;

    while (i < keyframes.length && time > keyframes[i].time) {
      i++;
    }

    const previousKeyframe = keyframes[i - 1];
    const nextKeyframe = keyframes[i];

    // 计算两个关键帧之间的插值因子 (0-1)
    const t = (time - previousKeyframe.time) / (nextKeyframe.time - previousKeyframe.time);

    // 根据插值类型计算当前值
    const interpolationType = nextKeyframe.interpolation || track.interpolation;

    switch (interpolationType) {
      case InterpolationType.Step:
        // 阶梯插值，直接返回前一个关键帧的值
        return previousKeyframe.value;
      case InterpolationType.Linear:
        // 线性插值
        return this.linearInterpolate(previousKeyframe.value, nextKeyframe.value, t);
      case InterpolationType.CubicSpline:
        // 三次样条插值，需要切线信息
        if (
          previousKeyframe.outTangent !== undefined &&
          nextKeyframe.inTangent !== undefined
        ) {
          return this.cubicInterpolate(
            previousKeyframe.value,
            nextKeyframe.value,
            previousKeyframe.outTangent,
            nextKeyframe.inTangent,
            t
          );
        } else {
          // 如果没有切线信息，退化为线性插值
          return this.linearInterpolate(previousKeyframe.value, nextKeyframe.value, t);
        }
      default:
        return this.linearInterpolate(previousKeyframe.value, nextKeyframe.value, t);
    }
  }

  /**
   * 线性插值
   * @param a 起始值
   * @param b 结束值
   * @param t 插值因子(0-1)
   * @returns 插值结果
   */
  private linearInterpolate (a: any, b: any, t: number): any {
    // 处理数字
    if (typeof a === 'number' && typeof b === 'number') {
      return a + (b - a) * t;
    }

    // 处理数组(如向量)
    if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
      return a.map((value, index) => value + (b[index] - value) * t);
    }

    // 处理对象
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const result: any = {};

      // 只插值两个对象都有的属性
      for (const key in a) {
        if (key in b) {
          result[key] = this.linearInterpolate(a[key], b[key], t);
        } else {
          result[key] = a[key];
        }
      }

      return result;
    }

    // 默认情况下，不能插值，返回最接近的值
    return t < 0.5 ? a : b;
  }

  /**
   * 三次样条插值
   * @param a 起始值
   * @param b 结束值
   * @param outTangent 出切线
   * @param inTangent 入切线
   * @param t 插值因子(0-1)
   * @returns 插值结果
   */
  private cubicInterpolate (a: any, b: any, outTangent: any, inTangent: any, t: number): any {
    // 处理数字
    if (typeof a === 'number' && typeof b === 'number' &&
        typeof outTangent === 'number' && typeof inTangent === 'number') {
      // 三次Hermite插值公式
      const t2 = t * t;
      const t3 = t2 * t;

      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;

      return h00 * a + h10 * outTangent + h01 * b + h11 * inTangent;
    }

    // 处理数组(如向量)
    if (Array.isArray(a) && Array.isArray(b) &&
        Array.isArray(outTangent) && Array.isArray(inTangent) &&
        a.length === b.length && a.length === outTangent.length && a.length === inTangent.length) {

      return a.map((value, index) =>
        this.cubicInterpolate(
          value, b[index], outTangent[index], inTangent[index], t
        ) as number
      );
    }

    // 对于不支持的类型，退化为线性插值
    return this.linearInterpolate(a, b, t);
  }

  /**
   * 创建实例动画
   * @param target 目标对象
   * @returns 动画实例
   */
  createInstance (target: object): AnimationInstance {
    return new AnimationInstance(this, target);
  }
}

/**
 * 动画实例类
 * 将动画片段应用于特定目标对象
 */
export class AnimationInstance extends Animation {
  /** 动画片段 */
  private clip: AnimationClip;
  /** 目标对象 */
  private target: object;
  /** 当前采样值缓存 */
  private currentValues: Record<string, any> = {};

  /**
   * 创建动画实例
   * @param clip 动画片段
   * @param target 目标对象
   */
  constructor (clip: AnimationClip, target: object) {
    super(clip.getName(), clip.getDuration());
    this.clip = clip;
    this.target = target;

    // 默认循环设置
    this.setLoopMode(clip.isLoop() ? LoopMode.Loop : LoopMode.Once);
  }

  /**
   * 获取动画片段
   */
  getClip (): AnimationClip {
    return this.clip;
  }

  /**
   * 获取目标对象
   */
  getTarget (): object {
    return this.target;
  }

  /**
   * 设置目标对象
   * @param target 目标对象
   */
  setTarget (target: object): void {
    this.target = target;
    // 重新采样确保更新到正确的目标
    this.sample();
  }

  /**
   * 采样当前时间的动画帧
   */
  protected override sample (): void {
    // 采样动画片段
    this.currentValues = this.clip.sample(this.getTime());

    // 将采样结果应用到目标对象
    this.applyValues();
  }

  /**
   * 将采样的值应用到目标对象
   */
  private applyValues (): void {
    if (!this.target) {return;}

    for (const path in this.currentValues) {
      const value = this.currentValues[path];

      this.setNestedProperty(this.target, path, value);
    }
  }

  /**
   * 设置嵌套属性值
   * @param obj 目标对象
   * @param path 属性路径 (如 "transform.position.x")
   * @param value 要设置的值
   */
  private setNestedProperty (obj: any, path: string, value: any): void {
    if (!obj || !path) {return;}

    const parts = path.split('.');
    let current = obj;

    // 遍历路径的每一部分，直到最后一个属性
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      // 如果当前属性是函数，尝试调用它
      if (typeof current[part] === 'function') {
        current = current[part]();
      } else {
        current = current[part];
      }

      // 如果路径中间断了，停止处理
      if (current === undefined || current === null) {
        return;
      }
    }

    const lastPart = parts[parts.length - 1];

    // 处理特殊情况，如向量组件
    if (current[lastPart] !== undefined) {
      if (typeof current[lastPart] === 'function') {
        // 如果是setter方法，调用它
        current[lastPart](value);
      } else {
        // 否则直接赋值
        current[lastPart] = value;
      }
    } else if (typeof current.set === 'function') {
      // 一些对象有set方法来设置组件
      current.set(lastPart, value);
    }
  }
}