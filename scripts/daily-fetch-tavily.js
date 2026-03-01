/**
 * AI 新闻抓取 - Tavily直接调用版
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TAVILY_API_KEY = "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";

const SEARCH_QUERIES = [
  'AI news today OpenAI Anthropic Google latest',
  'artificial intelligence breakthrough 2026',
  '大模型 AI新闻今日 机器之心 量子位',
  'LLM release announcement today'
];

async function tavilySearch(query) {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: 'advanced',
        max_results: 5,
        include_answer: false,
        include_images: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`搜索失败 "${query}": ${error.message}`);
    return [];
  }
}

function isWithin24Hours(dateStr) {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const hoursDiff = (new Date() - date) / (1000 * 60 * 60);
    return hoursDiff >= 0 && hoursDiff <= 24;
  } catch { return false; }
}

function scoreArticle(item) {
  const text = ((item.title || '') + ' ' + (item.content || '')).toLowerCase();
  let score = 0;
  
  const keywords = {
    5: ['gpt', 'claude', 'gemini', 'llama', 'breakthrough', 'release', 'launch'],
    3: ['openai', 'anthropic', 'google', 'meta', 'nvidia', 'microsoft'],
    2: ['ai', '大模型', 'artificial intelligence', 'funding', '开源'],
    1: ['machine learning', 'research']
  };
  
  for (const [w, words] of Object.entries(keywords)) {
    words.forEach(word => { if (text.includes(word)) score += parseInt(w); });
  }
  
  return score;
}

function formatTime(dateStr) {
  try {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch { return '今日'; }
}

async function main() {
  console.log('🚀 Tavily AI新闻抓取\n');
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}\n`);
  
  const allResults = [];
  
  for (const query of SEARCH_QUERIES) {
    console.log(`🔍 ${query}`);
    const results = await tavilySearch(query);
    console.log(`   ✓ ${results.length} 条`);
    allResults.push(...results);
  }
  
  console.log(`\n📊 总计: ${allResults.length} 条`);
  
  // 去重
  const seen = new Set();
  const unique = allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
  
  console.log(`🔄 去重: ${unique.length} 条`);
  
  // 时间验证
  const recent = unique.filter(r => {
    if (r.published_date) {
      return isWithin24Hours(r.published_date);
    }
    // 无明确时间，但高分的保留（标记未验证）
    return scoreArticle(r) >= 5;
  });
  
  console.log(`⏰ 24h内/高分: ${recent.length} 条\n`);
  
  // 评分排序
  const scored = recent.map(r => ({...r, score: scoreArticle(r)}))
    .sort((a, b) => b.score - a.score);
  
  const top5 = scored.slice(0, 5);
  
  console.log('📝 Top 5:');
  top5.forEach((a, i) => {
    const verified = a.published_date && isWithin24Hours(a.published_date);
    console.log(`  ${i+1}. [${a.score}分${verified ? '✅' : ''}] ${a.title?.substring(0, 35)}...`);
  });
  
  // 生成报告
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });
  
  let report = `🤖 **AI Daily Brief - ${today}**

📊 精选 **${top5.length}** 条AI资讯
⏰ 抓取: ${new Date().toLocaleString('zh-CN')}

`;
  
  if (top5.length === 0) {
    report += '📭 今日高价值AI新闻较少\n';
  } else {
    top5.forEach((a, i) => {
      const verified = a.published_date && isWithin24Hours(a.published_date);
      const timeStr = a.published_date ? formatTime(a.published_date) : '今日';
      
      report += `${i+1}. **${a.title}**
   ${verified ? '✅' : '◆'} ${timeStr}
   🔗 ${a.url}
`;
      if (a.content) {
        report += `   📝 ${a.content.substring(0, 60)}...\n`;
      }
      report += '\n';
    });
  }
  
  report += `---
✅=时间已验证(24h内) ◆=高分但未完全验证时间
🌐 https://zyzjump.github.io/ai-daily-brief/`;
  
  // 保存
  const outputDir = path.join(process.cwd(), 'output');
  await fs.mkdir(outputDir, {recursive: true});
  await fs.writeFile(path.join(outputDir, 'tavily-report.txt'), report, 'utf8');
  
  console.log('\n📤 报告:');
  console.log(report);
  
  return report;
}

main().catch(console.error);
