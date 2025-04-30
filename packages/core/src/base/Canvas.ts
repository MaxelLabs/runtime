/**
 * 画布类，封装HTML画布元素
 */
export class Canvas {
  /** HTML画布元素 */
  private _element: HTMLCanvasElement;

  /**
   * 创建画布
   * @param canvas HTML画布元素或Canvas ID
   */
  constructor(canvas: HTMLCanvasElement | string) {
    if (typeof canvas === 'string') {
      const element = document.getElementById(canvas) as HTMLCanvasElement;
      if (!element) {
        throw new Error(`Canvas with id '${canvas}' not found.`);
      }
      this._element = element;
    } else {
      this._element = canvas;
    }
  }

  /**
   * 获取HTML画布元素
   */
  get element(): HTMLCanvasElement {
    return this._element;
  }

  /**
   * 获取画布宽度
   */
  get width(): number {
    return this._element.width;
  }

  /**
   * 设置画布宽度
   */
  set width(value: number) {
    this._element.width = value;
  }

  /**
   * 获取画布高度
   */
  get height(): number {
    return this._element.height;
  }

  /**
   * 设置画布高度
   */
  set height(value: number) {
    this._element.height = value;
  }

  /**
   * 获取画布在网页中的宽度
   */
  get clientWidth(): number {
    return this._element.clientWidth;
  }

  /**
   * 获取画布在网页中的高度
   */
  get clientHeight(): number {
    return this._element.clientHeight;
  }

  /**
   * 根据客户端大小调整画布
   * @param width 可选的设定宽度，如果不指定则使用clientWidth
   * @param height 可选的设定高度，如果不指定则使用clientHeight
   * @returns 是否进行了大小调整
   */
  resizeByClientSize(width?: number, height?: number): boolean {
    const clientWidth = width ?? this.clientWidth;
    const clientHeight = height ?? this.clientHeight;

    if (this.width !== clientWidth || this.height !== clientHeight) {
      this.width = clientWidth;
      this.height = clientHeight;
      return true;
    }

    return false;
  }
} 