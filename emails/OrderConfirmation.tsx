// emails/OrderConfirmation.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface OrderConfirmationEmailProps {
  orderNumber: string
  customerName: string
  orderDate: string
  items: Array<{
    name: string
    quantity: number
    price: number
    image: string
  }>
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
}

export const OrderConfirmationEmail = ({
  orderNumber = 'ORD-123456789',
  customerName = 'Customer',
  orderDate = new Date().toLocaleDateString(),
  items = [],
  subtotal = 0,
  shipping = 0,
  tax = 0,
  total = 0,
  shippingAddress = {
    name: 'John Doe',
    address: '123 Main St',
    city: 'City',
    state: 'State',
    zip: '12345',
    country: 'Country'
  }
}: OrderConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your TealMart order #{orderNumber} is confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>🎉 Order Confirmed!</Heading>
            <Text style={text}>
              Thank you for your purchase, {customerName}!
            </Text>
          </Section>

          {/* Order Details */}
          <Section style={orderBox}>
            <Text style={orderNumberStyle}>
              Order #{orderNumber}
            </Text>
            <Text style={orderDate}>
              Placed on {orderDate}
            </Text>
          </Section>

          {/* Items */}
          <Section style={itemsSection}>
            <Heading as="h2" style={h2}>
              Order Items
            </Heading>
            {items.map((item, index) => (
              <Section key={index} style={itemRow}>
                <table width="100%" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td width="80">
                      <Img
                        src={item.image}
                        width="70"
                        height="70"
                        alt={item.name}
                        style={itemImage}
                      />
                    </td>
                    <td style={itemDetails}>
                      <Text style={itemName}>{item.name}</Text>
                      <Text style={itemQty}>Qty: {item.quantity}</Text>
                    </td>
                    <td align="right" style={itemPrice}>
                      ${item.price.toFixed(2)}
                    </td>
                  </tr>
                </table>
              </Section>
            ))}
          </Section>

          <Hr style={hr} />

          {/* Order Summary */}
          <Section style={summary}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td style={summaryLabel}>Subtotal:</td>
                <td align="right" style={summaryValue}>${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={summaryLabel}>Shipping:</td>
                <td align="right" style={summaryValue}>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </td>
              </tr>
              <tr>
                <td style={summaryLabel}>Tax:</td>
                <td align="right" style={summaryValue}>${tax.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={totalLabel}>Total:</td>
                <td align="right" style={totalValue}>${total.toFixed(2)}</td>
              </tr>
            </table>
          </Section>

          <Hr style={hr} />

          {/* Shipping Address */}
          <Section>
            <Heading as="h3" style={h3}>Shipping Address</Heading>
            <Text style={address}>
              {shippingAddress.name}<br />
              {shippingAddress.address}<br />
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}<br />
              {shippingAddress.country}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* What's Next */}
          <Section style={nextSteps}>
            <Heading as="h3" style={h3}>What's Next?</Heading>
            <Text style={text}>
              ✓ We're processing your order<br />
              ✓ You'll receive a shipping confirmation with tracking soon<br />
              ✓ Estimated delivery: 7-14 business days
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL}/account/orders`}
            >
              Track Your Order
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Need help? Contact us at{' '}
              <Link href="mailto:support@tealmart.com" style={link}>
                support@tealmart.com
              </Link>
            </Text>
            <Text style={footerText}>
              <Link href={process.env.NEXT_PUBLIC_APP_URL} style={link}>
                TealMart
              </Link>{' '}
              - Your one-stop shop for quality products
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default OrderConfirmationEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#0d9488',
  color: '#ffffff',
}

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  padding: '0',
}

const h2 = {
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '24px 0 16px',
  color: '#1a1a1a',
}

const h3 = {
  fontSize: '18px',
  fontWeight: '600',
  margin: '16px 0 8px',
  color: '#1a1a1a',
}

const text = {
  color: '#ffffff',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
}

const orderBox = {
  backgroundColor: '#f0fdfa',
  borderRadius: '8px',
  margin: '24px 24px 0',
  padding: '16px',
  textAlign: 'center' as const,
}

const orderNumberStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0d9488',
  margin: '0 0 4px',
}

const orderDate = {
  fontSize: '14px',
  color: '#666',
  margin: '0',
}

const itemsSection = {
  padding: '0 24px',
}

const itemRow = {
  marginBottom: '16px',
}

const itemImage = {
  borderRadius: '8px',
  objectFit: 'cover' as const,
}

const itemDetails = {
  padding: '0 12px',
}

const itemName = {
  fontSize: '16px',
  fontWeight: '500',
  color: '#1a1a1a',
  margin: '0 0 4px',
}

const itemQty = {
  fontSize: '14px',
  color: '#666',
  margin: '0',
}

const itemPrice = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 24px',
}

const summary = {
  padding: '0 24px',
}

const summaryLabel = {
  fontSize: '14px',
  color: '#666',
  padding: '4px 0',
}

const summaryValue = {
  fontSize: '14px',
  color: '#1a1a1a',
  padding: '4px 0',
}

const totalLabel = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  padding: '8px 0 4px',
  borderTop: '2px solid #0d9488',
}

const totalValue = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#0d9488',
  padding: '8px 0 4px',
  borderTop: '2px solid #0d9488',
}

const address = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#1a1a1a',
  margin: '8px 24px',
}

const nextSteps = {
  padding: '0 24px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#0d9488',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const footer = {
  padding: '0 24px',
  textAlign: 'center' as const,
  marginTop: '32px',
}

const footerText = {
  fontSize: '12px',
  color: '#666',
  lineHeight: '18px',
  margin: '4px 0',
}

const link = {
  color: '#0d9488',
  textDecoration: 'underline',
}
