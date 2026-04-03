# ✅ Payment System Checklist & Testing Guide

## 🚀 Pre-Launch Checklist

### Phase 1: Setup (Days 1-2)

- [ ] Create accounts on all payment providers:
  - [ ] Stripe
  - [ ] PayPal
  - [ ] Flutterwave
  - [ ] Pesapal

- [ ] Get API keys and webhooks secrets
- [ ] Add all keys to `.env.local`
- [ ] Install dependencies (`npm install stripe axios`)
- [ ] Update Prisma schema with payment models
- [ ] Run database migrations
- [ ] Copy all payment files to project

### Phase 2: Integration (Days 3-4)

- [ ] Create checkout page (`/checkout`)
- [ ] Add payment method selector component
- [ ] Add currency selector component
- [ ] Create webhook handlers for all providers
- [ ] Add payment tracking to database
- [ ] Implement success/failure pages

### Phase 3: Testing (Days 5-6)

- [ ] Test Stripe locally with test cards
- [ ] Test PayPal with sandbox account
- [ ] Test Flutterwave with test mobile money
- [ ] Test Pesapal with test bank account
- [ ] Test all payment methods by region
- [ ] Test currency conversion accuracy
- [ ] Test webhook receipt and processing
- [ ] Test error scenarios (declined card, timeout, etc.)

### Phase 4: Security (Day 7)

- [ ] Enable HTTPS on localhost (for testing Apple Pay/Google Pay)
- [ ] Verify webhook signatures
- [ ] Test PCI compliance
- [ ] Review database encryption
- [ ] Set up rate limiting on payment endpoints
- [ ] Enable audit logging

### Phase 5: Production (Week 2)

- [ ] Switch to production API keys
- [ ] Update webhook URLs to production domain
- [ ] Enable SSL certificate
- [ ] Test production payments (small amount)
- [ ] Monitor webhook delivery
- [ ] Set up error alerts
- [ ] Create runbook for payment issues

---

## 🧪 Testing Scenarios

### Test 1: Stripe Card Payment

**Objective**: Successful card payment flow

1. Go to `/checkout`
2. Select "Credit/Debit Card" payment method
3. Select currency: USD
4. Enter test card: `4242 4242 4242 4242`
5. Expiry: Any future date (e.g., 12/25)
6. CVC: Any 3 digits (e.g., 123)
7. Click "Pay Now"
8. Verify:
   - [ ] Payment processes
   - [ ] Webhook received
   - [ ] Order marked as "completed"
   - [ ] Confirmation email sent
   - [ ] Success page displayed

### Test 2: Stripe Declined Card

**Objective**: Handle card decline gracefully

1. Use test card: `4000 0000 0000 0002`
2. Complete checkout
3. Verify:
   - [ ] Card declined message appears
   - [ ] Error is logged
   - [ ] User can retry payment
   - [ ] No duplicate order created

### Test 3: 3D Secure/SCA Authentication

**Objective**: Test strong customer authentication

1. Use test card: `4000 0025 0000 3155`
2. Complete checkout
3. Verify:
   - [ ] 3D Secure prompt appears
   - [ ] User can authenticate
   - [ ] Payment completes after auth
   - [ ] Webhook received after auth

### Test 4: Apple Pay / Google Pay

**Objective**: Test digital wallet payments

**For Apple Pay** (requires macOS/iOS):
1. Add test card to Apple Wallet
2. Go to checkout on Safari
3. Select "Apple Pay"
4. Use Face ID/Touch ID
5. Verify payment completes

**For Google Pay** (requires Android/Chrome):
1. Add test card to Google Play
2. Go to checkout on Chrome
3. Select "Google Pay"
4. Complete payment
5. Verify success

### Test 5: PayPal Payment

**Objective**: Test PayPal integration

1. Go to checkout
2. Select PayPal
3. Click "Pay with PayPal"
4. Login with sandbox buyer account
5. Verify:
   - [ ] Redirected to PayPal
   - [ ] Can review order
   - [ ] Payment processes
   - [ ] Redirected back to success page
   - [ ] Webhook received
   - [ ] Order updated in database

### Test 6: Flutterwave Mobile Money (MTN)

**Objective**: Test African mobile money

**Requirements**: Valid Ugandan/Kenyan phone number

1. Go to checkout
2. Select Currency: UGX or KES
3. Select "MTN Mobile Money"
4. Enter test phone: `256757123456` (Uganda)
5. Verify:
   - [ ] Payment prompt appears
   - [ ] Phone receives USSD request
   - [ ] User can enter PIN: `1234`
   - [ ] Payment confirms
   - [ ] Webhook received
   - [ ] Order marked completed

### Test 7: Currency Conversion

**Objective**: Test multi-currency support

1. Add $100 USD item to cart
2. Go to checkout
3. Change currency from USD to UGX
4. Verify:
   - [ ] Amount converts correctly (~370,000 UGX)
   - [ ] Provider accepts currency
   - [ ] Conversion rate is reasonable
   - [ ] Payment processes in correct currency

### Test 8: Multiple Payment Attempts

**Objective**: Test repeat payment handling

1. Complete payment #1 successfully
2. Customer receives confirmation
3. Attempt payment #2 with same order ID
4. Verify:
   - [ ] Second payment rejected (duplicate)
   - [ ] User informed order already paid
   - [ ] No duplicate charge
   - [ ] Clear error message

### Test 9: Webhook Verification

**Objective**: Test webhook security

Using Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

Verify:
- [ ] Webhook received in logs
- [ ] Signature verified correctly
- [ ] Order status updated
- [ ] No webhook replay attacks possible

### Test 10: Failed Webhook

**Objective**: Test webhook retry/fallback

1. Setup payment without webhook endpoint
2. Complete payment manually
3. Re-enable webhook
4. Verify:
   - [ ] Payment still marked as complete
   - [ ] Webhook catches up
   - [ ] No duplicate processing

### Test 11: Refund Processing

**Objective**: Test refund workflow

1. Complete successful payment
2. Go to admin panel
3. Click "Refund" on order
4. Verify:
   - [ ] Refund initiated with provider
   - [ ] Refund appears in account after 1-2 days
   - [ ] Order status changed to "refunded"
   - [ ] Customer notified

### Test 12: Timeout/Network Error

**Objective**: Test error handling

1. Disconnect internet during payment
2. Verify:
   - [ ] User sees timeout error
   - [ ] Order not created
   - [ ] User can retry
   - [ ] No funds charged

### Test 13: Regional Payment Methods

**Objective**: Test region-specific methods

**For Uganda**:
- [ ] MTN Mobile Money available
- [ ] Airtel Money available
- [ ] Bank transfer available
- [ ] Cards available

**For Kenya**:
- [ ] Equitel available
- [ ] Safaricom available
- [ ] Cards available
- [ ] M-Pesa available (via Flutterwave)

**For Global**:
- [ ] Only Stripe & PayPal available
- [ ] All card brands supported

### Test 14: Transaction History

**Objective**: Test payment tracking

1. Complete multiple payments with different providers
2. Go to user account → "Payment History"
3. Verify:
   - [ ] All payments listed
   - [ ] Correct amounts shown
   - [ ] Provider shown
   - [ ] Status accurate (completed/failed/pending)
   - [ ] Can export as CSV
   - [ ] Can download receipts

### Test 15: Edge Cases

**Test the following edge cases:**

- [ ] Payment with very small amount ($0.50)
- [ ] Payment with very large amount ($99,999)
- [ ] Payment with special characters in name
- [ ] Payment with international characters (é, ñ, 中)
- [ ] Payment from VPN/proxy
- [ ] Payment with expired browser session
- [ ] Payment with multiple tabs open

---

## 📊 Performance Testing

### Load Test: 100 Concurrent Payments

```bash
# Using Apache Bench or k6
ab -n 100 -c 10 http://localhost:3000/api/checkout

# Expected: All complete within 5 seconds
# No errors or timeouts
```

### Database Query Performance

```sql
-- Check payment query speed
SELECT * FROM "PaymentTransaction" WHERE status = 'completed' ORDER BY created_at DESC;
-- Expected: < 100ms

-- Check webhook processing time
SELECT * FROM "PaymentTransaction" WHERE webhook_verified = true;
-- Expected: < 50ms
```

---

## 🔒 Security Testing

### Test 1: API Key Exposure

- [ ] Check `.env.local` not in git history
- [ ] Check API keys not in frontend code
- [ ] Check API keys not in error messages
- [ ] Check API keys not in logs

### Test 2: CSRF Protection

- [ ] Add CSRF token to payment form
- [ ] Verify token on server
- [ ] Test with invalid token (should fail)

### Test 3: SQL Injection

- [ ] Test with SQL in payment form
  - Input: `'; DROP TABLE payments; --`
  - Expected: Treated as normal string, not executed

### Test 4: XSS Prevention

- [ ] Test with JavaScript in form
  - Input: `<script>alert('XSS')</script>`
  - Expected: Escaped, not executed

### Test 5: Payment Amount Tampering

- [ ] Intercept request and change amount
- [ ] Verify server rejects modified amount
- [ ] Check original amount matches order

### Test 6: Rate Limiting

- [ ] Send 100 payment requests rapidly
- [ ] Verify rate limiter kicks in
- [ ] Check user gets error after limit

---

## 📈 Performance Metrics

Track these metrics during testing:

```
Payment Metrics:
- Average payment completion time: < 3 seconds
- Success rate: > 99%
- Webhook delivery rate: > 99%
- Failed payment recovery rate: > 80%
- Customer support tickets related to payments: < 1%

API Metrics:
- Average response time: < 500ms
- P95 response time: < 1s
- Error rate: < 0.1%
- Webhook delivery time: < 100ms

Database Metrics:
- Payment query time: < 100ms
- Transaction creation time: < 50ms
- Webhook processing time: < 50ms
```

---

## 🐛 Common Issues & Fixes

### Issue: Webhook Not Received

**Diagnosis**:
```bash
# Check provider logs
# Stripe: https://dashboard.stripe.com/webhooks
```

**Solutions**:
1. Verify webhook URL is public (not localhost)
2. Check firewall allows incoming requests
3. Verify webhook secret in `.env`
4. Check server logs for errors
5. Verify HTTPS certificate validity

### Issue: Payment Processed Twice

**Diagnosis**: Order marked complete, but charged twice

**Solutions**:
1. Implement idempotency keys
2. Check duplicate prevention logic
3. Verify webhook processing is atomic
4. Check database constraints

### Issue: Currency Conversion Wrong

**Diagnosis**: Amount converted incorrectly

**Solutions**:
1. Use real-time exchange rates
2. Log conversion before processing
3. Verify calculation formula
4. Check rounding (use 2 decimal places)

### Issue: Mobile Money Timeout

**Diagnosis**: MTN/Airtel payment hangs

**Solutions**:
1. Increase timeout to 5 minutes
2. Implement retry logic
3. Use provider's test numbers
4. Check network connectivity
5. Verify MSISDN format (international)

---

## ✅ Sign-Off Checklist

Before going live, get sign-off on:

- [ ] CFO/Finance: Payment amounts correct, fees calculated properly
- [ ] Security: All keys stored safely, HTTPS enforced, PCI compliant
- [ ] QA: All tests pass, no critical bugs
- [ ] Support: Team trained on payment issues, runbook created
- [ ] Compliance: Terms & conditions updated with refund policy
- [ ] Legal: Payment terms reviewed, compliance verified

---

## 📞 Emergency Contacts

Save these for production issues:

- **Stripe Support**: support@stripe.com | +1 510-766-2400
- **PayPal Support**: https://www.paypal.com/en/smarthelp
- **Flutterwave Support**: support@flutterwave.com
- **Pesapal Support**: support@pesapal.com
- **Your Internal**: `payments-support@tealmart.com`

---

**You're ready to accept payments from anyone, anywhere! 💳🌍✅**
