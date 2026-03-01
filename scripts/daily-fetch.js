/**
 * AI 新闻抓取 - 严格时间验证版
 * 只推送真实、过去24小时内、可验证时间的新闻
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 可验证的RSS源
const TRUSTED_SOURCES = [
  {
    name: 'arXiv AI',
    url: 'http://export.arxiv.org/rss/cs.AI',
    type: 'academic',
    timeField: 'pubDate'
  },
  {
    name: 'arXiv CS',
    url: 'http://export.arxiv.org/rss/cs.LG',
    type: 'academic',
    timeField: 'pubDate'
  }
];

// 严格时间验证：只保留过去24小时
function isStrictlyRecent(pubDateStr) {
  if (!pubDateStr) return false;
  
  try {
    const pubDate = new Date(pubDateStr);
    const now = new Date();
    
    // 验证日期有效性
    if (isNaN(pubDate.getTime())) {
      console.log(`  ⚠️ 无效日期: ${pubDateStr}`);
      return false;
    }
    
    const hoursDiff = (now - pubDate) / (1000 * 60 * 60);
    
    // 只保留 0-24 小时内的新闻
    if (hoursDiff < 0) {
      console.log(`  ⚠️ 未来时间: ${pubDateStr}`);
      return false;
    }
    
    if (hoursDiff > 24) {
      console.log(`  ⏰ 超过24小时: ${pubDateStr} (${Math.round(hoursDiff)}小时前)`);
      return false;
    }
    
    return true;
  } catch (e) {
    console.log(`  ⚠️ 日期解析失败: ${pubDateStr}`);
    return false;
  }
}

// 获取RSS
async function fetchRSS(url) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`  ✗ 抓取失败: ${error.message}`);
    return null;
  }
}

// 解析RSS
function parseRSS(xml) {
  if (!xml) return [];
  
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    
    const title = cleanText(extractTag(content, 'title'));
    const link = cleanText(extractTag(content, 'link'));
    const pubDate = extractTag(content, 'pubDate');
    const description = cleanText(extractTag(content, 'description'));
    
    if (title && link && pubDate) {
      items.push({ title, link, pubDate: pubDate.trim(), description });
    }
  }
  
  return items;
}

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1] : null;
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 格式化为本地时间
function formatTime(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Shanghai'
    });
  } catch {
    return '时间未知';
  }
}

// 主函数
async function main() {
  console.log('🚀 AI新闻抓取 - 严格时间验证\n');
  console.log(`当前时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('只保留过去24小时内的真实新闻\n');
  
  const allArticles = [];
  
  for (const source of TRUSTED_SOURCES) {
    console.log(`🔍 ${source.name}`);
    console.log(`   URL: ${source.url}`);
    
    const xml = await fetchRSS(source.url);
    
    if (!xml) {
      console.log('   ✗ 无法获取内容\n');
      continue;
    }
    
    const items = parseRSS(xml);
    console.log(`   📄 原始条目: ${items.length}`);
    
    // 严格时间过滤
    const recentItems = items.filter(item => {
      const isRecent = isStrictlyRecent(item.pubDate);
      if (isRecent) {
        console.log(`   ✅ ${formatTime(item.pubDate)} - ${item.title.substring(0, 30)}...`);
      }
      return isRecent;
    });
    
    console.log(`   📝 24小时内: ${recentItems.length} 条\n`);
    
    allArticles.push(...recentItems.map(item => ({
      ...item,
      source: source.name,
      displayTime: formatTime(item.pubDate)
    })));
  }
  
  console.log('='.repeat(50));
  console.log(`📊 总计: ${allArticles.length} 条真实新闻\n`);
  
  // 如果不够3条，说明今天确实新闻少
  if (allArticles.length < 3) {
    console.log('⚠️ 提示: 24小时内高价值AI新闻较少');
  }
  
  // 去重（按链接）
  const seen = new Set();
  const unique = [];
  for (const a of allArticles) {
    if (!seen.has(a.link)) {
      seen.add(a.link);
      unique.push(a);
    }
  }
  
  // 取前5条
  const topArticles = unique.slice(0, 5);
  
  // 生成报告
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  
  let report;
  
  if (topArticles.length === 0) {
    report = `🤖 **AI Daily Brief - ${today}**

📭 过去24小时内高价值AI新闻较少，暂无新内容推送。

⏰ 数据验证时间：${new Date().toLocaleString('zh-CN')}

💡 推荐阅读：访问 https://zyzjump.github.io/ai-daily-brief/ 查看历史归档`;
  } else {
    report = `🤖 **AI Daily Brief - ${today}**

📊 过去24小时内 **${topArticles.length}** 条已验证的AI资讯

⏰ 数据抓取时间：${new Date().toLocaleString('zh-CN')}

`;
    
    topArticles.forEach((a, i) => {
      report += `${i + 1}. **${a.title}**
   📰 ${a.source}
   🕐 ${a.displayTime}
   🔗 ${a.link}
`;
      
      if (a.description && a.description.length > 10) {
        const summary = a.description.length > 100 ? 
          a.description.substring(0, 100) + '...' : 
          a.description;
        report += `   📝 ${summary}
`;
      }
      
      report += `
`;
    });
    
    report += `---
✅ 所有新闻均已验证发布时间（过去24小时内）
📬 每日自动推送 · 来源：arXiv等权威学术平台
🌐 完整归档：https://zyzjump.github.io/ai-daily-brief/`;
  }
  
  // 保存
  const outputDir = path.join(process.cwd(), 'output');
  await fs.mkdir(outputDir, {recursive: true});
  await fs.writeFile(path.join(outputDir, 'daily-report.txt'), report, 'utf8');
  await fs.writeFile(path.join(outputDir, 'articles.json'), JSON.stringify(topArticles, null, 2), 'utf8');
  
  console.log('\n📤 生成报告:');
  console.log(report);
  
  return { report, articles: topArticles };
}

main().catch(console.error);
