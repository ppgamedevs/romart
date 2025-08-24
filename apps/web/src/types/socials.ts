export interface SocialMedia {
  website?: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  tiktok?: string;
  youtube?: string;
}

export function isSocialMedia(obj: any): obj is SocialMedia {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}
