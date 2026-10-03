import { useEffect, useRef, useState } from 'react'
import type { Job } from '@/api'
import { Composer } from '@/components/chat/composer'
import { MessageItem, TypingIndicator } from '@/components/chat/messages'
import { Logo } from '@/components/app-shell'
import { BoltIcon, CompanyIcon, NewChatIcon, ScheduleIcon, WorkIcon } from '@/components/icons'
import { JobDetailSheet } from '@/components/job-detail-sheet'
import { Button } from '@/components/ui/button'
import { useChat } from '@/hooks/use-chat'

const SUGGESTIONS = [
  { label: 'AI Engineer roles', prompt: 'Show me AI Engineer roles', icon: BoltIcon },
  { label: 'Remote data jobs', prompt: 'Find remote data scientist jobs', icon: WorkIcon },
  { label: 'Latest postings', prompt: 'What are the latest job postings?', icon: ScheduleIcon },
  { label: 'Companies hiring', prompt: 'Which companies are hiring the most?', icon: CompanyIcon },
]

export default function ChatPage() {
  const { messages, status, error, send, stop, reset } = useChat()
  const [openJob, setOpenJob] = useState<Job | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(true)

  // Follow new content only while the user is already at the bottom.
  useEffect(() => {
    const el = scrollRef.current
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight
  }, [messages, status])

  const onScroll = () => {
    const el = scrollRef.current
    if (el) pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  const empty = messages.length === 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
          <div className="flex w-full max-w-2xl flex-col items-center text-center">
            <Logo className="mb-6 size-12 rounded-2xl [&_svg]:size-7" />
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              What role are you looking for?
            </h1>
            <p className="mt-3 max-w-md text-base text-muted-foreground text-pretty">
              Ask about open positions, companies or categories. Answers come from the JobPulse jobs database.
            </p>

            <ul className="mt-10 flex flex-wrap justify-center gap-2" aria-label="Suggested questions">
              {SUGGESTIONS.map(({ label, prompt, icon: Icon }) => (
                <li key={label}>
                  <Button
                    variant="outline"
                    className="h-10 rounded-full px-4 text-sm font-normal"
                    onClick={() => send(prompt)}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {label}
                  </Button>
                </li>
              ))}
            </ul>

            <Composer status={status} onSend={send} onStop={stop} autoFocus={window.matchMedia('(pointer: fine)').matches} className="mt-4" />
          </div>
        </div>
      ) : (
        <>
          <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:px-6">
            <h1 className="text-sm font-medium">JobPulse</h1>
            <Button variant="ghost" className="h-9 gap-2 px-3" onClick={reset}>
              <NewChatIcon className="size-4" />
              New chat
            </Button>
          </header>

          <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 md:px-6" aria-live="polite">
              {messages.map((m, i) => (
                <MessageItem
                  key={m.id}
                  message={m}
                  streaming={status === 'streaming' && i === messages.length - 1}
                  onOpenJob={setOpenJob}
                />
              ))}
              {status === 'waiting' && <TypingIndicator />}
              {error && (
                <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 px-4 pb-4 md:px-6 md:pb-6">
            <Composer status={status} onSend={send} onStop={stop} className="mx-auto max-w-3xl" />
          </div>
        </>
      )}

      <JobDetailSheet job={openJob} onOpenChange={(open) => !open && setOpenJob(null)} />
    </div>
  )
}
