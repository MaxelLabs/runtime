## 设计颜色系统定义

### 接口总览

| 名称                 | 泛型参数 | 简要描述                                     |
| -------------------- | -------- | -------------------------------------------- |
| `DesignColorSystem`  | -        | 设计颜色系统，包含主色调、语义色彩和颜色模式 |
| `DesignColorPalette` | -        | 设计调色板，定义颜色变体和用途说明           |
| `ColorUsage`         | -        | 颜色用途定义，指定颜色在UI中的具体使用场景   |
| `ColorAccessibility` | -        | 颜色可访问性配置，包含对比度和WCAG合规性     |
| `ContrastInfo`       | -        | 对比度信息，详细的颜色对比度测试数据         |
| `DesignColorMode`    | -        | 颜色模式定义，支持亮色、暗色和高对比度模式   |
| `ColorContext`       | -        | 颜色场景枚举，8种UI元素使用场景              |
| `WCAGLevel`          | -        | WCAG级别枚举，3种可访问性标准等级            |
| `ColorModeType`      | -        | 颜色模式类型枚举，4种主题模式支持            |

### 枚举总览

| 枚举名          | 成员        | 语义           | 适用场景             |
| --------------- | ----------- | -------------- | -------------------- |
| `ColorContext`  | 8种使用场景 | UI元素颜色应用 | 设计系统、界面配色   |
| `WCAGLevel`     | 3种标准等级 | 可访问性合规   | 无障碍设计、颜色对比 |
| `ColorModeType` | 4种主题模式 | 主题切换支持   | 响应式设计、用户偏好 |

### 核心接口详解

#### DesignColorSystem

**类型签名**

```tsx
interface DesignColorSystem {
  primary: DesignColorPalette;
  secondary?: DesignColorPalette;
  neutral: DesignColorPalette;
  semantic: {
    success: DesignColorPalette;
    warning: DesignColorPalette;
    error: DesignColorPalette;
    info: DesignColorPalette;
  };
  custom?: Record<string, DesignColorPalette>;
  modes?: DesignColorMode[];
}
```

**字段说明**

| 字段名             | 类型                                 | 描述           | 默认值 | 使用示例           |
| ------------------ | ------------------------------------ | -------------- | ------ | ------------------ |
| `primary`          | `DesignColorPalette`                 | 主色调调色板   | -      | 品牌主色、强调色   |
| `secondary`        | `DesignColorPalette`                 | 次要色调调色板 | -      | 辅助品牌色         |
| `neutral`          | `DesignColorPalette`                 | 中性色调色板   | -      | 背景、文本、边框   |
| `semantic.success` | `DesignColorPalette`                 | 成功状态色彩   | -      | 成功提示、确认操作 |
| `semantic.warning` | `DesignColorPalette`                 | 警告状态色彩   | -      | 警告提示、注意信息 |
| `semantic.error`   | `DesignColorPalette`                 | 错误状态色彩   | -      | 错误提示、危险操作 |
| `semantic.info`    | `DesignColorPalette`                 | 信息状态色彩   | -      | 信息提示、说明文本 |
| `custom`           | `Record<string, DesignColorPalette>` | 自定义色彩集合 | `{}`   | 特定场景专用色彩   |
| `modes`            | `DesignColorMode[]`                  | 颜色模式配置   | `[]`   | 亮色/暗色主题切换  |

#### DesignColorPalette

**类型签名**

```tsx
interface DesignColorPalette {
  name: string;
  variants: Record<string, ColorLike>;
  usage?: ColorUsage[];
  accessibility?: ColorAccessibility;
}
```

**字段说明**

| 字段名          | 类型                        | 描述         | 默认值 | 示例值                            |
| --------------- | --------------------------- | ------------ | ------ | --------------------------------- |
| `name`          | `string`                    | 调色板名称   | -      | `"Primary Blue"`                  |
| `variants`      | `Record<string, ColorLike>` | 颜色变体映射 | -      | `{50: '#e3f2fd', 500: '#2196f3'}` |
| `usage`         | `ColorUsage[]`              | 颜色用途说明 | `[]`   | 背景色、文本色等                  |
| `accessibility` | `ColorAccessibility`        | 可访问性配置 | -      | 对比度、WCAG级别                  |

#### ColorAccessibility

**类型签名**

```tsx
interface ColorAccessibility {
  contrast: ContrastInfo[];
  colorBlindFriendly?: boolean;
  wcagLevel?: WCAGLevel;
}
```

**字段说明**

| 字段名               | 类型             | 描述           | 默认值 | 取值范围                 |
| -------------------- | ---------------- | -------------- | ------ | ------------------------ |
| `contrast`           | `ContrastInfo[]` | 对比度测试数据 | -      | 必须包含至少一组测试     |
| `colorBlindFriendly` | `boolean`        | 色盲友好标识   | `true` | true/false               |
| `wcagLevel`          | `WCAGLevel`      | WCAG合规级别   | `'AA'` | `'A'` / `'AA'` / `'AAA'` |

#### DesignColorMode

**类型签名**

```tsx
interface DesignColorMode {
  name: string;
  type: ColorModeType;
  colors: Record<string, ColorLike>;
  default?: boolean;
}
```

**字段说明**

| 字段名    | 类型                        | 描述           | 默认值  | 示例值                             |
| --------- | --------------------------- | -------------- | ------- | ---------------------------------- |
| `name`    | `string`                    | 模式名称       | -       | `"Light Theme"`                    |
| `type`    | `ColorModeType`             | 模式类型枚举   | -       | `ColorModeType.Light`              |
| `colors`  | `Record<string, ColorLike>` | 颜色映射表     | -       | `{bg: '#ffffff', text: '#000000'}` |
| `default` | `boolean`                   | 是否为默认模式 | `false` | true/false                         |

### 枚举值详解

#### ColorContext

**枚举定义**

```tsx
enum ColorContext {
  Background = 'background',
  Foreground = 'foreground',
  Border = 'border',
  Surface = 'surface',
  Text = 'text',
  Icon = 'icon',
  Accent = 'accent',
}
```

**枚举值详情**

| 枚举值       | 字面量 | 对应字符串     | 使用场景 | 典型应用           |
| ------------ | ------ | -------------- | -------- | ------------------ |
| `Background` | `0`    | `'background'` | 背景色   | 页面背景、容器背景 |
| `Foreground` | `1`    | `'foreground'` | 前景色   | 文本颜色、图标颜色 |
| `Border`     | `2`    | `'border'`     | 边框色   | 分割线、输入框边框 |
| `Surface`    | `3`    | `'surface'`    | 表面色   | 卡片背景、弹窗背景 |
| `Text`       | `4`    | `'text'`       | 文本色   | 正文文本、标题文本 |
| `Icon`       | `5`    | `'icon'`       | 图标色   | 功能图标、状态图标 |
| `Accent`     | `6`    | `'accent'`     | 强调色   | 高亮文本、交互元素 |

#### WCAGLevel

**枚举定义**

```tsx
enum WCAGLevel {
  A = 'A',
  AA = 'AA',
  AAA = 'AAA',
}
```

**枚举值详情**

| 枚举值 | 字面量 | 对应字符串 | 对比度要求       | 适用场景       |
| ------ | ------ | ---------- | ---------------- | -------------- |
| `A`    | `0`    | `'A'`      | 最低标准         | 基础可访问性   |
| `AA`   | `1`    | `'AA'`     | 4.5:1 (正常文本) | 标准合规要求   |
| `AAA`  | `2`    | `'AAA'`    | 7:1 (正常文本)   | 高可访问性要求 |

#### ColorModeType

**枚举定义**

```tsx
enum ColorModeType {
  Light = 'light',
  Dark = 'dark',
  HighContrast = 'high-contrast',
  Custom = 'custom',
}
```

**枚举值详情**

| 枚举值         | 字面量 | 对应字符串        | 特征描述   | 适用场景               |
| -------------- | ------ | ----------------- | ---------- | ---------------------- |
| `Light`        | `0`    | `'light'`         | 亮色主题   | 白天环境、标准界面     |
| `Dark`         | `1`    | `'dark'`          | 暗色主题   | 夜间环境、减少眼疲劳   |
| `HighContrast` | `2`    | `'high-contrast'` | 高对比度   | 视觉障碍用户、强光环境 |
| `Custom`       | `3`    | `'custom'`        | 自定义主题 | 品牌定制、特殊需求     |

### 使用示例

#### 最小可运行片段

```tsx
import type { DesignColorSystem, ColorModeType } from '@maxellabs/specification/design';

// 基础颜色系统配置
const colorSystem: DesignColorSystem = {
  primary: {
    name: 'Brand Blue',
    variants: {
      50: '#e3f2fd',
      100: '#bbdefb',
      500: '#2196f3',
      900: '#0d47a1',
    },
  },
  neutral: {
    name: 'Gray Scale',
    variants: {
      50: '#fafafa',
      100: '#f5f5f5',
      500: '#9e9e9e',
      900: '#212121',
    },
  },
  semantic: {
    success: {
      name: 'Success Green',
      variants: { main: '#4caf50', light: '#81c784', dark: '#388e3c' },
    },
    error: {
      name: 'Error Red',
      variants: { main: '#f44336', light: '#ef5350', dark: '#c62828' },
    },
    warning: {
      name: 'Warning Orange',
      variants: { main: '#ff9800', light: '#ffb74d', dark: '#ef6c00' },
    },
    info: {
      name: 'Info Blue',
      variants: { main: '#2196f3', light: '#64b5f6', dark: '#1976d2' },
    },
  },
};
```

#### 常见业务封装

```tsx
// 创建完整的品牌色彩系统
function createBrandColorSystem(brandColor: string): DesignColorSystem {
  const primary = generateColorPalette('Brand Primary', brandColor);
  const neutral = generateColorPalette('Neutral', '#64748b');

  return {
    primary,
    neutral,
    semantic: {
      success: generateColorPalette('Success', '#10b981'),
      warning: generateColorPalette('Warning', '#f59e0b'),
      error: generateColorPalette('Error', '#ef4444'),
      info: generateColorPalette('Info', '#3b82f6'),
    },
    modes: [
      {
        name: 'Light Mode',
        type: ColorModeType.Light,
        colors: {
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          border: '#e2e8f0',
        },
        default: true,
      },
      {
        name: 'Dark Mode',
        type: ColorModeType.Dark,
        colors: {
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f1f5f9',
          border: '#334155',
        },
      },
    ],
  };
}

// 生成色彩调色板
function generateColorPalette(name: string, baseColor: string): DesignColorPalette {
  const variants = {
    50: lighten(baseColor, 0.9),
    100: lighten(baseColor, 0.7),
    200: lighten(baseColor, 0.5),
    300: lighten(baseColor, 0.3),
    400: lighten(baseColor, 0.1),
    500: baseColor,
    600: darken(baseColor, 0.1),
    700: darken(baseColor, 0.3),
    800: darken(baseColor, 0.5),
    900: darken(baseColor, 0.7),
  };

  return {
    name,
    variants,
    usage: [
      { name: 'background', context: [ColorContext.Background] },
      { name: 'text', context: [ColorContext.Text] },
      { name: 'border', context: [ColorContext.Border] },
    ],
    accessibility: {
      contrast: [
        {
          background: variants[500],
          foreground: '#ffffff',
          ratio: calculateContrast(variants[500], '#ffffff'),
          passAA: true,
          passAAA: true,
        },
      ],
      colorBlindFriendly: true,
      wcagLevel: WCAGLevel.AA,
    },
  };
}

// 颜色模式切换工具
class ColorModeManager {
  private currentMode: ColorModeType = ColorModeType.Light;
  private modes: Record<string, DesignColorMode> = {};

  addMode(mode: DesignColorMode) {
    this.modes[mode.type] = mode;
  }

  setMode(type: ColorModeType) {
    if (this.modes[type]) {
      this.currentMode = type;
      this.applyMode();
    }
  }

  private applyMode() {
    const mode = this.modes[this.currentMode];
    if (mode) {
      Object.entries(mode.colors).forEach(([key, color]) => {
        document.documentElement.style.setProperty(`--color-${key}`, color);
      });
    }
  }
}
```

#### 边界 case 处理

```tsx
// 处理颜色对比度验证
function validateColorContrast(
  background: string,
  foreground: string,
  requiredLevel: WCAGLevel = WCAGLevel.AA
): boolean {
  const ratio = calculateContrast(background, foreground);

  const requirements = {
    [WCAGLevel.A]: 3.0,
    [WCAGLevel.AA]: 4.5,
    [WCAGLevel.AAA]: 7.0,
  };

  return ratio >= requirements[requiredLevel];
}

// 处理色盲友好性检查
function checkColorBlindFriendly(colors: string[]): boolean {
  // 简化的色盲友好性检查
  const problematicPairs = [
    ['#ff0000', '#00ff00'], // 红绿对比
    ['#0000ff', '#ffff00'], // 蓝黄对比
  ];

  return !problematicPairs.some(([a, b]) => colors.includes(a) && colors.includes(b));
}

// 处理颜色变体生成边界情况
function safeGenerateVariants(baseColor: string): Record<string, string> {
  try {
    // 验证基础颜色格式
    if (!isValidColor(baseColor)) {
      throw new Error(`Invalid color format: ${baseColor}`);
    }

    const variants = {};
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

    steps.forEach((step) => {
      const factor = (step - 500) / 500;
      if (factor > 0) {
        variants[step] = lighten(baseColor, factor * 0.8);
      } else if (factor < 0) {
        variants[step] = darken(baseColor, Math.abs(factor) * 0.8);
      } else {
        variants[step] = baseColor;
      }
    });

    return variants;
  } catch (error) {
    console.error('Failed to generate color variants:', error);
    // 返回默认灰度
    return {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    };
  }
}

// 处理颜色模式兼容性
function ensureModeCompatibility(baseSystem: DesignColorSystem, newMode: DesignColorMode): DesignColorSystem {
  const requiredKeys = ['background', 'surface', 'text', 'border'];
  const missingKeys = requiredKeys.filter((key) => !newMode.colors[key]);

  if (missingKeys.length > 0) {
    console.warn(`Missing color keys in mode ${newMode.name}:`, missingKeys);

    // 使用默认值填充缺失的颜色
    const defaults = {
      background: newMode.type === ColorModeType.Dark ? '#1a1a1a' : '#ffffff',
      surface: newMode.type === ColorModeType.Dark ? '#2d2d2d' : '#f5f5f5',
      text: newMode.type === ColorModeType.Dark ? '#ffffff' : '#1a1a1a',
      border: newMode.type === ColorModeType.Dark ? '#404040' : '#e0e0e0',
    };

    missingKeys.forEach((key) => {
      newMode.colors[key] = defaults[key];
    });
  }

  return baseSystem;
}
```

### 最佳实践

#### 类型收窄

```tsx
// 使用类型保护确保颜色上下文有效
function isValidColorContext(context: string): context is ColorContext {
  return Object.values(ColorContext).includes(context as ColorContext);
}

// 使用联合类型确保WCAG级别安全
type RequiredWCAGLevel = WCAGLevel.AA | WCAGLevel.AAA;

function ensureWCAGCompliance(colors: DesignColorPalette, level: RequiredWCAGLevel): boolean {
  return colors.accessibility?.wcagLevel === level;
}
```

#### 运行时校验

```tsx
// 运行时颜色系统验证
class ColorSystemValidator {
  static validate(system: any): asserts system is DesignColorSystem {
    if (typeof system !== 'object' || system === null) {
      throw new Error('Color system must be an object');
    }

    if (!system.primary || !system.neutral || !system.semantic) {
      throw new Error('Color system must have primary, neutral and semantic colors');
    }

    this.validatePalette(system.primary);

    ['success', 'warning', 'error', 'info'].forEach((key) => {
      if (!system.semantic[key]) {
        throw new Error(`Missing semantic color: ${key}`);
      }
      this.validatePalette(system.semantic[key]);
    });
  }

  static validatePalette(palette: any): asserts palette is DesignColorPalette {
    if (!palette.name || typeof palette.name !== 'string') {
      throw new Error('Palette must have a valid name');
    }

    if (!palette.variants || typeof palette.variants !== 'object') {
      throw new Error('Palette must have variants');
    }

    Object.values(palette.variants).forEach((color) => {
      if (!isValidColor(color)) {
        throw new Error(`Invalid color value: ${color}`);
      }
    });
  }
}

// 对比度验证器
class ContrastValidator {
  static validateContrast(background: string, foreground: string, targetLevel: WCAGLevel): boolean {
    const ratio = calculateContrast(background, foreground);
    const requirements = { [WCAGLevel.A]: 3, [WCAGLevel.AA]: 4.5, [WCAGLevel.AAA]: 7 };

    return ratio >= requirements[targetLevel];
  }
}
```

#### 与后端协议对齐

```tsx
// 后端数据转换
function colorSystemToBackend(system: DesignColorSystem) {
  return {
    primary: paletteToBackend(system.primary),
    secondary: system.secondary ? paletteToBackend(system.secondary) : null,
    neutral: paletteToBackend(system.neutral),
    semantic: {
      success: paletteToBackend(system.semantic.success),
      warning: paletteToBackend(system.semantic.warning),
      error: paletteToBackend(system.semantic.error),
      info: paletteToBackend(system.semantic.info),
    },
    custom: system.custom
      ? Object.fromEntries(Object.entries(system.custom).map(([key, palette]) => [key, paletteToBackend(palette)]))
      : {},
    modes: system.modes?.map((mode) => ({
      name: mode.name,
      type: mode.type,
      colors: mode.colors,
      is_default: mode.default,
    })),
  };
}

function paletteToBackend(palette: DesignColorPalette) {
  return {
    name: palette.name,
    variants: palette.variants,
    usage: palette.usage,
    accessibility: palette.accessibility
      ? {
          contrast: palette.accessibility.contrast,
          color_blind_friendly: palette.accessibility.colorBlindFriendly,
          wcag_level: palette.accessibility.wcagLevel,
        }
      : null,
  };
}
```

#### 错误提示国际化

```tsx
// 国际化颜色描述
const colorDescriptions = {
  zh: {
    [ColorContext.Background]: '背景色',
    [ColorContext.Foreground]: '前景色',
    [ColorContext.Text]: '文本色',
    [ColorContext.Border]: '边框色',
    [WCAGLevel.A]: '基础可访问性',
    [WCAGLevel.AA]: '标准可访问性',
    [WCAGLevel.AAA]: '高级可访问性',
  },
  en: {
    [ColorContext.Background]: 'Background color',
    [ColorContext.Foreground]: 'Foreground color',
    [ColorContext.Text]: 'Text color',
    [ColorContext.Border]: 'Border color',
    [WCAGLevel.A]: 'Basic accessibility',
    [WCAGLevel.AA]: 'Standard accessibility',
    [WCAGLevel.AAA]: 'Advanced accessibility',
  },
};

function getColorDescription(key: ColorContext | WCAGLevel, locale: 'zh' | 'en' = 'zh'): string {
  return colorDescriptions[locale][key] || key;
}
```

### 变更日志

#### v1.2.0 (2024-07-15)

- **作者**: 设计系统组
- **改动摘要**: 新增 `ColorModeType.HighContrast` 支持高对比度模式
- **破坏性变更**: 无
- **迁移指南**: 新增枚举值，无需迁移

#### v1.1.0 (2024-06-20)

- **作者**: 可访问性组
- **改动摘要**: 增强 `ColorAccessibility` 支持色盲友好检测
- **破坏性变更**: 无
- **迁移指南**: 向后兼容，可逐步采用新字段

#### v1.0.0 (2024-05-10)

- **作者**: 设计系统组
- **改动摘要**: 初始版本发布，包含完整颜色系统设计
- **破坏性变更**: 初始版本，无
- **迁移指南**: 首次发布，无迁移需求
