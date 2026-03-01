#!/usr/bin/env node
/**
 * AI Daily Fetch - 每日新闻抓取
 * 由定时任务调用，在服务器环境运行
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "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";

const QUERIES = [
  'AI artificial intelligence news today',
  'OpenAI Anthropic Google AI latest announcement',
  'large language model LLM release today',
  'machine learning breakthrough 2026'
];

function tavilySearch(query) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: query,
      search_depth: 'advanced',
      max_results: 5,
      include_answer: false
    });

    const req = https.request({
      hostname: 'api.tavily.com',
      path: '/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Parse error: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('🔍 Fetching AI news via Tavily...\n');
  
  const allResults = [];
  
  for (const query of QUERIES) {
    try {
      const result = await tavilySearch(query);
      if (result.results) {
        allResults.push(...result.results);
      }
    } catch (e) {
      console.error(`Search failed: ${e.message}`);
    }
  }
  
  // Deduplicate
  const seen = new Set();
  const unique = allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
  
  // Take top 5
  const top5 = unique.slice(0, 5);
  
  // Generate report
  const now = new Date().toLocaleString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });
  
  let report = `🤖 **AI Daily Brief - ${now}**\n\n`;
  report += `📊 ${top5.length} AI news items\n\n`;
  
  top5.forEach((item, i) => {
    report += `${i + 1}. **${item.title}**\n`;
    report += `   🔗 ${item.url}\n`;
    if (item.content) {
      report += `   📝 ${item.content.substring(0, 80)}...\n`;
    }
    report += '\n';
  });
  
  report += `---\n🌐 https://zyzjump.github.io/ai-daily-brief/`;
  
  // Save
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(outputDir, 'daily-report.txt'), report, 'utf8');
  
  console.log(report);
  console.log('\n✅ Saved to output/daily-report.txt');
  
  return report;
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
