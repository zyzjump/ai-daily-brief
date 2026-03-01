const https = require('https');

const TAVILY_API_KEY = "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";

const queries = [
  'AI artificial intelligence news today March 2026',
  'OpenAI Anthropic Google latest announcement',
  'machine learning breakthrough today',
  '大模型 AI新闻',
  'LLM release today OpenAI GPT'
];

function search(query) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: query,
      search_depth: 'advanced',
      max_results: 5,
      include_answer: false
    });

    const options = {
      hostname: 'api.tavily.com',
      path: '/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('🚀 Tavily AI News Search\n');
  
  const allResults = [];
  
  for (const query of queries) {
    console.log(`🔍 ${query}`);
    try {
      const result = await search(query);
      if (result.results) {
        console.log(`   ✓ ${result.results.length} results`);
        allResults.push(...result.results);
      }
    } catch (e) {
      console.log(`   ✗ ${e.message}`);
    }
  }
  
  console.log(`\n📊 Total: ${allResults.length}`);
  
  // 去重
  const seen = new Set();
  const unique = allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
  
  console.log(`🔄 Unique: ${unique.length}\n`);
  
  // 取前5
  const top5 = unique.slice(0, 5);
  
  console.log('📝 Top 5:');
  top5.forEach((r, i) => {
    console.log(`\n${i+1}. ${r.title}`);
    console.log(`   URL: ${r.url}`);
    if (r.published_date) {
      console.log(`   Date: ${r.published_date}`);
    }
    if (r.content) {
      console.log(`   Summary: ${r.content.substring(0, 100)}...`);
    }
  });
  
  // 生成报告
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });
  
  let report = `🤖 **AI Daily Brief - ${today}**\n\n`;
  report += `📊 Selected ${top5.length} AI news\n`;
  report += `⏰ ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  top5.forEach((r, i) => {
    report += `${i+1}. **${r.title}**\n`;
    report += `   🔗 ${r.url}\n`;
    if (r.content) {
      report += `   📝 ${r.content.substring(0, 80)}...\n`;
    }
    report += '\n';
  });
  
  report += `---\n🌐 https://zyzjump.github.io/ai-daily-brief/`;
  
  console.log('\n📤 Report:');
  console.log(report);
  
  // 保存
  const fs = require('fs');
  const path = require('path');
  const outputDir = path.join(__dirname, '..', 'output');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(outputDir, 'tavily-report.txt'), report, 'utf8');
  console.log('\n✅ Saved to output/tavily-report.txt');
}

main().catch(console.error);
