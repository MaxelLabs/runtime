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
    '^@maxellabs/(.*)$': '<rootDir>/../$1/src',
  },

  // 覆盖率配置
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
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
