// @vitest-environment node
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db } = vi.hoisted(() => ({
  db: {
    product: { findMany: vi.fn() },
    quizResult: { create: vi.fn() },
  },
}))
vi.mock('@/lib/db', () => ({ db }))

import { POST as wishlist } from '@/app/api/wishlist/route'

const PRIVATE_COLUMNS = ['originalUrl', 'compositeUrl', 'reviewNote', 'reviewStatus', 'backdrop'] as const

const FULL_IMAGE = {
  id: 'img_1',
  productId: 'prod_1',
  url: 'https://pub-1.r2.dev/products/a.jpg',
  altText: 'Ring',
  sortOrder: 0,
  originalUrl: 'https://pub-1.r2.dev/originals/a.jpg',
  treatment: 'original',
  backdrop: 'satin',
  reviewStatus: 'pending',
  whiteBackground: false,
  width: 3000,
  height: 3000,
  compositeUrl: 'https://pub-1.r2.dev/composites/a.jpg',
  reviewNote: 'edge halo on the clasp',
}

// Behaves like Prisma: a nested select narrows the image row, no select returns every column
function applyImageArgs(args: { include?: { images?: { select?: Record<string, boolean> } } }) {
  const select = args.include?.images?.select
  const image = select
    ? Object.fromEntries(Object.entries(FULL_IMAGE).filter(([k]) => select[k]))
    : FULL_IMAGE
  return [{ id: 'prod_1', name: 'Ring', images: [image] }]
}

describe('public product responses never expose unapproved photo data', () => {
  beforeEach(() => {
    db.product.findMany.mockReset().mockImplementation(async (args) => applyImageArgs(args))
  })

  it('wishlist selects only public image columns', async () => {
    const res = await wishlist(
      new NextRequest('http://localhost/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productIds: ['prod_1'] }),
      }),
    )
    const body = await res.json()
    const image = body.products[0].images[0]
    expect(image).toEqual({
      id: 'img_1',
      url: FULL_IMAGE.url,
      altText: 'Ring',
      sortOrder: 0,
      treatment: 'original',
    })
    for (const col of PRIVATE_COLUMNS) expect(image).not.toHaveProperty(col)
  })
})

// Regression guard: no storefront/public query may load full ProductImage rows.
const ROOTS = ['src/app', 'src/components', 'src/lib']
const EXCLUDED = [/^src\/app\/admin\//, /^src\/app\/api\/admin\//, /^src\/lib\/photos\//]

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

function unselectedImageIncludes(src: string): string[] {
  const hits: string[] = []
  for (const m of src.matchAll(/\bimages:\s*true\b/g)) hits.push(m[0])
  for (const m of src.matchAll(/\bimages:\s*\{/g)) {
    let depth = 0
    let end = m.index! + m[0].length - 1
    for (; end < src.length; end++) {
      if (src[end] === '{') depth++
      else if (src[end] === '}' && --depth === 0) break
    }
    const block = src.slice(m.index!, end + 1)
    // Only Prisma include blocks: they carry take/orderBy/where/select
    if (/\b(take|orderBy|where|select)\s*:/.test(block) && !/\bselect\s*:/.test(block)) {
      hits.push(block.replace(/\s+/g, ' '))
    }
  }
  return hits
}

describe('public image queries', () => {
  const files = ROOTS.flatMap((r) => walk(join(process.cwd(), r)))
    .map((f) => relative(process.cwd(), f))
    .filter((f) => !EXCLUDED.some((re) => re.test(f)) && !f.includes('__tests__'))

  it('select explicit image columns instead of loading full rows', () => {
    const offenders = files.flatMap((f) =>
      unselectedImageIncludes(readFileSync(join(process.cwd(), f), 'utf8')).map((hit) => `${f}: ${hit}`),
    )
    expect(offenders).toEqual([])
  })
})
