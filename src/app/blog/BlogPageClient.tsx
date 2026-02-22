'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, User, ArrowRight, Search, Tag } from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  featuredImage: string | null
  publishedAt: string | null
  viewCount: number
  readTime: number
  author: {
    id: string
    name: string
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

interface BlogPageClientProps {
  initialPosts: BlogPost[]
  categories: BlogCategory[]
  featuredPost: BlogPost | null
}

export default function BlogPageClient({ 
  initialPosts, 
  categories, 
  featuredPost 
}: BlogPageClientProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = posts.filter(post => {
    const matchesCategory = !selectedCategory || post.category?.slug === selectedCategory
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="eyebrow">Journal</span>
          <h1 
            className="font-display text-charcoal mt-4"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300 }}
          >
            Stories & Guides
          </h1>
          <p className="font-body text-warm-gray text-lg max-w-2xl mx-auto mt-4">
            Insights on intimacy, wellness, and the art of connection.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
              />
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-2 font-body text-sm transition-colors ${
                    !selectedCategory 
                      ? 'bg-terracotta/10 text-terracotta' 
                      : 'text-warm-gray hover:bg-sand/50'
                  }`}
                >
                  All Posts ({posts.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-4 py-2 font-body text-sm transition-colors ${
                      selectedCategory === cat.slug 
                        ? 'bg-terracotta/10 text-terracotta' 
                        : 'text-warm-gray hover:bg-sand/50'
                    }`}
                  >
                    {cat.name} ({cat._count.posts})
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-warm-white p-6 border border-sand">
              <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>
                Stay Updated
              </h3>
              <p className="font-body text-warm-gray text-sm mb-4">
                Get new articles delivered to your inbox.
              </p>
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm mb-3 focus:outline-none focus:border-terracotta"
              />
              <button className="w-full bg-terracotta text-warm-white py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Post */}
            {featuredPost && !searchQuery && !selectedCategory && (
              <Link 
                href={`/blog/${featuredPost.slug}`}
                className="block bg-warm-white border border-sand mb-12 group"
              >
                <div className="aspect-video bg-gradient-to-br from-cream to-sand relative overflow-hidden">
                  {featuredPost.featuredImage ? (
                    <img 
                      src={featuredPost.featuredImage}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display text-charcoal/10 text-9xl" style={{ fontWeight: 300 }}>
                        {featuredPost.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="absolute top-4 left-4 px-3 py-1 bg-terracotta text-warm-white font-body text-xs uppercase tracking-wider">
                    Featured
                  </span>
                </div>
                <div className="p-8">
                  {featuredPost.category && (
                    <span className="font-body text-terracotta text-xs uppercase tracking-wider">
                      {featuredPost.category.name}
                    </span>
                  )}
                  <h2 className="font-display text-charcoal text-2xl mt-2 group-hover:text-terracotta transition-colors" style={{ fontWeight: 400 }}>
                    {featuredPost.title}
                  </h2>
                  <p className="font-body text-warm-gray text-base mt-3 line-clamp-2">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-warm-gray" />
                      <span className="font-body text-warm-gray text-sm">{featuredPost.author.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warm-gray" />
                      <span className="font-body text-warm-gray text-sm">{featuredPost.readTime} min read</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Posts Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group"
                >
                  <div className="bg-warm-white border border-sand h-full flex flex-col">
                    <div className="aspect-video bg-gradient-to-br from-cream to-sand relative overflow-hidden">
                      {post.featuredImage ? (
                        <img 
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-display text-charcoal/10 text-6xl" style={{ fontWeight: 300 }}>
                            {post.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      {post.category && (
                        <span className="font-body text-terracotta text-xs uppercase tracking-wider">
                          {post.category.name}
                        </span>
                      )}
                      <h3 className="font-display text-charcoal text-xl mt-2 group-hover:text-terracotta transition-colors" style={{ fontWeight: 400 }}>
                        {post.title}
                      </h3>
                      <p className="font-body text-warm-gray text-sm mt-2 line-clamp-2 flex-1">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-sand">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-warm-gray" />
                          <span className="font-body text-warm-gray text-xs">{post.author.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-warm-gray" />
                          <span className="font-body text-warm-gray text-xs">{post.readTime} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-16">
                <Tag className="w-12 h-12 text-sand mx-auto mb-4" />
                <p className="font-body text-warm-gray">No posts found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
