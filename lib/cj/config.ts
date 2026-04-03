// lib/cj/config.ts

export const CJ_CONFIG = {
  fees: {
    stripe: {
      percentage: parseFloat(process.env.STRIPE_FEE_PERCENTAGE || '0.029'),
      fixed: parseFloat(process.env.STRIPE_FEE_FIXED || '0.30'),
    },
    paypal: {
      percentage: parseFloat(process.env.PAYPAL_FEE_PERCENTAGE || '0.0349'),
      fixed: parseFloat(process.env.PAYPAL_FEE_FIXED || '0.49'),
    },
  },
  shipping: {
    markupPercentage: parseFloat(process.env.SHIPPING_MARKUP_PERCENTAGE || '0.10'), // Default 10% markup
  },
}
