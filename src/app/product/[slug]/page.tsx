import { db } from "@/lib/db";
import ClientWrapper from "@/components/layout/ClientWrapper";
import ProductDetailClient from "./ProductDetailClient";

export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: Promise<{ slug: string }>;
}

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

  const [relatedProducts, packagingPhotos] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    getPackagingPhotos(),
  ]);

  return (
    <ClientWrapper>
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
        packagingPhotos={packagingPhotos}
      />
    </ClientWrapper>
  );
}
