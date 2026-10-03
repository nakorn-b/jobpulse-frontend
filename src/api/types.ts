/** Mirrors `models.Job` in the jobpulse backend (minus embedding bookkeeping). */
export type Job = {
  id: string
  title: string
  company: string
  description: string
  url: string | null
  location: string
  posted_date: string | null
  scraped_at: string
  category: string | null
}

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  /** Jobs the assistant referenced in its answer, rendered as cards. */
  jobs?: Job[]
}

/**
 * Events streamed by `POST /chat` (newline-delimited JSON).
 *   {"type":"token","value":"..."}   — append text to the answer
 *   {"type":"jobs","value":[Job...]}  — jobs referenced by the answer
 *   {"type":"done"}
 */
export type ChatStreamEvent =
  | { type: 'token'; value: string }
  | { type: 'jobs'; value: Job[] }
  | { type: 'done' }
