# weavroa-summary

文本总结能力服务，提供**全文结构化摘要**能力（SSE 流式输出），可独立运行、打包、部署。

## 关于我们

超级太乙（https://tyeeai.com/）是一家面向企业提供AI应用落地与数智化转型服务的科技公司。

### 场景推荐

- 会议纪要整理：将冗长的会议记录一键提炼为目标、结论、行动项等结构化要点
- 文档要点提炼：长文、报告、客服对话记录的快速摘要，保留核心信息、去除口语化表达

## 功能特性

| 能力 | 说明 |
|------|------|
| 全文摘要 | 输入任意长文本，内置信息整理提示词驱动对话模型生成精炼、结构化总结 |
| 流式输出 | SSE 逐帧返回文本增量，前端打字机效果实时呈现 |
| 要点提炼 | 优先提取目标、问题、结论、时间、人物、关键数据，行动项单独列出 |

内置对话模型接入层（`com.eniac.weavroa.llm`），基于 OpenAI 兼容协议，可通过配置注册任意兼容模型。

## 前端界面

配套 Web 前端位于 [`frontend/`](./frontend)，提供全文总结的可视化操作页面，支持流式打字效果与一键停止，详见 [frontend/README.md](./frontend/README.md)。

## 快速开始

### 环境要求

- JDK 21+
- Maven 3.6+（或直接使用项目自带的 Maven Wrapper）

### 启动

```bash
export DASHSCOPE_API_KEY=你的百炼APIKey

# 开发模式
./mvnw spring-boot:run

# 打包
./mvnw -DskipTests package

# 部署运行
java -jar target/weavroa-summary-standalone-0.0.1-SNAPSHOT.jar
```

默认端口 `8080`（可通过 `server.port` 修改）。

## 配置

```yaml
weavroa:
  llm:
    model:
      register:
        TEXT:
          - name: qwen-plus             # 总结用的对话模型，可换成任意 OpenAI 兼容模型
            base-url: https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
            api-key: ${DASHSCOPE_API_KEY:}
```

密钥一律通过环境变量注入，代码与配置中不含任何硬编码密钥。

## REST 接口

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/v1/summary` | 全文摘要（SSE 流式），请求体 `{ "message": "待总结文本" }` |

响应为 SSE 流，每帧 `data:` 负载结构：`{ "data": "文本增量", "message": "success", "code": "200" }`。

## 技术栈

- Spring Boot 3.5.4（Web Starter + WebFlux，Java 21）
- lombok

## License

本项目基于 [Apache License 2.0](./LICENSE) 协议开源。