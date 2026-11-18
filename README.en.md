# weavroa-summary

Text summarization capability service providing **full-text structured summarization** (SSE streaming output). It can be run, packaged, and deployed independently.

## About Us

Super Taiyi (https://tyeeai.com/) is a technology company that provides AI application implementation and digital transformation services for enterprises.

### Recommended Scenarios

- Meeting minutes organization: distill lengthy meeting records into structured key points such as goals, conclusions, and action items with one click
- Document key-point extraction: quick summaries of long articles, reports, and customer service conversations, preserving core information while removing colloquial expressions

## Features

| Capability | Description |
|------|------|
| Full-text Summarization | Input any long text; a built-in information-organizing prompt drives the chat model to produce concise, structured summaries |
| Streaming Output | SSE returns text increments frame by frame, rendered in real time with a typewriter effect on the frontend |
| Key-point Extraction | Prioritizes goals, issues, conclusions, times, people, and key data; action items are listed separately |

Built-in chat model access layer (`com.eniac.weavroa.llm`), based on the OpenAI-compatible protocol; any compatible model can be registered via configuration.

## Frontend UI

The accompanying web frontend is located in [`frontend/`](./frontend), providing a visual page for full-text summarization with streaming typewriter effect and one-click stop. See [frontend/README.md](./frontend/README.md) for details.

## Getting Started

### Prerequisites

- JDK 21+
- Maven 3.6+ (or use the bundled Maven Wrapper)

### Run

```bash
export DASHSCOPE_API_KEY=your-bailian-api-key

# Development mode
./mvnw spring-boot:run

# Package
./mvnw -DskipTests package

# Deploy
java -jar target/weavroa-summary-standalone-0.0.1-SNAPSHOT.jar
```

Default port `8080` (configurable via `server.port`).

## Configuration

```yaml
weavroa:
  llm:
    model:
      register:
        TEXT:
          - name: qwen-plus             # Chat model for summarization; replaceable with any OpenAI-compatible model
            base-url: https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
            api-key: ${DASHSCOPE_API_KEY:}
```

All keys are injected via environment variables; no hardcoded keys exist in code or configuration.

## REST API

| Method | Path | Description |
|------|------|------|
| POST | `/api/v1/summary` | Full-text summarization (SSE streaming), request body `{ "message": "text to summarize" }` |

The response is an SSE stream; each `data:` frame has the structure `{ "data": "text increment", "message": "success", "code": "200" }`.

## Tech Stack

- Spring Boot 3.5.4 (Web Starter + WebFlux, Java 21)
- lombok

## License

This project is open-sourced under the [Apache License 2.0](./LICENSE).