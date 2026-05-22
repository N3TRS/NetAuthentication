import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from 'src/mail/mail.service';

describe('MailService', () => {
  let service: MailService;
  let mailerService: jest.Mocked<MailerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://frontend.com') },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get(MailerService);
  });

  describe('sendPasswordReset', () => {
    it('debe enviar el correo con el enlace de reset correcto', async () => {
      mailerService.sendMail.mockResolvedValue(undefined as any);

      await service.sendPasswordReset('test@example.com', 'raw-token-abc123');

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Recupera tu contraseña',
          html: expect.stringContaining('http://frontend.com/reset-password?token=raw-token-abc123'),
          text: expect.stringContaining('raw-token-abc123'),
        }),
      );
    });

    it('debe construir el html con el token incluido en la URL', async () => {
      mailerService.sendMail.mockResolvedValue(undefined as any);

      await service.sendPasswordReset('user@example.com', 'mytoken42');

      const callArg = mailerService.sendMail.mock.calls[0][0];
      expect(callArg.html).toContain('mytoken42');
      expect(callArg.html).toContain('http://frontend.com/reset-password?token=mytoken42');
    });

    it('debe propagar el error si el envío de correo falla', async () => {
      const smtpError = new Error('SMTP connection refused');
      mailerService.sendMail.mockRejectedValue(smtpError);

      await expect(
        service.sendPasswordReset('test@example.com', 'token'),
      ).rejects.toThrow('SMTP connection refused');
    });
  });
});
