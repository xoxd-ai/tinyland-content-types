



















export type ContentVisibility = 'public' | 'unlisted' | 'followers' | 'private' | 'direct';




export const CONTENT_VISIBILITY_VALUES = ['public', 'unlisted', 'followers', 'private', 'direct'] as const;






export type LegacyRBACVisibility = 'public' | 'members' | 'admin' | 'private';














export function migrateVisibility(legacy: unknown): ContentVisibility {
	// Fail closed (TIN-2651): anything that is not a recognized legacy string —
	// missing, blank, unknown, or a non-string — maps to 'private', never 'public'.
	if (legacy === undefined || legacy === null || legacy === '') return 'private';

	if (typeof legacy !== 'string') {
		// Log the type only: stringifying a malformed object can itself throw.
		console.warn(`[Visibility] Non-string visibility value (${typeof legacy}), failing closed to 'private'`);
		return 'private';
	}

	switch (legacy.toLowerCase()) {
		case 'public':
		case 'published':
			return 'public';
		case 'unlisted':
			return 'unlisted';
		case 'members':
		case 'followers':
			return 'followers';
		case 'admin':
		case 'private':
		case 'draft':
			return 'private';
		case 'direct':
			return 'direct';
		default:
			// Fail closed: an unknown/typo visibility value must never widen exposure.
			console.warn(`[Visibility] Unknown visibility value: ${legacy}, failing closed to 'private'`);
			return 'private';
	}
}




export function isValidVisibility(value: string): value is ContentVisibility {
	return CONTENT_VISIBILITY_VALUES.includes(value as ContentVisibility);
}




export interface ActivityPubAddressing {
	to: string[];
	cc: string[];
	bto?: string[];
	bcc?: string[];
}


export const ACTIVITYPUB_PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';




export function getAddressingForVisibility(
	visibility: ContentVisibility,
	actorUrl: string,
	followersUrl: string,
	directRecipients?: string[]
): ActivityPubAddressing {
	switch (visibility) {
		case 'public':
			return {
				to: [ACTIVITYPUB_PUBLIC],
				cc: [followersUrl]
			};

		case 'unlisted':
			return {
				to: [followersUrl],
				cc: [ACTIVITYPUB_PUBLIC]
			};

		case 'followers':
			return {
				to: [followersUrl],
				cc: []
			};

		case 'private':
			return {
				to: [actorUrl],
				cc: []
			};

		case 'direct':
			return {
				to: directRecipients || [],
				cc: []
			};

		default:
			// Fail closed (TIN-2651): the switch is exhaustive for ContentVisibility,
			// but untyped runtime callers can still reach this branch — address to
			// the author only, never to Public.
			return {
				to: [actorUrl],
				cc: []
			};
	}
}




export function inferVisibilityFromAddressing(
	to: string[],
	cc: string[],
	followersUrl: string
): ContentVisibility {
	const toSet = new Set(to);
	const ccSet = new Set(cc);

	
	if (toSet.has(ACTIVITYPUB_PUBLIC)) {
		return 'public';
	}

	
	if (ccSet.has(ACTIVITYPUB_PUBLIC)) {
		return 'unlisted';
	}

	
	if (toSet.has(followersUrl) && !ccSet.has(ACTIVITYPUB_PUBLIC)) {
		return 'followers';
	}

	
	if (to.length > 0 && !toSet.has(followersUrl) && !toSet.has(ACTIVITYPUB_PUBLIC)) {
		return 'direct';
	}

	
	return 'private';
}




export function isVisibleTo(
	visibility: ContentVisibility,
	viewerHandle: string | null,
	authorHandle: string,
	isFollower: boolean
): boolean {
	switch (visibility) {
		case 'public':
		case 'unlisted':
			return true;

		case 'followers':
			return viewerHandle === authorHandle || isFollower;

		case 'private':
			return viewerHandle === authorHandle;

		case 'direct':
			
			
			return viewerHandle === authorHandle;

		default:
			return false;
	}
}




export const VISIBILITY_LABELS: Record<ContentVisibility, string> = {
	public: 'Public',
	unlisted: 'Unlisted',
	followers: 'Followers Only',
	private: 'Private',
	direct: 'Direct Message'
};




export const VISIBILITY_ICONS: Record<ContentVisibility, string> = {
	public: 'mdi:earth',
	unlisted: 'mdi:lock-open-outline',
	followers: 'mdi:account-multiple',
	private: 'mdi:lock',
	direct: 'mdi:email-outline'
};
