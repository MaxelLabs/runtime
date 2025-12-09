/**
 * ui/SimpleGUI.ts
 * 简单 GUI 控制面板 - 零依赖的轻量级实现
 */

import type { GUIParamConfig, GUIParamValue } from './types';

/**
 * 简单 GUI 控制面板
 *
 * 提供基本的参数调节界面，无需外部依赖：
 * - 数字滑块
 * - 布尔开关
 * - 颜色选择器
 * - 下拉选择
 *
 * @example
 * ```typescript
 * const gui = new SimpleGUI();
 *
 * gui.add('rotationSpeed', {
 *   value: 1.0,
 *   min: 0,
 *   max: 5,
 *   step: 0.1,
 *   onChange: (v) => console.log('Speed:', v)
 * });
 *
 * gui.add('wireframe', {
 *   value: false,
 *   onChange: (v) => console.log('Wireframe:', v)
 * });
 * ```
 */
export class SimpleGUI {
  private container: HTMLDivElement;
  private params: Map<string, GUIParamConfig> = new Map();
  private isCollapsed: boolean = false;

  constructor() {
    this.container = this.createContainer();
    document.body.appendChild(this.container);
  }

  /**
   * 添加参数控件
   * @param name 参数名称
   * @param config 参数配置
   * @returns this (链式调用)
   */
  add(name: string, config: GUIParamConfig): SimpleGUI {
    this.params.set(name, config);
    this.createControl(name, config);
    return this;
  }

  /**
   * 获取参数值
   * @param name 参数名称
   * @returns 参数值
   */
  get<T extends GUIParamValue>(name: string): T | undefined {
    return this.params.get(name)?.value as T;
  }

  /**
   * 设置参数值
   * @param name 参数名称
   * @param value 新值
   */
  set(name: string, value: GUIParamValue): void {
    const config = this.params.get(name);
    if (config) {
      config.value = value;
      this.updateControl(name, value);
      config.onChange?.(value);
    }
  }

  /**
   * 添加分隔线
   * @param label 可选标签
   */
  addSeparator(label?: string): SimpleGUI {
    const separator = document.createElement('div');
    separator.style.cssText = `
      border-top: 1px solid #555;
      margin: 8px 0;
      padding-top: 8px;
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
    `;
    if (label) {
      separator.textContent = label;
    }
    this.container.appendChild(separator);
    return this;
  }

  /**
   * 销毁 GUI
   */
  destroy(): void {
    this.container.remove();
    this.params.clear();
  }

  // ==================== 私有方法 ====================

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'simple-gui';
    container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 280px;
      background: rgba(30, 30, 30, 0.95);
      border-radius: 8px;
      padding: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      color: #ddd;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      z-index: 10000;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
    `;

    // 添加标题栏
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #444;
    `;

    const title = document.createElement('span');
    title.textContent = 'Controls';
    title.style.cssText = 'font-weight: 600; font-size: 13px;';

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '−';
    toggleBtn.style.cssText = `
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      font-size: 16px;
      padding: 0 4px;
    `;
    toggleBtn.onclick = () => this.toggleCollapse(toggleBtn);

    header.appendChild(title);
    header.appendChild(toggleBtn);
    container.appendChild(header);

    return container;
  }

  private toggleCollapse(btn: HTMLButtonElement): void {
    this.isCollapsed = !this.isCollapsed;
    btn.textContent = this.isCollapsed ? '+' : '−';

    const children = Array.from(this.container.children);
    children.forEach((child, index) => {
      if (index > 0) {
        (child as HTMLElement).style.display = this.isCollapsed ? 'none' : 'block';
      }
    });
  }

  private createControl(name: string, config: GUIParamConfig): void {
    const row = document.createElement('div');
    row.id = `gui-row-${name}`;
    row.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    `;

    const label = document.createElement('label');
    label.textContent = name;
    label.style.cssText = `
      flex: 0 0 100px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    `;
    row.appendChild(label);

    const value = config.value;

    if (typeof value === 'boolean') {
      this.createBooleanControl(row, name, config);
    } else if (typeof value === 'number') {
      this.createNumberControl(row, name, config);
    } else if (typeof value === 'string') {
      if (config.options) {
        this.createSelectControl(row, name, config);
      } else {
        this.createTextControl(row, name, config);
      }
    } else if (Array.isArray(value) && value.length === 3) {
      this.createColorControl(row, name, config);
    }

    this.container.appendChild(row);
  }

  private createNumberControl(row: HTMLDivElement, name: string, config: GUIParamConfig): void {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'flex: 1; display: flex; align-items: center; gap: 8px;';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = `gui-input-${name}`;
    slider.min = String(config.min ?? 0);
    slider.max = String(config.max ?? 100);
    slider.step = String(config.step ?? 0.1);
    slider.value = String(config.value);
    slider.style.cssText = 'flex: 1; cursor: pointer;';

    const valueDisplay = document.createElement('span');
    valueDisplay.id = `gui-value-${name}`;
    valueDisplay.style.cssText = 'width: 50px; text-align: right; font-family: monospace;';
    valueDisplay.textContent = this.formatNumber(config.value as number);

    slider.oninput = () => {
      const newValue = parseFloat(slider.value);
      config.value = newValue;
      valueDisplay.textContent = this.formatNumber(newValue);
      config.onChange?.(newValue);
    };

    wrapper.appendChild(slider);
    wrapper.appendChild(valueDisplay);
    row.appendChild(wrapper);
  }

  private createBooleanControl(row: HTMLDivElement, name: string, config: GUIParamConfig): void {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `gui-input-${name}`;
    checkbox.checked = config.value as boolean;
    checkbox.style.cssText = 'width: 18px; height: 18px; cursor: pointer;';

    checkbox.onchange = () => {
      config.value = checkbox.checked;
      config.onChange?.(checkbox.checked);
    };

    row.appendChild(checkbox);
  }

  private createSelectControl(row: HTMLDivElement, name: string, config: GUIParamConfig): void {
    const select = document.createElement('select');
    select.id = `gui-input-${name}`;
    select.style.cssText = `
      flex: 1;
      padding: 4px 8px;
      background: #333;
      color: #ddd;
      border: 1px solid #555;
      border-radius: 4px;
      cursor: pointer;
    `;

    config.options?.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option;
      opt.selected = option === config.value;
      select.appendChild(opt);
    });

    select.onchange = () => {
      config.value = select.value;
      config.onChange?.(select.value);
    };

    row.appendChild(select);
  }

  private createTextControl(row: HTMLDivElement, name: string, config: GUIParamConfig): void {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `gui-input-${name}`;
    input.value = config.value as string;
    input.style.cssText = `
      flex: 1;
      padding: 4px 8px;
      background: #333;
      color: #ddd;
      border: 1px solid #555;
      border-radius: 4px;
    `;

    input.oninput = () => {
      config.value = input.value;
      config.onChange?.(input.value);
    };

    row.appendChild(input);
  }

  private createColorControl(row: HTMLDivElement, name: string, config: GUIParamConfig): void {
    const color = config.value as [number, number, number];
    const hexColor = this.rgbToHex(color);

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.id = `gui-input-${name}`;
    colorInput.value = hexColor;
    colorInput.style.cssText = `
      width: 60px;
      height: 24px;
      padding: 0;
      border: none;
      cursor: pointer;
    `;

    const valueDisplay = document.createElement('span');
    valueDisplay.id = `gui-value-${name}`;
    valueDisplay.style.cssText = 'margin-left: 8px; font-family: monospace;';
    valueDisplay.textContent = hexColor;

    colorInput.oninput = () => {
      const newColor = this.hexToRgb(colorInput.value);
      config.value = newColor;
      valueDisplay.textContent = colorInput.value;
      config.onChange?.(newColor);
    };

    row.appendChild(colorInput);
    row.appendChild(valueDisplay);
  }

  private updateControl(name: string, value: GUIParamValue): void {
    const input = document.getElementById(`gui-input-${name}`) as HTMLInputElement;
    if (!input) {
      return;
    }

    if (typeof value === 'boolean') {
      input.checked = value;
    } else if (typeof value === 'number') {
      input.value = String(value);
      const valueDisplay = document.getElementById(`gui-value-${name}`);
      if (valueDisplay) {
        valueDisplay.textContent = this.formatNumber(value);
      }
    } else if (typeof value === 'string') {
      input.value = value;
    } else if (Array.isArray(value)) {
      input.value = this.rgbToHex(value);
    }
  }

  private formatNumber(n: number): string {
    return n.toFixed(2);
  }

  private rgbToHex(rgb: [number, number, number]): string {
    const toHex = (c: number) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      return [0, 0, 0];
    }
    return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
  }
}
