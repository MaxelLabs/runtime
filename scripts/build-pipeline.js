/**
 * 构建管道脚本
 * 确保按照以下顺序构建：
 * 1. specification 库
 * 2. math 库
 * 3. 其他所有库
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// 定义构建顺序
const buildOrder = [
  'packages/specification',
  'packages/math',
];

// 获取所有其他包
const getAllPackages = () => {
  const packages = [];
  ['packages'].forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(pkg => {
        const pkgPath = path.join(dir, pkg);
        if (fs.statSync(pkgPath).isDirectory() && 
            !buildOrder.includes(pkgPath) &&
            fs.existsSync(path.join(pkgPath, 'package.json'))) {
          packages.push(pkgPath);
        }
      });
    }
  });
  return packages;
};

// 执行构建
console.log(chalk.blue('🚀 开始按顺序构建...'));

// 先构建基础库
console.log(chalk.yellow('\n📦 构建核心基础库...'));
buildOrder.forEach(pkg => {
  console.log(chalk.green(`\n🔨 构建 ${pkg}...`));
  try {
    execSync(`cd ${pkg} && pnpm build`, { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red(`构建 ${pkg} 失败!`));
    process.exit(1);
  }
});

// 然后构建其他库
console.log(chalk.yellow('\n📦 构建其他依赖库...'));
getAllPackages().forEach(pkg => {
  console.log(chalk.green(`\n🔨 构建 ${pkg}...`));
  try {
    execSync(`cd ${pkg} && pnpm build`, { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red(`构建 ${pkg} 失败!`));
    // 不退出，继续尝试构建其他包
  }
});

console.log(chalk.blue('\n✅ 所有包构建完成!'));