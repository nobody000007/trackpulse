import nodemailer from "nodemailer";

// Gmail SMTP — free, sends to any address, 500 emails/day.
// Setup: Google Account → Security → App Passwords → generate one for "TrackPulse".
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // 16-char App Password, NOT your Gmail password
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM ?? `TrackPulse <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
