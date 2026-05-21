# PocketBase Schema: name_corpus collection

## Collection: `name_corpus` (base collection)

Stores pre-processed Sino-Vietnamese names from the Chinese Names Corpus.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `hanzi` | text | Yes | — | Chinese characters (full name) |
| `hanViet` | text | Yes | — | Sino-Vietnamese reading (given name only) |
| `surnameHanzi` | text | Yes | — | Surname in Chinese |
| `surnameHanViet` | text | Yes | — | Surname in Vietnamese |
| `givenNameHanzi` | text | Yes | — | Given name in Chinese |
| `givenNameHanViet` | text | Yes | — | Given name in Vietnamese |
| `strokes` | json | No | — | Array of stroke counts per character |
| `fiveElements` | json | No | — | Array of element strings (Kim/Mộc/Thủy/Hỏa/Thổ) |
| `gender` | select | No | `neutral` | `male`, `female`, `neutral` |
| `genderConfidence` | number | No | `0` | 0.0-1.0 confidence score |
| `frequency` | select | No | `standard` | `common`, `standard`, `rare` |
| `meaning` | text | No | `""` | Vietnamese meaning (empty until AI enrichment) |
| `culturalSignificance` | text | No | `""` | Vietnamese cultural context (empty until AI enrichment) |
| `isImported` | bool | Yes | `true` | Marks corpus vs user-generated |

**API rules:**
- List: `""` (public — used for name generation)
- Create: `""` (restricted — admin only via import script)
- Update: `""` (restricted — admin only)
- Delete: `""` (restricted — admin only)

**Indexes:**
- Create index on `hanViet` for text search
- Create index on `surnameHanViet` for surname filtering
- Create index on `gender` for gender filtering
- Create index on `frequency` for tier filtering

## Setup via Admin UI

1. Go to Collections → Create collection → Select "Base collection"
2. Name: `name_corpus`
3. Add all fields as specified above
4. Set API rules as specified
5. Create indexes on: `hanViet`, `surnameHanViet`, `gender`, `frequency`

## Import via Script

Run: `npx tsx scripts/corpus/import-to-pocketbase.ts`

Requires PocketBase running at `http://127.0.0.1:8090` with admin credentials set in `.env.local`.
