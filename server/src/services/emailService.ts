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
   * Send welcome email to admin-created student with login credentials
   */
  async sendStudentWelcome(data: {
    email: string;
    firstName: string;
    studentId: string;
    tempPassword: string;
    loginUrl: string;
  }): Promise<void> {
    const { email, firstName, studentId, tempPassword, loginUrl } = data;

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
                      <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Welcome to Be Educated</h1>
                      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:0.3px;">IIT-JEE &amp; NEET Foundation</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="background-color:#ffffff;padding:32px;">
                      <p style="margin:0 0 8px;font-size:16px;color:#0a1e3d;">Hi <strong>${firstName}</strong>,</p>
                      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
                        Your student account has been created by the Be Educated administrator. Use the credentials below to sign in to your dashboard.
                      </p>

                      <!-- Credentials card -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                        <tr>
                          <td style="padding:14px 16px;background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                            <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;">Student ID</p>
                            <p style="margin:0;font-size:15px;font-weight:600;color:#0a1e3d;font-family:'Courier New',monospace;">${studentId}</p>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;margin-top:8px;">
                        <tr>
                          <td style="padding:14px 16px;background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                            <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;">Email</p>
                            <p style="margin:0;font-size:15px;font-weight:600;color:#05308d;">${email}</p>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                        <tr>
                          <td style="padding:14px 16px;background-color:#fffbeb;border-radius:10px;border:1px solid #fbbf24;">
                            <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#b45309;">Temporary Password</p>
                            <p style="margin:0;font-size:16px;font-weight:700;color:#0a1e3d;font-family:'Courier New',monospace;">${tempPassword}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Sign in CTA -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                        <tr>
                          <td align="center">
                            <a href="${loginUrl}" style="display:inline-block;background-color:#05308d;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:10px;letter-spacing:0.3px;">
                              Sign In to Dashboard &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Security note -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                        <tr>
                          <td style="padding:14px 16px;background-color:#f1f5f9;border-radius:10px;">
                            <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                              <strong style="color:#0a1e3d;">Security tip:</strong> For your safety, please change your password after signing in for the first time. Never share your credentials with anyone.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
                      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0a1e3d;">Be Educated</p>
                      <p style="margin:0;font-size:11px;color:#94a3b8;">If you did not expect this email, please contact your administrator.</p>
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
        to: email,
        subject: 'Welcome to Be Educated - Your Login Details',
        html,
      });

      console.log(`Student welcome email sent to ${email}`);
    } catch (error) {
      console.error('Error sending student welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  /**
   * Send a fee reminder email to a student
   */
  async sendFeeReminder(data: {
    email: string;
    firstName: string;
    pendingDues: Array<{
      className: string;
      description: string;
      amountDue: number;
      dueDate: string | null;
      daysUntilDue: number | null;
    }>;
    totalDue: number;
    customMessage?: string;
    dashboardUrl: string;
  }): Promise<void> {
    const { email, firstName, pendingDues, totalDue, customMessage, dashboardUrl } = data;

    const formatINR = (n: number) =>
      new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    const formatDate = (iso: string | null) => {
      if (!iso) return '—';
      try {
        return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch {
        return '—';
      }
    };

    const duesRows = pendingDues
      .map(d => {
        const urgency =
          d.daysUntilDue === null
            ? ''
            : d.daysUntilDue < 0
            ? `<span style="color:#dc2626;font-weight:700;">${Math.abs(d.daysUntilDue)} day${Math.abs(d.daysUntilDue) === 1 ? '' : 's'} overdue</span>`
            : d.daysUntilDue === 0
            ? `<span style="color:#d97706;font-weight:700;">Due today</span>`
            : `<span style="color:#64748b;">in ${d.daysUntilDue} day${d.daysUntilDue === 1 ? '' : 's'}</span>`;
        return `
          <tr>
            <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:13px;font-weight:600;color:#0a1e3d;">${d.className}</p>
              <p style="margin:2px 0 0;font-size:12px;color:#64748b;">${d.description}</p>
              <p style="margin:4px 0 0;font-size:11px;">${urgency}</p>
            </td>
            <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;text-align:right;vertical-align:top;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#0a1e3d;">${formatINR(d.amountDue)}</p>
              <p style="margin:2px 0 0;font-size:11px;color:#94a3b8;">due ${formatDate(d.dueDate)}</p>
            </td>
          </tr>
        `;
      })
      .join('');

    const customBlock = customMessage
      ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
          <tr>
            <td style="padding:14px 16px;background-color:#fffbeb;border-left:4px solid #fbbf24;border-radius:6px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#b45309;">Message from Be Educated</p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#334155;white-space:pre-wrap;">${customMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            </td>
          </tr>
        </table>
      `
      : '';

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
                  <tr>
                    <td style="background:linear-gradient(135deg,#0a1e3d 0%,#05308d 100%);border-radius:16px 16px 0 0;padding:36px 32px;text-align:center;">
                      <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Fee Payment Reminder</h1>
                      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">Be Educated — IIT-JEE &amp; NEET Foundation</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#ffffff;padding:32px;">
                      <p style="margin:0 0 8px;font-size:16px;color:#0a1e3d;">Hi <strong>${firstName}</strong>,</p>
                      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155;">
                        This is a friendly reminder that you have pending fee payments on your Be Educated account. Please review the details below and complete your payment at your earliest convenience.
                      </p>

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                        <thead>
                          <tr style="background-color:#f8fafc;">
                            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Description</th>
                            <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${duesRows}
                          <tr>
                            <td style="padding:14px 14px;background-color:#f8fafc;">
                              <p style="margin:0;font-size:13px;font-weight:700;color:#0a1e3d;">Total Pending</p>
                            </td>
                            <td style="padding:14px 14px;background-color:#f8fafc;text-align:right;">
                              <p style="margin:0;font-size:16px;font-weight:800;color:#05308d;">${formatINR(totalDue)}</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      ${customBlock}

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                        <tr>
                          <td align="center">
                            <a href="${dashboardUrl}" style="display:inline-block;background-color:#05308d;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:10px;letter-spacing:0.3px;">
                              Pay Now &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#64748b;text-align:center;">
                        Questions? Contact us or visit your dashboard to see a full breakdown.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
                      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0a1e3d;">Be Educated</p>
                      <p style="margin:0;font-size:11px;color:#94a3b8;">This reminder was sent by your institute's administrator.</p>
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
        to: email,
        subject: `Fee Reminder — ${formatINR(totalDue)} pending`,
        html,
      });
      console.log(`Fee reminder sent to ${email}`);
    } catch (error) {
      console.error('Error sending fee reminder:', error);
      throw new Error('Failed to send fee reminder');
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
