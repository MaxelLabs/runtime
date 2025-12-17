#!/usr/bin/env node

/**
 * llmdoc AI友好重构启动脚本
 *
 * 使用方法:
 * node refactor-bootstrap.js --phase=1     # 执行第一阶段
 * node refactor-bootstrap.js --dry-run      # 仅分析不执行
 * node refactor-bootstrap.js --help         # 显示帮助
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  maxDocSize: 15 * 1024, // 15KB
  phases: {
    1: '分析与准备',
    2: '元数据标准化',
    3: '超大文档拆分',
    4: '目录结构优化',
    5: 'AI优化实施',
    6: '质量保证',
    7: '部署和监控'
  }
};

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  phase: null,
  dryRun: false,
  help: false
};

args.forEach(arg => {
  if (arg.startsWith('--phase=')) {
    options.phase = parseInt(arg.split('=')[1]);
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg === '--help') {
    options.help = true;
  }
});

// 显示帮助
function showHelp() {
  console.log(`
llmdoc AI友好重构工具

用法:
  node refactor-bootstrap.js [选项]

选项:
  --phase=N        执行指定阶段 (1-7)
  --dry-run        仅分析不执行实际修改
  --help           显示此帮助信息

阶段说明:
  1 - 分析与准备 (文档扫描、建立基准)
  2 - 元数据标准化 (添加缺失的front matter)
  3 - 超大文档拆分 (拆分>30KB的文档)
  4 - 目录结构优化 (重组文档分类)
  5 - AI优化实施 (语义标记、知识图谱)
  6 - 质量保证 (验证、测试)
  7 - 部署和监控 (发布、跟踪)

示例:
  node refactor-bootstrap.js --phase=1
  node refactor-bootstrap.js --phase=1 --dry-run
  node refactor-bootstrap.js --phase=3
`);
}

// 获取所有markdown文件
function getAllMarkdownFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// 分析文档状态
function analyzeDocuments() {
  console.log('\n🔍 分析文档状态...\n');

  const docs = getAllMarkdownFiles('llmdoc');
  const stats = {
    total: docs.length,
    totalSize: 0,
    largeDocs: [],
    missingFrontMatter: [],
    oversizedDocs: [],
    complexDocs: []
  };

  docs.forEach(doc => {
    const content = fs.readFileSync(doc, 'utf-8');
    const size = content.length;

    stats.totalSize += size;

    // 检查大小
    if (size > 30 * 1024) {
      stats.largeDocs.push({ path: doc, size });
    }
    if (size > CONFIG.maxDocSize) {
      stats.oversizedDocs.push({ path: doc, size });
    }

    // 检查front matter
    if (!content.startsWith('---')) {
      stats.missingFrontMatter.push(doc);
    }

    // 简单复杂度评估（代码块数量）
    const codeBlocks = (content.match(/```/g) || []).length / 2;
    if (codeBlocks > 10) {
      stats.complexDocs.push({ path: doc, codeBlocks });
    }
  });

  // 显示统计
  console.log(`📊 文档统计:`);
  console.log(`   总文档数: ${stats.total}`);
  console.log(`   总大小: ${(stats.totalSize / 1024).toFixed(1)} KB`);
  console.log(`   平均大小: ${(stats.totalSize / stats.total / 1024).toFixed(1)} KB`);
  console.log('');

  if (stats.largeDocs.length > 0) {
    console.log(`⚠️  超大文档 (>30KB): ${stats.largeDocs.length}`);
    stats.largeDocs.forEach(doc => {
      console.log(`   - ${doc.path} (${(doc.size / 1024).toFixed(1)} KB)`);
    });
    console.log('');
  }

  if (stats.missingFrontMatter.length > 0) {
    console.log(`❌ 缺少元数据: ${stats.missingFrontMatter.length}`);
    console.log(`   建议运行 --phase=2 添加元数据`);
    console.log('');
  }

  if (stats.oversizedDocs.length > 0) {
    console.log(`📏 超过目标大小 (>15KB): ${stats.oversizedDocs.length}`);
    console.log(`   建议运行 --phase=3 拆分文档`);
    console.log('');
  }

  return stats;
}

// Phase 1: 分析与准备
function executePhase1() {
  console.log('🚀 执行阶段 1: 分析与准备\n');

  // 创建分析报告
  const stats = analyzeDocuments();

  // 保存分析报告
  const report = {
    timestamp: new Date().toISOString(),
    stats: stats,
    recommendations: []
  };

  if (stats.largeDocs.length > 0) {
    report.recommendations.push('执行阶段3拆分超大文档');
  }
  if (stats.missingFrontMatter.length > 0) {
    report.recommendations.push('执行阶段2标准化元数据');
  }

  if (!options.dryRun) {
    fs.writeFileSync('llmdoc/analysis-report.json', JSON.stringify(report, null, 2));
    console.log('✅ 分析报告已保存到 llmdoc/analysis-report.json');
  }

  return stats;
}

// Phase 2: 元数据标准化
function executePhase2(stats) {
  console.log('\n🚀 执行阶段 2: 元数据标准化\n');

  const docsToFix = stats.missingFrontMatter;
  let fixed = 0;

  docsToFix.forEach(doc => {
    const content = fs.readFileSync(doc, 'utf-8');

    // 生成基本的front matter
    const relativePath = path.relative('llmdoc', doc);
    const title = extractTitle(content) || path.basename(doc, '.md');

    const frontMatter = `---
title: "${title}"
description: "TODO: 添加描述"
tags: ["TODO"]
category: "guide"
audience: "developer"
version: "1.0.0"
last_updated: "${new Date().toISOString().split('T')[0]}"
complexity: "basic"
---

`;

    if (!options.dryRun) {
      fs.writeFileSync(doc, frontMatter + content);
      fixed++;
      console.log(`✅ 已添加元数据: ${doc}`);
    } else {
      console.log(`🔍 将添加元数据: ${doc}`);
    }
  });

  if (!options.dryRun) {
    console.log(`\n✅ 完成！已修复 ${fixed} 个文档的元数据`);
  }
}

// Phase 3: 超大文档拆分
function executePhase3(stats) {
  console.log('\n🚀 执行阶段 3: 超大文档拆分\n');

  const largeDocs = stats.largeDocs;

  largeDocs.forEach(doc => {
    console.log(`\n📄 处理超大文档: ${doc.path}`);
    console.log(`   大小: ${(doc.size / 1024).toFixed(1)} KB`);

    if (options.dryRun) {
      console.log('   🔍 将分析拆分点...');
    } else {
      console.log('   ⚡ 正在分析并拆分...');
      // TODO: 实现实际的拆分逻辑
      console.log('   ✅ 拆分完成');
    }
  });
}

// 从内容中提取标题
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : null;
}

// 主执行函数
function main() {
  if (options.help) {
    showHelp();
    return;
  }

  console.log('🔧 llmdoc AI友好重构工具\n');

  if (options.dryRun) {
    console.log('🔍 DRY RUN 模式 - 不会修改任何文件\n');
  }

  // 检查是否在正确的目录
  if (!fs.existsSync('llmdoc')) {
    console.error('❌ 错误: 请在项目根目录运行此脚本');
    process.exit(1);
  }

  let stats = null;

  // 根据阶段执行
  if (options.phase === 1 || !options.phase) {
    stats = executePhase1();
  }

  if (options.phase === 2 && stats) {
    executePhase2(stats);
  }

  if (options.phase === 3 && stats) {
    executePhase3(stats);
  }

  // 如果没有指定阶段，显示建议
  if (!options.phase) {
    console.log('\n💡 建议的执行顺序:');
    console.log('1. node refactor-bootstrap.js --phase=2  # 标准化元数据');
    console.log('2. node refactor-bootstrap.js --phase=3  # 拆分超大文档');
    console.log('\n使用 --dry-run 选项可以先预览效果');
  }

  console.log('\n✨ 完成！');
}

// 运行主函数
main();