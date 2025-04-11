// 简单的 CommonJS 风格的基准测试

// 直接加载已编译的模块
try {
  // 尝试加载已编译的模块
  const path = require('path');
  const fs = require('fs');
  
  // 检查 dist 目录是否存在
  const distPath = path.resolve(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    console.error('错误: dist 目录不存在。请先运行 `pnpm build` 命令来编译库。');
    process.exit(1);
  }

  console.log('============================================================');
  console.log('                  性能基准测试开始                           ');
  console.log('============================================================');

  // 加载 Math 库
  const math = require('../dist/index.js');
  const { Vector3, Matrix4, Quaternion, Euler } = math;

  // 设置性能测试参数
  const ITERATIONS = 1000000; // 100万次
  const HEAVY_ITERATIONS = 100000; // 10万次
  
  // 预热
  console.log('\n预热引擎...');
  const v1 = new Vector3(1, 2, 3);
  const v2 = new Vector3(4, 5, 6);
  const m = new Matrix4().set(
    1, 2, 3, 4,
    5, 6, 7, 8,
    9, 10, 11, 12,
    0, 0, 0, 1
  );
  
  for (let i = 0; i < 10000; i++) {
    v1.add(v2);
    m.transformPoint(v1);
  }
  
  // 1. 测试向量运算性能
  console.log('\n向量运算测试:');
  
  // 向量加法
  console.time('Vector3.add (1M次)');
  for (let i = 0; i < ITERATIONS; i++) {
    v1.add(v2);
  }
  console.timeEnd('Vector3.add (1M次)');
  
  // 向量点积
  console.time('Vector3.dot (1M次)');
  for (let i = 0; i < ITERATIONS; i++) {
    v1.dot(v2);
  }
  console.timeEnd('Vector3.dot (1M次)');
  
  // 向量叉积
  console.time('Vector3.cross (1M次)');
  for (let i = 0; i < ITERATIONS; i++) {
    v1.cross(v2);
  }
  console.timeEnd('Vector3.cross (1M次)');
  
  // 向量归一化
  console.time('Vector3.normalize (1M次)');
  for (let i = 0; i < ITERATIONS; i++) {
    v1.normalize();
  }
  console.timeEnd('Vector3.normalize (1M次)');
  
  // 向量距离计算
  console.time('Vector3.distance (1M次)');
  for (let i = 0; i < ITERATIONS; i++) {
    v1.distance(v2);
  }
  console.timeEnd('Vector3.distance (1M次)');
  
  // 2. 测试矩阵运算性能
  console.log('\n矩阵运算测试:');
  
  // 矩阵乘法
  const m1 = new Matrix4();
  const m2 = new Matrix4().set(
    2, 3, 4, 5,
    6, 7, 8, 9,
    10, 11, 12, 13,
    0, 0, 0, 1
  );
  
  console.time('Matrix4.multiply (100K次)');
  for (let i = 0; i < HEAVY_ITERATIONS; i++) {
    m1.multiply(m2);
  }
  console.timeEnd('Matrix4.multiply (100K次)');
  
  // 矩阵求逆
  console.time('Matrix4.invert (10K次)');
  for (let i = 0; i < HEAVY_ITERATIONS / 10; i++) {
    m1.clone().invert();
  }
  console.timeEnd('Matrix4.invert (10K次)');
  
  // 3. 测试四元数运算性能
  console.log('\n四元数运算测试:');
  
  const q1 = new Quaternion(1, 2, 3, 4).normalize();
  const q2 = new Quaternion(5, 6, 7, 8).normalize();
  
  // 四元数乘法
  console.time('Quaternion.multiply (1M次)');
  for (let i = 0; i < ITERATIONS; i++) {
    q1.multiply(q2);
  }
  console.timeEnd('Quaternion.multiply (1M次)');
  
  // 四元数球面插值
  console.time('Quaternion.slerp (100K次)');
  for (let i = 0; i < HEAVY_ITERATIONS; i++) {
    q1.slerp(q2, 0.5);
  }
  console.timeEnd('Quaternion.slerp (100K次)');
  
  // 4. 测试欧拉角运算性能
  console.log('\n欧拉角运算测试:');
  
  const e1 = new Euler(30, 45, 60);
  const e2 = new Euler(60, 30, 45);
  
  // 欧拉角转四元数
  console.time('Euler.toQuaternion (1M次)');
  for (let i = 0; i < ITERATIONS; i++) {
    e1.toQuaternion(new Quaternion());
  }
  console.timeEnd('Euler.toQuaternion (1M次)');
  
  // 5. 测试对象池性能
  console.log('\n对象池性能测试:');
  
  // 使用对象池创建向量
  console.time('Vector3.create (100K次)');
  for (let i = 0; i < HEAVY_ITERATIONS; i++) {
    const v = Vector3.create(i, i * 2, i * 3);
    Vector3.release(v);
  }
  console.timeEnd('Vector3.create (100K次)');
  
  // 不使用对象池创建向量
  console.time('new Vector3 (100K次)');
  for (let i = 0; i < HEAVY_ITERATIONS; i++) {
    const v = new Vector3(i, i * 2, i * 3);
  }
  console.timeEnd('new Vector3 (100K次)');

  console.log('============================================================');
  console.log('                  性能基准测试结束                           ');
  console.log('============================================================');

} catch (error) {
  console.error('运行基准测试时出错:', error);
}