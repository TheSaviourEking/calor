import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import BlogPageClient from './BlogPageClient'

export const dynamic = 'force-dynamic'

async function getBlogData() {
  const [posts, categories, featuredPost] = await Promise.all([
    db.blogPost.findMany({
      where: { published: true, publishedAt: { lte: new Date() } },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 12,
    }),
    db.blogCategory.findMany({
      include: {
        _count: { select: { posts: { where: { published: true } } } },
      },
      orderBy: { name: 'asc' },
    }),
    db.blogPost.findFirst({
      where: { published: true, publishedAt: { lte: new Date() } },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { viewCount: 'desc' },
    }),
  ])

  return { posts, categories, featuredPost }
}

export default async function BlogPage() {
  const { posts, categories, featuredPost } = await getBlogData()
  
  return (
    <ClientWrapper>
      <BlogPageClient 
        initialPosts={posts} 
        categories={categories}
        featuredPost={featuredPost}
      />
    </ClientWrapper>
  )
}
