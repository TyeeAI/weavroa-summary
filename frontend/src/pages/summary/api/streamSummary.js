/**
 * 全文摘要 —— 流式请求封装（与页面 `summary/index.vue` 配合使用）。
 *
 * 请求约定：
 * - 方法 POST，请求体 JSON：`{ message: string }`
 * - 与后端同域或经网关代理，避免浏览器 CORS（本地开发见 vite.config.js 的 `/api` → 8080）
 *
 * 响应分流（由响应头 Content-Type 决定）：
 * - `text/event-stream`：按 SSE 解析，逐行处理 `data:` 负载
 * - 其它（如 `application/json`、NDJSON）：按换行缓冲，每行一条 JSON，结构见 `summaryStreamEnvelope.js`（`data` 为字符串增量）
 *
 * 环境变量 `VITE_SUMMARY_API_URL`：可设为完整 URL（如生产直连）；未设置时使用相对路径 `/api/v1/summary`
 */
import { summaryStreamPayloadToDelta } from './summaryStreamEnvelope.js'

export const SUMMARY_STREAM_URL =
  import.meta.env.VITE_SUMMARY_API_URL ?? '/api/v1/summary'

/**
 * 处理 SSE 中的一整行（不含换行符）；负载解析规则见 `extractStreamPayloadText.js`（优先 `data` 字段）。
 * 标准行：`data: {...}` 或 `data: 纯文本`；也尝试处理无 `data:` 前缀的注释/扩展行。
 * @param {string} line
 * @param {(chunk: string) => void} onDelta 每解析出一段文本即回调，由调用方累加到 UI
 */
function emitSseLine(line, onDelta) {
  const trimmedEnd = line.trimEnd()
  if (!trimmedEnd) {
    return
  }
  if (trimmedEnd.startsWith('data:')) {
    const payload = trimmedEnd.slice(5).trimStart()
    const delta = summaryStreamPayloadToDelta(payload)
    if (delta) {
      onDelta(delta)
    }
  } else {
    const delta = summaryStreamPayloadToDelta(trimmedEnd)
    if (delta) {
      onDelta(delta)
    }
  }
}

/**
 * 发起摘要请求并消费响应体流，通过 `onDelta` 增量输出文本（用于聊天区打字效果）。
 *
 * @param {string} message 用户输入的全文或段落，对应后端 JSON 字段 `message`
 * @param {{ onDelta: (chunk: string) => void, signal?: AbortSignal }} options
 * @param {AbortSignal} [options.signal] 传入后可中止 fetch 与 reader（例如用户点击「停止」）
 * @returns {Promise<void>} 流正常结束或抛错；用户中止时 fetch 抛出 `AbortError`
 */
export async function postSummaryStream(message, { onDelta, signal }) {
  const response = await fetch(SUMMARY_STREAM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream, application/json, text/plain, */*',
    },
    body: JSON.stringify({ message }),
    signal,
  })

  if (!response.ok) {
    // 非 2xx 时通常无流或流未按约定开始，整段读文本便于排错
    const errText = await response.text().catch(() => '')
    throw new Error(errText || `请求失败（${response.status}）`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('当前环境不支持 ReadableStream，无法读取流式响应')
  }

  const decoder = new TextDecoder()
  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  const isEventStream = contentType.includes('text/event-stream')

  // ---------- 分支 A：非 SSE，按换行切 NDJSON（每行一个 { data, code, message }）----------
  if (!isEventStream) {
    let carry = ''
    while (true) {
      const { done, value } = await reader.read()
      if (value) {
        carry += decoder.decode(value, { stream: true })
      }
      if (done) {
        carry += decoder.decode()
      }

      let cut
      while ((cut = carry.indexOf('\n')) >= 0) {
        const line = carry.slice(0, cut).trim()
        carry = carry.slice(cut + 1)
        if (line) {
          const delta = summaryStreamPayloadToDelta(line)
          if (delta) {
            onDelta(delta)
          }
        }
      }

      if (done) {
        const tail = carry.trim()
        if (tail) {
          const delta = summaryStreamPayloadToDelta(tail)
          if (delta) {
            onDelta(delta)
          }
        }
        break
      }
    }
    return
  }

  // ---------- 分支 B：SSE，按换行切行再解析 `data:` ----------
  let carry = ''
  while (true) {
    const { done, value } = await reader.read()
    if (value) {
      carry += decoder.decode(value, { stream: true })
    }
    if (done) {
      carry += decoder.decode()
    }

    // 仅处理已完整的行；剩余无换行后缀留在 carry，等待下一包或流结束
    let cut
    while ((cut = carry.indexOf('\n')) >= 0) {
      const line = carry.slice(0, cut)
      carry = carry.slice(cut + 1)
      emitSseLine(line, onDelta)
    }

    if (done) {
      // 最后一行可能没有结尾换行符，仍需输出
      if (carry) {
        emitSseLine(carry, onDelta)
      }
      break
    }
  }
}
