"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Lock,
  Package,
  CreditCard,
  Gift,
  Eye,
  EyeOff,
  Tag,
  CreditCard as CardIcon,
  X,
  Check,
  Loader2,
  Star,
  Sparkles,
} from "lucide-react";
import { useCartStore, useLocaleStore, useCheckoutStore } from "@/stores";
import { toast } from "sonner";
import AddressAutocomplete from "@/components/checkout/AddressAutocomplete";
import Link from "next/link";

interface GiftWrappingOption {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
}

interface CheckoutClientProps {
  giftWrappingOptions: GiftWrappingOption[];
}

export default function CheckoutClient({
  giftWrappingOptions,
}: CheckoutClientProps) {
  const router = useRouter();
  const { items, getTotal } = useCartStore();
  const { formatPrice } = useLocaleStore();
  const {
    promoCode,
    giftCard,
    loyaltyPoints,
    availablePoints,
    applyPromo,
    removePromo,
    applyGiftCard,
    removeGiftCard,
    applyPoints,
    removePoints,
    setAvailablePoints,
    getTotalDiscount,
  } = useCheckoutStore();

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postcode: "",
    country: "US",
    phone: "",
  });

  // Gift options
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const defaultWrapping =
    giftWrappingOptions.find((o) => o.priceCents === 0)?.id || null;
  const [selectedWrapping, setSelectedWrapping] = useState<string | null>(
    defaultWrapping,
  );
  const [isAnonymousGift, setIsAnonymousGift] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");

  // Promo code
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  // Gift card
  const [giftCardInput, setGiftCardInput] = useState("");
  const [giftCardLoading, setGiftCardLoading] = useState(false);

  // Loyalty points
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsToUse, setPointsToUse] = useState<number>(0);

  // Fetch available loyalty points on mount
  useEffect(() => {
    async function fetchLoyaltyPoints() {
      try {
        const res = await fetch("/api/checkout/loyalty-points");
        if (res.ok) {
          const data = await res.json();
          setAvailablePoints(data.points);
        }
      } catch (error) {
        console.error("Error fetching loyalty points:", error);
      }
    }
    fetchLoyaltyPoints();
  }, [setAvailablePoints]);

  const subtotal = getTotal();
  const shipping = subtotal >= 7500 ? 0 : 1200;
  const wrappingCost =
    giftWrappingOptions.find((o) => o.id === selectedWrapping)?.priceCents || 0;

  // Calculate discounts
  const {
    promoDiscount,
    giftCardDiscount,
    pointsDiscount,
    total: discountedTotal,
  } = getTotalDiscount(subtotal, shipping + wrappingCost);
  const grandTotal = Math.max(
    0,
    subtotal +
      shipping +
      wrappingCost -
      promoDiscount -
      giftCardDiscount -
      pointsDiscount,
  );

  // Handle promo code application
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setPromoLoading(true);
    try {
      const res = await fetch("/api/checkout/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoInput.trim(),
          subtotalCents: subtotal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid promo code");
        return;
      }

      applyPromo({
        id: data.promo.id,
        code: data.promo.code,
        name: data.promo.name,
        type: data.promo.type,
        value: data.promo.value,
        discountCents: data.promo.discountCents,
      });

      toast.success(`Promo code applied: ${data.promo.name}`);
      setPromoInput("");
    } catch (error) {
      toast.error("Failed to validate promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  // Handle gift card application
  const handleApplyGiftCard = async () => {
    if (!giftCardInput.trim()) {
      toast.error("Please enter a gift card code");
      return;
    }

    setGiftCardLoading(true);
    try {
      const res = await fetch("/api/checkout/validate-giftcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCardInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid gift card");
        return;
      }

      applyGiftCard(
        {
          id: data.giftCard.id,
          code: data.giftCard.code,
          balanceCents: data.giftCard.balanceCents,
          appliedCents: 0,
        },
        subtotal + shipping + wrappingCost - promoDiscount,
      );

      toast.success(
        `Gift card applied: ${formatPrice(data.giftCard.balanceCents)} available`,
      );
      setGiftCardInput("");
    } catch (error) {
      toast.error("Failed to validate gift card");
    } finally {
      setGiftCardLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Store checkout data in sessionStorage for payment page
    const checkoutData = {
      ...formData,
      isGift,
      giftMessage: isGift ? giftMessage : null,
      giftWrappingId: isGift ? selectedWrapping : null,
      isAnonymousGift: isGift && isAnonymousGift,
      recipientEmail: isGift && isAnonymousGift ? recipientEmail : null,
      senderName: isGift && !isAnonymousGift ? senderName : null,
      promoCodeId: promoCode?.id || null,
      giftCardId: giftCard?.id || null,
      giftCardAppliedCents: giftCard?.appliedCents || 0,
      promoDiscountCents: promoDiscount,
      loyaltyPointsUsed: loyaltyPoints?.pointsUsed || 0,
      loyaltyDiscountCents: pointsDiscount,
    };
    sessionStorage.setItem("calor_checkout", JSON.stringify(checkoutData));

    router.push("/checkout/payment");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-charcoal text-2xl mb-4">
            Your bag is empty
          </h1>
          <Link
            href="/shop"
            className="font-body text-terracotta hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 font-body text-warm-gray text-sm mb-6 hover:text-terracotta transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue shopping
          </Link>
          <h1
            className="font-display text-charcoal"
            style={{ fontSize: "clamp(2rem, 3vw, 2.5rem)", fontWeight: 300 }}
          >
            Checkout
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Contact */}
              <div className="bg-warm-white p-6 mb-6 border border-sand">
                <h2
                  className="font-display text-charcoal text-lg mb-4"
                  style={{ fontWeight: 400 }}
                >
                  Contact
                </h2>
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta mb-4"
                />
                <p className="font-body text-warm-gray text-xs">
                  Order updates will be sent to this email. Your email is never
                  shared.
                </p>
              </div>

              {/* Shipping */}
              <div className="bg-warm-white p-6 mb-6 border border-sand">
                <h2
                  className="font-display text-charcoal text-lg mb-4"
                  style={{ fontWeight: 400 }}
                >
                  Shipping Address
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First name"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
                <AddressAutocomplete
                  value={formData.line1}
                  onChange={(value) =>
                    setFormData({ ...formData, line1: value })
                  }
                  onSelect={(address) =>
                    setFormData({
                      ...formData,
                      line1: address.line1,
                      city: address.city,
                      state: address.state,
                      postcode: address.postcode,
                      country: address.country,
                    })
                  }
                  placeholder="Start typing your address..."
                  className="mt-4"
                />
                <input
                  type="text"
                  placeholder="Address line 2 (optional)"
                  value={formData.line2}
                  onChange={(e) =>
                    setFormData({ ...formData, line2: e.target.value })
                  }
                  className="w-full mt-4 px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <input
                    type="text"
                    placeholder="City"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <input
                    type="text"
                    placeholder="ZIP / Postal code"
                    required
                    value={formData.postcode}
                    onChange={(e) =>
                      setFormData({ ...formData, postcode: e.target.value })
                    }
                    className="px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                  <select
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  >
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
                <input
                  type="tel"
                  placeholder="Phone (optional, for delivery updates)"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full mt-4 px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                />
              </div>

              {/* Promo Code & Gift Card */}
              <div className="bg-warm-white p-6 mb-6 border border-sand">
                <h2
                  className="font-display text-charcoal text-lg mb-4"
                  style={{ fontWeight: 400 }}
                >
                  Discounts & Credits
                </h2>

                {/* Applied Promo */}
                {promoCode && (
                  <div className="mb-4 p-3 bg-terracotta/10 border border-terracotta/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-terracotta" />
                      <div>
                        <p className="font-body text-charcoal text-sm">
                          {promoCode.name}
                        </p>
                        <p className="font-body text-terracotta text-xs">
                          {promoCode.type === "percentage"
                            ? `${promoCode.value}% off`
                            : promoCode.type === "free_shipping"
                              ? "Free shipping"
                              : formatPrice(promoCode.value)}
                          {promoCode.type !== "free_shipping" &&
                            ` (-${formatPrice(promoCode.discountCents)})`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removePromo}
                      className="p-1 hover:bg-terracotta/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-terracotta" />
                    </button>
                  </div>
                )}

                {/* Applied Gift Card */}
                {giftCard && (
                  <div className="mb-4 p-3 bg-terracotta/10 border border-terracotta/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardIcon className="w-4 h-4 text-terracotta" />
                      <div>
                        <p className="font-body text-charcoal text-sm">
                          Gift Card ••••{giftCard.code.slice(-4)}
                        </p>
                        <p className="font-body text-terracotta text-xs">
                          Applied: {formatPrice(giftCard.appliedCents)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeGiftCard}
                      className="p-1 hover:bg-terracotta/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-terracotta" />
                    </button>
                  </div>
                )}

                {/* Applied Loyalty Points */}
                {loyaltyPoints && (
                  <div className="mb-4 p-3 bg-terracotta/10 border border-terracotta/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-terracotta" />
                      <div>
                        <p className="font-body text-charcoal text-sm">
                          Loyalty Points
                        </p>
                        <p className="font-body text-terracotta text-xs">
                          {loyaltyPoints.pointsUsed} points ={" "}
                          {formatPrice(loyaltyPoints.discountCents)} off
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removePoints}
                      className="p-1 hover:bg-terracotta/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-terracotta" />
                    </button>
                  </div>
                )}

                {/* Promo Code Input */}
                {!promoCode && (
                  <div className="mb-4">
                    <label className="font-body text-charcoal text-sm mb-2 block">
                      Promo Code
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={promoInput}
                          onChange={(e) =>
                            setPromoInput(e.target.value.toUpperCase())
                          }
                          className="w-full pl-10 pr-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta uppercase"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={promoLoading}
                        className="px-6 py-3 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50"
                      >
                        {promoLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Gift Card Input */}
                {!giftCard && (
                  <div className="mb-4">
                    <label className="font-body text-charcoal text-sm mb-2 block">
                      Gift Card
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <CardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
                        <input
                          type="text"
                          placeholder="Enter gift card code"
                          value={giftCardInput}
                          onChange={(e) =>
                            setGiftCardInput(e.target.value.toUpperCase())
                          }
                          className="w-full pl-10 pr-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta uppercase"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyGiftCard}
                        disabled={giftCardLoading}
                        className="px-6 py-3 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50"
                      >
                        {giftCardLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Loyalty Points Input */}
                {!loyaltyPoints && availablePoints > 0 && (
                  <div className="p-4 bg-sand/20 border border-sand">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-terracotta" />
                      <span className="font-body text-charcoal text-sm">
                        Use Loyalty Points
                      </span>
                      <span className="font-body text-warm-gray text-xs ml-auto">
                        {availablePoints.toLocaleString()} points available
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max={Math.min(
                            availablePoints,
                            (subtotal +
                              shipping +
                              wrappingCost -
                              promoDiscount) *
                              100,
                          )}
                          value={pointsToUse}
                          onChange={(e) =>
                            setPointsToUse(parseInt(e.target.value))
                          }
                          className="w-full accent-terracotta"
                        />
                        <div className="flex justify-between mt-1">
                          <span className="font-body text-warm-gray text-xs">
                            0
                          </span>
                          <span className="font-body text-charcoal text-xs font-medium">
                            {pointsToUse.toLocaleString()} pts ={" "}
                            {formatPrice(pointsToUse)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (pointsToUse > 0) {
                            applyPoints(
                              pointsToUse,
                              subtotal +
                                shipping +
                                wrappingCost -
                                promoDiscount,
                            );
                            toast.success(
                              `${pointsToUse.toLocaleString()} points applied!`,
                            );
                          }
                        }}
                        disabled={pointsToUse === 0}
                        className="px-4 py-2 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="font-body text-warm-gray text-xs mt-2">
                      100 points = $1.00 off your order
                    </p>
                  </div>
                )}
              </div>

              {/* Gift Options */}
              <div className="bg-warm-white p-6 mb-6 border border-sand">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-terracotta" />
                    <h2
                      className="font-display text-charcoal text-lg"
                      style={{ fontWeight: 400 }}
                    >
                      Gift Options
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGift(!isGift)}
                    className={`w-12 h-6 relative transition-colors ${
                      isGift ? "bg-terracotta" : "bg-sand"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-cream transition-transform ${
                        isGift ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {isGift && (
                  <div className="space-y-4 pt-4 border-t border-sand">
                    {/* Gift Wrapping Options */}
                    {giftWrappingOptions.length > 0 && (
                      <div>
                        <label className="font-body text-charcoal text-sm mb-2 block">
                          Gift Wrapping
                        </label>
                        <div className="space-y-2">
                          {giftWrappingOptions.map((option) => (
                            <label
                              key={option.id}
                              className={`flex items-start gap-3 p-3 cursor-pointer border transition-colors ${
                                selectedWrapping === option.id
                                  ? "border-terracotta bg-terracotta/5"
                                  : "border-sand hover:border-terracotta/50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="giftWrapping"
                                value={option.id}
                                checked={selectedWrapping === option.id}
                                onChange={() => setSelectedWrapping(option.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <span className="font-body text-charcoal text-sm">
                                    {option.name}
                                  </span>
                                  <span className="font-body text-warm-gray text-sm">
                                    {option.priceCents === 0
                                      ? "Free"
                                      : formatPrice(option.priceCents)}
                                  </span>
                                </div>
                                <p className="font-body text-warm-gray text-xs mt-1">
                                  {option.description}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gift Message */}
                    <div>
                      <label className="font-body text-charcoal text-sm mb-2 block">
                        Gift Message (optional)
                      </label>
                      <textarea
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Add a personal message..."
                        rows={3}
                        className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta resize-none"
                        maxLength={200}
                      />
                      <p className="font-body text-warm-gray text-xs mt-1">
                        {giftMessage.length}/200 characters
                      </p>
                    </div>

                    {/* Anonymous Gifting */}
                    <div className="p-4 bg-sand/20 border border-sand">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isAnonymousGift ? (
                            <EyeOff className="w-4 h-4 text-terracotta" />
                          ) : (
                            <Eye className="w-4 h-4 text-warm-gray" />
                          )}
                          <span className="font-body text-charcoal text-sm">
                            Anonymous Gift
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAnonymousGift(!isAnonymousGift)}
                          className={`w-10 h-5 relative transition-colors ${
                            isAnonymousGift ? "bg-terracotta" : "bg-sand"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 bg-cream transition-transform ${
                              isAnonymousGift ? "right-0.5" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      {isAnonymousGift ? (
                        <div className="mt-3">
                          <p className="font-body text-warm-gray text-xs mb-2">
                            Recipient will receive an email notification without
                            your details.
                          </p>
                          <input
                            type="email"
                            placeholder="Recipient's email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                          />
                        </div>
                      ) : (
                        <div className="mt-3">
                          <p className="font-body text-warm-gray text-xs mb-2">
                            Add your name to the gift message (optional).
                          </p>
                          <input
                            type="text"
                            placeholder="Your name (shown on gift)"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap gap-6 mb-6 py-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-terracotta" />
                  <span className="font-body text-warm-gray text-xs">
                    256-bit encrypted
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-terracotta" />
                  <span className="font-body text-warm-gray text-xs">
                    Plain packaging
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-terracotta" />
                  <span className="font-body text-warm-gray text-xs">
                    Statement shows CALŌR CO.
                  </span>
                </div>
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                className="w-full bg-charcoal text-cream py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-terracotta"
              >
                Continue to Payment
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-warm-white p-6 border border-sand sticky top-24">
              <h2
                className="font-display text-charcoal text-lg mb-4"
                style={{ fontWeight: 400 }}
              >
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-cream to-sand flex-shrink-0">
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-charcoal/20 text-xl">
                          {item.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-charcoal text-sm truncate">
                        {item.name}
                      </p>
                      <p className="font-body text-warm-gray text-xs">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-body text-charcoal text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-sand pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-body text-warm-gray text-sm">
                    Subtotal
                  </span>
                  <span className="font-body text-charcoal text-sm">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-warm-gray text-sm">
                    Shipping
                  </span>
                  <span className="font-body text-charcoal text-sm">
                    {shipping === 0 || promoCode?.type === "free_shipping"
                      ? "Free"
                      : formatPrice(shipping)}
                  </span>
                </div>
                {isGift && wrappingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="font-body text-warm-gray text-sm">
                      Gift Wrapping
                    </span>
                    <span className="font-body text-charcoal text-sm">
                      {formatPrice(wrappingCost)}
                    </span>
                  </div>
                )}
                {promoCode && promoDiscount > 0 && (
                  <div className="flex justify-between text-terracotta">
                    <span className="font-body text-sm">Promo Discount</span>
                    <span className="font-body text-sm">
                      -{formatPrice(promoDiscount)}
                    </span>
                  </div>
                )}
                {giftCard && giftCardDiscount > 0 && (
                  <div className="flex justify-between text-terracotta">
                    <span className="font-body text-sm">Gift Card</span>
                    <span className="font-body text-sm">
                      -{formatPrice(giftCardDiscount)}
                    </span>
                  </div>
                )}
                {loyaltyPoints && pointsDiscount > 0 && (
                  <div className="flex justify-between text-terracotta">
                    <span className="font-body text-sm">
                      Loyalty Points (
                      {loyaltyPoints.pointsUsed.toLocaleString()})
                    </span>
                    <span className="font-body text-sm">
                      -{formatPrice(pointsDiscount)}
                    </span>
                  </div>
                )}
                {subtotal < 7500 && !promoCode && (
                  <p className="font-body text-terracotta text-xs">
                    Add {formatPrice(7500 - subtotal)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between pt-2 border-t border-sand">
                  <span
                    className="font-display text-charcoal"
                    style={{ fontWeight: 400 }}
                  >
                    Total
                  </span>
                  <span
                    className="font-display text-charcoal text-lg"
                    style={{ fontWeight: 400 }}
                  >
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Gift Summary */}
              {isGift && (
                <div className="mt-4 p-3 bg-terracotta/10 border border-terracotta/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-4 h-4 text-terracotta" />
                    <span className="font-body text-charcoal text-sm">
                      Gift Order
                    </span>
                  </div>
                  <p className="font-body text-warm-gray text-xs">
                    {isAnonymousGift
                      ? "Anonymous gift - recipient will be notified by email"
                      : "Gift wrapped with your personal message"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
