// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, getSession } = vi.hoisted(() => ({
  db: {
    customer: { findUnique: vi.fn() },
    supportTicket: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn() },
    ticketMessage: { create: vi.fn() },
  },
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))

import { GET as getTicket, PUT as putTicket } from '@/app/api/tickets/[id]/route'
import { GET as listTickets } from '@/app/api/tickets/route'
import { POST as postMessage } from '@/app/api/tickets/[id]/messages/route'

const ctx = { params: Promise.resolve({ id: 't1' }) }
const req = (body?: unknown) =>
  new NextRequest('http://localhost/api/tickets/t1', {
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
  })

const allMessages = [
  { id: 'm1', content: 'hi', isInternal: false },
  { id: 'm2', content: 'staff only', isInternal: true },
]
const ticketRow = { id: 't1', customerId: 'c1', internalNotes: 'secret note', messages: allMessages }

function asCustomer(id = 'c1', isAdmin = false) {
  getSession.mockResolvedValue({ customerId: id })
  db.customer.findUnique.mockResolvedValue({ id, isAdmin, firstName: 'A', lastName: 'B' })
}

beforeEach(() => {
  vi.clearAllMocks()
  db.supportTicket.findUnique.mockImplementation(async ({ include, omit }: { include?: { messages?: { where?: { isInternal?: boolean } } }; omit?: { internalNotes?: boolean } }) => {
    const f = include?.messages?.where
    const { internalNotes, ...rest } = ticketRow
    return { ...(omit?.internalNotes ? rest : { ...rest, internalNotes }), messages: f ? allMessages.filter((m) => m.isInternal === f.isInternal) : allMessages }
  })
  db.supportTicket.findMany.mockResolvedValue([])
  db.supportTicket.count.mockResolvedValue(0)
  db.supportTicket.update.mockResolvedValue(ticketRow)
  db.ticketMessage.create.mockImplementation(async ({ data }: { data: unknown }) => data)
})

describe('GET /api/tickets/[id]', () => {
  it('customer sees no internal messages and no internalNotes', async () => {
    asCustomer()
    const res = await getTicket(req(), ctx)
    const { ticket } = await res.json()
    expect(ticket.messages.map((m: { id: string }) => m.id)).toEqual(['m1'])
    expect('internalNotes' in ticket).toBe(false)
  })

  it('admin sees internal messages and notes', async () => {
    asCustomer('admin1', true)
    const { ticket } = await (await getTicket(req(), ctx)).json()
    expect(ticket.messages).toHaveLength(2)
    expect(ticket.internalNotes).toBe('secret note')
  })

  it("another customer's ticket is a 404", async () => {
    asCustomer('c2')
    expect((await getTicket(req(), ctx)).status).toBe(404)
  })
})

describe('GET /api/tickets (list)', () => {
  it('customer list omits internalNotes and internal last-message', async () => {
    asCustomer()
    await listTickets(new NextRequest('http://localhost/api/tickets'))
    const args = db.supportTicket.findMany.mock.calls[0][0]
    expect(args.where.customerId).toBe('c1')
    expect(args.include.messages.where).toEqual({ isInternal: false })
    expect(args.omit).toEqual({ internalNotes: true })
  })

  it('admin list keeps everything', async () => {
    asCustomer('admin1', true)
    await listTickets(new NextRequest('http://localhost/api/tickets'))
    const args = db.supportTicket.findMany.mock.calls[0][0]
    expect(args.include.messages.where).toBeUndefined()
    expect(args.omit).toBeUndefined()
  })
})

describe('POST /api/tickets/[id]/messages', () => {
  it('customer cannot post an internal message', async () => {
    asCustomer()
    await postMessage(req({ content: 'hello', isInternal: true }), ctx)
    expect(db.ticketMessage.create.mock.calls[0][0].data.isInternal).toBe(false)
  })

  it('admin can post an internal message', async () => {
    asCustomer('admin1', true)
    await postMessage(req({ content: 'note', isInternal: true }), ctx)
    expect(db.ticketMessage.create.mock.calls[0][0].data.isInternal).toBe(true)
  })
})

describe('PUT /api/tickets/[id]', () => {
  it('non-staff cannot set internalNotes, assignedToId or priority', async () => {
    asCustomer()
    const r = new NextRequest('http://localhost/api/tickets/t1', {
      method: 'PUT',
      body: JSON.stringify({ internalNotes: 'x', assignedToId: 'a', priority: 'urgent' }),
    })
    expect((await putTicket(r, ctx)).status).toBe(403)
    expect(db.supportTicket.update).not.toHaveBeenCalled()
  })
})
