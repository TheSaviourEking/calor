import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import PackagingClient from '@/app/account/packaging/PackagingClient'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('PackagingClient offers only what fulfilment honours', () => {
  it('shows plain packaging, discreet label and delivery instructions; no sender, signature or day controls', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ preference: null }))))
    render(<PackagingClient />)
    expect(await screen.findByText('Plain Packaging')).toBeTruthy()
    expect(screen.getByText('Discreet Label')).toBeTruthy()
    expect(screen.getByText('Delivery Instructions')).toBeTruthy()
    for (const gone of ['Custom Sender Name', 'Require Signature', 'Preferred Delivery Days', 'Avoid Weekend Delivery']) {
      expect(screen.queryByText(gone)).toBeNull()
    }
  })
})
