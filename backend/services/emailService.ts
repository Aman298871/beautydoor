import nodemailer, { Transporter } from 'nodemailer';
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
    this.fromAddress = process.env.EMAIL_FROM || 'BeautyDoor Salon <appointments@beautydoor.in>';

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

    return new Promise((resolve) => {
      const payload = JSON.stringify({
        from: this.fromAddress,
        to: [to],
        subject,
        html
      });

      const options = {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, provider: 'resend', messageId: parsed.id });
            } else {
              resolve({ success: false, provider: 'resend', error: parsed.message || 'Resend API returned error' });
            }
          } catch {
            resolve({ success: false, provider: 'resend', error: 'Failed to parse Resend API response' });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, provider: 'resend', error: err.message });
      });

      req.write(payload);
      req.end();
    });
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
    console.log(`[EmailService:Simulated] To: ${to} | Subject: "${subject}" | Delivered successfully to simulated inbox.`);
    return {
      success: true,
      provider: 'simulated',
      messageId: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    };
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
   * Send Automated Booking Confirmation Email
   */
  public async sendBookingConfirmationEmail(booking: any): Promise<EmailDispatchResult> {
    const email = booking.customer_email || booking.customerEmail;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { success: false, provider: 'simulated', error: 'No valid customer email address provided' };
    }

    const recipient = email.trim();
    const bookingId = booking.id;
    const subject = `Booking Confirmed: BeautyDoor Salon at Home (Ref: ${bookingId})`;

    // Load booking items if not present
    let itemsList = '';
    try {
      const items = (await db.query('SELECT service_name, quantity, price, is_package FROM booking_items WHERE booking_id = ?', [bookingId])) as any[];
      if (items && items.length > 0) {
        itemsList = items.map(item => `
          <tr style="border-bottom: 1px solid #E8DDD3;">
            <td style="padding: 10px 0; color: #1F1A1C; font-weight: 500;">
              ${item.service_name} ${item.is_package ? '<span style="color: #4A0417; font-size: 11px; font-weight: bold; background: #F4EFEA; padding: 2px 6px; border-radius: 4px;">PACKAGE</span>' : ''}
            </td>
            <td style="padding: 10px 0; text-align: center; color: #5C4D4F;">${item.quantity || 1}</td>
            <td style="padding: 10px 0; text-align: right; color: #1F1A1C; font-weight: 600;">₹${item.price}</td>
          </tr>
        `).join('');
      }
    } catch {
      itemsList = `<tr><td colspan="3" style="padding: 10px 0; color: #5C4D4F;">Services as selected at booking.</td></tr>`;
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

          <!-- Confirmation Badge -->
          <tr>
            <td style="padding: 28px 24px 16px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #E6F4EA; color: #137333; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                ✓ APPOINTMENT CONFIRMED
              </div>
              <h2 style="margin: 16px 0 8px 0; font-size: 20px; font-family: 'Playfair Display', Georgia, serif; color: #1F1A1C;">Dear ${booking.customer_name || 'Valued Customer'},</h2>
              <p style="margin: 0; color: #5C4D4F; font-size: 14px; line-height: 1.5;">
                Thank you for choosing BeautyDoor. Your home salon appointment has been reserved. Our certified female professional will arrive promptly at your chosen slot.
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
                    <td style="padding: 6px 0; color: #7A6B6D;">Selected Slot:</td>
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
                    <td style="padding: 10px 0 4px 0; color: #1F1A1C; font-weight: bold; font-size: 15px;">Total Payable:</td>
                    <td style="padding: 10px 0 4px 0; color: #4A0417; font-weight: bold; font-size: 18px;">₹${booking.total_payable}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Services List -->
          ${itemsList ? `
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #4A0417; font-weight: 700;">Booked Treatments</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #E8DDD3; color: #7A6B6D; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                    <th align="left" style="padding-bottom: 6px;">Service</th>
                    <th align="center" style="padding-bottom: 6px;">Qty</th>
                    <th align="right" style="padding-bottom: 6px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>
            </td>
          </tr>
          ` : ''}

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
                Email: <a href="mailto:beautydoor.care@gmail.com" style="color: #4A0417; text-decoration: none;">beautydoor.care@gmail.com</a>
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
   * Send Automated Booking Cancellation Email
   */
  public async sendBookingCancellationEmail(
    booking: any,
    cancellationFee: number = 0,
    refundAmount: number = 0
  ): Promise<EmailDispatchResult> {
    const email = booking.customer_email || booking.customerEmail;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { success: false, provider: 'simulated', error: 'No valid customer email address provided' };
    }

    const recipient = email.trim();
    const bookingId = booking.id;
    const subject = `Booking Cancelled: BeautyDoor Salon at Home (Ref: ${bookingId})`;
    const isFreeCancellation = cancellationFee === 0;

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
                BOOKING CANCELLED
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
                      ${isFreeCancellation ? 'Free Cancellation (2+ hours before slot)' : 'Late Cancellation (under 2 hours)'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Cancellation Fee:</td>
                    <td style="padding: 6px 0; color: ${isFreeCancellation ? '#137333' : '#C5221F'}; font-weight: bold; font-size: 14px;">
                      ${isFreeCancellation ? '₹0 (Waived)' : '₹200'}
                    </td>
                  </tr>
                  ${refundAmount > 0 ? `
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Refund Amount:</td>
                    <td style="padding: 6px 0; color: #137333; font-weight: bold; font-size: 15px;">₹${refundAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #7A6B6D;">Refund Timeline:</td>
                    <td style="padding: 6px 0; color: #5C4D4F;">5–7 business days to original payment method</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </td>
          </tr>

          <!-- Rebooking Invitation -->
          <tr>
            <td style="padding: 0 24px 24px 24px; text-align: center;">
              <p style="margin: 0 0 16px 0; color: #5C4D4F; font-size: 13px;">
                Whenever you are ready to pamper yourself again, our certified professionals are just a tap away.
              </p>
              <a href="https://beautydoor-rclz.onrender.com/services" style="display: inline-block; background-color: #4A0417; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
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
                Email: <a href="mailto:beautydoor.care@gmail.com" style="color: #4A0417; text-decoration: none;">beautydoor.care@gmail.com</a>
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
}

export const emailService = new EmailService();
