





import { migrateVisibility, type ContentVisibility } from '../visibility/index.js';
import type { AuthorReference } from './base.js';




export interface VideoFrontmatter {
	
	title: string;
	url: string; 

	
	publishedAt?: string;
	updatedAt?: string;
	visibility?: ContentVisibility;
	published?: boolean;

	
	





	author?: AuthorReference | string;

	
	duration?: string; 
	durationSeconds?: number;
	width?: number;
	height?: number;
	aspectRatio?: string; 

	
	thumbnailUrl?: string;
	previewUrl?: string; 
	blurhash?: string;

	
	platform?: 'youtube' | 'peertube' | 'vimeo' | 'self-hosted';
	videoId?: string; 
	embedUrl?: string;

	
	description?: string;
	excerpt?: string;

	
	tags?: string[];
	categories?: string[];
	language?: string;

	
	license?: string;
	licenseUrl?: string;

	
	views?: number;
	likes?: number;
	comments?: number;

	
	commentsEnabled?: boolean;
	downloadEnabled?: boolean;
	support?: string; 

	
	activityPubId?: string;
}

export interface Video {
	frontmatter: VideoFrontmatter;
	content: string; 
	slug: string;
	filePath?: string;
}

export interface VideoDisplay {
	slug: string;
	title: string;
	url: string;
	thumbnailUrl?: string;
	duration?: string;
	durationSeconds?: number;
	platform: string;
	publishedAt: string;
	author: string;
	description?: string;
	views: number;
	visibility: ContentVisibility;
}




export function videoToDisplay(video: Video): VideoDisplay {
	const { frontmatter } = video;

	return {
		slug: video.slug,
		title: frontmatter.title,
		url: frontmatter.url,
		thumbnailUrl: frontmatter.thumbnailUrl,
		duration: frontmatter.duration,
		durationSeconds: frontmatter.durationSeconds,
		platform: frontmatter.platform || 'unknown',
		publishedAt: frontmatter.publishedAt || new Date().toISOString(),
		author: typeof frontmatter.author === 'string'
			? frontmatter.author
			: frontmatter.author?.handle || 'unknown',
		description: frontmatter.description || frontmatter.excerpt,
		views: frontmatter.views || 0,
		// Fail closed (TIN-2651): missing/unknown frontmatter visibility is private.
		visibility: migrateVisibility(frontmatter.visibility)
	};
}




export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${secs.toString().padStart(2, '0')}`;
}




export function parseDuration(duration: string): number {
	const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return 0;

	const hours = parseInt(match[1] || '0', 10);
	const minutes = parseInt(match[2] || '0', 10);
	const seconds = parseInt(match[3] || '0', 10);

	return hours * 3600 + minutes * 60 + seconds;
}
