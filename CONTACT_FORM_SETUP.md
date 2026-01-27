# Contact Form Email Setup Guide

## Overview

The contact form has been successfully implemented with the following features:
- ✅ Role selection dropdown (Student, Parent, Teacher)
- ✅ Form validation for all fields
- ✅ Success/Error message display
- ✅ Email sending functionality using Resend
- ✅ Professional HTML email template
- ✅ Reply-to functionality (so you can reply directly to enquirers)

## Setup Instructions

### Step 1: Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (Free tier includes 100 emails/day, 3,000/month)
3. Verify your email address

### Step 2: Get Your API Key

1. After logging in, go to **API Keys** in the dashboard
2. Click **Create API Key**
3. Give it a name like "BeEducated Production"
4. Copy the API key (starts with `re_`)

### Step 3: Add Domain (Optional but Recommended)

For production, you should verify your domain:

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `beeducated.com`)
4. Add the DNS records shown by Resend to your domain provider
5. Wait for verification (usually takes a few minutes)

**For Development/Testing:**
- You can use `onboarding@resend.dev` as the FROM email
- This works without domain verification but has limitations

### Step 4: Configure Environment Variables

Add these variables to `server/.env`:

```env
# Email Configuration (Resend)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
ENQUIRY_EMAIL=Officialbe.educated@gmail.com
```

**Configuration Details:**

- `RESEND_API_KEY`: Your Resend API key from Step 2
- `RESEND_FROM_EMAIL`: The email address that appears as sender
  - For development: use `onboarding@resend.dev`
  - For production: use `noreply@yourdomain.com` (after domain verification)
- `ENQUIRY_EMAIL`: Where you want to receive enquiries (default: `Officialbe.educated@gmail.com`)

### Step 5: Restart Your Server

```bash
cd server
npm run dev
```

### Step 6: Test the Setup

#### Option 1: Use the Test Endpoint (Development Only)

```bash
curl http://localhost:5000/api/v2/contact/test
```

This will send a test email to your `ENQUIRY_EMAIL`.

#### Option 2: Use the Contact Form

1. Go to `http://localhost:5173/contact`
2. Fill out the form:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Role: Student
   - Message: Test enquiry message
3. Click **Send Message**
4. Check your `ENQUIRY_EMAIL` inbox

## Email Template Features

The enquiry emails include:

- **Professional design** with gradient header
- **Contact details**: Name, Email, Role
- **Message content**: Full message in a highlighted box
- **Timestamp**: When the enquiry was received
- **Reply-to functionality**: Click reply and it goes directly to the enquirer's email

## API Endpoint

**POST** `/api/v2/contact`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "student",
  "message": "I would like to enquire about your courses"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "message": "Thank you for your enquiry! We will get back to you within 24 hours."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Validation Rules

- ✅ All fields are required
- ✅ Email must be valid format
- ✅ Role must be: student, parent, or teacher
- ✅ Message must be 10-1000 characters
- ✅ Names and email are trimmed and sanitized

## Troubleshooting

### "Missing API key" Error

**Problem:** Server fails to start with Resend API key error

**Solution:** Make sure `RESEND_API_KEY` is set in `server/.env`

### "Failed to send email" Error

**Problem:** Form submission fails

**Possible causes:**
1. Invalid API key
2. From email not verified (if not using `onboarding@resend.dev`)
3. Resend API rate limit exceeded
4. Network connection issues

**Solution:**
1. Check your API key is correct
2. Use `onboarding@resend.dev` for testing
3. Check Resend dashboard for errors
4. Check server logs for detailed error messages

### Email Not Received

**Problem:** Form shows success but no email arrives

**Possible causes:**
1. Email in spam folder
2. Wrong `ENQUIRY_EMAIL` configured
3. Resend account not verified

**Solution:**
1. Check spam/junk folder
2. Verify `ENQUIRY_EMAIL` in `.env`
3. Check Resend dashboard → Emails to see delivery status

## Production Deployment

Before going to production:

1. ✅ Verify your domain in Resend
2. ✅ Update `RESEND_FROM_EMAIL` to use your domain
3. ✅ Set correct `ENQUIRY_EMAIL` where you want enquiries
4. ✅ Consider upgrading Resend plan if you expect high volume
5. ✅ Test the contact form thoroughly
6. ✅ Monitor Resend dashboard for delivery issues

## Pricing

**Resend Pricing:**
- Free: 100 emails/day, 3,000/month
- Pro: $20/month - 50,000 emails/month
- Scale: Custom pricing for higher volumes

For a typical educational institute with moderate enquiries, the free tier should be sufficient. Monitor your usage in the Resend dashboard.

## Alternative Email Providers

If you prefer a different email service, you can modify `server/src/services/emailService.ts` to use:

- **SendGrid**: Popular choice, generous free tier
- **Mailgun**: Good for transactional emails
- **AWS SES**: Cheap if you're on AWS
- **Nodemailer + SMTP**: Use your Gmail/Office365 (not recommended for production)

## Support

For issues:
1. Check server logs: `cd server && npm run dev`
2. Check Resend dashboard for email delivery status
3. Use the test endpoint: `curl http://localhost:5000/api/v2/contact/test`
4. Review this guide for common issues

## Files Modified

- `client/src/pages/Contact.jsx` - Contact form with role field
- `server/src/services/emailService.ts` - Email sending service
- `server/src/modules/contact/contact.routes.ts` - Contact API endpoint
- `server/src/config/env.ts` - Environment configuration
- `server/src/server.ts` - Route registration

---

**Setup is complete!** Just add your Resend API key to `.env` and start receiving enquiries. 🚀
