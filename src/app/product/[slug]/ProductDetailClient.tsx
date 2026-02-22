"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Minus,
  Plus,
  Package,
  Truck,
  ChevronDown,
  Bell,
  Shield,
  Info,
  Clock,
  Camera,
  Check,
  AlertCircle,
  Play,
  X,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { useCartStore, useWishlistStore, useLocaleStore } from "@/stores";
import ProductCard from "@/components/product/ProductCard";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import SocialProof from "@/components/social-proof/SocialProof";
import Link from "next/link";

interface ProductImage {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

interface ProductVideo {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  title: string | null;
  description: string | null;
  duration: number | null;
  source: string;
  videoType: string;
  isFeatured: boolean;
  sortOrder: number;
}

interface Variant {
  id: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
}

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface SafetyInfo {
  certifications?: string[];
  bodySafe?: boolean;
  phthalateFree?: boolean;
  latexFree?: boolean;
  waterproof?: boolean;
  ageRestriction?: string;
  contentWarning?: string;
  warnings?: string[];
  [key: string]: unknown;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  badge: string | null;
  isDigital: boolean;
  inventoryCount: number;
  materialInfo: string | null;
  safetyInfo: string | null;
  cleaningGuide: string | null;
  usageGuide: string | null;
  estimatedDeliveryDays: number | null;
  category: Category;
  variants: Variant[];
  images: ProductImage[];
  videos: ProductVideo[];
}

interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  badge: string | null;
  category: { name: string; slug: string };
  variants: Array<{ id: string; price: number }>;
  images: Array<{ url: string; altText: string }>;
}

interface PackagingPhoto {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isDefault: boolean;
}

interface ProductDetailClientProps {
  product: Product;
  relatedProducts?: RelatedProduct[];
  packagingPhotos?: PackagingPhoto[];
  initialReviews?: any[];
  initialReviewSummary?: any;
}

export default function ProductDetailClient({
  product,
  relatedProducts = [],
  packagingPhotos = [],
  initialReviews,
  initialReviewSummary,
}: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(
    "description",
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasStockAlert, setHasStockAlert] = useState(false);
  const [hasPriceAlert, setHasPriceAlert] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<ProductVideo | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const { addItem } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { formatPrice } = useLocaleStore();

  const isInWishlistState = isInWishlist(product.id);
  const price = selectedVariant?.price || 0;
  const isOutOfStock =
    product.inventoryCount === 0 ||
    (selectedVariant && selectedVariant.stock === 0);

  // Combine images and featured video for gallery
  const mediaItems = [
    ...product.images.map((img) => ({ type: "image" as const, ...img })),
    ...(product.videos
      ?.filter((v) => v.isFeatured)
      .map((vid) => ({ type: "video" as const, ...vid })) || []),
  ];

  // Parse safety info
  const safetyInfo: SafetyInfo = product.safetyInfo
    ? (() => {
      try {
        return JSON.parse(product.safetyInfo);
      } catch {
        return {};
      }
    })()
    : {};

  // Check login status and existing alerts
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/login", { method: "GET" });
        if (res.ok) {
          setIsLoggedIn(true);
          // Check for existing alerts
          const [stockRes, priceRes] = await Promise.all([
            fetch("/api/alerts/stock"),
            fetch("/api/alerts/price-drop"),
          ]);
          if (stockRes.ok) {
            const data = await stockRes.json();
            setHasStockAlert(
              data.alerts?.some(
                (a: { productId: string }) => a.productId === product.id,
              ),
            );
          }
          if (priceRes.ok) {
            const data = await priceRes.json();
            setHasPriceAlert(
              data.alerts?.some(
                (a: { productId: string }) => a.productId === product.id,
              ),
            );
          }
        }
      } catch {
        // Not logged in
      }
    }
    checkAuth();
  }, [product.id]);

  const handleAddToBag = () => {
    if (!selectedVariant || isOutOfStock) return;
    addItem({
      id: `${product.id}-${selectedVariant.id}`,
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      category: product.category.name,
      price: price,
      quantity: quantity,
      image: product.images[0]?.url,
    });
    toast.success("Added to bag");
  };

  const handleWishlistToggle = () => {
    toggleItem(product.id);
    toast.success(
      isInWishlistState ? "Removed from wishlist" : "Added to wishlist",
    );
  };

  const handleStockAlert = async () => {
    if (!isLoggedIn) {
      toast.error("Please log in to set up alerts");
      window.location.href = "/account";
      return;
    }

    try {
      const res = await fetch("/api/alerts/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id,
        }),
      });

      if (res.ok) {
        setHasStockAlert(true);
        toast.success("We will notify you when this item is back in stock");
      } else {
        toast.error("Failed to create alert");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handlePriceAlert = async () => {
    if (!isLoggedIn) {
      toast.error("Please log in to set up alerts");
      window.location.href = "/account";
      return;
    }

    const target = parseInt(targetPrice) * 100; // Convert to cents
    if (!target || target >= price) {
      toast.error("Target price must be lower than current price");
      return;
    }

    try {
      const res = await fetch("/api/alerts/price-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          targetPrice: target,
        }),
      });

      if (res.ok) {
        setHasPriceAlert(true);
        setTargetPrice("");
        toast.success("We will notify you when the price drops");
      } else {
        toast.error("Failed to create alert");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const badgeStyles: Record<string, string> = {
    bestseller: "bg-terracotta text-warm-white",
    new: "bg-charcoal text-warm-white",
    sale: "bg-ember text-warm-white",
    "editors-pick": "bg-gold text-charcoal",
  };

  // Estimated delivery date
  const getDeliveryEstimate = () => {
    const days = product.estimatedDeliveryDays || 5;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <Link
            href="/"
            className="font-body text-warm-gray hover:text-terracotta"
          >
            Home
          </Link>
          <span className="text-sand">/</span>
          <Link
            href="/shop"
            className="font-body text-warm-gray hover:text-terracotta"
          >
            Shop
          </Link>
          <span className="text-sand">/</span>
          <Link
            href={`/shop/${product.category.slug}`}
            className="font-body text-warm-gray hover:text-terracotta"
          >
            {product.category.name}
          </Link>
          <span className="text-sand">/</span>
          <span className="font-body text-charcoal">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Images & Videos */}
          <div>
            {/* Main Media */}
            <div className="aspect-square bg-gradient-to-br from-cream to-sand mb-4 relative overflow-hidden">
              {product.badge && (
                <span
                  className={`absolute top-4 left-4 z-10 px-3 py-1 text-xs font-body uppercase tracking-wider ${badgeStyles[product.badge] || "bg-charcoal text-warm-white"}`}
                >
                  {product.badge.replace("-", " ")}
                </span>
              )}
              {isOutOfStock && (
                <span className="absolute top-4 right-4 z-10 px-3 py-1 text-xs font-body uppercase tracking-wider bg-warm-gray text-warm-white">
                  Out of Stock
                </span>
              )}

              {/* Video indicator if featured video exists */}
              {product.videos?.length > 0 && (
                <button
                  onClick={() => setSelectedVideo(product.videos[0])}
                  className="absolute bottom-4 right-4 z-10 px-3 py-2 bg-charcoal/80 text-cream text-xs font-body flex items-center gap-2 hover:bg-terracotta transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Watch Video
                </button>
              )}

              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-display text-charcoal/10 text-8xl"
                  style={{ fontWeight: 300 }}
                >
                  {product.name.charAt(0)}
                </span>
              </div>
            </div>

            {/* Thumbnail Strip with Videos */}
            {(product.images.length > 1 || product.videos?.length > 0) && (
              <div className="flex gap-2">
                {product.images.map((image, idx) => (
                  <div
                    key={image.id}
                    className={`w-16 h-16 bg-gradient-to-br from-cream to-sand cursor-pointer transition-opacity ${activeMediaIndex === idx
                        ? "ring-2 ring-terracotta opacity-100"
                        : "opacity-60 hover:opacity-100"
                      }`}
                    onClick={() => setActiveMediaIndex(idx)}
                  />
                ))}
                {product.videos?.map((video, idx) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`w-16 h-16 bg-gradient-to-br from-sand to-warm-gray cursor-pointer transition-opacity relative flex items-center justify-center ${"opacity-60 hover:opacity-100"}`}
                  >
                    <Play className="w-6 h-6 text-charcoal" />
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 text-[10px] font-body bg-charcoal/80 text-cream px-1">
                        {Math.floor(video.duration / 60)}:
                        {(video.duration % 60).toString().padStart(2, "0")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Video Section */}
            {product.videos && product.videos.length > 0 && (
              <div className="mt-6 p-4 bg-warm-white border border-sand">
                <div className="flex items-center gap-2 mb-3">
                  <Video className="w-4 h-4 text-warm-gray" />
                  <span className="font-body text-charcoal text-sm">
                    Product Videos
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {product.videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      className="flex items-center gap-3 p-2 border border-sand hover:border-terracotta transition-colors text-left"
                    >
                      <div className="w-12 h-12 bg-sand/50 flex items-center justify-center flex-shrink-0">
                        <Play className="w-5 h-5 text-charcoal" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-body text-charcoal text-sm truncate">
                          {video.title || "Product Demo"}
                        </p>
                        <p className="font-body text-warm-gray text-xs capitalize">
                          {video.videoType}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Packaging Photo Preview */}
            {packagingPhotos.length > 0 && (
              <div className="mt-6 p-4 bg-sand/30 border border-sand">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-warm-gray" />
                  <span className="font-body text-charcoal text-sm">
                    How your package will arrive
                  </span>
                </div>
                <div className="flex gap-3">
                  {packagingPhotos.slice(0, 2).map((photo) => (
                    <div key={photo.id} className="text-center">
                      <div className="w-20 h-20 bg-cream border border-sand flex items-center justify-center">
                        <Package className="w-8 h-8 text-warm-gray/50" />
                      </div>
                      <p className="font-body text-xs text-warm-gray mt-1">
                        {photo.name}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="font-body text-xs text-warm-gray mt-3">
                  Plain, unmarked packaging. No product names visible.
                </p>
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            {/* Category Label */}
            <span className="eyebrow">{product.category.name}</span>

            {/* Product Name */}
            <h1
              className="font-display text-charcoal mt-2 mb-4"
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                fontWeight: 400,
              }}
            >
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <p
                className="font-display text-charcoal text-xl"
                style={{ fontWeight: 400 }}
              >
                {formatPrice(price)}
              </p>
              {product.badge === "sale" && (
                <span className="font-body text-sm text-terracotta line-through">
                  {formatPrice(price * 1.2)}
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="font-body text-warm-gray text-base leading-relaxed mb-8">
              {product.shortDescription}
            </p>

            {/* Material Info */}
            {product.materialInfo && (
              <div className="mb-6 p-3 bg-cream border border-sand">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-warm-gray" />
                  <span className="font-body text-charcoal text-sm">
                    Material
                  </span>
                </div>
                <p className="font-body text-warm-gray text-sm">
                  {product.materialInfo}
                </p>
              </div>
            )}

            {/* Delivery Estimate */}
            {!isOutOfStock && (
              <div className="mb-6 p-3 bg-sand/20 border border-sand flex items-center gap-3">
                <Truck className="w-5 h-5 text-terracotta" />
                <div>
                  <p className="font-body text-charcoal text-sm">
                    Estimated delivery
                  </p>
                  <p className="font-body text-warm-gray text-sm">
                    {product.isDigital
                      ? "Immediate access"
                      : `Arrives by ${getDeliveryEstimate()}`}
                  </p>
                </div>
              </div>
            )}

            {/* Variant Selector */}
            {product.variants.length > 1 && (
              <div className="mb-6">
                <label className="font-body text-charcoal text-sm mb-2 block">
                  Select variant
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.stock === 0}
                      className={`px-4 py-2 font-body text-sm border transition-colors ${selectedVariant?.id === variant.id
                          ? "border-charcoal bg-charcoal text-cream"
                          : variant.stock === 0
                            ? "border-sand bg-sand/50 text-warm-gray/50 cursor-not-allowed"
                            : "border-sand hover:border-terracotta"
                        }`}
                    >
                      {variant.name}
                      {variant.stock === 0 && " (Out of stock)"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {!product.isDigital && !isOutOfStock && (
              <div className="mb-6">
                <label className="font-body text-charcoal text-sm mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center border border-sand hover:border-terracotta transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-body text-charcoal w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center border border-sand hover:border-terracotta transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Out of Stock - Stock Alert */}
            {isOutOfStock && (
              <div className="mb-6 p-4 bg-sand/30 border border-sand">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-terracotta" />
                  <span className="font-body text-charcoal">
                    Currently out of stock
                  </span>
                </div>
                {hasStockAlert ? (
                  <div className="flex items-center gap-2 text-terracotta">
                    <Check className="w-4 h-4" />
                    <span className="font-body text-sm">
                      You will be notified when back in stock
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleStockAlert}
                    className="flex items-center gap-2 px-4 py-2 bg-charcoal text-cream font-body text-sm hover:bg-terracotta transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    Notify me when available
                  </button>
                )}
              </div>
            )}

            {/* Price Drop Alert */}
            {!isOutOfStock && (
              <div className="mb-6">
                {hasPriceAlert ? (
                  <div className="flex items-center gap-2 text-terracotta text-sm">
                    <Check className="w-4 h-4" />
                    <span className="font-body">Price drop alert active</span>
                  </div>
                ) : (
                  <details className="group">
                    <summary className="cursor-pointer font-body text-sm text-warm-gray hover:text-terracotta flex items-center gap-1">
                      <Bell className="w-4 h-4" />
                      Get notified if price drops
                    </summary>
                    <div className="mt-3 flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-warm-gray">
                          $
                        </span>
                        <input
                          type="number"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
                          placeholder={Math.ceil(price / 100 - 10).toString()}
                          className="w-full pl-7 pr-3 py-2 font-body text-sm border border-sand focus:border-terracotta outline-none"
                        />
                      </div>
                      <button
                        onClick={handlePriceAlert}
                        className="px-4 py-2 bg-charcoal text-cream font-body text-sm hover:bg-terracotta transition-colors"
                      >
                        Set Alert
                      </button>
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Add to Bag */}
            {!isOutOfStock && (
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleAddToBag}
                  className="flex-1 bg-charcoal text-cream py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-terracotta"
                >
                  Add to Bag
                </button>
                <button
                  onClick={handleWishlistToggle}
                  className={`w-14 h-14 flex items-center justify-center border transition-colors ${isInWishlistState
                      ? "border-terracotta bg-terracotta/10"
                      : "border-sand hover:border-terracotta"
                    }`}
                  aria-label={
                    isInWishlistState
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                >
                  <Heart
                    className={`w-5 h-5 ${isInWishlistState ? "fill-terracotta text-terracotta" : "text-charcoal"}`}
                  />
                </button>
              </div>
            )}

            {/* Discreet Delivery Badge */}
            <div className="flex items-center gap-3 py-4 border-t border-sand">
              <Package className="w-5 h-5 text-terracotta" />
              <p className="font-body text-warm-gray text-sm">
                Ships in plain packaging. No product names visible.
              </p>
            </div>

            {/* Social Proof */}
            <div className="mt-4">
              <SocialProof productId={product.id} />
            </div>

            {/* Accordions */}
            <div className="border-t border-sand mt-4">
              {/* Description */}
              <AccordionItem
                title="Description"
                isOpen={activeAccordion === "description"}
                onToggle={() =>
                  setActiveAccordion(
                    activeAccordion === "description" ? null : "description",
                  )
                }
              >
                <p className="font-body text-warm-gray text-sm leading-relaxed">
                  {product.fullDescription || product.shortDescription}
                </p>
              </AccordionItem>

              {/* Safety Information */}
              {(product.materialInfo ||
                product.cleaningGuide ||
                Object.keys(safetyInfo).length > 0) && (
                  <AccordionItem
                    title="Safety & Care"
                    isOpen={activeAccordion === "safety"}
                    onToggle={() =>
                      setActiveAccordion(
                        activeAccordion === "safety" ? null : "safety",
                      )
                    }
                  >
                    <div className="space-y-4">
                      {safetyInfo.certifications &&
                        safetyInfo.certifications.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Shield className="w-4 h-4 text-terracotta" />
                            {safetyInfo.certifications.map((cert) => (
                              <span
                                key={cert}
                                className="px-2 py-1 bg-sand/50 font-body text-xs text-warm-gray"
                              >
                                {cert}
                              </span>
                            ))}
                          </div>
                        )}

                      {safetyInfo.bodySafe && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-terracotta" />
                          <span className="font-body text-warm-gray">
                            Body-safe materials
                          </span>
                        </div>
                      )}

                      {safetyInfo.phthalateFree && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-terracotta" />
                          <span className="font-body text-warm-gray">
                            Phthalate-free
                          </span>
                        </div>
                      )}

                      {product.cleaningGuide && (
                        <div>
                          <p className="font-body text-charcoal text-sm mb-1">
                            Cleaning
                          </p>
                          <p className="font-body text-warm-gray text-sm">
                            {product.cleaningGuide}
                          </p>
                        </div>
                      )}

                      {safetyInfo.warnings && safetyInfo.warnings.length > 0 && (
                        <div className="p-3 bg-sand/30">
                          <p className="font-body text-charcoal text-sm mb-2">
                            Important Notes
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {safetyInfo.warnings.map((warning, i) => (
                              <li
                                key={i}
                                className="font-body text-warm-gray text-sm"
                              >
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AccordionItem>
                )}

              {/* Usage Guide */}
              {product.usageGuide && (
                <AccordionItem
                  title="How to Use"
                  isOpen={activeAccordion === "usage"}
                  onToggle={() =>
                    setActiveAccordion(
                      activeAccordion === "usage" ? null : "usage",
                    )
                  }
                >
                  <p className="font-body text-warm-gray text-sm leading-relaxed">
                    {product.usageGuide}
                  </p>
                </AccordionItem>
              )}

              {/* Shipping */}
              <AccordionItem
                title="Shipping & Returns"
                isOpen={activeAccordion === "shipping"}
                onToggle={() =>
                  setActiveAccordion(
                    activeAccordion === "shipping" ? null : "shipping",
                  )
                }
              >
                <div className="space-y-4">
                  <div>
                    <p className="font-body text-charcoal text-sm mb-1">
                      Shipping
                    </p>
                    <p className="font-body text-warm-gray text-sm">
                      Free standard shipping on orders over $75. Delivered in{" "}
                      {product.estimatedDeliveryDays || "2-5"} business days in
                      plain, unmarked packaging.
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-charcoal text-sm mb-1">
                      Returns
                    </p>
                    <p className="font-body text-warm-gray text-sm">
                      If it&apos;s not right for you, return it within 30 days.
                      Unopened products only, for hygiene reasons. No questions
                      asked.
                    </p>
                  </div>
                </div>
              </AccordionItem>

              {/* Discreet Billing */}
              <AccordionItem
                title="Discreet Billing"
                isOpen={activeAccordion === "billing"}
                onToggle={() =>
                  setActiveAccordion(
                    activeAccordion === "billing" ? null : "billing",
                  )
                }
              >
                <p className="font-body text-warm-gray text-sm leading-relaxed">
                  Your bank statement will show &quot;CALŌR CO.&quot; only.
                  Nothing explicit. Ever. We never store your card details.
                </p>
              </AccordionItem>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t border-sand">
            <h2
              className="font-display text-charcoal text-2xl mb-8"
              style={{ fontWeight: 300 }}
            >
              You might also like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-16 pt-16 border-t border-sand">
          <ReviewsSection
            productId={product.id}
            productName={product.name}
            initialReviews={initialReviews}
            initialReviewSummary={initialReviewSummary}
          />
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/90 p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 text-cream hover:text-terracotta transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {selectedVideo.title && (
              <h3
                className="font-display text-cream text-xl mb-4"
                style={{ fontWeight: 300 }}
              >
                {selectedVideo.title}
              </h3>
            )}

            <div className="aspect-video bg-warm-gray">
              {selectedVideo.source === "youtube" ? (
                <iframe
                  src={selectedVideo.url.replace("watch?v=", "embed/")}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : selectedVideo.source === "vimeo" ? (
                <iframe
                  src={selectedVideo.url.replace(
                    "vimeo.com/",
                    "player.vimeo.com/video/",
                  )}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={selectedVideo.url}
                  className="w-full h-full"
                  controls
                  autoPlay
                  poster={selectedVideo.thumbnailUrl || undefined}
                />
              )}
            </div>

            {selectedVideo.description && (
              <p className="font-body text-warm-gray text-sm mt-4">
                {selectedVideo.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AccordionItem({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-sand">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4"
      >
        <span className="font-body text-charcoal text-sm uppercase tracking-wider">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-warm-gray transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}
