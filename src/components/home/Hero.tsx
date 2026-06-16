"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  const decorRef = useRef<HTMLSpanElement>(null);

  // Parallax for decorative "C"
  useEffect(() => {
    const handleScroll = () => {
      if (decorRef.current) {
        const y = window.scrollY * 0.3;
        decorRef.current.style.transform = `translateY(${y}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            Where
          </span> {" "}
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

      {/* Right Visual Panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden grain-overlay" style={{
        background: "linear-gradient(135deg, #F7F2EC, #E8DDD0, #F0E0D6, #F7F2EC, #E8DDD0)"
      }}>
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background:
              "linear-gradient(135deg, #F7F2EC 0%, #E8DDD0 30%, #F0E0D6 60%, #F7F2EC 80%, #E8DDD0 100%)",
          }}
        />

        {/* Decorative oversized initial letter — parallax */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            ref={decorRef}
            className="font-display font-light select-none will-change-transform"
            style={{
              fontSize: "14rem",
              color: "rgba(196, 120, 90, 0.12)",
              lineHeight: 1,
              transition: "transform 0.1s linear",
            }}
          >
            C
          </span>
        </div>

        {/* Rotating badge */}
        <div className="absolute bottom-12 right-12">
          <RotatingBadge />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        {/* "Scroll" label rotated */}
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
          stroke="rgba(196, 120, 90, 0.2)"
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
      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-terracotta opacity-30" />
      </div>
    </div>
  );
}
