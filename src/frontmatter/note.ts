




import { migrateVisibility, type ContentVisibility } from '../visibility/index.js';
import type { AuthorReference } from './base.js';
import type { VideoEmbed } from './blog.js';




export interface NoteFrontmatter {
	
	content?: string; 

	
	publishedAt?: string;
	updatedAt?: string;
	visibility?: ContentVisibility;
	published?: boolean;

	
	





	author?: AuthorReference | string;

	
	inReplyTo?: string; 
	conversation?: string; 

	
	sensitive?: boolean;
	spoilerText?: string;

	
	images?: string[];
	videos?: VideoEmbed[];

	
	mentions?: string[]; 
	hashtags?: string[];

	
	likes?: number;
	boosts?: number;
	replies?: number;

	
	activityPubId?: string;
	url?: string;
}

export interface Note {
	frontmatter: NoteFrontmatter;
	content: string;
	slug: string;
	filePath?: string;
}

export interface NoteDisplay {
	slug: string;
	content: string;
	publishedAt: string;
	author: string;
	visibility: ContentVisibility;
	inReplyTo?: string;
	sensitive: boolean;
	spoilerText?: string;
	images: string[];
	hashtags: string[];
	mentions: string[];
	likes: number;
	boosts: number;
	replies: number;
}




export function noteToDisplay(note: Note): NoteDisplay {
	const { frontmatter } = note;

	return {
		slug: note.slug,
		content: note.content || frontmatter.content || '',
		publishedAt: frontmatter.publishedAt || new Date().toISOString(),
		author: typeof frontmatter.author === 'string'
			? frontmatter.author
			: frontmatter.author?.handle || 'unknown',
		// Fail closed (TIN-2651): missing/unknown frontmatter visibility is private.
		visibility: migrateVisibility(frontmatter.visibility),
		inReplyTo: frontmatter.inReplyTo,
		sensitive: frontmatter.sensitive || false,
		spoilerText: frontmatter.spoilerText,
		images: frontmatter.images || [],
		hashtags: frontmatter.hashtags || [],
		mentions: frontmatter.mentions || [],
		likes: frontmatter.likes || 0,
		boosts: frontmatter.boosts || 0,
		replies: frontmatter.replies || 0
	};
}
