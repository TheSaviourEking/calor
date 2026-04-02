import { db } from "@/lib/db";
import ClientWrapper from "@/components/layout/ClientWrapper";
import CategoryClient from "./CategoryClient";
import Link from "next/link";
import { serialise } from "@/lib/serialise";

interface PageProps {
  params: Promise<{ category: string }>;
}

async function getCategory(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { products: true } },
    },
  });
}

async function getProductsByCategory(categorySlug: string) {
  return db.product.findMany({
    where: {
      published: true,
      category: { slug: categorySlug },
    },
    include: {
      category: {
        select: { name: true, slug: true },
      },
      variants: { take: 1 },
      images: { take: 2, orderBy: { sortOrder: "asc" } },
      videos: {
        take: 1,
        orderBy: { sortOrder: "asc" },
        select: { url: true, title: true, videoType: true }
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params;
  const [category, products] = await Promise.all([
    getCategory(categorySlug),
    getProductsByCategory(categorySlug),
  ]);

  if (!category) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-charcoal text-2xl mb-4">
              Category not found
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

  return (
    <ClientWrapper>
      <CategoryClient category={serialise(category) as any} products={serialise(products) as any} />
    </ClientWrapper>
  );
}
