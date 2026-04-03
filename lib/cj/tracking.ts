// lib/cj/tracking.ts
import { cjClient } from './client'
import { CJTrackingInfo } from './types'

export async function fetchOrderTracking(orderNumber: string): Promise<CJTrackingInfo | null> {
  try {
    const tracking = await cjClient.getTracking(orderNumber)
    return tracking
  } catch (error) {
    console.error(`Failed to fetch tracking for ${orderNumber}:`, error)
    return null
  }
}
