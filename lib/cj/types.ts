// lib/cj/types.ts

export interface CJShippingOption {
  logisticName: string
  logisticPrice: number
  logisticAging: string
  taxesFee?: number
  clearanceOperationFee?: number
  totalPostageFee?: number
}

export interface CJProduct {
  vid: string
  quantity: number
  sellPrice?: number
}

export interface CJOrder {
  orderNumber: string
  cjOrderId?: string
  status: string
  trackingNumber?: string
  trackingUrl?: string
}

export interface CJTrackingEvent {
  date: string
  status: string
  location: string
  description: string
}

export interface CJTrackingInfo {
  trackingNumber: string
  carrier: string
  status: string
  events: CJTrackingEvent[]
}

export interface CJWebhookPayload {
  type: 'ORDER' | 'LOGISTIC'
  event: string
  data: {
    orderNumber: string
    status?: string
    trackingNumber?: string
    [key: string]: any
  }
}
