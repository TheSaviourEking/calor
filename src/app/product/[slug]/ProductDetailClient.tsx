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
  Camera,
  Check,
  AlertCircle,
  Play,
  X,
  Video,
  Box,
  Maximize,
  Zap,
  Activity,
  Layers,
  Ruler,
  User,
  Settings,
  Wind,
  MousePointer2,
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

interface SensoryProfile {
  id: string;
  hasElectronics: boolean;
  textureType: string | null;
  textureIntensity: number | null;
  surfaceFeel: string | null;
  firmness: string | null;
  flexibility: string | null;
  vibrationLevels: number | null;
  vibrationPatterns: number | null;
  motorType: string | null;
  maxIntensity: number | null;
  noiseLevel: string | null;
  temperatureResponsive: boolean;
  warmingSupported: boolean;
  coolingSupported: boolean;
  soundProfile: string | null;
  weight: number | null;
  weightFeel: string | null;
  gripFeel: string | null;
  warmingSensation: boolean;
  coolingSensation: boolean;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  iconType: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  benefits: string | null;
  isKeyFeature: boolean;
  sortOrder: number;
}

interface SizeVisualization {
  id: string;
  length: number | null;
  width: number | null;
  height: number | null;
  diameter: number | null;
  insertableLength: number | null;
  circumference: number | null;
  comparisons: string | null;
  silhouettes: string | null;
}

interface SizeRecommendation {
  id: string;
  fitType: string;
  notes: string | null;
}

interface Model3D {
  id: string;
  thumbnailUrl: string | null;
  modelUrl: string;
  modelType: string;
  animations: string | null;
  arSupported: boolean;
  arScale: number | null;
  isProcessing: boolean;
  isReady: boolean;
}

interface RegionalPrice {
  id: string;
  countryCode: string;
  currency: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  isActive: boolean;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  badge: string | null;
  originalPrice: number | null;
  isDigital: boolean;
  isRestricted: boolean;
  requiresConsentGate: boolean;
  inventoryCount: number;
  materialInfo: string | null;
  safetyInfo: string | null;
  cleaningGuide: string | null;
  usageGuide: string | null;
  estimatedDeliveryDays: number | null;
  waterproofRating: string | null;
  whatsInTheBox: string | null;
  batteryType: string | null;
  chargeTimeMinutes: number | null;
  usageTimeMinutes: number | null;
  chargingMethod: string | null;
  category: Category;
  variants: Variant[];
  images: ProductImage[];
  videos: ProductVideo[];
  sensoryProfile?: SensoryProfile | null;
  features: Feature[];
  sizeVisualization?: SizeVisualization | null;
  sizeRecommendation?: SizeRecommendation | null;
  model3D?: Model3D | null;
  regionalPrices: RegionalPrice[];
}

interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  badge: string | null;
  originalPrice: number | null;
  viewCount: number;
  purchaseCount: number;
  isDigital: boolean;
  category: { name: string; slug: string };
  variants: Array<{ id: string; price: number }>;
  images: Array<{ url: string; altText: string }>;
  videos?: Array<{ url: string; title: string | null; videoType?: string }>;
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

              {/* Main Media Display */}
              <div className="absolute inset-0">
                {mediaItems[activeMediaIndex]?.type === 'image' ? (
                  <img
                    src={mediaItems[activeMediaIndex].url}
                    alt={mediaItems[activeMediaIndex].altText || product.name}
                    className="w-full h-full object-cover"
                  />
                ) : mediaItems[activeMediaIndex]?.type === 'video' ? (
                  <video
                    src={mediaItems[activeMediaIndex].url}
                    controls
                    className="w-full h-full object-cover"
                    poster={mediaItems[activeMediaIndex].thumbnailUrl || ''}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-charcoal/10 text-8xl" style={{ fontWeight: 300 }}>
                      {product.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {mediaItems.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {mediaItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`w-16 h-16 flex-shrink-0 cursor-pointer transition-all duration-300 relative ${activeMediaIndex === idx
                      ? "ring-2 ring-terracotta opacity-100"
                      : "opacity-60 hover:opacity-100"
                      }`}
                    onClick={() => setActiveMediaIndex(idx)}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-sand flex items-center justify-center">
                        <Play className="w-5 h-5 text-charcoal" />
                        <div className="absolute inset-0 bg-charcoal/10" />
                      </div>
                    )}
                  </div>
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
              {product.originalPrice && product.originalPrice > price && (
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm text-warm-gray line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="px-1.5 py-0.5 bg-terracotta/10 text-terracotta text-[0.65rem] font-bold uppercase tracking-wider">
                    {Math.round(((product.originalPrice - price) / product.originalPrice) * 100)}% OFF
                  </span>
                </div>
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

            {/* Waterproof Rating */}
            {product.waterproofRating && (
              <div className="mb-6 p-3 bg-blue-50/50 border border-blue-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-body text-xs font-bold">{product.waterproofRating}</span>
                </div>
                <div>
                  <p className="font-body text-charcoal text-sm font-medium">
                    {product.waterproofRating === "IPX7" ? "Fully Submersible" :
                      product.waterproofRating === "IPX8" ? "Deep Submersible" :
                        product.waterproofRating === "IPX6" ? "Water Jet Resistant" :
                          product.waterproofRating === "IPX5" ? "Water Jet Resistant" :
                            "Splash-Proof"}
                  </p>
                  <p className="font-body text-warm-gray text-xs">
                    {product.waterproofRating === "IPX7" ? "Safe to use in bath or shower — submersible up to 1m" :
                      product.waterproofRating === "IPX8" ? "Submersible beyond 1m depth" :
                        product.waterproofRating === "IPX4" ? "Protected against water splashes" :
                          "Protected against water jets"}
                  </p>
                </div>
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
                  <p className="font-body text-warm-gray text-sm leading-relaxed whitespace-pre-line">
                    {product.usageGuide}
                  </p>
                </AccordionItem>
              )}

              {/* What's in the Box */}
              {product.whatsInTheBox && (
                <AccordionItem
                  title="What's in the Box"
                  isOpen={activeAccordion === "box"}
                  onToggle={() =>
                    setActiveAccordion(
                      activeAccordion === "box" ? null : "box",
                    )
                  }
                >
                  <ul className="space-y-2">
                    {product.whatsInTheBox.split("\n").filter(Boolean).map((item, i) => (
                      <li key={i} className="font-body text-warm-gray text-sm flex items-center gap-2">
                        <Check className="w-4 h-4 text-terracotta flex-shrink-0" />
                        {item.trim()}
                      </li>
                    ))}
                  </ul>
                </AccordionItem>
              )}

              {/* Battery & Charging */}
              {(product.batteryType || product.chargeTimeMinutes || product.usageTimeMinutes || product.chargingMethod) && (
                <AccordionItem
                  title="Battery & Charging"
                  isOpen={activeAccordion === "battery"}
                  onToggle={() =>
                    setActiveAccordion(
                      activeAccordion === "battery" ? null : "battery",
                    )
                  }
                >
                  <div className="grid grid-cols-2 gap-4">
                    {product.batteryType && (
                      <div className="bg-sand/20 p-3 border border-sand">
                        <span className="block text-[10px] text-warm-gray uppercase tracking-widest mb-1">Battery</span>
                        <span className="block font-body text-charcoal text-sm">
                          {product.batteryType === "rechargeable_lithium" ? "Rechargeable Li-Ion" :
                            product.batteryType === "usb_powered" ? "USB Powered" :
                              product.batteryType.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {product.chargingMethod && (
                      <div className="bg-sand/20 p-3 border border-sand">
                        <span className="block text-[10px] text-warm-gray uppercase tracking-widest mb-1">Charging</span>
                        <span className="block font-body text-charcoal text-sm capitalize">{product.chargingMethod.replace("-", " ")}</span>
                      </div>
                    )}
                    {product.chargeTimeMinutes && (
                      <div className="bg-sand/20 p-3 border border-sand">
                        <span className="block text-[10px] text-warm-gray uppercase tracking-widest mb-1">Charge Time</span>
                        <span className="block font-body text-charcoal text-sm">
                          {product.chargeTimeMinutes >= 60
                            ? `${Math.floor(product.chargeTimeMinutes / 60)}h ${product.chargeTimeMinutes % 60 > 0 ? `${product.chargeTimeMinutes % 60}m` : ""}`
                            : `${product.chargeTimeMinutes} min`}
                        </span>
                      </div>
                    )}
                    {product.usageTimeMinutes && (
                      <div className="bg-sand/20 p-3 border border-sand">
                        <span className="block text-[10px] text-warm-gray uppercase tracking-widest mb-1">Usage Time</span>
                        <span className="block font-body text-charcoal text-sm">
                          {product.usageTimeMinutes >= 60
                            ? `${Math.floor(product.usageTimeMinutes / 60)}h ${product.usageTimeMinutes % 60 > 0 ? `${product.usageTimeMinutes % 60}m` : ""}`
                            : `${product.usageTimeMinutes} min`}
                        </span>
                      </div>
                    )}
                  </div>
                </AccordionItem>
              )}

              {/* Reviews */}
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

        {/* Product Experience Hub */}
        <div className="mt-16 pt-16 border-t border-sand">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="eyebrow">The Experience</span>
              <h2 className="font-display text-charcoal text-3xl mt-2" style={{ fontWeight: 300 }}>
                Sensory & Technical Profile
              </h2>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sensory Breakdown */}
            {product.sensoryProfile && (
              <div className="col-span-1 bg-cream/50 border border-sand p-8 rounded-none">
                <div className="flex items-center gap-3 mb-8">
                  <Activity className="w-5 h-5 text-terracotta" />
                  <h3 className="font-display text-charcoal text-xl">Tactile & Haptic</h3>
                </div>

                <div className="space-y-6">
                  {product.sensoryProfile.textureType && (
                    <div className="flex justify-between items-center py-3 border-b border-sand/30">
                      <span className="font-body text-warm-gray text-sm">Texture</span>
                      <span className="font-body text-charcoal text-sm capitalize">{product.sensoryProfile.textureType}</span>
                    </div>
                  )}
                  {product.sensoryProfile.firmness && (
                    <div className="flex justify-between items-center py-3 border-b border-sand/30">
                      <span className="font-body text-warm-gray text-sm">Firmness</span>
                      <span className="font-body text-charcoal text-sm capitalize">{product.sensoryProfile.firmness}</span>
                    </div>
                  )}
                  {product.sensoryProfile.flexibility && (
                    <div className="flex justify-between items-center py-3 border-b border-sand/30">
                      <span className="font-body text-warm-gray text-sm">Flexibility</span>
                      <span className="font-body text-charcoal text-sm capitalize">{product.sensoryProfile.flexibility}</span>
                    </div>
                  )}
                  {product.sensoryProfile.vibrationLevels && (
                    <div className="flex justify-between items-center py-3 border-b border-sand/30">
                      <span className="font-body text-warm-gray text-sm">Vibrations</span>
                      <span className="font-body text-charcoal text-sm">{product.sensoryProfile.vibrationLevels} Levels</span>
                    </div>
                  )}
                  {product.sensoryProfile.noiseLevel && (
                    <div className="flex justify-between items-center py-3 border-b border-sand/30">
                      <span className="font-body text-warm-gray text-sm">Acoustics</span>
                      <span className="font-body text-charcoal text-sm capitalize">{product.sensoryProfile.noiseLevel}</span>
                    </div>
                  )}
                  {(product.sensoryProfile.warmingSupported || product.sensoryProfile.temperatureResponsive) && (
                    <div className="flex justify-between items-center py-3 border-b border-sand/30">
                      <span className="font-body text-warm-gray text-sm">Thermal</span>
                      <span className="font-body text-charcoal text-sm">
                        {product.sensoryProfile.warmingSupported ? "Warming Content" : "Temp. Responsive"}
                      </span>
                    </div>
                  )}
                  {product.sensoryProfile.surfaceFeel && (
                    <div className="flex justify-between items-center py-3 border-b border-sand/30">
                      <span className="font-body text-warm-gray text-sm">Surface</span>
                      <span className="font-body text-charcoal text-sm capitalize">{product.sensoryProfile.surfaceFeel}</span>
                    </div>
                  )}
                  {product.sensoryProfile.gripFeel && (
                    <div className="flex justify-between items-center py-3 border-b border-sand/30">
                      <span className="font-body text-warm-gray text-sm">Grip</span>
                      <span className="font-body text-charcoal text-sm capitalize">{product.sensoryProfile.gripFeel}</span>
                    </div>
                  )}
                  {product.sensoryProfile.weight && (
                    <div className="flex justify-between items-center py-3 border-b border-sand/30">
                      <span className="font-body text-warm-gray text-sm">Weight</span>
                      <span className="font-body text-charcoal text-sm">{product.sensoryProfile.weight}g</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feature Explorer */}
            <div className={`lg:col-span-${product.sensoryProfile ? '2' : '3'} grid md:grid-cols-2 gap-4`}>
              {product.features.map((feature) => (
                <div key={feature.id} className="bg-warm-white border border-sand p-6 flex items-start gap-4">
                  <div className="w-10 h-10 bg-cream flex items-center justify-center flex-shrink-0">
                    {feature.iconType === 'zap' ? <Zap className="w-5 h-5 text-terracotta" /> :
                      feature.iconType === 'box' ? <Box className="w-5 h-5 text-terracotta" /> :
                        feature.iconType === 'maximize' ? <Maximize className="w-5 h-5 text-terracotta" /> :
                          feature.iconType === 'activity' ? <Activity className="w-5 h-5 text-terracotta" /> :
                            feature.iconType === 'settings' ? <Settings className="w-5 h-5 text-terracotta" /> :
                              feature.iconType === 'wind' ? <Wind className="w-5 h-5 text-terracotta" /> :
                                feature.iconType === 'mouse-pointer' ? <MousePointer2 className="w-5 h-5 text-terracotta" /> :
                                  <Layers className="w-5 h-5 text-terracotta" />}
                  </div>
                  <div>
                    <h4 className="font-display text-charcoal text-lg mb-1">{feature.name}</h4>
                    <p className="font-body text-warm-gray text-xs leading-relaxed">{feature.description}</p>
                    {feature.isKeyFeature && (
                      <span className="inline-block mt-2 px-1.5 py-0.5 bg-terracotta/5 text-terracotta text-[10px] uppercase font-bold tracking-tighter">Key Feature</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            {/* Dimensions & Sizing */}
            {(product.sizeVisualization || product.sizeRecommendation) && (
              <div className="bg-sand/20 border border-sand p-8 flex flex-col md:flex-row gap-8 rounded-none">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <Ruler className="w-5 h-5 text-charcoal" />
                    <h3 className="font-display text-charcoal text-xl">Dimensions</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {product.sizeVisualization?.length && (
                      <div className="bg-warm-white p-3 border border-sand">
                        <span className="block text-[10px] text-warm-gray uppercase tracking-widest mb-1">Length</span>
                        <span className="block font-body text-charcoal">{product.sizeVisualization?.length}cm</span>
                      </div>
                    )}
                    {product.sizeVisualization?.insertableLength && (
                      <div className="bg-warm-white p-3 border border-sand">
                        <span className="block text-[10px] text-warm-gray uppercase tracking-widest mb-1">Insertable</span>
                        <span className="block font-body text-charcoal">{product.sizeVisualization?.insertableLength}cm</span>
                      </div>
                    )}
                    {product.sizeVisualization?.diameter && (
                      <div className="bg-warm-white p-3 border border-sand">
                        <span className="block text-[10px] text-warm-gray uppercase tracking-widest mb-1">Diameter</span>
                        <span className="block font-body text-charcoal">{product.sizeVisualization?.diameter}cm</span>
                      </div>
                    )}
                    {product.sizeVisualization?.circumference && (
                      <div className="bg-warm-white p-3 border border-sand">
                        <span className="block text-[10px] text-warm-gray uppercase tracking-widest mb-1">Girth</span>
                        <span className="block font-body text-charcoal">{product.sizeVisualization?.circumference}cm</span>
                      </div>
                    )}
                  </div>
                </div>

                {product.sizeRecommendation && (
                  <div className="flex-1 border-t md:border-t-0 md:border-l border-sand pt-6 md:pt-0 md:pl-8">
                    <div className="flex items-center gap-3 mb-6">
                      <User className="w-5 h-5 text-charcoal" />
                      <h3 className="font-display text-charcoal text-xl">Fit & Recommendations</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-terracotta/5 p-4 border border-terracotta/10">
                        <span className="block text-[10px] text-terracotta uppercase font-bold tracking-widest mb-1">Fit Type</span>
                        <p className="font-display text-charcoal capitalize">{product.sizeRecommendation.fitType.replace('_', ' ')}</p>
                      </div>
                      {product.sizeRecommendation.notes && (
                        <p className="font-body text-warm-gray text-xs leading-relaxed italic">
                          &ldquo;{product.sizeRecommendation.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3D Model Explorer */}
            {product.model3D && (
              <div className="bg-charcoal p-8 flex flex-col items-center justify-center text-center border border-charcoal">
                <Box className="w-12 h-12 text-terracotta mb-4" />
                <h3 className="font-display text-cream text-2xl mb-2">Interactive 3D View</h3>
                <p className="font-body text-warm-gray text-sm mb-8 max-w-xs">
                  Explore every detail from any angle. Compatible with AR for real-world visualization.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button className="w-full bg-terracotta text-cream py-3 px-6 font-body text-sm uppercase tracking-widest hover:bg-terracotta-dark transition-colors flex items-center justify-center gap-2">
                    <Maximize className="w-4 h-4" />
                    Launch Explorer
                  </button>
                  {product.model3D.arSupported && (
                    <button className="w-full bg-charcoal border border-warm-gray/30 text-cream py-3 px-6 font-body text-sm uppercase tracking-widest hover:bg-warm-gray/10 transition-colors flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4" />
                      View in My Space
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {
          relatedProducts.length > 0 && (
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
          )
        }

        {/* Reviews Section */}
        <div className="mt-16 pt-16 border-t border-sand">
          <ReviewsSection
            productId={product.id}
            productName={product.name}
            initialReviews={initialReviews}
            initialReviewSummary={initialReviewSummary}
          />
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


