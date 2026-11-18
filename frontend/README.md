# weavroafront-summary

weavroa 文本总结能力 Web 前端，提供**全文总结**可视化操作页面，对话式界面、流式逐字呈现总结结果。

## 关于我们

超级太乙（https://tyeeai.com/）是一家面向企业提供AI应用落地与数智化转型服务的科技公司。

### 场景推荐

- 会议纪要整理：将冗长的会议记录一键提炼为目标、结论、行动项等结构化要点
- 文档要点提炼：长文、报告、客服对话记录的快速摘要，保留核心信息、去除口语化表达

## 功能特性

| 页面 | 说明 |
|------|------|
| 全文总结 | 粘贴或输入长文发送总结，对话式界面流式逐字呈现结果；支持生成中「停止」、一键「清空」对话，Enter 发送 / Shift+Enter 换行 |

## 技术栈

- Vue 3 + Vite
- vue-router 4

## 快速开始

### 环境要求

- Node.js 20+
- 后端服务 [weavroa-summary](../)（默认 `http://127.0.0.1:8080`）

### 安装与运行

```bash
# 安装依赖
npm install

# 开发模式（默认端口 5173，/api 请求代理到 127.0.0.1:8080）
npm run dev

# 生产构建（产物输出到 dist/，路由 base 为 /tool/）
npm run build
```

## 环境变量

`.env.development` 中均为可选配置：

| 变量 | 说明 |
|------|------|
| `VITE_SUMMARY_API_URL` | 总结接口完整 URL（如生产直连）；未设置时使用相对路径 `/api/v1/summary` |
| `VITE_API_BASE_URL` | 后端根地址，所有接口走同一域名时设置（需后端配置 CORS） |

## 目录结构

```
src/
├── assets/           # 页面背景图
├── pages/
│   └── summary/      # 全文总结页（含流式请求与负载解析 api）
├── utils/            # 流式负载文本提取工具
└── router/           # 路由配置
```

## License

本项目基于 [Apache License 2.0](./LICENSE) 协议开源。