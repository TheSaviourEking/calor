"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  ArrowLeft,
  CreditCard,
  Building2,
  Bitcoin,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useCartStore, useLocaleStore } from "@/stores";
import Link from "next/link";

// Stripe public key (test mode)
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "pk_test_placeholder",
);

const paymentMethods = [
  {
    id: "card",
    name: "Pay by Card",
    icon: CreditCard,
    description: "Visa, Mastercard, Amex, Discover",
  },
  {
    id: "bank",
    name: "Bank Transfer",
    icon: Building2,
    description: "ACH / SEPA / Wire",
  },
  {
    id: "crypto",
    name: "Pay with Crypto",
    icon: Bitcoin,
    description: "Bitcoin, Ethereum, USDC, Litecoin, Monero",
  },
];

interface CheckoutData {
  email: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postcode: string;
  country: string;
  phone?: string;
  isGift: boolean;
  giftMessage?: string;
  giftWrappingId?: string;
  isAnonymousGift: boolean;
  recipientEmail?: string;
  senderName?: string;
  loyaltyPointsUsed?: number;
  promoCodeId?: string;
  giftCardId?: string;
  giftCardAppliedCents?: number;
}

interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string | null;
  routingNumber: string | null;
  swiftCode: string | null;
  iban: string | null;
  sortCode?: string;
  reference: string;
  amount: string;
  currency: string;
}

function StripePaymentForm({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation?order_id=${orderId}`,
      },
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-terracotta text-warm-white py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-terracotta-light disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </button>
    </form>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { formatPrice } = useLocaleStore();

  const [selectedMethod, setSelectedMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [cryptoUrl, setCryptoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = getTotal();
  const shipping = total >= 7500 ? 0 : 1200;
  const wrappingCost = checkoutData?.isGift ? 0 : 0; // Gift wrapping cost is handled in checkout
  const grandTotal = total + shipping + wrappingCost;

  // Load checkout data from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("calor_checkout");
    if (stored) {
      try {
        setCheckoutData(JSON.parse(stored));
      } catch {
        router.push("/checkout");
      }
    } else {
      router.push("/checkout");
    }
  }, [router]);

  // Create order when component mounts
  const createOrder = useCallback(
    async (paymentMethod: string) => {
      if (!checkoutData || orderId) return null;

      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            })),
            shippingAddress: {
              line1: checkoutData.line1,
              line2: checkoutData.line2,
              city: checkoutData.city,
              state: checkoutData.state,
              postcode: checkoutData.postcode,
              country: checkoutData.country,
            },
            paymentMethod,
            isGuest: true, // For now, treating all as guest checkout
            guestEmail: checkoutData.email,
            isGift: checkoutData.isGift,
            giftMessage: checkoutData.giftMessage,
            giftWrappingId: checkoutData.giftWrappingId,
            isAnonymousGift: checkoutData.isAnonymousGift,
            recipientEmail: checkoutData.recipientEmail,
            loyaltyPointsUsed: checkoutData.loyaltyPointsUsed,
            promoCodeId: checkoutData.promoCodeId,
            giftCardId: checkoutData.giftCardId,
            giftCardAppliedCents: checkoutData.giftCardAppliedCents,
          }),
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to create order");

        return data.order;
      } catch (err) {
        console.error("Order creation error:", err);
        setError("Failed to create order. Please try again.");
        return null;
      }
    },
    [checkoutData, items, orderId],
  );

  // Initialize payment based on method
  const initializePayment = useCallback(
    async (method: string) => {
      if (!checkoutData) return;

      setIsProcessing(true);
      setError(null);

      // Create order first
      const order = await createOrder(method);
      if (!order) {
        setIsProcessing(false);
        return;
      }

      setOrderId(order.id);

      if (method === "card") {
        // Create Stripe payment intent
        try {
          const response = await fetch("/api/payment/create-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: order.id }),
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error || "Failed to initialize payment");
          setClientSecret(data.clientSecret);
        } catch (err) {
          console.error("Payment intent error:", err);
          setError(
            "Failed to initialize card payment. Please try another method.",
          );
        }
      } else if (method === "crypto") {
        // Create Coinbase charge
        try {
          const response = await fetch("/api/payment/crypto-charge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: order.id }),
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error || "Failed to create crypto charge");
          setCryptoUrl(data.hostedUrl);
        } catch (err) {
          console.error("Crypto charge error:", err);
          setError(
            "Failed to initialize crypto payment. Please try another method.",
          );
        }
      } else if (method === "bank") {
        // Setup bank transfer
        try {
          const response = await fetch("/api/payment/bank-transfer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              region: checkoutData.country,
            }),
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error || "Failed to setup bank transfer");
          setBankDetails(data.bankDetails);
        } catch (err) {
          console.error("Bank transfer error:", err);
          setError("Failed to setup bank transfer. Please try another method.");
        }
      }

      setIsProcessing(false);
    },
    [checkoutData, createOrder],
  );

  // Handle method selection
  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setClientSecret(null);
    setBankDetails(null);
    setCryptoUrl(null);
    setError(null);
  };

  // Handle place order
  const handlePlaceOrder = () => {
    initializePayment(selectedMethod);
  };

  // Redirect to crypto payment
  useEffect(() => {
    if (cryptoUrl) {
      window.location.href = cryptoUrl;
    }
  }, [cryptoUrl]);

  // Handle successful payment
  const handlePaymentSuccess = () => {
    clearCart();
    sessionStorage.removeItem("calor_checkout");
    router.push(`/checkout/confirmation?order_id=${orderId}`);
  };

  if (items.length === 0) {
    router.push("/shop");
    return null;
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 font-body text-warm-gray text-sm mb-6 hover:text-terracotta transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to shipping
          </Link>
          <h1
            className="font-display text-charcoal"
            style={{ fontSize: "clamp(2rem, 3vw, 2.5rem)", fontWeight: 300 }}
          >
            Payment
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Payment Methods */}
            <div className="bg-warm-white p-6 mb-6 border border-sand">
              <h2
                className="font-display text-charcoal text-lg mb-4"
                style={{ fontWeight: 400 }}
              >
                Select Payment Method
              </h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => handleMethodSelect(method.id)}
                    className={`w-full flex items-center gap-4 p-4 border transition-colors ${
                      selectedMethod === method.id
                        ? "border-terracotta bg-terracotta/5"
                        : "border-sand hover:border-terracotta/50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 border flex items-center justify-center ${
                        selectedMethod === method.id
                          ? "border-terracotta"
                          : "border-sand"
                      }`}
                    >
                      {selectedMethod === method.id && (
                        <Check className="w-3 h-3 text-terracotta" />
                      )}
                    </div>
                    <method.icon className="w-5 h-5 text-terracotta" />
                    <div className="text-left">
                      <p className="font-body text-charcoal text-sm">
                        {method.name}
                      </p>
                      <p className="font-body text-warm-gray text-xs">
                        {method.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Payment (Stripe Elements) */}
            {selectedMethod === "card" && clientSecret && (
              <div className="bg-warm-white p-6 mb-6 border border-sand">
                <h2
                  className="font-display text-charcoal text-lg mb-4"
                  style={{ fontWeight: 400 }}
                >
                  Card Details
                </h2>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm
                    orderId={orderId!}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
                <p className="font-body text-warm-gray text-xs mt-4">
                  We never store your card details. Payment is processed by
                  Stripe and held by them, not us.
                </p>
              </div>
            )}

            {/* Card Form (before initialization) */}
            {selectedMethod === "card" && !clientSecret && (
              <div className="bg-warm-white p-6 mb-6 border border-sand">
                <h2
                  className="font-display text-charcoal text-lg mb-4"
                  style={{ fontWeight: 400 }}
                >
                  Card Details
                </h2>
                <p className="font-body text-warm-gray text-sm mb-4">
                  Click &quot;Place Order&quot; to proceed to secure card
                  payment.
                </p>
                <p className="font-body text-warm-gray text-xs">
                  We never store your card details. Payment is processed by
                  Stripe and held by them, not us.
                </p>
              </div>
            )}

            {/* Crypto Info */}
            {selectedMethod === "crypto" && !cryptoUrl && (
              <div className="bg-warm-white p-6 mb-6 border border-sand">
                <h2
                  className="font-display text-charcoal text-lg mb-4"
                  style={{ fontWeight: 400 }}
                >
                  Crypto Payment
                </h2>
                <p className="font-body text-warm-gray text-sm mb-4">
                  After clicking &quot;Place Order&quot;, you&apos;ll be
                  redirected to complete your payment securely. We accept
                  Bitcoin, Ethereum, USDC, Litecoin, and Monero.
                </p>
                <p className="font-body text-terracotta text-xs">
                  For maximum privacy, we recommend Monero (XMR).
                </p>
              </div>
            )}

            {/* Bank Transfer Details */}
            {selectedMethod === "bank" && bankDetails && (
              <div className="bg-warm-white p-6 mb-6 border border-sand">
                <h2
                  className="font-display text-charcoal text-lg mb-4"
                  style={{ fontWeight: 400 }}
                >
                  Bank Transfer Details
                </h2>
                <div className="space-y-3 font-body text-sm">
                  <div className="flex justify-between">
                    <span className="text-warm-gray">Bank Name</span>
                    <span className="text-charcoal">
                      {bankDetails.bankName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-gray">Account Name</span>
                    <span className="text-charcoal">
                      {bankDetails.accountName}
                    </span>
                  </div>
                  {bankDetails.accountNumber && (
                    <div className="flex justify-between">
                      <span className="text-warm-gray">Account Number</span>
                      <span className="text-charcoal font-mono">
                        {bankDetails.accountNumber}
                      </span>
                    </div>
                  )}
                  {bankDetails.routingNumber && (
                    <div className="flex justify-between">
                      <span className="text-warm-gray">Routing Number</span>
                      <span className="text-charcoal font-mono">
                        {bankDetails.routingNumber}
                      </span>
                    </div>
                  )}
                  {bankDetails.swiftCode && (
                    <div className="flex justify-between">
                      <span className="text-warm-gray">SWIFT Code</span>
                      <span className="text-charcoal font-mono">
                        {bankDetails.swiftCode}
                      </span>
                    </div>
                  )}
                  {bankDetails.iban && (
                    <div className="flex justify-between">
                      <span className="text-warm-gray">IBAN</span>
                      <span className="text-charcoal font-mono text-xs">
                        {bankDetails.iban}
                      </span>
                    </div>
                  )}
                  {bankDetails.sortCode && (
                    <div className="flex justify-between">
                      <span className="text-warm-gray">Sort Code</span>
                      <span className="text-charcoal font-mono">
                        {bankDetails.sortCode}
                      </span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-sand">
                    <div className="flex justify-between">
                      <span className="text-warm-gray">Amount</span>
                      <span className="text-charcoal font-semibold">
                        ${bankDetails.amount} {bankDetails.currency}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-warm-gray">Reference</span>
                      <span className="text-terracotta font-mono text-xs">
                        {bankDetails.reference}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-sand/20">
                  <p className="font-body text-warm-gray text-xs">
                    Include the reference code with your transfer. Your order
                    will ship within 1-2 business days after payment is
                    confirmed.
                  </p>
                </div>
                <button
                  onClick={handlePaymentSuccess}
                  className="w-full mt-4 bg-terracotta text-warm-white py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-terracotta-light"
                >
                  I&apos;ve Initiated the Transfer
                </button>
              </div>
            )}

            {/* Bank Transfer Info (before initialization) */}
            {selectedMethod === "bank" && !bankDetails && (
              <div className="bg-warm-white p-6 mb-6 border border-sand">
                <h2
                  className="font-display text-charcoal text-lg mb-4"
                  style={{ fontWeight: 400 }}
                >
                  Bank Transfer
                </h2>
                <p className="font-body text-warm-gray text-sm">
                  After placing your order, you&apos;ll receive bank details and
                  a unique reference code. Your order will ship once payment is
                  confirmed.
                </p>
              </div>
            )}

            {/* Place Order Button */}
            {!clientSecret && !bankDetails && !cryptoUrl && (
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full bg-terracotta text-warm-white py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-terracotta-light disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Place Order • ${formatPrice(grandTotal)}`
                )}
              </button>
            )}

            <p className="font-body text-warm-gray text-xs text-center mt-4">
              By placing your order you agree to our Terms of Service. Your
              order will ship within 1-2 business days in plain, unmarked
              packaging.
            </p>
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

              <div className="border-t border-sand pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-body text-warm-gray text-sm">
                    Subtotal
                  </span>
                  <span className="font-body text-charcoal text-sm">
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body text-warm-gray text-sm">
                    Shipping
                  </span>
                  <span className="font-body text-charcoal text-sm">
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>
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

              {checkoutData.isGift && (
                <div className="mt-4 p-3 bg-terracotta/10 border border-terracotta/20">
                  <p className="font-body text-charcoal text-sm">
                    Gift order{checkoutData.isAnonymousGift && " (Anonymous)"}
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
