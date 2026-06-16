'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { useCartStore, useLocaleStore } from '@/stores'

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getTotal,
  } = useCartStore()
  const { formatPrice } = useLocaleStore()

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const total = getTotal()
  const FREE_SHIPPING_THRESHOLD = 7500
  const isEligibleForFreeShipping = total >= FREE_SHIPPING_THRESHOLD
  const shippingProgress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100)

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-charcoal/50 z-[70] transition-opacity duration-400"
        style={{ animation: 'fadeIn 0.4s ease' }}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-warm-white z-[80] flex flex-col shadow-2xl"
        style={{ animation: 'slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sand">
          <h2 className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
            Your Bag
          </h2>
          <button
            onClick={closeCart}
            className="text-mid-gray hover:text-charcoal transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Discreet Shipping Notice */}
        <div className="px-6 py-3 bg-cream/50 border-b border-sand">
          <p className="font-body text-warm-gray text-xs text-center tracking-wide">
            Ships in plain packaging. Bank statement reads CALŌR CO.
          </p>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="px-6 pt-3 pb-2 bg-cream/30 border-b border-sand/50">
          <div className="h-1 bg-sand w-full overflow-hidden">
            <div
              className="h-full bg-terracotta transition-all duration-500 ease-out"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
          <p className="font-body text-warm-gray text-xs text-center mt-2">
            {isEligibleForFreeShipping
              ? <span className="text-terracotta">You qualify for free shipping ✓</span>
              : <>Add {formatPrice(FREE_SHIPPING_THRESHOLD - total)} more for free shipping</>
            }
          </p>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="relative text-center py-12">
              {/* Watermark "C" */}
              <span
                className="absolute inset-0 flex items-center justify-center font-display select-none pointer-events-none"
                style={{
                  fontSize: '10rem',
                  color: 'rgba(44, 36, 32, 0.04)',
                  lineHeight: 1,
                  fontWeight: 300,
                }}
              >
                C
              </span>
              <p className="font-body text-warm-gray mb-4 relative z-10">Nothing here yet.</p>
              <a
                href="/shop"
                onClick={closeCart}
                className="font-body text-terracotta text-sm hover:underline relative z-10"
              >
                Explore the collection
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 animate-slide-in-up"
                >
                  {/* Image */}
                  <div className="w-[72px] h-[72px] bg-gradient-to-br from-cream to-sand flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={72}
                        height={72}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-charcoal/20 text-2xl">
                          {item.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-warm-gray text-xs uppercase tracking-wider">
                      {item.category}
                    </p>
                    <h3 className="font-display text-charcoal text-sm mt-0.5 truncate" style={{ fontWeight: 400 }}>
                      {item.name}
                    </h3>
                    <p className="font-body text-charcoal text-sm mt-1">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center border border-sand hover:bg-sand hover:border-terracotta transition-all duration-200"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-body text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center border border-sand hover:bg-sand hover:border-terracotta transition-all duration-200"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-warm-gray hover:text-ember transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-sand bg-cream/30">
            {/* Subtotal */}
            <div className="flex justify-between items-center mb-4">
              <span className="font-body text-warm-gray text-sm">Subtotal</span>
              <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                {formatPrice(total)}
              </span>
            </div>

            {/* Checkout Button */}
            <a
              href="/checkout"
              onClick={closeCart}
              className="group block w-full bg-charcoal text-cream py-4 text-center font-body text-sm uppercase tracking-wider transition-colors duration-300 hover:bg-terracotta flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            {/* Payment Methods Note */}
            <p className="font-body text-warm-gray text-xs text-center mt-4">
              Crypto, card &amp; bank transfer accepted
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
