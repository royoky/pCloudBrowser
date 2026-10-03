# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Dev server at http://localhost:3000
pnpm build      # Production build
pnpm generate   # Static generation
pnpm preview    # Preview the production build
pnpm lint       # ESLint (antfu config)
pnpm lint:fix   # ESLint with --fix
pnpm typecheck  # vue-tsc type checking
```

There is no test suite. After changes, run `pnpm lint` and `pnpm typecheck` — both must pass clean.

Requires Node 24+, pnpm 12+. Copy `.env.example` to `.env` and fill the four pCloud OAuth2 credentials (two apps: full-access and app-folder-only) before `pnpm dev`. Deploys to Cloudflare Workers (Nitro `cloudflare_workers` preset, `wrangler.json` at repo root).

## Architecture

The whole design exists to keep **two axes of change independent**, pivoting on a **neutral HTTP API** (`/api/{provider}/*`) that knows about neither the cloud provider nor the UI library:

- **Provider axis** (pCloud, later Box, …) — isolated by a *server-side* outbound adapter implementing the `FileRepository` port.
- **UI-library axis** (VueFinder, later others) — isolated by a *client-side* adapter implementing that library's driver interface.

Request flow: `VueFinder → app/adapters/vuefinder/driver.ts → HTTP → server/handlers (provider-agnostic) → FileRepository port → server/adapters/pcloud → pCloud API`.

The contract at the pivot is `shared/contracts/file-system.dto.ts` (DTOs: ISO-8601 timestamps, byte sizes, absolute `/`-rooted paths). The domain port is `shared/domain/ports/file.repository.ts` (works in `Date` objects and `FileEntity`/`FolderEntity`). `server/presenters/` maps domain entities → DTOs; the client adapter maps DTOs → VueFinder shapes (`last_modified` epoch-ms, `storage://path` paths).

### Where things live

- `server/handlers/file-system.handlers.ts` — the real, provider-agnostic logic for every endpoint.
- `server/api/pcloud/*.ts` — thin literal routes that just re-export a handler.
- `server/adapters/pcloud/` — `PCloudFileRepository` (the port impl) + low-level `PCloudClient`.
- `server/utils/repository.resolver.ts` — the **only** place that knows which providers exist; maps the `{provider}` path segment + `event.context.auth` to a concrete repository. Adding a provider = one entry here + its adapter.
- `app/adapters/vuefinder/` — the only VueFinder-aware code (driver, DTO↔VueFinder mapper, path translation).

### Conventions that aren't obvious from one file

- **Path-based addressing.** The port and neutral API speak absolute paths; the pCloud adapter is the *only* layer that bridges paths ↔ pCloud numeric ids. Don't leak ids upward.
- **Literal routes, not `[provider]`.** A dynamic `[provider]` directory is intentionally avoided: the OAuth callback at `/api/pcloud/auth/callback` makes `pcloud` a static route node, and Nitro won't fall back from a static node to a `[provider]` sibling. Each new provider adds its own literal route files re-exporting the shared handlers.
- **Auth.** `server/middleware/auth.ts` reads the pCloud session (`nuxt-auth-utils`) and writes `event.context.auth = { token, hostname }`; the resolver consumes it. The access token **stays server-side** — never expose it to the browser, never send it in a DTO.
- **Two OAuth apps.** The login page offers full-access and app-folder-only modes, each backed by a separate registered pCloud OAuth2 app (`NUXT_APP_CLIENT_ID_FULL`/`NUXT_APP_CLIENT_SECRET_FULL` and `NUXT_APP_CLIENT_ID_APP_FOLDER`/`NUXT_APP_CLIENT_SECRET_APP_FOLDER`). The scope is threaded through the OAuth flow via the `state` parameter and stored in the session as `pcloudAccessMode`.
- **Errors are not swallowed** in the client driver — they propagate to VueFinder's `@error` handler so failures are visible instead of rendering an empty view.

## pCloud API gotchas (verified against pCloud's own client, [`pclsync`](https://github.com/pcloud/pclsync) — the public docs are unreliable here)

- **Upload** uses the undocumented session API `upload_create` / `upload_write` / `upload_save`. The `fileops` API (`file_open`/`file_write`) returns `2003 access denied` under OAuth2, and one-shot `uploadfile` is capped by the platform request-body limit (~100 MB on Cloudflare). The session `uploadId` is a persistent integer that survives stateless requests. A custom Uppy uploader (`app/adapters/vuefinder/chunked-uploader.ts`) streams 20 MB chunks. Upload is uniformly chunked even for tiny files (3+ requests).
- **Archive/unarchive (`savezip`, `extractarchive`) return `2003 access denied` under OAuth2** — same restriction as `fileops`. VueFinder's archive and unarchive features are permanently disabled (`archive: false`, `unarchive: false` in `index.vue`).
- **Video streaming** uses undocumented `getmediatranscodelink` (HLS), proxied through `/api/pcloud/hls-proxy` because pCloud's CDN restricts CORS to its own domains. The playlist is rewritten so segments load same-origin (`server/utils/hls.ts`); `hls.js` is wired in via a client plugin.
- **Thumbnails** use `getthumblink`/`getthumblinks` (not `getthumb`).

## Project-specific guardrails

- **Do not log file/folder names, paths, or provider ids** on the server — they are treated as confidential. Keep log messages to methods, endpoints, status codes, and timings.
- **VueFinder CSS** is imported via `@import "vuefinder/dist/vuefinder.css" layer(vuefinder)` in `app/assets/css/main.css`. The full layer order is pre-declared as `@layer theme, base, vuefinder, components, utilities` so VueFinder sits *above* Tailwind's Preflight (`base`) — preventing layout resets — but *below* `utilities` — so Tailwind v4 utilities like `lg:hidden` still override VueFinder's bundled Tailwind v3 classes. If VueFinder is upgraded and its internals look broken, check whether it now relies on being unlayered.
