import nodemailer from 'nodemailer';

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
  title,
  ticketId,
  status
}: {
  to: string;
  title: string;
  ticketId: number;
  status: 'RESOLVED' | 'REJECTED';
}) => {
  if (!mailTransporter || !smtpUser) {
    throw new Error('SMTP is not configured with a real SMTP_USER and SMTP_PASS.');
  }

  const resolved = status === 'RESOLVED';
  const subject = resolved ? 'Your Support Query Has Been Resolved' : 'Update Regarding Your Support Query';
  const message = resolved
    ? 'We are pleased to inform you that our support team has resolved your query.'
    : 'After review, our support team found that the submitted complaint does not meet the criteria for a genuine support issue.';
  const nextStep = resolved
    ? 'If you need any further assistance, please register a new complaint.'
    : 'If you believe this decision was made in error, please contact support with additional details.';

  await mailTransporter.sendMail({
    from: process.env.SMTP_FROM || smtpUser,
    to,
    subject,
    text: `Hello,\n\n${message}\n\nComplaint: ${title}\nReference: #${ticketId}\n\n${nextStep}\n\nRegards,\nSupportIQ Support Team`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px"><h2 style="color:#0f172a">${subject}</h2><p>Hello,</p><p>${message}</p><p><strong>Complaint:</strong> ${title}<br><strong>Reference:</strong> #${ticketId}</p><p>${nextStep}</p><p>Regards,<br><strong>SupportIQ Support Team</strong></p></div>`
  });
};
