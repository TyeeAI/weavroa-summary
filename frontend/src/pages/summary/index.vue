<script setup>
/**
 * AI 全文摘要页：对话 UI + 流式展示。
 * 业务逻辑在后端；本页负责输入、展示与调用 `postSummaryStream`。
 */
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import backgroundImage from '../../assets/image/18347150586858880.jpg'
import { postSummaryStream } from './api/streamSummary.js'

/** 底部输入框文案（发送后清空） */
const inputText = ref('')
/** 对话列表：user 为用户，assistant 为流式累加的摘要回复 */
const messages = ref([])
/** 是否正在拉流（发送中至流结束） */
const isStreaming = ref(false)
/** 非中止类错误时展示在输入区上方 */
const errorMessage = ref('')
/** 消息列表滚动容器，用于新内容到达时滚到底 */
const scrollRef = ref(null)

/** 中止当前 fetch / reader；与「停止」按钮绑定 */
let abortController = null

const pageStyle = computed(() => ({
  '--page-background': `url("${backgroundImage}")`,
}))

const canSend = computed(() => {
  return Boolean(inputText.value.trim()) && !isStreaming.value
})

function scrollToBottom() {
  nextTick(() => {
    const el = scrollRef.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  })
}

function stopStream() {
  abortController?.abort()
  abortController = null
  isStreaming.value = false
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) {
    return
  }

  errorMessage.value = ''
  // 先发用户消息，再占位一条助手消息，流式片段只往最后一条 assistant 上累加
  messages.value.push({ role: 'user', content: text })
  messages.value.push({ role: 'assistant', content: '' })
  const assistantIndex = messages.value.length - 1

  inputText.value = ''
  isStreaming.value = true
  scrollToBottom()

  abortController = new AbortController()

  try {
    await postSummaryStream(text, {
      signal: abortController.signal,
      onDelta(chunk) {
        const current = messages.value[assistantIndex]
        if (current && current.role === 'assistant') {
          current.content += chunk
        }
        scrollToBottom()
      },
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      // 用户主动停止：若尚无内容，给一句占位避免空白气泡
      const current = messages.value[assistantIndex]
      if (current?.role === 'assistant' && !current.content) {
        current.content = '（已停止生成）'
      }
    } else {
      errorMessage.value = err instanceof Error ? err.message : '请求失败'
      const current = messages.value[assistantIndex]
      if (current?.role === 'assistant' && !current.content) {
        current.content = '（未能获取摘要，请检查后端服务或网络）'
      }
    }
  } finally {
    isStreaming.value = false
    abortController = null
    scrollToBottom()
  }
}

/** Enter 发送；Shift+Enter 保留为换行（textarea 默认行为） */
function handleComposerKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

function clearChat() {
  // 流进行中先中止请求，避免列表清空后回调仍写旧下标
  if (isStreaming.value) {
    stopStream()
  }
  messages.value = []
  errorMessage.value = ''
}

onBeforeUnmount(() => {
  // 离开页面时释放连接，避免后台仍读流
  stopStream()
})
</script>

<template>
  <main class="page-shell summary-page-shell" :style="pageStyle">
    <div class="page-mask"></div>

    <section class="summary-layout">
      <header class="summary-hero">
        <p class="hero-badge">AI Summary</p>
        <h1 class="hero-title">全文摘要与要点提炼</h1>
        <p class="hero-subtitle">
          粘贴或输入长文，由后端完成理解与总结；下方为对话式界面，回复以流式逐字呈现。
        </p>
      </header>

      <div class="chat-card">
        <div class="chat-toolbar">
          <span class="chat-toolbar-label">对话</span>
          <button type="button" class="ghost-button" :disabled="isStreaming" @click="clearChat">
            清空
          </button>
        </div>

        <div ref="scrollRef" class="chat-scroll">
          <div v-if="messages.length === 0" class="chat-empty">
            <p class="chat-empty-title">开始一段对话</p>
            <p class="chat-empty-desc">在底部输入框粘贴文章或段落，发送后等待流式摘要结果。</p>
          </div>

          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="chat-row"
            :class="msg.role === 'user' ? 'is-user' : 'is-assistant'"
          >
            <div class="chat-bubble">
              <span class="chat-role">{{ msg.role === 'user' ? '你' : '摘要' }}</span>
              <p class="chat-text">{{ msg.content }}</p>
              <span v-if="msg.role === 'assistant' && isStreaming && index === messages.length - 1" class="typing-cursor" />
            </div>
          </div>
        </div>

        <p v-if="errorMessage" class="chat-error">{{ errorMessage }}</p>

        <div class="composer">
          <textarea
            v-model="inputText"
            class="composer-input"
            rows="3"
            placeholder="在此输入或粘贴需要总结的全文…（Enter 发送，Shift+Enter 换行）"
            :disabled="isStreaming"
            @keydown="handleComposerKeydown"
          />
          <div class="composer-actions">
            <button
              v-if="isStreaming"
              type="button"
              class="stop-button"
              @click="stopStream"
            >
              停止
            </button>
            <button
              type="button"
              class="send-button"
              :disabled="!canSend"
              @click="handleSend"
            >
              <span v-if="isStreaming" class="button-spinner" />
              <span v-else>发送</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.summary-page-shell {
  align-items: flex-start;
  padding-top: 48px;
  padding-bottom: 48px;
}

.summary-layout {
  position: relative;
  z-index: 1;
  width: min(900px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fade-up 0.75s ease-out;
}

.summary-hero {
  text-align: center;
}

.summary-hero .hero-badge {
  margin: 0 auto 12px;
  display: inline-block;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
  font-size: 13px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.summary-hero .hero-title {
  margin: 0 0 10px;
  font-size: clamp(28px, 4.5vw, 44px);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.12;
  text-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
}

.summary-hero .hero-subtitle {
  margin: 0 auto;
  max-width: 640px;
  font-size: 15px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.72);
}

.chat-card {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(6, 9, 16, 0.55);
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  min-height: min(72vh, 640px);
  overflow: hidden;
}

.chat-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-toolbar-label {
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.ghost-button {
  padding: 8px 14px;
  font-size: 13px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: background 0.2s ease;
}

.ghost-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.ghost-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.chat-scroll {
  flex: 1;
  min-height: 200px;
  max-height: min(52vh, 480px);
  overflow-y: auto;
  padding: 18px 18px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chat-scroll::-webkit-scrollbar {
  width: 8px;
}

.chat-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}

.chat-empty {
  margin: auto;
  text-align: center;
  padding: 32px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.chat-empty-title {
  margin: 0 0 8px;
  font-size: 17px;
  color: rgba(255, 255, 255, 0.78);
}

.chat-empty-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.chat-row {
  display: flex;
}

.chat-row.is-user {
  justify-content: flex-end;
}

.chat-row.is-assistant {
  justify-content: flex-start;
}

.chat-bubble {
  max-width: 92%;
  padding: 12px 16px 14px;
  border-radius: 18px;
  position: relative;
}

.is-user .chat-bubble {
  background: linear-gradient(135deg, rgba(118, 156, 255, 0.35), rgba(86, 120, 255, 0.22));
  border: 1px solid rgba(160, 190, 255, 0.28);
  border-bottom-right-radius: 6px;
}

.is-assistant .chat-bubble {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom-left-radius: 6px;
}

.chat-role {
  display: block;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
  margin-bottom: 6px;
}

.chat-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.92);
  white-space: pre-wrap;
  word-break: break-word;
}

.typing-cursor {
  display: inline-block;
  width: 7px;
  height: 1.1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  border-radius: 2px;
  background: rgba(180, 210, 255, 0.85);
  animation: blink 1s step-end infinite;
}

.chat-error {
  margin: 0;
  padding: 0 18px 8px;
  font-size: 13px;
  color: #ff9b9b;
}

.composer {
  padding: 14px 16px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.composer-input {
  width: 100%;
  resize: vertical;
  min-height: 88px;
  max-height: 220px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 15px;
  line-height: 1.5;
  outline: none;
}

.composer-input:focus {
  border-color: rgba(140, 170, 255, 0.45);
  box-shadow: 0 0 0 1px rgba(120, 150, 255, 0.2);
}

.composer-input:disabled {
  opacity: 0.65;
}

.composer-input::placeholder {
  color: rgba(255, 255, 255, 0.38);
}

.composer-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.stop-button {
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 180, 160, 0.35);
  background: rgba(255, 120, 100, 0.12);
  color: #ffc9be;
  font-size: 14px;
  cursor: pointer;
}

.stop-button:hover {
  background: rgba(255, 120, 100, 0.2);
}

.send-button {
  min-width: 96px;
  padding: 10px 22px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.send-button:hover:not(:disabled) {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.14));
}

.send-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.button-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.85s linear infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .summary-page-shell {
    padding-top: 28px;
  }

  .chat-scroll {
    max-height: 42vh;
  }
}
</style>
