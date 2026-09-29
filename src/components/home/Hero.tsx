"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const HERO_SLIDES = [
  {
    id: "form-and-texture",
    src: "/images/hero/hero-1.webp",
    alt: "Warm golden light draped over silk and skin contour",
    tag: "01 · Form & Texture",
    caption: "The tactile poetry of silk & skin",
  },
  {
    id: "personal-ritual",
    src: "/images/hero/hero-2.webp",
    alt: "Woman resting in morning warmth with botanical elixir",
    tag: "02 · Personal Ritual",
    caption: "Unhurried mornings of quiet self-care",
  },
  {
    id: "intimate-connection",
    src: "/images/hero/hero-3.webp",
    alt: "Two hands meeting through a translucent veil",
    tag: "03 · Shared Connection",
    caption: "The quiet electricity of touch",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused, currentSlide]);

  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row">
      {/* ── LEFT CONTENT ── */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-16 lg:py-24 relative z-10 bg-warm-white">
        <span className="eyebrow mb-6 animate-word-in" style={{ animationDelay: "0ms" }}>
          Intimacy &amp; Wellness
        </span>

        <h1
          className="font-display font-light leading-[0.95] mb-6"
          style={{ fontSize: "clamp(3rem, 5vw, 5.5rem)" }}
        >
          <span className="inline-block animate-word-in" style={{ animationDelay: "80ms" }}>
            Where{" "}
          </span>
          <span
            className="italic text-terracotta inline-block animate-word-in animate-warmth-pulse"
            style={{ animationDelay: "180ms" }}
          >
            warmth
          </span>
          <br />
          <span className="inline-block animate-word-in" style={{ animationDelay: "280ms" }}>
            lives in every touch.
          </span>
        </h1>

        <p
          className="font-body font-light text-lg text-warm-gray max-w-md mb-10 leading-relaxed animate-word-in"
          style={{ animationDelay: "420ms" }}
        >
          An elevated destination for intimacy, wellness, and pleasure. Curated
          with care. Delivered discreetly.
        </p>

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

      {/* ── RIGHT VISUAL PANEL (Photography Carousel) ── */}
      <div
        className="hidden lg:flex flex-1 relative min-h-[680px] xl:min-h-[820px] overflow-hidden bg-sand/30"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Carousel Slides */}
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={idx === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={`object-cover object-center transition-transform duration-[7000ms] ease-out ${isActive ? "scale-105" : "scale-100"
                  }`}
              />
            </div>
          );
        })}

        {/* Ambient Overlays & Edge Fades */}
        {/* Soft edge fade into the left column */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-warm-white via-warm-white/40 to-transparent z-10 pointer-events-none" />
        {/* Top ambient highlight */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-warm-white/50 to-transparent z-10 pointer-events-none" />
        {/* Bottom subtle shadow for badge & controls readability */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-charcoal/50 via-charcoal/20 to-transparent z-10 pointer-events-none" />

        {/* Top-Right Pillar Tag */}
        <div className="absolute top-8 right-8 z-20 backdrop-blur-md bg-warm-white/80 border border-warm-white/60 px-4 py-2 shadow-sm transition-all duration-500">
          <p className="font-body text-[11px] tracking-[0.25em] text-charcoal uppercase font-medium">
            {HERO_SLIDES[currentSlide].tag}
          </p>
        </div>

        {/* Bottom-Left Slide Controls & Caption */}
        <div className="absolute bottom-10 left-10 z-20 flex flex-col gap-3">
          {/* <p className="font-display italic text-cream/90 text-sm tracking-wide drop-shadow-sm transition-opacity duration-500">
            {HERO_SLIDES[currentSlide].caption}
          </p> */}
          <div className="flex items-center gap-3">
            {HERO_SLIDES.map((slide, idx) => {
              const isActive = idx === currentSlide;
              return (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(idx)}
                  className="group flex flex-col gap-1.5 text-left focus:outline-none"
                  aria-label={`Switch to slide ${idx + 1}`}
                >
                  <div className="h-1 w-14 bg-cream/30 overflow-hidden rounded-full backdrop-blur-sm transition-all group-hover:bg-cream/50">
                    <div
                      className={`h-full bg-terracotta transition-all ${isActive ? "w-full" : "w-0"
                        }`}
                      style={{
                        transitionDuration: isActive && !isPaused ? "6500ms" : "300ms",
                        transitionTimingFunction: isActive && !isPaused ? "linear" : "ease",
                      }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-body tracking-wider transition-colors ${isActive
                        ? "text-cream font-medium"
                        : "text-cream/60 group-hover:text-cream"
                      }`}
                  >
                    0{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom-Right Rotating Luxury Badge */}
        <div className="absolute bottom-10 right-10 z-20 backdrop-blur-md bg-warm-white/50 border border-warm-white/60 rounded-full p-2.5 shadow-sm transition-transform duration-300 hover:scale-105">
          <RotatingBadge />
        </div>
      </div>

      {/* ── SCROLL INDICATOR ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
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
          stroke="rgba(196, 120, 90, 0.35)"
          strokeWidth={0.5}
        />
        <text
          fill="#C4785A"
          fontFamily="var(--font-dm-sans), sans-serif"
          style={{ fontSize: "7px", letterSpacing: "0.1em" }}
        >
          <textPath href="#circlePath" startOffset="0%">
            DISCREET · DELIVERY · ALWAYS ·
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-terracotta opacity-60" />
      </div>
    </div>
  );
}
