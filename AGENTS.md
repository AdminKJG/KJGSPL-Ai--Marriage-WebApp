# Project rules

- Member portal talks to an external REST backend through `src/lib/api/client.ts`; all requests go through it so bearer auth, envelope unwrapping and single-use refresh rotation stay in one place.
- Server data lives in React Query (options in `src/lib/api/modules.ts`); Redux Toolkit (`src/store`) holds only session/UI state, to avoid duplicating cached server data.
- Forms use react-hook-form + zod, so validation matches the API docs' constraints.
- Member routes live under the pathless `_member` layout with `ssr: false`, because tokens are in localStorage and unavailable during SSR.
- Admin/super-admin endpoints are excluded from this app; they belong in a separate admin portal.
- Routing uses TanStack Router (platform-fixed), not react-router-dom.
