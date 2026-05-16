# FengShuiMing — Perf+UX Implementation Review

Review of the implementation that landed across commits `a18455f`, `8e685eb`, `d377b49`, `b5fcbf3`, `0f908be` against [perf-ux-overhaul.md](./perf-ux-overhaul.md).

**Health**: 15/15 tests pass, `tsc --noEmit` clean. All four PRs landed in shape. But there are functional regressions vs the plan — most importantly, the seed-name UX from PR1 and the per-name analysis pipeline from PR3 are both computed and then discarded before reaching the user.

---

## Critical (functional regressions)

### 1. Seed names never reach the UI
`src/components/Results/StreamingResults.tsx:305-315` stores `{kind:'seed', name: seedRes.names[i]}` in state, but renders `<NameCardSkeleton phase="seed" />` without passing `name` down. `NameCardSkeleton` has no `name` prop. User sees a slightly-grayer skeleton instead of an actual cached name.

**Result**: The whole "DB-seed in <100ms" UX from PR1 §1.1 is missing.

**Fix options**:
- Add `name?: GeneratedName` to `NameCardSkeleton` and render the actual content at 60% opacity, OR
- In `StreamingResults.tsx`, render `<NameCard>` directly when `kind === 'seed'`, just wrapped in an `opacity-60` div.

### 2. Per-name analysis computed server-side, dropped client-side
`src/app/api/generate-names/route.ts:50-68` runs `analyzeName({surname, givenName: name.native})` for every name and emits `{type:'name', ..., name:{...name, analysis}}` over NDJSON.

But `StreamingResults.tsx:181-189` reads `msg.name` and ignores `msg.name.analysis`. Then `NameCard` receives the placeholder `response?.analysis || defaultAnalysis` set at lines 195-205 in the `done` handler. **All cards share the same zeros.**

**Result**: PR3's BaZi + auspiciousness pipeline runs on every request and is invisible. The 大吉/吉/平/凶 badge in `NameCard.tsx:196-208` will never render for streamed names because `auspiciousness` is always undefined.

**Fix**: Pipe `msg.name.analysis` into per-card state. Each card should carry its own `analysis`, not share a response-level one.

### 3. Incremental parser desyncs on chunk boundaries
`src/lib/agent/streaming/incremental-parser.ts:97-102`. When a chunk arrives mid-object (`braceDepth > 0`), the buffer is trimmed via `buffer = buffer.slice(objectStart)` but `objectStart` is **not reset to 0**.

On the next chunk that closes the brace, `buffer.slice(objectStart, i+1)` reads from the wrong absolute offset → `JSON.parse` fails → `desyncCount++`. Two desyncs and the parser bails entirely.

With MIMO's typical small chunks (~10-50 chars), every multi-chunk name fails. Tests don't catch this because they don't exercise chunked input.

**Fix**: After `buffer = buffer.slice(objectStart)` add `objectStart = 0`.

### 4. CI swallows test failures
`.github/workflows/ci.yml:25`:
```yaml
- run: pnpm vitest run --reporter=verbose 2>/dev/null || echo "No vitest config or tests found; skipping test step"
```
The `|| echo ...` makes the step exit 0 even when tests fail. The "tests stay green over time" guarantee from PR4 §4.9 is invalidated.

**Fix**: Replace with `- run: pnpm test`.

### 5. Retry policy allows up to 3 attempts, not 1
Both `src/lib/agent/streaming/mimo-stream.ts:51-66` and `src/lib/agent/actions/analyze-name.ts:87-105`:
```
try → catch TypeError + retry → check 5xx + retry again
```
Worst case: 90s × 3 + 2s × 2 = 274s before the user sees failure. Plan §2.2 explicitly said one retry total.

**Fix**: Pick either the network-error catch OR the 5xx check, not both. Use a single `attempted: boolean` flag to gate.

---

## High

### 6. Upstream MIMO fetch not abortable from the client
`src/app/api/generate-names/route.ts:38` calls `streamMimoCompletion(systemPrompt, prompt)` without passing `request.signal`. `streamMimoCompletion` accepts a `signal` parameter (`mimo-stream.ts:10`) but it's never wired through.

When the client cancels (re-submit, navigate), the server keeps streaming. Resource leak under load.

**Fix**: `streamMimoCompletion(systemPrompt, prompt, request.signal)` in route.ts.

### 7. `buildPrompt` duplicated
~80 lines of identical prompt-building logic between:
- `src/app/api/generate-names/route.ts:100-186`
- `src/lib/agent/actions/generate-names.ts` (the blocking fallback)

They must stay in sync. Future prompt changes will silently diverge.

**Fix**: Extract to `src/lib/agent/build-prompt.ts`, import from both.

### 8. BaZi year boundary is Gregorian, not solar terms (立春)
`src/lib/fengshui/bazi.ts:112`:
```ts
const yearStemIndex = (((year - 4) % 10) + 10) % 10
```
Uses Jan 1 as the year boundary. Authentic BaZi uses 立春 (~Feb 4). A baby born Jan 15, 2024 gets 甲辰 (2024) from the code but should be 癸卯 (2023) traditionally.

The test at `__tests__/fengshui.test.ts:174-180` asserts `2024-01-01 → 甲辰`, which is the **wrong** answer locked in by the test. The test passes; the calculation is non-authentic.

**Fix options**:
- Use `lunar-javascript` for solar-term-aware year/month boundaries (it's installed — see #10).
- OR document the Gregorian-boundary simplification and add `// approximate: uses Gregorian Jan 1, not 立春` comments to bazi.ts and the failing-correctness test cases.

### 9. Day pillar reference anchor likely incorrect
`bazi.ts:75-77`:
```ts
const REFERENCE_DATE = new Date(1900, 0, 1)
const REFERENCE_DAY_STEM = 0      // 甲
const REFERENCE_DAY_BRANCH = 0    // 子
```
Claims Jan 1, 1900 = 甲子日. Historical records put Jan 1, 1900 at 庚子日 (stem index 6). If true, every day pillar in the output is offset by 6 stems.

Verify against an authoritative source (e.g., a known almanac) before trusting BaZi output.

### 10. `lunar-javascript` installed but never imported
`package.json:18` adds `"lunar-javascript": "^1.7.7"` (per PR3 commit `d377b49`). `grep -r 'lunar' src/` returns zero hits.

Either:
- Remove the dep, OR
- Use it (would fix #8 and #9 in one shot).

### 11. `parseResponse` calculates fiveGrid only for `names[0]`
`src/lib/agent/parse-response.ts:44-45`:
```ts
const fiveGrid = names.length > 0 && surname
  ? calculateFiveGrid(surname, names[0].native)
  : defaultFiveGrid()
```
That single fiveGrid is then attached to the top-level response, applying to ALL names. PR1 §1.4 said "against each generated name." Each name needs its own fiveGrid.

This is the blocking-fallback path; once #2 is fixed, the streaming path will correctly use per-name analysis from the route handler.

---

## Medium

### 12. Skeleton ARIA labels hardcoded Vietnamese
`src/components/Results/NameCardSkeleton.tsx:12`:
```tsx
aria-label={phase === 'seed' ? 'Đang tải kết quả tạm thời' : 'Đang tạo tên'}
```
zh users get Vietnamese screen-reader announcements.

**Fix**: Accept `locale` as a prop or use `t.results.loading` / `t.results.thinking`.

### 13. Dead code: `triggerDownload`
`StreamingResults.tsx:84-86`:
```ts
const triggerDownload = useCallback(() => {
  window.open('/api/download-names', '_blank')
}, [])
```
Defined, never called, references nonexistent route. Delete.

### 14. Dead variables in retry blocks
`analyze-name.ts:66-67` declares `lastError` (never read) and `gotFirstByte` (never assigned). Same in `mimo-stream.ts:13` for `lastError`.

For analyze-name specifically: `gotFirstByte` is irrelevant since the call isn't streaming (`stream: true` is not set), `await res.json()` resolves only after full response.

### 15. Auspiciousness score range divergence
`src/lib/fengshui/auspiciousness.ts:107-115` returns score in 0–1 range. Plan and design.md called for 0–100.

Tests at `__tests__/fengshui.test.ts:106-107` assert 0–1, locking in the implementation choice. Either:
- Update plan/design.md to document 0–1, OR
- Multiply by 100 and adjust tests.

### 16. Auspiciousness bucket function is non-monotonic
`auspiciousness.ts:28-62` scores raw grid values into buckets:
- val ≥ 81 → 0.3 (lowest)
- val ≥ 61 → 0.6
- val ≥ 41 → 0.7
- val ≥ 31 → 0.8
- val ≥ 21 → 0.6
- val ≥ 11 → 0.7
- val ≥ 6  → 0.8
- val ≥ 1  → 0.9 (highest)

A grid value of 5 scores higher than a value of 81. This doesn't reflect the 81-number auspicious classification used in `src/lib/fengshui/five-grid.ts:5-15`.

**Fix**: Score off the `auspicious | neutral | inauspicious` classification, not raw values. E.g., auspicious=0.9, neutral=0.5, inauspicious=0.2.

### 17. AbortError vs network error retry semantics
`mimo-stream.ts:42`: retry catches `err instanceof TypeError && !gotFirstByte`.

The 90s timeout uses `controller.abort()` → throws `AbortError`, not `TypeError` → does NOT retry (correct behavior).

Caller-cancelled (`signal.aborted`) also throws `AbortError` → does NOT retry (correct). The semantics work but the dead-variable cleanup from #14 still applies.

---

## Low

### 18. Unnecessary `any` cast
`NameCard.tsx:138`:
```ts
const auspiciousness: AuspiciousnessScore | undefined = (analysis as any)?.auspiciousness
```
Types are correctly extended in `src/lib/fengshui/types.ts`. The cast is unnecessary. Remove for type safety.

### 19. Property tests use arbitrary Unicode
`__tests__/fengshui.test.ts:31-33, 53-55`:
```ts
fc.property(fc.string({minLength:1, maxLength:2}), fc.string({minLength:1, maxLength:3}), ...)
```
`fc.string` returns random Unicode. `getStrokeCount` returns -1 for nearly all of them → `calculateFiveGrid` filters them via `s > 0` → grids end up with all-zero or trivial values. Properties pass trivially.

**Fix**: `fc.constantFrom(...Object.keys(strokeDb))` for meaningful coverage.

### 20. Cache size 500, not 1000
`src/app/api/generate-names/route.ts:10`: `createLRUCache<any>(500, 3600000)`. Plan §3.1 specified 1000. Minor.

Also: replace `<any>` with `<FengShuiAnalysis>`.

### 21. Stroke DB at 1647 chars, target 3000+
`data/stroke-database.json` has 1647 entries (counted via `python -c "import json; ..."`). PR3 commit message said "~1200" — actual is better. Plan target from spec R1.5 was 3000+ common given-name characters.

Top-up from Unihan `kTotalStrokes` slice when there's time. Not blocking; missing chars return -1 and `calculateFiveGrid` degrades gracefully.

### 22. `ja`/`ko` labels still in NameCard
`src/components/Results/NameCard.tsx:78-129` LABELS object carries ja/ko entries. `LanguageSelector` no longer offers those locales (PR4 §4.1 decision). Dead but harmless.

---

## Priority order

If addressing in batches:

**Batch 1 (correctness, ~3h)**:
- #1 seed names to UI
- #2 per-name analysis to UI
- #3 parser desync
- #4 CI swallowing failures

After this batch: the user actually sees seed names in <100ms and the auspiciousness badge during streaming. The plan's perceived-perf claim is fulfilled.

**Batch 2 (robustness, ~2h)**:
- #5 retry policy 1 attempt
- #6 abort signal propagation
- #7 buildPrompt extraction
- #11 per-name fiveGrid in parseResponse

**Batch 3 (BaZi correctness, ~4-6h)**:
- #8 / #9 / #10 — pick a strategy (use lunar-javascript or document the simplification)
- #16 auspiciousness bucket function
- #19 property test arbitraries

**Batch 4 (cleanup, ~1h)**:
- #12 ARIA locale
- #13 / #14 dead code
- #15 / #20 / #22 minor

---

## What's working well

- Streaming pipeline architecture (route handler + NDJSON + SSE consumer) is correct.
- LRU cache implementation (`lru-cache.ts`) is clean and correct.
- Favorites cap + export (`storage.ts:16-23`, `:36-47`) is well done.
- AnalysisModal lazy-loading (`NameCard.tsx:12-15`) is correctly wired with `ssr: false`.
- `server-only` guards on bazi.ts, engine.ts, mimo-stream.ts, stroke-data.ts.
- Vietnamese prompt now correctly produces chữ Quốc ngữ.
- Stream kill switch (`isStreamingEnabled()` in `StreamingResults.tsx:46-53`) works as designed.
- Vitest setup with `server-only` mock is correct.
- 5s soft-timeout → blocking fallback wiring is correct.
- Metadata + JSON-LD + `metadataBase` resolved.
- CI workflow scaffold exists; just needs #4 fixed to actually gate on tests.
