'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { TouchEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, ShieldCheck, Star, ChevronLeft, ChevronRight,
  Truck, RotateCcw, Zap, ShoppingCart, Clock, TrendingUp,
  BadgeCheck, Flame, Package
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

/* ─── Countdown timer hook ─── */
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

/* ─── Digit flip cell ─── */
function TimeCell({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, '0')
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-0.5">
        {str.split('').map((d, i) => (
          <span
            key={i}
            className="inline-flex items-center justify-center w-8 h-9 rounded-md text-white font-black text-lg tabular-nums"
            style={{
              background: '#0f1923',
              border: '1px solid rgba(255,255,255,0.08)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {d}
          </span>
        ))}
      </div>
      <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-semibold">
        {label}
      </span>
    </div>
  )
}

/* ─── Star row ─── */
function Stars({ rating = 4.5, count = 0 }: { rating?: number; count?: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-px">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={13}
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
        {count > 0 && (
          <span className="ml-1">({count.toLocaleString()} reviews)</span>
        )}
      </span>
    </div>
  )
}

/* ─── Discount pill ─── */
function Savings({
  price,
  compareAtPrice,
}: {
  price: number
  compareAtPrice?: number
}) {
  if (!compareAtPrice || compareAtPrice <= price) return null
  const pct = Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black bg-red-500/15 text-red-400 border border-red-500/20">
      <Flame size={11} />
      {pct}% OFF
    </span>
  )
}

/* ─── Flash deal mini card ─── */
function FlashCard({
  product,
  formatPrice,
  onClick,
  active,
}: {
  product: any
  formatPrice: (n: number) => string
  onClick: () => void
  active: boolean
}) {
  const pct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100
        )
      : null

  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all w-full"
      style={{
        background: active
          ? 'rgba(20,184,166,0.08)'
          : 'rgba(255,255,255,0.02)',
        border: active
          ? '1px solid rgba(20,184,166,0.3)'
          : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Thumb */}
      <div className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-800">
        <Image
          src={product.images?.[0]}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {pct && (
          <div className="absolute top-0 left-0 bg-red-500 text-white text-[9px] font-black px-1 rounded-br-md">
            -{pct}%
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-gray-300 text-xs font-semibold leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {product.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-teal-400 font-black text-sm">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-gray-600 line-through text-xs">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
      {/* Active bar */}
      {active && (
        <div className="w-1 h-8 rounded-full bg-teal-500 flex-shrink-0" />
      )}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN HERO
══════════════════════════════════════════════════════════ */
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

  const goTo = useCallback(
    (idx: number) => {
      setCurrentIndex(idx)
      setProgress(0)
      setImgLoaded(false)
      progressStart.current = Date.now()
    },
    []
  )

  const next = useCallback(
    () =>
      goTo(
        currentIndex === displayItems.length - 1 ? 0 : currentIndex + 1
      ),
    [currentIndex, displayItems.length, goTo]
  )

  const prev = useCallback(
    () =>
      goTo(
        currentIndex === 0 ? displayItems.length - 1 : currentIndex - 1
      ),
    [currentIndex, displayItems.length, goTo]
  )

  /* Progress ticker */
  useEffect(() => {
    if (isHovered || displayItems.length <= 1) return
    progressStart.current = Date.now()
    const id = setInterval(() => {
      const pct = Math.min(
        ((Date.now() - progressStart.current) / DURATION) * 100,
        100
      )
      setProgress(pct)
      if (pct >= 100) next()
    }, 40)
    return () => clearInterval(id)
  }, [isHovered, next, displayItems.length, currentIndex])

  /* Touch */
  const onTouchStart = (e: TouchEvent) =>
    setTouchStart(e.targetTouches[0].clientX)
  const onTouchMove = (e: TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX)
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    if (touchStart - touchEnd > 50) next()
    if (touchStart - touchEnd < -50) prev()
    setTouchStart(null)
    setTouchEnd(null)
  }

  /* Seeded urgency */
  const viewers = current
    ? 18 + (current.id?.charCodeAt(0) ?? 4) % 55
    : 0
  const bought = current
    ? 1200 + (current.id?.charCodeAt(1) ?? 3) % 3000
    : 0
  const stock = current
    ? 5 + (current.id?.charCodeAt(2) ?? 2) % 18
    : 0

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
      {/* ── Top progress bar ── */}
      <div className="h-[2px] w-full" style={{ background: '#111820' }}>
        <div
          className="h-full bg-teal-500"
          style={{
            width: `${progress}%`,
            transition: isHovered ? 'none' : 'width 0.04s linear',
          }}
        />
      </div>

      {/* ── Flash deals banner ── */}
      <div
        className="flex items-center gap-3 px-4 py-2 text-xs overflow-x-auto scrollbar-none"
        style={{
          background: '#0d1520',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-center gap-1.5 text-red-400 font-black shrink-0">
          <Flame size={13} className="animate-pulse" />
          FLASH DEALS
        </div>
        <div className="w-px h-4 bg-white/10 shrink-0" />
        <div className="flex items-center gap-1.5 text-gray-500 shrink-0">
          <Clock size={12} />
          <span className="text-gray-400">Ends in</span>
          <span className="text-red-400 font-black tabular-nums">
            {String(countdown.h).padStart(2, '0')}:
            {String(countdown.m).padStart(2, '0')}:
            {String(countdown.s).padStart(2, '0')}
          </span>
        </div>
        <div className="w-px h-4 bg-white/10 shrink-0" />
        <div className="flex items-center gap-2 shrink-0 text-gray-500">
          <TrendingUp size={12} className="text-teal-500" />
          <span>{stats.totalProducts.toLocaleString()}+ products</span>
          <span className="text-white/10">·</span>
          <span>{stats.totalCategories}+ categories</span>
          <span className="text-white/10">·</span>
          <BadgeCheck size={12} className="text-teal-500" />
          <span>Verified quality</span>
        </div>
      </div>

      {/* ── Main hero body ── */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px_260px] gap-3 lg:gap-4 items-start">

          {/* ══ COL 1: Deal info panel ══ */}
          <div
            className="rounded-2xl p-5 lg:p-7 flex flex-col gap-5 relative overflow-hidden"
            style={{
              background: '#0d1520',
              border: '1px solid rgba(255,255,255,0.055)',
              minHeight: 520,
            }}
          >
            {/* Corner glow */}
            <div
              className="absolute top-0 left-0 w-72 h-72 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 0% 0%, rgba(20,184,166,0.07) 0%, transparent 65%)',
              }}
            />

            <div className="relative z-10 space-y-4 flex-1">
              {/* Badge row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Zap size={11} />
                  {(current.reviewCount ?? 0) > 100
                    ? "Today's Best Deal"
                    : 'Featured Pick'}
                </span>
                <Savings
                  price={current.price}
                  compareAtPrice={current.compareAtPrice}
                />
              </div>

              {/* Title */}
              <div key={`t-${currentIndex}`} className="hero-slide-in">
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                  {current.title.length > 60
                    ? current.title.slice(0, 60) + '…'
                    : current.title}
                </h1>
              </div>

              {/* Stars + social proof */}
              <div className="flex flex-wrap items-center gap-3">
                <Stars
                  rating={current.avgRating ?? 4.5}
                  count={current.reviewCount ?? 0}
                />
                <span className="text-gray-600 text-xs">·</span>
                <span className="text-xs text-gray-400">
                  <span className="text-teal-400 font-bold">
                    {bought.toLocaleString()}
                  </span>{' '}
                  bought this week
                </span>
              </div>

              {/* Price block */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl lg:text-5xl font-black text-white tracking-tight">
                  {formatPrice(current.price)}
                </span>
                {current.compareAtPrice &&
                  current.compareAtPrice > current.price && (
                    <div className="flex flex-col">
                      <span className="text-gray-500 line-through text-lg font-semibold">
                        {formatPrice(current.compareAtPrice)}
                      </span>
                      <span className="text-green-400 text-xs font-bold">
                        You save{' '}
                        {formatPrice(current.compareAtPrice - current.price)}
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
                  <Package size={12} />
                  Only {stock} left
                </div>
              </div>

              {/* Countdown */}
              <div
                className="inline-flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-widest">
                  <Clock size={13} className="text-red-400" />
                  Deal ends in
                </div>
                <div className="flex items-center gap-1.5">
                  <TimeCell value={countdown.h} label="hrs" />
                  <span className="text-gray-500 font-black mb-4">:</span>
                  <TimeCell value={countdown.m} label="min" />
                  <span className="text-gray-500 font-black mb-4">:</span>
                  <TimeCell value={countdown.s} label="sec" />
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/products/${current.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black text-base text-gray-950 bg-teal-500 hover:bg-teal-400 transition-all hover:-translate-y-0.5 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40"
              >
                Buy Now
                <ArrowRight size={18} />
              </Link>
              <button
                onClick={() => {
                  setAddedToCart(true)
                  setTimeout(() => setAddedToCart(false), 2000)
                  // addToCart({ productId: current.id, quantity: 1 })
                }}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all hover:-translate-y-0.5"
                style={{
                  background: addedToCart
                    ? 'rgba(20,184,166,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  border: addedToCart
                    ? '1px solid rgba(20,184,166,0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                  color: addedToCart ? '#2dd4bf' : 'white',
                }}
              >
                <ShoppingCart size={18} />
                {addedToCart ? 'Added to cart ✓' : 'Add to Cart'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="relative z-10 grid grid-cols-3 gap-2">
              {[
                { icon: <Truck size={13} />, line1: 'Free Shipping', line2: 'Orders over $29' },
                { icon: <RotateCcw size={13} />, line1: 'Easy Returns', line2: '30-day policy' },
                { icon: <ShieldCheck size={13} />, line1: 'Secure Pay', line2: '256-bit SSL' },
              ].map(({ icon, line1, line2 }) => (
                <div
                  key={line1}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-center"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span className="text-teal-500">{icon}</span>
                  <span className="text-white text-[11px] font-bold leading-tight">
                    {line1}
                  </span>
                  <span className="text-gray-600 text-[10px] leading-tight">
                    {line2}
                  </span>
                </div>
              ))}
            </div>

            {/* Slide controls */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {displayItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="rounded-full transition-all duration-400"
                    style={{
                      height: 6,
                      width: i === currentIndex ? 28 : 6,
                      background:
                        i === currentIndex
                          ? '#14b8a6'
                          : 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={prev}
                  className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={next}
                  className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ══ COL 2: Product image ══ */}
          <div
            className="hidden lg:flex rounded-2xl overflow-hidden relative items-center justify-center"
            style={{
              background: '#0d1520',
              border: '1px solid rgba(255,255,255,0.055)',
              minHeight: 520,
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 60%, rgba(20,184,166,0.06) 0%, transparent 70%)',
              }}
            />
            {/* Category label */}
            <div className="absolute top-4 left-4 z-10">
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                {current.category ?? 'Product'}
              </span>
            </div>
            {/* Image */}
            <div
              key={`img-${currentIndex}`}
              className="relative w-full h-full img-fade-in"
              style={{ minHeight: 420 }}
            >
              <Image
                src={current.images?.[0]}
                alt={current.title}
                fill
                priority
                className="object-contain p-8"
                onLoad={() => setImgLoaded(true)}
                style={{
                  transform: imgLoaded ? 'scale(1)' : 'scale(0.96)',
                  transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)',
                }}
              />
            </div>
            {/* Photo count */}
            {current.images?.length > 1 && (
              <div
                className="absolute bottom-4 right-4 text-[11px] text-gray-500 font-semibold px-2 py-1 rounded-md"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                1 / {current.images.length} photos
              </div>
            )}
          </div>

          {/* ══ COL 3: Flash deal sidebar ══ */}
          <div
            className="hidden lg:flex flex-col gap-3 rounded-2xl p-3"
            style={{
              background: '#0d1520',
              border: '1px solid rgba(255,255,255,0.055)',
            }}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
                <Flame size={13} className="animate-pulse" />
                Flash Deals
              </div>
              <Link
                href="/products"
                className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold transition-colors"
              >
                See all →
              </Link>
            </div>

            {/* Sidebar countdown */}
            <div
              className="flex items-center justify-center gap-2 py-2 rounded-xl"
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.12)',
              }}
            >
              <Clock size={11} className="text-red-400" />
              <span className="text-red-400 font-black text-xs tabular-nums tracking-wider">
                {String(countdown.h).padStart(2, '0')}:
                {String(countdown.m).padStart(2, '0')}:
                {String(countdown.s).padStart(2, '0')}
              </span>
              <span className="text-gray-600 text-[10px]">remaining</span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-1.5">
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

            {/* Browse CTA */}
            <Link
              href="/products"
              className="mt-auto flex items-center justify-center gap-2 py-3 rounded-xl text-teal-400 text-xs font-bold hover:text-teal-300 transition-colors"
              style={{
                background: 'rgba(20,184,166,0.06)',
                border: '1px solid rgba(20,184,166,0.12)',
              }}
            >
              Browse all {stats.totalProducts.toLocaleString()}+ products
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* ── Mobile: product image ── */}
        <div
          className="lg:hidden mt-3 rounded-2xl overflow-hidden relative"
          style={{
            height: 260,
            background: '#0d1520',
            border: '1px solid rgba(255,255,255,0.055)',
          }}
        >
          <Image
            src={current.images?.[0]}
            alt={current.title}
            fill
            priority
            className="object-contain p-6"
          />
        </div>

        {/* ── Mobile: thumbnail strip ── */}
        <div className="lg:hidden mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {displayItems.map((product, idx) => (
            <button
              key={product.id}
              onClick={() => goTo(idx)}
              className="flex-shrink-0 rounded-xl overflow-hidden transition-all"
              style={{
                width: 64,
                height: 64,
                border:
                  idx === currentIndex
                    ? '2px solid #14b8a6'
                    : '2px solid rgba(255,255,255,0.06)',
                opacity: idx === currentIndex ? 1 : 0.5,
              }}
            >
              <div className="relative w-full h-full">
                <Image
                  src={product.images?.[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom trust bar ── */}
      <div
        className="mt-0 px-4 py-3 hidden md:block"
        style={{
          background: '#080d13',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between flex-wrap gap-4">
          {[
            { icon: <Truck size={14} className="text-teal-500" />, text: 'Free shipping on orders over $29' },
            { icon: <RotateCcw size={14} className="text-teal-500" />, text: '30-day hassle-free returns' },
            { icon: <ShieldCheck size={14} className="text-teal-500" />, text: 'Buyer protection on every order' },
            { icon: <BadgeCheck size={14} className="text-teal-500" />, text: 'Verified quality products' },
            {
              icon: <Star size={14} className="text-amber-400 fill-amber-400" />,
              text: `Avg ${stats.avgRating?.toFixed(1) ?? '4.5'}★ store rating`,
            },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
              {icon}
              {text}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes imgFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .hero-slide-in {
          animation: slideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .img-fade-in {
          animation: imgFadeIn 0.6s ease both;
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  )
}
