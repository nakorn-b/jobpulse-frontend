# JobPulse frontend

Minimal chat + jobs dashboard for [JobPulse](../jobpulse). React 19, Vite, Tailwind v4, shadcn/ui (Base UI), Material Symbols.

```bash
npm install
npm run dev
```

- `/` — chat with the job assistant
- `/dashboard` — jobs currently in the database

## Data

Without configuration the app runs on mock data (`src/data/mock-jobs.json`, a cleaned copy of the scraped jobs).
Set `VITE_API_URL` to talk to a real backend implementing:

| Method | Path    | Body                              | Response                                              |
| ------ | ------- | --------------------------------- | ----------------------------------------------------- |
| GET    | `/jobs` | —                                 | `Job[]`                                               |
| POST   | `/chat` | `{ messages: {role, content}[] }` | NDJSON stream of `token` / `jobs` / `done` events     |

Types live in `src/api/types.ts`.
