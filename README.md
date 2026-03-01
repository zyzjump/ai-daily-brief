# AI Daily Brief

🤖 每日AI行业值得关心的新闻摘要。自动抓取、智能排序、人工可读。

**在线访问**: https://your-username.github.io/ai-daily-brief

---

## 🚀 快速部署

### 1. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名填写：`ai-daily-brief`
3. 选择 **Public**
4. 点击 **Create repository**

### 2. 推送代码

```bash
# 在项目目录中执行
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-daily-brief.git
git push -u origin main
```

### 3. 启用 GitHub Pages

1. 打开仓库 → **Settings** → **Pages**
2. **Source** 选择 **GitHub Actions**
3. 保存

### 4. 访问网站

等待 2-3 分钟后访问：
```
https://YOUR_USERNAME.github.io/ai-daily-brief/
```

---

## 🛠️ 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run fetch    # 生成今日文章
npm run build    # 构建
```

---

## ⚙️ 自动更新

- **定时任务**: 每天北京时间 09:00 自动抓取并部署
- **手动触发**: Actions → Deploy to GitHub Pages → Run workflow

---

## 📝 License

MIT
