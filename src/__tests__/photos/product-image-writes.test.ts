// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import sharp from 'sharp'

const { db, getSession, putObject, isStorageConfigured } = vi.hoisted(() => ({
  db: {
    customer: { findUnique: vi.fn() },
    product: { findUnique: vi.fn(), create: vi.fn() },
    category: { findUnique: vi.fn(), create: vi.fn() },
    productImage: { findMany: vi.fn(), create: vi.fn() },
  },
  getSession: vi.fn(),
  putObject: vi.fn(),
  isStorageConfigured: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))
vi.mock('@/lib/photos/storage', () => ({ putObject, isStorageConfigured }))

import { POST as createProduct } from '@/app/api/products/route'
import { POST as addImage } from '@/app/api/admin/products/[id]/images/route'

const asAdmin = () => {
  getSession.mockResolvedValue({ customerId: 'admin_1' })
  db.customer.findUnique.mockResolvedValue({ isAdmin: true, isHost: false })
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue(null)
  isStorageConfigured.mockReturnValue(true)
  putObject.mockImplementation(async (key: string) => `https://cdn.example.com/${key}`)
  db.product.findUnique.mockResolvedValue(null)
  db.category.findUnique.mockResolvedValue({ id: 'cat_1' })
  db.product.create.mockImplementation(async ({ data }: { data: unknown }) => ({ id: 'p_1', ...(data as object) }))
  db.productImage.findMany.mockResolvedValue([{ sortOrder: 2 }])
  db.productImage.create.mockImplementation(async ({ data }: { data: unknown }) => ({ id: 'img_1', ...(data as object) }))
})

describe('POST /api/products', () => {
  const post = (body: unknown) =>
    createProduct(new NextRequest('http://localhost/api/products', { method: 'POST', body: JSON.stringify(body) }))

  it('refuses a signed-in customer before touching the database', async () => {
    getSession.mockResolvedValue({ customerId: 'cust_1' })
    db.customer.findUnique.mockResolvedValue({ isAdmin: false, isHost: false })
    const res = await post({ name: 'Toy', price: 1000 })
    expect(res.status).toBe(403)
    expect(db.product.create).not.toHaveBeenCalled()
  })

  it('persists the photo fields of each image', async () => {
    asAdmin()
    const res = await post({
      name: 'Toy',
      price: 1000,
      categoryId: 'cat_1',
      images: [
        {
          url: 'https://cdn.example.com/originals/a.png',
          originalUrl: 'https://cdn.example.com/originals/a.png',
          altText: 'Front',
          sortOrder: 0,
          treatment: 'blend',
          whiteBackground: true,
          width: 800,
          height: 600,
        },
        { url: 'https://elsewhere.example.com/b.jpg', altText: '', sortOrder: 1, treatment: 'bogus', width: 'wide' },
      ],
    })
    expect(res.status).toBe(200)
    const images = db.product.create.mock.calls[0][0].data.images.create
    expect(images[0]).toEqual({
      url: 'https://cdn.example.com/originals/a.png',
      altText: 'Front',
      sortOrder: 0,
      originalUrl: 'https://cdn.example.com/originals/a.png',
      treatment: 'blend',
      whiteBackground: true,
      width: 800,
      height: 600,
    })
    expect(images[1]).toMatchObject({
      url: 'https://elsewhere.example.com/b.jpg',
      sortOrder: 1,
      originalUrl: null,
      treatment: 'original',
      whiteBackground: false,
      width: null,
      height: null,
    })
  })
})

describe('POST /api/admin/products/[id]/images', () => {
  async function postImage(bytes: Buffer, type = 'image/png') {
    const form = new FormData()
    form.append('file', new File([new Uint8Array(bytes)], 'p.png', { type }))
    form.append('altText', 'Side')
    return addImage(new NextRequest('http://localhost/api/admin/products/p_1/images', { method: 'POST', body: form }), {
      params: Promise.resolve({ id: 'p_1' }),
    })
  }

  it('returns 403 for a signed-in customer', async () => {
    getSession.mockResolvedValue({ customerId: 'cust_1' })
    db.customer.findUnique.mockResolvedValue({ isAdmin: false, isHost: false })
    const res = await postImage(Buffer.from('x'))
    expect(res.status).toBe(403)
    expect(putObject).not.toHaveBeenCalled()
  })

  it('stores the original in R2 and persists the detected fields', async () => {
    asAdmin()
    const png = await sharp({ create: { width: 300, height: 200, channels: 3, background: '#ffffff' } }).png().toBuffer()
    const res = await postImage(png)
    expect(res.status).toBe(200)
    expect(putObject).toHaveBeenCalledWith(expect.stringMatching(/^originals\/[0-9a-f-]{36}\.png$/), expect.any(Buffer), 'image/png')
    const url = `https://cdn.example.com/${putObject.mock.calls[0][0]}`
    expect(db.productImage.create).toHaveBeenCalledWith({
      data: {
        productId: 'p_1',
        url,
        originalUrl: url,
        altText: 'Side',
        sortOrder: 3,
        treatment: 'blend',
        whiteBackground: true,
        width: 300,
        height: 200,
      },
    })
  })

  it('rejects bytes that are not an image', async () => {
    asAdmin()
    const res = await postImage(Buffer.from('definitely not a png'))
    expect(res.status).toBe(400)
    expect(db.productImage.create).not.toHaveBeenCalled()
  })

  it('returns 503 when storage is not configured', async () => {
    asAdmin()
    isStorageConfigured.mockReturnValue(false)
    const res = await postImage(Buffer.from('x'))
    expect(res.status).toBe(503)
  })
})
