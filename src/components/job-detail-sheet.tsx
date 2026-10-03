import type { Job } from '@/api'
import { CategoryIcon, CompanyIcon, LocationIcon, OpenInNewIcon, ScheduleIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDate } from '@/lib/format'

type Props = {
  job: Job | null
  onOpenChange: (open: boolean) => void
}

export function JobDetailSheet({ job, onOpenChange }: Props) {
  return (
    <Sheet open={job !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-lg data-[side=right]:sm:max-w-lg">
        {job && (
          <>
            <SheetHeader className="gap-3 border-b p-6 pr-12">
              <SheetTitle className="text-lg leading-snug font-semibold text-balance">{job.title}</SheetTitle>
              <SheetDescription render={<div />} className="grid gap-1.5 text-sm">
                <Meta icon={CompanyIcon}>{job.company}</Meta>
                <Meta icon={LocationIcon}>{job.location}</Meta>
                {job.category && <Meta icon={CategoryIcon}>{job.category}</Meta>}
                <Meta icon={ScheduleIcon}>Posted {formatDate(job.posted_date ?? job.scraped_at)}</Meta>
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Description
              </h3>
              <p className="max-w-prose text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                {job.description}
              </p>
            </div>

            {job.url && (
              <SheetFooter className="border-t p-4">
                <Button
                  size="lg"
                  className="h-11 w-full"
                  render={<a href={job.url} target="_blank" rel="noreferrer" />}
                  nativeButton={false}
                >
                  View posting
                  <OpenInNewIcon />
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Meta({ icon: Icon, children }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-muted-foreground">
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  )
}
