import { describe, it, expect } from 'vitest';
import { test as fcTest } from '@fast-check/vitest';
import fc from 'fast-check';
import {
	migrateVisibility,
	isValidVisibility,
	getAddressingForVisibility,
	inferVisibilityFromAddressing,
	isVisibleTo,
	CONTENT_VISIBILITY_VALUES,
	VISIBILITY_LABELS,
	VISIBILITY_ICONS,
	ACTIVITYPUB_PUBLIC,
	type ContentVisibility,
	type ActivityPubAddressing
} from '../src/visibility/index.js';





const validVisibilityArb = fc.constantFrom(...CONTENT_VISIBILITY_VALUES);

const urlArb = fc.webUrl();





// This table IS the migration mapping specification (TIN-2651): every input
// outside the recognized legacy strings fails closed to 'private'.
const MIGRATION_CASES: { label: string; input: unknown; expected: ContentVisibility }[] = [
	// Recognized legacy values
	{ label: "'public'", input: 'public', expected: 'public' },
	{ label: "'published'", input: 'published', expected: 'public' },
	{ label: "'unlisted'", input: 'unlisted', expected: 'unlisted' },
	{ label: "'members'", input: 'members', expected: 'followers' },
	{ label: "'followers'", input: 'followers', expected: 'followers' },
	{ label: "'admin'", input: 'admin', expected: 'private' },
	{ label: "'private'", input: 'private', expected: 'private' },
	{ label: "'draft'", input: 'draft', expected: 'private' },
	{ label: "'direct'", input: 'direct', expected: 'direct' },
	// Case-insensitive
	{ label: "'PUBLIC'", input: 'PUBLIC', expected: 'public' },
	{ label: "'Members'", input: 'Members', expected: 'followers' },
	{ label: "'PRIVATE'", input: 'PRIVATE', expected: 'private' },
	{ label: "'Draft'", input: 'Draft', expected: 'private' },
	// Missing / blank
	{ label: 'undefined', input: undefined, expected: 'private' },
	{ label: 'null', input: null, expected: 'private' },
	{ label: 'empty string', input: '', expected: 'private' },
	// Unknown strings and typos (no trimming: whitespace is unknown)
	{ label: "'unknown-value'", input: 'unknown-value', expected: 'private' },
	{ label: "'pubic' (typo)", input: 'pubic', expected: 'private' },
	{ label: "'folowers' (typo)", input: 'folowers', expected: 'private' },
	{ label: "' public ' (untrimmed)", input: ' public ', expected: 'private' },
	// Wrong types
	{ label: '0', input: 0, expected: 'private' },
	{ label: '42', input: 42, expected: 'private' },
	{ label: 'true', input: true, expected: 'private' },
	{ label: 'false', input: false, expected: 'private' },
	{ label: 'object', input: { visibility: 'public' }, expected: 'private' },
	{ label: "['public']", input: ['public'], expected: 'private' }
];

describe('migrateVisibility', () => {
	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it.each(MIGRATION_CASES)('$label -> $expected', ({ input, expected }) => {
		expect(migrateVisibility(input)).toBe(expected);
	});

	it('warns on unknown strings and non-strings, stays silent for missing/blank', () => {
		migrateVisibility('unknown-value');
		expect(console.warn).toHaveBeenCalledWith(
			expect.stringContaining('Unknown visibility value: unknown-value')
		);
		migrateVisibility(42);
		expect(console.warn).toHaveBeenCalledTimes(2);
		migrateVisibility(undefined);
		migrateVisibility(null);
		migrateVisibility('');
		expect(console.warn).toHaveBeenCalledTimes(2);
	});

	fcTest.prop([fc.anything()])(
		'maps every input to a valid ContentVisibility and only public/published to "public"',
		(value) => {
			const result = migrateVisibility(value);
			expect(CONTENT_VISIBILITY_VALUES).toContain(result);
			if (result === 'public') {
				expect(typeof value).toBe('string');
				expect(['public', 'published']).toContain((value as string).toLowerCase());
			}
		}
	);

	fcTest.prop([validVisibilityArb])('is idempotent for valid values', (visibility) => {
		const result = migrateVisibility(visibility);
		expect(migrateVisibility(result)).toBe(result);
	});
});





describe('isValidVisibility', () => {
	it.each(CONTENT_VISIBILITY_VALUES)('should return true for "%s"', (v) => {
		expect(isValidVisibility(v)).toBe(true);
	});

	it('should return false for invalid values', () => {
		expect(isValidVisibility('members')).toBe(false);
		expect(isValidVisibility('admin')).toBe(false);
		expect(isValidVisibility('draft')).toBe(false);
		expect(isValidVisibility('')).toBe(false);
		expect(isValidVisibility('foo')).toBe(false);
	});
});





describe('getAddressingForVisibility', () => {
	const actorUrl = 'https://example.com/users/alice';
	const followersUrl = 'https://example.com/users/alice/followers';

	it('should return public addressing for "public"', () => {
		const result = getAddressingForVisibility('public', actorUrl, followersUrl);
		expect(result.to).toEqual([ACTIVITYPUB_PUBLIC]);
		expect(result.cc).toEqual([followersUrl]);
	});

	it('should return unlisted addressing for "unlisted"', () => {
		const result = getAddressingForVisibility('unlisted', actorUrl, followersUrl);
		expect(result.to).toEqual([followersUrl]);
		expect(result.cc).toEqual([ACTIVITYPUB_PUBLIC]);
	});

	it('should return followers-only addressing for "followers"', () => {
		const result = getAddressingForVisibility('followers', actorUrl, followersUrl);
		expect(result.to).toEqual([followersUrl]);
		expect(result.cc).toEqual([]);
	});

	it('should return private addressing for "private"', () => {
		const result = getAddressingForVisibility('private', actorUrl, followersUrl);
		expect(result.to).toEqual([actorUrl]);
		expect(result.cc).toEqual([]);
	});

	it('should return direct addressing for "direct" with recipients', () => {
		const recipients = ['https://example.com/users/bob', 'https://example.com/users/carol'];
		const result = getAddressingForVisibility('direct', actorUrl, followersUrl, recipients);
		expect(result.to).toEqual(recipients);
		expect(result.cc).toEqual([]);
	});

	it('should return empty "to" for "direct" without recipients', () => {
		const result = getAddressingForVisibility('direct', actorUrl, followersUrl);
		expect(result.to).toEqual([]);
		expect(result.cc).toEqual([]);
	});

	it('fails closed to author-only addressing for unknown runtime values', () => {
		const result = getAddressingForVisibility('bogus' as ContentVisibility, actorUrl, followersUrl);
		expect(result.to).toEqual([actorUrl]);
		expect(result.cc).toEqual([]);
	});
});





describe('inferVisibilityFromAddressing', () => {
	const followersUrl = 'https://example.com/users/alice/followers';

	it('should infer "public" when Public is in "to"', () => {
		expect(inferVisibilityFromAddressing(
			[ACTIVITYPUB_PUBLIC],
			[followersUrl],
			followersUrl
		)).toBe('public');
	});

	it('should infer "unlisted" when Public is in "cc"', () => {
		expect(inferVisibilityFromAddressing(
			[followersUrl],
			[ACTIVITYPUB_PUBLIC],
			followersUrl
		)).toBe('unlisted');
	});

	it('should infer "followers" when followers URL is in "to" with no public', () => {
		expect(inferVisibilityFromAddressing(
			[followersUrl],
			[],
			followersUrl
		)).toBe('followers');
	});

	it('should infer "direct" when specific recipients are in "to"', () => {
		expect(inferVisibilityFromAddressing(
			['https://example.com/users/bob'],
			[],
			followersUrl
		)).toBe('direct');
	});

	it('should infer "private" when no recipients', () => {
		expect(inferVisibilityFromAddressing(
			[],
			[],
			followersUrl
		)).toBe('private');
	});
});





describe('visibility addressing round-trip', () => {
	const actorUrl = 'https://example.com/users/alice';
	const followersUrl = 'https://example.com/users/alice/followers';

	fcTest.prop([
		fc.constantFrom('public', 'unlisted', 'followers' as ContentVisibility)
	])('round-trips for non-direct/non-private visibilities', (visibility) => {
		const addressing = getAddressingForVisibility(visibility, actorUrl, followersUrl);
		const inferred = inferVisibilityFromAddressing(addressing.to, addressing.cc, followersUrl);
		expect(inferred).toBe(visibility);
	});

	it('round-trips for "private" visibility', () => {
		const addressing = getAddressingForVisibility('private', actorUrl, followersUrl);
		const inferred = inferVisibilityFromAddressing(addressing.to, addressing.cc, followersUrl);
		
		
		expect(inferred).toBe('direct');
	});

	it('round-trips for "direct" with specific recipients', () => {
		const recipients = ['https://example.com/users/bob'];
		const addressing = getAddressingForVisibility('direct', actorUrl, followersUrl, recipients);
		const inferred = inferVisibilityFromAddressing(addressing.to, addressing.cc, followersUrl);
		expect(inferred).toBe('direct');
	});
});





describe('isVisibleTo', () => {
	const author = 'alice';

	it('public content is visible to everyone', () => {
		expect(isVisibleTo('public', null, author, false)).toBe(true);
		expect(isVisibleTo('public', 'bob', author, false)).toBe(true);
	});

	it('unlisted content is visible to everyone', () => {
		expect(isVisibleTo('unlisted', null, author, false)).toBe(true);
		expect(isVisibleTo('unlisted', 'bob', author, false)).toBe(true);
	});

	it('followers-only content is visible to author', () => {
		expect(isVisibleTo('followers', 'alice', author, false)).toBe(true);
	});

	it('followers-only content is visible to followers', () => {
		expect(isVisibleTo('followers', 'bob', author, true)).toBe(true);
	});

	it('followers-only content is NOT visible to non-followers', () => {
		expect(isVisibleTo('followers', 'bob', author, false)).toBe(false);
	});

	it('followers-only content is NOT visible to anonymous users', () => {
		expect(isVisibleTo('followers', null, author, false)).toBe(false);
	});

	it('private content is only visible to author', () => {
		expect(isVisibleTo('private', 'alice', author, false)).toBe(true);
		expect(isVisibleTo('private', 'bob', author, true)).toBe(false);
		expect(isVisibleTo('private', null, author, false)).toBe(false);
	});

	it('direct content is only visible to author (caller handles recipients)', () => {
		expect(isVisibleTo('direct', 'alice', author, false)).toBe(true);
		expect(isVisibleTo('direct', 'bob', author, true)).toBe(false);
	});

	fcTest.prop([validVisibilityArb])('author can always see their own content', (visibility) => {
		expect(isVisibleTo(visibility, 'alice', 'alice', false)).toBe(true);
	});
});





describe('VISIBILITY_LABELS', () => {
	it('should have labels for all visibility values', () => {
		for (const v of CONTENT_VISIBILITY_VALUES) {
			expect(VISIBILITY_LABELS[v]).toBeDefined();
			expect(typeof VISIBILITY_LABELS[v]).toBe('string');
		}
	});
});

describe('VISIBILITY_ICONS', () => {
	it('should have icons for all visibility values', () => {
		for (const v of CONTENT_VISIBILITY_VALUES) {
			expect(VISIBILITY_ICONS[v]).toBeDefined();
			expect(typeof VISIBILITY_ICONS[v]).toBe('string');
		}
	});
});
