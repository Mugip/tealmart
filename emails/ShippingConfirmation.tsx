// emails/ShippingConfirmation.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface ShippingConfirmationEmailProps {
  orderNumber: string
  customerName: string
  trackingNumber: string
  carrier: string
  estimatedDelivery: string
  items: Array<{
    name: string
    quantity: number
  }>
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
}

export const ShippingConfirmationEmail = ({
  orderNumber = 'ORD-123456789',
  customerName = 'Customer',
  trackingNumber = 'TRACK123456',
  carrier = 'YunExpress',
  estimatedDelivery = 'March 20, 2026',
  items = [],
  shippingAddress = {
    name: 'John Doe',
    address: '123 Main St',
    city: 'City',
    state: 'State',
    zip: '12345',
    country: 'Country'
  }
}: ShippingConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your TealMart order #{orderNumber} has shipped!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>📦 Your Order Has Shipped!</Heading>
            <Text style={headerText}>
              Great news, {customerName}! Your order is on its way.
            </Text>
          </Section>

          {/* Tracking Info */}
          <Section style={trackingBox}>
            <Text style={label}>Tracking Number</Text>
            <Text style={trackingNumberStyle}>{trackingNumber}</Text>
            <Text style={carrierStyle}>via {carrier}</Text>
            <Text style={delivery}>
              Estimated Delivery: <strong>{estimatedDelivery}</strong>
            </Text>
          </Section>

          {/* Track Button */}
          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`https://track.yunexpress.com/tracking?number=${trackingNumber}`}
            >
              Track Your Package
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Order Items */}
          <Section style={section}>
            <Heading as="h3" style={h3}>Items in This Shipment</Heading>
            {items.map((item, index) => (
              <Text key={index} style={itemText}>
                • {item.name} (Qty: {item.quantity})
              </Text>
            ))}
          </Section>

          <Hr style={hr} />

          {/* Shipping Address */}
          <Section style={section}>
            <Heading as="h3" style={h3}>Shipping To</Heading>
            <Text style={address}>
              {shippingAddress.name}<br />
              {shippingAddress.address}<br />
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}<br />
              {shippingAddress.country}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Tips */}
          <Section style={section}>
            <Heading as="h3" style={h3}>Delivery Tips</Heading>
            <Text style={tipText}>
              ✓ Your package will be delivered to the address above<br />
              ✓ A signature may be required upon delivery<br />
              ✓ If you're not home, a delivery notice will be left<br />
              ✓ Contact the carrier directly if you need to reschedule
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Order #{orderNumber}
            </Text>
            <Text style={footerText}>
              Questions? Contact us at{' '}
              <Link href="mailto:support@tealmart.com" style={link}>
                support@tealmart.com
              </Link>
            </Text>
            <Text style={footerText}>
              <Link href={process.env.NEXT_PUBLIC_APP_URL} style={link}>
                TealMart
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ShippingConfirmationEmail

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

const headerText = {
  color: '#ffffff',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
}

const trackingBox = {
  backgroundColor: '#f0fdfa',
  borderRadius: '12px',
  margin: '24px 24px 0',
  padding: '24px',
  textAlign: 'center' as const,
  border: '2px solid #0d9488',
}

const label = {
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  color: '#666',
  fontWeight: '600',
  letterSpacing: '0.5px',
  margin: '0 0 8px',
}

const trackingNumberStyle = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#0d9488',
  margin: '0 0 4px',
  fontFamily: 'monospace',
}

const carrierStyle = {
  fontSize: '14px',
  color: '#666',
  margin: '0 0 16px',
}

const delivery = {
  fontSize: '16px',
  color: '#1a1a1a',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
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
  padding: '14px 40px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 24px',
}

const section = {
  padding: '0 24px',
}

const h3 = {
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px',
  color: '#1a1a1a',
}

const itemText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#1a1a1a',
  margin: '4px 0',
}

const address = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#1a1a1a',
  margin: '0',
}

const tipText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#666',
  margin: '0',
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
