import crypto from 'crypto';

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
}

export interface RazorpayRefundResult {
  success: boolean;
  refundId?: string;
  status?: string;
  amount?: number;
  error?: string;
}

export class RazorpayService {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;
  private isTestMode: boolean;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || (process.env.NODE_ENV !== 'production' ? 'test_secret_for_automated_suite_123' : '');
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || this.keySecret;
    this.isTestMode = process.env.NODE_ENV === 'test' || !this.keyId || this.keyId.includes('placeholder');
  }

  /**
   * Refresh credentials from environment or runtime config
   */
  public refreshCredentials(keyId?: string, keySecret?: string, webhookSecret?: string): void {
    if (keyId) this.keyId = keyId;
    if (keySecret) this.keySecret = keySecret;
    if (webhookSecret) this.webhookSecret = webhookSecret;
    this.isTestMode = process.env.NODE_ENV === 'test' || !this.keyId || this.keyId.includes('placeholder');
  }

  public isConfigured(): boolean {
    return Boolean(
      this.keyId &&
      this.keySecret &&
      !this.keyId.includes('placeholder') &&
      !this.keySecret.includes('placeholder')
    );
  }

  public getKeyId(): string {
    return this.keyId || (process.env.NODE_ENV !== 'production' ? 'rzp_test_mock_key' : '');
  }

  public getKeySecret(): string {
    return this.keySecret || process.env.RAZORPAY_KEY_SECRET || (process.env.NODE_ENV !== 'production' ? 'test_secret_for_automated_suite_123' : '');
  }

  /**
   * Create an official Razorpay Order.
   * Calls the Razorpay REST API using Basic Auth (key_id:key_secret).
   * In automated test mode without live credentials, generates a deterministic test order.
   */
  public async createOrder(params: {
    bookingId: string;
    amountInPaise: number;
    currency?: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrderResult> {
    const { bookingId, amountInPaise, currency = 'INR', notes = {} } = params;

    if (!amountInPaise || amountInPaise <= 0) {
      throw new Error('Invalid order amount: Amount must be greater than zero.');
    }

    // In live or staging environment with real Razorpay credentials:
    if (this.isConfigured() && process.env.NODE_ENV !== 'test') {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: bookingId,
          notes: {
            bookingId,
            ...notes
          }
        })
      });

      const data = (await response.json()) as any;
      if (!response.ok) {
        throw new Error(`Razorpay Order creation failed: ${data.error?.description || response.statusText}`);
      }

      return {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        receipt: data.receipt
      };
    }

    // Explicit test mode / development fallback
    if (process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_PAYMENTS === 'true') {
      const testOrderId = `order_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        id: testOrderId,
        amount: amountInPaise,
        currency,
        status: 'created',
        receipt: bookingId
      };
    }

    throw new Error('Razorpay payment gateway credentials are not configured on this server. Online payments are disabled.');
  }

  /**
   * Authoritative server-side HMAC-SHA256 signature verification.
   * Compares crypto.createHmac('sha256', keySecret).update(orderId + '|' + paymentId) against razorpaySignature
   * Uses timing-safe string comparison to protect against timing attacks.
   */
  public verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): { valid: boolean; error?: string } {
    const { orderId, paymentId, signature } = params;

    if (!orderId || typeof orderId !== 'string') {
      return { valid: false, error: 'Missing or invalid Razorpay order ID.' };
    }
    if (!paymentId || typeof paymentId !== 'string') {
      return { valid: false, error: 'Missing or invalid Razorpay payment ID.' };
    }
    if (!signature || typeof signature !== 'string') {
      return { valid: false, error: 'Missing or invalid Razorpay payment signature.' };
    }

    const secret = this.getKeySecret();
    if (!secret) {
      return { valid: false, error: 'Razorpay secret key is not configured.' };
    }

    try {
      const payload = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
      const actualBuffer = Buffer.from(signature, 'utf-8');

      if (expectedBuffer.length !== actualBuffer.length) {
        return { valid: false, error: 'Invalid Razorpay signature length.' };
      }

      const isValid = crypto.timingSafeEqual(expectedBuffer, actualBuffer);
      return isValid
        ? { valid: true }
        : { valid: false, error: 'Signature verification mismatch: Payment authentication failed.' };
    } catch (err: any) {
      return { valid: false, error: `Signature verification exception: ${err.message}` };
    }
  }

  /**
   * Verify Razorpay Webhook Signature from request header 'X-Razorpay-Signature'.
   */
  public verifyWebhookSignature(
    rawBody: Buffer | string,
    signature: string
  ): { valid: boolean; error?: string } {
    if (!signature) {
      return { valid: false, error: 'Missing X-Razorpay-Signature header.' };
    }

    const webhookSecret = this.webhookSecret || this.getKeySecret();
    if (!webhookSecret) {
      return { valid: false, error: 'Webhook secret is not configured.' };
    }

    try {
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const expectedBuf = Buffer.from(expected, 'utf-8');
      const actualBuf = Buffer.from(signature, 'utf-8');

      if (expectedBuf.length !== actualBuf.length) {
        return { valid: false, error: 'Webhook signature length mismatch.' };
      }

      const isValid = crypto.timingSafeEqual(expectedBuf, actualBuf);
      return isValid
        ? { valid: true }
        : { valid: false, error: 'Webhook signature verification failed.' };
    } catch (err: any) {
      return { valid: false, error: `Webhook verification exception: ${err.message}` };
    }
  }

  /**
   * Initiate official Razorpay Refund.
   */
  public async initiateRefund(params: {
    paymentId: string;
    amountInPaise: number;
    notes?: Record<string, string>;
  }): Promise<RazorpayRefundResult> {
    const { paymentId, amountInPaise, notes = {} } = params;

    if (!paymentId) {
      return { success: false, error: 'Missing payment ID for refund.' };
    }
    if (!amountInPaise || amountInPaise <= 0) {
      return { success: false, error: 'Refund amount must be greater than zero.' };
    }

    if (this.isConfigured() && process.env.NODE_ENV !== 'test') {
      try {
        const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: amountInPaise,
            notes
          })
        });

        const data = (await response.json()) as any;
        if (!response.ok) {
          return {
            success: false,
            error: data.error?.description || `Refund failed with status ${response.status}`
          };
        }

        return {
          success: true,
          refundId: data.id,
          status: data.status,
          amount: data.amount
        };
      } catch (err: any) {
        return { success: false, error: `Razorpay refund API network error: ${err.message}` };
      }
    }

    // In test environment:
    if (process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_PAYMENTS === 'true') {
      return {
        success: true,
        refundId: `rfnd_test_${Date.now()}_${paymentId.slice(-6)}`,
        status: 'processed',
        amount: amountInPaise
      };
    }

    return {
      success: false,
      error: 'Razorpay credentials not configured for automated gateway refund.'
    };
  }
}

export const razorpayService = new RazorpayService();
