import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import ChangePasswordSection from '@/app/account/security/ChangePasswordSection'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function stubFetch(hasPassword: boolean, resetOk = true) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/account') return new Response(JSON.stringify({ hasPassword }))
    if (url === '/api/auth/me') return new Response(JSON.stringify({ customer: { email: 'ada@example.com' } }))
    if (url === '/api/auth/forgot-password' && init?.method === 'POST') {
      return new Response(JSON.stringify({ success: resetOk }), { status: resetOk ? 200 : 429 })
    }
    return new Response('{}', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('ChangePasswordSection', () => {
  it('emails a reset link to the signed-in member and confirms', async () => {
    const fetchMock = stubFetch(true)
    render(<ChangePasswordSection />)
    fireEvent.click(await screen.findByRole('button', { name: /email me a reset link/i }))
    await screen.findByText(/we have sent a reset link to ada@example.com/i)
    const call = fetchMock.mock.calls.find(([u]) => u === '/api/auth/forgot-password')!
    expect(JSON.parse(String(call[1]!.body))).toEqual({ email: 'ada@example.com' })
    expect(screen.queryByPlaceholderText(/current password/i)).toBeNull()
  })

  it('shows an error line when the request fails', async () => {
    stubFetch(true, false)
    render(<ChangePasswordSection />)
    fireEvent.click(await screen.findByRole('button', { name: /email me a reset link/i }))
    await screen.findByText(/could not send/i)
  })

  it('is hidden for accounts without a password (OAuth only)', async () => {
    const fetchMock = stubFetch(false)
    const { container } = render(<ChangePasswordSection />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/account'))
    await new Promise((r) => setTimeout(r, 0))
    expect(container.textContent).toBe('')
  })
})
