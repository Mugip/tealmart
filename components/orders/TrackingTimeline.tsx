// components/orders/TrackingTimeline.tsx
'use client'

import { Package, Truck, CheckCircle, Clock } from 'lucide-react'

interface TrackingEvent {
  date: string
  status: string
  location: string
  description: string
}

export default function TrackingTimeline({ events, carrier, trackingNumber }: { events: TrackingEvent[], carrier?: string, trackingNumber?: string }) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
        <Clock className="w-10 h-10 text-blue-400 mx-auto mb-3" />
        <h3 className="font-bold text-blue-900">Tracking not available yet</h3>
        <p className="text-sm text-blue-700 mt-1">Check back in 24-48 hours after your order ships.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Truck className="text-tiffany-600" /> Shipment Progress
          </h3>
          {trackingNumber && (
            <p className="text-sm text-gray-500 mt-1">
              Tracking: <span className="font-mono font-bold text-gray-900">{trackingNumber}</span> {carrier ? `(${carrier})` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
        {events.map((event, index) => {
          const isLatest = index === 0;
          return (
            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${isLatest ? 'bg-tiffany-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {isLatest ? <CheckCircle size={14} /> : <Package size={14} />}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-bold text-sm ${isLatest ? 'text-tiffany-700' : 'text-gray-700'}`}>{event.status}</h4>
                  <time className="text-[10px] font-bold text-gray-400 uppercase">{new Date(event.date).toLocaleDateString()}</time>
                </div>
                <p className="text-xs text-gray-600 leading-snug">{event.description}</p>
                {event.location && <p className="text-[10px] text-gray-400 mt-2 font-medium">📍 {event.location}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
