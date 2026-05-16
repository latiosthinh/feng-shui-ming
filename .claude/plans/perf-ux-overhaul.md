# FengShuiMing — Perf + Wait-UX + Fix-All Plan

## Context

The app's name-generation flow currently does a single blocking `fetch` to the MIMO chat-completions endpoint (`src/lib/agent/actions/generate-names.ts`), waits 10–30s, and renders everything at once. The component named `StreamingResults` doesn't actually stream — it just `await`s the action. During the wait, users see a spinner that turns into a passive "still processing…" message at 30s. The Vietnamese locale is broken (prompts produce Han characters), the build emits a `metadataBase` warning, Five Grid analysis is hard-coded to zeros, and the spec under `.kiro/specs/production-readiness-fengshui/` has 20 requirements with zero of them broken into tasks (`tasks.md` is empty).

Goal: actually make name generation feel fast (not just hide the wait), then close out the rest of the review items in phased PRs.

Sequencing decided: **Route Handler + ReadableStream for streaming**; **4 phased PRs**; **single plan doc**.

---

## PR1 — Quick wins (half day, ~5h, zero architectural risk)

Ship these first. Every change is independent of the streaming overhaul.

### 1.1 Skeleton + DB-seed UX (perceived-perf win)
Even before true streaming, replace the spinner with skeleton cards and seed them with cached names from `data/name-database.json` (187 entries). User sees content in <100ms instead of a 10–30s blank wait. The real `generateNamesAction(request)` call is still blocking in PR1 — only the perceived wait changes.

**Files**
- ADD `src/components/Results/NameCardSkeleton.tsx` — matches `NameCard.tsx:73` outer shape (`rounded-2xl shadow-lg p-6 space-y-4`) so no layout shift on swap. Tailwind shimmer; respect `prefers-reduced-motion` via `motion-safe:` prefix.
- MODIFY `src/components/Results/StreamingResults.tsx` — replace `LoadingState` with a grid of N `<NameCardSkeleton>`, then call `getRandomNamesAction(..., { dbOnly: true })` in parallel with the existing `generateNamesAction(request)`. Render seed names as they arrive; the real call's result replaces seed names in place, keyed by index.
- MODIFY `src/lib/agent/actions/random-names.ts` — add `dbOnly?: boolean` 5th option. When true, skip the LLM top-up at `random-names.ts:21–60` and return only DB names (instant). Default false preserves current behavior.
- MODIFY `src/app/globals.css` — add `@keyframes shimmer` + `.animate-shimmer` (background-position-based; ~1.4s loop). Wrap in `@media (prefers-reduced-motion: no-preference)` block.
- REPURPOSE `src/components/Results/LoadingState.tsx` → `StreamStatusBanner.tsx` (small banner above the grid, not full-screen). Phase labels: `thinking → thinking-seeded → polishing`. Include vi + zh strings.

**No-flicker swap rule**: key cards by stable index (0..N-1), not by `name.native`. Wrap card body in `transition-opacity duration-300`; seed = `opacity-60`, real = `opacity-100`. DOM node preserved → focus state and any open modal survive the swap.

### 1.2 Vietnamese prompt fix
`src/lib/agent/prompts/name-generation.vi.md:15-25` currently asks the model for `native: "Tên chữ Hán ({{nameLength}} chữ)"` and Vietnamese-romanized CJK. Rewrite to ask for actual Vietnamese names: family name (Nguyễn / Trần / Lê / …) + middle name (Văn / Thị / Đức / …) + given name, with Vietnamese tone marks, `romanization` field set to the same name without tone marks (for sorting/SEO).

Also update `src/lib/agent/prompts/system.vi.md` to drop any "汉字" / "Hán" references.

`ja`/`ko` prompts — see PR4 §"ja/ko decision".

### 1.3 `metadataBase` fix + OG locale
`src/app/layout.tsx:17–40` has no `metadataBase`. Add:
```ts
metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
```
Also fix `openGraph.locale` at `layout.tsx:24` — currently `"en_US"`, but app defaults to `zh`. Change to `"zh_CN"` and keep the `alternateLocale` array. Update `.env.example` and `.env.local` with `NEXT_PUBLIC_BASE_URL=https://fengshuiming.example`. Kills the build warning; fixes OG / canonical URLs.

### 1.4 Wire real Five Grid into generation
`src/lib/agent/actions/generate-names.ts:145` returns `defaultAnalysis()` (all zeros). Use the existing `calculateFiveGrid()` at `src/lib/fengshui/five-grid.ts:23` against each generated name (surname + native).

**Guard rails**:
- If `request.surname` is undefined/empty (random-name path), skip the calculation and keep `defaultAnalysis()`. Five Grid is meaningless without a surname.
- `getStrokeCount` already returns `-1` for unknown chars; `calculateFiveGrid` filters them via `s > 0 ? sum + s : sum` at `five-grid.ts:25-27`. Graceful degradation built in.
- The full BaZi/auspiciousness scoring stays for PR3.

### 1.5 MIMO call tuning
- `max_tokens` for `generateNamesAction` (`generate-names.ts:35`) currently hardcoded to 2048. Replace with derived: `Math.max(1024, (request.nameCount ?? 3) * 250 + 256)`. That sizes the ceiling to actual output (each name JSON is ~200 tokens + cushion).
- `max_tokens: 1536 → 1024` for `analyzeNameAction` (`analyze-name.ts:47`); current analyses are short prose.
- Keep `temperature: 0.9` for generation (variety) and `0.5` for analysis (deterministic-ish).

### 1.6 Cleanup
- Update `.planning/PROJECT.md` — strip the pi-SDK + Qwen references (the code uses MIMO direct fetch). Or delete it; planning agents shouldn't read stale architecture claims.
- **Lockfile decision (separate confirmation)**: both `package-lock.json` and `pnpm-lock.yaml` are checked in. Before deleting `package-lock.json`, confirm pnpm is the chosen PM, verify `.gitignore` doesn't filter the other, and that no CI script invokes `npm ci`. Commit the deletion as its own atomic commit so it can be reverted independently.

### PR1 verification
- `pnpm dev`, submit the form with locale=zh → skeletons render in <100ms, seed names appear ~100ms later, real names replace them when MIMO returns; **no spinner-only blank period**.
- Submit with locale=vi → returned names have Vietnamese tone marks (`Nguyễn`, `Đức`…) and no Han characters in `native`.
- `pnpm build` → no `metadataBase` warning.
- Open any name card → "五格" panel shows nonzero `tianGe/renGe/diGe/waiGe/zongGe` (when surname provided); shows zeros (placeholder) when no surname.
- `console.log` MIMO response → confirm `finish_reason !== "length"` for 3–5 name requests.

---

## PR2 — True streaming (1.5 days, ~12h)

This is the real perf fix: first card visible within ~1–2s, others trickling in.

### 2.1 Route Handler
ADD `src/app/api/generate-names/route.ts` (POST). Body = `NameGenerationRequest` (includes `previousNames` from regeneration flow — must round-trip through). Returns `Response` with `Content-Type: application/x-ndjson` and a `ReadableStream<Uint8Array>` that emits `{type: "name", index, name}` per parsed object, terminates with `{type: "done", count}` or `{type: "error", message}`. `runtime = "nodejs"` because the handler calls `saveNames` (filesystem write) and reads prompt files via `process.cwd()`.

Headers: `Cache-Control: no-store, no-transform`, `X-Accel-Buffering: no` (prevents nginx/CDN buffering).

### 2.2 MIMO SSE consumer
ADD `src/lib/agent/streaming/mimo-stream.ts` exporting `async function* streamMimoCompletion(req): AsyncIterable<string>`. POSTs to `${MIMO_API_BASE_URL}/chat/completions` with `stream: true`. Reads `response.body.getReader()`, decodes UTF-8 chunks, splits on `\n`, strips `data: ` prefix, ignores `[DONE]` and keepalives, yields `choices[0].delta.content`.

**Retry policy**: one retry, 2s backoff, **only on network errors** (`TypeError("fetch failed")` and HTTP 5xx). Specifically **do NOT** retry on `AbortError` — that signals client-side cancellation (user re-submitted form, navigated away); resurrecting that request would race the new one. Retry gates on `gotFirstByte === false`; after the first byte, never restart — desync risk + already showing progress to user.

### 2.3 Incremental brace parser
ADD `src/lib/agent/streaming/incremental-parser.ts` exporting `createIncrementalNameParser()` with `push(chunk: string): GeneratedName[]`. Scans char-by-char tracking `inString` / `escape` / `braceDepth`. At every `}` that returns depth to 0, slices the buffer from the matching `{` and `JSON.parse`s it. On parse failure: track desync count; ≥2 desyncs → abort the stream and fall back to `parseResponse` over the buffered text (existing fn at `generate-names.ts:122` — **keep this exported; don't delete the action**).

### 2.4 Client consumer rewrite
MAJOR REWRITE `src/components/Results/StreamingResults.tsx`.

**Keep**: import of `generateNamesAction` (used as fallback in §2.5). Don't delete it as "dead code".

**Replace** the single `await generateNamesAction(request)` with:

```ts
const ctrl = new AbortController()
abortRef.current?.abort() // cancel prior in-flight stream on re-submit
abortRef.current = ctrl
const res = await fetch("/api/generate-names", {
  method: "POST",
  signal: ctrl.signal,
  body: JSON.stringify(request), // includes request.previousNames — preserves regeneration "don't repeat" flow from page.tsx:48
})
const reader = res.body!.getReader()
// NDJSON line loop → setCards(prev => prev.map((c, i) => i === msg.index ? { kind: "real", ... } : c))
```

State shape: `type CardState = {kind: "skeleton"} | {kind: "seed"; name} | {kind: "real"; name}`. Cards rendered as `<NameCard>` when `kind === "real"`, else `<NameCardSkeleton phase={kind}>`.

**Derived phase flags** (memoized off `cards`):
```ts
const seedReady = cards.some(c => c.kind !== "skeleton")
const firstReceived = cards.some(c => c.kind === "real")
const allReceived = cards.every(c => c.kind === "real")
const phase = allReceived ? "polishing" : firstReceived ? "arriving" : seedReady ? "thinking-seeded" : "thinking"
```

Phase strings:
- `thinking` → "Đang nghĩ…" / "正在思考…"
- `thinking-seeded` → "Đang chọn tên phù hợp…" / "正在挑选合适的名字…"
- `arriving` → "Tên đầu tiên đã đến…" / "首个名字已生成…"
- `polishing` → "Hoàn thiện…" / "正在完善…"

**Cancellation**: on re-submit, on unmount, on `onRegenerate` from `page.tsx:48` — call `abortRef.current?.abort()` before starting the new fetch. The existing `execRef.current` ID-counter pattern still works for the seed promise; combine both.

### 2.5 Streaming detection + kill switch
Race `reader.read()` against a 5s soft timeout. If first byte doesn't arrive in 5s OR response is not `application/x-ndjson` OR response is 5xx → abort, fall through to `generateNamesAction(request)` (the existing blocking action stays as backup; keep the import in `StreamingResults.tsx`).

Env kill switch: `NEXT_PUBLIC_STREAMING_ENABLED=false` → `StreamingResults` short-circuits to the blocking action. Server route stays deployed but unused.

### 2.6 Background analyze pre-warm
On first `type: "name"` arriving, fire `analyzeNameAction(name.native, surname, "fengshui", ...)` in a `useTransition` (non-blocking) and write to the localStorage cache (`setCachedAnalysis` at `src/lib/agent/analysis-cache.ts:19`). Scope: 1 type × 1 name only. When user clicks the 风水/Phong thủy button on card 0, modal opens with instant cached content.

### PR2 verification
- DevTools Network → `/api/generate-names` shows `Content-Type: application/x-ndjson`, body streams incrementally (not 0/100%).
- First name card transitions from seed/skeleton to real within ~1–2s; subsequent cards appear progressively.
- Re-submit the form mid-stream → previous request shows as `cancelled` in Network; only the new one continues.
- Click Regenerate after first batch completes → request body includes `previousNames: [...]`; model returns non-overlapping names.
- Set `MIMO_API_BASE_URL=http://127.0.0.1:9999` (refuse-connection) → after 5s soft-timeout, blocking fallback kicks in; user still gets names (no broken UI).
- Set `NEXT_PUBLIC_STREAMING_ENABLED=false`, rebuild → behavior reverts to PR1 (skeleton + blocking call), no network call to `/api/generate-names`.
- Submit form; immediately click 风水 on the first card after it appears → modal opens instantly with cached fengshui analysis (no spinner).

---

## PR3 — Real Feng Shui calculation (3–4 days, ~24–32h)

Closes spec requirements R2–R6, R11, R15, R16. Effort bumped from initial estimate: real Chinese-calendar conversion + 3000-char stroke DB + 80% test coverage is solidly multi-day work.

### 3.1 Modules to add
- `src/lib/fengshui/bazi.ts` — `calculateBazi(birthDate: Date, birthTime?: string): BaziInfo`. Use `lunar-javascript` (vetted, MIT, ~30KB) for Chinese-calendar conversion; pure TS for stems/branches/elements lookup tables. **Add `import "server-only"` at top** — this module must never reach the client bundle (would add 30KB + unused on client side).
- `src/lib/fengshui/auspiciousness.ts` — `scoreAuspiciousness(fiveGrid, wuxing?): AuspiciousnessScore` per design.md §"Auspiciousness Scoring Algorithm".
- `src/lib/fengshui/engine.ts` — thin facade `analyzeName(surname, given, birthDate?, birthTime?): FengShuiAnalysisResult`. No class / singleton — module-level functions, matching the existing style in `five-grid.ts`. Also `import "server-only"` (transitively pulls bazi).
- `src/lib/fengshui/lru-cache.ts` — server-side LRU, 1000 entries, 1h TTL. Used by the route handler to memoize analysis per `surname|given|birthDate|birthTime` key.

### 3.2 Stroke DB
The current `src/lib/fengshui/stroke-data.ts` has ~280 chars hand-encoded; spec wants 3500+. Migrate to `data/stroke-database.json` (the format design.md §"Stroke Database Schema" specifies). Seed from a public Kangxi source — Unihan `kTotalStrokes` property is canonical (covers ~75k chars; we slice to top-N most common via HSK/JIS frequency lists). `cnchar` package is a pre-packaged alternative.

Loader at `src/lib/fengshui/stroke-data.ts` keeps the same `getStrokeCount(char)` signature — just reads from the JSON at module init instead of an inline array. Backwards compatible with existing callers.

### 3.3 Tests
Add vitest config:
- `vitest.config.ts` with jsdom env, `setupFiles` for `@testing-library/jest-dom`.
- `pnpm add -D fast-check`.
- Add `"test": "vitest"` + `"test:coverage": "vitest --coverage"` to `package.json`.

Property-based tests per design.md §"Correctness Properties":
- P1 stroke idempotence, P2 five-grid completeness, P4 five-grid idempotence, P7 element-count invariant, P10 score range, P11 rating consistency, P14 stroke-DB JSON round-trip.
- Example-based: 15+ Five Grid, 10+ BaZi, 10+ Wu Xing, 8+ scorer.

Target ≥80% coverage on `src/lib/fengshui/**`.

### 3.4 Wire-in
- `src/app/api/generate-names/route.ts` calls `analyzeName()` for each parsed name before emitting to the client. Cached in the LRU.
- `src/lib/agent/actions/generate-names.ts` (blocking fallback) does the same.
- `NameCard` already renders fiveGrid; add auspiciousness badge using the new `rating: "excellent" | "good" | "fair" | "poor"` field.

### PR3 verification
- `pnpm test` → all property tests pass with `numRuns: 100`.
- `pnpm test --coverage` → fengshui modules ≥80%.
- `ANALYZE=true pnpm build` → confirm `bazi.ts` and `lunar-javascript` are NOT in the client chunks (server-only guard working).
- Generate name with birthDate set → cards show real Wu Xing balance (not all zeros), auspiciousness rating, and badge.
- Same name + same birthDate twice → second request returns from LRU (log it; verify a `[lru] hit` line appears).

---

## PR4 — Production-readiness backlog (1.5–2 days, ~12h)

Everything left from the review + spec.

### 4.1 ja/ko decision (must do first)
Currently only `vi.json` translations + `.vi.md` prompts exist alongside zh defaults. `ja.json` and `ko.json` are listed in `LanguageSelector` but have no prompt files. **Pick one**:
- **(a) Ship vi only**: remove ja/ko options from `LanguageSelector`; delete `ja.json` / `ko.json` (or keep for future). 5-minute change.
- **(b) Write ja + ko prompts**: mirror the Vietnamese fix from PR1.2 — full prompt set per locale (system + name-generation + 4 analyses). ~4h per locale.

Default recommendation: (a) for this PR, defer (b) to a future milestone.

### 4.2 Animations (R7)
Formalize keyframes in `globals.css` (`fade-in`, `slide-up`, `scale-in`); replace inline `transition-*` classes where they accumulate. `prefers-reduced-motion` global rule already added in PR1 §1.1 — extend coverage.

### 4.3 Responsive audit (R8)
Test breakpoints 320 / 375 / 640 / 768 / 1024 / 1280. Fix any touch targets <44px on mobile. Form field on iOS doesn't trigger viewport jump.

### 4.4 AnalysisModal lazy (R10)
`const AnalysisModal = dynamic(() => import("./AnalysisModal"), { ssr: false })` in `NameCard.tsx`. Saves ~30KB initial bundle. Verify with `ANALYZE=true pnpm build`.

### 4.5 Favorites cap + export (R20)
- `src/lib/favorites/storage.ts:15-21` — block `saveFavorite` past 50 with a translated error toast.
- Add `exportFavorites()` returning a JSON blob `URL.createObjectURL`d into a download link.
- `src/components/Results/NameCard.tsx:64` hardcodes `locale: "zh"` for the favorite entry — replace with the active locale from `useTranslation()`.

### 4.6 Accessibility (R18)
Two-step, not one-shot:
1. **Scan**: run `axe-core/cli` against `pnpm dev` URL. Get the violation report.
2. **Fix top issues**: ARIA labels, focus indicators (WCAG 2.1 AA contrast), h1/h2/h3 hierarchy in `page.tsx`, `aria-live="polite"` on the streaming status banner.
3. **Re-scan**: target 0 critical + 0 serious. Mediums can defer.

### 4.7 Retry/backoff for analysis (R13)
Mirror PR2 §2.2 retry pattern in `analyzeNameAction`. Same rules (1 retry, 2s, network errors only, not AbortError).

### 4.8 SEO (R9)
- `alternates.canonical` per locale.
- Structured-data JSON-LD for `WebApplication` in `layout.tsx`.

### 4.9 Build hygiene (R14) + CI
- `pnpm lint` → zero warnings.
- `pnpm build` → zero warnings.
- **Add CI** (`.github/workflows/ci.yml`): on PR, run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm build`. Without this, none of the "zero warnings" verifications stay green over time.

### PR4 verification
- Lighthouse desktop ≥90, mobile ≥80.
- axe-core re-scan: 0 critical, 0 serious.
- Favorite 51 names → 51st rejected with translated toast.
- Click export → downloads `fengshuiming-favorites-YYYY-MM-DD.json`.
- `pnpm build` exits 0, no warnings.
- PR against `main` triggers CI; all four steps pass.

---

## Files touched (master list)

**Created**
- `src/app/api/generate-names/route.ts`
- `src/lib/agent/streaming/mimo-stream.ts`
- `src/lib/agent/streaming/incremental-parser.ts`
- `src/components/Results/NameCardSkeleton.tsx`
- `src/lib/fengshui/bazi.ts` (with `import "server-only"`)
- `src/lib/fengshui/auspiciousness.ts`
- `src/lib/fengshui/engine.ts` (with `import "server-only"`)
- `src/lib/fengshui/lru-cache.ts`
- `data/stroke-database.json`
- `vitest.config.ts`
- `src/lib/fengshui/__tests__/*.test.ts`
- `.github/workflows/ci.yml` (PR4)

**Major changes**
- `src/components/Results/StreamingResults.tsx` (rewrite for NDJSON consumer + state machine + AbortController + preserve previousNames + keep fallback import)
- `src/components/Results/LoadingState.tsx` → renamed to `StreamStatusBanner.tsx`
- `src/lib/agent/actions/generate-names.ts` (becomes blocking fallback; wires real five-grid with surname guard; derives max_tokens; `parseResponse` stays exported)
- `src/lib/agent/actions/random-names.ts` (adds `dbOnly` flag)
- `src/lib/agent/actions/analyze-name.ts` (adds retry; lowers max_tokens)
- `src/lib/agent/prompts/name-generation.vi.md`, `system.vi.md` (Vietnamese-name structure fix)
- `src/lib/fengshui/stroke-data.ts` → migrates to JSON-backed loader (same `getStrokeCount` signature)
- `src/app/layout.tsx` (`metadataBase` + fix `openGraph.locale` zh_CN)
- `src/app/globals.css` (shimmer, reduced-motion, animations)
- `src/components/Results/NameCard.tsx` (locale in favorites, auspiciousness badge, lazy AnalysisModal)
- `src/lib/favorites/storage.ts` (50-cap, export)
- `src/components/LanguageSelector.tsx` (remove ja/ko per PR4 §4.1)
- `package.json` (vitest scripts, fast-check, lunar-javascript, derived max_tokens)
- `.planning/PROJECT.md` (rewrite to reflect MIMO architecture)
- `.env.example`, `.env.local` (add `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_STREAMING_ENABLED`)

**Reused (don't rewrite)**
- `src/lib/fengshui/five-grid.ts:23` `calculateFiveGrid` — already correct enough for PR1 wire-in.
- `src/lib/fengshui/wuxing.ts:16,22` `getWuXingElement`, `analyzeWuXingBalance` — already implemented; just call from the engine.
- `src/lib/agent/actions/generate-names.ts:122` `parseResponse` — keep exported as the synchronous fallback.
- `src/lib/agent/analysis-cache.ts:19` `setCachedAnalysis` — used by background pre-warm.
- `src/lib/agent/data/database.ts:28` `getRandomNames` — used by seed flow.
- `src/lib/agent/types.ts` — types are well-shaped; just extend `FengShuiAnalysis` with `auspiciousness?: AuspiciousnessScore` in PR3.

**Separate atomic commit (PR1, gated on confirmation)**
- Delete `package-lock.json` after confirming pnpm is the chosen PM and no CI uses npm.

---

## Effort summary

| PR | Scope | Effort | Risk |
|---|---|---|---|
| PR1 | Quick wins (Vietnamese, metadataBase+locale, skeleton+seed, five-grid wire with guard, derived max_tokens, cleanup) | ~5h | Low |
| PR2 | True streaming (route handler, parser, client rewrite with abort+previousNames, network-only retry, pre-warm, kill switch) | ~12h | Medium |
| PR3 | Real Feng Shui (bazi server-only, scorer, LRU, stroke DB from Unihan, tests with 80% coverage) | ~24–32h | Medium |
| PR4 | Backlog (ja/ko decision, a11y scan→fix→re-scan, responsive, favorites cap+export+locale, lazy modal, SEO, retry for analyze, build clean, CI) | ~12h | Low |

Total: ~53–61h / ~7–8 working days for one engineer.

PR1 ships the biggest perceived-perf win for the smallest risk; PR2 is where actual latency drops.
