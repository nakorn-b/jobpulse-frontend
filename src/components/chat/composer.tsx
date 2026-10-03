import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowUpIcon, StopIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import type { ChatStatus } from '@/hooks/use-chat'
import { cn } from '@/lib/utils'

type Props = {
  status: ChatStatus
  onSend: (text: string) => void
  onStop: () => void
  autoFocus?: boolean
  className?: string
}

export function Composer({ status, onSend, onStop, autoFocus, className }: Props) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const busy = status !== 'idle'

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (busy || !value.trim()) return
    onSend(value)
    setValue('')
    ref.current?.focus()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) submit(e)
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        'flex w-full flex-col gap-2 rounded-2xl border bg-card p-3 shadow-xs transition-colors focus-within:border-ring/60 dark:bg-input/20',
        className,
      )}
    >
      <label htmlFor="chat-input" className="sr-only">
        Message
      </label>
      <textarea
        id="chat-input"
        ref={ref}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask about jobs…"
        className="field-sizing-content max-h-48 min-h-11 w-full resize-none bg-transparent px-1 py-1.5 text-base leading-relaxed outline-none placeholder:text-muted-foreground md:text-sm"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="hidden pl-1 text-xs text-muted-foreground sm:inline">
          <kbd className="font-sans">Enter</kbd> to send · <kbd className="font-sans">Shift + Enter</kbd> for a new line
        </span>
        {busy ? (
          <Button
            type="button"
            size="icon-lg"
            variant="outline"
            onClick={onStop}
            aria-label="Stop generating"
            className="ml-auto size-10 rounded-full"
          >
            <StopIcon className="size-5" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon-lg"
            disabled={!value.trim()}
            aria-label="Send message"
            className="ml-auto size-10 rounded-full"
          >
            <ArrowUpIcon className="size-5" />
          </Button>
        )}
      </div>
    </form>
  )
}
