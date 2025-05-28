# Maxellabs 3D引擎 - USD格式示例

本目录包含了基于OpenUSD标准的Maxellabs 3D引擎示例文件，展示了引擎的各种功能和特性。

## 📁 示例文件

### 🔺 基础几何体
- **`triangle.usda`** - 基础三角形几何体示例
  - 标准USD Mesh格式
  - PBR材质系统
  - 动画和交互配置
  - 物理属性设置

### 🎨 设计系统
- **`design.usda`** - 完整的UI设计系统示例
  - 统一的颜色系统和字体系统
  - 组件库（按钮、卡片、输入框、模态框）
  - 图标库和样式库
  - 主题系统（明亮/暗黑主题）
  - 布局系统（网格、弹性盒、堆栈）
  - 动画和微交互
  - 无障碍和响应式设计

### 📝 文本渲染
- **`text.usda`** - 3D文本渲染系统示例
  - 基础3D文本（标题、副标题）
  - 文本效果（发光、轮廓、渐变）
  - 动画文本（打字机效果、波浪动画）
  - 富文本支持（粗体、斜体、下划线、链接）
  - 路径文本（曲线文本）
  - 交互式文本
  - 多种材质和光照效果

### 🎮 精灵动画
- **`sprites.usda`** - 2D精灵动画系统示例
  - 角色动画（玩家、敌人）
  - 图集管理和帧动画
  - 特效精灵（爆炸、道具）
  - UI精灵（血条、按钮）
  - 平铺精灵（背景、平台）
  - 九宫格拉伸
  - 状态机和AI行为

### ✨ 粒子系统
- **`particles.usda`** - 火焰粒子系统示例
  - GPU粒子计算
  - 生命周期管理
  - 纹理动画
  - 物理模拟
  - 音频集成

### 📊 数据可视化
- **`chart.usda`** - 3D柱状图表示例
  - 数据驱动的几何体生成
  - 交互式图表
  - 动画过渡
  - 坐标轴和图例

### 🌍 完整场景
- **`scene.usda`** - 综合场景示例
  - 整合所有功能模块
  - 完整的光照系统
  - 相机控制
  - 后处理效果
  - 音频和物理系统

## 🔧 统一规范特性

### 基础类型系统
所有示例都基于统一的基础类型系统（`packages/specification/src/core/common.ts`）：

- **统一的混合模式** - `BlendMode` 枚举涵盖所有渲染需求
- **标准化变换** - `Transform` 接口支持位置、旋转、缩放
- **统一颜色系统** - `Color` 接口支持RGBA和HSL
- **动画属性** - `AnimationProperties` 统一动画配置
- **交互属性** - `InteractionProperties` 统一交互行为
- **材质属性** - `MaterialProperties` 统一材质配置
- **性能配置** - `PerformanceConfig` 统一性能设置

### USD标准兼容
- 基于OpenUSD 1.0标准
- 使用标准USD数据类型（`point3f`, `color4f`, `matrix4d`等）
- 支持USD组合弧（references, payloads, variants）
- 标准USD几何体类型（Mesh, Points, Curves等）

### Maxellabs扩展
- 使用 `maxellabs:` 命名空间前缀
- 层次化属性命名约定
- 跨模块一致的配置格式
- 引擎特定的优化和功能

## 🚀 使用方式

### 1. 直接加载
```typescript
import { UsdStage } from '@maxellabs/usd';

// 加载三角形示例
const stage = UsdStage.open('./triangle.usda');
const triangle = stage.getPrimAtPath('/Triangle');

// 加载设计系统
const designStage = UsdStage.open('./design.usda');
const designSystem = designStage.getPrimAtPath('/DesignSystem');
```

### 2. 引用组合
```usda
#usda 1.0

def Scope "MyScene"
{
    def "Triangle" (
        references = @./triangle.usda@</Triangle>
    )
    {
        double3 xformOp:translate = (0, 0, 0)
    }
    
    def "Particles" (
        references = @./particles.usda@</ParticleSystem>
    )
    {
        double3 xformOp:translate = (5, 0, 0)
    }
}
```

### 3. 变体选择
```usda
def "MyTriangle" (
    references = @./triangle.usda@</Triangle>
)
{
    variantSet "material" = {
        "metal" {
            rel material:binding = </Materials/MetalMaterial>
        }
        "glass" {
            rel material:binding = </Materials/GlassMaterial>
        }
    }
}
```

## 🛠 工具支持

### USD工具链
- **usdview** - 查看和检查USD文件
- **usdcat** - 转换和合并USD文件
- **usdchecker** - 验证USD文件格式

### Maxellabs工具
- **引擎加载器** - 直接加载USD文件到引擎
- **材质编辑器** - 可视化编辑材质属性
- **动画编辑器** - 编辑动画时间线
- **场景编辑器** - 组合和布局场景元素

## 📋 最佳实践

### 1. 命名约定
- 使用PascalCase命名Prim
- 使用camelCase命名属性
- 使用 `maxellabs:` 前缀扩展属性

### 2. 文件组织
- 将复杂场景拆分为多个文件
- 使用references组合资产
- 保持文件大小合理（< 10MB）

### 3. 性能优化
- 使用适当的细节层次（LOD）
- 启用实例化渲染
- 合理设置渲染顺序

### 4. 版本控制
- 使用语义化版本号
- 记录重要变更
- 保持向后兼容性

## 🔄 迁移指南

### 从JSON格式迁移
旧的JSON格式示例已被废弃，请使用新的USD格式：

```typescript
// 旧方式 (已废弃)
const triangleData = await fetch('./tri.json').then(r => r.json());

// 新方式 (推荐)
const stage = UsdStage.open('./triangle.usda');
const triangle = stage.getPrimAtPath('/Triangle');
```

### 更新材质系统
```typescript
// 旧方式 - 多种混合模式定义
BlendingMode.Normal
BlendMode.Multiply  
DesignBlendMode.Screen

// 新方式 - 统一混合模式
import { BlendMode } from '@maxellabs/specification/core/common';
BlendMode.Normal
BlendMode.Multiply
BlendMode.Screen
```

## 📚 相关文档

- [OpenUSD官方文档](https://openusd.org/release/index.html)
- [Maxellabs引擎文档](../../../docs/)
- [USD格式规范](https://openusd.org/release/spec_usd.html)
- [材质系统指南](../src/rendering/)
- [动画系统指南](../src/animation/)

## 🤝 贡献指南

1. 遵循USD标准和Maxellabs编码规范
2. 添加完整的文档和注释
3. 包含性能和兼容性测试
4. 更新相关示例和文档

## 📄 许可证

本示例文件遵循Maxellabs 3D引擎的许可证条款。 