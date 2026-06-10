import { Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{ filename: string; content: Buffer | string }>;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  return transporter;
}

export async function processEmail(job: Job<EmailPayload>) {
  const { to, subject, html, text, from, cc, bcc, attachments } = job.data;

  logger.info(`Processing email to ${to}: "${subject}"`);

  try {
    const transport = getTransporter();

    const info = await transport.sendMail({
      from: from || config.email.from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      cc,
      bcc,
      attachments,
    });

    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error instanceof Error ? error.message : 'Unknown'}`);
    throw error;
  }
}
