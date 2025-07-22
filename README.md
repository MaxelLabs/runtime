<div align="center"><a name="readme-top"></a>

<h1>Sruim Runtime</h1>

[Changelog](./CHANGELOG.md) · [Report Bug][github-issues-url] · [Request Feature][github-issues-url] · English · [中文](./README-zh_CN.md)

![](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

graph TD
subgraph 改进后的架构
SPEC[specification<br/>纯接口定义]
MATH[math<br/>数学实现]
CORE[core<br/>引擎核心抽象]
RHI[rhi<br/>渲染硬件接口]
ENGINE[engine<br/>引擎集成]

        SPEC --> MATH
        SPEC --> CORE
        MATH --> CORE
        MATH --> RHI
        CORE --> RHI
        CORE --> ENGINE
        RHI --> ENGINE
    end
