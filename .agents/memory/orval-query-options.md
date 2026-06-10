---
name: Orval react-query hook options in v5
description: How to correctly pass options to orval-generated useQuery hooks with @tanstack/react-query v5.
---

## Rule

In react-query v5, `UseQueryOptions` requires `queryKey`. Orval-generated hooks wrap options as `{ query?: UseQueryOptions, request?: ... }`. Passing `{ query: { refetchInterval: N } }` fails because `UseQueryOptions` needs `queryKey`.

**Why:** react-query v5 made `queryKey` required in `UseQueryOptions`. Orval's generated `getXxxQueryOptions()` adds the key internally, but the type definition still requires it when you construct the object externally.

**How to apply:** Do not pass `refetchInterval` through the `{ query: ... }` options wrapper. If auto-refresh is needed, use `useEffect` + manual `refetch`, or just omit the interval option entirely.
