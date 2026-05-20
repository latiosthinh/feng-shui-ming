# PocketBase Schema Setup

This document describes the required PocketBase collections and fields for the FengShuiMing application.

## Prerequisites

1. Download PocketBase from https://pocketbase.io/docs/
2. Run `./pocketbase serve` (or `pocketbase.exe serve` on Windows)
3. Access the admin UI at http://127.0.0.1:8090/_/
4. Create a superuser account (this is your admin account)

## Required Collections

### 1. `users` (auth collection)

Base auth collection for registered users.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | email | Yes | — | User email (built-in auth field) |
| `password` | password | Yes | — | User password (built-in auth field) |
| `tier` | select | Yes | `free` | User tier: `free` or `paid` |
| `purchaseCode` | text | No | `""` | Generated purchase code for paid tier |
| `totalGenerations` | number | No | `0` | Total name generations count |
| `totalAnalyzes` | number | No | `0` | Total name analyses count |
| `totalChatNames` | number | No | `0` | Total chat-based name generations |
| `totalFavorites` | number | No | `0` | Total favorited names count |

**Auth options:**
- Enable email/password authentication
- Allow user registration
- Require email verification (optional)

### 2. `anonymous_usage` (base collection)

Tracks usage for unauthenticated users via browser fingerprint.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `fingerprint` | text | Yes | — | Browser fingerprint hash |
| `totalGenerations` | number | No | `0` | Total name generations count |
| `totalAnalyzes` | number | No | `0` | Total name analyses count |
| `totalChatNames` | number | No | `0` | Total chat-based name generations |
| `totalFavorites` | number | No | `0` | Total favorited names count |

**API rules:**
- List: `""` (public — used for usage checks)
- Create: `""` (public — anonymous users can create)
- Update: `""` (public — anonymous users can update their own)
- Delete: `""` (restricted — only via admin)

**Indexes:**
- Create a unique index on `fingerprint` for efficient lookups

### 3. `favorites` (base collection)

Stores user-favorited names.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `user` | relation | Yes | — | Reference to `users` collection |
| `nameNative` | text | Yes | — | The native name text |
| `nameRomanization` | text | No | `""` | Romanized version of the name |
| `nameHanzi` | text | No | `""` | Hanzi characters |
| `nameMeaning` | text | No | `""` | Name meaning description |
| `surname` | text | No | `""` | Associated surname |

**API rules:**
- List: `user = @request.auth.id` (users see only their own)
- Create: `user = @request.auth.id`
- Update: `user = @request.auth.id`
- Delete: `user = @request.auth.id`

## Setup Steps

### Manual Setup (via Admin UI)

1. **Create `users` collection:**
   - Go to Collections → Create collection → Select "Auth collection"
   - Enable email/password auth
   - Add fields: `tier` (select with options `free`, `paid`), `purchaseCode` (text), `totalGenerations` (number), `totalAnalyzes` (number), `totalChatNames` (number), `totalFavorites` (number)

2. **Create `anonymous_usage` collection:**
   - Go to Collections → Create collection → Select "Base collection"
   - Add fields: `fingerprint` (text, unique), `totalGenerations` (number), `totalAnalyzes` (number), `totalChatNames` (number), `totalFavorites` (number)
   - Set API rules as specified above

3. **Create `favorites` collection:**
   - Go to Collections → Create collection → Select "Base collection"
   - Add fields: `user` (relation → users), `nameNative` (text), `nameRomanization` (text), `nameHanzi` (text), `nameMeaning` (text), `surname` (text)
   - Set API rules as specified above

### Programmatic Setup (via PocketBase SDK)

Run this script in Node.js with the PocketBase admin SDK:

```javascript
const PocketBase = require('pocketbase/cjs')
const pb = new PocketBase('http://127.0.0.1:8090')

async function setup() {
  await pb.admins.authWithPassword('admin@example.com', 'your-admin-password')

  // Create users collection (auth)
  await pb.collections.create({
    name: 'users',
    type: 'auth',
    fields: [
      { name: 'tier', type: 'select', values: ['free', 'paid'], maxSelect: 1 },
      { name: 'purchaseCode', type: 'text' },
      { name: 'totalGenerations', type: 'number' },
      { name: 'totalAnalyzes', type: 'number' },
      { name: 'totalChatNames', type: 'number' },
      { name: 'totalFavorites', type: 'number' },
    ],
  })

  // Create anonymous_usage collection
  await pb.collections.create({
    name: 'anonymous_usage',
    type: 'base',
    fields: [
      { name: 'fingerprint', type: 'text', required: true },
      { name: 'totalGenerations', type: 'number' },
      { name: 'totalAnalyzes', type: 'number' },
      { name: 'totalChatNames', type: 'number' },
      { name: 'totalFavorites', type: 'number' },
    ],
    listRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: null,
  })

  // Create favorites collection
  await pb.collections.create({
    name: 'favorites',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', collectionId: 'users_collection_id', required: true },
      { name: 'nameNative', type: 'text', required: true },
      { name: 'nameRomanization', type: 'text' },
      { name: 'nameHanzi', type: 'text' },
      { name: 'nameMeaning', type: 'text' },
      { name: 'surname', type: 'text' },
    ],
    listRule: 'user = @request.auth.id',
    createRule: 'user = @request.auth.id',
    updateRule: 'user = @request.auth.id',
    deleteRule: 'user = @request.auth.id',
  })

  console.log('Schema setup complete!')
}

setup().catch(console.error)
```

## Environment Variables

Set these in your `.env.local`:

```env
POCKETBASE_URL=http://127.0.0.1:8090
```

## Usage Limits

| Tier | Generations | Analyzes | Chat Names |
|------|-------------|----------|------------|
| Free (anonymous) | 5 | 3 | 5 |
| Free (registered) | 20 | 10 | 20 |
| Paid | Unlimited | Unlimited | Unlimited |

These limits are enforced by `src/lib/auth/usage-guard.ts`.
