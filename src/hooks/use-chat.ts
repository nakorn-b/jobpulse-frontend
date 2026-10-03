import { useEffect, useRef, useState } from 'react'
import { streamChat, type ChatMessage } from '@/api'

const STORAGE_KEY = 'jobpulse-chat'

function load(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ChatMessage[]) : []
  } catch {
    return []
  }
}

function save(messages: ChatMessage[]) {
  try {
    if (messages.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable or full — chat still works for this session */
  }
}

export type ChatStatus = 'idle' | 'waiting' | 'streaming'

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(load)
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Persist only settled conversations, not every streamed token.
  useEffect(() => {
    if (status === 'idle') save(messages)
  }, [messages, status])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function send(text: string) {
    const content = text.trim()
    if (!content || status !== 'idle') return

    const user: ChatMessage = { id: crypto.randomUUID(), role: 'user', content }
    const assistantId = crypto.randomUUID()
    const history = [...messages, user]
    setMessages(history)
    setError(null)
    setStatus('waiting')

    const controller = new AbortController()
    abortRef.current = controller
    const patch = (fn: (m: ChatMessage) => ChatMessage) =>
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)))

    try {
      let started = false
      for await (const event of streamChat(history, controller.signal)) {
        if (!started) {
          started = true
          setStatus('streaming')
          setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])
        }
        if (event.type === 'token') patch((m) => ({ ...m, content: m.content + event.value }))
        else if (event.type === 'jobs') patch((m) => ({ ...m, jobs: event.value }))
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    } finally {
      abortRef.current = null
      setStatus('idle')
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  function reset() {
    stop()
    setMessages([])
    setError(null)
  }

  return { messages, status, error, send, stop, reset }
}
