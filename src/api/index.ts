/**
 * Data access for the app. Uses the HTTP backend when `VITE_API_URL` is set,
 * otherwise falls back to local mock data.
 *
 * Backend contract:
 *   GET  {VITE_API_URL}/jobs  -> Job[]
 *   POST {VITE_API_URL}/chat  body: { messages: {role, content}[] }
 *                             -> newline-delimited JSON of ChatStreamEvent
 */
import { getMockJobs, mockChat } from './mock'
import type { ChatMessage, ChatStreamEvent, Job } from './types'

export type * from './types'

const API_URL = import.meta.env.VITE_API_URL as string | undefined

export async function getJobs(signal?: AbortSignal): Promise<Job[]> {
  if (!API_URL) return getMockJobs()
  const res = await fetch(`${API_URL}/jobs`, { signal })
  if (!res.ok) throw new Error(`Failed to load jobs (${res.status})`)
  return res.json()
}

export async function* streamChat(
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  if (!API_URL) {
    yield* mockChat(messages, signal)
    return
  }

  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })) }),
    signal,
  })
  if (!res.ok || !res.body) throw new Error(`Chat request failed (${res.status})`)

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) if (line.trim()) yield JSON.parse(line) as ChatStreamEvent
  }
  if (buffer.trim()) yield JSON.parse(buffer) as ChatStreamEvent
}
