import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { serialise } from '@/lib/serialise'
import AdminBlogClient from './AdminBlogClient'

export const dynamic = 'force-dynamic'

export default async function AdminBlogPage() {
  const session = await getSession()
  if (!session) redirect('/account')

  const [posts, authors, categories] = await Promise.all([
    db.blogPost.findMany({
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.blogAuthor.findMany({ orderBy: { name: 'asc' } }),
    db.blogCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <AdminBlogClient
      initialPosts={serialise(posts) as any}
      authors={serialise(authors) as any}
      categories={serialise(categories) as any}
    />
  )
}
