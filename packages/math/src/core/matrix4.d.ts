import { Vector3 } from './vector3';
import type { Vector4 } from './vector4';
import type { Euler } from './euler';
import type { Matrix3 } from './matrix3';
import { Quaternion } from './quaternion';
import type { Matrix4DataType, mat4 } from './type';
/**
 * 四阶矩阵（列优先矩阵）
 */
export declare class Matrix4 {
    static readonly IDENTITY: Matrix4;
    static readonly ZERO: Matrix4;
    private static readonly tempVec0;
    private static readonly tempVec1;
    private static readonly tempVec2;
    private static readonly tempMat0;
    /**
     * 矩阵值数组
     */
    elements: number[];
    /**
     * 构造函数，初始值为单位矩阵
     * @param [m11=1] - 第 1 行，第 1 列
     * @param [m21=0] - 第 2 行，第 1 列
     * @param [m31=0] - 第 3 行，第 1 列
     * @param [m41=0] - 第 4 行，第 1 列
     * @param [m12=0] - 第 1 行，第 2 列
     * @param [m22=1] - 第 2 行，第 2 列
     * @param [m32=0] - 第 3 行，第 2 列
     * @param [m42=0] - 第 4 行，第 2 列
     * @param [m13=0] - 第 1 行，第 3 列
     * @param [m23=0] - 第 2 行，第 3 列
     * @param [m33=1] - 第 3 行，第 3 列
     * @param [m43=0] - 第 4 行，第 3 列
     * @param [m14=0] - 第 1 行，第 4 列
     * @param [m24=0] - 第 2 行，第 4 列
     * @param [m34=0] - 第 3 行，第 4 列
     * @param [m44=1] - 第 4 行，第 4 列
     */
    constructor(m11?: number, m21?: number, m31?: number, m41?: number, m12?: number, m22?: number, m32?: number, m42?: number, m13?: number, m23?: number, m33?: number, m43?: number, m14?: number, m24?: number, m34?: number, m44?: number);
    /**
     * 设置矩阵
     * @param m11 - 第 1 行，第 1 列
     * @param m21 - 第 2 行，第 1 列
     * @param m31 - 第 3 行，第 1 列
     * @param m41 - 第 4 行，第 1 列
     * @param m12 - 第 1 行，第 2 列
     * @param m22 - 第 2 行，第 2 列
     * @param m32 - 第 3 行，第 2 列
     * @param m42 - 第 4 行，第 2 列
     * @param m13 - 第 1 行，第 3 列
     * @param m23 - 第 2 行，第 3 列
     * @param m33 - 第 3 行，第 3 列
     * @param m43 - 第 4 行，第 3 列
     * @param m14 - 第 1 行，第 4 列
     * @param m24 - 第 2 行，第 4 列
     * @param m34 - 第 3 行，第 4 列
     * @param m44 - 第 4 行，第 4 列
     * @returns 矩阵
     */
    set(m11: number, m21: number, m31: number, m41: number, m12: number, m22: number, m32: number, m42: number, m13: number, m23: number, m33: number, m43: number, m14: number, m24: number, m34: number, m44: number): this;
    /**
     * 通过行优先数据设置矩阵
     * @param m11 - 第 1 行，第 1 列
     * @param m12 - 第 1 行，第 2 列
     * @param m13 - 第 1 行，第 3 列
     * @param m14 - 第 1 行，第 4 列
     * @param m21 - 第 2 行，第 1 列
     * @param m22 - 第 2 行，第 2 列
     * @param m23 - 第 2 行，第 3 列
     * @param m24 - 第 2 行，第 4 列
     * @param m31 - 第 3 行，第 1 列
     * @param m32 - 第 3 行，第 2 列
     * @param m33 - 第 3 行，第 3 列
     * @param m34 - 第 3 行，第 4 列
     * @param m41 - 第 4 行，第 1 列
     * @param m42 - 第 4 行，第 2 列
     * @param m43 - 第 4 行，第 3 列
     * @param m44 - 第 4 行，第 4 列
     * @returns 矩阵
     */
    setFromRowMajorData(m11: number, m12: number, m13: number, m14: number, m21: number, m22: number, m23: number, m24: number, m31: number, m32: number, m33: number, m34: number, m41: number, m42: number, m43: number, m44: number): this;
    /**
     * 通过四个列向量设置矩阵
     * @param c1 - 第一列
     * @param c2 - 第二列
     * @param c3 - 第三列
     * @param c4 - 第四列
     * @returns 矩阵
     */
    setFromColumnVectors(c1: Vector4, c2: Vector4, c3: Vector4, c4: Vector4): this;
    /**
     * 通过三维矩阵设置矩阵
     * @param m - 三维矩阵
     * @returns 设置结果
     */
    setFromMatrix3(m: Matrix3): this;
    /**
     * 通过数组设置矩阵
     * @param array - 数组
     * @param [offset=0] - 起始偏移值
     * @returns 矩阵
     */
    setFromArray(array: Matrix4DataType, offset?: number): this;
    /**
     * 通过缩放设置矩阵
     * @param x - x 方向缩放
     * @param y - y 方向缩放
     * @param z - z 方向缩放
     * @returns 缩放矩阵
     */
    setFromScale(x: number, y: number, z: number): this;
    /**
     * 通过平移设置矩阵
     * @param x - x 方向平移
     * @param y - y 方向平移
     * @param z - z 方向平移
     * @returns 平移矩阵
     */
    setFromTranslation(x: number, y: number, z: number): this;
    /**
     * 通过 x 轴旋转角度设置矩阵
     * @param theta - x 轴旋转弧度
     * @returns 矩阵
     */
    setFromRotationX(theta: number): this;
    /**
     * 通过 y 轴旋转角度设置矩阵
     * @param theta - y 轴旋转弧度
     * @returns 矩阵
     */
    setFromRotationY(theta: number): this;
    /**
     * 通过 z 轴旋转角度设置矩阵
     * @param theta - z 轴旋转弧度
     * @returns 矩阵
     */
    setFromRotationZ(theta: number): this;
    /**
     * 根据三维旋转轴与弧度设置矩阵
     * @param axis - 三维旋转轴
     * @param angle - 旋转弧度
     * @returns 矩阵
     */
    setFromRotationAxis(axis: Vector3, angle: number): this;
    /**
     * 通过欧拉角设置矩阵
     * @param euler - 欧拉角
     * @returns 矩阵
     */
    setFromEuler(euler: Euler): this;
    /**
     * 通过四元数设置矩阵
     * @param quat - 四元数
     * @returns 矩阵
     */
    setFromQuaternion(quat: Quaternion): Matrix4;
    /**
     * 通过倾斜参数设置矩阵
     * @param x - x 方向倾斜分量
     * @param y - y 方向倾斜分量
     * @param z - z 方向倾斜分量
     * @returns 倾斜矩阵
     */
    setFromShear(x: number, y: number, z: number): this;
    /**
     * 通过基轴设置矩阵
     * @param xAxis - x 轴
     * @param yAxis - y 轴
     * @param zAxis - z 轴
     * @returns 倾斜矩阵
     */
    setFromBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): this;
    /**
     * 矩阵清零
     * @returns 零矩阵
     */
    setZero(): this;
    /**
     * 矩阵单位化
     * @returns 单位矩阵
     */
    identity(): this;
    /**
     * 单位阵判断
     * @returns 判断结果
     */
    isIdentity(): boolean;
    /**
     * 矩阵克隆
     * @returns 克隆结果
     */
    clone(): Matrix4;
    /**
     * 矩阵复制
     * @param m - 复制对象
     * @returns 复制结果
     */
    copyFrom(m: Matrix4): this;
    /**
     * 得到列向量
     * @param i - 列向量索引，从 0 开始
     * @param v
     * @returns 矩阵
     */
    getColumnVector(i: number, v: Vector4): Vector4;
    /**
     * 设置相机矩阵
     * @param eye - 相机位置
     * @param target - 目标位置
     * @param up - 相机方向
     * @returns 矩阵
     */
    lookAt(eye: Vector3, target: Vector3, up: Vector3): this;
    /**
     * 矩阵乘比例后相加
     * @param right - 矩阵
     * @param s - 比例
     * @returns 相加结果
     */
    addScaledMatrix(right: Matrix4, s: number): this;
    /**
     * 矩阵右乘
     * @param right - 右侧矩阵或数值
     * @returns 右乘结果
     */
    multiply(right: Matrix4 | number): this;
    /**
     * 矩阵左乘
     * @param left - 左侧矩阵
     * @returns 左乘结果
     */
    premultiply(left: Matrix4): this;
    /**
     * 矩阵相乘
     * @param left - 矩阵
     * @param right - 矩阵
     * @returns 相乘结果
     */
    multiplyMatrices(left: Matrix4, right: Matrix4): this;
    /**
     * 矩阵缩放
     * @param s - 缩放比例
     * @returns 缩放结果
     */
    multiplyScalar(s: number): this;
    /**
     * 矩阵求行列式值
     * @returns 行列式值
     */
    determinant(): number;
    /**
     * 矩阵转置
     * @returns 转置结果
     */
    transpose(): this;
    /**
     * 矩阵求逆
     * @returns 逆矩阵
     */
    invert(): this;
    /**
     * 提取基轴
     * @param xAxis - 提取的 x 轴
     * @param yAxis - 提取的 y 轴
     * @param zAxis - 提取的 z 轴
     * @returns
     */
    extractBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): this;
    /**
     * 根据基础信息组装矩阵
     * @param translation - 位置信息
     * @param rotation - 旋转信息
     * @param scale - 缩放信息
     * @param [anchor] - 锚点信息
     * @returns 矩阵
     */
    compose(translation: Vector3, rotation: Quaternion, scale: Vector3, anchor?: Vector3): Matrix4;
    /**
     * 矩阵拆分为基础信息
     * @param translation - 位置信息
     * @param rotation - 旋转信息
     * @param scale - 缩放信息
     * @returns 矩阵
     */
    decompose(translation: Vector3, rotation: Quaternion, scale: Vector3): this;
    getTranslation(translation: Vector3): Vector3;
    getScale(scale: Vector3): Vector3;
    /**
     * 获得矩阵分解的结果
     * @returns 分解的结果
     */
    getTransform(): {
        translation: Vector3;
        rotation: Quaternion;
        scale: Vector3;
    };
    /**
     * 根据视窗信息设置正交相机投影矩阵
     * @param left - 视窗左平面位置
     * @param right - 视窗右平面位置
     * @param top - 视窗上平面位置
     * @param bottom - 视窗下平面位置
     * @param near - 视窗近平面位置
     * @param far - 视窗远平面位置
     * @returns 矩阵
     */
    orthographic(left: number, right: number, top: number, bottom: number, near: number, far: number): this;
    /**
     * 通过透视相机基础参数设置投影矩阵
     * @param fov - 视角(弧度)
     * @param aspect - 视窗比例
     * @param near - 近平面
     * @param far - 远平面
     * @param [reverse] - 视锥体长宽反转(3D这里反了？)
     * @returns 投影矩阵
     */
    perspective(fov: number, aspect: number, near: number, far: number, reverse?: boolean): Matrix4;
    /**
     * 对点进行投影变换
     * @param v - 输入点
     * @param [out] - 输出点，如果没有就覆盖输入的数据
     * @returns 投影后的点
     */
    projectPoint(v: Vector3, out?: Vector3): Vector3;
    /**
     * 对点进行矩阵变换
     * @param v - 输入点
     * @param [out] - 输出点，如果没有就覆盖输入的数据
     * @returns 变换后的点
     */
    transformPoint(v: Vector3, out?: Vector3): Vector3;
    /**
     * 对法向量进行矩阵变换
     * @param v - 输入法向量
     * @param [out] - 输出法向量，如果没有就覆盖输入的数据
     * @returns 变换后的法向量
     */
    transformNormal(v: Vector3, out?: Vector3): Vector3;
    /**
     * 对四维向量进行矩阵变换
     * @param v - 输入向量
     * @param [out] - 输出向量，如果没有就覆盖输入的数据
     * @returns 变换后向量
     */
    transformVector4(v: Vector4, out?: Vector4): Vector4;
    /**
     * 矩阵判等
     * @param matrix - 矩阵
     * @returns 判等结果
     */
    equals(matrix: Matrix4): boolean;
    /**
     * 矩阵转数组
     * @returns
     */
    toArray(): mat4;
    fill(array: number[] | Float32Array, offset?: number): void;
    /**
     * 创建单位阵
     * @returns 单位矩阵
     */
    static fromIdentity(): Matrix4;
    /**
     * 创建相机矩阵
     * @param eye - 相机位置
     * @param target - 目标位置
     * @param up - 相机方向
     * @returns 矩阵
     */
    static fromLookAt(eye: Vector3, target: Vector3, up: Vector3): Matrix4;
    /**
     * 创建投影矩阵
     * @param fov - 视角
     * @param aspect - 视窗比例
     * @param near - 近平面
     * @param far - 远平面
     * @param [reverse] - 视锥体长宽反转
     * @returns 投影矩阵
     */
    static fromPerspective(fov: number, aspect: number, near: number, far: number, reverse?: boolean): Matrix4;
    /**
     * 通过四个列向量创建矩阵
     * @param c1 - 第一列
     * @param c2 - 第二列
     * @param c3 - 第三列
     * @param c4 - 第四列
     * @returns
     */
    static fromColumnVectors(c1: Vector4, c2: Vector4, c3: Vector4, c4: Vector4): Matrix4;
    /**
     * 通过三阶矩阵创建矩阵
     * @param m - 三阶矩阵
     * @returns 创建的矩阵
     */
    static fromMatrix3(m: Matrix3): Matrix4;
    /**
     * 通过数组创建矩阵
     * @param array - 数组
     * @param [offset=0] - 起始偏移值
     * @returns 矩阵
     */
    static fromArray(array: Matrix4DataType, offset?: number): Matrix4;
    /**
     * 通过缩放创建矩阵
     * @param x - x 缩放
     * @param y - y 缩放
     * @param z - z 缩放
     * @returns 缩放结果
     */
    static fromScale(x: number, y: number, z: number): Matrix4;
    /**
     * 通过平移创建矩阵
     * @param x - x 平移
     * @param y - y 平移
     * @param z - z 平移
     * @returns 平移结果
     */
    static fromTranslation(x: number, y: number, z: number): Matrix4;
    /**
     * 通过 x 轴旋转创建矩阵
     * @param theta - x 轴旋转弧度
     * @returns 矩阵
     */
    static fromRotationX(theta: number): Matrix4;
    /**
     * 通过 y 轴旋转创建矩阵
     * @param theta - y 轴旋转弧度
     * @returns 矩阵
     */
    static fromRotationY(theta: number): Matrix4;
    /**
     * 通过 z 轴旋转创建矩阵
     * @param theta - z 轴旋转弧度
     * @returns
     */
    static fromRotationZ(theta: number): Matrix4;
    /**
     * 通过旋转轴与旋转弧度创建矩阵
     * @param axis - 旋转轴
     * @param angle - 旋转弧度
     * @returns
     */
    static fromRotationAxis(axis: Vector3, angle: number): Matrix4;
    /**
     * 通过欧拉角创建矩阵
     * @param euler - 欧拉角
     * @returns
     */
    static fromEuler(euler: Euler): Matrix4;
    /**
     * 通过四元数创建矩阵
     * @param quat - 四元数
     * @returns
     */
    static fromQuaternion(quat: Quaternion): Matrix4;
    /**
     * 通过倾斜创建矩阵
     * @param x - x 方向倾斜分量
     * @param y - y 方向倾斜分量
     * @param z - z 方向倾斜分量
     * @returns 倾斜矩阵
     */
    static fromShear(x: number, y: number, z: number): Matrix4;
    /**
     * 通过基轴创建矩阵
     * @param xAxis - x 轴
     * @param yAxis - y 轴
     * @param zAxis - z 轴
     * @returns
     */
    static fromBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): Matrix4;
    /**
     * 通过行优先数据设置矩阵
     * @param m11 - 第 1 行，第 1 列
     * @param m12 - 第 1 行，第 2 列
     * @param m13 - 第 1 行，第 3 列
     * @param m14 - 第 1 行，第 4 列
     * @param m21 - 第 2 行，第 1 列
     * @param m22 - 第 2 行，第 2 列
     * @param m23 - 第 2 行，第 3 列
     * @param m24 - 第 2 行，第 4 列
     * @param m31 - 第 3 行，第 1 列
     * @param m32 - 第 3 行，第 2 列
     * @param m33 - 第 3 行，第 3 列
     * @param m34 - 第 3 行，第 4 列
     * @param m41 - 第 4 行，第 1 列
     * @param m42 - 第 4 行，第 2 列
     * @param m43 - 第 4 行，第 3 列
     * @param m44 - 第 4 行，第 4 列
     * @returns
     */
    static fromRowMajorData(m11: number, m12: number, m13: number, m14: number, m21: number, m22: number, m23: number, m24: number, m31: number, m32: number, m33: number, m34: number, m41: number, m42: number, m43: number, m44: number): Matrix4;
}
