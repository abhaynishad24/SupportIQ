import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'node:dns';

dotenv.config();
dns.setDefaultResultOrder('ipv4first');//ipv4

const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const smtpPort = Number(process.env.SMTP_PORT || 465);

export const mailTransporter = smtpUser && smtpPass && !smtpUser.startsWith('your_') && !smtpPass.startsWith('your_')
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass }
    })
  : null;

export const sendTicketStatusEmail = async ({
  to,
  recipientName,
  title,
  ticketId,
  status
}: {
  to: string;
  recipientName?: string;
  title: string;
  ticketId: number;
  status: 'RESOLVED' | 'REJECTED';
}) => {
  if (!mailTransporter || !smtpUser) {
    throw new Error('SMTP is not configured with a real SMTP_USER and SMTP_PASS.');
  }

  const resolved = status === 'RESOLVED';
  const subject = resolved ? `Support request #${ticketId} resolved` : `Update on support request #${ticketId}`;
  const greeting = recipientName?.trim() || 'there';
  const safeGreeting = escapeHtml(greeting);
  const safeTitle = escapeHtml(title);
  const message = resolved
    ? 'Our support team has reviewed your request and marked it as resolved.'
    : 'Our support team has reviewed your request and marked it as rejected.';
  const nextStep = resolved
    ? 'If you need any further assistance, please submit a new support request.'
    : 'If you believe this decision needs to be reviewed, please submit a new request with any additional details.';
  const sender = process.env.SMTP_FROM || smtpUser;

  await mailTransporter.sendMail({
    from: process.env.SMTP_FROM || `SupportIQ Support Team <${sender}>`,
    to,
    subject,
    text: `Hello ${greeting},\n\n${message}\n\nRequest: ${title}\nReference: #${ticketId}\nStatus: ${status}\n\n${nextStep}\n\nRegards,\nSupportIQ Support Team`,
    html: `<div style="margin:0;background:#f4f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#24324a"><div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dfe6ef;border-radius:8px;overflow:hidden"><div style="background:#102a43;padding:22px 28px;color:#ffffff"><div style="font-size:20px;font-weight:700;letter-spacing:.2px">Support<span style="color:#63b3ed">IQ</span></div><div style="margin-top:5px;font-size:12px;color:#cbd5e1">Support Team Notification</div></div><div style="padding:30px 28px"><p style="margin:0 0 18px;font-size:15px">Hello ${safeGreeting},</p><h1 style="margin:0 0 14px;font-size:22px;color:#102a43">${resolved ? 'Your support request has been resolved' : 'An update on your support request'}</h1><p style="margin:0 0 24px;font-size:14px;line-height:1.7">${message}</p><div style="background:#f8fafc;border-left:4px solid ${resolved ? '#16a34a' : '#dc2626'};padding:16px 18px;margin-bottom:24px"><p style="margin:0 0 8px;font-size:13px;color:#64748b">REQUEST DETAILS</p><p style="margin:0 0 6px;font-size:14px"><strong>Subject:</strong> ${safeTitle}</p><p style="margin:0 0 6px;font-size:14px"><strong>Reference:</strong> #${ticketId}</p><p style="margin:0;font-size:14px"><strong>Status:</strong> ${status}</p></div><p style="margin:0;font-size:14px;line-height:1.7">${nextStep}</p><p style="margin:26px 0 0;font-size:14px;line-height:1.7">Regards,<br><strong>SupportIQ Support Team</strong></p></div><div style="border-top:1px solid #e2e8f0;padding:16px 28px;font-size:11px;color:#718096">This is an automated notification from the SupportIQ administration team.</div></div></div>`
  });
};

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');
