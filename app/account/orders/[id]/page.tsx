// app/account/orders/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle,
  MapPin, CreditCard, RefreshCw, ShoppingCart, Loader2,
  AlertCircle, Send, X
} from 'lucide-react'
import { useCart } from '@/lib/contexts/CartContext'
import toast from 'react-hot-toast'
import TrackingTimeline from '@/components/orders/TrackingTimeline'
import { getSecureImageUrl } from '@/lib/imageUrl'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { id: string; title: string; images: string[] }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  subtotal: number
  tax: number
  shipping: number
  discountAmount: number
  discountCode?: string
  shippingName: string
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingCountry: string
  shippingPhone?: string
  paymentMethod: string
  paidAt?: string
  createdAt: string
  trackingNumber?: string
  trackingCarrier?: string
  cjOrderId?: string
  items: OrderItem[]
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  PENDING:    { label: 'Payment Pending',  icon: <Clock size={18} />,        color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  PROCESSING: { label: 'Being Prepared',   icon: <Package size={18} />,      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  SHIPPED:    { label: 'On The Way',       icon: <Truck size={18} />,        color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  DELIVERED:  { label: 'Delivered',        icon: <CheckCircle size={18} />,  color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  CANCELLED:  { label: 'Cancelled',        icon: <XCircle size={18} />,      color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  REFUNDED:   { label: 'Refunded',         icon: <RefreshCw size={18} />,    color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200' },
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addItem } = useCart()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Tracking State
  const [trackingData, setTrackingData] = useState<any>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)

  // Dispute/Return State
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDesc, setDisputeDesc] = useState('')
  const [disputeSubmitting, setDisputeSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (!session?.user?.email) return
    
    fetch(`/api/orders/customer/${params.id}`)
      .then(r => r.json())
      .then(data => { 
        setOrder(data); 
        setLoading(false);

        if (data && (data.status === 'SHIPPED' || data.status === 'DELIVERED')) {
          setTrackingLoading(true)
          fetch(`/api/orders/${params.id}/tracking`)
            .then(res => res.json())
            .then(trackData => { setTrackingData(trackData) })
            .catch(() => {})
            .finally(() => setTrackingLoading(false))
        }
      })
      .catch(() => setLoading(false))
  }, [session?.user?.email, params.id])

  const handleReorder = () => {
    if (!order) return
    order.items.forEach(item => {
      addItem({
        id: item.product.id,
        title: item.product.title,
        price: item.price,
        image: getSecureImageUrl(item.product.images[0] || ''),
      })
    })
    toast.success(`${order.items.length} item${order.items.length !== 1 ? 's' : ''} added to cart!`)
    router.push('/cart')
  }

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disputeReason || !disputeDesc) return toast.error('Please fill in all fields')
    
    setDisputeSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${order!.orderNumber}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason, description: disputeDesc, images: [] }) 
      })
      
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        setShowDisputeModal(false)
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Failed to submit request')
    } finally {
      setDisputeSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-tiffany-600" size={48} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order not found</h2>
          <Link href="/account/orders" className="text-tiffany-600 hover:underline text-sm font-medium">
            ← Back to orders
          </Link>
        </div>
      </div>
    )
  }

  const meta = STATUS_META[order.status] || STATUS_META.PENDING
  const isCancelled = ['CANCELLED', 'REFUNDED'].includes(order.status)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">

        <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-tiffany-600 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Placed {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${meta.bg} ${meta.color}`}>
                {meta.icon} {meta.label}
              </span>
              <button
                onClick={handleReorder}
                className="flex items-center gap-1.5 text-sm font-semibold text-tiffany-600 hover:text-tiffany-700 border border-tiffany-200 hover:border-tiffany-400 px-3 py-1.5 rounded-xl transition-all"
              >
                <ShoppingCart size={14} /> Reorder
              </button>
              
              {/* ✅ Return Button */}
              {!isCancelled && (order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all border border-transparent hover:border-red-200"
                >
                  <AlertCircle size={14} /> Request Return
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Tracking */}
        {!isCancelled && (
          <div className="mb-5">
            {(order.status === 'SHIPPED' || order.status === 'DELIVERED') ? (
              trackingLoading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-tiffany-500 mb-3" size={32} />
                  <p className="text-sm text-gray-500 font-medium">Fetching live tracking events...</p>
                </div>
              ) : trackingData && trackingData.events?.length > 0 ? (
                <TrackingTimeline 
                  events={trackingData.events} 
                  carrier={trackingData.carrier || order.trackingCarrier} 
                  trackingNumber={trackingData.trackingNumber || order.trackingNumber} 
                />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <Truck size={40} className="mx-auto text-purple-300 mb-3" />
                  <h3 className="font-bold text-gray-900 text-lg mb-1">Your order is on the way!</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Tracking details will appear here as soon as the carrier scans your package.
                  </p>
                  {(order.trackingNumber || trackingData?.trackingNumber) && (
                    <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-mono text-sm font-bold border border-purple-200">
                      Tracking ID: {order.trackingNumber || trackingData?.trackingNumber}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <Package size={40} className="mx-auto text-blue-300 mb-3" />
                <h3 className="font-bold text-gray-900 text-lg mb-1">We're preparing your order</h3>
                <p className="text-sm text-gray-500">
                  You will receive an email with tracking details as soon as it ships!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Items Ordered</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                <Link href={`/products/${item.product.id}`} className="flex-shrink-0">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={getSecureImageUrl(item.product.images[0]) || '/placeholder.png'}
                      alt={item.product.title}
                      fill
                      className="object-cover hover:scale-105 transition-transform"
                      sizes="64px"
                    />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.id}`} className="font-semibold text-gray-900 text-sm hover:text-tiffany-600 line-clamp-2 transition-colors">
                    {item.product.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">${item.price.toFixed(2)} each</p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span>{order.shipping === 0 ? <span className="text-green-600 font-medium">FREE</span> : `$${order.shipping.toFixed(2)}`}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span><span>${order.tax.toFixed(2)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Discount {order.discountCode && `(${order.discountCode})`}</span>
                <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 text-lg">
              <span>Total</span><span className="text-tiffany-600">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={18} className="text-tiffany-600" />
              <h3 className="font-bold text-gray-900 text-sm">Shipping Address</h3>
            </div>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-semibold text-gray-900">{order.shippingName}</p>
              <p>{order.shippingAddress}</p>
              <p>{order.shippingCity}, {order.shippingState} {order.shippingZip}</p>
              <p>{order.shippingCountry}</p>
              {order.shippingPhone && <p className="text-gray-500">{order.shippingPhone}</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={18} className="text-tiffany-600" />
              <h3 className="font-bold text-gray-900 text-sm">Payment Info</h3>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="capitalize font-bold text-gray-900">
                {order.paymentMethod === 'stripe' ? 'Credit Card' : 'Mobile Money / Local'}
              </p>
              {order.paidAt && (
                <p>Paid on {new Date(order.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              )}
              <div className="mt-2 pt-1">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                  order.paidAt ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                }`}>
                  {order.paidAt ? '✓ Payment Confirmed' : '⏳ Awaiting Payment'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Dispute/Return Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowDisputeModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Request Return</h3>
                <p className="text-sm text-gray-500 mt-1">Order #{order.orderNumber}</p>
              </div>
              <button onClick={() => setShowDisputeModal(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Return <span className="text-red-500">*</span></label>
                <select 
                  required value={disputeReason} onChange={e => setDisputeReason(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tiffany-500 outline-none text-sm font-medium"
                >
                  <option value="">Select a reason...</option>
                  <option value="Damaged Product">Item arrived damaged or broken</option>
                  <option value="Wrong Item">Received the wrong item/color/size</option>
                  <option value="Not Received">Package marked delivered but not received</option>
                  <option value="Quality Issue">Poor quality or defective</option>
                  <option value="Changed Mind">Changed my mind / No longer needed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Details <span className="text-red-500">*</span></label>
                <textarea 
                  required value={disputeDesc} onChange={e => setDisputeDesc(e.target.value)}
                  rows={4} placeholder="Please explain the issue in detail..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tiffany-500 outline-none text-sm"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <strong>Next Steps:</strong> Once submitted, our team will review your request and email you a prepaid return shipping label if applicable.
              </div>

              <button 
                type="submit" disabled={disputeSubmitting}
                className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {disputeSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {disputeSubmitting ? 'Submitting Request...' : 'Submit Return Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
              }
