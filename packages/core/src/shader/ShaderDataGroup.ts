/**
 * 着色器数据组枚举，用于区分不同类型的着色器数据
 */
export enum ShaderDataGroup {
  /** 着色器Uniform变量组 */
  Uniform = 0,
  /** 着色器顶点属性组 */
  Attribute = 1,
  /** 着色器宏定义组 */
  Macro = 2,
  /** 着色器材质属性组 */
  Material = 3,
  /** 着色器渲染状态组 */
  RenderState = 4,
  /** 着色器全局变量组 */
  Global = 5
}