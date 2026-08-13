





import { migrateVisibility, type ContentVisibility } from '../visibility/index.js';




export interface GalleryImage {
	url: string;
	alt?: string;
	title?: string;
	width?: number;
	height?: number;
	blurhash?: string;
	thumbnailUrl?: string;
	focalPoint?: [number, number]; 
}




export interface GalleryItemFrontmatter {
	
	title: string;

	
	images: GalleryImage[];
	coverImage?: string; 

	
	publishedAt?: string;
	updatedAt?: string;
	visibility?: ContentVisibility;
	published?: boolean;

	
	author?: string; 

	
	description?: string;
	excerpt?: string;

	
	tags?: string[];
	categories?: string[];

	
	location?: {
		name?: string;
		latitude?: number;
		longitude?: number;
	};

	
	camera?: string;
	lens?: string;
	aperture?: string;
	shutterSpeed?: string;
	iso?: number;
	takenAt?: string;

	
	likes?: number;
	comments?: number;

	
	activityPubId?: string;
}

export interface GalleryItem {
	frontmatter: GalleryItemFrontmatter;
	content: string; 
	slug: string;
	filePath?: string;
}

export interface GalleryItemDisplay {
	slug: string;
	title: string;
	images: GalleryImage[];
	coverImage?: string;
	publishedAt: string;
	author: string;
	description?: string;
	tags: string[];
	visibility: ContentVisibility;
	likes: number;
}




export interface GalleryCollection {
	name: string;
	slug: string;
	description?: string;
	coverImage?: string;
	items: GalleryItemDisplay[];
	totalItems: number;
	visibility: ContentVisibility;
}




export function galleryItemToDisplay(item: GalleryItem): GalleryItemDisplay {
	const { frontmatter } = item;

	return {
		slug: item.slug,
		title: frontmatter.title,
		images: frontmatter.images || [],
		coverImage: frontmatter.coverImage || frontmatter.images?.[0]?.url,
		publishedAt: frontmatter.publishedAt || new Date().toISOString(),
		author: frontmatter.author || 'unknown',
		description: frontmatter.description || frontmatter.excerpt,
		tags: frontmatter.tags || [],
		// Fail closed (TIN-2651): missing/unknown frontmatter visibility is private.
		visibility: migrateVisibility(frontmatter.visibility),
		likes: frontmatter.likes || 0
	};
}




export function getImageSrcset(image: GalleryImage, widths: number[] = [320, 640, 1024, 1920]): string {
	
	
	return widths.map((w) => `${image.url} ${w}w`).join(', ');
}




export function getAspectRatio(width: number, height: number): string {
	const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
	const divisor = gcd(width, height);
	return `${width / divisor}:${height / divisor}`;
}
