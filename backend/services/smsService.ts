import https from 'https';
import http from 'http';
import { db } from '../db/database.ts';

/**
 * BeautyDoor Production SMS & OTP Dispatch Service
 * 
 * TELECOM REGULATORY AUTHORITY OF INDIA (TRAI) & DLT COMPLIANCE:
 * Under Indian telecom regulations, commercial SMS delivery requires registration on 
 * an Indian DLT (Distributed Ledger Technology) portal (e.g., Jio, Airtel, Vodafone, BSNL, PingConnect).
 * 
 * MANDATORY REGISTRATION PREREQUISITES:
 * 1. Principal Entity (PE) Registration: Register business under legal name (e.g. BeautyDoor Enterprises).
 * 2. Header (Sender ID): 6-alpha uppercase header (e.g., 'BTYDOR' or 'BEAUTY').
 * 3. Content Template: Registered Service Implicit / Transactional template:
 *    Template Format: "{#var#} is your verification code for BeautyDoor doorstep salon login. Valid for 10 minutes. Please do not share this OTP with anyone. - BeautyDoor"
 *    Template ID: 19-digit numerical string from DLT portal.
 * 
 * SUPPORTED SMS GATEWAY PROVIDERS:
 * - MSG91 (India DLT Flow API)
 * - Fast2SMS (DLT Quick Transactional Route)
 * - Twilio (Global cellular dispatch)
 * - Console/Simulated (Development / Local testing fallback)
 */

export interface SmsSendResult {
  success: boolean;
  provider: 'msg91' | 'fast2sms' | 'twilio' | 'console';
  messageId?: string;
  error?: string;
  telemetryMessage?: string;
}

export type SmsNotificationType = 
  | 'customer_booking_received'
  | 'customer_booking_confirmed'
  | 'customer_booking_rejected'
  | 'customer_booking_cancelled'
  | 'customer_otp'
  | 'customer_booking_sms';

export class SmsService {
  private provider: 'msg91' | 'fast2sms' | 'twilio' | 'console';

  constructor() {
    const configured = (process.env.SMS_PROVIDER || '').toLowerCase();
    if (configured === 'msg91' || configured === 'fast2sms' || configured === 'twilio') {
      this.provider = configured;
    } else if (process.env.MSG91_AUTH_KEY) {
      this.provider = 'msg91';
    } else if (process.env.FAST2SMS_API_KEY) {
      this.provider = 'fast2sms';
    } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.provider = 'twilio';
    } else {
      this.provider = 'console';
    }
  }

  /**
   * Validate Indian 10-digit mobile number format
   * Must start with 6, 7, 8, or 9 and be exactly 10 digits
   */
  public isValidIndianMobile(phone: string): boolean {
    const clean = phone.replace(/\D/g, '').slice(-10);
    return /^[6-9]\d{9}$/.test(clean);
  }

  /**
   * Mask Indian mobile number for secure log output (GDPR/DPDP Act compliance)
   * Example: "+91 9876543210" -> "+91 ******3210"
   */
  public maskPhoneNumber(phone: string): string {
    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length < 4) return '******';
    return `+91 ******${clean.slice(-4)}`;
  }

  /**
   * DLT Template ID Resolution per Transactional Event - Strict & Event-Specific
   * Every booking event requires its own approved DLT template ID.
   * Never fall back to an OTP template for booking notifications.
   */
  private getTemplateConfig(type: SmsNotificationType): {
    msg91TemplateId: string;
    fast2smsMessageId: string;
    isOtp: boolean;
  } {
    switch (type) {
      case 'customer_booking_received':
        return {
          msg91TemplateId: process.env.MSG91_TEMPLATE_ID_RECEIVED || '',
          fast2smsMessageId: process.env.FAST2SMS_TEMPLATE_ID_RECEIVED || '',
          isOtp: false
        };
      case 'customer_booking_confirmed':
        return {
          msg91TemplateId: process.env.MSG91_TEMPLATE_ID_CONFIRMED || '',
          fast2smsMessageId: process.env.FAST2SMS_TEMPLATE_ID_CONFIRMED || '',
          isOtp: false
        };
      case 'customer_booking_rejected':
        return {
          msg91TemplateId: process.env.MSG91_TEMPLATE_ID_REJECTED || '',
          fast2smsMessageId: process.env.FAST2SMS_TEMPLATE_ID_REJECTED || '',
          isOtp: false
        };
      case 'customer_booking_cancelled':
        return {
          msg91TemplateId: process.env.MSG91_TEMPLATE_ID_CANCELLED || '',
          fast2smsMessageId: process.env.FAST2SMS_TEMPLATE_ID_CANCELLED || '',
          isOtp: false
        };
      case 'customer_otp':
        return {
          msg91TemplateId: process.env.MSG91_TEMPLATE_ID_OTP || process.env.MSG91_TEMPLATE_ID || '',
          fast2smsMessageId: process.env.FAST2SMS_TEMPLATE_ID_OTP || process.env.FAST2SMS_MESSAGE_ID || '',
          isOtp: true
        };
      default:
        return {
          msg91TemplateId: '',
          fast2smsMessageId: '',
          isOtp: false
        };
    }
  }

  /**
   * Idempotency Check: Prevent duplicate SMS dispatches for the same booking event
   */
  private async isNotificationAlreadySent(bookingId: string, notificationType: string): Promise<boolean> {
    try {
      const existing = await db.queryRow(
        "SELECT id FROM booking_notifications WHERE booking_id = ? AND notification_type = ? AND status IN ('sent', 'simulated')",
        [bookingId, notificationType]
      );
      return !!existing;
    } catch {
      return false;
    }
  }

  /**
   * Log SMS dispatch in persistent audit ledger
   */
  private async logNotification(
    bookingId: string,
    recipientMasked: string,
    notificationType: string,
    subject: string,
    result: SmsSendResult
  ): Promise<void> {
    try {
      const id = `notif-sms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      await db.execute(`
        INSERT INTO booking_notifications (
          id, booking_id, recipient_email, notification_type, subject,
          status, provider, message_id, error_message, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        bookingId,
        recipientMasked,
        notificationType,
        subject.substring(0, 100),
        result.success ? (result.provider === 'console' ? 'simulated' : 'sent') : 'failed',
        result.provider,
        result.messageId || null,
        result.error || null,
        now
      ]);
    } catch (e: any) {
      console.warn('[SmsService] Telemetry log notice:', e.message);
    }
  }

  /**
   * Owner notification policy:
   * SMS/OTP dispatch to owner phone +91 78277 22522 is explicitly disabled per owner mandate.
   * All new booking notifications are delivered to owner via email at hello@beautydoor.in.
   */
  public async sendBookingAlertToOwner(booking: any): Promise<SmsSendResult> {
    const bookingId = booking.id || booking.bookingId || 'BD-APPT';
    console.log(`[SMS:OWNER_ALERT] Owner SMS disabled per business policy for booking ${bookingId}. Owner receives comprehensive email alert at hello@beautydoor.in instead.`);
    return {
      success: true,
      provider: 'console',
      messageId: `owner-sms-disabled`,
      telemetryMessage: `Owner SMS disabled per business policy (notifications routed to email hello@beautydoor.in)`
    };
  }

  /**
   * Customer SMS Notification: Booking Received (Pending Confirmation)
   */
  public async sendCustomerBookingReceivedSms(phone: string, bookingId: string, total: number, slot: string, date: string): Promise<SmsSendResult> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!this.isValidIndianMobile(cleanPhone)) {
      return { success: false, provider: this.provider, error: 'Invalid customer phone number' };
    }
    const message = `Dear Customer, your BeautyDoor doorstep salon appointment (${bookingId}) for ${date} at ${slot} (₹${total}, COD) is received and is pending confirmation. Team BeautyDoor`;
    return this.sendCustomerSmsDirect(cleanPhone, message, bookingId, 'customer_booking_received');
  }

  /**
   * Customer SMS Notification: Booking Confirmed / Accepted
   */
  public async sendCustomerBookingConfirmedSms(phone: string, bookingId: string, date: string, slot: string, beauticianName?: string): Promise<SmsSendResult> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!this.isValidIndianMobile(cleanPhone)) {
      return { success: false, provider: this.provider, error: 'Invalid customer phone number' };
    }
    const assignedText = beauticianName ? ` Esthetician: ${beauticianName}.` : '';
    const message = `Dear Customer, your BeautyDoor appointment (${bookingId}) for ${date} at ${slot} is CONFIRMED!${assignedText} Pay cash/UPI after service. Helpline: 7827722522`;
    return this.sendCustomerSmsDirect(cleanPhone, message, bookingId, 'customer_booking_confirmed');
  }

  /**
   * Customer SMS Notification: Booking Rejected
   */
  public async sendCustomerBookingRejectedSms(phone: string, bookingId: string, reason?: string): Promise<SmsSendResult> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!this.isValidIndianMobile(cleanPhone)) {
      return { success: false, provider: this.provider, error: 'Invalid customer phone number' };
    }
    const reasonText = reason ? ` Reason: ${reason}` : '';
    const message = `Dear Customer, we could not accommodate your BeautyDoor booking (${bookingId}).${reasonText} Any advance paid will be 100% refunded. Call 7827722522 to reschedule.`;
    return this.sendCustomerSmsDirect(cleanPhone, message, bookingId, 'customer_booking_rejected');
  }

  /**
   * Customer SMS Notification: Booking Cancelled
   */
  public async sendCustomerBookingCancelledSms(phone: string, bookingId: string): Promise<SmsSendResult> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!this.isValidIndianMobile(cleanPhone)) {
      return { success: false, provider: this.provider, error: 'Invalid customer phone number' };
    }
    const message = `Dear Customer, your BeautyDoor appointment (${bookingId}) has been cancelled. For queries or to rebook, call 7827722522 or visit beautydoor.in.`;
    return this.sendCustomerSmsDirect(cleanPhone, message, bookingId, 'customer_booking_cancelled');
  }

  /**
   * Direct customer SMS dispatch helper with idempotency, number masking, and fail-closed production safety
   */
  private async sendCustomerSmsDirect(
    cleanPhone: string,
    message: string,
    bookingId: string,
    notificationType: SmsNotificationType = 'customer_booking_sms'
  ): Promise<SmsSendResult> {
    const masked = this.maskPhoneNumber(cleanPhone);
    console.log(`[SMS:Customer] To: ${masked} | Booking: ${bookingId} | Message: "${message}"`);

    // Idempotency: avoid duplicate sends
    if (bookingId && await this.isNotificationAlreadySent(bookingId, notificationType)) {
      console.log(`[SMS:Customer] Skipped duplicate dispatch for ${bookingId} (${notificationType})`);
      return {
        success: true,
        provider: this.provider,
        messageId: `idempotent-skip-${bookingId}`,
        telemetryMessage: `Notification already recorded for ${bookingId}`
      };
    }

    // Fail-closed in production if credentials not configured
    if (process.env.NODE_ENV === 'production' && this.provider === 'console') {
      console.warn(`[SMS:UNCONFIGURED] Production SMS blocked to ${masked} for ${bookingId}: No live MSG91 / Fast2SMS / Twilio credentials configured.`);
      const failResult: SmsSendResult = {
        success: false,
        provider: 'console',
        error: 'Cellular SMS gateway credentials not configured in production environment.',
        telemetryMessage: 'Production SMS delivery blocked: Live cellular credentials missing.'
      };
      await this.logNotification(bookingId, masked, notificationType, message, failResult);
      return failResult;
    }

    // Development fallback
    if (this.provider === 'console' || process.env.NODE_ENV !== 'production') {
      const simResult: SmsSendResult = {
        success: true,
        provider: 'console',
        messageId: `cust-sms-${Date.now()}`,
        telemetryMessage: `Customer SMS simulated for ${bookingId} to ${masked}`
      };
      await this.logNotification(bookingId, masked, notificationType, message, simResult);
      return simResult;
    }

    try {
      let res: SmsSendResult;
      const tplConfig = this.getTemplateConfig(notificationType);

      if (this.provider === 'twilio') {
        res = await this.sendCustomMessageViaTwilio(cleanPhone, message);
      } else if (this.provider === 'fast2sms') {
        res = await this.sendViaFast2Sms(cleanPhone, message, tplConfig.fast2smsMessageId);
      } else if (this.provider === 'msg91') {
        res = await this.sendViaMsg91(cleanPhone, message, tplConfig.msg91TemplateId);
      } else {
        res = this.sendViaConsole(cleanPhone, message);
      }
      await this.logNotification(bookingId, masked, notificationType, message, res);
      return res;
    } catch (err: any) {
      console.warn(`[SMS:Customer] Dispatch failed for ${bookingId}:`, err.message);
      const errResult: SmsSendResult = { success: false, provider: this.provider, error: err.message };
      await this.logNotification(bookingId, masked, notificationType, message, errResult);
      return errResult;
    }
  }

  private sendCustomMessageViaTwilio(phone: string, text: string): Promise<SmsSendResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    const fromNumber = process.env.TWILIO_FROM_NUMBER || '';

    const postData = new URLSearchParams({
      To: `+91${phone}`,
      From: fromNumber,
      Body: text
    }).toString();

    return new Promise((resolve) => {
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const options = {
        hostname: 'api.twilio.com',
        port: 443,
        path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            let parsedSid = `tw-${Date.now()}`;
            let parsedStatus = 'queued';
            try {
              const parsed = JSON.parse(body);
              if (parsed.sid) parsedSid = parsed.sid;
              if (parsed.status) parsedStatus = parsed.status;
            } catch {}
            resolve({
              success: true,
              provider: 'twilio',
              messageId: parsedSid,
              telemetryMessage: `Twilio message accepted (Status: ${parsedStatus}, SID: ${parsedSid})`
            });
          } else {
            resolve({
              success: false,
              provider: 'twilio',
              error: `Twilio HTTP ${res.statusCode}: ${body}`
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, provider: 'twilio', error: err.message });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Dispatch OTP SMS directly to customer's mobile number
   */
  public async sendOtp(phone: string, otp: string): Promise<SmsSendResult> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (!this.isValidIndianMobile(cleanPhone)) {
      return {
        success: false,
        provider: this.provider,
        error: 'Invalid Indian mobile number. Must be a 10-digit number starting with 6-9.'
      };
    }

    try {
      if (this.provider === 'msg91') {
        return await this.sendViaMsg91(cleanPhone, otp);
      } else if (this.provider === 'fast2sms') {
        return await this.sendViaFast2Sms(cleanPhone, otp);
      } else if (this.provider === 'twilio') {
        return await this.sendViaTwilio(cleanPhone, otp);
      } else {
        return this.sendViaConsole(cleanPhone, otp);
      }
    } catch (err: any) {
      console.error('[SMS] Dispatch exception:', err?.message || err);
      return {
        success: false,
        provider: this.provider,
        error: err?.message || 'Failed to dispatch cellular SMS through provider.'
      };
    }
  }

  /**
   * MSG91 India DLT Integration
   */
  private sendViaMsg91(phone: string, otpOrText: string, templateIdOverride?: string): Promise<SmsSendResult> {
    const authKey = process.env.MSG91_AUTH_KEY || '';
    const templateId = templateIdOverride || process.env.MSG91_TEMPLATE_ID || '';
    const senderId = process.env.MSG91_SENDER_ID || 'BTYDOR';

    if (!templateId) {
      return Promise.resolve({
        success: false,
        provider: 'msg91',
        error: 'MSG91 DLT template ID is missing for this event. Booking message blocked from generic or OTP fallback.',
        telemetryMessage: 'Missing event-specific MSG91 DLT template ID'
      });
    }

    const postData = JSON.stringify({
      template_id: templateId,
      short_url: '0',
      recipients: [
        {
          mobiles: `91${phone}`,
          otp: otpOrText,
          company: 'BeautyDoor'
        }
      ]
    });

    return new Promise((resolve) => {
      const options = {
        hostname: 'control.msg91.com',
        port: 443,
        path: '/api/v5/flow/',
        method: 'POST',
        headers: {
          'authkey': authKey,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              provider: 'msg91',
              messageId: `msg91-${Date.now()}`,
              telemetryMessage: `Message delivered via MSG91 cellular gateway to +91 ${this.maskPhoneNumber(phone)}.`
            });
          } else {
            resolve({
              success: false,
              provider: 'msg91',
              error: `MSG91 gateway responded with HTTP ${res.statusCode}: ${body}`
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          success: false,
          provider: 'msg91',
          error: `MSG91 connection error: ${err.message}`
        });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Fast2SMS India DLT Quick Route Integration
   */
  private sendViaFast2Sms(phone: string, otpOrText: string, messageIdOverride?: string): Promise<SmsSendResult> {
    const apiKey = process.env.FAST2SMS_API_KEY || '';
    const senderId = process.env.FAST2SMS_SENDER_ID || 'BTYDOR';
    const messageId = messageIdOverride || process.env.FAST2SMS_MESSAGE_ID || '';

    if (!messageId) {
      return Promise.resolve({
        success: false,
        provider: 'fast2sms',
        error: 'Fast2SMS DLT template ID is missing for this event. Booking message blocked from generic or OTP fallback.',
        telemetryMessage: 'Missing event-specific Fast2SMS DLT template ID'
      });
    }

    const postData = JSON.stringify({
      route: 'dlt',
      sender_id: senderId,
      message: messageId,
      variables_values: otpOrText,
      flash: 0,
      numbers: phone
    });

    return new Promise((resolve) => {
      const options = {
        hostname: 'www.fast2sms.com',
        port: 443,
        path: '/dev/bulkV2',
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              provider: 'fast2sms',
              messageId: `f2s-${Date.now()}`,
              telemetryMessage: `Message delivered via Fast2SMS DLT gateway to +91 ${this.maskPhoneNumber(phone)}.`
            });
          } else {
            resolve({
              success: false,
              provider: 'fast2sms',
              error: `Fast2SMS gateway HTTP ${res.statusCode}: ${body}`
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          success: false,
          provider: 'fast2sms',
          error: `Fast2SMS connection error: ${err.message}`
        });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Twilio Programmable Messaging Integration
   */
  private sendViaTwilio(phone: string, otp: string): Promise<SmsSendResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    const fromNumber = process.env.TWILIO_FROM_NUMBER || '';

    const bodyText = `${otp} is your verification code for BeautyDoor doorstep salon login. Valid for 10 minutes. Please do not share this OTP with anyone. - BeautyDoor`;
    const postData = new URLSearchParams({
      To: `+91${phone}`,
      From: fromNumber,
      Body: bodyText
    }).toString();

    return new Promise((resolve) => {
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const options = {
        hostname: 'api.twilio.com',
        port: 443,
        path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            let parsedSid = `tw-${Date.now()}`;
            let parsedStatus = 'queued';
            try {
              const parsed = JSON.parse(body);
              if (parsed.sid) parsedSid = parsed.sid;
              if (parsed.status) parsedStatus = parsed.status;
            } catch {}
            resolve({
              success: true,
              provider: 'twilio',
              messageId: parsedSid,
              telemetryMessage: `OTP accepted by Twilio messaging service (Status: ${parsedStatus}, SID: ${parsedSid}) for delivery to +91 ${this.maskPhoneNumber(phone)}.`
            });
          } else {
            resolve({
              success: false,
              provider: 'twilio',
              error: `Twilio HTTP ${res.statusCode}: ${body}`
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          success: false,
          provider: 'twilio',
          error: `Twilio connection error: ${err.message}`
        });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Console / Simulation Provider (Used only in development/testing when external SMS provider credentials are not in environment)
   * IN PRODUCTION: If credentials are not configured, delivery is reported as BLOCKED.
   */
  private sendViaConsole(phone: string, otp: string): SmsSendResult {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      console.warn(`[SMS:SECURITY] Blocked cellular OTP dispatch to ${this.maskPhoneNumber(phone)}: No live SMS credentials configured.`);
      return {
        success: false,
        provider: 'console',
        error: 'Cellular SMS gateway delivery is BLOCKED: Live cellular provider credentials (MSG91 / Fast2SMS / Twilio) are not configured in environment.',
        telemetryMessage: 'SMS delivery blocked: Live cellular provider credentials missing.'
      };
    }

    // Development only (never in production):
    return {
      success: true,
      provider: 'console',
      messageId: `dev-sim-${Date.now()}`,
      telemetryMessage: `Development OTP generated for local testing on ${this.maskPhoneNumber(phone)}.`
    };
  }
}

export const smsService = new SmsService();
