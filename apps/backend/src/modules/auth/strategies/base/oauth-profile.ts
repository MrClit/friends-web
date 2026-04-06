type ProviderIdentity = {
  provider: string;
  id: string;
};

export function hasOAuthIdentity(obj: unknown): obj is ProviderIdentity {
  return typeof obj === 'object' && obj !== null && 'provider' in obj && 'id' in obj;
}

export function getPrimaryEmail(profile: unknown): string | undefined {
  if (typeof profile !== 'object' || profile === null || !('emails' in profile)) {
    return undefined;
  }

  const profileWithEmails = profile as { emails?: Array<{ value?: string }> };
  return Array.isArray(profileWithEmails.emails) && profileWithEmails.emails.length > 0
    ? profileWithEmails.emails[0].value
    : undefined;
}

export function getDisplayName(profile: unknown): string | undefined {
  if (typeof profile !== 'object' || profile === null || !('displayName' in profile)) {
    return undefined;
  }

  const profileWithName = profile as { displayName?: string };
  return typeof profileWithName.displayName === 'string' ? profileWithName.displayName : undefined;
}

export function getPrimaryPhoto(profile: unknown): string | undefined {
  if (typeof profile !== 'object' || profile === null || !('photos' in profile)) {
    return undefined;
  }

  const profileWithPhotos = profile as { photos?: Array<{ value?: string }> };
  return Array.isArray(profileWithPhotos.photos) && profileWithPhotos.photos.length > 0
    ? profileWithPhotos.photos[0].value
    : undefined;
}
