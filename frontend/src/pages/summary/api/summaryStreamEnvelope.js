/**
 * 摘要接口流式负载（与后端返回实体对齐）。
 *
 * @typedef {object} SummaryStreamEnvelope
 * @property {string} data 增量文本片段（可为 `""`）
 * @property {string} [message] 如 `"success"`
 * @property {string} [code] 如 `"200"`；非 `200` 时不应拼入正文（由通用解析层过滤）
 *
 * 传输形态：
 * - NDJSON：每行一个 JSON 对象（上述结构）
 * - SSE：`data:` 后为同结构的 JSON 字符串
 * - 单行内 JSON 数组：`[{...},{...}]` 亦支持，按顺序拼接各帧 `data`
 */

import { extractTextFromPayload } from '../../../utils/extractStreamPayloadText.js'

/**
 * 将 NDJSON 一行、或 SSE 中 `data:` 后的一段 JSON，转为要追加到气泡的文本。
 * @param {string} raw
 * @returns {string}
 */
export function summaryStreamPayloadToDelta(raw) {
  return extractTextFromPayload(raw)
}
