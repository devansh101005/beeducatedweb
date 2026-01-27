// Contact Routes - /api/v2/contact
// Handles contact form submissions

import { Router, Request, Response } from 'express';
import { emailService, ContactFormData } from '../../services/emailService.js';
import { sendSuccess, sendBadRequest, sendError } from '../../shared/utils/response.js';

const router = Router();

/**
 * POST /api/v2/contact
 * Submit contact form enquiry
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, role, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !role || !message) {
      return sendBadRequest(res, 'All fields are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendBadRequest(res, 'Invalid email address');
    }

    // Validate role
    const validRoles = ['student', 'parent', 'teacher'];
    if (!validRoles.includes(role)) {
      return sendBadRequest(res, 'Invalid role. Must be student, parent, or teacher');
    }

    // Validate message length
    if (message.length < 10) {
      return sendBadRequest(res, 'Message must be at least 10 characters long');
    }

    if (message.length > 1000) {
      return sendBadRequest(res, 'Message must be less than 1000 characters');
    }

    // Send email
    const contactData: ContactFormData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      role,
      message: message.trim(),
    };

    await emailService.sendContactEnquiry(contactData);

    sendSuccess(res, {
      message: 'Thank you for your enquiry! We will get back to you within 24 hours.',
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    sendError(res, 'Failed to send your message. Please try again later.');
  }
});

/**
 * GET /api/v2/contact/test (DEV ONLY)
 * Test email configuration
 */
router.get('/test', async (_req: Request, res: Response) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Test endpoint not available in production',
      });
    }

    const success = await emailService.testEmailConfig();

    if (success) {
      sendSuccess(res, {
        message: 'Test email sent successfully! Check your inbox.',
      });
    } else {
      sendError(res, 'Failed to send test email. Check your configuration.');
    }
  } catch (error) {
    console.error('Error testing email:', error);
    sendError(res, 'Failed to test email configuration');
  }
});

export default router;
