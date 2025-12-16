#!/usr/bin/env node

/**
 * 文档验证脚本
 * 检查文档的大小、元数据、链接等AI友好属性
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

class DocumentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      total: 0,
      valid: 0,
      invalid: 0,
      warnings: 0
    };
  }

  /**
   * 验证所有文档
   */
  async validateAll(pattern = 'llmdoc/**/*.md') {
    console.log('🔍 开始文档验证...\n');

    const files = glob.sync(pattern);
    this.stats.total = files.length;

    for (const file of files) {
      await this.validateFile(file);
    }

    this.printSummary();
    return this.stats.invalid === 0;
  }

  /**
   * 验证单个文件
   */
  async validateFile(filePath) {
    console.log(`📄 验证: ${filePath}`);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);

      let fileValid = true;

      // 1. 检查文件大小
      if (!this.checkFileSize(filePath, stats.size)) {
        fileValid = false;
      }

      // 2. 检查元数据
      const metadata = this.extractMetadata(content);
      if (!this.checkMetadata(filePath, metadata)) {
        fileValid = false;
      }

      // 3. 检查行数
      const lines = content.split('\n').length;
      if (!this.checkLineCount(filePath, lines, metadata)) {
        fileValid = false;
      }

      // 4. 检查内部链接
      await this.checkInternalLinks(filePath, content);

      // 5. 检查代码块
      this.checkCodeBlocks(filePath, content);

      // 6. 检查图片链接
      this.checkImageLinks(filePath, content);

      // 7. 检查AI标记
      this.checkSemanticTags(filePath, content);

      if (fileValid) {
        this.stats.valid++;
        console.log('  ✅ 通过');
      } else {
        this.stats.invalid++;
        console.log('  ❌ 失败');
      }

    } catch (error) {
      this.addError(filePath, `文件读取失败: ${error.message}`);
      this.stats.invalid++;
      console.log(`  💥 错误: ${error.message}`);
    }

    console.log('');
  }

  /**
   * 检查文件大小
   */
  checkFileSize(filePath, sizeBytes) {
    const sizeKB = Math.round(sizeBytes / 1024);
    const { layer } = this.extractMetadata(fs.readFileSync(filePath, 'utf8'));

    const limits = {
      'overview': { max: 5, recommended: 3 },
      'detailed': { max: 30, recommended: 20 },
      'reference': { max: 100, recommended: 50 }
    };

    const limit = limits[layer] || limits.detailed;

    if (sizeKB > limit.max) {
      this.addError(filePath, `文件过大: ${sizeKB}KB (限制: ${limit.max}KB)`);
      return false;
    } else if (sizeKB > limit.recommended) {
      this.addWarning(filePath, `文件较大: ${sizeKB}KB (推荐: <${limit.recommended}KB)`);
    }

    return true;
  }

  /**
   * 检查行数
   */
  checkLineCount(filePath, lineCount, metadata) {
    const { layer } = metadata;

    const limits = {
      'overview': { max: 200, recommended: 150 },
      'detailed': { max: 800, recommended: 500 },
      'reference': { max: 2000, recommended: 1000 }
    };

    const limit = limits[layer] || limits.detailed;

    if (lineCount > limit.max) {
      this.addError(filePath, `行数过多: ${lineCount}行 (限制: ${limit.max}行)`);
      return false;
    } else if (lineCount > limit.recommended) {
      this.addWarning(filePath, `行数较多: ${lineCount}行 (推荐: <${limit.recommended}行)`);
    }

    return true;
  }

  /**
   * 提取元数据
   */
  extractMetadata(content) {
    const metadataMatch = content.match(/<!-- METADATA_START -->([\s\S]*?)<!-- METADATA_END -->/);

    if (!metadataMatch) {
      return {};
    }

    try {
      const metadataText = metadataMatch[1]
        .replace(/^\s*{\s*|\s*}\s*$/g, '')
        .trim();
      return JSON.parse(`{${metadataText}}`);
    } catch (error) {
      return {};
    }
  }

  /**
   * 检查元数据
   */
  checkMetadata(filePath, metadata) {
    let valid = true;

    // 必需字段检查
    const required = ['title', 'layer', 'category', 'version', 'lastModified', 'tags', 'estimatedReadTime'];
    for (const field of required) {
      if (!metadata[field]) {
        this.addError(filePath, `缺少必需的元数据字段: ${field}`);
        valid = false;
      }
    }

    // 版本号格式检查
    if (metadata.version && !/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/.test(metadata.version)) {
      this.addError(filePath, `版本号格式错误: ${metadata.version} (应为 x.y.z)`);
      valid = false;
    }

    // 日期格式检查
    if (metadata.lastModified && !/^\d{4}-\d{2}-\d{2}$/.test(metadata.lastModified)) {
      this.addError(filePath, `日期格式错误: ${metadata.lastModified} (应为 YYYY-MM-DD)`);
      valid = false;
    }

    // 层级检查
    const validLayers = ['overview', 'detailed', 'reference'];
    if (metadata.layer && !validLayers.includes(metadata.layer)) {
      this.addError(filePath, `无效的文档层级: ${metadata.layer} (应为: ${validLayers.join(', ')})`);
      valid = false;
    }

    // 分类检查
    const validCategories = ['foundations', 'learning', 'reference', 'advanced', 'agent', 'support', 'api', 'tutorial', 'guide', 'demo', 'tool', 'system'];
    if (metadata.category && !validCategories.includes(metadata.category)) {
      this.addError(filePath, `无效的文档分类: ${metadata.category}`);
      valid = false;
    }

    // 标签检查
    if (metadata.tags && (!Array.isArray(metadata.tags) || metadata.tags.length === 0)) {
      this.addError(filePath, 'tags 必须是非空数组');
      valid = false;
    }

    // 阅读时间检查
    if (metadata.estimatedReadTime && (typeof metadata.estimatedReadTime !== 'number' || metadata.estimatedReadTime < 1)) {
      this.addError(filePath, 'estimatedReadTime 必须是大于0的数字');
      valid = false;
    }

    return valid;
  }

  /**
   * 检查内部链接
   */
  async checkInternalLinks(filePath, content) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [...content.matchAll(linkRegex)];

    for (const link of links) {
      const [fullMatch, text, url] = link;

      // 跳过外部链接
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
        continue;
      }

      // 处理相对路径
      const linkPath = path.resolve(path.dirname(filePath), url);

      // 检查文件是否存在
      if (!fs.existsSync(linkPath)) {
        this.addError(filePath, `链接目标不存在: ${url}`);
      } else if (url.endsWith('.md')) {
        // 检查markdown文件是否包含锚点
        const anchorMatch = url.match(/#([^)]+)$/);
        if (anchorMatch) {
          const targetContent = fs.readFileSync(linkPath, 'utf8');
          const anchor = anchorMatch[1];

          // 检查锚点是否存在（简单实现）
          const headingRegex = new RegExp(`^#{1,6}\\s+.*${anchor.replace(/[-_]/g, '[-_]')}.*$`, 'im');
          if (!headingRegex.test(targetContent)) {
            this.addWarning(filePath, `锚点可能不存在: ${anchor}`);
          }
        }
      }
    }
  }

  /**
   * 检查代码块
   */
  checkCodeBlocks(filePath, content) {
    // 统计代码块
    const codeBlocks = content.match(/```(\w+)?\n([\s\S]*?)```/g) || [];
    const codeBlockCount = codeBlocks.length;

    if (codeBlockCount > 20) {
      this.addWarning(filePath, `代码块过多: ${codeBlockCount}个 (推荐: <20个)`);
    }

    // 检查语言标记
    for (const block of codeBlocks) {
      const langMatch = block.match(/```(\w+)/);
      if (!langMatch) {
        this.addWarning(filePath, '代码块缺少语言标记');
      } else {
        const lang = langMatch[1];
        const validLangs = ['typescript', 'javascript', 'glsl', 'json', 'bash', 'html', 'css', 'yaml', 'md'];
        if (!validLangs.includes(lang.toLowerCase())) {
          this.addWarning(filePath, `未知代码语言: ${lang}`);
        }
      }
    }
  }

  /**
   * 检查图片链接
   */
  checkImageLinks(filePath, content) {
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [...content.matchAll(imgRegex)];

    for (const img of images) {
      const [fullMatch, alt, src] = img;

      // 检查alt文本
      if (!alt || alt.trim().length === 0) {
        this.addWarning(filePath, '图片缺少alt文本');
      }

      // 检查文件是否存在（仅限相对路径）
      if (!src.startsWith('http') && !fs.existsSync(path.resolve(path.dirname(filePath), src))) {
        this.addError(filePath, `图片文件不存在: ${src}`);
      }
    }
  }

  /**
   * 检查语义标记
   */
  checkSemanticTags(filePath, content) {
    const { layer } = this.extractMetadata(content);

    // 检查必需的语义标记
    const requiredTags = {
      'overview': ['semantic-tag', 'footer-meta'],
      'detailed': ['semantic-section', 'toc-depth'],
      'reference': ['api-documentation', 'api-index']
    };

    const tags = requiredTags[layer] || [];

    for (const tag of tags) {
      const tagRegex = new RegExp(`<${tag}`, 'g');
      if (!tagRegex.test(content)) {
        this.addWarning(filePath, `缺少推荐的语义标记: ${tag}`);
      }
    }

    // 检查自定义标记
    const customTagRegex = /<(\w+)(?:\s[^>]*)?>/g;
    const customTags = [...new Set([...content.matchAll(customTagRegex)].map(m => m[1]))];
    const knownTags = new Set([
      'chapter-anchor', 'semantic-tag', 'semantic-section',
      'concept-block', 'concept-grid', 'concept-diagram',
      'terminology-table', 'interactive-nav', 'quick-start-steps',
      'best-practices', 'resource-section', 'metrics-summary',
      'contribution-guide', 'footer-meta', 'related-articles',
      'document-overview', 'auto-toc', 'algorithm-block',
      'performance-metrics', 'step-by-step', 'use-case-collection',
      'troubleshooting-guide', 'toc-depth', 'api-documentation',
      'api-index', 'module-exports', 'api-class', 'constructor-detail',
      'property-detail', 'method-detail', 'api-types', 'api-enums',
      'api-interfaces', 'quick-reference', 'changelog', 'api-footer'
    ]);

    for (const tag of customTags) {
      if (!knownTags.has(tag) && tag !== 'div' && tag !== 'span' && !tag.startsWith('h')) {
        this.addWarning(filePath, `未知语义标记: ${tag}`);
      }
    }
  }

  /**
   * 添加错误
   */
  addError(filePath, message) {
    this.errors.push({ file: filePath, message });
  }

  /**
   * 添加警告
   */
  addWarning(filePath, message) {
    this.warnings.push({ file: filePath, message });
    this.stats.warnings++;
  }

  /**
   * 打印总结
   */
  printSummary() {
    console.log('\n📊 验证总结:');
    console.log(`  总文档数: ${this.stats.total}`);
    console.log(`  ✅ 通过: ${this.stats.valid}`);
    console.log(`  ❌ 失败: ${this.stats.invalid}`);
    console.log(`  ⚠️  警告: ${this.stats.warnings}`);

    if (this.errors.length > 0) {
      console.log('\n❌ 错误列表:');
      this.errors.forEach(error => {
        console.log(`  ${error.file}: ${error.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  警告列表:');
      this.warnings.forEach(warning => {
        console.log(`  ${warning.file}: ${warning.message}`);
      });
    }

    if (this.stats.invalid === 0) {
      console.log('\n🎉 所有文档验证通过！');
    } else {
      console.log(`\n💥 ${this.stats.invalid} 个文档需要修复`);
      process.exit(1);
    }
  }
}

// 命令行接口
if (require.main === module) {
  const validator = new DocumentValidator();
  const pattern = process.argv[2] || 'llmdoc/**/*.md';

  validator.validateAll(pattern)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('验证过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = DocumentValidator;