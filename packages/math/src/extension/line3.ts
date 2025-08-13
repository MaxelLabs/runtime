import { Vector3 } from '../core/vector3';

/**
 * 三维线段
 */
export class Line3 {
  start: Vector3;
  end: Vector3;

  /**
   * 构造函数
   * @param [start=new Vector3()] - 线段起点，默认值为(0, 0, 0)
   * @param [end=new Vector3()] - 线段终点，默认值为(0, 0, 0)
   */
  constructor(start = new Vector3(), end = new Vector3()) {
    this.start = start.clone();
    this.end = end.clone();
  }
}
