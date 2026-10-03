import { useMemo, useState, type KeyboardEvent } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type Row,
  type SortingState,
} from '@tanstack/react-table'
import type { Job } from '@/api'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClearFilterIcon,
  CompanyIcon,
  LocationIcon,
  OpenInNewIcon,
  SearchIcon,
  SortIcon,
} from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

const ALL = '__all__'
const PAGE_SIZE = 15
const col = createColumnHelper<Job>()

const columns = [
  col.accessor('title', {
    header: 'Title',
    cell: (c) => <span className="line-clamp-1 font-medium">{c.getValue()}</span>,
  }),
  col.accessor('company', { header: 'Company' }),
  col.accessor('category', {
    header: 'Category',
    filterFn: 'equals',
    enableSorting: false,
    cell: (c) => (c.getValue() ? <Badge variant="secondary" className="font-normal">{c.getValue()}</Badge> : '—'),
  }),
  col.accessor('location', {
    header: 'Location',
    enableSorting: false,
    cell: (c) => <span className="line-clamp-1 text-muted-foreground">{c.getValue()}</span>,
  }),
  col.accessor((j) => j.posted_date ?? j.scraped_at, {
    id: 'posted',
    header: 'Posted',
    sortDescFirst: true,
    cell: (c) => (
      <time dateTime={c.getValue()} className="font-mono text-xs text-muted-foreground tabular-nums">
        {formatDate(c.getValue())}
      </time>
    ),
  }),
  col.display({
    id: 'link',
    header: () => <span className="sr-only">Link</span>,
    cell: (c) =>
      c.row.original.url && (
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground"
          aria-label={`Open posting for ${c.row.original.title}`}
          render={<a href={c.row.original.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} />}
          nativeButton={false}
        >
          <OpenInNewIcon className="size-4" />
        </Button>
      ),
  }),
]

type Props = {
  jobs: Job[] | undefined
  onOpenJob: (job: Job) => void
}

export function JobsTable({ jobs, onOpenJob }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(ALL)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'posted', desc: true }])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE })

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const j of jobs ?? []) if (j.category) counts.set(j.category, (counts.get(j.category) ?? 0) + 1)
    return [...counts].sort((a, b) => b[1] - a[1])
  }, [jobs])

  const columnFilters = useMemo(() => (category === ALL ? [] : [{ id: 'category', value: category }]), [category])
  const categoryItems = useMemo(
    () => [{ value: ALL, label: 'All categories' }, ...categories.map(([c]) => ({ value: c, label: c }))],
    [categories],
  )
  const firstPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }))

  const table = useReactTable({
    data: jobs ?? [],
    columns,
    state: {
      sorting,
      pagination,
      globalFilter: search,
      columnFilters,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _id, value: string) => {
      const q = value.toLowerCase()
      const { title, company, location } = row.original
      return `${title} ${company} ${location}`.toLowerCase().includes(q)
    },
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const rows = table.getRowModel().rows
  const total = table.getFilteredRowModel().rows.length
  const { pageIndex } = pagination
  const from = total === 0 ? 0 : pageIndex * PAGE_SIZE + 1
  const to = Math.min(total, (pageIndex + 1) * PAGE_SIZE)
  const filtered = search !== '' || category !== ALL
  const loading = jobs === undefined

  const resetFilters = () => {
    setSearch('')
    setCategory(ALL)
    firstPage()
  }

  const rowKeyDown = (e: KeyboardEvent, row: Row<Job>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpenJob(row.original)
    }
  }

  return (
    <section aria-label="Jobs" className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="job-search" className="sr-only">
            Search jobs
          </label>
          <Input
            id="job-search"
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              firstPage()
            }}
            placeholder="Search title, company, location…"
            className="h-10 pl-9"
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory((v as string | null) ?? ALL)
            firstPage()
          }}
          items={categoryItems}
        >
          <SelectTrigger aria-label="Filter by category" className="h-10 w-full data-[size=default]:h-10 sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start" className="w-auto min-w-(--anchor-width)">
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map(([c, n]) => (
              <SelectItem key={c} value={c}>
                {c}
                <span className="ml-auto pl-4 font-mono text-xs text-muted-foreground tabular-nums">{n}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtered && (
          <Button variant="ghost" className="h-10 gap-2 self-start px-3 sm:self-auto" onClick={resetFilters}>
            <ClearFilterIcon className="size-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table className="table-fixed">
          <colgroup>
            <col />
            <col className="w-[18%]" />
            <col className="w-[20%]" />
            <col className="w-[14%]" />
            <col className="w-32" />
            <col className="w-16" />
          </colgroup>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className="h-11 px-4 text-xs font-medium text-muted-foreground"
                    aria-sort={
                      h.column.getIsSorted() === 'asc' ? 'ascending' : h.column.getIsSorted() === 'desc' ? 'descending' : undefined
                    }
                  >
                    {h.column.getCanSort() ? (
                      <SortButton column={h.column} label={String(h.column.columnDef.header)} />
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 8 }, (_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {columns.map((_, j) => (
                      <TableCell key={j} className="h-13 px-4">
                        <Skeleton className="h-4 w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.map((row) => (
                  <TableRow
                    key={row.id}
                    tabIndex={0}
                    onClick={() => onOpenJob(row.original)}
                    onKeyDown={(e) => rowKeyDown(e, row)}
                    className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cn('h-13 px-4 py-1.5', cell.column.id === 'link' ? 'pr-3 pl-0 text-right' : 'truncate')}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        {!loading && rows.length === 0 && <EmptyResults onClear={resetFilters} />}
      </div>

      {/* Mobile cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {loading
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="space-y-2 rounded-xl border p-4">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
              </li>
            ))
          : rows.map((row) => <MobileJobCard key={row.id} job={row.original} onOpen={() => onOpenJob(row.original)} />)}
        {!loading && rows.length === 0 && (
          <li className="rounded-xl border">
            <EmptyResults onClear={resetFilters} />
          </li>
        )}
      </ul>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="tabular-nums" aria-live="polite">
            {from}–{to} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden tabular-nums sm:inline">
              Page {pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-10"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="size-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-10"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRightIcon className="size-5" />
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function SortButton({ column, label }: { column: Column<Job, unknown>; label: string }) {
  const dir = column.getIsSorted()
  const Icon = dir === 'asc' ? ArrowUpIcon : dir === 'desc' ? ArrowDownIcon : SortIcon
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        '-ml-2 inline-flex h-8 items-center gap-1 rounded-md px-2 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        dir && 'text-foreground',
      )}
    >
      {label}
      <Icon className={cn('size-3.5', !dir && 'opacity-50')} />
    </button>
  )
}

function MobileJobCard({ job, onOpen }: { job: Job; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-colors active:bg-accent"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="line-clamp-2 font-medium leading-snug">{job.title}</span>
          <span className="shrink-0 pt-0.5 font-mono text-xs text-muted-foreground">
            {formatRelative(job.posted_date ?? job.scraped_at)}
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1.5">
            <CompanyIcon className="size-4 shrink-0" />
            <span className="truncate">{job.company}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <LocationIcon className="size-4 shrink-0" />
            <span className="truncate">{job.location}</span>
          </span>
        </span>
        {job.category && (
          <Badge variant="secondary" className="font-normal">
            {job.category}
          </Badge>
        )}
      </button>
    </li>
  )
}

function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
      <SearchIcon className="size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">No jobs match your filters.</p>
      <Button variant="outline" className="h-9" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  )
}
