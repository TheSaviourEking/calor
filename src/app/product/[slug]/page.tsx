import { db } from "@/lib/db";
import Link from 'next/link';
import ClientWrapper from "@/components/layout/ClientWrapper";
import ProductDetailClient from "./ProductDetailClient";
import { serialise } from "@/lib/serialise";

export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: Promise<{ slug: string }>;
}

import { Metadata } from 'next';

async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug, published: true },
    include: {
      category: true,
      variants: true,
      images: { orderBy: { sortOrder: "asc" } },
      videos: {
        where: { isActive: true },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Calōr',
      description: 'The product you are looking for does not exist.',
    };
  }

  const descriptionStr = product.shortDescription || (product.fullDescription ? product.fullDescription.substring(0, 160) : '');

  return {
    title: `${product.name} | Calōr`,
    description: descriptionStr,
    openGraph: {
      title: `${product.name} | Calōr`,
      description: descriptionStr,
      images: product.images[0]?.url ? [{ url: product.images[0].url }] : [],
    }
  };
}

async function getRelatedProducts(categoryId: string, excludeId: string) {
  return db.product.findMany({
    where: {
      published: true,
      categoryId,
      id: { not: excludeId },
    },
    include: {
      category: { select: { name: true, slug: true } },
      variants: {
        take: 1,
        select: { id: true, price: true, stock: true },
      },
      images: {
        take: 1,
        select: { url: true, altText: true },
      },
    },
    take: 4,
  });
}

async function getPackagingPhotos() {
  return db.packagingPhoto.findMany({
    where: { isActive: true },
    orderBy: [{ isDefault: "desc" }],
  });
}

async function getReviews(productId: string) {
  const reviews = await db.review.findMany({
    where: { productId, isApproved: true },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const stats = await db.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { id: true },
  });

  const ratingDistribution = await db.review.groupBy({
    by: ['rating'],
    where: { productId, isApproved: true },
    _count: { rating: true },
  });

  const summary = {
    averageRating: stats._avg.rating || 0,
    totalReviews: stats._count.id,
    distribution: {
      5: ratingDistribution.find(r => r.rating === 5)?._count.rating || 0,
      4: ratingDistribution.find(r => r.rating === 4)?._count.rating || 0,
      3: ratingDistribution.find(r => r.rating === 3)?._count.rating || 0,
      2: ratingDistribution.find(r => r.rating === 2)?._count.rating || 0,
      1: ratingDistribution.find(r => r.rating === 1)?._count.rating || 0,
    },
  };

  return { reviews, summary };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-charcoal text-2xl mb-4">
              Product not found
            </h1>
            <Link
              href="/shop"
              className="font-body text-terracotta hover:underline"
            >
              Browse all products
            </Link>
          </div>
        </div>
      </ClientWrapper>
    );
  }

  const [relatedProducts, packagingPhotos, reviewsData] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    getPackagingPhotos(),
    getReviews(product.id),
  ]);

  return (
    <ClientWrapper>
      <ProductDetailClient
        product={serialise(product)}
        relatedProducts={serialise(relatedProducts)}
        packagingPhotos={serialise(packagingPhotos)}
        initialReviews={serialise(reviewsData.reviews)}
        initialReviewSummary={serialise(reviewsData.summary)}
      />
    </ClientWrapper>
  );
}
