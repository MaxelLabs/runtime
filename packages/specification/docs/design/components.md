## 设计组件定义

### 接口总览

| 名称                     | 泛型参数 | 简要描述                                 |
| ------------------------ | -------- | ---------------------------------------- |
| `DesignComponent`        | -        | 设计组件定义，包含属性、变体和状态管理   |
| `ComponentState`         | -        | 组件状态定义，支持多状态切换和动画过渡   |
| `ComponentStateType`     | -        | 组件状态类型枚举，9种标准交互状态        |
| `ComponentTransition`    | -        | 状态转换配置，定义状态间的触发条件和动画 |
| `DesignComponentLibrary` | -        | 组件库管理，包含组件集合和分类体系       |
| `ComponentCategory`      | -        | 组件分类定义，支持层级分类和图标配置     |
| `ComponentLibraryConfig` | -        | 组件库配置，包含构建、开发和文档设置     |
| `NamingConvention`       | -        | 命名约定枚举，4种代码命名规范            |
| `BuildConfig`            | -        | 构建配置，定义输出格式和目标环境         |
| `OutputFormat`           | -        | 输出格式枚举，8种组件导出格式            |
| `ComponentUsageStats`    | -        | 组件使用统计，追踪组件在项目中的使用情况 |
| `ComponentUsageContext`  | -        | 使用场景定义，记录组件在不同上下文的使用 |
| `ContextType`            | -        | 场景类型枚举，5种使用场景分类            |

### 枚举总览

| 枚举名               | 成员        | 语义         | 适用场景               |
| -------------------- | ----------- | ------------ | ---------------------- |
| `ComponentStateType` | 9种状态类型 | 交互状态定义 | 组件状态管理、交互设计 |
| `NamingConvention`   | 4种命名规范 | 代码风格约定 | 组件代码生成、命名统一 |
| `OutputFormat`       | 8种输出格式 | 组件导出格式 | 多框架支持、代码生成   |
| `ContextType`        | 5种场景类型 | 使用场景分类 | 使用统计、场景分析     |

### 核心接口详解

#### DesignComponent

**类型签名**

```tsx
interface DesignComponent {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  properties: DesignComponentProperty[];
  variants?: DesignComponentVariant[];
  masterInstance: DesignElement;
  animation?: AnimationProperties;
  interaction?: InteractionProperties;
  states?: ComponentState[];
  dependencies?: string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

**字段说明**

| 字段名           | 类型                        | 描述           | 默认值    | 异常描述             |
| ---------------- | --------------------------- | -------------- | --------- | -------------------- |
| `id`             | `string`                    | 组件唯一标识符 | -         | 必须符合UUID格式     |
| `name`           | `string`                    | 组件显示名称   | -         | 不能为空字符串       |
| `description`    | `string`                    | 组件功能描述   | -         | 最大长度500字符      |
| `category`       | `string`                    | 组件分类标识   | -         | 必须匹配已定义分类   |
| `properties`     | `DesignComponentProperty[]` | 组件可配置属性 | -         | 至少包含一个属性     |
| `masterInstance` | `DesignElement`             | 组件主实例     | -         | 必须包含有效设计元素 |
| `states`         | `ComponentState[]`          | 交互状态定义   | `[]`      | 必须包含default状态  |
| `version`        | `string`                    | 组件版本号     | `"1.0.0"` | 遵循语义化版本规范   |

**关联类型**

- [`DesignComponentProperty`](./base.md#designcomponentproperty) - 组件属性定义
- [`DesignElement`](./elements.md#designelement) - 设计元素接口
- [`AnimationProperties`](../core/interfaces.md#animationproperties) - 动画配置
- [`InteractionProperties`](../core/interfaces.md#interactionproperties) - 交互配置

#### ComponentState

**类型签名**

```tsx
interface ComponentState {
  name: string;
  type: ComponentStateType;
  properties: Record<string, any>;
  transitions?: ComponentTransition[];
}
```

**字段说明**

| 字段名        | 类型                    | 描述         | 默认值 | 取值范围           |
| ------------- | ----------------------- | ------------ | ------ | ------------------ |
| `name`        | `string`                | 状态名称     | -      | 必须唯一           |
| `type`        | `ComponentStateType`    | 状态类型枚举 | -      | 见状态类型定义     |
| `properties`  | `Record<string, any>`   | 状态属性值   | `{}`   | 属性值必须匹配定义 |
| `transitions` | `ComponentTransition[]` | 状态转换规则 | `[]`   | 转换条件必须有效   |

#### DesignComponentLibrary

**类型签名**

```tsx
interface DesignComponentLibrary {
  name: string;
  version: string;
  components: Record<string, DesignComponent>;
  categories?: ComponentCategory[];
  config?: ComponentLibraryConfig;
  metadata?: CommonMetadata;
}
```

**字段说明**

| 字段名       | 类型                              | 描述     | 默认值 | 验证规则                 |
| ------------ | --------------------------------- | -------- | ------ | ------------------------ |
| `name`       | `string`                          | 库名称   | -      | 只允许字母、数字、连字符 |
| `version`    | `string`                          | 库版本   | -      | 符合语义化版本规范       |
| `components` | `Record<string, DesignComponent>` | 组件映射 | -      | 键必须与组件ID匹配       |
| `categories` | `ComponentCategory[]`             | 分类体系 | `[]`   | 分类ID必须唯一           |

### 枚举值详解

#### ComponentStateType

**枚举定义**

```tsx
enum ComponentStateType {
  Default = 'default',
  Hover = 'hover',
  Pressed = 'pressed',
  Focused = 'focused',
  Disabled = 'disabled',
  Selected = 'selected',
  Active = 'active',
  Loading = 'loading',
  Error = 'error',
}
```

**枚举值详情**

| 枚举值     | 字面量 | 对应字符串   | 使用场景 | 触发条件      |
| ---------- | ------ | ------------ | -------- | ------------- |
| `Default`  | `0`    | `'default'`  | 默认状态 | 初始状态      |
| `Hover`    | `1`    | `'hover'`    | 悬停状态 | 鼠标悬停      |
| `Pressed`  | `2`    | `'pressed'`  | 按下状态 | 鼠标/触摸按下 |
| `Focused`  | `3`    | `'focused'`  | 焦点状态 | 键盘导航      |
| `Disabled` | `4`    | `'disabled'` | 禁用状态 | 功能禁用      |
| `Selected` | `5`    | `'selected'` | 选中状态 | 用户选择      |
| `Active`   | `6`    | `'active'`   | 激活状态 | 当前操作      |
| `Loading`  | `7`    | `'loading'`  | 加载状态 | 数据加载中    |
| `Error`    | `8`    | `'error'`    | 错误状态 | 操作失败      |

#### OutputFormat

**枚举定义**

```tsx
enum OutputFormat {
  React = 'react',
  Vue = 'vue',
  Angular = 'angular',
  WebComponent = 'web-component',
  HTML = 'html',
  CSS = 'css',
  JSON = 'json',
}
```

**枚举值详情**

| 枚举值         | 字面量 | 对应字符串        | 目标框架       | 文件扩展名    |
| -------------- | ------ | ----------------- | -------------- | ------------- |
| `React`        | `0`    | `'react'`         | React框架      | `.tsx` `.jsx` |
| `Vue`          | `1`    | `'vue'`           | Vue框架        | `.vue`        |
| `Angular`      | `2`    | `'angular'`       | Angular框架    | `.ts` `.html` |
| `WebComponent` | `3`    | `'web-component'` | Web Components | `.js` `.css`  |
| `HTML`         | `4`    | `'html'`          | 纯HTML         | `.html`       |
| `CSS`          | `5`    | `'css'`           | 样式文件       | `.css`        |
| `JSON`         | `6`    | `'json'`          | 配置文件       | `.json`       |

### 使用示例

#### 最小可运行片段

```tsx
import type { DesignComponent, ComponentStateType } from '@maxellabs/specification/design';

// 基础按钮组件定义
const buttonComponent: DesignComponent = {
  id: 'button-primary',
  name: 'Primary Button',
  category: 'inputs',
  properties: [
    { name: 'label', type: 'string', defaultValue: 'Button' },
    { name: 'disabled', type: 'boolean', defaultValue: false },
  ],
  masterInstance: {
    id: 'button-master',
    type: 'button',
    bounds: { x: 0, y: 0, width: 120, height: 40 },
  },
};
```

#### 常见业务封装

```tsx
// 创建标准化按钮组件
function createButtonComponent(id: string, variant: string): DesignComponent {
  return {
    id,
    name: `${variant} Button`,
    category: 'inputs',
    tags: ['button', 'interactive'],
    properties: [
      { name: 'label', type: 'string', defaultValue: 'Click me' },
      { name: 'variant', type: 'enum', options: ['primary', 'secondary', 'danger'], defaultValue: variant },
      { name: 'size', type: 'enum', options: ['small', 'medium', 'large'], defaultValue: 'medium' },
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'loading', type: 'boolean', defaultValue: false },
    ],
    states: [
      {
        name: 'default',
        type: ComponentStateType.Default,
        properties: { backgroundColor: '#007bff', color: '#ffffff' },
      },
      {
        name: 'hover',
        type: ComponentStateType.Hover,
        properties: { backgroundColor: '#0056b3' },
      },
      {
        name: 'disabled',
        type: ComponentStateType.Disabled,
        properties: { backgroundColor: '#6c757d', cursor: 'not-allowed' },
      },
    ],
  };
}

// 创建组件库配置
function createComponentLibrary(name: string, version: string): DesignComponentLibrary {
  return {
    name,
    version,
    components: {},
    categories: [
      {
        id: 'inputs',
        name: '输入组件',
        description: '按钮、输入框等交互组件',
        icon: 'input',
      },
      {
        id: 'display',
        name: '展示组件',
        description: '卡片、标签等展示组件',
        icon: 'view',
      },
    ],
    config: {
      baseSettings: {
        namingConvention: 'PascalCase',
        componentPrefix: 'Max',
      },
      build: {
        outputFormats: [OutputFormat.React, OutputFormat.Vue],
        minify: true,
        sourceMap: true,
        target: ['es2018', 'es2020'],
      },
      development: {
        hotReload: true,
        debug: true,
        previewPort: 3000,
      },
      documentation: {
        autoGenerate: true,
        includeExamples: true,
      },
      quality: {
        linting: true,
        typeChecking: true,
        testCoverage: 80,
      },
    },
  };
}
```

#### 边界 case 处理

```tsx
// 处理组件状态验证
function validateComponentStates(states: ComponentState[]): ComponentState[] {
  const requiredStates = [ComponentStateType.Default];
  const stateTypes = states.map((s) => s.type);

  // 检查必须包含默认状态
  if (!stateTypes.includes(ComponentStateType.Default)) {
    states.push({
      name: 'default',
      type: ComponentStateType.Default,
      properties: {},
    });
  }

  // 验证状态名称唯一性
  const names = new Set<string>();
  states.forEach((state) => {
    if (names.has(state.name)) {
      throw new Error(`Duplicate state name: ${state.name}`);
    }
    names.add(state.name);
  });

  return states;
}

// 处理组件依赖关系
function resolveComponentDependencies(component: DesignComponent, library: DesignComponentLibrary): string[] {
  const dependencies: string[] = [];

  if (component.dependencies) {
    component.dependencies.forEach((dep) => {
      if (!library.components[dep]) {
        console.warn(`Missing dependency: ${dep}`);
      } else {
        dependencies.push(dep);
        // 递归解析子依赖
        const subDeps = resolveComponentDependencies(library.components[dep], library);
        dependencies.push(...subDeps);
      }
    });
  }

  return [...new Set(dependencies)];
}

// 处理属性类型验证
function validateComponentProperties(properties: DesignComponentProperty[]): DesignComponentProperty[] {
  const validTypes = ['string', 'number', 'boolean', 'enum', 'color', 'object'];

  properties.forEach((prop) => {
    if (!validTypes.includes(prop.type)) {
      throw new Error(`Invalid property type: ${prop.type}`);
    }

    if (prop.type === 'enum' && (!prop.options || prop.options.length === 0)) {
      throw new Error(`Enum property must have options: ${prop.name}`);
    }
  });

  return properties;
}
```

### 最佳实践

#### 类型收窄

```tsx
// 使用类型保护确保组件类型有效
function isValidOutputFormat(format: string): format is OutputFormat {
  return Object.values(OutputFormat).includes(format as OutputFormat);
}

// 使用联合类型确保编译时安全
type ComponentCategoryType = 'inputs' | 'display' | 'layout' | 'navigation';

function getCategoryComponents(library: DesignComponentLibrary, category: ComponentCategoryType): DesignComponent[] {
  return Object.values(library.components).filter((comp) => comp.category === category);
}
```

#### 运行时校验

```tsx
// 运行时组件验证
class ComponentValidator {
  static validate(component: any): asserts component is DesignComponent {
    if (typeof component !== 'object' || component === null) {
      throw new Error('Component must be an object');
    }

    if (!component.id || typeof component.id !== 'string') {
      throw new Error('Component must have a valid id');
    }

    if (!component.name || typeof component.name !== 'string') {
      throw new Error('Component must have a valid name');
    }

    if (!Array.isArray(component.properties)) {
      throw new Error('Component properties must be an array');
    }

    if (!component.masterInstance || typeof component.masterInstance !== 'object') {
      throw new Error('Component must have a valid masterInstance');
    }
  }

  static validateLibrary(library: any): asserts library is DesignComponentLibrary {
    if (typeof library !== 'object' || library === null) {
      throw new Error('Library must be an object');
    }

    if (!library.name || typeof library.name !== 'string') {
      throw new Error('Library must have a valid name');
    }

    if (!library.version || typeof library.version !== 'string') {
      throw new Error('Library must have a valid version');
    }

    if (typeof library.components !== 'object' || library.components === null) {
      throw new Error('Library components must be an object');
    }
  }
}
```

#### 与后端协议对齐

```tsx
// 后端数据转换
function componentToBackend(component: DesignComponent) {
  return {
    id: component.id,
    name: component.name,
    description: component.description,
    category: component.category,
    tags: component.tags,
    properties: component.properties.map((prop) => ({
      name: prop.name,
      type: prop.type,
      default_value: prop.defaultValue,
      options: prop.options,
    })),
    states: component.states?.map((state) => ({
      name: state.name,
      type: state.type,
      properties: state.properties,
      transitions: state.transitions,
    })),
    version: component.version,
    created_at: component.createdAt,
    updated_at: component.updatedAt,
  };
}

function componentFromBackend(data: any): DesignComponent {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    tags: data.tags || [],
    properties: data.properties.map((prop) => ({
      name: prop.name,
      type: prop.type,
      defaultValue: prop.default_value,
      options: prop.options,
    })),
    states:
      data.states?.map((state) => ({
        name: state.name,
        type: state.type,
        properties: state.properties,
        transitions: state.transitions,
      })) || [],
    masterInstance: data.master_instance,
    version: data.version || '1.0.0',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
```

#### 错误提示国际化

```tsx
// 国际化错误消息
const errorMessages = {
  zh: {
    invalidComponent: '组件定义无效',
    missingId: '组件缺少唯一标识符',
    missingName: '组件缺少名称',
    duplicateState: '状态名称重复',
    invalidPropertyType: '属性类型无效',
    missingDependency: '缺少依赖组件',
  },
  en: {
    invalidComponent: 'Invalid component definition',
    missingId: 'Component missing unique identifier',
    missingName: 'Component missing name',
    duplicateState: 'Duplicate state name',
    invalidPropertyType: 'Invalid property type',
    missingDependency: 'Missing dependency component',
  },
};

function getLocalizedError(key: string, locale: 'zh' | 'en' = 'zh'): string {
  return errorMessages[locale][key] || key;
}

// 组件状态描述国际化
const stateDescriptions = {
  zh: {
    [ComponentStateType.Default]: '默认状态',
    [ComponentStateType.Hover]: '悬停状态',
    [ComponentStateType.Pressed]: '按下状态',
    [ComponentStateType.Focused]: '焦点状态',
    [ComponentStateType.Disabled]: '禁用状态',
  },
  en: {
    [ComponentStateType.Default]: 'Default state',
    [ComponentStateType.Hover]: 'Hover state',
    [ComponentStateType.Pressed]: 'Pressed state',
    [ComponentStateType.Focused]: 'Focused state',
    [ComponentStateType.Disabled]: 'Disabled state',
  },
};
```

### 变更日志
