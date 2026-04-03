// lib/cj/client.ts
import { getCJToken } from '@/lib/cjToken'
import { CJOrder, CJShippingOption, CJTrackingInfo } from './types'

class CJAPIClient {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.CJ_API_URL || 'https://developers.cjdropshipping.com/api2.0/v1'
  }

  /**
   * Make authenticated API request using our secure Token Cache
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    
    // ✅ Use our centralized, cached API Key token manager! (No email/password)
    const token = await getCJToken()

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
        ...options.headers,
      },
    })

    const data = await response.json()

    // CJ sometimes returns success via `result: true` and sometimes via `code: 200`
    if (!data.result && data.code !== 200) {
      throw new Error(`CJ API Error: ${data.message || 'Unknown Error'} (Code: ${data.code})`)
    }

    return data.data as T
  }

  /**
   * Calculate shipping options for products
   */
  async calculateShipping(params: {
    products: Array<{ vid: string; quantity: number }>
    country: string
    zip?: string
  }): Promise<CJShippingOption[]> {
    return this.request<CJShippingOption[]>('/logistic/freightCalculate', {
      method: 'POST',
      body: JSON.stringify({
        startCountryCode: 'CN',
        endCountryCode: params.country,
        zip: params.zip,
        products: params.products,
      }),
    })
  }

  /**
   * Create order in CJ system
   */
  async createOrder(params: {
    orderNumber: string
    shippingMethod: string
    products: Array<{
      vid: string
      quantity: number
      sellPrice: number
    }>
    shippingAddress: {
      name: string
      phone: string
      country: string
      province: string
      city: string
      address: string
      zip: string
    }
    remark?: string
  }): Promise<CJOrder> {
    // Note: Official dropshipping order creation uses createOrderV2
    return this.request<CJOrder>('/shopping/order/createOrderV2', {
      method: 'POST',
      body: JSON.stringify({
        orderNumber: params.orderNumber,
        logisticName: params.shippingMethod,
        products: params.products,
        shippingCustomerName: params.shippingAddress.name,
        shippingPhone: params.shippingAddress.phone || "0000000000",
        shippingCountryCode: params.shippingAddress.country,
        shippingProvince: params.shippingAddress.province,
        shippingCity: params.shippingAddress.city,
        shippingAddress: params.shippingAddress.address,
        shippingZip: params.shippingAddress.zip,
        fromCountryCode: "CN",
        remark: params.remark,
      }),
    })
  }

  /**
   * Get tracking information
   */
  async getTracking(orderNumber: string): Promise<CJTrackingInfo> {
    return this.request<CJTrackingInfo>(
      `/logistic/query/tracking?orderNumber=${orderNumber}`,
      { method: 'GET' }
    )
  }

  /**
   * Get order details
   */
  async getOrderDetails(orderNumber: string): Promise<CJOrder> {
    return this.request<CJOrder>(
      `/order/query?orderNumber=${orderNumber}`,
      { method: 'GET' }
    )
  }

  /**
   * Create dispute/return request
   */
  async createDispute(params: {
    orderNumber: string
    reason: string
    description: string
    images?: string[]
  }): Promise<{ disputeId: string }> {
    return this.request<{ disputeId: string }>('/dispute/create', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }
}

// Singleton instance
export const cjClient = new CJAPIClient()
