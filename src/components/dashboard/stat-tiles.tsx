import type { Job } from '@/api'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'

const WEEK = 7 * 86_400_000

function stats(jobs: Job[]) {
  const latest = jobs.reduce((max, j) => Math.max(max, new Date(j.scraped_at).getTime()), 0)
  return [
    { label: 'Total jobs', value: jobs.length },
    { label: 'Companies', value: new Set(jobs.map((j) => j.company)).size },
    { label: 'Categories', value: new Set(jobs.map((j) => j.category).filter(Boolean)).size },
    {
      label: 'Added in last 7 days',
      value: jobs.filter((j) => latest - new Date(j.scraped_at).getTime() <= WEEK).length,
      hint: latest ? `Last scrape ${formatDate(new Date(latest).toISOString())}` : undefined,
    },
  ]
}

export function StatTiles({ jobs }: { jobs: Job[] | undefined }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
      {jobs
        ? stats(jobs).map(({ label, value, hint }) => (
            <div key={label} className="flex flex-col gap-1 bg-card p-4 md:p-5">
              <dt className="text-xs text-muted-foreground md:text-sm">{label}</dt>
              <dd className="font-mono text-2xl font-medium tracking-tight tabular-nums md:text-3xl">
                {value.toLocaleString()}
              </dd>
              {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
            </div>
          ))
        : Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2 bg-card p-4 md:p-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-14" />
            </div>
          ))}
    </dl>
  )
}
