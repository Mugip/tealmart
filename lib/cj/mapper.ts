// lib/cj/mapper.ts
import { CJ_CONFIG } from './config'

export function beautifyShippingName(cjName: string): {
  displayName: string
  tier: 'standard' | 'express' | 'priority'
  icon: string
} {
  const nameMap: Record<string, { displayName: string; tier: any; icon: string }> = {
    'CJ_Packet_Ordinary': { displayName: 'Standard Shipping', tier: 'standard', icon: '✈️' },
    'CJ_Packet_Sensitive': { displayName: 'Standard Shipping', tier: 'standard', icon: '✈️' },
    'CJ_Packet_Registered': { displayName: 'Registered Mail', tier: 'standard', icon: '📦' },
    'USPS+': { displayName: 'Express Delivery', tier: 'express', icon: '🚀' },
    'CJPacket Fast Ordinary': { displayName: 'Express Delivery', tier: 'express', icon: '🚀' },
    'DHL': { displayName: 'Priority DHL', tier: 'priority', icon: '⚡' },
    'FedEx': { displayName: 'Priority FedEx', tier: 'priority', icon: '⚡' },
    'UPS': { displayName: 'Priority UPS', tier: 'priority', icon: '⚡' },
    'YunExpress': { displayName: 'Standard Express', tier: 'express', icon: '🚀' }
  }

  return nameMap[cjName] || { 
    displayName: cjName.replace(/_/g, ' '), 
    tier: 'standard', 
    icon: '📦' 
  }
}

export function calculateTotalShippingCost(
  cjShippingCost: number,
  paymentMethod: 'stripe' | 'paypal' = 'stripe'
): {
  cjCost: number
  processorFee: number
  markup: number
  totalToCharge: number
} {
  const config = CJ_CONFIG.fees[paymentMethod]
  
  // Add our profit markup to the raw shipping cost
  const markup = cjShippingCost * CJ_CONFIG.shipping.markupPercentage
  const costWithMarkup = cjShippingCost + markup

  // Calculate processor fee needed to cover shipping + markup
  // Formula: (Target Amount + Fixed Fee) / (1 - Percentage Fee) - Target Amount
  const processorFee = ((costWithMarkup + config.fixed) / (1 - config.percentage)) - costWithMarkup
  
  const totalToCharge = costWithMarkup + processorFee
  
  return {
    cjCost: cjShippingCost,
    processorFee: Math.round(processorFee * 100) / 100,
    markup: Math.round(markup * 100) / 100,
    totalToCharge: Math.round(totalToCharge * 100) / 100,
  }
}
