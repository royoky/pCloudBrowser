# Nuxt Import Aliases - pCloudBrowser Project

**CRITICAL**: This project uses CUSTOM alias configuration that differs from default Nuxt behavior!

## Alias Configuration

```javascript
// Custom alias configuration in this project:
"~": "/<rootDir>/app",      // Points to app/ directory (NOT project root!)
"@": "/<rootDir>/app",      // Points to app/ directory (NOT project root!)
"~~": "/<rootDir>",         // Points to project root
"@@": "/<rootDir>",         // Points to project root
```

## Import Rules

### 📁 App/Client-Side Imports (Vue components, composables, pages)

**Use `~` or `@` for files in the `app/` directory:**

```typescript
import type { UserInfo } from '@/models/api-return-types'
// ✅ CORRECT - app directory imports
import type { UserInfo } from '~/models/api-return-types'
import AppHeader from '~/components/AppHeader.vue'
import { useGeneral } from '~/composables/useGeneral'
```

### 🖥️ Server-Side Imports (API routes, middleware, server models)

**Use `~~` or `@@` for files outside the `app/` directory:**

```typescript
import { useRuntimeConfig } from '#imports'
// Also correct using @@
import { PCloudTokenResponse } from '@@/server/models/pcloud-api'
import { PCLOUD_API_ENDPOINTS } from '~~/server/constants'

// ✅ CORRECT - server directory imports
import { PCloudTokenResponse } from '~~/server/models/pcloud-api'
```

### ❌ Common Mistakes

```typescript
import { UserInfo } from 'models/api-return-types' // Relative path ❌
// ❌ WRONG - missing directory prefix
import { PCloudTokenResponse } from 'server/models/pcloud-api' // Relative path ❌

import { PCloudTokenResponse } from '@/server/models/pcloud-api' // Looks in /app/server/ ❌
// ❌ WRONG - ~ and @ point to /app, not project root!
import { PCloudTokenResponse } from '~/server/models/pcloud-api' // Looks in /app/server/ ❌
```

## Real-World Examples

### Server API File (e.g., `server/api/pcloud/auth/callback.get.ts`)

```typescript
// ✅ Correct server-side imports
import type {
  PCloudTokenResponse,
  PCloudUserInfo,
} from '~~/server/models/pcloud-api'
import { useRuntimeConfig } from '#imports'
import {
  getPCloudErrorMessage,
  isPCloudSuccess,
} from '~~/server/models/pcloud-api'

// ❌ Wrong - would look in /app/server/models/
import { PCloudTokenResponse } from '~/server/models/pcloud-api'
```

### Client Component (e.g., `app/components/AppHeader.vue`)

```typescript
// ✅ Correct client-side imports
import type { UserInfo } from '~/models/api-return-types'
import AppMenu from '~/components/AppMenu.vue'
import { useGeneral } from '~/composables/useGeneral'

// ❌ Wrong - ~ points to /app, not project root
import { PCloudTokenResponse } from '~/server/models/pcloud-api'
```

## Directory-Specific Guidelines

### Server Directory (`server/`)
- **Purpose**: API endpoints, middleware, server utilities, server models
- **Import alias**: Must use `~~/server/` or `@@/server/`
- **Example files**:
  - `server/api/pcloud/auth/callback.get.ts`
  - `server/models/pcloud-api.ts`
  - `server/constants/pcloud-endpoints.ts`

### App Directory (`app/`)
- **Purpose**: Vue components, pages, composables, client models
- **Import alias**: Use `~/` or `@/` (both point to `/app`)
- **Example files**:
  - `app/components/AppHeader.vue`
  - `app/models/api-return-types.ts`
  - `app/composables/useGeneral.ts`

## Special Cases

### Nuxt Auto-Imports
```typescript
// Use #imports for Nuxt auto-imported utilities
import { useRuntimeConfig } from '#imports'
import { defineEventHandler } from '#imports'
```

### Public Assets
```typescript
// Public assets don't need aliases
import logo from '/favicon-32x32.ico'
```

## Debugging Import Issues

### Check the actual resolved path
```bash
# From project root, check where the import resolves
ls -la app/models/          # For ~/@ imports
ls -la server/models/       # For ~~/@@ imports
```

### Common Error Messages

1. **"Cannot find module"**: Usually means wrong alias or path
   - Solution: Check if you're using `~` vs `~~` correctly

2. **"File not found"**: File exists but path is wrong
   - Solution: Verify the file location and use correct alias

3. **TypeScript errors**: Type definitions not found
   - Solution: Ensure `.ts` files have proper exports

## Best Practices

1. **Be explicit**: Always include the directory prefix (`~/`, `~~/`, `@/`, or `@@/`)
2. **Consistent style**: Stick to one style (e.g., always use `~~` for server)
3. **Type imports**: Use `import type` for type-only imports
4. **Avoid relative paths**: Prefer aliases over `../../` style imports
5. **Check file location**: Verify whether the file is in `app/` or `server/`

## Migration Guide

### Converting from Default Nuxt to This Project's Aliases

**Default Nuxt:**
```typescript
// Default Nuxt - ~ points to root
import Component from '~/components/Component.vue' // /components/Component.vue
```

**This Project:**
```typescript
// For server files, must use ~~
import { Model } from '~~/server/models/Model.ts' // /server/models/Model.ts

// This project - ~ points to /app
import Component from '~/components/Component.vue' // /app/components/Component.vue
```

## Reference

This configuration differs from default Nuxt behavior. See:
- [Nuxt Alias Documentation](https://nuxt.com/docs/4.x/api/nuxt-config#alias)
- Project-specific configuration in `nuxt.config.ts`

**Remember**: When in doubt, use `~~` for server files and `~` for app files!
