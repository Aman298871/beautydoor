import nodemailer, { Transporter } from 'nodemailer';
import { Resend } from 'resend';
import https from 'https';
import { db } from '../db/database';

export interface EmailDispatchResult {
  success: boolean;
  provider: 'resend' | 'smtp' | 'simulated';
  messageId?: string;
  error?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private fromAddress: string;

  constructor() {
    this.fromAddress = process.env.EMAIL_FROM || `${process.env.EMAIL_FROM_NAME || 'BeautyDoor'} <${process.env.EMAIL_FROM_ADDRESS || 'bookings@beautydoor.in'}>`;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } catch (err: any) {
        console.warn('[EmailService] SMTP transporter initialization failed:', err.message);
      }
    }
  }

  private async sendViaResend(to: string, subject: string, html: string): Promise<EmailDispatchResult> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { success: false, provider: 'resend', error: 'Missing RESEND_API_KEY' };

    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: this.fromAddress,
        to: [to],
        subject,
        html
      });

      if (error) {
        return { success: false, provider: 'resend', error: error.message || 'Resend API returned error' };
      }

      return { success: true, provider: 'resend', messageId: data?.id };
    } catch (err: any) {
      return { success: false, provider: 'resend', error: err.message || 'Resend SDK exception' };
    }
  }

  private async dispatchEmail(to: string, subject: string, html: string): Promise<EmailDispatchResult> {
    // 1. Check Resend API
    if (process.env.RESEND_API_KEY) {
      const res = await this.sendViaResend(to, subject, html);
      if (res.success) return res;
      console.warn('[EmailService] Resend failed, trying SMTP fallback if available:', res.error);
    }

    // 2. Check SMTP Transporter
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          html
        });
        return { success: true, provider: 'smtp', messageId: info.messageId };
      } catch (err: any) {
        console.warn('[EmailService] SMTP sendMail failed:', err.message);
        return { success: false, provider: 'smtp', error: err.message };
      }
    }

    // 3. Fallback: Simulated Delivery (Local development, test environments, or missing production credentials)
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[EmailService:UNCONFIGURED] Production email dispatch blocked to ${to}: No Resend or SMTP credentials configured.`);
      return {
        success: false,
        provider: 'simulated',
        error: 'Email service credentials (RESEND_API_KEY or SMTP_HOST) not configured in production environment.'
      };
    }

    console.log(`[EmailService:Simulated] To: ${to} | Subject: "${subject}" | Simulated audit record created (not delivered to real inbox).`);
    return {
      success: true,
      provider: 'simulated',
      messageId: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    };
  }

  private async isNotificationAlreadySent(bookingId: string, notificationType: string): Promise<boolean> {
    try {
      const existing = await db.queryRow(
        "SELECT id FROM booking_notifications WHERE booking_id = ? AND notification_type = ? AND status IN ('sent', 'simulated', 'delivered')",
        [bookingId, notificationType]
      );
      return !!existing;
    } catch {
      return false;
    }
  }

  private async logNotification(
    bookingId: string,
    recipientEmail: string,
    notificationType: string,
    subject: string,
    result: EmailDispatchResult
  ): Promise<void> {
    try {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      await db.execute(`
        INSERT INTO booking_notifications (
          id, booking_id, recipient_email, notification_type, subject,
          status, provider, message_id, error_message, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        bookingId,
        recipientEmail,
        notificationType,
        subject,
        result.success ? (result.provider === 'simulated' ? 'simulated' : 'sent') : 'failed',
        result.provider,
        result.messageId || null,
        result.error || null,
        now
      ]);
    } catch (err: any) {
      console.warn('[EmailService] Could not record notification audit log:', err.message);
    }
  }

  /**
   * Helper to format booking items using genuine database schema:
   * service_name, variant_name, addon_names_json, unit_price, final_item_price, duration_mins
   */
  private async getBookingItemsHtml(bookingId: string): Promise<string> {
    try {
      const items = (await db.query(`
        SELECT service_name, variant_name, addon_names_json, unit_price, final_item_price, duration_mins 
        FROM booking_items 
        WHERE booking_id = ?
      `, [bookingId])) as any[];

      if (!items || items.length === 0) {
        return `<tr><td colspan="3" style="padding: 10px 0; color: #5C4D4F;">Services as selected at appointment booking.</td></tr>`;
      }

      return items.map(item => {
        let addonsText = '';
        try {
          const parsed = JSON.parse(item.addon_names_json || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) {
            addonsText = `<div style="font-size: 11px; color: #7A6B6D; margin-top: 2px;">+ Add-ons: ${parsed.join(', ')}</div>`;
          }
        } catch { }

        const price = item.final_item_price !== undefined && item.final_item_price !== null ? item.final_item_price : item.unit_price;

        return `
          <tr style="border-bottom: 1px solid #E8DDD3;">
            <td style="padding: 10px 0; color: #1F1A1C; font-weight: 500;">
              ${item.service_name}
              ${item.variant_name ? `<span style="color: #4A0417; font-size: 11px; font-weight: bold; background: #F4EFEA; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">${item.variant_name}</span>` : ''}
              ${addonsText}
            </td>
            <td style="padding: 10px 0; text-align: center; color: #5C4D4F;">${item.duration_mins ? `${item.duration_mins}m` : '—'}</td>
            <td style="padding: 10px 0; text-align: right; color: #1F1A1C; font-weight: 600;">₹${price}</td>
          </tr>
        `;
      }).join('');
    } catch {
      return `<tr><td colspan="3" style="padding: 10px 0; color: #5C4D4F;">Services as selected at appointment booking.</td></tr>`;
    }
  }

  /**
   * 1. Send Automated Booking Received (Pending Confirmation) Email
   * Dispatched immediately upon client placing a new booking online.
   */
  public async sendBookingReceivedEmail(booking: any): Promise<EmailDispatchResult> {
    const email = booking.customer_email || booking.customerEmail;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { success: false, provider: 'simulated', error: 'No valid customer email address provided' };
    }

    const recipient = email.trim();
    const bookingId = booking.id;

    // Deduplication check: do not send duplicate received email
    if (await this.isNotificationAlreadySent(bookingId, 'booking_received')) {
      return { success: true, provider: 'simulated', messageId: 'already_sent' };
    }

    const subject = `Booking Received: BeautyDoor Salon at Home (Ref: ${bookingId}) - Pending Confirmation`;
    const itemsList = await this.getBookingItemsHtml(bookingId);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F1A1C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8DDD3; box-shadow: 0 4px 12px rgba(74, 4, 23, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #4A0417; padding: 30px 24px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; letter-spacing: 0.5px;">BeautyDoor</h1>
              <p style="margin: 6px 0 0 0; color: #C5A880; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Beauty at Your Doorstep</p>
            </td>
          </tr>

          <!-- Request Received Badge -->
          <tr>
            <td style="padding: 28px 24px 16px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #FEF3D6; color: #8F5B00; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                APPOINTMENT REQUEST RECEIVED — PENDING CONFIRMATION
              </div>
              <h2 style="margin: 16px 0 8px 0; font-size: 20px; font-family: 'Playfair Display', Georgia, serif; color: #1F1A1C;">Dear ${booking.customer_name || 'Valued Customer'},</h2>
              <p style="margin: 0; color: #5C4D4F; font-size: 14px; line-height: 1.5;">
                We have received your appointment request for <strong>${booking.appointment_date}</strong> at <strong>${booking.appointment_slot}</strong>. Our scheduling team is reviewing specialist availability and territory routing. You will receive a formal confirmation email as soon as an esthetician is confirmed.
              </p>
            </td>
          </tr>

          <!-- Booking Summary Box -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <div style="background-color: #FAF7F2; border: 1px solid #E8DDD3; border-radius: 12px; padding: 18px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D; width: 40%;">Booking Reference:</td>
                    <td style="padding: 6px 0; color: #4A0417; font-weight: bold; font-family: monospace; font-size: 14px;">${bookingId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Requested Date:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 600;">${booking.appointment_date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Requested Slot:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 600;">${booking.appointment_slot}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Service Address:</td>
                    <td style="padding: 6px 0; color: #1F1A1C;">${booking.flat || ''}, ${booking.area || ''}, ${booking.city || 'Delhi'}${booking.pincode ? ` - ${booking.pincode}` : ''}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Payment Mode:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 600;">${booking.payment_method === 'RAZORPAY' ? 'Prepaid Online' : 'Pay After Service (Cash / UPI)'}</td>
                  </tr>
                  <tr style="border-top: 1px dashed #D6C7BC;">
                    <td style="padding: 10px 0 4px 0; color: #1F1A1C; font-weight: bold; font-size: 15px;">Estimated Total:</td>
                    <td style="padding: 10px 0 4px 0; color: #4A0417; font-weight: bold; font-size: 18px;">₹${booking.total_payable}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Services List -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #4A0417; font-weight: 700;">Selected Services</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #E8DDD3; color: #7A6B6D; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                    <th align="left" style="padding-bottom: 6px;">Service / Variant</th>
                    <th align="center" style="padding-bottom: 6px;">Duration</th>
                    <th align="right" style="padding-bottom: 6px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Contact & Support -->
          <tr>
            <td style="padding: 20px 24px; background-color: #FAF7F2; border-top: 1px solid #E8DDD3; text-align: center; font-size: 12px; color: #7A6B6D; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;">Need immediate assistance or wish to change your requested time?</p>
              <p style="margin: 0; font-weight: 600; color: #4A0417;">
                Call / WhatsApp: <a href="tel:+917827722522" style="color: #4A0417; text-decoration: none;">+91 78277 22522</a> | 
                Email: <a href="mailto:hello@beautydoor.in" style="color: #4A0417; text-decoration: none;">hello@beautydoor.in</a>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #9E8E90;">
                © 2026 BeautyDoor Enterprises. Premium at-home salon services in Delhi NCR.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const result = await this.dispatchEmail(recipient, subject, html);
    await this.logNotification(bookingId, recipient, 'booking_received', subject, result);
    return result;
  }

  /**
   * 2. Send Automated Booking Confirmation Email
   * Dispatched ONLY when an admin formally confirms the appointment.
   */
  public async sendBookingConfirmationEmail(booking: any): Promise<EmailDispatchResult> {
    const email = booking.customer_email || booking.customerEmail;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { success: false, provider: 'simulated', error: 'No valid customer email address provided' };
    }

    const recipient = email.trim();
    const bookingId = booking.id;

    // Deduplication check: do not send duplicate confirmation email
    if (await this.isNotificationAlreadySent(bookingId, 'booking_confirmation')) {
      return { success: true, provider: 'simulated', messageId: 'already_sent' };
    }

    const subject = `Booking Confirmed: BeautyDoor Salon at Home (Ref: ${bookingId})`;
    const itemsList = await this.getBookingItemsHtml(bookingId);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F1A1C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8DDD3; box-shadow: 0 4px 12px rgba(74, 4, 23, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #4A0417; padding: 30px 24px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; letter-spacing: 0.5px;">BeautyDoor</h1>
              <p style="margin: 6px 0 0 0; color: #C5A880; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Beauty at Your Doorstep</p>
            </td>
          </tr>

          <!-- Confirmation Badge -->
          <tr>
            <td style="padding: 28px 24px 16px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #E6F4EA; color: #137333; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                ✓ APPOINTMENT CONFIRMED
              </div>
              <h2 style="margin: 16px 0 8px 0; font-size: 20px; font-family: 'Playfair Display', Georgia, serif; color: #1F1A1C;">Dear ${booking.customer_name || 'Valued Customer'},</h2>
              <p style="margin: 0; color: #5C4D4F; font-size: 14px; line-height: 1.5;">
                Great news! Your home salon appointment has been confirmed. Our background-verified female esthetician will arrive promptly with 100% single-use sealed kits at your designated time.
              </p>
            </td>
          </tr>

          <!-- Booking Summary Box -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <div style="background-color: #FAF7F2; border: 1px solid #E8DDD3; border-radius: 12px; padding: 18px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D; width: 40%;">Booking Reference:</td>
                    <td style="padding: 6px 0; color: #4A0417; font-weight: bold; font-family: monospace; font-size: 14px;">${bookingId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Appointment Date:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 600;">${booking.appointment_date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Confirmed Slot:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 600;">${booking.appointment_slot}</td>
                  </tr>
                  ${booking.assigned_beautician_name ? `
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Assigned Specialist:</td>
                    <td style="padding: 6px 0; color: #4A0417; font-weight: 600;">${booking.assigned_beautician_name} (Verified)</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Service Address:</td>
                    <td style="padding: 6px 0; color: #1F1A1C;">${booking.flat || ''}, ${booking.area || ''}, ${booking.city || 'Delhi'}${booking.pincode ? ` - ${booking.pincode}` : ''}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Payment Mode:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 600;">${booking.payment_method === 'RAZORPAY' ? 'Prepaid Online' : 'Pay After Service (Cash / UPI)'}</td>
                  </tr>
                  <tr style="border-top: 1px dashed #D6C7BC;">
                    <td style="padding: 10px 0 4px 0; color: #1F1A1C; font-weight: bold; font-size: 15px;">Total Payable:</td>
                    <td style="padding: 10px 0 4px 0; color: #4A0417; font-weight: bold; font-size: 18px;">₹${booking.total_payable}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Services List -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #4A0417; font-weight: 700;">Confirmed Treatments</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #E8DDD3; color: #7A6B6D; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                    <th align="left" style="padding-bottom: 6px;">Service / Variant</th>
                    <th align="center" style="padding-bottom: 6px;">Duration</th>
                    <th align="right" style="padding-bottom: 6px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Hygiene & Safety Guarantee -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <div style="background-color: #FFFDF9; border-left: 4px solid #C5A880; padding: 14px 16px; border-radius: 4px; font-size: 12px; color: #5C4D4F; line-height: 1.5;">
                <strong style="color: #4A0417; display: block; margin-bottom: 4px;">Our Delhi NCR Hygiene Protocol:</strong>
                • 100% single-use sealed kits opened directly in front of you.<br>
                • Sterilized instruments & autoclaved grooming tools.<br>
                • Background-verified, experienced female beauty therapists.<br>
                • Zero doorstep visiting fees or hidden convenience charges.
              </div>
            </td>
          </tr>

          <!-- Contact & Support -->
          <tr>
            <td style="padding: 20px 24px; background-color: #FAF7F2; border-top: 1px solid #E8DDD3; text-align: center; font-size: 12px; color: #7A6B6D; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;">Need to reschedule or speak with customer concierge?</p>
              <p style="margin: 0; font-weight: 600; color: #4A0417;">
                Call / WhatsApp: <a href="tel:+917827722522" style="color: #4A0417; text-decoration: none;">+91 78277 22522</a> | 
                Email: <a href="mailto:hello@beautydoor.in" style="color: #4A0417; text-decoration: none;">hello@beautydoor.in</a>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #9E8E90;">
                © 2026 BeautyDoor Enterprises. Premium at-home salon services in Delhi NCR.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const result = await this.dispatchEmail(recipient, subject, html);
    await this.logNotification(bookingId, recipient, 'booking_confirmation', subject, result);
    return result;
  }

  /**
   * 3. Send Automated Booking Cancellation Email
   * Separates COD unpaid, COD collected/partial, and Razorpay prepaid cases.
   */
  public async sendBookingCancellationEmail(
    booking: any,
    cancellationFee: number = 0,
    refundAmount: number = 0,
    details?: {
      isPrepaid?: boolean;
      isCod?: boolean;
      amountCollected?: number;
      refundStatus?: string;
    }
  ): Promise<EmailDispatchResult> {
    const email = booking.customer_email || booking.customerEmail;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { success: false, provider: 'simulated', error: 'No valid customer email address provided' };
    }

    const recipient = email.trim();
    const bookingId = booking.id;

    // Deduplication check: do not send duplicate cancellation email
    if (await this.isNotificationAlreadySent(bookingId, 'booking_cancellation')) {
      return { success: true, provider: 'simulated', messageId: 'already_sent' };
    }

    const subject = `Booking Cancelled: BeautyDoor Salon at Home (Ref: ${bookingId})`;
    const isFreeCancellation = cancellationFee === 0;
    const isPrepaid = details?.isPrepaid ?? (booking.payment_method === 'RAZORPAY' || booking.razorpay_payment_id != null);
    const amountCollected = details?.amountCollected ?? Number(booking.amount_collected || 0);

    let accountingNoticeHtml = '';
    if (isPrepaid) {
      if (refundAmount > 0) {
        accountingNoticeHtml = `
          <tr>
            <td style="padding: 6px 0; color: #7A6B6D;">Refund Amount:</td>
            <td style="padding: 6px 0; color: #137333; font-weight: bold; font-size: 14px;">₹${refundAmount}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7A6B6D;">Refund Method:</td>
            <td style="padding: 6px 0; color: #5C4D4F;">Online payment source (5–7 business days upon gateway processing)</td>
          </tr>
        `;
      } else {
        accountingNoticeHtml = `
          <tr>
            <td style="padding: 6px 0; color: #7A6B6D;">Payment Settlement:</td>
            <td style="padding: 6px 0; color: #C5221F; font-weight: 600;">Advance payment applied to cover ₹${cancellationFee} late cancellation fee</td>
          </tr>
        `;
      }
    } else {
      // Cash on delivery / offline cases
      if (amountCollected > 0) {
        if (refundAmount > 0) {
          accountingNoticeHtml = `
            <tr>
              <td style="padding: 6px 0; color: #7A6B6D;">Collected in Advance:</td>
              <td style="padding: 6px 0; color: #1F1A1C; font-weight: 600;">₹${amountCollected}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #7A6B6D;">Doorstep Cash Refund Due:</td>
              <td style="padding: 6px 0; color: #137333; font-weight: bold; font-size: 14px;">₹${refundAmount} (Concierge will contact you for cash return)</td>
            </tr>
          `;
        } else {
          accountingNoticeHtml = `
            <tr>
              <td style="padding: 6px 0; color: #7A6B6D;">Doorstep Settlement:</td>
              <td style="padding: 6px 0; color: #5C4D4F;">Collected payment of ₹${amountCollected} applied to cover cancellation fee</td>
            </tr>
          `;
        }
      } else {
        if (cancellationFee > 0) {
          accountingNoticeHtml = `
            <tr>
              <td style="padding: 6px 0; color: #7A6B6D;">Fee Settlement:</td>
              <td style="padding: 6px 0; color: #C5221F; font-weight: 600;">₹200 convenience fee recorded on account for recovery on your next service</td>
            </tr>
          `;
        } else {
          accountingNoticeHtml = `
            <tr>
              <td style="padding: 6px 0; color: #7A6B6D;">Fee Settlement:</td>
              <td style="padding: 6px 0; color: #137333; font-weight: 600;">₹0 (Free cancellation — no balance due)</td>
            </tr>
          `;
        }
      }
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F1A1C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8DDD3; box-shadow: 0 4px 12px rgba(74, 4, 23, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #4A0417; padding: 30px 24px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; letter-spacing: 0.5px;">BeautyDoor</h1>
              <p style="margin: 6px 0 0 0; color: #C5A880; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Beauty at Your Doorstep</p>
            </td>
          </tr>

          <!-- Cancellation Notice -->
          <tr>
            <td style="padding: 28px 24px 16px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #FCE8E6; color: #C5221F; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                APPOINTMENT CANCELLED
              </div>
              <h2 style="margin: 16px 0 8px 0; font-size: 20px; font-family: 'Playfair Display', Georgia, serif; color: #1F1A1C;">Dear ${booking.customer_name || 'Valued Customer'},</h2>
              <p style="margin: 0; color: #5C4D4F; font-size: 14px; line-height: 1.5;">
                Your BeautyDoor home salon appointment (Ref: <strong>${bookingId}</strong>) scheduled for <strong>${booking.appointment_date}</strong> at <strong>${booking.appointment_slot}</strong> has been cancelled.
              </p>
            </td>
          </tr>

          <!-- Policy & Fee Details -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <div style="background-color: #FAF7F2; border: 1px solid #E8DDD3; border-radius: 12px; padding: 18px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D; width: 45%;">Cancellation Policy:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 600;">
                      ${isFreeCancellation ? 'Free Cancellation (2+ hours prior to slot)' : 'Late Cancellation (under 2 hours before slot)'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Cancellation Fee:</td>
                    <td style="padding: 6px 0; color: ${isFreeCancellation ? '#137333' : '#C5221F'}; font-weight: bold; font-size: 14px;">
                      ${isFreeCancellation ? '₹0 (Waived)' : '₹200'}
                    </td>
                  </tr>
                  ${accountingNoticeHtml}
                </table>
              </div>
            </td>
          </tr>

          <!-- Rebooking Invitation -->
          <tr>
            <td style="padding: 0 24px 24px 24px; text-align: center;">
              <p style="margin: 0 0 16px 0; color: #5C4D4F; font-size: 13px;">
                Whenever you are ready to book again, our certified professionals are just a tap away.
              </p>
              <a href="https://beautydoor.in/services" style="display: inline-block; background-color: #4A0417; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                Explore Services & Book Again
              </a>
            </td>
          </tr>

          <!-- Contact & Support -->
          <tr>
            <td style="padding: 20px 24px; background-color: #FAF7F2; border-top: 1px solid #E8DDD3; text-align: center; font-size: 12px; color: #7A6B6D; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;">Questions about your cancellation or refund?</p>
              <p style="margin: 0; font-weight: 600; color: #4A0417;">
                Call / WhatsApp: <a href="tel:+917827722522" style="color: #4A0417; text-decoration: none;">+91 78277 22522</a> | 
                Email: <a href="mailto:hello@beautydoor.in" style="color: #4A0417; text-decoration: none;">hello@beautydoor.in</a>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #9E8E90;">
                © 2026 BeautyDoor Enterprises. Premium at-home salon services in Delhi NCR.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const result = await this.dispatchEmail(recipient, subject, html);
    await this.logNotification(bookingId, recipient, 'booking_cancellation', subject, result);
    return result;
  }

  /**
   * Send Booking Rejected Email with polite explanation and support contact
   */
  public async sendBookingRejectedEmail(booking: any, reason: string): Promise<EmailDispatchResult> {
    const email = booking.customer_email || booking.customerEmail;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { success: false, provider: 'simulated', error: 'No valid customer email address provided' };
    }

    const recipient = email.trim();
    const bookingId = booking.id;

    if (await this.isNotificationAlreadySent(bookingId, 'booking_rejection')) {
      return { success: true, provider: 'simulated', messageId: 'already_sent' };
    }

    const subject = `Booking Update: Regarding Your BeautyDoor Appointment (Ref: ${bookingId})`;
    const itemsList = await this.getBookingItemsHtml(bookingId);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F1A1C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8DDD3; box-shadow: 0 4px 12px rgba(74, 4, 23, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #4A0417; padding: 30px 24px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; letter-spacing: 0.5px;">BeautyDoor</h1>
              <p style="margin: 6px 0 0 0; color: #C5A880; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Beauty at Your Doorstep</p>
            </td>
          </tr>

          <!-- Rejection Badge -->
          <tr>
            <td style="padding: 28px 24px 16px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #FEF3F2; color: #B42318; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                APPOINTMENT COULD NOT BE ACCOMMODATED
              </div>
              <h2 style="margin: 16px 0 8px 0; font-size: 20px; font-family: 'Playfair Display', Georgia, serif; color: #1F1A1C;">Dear ${booking.customer_name || 'Valued Customer'},</h2>
              <p style="margin: 0; color: #5C4D4F; font-size: 14px; line-height: 1.5;">
                We regret to inform you that our scheduling team cannot accommodate your requested appointment for <strong>${booking.appointment_date}</strong> at <strong>${booking.appointment_slot}</strong>.
              </p>
            </td>
          </tr>

          <!-- Reason Box -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <div style="background-color: #FAF7F2; border: 1px solid #E8DDD3; border-radius: 12px; padding: 18px 20px;">
                <h3 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #4A0417; font-weight: 700;">Reason from Salon Operations</h3>
                <p style="margin: 0; font-size: 14px; color: #1F1A1C; font-weight: 500;">
                  ${reason || 'All certified female specialists are currently fully committed during this requested time slot.'}
                </p>
              </div>
            </td>
          </tr>

          <!-- Booking Summary Box -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <div style="background-color: #FAF7F2; border: 1px solid #E8DDD3; border-radius: 12px; padding: 18px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D; width: 40%;">Booking Reference:</td>
                    <td style="padding: 6px 0; color: #4A0417; font-weight: bold; font-family: monospace; font-size: 14px;">${bookingId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Requested Date:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 600;">${booking.appointment_date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Requested Slot:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 600;">${booking.appointment_slot}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Service Location:</td>
                    <td style="padding: 6px 0; color: #1F1A1C;">${booking.flat || ''}, ${booking.area || ''}, ${booking.city || 'Delhi'}${booking.pincode ? ` - ${booking.pincode}` : ''}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Services List -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #4A0417; font-weight: 700;">Requested Services</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #E8DDD3; color: #7A6B6D; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                    <th align="left" style="padding-bottom: 6px;">Service / Variant</th>
                    <th align="center" style="padding-bottom: 6px;">Duration</th>
                    <th align="right" style="padding-bottom: 6px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Refund & Rescheduling Notice -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <div style="background-color: #FFFDF9; border-left: 4px solid #C5A880; padding: 14px 16px; border-radius: 4px; font-size: 13px; color: #5C4D4F; line-height: 1.6;">
                ${booking.payment_method === 'RAZORPAY' || booking.razorpay_payment_id != null ? '<strong style="color: #137333;">100% Full Refund:</strong> Your online payment has been queued for an immediate 100% full refund back to your original payment method with zero cancellation fees.<br>' : ''}
                We apologize for any inconvenience. We would love to pamper you at another date or time that suits your schedule.
              </div>
            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 0 24px 24px 24px; text-align: center;">
              <a href="https://beautydoor.in" style="display: inline-block; background-color: #4A0417; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; margin-right: 8px;">
                Explore Other Available Slots
              </a>
              <a href="tel:+917827722522" style="display: inline-block; background-color: #FAF7F2; color: #4A0417; border: 1px solid #4A0417; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 600;">
                Call Concierge: +91 78277 22522
              </a>
            </td>
          </tr>

          <!-- Contact & Support -->
          <tr>
            <td style="padding: 20px 24px; background-color: #FAF7F2; border-top: 1px solid #E8DDD3; text-align: center; font-size: 12px; color: #7A6B6D; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;">Need immediate assistance with rebooking?</p>
              <p style="margin: 0; font-weight: 600; color: #4A0417;">
                Call / WhatsApp: <a href="tel:+917827722522" style="color: #4A0417; text-decoration: none;">+91 78277 22522</a> | 
                Email: <a href="mailto:hello@beautydoor.in" style="color: #4A0417; text-decoration: none;">hello@beautydoor.in</a>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #9E8E90;">
                © 2026 BeautyDoor Enterprises. Premium at-home salon services in Delhi NCR.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const result = await this.dispatchEmail(recipient, subject, html);
    await this.logNotification(bookingId, recipient, 'booking_rejection', subject, result);
    return result;
  }

  /**
   * Send Instant New Booking Alert Email to Business Owner (Preeti / Operations)
   * Dispatched immediately after successful database creation of any customer booking.
   * Mandated Subject: BEAUTYDOOR — NEW BOOKING RECEIVED — [BOOKING ID]
   */
  public async sendNewBookingAlertToOwner(booking: any): Promise<EmailDispatchResult> {
    const bookingId = booking.id || booking.bookingId || 'BD-APPT';

    // Duplicate protection
    if (bookingId && await this.isNotificationAlreadySent(bookingId, 'owner_new_booking_alert')) {
      console.log(`[Email:OwnerAlert] Skipped duplicate alert for ${bookingId}`);
      return {
        success: true,
        provider: 'simulated',
        messageId: `idempotent-skip-${bookingId}`
      };
    }

    const explicitOwnerEmail = (process.env.OWNER_NOTIFICATION_EMAIL || process.env.OWNER_EMAIL || '').trim();
    if (process.env.NODE_ENV === 'production' && !explicitOwnerEmail) {
      console.warn('[EmailService] Production owner notification recipient is not configured via OWNER_NOTIFICATION_EMAIL or OWNER_EMAIL.');
      return {
        success: false,
        provider: 'simulated',
        error: 'Production owner notification recipient is not configured. Set OWNER_NOTIFICATION_EMAIL or OWNER_EMAIL.'
      };
    }
    const ownerEmail = explicitOwnerEmail || 'hello@beautydoor.in';
    const customerName = booking.customer_name || booking.customerName || 'Customer';
    const customerPhone = booking.customer_phone || booking.customerPhone || 'Not provided';
    const customerEmail = booking.customer_email || booking.customerEmail || 'Not provided';
    const date = booking.appointment_date || booking.appointmentDate || 'Not specified';
    const slot = booking.appointment_slot || booking.appointmentSlot || 'Not specified';
    const total = booking.total_payable || booking.totalPayable || 0;
    const subtotal = booking.subtotal || total;
    const pkgDiscount = booking.package_discount || booking.packageDiscount || 0;
    const couponDiscount = booking.coupon_discount || booking.couponDiscount || 0;
    const surcharge = booking.surcharge || booking.deliveryFee || 0;
    const method = booking.payment_method || booking.paymentMethod || 'COD';
    const notes = booking.customer_notes || booking.notes || 'None';

    const address = `${booking.flat || booking.address?.flat || ''}, ${booking.area || booking.address?.area || 'Delhi NCR'}, ${booking.city || booking.address?.city || 'Delhi'} - ${booking.pincode || booking.address?.pincode || ''}`;

    const subject = `BEAUTYDOOR — NEW BOOKING RECEIVED — ${bookingId}`;
    const itemsList = await this.getBookingItemsHtml(bookingId);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F1A1C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8DDD3; box-shadow: 0 4px 12px rgba(74, 4, 23, 0.08);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4A0417, #7A1C30); padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; letter-spacing: 0.5px;">BeautyDoor Operations</h1>
              <p style="margin: 6px 0 0 0; color: #C5A880; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Doorstep Salon Management · New Appointment Alert</p>
            </td>
          </tr>

          <!-- High Priority Notification Badge -->
          <tr>
            <td style="padding: 24px 24px 12px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #FEF3D6; color: #8F5B00; padding: 6px 18px; border-radius: 20px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">
                🔔 NEW CUSTOMER BOOKING RECEIVED — AWAITING OWNER ACTION
              </div>
              <h2 style="margin: 16px 0 6px 0; font-size: 20px; font-family: 'Playfair Display', Georgia, serif; color: #1F1A1C;">
                Booking ${bookingId}
              </h2>
              <p style="margin: 0; color: #5C4D4F; font-size: 14px; line-height: 1.5;">
                A new appointment has been created in the database and is waiting in your <strong>Pending Confirmation</strong> queue.
              </p>
            </td>
          </tr>

          <!-- Client & Appointment Summary Box -->
          <tr>
            <td style="padding: 12px 24px 20px 24px;">
              <div style="background-color: #FAF7F2; border: 1px solid #E8DDD3; border-radius: 12px; padding: 18px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D; width: 38%;">Client Name:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 700; font-size: 14px;">${customerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Client Phone:</td>
                    <td style="padding: 6px 0; color: #4A0417; font-weight: 700;">
                      <a href="tel:${customerPhone}" style="color: #4A0417; text-decoration: none;">${customerPhone}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Client Email:</td>
                    <td style="padding: 6px 0; color: #1F1A1C;">${customerEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Appointment Date:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 700;">${date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Requested Slot:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 700;">${slot}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Service Address:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 500;">${address}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Payment Mode:</td>
                    <td style="padding: 6px 0; color: #1F1A1C; font-weight: 600;">
                      ${method === 'COD' ? 'Cash on Delivery / Pay After Service (Pending)' : 'Online Payment'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Customer Notes:</td>
                    <td style="padding: 6px 0; color: #5C4D4F; font-style: italic;">${notes}</td>
                  </tr>
                  <tr style="border-top: 1px dashed #D6C7BC;">
                    <td style="padding: 10px 0 4px 0; color: #1F1A1C; font-weight: bold; font-size: 15px;">Total Payable:</td>
                    <td style="padding: 10px 0 4px 0; color: #4A0417; font-weight: bold; font-size: 20px;">₹${total}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Services List -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #4A0417; font-weight: 700;">
                Booked Services & Packages
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #E8DDD3; color: #7A6B6D; text-align: left;">
                    <th style="padding: 8px 0; font-weight: 600;">Service</th>
                    <th style="padding: 8px 0; text-align: center; font-weight: 600;">Est. Time</th>
                    <th style="padding: 8px 0; text-align: right; font-weight: 600;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>

              <!-- Pricing summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 14px; font-size: 12px; color: #5C4D4F;">
                <tr>
                  <td style="padding: 3px 0;">Subtotal:</td>
                  <td style="padding: 3px 0; text-align: right;">₹${subtotal}</td>
                </tr>
                ${pkgDiscount > 0 ? `<tr><td style="padding: 3px 0; color: #137333;">Package Savings:</td><td style="padding: 3px 0; text-align: right; color: #137333;">-₹${pkgDiscount}</td></tr>` : ''}
                ${couponDiscount > 0 ? `<tr><td style="padding: 3px 0; color: #137333;">Coupon Discount:</td><td style="padding: 3px 0; text-align: right; color: #137333;">-₹${couponDiscount}</td></tr>` : ''}
                ${surcharge > 0 ? `<tr><td style="padding: 3px 0;">Slot Surcharge / Delivery:</td><td style="padding: 3px 0; text-align: right;">+₹${surcharge}</td></tr>` : ''}
                <tr style="border-top: 1px solid #E8DDD3; font-weight: bold; font-size: 14px; color: #4A0417;">
                  <td style="padding: 8px 0 0 0;">Payable at Doorstep:</td>
                  <td style="padding: 8px 0 0 0; text-align: right;">₹${total}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Admin Action CTA -->
          <tr>
            <td style="padding: 10px 24px 28px 24px; text-align: center;">
              <p style="margin: 0 0 14px 0; color: #5C4D4F; font-size: 13px;">
                You can confirm this booking directly or coordinate with your beauticians team:
              </p>
              <a href="https://beautydoor.in/admin" style="display: inline-block; background-color: #4A0417; color: #FFFFFF; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 2px 6px rgba(74, 4, 23, 0.25);">
                Open Admin Panel to Review & Confirm
              </a>
              <div style="margin-top: 14px; font-size: 12px; color: #7A6B6D;">
                Direct WhatsApp contact for customer: <a href="https://wa.me/91${customerPhone.replace(/\D/g, '').slice(-10)}" style="color: #4A0417; font-weight: 600; text-decoration: none;">Message Client on WhatsApp</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 24px; background-color: #FAF7F2; border-top: 1px solid #E8DDD3; text-align: center; font-size: 11px; color: #7A6B6D; line-height: 1.5;">
              <p style="margin: 0;">BeautyDoor Automated Operations Notification System</p>
              <p style="margin: 4px 0 0 0;">This email was sent to ${ownerEmail} upon customer appointment placement.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    console.log(`[Email:OwnerAlert] Sending new booking alert email to owner (${ownerEmail}) for booking ${bookingId}`);
    const result = await this.dispatchEmail(ownerEmail, subject, html);
    await this.logNotification(bookingId, ownerEmail, 'owner_new_booking_alert', subject, result);
    return result;
  }
}

export const emailService = new EmailService();
