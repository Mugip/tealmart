'use client'

import { useState, useEffect, useCallback, useRef, TouchEvent } from 'react'
import Link from 'next/link'
import {
  ArrowRight, ShieldCheck, Star, ChevronLeft, ChevronRight,
  Zap, TrendingUp, ShoppingBag, Sparkles, Flame, Eye,
  ShoppingCart, Package
} from 'lucide-react'
import { useCurrency } from '@/lib/contexts/CurrencyContext'
import Image from 'next/image'

interface HeroProps {
  stats: {
    totalProducts: number
    totalCategories: number
    avgRating: number
  }
  products: any[]
}

// Per-slide accent palette — each slide gets its own color identity
const SLIDE_PALETTES = [
  {
    name: 'teal',
    primary: '#14b8a6',
    glow: 'rgba(20,184,166,0.45)',
    glowHover: 'rgba(20,184,166,0.7)',
    badge: 'rgba(20,184,166,0.15)',
    badgeBorder: 'rgba(20,184,166,0.35)',
    badgeText: '#5eead4',
    gradFrom: '#14b8a6',
    gradTo: '#34d399',
    overlayFrom: 'rgba(2,44,40,0.92)',
    overlayMid: 'rgba(2,44,40,0.6)',
    btnBg: '#14b8a6',
    btnHover: '#2dd4bf',
    btnText: '#0f172a',
  },
  {
    name: 'violet',
    primary: '#8b5cf6',
    glow: 'rgba(139,92,246,0.45)',
    glowHover: 'rgba(139,92,246,0.7)',
    badge: 'rgba(139,92,246,0.15)',
    badgeBorder: 'rgba(139,92,246,0.35)',
    badgeText: '#c4b5fd',
    gradFrom: '#8b5cf6',
    gradTo: '#ec4899',
    overlayFrom: 'rgba(15,5,40,0.93)',
    overlayMid: 'rgba(15,5,40,0.6)',
    btnBg: '#8b5cf6',
    btnHover: '#a78bfa',
    btnText: '#ffffff',
  },
  {
    name: 'amber',
    primary: '#f59e0b',
    glow: 'rgba(245,158,11,0.45)',
    glowHover: 'rgba(245,158,11,0.7)',
    badge: 'rgba(245,158,11,0.15)',
    badgeBorder: 'rgba(245,158,11,0.35)',
    badgeText: '#fcd34d',
    gradFrom: '#f59e0b',
    gradTo: '#ef4444',
    overlayFrom: 'rgba(30,15,0,0.93)',
    overlayMid: 'rgba(30,15,0,0.6)',
    btnBg: '#f59e0b',
    btnHover: '#fbbf24',
    btnText: '#0f172a',
  },
  {
    name: 'rose',
    primary: '#f43f5e',
    glow: 'rgba(244,63,94,0.45)',
    glowHover: 'rgba(244,63,94,0.7)',
    badge: 'rgba(244,63,94,0.15)',
    badgeBorder: 'rgba(244,63,94,0.35)',
    badgeText: '#fda4af',
    gradFrom: '#f43f5e',
    gradTo: '#fb923c',
    overlayFrom: 'rgba(30,2,10,0.93)',
    overlayMid: 'rgba(30,2,10,0.6)',
    btnBg: '#f43f5e',
    btnHover: '#fb7185',
    btnText: '#ffffff',
  },
  {
    name: 'sky',
    primary: '#0ea5e9',
    glow: 'rgba(14,165,233,0.45)',
    glowHover: 'rgba(14,165,233,0.7)',
    badge: 'rgba(14,165,233,0.15)',
    badgeBorder: 'rgba(14,165,233,0.35)',
    badgeText: '#7dd3fc',
    gradFrom: '#0ea5e9',
    gradTo: '#6366f1',
    overlayFrom: 'rgba(0,10,30,0.93)',
    overlayMid: 'rgba(0,10,30,0.6)',
    btnBg: '#0ea5e9',
    btnHover: '#38bdf8',
    btnText: '#ffffff',
  },
]

function StarRating({ rating, count }: { rating: number; count: number }) {
  const stars = Math.round(rating ?? 4)
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            className={s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
          />
        ))}
      </div>
      <span className="text-gray-400 text-xs font-semibold">
        {rating?.toFixed(1) ?? '4.5'} ({count?.toLocaleString() ?? '0'} reviews)
      </span>
    </div>
  )
}

function DiscountBadge({ price, compareAtPrice, palette }: { price: number; compareAtPrice: number; palette: typeof SLIDE_PALETTES[0] }) {
  if (!compareAtPrice || compareAtPrice <= price) return null
  const pct = Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
  return (
    <div
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black tracking-wide"
      style={{ background: palette.badge, border: `1px solid ${palette.badgeBorder}`, color: palette.badgeText }}
    >
      <Flame size={12} />
      SAVE {pct}%
    </div>
  )
}

export default function Hero({ stats, products }: HeroProps) {
  const { formatPrice } = useCurrency()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState<number | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)
  const progressStartRef = useRef<number>(Date.now())

  const displayItems = products?.length > 0 ? products.slice(0, 5) : []
  const palette = SLIDE_PALETTES[currentIndex % SLIDE_PALETTES.length]
  const SLIDE_DURATION = 6000

  const goToSlide = useCallback((idx: number) => {
    if (isTransitioning || idx === currentIndex) return
    setIsTransitioning(true)
    setPrevIndex(currentIndex)
    setCurrentIndex(idx)
    setProgress(0)
    progressStartRef.current = Date.now()
    setTimeout(() => setIsTransitioning(false), 900)
  }, [currentIndex, isTransitioning])

  const nextSlide = useCallback(() => {
    if (displayItems.length === 0) return
    goToSlide(currentIndex === displayItems.length - 1 ? 0 : currentIndex + 1)
  }, [currentIndex, displayItems.length, goToSlide])

  const prevSlide = useCallback(() => {
    if (displayItems.length === 0) return
    goToSlide(currentIndex === 0 ? displayItems.length - 1 : currentIndex - 1)
  }, [currentIndex, displayItems.length, goToSlide])

  // Progress bar ticker
  useEffect(() => {
    if (isHovered || displayItems.length <= 1) {
      if (progressRef.current) clearInterval(progressRef.current)
      return
    }
    progressStartRef.current = Date.now()
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartRef.current
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        nextSlide()
        progressStartRef.current = Date.now()
      }
    }, 30)
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [isHovered, nextSlide, displayItems.length, currentIndex])

  // Touch swipe
  const handleTouchStart = (e: TouchEvent) => setTouchStart(e.targetTouches[0].clientX)
  const handleTouchMove = (e: TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    if (touchStart - touchEnd > 50) nextSlide()
    if (touchStart - touchEnd < -50) prevSlide()
    setTouchStart(null); setTouchEnd(null)
  }

  // Fake urgency numbers — seeded by product id for consistency
  const getViewers = (id: string) => 23 + (id?.charCodeAt(0) ?? 5) % 40
  const getStock = (id: string) => 4 + (id?.charCodeAt(1) ?? 3) % 14

  if (displayItems.length === 0) return null

  const current = displayItems[currentIndex]

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'min(90vh, 780px)', minHeight: 520 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Progress Bar ── */}
      <div className="absolute top-0 left-0 right-0 z-50 h-[3px] bg-white/5">
        <div
          className="h-full transition-none"
          style={{
            width: `${isHovered ? progress : progress}%`,
            background: `linear-gradient(90deg, ${palette.gradFrom}, ${palette.gradTo})`,
            boxShadow: `0 0 8px ${palette.glow}`,
            transition: isHovered ? 'none' : 'width 0.03s linear',
          }}
        />
      </div>

      {/* ── Background Slides (parallax-style: image moves independently) ── */}
      <div className="absolute inset-0 z-0">
        {displayItems.map((product, idx) => {
          const pal = SLIDE_PALETTES[idx % SLIDE_PALETTES.length]
          const isActive = idx === currentIndex
          const wasPrev = idx === prevIndex
          return (
            <div
              key={product.id}
              className="absolute inset-0"
              style={{
                opacity: isActive ? 1 : wasPrev ? 0 : 0,
                transition: 'opacity 0.9s cubic-bezier(0.4,0,0.2,1)',
                zIndex: isActive ? 2 : wasPrev ? 1 : 0,
              }}
            >
              {/* Background image with ken-burns scale */}
              <div
                className="absolute inset-0"
                style={{
                  transform: isActive ? 'scale(1.05)' : 'scale(1.0)',
                  transition: 'transform 8s ease-out',
                }}
              >
                <Image
                  src={product.images?.[0]}
                  alt={product.title}
                  fill
                  priority={idx === 0}
                  className="object-cover"
                  style={{ opacity: 0.38 }}
                />
              </div>
              {/* Color-tinted overlay per slide */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(105deg, ${pal.overlayFrom} 0%, ${pal.overlayMid} 55%, rgba(0,0,0,0.1) 100%)`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
              {/* Subtle colored radial bloom bottom-left */}
              <div
                className="absolute bottom-0 left-0 w-[600px] h-[400px] rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 20% 90%, ${pal.glow} 0%, transparent 70%)`,
                  filter: 'blur(40px)',
                }}
              />
            </div>
          )
        })}
      </div>

      {/* ── Content Layer ── */}
      <div className="absolute inset-0 z-20 flex items-center pb-20 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">

            {/* LEFT: Main content */}
            <div className="max-w-2xl space-y-4 md:space-y-5">

              {/* Badge row */}
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase"
                  style={{
                    background: palette.badge,
                    border: `1px solid ${palette.badgeBorder}`,
                    color: palette.badgeText,
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <Sparkles size={13} />
                  {(current.reviewCount ?? 0) > 100 ? 'Best Seller' : 'Featured Arrival'}
                </div>
                <DiscountBadge price={current.price} compareAtPrice={current.compareAtPrice} palette={palette} />
              </div>

              {/* Title */}
              <div key={`title-${currentIndex}`} className="hero-content-in">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tighter">
                  {current.title.split(' ').slice(0, 4).join(' ')}
                  <span
                    className="block"
                    style={{
                      background: `linear-gradient(90deg, ${palette.gradFrom}, ${palette.gradTo})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Exclusive Deal
                  </span>
                </h1>
              </div>

              {/* Stars */}
              <StarRating rating={current.avgRating ?? 4.5} count={current.reviewCount ?? 0} />

              {/* Price row */}
              <div className="flex items-baseline gap-4">
                <span className="text-3xl md:text-4xl font-black text-white">
                  {formatPrice(current.price)}
                </span>
                {current.compareAtPrice && current.compareAtPrice > current.price && (
                  <span className="text-xl text-gray-500 line-through font-bold">
                    {formatPrice(current.compareAtPrice)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-400 text-base md:text-lg font-medium max-w-xl leading-relaxed line-clamp-2">
                {current.description?.replace(/<[^>]*>?/gm, '')}
              </p>

              {/* Urgency signals */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-orange-400">
                  <Eye size={13} />
                  <span>{getViewers(current.id)} people viewing now</span>
                </div>
                <div className="flex items-center gap-1.5 text-red-400">
                  <Package size={13} />
                  <span>Only {getStock(current.id)} left in stock</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href={`/products/${current.id}`}
                  className="group flex items-center justify-center gap-2 px-8 py-4 font-black rounded-2xl transition-all text-base"
                  style={{
                    background: palette.btnBg,
                    color: palette.btnText,
                    boxShadow: `0 0 36px ${palette.glow}`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = palette.btnHover
                    ;(e.currentTarget as HTMLElement).style.boxShadow = `0 0 52px ${palette.glowHover}, 0 -4px 0 0 rgba(255,255,255,0.12) inset`
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = palette.btnBg
                    ;(e.currentTarget as HTMLElement).style.boxShadow = `0 0 36px ${palette.glow}`
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  }}
                >
                  Get it Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </Link>

                {/* Add to Cart quick action */}
                <button
                  onClick={() => {
                    setAddedToCart(true)
                    setTimeout(() => setAddedToCart(false), 2000)
                    // Hook into your cart context here:
                    // addToCart({ productId: current.id, quantity: 1 })
                  }}
                  className="flex items-center justify-center gap-2 px-8 py-4 font-black rounded-2xl backdrop-blur-xl border border-white/10 transition-all text-base text-white hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <ShoppingCart size={18} className={addedToCart ? 'text-green-400' : 'text-white'} />
                  {addedToCart ? 'Added!' : 'Add to Cart'}
                </button>

                <Link
                  href="/products"
                  className="flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-2xl backdrop-blur-xl border border-white/10 text-white transition-all text-base hover:-translate-y-0.5 hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  Browse All
                </Link>
              </div>
            </div>

            {/* RIGHT: Thumbnail Strip (desktop) */}
            <div className="hidden xl:flex flex-col gap-2.5 w-[130px]">
              {displayItems.map((product, idx) => {
                const pal = SLIDE_PALETTES[idx % SLIDE_PALETTES.length]
                const isActive = idx === currentIndex
                return (
                  <button
                    key={product.id}
                    onClick={() => goToSlide(idx)}
                    className="relative rounded-xl overflow-hidden transition-all duration-300 group/thumb"
                    style={{
                      height: isActive ? 96 : 72,
                      opacity: isActive ? 1 : 0.5,
                      border: isActive ? `2px solid ${pal.primary}` : '2px solid transparent',
                      boxShadow: isActive ? `0 0 16px ${pal.glow}` : 'none',
                      transform: isActive ? 'scale(1.04)' : 'scale(1)',
                    }}
                  >
                    <Image
                      src={product.images?.[0]}
                      alt={product.title}
                      fill
                      className="object-cover group-hover/thumb:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/10 transition-colors" />
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: `linear-gradient(90deg, ${pal.gradFrom}, ${pal.gradTo})` }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Card ── */}
      <div className="md:hidden absolute bottom-16 left-0 right-0 z-30 px-4">
        <div
          className="rounded-2xl p-4 flex items-center justify-between gap-4"
          style={{
            background: 'rgba(10,10,15,0.75)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${palette.badgeBorder}`,
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-white font-black text-base truncate">{current.title.split(' ').slice(0, 3).join(' ')}</div>
            <div className="text-sm font-bold mt-0.5" style={{ color: palette.primary }}>
              {formatPrice(current.price)}
            </div>
          </div>
          <Link
            href={`/products/${current.id}`}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm"
            style={{ background: palette.btnBg, color: palette.btnText }}
          >
            Buy <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Arrow Controls ── */}
      <div className="absolute bottom-20 md:bottom-14 right-4 md:right-12 z-30 flex items-center gap-2">
        <button
          onClick={prevSlide}
          className="p-3 rounded-xl border border-white/10 text-white transition-all hover:-translate-y-0.5"
          style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = palette.btnBg; (e.currentTarget as HTMLElement).style.color = palette.btnText }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'white' }}
          aria-label="Previous"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          className="p-3 rounded-xl border border-white/10 text-white transition-all hover:-translate-y-0.5"
          style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = palette.btnBg; (e.currentTarget as HTMLElement).style.color = palette.btnText }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'white' }}
          aria-label="Next"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ── Dot Navigation ── */}
      <div className="absolute bottom-20 md:bottom-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
        {displayItems.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="h-1.5 transition-all duration-500 rounded-full"
            style={{
              width: currentIndex === index ? 32 : 8,
              background: currentIndex === index
                ? `linear-gradient(90deg, ${palette.gradFrom}, ${palette.gradTo})`
                : 'rgba(255,255,255,0.2)',
              boxShadow: currentIndex === index ? `0 0 8px ${palette.glow}` : 'none',
            }}
          />
        ))}
      </div>

      {/* ── Trust Stats Bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 hidden md:block border-t py-3"
        style={{ background: 'rgba(5,5,10,0.55)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          {[
            { icon: <Zap size={14} />, color: palette.primary, label: `${stats.totalProducts.toLocaleString()}+ Items` },
            { icon: <Star size={14} className="fill-yellow-400 text-yellow-400" />, color: '#facc15', label: 'Top Rated Store' },
            { icon: <ShieldCheck size={14} />, color: palette.primary, label: 'Secure Global Checkout' },
            { icon: <TrendingUp size={14} />, color: palette.primary, label: `${stats.totalCategories}+ Departments` },
          ].map(({ icon, color, label }, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest" style={{ color }}>
              {icon}
              <span className="text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* ── CSS for content entrance animation ── */}
      <style jsx>{`
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-content-in {
          animation: heroIn 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
      `}</style>
    </div>
  )
}
