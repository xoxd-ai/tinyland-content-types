# Changelog

## 0.4.0

Fail-closed hardening across every runtime visibility edge (TIN-2651):

- `migrateVisibility` now accepts `unknown` and maps any non-string input to
  `private` with a warning, instead of throwing or widening.
- `getAddressingForVisibility` addresses unknown runtime visibility values to
  the author only; the previous default branch returned public addressing.
- `noteToDisplay`, `videoToDisplay`, and `galleryItemToDisplay` route raw
  frontmatter visibility through `migrateVisibility`; the raw `|| 'public'`
  fallbacks are removed. Content without a recognized explicit visibility now
  renders `private`.
- Tests: the `migrateVisibility` mapping is a single table-driven suite over
  the full input domain (known values, missing, null, blank, typos, wrong
  types) plus an `fc.anything()` never-widens property; frontmatter mappers
  get a consolidated fail-closed suite.

## 0.3.1

- `migrateVisibility` maps `undefined`, `null`, and the empty string to
  `private` instead of `public` (PR #12); version authorities synchronized at
  0.3.1 (PR #13).

## 0.3.0

- `migrateVisibility` fails closed: unknown or misspelled visibility values
  warn and return `private` instead of `public` (PR #11).
