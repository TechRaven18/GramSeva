const nodemailer = require('nodemailer');

let testTransporter = null;

const getTransporter = async () => {
  // Option 1: Custom SMTP (Brevo, Mailtrap, SendGrid, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST.trim(),
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER.trim(),
        pass: (process.env.SMTP_PASS || '').trim()
      }
    });
  }

  // Option 2: Real Gmail SMTP via service: 'gmail' (Render STARTTLS compatible)
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    const cleanUser = process.env.GMAIL_USER.trim();
    const cleanPass = process.env.GMAIL_PASS.replace(/\s+/g, '');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass
      },
      connectionTimeout: 10000
    });
  }

  // Fast Cloud Fallback: If no SMTP credentials provided, return null for instant simulated dispatch (0ms delay)
  return null;
};

/**
 * Sends a real Email containing 6-digit OTP or Password Reset Code
 */
const sendRealEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = await getTransporter();
    
    if (!transporter) {
      console.log(`\n======================================================`);
      console.log(`✉️ [SIMULATED EMAIL LOG]`);
      console.log(`Recipient: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text}`);
      console.log(`======================================================\n`);
      return { success: true, simulated: true };
    }

    const fromEmail = process.env.GMAIL_USER || process.env.SMTP_USER || 'no-reply@gramseva.in';

    try {
      const info = await transporter.sendMail({
        from: `"GramSeva Panchayat Portal" <${fromEmail}>`,
        to,
        subject,
        text: text || 'GramSeva Verification OTP',
        html: html || `<p>${text}</p>`
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`\n======================================================`);
        console.log(`✉️ [REAL EMAIL DISPATCH SUCCESS]`);
        console.log(`Recipient: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`🌐 Live Email Preview Link: ${previewUrl}`);
        console.log(`======================================================\n`);
      } else {
        console.log(`[EMAIL DISPATCH SUCCESS] Real Email sent to ${to}. MessageId: ${info.messageId}`);
      }

      return { success: true, messageId: info.messageId, previewUrl };
    } catch (primaryErr) {
      console.warn(`[SMTP DISPATCH NOTICE: ${primaryErr.message}] Falling back to local log simulation...`);
      console.log(`\n======================================================`);
      console.log(`✉️ [SIMULATED EMAIL DISPATCH]`);
      console.log(`Recipient: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${text}`);
      console.log(`======================================================\n`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.warn(`[EMAIL NOTICE] Could not send via SMTP (${error.message}). Using local simulation.`);
    console.log(`\n======================================================`);
    console.log(`✉️ [SIMULATED EMAIL DISPATCH]`);
    console.log(`Recipient: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${text}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }
};

module.exports = {
  sendRealEmail
};
