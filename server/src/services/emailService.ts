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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #2563eb 0%, #14b8a6 100%);
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .info-row {
              margin-bottom: 15px;
              padding: 10px;
              background: white;
              border-radius: 4px;
            }
            .label {
              font-weight: bold;
              color: #2563eb;
              margin-right: 10px;
            }
            .message-box {
              background: white;
              padding: 20px;
              border-left: 4px solid #2563eb;
              border-radius: 4px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Contact Form Enquiry</h1>
              <p>BeEducated LMS Platform</p>
            </div>
            <div class="content">
              <div class="info-row">
                <span class="label">Name:</span>
                <span>${firstName} ${lastName}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span>${email}</span>
              </div>
              <div class="info-row">
                <span class="label">Role:</span>
                <span style="text-transform: capitalize;">${role}</span>
              </div>
              <div class="message-box">
                <p class="label">Message:</p>
                <p>${message}</p>
              </div>
              <div class="footer">
                <p>This email was sent from the BeEducated contact form.</p>
                <p>Received at: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
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
