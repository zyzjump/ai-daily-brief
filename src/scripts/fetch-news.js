/**
 * AI 新闻抓取主脚本
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 模拟从多个来源获取数据
async function fetchAllSources() {
  const today = new Date().toISOString().split('T')[0];
  
  // 示例数据 - 实际使用时会接入真实API
  const articles = [
    {
      title: "OpenAI 发布 GPT-4.5：推理能力大幅提升，支持 200K 上下文",
      url: "https://openai.com/blog/gpt-4-5",
      source: "OpenAI Blog",
      type: "大模型",
      category: "product",
      date: today,
      summary: "GPT-4.5 在数学推理和代码生成方面提升 40%，定价与 GPT-4 持平。",
      credibility: 9
    },
    {
      title: "Google DeepMind 开源 Gemma 3：轻量级开源模型新标杆",
      url: "https://blog.google/technology/ai/gemma-3/",
      source: "Google Blog",
      type: "开源模型",
      category: "breakthrough",
      date: today,
      summary: "Gemma 3 在 2B 参数规模下达到 Llama-3 7B 水平，支持 128K 上下文。",
      credibility: 9
    },
    {
      title: "Anthropic 完成 40 亿美元融资，估值突破 600 亿美元",
      url: "https://www.anthropic.com/news/",
      source: "Anthropic",
      type: "融资",
      category: "industry",
      date: today,
      summary: "亚马逊领投，资金将用于 Claude 下一代模型训练和计算资源扩张。",
      credibility: 8
    },
    {
      title: "arXiv 今日 AI 论文精选：多模态学习新框架 MoE-CLIP",
      url: "https://arxiv.org/abs/2403.xxxxx",
      source: "arXiv",
      type: "研究论文",
      category: "breakthrough",
      date: today,
      summary: "提出混合专家架构的视觉-语言预训练方法，效率提升 3 倍。",
      credibility: 8
    },
    {
      title: "Hugging Face 发布 Transformers.js v3：浏览器端大模型推理",
      url: "https://huggingface.co/blog/transformersjs-v3",
      source: "Hugging Face",
      type: "开源工具",
      category: "product",
      date: today,
      summary: "支持在浏览器中直接运行 LLM，无需后端服务器。",
      credibility: 8
    }
  ];
  
  return articles;
}

function generateBriefContent(date, articles) {
  const top5 = articles.slice(0, 5);
  
  const overview = `今日AI领域重点关注：${top5.map(a => a.type).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join('、')}等方向，共收录${articles.length}条重要动态。`;
  
  return `---
title: "AI Daily Briefing – ${date}"
date: "${date}"
summary: "${overview}"
---

# AI Daily Briefing – ${date}

<div class="lead-text">
${overview}
</div>

---

## 🔥 Top 5 重点

${top5.map((a, i) => `### ${i + 1}. ${a.title}

**一句话结论**：${a.summary}

**为什么重要**：${getImportanceReason(a)}

**来源**：[${a.source}](${a.url})
`).join('\n')}

---

## 📊 今日趋势

- **大模型竞争加剧**：OpenAI、Google 同日发布重要更新
- **开源生态繁荣**：Hugging Face 持续推动浏览器端 AI 普及
- **资本热度不减**：Anthropic 大额融资显示市场对 AI 信心

---

*本摘要由 AI 自动生成 · 最后更新：${new Date().toLocaleString('zh-CN')}*
`;
}

function getImportanceReason(article) {
  const reasons = {
    'breakthrough': '技术突破，可能推动行业范式转变',
    'product': '重要产品发布，影响开发者和用户',
    'industry': '资本动态，反映市场趋势和信心',
    'policy': '政策监管，影响行业合规与发展'
  };
  return reasons[article.category] || '综合评估为当日高价值资讯';
}

async function main() {
  try {
    console.log('🚀 开始生成 AI 日报...');
    
    const today = new Date().toISOString().split('T')[0];
    const briefPath = path.join(process.cwd(), 'src/content/briefs', `${today}.mdx`);
    
    // 检查是否已存在
    try {
      await fs.access(briefPath);
      console.log(`✅ ${today} 的文章已存在，跳过`);
      return;
    } catch {
      // 继续生成
    }
    
    const articles = await fetchAllSources();
    console.log(`📊 获取到 ${articles.length} 条资讯`);
    
    const content = generateBriefContent(today, articles);
    
    await fs.mkdir(path.dirname(briefPath), { recursive: true });
    await fs.writeFile(briefPath, content, 'utf8');
    
    console.log(`✅ 已生成：${briefPath}`);
    
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

main();
