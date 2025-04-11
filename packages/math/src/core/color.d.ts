import type { ColorDataType, ColorLike, Vector4Like, vec4 } from './type';
import { Vector4 } from './vector4';
export declare class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    /**
     * 颜色的常量
     */
    static readonly BLACK: Color;
    static readonly BLUE: Color;
    static readonly CLEAR: Color;
    static readonly CYAN: Color;
    static readonly GRAY: Color;
    static readonly GREEN: Color;
    static readonly MAGENTA: Color;
    static readonly RED: Color;
    static readonly WHITE: Color;
    static readonly YELLOW: Color;
    /**
     * 构造函数，默认值为黑色
     * @param [r=0]
     * @param [g=0]
     * @param [b=0]
     * @param [a=0]
     */
    constructor(r?: number, g?: number, b?: number, a?: number);
    /**
     * 设置颜色
     * @param r - r 分量
     * @param g - g 分量
     * @param b - b 分量
     * @param a - a 分量
     * @returns
     */
    set(r: number, g: number, b: number, a: number): this;
    /**
     * 设置零颜色
     * @returns
     */
    setZero(): this;
    /**
     * 通过标量数值设置颜色
     * @param num - 数值
     * @returns
     */
    setFromNumber(num: number): this;
    /**
     * 通过Vector4创建颜色
     * @param v - Vector4
     * @returns
     */
    setFromVector4(v: Vector4Like): this;
    /**
     * 通过数组创建颜色
     * @param array - 数组
     * @param [offset=0] - 起始偏移值
     * @returns
     */
    setFromArray(array: ColorDataType, offset?: number): this;
    setFromHSV(hue: number, saturation: number, value: number, alpha?: number): this;
    setFromHexString(hex: string): this;
    /**
     * 拷贝颜色
     * @param v - 复制对象
     * @returns 拷贝结果
     */
    copyFrom(v: ColorLike): this;
    /**
     * 克隆颜色
     * @returns 克隆结果
     */
    clone(): Color;
    /**
     * 根据下标设置颜色分量
     * @param index - 下标值
     * @param value - 分量值
     * @returns
     */
    setElement(index: number, value: number): this;
    /**
     * 根据下标获取颜色分量
     * @param index - 下标
     * @returns 分量值
     */
    getElement(index: number): number;
    /**
     * 颜色相加
     * @param right - 相加对象，颜色 | 数字
     * @returns 相加结果
     */
    add(right: number | vec4 | Color): this;
    /**
     * 颜色相减
     * @param right - 相减对象，颜色 | 数字
     * @returns 相减结果
     */
    subtract(right: number | vec4 | Color): this;
    /**
     * 颜色相乘
     * @param right - 相乘对象，对象 | 数字
     * @returns 颜色
     */
    multiply(right: number | vec4 | Color): this;
    /**
     * 颜色相除
     * @param right - 相除对象，对象 | 数字
     * @returns 颜色
     */
    divide(right: number | vec4 | Color): this;
    /**
     * 颜色缩放
     * @param v - 数字
     * @returns 缩放结果
     */
    scale(v: number): this;
    /**
     * 颜色求最小值
     * @param v - 颜色或数值
     * @returns 最小值
     */
    min(v: Color | number): this;
    /**
     * 颜色求最大值
     * @param v - 颜色或数值
     * @returns 最大值
     */
    max(v: Color | number): this;
    /**
     * 颜色阈值约束
     * @param min - 最小值
     * @param max - 最大值
     * @returns 颜色
     */
    clamp(min: Color | number, max: Color | number): this;
    /**
     * 颜色求线性插值
     * @param v - 颜色
     * @param alpha - 插值比例
     * @returns 插值结果
     */
    lerp(v: Color, alpha: number): this;
    /**
     * 计算颜色亮度值
     * @returns 亮度值
     */
    luminance(): number;
    /**
     * 颜色判等
     * @param v - 颜色
     * @returns 判等结果
     */
    equals(v: Color): boolean;
    toLinear(): this;
    toGamma(): this;
    /**
     * 颜色转数组
     * @returns 数组
     */
    toArray(): [r: number, g: number, b: number, b: number];
    toVector4(): Vector4;
    /**
     * RGB 颜色空间转 HSV
     * @param result HSV 值
     */
    toHSV(): Color;
    toHexString(includeAlpha?: boolean): string;
    fill(array: number[] | Float32Array, offset?: number): void;
    /**
     * 通过标量数值创建颜色
     * @param num - 数值
     * @returns
     */
    static fromNumber(num: number): Color;
    /**
     * 通过数组创建颜色
     * @param array - 数组
     * @param [offset=0] - 起始偏移值
     * @returns
     */
    static fromArray(array: ColorDataType, offset?: number): Color;
    /**
     * 通过 hex 字符串创建颜色
     * @param hex - hex 字符串
     * @returns
     */
    static fromHexString(hex: string): Color;
    static fromHSV(hue: number, saturation: number, value: number, alpha?: number): Color;
    /**
     * 颜色值从 Gamma 空间转到线性空间
     * @param v - Gamma 空间颜色值
     * @returns 线性空间颜色值
     */
    static gammaToLinear(v: number): number;
    /**
     * 颜色值从线性空间转到 Gamma 空间
     * @param value - 线性空间颜色值
     * @returns Gamma 空间颜色值
     */
    static linearToGamma(value: number): number;
    static ToHex(i: number): string;
}
