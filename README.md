# AI 计数小工具

口语记分、多项目文件夹、胡牌拍照算番（Gemini / OpenAI 兼容）。数据保存在浏览器本地。

## 在线地址（GitHub Pages）

**https://aivendesigns-pixel.github.io/ai-counter-mahjong/**

> 本站使用仓库 **`docs/`** 目录静态部署。若你 fork 后仓库名变了，请重新执行 `npm run pages:build`（并改 `package.json` 里 `BASE_PATH` 与仓库名一致），再推送。

### 首次在 GitHub 打开 Pages

1. 仓库 **Settings** → **Pages**
2. **Build and deployment** → **Source** 选 **Deploy from a branch**
3. **Branch** 选 `main`，文件夹选 **`/docs`**，Save

之后每次更新前端，在本机执行：

```bash
npm run pages:build
git add docs && git commit -m "chore: update pages" && git push
```

## 本地开发

```bash
npm install
npm run dev
```

## 胡牌算番 API

在应用内 **API 设置** 填写 Key。线上无 Vite 代理时，Gemini Base URL 请用：`https://generativelanguage.googleapis.com/v1beta`。

## 技术栈

Vite + React + TypeScript + Tailwind CSS
