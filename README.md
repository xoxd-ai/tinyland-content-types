# @tummycrypt/tinyland-content-types

Shared content type definitions for content management and ActivityPub federation.

## Install

```sh
pnpm add @tummycrypt/tinyland-content-types
```

## Exports

- `.` — core content types
- `./visibility` — visibility and access control types
- `./activitypub` — ActivityPub federation types

## Visibility semantics

`migrateVisibility(legacy: unknown)` is fail-closed (TIN-2651): only a
recognized legacy string can widen visibility, and nothing maps to `public`
except the explicit `public`/`published` aliases. Matching is case-insensitive
and never trims whitespace.

| Input | Result |
| --- | --- |
| `public`, `published` | `public` |
| `unlisted` | `unlisted` |
| `members`, `followers` | `followers` |
| `admin`, `private`, `draft` | `private` |
| `direct` | `direct` |
| `undefined`, `null`, `''` | `private` (silent) |
| any other string | `private` (warns) |
| any non-string value | `private` (warns) |

The same contract holds at the other runtime edges:

- `noteToDisplay`, `videoToDisplay`, and `galleryItemToDisplay` route raw
  frontmatter visibility through `migrateVisibility` — content without an
  explicit recognized visibility renders `private`, never `public`.
- `getAddressingForVisibility` addresses unknown runtime visibility values to
  the author only, never to the ActivityPub Public collection.

`tests/visibility.test.ts` carries the mapping table as the executable
specification.
