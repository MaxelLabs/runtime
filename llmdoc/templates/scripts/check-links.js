#!/usr/bin/env node

/**
 * 链接检查脚本
 * 检查文档中的所有链接是否有效
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class LinkChecker {
  constructor() {
    this.checkedUrls = new Map();
    this.errors = [];
    this.warnings = [];
    this.stats = {
      total: 0,
      internal: 0,
      external: 0,
      valid: 0,
      invalid: 0,
      timeout: 0
    };
  }

  /**
   * 检查文档中的所有链接
   */
  async checkFile(filePath) {
    console.log(`🔗 检查链接: ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf8');
    const links = this.extractLinks(content, filePath);
    this.stats.total += links.length;

    for (const link of links) {
      try {
        if (this.isExternalLink(link.url)) {
          this.stats.external++;
          await this.checkExternalLink(link);
        } else {
          this.stats.internal++;
          this.checkInternalLink(link);
        }
      } catch (error) {
        this.addError(link.source, `链接检查失败: ${link.url} - ${error.message}`);
      }
    }
  }

  /**
   * 提取链接
   */
  extractLinks(content, filePath) {
    const links = [];

    // Markdown链接 [text](url)
    const markdownLinks = [...content.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)];
    for (const match of markdownLinks) {
      links.push({
        text: match[1],
        url: match[2],
        line: this.getLineNumber(content, match.index),
        source: filePath,
        type: 'markdown'
      });
    }

    // HTML链接 <a href="url">text</a>
    const htmlLinks = [...content.matchAll(/<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi)];
    for (const match of htmlLinks) {
      links.push({
        text: match[2].replace(/<[^>]*>/g, '').trim(),
        url: match[1],
        line: this.getLineNumber(content, match.index),
        source: filePath,
        type: 'html'
      });
    }

    // 图片链接 ![alt](url)
    const imageLinks = [...content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
    for (const match of imageLinks) {
      links.push({
        text: match[1],
        url: match[2],
        line: this.getLineNumber(content, match.index),
        source: filePath,
        type: 'image'
      });
    }

    return links;
  }

  /**
   * 获取行号
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * 判断是否为外部链接
   */
  isExternalLink(url) {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:');
  }

  /**
   * 检查内部链接
   */
  checkInternalLink(link) {
    const { url, source, line } = link;

    // 处理相对路径
    const linkPath = path.resolve(path.dirname(source), url.split('#')[0]);

    if (!fs.existsSync(linkPath)) {
      this.addError(source, `第${line}行: 链接目标不存在 - ${url}`);
      this.stats.invalid++;
      return;
    }

    // 检查锚点
    const anchorMatch = url.match(/#(.+)$/);
    if (anchorMatch) {
      const anchor = anchorMatch[1].replace(/[-_]/g, '[-_]');
      const targetContent = fs.readFileSync(linkPath, 'utf8');

      // 查找标题
      const headingRegex = new RegExp(`^#{1,6}\\s+.*${anchor}.*$`, 'im');
      const customAnchorRegex = new RegExp(`<[^>]+\\s+id=["']${anchor}["']`, 'i');

      if (!headingRegex.test(targetContent) && !customAnchorRegex.test(targetContent)) {
        this.addWarning(source, `第${line}行: 锚点可能不存在 - ${anchor}`);
      }
    }

    this.stats.valid++;
  }

  /**
   * 检查外部链接
   */
  async checkExternalLink(link) {
    const { url, source, line } = link;

    // 跳过mailto链接
    if (url.startsWith('mailto:')) {
      this.stats.valid++;
      return;
    }

    // 检查缓存
    if (this.checkedUrls.has(url)) {
      const result = this.checkedUrls.get(url);
      if (result.valid) {
        this.stats.valid++;
      } else {
        this.addError(source, `第${line}行: ${result.error} - ${url}`);
        this.stats.invalid++;
      }
      return;
    }

    try {
      const valid = await this.checkUrlExists(url);
      this.checkedUrls.set(url, { valid, error: null });

      if (valid) {
        this.stats.valid++;
      } else {
        this.addError(source, `第${line}行: 链接无效 - ${url}`);
        this.stats.invalid++;
      }
    } catch (error) {
      this.checkedUrls.set(url, { valid: false, error: error.message });

      if (error.message.includes('timeout')) {
        this.addWarning(source, `第${line}行: 链接超时 - ${url}`);
        this.stats.timeout++;
      } else {
        this.addError(source, `第${line}行: ${error.message} - ${url}`);
        this.stats.invalid++;
      }
    }
  }

  /**
   * 检查URL是否存在
   */
  async checkUrlExists(url) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        method: 'HEAD',
        timeout: 10000, // 10秒超时
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)'
        }
      };

      const req = client.request(url, options, (res) => {
        // 重定向处理
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.checkUrlExists(res.headers.location)
            .then(resolve)
            .catch(reject);
        }

        // 成功状态码
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
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
  }

  /**
   * 打印结果
   */
  printResults() {
    console.log('\n📊 链接检查总结:');
    console.log(`  总链接数: ${this.stats.total}`);
    console.log(`  内部链接: ${this.stats.internal}`);
    console.log(`  外部链接: ${this.stats.external}`);
    console.log(`  ✅ 有效链接: ${this.stats.valid}`);
    console.log(`  ❌ 无效链接: ${this.stats.invalid}`);
    console.log(`  ⏰ 超时链接: ${this.stats.timeout}`);

    if (this.errors.length > 0) {
      console.log('\n❌ 无效链接:');
      this.errors.forEach(error => {
        console.log(`  ${error.file}: ${error.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  警告:');
      this.warnings.forEach(warning => {
        console.log(`  ${warning.file}: ${warning.message}`);
      });
    }

    if (this.stats.invalid === 0) {
      console.log('\n🎉 所有链接检查通过！');
    } else {
      console.log(`\n💥 发现 ${this.stats.invalid} 个无效链接`);
    }
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('用法: node check-links.js <file1.md> [file2.md] ...');
    process.exit(1);
  }

  const checker = new LinkChecker();

  async function checkAllFiles() {
    for (const file of args) {
      if (fs.existsSync(file) && file.endsWith('.md')) {
        await checker.checkFile(file);
      } else {
        console.error(`文件不存在或不是markdown文件: ${file}`);
      }
    }

    checker.printResults();
    process.exit(checker.stats.invalid === 0 ? 0 : 1);
  }

  checkAllFiles().catch(error => {
    console.error('检查过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = LinkChecker;