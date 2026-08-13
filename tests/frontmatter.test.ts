import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	noteToDisplay,
	videoToDisplay,
	galleryItemToDisplay,
	type Note,
	type Video,
	type GalleryItem
} from '../src/index.js';

// Frontmatter arrives from YAML and is untyped at runtime. Every display
// mapper must route visibility through migrateVisibility so that missing or
// unknown values fail closed to 'private' (TIN-2651).
const item = (visibility: unknown) => ({
	frontmatter: { title: 't', url: 'https://example.com/v', visibility },
	content: '',
	slug: 's'
});

const MAPPERS: { label: string; toDisplay: (visibility: unknown) => { visibility: string } }[] = [
	{ label: 'noteToDisplay', toDisplay: (v) => noteToDisplay(item(v) as unknown as Note) },
	{ label: 'videoToDisplay', toDisplay: (v) => videoToDisplay(item(v) as unknown as Video) },
	{ label: 'galleryItemToDisplay', toDisplay: (v) => galleryItemToDisplay(item(v) as unknown as GalleryItem) }
];

describe('frontmatter display mappers fail closed on visibility', () => {
	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe.each(MAPPERS)('$label', ({ toDisplay }) => {
		it.each([
			{ label: 'missing', input: undefined, expected: 'private' },
			{ label: 'unknown string', input: 'everyone', expected: 'private' },
			{ label: 'legacy alias', input: 'members', expected: 'followers' },
			{ label: 'explicit public', input: 'public', expected: 'public' }
		])('$label -> $expected', ({ input, expected }) => {
			expect(toDisplay(input).visibility).toBe(expected);
		});
	});
});
