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

    const isVerify = purpose === 'verify';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isVerify ? 'Verify your email' : 'Reset your password'} — OpenWay</title>
</head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo bar above card -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#103060;border-radius:12px;padding:10px 22px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">OPENWAY</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 40px rgba(16,48,96,0.10);">

              <!-- Hero banner -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#103060 0%,#1a4a8a 100%);padding:48px 48px 40px;text-align:center;">
                    <!-- Icon circle -->
                    <div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;margin-bottom:20px;">
                      <span style="font-size:28px;">${isVerify ? '✉️' : '🔐'}</span>
                    </div>
                    <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.3px;">
                      ${isVerify ? 'Verify your email' : 'Reset your password'}
                    </h1>
                    <p style="color:rgba(255,255,255,0.65);margin:10px 0 0;font-size:14px;line-height:1.5;">
                      ${isVerify ? 'One step away from navigating Kigali smarter.' : 'Secure your OpenWay account.'}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Body content -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:44px 48px 40px;">

                    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 32px;">
                      ${isVerify
                        ? 'Hi there! Thanks for joining <strong style="color:#103060;">OpenWay</strong>. Use the code below to verify your email address and activate your account.'
                        : 'We received a request to reset your <strong style="color:#103060;">OpenWay</strong> password. Use the code below to proceed. If you didn\'t request this, no action is needed.'
                      }
                    </p>

                    <!-- OTP Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      <tr>
                        <td style="background:#f5f8ff;border:1.5px solid #d0dff5;border-radius:16px;padding:32px 24px;text-align:center;">
                          <p style="color:#6b7280;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;">
                            ${isVerify ? 'Verification Code' : 'Reset Code'}
                          </p>
                          <!-- Individual digit boxes -->
                          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                            <tr>
                              ${otp.split('').map(digit => `
                              <td style="padding:0 4px;">
                                <div style="background:#103060;color:#ffffff;width:44px;height:52px;line-height:52px;border-radius:10px;font-size:26px;font-weight:700;text-align:center;display:inline-block;">${digit}</div>
                              </td>`).join('')}
                            </tr>
                          </table>
                          <p style="color:#9ca3af;font-size:12px;margin:0;">
                            Expires in <strong style="color:#103060;">5 minutes</strong>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Warning notice -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#fff8f0;border:1px solid #fed7aa;border-radius:10px;padding:14px 18px;">
                          <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
                            <strong>Never share this code.</strong> OpenWay staff will never ask for your verification code.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 48px;">
                    <div style="border-top:1px solid #e5e7eb;"></div>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 48px 32px;text-align:center;">
                    <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;line-height:1.6;">
                      © ${new Date().getFullYear()} <strong style="color:#103060;">OpenWay</strong> · Kigali, Rwanda
                    </p>
                    <p style="color:#d1d5db;font-size:11px;margin:0;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Bottom tagline -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="color:#9ca3af;font-size:12px;margin:0;letter-spacing:0.3px;">Navigate Kigali smarter with OpenWay</p>
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
