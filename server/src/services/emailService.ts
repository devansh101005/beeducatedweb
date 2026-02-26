// Email Service
// Handles sending emails using Resend

import { Resend } from 'resend';
import { env } from '../config/env.js';

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'parent' | 'teacher';
  message: string;
}

class EmailService {
  private resend: Resend | null = null;

  /**
   * Get Resend client instance (lazy initialization)
   */
  private getResendClient(): Resend {
    if (!this.resend) {
      if (!env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured. Please add it to your .env file.');
      }
      this.resend = new Resend(env.RESEND_API_KEY);
    }
    return this.resend;
  }
  /**
   * Send contact form enquiry email
   */
  async sendContactEnquiry(data: ContactFormData): Promise<void> {
    const { firstName, lastName, email, role, message } = data;

    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#0a1e3d 0%,#05308d 100%);border-radius:16px 16px 0 0;padding:36px 32px;text-align:center;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom:12px;">
                            <div style="width:48px;height:48px;background-color:rgba(251,191,36,0.15);border-radius:12px;display:inline-block;line-height:48px;font-size:22px;">
                              &#9993;
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">New Enquiry Received</h1>
                            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">via BeEducated Contact Form</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="background-color:#ffffff;padding:32px;">

                      <!-- Role badge -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                        <tr>
                          <td>
                            <span style="display:inline-block;background-color:#fbbf24;color:#0a1e3d;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;padding:5px 14px;border-radius:20px;">${roleLabel}</span>
                            <span style="font-size:12px;color:#94a3b8;margin-left:10px;">${timestamp}</span>
                          </td>
                        </tr>
                      </table>

                      <!-- Info cards -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                        <tr>
                          <td style="padding:14px 16px;background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;">
                            <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;">Full Name</p>
                            <p style="margin:0;font-size:15px;font-weight:600;color:#0a1e3d;">${firstName} ${lastName}</p>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                        <tr>
                          <td style="padding:14px 16px;background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                            <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;">Email Address</p>
                            <p style="margin:0;font-size:15px;color:#05308d;font-weight:600;">
                              <a href="mailto:${email}" style="color:#05308d;text-decoration:none;">${email}</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Divider -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                        <tr>
                          <td style="border-top:1px dashed #e2e8f0;">&nbsp;</td>
                        </tr>
                      </table>

                      <!-- Message -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;">Message</p>
                            <div style="padding:18px 20px;background-color:#f8fafc;border-left:3px solid #fbbf24;border-radius:0 10px 10px 0;border:1px solid #e2e8f0;border-left:3px solid #fbbf24;">
                              <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;white-space:pre-wrap;">${message}</p>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Reply CTA -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                        <tr>
                          <td align="center">
                            <a href="mailto:${email}" style="display:inline-block;background-color:#05308d;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:10px;letter-spacing:0.3px;">
                              Reply to ${firstName} &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
                      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0a1e3d;">Be Educated</p>
                      <p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated notification from your website contact form.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    try {
      const resend = this.getResendClient();

      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: env.ENQUIRY_EMAIL,
        subject: `New ${role} enquiry from ${firstName} ${lastName}`,
        html,
        replyTo: email, // Allow direct reply to the enquirer
      });

      console.log(`Contact enquiry email sent to ${env.ENQUIRY_EMAIL}`);
    } catch (error) {
      console.error('Error sending contact enquiry email:', error);
      throw new Error('Failed to send enquiry email');
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfig(): Promise<boolean> {
    try {
      const resend = this.getResendClient();

      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: env.ENQUIRY_EMAIL,
        subject: 'BeEducated - Email Configuration Test',
        html: '<p>This is a test email to verify your email configuration is working correctly.</p>',
      });
      console.log('Test email sent successfully');
      return true;
    } catch (error) {
      console.error('Test email failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
