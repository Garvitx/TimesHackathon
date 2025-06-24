// utils/mailer.js
import nodemailer from 'nodemailer';
import config from '../config/default.js';

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: Number(config.SMTP_PORT),
  secure: false, // false for port 587
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

export const sendPasswordResetEmail = async ({ toEmail, resetLink }) => {
  const mailOptions = {
    from: `"SnapNews" <${config.SMTP_USER}>`,
    to: toEmail,
    subject: 'Password Reset Request',
    html: `
      <p>Hello,</p>
      <p>You requested a password reset. Click the link below to choose a new password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <br/>
      <p>— Your App Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
