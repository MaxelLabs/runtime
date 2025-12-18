/** @type {import('jest').Config} */
module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 根目录
  rootDir: '.',

  // 测试文件模式
  testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/test/**/*.spec.ts'],

  // 忽略的测试文件
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // TypeScript 支持
  preset: 'ts-jest',

  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // 转换配置
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },

  // 模块名映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    "^@maxellabs/specification$": "<rootDir>/../specification/src/index.ts",
  },

  // 覆盖率配置
  collectCoverage: false, // 默认关闭，需要时可以开启
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // 收集覆盖率的文件
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/**/*',
  ],

  // 测试设置文件
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // 清除模拟
  clearMocks: true,

  // 详细输出
  verbose: true,

  // 错误时退出
  bail: false,

  // 强制退出
  forceExit: true,

  // 检测打开的句柄
  detectOpenHandles: true,

  // 最大工作进程数
  maxWorkers: '50%',

  // 测试超时
  testTimeout: 10000,
};
