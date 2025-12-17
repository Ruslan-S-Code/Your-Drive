import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  // In development, just log the URL
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Password reset email would be sent to:', email);
    console.log('🔗 Reset URL:', resetUrl);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@yourdrive.com',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error, just log it
  }
}

