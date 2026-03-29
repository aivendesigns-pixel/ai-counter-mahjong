# AI 计数小工具

口语记分、多项目文件夹、胡牌拍照算番（Gemini / OpenAI 兼容）。数据保存在浏览器本地。

## 在线使用（GitHub Pages）

部署成功后访问：

**https://aivendesigns-pixel.github.io/ai-counter-mahjong/**

（若你 fork 或改了仓库名，把路径里的仓库名换成自己的。）

### 首次启用 Pages

1. 打开 GitHub 仓库 → **Settings** → **Pages**
2. **Build and deployment** → Source 选 **GitHub Actions**
3. 推送任意提交到 `main`，等待 **Actions** 里绿色完成后再打开上面链接

## 本地运行

```bash
npm install
npm run dev
```

## 胡牌算番 API

在应用内 **API 设置** 填写 Key。线上环境无 Vite 代理，Gemini 请使用官方 Base URL：`https://generativelanguage.googleapis.com/v1beta`（若浏览器拦截跨域，需自备代理）。

## 技术栈

Vite + React + TypeScript + Tailwind CSS
