// lib/cj/dispute.ts
import { cjClient } from './client'

export async function openCJDispute(params: {
  orderNumber: string
  reason: string
  description: string
  images?: string[]
}) {
  try {
    const response = await cjClient.createDispute(params)
    return { success: true, disputeId: response.disputeId }
  } catch (error: any) {
    console.error(`Dispute creation failed for ${params.orderNumber}:`, error)
    return { success: false, error: error.message }
  }
}
