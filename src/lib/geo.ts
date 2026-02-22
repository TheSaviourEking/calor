import { headers } from 'next/headers'

interface GeoInfo {
  ip: string
  country: string
  city: string
  region: string
  timezone: string
}

export async function getGeoInfo(): Promise<GeoInfo> {
  const headersList = await headers()
  
  // Get IP from various headers (handles proxies)
  const ip = 
    headersList.get('x-real-ip') ||
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'Unknown'

  // Get geolocation from Cloudflare or similar headers
  const country = headersList.get('cf-ipcountry') || 'Unknown'
  const city = headersList.get('cf-ipcity') || 'Unknown'
  const region = headersList.get('cf-region') || 'Unknown'
  const timezone = headersList.get('cf-timezone') || 'Unknown'

  // Get device info
  const userAgent = headersList.get('user-agent') || 'Unknown'

  return {
    ip,
    country,
    city,
    region,
    timezone,
  }
}

export function parseUserAgent(userAgent: string): string {
  // Simple UA parsing
  if (userAgent.includes('iPhone')) return 'iPhone'
  if (userAgent.includes('iPad')) return 'iPad'
  if (userAgent.includes('Android')) return 'Android Device'
  if (userAgent.includes('Macintosh')) return 'Mac'
  if (userAgent.includes('Windows')) return 'Windows PC'
  if (userAgent.includes('Linux')) return 'Linux'
  return 'Unknown Device'
}

export function formatLocation(geo: GeoInfo): string {
  if (geo.city === 'Unknown' && geo.country === 'Unknown') {
    return 'Unknown location'
  }
  return [geo.city, geo.region, geo.country].filter(Boolean).join(', ')
}
