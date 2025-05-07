/**
 * 画布类，封装HTML画布元素
 */
export class Canvas {
  /** HTML画布元素 */
  private element: HTMLCanvasElement;

  /**
   * 创建画布
   * @param canvas HTML画布元素或Canvas ID
   */
  constructor (canvas: HTMLCanvasElement | string) {
    if (typeof canvas === 'string') {
      const element = document.getElementById(canvas) as HTMLCanvasElement;

      if (!element) {
        throw new Error(`Canvas with id '${canvas}' not found.`);
      }
      this.element = element;
    } else {
      this.element = canvas;
    }
  }

  /**
   * 获取画布宽度
   */
  getWidth (): number {
    return this.element.width;
  }

  /**
   * 设置画布宽度
   */
  setWidth (value: number) {
    this.element.width = value;
  }

  /**
   * 获取画布高度
   */
  getHeight (): number {
    return this.element.height;
  }

  /**
   * 设置画布高度
   */
  setHeight (value: number) {
    this.element.height = value;
  }

  /**
   * 获取画布在网页中的宽度
   */
  getClientWidth (): number {
    return this.element.clientWidth;
  }

  /**
   * 获取画布在网页中的高度
   */
  getClientHeight (): number {
    return this.element.clientHeight;
  }

  /**
   * 根据客户端大小调整画布
   * @param width 可选的设定宽度，如果不指定则使用clientWidth
   * @param height 可选的设定高度，如果不指定则使用clientHeight
   * @returns 是否进行了大小调整
   */
  resizeByClientSize (width?: number, height?: number): boolean {
    const clientWidth = width ?? this.getClientWidth();
    const clientHeight = height ?? this.getClientHeight();

    if (this.getWidth() !== clientWidth || this.getHeight() !== clientHeight) {
      this.setWidth(clientWidth);
      this.setHeight(clientHeight);

      return true;
    }

    return false;
  }
}