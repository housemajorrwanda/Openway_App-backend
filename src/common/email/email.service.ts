import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendOtp(email: string, otp: string, purpose: 'verify' | 'reset' = 'verify'): Promise<void> {
    const subject =
      purpose === 'verify'
        ? 'OpenWay — Verify your email'
        : 'OpenWay — Password Reset Code';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#1A73E8;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">OpenWay</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Kigali City Navigation</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">
                ${purpose === 'verify' ? 'Verify your email address' : 'Password Reset Code'}
              </h2>
              <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 32px;">
                ${
                  purpose === 'verify'
                    ? 'Welcome to OpenWay! Use the code below to verify your account.'
                    : 'Use the code below to reset your OpenWay password. It expires in 5 minutes.'
                }
              </p>
              <div style="background:#f0f6ff;border:2px dashed #1A73E8;border-radius:10px;padding:24px;text-align:center;margin:0 0 32px;">
                <span style="font-size:42px;font-weight:700;letter-spacing:10px;color:#1A73E8;">${otp}</span>
              </div>
              <p style="color:#888;font-size:13px;text-align:center;margin:0;">
                This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#aaa;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} OpenWay · Kigali, Rwanda<br />
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"OpenWay" <${this.configService.get<string>('EMAIL_FROM')}>`,
        to: email,
        subject,
        html,
      });
      this.logger.log(`OTP email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${email}`, err);
      throw err;
    }
  }
}
