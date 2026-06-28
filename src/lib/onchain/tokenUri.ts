export interface TokenUriMedia {
  image: string | null;
  animationUrl: string | null;
}

function extractMediaField(raw: string, field: 'image' | 'animation_url'): string | null {
  try {
    const json = JSON.parse(raw) as Record<string, unknown>;
    const value = json[field];
    return typeof value === 'string' ? value : null;
  } catch {
    const strict = raw.match(new RegExp(`"${field}":"(data:[^"]+)"`));
    if (strict) return strict[1];
    const svgLoose = raw.match(
      new RegExp(`"${field}":"(data:image\\/svg\\+xml;base64,[A-Za-z0-9+/=]+)`),
    );
    return svgLoose ? svgLoose[1] : null;
  }
}

/** Extract `image` and `animation_url` from on-chain tokenURI metadata. */
export function parseTokenUriMedia(uri: string): TokenUriMedia {
  if (!uri.startsWith('data:application/json')) {
    return { image: null, animationUrl: null };
  }
  const base64 = uri.split('base64,')[1];
  if (!base64) return { image: null, animationUrl: null };

  const raw = atob(base64);
  const imageRaw = extractMediaField(raw, 'image');
  const animationRaw = extractMediaField(raw, 'animation_url');

  return {
    image: imageRaw ? normalizeImageDataUrl(imageRaw) : null,
    animationUrl: animationRaw ?? null,
  };
}

/** Extract `image` data URL from on-chain tokenURI metadata. */
export function parseTokenUriToImage(uri: string): string | null {
  return parseTokenUriMedia(uri).image;
}
/** Browsers reliably render utf-8 SVG data URLs in `<img>`; base64 from contract metadata often breaks. */
export function normalizeImageDataUrl(image: string): string {
  if (image.startsWith('data:image/svg+xml;base64,')) {
    const b64 = image.split('base64,')[1];
    if (!b64) return image;
    try {
      const svg = atob(b64);
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    } catch {
      return image;
    }
  }

  if (image.startsWith('data:image/svg+xml,') && !image.includes('charset=utf-8')) {
    const body = image.slice('data:image/svg+xml,'.length);
    try {
      const svg = decodeURIComponent(body);
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    } catch {
      return image;
    }
  }

  return image;
}
