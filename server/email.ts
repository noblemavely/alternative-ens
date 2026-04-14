import { ENV } from './_core/env';

let transporter: any = null;

async function getTransporter(): Promise<any> {
  if (!transporter) {
    try {
      // Dynamically import nodemailer only when needed (lazy loading)
      const { default: nodemailer } = await import('nodemailer');

      const host = (ENV as any).smtpHost;
      const port = parseInt((ENV as any).smtpPort, 10);
      const user = (ENV as any).smtpUser;
      const password = (ENV as any).smtpPassword;

      if (!host || !user || !password || isNaN(port)) {
        throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD environment variables.');
      }

      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass: password,
        },
      });

      console.log(`[Email Service] SMTP configured for ${host}:${port}`);
    } catch (error) {
      console.error('[Email Service] Failed to initialize transporter:', error);
      throw error;
    }
  }

  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    const transporter = await getTransporter();
    const fromEmail = (ENV as any).smtpFromEmail;
    const fromName = (ENV as any).smtpFromName;

    const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    console.log(`[Email Service] Sending email to ${options.to} with subject: ${options.subject}`);

    const result = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`[Email Service] Email sent successfully to ${options.to}`, result.messageId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Email Service] Failed to send email to ${options.to}:`, errorMessage);
    throw new Error(`Failed to send email: ${errorMessage}`);
  }
}

export function getVerificationEmailContent(
  verificationUrl: string,
  verificationCode: string,
  fullToken?: string
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .header {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .code-box {
            background-color: #f0f0f0;
            padding: 20px;
            text-align: center;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 48px;
            font-weight: bold;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            color: #2563eb;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Alternatives</h1>
            <p>Email Verification</p>
          </div>

          <p>Thank you for registering with Alternatives! To complete your registration, please verify your email address.</p>

          <p>Click the button below to verify your email:</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </div>

          <p>Or enter this code on the verification page:</p>
          <div class="code-box">${verificationCode}</div>

          <p>This code will expire in 24 hours.</p>

          <p>If you did not create this account, please ignore this email.</p>

          <div class="footer">
            <p>&copy; 2024 Alternatives. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to Alternatives!

Thank you for registering. To complete your registration, please verify your email address.

Your verification code is: ${verificationCode}

Or visit this link to verify: ${verificationUrl}

This code will expire in 24 hours.

If you did not create this account, please ignore this email.

© 2024 Alternatives. All rights reserved.
  `;

  return { html, text };
}
