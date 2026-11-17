/**
 * Background removal is a pluggable port: the owner picks a provider with
 * PHOTO_BG_PROVIDER (and its PHOTO_BG_API_KEY). A remover takes the original
 * photo and returns a same-size cutout with a transparent background; the
 * composite job verifies that result before using it.
 */
export interface BackgroundRemover {
  remove(input: Buffer): Promise<Buffer>
}

type ProviderFactory = (apiKey: string) => BackgroundRemover

// Provider name -> factory. Empty until a provider is chosen and registered.
const PROVIDERS: Record<string, ProviderFactory> = {}

/** The configured remover, or null when no known provider and key are set. */
export function getBackgroundRemover(): BackgroundRemover | null {
  const name = process.env.PHOTO_BG_PROVIDER?.trim().toLowerCase()
  const apiKey = process.env.PHOTO_BG_API_KEY?.trim()
  if (!name || !apiKey || !Object.hasOwn(PROVIDERS, name)) return null
  return PROVIDERS[name](apiKey)
}
