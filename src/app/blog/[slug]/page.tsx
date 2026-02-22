import { db } from '@/lib/db'
import Link from 'next/link'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  featuredImage: string | null
  publishedAt: string | null
  viewCount: number
  readTime: number
  tags: string
  author: {
    id: string
    name: string
    bio: string | null
    avatar: string | null
  }
  category: {
    id: string
    name: string
    slug: string
  } | null
}

interface BlogCategory {
  id: string
  slug: string
  name: string
  _count: { posts: number }
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const post = await db.blogPost.findUnique({
    where: { slug, published: true },
    include: {
      author: true,
      category: true,
    },
  })

  if (!post) return null

  // Increment view count
  await db.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  })

  return {
    ...post,
    tags: post.tags,
    publishedAt: post.publishedAt?.toISOString() || null,
  }
}

async function getRelatedPosts(postId: string, categoryId: string | null): Promise<BlogPost[]> {
  const posts = await db.blogPost.findMany({
    where: {
      published: true,
      id: { not: postId },
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      author: true,
      category: true,
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  })

  return posts.map(post => ({
    ...post,
    tags: post.tags,
    publishedAt: post.publishedAt?.toISOString() || null,
  }))
}

async function getCategories(): Promise<BlogCategory[]> {
  const categories = await db.blogCategory.findMany({
    include: {
      _count: {
        select: { posts: { where: { published: true } } },
      },
    },
    orderBy: { name: 'asc' },
  })

  return categories
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    return (
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-charcoal text-2xl mb-4">Post not found</h1>
          <Link href="/blog" className="font-body text-terracotta hover:underline">
            Back to blog
          </Link>
        </div>
      </div>
    )
  }

  const [relatedPosts, categories] = await Promise.all([
    getRelatedPosts(post.id, post.category?.id || null),
    getCategories(),
  ])

  return (
    <BlogPostClient 
      post={post} 
      relatedPosts={relatedPosts} 
      categories={categories} 
    />
  )
}

// Client component for the actual page
function BlogPostClient({
  post,
  relatedPosts,
  categories,
}: {
  post: BlogPost
  relatedPosts: BlogPost[]
  categories: BlogCategory[]
}) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const parseTags = (tagsJson: string): string[] => {
    try {
      return JSON.parse(tagsJson)
    } catch {
      return []
    }
  }

  const tags = parseTags(post.tags)

  return (
    <div className="min-h-screen pt-20 bg-cream">
      {/* Hero */}
      <div className="relative">
        <div className="aspect-[21/9] bg-gradient-to-br from-cream to-sand">
          {post.featuredImage ? (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-charcoal/5 text-9xl" style={{ fontWeight: 300 }}>
                {post.title.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-16">
          <div className="max-w-4xl mx-auto">
            {post.category && (
              <span className="font-body text-terracotta text-xs uppercase tracking-wider">
                {post.category.name}
              </span>
            )}
            <h1
              className="font-display text-warm-white mt-2"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300 }}
            >
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                {post.author.avatar ? (
                  <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-warm-white/20 flex items-center justify-center">
                    <span className="font-display text-warm-white text-sm">{post.author.name.charAt(0)}</span>
                  </div>
                )}
                <span className="font-body text-warm-white/80 text-sm">{post.author.name}</span>
              </div>
              <span className="font-body text-warm-white/50 text-sm">
                {formatDate(post.publishedAt!)}
              </span>
              <span className="font-body text-warm-white/50 text-sm">
                {post.readTime} min read
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-24 space-y-8">
              {/* Author */}
              <div className="bg-warm-white p-6 border border-sand">
                <h3 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                  Written by
                </h3>
                <div className="flex items-center gap-3">
                  {post.author.avatar ? (
                    <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center">
                      <span className="font-display text-terracotta text-lg">{post.author.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-body text-charcoal text-sm font-medium">{post.author.name}</p>
                    {post.author.bio && (
                      <p className="font-body text-warm-gray text-xs mt-1 line-clamp-2">{post.author.bio}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-warm-white p-6 border border-sand">
                <h3 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <a
                      key={cat.id}
                      href={`/blog?category=${cat.slug}`}
                      className="block font-body text-warm-gray text-sm hover:text-terracotta transition-colors"
                    >
                      {cat.name} ({cat._count.posts})
                    </a>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="bg-warm-white p-6 border border-sand">
                  <h3 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-sand/50 font-body text-warm-gray text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <article className="bg-warm-white p-8 lg:p-12 border border-sand">
              <div
                className="prose prose-lg max-w-none font-body text-warm-gray
                  prose-headings:font-display prose-headings:text-charcoal prose-headings:font-light
                  prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:leading-relaxed prose-p:mb-6
                  prose-a:text-terracotta prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-charcoal prose-strong:font-medium
                  prose-blockquote:border-l-terracotta prose-blockquote:bg-cream/50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:not-italic
                  prose-ul:my-6 prose-li:my-2
                  prose-img:border prose-img:border-sand
                "
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
              />
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-12">
                <h2 className="font-display text-charcoal text-xl mb-6" style={{ fontWeight: 400 }}>
                  Related Articles
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedPosts.map(relatedPost => (
                    <a
                      key={relatedPost.id}
                      href={`/blog/${relatedPost.slug}`}
                      className="group"
                    >
                      <div className="bg-warm-white border border-sand h-full">
                        <div className="aspect-video bg-gradient-to-br from-cream to-sand overflow-hidden">
                          {relatedPost.featuredImage ? (
                            <img
                              src={relatedPost.featuredImage}
                              alt={relatedPost.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="font-display text-charcoal/10 text-4xl">{relatedPost.title.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          {relatedPost.category && (
                            <span className="font-body text-terracotta text-xs uppercase tracking-wider">
                              {relatedPost.category.name}
                            </span>
                          )}
                          <h3 className="font-display text-charcoal text-base mt-1 group-hover:text-terracotta transition-colors" style={{ fontWeight: 400 }}>
                            {relatedPost.title}
                          </h3>
                          <p className="font-body text-warm-gray text-xs mt-2">
                            {relatedPost.readTime} min read
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
