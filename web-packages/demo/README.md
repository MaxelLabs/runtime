# WebGL性能基准测试

这个测试套件用于评估WebGL渲染接口(RHI)的性能表现。套件包含对缓冲区、着色器、纹理和渲染器核心操作的基准测试。

## 功能特点

- 缓冲区性能测试（创建、更新、绑定等）
- 着色器性能测试（编译、链接、设置uniform等）
- 纹理性能测试（创建、更新、绑定等）
- 渲染器状态管理性能测试（清除、视口、状态切换等）
- 支持浏览器和命令行环境（浏览器推荐）
- 详细的性能指标报告

## 安装

本项目是pnpm工作空间的一部分，安装依赖前请确保已安装pnpm：

```bash
# 在项目根目录执行
pnpm install
```

## 使用方法

### 浏览器环境（推荐）

浏览器环境提供完整的WebGL支持和可视化结果显示：

```bash
# 启动浏览器测试
cd web-packages/test
pnpm run test:browser
```

这将在浏览器中打开测试界面，点击"开始测试"按钮运行所有测试。

### 命令行环境

命令行环境主要用于自动化测试，但由于WebGL依赖于浏览器环境，功能可能受限：

```bash
# 运行命令行测试
cd web-packages/test
pnpm run test
```

## 测试项目说明

### 缓冲区测试
- 创建不同大小的顶点缓冲区（4KB、256KB、4MB）
- 数据更新性能
- 缓冲区绑定/解绑性能
- 索引缓冲区创建性能

### 着色器测试
- 基础着色器编译性能
- 复杂PBR着色器编译性能
- 着色器绑定/解绑性能
- 设置uniform性能

### 纹理测试
- 创建不同大小的纹理（256x256、1024x1024）
- 纹理数据更新性能
- 纹理绑定/解绑性能
- Mipmap生成性能

### 渲染器测试
- 清除屏幕性能
- 视口设置性能
- 渲染状态切换性能（深度测试、混合、面剔除等）

## 如何添加新测试

在 `src/webgl-benchmark/tests/` 目录下创建新的测试文件，并按照以下格式添加测试用例：

```js
export const myTests = [
  {
    name: '测试名称',
    iterations: 100,  // 执行次数
    setup: (renderer) => {
      // 测试前的准备工作
    },
    execute: (renderer) => {
      // 实际测试的操作（这部分将被计时）
    },
    teardown: () => {
      // 测试后的清理工作
    }
  }
];
```

然后在 `src/webgl-benchmark/tests/index.js` 文件中导入并添加到测试列表中。

## 许可证

MIT 