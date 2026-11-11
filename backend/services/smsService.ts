import https from 'https';
import http from 'http';

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
  private sendViaMsg91(phone: string, otp: string): Promise<SmsSendResult> {
    const authKey = process.env.MSG91_AUTH_KEY || '';
    const templateId = process.env.MSG91_TEMPLATE_ID || '';
    const senderId = process.env.MSG91_SENDER_ID || 'BTYDOR';

    const postData = JSON.stringify({
      template_id: templateId,
      short_url: '0',
      recipients: [
        {
          mobiles: `91${phone}`,
          otp: otp,
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
              telemetryMessage: `OTP successfully delivered via MSG91 cellular gateway to +91 ${phone}.`
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
  private sendViaFast2Sms(phone: string, otp: string): Promise<SmsSendResult> {
    const apiKey = process.env.FAST2SMS_API_KEY || '';
    const senderId = process.env.FAST2SMS_SENDER_ID || 'BTYDOR';
    const messageId = process.env.FAST2SMS_MESSAGE_ID || '';

    const postData = JSON.stringify({
      route: 'dlt',
      sender_id: senderId,
      message: messageId,
      variables_values: otp,
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
              telemetryMessage: `OTP successfully delivered via Fast2SMS DLT gateway to +91 ${phone}.`
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
            resolve({
              success: true,
              provider: 'twilio',
              messageId: `tw-${Date.now()}`,
              telemetryMessage: `OTP successfully dispatched via Twilio cellular network to +91 ${phone}.`
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
      console.warn(`[SMS:SECURITY] Blocked cellular OTP dispatch to +91 ${phone.slice(0, 2)}******${phone.slice(-2)}: No live SMS credentials configured.`);
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
      telemetryMessage: `Development OTP generated for local testing on +91 ${phone}.`
    };
  }
}

export const smsService = new SmsService();

