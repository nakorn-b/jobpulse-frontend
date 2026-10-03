import Markdown, { type Components } from 'react-markdown'
import type { ChatMessage, Job } from '@/api'
import { CompanyIcon, LocationIcon } from '@/components/icons'
import { Logo } from '@/components/app-shell'
import { formatRelative } from '@/lib/format'

// react-markdown passes its AST `node` to every component; keep it off the DOM.
const MARKDOWN: Components = {
  p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
  ul: ({ node, ...props }) => <ul className="mb-3 list-disc space-y-1 pl-5" {...props} />,
  ol: ({ node, ...props }) => <ol className="mb-3 list-decimal space-y-1 pl-5" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
  a: ({ node, ...props }) => (
    <a className="underline underline-offset-4 hover:text-muted-foreground" target="_blank" rel="noreferrer" {...props} />
  ),
}

export function MessageItem({
  message,
  streaming,
  onOpenJob,
}: {
  message: ChatMessage
  streaming?: boolean
  onOpenJob: (job: Job) => void
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-secondary-foreground">
          {message.content}
        </p>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <Logo className="mt-0.5 size-7 shrink-0 rounded-lg [&_svg]:size-4" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="text-[15px] leading-relaxed" aria-busy={streaming}>
          <Markdown components={MARKDOWN}>{message.content}</Markdown>
        </div>
        {message.jobs && message.jobs.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Matching jobs">
            {message.jobs.map((job, i) => (
              <li
                key={job.id}
                className="animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both duration-300"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <JobCard job={job} onClick={() => onOpenJob(job)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full w-full flex-col gap-2 rounded-xl border bg-card p-3.5 text-left transition-colors duration-200 hover:border-foreground/25 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="line-clamp-2 text-sm leading-snug font-medium">{job.title}</span>
      <span className="mt-auto grid gap-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CompanyIcon className="size-3.5 shrink-0" />
          <span className="truncate">{job.company}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <LocationIcon className="size-3.5 shrink-0" />
          <span className="truncate">{job.location}</span>
          <span className="ml-auto shrink-0 font-mono text-[11px]">{formatRelative(job.posted_date ?? job.scraped_at)}</span>
        </span>
      </span>
    </button>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3" role="status" aria-label="Assistant is typing">
      <Logo className="size-7 rounded-lg [&_svg]:size-4" />
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground"
            style={{ animation: 'typing-dot 1.2s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  )
}
