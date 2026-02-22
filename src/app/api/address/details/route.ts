import { NextRequest, NextResponse } from 'next/server'

// GET /api/address/details - Get full address details from Google Places
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get('placeId')

    if (!placeId) {
      return NextResponse.json({ error: 'placeId is required' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Address lookup not configured' }, { status: 503 })
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
      new URLSearchParams({
        place_id: placeId,
        key: apiKey,
        fields: 'address_component,formatted_address',
      })
    )

    const data = await response.json()

    if (data.status !== 'OK') {
      console.error('Google Places Details API error:', data.status)
      return NextResponse.json({ error: 'Failed to get address details' }, { status: 500 })
    }

    // Parse address components
    const components = data.result.address_components || []
    const getComponent = (type: string) => 
      components.find((c: { types: string[] }) => c.types.includes(type))?.long_name || ''
    const getComponentShort = (type: string) => 
      components.find((c: { types: string[] }) => c.types.includes(type))?.short_name || ''

    const address = {
      line1: [
        getComponent('street_number'),
        getComponent('route')
      ].filter(Boolean).join(' '),
      line2: '',
      city: getComponent('locality') || getComponent('postal_town') || getComponent('sublocality'),
      state: getComponentShort('administrative_area_level_1'),
      postcode: getComponent('postal_code'),
      country: getComponentShort('country') || 'US',
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Address details error:', error)
    return NextResponse.json({ error: 'Failed to get address details' }, { status: 500 })
  }
}
