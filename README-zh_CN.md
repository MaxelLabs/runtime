<div align="center"><a name="readme-top"></a>

<h1>Sruim Runtime</h1>

![GitHub release (with filter)](https://img.shields.io/github/v/release/galacean/effects-runtime)
![GitHub License](https://img.shields.io/github/license/galacean/effects-runtime)
![GitHub top language](https://img.shields.io/github/languages/top/galacean/effects-runtime)

[更新日志](./CHANGELOG-zh_CN.md) · [报告问题][github-issues-url] · [特性需求][github-issues-url] · [English](./README.md) · 中文

![](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

packages/
  ├── specification/          # 数据规范和接口定义
  ├── math/                   # 共享数学库
  ├── core/                   # 核心实体组件系统
  ├── rhi/                    # 渲染硬件接口抽象
  ├── renderer/               # 统一渲染管线
  ├── scene/                  # 场景管理
  ├── resources/              # 资源加载和管理
  ├── ui/                     # 用户界面系统
  ├── animation/              # 动画系统
  ├── data-binding/           # 数据绑定系统

domain-packages/              # 领域特化包
  ├── game/                   # 游戏引擎特化功能
  ├── effects/                # 动效引擎特化功能
  ├── visualization/          # 数据可视化特化功能
  ├── design/                 # 设计工具特化功能

integration-packages/         # 集成层包
  ├── game-compat/            # 游戏引擎兼容层
  ├── antv-compat/            # AntV兼容层
  ├── figma-compat/           # Figma兼容层

application-packages/         # 应用层包
  ├── editor/                 # 统一编辑器
  ├── player/                 # 内容播放器
  ├── exporter/               # 导出工具