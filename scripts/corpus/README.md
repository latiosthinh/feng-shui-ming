# Chinese Names Corpus → Sino-Vietnamese Database

## Overview

Pipeline that converts 1.2M+ Chinese names from [Chinese-Names-Corpus](https://github.com/wainshine/Chinese-Names-Corpus) into Sino-Vietnamese (Hán Việt) names with strokes, five elements, gender inference, frequency tiers, and AI-generated meanings.

## Quick Start

### Prerequisites
- Node.js 20+
- `.env.local` with `MIMO_API_KEY` (for Phase 4 AI enrichment)
- PocketBase running at `http://127.0.0.1:8090` (for import)

### Run Full Pipeline (50K initial batch)

```bash
# Phase 1: ETL — Parse, clean, filter
npx tsx scripts/corpus/phase1-etl.ts

# Phase 2: Hán Việt conversion
npx tsx scripts/corpus/phase2-hanviet.ts

# Phase 3: Enrichment (strokes, elements, gender, frequency)
npx tsx scripts/corpus/phase3-enrich.ts

# Phase 4: AI batch enrichment (meanings)
npx tsx scripts/corpus/phase4-ai-enrich.ts

# Phase 5: Import to PocketBase (requires collection created first)
npx tsx scripts/corpus/import-to-pocketbase.ts
```

### Process Remaining Names (beyond initial 50K)

The initial batch processes 50K names. To process more:

```bash
# Process next 50K (names 50,000–100,000)
npx tsx scripts/corpus/process-batch.ts 50000 50000

# Process next 100K (names 100,000–200,000)
npx tsx scripts/corpus/process-batch.ts 100000 100000

# Process ALL remaining (~1.1M names)
npx tsx scripts/corpus/process-batch.ts 50000 all
```

Each batch run:
- Reads `clean-names.json` (1.18M names from Phase 1)
- Converts Hán Việt → enriches → AI generates meanings
- Appends to `enriched-names.json` (deduplicates automatically)
- Reuses `char-meanings.json` cache (no duplicate API cost)

## File Reference

| File | Size | Purpose |
|------|------|---------|
| `clean-names.json` | ~4MB | Phase 1 output: 50K clean names with surname/givenName split |
| `hanviet.json` | ~28KB | Hán Việt character dictionary (1,548 entries) |
| `hanviet-names.json` | ~8MB | Phase 2 output: converted names |
| `enriched-names.json` | ~25MB+ | **Final output** — import this to PocketBase |
| `char-meanings.json` | ~162KB | Cached AI responses per character (reused across batches) |

## PocketBase Setup

1. Create `name_corpus` collection (see `pocketbase-schema.md`)
2. Set env vars: `POCKETBASE_URL`, `POCKETBASE_EMAIL`, `POCKETBASE_PASSWORD`
3. Run: `npx tsx scripts/corpus/import-to-pocketbase.ts`

## Architecture

```
Chinese-Names-Corpus (1.2M raw)
         ↓
  [Phase 1: ETL] → clean-names.json (50K+)
         ↓
  [Phase 2: Hán Việt] → hanviet-names.json
         ↓
  [Phase 3: Enrich] → enriched-names.json (strokes, elements, gender)
         ↓
  [Phase 4: AI Meanings] → enriched-names.json (+ meaning, cultural)
         ↓
  [Phase 5: Import] → PocketBase name_corpus collection
         ↓
  [Phase 6: Query] → parallel DB + LLM in random-names.ts
```

## Cost Tracking

| Phase | API Calls | Est. Cost |
|-------|-----------|-----------|
| 1-3 | 0 | $0 |
| 4 (50K batch) | ~13 | ~$0.01 |
| 4 (full 1.2M) | ~20-30 | ~$0.02 |
| **Total** | **~30** | **<$0.05** |

## Notes

- `enriched-names.json` is gitignored (too large for GitHub)
- All other files are tracked in git
- The `Chinese-Names-Corpus/` subdirectory is a git submodule (not tracked)
