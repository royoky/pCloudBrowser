# pCloud Browser

A cloud file browser built with Nuxt 4 and Nuxt UI, using the [VueFinder](https://github.com/n1crack/vuefinder) file-manager UI. The VueFinder file menu is fully wired with **New folder** and **New file** actions. The application uses a hexagonal architecture designed so that both the cloud provider and the UI library can be swapped independently.

The codebase enforces **TypeScript best practices** including strict type boundaries, discriminated unions, branded types, and exhaustive checks.

## Tech stack

- **Nuxt 4** (Vue 3, Nitro server engine)
- **Nuxt UI 4** + **Tailwind CSS 4** (app shell, theming)
- **VueFinder 4** (file-manager UI), **Uppy 5** (upload client)
- **hls.js** (video streaming playback)
- **nuxt-auth-utils** (session, pCloud OAuth2)
- **@nuxthub/core** (deployment)
- **Zod** (request validation), **Luxon** (dates)
- **TypeScript**, **ESLint** (antfu config)

## Architecture

The design separates two independent axes of change behind a **neutral HTTP API** that knows about neither the cloud provider nor the UI library:

- **Swap the cloud provider** (pCloud, later others): isolated by a *server-side* outbound adapter implementing the `FileRepository` port.
- **Swap the UI library** (VueFinder, later others): isolated by a *client-side* adapter implementing that library's driver interface.

```mermaid
flowchart LR
    subgraph CLIENT["Client (UI axis)"]
      UI["VueFinder"]
      CA["Adapter: app/adapters/vuefinder<br/>maps neutral API ↔ VueFinder"]
      UI --> CA
    end
    NEUTRAL{{"Neutral HTTP API — /api/pcloud/*<br/>FileRepository port projected over HTTP"}}
    subgraph SERVER["Nitro server (provider axis)"]
      H["Inbound: handlers + presenter"]
      P{{"FileRepository port"}}
      OUT["Outbound: PCloudFileRepository"]
      H --> P
      P --- OUT
    end
    PCLOUD[("pCloud API")]
    CA -->|HTTP| NEUTRAL
    NEUTRAL --- H
    OUT --> PCLOUD
```

Key properties:

- **Path-based addressing.** The domain port and neutral API speak absolute paths (`/Documents/file.txt`); the pCloud adapter is the only layer that bridges paths to pCloud's numeric ids.
- **Explicit serialization boundary.** The server presenter maps domain entities (with `Date` objects) to DTOs with ISO-8601 strings; the client adapter maps DTOs to VueFinder's shapes (e.g. `last_modified` epoch-ms, `storage://path` paths).
- **No duplicated layers.** The browser talks only to our neutral API; the pCloud access token never leaves the server.

### Neutral API

All endpoints live under `/api/{provider}` (currently `pcloud`) and mirror the `FileRepository` port:

| Method & path | Purpose |
|---|---|
| `GET /api/pcloud/list?path=` | List a directory and its children |
| `POST /api/pcloud/copy` | Copy items (`{ sources, destinationPath }`) |
| `POST /api/pcloud/move` | Move items |
| `POST /api/pcloud/delete` | Delete items (`{ paths }`) |
| `POST /api/pcloud/create-folder` | Create a folder (`{ parentPath, name }`) |
| `POST /api/pcloud/create-file` | Create a new empty file (`{ parentPath, name }`) |
| `POST /api/pcloud/save-file` | Write text content to a file (`{ path, content }`) |
| `PATCH /api/pcloud/items` | Rename (`{ path, newName }`) |
| `GET /api/pcloud/search` | Search |
| `GET /api/pcloud/content?path=` | Read text content |
| `GET /api/pcloud/download?path=` | 302 redirect to a signed download URL |
| `GET /api/pcloud/preview?path=` | Image: 302 to a thumbnail/preview URL. Video: proxied HLS playlist |
| `GET /api/pcloud/hls-proxy` | Rewrites pCloud's HLS playlist so segments load same-origin (CDN CORS is locked to pCloud's own domains) |
| `POST /api/pcloud/upload/create` | Open a resumable upload session → `{ uploadId }` |
| `PUT /api/pcloud/upload/write?uploadId=&offset=` | Append a raw chunk at a byte offset |
| `POST /api/pcloud/upload/save` | Finalize the session into a file (`{ uploadId, path, name }`) |

The handlers are provider-agnostic (`server/handlers/file-system.handlers.ts`); each is mounted via a thin literal route that re-exports it. A note on routing: a dynamic `[provider]` directory is intentionally **not** used, because the OAuth callback at `/api/pcloud/auth/callback` makes `pcloud` a static route node and Nitro won't fall back from it to a `[provider]` sibling.

## Setup

### Prerequisites

- Node.js 24+
- pnpm 11+
- A pCloud account and two registered pCloud OAuth2 apps (one for full-access, one for app-folder-only)

### Installation

```bash
pnpm install
cp .env.example .env
# Fill in the four pCloud OAuth2 credentials (see .env.example).
# NUXT_APP_CLIENT_ID_FULL / NUXT_APP_CLIENT_SECRET_FULL       → full-access app
# NUXT_APP_CLIENT_ID_APP_FOLDER / NUXT_APP_CLIENT_SECRET_APP_FOLDER → app-folder app
```

### Authentication flow

1. The login page offers two buttons: **Full access** (`/auth/pcloud?scope=full`) and **App folder only** (`/auth/pcloud?scope=appfolder`). Each targets a different registered OAuth2 app.
2. `/auth/pcloud` picks the matching `client_id` based on `scope`, encodes the scope as the OAuth `state` parameter, and redirects to pCloud's authorize endpoint.
3. pCloud redirects back to `/api/pcloud/auth/callback` with the code and `state`. The callback reads `state` to select the right `client_secret`, exchanges the code for a token, fetches user info, and stores the session (via `nuxt-auth-utils`), including `pcloudAccessMode`.
4. The client reads the session with `useUserSession()`; once `loggedIn`, VueFinder renders. The access token stays server-side and is read by the auth middleware on each `/api/*` request.

## Development

```bash
pnpm dev        # Dev server at http://localhost:3000
pnpm build      # Production build
pnpm generate   # Static generation
pnpm preview    # Preview the production build
pnpm lint       # ESLint
pnpm lint:fix   # ESLint with --fix
pnpm typecheck  # vue-tsc type checking
```

## Project structure

```bash
app/
├── adapters/vuefinder/   # Client UI adapter: driver, DTO↔VueFinder mapper, path translation
├── components/           # AppHeader (Nuxt UI shell)
├── composables/          # useVueFinderDriver
├── pages/index.vue       # Mounts <VueFinder> once logged in
└── plugins/              # Registers the VueFinder component (client-only)

server/
├── api/pcloud/           # Neutral endpoints (+ auth/callback, upload/, hls-proxy)
├── adapters/pcloud/      # PCloudFileRepository (outbound) + low-level PCloudClient
├── handlers/             # Shared, provider-agnostic request handlers
├── presenters/           # Domain entity → DTO
├── utils/                # Provider resolver, HTTP error mapping
├── models/ constants/    # pCloud API response types and endpoints
├── middleware/           # Auth + request logging
└── routes/auth/          # OAuth2 entrypoint

shared/
├── contracts/            # Neutral API DTOs (the wire contract)
├── domain/               # Provider-agnostic entities + FileRepository port
└── types/                # VueFinder + auth types
```

### Adding a cloud provider

1. Implement `FileRepository` in `server/adapters/<provider>/`, bridging the path-based port to the provider's API.
2. Register it in `server/utils/repository.resolver.ts`.
3. Add literal routes under `server/api/<provider>/` that re-export the shared handlers.

The client and the neutral contract stay untouched.

### Swapping the UI library

Replace `app/adapters/<library>/` with an adapter implementing the new library's driver interface in terms of the neutral API. The server stays untouched.

### Upload & video streaming (undocumented pCloud endpoints)

Two features rely on pCloud endpoints that are absent from the public docs but used by pCloud's own desktop client ([`pclsync`](https://github.com/pcloud/pclsync)):

- **Resumable chunked upload.** pCloud's `fileops` API (`file_open`/`file_write`) returns `2003 access denied` under OAuth2, and the one-shot `uploadfile` is bounded by the deployment platform's request-body limit (~100 MB on Cloudflare). The **`upload_create` / `upload_write` / `upload_save`** session API *does* work under OAuth2: the `uploadId` is a persistent integer that survives stateless requests, so a custom Uppy uploader streams the file in 20 MB chunks (real per-chunk progress, no platform size ceiling).
- **Video streaming** uses `getmediatranscodelink` (undocumented HLS), proxied through `/hls-proxy` because pCloud's CDN restricts CORS to its own domains.

## Status & limitations

- File browsing, copy, move, delete, rename, create-folder, **create-file**, search, download, preview (image thumbnails + video), chunked upload and HLS video streaming are implemented end-to-end.
- Upload is uniformly chunked — even small files take 3+ requests (`create`/`write`/`save`). A one-shot fast path for small files is a possible optimization, not yet done.
- VueFinder ships a global, unlayered CSS bundle that can override Nuxt UI utilities; keep that in mind when styling outside the file browser.

## Resources

- [Nuxt](https://nuxt.com/docs) · [Nuxt UI](https://ui.nuxt.com/) · [VueFinder](https://github.com/n1crack/vuefinder) · [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) · [pCloud API](https://docs.pcloud.com/)
