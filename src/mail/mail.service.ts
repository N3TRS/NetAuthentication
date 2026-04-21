import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {

  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  async sendPasswordReset(to: string, rawToken: string): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    try {
      await this.mailer.sendMail({
        to,
        subject: 'Recupera tu contraseña',
        html: this.buildHtml(resetUrl),
        text: `Para restablecer tu contraseña abre este enlace (expira en 15 min): ${resetUrl}`,
      });
    } catch (err) {
      this.logger.error(`Error enviando correo de reset a ${to}`, err as Error);
      throw err;
    }
  }

  private buildHtml(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#0a0e14;font-family:'Helvetica Neue',Arial,sans-serif;color:#f2f2f2;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0e14;padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0"
                 style="max-width:560px;background-color:#0d1117;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#240046 0%,#5A189A 100%);padding:32px 40px;">
                <h1 style="margin:0;font-size:24px;color:#FF8B10;letter-spacing:0.5px;">OmniCode</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px 8px 40px;">
                <h2 style="margin:0 0 16px 0;font-size:22px;color:#ffffff;">Recupera tu contraseña</h2>
                <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#c9c9c9;">
                  Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para continuar.
                  Este enlace <strong style="color:#FCA160;">expira en 15 minutos</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 40px 28px 40px;">
                <a href="${resetUrl}"
                   style="display:inline-block;padding:14px 28px;background-color:#FF8B10;color:#0a0e14;
                          text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;
                          box-shadow:0 0 20px rgba(255,139,16,0.35);">
                  Restablecer contraseña
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 28px 40px;">
                <p style="margin:0 0 12px 0;font-size:13px;color:#8a8a8a;">
                  Si tú no hiciste esta solicitud, ignora este correo — tu contraseña no cambiará.
                </p>
                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:20px 0;" />
                <p style="margin:0;font-size:12px;color:#6b6b6b;line-height:1.5;">
                  Si el botón no funciona, copia y pega esta URL en tu navegador:<br/>
                  <span style="color:#FCA160;word-break:break-all;">${resetUrl}</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#0a0e14;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0;font-size:11px;color:#5a5a5a;text-align:center;">
                  &copy; OmniCode — Este es un correo automático, no respondas a este mensaje.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;
  }
}
