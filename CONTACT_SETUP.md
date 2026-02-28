# Contact Us Page Setup Instructions

## Overview
The Contact Us page has been created with a form that sends emails to **spranav0812@gmail.com** using EmailJS service.

## Setup Steps

### 1. Install EmailJS Library
```bash
cd frontend
npm install @emailjs/browser
```

### 2. Create EmailJS Account
1. Go to [EmailJS](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 3. Configure EmailJS Service

#### Step 1: Add Email Service
1. Go to **Email Services** in your EmailJS dashboard
2. Click **Add New Service**
3. Choose your email provider (Gmail recommended)
4. Connect your Gmail account (spranav0812@gmail.com)
5. Copy the **Service ID** (e.g., `service_abc123`)

#### Step 2: Create Email Template
1. Go to **Email Templates**
2. Click **Create New Template**
3. Use this template structure:

**Template Name:** `contact_form`

**Subject:** `{{subject}} - Contact Form Submission`

**Content:**
```
New message from ContentGenie Contact Form

From: {{from_name}}
Email: {{from_email}}
Issue Type: {{issue_type}}

Subject: {{subject}}

Message:
{{message}}

---
Reply to: {{reply_to}}
```

4. Copy the **Template ID** (e.g., `template_xyz789`)

#### Step 3: Get Public Key
1. Go to **Account** → **General**
2. Copy your **Public Key** (e.g., `abc123xyz789`)

### 4. Update Contact Us Page

Open `frontend/src/pages/ContactUs.jsx` and replace these placeholders:

```javascript
// Line 52: Replace with your Public Key
emailjs.init("YOUR_PUBLIC_KEY")

// Line 62-63: Replace with your Service ID and Template ID
await emailjs.send(
  'YOUR_SERVICE_ID',    // Replace with your Service ID
  'YOUR_TEMPLATE_ID',   // Replace with your Template ID
  templateParams
)
```

**Example:**
```javascript
emailjs.init("abc123xyz789")

await emailjs.send(
  'service_abc123',
  'template_xyz789',
  templateParams
)
```

### 5. Test the Form
1. Start your development server:
   ```bash
   npm run dev
   ```
2. Navigate to `/contact`
3. Fill out the form and submit
4. Check spranav0812@gmail.com for the test email

## Features

### Form Fields
- **Name** (required): User's full name
- **Email** (required): User's email for replies
- **Issue Type** (required): Bug Report, Feature Request, Technical Support, General Feedback, or Other
- **Subject** (required): Brief description
- **Message** (required): Detailed description

### Validation
- All fields are required
- Email format validation
- Character count display
- Real-time form validation

### UI/UX Features
- Animated page load with GSAP
- Particles background animation
- Floating emojis
- Glass morphism design
- Black/white theme for light mode
- Original colors for dark mode
- Loading state during submission
- Success/error messages
- Responsive design

### Contact Information Sidebar
- Email address with mailto link
- Response time information
- Location details
- Support hours
- Quick help links

## Troubleshooting

### Email Not Sending
1. Check EmailJS dashboard for errors
2. Verify Service ID, Template ID, and Public Key are correct
3. Check browser console for error messages
4. Ensure Gmail account is properly connected
5. Check EmailJS monthly quota (free tier: 200 emails/month)

### Form Validation Issues
- Ensure all required fields are filled
- Check email format is valid
- Clear browser cache and try again

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check that theme context is working
- Verify GSAP is installed

## Alternative Email Solutions

If you prefer not to use EmailJS, you can implement:

1. **Backend Email Service** (Recommended for production)
   - Use Nodemailer with your backend
   - More secure and reliable
   - No monthly limits

2. **FormSubmit.co**
   - Simple form-to-email service
   - No registration required
   - Just change form action

3. **Formspree**
   - Easy integration
   - Free tier available
   - Good for simple forms

## Security Notes

- EmailJS Public Key is safe to expose in frontend
- Never expose SMTP credentials in frontend code
- Consider adding reCAPTCHA for spam protection
- Implement rate limiting on backend for production

## Support

For issues with the Contact Us page:
- Check the browser console for errors
- Review EmailJS dashboard for delivery status
- Test with different email addresses
- Contact EmailJS support if needed

---

**Created:** 2024
**Last Updated:** 2024
**Maintained by:** ContentGenie Team
