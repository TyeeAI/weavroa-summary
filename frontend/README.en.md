# weavroafront-summary

Web frontend for the weavroa text summarization capability, providing a visual **full-text summarization** page with a conversational UI and streaming word-by-word rendering of results.

## About Us

Super Taiyi (https://tyeeai.com/) is a technology company that provides AI application implementation and digital transformation services for enterprises.

### Recommended Scenarios

- Meeting minutes organization: distill lengthy meeting records into structured key points such as goals, conclusions, and action items with one click
- Document key-point extraction: quick summaries of long articles, reports, and customer service conversations, preserving core information while removing colloquial expressions

## Features

| Page | Description |
|------|------|
| Full-text Summarization | Paste or type long text and send it for summarization; results stream word by word in a conversational UI. Supports "Stop" during generation, one-click "Clear" of the conversation, Enter to send / Shift+Enter for a new line |

## Tech Stack

- Vue 3 + Vite
- vue-router 4

## Getting Started

### Prerequisites

- Node.js 20+
- Backend service [weavroa-summary](../) (default `http://127.0.0.1:8080`)

### Install & Run

```bash
# Install dependencies
npm install

# Development mode (default port 5173, /api requests proxied to 127.0.0.1:8080)
npm run dev

# Production build (output to dist/, router base is /tool/)
npm run build
```

## Environment Variables

All entries in `.env.development` are optional:

| Variable | Description |
|------|------|
| `VITE_SUMMARY_API_URL` | Full URL of the summarization API (e.g. direct production connection); defaults to the relative path `/api/v1/summary` when unset |
| `VITE_API_BASE_URL` | Backend root address; set when all APIs share one domain (backend CORS required) |

## Directory Structure

```
src/
├── assets/           # Page background image
├── pages/
│   └── summary/      # Full-text summarization page (with streaming request and payload parsing api)
├── utils/            # Stream payload text extraction utility
└── router/           # Router configuration
```

## License

This project is open-sourced under the [Apache License 2.0](./LICENSE).