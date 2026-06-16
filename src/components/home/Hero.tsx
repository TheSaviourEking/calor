"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// SVG VIEWPORT & HEAT SOURCE ORIGIN
// ─────────────────────────────────────────────────────────────
const W = 800;
const H = 900;
const OX = 310; // origin X — 38.75% of width
const OY = 470; // origin Y — 52.2% of height

// ─────────────────────────────────────────────────────────────
// ARC PATH HELPER
// Returns SVG path `d` attribute for a clockwise arc
// ─────────────────────────────────────────────────────────────
function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  spanDeg: number // arc span in degrees (360 - gap)
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const endDeg = startDeg + spanDeg;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const largeArc = spanDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`;
}

// ─────────────────────────────────────────────────────────────
// RING CONFIGURATION
// gapStart: angle where gap begins (degrees)
// gapSize: size of gap (degrees)
// arc span = 360 - gapSize
// ─────────────────────────────────────────────────────────────
const rings = [
  // idx 0 — innermost, nearly complete arc
  { r: 45,  cxOff: 0,  cyOff: 0,  opacity: 0.30, sw: 0.8, gapStart: 340, gapSize: 20,  parallax: -0.35, fill: "rgba(196,120,90,0.06)" },
  // idx 1
  { r: 90,  cxOff: 2,  cyOff: -2, opacity: 0.22, sw: 0.7, gapStart: 95,  gapSize: 45,  parallax: -0.25, fill: "none" },
  // idx 2 — animated stroke travel (special case — rendered as <circle> with dasharray)
  { r: 150, cxOff: 3,  cyOff: -4, opacity: 0.17, sw: 0.6, gapStart: 200, gapSize: 50,  parallax: -0.30, fill: "none" },
  // idx 3
  { r: 220, cxOff: 2,  cyOff: -3, opacity: 0.12, sw: 0.5, gapStart: 45,  gapSize: 50,  parallax: -0.25, fill: "none" },
  // idx 4
  { r: 310, cxOff: 4,  cyOff: -5, opacity: 0.08, sw: 0.4, gapStart: 285, gapSize: 55,  parallax: -0.18, fill: "none" },
  // idx 5
  { r: 420, cxOff: 5,  cyOff: -6, opacity: 0.05, sw: 0.3, gapStart: 160, gapSize: 55,  parallax: -0.12, fill: "none" },
  // idx 6 — outermost
  { r: 550, cxOff: 3,  cyOff: -4, opacity: 0.03, sw: 0.2, gapStart: 320, gapSize: 60,  parallax: -0.08, fill: "none" },
];

// 4 radial spokes: 45°, 135°, 225°, 315°
const SPOKES = [45, 135, 225, 315];
const SPOKE_INNER = 15;
const SPOKE_OUTER = 580;

function spokeCoords(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: OX + r * Math.cos(rad), y: OY + r * Math.sin(rad) };
}

// Ember positions: start and end of each arc gap (gap endpoints)
function emberPositions() {
  const embers: { x: number; y: number; opacity: number }[] = [];
  rings.forEach((ring) => {
    const cx = OX + ring.cxOff;
    const cy = OY + ring.cyOff;
    const rad = (d: number) => (d * Math.PI) / 180;
    // Gap start point
    const gs = { x: cx + ring.r * Math.cos(rad(ring.gapStart)), y: cy + ring.r * Math.sin(rad(ring.gapStart)) };
    // Gap end point
    const ge = { x: cx + ring.r * Math.cos(rad(ring.gapStart + ring.gapSize)), y: cy + ring.r * Math.sin(rad(ring.gapStart + ring.gapSize)) };
    // Mid-arc point (180° opposite gap midpoint)
    const midArcAngle = ring.gapStart + ring.gapSize / 2 + 180;
    const ma = { x: cx + ring.r * Math.cos(rad(midArcAngle)), y: cy + ring.r * Math.sin(rad(midArcAngle)) };
    embers.push({ ...gs, opacity: 0.28 });
    embers.push({ ...ge, opacity: 0.22 });
    if (ring.r > 100) embers.push({ ...ma, opacity: 0.14 });
  });
  return embers;
}

// Animated ring (idx 2): circumference for dasharray
const RING2 = rings[2];
const RING2_CIRC = 2 * Math.PI * RING2.r; // full circle circumference ≈ 942.5
const RING2_ARC = RING2_CIRC * ((360 - RING2.gapSize) / 360); // arc length ≈ 811.5
const RING2_CX = OX + RING2.cxOff;
const RING2_CY = OY + RING2.cyOff;

export default function Hero() {
  const ringRefs = useRef<(SVGPathElement | null)[]>([]);
  const ring2Ref = useRef<SVGCircleElement | null>(null);
  const embers = emberPositions();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Differential parallax on all arc paths
      ringRefs.current.forEach((el, i) => {
        if (el) {
          el.style.transform = `translateY(${scrollY * rings[i].parallax}px)`;
          el.style.transformOrigin = `${OX + rings[i].cxOff}px ${OY + rings[i].cyOff}px`;
        }
      });
      // Animated ring parallax
      if (ring2Ref.current) {
        ring2Ref.current.style.transform = `translateY(${scrollY * RING2.parallax}px)`;
        ring2Ref.current.style.transformOrigin = `${RING2_CX}px ${RING2_CY}px`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row">
      {/* ── LEFT CONTENT ── */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-16 lg:py-24 relative z-10">
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

      {/* ── RIGHT VISUAL PANEL ── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden grain-overlay"
        style={{
          // Elliptical radial gradient — deeper blush at heat source, cools outward
          background:
            "radial-gradient(ellipse at 38.75% 52.2%, #E8C9BB 0%, #F0E0D6 18%, #F4EDE7 36%, #F7F2EC 58%, #EAE0D5 100%)",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full"
          overflow="visible"
          aria-hidden="true"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <style>{`
              @keyframes ringBreathe {
                0%, 100% { transform: scale(1.0); opacity: 1; }
                50%       { transform: scale(1.04); opacity: 0.75; }
              }
              @keyframes strokeTravel {
                from { stroke-dashoffset: 0; }
                to   { stroke-dashoffset: ${-RING2_ARC.toFixed(2)}; }
              }
              .ring-breathe-0 {
                transform-origin: ${OX + rings[0].cxOff}px ${OY + rings[0].cyOff}px;
                animation: ringBreathe 4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
              }
              .ring-breathe-1 {
                transform-origin: ${OX + rings[1].cxOff}px ${OY + rings[1].cyOff}px;
                animation: ringBreathe 4s cubic-bezier(0.45, 0, 0.55, 1) -1.5s infinite;
              }
              .ring-travel {
                stroke-dasharray: ${RING2_ARC.toFixed(2)} ${RING2_CIRC.toFixed(2)};
                animation: strokeTravel 8s linear infinite;
              }
            `}</style>
          </defs>

          {/* ── RADIAL SPOKES (4, ultra-fine) ── */}
          {SPOKES.map((angle) => {
            const inner = spokeCoords(angle, SPOKE_INNER);
            const outer = spokeCoords(angle, SPOKE_OUTER);
            return (
              <line
                key={angle}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="rgb(196,120,90)"
                strokeWidth={0.5}
                strokeOpacity={0.03}
              />
            );
          })}

          {/* ── ARC RINGS — outermost first, innermost last ── */}
          {[...rings].reverse().map((ring, reversedIdx) => {
            const originalIdx = rings.length - 1 - reversedIdx;
            const cx = OX + ring.cxOff;
            const cy = OY + ring.cyOff;

            // idx 2 is the animated ring — rendered separately below
            if (originalIdx === 2) return null;

            const breatheClass =
              originalIdx === 0 ? "ring-breathe-0" :
              originalIdx === 1 ? "ring-breathe-1" :
              "";

            return (
              <path
                key={originalIdx}
                ref={(el) => { ringRefs.current[originalIdx] = el; }}
                d={arcPath(cx, cy, ring.r, ring.gapStart, 360 - ring.gapSize)}
                fill={ring.fill}
                stroke="rgb(196,120,90)"
                strokeWidth={ring.sw}
                strokeOpacity={ring.opacity}
                strokeLinecap="round"
                className={breatheClass}
                style={{ willChange: "transform" }}
              />
            );
          })}

          {/* ── ANIMATED RING (idx 2, r=150) — stroke travels around arc ── */}
          <circle
            ref={ring2Ref}
            cx={RING2_CX}
            cy={RING2_CY}
            r={RING2.r}
            fill="none"
            stroke="rgb(196,120,90)"
            strokeWidth={RING2.sw}
            strokeOpacity={RING2.opacity}
            strokeLinecap="round"
            className="ring-travel"
            style={{ willChange: "transform" }}
          />

          {/* ── FLOATING EMBERS — at arc gap endpoints ── */}
          {embers.map((e, i) => (
            <circle
              key={i}
              cx={e.x}
              cy={e.y}
              r={1.5}
              fill={`rgba(196,120,90,${e.opacity})`}
            />
          ))}

          {/* ── HEAT SOURCE — three-layer center ── */}
          {/* Outermost halo */}
          <circle cx={OX} cy={OY} r={14} fill="rgba(196,120,90,0.06)" />
          {/* Mid glow */}
          <circle
            cx={OX}
            cy={OY}
            r={8}
            fill="rgba(196,120,90,0.16)"
            style={{
              transformOrigin: `${OX}px ${OY}px`,
              animation: "ringBreathe 4s cubic-bezier(0.45, 0, 0.55, 1) -0.8s infinite",
            }}
          />
          {/* Inner core */}
          <circle cx={OX} cy={OY} r={3.5} fill="rgba(196,120,90,0.50)" />
          {/* Bright center */}
          <circle cx={OX} cy={OY} r={1.2} fill="rgba(196,120,90,0.92)" />

          {/* ── ARCHITECTURAL LABEL ── */}
          <text
            x={32}
            y={H - 32}
            fill="rgb(196,120,90)"
            fillOpacity={0.15}
            fontSize={8}
            letterSpacing="0.15em"
            fontFamily="var(--font-dm-sans), sans-serif"
          >
            {(OX / W * 100).toFixed(2)} · {(OY / H * 100).toFixed(2)} · 0.01K
          </text>
        </svg>

        {/* ── ROTATING BADGE ── */}
        <div className="absolute bottom-12 right-12 z-20">
          <RotatingBadge />
        </div>
      </div>

      {/* ── SCROLL INDICATOR ── */}
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
        <div className="w-2 h-2 bg-terracotta opacity-40" />
      </div>
    </div>
  );
}
