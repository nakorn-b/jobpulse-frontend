import type { ChatMessage, ChatStreamEvent, Job } from './types'

let jobsPromise: Promise<Job[]> | undefined

/** Sample of real scraped jobs, loaded as a separate chunk. */
export function getMockJobs(): Promise<Job[]> {
  jobsPromise ??= import('@/data/mock-jobs.json').then((m) => m.default as Job[])
  return jobsPromise
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(signal.reason)
    })
  })

const STOP_WORDS = new Set(
  'a an the for in of to me show find any some jobs job roles role position positions open openings looking i am want with and or is are what who which latest newest recent remote companies company hiring please posting postings listings'.split(
    ' ',
  ),
)

const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9+]+/))

const isRemote = (j: Job) => /remote|anywhere|virtual|worldwide/i.test(j.location)
const byPostedDesc = (a: Job, b: Job) =>
  (b.posted_date ?? b.scraped_at).localeCompare(a.posted_date ?? a.scraped_at)

function answer(query: string, jobs: Job[]): { text: string; jobs: Job[] } {
  const q = query.toLowerCase()

  if (/compan(y|ies)|hiring|who/.test(q) && !/engineer|scien|data|design|sales|devops/.test(q)) {
    const counts = new Map<string, number>()
    for (const j of jobs) counts.set(j.company, (counts.get(j.company) ?? 0) + 1)
    const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5)
    const list = top.map(([c, n]) => `- **${c}** — ${n} open role${n > 1 ? 's' : ''}`).join('\n')
    const picks = top
      .map(([c]) => jobs.filter((j) => j.company === c).sort(byPostedDesc)[0])
      .slice(0, 3)
    return {
      text: `These companies have the most openings in the database right now:\n\n${list}\n\nHere's the newest role from each of the top three.`,
      jobs: picks,
    }
  }

  let pool = jobs
  if (/remote/.test(q)) {
    const remote = jobs.filter(isRemote)
    if (remote.length) pool = remote
  }

  const terms = q
    .replace(/[^a-z0-9+ ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))

  const scored = pool
    .map((job) => {
      const title = words(job.title)
      const other = words(`${job.category ?? ''} ${job.company}`)
      const score = terms.reduce((s, t) => s + (title.has(t) ? 2 : other.has(t) ? 1 : 0), 0)
      return { job, score }
    })
    .filter(({ score }) => terms.length === 0 || score > 0)
    .sort((a, b) => b.score - a.score || byPostedDesc(a.job, b.job))

  // Prefer jobs matching every term; fall back to partial matches.
  const full = scored.filter(({ job }) => terms.every((t) => words(`${job.title} ${job.category ?? ''} ${job.company}`).has(t)))
  const matches = (full.length ? full : scored).map((s) => s.job)
  if (matches.length === 0) {
    return {
      text: `I couldn't find any jobs matching **"${query.trim()}"**. Try a role like *AI Engineer*, *Data Scientist* or *DevOps*, or ask for the latest postings.`,
      jobs: [],
    }
  }

  const top = (/latest|newest|recent/.test(q) ? [...matches].sort(byPostedDesc) : matches).slice(0, 3)
  const scope = /remote/.test(q) ? 'remote ' : ''
  return {
    text: `I found **${matches.length}** ${scope}job${matches.length > 1 ? 's' : ''} that match. Here are the ${top.length > 1 ? `top ${top.length}` : 'best match'}:`,
    jobs: top,
  }
}

export async function* mockChat(
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  const jobs = await getMockJobs()
  const last = messages.findLast((m) => m.role === 'user')
  const { text, jobs: picked } = answer(last?.content ?? '', jobs)

  await sleep(500, signal)
  for (const chunk of text.match(/\S+\s*/g) ?? []) {
    yield { type: 'token', value: chunk }
    await sleep(18, signal)
  }
  if (picked.length) yield { type: 'jobs', value: picked }
  yield { type: 'done' }
}
