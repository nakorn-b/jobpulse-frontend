import { useEffect, useState } from 'react'
import { getJobs, type Job } from '@/api'
import { StatTiles } from '@/components/dashboard/stat-tiles'
import { JobsTable } from '@/components/dashboard/jobs-table'
import { JobDetailSheet } from '@/components/job-detail-sheet'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>()
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [openJob, setOpenJob] = useState<Job | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getJobs(controller.signal)
      .then(setJobs)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Failed to load jobs.')
      })
    return () => controller.abort()
  }, [attempt])

  const retry = () => {
    setError(null)
    setJobs(undefined)
    setAttempt((n) => n + 1)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground md:text-base">Jobs currently in the JobPulse database.</p>
        </header>

        {error ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" className="h-9" onClick={retry}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <StatTiles jobs={jobs} />
            <JobsTable jobs={jobs} onOpenJob={setOpenJob} />
          </>
        )}
      </div>

      <JobDetailSheet job={openJob} onOpenChange={(open) => !open && setOpenJob(null)} />
    </div>
  )
}
