"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

// Ring configuration: 7 rings radiating from the heat source
// Each has a slightly displaced center (cx/cy offsets from origin) for organic feel
const ORIGIN = { x: 310, y: 470 }; // off-center: 38.75% x, 52.2% y of 800x900 viewport

const rings = [
  { r: 45,  cxOff: 0,  cyOff: 0,  strokeOpacity: 0.30, strokeWidth: 0.8, fill: "rgba(196,120,90,0.06)", parallaxRate: -0.35 },
  { r: 90,  cxOff: 2,  cyOff: -2, strokeOpacity: 0.22, strokeWidth: 0.7, fill: "none",                   parallaxRate: -0.25 },
  { r: 150, cxOff: 3,  cyOff: -4, strokeOpacity: 0.17, strokeWidth: 0.6, fill: "none",                   parallaxRate: -0.30 },
  { r: 220, cxOff: 2,  cyOff: -3, strokeOpacity: 0.12, strokeWidth: 0.5, fill: "none",                   parallaxRate: -0.25 },
  { r: 310, cxOff: 4,  cyOff: -5, strokeOpacity: 0.08, strokeWidth: 0.4, fill: "none",                   parallaxRate: -0.18 },
  { r: 420, cxOff: 5,  cyOff: -6, strokeOpacity: 0.05, strokeWidth: 0.3, fill: "none",                   parallaxRate: -0.12 },
  { r: 550, cxOff: 3,  cyOff: -4, strokeOpacity: 0.03, strokeWidth: 0.2, fill: "none",                   parallaxRate: -0.08 },
]

export default function Hero() {
  // Individual refs for each ring — differential parallax
  const ringRefs = useRef<(SVGCircleElement | null)[]>([])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      ringRefs.current.forEach((el, i) => {
        if (el) {
          const rate = rings[i].parallaxRate
          el.style.transform = `translateY(${scrollY * rate}px)`
          el.style.transformOrigin = `${ORIGIN.x + rings[i].cxOff}px ${ORIGIN.y + rings[i].cyOff}px`
        }
      })
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row">
      {/* Left Content */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-16 lg:py-24 relative z-10">
        {/* Eyebrow */}
        <span
          className="eyebrow mb-6 animate-word-in"
          style={{ animationDelay: "0ms" }}
        >
          Intimacy &amp; Wellness
        </span>

        {/* Headline — word-by-word entrance */}
        <h1
          className="font-display font-light leading-[0.95] mb-6"
          style={{ fontSize: "clamp(3rem, 5vw, 5.5rem)" }}
        >
          <span
            className="inline-block animate-word-in"
            style={{ animationDelay: "80ms" }}
          >
            Where{" "}
          </span>
          <span
            className="italic text-terracotta inline-block animate-word-in animate-warmth-pulse"
            style={{ animationDelay: "180ms" }}
          >
            warmth
          </span>
          <br />
          <span
            className="inline-block animate-word-in"
            style={{ animationDelay: "280ms" }}
          >
            lives in every touch.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="font-body font-light text-lg text-warm-gray max-w-md mb-10 leading-relaxed animate-word-in"
          style={{ animationDelay: "420ms" }}
        >
          An elevated destination for intimacy, wellness, and pleasure. Curated
          with care. Delivered discreetly.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-4 animate-word-in"
          style={{ animationDelay: "540ms" }}
        >
          <Link
            href="/shop"
            className="bg-charcoal text-cream px-8 py-4 font-body font-medium text-sm tracking-wider uppercase transition-all duration-300 hover:bg-terracotta text-center"
          >
            Explore Collection
          </Link>

          <Link
            href="/gifts"
            className="border border-charcoal text-center text-charcoal px-8 py-4 font-body font-medium text-sm tracking-wider uppercase transition-all duration-300 hover:bg-charcoal hover:text-cream"
          >
            Shop Gift Sets
          </Link>
        </div>
      </div>

      {/* Right Visual Panel — Heat Ring Composition */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden grain-overlay"
        style={{
          // Radial gradient radiates from the same origin as the rings
          background:
            "radial-gradient(circle at 38.75% 52.2%, #F0E0D6 0%, #F7F2EC 42%, #E8DDD0 100%)",
        }}
      >
        {/* SVG Heat Rings */}
        <svg
          viewBox="0 0 800 900"
          className="absolute inset-0 w-full h-full"
          overflow="visible"
          aria-hidden="true"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            {/* CSS keyframe for ring breathing — applied via style attribute */}
            <style>{`
              .ring-breathe-1 {
                transform-origin: ${ORIGIN.x}px ${ORIGIN.y}px;
                animation: ringBreathe 4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
              }
              .ring-breathe-2 {
                transform-origin: ${ORIGIN.x + 2}px ${ORIGIN.y - 2}px;
                animation: ringBreathe 4s cubic-bezier(0.45, 0, 0.55, 1) -1.5s infinite;
              }
              @keyframes ringBreathe {
                0%, 100% { transform: scale(1.0); opacity: 1; }
                50%       { transform: scale(1.04); opacity: 0.8; }
              }
            `}</style>
          </defs>

          {/* Rings — outermost (6) to innermost (0), so inner ones render on top */}
          {[...rings].reverse().map((ring, reversedIdx) => {
            const originalIdx = rings.length - 1 - reversedIdx
            const cx = ORIGIN.x + ring.cxOff
            const cy = ORIGIN.y + ring.cyOff
            // Breathing only on rings 0 and 1 (the two innermost)
            const breatheClass =
              originalIdx === 0
                ? "ring-breathe-1"
                : originalIdx === 1
                ? "ring-breathe-2"
                : ""

            return (
              <circle
                key={originalIdx}
                ref={(el) => { ringRefs.current[originalIdx] = el }}
                cx={cx}
                cy={cy}
                r={ring.r}
                fill={ring.fill}
                stroke="rgb(196, 120, 90)"
                strokeWidth={ring.strokeWidth}
                strokeOpacity={ring.strokeOpacity}
                className={breatheClass}
                style={{ willChange: "transform" }}
              />
            )
          })}

          {/* Heat source — two-layer center dot */}
          {/* Outer glow */}
          <circle
            cx={ORIGIN.x}
            cy={ORIGIN.y}
            r={8}
            fill="rgba(196, 120, 90, 0.18)"
            style={{
              transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
              animation: "ringBreathe 4s cubic-bezier(0.45, 0, 0.55, 1) -0.8s infinite",
            }}
          />
          {/* Inner core */}
          <circle
            cx={ORIGIN.x}
            cy={ORIGIN.y}
            r={4}
            fill="rgba(196, 120, 90, 0.55)"
          />
          {/* Bright center */}
          <circle
            cx={ORIGIN.x}
            cy={ORIGIN.y}
            r={1.5}
            fill="rgba(196, 120, 90, 0.9)"
          />
        </svg>

        {/* Rotating badge — sits above rings */}
        <div className="absolute bottom-12 right-12 z-20">
          <RotatingBadge />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span
          className="eyebrow text-charcoal/30 mb-2"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            fontSize: "0.55rem",
            letterSpacing: "0.3em",
          }}
        >
          Scroll
        </span>
        <div className="relative h-12 w-[2px] bg-sand overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-terracotta animate-scroll-pulse" />
        </div>
        <ChevronDown className="w-4 h-4 text-terracotta animate-bounce" />
      </div>
    </section>
  );
}

function RotatingBadge() {
  return (
    <div className="relative w-24 h-24 animate-spin-slow">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <path
            id="circlePath"
            d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
          />
        </defs>
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="rgba(196, 120, 90, 0.25)"
        />
        <text
          fill="#C4785A"
          className="font-body"
          style={{ fontSize: "7px", letterSpacing: "0.1em" }}
        >
          <textPath href="#circlePath" startOffset="0%">
            DISCREET · DELIVERY · ALWAYS ·
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-terracotta opacity-40" />
      </div>
    </div>
  );
}
