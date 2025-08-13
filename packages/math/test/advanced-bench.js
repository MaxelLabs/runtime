// 高级性能基准测试

const path = require("path");
const fs = require("fs");
const os = require("os");
const { Worker } = require("worker_threads");

// 检查 dist 目录
const distPath = path.resolve(__dirname, "../dist");
if (!fs.existsSync(distPath)) {
  console.error("错误: dist 目录不存在。请先运行 `pnpm build` 命令来编译库。");
  process.exit(1);
}

// 加载 Math 库
const math = require("../dist/index.js");
const { Vector3, Matrix4, Quaternion, Euler } = math;

// 性能测试参数
const LARGE_SCALE = 1000000; // 100万对象
const MEMORY_PRESSURE = 5000000; // 500万对象
const CONCURRENT_TASKS = os.cpus().length; // CPU核心数

console.log("============================================================");
console.log("                  高级性能基准测试开始                        ");
console.log("============================================================");

// 1. 大规模场景测试
function runLargeScaleTest() {
  console.log("\n大规模场景测试:");

  // 创建大量向量
  console.time("创建100万向量");
  const vectors = [];
  for (let i = 0; i < LARGE_SCALE; i++) {
    vectors.push(new Vector3(Math.random(), Math.random(), Math.random()));
  }
  console.timeEnd("创建100万向量");

  // 大规模向量运算
  console.time("100万向量归一化");
  for (const v of vectors) {
    v.normalize();
  }
  console.timeEnd("100万向量归一化");

  // 大规模矩阵运算
  console.time("创建100万矩阵");
  const matrices = [];
  for (let i = 0; i < LARGE_SCALE; i++) {
    matrices.push(
      new Matrix4().set(
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
      ),
    );
  }
  console.timeEnd("创建100万矩阵");

  // 清理内存
  vectors.length = 0;
  matrices.length = 0;
  global.gc && global.gc();
}

// 2. 内存压力测试
function runMemoryPressureTest() {
  console.log("\n内存压力测试:");

  const startMemory = process.memoryUsage();
  console.log("初始内存使用:", formatMemoryUsage(startMemory));

  // 创建大量对象
  console.time("创建500万对象");
  const objects = [];
  for (let i = 0; i < MEMORY_PRESSURE; i++) {
    objects.push({
      vector: new Vector3(Math.random(), Math.random(), Math.random()),
      matrix: new Matrix4(),
      quaternion: new Quaternion(Math.random(), Math.random(), Math.random(), Math.random()),
    });
  }
  console.timeEnd("创建500万对象");

  const midMemory = process.memoryUsage();
  console.log("创建对象后内存使用:", formatMemoryUsage(midMemory));

  // 执行一些操作
  console.time("执行对象操作");
  for (const obj of objects) {
    obj.vector.normalize();
    obj.matrix.invert();
    obj.quaternion.normalize();
  }
  console.timeEnd("执行对象操作");

  // 清理对象
  objects.length = 0;
  global.gc && global.gc();

  const endMemory = process.memoryUsage();
  console.log("清理后内存使用:", formatMemoryUsage(endMemory));
}

// 3. 并发性能测试
function runConcurrentTest() {
  console.log("\n并发性能测试:");

  const workerCount = CONCURRENT_TASKS;
  console.log(`使用 ${workerCount} 个工作线程`);

  return new Promise((resolve) => {
    let completed = 0;
    const startTime = Date.now();

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(
        `
        const { Vector3, Matrix4 } = require('${path.resolve(__dirname, "../dist/index.js")}');
        
        // 每个线程执行100万次操作
        const ITERATIONS = 1000000;
        const v = new Vector3(1, 2, 3);
        const m = new Matrix4();
        
        for (let i = 0; i < ITERATIONS; i++) {
          v.normalize();
          m.invert();
        }
        
        process.exit(0);
      `,
        { eval: true },
      );

      worker.on("exit", () => {
        completed++;
        if (completed === workerCount) {
          const endTime = Date.now();
          console.log(`并发测试完成，耗时: ${endTime - startTime}ms`);
          resolve();
        }
      });
    }
  });
}

// 辅助函数
function formatMemoryUsage(memoryUsage) {
  return {
    rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
  };
}

// 运行所有测试
async function runAllTests() {
  try {
    runLargeScaleTest();
    runMemoryPressureTest();
    await runConcurrentTest();

    console.log("============================================================");
    console.log("                  高级性能基准测试结束                        ");
    console.log("============================================================");
  } catch (error) {
    console.error("运行基准测试时出错:", error);
  }
}

// 执行测试
runAllTests();
