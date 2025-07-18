import { UsdDataType } from '@maxellabs/specification';
import type { ColorDataType, ColorLike, UsdValue, vec4, Vector4Like } from '@maxellabs/specification';
import { Vector4 } from './vector4';
import { MathConfig } from '../config/mathConfig';
import { ObjectPool, type Poolable } from '../pool/objectPool';

// 高性能对象池实现
const colorPool = new ObjectPool<Color>(() => new Color(), MathConfig.getPoolConfig().Color);

/**
 * 颜色类
 * 实现 @specification 包的 IColor 接口，提供高性能的颜色运算
 */
export class Color implements ColorLike, Poolable {
  /**
   * 颜色的常量
   */
  static readonly BLACK = Object.freeze(new Color(0, 0, 0, 1)); // 纯黑色
  static readonly BLUE = Object.freeze(new Color(0, 0, 1, 1)); // 纯蓝色
  static readonly CLEAR = Object.freeze(new Color(0, 0, 0, 0)); // 完全透明
  static readonly CYAN = Object.freeze(new Color(0, 1, 1, 1)); // 青色
  static readonly GRAY = Object.freeze(new Color(0.5, 0.5, 0.5, 1)); // 灰色
  static readonly GREEN = Object.freeze(new Color(0, 1, 0, 1)); // 纯绿色
  static readonly MAGENTA = Object.freeze(new Color(1, 0, 1, 1)); // 洋红色
  static readonly RED = Object.freeze(new Color(1, 0, 0, 1)); // 纯红色
  static readonly WHITE = Object.freeze(new Color(1, 1, 1, 1)); // 纯白色
  static readonly YELLOW = Object.freeze(new Color(1, 0.92, 0.016, 1)); // 黄色

  // 使用内存对齐的TypedArray，提高SIMD性能
  private elements: Float32Array;

  /**
   * 构造函数，默认值为黑色
   * @param r - 红色分量，默认为0
   * @param g - 绿色分量，默认为0
   * @param b - 蓝色分量，默认为0
   * @param a - 透明度分量，默认为1
   */
  constructor(r = 0, g = 0, b = 0, a = 1) {
    // 16字节对齐，优化SIMD访问
    this.elements = new Float32Array(4);
    this.elements[0] = r;
    this.elements[1] = g;
    this.elements[2] = b;
    this.elements[3] = a;
  }

  /**
   * 重置对象状态（对象池接口）
   */
  reset(): void {
    this.elements[0] = 0;
    this.elements[1] = 0;
    this.elements[2] = 0;
    this.elements[3] = 1;
  }

  /**
   * 检查对象是否可池化（对象池接口）
   */
  isPoolable(): boolean {
    return true;
  }

  // ========== IColor 接口属性 ==========

  /**
   * 红色分量访问器（IColor接口）
   */
  get r(): number {
    return this.elements[0];
  }

  set r(value: number) {
    this.elements[0] = value;
  }

  /**
   * 绿色分量访问器（IColor接口）
   */
  get g(): number {
    return this.elements[1];
  }

  set g(value: number) {
    this.elements[1] = value;
  }

  /**
   * 蓝色分量访问器（IColor接口）
   */
  get b(): number {
    return this.elements[2];
  }

  set b(value: number) {
    this.elements[2] = value;
  }

  /**
   * 透明度分量访问器（IColor接口）
   */
  get a(): number {
    return this.elements[3];
  }

  set a(value: number) {
    this.elements[3] = value;
  }

  // ========== 规范兼容方法 ==========

  /**
   * 转换为IColor接口格式
   * @returns IColor接口对象
   */
  toIColor(): ColorLike {
    return {
      r: this.r,
      g: this.g,
      b: this.b,
      a: this.a,
    };
  }

  /**
   * 从IColor接口创建Color实例
   * @param c - IColor接口对象
   * @returns Color实例
   */
  static fromIColor(c: ColorLike): Color {
    return new Color(c.r, c.g, c.b, c.a);
  }

  /**
   * 从IColor接口设置当前颜色值
   * @param c - IColor接口对象
   * @returns 返回自身，用于链式调用
   */
  fromIColor(c: ColorLike): this {
    this.elements[0] = c.r;
    this.elements[1] = c.g;
    this.elements[2] = c.b;
    this.elements[3] = c.a;
    return this;
  }

  // ========== USD 兼容方法 ==========

  /**
   * 转换为USD兼容的UsdValue格式（Color4f）
   * @returns UsdValue对象格式
   */
  toUsdValue(): UsdValue {
    return {
      type: UsdDataType.Color4f,
      value: [this.r, this.g, this.b, this.a],
    };
  }

  /**
   * 从USD兼容的UsdValue格式创建Color实例
   * @param value - UsdValue对象格式
   * @returns Color实例
   */
  static fromUsdValue(value: UsdValue): Color {
    if (!value.value || !Array.isArray(value.value) || value.value.length < 3) {
      throw new Error('Invalid UsdValue for Color: must have array value with at least 3 elements');
    }
    const [r, g, b, a = 1] = value.value as [number, number, number, number?];
    return new Color(r, g, b, a);
  }

  /**
   * 从USD兼容的UsdValue格式设置当前颜色值
   * @param value - UsdValue对象格式
   * @returns 返回自身，用于链式调用
   */
  fromUsdValue(value: UsdValue): this {
    if (!value.value || !Array.isArray(value.value) || value.value.length < 3) {
      throw new Error('Invalid UsdValue for Color: must have array value with at least 3 elements');
    }
    const [r, g, b, a = 1] = value.value as [number, number, number, number?];
    this.elements[0] = r;
    this.elements[1] = g;
    this.elements[2] = b;
    this.elements[3] = a;
    return this;
  }

  // ========== 高性能对象池方法 ==========

  /**
   * 从对象池创建Color实例（高性能）
   * @param r - 红色分量，默认为0
   * @param g - 绿色分量，默认为0
   * @param b - 蓝色分量，默认为0
   * @param a - 透明度分量，默认为1
   * @returns Color实例
   */
  static create(r = 0, g = 0, b = 0, a = 1): Color {
    if (MathConfig.isObjectPoolEnabled()) {
      const instance = colorPool.create();
      instance.set(r, g, b, a);
      return instance;
    }
    return new Color(r, g, b, a);
  }

  /**
   * 释放Color实例到对象池（高性能）
   * @param color - 要释放的颜色实例
   */
  static release(color: Color): void {
    if (MathConfig.isObjectPoolEnabled() && color) {
      colorPool.release(color);
    }
  }

  /**
   * 预分配指定数量的Color实例到对象池
   * @param count - 预分配数量
   */
  static preallocate(count: number): void {
    if (MathConfig.isObjectPoolEnabled()) {
      colorPool.preallocate(count);
    }
  }

  /**
   * 清空对象池
   */
  static clearPool(): void {
    colorPool.clear();
  }

  /**
   * 获取对象池统计信息
   */
  static getPoolStats() {
    return colorPool.getStats();
  }

  /**
   * 设置颜色
   * @param r - r 分量
   * @param g - g 分量
   * @param b - b 分量
   * @param a - a 分量
   * @returns 返回自身，用于链式调用
   */
  set(r: number, g: number, b: number, a: number): this {
    this.elements[0] = r;
    this.elements[1] = g;
    this.elements[2] = b;
    this.elements[3] = a;

    return this;
  }

  /**
   * 设置零颜色
   * @returns 返回自身，用于链式调用
   */
  setZero(): this {
    this.elements[0] = 0;
    this.elements[1] = 0;
    this.elements[2] = 0;
    this.elements[3] = 0;

    return this;
  }

  /**
   * 通过标量数值设置颜色
   * @param num - 数值
   * @returns 返回自身，用于链式调用
   */
  setFromNumber(num: number): this {
    this.elements[0] = num;
    this.elements[1] = num;
    this.elements[2] = num;
    this.elements[3] = num;

    return this;
  }

  /**
   * 通过Vector4创建颜色
   * @param v - Vector4
   * @returns 返回自身，用于链式调用
   */
  setFromVector4(v: Vector4Like): this {
    this.elements[0] = v.x;
    this.elements[1] = v.y;
    this.elements[2] = v.z;
    this.elements[3] = v.w;

    return this;
  }

  /**
   * 通过数组创建颜色
   * @param array - 数组
   * @param offset - 起始偏移值，默认为0
   * @returns 返回自身，用于链式调用
   */
  setFromArray(array: ColorDataType, offset = 0): this {
    this.elements[0] = array[offset] ?? 0;
    this.elements[1] = array[offset + 1] ?? 0;
    this.elements[2] = array[offset + 2] ?? 0;
    this.elements[3] = array[offset + 3] ?? 1;

    return this;
  }

  /**
   * 从HSV颜色空间设置颜色
   * @param hue - 色相 (0-360)
   * @param saturation - 饱和度 (0-1)
   * @param value - 明度 (0-1)
   * @param alpha - 透明度 (0-1)，默认为1
   * @returns 返回自身，用于链式调用
   */
  setFromHSV(hue: number, saturation: number, value: number, alpha = 1): this {
    const chroma = value * saturation;
    const h = hue / 60;
    const x = chroma * (1 - Math.abs((h % 2) - 1));
    let r = 0;
    let g = 0;
    let b = 0;

    if (h >= 0 && h <= 1) {
      r = chroma;
      g = x;
    } else if (h >= 1 && h <= 2) {
      r = x;
      g = chroma;
    } else if (h >= 2 && h <= 3) {
      g = chroma;
      b = x;
    } else if (h >= 3 && h <= 4) {
      g = x;
      b = chroma;
    } else if (h >= 4 && h <= 5) {
      r = x;
      b = chroma;
    } else if (h >= 5 && h <= 6) {
      r = chroma;
      b = x;
    }

    const m = value - chroma;

    return this.set(r + m, g + m, b + m, alpha);
  }

  /**
   * 从十六进制字符串设置颜色
   * @param hex - 十六进制颜色字符串 (#RRGGBB 或 #RRGGBBAA)
   * @returns 返回自身，用于链式调用
   */
  setFromHexString(hex: string): this {
    if (hex.substring(0, 1) !== '#' || (hex.length !== 9 && hex.length !== 7)) {
      return this;
    }

    const r = parseInt(hex.substring(1, 3), 16) / 255.0;
    const g = parseInt(hex.substring(3, 5), 16) / 255.0;
    const b = parseInt(hex.substring(5, 7), 16) / 255.0;
    const a = hex.length === 9 ? parseInt(hex.substring(7, 9), 16) / 255.0 : 1.0;

    return this.set(r, g, b, a);
  }

  /**
   * 拷贝颜色
   * @param v - 复制对象
   * @returns 拷贝结果
   */
  copyFrom(v: ColorLike): this {
    this.elements[0] = v.r;
    this.elements[1] = v.g;
    this.elements[2] = v.b;
    this.elements[3] = v.a;

    return this;
  }

  /**
   * 克隆颜色
   * @returns 克隆结果
   */
  clone(): Color {
    return Color.create(this.r, this.g, this.b, this.a);
  }

  /**
   * 根据下标设置颜色分量
   * @param index - 下标值
   * @param value - 分量值
   * @returns 返回自身，用于链式调用
   */
  setElement(index: number, value: number): this {
    if (index >= 0 && index < 4) {
      this.elements[index] = value;
    } else {
      console.error('index is out of range: ' + index);
    }

    return this;
  }

  /**
   * 根据下标获取颜色分量
   * @param index - 下标
   * @returns 分量值
   */
  getElement(index: number): number {
    switch (index) {
      case 0:
        return this.r;
      case 1:
        return this.g;
      case 2:
        return this.b;
      case 3:
        return this.a;
      default:
        console.error('index is out of range: ' + index);
    }

    return 0;
  }

  /**
   * 颜色相加
   * @param right - 相加对象，颜色 | 数字
   * @returns 相加结果
   */
  add(right: number | vec4 | Color): this {
    if (typeof right === 'number') {
      this.r += right;
      this.g += right;
      this.b += right;
      this.a += right;
    } else if (right instanceof Array) {
      this.r += right[0];
      this.g += right[1];
      this.b += right[2];
      this.a += right[3];
    } else {
      this.r += right.r;
      this.g += right.g;
      this.b += right.b;
      this.a += right.a;
    }

    return this;
  }

  /**
   * 颜色相减
   * @param right - 相减对象，颜色 | 数字
   * @returns 相减结果
   */
  subtract(right: number | vec4 | Color): this {
    if (typeof right === 'number') {
      this.r -= right;
      this.g -= right;
      this.b -= right;
      this.a -= right;
    } else if (right instanceof Array) {
      this.r -= right[0];
      this.g -= right[1];
      this.b -= right[2];
      this.a -= right[3];
    } else {
      this.r -= right.r;
      this.g -= right.g;
      this.b -= right.b;
      this.a -= right.a;
    }

    return this;
  }

  /**
   * 颜色相乘
   * @param right - 相乘对象，对象 | 数字
   * @returns 颜色
   */
  multiply(right: number | vec4 | Color): this {
    if (typeof right === 'number') {
      this.r *= right;
      this.g *= right;
      this.b *= right;
      this.a *= right;
    } else if (right instanceof Array) {
      this.r *= right[0];
      this.g *= right[1];
      this.b *= right[2];
      this.a *= right[3];
    } else {
      this.r *= right.r;
      this.g *= right.g;
      this.b *= right.b;
      this.a *= right.a;
    }

    return this;
  }

  /**
   * 颜色相除
   * @param right - 相除对象，对象 | 数字
   * @returns 颜色
   */
  divide(right: number | vec4 | Color): this {
    if (typeof right === 'number') {
      this.r /= right;
      this.g /= right;
      this.b /= right;
      this.a /= right;
    } else if (right instanceof Array) {
      this.r /= right[0];
      this.g /= right[1];
      this.b /= right[2];
      this.a /= right[3];
    } else {
      this.r /= right.r;
      this.g /= right.g;
      this.b /= right.b;
      this.a /= right.a;
    }

    return this;
  }

  /**
   * 颜色缩放
   * @param v - 数字
   * @returns 缩放结果
   */
  scale(v: number): this {
    this.r *= v;
    this.g *= v;
    this.b *= v;
    this.a *= v;

    return this;
  }

  /**
   * 颜色求最小值
   * @param v - 颜色或数值
   * @returns 最小值
   */
  min(v: Color | number): this {
    if (typeof v === 'number') {
      this.r = Math.min(this.r, v);
      this.g = Math.min(this.g, v);
      this.b = Math.min(this.b, v);
      this.a = Math.min(this.a, v);
    } else {
      this.r = Math.min(this.r, v.r);
      this.g = Math.min(this.g, v.g);
      this.b = Math.min(this.b, v.b);
      this.a = Math.min(this.a, v.a);
    }

    return this;
  }

  /**
   * 颜色求最大值
   * @param v - 颜色或数值
   * @returns 最大值
   */
  max(v: Color | number): this {
    if (typeof v === 'number') {
      this.r = Math.max(this.r, v);
      this.g = Math.max(this.g, v);
      this.b = Math.max(this.b, v);
      this.a = Math.max(this.a, v);
    } else {
      this.r = Math.max(this.r, v.r);
      this.g = Math.max(this.g, v.g);
      this.b = Math.max(this.b, v.b);
      this.a = Math.max(this.a, v.a);
    }

    return this;
  }

  /**
   * 颜色阈值约束
   * @param min - 最小值
   * @param max - 最大值
   * @returns 颜色
   */
  clamp(min: Color | number, max: Color | number): this {
    return this.max(min).min(max);
  }

  /**
   * 颜色求线性插值
   * @param v - 颜色
   * @param alpha - 插值比例
   * @returns 插值结果
   */
  lerp(v: Color, alpha: number): this {
    this.r += (v.r - this.r) * alpha;
    this.g += (v.g - this.g) * alpha;
    this.b += (v.b - this.b) * alpha;
    this.a += (v.a - this.a) * alpha;

    return this;
  }

  /**
   * 计算颜色亮度值
   * @returns 亮度值
   */
  luminance(): number {
    return this.r * 0.3 + this.g * 0.59 + this.b * 0.11;
  }

  /**
   * 颜色判等
   * @param v - 颜色
   * @returns 判等结果
   */
  equals(v: Color): boolean {
    return v.r === this.r && v.g === this.g && v.b === this.b && v.a === this.a;
  }

  toLinear(): this {
    this.r = Color.gammaToLinear(this.r);
    this.g = Color.gammaToLinear(this.g);
    this.b = Color.gammaToLinear(this.b);

    return this;
  }

  toGamma(): this {
    this.r = Color.linearToGamma(this.r);
    this.g = Color.linearToGamma(this.g);
    this.b = Color.linearToGamma(this.b);

    return this;
  }

  /**
   * 转换为数组
   * @returns [r, g, b, a]数组
   */
  toArray(): [r: number, g: number, b: number, a: number] {
    return [this.r, this.g, this.b, this.a];
  }

  toVector4(): Vector4 {
    return new Vector4(this.r, this.g, this.b, this.a);
  }

  /**
   * RGB 颜色空间转 HSV
   * @param result HSV 值
   */
  toHSV(): Color {
    const { r, g, b, a } = this;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const v = max;
    const dm = max - min;
    let h = 0;
    let s = 0;

    if (max !== 0) {
      s = dm / max;
    }

    if (max != min) {
      if (max == r) {
        h = (g - b) / dm;
        if (g < b) {
          h += 6;
        }
      } else if (max == g) {
        h = (b - r) / dm + 2;
      } else if (max == b) {
        h = (r - g) / dm + 4;
      }
      h *= 60;
    }

    return new Color(h, s, v, a);
  }

  toHexString(includeAlpha = true) {
    const R = Color.ToHex(Math.round(this.r * 255));
    const G = Color.ToHex(Math.round(this.g * 255));
    const B = Color.ToHex(Math.round(this.b * 255));
    const A = Color.ToHex(Math.round(this.a * 255));

    if (includeAlpha) {
      return '#' + R + G + B + A;
    } else {
      return '#' + R + G + B;
    }
  }

  fill(array: number[] | Float32Array, offset = 0) {
    array[offset] = this.r;
    array[offset + 1] = this.g;
    array[offset + 2] = this.b;
    array[offset + 3] = this.a;
  }

  /**
   * 通过标量数值创建颜色
   * @param num - 数值
   * @returns 颜色
   */
  static fromNumber(num: number): Color {
    return Color.create().setFromNumber(num);
  }

  /**
   * 通过数组创建颜色
   * @param array - 数组
   * @param offset - 起始偏移值，默认为0
   * @returns 颜色
   */
  static fromArray(array: ColorDataType, offset = 0): Color {
    return Color.create().setFromArray(array, offset);
  }

  /**
   * 通过十六进制字符串创建颜色
   * @param hex - 十六进制颜色字符串
   * @returns 颜色
   */
  static fromHexString(hex: string): Color {
    return Color.create().setFromHexString(hex);
  }

  /**
   * 通过HSV颜色空间创建颜色
   * @param hue - 色相 (0-360)
   * @param saturation - 饱和度 (0-1)
   * @param value - 明度 (0-1)
   * @param alpha - 透明度 (0-1)，默认为1
   * @returns 颜色
   */
  static fromHSV(hue: number, saturation: number, value: number, alpha = 1): Color {
    return Color.create().setFromHSV(hue, saturation, value, alpha);
  }

  /**
   * 通过HSL颜色空间创建颜色
   * @param h - 色相 (0-360)
   * @param s - 饱和度 (0-1)
   * @param l - 亮度 (0-1)
   * @param a - 透明度 (0-1)，默认为1
   * @returns 颜色
   */
  static fromHSL(h: number, s: number, l: number, a = 1): Color {
    return Color.create().setFromHSL(h, s, l, a);
  }

  /**
   * 通过Vector4创建颜色
   * @param v - Vector4对象
   * @returns 颜色
   */
  static fromVector4(v: Vector4Like): Color {
    return Color.create().setFromVector4(v);
  }

  /**
   * 颜色线性插值
   * @param a - 起始颜色
   * @param b - 目标颜色
   * @param t - 插值参数 [0, 1]
   * @returns 插值结果颜色
   */
  static lerp(a: Color, b: Color, t: number): Color {
    const result = Color.create();
    return result.copyFrom(a).lerp(b, t);
  }

  /**
   * 颜色相加
   * @param a - 第一个颜色
   * @param b - 第二个颜色
   * @returns 相加结果
   */
  static add(a: Color, b: Color): Color {
    const result = Color.create();
    return result.copyFrom(a).add(b);
  }

  /**
   * 颜色相减
   * @param a - 第一个颜色
   * @param b - 第二个颜色
   * @returns 相减结果
   */
  static subtract(a: Color, b: Color): Color {
    const result = Color.create();
    return result.copyFrom(a).subtract(b);
  }

  /**
   * 颜色相乘
   * @param a - 第一个颜色
   * @param b - 第二个颜色
   * @returns 相乘结果
   */
  static multiply(a: Color, b: Color): Color {
    const result = Color.create();
    return result.copyFrom(a).multiply(b);
  }

  /**
   * 检查颜色是否为有效值
   * @param c - 颜色
   * @returns 是否有效
   */
  static isValid(c: Color): boolean {
    return (
      !isNaN(c.r) &&
      !isNaN(c.g) &&
      !isNaN(c.b) &&
      !isNaN(c.a) &&
      isFinite(c.r) &&
      isFinite(c.g) &&
      isFinite(c.b) &&
      isFinite(c.a)
    );
  }

  /**
   * 颜色值从 Gamma 空间转到线性空间
   * @param v - Gamma 空间颜色值
   * @returns 线性空间颜色值
   */
  static gammaToLinear(v: number): number {
    if (v <= 0.0) {
      return 0.0;
    } else if (v <= 0.04045) {
      return v / 12.92;
    } else if (v < 1.0) {
      return Math.pow((v + 0.055) / 1.055, 2.4);
    } else {
      return Math.pow(v, 2.4);
    }
  }

  /**
   * 颜色值从线性空间转到 Gamma 空间
   * @param value - 线性空间颜色值
   * @returns Gamma 空间颜色值
   */
  static linearToGamma(value: number): number {
    if (value <= 0.0) {
      return 0.0;
    } else if (value < 0.0031308) {
      return 12.92 * value;
    } else if (value < 1.0) {
      return 1.055 * Math.pow(value, 0.41666) - 0.055;
    } else {
      return Math.pow(value, 0.41666);
    }
  }

  static ToHex(i: number): string {
    const str = i.toString(16);

    if (i <= 15) {
      return ('0' + str).toUpperCase();
    }

    return str.toUpperCase();
  }

  /**
   * 将颜色设置为HSL格式
   * @param h - 色相 (0-360)
   * @param s - 饱和度 (0-1)
   * @param l - 亮度 (0-1)
   * @param a - 透明度 (0-1)
   * @returns 修改后的颜色对象
   */
  setFromHSL(h: number, s: number, l: number, a = 1): this {
    const [r, g, b, alpha] = hslToRgb(h, s, l, a);

    return this.set(r, g, b, alpha);
  }

  /**
   * 转换为HSL颜色对象
   * @returns HSL颜色对象
   */
  toHSL(): HSLColor {
    return rgbToHsl(this.r, this.g, this.b, this.a);
  }
}

/**
 * 增加HSL颜色空间支持
 */
export interface HSLColor {
  h: number; // 色相 (0-360)
  s: number; // 饱和度 (0-1)
  l: number; // 亮度 (0-1)
  a: number; // 透明度 (0-1)
}

/**
 * 从HSL转换为RGB
 * @param h - 色相 (0-360)
 * @param s - 饱和度 (0-1)
 * @param l - 亮度 (0-1)
 * @param a - 透明度 (0-1)
 * @returns RGB颜色数组 [r, g, b, a]
 */
export function hslToRgb(h: number, s: number, l: number, a = 1): [number, number, number, number] {
  h = (((h % 360) + 360) % 360) / 360;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 1 / 6) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 2 / 6) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 3 / 6) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 4 / 6) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 5 / 6) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return [r + m, g + m, b + m, a];
}

/**
 * 从RGB转换为HSL
 * @param r - 红色 (0-1)
 * @param g - 绿色 (0-1)
 * @param b - 蓝色 (0-1)
 * @param a - 透明度 (0-1)
 * @returns HSL颜色对象
 */
export function rgbToHsl(r: number, g: number, b: number, a = 1): HSLColor {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;

    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else if (max === b) {
      h = (r - g) / d + 4;
    }

    h *= 60;
  }

  return { h, s, l, a };
}
