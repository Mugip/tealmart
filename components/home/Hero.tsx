'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { TouchEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, ShieldCheck, Star, ChevronLeft, ChevronRight,
  Truck, RotateCcw, Zap, ShoppingCart, Clock, TrendingUp,
  BadgeCheck, Flame, Package, Tag, Gift, Percent,
} from 'lucide-react'
import { useCurrency } from '@/lib/contexts/CurrencyContext'

interface HeroProps {
  stats: {
    totalProducts: number
    totalCategories: number
    avgRating: number
  }
  products: any[]
}

/* ─────────────────────────────────────────
   Countdown hook
───────────────────────────────────────── */
function useCountdown(hours = 5, minutes = 47, seconds = 33) {
  const endRef = useRef<number>(
    Date.now() + (hours * 3600 + minutes * 60 + seconds) * 1000
  )
  const [timeLeft, setTimeLeft] = useState({ h: hours, m: minutes, s: seconds })
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, endRef.current - Date.now())
      setTimeLeft({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return timeLeft
}

/* ─────────────────────────────────────────
   Time digit cell
───────────────────────────────────────── */
function TimeCell({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, '0')
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-0.5">
        {str.split('').map((d, i) => (
          <span
            key={i}
            className="inline-flex items-center justify-center w-7 h-8 rounded text-white font-black text-base"
            style={{
              background: '#0f1923',
              border: '1px solid rgba(255,255,255,0.1)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {d}
          </span>
        ))}
      </div>
      <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 font-semibold">
        {label}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────
   Stars
───────────────────────────────────────── */
function Stars({ rating = 4.5, count = 0 }: { rating?: number; count?: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-px">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={12}
            className={
              n <= full
                ? 'fill-amber-400 text-amber-400'
                : n === full + 1 && half
                ? 'fill-amber-400/50 text-amber-400'
                : 'text-gray-600'
            }
          />
        ))}
      </div>
      <span className="text-gray-400 text-xs">
        <span className="text-amber-400 font-bold">{rating.toFixed(1)}</span>
        {count > 0 && <span className="ml-1">({count.toLocaleString()})</span>}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────
   Savings badge
───────────────────────────────────────── */
function Savings({ price, compareAtPrice }: { price: number; compareAtPrice?: number }) {
  if (!compareAtPrice || compareAtPrice <= price) return null
  const pct = Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black bg-red-500/15 text-red-400 border border-red-500/20">
      <Flame size={10} />{pct}% OFF
    </span>
  )
}

/* ─────────────────────────────────────────
   Flash deal sidebar card
───────────────────────────────────────── */
function FlashCard({
  product, formatPrice, onClick, active,
}: {
  product: any; formatPrice: (n: number) => string; onClick: () => void; active: boolean
}) {
  const pct = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all w-full"
      style={{
        background: active ? 'rgba(20,184,166,0.08)' : 'rgba(255,255,255,0.02)',
        border: active ? '1px solid rgba(20,184,166,0.3)' : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-800/60">
        <Image
          src={product.images?.[0]} alt={product.title} fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {pct && (
          <div className="absolute top-0 left-0 bg-red-500 text-white text-[9px] font-black px-1 rounded-br">
            -{pct}%
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-300 text-[11px] font-semibold leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {product.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-teal-400 font-black text-xs">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-gray-600 line-through text-[10px]">{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>
      </div>
      {active && <div className="w-0.5 h-7 rounded-full bg-teal-500 flex-shrink-0" />}
    </button>
  )
}

/* ═══════════════════════════════════════════
   MARQUEE BANNER  — infinite Times Square scroll
═══════════════════════════════════════════ */
function MarqueeBanner({
  stats, countdown,
}: {
  stats: HeroProps['stats']
  countdown: { h: number; m: number; s: number }
}) {
  const timeStr = `${String(countdown.h).padStart(2, '0')}:${String(countdown.m).padStart(2, '0')}:${String(countdown.s).padStart(2, '0')}`

  /* Build a rich set of items — duplicate for seamless loop */
  const items = [
    { icon: <Flame size={12} className="text-red-400" />, text: 'FLASH DEALS', accent: true },
    { icon: <Clock size={11} className="text-red-400" />, text: `Ends in ${timeStr}`, accent: true },
    { icon: <TrendingUp size={11} className="text-teal-500" />, text: `${stats.totalProducts.toLocaleString()}+ Products` },
    { icon: <Tag size={11} className="text-teal-500" />, text: `${stats.totalCategories}+ Categories` },
    { icon: <BadgeCheck size={11} className="text-teal-500" />, text: 'Verified Quality' },
    { icon: <Truck size={11} className="text-teal-500" />, text: 'Free Shipping over $29' },
    { icon: <ShieldCheck size={11} className="text-teal-500" />, text: 'Buyer Protection' },
    { icon: <Gift size={11} className="text-amber-400" />, text: 'New Arrivals Daily' },
    { icon: <Percent size={11} className="text-amber-400" />, text: 'Up to 60% Off Today' },
    { icon: <RotateCcw size={11} className="text-teal-500" />, text: '30-Day Easy Returns' },
    { icon: <Star size={11} className="text-amber-400 fill-amber-400" />, text: `${stats.avgRating?.toFixed(1) ?? '4.5'}★ Average Rating` },
    { icon: <Zap size={11} className="text-yellow-400" />, text: 'Lightning Fast Delivery' },
  ]

  // Separator dot between items
  const Sep = () => (
    <span className="mx-4 text-gray-700 select-none">◆</span>
  )

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: '#0d1520',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        height: 34,
      }}
    >
      {/* Left fade mask */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, #0d1520 0%, transparent 100%)' }}
      />
      {/* Right fade mask */}
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(270deg, #0d1520 0%, transparent 100%)' }}
      />

      {/* Scrolling track — two identical sets side by side for perfect loop */}
      <div className="marquee-track flex items-center h-full whitespace-nowrap">
        {[0, 1].map((copy) => (
          <span key={copy} className="inline-flex items-center shrink-0">
            {items.map((item, i) => (
              <span key={i} className="inline-flex items-center">
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold"
                  style={{ color: item.accent ? '#f87171' : '#6b7280' }}
                >
                  {item.icon}
                  <span style={{ color: item.accent ? '#fca5a5' : '#9ca3af' }}>
                    {item.text}
                  </span>
                </span>
                <Sep />
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN HERO
═══════════════════════════════════════════ */
export default function Hero({ stats, products }: HeroProps) {
  const { formatPrice } = useCurrency()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const progressStart = useRef(Date.now())
  const countdown = useCountdown(5, 47, 33)
  const DURATION = 7000

  const displayItems = products?.slice(0, 5) ?? []
  const current = displayItems[currentIndex]

  const goTo = useCallback((idx: number) => {
    setCurrentIndex(idx)
    setProgress(0)
    setImgLoaded(false)
    progressStart.current = Date.now()
  }, [])

  const next = useCallback(
    () => goTo(currentIndex === displayItems.length - 1 ? 0 : currentIndex + 1),
    [currentIndex, displayItems.length, goTo]
  )
  const prev = useCallback(
    () => goTo(currentIndex === 0 ? displayItems.length - 1 : currentIndex - 1),
    [currentIndex, displayItems.length, goTo]
  )

  useEffect(() => {
    if (isHovered || displayItems.length <= 1) return
    progressStart.current = Date.now()
    const id = setInterval(() => {
      const pct = Math.min(((Date.now() - progressStart.current) / DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) next()
    }, 40)
    return () => clearInterval(id)
  }, [isHovered, next, displayItems.length, currentIndex])

  const onTouchStart = (e: TouchEvent) => setTouchStart(e.targetTouches[0].clientX)
  const onTouchMove = (e: TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    if (touchStart - touchEnd > 50) next()
    if (touchStart - touchEnd < -50) prev()
    setTouchStart(null); setTouchEnd(null)
  }

  const viewers = current ? 18 + (current.id?.charCodeAt(0) ?? 4) % 55 : 0
  const bought  = current ? 1200 + (current.id?.charCodeAt(1) ?? 3) % 3000 : 0
  const stock   = current ? 5 + (current.id?.charCodeAt(2) ?? 2) % 18 : 0

  if (!displayItems.length || !current) return null

  return (
    <section
      className="w-full select-none"
      style={{ background: '#0a0f14' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Progress bar ── */}
      <div className="h-[2px] w-full" style={{ background: '#111820' }}>
        <div
          className="h-full bg-teal-500"
          style={{
            width: `${progress}%`,
            transition: isHovered ? 'none' : 'width 0.04s linear',
          }}
        />
      </div>

      {/* ── Times Square marquee banner ── */}
      <MarqueeBanner stats={stats} countdown={countdown} />

      {/* ── Main grid ── */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-3 lg:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px_240px] gap-3 lg:gap-3 items-stretch">

          {/* ══════════════════════════════
              MOBILE: side-by-side card
              (replaces the stacked layout)
          ══════════════════════════════ */}
          <div
            className="lg:hidden rounded-2xl overflow-hidden"
            style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Mobile top: image left + info right */}
            <div className="flex gap-0 min-h-[200px]">
              {/* Image pane — left half */}
              <div
                key={`mob-img-${currentIndex}`}
                className="relative flex-shrink-0 img-fade-in"
                style={{ width: '42%' }}
              >
                <Image
                  src={current.images?.[0]}
                  alt={current.title}
                  fill
                  priority
                  className="object-cover"
                />
                {/* subtle teal gradient overlay on right edge to blend into info */}
                <div
                  className="absolute inset-y-0 right-0 w-8 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, transparent, #0d1520)' }}
                />
                {/* Discount badge pinned top-left */}
                {current.compareAtPrice && current.compareAtPrice > current.price && (
                  <div className="absolute top-2 left-2">
                    <Savings price={current.price} compareAtPrice={current.compareAtPrice} />
                  </div>
                )}
              </div>

              {/* Info pane — right side */}
              <div className="flex-1 flex flex-col justify-between p-3 min-w-0">
                <div className="space-y-1.5">
                  {/* Badge */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Zap size={9} />
                    {(current.reviewCount ?? 0) > 100 ? "Best Deal" : 'Featured'}
                  </span>

                  {/* Title */}
                  <div key={`mob-t-${currentIndex}`} className="hero-slide-in">
                    <h1
                      className="text-sm font-black text-white leading-snug"
                      style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                    >
                      {current.title.length > 45
                        ? current.title.slice(0, 45) + '…'
                        : current.title}
                    </h1>
                  </div>

                  <Stars rating={current.avgRating ?? 4.5} count={current.reviewCount ?? 0} />

                  {/* Price */}
                  <div>
                    <div className="text-xl font-black text-white leading-none">
                      {formatPrice(current.price)}
                    </div>
                    {current.compareAtPrice && current.compareAtPrice > current.price && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-gray-500 line-through text-xs">
                          {formatPrice(current.compareAtPrice)}
                        </span>
                        <span className="text-green-400 text-[10px] font-bold">
                          Save {formatPrice(current.compareAtPrice - current.price)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Urgency */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1 text-[10px] text-orange-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
                      {viewers} viewing
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-red-400 font-semibold">
                      <Package size={10} /> {stock} left
                    </span>
                  </div>
                </div>

                {/* Mobile CTAs */}
                <div className="flex gap-2 mt-2">
                  <Link
                    href={`/products/${current.id}`}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl font-black text-xs text-gray-950 bg-teal-500 hover:bg-teal-400 transition-all"
                  >
                    Buy Now <ArrowRight size={12} />
                  </Link>
                  <button
                    onClick={() => {
                      setAddedToCart(true)
                      setTimeout(() => setAddedToCart(false), 2000)
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-xs transition-all"
                    style={{
                      background: addedToCart ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.05)',
                      border: addedToCart ? '1px solid rgba(20,184,166,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      color: addedToCart ? '#2dd4bf' : 'white',
                    }}
                  >
                    <ShoppingCart size={12} />
                    {addedToCart ? 'Added ✓' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile bottom: countdown + dots */}
            <div
              className="flex items-center justify-between px-3 py-2.5 gap-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              {/* Mini countdown */}
              <div className="flex items-center gap-2">
                <Clock size={11} className="text-red-400 flex-shrink-0" />
                <span className="text-[10px] text-gray-500">Ends</span>
                <span className="text-red-400 font-black text-xs tabular-nums">
                  {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
                </span>
              </div>
              {/* Bought */}
              <span className="text-[10px] text-gray-500">
                <span className="text-teal-400 font-bold">{bought.toLocaleString()}</span> bought this week
              </span>
              {/* Dots + arrows */}
              <div className="flex items-center gap-1.5">
                {displayItems.map((_, i) => (
                  <button
                    key={i} onClick={() => goTo(i)}
                    className="rounded-full transition-all"
                    style={{
                      height: 5, width: i === currentIndex ? 20 : 5,
                      background: i === currentIndex ? '#14b8a6' : 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
                <button onClick={prev} className="p-1 rounded text-gray-500 hover:text-white" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <ChevronLeft size={13} />
                </button>
                <button onClick={next} className="p-1 rounded text-gray-500 hover:text-white" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Mobile: trust badges row */}
            <div
              className="grid grid-cols-3 gap-px"
              style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              {[
                { icon: <Truck size={11} />, label: 'Free Ship' },
                { icon: <RotateCcw size={11} />, label: '30-day Return' },
                { icon: <ShieldCheck size={11} />, label: 'Secure Pay' },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold text-gray-500"
                  style={{ background: '#0d1520' }}
                >
                  <span className="text-teal-500">{icon}</span>
                  {label}
                </div>
              ))}
            </div>

            {/* Mobile: thumbnail strip */}
            <div className="flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto scrollbar-none"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {displayItems.map((product, idx) => (
                <button
                  key={product.id} onClick={() => goTo(idx)}
                  className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
                  style={{
                    width: 52, height: 52,
                    border: idx === currentIndex ? '2px solid #14b8a6' : '2px solid rgba(255,255,255,0.06)',
                    opacity: idx === currentIndex ? 1 : 0.45,
                  }}
                >
                  <div className="relative w-full h-full">
                    <Image src={product.images?.[0]} alt={product.title} fill className="object-cover" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════
              DESKTOP COL 1: Deal info panel
          ══════════════════════════════ */}
          <div
            className="hidden lg:flex rounded-2xl p-6 xl:p-7 flex-col gap-4 relative overflow-hidden"
            style={{
              background: '#0d1520',
              border: '1px solid rgba(255,255,255,0.055)',
              minHeight: 540,
            }}
          >
            <div
              className="absolute top-0 left-0 w-80 h-80 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 0% 0%, rgba(20,184,166,0.06) 0%, transparent 65%)' }}
            />

            <div className="relative z-10 space-y-3.5 flex-1">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Zap size={10} />
                  {(current.reviewCount ?? 0) > 100 ? "Today's Best Deal" : 'Featured Pick'}
                </span>
                <Savings price={current.price} compareAtPrice={current.compareAtPrice} />
              </div>

              {/* Title */}
              <div key={`dt-${currentIndex}`} className="hero-slide-in">
                <h1
                  className="text-2xl xl:text-3xl 2xl:text-4xl font-black text-white leading-tight tracking-tight"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                  {current.title.length > 65 ? current.title.slice(0, 65) + '…' : current.title}
                </h1>
              </div>

              {/* Stars + social */}
              <div className="flex flex-wrap items-center gap-3">
                <Stars rating={current.avgRating ?? 4.5} count={current.reviewCount ?? 0} />
                <span className="text-gray-700 text-xs">·</span>
                <span className="text-xs text-gray-400">
                  <span className="text-teal-400 font-bold">{bought.toLocaleString()}</span> bought this week
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl xl:text-5xl font-black text-white tracking-tight">
                  {formatPrice(current.price)}
                </span>
                {current.compareAtPrice && current.compareAtPrice > current.price && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 line-through text-lg font-semibold">
                      {formatPrice(current.compareAtPrice)}
                    </span>
                    <span className="text-green-400 text-xs font-bold">
                      You save {formatPrice(current.compareAtPrice - current.price)}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 max-w-lg">
                {current.description?.replace(/<[^>]*>?/gm, '') ?? ''}
              </p>

              {/* Urgency */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-orange-400 font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  {viewers} people viewing now
                </div>
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                  <Package size={12} /> Only {stock} left
                </div>
              </div>

              {/* Countdown */}
              <div
                className="inline-flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                  <Clock size={12} className="text-red-400" />
                  Deal ends in
                </div>
                <div className="flex items-center gap-1">
                  <TimeCell value={countdown.h} label="hrs" />
                  <span className="text-gray-600 font-black text-lg pb-4">:</span>
                  <TimeCell value={countdown.m} label="min" />
                  <span className="text-gray-600 font-black text-lg pb-4">:</span>
                  <TimeCell value={countdown.s} label="sec" />
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-2.5">
              <Link
                href={`/products/${current.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm text-gray-950 bg-teal-500 hover:bg-teal-400 transition-all hover:-translate-y-0.5 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/35"
              >
                Buy Now <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => {
                  setAddedToCart(true)
                  setTimeout(() => setAddedToCart(false), 2000)
                  // addToCart({ productId: current.id, quantity: 1 })
                }}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                style={{
                  background: addedToCart ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.05)',
                  border: addedToCart ? '1px solid rgba(20,184,166,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: addedToCart ? '#2dd4bf' : 'white',
                }}
              >
                <ShoppingCart size={16} />
                {addedToCart ? 'Added to cart ✓' : 'Add to Cart'}
              </button>
            </div>

            {/* Trust micro-badges */}
            <div className="relative z-10 grid grid-cols-3 gap-2">
              {[
                { icon: <Truck size={12} />, line1: 'Free Shipping', line2: 'Over $29' },
                { icon: <RotateCcw size={12} />, line1: 'Easy Returns', line2: '30-day policy' },
                { icon: <ShieldCheck size={12} />, line1: 'Secure Pay', line2: '256-bit SSL' },
              ].map(({ icon, line1, line2 }) => (
                <div
                  key={line1}
                  className="flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-xl text-center"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span className="text-teal-500">{icon}</span>
                  <span className="text-white text-[11px] font-bold leading-tight">{line1}</span>
                  <span className="text-gray-600 text-[10px]">{line2}</span>
                </div>
              ))}
            </div>

            {/* Dots + arrows */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {displayItems.map((_, i) => (
                  <button
                    key={i} onClick={() => goTo(i)}
                    className="rounded-full transition-all duration-400"
                    style={{
                      height: 5, width: i === currentIndex ? 26 : 5,
                      background: i === currentIndex ? '#14b8a6' : 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={prev}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                ><ChevronLeft size={14} /></button>
                <button
                  onClick={next}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                ><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════
              DESKTOP COL 2: Product image — full bleed, no white box
          ══════════════════════════════ */}
          <div
            className="hidden lg:block rounded-2xl overflow-hidden relative"
            style={{
              background: '#0d1520',
              border: '1px solid rgba(255,255,255,0.055)',
              minHeight: 540,
            }}
          >
            {/* Teal ambient glow behind product */}
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                background: 'radial-gradient(ellipse at 50% 55%, rgba(20,184,166,0.08) 0%, transparent 68%)',
              }}
            />

            {/* Category chip */}
            <div className="absolute top-4 left-4 z-20">
              <span
                className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-2 py-1 rounded-md"
                style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
              >
                {current.category ?? 'Product'}
              </span>
            </div>

            {/* The image — object-cover so it fills edge-to-edge on shorter products,
                but falls back to object-contain with generous padding for tall products */}
            <div
              key={`dimg-${currentIndex}`}
              className="absolute inset-0 img-fade-in z-10"
            >
              <Image
                src={current.images?.[0]}
                alt={current.title}
                fill
                priority
                className="object-contain"
                style={{
                  padding: '2rem',
                  transform: imgLoaded ? 'scale(1)' : 'scale(0.94)',
                  transition: 'transform 0.7s cubic-bezier(0.22,1,0.36,1)',
                }}
                onLoad={() => setImgLoaded(true)}
              />
            </div>

            {/* Bottom gradient so photo count badge is readable */}
            <div
              className="absolute bottom-0 left-0 right-0 h-16 z-20 pointer-events-none"
              style={{ background: 'linear-gradient(0deg, rgba(13,21,32,0.7) 0%, transparent 100%)' }}
            />

            {/* Photo count */}
            {current.images?.length > 1 && (
              <div
                className="absolute bottom-3 right-3 z-30 text-[11px] text-gray-400 font-semibold px-2 py-1 rounded-md"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
              >
                1 / {current.images.length} photos
              </div>
            )}
          </div>

          {/* ══════════════════════════════
              DESKTOP COL 3: Flash deals sidebar
          ══════════════════════════════ */}
          <div
            className="hidden lg:flex flex-col gap-2.5 rounded-2xl p-2.5"
            style={{
              background: '#0d1520',
              border: '1px solid rgba(255,255,255,0.055)',
            }}
          >
            <div className="flex items-center justify-between px-1 pt-0.5">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-red-400">
                <Flame size={12} className="animate-pulse" />
                Flash Deals
              </div>
              <Link href="/products" className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold transition-colors">
                See all →
              </Link>
            </div>

            <div
              className="flex items-center justify-center gap-2 py-2 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
            >
              <Clock size={10} className="text-red-400" />
              <span className="text-red-400 font-black text-xs tabular-nums">
                {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
              </span>
              <span className="text-gray-600 text-[10px]">remaining</span>
            </div>

            <div className="flex flex-col gap-1">
              {displayItems.map((product, idx) => (
                <FlashCard
                  key={product.id}
                  product={product}
                  formatPrice={formatPrice}
                  onClick={() => goTo(idx)}
                  active={idx === currentIndex}
                />
              ))}
            </div>

            <Link
              href="/products"
              className="mt-auto flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-teal-400 text-xs font-bold hover:text-teal-300 transition-colors"
              style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.12)' }}
            >
              All {stats.totalProducts.toLocaleString()}+ products
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom trust bar (desktop) ── */}
      <div
        className="px-4 py-3 hidden md:block"
        style={{ background: '#080d13', borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between flex-wrap gap-3">
          {[
            { icon: <Truck size={13} className="text-teal-500" />, text: 'Free shipping over $29' },
            { icon: <RotateCcw size={13} className="text-teal-500" />, text: '30-day hassle-free returns' },
            { icon: <ShieldCheck size={13} className="text-teal-500" />, text: 'Buyer protection on every order' },
            { icon: <BadgeCheck size={13} className="text-teal-500" />, text: 'Verified quality products' },
            { icon: <Star size={13} className="text-amber-400 fill-amber-400" />, text: `${stats.avgRating?.toFixed(1) ?? '4.5'}★ average rating` },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-gray-500">
              {icon}{text}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* ── Marquee ── */
        .marquee-track {
          animation: marquee 28s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ── Slide animations ── */
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes imgFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .hero-slide-in { animation: slideIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .img-fade-in   { animation: imgFadeIn 0.55s ease both; }

        /* ── Scrollbar hide ── */
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  )
}
