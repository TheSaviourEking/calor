import { NextRequest, NextResponse } from 'next/server'

// GET /api/address/autocomplete - Get address suggestions from Google Places
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const input = searchParams.get('input')

    if (!input || input.length < 3) {
      return NextResponse.json({ predictions: [] })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    
    if (!apiKey) {
      // Return empty predictions if no API key configured
      console.warn('GOOGLE_PLACES_API_KEY not configured')
      return NextResponse.json({ predictions: [] })
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      new URLSearchParams({
        input,
        key: apiKey,
        types: 'address',
        language: 'en',
        components: 'country:us|country:uk|country:ca|country:au',
      })
    )

    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message)
      return NextResponse.json({ predictions: [] })
    }

    return NextResponse.json({
      predictions: (data.predictions || []).slice(0, 5).map((p: { place_id: string; description: string; structured_formatting?: { main_text: string; secondary_text: string } }) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || '',
      }))
    })
  } catch (error) {
    console.error('Address autocomplete error:', error)
    return NextResponse.json({ predictions: [] })
  }
}
